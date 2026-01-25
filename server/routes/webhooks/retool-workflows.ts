/**
 * RETOOL WORKFLOW WEBHOOKS
 *
 * Webhook endpoints for Retool Workflows to communicate back to the system.
 * Handles async workflow completions, ETL results, and agent triggers.
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../../storage.js';
import { getRetoolWorkflowTrigger } from '../../integrations/RetoolWorkflowTrigger.js';

export interface WebhookPayload {
  workflow_id: string;
  execution_id: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Register Retool Workflow webhook endpoints
 */
export function registerRetoolWorkflowWebhooks(app: Express, storage: IStorage): void {
  console.log('[RetoolWebhooks] Registering webhook endpoints');

  /**
   * POST /webhooks/retool/workflow-complete
   * Retool Workflow completion callback
   */
  app.post('/webhooks/retool/workflow-complete', async (req: Request, res: Response) => {
    try {
      const payload: WebhookPayload = req.body;

      console.log(`[RetoolWebhooks] Workflow completed: ${payload.workflow_id} (${payload.execution_id})`);

      // Handle different workflow types
      if (payload.workflow_id === 'notification-handler') {
        await handleNotificationComplete(payload, storage);
      } else if (payload.workflow_id.startsWith('etl-')) {
        await handleETLComplete(payload, storage);
      } else {
        await handleGenericWorkflowComplete(payload, storage);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
      console.error('[RetoolWebhooks] Workflow complete error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /webhooks/retool/trigger-agent
   * Retool Workflow triggers a Deep Agent
   */
  app.post('/webhooks/retool/trigger-agent', async (req: Request, res: Response) => {
    try {
      const { agent_id, message, context } = req.body;

      if (!agent_id || !message) {
        return res.status(400).json({ error: 'agent_id and message are required' });
      }

      console.log(`[RetoolWebhooks] Triggering agent: ${agent_id}`);

      // This would connect to the agent orchestration system
      // For now, log and acknowledge
      await storage.createAgentActivityLog({
        eventType: 'autonomous_action',
        primaryAgentId: agent_id,
        primaryAgentName: agent_id,
        summary: `Agent triggered by Retool Workflow: ${message}`,
        details: JSON.stringify({ context, source: 'retool-workflow' }),
      });

      res.json({
        success: true,
        message: 'Agent trigger queued',
        agent_id,
      });
    } catch (error: any) {
      console.error('[RetoolWebhooks] Trigger agent error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /webhooks/retool/etl-data
   * Retool Workflow sends ETL results
   */
  app.post('/webhooks/retool/etl-data', async (req: Request, res: Response) => {
    try {
      const { workflow_id, data, metadata } = req.body;

      console.log(`[RetoolWebhooks] Received ETL data from workflow: ${workflow_id}`);

      // Store ETL results
      await storage.createAgentActivityLog({
        eventType: 'detection',
        primaryAgentId: 'etl-system',
        primaryAgentName: 'ETL System',
        summary: `ETL workflow completed: ${workflow_id}`,
        details: JSON.stringify({ data, metadata, source: 'retool-workflow' }),
      });

      res.json({ success: true, message: 'ETL data received' });
    } catch (error: any) {
      console.error('[RetoolWebhooks] ETL data error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /webhooks/retool/agent-collaboration
   * Retool Agent requests collaboration with Deep Agent
   */
  app.post('/webhooks/retool/agent-collaboration', async (req: Request, res: Response) => {
    try {
      const { retool_agent_id, deep_agent_id, request, context } = req.body;

      if (!retool_agent_id || !deep_agent_id || !request) {
        return res.status(400).json({ error: 'retool_agent_id, deep_agent_id, and request are required' });
      }

      console.log(`[RetoolWebhooks] Collaboration request: ${retool_agent_id} → ${deep_agent_id}`);

      // Log collaboration request
      await storage.createAgentActivityLog({
        eventType: 'agent_to_agent',
        primaryAgentId: retool_agent_id,
        primaryAgentName: `Retool Agent (${retool_agent_id})`,
        secondaryAgentId: deep_agent_id,
        secondaryAgentName: `Deep Agent (${deep_agent_id})`,
        summary: `Retool Agent requests collaboration: ${request}`,
        details: JSON.stringify({ context, source: 'retool-agent' }),
      });

      res.json({
        success: true,
        message: 'Collaboration request received',
        task_id: `collab_${Date.now()}`,
      });
    } catch (error: any) {
      console.error('[RetoolWebhooks] Agent collaboration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /webhooks/retool/health
   * Health check for Retool Workflow monitoring
   */
  app.get('/webhooks/retool/health', async (req: Request, res: Response) => {
    try {
      const workflowTrigger = getRetoolWorkflowTrigger();

      res.json({
        status: 'healthy',
        retool_workflow_configured: !!workflowTrigger,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[RetoolWebhooks] Health check error:', error);
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  console.log('[RetoolWebhooks] Webhook endpoints registered');
}

/**
 * Handle notification workflow completion
 */
async function handleNotificationComplete(payload: WebhookPayload, storage: IStorage): Promise<void> {
  console.log(`[RetoolWebhooks] Notification workflow completed: ${payload.status}`);

  // Log notification result
  await storage.createAgentActivityLog({
    eventType: 'autonomous_action',
    primaryAgentId: 'notification-system',
    primaryAgentName: 'Notification System',
    summary: `Notification workflow ${payload.status}: ${payload.execution_id}`,
    details: JSON.stringify({
      workflow_id: payload.workflow_id,
      status: payload.status,
      result: payload.result,
      error: payload.error,
    }),
  });
}

/**
 * Handle ETL workflow completion
 */
async function handleETLComplete(payload: WebhookPayload, storage: IStorage): Promise<void> {
  console.log(`[RetoolWebhooks] ETL workflow completed: ${payload.status}`);

  // Log ETL result
  await storage.createAgentActivityLog({
    eventType: 'detection',
    primaryAgentId: 'etl-system',
    primaryAgentName: 'ETL System',
    summary: `ETL workflow ${payload.status}: ${payload.workflow_id}`,
    details: JSON.stringify({
      execution_id: payload.execution_id,
      status: payload.status,
      result: payload.result,
      error: payload.error,
      metadata: payload.metadata,
    }),
  });
}

/**
 * Handle generic workflow completion
 */
async function handleGenericWorkflowComplete(payload: WebhookPayload, storage: IStorage): Promise<void> {
  console.log(`[RetoolWebhooks] Generic workflow completed: ${payload.workflow_id}`);

  await storage.createAgentActivityLog({
    eventType: 'autonomous_action',
    primaryAgentId: 'workflow-system',
    primaryAgentName: 'Workflow System',
    summary: `Workflow ${payload.status}: ${payload.workflow_id}`,
    details: JSON.stringify(payload),
  });
}
