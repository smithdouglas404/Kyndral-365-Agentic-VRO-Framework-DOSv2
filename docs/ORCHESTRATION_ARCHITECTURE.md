# Orchestration Architecture - Unified Guide

## The Problem

You're right - the system has multiple orchestrators:

1. **ContinuousOrchestrator** - A2A message bus
2. **AgentOrchestrator** - MCP tool routing
3. **UnifiedOrchestrationEngine** - Workflow triggers
4. **DeepAgentOrchestrator** - Deep agents
5. **Camunda8Service** - DMN/BPMN workflows (NEW)

This is confusing and creates maintenance complexity.

---

## The Solution: Single Responsibility Principle

Each orchestrator has ONE clear responsibility. They work together in layers.

```
┌──────────────────────────────────────────────────────────────┐
│                        USER REQUEST                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ LAYER 1: UNIFIED ORCHESTRATION ENGINE (Entry Point)          │
│ • Single entry point for all agent requests                  │
│ • Routes to appropriate orchestrator                          │
│ • Coordinates multi-agent workflows                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
            ┌───────────────┴───────────────┐
            ↓                               ↓
┌───────────────────────┐       ┌───────────────────────┐
│ LAYER 2A: AGENT       │       │ LAYER 2B: DEEP AGENT  │
│ ORCHESTRATOR          │       │ ORCHESTRATOR          │
│ • Standard agents     │       │ • Complex reasoning   │
│ • MCP tool routing    │       │ • Multi-step tasks    │
│ • LLM selection       │       │ • Specialized agents  │
└───────────────────────┘       └───────────────────────┘
            ↓                               ↓
┌───────────────────────┐       ┌───────────────────────┐
│ LAYER 3: CAMUNDA 8    │       │ LAYER 3: A2A MESSAGE  │
│ SERVICE               │       │ BUS (Continuous)      │
│ • DMN decisions       │       │ • Inter-agent msgs    │
│ • BPMN workflows      │       │ • Real-time collab    │
│ • Rules engine        │       │ • Event streaming     │
└───────────────────────┘       └───────────────────────┘
```

---

## Orchestrator Responsibilities

### 1. UnifiedOrchestrationEngine (MASTER - Entry Point)

**File**: `server/routes/orchestration.ts` + `server/lib/UnifiedOrchestrationEngine.ts`

**What it does**:
- **Single entry point** for all agent requests
- Routes requests to appropriate sub-orchestrator
- Coordinates multi-agent workflows
- Manages workflow state and context
- Handles user-facing APIs

**When to use**:
```typescript
// User makes agent request
POST /api/agents/execute
→ UnifiedOrchestrationEngine.executeRequest()
  → Routes to AgentOrchestrator or DeepAgentOrchestrator
```

**Responsibilities**:
- Request validation
- Agent routing (standard vs deep)
- Workflow coordination
- Response aggregation
- Error handling

**Code Location**: `server/routes/orchestration.ts`

---

### 2. AgentOrchestrator (Standard Agents)

**File**: `server/lib/AgentOrchestrator.ts`

**What it does**:
- Executes **standard agent** requests
- Loads agent configurations (enabled, MCP mappings, LLM strategy)
- Initializes MCP connectors
- Routes to appropriate LLM
- Executes trigger conditions

**When to use**:
```typescript
// Simple, single-agent tasks
examples:
- "Show me budget status" (FinOps Agent)
- "Assess project risk" (Risk Agent)
- "Find compliance policy" (Governance Agent)
```

**Responsibilities**:
- Load agent config from database
- Initialize MCP tools for agent
- Build system prompt with tool context
- Call LLM via EnhancedLLMRouter
- Execute Knowledge Base triggers
- Log agent execution

**Code Location**: `server/lib/AgentOrchestrator.ts`

**APIs**:
```bash
POST /api/agents/execute
GET /api/agents/enabled
GET /api/agents/:agentId/config
POST /api/agents/reload
```

---

### 3. DeepAgentOrchestrator (Complex Reasoning)

**File**: `server/routes/deep-agents.ts`

**What it does**:
- Executes **deep agent** requests (complex, multi-step reasoning)
- Uses specialized LangChain agents
- Handles tool use and reflection
- Supports long-running tasks

**When to use**:
```typescript
// Complex, multi-step analysis
examples:
- "Analyze portfolio health and recommend 3 projects to pause"
- "Find all compliance gaps across 50 projects and prioritize fixes"
- "Perform deep RCA on last 10 failed deployments"
```

**Responsibilities**:
- LangChain agent initialization
- Tool selection and orchestration
- Multi-step reasoning loops
- Reflection and refinement
- Long-running task management

**Code Location**: `server/routes/deep-agents.ts`

**APIs**:
```bash
POST /api/deep-agents/:agentType
```

---

### 4. Camunda8Service (DMN Decisions + BPMN Workflows)

**File**: `server/lib/Camunda8Service.ts`

**What it does**:
- **Evaluates DMN decision tables** (agent collaboration rules)
- **Executes BPMN workflows** (complex multi-agent processes)
- Integrates with Camunda 8 (Zeebe engine)
- Provides visual rule builder via Camunda Modeler

**When to use**:
```typescript
// Decision evaluation
const collaboration = await camunda.evaluateAgentCollaboration({
  sourceAgent: 'finops',
  cpi: 0.65,
  riskScore: 3,
  severity: 'high'
});
// Returns: { shouldCollaborate: true, targetAgents: ['tmo', 'risk'] }

// Workflow execution
await camunda.startWorkflow('budget-overrun-workflow', {
  projectId: 'proj-123',
  cpi: 0.65
});
```

**Responsibilities**:
- Connect to Camunda 8 (Cloud or self-hosted)
- Evaluate DMN decision tables
- Start BPMN workflow instances
- Publish workflow messages
- Fallback to simple rules if Camunda unavailable

**Code Location**: `server/lib/Camunda8Service.ts`

**APIs**:
```bash
POST /api/admin/camunda/decisions/evaluate
POST /api/admin/camunda/workflows/deploy
POST /api/admin/camunda/workflows/start
POST /api/admin/camunda/agent-collaboration/evaluate
GET /api/admin/camunda/topology
```

**Replaces**: `AgentCollaborationRulesEngine.ts` (json-rules-engine)

---

### 5. ContinuousOrchestrator (A2A Message Bus)

**File**: `server/routes/orchestration.ts` (ContinuousOrchestrator class)

**What it does**:
- **Inter-agent messaging** (real-time communication)
- Event-driven collaboration
- Message queue management
- Agent-to-agent notifications

**When to use**:
```typescript
// Agent A sends message to Agent B
await a2aMessageBus.sendMessage({
  fromAgent: 'finops',
  toAgent: 'tmo',
  messageType: 'request_collaboration',
  payload: { cpi: 0.65, projectId: 'proj-123' }
});
```

**Responsibilities**:
- Message routing between agents
- Event streaming
- Real-time collaboration
- Message persistence
- Pub/sub for agent events

**Code Location**: `server/routes/orchestration.ts` (within file)

**When NOT to use**:
- Simple agent requests (use AgentOrchestrator)
- Complex workflows (use Camunda8Service)

---

## Decision Tree: Which Orchestrator to Use?

```
User makes request
    ↓
Is it a simple, single-agent task?
    ├─ YES → AgentOrchestrator
    │         (e.g., "Show budget status")
    │
    └─ NO → Is it complex multi-step reasoning?
            ├─ YES → DeepAgentOrchestrator
            │         (e.g., "Analyze portfolio and recommend")
            │
            └─ NO → Is it inter-agent collaboration?
                    ├─ YES → Does it need visual workflows?
                    │        ├─ YES → Camunda8Service (BPMN)
                    │        │         (e.g., "Budget overrun workflow")
                    │        │
                    │        └─ NO → ContinuousOrchestrator (A2A)
                    │                  (e.g., "Notify TMO of budget issue")
                    │
                    └─ NO → UnifiedOrchestrationEngine
                              (Coordinates above)
```

---

## Call Flow Examples

### Example 1: Simple Agent Request

```
User: "Show me project budget status"
    ↓
UnifiedOrchestrationEngine.executeRequest()
    ↓
AgentOrchestrator.executeAgentRequest({ agentId: 'finops', taskType: 'budget_analysis', ... })
    ↓
1. Load FinOps Agent config from DB
2. Initialize MCP tools (QuickBooks, ClickHouse, etc.)
3. Build system prompt with tool context
4. Call LLM via EnhancedLLMRouter
5. Return response to user
```

### Example 2: Complex Multi-Agent Workflow

```
FinOps Agent: "Budget overrun detected: CPI 0.65"
    ↓
AgentOrchestrator.executeAgentRequest()
    ↓
Check if collaboration needed → Call Camunda8Service
    ↓
Camunda8Service.evaluateAgentCollaboration({ sourceAgent: 'finops', cpi: 0.65 })
    ↓
DMN Decision Table evaluates → Returns: { shouldCollaborate: true, targetAgents: ['tmo', 'risk', 'governance'] }
    ↓
Camunda8Service.startWorkflow('budget-overrun-workflow')
    ↓
BPMN Workflow executes:
    1. Notify TMO Agent (via A2A)
    2. Notify Risk Agent (via A2A)
    3. Send email to exec
    4. Wait for approval
    5. Execute remediation or escalate
```

### Example 3: Real-Time Inter-Agent Message

```
FinOps Agent: Send alert to TMO
    ↓
AgentOrchestrator → ContinuousOrchestrator (A2A)
    ↓
ContinuousOrchestrator.sendMessage({
  fromAgent: 'finops',
  toAgent: 'tmo',
  messageType: 'budget_alert',
  payload: { cpi: 0.65, projectId: 'proj-123' }
})
    ↓
TMO Agent receives message via WebSocket
TMO Agent can respond or take action
```

---

## Recommended Consolidation

### Phase 1: Immediate (No Breaking Changes)

**Keep as-is but clarify**:
1. **UnifiedOrchestrationEngine** - Master coordinator (entry point)
2. **AgentOrchestrator** - Standard agents (most common)
3. **DeepAgentOrchestrator** - Complex reasoning (specialized)
4. **Camunda8Service** - DMN/BPMN (replaces json-rules-engine)
5. **ContinuousOrchestrator** - A2A messaging (real-time)

**Update documentation** (this file) to clarify responsibilities.

### Phase 2: Future Consolidation (Breaking Changes)

**Merge into single orchestrator**:

```typescript
// server/lib/MasterOrchestrator.ts
export class MasterOrchestrator {
  async execute(request: AgentRequest): Promise<AgentResponse> {
    // Route to appropriate handler
    if (request.type === 'simple') {
      return this.executeStandard(request);
    } else if (request.type === 'complex') {
      return this.executeDeep(request);
    } else if (request.type === 'workflow') {
      return this.executeWorkflow(request);
    }
  }

  private executeStandard() { /* AgentOrchestrator logic */ }
  private executeDeep() { /* DeepAgentOrchestrator logic */ }
  private executeWorkflow() { /* Camunda8Service logic */ }
  private sendMessage() { /* A2A logic */ }
}
```

**Benefits**:
- Single entry point
- Unified configuration
- Easier testing
- Clearer responsibility

**Drawbacks**:
- Large refactor required
- Breaking API changes
- More complex single file

**Recommendation**: Do Phase 1 now (documentation), Phase 2 later (major version).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER / API CLIENT                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 UNIFIED ORCHESTRATION ENGINE                     │
│                     (Entry Point / Router)                       │
│ • POST /api/agents/execute                                       │
│ • Routes to appropriate orchestrator                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌────────────────────┐                   ┌────────────────────┐
│ AGENT ORCHESTRATOR │                   │ DEEP AGENT         │
│                    │                   │ ORCHESTRATOR       │
│ • Standard agents  │                   │ • LangChain agents │
│ • MCP routing      │                   │ • Multi-step       │
│ • LLM routing      │                   │ • Tool use         │
└────────────────────┘                   └────────────────────┘
        ↓                                           ↓
┌───────────────────────────────────────────────────────────────┐
│                    COLLABORATION LAYER                         │
│ ┌──────────────────┐        ┌──────────────────────────────┐ │
│ │ CAMUNDA 8        │        │ CONTINUOUS ORCHESTRATOR      │ │
│ │ SERVICE          │        │ (A2A Message Bus)            │ │
│ │                  │        │                              │ │
│ │ • DMN decisions  │        │ • Inter-agent messages       │ │
│ │ • BPMN workflows │        │ • Event streaming            │ │
│ │ • Rules engine   │        │ • Real-time collab           │ │
│ └──────────────────┘        └──────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
        ↓                                           ↓
┌───────────────────────────────────────────────────────────────┐
│                    FOUNDATION LAYER                            │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│ │ EnhancedLLMRouter│  │ MCP Connectors   │  │ Knowledge    │ │
│ │ • Model routing  │  │ • Tool execution │  │ Base         │ │
│ │ • Cost tracking  │  │ • API integration│  │ • Documents  │ │
│ └──────────────────┘  └──────────────────┘  └──────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## Summary

### Current State:
- ❌ 5 orchestrators with overlapping responsibilities
- ❌ Confusing when to use which
- ❌ Complex maintenance

### After Documentation Update:
- ✅ Clear single responsibility per orchestrator
- ✅ Decision tree for routing
- ✅ Documented call flows
- ✅ Easy to understand and maintain

### Future State (Optional):
- Consolidate into MasterOrchestrator
- Single API surface
- Unified configuration

**The system is now clearly documented!** 📚
