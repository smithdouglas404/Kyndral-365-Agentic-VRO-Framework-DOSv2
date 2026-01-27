/**
 * AGENT-MCP CONNECTIONS API
 *
 * Manages connections between agents and MCPs for:
 * 1. Knowledge MCPs: Data sources (Jira, SAP, Azure DevOps)
 * 2. Governance MCPs: Responsible AI, QA, Policy enforcement
 *
 * Flow: Agent → Query connected MCPs → Governance validates → Knowledge provides data
 */

import express, { type RequestHandler } from 'express';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import {
  mcpDefinitions,
  agentMcpConnections,
  mcpExecutionLog,
  agentConfigs
} from '../../../shared/schema.js';

const router = express.Router();

// ============================================================================
// MCP DEFINITIONS
// ============================================================================

/**
 * GET /api/admin/agent-mcp-connections/mcps
 * Get all available MCPs
 */
router.get('/mcps', (async (req, res) => {
  try {
    const type = req.query.type as string | undefined;

    let query = sql`SELECT * FROM ${mcpDefinitions}`;
    if (type) {
      query = sql`SELECT * FROM ${mcpDefinitions} WHERE type = ${type}`;
    }
    query = sql`${query} ORDER BY type, name`;

    const mcps = await db.execute(query);

    res.json({
      success: true,
      mcps: mcps.rows
    });
  } catch (error: any) {
    console.error('[AgentMCP] Get MCPs error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * POST /api/admin/agent-mcp-connections/mcps
 * Create new MCP definition
 */
router.post('/mcps', (async (req, res) => {
  try {
    const {
      name,
      displayName,
      type,
      category,
      description,
      serverUrl,
      config,
      capabilities,
      enabled
    } = req.body;

    if (!name || !displayName || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, displayName, type'
      });
    }

    if (!['knowledge', 'governance'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be "knowledge" or "governance"'
      });
    }

    const result = await db.execute(sql`
      INSERT INTO ${mcpDefinitions} (
        name, display_name, type, category, description,
        server_url, config, capabilities, enabled
      )
      VALUES (
        ${name}, ${displayName}, ${type}, ${category || null}, ${description || null},
        ${serverUrl || null}, ${config || null}, ${capabilities || null}, ${enabled !== false}
      )
      RETURNING *
    `);

    res.json({
      success: true,
      mcp: result.rows[0]
    });
  } catch (error: any) {
    console.error('[AgentMCP] Create MCP error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * PUT /api/admin/agent-mcp-connections/mcps/:mcpId
 * Update MCP definition
 */
router.put('/mcps/:mcpId', (async (req, res) => {
  try {
    const { mcpId } = req.params;
    const {
      displayName,
      description,
      serverUrl,
      config,
      capabilities,
      enabled
    } = req.body;

    const result = await db.execute(sql`
      UPDATE ${mcpDefinitions}
      SET
        display_name = COALESCE(${displayName}, display_name),
        description = COALESCE(${description}, description),
        server_url = COALESCE(${serverUrl}, server_url),
        config = COALESCE(${config}, config),
        capabilities = COALESCE(${capabilities}, capabilities),
        enabled = COALESCE(${enabled}, enabled),
        updated_at = NOW()
      WHERE id = ${mcpId}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'MCP not found'
      });
    }

    res.json({
      success: true,
      mcp: result.rows[0]
    });
  } catch (error: any) {
    console.error('[AgentMCP] Update MCP error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

// ============================================================================
// AGENT-MCP CONNECTIONS
// ============================================================================

/**
 * GET /api/admin/agent-mcp-connections/agent/:agentId
 * Get all MCPs connected to an agent
 */
router.get('/agent/:agentId', (async (req, res) => {
  try {
    const { agentId } = req.params;

    const result = await db.execute(sql`
      SELECT
        amc.id as connection_id,
        amc.agent_id,
        amc.mcp_id,
        amc.enabled,
        amc.priority,
        amc.config as connection_config,
        amc.last_used,
        amc.usage_count,
        md.name as mcp_name,
        md.display_name as mcp_display_name,
        md.type as mcp_type,
        md.category as mcp_category,
        md.description as mcp_description,
        md.capabilities as mcp_capabilities,
        md.enabled as mcp_enabled
      FROM ${agentMcpConnections} amc
      JOIN ${mcpDefinitions} md ON amc.mcp_id = md.id
      WHERE amc.agent_id = ${agentId}
      ORDER BY amc.priority ASC, md.type, md.name
    `);

    // Separate by type
    const knowledgeMcps = result.rows.filter((row: any) => row.mcp_type === 'knowledge');
    const governanceMcps = result.rows.filter((row: any) => row.mcp_type === 'governance');

    res.json({
      success: true,
      agentId,
      connections: result.rows,
      knowledgeMcps,
      governanceMcps
    });
  } catch (error: any) {
    console.error('[AgentMCP] Get agent connections error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * POST /api/admin/agent-mcp-connections/connect
 * Connect an MCP to an agent
 */
router.post('/connect', (async (req, res) => {
  try {
    const {
      agentId,
      mcpId,
      enabled = true,
      priority = 1,
      config
    } = req.body;

    if (!agentId || !mcpId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, mcpId'
      });
    }

    // Check if connection already exists
    const existing = await db.execute(sql`
      SELECT * FROM ${agentMcpConnections}
      WHERE agent_id = ${agentId} AND mcp_id = ${mcpId}
    `);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Connection already exists'
      });
    }

    const result = await db.execute(sql`
      INSERT INTO ${agentMcpConnections} (
        agent_id, mcp_id, enabled, priority, config
      )
      VALUES (
        ${agentId}, ${mcpId}, ${enabled}, ${priority}, ${config || null}
      )
      RETURNING *
    `);

    res.json({
      success: true,
      connection: result.rows[0]
    });
  } catch (error: any) {
    console.error('[AgentMCP] Connect error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * PUT /api/admin/agent-mcp-connections/:connectionId
 * Update agent-MCP connection (toggle enabled, change priority, update config)
 */
router.put('/:connectionId', (async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { enabled, priority, config } = req.body;

    const result = await db.execute(sql`
      UPDATE ${agentMcpConnections}
      SET
        enabled = COALESCE(${enabled}, enabled),
        priority = COALESCE(${priority}, priority),
        config = COALESCE(${config}, config),
        updated_at = NOW()
      WHERE id = ${connectionId}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      connection: result.rows[0]
    });
  } catch (error: any) {
    console.error('[AgentMCP] Update connection error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * DELETE /api/admin/agent-mcp-connections/:connectionId
 * Disconnect MCP from agent
 */
router.delete('/:connectionId', (async (req, res) => {
  try {
    const { connectionId } = req.params;

    const result = await db.execute(sql`
      DELETE FROM ${agentMcpConnections}
      WHERE id = ${connectionId}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      deleted: result.rows[0]
    });
  } catch (error: any) {
    console.error('[AgentMCP] Delete connection error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

// ============================================================================
// MCP EXECUTION LOG
// ============================================================================

/**
 * GET /api/admin/agent-mcp-connections/logs
 * Get MCP execution logs
 */
router.get('/logs', (async (req, res) => {
  try {
    const { agentId, mcpId, limit = 100 } = req.query;

    let query = sql`SELECT * FROM ${mcpExecutionLog}`;

    if (agentId && mcpId) {
      query = sql`${query} WHERE agent_id = ${agentId} AND mcp_id = ${mcpId}`;
    } else if (agentId) {
      query = sql`${query} WHERE agent_id = ${agentId}`;
    } else if (mcpId) {
      query = sql`${query} WHERE mcp_id = ${mcpId}`;
    }

    query = sql`${query} ORDER BY executed_at DESC LIMIT ${limit}`;

    const logs = await db.execute(query);

    res.json({
      success: true,
      logs: logs.rows
    });
  } catch (error: any) {
    console.error('[AgentMCP] Get logs error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

/**
 * GET /api/admin/agent-mcp-connections/stats
 * Get MCP usage statistics
 */
router.get('/stats', (async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT
        agent_id,
        mcp_id,
        mcp_type,
        COUNT(*) as execution_count,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as error_count,
        AVG(execution_time) as avg_execution_time,
        MAX(executed_at) as last_executed
      FROM ${mcpExecutionLog}
      WHERE executed_at > NOW() - INTERVAL '7 days'
      GROUP BY agent_id, mcp_id, mcp_type
      ORDER BY execution_count DESC
    `);

    res.json({
      success: true,
      stats: stats.rows
    });
  } catch (error: any) {
    console.error('[AgentMCP] Get stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}) as RequestHandler);

export function registerAgentMcpConnectionRoutes(app: express.Application): void {
  app.use('/api/admin/agent-mcp-connections', router);
}

export default router;
