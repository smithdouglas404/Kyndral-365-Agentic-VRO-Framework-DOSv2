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

  /**
   * GET /api/agents/mcp-requirements
   * Get which MCPs each agent needs (for MCP status dashboard)
   */
  app.get('/api/agents/mcp-requirements', async (_req: Request, res: Response) => {
    try {
      // Define MCP requirements for each agent
      const agentRequirements = [
        {
          agentId: 'finops',
          agentName: 'FinOps',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['jira', 'slack'],
          status: 'not-configured'
        },
        {
          agentId: 'tmo',
          agentName: 'TMO',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['servicenow', 'slack', 'azure-devops'],
          status: 'not-configured'
        },
        {
          agentId: 'risk',
          agentName: 'Risk',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['jira', 'servicenow', 'slack'],
          status: 'not-configured'
        },
        {
          agentId: 'pmo',
          agentName: 'PMO',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['jira', 'monday', 'slack'],
          status: 'not-configured'
        },
        {
          agentId: 'ocm',
          agentName: 'OCM',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['servicenow', 'slack'],
          status: 'not-configured'
        },
        {
          agentId: 'governance',
          agentName: 'Governance',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['jira', 'slack'],
          status: 'not-configured'
        },
        {
          agentId: 'planning',
          agentName: 'Planning',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['monday', 'slack'],
          status: 'not-configured'
        },
        {
          agentId: 'vro',
          agentName: 'VRO',
          requiredMCPs: ['langflow'],
          optionalMCPs: ['slack'],
          status: 'not-configured'
        }
      ];

      // Calculate status based on environment variables
      const langflowConnected = !!(process.env.LANGFLOW_API_KEY && process.env.LANGFLOW_API_KEY !== 'YOUR_KEY_HERE');

      const requirements = agentRequirements.map(agent => {
        // Check required MCPs
        const requiredConfigured = agent.requiredMCPs.every(mcp => {
          if (mcp === 'langflow') return langflowConnected;
          return false;
        });

        // Check optional MCPs
        let optionalConfigured = 0;
        agent.optionalMCPs.forEach(mcp => {
          if (mcp === 'jira' && process.env.JIRA_DOMAIN) optionalConfigured++;
          if (mcp === 'servicenow' && process.env.SERVICENOW_INSTANCE) optionalConfigured++;
          if (mcp === 'slack' && process.env.SLACK_WEBHOOK_URL) optionalConfigured++;
          if (mcp === 'monday' && process.env.MONDAY_API_KEY) optionalConfigured++;
          if (mcp === 'azure-devops' && process.env.AZURE_DEVOPS_ORG) optionalConfigured++;
        });

        let status: 'ready' | 'partial' | 'not-configured';
        if (!requiredConfigured) {
          status = 'not-configured';
        } else if (optionalConfigured === agent.optionalMCPs.length) {
          status = 'ready';
        } else if (optionalConfigured > 0) {
          status = 'partial';
        } else {
          status = 'partial'; // Has required but no optional
        }

        return {
          ...agent,
          status
        };
      });

      res.json({
        success: true,
        agents: requirements
      });
    } catch (error: any) {
      console.error('[AgentExecution] Error getting MCP requirements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get MCP requirements',
        message: error.message,
      });
    }
  });

  console.log('[AgentExecution] Agent execution routes registered');
}
