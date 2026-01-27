/**
 * PMI (PMBOK) AGENT SCHEMAS
 *
 * Based on PMBOK Guide 7th Edition - Process-Based Project Management
 * Comprehensive attributes from PMI knowledge areas and performance domains
 *
 * PMI Knowledge Areas (PMBOK 6):
 * 1. Integration Management
 * 2. Scope Management
 * 3. Schedule Management
 * 4. Cost Management
 * 5. Quality Management
 * 6. Resource Management
 * 7. Communications Management
 * 8. Risk Management
 * 9. Procurement Management
 * 10. Stakeholder Management
 *
 * PMBOK 7 Performance Domains:
 * - Project Work
 * - Delivery
 * - Measurement
 * - Uncertainty
 * - Team
 * - Planning
 * - Stakeholder
 * - Lifecycle
 */

import type { AgentAttribute, AgentObjectSchema } from './AgentObjectSchema.js';

/**
 * PMO (PROJECT MANAGEMENT OFFICE) AGENT - PMI STANDARDS
 * All 10 Knowledge Areas + Performance Domains
 */
export const PMI_PMO_AGENT_SCHEMA: AgentObjectSchema = {
  agentType: 'pmi_pmo',
  displayName: 'PMO (PMI Standards)',
  description: 'PMI PMBOK-based Project Management Office',
  icon: '📋',
  color: '#3b82f6',

  produces: [
    // ==================== INTEGRATION MANAGEMENT ====================
    {
      name: 'project_charter',
      label: 'Project Charter',
      description: 'Formal authorization and high-level requirements',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'project_management_plan',
      label: 'Project Management Plan',
      description: 'Integrated baseline (scope, schedule, cost)',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'change_requests_count',
      label: 'Change Requests Count',
      description: 'Number of active change requests',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'change_control_board_status',
      label: 'CCB Status',
      description: 'Status of Change Control Board reviews',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // ==================== SCOPE MANAGEMENT ====================
    {
      name: 'wbs',
      label: 'Work Breakdown Structure',
      description: 'Hierarchical decomposition of work',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'scope_baseline',
      label: 'Scope Baseline',
      description: 'Approved scope statement + WBS + WBS dictionary',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'scope_creep_percentage',
      label: 'Scope Creep Percentage',
      description: 'Percentage of unapproved scope additions',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate scope creep: (Unapproved Changes / Total Scope) * 100'
    },
    {
      name: 'requirements_traceability_matrix',
      label: 'Requirements Traceability Matrix',
      description: 'Links requirements to deliverables',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // ==================== SCHEDULE MANAGEMENT ====================
    {
      name: 'schedule_baseline',
      label: 'Schedule Baseline',
      description: 'Approved version of schedule',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'critical_path',
      label: 'Critical Path',
      description: 'Longest path through project network',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'schedule_variance_sv',
      label: 'Schedule Variance (SV)',
      description: 'EV - PV (Earned Value - Planned Value)',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate SV = EV - PV. Negative means behind schedule.'
    },
    {
      name: 'spi',
      label: 'Schedule Performance Index (SPI)',
      description: 'EV / PV - Efficiency of time utilization',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate SPI = EV / PV. SPI < 1.0 means behind schedule.'
    },
    {
      name: 'total_float',
      label: 'Total Float',
      description: 'Schedule flexibility (slack time)',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'milestone_completion',
      label: 'Milestone Completion Rate',
      description: 'Percentage of milestones completed on time',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // ==================== COST MANAGEMENT ====================
    {
      name: 'cost_baseline',
      label: 'Cost Baseline',
      description: 'Approved time-phased budget',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'cost_variance_cv',
      label: 'Cost Variance (CV)',
      description: 'EV - AC (Earned Value - Actual Cost)',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate CV = EV - AC. Negative means over budget.'
    },
    {
      name: 'cpi',
      label: 'Cost Performance Index (CPI)',
      description: 'EV / AC - Cost efficiency',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate CPI = EV / AC. CPI < 1.0 means over budget.'
    },
    {
      name: 'bac',
      label: 'Budget at Completion (BAC)',
      description: 'Total planned budget',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'eac',
      label: 'Estimate at Completion (EAC)',
      description: 'Expected total cost',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate EAC = BAC / CPI (typical formula)'
    },
    {
      name: 'etc',
      label: 'Estimate to Complete (ETC)',
      description: 'Expected cost to finish remaining work',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate ETC = EAC - AC'
    },
    {
      name: 'vac',
      label: 'Variance at Completion (VAC)',
      description: 'BAC - EAC (Budget vs expected final cost)',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate VAC = BAC - EAC. Negative means budget overrun expected.'
    },
    {
      name: 'tcpi',
      label: 'To-Complete Performance Index (TCPI)',
      description: 'Cost efficiency needed to meet budget',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate TCPI = (BAC - EV) / (BAC - AC)'
    },

    // ==================== QUALITY MANAGEMENT ====================
    {
      name: 'quality_metrics',
      label: 'Quality Metrics',
      description: 'Defect density, test coverage, customer satisfaction',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'quality_control_measurements',
      label: 'Quality Control Measurements',
      description: 'Results of quality inspections',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'defect_density',
      label: 'Defect Density',
      description: 'Defects per unit of work',
      dataType: 'number',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'cost_of_quality',
      label: 'Cost of Quality',
      description: 'Prevention + Appraisal + Failure costs',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // ==================== RESOURCE MANAGEMENT ====================
    {
      name: 'resource_calendar',
      label: 'Resource Calendar',
      description: 'Availability of resources',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'resource_utilization',
      label: 'Resource Utilization',
      description: 'Percentage of resource capacity used',
      dataType: 'number',
      unit: 'percentage',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate resource utilization: (Allocated Hours / Available Hours) * 100'
    },
    {
      name: 'resource_leveling_adjustments',
      label: 'Resource Leveling Adjustments',
      description: 'Schedule changes due to resource constraints',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'team_performance_assessments',
      label: 'Team Performance Assessments',
      description: 'Team effectiveness evaluations',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // ==================== COMMUNICATIONS MANAGEMENT ====================
    {
      name: 'communications_management_plan',
      label: 'Communications Management Plan',
      description: 'Who needs what information, when, and how',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'stakeholder_engagement_level',
      label: 'Stakeholder Engagement Level',
      description: 'Unaware, Resistant, Neutral, Supportive, Leading',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'communication_effectiveness',
      label: 'Communication Effectiveness',
      description: 'Response rates and feedback quality',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },

    // ==================== RISK MANAGEMENT ====================
    {
      name: 'risk_register',
      label: 'Risk Register',
      description: 'Identified risks with probability and impact',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'risk_matrix',
      label: 'Probability-Impact Matrix',
      description: 'Risk classification by probability and impact',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'risk_exposure',
      label: 'Risk Exposure',
      description: 'Total expected monetary value of all risks',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate risk exposure: Sum of (Probability * Impact) for all risks'
    },
    {
      name: 'risk_velocity',
      label: 'Risk Velocity',
      description: 'Time until risk impact occurs',
      dataType: 'number',
      unit: 'days',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'contingency_reserves',
      label: 'Contingency Reserves',
      description: 'Budget reserved for known risks',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'management_reserves',
      label: 'Management Reserves',
      description: 'Budget reserved for unknown risks',
      dataType: 'number',
      unit: 'currency',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },

    // ==================== PROCUREMENT MANAGEMENT ====================
    {
      name: 'procurement_documents',
      label: 'Procurement Documents',
      description: 'RFPs, contracts, SOWs',
      dataType: 'array',
      required: false,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'vendor_performance',
      label: 'Vendor Performance',
      description: 'Vendor scorecards and evaluations',
      dataType: 'object',
      required: false,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'contract_closure_status',
      label: 'Contract Closure Status',
      description: 'Status of contract closeouts',
      dataType: 'object',
      required: false,
      category: 'produces',
      calculatedBy: 'database'
    },

    // ==================== STAKEHOLDER MANAGEMENT ====================
    {
      name: 'stakeholder_register',
      label: 'Stakeholder Register',
      description: 'Identified stakeholders and their attributes',
      dataType: 'array',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'stakeholder_power_interest_grid',
      label: 'Power-Interest Grid',
      description: 'Stakeholder classification by power and interest',
      dataType: 'object',
      required: true,
      category: 'produces',
      calculatedBy: 'database'
    },
    {
      name: 'stakeholder_satisfaction_score',
      label: 'Stakeholder Satisfaction',
      description: 'Overall stakeholder satisfaction',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm',
      llmPromptTemplate: 'Calculate stakeholder satisfaction based on surveys and feedback'
    },

    // ==================== PMBOK 7 PERFORMANCE DOMAINS ====================
    {
      name: 'project_work_performance',
      label: 'Project Work Performance',
      description: 'Establishing processes and performing work',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'delivery_performance',
      label: 'Delivery Performance',
      description: 'Scope and quality of deliverables',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'measurement_performance',
      label: 'Measurement Performance',
      description: 'Metrics, reporting, and forecasting',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'uncertainty_performance',
      label: 'Uncertainty Performance',
      description: 'Risk and ambiguity management',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    },
    {
      name: 'team_performance',
      label: 'Team Performance',
      description: 'Team culture and collaboration',
      dataType: 'number',
      unit: 'score',
      required: true,
      category: 'produces',
      calculatedBy: 'llm'
    }
  ],

  consumes: [
    {
      name: 'portfolio_strategic_alignment',
      label: 'Portfolio Strategic Alignment',
      description: 'Strategic direction from portfolio',
      dataType: 'object',
      required: true,
      category: 'consumes'
    },
    {
      name: 'organizational_process_assets',
      label: 'Organizational Process Assets',
      description: 'Templates, policies, historical data',
      dataType: 'object',
      required: true,
      category: 'consumes'
    },
    {
      name: 'enterprise_environmental_factors',
      label: 'Enterprise Environmental Factors',
      description: 'Organizational culture, regulations, market conditions',
      dataType: 'object',
      required: true,
      category: 'consumes'
    }
  ],

  functions: [
    {
      name: 'develop_project_charter',
      label: 'Develop Project Charter',
      description: 'Create formal project authorization',
      trigger: 'manual',
      outputs: ['project_charter']
    },
    {
      name: 'calculate_earned_value',
      label: 'Calculate Earned Value Metrics',
      description: 'Calculate EV, SV, CV, SPI, CPI, EAC, etc.',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['schedule_variance_sv', 'spi', 'cost_variance_cv', 'cpi', 'eac', 'vac', 'tcpi']
    },
    {
      name: 'assess_risks',
      label: 'Perform Risk Analysis',
      description: 'Assess and quantify project risks',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['risk_exposure', 'risk_velocity']
    },
    {
      name: 'monitor_stakeholders',
      label: 'Monitor Stakeholder Engagement',
      description: 'Track stakeholder engagement and satisfaction',
      trigger: 'scheduled',
      frequency: 'weekly',
      outputs: ['stakeholder_engagement_level', 'stakeholder_satisfaction_score']
    }
  ],

  dashboardMetrics: [
    'spi',
    'cpi',
    'schedule_variance_sv',
    'cost_variance_cv',
    'eac',
    'vac',
    'risk_exposure',
    'quality_metrics',
    'resource_utilization',
    'stakeholder_satisfaction_score'
  ],

  defaultAlerts: [
    {
      condition: 'spi < 0.90',
      severity: 'critical',
      message: 'Schedule Performance Index critically low (< 0.90)',
      notifyAgents: ['governance', 'tmo']
    },
    {
      condition: 'cpi < 0.90',
      severity: 'critical',
      message: 'Cost Performance Index critically low (< 0.90)',
      notifyAgents: ['governance', 'finops']
    },
    {
      condition: 'vac < 0',
      severity: 'critical',
      message: 'Budget overrun expected (VAC negative)',
      notifyAgents: ['governance', 'finops']
    },
    {
      condition: 'tcpi > 1.10',
      severity: 'high',
      message: 'TCPI > 1.10 - difficult to meet budget target',
      notifyAgents: ['finops', 'planning']
    },
    {
      condition: 'risk_exposure > bac * 0.10',
      severity: 'high',
      message: 'Risk exposure exceeds 10% of budget',
      notifyAgents: ['risk', 'governance']
    },
    {
      condition: 'stakeholder_satisfaction_score < 0.70',
      severity: 'high',
      message: 'Stakeholder satisfaction low',
      notifyAgents: ['governance', 'ocm']
    }
  ]
};

/**
 * All PMI agent schemas
 */
export const PMI_AGENT_SCHEMAS: Record<string, AgentObjectSchema> = {
  pmi_pmo: PMI_PMO_AGENT_SCHEMA
};

/**
 * Get PMI agent schema by type
 */
export function getPMIAgentSchema(agentType: string): AgentObjectSchema | null {
  return PMI_AGENT_SCHEMAS[agentType] || null;
}
