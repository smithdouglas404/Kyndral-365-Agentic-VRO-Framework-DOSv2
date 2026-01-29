/**
 * LANGFLOW SERVICE
 *
 * Integration with DataStax Langflow for visual workflow orchestration
 * Replaces complex TypeScript MCP orchestration with visual no-code flows
 */

export interface LangflowConfig {
  apiUrl: string;
  apiKey: string;
  orgId?: string;
  projectId?: string;
}

export interface LangflowFlowInput {
  [key: string]: any;
}

export interface LangflowFlowResult {
  flowId: string;
  runId: string;
  status: 'success' | 'error' | 'running';
  outputs: any;
  error?: string;
  executionTime?: number;
}

export interface LangflowFlow {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class LangflowService {
  private config: LangflowConfig;
  private baseUrl: string;

  constructor(config: LangflowConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Execute a Langflow flow with input data
   *
   * @param flowId - The flow ID or name
   * @param input - Input data for the flow
   * @param tweaks - Optional flow parameter overrides
   */
  async executeFlow(
    flowId: string,
    input: LangflowFlowInput,
    tweaks?: Record<string, any>
  ): Promise<LangflowFlowResult> {
    try {
      const startTime = Date.now();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/run/${flowId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input_value: input,
          tweaks: tweaks || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Langflow API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      console.log(`[Langflow] Flow ${flowId} executed in ${executionTime}ms`);

      return {
        flowId,
        runId: result.run_id || result.session_id,
        status: result.status === 'error' ? 'error' : 'success',
        outputs: result.outputs || result,
        error: result.error,
        executionTime,
      };
    } catch (error: any) {
      console.error(`[Langflow] Flow execution failed for ${flowId}:`, error.message);
      return {
        flowId,
        runId: '',
        status: 'error',
        outputs: null,
        error: error.message,
      };
    }
  }

  /**
   * List all available flows via MCP endpoint
   * DataStax Langflow exposes flows through MCP protocol
   */
  async listFlows(): Promise<LangflowFlow[]> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      // DataStax Langflow uses MCP protocol endpoint
      let mcpEndpoint = `${this.baseUrl}/mcp/project/${this.config.projectId}`;

      const response = await fetch(mcpEndpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.warn('[Langflow] Cannot access MCP endpoint:', response.status);
        return [];
      }

      const data = await response.json();

      // MCP endpoint returns { tools: [...] }
      if (data.tools && Array.isArray(data.tools)) {
        return data.tools.map((tool: any) => ({
          id: tool.id,
          name: tool.name || tool.action_name,
          description: tool.description || tool.action_description,
          action_name: tool.action_name,
          mcp_enabled: tool.mcp_enabled,
        }));
      }

      return [];
    } catch (error: any) {
      console.error('[Langflow] Failed to list flows:', error.message);
      return [];
    }
  }

  /**
   * Get flow details
   */
  async getFlow(flowId: string): Promise<LangflowFlow | null> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/flows/${flowId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get flow: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`[Langflow] Failed to get flow ${flowId}:`, error.message);
      return null;
    }
  }

  /**
   * Test connection to Langflow
   */
  async testConnection(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/version`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.error(`[Langflow] Connection test failed: ${response.status}`);
        return false;
      }

      const version = await response.json();
      console.log(`[Langflow] Connected successfully. Version: ${version.version || 'unknown'}`);
      return true;
    } catch (error: any) {
      console.error('[Langflow] Connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Execute a flow and wait for completion (polling)
   */
  async executeFlowSync(
    flowId: string,
    input: LangflowFlowInput,
    options: {
      timeoutMs?: number;
      pollIntervalMs?: number;
    } = {}
  ): Promise<LangflowFlowResult> {
    const { timeoutMs = 60000, pollIntervalMs = 1000 } = options;
    const startTime = Date.now();

    // Start execution
    const result = await this.executeFlow(flowId, input);

    if (result.status === 'error') {
      return result;
    }

    if (result.status === 'success') {
      return result;
    }

    // Poll for completion if status is 'running'
    const runId = result.runId;
    while (true) {
      if (Date.now() - startTime > timeoutMs) {
        return {
          ...result,
          status: 'error',
          error: `Flow execution timeout after ${timeoutMs}ms`,
        };
      }

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      // Check status (this endpoint may vary by Langflow version)
      const status = await this.getRunStatus(flowId, runId);
      if (status === 'completed' || status === 'success') {
        return { ...result, status: 'success' };
      }
      if (status === 'failed' || status === 'error') {
        return { ...result, status: 'error', error: 'Flow execution failed' };
      }
    }
  }

  /**
   * Get run status (may need to be adjusted based on Langflow API version)
   */
  private async getRunStatus(flowId: string, runId: string): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/runs/${runId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return 'unknown';
      }

      const data = await response.json();
      return data.status || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get flow by ID
   */
  async getFlowById(flowId: string): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'x-api-key': this.config.apiKey,
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/flows/${flowId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get flow: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`[Langflow] Failed to get flow ${flowId}:`, error.message);
      return null;
    }
  }

  /**
   * Update flow
   */
  async updateFlow(flowId: string, updates: any): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/flows/${flowId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update flow: ${response.status}`);
      }

      console.log(`[Langflow] Flow ${flowId} updated successfully`);
      return await response.json();
    } catch (error: any) {
      console.error(`[Langflow] Failed to update flow:`, error.message);
      return null;
    }
  }

  /**
   * Upload custom component
   */
  async uploadCustomComponent(code: string, name: string): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      const response = await fetch(`${this.baseUrl}/custom_component`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code,
          name,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload component: ${response.status} - ${errorText}`);
      }

      console.log(`[Langflow] Custom component '${name}' uploaded successfully`);
      return await response.json();
    } catch (error: any) {
      console.error(`[Langflow] Failed to upload component:`, error.message);
      return null;
    }
  }

  /**
   * Upload flow from JSON
   */
  async uploadFlowFromJSON(flowJSON: any, folderId?: string): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      };

      if (this.config.orgId) {
        headers['X-DataStax-Current-Org'] = this.config.orgId;
      }

      let url = `${this.baseUrl}/flows/upload/`;
      if (folderId) {
        url += `?folder_id=${folderId}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(flowJSON),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload flow: ${response.status} - ${errorText}`);
      }

      console.log(`[Langflow] Flow uploaded successfully`);
      return await response.json();
    } catch (error: any) {
      console.error(`[Langflow] Failed to upload flow:`, error.message);
      return null;
    }
  }
}

/**
 * Initialize Langflow service from environment variables
 */
export function initializeLangflowService(): LangflowService | null {
  const apiUrl = process.env.LANGFLOW_API_URL;
  const apiKey = process.env.LANGFLOW_API_KEY;
  const orgId = process.env.LANGFLOW_ORG_ID;
  const projectId = process.env.LANGFLOW_PROJECT_ID;

  if (!apiUrl || !apiKey) {
    console.warn('[Langflow] Not configured - missing LANGFLOW_API_URL or LANGFLOW_API_KEY');
    return null;
  }

  const service = new LangflowService({ apiUrl, apiKey, orgId, projectId });
  console.log('[Langflow] Service initialized');
  return service;
}
