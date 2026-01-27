/**
 * AGENT COLLABORATION RULES API ROUTES
 *
 * Admin UI for defining inter-agent collaboration rules.
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../../auth/authMiddleware.js';
import { getAgentCollaborationRulesEngine } from '../../lib/AgentCollaborationRulesEngine.js';
import type { CollaborationRule, RuleCondition, RuleAction } from '../../lib/AgentCollaborationRulesEngine.js';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import { ruleExecutionHistory } from '../../../shared/schema.js';
import { syncRuleAfterUpdate } from '../langflow-sync.js';

export function registerCollaborationRulesRoutes(app: Express): void {
  const rulesEngine = getAgentCollaborationRulesEngine();

  /**
   * GET /api/admin/collaboration-rules
   * Get all collaboration rules
   */
  app.get('/api/admin/collaboration-rules', authenticate, async (req: Request, res: Response) => {
    try {
      const rules = await rulesEngine.getAllRules();

      res.json({
        success: true,
        rules,
      });
    } catch (error: any) {
      console.error('[CollaborationRules] Get all error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/collaboration-rules/:id
   * Get specific rule
   */
  app.get('/api/admin/collaboration-rules/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rule = await rulesEngine.getRule(id);

      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
      }

      res.json({
        success: true,
        rule,
      });
    } catch (error: any) {
      console.error('[CollaborationRules] Get rule error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/collaboration-rules
   * Create new collaboration rule
   */
  app.post('/api/admin/collaboration-rules', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can create collaboration rules',
        });
      }

      const { name, description, enabled, priority, sourceAgent, conditions, actions } = req.body;

      // Validate required fields
      if (!name || !sourceAgent || !conditions || !actions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, sourceAgent, conditions, actions',
        });
      }

      const rule = await rulesEngine.createRule({
        name,
        description: description || '',
        enabled: enabled ?? true,
        priority: priority || 5,
        sourceAgent,
        conditions: conditions as RuleCondition[],
        actions: actions as RuleAction[],
        createdBy: req.user.id,
      });

      // Auto-sync to Langflow (Database → Langflow)
      syncRuleAfterUpdate(rule.id).catch((error) => {
        console.error('[CollaborationRules] Auto-sync to Langflow failed:', error);
        // Don't fail the request if sync fails
      });

      res.json({
        success: true,
        rule,
      });
    } catch (error: any) {
      console.error('[CollaborationRules] Create error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /api/admin/collaboration-rules/:id
   * Update collaboration rule
   */
  app.patch('/api/admin/collaboration-rules/:id', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can update collaboration rules',
        });
      }

      const { id } = req.params;
      const updates = req.body;

      await rulesEngine.updateRule(id, updates);

      // Auto-sync to Langflow (Database → Langflow)
      syncRuleAfterUpdate(id).catch((error) => {
        console.error('[CollaborationRules] Auto-sync to Langflow failed:', error);
        // Don't fail the request if sync fails
      });

      res.json({
        success: true,
        message: 'Rule updated successfully',
      });
    } catch (error: any) {
      console.error('[CollaborationRules] Update error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/admin/collaboration-rules/:id
   * Delete collaboration rule
   */
  app.delete('/api/admin/collaboration-rules/:id', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can delete collaboration rules',
        });
      }

      const { id } = req.params;

      await rulesEngine.deleteRule(id);

      res.json({
        success: true,
        message: 'Rule deleted successfully',
      });
    } catch (error: any) {
      console.error('[CollaborationRules] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/collaboration-rules/reload
   * Reload rules engine (after changes)
   */
  app.post('/api/admin/collaboration-rules/reload', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can reload rules',
        });
      }

      await rulesEngine.loadRules();

      res.json({
        success: true,
        message: 'Rules reloaded successfully',
      });
    } catch (error: any) {
      console.error('[CollaborationRules] Reload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/rule-execution-history
   * Get rule execution history with filters
   */
  app.get('/api/admin/rule-execution-history', authenticate, async (req: Request, res: Response) => {
    try {
      const { agent, status, dateRange } = req.query;

      // Build dynamic WHERE clause
      let whereClause = '';
      const conditions: string[] = [];

      if (agent && agent !== 'all') {
        conditions.push(`(from_agent = '${agent}' OR to_agent = '${agent}')`);
      }

      if (status && status !== 'all') {
        conditions.push(`status = '${status}'`);
      }

      // Date range filtering
      if (dateRange && dateRange !== 'all') {
        let hoursAgo = 168; // Default to 7 days
        switch (dateRange) {
          case '24hours':
            hoursAgo = 24;
            break;
          case '7days':
            hoursAgo = 168;
            break;
          case '30days':
            hoursAgo = 720;
            break;
          case '90days':
            hoursAgo = 2160;
            break;
        }

        conditions.push(`triggered_at >= NOW() - INTERVAL '${hoursAgo} hours'`);
      }

      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      // Execute query using sql template
      const query = sql`
        SELECT
          id, rule_id, rule_name, from_agent, to_agent, project_id,
          trigger_attribute, trigger_value, threshold, actions_taken,
          status, response_time_seconds, response_message,
          triggered_at, acknowledged_at, resolved_at, metadata
        FROM rule_execution_history
        ${sql.raw(whereClause)}
        ORDER BY triggered_at DESC
        LIMIT 1000
      `;

      const result = await db.execute(query);
      const executions = result.rows;

      res.json(executions);
    } catch (error: any) {
      console.error('[RuleExecutionHistory] Query error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agent-collaboration-matrix
   * Get aggregated collaboration data between all agent pairs
   */
  app.get('/api/admin/agent-collaboration-matrix', authenticate, async (req: Request, res: Response) => {
    try {
      const { dateRange } = req.query;

      // Build date range filter
      let dateFilter = '';
      if (dateRange && dateRange !== 'all') {
        let hoursAgo = 168; // Default to 7 days
        switch (dateRange) {
          case '24hours':
            hoursAgo = 24;
            break;
          case '7days':
            hoursAgo = 168;
            break;
          case '30days':
            hoursAgo = 720;
            break;
          case '90days':
            hoursAgo = 2160;
            break;
        }

        dateFilter = `WHERE triggered_at >= NOW() - INTERVAL '${hoursAgo} hours'`;
      }

      // Query aggregated collaboration data
      const query = sql`
        SELECT
          from_agent,
          to_agent,
          COUNT(*) as total_executions,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as successful_executions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_executions,
          AVG(COALESCE(response_time_seconds, 0)) as avg_response_time_seconds,
          MAX(triggered_at) as last_collaboration_at
        FROM rule_execution_history
        ${sql.raw(dateFilter)}
        ${sql.raw(dateFilter ? 'AND' : 'WHERE')} to_agent IS NOT NULL
        GROUP BY from_agent, to_agent
        ORDER BY total_executions DESC
      `;

      const result = await db.execute(query);
      const collaborationData = result.rows;

      res.json(collaborationData);
    } catch (error: any) {
      console.error('[AgentCollaborationMatrix] Query error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agent-collaboration-details
   * Get detailed rule-level data for a specific agent pair
   */
  app.get('/api/admin/agent-collaboration-details', authenticate, async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to',
        });
      }

      // Query rule-level aggregation
      const query = sql`
        SELECT
          rule_id,
          rule_name,
          COUNT(*) as execution_count,
          (SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as success_rate,
          AVG(COALESCE(response_time_seconds, 0)) as avg_response_time
        FROM rule_execution_history
        WHERE from_agent = ${from}
          AND to_agent = ${to}
        GROUP BY rule_id, rule_name
        ORDER BY execution_count DESC
      `;

      const result = await db.execute(query);
      const rules = result.rows;

      res.json({
        fromAgent: from,
        toAgent: to,
        rules,
      });
    } catch (error: any) {
      console.error('[AgentCollaborationDetails] Query error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[CollaborationRules] Collaboration rules routes registered');
}
