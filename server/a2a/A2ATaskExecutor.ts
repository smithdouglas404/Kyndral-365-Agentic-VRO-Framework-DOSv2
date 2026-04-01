/**
 * A2A TASK EXECUTOR
 *
 * Executes A2A tasks by routing them to the appropriate Deep Agent.
 * Bridges between A2A protocol and existing agent infrastructure.
 */

import type { A2ATask, TaskMessage, TaskArtifact } from './types.js';
import { getA2ARegistry } from './A2ARegistry.js';
import type { IStorage } from '../storage.js';
import { v4 as uuidv4 } from 'uuid';

// Import Deep Agents dynamically to avoid circular dependencies
type DeepAgentClass = new (storage: IStorage) => {
  run(goal: string, context: any): Promise<any>;
  getConfig(): { agentId: string; agentName: string };
};

// Map agent types to their Deep Agent classes
const AGENT_CLASS_MAP: Record<string, string> = {
  pmo: 'DeepPMOAgent',
  finops: 'DeepFinOpsAgent',
  risk: 'DeepRiskAgent',
  ocm: 'DeepOCMAgent',
  tmo: 'DeepTMOAgent',
  vro: 'DeepVROAgent',
  governance: 'DeepGovernanceAgent',
  planning: 'DeepPlanningAgent',
};

/**
 * A2A Task Executor - Routes tasks to Deep Agents
 */
export class A2ATaskExecutor {
  private storage: IStorage;
  private agentInstances: Map<string, any> = new Map();

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Execute a task asynchronously
   */
  async executeTask(taskId: string): Promise<void> {
    const registry = getA2ARegistry();
    const task = registry.getTask(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const agentId = task.metadata?.agentId as string;
    if (!agentId) {
      registry.updateTaskStatus(taskId, 'failed', 'No agent specified for task');
      return;
    }

    // Update status to working
    registry.updateTaskStatus(taskId, 'working');

    try {
      // Get the agent instance
      const agent = await this.getAgentInstance(agentId);
      if (!agent) {
        registry.updateTaskStatus(taskId, 'failed', `Agent not found: ${agentId}`);
        return;
      }

      // Extract the goal from the last user message
      const lastUserMessage = [...task.messages]
        .reverse()
        .find((m) => m.role === 'user');

      if (!lastUserMessage) {
        registry.updateTaskStatus(taskId, 'failed', 'No user message in task');
        return;
      }

      const goal = this.extractTextFromMessage(lastUserMessage);

      // Build context from task metadata and previous messages
      const context = {
        taskId,
        contextId: task.contextId,
        previousMessages: task.messages,
        ...task.metadata,
      };

      // Execute the agent
      console.log(`[A2ATaskExecutor] Executing ${agentId} for task ${taskId}: ${goal.substring(0, 100)}...`);
      const result = await agent.run(goal, context);

      // Create response message
      const responseMessage: TaskMessage = {
        role: 'agent',
        parts: [
          {
            type: 'text',
            text: this.formatAgentResponse(result),
          },
        ],
        timestamp: new Date().toISOString(),
        metadata: {
          agentId,
          executionResult: result,
        },
      };

      // Add response to task
      registry.addTaskMessage(taskId, responseMessage);

      // Create artifact if result is structured
      if (result && typeof result === 'object') {
        const artifact: TaskArtifact = {
          id: uuidv4(),
          name: 'Analysis Result',
          mimeType: 'application/json',
          parts: [
            {
              type: 'data',
              mimeType: 'application/json',
              data: Buffer.from(JSON.stringify(result, null, 2)).toString('base64'),
            },
          ],
          createdAt: new Date().toISOString(),
        };

        const updatedTask = registry.getTask(taskId);
        if (updatedTask) {
          updatedTask.artifacts.push(artifact);
        }
      }

      // Mark as completed
      registry.updateTaskStatus(taskId, 'completed');
      console.log(`[A2ATaskExecutor] Task ${taskId} completed successfully`);
    } catch (error: any) {
      console.error(`[A2ATaskExecutor] Task ${taskId} failed:`, error.message);
      registry.updateTaskStatus(taskId, 'failed', error.message);

      // Add error message to task
      const errorMessage: TaskMessage = {
        role: 'system',
        parts: [
          {
            type: 'text',
            text: `Error executing task: ${error.message}`,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      registry.addTaskMessage(taskId, errorMessage);
    }
  }

  /**
   * Execute a task synchronously and return the result
   */
  async executeTaskSync(taskId: string): Promise<A2ATask> {
    await this.executeTask(taskId);
    const registry = getA2ARegistry();
    return registry.getTask(taskId)!;
  }

  /**
   * Get or create agent instance
   */
  private async getAgentInstance(agentId: string): Promise<any> {
    // Normalize agent ID (remove -agent suffix if present)
    const agentType = agentId.replace('-agent', '').toLowerCase();

    if (this.agentInstances.has(agentType)) {
      return this.agentInstances.get(agentType);
    }

    const className = AGENT_CLASS_MAP[agentType];
    if (!className) {
      console.error(`[A2ATaskExecutor] Unknown agent type: ${agentType}`);
      return null;
    }

    try {
      // Dynamic import of the agent class
      const modulePath = `../agents/deep/${className}.js`;
      const module = await import(modulePath);
      const AgentClass = module[className] || module.default;

      if (!AgentClass) {
        console.error(`[A2ATaskExecutor] Agent class not found: ${className}`);
        return null;
      }

      const instance = new AgentClass(this.storage);
      this.agentInstances.set(agentType, instance);

      console.log(`[A2ATaskExecutor] Created agent instance: ${className}`);
      return instance;
    } catch (error: any) {
      console.error(`[A2ATaskExecutor] Failed to load agent ${className}:`, error.message);
      return null;
    }
  }

  /**
   * Extract text content from a message
   */
  private extractTextFromMessage(message: TaskMessage): string {
    return message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('\n');
  }

  /**
   * Format agent response for A2A message
   */
  private formatAgentResponse(result: any): string {
    if (typeof result === 'string') {
      return result;
    }

    if (result.summary) {
      return result.summary;
    }

    if (result.content) {
      return typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content, null, 2);
    }

    if (result.result) {
      return typeof result.result === 'string'
        ? result.result
        : JSON.stringify(result.result, null, 2);
    }

    if (result.steps) {
      return `Completed ${result.steps.length} steps:\n${result.steps
        .map((s: any) => `- ${s.description}: ${s.status}`)
        .join('\n')}`;
    }

    return JSON.stringify(result, null, 2);
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    // Note: For now, we can't truly cancel a running agent
    // This marks it as canceled for the next check
    const registry = getA2ARegistry();
    registry.cancelTask(taskId);
  }
}

// Singleton instance
let executorInstance: A2ATaskExecutor | null = null;

export function getA2ATaskExecutor(storage: IStorage): A2ATaskExecutor {
  if (!executorInstance) {
    executorInstance = new A2ATaskExecutor(storage);
  }
  return executorInstance;
}
