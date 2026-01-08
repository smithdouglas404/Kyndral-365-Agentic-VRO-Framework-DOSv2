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
    name: 'PMO Flow Orchestrator',
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

// Get metric drilldown data - shows contextual data for a specific metric tile
export function getMetricDrilldown(metricId: string, events: SimulationEvent[] = []): EntityDrilldown | null {
  const [agentId, metricType] = metricId.split('-') as [AgentType, string];
  const agentData = getAgentDataSlice(agentId, events);
  const config = AGENT_CONFIG[agentId];
  
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
