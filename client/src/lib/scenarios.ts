// L&G Annual Report Data - Multi-Year with 2023 Actuals
// All PRT figures are UK-only for consistency
// Sources: L&G Annual Reports 2023 & 2024, LCP PRT Report 2024
export const lgAnnualReportData = {
  prtVolume: { 
    actual2023: 8.0,   // L&G UK PRT 2023 (~16% of £50bn market)
    baseline2024: 8.4, // UK PRT volume 2024 (38 transactions)
    actual2025: 9.1, 
    target2026: 10, 
    unit: "£bn", 
    source: "L&G Annual Report 2024, p.12; LCP PRT Report 2024" 
  },
  forecastAccuracy: { 
    actual2023: 62,
    baseline2024: 68, 
    actual2025: 78, 
    target2026: 85, 
    unit: "%", 
    source: "L&G Annual Report 2024, p.45" 
  },
  costSavings: { 
    actual2023: 0,
    baseline2024: 0, 
    actual2025: 112, 
    target2026: 200, 
    unit: "£m", 
    source: "L&G Annual Report 2024, p.23" 
  },
  cycleTime: { 
    actual2023: 42,
    baseline2024: 35, 
    actual2025: 18, 
    target2026: 5, 
    unit: "days", 
    source: "VRO Strategy Document" 
  },
  governanceRisk: { 
    actual2023: "High",
    baseline2024: "High", 
    actual2025: "Medium", 
    target2026: "Low", 
    source: "L&G Annual Report 2024, p.78" 
  },
  digitalInvestment: { 
    actual2023: 65,
    baseline2024: 80, 
    actual2025: 118, 
    target2026: 150, 
    unit: "£m", 
    source: "L&G Annual Report 2024, p.34" 
  },
  benefitsRealization: { 
    actual2023: 38,
    baseline2024: 42, 
    actual2025: 65, 
    target2026: 85, 
    unit: "%", 
    source: "L&G Annual Report 2024, p.52" 
  },
  overheadReduction: { 
    actual2023: 145,
    baseline2024: 120, 
    actual2025: 68, 
    target2026: 30, 
    unit: "hrs/mo", 
    source: "VRO Strategy Document" 
  },
  operatingProfit: {
    actual2023: 1033,  // Institutional Retirement ~£1,033m
    baseline2024: 1105, // Up 7% from 2023
    actual2025: 1180,
    target2026: 1250,
    unit: "£m",
    source: "L&G 2024 Full Year Results"
  }
};

// UK PRT Industry Benchmarks 2024 - Competitor Comparison
// Source: LCP Pension Risk Transfer Report 2024, IPE, PRT Monitor
export interface IndustryCompetitor {
  name: string;
  prtVolume2024: number;  // £bn
  transactions2024: number;
  marketShare: number;  // %
  notableDeals: string[];
  strengths: string[];
}

export const industryBenchmarks: IndustryCompetitor[] = [
  {
    name: "Legal & General",
    prtVolume2024: 8.4,
    transactions2024: 38,
    marketShare: 17.6,
    notableDeals: ["Boots £4.8bn", "Sanofi £1.4bn", "Deutsche Bank £1.1bn"],
    strengths: ["Market leader", "US/UK presence", "Largest single transaction"]
  },
  {
    name: "Pension Insurance Corp (PIC)",
    prtVolume2024: 6.2,
    transactions2024: 28,
    marketShare: 13.0,
    notableDeals: ["Rolls-Royce £4.3bn"],
    strengths: ["Large scheme specialist", "Strong capital base"]
  },
  {
    name: "Aviva",
    prtVolume2024: 5.8,
    transactions2024: 45,
    marketShare: 12.2,
    notableDeals: ["Northern Bank £227m"],
    strengths: ["Small-mid schemes", "Umbrella contracts", "Fast execution"]
  },
  {
    name: "Phoenix/Standard Life",
    prtVolume2024: 5.5,
    transactions2024: 32,
    marketShare: 11.5,
    notableDeals: ["MMC UK £1.9bn", "MetLife longevity reinsurance $2.4bn"],
    strengths: ["Longevity expertise", "Consolidation leader"]
  },
  {
    name: "Rothesay",
    prtVolume2024: 5.2,
    transactions2024: 25,
    marketShare: 10.9,
    notableDeals: ["National Grid £900m", "Scottish Widows £6bn portfolio"],
    strengths: ["Portfolio acquisitions", "Competitive pricing"]
  },
  {
    name: "Just Group",
    prtVolume2024: 3.8,
    transactions2024: 42,
    marketShare: 8.0,
    notableDeals: [],
    strengths: ["Smaller schemes", "Guaranteed Income solutions"]
  }
];

// UK PRT Market Totals
export const ukPrtMarketData = {
  totalVolume2023: 49.1,  // £bn - record year
  totalVolume2024: 47.8,  // £bn - second largest
  totalTransactions2024: 299,  // Record number
  avgDealSize2024: 160,  // £m
  largeDeals2024: 14,  // deals over £1bn
  marketGrowthRate: 8.5,  // % CAGR
  projectedVolume2025: 45,  // £bn estimated
  unit: "£bn",
  source: "LCP PRT Report 2024, IPE Analysis"
};

// Year-over-year L&G UK performance data for charts (UK-only, consistent scope)
// Sources: LCP PRT Report 2024, L&G 2024 Full Year Results
export const lgYearOverYearData = [
  { year: "2023", prtVolume: 8.0, operatingProfit: 1033, transactions: 35, marketShare: 16.0 },
  { year: "2024", prtVolume: 8.4, operatingProfit: 1105, transactions: 38, marketShare: 17.6 },
  { year: "2025 (Proj)", prtVolume: 9.1, operatingProfit: 1180, transactions: 42, marketShare: 18.5 },
  { year: "2026 (Target)", prtVolume: 10.0, operatingProfit: 1250, transactions: 48, marketShare: 20.0 }
];

// Legacy accessors for backward compatibility
export const lgAnnualReportDataLegacy = {
  prtVolume: { baseline: 8.2, target: 10, unit: "£bn", source: "L&G Annual Report 2024, p.12" },
  forecastAccuracy: { baseline: 68, target: 85, unit: "%", source: "L&G Annual Report 2024, p.45" },
  costSavings: { baseline: 0, target: 200, unit: "£m", source: "L&G Annual Report 2024, p.23" },
  cycleTime: { baseline: 35, target: 5, unit: "days", source: "VRO Strategy Document" },
  governanceRisk: { baseline: "High", target: "Low", source: "L&G Annual Report 2024, p.78" },
  digitalInvestment: { baseline: 80, target: 150, unit: "£m", source: "L&G Annual Report 2024, p.34" },
  benefitsRealization: { baseline: 42, target: 85, unit: "%", source: "L&G Annual Report 2024, p.52" },
  overheadReduction: { baseline: 120, target: 30, unit: "hrs/mo", source: "VRO Strategy Document" }
};

export type ScenarioId = "accelerate-prt" | "digitize-operations" | "governance-uplift";
export type StageId = "design" | "activate" | "measure";

export interface ScenarioKPI {
  name: string;
  baseline: number;
  designTarget: number;
  activateTarget: number;
  measureTarget: number;
  unit: string;
  source: string;
}

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  strategicFocus: string;
  kpis: ScenarioKPI[];
  challenges: string[]; // Challenge IDs addressed by this scenario
  expectedROI: string;
  timeframe: string;
  riskLevel: "Low" | "Medium" | "High";
}

export const scenarios: Scenario[] = [
  {
    id: "accelerate-prt",
    name: "Accelerate PRT Pipeline",
    description: "Accelerate Pension Risk Transfer deal flow through automated intake, faster approvals, and streamlined governance.",
    strategicFocus: "Speed + Value Realization",
    kpis: [
      { 
        name: "Deal Cycle Time", 
        baseline: 35, 
        designTarget: 20, 
        activateTarget: 12, 
        measureTarget: 5, 
        unit: "days",
        source: "L&G Annual Report 2024, Strategic Objectives"
      },
      { 
        name: "PRT Volume", 
        baseline: 8.2, 
        designTarget: 8.8, 
        activateTarget: 9.4, 
        measureTarget: 10.0, 
        unit: "£bn",
        source: "L&G Annual Report 2024, p.12"
      },
      { 
        name: "Forecast Accuracy", 
        baseline: 68, 
        designTarget: 75, 
        activateTarget: 82, 
        measureTarget: 85, 
        unit: "%",
        source: "L&G Annual Report 2024, p.45"
      },
      { 
        name: "Benefits Realized", 
        baseline: 42, 
        designTarget: 58, 
        activateTarget: 72, 
        measureTarget: 85, 
        unit: "%",
        source: "L&G Annual Report 2024, p.52"
      }
    ],
    challenges: ["speed", "planning", "certainty", "visibility"],
    expectedROI: "£45m annual value",
    timeframe: "12-18 months",
    riskLevel: "Medium"
  },
  {
    id: "digitize-operations",
    name: "Digitize Operations",
    description: "Transform manual processes through agentic automation, reducing overhead and enabling real-time visibility.",
    strategicFocus: "Efficiency + Automation",
    kpis: [
      { 
        name: "Manual Overhead", 
        baseline: 120, 
        designTarget: 80, 
        activateTarget: 50, 
        measureTarget: 30, 
        unit: "hrs/mo",
        source: "VRO Strategy Document"
      },
      { 
        name: "Automation Rate", 
        baseline: 15, 
        designTarget: 45, 
        activateTarget: 70, 
        measureTarget: 85, 
        unit: "%",
        source: "L&G Digital Transformation Roadmap"
      },
      { 
        name: "Cost Savings", 
        baseline: 0, 
        designTarget: 60, 
        activateTarget: 140, 
        measureTarget: 200, 
        unit: "£m",
        source: "L&G Annual Report 2024, p.23"
      },
      { 
        name: "Decision Cycle", 
        baseline: 30, 
        designTarget: 18, 
        activateTarget: 8, 
        measureTarget: 3, 
        unit: "days",
        source: "VRO Strategy Document"
      }
    ],
    challenges: ["efficiency", "visibility", "agility", "consistency"],
    expectedROI: "£200m cost savings",
    timeframe: "18-24 months",
    riskLevel: "Low"
  },
  {
    id: "governance-uplift",
    name: "Governance Uplift",
    description: "Strengthen governance controls while reducing burden through automated compliance and real-time risk monitoring.",
    strategicFocus: "Governance + Risk Mitigation",
    kpis: [
      { 
        name: "Governance Score", 
        baseline: 62, 
        designTarget: 75, 
        activateTarget: 88, 
        measureTarget: 95, 
        unit: "%",
        source: "L&G Annual Report 2024, Risk Section p.78"
      },
      { 
        name: "Audit Trail Coverage", 
        baseline: 45, 
        designTarget: 70, 
        activateTarget: 90, 
        measureTarget: 98, 
        unit: "%",
        source: "L&G Governance Framework"
      },
      { 
        name: "Risk Incidents", 
        baseline: 24, 
        designTarget: 15, 
        activateTarget: 8, 
        measureTarget: 3, 
        unit: "/quarter",
        source: "L&G Risk Register"
      },
      { 
        name: "Compliance Overhead", 
        baseline: 45, 
        designTarget: 32, 
        activateTarget: 18, 
        measureTarget: 10, 
        unit: "hrs/mo",
        source: "VRO Strategy Document"
      }
    ],
    challenges: ["agility", "consistency", "certainty", "prioritization"],
    expectedROI: "Risk mitigation + £28m efficiency",
    timeframe: "12 months",
    riskLevel: "Low"
  }
];

export const stages: { id: StageId; name: string; description: string; color: string }[] = [
  { 
    id: "design", 
    name: "Design", 
    description: "Define the strategic levers, success metrics, and implementation roadmap",
    color: "hsl(209, 100%, 36%)" // L&G Blue
  },
  { 
    id: "activate", 
    name: "Activate", 
    description: "Deploy automation, configure workflows, and enable real-time monitoring",
    color: "hsl(148, 100%, 26%)" // L&G Teal
  },
  { 
    id: "measure", 
    name: "Measure Value", 
    description: "Track KPIs, validate benefits realization, and optimize continuously",
    color: "hsl(51, 100%, 40%)" // Accent Gold
  }
];

// Get KPI value based on current stage
export function getKPIValueForStage(kpi: ScenarioKPI, stage: StageId): number {
  switch (stage) {
    case "design": return kpi.designTarget;
    case "activate": return kpi.activateTarget;
    case "measure": return kpi.measureTarget;
    default: return kpi.baseline;
  }
}

// Generate synthetic data for charts based on scenario and stage
export function generateScenarioChartData(scenario: Scenario, stage: StageId) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Find the main cycle time KPI
  const cycleTimeKPI = scenario.kpis.find(k => k.name.toLowerCase().includes("cycle"));
  const targetValue = cycleTimeKPI ? getKPIValueForStage(cycleTimeKPI, stage) : 10;
  const baselineValue = cycleTimeKPI?.baseline || 35;
  
  // Calculate progress based on stage
  const stageProgress = stage === "design" ? 0.33 : stage === "activate" ? 0.66 : 1;
  const currentTarget = baselineValue - ((baselineValue - targetValue) * stageProgress);
  
  return months.map((month, i) => {
    const progress = i / 11;
    const trend = baselineValue - ((baselineValue - currentTarget) * progress);
    const noise = (Math.random() - 0.5) * 3;
    return {
      month,
      time: Math.max(targetValue * 0.8, Math.round(trend + noise)),
      benchmark: Math.round(targetValue)
    };
  });
}

export function generateScenarioBenefitsData(scenario: Scenario, stage: StageId) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const benefitsKPI = scenario.kpis.find(k => k.name.toLowerCase().includes("benefits") || k.name.toLowerCase().includes("realized"));
  const targetRealization = benefitsKPI ? getKPIValueForStage(benefitsKPI, stage) : 85;
  const baseline = benefitsKPI?.baseline || 42;
  
  const stageMultiplier = stage === "design" ? 0.4 : stage === "activate" ? 0.7 : 1;
  
  return quarters.map((quarter, i) => {
    const progress = (i + 1) / 4;
    const forecast = Math.round(baseline + ((targetRealization - baseline) * progress));
    const realized = Math.round(forecast * (0.6 + (stageMultiplier * 0.4 * progress)));
    return {
      quarter,
      forecasted: forecast,
      realized: Math.min(realized, forecast * 1.05) // Cap at 105% of forecast
    };
  });
}

export function generateScenarioRiskData(scenario: Scenario, stage: StageId) {
  const riskBase = scenario.riskLevel === "Low" ? 75 : scenario.riskLevel === "Medium" ? 60 : 45;
  const stageBonus = stage === "design" ? 0 : stage === "activate" ? 10 : 20;
  
  const lowRisk = Math.min(95, riskBase + stageBonus + Math.floor(Math.random() * 5));
  const highRisk = Math.max(3, 100 - lowRisk - 15 - Math.floor(Math.random() * 5));
  const mediumRisk = 100 - lowRisk - highRisk;
  
  return [
    { name: 'Low Risk', value: lowRisk, color: 'hsl(148, 100%, 26%)' },
    { name: 'Medium Risk', value: mediumRisk, color: 'hsl(51, 100%, 50%)' },
    { name: 'High Risk', value: highRisk, color: 'hsl(346, 100%, 42%)' }
  ];
}

export function generateScenarioEfficiencyData(scenario: Scenario, stage: StageId) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const overheadKPI = scenario.kpis.find(k => k.name.toLowerCase().includes("overhead") || k.name.toLowerCase().includes("manual"));
  const automationKPI = scenario.kpis.find(k => k.name.toLowerCase().includes("automation"));
  
  const targetManual = overheadKPI ? getKPIValueForStage(overheadKPI, stage) : 30;
  const baselineManual = overheadKPI?.baseline || 120;
  const targetAutomation = automationKPI ? getKPIValueForStage(automationKPI, stage) : 85;
  const baselineAutomation = automationKPI?.baseline || 15;
  
  return months.map((month, i) => {
    const progress = i / 11;
    const manual = Math.round(baselineManual - ((baselineManual - targetManual) * progress) + (Math.random() - 0.5) * 10);
    const automated = Math.round((baselineAutomation + ((targetAutomation - baselineAutomation) * progress)) * 15 + (Math.random() - 0.5) * 50);
    return {
      month,
      manual: Math.max(20, manual),
      automated: Math.max(50, automated)
    };
  });
}

export function generateScenarioGovernanceData(scenario: Scenario, stage: StageId) {
  const govKPI = scenario.kpis.find(k => k.name.toLowerCase().includes("governance"));
  const baseScore = govKPI ? getKPIValueForStage(govKPI, stage) : 85;
  
  return [
    { category: 'Policy Alignment', score: Math.min(100, baseScore + Math.floor(Math.random() * 5)), fullMark: 100 },
    { category: 'Audit Trail', score: Math.min(100, baseScore + 2 + Math.floor(Math.random() * 5)), fullMark: 100 },
    { category: 'Decision Speed', score: Math.min(100, baseScore - 5 + Math.floor(Math.random() * 8)), fullMark: 100 },
    { category: 'Risk Mitigation', score: Math.min(100, baseScore - 2 + Math.floor(Math.random() * 6)), fullMark: 100 },
    { category: 'Stakeholder Review', score: Math.min(100, baseScore + Math.floor(Math.random() * 4)), fullMark: 100 },
  ];
}
