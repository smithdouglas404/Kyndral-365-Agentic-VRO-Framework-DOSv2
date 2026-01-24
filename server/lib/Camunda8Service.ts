/**
 * CAMUNDA 8 SERVICE
 *
 * Integration with Camunda 8 for:
 * - DMN decision tables (agent collaboration rules)
 * - BPMN workflows (inter-agent processes)
 * - Zeebe workflow engine
 *
 * Why Camunda 8?
 * - Visual rule builder (DMN decision tables)
 * - BPMN workflow orchestration
 * - Cloud-native, highly scalable
 * - Beautiful UI (Camunda Modeler)
 * - Industry standard
 */

import { ZBClient } from 'zeebe-node';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface CamundaConfig {
  zeebeAddress?: string;
  clientId?: string;
  clientSecret?: string;
  clusterId?: string;
  region?: string; // 'bru-2', 'ont-1', etc.
  oAuthUrl?: string;
}

export interface DecisionEvaluationRequest {
  decisionId: string;
  variables: Record<string, any>;
}

export interface DecisionEvaluationResult {
  decisionId: string;
  decisionName: string;
  decisionOutput: any;
  matchedRules: Array<{
    ruleId: string;
    ruleIndex: number;
    outputs: Record<string, any>;
  }>;
  evaluatedInputs: Record<string, any>;
}

export interface WorkflowDeployment {
  key: string;
  bpmnProcessId: string;
  version: number;
  resourceName: string;
}

export interface WorkflowInstance {
  workflowKey: string;
  bpmnProcessId: string;
  version: number;
  workflowInstanceKey: string;
  variables: Record<string, any>;
}

export interface AgentCollaborationDecision {
  sourceAgent: string;
  cpi?: number;
  spi?: number;
  riskScore?: number;
  budgetVariance?: number;
  severity?: string;
  projectPhase?: string;
  stakeholderImpact?: string;
}

export interface AgentCollaborationOutput {
  shouldCollaborate: boolean;
  targetAgents: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions: Array<{
    type: 'notify' | 'email' | 'escalate' | 'create_task';
    target?: string;
    message?: string;
  }>;
  reasoning?: string;
}

// ============================================================================
// CAMUNDA 8 SERVICE
// ============================================================================

export class Camunda8Service {
  private zeebeClient: ZBClient | null = null;
  private config: CamundaConfig;
  private connected: boolean = false;

  constructor(config?: CamundaConfig) {
    this.config = config || this.loadConfigFromEnv();
  }

  /**
   * Load Camunda config from environment or marketplace
   */
  private loadConfigFromEnv(): CamundaConfig {
    // Try marketplace first
    return {
      zeebeAddress: process.env.ZEEBE_ADDRESS || 'localhost:26500',
      clientId: process.env.ZEEBE_CLIENT_ID,
      clientSecret: process.env.ZEEBE_CLIENT_SECRET,
      clusterId: process.env.CAMUNDA_CLUSTER_ID,
      region: process.env.CAMUNDA_REGION || 'bru-2',
      oAuthUrl: process.env.ZEEBE_AUTHORIZATION_SERVER_URL,
    };
  }

  /**
   * Load config from marketplace integrations
   */
  async loadFromMarketplace(): Promise<void> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM integrations
        WHERE name = 'camunda-8'
        AND status = 'active'
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const integration = result.rows[0] as any;
        const config = integration.config || {};

        this.config = {
          zeebeAddress: integration.base_url || config.zeebeAddress,
          clientId: config.clientId,
          clientSecret: integration.api_key || config.clientSecret,
          clusterId: config.clusterId,
          region: config.region || 'bru-2',
          oAuthUrl: config.oAuthUrl,
        };

        console.log('[Camunda8] Loaded config from marketplace');
      }
    } catch (error) {
      console.warn('[Camunda8] Failed to load marketplace config:', error);
    }
  }

  /**
   * Connect to Camunda 8 (Zeebe)
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    await this.loadFromMarketplace();

    try {
      // Camunda Cloud (SaaS)
      if (this.config.clusterId) {
        this.zeebeClient = new ZBClient({
          camundaCloud: {
            clientId: this.config.clientId!,
            clientSecret: this.config.clientSecret!,
            clusterId: this.config.clusterId,
            clusterRegion: this.config.region,
          },
        });
        console.log(`[Camunda8] Connected to Camunda Cloud cluster: ${this.config.clusterId}`);
      }
      // Self-hosted
      else {
        this.zeebeClient = new ZBClient(this.config.zeebeAddress!, {
          useTLS: false,
        });
        console.log(`[Camunda8] Connected to self-hosted Zeebe: ${this.config.zeebeAddress}`);
      }

      // Test connection
      const topology = await this.zeebeClient.topology();
      console.log(`[Camunda8] Connected to Zeebe cluster with ${topology.brokers.length} brokers`);

      this.connected = true;
    } catch (error: any) {
      console.error('[Camunda8] Connection failed:', error);
      throw new Error(`Failed to connect to Camunda 8: ${error.message}`);
    }
  }

  /**
   * Evaluate DMN decision table
   */
  async evaluateDecision(request: DecisionEvaluationRequest): Promise<DecisionEvaluationResult> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.zeebeClient) {
      throw new Error('Zeebe client not initialized');
    }

    try {
      const result = await this.zeebeClient.evaluateDecision({
        decisionId: request.decisionId,
        variables: request.variables,
      });

      return {
        decisionId: result.decisionId,
        decisionName: result.decisionName,
        decisionOutput: result.decisionOutput,
        matchedRules: result.matchedRules.map((rule: any) => ({
          ruleId: rule.ruleId,
          ruleIndex: rule.ruleIndex,
          outputs: rule.evaluatedOutputs,
        })),
        evaluatedInputs: result.evaluatedInputs,
      };
    } catch (error: any) {
      console.error('[Camunda8] Decision evaluation failed:', error);
      throw new Error(`Decision evaluation failed: ${error.message}`);
    }
  }

  /**
   * Evaluate agent collaboration decision
   * Uses DMN decision table: "agent-collaboration-decision"
   */
  async evaluateAgentCollaboration(
    input: AgentCollaborationDecision
  ): Promise<AgentCollaborationOutput> {
    try {
      const result = await this.evaluateDecision({
        decisionId: 'agent-collaboration-decision',
        variables: {
          sourceAgent: input.sourceAgent,
          cpi: input.cpi || 1.0,
          spi: input.spi || 1.0,
          riskScore: input.riskScore || 0,
          budgetVariance: input.budgetVariance || 0,
          severity: input.severity || 'low',
          projectPhase: input.projectPhase || 'planning',
          stakeholderImpact: input.stakeholderImpact || 'low',
        },
      });

      // Parse DMN output
      const output = result.decisionOutput as any;

      return {
        shouldCollaborate: output.shouldCollaborate || false,
        targetAgents: output.targetAgents || [],
        priority: output.priority || 'medium',
        actions: output.actions || [],
        reasoning: output.reasoning,
      };
    } catch (error: any) {
      console.error('[Camunda8] Agent collaboration decision failed:', error);

      // Fallback to simple rules if Camunda is unavailable
      return this.fallbackCollaborationLogic(input);
    }
  }

  /**
   * Fallback logic if Camunda is unavailable
   */
  private fallbackCollaborationLogic(input: AgentCollaborationDecision): AgentCollaborationOutput {
    const targetAgents: string[] = [];
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    // Simple hardcoded fallback rules
    if (input.cpi && input.cpi < 0.7) {
      targetAgents.push('tmo', 'risk');
      priority = 'high';
    }

    if (input.riskScore && input.riskScore > 8) {
      targetAgents.push('governance');
      priority = 'urgent';
    }

    return {
      shouldCollaborate: targetAgents.length > 0,
      targetAgents: [...new Set(targetAgents)],
      priority,
      actions: targetAgents.map((agent) => ({
        type: 'notify',
        target: agent,
        message: `Collaboration requested by ${input.sourceAgent}`,
      })),
      reasoning: 'Fallback logic (Camunda unavailable)',
    };
  }

  /**
   * Deploy BPMN workflow
   */
  async deployWorkflow(bpmnXml: string, resourceName: string): Promise<WorkflowDeployment> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.zeebeClient) {
      throw new Error('Zeebe client not initialized');
    }

    try {
      const result = await this.zeebeClient.deployResource({
        processFilename: resourceName,
        process: Buffer.from(bpmnXml, 'utf8'),
      });

      const deployment = result.deployments[0];

      console.log(`[Camunda8] Deployed workflow: ${deployment.process.bpmnProcessId} v${deployment.process.version}`);

      return {
        key: deployment.process.processDefinitionKey,
        bpmnProcessId: deployment.process.bpmnProcessId,
        version: deployment.process.version,
        resourceName: deployment.process.resourceName,
      };
    } catch (error: any) {
      console.error('[Camunda8] Workflow deployment failed:', error);
      throw new Error(`Workflow deployment failed: ${error.message}`);
    }
  }

  /**
   * Start workflow instance
   */
  async startWorkflow(
    bpmnProcessId: string,
    variables: Record<string, any>
  ): Promise<WorkflowInstance> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.zeebeClient) {
      throw new Error('Zeebe client not initialized');
    }

    try {
      const result = await this.zeebeClient.createProcessInstance({
        bpmnProcessId,
        variables,
      });

      console.log(`[Camunda8] Started workflow instance: ${result.processInstanceKey}`);

      return {
        workflowKey: result.processDefinitionKey.toString(),
        bpmnProcessId: result.bpmnProcessId,
        version: result.version,
        workflowInstanceKey: result.processInstanceKey.toString(),
        variables,
      };
    } catch (error: any) {
      console.error('[Camunda8] Workflow start failed:', error);
      throw new Error(`Workflow start failed: ${error.message}`);
    }
  }

  /**
   * Publish message to workflow
   */
  async publishMessage(
    messageName: string,
    correlationKey: string,
    variables: Record<string, any>
  ): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.zeebeClient) {
      throw new Error('Zeebe client not initialized');
    }

    try {
      await this.zeebeClient.publishMessage({
        name: messageName,
        correlationKey,
        variables,
      });

      console.log(`[Camunda8] Published message: ${messageName}`);
    } catch (error: any) {
      console.error('[Camunda8] Message publish failed:', error);
      throw new Error(`Message publish failed: ${error.message}`);
    }
  }

  /**
   * Get workflow topology
   */
  async getTopology(): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.zeebeClient) {
      throw new Error('Zeebe client not initialized');
    }

    return await this.zeebeClient.topology();
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.zeebeClient) {
      await this.zeebeClient.close();
      this.connected = false;
      console.log('[Camunda8] Connection closed');
    }
  }
}

/**
 * Singleton instance
 */
let camunda8ServiceInstance: Camunda8Service | null = null;

export function getCamunda8Service(): Camunda8Service {
  if (!camunda8ServiceInstance) {
    camunda8ServiceInstance = new Camunda8Service();
  }
  return camunda8ServiceInstance;
}
