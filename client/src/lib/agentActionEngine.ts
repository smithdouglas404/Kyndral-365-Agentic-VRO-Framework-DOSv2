import { AgentType } from './dataHub';

export type ActionType = 
  | 'escalate'
  | 'notify'
  | 'update-status'
  | 'create-task'
  | 'reassign'
  | 'approve'
  | 'reject'
  | 'investigate'
  | 'mitigate'
  | 'accelerate'
  | 'defer'
  | 'close';

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

export type ActionStatus = 'pending' | 'executing' | 'completed' | 'failed';

export interface AgentAction {
  id: string;
  agentId: AgentType;
  agentName: string;
  actionType: ActionType;
  priority: ActionPriority;
  status: ActionStatus;
  targetEntityType: 'project' | 'risk' | 'alert' | 'okr' | 'metric' | 'task';
  targetEntityId: string;
  targetEntityName: string;
  reasoning: string;
  aiConfidence: number;
  timestamp: Date;
  completedAt?: Date;
  result?: string;
  triggeredBy?: string;
  affectedAgents: AgentType[];
}

export interface AgentMessage {
  id: string;
  fromAgent: AgentType;
  toAgents: AgentType[];
  messageType: 'alert' | 'insight' | 'request' | 'handoff' | 'acknowledgment';
  subject: string;
  content: string;
  priority: ActionPriority;
  relatedEntityId?: string;
  relatedActionId?: string;
  timestamp: Date;
  read: boolean;
}

export interface ThresholdBreach {
  id: string;
  metricId: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  thresholdType: 'min' | 'max';
  severity: 'warning' | 'critical';
  detectedAt: Date;
  handledBy?: AgentType;
  actionTaken?: string;
}

const AGENT_NAMES: Record<AgentType, string> = {
  vro: 'VRO Intelligence',
  pmo: 'PMO Control',
  tmo: 'TMO',
  finops: 'FinOps',
  okr: 'OKR Mapping',
  governance: 'Governance',
  planning: 'Planning',
  ocm: 'OCM'
};

const AGENT_CAPABILITIES: Record<AgentType, ActionType[]> = {
  vro: ['escalate', 'notify', 'investigate', 'accelerate', 'mitigate'],
  pmo: ['escalate', 'notify', 'update-status', 'create-task', 'reassign', 'defer'],
  tmo: ['notify', 'investigate', 'create-task', 'accelerate'],
  finops: ['escalate', 'notify', 'investigate', 'approve', 'reject', 'mitigate'],
  okr: ['notify', 'update-status', 'investigate'],
  governance: ['escalate', 'notify', 'approve', 'reject', 'investigate', 'close'],
  planning: ['notify', 'update-status', 'create-task', 'reassign', 'defer'],
  ocm: ['notify', 'create-task', 'investigate', 'accelerate']
};

const AGENT_SUBSCRIPTIONS: Record<AgentType, AgentType[]> = {
  vro: ['pmo', 'finops', 'governance'],
  pmo: ['vro', 'tmo', 'planning', 'governance'],
  tmo: ['pmo', 'ocm', 'vro'],
  finops: ['vro', 'pmo', 'governance'],
  okr: ['vro', 'pmo'],
  governance: ['vro', 'pmo', 'finops'],
  planning: ['pmo', 'tmo'],
  ocm: ['tmo', 'pmo']
};

let actionLog: AgentAction[] = [];
let messageLog: AgentMessage[] = [];
let breachLog: ThresholdBreach[] = [];
let actionListeners: ((action: AgentAction) => void)[] = [];
let messageListeners: ((message: AgentMessage) => void)[] = [];
let recentActionKeys: Map<string, number> = new Map(); // Track recent actions to prevent duplicates

const DEDUP_WINDOW_MS = 60000; // 60 second window to prevent duplicate actions

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isDuplicateAction(agentId: AgentType, actionType: ActionType, targetEntityId: string): boolean {
  const key = `${agentId}-${actionType}-${targetEntityId}`;
  const lastTime = recentActionKeys.get(key);
  const now = Date.now();
  
  if (lastTime && (now - lastTime) < DEDUP_WINDOW_MS) {
    return true; // Duplicate within window
  }
  
  recentActionKeys.set(key, now);
  
  // Clean up old entries periodically
  if (recentActionKeys.size > 100) {
    const cutoff = now - DEDUP_WINDOW_MS;
    Array.from(recentActionKeys.entries()).forEach(([k, v]) => {
      if (v < cutoff) recentActionKeys.delete(k);
    });
  }
  
  return false;
}

function cloneAction(action: AgentAction): AgentAction {
  return { ...action, timestamp: new Date(action.timestamp), completedAt: action.completedAt ? new Date(action.completedAt) : undefined };
}

function cloneMessage(message: AgentMessage): AgentMessage {
  return { ...message, timestamp: new Date(message.timestamp) };
}

export function executeAction(
  agentId: AgentType,
  actionType: ActionType,
  targetEntityType: AgentAction['targetEntityType'],
  targetEntityId: string,
  targetEntityName: string,
  reasoning: string,
  aiConfidence: number = 85,
  triggeredBy?: string
): AgentAction | null {
  // Check for duplicate action within time window
  if (isDuplicateAction(agentId, actionType, targetEntityId)) {
    return null; // Skip duplicate
  }
  
  const action: AgentAction = {
    id: generateId(),
    agentId,
    agentName: AGENT_NAMES[agentId],
    actionType,
    priority: aiConfidence >= 90 ? 'critical' : aiConfidence >= 75 ? 'high' : aiConfidence >= 50 ? 'medium' : 'low',
    status: 'executing',
    targetEntityType,
    targetEntityId,
    targetEntityName,
    reasoning,
    aiConfidence,
    timestamp: new Date(),
    triggeredBy,
    affectedAgents: AGENT_SUBSCRIPTIONS[agentId] || []
  };

  actionLog.unshift(action);

  setTimeout(() => {
    action.status = 'completed';
    action.completedAt = new Date();
    action.result = `Successfully ${actionType}d ${targetEntityName}`;
    actionListeners.forEach(listener => listener(cloneAction(action)));
  }, 500 + Math.random() * 1000);

  notifySubscribedAgents(action);
  actionListeners.forEach(listener => listener(cloneAction(action)));

  return action;
}

function notifySubscribedAgents(action: AgentAction): void {
  const subscribers = AGENT_SUBSCRIPTIONS[action.agentId] || [];
  
  subscribers.forEach(subscriberAgent => {
    const message: AgentMessage = {
      id: generateId(),
      fromAgent: action.agentId,
      toAgents: [subscriberAgent],
      messageType: action.actionType === 'escalate' ? 'alert' : 'insight',
      subject: `${action.agentName} ${action.actionType}: ${action.targetEntityName}`,
      content: action.reasoning,
      priority: action.priority,
      relatedEntityId: action.targetEntityId,
      relatedActionId: action.id,
      timestamp: new Date(),
      read: false
    };
    
    messageLog.unshift(message);
    messageListeners.forEach(listener => listener(cloneMessage(message)));
  });
}

export function sendAgentMessage(
  fromAgent: AgentType,
  toAgents: AgentType[],
  messageType: AgentMessage['messageType'],
  subject: string,
  content: string,
  priority: ActionPriority = 'medium',
  relatedEntityId?: string
): AgentMessage {
  const message: AgentMessage = {
    id: generateId(),
    fromAgent,
    toAgents,
    messageType,
    subject,
    content,
    priority,
    relatedEntityId,
    timestamp: new Date(),
    read: false
  };

  messageLog.unshift(message);
  messageListeners.forEach(listener => listener(cloneMessage(message)));

  return message;
}

export function recordThresholdBreach(
  metricId: string,
  metricName: string,
  currentValue: number,
  thresholdValue: number,
  thresholdType: 'min' | 'max',
  severity: 'warning' | 'critical'
): ThresholdBreach {
  const breach: ThresholdBreach = {
    id: generateId(),
    metricId,
    metricName,
    currentValue,
    thresholdValue,
    thresholdType,
    severity,
    detectedAt: new Date()
  };

  breachLog.unshift(breach);
  return breach;
}

export function handleBreachWithAgent(
  breachId: string, 
  agentId: AgentType, 
  actionTaken: string,
  cascadeToAgents?: AgentType[]
): void {
  const breach = breachLog.find(b => b.id === breachId);
  if (breach) {
    breach.handledBy = agentId;
    breach.actionTaken = actionTaken;
    
    if (cascadeToAgents && cascadeToAgents.length > 0) {
      cascadeToAgents.forEach((targetAgent, index) => {
        setTimeout(() => {
          sendAgentMessage(
            agentId,
            [targetAgent],
            'alert',
            `Breach Cascade: ${breach.metricName}`,
            `${AGENT_NAMES[agentId]} detected ${breach.severity} breach on ${breach.metricName}. ` +
            `Current: ${breach.currentValue.toFixed(1)}, Threshold: ${breach.thresholdValue}. Action: ${actionTaken}`,
            breach.severity === 'critical' ? 'critical' : 'high',
            breach.metricId
          );
          
          executeAction(
            targetAgent,
            targetAgent === 'governance' ? 'investigate' : 'notify',
            'metric',
            breach.metricId,
            breach.metricName,
            `Responding to cascade from ${AGENT_NAMES[agentId]}: ${breach.metricName} breach requires attention`,
            breach.severity === 'critical' ? 90 : 75,
            agentId
          );
        }, 1500 * (index + 1));
      });
    }
  }
}

export function getActionLog(): AgentAction[] {
  return actionLog.map(cloneAction);
}

export function getMessageLog(): AgentMessage[] {
  return messageLog.map(cloneMessage);
}

export function getBreachLog(): ThresholdBreach[] {
  return [...breachLog];
}

export function getAgentActions(agentId: AgentType): AgentAction[] {
  return actionLog.filter(a => a.agentId === agentId);
}

export function getAgentMessages(agentId: AgentType): AgentMessage[] {
  return messageLog.filter(m => m.toAgents.includes(agentId) || m.fromAgent === agentId);
}

export function getUnreadMessages(agentId: AgentType): AgentMessage[] {
  return messageLog.filter(m => m.toAgents.includes(agentId) && !m.read);
}

export function markMessageRead(messageId: string): void {
  const message = messageLog.find(m => m.id === messageId);
  if (message) {
    message.read = true;
  }
}

export function subscribeToActions(listener: (action: AgentAction) => void): () => void {
  actionListeners.push(listener);
  return () => {
    actionListeners = actionListeners.filter(l => l !== listener);
  };
}

export function subscribeToMessages(listener: (message: AgentMessage) => void): () => void {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter(l => l !== listener);
  };
}

export function getAgentCapabilities(agentId: AgentType): ActionType[] {
  return AGENT_CAPABILITIES[agentId] || [];
}

export function getAgentSubscribers(agentId: AgentType): AgentType[] {
  return AGENT_SUBSCRIPTIONS[agentId] || [];
}

export function getAgentName(agentId: AgentType): string {
  return AGENT_NAMES[agentId];
}

export function clearLogs(): void {
  actionLog = [];
  messageLog = [];
  breachLog = [];
}

export function getRecentActivity(limit: number = 20): (AgentAction | AgentMessage)[] {
  const combined = [
    ...actionLog.map(a => ({ ...a, _type: 'action' as const })),
    ...messageLog.map(m => ({ ...m, _type: 'message' as const }))
  ];
  
  combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return combined.slice(0, limit);
}
