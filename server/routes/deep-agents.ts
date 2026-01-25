/**
 * DEEP AGENTS ROUTES
 *
 * API endpoints for Deep Agent functionality
 * - Run deep agents with planning + execution + reflection
 * - A2A collaboration between deep agents
 * - View plans, reflections, and collaboration history
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/authMiddleware.js';
import type { IStorage } from '../storage.js';
import { DeepAgentOrchestrator } from '../agents/deep/DeepAgentOrchestrator.js';

let deepOrchestrator: DeepAgentOrchestrator | null = null;

const RunDeepAgentSchema = z.object({
  agentName: z.string(),
  goal: z.string(),
  context: z.any().optional(),
});

/**
 * Register deep agent routes
 */
export function registerDeepAgentRoutes(app: Express, storage: IStorage): void {
  // Initialize deep orchestrator
  deepOrchestrator = new DeepAgentOrchestrator(storage);

  /**
   * GET /api/deep-agents
   * List available deep agents
   */
  app.get('/api/deep-agents', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const agents = deepOrchestrator.getDeepAgents();

      const agentCapabilities: Record<string, string[]> = {
        'deep-finops': [
          'Budget variance analysis',
          'EVM calculations',
          'Burn rate forecasting',
          'Cost optimization',
          'Multi-step financial planning',
        ],
        'deep-tmo': [
          'Schedule analysis',
          'Timeline optimization',
          'Milestone tracking',
          'Critical path analysis',
          'Multi-step timeline planning',
        ],
        'deep-risk': [
          'Risk identification',
          'Risk assessment',
          'Mitigation strategies',
          'Risk monitoring',
          'Multi-step risk planning',
        ],
        'deep-vro': [
          'Value realization tracking',
          'Benefits measurement',
          'ROI analysis',
          'Value optimization',
          'Multi-step value planning',
        ],
        'deep-pmo': [
          'Project health analysis',
          'Milestone tracking and prediction',
          'Resource optimization',
          'Governance enforcement',
          'Status report generation',
          'Multi-step portfolio planning',
        ],
        'deep-ocm': [
          'Change impact assessment',
          'Stakeholder mapping and analysis',
          'Adoption metrics tracking',
          'Intervention recommendations',
          'Resistance forecasting',
          'Multi-step change planning',
        ],
      };

      res.json({
        agents: agents.map(name => ({
          name,
          capabilities: agentCapabilities[name] || [],
          features: {
            planning: true,
            reflection: true,
            a2aCollaboration: true,
          },
        })),
        totalAgents: agents.length,
      });
    } catch (error: any) {
      console.error('[DeepAgents] List agents error:', error);
      res.status(500).json({ error: 'Failed to list deep agents' });
    }
  });

  /**
   * POST /api/deep-agents/run
   * Run a deep agent with planning + execution + reflection
   */
  app.post('/api/deep-agents/run', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const validated = RunDeepAgentSchema.parse(req.body);

      console.log(`[DeepAgents] Running agent: ${validated.agentName} with goal: ${validated.goal}`);

      const result = await deepOrchestrator.runDeepAgent(
        validated.agentName,
        validated.goal,
        validated.context || {}
      );

      res.json({
        success: true,
        result,
        message: 'Deep agent execution completed',
      });
    } catch (error: any) {
      console.error('[DeepAgents] Run agent error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Failed to run deep agent',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/deep-agents/:agentName/share-reflections
   * Share agent reflections with other agents
   */
  app.post('/api/deep-agents/:agentName/share-reflections', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      await deepOrchestrator.shareReflections(req.params.agentName);

      res.json({
        success: true,
        message: `Reflections shared from ${req.params.agentName}`,
      });
    } catch (error: any) {
      console.error('[DeepAgents] Share reflections error:', error);
      res.status(500).json({ error: 'Failed to share reflections' });
    }
  });

  /**
   * GET /api/deep-agents/messages
   * Get pending A2A messages
   */
  app.get('/api/deep-agents/messages', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const forAgent = req.query.agent as string | undefined;
      const messages = deepOrchestrator.getPendingMessages(forAgent);

      res.json({
        messages: messages.map(m => ({
          from: m.from,
          to: m.to,
          messageType: m.messageType,
          payload: m.payload,
          timestamp: m.timestamp,
          requiresResponse: m.requiresResponse,
        })),
        totalMessages: messages.length,
      });
    } catch (error: any) {
      console.error('[DeepAgents] Get messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  /**
   * GET /api/deep-agents/collaboration-stats
   * Get collaboration statistics
   */
  app.get('/api/deep-agents/collaboration-stats', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const stats = deepOrchestrator.getCollaborationStats();

      res.json({
        stats,
        summary: {
          totalCollaborations: stats.totalCollaborations,
          totalMessages: stats.totalMessages,
          mostActiveAgent: Object.entries(stats.collaborationsByAgent).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
        },
      });
    } catch (error: any) {
      console.error('[DeepAgents] Get collaboration stats error:', error);
      res.status(500).json({ error: 'Failed to get collaboration stats' });
    }
  });

  /**
   * GET /api/deep-agents/collaboration-matrix
   * Get detailed collaboration matrix showing agent-to-agent interactions
   */
  app.get('/api/deep-agents/collaboration-matrix', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const { timeframe = '7days' } = req.query;

      // Calculate start date based on timeframe
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Get collaboration history from orchestrator
      const history = deepOrchestrator.getCollaborationHistory();

      // Filter by timeframe
      const filteredHistory = history.filter((item: any) => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= startDate;
      });

      // Build collaboration matrix
      const matrix: Record<string, number> = {};
      const topReasons: Record<string, Record<string, number>> = {};

      filteredHistory.forEach((item: any) => {
        const key = `${item.from}->${item.to}`;
        matrix[key] = (matrix[key] || 0) + 1;

        // Track reasons
        if (!topReasons[key]) {
          topReasons[key] = {};
        }
        const reason = item.reason || 'unknown';
        topReasons[key][reason] = (topReasons[key][reason] || 0) + 1;
      });

      // Find top collaborations
      const topCollaborations = Object.entries(matrix)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => {
          const [from, to] = key.split('->');
          const reasons = topReasons[key];
          const sortedReasons = Object.entries(reasons)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([reason]) => reason);

          return {
            from,
            to,
            count,
            topReasons: sortedReasons,
          };
        });

      res.json({
        timeframe,
        collaborationMatrix: matrix,
        topCollaborations,
        totalInteractions: filteredHistory.length,
      });
    } catch (error: any) {
      console.error('[DeepAgents] Get collaboration matrix error:', error);
      res.status(500).json({ error: 'Failed to get collaboration matrix' });
    }
  });

  /**
   * POST /api/deep-agents/analyze-project
   * Quick helper: Analyze project with DeepFinOps
   */
  app.post('/api/deep-agents/analyze-project/:projectId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Run DeepFinOps agent to analyze project
      const goal = `Perform comprehensive financial analysis of project "${project.name}" and provide optimization recommendations`;
      const context = {
        projectId,
        project,
        analysisType: 'comprehensive',
      };

      const result = await deepOrchestrator.runDeepAgent('deep-finops', goal, context);

      res.json({
        success: true,
        projectId,
        projectName: project.name,
        analysis: result,
        message: 'Deep financial analysis completed',
      });
    } catch (error: any) {
      console.error('[DeepAgents] Analyze project error:', error);
      res.status(500).json({ error: 'Failed to analyze project' });
    }
  });

  console.log('[DeepAgents] Deep agent routes registered');
}
