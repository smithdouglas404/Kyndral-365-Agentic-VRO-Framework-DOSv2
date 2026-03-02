/**
 * ONTOLOGY TYPES
 *
 * Type definitions for Palantir Ontology objects.
 * These types map to the Palantir Foundry object types.
 *
 * IMPORTANT: This is the CANONICAL source for all business data types.
 * All data should flow from Palantir Ontology → Application.
 */

// ============================================================================
// PROJECT TYPES
// ============================================================================

export type ProjectStatus = "green" | "amber" | "red";
export type ProjectPriority = "critical" | "high" | "medium" | "low";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  businessUnit: string;
  startDate?: string;
  endDate?: string;
  priority: ProjectPriority;
  // Budget
  budgetTotal?: number;
  budgetSpent?: number;
  budgetUnit?: string;
  // ROI
  expectedRoi?: string;
  roiValue?: number;
  // SAFe fields
  artName?: string;
  portfolioTheme?: string;
  safeStage?: SAFePortfolioStage;
  currentPi?: string;
  velocity?: number;
  predictability?: number;
  flowEfficiency?: number;
  epicId?: string;
  epicName?: string;
  epicProgress?: number;
  // Counts
  featureCount?: number;
  storyCount?: number;
  taskCount?: number;
  riskCount?: number;
  dependencyCount?: number;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// SAFE 6.0 TYPES
// ============================================================================

export type SAFePortfolioStage =
  | "funnel"
  | "reviewing"
  | "analyzing"
  | "portfolio-backlog"
  | "implementing"
  | "done";

export const SAFE_STAGES: SAFePortfolioStage[] = [
  "funnel",
  "reviewing",
  "analyzing",
  "portfolio-backlog",
  "implementing",
  "done"
];

export const SAFE_STAGE_LABELS: Record<SAFePortfolioStage, string> = {
  funnel: "Funnel",
  reviewing: "Reviewing",
  analyzing: "Analyzing",
  "portfolio-backlog": "Portfolio Backlog",
  implementing: "Implementing",
  done: "Done"
};

export function getStageLabel(stage: SAFePortfolioStage): string {
  return SAFE_STAGE_LABELS[stage] || stage;
}

export interface SAFeMetrics {
  velocity: number;
  predictability: number;
  flowEfficiency: number;
  currentPI: string;
  epicId?: string;
  epicName?: string;
  epicProgress?: number;
  okr?: {
    objective: string;
    keyResult: string;
    progress: number;
  };
  piTrend?: Array<{
    pi: string;
    velocity: number;
    predictability: number;
  }>;
  portfolio?: {
    id: string;
    name: string;
    strategicTheme?: string;
  };
  valueStream?: {
    id: string;
    name: string;
    type?: string;
  };
  art?: {
    id: string;
    name: string;
    releaseTrainEngineer?: string;
    productManager?: string;
  };
  team?: {
    id: string;
    name: string;
    scrumMaster?: string;
    productOwner?: string;
  };
  programIncrement?: {
    id: string;
    name: string;
    piNumber?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

// ============================================================================
// RISK TYPES
// ============================================================================

export type RiskSeverity = "critical" | "high" | "medium" | "low";
export type RiskStatus = "open" | "mitigated" | "closed" | "accepted";

export interface Risk {
  id: string;
  title: string;
  description?: string;
  severity: RiskSeverity;
  probability: number;
  impact: number;
  status: RiskStatus;
  projectId?: string;
  owner?: string;
  mitigationPlan?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

export interface Financial {
  id: string;
  projectId: string;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  forecastAtCompletion: number;
  variance: number;
  variancePercent: number;
  burnRate?: number;
  currency?: string;
  lastUpdated: string;
}

// ============================================================================
// OKR TYPES
// ============================================================================

export interface KeyResult {
  id: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  currentValue?: number;
  contributingKPIs?: string[];
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  progress: number;
  owner?: string;
  period?: string;
  strategicPriority?: "critical" | "high" | "medium";
  buAlignment?: string[];
  status?: "on-track" | "at-risk" | "off-track";
}

// ============================================================================
// DEPENDENCY TYPES
// ============================================================================

export type DependencyType = "blocks" | "blocked-by" | "related";
export type DependencyHealth = "green" | "yellow" | "red";

export interface Dependency {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  targetProjectName?: string;
  type: DependencyType;
  health: DependencyHealth;
  description?: string;
  impactIfDelayed?: string;
  dueDate?: string;
  status?: string;
}

// ============================================================================
// AI/AGENT TYPES
// ============================================================================

export type AISignalType = "warning" | "opportunity" | "insight" | "prediction";
export type ActionUrgency = "immediate" | "this-week" | "this-month";
export type ActionType = "mitigate" | "accelerate" | "investigate" | "escalate";

export interface AISignal {
  type: AISignalType;
  message: string;
  confidence: number;
  dataSource: string;
  timestamp?: string;
  agentId?: string;
}

export interface ProactiveAction {
  id: string;
  action: string;
  impact: string;
  urgency: ActionUrgency;
  type: ActionType;
  isAutonomous?: boolean;
  status?: "pending" | "in-progress" | "completed" | "dismissed";
}

// ============================================================================
// METRIC TYPES
// ============================================================================

export interface ProjectKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  weight: number;
  trend: "up" | "down" | "stable";
  lastUpdated?: string;
}

export interface VROAggregatedMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  sourceOKRs?: string[];
  calculationFormula?: string;
  breakdown?: Array<{
    source: string;
    contribution: number;
    value: number;
  }>;
  lastUpdated?: string;
}

// ============================================================================
// DASHBOARD/VIEW TYPES
// ============================================================================

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  projectsByStatus: {
    green: number;
    amber: number;
    red: number;
  };
  totalBudget: number;
  spentBudget: number;
  totalRisks: number;
  criticalRisks: number;
  okrProgress: number;
  agentAssignments: Record<string, string[]>;
}

export interface TrendPoint {
  date?: string;
  week?: string; // Legacy format from buPrograms
  value: number;
  label?: string;
}

// ============================================================================
// ENRICHED PROJECT TYPE (LEGACY COMPATIBILITY)
// ============================================================================

/**
 * EnrichedProject - Extended project type for UI components.
 * This maintains backwards compatibility with existing components
 * while we migrate to pure Palantir ontology types.
 *
 * @deprecated Use Project type with ontology hooks instead
 */
export interface EnrichedProject {
  id: string;
  name: string;
  bu: string;
  description: string;
  expectedROI: string;
  roiValue: number;
  priority: ProjectPriority;
  aiRecommendation: string;
  status: ProjectStatus;
  budget: { spent: number; total: number; unit: string };
  timeline: { elapsed: number; total: number; unit: string };
  deliverables: { completed: number; total: number };
  risks: string[];
  nextMilestone: string;
  safe: SAFeMetrics;
  safeStage: SAFePortfolioStage;
  artName?: string;
  portfolioTheme?: string;
  features?: unknown[];
  resources?: unknown[];
  milestones?: unknown[];
  safeDependencies?: unknown[];
  financials?: unknown;
  currentPI?: number;
  totalPIs?: number;
  velocity?: number;
  burndownHealth?: number;
  qualityScore?: number;
  aiSignals: AISignal[];
  proactiveActions: ProactiveAction[];
  trendData: TrendPoint[];
  dependencies: Array<{
    projectId: string;
    projectName: string;
    type: DependencyType;
    health: DependencyHealth;
    description: string;
    impactIfDelayed?: string;
  }>;
  linkedVROProgramId?: string;
  featureCount?: number;
  storyCount?: number;
  taskCount?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a Palantir Project to EnrichedProject format
 * for backwards compatibility with existing components
 */
export function toEnrichedProject(project: Project): EnrichedProject {
  return {
    id: project.id,
    name: project.name,
    bu: project.businessUnit,
    description: project.description || "",
    expectedROI: project.expectedRoi || "",
    roiValue: project.roiValue || 0,
    priority: project.priority,
    aiRecommendation: "",
    status: project.status,
    budget: {
      spent: project.budgetSpent || 0,
      total: project.budgetTotal || 0,
      unit: project.budgetUnit || "$m",
    },
    timeline: { elapsed: 0, total: 0, unit: "months" },
    deliverables: { completed: 0, total: 0 },
    risks: [],
    nextMilestone: "",
    safe: {
      velocity: project.velocity || 0,
      predictability: project.predictability || 0,
      flowEfficiency: project.flowEfficiency || 0,
      currentPI: project.currentPi || "",
      epicId: project.epicId,
      epicName: project.epicName,
      epicProgress: project.epicProgress || 0,
      piTrend: [],
    },
    safeStage: project.safeStage || "funnel",
    artName: project.artName,
    portfolioTheme: project.portfolioTheme,
    currentPI: parseInt(project.currentPi?.replace(/\D/g, "") || "0") || 0,
    totalPIs: 0,
    velocity: project.velocity || 0,
    aiSignals: [],
    proactiveActions: [],
    trendData: [],
    dependencies: [],
    featureCount: project.featureCount,
    storyCount: project.storyCount,
    taskCount: project.taskCount,
  };
}
