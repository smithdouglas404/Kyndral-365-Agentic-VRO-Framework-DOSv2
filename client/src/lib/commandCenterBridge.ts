import { persistIntervention, persistDiscussion, addDiscussionMessage } from './agentPersistence';

export interface AgentAction {
  actionType: 'approve' | 'dismiss' | 'escalate' | 'acknowledge';
  sourceComponent: string;
  interventionData: {
    id?: string;
    type: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality';
    severity: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    projectId: string;
    projectName: string;
    confidence: number;
    suggestedAction: string;
    impact: string;
    agentSource: string;
  };
}

const AGENT_COLORS: Record<string, string> = {
  'integrated-management': 'bg-green-500',
  'tmo': 'bg-orange-500',
  'finops': 'bg-blue-500',
  'okr': 'bg-indigo-500',
  'governance': 'bg-purple-500',
  'planning': 'bg-cyan-500',
  'ocm': 'bg-pink-500',
  'autonomous-risk': 'bg-red-500',
  'multi-agent': 'bg-amber-500',
  'pm-chat': 'bg-indigo-500'
};

function getAgentIdFromSource(source: string): string {
  const normalizedSource = source.toLowerCase();
  if (normalizedSource.includes('finops')) return 'finops';
  if (normalizedSource.includes('governance')) return 'governance';
  if (normalizedSource.includes('planning')) return 'planning';
  if (normalizedSource.includes('tmo') || normalizedSource.includes('transformation')) return 'tmo';
  if (normalizedSource.includes('ocm')) return 'ocm';
  if (normalizedSource.includes('okr')) return 'okr';
  if (normalizedSource.includes('integrated')) return 'integrated-management';
  if (normalizedSource.includes('risk')) return 'autonomous-risk';
  return 'integrated-management';
}

export async function routeToCommandCenter(action: AgentAction): Promise<{ success: boolean; interventionId?: string; discussionId?: string }> {
  const { actionType, sourceComponent, interventionData } = action;
  
  try {
    const confidenceStr = (interventionData.confidence / 100).toFixed(2);
    
    if (actionType === 'approve' || actionType === 'acknowledge') {
      const intervention = await persistIntervention({
        type: interventionData.type,
        severity: interventionData.severity,
        title: `[${actionType.toUpperCase()}] ${interventionData.title}`,
        description: interventionData.description,
        projectId: interventionData.projectId,
        projectName: interventionData.projectName,
        confidence: confidenceStr,
        suggestedAction: interventionData.suggestedAction,
        impact: interventionData.impact,
        status: actionType === 'approve' ? 'approved' : 'pending',
        agentSource: interventionData.agentSource
      });

      if (intervention) {
        const discussion = await persistDiscussion({
          topic: `Action: ${interventionData.title}`,
          status: 'active',
          projectId: interventionData.projectId,
          projectName: interventionData.projectName,
          priority: interventionData.severity === 'critical' ? 'critical' : interventionData.severity
        });

        if (discussion) {
          const agentId = getAgentIdFromSource(interventionData.agentSource);
          await addDiscussionMessage(discussion.id, {
            agentId,
            agentName: interventionData.agentSource,
            content: `User ${actionType}d intervention from ${sourceComponent}: "${interventionData.description}". ${actionType === 'approve' ? 'Executing recommended action.' : 'Awaiting further review.'}`,
            messageType: 'action'
          });
        }

        return { success: true, interventionId: intervention.id, discussionId: discussion?.id };
      }
    } else if (actionType === 'dismiss') {
      const intervention = await persistIntervention({
        type: interventionData.type,
        severity: interventionData.severity,
        title: `[DISMISSED] ${interventionData.title}`,
        description: interventionData.description,
        projectId: interventionData.projectId,
        projectName: interventionData.projectName,
        confidence: confidenceStr,
        suggestedAction: interventionData.suggestedAction,
        impact: interventionData.impact,
        status: 'dismissed',
        agentSource: interventionData.agentSource
      });

      return { success: !!intervention, interventionId: intervention?.id };
    } else if (actionType === 'escalate') {
      const intervention = await persistIntervention({
        type: interventionData.type,
        severity: 'critical',
        title: `[ESCALATED] ${interventionData.title}`,
        description: `ESCALATED: ${interventionData.description}`,
        projectId: interventionData.projectId,
        projectName: interventionData.projectName,
        confidence: confidenceStr,
        suggestedAction: `URGENT: ${interventionData.suggestedAction}`,
        impact: interventionData.impact,
        status: 'pending',
        agentSource: interventionData.agentSource
      });

      if (intervention) {
        const discussion = await persistDiscussion({
          topic: `ESCALATION: ${interventionData.title}`,
          status: 'escalated',
          projectId: interventionData.projectId,
          projectName: interventionData.projectName,
          priority: 'critical'
        });

        if (discussion) {
          await addDiscussionMessage(discussion.id, {
            agentId: 'governance',
            agentName: 'Governance Agent',
            content: `This intervention has been escalated from ${sourceComponent}. Immediate executive review required.`,
            messageType: 'recommendation'
          });
        }

        return { success: true, interventionId: intervention.id, discussionId: discussion?.id };
      }
    }

    return { success: false };
  } catch (error) {
    console.error('Failed to route action to Command Center:', error);
    return { success: false };
  }
}

export function createAgentActionFromRisk(
  risk: {
    id: string;
    projectId: string;
    projectName: string;
    riskType: string;
    severity: string;
    description: string;
    intervention: string;
    impact: string;
    confidence: number;
    agentSource: string;
  },
  actionType: AgentAction['actionType'],
  sourceComponent: string
): AgentAction {
  return {
    actionType,
    sourceComponent,
    interventionData: {
      id: risk.id,
      type: risk.riskType as AgentAction['interventionData']['type'],
      severity: risk.severity as AgentAction['interventionData']['severity'],
      title: `${risk.riskType.charAt(0).toUpperCase() + risk.riskType.slice(1)} Risk: ${risk.projectName}`,
      description: risk.description,
      projectId: risk.projectId,
      projectName: risk.projectName,
      confidence: risk.confidence,
      suggestedAction: risk.intervention,
      impact: risk.impact,
      agentSource: risk.agentSource
    }
  };
}

// Function for agents to emit NEW interventions to Command Center
export interface NewIntervention {
  type: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  confidence: number; // 0-100
  suggestedAction: string;
  impact: string;
  agentSource: string;
}

export async function emitAgentIntervention(intervention: NewIntervention): Promise<{ success: boolean; interventionId?: string }> {
  try {
    const confidenceStr = (intervention.confidence / 100).toFixed(2);
    
    const result = await persistIntervention({
      type: intervention.type,
      severity: intervention.severity,
      title: intervention.title,
      description: intervention.description,
      projectId: intervention.projectId,
      projectName: intervention.projectName,
      confidence: confidenceStr,
      suggestedAction: intervention.suggestedAction,
      impact: intervention.impact,
      status: 'pending',
      agentSource: intervention.agentSource
    });

    if (result) {
      console.log(`[Command Center] New intervention from ${intervention.agentSource}: ${intervention.title}`);
      return { success: true, interventionId: result.id };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Failed to emit agent intervention:', error);
    return { success: false };
  }
}
