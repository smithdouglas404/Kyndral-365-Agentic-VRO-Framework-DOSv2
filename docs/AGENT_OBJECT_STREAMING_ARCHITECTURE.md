# Agent-as-Object Streaming Architecture 🚀

**Status**: Design Document - Ready for Implementation
**Innovation Level**: Revolutionary
**Created**: 2026-01-29

---

## The Revolutionary Concept

### Agents Are Objects with 315 Callable Attributes

**Traditional Agent Architecture** (What Others Do):
```typescript
// ❌ Agents as services that query databases
agent.analyze(project) → database.query() → return result
```

**Our Innovation** (Agents as Objects):
```typescript
// ✅ Agents as objects with callable attributes
const pmo = new PMOAgent(project_id);
const flowTime = pmo.flow_time_avg;  // Callable attribute
const wip = pmo.wip_count;           // Live property
const health = pmo.agent_health_status; // Real-time
```

### Why This Is Revolutionary

1. **Ontology-First Design**: Agents ARE objects in the SAFe 6.0 ontology
2. **Liquid Data Model**: Attributes are always live, never stale
3. **Stream-First Architecture**: Data flows MCP → Mem0 → DB
4. **Early Warning System**: Mem0 acts as signal layer BEFORE persistence
5. **Zero-Lag Dashboards**: Widgets query object attributes, not databases

---

## Architecture Layers

### Layer 1: MCP Adapters (The Wire)

Each agent has **specific MCP adapters** attached based on its domain:

```
PMO Agent Object
├─ Jira MCP Adapter          (PPM - Project Management)
├─ Azure DevOps MCP Adapter  (ALM - Application Lifecycle)
├─ Monday.com MCP Adapter    (PPM - Alternative)
└─ Smartsheet MCP Adapter    (PPM - Alternative)

FinOps Agent Object
├─ SAP MCP Adapter           (ERP - Financial Data)
├─ Coupa MCP Adapter         (Procurement)
├─ NetSuite MCP Adapter      (ERP - Alternative)
└─ Workday MCP Adapter       (HCM/Finance)

VRO Agent Object
├─ Salesforce MCP Adapter    (CRM - Customer Data)
├─ Gainsight MCP Adapter     (Customer Success)
├─ Mixpanel MCP Adapter      (Product Analytics)
└─ Amplitude MCP Adapter     (Analytics)

Planning Agent Object
├─ Jira MCP Adapter          (Dependency tracking)
├─ Planview MCP Adapter      (Portfolio planning)
├─ ServiceNow MCP Adapter    (Change management)
└─ Microsoft Project Adapter (Schedule management)

OCM Agent Object
├─ Slack MCP Adapter         (Team communication)
├─ Microsoft Teams Adapter   (Collaboration)
├─ SurveyMonkey Adapter      (Sentiment surveys)
└─ Culture Amp Adapter       (Employee feedback)

Risk Agent Object
├─ Palantir MCP Adapter      (Data correlation)
├─ Archer MCP Adapter        (GRC - Risk management)
├─ ServiceNow GRC Adapter    (Risk & compliance)
└─ LogicGate Adapter         (Risk quantification)

Governance Agent Object
├─ Archer MCP Adapter        (Compliance)
├─ ServiceNow GRC Adapter    (Audit trails)
├─ Responsible AI MCP        (AI validation)
└─ Policy MCP                (Rule enforcement)

TMO Agent Object
├─ Jira MCP Adapter          (Team metrics)
├─ GitHub MCP Adapter        (Code quality)
├─ GitLab MCP Adapter        (DevOps metrics)
└─ SonarQube Adapter         (Code health)
```

**Key Innovation**: MCPs **stream** data continuously, not just query on-demand.

---

### Layer 2: Streaming Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: MCP ADAPTERS LISTEN ON THE WIRE                    │
│                                                             │
│  Jira MCP ───> [WebSocket/Webhook] ───> New Issue Created  │
│  SAP MCP  ───> [Change Data Capture] ─> Budget Updated     │
│  Slack MCP ───> [Events API] ─────────> Sentiment Signal   │
│                                                             │
│  ✅ Real-time streaming (not polling)                       │
│  ✅ Sub-second latency                                      │
│  ✅ Event-driven architecture                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: WRITE TO MEM0 FIRST (EARLY WARNING LAYER)          │
│                                                             │
│  Mem0.write({                                               │
│    entity: "project_abc",                                   │
│    attribute: "budget_variance",                            │
│    value: -45000,                                           │
│    source_agent: "finops",                                  │
│    source_mcp: "sap-mcp",                                   │
│    confidence: 0.95,                                        │
│    timestamp: now(),                                        │
│    ttl: 300 // 5 minute cache                               │
│  })                                                         │
│                                                             │
│  ✅ Mem0 acts as shared fact ledger                         │
│  ✅ 175K facts/day signal stream                            │
│  ✅ All agents can observe                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: AGENTS WATCH MEM0 FOR SIGNALS (EARLY WARNING)      │
│                                                             │
│  FinOps Agent observes:                                     │
│    IF budget_variance < -$50K:                              │
│      → Fire signal: "BUDGET_OVERRUN_WARNING"               │
│      → Notify PMO agent via A2A                             │
│      → Invalidate dashboard queries via WebSocket           │
│      → Create intervention (if threshold critical)          │
│                                                             │
│  PMO Agent observes:                                        │
│    IF wip_age > 30 days:                                    │
│      → Fire signal: "STALE_WORK_DETECTED"                   │
│      → Request capacity from Planning agent                 │
│      → Update flow_efficiency attribute                     │
│                                                             │
│  ✅ Signals fire BEFORE DB write                            │
│  ✅ Sub-100ms reaction time                                 │
│  ✅ Collaborative problem-solving                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: PERSIST TO DATABASE (HISTORICAL RECORD)             │
│                                                             │
│  DB.write({                                                 │
│    table: "agent_facts",                                    │
│    entity: "project_abc",                                   │
│    attribute: "budget_variance",                            │
│    value: -45000,                                           │
│    source_agent: "finops",                                  │
│    created_at: now()                                        │
│  })                                                         │
│                                                             │
│  ✅ Durable storage for audit trails                        │
│  ✅ Historical trend analysis                               │
│  ✅ Compliance reporting                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: DASHBOARD QUERIES AGENT ATTRIBUTES (ZERO-LAG)      │
│                                                             │
│  Widget: <PortfolioFlowMetricsWidget />                     │
│    → useAgentAttributes('planning')                         │
│    → GET /api/agents/planning/attributes                    │
│    → Agent.getAttributeValue('flow_time_avg')              │
│         ├─ Check Mem0 first (cache hit: 5ms)               │
│         └─ Fallback to DB if expired (cache miss: 50ms)    │
│                                                             │
│  ✅ Widgets always show live data                           │
│  ✅ No database polling                                     │
│  ✅ WebSocket invalidation on updates                       │
└─────────────────────────────────────────────────────────────┘
```

---

## The 315 Attributes as Callable Properties

### Agent Object Interface

Each of the 9 agents implements this interface:

```typescript
interface AgentObject {
  // Core identity
  agent_id: string;
  agent_type: 'pmo' | 'finops' | 'vro' | 'planning' | 'ocm' | 'risk' | 'governance' | 'tmo' | 'company';

  // 30-40 domain-specific attributes (callable properties)
  [attribute_key: string]: AgentAttribute;

  // MCP adapters attached
  mcpAdapters: MCPAdapter[];

  // Memory systems
  mem0: Mem0Service;
  letta: LettaAgentMemory;

  // Methods
  getAttribute(key: string): Promise<AgentAttributeValue>;
  watchAttribute(key: string, callback: SignalHandler): void;
  broadcastFact(entity: string, attribute: string, value: any): Promise<void>;
  observeFacts(pattern: string): Promise<Fact[]>;
}
```

### Example: PMO Agent with 38 Attributes

```typescript
class PMOAgentObject implements AgentObject {
  agent_id = 'pmo';
  agent_type = 'pmo' as const;

  // MCP Adapters (streaming connectors)
  mcpAdapters = [
    new JiraMCPAdapter({ webhook: true, stream: true }),
    new AzureDevOpsMCPAdapter({ webhook: true, stream: true })
  ];

  // 38 Callable Attributes (PMO Domain)

  // Identifiers & Traceability
  get feature_uuid(): Promise<string> { return this.getAttribute('feature_uuid'); }
  get parent_epic_id(): Promise<string> { return this.getAttribute('parent_epic_id'); }
  get art_id(): Promise<string> { return this.getAttribute('art_id'); }

  // WSJF Prioritization
  get wsjf_score(): Promise<number> { return this.getAttribute('wsjf_score'); }
  get user_business_value(): Promise<number> { return this.getAttribute('user_business_value'); }
  get time_criticality(): Promise<number> { return this.getAttribute('time_criticality'); }
  get rroe_value(): Promise<number> { return this.getAttribute('rroe_value'); }

  // Story Points & Completion
  get estimated_story_points(): Promise<number> { return this.getAttribute('estimated_story_points'); }
  get actual_points_completed(): Promise<number> { return this.getAttribute('actual_points_completed'); }
  get percent_complete(): Promise<number> { return this.getAttribute('percent_complete'); }

  // Flow Status & Timing ⭐ CRITICAL FOR EARLY WARNING
  get flow_status(): Promise<FlowStatus> { return this.getAttribute('flow_status'); }
  get wip_age(): Promise<number> { return this.getAttribute('wip_age'); }
  get flow_efficiency(): Promise<number> { return this.getAttribute('flow_efficiency'); }
  get cycle_time_avg(): Promise<number> { return this.getAttribute('cycle_time_avg'); }
  get lead_time(): Promise<number> { return this.getAttribute('lead_time'); }

  // Dependencies & Blockers
  get dependency_count(): Promise<number> { return this.getAttribute('dependency_count'); }
  get blocker_status(): Promise<boolean> { return this.getAttribute('blocker_status'); }

  // ... 20 more attributes (38 total)

  // Core method: Get attribute value (Mem0 first, DB fallback)
  async getAttribute(key: string): Promise<any> {
    // 1. Check Mem0 cache (5ms)
    const cached = await this.mem0.get(`${this.agent_id}:${key}`);
    if (cached && !cached.expired) {
      return cached.value;
    }

    // 2. Fallback to DB (50ms)
    const dbValue = await db.query(`
      SELECT value FROM agent_facts
      WHERE agent_id = $1 AND attribute_key = $2
      ORDER BY created_at DESC LIMIT 1
    `, [this.agent_id, key]);

    // 3. Write back to Mem0 for next time
    if (dbValue) {
      await this.mem0.set(`${this.agent_id}:${key}`, dbValue, { ttl: 300 });
    }

    return dbValue?.value;
  }

  // Watch for attribute changes (streaming)
  watchAttribute(key: string, callback: SignalHandler): void {
    this.mem0.watch(`${this.agent_id}:${key}`, (newValue, oldValue) => {
      callback({
        agent_id: this.agent_id,
        attribute: key,
        old_value: oldValue,
        new_value: newValue,
        timestamp: Date.now(),
        signal: this.evaluateSignal(key, newValue)
      });
    });
  }

  // Evaluate if attribute change should fire signal
  private evaluateSignal(key: string, value: any): Signal | null {
    // Example: WIP Age early warning
    if (key === 'wip_age' && value > 30) {
      return {
        type: 'STALE_WORK_DETECTED',
        severity: 'warning',
        message: `Work in progress for ${value} days, target is <30`,
        recommended_action: 'Request capacity from Planning agent',
        notify: ['planning', 'tmo']
      };
    }

    // Example: Flow efficiency degradation
    if (key === 'flow_efficiency' && value < 0.3) {
      return {
        type: 'FLOW_EFFICIENCY_LOW',
        severity: 'critical',
        message: `Flow efficiency at ${value * 100}%, target is >30%`,
        recommended_action: 'Identify blockers and reduce WIP',
        notify: ['planning', 'governance']
      };
    }

    return null;
  }
}
```

---

## Langflow: Visual Agent + MCP Wiring

### Why Langflow Completes This Architecture

**The Missing Piece**: While agents are objects with 315 attributes and MCPs stream data to Mem0, we need a **visual layer** to:
1. Wire agents to specific MCPs
2. Configure attribute thresholds visually
3. Design A2A collaboration flows
4. Test MCP connections without code

**Langflow provides this visual layer**:

```
┌─────────────────────────────────────────────────────────────┐
│                    LANGFLOW (VISUAL LAYER)                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Flow: "PMO Agent MCP Configuration"                 │  │
│  │                                                      │  │
│  │  [PMO Agent]──>[Jira MCP]──>[Parse Issues]         │  │
│  │       │                            │                │  │
│  │       │                            ↓                │  │
│  │       └──>[Azure DevOps]──>[Parse Work Items]      │  │
│  │                            │                        │  │
│  │                            ↓                        │  │
│  │                     [Write to Mem0]                 │  │
│  │                            │                        │  │
│  │                            ↓                        │  │
│  │                     [Check Thresholds]              │  │
│  │                            │                        │  │
│  │                       ├─ wip_age > 30?              │  │
│  │                       │   YES → [Fire Signal]       │  │
│  │                       │   NO  → [Continue]          │  │
│  │                       │                             │  │
│  │                       └─ flow_efficiency < 0.3?     │  │
│  │                           YES → [Alert Planning]    │  │
│  │                           NO  → [Log Metric]        │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Visual Agent Object Configuration

In Langflow, each agent is represented as a flow that:

1. **Defines MCP Adapters** - Drag-and-drop which MCPs attach to agent
2. **Configures Streaming** - Set webhook URLs, polling intervals, credentials
3. **Maps Attributes** - Visual mapping of MCP fields → agent attributes
4. **Sets Thresholds** - Sliders/inputs for signal thresholds (e.g., wip_age > 30)
5. **Defines Signals** - What happens when threshold crossed (A2A, WebSocket, intervention)

### Example: PMO Agent Flow in Langflow

```
Agent Object: PMO
├─ [Input] MCP Adapters
│   ├─ Jira MCP
│   │   └─ Webhook: https://your-app.com/webhooks/pmo/jira
│   └─ Azure DevOps MCP
│       └─ Polling: Every 5 minutes
│
├─ [Process] Attribute Mapping
│   ├─ Jira Issue → wip_age (calculate from created date)
│   ├─ Jira Story Points → estimated_story_points
│   ├─ Azure DevOps Work Item → flow_status
│   └─ Both → dependency_count (count links)
│
├─ [Decision] Threshold Checks
│   ├─ IF wip_age > 30 days → Fire "STALE_WORK_DETECTED" signal
│   ├─ IF flow_efficiency < 0.3 → Fire "FLOW_EFFICIENCY_LOW" signal
│   └─ IF blocker_status = true → Fire "BLOCKER_DETECTED" signal
│
├─ [Output] Write to Mem0
│   └─ Cache all attributes with 5-minute TTL
│
└─ [Output] Persist to DB
    └─ Async write to agent_facts table
```

### Langflow Components We'll Build

**Custom Components for Agent Architecture**:

1. **AgentObjectInput** - Defines agent type, entity ID, active MCPs
2. **MCPStreamingAdapter** - Connects to MCP (Jira, SAP, etc.) with streaming
3. **AttributeMapper** - Maps MCP data to agent attributes
4. **Mem0Writer** - Writes attributes to Mem0 fact ledger
5. **ThresholdEvaluator** - Checks thresholds and fires signals
6. **A2AMessageSender** - Sends agent-to-agent messages
7. **WebSocketBroadcaster** - Invalidates dashboard queries
8. **DBPersister** - Async write to database

### Visual Pre-Integration

**What "Visual Pre-Integration" Means**:

Before going live with real MCPs, users can:

1. **Design flows visually** in Langflow
2. **Test with mock data** using Langflow's playground
3. **See data transformations** as attributes flow through nodes
4. **Validate thresholds** by adjusting sliders and seeing signals fire
5. **Export flow JSON** for version control

**Then, when ready**:
- Connect real MCP credentials
- Enable webhook endpoints
- Activate streaming
- Agents go live with visual configuration intact

### Multi-Agent Collaboration Flows

**Example: Budget Overrun → Multi-Agent Response**

```
[FinOps Agent Detects Budget Overrun]
    ↓
[Fire Signal: "BUDGET_OVERRUN_WARNING"]
    ↓
[Langflow Flow: "Budget Crisis Response"]
    │
    ├─ [Notify PMO Agent via A2A]
    │   └─ PMO checks: Can we descope features?
    │
    ├─ [Notify Planning Agent via A2A]
    │   └─ Planning checks: Dependencies on this project?
    │
    ├─ [Notify VRO Agent via A2A]
    │   └─ VRO checks: Impact on strategic outcomes?
    │
    ├─ [Create Jira Ticket]
    │   └─ PMO board: "Budget overrun requires review"
    │
    ├─ [Slack Notification]
    │   └─ #pmo-alerts channel
    │
    └─ [WebSocket Broadcast]
        └─ Invalidate: ['agent-attributes', 'finops']
```

**In Langflow**: This entire flow is **visual**, **testable**, and **modifiable** without code changes.

---

## Implementation Plan

### Phase 1: MCP Streaming Adapters

**File**: `server/lib/MCPStreamingAdapter.ts`

```typescript
/**
 * Base class for MCP adapters that stream data to Mem0
 */
abstract class MCPStreamingAdapter {
  abstract adapter_name: string;
  abstract agent_id: string;

  protected mem0: Mem0Service;
  protected websocket?: WebSocketConnection;

  /**
   * Start listening for streaming data
   * (webhooks, websockets, change data capture, etc.)
   */
  abstract startStreaming(): Promise<void>;

  /**
   * Handle incoming data and write to Mem0
   */
  protected async handleStreamingData(data: any): Promise<void> {
    // Parse MCP data into agent attributes
    const attributes = this.parseToAttributes(data);

    // Write each attribute to Mem0 FIRST
    for (const attr of attributes) {
      await this.mem0.write({
        entity: attr.entity,
        attribute: attr.key,
        value: attr.value,
        source_agent: this.agent_id,
        source_mcp: this.adapter_name,
        confidence: attr.confidence || 0.95,
        timestamp: Date.now(),
        ttl: 300 // 5 minute cache
      });

      // Fire signal if threshold crossed
      const signal = this.evaluateSignal(attr);
      if (signal) {
        await this.fireSignal(signal);
      }
    }

    // Persist to DB asynchronously (non-blocking)
    this.persistToDatabase(attributes).catch(err => {
      console.error('DB persistence failed:', err);
      // Don't block streaming on DB failures
    });
  }

  /**
   * Parse MCP-specific data format to agent attributes
   */
  protected abstract parseToAttributes(data: any): ParsedAttribute[];

  /**
   * Evaluate if attribute change triggers a signal
   */
  protected abstract evaluateSignal(attr: ParsedAttribute): Signal | null;

  /**
   * Fire signal to other agents and dashboards
   */
  protected async fireSignal(signal: Signal): Promise<void> {
    // 1. Broadcast to A2A message bus
    await this.broadcastToAgents(signal);

    // 2. Invalidate dashboard queries via WebSocket
    await this.invalidateDashboards(signal);

    // 3. Create intervention if critical
    if (signal.severity === 'critical') {
      await this.createIntervention(signal);
    }
  }

  /**
   * Persist to database (asynchronous, non-blocking)
   */
  protected async persistToDatabase(attributes: ParsedAttribute[]): Promise<void> {
    await db.transaction(async (trx) => {
      for (const attr of attributes) {
        await trx('agent_facts').insert({
          agent_id: this.agent_id,
          entity: attr.entity,
          attribute_key: attr.key,
          value: JSON.stringify(attr.value),
          source_mcp: this.adapter_name,
          confidence: attr.confidence,
          created_at: new Date()
        });
      }
    });
  }
}
```

### Phase 2: Specific MCP Adapters

**Example**: `server/lib/adapters/JiraMCPAdapter.ts`

```typescript
class JiraMCPAdapter extends MCPStreamingAdapter {
  adapter_name = 'jira-mcp';
  agent_id = 'pmo';

  /**
   * Listen for Jira webhooks (streaming)
   */
  async startStreaming(): Promise<void> {
    // Register Jira webhook endpoint
    app.post('/webhooks/jira', async (req, res) => {
      const event = req.body;
      await this.handleStreamingData(event);
      res.sendStatus(200);
    });

    console.log(`✅ Jira MCP streaming adapter started for ${this.agent_id}`);
  }

  /**
   * Parse Jira webhook event to PMO attributes
   */
  protected parseToAttributes(event: JiraWebhookEvent): ParsedAttribute[] {
    const attributes: ParsedAttribute[] = [];

    if (event.issue) {
      const issue = event.issue;

      // Map Jira fields to PMO attributes
      attributes.push({
        entity: `feature_${issue.key}`,
        key: 'estimated_story_points',
        value: issue.fields.customfield_10016 || 0, // Story points
        confidence: 1.0
      });

      attributes.push({
        entity: `feature_${issue.key}`,
        key: 'flow_status',
        value: this.mapJiraStatusToFlowStatus(issue.fields.status.name),
        confidence: 1.0
      });

      // Calculate WIP age if in "In Progress" status
      if (issue.fields.status.name === 'In Progress') {
        const wipAge = this.calculateWIPAge(issue.fields.created);
        attributes.push({
          entity: `feature_${issue.key}`,
          key: 'wip_age',
          value: wipAge,
          confidence: 1.0
        });
      }
    }

    return attributes;
  }

  /**
   * Evaluate signals for PMO agent
   */
  protected evaluateSignal(attr: ParsedAttribute): Signal | null {
    // WIP Age warning
    if (attr.key === 'wip_age' && attr.value > 30) {
      return {
        type: 'STALE_WORK_DETECTED',
        severity: 'warning',
        agent_id: this.agent_id,
        entity: attr.entity,
        message: `Work in progress for ${attr.value} days, target is <30`,
        recommended_action: 'Request capacity from Planning agent',
        notify: ['planning', 'tmo']
      };
    }

    return null;
  }

  private mapJiraStatusToFlowStatus(status: string): FlowStatus {
    const mapping: Record<string, FlowStatus> = {
      'Backlog': 'Backlog',
      'To Do': 'Analyzing',
      'In Progress': 'Implementing',
      'Code Review': 'Validating',
      'Done': 'Done'
    };
    return mapping[status] || 'Backlog';
  }

  private calculateWIPAge(createdDate: string): number {
    const created = new Date(createdDate);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
```

### Phase 3: Agent Attribute Registry with Streaming

**Update**: `server/lib/AgentAttributeRegistry.ts`

```typescript
import { PMOAgentObject } from './agents/PMOAgentObject';
import { FinOpsAgentObject } from './agents/FinOpsAgentObject';
// ... other agents

/**
 * Get agent object instance with streaming MCPs
 */
export function getAgentObject(agentType: AgentType, entityId?: string): AgentObject {
  switch (agentType) {
    case 'pmo':
      return new PMOAgentObject(entityId);
    case 'finops':
      return new FinOpsAgentObject(entityId);
    // ... other agents
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Get agent attribute value (Mem0 first, DB fallback)
 */
export async function getAgentAttribute(
  agentType: AgentType,
  attributeKey: string,
  entityId?: string
): Promise<AgentAttributeValue> {
  const agent = getAgentObject(agentType, entityId);
  return agent.getAttribute(attributeKey);
}

/**
 * Watch agent attribute for changes (streaming)
 */
export function watchAgentAttribute(
  agentType: AgentType,
  attributeKey: string,
  callback: SignalHandler,
  entityId?: string
): void {
  const agent = getAgentObject(agentType, entityId);
  agent.watchAttribute(attributeKey, callback);
}
```

### Phase 4: Dashboard WebSocket Invalidation

**Update**: `client/src/contexts/WebSocketContext.tsx`

```typescript
// Listen for agent signals from Mem0
socket.on('agent:signal', (signal: AgentSignal) => {
  console.log('🔔 Agent signal received:', signal);

  // Invalidate affected dashboard queries
  const affectedQueries = [
    ['agent-attributes', signal.agent_id],
    ['dashboard-metrics', signal.entity],
  ];

  affectedQueries.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });

  // Show toast notification if critical
  if (signal.severity === 'critical') {
    toast.error(signal.message, {
      action: {
        label: signal.recommended_action,
        onClick: () => handleSignalAction(signal)
      }
    });
  }
});
```

---

## Benefits of This Architecture

### 1. **Zero-Lag Dashboards**
- Widgets query agent attributes (callable properties)
- Mem0 cache hit: **5ms** response time
- DB fallback: **50ms** response time
- No polling, no stale data

### 2. **Early Warning System**
- Signals fire **BEFORE** DB write
- Sub-100ms reaction time
- Collaborative problem-solving via A2A
- Proactive interventions

### 3. **Liquid Data Model**
- MCP adapters stream continuously
- Mem0 acts as shared fact ledger
- 175K facts/day throughput
- Always live, never stale

### 4. **Agent Autonomy**
- Agents watch their own attributes
- Fire signals when thresholds crossed
- Collaborate via A2A message bus
- Learn patterns over time (Letta)

### 5. **Scalability**
- MCP adapters run independently
- Mem0 handles high-frequency writes
- DB persistence is asynchronous
- WebSocket broadcasts batch updates

---

## Summary

**What Makes This Revolutionary**:

1. ✅ **Agents as Objects** - 315 callable attributes across 9 agents
2. ✅ **MCP Adapters** - Streaming connectors specific to each agent's domain
3. ✅ **Mem0 Early Warning** - Signal layer BEFORE database persistence
4. ✅ **Zero-Lag Dashboards** - Widgets query object attributes, not DB
5. ✅ **Collaborative Intelligence** - Agents watch Mem0, signal each other

**Result**: A truly liquid, real-time, intelligent PMO system where agents are first-class objects and data flows MCP → Mem0 → DB with early warning signals firing before persistence.

**Next Step**: Implement Phase 1 (MCP Streaming Adapters) 🚀
