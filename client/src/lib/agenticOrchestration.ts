// Agentic Orchestration Layer
// AI-driven prediction, alerting, collaboration, and governance

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  responsibilities: string[];
  alertTypes: AlertType[];
}

export type AlertType = "risk" | "opportunity" | "governance" | "performance" | "climate" | "compliance";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "pending" | "acknowledged" | "actioned" | "escalated";

export interface AIAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  insight: string;
  prediction?: string;
  confidence: number;
  targetPersona: string;
  timestamp: Date;
  source: string;
  dataPoints: { label: string; value: string; trend: "up" | "down" | "flat" }[];
  suggestedActions: string[];
  relatedMetrics: string[];
}

export interface CollaborationThread {
  id: string;
  alertId: string;
  participants: string[];
  messages: ThreadMessage[];
  status: "open" | "resolved";
  createdAt: Date;
}

export interface ThreadMessage {
  id: string;
  personaId: string;
  content: string;
  timestamp: Date;
  isAI: boolean;
}

export interface GovernanceTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  dueDate: Date;
  priority: "low" | "medium" | "high" | "critical";
  linkedAlert?: string;
  approvals: { personaId: string; status: "pending" | "approved" | "rejected"; timestamp?: Date }[];
}

// Executive Personas
export const executivePersonas: Persona[] = [
  {
    id: "ceo",
    name: "António Simões",
    role: "Group CEO",
    avatar: "👤",
    responsibilities: ["Strategic direction", "Board relations", "Major transactions", "Public communications"],
    alertTypes: ["opportunity", "governance", "performance"],
  },
  {
    id: "cfo",
    name: "Jeff Davies",
    role: "Group CFO",
    avatar: "💼",
    responsibilities: ["Financial performance", "Capital allocation", "Investor relations", "Cost management"],
    alertTypes: ["performance", "risk", "governance"],
  },
  {
    id: "cro",
    name: "Chris Knight",
    role: "Group CRO",
    avatar: "🛡️",
    responsibilities: ["Risk framework", "3 Lines of Defence", "Regulatory compliance", "Emerging risks"],
    alertTypes: ["risk", "compliance", "climate"],
  },
  {
    id: "cio",
    name: "Investment Lead",
    role: "Chief Investment Officer",
    avatar: "📊",
    responsibilities: ["Asset allocation", "Investment performance", "ESG integration", "Market strategy"],
    alertTypes: ["performance", "climate", "opportunity"],
  },
];

// Real-time AI Alerts based on L&G data
export const liveAIAlerts: AIAlert[] = [
  {
    id: "alert-001",
    type: "opportunity",
    severity: "critical",
    status: "pending",
    title: "PRT Pipeline Acceleration Opportunity",
    message: "AI detected 3 FTSE 350 pension schemes showing stress signals consistent with buy-out readiness",
    insight: "Based on funding level analysis and sponsor covenant assessment, these schemes represent $2.1bn potential PRT volume",
    prediction: "78% probability of transaction within 6 months if engaged within 2 weeks",
    confidence: 0.85,
    targetPersona: "ceo",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    source: "Portfolio Analytics Engine",
    dataPoints: [
      { label: "Potential Volume", value: "$2.1bn", trend: "up" },
      { label: "Avg Funding Level", value: "98%", trend: "up" },
      { label: "Sponsor Risk Score", value: "Low", trend: "flat" },
    ],
    suggestedActions: [
      "Schedule CEO briefing on target schemes",
      "Prepare preliminary pricing models",
      "Engage relationship managers",
    ],
    relatedMetrics: ["PRT Volume (UK)", "New Business Margin", "Pipeline Velocity"],
  },
  {
    id: "alert-002",
    type: "risk",
    severity: "warning",
    status: "acknowledged",
    title: "Longevity Assumption Deviation Detected",
    message: "CMI_2023 mortality projections indicate 2.3% lighter trend vs current reserving basis",
    insight: "If sustained, this represents $340m additional reserve requirement across annuity book",
    prediction: "65% probability trend continues based on medical advancement trajectory",
    confidence: 0.72,
    targetPersona: "cro",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    source: "Actuarial Monitoring System",
    dataPoints: [
      { label: "Reserve Impact", value: "$340m", trend: "up" },
      { label: "Trend Deviation", value: "2.3%", trend: "up" },
      { label: "Confidence Band", value: "±0.8%", trend: "flat" },
    ],
    suggestedActions: [
      "Convene longevity working group",
      "Run sensitivity analysis on reserve adequacy",
      "Prepare Board Risk Committee briefing",
    ],
    relatedMetrics: ["Solvency II Coverage", "Insurance Risk Capital", "Life Expectancy Assumptions"],
  },
  {
    id: "alert-003",
    type: "performance",
    severity: "info",
    status: "pending",
    title: "Asset Management Fee Pressure Alert",
    message: "DC platform fee compression accelerating: average fee down 8bps YTD vs 5bps forecast",
    insight: "Revenue impact of $12m if trend continues. Offset partially by $183bn DC AUM growth (+12%)",
    prediction: "Fee pressure likely to stabilize Q3 as market consolidation completes",
    confidence: 0.68,
    targetPersona: "cfo",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    source: "Revenue Analytics Platform",
    dataPoints: [
      { label: "Fee Compression", value: "-8bps", trend: "down" },
      { label: "Revenue Impact", value: "$12m", trend: "down" },
      { label: "AUM Growth", value: "+12%", trend: "up" },
    ],
    suggestedActions: [
      "Review pricing strategy with AM leadership",
      "Accelerate value-add service rollout",
      "Update investor guidance if material",
    ],
    relatedMetrics: ["Operating Profit (AM)", "DC AUM", "Cost-Income Ratio"],
  },
  {
    id: "alert-004",
    type: "climate",
    severity: "warning",
    status: "pending",
    title: "Portfolio Temperature Alignment Drift",
    message: "Q4 analysis shows portfolio temperature at 2.4°C vs 2.2°C target pathway",
    insight: "Driven by increased high-carbon asset valuations. 37% financed emissions reduction still on track",
    prediction: "Without intervention, 2030 target pathway breach probability increases to 35%",
    confidence: 0.78,
    targetPersona: "cio",
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    source: "Climate Analytics Engine",
    dataPoints: [
      { label: "Portfolio Temp", value: "2.4°C", trend: "up" },
      { label: "Target", value: "2.2°C", trend: "flat" },
      { label: "Emissions Reduction", value: "-37%", trend: "up" },
    ],
    suggestedActions: [
      "Review high-carbon overweight positions",
      "Accelerate transition finance deployment",
      "Update Climate Committee on pathway deviation",
    ],
    relatedMetrics: ["Temperature Alignment", "Financed Emissions", "Transition Finance"],
  },
  {
    id: "alert-005",
    type: "compliance",
    severity: "info",
    status: "actioned",
    title: "Consumer Duty Attestation Due",
    message: "Annual Consumer Duty board attestation required within 21 days",
    insight: "All division attestations received. Retail flagged 2 minor gaps in vulnerable customer journey",
    confidence: 0.95,
    targetPersona: "cro",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    source: "Regulatory Calendar System",
    dataPoints: [
      { label: "Days Remaining", value: "21", trend: "down" },
      { label: "Divisions Complete", value: "4/4", trend: "up" },
      { label: "Gaps Identified", value: "2", trend: "flat" },
    ],
    suggestedActions: [
      "Schedule Board sign-off meeting",
      "Review Retail remediation plan",
      "Prepare FCA submission package",
    ],
    relatedMetrics: ["Regulatory Compliance Score", "Customer Outcomes", "Complaints Ratio"],
  },
  {
    id: "alert-006",
    type: "governance",
    severity: "critical",
    status: "pending",
    title: "US Business Sale - Governance Checkpoint",
    message: "Major transaction governance checkpoint: US protection sale completion approaching",
    insight: "$1.9bn post-tax proceeds expected. Capital allocation decision required for buyback execution",
    prediction: "Market conditions optimal for buyback announcement within 48 hours of completion",
    confidence: 0.88,
    targetPersona: "ceo",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    source: "Transaction Management Office",
    dataPoints: [
      { label: "Proceeds", value: "$1.9bn", trend: "up" },
      { label: "Buyback Allocation", value: "$1.0bn", trend: "flat" },
      { label: "Completion Status", value: "95%", trend: "up" },
    ],
    suggestedActions: [
      "Convene Capital Allocation Committee",
      "Finalize investor communication",
      "Approve buyback execution mandate",
    ],
    relatedMetrics: ["Shareholder Returns", "Capital Position", "Strategic Flexibility"],
  },
];

// Collaboration threads
export const collaborationThreads: CollaborationThread[] = [
  {
    id: "thread-001",
    alertId: "alert-001",
    participants: ["ceo", "cfo", "cio"],
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
    messages: [
      {
        id: "msg-001",
        personaId: "ai",
        content: "I've identified 3 pension schemes with high buy-out readiness. Preliminary analysis attached.",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        isAI: true,
      },
      {
        id: "msg-002",
        personaId: "ceo",
        content: "Good catch. @CFO can we get pricing capacity confirmed for Q1?",
        timestamp: new Date(Date.now() - 1000 * 60 * 3),
        isAI: false,
      },
      {
        id: "msg-003",
        personaId: "cfo",
        content: "Confirmed. We have $3bn capacity with current capital position.",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        isAI: false,
      },
    ],
  },
  {
    id: "thread-002",
    alertId: "alert-002",
    participants: ["cro", "cfo"],
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 40),
    messages: [
      {
        id: "msg-004",
        personaId: "ai",
        content: "Longevity trend deviation detected. Recommending actuarial review within 2 weeks.",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        isAI: true,
      },
      {
        id: "msg-005",
        personaId: "cro",
        content: "Agreed. Scheduling working group for next week.",
        timestamp: new Date(Date.now() - 1000 * 60 * 40),
        isAI: false,
      },
    ],
  },
];

// Governance tasks
export const governanceTasks: GovernanceTask[] = [
  {
    id: "task-001",
    title: "PRT Opportunity Review",
    description: "Review and approve engagement strategy for identified pension scheme targets",
    assignee: "ceo",
    status: "pending",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours
    priority: "high",
    linkedAlert: "alert-001",
    approvals: [
      { personaId: "ceo", status: "pending" },
      { personaId: "cfo", status: "approved", timestamp: new Date(Date.now() - 1000 * 60 * 60) },
    ],
  },
  {
    id: "task-002",
    title: "Longevity Reserve Assessment",
    description: "Complete sensitivity analysis and prepare Board Risk Committee paper",
    assignee: "cro",
    status: "in_progress",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    priority: "medium",
    linkedAlert: "alert-002",
    approvals: [
      { personaId: "cro", status: "approved", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    ],
  },
  {
    id: "task-003",
    title: "US Sale Capital Allocation",
    description: "Finalize buyback execution plan and investor communications",
    assignee: "cfo",
    status: "pending",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    priority: "critical",
    linkedAlert: "alert-006",
    approvals: [
      { personaId: "ceo", status: "pending" },
      { personaId: "cfo", status: "pending" },
    ],
  },
];

// Sentiment analysis for qualitative inputs
export interface SentimentScore {
  text: string;
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  keywords: string[];
  riskFlags: string[];
}

export function analyzeSentiment(text: string): SentimentScore {
  const positiveWords = ["growth", "opportunity", "strong", "exceeded", "positive", "confident", "accelerate", "on track"];
  const negativeWords = ["risk", "concern", "decline", "pressure", "challenge", "uncertain", "delay", "miss"];
  const riskWords = ["breach", "failure", "regulatory", "litigation", "exposure", "default", "loss"];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  const keywords: string[] = [];
  const riskFlags: string[] = [];
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) {
      positiveCount++;
      keywords.push(word);
    }
    if (negativeWords.some(nw => word.includes(nw))) {
      negativeCount++;
      keywords.push(word);
    }
    if (riskWords.some(rw => word.includes(rw))) {
      riskFlags.push(word);
    }
  });
  
  const total = positiveCount + negativeCount;
  const score = total === 0 ? 0 : (positiveCount - negativeCount) / total;
  const magnitude = Math.min(total / 10, 1);
  
  return { text, score, magnitude, keywords, riskFlags };
}

// Voice command parser
export interface VoiceCommand {
  intent: "query" | "action" | "navigate" | "alert";
  entity?: string;
  parameters?: Record<string, string>;
  confidence: number;
}

export function parseVoiceCommand(transcript: string): VoiceCommand {
  const lower = transcript.toLowerCase();
  
  if (lower.includes("show") || lower.includes("what is") || lower.includes("tell me")) {
    if (lower.includes("risk")) return { intent: "navigate", entity: "risk", confidence: 0.9 };
    if (lower.includes("climate")) return { intent: "navigate", entity: "climate", confidence: 0.9 };
    if (lower.includes("alert")) return { intent: "query", entity: "alerts", confidence: 0.85 };
    if (lower.includes("opportunity")) return { intent: "query", entity: "opportunities", confidence: 0.85 };
    if (lower.includes("performance")) return { intent: "navigate", entity: "performance", confidence: 0.9 };
  }
  
  if (lower.includes("approve") || lower.includes("sign off")) {
    return { intent: "action", entity: "approve", confidence: 0.8 };
  }
  
  if (lower.includes("schedule") || lower.includes("meeting")) {
    return { intent: "action", entity: "schedule", confidence: 0.75 };
  }
  
  if (lower.includes("brief") || lower.includes("summary")) {
    return { intent: "query", entity: "briefing", confidence: 0.85 };
  }
  
  return { intent: "query", entity: "general", confidence: 0.5 };
}

// Get alerts for a specific persona
export function getAlertsForPersona(personaId: string): AIAlert[] {
  return liveAIAlerts.filter(a => a.targetPersona === personaId);
}

// Get pending tasks for a persona
export function getTasksForPersona(personaId: string): GovernanceTask[] {
  return governanceTasks.filter(t => 
    t.assignee === personaId || 
    t.approvals.some(a => a.personaId === personaId && a.status === "pending")
  );
}

// Get collaboration threads for a persona
export function getThreadsForPersona(personaId: string): CollaborationThread[] {
  return collaborationThreads.filter(t => t.participants.includes(personaId));
}
