/**
 * MICROSOFT TEAMS INTEGRATION
 *
 * Send notifications and updates to Microsoft Teams channels
 *
 * Use Cases:
 * - Project status updates
 * - Risk alerts
 * - Milestone notifications
 * - Agent activity feed
 * - Approval requests
 *
 * API Reference:
 * https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
 * https://learn.microsoft.com/en-us/graph/api/resources/message
 */

export interface TeamsConfig {
  webhookUrl?: string;           // Incoming Webhook URL
  tenantId?: string;             // Azure AD tenant ID
  clientId?: string;             // App registration client ID
  clientSecret?: string;         // App registration secret
  accessToken?: string;          // OAuth access token for Graph API
}

export interface TeamsMessage {
  title?: string;
  text: string;
  themeColor?: string;           // Hex color for message accent
  sections?: any[];              // Message sections
  potentialAction?: any[];       // Action buttons
}

export class TeamsIntegration {
  private config: TeamsConfig;

  constructor(config: TeamsConfig) {
    this.config = config;
  }

  /**
   * Send a simple text message to Teams
   */
  async sendMessage(message: string, title?: string): Promise<void> {
    await this.sendMessageCard({
      title,
      text: message,
    });
  }

  /**
   * Send an adaptive card message
   */
  async sendMessageCard(card: TeamsMessage): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('No Teams webhook URL configured');
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: card.title || card.text,
      themeColor: card.themeColor || '0078D4',
      title: card.title,
      text: card.text,
      sections: card.sections,
      potentialAction: card.potentialAction,
    };

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook error: ${response.status} ${await response.text()}`);
    }
  }

  /**
   * Send project status update to Teams
   */
  async sendProjectUpdate(project: {
    name: string;
    status: string;
    health: 'green' | 'yellow' | 'red';
    budget: { planned: number; spent: number };
    progress: number;
    url?: string;
  }): Promise<void> {
    const healthColor = {
      green: '28a745',
      yellow: 'ffc107',
      red: 'dc3545',
    };

    const healthText = {
      green: '✅ Healthy',
      yellow: '⚠️ At Risk',
      red: '🔴 Critical',
    };

    const sections = [
      {
        activityTitle: `**Project Update**`,
        activitySubtitle: project.name,
        facts: [
          {
            name: 'Status:',
            value: project.status,
          },
          {
            name: 'Health:',
            value: healthText[project.health],
          },
          {
            name: 'Progress:',
            value: `${project.progress}%`,
          },
          {
            name: 'Budget:',
            value: `$${project.budget.spent.toLocaleString()} / $${project.budget.planned.toLocaleString()}`,
          },
        ],
      },
    ];

    const potentialAction = project.url
      ? [
          {
            '@type': 'OpenUri',
            name: 'View Project Details',
            targets: [
              {
                os: 'default',
                uri: project.url,
              },
            ],
          },
        ]
      : undefined;

    await this.sendMessageCard({
      title: '📊 Project Status Update',
      text: `Project: ${project.name}`,
      themeColor: healthColor[project.health],
      sections,
      potentialAction,
    });
  }

  /**
   * Send risk alert to Teams
   */
  async sendRiskAlert(risk: {
    projectName: string;
    riskTitle: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    owner?: string;
    url?: string;
  }): Promise<void> {
    const severityColor = {
      low: '17a2b8',
      medium: 'ffc107',
      high: 'fd7e14',
      critical: 'dc3545',
    };

    const severityIcon = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '❗',
      critical: '🚨',
    };

    const sections = [
      {
        activityTitle: `${severityIcon[risk.severity]} **Risk Alert**`,
        activitySubtitle: risk.riskTitle,
        facts: [
          {
            name: 'Project:',
            value: risk.projectName,
          },
          {
            name: 'Severity:',
            value: risk.severity.toUpperCase(),
          },
          {
            name: 'Description:',
            value: risk.description,
          },
        ],
      },
    ];

    if (risk.owner) {
      sections[0].facts.push({
        name: 'Assigned to:',
        value: risk.owner,
      });
    }

    const potentialAction = risk.url
      ? [
          {
            '@type': 'OpenUri',
            name: 'View Risk Details',
            targets: [
              {
                os: 'default',
                uri: risk.url,
              },
            ],
          },
        ]
      : undefined;

    await this.sendMessageCard({
      title: '⚠️ Risk Alert',
      text: `${risk.projectName}: ${risk.riskTitle}`,
      themeColor: severityColor[risk.severity],
      sections,
      potentialAction,
    });
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
    const statusColor = {
      upcoming: '0078D4',
      achieved: '28a745',
      missed: 'dc3545',
    };

    const statusIcon = {
      upcoming: '📅',
      achieved: '✅',
      missed: '❌',
    };

    const sections = [
      {
        activityTitle: `${statusIcon[milestone.status]} **Milestone ${milestone.status.toUpperCase()}**`,
        activitySubtitle: milestone.milestoneName,
        facts: [
          {
            name: 'Project:',
            value: milestone.projectName,
          },
          {
            name: 'Due Date:',
            value: milestone.dueDate.toLocaleDateString(),
          },
        ],
      },
    ];

    const potentialAction = milestone.url
      ? [
          {
            '@type': 'OpenUri',
            name: 'View Details',
            targets: [
              {
                os: 'default',
                uri: milestone.url,
              },
            ],
          },
        ]
      : undefined;

    await this.sendMessageCard({
      title: '🎯 Milestone Update',
      text: `${milestone.projectName}: ${milestone.milestoneName}`,
      themeColor: statusColor[milestone.status],
      sections,
      potentialAction,
    });
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
    const sections = [
      {
        activityTitle: '**Approval Request**',
        activitySubtitle: approval.title,
        facts: [
          {
            name: 'Description:',
            value: approval.description,
          },
          {
            name: 'Requested by:',
            value: approval.requestor,
          },
        ],
      },
    ];

    const potentialAction = [
      {
        '@type': 'OpenUri',
        name: '✅ Approve',
        targets: [
          {
            os: 'default',
            uri: `${approval.approvalUrl}?action=approve`,
          },
        ],
      },
      {
        '@type': 'OpenUri',
        name: '❌ Reject',
        targets: [
          {
            os: 'default',
            uri: `${approval.approvalUrl}?action=reject`,
          },
        ],
      },
    ];

    await this.sendMessageCard({
      title: '📋 Approval Required',
      text: approval.title,
      themeColor: '0078D4',
      sections,
      potentialAction,
    });
  }

  /**
   * Test Teams connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.webhookUrl) {
        // Test webhook by sending a test message
        await this.sendMessage('🔗 Microsoft Teams integration test successful', 'Connection Test');
        return {
          success: true,
          message: 'Webhook connection successful',
        };
      } else {
        return {
          success: false,
          message: 'No Teams webhook URL configured',
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
