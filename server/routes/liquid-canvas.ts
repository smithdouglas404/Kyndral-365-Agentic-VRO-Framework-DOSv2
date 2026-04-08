/**
 * Liquid Canvas API Routes
 *
 * - GET /api/liquid-canvas/catalog — Agent attribute catalog (what each agent can show)
 * - GET /api/liquid-canvas/catalog/:agentId — Single agent's attribute catalog
 * - GET /api/liquid-canvas/packets — Get recent real packets from agent execution
 */

import { Router, Request, Response } from 'express';
import { getRecentPackets } from '../services/AgentUIEmitter.js';

const router = Router();

// ============================================================================
// Agent Attribute Catalog — what each agent can show on its canvas
// ============================================================================

interface AgentAttribute {
  id: string;
  label: string;
  description: string;
  dataType: 'metric' | 'chart' | 'table' | 'insight' | 'status' | 'timeline' | 'progress';
  suggestedViz: string;
  category: string;
}

interface AgentCatalog {
  agentId: string;
  agentName: string;
  color: string;
  description: string;
  attributes: AgentAttribute[];
}

const agentCatalogs: AgentCatalog[] = [
  {
    agentId: 'pmo-agent',
    agentName: 'PMO Agent',
    color: 'violet',
    description: 'Portfolio & program management — project health, schedules, dependencies, resources',
    attributes: [
      { id: 'project-health-score', label: 'Project Health Score', description: 'Composite health score (0-100) based on schedule, budget, scope, quality', dataType: 'metric', suggestedViz: 'kpi', category: 'health' },
      { id: 'schedule-variance', label: 'Schedule Variance', description: 'Days ahead/behind baseline schedule per project', dataType: 'metric', suggestedViz: 'kpi', category: 'schedule' },
      { id: 'schedule-performance-index', label: 'Schedule Performance Index (SPI)', description: 'EVM SPI — ratio of earned value to planned value', dataType: 'metric', suggestedViz: 'kpi', category: 'schedule' },
      { id: 'milestone-tracker', label: 'Milestone Tracker', description: 'Upcoming and past milestones with status', dataType: 'timeline', suggestedViz: 'status-list', category: 'schedule' },
      { id: 'resource-utilization', label: 'Resource Utilization', description: 'Team capacity utilization by skill/team', dataType: 'chart', suggestedViz: 'bar-chart', category: 'resources' },
      { id: 'resource-demand-forecast', label: 'Resource Demand Forecast', description: 'Projected resource demand over next 6 months', dataType: 'chart', suggestedViz: 'area-chart', category: 'resources' },
      { id: 'cross-project-dependencies', label: 'Cross-Project Dependencies', description: 'Dependencies between projects and their status', dataType: 'table', suggestedViz: 'table', category: 'dependencies' },
      { id: 'project-portfolio-view', label: 'Portfolio Overview', description: 'All projects with key metrics (health, budget, schedule)', dataType: 'table', suggestedViz: 'table', category: 'portfolio' },
      { id: 'velocity-trend', label: 'Team Velocity Trend', description: 'Sprint velocity over time by team', dataType: 'chart', suggestedViz: 'area-chart', category: 'delivery' },
      { id: 'scope-change-tracker', label: 'Scope Change Tracker', description: 'Change requests, their impact on schedule and budget', dataType: 'table', suggestedViz: 'table', category: 'scope' },
      { id: 'defect-trend', label: 'Defect Trend', description: 'Open/closed defects over time', dataType: 'chart', suggestedViz: 'area-chart', category: 'quality' },
      { id: 'safe-pi-objectives', label: 'PI Objectives Alignment', description: 'SAFe PI objectives and their completion status', dataType: 'progress', suggestedViz: 'progress', category: 'safe' },
      { id: 'project-risk-heatmap', label: 'Project Risk Heatmap', description: 'Risk severity across all projects', dataType: 'chart', suggestedViz: 'bar-chart', category: 'risk' },
      { id: 'executive-status-summary', label: 'Executive Status Summary', description: 'Narrative status report for leadership', dataType: 'insight', suggestedViz: 'markdown', category: 'reporting' },
      // OpenProject PPM-powered attributes
      { id: 'gantt-view', label: 'Gantt Chart', description: 'Interactive Gantt timeline from OpenProject schedule with predecessors and critical path', dataType: 'timeline', suggestedViz: 'gantt-chart', category: 'schedule' },
      { id: 'critical-path', label: 'Critical Path Analysis', description: 'Critical path through work package dependencies from OpenProject relations', dataType: 'chart', suggestedViz: 'dependency-graph', category: 'dependencies' },
      { id: 'resource-heatmap', label: 'Resource Capacity Heatmap', description: 'Team member utilization over time from OpenProject memberships and time entries', dataType: 'chart', suggestedViz: 'resource-heatmap', category: 'resources' },
      { id: 'release-burndown', label: 'Release Burndown', description: 'Work remaining per OpenProject version/release with trend line', dataType: 'chart', suggestedViz: 'area-chart', category: 'delivery' },
      { id: 'wp-status-distribution', label: 'Work Package Status Distribution', description: 'Distribution of work packages by status from OpenProject', dataType: 'chart', suggestedViz: 'donut-chart', category: 'portfolio' },
    ],
  },
  {
    agentId: 'finops-agent',
    agentName: 'FinOps Agent',
    color: 'emerald',
    description: 'Financial operations — budget, cost optimization, ROI, EVM, variance analysis',
    attributes: [
      { id: 'budget-vs-actual', label: 'Budget vs Actual', description: 'Total budget compared to actual spend with variance', dataType: 'metric', suggestedViz: 'kpi-row', category: 'budget' },
      { id: 'cost-by-category', label: 'Cost by Category', description: 'Spend breakdown: personnel, infrastructure, licensing, services', dataType: 'chart', suggestedViz: 'donut-chart', category: 'cost' },
      { id: 'cost-trend', label: 'Cost Trend', description: 'Monthly spend over time vs budget envelope', dataType: 'chart', suggestedViz: 'area-chart', category: 'cost' },
      { id: 'roi-by-project', label: 'ROI by Project', description: 'Return on investment across portfolio', dataType: 'chart', suggestedViz: 'bar-chart', category: 'roi' },
      { id: 'evm-metrics', label: 'EVM Metrics', description: 'CPI, SPI, EAC, ETC, VAC for each project', dataType: 'table', suggestedViz: 'table', category: 'evm' },
      { id: 'savings-pipeline', label: 'Savings Pipeline', description: 'Identified vs realized savings with status', dataType: 'table', suggestedViz: 'table', category: 'savings' },
      { id: 'capex-vs-opex', label: 'CapEx vs OpEx', description: 'Capital vs operational expenditure split', dataType: 'chart', suggestedViz: 'donut-chart', category: 'budget' },
      { id: 'forecast-accuracy', label: 'Forecast Accuracy', description: 'How accurate past forecasts have been', dataType: 'chart', suggestedViz: 'area-chart', category: 'forecasting' },
      { id: 'vendor-spend', label: 'Vendor Spend Analysis', description: 'Spend by vendor with contract details', dataType: 'table', suggestedViz: 'table', category: 'vendor' },
      { id: 'cost-per-story-point', label: 'Cost per Story Point', description: 'Efficiency metric by team', dataType: 'chart', suggestedViz: 'bar-chart', category: 'efficiency' },
      // OpenProject PPM-powered attributes
      { id: 'budget-waterfall', label: 'Budget Waterfall', description: 'Planned vs actual by budget category from OpenProject labor and material budgets', dataType: 'chart', suggestedViz: 'budget-waterfall', category: 'budget' },
      { id: 'time-entry-trend', label: 'Time Entry Trend', description: 'Hours logged over time from OpenProject time entries — drives EVM actuals', dataType: 'chart', suggestedViz: 'area-chart', category: 'cost' },
      { id: 'evm-from-actuals', label: 'EVM from Actuals', description: 'CPI and SPI calculated from real OpenProject time entries vs planned values', dataType: 'metric', suggestedViz: 'kpi-row', category: 'evm' },
    ],
  },
  {
    agentId: 'risk-agent',
    agentName: 'Risk Agent',
    color: 'rose',
    description: 'Risk management — identification, assessment, mitigation, compliance monitoring',
    attributes: [
      { id: 'risk-register', label: 'Risk Register', description: 'All active risks with severity, probability, impact, owner', dataType: 'table', suggestedViz: 'table', category: 'register' },
      { id: 'risk-heatmap', label: 'Risk Heatmap', description: 'Probability vs impact matrix across portfolio', dataType: 'chart', suggestedViz: 'bar-chart', category: 'assessment' },
      { id: 'risk-trend', label: 'Risk Trend', description: 'Open risks over time by severity', dataType: 'chart', suggestedViz: 'area-chart', category: 'trend' },
      { id: 'top-risks', label: 'Top Risks', description: 'Top 5 risks by composite score with mitigation status', dataType: 'status', suggestedViz: 'status-list', category: 'priority' },
      { id: 'mitigation-tracker', label: 'Mitigation Tracker', description: 'Active mitigations with progress and effectiveness', dataType: 'progress', suggestedViz: 'progress', category: 'mitigation' },
      { id: 'risk-by-category', label: 'Risks by Category', description: 'Technical, organizational, vendor, regulatory breakdown', dataType: 'chart', suggestedViz: 'donut-chart', category: 'category' },
      { id: 'issue-log', label: 'Issue Log', description: 'Realized risks and active issues', dataType: 'table', suggestedViz: 'table', category: 'issues' },
      { id: 'compliance-status', label: 'Compliance Status', description: 'Regulatory and policy compliance across projects', dataType: 'status', suggestedViz: 'status-list', category: 'compliance' },
      { id: 'risk-velocity', label: 'Risk Velocity', description: 'How fast risks are being identified vs resolved', dataType: 'chart', suggestedViz: 'bar-chart', category: 'velocity' },
      // OpenProject PPM-powered attributes
      { id: 'risk-dependency-network', label: 'Risk Dependency Network', description: 'Risks linked to affected work packages via OpenProject relations', dataType: 'chart', suggestedViz: 'dependency-graph', category: 'network' },
      { id: 'risk-wp-register', label: 'Risk Register (OP)', description: 'Full risk register from OpenProject Risk work packages with probability, impact, mitigation', dataType: 'table', suggestedViz: 'table', category: 'register' },
    ],
  },
  {
    agentId: 'ocm-agent',
    agentName: 'OCM Agent',
    color: 'cyan',
    description: 'Organizational change management — readiness, adoption, stakeholder sentiment, training',
    attributes: [
      { id: 'change-readiness', label: 'Change Readiness Score', description: 'Organizational readiness by department/team', dataType: 'progress', suggestedViz: 'progress', category: 'readiness' },
      { id: 'adoption-curve', label: 'Adoption Curve', description: 'Feature/system adoption rate over time', dataType: 'chart', suggestedViz: 'area-chart', category: 'adoption' },
      { id: 'stakeholder-map', label: 'Stakeholder Map', description: 'Stakeholders by influence and sentiment', dataType: 'table', suggestedViz: 'table', category: 'stakeholders' },
      { id: 'sentiment-trend', label: 'Sentiment Trend', description: 'Stakeholder sentiment over time from surveys/feedback', dataType: 'chart', suggestedViz: 'area-chart', category: 'sentiment' },
      { id: 'training-completion', label: 'Training Completion', description: 'Training program status by team', dataType: 'progress', suggestedViz: 'progress', category: 'training' },
      { id: 'resistance-tracker', label: 'Resistance Tracker', description: 'Change resistance points and resolution status', dataType: 'status', suggestedViz: 'status-list', category: 'resistance' },
      { id: 'communication-plan', label: 'Communication Plan Status', description: 'Planned vs executed communications', dataType: 'table', suggestedViz: 'table', category: 'communications' },
      { id: 'impact-assessment', label: 'Impact Assessment', description: 'Change impact by business area', dataType: 'chart', suggestedViz: 'bar-chart', category: 'impact' },
    ],
  },
  {
    agentId: 'tmo-agent',
    agentName: 'TMO Agent',
    color: 'blue',
    description: 'Transition management — cutover coordination, go-live readiness, hypercare, knowledge transfer',
    attributes: [
      { id: 'cutover-plan', label: 'Cutover Plan', description: 'Upcoming cutovers with readiness status', dataType: 'table', suggestedViz: 'table', category: 'cutover' },
      { id: 'go-live-readiness', label: 'Go-Live Readiness', description: 'Readiness checklist with completion status', dataType: 'progress', suggestedViz: 'progress', category: 'readiness' },
      { id: 'hypercare-tracker', label: 'Hypercare Tracker', description: 'Post-go-live support status and incidents', dataType: 'status', suggestedViz: 'status-list', category: 'hypercare' },
      { id: 'knowledge-transfer', label: 'Knowledge Transfer Status', description: 'KT progress by system/team', dataType: 'progress', suggestedViz: 'progress', category: 'knowledge' },
      { id: 'transition-timeline', label: 'Transition Timeline', description: 'End-to-end transition phases and milestones', dataType: 'timeline', suggestedViz: 'status-list', category: 'timeline' },
      { id: 'environment-status', label: 'Environment Status', description: 'Dev/QA/UAT/Prod environment readiness', dataType: 'status', suggestedViz: 'status-list', category: 'environments' },
      { id: 'defect-escape-rate', label: 'Defect Escape Rate', description: 'Defects found post-deployment', dataType: 'chart', suggestedViz: 'area-chart', category: 'quality' },
      // OpenProject PPM-powered attributes
      { id: 'cutover-gantt', label: 'Cutover Gantt', description: 'Cutover task timeline from OpenProject with predecessors and checklist progress', dataType: 'timeline', suggestedViz: 'gantt-chart', category: 'cutover' },
      { id: 'version-readiness', label: 'Release Readiness', description: 'OpenProject version completion status and remaining work for go-live assessment', dataType: 'progress', suggestedViz: 'progress', category: 'readiness' },
    ],
  },
  {
    agentId: 'vro-agent',
    agentName: 'VRO Agent',
    color: 'amber',
    description: 'Value realization — benefits tracking, OKR alignment, value stream performance, ROI validation',
    attributes: [
      { id: 'value-realized-vs-target', label: 'Value Realized vs Target', description: 'Cumulative value delivery against plan', dataType: 'chart', suggestedViz: 'area-chart', category: 'value' },
      { id: 'benefit-cases', label: 'Benefit Cases', description: 'All benefit cases with realization status', dataType: 'table', suggestedViz: 'table', category: 'benefits' },
      { id: 'okr-alignment', label: 'OKR Alignment', description: 'Objective/key result progress and alignment', dataType: 'progress', suggestedViz: 'progress', category: 'okr' },
      { id: 'value-stream-health', label: 'Value Stream Health', description: 'Performance of each value stream', dataType: 'chart', suggestedViz: 'bar-chart', category: 'streams' },
      { id: 'roi-validation', label: 'ROI Validation', description: 'Projected vs actual ROI per initiative', dataType: 'chart', suggestedViz: 'bar-chart', category: 'roi' },
      { id: 'nps-csat', label: 'NPS / CSAT Scores', description: 'Customer and stakeholder satisfaction metrics', dataType: 'metric', suggestedViz: 'kpi-row', category: 'satisfaction' },
      { id: 'value-leakage', label: 'Value Leakage', description: 'Where expected value is not being captured', dataType: 'insight', suggestedViz: 'insight', category: 'leakage' },
      { id: 'time-to-value', label: 'Time to Value', description: 'How long from investment to first value realization', dataType: 'chart', suggestedViz: 'bar-chart', category: 'efficiency' },
      // OpenProject PPM-powered attributes
      { id: 'benefits-timeline', label: 'Benefits Timeline', description: 'Benefits realization plotted against OpenProject version/milestone dates', dataType: 'chart', suggestedViz: 'gantt-chart', category: 'benefits' },
      { id: 'value-per-version', label: 'Value Delivered per Release', description: 'Story points and value delivered per OpenProject version', dataType: 'chart', suggestedViz: 'bar-chart', category: 'value' },
    ],
  },
  {
    agentId: 'governance-agent',
    agentName: 'Governance Agent',
    color: 'indigo',
    description: 'Governance — policy enforcement, gate reviews, standards compliance, audit trail',
    attributes: [
      { id: 'gate-reviews', label: 'Gate Reviews', description: 'Pending and completed gate reviews with outcomes', dataType: 'table', suggestedViz: 'table', category: 'gates' },
      { id: 'compliance-scorecard', label: 'Compliance Scorecard', description: 'Policy compliance by project and standard', dataType: 'progress', suggestedViz: 'progress', category: 'compliance' },
      { id: 'policy-violations', label: 'Policy Violations', description: 'Active violations with severity and remediation status', dataType: 'status', suggestedViz: 'status-list', category: 'violations' },
      { id: 'audit-trail', label: 'Audit Trail', description: 'Decision log with timestamps and approvers', dataType: 'table', suggestedViz: 'table', category: 'audit' },
      { id: 'standards-adherence', label: 'Standards Adherence', description: 'Compliance rate by standard (TOGAF, ITIL, SAFe, etc.)', dataType: 'chart', suggestedViz: 'bar-chart', category: 'standards' },
      { id: 'approval-pipeline', label: 'Approval Pipeline', description: 'Items awaiting governance approval', dataType: 'status', suggestedViz: 'status-list', category: 'approvals' },
      { id: 'exception-tracker', label: 'Exception Tracker', description: 'Granted exceptions with expiry dates', dataType: 'table', suggestedViz: 'table', category: 'exceptions' },
      // OpenProject PPM-powered attributes
      { id: 'gate-review-gantt', label: 'Gate Review Timeline', description: 'Governance gate milestones on OpenProject Gantt with go/no-go decisions', dataType: 'timeline', suggestedViz: 'gantt-chart', category: 'gates' },
      { id: 'meeting-agenda-tracker', label: 'Meeting & Agenda Tracker', description: 'Scheduled gate review meetings from OpenProject with agendas and action items', dataType: 'table', suggestedViz: 'table', category: 'meetings' },
    ],
  },
  {
    agentId: 'planning-agent',
    agentName: 'Planning Agent',
    color: 'teal',
    description: 'Strategic planning — roadmaps, capacity planning, scenario modeling, portfolio optimization',
    attributes: [
      { id: 'strategic-roadmap', label: 'Strategic Roadmap', description: 'Initiative timeline with dependencies', dataType: 'timeline', suggestedViz: 'status-list', category: 'roadmap' },
      { id: 'capacity-forecast', label: 'Capacity Forecast', description: 'Team capacity vs demand over next 12 months', dataType: 'chart', suggestedViz: 'area-chart', category: 'capacity' },
      { id: 'portfolio-optimization', label: 'Portfolio Optimization', description: 'Recommended portfolio adjustments based on constraints', dataType: 'insight', suggestedViz: 'recommendation', category: 'optimization' },
      { id: 'scenario-comparison', label: 'Scenario Comparison', description: 'What-if scenarios with projected outcomes', dataType: 'table', suggestedViz: 'table', category: 'scenarios' },
      { id: 'investment-allocation', label: 'Investment Allocation', description: 'Budget allocation across strategic themes', dataType: 'chart', suggestedViz: 'donut-chart', category: 'investment' },
      { id: 'dependency-network', label: 'Dependency Network', description: 'Critical path and dependency analysis', dataType: 'table', suggestedViz: 'table', category: 'dependencies' },
      { id: 'resource-gap-analysis', label: 'Resource Gap Analysis', description: 'Skill gaps and hiring needs', dataType: 'chart', suggestedViz: 'bar-chart', category: 'resources' },
      { id: 'initiative-scoring', label: 'Initiative Scoring', description: 'WSJF or custom scoring for backlog prioritization', dataType: 'table', suggestedViz: 'table', category: 'prioritization' },
      // OpenProject PPM-powered attributes
      { id: 'portfolio-gantt', label: 'Portfolio Gantt', description: 'Full portfolio timeline from OpenProject with all projects, milestones, and dependencies', dataType: 'timeline', suggestedViz: 'gantt-chart', category: 'roadmap' },
      { id: 'capacity-heatmap', label: 'Capacity Heatmap', description: 'Resource demand vs capacity heatmap from OpenProject memberships and time entries', dataType: 'chart', suggestedViz: 'resource-heatmap', category: 'capacity' },
      { id: 'demand-pipeline', label: 'Demand Pipeline', description: 'Demand Request work packages from OpenProject with WSJF scoring and stage gate status', dataType: 'table', suggestedViz: 'table', category: 'demand' },
    ],
  },
];

// ============================================================================
// GET /api/liquid-canvas/catalog — What each agent can show
// ============================================================================

router.get('/catalog', (_req: Request, res: Response) => {
  res.json(agentCatalogs);
});

router.get('/catalog/:agentId', (req: Request, res: Response) => {
  const catalog = agentCatalogs.find(c => c.agentId === req.params.agentId);
  if (!catalog) return res.status(404).json({ error: 'Agent not found' });
  res.json(catalog);
});

// ============================================================================
// GET /api/liquid-canvas/packets — Recent packets
// ============================================================================

router.get('/packets', (_req: Request, res: Response) => {
  res.json(getRecentPackets());
});


export default router;
