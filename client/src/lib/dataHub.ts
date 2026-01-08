// ============================================================================
// SIMULATION DATA HUB - Centralized Live Data for All Agents
// Merges pmoProjects, vroPrograms, riskIssues, buPortfolios with live events
// ============================================================================

import { pmoProjects, vroPrograms, riskIssues, buPortfolios, PMOProject, VROProgram, RiskIssue, BUPortfolio } from './buPrograms';
import { SimulationEvent } from './liveSimulation';

export type AgentType = 'vro' | 'pmo' | 'tmo' | 'finops' | 'okr' | 'governance' | 'planning' | 'ocm';

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
  entityType: 'project' | 'program' | 'risk' | 'portfolio' | 'metric' | 'division' | 'climate' | 'agent-message' | string;
  entityId: string;
  entityName: string;
  bu: string;
  relatedAgents: AgentType[];
  events: SimulationEvent[];
  metrics: Record<string, number | string>;
  actions: { id: string; label: string; type: string }[];
  history: { timestamp: Date; action: string; agent: AgentType }[];
  relatedEntities?: { type: string; id: string; name: string }[];
}

// Agent configuration with data mappings
const AGENT_CONFIG: Record<AgentType, { name: string; category: string; buFilters?: string[]; focusAreas: string[] }> = {
  vro: {
    name: 'Value Realization Agent',
    category: 'Value Realization',
    focusAreas: ['ROI', 'value', 'strategic alignment', 'benefits']
  },
  pmo: {
    name: 'PMO WorkFlow Orchestrator',
    category: 'Project Management',
    focusAreas: ['timeline', 'budget', 'deliverables', 'milestones']
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
  
  // Generate some baseline messages showing agent collaboration
  const messageTemplates: Omit<CrossAgentMessage, 'id' | 'timestamp'>[] = [
    { fromAgent: 'ocm', toAgent: 'vro', messageType: 'status_update', entity: 'PRT Intake System', message: 'Readiness score updated to 78% - training completion on track', priority: 'medium' },
    { fromAgent: 'governance', toAgent: 'pmo', messageType: 'alert_forward', entity: 'Private Markets Platform', message: 'Compliance checkpoint pending - requires sign-off before Phase 3', priority: 'high' },
    { fromAgent: 'finops', toAgent: 'vro', messageType: 'data_sync', entity: 'AI Deal Acceleration', message: 'Budget variance analysis complete - £2.1m under forecast', priority: 'low' },
    { fromAgent: 'okr', toAgent: 'tmo', messageType: 'recommendation', entity: 'Digital Transformation', message: 'OKR alignment at 94% - recommend accelerating Q4 objectives', priority: 'medium' },
    { fromAgent: 'planning', toAgent: 'pmo', messageType: 'action_request', entity: 'Resource Pool', message: 'Capacity constraint detected for Q3 - reallocation needed', priority: 'high' },
    { fromAgent: 'vro', toAgent: 'governance', messageType: 'data_sync', entity: 'Longevity Risk Intelligence', message: 'Value realization at £15m - governance review triggered', priority: 'medium' },
    { fromAgent: 'pmo', toAgent: 'ocm', messageType: 'status_update', entity: 'Digital Onboarding', message: 'UAT phase starting - change communication required', priority: 'medium' },
    { fromAgent: 'tmo', toAgent: 'finops', messageType: 'recommendation', entity: 'ESG Analytics', message: 'Transformation benefits exceeding forecast by 18%', priority: 'low' }
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
    'ai_alert': 'vro',
    'risk_warning': 'governance',
    'opportunity': 'vro',
    'prediction': 'planning',
    'safe_anomaly': 'pmo',
    'value_milestone': 'vro',
    'action_required': 'tmo'
  };
  return mapping[type] || 'vro';
}

function getRelatedAgents(agent: AgentType): AgentType[] {
  const relationships: Record<AgentType, AgentType[]> = {
    vro: ['pmo', 'finops', 'governance'],
    pmo: ['tmo', 'vro', 'ocm'],
    tmo: ['ocm', 'pmo', 'governance'],
    finops: ['vro', 'governance', 'planning'],
    okr: ['governance', 'vro', 'tmo'],
    governance: ['vro', 'pmo', 'finops'],
    planning: ['pmo', 'finops', 'tmo'],
    ocm: ['tmo', 'pmo', 'governance']
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
      relatedAgents.push('vro', 'finops');
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
      relatedAgents.push('vro', 'finops');
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
      relatedAgents.push('vro', 'pmo', 'planning');
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
      relatedAgents.push('vro', 'finops');
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
      relatedAgents.push('pmo', 'planning');
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
      relatedAgents.push('pmo', 'planning');
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
      relatedAgents.push('pmo', 'planning');
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
      entityName = 'Work In Progress - Full Traceability';
      relatedAgents.push('pmo', 'governance');
      calculationMethod = 'Count of active work items across all project teams vs WIP limits';
      projectBreakdown = [
        { project: 'Claims', bu: 'Insurance', value: '2 / 3 limit', contribution: '22%', status: 'Healthy' },
        { project: 'Workplace Pensions', bu: 'Workplace', value: '3 / 4 limit', contribution: '33%', status: 'Healthy' },
        { project: 'Customer', bu: 'Group Functions', value: '3 / 3 limit', contribution: '33%', status: 'At Limit' },
        { project: 'AI Powered Pricing', bu: 'Insurance', value: '1 / 2 limit', contribution: '11%', status: 'Healthy' }
      ];
      metrics = {
        'Total WIP': '9 items',
        'Total WIP Limit': '12 items',
        'Utilization': '75%',
        'Available Capacity': '3 slots',
        'Blocked Items': '1',
        'Avg Item Age': '4.2 days'
      };
      relatedEntities = Object.values(PROJECT_BREAKDOWNS).map(p => ({ type: 'project', id: p.id, name: p.name }));
      break;
      
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
      agent: 'vro'
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
        relatedAgents = ['pmo', 'governance', 'ocm'];
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
        relatedAgents = ['vro', 'finops', 'okr'];
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
        relatedAgents = ['governance', 'vro', 'pmo'];
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
        relatedAgents = ['vro', 'pmo', 'finops', 'tmo'];
        metrics = {
          'Total Programs': portfolio.programCount,
          'Total Projects': portfolio.projectCount,
          'Total Budget': `£${portfolio.totalBudget}m`,
          'Realized Value': `£${portfolio.valueRealized}m`
        };
      }
      break;
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

// Get all cross-agent messages for the activity feed
export function getAllCrossAgentMessages(events: SimulationEvent[] = []): CrossAgentMessage[] {
  return generateCrossAgentMessages(events);
}

// Get summary metrics for all agents
export function getAllAgentsSummary(events: SimulationEvent[] = []): Record<AgentType, AgentMetrics> {
  const agents: AgentType[] = ['vro', 'pmo', 'tmo', 'finops', 'okr', 'governance', 'planning', 'ocm'];
  const summary: Record<string, AgentMetrics> = {};
  
  agents.forEach(agentId => {
    const slice = getAgentDataSlice(agentId, events);
    summary[agentId] = slice.metrics;
  });
  
  return summary as Record<AgentType, AgentMetrics>;
}
