/**
 * SEED WIDGET DEFINITIONS
 *
 * Seeds the widget_definitions table with default dashboard widgets.
 * Each widget is linked to agent attributes, enabling dynamic/liquid UI.
 *
 * Idempotent - safe to run multiple times (uses upsert pattern)
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

interface WidgetDefinition {
  slug: string;
  name: string;
  description: string;
  widgetType: string;
  agentId: string;
  primaryAttribute: string;
  secondaryAttributes?: string[];
  size: 'small' | 'medium' | 'large' | 'full';
  category: string;
  config?: Record<string, any>;
  isDefault: boolean;
  sortOrder: number;
  palantirObjectType?: string;
}

// ============================================================================
// FINOPS DASHBOARD WIDGETS
// ============================================================================
const FINOPS_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'finops-total-budget',
    name: 'Total Budget',
    description: 'Total budget across portfolio',
    widgetType: 'stat-card',
    agentId: 'finops',
    primaryAttribute: 'finops_total_budget',
    size: 'small',
    category: 'budget',
    config: { prefix: '$', format: 'compact' },
    isDefault: true,
    sortOrder: 1,
    palantirObjectType: 'AtlasBudget',
  },
  {
    slug: 'finops-budget-spent',
    name: 'Budget Spent',
    description: 'Total spend to date',
    widgetType: 'stat-card',
    agentId: 'finops',
    primaryAttribute: 'finops_budget_spent',
    size: 'small',
    category: 'budget',
    config: { prefix: '$', format: 'compact', showTrend: true },
    isDefault: true,
    sortOrder: 2,
    palantirObjectType: 'AtlasBudget',
  },
  {
    slug: 'finops-cpi-gauge',
    name: 'Cost Performance Index',
    description: 'CPI gauge showing cost efficiency',
    widgetType: 'gauge',
    agentId: 'finops',
    primaryAttribute: 'finops_cpi',
    size: 'medium',
    category: 'evm',
    config: { min: 0, max: 2, target: 1, zones: [{ from: 0, to: 0.9, color: 'red' }, { from: 0.9, to: 1, color: 'yellow' }, { from: 1, to: 2, color: 'green' }] },
    isDefault: true,
    sortOrder: 3,
    palantirObjectType: 'AtlasKpi',
  },
  {
    slug: 'finops-spi-gauge',
    name: 'Schedule Performance Index',
    description: 'SPI gauge showing schedule efficiency',
    widgetType: 'gauge',
    agentId: 'finops',
    primaryAttribute: 'finops_spi',
    size: 'medium',
    category: 'evm',
    config: { min: 0, max: 2, target: 1, zones: [{ from: 0, to: 0.9, color: 'red' }, { from: 0.9, to: 1, color: 'yellow' }, { from: 1, to: 2, color: 'green' }] },
    isDefault: true,
    sortOrder: 4,
    palantirObjectType: 'AtlasKpi',
  },
  {
    slug: 'finops-burn-rate',
    name: 'Monthly Burn Rate',
    description: 'Current monthly expenditure rate with trend',
    widgetType: 'trend-card',
    agentId: 'finops',
    primaryAttribute: 'finops_burn_rate',
    size: 'medium',
    category: 'budget',
    config: { prefix: '$', suffix: '/mo', showSparkline: true },
    isDefault: true,
    sortOrder: 5,
  },
  {
    slug: 'finops-budget-trend',
    name: 'Budget Trend',
    description: 'Historical budget utilization',
    widgetType: 'chart-line',
    agentId: 'finops',
    primaryAttribute: 'finops_budget_trend',
    size: 'large',
    category: 'analysis',
    config: { xAxis: 'month', yAxis: 'amount', fill: true },
    isDefault: true,
    sortOrder: 6,
  },
  {
    slug: 'finops-cost-by-category',
    name: 'Cost by Category',
    description: 'Budget distribution by category',
    widgetType: 'chart-pie',
    agentId: 'finops',
    primaryAttribute: 'finops_cost_by_category',
    size: 'medium',
    category: 'analysis',
    config: { showLegend: true, showPercent: true },
    isDefault: true,
    sortOrder: 7,
  },
];

// ============================================================================
// TMO DASHBOARD WIDGETS
// ============================================================================
const TMO_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'tmo-total-projects',
    name: 'Total Projects',
    description: 'Active projects in portfolio',
    widgetType: 'stat-card',
    agentId: 'tmo',
    primaryAttribute: 'tmo_total_projects',
    size: 'small',
    category: 'portfolio',
    isDefault: true,
    sortOrder: 1,
    palantirObjectType: 'AtlasProject',
  },
  {
    slug: 'tmo-projects-at-risk',
    name: 'Projects at Risk',
    description: 'Projects with schedule risk',
    widgetType: 'stat-card',
    agentId: 'tmo',
    primaryAttribute: 'tmo_projects_at_risk',
    size: 'small',
    category: 'portfolio',
    config: { alertThreshold: 3, variant: 'warning' },
    isDefault: true,
    sortOrder: 2,
    palantirObjectType: 'AtlasProject',
  },
  {
    slug: 'tmo-schedule-health',
    name: 'Schedule Health',
    description: 'Portfolio schedule health score',
    widgetType: 'gauge',
    agentId: 'tmo',
    primaryAttribute: 'tmo_schedule_health_score',
    size: 'medium',
    category: 'portfolio',
    config: { min: 0, max: 100, suffix: '%', zones: [{ from: 0, to: 50, color: 'red' }, { from: 50, to: 75, color: 'yellow' }, { from: 75, to: 100, color: 'green' }] },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'tmo-milestones-overdue',
    name: 'Overdue Milestones',
    description: 'Milestones past their due date',
    widgetType: 'stat-card',
    agentId: 'tmo',
    primaryAttribute: 'tmo_milestones_overdue',
    size: 'small',
    category: 'milestones',
    config: { alertThreshold: 2, variant: 'danger' },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'tmo-velocity-trend',
    name: 'Team Velocity',
    description: 'Sprint velocity trend',
    widgetType: 'trend-card',
    agentId: 'tmo',
    primaryAttribute: 'tmo_velocity',
    size: 'medium',
    category: 'timeline',
    config: { suffix: ' pts', showSparkline: true },
    isDefault: true,
    sortOrder: 5,
  },
  {
    slug: 'tmo-milestone-completion',
    name: 'Milestone Completion Rate',
    description: 'On-time milestone completion percentage',
    widgetType: 'progress',
    agentId: 'tmo',
    primaryAttribute: 'tmo_milestone_completion_rate',
    size: 'medium',
    category: 'milestones',
    config: { showPercent: true, colorByValue: true },
    isDefault: true,
    sortOrder: 6,
  },
  {
    slug: 'tmo-timeline-forecast',
    name: 'Timeline Forecast',
    description: 'Projected completion dates by project',
    widgetType: 'chart-bar',
    agentId: 'tmo',
    primaryAttribute: 'tmo_timeline_forecast',
    size: 'large',
    category: 'timeline',
    config: { orientation: 'horizontal', showOriginalDate: true },
    isDefault: true,
    sortOrder: 7,
  },
];

// ============================================================================
// RISK DASHBOARD WIDGETS
// ============================================================================
const RISK_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'risk-total-risks',
    name: 'Total Risks',
    description: 'All identified risks',
    widgetType: 'stat-card',
    agentId: 'risk',
    primaryAttribute: 'risk_total_risks',
    size: 'small',
    category: 'overview',
    isDefault: true,
    sortOrder: 1,
    palantirObjectType: 'AtlasRisk',
  },
  {
    slug: 'risk-critical-risks',
    name: 'Critical Risks',
    description: 'Critical severity risks requiring immediate attention',
    widgetType: 'stat-card',
    agentId: 'risk',
    primaryAttribute: 'risk_critical_risks',
    size: 'small',
    category: 'overview',
    config: { variant: 'danger', pulse: true },
    isDefault: true,
    sortOrder: 2,
    palantirObjectType: 'AtlasRisk',
  },
  {
    slug: 'risk-portfolio-score',
    name: 'Portfolio Risk Score',
    description: 'Overall risk assessment score',
    widgetType: 'gauge',
    agentId: 'risk',
    primaryAttribute: 'risk_portfolio_risk_score',
    size: 'medium',
    category: 'scores',
    config: { min: 0, max: 100, invertColors: true, zones: [{ from: 0, to: 40, color: 'green' }, { from: 40, to: 70, color: 'yellow' }, { from: 70, to: 100, color: 'red' }] },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'risk-exposure',
    name: 'Risk Exposure',
    description: 'Total financial exposure from risks',
    widgetType: 'stat-card',
    agentId: 'risk',
    primaryAttribute: 'risk_risk_exposure',
    size: 'small',
    category: 'scores',
    config: { prefix: '$', format: 'compact' },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'risk-heat-map',
    name: 'Risk Heat Map',
    description: 'Probability vs Impact matrix',
    widgetType: 'heat-map',
    agentId: 'risk',
    primaryAttribute: 'risk_risk_heat_map',
    size: 'large',
    category: 'analysis',
    config: { xAxis: 'probability', yAxis: 'impact', cellSize: 40 },
    isDefault: true,
    sortOrder: 5,
  },
  {
    slug: 'risk-by-category',
    name: 'Risks by Category',
    description: 'Distribution of risks by category',
    widgetType: 'chart-pie',
    agentId: 'risk',
    primaryAttribute: 'risk_risks_by_category',
    size: 'medium',
    category: 'analysis',
    config: { showLegend: true },
    isDefault: true,
    sortOrder: 6,
  },
  {
    slug: 'risk-trend',
    name: 'Risk Trend',
    description: 'Historical risk count over time',
    widgetType: 'chart-line',
    agentId: 'risk',
    primaryAttribute: 'risk_risk_trend',
    size: 'medium',
    category: 'analysis',
    config: { showArea: true },
    isDefault: true,
    sortOrder: 7,
  },
];

// ============================================================================
// PMO DASHBOARD WIDGETS
// ============================================================================
const PMO_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'pmo-health-score',
    name: 'Portfolio Health',
    description: 'Overall portfolio health score',
    widgetType: 'gauge',
    agentId: 'pmo',
    primaryAttribute: 'pmo_portfolio_health_score',
    size: 'medium',
    category: 'health',
    config: { min: 0, max: 100, suffix: '%' },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'pmo-rag-status',
    name: 'RAG Status Summary',
    description: 'Projects by RAG status',
    widgetType: 'kpi-card',
    agentId: 'pmo',
    primaryAttribute: 'pmo_projects_green',
    secondaryAttributes: ['pmo_projects_amber', 'pmo_projects_red'],
    size: 'medium',
    category: 'health',
    config: { layout: 'horizontal', colors: ['green', 'amber', 'red'] },
    isDefault: true,
    sortOrder: 2,
    palantirObjectType: 'AtlasProject',
  },
  {
    slug: 'pmo-governance-compliance',
    name: 'Governance Compliance',
    description: 'Percentage meeting governance requirements',
    widgetType: 'progress',
    agentId: 'pmo',
    primaryAttribute: 'pmo_governance_compliance',
    size: 'small',
    category: 'governance',
    config: { target: 100 },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'pmo-resource-utilization',
    name: 'Resource Utilization',
    description: 'Average resource utilization',
    widgetType: 'gauge',
    agentId: 'pmo',
    primaryAttribute: 'pmo_resource_utilization',
    size: 'medium',
    category: 'resources',
    config: { min: 0, max: 100, suffix: '%', target: 85 },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'pmo-pending-approvals',
    name: 'Pending Approvals',
    description: 'Items awaiting approval',
    widgetType: 'stat-card',
    agentId: 'pmo',
    primaryAttribute: 'pmo_pending_approvals',
    size: 'small',
    category: 'governance',
    config: { alertThreshold: 5 },
    isDefault: true,
    sortOrder: 5,
  },
  {
    slug: 'pmo-portfolio-by-stage',
    name: 'Portfolio by Stage',
    description: 'Projects by SAFe stage',
    widgetType: 'chart-bar',
    agentId: 'pmo',
    primaryAttribute: 'pmo_portfolio_by_stage',
    size: 'large',
    category: 'analysis',
    config: { orientation: 'horizontal' },
    isDefault: true,
    sortOrder: 6,
  },
];

// ============================================================================
// INTEGRATED DASHBOARD WIDGETS (Executive Summary)
// ============================================================================
const INTEGRATED_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'integrated-portfolio-score',
    name: 'Portfolio Score',
    description: 'Composite portfolio health score',
    widgetType: 'gauge',
    agentId: 'integrated',
    primaryAttribute: 'integrated_portfolio_score',
    size: 'large',
    category: 'overview',
    config: { min: 0, max: 100, suffix: '%', size: 'large' },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'integrated-exec-status',
    name: 'Executive Status',
    description: 'High-level portfolio status',
    widgetType: 'status-badge',
    agentId: 'integrated',
    primaryAttribute: 'integrated_executive_summary_status',
    size: 'small',
    category: 'overview',
    config: { size: 'large' },
    isDefault: true,
    sortOrder: 2,
  },
  {
    slug: 'integrated-initiatives-summary',
    name: 'Initiatives Summary',
    description: 'Total initiatives and status',
    widgetType: 'kpi-card',
    agentId: 'integrated',
    primaryAttribute: 'integrated_total_initiatives',
    secondaryAttributes: ['integrated_initiatives_on_track'],
    size: 'medium',
    category: 'overview',
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'integrated-active-insights',
    name: 'Active Insights',
    description: 'Insights requiring attention',
    widgetType: 'stat-card',
    agentId: 'integrated',
    primaryAttribute: 'integrated_active_insights',
    size: 'small',
    category: 'insights',
    config: { icon: 'lightbulb' },
    isDefault: true,
    sortOrder: 4,
    palantirObjectType: 'AtlasInsight',
  },
  {
    slug: 'integrated-high-priority-insights',
    name: 'High Priority Insights',
    description: 'Critical insights requiring action',
    widgetType: 'stat-card',
    agentId: 'integrated',
    primaryAttribute: 'integrated_high_priority_insights',
    size: 'small',
    category: 'insights',
    config: { variant: 'danger', pulse: true },
    isDefault: true,
    sortOrder: 5,
    palantirObjectType: 'AtlasInsight',
  },
  {
    slug: 'integrated-insights-by-agent',
    name: 'Insights by Agent',
    description: 'Insight distribution by source agent',
    widgetType: 'chart-bar',
    agentId: 'integrated',
    primaryAttribute: 'integrated_insights_by_agent',
    size: 'medium',
    category: 'insights',
    config: { orientation: 'horizontal', colorByAgent: true },
    isDefault: true,
    sortOrder: 6,
  },
  {
    slug: 'integrated-cross-domain-score',
    name: 'Cross-Domain Score',
    description: 'Composite score from all domain agents',
    widgetType: 'gauge',
    agentId: 'integrated',
    primaryAttribute: 'integrated_cross_domain_score',
    size: 'medium',
    category: 'cross_domain',
    config: { min: 0, max: 100, suffix: '%', showBreakdown: true },
    isDefault: true,
    sortOrder: 7,
  },
];

// ============================================================================
// NOTIFICATION DASHBOARD WIDGETS
// ============================================================================
const NOTIFICATION_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'notification-active-alerts',
    name: 'Active Alerts',
    description: 'Total active alerts',
    widgetType: 'stat-card',
    agentId: 'notification',
    primaryAttribute: 'notification_active_alerts',
    size: 'small',
    category: 'alerts',
    config: { icon: 'bell' },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'notification-critical-alerts',
    name: 'Critical Alerts',
    description: 'Alerts requiring immediate attention',
    widgetType: 'stat-card',
    agentId: 'notification',
    primaryAttribute: 'notification_critical_alerts',
    size: 'small',
    category: 'alerts',
    config: { variant: 'danger', pulse: true, icon: 'alert-triangle' },
    isDefault: true,
    sortOrder: 2,
  },
  {
    slug: 'notification-pending-approvals',
    name: 'Pending Approvals',
    description: 'Approvals awaiting decision',
    widgetType: 'stat-card',
    agentId: 'notification',
    primaryAttribute: 'notification_pending_approvals',
    size: 'small',
    category: 'approvals',
    config: { icon: 'check-circle' },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'notification-approval-rate',
    name: 'Approval Rate',
    description: 'Percentage of requests approved',
    widgetType: 'gauge',
    agentId: 'notification',
    primaryAttribute: 'notification_approval_rate',
    size: 'medium',
    category: 'approvals',
    config: { min: 0, max: 100, suffix: '%' },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'notification-signals-by-type',
    name: 'Signals by Type',
    description: 'Distribution of agent signals',
    widgetType: 'chart-pie',
    agentId: 'notification',
    primaryAttribute: 'notification_signals_by_type',
    size: 'medium',
    category: 'signals',
    config: { showLegend: true },
    isDefault: true,
    sortOrder: 5,
  },
];

// ============================================================================
// VRO DASHBOARD WIDGETS
// ============================================================================
const VRO_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'vro-expected-value',
    name: 'Expected Value',
    description: 'Total expected value from initiatives',
    widgetType: 'stat-card',
    agentId: 'vro',
    primaryAttribute: 'vro_total_expected_value',
    size: 'small',
    category: 'value',
    config: { prefix: '$', format: 'compact' },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'vro-realized-value',
    name: 'Realized Value',
    description: 'Value actually realized',
    widgetType: 'stat-card',
    agentId: 'vro',
    primaryAttribute: 'vro_realized_value',
    size: 'small',
    category: 'value',
    config: { prefix: '$', format: 'compact', showTrend: true },
    isDefault: true,
    sortOrder: 2,
  },
  {
    slug: 'vro-realization-rate',
    name: 'Realization Rate',
    description: 'Percentage of expected value realized',
    widgetType: 'gauge',
    agentId: 'vro',
    primaryAttribute: 'vro_value_realization_rate',
    size: 'medium',
    category: 'value',
    config: { min: 0, max: 100, suffix: '%', target: 100 },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'vro-portfolio-roi',
    name: 'Portfolio ROI',
    description: 'Return on investment',
    widgetType: 'stat-card',
    agentId: 'vro',
    primaryAttribute: 'vro_portfolio_roi',
    size: 'small',
    category: 'roi',
    config: { suffix: '%', showTrend: true },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'vro-value-by-category',
    name: 'Value by Category',
    description: 'Value distribution by category',
    widgetType: 'chart-pie',
    agentId: 'vro',
    primaryAttribute: 'vro_value_by_category',
    size: 'medium',
    category: 'analysis',
    config: { showLegend: true },
    isDefault: true,
    sortOrder: 5,
  },
];

// ============================================================================
// OCM DASHBOARD WIDGETS
// ============================================================================
const OCM_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'ocm-adoption-rate',
    name: 'Adoption Rate',
    description: 'Overall user adoption percentage',
    widgetType: 'gauge',
    agentId: 'ocm',
    primaryAttribute: 'ocm_adoption_rate',
    size: 'medium',
    category: 'adoption',
    config: { min: 0, max: 100, suffix: '%', target: 80 },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'ocm-change-readiness',
    name: 'Change Readiness',
    description: 'Organization readiness score',
    widgetType: 'gauge',
    agentId: 'ocm',
    primaryAttribute: 'ocm_change_readiness_score',
    size: 'medium',
    category: 'readiness',
    config: { min: 0, max: 100, suffix: '%' },
    isDefault: true,
    sortOrder: 2,
  },
  {
    slug: 'ocm-training-completion',
    name: 'Training Completion',
    description: 'Training completion percentage',
    widgetType: 'progress',
    agentId: 'ocm',
    primaryAttribute: 'ocm_training_completion',
    size: 'medium',
    category: 'readiness',
    config: { showPercent: true },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'ocm-resistance-level',
    name: 'Resistance Level',
    description: 'Change resistance indicator',
    widgetType: 'gauge',
    agentId: 'ocm',
    primaryAttribute: 'ocm_resistance_level',
    size: 'medium',
    category: 'stakeholders',
    config: { min: 0, max: 100, suffix: '%', invertColors: true },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'ocm-adoption-trend',
    name: 'Adoption Trend',
    description: 'Historical adoption rate',
    widgetType: 'chart-line',
    agentId: 'ocm',
    primaryAttribute: 'ocm_adoption_trend',
    size: 'large',
    category: 'adoption',
    config: { showArea: true, showTarget: true },
    isDefault: true,
    sortOrder: 5,
  },
];

// ============================================================================
// GOVERNANCE DASHBOARD WIDGETS
// ============================================================================
const GOVERNANCE_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'governance-compliance-score',
    name: 'Compliance Score',
    description: 'Overall compliance rating',
    widgetType: 'gauge',
    agentId: 'governance',
    primaryAttribute: 'governance_compliance_score',
    size: 'medium',
    category: 'compliance',
    config: { min: 0, max: 100, suffix: '%', target: 95 },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'governance-policy-violations',
    name: 'Policy Violations',
    description: 'Active policy violations',
    widgetType: 'stat-card',
    agentId: 'governance',
    primaryAttribute: 'governance_policy_violations',
    size: 'small',
    category: 'compliance',
    config: { variant: 'danger', alertThreshold: 1 },
    isDefault: true,
    sortOrder: 2,
  },
  {
    slug: 'governance-pending-approvals',
    name: 'Pending Approvals',
    description: 'Items awaiting governance approval',
    widgetType: 'stat-card',
    agentId: 'governance',
    primaryAttribute: 'governance_pending_approvals',
    size: 'small',
    category: 'approvals',
    config: { icon: 'clipboard-check' },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'governance-control-effectiveness',
    name: 'Control Effectiveness',
    description: 'Percentage of controls operating effectively',
    widgetType: 'gauge',
    agentId: 'governance',
    primaryAttribute: 'governance_control_effectiveness',
    size: 'medium',
    category: 'controls',
    config: { min: 0, max: 100, suffix: '%', target: 95 },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'governance-audit-findings',
    name: 'Open Audit Findings',
    description: 'Unresolved audit findings',
    widgetType: 'stat-card',
    agentId: 'governance',
    primaryAttribute: 'governance_audit_findings',
    size: 'small',
    category: 'compliance',
    config: { alertThreshold: 3 },
    isDefault: true,
    sortOrder: 5,
  },
];

// ============================================================================
// PLANNING DASHBOARD WIDGETS
// ============================================================================
const PLANNING_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'planning-capacity-utilization',
    name: 'Capacity Utilization',
    description: 'Team capacity usage',
    widgetType: 'gauge',
    agentId: 'planning',
    primaryAttribute: 'planning_capacity_utilization',
    size: 'medium',
    category: 'capacity',
    config: { min: 0, max: 100, suffix: '%', target: 85 },
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: 'planning-backlog-size',
    name: 'Backlog Size',
    description: 'Total items in backlog',
    widgetType: 'stat-card',
    agentId: 'planning',
    primaryAttribute: 'planning_backlog_size',
    size: 'small',
    category: 'backlog',
    isDefault: true,
    sortOrder: 2,
  },
  {
    slug: 'planning-sprint-velocity',
    name: 'Sprint Velocity',
    description: 'Average sprint velocity',
    widgetType: 'trend-card',
    agentId: 'planning',
    primaryAttribute: 'planning_sprint_velocity',
    size: 'medium',
    category: 'sprint',
    config: { suffix: ' pts', showSparkline: true },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'planning-sprint-progress',
    name: 'Sprint Progress',
    description: 'Current sprint completion',
    widgetType: 'progress',
    agentId: 'planning',
    primaryAttribute: 'planning_current_sprint_progress',
    size: 'medium',
    category: 'sprint',
    config: { showPercent: true },
    isDefault: true,
    sortOrder: 4,
  },
  {
    slug: 'planning-burndown',
    name: 'Sprint Burndown',
    description: 'Current sprint burndown chart',
    widgetType: 'chart-line',
    agentId: 'planning',
    primaryAttribute: 'planning_sprint_burndown',
    size: 'large',
    category: 'sprint',
    config: { showIdealLine: true, showTrend: true },
    isDefault: true,
    sortOrder: 5,
  },
];

// ============================================================================
// OKR DASHBOARD WIDGETS
// ============================================================================
const OKR_WIDGETS: WidgetDefinition[] = [
  {
    slug: 'okr-achievement-rate',
    name: 'OKR Achievement Rate',
    description: 'Percentage of OKRs achieved',
    widgetType: 'gauge',
    agentId: 'okr',
    primaryAttribute: 'okr_okr_achievement_rate',
    size: 'medium',
    category: 'objectives',
    config: { min: 0, max: 100, suffix: '%', target: 70 },
    isDefault: true,
    sortOrder: 1,
    palantirObjectType: 'AtlasObjective',
  },
  {
    slug: 'okr-total-objectives',
    name: 'Total Objectives',
    description: 'Number of objectives',
    widgetType: 'stat-card',
    agentId: 'okr',
    primaryAttribute: 'okr_total_objectives',
    size: 'small',
    category: 'objectives',
    isDefault: true,
    sortOrder: 2,
    palantirObjectType: 'AtlasObjective',
  },
  {
    slug: 'okr-objectives-at-risk',
    name: 'Objectives at Risk',
    description: 'Objectives unlikely to be achieved',
    widgetType: 'stat-card',
    agentId: 'okr',
    primaryAttribute: 'okr_objectives_at_risk',
    size: 'small',
    category: 'objectives',
    config: { variant: 'warning', alertThreshold: 2 },
    isDefault: true,
    sortOrder: 3,
  },
  {
    slug: 'okr-avg-kr-progress',
    name: 'Avg Key Result Progress',
    description: 'Average progress across key results',
    widgetType: 'progress',
    agentId: 'okr',
    primaryAttribute: 'okr_avg_key_result_progress',
    size: 'medium',
    category: 'key_results',
    config: { showPercent: true },
    isDefault: true,
    sortOrder: 4,
    palantirObjectType: 'AtlasKeyResult',
  },
  {
    slug: 'okr-progress-trend',
    name: 'OKR Progress Trend',
    description: 'Historical OKR progress',
    widgetType: 'chart-line',
    agentId: 'okr',
    primaryAttribute: 'okr_okr_progress_trend',
    size: 'large',
    category: 'analysis',
    config: { showArea: true },
    isDefault: true,
    sortOrder: 5,
  },
  {
    slug: 'okr-by-status',
    name: 'OKRs by Status',
    description: 'OKR distribution by status',
    widgetType: 'chart-pie',
    agentId: 'okr',
    primaryAttribute: 'okr_okrs_by_status',
    size: 'medium',
    category: 'analysis',
    config: { showLegend: true },
    isDefault: true,
    sortOrder: 6,
  },
];

// ============================================================================
// ALL WIDGETS
// ============================================================================
const ALL_WIDGETS: WidgetDefinition[] = [
  ...FINOPS_WIDGETS,
  ...TMO_WIDGETS,
  ...RISK_WIDGETS,
  ...PMO_WIDGETS,
  ...INTEGRATED_WIDGETS,
  ...NOTIFICATION_WIDGETS,
  ...VRO_WIDGETS,
  ...OCM_WIDGETS,
  ...GOVERNANCE_WIDGETS,
  ...PLANNING_WIDGETS,
  ...OKR_WIDGETS,
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
export async function seedWidgetDefinitions() {
  console.log('[Seed] Starting widget definitions seed...');

  let created = 0;
  let updated = 0;

  for (const widget of ALL_WIDGETS) {
    // Check if exists by slug
    const existing = await db.execute(sql`
      SELECT id FROM widget_definitions WHERE slug = ${widget.slug} LIMIT 1
    `);

    const configJson = widget.config ? JSON.stringify(widget.config) : null;
    const secondaryAttrsJson = widget.secondaryAttributes ? JSON.stringify(widget.secondaryAttributes) : null;

    if (existing.rows.length > 0) {
      // Update existing
      await db.execute(sql`
        UPDATE widget_definitions SET
          name = ${widget.name},
          description = ${widget.description},
          widget_type = ${widget.widgetType},
          agent_id = ${widget.agentId},
          primary_attribute_id = ${widget.primaryAttribute},
          secondary_attribute_ids = ${secondaryAttrsJson},
          size = ${widget.size},
          category = ${widget.category},
          config = ${configJson},
          is_default = ${widget.isDefault},
          sort_order = ${widget.sortOrder},
          palantir_object_type = ${widget.palantirObjectType || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${widget.slug}
      `);
      updated++;
    } else {
      // Insert new
      await db.execute(sql`
        INSERT INTO widget_definitions (
          slug, name, description, widget_type, agent_id,
          primary_attribute_id, secondary_attribute_ids, size,
          category, config, is_default, sort_order, palantir_object_type
        ) VALUES (
          ${widget.slug},
          ${widget.name},
          ${widget.description},
          ${widget.widgetType},
          ${widget.agentId},
          ${widget.primaryAttribute},
          ${secondaryAttrsJson},
          ${widget.size},
          ${widget.category},
          ${configJson},
          ${widget.isDefault},
          ${widget.sortOrder},
          ${widget.palantirObjectType || null}
        )
      `);
      created++;
    }
  }

  // Count totals
  const totalCount = await db.execute(sql`SELECT COUNT(*) as count FROM widget_definitions`);
  const total = totalCount.rows[0]?.count || 0;

  console.log(`[Seed] Widget definitions: ${created} created, ${updated} updated, ${total} total`);
  console.log('[Seed] Widget definitions seed complete!');

  return { created, updated, total };
}

// Run if called directly
if (process.argv[1]?.includes('seed-widget-definitions')) {
  seedWidgetDefinitions()
    .then((result) => {
      console.log('[Seed] Result:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
