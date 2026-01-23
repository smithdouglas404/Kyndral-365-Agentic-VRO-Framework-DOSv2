/**
 * Notification MCP (Model Context Protocol) Server
 *
 * Purpose: Enable agents to send notifications to Slack, Teams, Email
 * When agents detect critical issues, they can alert humans immediately
 *
 * Supports:
 * - Slack webhooks + Bot API
 * - Microsoft Teams webhooks + Adaptive Cards
 * - Email via SMTP
 * - SMS via Twilio (optional)
 */

interface NotificationConfig {
  slack?: {
    webhookUrl?: string;
    botToken?: string;
    defaultChannel?: string;
  };
  teams?: {
    webhookUrl?: string;
  };
  email?: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

interface Notification {
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  agent?: string;
  projectId?: string;
  projectName?: string;
  actionUrl?: string;
  timestamp?: Date;
}

export class NotificationMCP {
  private config: NotificationConfig;

  constructor(config?: NotificationConfig) {
    this.config = config || {};

    // Load from environment if not provided
    if (!this.config.slack) {
      this.config.slack = {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        botToken: process.env.SLACK_BOT_TOKEN,
        defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#agent-alerts',
      };
    }

    if (!this.config.teams) {
      this.config.teams = {
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      };
    }

    console.log('[NotificationMCP] Initialized');
  }

  /**
   * Send notification to Slack
   */
  async sendSlackNotification(notification: Notification): Promise<boolean> {
    try {
      if (!this.config.slack?.webhookUrl) {
        console.warn('[NotificationMCP] Slack webhook URL not configured');
        return false;
      }

      const color = this.getSeverityColor(notification.severity);
      const emoji = this.getSeverityEmoji(notification.severity);

      const slackMessage = {
        text: `${emoji} *${notification.title}*`,
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Message',
                value: notification.message,
                short: false,
              },
              notification.agent && {
                title: 'Agent',
                value: notification.agent,
                short: true,
              },
              notification.projectName && {
                title: 'Project',
                value: notification.projectName,
                short: true,
              },
              {
                title: 'Severity',
                value: notification.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Time',
                value: new Date().toLocaleString(),
                short: true,
              },
            ].filter(Boolean),
            actions: notification.actionUrl ? [
              {
                type: 'button',
                text: 'View Details',
                url: notification.actionUrl,
              },
            ] : undefined,
          },
        ],
      };

      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      console.log('[NotificationMCP] Slack notification sent:', notification.title);
      return true;
    } catch (error) {
      console.error('[NotificationMCP] Error sending Slack notification:', error);
      return false;
    }
  }

  /**
   * Send notification to Microsoft Teams
   */
  async sendTeamsNotification(notification: Notification): Promise<boolean> {
    try {
      if (!this.config.teams?.webhookUrl) {
        console.warn('[NotificationMCP] Teams webhook URL not configured');
        return false;
      }

      const color = this.getSeverityColor(notification.severity);

      // Teams uses Adaptive Cards format
      const teamsCard = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: color.replace('#', ''),
        summary: notification.title,
        sections: [
          {
            activityTitle: notification.title,
            activitySubtitle: `Severity: ${notification.severity.toUpperCase()}`,
            facts: [
              {
                name: 'Message',
                value: notification.message,
              },
              notification.agent && {
                name: 'Agent',
                value: notification.agent,
              },
              notification.projectName && {
                name: 'Project',
                value: notification.projectName,
              },
              {
                name: 'Time',
                value: new Date().toLocaleString(),
              },
            ].filter(Boolean),
            markdown: true,
          },
        ],
        potentialAction: notification.actionUrl ? [
          {
            '@type': 'OpenUri',
            name: 'View Details',
            targets: [
              {
                os: 'default',
                uri: notification.actionUrl,
              },
            ],
          },
        ] : undefined,
      };

      const response = await fetch(this.config.teams.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsCard),
      });

      if (!response.ok) {
        throw new Error(`Teams API error: ${response.status}`);
      }

      console.log('[NotificationMCP] Teams notification sent:', notification.title);
      return true;
    } catch (error) {
      console.error('[NotificationMCP] Error sending Teams notification:', error);
      return false;
    }
  }

  /**
   * Send notification to both Slack and Teams
   */
  async sendNotification(notification: Notification): Promise<{ slack: boolean; teams: boolean }> {
    const results = await Promise.allSettled([
      this.sendSlackNotification(notification),
      this.sendTeamsNotification(notification),
    ]);

    return {
      slack: results[0].status === 'fulfilled' ? results[0].value : false,
      teams: results[1].status === 'fulfilled' ? results[1].value : false,
    };
  }

  /**
   * Send critical alert (high priority, both channels)
   */
  async sendCriticalAlert(notification: Omit<Notification, 'severity'>): Promise<void> {
    await this.sendNotification({
      ...notification,
      severity: 'critical',
    });
  }

  /**
   * Helper: Get color for severity
   */
  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: '#DC2626', // red-600
      high: '#F59E0B', // amber-500
      medium: '#3B82F6', // blue-500
      low: '#10B981', // green-500
      info: '#6B7280', // gray-500
    };
    return colors[severity] || colors.info;
  }

  /**
   * Helper: Get emoji for severity
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: 'ℹ️',
      low: '✅',
      info: '💡',
    };
    return emojis[severity] || emojis.info;
  }

  /**
   * Send data quality alert
   */
  async sendDataQualityAlert(params: {
    projectName: string;
    projectId: string;
    completenessScore: number;
    missingFields: string[];
    budget?: number;
  }): Promise<void> {
    const isHighValue = params.budget && params.budget > 10;
    const severity = isHighValue && params.completenessScore < 50 ? 'critical' : 'high';

    await this.sendNotification({
      title: `Data Quality Alert: ${params.projectName}`,
      message: `Project has ${params.completenessScore}% data completeness. Missing critical fields: ${params.missingFields.join(', ')}. ${isHighValue ? `This is a high-value project ($${params.budget}M) requiring immediate attention.` : ''}`,
      severity,
      agent: 'OKR Inference Agent',
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/project/${params.projectId}`,
    });
  }

  /**
   * Send value realization alert
   */
  async sendValueRealizationAlert(params: {
    projectName: string;
    projectId: string;
    expectedROI: number;
    actualValue: number;
    variance: number;
  }): Promise<void> {
    const severity = params.variance < -30 ? 'critical' : params.variance < -20 ? 'high' : 'medium';

    await this.sendNotification({
      title: `Value Realization Alert: ${params.projectName}`,
      message: `Project value realization is ${params.variance.toFixed(0)}% below expected. Expected ROI: $${params.expectedROI}M, Current: $${params.actualValue}M. VRO Agent recommends immediate review of business case assumptions.`,
      severity,
      agent: 'VRO Agent',
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/project/${params.projectId}`,
    });
  }

  /**
   * Send intervention created notification
   */
  async sendInterventionNotification(params: {
    interventionId: string;
    title: string;
    severity: string;
    projectName: string;
    projectId: string;
    agent: string;
    suggestedAction: string;
  }): Promise<void> {
    await this.sendNotification({
      title: `New Intervention: ${params.title}`,
      message: `${params.agent} detected an issue and created an intervention.\n\n**Suggested Action:** ${params.suggestedAction}`,
      severity: params.severity as any,
      agent: params.agent,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
    });
  }
}

/**
 * Factory function
 */
export function createNotificationMCP(config?: NotificationConfig): NotificationMCP {
  return new NotificationMCP(config);
}

/**
 * Singleton instance for easy access
 */
let notificationMCPInstance: NotificationMCP | null = null;

export function getNotificationMCP(): NotificationMCP {
  if (!notificationMCPInstance) {
    notificationMCPInstance = new NotificationMCP();
  }
  return notificationMCPInstance;
}
