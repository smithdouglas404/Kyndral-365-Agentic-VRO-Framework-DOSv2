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
import { AgentJobService } from '../lib/AgentJobService.js';

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
   *
   * Query params:
   * - wait: boolean (default: false) - If true, waits for job completion before returning
   */
  app.post('/api/deep-agents/run', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const validated = RunDeepAgentSchema.parse(req.body);
      const wait = req.query.wait === 'true';

      console.log(`[DeepAgents] Creating job for agent: ${validated.agentName} with goal: ${validated.goal}`);

      // Create async job for agent execution
      const jobId = await AgentJobService.createJob({
        agentType: validated.agentName,
        task: validated.goal,
        context: validated.context || {},
        priority: 5,
      });

      // If wait=false, return job ID immediately (non-blocking)
      if (!wait) {
        return res.json({
          success: true,
          jobId,
          status: 'pending',
          message: 'Agent job created. Use job ID to check status.',
        });
      }

      // If wait=true, wait for completion (with 5 minute timeout)
      console.log(`[DeepAgents] Waiting for job ${jobId} to complete...`);
      const job = await AgentJobService.waitForJob(jobId, {
        timeoutMs: 300000, // 5 minutes
        pollIntervalMs: 1000,
      });

      if (job.status === 'failed') {
        return res.status(500).json({
          success: false,
          jobId,
          status: 'failed',
          error: job.error,
          message: 'Agent execution failed',
        });
      }

      res.json({
        success: true,
        jobId,
        status: 'completed',
        result: job.result,
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
   * GET /api/deep-agents/jobs/:jobId
   * Get status and result of an agent job
   */
  app.get('/api/deep-agents/jobs/:jobId', authenticate, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId;
      const job = await AgentJobService.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        jobId: job.id,
        agentType: job.agent_type,
        task: job.task,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      });
    } catch (error: any) {
      console.error('[DeepAgents] Get job error:', error);
      res.status(500).json({ error: 'Failed to get job status' });
    }
  });

  /**
   * GET /api/deep-agents/jobs
   * Get queue statistics
   */
  app.get('/api/deep-agents/jobs', authenticate, async (req: Request, res: Response) => {
    try {
      const stats = await AgentJobService.getQueueStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[DeepAgents] Get queue stats error:', error);
      res.status(500).json({ error: 'Failed to get queue statistics' });
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
   * POST /api/deep-agents/analyze-project/:projectId
   * Quick helper: Analyze project with DeepFinOps
   *
   * Query params:
   * - wait: boolean (default: true) - If true, waits for job completion before returning
   */
  app.post('/api/deep-agents/analyze-project/:projectId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!deepOrchestrator) {
        return res.status(500).json({ error: 'Deep orchestrator not initialized' });
      }

      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      const wait = req.query.wait !== 'false'; // Default to true for this endpoint

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Create job for DeepFinOps agent to analyze project
      const goal = `Perform comprehensive financial analysis of project "${project.name}" and provide optimization recommendations`;
      const context = {
        projectId,
        project,
        analysisType: 'comprehensive',
      };

      const jobId = await AgentJobService.createJob({
        agentType: 'deep-finops',
        task: goal,
        context,
        priority: 6, // Slightly higher priority for project analysis
      });

      // Return immediately if wait=false
      if (!wait) {
        return res.json({
          success: true,
          jobId,
          projectId,
          projectName: project.name,
          status: 'pending',
          message: 'Analysis job created. Use job ID to check status.',
        });
      }

      // Wait for completion
      const job = await AgentJobService.waitForJob(jobId, {
        timeoutMs: 300000,
        pollIntervalMs: 1000,
      });

      if (job.status === 'failed') {
        return res.status(500).json({
          success: false,
          jobId,
          projectId,
          projectName: project.name,
          error: job.error,
          message: 'Analysis failed',
        });
      }

      res.json({
        success: true,
        jobId,
        projectId,
        projectName: project.name,
        analysis: job.result,
        message: 'Deep financial analysis completed',
      });
    } catch (error: any) {
      console.error('[DeepAgents] Analyze project error:', error);
      res.status(500).json({ error: 'Failed to analyze project' });
    }
  });

  console.log('[DeepAgents] Deep agent routes registered');
}
