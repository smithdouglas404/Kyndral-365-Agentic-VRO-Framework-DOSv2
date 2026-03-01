/**
 * SMART MODEL ROUTER v4.0 — 3-TIER INTELLIGENT LAYER
 * 
 * Architecture (cheapest first):
 * 
 * TIER 0 — DETERMINISTIC (zero cost, zero latency)
 *   Rule-based heuristics that compute answers from project data.
 *   CPI < 0.9? Budget risk. SPI < 0.85? Schedule delay.
 *   No API call needed. Handles ~60-70% of routine agent work.
 * 
 * TIER 1 — CHEAP ($0.10-$0.50 per 1M tokens)
 *   Llama 3.1 8B / GPT-4o-mini / Mixtral via OpenRouter.
 *   For analysis that needs language generation but isn't complex.
 * 
 * TIER 2 — PREMIUM ($3-15 per 1M tokens)
 *   Claude Sonnet via Anthropic (direct or OpenRouter).
 *   ONLY for critical/complex decisions, multi-factor analysis,
 *   narrative generation, or when Tier 0+1 can't handle it.
 * 
 * Flow per agent cycle:
 *   1. Cache check → skip if hash unchanged (free)
 *   2. Tier 0 heuristics → answer with rules if possible (free)
 *   3. Tier 1 cheap model → routine analysis ($0.10-0.50/M)
 *   4. Tier 2 premium model → only if critical ($3-15/M)
 * 
 * AI kill switch: ENABLE_AI_AGENTS=false blocks ALL tiers.
 */

import crypto from 'crypto';
import { callLLM, openRouterClient, type OpenRouterOptions } from './OpenRouterClient.js';

export enum ModelTier {
  HEURISTIC = 'heuristic',
  CHEAP = 'cheap',
  PREMIUM = 'premium',
}

const MODEL_COSTS: Record<string, number> = {
  'heuristic': 0,
  'meta-llama/llama-3.1-8b-instruct': 0.10,
  'mistralai/mixtral-8x7b-instruct': 0.27,
  'openai/gpt-4o-mini': 0.15,
  'openai/gpt-4o': 5.00,
  'anthropic/claude-3.5-sonnet': 3.00,
  'anthropic/claude-sonnet-4': 3.00,
};

const TIER_MODELS: Record<string, string> = {
  [ModelTier.CHEAP]: 'meta-llama/llama-3.1-8b-instruct',
  [ModelTier.PREMIUM]: 'anthropic/claude-sonnet-4-20250514',
};

const TIER_TEMPERATURES: Record<string, number> = {
  [ModelTier.CHEAP]: 0.3,
  [ModelTier.PREMIUM]: 0.7,
};

export interface AIResponse {
  content: string;
  model: string;
  tier: ModelTier;
  heuristic?: boolean;
  costSaved?: string;
}

interface TaskClassification {
  tier: ModelTier;
  reason: string;
  skipAnalysis: boolean;
  cachedResult?: string;
  heuristicResult?: HeuristicResult;
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

export interface HeuristicResult {
  applicable: boolean;
  findings: HeuristicFinding[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendations: string[];
  needsLLM: boolean;
  suggestedTier?: ModelTier;
}

interface HeuristicFinding {
  category: string;
  metric: string;
  value: number | string;
  threshold: number | string;
  status: 'ok' | 'warning' | 'critical';
  message: string;
}

interface TierStats {
  heuristicCalls: number;
  cheapCalls: number;
  premiumCalls: number;
  cacheHits: number;
  heuristicSavings: number;
  totalCalls: number;
}

export type TierOverride = 'auto' | 'heuristic' | 'cheap' | 'premium';

export interface AgentTierConfig {
  agentId: string;
  minimumTier: TierOverride;
  reason?: string;
  updatedBy?: string;
  updatedAt?: Date;
}

export class SmartModelRouter {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 30 * 60 * 1000;
  private pendingChanges: Map<string, ProjectChangeEvent[]> = new Map();
  private summaryStore: Map<string, string> = new Map();
  private aiEnabled: boolean = false;
  private agentTierOverrides: Map<string, TierOverride> = new Map();
  private projectTierOverrides: Map<string, TierOverride> = new Map();
  private globalMinimumTier: TierOverride = 'auto';
  private tierStats: TierStats = {
    heuristicCalls: 0,
    cheapCalls: 0,
    premiumCalls: 0,
    cacheHits: 0,
    heuristicSavings: 0,
    totalCalls: 0,
  };

  constructor() {
    this.aiEnabled = process.env.ENABLE_AI_AGENTS !== 'false';
    
    if (!this.aiEnabled) {
      console.log('[SmartModelRouter] ⛔ AI AGENTS DISABLED - No models will be created, zero token consumption');
      return;
    }

    console.log('[SmartModelRouter] 3-Tier Intelligent Layer active:');
    console.log('  Tier 0: Deterministic heuristics (zero cost)');
    console.log('  Tier 1: Cheap models via OpenRouter ($0.10-0.50/M tokens)');
    console.log('  Tier 2: Premium Claude (critical only, $3-15/M tokens)');

    if (openRouterClient.isAvailable) {
      console.log('[SmartModelRouter] ✅ OpenRouter available - cost optimization enabled');
    } else if (openRouterClient.hasAnthropicFallback) {
      console.log('[SmartModelRouter] ⚠️ Using direct Anthropic (OpenRouter not configured)');
    } else {
      console.log('[SmartModelRouter] ⚠️ No API keys configured - AI calls will fail');
    }
  }

  isAIEnabled(): boolean {
    return this.aiEnabled;
  }

  async loadPersistedOverrides(): Promise<void> {
    try {
      const { db } = await import('../db.js');
      const { appConfig } = await import('../../shared/schema.js');
      const { like } = await import('drizzle-orm');

      const rows = await db.select().from(appConfig).where(like(appConfig.configKey, 'agent_tier_override_%'));
      for (const row of rows) {
        const agentId = row.configKey.replace('agent_tier_override_', '');
        const tier = row.configValue as TierOverride;
        if (['auto', 'heuristic', 'cheap', 'premium'].includes(tier) && tier !== 'auto') {
          this.agentTierOverrides.set(agentId, tier);
        }
      }

      const [globalRow] = await db.select().from(appConfig).where(
        (await import('drizzle-orm')).eq(appConfig.configKey, 'global_minimum_tier')
      ).limit(1);
      if (globalRow && ['auto', 'heuristic', 'cheap', 'premium'].includes(globalRow.configValue)) {
        this.globalMinimumTier = globalRow.configValue as TierOverride;
      }

      const agentCount = this.agentTierOverrides.size;
      if (agentCount > 0 || this.globalMinimumTier !== 'auto') {
        console.log(`[SmartModelRouter] Loaded persisted tier overrides: ${agentCount} agent(s), global=${this.globalMinimumTier}`);
      }
    } catch (error) {
      console.log('[SmartModelRouter] No persisted tier overrides found (first run)');
    }
  }

  /**
   * TIER 0: Run deterministic heuristics on project data.
   * Returns structured findings WITHOUT making any API call.
   * 
   * Covers: budget health, schedule health, risk scoring,
   * resource utilization, milestone tracking, governance compliance.
   */
  runHeuristics(agentType: string, projectData: any): HeuristicResult {
    if (!projectData) {
      return { applicable: false, findings: [], riskLevel: 'low', summary: '', recommendations: [], needsLLM: true };
    }

    const findings: HeuristicFinding[] = [];
    const recommendations: string[] = [];
    let maxSeverity: 'ok' | 'warning' | 'critical' = 'ok';

    const updateSeverity = (status: 'ok' | 'warning' | 'critical') => {
      if (status === 'critical') maxSeverity = 'critical';
      else if (status === 'warning' && maxSeverity !== 'critical') maxSeverity = 'warning';
    };

    // ---------- BUDGET / FINOPS HEURISTICS ----------
    if (['deepfinops', 'finops', 'budget'].includes(agentType.toLowerCase())) {
      const budget = parseFloat(projectData.budget || projectData.totalBudget || '0');
      const spent = parseFloat(projectData.spent || projectData.actualCost || projectData.actual_cost || '0');
      const ev = parseFloat(projectData.earnedValue || projectData.earned_value || '0');

      if (budget > 0 && spent > 0) {
        const cpi = ev > 0 ? ev / spent : (budget - spent) / budget;
        const budgetUsed = spent / budget;

        const cpiStatus = cpi < 0.85 ? 'critical' : cpi < 0.95 ? 'warning' : 'ok';
        findings.push({ category: 'Budget', metric: 'CPI', value: cpi.toFixed(2), threshold: '0.95', status: cpiStatus, message: cpi < 0.85 ? `CPI at ${cpi.toFixed(2)} — significant cost overrun` : cpi < 0.95 ? `CPI at ${cpi.toFixed(2)} — trending over budget` : `CPI at ${cpi.toFixed(2)} — within budget` });
        updateSeverity(cpiStatus);

        const spendStatus = budgetUsed > 0.95 ? 'critical' : budgetUsed > 0.80 ? 'warning' : 'ok';
        findings.push({ category: 'Budget', metric: 'Budget Utilization', value: `${(budgetUsed * 100).toFixed(0)}%`, threshold: '80%', status: spendStatus, message: `${(budgetUsed * 100).toFixed(0)}% of budget consumed` });
        updateSeverity(spendStatus);

        if (cpi < 0.85) recommendations.push(`[URGENT] CPI at ${cpi.toFixed(2)} — initiate budget recovery plan per SOP-FIN-042`);
        if (budgetUsed > 0.90 && cpi < 0.95) recommendations.push(`Budget ${(budgetUsed * 100).toFixed(0)}% consumed with CPI below target — escalate to PMO`);
      }
    }

    // ---------- SCHEDULE / TMO HEURISTICS ----------
    if (['deeptmo', 'tmo', 'schedule'].includes(agentType.toLowerCase())) {
      const progress = parseFloat(projectData.progress || projectData.percentComplete || '0');
      const ev = parseFloat(projectData.earnedValue || projectData.earned_value || '0');
      const pv = parseFloat(projectData.plannedValue || projectData.planned_value || '0');
      const startDate = projectData.startDate || projectData.start_date;
      const endDate = projectData.endDate || projectData.end_date;

      if (pv > 0 && ev > 0) {
        const spi = ev / pv;
        const spiStatus = spi < 0.85 ? 'critical' : spi < 0.95 ? 'warning' : 'ok';
        findings.push({ category: 'Schedule', metric: 'SPI', value: spi.toFixed(2), threshold: '0.95', status: spiStatus, message: spi < 0.85 ? `SPI at ${spi.toFixed(2)} — significant schedule delay` : spi < 0.95 ? `SPI at ${spi.toFixed(2)} — behind schedule` : `SPI at ${spi.toFixed(2)} — on schedule` });
        updateSeverity(spiStatus);

        if (spi < 0.85) recommendations.push(`[URGENT] SPI at ${spi.toFixed(2)} — fast-track or crash schedule per PMBOK 6.5`);
      }

      if (startDate && endDate) {
        const now = new Date();
        const end = new Date(endDate);
        const start = new Date(startDate);
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const expectedProgress = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;

        if (progress > 0 && expectedProgress > 0) {
          const scheduleVariance = progress - expectedProgress;
          const svStatus = scheduleVariance < -15 ? 'critical' : scheduleVariance < -5 ? 'warning' : 'ok';
          findings.push({ category: 'Schedule', metric: 'Schedule Variance', value: `${scheduleVariance.toFixed(0)}%`, threshold: '-5%', status: svStatus, message: `Progress ${progress.toFixed(0)}% vs expected ${expectedProgress.toFixed(0)}%` });
          updateSeverity(svStatus);
        }
      }
    }

    // ---------- RISK HEURISTICS ----------
    if (['deeprisk', 'risk'].includes(agentType.toLowerCase())) {
      const riskScore = parseFloat(projectData.riskScore || projectData.risk_score || '0');
      const openRisks = parseInt(projectData.openRisks || projectData.open_risks || '0');
      const status = (projectData.status || '').toLowerCase();

      if (riskScore > 0) {
        const riskStatus = riskScore > 80 ? 'critical' : riskScore > 60 ? 'warning' : 'ok';
        findings.push({ category: 'Risk', metric: 'Risk Score', value: riskScore, threshold: 60, status: riskStatus, message: `Composite risk score: ${riskScore}/100` });
        updateSeverity(riskStatus);
      }

      if (openRisks > 0) {
        const riskCountStatus = openRisks > 10 ? 'critical' : openRisks > 5 ? 'warning' : 'ok';
        findings.push({ category: 'Risk', metric: 'Open Risks', value: openRisks, threshold: 5, status: riskCountStatus, message: `${openRisks} open risk items` });
        updateSeverity(riskCountStatus);
      }

      if (status === 'red' || status === 'critical') {
        findings.push({ category: 'Risk', metric: 'Project Status', value: status, threshold: 'green', status: 'critical', message: `Project status is ${status.toUpperCase()}` });
        updateSeverity('critical');
        recommendations.push('[URGENT] Project in RED status — escalate to steering committee');
      }
    }

    // ---------- PMO HEALTH HEURISTICS ----------
    if (['deeppmo', 'pmo'].includes(agentType.toLowerCase())) {
      const progress = parseFloat(projectData.progress || projectData.percentComplete || '0');
      const status = (projectData.status || '').toLowerCase();

      if (['red', 'critical'].includes(status)) {
        findings.push({ category: 'PMO', metric: 'Health Status', value: status, threshold: 'green', status: 'critical', message: `Project health: ${status.toUpperCase()}` });
        updateSeverity('critical');
      } else if (['amber', 'yellow', 'at-risk'].includes(status)) {
        findings.push({ category: 'PMO', metric: 'Health Status', value: status, threshold: 'green', status: 'warning', message: `Project health: ${status.toUpperCase()}` });
        updateSeverity('warning');
      } else {
        findings.push({ category: 'PMO', metric: 'Health Status', value: status || 'unknown', threshold: 'green', status: 'ok', message: `Project health: ${(status || 'UNKNOWN').toUpperCase()}` });
      }

      if (progress >= 0) {
        const progressStatus = progress < 10 ? 'warning' : 'ok';
        findings.push({ category: 'PMO', metric: 'Completion', value: `${progress.toFixed(0)}%`, threshold: 'varies', status: progressStatus, message: `Project is ${progress.toFixed(0)}% complete` });
      }
    }

    // ---------- VRO / VALUE HEURISTICS ----------
    if (['deepvro', 'vro', 'value'].includes(agentType.toLowerCase())) {
      const roi = parseFloat(projectData.roi || projectData.actualROI || '0');
      const plannedROI = parseFloat(projectData.plannedROI || projectData.targetROI || '0');

      if (roi > 0 || plannedROI > 0) {
        const roiVariance = plannedROI > 0 ? ((roi - plannedROI) / plannedROI) * 100 : 0;
        const roiStatus = roiVariance < -20 ? 'critical' : roiVariance < -10 ? 'warning' : 'ok';
        findings.push({ category: 'Value', metric: 'ROI Tracking', value: `${roi.toFixed(1)}%`, threshold: `${plannedROI.toFixed(1)}%`, status: roiStatus, message: `Actual ROI ${roi.toFixed(1)}% vs planned ${plannedROI.toFixed(1)}%` });
        updateSeverity(roiStatus);
      }
    }

    // ---------- GOVERNANCE HEURISTICS ----------
    if (['deepgovernance', 'governance'].includes(agentType.toLowerCase())) {
      const complianceScore = parseFloat(projectData.complianceScore || projectData.compliance_score || '0');
      const pendingApprovals = parseInt(projectData.pendingApprovals || projectData.pending_approvals || '0');

      if (complianceScore > 0) {
        const compStatus = complianceScore < 70 ? 'critical' : complianceScore < 85 ? 'warning' : 'ok';
        findings.push({ category: 'Governance', metric: 'Compliance Score', value: `${complianceScore}%`, threshold: '85%', status: compStatus, message: `Governance compliance at ${complianceScore}%` });
        updateSeverity(compStatus);
      }

      if (pendingApprovals > 0) {
        const approvalStatus = pendingApprovals > 5 ? 'critical' : pendingApprovals > 2 ? 'warning' : 'ok';
        findings.push({ category: 'Governance', metric: 'Pending Approvals', value: pendingApprovals, threshold: 2, status: approvalStatus, message: `${pendingApprovals} approvals pending` });
        updateSeverity(approvalStatus);
      }
    }

    // ---------- OCM HEURISTICS ----------
    if (['deepocm', 'ocm', 'change'].includes(agentType.toLowerCase())) {
      const adoptionRate = parseFloat(projectData.adoptionRate || projectData.adoption_rate || '0');
      const stakeholderSatisfaction = parseFloat(projectData.stakeholderSatisfaction || '0');

      if (adoptionRate > 0) {
        const adoptStatus = adoptionRate < 40 ? 'critical' : adoptionRate < 70 ? 'warning' : 'ok';
        findings.push({ category: 'OCM', metric: 'Adoption Rate', value: `${adoptionRate}%`, threshold: '70%', status: adoptStatus, message: `Change adoption at ${adoptionRate}%` });
        updateSeverity(adoptStatus);
      }

      if (stakeholderSatisfaction > 0) {
        const satStatus = stakeholderSatisfaction < 3 ? 'critical' : stakeholderSatisfaction < 3.5 ? 'warning' : 'ok';
        findings.push({ category: 'OCM', metric: 'Stakeholder Satisfaction', value: stakeholderSatisfaction.toFixed(1), threshold: '3.5', status: satStatus, message: `Stakeholder satisfaction: ${stakeholderSatisfaction.toFixed(1)}/5` });
        updateSeverity(satStatus);
      }
    }

    if (findings.length === 0) {
      return { applicable: false, findings: [], riskLevel: 'low', summary: '', recommendations: [], needsLLM: true };
    }

    const riskLevel = maxSeverity === 'critical' ? 'critical' : maxSeverity === 'warning' ? 'high' : 'low';

    const criticalFindings = findings.filter(f => f.status === 'critical');
    const warningFindings = findings.filter(f => f.status === 'warning');
    const okFindings = findings.filter(f => f.status === 'ok');

    const summaryParts: string[] = [];
    if (criticalFindings.length > 0) summaryParts.push(`${criticalFindings.length} CRITICAL: ${criticalFindings.map(f => f.message).join('; ')}`);
    if (warningFindings.length > 0) summaryParts.push(`${warningFindings.length} WARNING: ${warningFindings.map(f => f.message).join('; ')}`);
    if (okFindings.length > 0) summaryParts.push(`${okFindings.length} OK`);
    const summary = `[HEURISTIC] ${summaryParts.join(' | ')}`;

    const needsLLM = maxSeverity === 'critical';
    const suggestedTier = maxSeverity === 'critical' ? ModelTier.PREMIUM : maxSeverity === 'warning' ? ModelTier.CHEAP : undefined;

    return { applicable: true, findings, riskLevel, summary, recommendations, needsLLM, suggestedTier };
  }

  /**
   * Format heuristic result into a structured response that can replace an LLM call.
   */
  formatHeuristicResponse(result: HeuristicResult, agentName: string): AIResponse {
    const sections: string[] = [];

    sections.push(`## ${agentName} Analysis (Deterministic)`);
    sections.push('');
    sections.push(`**Overall Risk Level: ${result.riskLevel.toUpperCase()}**`);
    sections.push('');

    const critical = result.findings.filter(f => f.status === 'critical');
    const warnings = result.findings.filter(f => f.status === 'warning');
    const ok = result.findings.filter(f => f.status === 'ok');

    if (critical.length > 0) {
      sections.push('### Critical Issues');
      critical.forEach(f => sections.push(`- **${f.metric}**: ${f.message} (threshold: ${f.threshold})`));
      sections.push('');
    }

    if (warnings.length > 0) {
      sections.push('### Warnings');
      warnings.forEach(f => sections.push(`- **${f.metric}**: ${f.message} (threshold: ${f.threshold})`));
      sections.push('');
    }

    if (ok.length > 0) {
      sections.push('### Healthy Metrics');
      ok.forEach(f => sections.push(`- **${f.metric}**: ${f.message}`));
      sections.push('');
    }

    if (result.recommendations.length > 0) {
      sections.push('### Recommended Actions');
      result.recommendations.forEach(r => sections.push(`- ${r}`));
      sections.push('');
    }

    sections.push(`*Analysis completed via Tier 0 heuristics (zero API cost)*`);

    return {
      content: sections.join('\n'),
      model: 'heuristic-engine',
      tier: ModelTier.HEURISTIC,
      heuristic: true,
      costSaved: 'Saved ~$0.003-0.015 per analysis (no LLM call)',
    };
  }

  /**
   * TIER 1 + TIER 2: Make an LLM call at the specified tier.
   */
  async callModel(
    tier: ModelTier,
    systemPrompt: string,
    userPrompt: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AIResponse> {
    if (!this.aiEnabled) {
      throw new Error('[SmartModelRouter] AI agents disabled - callModel blocked');
    }

    if (tier === ModelTier.HEURISTIC) {
      throw new Error('[SmartModelRouter] Cannot call HEURISTIC tier via callModel — use runHeuristics() instead');
    }

    const model = TIER_MODELS[tier];
    const temperature = options?.temperature ?? TIER_TEMPERATURES[tier];
    const maxTokens = options?.maxTokens ?? 4096;

    if (tier === ModelTier.PREMIUM) {
      this.tierStats.premiumCalls++;
    } else {
      this.tierStats.cheapCalls++;
    }
    this.tierStats.totalCalls++;

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

    const effectiveTier = tier === ModelTier.HEURISTIC ? ModelTier.CHEAP : tier;
    const model = TIER_MODELS[effectiveTier];
    const temperature = options?.temperature ?? TIER_TEMPERATURES[effectiveTier];
    const maxTokens = options?.maxTokens ?? 4096;

    if (effectiveTier === ModelTier.PREMIUM) {
      this.tierStats.premiumCalls++;
    } else {
      this.tierStats.cheapCalls++;
    }
    this.tierStats.totalCalls++;

    const content = await openRouterClient.chat(messages, {
      model,
      temperature,
      maxTokens,
    });

    return { content, model, tier: effectiveTier };
  }

  /**
   * INTELLIGENT TASK CLASSIFICATION
   * 
   * Decision flow:
   * 1. Cache hit? → return cached (free)
   * 2. Run heuristics → if conclusive and no critical issues, skip LLM (free)
   * 3. No changes? → CHEAP tier for routine (low cost)
   * 4. Critical changes? → PREMIUM tier (high cost, justified)
   * 5. Default → CHEAP tier
   */
  private getTierRank(tier: ModelTier | TierOverride): number {
    const ranks: Record<string, number> = {
      'auto': -1,
      'heuristic': 0,
      'cheap': 1,
      'premium': 2,
    };
    return ranks[tier] ?? -1;
  }

  private overrideToModelTier(override: TierOverride): ModelTier {
    const map: Record<TierOverride, ModelTier> = {
      'auto': ModelTier.HEURISTIC,
      'heuristic': ModelTier.HEURISTIC,
      'cheap': ModelTier.CHEAP,
      'premium': ModelTier.PREMIUM,
    };
    return map[override];
  }

  private getEffectiveMinimumTier(agentType: string, projectId?: string): TierOverride {
    const agentOverride = this.agentTierOverrides.get(agentType.toLowerCase());
    const projectOverride = projectId ? this.projectTierOverrides.get(projectId) : undefined;

    const candidates: TierOverride[] = [this.globalMinimumTier];
    if (agentOverride) candidates.push(agentOverride);
    if (projectOverride) candidates.push(projectOverride);

    let highest: TierOverride = 'auto';
    for (const c of candidates) {
      if (this.getTierRank(c) > this.getTierRank(highest)) highest = c;
    }
    return highest;
  }

  setAgentTierOverride(agentId: string, minimumTier: TierOverride): void {
    if (minimumTier === 'auto') {
      this.agentTierOverrides.delete(agentId.toLowerCase());
    } else {
      this.agentTierOverrides.set(agentId.toLowerCase(), minimumTier);
    }
    console.log(`[SmartModelRouter] Agent ${agentId} minimum tier set to: ${minimumTier}`);
  }

  setProjectTierOverride(projectId: string, minimumTier: TierOverride): void {
    if (minimumTier === 'auto') {
      this.projectTierOverrides.delete(projectId);
    } else {
      this.projectTierOverrides.set(projectId, minimumTier);
    }
    console.log(`[SmartModelRouter] Project ${projectId} minimum tier set to: ${minimumTier}`);
  }

  setGlobalMinimumTier(minimumTier: TierOverride): void {
    this.globalMinimumTier = minimumTier;
    console.log(`[SmartModelRouter] Global minimum tier set to: ${minimumTier}`);
  }

  getAgentTierOverride(agentId: string): TierOverride {
    return this.agentTierOverrides.get(agentId.toLowerCase()) || 'auto';
  }

  getProjectTierOverride(projectId: string): TierOverride {
    return this.projectTierOverrides.get(projectId) || 'auto';
  }

  getGlobalMinimumTier(): TierOverride {
    return this.globalMinimumTier;
  }

  getAllTierOverrides(): {
    global: TierOverride;
    agents: Record<string, TierOverride>;
    projects: Record<string, TierOverride>;
  } {
    return {
      global: this.globalMinimumTier,
      agents: Object.fromEntries(this.agentTierOverrides),
      projects: Object.fromEntries(this.projectTierOverrides),
    };
  }

  classifyTask(
    taskType: string,
    projectData: any,
    agentType: string
  ): TaskClassification {
    this.tierStats.totalCalls++;

    const cacheKey = this.generateCacheKey(taskType, projectData, agentType);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.tierStats.cacheHits++;
      return {
        tier: cached.tier,
        reason: 'Cached result available',
        skipAnalysis: true,
        cachedResult: cached.result,
      };
    }

    const projectId = projectData?.id || projectData?.projectId;
    const minimumTier = this.getEffectiveMinimumTier(agentType, projectId);

    const heuristic = this.runHeuristics(agentType, projectData);

    if (heuristic.applicable && !heuristic.needsLLM) {
      if (minimumTier === 'auto' || minimumTier === 'heuristic') {
        this.tierStats.heuristicCalls++;
        this.tierStats.heuristicSavings++;
        return {
          tier: ModelTier.HEURISTIC,
          reason: `Tier 0 heuristic: ${heuristic.findings.length} metrics evaluated deterministically`,
          skipAnalysis: true,
          heuristicResult: heuristic,
        };
      }
      return {
        tier: this.overrideToModelTier(minimumTier),
        reason: `Admin override: minimum tier set to ${minimumTier} (heuristic would have sufficed)`,
        skipAnalysis: false,
        heuristicResult: heuristic,
      };
    }

    const changes = this.pendingChanges.get(projectData?.id);
    if (!changes || changes.length === 0) {
      const naturalTier = heuristic.suggestedTier || ModelTier.CHEAP;
      const effectiveTier = this.getTierRank(minimumTier) > this.getTierRank(naturalTier)
        ? this.overrideToModelTier(minimumTier)
        : naturalTier;
      return {
        tier: effectiveTier,
        reason: heuristic.applicable
          ? `Heuristic found issues requiring LLM analysis: ${heuristic.summary}`
          : 'No changes detected - routine check',
        skipAnalysis: false,
        heuristicResult: heuristic.applicable ? heuristic : undefined,
      };
    }

    const hasCritical = changes.some(c => c.severity === 'critical');
    const hasHigh = changes.some(c => c.severity === 'high');
    
    if (hasCritical || (heuristic.applicable && heuristic.riskLevel === 'critical')) {
      return {
        tier: ModelTier.PREMIUM,
        reason: `Critical: ${hasCritical ? changes.filter(c => c.severity === 'critical').map(c => c.changeType).join(', ') : 'heuristic risk critical'}`,
        skipAnalysis: false,
        heuristicResult: heuristic.applicable ? heuristic : undefined,
      };
    }

    const naturalTier = ModelTier.CHEAP;
    const effectiveTier = this.getTierRank(minimumTier) > this.getTierRank(naturalTier)
      ? this.overrideToModelTier(minimumTier)
      : naturalTier;

    return {
      tier: effectiveTier,
      reason: hasHigh ? `High-priority changes: ${changes.filter(c => c.severity === 'high').map(c => c.changeType).join(', ')}` : 'Low/medium changes only',
      skipAnalysis: false,
      heuristicResult: heuristic.applicable ? heuristic : undefined,
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
    if (tier === ModelTier.HEURISTIC) return 0;
    const modelName = TIER_MODELS[tier];
    const costPer1M = MODEL_COSTS[modelName] || 1.0;
    return (tokenCount / 1000000) * costPer1M;
  }

  getStats() {
    const total = this.tierStats.totalCalls || 1;
    return {
      cacheSize: this.cache.size,
      cacheHitRate: ((this.tierStats.cacheHits / total) * 100).toFixed(1) + '%',
      heuristicRate: ((this.tierStats.heuristicCalls / total) * 100).toFixed(1) + '%',
      cheapRate: ((this.tierStats.cheapCalls / total) * 100).toFixed(1) + '%',
      premiumRate: ((this.tierStats.premiumCalls / total) * 100).toFixed(1) + '%',
      totalCalls: this.tierStats.totalCalls,
      heuristicSavings: this.tierStats.heuristicSavings,
      pendingChanges: Array.from(this.pendingChanges.values()).reduce((sum, arr) => sum + arr.length, 0),
      summaryCount: this.summaryStore.size,
      openRouterEnabled: openRouterClient.isAvailable,
      tierBreakdown: {
        heuristic: this.tierStats.heuristicCalls,
        cheap: this.tierStats.cheapCalls,
        premium: this.tierStats.premiumCalls,
        cacheHits: this.tierStats.cacheHits,
      },
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
let overridesLoaded = false;

export function getSmartRouter(): SmartModelRouter {
  if (!routerInstance) {
    routerInstance = new SmartModelRouter();
    if (!overridesLoaded) {
      overridesLoaded = true;
      routerInstance.loadPersistedOverrides().catch(() => {});
    }
  }
  return routerInstance;
}
