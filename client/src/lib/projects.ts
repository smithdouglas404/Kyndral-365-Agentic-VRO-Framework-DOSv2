// ============================================================================
// ⚠️ DEPRECATED - Use Palantir Ontology Instead
// ============================================================================
// This file previously contained HARDCODED demo data.
// All data now flows from Palantir Foundry.
//
// FOR NEW CODE:
// - Use hooks from '@/hooks/usePalantirOntology' for data fetching
// - Use types from '@/types/ontology' for type definitions
// - Data flows from: Jira/OpenProject/Monday → Palantir → Application
//
// MIGRATION COMPLETE: Hardcoded data removed on 2026-03-02
// ============================================================================

// Re-export types from canonical source
export type {
  ProjectStatus,
  ProjectPriority,
  SAFePortfolioStage,
  SAFeMetrics,
  AISignal,
  ProactiveAction,
  TrendPoint,
  EnrichedProject,
} from '@/types/ontology';

export { getStageLabel, SAFE_STAGES, SAFE_STAGE_LABELS } from '@/types/ontology';

// ============================================================================
// TYPE DEFINITIONS (kept for backwards compatibility)
// ============================================================================

import { SAFePortfolioStage, EnrichedProject } from '@/types/ontology';
import { Feature, Resource, Milestone } from './safeProjectData';

// Cross-project dependency with health indicator
export interface ProjectDependency {
  projectId: string;
  projectName: string;
  type: "blocks" | "blocked-by" | "related";
  health: "green" | "yellow" | "red";
  description: string;
  impactIfDelayed?: string;
}

// ============================================================================
// EMPTY DATA ARRAY - Data now comes from Palantir API
// Use: const { data: projects } = useOntologyProjects()
// ============================================================================

export const enrichedProjects: EnrichedProject[] = [];

// ============================================================================
// LEGACY HELPER FUNCTIONS - Return empty results
// Use Palantir API hooks instead: usePalantirOntology.ts
// ============================================================================

export const buMapping: Record<string, string> = {};

/** @deprecated Use useOntologyProjects() hook instead */
export function getProjectsByBU(bu: string): EnrichedProject[] {
  console.warn('[DEPRECATED] getProjectsByBU - Use useOntologyProjects() from @/hooks/usePalantirOntology');
  return [];
}

export type { EnrichedProject as Project };

/** @deprecated Use useOntologyProjects() hook instead */
export function getAllProjects(): EnrichedProject[] {
  console.warn('[DEPRECATED] getAllProjects - Use useOntologyProjects() from @/hooks/usePalantirOntology');
  return [];
}

/** @deprecated Use useOntologyProject(id) hook instead */
export function getProjectById(id: string): EnrichedProject | undefined {
  console.warn('[DEPRECATED] getProjectById - Use useOntologyProject() from @/hooks/usePalantirOntology');
  return undefined;
}

/** @deprecated Use useOntologyProjects() with filter instead */
export function getProjectsByStatus(status: "green" | "amber" | "red"): EnrichedProject[] {
  console.warn('[DEPRECATED] getProjectsByStatus - Use useOntologyProjects() from @/hooks/usePalantirOntology');
  return [];
}

/** @deprecated Use useOntologyProjects() with filter instead */
export function getCriticalProjects(): EnrichedProject[] {
  console.warn('[DEPRECATED] getCriticalProjects - Use useOntologyProjects() from @/hooks/usePalantirOntology');
  return [];
}

/** @deprecated Use useOntologyProjects() with filter instead */
export function getProjectDependents(projectId: string): EnrichedProject[] {
  return [];
}

/** @deprecated Use useOntologyProjects() hook instead */
export const getBusinessUnits = (): string[] => [];

export const getSafeStages = (): SAFePortfolioStage[] => {
  return ["funnel", "reviewing", "analyzing", "portfolio-backlog", "implementing", "done"];
};

/** @deprecated Use useOntologyProjects() with filter instead */
export const getProjectsByStage = (stage: SAFePortfolioStage): EnrichedProject[] => [];

/** @deprecated Use useOntologyProject(id) hook instead */
export const getProjectDependencies = (projectId: string): ProjectDependency[] => [];

export const getDependencyHealthSummary = (): { green: number; yellow: number; red: number } => {
  return { green: 0, yellow: 0, red: 0 };
};

// Empty summary - use API data instead
export const projectSummary = {
  totalProjects: 0,
  byStatus: { green: 0, amber: 0, red: 0 },
  byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
  totalBudget: 0,
  totalSpent: 0,
  totalExpectedROI: 0,
  dependencyHealth: { green: 0, yellow: 0, red: 0 }
};

// ============================================================================
// SAFe HIERARCHY FUNCTIONS - Return empty/defaults
// Data now comes from Palantir ontology
// ============================================================================

/** @deprecated Use Palantir ontology data instead */
export function getSafeHierarchy(projectId: string): undefined {
  return undefined;
}

export function getProjectFeatureCount(projectId: string): number {
  return 0;
}

export function getProjectStoryCount(projectId: string): number {
  return 0;
}

export function getProjectTaskCount(projectId: string): number {
  return 0;
}

export function getProjectART(projectId: string): string {
  return 'Use Palantir API';
}

export function getProjectResources(projectId: string): Resource[] {
  return [];
}

export function getProjectMilestones(projectId: string): Milestone[] {
  return [];
}

export const safeCoverageSummary = {
  projectsWithFullSAFe: 0,
  totalProjects: 0,
  coveragePercentage: 0,
  totalFeatures: 0,
  totalStories: 0,
  totalTasks: 0
};
