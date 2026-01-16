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
  'FPL Grid Modernization & Automation',
  'FPL Advanced Metering Infrastructure 2.0', 
  'FPL SolarTogether Phase III',
  'FPL Storm Protection Plan',
  'NEER Wind Portfolio Expansion',
  'NEER Battery Energy Storage Systems',
  'NextEra Cybersecurity Enhancement',
  'Google Data Center Partnership',
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
  // Positive communications and celebrations
  celebration: [
    '{agent} sent milestone celebration to team: {project} on track!',
    '{agent} recognized team achievement in {project}',
    '{agent} shared success story from {project} with stakeholders',
    '{agent} announced early delivery forecast for {project}',
  ],
  communication: [
    '{agent} scheduled alignment meeting with {target}',
    '{agent} prepared executive summary for {project}',
    '{agent} shared best practices with {target}',
    '{agent} coordinated retrospective for {project}',
    '{agent} distributed weekly progress report',
  ],
  optimization: [
    '{agent} optimized resource allocation for {project}',
    '{agent} automated {count} routine tasks',
    '{agent} streamlined workflow between teams',
    '{agent} improved {metric} by consolidating processes',
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
  // Optimizations
  { action: 'Optimized cloud resource allocation', impact: 'Reduced monthly costs by 12%' },
  { action: 'Rebalanced sprint capacity across teams', impact: 'Prevented 2-day delay on critical path' },
  { action: 'Automated test coverage expansion', impact: 'Increased coverage from 68% to 82%' },
  { action: 'Consolidated redundant meetings', impact: 'Recovered 6 hours/week team time' },
  { action: 'Applied automated dependency resolution', impact: 'Unblocked 3 downstream teams' },
  // Positive Communications & Celebrations
  { action: 'Scheduled stakeholder alignment meeting', impact: 'Coordinated 5 key stakeholders for next sprint' },
  { action: 'Sent milestone celebration update to team', impact: 'Recognized on-time delivery of Phase 2' },
  { action: 'Notified leadership of early delivery forecast', impact: 'Project tracking 2 weeks ahead of schedule' },
  { action: 'Shared best practices across teams', impact: 'Distributed learnings from successful integration' },
  { action: 'Generated executive status summary', impact: 'Prepared board-ready progress report' },
  { action: 'Coordinated cross-team retrospective', impact: 'Gathered feedback from 3 delivery teams' },
  { action: 'Arranged team recognition ceremony', impact: 'Celebrated 100% sprint completion' },
  // Proactive Measures
  { action: 'Initiated proactive risk mitigation', impact: 'Reduced risk exposure by 25%' },
  { action: 'Pre-emptively escalated timeline concern', impact: 'Gained early approval for contingency plan' },
  { action: 'Automated compliance documentation', impact: 'Updated TCFD/SFDR records ahead of audit' },
];

const PENDING_ALERTS = [
  { title: 'Budget Variance Detected', description: 'Cost trending 8% above forecast. Review recommended.', severity: 'high', type: 'budget' },
  { title: 'Schedule Risk Identified', description: 'Critical path task showing 3-day slip. Mitigation needed.', severity: 'critical', type: 'timeline' },
  { title: 'Resource Constraint Alert', description: 'Team utilization at 115%. Burnout risk increasing.', severity: 'high', type: 'resource' },
  { title: 'Quality Gate Warning', description: 'Test coverage dropped below 75% threshold.', severity: 'medium', type: 'quality' },
  { title: 'Dependency Blocker', description: 'Upstream team delivery delayed. Replanning required.', severity: 'high', type: 'dependency' },
  { title: 'Vendor Delivery Risk', description: 'Key vendor showing signs of delay. Contingency recommended.', severity: 'medium', type: 'risk' },
  { title: 'Compliance Gap Detected', description: 'Documentation incomplete for upcoming audit.', severity: 'critical', type: 'quality' },
];

let simulationInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let selfApprovedCounter = 0;
let pendingAlertCounter = 0;

async function maybeCreatePendingAlert(): Promise<void> {
  pendingAlertCounter++;
  if (pendingAlertCounter % 8 !== 0) return; // Create pending alert every ~96 seconds
  
  const agent = pickRandom(AGENTS);
  const project = pickRandom(PROJECTS);
  const alertTemplate = pickRandom(PENDING_ALERTS);
  
  const intervention: InsertIntervention = {
    type: alertTemplate.type,
    severity: alertTemplate.severity as 'critical' | 'high' | 'medium' | 'low',
    title: alertTemplate.title,
    description: `${alertTemplate.description} Detected in ${project}.`,
    projectId: `proj-${project.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    projectName: project,
    confidence: String((0.75 + Math.random() * 0.2).toFixed(2)),
    suggestedAction: `Review and address ${alertTemplate.type} issue`,
    impact: `Potential impact to ${project} delivery`,
    status: 'pending',
    agentSource: agent.name,
    isAutonomous: 'true',
    selfApproved: 'false',
    triggerSource: 'metric_breach',
  };
  
  try {
    await storage.createIntervention(intervention);
    console.log(`[AgentSimulation] Created PENDING alert: ${agent.name} - ${alertTemplate.title}`);
  } catch (error) {
    console.error('[AgentSimulation] Error creating pending alert:', error);
  }
}

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
      
      // Occasionally create a pending alert (triggers floating banner)
      await maybeCreatePendingAlert();
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
