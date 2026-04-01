/**
 * A2A PROTOCOL ROUTES
 *
 * Implements the Agent-to-Agent (A2A) protocol HTTP binding.
 * Provides standardized endpoints for agent discovery and task management.
 *
 * Endpoints:
 * - GET  /.well-known/a2a/agent-card    - Discover all agents
 * - GET  /api/a2a/agents                - List all agents
 * - GET  /api/a2a/agents/:agentId       - Get agent card
 * - POST /api/a2a/agents/:agentId/tasks - Send message (create task)
 * - GET  /api/a2a/tasks                 - List tasks
 * - GET  /api/a2a/tasks/:taskId         - Get task
 * - POST /api/a2a/tasks/:taskId/cancel  - Cancel task
 * - GET  /api/a2a/discover              - Discover agents by skill/capability
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

import express from 'express';
import { getA2ARegistry, initializeA2ARegistry } from '../a2a/A2ARegistry.js';
import { getA2ATaskExecutor } from '../a2a/A2ATaskExecutor.js';
import { generateAllAgentCards, setA2ABaseUrl } from '../a2a/AgentCardGenerator.js';
import type { SendMessageRequest, TaskMessage, ListTasksRequest } from '../a2a/types.js';
import type { IStorage } from '../storage.js';

const router = express.Router();

// Storage reference (injected from main routes)
let storageRef: IStorage | null = null;

export function setA2AStorage(storage: IStorage) {
  storageRef = storage;
}

/**
 * Initialize A2A registry on first request
 */
let initialized = false;
async function ensureInitialized(req: express.Request) {
  if (!initialized) {
    // Set base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    setA2ABaseUrl(`${protocol}://${host}`);

    await initializeA2ARegistry();
    initialized = true;
  }
}

/**
 * Well-known Agent Card endpoint
 * GET /.well-known/a2a/agent-card
 *
 * Returns a combined agent card for discovery
 */
export function wellKnownAgentCard(req: express.Request, res: express.Response) {
  const protocol = req.protocol;
  const host = req.get('host');
  setA2ABaseUrl(`${protocol}://${host}`);

  const agentCards = generateAllAgentCards();

  // Return a discovery document listing all agents
  const discoveryDoc = {
    id: 'nextera-eto-vro-platform',
    name: 'NextEra Energy ETO/VRO Platform',
    description: 'Enterprise AI-powered portfolio and program management platform',
    version: '1.0.0',
    provider: {
      name: 'NextEra Energy',
      url: `${protocol}://${host}`,
    },
    agents: Object.values(agentCards),
    discoveryUrl: `${protocol}://${host}/api/a2a/agents`,
    createdAt: new Date().toISOString(),
  };

  res.setHeader('Content-Type', 'application/json');
  res.json(discoveryDoc);
}

/**
 * List all registered agents
 * GET /api/a2a/agents
 */
router.get('/agents', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const filters: { status?: string; tag?: string } = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.tag) filters.tag = req.query.tag as string;

    const result = registry.listAgents(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[A2A] Error listing agents:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * Get agent card by ID
 * GET /api/a2a/agents/:agentId
 */
router.get('/agents/:agentId', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const agentCard = registry.getAgentCard(req.params.agentId);

    if (!agentCard) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent not found: ${req.params.agentId}`,
        },
      });
    }

    res.json({
      success: true,
      agent: agentCard,
    });
  } catch (error: any) {
    console.error('[A2A] Error getting agent:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * Send message to agent (create task)
 * POST /api/a2a/agents/:agentId/tasks
 *
 * Body: {
 *   contextId?: string,
 *   message: {
 *     role: "user",
 *     parts: [{ type: "text", text: "..." }]
 *   },
 *   config?: { ... }
 * }
 */
router.post('/agents/:agentId/tasks', async (req, res) => {
  try {
    await ensureInitialized(req);

    if (!storageRef) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Storage not initialized',
        },
      });
    }

    const registry = getA2ARegistry();
    const executor = getA2ATaskExecutor(storageRef);

    const agentId = req.params.agentId;
    const agent = registry.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent not found: ${agentId}`,
        },
      });
    }

    // Parse request body
    const body = req.body as SendMessageRequest;

    if (!body.message?.parts?.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Message with parts is required',
        },
      });
    }

    // Add timestamp if not present
    const message: TaskMessage = {
      ...body.message,
      timestamp: body.message.timestamp || new Date().toISOString(),
    };

    // Create task
    const { task } = await registry.createTask(agentId, {
      ...body,
      message,
    });

    // Execute task asynchronously (or synchronously based on config)
    const sync = req.query.sync === 'true' || body.config?.timeout !== undefined;

    if (sync) {
      // Synchronous execution - wait for result
      const completedTask = await executor.executeTaskSync(task.id);
      res.json({
        success: true,
        task: completedTask,
      });
    } else {
      // Async execution - return immediately
      executor.executeTask(task.id).catch((err) => {
        console.error(`[A2A] Background task ${task.id} failed:`, err.message);
      });

      res.status(202).json({
        success: true,
        task,
        message: 'Task created and queued for execution',
      });
    }
  } catch (error: any) {
    console.error('[A2A] Error creating task:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * List tasks
 * GET /api/a2a/tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const request: ListTasksRequest = {
      contextId: req.query.contextId as string | undefined,
      state: req.query.state as any,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = registry.listTasks(request);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[A2A] Error listing tasks:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * Get task by ID
 * GET /api/a2a/tasks/:taskId
 */
router.get('/tasks/:taskId', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const task = registry.getTask(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task not found: ${req.params.taskId}`,
        },
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[A2A] Error getting task:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * Cancel task
 * POST /api/a2a/tasks/:taskId/cancel
 */
router.post('/tasks/:taskId/cancel', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const task = registry.cancelTask(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task not found: ${req.params.taskId}`,
        },
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[A2A] Error canceling task:', error.message);
    res.status(400).json({
      success: false,
      error: {
        code: 'CANCEL_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * Discover agents by skill or capability
 * GET /api/a2a/discover
 */
router.get('/discover', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const skill = req.query.skill as string | undefined;
    const capability = req.query.capability as string | undefined;

    let agents;

    if (skill) {
      agents = registry.discoverBySkill(skill);
    } else if (capability) {
      agents = registry.discoverByCapability(capability as any);
    } else {
      const result = registry.listAgents({ status: 'active' });
      agents = result.agents;
    }

    res.json({
      success: true,
      agents,
      total: agents.length,
    });
  } catch (error: any) {
    console.error('[A2A] Error discovering agents:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * Get registry statistics
 * GET /api/a2a/stats
 */
router.get('/stats', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const stats = registry.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[A2A] Error getting stats:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * Health check for specific agent
 * GET /api/a2a/agents/:agentId/health
 */
router.get('/agents/:agentId/health', async (req, res) => {
  try {
    await ensureInitialized(req);
    const registry = getA2ARegistry();

    const result = await registry.healthCheck(req.params.agentId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[A2A] Error checking health:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
