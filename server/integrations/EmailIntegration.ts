/**
 * EMAIL (SMTP) INTEGRATION
 *
 * Send email notifications using SMTP
 *
 * Use Cases:
 * - Project status reports
 * - Risk alerts
 * - Milestone notifications
 * - Weekly digest emails
 * - Approval requests
 *
 * Supports:
 * - SMTP (Gmail, Office365, SendGrid, AWS SES, etc.)
 * - HTML and plain text emails
 * - Attachments
 * - CC and BCC
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;                  // SMTP host (e.g., smtp.gmail.com)
  port: number;                  // SMTP port (465 for SSL, 587 for TLS)
  secure: boolean;               // Use SSL (true for port 465)
  auth: {
    user: string;                // SMTP username
    pass: string;                // SMTP password or app-specific password
  };
  from: string;                  // Default "from" address
}

export interface EmailMessage {
  to: string | string[];         // Recipient email(s)
  cc?: string | string[];        // CC recipient(s)
  bcc?: string | string[];       // BCC recipient(s)
  subject: string;               // Email subject
  text?: string;                 // Plain text body
  html?: string;                 // HTML body
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

export class EmailIntegration {
  private config: EmailConfig;
  private transporter: Transporter;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  /**
   * Send an email
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailIntegration] Email sent to ${message.to}`);
    } catch (error: any) {
      console.error('[EmailIntegration] Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send project status update email
   */
  async sendProjectUpdate(
    recipients: string[],
    project: {
      name: string;
      status: string;
      health: 'green' | 'yellow' | 'red';
      budget: { planned: number; spent: number };
      progress: number;
      url?: string;
    }
  ): Promise<void> {
    const healthColor = {
      green: '#28a745',
      yellow: '#ffc107',
      red: '#dc3545',
    };

    const healthText = {
      green: '✅ Healthy',
      yellow: '⚠️ At Risk',
      red: '🔴 Critical',
    };

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: ${healthColor[project.health]};">📊 Project Status Update</h2>
            <h3>${project.name}</h3>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${project.status}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Health:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${healthColor[project.health]};">
                  ${healthText[project.health]}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Progress:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${project.progress}%</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Budget:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  $${project.budget.spent.toLocaleString()} / $${project.budget.planned.toLocaleString()}
                </td>
              </tr>
            </table>

            ${project.url ? `<p><a href="${project.url}" style="display: inline-block; padding: 10px 20px; background-color: #0078D4; color: white; text-decoration: none; border-radius: 4px;">View Project Details</a></p>` : ''}

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message from your Project Management system.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Project Status Update: ${project.name}

Status: ${project.status}
Health: ${healthText[project.health]}
Progress: ${project.progress}%
Budget: $${project.budget.spent.toLocaleString()} / $${project.budget.planned.toLocaleString()}

${project.url ? `View details: ${project.url}` : ''}
    `.trim();

    await this.sendEmail({
      to: recipients,
      subject: `📊 Project Update: ${project.name}`,
      text,
      html,
    });
  }

  /**
   * Send risk alert email
   */
  async sendRiskAlert(
    recipients: string[],
    risk: {
      projectName: string;
      riskTitle: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      owner?: string;
      url?: string;
    }
  ): Promise<void> {
    const severityColor = {
      low: '#17a2b8',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid ${severityColor[risk.severity]}; border-radius: 8px;">
            <h2 style="color: ${severityColor[risk.severity]};">⚠️ Risk Alert</h2>
            <h3>${risk.riskTitle}</h3>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Project:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${risk.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Severity:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${severityColor[risk.severity]};">
                  ${risk.severity.toUpperCase()}
                </td>
              </tr>
              ${risk.owner ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Assigned to:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${risk.owner}</td>
              </tr>
              ` : ''}
            </table>

            <div style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid ${severityColor[risk.severity]}; margin: 20px 0;">
              <p><strong>Description:</strong></p>
              <p>${risk.description}</p>
            </div>

            ${risk.url ? `<p><a href="${risk.url}" style="display: inline-block; padding: 10px 20px; background-color: ${severityColor[risk.severity]}; color: white; text-decoration: none; border-radius: 4px;">View Risk Details</a></p>` : ''}

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated risk alert from your Project Management system.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: recipients,
      subject: `⚠️ ${risk.severity.toUpperCase()} Risk Alert: ${risk.riskTitle}`,
      html,
    });
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(
    recipients: string[],
    digest: {
      weekEnding: Date;
      projectCount: number;
      milestones: Array<{ name: string; status: string }>;
      risks: Array<{ name: string; severity: string }>;
      completedTasks: number;
      dashboardUrl?: string;
    }
  ): Promise<void> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #0078D4;">📈 Weekly Project Digest</h2>
            <p style="color: #666;">Week ending ${digest.weekEnding.toLocaleDateString()}</p>

            <div style="background-color: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Summary</h3>
              <ul style="list-style: none; padding: 0;">
                <li>📊 Active Projects: ${digest.projectCount}</li>
                <li>✅ Completed Tasks: ${digest.completedTasks}</li>
                <li>🎯 Milestones: ${digest.milestones.length}</li>
                <li>⚠️ Active Risks: ${digest.risks.length}</li>
              </ul>
            </div>

            ${digest.milestones.length > 0 ? `
            <h3>Milestones This Week</h3>
            <ul>
              ${digest.milestones.map(m => `<li>${m.name} - ${m.status}</li>`).join('')}
            </ul>
            ` : ''}

            ${digest.risks.length > 0 ? `
            <h3>Active Risks</h3>
            <ul>
              ${digest.risks.map(r => `<li><strong>${r.severity}</strong>: ${r.name}</li>`).join('')}
            </ul>
            ` : ''}

            ${digest.dashboardUrl ? `<p><a href="${digest.dashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0078D4; color: white; text-decoration: none; border-radius: 4px;">View Full Dashboard</a></p>` : ''}

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is your weekly automated digest from the Project Management system.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: recipients,
      subject: `📈 Weekly Project Digest - ${digest.weekEnding.toLocaleDateString()}`,
      html,
    });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection successful',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}
