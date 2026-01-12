// ============================================================
// DRILLDOWN REGISTRY
// Central mapping of all clickable targets to structured content
// Supports 3 levels of navigation depth
// ============================================================

import { AgentType } from './dataHub';
import { strategicThemes, valueStreams, portfolioEpics, features, stories, tasks, teams, teamMembers } from './safe6Data';
import { enrichedProjects } from './projects';

export type DrilldownLevel = 1 | 2 | 3;

export interface DrilldownMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export interface DrilldownAction {
  id: string;
  label: string;
  type: 'investigate' | 'escalate' | 'accelerate' | 'mitigate' | 'navigate' | 'view';
  targetEntityType?: string;
  targetEntityId?: string;
  description?: string;
}

export interface DrilldownRelatedItem {
  id: string;
  name: string;
  type: string;
  entityType: string;
  entityId: string;
  status?: string;
}

export interface DrilldownContent {
  title: string;
  subtitle?: string;
  description: string;
  level: DrilldownLevel;
  entityType: string;
  entityId: string;
  metrics?: DrilldownMetric[];
  actions?: DrilldownAction[];
  relatedItems?: DrilldownRelatedItem[];
  aiInsight?: string;
  agentSource?: AgentType;
  parentEntity?: { entityType: string; entityId: string };
  childEntities?: { entityType: string; entityId: string; label: string }[];
  isFullDossier?: boolean; // True for action playbooks, metric dossiers, and extended entity types
}

// ============================================================
// ACTION PLAYBOOKS - Level 2/3 content for recommended actions
// ============================================================

export const actionPlaybooks: Record<string, DrilldownContent> = {
  'investigate': {
    title: 'Investigation Playbook',
    subtitle: 'Root Cause Analysis & Discovery',
    description: 'Systematic investigation process to identify root causes, gather evidence, and recommend corrective actions.',
    level: 2,
    entityType: 'action',
    entityId: 'investigate',
    metrics: [
      { label: 'Avg Resolution Time', value: '2.5 days', trend: 'down' },
      { label: 'Success Rate', value: '94%', trend: 'up' },
      { label: 'Open Investigations', value: '3', trend: 'stable' }
    ],
    actions: [
      { id: 'inv-1', label: 'View Data Sources', type: 'navigate', targetEntityType: 'data-source', targetEntityId: 'all', description: 'Review connected data feeds' },
      { id: 'inv-2', label: 'Check Agent Logs', type: 'navigate', targetEntityType: 'agent-log', targetEntityId: 'recent', description: 'See recent agent activities' },
      { id: 'inv-3', label: 'Run Diagnostics', type: 'investigate', description: 'Execute automated diagnostic checks' }
    ],
    relatedItems: [
      { id: 'rel-1', name: 'Recent Anomalies', type: 'Alert', entityType: 'alert', entityId: 'anomalies', status: 'active' },
      { id: 'rel-2', name: 'Data Quality Report', type: 'Report', entityType: 'report', entityId: 'data-quality' },
      { id: 'rel-3', name: 'Integration Status', type: 'System', entityType: 'system', entityId: 'integrations' }
    ],
    aiInsight: 'The Integrated Management Agent recommends starting with data source validation, as 67% of recent issues trace back to integration delays.',
    agentSource: 'integrated-management'
  },
  'escalate': {
    title: 'Escalation Workflow',
    subtitle: 'Team & Stakeholder Notification',
    description: 'Structured escalation process to engage appropriate teams and stakeholders for resolution.',
    level: 2,
    entityType: 'action',
    entityId: 'escalate',
    metrics: [
      { label: 'Escalation Response', value: '< 4 hrs', trend: 'up' },
      { label: 'Resolution Rate', value: '89%', trend: 'stable' },
      { label: 'Active Escalations', value: '2', trend: 'down' }
    ],
    actions: [
      { id: 'esc-1', label: 'Notify Project Lead', type: 'escalate', targetEntityType: 'team', targetEntityId: 'project-leads', description: 'Alert project leadership' },
      { id: 'esc-2', label: 'Escalate to Steering', type: 'escalate', targetEntityType: 'team', targetEntityId: 'steering-committee', description: 'Raise to steering committee' },
      { id: 'esc-3', label: 'View Escalation History', type: 'navigate', targetEntityType: 'escalation-history', targetEntityId: 'recent' }
    ],
    relatedItems: [
      { id: 'team-1', name: 'Project Management Office', type: 'Team', entityType: 'team', entityId: 'pmo', status: 'available' },
      { id: 'team-2', name: 'Executive Sponsors', type: 'Team', entityType: 'team', entityId: 'sponsors', status: 'available' },
      { id: 'team-3', name: 'Technical Leadership', type: 'Team', entityType: 'team', entityId: 'tech-leads', status: 'available' }
    ],
    aiInsight: 'TMO Agent analysis suggests the PMO team has capacity and 2-hour average response time for similar escalations.',
    agentSource: 'tmo'
  },
  'accelerate': {
    title: 'Acceleration Options',
    subtitle: 'Fast-Track Resolution Strategies',
    description: 'Options to expedite delivery, remove blockers, and accelerate value realization.',
    level: 2,
    entityType: 'action',
    entityId: 'accelerate',
    metrics: [
      { label: 'Time Saved', value: '15 days avg', trend: 'up' },
      { label: 'Cost Impact', value: '+8%', trend: 'stable' },
      { label: 'Success Rate', value: '91%', trend: 'up' }
    ],
    actions: [
      { id: 'acc-1', label: 'Add Resources', type: 'accelerate', targetEntityType: 'resource-pool', targetEntityId: 'available', description: 'Request additional team members' },
      { id: 'acc-2', label: 'Reduce Scope', type: 'accelerate', targetEntityType: 'scope', targetEntityId: 'reduction-options', description: 'Identify scope reduction opportunities' },
      { id: 'acc-3', label: 'Fast-Track Approval', type: 'accelerate', targetEntityType: 'approval', targetEntityId: 'pending', description: 'Expedite pending approvals' },
      { id: 'acc-4', label: 'Parallel Workstreams', type: 'accelerate', description: 'Enable parallel execution' }
    ],
    relatedItems: [
      { id: 'res-1', name: 'Available Contractors', type: 'Resource', entityType: 'resource', entityId: 'contractors', status: '5 available' },
      { id: 'res-2', name: 'Internal Mobility', type: 'Resource', entityType: 'resource', entityId: 'internal', status: '3 available' },
      { id: 'scope-1', name: 'MVP Definition', type: 'Scope', entityType: 'scope', entityId: 'mvp' }
    ],
    aiInsight: 'Planning Agent identified 3 parallel workstreams that could reduce timeline by 18% with acceptable risk.',
    agentSource: 'planning'
  },
  'mitigate': {
    title: 'Risk Mitigation Plan',
    subtitle: 'Risk Reduction & Contingency',
    description: 'Structured approach to reduce risk exposure and implement contingency measures.',
    level: 2,
    entityType: 'action',
    entityId: 'mitigate',
    metrics: [
      { label: 'Risk Reduction', value: '45%', trend: 'up' },
      { label: 'Mitigation Coverage', value: '87%', trend: 'up' },
      { label: 'Open Risks', value: '4', trend: 'down' }
    ],
    actions: [
      { id: 'mit-1', label: 'Apply Contingency', type: 'mitigate', targetEntityType: 'contingency', targetEntityId: 'budget', description: 'Release contingency budget' },
      { id: 'mit-2', label: 'Implement Fallback', type: 'mitigate', targetEntityType: 'fallback', targetEntityId: 'options', description: 'Activate fallback plan' },
      { id: 'mit-3', label: 'Transfer Risk', type: 'mitigate', targetEntityType: 'risk-transfer', targetEntityId: 'options', description: 'Insurance or vendor transfer' },
      { id: 'mit-4', label: 'Accept & Monitor', type: 'mitigate', description: 'Accept with enhanced monitoring' }
    ],
    relatedItems: [
      { id: 'risk-1', name: 'Budget Overrun Risk', type: 'Risk', entityType: 'risk', entityId: 'budget-overrun', status: 'high' },
      { id: 'risk-2', name: 'Schedule Slip Risk', type: 'Risk', entityType: 'risk', entityId: 'schedule-slip', status: 'medium' },
      { id: 'risk-3', name: 'Resource Gap Risk', type: 'Risk', entityType: 'risk', entityId: 'resource-gap', status: 'low' }
    ],
    aiInsight: 'Governance Agent recommends the contingency approach based on 78% success rate in similar situations.',
    agentSource: 'governance'
  },
  'analyze': {
    title: 'Deep Dive Analysis',
    subtitle: 'Data-Driven Insights & Patterns',
    description: 'Comprehensive analysis of metrics, trends, and underlying data to surface actionable insights.',
    level: 2,
    entityType: 'action',
    entityId: 'analyze',
    metrics: [
      { label: 'Data Points Analyzed', value: '2.4K', trend: 'up' },
      { label: 'Insights Generated', value: '47', trend: 'up' },
      { label: 'Confidence Score', value: '89%', trend: 'stable' }
    ],
    actions: [
      { id: 'ana-1', label: 'Correlation Analysis', type: 'investigate', description: 'Find correlations between metrics' },
      { id: 'ana-2', label: 'Trend Detection', type: 'investigate', targetEntityType: 'trend', targetEntityId: 'all', description: 'Identify emerging trends' },
      { id: 'ana-3', label: 'Anomaly Detection', type: 'investigate', targetEntityType: 'alert', targetEntityId: 'anomalies', description: 'Detect outliers and anomalies' }
    ],
    relatedItems: [
      { id: 'ds-1', name: 'Jira Data Feed', type: 'Data Source', entityType: 'data-source', entityId: 'jira', status: 'connected' },
      { id: 'ds-2', name: 'ServiceNow Feed', type: 'Data Source', entityType: 'data-source', entityId: 'servicenow', status: 'connected' },
      { id: 'ds-3', name: 'Financial Systems', type: 'Data Source', entityType: 'data-source', entityId: 'finance', status: 'connected' }
    ],
    aiInsight: 'Integrated Management Agent detected 3 significant correlations between sprint velocity and stakeholder engagement metrics.',
    agentSource: 'integrated-management'
  },
  'forecast': {
    title: 'Run Forecast Scenario',
    subtitle: 'Predictive Modeling & What-If Analysis',
    description: 'Generate predictive forecasts and run what-if scenarios to support decision-making.',
    level: 2,
    entityType: 'action',
    entityId: 'forecast',
    metrics: [
      { label: 'Forecast Accuracy', value: '87%', trend: 'up' },
      { label: 'Scenarios Modeled', value: '12', trend: 'stable' },
      { label: 'Confidence Range', value: '±8%', trend: 'down' }
    ],
    actions: [
      { id: 'frc-1', label: 'Revenue Forecast', type: 'accelerate', targetEntityType: 'forecast', targetEntityId: 'revenue', description: 'Project revenue outcomes' },
      { id: 'frc-2', label: 'Timeline Forecast', type: 'accelerate', targetEntityType: 'forecast', targetEntityId: 'timeline', description: 'Predict delivery dates' },
      { id: 'frc-3', label: 'Resource Forecast', type: 'accelerate', targetEntityType: 'forecast', targetEntityId: 'resources', description: 'Model resource needs' }
    ],
    relatedItems: [
      { id: 'scn-1', name: 'Baseline Scenario', type: 'Scenario', entityType: 'scenario', entityId: 'baseline', status: 'active' },
      { id: 'scn-2', name: 'Optimistic Scenario', type: 'Scenario', entityType: 'scenario', entityId: 'optimistic', status: 'modeled' },
      { id: 'scn-3', name: 'Conservative Scenario', type: 'Scenario', entityType: 'scenario', entityId: 'conservative', status: 'modeled' }
    ],
    aiInsight: 'FinOps Agent: Monte Carlo simulation suggests 78% probability of meeting Q4 targets under current resource allocation.',
    agentSource: 'finops'
  },
  'alert': {
    title: 'Set Alert Threshold',
    subtitle: 'Proactive Monitoring & Notifications',
    description: 'Configure thresholds and rules for automated alerts when metrics deviate from targets.',
    level: 2,
    entityType: 'action',
    entityId: 'alert',
    metrics: [
      { label: 'Active Alerts', value: '8', trend: 'stable' },
      { label: 'Avg Response Time', value: '2.1 hrs', trend: 'down' },
      { label: 'False Positive Rate', value: '4%', trend: 'down' }
    ],
    actions: [
      { id: 'alt-1', label: 'Configure Thresholds', type: 'mitigate', description: 'Set alert trigger levels' },
      { id: 'alt-2', label: 'Notification Rules', type: 'mitigate', targetEntityType: 'notification', targetEntityId: 'rules', description: 'Define who gets notified' },
      { id: 'alt-3', label: 'View Alert History', type: 'navigate', targetEntityType: 'alert', targetEntityId: 'history', description: 'Review past alerts' }
    ],
    relatedItems: [
      { id: 'alt-budget', name: 'Budget Variance Alert', type: 'Alert', entityType: 'alert', entityId: 'budget-variance', status: 'active' },
      { id: 'alt-schedule', name: 'Schedule Slip Alert', type: 'Alert', entityType: 'alert', entityId: 'schedule-slip', status: 'active' },
      { id: 'alt-risk', name: 'Risk Escalation Alert', type: 'Alert', entityType: 'alert', entityId: 'risk-escalation', status: 'active' }
    ],
    aiInsight: 'Governance Agent recommends lowering the budget variance threshold from 10% to 7% based on recent volatility patterns.',
    agentSource: 'governance'
  },
  'report': {
    title: 'Generate Report',
    subtitle: 'Executive Reporting & Documentation',
    description: 'Generate comprehensive reports for stakeholders, steering committees, and audit purposes.',
    level: 2,
    entityType: 'action',
    entityId: 'report',
    metrics: [
      { label: 'Reports Generated', value: '24/mo', trend: 'up' },
      { label: 'Avg Generation Time', value: '< 2 min', trend: 'down' },
      { label: 'Distribution List', value: '45 users', trend: 'stable' }
    ],
    actions: [
      { id: 'rpt-1', label: 'Executive Summary', type: 'escalate', targetEntityType: 'report', targetEntityId: 'executive', description: 'High-level status report' },
      { id: 'rpt-2', label: 'Detailed Analysis', type: 'escalate', targetEntityType: 'report', targetEntityId: 'detailed', description: 'In-depth metrics report' },
      { id: 'rpt-3', label: 'Compliance Report', type: 'escalate', targetEntityType: 'report', targetEntityId: 'compliance', description: 'Audit and governance report' }
    ],
    relatedItems: [
      { id: 'rpt-weekly', name: 'Weekly Status Report', type: 'Report', entityType: 'report', entityId: 'weekly-status', status: 'scheduled' },
      { id: 'rpt-monthly', name: 'Monthly Executive Report', type: 'Report', entityType: 'report', entityId: 'monthly-exec', status: 'scheduled' },
      { id: 'rpt-adhoc', name: 'Ad-hoc Analysis', type: 'Report', entityType: 'report', entityId: 'adhoc', status: 'on-demand' }
    ],
    aiInsight: 'TMO Agent: Last executive report had 94% stakeholder satisfaction score. Recommend maintaining current format.',
    agentSource: 'tmo'
  }
};

// ============================================================
// RISK DOSSIERS - Level 2/3 content for risk drilldowns
// ============================================================

export const riskDossiers: Record<string, DrilldownContent> = {
  'default': {
    title: 'Risk Analysis',
    subtitle: 'Enterprise Risk Assessment',
    description: 'Comprehensive risk assessment with impact analysis, mitigation strategies, and monitoring status.',
    level: 2,
    entityType: 'risk',
    entityId: 'default',
    isFullDossier: true,
    metrics: [
      { label: 'Risk Score', value: 'High', trend: 'stable', color: 'red' },
      { label: 'Probability', value: '65%', trend: 'up' },
      { label: 'Impact', value: '£2.5M', trend: 'stable' },
      { label: 'Mitigation Progress', value: '45%', trend: 'up' }
    ],
    actions: [
      { id: 'risk-1', label: 'View Mitigation Plan', type: 'navigate', targetEntityType: 'action', targetEntityId: 'mitigate', description: 'Review current mitigation strategies' },
      { id: 'risk-2', label: 'Escalate to Steering', type: 'escalate', targetEntityType: 'team', targetEntityId: 'steering-committee', description: 'Raise visibility to leadership' },
      { id: 'risk-3', label: 'Schedule Review', type: 'investigate', description: 'Set up risk review meeting' }
    ],
    relatedItems: [
      { id: 'risk-proj-1', name: 'Affected Projects', type: 'Projects', entityType: 'project', entityId: 'at-risk', status: '3 projects' },
      { id: 'risk-dep-1', name: 'Related Dependencies', type: 'Dependencies', entityType: 'dependency', entityId: 'blocking', status: '2 blockers' },
      { id: 'risk-team-1', name: 'Risk Owners', type: 'Team', entityType: 'team', entityId: 'risk-owners', status: 'assigned' }
    ],
    aiInsight: 'Governance Agent: This risk has escalated 15% in the past week. Recommend immediate stakeholder notification and contingency activation.',
    agentSource: 'governance'
  },
  'critical-budget-overrun': {
    title: 'Critical Budget Overrun',
    subtitle: 'Financial Risk - Enterprise Portfolio',
    description: '£6.5M budget variance (18% over planned spend) detected across the enterprise portfolio requiring immediate financial controls.',
    level: 2,
    entityType: 'risk',
    entityId: 'critical-budget-overrun',
    isFullDossier: true,
    metrics: [
      { label: 'Variance', value: '£6.5M', trend: 'up', color: 'red' },
      { label: 'Overspend %', value: '18%', trend: 'up', color: 'red' },
      { label: 'Projects Affected', value: '8', trend: 'stable' },
      { label: 'Mitigation Progress', value: '25%', trend: 'up' }
    ],
    actions: [
      { id: 'budget-1', label: 'Implement Spend Controls', type: 'mitigate', description: 'Activate financial controls' },
      { id: 'budget-2', label: 'Portfolio Prioritization', type: 'escalate', targetEntityType: 'action', targetEntityId: 'prioritize', description: 'Review and re-prioritize portfolio' },
      { id: 'budget-3', label: 'Stakeholder Briefing', type: 'escalate', targetEntityType: 'team', targetEntityId: 'sponsors', description: 'Brief executive sponsors' }
    ],
    relatedItems: [
      { id: 'fin-1', name: 'FinOps Dashboard', type: 'Report', entityType: 'report', entityId: 'finops', status: 'live' },
      { id: 'fin-2', name: 'Budget Forecast', type: 'Metric', entityType: 'metric', entityId: 'budget-forecast', status: 'updated' }
    ],
    aiInsight: 'FinOps Agent: Primary drivers are 3 over-scope projects. Recommend scope freeze on non-critical features.',
    agentSource: 'finops'
  },
  'enterprise-transformation-portfolio': {
    title: 'Enterprise Transformation Risk',
    subtitle: 'Portfolio-Level Risk Assessment',
    description: 'Comprehensive risk analysis for the Enterprise Transformation Portfolio covering budget, timeline, and resource risks.',
    level: 2,
    entityType: 'risk',
    entityId: 'enterprise-transformation-portfolio',
    isFullDossier: true,
    metrics: [
      { label: 'Overall Risk Score', value: 'AMBER', trend: 'stable', color: 'amber' },
      { label: 'Budget Risk', value: 'HIGH', trend: 'up', color: 'red' },
      { label: 'Timeline Risk', value: 'MEDIUM', trend: 'stable', color: 'amber' },
      { label: 'Resource Risk', value: 'LOW', trend: 'down', color: 'green' }
    ],
    actions: [
      { id: 'port-1', label: 'View Risk Register', type: 'navigate', targetEntityType: 'report', targetEntityId: 'risk-register', description: 'Full portfolio risk register' },
      { id: 'port-2', label: 'Mitigation Dashboard', type: 'navigate', targetEntityType: 'metric', targetEntityId: 'mitigation-status', description: 'Track mitigation progress' }
    ],
    relatedItems: enrichedProjects.filter(p => p.status === 'red' || p.status === 'amber').slice(0, 4).map(p => ({
      id: p.id,
      name: p.name,
      type: 'Project',
      entityType: 'project',
      entityId: p.id,
      status: p.status === 'red' ? 'At Risk' : 'Amber'
    })),
    aiInsight: 'Governance Agent: 3 critical risks require immediate attention. Budget overrun and dependency blockage are top priorities.',
    agentSource: 'governance'
  }
};

// ============================================================
// OPPORTUNITY DOSSIERS - Level 2/3 content for opportunity drilldowns
// ============================================================

export const opportunityDossiers: Record<string, DrilldownContent> = {
  'default': {
    title: 'Opportunity Analysis',
    subtitle: 'Value Creation Potential',
    description: 'Assessment of potential value creation opportunity with implementation roadmap and resource requirements.',
    level: 2,
    entityType: 'opportunity',
    entityId: 'default',
    isFullDossier: true,
    metrics: [
      { label: 'Potential Value', value: '£2.5M', trend: 'up', color: 'teal' },
      { label: 'Probability', value: '75%', trend: 'up', color: 'teal' },
      { label: 'Time to Value', value: '3 months', trend: 'down', color: 'teal' },
      { label: 'Investment Needed', value: '£0.5M', trend: 'stable' }
    ],
    actions: [
      { id: 'opp-1', label: 'Create Business Case', type: 'accelerate', description: 'Draft business case for approval' },
      { id: 'opp-2', label: 'Assign Champion', type: 'escalate', targetEntityType: 'team', targetEntityId: 'opportunity-owners', description: 'Identify opportunity owner' },
      { id: 'opp-3', label: 'Schedule Review', type: 'navigate', targetEntityType: 'action', targetEntityId: 'schedule-review', description: 'Set up opportunity review' }
    ],
    relatedItems: [
      { id: 'opp-rel-1', name: 'Related Projects', type: 'Projects', entityType: 'project', entityId: 'related', status: '2 aligned' },
      { id: 'opp-rel-2', name: 'Success Metrics', type: 'Metrics', entityType: 'metric', entityId: 'success-kpis', status: 'defined' }
    ],
    aiInsight: 'VRO Agent: This opportunity aligns with 2 strategic OKRs and could accelerate value realization by 35%.',
    agentSource: 'integrated-management'
  },
  'digital-adoption-momentum-acceleration': {
    title: 'Digital Adoption Acceleration',
    subtitle: 'Efficiency Opportunity',
    description: '£2.5M additional efficiency gains available from closing 18% digital adoption gap across the organization.',
    level: 2,
    entityType: 'opportunity',
    entityId: 'digital-adoption-momentum-acceleration',
    isFullDossier: true,
    metrics: [
      { label: 'Potential Gain', value: '£2.5M', trend: 'up', color: 'teal' },
      { label: 'Current Adoption', value: '62%', trend: 'up', color: 'teal' },
      { label: 'Target Adoption', value: '80%', trend: 'stable', color: 'teal' },
      { label: 'Gap', value: '18%', trend: 'down', color: 'teal' }
    ],
    actions: [
      { id: 'dig-1', label: 'Deploy Task Force', type: 'accelerate', description: 'Launch dedicated adoption team' },
      { id: 'dig-2', label: 'Training Program', type: 'navigate', targetEntityType: 'action', targetEntityId: 'training', description: 'Accelerate user training' },
      { id: 'dig-3', label: 'Champions Network', type: 'escalate', targetEntityType: 'team', targetEntityId: 'digital-champions', description: 'Activate change champions' }
    ],
    relatedItems: [
      { id: 'dig-theme', name: 'Digital Transformation Theme', type: 'Theme', entityType: 'theme', entityId: 'digital-transformation', status: 'active' },
      { id: 'dig-metric', name: 'Adoption Dashboard', type: 'Metric', entityType: 'metric', entityId: 'digital-adoption', status: 'live' }
    ],
    aiInsight: 'VRO Agent: Quick wins available in 3 departments with lowest adoption. Targeted intervention could close 10% gap in 4 weeks.',
    agentSource: 'integrated-management'
  },
  'digital-transformation-theme': {
    title: 'Digital Transformation Theme',
    subtitle: 'Strategic Theme Analysis',
    description: 'Overview of Digital Transformation strategic theme progress, opportunities, and value realization.',
    level: 2,
    entityType: 'opportunity',
    entityId: 'digital-transformation-theme',
    isFullDossier: true,
    metrics: [
      { label: 'Theme Progress', value: '78%', trend: 'up', color: 'teal' },
      { label: 'Value Delivered', value: '£12M', trend: 'up', color: 'teal' },
      { label: 'Active Projects', value: '8', trend: 'stable' },
      { label: 'OKR Achievement', value: '85%', trend: 'up', color: 'teal' }
    ],
    actions: [
      { id: 'theme-1', label: 'View Theme Roadmap', type: 'navigate', targetEntityType: 'theme', targetEntityId: 'digital-transformation', description: 'Full strategic roadmap' },
      { id: 'theme-2', label: 'Value Stream Analysis', type: 'navigate', targetEntityType: 'value-stream', targetEntityId: 'digital', description: 'Related value streams' }
    ],
    relatedItems: [
      { id: 'vs-dig', name: 'Digital Services', type: 'Value Stream', entityType: 'value-stream', entityId: 'digital-services', status: 'active' },
      { id: 'vs-cx', name: 'Customer Experience', type: 'Value Stream', entityType: 'value-stream', entityId: 'customer-experience', status: 'active' }
    ],
    aiInsight: 'Strategy Agent: Digital Transformation theme is outperforming targets. Consider expanding scope to capture additional opportunities.',
    agentSource: 'integrated-management'
  }
};

// ============================================================
// KPI METRIC DOSSIERS - Level 2/3 content for metric drilldowns
// ============================================================

export const metricDossiers: Record<string, DrilldownContent> = {
  'roi': {
    title: 'Return on Investment Analysis',
    subtitle: 'VRO Value Metric',
    description: 'Comprehensive ROI analysis including projected returns, realized value, and investment tracking.',
    level: 2,
    entityType: 'metric',
    entityId: 'roi',
    metrics: [
      { label: 'Portfolio ROI', value: '127%', trend: 'up', color: 'teal' },
      { label: 'Value Realized', value: '£4.2M', trend: 'up', color: 'teal' },
      { label: 'Investment to Date', value: '£3.3M', trend: 'stable', color: 'teal' },
      { label: 'Projected Annual', value: '£8.5M', trend: 'up', color: 'teal' }
    ],
    actions: [
      { id: 'roi-1', label: 'View by Project', type: 'navigate', targetEntityType: 'metric-breakdown', targetEntityId: 'roi-by-project' },
      { id: 'roi-2', label: 'View by BU', type: 'navigate', targetEntityType: 'metric-breakdown', targetEntityId: 'roi-by-bu' },
      { id: 'roi-3', label: 'Trend Analysis', type: 'navigate', targetEntityType: 'trend', targetEntityId: 'roi-trend' }
    ],
    relatedItems: enrichedProjects.slice(0, 4).map(p => ({
      id: p.id,
      name: p.name,
      type: 'Project',
      entityType: 'project',
      entityId: p.id,
      status: `ROI: ${p.expectedROI}`
    })),
    aiInsight: 'VRO Agent: Top 3 projects contributing 68% of total portfolio ROI. Consider accelerating these for faster value realization.',
    agentSource: 'integrated-management'
  },
  'value-realized': {
    title: 'Value Realization Tracking',
    subtitle: 'VRO Value Metric',
    description: 'Track actual benefits delivered against projected targets across the portfolio.',
    level: 2,
    entityType: 'metric',
    entityId: 'value-realized',
    metrics: [
      { label: 'Total Realized', value: '£4.2M', trend: 'up', color: 'teal' },
      { label: 'Target', value: '£5.8M', trend: 'stable', color: 'teal' },
      { label: 'Realization Rate', value: '72%', trend: 'up', color: 'teal' },
      { label: 'At Risk', value: '£0.8M', trend: 'down', color: 'teal' }
    ],
    actions: [
      { id: 'val-1', label: 'Benefits Register', type: 'navigate', targetEntityType: 'benefits', targetEntityId: 'register' },
      { id: 'val-2', label: 'Unrealized Analysis', type: 'navigate', targetEntityType: 'benefits', targetEntityId: 'unrealized' }
    ],
    relatedItems: [
      { id: 'ben-1', name: 'Cost Savings', type: 'Benefit', entityType: 'benefit', entityId: 'cost-savings', status: '£2.1M realized' },
      { id: 'ben-2', name: 'Revenue Growth', type: 'Benefit', entityType: 'benefit', entityId: 'revenue', status: '£1.4M realized' },
      { id: 'ben-3', name: 'Efficiency Gains', type: 'Benefit', entityType: 'benefit', entityId: 'efficiency', status: '£0.7M realized' }
    ],
    aiInsight: 'FinOps Agent: Value realization is tracking 8% ahead of schedule. Recommend benefit tracking review in Week 32.',
    agentSource: 'finops'
  },
  'okr-progress': {
    title: 'OKR Progress Dashboard',
    subtitle: 'VRO Value Metric',
    description: 'Objective and Key Results tracking across portfolio with confidence scores.',
    level: 2,
    entityType: 'metric',
    entityId: 'okr-progress',
    metrics: [
      { label: 'OKRs On Track', value: '78%', trend: 'up', color: 'teal' },
      { label: 'At Risk', value: '15%', trend: 'stable', color: 'teal' },
      { label: 'Off Track', value: '7%', trend: 'down', color: 'teal' },
      { label: 'Avg Confidence', value: '72%', trend: 'up', color: 'teal' }
    ],
    actions: [
      { id: 'okr-1', label: 'View All OKRs', type: 'navigate', targetEntityType: 'okr', targetEntityId: 'all' },
      { id: 'okr-2', label: 'At Risk OKRs', type: 'navigate', targetEntityType: 'okr', targetEntityId: 'at-risk' }
    ],
    relatedItems: [
      { id: 'okr-dig', name: 'Digital Transformation', type: 'OKR', entityType: 'okr', entityId: 'okr-portfolio-digital', status: 'on-track' },
      { id: 'okr-ops', name: 'Operational Excellence', type: 'OKR', entityType: 'okr', entityId: 'okr-portfolio-ops', status: 'on-track' },
      { id: 'okr-comp', name: 'Regulatory Compliance', type: 'OKR', entityType: 'okr', entityId: 'okr-portfolio-compliance', status: 'at-risk' }
    ],
    aiInsight: 'OKR Agent: 3 key results need attention this quarter. Regulatory compliance OKR requires immediate focus.',
    agentSource: 'okr'
  },
  'cycle-time': {
    title: 'Cycle Time Analysis',
    subtitle: 'PMO Delivery Metric',
    description: 'End-to-end delivery cycle time from request to deployment.',
    level: 2,
    entityType: 'metric',
    entityId: 'cycle-time',
    metrics: [
      { label: 'Avg Cycle Time', value: '18 days', trend: 'down', color: 'blue' },
      { label: 'Target', value: '14 days', trend: 'stable', color: 'blue' },
      { label: 'Improvement', value: '22%', trend: 'up', color: 'blue' },
      { label: 'Best Performer', value: '8 days', trend: 'up', color: 'blue' }
    ],
    actions: [
      { id: 'ct-1', label: 'View Bottlenecks', type: 'navigate', targetEntityType: 'bottleneck', targetEntityId: 'cycle-time' },
      { id: 'ct-2', label: 'Team Comparison', type: 'navigate', targetEntityType: 'comparison', targetEntityId: 'cycle-time-teams' }
    ],
    relatedItems: [
      { id: 'stage-1', name: 'Requirements', type: 'Stage', entityType: 'stage', entityId: 'requirements', status: '3 days avg' },
      { id: 'stage-2', name: 'Development', type: 'Stage', entityType: 'stage', entityId: 'development', status: '8 days avg' },
      { id: 'stage-3', name: 'Testing', type: 'Stage', entityType: 'stage', entityId: 'testing', status: '5 days avg' },
      { id: 'stage-4', name: 'Deployment', type: 'Stage', entityType: 'stage', entityId: 'deployment', status: '2 days avg' }
    ],
    aiInsight: 'TMO Agent: Development stage is primary bottleneck at 45% of total cycle time. Consider parallel testing to reduce by 3 days.',
    agentSource: 'tmo'
  },
  'flow-efficiency': {
    title: 'Flow Efficiency Metrics',
    subtitle: 'PMO Delivery Metric',
    description: 'Ratio of value-adding time to total lead time across delivery pipeline.',
    level: 2,
    entityType: 'metric',
    entityId: 'flow-efficiency',
    metrics: [
      { label: 'Flow Efficiency', value: '42%', trend: 'up', color: 'blue' },
      { label: 'Target', value: '50%', trend: 'stable', color: 'blue' },
      { label: 'Wait Time', value: '58%', trend: 'down', color: 'blue' },
      { label: 'WIP Items', value: '24', trend: 'stable', color: 'blue' }
    ],
    actions: [
      { id: 'fe-1', label: 'View Wait States', type: 'navigate', targetEntityType: 'wait-state', targetEntityId: 'all' },
      { id: 'fe-2', label: 'WIP Analysis', type: 'navigate', targetEntityType: 'wip', targetEntityId: 'current' }
    ],
    relatedItems: [
      { id: 'wait-1', name: 'Pending Approval', type: 'Wait State', entityType: 'wait-state', entityId: 'approval', status: '35% of wait' },
      { id: 'wait-2', name: 'Blocked by Dependency', type: 'Wait State', entityType: 'wait-state', entityId: 'dependency', status: '28% of wait' },
      { id: 'wait-3', name: 'Resource Queue', type: 'Wait State', entityType: 'wait-state', entityId: 'resource', status: '22% of wait' }
    ],
    aiInsight: 'Planning Agent: Approval wait states account for 35% of non-value time. Recommend delegation of authority review.',
    agentSource: 'planning'
  },
  'throughput': {
    title: 'Throughput Dashboard',
    subtitle: 'PMO Delivery Metric',
    description: 'Number of work items completed per time period across teams.',
    level: 2,
    entityType: 'metric',
    entityId: 'throughput',
    metrics: [
      { label: 'Weekly Throughput', value: '47 items', trend: 'up', color: 'blue' },
      { label: 'Target', value: '45 items', trend: 'stable', color: 'blue' },
      { label: 'Stories/Sprint', value: '32', trend: 'up', color: 'blue' },
      { label: 'Features/PI', value: '12', trend: 'stable', color: 'blue' }
    ],
    actions: [
      { id: 'tp-1', label: 'Team Breakdown', type: 'navigate', targetEntityType: 'throughput', targetEntityId: 'by-team' },
      { id: 'tp-2', label: 'Historical Trend', type: 'navigate', targetEntityType: 'trend', targetEntityId: 'throughput-history' }
    ],
    relatedItems: teams.slice(0, 4).map(t => ({
      id: t.id,
      name: t.name,
      type: 'Team',
      entityType: 'team',
      entityId: t.id,
      status: `${t.velocity} pts/sprint`
    })),
    aiInsight: 'TMO Agent: Throughput increased 12% this PI. Top performing team is Retirement Core with 52 pts/sprint.',
    agentSource: 'tmo'
  }
};

// ============================================================
// TEAM & RESOURCE DOSSIERS - Level 2/3 for team drilldowns
// ============================================================

export const teamDossiers: Record<string, DrilldownContent> = {};
teams.forEach(team => {
  const members = teamMembers.filter(m => m.teamId === team.id);
  teamDossiers[team.id] = {
    title: team.name,
    subtitle: `${team.type} Team`,
    description: `${team.type} team delivering value with ${team.velocity} velocity`,
    level: 2,
    entityType: 'team',
    entityId: team.id,
    metrics: [
      { label: 'Velocity', value: `${team.velocity} pts`, trend: 'up' },
      { label: 'Members', value: `${members.length}`, trend: 'stable' },
      { label: 'Capacity', value: `${team.capacity} pts/sprint`, trend: 'stable' },
      { label: 'SM', value: team.scrumMaster, trend: 'stable' }
    ],
    relatedItems: members.map(m => ({
      id: m.id,
      name: m.name,
      type: m.role,
      entityType: 'resource',
      entityId: m.id,
      status: `${m.allocation}% allocated`
    })),
    aiInsight: `Team has ${team.capacity}% capacity utilization. ${members.length} active members with balanced skill distribution.`,
    agentSource: 'planning'
  };
});

// ============================================================
// AGENT DOSSIERS - Level 2/3 for agent drilldowns
// ============================================================

export const agentDossiers: Record<AgentType, DrilldownContent> = {
  'integrated-management': {
    title: 'Integrated Management Agent',
    subtitle: 'Unified VRO + PMO Intelligence',
    description: 'Central coordination agent managing value realization and project execution across all portfolios.',
    level: 2,
    entityType: 'agent',
    entityId: 'integrated-management',
    metrics: [
      { label: 'Actions Today', value: '24', trend: 'up' },
      { label: 'Insights Generated', value: '18', trend: 'up' },
      { label: 'Escalations', value: '3', trend: 'down' },
      { label: 'Confidence Avg', value: '87%', trend: 'stable' }
    ],
    actions: [
      { id: 'ima-1', label: 'View Action Log', type: 'navigate', targetEntityType: 'agent-log', targetEntityId: 'integrated-management' },
      { id: 'ima-2', label: 'Configure Thresholds', type: 'navigate', targetEntityType: 'agent-config', targetEntityId: 'integrated-management' }
    ],
    relatedItems: [
      { id: 'sub-1', name: 'FinOps Agent', type: 'Subscriber', entityType: 'agent', entityId: 'finops' },
      { id: 'sub-2', name: 'Governance Agent', type: 'Subscriber', entityType: 'agent', entityId: 'governance' },
      { id: 'sub-3', name: 'TMO Agent', type: 'Subscriber', entityType: 'agent', entityId: 'tmo' },
      { id: 'sub-4', name: 'Planning Agent', type: 'Subscriber', entityType: 'agent', entityId: 'planning' }
    ],
    aiInsight: 'Integrated Management Agent is operating at optimal capacity with 87% average confidence on recommendations.'
  },
  'tmo': {
    title: 'TMO Agent',
    subtitle: 'Transformation Management Office',
    description: 'Monitors delivery performance, cycle times, and transformation progress.',
    level: 2,
    entityType: 'agent',
    entityId: 'tmo',
    metrics: [
      { label: 'Projects Monitored', value: '12', trend: 'stable' },
      { label: 'Alerts Active', value: '4', trend: 'down' },
      { label: 'Avg Response', value: '2.3 hrs', trend: 'up' }
    ],
    relatedItems: [
      { id: 'cap-1', name: 'Notify', type: 'Capability', entityType: 'capability', entityId: 'notify' },
      { id: 'cap-2', name: 'Investigate', type: 'Capability', entityType: 'capability', entityId: 'investigate' },
      { id: 'cap-3', name: 'Create Task', type: 'Capability', entityType: 'capability', entityId: 'create-task' }
    ]
  },
  'finops': {
    title: 'FinOps Agent',
    subtitle: 'Financial Operations Intelligence',
    description: 'Tracks budget utilization, cost variances, and financial health across portfolios.',
    level: 2,
    entityType: 'agent',
    entityId: 'finops',
    metrics: [
      { label: 'Budget Monitored', value: '£42M', trend: 'stable' },
      { label: 'Cost Alerts', value: '2', trend: 'down' },
      { label: 'Forecast Accuracy', value: '94%', trend: 'up' }
    ],
    relatedItems: [
      { id: 'cap-1', name: 'Escalate', type: 'Capability', entityType: 'capability', entityId: 'escalate' },
      { id: 'cap-2', name: 'Investigate', type: 'Capability', entityType: 'capability', entityId: 'investigate' },
      { id: 'cap-3', name: 'Approve/Reject', type: 'Capability', entityType: 'capability', entityId: 'approve' }
    ]
  },
  'okr': {
    title: 'OKR Agent',
    subtitle: 'Objectives & Key Results Tracking',
    description: 'Monitors OKR progress, alignment, and confidence scores across the portfolio.',
    level: 2,
    entityType: 'agent',
    entityId: 'okr',
    metrics: [
      { label: 'OKRs Tracked', value: '24', trend: 'stable' },
      { label: 'On Track', value: '78%', trend: 'up' },
      { label: 'Updates Today', value: '8', trend: 'up' }
    ],
    relatedItems: [
      { id: 'cap-1', name: 'Notify', type: 'Capability', entityType: 'capability', entityId: 'notify' },
      { id: 'cap-2', name: 'Update Status', type: 'Capability', entityType: 'capability', entityId: 'update-status' }
    ]
  },
  'governance': {
    title: 'Governance Agent',
    subtitle: 'Risk & Compliance Oversight',
    description: 'Monitors governance compliance, risk thresholds, and approval workflows.',
    level: 2,
    entityType: 'agent',
    entityId: 'governance',
    metrics: [
      { label: 'Risks Monitored', value: '18', trend: 'stable' },
      { label: 'Pending Approvals', value: '5', trend: 'down' },
      { label: 'Compliance Score', value: '96%', trend: 'up' }
    ],
    relatedItems: [
      { id: 'cap-1', name: 'Escalate', type: 'Capability', entityType: 'capability', entityId: 'escalate' },
      { id: 'cap-2', name: 'Approve/Reject', type: 'Capability', entityType: 'capability', entityId: 'approve' },
      { id: 'cap-3', name: 'Close', type: 'Capability', entityType: 'capability', entityId: 'close' }
    ]
  },
  'planning': {
    title: 'Planning Agent',
    subtitle: 'Capacity & Resource Planning',
    description: 'Manages resource allocation, capacity planning, and schedule optimization.',
    level: 2,
    entityType: 'agent',
    entityId: 'planning',
    metrics: [
      { label: 'Resources Managed', value: '85', trend: 'stable' },
      { label: 'Capacity Util', value: '82%', trend: 'up' },
      { label: 'Conflicts Resolved', value: '12', trend: 'down' }
    ],
    relatedItems: [
      { id: 'cap-1', name: 'Reassign', type: 'Capability', entityType: 'capability', entityId: 'reassign' },
      { id: 'cap-2', name: 'Defer', type: 'Capability', entityType: 'capability', entityId: 'defer' },
      { id: 'cap-3', name: 'Create Task', type: 'Capability', entityType: 'capability', entityId: 'create-task' }
    ]
  },
  'ocm': {
    title: 'OCM Agent',
    subtitle: 'Organizational Change Management',
    description: 'Monitors change adoption, stakeholder engagement, and training completion.',
    level: 2,
    entityType: 'agent',
    entityId: 'ocm',
    metrics: [
      { label: 'Change Programs', value: '6', trend: 'stable' },
      { label: 'Adoption Rate', value: '74%', trend: 'up' },
      { label: 'Training Complete', value: '68%', trend: 'up' }
    ],
    relatedItems: [
      { id: 'cap-1', name: 'Notify', type: 'Capability', entityType: 'capability', entityId: 'notify' },
      { id: 'cap-2', name: 'Investigate', type: 'Capability', entityType: 'capability', entityId: 'investigate' },
      { id: 'cap-3', name: 'Accelerate', type: 'Capability', entityType: 'capability', entityId: 'accelerate' }
    ]
  }
};

// ============================================================
// DEPENDENCY CHAIN DOSSIERS - Level 2/3 for dependency drilldowns
// ============================================================

export function buildDependencyDossier(projectId: string): DrilldownContent {
  const project = enrichedProjects.find(p => p.id === projectId);
  if (!project) {
    return {
      title: 'Dependency Analysis',
      description: 'No dependencies found',
      level: 2,
      entityType: 'dependency',
      entityId: projectId,
      metrics: [],
      relatedItems: []
    };
  }

  const deps = project.dependencies || [];
  return {
    title: `${project.name} Dependencies`,
    subtitle: `${deps.length} active dependencies`,
    description: `Dependency chain analysis for ${project.name}`,
    level: 2,
    entityType: 'dependency',
    entityId: projectId,
    metrics: [
      { label: 'Total Dependencies', value: `${deps.length}`, trend: 'stable' },
      { label: 'Healthy', value: `${deps.filter(d => d.health === 'green').length}`, trend: 'up', color: 'green' },
      { label: 'At Risk', value: `${deps.filter(d => d.health === 'yellow').length}`, trend: 'stable', color: 'amber' },
      { label: 'Critical', value: `${deps.filter(d => d.health === 'red').length}`, trend: 'down', color: 'red' }
    ],
    actions: [
      { id: 'dep-1', label: 'View Impact Analysis', type: 'navigate', targetEntityType: 'impact', targetEntityId: projectId },
      { id: 'dep-2', label: 'Notify Owners', type: 'escalate', description: 'Alert dependency owners' }
    ],
    relatedItems: deps.map(d => ({
      id: d.projectId,
      name: d.projectName,
      type: d.type,
      entityType: 'project',
      entityId: d.projectId,
      status: d.health
    })),
    aiInsight: deps.length > 0 
      ? `PMO Agent: ${deps.filter(d => d.health !== 'green').length} dependencies require attention. Recommend proactive stakeholder communication.`
      : 'No dependencies identified for this project.',
    agentSource: 'tmo'
  };
}

// ============================================================
// REGISTRY LOOKUP FUNCTION
// ============================================================

export function getDrilldownContent(entityType: string, entityId: string): DrilldownContent | null {
  // Action playbooks - full dossiers that should use RegistryContentRenderer
  if (entityType === 'action' && actionPlaybooks[entityId]) {
    return { ...actionPlaybooks[entityId], isFullDossier: true };
  }

  // Metric dossiers - full dossiers
  if (entityType === 'metric' && metricDossiers[entityId]) {
    return { ...metricDossiers[entityId], isFullDossier: true };
  }

  // Risk dossiers - full dossiers
  if (entityType === 'risk') {
    if (riskDossiers[entityId]) {
      return { ...riskDossiers[entityId], isFullDossier: true };
    }
    // Return default risk dossier with customized title
    const defaultRisk = { ...riskDossiers['default'], isFullDossier: true };
    defaultRisk.title = entityId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    defaultRisk.entityId = entityId;
    return defaultRisk;
  }

  // Opportunity dossiers - full dossiers
  if (entityType === 'opportunity') {
    if (opportunityDossiers[entityId]) {
      return { ...opportunityDossiers[entityId], isFullDossier: true };
    }
    // Return default opportunity dossier with customized title
    const defaultOpp = { ...opportunityDossiers['default'], isFullDossier: true };
    defaultOpp.title = entityId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    defaultOpp.entityId = entityId;
    return defaultOpp;
  }

  // KPI - map to metric dossiers or provide PMO feed content
  if (entityType === 'kpi') {
    // PMO Data Feed KPIs
    if (entityId === 'pmo-feed-0') {
      return {
        title: 'Budget Utilization',
        subtitle: 'Financial Performance Indicator',
        description: 'Budget utilization measures the percentage of allocated budget that has been spent. This KPI tracks financial execution against the approved project budget, helping identify underspend or overspend conditions.',
        level: 2,
        entityType: 'kpi',
        entityId: 'pmo-feed-0',
        isFullDossier: true,
        metrics: [
          { label: 'Current Utilization', value: '70%', trend: 'stable', color: 'green' },
          { label: 'Burn Rate', value: '£125K/week', trend: 'stable' },
          { label: 'Forecast at Completion', value: '95%', trend: 'up' },
          { label: 'Variance', value: '+2%', trend: 'up', color: 'amber' }
        ],
        actions: [
          { id: 'budget-1', label: 'View Budget Breakdown', type: 'navigate', targetEntityType: 'report', targetEntityId: 'budget-breakdown', description: 'See detailed cost categories' },
          { id: 'budget-2', label: 'Compare to Baseline', type: 'investigate', description: 'Analyze variance against original budget' },
          { id: 'budget-3', label: 'Forecast Analysis', type: 'navigate', targetEntityType: 'report', targetEntityId: 'budget-forecast', description: 'View projected spend' }
        ],
        relatedItems: [
          { id: 'fin-1', name: 'FinOps Agent', type: 'Agent', entityType: 'agent', entityId: 'finops', status: 'active' },
          { id: 'fin-2', name: 'Cost Optimization Report', type: 'Report', entityType: 'report', entityId: 'cost-optimization' },
          { id: 'fin-3', name: 'Resource Allocation', type: 'Metric', entityType: 'metric', entityId: 'throughput' }
        ],
        aiInsight: 'Budget utilization is tracking within acceptable bounds. FinOps Agent recommends monitoring vendor invoice timing as Q4 typically sees accelerated spend patterns.',
        agentSource: 'finops'
      };
    }
    if (entityId === 'pmo-feed-1') {
      return {
        title: 'Timeline Progress',
        subtitle: 'Schedule Performance Indicator',
        description: 'Timeline progress measures the percentage of elapsed time against the total project duration. This KPI helps track schedule adherence and identify potential delays before they impact delivery.',
        level: 2,
        entityType: 'kpi',
        entityId: 'pmo-feed-1',
        isFullDossier: true,
        metrics: [
          { label: 'Elapsed Time', value: '63%', trend: 'stable', color: 'green' },
          { label: 'Deliverables Complete', value: '58%', trend: 'up' },
          { label: 'Schedule Performance Index', value: '0.92', trend: 'stable' },
          { label: 'Days to Milestone', value: '24', trend: 'down' }
        ],
        actions: [
          { id: 'timeline-1', label: 'View Gantt Chart', type: 'navigate', targetEntityType: 'report', targetEntityId: 'gantt-chart', description: 'See project timeline visualization' },
          { id: 'timeline-2', label: 'Critical Path Analysis', type: 'investigate', description: 'Review critical path dependencies' },
          { id: 'timeline-3', label: 'Milestone Status', type: 'navigate', targetEntityType: 'report', targetEntityId: 'milestones', description: 'Check upcoming milestones' }
        ],
        relatedItems: [
          { id: 'plan-1', name: 'Planning Agent', type: 'Agent', entityType: 'agent', entityId: 'planning', status: 'active' },
          { id: 'plan-2', name: 'Dependencies Map', type: 'Report', entityType: 'report', entityId: 'dependencies' },
          { id: 'plan-3', name: 'Cycle Time', type: 'Metric', entityType: 'metric', entityId: 'cycle-time' }
        ],
        aiInsight: 'Timeline is slightly behind deliverable completion. Planning Agent has identified 2 potential acceleration opportunities in the upcoming sprint to recover schedule.',
        agentSource: 'planning'
      };
    }
    
    const kpiToMetric: Record<string, string> = {
      'roi': 'roi',
      'value-realized': 'value-realized',
      'okr-progress': 'okr-progress',
      'cycle-time': 'cycle-time',
      'flow-efficiency': 'flow-efficiency',
      'throughput': 'throughput',
      'budget-analysis': 'roi',
      'velocity-metrics': 'throughput',
      'resource-allocation': 'throughput',
      'quality-score': 'okr-progress',
      'features-summary': 'throughput',
      'stories-summary': 'throughput',
      'tasks-summary': 'throughput',
      'burndown-health': 'flow-efficiency',
      'project-timeline': 'cycle-time'
    };
    const metricId = kpiToMetric[entityId] || entityId;
    if (metricDossiers[metricId]) {
      return { ...metricDossiers[metricId], isFullDossier: true };
    }
  }

  // Team dossiers - full dossiers
  if (entityType === 'team' && teamDossiers[entityId]) {
    return { ...teamDossiers[entityId], isFullDossier: true };
  }

  // Agent dossiers - full dossiers
  if (entityType === 'agent' && agentDossiers[entityId as AgentType]) {
    return { ...agentDossiers[entityId as AgentType], isFullDossier: true };
  }

  // Dependency dossiers - marked as full dossier since buildDependencyDossier provides comprehensive content
  if (entityType === 'dependency') {
    const content = buildDependencyDossier(entityId);
    return content ? { ...content, isFullDossier: true } : null;
  }

  // SAFe entities - build on demand
  if (entityType === 'theme') {
    const theme = strategicThemes.find(t => t.id === entityId || t.name === entityId);
    if (theme) {
      return {
        title: theme.name,
        subtitle: `${theme.timeHorizon} Strategic Theme`,
        description: theme.description,
        level: 2,
        entityType: 'theme',
        entityId: theme.id,
        metrics: [
          { label: 'Budget Allocation', value: `${theme.budgetAllocation}%`, trend: 'stable' },
          { label: 'Status', value: theme.status, trend: 'up' },
          { label: 'Linked OKRs', value: `${theme.linkedOKRs.length}`, trend: 'stable' }
        ],
        relatedItems: theme.linkedOKRs.map(okrId => ({
          id: okrId,
          name: okrId.replace('okr-portfolio-', '').replace(/-/g, ' '),
          type: 'OKR',
          entityType: 'okr',
          entityId: okrId
        }))
      };
    }
  }

  if (entityType === 'value-stream') {
    const vs = valueStreams.find(v => v.id === entityId);
    if (vs) {
      return {
        title: vs.name,
        subtitle: `${vs.type} Value Stream`,
        description: vs.description,
        level: 2,
        entityType: 'value-stream',
        entityId: vs.id,
        metrics: [
          { label: 'Annual Budget', value: `£${(vs.annualBudget / 1000000).toFixed(1)}M`, trend: 'stable' },
          { label: 'Owner', value: vs.owner, trend: 'stable' },
          { label: 'Linked ARTs', value: `${vs.linkedARTs.length}`, trend: 'stable' }
        ],
        relatedItems: vs.linkedARTs.map(artId => ({
          id: artId,
          name: artId.replace('art-', '').replace(/-/g, ' '),
          type: 'ART',
          entityType: 'art',
          entityId: artId
        }))
      };
    }
  }

  if (entityType === 'feature') {
    const feature = features.find(f => f.id === entityId);
    if (feature) {
      const featureStories = stories.filter(s => s.featureId === entityId);
      return {
        title: feature.title,
        subtitle: `PI ${feature.targetPI} Feature`,
        description: feature.description,
        level: 2,
        entityType: 'feature',
        entityId: feature.id,
        metrics: [
          { label: 'Status', value: feature.status, trend: 'stable' },
          { label: 'WSJF Score', value: `${feature.wsjfScore}`, trend: 'stable' },
          { label: 'Stories', value: `${featureStories.length}`, trend: 'stable' }
        ],
        relatedItems: featureStories.slice(0, 5).map(s => ({
          id: s.id,
          name: s.title,
          type: 'Story',
          entityType: 'story',
          entityId: s.id,
          status: s.status
        }))
      };
    }
  }

  if (entityType === 'story') {
    const story = stories.find(s => s.id === entityId);
    if (story) {
      const storyTasks = tasks.filter(t => t.storyId === entityId);
      return {
        title: story.title,
        subtitle: `${story.storyPoints} Story Points`,
        description: story.description,
        level: 3,
        entityType: 'story',
        entityId: story.id,
        metrics: [
          { label: 'Status', value: story.status, trend: 'stable' },
          { label: 'Points', value: `${story.storyPoints}`, trend: 'stable' },
          { label: 'Tasks', value: `${storyTasks.length}`, trend: 'stable' },
          { label: 'Iteration', value: story.iterationId, trend: 'stable' }
        ],
        relatedItems: storyTasks.map(t => ({
          id: t.id,
          name: t.title,
          type: 'Task',
          entityType: 'task',
          entityId: t.id,
          status: t.status
        }))
      };
    }
  }

  if (entityType === 'task') {
    const task = tasks.find(t => t.id === entityId);
    if (task) {
      return {
        title: task.title,
        subtitle: `Assigned to ${task.assigneeId}`,
        description: task.description,
        level: 3,
        entityType: 'task',
        entityId: task.id,
        metrics: [
          { label: 'Status', value: task.status, trend: 'stable' },
          { label: 'Estimated', value: `${task.estimatedHours}h`, trend: 'stable' },
          { label: 'Actual', value: `${task.actualHours}h`, trend: task.actualHours <= task.estimatedHours ? 'up' : 'down' },
          { label: 'Priority', value: task.priority, trend: 'stable' }
        ],
        relatedItems: []
      };
    }
  }

  // Project drilldown - Full dossier with Traceability/Agents/History tabs
  if (entityType === 'project') {
    const project = enrichedProjects.find(p => p.id === entityId);
    if (project) {
      return {
        title: project.name,
        subtitle: `${project.bu} - ${project.priority} priority`,
        description: project.description,
        level: 2,
        entityType: 'project',
        entityId: project.id,
        isFullDossier: true,
        metrics: [
          { label: 'Status', value: project.status, trend: 'stable' },
          { label: 'Budget', value: `£${project.budget.total}${project.budget.unit}`, trend: 'stable' },
          { label: 'ROI', value: project.expectedROI, trend: 'up' },
          { label: 'Timeline', value: `${project.timeline.elapsed}/${project.timeline.total} months`, trend: 'stable' }
        ],
        actions: [
          { id: 'proj-1', label: 'View Dependencies', type: 'navigate', targetEntityType: 'dependency', targetEntityId: project.id, description: 'Explore project dependencies' },
          { id: 'proj-2', label: 'View Full Details', type: 'navigate', targetEntityType: 'project-page', targetEntityId: project.id, description: 'Open project detail page' },
          { id: 'proj-3', label: 'Escalate Issue', type: 'escalate', targetEntityType: 'team', targetEntityId: 'project-leads', description: 'Escalate to project leadership' }
        ],
        relatedItems: (project.dependencies || []).slice(0, 3).map(d => ({
          id: d.projectId,
          name: d.projectName,
          type: d.type,
          entityType: 'project',
          entityId: d.projectId,
          status: d.health
        })),
        aiInsight: `Integrated Management Agent: ${project.aiRecommendation || 'Project is being actively monitored. All AI agents are aligned on delivery strategy.'}`,
        agentSource: 'integrated-management'
      };
    }
  }

  // Extended entity types - Level 3 content for action-referenced items
  // Helper to safely convert ID to string
  const safeId = (id: unknown): string => String(id || 'unknown');
  const formatTitle = (id: unknown): string => safeId(id).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const extendedEntityContent: Record<string, (id: string) => DrilldownContent> = {
    'data-source': (id) => ({
      title: 'Data Source Configuration',
      subtitle: 'Integration Health',
      description: `Data source ${id} connection and sync status.`,
      level: 3,
      entityType: 'data-source',
      entityId: id,
      metrics: [
        { label: 'Status', value: 'Connected', trend: 'up', color: 'green' },
        { label: 'Last Sync', value: '< 5 min', trend: 'stable' },
        { label: 'Records', value: '24,581', trend: 'up' },
        { label: 'Quality', value: '98%', trend: 'stable' }
      ],
      aiInsight: 'TMO Agent: Data source is healthy with 98% quality score and real-time sync enabled.',
      agentSource: 'tmo'
    }),
    'agent-log': (id) => ({
      title: 'Agent Activity Log',
      subtitle: safeId(id) === 'recent' ? 'Last 24 Hours' : safeId(id),
      description: 'Complete audit trail of agent decisions and actions.',
      level: 3,
      entityType: 'agent-log',
      entityId: id,
      metrics: [
        { label: 'Actions', value: '147', trend: 'up' },
        { label: 'Insights', value: '42', trend: 'up' },
        { label: 'Escalations', value: '8', trend: 'down' },
        { label: 'Accuracy', value: '94%', trend: 'stable' }
      ],
      aiInsight: 'System: All agent actions logged with full traceability.',
      agentSource: 'integrated-management'
    }),
    'escalation-history': (id) => ({
      title: 'Escalation History',
      subtitle: 'Previous Escalations',
      description: 'Historical record of escalations and their resolutions.',
      level: 3,
      entityType: 'escalation-history',
      entityId: id,
      metrics: [
        { label: 'Total', value: '23', trend: 'stable' },
        { label: 'Resolved', value: '21', trend: 'up' },
        { label: 'Avg Resolution', value: '2.3 days', trend: 'down' },
        { label: 'SLA Met', value: '91%', trend: 'up' }
      ],
      aiInsight: 'Governance Agent: Escalation SLA performance improved 8% this quarter.',
      agentSource: 'governance'
    }),
    'resource-pool': (id) => ({
      title: 'Resource Pool',
      subtitle: 'Available Resources',
      description: 'Pool of available resources for allocation.',
      level: 3,
      entityType: 'resource-pool',
      entityId: id,
      metrics: [
        { label: 'Available', value: '12', trend: 'stable' },
        { label: 'Contractors', value: '5', trend: 'up' },
        { label: 'Internal', value: '7', trend: 'stable' },
        { label: 'Utilization', value: '78%', trend: 'up' }
      ],
      aiInsight: 'Planning Agent: 12 resources available for immediate allocation.',
      agentSource: 'planning'
    }),
    'resource': (id) => ({
      title: formatTitle(id),
      subtitle: 'Resource Details',
      description: 'Resource allocation and availability status.',
      level: 3,
      entityType: 'resource',
      entityId: id,
      metrics: [
        { label: 'Allocation', value: '80%', trend: 'stable' },
        { label: 'Projects', value: '3', trend: 'stable' },
        { label: 'Availability', value: '20%', trend: 'up' }
      ],
      aiInsight: 'Planning Agent: Resource is optimally allocated across priority projects.'
    }),
    'scope': (id) => ({
      title: 'Scope Definition',
      subtitle: safeId(id) === 'mvp' ? 'MVP Scope' : safeId(id) === 'reduction-options' ? 'Reduction Options' : 'Current Scope',
      description: 'Project scope boundaries and reduction opportunities.',
      level: 3,
      entityType: 'scope',
      entityId: id,
      metrics: [
        { label: 'Features', value: '24', trend: 'stable' },
        { label: 'Must Have', value: '12', trend: 'stable' },
        { label: 'Nice to Have', value: '8', trend: 'down' },
        { label: 'Deferred', value: '4', trend: 'up' }
      ],
      aiInsight: 'Planning Agent: 4 features identified for potential deferral to reduce timeline by 3 weeks.',
      agentSource: 'planning'
    }),
    'approval': (id) => ({
      title: 'Approval Workflow',
      subtitle: 'Pending Approvals',
      description: 'Items awaiting approval with stakeholder status.',
      level: 3,
      entityType: 'approval',
      entityId: id,
      metrics: [
        { label: 'Pending', value: '5', trend: 'down' },
        { label: 'Approved Today', value: '3', trend: 'up' },
        { label: 'Avg Wait', value: '1.2 days', trend: 'down' },
        { label: 'Auto-approved', value: '12', trend: 'up' }
      ],
      aiInsight: 'Governance Agent: Delegation of authority rules reduced wait time by 40%.',
      agentSource: 'governance'
    }),
    'contingency': (id) => ({
      title: 'Contingency Reserve',
      subtitle: 'Budget & Schedule',
      description: 'Contingency allocation and usage tracking.',
      level: 3,
      entityType: 'contingency',
      entityId: id,
      metrics: [
        { label: 'Budget Reserve', value: '£1.2M', trend: 'stable' },
        { label: 'Used', value: '£0.4M', trend: 'up' },
        { label: 'Schedule Buffer', value: '3 weeks', trend: 'stable' },
        { label: 'Buffer Used', value: '1 week', trend: 'up' }
      ],
      aiInsight: 'FinOps Agent: Contingency usage at 33% - within healthy parameters.',
      agentSource: 'finops'
    }),
    'fallback': (id) => ({
      title: 'Fallback Options',
      subtitle: 'Risk Mitigation',
      description: 'Alternative approaches if primary plan fails.',
      level: 3,
      entityType: 'fallback',
      entityId: id,
      metrics: [
        { label: 'Options', value: '3', trend: 'stable' },
        { label: 'Readiness', value: '85%', trend: 'up' },
        { label: 'Cost Impact', value: '+12%', trend: 'stable' }
      ],
      aiInsight: 'Governance Agent: 3 fallback options prepared with documented activation criteria.',
      agentSource: 'governance'
    }),
    'risk-transfer': (id) => ({
      title: 'Risk Transfer Options',
      subtitle: 'Insurance & Vendor Transfer',
      description: 'Options for transferring risk to third parties.',
      level: 3,
      entityType: 'risk-transfer',
      entityId: id,
      metrics: [
        { label: 'Coverage', value: '£5M', trend: 'stable' },
        { label: 'Premium', value: '£120K/yr', trend: 'down' },
        { label: 'Vendors', value: '4', trend: 'stable' }
      ],
      aiInsight: 'FinOps Agent: Risk transfer coverage adequate for identified risk exposure.',
      agentSource: 'finops'
    }),
    'risk': (id) => ({
      title: formatTitle(id),
      subtitle: 'Risk Details',
      description: 'Risk assessment and mitigation status.',
      level: 3,
      entityType: 'risk',
      entityId: id,
      metrics: [
        { label: 'Impact', value: 'High', trend: 'stable' },
        { label: 'Probability', value: '40%', trend: 'down' },
        { label: 'Mitigation', value: '67%', trend: 'up' },
        { label: 'Owner', value: 'Assigned', trend: 'stable' }
      ],
      aiInsight: 'Governance Agent: Risk mitigation progress at 67% with clear action plan.',
      agentSource: 'governance'
    }),
    'alert': (id) => ({
      title: 'Alert Details',
      subtitle: 'System Alert',
      description: 'Alert information and response actions.',
      level: 3,
      entityType: 'alert',
      entityId: id,
      metrics: [
        { label: 'Severity', value: 'Medium', trend: 'stable' },
        { label: 'Status', value: 'Active', trend: 'stable' },
        { label: 'Response Time', value: '< 2 hrs', trend: 'up' }
      ],
      aiInsight: 'TMO Agent: Alert under investigation with expected resolution within 4 hours.',
      agentSource: 'tmo'
    }),
    'report': (id) => ({
      title: formatTitle(id),
      subtitle: 'Report Details',
      description: 'Generated report with key findings.',
      level: 3,
      entityType: 'report',
      entityId: id,
      metrics: [
        { label: 'Generated', value: 'Today', trend: 'stable' },
        { label: 'Pages', value: '24', trend: 'stable' },
        { label: 'Sections', value: '8', trend: 'stable' }
      ],
      aiInsight: 'Integrated Management Agent: Report generated with latest portfolio data.',
      agentSource: 'integrated-management'
    }),
    'system': (id) => ({
      title: formatTitle(id),
      subtitle: 'System Status',
      description: 'System health and integration status.',
      level: 3,
      entityType: 'system',
      entityId: id,
      metrics: [
        { label: 'Status', value: 'Healthy', trend: 'up', color: 'green' },
        { label: 'Uptime', value: '99.9%', trend: 'stable' },
        { label: 'Last Check', value: '< 1 min', trend: 'stable' }
      ],
      aiInsight: 'System monitoring confirms all integrations are operational.',
      agentSource: 'integrated-management'
    }),
    'benefit': (id) => ({
      title: formatTitle(id),
      subtitle: 'Benefit Tracking',
      description: 'Benefit realization progress and forecast.',
      level: 3,
      entityType: 'benefit',
      entityId: id,
      metrics: [
        { label: 'Realized', value: '£2.1M', trend: 'up' },
        { label: 'Target', value: '£3.5M', trend: 'stable' },
        { label: 'Progress', value: '60%', trend: 'up' }
      ],
      aiInsight: 'VRO Agent: Benefit realization on track with 60% target achieved.',
      agentSource: 'integrated-management'
    }),
    'bottleneck': (id) => ({
      title: 'Bottleneck Analysis',
      subtitle: 'Flow Impediments',
      description: 'Identified bottlenecks affecting delivery flow.',
      level: 3,
      entityType: 'bottleneck',
      entityId: id,
      metrics: [
        { label: 'Bottlenecks', value: '3', trend: 'down' },
        { label: 'Impact', value: '+5 days', trend: 'down' },
        { label: 'Resolution', value: 'In Progress', trend: 'up' }
      ],
      aiInsight: 'TMO Agent: 3 bottlenecks identified - development and testing phases are primary constraints.',
      agentSource: 'tmo'
    }),
    'wait-state': (id) => ({
      title: 'Wait State Analysis',
      subtitle: 'Non-Value Time',
      description: 'Analysis of wait states in the delivery process.',
      level: 3,
      entityType: 'wait-state',
      entityId: id,
      metrics: [
        { label: 'Wait Time', value: '35%', trend: 'down' },
        { label: 'Primary Cause', value: 'Approvals', trend: 'stable' },
        { label: 'Improvement', value: '+12%', trend: 'up' }
      ],
      aiInsight: 'Planning Agent: Approval delays account for 35% of non-value time.',
      agentSource: 'planning'
    }),
    'wip': (id) => ({
      title: 'Work in Progress',
      subtitle: 'Current WIP Analysis',
      description: 'Items currently in progress across the portfolio.',
      level: 3,
      entityType: 'wip',
      entityId: id,
      metrics: [
        { label: 'Total WIP', value: '24', trend: 'stable' },
        { label: 'Over Limit', value: '2', trend: 'down' },
        { label: 'Avg Age', value: '8 days', trend: 'down' }
      ],
      aiInsight: 'TMO Agent: WIP levels within acceptable range. 2 items flagged for aging.',
      agentSource: 'tmo'
    }),
    'stage': (id) => ({
      title: formatTitle(id),
      subtitle: 'Process Stage',
      description: 'Stage performance and flow metrics.',
      level: 3,
      entityType: 'stage',
      entityId: id,
      metrics: [
        { label: 'Cycle Time', value: '3.2 days', trend: 'down' },
        { label: 'Throughput', value: '12/week', trend: 'up' },
        { label: 'Quality', value: '96%', trend: 'stable' }
      ],
      aiInsight: 'TMO Agent: Stage performance within target parameters.',
      agentSource: 'tmo'
    }),
    'timeline': (id) => ({
      title: 'Project Timeline',
      subtitle: 'Schedule Analysis',
      description: 'Timeline status and milestone tracking.',
      level: 3,
      entityType: 'timeline',
      entityId: id,
      metrics: [
        { label: 'Progress', value: '68%', trend: 'up' },
        { label: 'Variance', value: '+3 days', trend: 'stable' },
        { label: 'Milestones', value: '8/12', trend: 'up' }
      ],
      aiInsight: 'Planning Agent: Timeline tracking slightly ahead with 8 of 12 milestones completed.',
      agentSource: 'planning'
    }),
    'impact': (id) => ({
      title: 'Impact Analysis',
      subtitle: 'Dependency Impact',
      description: 'Impact assessment of dependencies and changes.',
      level: 3,
      entityType: 'impact',
      entityId: id,
      metrics: [
        { label: 'Affected Projects', value: '4', trend: 'stable' },
        { label: 'Schedule Impact', value: '+5 days', trend: 'stable' },
        { label: 'Cost Impact', value: '£120K', trend: 'stable' }
      ],
      aiInsight: 'PMO Agent: Impact analysis shows 4 downstream projects affected with manageable risk.',
      agentSource: 'tmo'
    }),
    'trend': (id) => ({
      title: 'Trend Analysis',
      subtitle: 'Historical Patterns',
      description: 'Historical trend analysis and forecasting.',
      level: 3,
      entityType: 'trend',
      entityId: id,
      metrics: [
        { label: 'Direction', value: 'Improving', trend: 'up' },
        { label: 'Velocity', value: '+8%/month', trend: 'up' },
        { label: 'Forecast', value: 'Positive', trend: 'up' }
      ],
      aiInsight: 'VRO Agent: Trend analysis indicates continued improvement trajectory.',
      agentSource: 'integrated-management'
    }),
    'comparison': (id) => ({
      title: 'Team Comparison',
      subtitle: 'Performance Benchmarking',
      description: 'Comparative analysis across teams.',
      level: 3,
      entityType: 'comparison',
      entityId: id,
      metrics: [
        { label: 'Teams', value: '6', trend: 'stable' },
        { label: 'Top Performer', value: 'Team Alpha', trend: 'stable' },
        { label: 'Variance', value: '±15%', trend: 'down' }
      ],
      aiInsight: 'TMO Agent: Team performance variance reduced to 15% through process standardization.',
      agentSource: 'tmo'
    }),
    'capability': (id) => ({
      title: formatTitle(id),
      subtitle: 'Agent Capability',
      description: 'Agent capability details and usage statistics.',
      level: 3,
      entityType: 'capability',
      entityId: id,
      metrics: [
        { label: 'Status', value: 'Active', trend: 'stable' },
        { label: 'Usage', value: '24 times', trend: 'up' },
        { label: 'Success Rate', value: '94%', trend: 'stable' }
      ],
      aiInsight: 'Agent capability performing at 94% success rate.',
      agentSource: 'integrated-management'
    }),
    'agent-config': (id) => ({
      title: 'Agent Configuration',
      subtitle: 'Threshold Settings',
      description: 'Agent monitoring thresholds and alert configuration.',
      level: 3,
      entityType: 'agent-config',
      entityId: id,
      metrics: [
        { label: 'Thresholds', value: '12', trend: 'stable' },
        { label: 'Active Alerts', value: '3', trend: 'down' },
        { label: 'Last Updated', value: 'Today', trend: 'stable' }
      ],
      aiInsight: 'Configuration is optimized for current portfolio risk profile.',
      agentSource: 'integrated-management'
    }),
    'metric-breakdown': (id) => ({
      title: 'Metric Breakdown',
      subtitle: 'Detailed Analysis',
      description: 'Detailed breakdown of metric components.',
      level: 3,
      entityType: 'metric-breakdown',
      entityId: id,
      metrics: [
        { label: 'Components', value: '8', trend: 'stable' },
        { label: 'Healthy', value: '6', trend: 'up' },
        { label: 'Attention', value: '2', trend: 'down' }
      ],
      aiInsight: 'VRO Agent: 6 of 8 metric components are performing above threshold.',
      agentSource: 'integrated-management'
    }),
    'benefits': (id) => ({
      title: safeId(id) === 'register' ? 'Benefits Register' : 'Unrealized Benefits',
      subtitle: 'Value Tracking',
      description: 'Benefits tracking and realization status.',
      level: 3,
      entityType: 'benefits',
      entityId: id,
      metrics: [
        { label: 'Total Benefits', value: '£5.8M', trend: 'stable' },
        { label: 'Realized', value: '£4.2M', trend: 'up' },
        { label: 'At Risk', value: '£0.8M', trend: 'down' }
      ],
      aiInsight: 'VRO Agent: 72% of benefits realized with clear tracking for remaining value.',
      agentSource: 'integrated-management'
    }),
    'okr': (id) => ({
      title: formatTitle(safeId(id).replace('okr-portfolio-', '')),
      subtitle: 'OKR Progress',
      description: 'Objective and Key Results tracking.',
      level: 3,
      entityType: 'okr',
      entityId: id,
      metrics: [
        { label: 'Progress', value: '72%', trend: 'up' },
        { label: 'Confidence', value: '75%', trend: 'stable' },
        { label: 'Key Results', value: '4', trend: 'stable' }
      ],
      aiInsight: 'OKR Agent: Objective tracking at 72% with high confidence in achievement.',
      agentSource: 'okr'
    })
  };

  // Extended entity types - return with isFullDossier flag
  if (extendedEntityContent[entityType]) {
    return { ...extendedEntityContent[entityType](entityId), isFullDossier: true };
  }

  // Return null for unknown entities - let the drawer handle with explicit messaging
  // This prevents misleading synthetic placeholder data
  return null;
}

// ============================================================
// EXPORTS
// ============================================================

export { strategicThemes, valueStreams, features, stories, tasks, teams, teamMembers };
