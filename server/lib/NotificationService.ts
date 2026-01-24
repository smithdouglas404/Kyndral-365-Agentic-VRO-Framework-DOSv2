/**
 * NOTIFICATION SERVICE
 *
 * Email and notification sending infrastructure for inter-agent communication
 * and rule-based actions (trigger conditions from Knowledge Base).
 *
 * Supports:
 * - Email notifications via SMTP or SendGrid
 * - Slack webhooks
 * - Microsoft Teams webhooks
 * - In-app notifications (stored in database)
 *
 * Configuration via environment variables:
 * - NOTIFICATION_PROVIDER: 'smtp' | 'sendgrid' | 'console' (default: 'console')
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (for SMTP)
 * - SENDGRID_API_KEY (for SendGrid)
 * - SLACK_WEBHOOK_URL (optional)
 * - TEAMS_WEBHOOK_URL (optional)
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationChannel = 'email' | 'slack' | 'teams' | 'in_app';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EmailNotification {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  htmlBody?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SlackNotification {
  webhookUrl?: string;
  channel?: string;
  username?: string;
  text: string;
  attachments?: Array<{
    color?: string;
    title?: string;
    text: string;
    footer?: string;
  }>;
}

export interface TeamsNotification {
  webhookUrl?: string;
  title: string;
  text: string;
  themeColor?: string;
  sections?: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    activityText?: string;
    facts?: Array<{ name: string; value: string }>;
  }>;
}

export interface InAppNotification {
  userId: string;
  agentId: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  agentId?: string;
  triggerId?: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  private emailTransporter: Transporter | null = null;
  private provider: 'smtp' | 'sendgrid' | 'mailgun' | 'aws-ses' | 'console';
  private fromEmail: string;
  private emailConfig: any = null;
  private slackConfig: any = null;
  private teamsConfig: any = null;

  constructor() {
    this.provider = 'console'; // Default to console until marketplace config is loaded
    this.fromEmail = 'noreply@pmosystem.com';

    // Try to load from marketplace integrations
    this.loadFromMarketplace();
  }

  /**
   * Load email/notification config from marketplace integrations
   */
  private async loadFromMarketplace(): Promise<void> {
    try {
      // Check for email provider integration
      const emailProviders = ['sendgrid', 'mailgun', 'aws-ses', 'smtp-email'];

      for (const providerName of emailProviders) {
        const result = await db.execute(sql`
          SELECT * FROM integrations
          WHERE name = ${providerName}
          AND status = 'active'
          LIMIT 1
        `);

        if (result.rows.length > 0) {
          this.emailConfig = result.rows[0];
          this.provider = providerName.replace('smtp-email', 'smtp') as any;
          this.fromEmail = (this.emailConfig as any).config?.fromEmail || this.fromEmail;

          await this.initializeEmailTransporter();
          console.log(`[NotificationService] Loaded email provider from marketplace: ${providerName}`);
          break;
        }
      }

      // Check for Slack integration
      const slackResult = await db.execute(sql`
        SELECT * FROM integrations WHERE name = 'slack' AND status = 'active' LIMIT 1
      `);
      if (slackResult.rows.length > 0) {
        this.slackConfig = slackResult.rows[0];
        console.log('[NotificationService] Loaded Slack config from marketplace');
      }

      // Check for Teams integration
      const teamsResult = await db.execute(sql`
        SELECT * FROM integrations WHERE name = 'microsoft-teams' AND status = 'active' LIMIT 1
      `);
      if (teamsResult.rows.length > 0) {
        this.teamsConfig = teamsResult.rows[0];
        console.log('[NotificationService] Loaded Teams config from marketplace');
      }

    } catch (error) {
      console.warn('[NotificationService] Failed to load marketplace configs:', error);
      // Fallback to console mode
      this.provider = 'console';
    }
  }

  /**
   * Initialize email transporter based on marketplace config
   */
  private async initializeEmailTransporter(): Promise<void> {
    if (!this.emailConfig) {
      console.log('[NotificationService] No email provider configured in marketplace, using console mode');
      this.provider = 'console';
      return;
    }

    const config = this.emailConfig as any;

    if (this.provider === 'sendgrid') {
      // SendGrid REST API (we'll use nodemailer SMTP for simplicity)
      this.emailTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: config.api_key,
        },
      });
      console.log('[NotificationService] SendGrid transporter initialized from marketplace');
    }
    else if (this.provider === 'mailgun') {
      // Mailgun SMTP
      const domain = config.config?.domain || 'mg.example.com';
      this.emailTransporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 587,
        auth: {
          user: `postmaster@${domain}`,
          pass: config.api_key,
        },
      });
      console.log('[NotificationService] Mailgun transporter initialized from marketplace');
    }
    else if (this.provider === 'smtp') {
      // Generic SMTP from marketplace
      const smtpConfig = config.config || {};
      this.emailTransporter = nodemailer.createTransport({
        host: config.base_url || smtpConfig.host || 'smtp.gmail.com',
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.user || config.api_key?.split(':')[0],
          pass: smtpConfig.password || config.api_key?.split(':')[1],
        },
      });
      console.log('[NotificationService] SMTP transporter initialized from marketplace');
    }
    else if (this.provider === 'aws-ses') {
      // AWS SES (using SMTP interface for simplicity)
      const region = config.config?.region || 'us-east-1';
      this.emailTransporter = nodemailer.createTransport({
        host: `email-smtp.${region}.amazonaws.com`,
        port: 587,
        auth: {
          user: config.config?.accessKeyId || config.api_key?.split(':')[0],
          pass: config.config?.secretAccessKey || config.api_key?.split(':')[1],
        },
      });
      console.log('[NotificationService] AWS SES transporter initialized from marketplace');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Ensure tables exist
      await this.ensureNotificationTables();

      const recipients = Array.isArray(notification.to) ? notification.to.join(', ') : notification.to;

      if (this.provider === 'console') {
        console.log('[NotificationService] Email (console mode):');
        console.log(`  From: ${notification.from || this.fromEmail}`);
        console.log(`  To: ${recipients}`);
        console.log(`  Subject: ${notification.subject}`);
        console.log(`  Body: ${notification.body}`);

        // Log to database
        await this.logNotification({
          channel: 'email',
          recipient: recipients,
          subject: notification.subject,
          body: notification.body,
          status: 'sent',
          sentAt: new Date(),
        });

        return { success: true, messageId: `console-${Date.now()}` };
      }

      if (!this.emailTransporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: notification.from || this.fromEmail,
        to: notification.to,
        cc: notification.cc,
        bcc: notification.bcc,
        subject: notification.subject,
        text: notification.body,
        html: notification.htmlBody || notification.body.replace(/\n/g, '<br>'),
        replyTo: notification.replyTo,
        attachments: notification.attachments,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      console.log(`[NotificationService] Email sent: ${info.messageId} to ${recipients}`);

      // Log to database
      await this.logNotification({
        channel: 'email',
        recipient: recipients,
        subject: notification.subject,
        body: notification.body,
        status: 'sent',
        sentAt: new Date(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('[NotificationService] Email send failed:', error);

      // Log failed attempt
      await this.logNotification({
        channel: 'email',
        recipient: Array.isArray(notification.to) ? notification.to.join(', ') : notification.to,
        subject: notification.subject,
        body: notification.body,
        status: 'failed',
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlack(notification: SlackNotification): Promise<{ success: boolean; error?: string }> {
    try {
      // Get webhook URL from marketplace config or parameter
      let webhookUrl = notification.webhookUrl;

      if (!webhookUrl && this.slackConfig) {
        const config = this.slackConfig as any;
        webhookUrl = config.config?.webhookUrl || config.base_url;
      }

      if (!webhookUrl) {
        console.log('[NotificationService] Slack not configured in marketplace, skipping');
        return { success: false, error: 'Slack not configured in marketplace' };
      }

      await this.ensureNotificationTables();

      const payload: any = {
        text: notification.text,
        username: notification.username || 'PMO System',
        channel: notification.channel,
      };

      if (notification.attachments) {
        payload.attachments = notification.attachments;
      }

      if (this.provider === 'console') {
        console.log('[NotificationService] Slack (console mode):');
        console.log(`  Text: ${notification.text}`);
        console.log(`  Channel: ${notification.channel || 'default'}`);

        await this.logNotification({
          channel: 'slack',
          recipient: notification.channel || 'default',
          subject: 'Slack notification',
          body: notification.text,
          status: 'sent',
          sentAt: new Date(),
        });

        return { success: true };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      console.log(`[NotificationService] Slack notification sent to ${notification.channel || 'default'}`);

      await this.logNotification({
        channel: 'slack',
        recipient: notification.channel || 'default',
        subject: 'Slack notification',
        body: notification.text,
        status: 'sent',
        sentAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('[NotificationService] Slack send failed:', error);

      await this.logNotification({
        channel: 'slack',
        recipient: notification.channel || 'default',
        subject: 'Slack notification',
        body: notification.text,
        status: 'failed',
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send Microsoft Teams notification
   */
  async sendTeams(notification: TeamsNotification): Promise<{ success: boolean; error?: string }> {
    try {
      // Get webhook URL from marketplace config or parameter
      let webhookUrl = notification.webhookUrl;

      if (!webhookUrl && this.teamsConfig) {
        const config = this.teamsConfig as any;
        webhookUrl = config.config?.webhookUrl || config.base_url;
      }

      if (!webhookUrl) {
        console.log('[NotificationService] Teams not configured in marketplace, skipping');
        return { success: false, error: 'Teams not configured in marketplace' };
      }

      await this.ensureNotificationTables();

      const payload: any = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        title: notification.title,
        text: notification.text,
        themeColor: notification.themeColor || '0078D4',
      };

      if (notification.sections) {
        payload.sections = notification.sections;
      }

      if (this.provider === 'console') {
        console.log('[NotificationService] Teams (console mode):');
        console.log(`  Title: ${notification.title}`);
        console.log(`  Text: ${notification.text}`);

        await this.logNotification({
          channel: 'teams',
          recipient: 'default',
          subject: notification.title,
          body: notification.text,
          status: 'sent',
          sentAt: new Date(),
        });

        return { success: true };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Teams API error: ${response.statusText}`);
      }

      console.log(`[NotificationService] Teams notification sent: ${notification.title}`);

      await this.logNotification({
        channel: 'teams',
        recipient: 'default',
        subject: notification.title,
        body: notification.text,
        status: 'sent',
        sentAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('[NotificationService] Teams send failed:', error);

      await this.logNotification({
        channel: 'teams',
        recipient: 'default',
        subject: notification.title,
        body: notification.text,
        status: 'failed',
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send in-app notification
   */
  async sendInApp(notification: InAppNotification): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureNotificationTables();

      const result = await db.execute(sql`
        INSERT INTO in_app_notifications (
          user_id, agent_id, title, message, action_url, priority, metadata, read, created_at
        )
        VALUES (
          ${notification.userId},
          ${notification.agentId},
          ${notification.title},
          ${notification.message},
          ${notification.actionUrl || null},
          ${notification.priority},
          ${JSON.stringify(notification.metadata || {})},
          false,
          NOW()
        )
        RETURNING id
      `);

      const notificationId = result.rows[0]?.id;

      console.log(`[NotificationService] In-app notification created: ${notificationId} for user ${notification.userId}`);

      await this.logNotification({
        channel: 'in_app',
        recipient: notification.userId,
        subject: notification.title,
        body: notification.message,
        agentId: notification.agentId,
        status: 'sent',
        sentAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('[NotificationService] In-app notification failed:', error);

      await this.logNotification({
        channel: 'in_app',
        recipient: notification.userId,
        subject: notification.title,
        body: notification.message,
        agentId: notification.agentId,
        status: 'failed',
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(log: Omit<NotificationLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO notification_logs (
          channel, recipient, subject, body, agent_id, trigger_id, status, error, sent_at, created_at
        )
        VALUES (
          ${log.channel},
          ${log.recipient},
          ${log.subject},
          ${log.body},
          ${log.agentId || null},
          ${log.triggerId || null},
          ${log.status},
          ${log.error || null},
          ${log.sentAt || null},
          NOW()
        )
      `);
    } catch (error: any) {
      console.error('[NotificationService] Failed to log notification:', error);
    }
  }

  /**
   * Ensure notification tables exist
   */
  private async ensureNotificationTables(): Promise<void> {
    // Notification logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        agent_id TEXT,
        trigger_id TEXT,
        status TEXT NOT NULL,
        error TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // In-app notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        action_url TEXT,
        priority TEXT NOT NULL DEFAULT 'normal',
        metadata JSONB,
        read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id, read, created_at DESC)
    `);
  }

  /**
   * Get notification logs
   */
  async getNotificationLogs(filters?: {
    channel?: NotificationChannel;
    agentId?: string;
    status?: 'sent' | 'failed' | 'pending';
    limit?: number;
  }): Promise<NotificationLog[]> {
    await this.ensureNotificationTables();

    let query = sql`SELECT * FROM notification_logs WHERE 1=1`;

    if (filters?.channel) {
      query = sql`${query} AND channel = ${filters.channel}`;
    }

    if (filters?.agentId) {
      query = sql`${query} AND agent_id = ${filters.agentId}`;
    }

    if (filters?.status) {
      query = sql`${query} AND status = ${filters.status}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${filters?.limit || 100}`;

    const result = await db.execute(query);

    return result.rows.map((row: any) => ({
      id: row.id,
      channel: row.channel,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      agentId: row.agent_id,
      triggerId: row.trigger_id,
      status: row.status,
      error: row.error,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get in-app notifications for a user
   */
  async getInAppNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    await this.ensureNotificationTables();

    let query = sql`SELECT * FROM in_app_notifications WHERE user_id = ${userId}`;

    if (unreadOnly) {
      query = sql`${query} AND read = false`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT 50`;

    const result = await db.execute(query);

    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      agentId: row.agent_id,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      priority: row.priority,
      metadata: row.metadata,
      read: row.read,
      readAt: row.read_at ? new Date(row.read_at) : null,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Mark in-app notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.ensureNotificationTables();

    await db.execute(sql`
      UPDATE in_app_notifications
      SET read = true, read_at = NOW()
      WHERE id = ${notificationId}
    `);

    console.log(`[NotificationService] Notification ${notificationId} marked as read`);
  }
}

/**
 * Singleton instance
 */
let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}
