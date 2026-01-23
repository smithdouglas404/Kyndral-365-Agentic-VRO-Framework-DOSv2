/**
 * DEEP AGENT ORCHESTRATOR
 *
 * Integrates Deep Agents with A2A (Agent-to-Agent) orchestration
 * - Deep Agents handle individual reasoning
 * - A2A handles multi-agent collaboration
 * - Orchestrator coordinates both layers
 */

import type { IStorage } from "../../storage.js";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import { DeepFinOpsAgent } from "./DeepFinOpsAgent.js";
import { DeepTMOAgent } from "./DeepTMOAgent.js";
import { DeepRiskAgent } from "./DeepRiskAgent.js";
import { DeepVROAgent } from "./DeepVROAgent.js";

/**
 * A2A message for deep agent collaboration
 */
interface DeepA2AMessage {
  from: string;
  to: string;
  messageType: 'request_collaboration' | 'share_insight' | 'request_plan_review' | 'share_reflection';
  payload: any;
  timestamp: Date;
  requiresResponse: boolean;
}

/**
 * Collaboration request from one deep agent to another
 */
interface CollaborationRequest {
  requestingAgent: string;
  targetAgent: string;
  reason: string;
  context: any;
  plan?: any;
  reflections?: any[];
}

/**
 * Deep Agent Orchestrator
 * Coordinates deep agents and enables A2A collaboration
 */
export class DeepAgentOrchestrator {
  private storage: IStorage;
  private deepAgents: Map<string, DeepAgentBase> = new Map();
  private messageQueue: DeepA2AMessage[] = [];
  private collaborationHistory: CollaborationRequest[] = [];

  constructor(storage: IStorage) {
    this.storage = storage;
    this.initializeDeepAgents();
  }

  /**
   * Initialize deep agents
   */
  private initializeDeepAgents() {
    // Register Deep FinOps Agent
    const deepFinOps = new DeepFinOpsAgent(this.storage);
    this.deepAgents.set('deep-finops', deepFinOps);

    // Register Deep TMO Agent
    const deepTMO = new DeepTMOAgent(this.storage);
    this.deepAgents.set('deep-tmo', deepTMO);

    // Register Deep Risk Agent
    const deepRisk = new DeepRiskAgent(this.storage);
    this.deepAgents.set('deep-risk', deepRisk);

    // Register Deep VRO Agent
    const deepVRO = new DeepVROAgent(this.storage);
    this.deepAgents.set('deep-vro', deepVRO);

    console.log('[DeepAgentOrchestrator] Initialized with', this.deepAgents.size, 'deep agents');
  }

  /**
   * Run a deep agent with A2A support
   */
  async runDeepAgent(agentName: string, goal: string, context: any = {}): Promise<any> {
    const agent = this.deepAgents.get(agentName);
    if (!agent) {
      throw new Error(`Deep agent not found: ${agentName}`);
    }

    console.log(`[DeepAgentOrchestrator] Running deep agent: ${agentName}`);

    // Run the deep agent (planning + execution + reflection)
    const result = await agent.run(goal, context);

    // Check if agent's plan suggests collaboration
    const currentPlan = agent.getCurrentPlan();
    if (currentPlan?.requiresCollaboration) {
      console.log(`[DeepAgentOrchestrator] Agent ${agentName} requests collaboration`);
      await this.initiateCollaboration(agentName, currentPlan, result);
    }

    // Return enhanced result with A2A context
    return {
      ...result,
      agentName,
      a2aMessagesCreated: this.messageQueue.filter(m => m.from === agentName).length,
      collaborationHistory: this.collaborationHistory.filter(c => c.requestingAgent === agentName),
    };
  }

  /**
   * Initiate collaboration between deep agents
   */
  private async initiateCollaboration(requestingAgent: string, plan: any, result: any): Promise<void> {
    console.log(`[DeepAgentOrchestrator] Initiating collaboration for ${requestingAgent}`);

    // Determine which agents to collaborate with based on plan context
    const targetAgents = this.determineCollaborationTargets(requestingAgent, plan, result);

    for (const targetAgent of targetAgents) {
      const message: DeepA2AMessage = {
        from: requestingAgent,
        to: targetAgent,
        messageType: 'request_collaboration',
        payload: {
          plan: plan,
          result: result,
          reason: `${requestingAgent} identified cross-domain issue requiring ${targetAgent} expertise`,
        },
        timestamp: new Date(),
        requiresResponse: true,
      };

      this.messageQueue.push(message);

      const collaboration: CollaborationRequest = {
        requestingAgent,
        targetAgent,
        reason: message.payload.reason,
        context: {
          plan,
          result,
        },
        plan: plan,
      };

      this.collaborationHistory.push(collaboration);

      console.log(`[DeepAgentOrchestrator] Collaboration request sent: ${requestingAgent} → ${targetAgent}`);
    }
  }

  /**
   * Determine which agents should collaborate based on context
   */
  private determineCollaborationTargets(requestingAgent: string, plan: any, result: any): string[] {
    const targets: string[] = [];

    // FinOps → TMO collaboration (budget impacts schedule)
    if (requestingAgent === 'deep-finops') {
      const hasScheduleImpact = result.steps?.some((step: any) =>
        step.result?.severity === 'critical' ||
        step.result?.alert?.includes('overrun')
      );
      if (hasScheduleImpact) {
        targets.push('deep-tmo');
      }

      // FinOps → Risk collaboration (financial risk)
      const hasHighRisk = result.steps?.some((step: any) =>
        step.result?.health === 'critical' ||
        step.result?.variance > 20
      );
      if (hasHighRisk) {
        targets.push('deep-risk');
      }
    }

    // TMO → Risk collaboration (schedule delays create risk)
    if (requestingAgent === 'deep-tmo') {
      const hasScheduleRisk = result.steps?.some((step: any) =>
        step.result?.status === 'delayed' ||
        step.result?.criticalPathImpact === true ||
        step.result?.slippage > 7 // More than 1 week
      );
      if (hasScheduleRisk) {
        targets.push('deep-risk');
      }

      // TMO → FinOps collaboration (schedule recovery may need budget)
      const needsAcceleration = result.steps?.some((step: any) =>
        step.result?.recommendation?.includes('fast-track') ||
        step.result?.recommendation?.includes('add resources')
      );
      if (needsAcceleration) {
        targets.push('deep-finops');
      }
    }

    // Risk → FinOps/TMO collaboration (high risks need mitigation planning)
    if (requestingAgent === 'deep-risk') {
      const hasFinancialRisk = result.steps?.some((step: any) =>
        step.result?.riskType === 'financial' ||
        step.result?.impactLevel === 'critical'
      );
      if (hasFinancialRisk) {
        targets.push('deep-finops');
      }

      const hasScheduleRisk = result.steps?.some((step: any) =>
        step.result?.riskType === 'schedule' ||
        step.result?.emergingRisks?.some((r: any) => r.type === 'schedule')
      );
      if (hasScheduleRisk) {
        targets.push('deep-tmo');
      }
    }

    // VRO → FinOps/Risk collaboration (value delivery issues)
    if (requestingAgent === 'deep-vro') {
      const hasValueConcerns = result.steps?.some((step: any) =>
        step.result?.overallStatus === 'critical' ||
        step.result?.overallStatus === 'at_risk' ||
        step.result?.businessCaseHealth === 'weak' ||
        step.result?.businessCaseHealth === 'negative'
      );
      if (hasValueConcerns) {
        targets.push('deep-finops'); // Financial optimization
        targets.push('deep-risk'); // Risk assessment
      }

      const hasStrategicMisalignment = result.steps?.some((step: any) =>
        step.result?.alignmentLevel === 'weak' ||
        step.result?.alignmentLevel === 'moderate'
      );
      if (hasStrategicMisalignment) {
        // Strategic issues may need broader collaboration
        targets.push('deep-risk');
      }
    }

    // FinOps/TMO/Risk → VRO collaboration (major issues impact value)
    if (['deep-finops', 'deep-tmo', 'deep-risk'].includes(requestingAgent)) {
      const hasMajorIssue = result.steps?.some((step: any) =>
        step.result?.severity === 'critical' ||
        step.result?.status === 'critical' ||
        step.result?.impactLevel === 'critical' ||
        step.result?.health === 'critical'
      );
      if (hasMajorIssue) {
        targets.push('deep-vro'); // Assess value impact
      }
    }

    return targets;
  }

  /**
   * Share agent reflections across the system
   * This enables organizational learning
   */
  async shareReflections(agentName: string): Promise<void> {
    const agent = this.deepAgents.get(agentName);
    if (!agent) return;

    const reflections = agent.getReflectionHistory();

    // Broadcast reflections to other agents
    for (const [otherAgentName, _] of this.deepAgents) {
      if (otherAgentName === agentName) continue;

      const message: DeepA2AMessage = {
        from: agentName,
        to: otherAgentName,
        messageType: 'share_reflection',
        payload: {
          reflections: reflections.map(r => ({
            action: r.action,
            success: r.success,
            learnings: r.learnings,
            adjustments: r.adjustments,
          })),
        },
        timestamp: new Date(),
        requiresResponse: false,
      };

      this.messageQueue.push(message);
    }

    console.log(`[DeepAgentOrchestrator] Shared ${reflections.length} reflections from ${agentName}`);
  }

  /**
   * Get pending A2A messages
   */
  getPendingMessages(forAgent?: string): DeepA2AMessage[] {
    if (forAgent) {
      return this.messageQueue.filter(m => m.to === forAgent);
    }
    return this.messageQueue;
  }

  /**
   * Process A2A message and respond
   */
  async processMessage(message: DeepA2AMessage): Promise<any> {
    const targetAgent = this.deepAgents.get(message.to);
    if (!targetAgent) {
      console.error(`[DeepAgentOrchestrator] Target agent not found: ${message.to}`);
      return null;
    }

    console.log(`[DeepAgentOrchestrator] Processing message: ${message.from} → ${message.to} (${message.messageType})`);

    switch (message.messageType) {
      case 'request_collaboration':
        // Target agent analyzes the requesting agent's findings
        const collaborationGoal = `Analyze findings from ${message.from} and provide complementary insights`;
        const collaborationResult = await targetAgent.run(collaborationGoal, {
          originatingAgent: message.from,
          originatingPlan: message.payload.plan,
          originatingResult: message.payload.result,
        });

        // Send response back
        const response: DeepA2AMessage = {
          from: message.to,
          to: message.from,
          messageType: 'share_insight',
          payload: {
            analysis: collaborationResult,
            recommendations: "See detailed plan and reflections",
          },
          timestamp: new Date(),
          requiresResponse: false,
        };
        this.messageQueue.push(response);

        return collaborationResult;

      case 'share_reflection':
        // Agent learns from other agent's reflections
        console.log(`[DeepAgentOrchestrator] ${message.to} received reflections from ${message.from}`);
        // Store for future context
        return { acknowledged: true };

      default:
        console.warn(`[DeepAgentOrchestrator] Unknown message type: ${message.messageType}`);
        return null;
    }
  }

  /**
   * Get collaboration statistics
   */
  getCollaborationStats() {
    return {
      totalMessages: this.messageQueue.length,
      totalCollaborations: this.collaborationHistory.length,
      messagesByType: this.messageQueue.reduce((acc, msg) => {
        acc[msg.messageType] = (acc[msg.messageType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      collaborationsByAgent: this.collaborationHistory.reduce((acc, collab) => {
        acc[collab.requestingAgent] = (acc[collab.requestingAgent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Clear message queue (after processing)
   */
  clearMessages() {
    this.messageQueue = [];
  }

  /**
   * Get all registered deep agents
   */
  getDeepAgents(): string[] {
    return Array.from(this.deepAgents.keys());
  }
}
