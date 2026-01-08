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
  entityType: 'project' | 'program' | 'risk' | 'portfolio';
  entityId: string;
  entityName: string;
  bu: string;
  relatedAgents: AgentType[];
  events: SimulationEvent[];
  metrics: Record<string, number | string>;
  actions: { id: string; label: string; type: string }[];
  history: { timestamp: Date; action: string; agent: AgentType }[];
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

// Get data slice for a specific agent
export function getAgentDataSlice(agentId: AgentType, events: SimulationEvent[] = []): AgentDataSlice {
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
  
  return {
    agentId,
    agentName: config.name,
    category: config.category,
    projects: filteredProjects,
    programs: filteredPrograms,
    risks: filteredRisks,
    portfolios: buPortfolios,
    events: relevantEvents,
    metrics: calculateAgentMetrics(filteredProjects, filteredPrograms, filteredRisks, relevantEvents),
    crossAgentMessages
  };
}

// Get entity drilldown data
export function getEntityDrilldown(entityType: string, entityId: string, events: SimulationEvent[] = []): EntityDrilldown | null {
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
