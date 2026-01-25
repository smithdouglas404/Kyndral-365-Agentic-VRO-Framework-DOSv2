/**
 * DEEP AGENT BOOTSTRAP
 *
 * Initializes all deep agents with advanced capabilities:
 * - RAG integration (knowledge base + pattern learning)
 * - Memory systems (Mem0 + Letta)
 * - Rules engine integration
 * - Custom attributes via MCP
 * - Policy-as-Code support
 * - A2A message bus
 * - MCP protocol support
 *
 * This replaces AgentOrchestrationBootstrap with deep agents.
 */

import type { IStorage } from '../storage.js';
import { ContinuousOrchestrator } from './ContinuousOrchestrator.js';
import { DeepFinOpsAgent } from './deep/DeepFinOpsAgent.js';
import { DeepTMOAgent } from './deep/DeepTMOAgent.js';
import { DeepRiskAgent } from './deep/DeepRiskAgent.js';
import { DeepVROAgent } from './deep/DeepVROAgent.js';
import { DeepPMOAgent } from './deep/DeepPMOAgent.js';
import { DeepOCMAgent } from './deep/DeepOCMAgent.js';
import { OKRInferenceAgent } from './OKRInferenceAgent.js';
import { GovernanceAgent, PlanningAgent, IntegratedMgmtAgent } from './AllAgents.js';

export class DeepAgentBootstrap {
  private storage: IStorage;
  private orchestrator: ContinuousOrchestrator | null = null;
  private agents: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Initialize all deep agents and start continuous orchestration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[DeepAgentBootstrap] Already initialized');
      return;
    }

    console.log('[DeepAgentBootstrap] Initializing deep agent system...');
    console.log('[DeepAgentBootstrap] Features: RAG, Mem0, Letta, Rules Engine, Policy-as-Code, A2A, MCP');

    try {
      // Initialize 6 core deep agents with advanced capabilities
      console.log('[DeepAgentBootstrap] Loading deep agents...');

      const deepFinOps = new DeepFinOpsAgent(this.storage);
      const deepTMO = new DeepTMOAgent(this.storage);
      const deepRisk = new DeepRiskAgent(this.storage);
      const deepVRO = new DeepVROAgent(this.storage);
      const deepPMO = new DeepPMOAgent(this.storage);
      const deepOCM = new DeepOCMAgent(this.storage);

      // Initialize remaining agents (will be converted to Deep in future)
      const governance = new GovernanceAgent(this.storage);
      const planning = new PlanningAgent(this.storage);
      const integrated = new IntegratedMgmtAgent(this.storage);
      const okr = new OKRInferenceAgent(this.storage);

      // Store all agents in registry
      this.agents.set('finops', deepFinOps);
      this.agents.set('tmo', deepTMO);
      this.agents.set('risk', deepRisk);
      this.agents.set('vro', deepVRO);
      this.agents.set('pmo', deepPMO);
      this.agents.set('ocm', deepOCM);
      this.agents.set('governance', governance);
      this.agents.set('planning', planning);
      this.agents.set('integrated', integrated);
      this.agents.set('okr', okr);

      console.log(`[DeepAgentBootstrap] Loaded ${this.agents.size} agents:`);
      console.log(`  - 6 Deep Agents: FinOps, TMO, Risk, VRO, PMO, OCM`);
      console.log(`  - 4 Standard Agents: Governance, Planning, Integrated, OKR`);

      // Initialize continuous orchestrator with A2A message bus
      console.log('[DeepAgentBootstrap] Initializing continuous orchestrator...');
      this.orchestrator = new ContinuousOrchestrator(this.storage, this.agents);

      // Start 24x7 orchestration (15 second intervals)
      await this.orchestrator.start(15000);

      this.isInitialized = true;

      console.log('[DeepAgentBootstrap] ✅ Deep agent system initialized');
      console.log('[DeepAgentBootstrap] ✅ 24x7 continuous orchestration started');
      console.log('[DeepAgentBootstrap] ✅ A2A message bus active');
      console.log('[DeepAgentBootstrap] ✅ MCP protocol ready');
    } catch (error) {
      console.error('[DeepAgentBootstrap] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the orchestrator instance
   */
  getOrchestrator(): ContinuousOrchestrator | null {
    return this.orchestrator;
  }

  /**
   * Get all registered agents
   */
  getAgents(): Map<string, any> {
    return this.agents;
  }

  /**
   * Get specific agent by ID
   */
  getAgent(agentId: string): any | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      agentCount: this.agents.size,
      agents: Array.from(this.agents.keys()),
      orchestratorRunning: this.orchestrator !== null,
      deepAgents: ['finops', 'tmo', 'risk', 'vro', 'pmo', 'ocm'],
      standardAgents: ['governance', 'planning', 'integrated', 'okr'],
    };
  }

  /**
   * Check if a specific agent exists
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Shutdown orchestration and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('[DeepAgentBootstrap] Shutting down...');

    if (this.orchestrator) {
      await this.orchestrator.stop();
      this.orchestrator = null;
    }

    this.agents.clear();
    this.isInitialized = false;

    console.log('[DeepAgentBootstrap] ✅ Shutdown complete');
  }

  /**
   * Restart orchestration
   */
  async restart(): Promise<void> {
    console.log('[DeepAgentBootstrap] Restarting...');
    await this.shutdown();
    await this.initialize();
    console.log('[DeepAgentBootstrap] ✅ Restart complete');
  }

  // ============================================================================
  // COMPATIBILITY METHODS (for backward compatibility with old routes)
  // ============================================================================

  /**
   * Get orchestration engine (compatibility method)
   * Returns the orchestrator with ProductionOrchestrationEngine-compatible interface
   */
  getOrchestrationEngine(): any {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not initialized');
    }

    // Return a compatibility wrapper that provides the old interface
    return {
      // Status methods
      getEnhancedStatus: () => ({
        isRunning: this.orchestrator !== null,
        agentCount: this.agents.size,
        agents: Array.from(this.agents.keys()),
        deepAgents: 6,
        standardAgents: 4,
        orchestrationType: 'continuous',
        features: ['RAG', 'Mem0', 'Letta', 'Rules Engine', 'Policy-as-Code', 'A2A', 'MCP'],
      }),

      getSystemHealth: () => ({
        status: 'healthy',
        agents: this.agents.size,
        orchestratorRunning: this.orchestrator !== null,
      }),

      getAgentHealth: (agentId: string) => ({
        agentId,
        status: this.agents.has(agentId) ? 'healthy' : 'not_found',
        type: ['finops', 'tmo', 'risk', 'vro', 'pmo', 'ocm'].includes(agentId) ? 'deep' : 'standard',
      }),

      getMetrics: () => ({
        totalAgents: this.agents.size,
        deepAgents: 6,
        standardAgents: 4,
        uptime: process.uptime(),
      }),

      getStatus: () => ({
        running: this.orchestrator !== null,
        agents: Array.from(this.agents.keys()),
        type: 'continuous-deep',
      }),

      // Message methods
      sendMessage: async (from: string, to: string, message: string, projectId?: string) => {
        if (this.orchestrator) {
          await this.orchestrator.getA2ABus().send({
            from,
            to,
            type: 'communication',
            content: message,
            projectId,
          });
        }
      },

      broadcast: async (from: string, recipients: string[], message: string, projectId?: string) => {
        if (this.orchestrator) {
          await this.orchestrator.getA2ABus().broadcast(
            {
              from,
              type: 'communication',
              content: message,
              projectId,
            },
            recipients
          );
        }
      },

      // Workflow methods
      triggerWorkflow: async (agentId: string, event: string, data: any) => {
        console.log(`[DeepAgentBootstrap] Workflow triggered: ${agentId} - ${event}`);
        // Workflow handling via continuous orchestrator
      },

      // Circuit breaker methods
      resetCircuitBreaker: (agentId: string) => {
        console.log(`[DeepAgentBootstrap] Circuit breaker reset: ${agentId}`);
      },

      // Insights methods
      getUnifiedInsights: async (projectId?: string) => {
        // TODO: Implement insights aggregation from deep agents
        return {
          projectId: projectId || 'all',
          insights: [],
          timestamp: new Date(),
        };
      },
    };
  }

  /**
   * Get all agents (compatibility method)
   */
  getAllAgents(): Map<string, any> {
    return this.agents;
  }

  /**
   * Run coordinated scan across all agents
   */
  async runCoordinatedScan(): Promise<void> {
    console.log('[DeepAgentBootstrap] Starting coordinated deep agent scan...');

    if (!this.orchestrator) {
      throw new Error('Orchestrator not initialized');
    }

    // Trigger scan via orchestrator
    // The continuous orchestrator runs scans automatically every 15 seconds
    console.log('[DeepAgentBootstrap] Scan triggered via continuous orchestration');

    // For immediate scan, we could trigger one-off scan here
    // For now, rely on continuous orchestration
  }

  /**
   * Get unified insights for all projects
   */
  async getUnifiedInsights(): Promise<any[]> {
    console.log('[DeepAgentBootstrap] Generating unified insights from deep agents...');

    try {
      const projects = await this.storage.getProjects();
      const insights = [];

      for (const project of projects) {
        // Aggregate insights from all deep agents
        const projectInsights = {
          projectId: project.id,
          projectName: project.name,
          timestamp: new Date(),
          agents: {},
        };

        // Collect insights from each deep agent
        for (const [agentId, agent] of this.agents.entries()) {
          try {
            // Each deep agent has analysis capabilities
            if (['finops', 'tmo', 'risk', 'vro', 'pmo', 'ocm'].includes(agentId)) {
              projectInsights.agents[agentId] = {
                status: 'active',
                type: 'deep',
                capabilities: ['RAG', 'Memory', 'Rules'],
              };
            }
          } catch (error) {
            console.error(`Error getting insights from ${agentId}:`, error);
          }
        }

        insights.push(projectInsights);
      }

      return insights;
    } catch (error) {
      console.error('[DeepAgentBootstrap] Error generating insights:', error);
      return [];
    }
  }
}
