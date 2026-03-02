import { RulebricksClient } from "@rulebricks/sdk";

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
  folder?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
}

export interface FlowDefinition {
  id: string;
  slug: string;
  name: string;
  description?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowExecutionResult {
  flowSlug: string;
  success: boolean;
  outputs: Record<string, any>;
  executionTime: number;
  error?: string;
}

export class RulebricksService {
  private client: RulebricksClient;

  constructor(apiKey: string) {
    this.client = new RulebricksClient({
      environment: "https://rulebricks.com/api/v1",
      apiKey,
    });
  }

  /**
   * Solve a rule with the given input
   */
  async solveRule(
    slug: string,
    request: Record<string, any>,
    _metadata?: { agentId?: string; projectId?: string; tags?: string[] }
  ): Promise<RuleResult> {
    const startTime = Date.now();

    try {
      const result = await this.client.rules.solve(slug, request);
      const executionTime = Date.now() - startTime;

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

  /**
   * Bulk solve a rule with multiple inputs
   */
  async bulkSolve(slug: string, requests: Record<string, any>[]): Promise<RuleResult[]> {
    const startTime = Date.now();

    try {
      const results = await this.client.rules.bulkSolve(slug, requests);
      const executionTime = Date.now() - startTime;

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

  /**
   * List all rules
   */
  async listRules(): Promise<RuleDefinition[]> {
    try {
      const rules = await this.client.assets.rules.list({});
      return (rules || []).map((r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        folder: r.folder,
        published: r.published,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        requestSchema: r.request_schema,
        responseSchema: r.response_schema,
      }));
    } catch (error: any) {
      console.error(`[Rulebricks] List rules error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get a specific rule by slug
   */
  async getRule(slug: string): Promise<RuleDefinition | null> {
    try {
      const rules = await this.listRules();
      return rules.find(r => r.slug === slug) || null;
    } catch (error: any) {
      console.error(`[Rulebricks] Get rule error: ${error.message}`);
      return null;
    }
  }

  /**
   * Test connection to Rulebricks
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.assets.rules.list({});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all flows
   */
  async listFlows(): Promise<FlowDefinition[]> {
    try {
      const flows = await this.client.assets.flows.list({});
      return (flows || []).map((f: any) => ({
        id: f.id,
        slug: f.slug,
        name: f.name,
        description: f.description,
        published: f.published,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }));
    } catch (error: any) {
      console.error(`[Rulebricks] List flows error: ${error.message}`);
      return [];
    }
  }

  /**
   * Execute a flow
   */
  async executeFlow(
    slug: string,
    input: Record<string, any>,
    _metadata?: { agentId?: string; projectId?: string; tags?: string[] }
  ): Promise<FlowExecutionResult> {
    const startTime = Date.now();

    try {
      const result = await this.client.flows.execute(slug, input);
      const executionTime = Date.now() - startTime;

      return {
        flowSlug: slug,
        success: true,
        outputs: result || {},
        executionTime,
      };
    } catch (error: any) {
      return {
        flowSlug: slug,
        success: false,
        outputs: {},
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Get usage statistics
   */
  async getUsage(): Promise<any> {
    try {
      return await this.client.assets.getUsage();
    } catch (error: any) {
      console.error(`[Rulebricks] Get usage error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get the raw SDK client for advanced operations
   */
  getClient(): RulebricksClient {
    return this.client;
  }
}

let rulebricksInstance: RulebricksService | null = null;

export function initializeRulebricksService(): RulebricksService | null {
  const apiKey = process.env.RULEBRICKS_API_KEY;

  if (!apiKey) {
    console.log('[Rulebricks] Not configured — set RULEBRICKS_API_KEY');
    return null;
  }

  rulebricksInstance = new RulebricksService(apiKey);
  console.log('[Rulebricks] Service initialized with SDK');
  return rulebricksInstance;
}

export function getRulebricksService(): RulebricksService | null {
  return rulebricksInstance;
}
