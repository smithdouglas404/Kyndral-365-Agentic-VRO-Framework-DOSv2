import { 
  Zap, 
  Target, 
  Scale, 
  ShieldCheck, 
  Eye, 
  Network, 
  TrendingDown, 
  ListFilter 
} from "lucide-react";

export type Theme = "Automation" | "Governance" | "Data & Insights" | "Value" | "Speed" | "Efficiency";

export interface VROMetric {
  name: string;
  cadence: "Weekly" | "Monthly" | "Bi-weekly" | "Quarterly" | "Real-time" | "On demand";
}

export interface Challenge {
  id: string;
  number: number;
  title: string;
  problem: string;
  solution: string;
  mechanism: string[];
  metrics: {
    label: string;
    before?: string;
    after?: string;
    value?: string;
  }[];
  vroMetrics: VROMetric[];
  coreTrackingFields: string[];
  icon: any;
  themes: Theme[];
  relatedIds: string[];
  strategicAlignment: string[];
}

export const challenges: Challenge[] = [
  {
    id: "speed",
    number: 1,
    title: "Speed Without Compromising Accuracy",
    problem: "Manual processes slow down decision-making; quality suffers when rushing.",
    solution: "Agentic automation removes manual bottlenecks while maintaining governance quality.",
    mechanism: ["Automated intake", "Smart classification", "Policy alignment", "Faster approvals"],
    metrics: [
      { label: "Time-to-Value (TTV)", before: "30 days", after: "5 days" }
    ],
    vroMetrics: [
      { name: "Time-to-Value (TTV)", cadence: "Weekly" },
      { name: "Rework Rate", cadence: "Weekly" },
      { name: "Quality Defect Escape", cadence: "Monthly" }
    ],
    coreTrackingFields: [
      "Planned vs actual TTV",
      "Rework % by phase",
      "Defect severity",
      "Regulatory impact"
    ],
    icon: Zap,
    themes: ["Speed", "Automation", "Governance"],
    relatedIds: ["agility", "efficiency"],
    strategicAlignment: ["Simplification", "International Growth"]
  },
  {
    id: "planning",
    number: 2,
    title: "Planning and Value Assurance",
    problem: "Estimates are optimistic; benefits are defined but not tracked; value leakage occurs silently.",
    solution: "Benchmark comparison + Benefit-milestone linking + Drift detection.",
    mechanism: ["Better estimates", "Linked benefits", "Continuous monitoring", "Predictive warnings"],
    metrics: [
      { label: "Forecast Accuracy", before: "60%", after: "85%" },
      { label: "Benefits Realization %", before: "40%", after: "75%" }
    ],
    vroMetrics: [
      { name: "Benefits Realization %", cadence: "Monthly" },
      { name: "Forecast Accuracy", cadence: "Monthly" },
      { name: "Value Leakage", cadence: "Monthly" }
    ],
    coreTrackingFields: [
      "Approved benefits baseline",
      "Realised benefits to date",
      "Forecast vs actual",
      "Value owner"
    ],
    icon: Target,
    themes: ["Value", "Data & Insights"],
    relatedIds: ["certainty", "prioritization"],
    strategicAlignment: ["Simplification", "Asset Management"]
  },
  {
    id: "agility",
    number: 3,
    title: "Agility vs Governance",
    problem: "Traditional governance is rigid and time-consuming; Agile approaches lack oversight.",
    solution: "Agentic automation reduces governance burden while maintaining decision authority.",
    mechanism: ["Automated data collection", "Automated compliance checks", "Streamlined reviews"],
    metrics: [
      { label: "Decision Cycle Time", before: "14 days", after: "3 days" }
    ],
    vroMetrics: [
      { name: "Decision Cycle Time", cadence: "Bi-weekly" },
      { name: "Exception-Based Escalations", cadence: "Bi-weekly" }
    ],
    coreTrackingFields: [
      "Decision request date",
      "Decision outcome",
      "Threshold breached",
      "Escalation reason"
    ],
    icon: Scale,
    themes: ["Governance", "Speed", "Automation"],
    relatedIds: ["speed", "consistency"],
    strategicAlignment: ["Simplification", "Governance"]
  },
  {
    id: "certainty",
    number: 4,
    title: "Certainty in Delivery",
    problem: "Estimates are unrealistic; Risks are identified late; Cost overruns are common.",
    solution: "Realistic estimates (benchmarking) + Early warnings + Continuous validation.",
    mechanism: ["Variance monitoring", "Early escalation", "Corrective action"],
    metrics: [
      { label: "Cost Variance", before: "±25%", after: "±10%" },
      { label: "Schedule Confidence", before: "60%", after: "85%" }
    ],
    vroMetrics: [
      { name: "Cost Variance", cadence: "Weekly" },
      { name: "Schedule Confidence Bands", cadence: "Weekly" }
    ],
    coreTrackingFields: [
      "Budget baseline",
      "Actuals to date",
      "Forecast at completion",
      "Confidence range"
    ],
    icon: ShieldCheck,
    themes: ["Value", "Data & Insights"],
    relatedIds: ["planning", "visibility"],
    strategicAlignment: ["PRT Pipeline", "Asset Management"]
  },
  {
    id: "visibility",
    number: 5,
    title: "Real-Time Visibility",
    problem: "Monthly reviews are too slow; Issues are discovered after they're critical.",
    solution: "Automated data ingestion + Real-time monitoring + Instant alerts.",
    mechanism: ["Continuous data collection", "Drift detection", "Automated escalation"],
    metrics: [
      { label: "Portfolio Health Index", before: "Manual", after: "Real-time" },
      { label: "Issue Discovery", before: "4 wks late", after: "1 wk early" }
    ],
    vroMetrics: [
      { name: "Portfolio Health Index (Value, Risk, Delivery)", cadence: "Real-time" }
    ],
    coreTrackingFields: [
      "Value score",
      "Risk score",
      "Delivery score",
      "Trend indicator"
    ],
    icon: Eye,
    themes: ["Data & Insights", "Speed"],
    relatedIds: ["certainty", "consistency"],
    strategicAlignment: ["Simplification", "Digitisation"]
  },
  {
    id: "consistency",
    number: 6,
    title: "Consistency Across Group",
    problem: "Each business unit has different processes; Data is incomparable.",
    solution: "Unified governance rules + Standardized classification + Normalized narratives.",
    mechanism: ["Clear definitions", "Automated classification", "Standardized data"],
    metrics: [
      { label: "Standard KPI Adoption %", before: "20%", after: "95%" },
      { label: "Value Stream Coverage", before: "30%", after: "100%" }
    ],
    vroMetrics: [
      { name: "Standard KPI Adoption %", cadence: "Monthly" },
      { name: "Value Stream Coverage", cadence: "Quarterly" }
    ],
    coreTrackingFields: [
      "KPI compliance %",
      "Initiatives mapped to value streams",
      "Data quality score"
    ],
    icon: Network,
    themes: ["Governance", "Data & Insights"],
    relatedIds: ["efficiency", "visibility"],
    strategicAlignment: ["Simplification", "Governance"]
  },
  {
    id: "efficiency",
    number: 7,
    title: "Portfolio Efficiency",
    problem: "Manual portfolio management is labor-intensive; Data collation takes weeks.",
    solution: "Automated data collection + Automated classification + Automated reporting.",
    mechanism: ["Automation of routine tasks", "Reallocation of effort"],
    metrics: [
      { label: "Cost of Portfolio Management", before: "£2.4M", after: "£0.8M" },
      { label: "Automation Rate", before: "15%", after: "85%" }
    ],
    vroMetrics: [
      { name: "Cost of Portfolio Management", cadence: "Quarterly" },
      { name: "Automation Rate", cadence: "Quarterly" }
    ],
    coreTrackingFields: [
      "PMO/VRO run cost",
      "Reporting effort hours",
      "% automated reporting"
    ],
    icon: TrendingDown,
    themes: ["Efficiency", "Automation", "Value"],
    relatedIds: ["speed", "agility"],
    strategicAlignment: ["Simplification", "Cost Efficiency"]
  },
  {
    id: "prioritization",
    number: 8,
    title: "Clear Prioritisation",
    problem: "Major changes are not clearly defined; Scope creep is common; Ad-hoc prioritization.",
    solution: "Clear definitions + Automated detection + Capacity-aware prioritization.",
    mechanism: ["Define thresholds", "Detect major changes", "Assess capacity"],
    metrics: [
      { label: "Value-at-Risk", before: "Unknown", after: "Quantified" },
      { label: "ROI Velocity", before: "18 months", after: "6 months" }
    ],
    vroMetrics: [
      { name: "Value-at-Risk", cadence: "Monthly" },
      { name: "Dependency Impact Score", cadence: "Monthly" },
      { name: "ROI Velocity", cadence: "On demand" }
    ],
    coreTrackingFields: [
      "Value exposure",
      "Dependency count",
      "Critical path risk",
      "Time to breakeven"
    ],
    icon: ListFilter,
    themes: ["Value", "Governance"],
    relatedIds: ["planning", "efficiency"],
    strategicAlignment: ["Capital Allocation", "Simplification"]
  }
];

// PMO Challenges - Traditional approach with worse metrics (no VRO metrics - that's the point)
export const pmoChallenges: Challenge[] = [
  {
    id: "pmo-speed",
    number: 1,
    title: "Speed vs Quality Trade-off",
    problem: "Manual processes create bottlenecks; rushing leads to quality issues and rework.",
    solution: "Incremental process improvements with additional review stages.",
    mechanism: ["Manual intake", "Escalation paths", "Quality gates", "Extended approvals"],
    metrics: [
      { label: "Cycle Time", before: "30 days", after: "25 days" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: Zap,
    themes: ["Speed", "Governance"],
    relatedIds: ["pmo-agility", "pmo-efficiency"],
    strategicAlignment: ["Process Improvement"]
  },
  {
    id: "pmo-planning",
    number: 2,
    title: "Planning and Estimation",
    problem: "Optimistic estimates persist; benefits tracking is manual and incomplete.",
    solution: "Enhanced templates and quarterly review cycles.",
    mechanism: ["Better templates", "Quarterly reviews", "Manual tracking"],
    metrics: [
      { label: "Forecast Accuracy", before: "55%", after: "62%" },
      { label: "Benefits Realization", before: "35%", after: "45%" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: Target,
    themes: ["Value", "Data & Insights"],
    relatedIds: ["pmo-certainty", "pmo-prioritization"],
    strategicAlignment: ["Planning Improvement"]
  },
  {
    id: "pmo-agility",
    number: 3,
    title: "Governance Burden",
    problem: "Heavy governance requirements slow delivery without clear value-add.",
    solution: "Streamlined templates and reduced mandatory checkpoints.",
    mechanism: ["Fewer templates", "Reduced meetings", "Exception-based reviews"],
    metrics: [
      { label: "Governance Overhead", before: "45 hrs/mo", after: "35 hrs/mo" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: Scale,
    themes: ["Governance", "Speed"],
    relatedIds: ["pmo-speed", "pmo-consistency"],
    strategicAlignment: ["Process Simplification"]
  },
  {
    id: "pmo-certainty",
    number: 4,
    title: "Delivery Predictability",
    problem: "Projects frequently miss deadlines and budgets; surprises are common.",
    solution: "More frequent status reporting and earlier escalation.",
    mechanism: ["Weekly status reports", "RAG dashboards", "Management escalation"],
    metrics: [
      { label: "On-time Delivery", before: "55%", after: "62%" },
      { label: "Cost Variance", before: "±30%", after: "±22%" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: ShieldCheck,
    themes: ["Value", "Data & Insights"],
    relatedIds: ["pmo-planning", "pmo-visibility"],
    strategicAlignment: ["Delivery Improvement"]
  },
  {
    id: "pmo-visibility",
    number: 5,
    title: "Reporting Delays",
    problem: "Monthly reports are stale; issues discovered weeks after they occur.",
    solution: "More frequent reporting cycles and dashboards.",
    mechanism: ["Weekly reports", "Excel dashboards", "Email alerts"],
    metrics: [
      { label: "Decision Cycle", before: "30 days", after: "21 days" },
      { label: "Issue Discovery", before: "4 wks late", after: "3 wks late" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: Eye,
    themes: ["Data & Insights", "Speed"],
    relatedIds: ["pmo-certainty", "pmo-consistency"],
    strategicAlignment: ["Reporting Enhancement"]
  },
  {
    id: "pmo-consistency",
    number: 6,
    title: "Standardization Challenges",
    problem: "Each team uses different tools and templates; comparison is difficult.",
    solution: "Mandated templates and centralized tooling.",
    mechanism: ["Template library", "Tool standardization", "Training programs"],
    metrics: [
      { label: "Portfolio Comparability", before: "0%", after: "40%" },
      { label: "Ways of Working", before: "12", after: "6" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: Network,
    themes: ["Governance", "Data & Insights"],
    relatedIds: ["pmo-efficiency", "pmo-visibility"],
    strategicAlignment: ["Standardization"]
  },
  {
    id: "pmo-efficiency",
    number: 7,
    title: "Resource Overhead",
    problem: "Manual data collation consumes significant PMO capacity.",
    solution: "Better templates and some spreadsheet automation.",
    mechanism: ["Excel macros", "Template consolidation"],
    metrics: [
      { label: "Overhead", before: "130 hrs", after: "100 hrs" },
      { label: "FTE Requirements", before: "3.5", after: "2.5" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: TrendingDown,
    themes: ["Efficiency", "Value"],
    relatedIds: ["pmo-speed", "pmo-agility"],
    strategicAlignment: ["Cost Reduction"]
  },
  {
    id: "pmo-prioritization",
    number: 8,
    title: "Priority Management",
    problem: "Ad-hoc requests disrupt planned work; scope creep is endemic.",
    solution: "Change control boards and formal prioritization meetings.",
    mechanism: ["Change control", "Prioritization committees", "Impact assessments"],
    metrics: [
      { label: "Scope Creep Incidents", before: "65%", after: "45%" },
      { label: "Value per Project", value: "+8%" }
    ],
    vroMetrics: [],
    coreTrackingFields: [],
    icon: ListFilter,
    themes: ["Value", "Governance"],
    relatedIds: ["pmo-planning", "pmo-efficiency"],
    strategicAlignment: ["Priority Management"]
  }
];
