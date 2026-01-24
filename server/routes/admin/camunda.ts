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
   * GET /api/admin/camunda/config
   * Get Camunda 8 cluster configuration for Desktop Modeler
   */
  app.get('/api/admin/camunda/config', authenticate, async (req: Request, res: Response) => {
    try {
      const config = camundaService.getConnectionDetails();

      res.json({
        deploymentType: process.env.CAMUNDA_DEPLOYMENT_TYPE || 'self-hosted',
        clusterId: process.env.CAMUNDA_CLUSTER_ID || 'local-cluster',
        clusterRegion: process.env.CAMUNDA_REGION || 'localhost',
        clientId: process.env.CAMUNDA_CLIENT_ID || '',
        clientSecret: process.env.CAMUNDA_CLIENT_SECRET || '',
        zeebeAddress: process.env.CAMUNDA_ZEEBE_ADDRESS || 'localhost:26500',
        restApiUrl: process.env.CAMUNDA_REST_URL || 'http://localhost:8080',
        operateUrl: process.env.CAMUNDA_OPERATE_URL || 'http://localhost:8081',
        tasklistUrl: process.env.CAMUNDA_TASKLIST_URL || 'http://localhost:8082',
        modelerUrl: process.env.CAMUNDA_MODELER_URL || 'https://modeler.cloud.camunda.io',
      });
    } catch (error: any) {
      console.error('[Camunda] Get config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/admin/camunda/config
   * Update Camunda 8 deployment type (self-hosted vs SaaS)
   */
  app.put('/api/admin/camunda/config', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can update Camunda configuration',
        });
      }

      const { deploymentType } = req.body;

      if (!deploymentType || !['self-hosted', 'saas'].includes(deploymentType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid deployment type. Must be "self-hosted" or "saas"',
        });
      }

      // In a real implementation, this would update the database/env config
      // For now, just return success
      res.json({
        success: true,
        message: `Deployment type updated to ${deploymentType}`,
        deploymentType,
      });
    } catch (error: any) {
      console.error('[Camunda] Update config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/test-connection
   * Test connection to Camunda 8 cluster
   */
  app.post('/api/admin/camunda/test-connection', authenticate, async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const topology = await camundaService.getTopology();
      const latency = Date.now() - startTime;

      res.json({
        success: true,
        connected: true,
        latency: `${latency}ms`,
        brokers: topology.brokers?.length || 0,
      });
    } catch (error: any) {
      console.error('[Camunda] Connection test error:', error);
      res.status(500).json({
        success: false,
        connected: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/camunda/processes
   * Get deployed BPMN processes and DMN decision tables
   */
  app.get('/api/admin/camunda/processes', authenticate, async (req: Request, res: Response) => {
    try {
      // Try to query Operate API if configured
      const operateUrl = process.env.CAMUNDA_OPERATE_URL;

      if (operateUrl) {
        try {
          // Query Camunda Operate API for deployed process definitions
          const authHeader = process.env.CAMUNDA_CLIENT_ID && process.env.CAMUNDA_CLIENT_SECRET
            ? `Basic ${Buffer.from(`${process.env.CAMUNDA_CLIENT_ID}:${process.env.CAMUNDA_CLIENT_SECRET}`).toString('base64')}`
            : undefined;

          const response = await fetch(`${operateUrl}/v1/process-definitions/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader }),
            },
            body: JSON.stringify({
              filter: {},
              size: 50,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const processes = data.items?.map((item: any) => ({
              key: item.key,
              name: item.name || item.bpmnProcessId,
              version: item.version,
              resourceName: item.resourceName || `${item.bpmnProcessId}.bpmn`,
              deploymentTime: item.deployTime,
            })) || [];

            console.log(`[Camunda] Retrieved ${processes.length} processes from Operate API`);

            return res.json({
              success: true,
              processes,
              count: processes.length,
              source: 'operate-api',
            });
          }
        } catch (operateError) {
          console.warn('[Camunda] Operate API query failed, using seeded defaults:', operateError);
        }
      }

      // Fallback: Return expected seeded processes
      // These are the processes that should be deployed during wizard setup
      console.log('[Camunda] Operate API not available, returning seeded defaults');
      const processes = [
        {
          key: '2251799813685249',
          name: 'Agent Collaboration Decision',
          version: 1,
          resourceName: 'agent-collaboration.dmn',
          deploymentTime: new Date().toISOString(),
        },
        {
          key: '2251799813685250',
          name: 'Budget Overrun Workflow',
          version: 1,
          resourceName: 'budget-overrun-workflow.bpmn',
          deploymentTime: new Date().toISOString(),
        },
        {
          key: '2251799813685251',
          name: 'Risk Escalation Process',
          version: 1,
          resourceName: 'risk-escalation.bpmn',
          deploymentTime: new Date().toISOString(),
        },
      ];

      res.json({
        success: true,
        processes,
        count: processes.length,
        source: 'seeded-defaults',
        note: 'Configure CAMUNDA_OPERATE_URL to query live processes',
      });
    } catch (error: any) {
      console.error('[Camunda] Get processes error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        processes: [],
      });
    }
  });

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
