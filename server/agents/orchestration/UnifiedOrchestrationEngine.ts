/**
 * UNIFIED ORCHESTRATION ENGINE
 *
 * Real-time multi-agent coordination with cross-agent context sharing,
 * workflow orchestration, and unified intelligence layer
 *
 * ARCHITECTURE:
 * - Agent-to-Agent Communication (A2A)
 * - Context Sharing Memory
 * - Workflow Triggers (agent triggers agent)
 * - Unified Intelligence Layer
 * - Real-time decision making
 */

import type { IStorage } from '../../storage.js';
import type { InsertAgentActivityLog, InsertIntervention } from '@shared/schema';
import { EventEmitter } from 'events';
import { A2AMessageBus, MCPProtocolHandler, type AgentMessage } from '../ContinuousOrchestrator.js';

// ============================================================================
// CONFIGURABLE RULE THRESHOLDS
// Tunable via environment without a deploy; defaults preserve prior
// hardcoded values (CPI/SPI < 0.85 trigger workflow rules).
// ============================================================================

const RULE_CPI_CRITICAL = parseFloat(process.env.RULE_CPI_CRITICAL || '0.85');
const RULE_SPI_CRITICAL = parseFloat(process.env.RULE_SPI_CRITICAL || '0.85');

// ============================================================================
// SHARED CONTEXT & MEMORY
// ============================================================================

export interface AgentContext {
  agentId: string;
  projectId?: string;
  insights: Record<string, any>;
  recommendations: string[];
  confidence: number;
  timestamp: Date;
  dependencies: string[]; // Which other agents need this info
}

export class SharedContextMemory {
  private contexts: Map<string, AgentContext[]> = new Map();
  private globalInsights: Map<string, any> = new Map();

  /**
   * Store context from an agent
   */
  async store(context: AgentContext): Promise<void> {
    const key = context.projectId || 'global';
    const existing = this.contexts.get(key) || [];
    existing.push(context);
    this.contexts.set(key, existing);

    console.log(`[Context] ${context.agentId} shared context for ${key}`);
  }

  /**
   * Get relevant context for an agent
   */
  async getContext(agentId: string, projectId?: string): Promise<AgentContext[]> {
    const key = projectId || 'global';
    const contexts = this.contexts.get(key) || [];

    // Return contexts from other agents (not self)
    return contexts.filter(c => c.agentId !== agentId);
  }

  /**
   * Get cross-agent insights for a project
   */
  async getProjectInsights(projectId: string): Promise<Map<string, any>> {
    const contexts = this.contexts.get(projectId) || [];
    const insights = new Map<string, any>();

    contexts.forEach(ctx => {
      insights.set(ctx.agentId, ctx.insights);
    });

    return insights;
  }

  /**
   * Store global insight accessible to all agents
   */
  setGlobalInsight(key: string, value: any): void {
    this.globalInsights.set(key, value);
  }

  /**
   * Get global insight
   */
  getGlobalInsight(key: string): any {
    return this.globalInsights.get(key);
  }
}

// ============================================================================
// WORKFLOW ORCHESTRATION
// ============================================================================

export interface WorkflowTrigger {
  sourceAgent: string;
  targetAgent: string;
  condition: (context: AgentContext) => boolean;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  payload: any;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    agent: string;
    event: string;
    condition?: (data: any) => boolean;
  };
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowAction {
  type: 'trigger_agent' | 'send_message' | 'create_intervention' | 'update_project' | 'notify';
  agent?: string;
  params: any;
}

export class WorkflowEngine {
  private rules: Map<string, WorkflowRule> = new Map();
  private messageBus: A2AMessageBus;
  private storage: IStorage;

  constructor(messageBus: A2AMessageBus, storage: IStorage) {
    this.messageBus = messageBus;
    this.storage = storage;
    this.initializeDefaultRules();
  }

  /**
   * Initialize default workflow rules
   */
  private initializeDefaultRules(): void {
    // Rule: Budget overrun triggers VRO to assess value impact
    this.addRule({
      id: 'budget_overrun_vro',
      name: 'Budget Overrun → VRO Assessment',
      description: 'When FinOps detects budget overrun, VRO assesses impact on value realization',
      trigger: {
        agent: 'finops',
        event: 'budget_overrun',
        condition: (data) => data.cpi < RULE_CPI_CRITICAL,
      },
      actions: [
        {
          type: 'trigger_agent',
          agent: 'vro',
          params: { reason: 'budget_overrun', severity: 'high' },
        },
        {
          type: 'send_message',
          agent: 'tmo',
          params: { type: 'alert', content: 'Budget overrun detected - check schedule' },
        },
      ],
      enabled: true,
    });

    // Rule: Schedule delay triggers resource planning
    this.addRule({
      id: 'schedule_delay_planning',
      name: 'Schedule Delay → Planning Agent',
      description: 'When TMO detects schedule delay, Planning reviews resources and dependencies',
      trigger: {
        agent: 'tmo',
        event: 'schedule_delay',
        condition: (data) => data.spi < RULE_SPI_CRITICAL,
      },
      actions: [
        {
          type: 'trigger_agent',
          agent: 'planning',
          params: { reason: 'schedule_delay' },
        },
        {
          type: 'send_message',
          agent: 'finops',
          params: { type: 'alert', content: 'Schedule delay - may need budget reallocation' },
        },
      ],
      enabled: true,
    });

    // Rule: High risk triggers governance review
    this.addRule({
      id: 'high_risk_governance',
      name: 'High Risk → Governance Review',
      description: 'When Risk agent detects high risk, Governance checks compliance and approvals',
      trigger: {
        agent: 'risk',
        event: 'high_risk_detected',
        condition: (data) => data.severity === 'high' || data.severity === 'critical',
      },
      actions: [
        {
          type: 'trigger_agent',
          agent: 'governance',
          params: { reason: 'high_risk', requiresReview: true },
        },
      ],
      enabled: true,
    });

    // Rule: OKR misalignment triggers VRO
    this.addRule({
      id: 'okr_misalignment_vro',
      name: 'OKR Misalignment → VRO',
      description: 'When OKR agent detects misalignment, VRO reviews strategic value',
      trigger: {
        agent: 'okr',
        event: 'misalignment_detected',
        condition: (data) => data.alignmentScore < 0.6,
      },
      actions: [
        {
          type: 'trigger_agent',
          agent: 'vro',
          params: { reason: 'okr_misalignment' },
        },
      ],
      enabled: true,
    });

    // Rule: Value realization issues trigger OCM
    this.addRule({
      id: 'value_issue_ocm',
      name: 'Value Issue → OCM',
      description: 'When VRO detects value realization issues, OCM reviews change management',
      trigger: {
        agent: 'vro',
        event: 'value_at_risk',
        condition: (data) => data.expectedROI < data.targetROI * 0.8,
      },
      actions: [
        {
          type: 'trigger_agent',
          agent: 'ocm',
          params: { reason: 'value_at_risk' },
        },
      ],
      enabled: true,
    });
  }

  /**
   * Add workflow rule
   */
  addRule(rule: WorkflowRule): void {
    this.rules.set(rule.id, rule);
    console.log(`[Workflow] Added rule: ${rule.name}`);
  }

  /**
   * Process event and trigger workflows
   */
  async processEvent(agentId: string, event: string, data: any): Promise<void> {
    console.log(`[Workflow] Processing event: ${agentId}.${event}`);

    // Find matching rules
    const matchingRules = Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled) return false;
      if (rule.trigger.agent !== agentId) return false;
      if (rule.trigger.event !== event) return false;
      if (rule.trigger.condition && !rule.trigger.condition(data)) return false;
      return true;
    });

    console.log(`[Workflow] Found ${matchingRules.length} matching rules`);

    // Execute actions for each matching rule
    for (const rule of matchingRules) {
      console.log(`[Workflow] Executing rule: ${rule.name}`);

      for (const action of rule.actions) {
        await this.executeAction(action, agentId, data);
      }
    }
  }

  /**
   * Execute workflow action
   */
  private async executeAction(action: WorkflowAction, sourceAgent: string, data: any): Promise<void> {
    switch (action.type) {
      case 'trigger_agent':
        if (action.agent) {
          await this.messageBus.send({
            from: sourceAgent,
            to: action.agent,
            type: 'request',
            content: `Workflow triggered: ${JSON.stringify(action.params)}`,
            projectId: data.projectId,
            severity: action.params.severity || 'medium',
          });
        }
        break;

      case 'send_message':
        if (action.agent) {
          await this.messageBus.send({
            from: sourceAgent,
            to: action.agent,
            type: action.params.type || 'communication',
            content: action.params.content,
            projectId: data.projectId,
          });
        }
        break;

      case 'create_intervention':
        await this.storage.createIntervention({
          type: 'workflow_triggered',
          severity: action.params.severity || 'medium',
          title: action.params.title,
          description: action.params.description,
          projectId: data.projectId,
          projectName: null,
          confidence: '0.85',
          suggestedAction: action.params.suggestedAction || '',
          impact: action.params.impact || '',
          status: 'pending',
          agentSource: sourceAgent,
          isAutonomous: 'false',
          selfApproved: 'false',
          triggerSource: 'workflow_orchestration',
          approvedBy: null,
        });
        break;
    }
  }

  /**
   * Get all rules
   */
  getRules(): WorkflowRule[] {
    return Array.from(this.rules.values());
  }
}

// ============================================================================
// UNIFIED INTELLIGENCE LAYER
// ============================================================================

export interface UnifiedInsight {
  projectId: string;
  projectName: string;
  overallHealth: 'healthy' | 'at_risk' | 'critical';
  healthScore: number;
  agentInsights: Map<string, any>;
  crossCuttingIssues: string[];
  recommendations: string[];
  confidence: number;
  lastUpdated: Date;
}

export class UnifiedIntelligenceLayer {
  private projectInsights: Map<string, UnifiedInsight> = new Map();
  private contextMemory: SharedContextMemory;
  private storage: IStorage;

  constructor(contextMemory: SharedContextMemory, storage: IStorage) {
    this.contextMemory = contextMemory;
    this.storage = storage;
  }

  /**
   * Synthesize insights from all agents for a project
   */
  async synthesizeProjectInsights(projectId: string): Promise<UnifiedInsight> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Get all agent contexts for this project
    const agentContexts = await this.contextMemory.getProjectInsights(projectId);

    // Calculate overall health
    const healthScore = this.calculateHealthScore(agentContexts);
    const overallHealth = healthScore > 0.7 ? 'healthy' : healthScore > 0.4 ? 'at_risk' : 'critical';

    // Identify cross-cutting issues
    const crossCuttingIssues = this.identifyCrossCuttingIssues(agentContexts);

    // Generate unified recommendations
    const recommendations = this.generateRecommendations(agentContexts, crossCuttingIssues);

    const insight: UnifiedInsight = {
      projectId,
      projectName: project.name,
      overallHealth,
      healthScore,
      agentInsights: agentContexts,
      crossCuttingIssues,
      recommendations,
      confidence: 0.85,
      lastUpdated: new Date(),
    };

    this.projectInsights.set(projectId, insight);
    return insight;
  }

  /**
   * Calculate overall health score from agent insights
   */
  private calculateHealthScore(agentInsights: Map<string, any>): number {
    let totalScore = 0;
    let count = 0;

    agentInsights.forEach((insights, agentId) => {
      if (insights.healthScore !== undefined) {
        totalScore += insights.healthScore;
        count++;
      }
    });

    return count > 0 ? totalScore / count : 0.5;
  }

  /**
   * Identify issues that span multiple agents/domains
   */
  private identifyCrossCuttingIssues(agentInsights: Map<string, any>): string[] {
    const issues: string[] = [];

    const hasFinanceIssue = agentInsights.has('finops') &&
      agentInsights.get('finops')?.issues?.length > 0;
    const hasScheduleIssue = agentInsights.has('tmo') &&
      agentInsights.get('tmo')?.issues?.length > 0;
    const hasValueIssue = agentInsights.has('vro') &&
      agentInsights.get('vro')?.issues?.length > 0;

    if (hasFinanceIssue && hasScheduleIssue) {
      issues.push('Budget overrun and schedule delay detected - critical coordination needed');
    }

    if (hasValueIssue && hasFinanceIssue) {
      issues.push('Value realization at risk due to budget constraints');
    }

    if (hasScheduleIssue && hasValueIssue) {
      issues.push('Schedule delays impacting planned value delivery');
    }

    return issues;
  }

  /**
   * Generate unified recommendations
   */
  private generateRecommendations(
    agentInsights: Map<string, any>,
    crossCuttingIssues: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Add cross-cutting recommendations
    if (crossCuttingIssues.length > 0) {
      recommendations.push('Multi-agent coordination required - escalate to PMO leadership');
    }

    // Collect agent-specific recommendations
    agentInsights.forEach((insights, agentId) => {
      if (insights.recommendations) {
        insights.recommendations.forEach((rec: string) => {
          if (!recommendations.includes(rec)) {
            recommendations.push(rec);
          }
        });
      }
    });

    return recommendations;
  }

  /**
   * Get unified insight for a project
   */
  getProjectInsight(projectId: string): UnifiedInsight | undefined {
    return this.projectInsights.get(projectId);
  }

  /**
   * Get all project insights
   */
  getAllInsights(): UnifiedInsight[] {
    return Array.from(this.projectInsights.values());
  }
}

// ============================================================================
// MAIN ORCHESTRATION ENGINE
// ============================================================================

export class UnifiedOrchestrationEngine {
  private messageBus: A2AMessageBus;
  private mcpHandler: MCPProtocolHandler;
  private contextMemory: SharedContextMemory;
  private workflowEngine: WorkflowEngine;
  private intelligenceLayer: UnifiedIntelligenceLayer;
  private storage: IStorage;
  private agents: Map<string, any> = new Map();
  private running: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.messageBus = new A2AMessageBus();
    this.mcpHandler = new MCPProtocolHandler();
    this.contextMemory = new SharedContextMemory();
    this.workflowEngine = new WorkflowEngine(this.messageBus, storage);
    this.intelligenceLayer = new UnifiedIntelligenceLayer(this.contextMemory, storage);

    console.log('[UnifiedOrchestration] Engine initialized');
  }

  /**
   * Register an agent with the engine
   */
  registerAgent(agentId: string, agent: any): void {
    this.agents.set(agentId, agent);
    console.log(`[UnifiedOrchestration] Registered agent: ${agentId}`);

    // Subscribe agent to message bus
    this.messageBus.subscribe(agentId, async (message) => {
      await this.handleAgentMessage(agentId, message);
    });
  }

  /**
   * Handle message received by agent
   */
  private async handleAgentMessage(agentId: string, message: AgentMessage): Promise<void> {
    console.log(`[UnifiedOrchestration] ${agentId} received message from ${message.from}`);

    // Log communication
    await this.storage.createAgentActivityLog({
      eventType: 'agent_communication',
      primaryAgentId: agentId,
      primaryAgentName: agentId,
      secondaryAgentId: message.from,
      secondaryAgentName: message.from,
      summary: `Received ${message.type} from ${message.from}`,
      details: message.content,
    });

    // If it's a request, trigger the agent
    if (message.type === 'request') {
      const agent = this.agents.get(agentId);
      if (agent && typeof agent.execute === 'function') {
        try {
          const result = await agent.execute(message.content, {
            projectId: message.projectId,
            triggeredBy: message.from,
          });

          // Send response back
          await this.messageBus.send({
            from: agentId,
            to: message.from,
            type: 'response',
            content: result.output || 'Processed request',
            projectId: message.projectId,
          });
        } catch (error) {
          console.error(`[UnifiedOrchestration] Error executing agent ${agentId}:`, error);
        }
      }
    }
  }

  /**
   * Agent shares context with other agents
   */
  async shareContext(agentId: string, context: AgentContext): Promise<void> {
    await this.contextMemory.store(context);

    // Notify dependent agents
    if (context.dependencies && context.dependencies.length > 0) {
      for (const targetAgent of context.dependencies) {
        await this.messageBus.send({
          from: agentId,
          to: targetAgent,
          type: 'communication',
          content: `Shared context: ${JSON.stringify(context.insights)}`,
          projectId: context.projectId,
        });
      }
    }
  }

  /**
   * Trigger workflow based on agent event
   */
  async triggerWorkflow(agentId: string, event: string, data: any): Promise<void> {
    await this.workflowEngine.processEvent(agentId, event, data);
  }

  /**
   * Get unified intelligence for a project
   */
  async getUnifiedInsights(projectId: string): Promise<UnifiedInsight> {
    return await this.intelligenceLayer.synthesizeProjectInsights(projectId);
  }

  /**
   * Get all unified insights
   */
  getAllUnifiedInsights(): UnifiedInsight[] {
    return this.intelligenceLayer.getAllInsights();
  }

  /**
   * Send message between agents
   */
  async sendMessage(from: string, to: string, message: string, projectId?: string): Promise<void> {
    await this.messageBus.send({
      from,
      to,
      type: 'communication',
      content: message,
      projectId,
    });
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(from: string, recipients: string[], message: string, projectId?: string): Promise<void> {
    await this.messageBus.broadcast(
      {
        from,
        type: 'communication',
        content: message,
        projectId,
      },
      recipients
    );
  }

  /**
   * Get orchestration status
   */
  getStatus() {
    return {
      running: this.running,
      registeredAgents: Array.from(this.agents.keys()),
      messageBus: this.messageBus.getStatus(),
      workflowRules: this.workflowEngine.getRules().length,
      projectInsights: this.intelligenceLayer.getAllInsights().length,
    };
  }

  /**
   * Start the orchestration engine
   */
  start(): void {
    this.running = true;
    console.log('[UnifiedOrchestration] Engine started');
  }

  /**
   * Stop the orchestration engine
   */
  stop(): void {
    this.running = false;
    console.log('[UnifiedOrchestration] Engine stopped');
  }
}

/**
 * Factory function
 */
export function createUnifiedOrchestrationEngine(storage: IStorage): UnifiedOrchestrationEngine {
  return new UnifiedOrchestrationEngine(storage);
}
