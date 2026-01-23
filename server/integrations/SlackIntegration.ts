/**
 * SLACK INTEGRATION
 *
 * Send notifications and updates to Slack channels
 *
 * Use Cases:
 * - Project status updates
 * - Risk alerts
 * - Milestone notifications
 * - Agent activity feed
 * - Approval requests
 *
 * API Reference:
 * https://api.slack.com/messaging/webhooks
 * https://api.slack.com/web
 */

export interface SlackConfig {
  webhookUrl?: string;           // For simple webhook posting
  botToken?: string;             // For full Slack API access
  defaultChannel?: string;       // Default channel ID or name
}

export interface SlackMessage {
  channel?: string;              // Override default channel
  text: string;                  // Main message text
  blocks?: any[];                // Rich formatting blocks
  attachments?: any[];           // Message attachments
  threadTs?: string;             // Reply to a thread
}

export class SlackIntegration {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Send a simple text message to Slack
   */
  async sendMessage(message: string, channel?: string): Promise<void> {
    if (this.config.webhookUrl) {
      await this.sendWebhookMessage(message);
    } else if (this.config.botToken) {
      await this.sendApiMessage({ text: message, channel: channel || this.config.defaultChannel });
    } else {
      throw new Error('No Slack webhook URL or bot token configured');
    }
  }

  /**
   * Send a rich formatted message using Slack Blocks
   */
  async sendRichMessage(message: SlackMessage): Promise<void> {
    if (this.config.botToken) {
      await this.sendApiMessage(message);
    } else {
      throw new Error('Rich messages require Slack bot token (not webhook)');
    }
  }

  /**
   * Send project status update to Slack
   */
  async sendProjectUpdate(project: {
    name: string;
    status: string;
    health: 'green' | 'yellow' | 'red';
    budget: { planned: number; spent: number };
    progress: number;
    url?: string;
  }): Promise<void> {
    const healthEmoji = {
      green: ':large_green_circle:',
      yellow: ':large_yellow_circle:',
      red: ':red_circle:',
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Project Update: ${project.name}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n${project.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Health:*\n${healthEmoji[project.health]} ${project.health.toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Progress:*\n${project.progress}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Budget:*\n$${project.budget.spent.toLocaleString()} / $${project.budget.planned.toLocaleString()}`,
          },
        ],
      },
    ];

    if (project.url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Project Details',
            },
            url: project.url,
          },
        ],
      } as any);
    }

    await this.sendRichMessage({ text: `Project Update: ${project.name}`, blocks });
  }

  /**
   * Send risk alert to Slack
   */
  async sendRiskAlert(risk: {
    projectName: string;
    riskTitle: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    owner?: string;
    url?: string;
  }): Promise<void> {
    const severityEmoji = {
      low: ':information_source:',
      medium: ':warning:',
      high: ':exclamation:',
      critical: ':rotating_light:',
    };

    const severityColor = {
      low: '#36a64f',
      medium: '#ff9800',
      high: '#ff5722',
      critical: '#f44336',
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji[risk.severity]} Risk Alert: ${risk.riskTitle}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Project:* ${risk.projectName}\n*Severity:* ${risk.severity.toUpperCase()}\n\n${risk.description}`,
        },
      },
    ];

    if (risk.owner) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Assigned to: ${risk.owner}`,
          },
        ],
      } as any);
    }

    if (risk.url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Risk Details',
            },
            url: risk.url,
            style: risk.severity === 'critical' ? 'danger' : 'primary',
          },
        ],
      } as any);
    }

    await this.sendRichMessage({ text: `Risk Alert: ${risk.riskTitle}`, blocks });
  }

  /**
   * Send milestone notification
   */
  async sendMilestoneNotification(milestone: {
    projectName: string;
    milestoneName: string;
    dueDate: Date;
    status: 'upcoming' | 'achieved' | 'missed';
    url?: string;
  }): Promise<void> {
    const statusEmoji = {
      upcoming: ':calendar:',
      achieved: ':white_check_mark:',
      missed: ':x:',
    };

    const text = `${statusEmoji[milestone.status]} Milestone ${milestone.status}: **${milestone.milestoneName}** in project *${milestone.projectName}*`;

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      },
    ];

    if (milestone.url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details',
            },
            url: milestone.url,
          },
        ],
      } as any);
    }

    await this.sendRichMessage({ text, blocks });
  }

  /**
   * Send approval request
   */
  async sendApprovalRequest(approval: {
    title: string;
    description: string;
    requestor: string;
    approvalUrl: string;
  }): Promise<void> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 Approval Request',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${approval.title}*\n\n${approval.description}\n\nRequested by: ${approval.requestor}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Approve',
            },
            url: approval.approvalUrl,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Reject',
            },
            url: approval.approvalUrl,
            style: 'danger',
          },
        ],
      },
    ];

    await this.sendRichMessage({ text: `Approval Request: ${approval.title}`, blocks });
  }

  /**
   * Send message via webhook (simple)
   */
  private async sendWebhookMessage(text: string): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('No webhook URL configured');
    }

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status}`);
    }
  }

  /**
   * Send message via Slack API (rich)
   */
  private async sendApiMessage(message: SlackMessage): Promise<void> {
    if (!this.config.botToken) {
      throw new Error('No bot token configured');
    }

    const payload: any = {
      channel: message.channel || this.config.defaultChannel,
      text: message.text,
    };

    if (message.blocks) {
      payload.blocks = message.blocks;
    }

    if (message.attachments) {
      payload.attachments = message.attachments;
    }

    if (message.threadTs) {
      payload.thread_ts = message.threadTs;
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.botToken) {
        // Test bot token by calling auth.test
        const response = await fetch('https://slack.com/api/auth.test', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.botToken}`,
          },
        });

        const data = await response.json();

        if (data.ok) {
          return {
            success: true,
            message: `Connected to Slack workspace: ${data.team} as ${data.user}`,
          };
        } else {
          return {
            success: false,
            message: `Slack authentication failed: ${data.error}`,
          };
        }
      } else if (this.config.webhookUrl) {
        // Test webhook by sending a test message
        await this.sendWebhookMessage('🔗 Slack integration test successful');
        return {
          success: true,
          message: 'Webhook connection successful',
        };
      } else {
        return {
          success: false,
          message: 'No Slack credentials configured',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}
