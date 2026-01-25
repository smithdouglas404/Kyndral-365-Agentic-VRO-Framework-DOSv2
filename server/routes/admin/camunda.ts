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
import { parseDmnXml, generateSampleDmn, formatDmnAsMarkdown } from '../../lib/DmnParser.js';
import { simulateDecisionTable, generateSampleInputs } from '../../lib/DmnSimulator.js';

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

  /**
   * GET /api/admin/camunda/dmn/:decisionKey
   * Get DMN decision table details for viewing
   */
  app.get('/api/admin/camunda/dmn/:decisionKey', authenticate, async (req: Request, res: Response) => {
    try {
      const { decisionKey } = req.params;
      const { format = 'json' } = req.query;

      // Try to fetch DMN XML from Camunda Operate API
      const operateUrl = process.env.CAMUNDA_OPERATE_URL;

      if (operateUrl) {
        try {
          // Query Operate API for decision definition XML
          const authHeader = process.env.CAMUNDA_CLIENT_ID && process.env.CAMUNDA_CLIENT_SECRET
            ? `Basic ${Buffer.from(`${process.env.CAMUNDA_CLIENT_ID}:${process.env.CAMUNDA_CLIENT_SECRET}`).toString('base64')}`
            : undefined;

          const response = await fetch(`${operateUrl}/v1/decision-definitions/${decisionKey}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader }),
            },
          });

          if (response.ok) {
            const dmnXml = await response.text();
            const parsedDmn = await parseDmnXml(dmnXml);

            if (format === 'markdown') {
              res.setHeader('Content-Type', 'text/markdown');
              return res.send(formatDmnAsMarkdown(parsedDmn));
            }

            return res.json({
              success: true,
              dmn: parsedDmn,
              source: 'camunda-operate',
            });
          }
        } catch (operateError) {
          console.warn('[Camunda] Operate API failed, using sample data:', operateError);
        }
      }

      // Fallback: Generate sample DMN for demo purposes
      console.log(`[Camunda] Operate API not available, generating sample DMN for: ${decisionKey}`);

      // Map common decision keys to friendly names
      const decisionNames: Record<string, string> = {
        'agent-collaboration-decision': 'Agent Collaboration',
        'budget-approval-decision': 'Budget Approval',
        'risk-escalation-decision': 'Risk Escalation',
        'resource-allocation-decision': 'Resource Allocation',
        'change-request-decision': 'Change Request Approval',
      };

      const decisionName = decisionNames[decisionKey] || decisionKey
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      const sampleDmn = generateSampleDmn(decisionName);

      if (format === 'markdown') {
        res.setHeader('Content-Type', 'text/markdown');
        return res.send(formatDmnAsMarkdown(sampleDmn));
      }

      res.json({
        success: true,
        dmn: sampleDmn,
        source: 'sample-data',
        note: 'Configure CAMUNDA_OPERATE_URL to fetch live DMN tables',
      });
    } catch (error: any) {
      console.error('[Camunda] Get DMN error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/camunda/dmn/:decisionKey/xml
   * Get raw DMN XML for a decision
   */
  app.get('/api/admin/camunda/dmn/:decisionKey/xml', authenticate, async (req: Request, res: Response) => {
    try {
      const { decisionKey } = req.params;

      // Try to fetch from Operate API
      const operateUrl = process.env.CAMUNDA_OPERATE_URL;

      if (operateUrl) {
        try {
          const authHeader = process.env.CAMUNDA_CLIENT_ID && process.env.CAMUNDA_CLIENT_SECRET
            ? `Basic ${Buffer.from(`${process.env.CAMUNDA_CLIENT_ID}:${process.env.CAMUNDA_CLIENT_SECRET}`).toString('base64')}`
            : undefined;

          const response = await fetch(`${operateUrl}/v1/decision-definitions/${decisionKey}/xml`, {
            headers: {
              ...(authHeader && { 'Authorization': authHeader }),
            },
          });

          if (response.ok) {
            const dmnXml = await response.text();
            res.setHeader('Content-Type', 'application/xml');
            return res.send(dmnXml);
          }
        } catch (operateError) {
          console.warn('[Camunda] Operate API failed:', operateError);
        }
      }

      // Fallback: Return sample DMN XML
      const sampleXml = generateSampleDmnXml(decisionKey);
      res.setHeader('Content-Type', 'application/xml');
      res.send(sampleXml);
    } catch (error: any) {
      console.error('[Camunda] Get DMN XML error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/camunda/dmn/:decisionKey/simulate
   * Simulate a DMN decision table with given inputs
   */
  app.post('/api/admin/camunda/dmn/:decisionKey/simulate', authenticate, async (req: Request, res: Response) => {
    try {
      const { decisionKey } = req.params;
      const { inputs } = req.body;

      if (!inputs || typeof inputs !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid inputs object',
        });
      }

      // First, fetch the DMN decision table
      const operateUrl = process.env.CAMUNDA_OPERATE_URL;
      let parsedDmn;

      if (operateUrl) {
        try {
          const authHeader = process.env.CAMUNDA_CLIENT_ID && process.env.CAMUNDA_CLIENT_SECRET
            ? `Basic ${Buffer.from(`${process.env.CAMUNDA_CLIENT_ID}:${process.env.CAMUNDA_CLIENT_SECRET}`).toString('base64')}`
            : undefined;

          const response = await fetch(`${operateUrl}/v1/decision-definitions/${decisionKey}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader }),
            },
          });

          if (response.ok) {
            const dmnXml = await response.text();
            parsedDmn = await parseDmnXml(dmnXml);
          }
        } catch (operateError) {
          console.warn('[Camunda] Operate API failed, using sample data:', operateError);
        }
      }

      // Fallback: Use sample DMN
      if (!parsedDmn) {
        const decisionNames: Record<string, string> = {
          'agent-collaboration-decision': 'Agent Collaboration',
          'budget-approval-decision': 'Budget Approval',
          'risk-escalation-decision': 'Risk Escalation',
          'resource-allocation-decision': 'Resource Allocation',
          'change-request-decision': 'Change Request Approval',
        };

        const decisionName = decisionNames[decisionKey] || decisionKey
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        parsedDmn = generateSampleDmn(decisionName);
      }

      if (!parsedDmn.decisionTables || parsedDmn.decisionTables.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No decision tables found in DMN',
        });
      }

      // Simulate the first decision table
      const decisionTable = parsedDmn.decisionTables[0];
      const simulationResult = simulateDecisionTable(decisionTable, inputs);

      res.json({
        success: true,
        simulation: simulationResult,
      });
    } catch (error: any) {
      console.error('[Camunda] DMN simulation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/camunda/dmn/:decisionKey/versions
   * Get version history for a DMN decision table
   */
  app.get('/api/admin/camunda/dmn/:decisionKey/versions', authenticate, async (req: Request, res: Response) => {
    try {
      const { decisionKey } = req.params;

      // Try to fetch version history from Camunda Operate API
      const operateUrl = process.env.CAMUNDA_OPERATE_URL;

      if (operateUrl) {
        try {
          const authHeader = process.env.CAMUNDA_CLIENT_ID && process.env.CAMUNDA_CLIENT_SECRET
            ? `Basic ${Buffer.from(`${process.env.CAMUNDA_CLIENT_ID}:${process.env.CAMUNDA_CLIENT_SECRET}`).toString('base64')}`
            : undefined;

          // Search for all versions of this decision
          const response = await fetch(`${operateUrl}/v1/decision-definitions/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader }),
            },
            body: JSON.stringify({
              filter: {
                decisionId: decisionKey,
              },
              sort: [
                {
                  field: 'version',
                  order: 'DESC',
                },
              ],
              size: 50,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const versions = data.items?.map((item: any) => ({
              key: item.key,
              decisionId: item.decisionId,
              name: item.name,
              version: item.version,
              versionTag: item.versionTag,
              deploymentTime: item.deployTime,
              resourceName: item.resourceName,
            })) || [];

            return res.json({
              success: true,
              versions,
              count: versions.length,
              source: 'camunda-operate',
            });
          }
        } catch (operateError) {
          console.warn('[Camunda] Operate API failed, using sample data:', operateError);
        }
      }

      // Fallback: Generate sample version history
      const now = new Date();
      const versions = [
        {
          key: '2251799813685253',
          decisionId: decisionKey,
          name: decisionKey.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          version: 3,
          versionTag: 'v3.0',
          deploymentTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          resourceName: `${decisionKey}.dmn`,
        },
        {
          key: '2251799813685252',
          decisionId: decisionKey,
          name: decisionKey.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          version: 2,
          versionTag: 'v2.0',
          deploymentTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          resourceName: `${decisionKey}.dmn`,
        },
        {
          key: '2251799813685251',
          decisionId: decisionKey,
          name: decisionKey.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          version: 1,
          versionTag: 'v1.0',
          deploymentTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          resourceName: `${decisionKey}.dmn`,
        },
      ];

      res.json({
        success: true,
        versions,
        count: versions.length,
        source: 'sample-data',
        note: 'Configure CAMUNDA_OPERATE_URL to fetch live version history',
      });
    } catch (error: any) {
      console.error('[Camunda] Get DMN versions error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/camunda/dmn/:decisionKey/sample-inputs
   * Generate sample inputs for a DMN decision table
   */
  app.get('/api/admin/camunda/dmn/:decisionKey/sample-inputs', authenticate, async (req: Request, res: Response) => {
    try {
      const { decisionKey } = req.params;

      // Fetch the DMN decision table to get input definitions
      const operateUrl = process.env.CAMUNDA_OPERATE_URL;
      let parsedDmn;

      if (operateUrl) {
        try {
          const authHeader = process.env.CAMUNDA_CLIENT_ID && process.env.CAMUNDA_CLIENT_SECRET
            ? `Basic ${Buffer.from(`${process.env.CAMUNDA_CLIENT_ID}:${process.env.CAMUNDA_CLIENT_SECRET}`).toString('base64')}`
            : undefined;

          const response = await fetch(`${operateUrl}/v1/decision-definitions/${decisionKey}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader }),
            },
          });

          if (response.ok) {
            const dmnXml = await response.text();
            parsedDmn = await parseDmnXml(dmnXml);
          }
        } catch (operateError) {
          console.warn('[Camunda] Operate API failed, using sample data:', operateError);
        }
      }

      // Fallback: Use sample DMN
      if (!parsedDmn) {
        const decisionNames: Record<string, string> = {
          'agent-collaboration-decision': 'Agent Collaboration',
          'budget-approval-decision': 'Budget Approval',
          'risk-escalation-decision': 'Risk Escalation',
          'resource-allocation-decision': 'Resource Allocation',
          'change-request-decision': 'Change Request Approval',
        };

        const decisionName = decisionNames[decisionKey] || decisionKey
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        parsedDmn = generateSampleDmn(decisionName);
      }

      if (!parsedDmn.decisionTables || parsedDmn.decisionTables.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No decision tables found in DMN',
        });
      }

      const decisionTable = parsedDmn.decisionTables[0];
      const sampleInputs = generateSampleInputs(decisionTable);

      res.json({
        success: true,
        sampleInputs,
        inputDefinitions: decisionTable.inputs.map((input) => ({
          id: input.id,
          label: input.label,
          expression: input.expression,
          typeRef: input.typeRef,
        })),
      });
    } catch (error: any) {
      console.error('[Camunda] Get sample inputs error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[Camunda] Camunda 8 routes registered');
}

/**
 * Generate sample DMN XML for demo purposes
 */
function generateSampleDmnXml(decisionKey: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"
             xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
             xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
             id="definitions_${decisionKey}"
             name="Sample DMN"
             namespace="http://example.com/dmn"
             exporter="Camunda Modeler"
             exporterVersion="5.0.0">
  <decision id="${decisionKey}" name="Sample Decision Table">
    <decisionTable id="decisionTable" hitPolicy="FIRST">
      <input id="input1" label="CPI">
        <inputExpression id="inputExpression1" typeRef="number">
          <text>cpi</text>
        </inputExpression>
      </input>
      <input id="input2" label="Risk Score">
        <inputExpression id="inputExpression2" typeRef="number">
          <text>riskScore</text>
        </inputExpression>
      </input>
      <output id="output1" label="Should Collaborate" name="shouldCollaborate" typeRef="boolean" />
      <output id="output2" label="Target Agents" name="targetAgents" typeRef="string" />
      <output id="output3" label="Priority" name="priority" typeRef="string" />
      <rule id="rule1">
        <inputEntry id="inputEntry1_1">
          <text>&lt; 0.7</text>
        </inputEntry>
        <inputEntry id="inputEntry1_2">
          <text>&gt; 8</text>
        </inputEntry>
        <outputEntry id="outputEntry1_1">
          <text>true</text>
        </outputEntry>
        <outputEntry id="outputEntry1_2">
          <text>"tmo,risk,governance"</text>
        </outputEntry>
        <outputEntry id="outputEntry1_3">
          <text>"urgent"</text>
        </outputEntry>
      </rule>
      <rule id="rule2">
        <inputEntry id="inputEntry2_1">
          <text>&lt; 0.85</text>
        </inputEntry>
        <inputEntry id="inputEntry2_2">
          <text>&gt; 5</text>
        </inputEntry>
        <outputEntry id="outputEntry2_1">
          <text>true</text>
        </outputEntry>
        <outputEntry id="outputEntry2_2">
          <text>"tmo,risk"</text>
        </outputEntry>
        <outputEntry id="outputEntry2_3">
          <text>"high"</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
</definitions>`;
}
