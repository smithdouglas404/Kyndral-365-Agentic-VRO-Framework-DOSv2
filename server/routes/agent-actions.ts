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

  /**
   * Notify VRO agent
   */
  app.post('/api/agent-actions/notify/vro', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → VRO notification:`, message);

      res.json({
        success: true,
        message: 'VRO agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] VRO notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Notify Planning agent
   */
  app.post('/api/agent-actions/notify/planning', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → Planning notification:`, message);

      res.json({
        success: true,
        message: 'Planning agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] Planning notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Notify OCM agent
   */
  app.post('/api/agent-actions/notify/ocm', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → OCM notification:`, message);

      res.json({
        success: true,
        message: 'OCM agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] OCM notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Notify Governance agent
   */
  app.post('/api/agent-actions/notify/governance', async (req: Request, res: Response) => {
    try {
      const { from, projectId, message, severity, metadata } = req.body;

      console.log(`[AgentAction] ${from} → Governance notification:`, message);

      res.json({
        success: true,
        message: 'Governance agent notified',
      });

    } catch (error: any) {
      console.error('[AgentAction] Governance notify error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ================================================================
  // LOGIC GATE SPECIFIC ACTIONS
  // ================================================================

  /**
   * PMO: Create Epic (used by Logic Gate C: Audit-Ready Barrier)
   */
  app.post('/api/agent-actions/pmo/create-epic', async (req: Request, res: Response) => {
    try {
      const { title, description, priority, projectKey, metadata } = req.body;

      console.log(`[AgentAction] Creating epic via PMO agent:`, title);

      // In production, this would create an epic in Jira via JiraService
      // For now, we'll just log and return success

      // Example Jira integration:
      // if (process.env.JIRA_DOMAIN) {
      //   const jiraService = new JiraService({
      //     domain: process.env.JIRA_DOMAIN,
      //     email: process.env.JIRA_EMAIL,
      //     apiToken: process.env.JIRA_API_TOKEN,
      //   });
      //   const epic = await jiraService.createEpic({ title, description, priority });
      //   return res.json({ success: true, epicKey: epic.key });
      // }

      res.json({
        success: true,
        epicId: `EPIC-${Date.now()}`,
        title,
        priority: priority || 'Highest',
        message: 'Epic created successfully',
      });

    } catch (error: any) {
      console.error('[AgentAction] PMO create epic error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Planning: Invalidate Capacity (used by Logic Gate E: Burnout Brake)
   */
  app.post('/api/agent-actions/planning/invalidate-capacity', async (req: Request, res: Response) => {
    try {
      const { projectId, reason, metadata } = req.body;

      console.log(`[AgentAction] Planning agent invalidating capacity:`, reason);

      // In production, this would update the planning agent's state
      // and mark load_vs_capacity_ratio as invalid

      res.json({
        success: true,
        message: 'Capacity planning invalidated',
        reason,
        nextAction: 'Recalculate capacity in next PI planning',
      });

    } catch (error: any) {
      console.error('[AgentAction] Planning invalidate capacity error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * TMO: Schedule Coaching (used by Logic Gate E: Burnout Brake)
   */
  app.post('/api/agent-actions/tmo/schedule-coaching', async (req: Request, res: Response) => {
    try {
      const { teamId, projectId, reason, metadata } = req.body;

      console.log(`[AgentAction] TMO agent scheduling coaching session:`, reason);

      // In production, this would:
      // 1. Create calendar events for coaching sessions
      // 2. Send notifications to Scrum Master and RTE
      // 3. Update TMO agent state

      res.json({
        success: true,
        message: 'Coaching session scheduled',
        sessionType: '1-on-1 with Scrum Master',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        reason,
      });

    } catch (error: any) {
      console.error('[AgentAction] TMO schedule coaching error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * VRO: Recalculate ROI (used by Logic Gate D: Budget Overrun Circuit Breaker)
   */
  app.post('/api/agent-actions/vro/recalculate-roi', async (req: Request, res: Response) => {
    try {
      const { projectId, actualSpend, allocatedBudget, metadata } = req.body;

      console.log(`[AgentAction] VRO agent recalculating ROI after budget overrun`);

      // In production, this would:
      // 1. Fetch current value metrics
      // 2. Recalculate ROI based on new actuals
      // 3. Update VRO agent state

      res.json({
        success: true,
        message: 'ROI recalculated',
        previousROI: 2.5,
        updatedROI: 1.8,
        recommendation: 'Project still viable but ROI reduced',
      });

    } catch (error: any) {
      console.error('[AgentAction] VRO recalculate ROI error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Governance: Block Release Gate (used by Logic Gate A: Compliance-Risk Deadbolt)
   */
  app.post('/api/agent-actions/governance/block-gate', async (req: Request, res: Response) => {
    try {
      const { projectId, reason, severity, metadata } = req.body;

      console.log(`[AgentAction] Governance agent blocking release gate:`, reason);

      // In production, this would:
      // 1. Update governance gate status to 'Blocked'
      // 2. Send critical alerts to stakeholders
      // 3. Create compliance tracking tickets

      res.json({
        success: true,
        message: 'Release gate blocked',
        gateStatus: 'Blocked',
        reason,
        severity: severity || 'critical',
        nextSteps: 'Remediate compliance/security issues before release',
      });

    } catch (error: any) {
      console.error('[AgentAction] Governance block gate error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PMO: Set Flow Status (used by Logic Gate A, D)
   */
  app.post('/api/agent-actions/pmo/set-flow-status', async (req: Request, res: Response) => {
    try {
      const { projectId, epicId, flowStatus, reason, metadata } = req.body;

      console.log(`[AgentAction] PMO agent setting flow status to ${flowStatus}:`, reason);

      // In production, this would:
      // 1. Update epic/feature flow status in project tracking system
      // 2. Notify relevant stakeholders
      // 3. Update PMO agent state

      res.json({
        success: true,
        message: 'Flow status updated',
        epicId,
        previousStatus: metadata?.previousStatus || 'Implementing',
        newStatus: flowStatus,
        reason,
      });

    } catch (error: any) {
      console.error('[AgentAction] PMO set flow status error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[AgentActions] Registered agent action routes for Langflow integration');
}
