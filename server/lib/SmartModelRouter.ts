/**
 * SMART MODEL ROUTER
 * 
 * Intelligent model routing for cost optimization:
 * 1. Tiered routing - cheap models for routine, Claude for complex
 * 2. Caching - skip unchanged analysis
 * 3. Event-driven - analyze on change, not timer
 * 4. Summarization - compact agent communication
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import crypto from 'crypto';

// Model tiers for different task complexity
// DESIGN: Only 2 tiers - cheap for routine, Claude for complex only
export enum ModelTier {
  CHEAP = 'cheap',      // Routine monitoring via OpenRouter (Llama, GPT-4o-mini, Mixtral)
  PREMIUM = 'premium',   // Complex reasoning, critical decisions (Claude only)
}

// Cost per 1M tokens (input/output average)
const MODEL_COSTS: Record<string, number> = {
  'meta-llama/llama-3.2-3b-instruct': 0.06,
  'meta-llama/llama-3.1-8b-instruct': 0.10,
  'mistralai/mixtral-8x7b-instruct': 0.27,
  'anthropic/claude-3-haiku': 0.25,
  'anthropic/claude-3.5-sonnet': 3.00,
  'anthropic/claude-sonnet-4': 3.00,
  'openai/gpt-4o-mini': 0.15,
  'openai/gpt-4o': 5.00,
};

// Tier to model mapping
// CHEAP: OpenRouter models ($0.10-0.50/1M tokens)
// PREMIUM: Claude only for complex decisions ($3-15/1M tokens)
const TIER_MODELS: Record<ModelTier, string[]> = {
  [ModelTier.CHEAP]: [
    'meta-llama/llama-3.1-8b-instruct',
    'openai/gpt-4o-mini',
    'mistralai/mixtral-8x7b-instruct',
  ],
  [ModelTier.PREMIUM]: [
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-sonnet-4',
  ],
};

// Task complexity classification
interface TaskClassification {
  tier: ModelTier;
  reason: string;
  skipAnalysis: boolean;
  cachedResult?: string;
}

// Analysis cache entry
interface CacheEntry {
  hash: string;
  result: string;
  timestamp: number;
  tier: ModelTier;
}

// Project change event
export interface ProjectChangeEvent {
  projectId: string;
  changeType: 'budget' | 'schedule' | 'risk' | 'status' | 'resource' | 'milestone';
  severity: 'low' | 'medium' | 'high' | 'critical';
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
}

export class SmartModelRouter {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 30 * 60 * 1000; // 30 minutes default
  private pendingChanges: Map<string, ProjectChangeEvent[]> = new Map();
  private openRouterKey: string | undefined;
  private anthropicKey: string | undefined;
  private summaryStore: Map<string, string> = new Map();

  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (this.openRouterKey) {
      console.log('[SmartModelRouter] OpenRouter available - cost optimization enabled');
    } else {
      console.log('[SmartModelRouter] OpenRouter not configured - using Anthropic only');
    }
  }

  /**
   * Get the appropriate model for a task based on complexity
   * ALL tiers now route through OpenRouter when available (including Claude)
   * OpenRouter tracking: You'll see all requests in your OpenRouter dashboard
   */
  getModel(tier: ModelTier, metadata?: Record<string, any>): BaseChatModel {
    // Route ALL tiers through OpenRouter when available (including premium Claude)
    if (this.openRouterKey) {
      const modelName = TIER_MODELS[tier][0];
      console.log(`[SmartModelRouter] Using OpenRouter: ${modelName} (${tier} tier)`);
      
      // Add tracking headers for OpenRouter dashboard visibility
      const trackingMetadata = {
        ...metadata,
        'HTTP-Referer': 'https://kyndryl365.ai',
        'X-Title': 'Kyndryl 365 AI - Agent Orchestration',
      };
      
      return new ChatOpenAI({
        modelName,
        temperature: tier === ModelTier.CHEAP ? 0.3 : 0.7,
        openAIApiKey: this.openRouterKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://kyndryl365.ai',
            'X-Title': 'Kyndryl 365 AI',
          },
        },
        modelKwargs: trackingMetadata,
      });
    }

    // Fallback to direct Anthropic ONLY if OpenRouter not configured
    console.log(`[SmartModelRouter] Fallback to direct Anthropic Claude (${tier} tier)`);
    return new ChatAnthropic({
      modelName: 'claude-sonnet-4-5-20250929',
      temperature: tier === ModelTier.CHEAP ? 0.3 : 0.7,
      anthropicApiKey: this.anthropicKey,
      metadata,
    });
  }

  /**
   * Classify task complexity to determine model tier
   */
  classifyTask(
    taskType: string,
    projectData: any,
    agentType: string
  ): TaskClassification {
    // Check cache first
    const cacheKey = this.generateCacheKey(taskType, projectData, agentType);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[SmartModelRouter] Cache hit for ${agentType}:${taskType}`);
      return {
        tier: cached.tier,
        reason: 'Cached result available',
        skipAnalysis: true,
        cachedResult: cached.result,
      };
    }

    // Check if there are pending changes that require analysis
    const changes = this.pendingChanges.get(projectData?.id);
    if (!changes || changes.length === 0) {
      // No changes detected - use cheap model for quick check
      return {
        tier: ModelTier.CHEAP,
        reason: 'No changes detected - routine check',
        skipAnalysis: false,
      };
    }

    // Determine tier based on change severity
    const hasCritical = changes.some(c => c.severity === 'critical');
    const hasHigh = changes.some(c => c.severity === 'high');
    
    // PREMIUM tier: Only for critical changes (Claude)
    if (hasCritical) {
      return {
        tier: ModelTier.PREMIUM,
        reason: `Critical changes detected: ${changes.filter(c => c.severity === 'critical').map(c => c.changeType).join(', ')}`,
        skipAnalysis: false,
      };
    }

    // CHEAP tier: All other changes use OpenRouter models
    return {
      tier: ModelTier.CHEAP,
      reason: hasHigh ? `High-priority changes: ${changes.filter(c => c.severity === 'high').map(c => c.changeType).join(', ')}` : 'Low/medium changes only',
      skipAnalysis: false,
    };
  }

  /**
   * Register a project change event (for event-driven analysis)
   */
  registerChange(event: ProjectChangeEvent): void {
    const existing = this.pendingChanges.get(event.projectId) || [];
    existing.push(event);
    this.pendingChanges.set(event.projectId, existing);
    
    console.log(`[SmartModelRouter] Change registered: ${event.projectId} - ${event.changeType} (${event.severity})`);
  }

  /**
   * Clear processed changes for a project
   */
  clearChanges(projectId: string): void {
    this.pendingChanges.delete(projectId);
  }

  /**
   * Get projects that have pending changes (for event-driven orchestration)
   */
  getProjectsWithChanges(): string[] {
    return Array.from(this.pendingChanges.keys());
  }

  /**
   * Check if a project needs analysis
   */
  needsAnalysis(projectId: string): boolean {
    const changes = this.pendingChanges.get(projectId);
    return changes !== undefined && changes.length > 0;
  }

  /**
   * Cache an analysis result
   */
  cacheResult(
    taskType: string,
    projectData: any,
    agentType: string,
    result: string,
    tier: ModelTier
  ): void {
    const cacheKey = this.generateCacheKey(taskType, projectData, agentType);
    this.cache.set(cacheKey, {
      hash: cacheKey,
      result,
      timestamp: Date.now(),
      tier,
    });
    
    // Clear pending changes after caching
    if (projectData?.id) {
      this.clearChanges(projectData.id);
    }
  }

  /**
   * Store agent summary for cross-agent communication
   */
  storeSummary(agentId: string, projectId: string, summary: string): void {
    const key = `${agentId}:${projectId}`;
    this.summaryStore.set(key, summary);
  }

  /**
   * Get summary from another agent
   */
  getSummary(agentId: string, projectId: string): string | undefined {
    return this.summaryStore.get(`${agentId}:${projectId}`);
  }

  /**
   * Get all summaries for a project (for agent collaboration)
   */
  getAllSummaries(projectId: string): Record<string, string> {
    const summaries: Record<string, string> = {};
    for (const [key, value] of this.summaryStore.entries()) {
      if (key.endsWith(`:${projectId}`)) {
        const agentId = key.split(':')[0];
        summaries[agentId] = value;
      }
    }
    return summaries;
  }

  /**
   * Generate a compact summary prompt
   */
  getSummaryPrompt(): string {
    return `
After your analysis, provide a compact summary (max 100 words) that includes:
1. Key finding (1 sentence)
2. Risk level (low/medium/high/critical)
3. Recommended action (if any)

Format: [FINDING] ... [RISK: level] [ACTION: ...]
`;
  }

  /**
   * Get estimated cost for a model tier
   */
  getEstimatedCost(tier: ModelTier, tokenCount: number = 1000): number {
    const modelName = TIER_MODELS[tier][0];
    const costPer1M = MODEL_COSTS[modelName] || 1.0;
    return (tokenCount / 1000000) * costPer1M;
  }

  /**
   * Get router statistics
   */
  getStats(): {
    cacheSize: number;
    cacheHitRate: number;
    pendingChanges: number;
    summaryCount: number;
    openRouterEnabled: boolean;
  } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0, // TODO: track hits/misses
      pendingChanges: Array.from(this.pendingChanges.values()).reduce((sum, arr) => sum + arr.length, 0),
      summaryCount: this.summaryStore.size,
      openRouterEnabled: !!this.openRouterKey,
    };
  }

  /**
   * Clear expired cache entries
   */
  pruneCache(): number {
    const now = Date.now();
    let pruned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        pruned++;
      }
    }
    
    if (pruned > 0) {
      console.log(`[SmartModelRouter] Pruned ${pruned} expired cache entries`);
    }
    
    return pruned;
  }

  /**
   * Set cache TTL
   */
  setCacheTTL(ttlMs: number): void {
    this.cacheTTL = ttlMs;
    console.log(`[SmartModelRouter] Cache TTL set to ${ttlMs}ms`);
  }

  private generateCacheKey(taskType: string, projectData: any, agentType: string): string {
    const dataHash = crypto
      .createHash('md5')
      .update(JSON.stringify({ taskType, projectData, agentType }))
      .digest('hex');
    return dataHash;
  }
}

// Singleton instance
let routerInstance: SmartModelRouter | null = null;

export function getSmartRouter(): SmartModelRouter {
  if (!routerInstance) {
    routerInstance = new SmartModelRouter();
  }
  return routerInstance;
}
