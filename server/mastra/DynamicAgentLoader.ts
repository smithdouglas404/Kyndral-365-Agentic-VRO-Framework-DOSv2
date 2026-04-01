import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import type { IStorage } from '../storage.js';
import { dynamicAgents } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
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
import { getA2ARegistry } from '../a2a/A2ARegistry.js';
import type { AgentCard, AgentSkill } from '../a2a/types.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const hasAnthropicKey = !!ANTHROPIC_API_KEY;
const DEFAULT_MODEL = hasAnthropicKey
  ? 'anthropic:claude-sonnet-4-20250514'
  : 'openai:gpt-4o';

const TOOL_REGISTRY: Record<string, Record<string, any>> = {
  pmo: pmoTools,
  finops: finopsTools,
  risk: riskTools,
  vro: vroTools,
  governance: governanceTools,
  ocm: ocmTools,
  tmo: tmoTools,
  planning: planningTools,
  integrated: integratedTools,
  okr: okrTools,
  notification: notificationTools,
};

let mastraInstance: Mastra | null = null;
let storageRef: IStorage | null = null;
let agentMap: Map<string, Agent> = new Map();
let agentConfigCache: Map<string, any> = new Map();

export interface DynamicAgentConfig {
  agentKey: string;
  agentId: string;
  name: string;
  instructions: string;
  model?: string;
  enabled?: boolean;
  skills: any[];
  toolMappings: string[];
  tags: string[];
  palantirObjectTypes?: string[];
  rulebricksRules?: string[];
  a2aMessageTypes?: string[];
  memoryNamespace?: string;
  factSubscriptions?: string[];
}

function resolveTools(toolMappings: string[]): Record<string, any> {
  const tools: Record<string, any> = {};
  for (const mapping of toolMappings) {
    if (TOOL_REGISTRY[mapping]) {
      Object.assign(tools, TOOL_REGISTRY[mapping]);
    }
  }
  return tools;
}

function buildAgentCard(config: DynamicAgentConfig, baseUrl: string): AgentCard {
  const skills: AgentSkill[] = (config.skills || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    inputSchema: s.inputSchema,
  }));

  return {
    id: config.agentId,
    name: config.name,
    description: config.instructions.split('\n')[0].replace(/^You are the .+? (Agent|agent).*?[:—-]\s*/, '').trim(),
    version: '1.0.0',
    provider: {
      name: 'Kyndryl Fabric [K360] Platform',
      url: baseUrl,
    },
    capabilities: {
      streaming: true,
      pushNotifications: true,
      extendedAgentCard: false,
      multiModal: false,
      humanInTheLoop: true,
    },
    skills,
    interfaces: [
      {
        type: 'http',
        baseUrl: `${baseUrl}/api/a2a/agents/${config.agentKey}`,
        version: 'v1',
      },
    ],
    securitySchemes: [
      { type: 'bearer', scheme: 'bearer', bearerFormat: 'JWT' },
      { type: 'apiKey', name: 'X-API-Key', in: 'header' },
    ],
    tags: ['enterprise', 'portfolio-management', 'ai-agent', ...(config.tags || [])],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function loadAgentsFromDB(storage: IStorage): Promise<DynamicAgentConfig[]> {
  try {
    const rows = await storage.db.select().from(dynamicAgents).execute();
    return rows.map((row) => ({
      agentKey: row.agentKey,
      agentId: row.agentId,
      name: row.name,
      instructions: row.instructions,
      model: row.model || DEFAULT_MODEL,
      enabled: row.enabled ?? true,
      skills: JSON.parse(row.skills || '[]'),
      toolMappings: JSON.parse(row.toolMappings || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      palantirObjectTypes: JSON.parse(row.palantirObjectTypes || '[]'),
      rulebricksRules: JSON.parse(row.rulebricksRules || '[]'),
      a2aMessageTypes: JSON.parse(row.a2aMessageTypes || '[]'),
      memoryNamespace: row.memoryNamespace || undefined,
      factSubscriptions: JSON.parse(row.factSubscriptions || '[]'),
    }));
  } catch (error: any) {
    console.error('[DynamicAgentLoader] Failed to load from DB:', error.message);
    return [];
  }
}

function createMastraAgent(config: DynamicAgentConfig): Agent {
  const tools = resolveTools(config.toolMappings);
  return new Agent({
    id: config.agentId,
    name: config.name,
    instructions: config.instructions,
    model: config.model || DEFAULT_MODEL,
    tools,
  });
}

export async function initializeDynamicAgents(storage: IStorage): Promise<Mastra> {
  if (mastraInstance) return mastraInstance;

  console.log('[DynamicAgentLoader] Initializing...');
  storageRef = storage;
  setToolStorage(storage);

  await seedDefaultAgentsIfEmpty(storage);

  const configs = await loadAgentsFromDB(storage);
  const agents: Record<string, Agent> = {};

  for (const config of configs) {
    if (!config.enabled) {
      console.log(`[DynamicAgentLoader] Skipping disabled agent: ${config.name}`);
      continue;
    }
    try {
      const agent = createMastraAgent(config);
      agents[config.agentKey] = agent;
      agentMap.set(config.agentKey, agent);
      agentConfigCache.set(config.agentKey, config);
      console.log(`[DynamicAgentLoader] Loaded agent: ${config.name} (${config.skills.length} skills, tools: ${config.toolMappings.join(',')})`);
    } catch (error: any) {
      console.error(`[DynamicAgentLoader] Failed to create agent ${config.name}:`, error.message);
    }
  }

  mastraInstance = new Mastra({ agents });

  console.log(`[DynamicAgentLoader] ✅ Initialized with ${Object.keys(agents).length} agents from database`);
  return mastraInstance;
}

export async function registerAgent(config: DynamicAgentConfig): Promise<{ success: boolean; error?: string }> {
  if (!storageRef) return { success: false, error: 'System not initialized' };

  try {
    await storageRef.db.insert(dynamicAgents).values({
      agentKey: config.agentKey,
      agentId: config.agentId,
      name: config.name,
      instructions: config.instructions,
      model: config.model || DEFAULT_MODEL,
      enabled: config.enabled ?? true,
      skills: JSON.stringify(config.skills || []),
      toolMappings: JSON.stringify(config.toolMappings || []),
      tags: JSON.stringify(config.tags || []),
      palantirObjectTypes: JSON.stringify(config.palantirObjectTypes || []),
      rulebricksRules: JSON.stringify(config.rulebricksRules || []),
      a2aMessageTypes: JSON.stringify(config.a2aMessageTypes || []),
      memoryNamespace: config.memoryNamespace,
      factSubscriptions: JSON.stringify(config.factSubscriptions || []),
    }).execute();

    const agent = createMastraAgent(config);
    agentMap.set(config.agentKey, agent);
    agentConfigCache.set(config.agentKey, config);

    if (mastraInstance) {
      const agents = { ...Object.fromEntries(agentMap) };
      mastraInstance = new Mastra({ agents });
    }

    const baseUrl = process.env.A2A_BASE_URL || 'http://localhost:5000';
    const card = buildAgentCard(config, baseUrl);
    try {
      const registry = getA2ARegistry();
      await registry.registerRemoteAgent(card);
    } catch {}

    console.log(`[DynamicAgentLoader] ✅ Registered new agent: ${config.name}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAgent(agentKey: string, updates: Partial<DynamicAgentConfig>): Promise<{ success: boolean; error?: string }> {
  if (!storageRef) return { success: false, error: 'System not initialized' };

  try {
    const dbUpdates: any = { updatedAt: new Date() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
    if (updates.skills !== undefined) dbUpdates.skills = JSON.stringify(updates.skills);
    if (updates.toolMappings !== undefined) dbUpdates.toolMappings = JSON.stringify(updates.toolMappings);
    if (updates.tags !== undefined) dbUpdates.tags = JSON.stringify(updates.tags);
    if (updates.palantirObjectTypes !== undefined) dbUpdates.palantirObjectTypes = JSON.stringify(updates.palantirObjectTypes);
    if (updates.rulebricksRules !== undefined) dbUpdates.rulebricksRules = JSON.stringify(updates.rulebricksRules);
    if (updates.a2aMessageTypes !== undefined) dbUpdates.a2aMessageTypes = JSON.stringify(updates.a2aMessageTypes);
    if (updates.memoryNamespace !== undefined) dbUpdates.memoryNamespace = updates.memoryNamespace;
    if (updates.factSubscriptions !== undefined) dbUpdates.factSubscriptions = JSON.stringify(updates.factSubscriptions);

    await storageRef.db.update(dynamicAgents).set(dbUpdates).where(eq(dynamicAgents.agentKey, agentKey)).execute();

    const configs = await loadAgentsFromDB(storageRef);
    const config = configs.find(c => c.agentKey === agentKey);
    if (config && config.enabled) {
      const agent = createMastraAgent(config);
      agentMap.set(agentKey, agent);
      agentConfigCache.set(agentKey, config);

      mastraInstance = new Mastra({ agents: Object.fromEntries(agentMap) });

      const baseUrl = process.env.A2A_BASE_URL || 'http://localhost:5000';
      const card = buildAgentCard(config, baseUrl);
      try {
        const registry = getA2ARegistry();
        await registry.registerRemoteAgent(card);
      } catch {}
    } else if (config && !config.enabled) {
      agentMap.delete(agentKey);
      agentConfigCache.delete(agentKey);
      mastraInstance = new Mastra({ agents: Object.fromEntries(agentMap) });
    }

    console.log(`[DynamicAgentLoader] ✅ Updated agent: ${agentKey}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeAgent(agentKey: string): Promise<{ success: boolean; error?: string }> {
  if (!storageRef) return { success: false, error: 'System not initialized' };

  try {
    await storageRef.db.delete(dynamicAgents).where(eq(dynamicAgents.agentKey, agentKey)).execute();
    agentMap.delete(agentKey);
    agentConfigCache.delete(agentKey);

    mastraInstance = new Mastra({ agents: Object.fromEntries(agentMap) });

    try {
      const registry = getA2ARegistry();
      await registry.unregisterAgent(agentKey);
    } catch {}

    console.log(`[DynamicAgentLoader] ✅ Removed agent: ${agentKey}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getDynamicMastra(): Mastra {
  if (!mastraInstance) throw new Error('Dynamic agents not initialized');
  return mastraInstance;
}

export function getDynamicAgent(agentKey: string): Agent | undefined {
  return agentMap.get(agentKey);
}

export function getDynamicAgentConfig(agentKey: string): DynamicAgentConfig | undefined {
  return agentConfigCache.get(agentKey);
}

export function listDynamicAgents(): { key: string; config: DynamicAgentConfig }[] {
  return Array.from(agentConfigCache.entries()).map(([key, config]) => ({ key, config }));
}

export function getAvailableToolSets(): string[] {
  return Object.keys(TOOL_REGISTRY);
}

export function getToolSetDetails(): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const [key, tools] of Object.entries(TOOL_REGISTRY)) {
    details[key] = Object.keys(tools);
  }
  return details;
}

export function getDynamicAgentCards(): AgentCard[] {
  const baseUrl = process.env.A2A_BASE_URL || 'http://localhost:5000';
  const cards: AgentCard[] = [];
  for (const [, config] of agentConfigCache) {
    if (config.enabled !== false) {
      cards.push(buildAgentCard(config, baseUrl));
    }
  }
  return cards;
}

async function seedDefaultAgentsIfEmpty(storage: IStorage): Promise<void> {
  const existing = await storage.db.select().from(dynamicAgents).limit(1).execute();
  if (existing.length > 0) {
    console.log('[DynamicAgentLoader] Agents already seeded in database');
    return;
  }

  console.log('[DynamicAgentLoader] Seeding default agents...');

  const defaults: DynamicAgentConfig[] = [
    {
      agentKey: 'pmo',
      agentId: 'pmo-agent',
      name: 'PMO Agent',
      instructions: `You are the PMO (Project Management Office) Agent responsible for:
- Portfolio and program management
- Resource capacity planning
- Project health monitoring
- Schedule and milestone tracking
- Cross-project dependencies
- SAFe 6.0 best practices
- SAFe flow metrics analysis (Distribution, Velocity, Time, Load, Efficiency)

You have access to tools for analyzing project health and identifying dependencies.
Use these tools to provide data-driven insights for project managers.
Always explain your analysis clearly and provide actionable recommendations.`,
      toolMappings: ['pmo'],
      tags: ['project-management', 'resource-planning', 'safe-6.0', 'palantir-foundry'],
      palantirObjectTypes: ['AtlasProject', 'AtlasTeam', 'AtlasDependency'],
      memoryNamespace: 'pmo',
      factSubscriptions: ['project-health', 'milestone-alert', 'dependency-alert', 'resource-capacity', 'pi-planning'],
      skills: [
        { id: 'analyze-project-health', name: 'Analyze Project Health', description: 'Comprehensive analysis of project health metrics including schedule, budget, and resource utilization from Palantir AtlasProject data', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, includeHistory: { type: 'boolean' } }, required: ['projectId'] } },
        { id: 'identify-dependencies', name: 'Identify Dependencies', description: 'Analyze cross-project dependencies and potential blockers via AtlasDependency objects', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, depth: { type: 'number' } } } },
        { id: 'resource-capacity-analysis', name: 'Resource Capacity Analysis', description: 'Analyze team capacity, resource allocation, and utilization across projects using Palantir AtlasTeam data' },
        { id: 'safe-pi-planning', name: 'SAFe PI Planning', description: 'Analyze SAFe Program Increment planning — feature completion, velocity, predictability across the 22 SAFe projects', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, piId: { type: 'string' } } } },
        { id: 'milestone-tracking', name: 'Milestone Tracking', description: 'Track milestone progress, schedule variance, and upcoming deadlines from Palantir milestoneProgress data', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { id: 'flow-metrics', name: 'SAFe Flow Metrics', description: 'Analyze SAFe flow metrics — Distribution, Velocity, Time, Load, and Efficiency — with anomaly detection across ARTs and value streams', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, valueStream: { type: 'string' }, metric: { type: 'string', enum: ['distribution', 'velocity', 'time', 'load', 'efficiency', 'all'] } } } },
      ],
    },
    {
      agentKey: 'finops',
      agentId: 'finops-agent',
      name: 'FinOps Agent',
      instructions: `You are the FinOps Agent responsible for:
- Financial operations and cost optimization
- Budget tracking and variance analysis
- ROI calculations and forecasting
- Cost allocation and chargebacks
- Cloud cost optimization
- Capital vs operational expenditure
- Spend analytics and budget forecasting

You have access to tools for budget analysis and ROI calculations.
Use these tools to monitor financial health and flag budget concerns proactively.
Provide clear financial metrics and cost-saving recommendations.`,
      toolMappings: ['finops'],
      tags: ['financial-operations', 'cost-optimization', 'budgeting', 'earned-value'],
      palantirObjectTypes: ['AtlasFinancialRecord', 'AtlasBudget'],
      memoryNamespace: 'finops',
      skills: [
        { id: 'budget-variance-analysis', name: 'Budget Variance Analysis', description: 'Analyze budget vs actual spending using AtlasBudget and AtlasFinancialRecord data', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, period: { type: 'string', enum: ['monthly', 'quarterly', 'ytd'] } } } },
        { id: 'cost-optimization', name: 'Cost Optimization', description: 'Identify cost saving opportunities across cloud, vendor, and resource spending' },
        { id: 'roi-calculation', name: 'ROI Calculation', description: 'Calculate return on investment including NPV and payback period' },
        { id: 'burn-rate-forecast', name: 'Burn Rate Forecast', description: 'Forecast budget burn rate and estimated completion cost from Palantir financial data' },
        { id: 'earned-value-analysis', name: 'Earned Value Analysis', description: 'Calculate earned value metrics (CPI, SPI, EV, PV, AC) for cost and schedule performance' },
        { id: 'spend-analytics', name: 'Spend Analytics', description: 'Analyze spend patterns across the portfolio — cost anomaly detection, vendor spend distribution, and spending trend analysis from AtlasFinancialRecord data', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, period: { type: 'string', enum: ['monthly', 'quarterly', 'ytd', 'all'] } } } },
        { id: 'budget-forecasting', name: 'Budget Forecasting', description: 'Generate budget forecasts based on current burn rate trends, historical patterns, and planned scope — flag projects likely to overrun before they do', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, forecastQuarters: { type: 'number' } } } },
      ],
    },
    {
      agentKey: 'risk',
      agentId: 'risk-agent',
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
      toolMappings: ['risk'],
      tags: ['risk-management', 'compliance', 'mitigation', 'early-warning'],
      palantirObjectTypes: ['AtlasRisk', 'AtlasDependency'],
      memoryNamespace: 'risk',
      skills: [
        { id: 'risk-assessment', name: 'Risk Assessment', description: 'Comprehensive risk assessment with severity scoring', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, riskCategory: { type: 'string', enum: ['technical', 'schedule', 'budget', 'resource', 'external'] } } } },
        { id: 'mitigation-planning', name: 'Mitigation Planning', description: 'Generate risk mitigation strategies and action plans' },
        { id: 'early-warning-scan', name: 'Early Warning Scan', description: 'Proactive scan for emerging risks using Rulebricks threshold rules and cross-project dependency analysis' },
        { id: 'risk-correlation', name: 'Cross-Project Risk Correlation', description: 'Identify correlated risks across projects via AtlasDependency links' },
      ],
    },
    {
      agentKey: 'ocm',
      agentId: 'ocm-agent',
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
      toolMappings: ['ocm'],
      tags: ['change-management', 'adoption', 'stakeholder-management', 'readiness'],
      palantirObjectTypes: ['AtlasPerson', 'AtlasReadinessMetric'],
      memoryNamespace: 'ocm',
      skills: [
        { id: 'change-readiness-assessment', name: 'Change Readiness Assessment', description: 'Assess organizational readiness for change', inputSchema: { type: 'object', properties: { initiativeId: { type: 'string' }, stakeholderGroups: { type: 'array', items: { type: 'string' } } } } },
        { id: 'stakeholder-impact-analysis', name: 'Stakeholder Impact Analysis', description: 'Analyze impact of changes on different stakeholder groups' },
        { id: 'adoption-tracking', name: 'Adoption Tracking', description: 'Track adoption metrics and identify resistance patterns' },
      ],
    },
    {
      agentKey: 'tmo',
      agentId: 'tmo-agent',
      name: 'TMO Agent',
      instructions: `You are the TMO (Transition Management Office) Agent responsible for:
- Transition planning and execution
- Cutover coordination
- Go-live readiness assessment
- Hypercare support planning
- Knowledge transfer tracking
- Service transition to operations
- Adoption curve tracking and transformation fatigue detection

Ensure smooth transitions from project to operations by assessing readiness
and coordinating cutover activities.`,
      toolMappings: ['tmo'],
      tags: ['transition-management', 'go-live', 'cutover', 'hypercare'],
      palantirObjectTypes: ['AtlasProject', 'AtlasTransformation'],
      memoryNamespace: 'tmo',
      skills: [
        { id: 'transition-readiness', name: 'Transition Readiness', description: 'Assess readiness for go-live or transition', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, transitionDate: { type: 'string', format: 'date' } } } },
        { id: 'cutover-planning', name: 'Cutover Planning', description: 'Generate cutover plans and checklists' },
        { id: 'hypercare-assessment', name: 'Hypercare Assessment', description: 'Plan and assess hypercare support requirements' },
        { id: 'adoption-curve-tracking', name: 'Adoption Curve Tracking', description: 'Track adoption curves against targets — correlate initiative progress with business outcome metrics and flag transformation fatigue', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
      ],
    },
    {
      agentKey: 'vro',
      agentId: 'vro-agent',
      name: 'VRO Agent',
      instructions: `You are the VRO (Value Realization Office) Agent responsible for:
- Business value tracking
- Benefits realization measurement
- OKR alignment and progress
- Value stream optimization
- ROI validation
- Strategic outcome monitoring
- Investment portfolio recommendations

You have access to tools for value tracking and OKR alignment analysis.
Ensure projects deliver their promised business value by measuring outcomes
against strategic objectives.`,
      toolMappings: ['vro'],
      tags: ['value-realization', 'okr', 'benefits-tracking', 'value-streams'],
      palantirObjectTypes: ['AtlasObjective', 'AtlasKpi', 'AtlasKeyResult'],
      memoryNamespace: 'vro',
      skills: [
        { id: 'value-tracking', name: 'Value Tracking', description: 'Track business value realization against targets using AtlasKpi and AtlasKeyResult data', inputSchema: { type: 'object', properties: { initiativeId: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } } } } },
        { id: 'okr-alignment', name: 'OKR Alignment', description: 'Analyze alignment between projects and strategic OKRs from AtlasObjective data' },
        { id: 'benefits-realization', name: 'Benefits Realization', description: 'Measure actual vs planned business outcomes and benefits realization rate' },
        { id: 'value-stream-mapping', name: 'Value Stream Mapping', description: 'Map value streams across the portfolio — identify bottlenecks, waste, and flow efficiency' },
        { id: 'investment-recommendations', name: 'Investment Recommendations', description: 'Generate investment portfolio recommendations — which projects to increase, maintain, reduce, or sunset based on ROI, NPV, and value realization trends', inputSchema: { type: 'object', properties: { portfolioId: { type: 'string' }, investmentThreshold: { type: 'number' } } } },
      ],
    },
    {
      agentKey: 'governance',
      agentId: 'governance-agent',
      name: 'Governance Agent',
      instructions: `You are the Governance Agent responsible for:
- Policy and compliance enforcement
- Checkpoint and gate reviews
- Standards adherence
- Audit trail management
- Regulatory compliance
- Decision documentation
- Policy-as-Code validation

You have access to tools for compliance checking.
Ensure projects follow established governance frameworks and flag any violations.`,
      toolMappings: ['governance'],
      tags: ['governance', 'compliance', 'audit', 'rulebricks', 'palantir-actions'],
      palantirObjectTypes: ['AtlasGovernanceCheckpoint'],
      memoryNamespace: 'governance',
      rulebricksRules: ['budget-alert', 'compliance-alert', 'risk-alert'],
      skills: [
        { id: 'compliance-check', name: 'Compliance Check', description: 'Check project compliance with governance standards (SAFe, PMBOK, PRINCE2)', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, framework: { type: 'string', enum: ['safe', 'pmbok', 'prince2', 'custom'] } } } },
        { id: 'gate-review', name: 'Gate Review', description: 'Conduct governance gate review using AtlasGovernanceCheckpoint data with go/no-go recommendations' },
        { id: 'audit-preparation', name: 'Audit Preparation', description: 'Prepare audit documentation by analyzing governance checkpoints, decision logs, and compliance status' },
        { id: 'evaluate-enterprise-rules', name: 'Enterprise Rules Evaluation', description: 'Evaluate all 16 Rulebricks enterprise rules against a project and trigger Palantir Actions on breach' },
        { id: 'policy-validation', name: 'Policy Validation', description: 'Validate project actions against Policy-as-Code rules — check if proposed changes comply with enterprise governance policies and SOPs', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, action: { type: 'string' }, policyDomain: { type: 'string', enum: ['budget', 'compliance', 'risk', 'change', 'procurement', 'all'] } }, required: ['projectId', 'action'] } },
        { id: 'audit-trail', name: 'Audit Trail Generation', description: 'Generate audit trail report — all significant actions, approvals, agent interventions, and policy checks with timestamps', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } } },
      ],
    },
    {
      agentKey: 'planning',
      agentId: 'planning-agent',
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
      toolMappings: ['planning'],
      tags: ['strategic-planning', 'roadmapping', 'forecasting', 'wsjf'],
      palantirObjectTypes: ['AtlasObjective', 'AtlasKpi'],
      memoryNamespace: 'planning',
      skills: [
        { id: 'roadmap-analysis', name: 'Roadmap Analysis', description: 'Analyze and optimize strategic roadmaps across value streams', inputSchema: { type: 'object', properties: { portfolioId: { type: 'string' }, horizon: { type: 'string', enum: ['quarterly', 'annual', 'multi-year'] } } } },
        { id: 'scenario-modeling', name: 'Scenario Modeling', description: 'What-if analysis for budget changes, timeline shifts, resource reallocation, or scope changes' },
        { id: 'capacity-forecasting', name: 'Capacity Forecasting', description: 'Forecast resource capacity and demand — identify future bottlenecks and hiring needs' },
        { id: 'wsjf-prioritization', name: 'WSJF Prioritization', description: 'Calculate Weighted Shortest Job First scores for SAFe backlog prioritization' },
      ],
    },
    {
      agentKey: 'integrated',
      agentId: 'integrated-agent',
      name: 'Integrated Management Agent',
      instructions: `You are the Integrated Management Agent responsible for:
- Cross-functional portfolio health monitoring
- Portfolio-wide health dashboards aggregating all 22 SAFe projects
- Cross-project impact analysis via dependency chains
- Unified reporting across all agent domains
- Escalation coordination between domain agents
- Executive insight synthesis and briefings
- What-if simulation with agent re-run
- Write-back to source PPM systems

You have a holistic view across all agents and data sources. Use Palantir Foundry
as the single source of truth for all project data.`,
      toolMappings: ['integrated'],
      tags: ['cross-functional', 'portfolio-health', 'impact-analysis', 'unified-reporting', 'simulation', 'write-back'],
      palantirObjectTypes: ['AtlasProject', 'AtlasDependency', 'AtlasInsight'],
      memoryNamespace: 'integrated',
      skills: [
        { id: 'portfolio-health', name: 'Portfolio Health Dashboard', description: 'Comprehensive portfolio health summary across all 22 SAFe projects from Palantir Foundry', inputSchema: { type: 'object', properties: { valueStream: { type: 'string' } } } },
        { id: 'cross-project-impact', name: 'Cross-Project Impact Analysis', description: 'Analyze how changes in one project cascade to others via dependency chains', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, changeType: { type: 'string', enum: ['schedule-delay', 'budget-cut', 'scope-change', 'resource-change'] } }, required: ['projectId', 'changeType'] } },
        { id: 'executive-insight-synthesis', name: 'Executive Insight Synthesis', description: 'Generate executive leadership briefing — cross-agent pattern correlation across financial, operational, compliance, and change management with quantified impacts', inputSchema: { type: 'object', properties: { focus: { type: 'string', enum: ['strategic', 'financial', 'risk', 'delivery', 'comprehensive'] }, division: { type: 'string' } } } },
        { id: 'what-if-simulation', name: 'What-If Simulation', description: 'Run what-if simulation — modify portfolio variables (budgets, timelines, resources, scope) and preview how changes propagate across the portfolio', inputSchema: { type: 'object', properties: { scenarioName: { type: 'string' }, changes: { type: 'array' } }, required: ['scenarioName', 'changes'] } },
        { id: 'write-back', name: 'Write-Back to Source Systems', description: 'Push governed changes back to source PPM systems (Jira, OpenProject, Monday.com, Confluence) via MCP write-back API', inputSchema: { type: 'object', properties: { targetSystem: { type: 'string', enum: ['jira', 'openproject', 'monday', 'confluence'] }, entityType: { type: 'string', enum: ['project', 'epic', 'insight', 'risk', 'task'] }, action: { type: 'string', enum: ['create', 'update', 'comment'] }, projectId: { type: 'string' } }, required: ['targetSystem', 'entityType', 'action', 'projectId'] } },
      ],
    },
    {
      agentKey: 'okr',
      agentId: 'okr-agent',
      name: 'OKR Inference Agent',
      instructions: `You are the OKR Inference Agent responsible for:
- Strategic objective and key result tracking via AtlasObjective, AtlasKpi, AtlasKeyResult
- OKR gap detection — finding objectives with no supporting projects
- KPI trend analysis and forecasting
- Alignment scoring between execution and strategy
- Inferring missing OKR linkages from project data
- Orphaned project detection

Ensure strategic objectives are supported by execution and flag gaps early.`,
      toolMappings: ['okr'],
      tags: ['okr-inference', 'kpi-trends', 'strategic-alignment', 'gap-detection'],
      palantirObjectTypes: ['AtlasObjective', 'AtlasKpi', 'AtlasKeyResult'],
      memoryNamespace: 'okr',
      skills: [
        { id: 'okr-gap-detection', name: 'OKR Gap Detection', description: 'Detect gaps between strategic OKRs and project execution — find objectives with no supporting projects' },
        { id: 'kpi-trend-analysis', name: 'KPI Trend Analysis', description: 'Analyze KPI trends from AtlasKpi data — detect trajectory changes and forecast target achievement', inputSchema: { type: 'object', properties: { kpiId: { type: 'string' }, projectId: { type: 'string' } } } },
        { id: 'orphaned-project-detection', name: 'Orphaned Project Detection', description: 'Detect orphaned projects — work not linked to any strategic objective or OKR — and alignment drift where key results have degraded over quarters' },
      ],
    },
    {
      agentKey: 'notification',
      agentId: 'notification-agent',
      name: 'Notification Agent',
      instructions: `You are the Notification Agent — the single A2A gateway for all human-in-the-loop (HITL) interactions:
- Route approval requests to appropriate stakeholders
- Escalate critical alerts via Palantir Actions
- Manage HITL approval workflows
- Broadcast important facts to subscribed agents
- Coordinate notifications across email (SendGrid), Slack, Teams, and in-app WebSocket
- Trigger cascade workflows across multiple agents
- Deduplicate overlapping findings and prioritize by severity

You are the bridge between autonomous agent decisions and human oversight.
All external notifications flow through you.`,
      toolMappings: ['notification'],
      tags: ['hitl', 'approvals', 'alerts', 'escalation', 'a2a-gateway', 'cascade'],
      palantirObjectTypes: ['AtlasPerson', 'AtlasRisk', 'AtlasInsight', 'AtlasRouteAlert'],
      memoryNamespace: 'notification',
      factSubscriptions: ['alert', 'approval-request', 'escalation', 'hitl-request', 'budget-breach', 'risk-escalation', 'compliance-violation', 'schedule-slip', 'readiness-drop', 'value-gap'],
      a2aMessageTypes: ['query', 'response', 'insight', 'alert', 'handoff', 'request'],
      skills: [
        { id: 'hitl-approval-request', name: 'HITL Approval Request', description: 'Submit human-in-the-loop approval request — routes to appropriate stakeholder for decision', inputSchema: { type: 'object', properties: { requestType: { type: 'string', enum: ['budget-approval', 'risk-acceptance', 'scope-change', 'go-live', 'escalation'] }, projectId: { type: 'string' }, description: { type: 'string' }, urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } }, required: ['requestType', 'projectId', 'description'] } },
        { id: 'cascade-workflow', name: 'Cascade Workflow', description: 'Trigger pre-defined multi-agent cascade workflow — e.g. Budget Reduction Cascade sequences through FinOps → VRO → TMO → Planning → Governance automatically', inputSchema: { type: 'object', properties: { cascadeType: { type: 'string', enum: ['budget-reduction', 'risk-escalation', 'compliance-breach', 'schedule-slip', 'go-live-readiness'] }, projectId: { type: 'string' }, trigger: { type: 'string' } }, required: ['cascadeType', 'projectId', 'trigger'] } },
        { id: 'notification-routing', name: 'Notification Routing & Deduplication', description: 'Deduplicate overlapping agent findings, prioritize by severity and organizational impact, route notifications to stakeholders via email, Slack, Teams, or in-app', inputSchema: { type: 'object', properties: { findings: { type: 'array' }, channel: { type: 'string', enum: ['email', 'slack', 'teams', 'in-app', 'auto'] } }, required: ['findings'] } },
      ],
    },
  ];

  for (const agent of defaults) {
    try {
      await storage.db.insert(dynamicAgents).values({
        agentKey: agent.agentKey,
        agentId: agent.agentId,
        name: agent.name,
        instructions: agent.instructions,
        model: DEFAULT_MODEL,
        enabled: true,
        skills: JSON.stringify(agent.skills),
        toolMappings: JSON.stringify(agent.toolMappings),
        tags: JSON.stringify(agent.tags),
        palantirObjectTypes: JSON.stringify(agent.palantirObjectTypes || []),
        rulebricksRules: JSON.stringify(agent.rulebricksRules || []),
        a2aMessageTypes: JSON.stringify(agent.a2aMessageTypes || []),
        memoryNamespace: agent.memoryNamespace,
        factSubscriptions: JSON.stringify(agent.factSubscriptions || []),
      }).execute();
      console.log(`[DynamicAgentLoader] Seeded: ${agent.name}`);
    } catch (error: any) {
      console.error(`[DynamicAgentLoader] Failed to seed ${agent.name}:`, error.message);
    }
  }

  console.log(`[DynamicAgentLoader] ✅ Seeded ${defaults.length} default agents`);
}
