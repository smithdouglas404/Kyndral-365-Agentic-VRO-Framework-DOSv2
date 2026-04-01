/**
 * AGENT CARD GENERATOR
 *
 * Generates A2A Agent Cards from existing Deep Agent configurations.
 * Creates standardized metadata for agent discovery and interoperability.
 */

import type { AgentCard, AgentSkill, AgentInterface, SecurityScheme } from './types.js';
import { getAgentConfigs } from '../mastra/index.js';

type AgentType = 'pmo' | 'finops' | 'risk' | 'ocm' | 'tmo' | 'vro' | 'governance' | 'planning' | 'integrated' | 'okr' | 'notification';

// Base URL for A2A endpoints (will be configured at runtime)
let BASE_URL = process.env.A2A_BASE_URL || 'http://localhost:3000';

export function setA2ABaseUrl(url: string) {
  BASE_URL = url;
}

/**
 * Agent skill definitions mapped from Deep Agent capabilities
 */
const AGENT_SKILLS: Record<AgentType, AgentSkill[]> = {
  pmo: [
    {
      id: 'analyze-project-health',
      name: 'Analyze Project Health',
      description: 'Comprehensive analysis of project health metrics including schedule, budget, and resource utilization from Palantir AtlasProject data',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project identifier' },
          includeHistory: { type: 'boolean', description: 'Include historical trends' },
        },
        required: ['projectId'],
      },
    },
    {
      id: 'identify-dependencies',
      name: 'Identify Dependencies',
      description: 'Analyze cross-project dependencies and potential blockers via AtlasDependency objects',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          depth: { type: 'number', description: 'Dependency chain depth to analyze' },
        },
      },
    },
    {
      id: 'resource-capacity-analysis',
      name: 'Resource Capacity Analysis',
      description: 'Analyze team capacity, resource allocation, and utilization across projects using Palantir AtlasTeam data',
    },
    {
      id: 'safe-pi-planning',
      name: 'SAFe PI Planning',
      description: 'Analyze SAFe Program Increment planning — feature completion, velocity, predictability across the 22 SAFe projects',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          piId: { type: 'string', description: 'Program Increment identifier (e.g. PI-2024-Q1)' },
        },
      },
    },
    {
      id: 'milestone-tracking',
      name: 'Milestone Tracking',
      description: 'Track milestone progress, schedule variance, and upcoming deadlines from Palantir milestoneProgress data',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
        },
        required: ['projectId'],
      },
    },
  ],
  finops: [
    {
      id: 'budget-variance-analysis',
      name: 'Budget Variance Analysis',
      description: 'Analyze budget vs actual spending using AtlasBudget and AtlasFinancialRecord data',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          period: { type: 'string', enum: ['monthly', 'quarterly', 'ytd'] },
        },
      },
    },
    {
      id: 'cost-optimization',
      name: 'Cost Optimization',
      description: 'Identify cost saving opportunities across cloud, vendor, and resource spending',
    },
    {
      id: 'roi-calculation',
      name: 'ROI Calculation',
      description: 'Calculate return on investment including NPV and payback period',
    },
    {
      id: 'burn-rate-forecast',
      name: 'Burn Rate Forecast',
      description: 'Forecast budget burn rate and estimated completion cost from Palantir financial data',
    },
    {
      id: 'earned-value-analysis',
      name: 'Earned Value Analysis',
      description: 'Calculate earned value metrics (CPI, SPI, EV, PV, AC) for cost and schedule performance',
    },
  ],
  risk: [
    {
      id: 'risk-assessment',
      name: 'Risk Assessment',
      description: 'Comprehensive risk assessment with severity scoring',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          riskCategory: { type: 'string', enum: ['technical', 'schedule', 'budget', 'resource', 'external'] },
        },
      },
    },
    {
      id: 'mitigation-planning',
      name: 'Mitigation Planning',
      description: 'Generate risk mitigation strategies and action plans',
    },
    {
      id: 'early-warning-scan',
      name: 'Early Warning Scan',
      description: 'Proactive scan for emerging risks using Rulebricks threshold rules and cross-project dependency analysis',
    },
    {
      id: 'risk-correlation',
      name: 'Cross-Project Risk Correlation',
      description: 'Identify correlated risks across projects via AtlasDependency links',
    },
  ],
  ocm: [
    {
      id: 'change-readiness-assessment',
      name: 'Change Readiness Assessment',
      description: 'Assess organizational readiness for change',
      inputSchema: {
        type: 'object',
        properties: {
          initiativeId: { type: 'string' },
          stakeholderGroups: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    {
      id: 'stakeholder-impact-analysis',
      name: 'Stakeholder Impact Analysis',
      description: 'Analyze impact of changes on different stakeholder groups',
    },
    {
      id: 'adoption-tracking',
      name: 'Adoption Tracking',
      description: 'Track adoption metrics and identify resistance patterns',
    },
  ],
  tmo: [
    {
      id: 'transition-readiness',
      name: 'Transition Readiness',
      description: 'Assess readiness for go-live or transition',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          transitionDate: { type: 'string', format: 'date' },
        },
      },
    },
    {
      id: 'cutover-planning',
      name: 'Cutover Planning',
      description: 'Generate cutover plans and checklists',
    },
    {
      id: 'hypercare-assessment',
      name: 'Hypercare Assessment',
      description: 'Plan and assess hypercare support requirements',
    },
  ],
  vro: [
    {
      id: 'value-tracking',
      name: 'Value Tracking',
      description: 'Track business value realization against targets using AtlasKpi and AtlasKeyResult data',
      inputSchema: {
        type: 'object',
        properties: {
          initiativeId: { type: 'string' },
          metrics: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    {
      id: 'okr-alignment',
      name: 'OKR Alignment',
      description: 'Analyze alignment between projects and strategic OKRs from AtlasObjective data',
    },
    {
      id: 'benefits-realization',
      name: 'Benefits Realization',
      description: 'Measure actual vs planned business outcomes and benefits realization rate',
    },
    {
      id: 'value-stream-mapping',
      name: 'Value Stream Mapping',
      description: 'Map value streams across the portfolio — identify bottlenecks, waste, and flow efficiency',
    },
  ],
  governance: [
    {
      id: 'compliance-check',
      name: 'Compliance Check',
      description: 'Check project compliance with governance standards (SAFe, PMBOK, PRINCE2)',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          framework: { type: 'string', enum: ['safe', 'pmbok', 'prince2', 'custom'] },
        },
      },
    },
    {
      id: 'gate-review',
      name: 'Gate Review',
      description: 'Conduct governance gate review using AtlasGovernanceCheckpoint data with go/no-go recommendations',
    },
    {
      id: 'audit-preparation',
      name: 'Audit Preparation',
      description: 'Prepare audit documentation by analyzing governance checkpoints, decision logs, and compliance status',
    },
    {
      id: 'evaluate-enterprise-rules',
      name: 'Enterprise Rules Evaluation',
      description: 'Evaluate all 16 Rulebricks enterprise rules against a project and trigger Palantir Actions on breach',
    },
  ],
  planning: [
    {
      id: 'roadmap-analysis',
      name: 'Roadmap Analysis',
      description: 'Analyze and optimize strategic roadmaps across value streams',
      inputSchema: {
        type: 'object',
        properties: {
          portfolioId: { type: 'string' },
          horizon: { type: 'string', enum: ['quarterly', 'annual', 'multi-year'] },
        },
      },
    },
    {
      id: 'scenario-modeling',
      name: 'Scenario Modeling',
      description: 'What-if analysis for budget changes, timeline shifts, resource reallocation, or scope changes',
    },
    {
      id: 'capacity-forecasting',
      name: 'Capacity Forecasting',
      description: 'Forecast resource capacity and demand — identify future bottlenecks and hiring needs',
    },
    {
      id: 'wsjf-prioritization',
      name: 'WSJF Prioritization',
      description: 'Calculate Weighted Shortest Job First scores for SAFe backlog prioritization',
    },
  ],
  integrated: [
    {
      id: 'portfolio-health',
      name: 'Portfolio Health Dashboard',
      description: 'Comprehensive portfolio health summary across all 22 SAFe projects from Palantir Foundry',
      inputSchema: {
        type: 'object',
        properties: {
          valueStream: { type: 'string', description: 'Filter by value stream (e.g. vs-digital-platform)' },
        },
      },
    },
    {
      id: 'cross-project-impact',
      name: 'Cross-Project Impact Analysis',
      description: 'Analyze how changes in one project cascade to others via dependency chains',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          changeType: { type: 'string', enum: ['schedule-delay', 'budget-cut', 'scope-change', 'resource-change'] },
        },
        required: ['projectId', 'changeType'],
      },
    },
  ],
  okr: [
    {
      id: 'okr-gap-detection',
      name: 'OKR Gap Detection',
      description: 'Detect gaps between strategic OKRs and project execution — find objectives with no supporting projects',
    },
    {
      id: 'kpi-trend-analysis',
      name: 'KPI Trend Analysis',
      description: 'Analyze KPI trends from AtlasKpi data — detect trajectory changes and forecast target achievement',
      inputSchema: {
        type: 'object',
        properties: {
          kpiId: { type: 'string' },
          projectId: { type: 'string' },
        },
      },
    },
  ],
  notification: [
    {
      id: 'hitl-approval-request',
      name: 'HITL Approval Request',
      description: 'Submit human-in-the-loop approval request — routes to appropriate stakeholder for decision',
      inputSchema: {
        type: 'object',
        properties: {
          requestType: { type: 'string', enum: ['budget-approval', 'risk-acceptance', 'scope-change', 'go-live', 'escalation'] },
          projectId: { type: 'string' },
          description: { type: 'string' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        },
        required: ['requestType', 'projectId', 'description'],
      },
    },
  ],
};

/**
 * Generate Agent Card for a specific agent type
 */
export function generateAgentCard(agentType: AgentType): AgentCard {
  const configs = getAgentConfigs();
  const config = configs[agentType];
  const skills = AGENT_SKILLS[agentType] || [];

  const agentCard: AgentCard = {
    id: config.id,
    name: config.name,
    description: extractDescription(config.instructions),
    version: '1.0.0',

    provider: {
      name: 'NextEra Energy ETO/VRO Platform',
      url: BASE_URL,
    },

    capabilities: {
      streaming: true,
      pushNotifications: true,
      extendedAgentCard: false,
      multiModal: false,
      humanInTheLoop: true, // Deep agents support HITL via interventions
    },

    skills,

    interfaces: [
      {
        type: 'http',
        baseUrl: `${BASE_URL}/api/a2a/agents/${agentType}`,
        version: 'v1',
      },
    ],

    securitySchemes: [
      {
        type: 'bearer',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    ],

    tags: getAgentTags(agentType),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return agentCard;
}

/**
 * Generate Agent Cards for all agents
 */
export function generateAllAgentCards(): Record<AgentType, AgentCard> {
  const cards: Partial<Record<AgentType, AgentCard>> = {};
  const configs = getAgentConfigs();

  for (const agentType of Object.keys(configs) as AgentType[]) {
    cards[agentType] = generateAgentCard(agentType);
  }

  return cards as Record<AgentType, AgentCard>;
}

/**
 * Extract a clean description from agent instructions
 */
function extractDescription(instructions: string): string {
  // Get the first line after "responsible for:"
  const match = instructions.match(/responsible for:\s*\n-\s*([^\n]+)/);
  if (match) {
    return match[1].trim();
  }

  // Fallback: get first sentence
  const firstSentence = instructions.split('.')[0];
  return firstSentence.replace(/^You are the \w+ Agent\s*/, '').trim();
}

/**
 * Get tags for agent categorization
 */
function getAgentTags(agentType: AgentType): string[] {
  const baseTags = ['enterprise', 'portfolio-management', 'ai-agent'];

  const specificTags: Record<AgentType, string[]> = {
    pmo: ['project-management', 'resource-planning', 'safe-6.0', 'palantir-foundry'],
    finops: ['financial-operations', 'cost-optimization', 'budgeting', 'earned-value'],
    risk: ['risk-management', 'compliance', 'mitigation', 'early-warning'],
    ocm: ['change-management', 'adoption', 'stakeholder-management', 'readiness'],
    tmo: ['transition-management', 'go-live', 'cutover', 'hypercare'],
    vro: ['value-realization', 'okr', 'benefits-tracking', 'value-streams'],
    governance: ['governance', 'compliance', 'audit', 'rulebricks', 'palantir-actions'],
    planning: ['strategic-planning', 'roadmapping', 'forecasting', 'wsjf'],
    integrated: ['cross-functional', 'portfolio-health', 'impact-analysis', 'unified-reporting'],
    okr: ['okr-inference', 'kpi-trends', 'strategic-alignment', 'gap-detection'],
    notification: ['hitl', 'approvals', 'alerts', 'escalation', 'a2a-gateway'],
  };

  return [...baseTags, ...specificTags[agentType]];
}

/**
 * Serialize Agent Card for publishing at well-known URL
 */
export function serializeAgentCard(card: AgentCard): string {
  return JSON.stringify(card, null, 2);
}

/**
 * Validate Agent Card against A2A spec requirements
 */
export function validateAgentCard(card: AgentCard): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!card.id) errors.push('Missing required field: id');
  if (!card.name) errors.push('Missing required field: name');
  if (!card.description) errors.push('Missing required field: description');
  if (!card.version) errors.push('Missing required field: version');
  if (!card.provider?.name) errors.push('Missing required field: provider.name');
  if (!card.capabilities) errors.push('Missing required field: capabilities');
  if (!card.interfaces?.length) errors.push('Missing required field: interfaces (at least one required)');
  if (!card.securitySchemes?.length) errors.push('Missing required field: securitySchemes (at least one required)');

  // Validate interfaces
  for (const iface of card.interfaces || []) {
    if (!iface.baseUrl) errors.push(`Interface missing baseUrl`);
    if (!['http', 'grpc', 'jsonrpc'].includes(iface.type)) {
      errors.push(`Invalid interface type: ${iface.type}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
