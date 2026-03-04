/**
 * APPROVAL CENTER API ROUTES
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * Manages approval workflows through PalantirApprovalService:
 * - Extraction review items
 * - Dashboard approvals
 * - Rule-triggered approvals
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getPalantirApprovalService } from '../services/PalantirApprovalService.js';

export function registerApprovalCenterRoutes(app: Router) {
  const router = Router();
  const approvalService = getPalantirApprovalService();

  /**
   * GET /api/approval-center/extraction-items
   * Get all extraction review items pending approval
   */
  router.get('/extraction-items', async (req: Request, res: Response) => {
    try {
      const items = await approvalService.getExtractionItems();

      res.json({
        items,
        count: items.length,
        source: approvalService.isPalantirAvailable() ? 'palantir' : 'postgres'
      });
    } catch (error: any) {
      console.error('Fetch extraction items error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch extraction items' });
    }
  });

  /**
   * GET /api/approval-center/dashboard-items
   * Get all auto-generated dashboards pending approval
   */
  router.get('/dashboard-items', async (req: Request, res: Response) => {
    try {
      const items = await approvalService.getDashboardItems();

      res.json({
        items,
        count: items.length,
        source: approvalService.isPalantirAvailable() ? 'palantir' : 'postgres'
      });
    } catch (error: any) {
      console.error('Fetch dashboard items error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard items' });
    }
  });

  /**
   * GET /api/approval-center/rule-items
   * Get all rule-triggered approval requests
   */
  router.get('/rule-items', async (req: Request, res: Response) => {
    try {
      const items = await approvalService.getRuleApprovals();

      res.json({
        items,
        count: items.length,
        source: approvalService.isPalantirAvailable() ? 'palantir' : 'postgres'
      });
    } catch (error: any) {
      console.error('Fetch rule items error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch rule items' });
    }
  });

  /**
   * GET /api/approval-center/items
   * Get all approval items (combined)
   */
  router.get('/items', async (req: Request, res: Response) => {
    try {
      const items = await approvalService.getAllItems();

      res.json({
        items,
        count: items.length,
        source: approvalService.isPalantirAvailable() ? 'palantir' : 'postgres'
      });
    } catch (error: any) {
      console.error('Fetch all items error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch items' });
    }
  });

  /**
   * POST /api/approval-center/dashboards/:id/approve
   * Approve and activate a dashboard
   */
  router.post('/dashboards/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const approverId = req.body.approverId || (req as any).user?.id || 'system';

      const result = await approvalService.approve(id, 'dashboard', approverId);

      if (result.success) {
        res.json({ success: true, message: 'Dashboard approved and activated' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error: any) {
      console.error('Dashboard approval error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve dashboard' });
    }
  });

  /**
   * DELETE /api/approval-center/dashboards/:id/reject
   * Reject and delete a dashboard
   */
  router.delete('/dashboards/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rejecterId = req.body?.rejecterId || (req as any).user?.id || 'system';
      const reason = req.body?.reason;

      const result = await approvalService.reject(id, 'dashboard', rejecterId, reason);

      if (result.success) {
        res.json({ success: true, message: 'Dashboard rejected and deleted' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error: any) {
      console.error('Dashboard rejection error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject dashboard' });
    }
  });

  /**
   * POST /api/approval-center/extraction/:id/approve
   * Approve an extraction item
   */
  router.post('/extraction/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const approverId = req.body.approverId || (req as any).user?.id || 'system';

      const result = await approvalService.approve(id, 'extraction', approverId);
      res.json(result);
    } catch (error: any) {
      console.error('Extraction approval error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve extraction' });
    }
  });

  /**
   * POST /api/approval-center/extraction/:id/reject
   * Reject an extraction item
   */
  router.post('/extraction/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rejecterId = req.body.rejecterId || (req as any).user?.id || 'system';
      const reason = req.body.reason;

      const result = await approvalService.reject(id, 'extraction', rejecterId, reason);
      res.json(result);
    } catch (error: any) {
      console.error('Extraction rejection error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject extraction' });
    }
  });

  /**
   * POST /api/approval-center/rules/:id/approve
   * Approve a rule-triggered request
   */
  router.post('/rules/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const approverId = req.body.approverId || (req as any).user?.id || 'system';

      const result = await approvalService.approve(id, 'rule_enforcement', approverId);
      res.json(result);
    } catch (error: any) {
      console.error('Rule approval error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve rule request' });
    }
  });

  /**
   * POST /api/approval-center/rules/:id/reject
   * Reject a rule-triggered request
   */
  router.post('/rules/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rejecterId = req.body.rejecterId || (req as any).user?.id || 'system';
      const reason = req.body.reason;

      const result = await approvalService.reject(id, 'rule_enforcement', rejecterId, reason);
      res.json(result);
    } catch (error: any) {
      console.error('Rule rejection error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject rule request' });
    }
  });

  /**
   * GET /api/approval-center/stats
   * Get approval center statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await approvalService.getStats();
      res.json({
        ...stats,
        source: approvalService.isPalantirAvailable() ? 'palantir' : 'postgres'
      });
    } catch (error: any) {
      console.error('Stats error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch stats' });
    }
  });

  app.use('/api/approval-center', router);
}
