import { useQuery } from "@tanstack/react-query";
import type { EnrichedProject } from "@/lib/projects";

export interface APIProject {
  id: string;
  name: string;
  description: string;
  status: "green" | "amber" | "red";
  businessUnitId: string;
  startDate: string;
  endDate: string;
  priority: "critical" | "high" | "medium" | "low";
  expectedRoi: string;
  roiValue: string;
  artName: string;
  portfolioTheme: string;
  safeStage: string;
  currentPi: string;
  totalPis: string;
  velocity: string;
  predictability: string;
  flowEfficiency: string;
  epicId: string;
  epicName: string;
  epicProgress: string;
  budgetSpent: string;
  budgetTotal: string;
  budgetUnit: string;
  createdAt: string;
  featureCount: number;
  storyCount: number;
  taskCount: number;
  resourceCount: number;
  dependencyCount: number;
  okrObjective?: string;
  okrKeyResult?: string;
  okrProgress?: number;
  aiRecommendation?: string;
  timelineElapsed?: number;
  timelineTotal?: number;
  alerts?: any[];
  interventions?: any[];
  dependencies?: any[];
  nextMilestone?: string;
}

function mapAPIProjectToEnriched(p: APIProject): EnrichedProject {
  // Map alerts to aiSignals format - matches AISignal interface
  const aiSignals = (p.alerts || []).map(alert => ({
    type: mapAlertCategory(alert.category),
    message: alert.message || alert.title,
    confidence: alert.metadata?.confidence || 75,
    dataSource: alert.source || 'AI Agent'
  }));

  // Map interventions to proactiveActions format - matches ProactiveAction interface
  const proactiveActions = (p.interventions || []).map((inv, idx) => ({
    id: inv.id || `action-${idx}`,
    action: inv.suggestedAction || inv.title,
    impact: inv.impact || '',
    urgency: mapUrgency(inv.severity),
    type: mapInterventionType(inv.type),
    isAutonomous: inv.isAutonomous || false
  }));

  // Map dependencies - matches ProjectDependency interface
  const dependencies = (p.dependencies || []).map(dep => ({
    projectId: dep.targetProjectId || dep.projectId || '',
    projectName: dep.targetProjectName || dep.name,
    type: mapDependencyType(dep.dependencyType),
    health: mapHealthStatus(dep.status),
    description: dep.description || `Dependency on ${dep.name}`,
    impactIfDelayed: dep.impactIfDelayed
  }));

  return {
    id: p.id,
    name: p.name,
    bu: p.businessUnitId,
    description: p.description,
    expectedROI: p.expectedRoi,
    roiValue: parseInt(p.roiValue) || 0,
    priority: p.priority,
    aiRecommendation: p.aiRecommendation || "",
    status: p.status,
    budget: {
      spent: parseInt(p.budgetSpent) || 0,
      total: parseInt(p.budgetTotal) || 0,
      unit: p.budgetUnit || "$m",
    },
    timeline: { 
      elapsed: p.timelineElapsed || 0, 
      total: p.timelineTotal || 0, 
      unit: "months" 
    },
    deliverables: { completed: p.featureCount || 0, total: (p.featureCount || 0) + 2 },
    risks: [],
    nextMilestone: p.nextMilestone || "",
    safe: {
      velocity: parseInt(p.velocity) || 0,
      predictability: parseInt(p.predictability) || 0,
      flowEfficiency: parseInt(p.flowEfficiency) || 0,
      currentPI: p.currentPi,
      epicId: p.epicId,
      epicName: p.epicName,
      epicProgress: parseInt(p.epicProgress) || 0,
      okr: p.okrObjective ? {
        objective: p.okrObjective,
        keyResult: p.okrKeyResult || '',
        progress: p.okrProgress || 0
      } : undefined,
      piTrend: [],
    },
    safeStage: p.safeStage as any,
    aiSignals,
    proactiveActions,
    trendData: [],
    dependencies,
    artName: p.artName,
    portfolioTheme: p.portfolioTheme,
    currentPI: parseInt(p.currentPi?.replace(/\D/g, "") || "0") || 0,
    totalPIs: parseInt(p.totalPis) || 0,
    velocity: parseInt(p.velocity) || 0,
  };
}

function mapUrgency(severity: string): 'immediate' | 'this-week' | 'this-month' {
  if (severity === 'critical' || severity === 'high') return 'immediate';
  if (severity === 'medium') return 'this-week';
  return 'this-month';
}

function mapAlertCategory(category: string): 'warning' | 'opportunity' | 'insight' | 'prediction' {
  if (category === 'risk') return 'warning';
  if (category === 'opportunity') return 'opportunity';
  if (category === 'insight') return 'insight';
  return 'insight';
}

function mapInterventionType(type: string): 'mitigate' | 'accelerate' | 'investigate' | 'escalate' {
  if (type === 'risk' || type === 'quality') return 'mitigate';
  if (type === 'budget') return 'investigate';
  if (type === 'timeline') return 'accelerate';
  return 'investigate';
}

function mapDependencyType(type: string): 'blocks' | 'blocked-by' | 'related' {
  if (type === 'blocked-by') return 'blocked-by';
  if (type === 'blocks') return 'blocks';
  return 'related';
}

function mapHealthStatus(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'green') return 'green';
  if (status === 'red') return 'red';
  return 'yellow'; // amber and yellow both map to yellow
}

export function useEnrichedProjects() {
  return useQuery<EnrichedProject[], Error>({
    queryKey: ["projects", "enriched"],
    queryFn: async () => {
      const response = await fetch("/api/projects/enriched");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data: APIProject[] = await response.json();
      return data.map(mapAPIProjectToEnriched);
    },
    staleTime: 30000,
  });
}

export function useProjectsByBU(businessUnit: string | string[]) {
  const { data: allProjects, ...rest } = useEnrichedProjects();
  const buList = Array.isArray(businessUnit) ? businessUnit : [businessUnit];
  const filtered = allProjects?.filter((p) => buList.includes(p.bu)) || [];
  return { data: filtered, ...rest };
}

export interface FullProject {
  project: APIProject;
  features: any[];
  stories: any[];
  tasks: any[];
  resources: any[];
  milestones: any[];
  dependencies: any[];
  risks: any[];
  financials: any;
}

export function useFullProject(projectId: string) {
  return useQuery<FullProject, Error>({
    queryKey: ["project", projectId, "full"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/full`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 30000,
  });
}
