import { storage } from "./storage";
import type { InsertAgentActivityLog, InsertIntervention } from "@shared/schema";

const AGENTS = [
  { id: 'finops', name: 'FinOps Agent', focus: 'budget, cost, CPI, spending, financial', autonomy: 'full' },
  { id: 'tmo', name: 'TMO Agent', focus: 'schedule, timeline, SPI, velocity, sprints', autonomy: 'full' },
  { id: 'governance', name: 'Governance Agent', focus: 'compliance, approvals, escalations, policies', autonomy: 'supervised' },
  { id: 'planning', name: 'Planning Agent', focus: 'dependencies, roadmap, capacity, resources', autonomy: 'supervised' },
  { id: 'ocm', name: 'OCM Agent', focus: 'change management, adoption, training, communication', autonomy: 'full' },
  { id: 'integrated', name: 'Integrated Management Agent', focus: 'quality, testing, defects, coverage', autonomy: 'full' },
  { id: 'risk', name: 'Risk Agent', focus: 'risks, mitigation, contingency, threats', autonomy: 'supervised' },
];

const PROJECTS = [
  'Enterprise Data Platform',
  'Climate Analytics Platform', 
  'Customer 360 Platform',
  'Digital Transformation Program',
  'Regulatory Compliance Suite',
  'API Gateway Modernization',
  'Cloud Migration Phase 2',
];

const WORKFLOW_TEMPLATES = {
  scan: [
    '{agent} initiated portfolio scan across {count} projects...',
    '{agent} analyzing {metric} trends for {project}...',
    '{agent} reviewing {count} open items in backlog...',
    '{agent} checking threshold compliance for {project}...',
    '{agent} processing latest sprint data from {project}...',
  ],
  detection: [
    '{agent} detected {metric} anomaly in {project}',
    '{agent} flagged potential {issue} in {project}',
    '{agent} identified {count} items requiring attention',
    '{agent} found variance in {metric} for {project}',
  ],
  request: [
    '{agent} requesting approval from {target} for {action}',
    '{agent} sent escalation to {target}: {issue}',
    '{agent} awaiting response from {target} on {action}',
    '{agent} submitted {action} request to {target}',
  ],
  waiting: [
    '{agent} waiting for {target} to complete {action}...',
    '{agent} pending approval from {target}',
    '{agent} holding for dependency resolution from {target}',
    '{agent} queued behind {target} review cycle',
  ],
  received: [
    '{agent} received confirmation from {target}',
    '{agent} got approval from {target} for {action}',
    '{agent} acknowledged response from {target}',
    '{agent} processed input from {target}',
  ],
  approved: [
    '{agent} approved {action} for {project}',
    '{agent} authorized {action} - proceeding to execution',
    '{agent} cleared {action} request from {source}',
    '{agent} signed off on {action}',
  ],
  alert: [
    'Alert sent to {target}: {issue}',
    '{agent} notified {target} of {issue}',
    'Cross-team alert: {agent} → {target} regarding {issue}',
    '{agent} triggered {target} notification for {project}',
  ],
  action: [
    '{agent} executing {action} for {project}',
    '{agent} initiated automated {action}',
    '{agent} applied {action} to {project}',
    '{agent} completed {action} autonomously',
  ],
};

const METRICS = ['CPI', 'SPI', 'velocity', 'test coverage', 'defect rate', 'resource utilization', 'burn rate'];
const ISSUES = ['budget variance', 'schedule slip', 'resource conflict', 'dependency blocker', 'quality gate failure', 'compliance gap'];
const ACTIONS = ['cost reallocation', 'schedule recovery', 'resource assignment', 'dependency resolution', 'risk mitigation', 'change request', 'sprint adjustment'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(template: string): { message: string; primaryAgent: typeof AGENTS[0]; secondaryAgent?: typeof AGENTS[0] } {
  const primaryAgent = pickRandom(AGENTS);
  let secondaryAgent: typeof AGENTS[0] | undefined;
  
  if (template.includes('{target}') || template.includes('{source}')) {
    secondaryAgent = pickRandom(AGENTS.filter(a => a.id !== primaryAgent.id));
  }

  let message = template
    .replace('{agent}', primaryAgent.name)
    .replace('{target}', secondaryAgent?.name || 'System')
    .replace('{source}', secondaryAgent?.name || 'System')
    .replace('{project}', pickRandom(PROJECTS))
    .replace('{metric}', pickRandom(METRICS))
    .replace('{issue}', pickRandom(ISSUES))
    .replace('{action}', pickRandom(ACTIONS))
    .replace('{count}', String(Math.floor(Math.random() * 20) + 3));

  return { message, primaryAgent, secondaryAgent };
}

function generateWorkflowActivity(): InsertAgentActivityLog {
  const workflowTypes = Object.keys(WORKFLOW_TEMPLATES) as (keyof typeof WORKFLOW_TEMPLATES)[];
  const workflowType = pickRandom(workflowTypes);
  const templates = WORKFLOW_TEMPLATES[workflowType];
  const template = pickRandom(templates);
  
  const { message, primaryAgent, secondaryAgent } = generateMessage(template);
  
  let eventType: 'detection' | 'autonomous_action' | 'agent_to_agent' | 'approval_executed';
  
  if (workflowType === 'scan' || workflowType === 'detection') {
    eventType = 'detection';
  } else if (workflowType === 'request' || workflowType === 'waiting' || workflowType === 'received' || workflowType === 'alert') {
    eventType = 'agent_to_agent';
  } else if (workflowType === 'approved') {
    eventType = 'approval_executed';
  } else {
    eventType = 'autonomous_action';
  }

  return {
    eventType,
    primaryAgentId: primaryAgent.id,
    primaryAgentName: primaryAgent.name,
    secondaryAgentId: secondaryAgent?.id,
    secondaryAgentName: secondaryAgent?.name,
    summary: message,
  };
}

const INTERVENTION_TYPES: string[] = ['budget', 'timeline', 'resource', 'quality', 'dependency'];
const SELF_APPROVED_ACTIONS = [
  { action: 'Optimized cloud resource allocation', impact: 'Reduced monthly costs by 12%' },
  { action: 'Rebalanced sprint capacity across teams', impact: 'Prevented 2-day delay on critical path' },
  { action: 'Automated test coverage expansion', impact: 'Increased coverage from 68% to 82%' },
  { action: 'Consolidated redundant meetings', impact: 'Recovered 6 hours/week team time' },
  { action: 'Applied automated dependency resolution', impact: 'Unblocked 3 downstream teams' },
  { action: 'Initiated proactive risk mitigation', impact: 'Reduced risk exposure by 25%' },
];

let simulationInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let selfApprovedCounter = 0;

async function maybeCreateSelfApprovedIntervention(): Promise<void> {
  selfApprovedCounter++;
  if (selfApprovedCounter % 5 !== 0) return; // Create one every 5 cycles (every minute)
  
  const fullAutonomyAgents = AGENTS.filter(a => a.autonomy === 'full');
  const agent = pickRandom(fullAutonomyAgents);
  const project = pickRandom(PROJECTS);
  const actionTemplate = pickRandom(SELF_APPROVED_ACTIONS);
  const interventionType = pickRandom(INTERVENTION_TYPES);
  
  const intervention: InsertIntervention = {
    type: interventionType,
    severity: 'low',
    title: `[Agent Self Approved] ${actionTemplate.action}`,
    description: `${agent.name} autonomously executed this action based on continuous monitoring.`,
    projectId: `proj-${project.toLowerCase().replace(/\s+/g, '-')}`,
    projectName: project,
    confidence: String((0.88 + Math.random() * 0.1).toFixed(2)),
    suggestedAction: actionTemplate.action,
    impact: actionTemplate.impact,
    status: 'approved',
    agentSource: agent.name,
    isAutonomous: 'true',
    selfApproved: 'true',
    triggerSource: 'agent_detection',
    approvedBy: `${agent.name} (Autonomous)`
  };
  
  try {
    await storage.createIntervention(intervention);
    console.log(`[AgentSimulation] Created self-approved action: ${agent.name} - ${actionTemplate.action}`);
  } catch (error) {
    console.error('[AgentSimulation] Error creating self-approved intervention:', error);
  }
}

export async function startAgentSimulation(intervalMs: number = 12000): Promise<void> {
  if (isRunning) {
    console.log('[AgentSimulation] Already running');
    return;
  }

  isRunning = true;
  console.log(`[AgentSimulation] Starting continuous simulation (interval: ${intervalMs}ms)`);

  const generateActivity = async () => {
    try {
      const activity = generateWorkflowActivity();
      await storage.createAgentActivityLog(activity);
      console.log(`[AgentSimulation] Generated: ${activity.summary}`);
      
      // Occasionally create a self-approved intervention
      await maybeCreateSelfApprovedIntervention();
    } catch (error) {
      console.error('[AgentSimulation] Error generating activity:', error);
    }
  };

  await generateActivity();
  
  simulationInterval = setInterval(generateActivity, intervalMs);
}

export function stopAgentSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    isRunning = false;
    console.log('[AgentSimulation] Stopped');
  }
}

export function isSimulationRunning(): boolean {
  return isRunning;
}
