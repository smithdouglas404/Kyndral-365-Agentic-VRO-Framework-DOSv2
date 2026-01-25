/**
 * Retool Workflows MCP (Model Context Protocol) Server
 *
 * Purpose: Enable agents to trigger Retool Workflows for deterministic tasks
 *
 * Use Cases:
 * - Notifications (Email, Slack, Teams, SMS)
 * - ETL pipelines and data syncing
 * - Scheduled reports and batch processing
 * - Automated actions and integrations
 *
 * Benefits:
 * - Agents focus on thinking, not plumbing
 * - Visual workflow management in Retool
 * - Retry logic and error handling built-in
 * - Scheduling and monitoring included
 *
 * Docs: https://docs.retool.com/workflows
 */

import { MCPBase } from './base/MCPBase.js';
import type { IStorage } from '../storage.js';

export interface RetoolWorkflowConfig {
  instanceUrl: string;    // e.g., https://yourcompany.retool.com
  apiKey: string;
}

export interface WorkflowTriggerOptions {
  workflowId: string;
  data: Record<string, any>;
  async?: boolean;        // Fire-and-forget (default: true)
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Notification types for the notification-handler workflow
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
 * Retool Workflows MCP Client
 * Extends MCPBase for production-grade reliability (circuit breaker, retry, rate limiting)
 */
export class RetoolWorkflowMCP extends MCPBase {
  private config: RetoolWorkflowConfig;
  private baseUrl: string;

  constructor(storage: IStorage, config: RetoolWorkflowConfig) {
    super(storage, 'RetoolWorkflowMCP', {
      circuitBreaker: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 60000,
        monitoringPeriod: 120000,
      },
      rateLimiter: {
        maxRequests: 100,     // Retool Workflows rate limit
        windowMs: 60000,      // Per minute
      },
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '429', '503', '504'],
      },
    });

    this.config = config;
    this.baseUrl = `${config.instanceUrl}/api`;

    console.log('[RetoolWorkflowMCP] Initialized');
  }

  /**
   * Trigger a Retool Workflow
   */
  async trigger(options: WorkflowTriggerOptions): Promise<WorkflowExecutionResult> {
    return this.executeWithSafeguards(async () => {
      const { workflowId, data, async = true } = options;

      console.log(`[RetoolWorkflowMCP] Triggering workflow: ${workflowId} (async: ${async})`);

      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          async,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Workflow trigger failed: ${response.status} ${error}`);
      }

      const responseData = await response.json();

      const result: WorkflowExecutionResult = {
        executionId: responseData.execution_id || responseData.id,
        status: async ? 'queued' : responseData.status,
        result: responseData.result,
      };

      console.log(`[RetoolWorkflowMCP] Workflow triggered: ${result.executionId} (status: ${result.status})`);

      return result;
    });
  }

  /**
   * Send notification via Retool Workflow
   * Uses the standard "notification-handler" workflow
   */
  async sendNotification(payload: NotificationPayload): Promise<WorkflowExecutionResult> {
    return this.executeWithSafeguards(async () => {
      console.log(`[RetoolWorkflowMCP] Sending ${payload.type} notification to ${payload.recipients.length} recipients`);

      return await this.trigger({
        workflowId: 'notification-handler',
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
    });
  }

  /**
   * Trigger ETL workflow
   * For data syncing, transformations, batch processing
   */
  async triggerETL(etlWorkflowId: string, data: Record<string, any>): Promise<WorkflowExecutionResult> {
    return this.executeWithSafeguards(async () => {
      console.log(`[RetoolWorkflowMCP] Triggering ETL workflow: ${etlWorkflowId}`);

      return await this.trigger({
        workflowId: etlWorkflowId,
        data: {
          ...data,
          triggered_by: 'deep-agent',
          timestamp: new Date().toISOString(),
        },
        async: true,
      });
    });
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecutionResult> {
    return this.executeWithSafeguards(async () => {
      console.log(`[RetoolWorkflowMCP] Checking execution status: ${executionId}`);

      const response = await fetch(`${this.baseUrl}/workflows/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Workflow status check failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      return {
        executionId: data.execution_id || data.id,
        status: data.status,
        result: data.result,
        error: data.error,
      };
    });
  }

  /**
   * List available workflows
   */
  async listWorkflows(): Promise<Array<{ id: string; name: string; description: string }>> {
    return this.executeWithSafeguards(async () => {
      console.log('[RetoolWorkflowMCP] Listing workflows');

      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Workflow list failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      return (data.workflows || []).map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
      }));
    });
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    return this.executeWithSafeguards(async () => {
      console.log(`[RetoolWorkflowMCP] Canceling execution: ${executionId}`);

      const response = await fetch(`${this.baseUrl}/workflows/executions/${executionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Workflow cancel failed: ${response.status} ${error}`);
      }

      console.log(`[RetoolWorkflowMCP] Execution canceled: ${executionId}`);

      return true;
    });
  }

  /**
   * Test connection to Retool Workflows
   */
  async testConnection(): Promise<boolean> {
    try {
      const workflows = await this.listWorkflows();
      console.log(`[RetoolWorkflowMCP] Connection test successful. Found ${workflows.length} workflows.`);
      return true;
    } catch (error: any) {
      console.error('[RetoolWorkflowMCP] Connection test failed:', error.message);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let retoolWorkflowInstance: RetoolWorkflowMCP | null = null;

/**
 * Initialize Retool Workflow MCP
 */
export function initializeRetoolWorkflowMCP(storage: IStorage, config: RetoolWorkflowConfig): RetoolWorkflowMCP {
  if (!retoolWorkflowInstance) {
    retoolWorkflowInstance = new RetoolWorkflowMCP(storage, config);
  }
  return retoolWorkflowInstance;
}

/**
 * Get Retool Workflow MCP instance
 */
export function getRetoolWorkflowMCP(): RetoolWorkflowMCP | null {
  if (!retoolWorkflowInstance) {
    console.warn('[RetoolWorkflowMCP] Not initialized. Call initializeRetoolWorkflowMCP() first.');
  }
  return retoolWorkflowInstance;
}
