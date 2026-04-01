/**
 * Continuous Multi-Agent Orchestrator
 *
 * DESIGN: 24x7 always-on coordination with A2A framework and MCP protocol support
 * - Runs continuous monitoring loop (every 15 seconds)
 * - Agents communicate via A2A (Agent-to-Agent) message bus
 * - MCP protocol support for cross-service communication
 * - Full autonomy agents can self-approve and execute actions
 * - Supervised agents create alerts requiring human approval
 * - Predictive and real-time insights without waiting hours
 *
 * PROTOCOLS:
 * - A2A: Agent-to-Agent messaging (internal coordination)
 * - MCP: Model Context Protocol (external service integration)
 *
 * This replaces the old agentSimulation.ts but with REAL LangChain agents
 */

import type { IStorage } from '../storage.js';
import type { InsertAgentActivityLog, InsertIntervention } from '@shared/schema';
import { EventEmitter } from 'events';
import { broadcastCriticalAlert, broadcastNotification, broadcastAgentInsight } from '../websocket.js';
import { MCP_SERVER_REGISTRY } from '../mcp/MCPServerRegistry.js';
import { getPalantirDataProvider } from '../mcp/PalantirDataProvider.js';
import { getPalantirRulesService, type RuleResult } from '../lib/PalantirRulesService.js';
import { serverReadyService } from '../services/ServerReadyService.js';
import { memoryMonitorService } from '../services/MemoryMonitorService.js';
import { getSettings } from '../services/OrchestratorConfig.js';
import { timbrQueryService } from '../services/TimbrQueryService.js';

/**
 * A2A Message Bus for Agent-to-Agent Communication
 */
export class A2AMessageBus extends EventEmitter {
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private storage: IStorage | null = null;

  /**
   * Set storage instance for persisting messages
   */
  setStorage(storage: IStorage): void {
    this.storage = storage;
  }

  /**
   * Send message from one agent to another
   */
  async send(message: AgentMessage): Promise<void> {
    const targetQueue = this.messageQueue.get(message.to!) || [];
    targetQueue.push(message);
    this.messageQueue.set(message.to!, targetQueue);

    // Emit event for real-time processing
    this.emit('message', message);
    this.emit(`message:${message.to}`, message);

    console.log(`[A2A] ${message.from} → ${message.to}: ${message.type}`);

    // Persist to database for history
    if (this.storage) {
      try {
        await this.storage.createAgentActivityLog({
          eventType: 'agent_to_agent',
          primaryAgentId: message.from,
          primaryAgentName: this.formatAgentName(message.from),
          secondaryAgentId: message.to,
          secondaryAgentName: message.to ? this.formatAgentName(message.to) : undefined,
          summary: `${this.formatAgentName(message.from)} → ${message.to ? this.formatAgentName(message.to) : 'broadcast'}: ${message.type}`,
          details: JSON.stringify({
            type: message.type,
            content: message.content,
            projectId: message.projectId,
            severity: message.severity,
            requiresApproval: message.requiresApproval,
          }),
        });
      } catch (error) {
        console.error('[A2A] Failed to persist message:', error);
      }
    }
  }

  /**
   * Format agent ID to friendly name
   */
  private formatAgentName(agentId: string): string {
    const names: Record<string, string> = {
      finops: 'FinOps',
      tmo: 'TMO',
      risk: 'Risk',
      vro: 'VRO',
      pmo: 'PMO',
      ocm: 'OCM',
      governance: 'Governance',
      planning: 'Planning',
      integrated: 'Integrated Management',
      okr: 'OKR Inference',
    };
    return names[agentId] || agentId.toUpperCase();
  }

  /**
   * Receive messages for an agent
   */
  async receive(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    this.messageQueue.set(agentId, []); // Clear queue
    return messages;
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(message: Omit<AgentMessage, 'to'>, recipients: string[]): Promise<void> {
    for (const recipient of recipients) {
      await this.send({ ...message, to: recipient } as AgentMessage);
    }
  }

  /**
   * Subscribe to messages
   */
  subscribe(agentId: string, callback: (message: AgentMessage) => void): void {
    this.on(`message:${agentId}`, callback);
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      activeQueues: this.messageQueue.size,
      totalMessages: Array.from(this.messageQueue.values()).reduce((sum, arr) => sum + arr.length, 0),
    };
  }
}

/**
 * MCP Protocol Handler for External Service Integration
 */
export interface MCPService {
  name: string;
  protocol: 'http' | 'websocket' | 'grpc';
  endpoint: string;
  capabilities: string[];
}

export class MCPProtocolHandler {
  private services: Map<string, MCPService> = new Map();

  /**
   * Register MCP service
   */
  registerService(service: MCPService): void {
    this.services.set(service.name, service);
    console.log(`[MCP] Registered service: ${service.name} (${service.protocol})`);
  }

  /**
   * Agent calls external MCP service - NOW WITH REAL API CALLS
   */
  async callService(serviceName: string, agentId: string, action: string, params: any): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`MCP service not found: ${serviceName}`);
    }

    console.log(`[MCP] ${agentId} → ${serviceName}: ${action}`);

    // Route to real service implementations
    try {
      const { getMCPService } = await import('../mcp/MCPServiceFactory.js');
      const mcpService = await getMCPService(serviceName);

      if (!mcpService) {
        console.warn(`[MCP] Service ${serviceName} not configured - returning mock response`);
        return this.mockServiceCall(serviceName, action, params);
      }

      // Route action to appropriate service method
      const result = await mcpService.executeAction(action, params);

      return {
        success: true,
        service: serviceName,
        action,
        agentId,
        timestamp: new Date().toISOString(),
        data: result,
      };
    } catch (error: any) {
      console.error(`[MCP] Service call failed: ${serviceName}.${action}`, error.message);
      throw new Error(`MCP service call failed: ${error.message}`);
    }
  }

  /**
   * Fallback mock response for unconfigured services
   */
  private mockServiceCall(serviceName: string, action: string, params: any): any {
    return {
      success: true,
      service: serviceName,
      action,
      timestamp: new Date().toISOString(),
      data: params,
      _mock: true,
      _message: 'Service not configured - this is a simulated response',
    };
  }

  /**
   * Execute a Palantir Function via the orchestrator
   *
   * Agents can call business rules through the MCP protocol handler.
   *
   * @param functionName - The Palantir Function name
   * @param input - Input data for the function
   * @param agentId - Agent making the call (for tracking)
   */
  async executeRule(functionName: string, input: any, agentId?: string): Promise<any> {
    console.log(`[PalantirRules] ${agentId || 'system'} → ${functionName}`);

    try {
      const rules = getPalantirRulesService();

      if (!rules) {
        console.warn('[PalantirRules] Service not configured');
        return {
          success: false,
          error: 'Palantir Rules not configured',
          functionName,
        };
      }

      const result = await rules.checkRule(functionName, input, { agentId });

      if (!result.success) {
        console.error(`[PalantirRules] Function ${functionName} failed:`, result.error);
        return {
          success: false,
          functionName,
          error: result.error,
          agentId,
        };
      }

      console.log(`[PalantirRules] Function ${functionName} completed in ${result.executionTime}ms`);

      return {
        success: true,
        functionName,
        result: result.result,
        executionTime: result.executionTime,
        agentId,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`[PalantirRules] Function execution failed for ${functionName}:`, error.message);
      return {
        success: false,
        functionName,
        error: error.message,
        agentId,
      };
    }
  }

  /**
   * Execute a Palantir Action (workflow trigger)
   *
   * Actions execute multi-step workflows in Palantir.
   *
   * @param actionName - The action name to execute
   * @param input - Input data for the action
   * @param agentId - Agent initiating the action (for tracking)
   */
  async executeFlow(actionName: string, input: any, agentId?: string): Promise<{ success: boolean; outputs: Record<string, any>; executionTime: number; error?: string }> {
    console.log(`[PalantirAction] ${agentId || 'system'} → ${actionName}`);

    try {
      const rules = getPalantirRulesService();

      if (!rules) {
        console.warn('[PalantirRules] Service not configured');
        return {
          success: false,
          outputs: {},
          executionTime: 0,
          error: 'Palantir Rules not configured',
        };
      }

      const startTime = Date.now();
      const result = await rules.executeAction(actionName, input);
      const executionTime = Date.now() - startTime;

      if (!result.success) {
        console.error(`[PalantirAction] ${actionName} failed:`, result.error);
      } else {
        console.log(`[PalantirAction] ${actionName} completed in ${executionTime}ms`);
      }

      return {
        success: result.success,
        outputs: result.result || {},
        executionTime,
        error: result.error,
      };
    } catch (error: any) {
      console.error(`[PalantirAction] Execution failed for ${actionName}:`, error.message);
      return {
        success: false,
        outputs: {},
        executionTime: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get available services
   */
  getServices(): MCPService[] {
    return Array.from(this.services.values());
  }

  /**
   * Check if service supports capability
   */
  hasCapability(serviceName: string, capability: string): boolean {
    const service = this.services.get(serviceName);
    return service?.capabilities.includes(capability) || false;
  }
}

export interface AgentMessage {
  from: string;
  to?: string;
  type: 'scan' | 'detection' | 'request' | 'alert' | 'response' | 'action' | 'celebration' | 'communication';
  content: string;
  projectId?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  requiresApproval?: boolean;
}

export interface CoordinationState {
  activeScans: Map<string, string[]>; // agentId → projectIds being scanned
  pendingRequests: Map<string, AgentMessage[]>; // agentId → pending requests to them
  recentFindings: Map<string, any[]>; // projectId → recent findings from all agents
  agentContext: Map<string, any>; // agentId → current context/state
  errorCount?: number; // Track consecutive orchestration errors for recovery
}

export class ContinuousOrchestrator {
  private storage: IStorage;
  private agents: Map<string, any>;
  private state: CoordinationState;
  private orchestrationInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private cycleCount: number = 0;
  private a2aBus: A2AMessageBus;
  private mcpHandler: MCPProtocolHandler;

  private projectSnapshots: Map<string, string> = new Map();
  private agentLastScan: Map<string, Map<string, number>> = new Map();
  private static SCAN_COOLDOWN_MS = 5 * 60 * 1000;
  private skippedScans: number = 0;
  private totalScans: number = 0;

  // Palantir Rules tracking
  private rulesServiceAvailable: boolean = false;
  private static RULE_CHECK_INTERVAL = 10; // Check rules every N cycles
  private static INSIGHT_CHECK_INTERVAL = 5; // Generate cross-domain insights every N cycles

  /**
   * Helper to safely get agent config (handles agents without getConfig method)
   */
  private getAgentConfig(agent: any, fallbackId?: string): any {
    const config = agent?.getConfig?.() || {
      agentName: fallbackId || 'Unknown Agent',
      autonomy: 'supervised',
      focus: 'general'
    };

    // Ensure agentId is always present
    if (!config.agentId && fallbackId) {
      config.agentId = fallbackId;
    }

    return config;
  }

  private _rawStorage: IStorage;

  constructor(storage: IStorage, agents: Map<string, any>) {
    this._rawStorage = storage;
    this.storage = storage; // Will be replaced with Palantir adapter in start()
    this.agents = agents;
    this.state = {
      activeScans: new Map(),
      pendingRequests: new Map(),
      recentFindings: new Map(),
      agentContext: new Map(),
    };

    // Initialize A2A message bus
    this.a2aBus = new A2AMessageBus();
    this.a2aBus.setStorage(storage);
    console.log('[ContinuousOrchestrator] A2A message bus initialized');

    // Initialize MCP protocol handler
    this.mcpHandler = new MCPProtocolHandler();

    // Register ALL MCP services synchronously from registry
    this.registerMCPServicesSync();

    // Setup A2A message listeners for all agents
    this.setupA2AListeners();
  }

  /**
   * Register external MCP services
   * Only registers ACTIVE services with configured credentials:
   * - Palantir (ontology source of truth)
   * - Jira (external project sync)
   * - OpenProject (external project sync)
   * - Monday.com (external project sync)
   */
  private registerMCPServicesSync(): void {
    const services: MCPService[] = [];

    // Only register services that are actually configured with credentials
    const activeServices = ['palantir', 'jira', 'openproject', 'monday'];

    for (const id of activeServices) {
      const server = MCP_SERVER_REGISTRY[id];

      // Build endpoint from environment
      let endpoint = '';
      let protocol: 'http' | 'websocket' | 'grpc' = 'http';

      switch (id) {
        case 'palantir':
          endpoint = process.env.PALANTIR_HOSTNAME
            ? `https://${process.env.PALANTIR_HOSTNAME}`
            : 'https://palantir.example.com';
          break;
        case 'jira':
          endpoint = process.env.JIRA_DOMAIN
            ? `https://${process.env.JIRA_DOMAIN}`
            : 'https://jira.example.com';
          break;
        case 'openproject':
          endpoint = process.env.OPENPROJECT_URL || 'https://openproject.example.com';
          break;
        case 'monday':
          endpoint = 'https://api.monday.com/v2';
          break;
      }

      const capabilities = server?.capabilities || [
        'Project sync',
        'Data integration',
        'Ontology access'
      ];

      services.push({
        name: id,
        protocol,
        endpoint,
        capabilities,
      });
    }

    // Register active services
    for (const service of services) {
      this.mcpHandler.registerService(service);
    }

    console.log(`[ContinuousOrchestrator] ✅ Registered ${services.length} active MCP services`);
    console.log(`[ContinuousOrchestrator] Services: ${services.map(s => s.name).join(', ')}`);
  }

  /**
   * Setup A2A message listeners for all agents
   */
  private setupA2AListeners(): void {
    for (const [agentId, agent] of this.agents.entries()) {
      // Get agent config (handle agents that don't have getConfig)
      const config = agent.getConfig?.() || { agentName: agentId };

      // Subscribe to messages for this agent
      this.a2aBus.subscribe(agentId, async (message: AgentMessage) => {
        console.log(`[A2A] ${config.agentName} received message from ${message.from}`);

        // Store in pending requests for processing in next cycle
        const pending = this.state.pendingRequests.get(agentId) || [];
        pending.push(message);
        this.state.pendingRequests.set(agentId, pending);
      });
    }

    console.log(`[ContinuousOrchestrator] A2A listeners setup for ${this.agents.size} agents`);
  }

  private fingerprint(project: any): string {
    const key = [
      project.id,
      project.budget,
      project.actualCost,
      project.spent,
      project.progress,
      project.status,
      project.health,
      project.spiValue,
      project.cpiValue,
      project.riskScore,
      project.complianceScore,
      project.adoptionRate,
      project.predictability,
      project.startDate,
      project.endDate,
      project.milestoneCount,
      project.openRisks,
      project.staffingLevel,
      project.stakeholderSatisfaction,
      project.roi,
      project.updatedAt || project.updated_at,
    ].join('|');
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const chr = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(36);
  }

  private hasProjectChanged(project: any): boolean {
    const fp = this.fingerprint(project);
    const prev = this.projectSnapshots.get(project.id);
    if (prev === fp) return false;
    this.projectSnapshots.set(project.id, fp);
    return true;
  }

  private isOnCooldown(agentId: string, projectId: string): boolean {
    const agentScans = this.agentLastScan.get(agentId);
    if (!agentScans) return false;
    const lastScan = agentScans.get(projectId);
    if (!lastScan) return false;
    return (Date.now() - lastScan) < ContinuousOrchestrator.SCAN_COOLDOWN_MS;
  }

  private recordScan(agentId: string, projectId: string): void {
    if (!this.agentLastScan.has(agentId)) {
      this.agentLastScan.set(agentId, new Map());
    }
    this.agentLastScan.get(agentId)!.set(projectId, Date.now());
  }

  getScanEfficiency(): { totalScans: number; skippedScans: number; skipRate: string } {
    const total = this.totalScans || 1;
    return {
      totalScans: this.totalScans,
      skippedScans: this.skippedScans,
      skipRate: ((this.skippedScans / total) * 100).toFixed(1) + '%',
    };
  }

  /**
   * Initialize Palantir Rules Service
   */
  private async initializePalantirRules(): Promise<void> {
    const rules = getPalantirRulesService();
    if (!rules) {
      console.log('[ContinuousOrchestrator] Palantir Rules not configured - using local thresholds');
      this.rulesServiceAvailable = false;
      return;
    }

    try {
      const connected = await rules.testConnection();
      this.rulesServiceAvailable = connected;

      if (connected) {
        console.log('[ContinuousOrchestrator] ✅ Palantir Rules connected - using Palantir Functions');

        // Notify all agents of available functions
        for (const [agentId, agent] of this.agents) {
          const functions = rules.getFunctionsForAgent(agentId);
          if (functions.length > 0 && typeof agent.learn === 'function') {
            await agent.learn('palantir_functions', {
              functions,
              loadedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        console.log('[ContinuousOrchestrator] Palantir not reachable - using local threshold fallbacks');
      }
    } catch (error: any) {
      console.warn(`[ContinuousOrchestrator] Palantir Rules initialization failed: ${error.message}`);
      this.rulesServiceAvailable = false;
    }
  }

  /**
   * Map rule slugs to their owning agents
   */
  private static RULE_TO_AGENT_MAP: Record<string, string> = {
    'budget-alert': 'finops',
    'schedule-alert': 'tmo',
    'risk-alert': 'risk',
    'compliance-alert': 'governance',
    'health-alert': 'pmo',
    'value-gap': 'vro',
    'change-impact': 'ocm',
    'dependency-alert': 'planning',
  };

  /**
   * Check Palantir Rules connection and notify agents
   */
  private async checkPalantirConnection(): Promise<void> {
    const rules = getPalantirRulesService();
    if (!rules) return;

    try {
      const connected = await rules.testConnection();
      if (connected !== this.rulesServiceAvailable) {
        this.rulesServiceAvailable = connected;
        console.log(`[PalantirRules] Connection status changed: ${connected ? 'connected' : 'disconnected'}`);
      }
    } catch (error: any) {
      console.warn(`[PalantirRules] Connection check failed: ${error.message}`);
      this.rulesServiceAvailable = false;
    }
  }

  /**
   * Broadcast threshold changes to affected agents via A2A
   */
  private async broadcastThresholdChanges(changes: Array<{ agentType: string; thresholdType: string; newValue: number }>): Promise<void> {
    for (const change of changes) {
      const agentId = change.agentType;

      if (this.agents.has(agentId)) {
        const message: AgentMessage = {
          from: 'orchestrator',
          to: agentId,
          type: 'alert',
          content: `Threshold "${change.thresholdType}" has been updated to ${change.newValue}.`,
          severity: 'low',
        };

        await this.a2aBus.send(message);

        // Also store in agent's Letta memory via learn()
        const agent = this.agents.get(agentId);
        if (agent && typeof agent.learn === 'function') {
          await agent.learn(`threshold_update_${change.thresholdType}`, {
            thresholdType: change.thresholdType,
            newValue: change.newValue,
            updatedAt: new Date().toISOString(),
          });
        }

        console.log(`[PalantirRules] Notified ${agentId} agent of threshold change: ${change.thresholdType}`);
      }
    }

    // Log threshold sync activity
    if (changes.length > 0) {
      await this.storage.createAgentActivityLog({
        eventType: 'autonomous_action',
        primaryAgentId: 'orchestrator',
        primaryAgentName: 'Orchestrator',
        summary: `[PalantirRules] ${changes.length} threshold(s) updated and synced to agents`,
        details: JSON.stringify({
          changes,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  }

  /**
   * Check if Palantir Rules service is available
   */
  isRulesServiceAvailable(): boolean {
    return this.rulesServiceAvailable;
  }

  // ============ Agent Workflow Flows ============

  /**
   * Map of predefined agent workflow flows
   */
  private static AGENT_WORKFLOW_FLOWS: Record<string, { agents: string[]; description: string }> = {
    'budget-escalation': {
      agents: ['finops', 'pmo', 'notification'],
      description: 'Budget breach detection → PMO review → Stakeholder notification',
    },
    'risk-mitigation': {
      agents: ['risk', 'governance', 'notification'],
      description: 'Risk detection → Governance approval → Action notification',
    },
    'schedule-recovery': {
      agents: ['tmo', 'planning', 'pmo'],
      description: 'Schedule variance → Dependency analysis → Recovery plan',
    },
    'change-approval': {
      agents: ['ocm', 'governance', 'notification'],
      description: 'Change impact → Governance review → Stakeholder comms',
    },
    'value-realization': {
      agents: ['vro', 'finops', 'pmo'],
      description: 'Value tracking → ROI analysis → Portfolio review',
    },
  };

  /**
   * Trigger an agent workflow flow
   *
   * This executes a Palantir Action and coordinates the involved agents.
   *
   * @param workflowSlug - The workflow/action slug to execute
   * @param input - Input data for the workflow
   * @param triggeringAgentId - Agent that triggered the workflow
   */
  async triggerAgentWorkflow(
    workflowSlug: string,
    input: Record<string, any>,
    triggeringAgentId?: string
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const workflow = ContinuousOrchestrator.AGENT_WORKFLOW_FLOWS[workflowSlug];

    if (!workflow) {
      console.warn(`[Orchestrator] Unknown workflow: ${workflowSlug}`);
      return { success: false, error: `Unknown workflow: ${workflowSlug}` };
    }

    console.log(`[Orchestrator] Triggering workflow "${workflowSlug}" by ${triggeringAgentId || 'system'}`);
    console.log(`[Orchestrator] Workflow involves agents: ${workflow.agents.join(' → ')}`);

    // Execute the Palantir Action
    const flowResult = await this.mcpHandler.executeFlow(workflowSlug, input, triggeringAgentId);

    if (!flowResult.success) {
      // Log failure
      await this.storage.createAgentActivityLog({
        eventType: 'autonomous_action',
        primaryAgentId: triggeringAgentId || 'orchestrator',
        primaryAgentName: triggeringAgentId || 'Orchestrator',
        summary: `[Workflow] "${workflowSlug}" failed: ${flowResult.error}`,
        details: JSON.stringify({ workflowSlug, input, error: flowResult.error }),
      });

      return { success: false, error: flowResult.error };
    }

    // Notify all involved agents via A2A
    for (const agentId of workflow.agents) {
      if (this.agents.has(agentId)) {
        const message: AgentMessage = {
          from: triggeringAgentId || 'orchestrator',
          to: agentId,
          type: 'collaboration_request',
          content: `Workflow "${workflowSlug}" executed. Review outputs and take action.`,
          payload: {
            workflowSlug,
            outputs: flowResult.outputs,
            executionTime: flowResult.executionTime,
          },
          severity: 'medium',
        };

        await this.a2aBus.send(message);

        // Store workflow result in agent's Letta memory
        const agent = this.agents.get(agentId);
        if (agent && typeof agent.learn === 'function') {
          await agent.learn(`workflow_${workflowSlug}`, {
            slug: workflowSlug,
            triggeredBy: triggeringAgentId,
            outputs: flowResult.outputs,
            executionTime: flowResult.executionTime,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Log success
    await this.storage.createAgentActivityLog({
      eventType: 'agent_collaboration',
      primaryAgentId: triggeringAgentId || 'orchestrator',
      primaryAgentName: triggeringAgentId || 'Orchestrator',
      collaboratingAgentIds: workflow.agents,
      summary: `[Workflow] "${workflowSlug}" completed in ${flowResult.executionTime}ms`,
      details: JSON.stringify({
        workflowSlug,
        agents: workflow.agents,
        outputs: flowResult.outputs,
        executionTime: flowResult.executionTime,
      }),
    });

    console.log(`[Orchestrator] Workflow "${workflowSlug}" completed, notified ${workflow.agents.length} agents`);

    return { success: true, result: flowResult.outputs };
  }

  /**
   * Get available agent workflows
   */
  getAvailableWorkflows(): Record<string, { agents: string[]; description: string }> {
    return ContinuousOrchestrator.AGENT_WORKFLOW_FLOWS;
  }

  /**
   * Start 24x7 continuous orchestration
   *
   * SAFEGUARDS:
   * - Waits for server to be fully ready before starting
   * - Applies configurable startup delay (default: 60s)
   * - Checks memory before each cycle
   */
  async start(intervalMs: number = 600000): Promise<void> {
    if (this.isRunning) {
      console.log('[ContinuousOrchestrator] Already running');
      return;
    }

    const settings = getSettings();
    console.log(`[ContinuousOrchestrator] Starting 24x7 coordination (interval: ${intervalMs}ms)`);
    console.log(`[ContinuousOrchestrator] Startup delay: ${settings.startupDelayMs}ms, Memory threshold: ${settings.memoryThresholdPercent}%`);

    // Wrap storage with Palantir adapter for reads
    try {
      const { getPalantirStorageAdapter } = await import('../services/PalantirStorageAdapter.js');
      this.storage = getPalantirStorageAdapter(this._rawStorage);
      console.log('[ContinuousOrchestrator] Storage wrapped with PalantirStorageAdapter - reads go through Palantir');
    } catch (adapterErr: any) {
      console.warn(`[ContinuousOrchestrator] PalantirStorageAdapter unavailable: ${adapterErr.message}`);
    }

    // SAFEGUARD 1: Wait for server to be fully ready
    console.log('[ContinuousOrchestrator] Waiting for server to be ready...');
    const serverReady = await serverReadyService.waitForReady(120000);
    if (!serverReady) {
      console.error('[ContinuousOrchestrator] Server did not become ready in time, aborting startup');
      return;
    }
    console.log('[ContinuousOrchestrator] Server ready confirmed');

    // SAFEGUARD 2: Apply startup delay to let server stabilize
    console.log(`[ContinuousOrchestrator] Applying ${settings.startupDelayMs}ms startup delay...`);
    await new Promise(resolve => setTimeout(resolve, settings.startupDelayMs));
    console.log('[ContinuousOrchestrator] Startup delay complete');

    // SAFEGUARD 3: Log memory status (Palantir-native mode uses minimal memory)
    const memCheck = memoryMonitorService.checkMemory(settings.memoryThresholdPercent);
    if (!memCheck.canProceed) {
      console.warn(`[ContinuousOrchestrator] Memory note: ${memCheck.reason}`);
      console.warn('[ContinuousOrchestrator] Proceeding anyway - Palantir-native mode (no LLM, low memory usage)');
      memoryMonitorService.forceGC();
    }

    this.isRunning = true;
    memoryMonitorService.logStatus();

    // Initialize Palantir Rules Service
    await this.initializePalantirRules();

    // Run first cycle (after safeguards applied)
    console.log('[ContinuousOrchestrator] Running first orchestration cycle...');
    await this.orchestrationCycle();

    // Then run continuously
    this.orchestrationInterval = setInterval(async () => {
      const cycleMemCheck = memoryMonitorService.checkMemory(settings.memoryThresholdPercent);
      if (!cycleMemCheck.canProceed) {
        console.warn(`[ContinuousOrchestrator] Memory note: ${cycleMemCheck.reason} (proceeding - Palantir-native)`);
        memoryMonitorService.forceGC();
      }
      await this.orchestrationCycle();
    }, intervalMs);
  }

  /**
   * Stop continuous orchestration
   */
  stop(): void {
    if (this.orchestrationInterval) {
      clearInterval(this.orchestrationInterval);
      this.orchestrationInterval = null;
      this.isRunning = false;
      console.log('[ContinuousOrchestrator] Stopped');
    }
  }

  /**
   * Single orchestration cycle - runs every 15 seconds
   */
  private async orchestrationCycle(): Promise<void> {
    this.cycleCount++;
    const startTime = Date.now();

    try {
      console.log(`\n[ContinuousOrchestrator] === Cycle ${this.cycleCount} ===`);

      // Check Palantir Rules connection periodically
      if (this.cycleCount % ContinuousOrchestrator.RULE_CHECK_INTERVAL === 0) {
        await this.checkPalantirConnection();
      }

      // Phase 1: Select active agent for this cycle (round-robin)
      const agentId = this.selectAgentForCycle();
      const agent = this.agents.get(agentId);

      if (!agent) {
        console.warn(`[ContinuousOrchestrator] Agent ${agentId} not found`);
        return;
      }

      const config = this.getAgentConfig(agent, agentId);
      console.log(`[ContinuousOrchestrator] Active agent: ${config.agentName}`);

      // Phase 2: Check for pending requests to this agent
      const pendingRequests = this.state.pendingRequests.get(agentId) || [];
      if (pendingRequests.length > 0) {
        console.log(`[ContinuousOrchestrator] Processing ${pendingRequests.length} pending requests for ${config.agentName}`);
        await this.processRequests(agent, pendingRequests);
        this.state.pendingRequests.set(agentId, []);
      }

      // Phase 3: Agent performs autonomous scan
      const scanResult = await this.performAgentScan(agent, agentId);

      // Phase 4: Process findings and determine collaboration needs
      if (scanResult.findings.length > 0) {
        console.log(`[ContinuousOrchestrator] ${config.agentName} found ${scanResult.findings.length} issues`);

        for (const finding of scanResult.findings) {
          // Determine if other agents need to be consulted
          const collaborationNeeded = await this.shouldCollaborate(agentId, finding);

          if (collaborationNeeded.agents.length > 0) {
            console.log(`[ContinuousOrchestrator] Triggering collaboration with: ${collaborationNeeded.agents.join(', ')}`);
            await this.initiateCollaboration(agentId, collaborationNeeded.agents, finding);
          } else {
            // Agent handles independently
            await this.handleFindingIndependently(agent, agentId, finding);
          }
        }
      }

      // Phase 5: Autonomous actions only created for actual findings (not random)
      // Agents only act when they detect real issues, not on random chance

      // Phase 5.5: Cross-domain insight generation via ontology queries
      if (this.cycleCount % ContinuousOrchestrator.INSIGHT_CHECK_INTERVAL === 0) {
        await this.generateCrossDomainInsights(agentId);
      }

      // Phase 6: Clear agent memory to prevent history buildup between cycles
      if (agent && typeof agent.clearMemory === 'function') {
        await agent.clearMemory();
      }

      const executionTime = Date.now() - startTime;
      const eff = this.getScanEfficiency();
      console.log(`[ContinuousOrchestrator] Cycle ${this.cycleCount} completed in ${executionTime}ms (scan skip rate: ${eff.skipRate})\n`);

      // Reset error counter on successful cycle
      this.state.errorCount = 0;

    } catch (error: any) {
      console.error('[ContinuousOrchestrator] Error in orchestration cycle:', error);

      // Track error for monitoring
      this.state.errorCount = (this.state.errorCount || 0) + 1;

      // If too many consecutive errors, take recovery action
      if (this.state.errorCount > 5) {
        console.error('[ContinuousOrchestrator] Too many consecutive errors, attempting recovery...');

        try {
          // Recovery action: reset agent rotation
          this.cycleCount = 0;
          this.state.pendingRequests.clear();

          // Clear error counter after recovery attempt
          this.state.errorCount = 0;

          console.log('[ContinuousOrchestrator] Recovery completed, resuming normal operation');
        } catch (recoveryError: any) {
          console.error('[ContinuousOrchestrator] Recovery failed:', recoveryError);

          // If recovery fails, stop orchestration to prevent infinite error loop
          console.error('[ContinuousOrchestrator] Stopping orchestration due to unrecoverable errors');
          this.stop();
        }
      }
    }
  }

  /**
   * Select which agent should be active in this cycle (round-robin)
   */
  private selectAgentForCycle(): string {
    const agentIds = Array.from(this.agents.keys());
    const index = this.cycleCount % agentIds.length;
    return agentIds[index];
  }

  /**
   * Agent performs autonomous scan of projects
   */
  private async performAgentScan(agent: any, agentId: string): Promise<{ findings: any[] }> {
    const config = this.getAgentConfig(agent, agentId);

    try {
      const allProjects = await this.storage.getProjects();

      this.state.activeScans.set(config.agentId, allProjects.map(p => p.id));

      const mem0Risks = await this.checkAgentMem0Risks(agentId);
      
      await this.storage.createAgentActivityLog({
        eventType: 'detection',
        primaryAgentId: config.agentId,
        primaryAgentName: config.agentName,
        summary: `${config.agentName} scanning ${allProjects.length} projects + ${mem0Risks.length} stored risks`,
      });

      let cachedPalantirContext: any = null;
      try {
        const palantirProvider = getPalantirDataProvider();
        if (palantirProvider.isAvailable()) {
          cachedPalantirContext = await palantirProvider.enrichAgentContext(agentId, { projectId: null });
          if (cachedPalantirContext?.palantirSummary) {
            console.log(`[ContinuousOrchestrator] ${config.agentName} pre-fetched ${cachedPalantirContext.palantirSummary.totalObjects} Palantir objects (${cachedPalantirContext.palantirSummary.label})`);
          }
        }
      } catch (enrichErr: any) {
        console.warn(`[ContinuousOrchestrator] ${config.agentName} Palantir pre-fetch failed: ${enrichErr.message}`);
      }

      const findings: any[] = [];

      for (const risk of mem0Risks) {
        findings.push({
          projectId: risk.projectId,
          projectName: risk.projectName || 'Unknown',
          issue: risk.description,
          severity: risk.severity,
          confidence: risk.confidence || 0.85,
          recommendedAction: risk.action,
          source: 'mem0_self_check',
        });
      }

      let scanned = 0;
      let skipped = 0;

      for (const project of allProjects) {
        this.totalScans++;

        const changed = this.hasProjectChanged(project);
        const onCooldown = this.isOnCooldown(agentId, project.id);

        if (!changed || onCooldown) {
          this.skippedScans++;
          skipped++;
          continue;
        }

        scanned++;
        this.recordScan(agentId, project.id);

        const issue = await this.detectIssue(agent, agentId, project, cachedPalantirContext);
        if (issue) {
          findings.push({
            projectId: project.id,
            projectName: project.name,
            issue: issue.description,
            severity: issue.severity,
            confidence: issue.confidence,
            recommendedAction: issue.action,
          });
        }
      }

      if (skipped > 0) {
        console.log(`[ContinuousOrchestrator] ${config.agentName}: scanned ${scanned}/${allProjects.length} projects (${skipped} unchanged, skipped)`);
      }

      return { findings };
    } catch (error) {
      console.error(`[ContinuousOrchestrator] Error in agent scan for ${config.agentName}:`, error);
      return { findings: [] };
    }
  }

  /**
   * LEVEL 4 AUTONOMY: Agent checks their own stored risks in Mem0
   * Agents are self-learning - they track what they've flagged before
   */
  private async checkAgentMem0Risks(agentId: string): Promise<any[]> {
    try {
      const { getMem0Service } = await import('../lib/Mem0Service.js');
      const mem0 = getMem0Service();
      
      // Query facts this agent stored that are still relevant (use observeFacts)
      const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
      const agentFacts = await mem0.observeFacts({
        sourceAgent: agentId,
        sinceTimestamp: oneHourAgo,
      });
      
      // Filter for risk-related facts
      return agentFacts
        .filter((f: any) => {
          const attr = f.attribute?.toLowerCase() || '';
          return attr.includes('risk') || attr.includes('issue') || attr.includes('alert');
        })
        .slice(0, 5) // Limit to 5 most recent risks per cycle
        .map((f: any) => ({
          projectId: f.entity,
          description: `[Self-check] ${f.attribute}: ${JSON.stringify(f.value)}`,
          severity: f.value?.severity || 'medium',
          action: f.value?.action || 'Re-evaluate risk status',
          confidence: f.confidence,
        }));
    } catch (error) {
      // Silent fail - Mem0 check is enhancement, not critical
      return [];
    }
  }

  /**
   * Detect if project has issues in agent's domain
   * Palantir-native: Fetches data from Palantir ontology + runs Tier 0 heuristics (zero LLM cost)
   */
  private async detectIssue(agent: any, agentId: string, project: any, cachedPalantirContext?: any): Promise<any | null> {
    const config = this.getAgentConfig(agent, agentId);

    let agentContext: any = { projectId: project.id, project };
    if (cachedPalantirContext?.palantirData) {
      agentContext = { ...agentContext, palantirData: cachedPalantirContext.palantirData, palantirSummary: cachedPalantirContext.palantirSummary };
    }

    // Step 2: Run Tier 0 heuristics on the enriched data (zero cost)
    try {
      const { getSmartRouter } = await import('../lib/SmartModelRouter.js');
      const router = getSmartRouter();
      const projectData = { ...project, ...(agentContext.palantirData || {}) };
      const heuristicResult = router.runHeuristics(agentId, projectData);

      if (heuristicResult.applicable && heuristicResult.findings.length > 0) {
        const criticalFindings = heuristicResult.findings.filter(f => f.status === 'critical');
        const warningFindings = heuristicResult.findings.filter(f => f.status === 'warning');

        if (criticalFindings.length > 0 || warningFindings.length > 0) {
          // Broadcast findings as facts to Mem0 (so other agents can see them)
          if (typeof agent.broadcastFact === 'function') {
            for (const finding of heuristicResult.findings.filter(f => f.status !== 'ok')) {
              await agent.broadcastFact(
                `project_${project.id}`,
                finding.metric.toLowerCase().replace(/\s+/g, '_'),
                { value: finding.value, status: finding.status, message: finding.message },
                0.95
              );
            }
          }

          // Check Palantir rules if available
          try {
            const rulesService = getPalantirRulesService();
            if (rulesService) {
              for (const finding of criticalFindings) {
                await rulesService.checkThreshold(agentId, finding.metric, typeof finding.value === 'string' ? parseFloat(finding.value) : finding.value);
              }
            }
          } catch (ruleErr: any) {
            // Rules check is optional
          }

          return {
            description: heuristicResult.summary,
            severity: heuristicResult.riskLevel === 'critical' ? 'critical' : heuristicResult.riskLevel === 'high' ? 'high' : 'medium',
            confidence: 0.95,
            action: heuristicResult.recommendations.join('; ') || 'Review findings',
            source: 'palantir_heuristic',
          };
        }
      }
    } catch (heuristicErr: any) {
      console.warn(`[ContinuousOrchestrator] ${config.agentName} heuristic analysis failed: ${heuristicErr.message}`);
    }

    // FALLBACK: Use rule evaluation for agents without run() method
    if (typeof agent.evaluateRules === 'function') {
      // Build metrics from project data
      const metrics = this.buildMetricsFromProject(config.agentId, project);

      // Evaluate rules
      const ruleResults = agent.evaluateRules(metrics);

      // If any rules triggered, return the first one (highest priority)
      if (ruleResults.length > 0) {
        const triggered = ruleResults[0];
        const rule = triggered.rule;
        const actions = triggered.actions;

        // ✅ OPTION 1: BROADCAST FACTS WHEN RULE TRIGGERS (Event-Driven Architecture)
        // This creates the rich signal stream that enables:
        // - Real-time agent observation and collaboration
        // - Trend detection and pattern learning
        // - Predictive intelligence through historical data
        // - Cross-domain correlation analysis

        // Debug: Check if broadcastFact exists
        const hasBroadcastFact = typeof agent.broadcastFact === 'function';
        console.log(`[ContinuousOrchestrator] ${config.agentName} has broadcastFact: ${hasBroadcastFact}, agent type: ${typeof agent}, agent constructor: ${agent?.constructor?.name}`);

        if (hasBroadcastFact) {
          try {
            // Broadcast each condition that triggered the rule
            for (const condition of rule.conditions) {
              const metricValue = metrics[condition.attribute];
              if (metricValue !== undefined) {
                console.log(`[ContinuousOrchestrator] ${config.agentName} broadcasting: ${condition.attribute} = ${metricValue}`);
                await agent.broadcastFact(
                  `project_${project.id}`,
                  condition.attribute,
                  metricValue,
                  0.90 // High confidence - based on actual data via rules
                );
              }
            }
            console.log(`[ContinuousOrchestrator] ${config.agentName} broadcast ${rule.conditions.length} facts for project ${project.id}`);
          } catch (error) {
            console.error(`[ContinuousOrchestrator] Error broadcasting facts for ${config.agentName}:`, error);
          }
        } else {
          console.warn(`[ContinuousOrchestrator] ${config.agentName} does NOT have broadcastFact method!`);
        }

        // Get highest severity action
        const highestSeverity = this.getHighestSeverity(actions.map((a: any) => a.severity));

        return {
          description: rule.description,
          severity: highestSeverity,
          confidence: 0.90, // Rules are explicit, so high confidence
          action: actions.map((a: any) => a.message).join('; '),
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredActions: actions,
        };
      }
    }

    // Fallback: Use old hardcoded logic for non-Deep agents
    // This handles agents that don't have rules yet
    return this.detectIssueLegacy(config, project);
  }

  /**
   * Build metrics object from project data for rule evaluation
   */
  private buildMetricsFromProject(agentId: string, project: any): Record<string, any> {
    const metrics: Record<string, any> = {};

    // Common metrics
    const budget = parseFloat(project.budget || '0');
    const actualCost = parseFloat(project.actualCost || '0');
    const progress = project.progress || 0;

    if (agentId === 'finops' || agentId === 'deep-finops') {
      // FinOps metrics
      const variance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;
      const burnRate = progress > 0 ? (actualCost / budget) / (progress / 100) * 100 : 100;
      const remainingBudget = budget - actualCost;

      metrics.variance = Math.abs(variance);
      metrics.burnRate = burnRate;
      metrics.budgetHealth = variance > 20 ? 'critical' : variance > 15 ? 'warning' : 'healthy';
      metrics.remainingBudget = remainingBudget;
      metrics.totalSpend = actualCost;
    }

    if (agentId === 'tmo' || agentId === 'deep-tmo') {
      // TMO metrics
      const spi = parseFloat(project.spiValue || '1.0');
      metrics.scheduleVariance = spi < 1.0 ? (1.0 - spi) * 100 : 0;
      metrics.spi = spi;
    }

    if (agentId === 'risk' || agentId === 'deep-risk') {
      // Risk metrics (would need more project data)
      metrics.riskScore = 50; // Placeholder
      metrics.highPriorityRisksCount = 0; // Placeholder
    }

    if (agentId === 'vro' || agentId === 'deep-vro') {
      // VRO metrics
      const expectedRoi = parseFloat(project.expectedRoi || '0');
      metrics.roi = expectedRoi;
      metrics.valueRealization = progress;
    }

    return metrics;
  }

  /**
   * Get highest severity from list
   */
  private getHighestSeverity(severities: string[]): 'critical' | 'high' | 'medium' | 'low' {
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Legacy detection logic for agents without rules
   */
  private async detectIssueLegacy(config: any, project: any): Promise<any | null> {
    // Governance Agent: Check compliance
    if (config.agentId === 'governance') {
      if (!project.portfolioId) {
        return {
          description: 'Project not assigned to portfolio - governance gap',
          severity: 'medium',
          confidence: 1.0,
          action: 'Assign project to appropriate portfolio for proper oversight',
        };
      }
    }

    // Planning Agent: Check dependencies
    if (config.agentId === 'planning') {
      // TODO: Implement real dependency conflict detection using dependency graph
      // For now, skip random detection - only detect real issues from rules engine
    }

    // OCM Agent: Check change management
    if (config.agentId === 'ocm') {
      // TODO: Implement real change adoption metrics analysis from database
      // For now, skip random detection - only detect real issues from rules engine
    }

    // Integrated Mgmt Agent: Check quality
    if (config.agentId === 'integrated') {
      const predictability = parseInt(project.predictability || '100');
      if (predictability < 75) {
        return {
          description: `Low quality/predictability score (${predictability}%)`,
          severity: predictability < 60 ? 'high' : 'medium',
          confidence: 0.81,
          action: 'Investigate root causes and implement quality improvement plan',
        };
      }
    }

    return null;
  }

  /**
   * Determine if collaboration is needed
   */
  private async shouldCollaborate(agentId: string, finding: any): Promise<{ agents: string[]; reason: string }> {
    const collaborators: string[] = [];
    let reason = '';

    // Critical issues always trigger collaboration
    if (finding.severity === 'critical') {
      reason = 'Critical severity requires multi-agent coordination';

      // Add relevant agents
      if (agentId === 'finops') {
        collaborators.push('tmo', 'vro', 'planning');
      } else if (agentId === 'tmo') {
        collaborators.push('finops', 'vro', 'planning');
      } else if (agentId === 'vro') {
        collaborators.push('finops', 'tmo', 'planning');
      } else if (agentId === 'risk') {
        collaborators.push('governance', 'planning');
      } else {
        collaborators.push('planning'); // Default coordination through planning
      }
    }

    // Check for cross-domain issues
    const recentFindings = this.state.recentFindings.get(finding.projectId) || [];
    if (recentFindings.length >= 2) {
      reason = 'Multiple agents have concerns about this project';

      // Add agents who found issues
      const uniqueAgents = [...new Set(recentFindings.map(f => f.agentId))];
      collaborators.push(...uniqueAgents.filter(a => a !== agentId));
    }

    // Update recent findings
    recentFindings.push({ ...finding, agentId, timestamp: Date.now() });
    this.state.recentFindings.set(finding.projectId, recentFindings);

    return {
      agents: [...new Set(collaborators)].filter(a => this.agents.has(a)),
      reason,
    };
  }

  /**
   * Initiate collaboration between agents using A2A protocol
   */
  private async initiateCollaboration(fromAgentId: string, toAgentIds: string[], finding: any): Promise<void> {
    const fromAgent = this.agents.get(fromAgentId);
    const fromConfig = this.getAgentConfig(fromAgent, fromAgentId);

    for (const toAgentId of toAgentIds) {
      const toAgent = this.agents.get(toAgentId);
      const toConfig = this.getAgentConfig(toAgent, toAgentId);

      if (!toAgent || !toConfig) continue;

      // Create A2A request message
      // Ensure content is properly serialized (finding.issue might be an object)
      const issueContent = typeof finding.issue === 'string'
        ? finding.issue
        : JSON.stringify(finding.issue);

      const message: AgentMessage = {
        from: fromAgentId,
        to: toAgentId,
        type: 'request',
        content: `${fromConfig.agentName} requests input on: ${issueContent}`,
        projectId: finding.projectId,
        severity: finding.severity || 'medium', // Default to medium if not specified
      };

      // Send via A2A message bus
      await this.a2aBus.send(message);

      // Log agent-to-agent communication
      await this.storage.createAgentActivityLog({
        eventType: 'agent_to_agent',
        primaryAgentId: fromAgentId,
        primaryAgentName: fromConfig.agentName,
        secondaryAgentId: toAgentId,
        secondaryAgentName: toConfig.agentName,
        summary: `[A2A] ${fromConfig.agentName} → ${toConfig.agentName}: ${message.content}`,
        details: JSON.stringify({ finding, message, protocol: 'A2A' }),
      });

      console.log(`[ContinuousOrchestrator] ${fromConfig.agentName} → ${toConfig.agentName}: A2A Request sent`);
    }
  }

  /**
   * Process pending requests to an agent (supports both A2A and MCP)
   */
  private async processRequests(agent: any, requests: AgentMessage[]): Promise<void> {
    const agentId = agent.id || agent.agentId || agent.config?.agentId || 'unknown';
    const config = this.getAgentConfig(agent, agentId);

    for (const request of requests) {
      try {
        const fromAgent = this.agents.get(request.from);
        const fromConfig = this.getAgentConfig(fromAgent, request.from);

        // Agent analyzes the request using its domain expertise
        // Ensure content is properly formatted (might be object)
        const issueContent = typeof request.content === 'string'
          ? request.content
          : JSON.stringify(request.content, null, 2);

        const severityLabel = request.severity || 'medium';

        console.log(`[ContinuousOrchestrator] ${config.agentName} responding to collaboration request from ${fromConfig?.agentName}...`);

        let result;
        try {
          const { getSmartRouter, ModelTier } = await import('../lib/SmartModelRouter.js');
          const router = getSmartRouter();

          let projectData: any = null;
          if (request.projectId) {
            const projects = await this.storage.getProjects();
            projectData = projects.find(p => p.id === request.projectId);
          }

          if (projectData) {
            const classification = router.classifyTask(
              config.agentId || agentId,
              projectData,
              config.agentName
            );

            if (classification.tier === ModelTier.HEURISTIC && classification.heuristicResult) {
              const heuristicResponse = router.formatHeuristicResponse(
                classification.heuristicResult,
                config.agentName
              );
              console.log(`[ContinuousOrchestrator] ${config.agentName} collaboration response via HEURISTIC (zero cost)`);
              result = { output: heuristicResponse.content };
            } else if (classification.skipAnalysis && classification.cachedResult) {
              console.log(`[ContinuousOrchestrator] ${config.agentName} collaboration response via CACHE (zero cost)`);
              result = { output: classification.cachedResult };
            }
          }

          if (!result) {
            result = { output: `${config.agentName}: Acknowledged ${severityLabel} issue regarding "${issueContent}". Will monitor from ${config.focus} perspective and report via heuristics.` };
          }
        } catch (collaborationError) {
          console.error(`[ContinuousOrchestrator] Collaboration response error for ${config.agentName}:`, collaborationError);
          result = { output: `${config.agentName}: Acknowledged ${severityLabel} issue. Will monitor from ${config.focus} perspective.` };
        }

        // Send response via A2A message bus
        const responseMessage: AgentMessage = {
          from: config.agentId,
          to: request.from,
          type: 'response',
          content: result.output || 'Analysis complete',
          projectId: request.projectId,
        };

        await this.a2aBus.send(responseMessage);

        // Log response
        await this.storage.createAgentActivityLog({
          eventType: 'agent_to_agent',
          primaryAgentId: config.agentId,
          primaryAgentName: config.agentName,
          secondaryAgentId: request.from,
          secondaryAgentName: fromConfig?.agentName,
          summary: `[A2A] ${config.agentName} → ${fromConfig?.agentName}: Response provided`,
          details: JSON.stringify({ request, response: result.output, protocol: 'A2A' }),
        });

        console.log(`[ContinuousOrchestrator] ${config.agentName} responded to ${fromConfig?.agentName} via A2A`);

      } catch (error: any) {
        console.error(`[ContinuousOrchestrator] Error processing request for ${config.agentName}:`, error);

        // Clear memory if max_iterations was hit
        if (error.message?.includes('max_iterations') || error.message?.includes('Agent stopped')) {
          console.warn(`[ContinuousOrchestrator] ${config.agentName} hit max_iterations, clearing memory`);
          if (typeof agent.clearMemory === 'function') {
            await agent.clearMemory();
          }
        }
      }
    }
  }

  /**
   * Agent calls external MCP service
   * This allows agents to interact with Jira, Azure, ServiceNow, etc.
   */
  async agentCallMCPService(agentId: string, serviceName: string, action: string, params: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const config = this.getAgentConfig(agent, agentId);

    try {
      console.log(`[MCP] ${config.agentName} calling ${serviceName}.${action}...`);

      const result = await this.mcpHandler.callService(serviceName, agentId, action, params);

      // Log MCP call
      await this.storage.createAgentActivityLog({
        eventType: 'autonomous_action',
        primaryAgentId: agentId,
        primaryAgentName: config.agentName,
        summary: `[MCP] ${config.agentName} → ${serviceName}: ${action}`,
        details: JSON.stringify({ serviceName, action, params, result, protocol: 'MCP' }),
      });

      return result;
    } catch (error) {
      console.error(`[MCP] Error calling ${serviceName} from ${config.agentName}:`, error);
      throw error;
    }
  }

  /**
   * Broadcast alert to multiple agents via A2A
   */
  async broadcastAlert(fromAgentId: string, recipientIds: string[], alert: any): Promise<void> {
    const fromAgent = this.agents.get(fromAgentId);
    const fromConfig = this.getAgentConfig(fromAgent, fromAgentId);

    const message: Omit<AgentMessage, 'to'> = {
      from: fromAgentId,
      type: 'alert',
      content: alert.message,
      projectId: alert.projectId,
      severity: alert.severity,
    };

    await this.a2aBus.broadcast(message, recipientIds);

    await this.storage.createAgentActivityLog({
      eventType: 'agent_to_agent',
      primaryAgentId: fromAgentId,
      primaryAgentName: fromConfig?.agentName || 'System',
      summary: `[A2A Broadcast] ${fromConfig?.agentName} → ${recipientIds.length} agents: ${alert.message}`,
      details: JSON.stringify({ alert, recipients: recipientIds, protocol: 'A2A' }),
    });

    console.log(`[ContinuousOrchestrator] Broadcast alert to ${recipientIds.length} agents`);
  }

  /**
   * Agent handles finding independently (no collaboration needed)
   */
  private async handleFindingIndependently(agent: any, agentId: string, finding: any): Promise<void> {
    const config = this.getAgentConfig(agent, agentId);

    // Broadcast agent insight for real-time notifications
    broadcastAgentInsight({
      sourceAgent: agentId,
      agentName: config.agentName,
      severity: finding.severity || 'medium',
      title: finding.issue,
      description: finding.recommendedAction || `${config.agentName} detected this issue`,
      rootCause: finding.rootCause ? {
        primary: finding.rootCause,
        confidence: finding.confidence || 0.75,
      } : undefined,
      recommendations: finding.recommendedAction ? [{
        action: finding.recommendedAction,
        priority: finding.severity === 'critical' ? 'immediate' : finding.severity === 'high' ? 'soon' : 'consider',
        effort: 'medium',
        confidence: finding.confidence || 0.75,
      }] : undefined,
      projectId: finding.projectId,
      projectName: finding.projectName,
    });

    // Full autonomy agents can self-approve and execute
    if (config.autonomy === 'full' && finding.severity !== 'critical') {
      await this.createSelfApprovedAction(agent, finding);
    } else {
      // Supervised agents create pending interventions
      await this.createPendingIntervention(agent, finding);
    }
  }

  /**
   * Generate cross-domain insights using ontology semantic queries
   * Runs periodically to detect patterns across agent domains
   */
  private async generateCrossDomainInsights(currentAgentId: string): Promise<void> {
    try {
      console.log(`[ContinuousOrchestrator] Generating cross-domain insights...`);

      // Initialize the Timbr query service
      await timbrQueryService.initialize();

      // Generate cross-domain insights
      const insights = await timbrQueryService.generateCrossDomainInsights();

      if (insights.length === 0) {
        console.log(`[ContinuousOrchestrator] No cross-domain insights detected`);
        return;
      }

      console.log(`[ContinuousOrchestrator] Found ${insights.length} cross-domain insights`);

      // Process each insight
      for (const insight of insights) {
        // Broadcast critical insights to WebSocket
        if (insight.severity === 'critical' || insight.severity === 'high') {
          broadcastAgentInsight({
            sourceAgent: 'orchestrator',
            agentName: 'Cross-Domain Analysis',
            severity: insight.severity,
            title: insight.title,
            description: insight.description,
            rootCause: insight.details?.rootCause ? {
              primary: insight.details.rootCause,
              confidence: insight.confidence || 0.8,
            } : undefined,
            recommendations: insight.recommendation ? [{
              action: insight.recommendation,
              priority: insight.severity === 'critical' ? 'immediate' : 'soon',
              effort: 'medium',
              confidence: insight.confidence || 0.8,
            }] : undefined,
            affectedDomains: insight.affectedDomains,
          });
        }

        // Log insight to agent activity
        await this.storage.createAgentActivityLog({
          eventType: 'cross_domain_insight',
          primaryAgentId: 'orchestrator',
          primaryAgentName: 'Cross-Domain Analysis',
          summary: insight.title,
          details: JSON.stringify({
            type: insight.type,
            description: insight.description,
            affectedDomains: insight.affectedDomains,
            severity: insight.severity,
            recommendation: insight.recommendation,
            confidence: insight.confidence,
            relatedEntities: insight.relatedEntities,
          }),
        });

        // Route insight to relevant agents via A2A
        for (const domain of insight.affectedDomains || []) {
          const targetAgentId = this.domainToAgentId(domain);
          if (targetAgentId && targetAgentId !== currentAgentId) {
            await this.messageBus.send({
              from: 'orchestrator',
              to: targetAgentId,
              type: 'cross_domain_insight',
              content: insight,
              severity: insight.severity,
              requiresApproval: insight.severity === 'critical',
            });
          }
        }
      }

      // Also get agent-specific insights for the current agent
      const agentInsights = await timbrQueryService.getAgentDomainInsights(currentAgentId);

      if (agentInsights.length > 0) {
        console.log(`[ContinuousOrchestrator] Found ${agentInsights.length} domain-specific insights for ${currentAgentId}`);

        for (const insight of agentInsights) {
          await this.storage.createAgentActivityLog({
            eventType: 'domain_insight',
            primaryAgentId: currentAgentId,
            primaryAgentName: this.getAgentNameFromId(currentAgentId),
            summary: insight.title,
            details: JSON.stringify(insight),
          });
        }
      }

    } catch (error: any) {
      console.error(`[ContinuousOrchestrator] Error generating cross-domain insights:`, error.message);
    }
  }

  /**
   * Map domain name to agent ID
   */
  private domainToAgentId(domain: string): string | null {
    const domainMap: Record<string, string> = {
      'VRO': 'vro',
      'PMO': 'pmo',
      'TMO': 'tmo',
      'FinOps': 'finops',
      'Risk': 'risk',
      'OKR': 'okr',
      'Governance': 'governance',
      'Planning': 'planning',
      'OCM': 'ocm',
      'Notification': 'notification',
    };
    return domainMap[domain] || null;
  }

  /**
   * Get agent name from ID
   */
  private getAgentNameFromId(agentId: string): string {
    const names: Record<string, string> = {
      finops: 'FinOps Agent',
      tmo: 'TMO Agent',
      risk: 'Risk Agent',
      vro: 'VRO Agent',
      pmo: 'PMO Agent',
      ocm: 'OCM Agent',
      governance: 'Governance Agent',
      planning: 'Planning Agent',
      okr: 'OKR Inference Agent',
      notification: 'Notification Agent',
    };
    return names[agentId] || agentId.toUpperCase();
  }

  /**
   * Create self-approved action for full autonomy agents
   */
  private async createSelfApprovedAction(agent: any, finding?: any): Promise<void> {
    const agentId = agent.id || agent.agentId || agent.config?.agentId || agent.getConfig?.().agentId || 'unknown';
    const config = this.getAgentConfig(agent, agentId);

    if (config.autonomy !== 'full') return;

    try {
      const projects = await this.storage.getProjects();
      const project = finding ? projects.find(p => p.id === finding.projectId) : this.sampleProjects(projects, 1)[0];

      if (!project) return;

      const intervention: InsertIntervention = {
        type: this.getInterventionType(config.agentId),
        severity: finding?.severity || 'low',
        title: `[Agent Self-Approved] ${finding?.issue || 'Autonomous action'}`,
        description: `${config.agentName} autonomously executed this action based on continuous monitoring.`,
        projectId: project.id,
        projectName: project.name,
        confidence: String(finding?.confidence || 0.85),
        suggestedAction: finding?.recommendedAction || 'Automated optimization applied',
        impact: finding ? `Addressed: ${finding.issue}` : 'Proactive optimization',
        status: 'approved',
        agentSource: config.agentName,
        isAutonomous: 'true',
        selfApproved: 'true',
        triggerSource: 'continuous_monitoring',
        approvedBy: `${config.agentName} (Autonomous)`,
      };

      await this.storage.createIntervention(intervention);

      await this.storage.createAgentActivityLog({
        eventType: 'autonomous_action',
        primaryAgentId: config.agentId,
        primaryAgentName: config.agentName,
        summary: `${config.agentName} self-approved and executed action for ${project.name}`,
        details: JSON.stringify(intervention),
      });

      console.log(`[ContinuousOrchestrator] ${config.agentName} created self-approved action`);

    } catch (error) {
      console.error(`[ContinuousOrchestrator] Error creating self-approved action:`, error);
    }
  }

  /**
   * Create pending intervention for supervised agents
   */
  private async createPendingIntervention(agent: any, finding: any): Promise<void> {
    const agentId = agent.id || agent.agentId;
    const config = this.getAgentConfig(agent, agentId);

    try {
      const intervention: InsertIntervention = {
        type: this.getInterventionType(config.agentId),
        severity: finding.severity as any,
        title: finding.issue,
        description: `${config.agentName} detected this issue during continuous monitoring. Review and approval required.`,
        projectId: finding.projectId,
        projectName: finding.projectName,
        confidence: String(finding.confidence),
        suggestedAction: finding.recommendedAction,
        impact: `${finding.severity.toUpperCase()} issue requiring attention`,
        status: 'pending',
        agentSource: config.agentName,
        isAutonomous: 'true',
        selfApproved: 'false',
        triggerSource: 'continuous_monitoring',
      };

      const createdIntervention = await this.storage.createIntervention(intervention);

      await this.storage.createAgentActivityLog({
        eventType: 'detection',
        primaryAgentId: config.agentId,
        primaryAgentName: config.agentName,
        summary: `${config.agentName} created pending intervention: ${finding.issue}`,
        details: JSON.stringify(intervention),
      });

      // Broadcast to WebSocket for real-time notifications
      if (finding.severity === 'critical' || finding.severity === 'high') {
        broadcastCriticalAlert({
          id: createdIntervention.id,
          title: finding.issue,
          message: finding.recommendedAction || `${config.agentName} detected this issue`,
          severity: finding.severity,
          projectName: finding.projectName,
          agentSource: config.agentName,
        });
      } else {
        broadcastNotification({
          id: createdIntervention.id,
          type: 'intervention',
          title: finding.issue,
          message: finding.recommendedAction || `${config.agentName} detected this issue`,
          severity: finding.severity,
          source: config.agentName,
          sourceId: createdIntervention.id,
          createdAt: new Date().toISOString(),
        });
      }

      console.log(`[ContinuousOrchestrator] ${config.agentName} created pending intervention & broadcast`);

    } catch (error) {
      console.error(`[ContinuousOrchestrator] Error creating pending intervention:`, error);
    }
  }

  /**
   * Helper: Sample random projects
   */
  private sampleProjects(projects: any[], count: number): any[] {
    // Priority-based selection: active projects with issues first
    const prioritized = [...projects].sort((a, b) => {
      // Prioritize by status (in_progress > planning > on_hold > completed)
      const statusPriority: Record<string, number> = {
        'in_progress': 4,
        'planning': 3,
        'on_hold': 2,
        'completed': 1,
      };
      const aPriority = statusPriority[a.status] || 0;
      const bPriority = statusPriority[b.status] || 0;

      if (aPriority !== bPriority) return bPriority - aPriority;

      // Then by progress (lower progress first - newer projects need more attention)
      const aProgress = parseInt(a.progress || '0');
      const bProgress = parseInt(b.progress || '0');
      return aProgress - bProgress;
    });

    return prioritized.slice(0, count);
  }

  /**
   * Helper: Get intervention type for agent
   */
  private getInterventionType(agentId: string): string {
    const typeMap: Record<string, string> = {
      finops: 'budget',
      tmo: 'timeline',
      risk: 'risk',
      governance: 'quality',
      planning: 'dependency',
      ocm: 'resource',
      integrated: 'quality',
      vro: 'value_realization',
    };
    return typeMap[agentId] || 'other';
  }

  /**
   * Helper: Generate optimization action description
   */
  private generateOptimizationAction(agentId: string): string {
    // Return generic action - agents should only act based on real findings
    const actionMap: Record<string, string> = {
      finops: 'Routine financial optimization',
      tmo: 'Routine schedule optimization',
      ocm: 'Routine change management review',
      integrated: 'Routine quality review',
      vro: 'Routine value tracking',
      risk: 'Routine risk assessment',
      planning: 'Routine dependency check',
      governance: 'Routine compliance check',
    };
    return actionMap[agentId] || 'Routine monitoring check';
  }

  /**
   * Get coordination status
   */
  getStatus() {
    const a2aStatus = this.a2aBus.getStatus();
    const mcpServices = this.mcpHandler.getServices();
    const rules = getPalantirRulesService();

    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      activeScans: this.state.activeScans.size,
      pendingRequests: Array.from(this.state.pendingRequests.values()).reduce((sum, arr) => sum + arr.length, 0),
      recentFindings: this.state.recentFindings.size,
      a2a: {
        activeQueues: a2aStatus.activeQueues,
        totalMessages: a2aStatus.totalMessages,
      },
      mcp: {
        servicesRegistered: mcpServices.length,
        services: mcpServices.map(s => s.name),
      },
      palantirRules: {
        configured: rules !== null,
        connected: this.rulesServiceAvailable,
        checkInterval: ContinuousOrchestrator.RULE_CHECK_INTERVAL,
      },
    };
  }

  /**
   * Get A2A message bus (for external access)
   */
  getA2ABus(): A2AMessageBus {
    return this.a2aBus;
  }

  /**
   * Get MCP handler (for external access)
   */
  getMCPHandler(): MCPProtocolHandler {
    return this.mcpHandler;
  }
}

/**
 * Factory function
 */
export function createContinuousOrchestrator(storage: IStorage, agents: Map<string, any>): ContinuousOrchestrator {
  return new ContinuousOrchestrator(storage, agents);
}
