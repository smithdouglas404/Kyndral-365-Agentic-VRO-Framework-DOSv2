/**
 * A2A AGENT REGISTRY
 *
 * Central registry for A2A agent discovery and management.
 * Supports both local agents (Deep Agents) and remote A2A agents.
 */

import type {
  AgentCard,
  AgentRegistration,
  A2ATask,
  TaskState,
  TaskMessage,
  SendMessageRequest,
  SendMessageResponse,
  ListTasksRequest,
  ListTasksResponse,
  DiscoveryResponse,
} from './types.js';
import { generateAgentCard, generateAllAgentCards } from './AgentCardGenerator.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * A2A Registry - Manages agent registration and task routing
 */
export class A2ARegistry {
  private agents: Map<string, AgentRegistration> = new Map();
  private tasks: Map<string, A2ATask> = new Map();
  private tasksByContext: Map<string, string[]> = new Map();
  private initialized: boolean = false;

  constructor() {
    console.log('[A2ARegistry] Initializing...');
  }

  /**
   * Initialize registry with local Deep Agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[A2ARegistry] Registering local Deep Agents...');

    // Generate agent cards for all local agents
    const agentCards = generateAllAgentCards();

    for (const [agentType, card] of Object.entries(agentCards)) {
      const registration: AgentRegistration = {
        agentId: card.id,
        agentCard: card,
        status: 'active',
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.agents.set(agentType, registration);
      console.log(`[A2ARegistry] Registered agent: ${card.name} (${agentType})`);
    }

    this.initialized = true;
    console.log(`[A2ARegistry] Initialized with ${this.agents.size} agents`);
  }

  /**
   * Register a remote A2A agent
   */
  async registerRemoteAgent(agentCard: AgentCard): Promise<AgentRegistration> {
    const registration: AgentRegistration = {
      agentId: agentCard.id,
      agentCard,
      status: 'active',
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agents.set(agentCard.id, registration);
    console.log(`[A2ARegistry] Registered remote agent: ${agentCard.name}`);

    return registration;
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    const deleted = this.agents.delete(agentId);
    if (deleted) {
      console.log(`[A2ARegistry] Unregistered agent: ${agentId}`);
    }
    return deleted;
  }

  /**
   * Get agent registration by ID
   */
  getAgent(agentId: string): AgentRegistration | undefined {
    // Try direct key lookup first
    let result = this.agents.get(agentId);

    // If not found and ID ends with "-agent", try without the suffix
    if (!result && agentId.endsWith('-agent')) {
      const shortId = agentId.replace('-agent', '');
      result = this.agents.get(shortId);
    }

    // If not found, try with "-agent" suffix
    if (!result && !agentId.endsWith('-agent')) {
      result = this.agents.get(`${agentId}-agent`);
    }

    // If still not found, search by agentCard.id
    if (!result) {
      for (const [, reg] of this.agents) {
        if (reg.agentCard.id === agentId) {
          result = reg;
          break;
        }
      }
    }

    return result;
  }

  /**
   * Get agent card by ID
   */
  getAgentCard(agentId: string): AgentCard | undefined {
    return this.agents.get(agentId)?.agentCard;
  }

  /**
   * List all registered agents
   */
  listAgents(filters?: { status?: string; tag?: string }): DiscoveryResponse {
    let agents = Array.from(this.agents.values());

    if (filters?.status) {
      agents = agents.filter((a) => a.status === filters.status);
    }

    if (filters?.tag) {
      agents = agents.filter((a) =>
        a.agentCard.tags?.includes(filters.tag!)
      );
    }

    return {
      agents: agents.map((a) => a.agentCard),
      total: agents.length,
    };
  }

  /**
   * Discover agents by skill
   */
  discoverBySkill(skillId: string): AgentCard[] {
    return Array.from(this.agents.values())
      .filter((a) =>
        a.agentCard.skills.some((s) => s.id === skillId || s.name.toLowerCase().includes(skillId.toLowerCase()))
      )
      .map((a) => a.agentCard);
  }

  /**
   * Discover agents by capability
   */
  discoverByCapability(capability: keyof AgentCard['capabilities']): AgentCard[] {
    return Array.from(this.agents.values())
      .filter((a) => a.agentCard.capabilities[capability])
      .map((a) => a.agentCard);
  }

  /**
   * Create a new task
   */
  async createTask(
    agentId: string,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const taskId = uuidv4();
    const contextId = request.contextId || uuidv4();

    const task: A2ATask = {
      id: taskId,
      contextId,
      status: {
        state: 'pending',
        timestamp: new Date().toISOString(),
      },
      messages: [request.message],
      artifacts: [],
      metadata: {
        agentId,
        config: request.config,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, task);

    // Track by context
    const contextTasks = this.tasksByContext.get(contextId) || [];
    contextTasks.push(taskId);
    this.tasksByContext.set(contextId, contextTasks);

    console.log(`[A2ARegistry] Created task ${taskId} for agent ${agentId}`);

    return { task };
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): A2ATask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Update task status
   */
  updateTaskStatus(
    taskId: string,
    state: TaskState,
    message?: string
  ): A2ATask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }

    task.status = {
      state,
      message,
      timestamp: new Date().toISOString(),
    };
    task.updatedAt = new Date().toISOString();

    console.log(`[A2ARegistry] Task ${taskId} status: ${state}`);

    return task;
  }

  /**
   * Add message to task
   */
  addTaskMessage(taskId: string, message: TaskMessage): A2ATask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }

    task.messages.push(message);
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * List tasks with optional filters
   */
  listTasks(request: ListTasksRequest): ListTasksResponse {
    let tasks = Array.from(this.tasks.values());

    if (request.contextId) {
      const taskIds = this.tasksByContext.get(request.contextId) || [];
      tasks = tasks.filter((t) => taskIds.includes(t.id));
    }

    if (request.state) {
      tasks = tasks.filter((t) => t.status.state === request.state);
    }

    // Sort by creation date (newest first)
    tasks.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const offset = request.offset || 0;
    const limit = request.limit || 50;
    const paginatedTasks = tasks.slice(offset, offset + limit);

    return {
      tasks: paginatedTasks,
      total: tasks.length,
      hasMore: offset + limit < tasks.length,
    };
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): A2ATask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }

    // Can only cancel non-terminal tasks
    const terminalStates: TaskState[] = ['completed', 'failed', 'canceled', 'rejected'];
    if (terminalStates.includes(task.status.state)) {
      throw new Error(`Cannot cancel task in terminal state: ${task.status.state}`);
    }

    return this.updateTaskStatus(taskId, 'canceled', 'Canceled by user');
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    tasksByState: Record<TaskState, number>;
  } {
    const tasksByState: Record<TaskState, number> = {
      pending: 0,
      working: 0,
      'input-required': 0,
      'auth-required': 0,
      completed: 0,
      failed: 0,
      canceled: 0,
      rejected: 0,
    };

    for (const task of Array.from(this.tasks.values())) {
      tasksByState[task.status.state]++;
    }

    const activeCount = Array.from(this.agents.values()).filter((a) => a.status === 'active').length;

    return {
      totalAgents: this.agents.size,
      activeAgents: activeCount,
      totalTasks: this.tasks.size,
      tasksByState,
    };
  }

  /**
   * Health check for agent
   */
  async healthCheck(agentId: string): Promise<{ healthy: boolean; latency?: number }> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return { healthy: false };
    }

    // For local agents, just check if active
    if (agent.status === 'active') {
      agent.lastHealthCheck = new Date().toISOString();
      return { healthy: true, latency: 0 };
    }

    // For remote agents, we would ping the endpoint
    // TODO: Implement remote health check

    return { healthy: agent.status === 'active' };
  }
}

// Singleton instance
let registryInstance: A2ARegistry | null = null;

export function getA2ARegistry(): A2ARegistry {
  if (!registryInstance) {
    registryInstance = new A2ARegistry();
  }
  return registryInstance;
}

export async function initializeA2ARegistry(): Promise<A2ARegistry> {
  const registry = getA2ARegistry();
  await registry.initialize();
  return registry;
}
