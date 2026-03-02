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

/**
 * AgentType - dynamic string to allow new agents without code changes
 * Known agents: company, pmo, finops, tmo, risk, vro, ocm, governance, planning, integrated, okr, notification
 * New agents can be added via Admin UI without modifying this type
 */
export type AgentType = string;

// Legacy type for backward compatibility with existing code
export type KnownAgentType =
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
 * Enhanced with SAFe 6.0 Flow Metrics and PMBOK 7 Performance Domains
 * 
 * SAFe 6.0 Reference: framework.scaledagile.com/measure-and-grow
 * PMBOK 7 Reference: PMI Measurement Performance Domain
 */
export const PMO_AGENT: AgentDefinition = {
  type: 'pmo',
  displayName: 'PMO Agent',
  description: 'Project Management Office - monitors project health, schedules, and resources across portfolio using SAFe 6.0 Flow Metrics and PMBOK 7 Performance Domains',
  icon: 'clipboard-list',
  color: '#2563eb',
  attributes: [
    // =========================================================================
    // CORE DASHBOARD METRICS
    // =========================================================================
    { id: 'pmo_portfolio_health', name: 'portfolioHealthScore', displayName: 'Portfolio Health', category: 'dashboard', dataType: 'number', description: 'Overall portfolio health score (composite of all metrics)', required: true, unit: '%', triggerSignal: true },
    { id: 'pmo_projects_count', name: 'activeProjectsCount', displayName: 'Active Projects', category: 'dashboard', dataType: 'number', description: 'Number of active projects in portfolio', required: true, triggerSignal: true },
    { id: 'pmo_at_risk_count', name: 'atRiskProjectsCount', displayName: 'At-Risk Projects', category: 'dashboard', dataType: 'number', description: 'Projects flagged at risk (health < 70%)', required: true, triggerSignal: true },
    
    // =========================================================================
    // SAFe 6.0 FLOW METRICS (framework.scaledagile.com/measure-and-grow)
    // =========================================================================
    
    // Flow Velocity - Rate of value delivery (epics/features completed per PI)
    { id: 'safe_flow_velocity', name: 'flowVelocity', displayName: 'Flow Velocity', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Number of flow items (epics/features) completed per Program Increment. Higher = faster delivery.', required: true, unit: 'items/PI', triggerSignal: true },
    
    // Flow Time - Elapsed time from start to customer delivery
    { id: 'safe_flow_time', name: 'flowTime', displayName: 'Flow Time', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Average elapsed time from work start to customer delivery (concept-to-cash). Target: minimize.', required: true, unit: 'days', triggerSignal: true },
    
    // Flow Load - Total work in progress (WIP)
    { id: 'safe_flow_load', name: 'flowLoad', displayName: 'Flow Load (WIP)', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Total number of active epics/features in progress. High WIP = bottlenecks.', required: true, unit: 'items', triggerSignal: true },
    
    // Flow Efficiency - Ratio of value-added time to total time
    { id: 'safe_flow_efficiency', name: 'flowEfficiency', displayName: 'Flow Efficiency', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: (Active work time / Total elapsed time) × 100. Highlights wait times and delays.', required: true, unit: '%', triggerSignal: true },
    
    // Flow Predictability - Business value delivered vs planned
    { id: 'safe_flow_predictability', name: 'flowPredictability', displayName: 'Flow Predictability', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: (Actual PI objectives achieved / Planned PI objectives) × 100. Target: 80-100%.', required: true, unit: '%', triggerSignal: true },
    
    // Flow Distribution - Balance across work types
    { id: 'safe_flow_distribution', name: 'flowDistribution', displayName: 'Flow Distribution', category: 'report', dataType: 'json', description: 'SAFe 6.0: Distribution of work across types: {features: %, enablers: %, defects: %, risks: %}', required: false, triggerSignal: true },
    
    // =========================================================================
    // SAFe 6.0 PORTFOLIO KPIs
    // =========================================================================
    { id: 'safe_art_predictability', name: 'artPredictability', displayName: 'ART Predictability', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Agile Release Train predictability score per PI (0-100)', required: false, unit: '%', triggerSignal: true },
    { id: 'safe_pi_objectives', name: 'piObjectivesAchieved', displayName: 'PI Objectives Achieved', category: 'report', dataType: 'number', description: 'SAFe 6.0: Percentage of committed PI objectives delivered', required: false, unit: '%', triggerSignal: true },
    { id: 'safe_wsjf_backlog', name: 'wsjfPrioritizedBacklog', displayName: 'WSJF Backlog', category: 'report', dataType: 'array', description: 'SAFe 6.0: Backlog prioritized by Weighted Shortest Job First (WSJF = value × criticality / size)', required: false },
    { id: 'safe_epic_cycle_time', name: 'epicCycleTime', displayName: 'Epic Cycle Time', category: 'report', dataType: 'number', description: 'SAFe 6.0: Average time from epic approval to deployment (days)', required: false, unit: 'days' },
    { id: 'safe_innovation_allocation', name: 'innovationAllocation', displayName: 'Innovation & Planning', category: 'report', dataType: 'number', description: 'SAFe 6.0: % of capacity allocated to Innovation & Planning iterations', required: false, unit: '%' },
    
    // =========================================================================
    // PMBOK 7 MEASUREMENT PERFORMANCE DOMAIN
    // =========================================================================
    
    // Schedule Performance
    { id: 'pmbok_milestone_completion', name: 'milestoneCompletionRate', displayName: 'Milestone Completion', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: On-time milestone completion rate (leading indicator of project health)', required: true, unit: '%', triggerSignal: true },
    { id: 'pmbok_schedule_quality', name: 'scheduleQualityIndex', displayName: 'Schedule Quality Index', category: 'report', dataType: 'number', description: 'PMBOK 7: DCMA 14-point schedule quality assessment score', required: false, unit: '%' },
    
    // Deliverable Metrics
    { id: 'pmbok_defect_density', name: 'defectDensity', displayName: 'Defect Density', category: 'report', dataType: 'number', description: 'PMBOK 7: Defects per 1000 lines of code or per deliverable', required: false, unit: 'defects/KLOC' },
    { id: 'pmbok_test_pass_rate', name: 'testPassRate', displayName: 'Test Pass Rate', category: 'report', dataType: 'number', description: 'PMBOK 7: Acceptance test pass rate (quality indicator)', required: false, unit: '%' },
    { id: 'pmbok_rework_percentage', name: 'reworkPercentage', displayName: 'Rework Percentage', category: 'report', dataType: 'number', description: 'PMBOK 7: Percentage of work requiring rework (quality waste)', required: false, unit: '%' },
    
    // Stakeholder Metrics (PMBOK 7)
    { id: 'pmbok_nps', name: 'netPromoterScore', displayName: 'Net Promoter Score', category: 'report', dataType: 'number', description: 'PMBOK 7: Stakeholder NPS (-100 to +100). Key satisfaction indicator.', required: false, unit: 'score' },
    { id: 'pmbok_stakeholder_satisfaction', name: 'stakeholderSatisfaction', displayName: 'Stakeholder Satisfaction', category: 'report', dataType: 'number', description: 'PMBOK 7: Overall stakeholder satisfaction score (1-5 or 1-10)', required: false, unit: '/10' },
    
    // Team Metrics (PMBOK 7)
    { id: 'pmbok_team_velocity', name: 'teamVelocity', displayName: 'Team Velocity', category: 'report', dataType: 'number', description: 'PMBOK 7: Team velocity trend (story points/sprint)', required: false, unit: 'pts/sprint' },
    { id: 'pmbok_team_morale', name: 'teamMorale', displayName: 'Team Morale', category: 'report', dataType: 'number', description: 'PMBOK 7: Team morale/engagement score (leading indicator)', required: false, unit: '/10' },
    { id: 'pmbok_capacity_utilization', name: 'capacityUtilization', displayName: 'Capacity Utilization', category: 'report', dataType: 'number', description: 'PMBOK 7: Resource capacity utilization rate', required: false, unit: '%' },
    
    // =========================================================================
    // DEPENDENCIES (from other agents)
    // =========================================================================
    { id: 'pmo_budget_status', name: 'budgetStatus', displayName: 'Budget Status', category: 'dependency', dataType: 'string', description: 'Overall budget status from FinOps Agent', source: 'finops', required: false, triggerSignal: true },
    { id: 'pmo_risk_score', name: 'aggregateRiskScore', displayName: 'Risk Score', category: 'dependency', dataType: 'number', description: 'Aggregate risk score from Risk Agent', source: 'risk', required: false, triggerSignal: true },
    { id: 'pmo_value_realization', name: 'valueRealizationRate', displayName: 'Value Realization', category: 'dependency', dataType: 'number', description: 'Value realization % from VRO Agent', source: 'vro', required: false, unit: '%', triggerSignal: true },
    { id: 'pmo_change_adoption', name: 'changeAdoptionRate', displayName: 'Change Adoption', category: 'dependency', dataType: 'number', description: 'Change adoption rate from OCM Agent', source: 'ocm', required: false, unit: '%' },
    { id: 'pmo_cpi', name: 'costPerformanceIndex', displayName: 'CPI', category: 'dependency', dataType: 'number', description: 'Cost Performance Index from FinOps Agent', source: 'finops', required: false, triggerSignal: true },
    { id: 'pmo_spi', name: 'schedulePerformanceIndex', displayName: 'SPI', category: 'dependency', dataType: 'number', description: 'Schedule Performance Index from FinOps Agent', source: 'finops', required: false, triggerSignal: true },
    
    // =========================================================================
    // REPORTS
    // =========================================================================
    { id: 'pmo_executive_summary', name: 'executiveSummary', displayName: 'Executive Summary', category: 'report', dataType: 'string', description: 'AI-generated executive summary using all metrics', required: false },
    { id: 'pmo_weekly_report', name: 'weeklyReportData', displayName: 'Weekly Report', category: 'report', dataType: 'json', description: 'Consolidated weekly status report data', required: false },
    
    // =========================================================================
    // MEETINGS (SAFe 6.0 Events)
    // =========================================================================
    { id: 'pmo_next_steering', name: 'nextSteeringCommittee', displayName: 'Next Steering Committee', category: 'meeting', dataType: 'date', description: 'Next steering committee meeting', required: false },
    { id: 'pmo_decisions_pending', name: 'pendingDecisions', displayName: 'Pending Decisions', category: 'meeting', dataType: 'array', description: 'Decisions awaiting approval', required: false, triggerSignal: true },
    { id: 'safe_next_pi_planning', name: 'nextPIPlanning', displayName: 'Next PI Planning', category: 'meeting', dataType: 'date', description: 'SAFe 6.0: Next Program Increment Planning event', required: false },
    { id: 'safe_portfolio_sync', name: 'nextPortfolioSync', displayName: 'Next Portfolio Sync', category: 'meeting', dataType: 'date', description: 'SAFe 6.0: Monthly portfolio sync meeting', required: false },
    
    // =========================================================================
    // NOTIFICATIONS / ALERTS
    // =========================================================================
    { id: 'pmo_critical_alerts', name: 'criticalAlerts', displayName: 'Critical Alerts', category: 'notification', dataType: 'array', description: 'Critical issues requiring immediate attention', required: false, triggerSignal: true },
    { id: 'pmo_upcoming_milestones', name: 'upcomingMilestones', displayName: 'Upcoming Milestones', category: 'notification', dataType: 'array', description: 'Milestones due in next 14 days', required: false },
    { id: 'safe_impediments', name: 'artImpediments', displayName: 'ART Impediments', category: 'notification', dataType: 'array', description: 'SAFe 6.0: Impediments blocking ART flow', required: false, triggerSignal: true },
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
 * Enhanced with PMBOK 7 Earned Value Management (EVM) and SAFe 6.0 Lean Portfolio Budgeting
 * 
 * PMBOK 7 Reference: Earned Value Management Practice Standard
 * SAFe 6.0 Reference: Lean Portfolio Management
 */
export const FINOPS_AGENT: AgentDefinition = {
  type: 'finops',
  displayName: 'FinOps Agent',
  description: 'Financial Operations - monitors budgets using PMBOK 7 Earned Value Management (EVM) and SAFe 6.0 Lean Portfolio Budgeting',
  icon: 'dollar-sign',
  color: '#059669',
  attributes: [
    // =========================================================================
    // CORE BUDGET METRICS
    // =========================================================================
    { id: 'finops_total_budget', name: 'totalPortfolioBudget', displayName: 'Total Budget', category: 'dashboard', dataType: 'number', description: 'Total portfolio budget (Budget at Completion)', required: true, unit: '$', triggerSignal: true },
    { id: 'finops_spent', name: 'actualSpent', displayName: 'Actual Spent', category: 'dashboard', dataType: 'number', description: 'Actual amount spent to date', required: true, unit: '$', triggerSignal: true },
    
    // =========================================================================
    // PMBOK 7 EARNED VALUE MANAGEMENT (EVM) - Full Set
    // Reference: PMI Practice Standard for Earned Value Management
    // =========================================================================
    
    // Core EVM Values
    { id: 'pmbok_ev', name: 'earnedValue', displayName: 'Earned Value (EV)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Measure of work performed in terms of budget authorized. EV = % Complete × BAC', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_pv', name: 'plannedValue', displayName: 'Planned Value (PV)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Authorized budget assigned to scheduled work. What should have been done by now.', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_ac', name: 'actualCost', displayName: 'Actual Cost (AC)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Realized cost incurred for work performed to date.', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_bac', name: 'budgetAtCompletion', displayName: 'Budget at Completion (BAC)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Sum of all budgets for work to be performed (original total budget).', required: true, unit: '$', triggerSignal: true },
    
    // Variance Metrics
    { id: 'pmbok_cv', name: 'costVariance', displayName: 'Cost Variance (CV)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: CV = EV - AC. Positive = under budget, Negative = over budget.', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_sv', name: 'scheduleVariance', displayName: 'Schedule Variance (SV)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: SV = EV - PV. Positive = ahead of schedule, Negative = behind schedule.', required: true, unit: '$', triggerSignal: true },
    { id: 'finops_variance', name: 'budgetVariance', displayName: 'Budget Variance %', category: 'dashboard', dataType: 'number', description: 'Budget variance as percentage of total budget', required: true, unit: '%', triggerSignal: true },
    
    // Performance Indices
    { id: 'pmbok_cpi', name: 'costPerformanceIndex', displayName: 'CPI', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: CPI = EV / AC. >1 = under budget, <1 = over budget. Key efficiency metric.', required: true, triggerSignal: true },
    { id: 'pmbok_spi', name: 'schedulePerformanceIndex', displayName: 'SPI', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: SPI = EV / PV. >1 = ahead of schedule, <1 = behind schedule.', required: true, triggerSignal: true },
    
    // Forecasting Metrics
    { id: 'pmbok_eac', name: 'estimateAtCompletion', displayName: 'Estimate at Completion (EAC)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Expected total cost. EAC = BAC / CPI (if current trends continue).', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_etc', name: 'estimateToComplete', displayName: 'Estimate to Complete (ETC)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Expected cost to finish remaining work. ETC = EAC - AC', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_vac', name: 'varianceAtCompletion', displayName: 'Variance at Completion (VAC)', category: 'dashboard', dataType: 'number', description: 'PMBOK 7: Projected budget surplus/deficit. VAC = BAC - EAC', required: true, unit: '$', triggerSignal: true },
    { id: 'pmbok_tcpi', name: 'toCompletePerformanceIndex', displayName: 'TCPI', category: 'report', dataType: 'number', description: 'PMBOK 7: Required CPI to meet budget. TCPI = (BAC - EV) / (BAC - AC). >1 = harder to achieve.', required: false, triggerSignal: true },
    
    // =========================================================================
    // SAFe 6.0 LEAN PORTFOLIO MANAGEMENT BUDGETING
    // =========================================================================
    { id: 'safe_value_stream_budgets', name: 'valueStreamBudgets', displayName: 'Value Stream Budgets', category: 'report', dataType: 'json', description: 'SAFe 6.0: Participatory budget allocation by value stream {valueStream: budget}', required: false },
    { id: 'safe_capex_opex_split', name: 'capexOpexSplit', displayName: 'CapEx/OpEx Split', category: 'report', dataType: 'json', description: 'SAFe 6.0: Capital vs Operating expense breakdown {capex: %, opex: %}', required: false },
    { id: 'safe_investment_horizons', name: 'investmentHorizons', displayName: 'Investment Horizons', category: 'report', dataType: 'json', description: 'SAFe 6.0: Budget allocation across horizons {H1_current: %, H2_emerging: %, H3_future: %}', required: false },
    { id: 'safe_epic_funding', name: 'epicFundingStatus', displayName: 'Epic Funding Status', category: 'report', dataType: 'array', description: 'SAFe 6.0: Active epics with approved lean business cases and funding', required: false },
    
    // =========================================================================
    // REPORTS & FORECASTING
    // =========================================================================
    { id: 'finops_forecast', name: 'monthlyForecast', displayName: 'Monthly Forecast', category: 'report', dataType: 'json', description: 'Rolling 12-month spending forecast with confidence intervals', required: false },
    { id: 'finops_burn_rate', name: 'burnRate', displayName: 'Burn Rate', category: 'report', dataType: 'number', description: 'Current monthly burn rate', required: false, unit: '$/month' },
    { id: 'finops_runway', name: 'budgetRunway', displayName: 'Budget Runway', category: 'report', dataType: 'number', description: 'Months of budget remaining at current burn rate', required: false, unit: 'months' },
    { id: 'finops_cost_breakdown', name: 'costBreakdown', displayName: 'Cost Breakdown', category: 'report', dataType: 'json', description: 'Cost breakdown by category: {labor: $, vendors: $, infrastructure: $, other: $}', required: false },
    
    // =========================================================================
    // NOTIFICATIONS / ALERTS
    // =========================================================================
    { id: 'finops_overrun_alerts', name: 'budgetOverrunAlerts', displayName: 'Budget Overrun Alerts', category: 'notification', dataType: 'array', description: 'Projects exceeding budget thresholds (CPI < 0.9)', required: false, triggerSignal: true },
    { id: 'finops_approval_pending', name: 'pendingApprovals', displayName: 'Pending Approvals', category: 'notification', dataType: 'array', description: 'Budget change requests awaiting approval', required: false },
    { id: 'finops_cpi_alerts', name: 'cpiAlerts', displayName: 'CPI Alerts', category: 'notification', dataType: 'array', description: 'Projects with CPI < 0.9 (10%+ cost overrun)', required: false, triggerSignal: true },
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
 * Enhanced with SAFe 6.0 OKRs/KPIs and Benefits Realization Framework
 * 
 * SAFe 6.0 Reference: Value Stream KPIs, OKRs
 * PMI Reference: Benefits Realization Management
 */
export const VRO_AGENT: AgentDefinition = {
  type: 'vro',
  displayName: 'VRO Agent',
  description: 'Value Realization Office - tracks benefits using SAFe 6.0 OKRs/KPIs and PMI Benefits Realization Management',
  icon: 'trending-up',
  color: '#7c3aed',
  attributes: [
    // =========================================================================
    // CORE VALUE METRICS
    // =========================================================================
    { id: 'vro_total_benefits', name: 'totalPlannedBenefits', displayName: 'Total Planned Benefits', category: 'dashboard', dataType: 'number', description: 'Total planned benefits value across portfolio', required: true, unit: '$', triggerSignal: true },
    { id: 'vro_realized', name: 'benefitsRealized', displayName: 'Benefits Realized', category: 'dashboard', dataType: 'number', description: 'Actual benefits realized to date', required: true, unit: '$', triggerSignal: true },
    { id: 'vro_realization_rate', name: 'realizationRate', displayName: 'Realization Rate', category: 'dashboard', dataType: 'number', description: 'Benefits realization percentage (realized/planned × 100)', required: true, unit: '%', triggerSignal: true },
    { id: 'vro_value_score', name: 'valueScore', displayName: 'Value Score', category: 'dashboard', dataType: 'number', description: 'Composite value delivery score (0-100)', required: true, triggerSignal: true },
    
    // =========================================================================
    // SAFe 6.0 OKRs (Objectives & Key Results)
    // Reference: scaledagile.com/connecting-okrs-kpis
    // =========================================================================
    { id: 'safe_okr_progress', name: 'okrProgress', displayName: 'OKR Progress', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Overall OKR achievement progress (0-100%)', required: true, unit: '%', triggerSignal: true },
    { id: 'safe_strategic_objectives', name: 'strategicObjectives', displayName: 'Strategic Objectives', category: 'report', dataType: 'array', description: 'SAFe 6.0: Active strategic theme objectives with key results', required: false },
    { id: 'safe_key_results', name: 'keyResultsStatus', displayName: 'Key Results Status', category: 'report', dataType: 'json', description: 'SAFe 6.0: Key results by objective with confidence scores', required: false },
    
    // =========================================================================
    // SAFe 6.0 VALUE STREAM KPIs
    // Reference: framework.scaledagile.com/value-stream-kpis
    // =========================================================================
    { id: 'safe_customer_satisfaction', name: 'customerSatisfaction', displayName: 'Customer Satisfaction', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Customer satisfaction score (CSAT or NPS)', required: false, unit: 'score', triggerSignal: true },
    { id: 'safe_time_to_market', name: 'timeToMarket', displayName: 'Time to Market', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Average time from idea to production (days)', required: false, unit: 'days', triggerSignal: true },
    { id: 'safe_roi', name: 'returnOnInvestment', displayName: 'ROI', category: 'dashboard', dataType: 'number', description: 'SAFe 6.0: Return on Investment percentage', required: false, unit: '%', triggerSignal: true },
    { id: 'safe_customer_retention', name: 'customerRetention', displayName: 'Customer Retention', category: 'report', dataType: 'number', description: 'SAFe 6.0: Customer retention rate', required: false, unit: '%' },
    { id: 'safe_revenue_growth', name: 'revenueGrowth', displayName: 'Revenue Growth', category: 'report', dataType: 'number', description: 'SAFe 6.0: Revenue growth attributed to portfolio', required: false, unit: '%' },
    
    // =========================================================================
    // PMI BENEFITS REALIZATION MANAGEMENT
    // =========================================================================
    { id: 'pmi_benefits_register', name: 'benefitsRegister', displayName: 'Benefits Register', category: 'report', dataType: 'array', description: 'PMI: Complete benefits register with owners and metrics', required: false },
    { id: 'pmi_benefits_map', name: 'benefitsMap', displayName: 'Benefits Dependency Map', category: 'report', dataType: 'json', description: 'PMI: Benefits dependency mapping showing how outputs lead to outcomes', required: false },
    { id: 'pmi_transition_plan', name: 'transitionPlan', displayName: 'Transition Plan', category: 'report', dataType: 'json', description: 'PMI: Plan for transitioning benefits to operations', required: false },
    { id: 'pmi_sustaining_activities', name: 'sustainingActivities', displayName: 'Sustaining Activities', category: 'report', dataType: 'array', description: 'PMI: Activities required to sustain benefits post-project', required: false },
    
    // =========================================================================
    // OUTCOME MEASUREMENTS
    // =========================================================================
    { id: 'vro_outcomes', name: 'measuredOutcomes', displayName: 'Measured Outcomes', category: 'report', dataType: 'array', description: 'Quantified business outcomes with baseline and targets', required: false },
    { id: 'vro_lagging_indicators', name: 'laggingIndicators', displayName: 'Lagging Indicators', category: 'report', dataType: 'json', description: 'Lagging KPIs measuring past performance', required: false },
    { id: 'vro_leading_indicators', name: 'leadingIndicators', displayName: 'Leading Indicators', category: 'report', dataType: 'json', description: 'Leading KPIs predicting future performance', required: false },
    
    // =========================================================================
    // DEPENDENCIES
    // =========================================================================
    { id: 'vro_strategic_alignment', name: 'strategicAlignment', displayName: 'Strategic Alignment', category: 'dependency', dataType: 'json', description: 'Alignment to company strategic priorities', source: 'company', required: false },
    { id: 'vro_financial_context', name: 'financialContext', displayName: 'Financial Context', category: 'dependency', dataType: 'json', description: 'Financial metrics from FinOps for ROI calculations', source: 'finops', required: false },
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
// DEFAULT AGENT TEMPLATE (for dynamically added agents)
// ============================================================================

function createDefaultAgentDefinition(agentType: string): AgentDefinition {
  return {
    type: agentType,
    displayName: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
    description: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent - dynamically created`,
    icon: 'bot',
    color: '#6366f1',
    attributes: [],
    functions: [],
    connections: [],
    mem0Patterns: [`${agentType}:*`],
    lettaArchive: [`${agentType} decisions`],
  };
}

// ============================================================================
// AGENT OBJECT MODEL SERVICE
// ============================================================================

export class AgentObjectModelService {
  /**
   * Get agent definition by type
   * Returns a default template for unknown agents
   */
  getAgentDefinition(agentType: AgentType): AgentDefinition {
    return AGENT_TEMPLATES[agentType] || createDefaultAgentDefinition(agentType);
  }

  /**
   * Get all agent definitions (known templates only)
   * For all agents including dynamic ones, use AgentRegistryService
   */
  getAllAgentDefinitions(): AgentDefinition[] {
    return Object.values(AGENT_TEMPLATES);
  }

  /**
   * Get attributes that an agent depends on from other agents
   */
  getDependencyAttributes(agentType: AgentType): { source: AgentType; attributes: string[] }[] {
    const agent = this.getAgentDefinition(agentType);
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
    return this.getAgentDefinition(agentType).mem0Patterns;
  }

  /**
   * Get Letta archive topics for an agent
   */
  getLettaArchiveTopics(agentType: AgentType): string[] {
    return this.getAgentDefinition(agentType).lettaArchive;
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
    return this.getAgentDefinition(agentType).attributes.filter(a => a.triggerSignal);
  }
}

// Singleton
export const agentObjectModel = new AgentObjectModelService();
