/**
 * AGENT COLLABORATION RULES API
 *
 * CRUD operations for agent collaboration rules.
 *
 * Endpoints:
 * - GET /api/rules/agent/:agentType - Get rules for specific agent
 * - GET /api/rules/:id - Get single rule
 * - POST /api/rules - Create new rule
 * - PUT /api/rules/:id - Update rule
 * - DELETE /api/rules/:id - Delete rule
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { agentCollaborationRules } from '../../shared/schema.js';
import { sql, eq } from 'drizzle-orm';
import { authenticate } from '../auth/authMiddleware.js';

export function registerAgentRulesRoutes(app: Express): void {
  /**
   * GET /api/rules/agent/:agentType
   * Get all rules for a specific agent
   */
  app.get('/api/rules/agent/:agentType', authenticate, async (req: Request, res: Response) => {
    try {
      const { agentType } = req.params;

      const rules = await db
        .select()
        .from(agentCollaborationRules)
        .where(eq(agentCollaborationRules.sourceAgent, agentType))
        .orderBy(agentCollaborationRules.priority, agentCollaborationRules.createdAt);

      res.json({
        success: true,
        rules: rules.map((rule) => ({
          ...rule,
          conditions: JSON.parse(rule.conditions),
          actions: JSON.parse(rule.actions),
        })),
      });
    } catch (error: any) {
      console.error('[AgentRules] Get by agent error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/rules/:id
   * Get single rule by ID
   */
  app.get('/api/rules/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const rule = await db.select().from(agentCollaborationRules).where(eq(agentCollaborationRules.id, id)).limit(1);

      if (rule.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
      }

      res.json({
        success: true,
        rule: {
          ...rule[0],
          conditions: JSON.parse(rule[0].conditions),
          actions: JSON.parse(rule[0].actions),
        },
      });
    } catch (error: any) {
      console.error('[AgentRules] Get by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/rules
   * Create new rule
   */
  app.post('/api/rules', authenticate, async (req: Request, res: Response) => {
    try {
      const { name, description, enabled, priority, sourceAgent, conditions, actions } = req.body;

      // Validation
      if (!name || !sourceAgent || !conditions || !actions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, sourceAgent, conditions, actions',
        });
      }

      const newRule = await db
        .insert(agentCollaborationRules)
        .values({
          name,
          description: description || null,
          enabled: enabled !== undefined ? enabled : true,
          priority: priority || 5,
          sourceAgent,
          conditions: JSON.stringify(conditions),
          actions: JSON.stringify(actions),
          createdBy: req.user?.id || 'system',
          executionCount: 0,
        })
        .returning();

      res.json({
        success: true,
        rule: {
          ...newRule[0],
          conditions: JSON.parse(newRule[0].conditions),
          actions: JSON.parse(newRule[0].actions),
        },
      });
    } catch (error: any) {
      console.error('[AgentRules] Create error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/rules/:id
   * Update existing rule
   */
  app.put('/api/rules/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, enabled, priority, conditions, actions } = req.body;

      // Get existing rule
      const existing = await db.select().from(agentCollaborationRules).where(eq(agentCollaborationRules.id, id)).limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
      }

      const updated = await db
        .update(agentCollaborationRules)
        .set({
          name: name || existing[0].name,
          description: description !== undefined ? description : existing[0].description,
          enabled: enabled !== undefined ? enabled : existing[0].enabled,
          priority: priority !== undefined ? priority : existing[0].priority,
          conditions: conditions ? JSON.stringify(conditions) : existing[0].conditions,
          actions: actions ? JSON.stringify(actions) : existing[0].actions,
          updatedAt: sql`NOW()`,
        })
        .where(eq(agentCollaborationRules.id, id))
        .returning();

      res.json({
        success: true,
        rule: {
          ...updated[0],
          conditions: JSON.parse(updated[0].conditions),
          actions: JSON.parse(updated[0].actions),
        },
      });
    } catch (error: any) {
      console.error('[AgentRules] Update error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/rules/:id
   * Delete rule
   */
  app.delete('/api/rules/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await db.delete(agentCollaborationRules).where(eq(agentCollaborationRules.id, id)).returning();

      if (deleted.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
      }

      res.json({
        success: true,
        message: 'Rule deleted successfully',
        deletedId: id,
      });
    } catch (error: any) {
      console.error('[AgentRules] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[AgentRules] Routes registered');
}
