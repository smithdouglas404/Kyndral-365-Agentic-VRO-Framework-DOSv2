/**
 * A2A PROTOCOL ENDPOINTS
 *
 * Agent-to-Agent (A2A) protocol endpoints for interoperability with Retool Agents
 * and other external agent systems.
 *
 * Specification: https://a2a-protocol.org/latest/
 * Retool Docs: https://docs.retool.com/agents/concepts/a2a
 *
 * Supported Protocols: HTTP+REST, JSON-RPC
 * Authentication: API Key (Bearer token)
 */

import type { Express, Request, Response } from 'express';
import { EventEmitter } from 'events';
import type { IStorage } from '../../storage.js';

// Deep Agent registry (will be populated on server startup)
const deepAgentRegistry = new Map<string, any>();

// Task storage for async processing
interface A2ATask {
  id: string;
  agentId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const taskStore = new Map<string, A2ATask>();
const taskEmitter = new EventEmitter();

// A2A Card schema (agent discovery)
interface A2ACard {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  output_schema: {
    type: string;
    properties: Record<string, any>;
  };
}

// A2A Message schema
interface A2AMessage {
  message: string;
  context?: Record<string, any>;
  stream?: boolean; // SSE streaming support
}

// A2A Task response
interface A2ATaskResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Register Deep Agent for A2A access
 */
export function registerDeepAgent(agentId: string, agent: any): void {
  deepAgentRegistry.set(agentId, agent);
  console.log(`[A2A] Registered agent: ${agentId}`);
}

/**
 * Generate unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Register A2A routes
 */
export function registerA2ARoutes(app: Express, storage: IStorage): void {
  console.log('[A2A] Registering A2A protocol endpoints');

  /**
   * GET /a2a/agents
   * List all available agents
   */
  app.get('/a2a/agents', async (req: Request, res: Response) => {
    try {
      const agents = Array.from(deepAgentRegistry.keys()).map(agentId => ({
        id: agentId,
        href: `/a2a/agents/${agentId}/card`,
      }));

      res.json({
        agents,
        protocol_version: '1.0',
      });
    } catch (error: any) {
      console.error('[A2A] List agents error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /a2a/agents/:agentId/card
   * Get agent card (discovery information)
   */
  app.get('/a2a/agents/:agentId/card', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = deepAgentRegistry.get(agentId);

      if (!agent) {
        return res.status(404).json({ error: `Agent not found: ${agentId}` });
      }

      const config = agent.config || agent.getConfig?.();

      const card: A2ACard = {
        id: agentId,
        name: config.agentName || agentId,
        description: config.description || `Deep agent for ${config.agentType || 'general'} intelligence`,
        capabilities: config.capabilities || [],
        version: '1.0.0',
        input_schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The goal or task for the agent to accomplish',
            },
            context: {
              type: 'object',
              description: 'Additional context for the agent',
              properties: {
                projectId: { type: 'string' },
                userId: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              },
            },
          },
          required: ['message'],
        },
        output_schema: {
          type: 'object',
          properties: {
            goal: { type: 'string' },
            success: { type: 'boolean' },
            steps: { type: 'array' },
            finalReflection: { type: 'string' },
          },
        },
      };

      res.json(card);
    } catch (error: any) {
      console.error('[A2A] Get card error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /a2a/agents/:agentId/message
   * Send message to agent (async task creation)
   */
  app.post('/a2a/agents/:agentId/message', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { message, context, stream }: A2AMessage = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const agent = deepAgentRegistry.get(agentId);

      if (!agent) {
        return res.status(404).json({ error: `Agent not found: ${agentId}` });
      }

      const taskId = generateTaskId();

      // Create task
      const task: A2ATask = {
        id: taskId,
        agentId,
        status: 'processing',
        createdAt: new Date(),
      };

      taskStore.set(taskId, task);

      // Handle SSE streaming
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send initial task created event
        res.write(`data: ${JSON.stringify({ task_id: taskId, status: 'processing' })}\n\n`);

        // Listen for task updates
        const updateListener = (updatedTaskId: string) => {
          if (updatedTaskId === taskId) {
            const updatedTask = taskStore.get(taskId);
            if (updatedTask) {
              res.write(`data: ${JSON.stringify({
                task_id: taskId,
                status: updatedTask.status,
                result: updatedTask.result,
                error: updatedTask.error,
              })}\n\n`);

              if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
                res.end();
                taskEmitter.off('taskUpdate', updateListener);
              }
            }
          }
        };

        taskEmitter.on('taskUpdate', updateListener);

        // Handle client disconnect
        req.on('close', () => {
          taskEmitter.off('taskUpdate', updateListener);
        });
      } else {
        // Regular HTTP response
        res.json({
          task_id: taskId,
          status: 'processing',
          created_at: task.createdAt.toISOString(),
        });
      }

      // Execute agent asynchronously (try .run() for Deep Agents, fallback to .execute() for standard agents)
      const executePromise = typeof agent.run === 'function'
        ? agent.run(message, context || {})
        : typeof agent.execute === 'function'
        ? agent.execute(message, context || {})
        : Promise.reject(new Error(`Agent ${agentId} has no run() or execute() method`));

      executePromise
        .then((result: any) => {
          task.status = 'completed';
          task.result = result;
          task.completedAt = new Date();
          taskStore.set(taskId, task);
          taskEmitter.emit('taskUpdate', taskId);

          console.log(`[A2A] Task ${taskId} completed for agent ${agentId}`);
        })
        .catch((error: any) => {
          task.status = 'failed';
          task.error = error.message;
          task.completedAt = new Date();
          taskStore.set(taskId, task);
          taskEmitter.emit('taskUpdate', taskId);

          console.error(`[A2A] Task ${taskId} failed for agent ${agentId}:`, error);
        });

    } catch (error: any) {
      console.error('[A2A] Send message error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /a2a/tasks/:taskId
   * Poll task status
   */
  app.get('/a2a/tasks/:taskId', async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const task = taskStore.get(taskId);

      if (!task) {
        return res.status(404).json({ error: `Task not found: ${taskId}` });
      }

      const response: A2ATaskResponse = {
        task_id: task.id,
        status: task.status,
        created_at: task.createdAt.toISOString(),
      };

      if (task.result) {
        response.result = task.result;
      }

      if (task.error) {
        response.error = task.error;
      }

      if (task.completedAt) {
        response.completed_at = task.completedAt.toISOString();
      }

      res.json(response);
    } catch (error: any) {
      console.error('[A2A] Get task error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /a2a/tasks/:taskId
   * Cancel task (if still processing)
   */
  app.delete('/a2a/tasks/:taskId', async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const task = taskStore.get(taskId);

      if (!task) {
        return res.status(404).json({ error: `Task not found: ${taskId}` });
      }

      if (task.status === 'processing') {
        task.status = 'failed';
        task.error = 'Task cancelled by user';
        task.completedAt = new Date();
        taskStore.set(taskId, task);
        taskEmitter.emit('taskUpdate', taskId);
      }

      res.json({ success: true, message: 'Task cancelled' });
    } catch (error: any) {
      console.error('[A2A] Cancel task error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Cleanup old tasks periodically (keep last 1000 completed tasks)
   */
  setInterval(() => {
    const tasks = Array.from(taskStore.entries());
    const completedTasks = tasks
      .filter(([_, task]) => task.status === 'completed' || task.status === 'failed')
      .sort((a, b) => b[1].createdAt.getTime() - a[1].createdAt.getTime());

    if (completedTasks.length > 1000) {
      const tasksToRemove = completedTasks.slice(1000);
      tasksToRemove.forEach(([taskId]) => taskStore.delete(taskId));
      console.log(`[A2A] Cleaned up ${tasksToRemove.length} old tasks`);
    }
  }, 3600000); // Every hour

  console.log('[A2A] A2A protocol endpoints registered');
}
