import { AgentType } from './dataHub';

export interface PersistableIntervention {
  type: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  confidence: number;
  suggestedAction: string;
  impact: string;
  status: 'pending' | 'approved' | 'dismissed' | 'executing';
  agentSource: string;
}

export interface PersistableDiscussion {
  topic: string;
  status: 'active' | 'resolved' | 'escalated';
  projectId?: string;
  projectName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PersistableDiscussionMessage {
  agentId: string;
  agentName: string;
  content: string;
  messageType: 'analysis' | 'recommendation' | 'question' | 'agreement' | 'action';
}

let interventionCallbacks: ((intervention: any) => void)[] = [];
let discussionCallbacks: ((discussion: any) => void)[] = [];

export function onInterventionCreated(callback: (intervention: any) => void): () => void {
  interventionCallbacks.push(callback);
  return () => {
    interventionCallbacks = interventionCallbacks.filter(cb => cb !== callback);
  };
}

export function onDiscussionCreated(callback: (discussion: any) => void): () => void {
  discussionCallbacks.push(callback);
  return () => {
    discussionCallbacks = discussionCallbacks.filter(cb => cb !== callback);
  };
}

export async function persistIntervention(intervention: PersistableIntervention): Promise<any> {
  try {
    const response = await fetch('/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intervention)
    });
    
    if (!response.ok) {
      console.error('Failed to persist intervention:', await response.text());
      return null;
    }
    
    const created = await response.json();
    interventionCallbacks.forEach(cb => cb(created));
    return created;
  } catch (error) {
    console.error('Error persisting intervention:', error);
    return null;
  }
}

export async function persistDiscussion(
  discussion: PersistableDiscussion
): Promise<any> {
  try {
    const response = await fetch('/api/agent-discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discussion)
    });
    
    if (!response.ok) {
      console.error('Failed to persist discussion:', await response.text());
      return null;
    }
    
    const created = await response.json();
    discussionCallbacks.forEach(cb => cb(created));
    return created;
  } catch (error) {
    console.error('Error persisting discussion:', error);
    return null;
  }
}

export async function addDiscussionMessage(
  discussionId: string,
  message: Omit<PersistableDiscussionMessage, 'agentId'> & { agentId?: string }
): Promise<any> {
  try {
    const messageWithId = {
      ...message,
      agentId: message.agentId || message.agentName.toLowerCase().replace(/\s+/g, '-')
    };
    const response = await fetch(`/api/agent-discussions/${discussionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageWithId)
    });
    
    if (!response.ok) {
      console.error('Failed to add discussion message:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding discussion message:', error);
    return null;
  }
}

const AGENT_COLORS: Record<string, string> = {
  'integrated-management': 'bg-green-500',
  'tmo': 'bg-orange-500',
  'finops': 'bg-blue-500',
  'okr': 'bg-indigo-500',
  'governance': 'bg-purple-500',
  'planning': 'bg-cyan-500',
  'ocm': 'bg-pink-500'
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'integrated-management': 'Integrated Management Agent',
  'tmo': 'TMO Agent',
  'finops': 'FinOps Agent',
  'okr': 'OKR Agent',
  'governance': 'Governance Agent',
  'planning': 'Planning Agent',
  'ocm': 'OCM Agent'
};

export function getAgentDisplayName(agentId: AgentType): string {
  return AGENT_DISPLAY_NAMES[agentId] || agentId;
}

export function getAgentColor(agentId: AgentType): string {
  return AGENT_COLORS[agentId] || 'bg-gray-500';
}

export async function createAgentIntervention(
  agentId: AgentType,
  type: PersistableIntervention['type'],
  severity: PersistableIntervention['severity'],
  title: string,
  description: string,
  projectId: string,
  projectName: string,
  suggestedAction: string,
  impact: string,
  confidence: number = 85
): Promise<any> {
  return persistIntervention({
    type,
    severity,
    title,
    description,
    projectId,
    projectName,
    confidence,
    suggestedAction,
    impact,
    status: 'pending',
    agentSource: getAgentDisplayName(agentId)
  });
}

export async function startAgentDiscussion(
  topic: string,
  projectId: string,
  projectName: string,
  priority: PersistableDiscussion['priority'],
  initialAgentId: AgentType,
  initialMessage: string
): Promise<{ discussion: any; messageId: any } | null> {
  const discussion = await persistDiscussion({
    topic,
    status: 'active',
    projectId,
    projectName,
    priority
  });
  
  if (!discussion) return null;
  
  const message = await addDiscussionMessage(discussion.id, {
    agentId: initialAgentId,
    agentName: getAgentDisplayName(initialAgentId),
    content: initialMessage,
    messageType: 'analysis'
  });
  
  return { discussion, messageId: message?.id };
}

export async function continueDiscussion(
  discussionId: string,
  agentId: AgentType,
  content: string,
  messageType: PersistableDiscussionMessage['messageType'] = 'analysis'
): Promise<any> {
  return addDiscussionMessage(discussionId, {
    agentId: agentId,
    agentName: getAgentDisplayName(agentId),
    content,
    messageType
  });
}
