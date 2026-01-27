/**
 * AGENT OBJECT MODEL
 * 
 * A brain-like architecture where agents are first-class objects with:
 * - Predefined attributes (what they typically need - 80% common)
 * - Functions (actions they can take)
 * - Connections (relationships to other agents)
 * 
 * Key Concepts:
 * 1. Company is the ROOT agent - all other agents derive context from it
 * 2. Attributes define what Mem0/Letta should retain
 * 3. Connections auto-sync to Neo4j for graph queries
 * 4. Bidirectional signals - push AND broadcast
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentType = 
  | 'company'      // Root agent - company context
  | 'pmo'          // Project Management Office
  | 'finops'       // Financial Operations
  | 'tmo'          // Transformation Management Office
  | 'risk'         // Risk Management
  | 'vro'          // Value Realization Office
  | 'ocm'          // Organizational Change Management
  | 'governance'   // Governance & Compliance
  | 'planning'     // Strategic Planning
  | 'integrated';  // Cross-domain Integration

// ============================================================================
// ATTRIBUTE CATEGORIES
// ============================================================================

export type AttributeCategory = 
  | 'dashboard'     // Metrics shown on agent's dashboard
  | 'report'        // Data for reports
  | 'meeting'       // Meeting-related info
  | 'notification'  // Alerts and signals
  | 'dependency'    // Dependencies on other agents/data
  | 'action'        // Actions the agent can trigger
  | 'input'         // Data this agent receives
  | 'output';       // Data this agent produces

// ============================================================================
// AGENT ATTRIBUTE DEFINITION
// ============================================================================

export interface AgentAttribute {
  id: string;
  name: string;
  displayName: string;
  category: AttributeCategory;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  description: string;
  source?: string;           // Where this data comes from (e.g., 'vro', 'planning', 'company')
  required: boolean;
  defaultValue?: any;
  unit?: string;             // e.g., '$', '%', 'days'
  triggerSignal?: boolean;   // Should changes broadcast a signal?
}

// ============================================================================
// AGENT FUNCTION DEFINITION
// ============================================================================

export interface AgentFunction {
  id: string;
  name: string;
  displayName: string;
  description: string;
  inputs: { name: string; type: string; required: boolean }[];
  outputs: { name: string; type: string }[];
  triggers?: string[];       // Events that can trigger this function
  broadcasts?: string[];     // Signals this function emits when executed
}

// ============================================================================
// AGENT CONNECTION (Relationship to other agents)
// ============================================================================

export interface AgentConnection {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  connectionType: 'subscribes_to' | 'provides_to' | 'collaborates_with' | 'escalates_to' | 'depends_on';
  attributes: string[];      // Which attributes are shared in this connection
  bidirectional: boolean;    // Both directions?
  autoSync: boolean;         // Auto-sync to Neo4j?
}

// ============================================================================
// AGENT DEFINITION (The Agent Object)
// ============================================================================

export interface AgentDefinition {
  type: AgentType;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  attributes: AgentAttribute[];
  functions: AgentFunction[];
  connections: AgentConnection[];
  mem0Patterns: string[];    // What patterns Mem0 should subscribe to
  lettaArchive: string[];    // What Letta should archive long-term
}

// ============================================================================
// PRE-DEFINED AGENT TEMPLATES (80% Common Attributes)
// ============================================================================

/**
 * COMPANY AGENT - Root of all agents
 * Contains company-level context that all agents inherit
 */
export const COMPANY_AGENT: AgentDefinition = {
  type: 'company',
  displayName: 'Company',
  description: 'Root agent representing the organization. All other agents derive context from company data.',
  icon: 'building',
  color: '#1e3a5f',
  attributes: [
    // Identity
    { id: 'company_name', name: 'companyName', displayName: 'Company Name', category: 'dashboard', dataType: 'string', description: 'Legal company name', required: true, triggerSignal: true },
    { id: 'company_ticker', name: 'ticker', displayName: 'Stock Ticker', category: 'dashboard', dataType: 'string', description: 'Stock ticker symbol', required: false },
    { id: 'company_industry', name: 'industry', displayName: 'Industry', category: 'dashboard', dataType: 'string', description: 'Primary industry (GICS/NAICS)', required: true, triggerSignal: true },
    
    // Annual Report Data
    { id: 'company_revenue', name: 'annualRevenue', displayName: 'Annual Revenue', category: 'report', dataType: 'number', description: 'Total annual revenue', required: false, unit: '$', triggerSignal: true },
    { id: 'company_employees', name: 'employeeCount', displayName: 'Employee Count', category: 'report', dataType: 'number', description: 'Total employees', required: false },
    { id: 'company_fiscal_year', name: 'fiscalYear', displayName: 'Fiscal Year End', category: 'report', dataType: 'date', description: 'Fiscal year end date', required: false },
    
    // Strategic Context
    { id: 'company_mission', name: 'mission', displayName: 'Mission Statement', category: 'report', dataType: 'string', description: 'Company mission', required: false },
    { id: 'company_vision', name: 'vision', displayName: 'Vision Statement', category: 'report', dataType: 'string', description: 'Company vision', required: false },
    { id: 'company_strategic_priorities', name: 'strategicPriorities', displayName: 'Strategic Priorities', category: 'dashboard', dataType: 'array', description: 'Top strategic priorities', required: false, triggerSignal: true },
    
    // Risk Profile (from annual report)
    { id: 'company_risk_factors', name: 'riskFactors', displayName: 'Risk Factors', category: 'dependency', dataType: 'json', description: 'Key risk factors from 10-K', required: false, source: 'annual_report' },
    
    // Governance
    { id: 'company_board_size', name: 'boardSize', displayName: 'Board Size', category: 'report', dataType: 'number', description: 'Number of board members', required: false },
    { id: 'company_governance_score', name: 'governanceScore', displayName: 'Governance Score', category: 'dashboard', dataType: 'number', description: 'ESG governance score', required: false, triggerSignal: true },
  ],
  functions: [
    { id: 'extract_annual_report', name: 'extractAnnualReport', displayName: 'Extract Annual Report', description: 'Extract data from 10-K/Annual Report', inputs: [{ name: 'documentUrl', type: 'string', required: true }], outputs: [{ name: 'extractedData', type: 'json' }], broadcasts: ['company:data_updated'] },
    { id: 'broadcast_strategy_change', name: 'broadcastStrategyChange', displayName: 'Broadcast Strategy Change', description: 'Notify all agents of strategic priority changes', inputs: [{ name: 'newPriorities', type: 'array', required: true }], outputs: [{ name: 'notifiedAgents', type: 'array' }], broadcasts: ['company:strategy_changed'] },
  ],
  connections: [
    // Company provides context to ALL agents
    { id: 'company_to_pmo', fromAgent: 'company', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['strategicPriorities', 'riskFactors'], bidirectional: false, autoSync: true },
    { id: 'company_to_finops', fromAgent: 'company', toAgent: 'finops', connectionType: 'provides_to', attributes: ['annualRevenue', 'fiscalYear'], bidirectional: false, autoSync: true },
    { id: 'company_to_governance', fromAgent: 'company', toAgent: 'governance', connectionType: 'provides_to', attributes: ['governanceScore', 'riskFactors', 'boardSize'], bidirectional: false, autoSync: true },
    { id: 'company_to_vro', fromAgent: 'company', toAgent: 'vro', connectionType: 'provides_to', attributes: ['strategicPriorities', 'mission', 'vision'], bidirectional: false, autoSync: true },
  ],
  mem0Patterns: ['company:*', 'strategy:*', 'governance:*'],
  lettaArchive: ['Strategic decisions', 'Major organizational changes', 'Board decisions'],
};

/**
 * PMO AGENT - Project Management Office
 * 80% common attributes for any PMO
 */
export const PMO_AGENT: AgentDefinition = {
  type: 'pmo',
  displayName: 'PMO Agent',
  description: 'Project Management Office - monitors project health, schedules, and resources across portfolio',
  icon: 'clipboard-list',
  color: '#2563eb',
  attributes: [
    // Dashboard Metrics (what PMO always needs)
    { id: 'pmo_portfolio_health', name: 'portfolioHealthScore', displayName: 'Portfolio Health', category: 'dashboard', dataType: 'number', description: 'Overall portfolio health score', required: true, unit: '%', triggerSignal: true },
    { id: 'pmo_projects_count', name: 'activeProjectsCount', displayName: 'Active Projects', category: 'dashboard', dataType: 'number', description: 'Number of active projects', required: true, triggerSignal: true },
    { id: 'pmo_at_risk_count', name: 'atRiskProjectsCount', displayName: 'At-Risk Projects', category: 'dashboard', dataType: 'number', description: 'Projects at risk', required: true, triggerSignal: true },
    { id: 'pmo_milestone_completion', name: 'milestoneCompletionRate', displayName: 'Milestone Completion', category: 'dashboard', dataType: 'number', description: 'On-time milestone completion rate', required: true, unit: '%', triggerSignal: true },
    
    // Dependencies (what PMO gets from other agents)
    { id: 'pmo_budget_status', name: 'budgetStatus', displayName: 'Budget Status', category: 'dependency', dataType: 'string', description: 'Overall budget status from FinOps', source: 'finops', required: false, triggerSignal: true },
    { id: 'pmo_risk_score', name: 'aggregateRiskScore', displayName: 'Risk Score', category: 'dependency', dataType: 'number', description: 'Aggregate risk score from Risk agent', source: 'risk', required: false, triggerSignal: true },
    { id: 'pmo_value_realization', name: 'valueRealizationRate', displayName: 'Value Realization', category: 'dependency', dataType: 'number', description: 'Value realization % from VRO', source: 'vro', required: false, unit: '%', triggerSignal: true },
    { id: 'pmo_change_adoption', name: 'changeAdoptionRate', displayName: 'Change Adoption', category: 'dependency', dataType: 'number', description: 'Change adoption rate from OCM', source: 'ocm', required: false, unit: '%' },
    
    // Reports
    { id: 'pmo_executive_summary', name: 'executiveSummary', displayName: 'Executive Summary', category: 'report', dataType: 'string', description: 'AI-generated executive summary', required: false },
    { id: 'pmo_weekly_report', name: 'weeklyReportData', displayName: 'Weekly Report', category: 'report', dataType: 'json', description: 'Data for weekly status report', required: false },
    
    // Meetings
    { id: 'pmo_next_steering', name: 'nextSteeringCommittee', displayName: 'Next Steering Committee', category: 'meeting', dataType: 'date', description: 'Next steering committee meeting', required: false },
    { id: 'pmo_decisions_pending', name: 'pendingDecisions', displayName: 'Pending Decisions', category: 'meeting', dataType: 'array', description: 'Decisions awaiting approval', required: false, triggerSignal: true },
    
    // Notifications
    { id: 'pmo_critical_alerts', name: 'criticalAlerts', displayName: 'Critical Alerts', category: 'notification', dataType: 'array', description: 'Critical issues requiring attention', required: false, triggerSignal: true },
    { id: 'pmo_upcoming_milestones', name: 'upcomingMilestones', displayName: 'Upcoming Milestones', category: 'notification', dataType: 'array', description: 'Milestones due in next 14 days', required: false },
  ],
  functions: [
    { id: 'pmo_generate_report', name: 'generateStatusReport', displayName: 'Generate Status Report', description: 'Generate portfolio status report', inputs: [{ name: 'reportType', type: 'string', required: true }, { name: 'timeframe', type: 'string', required: false }], outputs: [{ name: 'report', type: 'json' }], broadcasts: ['pmo:report_generated'] },
    { id: 'pmo_escalate', name: 'escalateToSteering', displayName: 'Escalate to Steering', description: 'Escalate issue to steering committee', inputs: [{ name: 'issueId', type: 'string', required: true }, { name: 'reason', type: 'string', required: true }], outputs: [{ name: 'escalationId', type: 'string' }], broadcasts: ['pmo:escalation_created'] },
    { id: 'pmo_update_health', name: 'updateProjectHealth', displayName: 'Update Project Health', description: 'Update health status for a project', inputs: [{ name: 'projectId', type: 'string', required: true }, { name: 'healthScore', type: 'number', required: true }], outputs: [{ name: 'updated', type: 'boolean' }], broadcasts: ['pmo:health_updated'] },
  ],
  connections: [
    // PMO subscribes to other agents
    { id: 'pmo_sub_finops', fromAgent: 'pmo', toAgent: 'finops', connectionType: 'subscribes_to', attributes: ['cpi', 'spi', 'budgetVariance'], bidirectional: true, autoSync: true },
    { id: 'pmo_sub_risk', fromAgent: 'pmo', toAgent: 'risk', connectionType: 'subscribes_to', attributes: ['topRisks', 'riskScore'], bidirectional: true, autoSync: true },
    { id: 'pmo_sub_vro', fromAgent: 'pmo', toAgent: 'vro', connectionType: 'subscribes_to', attributes: ['benefitsRealized', 'valueScore'], bidirectional: true, autoSync: true },
    { id: 'pmo_sub_ocm', fromAgent: 'pmo', toAgent: 'ocm', connectionType: 'subscribes_to', attributes: ['adoptionRate', 'resistanceAreas'], bidirectional: true, autoSync: true },
    { id: 'pmo_sub_tmo', fromAgent: 'pmo', toAgent: 'tmo', connectionType: 'subscribes_to', attributes: ['scheduleVariance', 'criticalPath'], bidirectional: true, autoSync: true },
    // PMO escalates to Governance
    { id: 'pmo_to_governance', fromAgent: 'pmo', toAgent: 'governance', connectionType: 'escalates_to', attributes: ['criticalIssues', 'complianceViolations'], bidirectional: false, autoSync: true },
  ],
  mem0Patterns: ['project_*:health_score', 'project_*:schedule_variance', 'project_*:budget_status', 'project_*:risk_score', '*:team_velocity'],
  lettaArchive: ['Major project decisions', 'Lessons learned', 'Recurring issues', 'Successful patterns'],
};

/**
 * FINOPS AGENT - Financial Operations
 */
export const FINOPS_AGENT: AgentDefinition = {
  type: 'finops',
  displayName: 'FinOps Agent',
  description: 'Financial Operations - monitors budgets, costs, and financial performance',
  icon: 'dollar-sign',
  color: '#059669',
  attributes: [
    // Dashboard
    { id: 'finops_total_budget', name: 'totalPortfolioBudget', displayName: 'Total Budget', category: 'dashboard', dataType: 'number', description: 'Total portfolio budget', required: true, unit: '$', triggerSignal: true },
    { id: 'finops_spent', name: 'actualSpent', displayName: 'Actual Spent', category: 'dashboard', dataType: 'number', description: 'Actual amount spent', required: true, unit: '$', triggerSignal: true },
    { id: 'finops_cpi', name: 'costPerformanceIndex', displayName: 'CPI', category: 'dashboard', dataType: 'number', description: 'Cost Performance Index', required: true, triggerSignal: true },
    { id: 'finops_spi', name: 'schedulePerformanceIndex', displayName: 'SPI', category: 'dashboard', dataType: 'number', description: 'Schedule Performance Index', required: true, triggerSignal: true },
    { id: 'finops_eac', name: 'estimateAtCompletion', displayName: 'EAC', category: 'dashboard', dataType: 'number', description: 'Estimate at Completion', required: true, unit: '$', triggerSignal: true },
    { id: 'finops_variance', name: 'budgetVariance', displayName: 'Budget Variance', category: 'dashboard', dataType: 'number', description: 'Budget variance %', required: true, unit: '%', triggerSignal: true },
    
    // Reports
    { id: 'finops_forecast', name: 'monthlyForecast', displayName: 'Monthly Forecast', category: 'report', dataType: 'json', description: 'Monthly spending forecast', required: false },
    { id: 'finops_burn_rate', name: 'burnRate', displayName: 'Burn Rate', category: 'report', dataType: 'number', description: 'Current burn rate per month', required: false, unit: '$/month' },
    
    // Notifications
    { id: 'finops_overrun_alerts', name: 'budgetOverrunAlerts', displayName: 'Budget Overrun Alerts', category: 'notification', dataType: 'array', description: 'Projects exceeding budget', required: false, triggerSignal: true },
    { id: 'finops_approval_pending', name: 'pendingApprovals', displayName: 'Pending Approvals', category: 'notification', dataType: 'array', description: 'Budget changes awaiting approval', required: false },
  ],
  functions: [
    { id: 'finops_forecast', name: 'generateForecast', displayName: 'Generate Forecast', description: 'Generate financial forecast', inputs: [{ name: 'months', type: 'number', required: true }], outputs: [{ name: 'forecast', type: 'json' }], broadcasts: ['finops:forecast_generated'] },
    { id: 'finops_alert', name: 'triggerBudgetAlert', displayName: 'Trigger Budget Alert', description: 'Alert on budget threshold breach', inputs: [{ name: 'projectId', type: 'string', required: true }, { name: 'threshold', type: 'number', required: true }], outputs: [{ name: 'alertId', type: 'string' }], broadcasts: ['finops:budget_alert'] },
  ],
  connections: [
    { id: 'finops_to_pmo', fromAgent: 'finops', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['cpi', 'spi', 'budgetVariance'], bidirectional: true, autoSync: true },
    { id: 'finops_to_governance', fromAgent: 'finops', toAgent: 'governance', connectionType: 'escalates_to', attributes: ['budgetOverrunAlerts', 'complianceIssues'], bidirectional: false, autoSync: true },
    { id: 'finops_sub_company', fromAgent: 'finops', toAgent: 'company', connectionType: 'subscribes_to', attributes: ['annualRevenue', 'fiscalYear'], bidirectional: false, autoSync: true },
  ],
  mem0Patterns: ['project_*:budget', 'project_*:cpi', 'project_*:spi', 'finops:*'],
  lettaArchive: ['Budget decisions', 'Cost overrun patterns', 'Successful cost savings'],
};

/**
 * VRO AGENT - Value Realization Office
 */
export const VRO_AGENT: AgentDefinition = {
  type: 'vro',
  displayName: 'VRO Agent',
  description: 'Value Realization Office - tracks benefits, outcomes, and business value',
  icon: 'trending-up',
  color: '#7c3aed',
  attributes: [
    // Dashboard
    { id: 'vro_total_benefits', name: 'totalPlannedBenefits', displayName: 'Total Planned Benefits', category: 'dashboard', dataType: 'number', description: 'Total planned benefits value', required: true, unit: '$', triggerSignal: true },
    { id: 'vro_realized', name: 'benefitsRealized', displayName: 'Benefits Realized', category: 'dashboard', dataType: 'number', description: 'Actual benefits realized', required: true, unit: '$', triggerSignal: true },
    { id: 'vro_realization_rate', name: 'realizationRate', displayName: 'Realization Rate', category: 'dashboard', dataType: 'number', description: 'Benefits realization %', required: true, unit: '%', triggerSignal: true },
    { id: 'vro_value_score', name: 'valueScore', displayName: 'Value Score', category: 'dashboard', dataType: 'number', description: 'Overall value delivery score', required: true, triggerSignal: true },
    
    // Dependencies (from Company)
    { id: 'vro_strategic_alignment', name: 'strategicAlignment', displayName: 'Strategic Alignment', category: 'dependency', dataType: 'json', description: 'Alignment to company strategic priorities', source: 'company', required: false },
    
    // Reports
    { id: 'vro_benefits_map', name: 'benefitsMap', displayName: 'Benefits Map', category: 'report', dataType: 'json', description: 'Benefits dependency mapping', required: false },
    { id: 'vro_outcomes', name: 'measuredOutcomes', displayName: 'Measured Outcomes', category: 'report', dataType: 'array', description: 'Quantified business outcomes', required: false },
  ],
  functions: [
    { id: 'vro_measure', name: 'measureBenefits', displayName: 'Measure Benefits', description: 'Calculate realized benefits', inputs: [{ name: 'projectId', type: 'string', required: true }], outputs: [{ name: 'measurement', type: 'json' }], broadcasts: ['vro:benefits_measured'] },
    { id: 'vro_forecast', name: 'forecastValue', displayName: 'Forecast Value', description: 'Forecast future value realization', inputs: [{ name: 'months', type: 'number', required: true }], outputs: [{ name: 'forecast', type: 'json' }], broadcasts: ['vro:forecast_generated'] },
  ],
  connections: [
    { id: 'vro_to_pmo', fromAgent: 'vro', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['benefitsRealized', 'valueScore'], bidirectional: true, autoSync: true },
    { id: 'vro_sub_company', fromAgent: 'vro', toAgent: 'company', connectionType: 'subscribes_to', attributes: ['strategicPriorities', 'mission'], bidirectional: false, autoSync: true },
    { id: 'vro_sub_finops', fromAgent: 'vro', toAgent: 'finops', connectionType: 'subscribes_to', attributes: ['actualSpent', 'budgetVariance'], bidirectional: true, autoSync: true },
  ],
  mem0Patterns: ['project_*:benefits', 'vro:*', 'value:*'],
  lettaArchive: ['Benefits realized', 'Value patterns', 'ROI calculations'],
};

// ============================================================================
// ALL AGENT TEMPLATES
// ============================================================================

export const AGENT_TEMPLATES: Record<AgentType, AgentDefinition> = {
  company: COMPANY_AGENT,
  pmo: PMO_AGENT,
  finops: FINOPS_AGENT,
  vro: VRO_AGENT,
  // Other agents - abbreviated for now
  tmo: {
    type: 'tmo',
    displayName: 'TMO Agent',
    description: 'Transformation Management Office - manages schedules, timelines, and critical paths',
    icon: 'calendar',
    color: '#f59e0b',
    attributes: [
      { id: 'tmo_schedule_variance', name: 'scheduleVariance', displayName: 'Schedule Variance', category: 'dashboard', dataType: 'number', description: 'Schedule variance %', required: true, unit: '%', triggerSignal: true },
      { id: 'tmo_critical_path', name: 'criticalPathHealth', displayName: 'Critical Path Health', category: 'dashboard', dataType: 'string', description: 'Critical path status', required: true, triggerSignal: true },
      { id: 'tmo_milestones_at_risk', name: 'milestonesAtRisk', displayName: 'Milestones at Risk', category: 'notification', dataType: 'array', description: 'Milestones at risk', required: false, triggerSignal: true },
    ],
    functions: [],
    connections: [
      { id: 'tmo_to_pmo', fromAgent: 'tmo', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['scheduleVariance', 'criticalPathHealth'], bidirectional: true, autoSync: true },
    ],
    mem0Patterns: ['project_*:schedule', 'project_*:milestones', 'tmo:*'],
    lettaArchive: ['Schedule decisions', 'Delay patterns', 'Timeline changes'],
  },
  risk: {
    type: 'risk',
    displayName: 'Risk Agent',
    description: 'Risk Management - identifies, assesses, and monitors risks',
    icon: 'alert-triangle',
    color: '#dc2626',
    attributes: [
      { id: 'risk_score', name: 'aggregateRiskScore', displayName: 'Aggregate Risk Score', category: 'dashboard', dataType: 'number', description: 'Overall portfolio risk', required: true, triggerSignal: true },
      { id: 'risk_top_risks', name: 'topRisks', displayName: 'Top Risks', category: 'dashboard', dataType: 'array', description: 'Top 5 portfolio risks', required: true, triggerSignal: true },
      { id: 'risk_mitigations', name: 'activeMitigations', displayName: 'Active Mitigations', category: 'report', dataType: 'array', description: 'Active risk mitigations', required: false },
    ],
    functions: [],
    connections: [
      { id: 'risk_to_pmo', fromAgent: 'risk', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['aggregateRiskScore', 'topRisks'], bidirectional: true, autoSync: true },
      { id: 'risk_to_governance', fromAgent: 'risk', toAgent: 'governance', connectionType: 'escalates_to', attributes: ['criticalRisks'], bidirectional: false, autoSync: true },
    ],
    mem0Patterns: ['project_*:risk', 'risk:*'],
    lettaArchive: ['Risk patterns', 'Mitigation strategies', 'Risk realizations'],
  },
  ocm: {
    type: 'ocm',
    displayName: 'OCM Agent',
    description: 'Organizational Change Management - tracks adoption, training, and change readiness',
    icon: 'users',
    color: '#0891b2',
    attributes: [
      { id: 'ocm_adoption_rate', name: 'adoptionRate', displayName: 'Adoption Rate', category: 'dashboard', dataType: 'number', description: 'Change adoption %', required: true, unit: '%', triggerSignal: true },
      { id: 'ocm_resistance', name: 'resistanceAreas', displayName: 'Resistance Areas', category: 'notification', dataType: 'array', description: 'Areas of resistance', required: false, triggerSignal: true },
      { id: 'ocm_training', name: 'trainingCompletion', displayName: 'Training Completion', category: 'report', dataType: 'number', description: 'Training completion %', required: false, unit: '%' },
    ],
    functions: [],
    connections: [
      { id: 'ocm_to_pmo', fromAgent: 'ocm', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['adoptionRate', 'resistanceAreas'], bidirectional: true, autoSync: true },
    ],
    mem0Patterns: ['project_*:adoption', 'ocm:*'],
    lettaArchive: ['Change patterns', 'Adoption strategies', 'Resistance handling'],
  },
  governance: {
    type: 'governance',
    displayName: 'Governance Agent',
    description: 'Governance & Compliance - ensures policy adherence and regulatory compliance',
    icon: 'shield',
    color: '#4f46e5',
    attributes: [
      { id: 'gov_compliance_score', name: 'complianceScore', displayName: 'Compliance Score', category: 'dashboard', dataType: 'number', description: 'Overall compliance score', required: true, unit: '%', triggerSignal: true },
      { id: 'gov_violations', name: 'activeViolations', displayName: 'Active Violations', category: 'notification', dataType: 'array', description: 'Active compliance violations', required: false, triggerSignal: true },
      { id: 'gov_audits', name: 'upcomingAudits', displayName: 'Upcoming Audits', category: 'meeting', dataType: 'array', description: 'Scheduled audits', required: false },
    ],
    functions: [],
    connections: [
      { id: 'gov_sub_company', fromAgent: 'governance', toAgent: 'company', connectionType: 'subscribes_to', attributes: ['governanceScore', 'riskFactors'], bidirectional: false, autoSync: true },
      { id: 'gov_to_pmo', fromAgent: 'governance', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['complianceScore', 'activeViolations'], bidirectional: true, autoSync: true },
    ],
    mem0Patterns: ['governance:*', 'compliance:*', 'policy:*'],
    lettaArchive: ['Policy decisions', 'Audit findings', 'Compliance patterns'],
  },
  planning: {
    type: 'planning',
    displayName: 'Planning Agent',
    description: 'Strategic Planning - manages roadmaps, dependencies, and resource allocation',
    icon: 'map',
    color: '#84cc16',
    attributes: [
      { id: 'plan_roadmap_health', name: 'roadmapHealth', displayName: 'Roadmap Health', category: 'dashboard', dataType: 'string', description: 'Overall roadmap status', required: true, triggerSignal: true },
      { id: 'plan_dependencies', name: 'criticalDependencies', displayName: 'Critical Dependencies', category: 'dependency', dataType: 'array', description: 'Critical cross-project dependencies', required: false, triggerSignal: true },
      { id: 'plan_capacity', name: 'resourceCapacity', displayName: 'Resource Capacity', category: 'report', dataType: 'json', description: 'Resource capacity by team', required: false },
    ],
    functions: [],
    connections: [
      { id: 'plan_to_pmo', fromAgent: 'planning', toAgent: 'pmo', connectionType: 'provides_to', attributes: ['roadmapHealth', 'criticalDependencies'], bidirectional: true, autoSync: true },
      { id: 'plan_sub_company', fromAgent: 'planning', toAgent: 'company', connectionType: 'subscribes_to', attributes: ['strategicPriorities'], bidirectional: false, autoSync: true },
    ],
    mem0Patterns: ['planning:*', 'roadmap:*', 'dependency:*'],
    lettaArchive: ['Planning decisions', 'Dependency resolutions', 'Capacity patterns'],
  },
  integrated: {
    type: 'integrated',
    displayName: 'Integrated Agent',
    description: 'Cross-domain Integration - synthesizes insights across all agents',
    icon: 'layers',
    color: '#6b7280',
    attributes: [
      { id: 'int_synthesis', name: 'crossDomainSynthesis', displayName: 'Cross-Domain Synthesis', category: 'dashboard', dataType: 'json', description: 'Integrated view across all domains', required: true, triggerSignal: true },
      { id: 'int_correlations', name: 'detectedCorrelations', displayName: 'Detected Correlations', category: 'report', dataType: 'array', description: 'Correlations between agents', required: false, triggerSignal: true },
    ],
    functions: [],
    connections: [
      // Integrated subscribes to ALL agents
      { id: 'int_sub_all', fromAgent: 'integrated', toAgent: 'pmo', connectionType: 'subscribes_to', attributes: ['*'], bidirectional: false, autoSync: true },
    ],
    mem0Patterns: ['*:*'],
    lettaArchive: ['Cross-domain insights', 'Pattern correlations', 'Systemic issues'],
  },
};

// ============================================================================
// AGENT OBJECT MODEL SERVICE
// ============================================================================

export class AgentObjectModelService {
  /**
   * Get agent definition by type
   */
  getAgentDefinition(agentType: AgentType): AgentDefinition {
    return AGENT_TEMPLATES[agentType];
  }

  /**
   * Get all agent definitions
   */
  getAllAgentDefinitions(): AgentDefinition[] {
    return Object.values(AGENT_TEMPLATES);
  }

  /**
   * Get attributes that an agent depends on from other agents
   */
  getDependencyAttributes(agentType: AgentType): { source: AgentType; attributes: string[] }[] {
    const agent = AGENT_TEMPLATES[agentType];
    const dependencies: { source: AgentType; attributes: string[] }[] = [];
    
    // From connections (subscribes_to)
    for (const conn of agent.connections) {
      if (conn.connectionType === 'subscribes_to') {
        dependencies.push({
          source: conn.toAgent,
          attributes: conn.attributes,
        });
      }
    }
    
    // From attributes with source
    const sourcedAttrs = agent.attributes.filter(a => a.source);
    for (const attr of sourcedAttrs) {
      const existing = dependencies.find(d => d.source === attr.source);
      if (existing) {
        existing.attributes.push(attr.name);
      } else {
        dependencies.push({
          source: attr.source as AgentType,
          attributes: [attr.name],
        });
      }
    }
    
    return dependencies;
  }

  /**
   * Get Mem0 subscription patterns for an agent
   */
  getMem0Patterns(agentType: AgentType): string[] {
    return AGENT_TEMPLATES[agentType].mem0Patterns;
  }

  /**
   * Get Letta archive topics for an agent
   */
  getLettaArchiveTopics(agentType: AgentType): string[] {
    return AGENT_TEMPLATES[agentType].lettaArchive;
  }

  /**
   * Get all connections for Neo4j sync
   */
  getAllConnectionsForNeo4j(): AgentConnection[] {
    const connections: AgentConnection[] = [];
    for (const agent of Object.values(AGENT_TEMPLATES)) {
      connections.push(...agent.connections.filter(c => c.autoSync));
    }
    return connections;
  }

  /**
   * Get signal-triggering attributes (for broadcast system)
   */
  getSignalTriggeringAttributes(agentType: AgentType): AgentAttribute[] {
    return AGENT_TEMPLATES[agentType].attributes.filter(a => a.triggerSignal);
  }
}

// Singleton
export const agentObjectModel = new AgentObjectModelService();
