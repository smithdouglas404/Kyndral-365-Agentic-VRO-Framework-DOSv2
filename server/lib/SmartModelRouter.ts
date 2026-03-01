/**
 * SMART MODEL ROUTER v3.0
 * 
 * Direct API calls - NO LangChain dependency.
 * Uses OpenRouterClient for all LLM interactions.
 * 
 * Architecture:
 * 1. Tiered routing - cheap models for routine, Claude for complex
 * 2. Caching - skip unchanged analysis
 * 3. Event-driven - analyze on change, not timer
 * 4. AI kill switch - ENABLE_AI_AGENTS=false blocks ALL calls
 */

import crypto from 'crypto';
import { callLLM, openRouterClient, type OpenRouterOptions } from './OpenRouterClient.js';

export enum ModelTier {
  CHEAP = 'cheap',
  PREMIUM = 'premium',
}

const MODEL_COSTS: Record<string, number> = {
  'meta-llama/llama-3.1-8b-instruct': 0.10,
  'mistralai/mixtral-8x7b-instruct': 0.27,
  'openai/gpt-4o-mini': 0.15,
  'openai/gpt-4o': 5.00,
  'anthropic/claude-3.5-sonnet': 3.00,
  'anthropic/claude-sonnet-4': 3.00,
};

const TIER_MODELS: Record<ModelTier, string> = {
  [ModelTier.CHEAP]: 'meta-llama/llama-3.1-8b-instruct',
  [ModelTier.PREMIUM]: 'anthropic/claude-sonnet-4-20250514',
};

const TIER_TEMPERATURES: Record<ModelTier, number> = {
  [ModelTier.CHEAP]: 0.3,
  [ModelTier.PREMIUM]: 0.7,
};

export interface AIResponse {
  content: string;
  model: string;
  tier: ModelTier;
}

interface TaskClassification {
  tier: ModelTier;
  reason: string;
  skipAnalysis: boolean;
  cachedResult?: string;
}

interface CacheEntry {
  hash: string;
  result: string;
  timestamp: number;
  tier: ModelTier;
}

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
  private cacheTTL: number = 30 * 60 * 1000;
  private pendingChanges: Map<string, ProjectChangeEvent[]> = new Map();
  private summaryStore: Map<string, string> = new Map();
  private aiEnabled: boolean = false;

  constructor() {
    this.aiEnabled = process.env.ENABLE_AI_AGENTS !== 'false';
    
    if (!this.aiEnabled) {
      console.log('[SmartModelRouter] ⛔ AI AGENTS DISABLED - No models will be created, zero token consumption');
      return;
    }

    if (openRouterClient.isAvailable) {
      console.log('[SmartModelRouter] OpenRouter available - cost optimization enabled');
    } else if (openRouterClient.hasAnthropicFallback) {
      console.log('[SmartModelRouter] Using direct Anthropic (OpenRouter not configured)');
    } else {
      console.log('[SmartModelRouter] ⚠️ No API keys configured - AI calls will fail');
    }
  }

  isAIEnabled(): boolean {
    return this.aiEnabled;
  }

  async callModel(
    tier: ModelTier,
    systemPrompt: string,
    userPrompt: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AIResponse> {
    if (!this.aiEnabled) {
      throw new Error('[SmartModelRouter] AI agents disabled - callModel blocked');
    }

    const model = TIER_MODELS[tier];
    const temperature = options?.temperature ?? TIER_TEMPERATURES[tier];
    const maxTokens = options?.maxTokens ?? 4096;

    const content = await callLLM(systemPrompt, userPrompt, {
      model,
      temperature,
      maxTokens,
    });

    return { content, model, tier };
  }

  async callModelWithMessages(
    tier: ModelTier,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AIResponse> {
    if (!this.aiEnabled) {
      throw new Error('[SmartModelRouter] AI agents disabled - callModel blocked');
    }

    const model = TIER_MODELS[tier];
    const temperature = options?.temperature ?? TIER_TEMPERATURES[tier];
    const maxTokens = options?.maxTokens ?? 4096;

    const content = await openRouterClient.chat(messages, {
      model,
      temperature,
      maxTokens,
    });

    return { content, model, tier };
  }

  classifyTask(
    taskType: string,
    projectData: any,
    agentType: string
  ): TaskClassification {
    const cacheKey = this.generateCacheKey(taskType, projectData, agentType);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return {
        tier: cached.tier,
        reason: 'Cached result available',
        skipAnalysis: true,
        cachedResult: cached.result,
      };
    }

    const changes = this.pendingChanges.get(projectData?.id);
    if (!changes || changes.length === 0) {
      return {
        tier: ModelTier.CHEAP,
        reason: 'No changes detected - routine check',
        skipAnalysis: false,
      };
    }

    const hasCritical = changes.some(c => c.severity === 'critical');
    const hasHigh = changes.some(c => c.severity === 'high');
    
    if (hasCritical) {
      return {
        tier: ModelTier.PREMIUM,
        reason: `Critical changes detected: ${changes.filter(c => c.severity === 'critical').map(c => c.changeType).join(', ')}`,
        skipAnalysis: false,
      };
    }

    return {
      tier: ModelTier.CHEAP,
      reason: hasHigh ? `High-priority changes: ${changes.filter(c => c.severity === 'high').map(c => c.changeType).join(', ')}` : 'Low/medium changes only',
      skipAnalysis: false,
    };
  }

  registerChange(event: ProjectChangeEvent): void {
    const existing = this.pendingChanges.get(event.projectId) || [];
    existing.push(event);
    this.pendingChanges.set(event.projectId, existing);
  }

  clearChanges(projectId: string): void {
    this.pendingChanges.delete(projectId);
  }

  getProjectsWithChanges(): string[] {
    return Array.from(this.pendingChanges.keys());
  }

  needsAnalysis(projectId: string): boolean {
    const changes = this.pendingChanges.get(projectId);
    return changes !== undefined && changes.length > 0;
  }

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
    
    if (projectData?.id) {
      this.clearChanges(projectData.id);
    }
  }

  storeSummary(agentId: string, projectId: string, summary: string): void {
    this.summaryStore.set(`${agentId}:${projectId}`, summary);
  }

  getSummary(agentId: string, projectId: string): string | undefined {
    return this.summaryStore.get(`${agentId}:${projectId}`);
  }

  getAllSummaries(projectId: string): Record<string, string> {
    const summaries: Record<string, string> = {};
    for (const [key, value] of this.summaryStore.entries()) {
      if (key.endsWith(`:${projectId}`)) {
        summaries[key.split(':')[0]] = value;
      }
    }
    return summaries;
  }

  getSummaryPrompt(): string {
    return `
After your analysis, provide a compact summary (max 100 words) that includes:
1. Key finding (1 sentence)
2. Risk level (low/medium/high/critical)
3. Recommended action (if any)

Format: [FINDING] ... [RISK: level] [ACTION: ...]
`;
  }

  getEstimatedCost(tier: ModelTier, tokenCount: number = 1000): number {
    const modelName = TIER_MODELS[tier];
    const costPer1M = MODEL_COSTS[modelName] || 1.0;
    return (tokenCount / 1000000) * costPer1M;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0,
      pendingChanges: Array.from(this.pendingChanges.values()).reduce((sum, arr) => sum + arr.length, 0),
      summaryCount: this.summaryStore.size,
      openRouterEnabled: openRouterClient.isAvailable,
    };
  }

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

  setCacheTTL(ttlMs: number): void {
    this.cacheTTL = ttlMs;
  }

  private generateCacheKey(taskType: string, projectData: any, agentType: string): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify({ taskType, projectData, agentType }))
      .digest('hex');
  }
}

let routerInstance: SmartModelRouter | null = null;

export function getSmartRouter(): SmartModelRouter {
  if (!routerInstance) {
    routerInstance = new SmartModelRouter();
  }
  return routerInstance;
}
