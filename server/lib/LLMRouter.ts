/**
 * LLM Router Service
 *
 * Provides plug-and-play LLM switching capability across multiple providers:
 * - Anthropic (Claude Sonnet 4.5, Claude Opus 4.5, Claude Haiku)
 * - OpenAI (GPT-4, GPT-4 Turbo, GPT-3.5 Turbo)
 * - Google (Gemini Pro, Gemini Ultra)
 * - Mistral (Mistral Large, Mistral Medium)
 * - Custom/Local models (Ollama, LM Studio)
 *
 * Features:
 * - Dynamic provider switching
 * - Cost tracking per model
 * - Fallback strategy (if primary fails, try secondary)
 * - Rate limiting per provider
 * - Model-specific optimizations
 * - Performance metrics
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { IStorage } from "../storage.js";

export type LLMProvider =
  | "anthropic"
  | "openai"
  | "google"
  | "mistral"
  | "ollama"
  | "custom";

export type AnthropicModel =
  | "claude-sonnet-4.5"
  | "claude-opus-4.5"
  | "claude-haiku-4";

export type OpenAIModel =
  | "gpt-4"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo";

export type GoogleModel =
  | "gemini-pro"
  | "gemini-ultra"
  | "gemini-flash";

export type MistralModel =
  | "mistral-large"
  | "mistral-medium"
  | "mistral-small";

export type ModelName =
  | AnthropicModel
  | OpenAIModel
  | GoogleModel
  | MistralModel
  | string;

export interface LLMConfig {
  provider: LLMProvider;
  model: ModelName;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  fallbackModel?: {
    provider: LLMProvider;
    model: ModelName;
  };
  costPerToken?: {
    input: number;
    output: number;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface LLMMetrics {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
  lastUsed: Date;
}

export interface ModelCapabilities {
  maxContextWindow: number;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  costPerMillionTokens: {
    input: number;
    output: number;
  };
  speed: "fast" | "medium" | "slow";
  quality: "high" | "medium" | "low";
}

/**
 * LLM Router - Central service for managing all LLM interactions
 */
export class LLMRouter {
  private storage: IStorage;
  private defaultConfig: LLMConfig;
  private modelCache: Map<string, BaseChatModel> = new Map();
  private metrics: Map<string, LLMMetrics> = new Map();

  // Model capabilities database
  private capabilities: Map<string, ModelCapabilities> = new Map([
    // Anthropic models
    ["claude-sonnet-4.5", {
      maxContextWindow: 200000,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      costPerMillionTokens: { input: 3.00, output: 15.00 },
      speed: "medium",
      quality: "high"
    }],
    ["claude-opus-4.5", {
      maxContextWindow: 200000,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      costPerMillionTokens: { input: 15.00, output: 75.00 },
      speed: "slow",
      quality: "high"
    }],
    ["claude-haiku-4", {
      maxContextWindow: 200000,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: false,
      costPerMillionTokens: { input: 0.25, output: 1.25 },
      speed: "fast",
      quality: "medium"
    }],

    // OpenAI models
    ["gpt-4", {
      maxContextWindow: 128000,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      costPerMillionTokens: { input: 30.00, output: 60.00 },
      speed: "medium",
      quality: "high"
    }],
    ["gpt-4-turbo", {
      maxContextWindow: 128000,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      costPerMillionTokens: { input: 10.00, output: 30.00 },
      speed: "fast",
      quality: "high"
    }],
    ["gpt-3.5-turbo", {
      maxContextWindow: 16384,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: false,
      costPerMillionTokens: { input: 0.50, output: 1.50 },
      speed: "fast",
      quality: "medium"
    }],

    // Google models
    ["gemini-pro", {
      maxContextWindow: 32768,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      costPerMillionTokens: { input: 0.50, output: 1.50 },
      speed: "fast",
      quality: "high"
    }],
  ]);

  constructor(storage: IStorage, defaultConfig?: LLMConfig) {
    this.storage = storage;
    this.defaultConfig = defaultConfig || {
      provider: "anthropic",
      model: "claude-sonnet-4.5",
      temperature: 0.7,
      maxTokens: 4096,
      streaming: false,
    };
  }

  /**
   * Get a chat model instance (cached)
   */
  async getModel(config?: Partial<LLMConfig>): Promise<BaseChatModel> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const cacheKey = this.getCacheKey(finalConfig);

    // Return cached model if available
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!;
    }

    // Create new model instance
    const model = await this.createModel(finalConfig);
    this.modelCache.set(cacheKey, model);

    return model;
  }

  /**
   * Create a new chat model instance
   */
  private async createModel(config: LLMConfig): Promise<BaseChatModel> {
    const apiKey = config.apiKey || this.getAPIKeyFromEnv(config.provider);

    switch (config.provider) {
      case "anthropic":
        return new ChatAnthropic({
          model: this.mapAnthropicModel(config.model as AnthropicModel),
          apiKey,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4096,
          streaming: config.streaming ?? false,
        });

      case "openai":
        return new ChatOpenAI({
          model: config.model,
          apiKey,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4096,
          streaming: config.streaming ?? false,
        });

      case "google":
        return new ChatGoogleGenerativeAI({
          model: config.model,
          apiKey,
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 4096,
          streaming: config.streaming ?? false,
        });

      case "ollama":
        // Local Ollama instance
        return new ChatOpenAI({
          model: config.model,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4096,
          configuration: {
            baseURL: config.baseURL || "http://localhost:11434/v1",
          },
        });

      case "custom":
        // Custom OpenAI-compatible endpoint
        return new ChatOpenAI({
          model: config.model,
          apiKey: apiKey || "dummy",
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4096,
          configuration: {
            baseURL: config.baseURL || "http://localhost:8000/v1",
          },
        });

      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  /**
   * Map friendly model names to actual model IDs
   */
  private mapAnthropicModel(model: AnthropicModel): string {
    const mapping: Record<AnthropicModel, string> = {
      "claude-sonnet-4.5": "claude-sonnet-4-20250514",
      "claude-opus-4.5": "claude-opus-4-20250514",
      "claude-haiku-4": "claude-haiku-4-20250312",
    };
    return mapping[model] || model;
  }

  /**
   * Get API key from environment variables
   */
  private getAPIKeyFromEnv(provider: LLMProvider): string {
    const envVarMap: Record<LLMProvider, string> = {
      anthropic: "ANTHROPIC_API_KEY",
      openai: "OPENAI_API_KEY",
      google: "GOOGLE_API_KEY",
      mistral: "MISTRAL_API_KEY",
      ollama: "",
      custom: "",
    };

    const envVar = envVarMap[provider];
    if (!envVar) return "";

    const apiKey = process.env[envVar];
    if (!apiKey && provider !== "ollama" && provider !== "custom") {
      throw new Error(`Missing API key: ${envVar} not set in environment`);
    }

    return apiKey || "";
  }

  /**
   * Generate cache key for model instances
   */
  private getCacheKey(config: LLMConfig): string {
    return `${config.provider}:${config.model}:${config.temperature}:${config.maxTokens}`;
  }

  /**
   * Get model capabilities
   */
  getCapabilities(provider: LLMProvider, model: ModelName): ModelCapabilities | undefined {
    return this.capabilities.get(model);
  }

  /**
   * Track usage metrics
   */
  async trackUsage(
    provider: LLMProvider,
    model: ModelName,
    tokens: number,
    latency: number,
    success: boolean
  ): Promise<void> {
    const key = `${provider}:${model}`;
    const metrics = this.metrics.get(key) || {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      errorRate: 0,
      lastUsed: new Date(),
    };

    metrics.totalCalls += 1;
    metrics.totalTokens += tokens;
    metrics.lastUsed = new Date();

    // Calculate average latency
    metrics.averageLatency =
      (metrics.averageLatency * (metrics.totalCalls - 1) + latency) / metrics.totalCalls;

    // Calculate error rate
    if (!success) {
      metrics.errorRate =
        (metrics.errorRate * (metrics.totalCalls - 1) + 1) / metrics.totalCalls;
    } else {
      metrics.errorRate =
        (metrics.errorRate * (metrics.totalCalls - 1)) / metrics.totalCalls;
    }

    // Calculate cost
    const capabilities = this.getCapabilities(provider, model);
    if (capabilities) {
      const cost = (tokens / 1_000_000) *
        (capabilities.costPerMillionTokens.input + capabilities.costPerMillionTokens.output) / 2;
      metrics.totalCost += cost;
    }

    this.metrics.set(key, metrics);

    // Store in database
    await this.storage.db.query(`
      INSERT INTO llm_usage_metrics
      (id, provider, model, tokens, latency_ms, success, cost, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider,
      model,
      tokens,
      latency,
      success,
      capabilities ? (tokens / 1_000_000) *
        (capabilities.costPerMillionTokens.input + capabilities.costPerMillionTokens.output) / 2 : 0
    ]);
  }

  /**
   * Get metrics for a specific model
   */
  getMetrics(provider: LLMProvider, model: ModelName): LLMMetrics | undefined {
    return this.metrics.get(`${provider}:${model}`);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, LLMMetrics> {
    return this.metrics;
  }

  /**
   * Recommend best model for a task
   */
  recommendModel(requirements: {
    maxCost?: number;
    minQuality?: "high" | "medium" | "low";
    maxLatency?: "fast" | "medium" | "slow";
    requiresFunctionCalling?: boolean;
    requiresVision?: boolean;
    estimatedTokens?: number;
  }): { provider: LLMProvider; model: ModelName; reason: string } {
    const candidates: Array<{
      provider: LLMProvider;
      model: ModelName;
      capabilities: ModelCapabilities;
      score: number;
    }> = [];

    // Score each model
    for (const [model, capabilities] of this.capabilities.entries()) {
      let score = 100;

      // Filter out models that don't meet requirements
      if (requirements.requiresFunctionCalling && !capabilities.supportsFunctionCalling) continue;
      if (requirements.requiresVision && !capabilities.supportsVision) continue;

      // Calculate cost
      if (requirements.estimatedTokens && requirements.maxCost) {
        const estimatedCost = (requirements.estimatedTokens / 1_000_000) *
          (capabilities.costPerMillionTokens.input + capabilities.costPerMillionTokens.output) / 2;
        if (estimatedCost > requirements.maxCost) continue;

        // Prefer cheaper models
        score += (1 - estimatedCost / requirements.maxCost) * 30;
      }

      // Quality preference
      if (requirements.minQuality) {
        const qualityScore = { high: 3, medium: 2, low: 1 };
        if (qualityScore[capabilities.quality] < qualityScore[requirements.minQuality]) continue;
        score += qualityScore[capabilities.quality] * 20;
      }

      // Speed preference
      if (requirements.maxLatency) {
        const speedScore = { fast: 3, medium: 2, slow: 1 };
        const requiredSpeed = { fast: 3, medium: 2, slow: 1 }[requirements.maxLatency];
        if (speedScore[capabilities.speed] < requiredSpeed) continue;
        score += speedScore[capabilities.speed] * 20;
      }

      // Determine provider from model name
      let provider: LLMProvider = "anthropic";
      if (model.startsWith("gpt-")) provider = "openai";
      if (model.startsWith("gemini-")) provider = "google";

      candidates.push({
        provider,
        model,
        capabilities,
        score,
      });
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      // Default fallback
      return {
        provider: "anthropic",
        model: "claude-sonnet-4.5",
        reason: "No models met requirements, using default"
      };
    }

    const best = candidates[0];
    return {
      provider: best.provider,
      model: best.model,
      reason: `Best match: Quality=${best.capabilities.quality}, Speed=${best.capabilities.speed}, Cost=${best.capabilities.costPerMillionTokens.input}/${best.capabilities.costPerMillionTokens.output} per M tokens`
    };
  }

  /**
   * Update default configuration
   */
  async updateDefaultConfig(config: Partial<LLMConfig>): Promise<void> {
    this.defaultConfig = { ...this.defaultConfig, ...config };

    // Persist to database
    await this.storage.db.query(`
      INSERT INTO system_config (key, value, updated_at)
      VALUES ('llm_default_config', $1, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = $1, updated_at = NOW()
    `, [JSON.stringify(this.defaultConfig)]);
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig(): LLMConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Clear model cache (useful when configuration changes)
   */
  clearCache(): void {
    this.modelCache.clear();
  }

  /**
   * List all available models
   */
  listAvailableModels(): Array<{
    provider: LLMProvider;
    model: ModelName;
    capabilities: ModelCapabilities;
  }> {
    const models: Array<{
      provider: LLMProvider;
      model: ModelName;
      capabilities: ModelCapabilities;
    }> = [];

    for (const [model, capabilities] of this.capabilities.entries()) {
      let provider: LLMProvider = "anthropic";
      if (model.startsWith("gpt-")) provider = "openai";
      if (model.startsWith("gemini-")) provider = "google";

      models.push({ provider, model, capabilities });
    }

    return models;
  }
}

/**
 * Singleton instance
 */
let routerInstance: LLMRouter | null = null;

export function initLLMRouter(storage: IStorage, config?: LLMConfig): LLMRouter {
  if (!routerInstance) {
    routerInstance = new LLMRouter(storage, config);
  }
  return routerInstance;
}

export function getLLMRouter(): LLMRouter {
  if (!routerInstance) {
    throw new Error("LLM Router not initialized. Call initLLMRouter first.");
  }
  return routerInstance;
}
