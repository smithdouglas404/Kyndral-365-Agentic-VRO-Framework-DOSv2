/**
 * AGENT COLLABORATION RULES API ROUTES
 *
 * Admin UI for defining inter-agent collaboration rules.
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../../auth/authMiddleware.js';
import { getAgentCollaborationRulesEngine } from '../../lib/AgentCollaborationRulesEngine.js';
import type { CollaborationRule, RuleCondition, RuleAction } from '../../lib/AgentCollaborationRulesEngine.js';

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

  console.log('[CollaborationRules] Collaboration rules routes registered');
}
