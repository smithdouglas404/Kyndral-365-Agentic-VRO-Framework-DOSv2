// ============================================================================
// UNIFIED PROJECT DATA - Enriched PMO Projects with Portfolio-Level Detail
// Source of truth for all project views across the application
// ============================================================================

import { PMOProject, VROProgram, SAFePortfolioStage, SAFeMetrics, AISignal, ProactiveAction, TrendPoint } from './buPrograms';
import { Feature, Resource, Milestone, Dependency, Financials, safeProjects, SAFeProject } from './safeProjectData';

// Cross-project dependency with health indicator
export interface ProjectDependency {
  projectId: string;
  projectName: string;
  type: "blocks" | "blocked-by" | "related";
  health: "green" | "yellow" | "red";
  description: string;
  impactIfDelayed?: string;
}

// Priority levels for project prioritization
export type ProjectPriority = "critical" | "high" | "medium" | "low";

// Enriched project combining PMO metrics with Portfolio-level detail
export interface EnrichedProject {
  id: string;
  name: string;
  bu: string; // Business Unit / Group Function Portfolio
  
  // Rich descriptive fields
  description: string;
  expectedROI: string;
  roiValue: number; // Numeric value in £m for calculations
  priority: ProjectPriority;
  aiRecommendation: string;
  
  // PMO tracking fields
  status: "green" | "amber" | "red";
  budget: { spent: number; total: number; unit: string };
  timeline: { elapsed: number; total: number; unit: string };
  deliverables: { completed: number; total: number };
  risks: string[];
  nextMilestone: string;
  
  // SAFe 6.0 metrics
  safe: SAFeMetrics;
  safeStage: SAFePortfolioStage;
  
  // SAFe 6.0 Hierarchy (Full Depth)
  artName?: string; // Agile Release Train name
  portfolioTheme?: string; // Strategic theme
  features?: Feature[]; // Features with nested stories and tasks
  resources?: Resource[]; // Team allocation
  milestones?: Milestone[]; // PI milestones with deliverables
  safeDependencies?: Dependency[]; // Cross-project dependencies (SAFe format)
  financials?: Financials; // Detailed financials including ROI
  currentPI?: number; // Current Program Increment (1-4)
  totalPIs?: number; // Total planned PIs
  velocity?: number; // Story points per sprint
  burndownHealth?: number; // 0-100
  qualityScore?: number; // 0-100
  
  // AI Enhancement
  aiSignals: AISignal[];
  proactiveActions: ProactiveAction[];
  trendData: TrendPoint[];
  
  // Cross-project dependencies
  dependencies: ProjectDependency[];
  
  // Linked VRO program (if applicable)
  linkedVROProgramId?: string;
}

// ============================================================================
// ENRICHED PROJECT DATA - All 24 Projects with Full Detail
// ============================================================================

export const enrichedProjects: EnrichedProject[] = [
  // ============================================================================
  // FLORIDA POWER & LIGHT (FPL) - 4 Projects
  // Source: NextEra Energy Annual Report 2024, 10-K Filing
  // ============================================================================
  {
    id: "pmo-fpl-001",
    name: "Grid Modernization & Automation",
    bu: "Florida Power & Light",
    description: "Deploying AI-powered grid management system with automated switching, real-time load balancing, and predictive outage prevention. Target: reduce outage duration from 30 to 5 minutes. Part of $8.2bn FPL capital investment program.",
    expectedROI: "$120m annual efficiency",
    roiValue: 120,
    priority: "critical",
    aiRecommendation: "High priority - hurricane season preparedness critical. AI models show 40% reduction in restoration times with full automation. Recommend accelerating deployment in coastal zones.",
    status: "amber",
    budget: { spent: 45, total: 68, unit: "$m" },
    timeline: { elapsed: 8, total: 14, unit: "months" },
    deliverables: { completed: 6, total: 14 },
    risks: ["Hurricane season timing", "Vendor equipment delays", "Integration with legacy SCADA systems"],
    nextMilestone: "Coastal Zone Phase 2 - Week 34",
    safe: {
      velocity: 48,
      predictability: 82,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-FPL-101",
      epicName: "Grid Resilience Initiative",
      epicProgress: 55,
      okr: { objective: "Reduce outage duration by 80%", keyResult: "Achieve 5-minute average restoration", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 75 }, { pi: "PI 24.2", velocity: 45, predictability: 78 }, { pi: "PI 24.3", velocity: 46, predictability: 80 }, { pi: "PI 24.4", velocity: 48, predictability: 82 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Legacy SCADA integration delays - 23% behind schedule on Miami-Dade zone", confidence: 87, dataSource: "System monitoring" },
      { type: "opportunity", message: "Cloud migration could reduce integration complexity by 40%", confidence: 72, dataSource: "Architecture review" }
    ],
    proactiveActions: [
      { id: "pa-001", action: "Schedule SCADA integration review with legacy team", impact: "Prevent 2-week delay", urgency: "immediate", type: "mitigate" },
      { id: "pa-002", action: "Request additional contractor resources for Q3", impact: "Maintain delivery pace", urgency: "this-week", type: "escalate" }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 45 }, { week: "W30", value: 43 }, { week: "W31", value: 48 }, { week: "W32", value: 52 }],
    dependencies: [
      { projectId: "pmo-fpl-002", projectName: "Advanced Metering Infrastructure", type: "related", health: "green", description: "Shares data pipeline for grid analytics", impactIfDelayed: "Minimal - separate workstreams" },
      { projectId: "pmo-corp-001", projectName: "Enterprise Data Platform", type: "blocked-by", health: "yellow", description: "Requires unified data infrastructure", impactIfDelayed: "2-week delay on analytics module" }
    ],
    linkedVROProgramId: "vro-fpl-001"
  },
  {
    id: "pmo-fpl-002",
    name: "Advanced Metering Infrastructure Expansion",
    bu: "Florida Power & Light",
    description: "Deploying next-generation smart meters with real-time analytics across 6M+ customer accounts. Enables demand response, outage detection, and energy efficiency programs. Supports FPL's 99.98% reliability target.",
    expectedROI: "$85m operational savings",
    roiValue: 85,
    priority: "high",
    aiRecommendation: "Deployment showing 15% faster outage detection in pilot areas. Recommend expansion to remaining 1.2M accounts. Strong correlation with customer satisfaction improvements.",
    status: "green",
    budget: { spent: 28, total: 35, unit: "$m" },
    timeline: { elapsed: 10, total: 12, unit: "months" },
    deliverables: { completed: 8, total: 10 },
    risks: ["Cybersecurity compliance requirements", "Meter supply chain constraints"],
    nextMilestone: "Full deployment - Week 28",
    safe: {
      velocity: 52,
      predictability: 91,
      flowEfficiency: 78,
      currentPI: "PI 25.1",
      epicId: "EPIC-FPL-102",
      epicName: "Customer Experience Modernization",
      epicProgress: 85,
      okr: { objective: "Achieve 100% smart meter coverage", keyResult: "Deploy to remaining 1.2M accounts", progress: 82 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 82 }, { pi: "PI 24.2", velocity: 48, predictability: 85 }, { pi: "PI 24.3", velocity: 50, predictability: 88 }, { pi: "PI 25.1", velocity: 52, predictability: 91 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Pilot areas showing 15% faster outage detection - exceeding targets", confidence: 94, dataSource: "Operations analytics" }
    ],
    proactiveActions: [
      { id: "pa-003", action: "Accelerate remaining account deployments", impact: "Complete 2 weeks early", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 78 }, { week: "W29", value: 82 }, { week: "W30", value: 85 }, { week: "W31", value: 88 }, { week: "W32", value: 92 }],
    dependencies: [
      { projectId: "pmo-fpl-001", projectName: "Grid Modernization & Automation", type: "related", health: "green", description: "Feeds real-time data to grid automation", impactIfDelayed: "Grid automation less effective" }
    ],
    linkedVROProgramId: "vro-fpl-002"
  },
  {
    id: "pmo-fpl-003",
    name: "Solar Expansion Program - SoBRA",
    bu: "Florida Power & Light",
    description: "Adding 4,800 MW of new solar capacity through the Solar Base Rate Adjustment mechanism. Largest utility-operated solar program in the U.S. Includes 894 MW approved for January 2025 deployment.",
    expectedROI: "$340m annual revenue",
    roiValue: 340,
    priority: "critical",
    aiRecommendation: "Land acquisition 92% complete. Recommend accelerating permitting for sites 12-15 to capture ITC benefits before phase-out. Weather data favorable for Q2 construction start.",
    status: "green",
    budget: { spent: 1200, total: 1800, unit: "$m" },
    timeline: { elapsed: 18, total: 24, unit: "months" },
    deliverables: { completed: 12, total: 18 },
    risks: ["Supply chain for solar panels", "Permitting delays", "Interest rate impact on financing"],
    nextMilestone: "Phase 3 construction start - Week 36",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 25.1",
      epicId: "EPIC-FPL-103",
      epicName: "Clean Energy Transition",
      epicProgress: 67,
      okr: { objective: "Add 4,800 MW solar capacity", keyResult: "Complete 18 solar facilities", progress: 67 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 80 }, { pi: "PI 24.2", velocity: 50, predictability: 82 }, { pi: "PI 24.3", velocity: 53, predictability: 85 }, { pi: "PI 25.1", velocity: 55, predictability: 88 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Land acquisition 92% complete - ahead of schedule", confidence: 95, dataSource: "Real estate analytics" },
      { type: "opportunity", message: "Accelerate permitting for ITC benefit capture", confidence: 78, dataSource: "Tax analysis" }
    ],
    proactiveActions: [
      { id: "pa-004", action: "Expedite permitting for remaining sites", impact: "$45m tax benefit capture", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 64 }, { week: "W30", value: 65 }, { week: "W31", value: 67 }, { week: "W32", value: 69 }],
    dependencies: [
      { projectId: "pmo-neer-002", projectName: "Battery Storage Network", type: "related", health: "green", description: "Shared battery technology platform", impactIfDelayed: "Solar intermittency management delayed" }
    ],
    linkedVROProgramId: "vro-fpl-003"
  },
  {
    id: "pmo-fpl-004",
    name: "Hurricane Hardening Phase 4",
    bu: "Florida Power & Light",
    description: "Continuation of storm hardening program to strengthen transmission and distribution infrastructure. Undergrounding critical feeders, upgrading poles, and installing breakaway components in high-risk areas.",
    expectedROI: "$95m avoided storm restoration costs",
    roiValue: 95,
    priority: "high",
    aiRecommendation: "Phase 3 reduced restoration times by 45% in hardened areas during 2024 storm season. Prioritize remaining coastal zones before June hurricane season.",
    status: "amber",
    budget: { spent: 180, total: 250, unit: "$m" },
    timeline: { elapsed: 14, total: 18, unit: "months" },
    deliverables: { completed: 10, total: 15 },
    risks: ["Hurricane season window", "Labor availability", "Material costs"],
    nextMilestone: "Coastal zone completion - Week 24",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-FPL-104",
      epicName: "Infrastructure Resilience",
      epicProgress: 72,
      okr: { objective: "Harden 1,500 miles of critical infrastructure", keyResult: "Complete before 2025 hurricane season", progress: 72 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 70 }, { pi: "PI 24.2", velocity: 42, predictability: 72 }, { pi: "PI 24.3", velocity: 44, predictability: 75 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "June hurricane season deadline at risk - 28% work remaining", confidence: 82, dataSource: "Project tracking" }
    ],
    proactiveActions: [
      { id: "pa-005", action: "Add second shift for coastal zone work", impact: "Complete 3 weeks earlier", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 68 }, { week: "W29", value: 70 }, { week: "W30", value: 71 }, { week: "W31", value: 72 }, { week: "W32", value: 74 }],
    dependencies: [
      { projectId: "pmo-fpl-001", projectName: "Grid Modernization & Automation", type: "related", health: "green", description: "Hardened infrastructure supports automated switching", impactIfDelayed: "Automation benefits delayed" }
    ],
    linkedVROProgramId: "vro-fpl-004"
  },

  // ============================================================================
  // NEXTERA ENERGY RESOURCES (NEER) - 4 Projects
  // Source: NextEra Energy Annual Report 2024, 10-K Filing
  // ============================================================================
  {
    id: "pmo-neer-001",
    name: "Wind Portfolio Expansion - Texas",
    bu: "NextEra Energy Resources",
    description: "Developing 2,500 MW of new wind capacity across 5 Texas sites. Part of NEER's record 12+ GW origination year. Long-term PPAs secured with Fortune 500 customers including Microsoft and Amazon.",
    expectedROI: "$180m annual revenue",
    roiValue: 180,
    priority: "critical",
    aiRecommendation: "Supply chain constraints detected for turbine components. Recommend alternative vendor qualification and buffer stock strategy. PPA pricing favorable - accelerate origination.",
    status: "amber",
    budget: { spent: 420, total: 520, unit: "$m" },
    timeline: { elapsed: 14, total: 20, unit: "months" },
    deliverables: { completed: 12, total: 22 },
    risks: ["Turbine supply chain delays", "Interconnection queue timing", "Interest rate impact on financing"],
    nextMilestone: "Site 3 COD - Week 32",
    safe: {
      velocity: 42,
      predictability: 72,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-NEER-101",
      epicName: "Wind Expansion 2024-2027",
      epicProgress: 55,
      okr: { objective: "Add 2,500 MW wind capacity", keyResult: "Complete 5 Texas wind farms", progress: 55 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 44, predictability: 75 }, { pi: "PI 24.3", velocity: 43, predictability: 73 }, { pi: "PI 24.4", velocity: 42, predictability: 72 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Turbine delivery delays - 3-week slip on Site 4", confidence: 85, dataSource: "Supply chain monitoring" },
      { type: "opportunity", message: "PPA pricing 8% above plan - accelerate origination", confidence: 82, dataSource: "Market analytics" }
    ],
    proactiveActions: [
      { id: "pa-006", action: "Qualify alternative turbine supplier", impact: "Reduce supply risk", urgency: "this-week", type: "mitigate" },
      { id: "pa-007", action: "Accelerate Site 5 origination", impact: "$15m additional margin", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 53 }, { week: "W30", value: 54 }, { week: "W31", value: 55 }, { week: "W32", value: 56 }],
    dependencies: [
      { projectId: "pmo-neer-002", projectName: "Battery Storage Network", type: "related", health: "green", description: "Shared battery integration for wind variability", impactIfDelayed: "Curtailment risk increases" },
      { projectId: "pmo-corp-001", projectName: "Enterprise Data Platform", type: "blocked-by", health: "yellow", description: "Requires data infrastructure for optimization", impactIfDelayed: "Manual performance tracking" }
    ],
    linkedVROProgramId: "vro-neer-001"
  },
  {
    id: "pmo-neer-002",
    name: "Battery Storage Network",
    bu: "NextEra Energy Resources",
    description: "Deploying 3,500 MW of grid-scale battery storage across NEER portfolio. World-leading battery storage capacity supporting renewable intermittency management and grid services revenue.",
    expectedROI: "$145m annual grid services revenue",
    roiValue: 145,
    priority: "critical",
    aiRecommendation: "Battery costs down 12% - recommend accelerating procurement. Grid services pricing favorable in ERCOT and CAISO markets. Strong ROI trajectory.",
    status: "green",
    budget: { spent: 280, total: 380, unit: "$m" },
    timeline: { elapsed: 12, total: 18, unit: "months" },
    deliverables: { completed: 14, total: 20 },
    risks: ["Battery supply chain", "Interconnection timing", "Grid services market volatility"],
    nextMilestone: "Phase 2 COD - Week 28",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 78,
      currentPI: "PI 25.1",
      epicId: "EPIC-NEER-102",
      epicName: "Battery Storage Leadership",
      epicProgress: 70,
      okr: { objective: "Deploy 3,500 MW battery storage", keyResult: "Achieve world-leading storage capacity", progress: 70 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 80 }, { pi: "PI 24.2", velocity: 50, predictability: 82 }, { pi: "PI 24.3", velocity: 52, predictability: 85 }, { pi: "PI 25.1", velocity: 55, predictability: 88 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "opportunity", message: "Battery costs down 12% - accelerate procurement", confidence: 90, dataSource: "Market analytics" },
      { type: "insight", message: "Grid services pricing favorable in target markets", confidence: 85, dataSource: "Market intelligence" }
    ],
    proactiveActions: [
      { id: "pa-008", action: "Lock in battery pricing for Phase 3", impact: "$28m cost savings", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 65 }, { week: "W29", value: 67 }, { week: "W30", value: 69 }, { week: "W31", value: 70 }, { week: "W32", value: 72 }],
    dependencies: [
      { projectId: "pmo-fpl-003", projectName: "Solar Expansion Program", type: "related", health: "green", description: "Shared technology platform", impactIfDelayed: "Independent deployment" }
    ],
    linkedVROProgramId: "vro-neer-002"
  },
  {
    id: "pmo-neer-003",
    name: "Green Hydrogen Hub Development",
    bu: "NextEra Energy Resources",
    description: "Developing large-scale green hydrogen production facility powered by dedicated renewable energy. Targeting 200 tons/day production capacity. Strategic investment in emerging clean fuel market.",
    expectedROI: "$2.5bn revenue opportunity",
    roiValue: 250,
    priority: "high",
    aiRecommendation: "DOE hydrogen hub funding opportunity identified. Submit application to accelerate timeline and reduce capital requirements. Strong alignment with IRA incentives.",
    status: "green",
    budget: { spent: 45, total: 120, unit: "$m" },
    timeline: { elapsed: 8, total: 24, unit: "months" },
    deliverables: { completed: 6, total: 18 },
    risks: ["Technology maturity", "Offtake agreements", "Regulatory framework"],
    nextMilestone: "DOE Application - Week 30",
    safe: {
      velocity: 48,
      predictability: 75,
      flowEfficiency: 68,
      currentPI: "PI 24.3",
      epicId: "EPIC-NEER-103",
      epicName: "Clean Hydrogen Initiative",
      epicProgress: 33,
      okr: { objective: "Establish green hydrogen production", keyResult: "Achieve 200 tons/day capacity", progress: 33 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 70 }, { pi: "PI 24.2", velocity: 45, predictability: 72 }, { pi: "PI 24.3", velocity: 48, predictability: 75 }]
    },
    safeStage: "funnel",
    aiSignals: [
      { type: "opportunity", message: "DOE hydrogen hub funding - $500m potential", confidence: 75, dataSource: "Policy scanner" }
    ],
    proactiveActions: [
      { id: "pa-009", action: "Submit DOE hydrogen hub application", impact: "Accelerate by 18 months", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 28 }, { week: "W29", value: 30 }, { week: "W30", value: 32 }, { week: "W31", value: 33 }, { week: "W32", value: 35 }],
    dependencies: [
      { projectId: "pmo-neer-001", projectName: "Wind Portfolio Expansion", type: "blocked-by", health: "amber", description: "Requires dedicated renewable supply", impactIfDelayed: "Hydrogen production delayed" }
    ],
    linkedVROProgramId: "vro-neer-003"
  },
  {
    id: "pmo-neer-004",
    name: "Duane Arnold Nuclear Restart",
    bu: "NextEra Energy Resources",
    description: "Evaluating recommissioning of Duane Arnold Energy Center in Iowa. Potential restart by end of 2028 pending NRC approvals. 600 MW carbon-free baseload generation.",
    expectedROI: "$85m annual revenue",
    roiValue: 85,
    priority: "medium",
    aiRecommendation: "NRC early engagement favorable. Data center demand in Midwest creating strong offtake opportunity. Recommend advancing feasibility study.",
    status: "green",
    budget: { spent: 8, total: 25, unit: "$m" },
    timeline: { elapsed: 6, total: 36, unit: "months" },
    deliverables: { completed: 3, total: 12 },
    risks: ["NRC licensing", "Capital requirements", "Offtake uncertainty"],
    nextMilestone: "NRC Pre-Application - Week 40",
    safe: {
      velocity: 35,
      predictability: 80,
      flowEfficiency: 70,
      currentPI: "PI 24.2",
      epicId: "EPIC-NEER-104",
      epicName: "Nuclear Revival Program",
      epicProgress: 25,
      okr: { objective: "Restart Duane Arnold by 2028", keyResult: "Obtain NRC approval for recommissioning", progress: 25 },
      piTrend: [{ pi: "PI 24.1", velocity: 32, predictability: 75 }, { pi: "PI 24.2", velocity: 35, predictability: 80 }]
    },
    safeStage: "funnel",
    aiSignals: [
      { type: "insight", message: "Data center demand creating strong offtake opportunity", confidence: 78, dataSource: "Market intelligence" }
    ],
    proactiveActions: [
      { id: "pa-010", action: "Advance NRC pre-application meetings", impact: "Reduce regulatory risk", urgency: "this-month", type: "investigate" }
    ],
    trendData: [{ week: "W28", value: 22 }, { week: "W29", value: 23 }, { week: "W30", value: 24 }, { week: "W31", value: 25 }, { week: "W32", value: 26 }],
    dependencies: [],
    linkedVROProgramId: "vro-neer-004"
  },

  // ============================================================================
  // CORPORATE & OTHER - 4 Projects
  // Source: NextEra Energy Annual Report 2024, 10-K Filing
  // ============================================================================
  {
    id: "pmo-corp-001",
    name: "Enterprise Data Platform",
    bu: "Corporate & Other",
    description: "Unified data platform for renewable asset optimization, predictive maintenance, and enterprise analytics. Foundation for AI-driven operations across FPL and NEER.",
    expectedROI: "$180m efficiency gains",
    roiValue: 180,
    priority: "critical",
    aiRecommendation: "Platform showing 25% efficiency improvement in pilot areas. Accelerate enterprise rollout. Strong synergies with grid automation and asset optimization initiatives.",
    status: "green",
    budget: { spent: 42, total: 65, unit: "$m" },
    timeline: { elapsed: 10, total: 14, unit: "months" },
    deliverables: { completed: 12, total: 16 },
    risks: ["Enterprise adoption", "Legacy system integration", "Data quality"],
    nextMilestone: "Enterprise rollout - Week 32",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 75,
      currentPI: "PI 24.4",
      epicId: "EPIC-CORP-101",
      epicName: "Digital Transformation",
      epicProgress: 75,
      okr: { objective: "Deploy unified data platform", keyResult: "Achieve 100% business unit adoption", progress: 75 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 82 }, { pi: "PI 24.4", velocity: 52, predictability: 85 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Pilot areas showing 25% efficiency improvement", confidence: 92, dataSource: "Operations analytics" }
    ],
    proactiveActions: [
      { id: "pa-011", action: "Accelerate enterprise rollout", impact: "Capture $45m savings earlier", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 70 }, { week: "W29", value: 72 }, { week: "W30", value: 73 }, { week: "W31", value: 75 }, { week: "W32", value: 77 }],
    dependencies: [
      { projectId: "pmo-fpl-001", projectName: "Grid Modernization & Automation", type: "blocks", health: "green", description: "Provides data infrastructure", impactIfDelayed: "Grid analytics delayed" }
    ],
    linkedVROProgramId: "vro-corp-001"
  },
  {
    id: "pmo-corp-002",
    name: "NEET Transmission Expansion",
    bu: "Corporate & Other",
    description: "Expanding rate-regulated transmission infrastructure through NextEra Energy Transmission (NEET). Adding 800 miles of new transmission lines to support renewable integration.",
    expectedROI: "$95m annual revenue",
    roiValue: 95,
    priority: "high",
    aiRecommendation: "FERC approval timeline favorable. Recommend advancing permitting for priority corridors. Strong alignment with renewable expansion strategy.",
    status: "green",
    budget: { spent: 320, total: 450, unit: "$m" },
    timeline: { elapsed: 16, total: 24, unit: "months" },
    deliverables: { completed: 10, total: 15 },
    risks: ["FERC regulatory approvals", "Right-of-way acquisition", "Material costs"],
    nextMilestone: "Phase 2 FERC filing - Week 34",
    safe: {
      velocity: 48,
      predictability: 82,
      flowEfficiency: 72,
      currentPI: "PI 24.4",
      epicId: "EPIC-CORP-102",
      epicName: "Transmission Growth Initiative",
      epicProgress: 67,
      okr: { objective: "Expand transmission by 800 miles", keyResult: "Achieve $3.2bn rate base", progress: 67 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 75 }, { pi: "PI 24.2", velocity: 44, predictability: 77 }, { pi: "PI 24.3", velocity: 46, predictability: 80 }, { pi: "PI 24.4", velocity: 48, predictability: 82 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "FERC approval timeline favorable - 6 months ahead", confidence: 80, dataSource: "Regulatory scanner" }
    ],
    proactiveActions: [
      { id: "pa-012", action: "Advance permitting for priority corridors", impact: "Accelerate by 3 months", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 64 }, { week: "W30", value: 65 }, { week: "W31", value: 67 }, { week: "W32", value: 68 }],
    dependencies: [
      { projectId: "pmo-neer-001", projectName: "Wind Portfolio Expansion", type: "related", health: "green", description: "Supports wind interconnection", impactIfDelayed: "Wind curtailment increases" }
    ],
    linkedVROProgramId: "vro-corp-002"
  },
  {
    id: "pmo-corp-003",
    name: "ESG Reporting Automation",
    bu: "Corporate & Other",
    description: "Automating sustainability reporting for TCFD, TNFD, and CDP disclosures. Centralizing ESG data collection across FPL and NEER for AAA sustainability ratings.",
    expectedROI: "$15m efficiency + rating improvement",
    roiValue: 15,
    priority: "medium",
    aiRecommendation: "TNFD framework finalizing - recommend early adoption for competitive advantage. ESG investor demand strong. Rating agencies monitoring closely.",
    status: "green",
    budget: { spent: 4.5, total: 8, unit: "$m" },
    timeline: { elapsed: 6, total: 10, unit: "months" },
    deliverables: { completed: 7, total: 12 },
    risks: ["Evolving regulatory requirements", "Data quality", "Third-party data integration"],
    nextMilestone: "TNFD module launch - Week 30",
    safe: {
      velocity: 50,
      predictability: 85,
      flowEfficiency: 75,
      currentPI: "PI 24.3",
      epicId: "EPIC-CORP-103",
      epicName: "Sustainability Excellence",
      epicProgress: 58,
      okr: { objective: "Achieve automated ESG reporting", keyResult: "Maintain AAA sustainability rating", progress: 58 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 80 }, { pi: "PI 24.2", velocity: 47, predictability: 82 }, { pi: "PI 24.3", velocity: 50, predictability: 85 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "opportunity", message: "Early TNFD adoption for competitive advantage", confidence: 78, dataSource: "Regulatory scanner" }
    ],
    proactiveActions: [
      { id: "pa-013", action: "Accelerate TNFD module development", impact: "First-mover advantage", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 54 }, { week: "W30", value: 56 }, { week: "W31", value: 58 }, { week: "W32", value: 60 }],
    dependencies: [
      { projectId: "pmo-corp-001", projectName: "Enterprise Data Platform", type: "blocked-by", health: "green", description: "Requires unified data feeds", impactIfDelayed: "Manual data collection" }
    ],
    linkedVROProgramId: "vro-corp-003"
  },
  {
    id: "pmo-corp-004",
    name: "Cybersecurity Enhancement Program",
    bu: "Corporate & Other",
    description: "Strengthening cybersecurity posture across critical infrastructure. Implementing NERC CIP compliance, OT security, and AI-driven threat detection for grid operations.",
    expectedROI: "$45m risk mitigation",
    roiValue: 45,
    priority: "high",
    aiRecommendation: "OT security gaps identified in legacy SCADA systems. Prioritize remediation before NERC audit. AI threat detection showing 35% improvement in detection times.",
    status: "amber",
    budget: { spent: 18, total: 28, unit: "$m" },
    timeline: { elapsed: 8, total: 12, unit: "months" },
    deliverables: { completed: 8, total: 14 },
    risks: ["Legacy system vulnerabilities", "NERC compliance deadlines", "Skilled resource availability"],
    nextMilestone: "NERC CIP audit - Week 36",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-CORP-104",
      epicName: "Critical Infrastructure Protection",
      epicProgress: 57,
      okr: { objective: "Achieve NERC CIP compliance", keyResult: "Zero critical findings in audit", progress: 57 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "OT security gaps in legacy SCADA - prioritize remediation", confidence: 88, dataSource: "Security audit" },
      { type: "insight", message: "AI threat detection showing 35% improvement", confidence: 85, dataSource: "Security operations" }
    ],
    proactiveActions: [
      { id: "pa-014", action: "Accelerate SCADA security remediation", impact: "NERC compliance", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 54 }, { week: "W30", value: 55 }, { week: "W31", value: 57 }, { week: "W32", value: 58 }],
    dependencies: [
      { projectId: "pmo-fpl-001", projectName: "Grid Modernization & Automation", type: "related", health: "green", description: "Security requirements for new systems", impactIfDelayed: "Security gaps in new infrastructure" }
    ],
    linkedVROProgramId: "vro-corp-004"
  }
];

// ============================================================================
// LEGACY PROJECT MAPPINGS - For backward compatibility
// ============================================================================

// Map old L&G business units to new NextEra segments
export const buMapping: Record<string, string> = {
  'Institutional Retirement': 'Florida Power & Light',
  'Asset Management': 'NextEra Energy Resources',
  'Retail': 'Florida Power & Light',
  'Corporate Investments': 'Corporate & Other',
  'Risk & Compliance': 'Corporate & Other',
  'Group Functions': 'Corporate & Other',
  'Florida Power & Light': 'Florida Power & Light',
  'NextEra Energy Resources': 'NextEra Energy Resources',
  'Corporate & Other': 'Corporate & Other'
};

// Get projects by NextEra business unit
export function getProjectsByBU(bu: string): EnrichedProject[] {
  const mappedBU = buMapping[bu] || bu;
  return enrichedProjects.filter(p => p.bu === mappedBU);
}

// ============================================================================
// OLD L&G PROJECTS REMOVED - Above projects replace all previous L&G projects
// The following section provides compatibility layer for any legacy code
// ============================================================================

// Legacy project type alias for backward compatibility
export type {
  EnrichedProject as Project,
  ProjectDependency,
  ProjectPriority
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get all projects
export function getAllProjects(): EnrichedProject[] {
  return enrichedProjects;
}

// Get project by ID
export function getProjectById(id: string): EnrichedProject | undefined {
  return enrichedProjects.find(p => p.id === id);
}

// Get projects by status
export function getProjectsByStatus(status: "green" | "amber" | "red"): EnrichedProject[] {
  return enrichedProjects.filter(p => p.status === status);
}

// Get critical projects
export function getCriticalProjects(): EnrichedProject[] {
  return enrichedProjects.filter(p => p.priority === "critical");
}

// Get projects with dependencies on a specific project
export function getProjectDependents(projectId: string): EnrichedProject[] {
  return enrichedProjects.filter(p => 
    p.dependencies.some(d => d.projectId === projectId)
  );
}
  {
    id: "pmo-rt-002",
    name: "AI Chatbot Implementation",

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get all unique business units
export const getBusinessUnits = (): string[] => {
  return Array.from(new Set(enrichedProjects.map(p => p.bu)));
};

// Get all unique SAFe stages
export const getSafeStages = (): SAFePortfolioStage[] => {
  return ["funnel", "reviewing", "analyzing", "portfolio-backlog", "implementing", "done"];
};

// Get stage display label
export const getStageLabel = (stage: SAFePortfolioStage): string => {
  const labels: Record<SAFePortfolioStage, string> = {
    "funnel": "Funnel",
    "reviewing": "Reviewing",
    "analyzing": "Analyzing",
    "portfolio-backlog": "Backlog",
    "implementing": "Implementing",
    "done": "Done"
  };
  return labels[stage];
};

// Filter projects by business unit
export const getProjectsByBU = (bu: string): EnrichedProject[] => {
  return enrichedProjects.filter(p => p.bu === bu);
};

// Filter projects by stage
export const getProjectsByStage = (stage: SAFePortfolioStage): EnrichedProject[] => {
  return enrichedProjects.filter(p => p.safeStage === stage);
};

// Get project by ID
export const getProjectById = (id: string): EnrichedProject | undefined => {
  return enrichedProjects.find(p => p.id === id);
};

// Get all dependencies for a project
export const getProjectDependencies = (projectId: string): ProjectDependency[] => {
  const project = getProjectById(projectId);
  return project?.dependencies || [];
};

// Get projects that depend on this project
export const getDependentProjects = (projectId: string): EnrichedProject[] => {
  return enrichedProjects.filter(p => 
    p.dependencies.some(d => d.projectId === projectId)
  );
};

// Get cross-project dependency health summary
export const getDependencyHealthSummary = (): { green: number; yellow: number; red: number } => {
  const allDeps = enrichedProjects.flatMap(p => p.dependencies);
  return {
    green: allDeps.filter(d => d.health === "green").length,
    yellow: allDeps.filter(d => d.health === "yellow").length,
    red: allDeps.filter(d => d.health === "red").length
  };
};

// Summary statistics
export const projectSummary = {
  totalProjects: enrichedProjects.length,
  byStatus: {
    green: enrichedProjects.filter(p => p.status === "green").length,
    amber: enrichedProjects.filter(p => p.status === "amber").length,
    red: enrichedProjects.filter(p => p.status === "red").length
  },
  byPriority: {
    critical: enrichedProjects.filter(p => p.priority === "critical").length,
    high: enrichedProjects.filter(p => p.priority === "high").length,
    medium: enrichedProjects.filter(p => p.priority === "medium").length,
    low: enrichedProjects.filter(p => p.priority === "low").length
  },
  totalBudget: enrichedProjects.reduce((sum, p) => sum + p.budget.total, 0),
  totalSpent: enrichedProjects.reduce((sum, p) => sum + p.budget.spent, 0),
  totalExpectedROI: enrichedProjects.reduce((sum, p) => sum + p.roiValue, 0),
  dependencyHealth: getDependencyHealthSummary()
};

// ============================================================================
// SAFe HIERARCHY ENRICHMENT
// Links safeProjects data to enrichedProjects for full SAFe 6.0 depth
// ============================================================================

// Mapping from enrichedProject IDs to safeProject IDs (matching safeProjectData.ts exactly)
const projectLinkMapping: Record<string, string> = {
  // Florida Power & Light → Maps to grid/utility-tagged projects
  "pmo-fpl-001": "proj-data-foundation",       // Grid Modernization
  "pmo-fpl-002": "proj-digital-onboarding",    // Advanced Metering Infrastructure  
  "pmo-fpl-003": "proj-cloud-migration",       // Solar Expansion Program
  "pmo-fpl-004": "proj-prt-platform",          // Hurricane Hardening
  // NextEra Energy Resources → Maps to renewable-tagged projects
  "pmo-neer-001": "proj-trading-platform",     // Wind Portfolio Expansion
  "pmo-neer-002": "proj-risk-engine",          // Battery Storage Network
  "pmo-neer-003": "proj-alt-investments",      // Green Hydrogen Hub
  "pmo-neer-004": "proj-member-portal",        // Duane Arnold Nuclear Restart
  // Corporate & Other → Maps to corporate-tagged projects
  "pmo-corp-001": "proj-data-foundation",      // Enterprise Data Platform
  "pmo-corp-002": "proj-api-gateway",          // NEET Transmission Expansion
  "pmo-corp-003": "proj-esg-reporting",        // ESG Reporting Automation
  "pmo-corp-004": "proj-regulatory-reporting"  // Cybersecurity Enhancement
};

// Get SAFe hierarchy for an enriched project
export function getSafeHierarchy(projectId: string): SAFeProject | undefined {
  const safeProjectId = projectLinkMapping[projectId];
  if (safeProjectId) {
    return safeProjects.find(sp => sp.id === safeProjectId);
  }
  return undefined;
}

// Get total features count for a project
export function getProjectFeatureCount(projectId: string): number {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.features?.length || 0;
}

// Get total stories count for a project (sum of stories across all features)
export function getProjectStoryCount(projectId: string): number {
  const safeProject = getSafeHierarchy(projectId);
  if (!safeProject) return 0;
  return safeProject.features?.reduce((sum, f) => sum + (f.stories?.length || 0), 0) || 0;
}

// Get total tasks count for a project (sum of tasks across all stories)
export function getProjectTaskCount(projectId: string): number {
  const safeProject = getSafeHierarchy(projectId);
  if (!safeProject) return 0;
  return safeProject.features?.reduce((sum, f) => 
    sum + (f.stories?.reduce((s, story) => s + (story.tasks?.length || 0), 0) || 0), 0) || 0;
}

// Get ART name for a project
export function getProjectART(projectId: string): string {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.artName || 'Transformation ART';
}

// Get total resources for a project
export function getProjectResources(projectId: string): Resource[] {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.resources || [];
}

// Get milestones for a project
export function getProjectMilestones(projectId: string): Milestone[] {
  const safeProject = getSafeHierarchy(projectId);
  return safeProject?.milestones || [];
}

// Summary of SAFe coverage across all projects
export const safeCoverageSummary = {
  projectsWithFullSAFe: Object.keys(projectLinkMapping).length,
  totalProjects: enrichedProjects.length,
  coveragePercentage: Math.round((Object.keys(projectLinkMapping).length / enrichedProjects.length) * 100),
  totalFeatures: safeProjects.reduce((sum, p) => sum + (p.features?.length || 0), 0),
  totalStories: safeProjects.reduce((sum, p) => 
    sum + (p.features?.reduce((fs, f) => fs + (f.stories?.length || 0), 0) || 0), 0),
  totalTasks: safeProjects.reduce((sum, p) => 
    sum + (p.features?.reduce((fs, f) => 
      fs + (f.stories?.reduce((ss, s) => ss + (s.tasks?.length || 0), 0) || 0), 0) || 0), 0)
};

// ============================================================================
// AUTO-ENRICHMENT: Populate SAFe hierarchy fields from safeProjects
// Runs at module load time
// ============================================================================

(function enrichProjectsWithSAFe() {
  enrichedProjects.forEach(project => {
    const safeProject = getSafeHierarchy(project.id);
    if (safeProject) {
      project.artName = safeProject.artName;
      project.portfolioTheme = safeProject.portfolioTheme;
      project.features = safeProject.features;
      project.resources = safeProject.resources;
      project.milestones = safeProject.milestones;
      project.safeDependencies = safeProject.dependencies;
      project.financials = safeProject.financials;
      project.currentPI = safeProject.currentPI;
      project.totalPIs = safeProject.totalPIs;
      project.velocity = safeProject.velocity;
      project.burndownHealth = safeProject.burndownHealth;
      project.qualityScore = safeProject.qualityScore;
    } else {
      // Synthetic SAFe hierarchy for projects without mapping
      const syntheticART = `${project.bu} Transformation ART`;
      project.artName = syntheticART;
      project.portfolioTheme = project.priority === 'critical' ? 'Digital Transformation' : 'Operational Excellence';
      const piMatch = project.safe?.currentPI?.match(/\d+\.(\d+)/);
      project.currentPI = piMatch ? parseInt(piMatch[1]) : 1;
      project.totalPIs = 6;
      project.velocity = project.safe?.velocity || 45;
      project.burndownHealth = project.safe?.flowEfficiency || 70;
      project.qualityScore = project.safe?.predictability || 80;
      // Ensure arrays exist for metric calculations
      project.features = project.features || [];
      project.resources = project.resources || [];
      project.milestones = project.milestones || [];
      project.safeDependencies = project.safeDependencies || [];
    }
  });
})();
