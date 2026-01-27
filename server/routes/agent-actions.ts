/**
 * AGENT ACTION ROUTES
 * Server endpoints that Langflow flows call to trigger MCP integrations
 * These routes use the real MCP services (Jira, ServiceNow, Monday, etc.)
 */

import type { Express, Request, Response } from 'express';
import { JiraService } from '../mcp/JiraService.js';
import { ServiceNowService } from '../mcp/ServiceNowService.js';

/**
 * Register agent action routes
 * These are called by Langflow workflows to execute MCP integrations
 */
export function registerAgentActionRoutes(app: Express): void {

  // ================================================================
  // JIRA ACTIONS
  // ================================================================

  /**
   * Create Jira issue from agent alert
   * Called by Langflow flows when agents detect issues
   */
  app.post('/api/agent-actions/jira/create-issue', async (req: Request, res: Response) => {
    try {
      const { projectKey, summary, description, priority, issuetype, labels, agentId } = req.body;

      // Validate required env vars
      if (!process.env.JIRA_DOMAIN || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
        return res.status(400).json({
          success: false,
          error: 'Jira not configured. Set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN in .env'
        });
      }

      // Initialize Jira service
      const jiraService = new JiraService({
        domain: process.env.JIRA_DOMAIN,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
      });

      // Create issue
      const issue = await jiraService.createIssue({
        fields: {
          project: { key: projectKey },
          summary,
          description,
          issuetype: { name: issuetype || 'Task' },
          priority: priority ? { name: priority } : undefined,
          labels: labels || [`agent-${agentId}`, 'auto-generated'],
        }
      });

      console.log(`[AgentAction] Created Jira issue ${issue.key} from ${agentId} agent`);

      res.json({
        success: true,
        issueKey: issue.key,
        issueId: issue.id,
        issueUrl: `https://${process.env.JIRA_DOMAIN}/browse/${issue.key}`,
      });

    } catch (error: any) {
      console.error('[AgentAction] Jira create error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Update Jira issue
   */
  app.post('/api/agent-actions/jira/update-issue', async (req: Request, res: Response) => {
    try {
      const { issueKey, updates } = req.body;

      if (!process.env.JIRA_DOMAIN || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
        return res.status(400).json({
          success: false,
          error: 'Jira not configured'
        });
      }

      const jiraService = new JiraService({
        domain: process.env.JIRA_DOMAIN,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
      });

      await jiraService.updateIssue(issueKey, updates);

      res.json({
        success: true,
        issueKey,
      });

    } catch (error: any) {
      console.error('[AgentAction] Jira update error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Add comment to Jira issue
   */
  app.post('/api/agent-actions/jira/add-comment', async (req: Request, res: Response) => {
    try {
      const { issueKey, comment } = req.body;

      if (!process.env.JIRA_DOMAIN || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
        return res.status(400).json({
          success: false,
          error: 'Jira not configured'
        });
      }

      const jiraService = new JiraService({
        domain: process.env.JIRA_DOMAIN,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
      });

      const result = await jiraService.addComment(issueKey, comment);

      res.json({
        success: true,
        commentId: result.id,
      });

    } catch (error: any) {
      console.error('[AgentAction] Jira comment error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ================================================================
  // SERVICENOW ACTIONS
  // ================================================================

  /**
   * Create ServiceNow incident from agent alert
   */
  app.post('/api/agent-actions/servicenow/create-incident', async (req: Request, res: Response) => {
    try {
      const { shortDescription, description, priority, urgency, impact, category, agentId } = req.body;

      // Validate required env vars
      if (!process.env.SERVICENOW_INSTANCE || !process.env.SERVICENOW_USERNAME || !process.env.SERVICENOW_PASSWORD) {
        return res.status(400).json({
          success: false,
          error: 'ServiceNow not configured. Set SERVICENOW_INSTANCE, SERVICENOW_USERNAME, and SERVICENOW_PASSWORD in .env'
        });
      }

      // Initialize ServiceNow service
      const serviceNowService = new ServiceNowService({
        instance: process.env.SERVICENOW_INSTANCE,
        username: process.env.SERVICENOW_USERNAME,
        password: process.env.SERVICENOW_PASSWORD,
      });

      // Create incident
      const incident = await serviceNowService.createIncident({
        short_description: shortDescription,
        description,
        priority: priority || '3',
        urgency: urgency || '3',
        impact: impact || '3',
        category: category || 'Project Management',
        caller_id: 'system', // Could map to agent
        assignment_group: 'PMO',
      });

      console.log(`[AgentAction] Created ServiceNow incident ${incident.number} from ${agentId} agent`);

      res.json({
        success: true,
        incidentNumber: incident.number,
        incidentSysId: incident.sys_id,
        incidentUrl: `https://${process.env.SERVICENOW_INSTANCE}/nav_to.do?uri=incident.do?sys_id=${incident.sys_id}`,
      });

    } catch (error: any) {
      console.error('[AgentAction] ServiceNow create error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Update ServiceNow incident
   */
  app.post('/api/agent-actions/servicenow/update-incident', async (req: Request, res: Response) => {
    try {
      const { incidentSysId, updates } = req.body;

      if (!process.env.SERVICENOW_INSTANCE || !process.env.SERVICENOW_USERNAME || !process.env.SERVICENOW_PASSWORD) {
        return res.status(400).json({
          success: false,
          error: 'ServiceNow not configured'
        });
      }

      const serviceNowService = new ServiceNowService({
        instance: process.env.SERVICENOW_INSTANCE,
        username: process.env.SERVICENOW_USERNAME,
        password: process.env.SERVICENOW_PASSWORD,
      });

      await serviceNowService.updateIncident(incidentSysId, updates);

      res.json({
        success: true,
        incidentSysId,
      });

    } catch (error: any) {
      console.error('[AgentAction] ServiceNow update error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ================================================================
  // SLACK ACTIONS (If you have Slack webhook)
  // ================================================================

  /**
   * Send Slack notification
   */
  app.post('/api/agent-actions/slack/notify', async (req: Request, res: Response) => {
    try {
      const { channel, text, blocks, agentId } = req.body;

      // Validate required env vars
      if (!process.env.SLACK_WEBHOOK_URL) {
        return res.status(400).json({
          success: false,
          error: 'Slack not configured. Set SLACK_WEBHOOK_URL in .env'
        });
      }

      // Send to Slack webhook
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channel || '#agent-alerts',
          text: text || `Alert from ${agentId} agent`,
          blocks: blocks || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      console.log(`[AgentAction] Sent Slack notification from ${agentId} agent`);

      res.json({
        success: true,
        channel: channel || '#agent-alerts',
      });

    } catch (error: any) {
      console.error('[AgentAction] Slack notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ================================================================
  // AGENT-TO-AGENT NOTIFICATIONS
  // ================================================================

  /**
   * Notify TMO agent (from FinOps/Risk)
   */
  app.post('/api/agent-actions/notify/tmo', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → TMO notification:`, message);

      // Store in agent communication log (you can implement this)
      // await storage.logAgentCommunication({ from, to: 'tmo', projectId, message, severity });

      res.json({
        success: true,
        message: 'TMO agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] TMO notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Notify FinOps agent (from TMO/Risk)
   */
  app.post('/api/agent-actions/notify/finops', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → FinOps notification:`, message);

      res.json({
        success: true,
        message: 'FinOps agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] FinOps notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Notify PMO agent (from Risk/VRO)
   */
  app.post('/api/agent-actions/notify/pmo', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → PMO notification:`, message);

      res.json({
        success: true,
        message: 'PMO agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] PMO notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Notify Risk agent
   */
  app.post('/api/agent-actions/notify/risk', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → Risk notification:`, message);

      res.json({
        success: true,
        message: 'Risk agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] Risk notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[AgentActions] Registered agent action routes for Langflow integration');
}
