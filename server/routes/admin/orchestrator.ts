/**
 * ORCHESTRATOR CONTROL API
 * 
 * Admin endpoints to control the continuous orchestrator:
 * - Get status (running, interval, cycle count)
 * - Start/stop orchestration
 * - Update interval timing
 * - Trigger single agent run
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../../auth/authMiddleware.js';

// Reference to orchestrator - dynamically resolved from bootstrap
let orchestratorInstance: any = null;
let bootstrapInstance: any = null;
let bootstrapGetter: (() => any) | null = null;

/**
 * Set the orchestrator instance for API access
 */
export function setOrchestratorInstance(orchestrator: any, bootstrap?: any): void {
  orchestratorInstance = orchestrator;
  bootstrapInstance = bootstrap;
}

/**
 * Set a getter function to dynamically resolve the bootstrap instance
 */
export function setBootstrapGetter(getter: () => any): void {
  bootstrapGetter = getter;
}

/**
 * Get orchestrator instance (lazy-load if needed)
 */
function getOrchestrator(): any {
  if (orchestratorInstance) return orchestratorInstance;
  
  // Try to get from bootstrap getter
  if (bootstrapGetter) {
    const bootstrap = bootstrapGetter();
    if (bootstrap) {
      bootstrapInstance = bootstrap;
      orchestratorInstance = bootstrap.getOrchestrator?.();
      return orchestratorInstance;
    }
  }
  return null;
}

/**
 * Get bootstrap instance (lazy-load if needed)
 */
function getBootstrap(): any {
  if (bootstrapInstance) return bootstrapInstance;
  
  if (bootstrapGetter) {
    bootstrapInstance = bootstrapGetter();
    return bootstrapInstance;
  }
  return null;
}

/**
 * Register orchestrator control routes
 */
export function registerOrchestratorRoutes(app: Express): void {
  /**
   * GET /api/admin/orchestrator/status
   * Get current orchestrator status
   */
  app.get('/api/admin/orchestrator/status', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const orchestrator = getOrchestrator();
      if (!orchestrator) {
        return res.json({
          initialized: false,
          isRunning: false,
          interval: 0,
          cycleCount: 0,
          agents: [],
        });
      }

      const status = orchestrator.getStatus?.() || {
        isRunning: false,
        cycleCount: 0,
      };

      res.json({
        initialized: true,
        isRunning: status.isRunning || false,
        interval: status.interval || 60000,
        cycleCount: status.cycleCount || 0,
        lastCycleTime: status.lastCycleTime || null,
        activeScans: status.activeScans || 0,
        a2a: status.a2a || { totalMessages: 0 },
        agents: status.agents || [],
      });
    } catch (error: any) {
      console.error('[Orchestrator API] Error getting status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/admin/orchestrator/start
   * Start continuous orchestration
   */
  app.post('/api/admin/orchestrator/start', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { interval = 60000 } = req.body;

      const orchestrator = getOrchestrator();
      if (!orchestrator) {
        return res.status(400).json({ error: 'Orchestrator not initialized' });
      }

      // Validate interval (minimum 30 seconds to prevent credit burn)
      const safeInterval = Math.max(30000, Number(interval));

      await orchestrator.start(safeInterval);

      res.json({
        success: true,
        message: `Orchestrator started with ${safeInterval / 1000}s interval`,
        interval: safeInterval,
      });
    } catch (error: any) {
      console.error('[Orchestrator API] Error starting:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/admin/orchestrator/stop
   * Stop continuous orchestration
   */
  app.post('/api/admin/orchestrator/stop', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const orchestrator = getOrchestrator();
      if (!orchestrator) {
        return res.status(400).json({ error: 'Orchestrator not initialized' });
      }

      orchestrator.stop();

      res.json({
        success: true,
        message: 'Orchestrator stopped',
      });
    } catch (error: any) {
      console.error('[Orchestrator API] Error stopping:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/admin/orchestrator/trigger
   * Trigger a single agent analysis (on-demand)
   */
  app.post('/api/admin/orchestrator/trigger', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { agentId, projectId } = req.body;

      if (!agentId) {
        return res.status(400).json({ error: 'agentId is required' });
      }

      const bootstrap = getBootstrap();
      if (!bootstrap) {
        return res.status(400).json({ error: 'Agent system not initialized' });
      }

      // Get the specific agent
      const agents = bootstrap.getAgents?.();
      const agent = agents?.get(agentId);

      if (!agent) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
      }

      // Run the agent (async, don't wait for completion)
      console.log(`[Orchestrator API] Manual trigger: ${agentId}`);
      
      // Start async analysis
      agent.run(projectId || 'all-projects').catch((err: Error) => {
        console.error(`[Orchestrator API] Agent ${agentId} run failed:`, err.message);
      });

      res.json({
        success: true,
        message: `Agent ${agentId} triggered`,
        agentId,
        projectId: projectId || 'all-projects',
      });
    } catch (error: any) {
      console.error('[Orchestrator API] Error triggering agent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/admin/orchestrator/agents
   * Get list of available agents for manual triggering
   */
  app.get('/api/admin/orchestrator/agents', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const bootstrap = getBootstrap();
      if (!bootstrap) {
        return res.json({ agents: [] });
      }

      const agents = bootstrap.getAgents?.();
      if (!agents) {
        return res.json({ agents: [] });
      }

      const agentList = Array.from(agents.keys()).map((id: string) => ({
        id,
        name: formatAgentName(id),
      }));

      res.json({ agents: agentList });
    } catch (error: any) {
      console.error('[Orchestrator API] Error getting agents:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

function formatAgentName(id: string): string {
  const names: Record<string, string> = {
    'deepfinops': 'FinOps Agent',
    'deeptmo': 'TMO Agent',
    'deeprisk': 'Risk Agent',
    'deepgovernance': 'Governance Agent',
    'deepvro': 'VRO Agent',
    'deepocm': 'OCM Agent',
    'deepintegrated': 'Integrated Management Agent',
    'deepokrinference': 'OKR Inference Agent',
    'deepplanning': 'Planning Agent',
  };
  return names[id] || id;
}
