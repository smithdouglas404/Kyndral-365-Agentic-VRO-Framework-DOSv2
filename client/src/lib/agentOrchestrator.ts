import { AgentType } from './dataHub';
import { executeAction, sendAgentMessage, ActionType } from './agentActionEngine';
import { notifyAction } from './backgroundAgentMonitor';
import { EXPANDED_PMO_PROJECTS } from './unifiedMetrics';
import { emitAgentIntervention, NewIntervention } from './commandCenterBridge';
import { initializeDefaultThresholds, simulateMetricChange } from './reactiveMetricMonitor';

export interface AgentTask {
  id: string;
  assignedAgent: AgentType;
  taskType: ActionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  targetType: string;
  targetId: string;
  targetName: string;
  description: string;
  reasoning?: string;
  delegatedBy?: AgentType | 'orchestrator';
  conflictsWith?: string[];
  createdAt: Date;
}

export interface AgentMemoryEntry {
  id: string;
  agentId: AgentType;
  memoryType: 'action' | 'pattern' | 'insight' | 'learning';
  targetType?: string;
  targetId?: string;
  targetName?: string;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface LearnedPattern {
  id: string;
  patternType: string;
  targetType: string;
  targetIdentifier: string;
  description: string;
  occurrences: number;
  confidence: number;
  lastObserved: Date;
}

const AGENT_CAPABILITIES: Record<AgentType, ActionType[]> = {
  'integrated-management': ['investigate', 'accelerate', 'escalate', 'notify', 'update-status', 'create-task', 'reassign'],
  tmo: ['investigate', 'create-task', 'notify', 'accelerate'],
  finops: ['investigate', 'mitigate', 'notify', 'escalate'],
  okr: ['investigate', 'notify', 'update-status'],
  governance: ['investigate', 'escalate', 'notify'],
  planning: ['investigate', 'create-task', 'notify'],
  ocm: ['investigate', 'notify', 'create-task']
};

const AGENT_PRIORITIES: Record<AgentType, number> = {
  'integrated-management': 100,
  governance: 95,
  finops: 85,
  tmo: 80,
  okr: 75,
  planning: 70,
  ocm: 65
};

let taskQueue: AgentTask[] = [];
let memoryStore: AgentMemoryEntry[] = [];
let patternStore: LearnedPattern[] = [];
let orchestratorInterval: NodeJS.Timeout | null = null;
let continuousActivityInterval: NodeJS.Timeout | null = null;
let isOrchestratorRunning = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function addTaskToQueue(task: Omit<AgentTask, 'id' | 'createdAt' | 'status'>): AgentTask {
  const newTask: AgentTask = {
    ...task,
    id: generateId(),
    status: 'pending',
    createdAt: new Date()
  };
  
  taskQueue.push(newTask);
  taskQueue.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  return newTask;
}

export function delegateTask(
  fromAgent: AgentType | 'orchestrator',
  taskType: ActionType,
  targetType: string,
  targetId: string,
  targetName: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): AgentTask | null {
  const bestAgent = findBestAgentForTask(taskType, priority);
  
  if (!bestAgent) {
    console.warn(`No suitable agent found for task type: ${taskType}`);
    return null;
  }
  
  const task = addTaskToQueue({
    assignedAgent: bestAgent,
    taskType,
    priority,
    targetType,
    targetId,
    targetName,
    description,
    delegatedBy: fromAgent
  });
  
  sendAgentMessage(
    fromAgent === 'orchestrator' ? 'integrated-management' : fromAgent,
    [bestAgent],
    'request',
    `Task Delegated: ${taskType}`,
    `${description} - Assigned to ${bestAgent.toUpperCase()} Agent`,
    priority === 'critical' ? 'critical' : priority === 'high' ? 'high' : 'medium',
    targetId
  );
  
  return task;
}

function findBestAgentForTask(taskType: ActionType, priority: string): AgentType | null {
  const capableAgents = (Object.entries(AGENT_CAPABILITIES) as [AgentType, ActionType[]][])
    .filter(([_, capabilities]) => capabilities.includes(taskType))
    .map(([agent]) => agent);
  
  if (capableAgents.length === 0) return null;
  
  const pendingTaskCounts = capableAgents.reduce((acc, agent) => {
    acc[agent] = taskQueue.filter(t => t.assignedAgent === agent && t.status === 'pending').length;
    return acc;
  }, {} as Record<AgentType, number>);
  
  capableAgents.sort((a, b) => {
    const aScore = AGENT_PRIORITIES[a] - pendingTaskCounts[a] * 10;
    const bScore = AGENT_PRIORITIES[b] - pendingTaskCounts[b] * 10;
    return bScore - aScore;
  });
  
  return capableAgents[0];
}

export function resolveConflict(taskId1: string, taskId2: string): string {
  const task1 = taskQueue.find(t => t.id === taskId1);
  const task2 = taskQueue.find(t => t.id === taskId2);
  
  if (!task1 || !task2) return taskId1;
  
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  if (priorityOrder[task1.priority] !== priorityOrder[task2.priority]) {
    return priorityOrder[task1.priority] < priorityOrder[task2.priority] ? taskId1 : taskId2;
  }
  
  if (AGENT_PRIORITIES[task1.assignedAgent] !== AGENT_PRIORITIES[task2.assignedAgent]) {
    return AGENT_PRIORITIES[task1.assignedAgent] > AGENT_PRIORITIES[task2.assignedAgent] ? taskId1 : taskId2;
  }
  
  return task1.createdAt < task2.createdAt ? taskId1 : taskId2;
}

function processTaskQueue(): void {
  const pendingTasks = taskQueue.filter(t => t.status === 'pending');
  const taskToProcess = pendingTasks[0];
  
  if (!taskToProcess) return;
  
  taskToProcess.status = 'in_progress';
  
  executeAction(
    taskToProcess.assignedAgent,
    taskToProcess.taskType,
    taskToProcess.targetType as 'project' | 'metric' | 'risk' | 'task' | 'okr' | 'alert',
    taskToProcess.targetId,
    taskToProcess.targetName,
    taskToProcess.reasoning || taskToProcess.description,
    taskToProcess.priority === 'critical' ? 95 : taskToProcess.priority === 'high' ? 85 : 75,
    taskToProcess.delegatedBy === 'orchestrator' ? undefined : taskToProcess.delegatedBy
  );
  
  notifyAction(taskToProcess.assignedAgent, taskToProcess.taskType, taskToProcess.targetName);
  
  setTimeout(() => {
    taskToProcess.status = 'completed';
    
    recordMemory(
      taskToProcess.assignedAgent,
      'action',
      taskToProcess.targetType,
      taskToProcess.targetId,
      taskToProcess.targetName,
      `Completed ${taskToProcess.taskType} on ${taskToProcess.targetName}: ${taskToProcess.description}`,
      0.9
    );
  }, 1000 + Math.random() * 2000);
}

export function recordMemory(
  agentId: AgentType,
  memoryType: 'action' | 'pattern' | 'insight' | 'learning',
  targetType: string | undefined,
  targetId: string | undefined,
  targetName: string | undefined,
  content: string,
  confidence: number = 0.75,
  metadata?: Record<string, unknown>
): AgentMemoryEntry {
  const memory: AgentMemoryEntry = {
    id: generateId(),
    agentId,
    memoryType,
    targetType,
    targetId,
    targetName,
    content,
    confidence,
    metadata,
    createdAt: new Date()
  };
  
  memoryStore.unshift(memory);
  if (memoryStore.length > 500) {
    memoryStore = memoryStore.slice(0, 500);
  }
  
  if (memoryType === 'action' && targetType && targetId && targetName) {
    const actionType: ActionType = confidence >= 0.85 ? 'investigate' : 'notify';
    executeAction(
      agentId,
      actionType,
      targetType as 'project' | 'risk' | 'alert' | 'okr' | 'metric' | 'task',
      targetId,
      targetName,
      content,
      Math.round(confidence * 100)
    );
    notifyAction(agentId, actionType, targetName);
  }
  
  fetch('/api/agents/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId,
      memoryType,
      targetType,
      targetId,
      targetName,
      content,
      confidence: String(confidence),
      metadata: metadata ? JSON.stringify(metadata) : undefined
    })
  }).then(res => {
    if (!res.ok) console.warn('Memory persist failed:', res.status);
  }).catch(err => console.warn('Failed to persist agent memory:', err));
  
  return memory;
}

export function learnPattern(
  patternType: string,
  targetType: string,
  targetIdentifier: string,
  description: string
): LearnedPattern {
  const existing = patternStore.find(
    p => p.patternType === patternType && 
         p.targetType === targetType && 
         p.targetIdentifier === targetIdentifier
  );
  
  if (existing) {
    const previousConfidence = existing.confidence;
    existing.occurrences += 1;
    existing.confidence = Math.min(0.95, existing.confidence + 0.05);
    existing.lastObserved = new Date();
    
    fetch('/api/agents/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patternType,
        targetType,
        targetIdentifier,
        description
      })
    }).then(res => {
      if (!res.ok) console.warn('Pattern persist failed:', res.status);
    }).catch(err => console.warn('Failed to persist pattern:', err));
    
    if (previousConfidence < 0.65 && existing.confidence >= 0.65) {
      sendAgentMessage('integrated-management', ['integrated-management', 'governance', 'finops'], 'insight',
        `Pattern Confirmed: ${patternType}`,
        `High-confidence pattern detected (${(existing.confidence * 100).toFixed(0)}%): ${description}. ` +
        `Observed ${existing.occurrences} times on ${targetIdentifier}.`,
        'high'
      );
    }
    
    return existing;
  }
  
  const pattern: LearnedPattern = {
    id: generateId(),
    patternType,
    targetType,
    targetIdentifier,
    description,
    occurrences: 1,
    confidence: 0.5,
    lastObserved: new Date()
  };
  
  patternStore.push(pattern);
  
  fetch('/api/agents/patterns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patternType,
      targetType,
      targetIdentifier,
      description
    })
  }).then(res => {
    if (!res.ok) console.warn('Pattern persist failed:', res.status);
  }).catch(err => console.warn('Failed to persist pattern:', err));
  
  return pattern;
}

export function getMemoryForAgent(agentId: AgentType): AgentMemoryEntry[] {
  return memoryStore.filter(m => m.agentId === agentId);
}

export function getRelevantPatterns(targetType: string, targetIdentifier?: string): LearnedPattern[] {
  return patternStore.filter(p => 
    p.targetType === targetType && 
    (!targetIdentifier || p.targetIdentifier === targetIdentifier) &&
    p.confidence >= 0.6
  );
}

const VRO_MICRO_ACTIONS = [
  { action: 'investigate', target: 'value-pipeline', name: 'Value Pipeline', reason: 'Scanning value pipeline for optimization opportunities' },
  { action: 'investigate', target: 'benefit-tracking', name: 'Benefit Tracking', reason: 'Analyzing benefit realization across portfolios' },
  { action: 'notify', target: 'stakeholders', name: 'Executive Stakeholders', reason: 'Preparing value summary for leadership' },
  { action: 'accelerate', target: 'high-value-projects', name: 'High-Value Initiatives', reason: 'Identifying projects for acceleration based on ROI' },
  { action: 'investigate', target: 'value-leakage', name: 'Value Leakage Analysis', reason: 'Detecting potential value leakage points' },
];

const PMO_MICRO_ACTIONS = [
  { action: 'investigate', target: 'milestone-status', name: 'Milestone Status', reason: 'Reviewing upcoming milestone deadlines' },
  { action: 'update-status', target: 'project-health', name: 'Project Health Metrics', reason: 'Updating project health indicators' },
  { action: 'notify', target: 'project-managers', name: 'Project Managers', reason: 'Sending status update reminders' },
  { action: 'investigate', target: 'resource-allocation', name: 'Resource Allocation', reason: 'Analyzing resource utilization patterns' },
  { action: 'create-task', target: 'risk-review', name: 'Risk Review Tasks', reason: 'Scheduling proactive risk assessments' },
  { action: 'investigate', target: 'delivery-velocity', name: 'Delivery Velocity', reason: 'Measuring sprint completion rates' },
];

function runContinuousAgentActivity(): void {
  const rand = Math.random();
  
  if (rand < 0.5) {
    const vroAction = VRO_MICRO_ACTIONS[Math.floor(Math.random() * VRO_MICRO_ACTIONS.length)];
    executeAction(
      'integrated-management',
      vroAction.action as ActionType,
      'metric',
      vroAction.target,
      vroAction.name,
      vroAction.reason,
      70 + Math.floor(Math.random() * 25)
    );
    notifyAction('integrated-management', vroAction.action, vroAction.name);
    
    recordMemory('integrated-management', 'action', 'metric', vroAction.target, vroAction.name, vroAction.reason, 0.8);
    
    if (Math.random() < 0.3) {
      const pattern = learnPattern(
        'value_trend',
        'metric',
        vroAction.target,
        `VRO observed recurring pattern on ${vroAction.name}`
      );
      if (pattern.occurrences > 2 && pattern.confidence >= 0.7) {
        sendAgentMessage('integrated-management', ['integrated-management', 'finops'], 'insight',
          `Pattern Detected: ${vroAction.name}`,
          `After ${pattern.occurrences} observations, VRO has identified a trend: ${pattern.description}`,
          'medium'
        );
      }
    }
  } else {
    const pmoAction = PMO_MICRO_ACTIONS[Math.floor(Math.random() * PMO_MICRO_ACTIONS.length)];
    
    const randomProject = EXPANDED_PMO_PROJECTS[Math.floor(Math.random() * EXPANDED_PMO_PROJECTS.length)];
    
    executeAction(
      'integrated-management',
      pmoAction.action as ActionType,
      'project',
      randomProject.id,
      randomProject.name,
      `${pmoAction.reason} for ${randomProject.name}`,
      70 + Math.floor(Math.random() * 25)
    );
    notifyAction('integrated-management', pmoAction.action, randomProject.name);
    
    recordMemory('integrated-management', 'action', 'project', randomProject.id, randomProject.name, pmoAction.reason, 0.8);
    
    if (randomProject.status === 'red' || randomProject.status === 'amber') {
      const pattern = learnPattern(
        randomProject.status === 'red' ? 'critical_project' : 'at_risk_project',
        'business_unit',
        randomProject.bu || 'Unknown BU',
        `Projects from ${randomProject.bu || 'this business unit'} frequently show ${randomProject.status} status`
      );
      
      if (pattern.occurrences >= 3 && pattern.confidence >= 0.65) {
        sendAgentMessage('integrated-management', ['integrated-management', 'governance'], 'insight',
          `Team Pattern Identified`,
          `PMO has detected that ${pattern.targetIdentifier} has ${pattern.occurrences} instances of ${pattern.patternType}. Confidence: ${(pattern.confidence * 100).toFixed(0)}%`,
          'high'
        );
      }
    }
  }
}

// Agent-specific intervention scenarios that emit to Command Center
const AGENT_INTERVENTION_SCENARIOS: NewIntervention[] = [
  {
    type: 'timeline',
    severity: 'high',
    title: 'OKR Quarterly Target Drift',
    description: 'Key Result KR3.2 (Improve stakeholder satisfaction by 25%) showing 12% variance from target trajectory.',
    projectId: 'proj-okr-tracking',
    projectName: 'Strategic OKR Program',
    confidence: 86,
    suggestedAction: 'Schedule stakeholder feedback sessions and implement quick-win improvements identified in last survey.',
    impact: 'Missing target affects divisional bonus pool and executive credibility.',
    agentSource: 'OKR Agent'
  },
  {
    type: 'resource',
    severity: 'medium',
    title: 'OCM Training Completion Gap',
    description: 'Only 62% of affected users completed mandatory change training with 2 weeks until go-live.',
    projectId: 'proj-ocm-readiness',
    projectName: 'Change Management Program',
    confidence: 79,
    suggestedAction: 'Deploy targeted reminder campaign and offer additional training sessions during lunch hours.',
    impact: 'Low training completion correlates with 35% higher support ticket volume post-launch.',
    agentSource: 'OCM Agent'
  },
  {
    type: 'dependency',
    severity: 'critical',
    title: 'Planning Sprint Capacity Conflict',
    description: 'Three ARTs competing for same shared services team capacity in PI 26.2. Current allocation exceeds 140%.',
    projectId: 'proj-safe-planning',
    projectName: 'SAFe Planning Coordination',
    confidence: 92,
    suggestedAction: 'Convene cross-ART capacity planning session. Prioritize based on WSJF scores.',
    impact: 'Without resolution, all three initiatives will miss PI objectives.',
    agentSource: 'Planning Agent'
  },
  {
    type: 'quality',
    severity: 'high',
    title: 'TMO Milestone Quality Gate Failed',
    description: 'Transformation milestone "Phase 2 Complete" failed quality gate. 4 of 12 acceptance criteria not met.',
    projectId: 'proj-transformation',
    projectName: 'Digital Transformation Office',
    confidence: 88,
    suggestedAction: 'Extend milestone deadline by 1 sprint. Assign dedicated resources to unmet criteria.',
    impact: 'Proceeding without resolution introduces $1.2M technical debt.',
    agentSource: 'TMO Agent'
  },
  {
    type: 'budget',
    severity: 'medium',
    title: 'FinOps Cost Optimization Opportunity',
    description: 'Cloud infrastructure costs 18% above benchmark. Identified $340K annual savings potential.',
    projectId: 'proj-cloud-optimization',
    projectName: 'Infrastructure Cost Management',
    confidence: 84,
    suggestedAction: 'Implement reserved instance strategy and right-size underutilized resources.',
    impact: 'Savings can be redirected to innovation initiatives.',
    agentSource: 'FinOps Agent'
  }
];

let lastInterventionEmitTime = 0;
const INTERVENTION_EMIT_INTERVAL = 60000; // Emit new intervention every 60 seconds max

async function maybeEmitAgentIntervention(): Promise<void> {
  const now = Date.now();
  
  // Only emit if enough time has passed and random chance (30% per cycle)
  if (now - lastInterventionEmitTime > INTERVENTION_EMIT_INTERVAL && Math.random() < 0.3) {
    const scenario = AGENT_INTERVENTION_SCENARIOS[Math.floor(Math.random() * AGENT_INTERVENTION_SCENARIOS.length)];
    const randomProject = EXPANDED_PMO_PROJECTS[Math.floor(Math.random() * EXPANDED_PMO_PROJECTS.length)];
    
    // Customize scenario with random project context
    const intervention: NewIntervention = {
      ...scenario,
      projectId: randomProject.id,
      projectName: randomProject.name,
      description: scenario.description.replace(/project|initiative/gi, randomProject.name),
      confidence: Math.max(70, Math.min(95, scenario.confidence + (Math.random() * 10 - 5)))
    };
    
    try {
      const result = await emitAgentIntervention(intervention);
      if (result.success) {
        lastInterventionEmitTime = now;
        console.log(`[Orchestrator] Emitted intervention from ${intervention.agentSource}: ${intervention.title}`);
      }
    } catch (error) {
      console.error('Failed to emit agent intervention:', error);
    }
  }
}

let dataLoaded = false;

async function loadPersistedData(): Promise<void> {
  if (dataLoaded) return;
  
  try {
    const [memoryRes, patternsRes] = await Promise.all([
      fetch('/api/agents/memory?limit=100'),
      fetch('/api/agents/patterns')
    ]);
    
    if (memoryRes.ok) {
      const memories = await memoryRes.json();
      const existingIds = new Set(memoryStore.map(m => m.id));
      memories.forEach((m: any) => {
        if (!existingIds.has(m.id)) {
          memoryStore.push({
            id: m.id,
            agentId: m.agentId as AgentType,
            memoryType: m.memoryType,
            targetType: m.targetType,
            targetId: m.targetId,
            targetName: m.targetName,
            content: m.content,
            confidence: parseFloat(m.confidence || '0.75'),
            metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
            createdAt: new Date(m.createdAt)
          });
        }
      });
    }
    
    if (patternsRes.ok) {
      const patterns = await patternsRes.json();
      const existingIds = new Set(patternStore.map(p => p.id));
      patterns.forEach((p: any) => {
        if (!existingIds.has(p.id)) {
          patternStore.push({
            id: p.id,
            patternType: p.patternType,
            targetType: p.targetType,
            targetIdentifier: p.targetIdentifier,
            description: p.description,
            occurrences: parseInt(p.occurrences || '1'),
            confidence: parseFloat(p.confidence || '0.5'),
            lastObserved: new Date(p.lastObserved)
          });
        }
      });
    }
    
    dataLoaded = true;
    console.log(`Loaded ${memoryStore.length} memories and ${patternStore.length} patterns from database`);
  } catch (err) {
    console.warn('Failed to load persisted agent data:', err);
  }
}

let interventionEmitInterval: NodeJS.Timeout | null = null;
let metricSimulationInterval: NodeJS.Timeout | null = null;

export function startOrchestrator(taskIntervalMs: number = 5000, activityIntervalMs: number = 30000): void {
  if (isOrchestratorRunning) return;
  
  isOrchestratorRunning = true;
  
  loadPersistedData();
  initializeDefaultThresholds();
  
  orchestratorInterval = setInterval(processTaskQueue, taskIntervalMs);
  
  continuousActivityInterval = setInterval(runContinuousAgentActivity, activityIntervalMs);
  
  // Start agent intervention emission to Command Center
  interventionEmitInterval = setInterval(maybeEmitAgentIntervention, 45000);
  
  // Simulate metric changes periodically (every 60 seconds, random metric)
  metricSimulationInterval = setInterval(() => {
    const metrics = ['schedule-performance', 'cost-performance', 'okr-progress', 'change-adoption', 'sprint-velocity'];
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    
    // Generate realistic fluctuating values
    let value: number;
    if (randomMetric === 'sprint-velocity') {
      value = 5 + Math.random() * 25; // 5-30% variance
    } else {
      value = 0.6 + Math.random() * 0.4; // 0.6-1.0 performance index
    }
    
    simulateMetricChange(randomMetric, value);
  }, 60000);
  
  setTimeout(runContinuousAgentActivity, 2000);
  setTimeout(maybeEmitAgentIntervention, 10000);
}

export function stopOrchestrator(): void {
  if (orchestratorInterval) {
    clearInterval(orchestratorInterval);
    orchestratorInterval = null;
  }
  if (continuousActivityInterval) {
    clearInterval(continuousActivityInterval);
    continuousActivityInterval = null;
  }
  if (interventionEmitInterval) {
    clearInterval(interventionEmitInterval);
    interventionEmitInterval = null;
  }
  if (metricSimulationInterval) {
    clearInterval(metricSimulationInterval);
    metricSimulationInterval = null;
  }
  isOrchestratorRunning = false;
}

// Export function to trigger immediate metric simulation for demo purposes
export function triggerMetricSimulation(metricId: string, value: number): void {
  simulateMetricChange(metricId, value);
}

export function getTaskQueue(): AgentTask[] {
  return [...taskQueue];
}

export function getMemoryStore(): AgentMemoryEntry[] {
  return [...memoryStore];
}

export function getPatternStore(): LearnedPattern[] {
  return [...patternStore];
}

export function isOrchestratorActive(): boolean {
  return isOrchestratorRunning;
}
