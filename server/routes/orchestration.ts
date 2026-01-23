/**
 * ORCHESTRATION API ROUTES
 *
 * Endpoints for multi-agent orchestration, insights, and workflow management
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { AgentOrchestrationBootstrap } from '../agents/AgentOrchestrationBootstrap.js';

let bootstrapInstance: AgentOrchestrationBootstrap | null = null;

export function registerOrchestrationRoutes(app: Express, storage: IStorage): void {
  // Initialize orchestration bootstrap
  if (!bootstrapInstance) {
    bootstrapInstance = new AgentOrchestrationBootstrap(storage);
    bootstrapInstance.initialize().catch(console.error);
  }

  /**
   * GET /api/orchestration/status
   * Get orchestration engine status (enhanced with health and metrics)
   */
  app.get('/api/orchestration/status', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      const status = engine.getEnhancedStatus();
      res.json(status);
    } catch (error: any) {
      console.error('[Orchestration] Status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/health
   * Get system health status
   */
  app.get('/api/orchestration/health', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      const health = engine.getSystemHealth();
      res.json(health);
    } catch (error: any) {
      console.error('[Orchestration] Health error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/health/:agentId
   * Get specific agent health
   */
  app.get('/api/orchestration/health/:agentId', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const { agentId } = req.params;
      const engine = bootstrapInstance.getOrchestrationEngine();
      const health = engine.getAgentHealth(agentId);

      if (!health) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
      }

      res.json(health);
    } catch (error: any) {
      console.error('[Orchestration] Agent health error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/metrics
   * Get performance metrics
   */
  app.get('/api/orchestration/metrics', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      const metrics = engine.getMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error('[Orchestration] Metrics error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/orchestration/circuit-breaker/:agentId/reset
   * Reset circuit breaker for an agent
   */
  app.post('/api/orchestration/circuit-breaker/:agentId/reset', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const { agentId } = req.params;
      const engine = bootstrapInstance.getOrchestrationEngine();
      engine.resetCircuitBreaker(agentId);

      res.json({
        success: true,
        message: `Circuit breaker reset for ${agentId}`,
        agentId,
      });
    } catch (error: any) {
      console.error('[Orchestration] Circuit breaker reset error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/orchestration/scan
   * Trigger coordinated multi-agent scan
   */
  app.post('/api/orchestration/scan', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      // Run scan asynchronously
      bootstrapInstance.runCoordinatedScan().catch(console.error);

      res.json({
        success: true,
        message: 'Coordinated scan initiated',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Orchestration] Scan error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/insights
   * Get unified intelligence insights for all projects
   */
  app.get('/api/orchestration/insights', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const insights = await bootstrapInstance.getUnifiedInsights();

      res.json({
        totalProjects: insights.length,
        insights,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Orchestration] Insights error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/insights/:projectId
   * Get unified insights for a specific project
   */
  app.get('/api/orchestration/insights/:projectId', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const { projectId } = req.params;
      const engine = bootstrapInstance.getOrchestrationEngine();
      const insights = await engine.getUnifiedInsights(projectId);

      res.json(insights);
    } catch (error: any) {
      console.error('[Orchestration] Project insights error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/orchestration/message
   * Send message between agents
   */
  app.post('/api/orchestration/message', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const { from, to, message, projectId } = req.body;

      if (!from || !to || !message) {
        return res.status(400).json({ error: 'Missing required fields: from, to, message' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      await engine.sendMessage(from, to, message, projectId);

      res.json({
        success: true,
        message: 'Message sent',
        from,
        to,
      });
    } catch (error: any) {
      console.error('[Orchestration] Message error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/orchestration/broadcast
   * Broadcast message to multiple agents
   */
  app.post('/api/orchestration/broadcast', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const { from, recipients, message, projectId } = req.body;

      if (!from || !recipients || !message) {
        return res.status(400).json({
          error: 'Missing required fields: from, recipients, message',
        });
      }

      if (!Array.isArray(recipients)) {
        return res.status(400).json({ error: 'recipients must be an array' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      await engine.broadcast(from, recipients, message, projectId);

      res.json({
        success: true,
        message: 'Broadcast sent',
        from,
        recipients,
      });
    } catch (error: any) {
      console.error('[Orchestration] Broadcast error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/workflows
   * Get all workflow rules
   */
  app.get('/api/orchestration/workflows', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      const status = engine.getStatus();

      res.json({
        totalRules: status.workflowRules,
        rules: [], // Would need to expose workflow engine rules
      });
    } catch (error: any) {
      console.error('[Orchestration] Workflows error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/orchestration/trigger-workflow
   * Manually trigger a workflow
   */
  app.post('/api/orchestration/trigger-workflow', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const { agentId, event, data } = req.body;

      if (!agentId || !event || !data) {
        return res.status(400).json({
          error: 'Missing required fields: agentId, event, data',
        });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      await engine.triggerWorkflow(agentId, event, data);

      res.json({
        success: true,
        message: 'Workflow triggered',
        agentId,
        event,
      });
    } catch (error: any) {
      console.error('[Orchestration] Trigger workflow error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/agents
   * Get all registered agents
   */
  app.get('/api/orchestration/agents', async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const agents = Array.from(bootstrapInstance.getAllAgents().keys());

      res.json({
        totalAgents: agents.length,
        agents: agents.map(id => ({
          id,
          name: id.toUpperCase(),
          status: 'active',
        })),
      });
    } catch (error: any) {
      console.error('[Orchestration] Agents error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

/**
 * Get bootstrap instance for use elsewhere
 */
export function getOrchestrationBootstrap(): AgentOrchestrationBootstrap | null {
  return bootstrapInstance;
}
