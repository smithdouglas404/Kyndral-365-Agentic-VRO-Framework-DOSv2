// ============================================================================
// NEXTERA ENERGY BUSINESS UNIT PROGRAMS - PMO vs VRO DIFFERENTIATION
// Source: NextEra Energy Annual Report 2024, Risk Management Supplement, Climate Report
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

// ============================================================================
// PMO VIEW - Traditional delivery tracking (What the CFO doesn't want)
// ============================================================================

export const pmoProjects: PMOProject[] = [
  // Institutional Retirement
  {
    id: "pmo-ir-001",
    name: "Grid Modernization System Upgrade",
    bu: "Florida Power & Light",
    status: "amber",
    budget: { spent: 2.4, total: 3.5, unit: "$m" },
    timeline: { elapsed: 8, total: 12, unit: "months" },
    deliverables: { completed: 6, total: 14 },
    risks: ["Integration delays with legacy systems", "Resource constraints in Q3"],
    nextMilestone: "UAT Phase 2 - Week 34",
    safe: {
      velocity: 48,
      predictability: 82,
      flowEfficiency: 68,
      currentPI: "PI 24.4",
      epicId: "EPIC-IR-101",
      epicName: "Grid Operations Digital Transformation",
      epicProgress: 55,
      okr: { objective: "Reduce outage response time by 40%", keyResult: "Achieve 3-minute average restoration", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 75 }, { pi: "PI 24.2", velocity: 45, predictability: 78 }, { pi: "PI 24.3", velocity: 46, predictability: 80 }, { pi: "PI 24.4", velocity: 48, predictability: 82 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Legacy API response times degrading 23% - integration risk increasing", confidence: 87, dataSource: "System monitoring" },
      { type: "opportunity", message: "Cloud migration could reduce integration complexity by 40%", confidence: 72, dataSource: "Architecture review" }
    ],
    proactiveActions: [
      { id: "pa-001", action: "Schedule API performance review with legacy team", impact: "Prevent 2-week delay", urgency: "immediate", type: "mitigate" },
      { id: "pa-002", action: "Request additional contractor resources for Q3", impact: "Maintain delivery pace", urgency: "this-week", type: "escalate" }
    ],
    trendData: [{ week: "W28", value: 42 }, { week: "W29", value: 45 }, { week: "W30", value: 43 }, { week: "W31", value: 48 }, { week: "W32", value: 52 }]
  },
  {
    id: "pmo-ir-002",
    name: "Demand Forecasting Enhancement",
    bu: "Florida Power & Light",
    status: "green",
    budget: { spent: 0.8, total: 1.2, unit: "$m" },
    timeline: { elapsed: 5, total: 6, unit: "months" },
    deliverables: { completed: 8, total: 10 },
    risks: ["Engineering sign-off pending"],
    nextMilestone: "Go-live - Week 28",
    safe: {
      velocity: 52,
      predictability: 91,
      flowEfficiency: 78,
      currentPI: "PI 25.1",
      epicId: "EPIC-IR-102",
      epicName: "Load Forecasting Modernization",
      epicProgress: 85,
      okr: { objective: "Improve demand prediction accuracy", keyResult: "Achieve 95% model accuracy", progress: 82 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 82 }, { pi: "PI 24.2", velocity: 48, predictability: 85 }, { pi: "PI 24.3", velocity: 50, predictability: 88 }, { pi: "PI 25.1", velocity: 52, predictability: 91 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "insight", message: "Model accuracy improved 12% with updated weather patterns", confidence: 94, dataSource: "Load analytics" }
    ],
    proactiveActions: [
      { id: "pa-003", action: "Fast-track engineering review to accelerate go-live", impact: "Save 1 week", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 78 }, { week: "W29", value: 82 }, { week: "W30", value: 85 }, { week: "W31", value: 88 }, { week: "W32", value: 92 }]
  },
  
  // Asset Management
  {
    id: "pmo-am-001",
    name: "Private Markets Platform Build",
    bu: "NextEra Energy Resources",
    status: "red",
    budget: { spent: 4.2, total: 4.0, unit: "$m" },
    timeline: { elapsed: 14, total: 18, unit: "months" },
    deliverables: { completed: 12, total: 22 },
    risks: ["Budget overrun by 5%", "Key vendor dependency", "Scope creep from stakeholders"],
    nextMilestone: "Executive Steering - Week 32",
    safe: {
      velocity: 38,
      predictability: 65,
      flowEfficiency: 52,
      currentPI: "PI 24.4",
      epicId: "EPIC-AM-201",
      epicName: "Private Markets Capability Build",
      epicProgress: 45,
      okr: { objective: "Grow private markets AUM by 20%", keyResult: "Platform operational for $5bn transactions", progress: 35 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 42, predictability: 72 }, { pi: "PI 24.3", velocity: 40, predictability: 68 }, { pi: "PI 24.4", velocity: 38, predictability: 65 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "Vendor showing financial stress signals - backup plan needed", confidence: 78, dataSource: "Vendor risk monitoring" },
      { type: "warning", message: "Scope creep adding $800k unless controlled now", confidence: 91, dataSource: "Change request analysis" },
      { type: "prediction", message: "Timeline likely to slip 6 weeks without intervention", confidence: 85, dataSource: "Delivery analytics" }
    ],
    proactiveActions: [
      { id: "pa-004", action: "Escalate to Eric Adler - executive decision required", impact: "Unblock critical path", urgency: "immediate", type: "escalate" },
      { id: "pa-005", action: "Freeze non-essential scope changes", impact: "Contain budget overrun", urgency: "immediate", type: "mitigate" },
      { id: "pa-006", action: "Identify alternative vendor for backup", impact: "Reduce single-vendor risk", urgency: "this-week", type: "investigate" }
    ],
    trendData: [{ week: "W28", value: 52 }, { week: "W29", value: 50 }, { week: "W30", value: 48 }, { week: "W31", value: 45 }, { week: "W32", value: 42 }]
  },
  {
    id: "pmo-am-002",
    name: "ESG Analytics Dashboard",
    bu: "NextEra Energy Resources",
    status: "green",
    budget: { spent: 0.6, total: 0.9, unit: "$m" },
    timeline: { elapsed: 4, total: 8, unit: "months" },
    deliverables: { completed: 5, total: 11 },
    risks: ["Data quality from third parties"],
    nextMilestone: "Beta release - Week 26",
    safe: {
      velocity: 55,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.3",
      epicId: "EPIC-AM-202",
      epicName: "ESG Data & Reporting",
      epicProgress: 62,
      okr: { objective: "Achieve industry-leading ESG analytics", keyResult: "Cover 100% of portfolio holdings", progress: 58 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 80 }, { pi: "PI 24.2", velocity: 50, predictability: 82 }, { pi: "PI 24.3", velocity: 52, predictability: 85 }, { pi: "PI 24.3", velocity: 55, predictability: 88 }]
    },
    safeStage: "portfolio-backlog",
    aiSignals: [
      { type: "opportunity", message: "Add TNFD metrics to gain first-mover advantage", confidence: 82, dataSource: "Regulatory scanner" }
    ],
    proactiveActions: [
      { id: "pa-007", action: "Expand scope to include nature-risk metrics", impact: "Industry leadership", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 45 }, { week: "W29", value: 52 }, { week: "W30", value: 58 }, { week: "W31", value: 62 }, { week: "W32", value: 68 }]
  },

  // Retail
  {
    id: "pmo-rt-001",
    name: "Digital Onboarding Redesign",
    bu: "Florida Power & Light",
    status: "amber",
    budget: { spent: 1.8, total: 2.5, unit: "$m" },
    timeline: { elapsed: 6, total: 10, unit: "months" },
    deliverables: { completed: 7, total: 16 },
    risks: ["Mobile app testing delays", "Accessibility compliance gaps"],
    nextMilestone: "Customer pilot - Week 30",
    safe: {
      velocity: 45,
      predictability: 78,
      flowEfficiency: 65,
      currentPI: "PI 24.4",
      epicId: "EPIC-RT-301",
      epicName: "Customer Digital Experience",
      epicProgress: 48,
      okr: { objective: "Achieve 50% digital policy adoption", keyResult: "Reduce onboarding time to under 10 minutes", progress: 52 },
      piTrend: [{ pi: "PI 24.1", velocity: 40, predictability: 72 }, { pi: "PI 24.2", velocity: 42, predictability: 74 }, { pi: "PI 24.3", velocity: 44, predictability: 76 }, { pi: "PI 24.4", velocity: 45, predictability: 78 }]
    },
    safeStage: "implementing",
    aiSignals: [
      { type: "warning", message: "WCAG 2.1 compliance at 78% - needs 95% for launch", confidence: 96, dataSource: "Accessibility scanner" },
      { type: "insight", message: "Drop-off rate highest at step 3 - simplification would increase conversion 15%", confidence: 88, dataSource: "User analytics" }
    ],
    proactiveActions: [
      { id: "pa-008", action: "Engage accessibility specialist contractor", impact: "Close compliance gap", urgency: "this-week", type: "mitigate" },
      { id: "pa-009", action: "Redesign step 3 to reduce friction", impact: "+15% conversion", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 38 }, { week: "W29", value: 42 }, { week: "W30", value: 44 }, { week: "W31", value: 48 }, { week: "W32", value: 52 }]
  },
  {
    id: "pmo-rt-002",
    name: "AI Chatbot Implementation",
    bu: "Florida Power & Light",
    status: "green",
    budget: { spent: 0.4, total: 0.7, unit: "$m" },
    timeline: { elapsed: 3, total: 5, unit: "months" },
    deliverables: { completed: 4, total: 7 },
    risks: ["Training data quality"],
    nextMilestone: "Soft launch - Week 24",
    safe: {
      velocity: 62,
      predictability: 92,
      flowEfficiency: 82,
      currentPI: "PI 24.4",
      epicId: "EPIC-RT-302",
      epicName: "AI Customer Service",
      epicProgress: 72,
      okr: { objective: "Reduce customer service calls by 30%", keyResult: "Handle 50% of queries via AI", progress: 65 },
      piTrend: [{ pi: "PI 24.1", velocity: 52, predictability: 85 }, { pi: "PI 24.2", velocity: 55, predictability: 87 }, { pi: "PI 24.3", velocity: 58, predictability: 90 }, { pi: "PI 24.4", velocity: 62, predictability: 92 }]
    },
    safeStage: "done",
    aiSignals: [
      { type: "insight", message: "Current accuracy 89% - exceeds 85% target", confidence: 95, dataSource: "ML model metrics" },
      { type: "opportunity", message: "Voice capability could handle 30% more queries", confidence: 76, dataSource: "Customer research" }
    ],
    proactiveActions: [
      { id: "pa-010", action: "Plan Phase 2 with voice capability", impact: "30% more automation", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 55 }, { week: "W29", value: 62 }, { week: "W30", value: 70 }, { week: "W31", value: 78 }, { week: "W32", value: 85 }]
  },

  // Corporate Investments
  {
    id: "pmo-ci-001",
    name: "Net Zero Housing Tracker",
    bu: "Corporate & Other",
    status: "green",
    budget: { spent: 0.5, total: 0.8, unit: "$m" },
    timeline: { elapsed: 4, total: 6, unit: "months" },
    deliverables: { completed: 6, total: 9 },
    risks: ["Sensor integration with older properties"],
    nextMilestone: "Phase 2 rollout - Week 27",
    safe: {
      velocity: 48,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.4",
      epicId: "EPIC-CI-401",
      epicName: "Carbon Neutral Portfolio",
      epicProgress: 68,
      okr: { objective: "Achieve carbon neutral portfolio by 2030", keyResult: "Deploy to 1000 properties", progress: 45 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 82 }, { pi: "PI 24.2", velocity: 44, predictability: 84 }, { pi: "PI 24.3", velocity: 46, predictability: 86 }, { pi: "PI 24.4", velocity: 48, predictability: 88 }]
    },
    safeStage: "analyzing",
    aiSignals: [
      { type: "insight", message: "Energy savings 42% better than projected in pilot sites", confidence: 92, dataSource: "IoT telemetry" },
      { type: "prediction", message: "Q4 rollout to 500 properties feasible ahead of schedule", confidence: 81, dataSource: "Capacity model" }
    ],
    proactiveActions: [
      { id: "pa-011", action: "Accelerate rollout to 500 properties by Q4", impact: "Earlier carbon savings", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 62 }, { week: "W29", value: 68 }, { week: "W30", value: 72 }, { week: "W31", value: 78 }, { week: "W32", value: 82 }]
  },

  // Risk & Compliance
  {
    id: "pmo-rc-001",
    name: "Risk Appetite Dashboard Upgrade",
    bu: "Corporate & Other",
    status: "amber",
    budget: { spent: 1.1, total: 1.5, unit: "$m" },
    timeline: { elapsed: 7, total: 9, unit: "months" },
    deliverables: { completed: 9, total: 15 },
    risks: ["Data lineage documentation incomplete", "Regulatory changes pending"],
    nextMilestone: "CRO sign-off - Week 29",
    safe: {
      velocity: 42,
      predictability: 75,
      flowEfficiency: 62,
      currentPI: "PI 24.3",
      epicId: "EPIC-RC-501",
      epicName: "Enterprise Risk Framework",
      epicProgress: 58,
      okr: { objective: "Zero regulatory breaches", keyResult: "100% risk appetite coverage", progress: 72 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 70 }, { pi: "PI 24.2", velocity: 40, predictability: 72 }, { pi: "PI 24.3", velocity: 41, predictability: 74 }, { pi: "PI 24.3", velocity: 42, predictability: 75 }]
    },
    safeStage: "reviewing",
    aiSignals: [
      { type: "warning", message: "PRA consultation may require 3 additional metrics", confidence: 74, dataSource: "Regulatory intelligence" },
      { type: "insight", message: "Data lineage gaps concentrated in 2 legacy systems", confidence: 88, dataSource: "Data quality scan" }
    ],
    proactiveActions: [
      { id: "pa-012", action: "Engage with PRA to clarify requirements", impact: "Avoid rework", urgency: "this-week", type: "investigate" },
      { id: "pa-013", action: "Focus data lineage sprint on 2 priority systems", impact: "Close 80% of gaps", urgency: "immediate", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 58 }, { week: "W29", value: 60 }, { week: "W30", value: 62 }, { week: "W31", value: 64 }, { week: "W32", value: 66 }]
  },
  {
    id: "pmo-rc-002",
    name: "Enterprise Risk Governance Automation",
    bu: "Corporate & Other",
    status: "green",
    budget: { spent: 0.7, total: 1.0, unit: "$m" },
    timeline: { elapsed: 5, total: 8, unit: "months" },
    deliverables: { completed: 6, total: 10 },
    risks: ["User adoption in Business Lines"],
    nextMilestone: "Pilot in Retail - Week 26",
    safe: {
      velocity: 52,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 25.1",
      epicId: "EPIC-RC-502",
      epicName: "GRC Automation Platform",
      epicProgress: 65,
      okr: { objective: "Complete operational resilience framework", keyResult: "Automate 80% of controls", progress: 58 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 50, predictability: 82 }, { pi: "PI 25.1", velocity: 52, predictability: 85 }]
    },
    safeStage: "funnel",
    aiSignals: [
      { type: "insight", message: "Retail division showing 92% adoption in pilot - highest across BUs", confidence: 94, dataSource: "Usage analytics" },
      { type: "opportunity", message: "Success playbook from Retail can accelerate other BU rollouts", confidence: 86, dataSource: "Change management" }
    ],
    proactiveActions: [
      { id: "pa-014", action: "Create Retail playbook for other BU adoption", impact: "Faster enterprise rollout", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 58 }, { week: "W29", value: 65 }, { week: "W30", value: 72 }, { week: "W31", value: 78 }, { week: "W32", value: 85 }]
  }
];

// ============================================================================
// VRO VIEW - Value-driven outcomes (What transformation should deliver)
// ============================================================================

export const vroPrograms: VROProgram[] = [
  // Institutional Retirement - Andrew Kail
  {
    id: "vro-ir-001",
    name: "AI-Powered Deal Acceleration",
    bu: "Florida Power & Light",
    valueStatus: "accelerating",
    expectedROI: "$85m annual efficiency",
    roiValue: 85,
    valueRealized: 28,
    strategicAlignment: 94,
    aiInsight: "ML model detecting 3 deals with pricing anomalies - early intervention preventing $12m reserve gap",
    prediction: "Q3 pipeline suggests 15% deal volume increase - recommend pre-positioning underwriting capacity",
    keyOutcomes: [
      { outcome: "Deal cycle reduction", progress: 18, target: 5, unit: "days" },
      { outcome: "Pipeline conversion", progress: 72, target: 85, unit: "%" },
      { outcome: "Pricing accuracy", progress: 94, target: 98, unit: "%" }
    ],
    collaborators: ["Andrew Kail", "Actuary Team", "Risk"],
    riskMitigation: "Longevity variance monitoring active - 2.3% deviation flagged for review",
    safe: {
      velocity: 58,
      predictability: 92,
      flowEfficiency: 78,
      currentPI: "PI 25.2",
      epicId: "EPIC-VRO-IR-01",
      epicName: "AI Deal Intelligence",
      epicProgress: 72,
      okr: { objective: "Reduce project approval cycle by 40%", keyResult: "18-day to 5-day reduction", progress: 68 },
      piTrend: [{ pi: "PI 24.1", velocity: 48, predictability: 85 }, { pi: "PI 24.2", velocity: 52, predictability: 88 }, { pi: "PI 24.3", velocity: 55, predictability: 90 }, { pi: "PI 25.2", velocity: 58, predictability: 92 }]
    },
    aiSignals: [
      { type: "opportunity", message: "3 deals showing pricing anomalies - $12m reserve gap preventable", confidence: 92, dataSource: "ML pricing model" },
      { type: "prediction", message: "Q3 deal volume up 15% - capacity planning needed now", confidence: 87, dataSource: "Pipeline analytics" }
    ],
    proactiveActions: [
      { id: "vpa-001", action: "Intervene on 3 flagged deals immediately", impact: "Prevent $12m reserve gap", urgency: "immediate", type: "mitigate" },
      { id: "vpa-002", action: "Pre-position underwriting capacity for Q3 surge", impact: "Capture 15% more deals", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 28 }, { week: "W29", value: 32 }, { week: "W30", value: 38 }, { week: "W31", value: 45 }, { week: "W32", value: 52 }]
  },
  {
    id: "vro-ir-002",
    name: "Longevity Risk Intelligence",
    bu: "Florida Power & Light",
    valueStatus: "on-track",
    expectedROI: "$42m risk mitigation",
    roiValue: 42,
    valueRealized: 15,
    strategicAlignment: 88,
    aiInsight: "Generation performance trending 1.2% favorable vs projections - recommend capacity expansion review",
    prediction: "Demand pattern shift in Southeast region may impact 2026 capacity - proactive grid expansion recommended",
    keyOutcomes: [
      { outcome: "Forecast accuracy", progress: 96, target: 99, unit: "%" },
      { outcome: "Early warning detections", progress: 8, target: 12, unit: "/quarter" },
      { outcome: "Grid efficiency gains", progress: 4.2, target: 6, unit: "$m savings" }
    ],
    collaborators: ["Rebecca Kujawa (CRO)", "Grid Operations", "Finance"],
    riskMitigation: "AI monitoring 847 grid segments in real-time",
    safe: {
      velocity: 52,
      predictability: 88,
      flowEfficiency: 72,
      currentPI: "PI 24.3",
      epicId: "EPIC-VRO-IR-02",
      epicName: "Grid Intelligence Platform",
      epicProgress: 65,
      okr: { objective: "Achieve 99% forecast accuracy", keyResult: "Track 847 grid segments in real-time", progress: 75 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 80 }, { pi: "PI 24.2", velocity: 48, predictability: 83 }, { pi: "PI 24.3", velocity: 50, predictability: 85 }, { pi: "PI 24.3", velocity: 52, predictability: 88 }]
    },
    aiSignals: [
      { type: "insight", message: "Performance 1.2% favorable - potential capacity optimization", confidence: 89, dataSource: "Grid AI" },
      { type: "warning", message: "Southeast demand pattern shift detected", confidence: 76, dataSource: "Load analytics" }
    ],
    proactiveActions: [
      { id: "vpa-003", action: "Commission capacity optimization review with engineering", impact: "Unlock $8m efficiency", urgency: "this-week", type: "accelerate" },
      { id: "vpa-004", action: "Engage construction teams for 2026 grid expansion", impact: "Meet demand growth", urgency: "this-month", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 15 }, { week: "W29", value: 18 }, { week: "W30", value: 22 }, { week: "W31", value: 28 }, { week: "W32", value: 35 }]
  },

  // Wind Portfolio - Rebecca Kujawa
  {
    id: "vro-am-001",
    name: "NEER Wind Repowering Initiative",
    bu: "NextEra Energy Resources",
    valueStatus: "accelerating",
    expectedROI: "$450M annual revenue increase",
    roiValue: 450,
    valueRealized: 180,
    strategicAlignment: 96,
    aiInsight: "Repowered turbines achieving 35% capacity factor improvement - accelerate Phase 2 sites",
    prediction: "ITC/PTC extension creates 3-year window for maximum incentive capture - prioritize 2025 completions",
    keyOutcomes: [
      { outcome: "MW repowered", progress: 2800, target: 4500, unit: "MW" },
      { outcome: "Capacity factor improvement", progress: 32, target: 40, unit: "%" },
      { outcome: "PPA revenue increase", progress: 280, target: 450, unit: "$M/yr" }
    ],
    collaborators: ["Wind Operations", "Development", "Finance"],
    riskMitigation: "Turbine supply secured through 2027 via GE Vernova partnership",
    safe: {
      velocity: 55,
      predictability: 85,
      flowEfficiency: 72,
      currentPI: "PI 25.1",
      epicId: "EPIC-VRO-AM-01",
      epicName: "Wind Fleet Optimization",
      epicProgress: 58,
      okr: { objective: "Repower 4,500 MW by 2026", keyResult: "Achieve 40% capacity factor", progress: 62 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 78 }, { pi: "PI 24.2", velocity: 48, predictability: 80 }, { pi: "PI 24.3", velocity: 52, predictability: 82 }, { pi: "PI 25.1", velocity: 55, predictability: 85 }]
    },
    aiSignals: [
      { type: "opportunity", message: "ITC/PTC window - accelerate 2025 completions", confidence: 94, dataSource: "Policy analytics" },
      { type: "prediction", message: "35% capacity improvement trending above plan", confidence: 88, dataSource: "SCADA analytics" }
    ],
    proactiveActions: [
      { id: "vpa-005", action: "Fast-track high-wind sites for 2025 completion", impact: "Capture $120M additional incentives", urgency: "immediate", type: "accelerate" },
      { id: "vpa-006", action: "Negotiate volume discount with GE Vernova", impact: "$45M savings potential", urgency: "this-week", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 2600 }, { week: "W29", value: 2650 }, { week: "W30", value: 2700 }, { week: "W31", value: 2750 }, { week: "W32", value: 2800 }]
  },
  {
    id: "vro-am-002",
    name: "Stewardship Leadership",
    bu: "NextEra Energy Resources",
    valueStatus: "on-track",
    expectedROI: "Industry-leading ESG positioning",
    roiValue: 0,
    valueRealized: 0,
    strategicAlignment: 92,
    aiInsight: "3,617 environmental engagements completed - sentiment analysis shows 78% positive reception from portfolio companies",
    prediction: "New EU taxonomy requirements in 2026 will advantage early adopters - recommend accelerating TNFD alignment",
    keyOutcomes: [
      { outcome: "Company engagements", progress: 847, target: 1000, unit: "on climate" },
      { outcome: "Environmental votes", progress: 92, target: 95, unit: "% cast" },
      { outcome: "Supplier SBT coverage", progress: 65, target: 100, unit: "%" }
    ],
    collaborators: ["Carl Moxley", "Investment Stewardship", "Legal"],
    riskMitigation: "Greenwashing risk mitigated through TCFD-aligned disclosures",
    safe: {
      velocity: 48,
      predictability: 88,
      flowEfficiency: 75,
      currentPI: "PI 24.3",
      epicId: "EPIC-VRO-AM-02",
      epicName: "ESG Stewardship Excellence",
      epicProgress: 72,
      okr: { objective: "Achieve industry-leading ESG positioning", keyResult: "Complete 1000 climate engagements", progress: 85 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 82 }, { pi: "PI 24.2", velocity: 44, predictability: 84 }, { pi: "PI 24.3", velocity: 46, predictability: 86 }, { pi: "PI 24.3", velocity: 48, predictability: 88 }]
    },
    aiSignals: [
      { type: "insight", message: "78% positive reception on engagements - momentum building", confidence: 91, dataSource: "Sentiment analysis" },
      { type: "opportunity", message: "EU taxonomy early adoption creates competitive edge", confidence: 85, dataSource: "Regulatory intelligence" }
    ],
    proactiveActions: [
      { id: "vpa-007", action: "Accelerate TNFD framework implementation", impact: "First-mover advantage", urgency: "this-month", type: "accelerate" },
      { id: "vpa-008", action: "Publish engagement success stories externally", impact: "Attract ESG mandates", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 780 }, { week: "W29", value: 800 }, { week: "W30", value: 820 }, { week: "W31", value: 835 }, { week: "W32", value: 847 }]
  },

  // Retail - Paula Llewellyn
  {
    id: "vro-rt-001",
    name: "Digital Customer Experience",
    bu: "Florida Power & Light",
    valueStatus: "accelerating",
    expectedROI: "$28m efficiency + NPS lift",
    roiValue: 28,
    valueRealized: 12,
    strategicAlignment: 90,
    aiInsight: "Customer feedback analysis: 78% prefer digital-first journey - voice analysis detecting frustration in call center queue times",
    prediction: "NPS projected to reach 55 by Q4 if current trajectory continues - recommend extending AI chatbot coverage",
    keyOutcomes: [
      { outcome: "Digital adoption", progress: 71, target: 85, unit: "%" },
      { outcome: "Call center volume reduction", progress: 25, target: 40, unit: "%" },
      { outcome: "NPS score", progress: 48, target: 55, unit: "" }
    ],
    collaborators: ["Paula Llewellyn", "Digital", "Customer Service"],
    riskMitigation: "Accessibility compliance automated - 98% WCAG 2.1 AA compliance",
    safe: {
      velocity: 58,
      predictability: 90,
      flowEfficiency: 78,
      currentPI: "PI 25.2",
      epicId: "EPIC-VRO-RT-01",
      epicName: "Digital-First Customer Journey",
      epicProgress: 68,
      okr: { objective: "Achieve 85% digital adoption", keyResult: "Reach NPS score of 55", progress: 72 },
      piTrend: [{ pi: "PI 24.1", velocity: 50, predictability: 82 }, { pi: "PI 24.2", velocity: 52, predictability: 85 }, { pi: "PI 24.3", velocity: 55, predictability: 88 }, { pi: "PI 25.2", velocity: 58, predictability: 90 }]
    },
    aiSignals: [
      { type: "insight", message: "Voice analysis: call queue frustration detected - chatbot expansion would help", confidence: 88, dataSource: "Voice analytics AI" },
      { type: "prediction", message: "NPS on track for 55 by Q4 - maintain momentum", confidence: 82, dataSource: "Customer analytics" }
    ],
    proactiveActions: [
      { id: "vpa-009", action: "Expand chatbot to handle queue overflow", impact: "Reduce frustration by 40%", urgency: "this-week", type: "accelerate" },
      { id: "vpa-010", action: "Launch digital-first marketing campaign", impact: "Accelerate adoption 15%", urgency: "this-month", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 8 }, { week: "W29", value: 9 }, { week: "W30", value: 10 }, { week: "W31", value: 11 }, { week: "W32", value: 12 }]
  },
  {
    id: "vro-rt-002",
    name: "FPL Solar Expansion Program",
    bu: "Florida Power & Light",
    valueStatus: "on-track",
    expectedROI: "$320M annual cost savings",
    roiValue: 320,
    valueRealized: 85,
    strategicAlignment: 94,
    aiInsight: "SolarTogether program achieving 15% above target enrollment - recommend capacity expansion",
    prediction: "Solar installation costs declining 8% YoY - opportunity to accelerate deployment timeline",
    keyOutcomes: [
      { outcome: "Solar MW deployed", progress: 4200, target: 5000, unit: "MW" },
      { outcome: "Customer enrollments", progress: 185000, target: 220000, unit: "" },
      { outcome: "Cost per kWh reduction", progress: 12, target: 15, unit: "%" }
    ],
    collaborators: ["Solar Operations", "Customer Programs", "Grid Planning"],
    riskMitigation: "Panel supply chain diversified - 3 tier-1 suppliers under contract",
    safe: {
      velocity: 52,
      predictability: 86,
      flowEfficiency: 72,
      currentPI: "PI 25.1",
      epicId: "EPIC-VRO-RT-02",
      epicName: "Solar Portfolio Scale-up",
      epicProgress: 58,
      okr: { objective: "Deploy 5,000 MW solar by 2025", keyResult: "Achieve 15% cost reduction", progress: 65 },
      piTrend: [{ pi: "PI 24.1", velocity: 45, predictability: 80 }, { pi: "PI 24.2", velocity: 48, predictability: 82 }, { pi: "PI 24.3", velocity: 50, predictability: 84 }, { pi: "PI 25.1", velocity: 52, predictability: 86 }]
    },
    aiSignals: [
      { type: "opportunity", message: "Panel pricing at historic low - accelerate procurement", confidence: 79, dataSource: "Market intelligence" },
      { type: "prediction", message: "Enrollment trend suggests 220K target achievable by Q3", confidence: 86, dataSource: "Customer analytics" }
    ],
    proactiveActions: [
      { id: "vpa-011", action: "Lock in panel pricing for next 500MW", impact: "$15M savings potential", urgency: "immediate", type: "accelerate" },
      { id: "vpa-012", action: "Scale interconnection capacity for growth", impact: "Avoid grid constraints", urgency: "this-month", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 4000 }, { week: "W29", value: 4050 }, { week: "W30", value: 4100 }, { week: "W31", value: 4150 }, { week: "W32", value: 4200 }]
  },

  // Corporate Investments - Laura Mason
  {
    id: "vro-ci-001",
    name: "Net Zero Homes Acceleration",
    bu: "Corporate & Other",
    valueStatus: "accelerating",
    expectedROI: "$180m development value",
    roiValue: 180,
    valueRealized: 45,
    strategicAlignment: 98,
    aiInsight: "Millfield Green (UK's first net zero retirement community) achieving 40% energy cost reduction - scale to 5 sites",
    prediction: "Planning approval sentiment analysis: 85% positive in target councils - recommend accelerated land acquisition",
    keyOutcomes: [
      { outcome: "Gas-free homes (LGAH)", progress: 61, target: 100, unit: "%" },
      { outcome: "Housing completions", progress: 3800, target: 4500, unit: "homes" },
      { outcome: "Clean energy investment", progress: 2.3, target: 3.0, unit: "$bn" }
    ],
    collaborators: ["Laura Mason", "Sustainability", "Planning"],
    riskMitigation: "Supply chain risk monitored - ground source heat pump delivery on track via Kensa partnership",
    safe: {
      velocity: 48,
      predictability: 92,
      flowEfficiency: 78,
      currentPI: "PI 24.3",
      epicId: "EPIC-VRO-CI-01",
      epicName: "Net Zero Property Portfolio",
      epicProgress: 75,
      okr: { objective: "100% gas-free new homes", keyResult: "Complete 4500 homes by 2025", progress: 68 },
      piTrend: [{ pi: "PI 24.1", velocity: 42, predictability: 85 }, { pi: "PI 24.2", velocity: 44, predictability: 88 }, { pi: "PI 24.3", velocity: 46, predictability: 90 }, { pi: "PI 24.3", velocity: 48, predictability: 92 }]
    },
    aiSignals: [
      { type: "insight", message: "Millfield Green: 40% energy savings - scale model proven", confidence: 95, dataSource: "IoT monitoring" },
      { type: "opportunity", message: "85% planning approval sentiment in target councils", confidence: 83, dataSource: "Sentiment analysis" }
    ],
    proactiveActions: [
      { id: "vpa-013", action: "Replicate Millfield Green model at 5 new sites", impact: "$90m additional value", urgency: "this-week", type: "accelerate" },
      { id: "vpa-014", action: "Accelerate land acquisition in favorable councils", impact: "First-mover on sites", urgency: "immediate", type: "accelerate" }
    ],
    trendData: [{ week: "W28", value: 35 }, { week: "W29", value: 38 }, { week: "W30", value: 40 }, { week: "W31", value: 43 }, { week: "W32", value: 45 }]
  },

  // Risk & Compliance - Chris Knight
  {
    id: "vro-rc-001",
    name: "Intelligent Risk Monitoring",
    bu: "Corporate & Other",
    valueStatus: "accelerating",
    expectedROI: "$60m+ annual risk savings",
    roiValue: 60,
    valueRealized: 22,
    strategicAlignment: 95,
    aiInsight: "Credit portfolio showing 0.3% deterioration in BBB cohort - recommending sector rotation before downgrade cycle",
    prediction: "Cyber threat landscape analysis: 23% increase in insurance-sector attacks expected - recommend enhanced SOC coverage",
    keyOutcomes: [
      { outcome: "Early warning accuracy", progress: 87, target: 95, unit: "%" },
      { outcome: "Risk incidents", progress: 8, target: 3, unit: "/quarter" },
      { outcome: "Three Lines coverage", progress: 78, target: 95, unit: "%" }
    ],
    collaborators: ["Chris Knight", "IT Security", "Internal Audit"],
    riskMitigation: "Emerging risks dashboard monitoring 47 risk indicators in real-time",
    safe: {
      velocity: 45,
      predictability: 85,
      flowEfficiency: 68,
      currentPI: "PI 25.2",
      epicId: "EPIC-VRO-RC-01",
      epicName: "AI-Powered Risk Intelligence",
      epicProgress: 62,
      okr: { objective: "Achieve 95% early warning accuracy", keyResult: "Reduce risk incidents to 3/quarter", progress: 55 },
      piTrend: [{ pi: "PI 24.1", velocity: 38, predictability: 78 }, { pi: "PI 24.2", velocity: 40, predictability: 80 }, { pi: "PI 24.3", velocity: 42, predictability: 82 }, { pi: "PI 25.2", velocity: 45, predictability: 85 }]
    },
    aiSignals: [
      { type: "warning", message: "BBB cohort showing 0.3% deterioration - act before downgrades", confidence: 91, dataSource: "Credit AI" },
      { type: "prediction", message: "23% increase in insurance-sector cyber attacks expected", confidence: 84, dataSource: "Threat intelligence" }
    ],
    proactiveActions: [
      { id: "vpa-015", action: "Execute sector rotation from at-risk BBB issuers", impact: "Avoid $15m credit losses", urgency: "immediate", type: "mitigate" },
      { id: "vpa-016", action: "Expand SOC coverage for enhanced monitoring", impact: "Reduce cyber exposure", urgency: "this-week", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 15 }, { week: "W29", value: 17 }, { week: "W30", value: 19 }, { week: "W31", value: 21 }, { week: "W32", value: 22 }]
  },
  {
    id: "vro-rc-002",
    name: "Climate Risk Integration",
    bu: "Corporate & Other",
    valueStatus: "on-track",
    expectedROI: "Regulatory compliance + $15m efficiency",
    roiValue: 15,
    valueRealized: 5,
    strategicAlignment: 92,
    aiInsight: "Portfolio temperature alignment at 2.4°C - transition pathway modelling shows 1.5°C achievable with $2.1bn reallocation",
    prediction: "TCFD+ requirements expected 2026 - current readiness at 82%, recommend accelerating nature risk disclosures",
    keyOutcomes: [
      { outcome: "Portfolio temperature", progress: 2.4, target: 1.5, unit: "°C" },
      { outcome: "Financed emissions reduction", progress: 37, target: 50, unit: "%" },
      { outcome: "TNFD readiness", progress: 65, target: 100, unit: "%" }
    ],
    collaborators: ["Carl Moxley", "Investment", "Regulatory"],
    riskMitigation: "Physical climate risk mapped for 100% of real estate portfolio",
    safe: {
      velocity: 42,
      predictability: 82,
      flowEfficiency: 70,
      currentPI: "PI 25.1",
      epicId: "EPIC-VRO-RC-02",
      epicName: "Climate Risk Framework",
      epicProgress: 55,
      okr: { objective: "Achieve 1.5°C portfolio alignment", keyResult: "100% TNFD readiness", progress: 48 },
      piTrend: [{ pi: "PI 24.1", velocity: 35, predictability: 75 }, { pi: "PI 24.2", velocity: 38, predictability: 78 }, { pi: "PI 24.3", velocity: 40, predictability: 80 }, { pi: "PI 25.1", velocity: 42, predictability: 82 }]
    },
    aiSignals: [
      { type: "insight", message: "1.5°C pathway achievable with $2.1bn reallocation", confidence: 88, dataSource: "Climate model" },
      { type: "warning", message: "TCFD+ requirements in 2026 - readiness gap exists", confidence: 90, dataSource: "Regulatory intelligence" }
    ],
    proactiveActions: [
      { id: "vpa-017", action: "Commission $2.1bn transition pathway analysis", impact: "Achieve 1.5°C alignment", urgency: "this-month", type: "accelerate" },
      { id: "vpa-018", action: "Accelerate TNFD disclosure preparation", impact: "Regulatory compliance", urgency: "this-week", type: "mitigate" }
    ],
    trendData: [{ week: "W28", value: 3 }, { week: "W29", value: 3.5 }, { week: "W30", value: 4 }, { week: "W31", value: 4.5 }, { week: "W32", value: 5 }]
  }
];

// ============================================================================
// RISK ISSUES - From Risk Management Supplement 2024
// ============================================================================

export interface RiskIssue {
  id: string;
  category: "operational" | "market" | "regulatory" | "environmental" | "non-financial";
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  trend: "improving" | "stable" | "worsening";
  description: string;
  exposure: string;
  mitigation: string;
  owner: string;
  aiAlert?: string;
  lastReview: string;
  source: string;
}

export const riskIssues: RiskIssue[] = [
  // Operational Risk - Hurricane Exposure
  {
    id: "risk-001",
    category: "operational",
    name: "Hurricane & Severe Weather Exposure",
    severity: "high",
    trend: "stable",
    description: "FPL service territory in Florida exposed to hurricanes, tropical storms, and severe weather. Storm damage restoration costs can exceed $1B per major event.",
    exposure: "35,052 MW generation capacity",
    mitigation: "Storm hardening, vegetation management, restoration crews, mutual aid agreements",
    owner: "Armando Pimentel",
    aiAlert: "2024 storm season: Milton and Helene required $1.2B restoration - within reserves",
    lastReview: "2024-12-15",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  // Project Execution Risk
  {
    id: "risk-002",
    category: "operational",
    name: "Renewable Project Execution Risk",
    severity: "high",
    trend: "stable",
    description: "NEER's 36.5-46.5 GW renewable buildout through 2027 faces execution risks including permitting delays, interconnection queue backlogs, and construction labor shortages.",
    exposure: "68 GW development pipeline",
    mitigation: "Diversified project portfolio, early procurement, multiple vendor relationships",
    owner: "Rebecca Kujawa",
    aiAlert: "3 projects experiencing interconnection delays - replanning in progress",
    lastReview: "2024-12-10",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  // Cyber Risk - Critical Infrastructure
  {
    id: "risk-003",
    category: "non-financial",
    name: "NERC CIP & Cyber Security",
    severity: "critical",
    trend: "worsening",
    description: "Critical infrastructure protection requirements and evolving cyber threats targeting energy sector. NERC CIP compliance essential for grid operations.",
    exposure: "Grid operations + customer data",
    mitigation: "NERC CIP compliance program, SOC 24/7, regular penetration testing, OT/IT segmentation",
    owner: "Kirk Crews",
    aiAlert: "42% increase in energy-sector attacks detected - enhanced monitoring activated",
    lastReview: "2024-12-18",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  // Environmental & Climate Risk
  {
    id: "risk-004",
    category: "environmental",
    name: "Climate & Environmental Compliance",
    severity: "high",
    trend: "worsening",
    description: "Climate transition risks, EPA regulations, and Real Zero 2045 commitments require ongoing capital investment and operational changes.",
    exposure: "180 GW renewable portfolio",
    mitigation: "Real Zero roadmap, TCFD disclosure, renewable buildout acceleration, carbon reduction",
    owner: "Eric Silagy",
    aiAlert: "2024 warmest year on record - storm frequency models updated",
    lastReview: "2024-12-12",
    source: "NextEra Energy Sustainability Report 2024"
  },
  // Market Risk - Commodity Prices
  {
    id: "risk-005",
    category: "market",
    name: "Energy Commodity & PPA Pricing",
    severity: "medium",
    trend: "improving",
    description: "Exposure to natural gas, power prices, and long-term PPA pricing dynamics affecting NEER merchant and contracted revenues.",
    exposure: "$18.5B operating revenue",
    mitigation: "Hedging programs, PPA diversification, fuel cost recovery clauses",
    owner: "Kirk Crews (CFO)",
    lastReview: "2024-12-08",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  // Technology Risk - Grid Systems
  {
    id: "risk-006",
    category: "operational",
    name: "Grid Technology & SCADA Systems",
    severity: "medium",
    trend: "improving",
    description: "Critical dependence on SCADA, EMS, and smart grid technology for operations. System failures could impact reliability and customer service.",
    exposure: "91,000 circuit miles",
    mitigation: "System redundancy, grid modernization, AMI deployment, DR/BCP testing",
    owner: "CIO",
    lastReview: "2024-12-05",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  // Supply Chain Risk
  {
    id: "risk-007",
    category: "operational",
    name: "Supply Chain & Equipment Vendors",
    severity: "medium",
    trend: "stable",
    description: "Reliance on solar panel, battery, and wind turbine suppliers. Supply disruptions could delay renewable project timelines.",
    exposure: "68 GW development pipeline",
    mitigation: "Vendor diversification, inventory buffers, multi-year procurement contracts",
    owner: "Procurement",
    aiAlert: "2 solar panel suppliers showing delivery delays - contingency sourcing activated",
    lastReview: "2024-12-14",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  // Regulatory Risk
  {
    id: "risk-008",
    category: "regulatory",
    name: "Rate Case & FERC Regulatory Outcomes",
    severity: "medium",
    trend: "stable",
    description: "FPL rate-regulated earnings depend on Florida PSC approval. Rate case filings and FERC transmission tariffs affect revenue recovery.",
    exposure: "Current ROE 10.15-11.15%",
    mitigation: "Regulatory engagement, rate case preparation, prudent capital deployment",
    owner: "Regulatory Affairs",
    lastReview: "2024-12-11",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  }
];

// Summary statistics
export const pmoSummary = {
  totalProjects: pmoProjects.length,
  green: pmoProjects.filter(p => p.status === "green").length,
  amber: pmoProjects.filter(p => p.status === "amber").length,
  red: pmoProjects.filter(p => p.status === "red").length,
  totalBudget: pmoProjects.reduce((sum, p) => sum + p.budget.total, 0),
  totalSpent: pmoProjects.reduce((sum, p) => sum + p.budget.spent, 0)
};

// ============================================================================
// PORTFOLIO-LEVEL DATA - Group Function Portfolios with SAFe 6.0 Metrics
// ============================================================================
export interface BUPortfolio {
  id: string;
  name: string;
  description: string;
  projectCount: number;
  programCount: number;
  totalBudget: number;
  budgetSpent: number;
  valueRealized: number;
  expectedValue: number;
  healthScore: number; // 0-100
  strategicAlignment: number; // 0-100
  activeEpics: number;
  completedEpics: number;
  currentPI: string;
  velocity: number;
  predictability: number;
  flowEfficiency: number;
  topAISignal: AISignal;
  topAction: ProactiveAction;
  okrs: { objective: string; progress: number; status: "on-track" | "at-risk" | "behind" }[];
}

const getBUProjects = (bu: string) => pmoProjects.filter(p => p.bu === bu);
const getBUPrograms = (bu: string) => vroPrograms.filter(p => p.bu === bu);

export const buPortfolios: BUPortfolio[] = [
  {
    id: "portfolio-ir",
    name: "Florida Power & Light",
    description: "Rate-regulated electric utility serving 5.9M customer accounts in Florida - 35,052 MW capacity",
    projectCount: getBUProjects("Florida Power & Light").length,
    programCount: getBUPrograms("Florida Power & Light").length,
    totalBudget: getBUProjects("Florida Power & Light").reduce((s, p) => s + p.budget.total, 0),
    budgetSpent: getBUProjects("Florida Power & Light").reduce((s, p) => s + p.budget.spent, 0),
    valueRealized: getBUPrograms("Florida Power & Light").reduce((s, p) => s + p.valueRealized, 0),
    expectedValue: getBUPrograms("Florida Power & Light").reduce((s, p) => s + p.roiValue, 0),
    healthScore: 78,
    strategicAlignment: 92,
    activeEpics: 8,
    completedEpics: 14,
    currentPI: "PI 25.1",
    velocity: 52,
    predictability: 87,
    flowEfficiency: 72,
    topAISignal: { type: "opportunity", message: "Grid modernization could accelerate value realization by 35%", confidence: 88, dataSource: "System analysis" },
    topAction: { id: "port-ir-001", action: "Fast-track AMI deployment to improve reliability", impact: "+$2.5m value", urgency: "immediate", type: "accelerate" },
    okrs: [
      { objective: "Achieve 99.99% system reliability", progress: 72, status: "on-track" },
      { objective: "Reduce processing time by 40%", progress: 55, status: "at-risk" }
    ]
  },
  {
    id: "portfolio-am",
    name: "NextEra Energy Resources",
    description: "Clean energy generation, renewable power solutions, and grid modernization - $68B in assets",
    projectCount: getBUProjects("NextEra Energy Resources").length,
    programCount: getBUPrograms("NextEra Energy Resources").length,
    totalBudget: getBUProjects("NextEra Energy Resources").reduce((s, p) => s + p.budget.total, 0),
    budgetSpent: getBUProjects("NextEra Energy Resources").reduce((s, p) => s + p.budget.spent, 0),
    valueRealized: getBUPrograms("NextEra Energy Resources").reduce((s, p) => s + p.valueRealized, 0),
    expectedValue: getBUPrograms("NextEra Energy Resources").reduce((s, p) => s + p.roiValue, 0),
    healthScore: 65,
    strategicAlignment: 88,
    activeEpics: 12,
    completedEpics: 9,
    currentPI: "PI 24.3",
    velocity: 48,
    predictability: 75,
    flowEfficiency: 68,
    topAISignal: { type: "warning", message: "Private Markets platform budget overrun requires steering committee decision", confidence: 91, dataSource: "Financial tracking" },
    topAction: { id: "port-am-001", action: "Convene steering committee on Private Markets scope", impact: "Prevent $800k overrun", urgency: "immediate", type: "escalate" },
    okrs: [
      { objective: "Launch 5 new ESG fund products", progress: 60, status: "on-track" },
      { objective: "Grow private markets AUM by 20%", progress: 35, status: "behind" }
    ]
  },
  {
    id: "portfolio-retail",
    name: "Florida Power & Light",
    description: "Customer operations, digital services, and direct-to-customer energy solutions",
    projectCount: getBUProjects("Florida Power & Light").length,
    programCount: getBUPrograms("Florida Power & Light").length,
    totalBudget: getBUProjects("Florida Power & Light").reduce((s, p) => s + p.budget.total, 0),
    budgetSpent: getBUProjects("Florida Power & Light").reduce((s, p) => s + p.budget.spent, 0),
    valueRealized: getBUPrograms("Florida Power & Light").reduce((s, p) => s + p.valueRealized, 0),
    expectedValue: getBUPrograms("Florida Power & Light").reduce((s, p) => s + p.roiValue, 0),
    healthScore: 82,
    strategicAlignment: 85,
    activeEpics: 6,
    completedEpics: 11,
    currentPI: "PI 25.2",
    velocity: 58,
    predictability: 91,
    flowEfficiency: 78,
    topAISignal: { type: "insight", message: "Digital adoption rate exceeding projections - scale opportunity identified", confidence: 85, dataSource: "Customer analytics" },
    topAction: { id: "port-retail-001", action: "Accelerate mobile app feature rollout", impact: "+15% customer satisfaction", urgency: "this-week", type: "accelerate" },
    okrs: [
      { objective: "Achieve 50% digital policy adoption", progress: 68, status: "on-track" },
      { objective: "Reduce customer service calls by 30%", progress: 42, status: "at-risk" }
    ]
  },
  {
    id: "portfolio-ci",
    name: "Corporate & Other",
    description: "Alternative investments, real estate, infrastructure, and clean energy projects - Millfield Green",
    projectCount: getBUProjects("Corporate & Other").length,
    programCount: getBUPrograms("Corporate & Other").length,
    totalBudget: getBUProjects("Corporate & Other").reduce((s, p) => s + p.budget.total, 0),
    budgetSpent: getBUProjects("Corporate & Other").reduce((s, p) => s + p.budget.spent, 0),
    valueRealized: getBUPrograms("Corporate & Other").reduce((s, p) => s + p.valueRealized, 0),
    expectedValue: getBUPrograms("Corporate & Other").reduce((s, p) => s + p.roiValue, 0),
    healthScore: 88,
    strategicAlignment: 95,
    activeEpics: 5,
    completedEpics: 8,
    currentPI: "PI 24.4",
    velocity: 45,
    predictability: 89,
    flowEfficiency: 75,
    topAISignal: { type: "prediction", message: "Net Zero Housing scheme on track for early completion - case study value high", confidence: 92, dataSource: "Project analytics" },
    topAction: { id: "port-ci-001", action: "Prepare Millfield Green case study for COP presentation", impact: "Brand value +$5m", urgency: "this-month", type: "accelerate" },
    okrs: [
      { objective: "Deploy $500m in clean energy infrastructure", progress: 78, status: "on-track" },
      { objective: "Achieve carbon neutral portfolio by 2030", progress: 45, status: "on-track" }
    ]
  },
  {
    id: "portfolio-rc",
    name: "Corporate & Other",
    description: "Enterprise risk management, regulatory compliance, and operational resilience",
    projectCount: getBUProjects("Corporate & Other").length,
    programCount: getBUPrograms("Corporate & Other").length,
    totalBudget: getBUProjects("Corporate & Other").reduce((s, p) => s + p.budget.total, 0),
    budgetSpent: getBUProjects("Corporate & Other").reduce((s, p) => s + p.budget.spent, 0),
    valueRealized: getBUPrograms("Corporate & Other").reduce((s, p) => s + p.valueRealized, 0),
    expectedValue: getBUPrograms("Corporate & Other").reduce((s, p) => s + p.roiValue, 0),
    healthScore: 75,
    strategicAlignment: 90,
    activeEpics: 7,
    completedEpics: 5,
    currentPI: "PI 25.1",
    velocity: 42,
    predictability: 83,
    flowEfficiency: 65,
    topAISignal: { type: "warning", message: "Regulatory change pipeline accelerating - resource planning needed", confidence: 86, dataSource: "Regulatory monitoring" },
    topAction: { id: "port-rc-001", action: "Request additional compliance analyst resources", impact: "Maintain regulatory readiness", urgency: "this-week", type: "escalate" },
    okrs: [
      { objective: "Zero regulatory breaches", progress: 100, status: "on-track" },
      { objective: "Complete operational resilience framework", progress: 62, status: "at-risk" }
    ]
  }
];

export const vroSummary = {
  totalPrograms: vroPrograms.length,
  accelerating: vroPrograms.filter(p => p.valueStatus === "accelerating").length,
  onTrack: vroPrograms.filter(p => p.valueStatus === "on-track").length,
  atRisk: vroPrograms.filter(p => p.valueStatus === "at-risk").length,
  totalExpectedROI: vroPrograms.reduce((sum, p) => sum + p.roiValue, 0),
  totalRealized: vroPrograms.reduce((sum, p) => sum + p.valueRealized, 0),
  avgStrategicAlignment: Math.round(vroPrograms.reduce((sum, p) => sum + p.strategicAlignment, 0) / vroPrograms.length)
};

export const riskSummary = {
  total: riskIssues.length,
  critical: riskIssues.filter(r => r.severity === "critical").length,
  high: riskIssues.filter(r => r.severity === "high").length,
  medium: riskIssues.filter(r => r.severity === "medium").length,
  worsening: riskIssues.filter(r => r.trend === "worsening").length,
  withAIAlerts: riskIssues.filter(r => r.aiAlert).length
};
