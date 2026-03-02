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

import { type SAFePortfolioStage } from './buPrograms';

// ============================================================================
// TYPE DEFINITIONS (kept for backwards compatibility)
// Note: These are defined locally to avoid conflicts with @/types/ontology
// ============================================================================

export interface ProjectKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface KeyResult {
  id: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  contributingKPIs: string[];
  calculationMethod: string;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  overallProgress: number;
  strategicPriority: 'critical' | 'high' | 'medium';
  owner: string;
  buAlignment: string[];
}

export interface VROAggregatedMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  sourceOKRs: string[];
  calculationFormula: string;
  breakdown: { source: string; contribution: number; value: number }[];
  lastUpdated: Date;
}

export const GROUP_FUNCTIONS = [
  'Regional Utility',
  'Renewables Division',
  'Corporate & Other'
] as const;

export type GroupFunction = typeof GROUP_FUNCTIONS[number];

export const SAFE_STAGES: SAFePortfolioStage[] = [
  'funnel',
  'reviewing',
  'analyzing',
  'portfolio-backlog',
  'implementing',
  'done'
];

export const SAFE_STAGE_LABELS: Record<SAFePortfolioStage, string> = {
  'funnel': 'Funnel',
  'reviewing': 'Reviewing',
  'analyzing': 'Analyzing',
  'portfolio-backlog': 'Portfolio Backlog',
  'implementing': 'Implementing',
  'done': 'Done'
};

// ============================================================================
// EMPTY DATA ARRAYS - Data now comes from Palantir API
// Use: useDashboardMetrics() from @/hooks/usePalantirOntology
// ============================================================================

/** @deprecated Use useOntologyProjects() hook instead */
export const EXPANDED_PMO_PROJECTS: any[] = [];

/** @deprecated Use Palantir ontology data instead */
export const PROJECT_KPIS: Record<string, ProjectKPI[]> = {};

/** @deprecated Use useOntologyOKRs() hook instead */
export const OKRS: OKR[] = [];

// ============================================================================
// HELPER FUNCTIONS - Return empty/default values
// Use Palantir API hooks instead
// ============================================================================

/** @deprecated Use Palantir ontology data instead */
export function calculateVROMetricsFromProjects(): VROAggregatedMetric[] {
  console.warn('[DEPRECATED] calculateVROMetricsFromProjects - Use useDashboardMetrics() from @/hooks/usePalantirOntology');
  return [];
}

/** @deprecated Use Palantir ontology data instead */
export function getProjectsByStageAndFunction(): Record<SAFePortfolioStage, Record<string, number>> {
  return SAFE_STAGES.reduce((acc, stage) => {
    acc[stage] = {};
    return acc;
  }, {} as Record<SAFePortfolioStage, Record<string, number>>);
}

/** @deprecated Use Palantir ontology data instead */
export function getStageCounts(): Record<SAFePortfolioStage, number> {
  return SAFE_STAGES.reduce((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {} as Record<SAFePortfolioStage, number>);
}

/** @deprecated Use Palantir ontology data instead */
export function getGroupFunctionCounts(): Record<string, number> {
  return {};
}

// ============================================================================
// PMO METRICS INTERFACES
// ============================================================================

export interface PMOOverviewMetrics {
  totalProjects: number;
  greenProjects: number;
  amberProjects: number;
  redProjects: number;
  avgBudgetUtilization: number;
  avgDeliverableCompletion: number;
  avgVelocity: number;
  avgPredictability: number;
}

export interface PMOMetricWithProjects {
  metric: { name: string; value: number; target: number; status: string };
  projects: any[];
}

export interface PMOMetricsDetailed {
  overview: PMOOverviewMetrics;
  budgetMetrics: PMOMetricWithProjects;
  timelineMetrics: PMOMetricWithProjects;
  deliverableMetrics: PMOMetricWithProjects;
  velocityMetrics: PMOMetricWithProjects;
  predictabilityMetrics: PMOMetricWithProjects;
  byStage: Record<SAFePortfolioStage, any[]>;
  byGroupFunction: Record<string, any[]>;
}

/** @deprecated Use useDashboardMetrics() hook instead */
export function getPMOMetricsDetailed(): PMOMetricsDetailed {
  console.warn('[DEPRECATED] getPMOMetricsDetailed - Use useDashboardMetrics() from @/hooks/usePalantirOntology');
  return {
    overview: {
      totalProjects: 0,
      greenProjects: 0,
      amberProjects: 0,
      redProjects: 0,
      avgBudgetUtilization: 0,
      avgDeliverableCompletion: 0,
      avgVelocity: 0,
      avgPredictability: 0
    },
    budgetMetrics: { metric: { name: 'Budget', value: 0, target: 0, status: 'green' }, projects: [] },
    timelineMetrics: { metric: { name: 'Timeline', value: 0, target: 0, status: 'green' }, projects: [] },
    deliverableMetrics: { metric: { name: 'Deliverables', value: 0, target: 0, status: 'green' }, projects: [] },
    velocityMetrics: { metric: { name: 'Velocity', value: 0, target: 0, status: 'green' }, projects: [] },
    predictabilityMetrics: { metric: { name: 'Predictability', value: 0, target: 0, status: 'green' }, projects: [] },
    byStage: SAFE_STAGES.reduce((acc, stage) => { acc[stage] = []; return acc; }, {} as Record<SAFePortfolioStage, any[]>),
    byGroupFunction: {}
  };
}

/** @deprecated Use Palantir ontology data instead */
export function getProjectsByMetricId(metricId: string): any[] {
  return [];
}

/** @deprecated Use useDashboardMetrics() hook instead */
export function getPMOOverviewMetrics(): PMOOverviewMetrics {
  console.warn('[DEPRECATED] getPMOOverviewMetrics - Use useDashboardMetrics() from @/hooks/usePalantirOntology');
  return {
    totalProjects: 0,
    greenProjects: 0,
    amberProjects: 0,
    redProjects: 0,
    avgBudgetUtilization: 0,
    avgDeliverableCompletion: 0,
    avgVelocity: 0,
    avgPredictability: 0
  };
}

/** @deprecated Use Palantir ontology data instead */
export function calculateKeyResultProgress(kpiIds: string[]): number {
  return 0;
}

/** @deprecated Use Palantir ontology data instead */
export function calculateOKRProgress(okr: OKR): number {
  return okr.overallProgress || 0;
}

/** @deprecated Use Palantir ontology data instead */
export function getTracedVROROI(): {
  roi: number;
  breakdown: { okrId: string; objective: string; progress: number; weight: number; contribution: number }[]
} {
  return { roi: 0, breakdown: [] };
}

export interface TraceableMetricBreakdown {
  level: 'okr' | 'kr' | 'kpi' | 'project';
  id: string;
  name: string;
  value: number;
  contribution: number;
  children?: TraceableMetricBreakdown[];
}

/** @deprecated Use Palantir ontology data instead */
export function getFullTraceabilityChain(okrId: string): TraceableMetricBreakdown | null {
  return null;
}
