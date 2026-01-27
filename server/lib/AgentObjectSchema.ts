/**
 * AGENT OBJECT SCHEMAS
 *
 * Agents are objects with predefined attributes and functions.
 * This is the 80% - standard attributes every agent type should have.
 * Users can customize the remaining 20%.
 *
 * Like a brain: Agents = Neurons, Attributes = Synapses, Signals = Facts
 */

export interface AgentAttribute {
  name: string;
  label: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  unit?: string;
  defaultValue?: any;
  required: boolean;
  category: 'produces' | 'consumes' | 'bidirectional';
  calculatedBy?: 'llm' | 'database' | 'api'; // How this attribute gets its value
  llmPromptTemplate?: string; // If calculatedBy === 'llm'
}

export interface AgentFunction {
  name: string;
  label: string;
  description: string;
  trigger: 'scheduled' | 'event' | 'manual';
  frequency?: string; // For scheduled: 'daily', 'weekly', etc.
  outputs: string[]; // Attribute names this function produces
}

export interface AgentObjectSchema {
  agentType: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;

  // Predefined attributes (80%)
  produces: AgentAttribute[]; // Attributes this agent CREATES
  consumes: AgentAttribute[]; // Attributes this agent NEEDS from others

  // Predefined functions (standard actions)
  functions: AgentFunction[];

  // Dashboard metrics (what shows on agent's dashboard)
  dashboardMetrics: string[]; // Attribute names

  // Default notifications/alerts
  defaultAlerts: {
    condition: string; // e.g., "budget_variance > 0.20"
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    notifyAgents: string[]; // Which agents to notify
  }[];
}

/**
 * COMPANY AGENT
 * The company itself is an agent with top-level attributes
 */
export const COMPANY_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'company',
  displayName: 'Company',
  description: 'Company-level attributes and strategic data',
  icon: '🏢',
  color: '#1a1a1a',

  produces: [
    {
      name: 'company_name',
      label: 'Company Name',
      description: 'Legal name of the company',
      dataType: 'string',
      required: true,
      category: 'produces'
    },
    {
      name: 'company_address',
      label: 'Company Address',
      description: 'Primary business address',
      dataType: 'string',
      required: false,
      category: 'produces'
    },
    {
      name: 'annual_revenue',
      label: 'Annual Revenue',
      description: 'Total annual revenue',
      dataType: 'number',
      unit: 'currency',
      required: false,
      category: 'produces'
    },
    {
      name: 'annual_report_data',
      label: 'Annual Report Data',
      description: 'Extracted data from annual report',
      dataType: 'object',
      required: false,
      category: 'produces'
    },
    {
      name: 'strategic_goals',
      label: 'Strategic Goals',
      description: 'Company-wide strategic objectives',
      dataType: 'array',
      required: false,
      category: 'produces'
    },
    {
      name: 'industry',
      label: 'Industry',
      description: 'Primary industry classification',
      dataType: 'string',
      required: false,
      category: 'produces'
    }
  ],

  consumes: [], // Company doesn't consume from other agents

  functions: [
    {
      name: 'load_annual_report',
      label: 'Load Annual Report',
      description: 'Extract data from annual report PDF',
      trigger: 'manual',
      outputs: ['annual_report_data', 'strategic_goals']
    }
  ],

  dashboardMetrics: ['annual_revenue', 'strategic_goals'],

  defaultAlerts: []
};

/**
 * PMO AGENT (Project Management Office)
 */
export const PMO_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'pmo',
  displayName: 'PMO Agent',
  description: 'Project portfolio oversight and governance',
  icon: '📊',
  color: '#3b82f6',

  produces: [
    {
      name: 'project_health_score',
      label: 'Project Health Score',
      description: 'Overall health score (0-100)',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate holistic project health considering budget, schedule, risk, quality, and stakeholder satisfaction'
    },
    {
      name: 'wip_score',
      label: 'WIP Score',
      description: 'Work In Progress efficiency score',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate WIP score based on active tasks, blocked tasks, team capacity, and workflow efficiency'
    },
    {
      name: 'portfolio_health',
      label: 'Portfolio Health',
      description: 'Aggregated portfolio health status',
      dataType: 'string',
      required: true,
      category: 'produces'
    },
    {
      name: 'dependency_risks',
      label: 'Dependency Risks',
      description: 'Cross-project dependency issues',
      dataType: 'array',
      required: true,
      category: 'produces'
    },
    {
      name: 'resource_conflicts',
      label: 'Resource Conflicts',
      description: 'Resource allocation conflicts',
      dataType: 'array',
      required: true,
      category: 'produces'
    },
    {
      name: 'quality_metrics',
      label: 'Quality Metrics',
      description: 'Quality and predictability scores',
      dataType: 'object',
      required: true,
      category: 'produces'
    }
  ],

  consumes: [
    {
      name: 'budget_variance',
      label: 'Budget Variance',
      description: 'Budget variance from FinOps',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'consumes'
    },
    {
      name: 'schedule_delay',
      label: 'Schedule Delay',
      description: 'Schedule delays from TMO',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'consumes'
    },
    {
      name: 'risk_score',
      label: 'Risk Score',
      description: 'Risk score from Risk agent',
      dataType: 'number',
      required: true,
      category: 'consumes'
    },
    {
      name: 'value_score',
      label: 'Value Score',
      description: 'Value realization from VRO',
      dataType: 'number',
      required: true,
      category: 'consumes'
    },
    {
      name: 'strategic_alignment',
      label: 'Strategic Alignment',
      description: 'Strategic alignment from Planning',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'consumes'
    },
    {
      name: 'compliance_status',
      label: 'Compliance Status',
      description: 'Compliance from Governance',
      dataType: 'string',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'generate_portfolio_report',
      label: 'Generate Portfolio Report',
      description: 'Create weekly portfolio health report',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['portfolio_health']
    },
    {
      name: 'detect_dependency_risks',
      label: 'Detect Dependency Risks',
      description: 'Analyze cross-project dependencies',
      trigger: 'event',
      outputs: ['dependency_risks']
    },
    {
      name: 'calculate_health_score',
      label: 'Calculate Health Score',
      description: 'Calculate project health score',
      trigger: 'scheduled',
      frequency: 'daily',
      outputs: ['project_health_score']
    }
  ],

  dashboardMetrics: [
    'portfolio_health',
    'project_health_score',
    'dependency_risks',
    'resource_conflicts',
    'quality_metrics'
  ],

  defaultAlerts: [
    {
      condition: 'project_health_score < 60',
      severity: 'critical',
      message: 'Project health critically low',
      notifyAgents: ['governance', 'planning']
    },
    {
      condition: 'dependency_risks.length > 3',
      severity: 'high',
      message: 'Multiple dependency risks detected',
      notifyAgents: ['planning', 'tmo']
    }
  ]
};

/**
 * FINOPS AGENT
 */
export const FINOPS_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'finops',
  displayName: 'FinOps Agent',
  description: 'Financial operations and budget management',
  icon: '💰',
  color: '#10b981',

  produces: [
    {
      name: 'budget_variance',
      label: 'Budget Variance',
      description: 'Percentage over/under budget',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces'
    },
    {
      name: 'burn_rate',
      label: 'Burn Rate',
      description: 'Rate of budget consumption',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces'
    },
    {
      name: 'cost_forecast',
      label: 'Cost Forecast',
      description: 'Projected final cost',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces'
    },
    {
      name: 'remaining_budget',
      label: 'Remaining Budget',
      description: 'Budget remaining',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces'
    }
  ],

  consumes: [
    {
      name: 'schedule_delay',
      label: 'Schedule Delay',
      description: 'Schedule impacts from TMO',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'consumes'
    },
    {
      name: 'risk_score',
      label: 'Risk Score',
      description: 'Financial risk from Risk agent',
      dataType: 'number',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'calculate_budget_variance',
      label: 'Calculate Budget Variance',
      description: 'Calculate budget variance and trends',
      trigger: 'scheduled',
      frequency: 'daily',
      outputs: ['budget_variance', 'burn_rate']
    },
    {
      name: 'forecast_costs',
      label: 'Forecast Costs',
      description: 'Forecast final project costs',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['cost_forecast']
    }
  ],

  dashboardMetrics: ['budget_variance', 'burn_rate', 'cost_forecast', 'remaining_budget'],

  defaultAlerts: [
    {
      condition: 'budget_variance > 0.20',
      severity: 'critical',
      message: 'Budget overrun exceeds 20%',
      notifyAgents: ['pmo', 'tmo', 'vro']
    },
    {
      condition: 'burn_rate > 1.2',
      severity: 'high',
      message: 'High burn rate detected',
      notifyAgents: ['pmo', 'tmo']
    }
  ]
};

/**
 * TMO AGENT (Technical Management Office)
 */
export const TMO_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'tmo',
  displayName: 'TMO Agent',
  description: 'Schedule and timeline management',
  icon: '📅',
  color: '#f59e0b',

  produces: [
    {
      name: 'schedule_delay',
      label: 'Schedule Delay',
      description: 'Days behind schedule',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces'
    },
    {
      name: 'spi',
      label: 'Schedule Performance Index',
      description: 'SPI (Earned Value)',
      dataType: 'number',
      required: true,
      category: 'produces'
    },
    {
      name: 'critical_path_risk',
      label: 'Critical Path Risk',
      description: 'Critical path at risk',
      dataType: 'boolean',
      required: true,
      category: 'produces'
    },
    {
      name: 'milestone_status',
      label: 'Milestone Status',
      description: 'Status of key milestones',
      dataType: 'array',
      required: true,
      category: 'produces'
    }
  ],

  consumes: [
    {
      name: 'budget_variance',
      label: 'Budget Variance',
      description: 'Budget status from FinOps',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'consumes'
    },
    {
      name: 'resource_conflicts',
      label: 'Resource Conflicts',
      description: 'Resource issues from PMO',
      dataType: 'array',
      required: true,
      category: 'consumes'
    },
    {
      name: 'dependency_risks',
      label: 'Dependency Risks',
      description: 'Dependencies from PMO',
      dataType: 'array',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'calculate_schedule_variance',
      label: 'Calculate Schedule Variance',
      description: 'Calculate schedule delays',
      trigger: 'scheduled',
      frequency: 'daily',
      outputs: ['schedule_delay', 'spi']
    },
    {
      name: 'analyze_critical_path',
      label: 'Analyze Critical Path',
      description: 'Check critical path risks',
      trigger: 'event',
      outputs: ['critical_path_risk']
    }
  ],

  dashboardMetrics: ['schedule_delay', 'spi', 'critical_path_risk', 'milestone_status'],

  defaultAlerts: [
    {
      condition: 'schedule_delay > 10',
      severity: 'critical',
      message: 'Schedule delay exceeds 10 days',
      notifyAgents: ['pmo', 'finops', 'planning']
    },
    {
      condition: 'critical_path_risk === true',
      severity: 'critical',
      message: 'Critical path at risk',
      notifyAgents: ['pmo', 'planning']
    }
  ]
};

/**
 * All agent schemas
 */
export const AGENT_SCHEMAS: Record<string, AgentObjectSchema> = {
  company: COMPANY_AGENT_SCHEMA,
  pmo: PMO_AGENT_SCHEMA,
  finops: FINOPS_AGENT_SCHEMA,
  tmo: TMO_AGENT_SCHEMA,
  // Add more as we define them...
};

/**
 * Get agent schema by type
 */
export function getAgentSchema(agentType: string): AgentObjectSchema | null {
  return AGENT_SCHEMAS[agentType] || null;
}

/**
 * Get all attribute dependencies (who produces what, who consumes what)
 */
export function getAttributeDependencies(): Map<string, { producers: string[], consumers: string[] }> {
  const dependencies = new Map<string, { producers: string[], consumers: string[] }>();

  for (const [agentType, schema] of Object.entries(AGENT_SCHEMAS)) {
    // Track what this agent produces
    for (const attr of schema.produces) {
      if (!dependencies.has(attr.name)) {
        dependencies.set(attr.name, { producers: [], consumers: [] });
      }
      dependencies.get(attr.name)!.producers.push(agentType);
    }

    // Track what this agent consumes
    for (const attr of schema.consumes) {
      if (!dependencies.has(attr.name)) {
        dependencies.set(attr.name, { producers: [], consumers: [] });
      }
      dependencies.get(attr.name)!.consumers.push(agentType);
    }
  }

  return dependencies;
}

/**
 * Discover agent relationships from attribute dependencies
 * Example: FinOps produces budget_variance, PMO consumes budget_variance
 *          → FinOps → PMO relationship exists
 */
export function discoverAgentRelationships(): Array<{ from: string, to: string, via: string }> {
  const relationships: Array<{ from: string, to: string, via: string }> = [];
  const dependencies = getAttributeDependencies();

  for (const [attributeName, { producers, consumers }] of dependencies) {
    for (const producer of producers) {
      for (const consumer of consumers) {
        relationships.push({
          from: producer,
          to: consumer,
          via: attributeName
        });
      }
    }
  }

  return relationships;
}
