import type { EnrichedProject } from "./projects";

let cachedProjects: EnrichedProject[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000;

export async function fetchEnrichedProjects(): Promise<EnrichedProject[]> {
  const now = Date.now();
  if (cachedProjects && now - cacheTimestamp < CACHE_TTL) {
    return cachedProjects;
  }

  const response = await fetch("/api/projects/enriched");
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  const data = await response.json();
  cachedProjects = data.map(mapAPIProjectToEnriched);
  cacheTimestamp = now;
  return cachedProjects;
}

export async function fetchProjectById(id: string): Promise<EnrichedProject | undefined> {
  const projects = await fetchEnrichedProjects();
  return projects.find((p) => p.id === id);
}

export async function fetchFullProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/full`);
  if (!response.ok) {
    throw new Error("Failed to fetch project");
  }
  return response.json();
}

interface APIProject {
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

export function getProjectCount(): Promise<number> {
  return fetchEnrichedProjects().then((projects) => projects.length);
}

export function invalidateProjectsCache(): void {
  cachedProjects = null;
  cacheTimestamp = 0;
}
