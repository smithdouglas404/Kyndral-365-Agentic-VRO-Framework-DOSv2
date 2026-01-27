/**
 * LANGFLOW MCP CLIENT
 * 
 * Connects to Langflow's MCP server to call flows as tools.
 * Uses streamable HTTP transport per Langflow MCP docs.
 */

export interface LangflowMCPConfig {
  mcpUrl: string;
  token: string;
  orgId: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

export interface MCPToolResult {
  toolName: string;
  success: boolean;
  result: any;
  error?: string;
}

export class LangflowMCPClient {
  private config: LangflowMCPConfig;
  private tools: MCPTool[] = [];
  private connected: boolean = false;

  constructor(config: LangflowMCPConfig) {
    this.config = config;
  }

  /**
   * Parse SSE response from Langflow MCP
   */
  private parseSSEResponse(text: string): any {
    // SSE format: "event: message\ndata: {...}"
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          return JSON.parse(line.substring(6));
        } catch (e) {
          // Continue to next line
        }
      }
    }
    // Try parsing as plain JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  /**
   * Initialize connection and discover available tools (flows)
   */
  async connect(): Promise<boolean> {
    try {
      console.log('[LangflowMCP] Connecting to Langflow MCP server...');
      
      // List available tools from the MCP server
      const response = await fetch(this.config.mcpUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[LangflowMCP] Connection failed:', response.status, errorText);
        return false;
      }

      const text = await response.text();
      const result = this.parseSSEResponse(text);
      
      if (result?.result?.tools) {
        this.tools = result.result.tools;
        this.connected = true;
        console.log(`[LangflowMCP] Connected. Available tools: ${this.tools.map(t => t.name).join(', ')}`);
        return true;
      }

      console.log('[LangflowMCP] Connected but no tools found');
      this.connected = true;
      return true;
    } catch (error: any) {
      console.error('[LangflowMCP] Connection error:', error.message);
      return false;
    }
  }

  /**
   * Get authorization headers for Langflow
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${this.config.token}`,
      'X-DataStax-Current-Org': this.config.orgId,
    };
  }

  /**
   * List available tools (flows exposed as MCP tools)
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.connected) {
      await this.connect();
    }
    return this.tools;
  }

  /**
   * Call a tool (execute a Langflow flow)
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      console.log(`[LangflowMCP] Calling tool: ${toolName}`);
      
      const response = await fetch(this.config.mcpUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          toolName,
          success: false,
          result: null,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const text = await response.text();
      const result = this.parseSSEResponse(text);
      
      if (result?.error) {
        return {
          toolName,
          success: false,
          result: null,
          error: result.error.message || JSON.stringify(result.error)
        };
      }

      console.log(`[LangflowMCP] Tool ${toolName} executed successfully`);
      return {
        toolName,
        success: true,
        result: result?.result
      };
    } catch (error: any) {
      console.error(`[LangflowMCP] Tool call failed:`, error.message);
      return {
        toolName,
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Call a flow by providing input value (chat-style)
   */
  async runFlow(flowName: string, inputValue: string): Promise<MCPToolResult> {
    return this.callTool(flowName, { input_value: inputValue });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.find(t => t.name === name);
  }
}

// Singleton instance
let langflowClientInstance: LangflowMCPClient | null = null;

/**
 * Initialize Langflow MCP client from environment variables
 */
export function initializeLangflowMCPClient(): LangflowMCPClient | null {
  const mcpUrl = process.env.LANGFLOW_MCP_URL;
  const token = process.env.LANGFLOW_MCP_TOKEN;
  const orgId = process.env.LANGFLOW_ORG_ID;

  if (!mcpUrl || !token) {
    console.warn('[LangflowMCP] Not configured - missing LANGFLOW_MCP_URL or LANGFLOW_MCP_TOKEN');
    return null;
  }

  const client = new LangflowMCPClient({
    mcpUrl,
    token,
    orgId: orgId || ''
  });

  langflowClientInstance = client;
  console.log('[LangflowMCP] Client initialized');
  return client;
}

/**
 * Get the singleton Langflow MCP client instance
 */
export function getLangflowMCPClient(): LangflowMCPClient | null {
  return langflowClientInstance;
}

/**
 * Execute a Langflow flow (convenience function for agents)
 * @param flowId The flow ID or name
 * @param input The input data for the flow
 * @param agentId Optional agent ID for logging
 */
export async function executeLangflowFlow(
  flowId: string, 
  input: any, 
  agentId?: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  const client = getLangflowMCPClient();
  
  if (!client) {
    return { success: false, error: 'Langflow MCP client not initialized' };
  }
  
  if (!client.isConnected()) {
    // Try to connect
    await client.connect();
    if (!client.isConnected()) {
      return { success: false, error: 'Langflow MCP not connected' };
    }
  }
  
  try {
    // Check if flowId is a known tool
    const tools = await client.listTools();
    const tool = tools.find(t => t.name === flowId || t.name.includes(flowId));
    const toolName = tool?.name || flowId;
    
    const result = await client.callTool(toolName, input);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
