/**
 * AGENT EXECUTION API ROUTES
 *
 * Endpoints for executing agent requests and managing agent orchestration.
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../auth/authMiddleware.js';
import { storage } from '../storage.js';
import { getAgentOrchestrator } from '../lib/AgentOrchestrator.js';
import type { AgentRequest } from '../lib/AgentOrchestrator.js';

export function registerAgentExecutionRoutes(app: Express): void {
  const orchestrator = getAgentOrchestrator(storage);

  /**
   * POST /api/agents/execute
   * Execute an agent request
   */
  app.post('/api/agents/execute', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { agentId, taskType, prompt, projectId, metadata } = req.body;

      // Validate required fields
      if (!agentId || !taskType || !prompt) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: agentId, taskType, prompt',
        });
      }

      // Build agent request
      const agentRequest: AgentRequest = {
        agentId,
        taskType,
        prompt,
        context: {
          userId: req.user.id,
          projectId,
          metadata,
        },
      };

      // Execute agent request
      const response = await orchestrator.executeAgentRequest(agentRequest);

      res.json({
        success: true,
        response,
      });
    } catch (error: any) {
      console.error('[AgentExecution] Execute error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/agents/enabled
   * Get all enabled agents
   */
  app.get('/api/agents/enabled', authenticate, async (req: Request, res: Response) => {
    try {
      const agents = await orchestrator.getEnabledAgents();

      res.json({
        success: true,
        agents,
      });
    } catch (error: any) {
      console.error('[AgentExecution] Get enabled agents error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/agents/:agentId/config
   * Get agent configuration
   */
  app.get('/api/agents/:agentId/config', authenticate, async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      const config = await orchestrator.getAgentConfig(agentId);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Agent ${agentId} not found or not enabled`,
        });
      }

      res.json({
        success: true,
        config,
      });
    } catch (error: any) {
      console.error('[AgentExecution] Get config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/agents/reload
   * Reload agent configurations (ADMIN only)
   * Call this after making changes in the Agent Setup Wizard
   */
  app.post('/api/agents/reload', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can reload agent configurations',
        });
      }

      await orchestrator.reload();

      res.json({
        success: true,
        message: 'Agent configurations reloaded successfully',
      });
    } catch (error: any) {
      console.error('[AgentExecution] Reload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[AgentExecution] Agent execution routes registered');
}
