/**
 * ISSUE MANAGEMENT ROUTES
 *
 * Handles issue/problem tracking across projects
 * Critical feature that many PM systems lack or do poorly
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/authMiddleware.js';
import type { IStorage } from '../storage.js';

// Issue validation schemas
const CreateIssueSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'blocked']),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  tags: z.array(z.string()).optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  category: z.enum(['technical', 'business', 'resource', 'scope', 'schedule', 'quality', 'risk', 'other']).optional(),
});

const UpdateIssueSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'blocked']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  category: z.enum(['technical', 'business', 'resource', 'scope', 'schedule', 'quality', 'risk', 'other']).optional(),
  resolution: z.string().optional(),
  resolvedAt: z.string().optional(),
});

const CreateCommentSchema = z.object({
  issueId: z.string(),
  content: z.string().min(1).max(5000),
});

/**
 * Register issue management routes
 */
export function registerIssueRoutes(app: Express, storage: IStorage): void {
  /**
   * GET /api/issues
   * Get all issues (with optional filters)
   */
  app.get('/api/issues', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId, status, priority, assignedTo } = req.query;

      const issues = await storage.getIssues({
        projectId: projectId as string,
        status: status as string,
        priority: priority as string,
        assignedTo: assignedTo as string,
      });

      res.json({ issues });
    } catch (error: any) {
      console.error('[Issues] Get issues error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch issues',
      });
    }
  });

  /**
   * GET /api/issues/:issueId
   * Get single issue by ID
   */
  app.get('/api/issues/:issueId', authenticate, async (req: Request, res: Response) => {
    try {
      const issue = await storage.getIssue(req.params.issueId);

      if (!issue) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
      }

      // Get comments for this issue
      const comments = await storage.getIssueComments(req.params.issueId);

      res.json({ issue, comments });
    } catch (error: any) {
      console.error('[Issues] Get issue error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch issue',
      });
    }
  });

  /**
   * POST /api/issues
   * Create new issue
   */
  app.post('/api/issues', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = CreateIssueSchema.parse(req.body);

      // Check if project exists
      const project = await storage.getProject(validated.projectId);
      if (!project) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      const issue = await storage.createIssue({
        ...validated,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`[Issues] Issue created: ${issue.id} for project ${validated.projectId}`);

      res.status(201).json({ issue });
    } catch (error: any) {
      console.error('[Issues] Create issue error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create issue',
      });
    }
  });

  /**
   * PATCH /api/issues/:issueId
   * Update issue
   */
  app.patch('/api/issues/:issueId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = UpdateIssueSchema.parse(req.body);

      const existingIssue = await storage.getIssue(req.params.issueId);
      if (!existingIssue) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
      }

      const issue = await storage.updateIssue(req.params.issueId, {
        ...validated,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id,
      });

      console.log(`[Issues] Issue updated: ${req.params.issueId}`);

      res.json({ issue });
    } catch (error: any) {
      console.error('[Issues] Update issue error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update issue',
      });
    }
  });

  /**
   * DELETE /api/issues/:issueId
   * Delete issue
   */
  app.delete('/api/issues/:issueId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const issue = await storage.getIssue(req.params.issueId);
      if (!issue) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
      }

      await storage.deleteIssue(req.params.issueId);

      console.log(`[Issues] Issue deleted: ${req.params.issueId}`);

      res.json({ message: 'Issue deleted successfully' });
    } catch (error: any) {
      console.error('[Issues] Delete issue error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete issue',
      });
    }
  });

  /**
   * POST /api/issues/:issueId/comments
   * Add comment to issue
   */
  app.post('/api/issues/:issueId/comments', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = CreateCommentSchema.parse({ ...req.body, issueId: req.params.issueId });

      const issue = await storage.getIssue(req.params.issueId);
      if (!issue) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
      }

      const comment = await storage.createIssueComment({
        issueId: req.params.issueId,
        content: validated.content,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
      });

      console.log(`[Issues] Comment added to issue: ${req.params.issueId}`);

      res.status(201).json({ comment });
    } catch (error: any) {
      console.error('[Issues] Create comment error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create comment',
      });
    }
  });

  /**
   * GET /api/issues/:issueId/history
   * Get issue change history
   */
  app.get('/api/issues/:issueId/history', authenticate, async (req: Request, res: Response) => {
    try {
      const issue = await storage.getIssue(req.params.issueId);
      if (!issue) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
      }

      const history = await storage.getIssueHistory(req.params.issueId);

      res.json({ history });
    } catch (error: any) {
      console.error('[Issues] Get issue history error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch issue history',
      });
    }
  });

  /**
   * GET /api/projects/:projectId/issues/stats
   * Get issue statistics for project
   */
  app.get('/api/projects/:projectId/issues/stats', authenticate, async (req: Request, res: Response) => {
    try {
      const issues = await storage.getIssues({ projectId: req.params.projectId });

      const stats = {
        total: issues.length,
        byStatus: {
          open: issues.filter(i => i.status === 'open').length,
          in_progress: issues.filter(i => i.status === 'in_progress').length,
          resolved: issues.filter(i => i.status === 'resolved').length,
          closed: issues.filter(i => i.status === 'closed').length,
          blocked: issues.filter(i => i.status === 'blocked').length,
        },
        byPriority: {
          critical: issues.filter(i => i.priority === 'critical').length,
          high: issues.filter(i => i.priority === 'high').length,
          medium: issues.filter(i => i.priority === 'medium').length,
          low: issues.filter(i => i.priority === 'low').length,
        },
        byCategory: issues.reduce((acc, issue) => {
          const category = issue.category || 'other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        overdue: issues.filter(i =>
          i.dueDate &&
          new Date(i.dueDate) < new Date() &&
          i.status !== 'resolved' &&
          i.status !== 'closed'
        ).length,
      };

      res.json({ stats });
    } catch (error: any) {
      console.error('[Issues] Get issue stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch issue statistics',
      });
    }
  });

  console.log('[Issues] Issue management routes registered');
}
