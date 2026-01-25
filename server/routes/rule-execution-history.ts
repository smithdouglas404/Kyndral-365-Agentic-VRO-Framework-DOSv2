/**
 * RULE EXECUTION HISTORY API
 *
 * Provides visibility into when collaboration rules fire, who they target,
 * and how long it takes for agents to respond.
 *
 * Key Features:
 * - Filter by timeframe, agent, status, project
 * - Track response times
 * - Audit compliance with collaboration rules
 * - Identify bottlenecks in agent collaboration
 */

import express from "express";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import {
  ruleExecutionHistory,
  agentCollaborationRules,
  type RuleExecutionHistory
} from "../../shared/schema.js";

const router = express.Router();

/**
 * GET /api/rules/execution-history
 *
 * Query parameters:
 * - timeframe: 24h, 7days, 30days, 90days (default: 7days)
 * - agent: Filter by source agent (finops, tmo, risk, etc.)
 * - status: pending, acknowledged, resolved, failed
 * - projectId: Filter by project
 * - limit: Number of results (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 */
router.get("/execution-history", async (req, res) => {
  try {
    const {
      timeframe = "7days",
      agent,
      status,
      projectId,
      limit = "100",
      offset = "0",
    } = req.query;

    // Parse timeframe into timestamp
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "24h":
        startDate.setHours(now.getHours() - 24);
        break;
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Build WHERE conditions
    const conditions: string[] = [
      `triggered_at >= '${startDate.toISOString()}'`
    ];

    if (agent) {
      conditions.push(`from_agent = '${agent}'`);
    }

    if (status) {
      conditions.push(`status = '${status}'`);
    }

    if (projectId) {
      conditions.push(`project_id = '${projectId}'`);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Query executions
    const executions = await db.execute(sql`
      SELECT
        id,
        rule_id,
        rule_name,
        from_agent,
        to_agent,
        project_id,
        trigger_attribute,
        trigger_value,
        threshold,
        actions_taken,
        status,
        response_time_seconds,
        response_message,
        triggered_at,
        acknowledged_at,
        resolved_at,
        metadata
      FROM rule_execution_history
      ${sql.raw(whereClause)}
      ORDER BY triggered_at DESC
      LIMIT ${parseInt(limit as string)}
      OFFSET ${parseInt(offset as string)}
    `);

    // Get statistics
    const stats = await db.execute(sql`
      SELECT
        COUNT(*) as total_fired,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(response_time_seconds) as avg_response_time,
        MAX(response_time_seconds) as max_response_time,
        MIN(response_time_seconds) as min_response_time
      FROM rule_execution_history
      ${sql.raw(whereClause)}
    `);

    const statsRow = stats.rows[0] as any;

    // Parse JSON fields
    const parsedExecutions = executions.rows.map((row: any) => ({
      id: row.id,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      fromAgent: row.from_agent,
      toAgent: row.to_agent,
      projectId: row.project_id,
      trigger: {
        attribute: row.trigger_attribute,
        value: row.trigger_value,
        threshold: row.threshold,
      },
      actionsTaken: JSON.parse(row.actions_taken || '[]'),
      status: row.status,
      responseTimeSeconds: row.response_time_seconds,
      responseMessage: row.response_message,
      triggeredAt: row.triggered_at,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
      metadata: JSON.parse(row.metadata || '{}'),
    }));

    res.json({
      executions: parsedExecutions,
      stats: {
        totalFired: parseInt(statsRow.total_fired || '0'),
        resolved: parseInt(statsRow.resolved || '0'),
        pending: parseInt(statsRow.pending || '0'),
        acknowledged: parseInt(statsRow.acknowledged || '0'),
        failed: parseInt(statsRow.failed || '0'),
        avgResponseTime: parseFloat(statsRow.avg_response_time || '0'),
        maxResponseTime: parseInt(statsRow.max_response_time || '0'),
        minResponseTime: parseInt(statsRow.min_response_time || '0'),
      },
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: parsedExecutions.length,
      },
    });
  } catch (error) {
    console.error("[RuleExecutionHistory] Error fetching execution history:", error);
    res.status(500).json({
      error: "Failed to fetch rule execution history",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/rules/execution-history/:id
 *
 * Get detailed information about a specific rule execution
 */
router.get("/execution-history/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.execute(sql`
      SELECT
        reh.*,
        acr.description as rule_description,
        acr.conditions as rule_conditions
      FROM rule_execution_history reh
      LEFT JOIN agent_collaboration_rules acr ON reh.rule_id = acr.id
      WHERE reh.id = ${id}
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Execution not found" });
    }

    const row = result.rows[0] as any;

    res.json({
      id: row.id,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      ruleDescription: row.rule_description,
      ruleConditions: JSON.parse(row.rule_conditions || '[]'),
      fromAgent: row.from_agent,
      toAgent: row.to_agent,
      projectId: row.project_id,
      trigger: {
        attribute: row.trigger_attribute,
        value: row.trigger_value,
        threshold: row.threshold,
      },
      actionsTaken: JSON.parse(row.actions_taken || '[]'),
      status: row.status,
      responseTimeSeconds: row.response_time_seconds,
      responseMessage: row.response_message,
      triggeredAt: row.triggered_at,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
      metadata: JSON.parse(row.metadata || '{}'),
    });
  } catch (error) {
    console.error("[RuleExecutionHistory] Error fetching execution details:", error);
    res.status(500).json({
      error: "Failed to fetch execution details",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/rules/execution-history/by-rule/:ruleId
 *
 * Get all executions for a specific rule
 */
router.get("/execution-history/by-rule/:ruleId", async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { limit = "50" } = req.query;

    const result = await db.execute(sql`
      SELECT
        id,
        rule_name,
        from_agent,
        to_agent,
        project_id,
        trigger_attribute,
        trigger_value,
        status,
        response_time_seconds,
        triggered_at,
        acknowledged_at,
        resolved_at
      FROM rule_execution_history
      WHERE rule_id = ${ruleId}
      ORDER BY triggered_at DESC
      LIMIT ${parseInt(limit as string)}
    `);

    res.json({
      ruleId,
      executions: result.rows.map((row: any) => ({
        id: row.id,
        ruleName: row.rule_name,
        fromAgent: row.from_agent,
        toAgent: row.to_agent,
        projectId: row.project_id,
        trigger: {
          attribute: row.trigger_attribute,
          value: row.trigger_value,
        },
        status: row.status,
        responseTimeSeconds: row.response_time_seconds,
        triggeredAt: row.triggered_at,
        acknowledgedAt: row.acknowledged_at,
        resolvedAt: row.resolved_at,
      })),
    });
  } catch (error) {
    console.error("[RuleExecutionHistory] Error fetching rule executions:", error);
    res.status(500).json({
      error: "Failed to fetch rule executions",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PATCH /api/rules/execution-history/:id/acknowledge
 *
 * Mark a rule execution as acknowledged
 */
router.patch("/execution-history/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const result = await db.execute(sql`
      UPDATE rule_execution_history
      SET
        status = 'acknowledged',
        acknowledged_at = NOW(),
        response_message = ${message || null},
        response_time_seconds = EXTRACT(EPOCH FROM (NOW() - triggered_at))::INTEGER
      WHERE id = ${id}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json({
      success: true,
      execution: result.rows[0]
    });
  } catch (error) {
    console.error("[RuleExecutionHistory] Error acknowledging execution:", error);
    res.status(500).json({
      error: "Failed to acknowledge execution",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PATCH /api/rules/execution-history/:id/resolve
 *
 * Mark a rule execution as resolved
 */
router.patch("/execution-history/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const result = await db.execute(sql`
      UPDATE rule_execution_history
      SET
        status = 'resolved',
        resolved_at = NOW(),
        response_message = ${message || null},
        response_time_seconds = EXTRACT(EPOCH FROM (NOW() - triggered_at))::INTEGER
      WHERE id = ${id}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json({
      success: true,
      execution: result.rows[0]
    });
  } catch (error) {
    console.error("[RuleExecutionHistory] Error resolving execution:", error);
    res.status(500).json({
      error: "Failed to resolve execution",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
