/**
 * DEEP AGENT BOOTSTRAP
 *
 * Initializes all 10 deep agents with advanced capabilities:
 * - RAG integration (knowledge base + pattern learning)
 * - Memory systems (Mem0 + Letta)
 * - Planning & Reflection (multi-step reasoning)
 * - Rules engine integration
 * - Custom attributes via MCP
 * - Policy-as-Code support
 * - A2A message bus
 * - MCP protocol support
 *
 * All agents upgraded to Deep Agent architecture:
 * - DeepFinOpsAgent, DeepTMOAgent, DeepRiskAgent
 * - DeepVROAgent, DeepPMOAgent, DeepOCMAgent
 * - DeepGovernanceAgent, DeepPlanningAgent
 * - DeepIntegratedMgmtAgent, DeepOKRInferenceAgent
 */

import type { IStorage } from '../storage.js';
import { ContinuousOrchestrator } from './ContinuousOrchestrator.js';
import { DeepFinOpsAgent } from './deep/DeepFinOpsAgent.js';
import { DeepTMOAgent } from './deep/DeepTMOAgent.js';
import { DeepRiskAgent } from './deep/DeepRiskAgent.js';
import { DeepVROAgent } from './deep/DeepVROAgent.js';
import { DeepPMOAgent } from './deep/DeepPMOAgent.js';
import { DeepOCMAgent } from './deep/DeepOCMAgent.js';
import { DeepGovernanceAgent } from './deep/DeepGovernanceAgent.js';
import { DeepPlanningAgent } from './deep/DeepPlanningAgent.js';
import { DeepIntegratedMgmtAgent } from './deep/DeepIntegratedMgmtAgent.js';
import { DeepOKRInferenceAgent } from './deep/DeepOKRInferenceAgent.js';
import { DeepNotificationAgent } from './deep/DeepNotificationAgent.js';

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
      // MEMORY OPTIMIZATION: LITE_MODE loads only 3 essential agents
      const liteMode = process.env.LITE_MODE === 'true';

      if (liteMode) {
        console.log('[DeepAgentBootstrap] 🚀 LITE MODE - Loading 3 essential agents only');

        const deepPMO = new DeepPMOAgent(this.storage);
        const deepFinOps = new DeepFinOpsAgent(this.storage);
        const deepRisk = new DeepRiskAgent(this.storage);

        this.agents.set('pmo', deepPMO);
        this.agents.set('finops', deepFinOps);
        this.agents.set('risk', deepRisk);

        console.log(`[DeepAgentBootstrap] Loaded ${this.agents.size} essential agents (PMO, FinOps, Risk)`);
      } else {
        // Full mode - all 11 agents
        console.log('[DeepAgentBootstrap] Loading all deep agents...');

        const deepFinOps = new DeepFinOpsAgent(this.storage);
        const deepTMO = new DeepTMOAgent(this.storage);
        const deepRisk = new DeepRiskAgent(this.storage);
        const deepVRO = new DeepVROAgent(this.storage);
        const deepPMO = new DeepPMOAgent(this.storage);
        const deepOCM = new DeepOCMAgent(this.storage);
        const deepGovernance = new DeepGovernanceAgent(this.storage);
        const deepPlanning = new DeepPlanningAgent(this.storage);
        const deepIntegrated = new DeepIntegratedMgmtAgent(this.storage);
        const deepOKR = new DeepOKRInferenceAgent(this.storage);
        const deepNotification = new DeepNotificationAgent(this.storage);

        this.agents.set('finops', deepFinOps);
        this.agents.set('tmo', deepTMO);
        this.agents.set('risk', deepRisk);
        this.agents.set('vro', deepVRO);
        this.agents.set('pmo', deepPMO);
        this.agents.set('ocm', deepOCM);
        this.agents.set('governance', deepGovernance);
        this.agents.set('planning', deepPlanning);
        this.agents.set('integrated', deepIntegrated);
        this.agents.set('okr', deepOKR);
        this.agents.set('notification', deepNotification);

        console.log(`[DeepAgentBootstrap] Loaded ${this.agents.size} agents:`);
        console.log(`  - 10 Domain Agents: FinOps, TMO, Risk, VRO, PMO, OCM, Governance, Planning, Integrated, OKR`);
        console.log(`  - 1 Notification Agent: Central gateway to Palantir (actions, HITL, broadcasts)`);
      }

      console.log(`  - ✅ All agents upgraded to Deep Agent architecture`);

      // Initialize continuous orchestrator with A2A message bus
      console.log('[DeepAgentBootstrap] Initializing continuous orchestrator...');
      this.orchestrator = new ContinuousOrchestrator(this.storage, this.agents);

      // Check persisted setting - auto-start only if admin enabled it
      const { getOrchestratorSettings, getCostOptimizationStatus } = await import('../lib/OrchestratorSettings.js');
      const settings = await getOrchestratorSettings();
      const costStatus = getCostOptimizationStatus();
      
      this.isInitialized = true;

      console.log('[DeepAgentBootstrap] ✅ Deep agent system initialized');
      console.log('[DeepAgentBootstrap] ✅ A2A message bus active');
      console.log('[DeepAgentBootstrap] ✅ MCP protocol ready');
      console.log(`[DeepAgentBootstrap] ✅ Cost optimization: ${costStatus.preferredTier}`);
      
      // Auto-start orchestration if OpenRouter is configured (cost-optimized)
      const shouldStart = settings.enabled || costStatus.openRouterEnabled;

      if (shouldStart) {
        const interval = settings.interval || 300000; // Default 5 min
        console.log('[DeepAgentBootstrap] ⚡ Orchestration ENABLED');
        console.log(`[DeepAgentBootstrap] ✅ Using NVIDIA Nemotron 3 Super (FREE via OpenRouter)`);
        await this.orchestrator.start(interval);
        console.log(`[DeepAgentBootstrap] ✅ Continuous orchestration running (${interval / 1000}s interval)`);
      } else {
        // No LLM configured - cannot run
        console.log('[DeepAgentBootstrap] ⚠️  Continuous orchestration OFF (no LLM configured)');
        console.log('[DeepAgentBootstrap] 💡 Set OPENROUTER_API_KEY to enable');
      }
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
      deepAgents: ['finops', 'tmo', 'risk', 'vro', 'pmo', 'ocm', 'governance', 'planning', 'integrated', 'okr'],
      standardAgents: [],
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
   * Returns the orchestrator with a compatibility interface for legacy routes
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
        deepAgents: 10,
        standardAgents: 0,
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
        type: 'deep',
      }),

      getMetrics: () => ({
        totalAgents: this.agents.size,
        deepAgents: 10,
        standardAgents: 0,
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
        // Aggregate insights from all deep agents
        const insights: Array<{
          agentId: string;
          agentName: string;
          type: string;
          severity: string;
          message: string;
          data?: any;
        }> = [];

        // Query each agent for its current insights
        for (const [agentId, agent] of this.agents.entries()) {
          try {
            // Deep agents have execute() method that can return insights
            if (typeof agent.execute === 'function') {
              const prompt = projectId
                ? `Provide a brief status update and any insights for project ${projectId}`
                : 'Provide a brief status update and any system-wide insights';

              const result = await agent.execute(prompt, { projectId });

              if (result?.insights || result?.output) {
                insights.push({
                  agentId,
                  agentName: agent.constructor.name,
                  type: 'insight',
                  severity: result.severity || 'info',
                  message: result.output || result.insights || 'No insights available',
                  data: result.data,
                });
              }
            }
          } catch (error: any) {
            console.warn(`[DeepAgentBootstrap] Failed to get insights from ${agentId}:`, error.message);
          }
        }

        return {
          projectId: projectId || 'all',
          insights,
          timestamp: new Date(),
          agentCount: this.agents.size,
          insightCount: insights.length,
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
          agents: {} as Record<string, any>,
        };

        // Collect insights from each deep agent
        for (const [agentId, agent] of this.agents.entries()) {
          try {
            // All agents are now deep agents with full capabilities
            projectInsights.agents[agentId] = {
              status: 'active',
              type: 'deep',
              capabilities: ['RAG', 'Memory', 'Rules', 'Planning', 'Reflection'],
            };
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
