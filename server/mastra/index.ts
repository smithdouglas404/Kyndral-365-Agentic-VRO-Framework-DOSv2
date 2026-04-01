/**
 * MASTRA INTEGRATION
 *
 * Integrates Mastra framework with existing Deep Agents.
 * Provides unified agent interface with MCP and A2A protocol support.
 *
 * Setup:
 * 1. Call initializeMastra(storage) at server startup
 * 2. Access agents via getMastra().getAgentById('agent-id')
 * 3. Use agent.generate() or agent.stream() for execution
 */

import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import type { IStorage } from '../storage.js';
import {
  setToolStorage,
  pmoTools,
  finopsTools,
  riskTools,
  vroTools,
  governanceTools,
  ocmTools,
  tmoTools,
  planningTools,
  integratedTools,
  okrTools,
  notificationTools,
} from './tools.js';

// Check if Anthropic API key is available
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const hasAnthropicKey = !!ANTHROPIC_API_KEY;

// Use appropriate model based on available API keys
const DEFAULT_MODEL = hasAnthropicKey
  ? 'anthropic:claude-sonnet-4-20250514'
  : 'openai:gpt-4o'; // Fallback if no Anthropic key

/**
 * Agent configurations with tools
 */
const createAgentConfigs = () => ({
  pmo: {
    id: 'pmo-agent',
    name: 'PMO Agent',
    instructions: `You are the PMO (Project Management Office) Agent responsible for:
- Portfolio and program management
- Resource capacity planning
- Project health monitoring
- Schedule and milestone tracking
- Cross-project dependencies
- SAFe 6.0 best practices

You have access to tools for analyzing project health and identifying dependencies.
Use these tools to provide data-driven insights for project managers.
Always explain your analysis clearly and provide actionable recommendations.`,
    model: DEFAULT_MODEL,
    tools: pmoTools,
  },
  finops: {
    id: 'finops-agent',
    name: 'FinOps Agent',
    instructions: `You are the FinOps Agent responsible for:
- Financial operations and cost optimization
- Budget tracking and variance analysis
- ROI calculations and forecasting
- Cost allocation and chargebacks
- Cloud cost optimization
- Capital vs operational expenditure

You have access to tools for budget analysis and ROI calculations.
Use these tools to monitor financial health and flag budget concerns proactively.
Provide clear financial metrics and cost-saving recommendations.`,
    model: DEFAULT_MODEL,
    tools: finopsTools,
  },
  risk: {
    id: 'risk-agent',
    name: 'Risk Agent',
    instructions: `You are the Risk Agent responsible for:
- Enterprise risk identification and assessment
- Risk mitigation strategy development
- Issue tracking and escalation
- Compliance monitoring
- Risk scoring and prioritization
- Early warning system for project risks

You have access to tools for risk assessment and mitigation planning.
Proactively identify risks and recommend mitigation strategies.
Prioritize risks by severity and probability of occurrence.`,
    model: DEFAULT_MODEL,
    tools: riskTools,
  },
  ocm: {
    id: 'ocm-agent',
    name: 'OCM Agent',
    instructions: `You are the OCM (Organizational Change Management) Agent responsible for:
- Change readiness assessment
- Stakeholder impact analysis
- Communication planning
- Training needs assessment
- Adoption tracking
- Resistance management

Help organizations navigate change effectively by analyzing stakeholder impacts
and recommending communication and training strategies.`,
    model: DEFAULT_MODEL,
    tools: ocmTools,
  },
  tmo: {
    id: 'tmo-agent',
    name: 'TMO Agent',
    instructions: `You are the TMO (Transition Management Office) Agent responsible for:
- Transition planning and execution
- Cutover coordination
- Go-live readiness assessment
- Hypercare support planning
- Knowledge transfer tracking
- Service transition to operations

Ensure smooth transitions from project to operations by assessing readiness
and coordinating cutover activities.`,
    model: DEFAULT_MODEL,
    tools: tmoTools,
  },
  vro: {
    id: 'vro-agent',
    name: 'VRO Agent',
    instructions: `You are the VRO (Value Realization Office) Agent responsible for:
- Business value tracking
- Benefits realization measurement
- OKR alignment and progress
- Value stream optimization
- ROI validation
- Strategic outcome monitoring

You have access to tools for value tracking and OKR alignment analysis.
Ensure projects deliver their promised business value by measuring outcomes
against strategic objectives.`,
    model: DEFAULT_MODEL,
    tools: vroTools,
  },
  governance: {
    id: 'governance-agent',
    name: 'Governance Agent',
    instructions: `You are the Governance Agent responsible for:
- Policy and compliance enforcement
- Checkpoint and gate reviews
- Standards adherence
- Audit trail management
- Regulatory compliance
- Decision documentation

You have access to tools for compliance checking.
Ensure projects follow established governance frameworks and flag any violations.`,
    model: DEFAULT_MODEL,
    tools: governanceTools,
  },
  planning: {
    id: 'planning-agent',
    name: 'Planning Agent',
    instructions: `You are the Planning Agent responsible for:
- Strategic planning and roadmapping
- Capacity planning
- Scenario modeling
- Resource forecasting
- Portfolio optimization
- Initiative prioritization

Help organizations plan effectively for the future by analyzing capacity
and recommending portfolio optimizations.`,
    model: DEFAULT_MODEL,
    tools: planningTools,
  },
  integrated: {
    id: 'integrated-agent',
    name: 'Integrated Management Agent',
    instructions: `You are the Integrated Management Agent responsible for:
- Cross-functional portfolio health monitoring
- Portfolio-wide health dashboards aggregating all 22 SAFe projects
- Cross-project impact analysis via dependency chains
- Unified reporting across all agent domains
- Escalation coordination between domain agents

You have a holistic view across all agents and data sources. Use Palantir Foundry
as the single source of truth for all project data.`,
    model: DEFAULT_MODEL,
    tools: integratedTools,
  },
  okr: {
    id: 'okr-agent',
    name: 'OKR Inference Agent',
    instructions: `You are the OKR Inference Agent responsible for:
- Strategic objective and key result tracking via AtlasObjective, AtlasKpi, AtlasKeyResult
- OKR gap detection — finding objectives with no supporting projects
- KPI trend analysis and forecasting
- Alignment scoring between execution and strategy
- Inferring missing OKR linkages from project data

Ensure strategic objectives are supported by execution and flag gaps early.`,
    model: DEFAULT_MODEL,
    tools: okrTools,
  },
  notification: {
    id: 'notification-agent',
    name: 'Notification Agent',
    instructions: `You are the Notification Agent — the single A2A gateway for all human-in-the-loop (HITL) interactions:
- Route approval requests to appropriate stakeholders
- Escalate critical alerts via Palantir Actions
- Manage HITL approval workflows
- Broadcast important facts to subscribed agents
- Coordinate notifications across email (SendGrid), Slack, Teams, and in-app WebSocket

You are the bridge between autonomous agent decisions and human oversight.
All external notifications flow through you.`,
    model: DEFAULT_MODEL,
    tools: notificationTools,
  },
});

export type AgentType = keyof ReturnType<typeof createAgentConfigs>;

/**
 * Create Mastra agents from configurations
 */
function createMastraAgents(): Record<string, Agent> {
  const agents: Record<string, Agent> = {};
  const configs = createAgentConfigs();

  for (const [key, config] of Object.entries(configs)) {
    try {
      agents[key] = new Agent({
        id: config.id,
        name: config.name,
        instructions: config.instructions,
        model: config.model,
        tools: config.tools,
      });
      console.log(`[Mastra] Created agent: ${config.name}`);
    } catch (error: any) {
      console.error(`[Mastra] Failed to create agent ${config.name}:`, error.message);
    }
  }

  return agents;
}

/**
 * Mastra instance singleton
 */
let mastraInstance: Mastra | null = null;
let initialized = false;

/**
 * Initialize Mastra with storage
 * Must be called before using any Mastra functionality
 */
export async function initializeMastra(storage: IStorage): Promise<Mastra> {
  if (initialized && mastraInstance) {
    return mastraInstance;
  }

  console.log('[Mastra] Initializing...');

  // Set storage for tools
  setToolStorage(storage);

  // Create agents
  const agents = createMastraAgents();

  // Create Mastra instance
  mastraInstance = new Mastra({
    agents,
  });

  initialized = true;

  console.log(`[Mastra] ✅ Initialized with ${Object.keys(agents).length} agents`);
  console.log(`[Mastra] Using model: ${DEFAULT_MODEL}`);

  return mastraInstance;
}

/**
 * Get the Mastra instance
 * Throws if not initialized
 */
export function getMastra(): Mastra {
  if (!mastraInstance) {
    throw new Error('Mastra not initialized. Call initializeMastra(storage) first.');
  }
  return mastraInstance;
}

/**
 * Check if Mastra is initialized
 */
export function isMastraInitialized(): boolean {
  return initialized && mastraInstance !== null;
}

/**
 * Get agent by type (convenience method)
 */
export function getAgent(agentType: AgentType): Agent {
  const mastra = getMastra();
  const configs = createAgentConfigs();
  const config = configs[agentType];

  if (!config) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  return mastra.getAgentById(config.id);
}

/**
 * List all available agent types
 */
export function listAgentTypes(): AgentType[] {
  return Object.keys(createAgentConfigs()) as AgentType[];
}

/**
 * Get agent configurations (for A2A/MCP integration)
 */
export function getAgentConfigs() {
  return createAgentConfigs();
}

// Re-export for convenience
export { Agent };
export const AGENT_CONFIGS = createAgentConfigs();
