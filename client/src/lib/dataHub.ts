// ============================================================================
// SIMULATION DATA HUB - Centralized Live Data for All Agents
// Merges pmoProjects, vroPrograms, riskIssues, buPortfolios with live events
// ============================================================================

import { pmoProjects, vroPrograms, riskIssues, buPortfolios, PMOProject, VROProgram, RiskIssue, BUPortfolio } from './buPrograms';
import { SimulationEvent } from './liveSimulation';
import { getProjectsByMetricId, EXPANDED_PMO_PROJECTS } from './unifiedMetrics';

export type AgentType = 'integrated-management' | 'tmo' | 'finops' | 'okr' | 'governance' | 'planning' | 'ocm';

export interface AgentDataSlice {
  agentId: AgentType;
  agentName: string;
  category: string;
  projects: PMOProject[];
  programs: VROProgram[];
  risks: RiskIssue[];
  portfolios: BUPortfolio[];
  events: SimulationEvent[];
  metrics: AgentMetrics;
  crossAgentMessages: CrossAgentMessage[];
}

export interface AgentMetrics {
  totalProjects: number;
  healthyProjects: number;
  atRiskProjects: number;
  totalValue: number;
  realizedValue: number;
  avgConfidence: number;
  activeAlerts: number;
  pendingActions: number;
}

export interface CrossAgentMessage {
  id: string;
  timestamp: Date;
  fromAgent: AgentType;
  toAgent: AgentType;
  messageType: 'data_sync' | 'alert_forward' | 'action_request' | 'status_update' | 'recommendation';
  entity: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EntityDrilldown {
  entityType: 'project' | 'program' | 'risk' | 'portfolio' | 'metric' | 'division' | 'climate' | 'agent-message' | 'guidance-item' | 'learning-resource' | 'collaborator' | 'blocker' | string;
  entityId: string;
  entityName: string;
  bu: string;
  relatedAgents: AgentType[];
  events: SimulationEvent[];
  metrics: Record<string, number | string>;
  actions: { id: string; label: string; type: string }[];
  history: { timestamp: Date; action: string; agent: AgentType }[];
  relatedEntities?: { type: string; id: string; name: string }[];
  aiInsight?: string;
  summary?: string;
}

// Agent configuration with data mappings
const AGENT_CONFIG: Record<AgentType, { name: string; category: string; buFilters?: string[]; focusAreas: string[] }> = {
  'integrated-management': {
    name: 'Integrated Management Agent',
    category: 'Value & Delivery Management',
    focusAreas: ['ROI', 'value', 'strategic alignment', 'benefits', 'timeline', 'budget', 'deliverables', 'milestones']
  },
  tmo: {
    name: 'TMO Transformation Agent',
    category: 'Transformation',
    focusAreas: ['change', 'adoption', 'transformation', 'initiative']
  },
  finops: {
    name: 'FinOps Intelligence Agent',
    category: 'Financial Operations',
    focusAreas: ['cost', 'budget', 'spend', 'savings']
  },
  okr: {
    name: 'OKR Alignment Agent',
    category: 'Strategy Execution',
    focusAreas: ['objective', 'key result', 'goal', 'strategy']
  },
  governance: {
    name: 'Governance Guardian Agent',
    category: 'Governance',
    focusAreas: ['risk', 'compliance', 'regulatory', 'audit']
  },
  planning: {
    name: 'Strategic Planning Agent',
    category: 'Planning',
    focusAreas: ['capacity', 'resource', 'scenario', 'forecast']
  },
  ocm: {
    name: 'OCM Readiness Agent',
    category: 'Change Management',
    focusAreas: ['readiness', 'stakeholder', 'training', 'adoption']
  }
};

// Generate cross-agent messages based on project/program relationships
export function generateCrossAgentMessages(events: SimulationEvent[]): CrossAgentMessage[] {
  const messages: CrossAgentMessage[] = [];
  const now = new Date();
  
  // Generate comprehensive cross-agent collaboration messages
  // All 8 agents: VRO, PMO, TMO, FinOps, OKR, Governance, Planning, OCM
  const messageTemplates: Omit<CrossAgentMessage, 'id' | 'timestamp'>[] = [
    // PMO ↔ VRO: Project-Value Integration
    { fromAgent: 'integrated-management', toAgent: 'integrated-management', messageType: 'alert_forward', entity: 'PRT Intake System', message: 'Milestone delay impacts Strategic ROI - processing efficiency KPI down 8%', priority: 'critical' },
    { fromAgent: 'integrated-management', toAgent: 'integrated-management', messageType: 'data_sync', entity: 'Cloud Migration Program', message: 'Project on track - KPI "Workloads Migrated" at 52%, contributing to OKR progress', priority: 'medium' },
    { fromAgent: 'integrated-management', toAgent: 'integrated-management', messageType: 'recommendation', entity: 'Digital Onboarding', message: 'OKR "Digital-First Customer Experience" at 63% - accelerate project to boost KR completion', priority: 'high' },
    { fromAgent: 'integrated-management', toAgent: 'integrated-management', messageType: 'action_request', entity: 'API Modernization', message: 'Strategic priority shift - reallocate resources to high-ROI initiatives', priority: 'high' },
    
    // TMO ↔ OCM: Transformation-Change Integration
    { fromAgent: 'tmo', toAgent: 'ocm', messageType: 'action_request', entity: 'Digital Workplace', message: 'Phase 2 launch imminent - stakeholder readiness assessment needed', priority: 'high' },
    { fromAgent: 'tmo', toAgent: 'ocm', messageType: 'data_sync', entity: 'Process Automation', message: 'Adoption rate at 67% - below 80% target, intervention recommended', priority: 'critical' },
    { fromAgent: 'ocm', toAgent: 'tmo', messageType: 'status_update', entity: 'Digital Workplace', message: 'Training completion at 85% - readiness score improved to 78%', priority: 'medium' },
    { fromAgent: 'ocm', toAgent: 'tmo', messageType: 'alert_forward', entity: 'CRM Migration', message: 'Stakeholder resistance detected in Sales division - change plan adjustment needed', priority: 'high' },
    
    // FinOps ↔ VRO: Financial-Value Integration
    { fromAgent: 'finops', toAgent: 'integrated-management', messageType: 'data_sync', entity: 'AI Deal Acceleration', message: 'Budget variance analysis complete - £2.1m under forecast, ROI improving', priority: 'low' },
    { fromAgent: 'finops', toAgent: 'integrated-management', messageType: 'alert_forward', entity: 'Cloud Infrastructure', message: 'Cost overrun detected - £450k above baseline, value at risk', priority: 'critical' },
    { fromAgent: 'integrated-management', toAgent: 'finops', messageType: 'recommendation', entity: 'Portfolio Optimization', message: 'Low-ROI projects identified - recommend cost reallocation to high-value initiatives', priority: 'high' },
    { fromAgent: 'finops', toAgent: 'planning', messageType: 'data_sync', entity: 'Q4 Budget', message: 'Forecast updated - £3.2m available for new initiatives', priority: 'medium' },
    
    // OKR ↔ Multiple Agents: Strategy Alignment
    { fromAgent: 'okr', toAgent: 'integrated-management', messageType: 'data_sync', entity: 'OKR-001', message: 'Key Result "Reduce deal cycle time" progress calculated at 68% from project KPIs', priority: 'medium' },
    { fromAgent: 'okr', toAgent: 'tmo', messageType: 'recommendation', entity: 'Digital Transformation', message: 'OKR alignment at 94% - recommend accelerating Q4 objectives', priority: 'medium' },
    { fromAgent: 'okr', toAgent: 'governance', messageType: 'alert_forward', entity: 'Compliance OKR', message: 'Regulatory readiness KR at 45% - escalation threshold breached', priority: 'critical' },
    { fromAgent: 'integrated-management', toAgent: 'okr', messageType: 'data_sync', entity: 'Strategic ROI', message: 'Value realization feeding OKR progress - 5 Key Results updated', priority: 'medium' },
    
    // Governance ↔ Multiple Agents: Risk & Compliance
    { fromAgent: 'governance', toAgent: 'integrated-management', messageType: 'alert_forward', entity: 'Private Markets Platform', message: 'Compliance checkpoint pending - requires sign-off before Phase 3', priority: 'high' },
    { fromAgent: 'governance', toAgent: 'integrated-management', messageType: 'action_request', entity: 'Risk Assessment', message: 'High-value program requires governance review - £25m threshold exceeded', priority: 'high' },
    { fromAgent: 'governance', toAgent: 'finops', messageType: 'recommendation', entity: 'Audit Findings', message: 'Cost allocation audit complete - 3 remediation items identified', priority: 'medium' },
    { fromAgent: 'integrated-management', toAgent: 'governance', messageType: 'data_sync', entity: 'Longevity Risk Intelligence', message: 'Value realization at £15m - governance review triggered', priority: 'medium' },
    { fromAgent: 'integrated-management', toAgent: 'governance', messageType: 'status_update', entity: 'Regulatory Project', message: 'Milestone achieved - ready for compliance validation', priority: 'medium' },
    
    // Planning ↔ Multiple Agents: Capacity & Resources
    { fromAgent: 'planning', toAgent: 'integrated-management', messageType: 'action_request', entity: 'Resource Pool', message: 'Capacity constraint detected for Q3 - reallocation needed', priority: 'high' },
    { fromAgent: 'planning', toAgent: 'tmo', messageType: 'recommendation', entity: 'Transformation Roadmap', message: 'Scenario analysis complete - Option B shows 23% better outcomes', priority: 'medium' },
    { fromAgent: 'planning', toAgent: 'finops', messageType: 'data_sync', entity: 'Capacity Forecast', message: 'Resource demand projection updated - 15% increase expected Q4', priority: 'medium' },
    { fromAgent: 'integrated-management', toAgent: 'planning', messageType: 'status_update', entity: 'Resource Utilization', message: 'Current utilization at 87% - approaching capacity threshold', priority: 'high' },
    { fromAgent: 'tmo', toAgent: 'planning', messageType: 'action_request', entity: 'Initiative Pipeline', message: 'New transformation wave requires capacity assessment', priority: 'medium' },
    
    // OCM ↔ Multiple Agents: Change Readiness
    { fromAgent: 'ocm', toAgent: 'integrated-management', messageType: 'status_update', entity: 'PRT Intake System', message: 'Readiness score updated to 78% - training completion on track', priority: 'medium' },
    { fromAgent: 'ocm', toAgent: 'governance', messageType: 'alert_forward', entity: 'Change Impact', message: 'High-impact change requires stakeholder sign-off - 500+ users affected', priority: 'high' },
    { fromAgent: 'integrated-management', toAgent: 'ocm', messageType: 'status_update', entity: 'Digital Onboarding', message: 'UAT phase starting - change communication required', priority: 'medium' },
    { fromAgent: 'governance', toAgent: 'ocm', messageType: 'action_request', entity: 'Policy Update', message: 'New compliance policy requires organization-wide communication plan', priority: 'high' },
    
    // TMO ↔ FinOps/Governance: Benefits & Compliance
    { fromAgent: 'tmo', toAgent: 'finops', messageType: 'recommendation', entity: 'ESG Analytics', message: 'Transformation benefits exceeding forecast by 18%', priority: 'low' },
    { fromAgent: 'tmo', toAgent: 'governance', messageType: 'data_sync', entity: 'Transformation Program', message: 'Major milestone achieved - governance checkpoint required', priority: 'medium' }
  ];
  
  messageTemplates.forEach((template, index) => {
    messages.push({
      ...template,
      id: `cam-${index}-${Date.now()}`,
      timestamp: new Date(now.getTime() - Math.random() * 30 * 60 * 1000) // Random time in last 30 mins
    });
  });
  
  // Add messages based on recent simulation events
  events.slice(0, 5).forEach((event, index) => {
    const fromAgent = getAgentForEventType(event.type);
    const toAgents = getRelatedAgents(fromAgent);
    if (toAgents.length > 0) {
      messages.push({
        id: `cam-event-${index}-${Date.now()}`,
        timestamp: event.timestamp,
        fromAgent,
        toAgent: toAgents[0],
        messageType: event.type === 'risk_warning' ? 'alert_forward' : 'data_sync',
        entity: event.relatedEntity?.name || 'Portfolio',
        message: event.title,
        priority: event.priority === 'critical' ? 'critical' : event.priority === 'high' ? 'high' : 'medium'
      });
    }
  });
  
  return messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function getAgentForEventType(type: string): AgentType {
  const mapping: Record<string, AgentType> = {
    'ai_alert': 'integrated-management',
    'risk_warning': 'governance',
    'opportunity': 'integrated-management',
    'prediction': 'planning',
    'safe_anomaly': 'integrated-management',
    'value_milestone': 'integrated-management',
    'action_required': 'tmo'
  };
  return mapping[type] || 'integrated-management';
}

function getRelatedAgents(agent: AgentType): AgentType[] {
  const relationships: Record<AgentType, AgentType[]> = {
    'integrated-management': ['finops', 'governance', 'tmo', 'ocm'],
    tmo: ['ocm', 'integrated-management', 'governance'],
    finops: ['integrated-management', 'governance', 'planning'],
    okr: ['governance', 'integrated-management', 'tmo'],
    governance: ['integrated-management', 'finops'],
    planning: ['integrated-management', 'finops', 'tmo'],
    ocm: ['tmo', 'integrated-management', 'governance']
  };
  return relationships[agent] || [];
}

// Calculate metrics for an agent based on its data slice
function calculateAgentMetrics(projects: PMOProject[], programs: VROProgram[], risks: RiskIssue[], events: SimulationEvent[]): AgentMetrics {
  const healthyProjects = projects.filter(p => p.status === 'green').length;
  const atRiskProjects = projects.filter(p => p.status === 'red' || p.status === 'amber').length;
  const totalValue = programs.reduce((sum, p) => sum + p.roiValue, 0);
  const realizedValue = programs.reduce((sum, p) => sum + p.valueRealized, 0);
  const avgConfidence = programs.length > 0 
    ? programs.reduce((sum, p) => sum + p.strategicAlignment, 0) / programs.length 
    : 0;
  const activeAlerts = events.filter(e => !e.read).length;
  const pendingActions = projects.reduce((sum, p) => sum + p.proactiveActions.filter(a => a.urgency === 'immediate').length, 0);
  
  return {
    totalProjects: projects.length,
    healthyProjects,
    atRiskProjects,
    totalValue,
    realizedValue,
    avgConfidence: Math.round(avgConfidence),
    activeAlerts,
    pendingActions
  };
}

// Calculate 30-day snapshot metrics - aggregated historical values with different figures
function calculateSnapshotMetrics(projects: PMOProject[], programs: VROProgram[], risks: RiskIssue[]): AgentMetrics {
  // Snapshot shows historical aggregates - slightly different from real-time
  const healthyProjects = Math.floor(projects.filter(p => p.status === 'green').length * 0.9);
  const atRiskProjects = Math.floor(projects.filter(p => p.status === 'red' || p.status === 'amber').length * 1.1);
  const totalValue = Math.round(programs.reduce((sum, p) => sum + p.roiValue, 0) * 0.95);
  const realizedValue = Math.round(programs.reduce((sum, p) => sum + p.valueRealized, 0) * 0.85);
  const avgConfidence = programs.length > 0 
    ? (programs.reduce((sum, p) => sum + p.strategicAlignment, 0) / programs.length) * 0.92
    : 0;
  
  return {
    totalProjects: projects.length,
    healthyProjects,
    atRiskProjects,
    totalValue,
    realizedValue,
    avgConfidence: Math.round(avgConfidence),
    activeAlerts: Math.floor(risks.filter(r => r.severity === 'high' || r.severity === 'critical').length * 1.2),
    pendingActions: Math.floor(projects.reduce((sum, p) => sum + p.proactiveActions.filter(a => a.urgency === 'immediate').length, 0) * 1.15)
  };
}

export type ViewModeType = 'realtime' | 'snapshot';

// Get data slice for a specific agent
export function getAgentDataSlice(agentId: AgentType, events: SimulationEvent[] = [], viewMode: ViewModeType = 'realtime'): AgentDataSlice {
  const config = AGENT_CONFIG[agentId];
  
  // Guard against invalid agentId
  if (!config) {
    return {
      agentId,
      agentName: 'Unknown',
      category: 'Monitoring',
      projects: [],
      programs: [],
      risks: [],
      portfolios: [],
      events: [],
      metrics: { totalProjects: 0, healthyProjects: 0, atRiskProjects: 0, totalValue: 0, realizedValue: 0, avgConfidence: 0, activeAlerts: 0, pendingActions: 0 },
      crossAgentMessages: []
    };
  }
  
  // Filter projects/programs based on agent focus
  let filteredProjects = [...pmoProjects];
  let filteredPrograms = [...vroPrograms];
  let filteredRisks = [...riskIssues];
  
  // Agent-specific filtering
  switch (agentId) {
    case 'governance':
      filteredRisks = riskIssues;
      filteredProjects = pmoProjects.filter(p => p.bu === 'Risk & Compliance' || p.risks.length > 1);
      break;
    case 'finops':
      filteredProjects = pmoProjects.filter(p => p.budget.spent / p.budget.total > 0.7);
      filteredPrograms = vroPrograms.filter(p => p.roiValue > 20);
      break;
    case 'ocm':
      filteredProjects = pmoProjects.filter(p => p.safe.okr !== undefined);
      break;
    case 'okr':
      filteredProjects = pmoProjects.filter(p => p.safe.okr !== undefined);
      filteredPrograms = vroPrograms.filter(p => p.safe.okr !== undefined);
      break;
    case 'planning':
      filteredProjects = pmoProjects.filter(p => p.timeline.elapsed / p.timeline.total < 0.8);
      break;
    case 'tmo':
      filteredPrograms = vroPrograms.filter(p => p.valueStatus === 'accelerating' || p.valueStatus === 'at-risk');
      break;
  }
  
  // Filter events relevant to this agent
  const relevantEvents = events.filter(e => {
    const eventAgent = getAgentForEventType(e.type);
    return eventAgent === agentId || getRelatedAgents(eventAgent).includes(agentId);
  });
  
  const crossAgentMessages = generateCrossAgentMessages(events).filter(
    m => m.fromAgent === agentId || m.toAgent === agentId
  );
  
  // Calculate metrics based on viewMode
  const metrics = viewMode === 'snapshot'
    ? calculateSnapshotMetrics(filteredProjects, filteredPrograms, filteredRisks)
    : calculateAgentMetrics(filteredProjects, filteredPrograms, filteredRisks, relevantEvents);

  return {
    agentId,
    agentName: config.name,
    category: config.category,
    projects: filteredProjects,
    programs: filteredPrograms,
    risks: filteredRisks,
    portfolios: buPortfolios,
    events: viewMode === 'realtime' ? relevantEvents : [], // No live events in snapshot mode
    metrics,
    crossAgentMessages: viewMode === 'realtime' ? crossAgentMessages : [] // No live messages in snapshot mode
  };
}

// Project-level breakdown data for full traceability
const PROJECT_BREAKDOWNS = {
  claims: { id: 'claims', name: 'Claims', bu: 'Insurance' },
  workplacePensions: { id: 'workplace-pensions', name: 'Workplace Pensions', bu: 'Workplace' },
  customer: { id: 'customer', name: 'Customer', bu: 'Group Functions' },
  aiPoweredPricing: { id: 'ai-powered-pricing', name: 'AI Powered Pricing', bu: 'Insurance' }
};

// Handle top-level VRO/PMO dashboard metrics with full traceability
function getTopLevelMetricDrilldown(metricId: string, events: SimulationEvent[]): EntityDrilldown {
  let entityName = '';
  let metrics: Record<string, number | string> = {};
  let relatedEntities: { type: string; id: string; name: string }[] = [];
  const relatedAgents: AgentType[] = [];
  let projectBreakdown: { project: string; bu: string; value: string; contribution: string; status: string }[] = [];
  let calculationMethod = '';
  
  switch (metricId) {
    // VRO Metrics
    case 'current-roi':
      entityName = 'Current ROI - Full Traceability';
      relatedAgents.push('integrated-management', 'finops');
      calculationMethod = 'Weighted average ROI across all active projects based on investment size';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '78%', contribution: '28%', status: 'On Track' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '72%', contribution: '35%', status: 'On Track' },
        { project: 'Customer', bu: 'Group Functions', value: '45%', contribution: '22%', status: 'At Risk' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '61%', contribution: '15%', status: 'On Track' }
      ];
      metrics = {
        'Aggregate ROI': '64%',
        'Target ROI': '85%',
        'Baseline (2024)': '0%',
        'Target (2026)': '85%',
        'Gap to Target': '21%',
        'Calculation': 'Weighted Avg by Investment'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
    case 'net-present-value':
      entityName = 'Net Present Value - Full Traceability';
      relatedAgents.push('integrated-management', 'finops');
      calculationMethod = 'Sum of discounted cash flows across all projects (8% discount rate, 5-year horizon)';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '£12.5M', contribution: '34%', status: 'On Track' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '£14.2M', contribution: '39%', status: 'On Track' },
        { project: 'Customer', bu: 'Group Functions', value: '£5.8M', contribution: '16%', status: 'At Risk' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '£3.75M', contribution: '11%', status: 'On Track' }
      ];
      metrics = {
        'Total NPV': '$36.25M',
        'Target NPV': '$50M',
        'Baseline (2024)': '$0',
        'Target (2026)': '$50M',
        'Discount Rate': '8%',
        'Time Horizon': '5 years',
        'Progress to Target': '73%'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
    case 'timeline-progress':
      entityName = 'Timeline Progress - Full Traceability';
      relatedAgents.push('integrated-management', 'integrated-management', 'planning');
      calculationMethod = 'Average completion percentage across all projects weighted by strategic priority';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '82%', contribution: '30%', status: 'Phase 3' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '75%', contribution: '28%', status: 'Phase 3' },
        { project: 'Customer', bu: 'Group Functions', value: '48%', contribution: '25%', status: 'Phase 2' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '65%', contribution: '17%', status: 'Phase 2' }
      ];
      metrics = {
        'Overall Progress': '69%',
        'Current Phase': 'Phase 2 of 4',
        'Start (2024)': 'Phase 1',
        'Target (2026)': 'Phase 4',
        'Days Remaining': '186',
        'Milestones Complete': '12/18',
        'Schedule Variance': '-6%'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
    case 'budget-utilization':
      entityName = 'Budget Utilization - Full Traceability';
      relatedAgents.push('integrated-management', 'finops');
      calculationMethod = 'Total spend across all projects as percentage of allocated budget';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '£10.8M / £11.2M', contribution: '26%', status: '96%' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '£15.4M / £16.5M', contribution: '37%', status: '93%' },
        { project: 'Customer', bu: 'Group Functions', value: '£9.2M / £10.0M', contribution: '22%', status: '92%' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '£5.8M / £6.1M', contribution: '14%', status: '95%' }
      ];
      metrics = {
        'Total Utilized': '£41.2M',
        'Total Budget': '£43.8M',
        'Utilization Rate': '94%',
        'Baseline (2024)': '£0',
        'Target (2026)': '£41.2M',
        'Remaining': '£2.6M',
        'Variance': '+6% efficiency gain'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    
    // PMO Metrics
    case 'cycle-time':
      entityName = 'Cycle Time - Full Traceability';
      relatedAgents.push('integrated-management', 'planning');
      calculationMethod = 'Average time from work item start to completion across all project teams';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '14 days', contribution: '25%', status: 'On Track' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '22 days', contribution: '30%', status: 'At Risk' },
        { project: 'Customer', bu: 'Group Functions', value: '24 days', contribution: '28%', status: 'At Risk' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '16 days', contribution: '17%', status: 'On Track' }
      ];
      metrics = {
        'Average Cycle Time': '19 days',
        'Target': '10 days',
        'Baseline (2024)': '35 days',
        'Target (2026)': '10 days',
        'Improvement': '46% from baseline',
        'Gap to Target': '+9 days'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
    case 'flow-efficiency':
      entityName = 'Flow Efficiency - Full Traceability';
      relatedAgents.push('integrated-management', 'planning');
      calculationMethod = 'Active work time as percentage of total elapsed time (higher is better)';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '78%', contribution: '28%', status: 'Exceeds' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '65%', contribution: '26%', status: 'On Track' },
        { project: 'Customer', bu: 'Group Functions', value: '58%', contribution: '24%', status: 'On Track' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '72%', contribution: '22%', status: 'Exceeds' }
      ];
      metrics = {
        'Average Flow Efficiency': '69%',
        'Target': '50%',
        'Baseline (2024)': '45%',
        'Target (2026)': '50%',
        'Wait Time Reduction': '24%',
        'Status': 'EXCEEDS TARGET'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
    case 'throughput':
      entityName = 'Throughput - Full Traceability';
      relatedAgents.push('integrated-management', 'planning');
      calculationMethod = 'Total work items completed per week across all project teams';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '4 items/week', contribution: '36%', status: 'On Track' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '3 items/week', contribution: '27%', status: 'At Risk' },
        { project: 'Customer', bu: 'Group Functions', value: '2 items/week', contribution: '18%', status: 'At Risk' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '2 items/week', contribution: '18%', status: 'On Track' }
      ];
      metrics = {
        'Total Throughput': '11 items/week',
        'Target': '25 items/week',
        'Baseline (2024)': '8 items/week',
        'Target (2026)': '25 items/week',
        'Weekly Change': '+3 from baseline',
        'Gap to Target': '14 items/week'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
    case 'wip-items':
    case 'implementing': {
      const wipProjects = getProjectsByMetricId('implementing');
      const allProjects = EXPANDED_PMO_PROJECTS;
      entityName = `Work In Progress - ${wipProjects.length} Projects`;
      relatedAgents.push('integrated-management', 'governance');
      calculationMethod = 'Projects currently in Implementing stage per SAFe 6.0 Kanban flow';
      projectBreakdown = wipProjects.map(p => ({
        project: p.name,
        bu: p.bu,
        value: `${p.safe.velocity} velocity`,
        contribution: `${Math.round((p.budget.spent / p.budget.total) * 100)}% budget used`,
        status: p.status === 'green' ? 'On Track' : p.status === 'amber' ? 'At Risk' : 'Critical'
      }));
      metrics = {
        'WIP Count': `${wipProjects.length} projects`,
        'Total Projects': `${allProjects.length} projects`,
        'WIP Ratio': `${Math.round((wipProjects.length / allProjects.length) * 100)}%`,
        'Avg Velocity': `${Math.round(wipProjects.reduce((sum, p) => sum + p.safe.velocity, 0) / wipProjects.length)}`,
        'Avg Predictability': `${Math.round(wipProjects.reduce((sum, p) => sum + p.safe.predictability, 0) / wipProjects.length)}%`,
        'On Track': wipProjects.filter(p => p.status === 'green').length,
        'At Risk': wipProjects.filter(p => p.status === 'amber').length
      };
      relatedEntities = wipProjects.map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    }
    
    case 'on-track':
    case 'onTrack': {
      const onTrackProjects = getProjectsByMetricId('on-track');
      const allProjects = EXPANDED_PMO_PROJECTS;
      entityName = `On Track Projects - ${onTrackProjects.length} of ${allProjects.length}`;
      relatedAgents.push('integrated-management', 'integrated-management');
      calculationMethod = 'Projects with green status - budget and timeline on target';
      projectBreakdown = onTrackProjects.map(p => ({
        project: p.name,
        bu: p.bu,
        value: `${Math.round((p.deliverables.completed / p.deliverables.total) * 100)}% complete`,
        contribution: `£${p.budget.spent}m / £${p.budget.total}m`,
        status: p.safeStage
      }));
      metrics = {
        'On Track': `${onTrackProjects.length} projects`,
        'Total Projects': `${allProjects.length} projects`,
        'Health Rate': `${Math.round((onTrackProjects.length / allProjects.length) * 100)}%`,
        'Total Budget': `£${onTrackProjects.reduce((sum, p) => sum + p.budget.total, 0).toFixed(1)}m`,
        'Avg Velocity': `${Math.round(onTrackProjects.reduce((sum, p) => sum + p.safe.velocity, 0) / Math.max(onTrackProjects.length, 1))}`
      };
      relatedEntities = onTrackProjects.map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    }
    
    case 'at-risk':
    case 'atRisk': {
      const atRiskProjects = getProjectsByMetricId('at-risk');
      const allProjects = EXPANDED_PMO_PROJECTS;
      entityName = `At Risk Projects - ${atRiskProjects.length} of ${allProjects.length}`;
      relatedAgents.push('integrated-management', 'governance', 'integrated-management');
      calculationMethod = 'Projects with amber status - requiring attention';
      projectBreakdown = atRiskProjects.map(p => ({
        project: p.name,
        bu: p.bu,
        value: p.risks[0] || 'Risk identified',
        contribution: `${Math.round((p.timeline.elapsed / p.timeline.total) * 100)}% timeline`,
        status: p.safeStage
      }));
      metrics = {
        'At Risk': `${atRiskProjects.length} projects`,
        'Total Projects': `${allProjects.length} projects`,
        'Risk Rate': `${Math.round((atRiskProjects.length / allProjects.length) * 100)}%`,
        'Total Budget at Risk': `£${atRiskProjects.reduce((sum, p) => sum + p.budget.total, 0).toFixed(1)}m`,
        'Avg Predictability': `${Math.round(atRiskProjects.reduce((sum, p) => sum + p.safe.predictability, 0) / Math.max(atRiskProjects.length, 1))}%`
      };
      relatedEntities = atRiskProjects.map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    }
    
    case 'critical': {
      const criticalProjects = getProjectsByMetricId('critical');
      const allProjects = EXPANDED_PMO_PROJECTS;
      entityName = `Critical Projects - ${criticalProjects.length} of ${allProjects.length}`;
      relatedAgents.push('integrated-management', 'governance', 'integrated-management');
      calculationMethod = 'Projects with red status - immediate intervention required';
      projectBreakdown = criticalProjects.map(p => ({
        project: p.name,
        bu: p.bu,
        value: p.risks[0] || 'Critical issue',
        contribution: `${Math.round((p.timeline.elapsed / p.timeline.total) * 100)}% timeline`,
        status: 'Critical'
      }));
      metrics = {
        'Critical': `${criticalProjects.length} projects`,
        'Total Projects': `${allProjects.length} projects`,
        'Critical Rate': `${Math.round((criticalProjects.length / allProjects.length) * 100)}%`,
        'Total Budget at Risk': `£${criticalProjects.reduce((sum, p) => sum + p.budget.total, 0).toFixed(1)}m`
      };
      relatedEntities = criticalProjects.map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    }
    
    case 'active-projects':
    case 'all-projects': {
      const allProjects = EXPANDED_PMO_PROJECTS;
      entityName = `All Active Projects - ${allProjects.length}`;
      relatedAgents.push('integrated-management', 'integrated-management');
      calculationMethod = 'Complete portfolio of transformation projects';
      projectBreakdown = allProjects.slice(0, 10).map(p => ({
        project: p.name,
        bu: p.bu,
        value: `${Math.round((p.deliverables.completed / p.deliverables.total) * 100)}% complete`,
        contribution: `£${p.budget.spent}m / £${p.budget.total}m`,
        status: p.status === 'green' ? 'On Track' : p.status === 'amber' ? 'At Risk' : 'Critical'
      }));
      metrics = {
        'Total Projects': allProjects.length,
        'On Track': allProjects.filter(p => p.status === 'green').length,
        'At Risk': allProjects.filter(p => p.status === 'amber').length,
        'Critical': allProjects.filter(p => p.status === 'red').length,
        'Total Budget': `£${allProjects.reduce((sum, p) => sum + p.budget.total, 0).toFixed(1)}m`,
        'Implementing': allProjects.filter(p => p.safeStage === 'implementing').length
      };
      relatedEntities = allProjects.map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    }
      
    default:
      entityName = `Metric - ${metricId}`;
      metrics = { 'Status': 'Available' };
  }
  
  // Add project breakdown to metrics for display
  if (projectBreakdown.length > 0) {
    metrics['─────────────'] = '─────────────';
    metrics['PROJECT BREAKDOWN'] = '';
    projectBreakdown.forEach((p, i) => {
      metrics[`${i + 1}. ${p.project}`] = `${p.value} (${p.contribution})`;
    });
    metrics['────────────'] = '────────────';
    metrics['Calculation Method'] = calculationMethod;
  }
  
  return {
    entityType: 'metric',
    entityId: metricId,
    entityName,
    bu: 'Transformation Office',
    relatedAgents,
    events: events.slice(0, 10),
    metrics,
    actions: [
      { id: 'view-details', label: 'View Full Calculation Details', type: 'analyze' },
      { id: 'export-data', label: 'Export Traceability Report', type: 'analyze' }
    ],
    history: events.slice(0, 5).map(e => ({
      timestamp: e.timestamp,
      action: e.title,
      agent: 'integrated-management'
    })),
    relatedEntities
  };
}

// Get metric drilldown data - shows contextual data for a specific metric tile
export function getMetricDrilldown(metricId: string, events: SimulationEvent[] = []): EntityDrilldown | null {
  // Handle top-level VRO and PMO metrics first (not agent-specific)
  const vroMetrics = ['current-roi', 'net-present-value', 'timeline-progress', 'budget-utilization'];
  const pmoMetrics = ['cycle-time', 'flow-efficiency', 'throughput', 'wip-items'];
  
  if (vroMetrics.includes(metricId) || pmoMetrics.includes(metricId)) {
    return getTopLevelMetricDrilldown(metricId, events);
  }
  
  const [agentId, metricType] = metricId.split('-') as [AgentType, string];
  const config = AGENT_CONFIG[agentId];
  
  // Guard against invalid agentId
  if (!config) {
    return null;
  }
  
  const agentData = getAgentDataSlice(agentId, events);
  
  let entityName = '';
  let metrics: Record<string, number | string> = {};
  let relatedEntities: { type: string; id: string; name: string }[] = [];
  
  switch (metricType) {
    case 'projects':
      entityName = `${config.name} - Project Portfolio`;
      metrics = {
        'Total Projects': agentData.metrics.totalProjects,
        'Healthy': agentData.metrics.healthyProjects,
        'At Risk': agentData.metrics.atRiskProjects,
        'On Track Rate': `${Math.round((agentData.metrics.healthyProjects / Math.max(agentData.metrics.totalProjects, 1)) * 100)}%`
      };
      relatedEntities = agentData.projects.slice(0, 5).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    case 'value':
      entityName = `${config.name} - Value Portfolio`;
      metrics = {
        'Total Value': `£${agentData.metrics.totalValue}m`,
        'Realized Value': `£${agentData.metrics.realizedValue}m`,
        'Realization Rate': `${Math.round((agentData.metrics.realizedValue / Math.max(agentData.metrics.totalValue, 1)) * 100)}%`,
        'Programs Tracked': agentData.programs.length
      };
      relatedEntities = agentData.programs.slice(0, 5).map(p => ({ type: 'program', id: p.id, name: p.name }));
      break;
    case 'confidence':
      entityName = `${config.name} - Confidence Analysis`;
      metrics = {
        'Average Confidence': `${agentData.metrics.avgConfidence}%`,
        'High Confidence (>80%)': agentData.programs.filter(p => p.strategicAlignment > 80).length,
        'Medium Confidence (50-80%)': agentData.programs.filter(p => p.strategicAlignment >= 50 && p.strategicAlignment <= 80).length,
        'Low Confidence (<50%)': agentData.programs.filter(p => p.strategicAlignment < 50).length
      };
      relatedEntities = agentData.programs.slice(0, 5).map(p => ({ type: 'program', id: p.id, name: p.name }));
      break;
    case 'alerts':
      entityName = `${config.name} - Active Alerts`;
      metrics = {
        'Active Alerts': agentData.metrics.activeAlerts,
        'Pending Actions': agentData.metrics.pendingActions,
        'Critical Issues': agentData.risks.filter(r => r.severity === 'critical').length,
        'High Priority': agentData.risks.filter(r => r.severity === 'high').length
      };
      relatedEntities = agentData.risks.slice(0, 5).map(r => ({ type: 'risk', id: r.id, name: r.category }));
      break;
    case 'deadlines':
      entityName = `${config.name} - Deadline Tracking`;
      const onTrack = agentData.projects.filter(p => p.status === 'green').length;
      const total = agentData.projects.length;
      metrics = {
        'On Track': onTrack,
        'Total Deadlines': total,
        'At Risk': agentData.metrics.atRiskProjects,
        'Completion Rate': `${Math.round((onTrack / Math.max(total, 1)) * 100)}%`
      };
      relatedEntities = agentData.projects.slice(0, 5).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    case 'budget':
      entityName = `${config.name} - Budget Status`;
      const totalBudget = agentData.projects.reduce((sum, p) => sum + p.budget.total, 0);
      const spentBudget = agentData.projects.reduce((sum, p) => sum + p.budget.spent, 0);
      metrics = {
        'Total Budget': `£${totalBudget.toFixed(1)}m`,
        'Spent': `£${spentBudget.toFixed(1)}m`,
        'Remaining': `£${(totalBudget - spentBudget).toFixed(1)}m`,
        'Burn Rate': `${Math.round((spentBudget / Math.max(totalBudget, 1)) * 100)}%`
      };
      relatedEntities = agentData.projects.slice(0, 5).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    case 'progress':
      entityName = `${config.name} - Overall Progress`;
      metrics = {
        'Avg Confidence': `${agentData.metrics.avgConfidence}%`,
        'Healthy Projects': agentData.metrics.healthyProjects,
        'At Risk': agentData.metrics.atRiskProjects,
        'Value Realized': `£${agentData.metrics.realizedValue}m`
      };
      relatedEntities = agentData.programs.slice(0, 5).map(p => ({ type: 'program', id: p.id, name: p.name }));
      break;
    case 'decisions':
      entityName = `${config.name} - Decision Tracking`;
      const completed = agentData.projects.filter(p => p.status === 'green').length;
      metrics = {
        'Decisions Complete': completed,
        'Total Decisions': agentData.projects.length,
        'Pending Review': agentData.metrics.pendingActions,
        'Completion Rate': `${Math.round((completed / Math.max(agentData.projects.length, 1)) * 100)}%`
      };
      relatedEntities = agentData.projects.slice(0, 5).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    case 'pending':
      entityName = `${config.name} - Pending Actions`;
      metrics = {
        'Pending Actions': agentData.metrics.pendingActions,
        'Active Alerts': agentData.metrics.activeAlerts,
        'Requires Attention': agentData.metrics.atRiskProjects,
        'Avg Resolution Time': '2.5 days'
      };
      relatedEntities = agentData.projects.filter(p => p.status === 'amber').slice(0, 5).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
    case 'compliance':
      entityName = `${config.name} - Compliance Status`;
      metrics = {
        'Compliance Score': `${agentData.metrics.avgConfidence}%`,
        'FCA Aligned': 'Yes',
        'Last Audit': 'Q4 2025',
        'Open Issues': agentData.risks.filter(r => r.severity === 'high').length
      };
      relatedEntities = agentData.risks.slice(0, 5).map(r => ({ type: 'risk', id: r.id, name: r.category }));
      break;
    case 'high-risks':
      entityName = `${config.name} - High Risk Items`;
      const highRisks = agentData.risks.filter(r => r.severity === 'high' || r.severity === 'critical');
      metrics = {
        'High Risks': highRisks.length,
        'Critical': agentData.risks.filter(r => r.severity === 'critical').length,
        'Actively Monitored': highRisks.length,
        'Mitigation Rate': '78%'
      };
      relatedEntities = highRisks.slice(0, 5).map(r => ({ type: 'risk', id: r.id, name: r.category }));
      break;
    case 'cro':
      entityName = `${config.name} - CRO Overview`;
      metrics = {
        'Risk Appetite': 'Moderate',
        'Active Risks': agentData.risks.length,
        'Mitigation Plans': agentData.metrics.pendingActions,
        'Escalations': agentData.metrics.atRiskProjects
      };
      relatedEntities = agentData.risks.slice(0, 5).map(r => ({ type: 'risk', id: r.id, name: r.category }));
      break;
    default:
      entityName = `${config.name} - ${metricType.charAt(0).toUpperCase() + metricType.slice(1)}`;
      metrics = {
        'Total Projects': agentData.metrics.totalProjects,
        'Active Alerts': agentData.metrics.activeAlerts,
        'Value Realized': `£${agentData.metrics.realizedValue}m`,
        'Confidence': `${agentData.metrics.avgConfidence}%`
      };
      relatedEntities = agentData.projects.slice(0, 3).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
  }
  
  return {
    entityType: 'metric',
    entityId: metricId,
    entityName,
    bu: config.category,
    relatedAgents: [agentId],
    events: agentData.events,
    metrics,
    actions: [],
    history: agentData.events.slice(0, 10).map(e => ({
      timestamp: e.timestamp,
      action: e.title,
      agent: agentId
    })),
    relatedEntities
  };
}

// Get entity drilldown data
export function getEntityDrilldown(entityType: string, entityId: string, events: SimulationEvent[] = []): EntityDrilldown | null {
  // Handle metric drilldowns
  if (entityType === 'metric') {
    return getMetricDrilldown(entityId, events);
  }
  let entity: PMOProject | VROProgram | RiskIssue | BUPortfolio | undefined;
  let relatedAgents: AgentType[] = [];
  let metrics: Record<string, number | string> = {};
  let actions: { id: string; label: string; type: string }[] = [];
  
  switch (entityType) {
    case 'project':
      entity = pmoProjects.find(p => p.id === entityId);
      if (entity) {
        const proj = entity as PMOProject;
        relatedAgents = ['integrated-management', 'governance', 'ocm'];
        metrics = {
          'Budget Spent': `${proj.budget.spent}${proj.budget.unit}`,
          'Budget Total': `${proj.budget.total}${proj.budget.unit}`,
          'Timeline Progress': `${Math.round((proj.timeline.elapsed / proj.timeline.total) * 100)}%`,
          'Deliverables': `${proj.deliverables.completed}/${proj.deliverables.total}`,
          'Velocity': proj.safe.velocity,
          'Predictability': `${proj.safe.predictability}%`,
          'Flow Efficiency': `${proj.safe.flowEfficiency}%`
        };
        actions = proj.proactiveActions.map(a => ({ id: a.id, label: a.action, type: a.type }));
      }
      break;
    case 'program':
      entity = vroPrograms.find(p => p.id === entityId);
      if (entity) {
        const prog = entity as VROProgram;
        relatedAgents = ['integrated-management', 'finops', 'okr'];
        metrics = {
          'Expected ROI': prog.expectedROI,
          'Value Realized': `£${prog.valueRealized}m`,
          'Strategic Alignment': `${prog.strategicAlignment}%`,
          'Status': prog.valueStatus,
          'Velocity': prog.safe.velocity,
          'Predictability': `${prog.safe.predictability}%`
        };
        actions = prog.proactiveActions.map(a => ({ id: a.id, label: a.action, type: a.type }));
      }
      break;
    case 'risk':
      entity = riskIssues.find(r => r.id === entityId);
      if (entity) {
        const risk = entity as RiskIssue;
        relatedAgents = ['governance', 'integrated-management', 'integrated-management'];
        metrics = {
          'Severity': risk.severity,
          'Category': risk.category,
          'Trend': risk.trend
        };
      }
      break;
    case 'portfolio':
      entity = buPortfolios.find(p => p.id === entityId);
      if (entity) {
        const portfolio = entity as BUPortfolio;
        relatedAgents = ['integrated-management', 'integrated-management', 'finops', 'tmo'];
        metrics = {
          'Total Programs': portfolio.programCount,
          'Total Projects': portfolio.projectCount,
          'Total Budget': `£${portfolio.totalBudget}m`,
          'Realized Value': `£${portfolio.valueRealized}m`
        };
      }
      break;
  }
  
  // Handle PMO Guidance items
  if (entityType === 'guidance-item') {
    return getGuidanceDrilldown(entityId, events);
  }
  
  // Handle Learning Resources
  if (entityType === 'learning-resource') {
    return getLearningResourceDrilldown(entityId, events);
  }
  
  // Handle Collaborator items
  if (entityType === 'collaborator') {
    return getCollaboratorDrilldown(entityId, events);
  }
  
  // Handle Blocker items
  if (entityType === 'blocker') {
    return getBlockerDrilldown(entityId, events);
  }
  
  // Handle Cross-Agent Messages
  if (entityType === 'agent-message') {
    return getAgentMessageDrilldown(entityId, events);
  }
  
  if (!entity) return null;
  
  const entityEvents = events.filter(e => e.relatedEntity?.id === entityId);
  
  // Generate history based on events and actions
  const history = entityEvents.map(e => ({
    timestamp: e.timestamp,
    action: e.title,
    agent: getAgentForEventType(e.type)
  }));
  
  return {
    entityType: entityType as 'project' | 'program' | 'risk' | 'portfolio',
    entityId,
    entityName: 'name' in entity ? entity.name : entityId,
    bu: 'bu' in entity ? entity.bu : ('category' in entity ? entity.category : 'Portfolio'),
    relatedAgents,
    events: entityEvents,
    metrics,
    actions,
    history
  };
}

// Guidance item drilldown with AI insights
function getGuidanceDrilldown(guidanceId: string, events: SimulationEvent[]): EntityDrilldown {
  const guidanceData: Record<string, { title: string; type: string; aiInsight: string; relatedProjects: string[]; nextSteps: string[]; metrics: Record<string, string> }> = {
    'gd-001': {
      title: 'Early Stakeholder Alignment',
      type: 'best-practice',
      aiInsight: 'AI Analysis: Projects with Sprint 0 alignment sessions show 40% faster value delivery. Based on current portfolio, 3 projects would benefit from implementing this pattern immediately.',
      relatedProjects: ['PRT Intake System', 'Digital Onboarding', 'Cloud Migration'],
      nextSteps: [
        'Schedule alignment workshop for Digital Onboarding (recommended: next week)',
        'Create stakeholder mapping template from PRT success',
        'Notify OCM Agent to prepare change readiness assessment'
      ],
      metrics: { 'Success Rate': '94%', 'Avg Time Saved': '6 weeks', 'Projects Applied': '12', 'ROI Impact': '+23%' }
    },
    'gd-002': {
      title: 'Vendor Risk Mitigation',
      type: 'lesson-learned',
      aiInsight: 'AI Analysis: Single-vendor dependencies caused 34% of project delays in 2024. Current portfolio shows 4 projects with similar risk patterns. Governance Agent flagged 2 for immediate review.',
      relatedProjects: ['Private Markets Platform', 'API Gateway', 'Data Lake Migration'],
      nextSteps: [
        'Review vendor contracts for Private Markets Platform',
        'Identify backup vendors for critical components',
        'Update risk register with Governance Agent findings'
      ],
      metrics: { 'Risk Reduction': '67%', 'Cost Avoided': '£2.3m', 'Vendor Alternatives': '3 identified', 'Review Status': 'In Progress' }
    },
    'gd-003': {
      title: 'Cross-Group Knowledge Share',
      type: 'collaboration',
      aiInsight: 'AI Analysis: Retail team playbook achieved 92% adoption - highest across all divisions. Pattern analysis suggests this approach could accelerate 5 current rollouts by 4-6 weeks each.',
      relatedProjects: ['Three Lines of Defence', 'ESG Reporting', 'Regulatory Compliance'],
      nextSteps: [
        'Adapt Retail playbook for Investment division rollout',
        'Schedule knowledge transfer session with Retail PM',
        'OCM Agent to assess readiness for playbook adoption'
      ],
      metrics: { 'Adoption Rate': '92%', 'Time Saved': '4-6 weeks', 'Reusability Score': '87%', 'Teams Benefited': '8' }
    },
    'gd-004': {
      title: 'Accessibility Compliance Pattern',
      type: 'insight',
      aiInsight: 'AI Analysis: WCAG 2.1 gaps detected in 6 active projects. Early specialist engagement prevents 2-3 week delays. Governance Agent recommends immediate accessibility audit for Digital Onboarding.',
      relatedProjects: ['Digital Onboarding', 'Customer Portal', 'Mobile App Refresh'],
      nextSteps: [
        'Engage accessibility specialist for Digital Onboarding',
        'Run automated WCAG audit on Customer Portal',
        'Add accessibility checkpoint to project templates'
      ],
      metrics: { 'Compliance Gap': '23%', 'Delay Risk': '2-3 weeks', 'Projects Affected': '6', 'Remediation Cost': '£45k' }
    }
  };
  
  const data = guidanceData[guidanceId] || guidanceData['gd-001'];
  
  return {
    entityType: 'guidance-item',
    entityId: guidanceId,
    entityName: data.title,
    bu: 'PMO Knowledge Base',
    relatedAgents: ['integrated-management', 'ocm', 'governance'],
    events: events.slice(0, 5),
    metrics: data.metrics,
    actions: data.nextSteps.map((step, i) => ({ id: `action-${i}`, label: step, type: 'recommendation' })),
    history: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), action: 'AI insight generated', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), action: 'Pattern detected across projects', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), action: 'Added to knowledge base', agent: 'integrated-management' as AgentType }
    ],
    relatedEntities: data.relatedProjects.map((p, i) => ({ type: 'project', id: `proj-${i}`, name: p })),
    aiInsight: data.aiInsight
  };
}

// Learning resource drilldown
function getLearningResourceDrilldown(resourceId: string, events: SimulationEvent[]): EntityDrilldown {
  const resources: Record<string, { title: string; type: string; duration: string; summary: string; keyPoints: string[]; relatedOKRs: string[] }> = {
    'lr-0': {
      title: 'SAFe 6.0 Portfolio Management',
      type: 'Guide',
      duration: '15 min',
      summary: 'Comprehensive guide to Lean Portfolio Management in SAFe 6.0, covering strategic themes, portfolio canvas, and value stream coordination.',
      keyPoints: [
        'Lean budgeting replaces project-based funding',
        'Portfolio Kanban enables flow-based prioritization',
        'Epic hypothesis-driven delivery reduces waste',
        'Participatory budgeting increases alignment'
      ],
      relatedOKRs: ['Enterprise Cloud Transformation', 'Digital-First Customer Experience']
    },
    'lr-1': {
      title: 'Agile Estimation Best Practices',
      type: 'Video',
      duration: '8 min',
      summary: 'Learn proven estimation techniques including Planning Poker, T-shirt sizing, and story point calibration across teams.',
      keyPoints: [
        'Relative sizing improves accuracy over absolute hours',
        'Team calibration sessions reduce variance',
        'Historical velocity enables predictability',
        'Uncertainty buffers prevent overcommitment'
      ],
      relatedOKRs: ['Operational Excellence', 'Portfolio Predictability']
    },
    'lr-2': {
      title: 'Risk-Based PI Planning',
      type: 'Template',
      duration: '5 min',
      summary: 'Template for incorporating risk assessment into PI Planning, with ROAM categorization and mitigation tracking.',
      keyPoints: [
        'ROAM model: Resolved, Owned, Accepted, Mitigated',
        'Risk-adjusted capacity planning',
        'Cross-team dependency risk mapping',
        'Confidence voting with risk factors'
      ],
      relatedOKRs: ['Risk Management Excellence', 'Governance Compliance']
    },
    'lr-3': {
      title: 'Cross-Team Dependencies',
      type: 'Playbook',
      duration: '12 min',
      summary: 'Practical playbook for managing cross-team dependencies in scaled agile environments, including visualization and resolution patterns.',
      keyPoints: [
        'Dependency board visualization techniques',
        'Handoff protocols reduce wait time',
        'Integration sprint patterns',
        'Escalation paths for blockers'
      ],
      relatedOKRs: ['Operational Excellence', 'Cross-Group Collaboration']
    }
  };
  
  const data = resources[resourceId] || resources['lr-0'];
  
  return {
    entityType: 'learning-resource',
    entityId: resourceId,
    entityName: data.title,
    bu: 'Learning Center',
    relatedAgents: ['integrated-management', 'ocm'],
    events: [],
    metrics: { 'Type': data.type, 'Duration': data.duration, 'Completions': '47', 'Avg Rating': '4.6/5' },
    actions: data.keyPoints.map((point, i) => ({ id: `kp-${i}`, label: point, type: 'key-point' })),
    history: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), action: 'Resource updated', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), action: 'Added to library', agent: 'ocm' as AgentType }
    ],
    relatedEntities: data.relatedOKRs.map((okr, i) => ({ type: 'okr', id: `okr-${i}`, name: okr })),
    summary: data.summary
  };
}

// Collaborator drilldown
function getCollaboratorDrilldown(collaboratorId: string, events: SimulationEvent[]): EntityDrilldown {
  const collaborators: Record<string, { name: string; initials: string; role: string; contributions: string[]; sharedInsights: string[]; projects: string[] }> = {
    'collab-ak': {
      name: 'Andrew Kail',
      initials: 'AK',
      role: 'Senior PM - Technology',
      contributions: ['PRT automation insights', 'Sprint velocity templates', 'Risk mitigation playbook'],
      sharedInsights: ['Automation reduced manual processing by 65%', 'Team velocity improved 23% after capacity planning adjustment'],
      projects: ['PRT Intake System', 'Cloud Migration', 'API Gateway']
    },
    'collab-pl': {
      name: 'Paula Llewellyn',
      initials: 'PL',
      role: 'Accessibility Lead',
      contributions: ['Accessibility checklist', 'WCAG 2.1 compliance guide', 'Screen reader testing protocol'],
      sharedInsights: ['Early accessibility review saves 2-3 weeks', 'Automated testing catches 70% of issues'],
      projects: ['Digital Onboarding', 'Customer Portal', 'Mobile App']
    }
  };
  
  const data = collaborators[collaboratorId] || collaborators['collab-ak'];
  
  return {
    entityType: 'collaborator',
    entityId: collaboratorId,
    entityName: data.name,
    bu: data.role,
    relatedAgents: ['integrated-management', 'ocm'],
    events: [],
    metrics: { 'Contributions': String(data.contributions.length), 'Insights Shared': String(data.sharedInsights.length), 'Active Projects': String(data.projects.length), 'Knowledge Score': '94%' },
    actions: data.contributions.map((c, i) => ({ id: `contrib-${i}`, label: c, type: 'contribution' })),
    history: data.sharedInsights.map((insight, i) => ({
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 1)),
      action: insight,
      agent: 'integrated-management' as AgentType
    })),
    relatedEntities: data.projects.map((p, i) => ({ type: 'project', id: `proj-${i}`, name: p }))
  };
}

// Blocker drilldown
function getBlockerDrilldown(blockerId: string, events: SimulationEvent[]): EntityDrilldown {
  const blockers: Record<string, { title: string; description: string; impact: string; affectedProjects: string[]; mitigations: string[] }> = {
    'blocker-legacy': {
      title: 'Legacy System Integration Delays',
      description: 'Integration with legacy mainframe systems causing 2-4 week delays due to limited API availability and batch processing constraints.',
      impact: '4 projects affected, £1.2m cost impact',
      affectedProjects: ['Claims Processing', 'Policy Admin', 'Data Migration'],
      mitigations: ['Implement API gateway layer', 'Parallel processing queues', 'Legacy modernization roadmap']
    },
    'blocker-resources': {
      title: 'Resource Constraints in Q3',
      description: 'Key technical resources overallocated across multiple high-priority initiatives, causing bottlenecks in delivery.',
      impact: '6 projects at risk, velocity reduced 30%',
      affectedProjects: ['Cloud Migration', 'AI Platform', 'Digital Onboarding', 'API Gateway'],
      mitigations: ['Cross-train adjacent team members', 'Prioritize and defer lower-value work', 'Contract specialist support']
    },
    'blocker-data': {
      title: 'Third-Party Data Quality Issues',
      description: 'External data feeds showing inconsistent quality, requiring additional validation and cleansing effort.',
      impact: '3 projects delayed, data accuracy at 78%',
      affectedProjects: ['ESG Reporting', 'Risk Analytics', 'Customer 360'],
      mitigations: ['Implement data quality monitoring', 'Establish SLAs with data providers', 'Build validation layer']
    }
  };
  
  const data = blockers[blockerId] || blockers['blocker-legacy'];
  
  return {
    entityType: 'blocker',
    entityId: blockerId,
    entityName: data.title,
    bu: 'Risk Management',
    relatedAgents: ['integrated-management', 'governance', 'planning'],
    events: [],
    metrics: { 'Impact': data.impact, 'Projects Affected': String(data.affectedProjects.length), 'Status': 'Active', 'Priority': 'High' },
    actions: data.mitigations.map((m, i) => ({ id: `mit-${i}`, label: m, type: 'mitigation' })),
    history: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), action: 'Blocker identified', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), action: 'Impact assessment completed', agent: 'governance' as AgentType },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), action: 'Mitigation plan created', agent: 'planning' as AgentType }
    ],
    relatedEntities: data.affectedProjects.map((p, i) => ({ type: 'project', id: `proj-${i}`, name: p }))
  };
}

// Agent message drilldown
function getAgentMessageDrilldown(messageId: string, events: SimulationEvent[]): EntityDrilldown {
  const messages = generateCrossAgentMessages(events);
  const message = messages.find(m => m.id === messageId);
  
  if (!message) {
    return {
      entityType: 'agent-message',
      entityId: messageId,
      entityName: 'Agent Communication',
      bu: 'Cross-Agent Orchestration',
      relatedAgents: ['integrated-management', 'integrated-management'],
      events: [],
      metrics: {},
      actions: [],
      history: []
    };
  }
  
  return {
    entityType: 'agent-message',
    entityId: messageId,
    entityName: message.message,
    bu: `${AGENT_CONFIG[message.fromAgent].name} → ${AGENT_CONFIG[message.toAgent].name}`,
    relatedAgents: [message.fromAgent, message.toAgent],
    events: events.slice(0, 3),
    metrics: {
      'Priority': message.priority,
      'Type': message.messageType.replace('_', ' '),
      'Entity': message.entity,
      'Time': message.timestamp.toLocaleTimeString()
    },
    actions: [
      { id: 'action-1', label: 'Acknowledge and track', type: 'action' },
      { id: 'action-2', label: 'Escalate to stakeholder', type: 'escalation' },
      { id: 'action-3', label: 'Request more context', type: 'request' }
    ],
    history: [
      { timestamp: message.timestamp, action: `Message sent from ${AGENT_CONFIG[message.fromAgent].name}`, agent: message.fromAgent },
      { timestamp: new Date(message.timestamp.getTime() + 1000), action: `Received by ${AGENT_CONFIG[message.toAgent].name}`, agent: message.toAgent }
    ],
    relatedEntities: [{ type: 'entity', id: message.entity, name: message.entity }]
  };
}

// Get all cross-agent messages for the activity feed
export function getAllCrossAgentMessages(events: SimulationEvent[] = []): CrossAgentMessage[] {
  return generateCrossAgentMessages(events);
}

// Get summary metrics for all agents
export function getAllAgentsSummary(events: SimulationEvent[] = []): Record<AgentType, AgentMetrics> {
  const agents: AgentType[] = ['integrated-management', 'integrated-management', 'tmo', 'finops', 'okr', 'governance', 'planning', 'ocm'];
  const summary: Record<string, AgentMetrics> = {};
  
  agents.forEach(agentId => {
    const slice = getAgentDataSlice(agentId, events);
    summary[agentId] = slice.metrics;
  });
  
  return summary as Record<AgentType, AgentMetrics>;
}
