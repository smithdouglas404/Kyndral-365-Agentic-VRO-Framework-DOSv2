// ============================================================================
// Agent UI Packet — the universal contract between agents and the liquid dashboard
//
// An agent produces an AgentUIPacket containing one or more UIBlocks.
// Each UIBlock describes WHAT to show and HOW to show it.
// The dashboard is a dumb surface — it just renders whatever the agent pushes.
// ============================================================================

// ---------------------------------------------------------------------------
// Visualization types the agent can choose from
// ---------------------------------------------------------------------------

export type UIBlockType =
  | 'kpi'           // Single metric with delta/trend
  | 'kpi-row'       // Row of multiple KPIs
  | 'bar-chart'     // Category comparison
  | 'area-chart'    // Time series
  | 'donut-chart'   // Proportional breakdown
  | 'table'         // Tabular data with columns
  | 'insight'       // Text insight with severity
  | 'recommendation'// Actionable recommendation
  | 'progress'      // Progress tracker / status bar
  | 'markdown'      // Free-form markdown content
  | 'status-list'   // List of items with status indicators
  | 'a2a-trace'     // Agent-to-agent conversation trace
  | 'alert'         // Agent alert/notification/alarm
  | 'handoff'       // Agent handoff to another agent
  | 'memory-core'   // Agent's Letta core memory (persona, policies, learned facts)
  | 'memory-facts'  // Recent Mem0 facts this agent has broadcast or received
  | 'memory-timeline' // Temporal view of memory changes
  | 'memory-stats'  // Agent memory usage statistics
  | 'gantt-chart'   // Timeline/Gantt from OP schedule data
  | 'resource-heatmap' // Resource capacity vs demand heatmap
  | 'budget-waterfall' // Budget line items waterfall chart
  | 'dependency-graph'; // Work package dependency network

export type Severity = 'info' | 'warning' | 'critical' | 'success';
export type TrendDirection = 'up' | 'down' | 'flat';

// ---------------------------------------------------------------------------
// UIBlock variants — each type has its own data shape
// ---------------------------------------------------------------------------

export interface KPIBlock {
  type: 'kpi';
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;          // percentage change
  deltaLabel?: string;     // e.g. "vs last quarter"
  trend?: TrendDirection;
  severity?: Severity;
}

export interface KPIRowBlock {
  type: 'kpi-row';
  kpis: KPIBlock[];
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface BarChartBlock {
  type: 'bar-chart';
  title?: string;
  data: ChartDataPoint[];
  categories: string[];    // which keys to chart
  index: string;           // x-axis key
  colors?: string[];
  stacked?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export interface AreaChartBlock {
  type: 'area-chart';
  title?: string;
  data: ChartDataPoint[];
  categories: string[];
  index: string;
  colors?: string[];
  stacked?: boolean;
  curveType?: 'linear' | 'monotone' | 'step';
}

export interface DonutChartBlock {
  type: 'donut-chart';
  title?: string;
  data: { name: string; value: number }[];
  category?: string;
  index?: string;
  colors?: string[];
  variant?: 'donut' | 'pie';
  label?: string;          // center label
}

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'badge';
  badgeColorMap?: Record<string, string>;
}

export interface TableBlock {
  type: 'table';
  title?: string;
  columns: TableColumn[];
  rows: Record<string, any>[];
  sortable?: boolean;
  maxRows?: number;
}

export interface InsightBlock {
  type: 'insight';
  title: string;
  body: string;
  severity: Severity;
  source?: string;         // which analysis produced this
  confidence?: number;     // 0-1
}

export interface RecommendationBlock {
  type: 'recommendation';
  title: string;
  body: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  actionLabel?: string;    // e.g. "Descope Phase 3"
  actionId?: string;       // for triggering downstream actions
}

export interface ProgressBlock {
  type: 'progress';
  title?: string;
  items: {
    label: string;
    value: number;          // 0-100
    target?: number;
    color?: string;
    status?: string;
  }[];
}

export interface MarkdownBlock {
  type: 'markdown';
  content: string;
}

export interface StatusListBlock {
  type: 'status-list';
  title?: string;
  items: {
    label: string;
    status: 'ok' | 'warning' | 'critical' | 'pending' | 'blocked';
    detail?: string;
    timestamp?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Agent-to-Agent communication blocks
// ---------------------------------------------------------------------------

export interface A2ATraceBlock {
  type: 'a2a-trace';
  title?: string;
  /** The conversation between agents */
  messages: {
    fromAgentId: string;
    fromAgentName: string;
    toAgentId: string;
    toAgentName: string;
    content: string;
    timestamp: string;
    /** What type of exchange: question, response, delegation, escalation */
    messageType: 'question' | 'response' | 'delegation' | 'escalation' | 'fact-share';
  }[];
  /** What was the outcome of this conversation */
  outcome?: string;
  /** Is this conversation still active? */
  isLive?: boolean;
}

export interface AlertBlock {
  type: 'alert';
  title: string;
  body: string;
  alertLevel: 'notification' | 'warning' | 'alarm' | 'critical';
  /** What triggered this alert */
  trigger?: string;
  /** Is this acknowledged */
  acknowledged?: boolean;
  /** Who should see this */
  audience?: ('executive' | 'agent' | 'stakeholder')[];
}

export interface HandoffBlock {
  type: 'handoff';
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  /** What is being handed off */
  subject: string;
  /** Why the handoff is happening */
  reason: string;
  /** Context being transferred */
  context?: string;
  /** Status of the handoff */
  status: 'initiated' | 'accepted' | 'in-progress' | 'completed' | 'rejected';
}

// ---------------------------------------------------------------------------
// Memory visualization blocks — show how agents think and remember
// ---------------------------------------------------------------------------

export interface MemoryCoreBlock {
  type: 'memory-core';
  agentId: string;
  agentName: string;
  /** Agent's self-description / persona */
  persona: string;
  /** Active policies the agent enforces */
  policies: string[];
  /** Facts the agent has learned and retained */
  learnedFacts: { key: string; value: any; learnedAt?: string }[];
  /** What the agent is currently focused on */
  currentContext?: string;
  /** Pending actions the agent plans to take */
  pendingActions?: string[];
}

export interface MemoryFactsBlock {
  type: 'memory-facts';
  /** Direction: facts this agent broadcast vs received */
  direction: 'broadcast' | 'received' | 'all';
  facts: {
    id: string;
    entity: string;
    attribute: string;
    value: any;
    sourceAgent: string;
    sourceAgentName: string;
    confidence: number;
    timestamp: string;
    /** Was this fact superseded by a newer one? */
    superseded?: boolean;
  }[];
  /** Active subscriptions (what patterns this agent listens to) */
  subscriptions?: {
    pattern: string;
    matchCount: number;
    lastMatch?: string;
  }[];
}

export interface MemoryTimelineBlock {
  type: 'memory-timeline';
  title?: string;
  events: {
    timestamp: string;
    eventType: 'fact-broadcast' | 'fact-received' | 'learned' | 'archived' | 'policy-added' | 'policy-removed' | 'context-changed' | 'a2a-message';
    description: string;
    source: 'mem0' | 'letta' | 'conversation';
    agentId?: string;
    agentName?: string;
    /** Optional data associated with this event */
    data?: any;
  }[];
}

export interface MemoryStatsBlock {
  type: 'memory-stats';
  agentId: string;
  agentName: string;
  stats: {
    /** Mem0 shared facts */
    totalFactsBroadcast: number;
    totalFactsReceived: number;
    activeSubscriptions: number;
    /** Letta core memory */
    learnedFactsCount: number;
    policiesCount: number;
    /** Letta archival */
    archivalEntries: number;
    /** Conversation memory */
    conversationMessages: number;
    semanticFacts: number;
    /** Activity */
    lastActivityAt: string;
    memoryUtilization: number; // 0-100
  };
}

// ---------------------------------------------------------------------------
// OpenProject PPM visualization blocks
// ---------------------------------------------------------------------------

export interface GanttChartBlock {
  type: 'gantt-chart';
  title?: string;
  items: {
    id: number | string;
    label: string;
    startDate: string;   // YYYY-MM-DD
    endDate: string;     // YYYY-MM-DD
    progress: number;    // 0-100
    type?: string;       // Epic, Feature, Story, Task, Milestone
    status?: string;
    color?: string;
    parentId?: number | string;
  }[];
  relations?: {
    fromId: number | string;
    toId: number | string;
    type: string;        // follows, precedes, blocks
    delay?: number;
  }[];
  /** Highlight the critical path */
  showCriticalPath?: boolean;
  /** Date range to display */
  startDate?: string;
  endDate?: string;
}

export interface ResourceHeatmapBlock {
  type: 'resource-heatmap';
  title?: string;
  /** Rows = team members or roles, columns = time periods */
  resources: {
    name: string;
    role?: string;
    /** Utilization per period (0-100+, >100 = overallocated) */
    periods: {
      label: string;     // "Week 1", "Apr", etc.
      utilization: number;
      hoursPlanned?: number;
      hoursAvailable?: number;
    }[];
  }[];
}

export interface BudgetWaterfallBlock {
  type: 'budget-waterfall';
  title?: string;
  categories: {
    name: string;         // "Labor", "Infrastructure", "Licensing", etc.
    planned: number;
    actual: number;
    variance?: number;
    subCategories?: {
      name: string;
      planned: number;
      actual: number;
    }[];
  }[];
  totalPlanned: number;
  totalActual: number;
  currency?: string;
}

export interface DependencyGraphBlock {
  type: 'dependency-graph';
  title?: string;
  nodes: {
    id: number | string;
    label: string;
    type?: string;        // Epic, Feature, Story, Task
    status?: string;
    color?: string;
    /** Is this on the critical path? */
    critical?: boolean;
  }[];
  edges: {
    from: number | string;
    to: number | string;
    type: string;         // follows, blocks, relates
    label?: string;
    delay?: number;
  }[];
}

// Union type of all blocks
export type UIBlock =
  | KPIBlock
  | KPIRowBlock
  | BarChartBlock
  | AreaChartBlock
  | DonutChartBlock
  | TableBlock
  | InsightBlock
  | RecommendationBlock
  | ProgressBlock
  | MarkdownBlock
  | StatusListBlock
  | A2ATraceBlock
  | AlertBlock
  | HandoffBlock
  | MemoryCoreBlock
  | MemoryFactsBlock
  | MemoryTimelineBlock
  | MemoryStatsBlock
  | GanttChartBlock
  | ResourceHeatmapBlock
  | BudgetWaterfallBlock
  | DependencyGraphBlock;

// ---------------------------------------------------------------------------
// AgentUIPacket — the full payload an agent pushes to the dashboard
// ---------------------------------------------------------------------------

export interface AgentUIPacket {
  /** Unique packet ID */
  id: string;

  /** Which agent produced this */
  agentId: string;
  agentName: string;
  agentColor?: string;
  agentIcon?: string;

  /** What entity this is about (project, initiative, etc.) */
  entityType?: string;
  entityId?: string;
  entityName?: string;

  /** Agent-chosen title for this packet */
  title: string;

  /** The UI blocks — ordered, agent decides the sequence */
  blocks: UIBlock[];

  /** Agent's reasoning (collapsible) */
  reasoning?: string;

  /** Suggested layout hint */
  layout?: {
    size: 'small' | 'medium' | 'large' | 'full';
    priority?: number;      // higher = more prominent placement
    section?: string;       // logical grouping (e.g. "financial", "risk")
  };

  /** Timestamps */
  timestamp: string;
  expiresAt?: string;       // optional TTL for transient insights

  /** Interaction — packets are conversable, not final */
  refreshable?: boolean;    // can the user ask the agent to regenerate
  drilldownEntityType?: string;
  drilldownEntityId?: string;

  /** Collaborative conversation tracking */
  conversationId?: string;  // groups related packets from the same dialogue
  parentPacketId?: string;  // if this is a revision, which packet it refines
  revision?: number;        // 0 = original, 1+ = user-requested refinements
  userPrompt?: string;      // the user request that produced this revision

  /** The underlying data the agent used (preserved for re-visualization) */
  sourceData?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// WebSocket message type for pushing packets
// ---------------------------------------------------------------------------

export interface AgentUIPacketMessage {
  type: 'agent:ui_packet';
  data: AgentUIPacket;
}

// ---------------------------------------------------------------------------
// Helper to create a packet (used server-side by agents)
// ---------------------------------------------------------------------------

let packetCounter = 0;

export function createAgentUIPacket(
  agent: { id: string; name: string; color?: string; icon?: string },
  title: string,
  blocks: UIBlock[],
  options?: Partial<Pick<AgentUIPacket, 'entityType' | 'entityId' | 'entityName' | 'reasoning' | 'layout' | 'expiresAt' | 'refreshable' | 'drilldownEntityType' | 'drilldownEntityId'>>
): AgentUIPacket {
  packetCounter += 1;
  return {
    id: `${agent.id}-${Date.now()}-${packetCounter}`,
    agentId: agent.id,
    agentName: agent.name,
    agentColor: agent.color,
    agentIcon: agent.icon,
    title,
    blocks,
    timestamp: new Date().toISOString(),
    ...options,
  };
}
