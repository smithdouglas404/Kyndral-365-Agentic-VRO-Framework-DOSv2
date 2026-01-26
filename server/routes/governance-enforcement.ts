import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db.js';
import {
  approvalRequests,
  ruleExecutions,
  companyRules,
} from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { approveRequest, rejectRequest } from '../services/rulesEngine.js';

export function registerGovernanceEnforcementRoutes(app: Router) {
  const router = Router();

  // ============================================================================
  // APPROVAL REQUESTS
  // ============================================================================

  /**
   * GET /api/governance-enforcement/approval-requests
   * Get all approval requests (filterable)
   */
  router.get('/approval-requests', async (req: Request, res: Response) => {
    try {
      const { status, entityType, userId } = req.query;

      let query = db
        .select()
        .from(approvalRequests)
        .orderBy(desc(approvalRequests.requestedAt));

      // Apply filters
      if (status && status !== 'all') {
        query = query.where(eq(approvalRequests.status, status as any));
      }

      if (entityType && entityType !== 'all') {
        query = query.where(eq(approvalRequests.entityType, entityType as string));
      }

      const requests = await query;

      // Filter by user if specified (check if user is in requiredApprovers)
      const filteredRequests = userId
        ? requests.filter(r =>
            Array.isArray(r.requiredApprovers) &&
            r.requiredApprovers.includes(userId as string)
          )
        : requests;

      res.json({
        requests: filteredRequests,
        count: filteredRequests.length
      });
    } catch (error: any) {
      console.error('Fetch approval requests error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch approval requests' });
    }
  });

  /**
   * GET /api/governance-enforcement/approval-requests/:id
   * Get a specific approval request with details
   */
  router.get('/approval-requests/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [request] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, id))
        .limit(1);

      if (!request) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      // Get related rule executions if this is a rule enforcement request
      let triggeredRules = [];
      if (request.requestType === 'rule_enforcement' && request.metadata) {
        triggeredRules = (request.metadata as any).triggeredRules || [];
      }

      res.json({
        ...request,
        triggeredRules
      });
    } catch (error: any) {
      console.error('Fetch approval request error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch approval request' });
    }
  });

  /**
   * POST /api/governance-enforcement/approval-requests/:id/approve
   * Approve an approval request
   */
  router.post('/approval-requests/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const approverId = req.user?.id || 'system';

      await approveRequest(id, approverId, comments);

      res.json({
        success: true,
        message: 'Approval request approved'
      });
    } catch (error: any) {
      console.error('Approve request error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve request' });
    }
  });

  /**
   * POST /api/governance-enforcement/approval-requests/:id/reject
   * Reject an approval request
   */
  router.post('/approval-requests/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const approverId = req.user?.id || 'system';

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      await rejectRequest(id, approverId, reason);

      res.json({
        success: true,
        message: 'Approval request rejected'
      });
    } catch (error: any) {
      console.error('Reject request error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject request' });
    }
  });

  /**
   * POST /api/governance-enforcement/approval-requests/:id/cancel
   * Cancel a pending approval request
   */
  router.post('/approval-requests/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await db
        .update(approvalRequests)
        .set({ status: 'cancelled' })
        .where(eq(approvalRequests.id, id));

      res.json({
        success: true,
        message: 'Approval request cancelled'
      });
    } catch (error: any) {
      console.error('Cancel request error:', error);
      res.status(500).json({ error: error.message || 'Failed to cancel request' });
    }
  });

  // ============================================================================
  // RULE EXECUTION HISTORY
  // ============================================================================

  /**
   * GET /api/governance-enforcement/rule-executions
   * Get rule execution history (audit trail)
   */
  router.get('/rule-executions', async (req: Request, res: Response) => {
    try {
      const { ruleId, entityType, entityId, actionTaken, limit = '100' } = req.query;

      let query = db
        .select()
        .from(ruleExecutions)
        .orderBy(desc(ruleExecutions.executedAt))
        .limit(parseInt(limit as string, 10));

      // Apply filters
      const conditions = [];

      if (ruleId) {
        conditions.push(eq(ruleExecutions.ruleId, ruleId as string));
      }

      if (entityType) {
        conditions.push(eq(ruleExecutions.entityType, entityType as string));
      }

      if (entityId) {
        conditions.push(eq(ruleExecutions.entityId, entityId as string));
      }

      if (actionTaken) {
        conditions.push(eq(ruleExecutions.actionTaken, actionTaken as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const executions = await query;

      res.json({
        executions,
        count: executions.length
      });
    } catch (error: any) {
      console.error('Fetch rule executions error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch rule executions' });
    }
  });

  /**
   * GET /api/governance-enforcement/rules/:ruleId/executions
   * Get execution history for a specific rule
   */
  router.get('/rules/:ruleId/executions', async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const { limit = '50' } = req.query;

      const executions = await db
        .select()
        .from(ruleExecutions)
        .where(eq(ruleExecutions.ruleId, ruleId))
        .orderBy(desc(ruleExecutions.executedAt))
        .limit(parseInt(limit as string, 10));

      // Calculate statistics
      const stats = {
        total: executions.length,
        triggered: executions.filter(e => e.conditionsMet).length,
        blocked: executions.filter(e => e.actionTaken === 'block').length,
        approvalRequired: executions.filter(e => e.actionTaken === 'require_approval').length,
        warnings: executions.filter(e => e.actionTaken === 'warn').length
      };

      res.json({
        executions,
        stats
      });
    } catch (error: any) {
      console.error('Fetch rule executions error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch rule executions' });
    }
  });

  /**
   * GET /api/governance-enforcement/rules/:ruleId/stats
   * Get statistics for a specific rule
   */
  router.get('/rules/:ruleId/stats', async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const { days = '30' } = req.query;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days as string, 10));

      const executions = await db
        .select()
        .from(ruleExecutions)
        .where(eq(ruleExecutions.ruleId, ruleId));

      const recentExecutions = executions.filter(
        e => new Date(e.executedAt) >= cutoffDate
      );

      const stats = {
        totalExecutions: executions.length,
        recentExecutions: recentExecutions.length,
        triggerRate: recentExecutions.length > 0
          ? (recentExecutions.filter(e => e.conditionsMet).length / recentExecutions.length * 100).toFixed(2)
          : '0.00',
        actionBreakdown: {
          block: recentExecutions.filter(e => e.actionTaken === 'block').length,
          require_approval: recentExecutions.filter(e => e.actionTaken === 'require_approval').length,
          warn: recentExecutions.filter(e => e.actionTaken === 'warn').length,
          allow: recentExecutions.filter(e => e.actionTaken === 'allow').length
        },
        lastTriggered: executions.filter(e => e.conditionsMet)[0]?.executedAt || null
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Fetch rule stats error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch rule stats' });
    }
  });

  // ============================================================================
  // RULE MANAGEMENT
  // ============================================================================

  /**
   * GET /api/governance-enforcement/rules
   * Get all active rules
   */
  router.get('/rules', async (req: Request, res: Response) => {
    try {
      const { category, isActive = 'true' } = req.query;

      let query = db
        .select()
        .from(companyRules)
        .orderBy(companyRules.ruleCategory, companyRules.ruleName);

      const conditions = [];

      if (isActive === 'true') {
        conditions.push(eq(companyRules.isActive, true));
      }

      if (category && category !== 'all') {
        conditions.push(eq(companyRules.ruleCategory, category as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rules = await query;

      res.json({
        rules,
        count: rules.length
      });
    } catch (error: any) {
      console.error('Fetch rules error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch rules' });
    }
  });

  /**
   * PUT /api/governance-enforcement/rules/:ruleId/toggle
   * Enable or disable a rule
   */
  router.put('/rules/:ruleId/toggle', async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const { isActive } = req.body;

      await db
        .update(companyRules)
        .set({
          isActive,
          updatedAt: new Date()
        })
        .where(eq(companyRules.id, ruleId));

      res.json({
        success: true,
        message: `Rule ${isActive ? 'enabled' : 'disabled'}`
      });
    } catch (error: any) {
      console.error('Toggle rule error:', error);
      res.status(500).json({ error: error.message || 'Failed to toggle rule' });
    }
  });

  app.use('/api/governance-enforcement', router);
}
