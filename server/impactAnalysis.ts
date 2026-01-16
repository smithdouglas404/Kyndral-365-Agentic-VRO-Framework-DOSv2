// ============================================================
// IMPACT ANALYSIS ENGINE
// Calculates downstream effects of changes to schedule, resources, or scope
// Reads data from PostgreSQL database via storage interface
// ============================================================

import { storage } from "./storage";

export interface ImpactAnalysisRequest {
  changeType: 'delay' | 'resource' | 'scope' | 'budget';
  entityType: 'epic' | 'feature' | 'story' | 'task' | 'project';
  entityId: string;
  changeDetails: {
    delayDays?: number;
    resourceChange?: number;
    scopeChange?: string;
    budgetChange?: number;
  };
}

export interface ImpactAnalysisResult {
  request: ImpactAnalysisRequest;
  analysisTimestamp: string;
  directScheduleImpact: {
    entityId: string;
    entityName: string;
    originalEndDate: string;
    newEndDate: string;
    delayDays: number;
  };
  cascadeScheduleImpacts: Array<{
    entityId: string;
    entityName: string;
    entityType: string;
    originalEndDate: string;
    newEndDate: string;
    delayDays: number;
    impactPath: string[];
  }>;
  directCostImpact: number;
  cascadeCostImpact: number;
  totalCostImpact: number;
  roiImpact: {
    originalROI: number;
    newROI: number;
    percentChange: number;
  };
  resourceConflicts: Array<{
    resourceId: string;
    resourceName: string;
    conflictingTasks: string[];
    overallocationPercentage: number;
  }>;
  newRisks: string[];
  escalatedRisks: string[];
  mitigationOptions: Array<{
    option: string;
    costToImplement: number;
    scheduleRecoveryDays: number;
    feasibility: 'low' | 'medium' | 'high';
  }>;
}

// Find entity by name from database
async function findEntityByName(name: string): Promise<{ id: string; type: string; name: string } | null> {
  const lowerName = name.toLowerCase();
  
  // Search epics
  const epics = await storage.getEpics();
  const epic = epics.find(e => e.name.toLowerCase().includes(lowerName));
  if (epic) {
    return { id: epic.id, type: 'epic', name: epic.name };
  }
  
  // Search projects
  const projects = await storage.getProjects();
  const project = projects.find(p => p.name.toLowerCase().includes(lowerName));
  if (project) {
    return { id: project.id, type: 'project', name: project.name };
  }
  
  // Search features across all projects
  for (const project of projects) {
    const features = await storage.getFeatures(project.id);
    const feature = features.find(f => f.name.toLowerCase().includes(lowerName));
    if (feature) {
      return { id: feature.id, type: 'feature', name: feature.name };
    }
  }
  
  return null;
}

// Main analysis function - reads from database
export async function analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysisResult> {
  const delayDays = request.changeDetails.delayDays || 0;
  
  // Get entity name from database
  let entityName = 'Unknown Entity';
  let originalEndDate = new Date().toISOString().split('T')[0];
  
  let targetPi: string | null = null;
  
  if (request.entityType === 'epic') {
    const epics = await storage.getEpics();
    const epic = epics.find(e => e.id === request.entityId);
    if (epic) {
      entityName = epic.name;
      targetPi = epic.targetPi || null;
    }
  } else if (request.entityType === 'project') {
    const projects = await storage.getProjects();
    const project = projects.find(p => p.id === request.entityId);
    if (project) {
      entityName = project.name;
      if (project.endDate) {
        originalEndDate = new Date(project.endDate).toISOString().split('T')[0];
      }
      targetPi = project.currentPi || null;
    }
  } else if (request.entityType === 'feature') {
    const projects = await storage.getProjects();
    for (const project of projects) {
      const features = await storage.getFeatures(project.id);
      const feature = features.find(f => f.id === request.entityId);
      if (feature) {
        entityName = feature.name;
        targetPi = feature.targetPi || null;
        break;
      }
    }
  }
  
  // Calculate new end date (only if we have a valid date)
  let newEndDateStr = originalEndDate;
  const parsedDate = new Date(originalEndDate);
  if (!isNaN(parsedDate.getTime())) {
    parsedDate.setDate(parsedDate.getDate() + delayDays);
    newEndDateStr = parsedDate.toISOString().split('T')[0];
  } else if (targetPi) {
    // For PI-based scheduling, just note the delay
    newEndDateStr = `${targetPi} + ${delayDays} days`;
    originalEndDate = `PI ${targetPi}`;
  }
  
  // Estimate cost impact based on entity type
  let directCostImpact = 0;
  if (request.entityType === 'epic') {
    directCostImpact = delayDays * 15000; // ~$15K/day for epic-level work
  } else if (request.entityType === 'feature') {
    directCostImpact = delayDays * 5000; // ~$5K/day for feature-level work
  } else if (request.entityType === 'project') {
    directCostImpact = delayDays * 25000; // ~$25K/day for project-level work
  }
  
  // Estimate cascade impacts
  const cascadeImpacts: ImpactAnalysisResult['cascadeScheduleImpacts'] = [];
  const cascadeCostImpact = Math.round(directCostImpact * 0.3); // Estimate 30% cascade effect
  
  // Generate risks based on delay magnitude
  const newRisks: string[] = [];
  if (delayDays > 14) {
    newRisks.push(`Schedule slip of ${delayDays} days may impact downstream milestones`);
  }
  if (delayDays > 30) {
    newRisks.push(`Extended delay may require stakeholder re-alignment and budget review`);
  }
  if (request.entityType === 'epic' && delayDays > 7) {
    newRisks.push(`Epic-level delay may cascade to multiple features and teams`);
  }
  
  // Generate mitigation options
  const mitigationOptions: ImpactAnalysisResult['mitigationOptions'] = [];
  
  if (delayDays > 0) {
    mitigationOptions.push({
      option: 'Add additional resources to accelerate delivery',
      costToImplement: delayDays * 2000,
      scheduleRecoveryDays: Math.ceil(delayDays * 0.6),
      feasibility: 'medium'
    });
    
    mitigationOptions.push({
      option: 'Reduce scope to MVP for initial release',
      costToImplement: 0,
      scheduleRecoveryDays: Math.ceil(delayDays * 0.8),
      feasibility: 'high'
    });
    
    mitigationOptions.push({
      option: 'Accept delay and communicate to stakeholders',
      costToImplement: directCostImpact + cascadeCostImpact,
      scheduleRecoveryDays: 0,
      feasibility: 'high'
    });
  }
  
  return {
    request,
    analysisTimestamp: new Date().toISOString(),
    directScheduleImpact: {
      entityId: request.entityId,
      entityName,
      originalEndDate,
      newEndDate: newEndDateStr,
      delayDays
    },
    cascadeScheduleImpacts: cascadeImpacts,
    directCostImpact,
    cascadeCostImpact,
    totalCostImpact: directCostImpact + cascadeCostImpact,
    roiImpact: {
      originalROI: 0,
      newROI: 0,
      percentChange: 0
    },
    resourceConflicts: [],
    newRisks,
    escalatedRisks: [],
    mitigationOptions
  };
}

// Parse natural language "what if" queries
export async function parseWhatIfQuery(question: string): Promise<ImpactAnalysisRequest | null> {
  const lowerQuestion = question.toLowerCase();
  
  // Pattern: "what if [entity] is delayed by X days/weeks"
  const delayMatch = lowerQuestion.match(/what\s+(?:if|happens\s+if)\s+(.+?)\s+(?:is\s+)?delay(?:ed|s)?\s+(?:by\s+)?(\d+)\s*(days?|weeks?)/i);
  if (delayMatch) {
    const entityName = delayMatch[1].trim();
    const amount = parseInt(delayMatch[2]);
    const unit = delayMatch[3].toLowerCase();
    const delayDays = unit.startsWith('week') ? amount * 7 : amount;
    
    // Find entity by name from database
    const entity = await findEntityByName(entityName);
    if (entity) {
      return {
        changeType: 'delay',
        entityType: entity.type as 'epic' | 'feature' | 'story' | 'task' | 'project',
        entityId: entity.id,
        changeDetails: { delayDays }
      };
    }
  }
  
  return null;
}

// Generate human-readable impact summary
export function generateImpactSummary(result: ImpactAnalysisResult): string {
  const { directScheduleImpact, totalCostImpact, newRisks, mitigationOptions } = result;
  
  let summary = `📊 IMPACT ANALYSIS: ${directScheduleImpact.entityName}

📅 SCHEDULE IMPACT:
- Original End Date: ${directScheduleImpact.originalEndDate}
- New End Date: ${directScheduleImpact.newEndDate}
- Delay: ${directScheduleImpact.delayDays} days

💰 COST IMPACT:
- Direct Cost: $${(result.directCostImpact / 1000).toFixed(0)}K
- Cascade Cost: $${(result.cascadeCostImpact / 1000).toFixed(0)}K
- Total Impact: $${(totalCostImpact / 1000).toFixed(0)}K
`;

  if (newRisks.length > 0) {
    summary += `\n⚠️ NEW RISKS:\n${newRisks.map(r => `- ${r}`).join('\n')}\n`;
  }
  
  if (mitigationOptions.length > 0) {
    summary += `\n🛡️ MITIGATION OPTIONS:\n`;
    for (const opt of mitigationOptions) {
      summary += `- ${opt.option}\n  Cost: $${(opt.costToImplement / 1000).toFixed(0)}K | Recovery: ${opt.scheduleRecoveryDays} days | Feasibility: ${opt.feasibility}\n`;
    }
  }
  
  return summary;
}
