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
  private anthropicKey: string | undefined;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  get hasAnthropicFallback(): boolean {
    return !!this.anthropicKey;
  }

  /**
   * Create a chat completion through OpenRouter
   * Falls back to direct Anthropic if OpenRouter unavailable
   */
  async chat(
    messages: OpenRouterMessage[],
    options: OpenRouterOptions = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      maxTokens = 4096,
      temperature = 0.7,
    } = options;

    // Route through OpenRouter if available
    if (this.apiKey) {
      return this.callOpenRouter(messages, { model, maxTokens, temperature });
    }

    // Fallback to direct Anthropic
    if (this.anthropicKey) {
      console.log('[OpenRouterClient] Falling back to direct Anthropic');
      return this.callAnthropicDirect(messages, { model, maxTokens, temperature });
    }

    throw new Error('No API keys configured. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY');
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
          'HTTP-Referer': 'https://kyndryl365.ai',
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

      // Log usage for cost tracking
      if (data.usage) {
        console.log(`[OpenRouterClient] ${model}: ${data.usage.total_tokens} tokens`);
      }

      return content;
    } catch (error) {
      console.error('[OpenRouterClient] Request failed:', error);
      
      // Fall back to direct Anthropic if available
      if (this.anthropicKey) {
        console.log('[OpenRouterClient] Falling back to direct Anthropic');
        return this.callAnthropicDirect(messages, options);
      }
      
      throw error;
    }
  }

  /**
   * Direct Anthropic API call (fallback)
   */
  private async callAnthropicDirect(
    messages: OpenRouterMessage[],
    options: { model: string; maxTokens: number; temperature: number }
  ): Promise<string> {
    const { maxTokens, temperature } = options;

    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.mapToAnthropicModel(options.model),
          max_tokens: maxTokens,
          temperature,
          system: systemMessage?.content || 'You are a helpful assistant.',
          messages: userMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('Empty response from Anthropic');
      }

      return content;
    } catch (error) {
      console.error('[OpenRouterClient] Anthropic fallback failed:', error);
      throw error;
    }
  }

  /**
   * Map OpenRouter model IDs to Anthropic model IDs for direct fallback
   */
  private mapToAnthropicModel(openRouterModel: string): string {
    const mapping: Record<string, string> = {
      'anthropic/claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
      'anthropic/claude-3.5-sonnet': 'claude-sonnet-4-20250514',
      'anthropic/claude-3-haiku': 'claude-3-haiku-20240307',
      'meta-llama/llama-3.1-8b-instruct': 'claude-sonnet-4-20250514',
      'mistralai/mixtral-8x7b-instruct': 'claude-sonnet-4-20250514',
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
