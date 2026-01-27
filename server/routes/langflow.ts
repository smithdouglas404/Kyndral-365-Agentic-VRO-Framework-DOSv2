/**
 * LANGFLOW ROUTES
 * API endpoints for testing and managing Langflow flows
 */

import type { Express, Request, Response } from 'express';
import { langflowService } from '../index.js';

export function registerLangflowRoutes(app: Express): void {
  /**
   * List all available Langflow flows
   */
  app.get('/api/langflow/flows', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({
          error: 'Langflow not configured',
          message: 'Set LANGFLOW_API_URL and LANGFLOW_API_KEY in .env',
        });
      }

      const flows = await langflowService.listFlows();
      res.json({ flows, count: flows.length });
    } catch (error: any) {
      console.error('[Langflow API] Failed to list flows:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get specific flow details
   */
  app.get('/api/langflow/flows/:flowId', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({ error: 'Langflow not configured' });
      }

      const { flowId } = req.params;
      const flow = await langflowService.getFlow(flowId);

      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }

      res.json(flow);
    } catch (error: any) {
      console.error('[Langflow API] Failed to get flow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Execute a Langflow flow with test data
   */
  app.post('/api/langflow/execute', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({ error: 'Langflow not configured' });
      }

      const { flowId, input, tweaks } = req.body;

      if (!flowId) {
        return res.status(400).json({ error: 'flowId is required' });
      }

      console.log(`[Langflow API] Executing flow ${flowId}...`);

      const result = await langflowService.executeFlow(flowId, input || {}, tweaks);

      res.json({
        success: result.status === 'success',
        flowId: result.flowId,
        runId: result.runId,
        status: result.status,
        outputs: result.outputs,
        executionTime: result.executionTime,
        error: result.error,
      });
    } catch (error: any) {
      console.error('[Langflow API] Flow execution failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Test Langflow connection
   */
  app.get('/api/langflow/test', async (req: Request, res: Response) => {
    try {
      if (!langflowService) {
        return res.status(503).json({
          connected: false,
          error: 'Langflow not configured',
        });
      }

      const connected = await langflowService.testConnection();
      const flows = connected ? await langflowService.listFlows() : [];

      res.json({
        connected,
        flowsAvailable: flows.length,
        flows: flows.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
        })),
      });
    } catch (error: any) {
      console.error('[Langflow API] Connection test failed:', error);
      res.status(500).json({
        connected: false,
        error: error.message,
      });
    }
  });

  console.log('[Routes] Langflow routes registered');
}
