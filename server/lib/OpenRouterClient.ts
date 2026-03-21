/**
 * OPENROUTER CLIENT
 * 
 * Unified client for routing ALL LLM calls through OpenRouter.
 * This provides:
 * - Cost optimization (OpenRouter often cheaper)
 * - Unified billing dashboard
 * - Fallback between providers
 * - Single API key management
 * 
 * Version: 2.0.0
 * Date: 2026-01-29
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-20250514';
const FALLBACK_MODEL = 'anthropic/claude-3.5-sonnet';

class OpenRouterClient {
  private apiKey: string | undefined;
  private baseUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
  private dailyTokenCount: number = 0;
  private dailyTokenResetDate: string = '';
  private dailyTokenLimit: number = 500_000;
  private dailyCostEstimate: number = 0;
  private dailyCostLimit: number = 5.00;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.resetDailyCountersIfNeeded();
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  get hasAnthropicFallback(): boolean {
    return false;
  }

  private resetDailyCountersIfNeeded(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.dailyTokenResetDate !== today) {
      this.dailyTokenCount = 0;
      this.dailyCostEstimate = 0;
      this.dailyTokenResetDate = today;
    }
  }

  private checkSpendingCap(): void {
    this.resetDailyCountersIfNeeded();
    if (this.dailyCostEstimate >= this.dailyCostLimit) {
      throw new Error(`[OpenRouterClient] Daily spending cap reached ($${this.dailyCostEstimate.toFixed(2)}/$${this.dailyCostLimit.toFixed(2)}). All LLM calls blocked until tomorrow.`);
    }
    if (this.dailyTokenCount >= this.dailyTokenLimit) {
      throw new Error(`[OpenRouterClient] Daily token limit reached (${this.dailyTokenCount}/${this.dailyTokenLimit}). All LLM calls blocked until tomorrow.`);
    }
  }

  private trackUsage(tokens: number, model: string): void {
    this.dailyTokenCount += tokens;
    const costPer1M: Record<string, number> = {
      'meta-llama/llama-3.1-8b-instruct': 0.10,
      'mistralai/mixtral-8x7b-instruct': 0.27,
      'openai/gpt-4o-mini': 0.15,
      'openai/gpt-4o': 5.00,
      'anthropic/claude-3.5-sonnet': 3.00,
      'anthropic/claude-sonnet-4-20250514': 3.00,
    };
    const rate = costPer1M[model] || 3.00;
    this.dailyCostEstimate += (tokens / 1_000_000) * rate;

    if (this.dailyCostEstimate >= this.dailyCostLimit * 0.8) {
      console.warn(`[OpenRouterClient] ⚠️ Daily spend at $${this.dailyCostEstimate.toFixed(2)}/$${this.dailyCostLimit.toFixed(2)} (${((this.dailyCostEstimate / this.dailyCostLimit) * 100).toFixed(0)}%)`);
    }
  }

  getSpendingStats(): { dailyTokens: number; dailyCost: number; dailyTokenLimit: number; dailyCostLimit: number; date: string } {
    this.resetDailyCountersIfNeeded();
    return {
      dailyTokens: this.dailyTokenCount,
      dailyCost: this.dailyCostEstimate,
      dailyTokenLimit: this.dailyTokenLimit,
      dailyCostLimit: this.dailyCostLimit,
      date: this.dailyTokenResetDate,
    };
  }

  async chat(
    messages: OpenRouterMessage[],
    options: OpenRouterOptions = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      maxTokens = 4096,
      temperature = 0.7,
    } = options;

    this.checkSpendingCap();

    if (this.apiKey) {
      return this.callOpenRouter(messages, { model, maxTokens, temperature });
    }

    throw new Error('[OpenRouterClient] No OPENROUTER_API_KEY configured. Direct Anthropic fallback is disabled for cost safety.');
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(
    messages: OpenRouterMessage[],
    options: { model: string; maxTokens: number; temperature: number }
  ): Promise<string> {
    const { model, maxTokens, temperature } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://kyndryl365.ai',
          'X-Title': 'Kyndryl Clarity',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[OpenRouterClient] Error:', error);
        
        // Try fallback model if primary fails
        if (model === DEFAULT_MODEL) {
          console.log('[OpenRouterClient] Retrying with fallback model');
          return this.callOpenRouter(messages, { ...options, model: FALLBACK_MODEL });
        }
        
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenRouter');
      }

      if (data.usage) {
        this.trackUsage(data.usage.total_tokens, model);
        console.log(`[OpenRouterClient] ${model}: ${data.usage.total_tokens} tokens | Daily: $${this.dailyCostEstimate.toFixed(3)}`);
      }

      return content;
    } catch (error) {
      console.error('[OpenRouterClient] Request failed:', error);
      throw error;
    }
  }

  /**
   * Map OpenRouter model IDs (kept for compatibility but no longer used for Anthropic fallback)
   */
  private mapToAnthropicModel(openRouterModel: string): string {
    const mapping: Record<string, string> = {
      'anthropic/claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
      'anthropic/claude-3.5-sonnet': 'claude-sonnet-4-20250514',
      'anthropic/claude-3-haiku': 'claude-3-haiku-20240307',
      'meta-llama/llama-3.1-8b-instruct': 'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mixtral-8x7b-instruct': 'mistralai/mixtral-8x7b-instruct',
      'openai/gpt-4o-mini': 'claude-sonnet-4-20250514',
    };
    return mapping[openRouterModel] || 'claude-sonnet-4-20250514';
  }

  /**
   * Helper: Create messages with system prompt
   */
  createMessages(systemPrompt: string, userPrompt: string): OpenRouterMessage[] {
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }
}

// Singleton instance
export const openRouterClient = new OpenRouterClient();

// Helper function for quick calls
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: OpenRouterOptions
): Promise<string> {
  const messages = openRouterClient.createMessages(systemPrompt, userPrompt);
  return openRouterClient.chat(messages, options);
}
