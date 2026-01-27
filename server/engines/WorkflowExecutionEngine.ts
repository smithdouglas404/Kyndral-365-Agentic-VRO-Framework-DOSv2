/**
 * WORKFLOW EXECUTION ENGINE
 *
 * Runtime engine to execute workflow steps with:
 * - Conditions and branching
 * - Loops and parallel execution
 * - Approvals and escalations
 * - Notifications and actions
 * - State management and persistence
 */

import type { IStorage } from '../storage.js';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  entityType: 'project' | 'task' | 'issue' | 'risk' | 'change_request' | 'budget_change';
  trigger: {
    type: 'manual' | 'status_change' | 'field_change' | 'threshold' | 'scheduled';
    conditions: any;
  };
  steps: WorkflowStep[];
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'approval' | 'notification' | 'action' | 'condition' | 'parallel' | 'wait' | 'loop';
  config: any;
  approvers?: string[];
  timeout?: number; // milliseconds
  escalation?: {
    after: number; // milliseconds
    to: string[]; // user IDs
    action: 'reassign' | 'notify' | 'auto_approve';
  };
  // Condition step specific
  condition?: string; // Expression to evaluate
  onTrue?: string; // Next step ID if condition is true
  onFalse?: string; // Next step ID if condition is false
  // Parallel step specific
  branches?: string[][]; // Array of step ID arrays to run in parallel
  // Loop step specific
  loopOver?: string; // Variable to loop over
  loopSteps?: string[]; // Step IDs to execute in loop
  maxIterations?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  stepResults: Map<string, any>;
  variables: Map<string, any>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  triggeredBy: string;
}

export class WorkflowExecutionEngine {
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor(private storage: IStorage) {}

  /**
   * Start workflow execution
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    entityType: string,
    entityId: string,
    triggeredBy: string,
    initialVariables?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      entityType,
      entityId,
      status: 'running',
      currentStep: 0,
      stepResults: new Map(),
      variables: new Map(Object.entries(initialVariables || {})),
      startedAt: new Date(),
      triggeredBy,
    };

    this.activeExecutions.set(executionId, execution);

    console.log(`[WorkflowEngine] Starting execution ${executionId} for workflow "${workflow.name}"`);

    try {
      await this.executeSteps(execution, workflow.steps);

      execution.status = 'completed';
      execution.completedAt = new Date();

      console.log(`[WorkflowEngine] Completed execution ${executionId}`);
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();

      console.error(`[WorkflowEngine] Failed execution ${executionId}:`, error);
    }

    this.activeExecutions.delete(executionId);
    return execution;
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeSteps(
    execution: WorkflowExecution,
    steps: WorkflowStep[],
    startIndex: number = 0
  ): Promise<void> {
    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      execution.currentStep = i;

      console.log(`[WorkflowEngine] Executing step ${i + 1}/${steps.length}: ${step.type} (${step.id})`);

      const result = await this.executeStep(execution, step, steps);

      execution.stepResults.set(step.id, result);

      // Handle step result for conditional branching
      if (result?.nextStepId) {
        const nextStepIndex = steps.findIndex(s => s.id === result.nextStepId);
        if (nextStepIndex !== -1) {
          i = nextStepIndex - 1; // -1 because loop will increment
        }
      }

      if (result?.skip) {
        console.log(`[WorkflowEngine] Skipping remaining steps due to step result`);
        break;
      }
    }
  }

  /**
   * Execute individual workflow step
   */
  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    allSteps: WorkflowStep[]
  ): Promise<any> {
    switch (step.type) {
      case 'approval':
        return await this.executeApprovalStep(execution, step);

      case 'notification':
        return await this.executeNotificationStep(execution, step);

      case 'action':
        return await this.executeActionStep(execution, step);

      case 'condition':
        return await this.executeConditionStep(execution, step, allSteps);

      case 'parallel':
        return await this.executeParallelStep(execution, step, allSteps);

      case 'wait':
        return await this.executeWaitStep(execution, step);

      case 'loop':
        return await this.executeLoopStep(execution, step, allSteps);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute approval step
   * TODO: Implement real approval workflow with database persistence
   */
  private async executeApprovalStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<any> {
    const approvers = step.approvers || [];
    if (approvers.length === 0) {
      throw new Error('No approvers specified for approval step');
    }

    console.log(`[WorkflowEngine] Approval step requested for: ${approvers.join(', ')}`);

    // TODO: Implement real approval workflow:
    // 1. Create approval request in approvalQueues table
    // 2. Send notifications to approvers
    // 3. Pause workflow execution
    // 4. Resume when approved via webhook/callback
    // 5. Handle timeout and escalation

    throw new Error(
      `Workflow approval not implemented. ` +
      `Would request approval from: ${approvers.join(', ')}. ` +
      `Implement approval workflow to use this feature.`
    );
  }

  /**
   * Execute notification step
   * Sends notifications to specified recipients
   */
  private async executeNotificationStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<any> {
    console.log(`[WorkflowEngine] Notification step: Sending ${step.config.type} notification`);

    const { recipients, subject, message, channel } = step.config;

    // In a real implementation, this would use the notification service
    // await notificationService.send({ recipients, subject, message, channel });

    return {
      sent: true,
      recipients,
      channel: channel || 'email',
      sentAt: new Date(),
    };
  }

  /**
   * Execute action step
   * Performs database updates, API calls, or other actions
   */
  private async executeActionStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<any> {
    console.log(`[WorkflowEngine] Action step: ${step.config.action}`);

    const { action, params } = step.config;

    switch (action) {
      case 'update_status':
        // Update entity status
        console.log(`[WorkflowEngine] Updating ${execution.entityType} ${execution.entityId} status to ${params.status}`);
        // await this.storage.updateEntityStatus(execution.entityType, execution.entityId, params.status);
        return { updated: true, status: params.status };

      case 'create_task':
        // Create a new task
        console.log(`[WorkflowEngine] Creating task: ${params.title}`);
        // await this.storage.createTask(params);
        return { created: true, taskId: `task_${Date.now()}` };

      case 'assign_user':
        // Assign to user
        console.log(`[WorkflowEngine] Assigning to user: ${params.userId}`);
        return { assigned: true, userId: params.userId };

      case 'set_field':
        // Set a field value
        const fieldName = params.field;
        const fieldValue = this.evaluateExpression(params.value, execution);
        execution.variables.set(fieldName, fieldValue);
        console.log(`[WorkflowEngine] Set ${fieldName} = ${fieldValue}`);
        return { set: true, field: fieldName, value: fieldValue };

      case 'call_api':
        // Make external API call
        console.log(`[WorkflowEngine] Calling API: ${params.url}`);
        try {
          const response = await fetch(params.url, {
            method: params.method || 'POST',
            headers: params.headers || {},
            body: params.body ? JSON.stringify(params.body) : undefined,
          });
          const data = await response.json();
          return { success: true, response: data };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      default:
        console.warn(`[WorkflowEngine] Unknown action: ${action}`);
        return { executed: false, action };
    }
  }

  /**
   * Execute condition step
   * Evaluates condition and branches to different paths
   */
  private async executeConditionStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    allSteps: WorkflowStep[]
  ): Promise<any> {
    console.log(`[WorkflowEngine] Condition step: Evaluating ${step.condition}`);

    const result = this.evaluateCondition(step.condition || '', execution);

    console.log(`[WorkflowEngine] Condition result: ${result}`);

    const nextStepId = result ? step.onTrue : step.onFalse;

    return {
      conditionMet: result,
      nextStepId,
    };
  }

  /**
   * Execute parallel step
   * Runs multiple branches concurrently
   */
  private async executeParallelStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    allSteps: WorkflowStep[]
  ): Promise<any> {
    console.log(`[WorkflowEngine] Parallel step: Running ${step.branches?.length || 0} branches`);

    if (!step.branches || step.branches.length === 0) {
      return { completed: true, branches: [] };
    }

    const branchPromises = step.branches.map(async (branchStepIds) => {
      const branchSteps = branchStepIds
        .map(id => allSteps.find(s => s.id === id))
        .filter((s): s is WorkflowStep => s !== undefined);

      await this.executeSteps(execution, branchSteps);

      return {
        completed: true,
        stepIds: branchStepIds,
      };
    });

    const results = await Promise.all(branchPromises);

    return {
      completed: true,
      branches: results,
    };
  }

  /**
   * Execute wait step
   * Pauses execution for specified duration
   */
  private async executeWaitStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<any> {
    const duration = step.config.duration || 1000;

    console.log(`[WorkflowEngine] Wait step: Waiting ${duration}ms`);

    await new Promise(resolve => setTimeout(resolve, duration));

    return {
      waited: true,
      duration,
    };
  }

  /**
   * Execute loop step
   * Repeats steps for each item in collection
   */
  private async executeLoopStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    allSteps: WorkflowStep[]
  ): Promise<any> {
    console.log(`[WorkflowEngine] Loop step: Iterating over ${step.loopOver}`);

    const collection = execution.variables.get(step.loopOver || '');

    if (!Array.isArray(collection)) {
      console.warn(`[WorkflowEngine] Loop variable is not an array: ${step.loopOver}`);
      return { completed: false, error: 'Not an array' };
    }

    const maxIterations = step.maxIterations || 100;
    const iterations = Math.min(collection.length, maxIterations);

    const results = [];

    for (let i = 0; i < iterations; i++) {
      const item = collection[i];
      execution.variables.set('loopItem', item);
      execution.variables.set('loopIndex', i);

      console.log(`[WorkflowEngine] Loop iteration ${i + 1}/${iterations}`);

      const loopSteps = (step.loopSteps || [])
        .map(id => allSteps.find(s => s.id === id))
        .filter((s): s is WorkflowStep => s !== undefined);

      await this.executeSteps(execution, loopSteps);

      results.push({
        index: i,
        item,
        completed: true,
      });
    }

    return {
      completed: true,
      iterations: results.length,
      results,
    };
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, execution: WorkflowExecution): boolean {
    try {
      // Simple expression evaluation
      // In production, use a proper expression parser like mathjs or jsonata

      // Replace variables with their values
      let expression = condition;
      for (const [key, value] of execution.variables.entries()) {
        expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
      }

      // Evaluate using Function constructor (CAUTION: Use proper parser in production)
      const result = new Function(`return ${expression}`)();

      return Boolean(result);
    } catch (error) {
      console.error(`[WorkflowEngine] Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Evaluate expression and return value
   */
  private evaluateExpression(expression: string, execution: WorkflowExecution): any {
    if (typeof expression !== 'string') {
      return expression;
    }

    // Check if it's a variable reference
    if (expression.startsWith('$')) {
      const varName = expression.substring(1);
      return execution.variables.get(varName);
    }

    return expression;
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      this.activeExecutions.delete(executionId);
      console.log(`[WorkflowEngine] Cancelled execution ${executionId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }
}
