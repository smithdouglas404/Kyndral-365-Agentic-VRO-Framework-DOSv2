import { toast } from 'sonner';
import { notifyAction } from './backgroundAgentMonitor';
import { recordMemory } from './agentOrchestrator';
import { simulationEngine } from './liveSimulation';
import type { AgentType } from './dataHub';

export interface CascadeAction {
  agentId: AgentType;
  agentName: string;
  icon: string;
  action: string;
  detail: string;
  delay: number;
}

export interface ActionScenario {
  id: string;
  trigger: string;
  confirmMessage: string;
  actions: CascadeAction[];
}

const AGENT_ICONS: Record<AgentType, string> = {
  'integrated-management': '🎛️',
  tmo: '🔧',
  finops: '💰',
  okr: '🎯',
  governance: '🛡️',
  planning: '📅',
  ocm: '👥'
};

const AGENT_NAMES: Record<AgentType, string> = {
  'integrated-management': 'Integrated Management',
  tmo: 'Delivery Agent',
  finops: 'Finance Agent',
  okr: 'OKR Agent',
  governance: 'Governance Agent',
  planning: 'Planning Agent',
  ocm: 'OCM Agent'
};

export const SCENARIO_TEMPLATES: Record<string, (params: Record<string, string>) => ActionScenario> = {
  reduceBudget: (params) => ({
    id: `budget-reduction-${Date.now()}`,
    trigger: `Reduce ${params.projectName} budget by ${params.percentage}%`,
    confirmMessage: `Budget for ${params.projectName} will be reduced from $${params.currentBudget}M to $${params.newBudget}M. This may impact timeline and scope.`,
    actions: [
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💰', action: 'Budget Updated', detail: `${params.projectName} budget reduced by ${params.percentage}%`, delay: 1000 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '🎛️', action: 'PM Notified', detail: `Project Manager alerted to budget change`, delay: 2000 },
      { agentId: 'tmo', agentName: 'Dependency Agent', icon: '🔗', action: 'Dependencies Updated', detail: `${params.dependencyCount || 3} linked work items recalculated`, delay: 3500 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '📊', action: 'Projections Recalculated', detail: `Q2 value forecast updated to reflect changes`, delay: 4500 },
      { agentId: 'planning', agentName: 'Scheduling Agent', icon: '📅', action: 'Meeting Scheduled', detail: `Team sync scheduled for tomorrow 2pm`, delay: 5500 },
      { agentId: 'governance', agentName: 'Risk Agent', icon: '⚠️', action: 'Risk Assessment', detail: `Potential scope impact flagged for review`, delay: 6500 }
    ]
  }),

  increaseBudget: (params) => ({
    id: `budget-increase-${Date.now()}`,
    trigger: `Increase ${params.projectName} budget by ${params.percentage}%`,
    confirmMessage: `Budget for ${params.projectName} will be increased from $${params.currentBudget}M to $${params.newBudget}M. This requires portfolio approval.`,
    actions: [
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💰', action: 'Budget Request Created', detail: `${params.projectName} budget increase of ${params.percentage}% submitted`, delay: 1000 },
      { agentId: 'governance', agentName: 'Governance Agent', icon: '🛡️', action: 'Approval Workflow Started', detail: `Budget change requires steering committee approval`, delay: 2500 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '📊', action: 'Impact Analysis', detail: `Portfolio capacity impact calculated`, delay: 3500 },
      { agentId: 'okr', agentName: 'OKR Agent', icon: '🎯', action: 'ROI Projection Updated', detail: `Expected ROI recalculated with new investment`, delay: 4500 },
      { agentId: 'ocm', agentName: 'OCM Agent', icon: '📧', action: 'Stakeholders Notified', detail: `Budget change request sent to finance committee`, delay: 5500 },
      { agentId: 'planning', agentName: 'Planning Agent', icon: '📅', action: 'Review Meeting Scheduled', detail: `Portfolio review scheduled for steering committee`, delay: 6500 }
    ]
  }),

  extendTimeline: (params) => ({
    id: `timeline-extension-${Date.now()}`,
    trigger: `Extend ${params.projectName} timeline by ${params.weeks} weeks`,
    confirmMessage: `${params.projectName} end date will be extended by ${params.weeks} weeks. Dependencies will be recalculated.`,
    actions: [
      { agentId: 'planning', agentName: 'Planning Agent', icon: '📅', action: 'Timeline Updated', detail: `End date extended by ${params.weeks} weeks`, delay: 1000 },
      { agentId: 'tmo', agentName: 'Dependency Agent', icon: '🔗', action: 'Dependencies Recalculated', detail: `${params.dependencyCount || 5} downstream projects impacted`, delay: 2500 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '🎛️', action: 'Cascade Analysis', detail: `Portfolio timeline impacts calculated`, delay: 3500 },
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💵', action: 'Cost Recalculated', detail: `Extended timeline adds $${params.additionalCost || '0.3'}M to project`, delay: 4500 },
      { agentId: 'governance', agentName: 'Risk Agent', icon: '⚠️', action: 'Risk Updated', detail: `Timeline risk status changed to amber`, delay: 5500 },
      { agentId: 'ocm', agentName: 'OCM Agent', icon: '📧', action: 'Stakeholders Notified', detail: `Timeline change communicated to sponsors`, delay: 6500 }
    ]
  }),

  markPriority: (params) => ({
    id: `priority-change-${Date.now()}`,
    trigger: `Mark ${params.projectName} as ${params.priority} priority`,
    confirmMessage: `${params.projectName} will be marked as ${params.priority} priority. This affects resource allocation and visibility.`,
    actions: [
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '🎛️', action: 'Priority Updated', detail: `${params.projectName} now ${params.priority} priority`, delay: 1000 },
      { agentId: 'planning', agentName: 'Resource Agent', icon: '👥', action: 'Resources Reallocated', detail: `Priority resources assigned from pool`, delay: 2500 },
      { agentId: 'governance', agentName: 'Governance Agent', icon: '🛡️', action: 'Oversight Increased', detail: `Weekly executive updates now required`, delay: 3500 },
      { agentId: 'okr', agentName: 'OKR Agent', icon: '🎯', action: 'OKRs Highlighted', detail: `Key results flagged for leadership visibility`, delay: 4500 },
      { agentId: 'ocm', agentName: 'OCM Agent', icon: '📣', action: 'Priority Communicated', detail: `All stakeholders notified of priority change`, delay: 5500 }
    ]
  }),

  accelerateProject: (params) => ({
    id: `accelerate-${Date.now()}`,
    trigger: `Accelerate ${params.projectName} delivery`,
    confirmMessage: `${params.projectName} will be accelerated. Additional resources may be required.`,
    actions: [
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '🚀', action: 'Acceleration Initiated', detail: `${params.projectName} marked as priority`, delay: 1000 },
      { agentId: 'planning', agentName: 'Resource Agent', icon: '👥', action: 'Resources Allocated', detail: `2 additional team members assigned`, delay: 2500 },
      { agentId: 'tmo', agentName: 'Delivery Agent', icon: '📈', action: 'Sprint Adjusted', detail: `Velocity target increased by 20%`, delay: 3500 },
      { agentId: 'ocm', agentName: 'OCM Agent', icon: '📣', action: 'Stakeholders Notified', detail: `Change communication sent to sponsors`, delay: 4500 }
    ]
  }),

  pauseProject: (params) => ({
    id: `pause-${Date.now()}`,
    trigger: `Pause ${params.projectName}`,
    confirmMessage: `${params.projectName} will be paused. All active work will be suspended.`,
    actions: [
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '⏸️', action: 'Project Paused', detail: `${params.projectName} status changed to On Hold`, delay: 1000 },
      { agentId: 'tmo', agentName: 'Task Agent', icon: '📋', action: 'Tasks Suspended', detail: `${params.taskCount || 12} active tasks moved to backlog`, delay: 2000 },
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💰', action: 'Budget Released', detail: `Uncommitted funds returned to portfolio`, delay: 3000 },
      { agentId: 'ocm', agentName: 'Communication Agent', icon: '📧', action: 'Team Notified', detail: `Pause notification sent to all team members`, delay: 4000 },
      { agentId: 'governance', agentName: 'Governance Agent', icon: '📝', action: 'Audit Log Updated', detail: `Pause decision documented for compliance`, delay: 5000 }
    ]
  }),

  addResource: (params) => ({
    id: `resource-${Date.now()}`,
    trigger: `Add ${params.resourceType || 'developer'} to ${params.projectName}`,
    confirmMessage: `A new ${params.resourceType || 'developer'} will be assigned to ${params.projectName}.`,
    actions: [
      { agentId: 'planning', agentName: 'Resource Agent', icon: '👤', action: 'Resource Assigned', detail: `${params.resourceName || 'New team member'} added to ${params.projectName}`, delay: 1000 },
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💵', action: 'Budget Updated', detail: `Resource cost added to project forecast`, delay: 2000 },
      { agentId: 'tmo', agentName: 'Capacity Agent', icon: '📊', action: 'Capacity Recalculated', detail: `Team velocity projection increased`, delay: 3000 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '📧', action: 'Onboarding Initiated', detail: `Welcome materials sent to new team member`, delay: 4000 }
    ]
  }),

  escalateRisk: (params) => ({
    id: `escalate-${Date.now()}`,
    trigger: `Escalate ${params.riskName} to leadership`,
    confirmMessage: `${params.riskName} will be escalated to executive leadership for review.`,
    actions: [
      { agentId: 'governance', agentName: 'Risk Agent', icon: '🚨', action: 'Escalation Created', detail: `${params.riskName} flagged as critical`, delay: 1000 },
      { agentId: 'ocm', agentName: 'Communication Agent', icon: '📧', action: 'Leadership Notified', detail: `Escalation email sent to steering committee`, delay: 2500 },
      { agentId: 'planning', agentName: 'Scheduling Agent', icon: '📅', action: 'Review Meeting', detail: `Emergency review scheduled for today 4pm`, delay: 3500 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '📋', action: 'Action Items Created', detail: `Mitigation tasks assigned to leads`, delay: 4500 }
    ]
  }),

  updateForecast: (params) => ({
    id: `forecast-${Date.now()}`,
    trigger: `Update ${params.projectName} Q${params.quarter || '2'} forecast`,
    confirmMessage: `${params.projectName} forecast will be updated with latest actuals and projections.`,
    actions: [
      { agentId: 'finops', agentName: 'Forecast Agent', icon: '📈', action: 'Forecast Updated', detail: `Q${params.quarter || '2'} projection revised based on actuals`, delay: 1000 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '💎', action: 'Value Impact Calculated', detail: `ROI projection adjusted to ${params.newRoi || '58'}%`, delay: 2500 },
      { agentId: 'okr', agentName: 'OKR Agent', icon: '🎯', action: 'OKRs Realigned', detail: `Key results updated to reflect new timeline`, delay: 3500 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '📧', action: 'Stakeholders Updated', detail: `Forecast change notification sent`, delay: 4500 }
    ]
  })
};

let cascadeListeners: ((action: CascadeAction, scenario: ActionScenario) => void)[] = [];

export function addCascadeListener(listener: (action: CascadeAction, scenario: ActionScenario) => void): () => void {
  cascadeListeners.push(listener);
  return () => {
    cascadeListeners = cascadeListeners.filter(l => l !== listener);
  };
}

export async function dispatchAgentCascade(scenario: ActionScenario): Promise<void> {
  for (let i = 0; i < scenario.actions.length; i++) {
    const action = scenario.actions[i];
    const prevDelay = i > 0 ? scenario.actions[i - 1].delay : 0;
    await new Promise(resolve => setTimeout(resolve, action.delay - prevDelay));
    
    toast.success(
      `${action.icon} ${action.agentName}: ${action.action}`,
      {
        description: action.detail,
        duration: 4000,
      }
    );
    
    simulationEngine.pushEvent({
      type: 'action_required',
      priority: i === 0 ? 'critical' : 'high',
      title: `${action.icon} ${action.agentName}: ${action.action}`,
      message: action.detail,
      source: action.agentName,
      detail: `Trigger: ${scenario.trigger}`
    });
    
    notifyAction(action.agentId, 'notify', action.detail);
    
    recordMemory(
      action.agentId,
      'action',
      'cascade',
      scenario.id,
      scenario.trigger,
      `${action.action}: ${action.detail}`,
      0.95
    );
    
    cascadeListeners.forEach(listener => listener(action, scenario));
  }
}

export function parseActionIntent(query: string, pageContext?: { entityName?: string; entityId?: string }): { scenarioType: string; params: Record<string, string> } | null {
  const lowerQuery = query.toLowerCase();
  const contextProjectName = pageContext?.entityName || 'this project';
  const currentBudget = 1.0; // $1M default for demo
  
  // Helper to extract project name or use context
  const getProjectName = (explicitName?: string) => {
    if (explicitName && explicitName.trim() && !['the', 'this', 'project'].includes(explicitName.trim().toLowerCase())) {
      return explicitName.trim();
    }
    return contextProjectName;
  };
  
  // Match budget increase with percentage OR monetary amount (with optional explicit project name)
  const increaseMatch = lowerQuery.match(/(?:increase|raise|add\s+to|boost)\s+(?:(.+?)\s+)?(?:budget|funding)\s+(?:by\s+)?([\d.]+)\s*(m|million|mm|k|thousand|%)?/i);
  if (increaseMatch) {
    const projectName = getProjectName(increaseMatch[1]);
    const amount = parseFloat(increaseMatch[2]);
    const unit = (increaseMatch[3] || '%').toLowerCase();
    
    let percentage: number;
    let newBudget: number;
    
    if (unit === 'm' || unit === 'million' || unit === 'mm') {
      const increaseAmount = amount;
      percentage = (increaseAmount / currentBudget) * 100;
      newBudget = currentBudget + increaseAmount;
    } else if (unit === 'k' || unit === 'thousand') {
      const increaseAmount = amount / 1000;
      percentage = (increaseAmount / currentBudget) * 100;
      newBudget = currentBudget + increaseAmount;
    } else {
      percentage = amount;
      newBudget = currentBudget * (1 + percentage / 100);
    }
    
    return {
      scenarioType: 'increaseBudget',
      params: { 
        projectName, 
        percentage: percentage.toFixed(0), 
        currentBudget: currentBudget.toFixed(1), 
        newBudget: newBudget.toFixed(1)
      }
    };
  }
  
  // Match budget reduction with percentage OR monetary amount
  const reduceMatch = lowerQuery.match(/(?:reduce|cut|decrease|lower)\s+(?:(.+?)\s+)?(?:budget|funding)\s+(?:by\s+)?([\d.]+)\s*(m|million|mm|k|thousand|%)?/i);
  if (reduceMatch) {
    const projectName = getProjectName(reduceMatch[1]);
    const amount = parseFloat(reduceMatch[2]);
    const unit = (reduceMatch[3] || '%').toLowerCase();
    
    let percentage: number;
    let newBudget: number;
    
    if (unit === 'm' || unit === 'million' || unit === 'mm') {
      const reductionAmount = amount;
      percentage = (reductionAmount / currentBudget) * 100;
      newBudget = currentBudget - reductionAmount;
    } else if (unit === 'k' || unit === 'thousand') {
      const reductionAmount = amount / 1000;
      percentage = (reductionAmount / currentBudget) * 100;
      newBudget = currentBudget - reductionAmount;
    } else {
      percentage = amount;
      newBudget = currentBudget * (1 - percentage / 100);
    }
    
    newBudget = Math.max(0, newBudget);
    
    return {
      scenarioType: 'reduceBudget',
      params: { 
        projectName, 
        percentage: percentage.toFixed(0), 
        currentBudget: currentBudget.toFixed(1), 
        newBudget: newBudget.toFixed(1), 
        dependencyCount: '4' 
      }
    };
  }
  
  // Match timeline extension
  const extendMatch = lowerQuery.match(/(?:extend|delay|push\s+back|postpone)\s+(?:(.+?)\s+)?(?:timeline|deadline|end\s+date|by)\s*(?:by\s+)?(\d+)\s*(?:weeks?|months?)/i);
  if (extendMatch) {
    const projectName = getProjectName(extendMatch[1]);
    const weeks = extendMatch[0].includes('month') ? parseInt(extendMatch[2]) * 4 : parseInt(extendMatch[2]);
    return {
      scenarioType: 'extendTimeline',
      params: { 
        projectName, 
        weeks: weeks.toString(),
        dependencyCount: '5',
        additionalCost: '0.3'
      }
    };
  }
  
  // Match priority change
  const priorityMatch = lowerQuery.match(/(?:mark|set|flag|make)\s+(?:(.+?)\s+)?(?:as\s+)?(?:a\s+)?(critical|high|urgent)\s*(?:priority)?/i);
  if (priorityMatch) {
    const projectName = getProjectName(priorityMatch[1]);
    return {
      scenarioType: 'markPriority',
      params: { 
        projectName, 
        priority: priorityMatch[2].toLowerCase()
      }
    };
  }
  
  // Match accelerate with optional project name
  const accelerateMatch = lowerQuery.match(/accelerate\s+(?:(.+?)\s+)?(?:project\s+)?(?:delivery)?$/i);
  if (accelerateMatch) {
    const projectName = getProjectName(accelerateMatch[1]);
    return {
      scenarioType: 'accelerateProject',
      params: { projectName }
    };
  }
  
  // Match pause with optional project name
  const pauseMatch = lowerQuery.match(/pause\s+(?:(.+?)\s+)?(?:project)?$/i);
  if (pauseMatch) {
    const projectName = getProjectName(pauseMatch[1]);
    return {
      scenarioType: 'pauseProject',
      params: { projectName, taskCount: '15' }
    };
  }
  
  // Match add resource with optional project name (supports multi-word roles like "data engineer")
  const resourceMatch = lowerQuery.match(/add\s+(?:a\s+)?(.+?)\s+to\s+(.+?)$/i);
  if (resourceMatch) {
    const projectName = getProjectName(resourceMatch[2]);
    return {
      scenarioType: 'addResource',
      params: { resourceType: resourceMatch[1].trim(), projectName }
    };
  }
  
  // Simpler resource pattern for "add a developer" without explicit target
  const simpleResourceMatch = lowerQuery.match(/add\s+(?:a\s+)?(.+?)$/i);
  if (simpleResourceMatch && !simpleResourceMatch[1].includes('to')) {
    return {
      scenarioType: 'addResource',
      params: { resourceType: simpleResourceMatch[1].trim(), projectName: contextProjectName }
    };
  }
  
  // Match escalate with optional project/risk name (avoid duplicating "risk")
  const escalateMatch = lowerQuery.match(/escalate\s+(?:(.+?)\s+)?(?:to\s+leadership)?$/i);
  if (escalateMatch) {
    let targetName = escalateMatch[1]?.trim() || contextProjectName;
    targetName = targetName.replace(/\s*risk\s*$/i, '').trim() || contextProjectName;
    return {
      scenarioType: 'escalateRisk',
      params: { riskName: `${targetName} risk` }
    };
  }
  
  // Match update forecast
  const forecastMatch = lowerQuery.match(/update\s+(?:(.+?)\s+)?(?:q(\d)\s+)?forecast/i);
  if (forecastMatch) {
    const projectName = getProjectName(forecastMatch[1]);
    return {
      scenarioType: 'updateForecast',
      params: { projectName, quarter: forecastMatch[2] || '2' }
    };
  }
  
  return null;
}

export function buildScenario(scenarioType: string, params: Record<string, string>): ActionScenario | null {
  const template = SCENARIO_TEMPLATES[scenarioType];
  if (!template) return null;
  return template(params);
}
