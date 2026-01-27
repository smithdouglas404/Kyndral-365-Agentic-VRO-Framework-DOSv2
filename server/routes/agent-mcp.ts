/**
 * AGENT-MCP QUERY API
 *
 * Public API for agents to query their connected MCPs.
 * Used by Langflow workflows.
 */

import express, { type RequestHandler } from 'express';
import { getAgentMcpService } from '../lib/AgentMcpService.js';

const router = express.Router();
const mcpService = getAgentMcpService();

/**
 * POST /api/agent-mcp/query
 * Agent queries its connected MCPs (Knowledge + Governance)
 */
router.post('/query', (async (req, res) => {
  try {
    const { agentId, operation, input, context } = req.body;

    if (!agentId || !operation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, operation'
      });
    }

    const result = await mcpService.query({
      agentId,
      operation,
      input: input || {},
      context
    });

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[AgentMCP API] Query error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * GET /api/agent-mcp/agent/:agentId/mcps
 * Get agent's connected MCPs
 */
router.get('/agent/:agentId/mcps', (async (req, res) => {
  try {
    const { agentId } = req.params;

    const mcps = await mcpService.getAgentMcps(agentId);

    res.json({
      success: true,
      agentId,
      ...mcps
    });
  } catch (error: any) {
    console.error('[AgentMCP API] Get MCPs error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

export default router;
