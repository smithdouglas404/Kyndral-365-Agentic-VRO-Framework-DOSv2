/**
 * CAMUNDA 8 API ROUTES
 *
 * Admin endpoints for Camunda 8 integration:
 * - DMN decision evaluation
 * - BPMN workflow deployment
 * - Workflow instance management
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../../auth/authMiddleware.js';
import { getCamunda8Service } from '../../lib/Camunda8Service.js';

export function registerCamundaRoutes(app: Express): void {
  const camundaService = getCamunda8Service();

  /**
   * GET /api/admin/camunda/topology
   * Get Zeebe cluster topology (test connection)
   */
  app.get('/api/admin/camunda/topology', authenticate, async (req: Request, res: Response) => {
    try {
      const topology = await camundaService.getTopology();

      res.json({
        success: true,
        topology,
      });
    } catch (error: any) {
      console.error('[Camunda] Get topology error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/decisions/evaluate
   * Evaluate DMN decision table
   */
  app.post('/api/admin/camunda/decisions/evaluate', authenticate, async (req: Request, res: Response) => {
    try {
      const { decisionId, variables } = req.body;

      if (!decisionId || !variables) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: decisionId, variables',
        });
      }

      const result = await camundaService.evaluateDecision({
        decisionId,
        variables,
      });

      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error('[Camunda] Decision evaluation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/workflows/deploy
   * Deploy BPMN workflow
   */
  app.post('/api/admin/camunda/workflows/deploy', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can deploy workflows',
        });
      }

      const { bpmnXml, resourceName } = req.body;

      if (!bpmnXml || !resourceName) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: bpmnXml, resourceName',
        });
      }

      const deployment = await camundaService.deployWorkflow(bpmnXml, resourceName);

      res.json({
        success: true,
        deployment,
      });
    } catch (error: any) {
      console.error('[Camunda] Workflow deployment error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/workflows/start
   * Start workflow instance
   */
  app.post('/api/admin/camunda/workflows/start', authenticate, async (req: Request, res: Response) => {
    try {
      const { bpmnProcessId, variables } = req.body;

      if (!bpmnProcessId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: bpmnProcessId',
        });
      }

      const instance = await camundaService.startWorkflow(bpmnProcessId, variables || {});

      res.json({
        success: true,
        instance,
      });
    } catch (error: any) {
      console.error('[Camunda] Workflow start error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/messages/publish
   * Publish message to workflow
   */
  app.post('/api/admin/camunda/messages/publish', authenticate, async (req: Request, res: Response) => {
    try {
      const { messageName, correlationKey, variables } = req.body;

      if (!messageName || !correlationKey) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: messageName, correlationKey',
        });
      }

      await camundaService.publishMessage(messageName, correlationKey, variables || {});

      res.json({
        success: true,
        message: 'Message published successfully',
      });
    } catch (error: any) {
      console.error('[Camunda] Message publish error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/agent-collaboration/evaluate
   * Evaluate agent collaboration decision using DMN
   */
  app.post('/api/admin/camunda/agent-collaboration/evaluate', authenticate, async (req: Request, res: Response) => {
    try {
      const input = req.body;

      if (!input.sourceAgent) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: sourceAgent',
        });
      }

      const result = await camundaService.evaluateAgentCollaboration(input);

      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error('[Camunda] Agent collaboration evaluation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[Camunda] Camunda 8 routes registered');
}
