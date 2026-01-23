import { FinOpsAgent } from './FinOpsAgent.js';
import { TMOAgent } from './TMOAgent.js';
import { RiskAgent } from './RiskAgent.js';
import { GovernanceAgent, PlanningAgent, OCMAgent, IntegratedMgmtAgent } from './AllAgents.js';
import type { IStorage } from '../storage.js';

/**
 * AgentScheduler - Replaces the simulation system
 *
 * CRITICAL DIFFERENCE FROM SIMULATION:
 * - Simulation: Generated fake data every 12 seconds
 * - AgentScheduler: Runs intelligent agents on schedules to monitor REAL data
 *
 * This scheduler:
 * 1. Runs agents at appropriate intervals (not every 12 seconds!)
 * 2. Agents query real project data via OBDA/ontology
 * 3. Agents create interventions ONLY when real problems are detected
 * 4. Full LangSmith tracing for observability
 */
export class AgentScheduler {
  private agents: Map<string, any>;
  private scheduledJobs: Map<string, NodeJS.Timeout>;
  private storage: IStorage;
  private isRunning: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.agents = new Map();
    this.scheduledJobs = new Map();

    // Initialize all 7 agents
    this.initializeAgents();
  }

  /**
   * Initialize all agents with proper configuration
   */
  private initializeAgents() {
    console.log('[AgentScheduler] Initializing LangChain agents...');

    try {
      // Full autonomy agents (can self-approve interventions)
      this.agents.set('finops', new FinOpsAgent(this.storage));
      this.agents.set('tmo', new TMOAgent(this.storage));
      this.agents.set('ocm', new OCMAgent(this.storage));
      this.agents.set('integrated', new IntegratedMgmtAgent(this.storage));

      // Supervised agents (require human approval)
      this.agents.set('risk', new RiskAgent(this.storage));
      this.agents.set('governance', new GovernanceAgent(this.storage));
      this.agents.set('planning', new PlanningAgent(this.storage));

      console.log(`[AgentScheduler] Initialized ${this.agents.size} agents`);

      // Log agent configurations
      for (const [id, agent] of this.agents.entries()) {
        const config = agent.getConfig();
        console.log(`  - ${config.agentName} (${config.autonomy} autonomy)`);
      }
    } catch (error) {
      console.error('[AgentScheduler] Failed to initialize agents:', error);
      throw error;
    }
  }

  /**
   * Start all agent scheduled scans
   *
   * IMPORTANT: These intervals are much longer than the old 12-second simulation!
   * Agents run at appropriate intervals based on their domain:
   * - Financial: Every 30 minutes (not real-time, budget changes are slower)
   * - Schedule: Every 20 minutes (sprint/timeline monitoring)
   * - Risk: Every 60 minutes (risk assessment is strategic)
   * - Quality: Every 45 minutes (test results don't change constantly)
   * - Governance: Every 2 hours (compliance checks are periodic)
   */
  async startAll() {
    if (this.isRunning) {
      console.log('[AgentScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[AgentScheduler] Starting all agents with production schedules...');

    // FinOps Agent: Every 30 minutes
    this.schedule('finops', 30 * 60 * 1000, async () => {
      const agent = this.agents.get('finops') as FinOpsAgent;
      await agent.runScheduledScan();
    });

    // TMO Agent: Every 20 minutes
    this.schedule('tmo', 20 * 60 * 1000, async () => {
      const agent = this.agents.get('tmo') as TMOAgent;
      await agent.runScheduledScan();
    });

    // Risk Agent: Every 60 minutes
    this.schedule('risk', 60 * 60 * 1000, async () => {
      const agent = this.agents.get('risk') as RiskAgent;
      await agent.runScheduledScan();
    });

    // Governance Agent: Every 2 hours
    this.schedule('governance', 120 * 60 * 1000, async () => {
      const agent = this.agents.get('governance') as GovernanceAgent;
      await agent.runScheduledScan();
    });

    // Planning Agent: Every 30 minutes
    this.schedule('planning', 30 * 60 * 1000, async () => {
      const agent = this.agents.get('planning') as PlanningAgent;
      await agent.runScheduledScan();
    });

    // OCM Agent: Every 45 minutes
    this.schedule('ocm', 45 * 60 * 1000, async () => {
      const agent = this.agents.get('ocm') as OCMAgent;
      await agent.runScheduledScan();
    });

    // Integrated Management Agent: Every 45 minutes
    this.schedule('integrated', 45 * 60 * 1000, async () => {
      const agent = this.agents.get('integrated') as IntegratedMgmtAgent;
      await agent.runScheduledScan();
    });

    console.log('[AgentScheduler] ✅ All agents scheduled and running');
    console.log('[AgentScheduler] 🎯 NO MORE FAKE DATA - Agents monitor real projects');

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

    const config = agent.getConfig();
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
    const criticalAgents = ['finops', 'tmo', 'risk'];

    for (const agentId of criticalAgents) {
      const agent = this.agents.get(agentId);
      if (agent && typeof agent.runScheduledScan === 'function') {
        try {
          console.log(`[AgentScheduler] Initial scan: ${agent.getConfig().agentName}...`);
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
   * Stop all agents
   */
  stopAll() {
    console.log('[AgentScheduler] Stopping all agents...');

    for (const [agentId, job] of this.scheduledJobs.entries()) {
      clearInterval(job);
      console.log(`[AgentScheduler] Stopped ${agentId}`);
    }

    this.scheduledJobs.clear();
    this.isRunning = false;

    console.log('[AgentScheduler] All agents stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      agentCount: this.agents.size,
      scheduledJobs: this.scheduledJobs.size,
      agents: Array.from(this.agents.keys()),
    };
  }
}

// Export singleton instance (will be initialized in server/index.ts)
export function createAgentScheduler(storage: IStorage): AgentScheduler {
  return new AgentScheduler(storage);
}
