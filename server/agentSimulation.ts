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

// Interventions that REQUIRE user approval (human-in-the-loop)
const APPROVAL_NEEDED_INTERVENTIONS = [
  { type: 'budget', severity: 'high', title: 'Budget Reallocation Required', description: 'FinOps Agent detected a 15% budget variance. Recommending reallocation from contingency reserves.', action: 'Approve £250K reallocation from contingency to delivery', impact: 'Prevents 2-week delay on critical path' },
  { type: 'timeline', severity: 'medium', title: 'Sprint Scope Adjustment Needed', description: 'TMO Agent identified velocity drop. Recommending scope reduction for next sprint.', action: 'Approve moving 3 stories to next sprint', impact: 'Maintains delivery quality and team morale' },
  { type: 'resource', severity: 'high', title: 'Resource Conflict Resolution', description: 'Planning Agent found shared architect assigned to 3 concurrent projects at 150% capacity.', action: 'Approve temporary contractor for 6 weeks', impact: 'Unblocks all three projects' },
  { type: 'dependency', severity: 'critical', title: 'Dependency Override Approval', description: 'Governance Agent detected blocked dependency on external API. Emergency workaround available.', action: 'Approve temporary mock integration', impact: 'Allows testing to proceed while API team resolves' },
  { type: 'quality', severity: 'medium', title: 'Quality Gate Exception Request', description: 'Integrated Management Agent found test coverage at 72% vs 80% target. Feature is low-risk.', action: 'Approve exception with remediation plan', impact: 'Enables release while maintaining quality trajectory' },
  { type: 'budget', severity: 'medium', title: 'Vendor Contract Extension', description: 'FinOps Agent identified expiring license. Renewal with 10% discount available.', action: 'Approve 2-year renewal at £180K', impact: 'Saves £40K vs annual renewal' },
  { type: 'timeline', severity: 'high', title: 'Milestone Date Change Request', description: 'TMO Agent forecasting 1-week delay due to integration complexity.', action: 'Approve revised milestone date', impact: 'Maintains stakeholder trust with proactive communication' },
  { type: 'resource', severity: 'low', title: 'Training Investment Approval', description: 'OCM Agent identified skill gap affecting velocity. Training course available.', action: 'Approve team training (3 days, £15K)', impact: 'Expected 20% velocity improvement post-training' },
];

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

let simulationInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let selfApprovedCounter = 0;
let approvalNeededCounter = 0;

// Seed initial interventions when app starts - checks DB state not memory flag
async function seedInitialInterventions(): Promise<void> {
  try {
    // Check if we have recent pending interventions (within last hour)
    const existing = await storage.getInterventions();
    const recentPending = existing.filter(i => {
      const createdAt = new Date(i.createdAt || 0);
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return i.status === 'pending' && createdAt.getTime() > hourAgo;
    });
    
    if (recentPending.length >= 3) {
      console.log(`[AgentSimulation] Found ${recentPending.length} recent pending interventions, skipping seed`);
      return;
    }
    
    console.log('[AgentSimulation] Seeding initial interventions (found only ' + recentPending.length + ' recent pending)...');
  
  // Create 3-4 interventions needing approval
  const shuffled = [...APPROVAL_NEEDED_INTERVENTIONS].sort(() => Math.random() - 0.5);
  const initialInterventions = shuffled.slice(0, 4);
  
  const agentMap: Record<string, typeof AGENTS[0]> = {
    'budget': AGENTS.find(a => a.id === 'finops')!,
    'timeline': AGENTS.find(a => a.id === 'tmo')!,
    'resource': AGENTS.find(a => a.id === 'planning')!,
    'quality': AGENTS.find(a => a.id === 'integrated')!,
    'dependency': AGENTS.find(a => a.id === 'governance')!,
  };
  
  for (const template of initialInterventions) {
    const project = pickRandom(PROJECTS);
    const agent = agentMap[template.type] || pickRandom(AGENTS);
    
    const intervention: InsertIntervention = {
      type: template.type,
      severity: template.severity as 'low' | 'medium' | 'high' | 'critical',
      title: template.title,
      description: template.description,
      projectId: `proj-${project.toLowerCase().replace(/\s+/g, '-')}`,
      projectName: project,
      confidence: String((0.82 + Math.random() * 0.15).toFixed(2)),
      suggestedAction: template.action,
      impact: template.impact,
      status: 'pending',
      agentSource: agent.name,
      isAutonomous: 'false',
      selfApproved: 'false',
      triggerSource: 'agent_detection',
    };
    
    try {
      await storage.createIntervention(intervention);
      console.log(`[AgentSimulation] Seeded intervention: ${template.title}`);
    } catch (error) {
      console.error('[AgentSimulation] Error seeding intervention:', error);
    }
  }
  
  // Also create 2 self-approved actions to show agent activity
  for (let i = 0; i < 2; i++) {
    const agent = pickRandom(AGENTS.filter(a => a.autonomy === 'full'));
    const project = pickRandom(PROJECTS);
    const actionTemplate = pickRandom(SELF_APPROVED_ACTIONS);
    
    const intervention: InsertIntervention = {
      type: pickRandom(INTERVENTION_TYPES),
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
    } catch (error) {
      console.error('[AgentSimulation] Error seeding self-approved:', error);
    }
  }
  
  console.log('[AgentSimulation] Initial interventions seeded successfully');
  } catch (error) {
    console.error('[AgentSimulation] Error checking/seeding interventions:', error);
  }
}

// Create an intervention that needs user approval
async function maybeCreateApprovalNeededIntervention(): Promise<void> {
  approvalNeededCounter++;
  if (approvalNeededCounter % 8 !== 0) return; // Create one every 8 cycles (~1.5 minutes)
  
  const template = pickRandom(APPROVAL_NEEDED_INTERVENTIONS);
  const project = pickRandom(PROJECTS);
  const agentMap: Record<string, typeof AGENTS[0]> = {
    'budget': AGENTS.find(a => a.id === 'finops')!,
    'timeline': AGENTS.find(a => a.id === 'tmo')!,
    'resource': AGENTS.find(a => a.id === 'planning')!,
    'quality': AGENTS.find(a => a.id === 'integrated')!,
    'dependency': AGENTS.find(a => a.id === 'governance')!,
  };
  const agent = agentMap[template.type] || pickRandom(AGENTS);
  
  const intervention: InsertIntervention = {
    type: template.type,
    severity: template.severity as 'low' | 'medium' | 'high' | 'critical',
    title: template.title,
    description: template.description,
    projectId: `proj-${project.toLowerCase().replace(/\s+/g, '-')}`,
    projectName: project,
    confidence: String((0.82 + Math.random() * 0.15).toFixed(2)),
    suggestedAction: template.action,
    impact: template.impact,
    status: 'pending',
    agentSource: agent.name,
    isAutonomous: 'false',
    selfApproved: 'false',
    triggerSource: 'agent_detection',
  };
  
  try {
    await storage.createIntervention(intervention);
    console.log(`[AgentSimulation] Created approval-needed intervention: ${template.title}`);
  } catch (error) {
    console.error('[AgentSimulation] Error creating approval-needed intervention:', error);
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
  
  // Seed initial interventions when starting
  await seedInitialInterventions();

  const generateActivity = async () => {
    try {
      const activity = generateWorkflowActivity();
      await storage.createAgentActivityLog(activity);
      console.log(`[AgentSimulation] Generated: ${activity.summary}`);
      
      // Occasionally create interventions
      await maybeCreateSelfApprovedIntervention();
      await maybeCreateApprovalNeededIntervention();
    } catch (error) {
      console.error('[AgentSimulation] Error generating activity:', error);
    }
  };

  await generateActivity();
  
  simulationInterval = setInterval(generateActivity, intervalMs);
}

// Agent cascade - triggered when user approves an intervention
export async function triggerAgentCascade(approvedIntervention: any): Promise<void> {
  console.log(`[AgentCascade] Triggered by approval of: ${approvedIntervention.title}`);
  
  // Determine which agents should respond based on intervention type
  const cascadeAgents: string[] = [];
  
  switch (approvedIntervention.type) {
    case 'budget':
      cascadeAgents.push('tmo', 'planning'); // TMO updates forecasts, Planning adjusts capacity
      break;
    case 'timeline':
      cascadeAgents.push('finops', 'ocm'); // FinOps recalculates costs, OCM notifies stakeholders
      break;
    case 'resource':
      cascadeAgents.push('tmo', 'finops'); // TMO adjusts velocity, FinOps updates budget
      break;
    case 'dependency':
      cascadeAgents.push('planning', 'governance'); // Planning updates roadmap, Governance logs exception
      break;
    case 'quality':
      cascadeAgents.push('governance', 'ocm'); // Governance tracks exception, OCM communicates
      break;
    default:
      cascadeAgents.push('planning');
  }
  
  // Create cascade activity events
  for (const agentId of cascadeAgents) {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) continue;
    
    const cascadeActions = [
      `${agent.name} acknowledged approval and updating forecasts`,
      `${agent.name} recalculating projections based on approved change`,
      `${agent.name} notifying downstream dependencies of update`,
      `${agent.name} updating dashboards with new baseline`,
    ];
    
    const activity: InsertAgentActivityLog = {
      eventType: 'cascade_response',
      primaryAgentId: agent.id,
      primaryAgentName: agent.name,
      secondaryAgentId: approvedIntervention.agentSource?.toLowerCase().replace(/\s+agent$/i, ''),
      secondaryAgentName: approvedIntervention.agentSource,
      summary: pickRandom(cascadeActions),
    };
    
    try {
      await storage.createAgentActivityLog(activity);
      console.log(`[AgentCascade] ${agent.name} responding to approval`);
    } catch (error) {
      console.error('[AgentCascade] Error creating cascade activity:', error);
    }
  }
  
  // Create a follow-up self-approved action showing cascade completion
  const followUpAgent = AGENTS.find(a => a.id === cascadeAgents[0]) || AGENTS[0];
  const followUpIntervention: InsertIntervention = {
    type: approvedIntervention.type,
    severity: 'low',
    title: `[Cascade Complete] Follow-up to: ${approvedIntervention.title}`,
    description: `${followUpAgent.name} completed cascade actions following your approval.`,
    projectId: approvedIntervention.projectId,
    projectName: approvedIntervention.projectName,
    confidence: '0.95',
    suggestedAction: 'Cascade actions completed - no action required',
    impact: 'All affected systems updated successfully',
    status: 'approved',
    agentSource: followUpAgent.name,
    isAutonomous: 'true',
    selfApproved: 'true',
    triggerSource: 'cascade_response',
    approvedBy: `${followUpAgent.name} (Auto-cascade)`
  };
  
  try {
    await storage.createIntervention(followUpIntervention);
    console.log('[AgentCascade] Created cascade completion intervention');
  } catch (error) {
    console.error('[AgentCascade] Error creating cascade intervention:', error);
  }
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
