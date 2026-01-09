import { AgentType } from './dataHub';
import { 
  executeAction, 
  sendAgentMessage, 
  recordThresholdBreach,
  handleBreachWithAgent,
  ActionType
} from './agentActionEngine';
import { EXPANDED_PMO_PROJECTS } from './unifiedMetrics';

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
    responsibleAgent: 'pmo',
    escalateTo: ['vro', 'governance'],
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
    responsibleAgent: 'pmo',
    escalateTo: ['governance', 'vro'],
    checkFn: () => EXPANDED_PMO_PROJECTS.filter(p => p.status === 'red').length
  },
  {
    metricId: 'budget-variance',
    metricName: 'Budget Variance',
    max: 15,
    warningBuffer: 5,
    responsibleAgent: 'finops',
    escalateTo: ['pmo', 'governance'],
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
    escalateTo: ['pmo'],
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
    agentId: 'vro',
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
let isRunning = false;
let lastChecks: Record<string, { value: number; timestamp: Date }> = {};

export function startBackgroundMonitor(intervalMs: number = 10000): void {
  if (isRunning) return;
  
  isRunning = true;
  runMonitorCycle();
  
  monitorInterval = setInterval(runMonitorCycle, intervalMs);
}

export function stopBackgroundMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
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

function triggerBudgetBreachScenario(): void {
  executeAction('finops', 'investigate', 'project', 'proj-001', 'Cloud Migration Phase 2',
    'Budget variance detected: 23% over allocated spend. Analyzing cost drivers.', 92);
  
  setTimeout(() => {
    sendAgentMessage('finops', ['pmo', 'governance'], 'alert',
      'Budget Breach: Cloud Migration Phase 2',
      'Project is 23% over budget due to unexpected infrastructure costs. Recommend scope review.',
      'high', 'proj-001');
  }, 1500);
  
  setTimeout(() => {
    executeAction('pmo', 'escalate', 'project', 'proj-001', 'Cloud Migration Phase 2',
      'Escalating to steering committee. Budget breach exceeds tolerance threshold.', 88,
      'finops');
  }, 3000);
  
  setTimeout(() => {
    executeAction('governance', 'investigate', 'project', 'proj-001', 'Cloud Migration Phase 2',
      'Initiating governance review. Checking approval chain and variance authorization.', 85,
      'pmo');
  }, 4500);
}

function triggerCriticalProjectScenario(): void {
  executeAction('pmo', 'update-status', 'project', 'proj-003', 'Legacy System Decommission',
    'Status changed to CRITICAL. Three consecutive milestones missed.', 95);
  
  setTimeout(() => {
    sendAgentMessage('pmo', ['vro', 'governance', 'tmo'], 'alert',
      'Critical Project Alert: Legacy System Decommission',
      'Project has entered critical status. Immediate intervention required to prevent value leakage.',
      'critical', 'proj-003');
  }, 1000);
  
  setTimeout(() => {
    executeAction('vro', 'investigate', 'project', 'proj-003', 'Legacy System Decommission',
      'Assessing value impact. Estimated £2.3M annual savings at risk.', 90,
      'pmo');
  }, 2500);
  
  setTimeout(() => {
    executeAction('tmo', 'create-task', 'project', 'proj-003', 'Legacy System Decommission',
      'Creating recovery task force. Assigning transformation specialists.', 87,
      'vro');
  }, 4000);
  
  setTimeout(() => {
    executeAction('governance', 'notify', 'project', 'proj-003', 'Legacy System Decommission',
      'Executive stakeholders notified. Scheduling emergency review for tomorrow.', 82,
      'pmo');
  }, 5500);
}

function triggerValueAtRiskScenario(): void {
  executeAction('vro', 'investigate', 'metric', 'value-realized', 'Q4 Value Realization Target',
    'Value realization trending 18% below forecast. Analyzing contributing factors.', 88);
  
  setTimeout(() => {
    sendAgentMessage('vro', ['pmo', 'finops'], 'insight',
      'Value Realization Gap Analysis',
      'Three key projects underperforming: Cloud Migration (-12%), Digital Transformation (-8%), Customer Platform (-6%). Combined impact: £4.2M value gap.',
      'high');
  }, 1500);
  
  setTimeout(() => {
    executeAction('pmo', 'investigate', 'project', 'proj-002', 'Digital Transformation',
      'Investigating delivery blockers. Resource constraints identified as primary factor.', 85,
      'vro');
  }, 3000);
  
  setTimeout(() => {
    executeAction('finops', 'mitigate', 'metric', 'value-realized', 'Q4 Value Realization Target',
      'Proposing budget reallocation from lower-priority initiatives to accelerate key projects.', 82,
      'vro');
  }, 4500);
  
  setTimeout(() => {
    executeAction('vro', 'accelerate', 'project', 'proj-002', 'Digital Transformation',
      'Recommending fast-track approval for additional resources. ROI analysis supports investment.', 90,
      'finops');
  }, 6000);
}

export function getLastChecks(): Record<string, { value: number; timestamp: Date }> {
  return { ...lastChecks };
}
