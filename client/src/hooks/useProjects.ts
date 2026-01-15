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
}

function mapAPIProjectToEnriched(p: APIProject): EnrichedProject {
  return {
    id: p.id,
    name: p.name,
    bu: p.businessUnitId,
    description: p.description,
    expectedROI: p.expectedRoi,
    roiValue: parseInt(p.roiValue) || 0,
    priority: p.priority,
    aiRecommendation: "",
    status: p.status,
    budget: {
      spent: parseInt(p.budgetSpent) || 0,
      total: parseInt(p.budgetTotal) || 0,
      unit: p.budgetUnit || "$m",
    },
    timeline: { elapsed: 0, total: 0, unit: "months" },
    deliverables: { completed: 0, total: 0 },
    risks: [],
    nextMilestone: "",
    safe: {
      velocity: parseInt(p.velocity) || 0,
      predictability: parseInt(p.predictability) || 0,
      flowEfficiency: parseInt(p.flowEfficiency) || 0,
      currentPI: p.currentPi,
      epicId: p.epicId,
      epicName: p.epicName,
      epicProgress: parseInt(p.epicProgress) || 0,
      piTrend: [],
    },
    safeStage: p.safeStage as any,
    aiSignals: [],
    proactiveActions: [],
    trendData: [],
    dependencies: [],
    artName: p.artName,
    portfolioTheme: p.portfolioTheme,
    currentPI: parseInt(p.currentPi?.replace(/\D/g, "") || "0") || 0,
    totalPIs: parseInt(p.totalPis) || 0,
    velocity: parseInt(p.velocity) || 0,
  };
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
