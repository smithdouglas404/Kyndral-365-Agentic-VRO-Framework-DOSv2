/**
 * MCP AGENTS ROUTES
 *
 * HTTP endpoints for the Agent MCP Server.
 * Provides MCP-compatible REST API for tool discovery and execution.
 *
 * These routes follow the MCP HTTP binding pattern:
 * - GET  /api/mcp/info         - Server info and capabilities
 * - GET  /api/mcp/tools        - List available tools
 * - POST /api/mcp/tools/:name  - Call a tool
 * - GET  /api/mcp/manifest     - Server manifest
 */

import express from 'express';
import { getAgentMCPServer } from '../mcp/AgentMCPServer.js';
import type { IStorage } from '../storage.js';

const router = express.Router();

// Storage reference (injected from main routes)
let storageRef: IStorage | null = null;

export function setMCPStorage(storage: IStorage) {
  storageRef = storage;
}

/**
 * Get server info
 * GET /api/mcp/info
 */
router.get('/info', async (req, res) => {
  try {
    if (!storageRef) {
      return res.status(503).json({
        success: false,
        error: 'Storage not initialized',
      });
    }

    const server = getAgentMCPServer(storageRef);
    const info = server.getServerInfo();

    res.json({
      success: true,
      ...info,
    });
  } catch (error: any) {
    console.error('[MCP] Error getting info:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * List available tools
 * GET /api/mcp/tools
 */
router.get('/tools', async (req, res) => {
  try {
    if (!storageRef) {
      return res.status(503).json({
        success: false,
        error: 'Storage not initialized',
      });
    }

    const server = getAgentMCPServer(storageRef);
    const { tools } = await server.listTools();

    res.json({
      success: true,
      tools,
      total: tools.length,
    });
  } catch (error: any) {
    console.error('[MCP] Error listing tools:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Call a tool
 * POST /api/mcp/tools/:name
 *
 * Body: {
 *   arguments: { ... }
 * }
 */
router.post('/tools/:name', async (req, res) => {
  try {
    if (!storageRef) {
      return res.status(503).json({
        success: false,
        error: 'Storage not initialized',
      });
    }

    const server = getAgentMCPServer(storageRef);
    const toolName = req.params.name;
    const args = req.body.arguments || req.body;

    console.log(`[MCP] Calling tool: ${toolName}`);

    const result = await server.callTool(toolName, args);

    res.json({
      success: !result.isError,
      result,
    });
  } catch (error: any) {
    console.error('[MCP] Error calling tool:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get server manifest
 * GET /api/mcp/manifest
 */
router.get('/manifest', async (req, res) => {
  try {
    if (!storageRef) {
      return res.status(503).json({
        success: false,
        error: 'Storage not initialized',
      });
    }

    const server = getAgentMCPServer(storageRef);
    const manifest = server.getManifest();

    res.json({
      success: true,
      manifest,
    });
  } catch (error: any) {
    console.error('[MCP] Error getting manifest:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * MCP JSON-RPC endpoint (for standard MCP clients)
 * POST /api/mcp/rpc
 *
 * Body: {
 *   jsonrpc: "2.0",
 *   method: "tools/list" | "tools/call",
 *   params: { ... },
 *   id: 1
 * }
 */
router.post('/rpc', async (req, res) => {
  try {
    if (!storageRef) {
      return res.status(503).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Storage not initialized',
        },
        id: req.body.id,
      });
    }

    const server = getAgentMCPServer(storageRef);
    const { method, params, id } = req.body;

    let result: any;

    switch (method) {
      case 'initialize':
        await server.initialize();
        result = server.getServerInfo();
        break;

      case 'tools/list':
        result = await server.listTools();
        break;

      case 'tools/call':
        if (!params?.name) {
          return res.json({
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: 'Missing tool name',
            },
            id,
          });
        }
        result = await server.callTool(params.name, params.arguments || {});
        break;

      default:
        return res.json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
          id,
        });
    }

    res.json({
      jsonrpc: '2.0',
      result,
      id,
    });
  } catch (error: any) {
    console.error('[MCP] RPC error:', error.message);
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message,
      },
      id: req.body.id,
    });
  }
});

export default router;
