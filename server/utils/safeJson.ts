/**
 * SAFE JSON UTILITIES
 *
 * Provides safe JSON parsing and stringification with proper error handling
 * to prevent crashes from malformed JSON data.
 */

export interface SafeJsonOptions {
  fallback?: any;
  logErrors?: boolean;
  context?: string;
}

/**
 * Safely parse JSON with error handling
 * @param text - JSON string to parse
 * @param options - Options for fallback and logging
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = any>(
  text: string | null | undefined,
  options: SafeJsonOptions = {}
): T | null {
  const { fallback = null, logErrors = true, context = 'Unknown' } = options;

  // Handle null/undefined input
  if (text === null || text === undefined || text === '') {
    return fallback;
  }

  // Handle non-string input
  if (typeof text !== 'string') {
    if (logErrors) {
      console.warn(`[SafeJson] ${context}: Input is not a string, type: ${typeof text}`);
    }
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (logErrors) {
      console.error(`[SafeJson] ${context}: Failed to parse JSON:`, error);
      console.error(`[SafeJson] ${context}: Input text (first 200 chars):`, text.substring(0, 200));
    }
    return fallback;
  }
}

/**
 * Safely stringify object with error handling
 * @param obj - Object to stringify
 * @param options - Options for fallback and logging
 * @returns JSON string or fallback value
 */
export function safeJsonStringify(
  obj: any,
  options: SafeJsonOptions = {}
): string {
  const { fallback = '{}', logErrors = true, context = 'Unknown' } = options;

  try {
    return JSON.stringify(obj);
  } catch (error) {
    if (logErrors) {
      console.error(`[SafeJson] ${context}: Failed to stringify object:`, error);
    }
    return fallback as string;
  }
}

/**
 * Extract JSON from text that might contain markdown code blocks
 * Common pattern: ```json\n{...}\n```
 */
export function extractJsonFromText(text: string, options: SafeJsonOptions = {}): any | null {
  const { fallback = null, logErrors = true, context = 'Unknown' } = options;

  if (!text) return fallback;

  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to extract from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return safeJsonParse(jsonMatch[1], { fallback, logErrors, context: `${context} (from code block)` });
    }

    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return safeJsonParse(objectMatch[0], { fallback, logErrors, context: `${context} (extracted object)` });
    }

    if (logErrors) {
      console.error(`[SafeJson] ${context}: Could not extract JSON from text`);
    }
    return fallback;
  }
}
