// 🔄 MIGRATED TO DEEP AGENTS (2026-01-27) - ALL AGENTS NOW DEEP
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
import { ContinuousOrchestrator } from './ContinuousOrchestrator.js';
import type { IStorage } from '../storage.js';

/**
 * AgentScheduler - Dual-Mode Agent System
 *
 * MODE 1: Continuous 24x7 Coordination (via ContinuousOrchestrator)
 * - Agents communicate via A2A (Agent-to-Agent) protocol every 15 seconds
 * - Real-time collaboration and cross-agent intelligence
 * - MCP protocol support for external service integration
 *
 * MODE 2: Scheduled Deep Scans (traditional scheduling)
 * - Periodic comprehensive analysis at domain-appropriate intervals
 * - Deeper analysis with full tool execution
 * - Complements continuous monitoring
 *
 * PROTOCOLS:
 * - A2A: Agent-to-Agent messaging for internal coordination
 * - MCP: Model Context Protocol for external services (Jira, Azure, etc.)
 *
 * This combines the best of:
 * - Old simulation (24x7 continuous coordination)
 * - LangChain agents (real intelligence, LangSmith observability)
 */
export class AgentScheduler {
  private agents: Map<string, any>;
  private scheduledJobs: Map<string, NodeJS.Timeout>;
  private storage: IStorage;
  private isRunning: boolean = false;
  private orchestrator: ContinuousOrchestrator | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.agents = new Map();
    this.scheduledJobs = new Map();

    // Initialize all 9 agents (7 PMO + 1 VRO + 1 Inference)
    this.initializeAgents();

    // Initialize continuous orchestrator with A2A and MCP support
    this.orchestrator = new ContinuousOrchestrator(this.storage, this.agents);
    console.log('[AgentScheduler] Continuous orchestrator initialized with A2A and MCP protocols');
  }

  /**
   * Initialize all agents with proper configuration
   * 🔄 ALL DEEP AGENTS - RAG, Mem0, Letta, Rules Engine, Policy-as-Code, Planning, Reflection
   */
  private initializeAgents() {
    console.log('[AgentScheduler] Initializing ALL Deep LangChain agents...');

    try {
      // ALL DEEP AGENTS - Full autonomy + advanced capabilities
      this.agents.set('finops', new DeepFinOpsAgent(this.storage));
      this.agents.set('tmo', new DeepTMOAgent(this.storage));
      this.agents.set('risk', new DeepRiskAgent(this.storage));
      this.agents.set('vro', new DeepVROAgent(this.storage));
      this.agents.set('pmo', new DeepPMOAgent(this.storage));
      this.agents.set('ocm', new DeepOCMAgent(this.storage));
      this.agents.set('governance', new DeepGovernanceAgent(this.storage));
      this.agents.set('planning', new DeepPlanningAgent(this.storage));
      this.agents.set('integrated', new DeepIntegratedMgmtAgent(this.storage));
      this.agents.set('okr-inference', new DeepOKRInferenceAgent(this.storage));

      console.log(`[AgentScheduler] Initialized ${this.agents.size} Deep agents with planning and reflection`);

      // Log agent configurations
      for (const [id, agent] of Array.from(this.agents.entries())) {
        const config = agent.config || { agentName: id };
        console.log(`  - ${config.agentName || id}`);
      }
    } catch (error) {
      console.error('[AgentScheduler] Failed to initialize agents:', error);
      throw error;
    }
  }

  /**
   * Start all agent systems (continuous + scheduled)
   *
   * DUAL-MODE OPERATION:
   *
   * Mode 1: Continuous 24x7 Coordination (via ContinuousOrchestrator)
   * - Runs every 15 seconds
   * - Agents communicate via A2A protocol
   * - Real-time collaboration and alerts
   * - MCP integration for external services
   *
   * Mode 2: Scheduled Deep Scans (traditional scheduling)
   * - Financial: Every 30 minutes
   * - Schedule: Every 20 minutes
   * - Risk: Every 60 minutes
   * - Quality: Every 45 minutes
   * - Governance: Every 2 hours
   * - VRO: Every 60 minutes
   *
   * This gives us BOTH real-time coordination AND deep periodic analysis
   */
  async startAll() {
    if (this.isRunning) {
      console.log('[AgentScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[AgentScheduler] Starting DUAL-MODE agent system...');
    console.log('[AgentScheduler] Mode 1: 24x7 Continuous Coordination (A2A + MCP)');
    console.log('[AgentScheduler] Mode 2: Scheduled Deep Scans');

    // Start Mode 1: Continuous orchestration (every 15 seconds)
    if (this.orchestrator) {
      await this.orchestrator.start(15000); // 15 second intervals
      console.log('[AgentScheduler] ✅ Continuous orchestration started (15s interval)');
    }

    // Start Mode 2: Scheduled deep scans

    // FinOps Agent: Every 30 minutes
    this.schedule('finops', 30 * 60 * 1000, async () => {
      const agent = this.agents.get('finops');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // TMO Agent: Every 20 minutes
    this.schedule('tmo', 20 * 60 * 1000, async () => {
      const agent = this.agents.get('tmo');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // Risk Agent: Every 60 minutes
    this.schedule('risk', 60 * 60 * 1000, async () => {
      const agent = this.agents.get('risk');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // Governance Agent: Every 2 hours
    this.schedule('governance', 120 * 60 * 1000, async () => {
      const agent = this.agents.get('governance');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // Planning Agent: Every 30 minutes
    this.schedule('planning', 30 * 60 * 1000, async () => {
      const agent = this.agents.get('planning');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // OCM Agent: Every 45 minutes
    this.schedule('ocm', 45 * 60 * 1000, async () => {
      const agent = this.agents.get('ocm');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // Integrated Management Agent: Every 45 minutes
    this.schedule('integrated', 45 * 60 * 1000, async () => {
      const agent = this.agents.get('integrated');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // VRO Agent: Every 60 minutes (strategic value realization tracking)
    this.schedule('vro', 60 * 60 * 1000, async () => {
      const agent = this.agents.get('vro');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    // OKR Inference Agent: Every 2 hours (data quality assessment + OKR mapping)
    this.schedule('okr-inference', 120 * 60 * 1000, async () => {
      const agent = this.agents.get('okr-inference');
      if (agent && typeof agent.runScheduledScan === 'function') await agent.runScheduledScan();
    });

    console.log('[AgentScheduler] ✅ All 10 Deep agents scheduled and running');
    console.log('[AgentScheduler] 🎯 NO MORE FAKE DATA - All agents use real analysis with planning & reflection');

    // Run an initial scan immediately (optional - can remove if not desired)
    console.log('[AgentScheduler] Running initial scans...');
    await this.runInitialScans();
  }

  /**
   * Schedule an agent to run at intervals
   */
  private schedule(agentId: string, intervalMs: number, fn: () => Promise<void>) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`[AgentScheduler] Agent ${agentId} not found`);
      return;
    }

    const config = agent.getConfig?.() || { agentName: agentId };
    console.log(`[AgentScheduler] Scheduled ${config.agentName} to run every ${intervalMs / 1000 / 60} minutes`);

    const job = setInterval(async () => {
      try {
        console.log(`[AgentScheduler] Running ${config.agentName} scheduled scan...`);
        await fn();
      } catch (error) {
        console.error(`[AgentScheduler] Error in ${agentId} scan:`, error);
      }
    }, intervalMs);

    this.scheduledJobs.set(agentId, job);
  }

  /**
   * Run initial scans for all agents (optional)
   * This runs once at startup to populate initial insights
   */
  private async runInitialScans() {
    // Run only critical agents initially to avoid overwhelming the system
    const criticalAgents = ['finops', 'tmo', 'risk', 'vro', 'okr-inference'];

    for (const agentId of criticalAgents) {
      const agent = this.agents.get(agentId);
      if (agent && typeof agent.runScheduledScan === 'function') {
        try {
          const agentConfig = agent.getConfig?.() || { agentName: agentId };
          console.log(`[AgentScheduler] Initial scan: ${agentConfig.agentName}...`);
          await agent.runScheduledScan();
        } catch (error) {
          console.error(`[AgentScheduler] Initial scan error for ${agentId}:`, error);
        }
      }
    }

    console.log('[AgentScheduler] Initial scans complete');
  }

  /**
   * React to metric changes (real-time triggers)
   * This allows agents to respond immediately to critical metric breaches
   */
  async handleMetricUpdate(metric: any) {
    const { agentOwner, currentValue, threshold, metricKey, direction } = metric;

    const breached = this.isThresholdBreached(currentValue, threshold, direction);

    if (breached) {
      console.log(`[AgentScheduler] METRIC BREACH: ${metricKey} = ${currentValue} (threshold: ${threshold})`);

      const agent = this.agents.get(agentOwner);
      if (!agent) {
        console.warn(`[AgentScheduler] No agent found for ${agentOwner}`);
        return;
      }

      // Trigger immediate agent execution
      try {
        await agent.execute(
          `URGENT: Metric breach detected for ${metricKey}.
          Current value: ${currentValue}, Threshold: ${threshold}.
          Analyze the situation and recommend immediate action if necessary.`
        );
      } catch (error) {
        console.error(`[AgentScheduler] Metric response error for ${agentOwner}:`, error);
      }
    }
  }

  /**
   * Check if threshold is breached
   */
  private isThresholdBreached(value: string, threshold: string, direction: string): boolean {
    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold);

    if (isNaN(numValue) || isNaN(numThreshold)) {
      return false;
    }

    if (direction === 'higher_is_better') {
      return numValue < numThreshold;
    } else {
      return numValue > numThreshold;
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): any {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): any[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents Map (for direct access)
   */
  getAgentsMap(): Map<string, any> {
    return this.agents;
  }

  /**
   * Stop all agents (both modes)
   */
  stopAll() {
    console.log('[AgentScheduler] Stopping all agent systems...');

    // Stop continuous orchestration
    if (this.orchestrator) {
      this.orchestrator.stop();
      console.log('[AgentScheduler] Stopped continuous orchestration');
    }

    // Stop scheduled jobs
    for (const [agentId, job] of Array.from(this.scheduledJobs.entries())) {
      clearInterval(job);
      console.log(`[AgentScheduler] Stopped scheduled job: ${agentId}`);
    }

    this.scheduledJobs.clear();
    this.isRunning = false;

    console.log('[AgentScheduler] All agent systems stopped');
  }

  /**
   * Get scheduler status (both modes)
   */
  getStatus() {
    const orchestratorStatus = this.orchestrator?.getStatus() || null;

    return {
      isRunning: this.isRunning,
      agentCount: this.agents.size,
      scheduledJobs: this.scheduledJobs.size,
      agents: Array.from(this.agents.keys()),
      continuousOrchestration: orchestratorStatus,
    };
  }

  /**
   * Get continuous orchestrator
   */
  getOrchestrator(): ContinuousOrchestrator | null {
    return this.orchestrator;
  }

  /**
   * Agent calls MCP service (convenience method)
   */
  async agentCallMCPService(agentId: string, serviceName: string, action: string, params: any): Promise<any> {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not initialized');
    }
    return this.orchestrator.agentCallMCPService(agentId, serviceName, action, params);
  }

  /**
   * Broadcast alert to multiple agents (convenience method)
   */
  async broadcastAlert(fromAgentId: string, recipientIds: string[], alert: any): Promise<void> {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not initialized');
    }
    return this.orchestrator.broadcastAlert(fromAgentId, recipientIds, alert);
  }
}

// Export singleton instance (will be initialized in server/index.ts)
// Singleton instance to prevent memory leaks from creating multiple schedulers
let schedulerInstance: AgentScheduler | null = null;

export function createAgentScheduler(storage: IStorage): AgentScheduler {
  if (schedulerInstance) {
    console.log('[AgentScheduler] Returning existing singleton instance');
    return schedulerInstance;
  }

  console.log('[AgentScheduler] Creating new singleton instance');
  schedulerInstance = new AgentScheduler(storage);
  return schedulerInstance;
}

export function getAgentSchedulerInstance(): AgentScheduler | null {
  return schedulerInstance;
}
