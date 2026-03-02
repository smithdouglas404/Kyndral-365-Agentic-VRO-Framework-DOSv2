export interface RulebricksConfig {
  apiUrl: string;
  apiKey: string;
}

export interface RuleResult {
  slug: string;
  success: boolean;
  result: any;
  executionTime: number;
  error?: string;
}

export interface RuleDefinition {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export class RulebricksService {
  private config: RulebricksConfig;
  private baseUrl: string;

  constructor(config: RulebricksConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl.replace(/\/$/, '');
  }

  async solveRule(slug: string, request: Record<string, any>): Promise<RuleResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ slug, request }),
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          slug,
          success: false,
          result: null,
          executionTime,
          error: `Rulebricks API error (${response.status}): ${errorText}`,
        };
      }

      const result = await response.json();

      return {
        slug,
        success: true,
        result,
        executionTime,
      };
    } catch (error: any) {
      return {
        slug,
        success: false,
        result: null,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async bulkSolve(slug: string, requests: Record<string, any>[]): Promise<RuleResult[]> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/bulk-solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ slug, requests }),
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return [{
          slug,
          success: false,
          result: null,
          executionTime,
          error: `Rulebricks API error (${response.status}): ${errorText}`,
        }];
      }

      const results = await response.json();

      if (Array.isArray(results)) {
        return results.map((r: any) => ({
          slug,
          success: true,
          result: r,
          executionTime,
        }));
      }

      return [{
        slug,
        success: true,
        result: results,
        executionTime,
      }];
    } catch (error: any) {
      return [{
        slug,
        success: false,
        result: null,
        executionTime: Date.now() - startTime,
        error: error.message,
      }];
    }
  }

  async listRules(): Promise<RuleDefinition[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rules`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error(`[Rulebricks] List rules failed (${response.status})`);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error(`[Rulebricks] List rules error: ${error.message}`);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rules`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

let rulebricksInstance: RulebricksService | null = null;

export function initializeRulebricksService(): RulebricksService | null {
  const apiKey = process.env.RULEBRICKS_API_KEY;
  const apiUrl = process.env.RULEBRICKS_API_URL || 'https://rulebricks.com/api/v1';

  if (!apiKey) {
    console.log('[Rulebricks] Not configured — set RULEBRICKS_API_KEY');
    return null;
  }

  rulebricksInstance = new RulebricksService({ apiUrl, apiKey });
  console.log('[Rulebricks] Service initialized');
  return rulebricksInstance;
}

export function getRulebricksService(): RulebricksService | null {
  return rulebricksInstance;
}
