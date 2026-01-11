// ============================================================
// COMPLETE SAFe 6.0 DATA MODEL
// From Portfolio (PPM) Level down to Tasks with full traceability
// ============================================================

// ===================== PORTFOLIO LEVEL =====================

export interface StrategicTheme {
  id: string;
  name: string;
  description: string;
  timeHorizon: '1-year' | '3-year' | '5-year';
  budgetAllocation: number; // percentage of portfolio budget
  status: 'active' | 'sunset' | 'proposed';
  linkedOKRs: string[]; // OKR IDs
}

export interface ValueStream {
  id: string;
  name: string;
  description: string;
  type: 'operational' | 'development';
  owner: string;
  linkedARTs: string[]; // ART IDs
  annualBudget: number;
  kpis: string[]; // KPI IDs
}

export interface PortfolioEpic {
  id: string;
  name: string;
  description: string;
  epicHypothesis: string;
  businessOutcome: string;
  leadingIndicators: string[];
  mvp: string; // Minimum Viable Product description
  status: 'funnel' | 'reviewing' | 'analyzing' | 'portfolio-backlog' | 'implementing' | 'done';
  owner: string;
  strategicThemeId: string;
  valueStreamId: string;
  wsjfScore: number;
  estimatedCost: number;
  actualCost: number;
  targetStartDate: string;
  targetEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  linkedCapabilities: string[]; // Capability IDs
  linkedFeatures: string[]; // Feature IDs if no capabilities
  linkedOKRs: string[];
}

export interface PortfolioOKR {
  id: string;
  level: 'portfolio';
  objective: string;
  owner: string;
  quarter: string; // e.g., "2025-Q1"
  status: 'on-track' | 'at-risk' | 'off-track' | 'achieved';
  keyResults: KeyResult[];
  linkedEpics: string[];
  linkedKPIs: string[];
}

export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  confidence: number; // 0-100
  status: 'on-track' | 'at-risk' | 'off-track' | 'achieved';
}

export interface PortfolioKPI {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'innovation';
  targetValue: number;
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  linkedValueStreams: string[];
  observations: KPIObservation[];
}

export interface KPIObservation {
  id: string;
  kpiId: string;
  timestamp: string;
  value: number;
  notes?: string;
}

// ===================== LARGE SOLUTION LEVEL =====================

export interface SolutionTrain {
  id: string;
  name: string;
  description: string;
  solutionTrainEngineer: string;
  linkedARTs: string[];
  linkedCapabilities: string[];
  piCadence: number; // weeks per PI
}

export interface Capability {
  id: string;
  solutionTrainId?: string;
  epicId: string;
  name: string;
  description: string;
  benefitHypothesis: string;
  acceptanceCriteria: string[];
  wsjfScore: number;
  status: 'funnel' | 'analyzing' | 'solution-backlog' | 'implementing' | 'done';
  targetPI: string; // PI ID
  linkedFeatures: string[];
  dependencies: string[]; // Capability IDs
  estimatedCost: number;
  actualCost: number;
}

// ===================== ART / PROGRAM LEVEL =====================

export interface AgileReleaseTrain {
  id: string;
  name: string;
  description: string;
  valueStreamId: string;
  releaseTrainEngineer: string;
  productManager: string;
  systemArchitect: string;
  teams: string[]; // Team IDs
  piCadenceWeeks: number; // typically 8-12 weeks
  sprintCadenceWeeks: number; // typically 2 weeks
  currentPI: string; // PI ID
  programBacklog: string[]; // Feature IDs
  kpis: ARTKPI[];
}

export interface ProgramIncrement {
  id: string;
  artId: string;
  name: string; // e.g., "PI 2025-Q1"
  number: number; // e.g., 1, 2, 3...
  startDate: string;
  endDate: string;
  ipSprintStart: string; // Innovation & Planning sprint dates
  ipSprintEnd: string;
  status: 'planning' | 'executing' | 'completed';
  piObjectives: PIObjective[];
  iterations: Iteration[];
  features: string[]; // Feature IDs planned for this PI
  predictability: number; // 0-100, actual vs committed
  velocity: number; // story points delivered
}

export interface PIObjective {
  id: string;
  piId: string;
  teamId?: string; // null if ART-level objective
  description: string;
  businessValue: number; // 1-10
  isCommitted: boolean;
  status: 'pending' | 'achieved' | 'not-achieved';
  notes?: string;
}

export interface ARTKPI {
  id: string;
  artId: string;
  name: string;
  category: 'flow' | 'quality' | 'predictability' | 'value';
  targetValue: number;
  currentValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

// ===================== FEATURE LEVEL =====================

export interface Feature {
  id: string;
  artId: string;
  capabilityId?: string; // if part of a capability
  epicId?: string; // direct link to epic if no capability
  title: string;
  description: string;
  benefitHypothesis: string;
  acceptanceCriteria: string[];
  wsjfScore: number;
  status: 'funnel' | 'analyzing' | 'backlog' | 'implementing' | 'done';
  targetPI: string; // PI ID
  actualPI?: string; // if delivered in different PI
  owner: string;
  stories: string[]; // Story IDs
  dependencies: FeatureDependency[];
  estimatedStoryPoints: number;
  actualStoryPoints: number;
  estimatedCost: number;
  actualCost: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  linkedOKRs: string[];
}

export interface FeatureDependency {
  id: string;
  sourceFeatureId: string;
  targetFeatureId: string;
  type: 'blocks' | 'blocked-by' | 'related' | 'data-dependency' | 'api-dependency';
  health: 'green' | 'yellow' | 'red';
  description: string;
  impactIfDelayed: string;
  financialImpact: number;
  scheduleImpactDays: number;
}

// ===================== TEAM LEVEL =====================

export interface Team {
  id: string;
  artId: string;
  name: string;
  type: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem';
  scrumMaster: string;
  productOwner: string;
  members: TeamMember[];
  capacity: number; // story points per sprint
  currentIteration: string; // Iteration ID
  velocity: number; // rolling average
}

export interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  role: 'RTE' | 'PM' | 'PO' | 'Architect' | 'Developer' | 'QA' | 'BA' | 'Scrum Master' | 'UX' | 'DevOps';
  allocation: number; // 0-100 percentage to this team
  dailyCostRate: number; // £ per day
  skills: string[];
  availability: number; // 0-100 percentage (accounting for PTO, meetings, etc.)
}

export interface Iteration {
  id: string;
  piId: string;
  teamId: string;
  name: string; // e.g., "Sprint 2025-Q1-1"
  number: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  plannedCapacity: number; // story points
  committedPoints: number;
  completedPoints: number;
  stories: string[]; // Story IDs
  goals: string[];
  retrospectiveNotes?: string;
}

// ===================== STORY LEVEL =====================

export interface Story {
  id: string;
  featureId: string;
  iterationId: string;
  teamId: string;
  title: string;
  description: string;
  userStory: string; // "As a... I want... So that..."
  acceptanceCriteria: string[];
  storyPoints: number;
  status: 'backlog' | 'ready' | 'in-progress' | 'in-review' | 'done' | 'accepted';
  priority: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
  tasks: string[]; // Task IDs
  dependencies: StoryDependency[];
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  blockers: string[];
}

export interface StoryDependency {
  id: string;
  sourceStoryId: string;
  targetStoryId: string;
  type: 'blocks' | 'blocked-by' | 'related';
  description: string;
}

// ===================== TASK LEVEL =====================

export interface Task {
  id: string;
  storyId: string;
  title: string;
  description: string;
  type: 'development' | 'testing' | 'documentation' | 'design' | 'devops' | 'research';
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'blocked';
  assigneeId: string;
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  priority: 'low' | 'medium' | 'high';
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  blockedBy: string[]; // Task IDs
  blockedReason?: string;
  dailyRate: number; // inherited from assignee or overridden
}

// ===================== CROSS-CUTTING: DEPENDENCIES =====================

export interface Dependency {
  id: string;
  level: 'epic' | 'capability' | 'feature' | 'story' | 'task';
  sourceId: string;
  sourceName: string;
  sourceType: string;
  targetId: string;
  targetName: string;
  targetType: string;
  type: 'blocks' | 'blocked-by' | 'data-dependency' | 'api-dependency' | 'resource-dependency' | 'related';
  health: 'green' | 'yellow' | 'red';
  description: string;
  impactIfDelayed: string;
  financialImpact: number;
  scheduleImpactDays: number;
  owner: string;
  mitigationPlan?: string;
  resolutionDate?: string;
  createdDate: string;
  lastUpdated: string;
}

// ===================== CROSS-CUTTING: FINANCIALS =====================

export interface FinancialSnapshot {
  id: string;
  entityType: 'portfolio' | 'value-stream' | 'art' | 'epic' | 'feature' | 'team';
  entityId: string;
  entityName: string;
  snapshotDate: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'pi';
  
  // Budget
  totalBudget: number;
  allocatedBudget: number;
  contingency: number;
  
  // Actuals
  actualSpend: number;
  laborCost: number;
  vendorCost: number;
  infrastructureCost: number;
  otherCosts: number;
  
  // Forecast
  forecastAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
  
  // Earned Value
  plannedValue: number; // BCWS - Budgeted Cost of Work Scheduled
  earnedValue: number; // BCWP - Budgeted Cost of Work Performed
  actualCost: number; // ACWP - Actual Cost of Work Performed
  scheduleVariance: number; // EV - PV
  costVariance: number; // EV - AC
  schedulePerformanceIndex: number; // EV / PV
  costPerformanceIndex: number; // EV / AC
  
  // ROI
  projectedROI: number;
  roiConfidence: number;
  paybackMonths: number;
  
  currency: '£' | '$' | '€';
}

// ===================== CROSS-CUTTING: RISK =====================

export interface RiskRegisterEntry {
  id: string;
  level: 'portfolio' | 'art' | 'feature' | 'story';
  entityId: string;
  entityName: string;
  title: string;
  description: string;
  category: 'schedule' | 'budget' | 'resource' | 'technical' | 'external' | 'scope';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskScore: number; // probability * impact
  status: 'identified' | 'analyzing' | 'mitigating' | 'resolved' | 'accepted';
  owner: string;
  mitigationPlan: string;
  contingencyPlan: string;
  triggerConditions: string[];
  financialExposure: number;
  scheduleExposureDays: number;
  identifiedDate: string;
  targetResolutionDate: string;
  actualResolutionDate?: string;
  linkedDependencies: string[];
}

// ===================== CROSS-CUTTING: OKR/KPI LINKAGE =====================

export interface OKRAlignment {
  id: string;
  okrId: string;
  okrLevel: 'portfolio' | 'art' | 'team';
  linkedEntityType: 'epic' | 'capability' | 'feature' | 'story';
  linkedEntityId: string;
  linkedEntityName: string;
  contributionWeight: number; // 0-100, how much this entity contributes to OKR
  lastUpdated: string;
}

export interface KPIMetricStream {
  id: string;
  kpiId: string;
  sourceEntityType: 'portfolio' | 'value-stream' | 'art' | 'team' | 'feature';
  sourceEntityId: string;
  metricType: 'velocity' | 'throughput' | 'lead-time' | 'cycle-time' | 'defect-rate' | 'customer-sat' | 'revenue' | 'cost-savings';
  aggregationMethod: 'sum' | 'average' | 'latest' | 'min' | 'max';
  refreshFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
}

// ===================== COMPLETE PORTFOLIO =====================

export interface SAFe6Portfolio {
  // Portfolio Level
  strategicThemes: StrategicTheme[];
  valueStreams: ValueStream[];
  portfolioEpics: PortfolioEpic[];
  portfolioOKRs: PortfolioOKR[];
  portfolioKPIs: PortfolioKPI[];
  
  // Large Solution Level (optional)
  solutionTrains: SolutionTrain[];
  capabilities: Capability[];
  
  // ART Level
  arts: AgileReleaseTrain[];
  programIncrements: ProgramIncrement[];
  features: Feature[];
  artKPIs: ARTKPI[];
  
  // Team Level
  teams: Team[];
  iterations: Iteration[];
  stories: Story[];
  tasks: Task[];
  teamMembers: TeamMember[];
  
  // Cross-cutting
  dependencies: Dependency[];
  financialSnapshots: FinancialSnapshot[];
  riskRegister: RiskRegisterEntry[];
  okrAlignments: OKRAlignment[];
  kpiMetricStreams: KPIMetricStream[];
}

// ===================== IMPACT ANALYSIS TYPES =====================

export interface ImpactAnalysisRequest {
  changeType: 'delay' | 'budget-cut' | 'resource-change' | 'scope-change' | 'dependency-failure';
  entityType: 'epic' | 'feature' | 'story' | 'task' | 'resource' | 'team';
  entityId: string;
  changeDetails: {
    delayDays?: number;
    budgetChange?: number;
    resourceId?: string;
    allocationChange?: number;
    scopeChange?: string;
  };
}

export interface ImpactAnalysisResult {
  request: ImpactAnalysisRequest;
  analysisTimestamp: string;
  
  // Schedule Impact
  directScheduleImpact: {
    entityId: string;
    entityName: string;
    originalEndDate: string;
    newEndDate: string;
    delayDays: number;
  };
  cascadeScheduleImpacts: {
    entityId: string;
    entityName: string;
    entityType: string;
    originalEndDate: string;
    newEndDate: string;
    delayDays: number;
    impactPath: string[]; // chain of dependencies
  }[];
  
  // Financial Impact
  directCostImpact: number;
  cascadeCostImpact: number;
  totalCostImpact: number;
  roiImpact: {
    originalROI: number;
    newROI: number;
    percentChange: number;
  };
  
  // Resource Impact
  resourceConflicts: {
    resourceId: string;
    resourceName: string;
    conflictingTasks: string[];
    overallocationPercentage: number;
  }[];
  
  // Risk Assessment
  newRisks: string[];
  escalatedRisks: string[];
  
  // Recommendations
  mitigationOptions: {
    option: string;
    costToImplement: number;
    scheduleRecoveryDays: number;
    feasibility: 'low' | 'medium' | 'high';
  }[];
}

// ===================== HELPER FUNCTIONS =====================

export function calculateSlippage(planned: string, actual: string | undefined): number {
  if (!actual) return 0;
  const plannedDate = new Date(planned);
  const actualDate = new Date(actual);
  return Math.ceil((actualDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateEarnedValue(
  plannedValue: number,
  percentComplete: number,
  actualCost: number
): { earnedValue: number; sv: number; cv: number; spi: number; cpi: number } {
  const earnedValue = plannedValue * (percentComplete / 100);
  const sv = earnedValue - plannedValue; // Schedule Variance
  const cv = earnedValue - actualCost; // Cost Variance
  const spi = plannedValue > 0 ? earnedValue / plannedValue : 1; // Schedule Performance Index
  const cpi = actualCost > 0 ? earnedValue / actualCost : 1; // Cost Performance Index
  return { earnedValue, sv, cv, spi, cpi };
}

export function calculateCostImpactFromDelay(
  delayDays: number,
  dailyBurnRate: number,
  penaltiesPerDay: number = 0
): number {
  return delayDays * (dailyBurnRate + penaltiesPerDay);
}
