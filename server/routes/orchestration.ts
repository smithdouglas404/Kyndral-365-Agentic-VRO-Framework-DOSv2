/**
 * ORCHESTRATION API ROUTES
 *
 * Endpoints for multi-agent orchestration, insights, and workflow management
 *
 * 🔄 MIGRATED TO DEEP AGENTS (2026-01-25)
 * - Now using DeepAgentBootstrap with 6 deep agents
 * - Enhanced capabilities: RAG, Mem0, Letta, Rules Engine, Policy-as-Code, A2A, MCP
 * - Continuous 24x7 orchestration with A2A message bus
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../auth/authMiddleware.js';
import type { IStorage } from '../storage.js';
import { DeepAgentBootstrap } from '../agents/DeepAgentBootstrap.js';
import { getSmartRouter, type TierOverride } from '../lib/SmartModelRouter.js';
import { db } from '../db.js';
import { appConfig } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

let bootstrapInstance: DeepAgentBootstrap | null = null;

/**
 * Get the bootstrap instance for external access (e.g., orchestrator API)
 */
export function getBootstrapInstance(): DeepAgentBootstrap | null {
  return bootstrapInstance;
}

export function registerOrchestrationRoutes(app: Express, storage: IStorage): void {
  // Initialize deep agent bootstrap
  if (!bootstrapInstance) {
    bootstrapInstance = new DeepAgentBootstrap(storage);
    bootstrapInstance.initialize().catch((error) => {
      console.error('[DeepAgentBootstrap] Initialization failed:', error);
    });
    console.log('[Orchestration] ✅ Deep agent system activated');
  }

  /**
   * GET /api/orchestration/status
   * Get orchestration engine status (enhanced with health and metrics)
   */
  app.get('/api/orchestration/status', authenticate, async (req: Request, res: Response) => {
    try {
      if (!bootstrapInstance) {
        return res.status(503).json({ error: 'Orchestration not initialized' });
      }

      const engine = bootstrapInstance.getOrchestrationEngine();
      const status = engine.getEnhancedStatus();
      const router = getSmartRouter();
      res.json({ ...status, modelRouter: router.getStats() });
    } catch (error: any) {
      console.error('[Orchestration] Status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/orchestration/router-stats', authenticate, async (req: Request, res: Response) => {
    try {
      const router = getSmartRouter();
      const orchestrator = bootstrapInstance?.getOrchestrator?.();
      const scanEfficiency = orchestrator?.getScanEfficiency?.() || { totalScans: 0, skippedScans: 0, skipRate: '0.0%' };
      res.json({
        aiEnabled: router.isAIEnabled(),
        ...router.getStats(),
        scanEfficiency,
        version: '4.1',
        tiers: {
          tier0: 'Deterministic heuristics (zero cost)',
          tier1: 'Cheap models via OpenRouter ($0.10-0.50/M tokens)',
          tier2: 'Premium Claude (critical only, $3-15/M tokens)',
        },
      });
    } catch (error: any) {
      console.error('[Orchestration] Router stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/orchestration/tier-overrides', authenticate, async (req: Request, res: Response) => {
    try {
      const router = getSmartRouter();
      res.json(router.getAllTierOverrides());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/orchestration/tier-overrides/agent/:agentId', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Only system administrators can change tier overrides' });
      }

      const { agentId } = req.params;
      const { minimumTier } = req.body as { minimumTier: TierOverride };

      if (!['auto', 'heuristic', 'cheap', 'premium'].includes(minimumTier)) {
        return res.status(400).json({ error: 'Invalid tier. Must be: auto, heuristic, cheap, or premium' });
      }

      const router = getSmartRouter();
      router.setAgentTierOverride(agentId, minimumTier);

      const configKey = `agent_tier_override_${agentId.toLowerCase()}`;
      const [existing] = await db.select().from(appConfig).where(eq(appConfig.configKey, configKey)).limit(1);

      if (existing) {
        await db.update(appConfig).set({ configValue: minimumTier, updatedAt: new Date() }).where(eq(appConfig.configKey, configKey));
      } else {
        await db.insert(appConfig).values({
          configKey,
          configValue: minimumTier,
          description: `Minimum model tier for ${agentId} agent`,
          category: 'model_routing',
        });
      }

      res.json({ success: true, agentId, minimumTier, overrides: router.getAllTierOverrides() });
    } catch (error: any) {
      console.error('[Orchestration] Set agent tier error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/orchestration/tier-overrides/global', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Only system administrators can change tier overrides' });
      }

      const { minimumTier } = req.body as { minimumTier: TierOverride };

      if (!['auto', 'heuristic', 'cheap', 'premium'].includes(minimumTier)) {
        return res.status(400).json({ error: 'Invalid tier. Must be: auto, heuristic, cheap, or premium' });
      }

      const router = getSmartRouter();
      router.setGlobalMinimumTier(minimumTier);

      const configKey = 'global_minimum_tier';
      const [existing] = await db.select().from(appConfig).where(eq(appConfig.configKey, configKey)).limit(1);

      if (existing) {
        await db.update(appConfig).set({ configValue: minimumTier, updatedAt: new Date() }).where(eq(appConfig.configKey, configKey));
      } else {
        await db.insert(appConfig).values({
          configKey,
          configValue: minimumTier,
          description: 'Global minimum model tier for all agents',
          category: 'model_routing',
        });
      }

      res.json({ success: true, minimumTier, overrides: router.getAllTierOverrides() });
    } catch (error: any) {
      console.error('[Orchestration] Set global tier error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/orchestration/health
   * Get system health status
   */
  app.get('/api/orchestration/health', authenticate, async (req: Request, res: Response) => {
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
  app.get('/api/orchestration/health/:agentId', authenticate, async (req: Request, res: Response) => {
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
  app.get('/api/orchestration/metrics', authenticate, async (req: Request, res: Response) => {
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
  app.post('/api/orchestration/circuit-breaker/:agentId/reset', authenticate, async (req: Request, res: Response) => {
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
  app.post('/api/orchestration/scan', authenticate, async (req: Request, res: Response) => {
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
  app.get('/api/orchestration/insights', authenticate, async (req: Request, res: Response) => {
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
  app.get('/api/orchestration/insights/:projectId', authenticate, async (req: Request, res: Response) => {
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
  app.post('/api/orchestration/message', authenticate, async (req: Request, res: Response) => {
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
  app.post('/api/orchestration/broadcast', authenticate, async (req: Request, res: Response) => {
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
  app.get('/api/orchestration/workflows', authenticate, async (req: Request, res: Response) => {
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
  app.post('/api/orchestration/trigger-workflow', authenticate, async (req: Request, res: Response) => {
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
  app.get('/api/orchestration/agents', authenticate, async (req: Request, res: Response) => {
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
export function getOrchestrationBootstrap(): DeepAgentBootstrap | null {
  return bootstrapInstance;
}
