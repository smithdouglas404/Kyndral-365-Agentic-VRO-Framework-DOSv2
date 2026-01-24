/**
 * AGENT CONFIGURATION API
 *
 * Backend routes for managing agent configurations
 * - Get all agent configurations
 * - Update agent settings (enable/disable, intervals, autonomy, thresholds)
 * - Persist configurations in database
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../../auth/authMiddleware.js';
import { db } from '../../db.js';
import { agentConfigs } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';

interface AgentConfigUpdate {
  enabled?: boolean;
  scanInterval?: number;
  autonomyLevel?: 'full' | 'supervised';
  config?: Record<string, any>;
}

/**
 * Register agent configuration routes
 */
export function registerAgentConfigRoutes(app: Express): void {
  /**
   * GET /api/admin/agent-config
   * Get all agent configurations
   */
  app.get('/api/admin/agent-config', authenticate, async (req: Request, res: Response) => {
    try {
      // Only system admins can access agent configuration
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only system administrators can access agent configuration',
        });
      }

      // Fetch all agent configurations from database
      const configs = await db.select().from(agentConfigs);

      // Parse JSON config strings
      const parsedConfigs = configs.map(config => ({
        ...config,
        config: config.config ? JSON.parse(config.config) : null,
      }));

      // If no configs exist, return default configs
      if (configs.length === 0) {
        const defaultAgents = [
          { id: 'finops', name: 'FinOps Agent', enabled: true, scanInterval: 60, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'tmo', name: 'TMO Agent', enabled: true, scanInterval: 30, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'risk', name: 'Risk Agent', enabled: true, scanInterval: 60, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'vro', name: 'VRO Agent', enabled: true, scanInterval: 120, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'governance', name: 'Governance Agent', enabled: true, scanInterval: 60, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'planning', name: 'Planning Agent', enabled: true, scanInterval: 60, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'ocm', name: 'OCM Agent', enabled: true, scanInterval: 120, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'integrated', name: 'Integrated Mgmt Agent', enabled: true, scanInterval: 30, autonomyLevel: 'supervised' as const, status: 'idle' as const },
          { id: 'okr', name: 'OKR Inference Agent', enabled: true, scanInterval: 120, autonomyLevel: 'supervised' as const, status: 'idle' as const },
        ];

        return res.json({
          agents: defaultAgents,
        });
      }

      res.json({
        agents: parsedConfigs,
      });
    } catch (error: any) {
      console.error('[AgentConfig] Error fetching configurations:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch agent configurations',
      });
    }
  });

  /**
   * PATCH /api/admin/agent-config/:agentId
   * Update agent configuration
   */
  app.patch('/api/admin/agent-config/:agentId', authenticate, async (req: Request, res: Response) => {
    try {
      // Only system admins can update agent configuration
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only system administrators can update agent configuration',
        });
      }

      const { agentId } = req.params;
      const updates: AgentConfigUpdate = req.body;

      // Check if config exists
      const existing = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, agentId))
        .limit(1);

      if (existing.length === 0) {
        // Create new config
        const newConfig = await db
          .insert(agentConfigs)
          .values({
            id: agentId,
            name: `${agentId} Agent`,
            enabled: updates.enabled ?? true,
            scanInterval: updates.scanInterval ?? 60,
            autonomyLevel: updates.autonomyLevel ?? 'supervised',
            config: updates.config ? JSON.stringify(updates.config) : null,
            status: 'idle',
            lastRun: null,
            updatedAt: new Date(),
          })
          .returning();

        console.log(`[AgentConfig] Created configuration for ${agentId}`);

        return res.json({
          success: true,
          agent: {
            ...newConfig[0],
            config: newConfig[0].config ? JSON.parse(newConfig[0].config) : null,
          },
        });
      }

      // Update existing config
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.enabled !== undefined) {
        updateData.enabled = updates.enabled;
      }
      if (updates.scanInterval !== undefined) {
        updateData.scanInterval = updates.scanInterval;
      }
      if (updates.autonomyLevel !== undefined) {
        updateData.autonomyLevel = updates.autonomyLevel;
      }
      if (updates.config !== undefined) {
        // Merge config with existing config
        const existingConfig = existing[0].config ? JSON.parse(existing[0].config) : {};
        const mergedConfig = {
          ...existingConfig,
          ...updates.config,
        };
        updateData.config = JSON.stringify(mergedConfig);
      }

      const updated = await db
        .update(agentConfigs)
        .set(updateData)
        .where(eq(agentConfigs.id, agentId))
        .returning();

      console.log(`[AgentConfig] Updated configuration for ${agentId}: ${JSON.stringify(updates)}`);

      res.json({
        success: true,
        agent: {
          ...updated[0],
          config: updated[0].config ? JSON.parse(updated[0].config) : null,
        },
      });
    } catch (error: any) {
      console.error('[AgentConfig] Error updating configuration:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update agent configuration',
      });
    }
  });

  /**
   * POST /api/admin/agent-config/:agentId/run
   * Manually trigger agent execution
   */
  app.post('/api/admin/agent-config/:agentId/run', authenticate, async (req: Request, res: Response) => {
    try {
      // Only system admins can manually trigger agents
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only system administrators can trigger agent execution',
        });
      }

      const { agentId } = req.params;

      // Check if agent exists and is enabled
      const config = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, agentId))
        .limit(1);

      if (config.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Agent configuration not found',
        });
      }

      if (!config[0].enabled) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot run disabled agent',
        });
      }

      // Update status to running
      const startTime = Date.now();
      await db
        .update(agentConfigs)
        .set({
          status: 'running',
          lastRun: new Date(),
        })
        .where(eq(agentConfigs.id, agentId));

      console.log(`[AgentConfig] Manual execution triggered for ${agentId} by ${req.user?.email}`);

      // Actually trigger agent execution
      try {
        // Get agent scheduler instance
        const { agentScheduler } = await import('../../index.js');

        if (!agentScheduler) {
          throw new Error('Agent scheduler not initialized');
        }

        // Get the specific agent
        const agent = agentScheduler.getAgent(agentId);

        if (!agent) {
          throw new Error(`Agent ${agentId} not found in scheduler`);
        }

        // Execute the agent's scheduled scan
        if (typeof agent.runScheduledScan === 'function') {
          await agent.runScheduledScan();
        } else if (typeof agent.execute === 'function') {
          // Fallback to execute method if runScheduledScan doesn't exist
          await agent.execute('Manual execution triggered by admin', {});
        } else {
          throw new Error(`Agent ${agentId} does not have execute or runScheduledScan method`);
        }

        const duration = Date.now() - startTime;

        // Update status to idle with duration
        await db
          .update(agentConfigs)
          .set({
            status: 'idle',
            lastRunDuration: duration,
            errorMessage: null,
          })
          .where(eq(agentConfigs.id, agentId));

        console.log(`[AgentConfig] Agent ${agentId} completed in ${duration}ms`);

        res.json({
          success: true,
          message: 'Agent execution completed',
          agentId,
          duration,
        });
      } catch (error: any) {
        // Update status to error
        await db
          .update(agentConfigs)
          .set({
            status: 'error',
            errorMessage: error.message,
          })
          .where(eq(agentConfigs.id, agentId));

        console.error(`[AgentConfig] Agent ${agentId} failed:`, error);

        res.status(500).json({
          success: false,
          error: 'Agent execution failed',
          message: error.message,
          agentId,
        });
      }
    } catch (error: any) {
      console.error('[AgentConfig] Error triggering agent:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to trigger agent execution',
      });
    }
  });

  console.log('[AgentConfig] Agent configuration routes registered');
}
