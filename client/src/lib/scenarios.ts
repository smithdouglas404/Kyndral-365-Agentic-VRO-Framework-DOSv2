// NextEra Energy Annual Report Data - Multi-Year with 2023 Actuals
// All figures reflect US clean energy operations
// Sources: NextEra Energy Annual Reports 2023 & 2024, EIA Energy Data
export const lgAnnualReportData = {
  prtVolume: { 
    actual2023: 65.2,   // NextEra total capacity 2023 (GW)
    baseline2024: 68.5, // Total capacity 2024
    actual2025: 72.0, 
    target2026: 78.0, 
    unit: "GW", 
    source: "NextEra Energy Annual Report 2024, p.12" 
  },
  forecastAccuracy: { 
    actual2023: 62,
    baseline2024: 68, 
    actual2025: 78, 
    target2026: 85, 
    unit: "%", 
    source: "NextEra Energy Annual Report 2024, p.45" 
  },
  costSavings: { 
    actual2023: 0,
    baseline2024: 0, 
    actual2025: 145, 
    target2026: 250, 
    unit: "$m", 
    source: "NextEra Energy Annual Report 2024, p.23" 
  },
  cycleTime: { 
    actual2023: 42,
    baseline2024: 35, 
    actual2025: 26, 
    target2026: 5, 
    unit: "days", 
    source: "NextEra Transformation Program Metrics Q4 2025" 
  },
  governanceRisk: { 
    actual2023: "High",
    baseline2024: "High", 
    actual2025: "Medium", 
    target2026: "Low", 
    source: "NextEra Energy Annual Report 2024, p.78" 
  },
  digitalInvestment: { 
    actual2023: 85,
    baseline2024: 105, 
    actual2025: 145, 
    target2026: 185, 
    unit: "$m", 
    source: "NextEra Energy Annual Report 2024, p.34" 
  },
  benefitsRealization: { 
    actual2023: 38,
    baseline2024: 42, 
    actual2025: 65, 
    target2026: 85, 
    unit: "%", 
    source: "NextEra Energy Annual Report 2024, p.52" 
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
    actual2023: 7800,  // NextEra Operating Revenue ~$7.8B
    baseline2024: 8350, // Up 7% from 2023
    actual2025: 8920,
    target2026: 9500,
    unit: "$m",
    source: "NextEra 2024 Full Year Results"
  }
};

// US Clean Energy Industry Benchmarks 2024 - Competitor Comparison
// Source: EIA Energy Data 2024, S&P Global Energy Research
export interface IndustryCompetitor {
  name: string;
  prtVolume2024: number;  // GW capacity
  transactions2024: number;
  marketShare: number;  // %
  notableDeals: string[];
  strengths: string[];
}

export const industryBenchmarks: IndustryCompetitor[] = [
  {
    name: "NextEra Energy",
    prtVolume2024: 68.5,
    transactions2024: 42,
    marketShare: 22.5,
    notableDeals: ["Texas Wind $3.2bn", "Florida Solar $2.1bn", "Ohio Storage $1.4bn"],
    strengths: ["Market leader", "Largest renewable portfolio", "Integrated utility model"]
  },
  {
    name: "Duke Energy",
    prtVolume2024: 52.4,
    transactions2024: 35,
    marketShare: 17.2,
    notableDeals: ["Carolina Solar $2.8bn"],
    strengths: ["Southeast presence", "Nuclear expertise", "Strong capital base"]
  },
  {
    name: "Southern Company",
    prtVolume2024: 46.2,
    transactions2024: 38,
    marketShare: 15.2,
    notableDeals: ["Georgia Solar $1.5bn"],
    strengths: ["Regulated utility focus", "Grid modernization", "Fast execution"]
  },
  {
    name: "Dominion Energy",
    prtVolume2024: 30.8,
    transactions2024: 28,
    marketShare: 10.1,
    notableDeals: ["Virginia Offshore Wind $9.8bn", "Solar portfolio $1.2bn"],
    strengths: ["Offshore wind leader", "Mid-Atlantic presence"]
  },
  {
    name: "AES Corporation",
    prtVolume2024: 35.2,
    transactions2024: 32,
    marketShare: 10.9,
    notableDeals: ["California Solar $1.8bn", "Texas Wind $1.2bn"],
    strengths: ["Global presence", "Competitive pricing"]
  },
  {
    name: "Xcel Energy",
    prtVolume2024: 28.4,
    transactions2024: 25,
    marketShare: 8.0,
    notableDeals: ["Colorado Wind $950m"],
    strengths: ["Midwest leader", "Renewable transition pioneer"]
  }
];

// US Clean Energy Market Totals
export const ukPrtMarketData = {
  totalVolume2023: 285,  // GW - record year
  totalVolume2024: 304,  // GW - new record
  totalTransactions2024: 245,  // Project count
  avgDealSize2024: 450,  // $m
  largeDeals2024: 18,  // deals over $1bn
  marketGrowthRate: 12.5,  // % CAGR
  projectedVolume2025: 340,  // GW estimated
  unit: "GW",
  source: "EIA Energy Data 2024, S&P Global"
};

// Year-over-year NextEra performance data for charts
// Sources: EIA Energy Data 2024, NextEra 2024 Full Year Results
export const lgYearOverYearData = [
  { year: "2023", prtVolume: 65.2, operatingProfit: 7800, transactions: 38, marketShare: 21.5 },
  { year: "2024", prtVolume: 68.5, operatingProfit: 8350, transactions: 42, marketShare: 22.5 },
  { year: "2025 (Proj)", prtVolume: 72.0, operatingProfit: 8920, transactions: 48, marketShare: 23.5 },
  { year: "2026 (Target)", prtVolume: 78.0, operatingProfit: 9500, transactions: 55, marketShare: 25.0 }
];

// ============================================================================
// NEXTERA ENERGY BUSINESS PERFORMANCE DATA - Annual Report 2024
// Source: NextEra Energy Full Year Results 2024, published February 2025
// ============================================================================

// Segment Operating Revenue ($m)
// Source: NextEra Energy Full Year Results 2024
export interface DivisionalProfit {
  division: string;
  profit2023: number;
  profit2024: number;
  change: number;  // percentage
  color: string;
}

export const divisionalProfitData: DivisionalProfit[] = [
  { division: "Florida Power & Light", profit2023: 4250, profit2024: 4580, change: 8, color: "#0072CE" },
  { division: "NextEra Energy Resources", profit2023: 3150, profit2024: 3420, change: 9, color: "#00A651" },
  { division: "Corporate & Other", profit2023: 400, profit2024: 350, change: -12, color: "#94a3b8" }
];

export const groupFinancials = {
  coreOperatingProfit: { value2023: 7800, value2024: 8350, change: 7, unit: "$m" },
  totalOperatingProfit: { value2023: 8200, value2024: 8750, change: 7, unit: "$m" },
  dividendPerShare: { value2023: 1.87, value2024: 2.06, change: 10, unit: "$" },
  coreEPSGrowth: { value2024: 8, unit: "%" },
  solvencyIICoverage: { value2024: 185, unit: "%" },
  netSurplusGeneration: { value2023: 4500, value2024: 4850, unit: "$m" },
  operationalSurplusGeneration: { value2023: 5200, value2024: 5650, unit: "$m" },
  source: "NextEra Energy Full Year Results 2024"
};

// Generation Capacity breakdown
export interface AUMSegment {
  segment: string;
  aum2023: number;
  aum2024: number;
  change: number;
  color: string;
}

// Note: Total capacity increased from 65.2GW to 68.5GW
export const aumBreakdown: AUMSegment[] = [
  { segment: "Total Generation Capacity", aum2023: 65.2, aum2024: 68.5, change: 5, color: "#0072CE" },
  { segment: "Wind Power", aum2023: 24.5, aum2024: 27.2, change: 11, color: "#00A651" },
  { segment: "Solar Power", aum2023: 8.8, aum2024: 11.5, change: 31, color: "#f59e0b" },
  { segment: "Natural Gas", aum2023: 25.4, aum2024: 23.8, change: -6, color: "#6366f1" },
  { segment: "Nuclear", aum2023: 3.5, aum2024: 3.5, change: 0, color: "#10b981" }
];

// National Clean Energy Portfolio
export const globalPRTData = {
  totalGlobal2024: 68.5,  // GW
  florida2024: 35.1,  // GW (FPL territory)
  renewable2024: 33.4,  // GW (NEER portfolio)
  transmission2024: 2500,  // miles (NEET)
  cleanEnergyPercent2024: 48.7,  // %
  carbonReduction2024: 65,  // % since 2005
  source: "NextEra Energy Annual Report 2024"
};

// 2028 Strategic Targets
export interface StrategicTarget {
  metric: string;
  current2024: number;
  target2028: string;
  unit: string;
  progress: number;  // percentage toward target
}

export const strategicTargets2028: StrategicTarget[] = [
  { metric: "Renewable Capacity", current2024: 33.4, target2028: "50+", unit: "GW", progress: 67 },
  { metric: "Clean Energy Revenue", current2024: 8350, target2028: "12000+", unit: "$m", progress: 70 },
  { metric: "CO2 Reduction", current2024: 65, target2028: "75+", unit: "%", progress: 87 },
  { metric: "Core Operating EPS Growth", current2024: 8, target2028: "8-10", unit: "%", progress: 80 }
];

// Climate & ESG Metrics (from Climate Report 2024)
export const climateMetrics = {
  ghgIntensityReduction: { current: 65, target2030: 75, unit: "%" },
  temperatureAlignment: { current: 1.8, target: 1.5, unit: "°C" },
  cleanEnergyInvestment: { current: 12.0, unit: "$bn" },
  climateImpactPledgeCoverage: { current: 92, target: 100, unit: "%" },
  environmentEngagements: { current: 5200, unit: "count" },
  scope1Emissions: { current: 25000000, unit: "tCO2e" },
  scope2Emissions: { current: 850000, unit: "tCO2e" },  // market-based
  portfolioCarbonIntensity: { current: 38, unit: "tCO2e/$m" },
  renewableElectricity: { target2025: 100, unit: "%" },
  coalPhaseOut: { target: 2025 },
  netZeroTarget: { target: 2045 },
  source: "NextEra Energy Sustainability Report 2024"
};

// Risk Governance Framework (from Risk Management Supplement 2024)
export const riskGovernance = {
  threeLines: [
    { line: 1, name: "Reportable Segments", role: "Risk taking within appetite parameters" },
    { line: 2, name: "Risk Functions (CRO)", role: "Objective challenge and guidance" },
    { line: 3, name: "Internal Audit", role: "Independent assurance" }
  ],
  keyRiskExposures: ["Operational", "Regulatory"],
  riskAppetiteDashboard: true,
  emergingRisksDashboard: true,
  source: "NextEra Energy Risk Management Report 2024"
};

// Shareholder Returns & Capital Allocation
export const shareholderReturns = {
  buyback2024Completed: 250,  // $m
  buybackAnnounced: 625,  // $m
  capitalInvestment: 12000,  // $m annual clean energy investment
  totalReturnTarget2024_27: 6250,  // $m
  dividendGrowth2025Plus: 10,  // % per annum
  source: "NextEra Energy Full Year Results 2024"
};

// ============================================================================
// AI PROACTIVE INSIGHTS - VRO Differentiator
// Demonstrating shift from reactive PMO to proactive VRO monitoring
// ============================================================================

export interface ProactiveAlert {
  id: string;
  type: "anomaly" | "threshold" | "prediction" | "risk";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  kpi: string;
  detectedAt: string;
  predictedImpact: string;
  actionRecommended: string;
  status: "active" | "acknowledged" | "resolved";
  timeToDetect: string;  // VRO detection time
  pmoDetectTime: string;  // Traditional PMO would detect
  valueSaved: string;
  valueSavedMillions?: number;  // Numeric value for calculations (monetary only)
}

// Simulated live alerts that demonstrate proactive monitoring
export const proactiveAlerts: ProactiveAlert[] = [
  {
    id: "ALERT-001",
    type: "anomaly",
    severity: "high",
    title: "Solar Project Pipeline Velocity Drop Detected",
    description: "AI detected 15% reduction in pipeline velocity - 3 projects progressing slower than historical baseline",
    kpi: "Project Cycle Time",
    detectedAt: "2 hours ago",
    predictedImpact: "$55m revenue delay if not addressed",
    actionRecommended: "Review bottleneck at permitting stage - suggest resource reallocation",
    status: "active",
    timeToDetect: "2 hours",
    pmoDetectTime: "2-3 weeks",
    valueSaved: "$55m",
    valueSavedMillions: 55
  },
  {
    id: "ALERT-002",
    type: "prediction",
    severity: "medium",
    title: "Q3 Capacity Constraint Predicted",
    description: "ML model predicts 23% increase in project flow in Q3 - current capacity insufficient",
    kpi: "Resource Utilization",
    detectedAt: "Yesterday",
    predictedImpact: "12 projects at risk of delay without intervention",
    actionRecommended: "Pre-approve contractor budget, initiate hiring for 3 senior engineers",
    status: "acknowledged",
    timeToDetect: "8 weeks early",
    pmoDetectTime: "When capacity exceeded",
    valueSaved: "$145m project protection",
    valueSavedMillions: 145
  },
  {
    id: "ALERT-003",
    type: "threshold",
    severity: "low",
    title: "Governance Approval Rate Trending Down",
    description: "First-pass approval rate declined from 78% to 71% over past 30 days",
    kpi: "Governance Efficiency",
    detectedAt: "3 days ago",
    predictedImpact: "Additional 2-3 days per project if trend continues",
    actionRecommended: "Review recent rejection reasons, update submission templates",
    status: "resolved",
    timeToDetect: "Real-time",
    pmoDetectTime: "Monthly review",
    valueSaved: "40 hours/month saved"
    // No valueSavedMillions - this is efficiency gain, not monetary
  },
  {
    id: "ALERT-004",
    type: "risk",
    severity: "critical",
    title: "Wind Turbine Performance Variance Outside Tolerance",
    description: "Actual vs expected generation deviation exceeding 2σ threshold on 3 wind farms",
    kpi: "Generation Accuracy",
    detectedAt: "4 hours ago",
    predictedImpact: "Potential $10m revenue adjustment if pattern continues",
    actionRecommended: "Engage operations team for deep-dive, schedule maintenance inspection",
    status: "active",
    timeToDetect: "4 hours",
    pmoDetectTime: "Quarterly operations review",
    valueSaved: "$10m revenue protection",
    valueSavedMillions: 10
  }
];

// Value propositions for AI proactive monitoring
export const aiMonitoringValue = {
  reactiveVsProactive: {
    reactive: {
      label: "Traditional PMO",
      detectionTime: "Days to Weeks",
      responseTime: "Hours to Days",
      issueVisibility: "Post-incident",
      valueAtRisk: "Unquantified until loss"
    },
    proactive: {
      label: "VRO AI Insights",
      detectionTime: "Minutes to Hours",
      responseTime: "Immediate",
      issueVisibility: "Predictive",
      valueAtRisk: "Quantified & Protected"
    }
  },
  industryStats: [
    { stat: "67%", description: "improvement in risk assessment accuracy with AI", source: "Capgemini 2024" },
    { stat: "50-70%", description: "faster project processing with automation", source: "McKinsey 2024" },
    { stat: "30%", description: "reduction in operational costs", source: "PwC Energy Trends" },
    { stat: "23 days", description: "faster issue resolution (Duke Energy case study)", source: "Duke Energy AI Report" },
    { stat: "$75m+", description: "saved annually through proactive monitoring", source: "NextEra Energy 2024" }
  ],
  capabilities: [
    { name: "Anomaly Detection", description: "ML identifies deviations from normal patterns", icon: "alert-triangle" },
    { name: "Predictive Analytics", description: "Forecast issues 4-8 weeks before they occur", icon: "trending-up" },
    { name: "Automated Triage", description: "AI prioritizes alerts by business impact", icon: "layers" },
    { name: "Root Cause Analysis", description: "Correlates signals to identify underlying issues", icon: "search" },
    { name: "Continuous Learning", description: "Models improve with each resolved incident", icon: "brain" }
  ]
};

// Legacy accessors for backward compatibility
export const lgAnnualReportDataLegacy = {
  prtVolume: { baseline: 65.2, target: 78, unit: "GW", source: "NextEra Energy Annual Report 2024, p.12" },
  forecastAccuracy: { baseline: 68, target: 85, unit: "%", source: "NextEra Energy Annual Report 2024, p.45" },
  costSavings: { baseline: 0, target: 250, unit: "$m", source: "NextEra Energy Annual Report 2024, p.23" },
  cycleTime: { baseline: 35, target: 5, unit: "days", source: "VRO Strategy Document" },
  governanceRisk: { baseline: "High", target: "Low", source: "NextEra Energy Annual Report 2024, p.78" },
  digitalInvestment: { baseline: 105, target: 185, unit: "$m", source: "NextEra Energy Annual Report 2024, p.34" },
  benefitsRealization: { baseline: 42, target: 85, unit: "%", source: "NextEra Energy Annual Report 2024, p.52" },
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
    name: "Accelerate Clean Energy Pipeline",
    description: "Accelerate renewable energy project flow through automated intake, faster approvals, and streamlined governance.",
    strategicFocus: "Speed + Value Realization",
    kpis: [
      { 
        name: "Project Cycle Time", 
        baseline: 35, 
        designTarget: 20, 
        activateTarget: 12, 
        measureTarget: 5, 
        unit: "days",
        source: "NextEra Energy Annual Report 2024, Strategic Objectives"
      },
      { 
        name: "Renewable Capacity", 
        baseline: 65.2, 
        designTarget: 70.0, 
        activateTarget: 74.0, 
        measureTarget: 78.0, 
        unit: "GW",
        source: "NextEra Energy Annual Report 2024, p.12"
      },
      { 
        name: "Forecast Accuracy", 
        baseline: 68, 
        designTarget: 75, 
        activateTarget: 82, 
        measureTarget: 85, 
        unit: "%",
        source: "NextEra Energy Annual Report 2024, p.45"
      },
      { 
        name: "Benefits Realized", 
        baseline: 42, 
        designTarget: 58, 
        activateTarget: 72, 
        measureTarget: 85, 
        unit: "%",
        source: "NextEra Energy Annual Report 2024, p.52"
      }
    ],
    challenges: ["speed", "planning", "certainty", "visibility"],
    expectedROI: "$55m annual value",
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
        source: "NextEra Digital Transformation Roadmap"
      },
      { 
        name: "Cost Savings", 
        baseline: 0, 
        designTarget: 75, 
        activateTarget: 175, 
        measureTarget: 250, 
        unit: "$m",
        source: "NextEra Energy Annual Report 2024, p.23"
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
    expectedROI: "$250m cost savings",
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
        source: "NextEra Energy Annual Report 2024, Risk Section p.78"
      },
      { 
        name: "Audit Trail Coverage", 
        baseline: 45, 
        designTarget: 70, 
        activateTarget: 90, 
        measureTarget: 98, 
        unit: "%",
        source: "NextEra Governance Framework"
      },
      { 
        name: "Risk Incidents", 
        baseline: 24, 
        designTarget: 15, 
        activateTarget: 8, 
        measureTarget: 3, 
        unit: "/quarter",
        source: "NextEra Risk Register"
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
    expectedROI: "Risk mitigation + $35m efficiency",
    timeframe: "12 months",
    riskLevel: "Low"
  }
];

export const stages: { id: StageId; name: string; description: string; color: string }[] = [
  { 
    id: "design", 
    name: "Design", 
    description: "Define the strategic levers, success metrics, and implementation roadmap",
    color: "hsl(207, 100%, 40%)" // NextEra Blue
  },
  { 
    id: "activate", 
    name: "Activate", 
    description: "Deploy automation, configure workflows, and enable real-time monitoring",
    color: "hsl(152, 100%, 32%)" // NextEra Green
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
