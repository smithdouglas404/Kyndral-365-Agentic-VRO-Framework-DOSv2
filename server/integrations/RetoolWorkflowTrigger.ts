/**
 * RETOOL WORKFLOW TRIGGER
 *
 * Integration for triggering Retool Workflows from Deep Agents.
 * Offloads deterministic tasks (notifications, ETL, data processing) to workflows.
 *
 * Benefits:
 * - Agents focus on thinking, not plumbing
 * - Visual workflow management in Retool
 * - Retry logic and error handling built-in
 * - Scheduling and monitoring included
 *
 * Docs: https://docs.retool.com/workflows
 */

import axios, { AxiosInstance } from 'axios';

export interface RetoolWorkflowConfig {
  apiKey: string;
  instanceUrl: string; // e.g., https://yourcompany.retool.com
}

export interface WorkflowTriggerOptions {
  workflowId: string;
  data: Record<string, any>;
  async?: boolean; // Fire-and-forget (default: true)
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Notification types that can be sent via Retool Workflows
 */
export enum NotificationType {
  EMAIL = 'email',
  SLACK = 'slack',
  TEAMS = 'teams',
  SMS = 'sms',
  WEBHOOK = 'webhook',
}

export interface NotificationPayload {
  type: NotificationType;
  recipients: string[];
  subject?: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Retool Workflow Trigger Client
 */
export class RetoolWorkflowTrigger {
  private client: AxiosInstance;
  private config: RetoolWorkflowConfig;

  constructor(config: RetoolWorkflowConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.instanceUrl}/api`,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('[RetoolWorkflow] Client initialized');
  }

  /**
   * Trigger a Retool Workflow
   */
  async trigger(options: WorkflowTriggerOptions): Promise<WorkflowExecutionResult> {
    try {
      const { workflowId, data, async = true } = options;

      console.log(`[RetoolWorkflow] Triggering workflow: ${workflowId}`);

      const response = await this.client.post(`/workflows/${workflowId}/trigger`, {
        data,
        async,
      });

      const result: WorkflowExecutionResult = {
        executionId: response.data.execution_id,
        status: async ? 'queued' : response.data.status,
        result: response.data.result,
      };

      console.log(`[RetoolWorkflow] Workflow triggered: ${result.executionId}`);

      return result;
    } catch (error: any) {
      console.error('[RetoolWorkflow] Trigger error:', error.message);

      // Return graceful fallback if workflow service is unavailable
      if (error.code === 'ECONNREFUSED' || error.response?.status === 401) {
        console.warn('[RetoolWorkflow] Not configured or unavailable');
        return {
          executionId: `fallback_${Date.now()}`,
          status: 'failed',
          error: 'Retool Workflow service not available',
        };
      }

      throw error;
    }
  }

  /**
   * Send notification via Retool Workflow
   * Offloads notification logic to workflow (email, Slack, Teams, etc.)
   */
  async sendNotification(payload: NotificationPayload): Promise<WorkflowExecutionResult> {
    try {
      console.log(`[RetoolWorkflow] Sending ${payload.type} notification to ${payload.recipients.length} recipients`);

      // Trigger notification workflow
      return await this.trigger({
        workflowId: 'notification-handler', // Standard notification workflow
        data: {
          type: payload.type,
          recipients: payload.recipients,
          subject: payload.subject,
          message: payload.message,
          severity: payload.severity || 'info',
          metadata: payload.metadata || {},
          timestamp: new Date().toISOString(),
        },
        async: true,
      });
    } catch (error: any) {
      console.error('[RetoolWorkflow] Send notification error:', error.message);

      // Fallback: Log to console if workflow unavailable
      console.warn(`[NOTIFICATION FALLBACK] ${payload.type}: ${payload.message}`);

      return {
        executionId: `fallback_${Date.now()}`,
        status: 'failed',
        error: 'Workflow unavailable, logged to console',
      };
    }
  }

  /**
   * Trigger ETL workflow
   * For data syncing, transformations, batch processing
   */
  async triggerETL(etlWorkflowId: string, data: Record<string, any>): Promise<WorkflowExecutionResult> {
    try {
      console.log(`[RetoolWorkflow] Triggering ETL workflow: ${etlWorkflowId}`);

      return await this.trigger({
        workflowId: etlWorkflowId,
        data: {
          ...data,
          triggered_by: 'deep-agent',
          timestamp: new Date().toISOString(),
        },
        async: true,
      });
    } catch (error: any) {
      console.error('[RetoolWorkflow] ETL trigger error:', error.message);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecutionResult> {
    try {
      const response = await this.client.get(`/workflows/executions/${executionId}`);

      return {
        executionId: response.data.execution_id,
        status: response.data.status,
        result: response.data.result,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error('[RetoolWorkflow] Get execution status error:', error.message);
      throw error;
    }
  }

  /**
   * List available workflows
   */
  async listWorkflows(): Promise<Array<{ id: string; name: string; description: string }>> {
    try {
      const response = await this.client.get('/workflows');
      return response.data.workflows;
    } catch (error: any) {
      console.error('[RetoolWorkflow] List workflows error:', error.message);
      return [];
    }
  }
}

/**
 * Singleton instance
 */
let retoolWorkflowInstance: RetoolWorkflowTrigger | null = null;

/**
 * Initialize Retool Workflow trigger
 */
export function initializeRetoolWorkflow(config: RetoolWorkflowConfig): RetoolWorkflowTrigger {
  if (!retoolWorkflowInstance) {
    retoolWorkflowInstance = new RetoolWorkflowTrigger(config);
  }
  return retoolWorkflowInstance;
}

/**
 * Get Retool Workflow trigger instance
 */
export function getRetoolWorkflowTrigger(): RetoolWorkflowTrigger | null {
  return retoolWorkflowInstance;
}
