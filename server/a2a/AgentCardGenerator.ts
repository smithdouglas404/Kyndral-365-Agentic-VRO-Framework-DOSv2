/**
 * AGENT CARD GENERATOR
 *
 * Generates A2A Agent Cards from existing Deep Agent configurations.
 * Creates standardized metadata for agent discovery and interoperability.
 */

import type { AgentCard, AgentSkill, AgentInterface, SecurityScheme } from './types.js';
import { getAgentConfigs } from '../mastra/index.js';

type AgentType = 'pmo' | 'finops' | 'risk' | 'ocm' | 'tmo' | 'vro' | 'governance' | 'planning';

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
      description: 'Comprehensive analysis of project health metrics including schedule, budget, and resource utilization',
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
      description: 'Analyze cross-project dependencies and potential blockers',
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
      description: 'Analyze team capacity and resource allocation',
    },
  ],
  finops: [
    {
      id: 'budget-variance-analysis',
      name: 'Budget Variance Analysis',
      description: 'Analyze budget vs actual spending and identify variances',
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
      description: 'Identify cost saving opportunities and optimization recommendations',
    },
    {
      id: 'roi-calculation',
      name: 'ROI Calculation',
      description: 'Calculate return on investment for projects or initiatives',
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
      description: 'Proactive scan for emerging risks and issues',
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
      description: 'Track business value realization against targets',
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
      description: 'Analyze alignment between projects and strategic OKRs',
    },
    {
      id: 'benefits-realization',
      name: 'Benefits Realization',
      description: 'Measure and report on benefits realization',
    },
  ],
  governance: [
    {
      id: 'compliance-check',
      name: 'Compliance Check',
      description: 'Check project compliance with governance standards',
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
      description: 'Conduct governance gate review and provide recommendations',
    },
    {
      id: 'audit-preparation',
      name: 'Audit Preparation',
      description: 'Prepare documentation and evidence for audits',
    },
  ],
  planning: [
    {
      id: 'roadmap-analysis',
      name: 'Roadmap Analysis',
      description: 'Analyze and optimize strategic roadmaps',
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
      description: 'Create and analyze planning scenarios',
    },
    {
      id: 'capacity-forecasting',
      name: 'Capacity Forecasting',
      description: 'Forecast resource capacity and demand',
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
    pmo: ['project-management', 'resource-planning', 'safe-6.0'],
    finops: ['financial-operations', 'cost-optimization', 'budgeting'],
    risk: ['risk-management', 'compliance', 'mitigation'],
    ocm: ['change-management', 'adoption', 'stakeholder-management'],
    tmo: ['transition-management', 'go-live', 'cutover'],
    vro: ['value-realization', 'okr', 'benefits-tracking'],
    governance: ['governance', 'compliance', 'audit'],
    planning: ['strategic-planning', 'roadmapping', 'forecasting'],
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
