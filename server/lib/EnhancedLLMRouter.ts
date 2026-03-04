/**
 * ENHANCED LLM ROUTER (Phase 1, 2, 3)
 *
 * Multi-provider LLM routing with OpenRouter integration, agent-task-based routing,
 * automatic failover, cost optimization, and A/B testing.
 *
 * Phase 1: OpenRouter Integration + Basic Routing
 * Phase 2: Cost Optimization + Model Specialization
 * Phase 3: A/B Testing + Performance Monitoring
 *
 * Features:
 * - OpenRouter gateway (single API for Claude, GPT-4, Llama, Mistral, etc.)
 * - Agent-task-based model selection
 * - Automatic failover chains
 * - Three-tier cost strategy (Premium/Standard/Budget)
 * - Usage tracking and cost limits
 * - A/B testing framework
 * - Performance monitoring
 * - Direct Anthropic fallback
 */

import type { IStorage } from '../storage.js';

// ============================================================================
// TYPES
// ============================================================================

export type Provider = 'openrouter' | 'anthropic' | 'openai';

export type CostTier = 1 | 2 | 3; // 1 = Premium, 2 = Standard, 3 = Budget

export interface ModelPreference {
  primary: string;         // e.g., 'anthropic/claude-opus-4'
  fallback: string[];      // Failover chain
  costTier: CostTier;
  maxRetries?: number;
  timeout?: number;        // ms
}

export interface AgentTaskStrategy {
  [agentId: string]: {
    [taskType: string]: ModelPreference;
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMUsageMetrics {
  model: string;
  agent: string;
  taskType: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  success: boolean;
  timestamp: Date;
}

export interface ABTest {
  id: string;
  name: string;
  models: string[];
  trafficSplit: number[];  // e.g., [0.5, 0.5] for 50/50
  metric: 'latency' | 'cost' | 'user_approval' | 'quality_score';
  startDate: Date;
  endDate?: Date;
  active: boolean;
  results?: {
    [model: string]: {
      samples: number;
      avgMetric: number;
      winner?: boolean;
    };
  };
}

export interface CostLimit {
  daily_budget_usd: number;
  monthly_budget_usd: number;
  alert_threshold: number;  // 0-1 (e.g., 0.8 = alert at 80%)
  downgrade_on_limit: boolean;
}

// ============================================================================
// DEFAULT MODEL STRATEGY
// ============================================================================

export const DEFAULT_MODEL_STRATEGY: AgentTaskStrategy = {
  governance: {
    policy_interpretation: {
      primary: 'anthropic/claude-opus-4',
      fallback: ['openai/gpt-4', 'anthropic/claude-sonnet-4.5'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    compliance_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    document_search: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-large', 'meta-llama/llama-3-70b'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
    simple_check: {
      primary: 'mistralai/mistral-medium',
      fallback: ['meta-llama/llama-3.1-8b-instruct', 'anthropic/claude-haiku-4'],
      costTier: 3,
      maxRetries: 2,
      timeout: 15000,
    },
  },

  risk: {
    risk_assessment: {
      primary: 'anthropic/claude-opus-4',
      fallback: ['openai/gpt-4', 'anthropic/claude-sonnet-4.5'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    rca_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    rca_search: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-large'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
    simple_query: {
      primary: 'mistralai/mistral-medium',
      fallback: ['anthropic/claude-haiku-4'],
      costTier: 3,
      maxRetries: 2,
      timeout: 15000,
    },
  },

  finops: {
    financial_calculation: {
      primary: 'openai/gpt-4', // Reportedly better at math
      fallback: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4o'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    budget_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    financial_narrative: {
      primary: 'anthropic/claude-sonnet-4.5', // Better writing
      fallback: ['openai/gpt-4o'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    data_extraction: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-medium'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
  },

  tmo: {
    transformation_planning: {
      primary: 'anthropic/claude-opus-4',
      fallback: ['openai/gpt-4', 'anthropic/claude-sonnet-4.5'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    roadmap_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    dependency_search: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-large'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
  },

  vro: {
    value_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    roi_calculation: {
      primary: 'openai/gpt-4',
      fallback: ['anthropic/claude-sonnet-4.5'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    metric_extraction: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-medium'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
  },

  ocm: {
    stakeholder_communication: {
      primary: 'anthropic/claude-sonnet-4.5', // Best tone
      fallback: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    change_impact_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    simple_task: {
      primary: 'mistralai/mistral-medium',
      fallback: ['anthropic/claude-haiku-4'],
      costTier: 3,
      maxRetries: 2,
      timeout: 15000,
    },
  },

  planning: {
    project_planning: {
      primary: 'anthropic/claude-opus-4',
      fallback: ['openai/gpt-4', 'anthropic/claude-sonnet-4.5'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    dependency_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    template_search: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-medium'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
  },

  pmo: {
    portfolio_analysis: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    data_query: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-large'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
    report_generation: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
  },

  okr: {
    okr_inference: {
      primary: 'anthropic/claude-sonnet-4.5',
      fallback: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      costTier: 2,
      maxRetries: 2,
      timeout: 45000,
    },
    metric_extraction: {
      primary: 'meta-llama/llama-3.1-70b-instruct',
      fallback: ['mistralai/mistral-medium'],
      costTier: 3,
      maxRetries: 2,
      timeout: 30000,
    },
  },

  integrated: {
    cross_domain_analysis: {
      primary: 'anthropic/claude-opus-4',
      fallback: ['openai/gpt-4', 'anthropic/claude-sonnet-4.5'],
      costTier: 1,
      maxRetries: 3,
      timeout: 60000,
    },
    simple_task: {
      primary: 'mistralai/mistral-medium',
      fallback: ['anthropic/claude-haiku-4'],
      costTier: 3,
      maxRetries: 2,
      timeout: 15000,
    },
  },
};

// ============================================================================
// MODEL COST DATABASE
// ============================================================================

export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // Anthropic (per million tokens)
  'anthropic/claude-opus-4': { input: 15.00, output: 75.00 },
  'anthropic/claude-sonnet-4.5': { input: 3.00, output: 15.00 },
  'anthropic/claude-haiku-4': { input: 0.25, output: 1.25 },

  // OpenAI
  'openai/gpt-4': { input: 30.00, output: 60.00 },
  'openai/gpt-4o': { input: 5.00, output: 15.00 },
  'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },

  // Open source via OpenRouter (estimated)
  'meta-llama/llama-3.1-70b-instruct': { input: 0.50, output: 0.80 },
  'meta-llama/llama-3-70b': { input: 0.40, output: 0.70 },
  'meta-llama/llama-3.1-8b-instruct': { input: 0.10, output: 0.20 },
  'mistralai/mistral-large': { input: 2.00, output: 6.00 },
  'mistralai/mistral-medium': { input: 0.70, output: 2.00 },
  'mistralai/mistral-small': { input: 0.20, output: 0.60 },
};

// ============================================================================
// ENHANCED LLM ROUTER
// ============================================================================

export class EnhancedLLMRouter {
  private storage: IStorage;
  private openrouterApiKey: string;
  private modelStrategy: AgentTaskStrategy;
  private usageMetrics: LLMUsageMetrics[] = [];
  private activeABTests: ABTest[] = [];
  private costLimits: CostLimit;
  private dailyCost: number = 0;
  private monthlyCost: number = 0;

  constructor(config: {
    storage: IStorage;
    openrouterApiKey?: string;
    modelStrategy?: AgentTaskStrategy;
    costLimits?: Partial<CostLimit>;
  }) {
    this.storage = config.storage;
    this.openrouterApiKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
    this.modelStrategy = config.modelStrategy || DEFAULT_MODEL_STRATEGY;
    this.costLimits = {
      daily_budget_usd: 50,
      monthly_budget_usd: 1000,
      alert_threshold: 0.8,
      downgrade_on_limit: true,
      ...config.costLimits,
    };

    console.log('[EnhancedLLMRouter] Initialized with OpenRouter only (direct Anthropic fallback disabled for cost safety)');
  }

  /**
   * Main routing function
   * Selects model based on agent + task type, with automatic failover
   */
  async chat(params: {
    agent: string;
    taskType: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    content: string;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    cost: number;
    latency: number;
  }> {
    const startTime = Date.now();

    // Check cost limits
    if (this.dailyCost >= this.costLimits.daily_budget_usd) {
      if (this.costLimits.downgrade_on_limit) {
        console.warn('[EnhancedLLMRouter] Daily budget exceeded, downgrading to budget model');
        return this.chatWithBudgetModel(params);
      } else {
        throw new Error('Daily budget exceeded');
      }
    }

    // Get model preference
    const preference = this.getModelPreference(params.agent, params.taskType);

    // Check for active A/B test
    const abTest = this.getActiveABTest(params.agent, params.taskType);
    const modelToUse = abTest ? this.selectABTestModel(abTest) : preference.primary;

    // Try primary model
    try {
      const result = await this.callModel(modelToUse, params, preference.timeout);

      // Record metrics
      const latency = Date.now() - startTime;
      const cost = this.calculateCost(modelToUse, result.usage);
      this.recordMetrics({
        model: modelToUse,
        agent: params.agent,
        taskType: params.taskType,
        tokensUsed: result.usage.total_tokens,
        cost,
        latency,
        success: true,
        timestamp: new Date(),
      });

      // Update A/B test results
      if (abTest) {
        this.updateABTestResults(abTest.id, modelToUse, latency);
      }

      return { ...result, cost, latency };
    } catch (error: any) {
      console.warn(`[EnhancedLLMRouter] Primary model ${modelToUse} failed:`, error.message);

      // Try fallback models
      for (const fallbackModel of preference.fallback) {
        try {
          console.log(`[EnhancedLLMRouter] Trying fallback model: ${fallbackModel}`);
          const result = await this.callModel(fallbackModel, params, preference.timeout);

          const latency = Date.now() - startTime;
          const cost = this.calculateCost(fallbackModel, result.usage);
          this.recordMetrics({
            model: fallbackModel,
            agent: params.agent,
            taskType: params.taskType,
            tokensUsed: result.usage.total_tokens,
            cost,
            latency,
            success: true,
            timestamp: new Date(),
          });

          return { ...result, cost, latency };
        } catch (fallbackError: any) {
          console.warn(`[EnhancedLLMRouter] Fallback model ${fallbackModel} failed:`, fallbackError.message);
          continue;
        }
      }

      // All models failed
      throw new Error(`All models failed for ${params.agent}.${params.taskType}`);
    }
  }

  /**
   * Call specific model via OpenRouter or Anthropic
   */
  private async callModel(
    model: string,
    params: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      temperature?: number;
      maxTokens?: number;
    },
    timeout?: number
  ): Promise<{
    content: string;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    if (model.startsWith('claude-') && !model.includes('/')) {
      console.log(`[EnhancedLLMRouter] Routing ${model} through OpenRouter (direct Anthropic blocked)`);
      const openRouterModel = `anthropic/${model}`;
      return this.callOpenRouter(openRouterModel, params, timeout);
    }

    return this.callOpenRouter(model, params, timeout);
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(
    model: string,
    params: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      temperature?: number;
      maxTokens?: number;
    },
    timeout?: number
  ): Promise<{
    content: string;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://localhost:5000',
          'X-Title': 'Enterprise PMO Platform',
        },
        body: JSON.stringify({
          model: model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 4096,
        }),
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fallback to cheapest budget model
   */
  private async chatWithBudgetModel(params: {
    agent: string;
    taskType: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }) {
    const budgetModel = 'meta-llama/llama-3.1-8b-instruct';
    console.log(`[EnhancedLLMRouter] Using budget model: ${budgetModel}`);

    const result = await this.callOpenRouter(budgetModel, params, 15000);
    const cost = this.calculateCost(budgetModel, result.usage);

    return { ...result, cost, latency: 0 };
  }

  /**
   * Get model preference for agent + task
   */
  private getModelPreference(agent: string, taskType: string): ModelPreference {
    const agentStrategy = this.modelStrategy[agent];
    if (!agentStrategy) {
      console.warn(`[EnhancedLLMRouter] No strategy for agent ${agent}, using default`);
      return {
        primary: 'anthropic/claude-sonnet-4.5',
        fallback: ['openai/gpt-4o', 'anthropic/claude-haiku-4'],
        costTier: 2,
        maxRetries: 2,
        timeout: 45000,
      };
    }

    const preference = agentStrategy[taskType];
    if (!preference) {
      console.warn(`[EnhancedLLMRouter] No preference for ${agent}.${taskType}, using default`);
      return {
        primary: 'anthropic/claude-sonnet-4.5',
        fallback: ['openai/gpt-4o', 'anthropic/claude-haiku-4'],
        costTier: 2,
        maxRetries: 2,
        timeout: 45000,
      };
    }

    return preference;
  }

  /**
   * Calculate cost based on usage
   */
  private calculateCost(model: string, usage: { prompt_tokens: number; completion_tokens: number }): number {
    const costs = MODEL_COSTS[model];
    if (!costs) {
      console.warn(`[EnhancedLLMRouter] No cost data for model ${model}`);
      return 0;
    }

    const inputCost = (usage.prompt_tokens / 1000000) * costs.input;
    const outputCost = (usage.completion_tokens / 1000000) * costs.output;
    const totalCost = inputCost + outputCost;

    // Update daily/monthly costs
    this.dailyCost += totalCost;
    this.monthlyCost += totalCost;

    return totalCost;
  }

  /**
   * Record usage metrics
   */
  private recordMetrics(metrics: LLMUsageMetrics): void {
    this.usageMetrics.push(metrics);

    // Keep last 1000 metrics in memory
    if (this.usageMetrics.length > 1000) {
      this.usageMetrics = this.usageMetrics.slice(-1000);
    }

    
  }

  /**
   * Get active A/B test for agent + task
   */
  private getActiveABTest(agent: string, taskType: string): ABTest | null {
    return this.activeABTests.find(
      (test) => test.active && test.name.includes(agent) && test.name.includes(taskType)
    ) || null;
  }

  /**
   * Select model for A/B test based on traffic split
   */
  private selectABTestModel(test: ABTest): string {
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < test.models.length; i++) {
      cumulative += test.trafficSplit[i];
      if (random <= cumulative) {
        return test.models[i];
      }
    }

    return test.models[0];
  }

  /**
   * Update A/B test results
   */
  private updateABTestResults(testId: string, model: string, metric: number): void {
    const test = this.activeABTests.find((t) => t.id === testId);
    if (!test || !test.results) return;

    if (!test.results[model]) {
      test.results[model] = { samples: 0, avgMetric: 0 };
    }

    const result = test.results[model];
    result.avgMetric = (result.avgMetric * result.samples + metric) / (result.samples + 1);
    result.samples++;
  }

  /**
   * Get usage metrics
   */
  getMetrics(): {
    totalCalls: number;
    totalCost: number;
    dailyCost: number;
    monthlyCost: number;
    byAgent: Record<string, { calls: number; cost: number }>;
    byModel: Record<string, { calls: number; cost: number }>;
    byTier: Record<CostTier, { calls: number; cost: number }>;
  } {
    const byAgent: Record<string, { calls: number; cost: number }> = {};
    const byModel: Record<string, { calls: number; cost: number }> = {};
    const byTier: Record<CostTier, { calls: number; cost: number }> = { 1: { calls: 0, cost: 0 }, 2: { calls: 0, cost: 0 }, 3: { calls: 0, cost: 0 } };

    for (const metric of this.usageMetrics) {
      // By agent
      if (!byAgent[metric.agent]) {
        byAgent[metric.agent] = { calls: 0, cost: 0 };
      }
      byAgent[metric.agent].calls++;
      byAgent[metric.agent].cost += metric.cost;

      // By model
      if (!byModel[metric.model]) {
        byModel[metric.model] = { calls: 0, cost: 0 };
      }
      byModel[metric.model].calls++;
      byModel[metric.model].cost += metric.cost;

      // By tier (determine from model)
      const tier = this.getTierForModel(metric.model);
      byTier[tier].calls++;
      byTier[tier].cost += metric.cost;
    }

    return {
      totalCalls: this.usageMetrics.length,
      totalCost: this.usageMetrics.reduce((sum, m) => sum + m.cost, 0),
      dailyCost: this.dailyCost,
      monthlyCost: this.monthlyCost,
      byAgent,
      byModel,
      byTier,
    };
  }

  /**
   * Get cost tier for model
   */
  private getTierForModel(model: string): CostTier {
    const costs = MODEL_COSTS[model];
    if (!costs) return 2;

    const avgCost = (costs.input + costs.output) / 2;

    if (avgCost >= 10) return 1; // Premium
    if (avgCost >= 1) return 2;  // Standard
    return 3;                    // Budget
  }

  /**
   * Create A/B test
   */
  createABTest(test: Omit<ABTest, 'id' | 'results'>): ABTest {
    const newTest: ABTest = {
      ...test,
      id: `test-${Date.now()}`,
      results: {},
    };

    this.activeABTests.push(newTest);
    console.log(`[EnhancedLLMRouter] Created A/B test: ${newTest.name}`);

    return newTest;
  }

  /**
   * End A/B test and get results
   */
  endABTest(testId: string): ABTest | null {
    const test = this.activeABTests.find((t) => t.id === testId);
    if (!test) return null;

    test.active = false;
    test.endDate = new Date();

    // Determine winner
    if (test.results) {
      let bestModel = '';
      let bestMetric = Infinity;

      for (const [model, result] of Object.entries(test.results)) {
        if (result.avgMetric < bestMetric) {
          bestMetric = result.avgMetric;
          bestModel = model;
        }
      }

      if (bestModel && test.results[bestModel]) {
        test.results[bestModel].winner = true;
      }
    }

    console.log(`[EnhancedLLMRouter] Ended A/B test: ${test.name}, Winner: ${Object.keys(test.results || {}).find(k => test.results![k].winner)}`);

    return test;
  }

  /**
   * Reset daily costs (call at midnight)
   */
  resetDailyCosts(): void {
    this.dailyCost = 0;
    console.log('[EnhancedLLMRouter] Daily costs reset');
  }

  /**
   * Reset monthly costs (call on 1st of month)
   */
  resetMonthlyCosts(): void {
    this.monthlyCost = 0;
    console.log('[EnhancedLLMRouter] Monthly costs reset');
  }

  /**
   * Update model strategy (for admin UI)
   */
  updateModelStrategy(strategy: Partial<AgentTaskStrategy>): void {
    this.modelStrategy = { ...this.modelStrategy, ...strategy } as AgentTaskStrategy;
    console.log('[EnhancedLLMRouter] Model strategy updated');
  }

  /**
   * Update cost limits (for admin UI)
   */
  updateCostLimits(limits: Partial<CostLimit>): void {
    this.costLimits = { ...this.costLimits, ...limits };
    console.log('[EnhancedLLMRouter] Cost limits updated');
  }
}

/**
 * Singleton instance
 */
let enhancedLLMRouterInstance: EnhancedLLMRouter | null = null;

export function getEnhancedLLMRouter(storage: IStorage): EnhancedLLMRouter {
  if (!enhancedLLMRouterInstance) {
    enhancedLLMRouterInstance = new EnhancedLLMRouter({ storage });
  }
  return enhancedLLMRouterInstance;
}
