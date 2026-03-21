// 🔄 MIGRATED TO DEEP AGENTS (2026-01-27) - ALL AGENTS NOW DEEP
// 🔄 MIGRATED TO DATABASE-DRIVEN (2026-03-02) - Agents loaded from database
// 🔄 MIGRATED TO GENERIC AGENTS (2026-03-02) - New agents use GenericDeepAgent
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
import { createGenericAgent } from './deep/GenericDeepAgent.js';
import { ContinuousOrchestrator } from './ContinuousOrchestrator.js';
import { getAgentRegistry, type AgentDefinition } from '../services/AgentRegistryService.js';
import type { IStorage } from '../storage.js';

/**
 * AGENT CLASS REGISTRY - CUSTOM IMPLEMENTATIONS ONLY
 *
 * Maps agent IDs to custom implementation classes.
 * Only add agents here if they need specialized logic that GenericDeepAgent can't handle.
 *
 * For most agents: Just add to database via Admin UI - they'll use GenericDeepAgent automatically!
 *
 * Only use custom classes for:
 * - Complex domain-specific logic
 * - Custom integrations that need specialized code
 * - Agents with unique execution patterns
 */
const CUSTOM_AGENT_CLASSES: Record<string, new (storage: IStorage) => any> = {
  'finops': DeepFinOpsAgent,
  'tmo': DeepTMOAgent,
  'risk': DeepRiskAgent,
  'vro': DeepVROAgent,
  'pmo': DeepPMOAgent,
  'ocm': DeepOCMAgent,
  'governance': DeepGovernanceAgent,
  'planning': DeepPlanningAgent,
  'integrated': DeepIntegratedMgmtAgent,
  'okr': DeepOKRInferenceAgent,
  'okr-inference': DeepOKRInferenceAgent, // Alias for compatibility
  'notification': DeepNotificationAgent,
};

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

  private agentsInitialized: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.agents = new Map();
    this.scheduledJobs = new Map();
    this.orchestrator = null;

    // Agents will be initialized asynchronously when startAll() is called
    // This ensures database is ready before loading agent configurations
    console.log('[AgentScheduler] Created - agents will be loaded from database on start');
  }

  /**
   * Initialize agents and orchestrator (called from startAll)
   */
  private async initialize(): Promise<void> {
    if (this.agentsInitialized) return;

    await this.initializeAgentsFromDatabase();

    const bootstrap = (global as any).__deepAgentBootstrap;
    if (bootstrap?.getOrchestrator?.()) {
      this.orchestrator = bootstrap.getOrchestrator();
      console.log('[AgentScheduler] Using master orchestrator from DeepAgentBootstrap (single instance)');
    } else {
      this.orchestrator = new ContinuousOrchestrator(this.storage, this.agents);
      console.log('[AgentScheduler] Created fallback orchestrator (bootstrap not available)');
    }

    this.agentsInitialized = true;
  }

  /**
   * Initialize agents from database
   * 🔄 FULLY DATABASE-DRIVEN - All agents loaded from database
   *
   * Agent instantiation:
   * 1. If agent has a custom class in CUSTOM_AGENT_CLASSES → use custom class
   * 2. Otherwise → use GenericDeepAgent (works for any agent from database)
   *
   * To add a new agent: Just add to database via Admin UI!
   * No code changes needed unless you need specialized logic.
   */
  private async initializeAgentsFromDatabase(): Promise<void> {
    console.log('[AgentScheduler] Loading agents from database...');

    try {
      const registry = getAgentRegistry();
      const dbAgents = await registry.getEnabledAgents();

      console.log(`[AgentScheduler] Found ${dbAgents.length} enabled agents in database`);

      let customCount = 0;
      let genericCount = 0;

      for (const agentDef of dbAgents) {
        try {
          // Check if agent has a custom implementation
          const CustomAgentClass = CUSTOM_AGENT_CLASSES[agentDef.id];

          if (CustomAgentClass) {
            // Use custom implementation
            const agent = new CustomAgentClass(this.storage);
            this.agents.set(agentDef.id, agent);
            customCount++;
            console.log(`  ✓ ${agentDef.name} (${agentDef.id}) - custom class, priority ${agentDef.defaultPriority}`);
          } else {
            // Use GenericDeepAgent for all other agents
            const agent = createGenericAgent(this.storage, agentDef);
            this.agents.set(agentDef.id, agent);
            genericCount++;
            console.log(`  ✓ ${agentDef.name} (${agentDef.id}) - generic agent, priority ${agentDef.defaultPriority}`);
          }
        } catch (err) {
          console.error(`[AgentScheduler] Failed to instantiate ${agentDef.id}:`, err);
        }
      }

      console.log(`[AgentScheduler] Initialized ${this.agents.size} agents (${customCount} custom, ${genericCount} generic)`);
    } catch (error) {
      console.error('[AgentScheduler] Database load failed, falling back to defaults:', error);
      this.initializeDefaultAgents();
    }
  }

  /**
   * Fallback: Initialize custom agents if database fails
   * Used only if database is unavailable during startup
   * Only initializes agents with custom implementations
   */
  private initializeDefaultAgents() {
    console.log('[AgentScheduler] Initializing custom agents (fallback - database unavailable)...');

    // Only agents with custom implementations can be used as fallback
    // Generic agents require database definitions
    for (const [agentId, AgentClass] of Object.entries(CUSTOM_AGENT_CLASSES)) {
      try {
        this.agents.set(agentId, new AgentClass(this.storage));
        console.log(`  ✓ ${agentId}`);
      } catch (err) {
        console.error(`[AgentScheduler] Failed to instantiate ${agentId}:`, err);
      }
    }

    console.log(`[AgentScheduler] Initialized ${this.agents.size} fallback agents`);
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

    // Initialize agents from database first
    await this.initialize();

    this.isRunning = true;
    console.log('[AgentScheduler] Starting DUAL-MODE agent system...');
    console.log('[AgentScheduler] Mode 1: 24x7 Continuous Coordination (A2A + MCP)');
    console.log('[AgentScheduler] Mode 2: Scheduled Deep Scans');

    // Continuous orchestration is started by DeepAgentBootstrap — skip here to avoid duplicate instances
    console.log('[AgentScheduler] Continuous orchestration deferred to DeepAgentBootstrap (single instance)');

    // Start Mode 2: Scheduled deep scans - ONLY if orchestrator is enabled
    // This respects the admin setting to turn off all agent activity
    try {
      const { getOrchestratorSettings } = await import('../lib/OrchestratorSettings.js');
      const schedulerSettings = await getOrchestratorSettings();
      
      if (!schedulerSettings.enabled) {
        console.log('[AgentScheduler] ⚠️  Scheduled deep scans OFF - respecting admin setting');
        console.log('[AgentScheduler] 💡 Enable via Admin > Settings > Orchestrator');
        console.log('[AgentScheduler] Agents initialized but NOT running automatic scans');
        return; // Don't schedule any scans
      }
      
      console.log('[AgentScheduler] ✅ Orchestrator enabled - scheduling deep scans');
    } catch (e) {
      console.log('[AgentScheduler] ⚠️  Could not load settings, defaulting to OFF for safety');
      return; // Default to OFF if settings can't be loaded
    }

    // Schedule all loaded agents based on their priority
    // Priority determines scan frequency: higher priority = more frequent scans
    // Priority 1-3: Every 20 minutes (critical)
    // Priority 4-6: Every 45 minutes (standard)
    // Priority 7-10: Every 90 minutes (low frequency)
    const registry = getAgentRegistry();
    const dbAgents = await registry.getEnabledAgents();

    for (const agentDef of dbAgents) {
      const agent = this.agents.get(agentDef.id);
      if (!agent || typeof agent.runScheduledScan !== 'function') continue;

      // Calculate interval based on priority (database-driven)
      const priority = agentDef.defaultPriority || 5;
      let intervalMs: number;
      if (priority <= 3) {
        intervalMs = 20 * 60 * 1000; // 20 minutes for high priority
      } else if (priority <= 6) {
        intervalMs = 45 * 60 * 1000; // 45 minutes for medium priority
      } else {
        intervalMs = 90 * 60 * 1000; // 90 minutes for low priority
      }

      this.schedule(agentDef.id, intervalMs, async () => {
        const agentInstance = this.agents.get(agentDef.id);
        if (agentInstance && typeof agentInstance.runScheduledScan === 'function') {
          await agentInstance.runScheduledScan();
        }
      });
    }

    console.log(`[AgentScheduler] ✅ ${this.agents.size} agents scheduled from database`);
    console.log('[AgentScheduler] 🎯 Database-driven agent configuration - Add agents via Admin UI');

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
   * Run initial scans for high-priority agents (optional)
   * This runs once at startup to populate initial insights
   * Only runs agents with priority 1-4 (critical agents)
   */
  private async runInitialScans() {
    const registry = getAgentRegistry();
    const dbAgents = await registry.getEnabledAgents();

    // Get high-priority agents (priority 1-4)
    const criticalAgents = dbAgents
      .filter(a => (a.defaultPriority || 5) <= 4)
      .map(a => a.id);

    console.log(`[AgentScheduler] Running initial scans for ${criticalAgents.length} high-priority agents...`);

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
