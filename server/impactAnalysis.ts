// ============================================================
// IMPACT ANALYSIS ENGINE
// Calculates downstream effects of changes to schedule, resources, or scope
// ============================================================

import type {
  ImpactAnalysisRequest,
  ImpactAnalysisResult,
  Dependency,
  Task,
  Story,
  Feature,
  TeamMember,
  FinancialSnapshot
} from '../client/src/lib/safe6Model';

import {
  tasks,
  stories,
  features,
  dependencies,
  teamMembers,
  portfolioEpics,
  financialSnapshots,
  riskRegister
} from '../client/src/lib/safe6Data';

// ===================== DEPENDENCY GRAPH =====================

interface DependencyNode {
  id: string;
  name: string;
  type: 'epic' | 'feature' | 'story' | 'task';
  plannedEnd: string;
  actualEnd?: string;
  dailyRate?: number;
  children: string[]; // IDs of nodes that depend on this
}

function buildDependencyGraph(): Map<string, DependencyNode> {
  const graph = new Map<string, DependencyNode>();
  
  // Add tasks
  for (const task of tasks) {
    const childDeps = dependencies.filter(d => d.targetId === task.id);
    graph.set(task.id, {
      id: task.id,
      name: task.title,
      type: 'task',
      plannedEnd: task.plannedEnd,
      actualEnd: task.actualEnd,
      dailyRate: task.dailyRate,
      children: childDeps.map(d => d.sourceId)
    });
  }
  
  // Add stories
  for (const story of stories) {
    const childDeps = dependencies.filter(d => d.targetId === story.id);
    const storyTasks = tasks.filter(t => t.storyId === story.id);
    graph.set(story.id, {
      id: story.id,
      name: story.title,
      type: 'story',
      plannedEnd: story.plannedEnd,
      actualEnd: story.actualEnd,
      children: [...childDeps.map(d => d.sourceId), ...storyTasks.map(t => t.id)]
    });
  }
  
  // Add features
  for (const feature of features) {
    const childDeps = dependencies.filter(d => d.targetId === feature.id);
    const featureStories = stories.filter(s => s.featureId === feature.id);
    graph.set(feature.id, {
      id: feature.id,
      name: feature.title,
      type: 'feature',
      plannedEnd: feature.plannedEnd,
      actualEnd: feature.actualEnd,
      children: [...childDeps.map(d => d.sourceId), ...featureStories.map(s => s.id)]
    });
  }
  
  // Add epics
  for (const epic of portfolioEpics) {
    const childDeps = dependencies.filter(d => d.targetId === epic.id);
    // Get features linked to this epic from the epic's linkedFeatures array
    const epicFeatures = features.filter(f => epic.linkedFeatures.includes(f.id));
    graph.set(epic.id, {
      id: epic.id,
      name: epic.name,
      type: 'epic',
      plannedEnd: epic.targetEndDate,
      actualEnd: epic.actualEndDate,
      children: [...childDeps.map(d => d.sourceId), ...epicFeatures.map(f => f.id)]
    });
  }
  
  return graph;
}

// ===================== IMPACT CALCULATION =====================

function calculateCascadeDelays(
  entityId: string,
  delayDays: number,
  graph: Map<string, DependencyNode>,
  visited: Set<string> = new Set()
): Array<{ entityId: string; entityName: string; entityType: string; delayDays: number; impactPath: string[] }> {
  if (visited.has(entityId)) return [];
  visited.add(entityId);
  
  const node = graph.get(entityId);
  if (!node) return [];
  
  const impacts: Array<{ entityId: string; entityName: string; entityType: string; delayDays: number; impactPath: string[] }> = [];
  
  // Find all entities that depend on this one
  const dependentDeps = dependencies.filter(d => d.targetId === entityId);
  
  for (const dep of dependentDeps) {
    const sourceNode = graph.get(dep.sourceId);
    if (sourceNode && !visited.has(dep.sourceId)) {
      // The delay cascades (possibly reduced by buffer time)
      const cascadeDelay = Math.max(0, delayDays - (dep.scheduleImpactDays || 0));
      if (cascadeDelay > 0) {
        impacts.push({
          entityId: dep.sourceId,
          entityName: sourceNode.name,
          entityType: sourceNode.type,
          delayDays: cascadeDelay,
          impactPath: [node.name, sourceNode.name]
        });
        
        // Recursively find downstream impacts
        const furtherImpacts = calculateCascadeDelays(dep.sourceId, cascadeDelay, graph, visited);
        for (const fi of furtherImpacts) {
          fi.impactPath = [node.name, ...fi.impactPath];
          impacts.push(fi);
        }
      }
    }
  }
  
  return impacts;
}

function calculateCostImpact(delayDays: number, entityId: string, entityType: string): number {
  if (entityType === 'task') {
    const task = tasks.find(t => t.id === entityId);
    return task ? delayDays * task.dailyRate : 0;
  }
  
  if (entityType === 'story') {
    const story = stories.find(s => s.id === entityId);
    if (!story) return 0;
    const storyTasks = tasks.filter(t => t.storyId === story.id);
    const avgDailyRate = storyTasks.reduce((sum, t) => sum + t.dailyRate, 0) / (storyTasks.length || 1);
    return delayDays * avgDailyRate * storyTasks.length;
  }
  
  if (entityType === 'feature') {
    const feature = features.find(f => f.id === entityId);
    if (!feature) return 0;
    // Estimate based on daily burn rate for the feature
    const featureStories = stories.filter(s => s.featureId === feature.id);
    const allTasks = featureStories.flatMap(s => tasks.filter(t => t.storyId === s.id));
    const totalDailyRate = allTasks.reduce((sum, t) => sum + t.dailyRate, 0);
    return delayDays * totalDailyRate;
  }
  
  if (entityType === 'epic') {
    const epic = portfolioEpics.find(e => e.id === entityId);
    if (!epic) return 0;
    // Use financial snapshot burn rate
    const snapshot = financialSnapshots.find(f => f.entityId === entityId);
    if (snapshot) {
      // Calculate daily burn rate from monthly data
      const dailyBurnRate = snapshot.actualSpend / 30; // Approximate
      return delayDays * dailyBurnRate;
    }
  }
  
  return 0;
}

function findResourceConflicts(delayDays: number, entityId: string): Array<{
  resourceId: string;
  resourceName: string;
  conflictingTasks: string[];
  overallocationPercentage: number;
}> {
  const conflicts: Array<{
    resourceId: string;
    resourceName: string;
    conflictingTasks: string[];
    overallocationPercentage: number;
  }> = [];
  
  // Find tasks affected by the delay
  const affectedTasks = tasks.filter(t => {
    if (t.storyId === entityId) return true;
    const story = stories.find(s => s.id === t.storyId);
    if (story?.featureId === entityId) return true;
    return t.id === entityId;
  });
  
  // Group by assignee
  const tasksByAssignee: Record<string, Task[]> = {};
  for (const task of affectedTasks) {
    if (!tasksByAssignee[task.assigneeId]) {
      tasksByAssignee[task.assigneeId] = [];
    }
    tasksByAssignee[task.assigneeId].push(task);
  }
  
  // Check for overallocation (skip if no delay)
  if (delayDays <= 0) return conflicts;
  
  for (const assigneeId of Object.keys(tasksByAssignee)) {
    const assigneeTasks = tasksByAssignee[assigneeId];
    const member = teamMembers.find(tm => tm.id === assigneeId);
    if (member && assigneeTasks.length > 1) {
      // Check if delay causes overlap
      const remainingHours = assigneeTasks.reduce((sum: number, t: Task) => sum + t.remainingHours, 0);
      const availableHours = member.availability * 0.01 * 8 * delayDays; // 8 hours per day
      
      if (availableHours > 0 && remainingHours > availableHours) {
        conflicts.push({
          resourceId: assigneeId,
          resourceName: member.name,
          conflictingTasks: assigneeTasks.map((t: Task) => t.title),
          overallocationPercentage: Math.round((remainingHours / availableHours) * 100)
        });
      }
    }
  }
  
  return conflicts;
}

// ===================== MAIN ANALYSIS FUNCTION =====================

export function analyzeImpact(request: ImpactAnalysisRequest): ImpactAnalysisResult {
  const graph = buildDependencyGraph();
  const node = graph.get(request.entityId);
  
  if (!node) {
    throw new Error(`Entity not found: ${request.entityId}`);
  }
  
  const delayDays = request.changeDetails.delayDays || 0;
  
  // Calculate direct schedule impact
  const originalEndDate = node.plannedEnd;
  const newEndDate = new Date(originalEndDate);
  newEndDate.setDate(newEndDate.getDate() + delayDays);
  
  // Calculate cascade impacts
  const cascadeImpacts = calculateCascadeDelays(request.entityId, delayDays, graph);
  
  // Calculate direct cost impact
  const directCostImpact = calculateCostImpact(delayDays, request.entityId, request.entityType);
  
  // Calculate cascade cost impact
  const cascadeCostImpact = cascadeImpacts.reduce((sum, impact) => {
    return sum + calculateCostImpact(impact.delayDays, impact.entityId, impact.entityType);
  }, 0);
  
  // Find resource conflicts
  const resourceConflicts = findResourceConflicts(delayDays, request.entityId);
  
  // Calculate ROI impact
  const relevantSnapshot = financialSnapshots.find(f => 
    f.entityId === request.entityId || 
    portfolioEpics.find(e => e.id === f.entityId && e.linkedFeatures.includes(request.entityId))
  );
  
  const originalROI = relevantSnapshot?.projectedROI || 0;
  const totalCostImpact = directCostImpact + cascadeCostImpact;
  const roiImpact = {
    originalROI,
    newROI: originalROI > 0 ? originalROI - totalCostImpact : 0,
    percentChange: originalROI > 0 ? -((totalCostImpact / originalROI) * 100) : 0
  };
  
  // Identify new/escalated risks
  const relatedRisks = riskRegister.filter(r => 
    r.entityId === request.entityId || 
    r.linkedDependencies.some(d => dependencies.find(dep => dep.id === d)?.sourceId === request.entityId)
  );
  
  const escalatedRisks = relatedRisks
    .filter(r => r.status !== 'resolved')
    .map(r => `${r.title}: ${r.description}`);
  
  const newRisks: string[] = [];
  if (delayDays > 14) {
    newRisks.push(`Schedule slip of ${delayDays} days may impact downstream milestones`);
  }
  if (resourceConflicts.length > 0) {
    newRisks.push(`Resource conflicts detected for ${resourceConflicts.length} team members`);
  }
  if (cascadeImpacts.length > 3) {
    newRisks.push(`Delay cascades to ${cascadeImpacts.length} dependent work items`);
  }
  
  // Generate mitigation options
  const mitigationOptions = [];
  
  if (delayDays > 0) {
    // Option 1: Add resources
    const additionalResourceCost = delayDays * 700 * 2; // 2 additional devs
    mitigationOptions.push({
      option: 'Add 2 additional developers to accelerate delivery',
      costToImplement: additionalResourceCost,
      scheduleRecoveryDays: Math.ceil(delayDays * 0.6),
      feasibility: 'medium' as const
    });
    
    // Option 2: Reduce scope
    mitigationOptions.push({
      option: 'Descope non-critical features to MVP',
      costToImplement: 0,
      scheduleRecoveryDays: Math.ceil(delayDays * 0.8),
      feasibility: 'high' as const
    });
    
    // Option 3: Accept delay
    mitigationOptions.push({
      option: 'Accept delay and communicate to stakeholders',
      costToImplement: directCostImpact + cascadeCostImpact,
      scheduleRecoveryDays: 0,
      feasibility: 'high' as const
    });
  }
  
  return {
    request,
    analysisTimestamp: new Date().toISOString(),
    directScheduleImpact: {
      entityId: request.entityId,
      entityName: node.name,
      originalEndDate,
      newEndDate: newEndDate.toISOString().split('T')[0],
      delayDays
    },
    cascadeScheduleImpacts: cascadeImpacts.map(impact => ({
      entityId: impact.entityId,
      entityName: impact.entityName,
      entityType: impact.entityType,
      originalEndDate: graph.get(impact.entityId)?.plannedEnd || '',
      newEndDate: (() => {
        const d = new Date(graph.get(impact.entityId)?.plannedEnd || '');
        d.setDate(d.getDate() + impact.delayDays);
        return d.toISOString().split('T')[0];
      })(),
      delayDays: impact.delayDays,
      impactPath: impact.impactPath
    })),
    directCostImpact,
    cascadeCostImpact,
    totalCostImpact: directCostImpact + cascadeCostImpact,
    roiImpact,
    resourceConflicts,
    newRisks,
    escalatedRisks,
    mitigationOptions
  };
}

// ===================== NATURAL LANGUAGE QUERY PARSER =====================

export function parseWhatIfQuery(question: string): ImpactAnalysisRequest | null {
  const lowerQuestion = question.toLowerCase();
  
  // Pattern: "what if [entity] is delayed by X days/weeks"
  const delayMatch = lowerQuestion.match(/what\s+(?:if|happens\s+if)\s+(.+?)\s+(?:is\s+)?delay(?:ed|s)?\s+(?:by\s+)?(\d+)\s*(days?|weeks?)/i);
  if (delayMatch) {
    const entityName = delayMatch[1].trim();
    const amount = parseInt(delayMatch[2]);
    const unit = delayMatch[3].toLowerCase();
    const delayDays = unit.startsWith('week') ? amount * 7 : amount;
    
    // Find entity by name
    const entity = findEntityByName(entityName);
    if (entity) {
      return {
        changeType: 'delay',
        entityType: entity.type,
        entityId: entity.id,
        changeDetails: { delayDays }
      };
    }
  }
  
  // Pattern: "impact of delaying [entity]"
  const impactMatch = lowerQuestion.match(/impact\s+(?:of\s+)?delay(?:ing)?\s+(.+?)(?:\s+by\s+(\d+)\s*(days?|weeks?))?/i);
  if (impactMatch) {
    const entityName = impactMatch[1].trim();
    const amount = impactMatch[2] ? parseInt(impactMatch[2]) : 7; // Default 7 days
    const unit = impactMatch[3]?.toLowerCase() || 'days';
    const delayDays = unit.startsWith('week') ? amount * 7 : amount;
    
    const entity = findEntityByName(entityName);
    if (entity) {
      return {
        changeType: 'delay',
        entityType: entity.type,
        entityId: entity.id,
        changeDetails: { delayDays }
      };
    }
  }
  
  return null;
}

function findEntityByName(name: string): { type: 'epic' | 'feature' | 'story' | 'task'; id: string } | null {
  const lowerName = name.toLowerCase();
  
  // Search epics
  for (const epic of portfolioEpics) {
    if (epic.name.toLowerCase().includes(lowerName) || epic.id.toLowerCase().includes(lowerName)) {
      return { type: 'epic', id: epic.id };
    }
  }
  
  // Search features
  for (const feature of features) {
    if (feature.title.toLowerCase().includes(lowerName) || feature.id.toLowerCase().includes(lowerName)) {
      return { type: 'feature', id: feature.id };
    }
  }
  
  // Search stories
  for (const story of stories) {
    if (story.title.toLowerCase().includes(lowerName) || story.id.toLowerCase().includes(lowerName)) {
      return { type: 'story', id: story.id };
    }
  }
  
  // Search tasks
  for (const task of tasks) {
    if (task.title.toLowerCase().includes(lowerName) || task.id.toLowerCase().includes(lowerName)) {
      return { type: 'task', id: task.id };
    }
  }
  
  return null;
}

// ===================== SUMMARY GENERATORS =====================

export function generateImpactSummary(result: ImpactAnalysisResult): string {
  const lines: string[] = [];
  
  lines.push(`## Impact Analysis: ${result.directScheduleImpact.entityName}`);
  lines.push('');
  
  // Schedule Impact
  lines.push('### Schedule Impact');
  lines.push(`- **Direct delay**: ${result.directScheduleImpact.delayDays} days`);
  lines.push(`- **Original end date**: ${result.directScheduleImpact.originalEndDate}`);
  lines.push(`- **New end date**: ${result.directScheduleImpact.newEndDate}`);
  
  if (result.cascadeScheduleImpacts.length > 0) {
    lines.push('');
    lines.push(`**Cascading to ${result.cascadeScheduleImpacts.length} downstream items:**`);
    for (const impact of result.cascadeScheduleImpacts.slice(0, 5)) {
      lines.push(`- ${impact.entityName} (${impact.entityType}): +${impact.delayDays} days`);
    }
    if (result.cascadeScheduleImpacts.length > 5) {
      lines.push(`- ...and ${result.cascadeScheduleImpacts.length - 5} more`);
    }
  }
  
  // Financial Impact
  lines.push('');
  lines.push('### Financial Impact');
  lines.push(`- **Direct cost**: £${result.directCostImpact.toLocaleString()}`);
  lines.push(`- **Cascade cost**: £${result.cascadeCostImpact.toLocaleString()}`);
  lines.push(`- **Total cost impact**: £${result.totalCostImpact.toLocaleString()}`);
  
  if (result.roiImpact.originalROI > 0) {
    lines.push(`- **ROI impact**: ${result.roiImpact.percentChange.toFixed(1)}% reduction`);
  }
  
  // Resource Conflicts
  if (result.resourceConflicts.length > 0) {
    lines.push('');
    lines.push('### Resource Conflicts');
    for (const conflict of result.resourceConflicts) {
      lines.push(`- **${conflict.resourceName}**: ${conflict.overallocationPercentage}% overallocated`);
      lines.push(`  - Conflicting work: ${conflict.conflictingTasks.join(', ')}`);
    }
  }
  
  // Risks
  if (result.newRisks.length > 0 || result.escalatedRisks.length > 0) {
    lines.push('');
    lines.push('### Risk Assessment');
    for (const risk of result.newRisks) {
      lines.push(`- 🔴 NEW: ${risk}`);
    }
    for (const risk of result.escalatedRisks) {
      lines.push(`- 🟡 ESCALATED: ${risk}`);
    }
  }
  
  // Mitigation Options
  if (result.mitigationOptions.length > 0) {
    lines.push('');
    lines.push('### Mitigation Options');
    for (const option of result.mitigationOptions) {
      lines.push(`- **${option.option}**`);
      lines.push(`  - Cost: £${option.costToImplement.toLocaleString()}`);
      lines.push(`  - Recovery: ${option.scheduleRecoveryDays} days`);
      lines.push(`  - Feasibility: ${option.feasibility}`);
    }
  }
  
  return lines.join('\n');
}
