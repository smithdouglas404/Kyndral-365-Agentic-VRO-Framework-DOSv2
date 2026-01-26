import { AgentType } from './dataHub';
import { 
  executeAction, 
  sendAgentMessage, 
  recordThresholdBreach,
  handleBreachWithAgent,
  ActionType
} from './agentActionEngine';
import { EXPANDED_PMO_PROJECTS } from './unifiedMetrics';
import { 
  createAgentIntervention, 
  startAgentDiscussion, 
  continueDiscussion 
} from './agentPersistence';

interface ThresholdConfig {
  metricId: string;
  metricName: string;
  min?: number;
  max?: number;
  warningBuffer: number;
  responsibleAgent: AgentType;
  escalateTo: AgentType[];
  checkFn: () => number;
}

const THRESHOLDS: ThresholdConfig[] = [
  {
    metricId: 'at-risk-ratio',
    metricName: 'At-Risk Project Ratio',
    max: 25,
    warningBuffer: 5,
    responsibleAgent: 'integrated-management',
    escalateTo: ['governance'],
    checkFn: () => {
      const atRisk = EXPANDED_PMO_PROJECTS.filter(p => p.status === 'red' || p.status === 'amber').length;
      return (atRisk / EXPANDED_PMO_PROJECTS.length) * 100;
    }
  },
  {
    metricId: 'critical-projects',
    metricName: 'Critical Status Projects',
    max: 3,
    warningBuffer: 1,
    responsibleAgent: 'integrated-management',
    escalateTo: ['governance'],
    checkFn: () => EXPANDED_PMO_PROJECTS.filter(p => p.status === 'red').length
  },
  {
    metricId: 'budget-variance',
    metricName: 'Budget Variance',
    max: 15,
    warningBuffer: 5,
    responsibleAgent: 'finops',
    escalateTo: ['integrated-management', 'governance'],
    checkFn: () => {
      const overBudget = EXPANDED_PMO_PROJECTS.filter(p => (p.budget?.spent || 0) > (p.budget?.total || 1) * 1.1);
      return (overBudget.length / EXPANDED_PMO_PROJECTS.length) * 100;
    }
  },
  {
    metricId: 'delivery-velocity',
    metricName: 'Delivery Velocity',
    min: 70,
    warningBuffer: 10,
    responsibleAgent: 'tmo',
    escalateTo: ['integrated-management'],
    checkFn: () => {
      const avgProgress = EXPANDED_PMO_PROJECTS.reduce((sum, p) => 
        sum + (p.deliverables.completed / p.deliverables.total) * 100, 0) / EXPANDED_PMO_PROJECTS.length;
      return avgProgress;
    }
  }
];

interface AgentReaction {
  triggerId: string;
  agentId: AgentType;
  condition: (currentValue: number, threshold: number) => boolean;
  actionType: ActionType;
  generateReasoning: (metricName: string, currentValue: number, threshold: number) => string;
}

const AGENT_REACTIONS: AgentReaction[] = [
  {
    triggerId: 'at-risk-ratio',
    agentId: 'governance',
    condition: (current, threshold) => current > threshold,
    actionType: 'investigate',
    generateReasoning: (name, current, threshold) => 
      `Governance review triggered: ${name} at ${current.toFixed(1)}% exceeds ${threshold}% threshold. Initiating compliance assessment.`
  },
  {
    triggerId: 'critical-projects',
    agentId: 'integrated-management',
    condition: (current, threshold) => current > threshold,
    actionType: 'escalate',
    generateReasoning: (name, current, threshold) => 
      `Value at risk: ${current} critical projects detected (threshold: ${threshold}). Escalating for executive review.`
  },
  {
    triggerId: 'budget-variance',
    agentId: 'governance',
    condition: (current, threshold) => current > threshold,
    actionType: 'notify',
    generateReasoning: (name, current, threshold) => 
      `Budget compliance alert: ${current.toFixed(1)}% of projects over budget. Notifying stakeholders.`
  }
];

let monitorInterval: NodeJS.Timeout | null = null;
let scenarioInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let lastChecks: Record<string, { value: number; timestamp: Date }> = {};
let actionNotificationCallback: ((agentName: string, action: string, target: string, severity: 'critical' | 'warning' | 'info') => void) | null = null;

// Map action types to severity levels
const ACTION_SEVERITY: Record<string, 'critical' | 'warning' | 'info'> = {
  'escalate': 'critical',
  'investigate': 'critical',
  'mitigate': 'critical',
  'notify': 'warning',
  'update-status': 'info',
  'create-task': 'info',
  'reassign': 'info',
  'accelerate': 'warning'
};

const DEMO_SCENARIOS = ['budget-breach', 'critical-project', 'value-at-risk'];
const AGENT_DISPLAY_NAMES: Record<AgentType, string> = {
  'integrated-management': 'Integrated Management Agent',
  tmo: 'TMO Agent',
  finops: 'FinOps Agent',
  okr: 'OKR Agent',
  governance: 'Governance Agent',
  planning: 'Planning Agent',
  ocm: 'OCM Agent'
};

const ACTION_DISPLAY_NAMES: Record<string, string> = {
  'investigate': 'investigated',
  'escalate': 'escalated',
  'notify': 'notified stakeholders about',
  'mitigate': 'initiated mitigation for',
  'accelerate': 'accelerated',
  'update-status': 'updated status of',
  'create-task': 'created task for',
  'reassign': 'reassigned'
};

export function setActionNotificationCallback(
  callback: (agentName: string, action: string, target: string, severity: 'critical' | 'warning' | 'info') => void
): void {
  actionNotificationCallback = callback;
}

export function notifyAction(agentId: AgentType, actionType: string, targetName: string): void {
  if (actionNotificationCallback) {
    const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId;
    const actionText = ACTION_DISPLAY_NAMES[actionType] || actionType;
    const severity = ACTION_SEVERITY[actionType] || 'info';
    actionNotificationCallback(agentName, actionText, targetName, severity);
  }
}

function getRandomInterval(): number {
  const minMs = 2 * 60 * 1000;  // 2 minutes
  const maxMs = 4 * 60 * 1000;  // 4 minutes
  return minMs + Math.random() * (maxMs - minMs);
}

function scheduleNextScenario(): void {
  if (!isRunning) return;
  
  const delay = getRandomInterval();
  scenarioInterval = setTimeout(() => {
    if (!isRunning) return;
    
    const randomScenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
    triggerDemoScenario(randomScenario);
    
    scheduleNextScenario();
  }, delay);
}

export function startBackgroundMonitor(intervalMs: number = 10000): void {
  if (isRunning) return;
  
  isRunning = true;
  runMonitorCycle();
  
  monitorInterval = setInterval(runMonitorCycle, intervalMs);
  
  scheduleNextScenario();
}

export function stopBackgroundMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  if (scenarioInterval) {
    clearTimeout(scenarioInterval);
    scenarioInterval = null;
  }
  isRunning = false;
}

export function isMonitorRunning(): boolean {
  return isRunning;
}

function runMonitorCycle(): void {
  THRESHOLDS.forEach(config => {
    const currentValue = config.checkFn();
    const previousCheck = lastChecks[config.metricId];
    
    lastChecks[config.metricId] = { value: currentValue, timestamp: new Date() };
    
    let breachDetected = false;
    let severity: 'warning' | 'critical' = 'warning';
    let thresholdValue = 0;
    let thresholdType: 'min' | 'max' = 'max';
    
    if (config.max !== undefined) {
      thresholdValue = config.max;
      if (currentValue > config.max) {
        breachDetected = true;
        severity = 'critical';
      } else if (currentValue > config.max - config.warningBuffer) {
        breachDetected = true;
        severity = 'warning';
      }
    }
    
    if (config.min !== undefined) {
      thresholdValue = config.min;
      thresholdType = 'min';
      if (currentValue < config.min) {
        breachDetected = true;
        severity = 'critical';
      } else if (currentValue < config.min + config.warningBuffer) {
        breachDetected = true;
        severity = 'warning';
      }
    }
    
    if (breachDetected) {
      if (!previousCheck || Math.abs(previousCheck.value - currentValue) > 0.5) {
        const breach = recordThresholdBreach(
          config.metricId,
          config.metricName,
          currentValue,
          thresholdValue,
          thresholdType,
          severity
        );
        
        const actionType: ActionType = severity === 'critical' ? 'escalate' : 'investigate';
        const reasoning = `${config.metricName} ${thresholdType === 'max' ? 'exceeded' : 'fell below'} threshold: ` +
          `Current ${currentValue.toFixed(1)} vs ${thresholdType === 'max' ? 'max' : 'min'} ${thresholdValue}`;
        
        executeAction(
          config.responsibleAgent,
          actionType,
          'metric',
          config.metricId,
          config.metricName,
          reasoning,
          severity === 'critical' ? 95 : 80
        );
        
        handleBreachWithAgent(breach.id, config.responsibleAgent, actionType, config.escalateTo);
        
        if (severity === 'critical') {
          config.escalateTo.forEach(agentId => {
            sendAgentMessage(
              config.responsibleAgent,
              [agentId],
              'alert',
              `${severity.toUpperCase()}: ${config.metricName}`,
              reasoning,
              'critical',
              config.metricId
            );
          });
        }
        
        triggerAgentReactions(config.metricId, currentValue, thresholdValue);
      }
    }
  });
}

function triggerAgentReactions(triggerId: string, currentValue: number, threshold: number): void {
  AGENT_REACTIONS
    .filter(r => r.triggerId === triggerId && r.condition(currentValue, threshold))
    .forEach(reaction => {
      const thresholdConfig = THRESHOLDS.find(t => t.metricId === triggerId);
      if (!thresholdConfig) return;
      
      setTimeout(() => {
        const reasoning = reaction.generateReasoning(thresholdConfig.metricName, currentValue, threshold);
        
        executeAction(
          reaction.agentId,
          reaction.actionType,
          'metric',
          triggerId,
          thresholdConfig.metricName,
          reasoning,
          85,
          thresholdConfig.responsibleAgent
        );
      }, 1000 + Math.random() * 2000);
    });
}

export function triggerDemoScenario(scenarioId: string): void {
  switch (scenarioId) {
    case 'budget-breach':
      triggerBudgetBreachScenario();
      break;
    case 'critical-project':
      triggerCriticalProjectScenario();
      break;
    case 'value-at-risk':
      triggerValueAtRiskScenario();
      break;
    default:
      console.warn(`Unknown scenario: ${scenarioId}`);
  }
}

async function triggerBudgetBreachScenario(): Promise<void> {
  executeAction('finops', 'investigate', 'project', 'nee-fpl-001', 'Regional Utility Grid Modernization',
    'Budget variance detected: 23% over allocated spend. Analyzing cost drivers.', 92);
  notifyAction('finops', 'investigate', 'Regional Utility Grid Modernization');
  
  // Persist intervention to database
  await createAgentIntervention(
    'finops',
    'budget',
    'high',
    'Regional Utility Grid Modernization Budget Overrun',
    'Budget variance detected: 23% over allocated spend due to unexpected SCADA integration costs.',
    'nee-fpl-001',
    'Regional Utility Grid Modernization',
    'Conduct scope review and reallocate $2M from contingency reserve.',
    'Without intervention, project NPV decreases by $8M.',
    92
  );
  
  // Start agent discussion
  const discussionResult = await startAgentDiscussion(
    'Regional Utility Grid Modernization Budget Breach Analysis',
    'nee-fpl-001',
    'Regional Utility Grid Modernization',
    'high',
    'finops',
    'Budget variance detected: 23% over allocated spend. SCADA integration costs exceeded estimates. Recommend immediate scope review.'
  );
  
  setTimeout(() => {
    sendAgentMessage('finops', ['integrated-management', 'governance'], 'alert',
      'Budget Breach: Regional Utility Grid Modernization',
      'Project is 23% over budget due to unexpected SCADA costs. Recommend scope review.',
      'high', 'nee-fpl-001');
    
    if (discussionResult) {
      continueDiscussion(discussionResult.discussion.id, 'governance', 
        'Acknowledged. This exceeds our 15% variance threshold. Will need Board notification per NERC compliance.', 
        'agreement');
    }
  }, 1500);
  
  setTimeout(() => {
    executeAction('integrated-management', 'escalate', 'project', 'nee-fpl-001', 'Regional Utility Grid Modernization',
      'Escalating to steering committee. Budget breach exceeds tolerance threshold.', 88,
      'finops');
    notifyAction('integrated-management', 'escalate', 'Regional Utility Grid Modernization');
    
    if (discussionResult) {
      continueDiscussion(discussionResult.discussion.id, 'integrated-management', 
        'Escalating to steering committee. Recommending fast-track approval for contingency release.', 
        'action');
    }
  }, 3000);
  
  setTimeout(() => {
    executeAction('governance', 'investigate', 'project', 'nee-fpl-001', 'Regional Utility Grid Modernization',
      'Initiating governance review. Checking approval chain and variance authorization.', 85,
      'integrated-management');
    notifyAction('governance', 'investigate', 'Regional Utility Grid Modernization');
  }, 4500);
}

async function triggerCriticalProjectScenario(): Promise<void> {
  executeAction('integrated-management', 'update-status', 'project', 'nee-fpl-004', 'Regional Utility Storm Hardening',
    'Status changed to CRITICAL. Three consecutive milestones missed.', 95);
  notifyAction('integrated-management', 'update-status', 'Regional Utility Storm Hardening');
  
  // Persist critical intervention
  await createAgentIntervention(
    'integrated-management',
    'timeline',
    'critical',
    'Regional Utility Storm Hardening Critical Status',
    'Project has entered critical status. Three consecutive milestones missed before hurricane season. Immediate intervention required.',
    'nee-fpl-004',
    'Regional Utility Storm Hardening',
    'Deploy recovery task force and add weekend construction crews. Schedule emergency steering committee review.',
    'Hurricane season deadline at risk if not addressed within 2 weeks.',
    95
  );
  
  setTimeout(() => {
    sendAgentMessage('integrated-management', ['integrated-management', 'governance', 'tmo'], 'alert',
      'Critical Project Alert: Regional Utility Storm Hardening',
      'Project has entered critical status. Immediate intervention required before hurricane season.',
      'critical', 'nee-fpl-004');
  }, 1000);
  
  setTimeout(() => {
    executeAction('integrated-management', 'investigate', 'project', 'nee-fpl-004', 'Regional Utility Storm Hardening',
      'Assessing impact. Hurricane season deadline at risk.', 90,
      'integrated-management');
    notifyAction('integrated-management', 'investigate', 'Regional Utility Storm Hardening');
  }, 2500);
  
  setTimeout(() => {
    executeAction('tmo', 'create-task', 'project', 'nee-fpl-004', 'Regional Utility Storm Hardening',
      'Creating recovery task force. Adding weekend construction crews.', 87,
      'integrated-management');
    notifyAction('tmo', 'create-task', 'Regional Utility Storm Hardening');
  }, 4000);
  
  setTimeout(() => {
    executeAction('governance', 'notify', 'project', 'nee-fpl-004', 'Regional Utility Storm Hardening',
      'Executive stakeholders notified. Scheduling emergency review for tomorrow.', 82,
      'integrated-management');
    notifyAction('governance', 'notify', 'Regional Utility Storm Hardening');
  }, 5500);
}

async function triggerValueAtRiskScenario(): Promise<void> {
  executeAction('integrated-management', 'investigate', 'metric', 'value-realized', 'Q4 Value Realization Target',
    'Value realization trending 18% below forecast. Analyzing contributing factors.', 88);
  notifyAction('integrated-management', 'investigate', 'Q4 Value Realization Target');
  
  // Persist value intervention
  await createAgentIntervention(
    'integrated-management',
    'quality',
    'high',
    'Q4 Value Realization Gap Detected',
    'Value realization trending 18% below forecast. Three key projects underperforming with combined impact of $42M value gap.',
    'portfolio-q4',
    'Q4 Portfolio Performance',
    'Reallocate budget from lower-priority initiatives and accelerate high-value projects.',
    'Without intervention, Q4 value realization target will be missed by $42M.',
    88
  );
  
  // Start multi-agent discussion
  const discussionResult = await startAgentDiscussion(
    'Q4 Value Realization Gap Analysis',
    'portfolio-q4',
    'Q4 Portfolio Performance',
    'high',
    'integrated-management',
    'Value realization trending 18% below forecast. Three key projects underperforming: Renewables Division Wind Portfolio (-12%), Regional Utility Grid Modernization (-8%), Google Data Center (-6%). Combined impact: $42M value gap.'
  );
  
  setTimeout(() => {
    sendAgentMessage('integrated-management', ['integrated-management', 'finops'], 'insight',
      'Value Realization Gap Analysis',
      'Three key projects underperforming: Renewables Division Wind Portfolio (-12%), Regional Utility Grid Modernization (-8%), Google Data Center (-6%). Combined impact: $42M value gap.',
      'high');
    
    if (discussionResult) {
      continueDiscussion(discussionResult.discussion.id, 'finops', 
        'Analyzing budget reallocation options. We have $12M in uncommitted contingency that could be redirected.', 
        'analysis');
    }
  }, 1500);
  
  setTimeout(() => {
    executeAction('integrated-management', 'investigate', 'project', 'nee-neer-001', 'Renewables Division Wind Portfolio',
      'Investigating delivery blockers. Vestas turbine delivery delays identified as primary factor.', 85,
      'integrated-management');
    notifyAction('integrated-management', 'investigate', 'Renewables Division Wind Portfolio');
    
    if (discussionResult) {
      continueDiscussion(discussionResult.discussion.id, 'tmo', 
        'Supply chain constraints confirmed. Renewables Division Wind team needs alternative turbine vendor evaluation.', 
        'analysis');
    }
  }, 3000);
  
  setTimeout(() => {
    executeAction('finops', 'mitigate', 'metric', 'value-realized', 'Q4 Value Realization Target',
      'Proposing budget reallocation from lower-priority initiatives to accelerate key projects.', 82,
      'integrated-management');
    notifyAction('finops', 'mitigate', 'Q4 Value Realization Target');
    
    if (discussionResult) {
      continueDiscussion(discussionResult.discussion.id, 'finops', 
        'Recommending immediate reallocation of $8M to accelerate Renewables Division Wind Portfolio. ROI analysis supports this investment.', 
        'recommendation');
    }
  }, 4500);
  
  setTimeout(() => {
    executeAction('integrated-management', 'accelerate', 'project', 'nee-neer-001', 'Renewables Division Wind Portfolio',
      'Recommending fast-track approval for additional resources. ROI analysis supports investment.', 90,
      'finops');
    notifyAction('integrated-management', 'accelerate', 'Renewables Division Wind Portfolio');
    
    if (discussionResult) {
      continueDiscussion(discussionResult.discussion.id, 'integrated-management', 
        'Creating intervention for executive approval. Fast-track resource allocation recommended.', 
        'action');
    }
  }, 6000);
}

export function getLastChecks(): Record<string, { value: number; timestamp: Date }> {
  return { ...lastChecks };
}
