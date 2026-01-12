import { toast } from 'sonner';
import { notifyAction } from './backgroundAgentMonitor';
import { recordMemory } from './agentOrchestrator';
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
    confirmMessage: `Budget for ${params.projectName} will be reduced from £${params.currentBudget}M to £${params.newBudget}M. This may impact timeline and scope.`,
    actions: [
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💰', action: 'Budget Updated', detail: `${params.projectName} budget reduced by ${params.percentage}%`, delay: 1000 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '🎛️', action: 'PM Notified', detail: `Project Manager alerted to budget change`, delay: 2000 },
      { agentId: 'tmo', agentName: 'Dependency Agent', icon: '🔗', action: 'Dependencies Updated', detail: `${params.dependencyCount || 3} linked work items recalculated`, delay: 3500 },
      { agentId: 'integrated-management', agentName: 'Integrated Management', icon: '📊', action: 'Projections Recalculated', detail: `Q2 value forecast updated to reflect changes`, delay: 4500 },
      { agentId: 'planning', agentName: 'Scheduling Agent', icon: '📅', action: 'Meeting Scheduled', detail: `Team sync scheduled for tomorrow 2pm`, delay: 5500 },
      { agentId: 'governance', agentName: 'Risk Agent', icon: '⚠️', action: 'Risk Assessment', detail: `Potential scope impact flagged for review`, delay: 6500 }
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
      { agentId: 'finops', agentName: 'Finance Agent', icon: '💷', action: 'Budget Updated', detail: `Resource cost added to project forecast`, delay: 2000 },
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
  for (const action of scenario.actions) {
    await new Promise(resolve => setTimeout(resolve, action.delay - (scenario.actions.indexOf(action) > 0 ? scenario.actions[scenario.actions.indexOf(action) - 1].delay : 0)));
    
    toast.success(
      `${action.icon} ${action.agentName}: ${action.action}`,
      {
        description: action.detail,
        duration: 4000,
      }
    );
    
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

export function parseActionIntent(query: string): { scenarioType: string; params: Record<string, string> } | null {
  const lowerQuery = query.toLowerCase();
  
  // Match budget reduction with percentage OR monetary amount (1M, 1 million, 500k, etc.)
  const budgetMatch = lowerQuery.match(/reduce\s+(?:this\s+)?(?:project['s]*\s+)?(.+?)\s+budget\s+by\s+([\d.]+)\s*(m|million|mm|k|thousand|%)?/i);
  if (budgetMatch) {
    const projectName = budgetMatch[1].trim();
    const amount = parseFloat(budgetMatch[2]);
    const unit = (budgetMatch[3] || '%').toLowerCase();
    const currentBudget = 5.0; // £5M default
    
    let percentage: number;
    let newBudget: number;
    
    // Determine if this is a monetary amount or percentage
    if (unit === 'm' || unit === 'million' || unit === 'mm') {
      // Monetary amount in millions - convert to percentage of current budget
      const reductionAmount = amount; // Already in millions
      percentage = (reductionAmount / currentBudget) * 100;
      newBudget = currentBudget - reductionAmount;
    } else if (unit === 'k' || unit === 'thousand') {
      // Monetary amount in thousands - convert to millions then percentage
      const reductionAmount = amount / 1000;
      percentage = (reductionAmount / currentBudget) * 100;
      newBudget = currentBudget - reductionAmount;
    } else {
      // Percentage
      percentage = amount;
      newBudget = currentBudget * (1 - percentage / 100);
    }
    
    // Ensure new budget doesn't go negative
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
  
  const accelerateMatch = lowerQuery.match(/accelerate\s+(?:project\s+)?(.+?)(?:\s+delivery)?$/i);
  if (accelerateMatch) {
    return {
      scenarioType: 'accelerateProject',
      params: { projectName: accelerateMatch[1].trim() }
    };
  }
  
  const pauseMatch = lowerQuery.match(/pause\s+(?:project\s+)?(.+?)$/i);
  if (pauseMatch) {
    return {
      scenarioType: 'pauseProject',
      params: { projectName: pauseMatch[1].trim(), taskCount: '15' }
    };
  }
  
  const resourceMatch = lowerQuery.match(/add\s+(?:a\s+)?(\w+)\s+to\s+(?:project\s+)?(.+?)$/i);
  if (resourceMatch) {
    return {
      scenarioType: 'addResource',
      params: { resourceType: resourceMatch[1].trim(), projectName: resourceMatch[2].trim() }
    };
  }
  
  const escalateMatch = lowerQuery.match(/escalate\s+(.+?)\s+(?:to\s+leadership|risk)?/i);
  if (escalateMatch) {
    return {
      scenarioType: 'escalateRisk',
      params: { riskName: escalateMatch[1].trim() }
    };
  }
  
  const forecastMatch = lowerQuery.match(/update\s+(?:project\s+)?(.+?)\s+(?:q(\d)\s+)?forecast/i);
  if (forecastMatch) {
    return {
      scenarioType: 'updateForecast',
      params: { projectName: forecastMatch[1].trim(), quarter: forecastMatch[2] || '2' }
    };
  }
  
  return null;
}

export function buildScenario(scenarioType: string, params: Record<string, string>): ActionScenario | null {
  const template = SCENARIO_TEMPLATES[scenarioType];
  if (!template) return null;
  return template(params);
}
