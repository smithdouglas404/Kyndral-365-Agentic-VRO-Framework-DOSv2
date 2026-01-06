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
  icon: any;
}

export const challenges: Challenge[] = [
  {
    id: "speed",
    number: 1,
    title: "Speed Without Compromise",
    problem: "Manual processes slow down decision-making; quality suffers when rushing.",
    solution: "Agentic automation removes manual bottlenecks while maintaining governance quality.",
    mechanism: ["Automated intake", "Smart classification", "Policy alignment", "Faster approvals"],
    metrics: [
      { label: "Cycle Time", before: "30 days", after: "5 days" }
    ],
    icon: Zap
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
      { label: "Benefits Realization", before: "40%", after: "75%" }
    ],
    icon: Target
  },
  {
    id: "agility",
    number: 3,
    title: "Agility with Governance Balance",
    problem: "Traditional governance is rigid and time-consuming; Agile approaches lack oversight.",
    solution: "Agentic automation reduces governance burden while maintaining decision authority.",
    mechanism: ["Automated data collection", "Automated compliance checks", "Streamlined reviews"],
    metrics: [
      { label: "Governance Overhead", before: "40 hrs/mo", after: "10 hrs/mo" }
    ],
    icon: Scale
  },
  {
    id: "certainty",
    number: 4,
    title: "Certainty in Delivery",
    problem: "Estimates are unrealistic; Risks are identified late; Cost overruns are common.",
    solution: "Realistic estimates (benchmarking) + Early warnings + Continuous validation.",
    mechanism: ["Variance monitoring", "Early escalation", "Corrective action"],
    metrics: [
      { label: "On-time Delivery", before: "60%", after: "85%" },
      { label: "Cost Variance", before: "±25%", after: "±10%" }
    ],
    icon: ShieldCheck
  },
  {
    id: "visibility",
    number: 5,
    title: "Real-Time Visibility",
    problem: "Monthly reviews are too slow; Issues are discovered after they're critical.",
    solution: "Automated data ingestion + Real-time monitoring + Instant alerts.",
    mechanism: ["Continuous data collection", "Drift detection", "Automated escalation"],
    metrics: [
      { label: "Decision Cycle", before: "30 days", after: "3 days" },
      { label: "Issue Discovery", before: "4 wks late", after: "1 wk early" }
    ],
    icon: Eye
  },
  {
    id: "consistency",
    number: 6,
    title: "Consistency Across the Group",
    problem: "Each business unit has different processes; Data is incomparable.",
    solution: "Unified governance rules + Standardized classification + Normalized narratives.",
    mechanism: ["Clear definitions", "Automated classification", "Standardized data"],
    metrics: [
      { label: "Portfolio Comparability", before: "0%", after: "100%" },
      { label: "Ways of Working", before: "12", after: "1" }
    ],
    icon: Network
  },
  {
    id: "efficiency",
    number: 7,
    title: "Efficiency and Cost Reduction",
    problem: "Manual portfolio management is labor-intensive; Data collation takes weeks.",
    solution: "Automated data collection + Automated classification + Automated reporting.",
    mechanism: ["Automation of routine tasks", "Reallocation of effort"],
    metrics: [
      { label: "Overhead", before: "120 hrs", after: "30 hrs" },
      { label: "FTE Requirements", before: "3", after: "1" }
    ],
    icon: TrendingDown
  },
  {
    id: "prioritization",
    number: 8,
    title: "Clear Prioritization",
    problem: "Major changes are not clearly defined; Scope creep is common; Ad-hoc prioritization.",
    solution: "Clear definitions + Automated detection + Capacity-aware prioritization.",
    mechanism: ["Define thresholds", "Detect major changes", "Assess capacity"],
    metrics: [
      { label: "Scope Creep Incidents", before: "60%", after: "10%" },
      { label: "Value per Project", value: "+35%" }
    ],
    icon: ListFilter
  }
];
