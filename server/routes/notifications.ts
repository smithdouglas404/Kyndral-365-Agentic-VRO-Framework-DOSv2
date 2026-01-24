/**
 * NOTIFICATION API ROUTES
 *
 * Endpoints for sending and managing notifications.
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../auth/authMiddleware.js';
import { getNotificationService } from '../lib/NotificationService.js';
import type {
  EmailNotification,
  SlackNotification,
  TeamsNotification,
  InAppNotification,
  NotificationChannel,
} from '../lib/NotificationService.js';

export function registerNotificationRoutes(app: Express): void {
  const notificationService = getNotificationService();

  /**
   * POST /api/notifications/email
   * Send email notification
   */
  app.post('/api/notifications/email', authenticate, async (req: Request, res: Response) => {
    try {
      const notification: EmailNotification = req.body;

      // Validate required fields
      if (!notification.to || !notification.subject || !notification.body) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, subject, body',
        });
      }

      const result = await notificationService.sendEmail(notification);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        messageId: result.messageId,
      });
    } catch (error: any) {
      console.error('[Notifications] Email send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/notifications/slack
   * Send Slack notification
   */
  app.post('/api/notifications/slack', authenticate, async (req: Request, res: Response) => {
    try {
      const notification: SlackNotification = req.body;

      if (!notification.text) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: text',
        });
      }

      const result = await notificationService.sendSlack(notification);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Notifications] Slack send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/notifications/teams
   * Send Microsoft Teams notification
   */
  app.post('/api/notifications/teams', authenticate, async (req: Request, res: Response) => {
    try {
      const notification: TeamsNotification = req.body;

      if (!notification.title || !notification.text) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, text',
        });
      }

      const result = await notificationService.sendTeams(notification);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Notifications] Teams send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/notifications/in-app
   * Send in-app notification
   */
  app.post('/api/notifications/in-app', authenticate, async (req: Request, res: Response) => {
    try {
      const notification: InAppNotification = req.body;

      if (!notification.userId || !notification.agentId || !notification.title || !notification.message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, agentId, title, message',
        });
      }

      const result = await notificationService.sendInApp(notification);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Notifications] In-app send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/notifications/logs
   * Get notification logs
   */
  app.get('/api/notifications/logs', authenticate, async (req: Request, res: Response) => {
    try {
      const { channel, agentId, status, limit } = req.query;

      const logs = await notificationService.getNotificationLogs({
        channel: channel as NotificationChannel,
        agentId: agentId as string,
        status: status as 'sent' | 'failed' | 'pending',
        limit: limit ? parseInt(limit as string, 10) : 100,
      });

      res.json({
        success: true,
        logs,
      });
    } catch (error: any) {
      console.error('[Notifications] Get logs error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/notifications/in-app/me
   * Get in-app notifications for current user
   */
  app.get('/api/notifications/in-app/me', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await notificationService.getInAppNotifications(req.user.id, unreadOnly);

      res.json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      console.error('[Notifications] Get in-app notifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /api/notifications/in-app/:id/read
   * Mark in-app notification as read
   */
  app.patch('/api/notifications/in-app/:id/read', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await notificationService.markAsRead(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Notifications] Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[Notifications] Notification routes registered');
}
