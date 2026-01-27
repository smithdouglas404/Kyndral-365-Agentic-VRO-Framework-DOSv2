/**
 * LANGFLOW ROUTES
 * API endpoints for testing and managing Langflow flows via MCP
 */

import type { Express, Request, Response } from 'express';
import { langflowService } from '../index.js';
import { initializeLangflowMCPClient, type LangflowMCPClient } from '../lib/LangflowMCPClient.js';

// MCP Client instance
let langflowMCPClient: LangflowMCPClient | null = null;

/**
 * Initialize Langflow MCP client at startup (called during route registration)
 */
async function initializeAtStartup(): Promise<void> {
  try {
    langflowMCPClient = initializeLangflowMCPClient();
    if (langflowMCPClient) {
      await langflowMCPClient.connect();
      console.log('[LangflowMCP] Client connected at startup');
    }
  } catch (error: any) {
    console.warn('[LangflowMCP] Startup connection failed:', error.message);
  }
}

export function registerLangflowRoutes(app: Express): void {
  // Initialize client at startup
  initializeAtStartup();
  /**
   * List all available Langflow flows
   */
  app.get('/api/langflow/flows', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({
          error: 'Langflow not configured',
          message: 'Set LANGFLOW_API_URL and LANGFLOW_API_KEY in .env',
        });
      }

      const flows = await langflowService.listFlows();
      res.json({ flows, count: flows.length });
    } catch (error: any) {
      console.error('[Langflow API] Failed to list flows:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get specific flow details
   */
  app.get('/api/langflow/flows/:flowId', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({ error: 'Langflow not configured' });
      }

      const { flowId } = req.params;
      const flow = await langflowService.getFlow(flowId);

      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }

      res.json(flow);
    } catch (error: any) {
      console.error('[Langflow API] Failed to get flow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Execute a Langflow flow with test data
   */
  app.post('/api/langflow/execute', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({ error: 'Langflow not configured' });
      }

      const { flowId, input, tweaks } = req.body;

      if (!flowId) {
        return res.status(400).json({ error: 'flowId is required' });
      }

      console.log(`[Langflow API] Executing flow ${flowId}...`);

      const result = await langflowService.executeFlow(flowId, input || {}, tweaks);

      res.json({
        success: result.status === 'success',
        flowId: result.flowId,
        runId: result.runId,
        status: result.status,
        outputs: result.outputs,
        executionTime: result.executionTime,
        error: result.error,
      });
    } catch (error: any) {
      console.error('[Langflow API] Flow execution failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Test Langflow connection
   */
  app.get('/api/langflow/test', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({
          connected: false,
          error: 'Langflow not configured',
        });
      }

      const connected = await langflowService.testConnection();
      const flows = connected ? await langflowService.listFlows() : [];

      res.json({
        connected,
        flowsAvailable: flows.length,
        flows: flows.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
        })),
      });
    } catch (error: any) {
      console.error('[Langflow API] Connection test failed:', error);
      res.status(500).json({
        connected: false,
        error: error.message,
      });
    }
  });

  // ==========================================
  // MCP-BASED LANGFLOW ENDPOINTS
  // ==========================================

  /**
   * Connect to Langflow MCP server and list available tools (flows)
   */
  app.get('/api/langflow/mcp/tools', async (req: Request, res: Response) => {
    try {
      if (!langflowMCPClient) {
        langflowMCPClient = initializeLangflowMCPClient();
      }

      if (!langflowMCPClient) {
        return res.status(503).json({
          error: 'Langflow MCP not configured',
          message: 'Set LANGFLOW_MCP_URL and LANGFLOW_MCP_TOKEN in secrets',
        });
      }

      const tools = await langflowMCPClient.listTools();
      res.json({
        connected: langflowMCPClient.isConnected(),
        tools,
        count: tools.length,
      });
    } catch (error: any) {
      console.error('[Langflow MCP] Failed to list tools:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Call a Langflow flow via MCP
   */
  app.post('/api/langflow/mcp/call', async (req: Request, res: Response) => {
    try {
      if (!langflowMCPClient) {
        langflowMCPClient = initializeLangflowMCPClient();
      }

      if (!langflowMCPClient) {
        return res.status(503).json({ error: 'Langflow MCP not configured' });
      }

      const { toolName, args, inputValue } = req.body;

      if (!toolName) {
        return res.status(400).json({ error: 'toolName is required' });
      }

      console.log(`[Langflow MCP] Calling tool: ${toolName}`);

      // If inputValue is provided, use runFlow (chat-style)
      const result = inputValue
        ? await langflowMCPClient.runFlow(toolName, inputValue)
        : await langflowMCPClient.callTool(toolName, args || {});

      res.json(result);
    } catch (error: any) {
      console.error('[Langflow MCP] Tool call failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Test Langflow MCP connection
   */
  app.get('/api/langflow/mcp/status', async (req: Request, res: Response) => {
    try {
      if (!langflowMCPClient) {
        langflowMCPClient = initializeLangflowMCPClient();
      }

      if (!langflowMCPClient) {
        return res.json({
          configured: false,
          connected: false,
          message: 'Langflow MCP credentials not set',
        });
      }

      const connected = await langflowMCPClient.connect();
      const tools = connected ? await langflowMCPClient.listTools() : [];

      res.json({
        configured: true,
        connected,
        toolsAvailable: tools.length,
        tools: tools.map(t => ({ name: t.name, description: t.description })),
        mcpUrl: process.env.LANGFLOW_MCP_URL,
      });
    } catch (error: any) {
      console.error('[Langflow MCP] Status check failed:', error);
      res.status(500).json({
        configured: true,
        connected: false,
        error: error.message,
      });
    }
  });

  console.log('[Routes] Langflow routes registered');
}
