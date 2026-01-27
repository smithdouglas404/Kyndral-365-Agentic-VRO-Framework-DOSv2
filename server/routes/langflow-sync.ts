/**
 * LANGFLOW SYNC API ROUTES
 *
 * Bidirectional sync between database rules and Langflow flows
 */

import express from 'express';
import { getLangflowRulesSync } from '../lib/LangflowRulesSync.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

const router = express.Router();
const syncService = getLangflowRulesSync();

/**
 * Webhook: Langflow → Database
 * Called by Langflow when user adds/modifies connections in flow
 * POST /api/langflow-sync/from-flow
 *
 * Body: {
 *   flowId: "abc123",
 *   fromAgent: "finops",
 *   toAgent: "governance",
 *   connectionType: "notify",
 *   condition: "{...}" // optional
 * }
 */
router.post('/from-flow', async (req, res) => {
  try {
    const { flowId, fromAgent, toAgent, connectionType, condition } = req.body;

    if (!flowId || !fromAgent || !toAgent || !connectionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: flowId, fromAgent, toAgent, connectionType'
      });
    }

    console.log(`[LangflowSync] Webhook received: ${fromAgent} → ${toAgent}`);

    const ruleId = await syncService.syncFlowToRule({
      fromAgent,
      toAgent,
      connectionType,
      condition
    });

    if (!ruleId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create rule from flow connection'
      });
    }

    res.json({
      success: true,
      ruleId,
      message: `Created collaboration rule from Langflow connection`
    });
  } catch (error: any) {
    console.error('[LangflowSync] Webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manual Sync: Database → Langflow
 * Sync specific rule to Langflow
 * POST /api/langflow-sync/to-flow/:ruleId
 */
router.post('/to-flow/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;

    // Fetch rule from database
    const result = await db.execute(sql`
      SELECT * FROM agent_collaboration_rules
      WHERE id = ${ruleId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    const rule = result.rows[0];
    const success = await syncService.syncRuleToLangflow(rule);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to sync rule to Langflow'
      });
    }

    res.json({
      success: true,
      message: `Rule synced to Langflow: ${(rule as any).name}`
    });
  } catch (error: any) {
    console.error('[LangflowSync] Sync error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Bulk Sync: Database → Langflow
 * Sync all rules for an agent
 * POST /api/langflow-sync/to-flow/agent/:agentId
 */
router.post('/to-flow/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const syncedCount = await syncService.syncAllRulesForAgent(agentId);

    res.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} rules for ${agentId}`
    });
  } catch (error: any) {
    console.error('[LangflowSync] Bulk sync error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get flow connections (for debugging)
 * GET /api/langflow-sync/flow-connections/:flowId
 */
router.get('/flow-connections/:flowId', async (req, res) => {
  try {
    const { flowId } = req.params;

    const connections = await syncService.getFlowConnections(flowId);

    res.json({
      success: true,
      flowId,
      connections
    });
  } catch (error: any) {
    console.error('[LangflowSync] Get connections error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Trigger sync after rule create/update
 * This is called internally by the rules API
 */
export async function syncRuleAfterUpdate(ruleId: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM agent_collaboration_rules
      WHERE id = ${ruleId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return false;
    }

    const rule = result.rows[0];
    return await syncService.syncRuleToLangflow(rule);
  } catch (error: any) {
    console.error('[LangflowSync] Auto-sync error:', error.message);
    return false;
  }
}

export default router;
