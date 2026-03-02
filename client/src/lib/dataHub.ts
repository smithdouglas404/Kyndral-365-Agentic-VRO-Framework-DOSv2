// ============================================================================
// DATA HUB - TYPE DEFINITIONS ONLY
// Use API hooks to fetch real data from backend
// ============================================================================

import type { PMOProject, VROProgram, RiskIssue, BUPortfolio } from './buPrograms';

/**
 * AgentType - Agent identifier
 *
 * This is a string to allow dynamic agent creation without code changes.
 * New agents can be added via the Admin UI and will work automatically.
 *
 * Known agent IDs: finops, tmo, risk, pmo, governance, vro, ocm, planning, okr, integrated, notification
 * But any string is valid for new agents added to the database.
 */
export type AgentType = string;

// Legacy type alias for backward compatibility
export type KnownAgentType = 'integrated-management' | 'integrated' | 'vro' | 'pmo' | 'tmo' | 'finops' | 'okr' | 'governance' | 'planning' | 'ocm' | 'risk' | 'notification';

export interface AgentDataSlice {
  agentId: AgentType;
  agentName: string;
  category: string;
  projects: PMOProject[];
  programs: VROProgram[];
  risks: RiskIssue[];
  portfolios: BUPortfolio[];
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
  metrics: Record<string, number | string>;
  actions: { id: string; label: string; type: string }[];
  history: { timestamp: Date; action: string; agent: AgentType }[];
  relatedEntities?: { type: string; id: string; name: string }[];
  events?: Array<{ id: string; type: string; timestamp: Date; description: string }>;
  aiInsight?: string;
  summary?: string;
}

/**
 * Legacy agent configuration - for backward compatibility
 * For new code, use useAgentRegistry hook to fetch agent data from API
 */
const AGENT_CONFIG: Record<string, { name: string; category: string; focusAreas: string[] }> = {
  'integrated-management': {
    name: 'Integrated Management Agent',
    category: 'Value & Delivery Management',
    focusAreas: ['ROI', 'value', 'strategic alignment', 'benefits', 'timeline', 'budget', 'deliverables', 'milestones']
  },
  'integrated': {
    name: 'Integrated Agent',
    category: 'Cross-functional Coordination',
    focusAreas: ['synthesis', 'coordination', 'portfolio', 'executive']
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
  risk: {
    name: 'Risk Agent',
    category: 'Risk Management',
    focusAreas: ['risk', 'mitigation', 'assessment', 'monitoring']
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
  },
  vro: {
    name: 'VRO Agent',
    category: 'Value Realization',
    focusAreas: ['value', 'benefits', 'ROI', 'outcomes']
  },
  pmo: {
    name: 'PMO Agent',
    category: 'Project Management',
    focusAreas: ['delivery', 'schedule', 'quality', 'execution']
  },
  notification: {
    name: 'Notification Agent',
    category: 'Utility',
    focusAreas: ['alerts', 'notifications', 'escalation', 'routing']
  }
};

/**
 * Get agent config - handles unknown agents gracefully
 * For new code, prefer using useAgentRegistry hook
 */
export function getAgentConfig(agentId: AgentType) {
  return AGENT_CONFIG[agentId] || {
    name: agentId.charAt(0).toUpperCase() + agentId.slice(1) + ' Agent',
    category: 'General',
    focusAreas: []
  };
}

// DEPRECATED: Use WebSocket/SSE for real cross-agent messages
export function generateCrossAgentMessages(): CrossAgentMessage[] {
  return [];
}

// DEPRECATED: Fetch from API using agent-specific hooks
export function getAgentDataSlice(agentId: AgentType): AgentDataSlice {
  return {
    agentId,
    agentName: getAgentConfig(agentId).name,
    category: getAgentConfig(agentId).category,
    projects: [],
    programs: [],
    risks: [],
    portfolios: [],
    metrics: {
      totalProjects: 0,
      healthyProjects: 0,
      atRiskProjects: 0,
      totalValue: 0,
      realizedValue: 0,
      avgConfidence: 0,
      activeAlerts: 0,
      pendingActions: 0
    },
    crossAgentMessages: []
  };
}

// DEPRECATED: Fetch from API
export function getAllAgentData(): AgentDataSlice[] {
  return [];
}

// DEPRECATED: Fetch from API using useEntityDrilldown hook
export function getEntityDrilldown(entityType: string, entityId: string): EntityDrilldown | null {
  return null;
}

// DEPRECATED: Fetch from API
export function getAgentMessages(agentId?: AgentType): CrossAgentMessage[] {
  return [];
}

// DEPRECATED: Fetch from API
export function getMessagesBetweenAgents(fromAgent: AgentType, toAgent: AgentType): CrossAgentMessage[] {
  return [];
}

// DEPRECATED: Fetch from API
export function getAllCrossAgentMessages(): CrossAgentMessage[] {
  return [];
}

// DEPRECATED: Fetch from API
export function getAllAgentsSummary() {
  return {
    totalAgents: 0,
    activeAgents: 0,
    totalProjects: 0,
    totalAlerts: 0,
    avgConfidence: 0
  };
}
