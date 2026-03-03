// ============================================================================
// TYPE DEFINITIONS - Fetch actual data from APIs
// ============================================================================

export interface SegmentData {
  id: string;
  name: string;
  abbreviation: string;
  ceo: string;
  profit2023: number;
  profit2024: number;
  changePercent: number;
  description: string;
  kpis: KPI[];
  okrs: OKR[];
  potentialProjects: Project[];
  risks: SegmentRisk[];
  color: string;
}

// Legacy alias for backward compatibility
export type DivisionData = SegmentData;

export interface KPI {
  name: string;
  value2023: number | string;
  value2024: number | string;
  target2025: number | string;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "on-track" | "at-risk" | "off-track";
}

export interface OKR {
  objective: string;
  keyResults: { result: string; progress: number; target: number; unit: string }[];
  owner: string;
  dueDate: string;
}

export interface ProjectDependency {
  projectId: string;
  projectName: string;
  type: "blocks" | "blocked-by" | "related";
  health: "green" | "yellow" | "red";
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  expectedROI: string;
  priority: "high" | "medium" | "low";
  status: "proposed" | "in-progress" | "completed";
  aiRecommendation?: string;
  dependencies?: ProjectDependency[];
}

export interface SegmentRisk {
  type: string;
  level: "low" | "medium" | "high";
  description: string;
  mitigation: string;
}

// Legacy alias for backward compatibility
export type DivisionRisk = SegmentRisk;

export type AlertSeverity = "critical" | "warning" | "info" | "success";
export type AlertType = "prediction" | "anomaly" | "threshold" | "recommendation" | "collaboration";

export interface AIAlert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
  entityType: "project" | "division" | "portfolio" | "okr" | "risk" | "metric";
  entityId: string;
  entityName: string;
  actionLabel?: string;
  dismissed: boolean;
  confidence: number;
  agentSource: string;
}

// ============================================================================
// DATA - DEPRECATED: Fetch from API instead
// ============================================================================

// DEPRECATED: Use useCompanyOverview() hook
export const lgCompanyOverview = {
  yearsOfHistory: 0,
  employees: 0,
  adjustedOperatingProfit: { value: 0, unit: "$m", year: 2024 },
  assetsUnderManagement: { value: 0, unit: "$bn" },
  proprietaryAssets: { value: 0, unit: "GW" },
  fortune200: false,
  esgRatings: {
    sustainalytics: { percentile: 0, rating: "Unknown" },
    msci: "N/A"
  },
  ceo: "",
  cfo: "",
  cro: "",
  climateDirector: "",
  source: "Fetch from API",
  sourceUrl: ""
};

// DEPRECATED: Use useDivisions() hook from @/hooks/useNexteraData
export const segments: SegmentData[] = [];

// Legacy alias
export const divisions = segments;

// DEPRECATED: Use useClimateMetrics() hook
export const climateData: {
  emissionsReduction: { target2030: number; current: number; unit: string };
  renewableCapacity: { target2030: number; current: number; unit: string };
  carbonIntensity: { target: number; current: number; unit: string };
  categories: Array<{ name: string; value: number }>;
} = {
  emissionsReduction: { target2030: 0, current: 0, unit: "%" },
  renewableCapacity: { target2030: 0, current: 0, unit: "GW" },
  carbonIntensity: { target: 0, current: 0, unit: "kg CO2/MWh" },
  categories: []
};

// Types for risk data
interface SubRisk {
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface RiskCategory {
  id: string;
  name: string;
  color: string;
  subtitle?: string;
  subRisks: SubRisk[];
}

interface EmergingRisk {
  name: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  horizon: string;
}

interface ThreeLinesItem {
  line: string;
  description: string;
}

interface RiskData {
  categories: RiskCategory[];
  overview?: {
    cro?: string;
    largestExposures?: string[];
  };
  emergingRisks?: {
    keyEmergingRisks: EmergingRisk[];
  };
  threeLines?: ThreeLinesItem[];
}

// DEPRECATED: Use useRisks() hook
export const riskData: RiskData = {
  categories: [],
  overview: {
    cro: 'Chief Risk Officer',
    largestExposures: []
  },
  emergingRisks: {
    keyEmergingRisks: []
  },
  threeLines: []
};

// DEPRECATED: Use useAlerts() hook from @/hooks/useAlerts
export const aiAlerts: AIAlert[] = [];

// DEPRECATED: Fetch from API or calculate from division data
export const industryBenchmarks = {
  utilityAverageROI: 0,
  renewableGrowthRate: 0,
  gridReliability: 0,
  customerSatisfaction: 0
};
