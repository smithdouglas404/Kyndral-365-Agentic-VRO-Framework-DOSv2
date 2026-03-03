// ============================================================================
// AGENT DATA TRANSFORMERS - STUBBED
// Use API hooks instead of these transformers
// ============================================================================

export type DataMode = 'PMO' | 'VRO';

export interface SimulationMultipliers {
  eventFrequency: number;
  riskSeverity: number;
  opportunityRate: number;
  confidenceLevel: number;
}

// DEPRECATED: Fetch from API
export function getMultipliers(mode: DataMode): SimulationMultipliers {
  return {
    eventFrequency: 1,
    riskSeverity: 1,
    opportunityRate: 1,
    confidenceLevel: 0.85
  };
}

// Types for backward compatibility
export interface TransformedCostCategory {
  category: string;
  amount: number;
  trend: string;
}

export interface TransformedSavingsOpportunity {
  opportunity: string;
  potential: number;
  status: string;
}

export interface TransformedGovernanceItem {
  project: string;
  requirement: string;
  status: string;
  dueDate: string;
}

export interface TransformedReadinessMetric {
  division: string;
  readiness: number;
  engagement: number;
  riskLevel: string;
}

export interface TransformedStakeholderGroup {
  group: string;
  count: number;
  engagement: number;
}

export interface TransformedTrainingProgram {
  program: string;
  completion: number;
  target: number;
}

export interface TransformedAdoptionMetric {
  division: string;
  adoption: number;
  training: number;
  satisfaction: number;
}

export interface TransformedInitiative {
  name: string;
  status: string;
  completion: number;
  impact: string;
}

export interface TransformedMilestone {
  project: string;
  milestone: string;
  dueDate: string;
  status: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  budget?: { planned: number; actual: number };
  deliverables?: string[];
  division?: string;
  aiInsight?: string;
}

export interface TransformedDeadline {
  task: string;
  date: string;
  status: string;
  owner: string;
  division: string;
  aiPrediction: string;
}

export interface LinkedInitiative {
  name: string;
  status: string;
  division: string;
  phase: string;
  contribution: number;
  valueImpact: number;
}

export interface TransformedKeyResult {
  name: string;
  title?: string;
  target: number;
  current: number;
  status: string;
  progress?: number;
  linkedInitiatives?: LinkedInitiative[];
}

export interface ValueImpact {
  costSavings: number;
  revenueImpact: number;
}

export interface CollaboratingAgent {
  name: string;
  role: string;
  agentName?: string;
  lastSync?: string;
}

export interface TransformedObjective {
  id: string;
  name: string;
  title?: string;
  progress: number;
  status: string;
  division?: string;
  owner?: string;
  totalValueImpact?: ValueImpact;
  collaboratingAgents?: CollaboratingAgent[];
  keyResults: TransformedKeyResult[];
}

export function getObjectivesFromDivisions(mode: DataMode): TransformedObjective[] {
  return [];
}

export interface TransformedRoadmapItem {
  name: string;
  phase: string;
  startDate: string;
  endDate: string;
}

// DEPRECATED: Use API hooks instead
export function getCostCategoriesFromDivisions(mode: DataMode): TransformedCostCategory[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getSavingsOpportunitiesFromProjects(mode: DataMode): TransformedSavingsOpportunity[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getGovernanceItemsFromRiskData(mode: DataMode): TransformedGovernanceItem[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getRiskMetricsFromDivisions(mode: DataMode) {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getChangeReadinessFromDivisions(mode: DataMode): TransformedReadinessMetric[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getStakeholderGroupsFromDivisions(mode: DataMode): TransformedStakeholderGroup[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getTrainingProgramsFromOKRs(mode: DataMode): TransformedTrainingProgram[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getAdoptionMetricsFromDivisions(mode: DataMode): TransformedAdoptionMetric[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getInitiativesFromDivisions(mode: DataMode): TransformedInitiative[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getMilestonesFromProjects(mode: DataMode): TransformedMilestone[] {
  return [];
}

// DEPRECATED: Use API hooks instead
export function getDeadlinesFromProjects(mode: DataMode): TransformedRoadmapItem[] {
  return [];
}

// DEPRECATED: Use useCompanyOverview hook
export function getCompanyMetrics() {
  return {
    name: "Enterprise Corporation",
    employees: 50000,
    revenue: "$12.5B",
    marketCap: "$45B",
    totalProfit: 2.1,
    totalEmployees: 50000
  };
}
