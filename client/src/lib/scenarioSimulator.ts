import { toast } from 'sonner';
import { notifyAction } from './backgroundAgentMonitor';
import { recordMemory, delegateTask, addTaskToQueue } from './agentOrchestrator';
import type { AgentType } from './dataHub';

export interface SimulatedScenario {
  id: string;
  domain: 'governance' | 'ocm' | 'financial' | 'delivery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  agentId: AgentType;
  agentAction: string;
  impact: string;
  timestamp: Date;
}

export interface ScenarioTemplate {
  domain: 'governance' | 'ocm' | 'financial' | 'delivery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  titleTemplate: string;
  descriptionTemplate: string;
  agentId: AgentType;
  actionTemplate: string;
  impactTemplate: string;
}

const GOVERNANCE_SCENARIOS: ScenarioTemplate[] = [
  {
    domain: 'governance',
    severity: 'high',
    titleTemplate: 'Compliance Review Required',
    descriptionTemplate: 'Project {project} approaching regulatory checkpoint - documentation review needed',
    agentId: 'governance',
    actionTemplate: 'Flagged for compliance review',
    impactTemplate: 'Audit trail updated, review meeting scheduled'
  },
  {
    domain: 'governance',
    severity: 'medium',
    titleTemplate: 'Policy Threshold Alert',
    descriptionTemplate: 'Budget variance on {project} exceeds 10% threshold',
    agentId: 'governance',
    actionTemplate: 'Policy exception logged',
    impactTemplate: 'Escalation to finance committee initiated'
  },
  {
    domain: 'governance',
    severity: 'critical',
    titleTemplate: 'Approval Workflow Triggered',
    descriptionTemplate: '{project} scope change requires executive sign-off',
    agentId: 'governance',
    actionTemplate: 'Approval workflow initiated',
    impactTemplate: 'Steering committee notified'
  }
];

const OCM_SCENARIOS: ScenarioTemplate[] = [
  {
    domain: 'ocm',
    severity: 'medium',
    titleTemplate: 'Stakeholder Impact Detected',
    descriptionTemplate: '{team} team affected by {project} rollout changes',
    agentId: 'ocm',
    actionTemplate: 'Impact assessment completed',
    impactTemplate: 'Communication plan updated, training scheduled'
  },
  {
    domain: 'ocm',
    severity: 'high',
    titleTemplate: 'Change Resistance Indicator',
    descriptionTemplate: 'Adoption metrics below target for {project}',
    agentId: 'ocm',
    actionTemplate: 'Intervention recommended',
    impactTemplate: 'Stakeholder meeting scheduled with leadership'
  },
  {
    domain: 'ocm',
    severity: 'low',
    titleTemplate: 'Training Gap Identified',
    descriptionTemplate: '{count} team members require upskilling for {project}',
    agentId: 'ocm',
    actionTemplate: 'Training request created',
    impactTemplate: 'L&D team notified, sessions being scheduled'
  }
];

const FINANCIAL_SCENARIOS: ScenarioTemplate[] = [
  {
    domain: 'financial',
    severity: 'high',
    titleTemplate: 'Budget Variance Alert',
    descriptionTemplate: '{project} trending {percent}% over budget this quarter',
    agentId: 'finops',
    actionTemplate: 'Forecast updated',
    impactTemplate: 'Finance review scheduled, mitigation options prepared'
  },
  {
    domain: 'financial',
    severity: 'medium',
    titleTemplate: 'Burn Rate Adjustment',
    descriptionTemplate: 'Resource utilization on {project} requires rebalancing',
    agentId: 'finops',
    actionTemplate: 'Burn rate recalculated',
    impactTemplate: 'Resource allocation recommendations generated'
  },
  {
    domain: 'financial',
    severity: 'critical',
    titleTemplate: 'Funding Request Needed',
    descriptionTemplate: '{project} requires additional £{amount}M to complete Phase 2',
    agentId: 'finops',
    actionTemplate: 'Funding request drafted',
    impactTemplate: 'Business case updated, sponsor briefing scheduled'
  }
];

const DELIVERY_SCENARIOS: ScenarioTemplate[] = [
  {
    domain: 'delivery',
    severity: 'high',
    titleTemplate: 'Dependency Blocked',
    descriptionTemplate: '{project} waiting on {dependency} - {days} days overdue',
    agentId: 'tmo',
    actionTemplate: 'Escalation triggered',
    impactTemplate: 'Dependency owner notified, workaround being evaluated'
  },
  {
    domain: 'delivery',
    severity: 'medium',
    titleTemplate: 'Velocity Drop Detected',
    descriptionTemplate: '{team} velocity down {percent}% from baseline',
    agentId: 'tmo',
    actionTemplate: 'Sprint health review initiated',
    impactTemplate: 'Scrum master alerted, impediment review scheduled'
  },
  {
    domain: 'delivery',
    severity: 'low',
    titleTemplate: 'Scope Adjustment Recommended',
    descriptionTemplate: '{project} PI objectives may need reprioritization',
    agentId: 'planning',
    actionTemplate: 'Scope options generated',
    impactTemplate: 'Product owner consultation scheduled'
  }
];

const PROJECT_NAMES = [
  'Trading Platform', 'Customer Portal', 'ESG Analytics', 'Risk Engine',
  'Private Markets', 'Digital Onboarding', 'Claims Automation', 'Workplace App'
];

const TEAM_NAMES = ['Platform', 'Data Engineering', 'Trading', 'Operations', 'Customer Success'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function interpolateTemplate(template: string): string {
  return template
    .replace('{project}', randomChoice(PROJECT_NAMES))
    .replace('{team}', randomChoice(TEAM_NAMES))
    .replace('{dependency}', `${randomChoice(['API Gateway', 'Data Lake', 'Auth Service', 'Payment Gateway'])}`)
    .replace('{days}', String(randomInt(2, 14)))
    .replace('{percent}', String(randomInt(5, 25)))
    .replace('{count}', String(randomInt(3, 12)))
    .replace('{amount}', String((randomInt(5, 20) / 10).toFixed(1)));
}

export function generateRandomScenario(): SimulatedScenario {
  const allScenarios = [...GOVERNANCE_SCENARIOS, ...OCM_SCENARIOS, ...FINANCIAL_SCENARIOS, ...DELIVERY_SCENARIOS];
  const template = randomChoice(allScenarios);
  
  return {
    id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    domain: template.domain,
    severity: template.severity,
    title: interpolateTemplate(template.titleTemplate),
    description: interpolateTemplate(template.descriptionTemplate),
    agentId: template.agentId,
    agentAction: interpolateTemplate(template.actionTemplate),
    impact: interpolateTemplate(template.impactTemplate),
    timestamp: new Date()
  };
}

export function generateDomainScenario(domain: 'governance' | 'ocm' | 'financial' | 'delivery'): SimulatedScenario {
  const scenarios = {
    governance: GOVERNANCE_SCENARIOS,
    ocm: OCM_SCENARIOS,
    financial: FINANCIAL_SCENARIOS,
    delivery: DELIVERY_SCENARIOS
  };
  
  const template = randomChoice(scenarios[domain]);
  
  return {
    id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    domain: template.domain,
    severity: template.severity,
    title: interpolateTemplate(template.titleTemplate),
    description: interpolateTemplate(template.descriptionTemplate),
    agentId: template.agentId,
    agentAction: interpolateTemplate(template.actionTemplate),
    impact: interpolateTemplate(template.impactTemplate),
    timestamp: new Date()
  };
}

const AGENT_ICONS: Record<AgentType, string> = {
  vro: '📊',
  pmo: '📋',
  tmo: '🔧',
  finops: '💰',
  okr: '🎯',
  governance: '🛡️',
  planning: '📅',
  ocm: '👥'
};

const AGENT_NAMES: Record<AgentType, string> = {
  vro: 'Value Agent',
  pmo: 'PMO Agent',
  tmo: 'Delivery Agent',
  finops: 'Finance Agent',
  okr: 'OKR Agent',
  governance: 'Governance Agent',
  planning: 'Planning Agent',
  ocm: 'OCM Agent'
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-blue-600',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  critical: 'text-red-600'
};

let scenarioListeners: ((scenario: SimulatedScenario) => void)[] = [];
let simulationInterval: NodeJS.Timeout | null = null;

export function addScenarioListener(listener: (scenario: SimulatedScenario) => void): () => void {
  scenarioListeners.push(listener);
  return () => {
    scenarioListeners = scenarioListeners.filter(l => l !== listener);
  };
}

export function triggerScenario(scenario: SimulatedScenario): void {
  const icon = AGENT_ICONS[scenario.agentId];
  const agentName = AGENT_NAMES[scenario.agentId];
  
  toast.info(
    `${icon} ${agentName}: ${scenario.title}`,
    {
      description: scenario.agentAction,
      duration: 5000,
    }
  );
  
  notifyAction(scenario.agentId, 'notify', scenario.title);
  
  recordMemory(
    scenario.agentId,
    'insight',
    scenario.domain,
    scenario.id,
    scenario.title,
    `${scenario.description}. Action: ${scenario.agentAction}. Impact: ${scenario.impact}`,
    scenario.severity === 'critical' ? 0.95 : scenario.severity === 'high' ? 0.85 : 0.75
  );
  
  scenarioListeners.forEach(listener => listener(scenario));
}

export function startScenarioSimulation(intervalMs: number = 180000): () => void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  
  const randomInterval = () => intervalMs + (Math.random() * intervalMs * 0.5);
  
  const runSimulation = () => {
    const scenario = generateRandomScenario();
    triggerScenario(scenario);
    
    simulationInterval = setTimeout(runSimulation, randomInterval());
  };
  
  simulationInterval = setTimeout(runSimulation, randomInterval());
  
  return () => {
    if (simulationInterval) {
      clearTimeout(simulationInterval);
      simulationInterval = null;
    }
  };
}

export function stopScenarioSimulation(): void {
  if (simulationInterval) {
    clearTimeout(simulationInterval);
    simulationInterval = null;
  }
}
