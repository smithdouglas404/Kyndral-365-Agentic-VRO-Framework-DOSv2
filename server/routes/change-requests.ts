/**
 * CHANGE REQUEST ROUTES
 *
 * Handles change request management across projects
 * Critical for scope control and project governance
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/authMiddleware.js';
import type { IStorage } from '../storage.js';

// Change request validation schemas
const CreateChangeRequestSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string(),
  requestedBy: z.string(),
  changeType: z.enum(['scope', 'schedule', 'budget', 'quality', 'resource', 'technical', 'other']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected', 'implemented', 'cancelled']),
  estimatedCost: z.number().optional(),
  estimatedDuration: z.number().optional(), // in days
  businessJustification: z.string().optional(),
  impactAssessment: z.string().optional(),
});

const UpdateChangeRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  changeType: z.enum(['scope', 'schedule', 'budget', 'quality', 'resource', 'technical', 'other']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected', 'implemented', 'cancelled']).optional(),
  estimatedCost: z.number().optional(),
  estimatedDuration: z.number().optional(),
  businessJustification: z.string().optional(),
  impactAssessment: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  approvalNotes: z.string().optional(),
});

/**
 * Register change request routes
 */
export function registerChangeRequestRoutes(app: Express, storage: IStorage): void {
  /**
   * GET /api/change-requests
   * Get all change requests (with optional filters)
   */
  app.get('/api/change-requests', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId, status, changeType, priority } = req.query;

      const changeRequests = await storage.getChangeRequests({
        projectId: projectId as string,
        status: status as string,
        changeType: changeType as string,
        priority: priority as string,
      });

      res.json({ changeRequests });
    } catch (error: any) {
      console.error('[ChangeRequests] Get change requests error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch change requests',
      });
    }
  });

  /**
   * GET /api/change-requests/:changeRequestId
   * Get single change request by ID
   */
  app.get('/api/change-requests/:changeRequestId', authenticate, async (req: Request, res: Response) => {
    try {
      const changeRequest = await storage.getChangeRequest(req.params.changeRequestId);

      if (!changeRequest) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Change request not found',
        });
      }

      res.json({ changeRequest });
    } catch (error: any) {
      console.error('[ChangeRequests] Get change request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch change request',
      });
    }
  });

  /**
   * POST /api/change-requests
   * Create new change request
   */
  app.post('/api/change-requests', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = CreateChangeRequestSchema.parse(req.body);

      // Check if project exists
      const project = await storage.getProject(validated.projectId);
      if (!project) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      const changeRequest = await storage.createChangeRequest({
        ...validated,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`[ChangeRequests] Change request created: ${changeRequest.id} for project ${validated.projectId}`);

      res.status(201).json({ changeRequest });
    } catch (error: any) {
      console.error('[ChangeRequests] Create change request error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create change request',
      });
    }
  });

  /**
   * PATCH /api/change-requests/:changeRequestId
   * Update change request
   */
  app.patch('/api/change-requests/:changeRequestId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = UpdateChangeRequestSchema.parse(req.body);

      const existingChangeRequest = await storage.getChangeRequest(req.params.changeRequestId);
      if (!existingChangeRequest) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Change request not found',
        });
      }

      const changeRequest = await storage.updateChangeRequest(req.params.changeRequestId, {
        ...validated,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id,
      });

      console.log(`[ChangeRequests] Change request updated: ${req.params.changeRequestId}`);

      res.json({ changeRequest });
    } catch (error: any) {
      console.error('[ChangeRequests] Update change request error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update change request',
      });
    }
  });

  /**
   * DELETE /api/change-requests/:changeRequestId
   * Delete change request
   */
  app.delete('/api/change-requests/:changeRequestId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const changeRequest = await storage.getChangeRequest(req.params.changeRequestId);
      if (!changeRequest) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Change request not found',
        });
      }

      await storage.deleteChangeRequest(req.params.changeRequestId);

      console.log(`[ChangeRequests] Change request deleted: ${req.params.changeRequestId}`);

      res.json({ message: 'Change request deleted successfully' });
    } catch (error: any) {
      console.error('[ChangeRequests] Delete change request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete change request',
      });
    }
  });

  /**
   * POST /api/change-requests/:changeRequestId/approve
   * Approve change request
   */
  app.post('/api/change-requests/:changeRequestId/approve', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const { approvalNotes } = req.body;

      const changeRequest = await storage.updateChangeRequest(req.params.changeRequestId, {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date().toISOString(),
        approvalNotes,
        updatedAt: new Date().toISOString(),
      });

      console.log(`[ChangeRequests] Change request approved: ${req.params.changeRequestId}`);

      res.json({ changeRequest, message: 'Change request approved' });
    } catch (error: any) {
      console.error('[ChangeRequests] Approve change request error:', error);
      res.status(500).json({ error: 'Failed to approve change request' });
    }
  });

  /**
   * POST /api/change-requests/:changeRequestId/reject
   * Reject change request
   */
  app.post('/api/change-requests/:changeRequestId/reject', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const { rejectionReason } = req.body;

      const changeRequest = await storage.updateChangeRequest(req.params.changeRequestId, {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date().toISOString(),
        approvalNotes: rejectionReason,
        updatedAt: new Date().toISOString(),
      });

      console.log(`[ChangeRequests] Change request rejected: ${req.params.changeRequestId}`);

      res.json({ changeRequest, message: 'Change request rejected' });
    } catch (error: any) {
      console.error('[ChangeRequests] Reject change request error:', error);
      res.status(500).json({ error: 'Failed to reject change request' });
    }
  });

  /**
   * GET /api/projects/:projectId/change-requests/stats
   * Get change request statistics for project
   */
  app.get('/api/projects/:projectId/change-requests/stats', authenticate, async (req: Request, res: Response) => {
    try {
      const changeRequests = await storage.getChangeRequests({ projectId: req.params.projectId });

      const stats = {
        total: changeRequests.length,
        byStatus: {
          submitted: changeRequests.filter(cr => cr.status === 'submitted').length,
          under_review: changeRequests.filter(cr => cr.status === 'under_review').length,
          approved: changeRequests.filter(cr => cr.status === 'approved').length,
          rejected: changeRequests.filter(cr => cr.status === 'rejected').length,
          implemented: changeRequests.filter(cr => cr.status === 'implemented').length,
          cancelled: changeRequests.filter(cr => cr.status === 'cancelled').length,
        },
        byType: changeRequests.reduce((acc, cr) => {
          acc[cr.changeType] = (acc[cr.changeType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalEstimatedCost: changeRequests
          .filter(cr => cr.estimatedCost)
          .reduce((sum, cr) => sum + (cr.estimatedCost || 0), 0),
        totalEstimatedDuration: changeRequests
          .filter(cr => cr.estimatedDuration)
          .reduce((sum, cr) => sum + (cr.estimatedDuration || 0), 0),
        approvalRate: changeRequests.length > 0
          ? ((changeRequests.filter(cr => cr.status === 'approved').length / changeRequests.length) * 100).toFixed(1)
          : 0,
      };

      res.json({ stats });
    } catch (error: any) {
      console.error('[ChangeRequests] Get change request stats error:', error);
      res.status(500).json({ error: 'Failed to fetch change request statistics' });
    }
  });

  console.log('[ChangeRequests] Change request routes registered');
}
