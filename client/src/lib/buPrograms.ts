// ============================================================================
// BUSINESS UNIT PROGRAMS - TYPE DEFINITIONS ONLY
// Data should be fetched from APIs using React Query hooks
// ============================================================================

// PMO = Traditional Project Management: timelines, budgets, deliverables
// VRO = Value Realization Office: outcomes, ROI, strategic impact, predictions

export interface ProactiveAction {
  id: string;
  action: string;
  impact: string;
  urgency: "immediate" | "this-week" | "this-month";
  type: "mitigate" | "accelerate" | "investigate" | "escalate";
  isAutonomous?: boolean;
}

export interface AISignal {
  type: "warning" | "opportunity" | "insight" | "prediction";
  message: string;
  confidence: number; // 0-100
  dataSource: string;
}

export interface TrendPoint {
  week: string;
  value: number;
}

export interface SAFeMetrics {
  velocity: number;
  predictability: number; // 0-100%
  flowEfficiency: number; // 0-100%
  currentPI: string;
  epicId: string;
  epicName: string;
  epicProgress: number; // 0-100%
  okr?: { objective: string; keyResult: string; progress: number };
  piTrend: { pi: string; velocity: number; predictability: number }[];
  // Full SAFe context from database
  portfolio?: {
    id: string;
    name: string;
    strategicTheme?: string;
    lpmCadence?: string;
    budgetTotal?: string;
    budgetAllocated?: string;
  };
  valueStream?: {
    id: string;
    name: string;
    type?: string;
    owner?: string;
    flowEfficiency?: string;
    leadTime?: string;
  };
  art?: {
    id: string;
    name: string;
    releaseTrainEngineer?: string;
    productManager?: string;
    systemArchitect?: string;
    piCadence?: string;
    teamCount?: string;
    velocity?: string;
    predictability?: string;
  };
  team?: {
    id: string;
    name: string;
    type?: string;
    scrumMaster?: string;
    productOwner?: string;
    techLead?: string;
    memberCount?: string;
    capacity?: string;
    velocity?: string;
  };
  programIncrement?: {
    id: string;
    name: string;
    piNumber?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    committedPoints?: string;
    deliveredPoints?: string;
    predictability?: string;
  };
}

// SAFe 6.0 Portfolio Stages
export type SAFePortfolioStage = "funnel" | "reviewing" | "analyzing" | "portfolio-backlog" | "implementing" | "done";

export interface PMOProject {
  id: string;
  name: string;
  bu: string;
  status: "green" | "amber" | "red";
  budget: { spent: number; total: number; unit: string };
  timeline: { elapsed: number; total: number; unit: string };
  deliverables: { completed: number; total: number };
  risks: string[];
  nextMilestone: string;
  // SAFe 6.0 Metrics
  safe: SAFeMetrics;
  // SAFe 6.0 Portfolio Stage
  safeStage: SAFePortfolioStage;
  // AI Enhancement fields
  aiSignals: AISignal[];
  proactiveActions: ProactiveAction[];
  trendData: TrendPoint[];
}

export interface VROProgram {
  id: string;
  name: string;
  bu: string;
  valueStatus: "accelerating" | "on-track" | "at-risk" | "blocked";
  expectedROI: string;
  roiValue: number; // in millions
  valueRealized: number; // in millions
  strategicAlignment: number; // 0-100%
  aiInsight: string;
  prediction: string;
  keyOutcomes: { outcome: string; progress: number; target: number; unit: string }[];
  collaborators: string[];
  riskMitigation: string;
  // SAFe 6.0 Metrics
  safe: SAFeMetrics;
  // AI Enhancement fields
  aiSignals: AISignal[];
  proactiveActions: ProactiveAction[];
  trendData: TrendPoint[];
}

export interface RiskIssue {
  id: string;
  project: string;
  bu: string;
  type: "technical" | "financial" | "operational" | "compliance" | "strategic";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  impact: string;
  trend: "worsening" | "stable" | "improving";
  mitigation: string;
  owner: string;
  dueDate: string;
  aiAlert: boolean;
  aiRecommendation?: string;
}

export interface BUPortfolio {
  bu: string;
  totalProjects: number;
  totalBudget: { value: number; unit: string };
  onTrack: number;
  atRisk: number;
  blocked: number;
  totalExpectedValue: { value: number; unit: string };
  topAISignal: AISignal;
  topAction: ProactiveAction;
  okrs: { objective: string; progress: number; status: string }[];
}

// ============================================================================
// DATA ARRAYS - DEPRECATED: Fetch from API using hooks instead
// ============================================================================

// DEPRECATED: Use useProjects() hook from @/hooks/useProjects
export const pmoProjects: PMOProject[] = [];

// DEPRECATED: Use useProjects() hook from @/hooks/useProjects  
export const vroPrograms: VROProgram[] = [];

// DEPRECATED: Use useRisks() or useIssues() hooks
export const riskIssues: RiskIssue[] = [];

// DEPRECATED: Use useDivisions() hook from @/hooks/useNexteraData
export const buPortfolios: BUPortfolio[] = [];

// ============================================================================
// SUMMARY FUNCTIONS - Calculate from actual API data
// ============================================================================

export function calculateVROSummary(programs: VROProgram[]) {
  return {
    totalPrograms: programs.length,
    accelerating: programs.filter(p => p.valueStatus === "accelerating").length,
    onTrack: programs.filter(p => p.valueStatus === "on-track").length,
    atRisk: programs.filter(p => p.valueStatus === "at-risk").length,
    totalExpectedROI: programs.reduce((sum, p) => sum + p.roiValue, 0),
    totalRealized: programs.reduce((sum, p) => sum + p.valueRealized, 0),
    avgStrategicAlignment: programs.length > 0 
      ? Math.round(programs.reduce((sum, p) => sum + p.strategicAlignment, 0) / programs.length)
      : 0
  };
}

export function calculateRiskSummary(risks: RiskIssue[]) {
  return {
    total: risks.length,
    critical: risks.filter(r => r.severity === "critical").length,
    high: risks.filter(r => r.severity === "high").length,
    medium: risks.filter(r => r.severity === "medium").length,
    worsening: risks.filter(r => r.trend === "worsening").length,
    withAIAlerts: risks.filter(r => r.aiAlert).length
  };
}

// DEPRECATED: Use calculateVROSummary(programs) instead
export const vroSummary = calculateVROSummary(vroPrograms);

// DEPRECATED: Use calculateRiskSummary(risks) instead
export const riskSummary = calculateRiskSummary(riskIssues);
