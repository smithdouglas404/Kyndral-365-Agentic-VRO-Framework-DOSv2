/**
 * SAFE 6.0 AGENT SCHEMAS
 *
 * Based on SAFe 6.0 Framework - The Ontology Foundation
 * Comprehensive attributes from SAFe Lean Portfolio Management, ARTs, and Value Streams
 *
 * Key SAFe Concepts:
 * - Lean Portfolio Management (LPM)
 * - Agile Release Trains (ARTs)
 * - Value Streams
 * - Program Increment (PI) Planning
 * - WSJF (Weighted Shortest Job First)
 * - Flow Metrics (Time, Efficiency, Load, Velocity, Distribution)
 */

import type { AgentAttribute, AgentObjectSchema } from './AgentObjectSchema.js';

/**
 * LEAN PORTFOLIO MANAGEMENT (LPM) AGENT
 * SAFe Role: Strategic Themes, Portfolio Canvas, Lean Budget Guardrails
 */
export const LPM_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'lpm',
  displayName: 'Lean Portfolio Management (LPM)',
  description: 'SAFe Lean Portfolio Management - Strategic alignment and budget guardrails',
  icon: '📈',
  color: '#8b5cf6',

  produces: [
    // Strategic Alignment
    {
      name: 'strategic_themes',
      label: 'Strategic Themes',
      description: 'Portfolio-level strategic themes driving investment',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'portfolio_vision',
      label: 'Portfolio Vision',
      description: 'Long-term vision for portfolio',
      dataType: 'string',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'portfolio_canvas',
      label: 'Portfolio Canvas',
      description: 'Complete portfolio canvas (strategy, budget, solutions)',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // Lean Budget Guardrails
    {
      name: 'lean_budget_guardrails',
      label: 'Lean Budget Guardrails',
      description: 'Portfolio budget constraints and allocation rules',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'portfolio_budget',
      label: 'Portfolio Budget',
      description: 'Total portfolio budget allocation',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'value_stream_budgets',
      label: 'Value Stream Budgets',
      description: 'Budget allocation per value stream',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // WSJF and Prioritization
    {
      name: 'epic_wsjf_scores',
      label: 'Epic WSJF Scores',
      description: 'Weighted Shortest Job First scores for portfolio epics',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate WSJF scores: (User-Business Value + Time Criticality + Risk Reduction) / Job Size'
    },
    {
      name: 'portfolio_kanban_state',
      label: 'Portfolio Kanban State',
      description: 'Current state of portfolio kanban (Funnel, Review, Analysis, Backlog, Implementation, Done)',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // Portfolio Flow Metrics
    {
      name: 'portfolio_flow_time',
      label: 'Portfolio Flow Time',
      description: 'Time for epics to move through portfolio kanban',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'portfolio_flow_efficiency',
      label: 'Portfolio Flow Efficiency',
      description: 'Ratio of active time to total time in portfolio',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'portfolio_flow_load',
      label: 'Portfolio Flow Load',
      description: 'Number of epics in progress across portfolio',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // OKRs and KPIs
    {
      name: 'portfolio_okrs',
      label: 'Portfolio OKRs',
      description: 'Objectives and Key Results for portfolio',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'portfolio_kpis',
      label: 'Portfolio KPIs',
      description: 'Key Performance Indicators for portfolio health',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  consumes: [
    {
      name: 'art_predictability',
      label: 'ART Predictability',
      description: 'Predictability scores from all ARTs',
      dataType: 'array',
      required: true,
      category: 'consumes'
    },
    {
      name: 'value_stream_health',
      label: 'Value Stream Health',
      description: 'Health metrics from value streams',
      dataType: 'object',
      required: true,
      category: 'consumes'
    },
    {
      name: 'program_pi_outcomes',
      label: 'Program PI Outcomes',
      description: 'PI outcomes from all programs',
      dataType: 'array',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'calculate_wsjf_scores',
      label: 'Calculate WSJF Scores',
      description: 'Calculate Weighted Shortest Job First for epic prioritization',
      trigger: 'event',
      outputs: ['epic_wsjf_scores']
    },
    {
      name: 'allocate_budgets',
      label: 'Allocate Value Stream Budgets',
      description: 'Allocate portfolio budget to value streams',
      trigger: 'scheduled',
      frequency: 'quarterly',
      outputs: ['value_stream_budgets']
    },
    {
      name: 'assess_portfolio_health',
      label: 'Assess Portfolio Health',
      description: 'Calculate overall portfolio health and flow metrics',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['portfolio_kpis', 'portfolio_flow_efficiency']
    }
  ],

  dashboardMetrics: [
    'portfolio_budget',
    'portfolio_flow_efficiency',
    'portfolio_flow_time',
    'epic_wsjf_scores',
    'portfolio_kpis'
  ],

  defaultAlerts: [
    {
      condition: 'portfolio_flow_efficiency < 0.40',
      severity: 'high',
      message: 'Portfolio flow efficiency below SAFe benchmark (40%)',
      notifyAgents: ['governance', 'vro']
    },
    {
      condition: 'portfolio_flow_load > 15',
      severity: 'critical',
      message: 'Too many epics in flight - reduce WIP',
      notifyAgents: ['planning', 'pmo']
    }
  ]
};

/**
 * AGILE RELEASE TRAIN (ART) AGENT
 * SAFe Role: RTE (Release Train Engineer), PI Planning, ART Sync
 */
export const ART_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'art',
  displayName: 'Agile Release Train (ART)',
  description: 'SAFe ART - Team of Agile teams delivering value in PIs',
  icon: '🚂',
  color: '#06b6d4',

  produces: [
    // PI Planning Outcomes
    {
      name: 'pi_objectives',
      label: 'PI Objectives',
      description: 'Program Increment objectives committed by ART',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'pi_predictability',
      label: 'PI Predictability',
      description: 'Percentage of PI objectives delivered',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate PI predictability: (Actual Business Value / Planned Business Value) * 100'
    },
    {
      name: 'program_board',
      label: 'Program Board',
      description: 'Visual representation of features, dependencies, and milestones',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // Team Metrics
    {
      name: 'team_velocity',
      label: 'Team Velocity',
      description: 'Average story points completed per sprint across teams',
      dataType: 'number',
      unit: 'points',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'team_capacity',
      label: 'Team Capacity',
      description: 'Available capacity across all teams in ART',
      dataType: 'number',
      unit: 'points',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'team_load',
      label: 'Team Load',
      description: 'Current workload vs capacity',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // Dependencies and Risks
    {
      name: 'art_dependencies',
      label: 'ART Dependencies',
      description: 'Cross-team dependencies within ART',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'dependency_health',
      label: 'Dependency Health',
      description: 'Health of cross-team dependencies',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate dependency health based on: resolved dependencies, blocked dependencies, dependency age'
    },
    {
      name: 'art_risks',
      label: 'ART Risks',
      description: 'Program-level risks identified',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'roam_board',
      label: 'ROAM Board',
      description: 'Resolved, Owned, Accepted, Mitigated risks',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // Flow Metrics (SAFe 6.0 Core)
    {
      name: 'art_flow_velocity',
      label: 'ART Flow Velocity',
      description: 'Number of features completed per PI',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'art_flow_time',
      label: 'ART Flow Time',
      description: 'Average time for features to go from backlog to done',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'art_flow_efficiency',
      label: 'ART Flow Efficiency',
      description: 'Active time / Total time for features',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate flow efficiency: (Active Time / Total Flow Time) * 100'
    },
    {
      name: 'art_flow_load',
      label: 'ART Flow Load',
      description: 'Number of features in progress',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'art_flow_distribution',
      label: 'ART Flow Distribution',
      description: 'Distribution of work across feature types',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // Quality and DevOps
    {
      name: 'built_in_quality_score',
      label: 'Built-in Quality Score',
      description: 'Quality metrics: defect density, test coverage, tech debt',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'deployment_frequency',
      label: 'Deployment Frequency',
      description: 'How often code is deployed to production',
      dataType: 'string',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'lead_time_for_changes',
      label: 'Lead Time for Changes',
      description: 'Time from commit to production',
      dataType: 'number',
      unit: 'hours',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'change_failure_rate',
      label: 'Change Failure Rate',
      description: 'Percentage of deployments causing failures',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'mttr',
      label: 'Mean Time to Restore (MTTR)',
      description: 'Average time to recover from failures',
      dataType: 'number',
      unit: 'hours',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // Innovation and Planning
    {
      name: 'innovation_and_planning_ratio',
      label: 'Innovation and Planning Ratio',
      description: 'Percentage of capacity for IP iteration',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  consumes: [
    {
      name: 'portfolio_vision',
      label: 'Portfolio Vision',
      description: 'Strategic direction from LPM',
      dataType: 'string',
      required: true,
      category: 'consumes'
    },
    {
      name: 'epic_wsjf_scores',
      label: 'Epic WSJF Scores',
      description: 'Epic priorities from portfolio',
      dataType: 'array',
      required: true,
      category: 'consumes'
    },
    {
      name: 'value_stream_budgets',
      label: 'Value Stream Budgets',
      description: 'Budget constraints from LPM',
      dataType: 'object',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'run_pi_planning',
      label: 'Run PI Planning',
      description: 'Facilitate Program Increment planning event',
      trigger: 'manual',
      outputs: ['pi_objectives', 'program_board', 'art_dependencies']
    },
    {
      name: 'calculate_predictability',
      label: 'Calculate PI Predictability',
      description: 'Calculate predictability at end of PI',
      trigger: 'scheduled',
      frequency: 'every_10_weeks',
      outputs: ['pi_predictability']
    },
    {
      name: 'analyze_flow_metrics',
      label: 'Analyze Flow Metrics',
      description: 'Calculate and analyze all flow metrics',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['art_flow_velocity', 'art_flow_time', 'art_flow_efficiency', 'art_flow_distribution']
    },
    {
      name: 'manage_dependencies',
      label: 'Manage Dependencies',
      description: 'Track and resolve cross-team dependencies',
      trigger: 'event',
      outputs: ['dependency_health']
    }
  ],

  dashboardMetrics: [
    'pi_predictability',
    'art_flow_velocity',
    'art_flow_efficiency',
    'team_velocity',
    'dependency_health',
    'built_in_quality_score'
  ],

  defaultAlerts: [
    {
      condition: 'pi_predictability < 0.80',
      severity: 'critical',
      message: 'PI predictability below SAFe target (80%)',
      notifyAgents: ['lpm', 'governance']
    },
    {
      condition: 'art_flow_efficiency < 0.35',
      severity: 'high',
      message: 'ART flow efficiency low - too much wait time',
      notifyAgents: ['lpm', 'pmo']
    },
    {
      condition: 'dependency_health < 0.70',
      severity: 'high',
      message: 'Multiple unresolved dependencies blocking teams',
      notifyAgents: ['planning', 'risk']
    },
    {
      condition: 'change_failure_rate > 0.15',
      severity: 'critical',
      message: 'Change failure rate exceeds DevOps threshold (15%)',
      notifyAgents: ['governance', 'risk']
    }
  ]
};

/**
 * VALUE STREAM AGENT
 * SAFe Role: Value Stream Coordinator, Solution Train management
 */
export const VALUE_STREAM_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'value_stream',
  displayName: 'Value Stream',
  description: 'SAFe Value Stream - End-to-end flow of value delivery',
  icon: '🌊',
  color: '#10b981',

  produces: [
    // Value Stream Definition
    {
      name: 'value_stream_name',
      label: 'Value Stream Name',
      description: 'Name of value stream',
      dataType: 'string',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'value_stream_type',
      label: 'Value Stream Type',
      description: 'Operational or Development value stream',
      dataType: 'string',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'value_stream_kpis',
      label: 'Value Stream KPIs',
      description: 'Key performance indicators for value stream',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // Value Stream Mapping
    {
      name: 'vsm_steps',
      label: 'Value Stream Map Steps',
      description: 'Steps in value stream from trigger to delivery',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'vsm_lead_time',
      label: 'VSM Lead Time',
      description: 'Total lead time from concept to cash',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'vsm_process_time',
      label: 'VSM Process Time',
      description: 'Total active process time (value-add)',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'vsm_efficiency',
      label: 'VSM Efficiency',
      description: 'Process time / Lead time',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate VSM efficiency: (Process Time / Lead Time) * 100'
    },

    // Solution Context
    {
      name: 'solution_intent',
      label: 'Solution Intent',
      description: 'Repository of current and evolving solution requirements',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'solution_context',
      label: 'Solution Context',
      description: 'Customer, regulatory, technical context',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // Economic Framework
    {
      name: 'economic_framework',
      label: 'Economic Framework',
      description: 'Cost of delay, value vs cost tradeoffs',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'cost_of_delay',
      label: 'Cost of Delay',
      description: 'Economic impact of delayed delivery',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  consumes: [
    {
      name: 'art_predictability',
      label: 'ART Predictability',
      description: 'Predictability from ARTs in value stream',
      dataType: 'array',
      required: true,
      category: 'consumes'
    },
    {
      name: 'portfolio_vision',
      label: 'Portfolio Vision',
      description: 'Strategic alignment from portfolio',
      dataType: 'string',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'map_value_stream',
      label: 'Map Value Stream',
      description: 'Create/update value stream map',
      trigger: 'manual',
      outputs: ['vsm_steps', 'vsm_lead_time', 'vsm_efficiency']
    },
    {
      name: 'calculate_cost_of_delay',
      label: 'Calculate Cost of Delay',
      description: 'Calculate economic impact of delays',
      trigger: 'event',
      outputs: ['cost_of_delay']
    }
  ],

  dashboardMetrics: [
    'vsm_lead_time',
    'vsm_efficiency',
    'value_stream_kpis',
    'cost_of_delay'
  ],

  defaultAlerts: [
    {
      condition: 'vsm_efficiency < 0.30',
      severity: 'high',
      message: 'Value stream efficiency below SAFe target (30%)',
      notifyAgents: ['lpm', 'pmo']
    }
  ]
};

/**
 * All SAFe agent schemas
 */
export const SAFE_AGENT_SCHEMAS: Record<string, AgentObjectSchema> = {
  lpm: LPM_AGENT_SCHEMA,
  art: ART_AGENT_SCHEMA,
  value_stream: VALUE_STREAM_AGENT_SCHEMA
};

/**
 * Get SAFe agent schema by type
 */
export function getSAFeAgentSchema(agentType: string): AgentObjectSchema | null {
  return SAFE_AGENT_SCHEMAS[agentType] || null;
}
