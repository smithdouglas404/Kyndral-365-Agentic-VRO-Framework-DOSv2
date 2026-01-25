# COMPLETE INTEGRATION FLOWS - EVERY COMPONENT

**Master Reference for All System Integrations**

> This document provides detailed integration flows with diagrams for EVERY major component in the system. Each section shows exactly how data flows from user action → database → agents → notifications.

**Last Updated:** January 25, 2026, 11:00 PM EST

---

## TABLE OF CONTENTS

### Core Systems
1. [Rule Editors - All 8 Complete Flows](#rule-editors---all-8-complete-flows)
2. [MCP Integration - External Tool Connection](#mcp-integration---external-tool-connection)
3. [Memory Architecture - Mem0 + Letta](#memory-architecture---mem0--letta)
4. [Deep Agent Collaboration - A2A Message Bus](#deep-agent-collaboration---a2a-message-bus)
5. [Ontology/OBDA - Semantic Queries](#ontologyobda---semantic-queries)
6. [Knowledge Base/RAG - Document Intelligence](#knowledge-base-rag---document-intelligence)
7. [Camunda Workflows - DMN/BPMN](#camunda-workflows---dmnbpmn)
8. [Notification System - Real-Time Alerts](#notification-system---real-time-alerts)

### User Journeys
9. [8 Workspace Flows - Complete User Paths](#8-workspace-flows---complete-user-paths)
10. [Project Lifecycle - From Creation to Closure](#project-lifecycle---from-creation-to-closure)

### Infrastructure
11. [Database Layer - All 48 Tables](#database-layer---all-48-tables)
12. [API Layer - All Endpoints](#api-layer---all-endpoints)
13. [WebSocket Layer - Real-Time Communication](#websocket-layer---real-time-communication)

---

## RULE EDITORS - ALL 8 COMPLETE FLOWS

### Overview Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  USER INTERFACE (React)                                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  8 Rule Editor Components                                      │  │
│  │  ├─ FinOpsRuleEditor.tsx      (Budget, EVM, CPI/SPI)          │  │
│  │  ├─ TMORuleEditor.tsx          (Schedule, Milestones)          │  │
│  │  ├─ RiskRuleEditor.tsx         (Risk Score, Heat Map)          │  │
│  │  ├─ VRORuleEditor.tsx          (Value, ROI, Benefits)          │  │
│  │  ├─ PMORuleEditor.tsx          (Portfolio, Stage Gates)        │  │
│  │  ├─ OCMRuleEditor.tsx          (ADKAR, Resistance)             │  │
│  │  ├─ GovernanceRuleEditor.tsx   (Compliance, Approvals)         │  │
│  │  └─ CustomAttributeBuilder.tsx (Create New Attributes)         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                ALL EXTEND                                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  RuleEditorBase.tsx (560+ lines)                               │  │
│  │  ├─ Condition Builder                                          │  │
│  │  ├─ Action Selector                                            │  │
│  │  ├─ Priority Slider                                            │  │
│  │  ├─ Enable/Disable Toggle                                      │  │
│  │  └─ CRUD Operations (Create, Read, Update, Delete)             │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────────┘
                       ↓ React Query
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND API (Express + TypeScript)                                  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Custom Attributes API (server/routes/custom-attributes.ts)   │  │
│  │  - GET /api/custom-attributes?visibleTo={agentType}           │  │
│  │  - POST /api/custom-attributes                                │  │
│  │  - PUT /api/custom-attributes/:id                             │  │
│  │  - DELETE /api/custom-attributes/:id                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Agent Rules API (server/routes/agent-rules.ts)               │  │
│  │  - GET /api/rules/agent/:agentType                            │  │
│  │  - POST /api/rules                                            │  │
│  │  - PUT /api/rules/:id                                         │  │
│  │  - DELETE /api/rules/:id                                      │  │
│  │  - POST /api/rules/:id/duplicate                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────────┘
                       ↓ Drizzle ORM
┌──────────────────────────────────────────────────────────────────────┐
│  POSTGRESQL DATABASE                                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  custom_attributes                                             │  │
│  │  - Stores user-defined and policy-generated attributes        │  │
│  │  - Controls visibility (visibleTo array)                      │  │
│  │  - Links to policies (sourcePolicyId)                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  agent_collaboration_rules                                     │  │
│  │  - Stores user-defined rules                                  │  │
│  │  - Conditions (JSON array of fact checks)                     │  │
│  │  - Actions (JSON array of operations)                         │  │
│  │  - Priority (1-10, execution order)                           │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────────┘
                       ↓ Rules Engine loads on startup
┌──────────────────────────────────────────────────────────────────────┐
│  RULES ENGINE (json-rules-engine)                                    │
│  server/lib/AgentCollaborationRulesEngine.ts                        │
│                                                                      │
│  loadRules() → SELECT * FROM agent_collaboration_rules              │
│             → Convert to json-rules-engine format                    │
│             → engine.addRule(...)                                    │
│                                                                      │
│  evaluateRules(facts) → engine.run(facts)                            │
│                       → Returns triggered rules                      │
│                       → Execute actions                              │
│                       → Log to rule_execution_history                │
└──────────────────────┬───────────────────────────────────────────────┘
                       ↓ Agents use facts
┌──────────────────────────────────────────────────────────────────────┐
│  AGENT BEHAVIOR                                                      │
│  Deep Agents detect conditions → Write facts to Mem0                │
│  → Rules Engine evaluates facts → Rules fire → Actions execute      │
│  → Agents observe via Mem0 subscriptions → React and learn          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1. FINOPS RULE EDITOR - COMPLETE FLOW

**Purpose:** Configure budget monitoring, cost overrun alerts, EVM tracking

### User Journey

```
User navigates to: /admin/rules/finops
↓
FinOpsRuleEditor component loads
↓
Fetches custom attributes visible to FinOps
↓
User creates rule to catch budget overruns
↓
Rule saved to database
↓
Rules engine loads rule
↓
FinOps agent detects overrun
↓
Rule fires, alerts sent
↓
Other agents observe and react
```

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: USER OPENS FINOPS RULE EDITOR                             │
│  URL: /admin/rules/finops                                          │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: COMPONENT INITIALIZATION                                   │
│  client/src/pages/admin/rules/FinOpsRules.tsx                      │
│                                                                     │
│  import { FinOpsRuleEditor } from '@/components/rules/editors';     │
│                                                                     │
│  <FinOpsRuleEditor />                                               │
│    ↓ extends RuleEditorBase.tsx                                    │
│    ↓ passes agentType="finops"                                     │
│    ↓ passes domainAttributes (CPI, SPI, EVM, budget metrics)       │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: FETCH CUSTOM ATTRIBUTES                                    │
│  RuleEditorBase.tsx line 45-55                                      │
│                                                                     │
│  const { data: customAttributes } = useQuery({                      │
│    queryKey: ['custom-attributes', 'finops'],                       │
│    queryFn: async () => {                                           │
│      const response = await fetch(                                  │
│        '/api/custom-attributes?visibleTo=finops'                    │
│      );                                                             │
│      return response.json();                                        │
│    }                                                                │
│  });                                                                │
│                                                                     │
│  Backend: server/routes/custom-attributes.ts line 34                │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ app.get('/api/custom-attributes', async (req, res) => {       │ │
│  │   const { visibleTo } = req.query;                            │ │
│  │                                                               │ │
│  │   let query = db.select().from(customAttributes);            │ │
│  │                                                               │ │
│  │   if (visibleTo) {                                            │ │
│  │     // Filter where visibleTo array contains 'finops'        │ │
│  │     query = query.where(                                      │ │
│  │       sql`${customAttributes.visibleTo}::jsonb @> ${JSON.stringify([visibleTo])}`│ │
│  │     );                                                        │ │
│  │   }                                                           │ │
│  │                                                               │ │
│  │   const attributes = await query;                            │ │
│  │   res.json({ attributes });                                  │ │
│  │ });                                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Database Query:                                                    │
│  SELECT * FROM custom_attributes                                    │
│  WHERE visible_to::jsonb @> '["finops"]'                            │
│  OR owner_agent = 'finops';                                         │
│                                                                     │
│  Returns:                                                           │
│  [                                                                  │
│    // FinOps' own attributes                                       │
│    { name: "cpi", label: "Cost Performance Index", ... },          │
│    { name: "spi", label: "Schedule Performance Index", ... },      │
│    { name: "budget_variance", label: "Budget Variance %", ... },   │
│    { name: "eac", label: "Estimate at Completion", ... },          │
│                                                                     │
│    // Cross-agent attributes visible to FinOps                     │
│    { name: "risk_score", ownerAgent: "risk", ... },                │
│    { name: "team_morale", ownerAgent: "ocm", ... },                │
│                                                                     │
│    // Policy-generated attributes                                  │
│    { name: "incident_severity", sourcePolicyId: "policy_123", ... }│
│  ]                                                                  │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: FETCH EXISTING RULES                                       │
│  RuleEditorBase.tsx line 62-70                                      │
│                                                                     │
│  const { data: rules } = useQuery({                                 │
│    queryKey: ['rules', 'finops'],                                   │
│    queryFn: async () => {                                           │
│      const response = await fetch('/api/rules/agent/finops');      │
│      return response.json();                                        │
│    }                                                                │
│  });                                                                │
│                                                                     │
│  Backend: server/routes/agent-rules.ts line 23                      │
│  app.get('/api/rules/agent/:agentType', async (req, res) => {      │
│    const { agentType } = req.params;                                │
│    const rules = await db.select()                                  │
│      .from(agentCollaborationRules)                                 │
│      .where(eq(agentCollaborationRules.sourceAgent, agentType))     │
│      .orderBy(desc(agentCollaborationRules.priority));              │
│    res.json({ rules });                                             │
│  });                                                                │
│                                                                     │
│  Returns existing FinOps rules:                                     │
│  [                                                                  │
│    {                                                                │
│      id: "rule_001",                                                │
│      name: "Critical CPI Alert",                                    │
│      sourceAgent: "finops",                                         │
│      priority: 9,                                                   │
│      enabled: true,                                                 │
│      conditions: [                                                  │
│        { fact: "cpi", operator: "<", value: 0.75 }                 │
│      ],                                                             │
│      actions: [                                                     │
│        { type: "notify_agent", targetAgent: "pmo" },               │
│        { type: "notify_agent", targetAgent: "governance" }         │
│      ]                                                              │
│    },                                                               │
│    // ... more rules                                                │
│  ]                                                                  │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: UI RENDERS WITH ATTRIBUTES & RULES                         │
│  FinOpsRuleEditor.tsx                                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  FinOps Rule Editor                                          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  📊 EVM Metrics Reference Card                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ CPI = EV / AC    (< 1.0 = over budget)                │ │  │
│  │  │ SPI = EV / PV    (< 1.0 = behind schedule)            │ │  │
│  │  │ EAC = BAC / CPI  (forecast final cost)                │ │  │
│  │  │ VAC = BAC - EAC  (variance at completion)             │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  📝 Existing Rules (3)                                       │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ [✓] Critical CPI Alert                    Priority: 9  │ │  │
│  │  │     IF cpi < 0.75 THEN alert PMO, Governance          │ │  │
│  │  │     [Edit] [Duplicate] [Delete]                        │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │ [✓] Budget Variance Warning              Priority: 7  │ │  │
│  │  │     IF budget_variance > 15 THEN alert TMO            │ │  │
│  │  │     [Edit] [Duplicate] [Delete]                        │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │ [✓] High Risk + Cost Overrun             Priority: 8  │ │  │
│  │  │     IF cpi < 0.85 AND risk_score > 7                  │ │  │
│  │  │     THEN escalate Governance                           │ │  │
│  │  │     [Edit] [Duplicate] [Delete]                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  [+ Create New Rule]                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: USER CREATES NEW RULE                                      │
│  User clicks: [+ Create New Rule]                                   │
│                                                                     │
│  Dialog Opens:                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Create FinOps Rule                                          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Rule Name: [Extreme Budget Crisis                        ] │  │
│  │                                                              │  │
│  │  Description: [Alert all stakeholders when budget...      ] │  │
│  │                                                              │  │
│  │  Priority: [========|--] 8                                   │  │
│  │                                                              │  │
│  │  CONDITIONS (All must be true)                               │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Condition 1:                                           │ │  │
│  │  │   Attribute: [cpi ▼]                                   │ │  │
│  │  │   Operator:  [< less than ▼]                           │ │  │
│  │  │   Value:     [0.70                                   ] │ │  │
│  │  │   [+ Add Condition] [Remove]                           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Condition 2:                                           │ │  │
│  │  │   Attribute: [budget_variance ▼]                       │ │  │
│  │  │   Operator:  [> greater than ▼]                        │ │  │
│  │  │   Value:     [20                                     ] │ │  │
│  │  │   [+ Add Condition] [Remove]                           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ACTIONS (Will execute when triggered)                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Action 1:                                              │ │  │
│  │  │   Type: [notify_agent ▼]                               │ │  │
│  │  │   Target Agent: [pmo ▼]                                │ │  │
│  │  │   [+ Add Action] [Remove]                              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Action 2:                                              │ │  │
│  │  │   Type: [notify_agent ▼]                               │ │  │
│  │  │   Target Agent: [governance ▼]                         │ │  │
│  │  │   [+ Add Action] [Remove]                              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Action 3:                                              │ │  │
│  │  │   Type: [create_task ▼]                                │ │  │
│  │  │   Priority: [critical ▼]                               │ │  │
│  │  │   Assign To: [cfo ▼]                                   │ │  │
│  │  │   [+ Add Action] [Remove]                              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  [Cancel]  [Save Rule]                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  User clicks: [Save Rule]                                          │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: SAVE RULE TO DATABASE                                      │
│  RuleEditorBase.tsx useMutation                                     │
│                                                                     │
│  const createRuleMutation = useMutation({                           │
│    mutationFn: async (rule) => {                                    │
│      const response = await fetch('/api/rules', {                   │
│        method: 'POST',                                              │
│        headers: { 'Content-Type': 'application/json' },             │
│        body: JSON.stringify({                                       │
│          name: "Extreme Budget Crisis",                             │
│          description: "Alert all stakeholders when budget...",      │
│          sourceAgent: "finops",                                     │
│          priority: 8,                                               │
│          enabled: true,                                             │
│          conditions: [                                              │
│            { fact: "cpi", operator: "<", value: 0.70 },            │
│            { fact: "budget_variance", operator: ">", value: 20 }   │
│          ],                                                         │
│          actions: [                                                 │
│            { type: "notify_agent", targetAgent: "pmo" },           │
│            { type: "notify_agent", targetAgent: "governance" },    │
│            { type: "create_task", parameters: {                    │
│              priority: "critical",                                  │
│              assignTo: "cfo"                                        │
│            }}                                                       │
│          ]                                                          │
│        })                                                           │
│      });                                                            │
│      return response.json();                                        │
│    }                                                                │
│  });                                                                │
│                                                                     │
│  Backend: server/routes/agent-rules.ts line 45                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ app.post('/api/rules', authenticate, async (req, res) => {    │ │
│  │   const { name, description, sourceAgent, priority,          │ │
│  │          conditions, actions } = req.body;                    │ │
│  │                                                               │ │
│  │   // Validate rule                                            │ │
│  │   if (!name || !sourceAgent || !conditions || !actions) {    │ │
│  │     return res.status(400).json({ error: 'Invalid rule' });  │ │
│  │   }                                                           │ │
│  │                                                               │ │
│  │   const [rule] = await db.insert(agentCollaborationRules)    │ │
│  │     .values({                                                 │ │
│  │       id: uuidv4(),                                           │ │
│  │       name,                                                   │ │
│  │       description,                                            │ │
│  │       sourceAgent,                                            │ │
│  │       priority,                                               │ │
│  │       enabled: true,                                          │ │
│  │       conditions: JSON.stringify(conditions),                 │ │
│  │       actions: JSON.stringify(actions),                       │ │
│  │       createdBy: req.user?.id || 'system',                    │ │
│  │       createdAt: new Date(),                                  │ │
│  │       updatedAt: new Date()                                   │ │
│  │     })                                                        │ │
│  │     .returning();                                             │ │
│  │                                                               │ │
│  │   // Reload rules in engine                                   │ │
│  │   await rulesEngine.loadRules();                              │ │
│  │                                                               │ │
│  │   res.json({ success: true, rule });                         │ │
│  │ });                                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Database INSERT:                                                   │
│  INSERT INTO agent_collaboration_rules (                            │
│    id, name, description, source_agent, priority, enabled,          │
│    conditions, actions, created_by, created_at, updated_at          │
│  ) VALUES (                                                         │
│    'rule_abc123',                                                   │
│    'Extreme Budget Crisis',                                         │
│    'Alert all stakeholders when budget...',                         │
│    'finops',                                                        │
│    8,                                                               │
│    true,                                                            │
│    '[{"fact":"cpi","operator":"<","value":0.70},...]',              │
│    '[{"type":"notify_agent","targetAgent":"pmo"},...]',             │
│    'user_admin',                                                    │
│    NOW(),                                                           │
│    NOW()                                                            │
│  );                                                                 │
│                                                                     │
│  Console Output:                                                    │
│  [RulesEngine] Reloading rules from database...                    │
│  [RulesEngine] Loaded 4 rules for finops                            │
│  [RulesEngine] Loaded rule: Extreme Budget Crisis                   │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8: RULES ENGINE LOADS NEW RULE                                │
│  server/lib/AgentCollaborationRulesEngine.ts line 137               │
│                                                                     │
│  async loadRules(): Promise<void> {                                 │
│    const result = await db.execute(sql`                             │
│      SELECT * FROM agent_collaboration_rules                        │
│      WHERE enabled = true                                           │
│      ORDER BY priority DESC                                         │
│    `);                                                              │
│                                                                     │
│    this.rules.clear();                                              │
│    this.engine = new Engine();                                      │
│                                                                     │
│    for (const row of result.rows as any[]) {                        │
│      const rule: CollaborationRule = {                              │
│        id: row.id,                                                  │
│        name: row.name,                                              │
│        sourceAgent: row.source_agent,                               │
│        conditions: JSON.parse(row.conditions),                      │
│        actions: JSON.parse(row.actions),                            │
│        priority: row.priority                                       │
│      };                                                             │
│                                                                     │
│      this.rules.set(rule.id, rule);                                 │
│                                                                     │
│      // Convert to json-rules-engine format                         │
│      const engineRule = this.convertToEngineRule(rule);             │
│      this.engine.addRule(engineRule);                               │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  convertToEngineRule(rule) converts to:                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ new Rule({                                                    │ │
│  │   conditions: {                                               │ │
│  │     all: [                                                    │ │
│  │       { fact: 'agentId', operator: 'equal', value: 'finops' },│ │
│  │       { fact: 'cpi', operator: 'lessThan', value: 0.70 },    │ │
│  │       { fact: 'budget_variance', operator: 'greaterThan',    │ │
│  │         value: 20 }                                           │ │
│  │     ]                                                         │ │
│  │   },                                                          │ │
│  │   event: {                                                    │ │
│  │     type: 'collaboration-trigger',                            │ │
│  │     params: {                                                 │ │
│  │       ruleId: 'rule_abc123',                                  │ │
│  │       ruleName: 'Extreme Budget Crisis',                      │ │
│  │       actions: [                                              │ │
│  │         { type: 'notify_agent', targetAgent: 'pmo' },        │ │
│  │         { type: 'notify_agent', targetAgent: 'governance' }, │ │
│  │         { type: 'create_task', parameters: {...} }           │ │
│  │       ]                                                       │ │
│  │     }                                                         │ │
│  │   },                                                          │ │
│  │   priority: 8                                                 │ │
│  │ })                                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Rule is now ACTIVE and ready to evaluate!                          │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 9: FINOPS AGENT DETECTS BUDGET OVERRUN                        │
│  server/agents/deep/DeepFinOpsAgent.ts                             │
│                                                                     │
│  // Agent runs continuous monitoring (every 3 minutes)              │
│  const analysis = await this.analyzeFinancials('project_alpha');    │
│                                                                     │
│  // Calculations:                                                   │
│  const earnedValue = 450000;                                        │
│  const actualCost = 680000;                                         │
│  const plannedValue = 500000;                                       │
│  const budgetAtCompletion = 1000000;                                │
│                                                                     │
│  const cpi = earnedValue / actualCost;  // 450k / 680k = 0.66      │
│  const spi = earnedValue / plannedValue; // 450k / 500k = 0.90     │
│                                                                     │
│  const budgetVariance = ((actualCost - plannedValue) / plannedValue) * 100;│
│  // (680k - 500k) / 500k * 100 = 36%                                │
│                                                                     │
│  console.log('[FinOps] 🚨 ALERT: Project Alpha in crisis!');       │
│  console.log('  CPI: 0.66 (CRITICAL - way over budget)');          │
│  console.log('  Budget Variance: +36% (EXTREME overrun)');         │
│                                                                     │
│  // Broadcast facts to Mem0 (shared fact ledger)                    │
│  await this.broadcastFact(                                          │
│    'project_alpha',   // entity                                     │
│    'cpi',             // attribute                                  │
│    0.66,              // value                                      │
│    0.95               // confidence                                 │
│  );                                                                 │
│                                                                     │
│  await this.broadcastFact(                                          │
│    'project_alpha',                                                 │
│    'budget_variance',                                               │
│    36,                                                              │
│    0.93                                                             │
│  );                                                                 │
│                                                                     │
│  Behind the scenes (DeepAgentBase.ts):                              │
│  protected async broadcastFact(...) {                               │
│    await this.mem0.writeFact({                                      │
│      entity: 'project_alpha',                                       │
│      attribute: 'cpi',                                              │
│      value: 0.66,                                                   │
│      sourceAgent: 'finops',                                         │
│      timestamp: new Date()                                          │
│    });                                                              │
│  }                                                                  │
│                                                                     │
│  Database INSERT (agent_facts table):                               │
│  INSERT INTO agent_facts (                                          │
│    entity, attribute, value, source_agent, confidence, created_at   │
│  ) VALUES (                                                         │
│    'project_alpha', 'cpi', 0.66, 'finops', 0.95, NOW()             │
│  ), (                                                               │
│    'project_alpha', 'budget_variance', 36, 'finops', 0.93, NOW()   │
│  );                                                                 │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 10: CONTINUOUS ORCHESTRATOR TRIGGERS RULE EVALUATION          │
│  server/agents/ContinuousOrchestrator.ts line 156                   │
│                                                                     │
│  async runOrchestrationCycle(): Promise<void> {                     │
│    // Get latest facts from Mem0                                    │
│    const projectFacts = await mem0Service.getEntityState(           │
│      'project_alpha'                                                │
│    );                                                               │
│                                                                     │
│    // projectFacts = {                                              │
│    //   cpi: 0.66,                                                  │
│    //   budget_variance: 36,                                        │
│    //   spi: 0.90,                                                  │
│    //   ... other facts                                             │
│    // }                                                             │
│                                                                     │
│    // Build facts object for rules engine                           │
│    const facts = {                                                  │
│      agentId: 'finops',                                             │
│      projectId: 'project_alpha',                                    │
│      cpi: 0.66,              // FROM MEM0!                          │
│      budget_variance: 36,    // FROM MEM0!                          │
│      spi: 0.90,                                                     │
│      timestamp: new Date()                                          │
│    };                                                               │
│                                                                     │
│    // Evaluate rules                                                │
│    const results = await rulesEngine.evaluateRules(facts);          │
│  }                                                                  │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 11: JSON-RULES-ENGINE EVALUATES                               │
│  server/lib/AgentCollaborationRulesEngine.ts line 224               │
│                                                                     │
│  async evaluateRules(facts: RuleFacts): Promise<RuleExecutionResult[]> {│
│    const startTime = Date.now();                                    │
│                                                                     │
│    // Run json-rules-engine                                         │
│    const { events } = await this.engine.run(facts);                 │
│                                                                     │
│    // json-rules-engine internally evaluates:                       │
│    // Rule: "Extreme Budget Crisis"                                 │
│    //   Condition 1: agentId == 'finops'           → TRUE ✓         │
│    //   Condition 2: cpi < 0.70                    → TRUE (0.66 < 0.70) ✓│
│    //   Condition 3: budget_variance > 20          → TRUE (36 > 20) ✓│
│    //                                                                │
│    //   ALL CONDITIONS MET → RULE FIRES!                            │
│                                                                     │
│    const results: RuleExecutionResult[] = [];                       │
│                                                                     │
│    for (const event of events) {                                    │
│      const { ruleId, ruleName, actions } = event.params;            │
│                                                                     │
│      console.log(`[RulesEngine] 🔥 Rule fired: ${ruleName}`);       │
│      console.log(`  Facts: cpi=${facts.cpi}, variance=${facts.budget_variance}`);│
│                                                                     │
│      // Execute actions                                             │
│      const executedActions = [];                                    │
│      for (const action of actions) {                                │
│        const executed = await this.executeAction(action, facts);    │
│        executedActions.push(executed);                              │
│      }                                                              │
│                                                                     │
│      results.push({                                                 │
│        ruleId,                                                      │
│        ruleName,                                                    │
│        triggered: true,                                             │
│        actions: executedActions,                                    │
│        executionTime: Date.now() - startTime                        │
│      });                                                            │
│    }                                                                │
│                                                                     │
│    return results;                                                  │
│  }                                                                  │
│                                                                     │
│  Console Output:                                                    │
│  [RulesEngine] 🔥 Rule fired: Extreme Budget Crisis                 │
│    Facts: cpi=0.66, variance=36                                     │
│  [RulesEngine] Executing action: notify_agent → pmo                 │
│  [RulesEngine] Executing action: notify_agent → governance          │
│  [RulesEngine] Executing action: create_task → cfo                  │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 12: ACTIONS EXECUTED                                          │
│  server/lib/AgentCollaborationRulesEngine.ts executeAction()        │
│                                                                     │
│  private async executeAction(action, facts) {                       │
│    switch (action.type) {                                           │
│      case 'notify_agent':                                           │
│        // Send A2A message via DeepAgentOrchestrator                │
│        await deepAgentOrchestrator.sendMessage({                    │
│          from: 'finops',                                            │
│          to: action.targetAgent,  // 'pmo'                          │
│          type: 'alert',                                             │
│          priority: 'critical',                                      │
│          payload: {                                                 │
│            rule: 'Extreme Budget Crisis',                           │
│            project: facts.projectId,                                │
│            cpi: facts.cpi,                                          │
│            budgetVariance: facts.budget_variance,                   │
│            message: `Project ${facts.projectId} is in extreme budget crisis!`│
│          }                                                          │
│        });                                                          │
│                                                                     │
│        console.log(`[RulesEngine] ✉️  A2A message sent: finops → pmo`);│
│        break;                                                       │
│                                                                     │
│      case 'create_task':                                            │
│        // Create task in database                                   │
│        await db.insert(tasks).values({                              │
│          title: `URGENT: Budget Crisis - ${facts.projectId}`,       │
│          description: `CPI: ${facts.cpi}, Variance: +${facts.budget_variance}%`,│
│          priority: action.parameters.priority,  // 'critical'       │
│          assignedTo: action.parameters.assignTo,  // 'cfo'          │
│          projectId: facts.projectId,                                │
│          createdBy: 'finops_agent',                                 │
│          dueDate: new Date(Date.now() + 24*60*60*1000)  // 24hrs    │
│        });                                                          │
│                                                                     │
│        console.log(`[RulesEngine] ✅ Task created for CFO`);        │
│        break;                                                       │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  // Log execution to history                                        │
│  await db.insert(ruleExecutionHistory).values({                     │
│    ruleId: 'rule_abc123',                                           │
│    ruleName: 'Extreme Budget Crisis',                               │
│    sourceAgent: 'finops',                                           │
│    triggered: true,                                                 │
│    factsSnapshot: JSON.stringify(facts),                            │
│    actionsExecuted: JSON.stringify([                                │
│      { type: 'notify_agent', targetAgent: 'pmo', success: true },  │
│      { type: 'notify_agent', targetAgent: 'governance', success: true },│
│      { type: 'create_task', assignedTo: 'cfo', success: true }     │
│    ]),                                                              │
│    triggeredAt: new Date(),                                         │
│    executionTimeMs: 42                                              │
│  });                                                                │
│                                                                     │
│  Console Output:                                                    │
│  [RulesEngine] ✉️  A2A message sent: finops → pmo                   │
│  [RulesEngine] ✉️  A2A message sent: finops → governance            │
│  [RulesEngine] ✅ Task created for CFO                              │
│  [RulesEngine] 📊 Logged to rule_execution_history                  │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 13: PMO AGENT RECEIVES A2A MESSAGE                            │
│  server/agents/deep/DeepPMOAgent.ts                                │
│                                                                     │
│  // PMO Agent's message handler                                     │
│  async handleMessage(message: A2AMessage): Promise<void> {          │
│    console.log(`[PMO] 📬 Received message from ${message.from}`);   │
│    console.log(`  Type: ${message.type}`);                          │
│    console.log(`  Priority: ${message.priority}`);                  │
│                                                                     │
│    if (message.type === 'alert' && message.priority === 'critical') {│
│      const { rule, project, cpi, budgetVariance } = message.payload;│
│                                                                     │
│      console.log(`[PMO] 🚨 CRITICAL ALERT: ${rule}`);               │
│      console.log(`  Project: ${project}`);                          │
│      console.log(`  CPI: ${cpi} (SEVERE overrun)`);                 │
│      console.log(`  Variance: +${budgetVariance}%`);                │
│                                                                     │
│      // PMO takes action: Adjust project health score               │
│      await this.broadcastFact(                                      │
│        project,                                                     │
│        'project_health_status',                                     │
│        'critical',                                                  │
│        0.95                                                         │
│      );                                                             │
│                                                                     │
│      // PMO also checks if we need to pause the project             │
│      await this.broadcastFact(                                      │
│        project,                                                     │
│        'recommend_pause',                                           │
│        true,                                                        │
│        0.85                                                         │
│      );                                                             │
│                                                                     │
│      // Learn about this critical situation (Letta long-term memory)│
│      await this.learn(`budget_crisis_${project}`, {                 │
│        type: 'budget_crisis',                                       │
│        cpi: cpi,                                                    │
│        budgetVariance: budgetVariance,                              │
│        alertedBy: message.from,                                     │
│        detectedAt: new Date(),                                      │
│        severity: 'critical',                                        │
│        actionsTaken: ['adjust_health_status', 'recommend_pause']    │
│      });                                                            │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  Console Output:                                                    │
│  [PMO] 📬 Received message from finops                              │
│    Type: alert                                                      │
│    Priority: critical                                               │
│  [PMO] 🚨 CRITICAL ALERT: Extreme Budget Crisis                     │
│    Project: project_alpha                                           │
│    CPI: 0.66 (SEVERE overrun)                                       │
│    Variance: +36%                                                   │
│  [PMO] Broadcasting project_health_status = critical                │
│  [PMO] Broadcasting recommend_pause = true                          │
│  [PMO] Learned about budget_crisis_project_alpha                    │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 14: GOVERNANCE AGENT ALSO OBSERVES VIA MEM0 SUBSCRIPTION      │
│  server/agents/deep/DeepGovernanceAgent.ts                         │
│                                                                     │
│  // Governance subscribed to FinOps facts                           │
│  getFactSubscriptions() {                                           │
│    return [                                                         │
│      { attribute: 'cpi', sourceAgent: 'finops' },                   │
│      { attribute: 'budget_variance', sourceAgent: 'finops' }        │
│    ];                                                               │
│  }                                                                  │
│                                                                     │
│  // Callback fires when FinOps writes cpi=0.66                      │
│  async onFactObserved(fact: AgentFact) {                            │
│    if (fact.attribute === 'cpi' && fact.value < 0.75) {            │
│      console.log('[Governance] 🚨 Budget overrun detected!');       │
│      console.log(`  Project: ${fact.entity}`);                      │
│      console.log(`  CPI: ${fact.value}`);                           │
│      console.log(`  Source: ${fact.sourceAgent}`);                  │
│                                                                     │
│      // Governance checks compliance policies                       │
│      const requiresApproval = fact.value < 0.70;                    │
│                                                                     │
│      if (requiresApproval) {                                        │
│        // Broadcast requirement for governance approval             │
│        await this.broadcastFact(                                    │
│          fact.entity,                                               │
│          'requires_governance_approval',                            │
│          true,                                                      │
│          1.0                                                        │
│        );                                                           │
│                                                                     │
│        // Create approval workflow                                  │
│        await this.createApprovalWorkflow({                          │
│          projectId: fact.entity,                                    │
│          reason: `Budget Crisis - CPI ${fact.value}`,               │
│          approvalType: 'continue_or_pause',                         │
│          approvers: ['cfo', 'ceo'],                                 │
│          dueBy: new Date(Date.now() + 48*60*60*1000)  // 48hrs      │
│        });                                                          │
│                                                                     │
│        console.log('[Governance] Created approval workflow');       │
│      }                                                              │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  Console Output:                                                    │
│  [Governance] 🚨 Budget overrun detected!                           │
│    Project: project_alpha                                           │
│    CPI: 0.66                                                        │
│    Source: finops                                                   │
│  [Governance] Requires governance approval (CPI < 0.70)             │
│  [Governance] Created approval workflow                             │
│  [Governance] Approval required from: CFO, CEO                      │
└────────────────────┬────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 15: NOTIFICATIONS SENT TO USERS                               │
│  Real-time WebSocket notifications via UnifiedNotificationContext   │
│                                                                     │
│  server/websocket.ts broadcastNotification()                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ broadcastNotification({                                       │ │
│  │   id: uuid(),                                                 │ │
│  │   type: 'agent_alert',                                        │ │
│  │   severity: 'critical',                                       │ │
│  │   sourceAgent: 'finops',                                      │
│  │   title: 'Extreme Budget Crisis',                             │ │
│  │   message: 'Project Alpha: CPI 0.66, Variance +36%',         │ │
│  │   projectId: 'project_alpha',                                 │ │
│  │   actions: [                                                  │ │
│  │     { label: 'View Project', url: '/project/project_alpha' },│ │
│  │     { label: 'View Financials', url: '/workspace/finops' }   │ │
│  │   ],                                                          │ │
│  │   metadata: {                                                 │ │
│  │     cpi: 0.66,                                                │ │
│  │     budgetVariance: 36,                                       │ │
│  │     rule: 'Extreme Budget Crisis'                             │ │
│  │   }                                                           │ │
│  │ });                                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  All connected clients receive WebSocket message:                   │
│  {                                                                  │
│    type: 'notification',                                            │
│    data: { /* notification object */ }                              │
│  }                                                                  │
│                                                                     │
│  Client receives (UnifiedNotificationContext):                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ useEffect(() => {                                             │ │
│  │   const handleWebSocketMessage = (event: MessageEvent) => {  │ │
│  │     const message = JSON.parse(event.data);                  │ │
│  │                                                               │ │
│  │     if (message.type === 'notification') {                   │ │
│  │       const notification = message.data;                     │ │
│  │                                                               │ │
│  │       // Add to notifications state                          │ │
│  │       setNotifications(prev => [notification, ...prev]);     │ │
│  │                                                               │ │
│  │       // Show toast                                          │ │
│  │       if (notification.severity === 'critical') {            │ │
│  │         toast.error(notification.title, {                    │ │
│  │           description: notification.message,                 │ │
│  │           duration: 10000  // 10 seconds                     │ │
│  │         });                                                  │ │
│  │                                                               │ │
│  │         // Play sound if enabled                             │ │
│  │         if (preferences.soundEnabled) {                      │ │
│  │           playNotificationSound();                           │ │
│  │         }                                                    │ │
│  │                                                               │ │
│  │         // Desktop notification                              │ │
│  │         if (preferences.desktopNotificationsEnabled) {       │ │
│  │           new Notification(notification.title, {             │ │
│  │             body: notification.message,                      │ │
│  │             icon: '/favicon.ico'                             │ │
│  │           });                                                │ │
│  │         }                                                    │ │
│  │       }                                                      │ │
│  │     }                                                        │ │
│  │   };                                                         │ │
│  │                                                               │ │
│  │   ws.addEventListener('message', handleWebSocketMessage);    │ │
│  │ }, []);                                                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  User sees in browser:                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  🔔  (notification bell pulsing red)                         │  │
│  │                                                              │  │
│  │  Toast notification (top-right):                             │  │
│  │  ┌───────────────────────────────────────────────────────┐  │  │
│  │  │ 🚨 Extreme Budget Crisis                              │  │  │
│  │  │ Project Alpha: CPI 0.66, Variance +36%               │  │  │
│  │  │                                                       │  │  │
│  │  │ [View Project]  [View Financials]            [Dismiss]│  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Desktop notification (if enabled):                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Enterprise PMO                                              │  │
│  │  🚨 Extreme Budget Crisis                                    │  │
│  │  Project Alpha: CPI 0.66, Variance +36%                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Sound plays: notification.mp3 at configured volume                 │
└─────────────────────────────────────────────────────────────────────┘
```

### FinOps Rule Editor Summary

**Complete Data Flow:**
```
User creates rule in UI
  ↓
Saved to database (agent_collaboration_rules)
  ↓
Rules Engine loads rule (json-rules-engine)
  ↓
FinOps Agent detects overrun
  ↓
Writes facts to Mem0 (agent_facts)
  ↓
Orchestrator triggers evaluation
  ↓
Rules Engine evaluates facts
  ↓
Rule fires (all conditions met)
  ↓
Actions executed (A2A messages, tasks)
  ↓
PMO receives message, adjusts health
  ↓
Governance observes via subscription
  ↓
Notifications sent to users (WebSocket)
  ↓
Users see toast + desktop notification
  ↓
PMO/Governance agents learn via Letta
```

**Key Integration Points:**
1. **Custom Attributes API** → Provides attributes for dropdown
2. **Rules API** → CRUD operations for rules
3. **Mem0** → Shared fact ledger for agent observations
4. **json-rules-engine** → Evaluates conditions
5. **A2A Message Bus** → Cross-agent communication
6. **Letta** → Long-term memory storage
7. **WebSocket** → Real-time notifications to users

---

## 2. TMO RULE EDITOR - COMPLETE FLOW

**Purpose:** Configure schedule monitoring, milestone tracking, timeline risk detection

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  TMO RULE EDITOR SPECIALIZATION                                     │
│  /admin/rules/tmo                                                   │
│                                                                     │
│  Unique TMO Attributes:                                             │
│  ├─ schedule_variance (days ahead/behind)                           │
│  ├─ spi (Schedule Performance Index)                                │
│  ├─ days_behind (number of days behind schedule)                    │
│  ├─ milestone_at_risk (boolean)                                     │
│  ├─ critical_path_delay (days)                                      │
│  └─ timeline_risk_zone (green/yellow/red)                           │
│                                                                     │
│  Special UI Features:                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Timeline Risk Zones Visualization                             │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ Green Zone:  Days Behind < 5   (On Track)               │  │ │
│  │  │ Yellow Zone: Days Behind 5-15  (At Risk)                │  │ │
│  │  │ Red Zone:    Days Behind > 15  (Critical)               │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  SPI Reference:                                                  │ │
│  │  • SPI > 1.0 = Ahead of schedule                                │ │
│  │  • SPI = 1.0 = On schedule                                      │ │
│  │  • SPI < 1.0 = Behind schedule                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Example TMO Rule Creation

```
User creates rule: "Critical Milestone At Risk"

Conditions:
  - milestone_at_risk == true
  - days_behind > 10
  - timeline_risk_zone == "red"

Actions:
  - notify_agent(pmo)
  - notify_agent(risk)
  - escalate(governance)
  - create_task(priority: "high", assignTo: "project_manager")

Flow:
  TMO Agent monitors schedule
    ↓
  Detects milestone slippage
    ↓
  Broadcasts: days_behind=12, milestone_at_risk=true
    ↓
  Rule fires (all conditions met)
    ↓
  PMO and Risk agents alerted
    ↓
  Governance escalation created
    ↓
  Task assigned to PM
    ↓
  TMO learns pattern via Letta: "When days_behind > 10, usually requires PM intervention"
```

---

## 3. RISK RULE EDITOR - COMPLETE FLOW

**Purpose:** Configure risk monitoring, probability×impact tracking, risk heat map zones

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  RISK RULE EDITOR SPECIALIZATION                                    │
│  /admin/rules/risk                                                  │
│                                                                     │
│  Unique Risk Attributes:                                            │
│  ├─ risk_score (calculated: probability × impact)                   │
│  ├─ probability (1-5 scale)                                         │
│  ├─ impact (1-5 scale)                                              │
│  ├─ open_issues_count (number)                                      │
│  ├─ risk_level (low/medium/high/critical)                           │
│  ├─ mitigation_status (none/planned/in_progress/completed)          │
│  └─ days_since_last_review (staleness indicator)                    │
│                                                                     │
│  Special UI Features:                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  5×5 Risk Heat Map                                             │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │    Impact →                                              │  │ │
│  │  │ P  1    2    3    4    5                                 │  │ │
│  │  │ r ┌────┬────┬────┬────┬────┐                             │  │ │
│  │  │ o │ L  │ L  │ M  │ M  │ H  │ 5                           │  │ │
│  │  │ b ├────┼────┼────┼────┼────┤                             │  │ │
│  │  │ a │ L  │ L  │ M  │ H  │ H  │ 4                           │  │ │
│  │  │ b ├────┼────┼────┼────┼────┤                             │  │ │
│  │  │ i │ L  │ M  │ M  │ H  │ C  │ 3                           │  │ │
│  │  │ l ├────┼────┼────┼────┼────┤                             │  │ │
│  │  │ i │ L  │ M  │ H  │ H  │ C  │ 2                           │  │ │
│  │  │ t ├────┼────┼────┼────┼────┤                             │  │ │
│  │  │ y │ L  │ M  │ H  │ C  │ C  │ 1                           │  │ │
│  │  │   └────┴────┴────┴────┴────┘                             │  │ │
│  │  │   L=Low, M=Medium, H=High, C=Critical                    │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  Risk Score Calculation:                                        │ │
│  │  risk_score = probability × impact                              │ │
│  │  • 1-6:  Low Risk                                               │ │
│  │  • 7-12: Medium Risk                                            │ │
│  │  • 13-18: High Risk                                             │ │
│  │  • 19-25: Critical Risk                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Example Risk Rule Creation

```
User creates rule: "High Risk with Poor Mitigation"

Conditions:
  - risk_score >= 15
  - mitigation_status == "none" OR mitigation_status == "planned"
  - days_since_last_review > 7

Actions:
  - notify_agent(pmo)
  - notify_agent(finops)  // High risk impacts budget
  - escalate(governance)
  - create_task(priority: "critical", assignTo: "risk_manager")

Flow:
  Risk Agent monitors risks
    ↓
  Detects high-probability, high-impact risk
    ↓
  Calculates: probability=4, impact=5, risk_score=20
    ↓
  Checks mitigation_status="none"
    ↓
  Broadcasts facts to Mem0
    ↓
  Rule fires (all conditions met)
    ↓
  PMO alerted (project health impacted)
    ↓
  FinOps alerted (potential cost impact)
    ↓
  Governance escalation (requires executive attention)
    ↓
  Risk learns via Letta: "High-impact risks without mitigation usually escalate"
```

---

## 4. VRO RULE EDITOR - COMPLETE FLOW

**VRO Agent (Value Realization Office)** monitors business value, ROI, benefits realization, and strategic alignment.

### Detailed Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Opens VRO Rule Editor                                    │
│ Location: /admin/rules/vro (VRORules.tsx)                             │
│                                                                        │
│ Component loads and fetches:                                          │
│   - Existing VRO rules from /api/rules/agent/VROAgent                │
│   - Custom attributes from /api/custom-attributes?visibleTo=VROAgent │
│                                                                        │
│ Available VRO-specific attributes:                                    │
│   - roi_percentage          (number)                                  │
│   - benefits_realized       (currency)                                │
│   - strategic_alignment     (enum: high/medium/low)                   │
│   - value_realization_rate  (percentage)                              │
│   - business_case_variance  (percentage)                              │
│   - stakeholder_satisfaction (score 1-10)                             │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Creates New Rule                                         │
│                                                                        │
│ Example: "Low Value Realization Alert"                                │
│                                                                        │
│ Conditions (AND logic):                                                │
│   ├─ value_realization_rate < 60                                      │
│   ├─ months_since_launch > 3                                          │
│   └─ benefits_realized < expected_benefits * 0.5                      │
│                                                                        │
│ Actions:                                                               │
│   ├─ notify_agent: PMOAgent (project may need review)                │
│   ├─ notify_agent: ExecutiveAgent (strategic concerns)                │
│   ├─ create_task: "Value Realization Review" (priority: high)         │
│   └─ escalate: governance (benefits not materializing)                │
│                                                                        │
│ Priority: 7 (High - value delivery is critical)                       │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Save Rule to Database                                         │
│                                                                        │
│ POST /api/rules                                                        │
│   Body: {                                                              │
│     "agentType": "VROAgent",                                           │
│     "name": "Low Value Realization Alert",                            │
│     "conditions": [                                                    │
│       { "fact": "value_realization_rate", "operator": "<", "value": 60 }, │
│       { "fact": "months_since_launch", "operator": ">", "value": 3 },    │
│       { "fact": "benefits_realized", "operator": "<",                    │
│         "value": { "fact": "expected_benefits", "operator": "*", "value": 0.5 }} │
│     ],                                                                 │
│     "actions": [                                                       │
│       { "type": "notify_agent", "params": { "agent": "PMOAgent" } },  │
│       { "type": "notify_agent", "params": { "agent": "ExecutiveAgent" } }, │
│       { "type": "create_task", "params": { "title": "Value Realization Review", "priority": "high" } }, │
│       { "type": "escalate", "params": { "to": "governance" } }        │
│     ],                                                                 │
│     "priority": 7,                                                     │
│     "enabled": true                                                    │
│   }                                                                    │
│                                                                        │
│ Stored in: agent_collaboration_rules table                            │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Rules Engine Loads Rule                                       │
│                                                                        │
│ AgentCollaborationRulesEngine.loadRules()                             │
│   ↓                                                                    │
│ Queries agent_collaboration_rules WHERE enabled = true                │
│   ↓                                                                    │
│ Adds VRO rule to json-rules-engine instance                           │
│   ↓                                                                    │
│ Rule now active and monitoring facts from Mem0                        │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: VRO Agent Monitors Value Metrics                              │
│                                                                        │
│ Continuous Agent Execution (server/agents/VROAgent.ts)                │
│                                                                        │
│ VRO Agent tracks:                                                      │
│   ├─ Benefits realization (planned vs actual)                         │
│   ├─ ROI calculations (investment / returns)                          │
│   ├─ Strategic alignment scores                                       │
│   ├─ Value realization rates                                          │
│   └─ Business case variance                                           │
│                                                                        │
│ Agent detects:                                                         │
│   Project "Mobile App Redesign":                                      │
│     - Launched 6 months ago                                           │
│     - Expected benefits: $500K/year                                   │
│     - Actual benefits: $180K/year                                     │
│     - Value realization rate: 36%                                     │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 6: VRO Agent Writes Facts to Mem0                                │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "project-mobile-app-redesign",                              │
│   attribute: "value_realization_rate",                                │
│   value: 36,                                                           │
│   sourceAgent: "VROAgent",                                             │
│   confidence: 0.95                                                     │
│ });                                                                    │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "project-mobile-app-redesign",                              │
│   attribute: "months_since_launch",                                   │
│   value: 6,                                                            │
│   sourceAgent: "VROAgent",                                             │
│   confidence: 1.0                                                      │
│ });                                                                    │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "project-mobile-app-redesign",                              │
│   attribute: "benefits_realized",                                     │
│   value: 180000,                                                       │
│   sourceAgent: "VROAgent",                                             │
│   confidence: 0.9                                                      │
│ });                                                                    │
│                                                                        │
│ Facts stored in: agent_facts table                                    │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Rules Engine Evaluates Conditions                             │
│                                                                        │
│ agentCollaborationRulesEngine.evaluateFacts({                         │
│   "value_realization_rate": 36,         // < 60 ✓                     │
│   "months_since_launch": 6,             // > 3 ✓                      │
│   "benefits_realized": 180000,          // 180K vs expected 250K ✓    │
│   "expected_benefits": 500000                                          │
│ });                                                                    │
│                                                                        │
│ Result: ALL CONDITIONS MET → RULE FIRES                               │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 8: Execute Rule Actions                                          │
│                                                                        │
│ 1. notify_agent(PMOAgent)                                             │
│    → DeepAgentOrchestrator.sendA2AMessage({                           │
│        to: "PMOAgent",                                                 │
│        from: "VROAgent",                                               │
│        type: "rule_triggered",                                         │
│        payload: {                                                      │
│          projectId: "mobile-app-redesign",                            │
│          rule: "Low Value Realization Alert",                         │
│          metrics: { value_realization_rate: 36% }                     │
│        }                                                               │
│      });                                                               │
│                                                                        │
│ 2. notify_agent(ExecutiveAgent)                                       │
│    → A2A message sent to Executive Dashboard                          │
│                                                                        │
│ 3. create_task("Value Realization Review", priority: "high")          │
│    → INSERT INTO tasks (title, priority, type, assignee)              │
│                                                                        │
│ 4. escalate(governance)                                                │
│    → GovernanceAgent receives escalation notice                       │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 9: Other Agents Observe and React                                │
│                                                                        │
│ PMO Agent:                                                             │
│   - Receives A2A message about low value realization                  │
│   - Reviews project health metrics                                    │
│   - May recommend corrective actions                                  │
│                                                                        │
│ Executive Agent:                                                       │
│   - Strategic concern flagged                                         │
│   - Adds to executive briefing                                        │
│   - May trigger voice briefing generation                             │
│                                                                        │
│ Governance Agent:                                                      │
│   - Receives escalation                                               │
│   - Checks if approval/review required                                │
│   - May initiate stage gate review                                    │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 10: Long-Term Learning (Letta)                                   │
│                                                                        │
│ VRO Agent stores in Letta archival memory:                            │
│                                                                        │
│ lettaAgentMemory.storeMemory({                                        │
│   agentId: "VROAgent",                                                 │
│   memoryKey: "value-realization-pattern",                             │
│   content: "Mobile app redesigns with <60% value realization after 6 months usually indicate adoption challenges or misaligned business case assumptions. Strong correlation with user training gaps.", │
│   embedding: [0.234, -0.891, ...],  // 1536-dim vector               │
│ });                                                                    │
│                                                                        │
│ Future benefit: When similar low value realization detected, VRO      │
│ Agent can recall this pattern and proactively suggest root cause      │
│ investigation and user training programs.                             │
└────────────────────────────────────────────────────────────────────────┘
```

### VRO Rule Editor Summary

**Key VRO Metrics Monitored:**
- ROI percentage
- Benefits realization ($ value)
- Value realization rate (% of expected)
- Strategic alignment scores
- Business case variance
- Stakeholder satisfaction

**Common VRO Rule Patterns:**
1. **Low ROI Alert**: `roi_percentage < threshold` → Notify PMO and FinOps
2. **Benefits Not Realized**: `benefits_realized < expected * 0.7` → Escalate
3. **Strategic Misalignment**: `strategic_alignment == "low"` → Executive alert
4. **Value Delivery Delay**: `value_realization_rate < target AND months_since_launch > 3` → Create review task

---

## 5. PMO RULE EDITOR - COMPLETE FLOW

**PMO Agent (Project Management Office)** monitors portfolio health, stage gates, resource allocation, and multi-project dependencies.

### Detailed Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Opens PMO Rule Editor                                    │
│ Location: /admin/rules/pmo (PMORules.tsx)                             │
│                                                                        │
│ Available PMO-specific attributes:                                    │
│   - portfolio_health_score     (score 1-100)                          │
│   - projects_at_risk_count     (number)                               │
│   - resource_utilization       (percentage)                           │
│   - stage_gate_pending         (number)                               │
│   - cross_project_dependencies (number)                               │
│   - portfolio_velocity         (story points/sprint)                  │
│   - strategic_initiative_count (number)                               │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Creates Portfolio Health Rule                            │
│                                                                        │
│ Example: "Portfolio Health Critical"                                  │
│                                                                        │
│ Conditions:                                                            │
│   ├─ portfolio_health_score < 60                                      │
│   ├─ projects_at_risk_count > 5                                       │
│   └─ resource_utilization > 90  // Overloaded teams                   │
│                                                                        │
│ Actions:                                                               │
│   ├─ notify_agent: ExecutiveAgent                                     │
│   ├─ notify_agent: VROAgent (value realization at risk)               │
│   ├─ escalate: governance (portfolio review needed)                   │
│   └─ create_briefing: "Portfolio Health Crisis"                       │
│                                                                        │
│ Priority: 9 (Critical - portfolio-wide impact)                        │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PMO Agent Monitors Portfolio                                  │
│                                                                        │
│ Continuous monitoring (server/agents/DeepPMOAgent.ts)                 │
│                                                                        │
│ PMO Agent calculates:                                                  │
│   - Aggregates health from all active projects                        │
│   - Counts projects with health_score < 70                            │
│   - Monitors resource allocation across portfolio                     │
│   - Tracks stage gate approvals pending                               │
│                                                                        │
│ Detects critical state:                                                │
│   Portfolio: "Q1 2026 Strategic Initiatives"                          │
│     - 15 active projects                                              │
│     - 7 projects at risk (health < 70)                                │
│     - Resource utilization: 95%                                       │
│     - Portfolio health score: 52                                      │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: PMO Facts Written to Mem0                                     │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "portfolio-q1-2026",                                        │
│   attribute: "portfolio_health_score",                                │
│   value: 52,                                                           │
│   sourceAgent: "PMOAgent"                                              │
│ });                                                                    │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "portfolio-q1-2026",                                        │
│   attribute: "projects_at_risk_count",                                │
│   value: 7,                                                            │
│   sourceAgent: "PMOAgent"                                              │
│ });                                                                    │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "portfolio-q1-2026",                                        │
│   attribute: "resource_utilization",                                  │
│   value: 95,                                                           │
│   sourceAgent: "PMOAgent"                                              │
│ });                                                                    │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Rule Fires + Cross-Agent Collaboration                        │
│                                                                        │
│ Rule engine evaluates: ALL CONDITIONS MET                             │
│                                                                        │
│ Actions executed:                                                      │
│                                                                        │
│ 1. Executive Agent Notified                                           │
│    → Dashboard alert: "Portfolio health critical"                     │
│    → May trigger executive meeting                                    │
│                                                                        │
│ 2. VRO Agent Notified                                                  │
│    → Assesses value realization impact                                │
│    → May recommend portfolio reprioritization                         │
│                                                                        │
│ 3. Governance Escalation                                               │
│    → Triggers emergency portfolio review board                        │
│    → Stage gate holds may be applied                                  │
│                                                                        │
│ 4. Voice Briefing Generated                                           │
│    → Podcast-style summary of portfolio crisis                        │
│    → Sent to executives for rapid situational awareness               │
└────────────────────────────────────────────────────────────────────────┘
```

### PMO Rule Editor Summary

**Key PMO Metrics:**
- Portfolio health score (aggregate)
- Projects at risk count
- Resource utilization percentage
- Stage gate pending approvals
- Cross-project dependencies
- Strategic initiative alignment

**Common PMO Rule Patterns:**
1. **Portfolio Health Alert**: Aggregate health drops below threshold
2. **Resource Overload**: Utilization >90% for extended period
3. **Stage Gate Bottleneck**: Too many approvals pending
4. **Dependency Risk**: Critical path dependencies at risk

---

## 6. OCM RULE EDITOR - COMPLETE FLOW

**OCM Agent (Organizational Change Management)** monitors change readiness, resistance, ADKAR scores, and stakeholder sentiment.

### Detailed Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Opens OCM Rule Editor                                    │
│ Location: /admin/rules/ocm (OCMRules.tsx)                             │
│                                                                        │
│ Available OCM-specific attributes:                                    │
│   - adkar_awareness_score      (score 1-5)                            │
│   - adkar_desire_score         (score 1-5)                            │
│   - adkar_knowledge_score      (score 1-5)                            │
│   - adkar_ability_score        (score 1-5)                            │
│   - adkar_reinforcement_score  (score 1-5)                            │
│   - resistance_level           (enum: none/low/medium/high/critical)  │
│   - stakeholder_sentiment      (score -10 to +10)                     │
│   - training_completion_rate   (percentage)                           │
│   - communication_frequency    (messages/week)                        │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Creates Change Resistance Rule                           │
│                                                                        │
│ Example: "High Change Resistance Detected"                            │
│                                                                        │
│ Conditions:                                                            │
│   ├─ resistance_level >= "high"                                       │
│   ├─ adkar_desire_score < 2                                           │
│   ├─ stakeholder_sentiment < -3                                       │
│   └─ training_completion_rate < 40                                    │
│                                                                        │
│ Actions:                                                               │
│   ├─ notify_agent: PMOAgent (change impacts delivery)                │
│   ├─ create_task: "Stakeholder Engagement Plan" (urgent)              │
│   ├─ escalate: executive (change initiative at risk)                  │
│   └─ recommend_intervention: "increase_communication_frequency"       │
│                                                                        │
│ Priority: 8 (High - change resistance can derail projects)            │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: OCM Agent Monitors Change Readiness                           │
│                                                                        │
│ Continuous monitoring (server/agents/deep/DeepOCMAgent.ts)            │
│                                                                        │
│ OCM Agent tracks:                                                      │
│   - ADKAR assessments from surveys                                    │
│   - Sentiment analysis from communications                            │
│   - Training completion metrics                                       │
│   - Change champion effectiveness                                     │
│                                                                        │
│ Detects high resistance:                                               │
│   Project: "ERP System Migration"                                     │
│     - 800 affected users                                              │
│     - ADKAR Desire score: 1.8 (low willingness to change)            │
│     - Resistance level: "high"                                        │
│     - Stakeholder sentiment: -5 (negative)                            │
│     - Training completion: 32%                                        │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: OCM Facts Written to Mem0                                     │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "project-erp-migration",                                    │
│   attribute: "resistance_level",                                      │
│   value: "high",                                                       │
│   sourceAgent: "OCMAgent"                                              │
│ });                                                                    │
│                                                                        │
│ (Additional facts for ADKAR scores, sentiment, training)              │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Rule Fires + Intervention Triggered                           │
│                                                                        │
│ Rule engine: ALL CONDITIONS MET → HIGH RESISTANCE DETECTED            │
│                                                                        │
│ Cross-agent actions:                                                   │
│                                                                        │
│ 1. PMO Agent alerted                                                   │
│    → Adjusts project timeline (change readiness delay)                │
│    → Considers adding change management resources                     │
│                                                                        │
│ 2. Task created: "Stakeholder Engagement Plan"                        │
│    → Assigned to change management team                               │
│    → Priority: Urgent                                                 │
│    → Includes: town halls, Q&A sessions, executive sponsorship        │
│                                                                        │
│ 3. Executive escalation                                                │
│    → Change initiative at risk notification                           │
│    → May require executive sponsorship reinforcement                  │
│                                                                        │
│ 4. Intervention recommended                                            │
│    → Increase communication frequency from 1x/week to 3x/week         │
│    → Launch "change champion" program                                 │
│    → Provide additional training resources                            │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Long-Term Learning (Letta)                                    │
│                                                                        │
│ OCM Agent stores pattern:                                              │
│                                                                        │
│ "ERP migrations with <40% training completion and low ADKAR Desire     │
│  scores typically experience 3-6 month delays. Intervention success    │
│  rate highest when executive sponsorship increased AND communication   │
│  frequency tripled within 2 weeks of resistance detection."           │
│                                                                        │
│ Future benefit: Proactive intervention recommendations for similar     │
│ change initiatives before resistance escalates.                       │
└────────────────────────────────────────────────────────────────────────┘
```

### OCM Rule Editor Summary

**Key OCM Metrics:**
- ADKAR model scores (5 dimensions)
- Change resistance levels
- Stakeholder sentiment analysis
- Training completion rates
- Communication effectiveness

**Common OCM Rule Patterns:**
1. **High Resistance Alert**: Multiple ADKAR scores low + negative sentiment
2. **Training Gap**: Low completion rates approaching go-live date
3. **Communication Breakdown**: Low engagement + increasing resistance
4. **Change Champion Effectiveness**: Tracking champion impact on adoption

---

## 7. GOVERNANCE RULE EDITOR - COMPLETE FLOW

**Governance Agent** monitors compliance, approvals, policy adherence, audit requirements, and regulatory risk.

### Detailed Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Opens Governance Rule Editor                             │
│ Location: /admin/rules/governance (GovernanceRules.tsx)               │
│                                                                        │
│ Available Governance-specific attributes:                             │
│   - compliance_score           (percentage)                           │
│   - pending_approvals_count    (number)                               │
│   - policy_violations_count    (number)                               │
│   - audit_findings_open        (number)                               │
│   - regulatory_risk_level      (enum: low/medium/high/critical)       │
│   - sla_breach_count           (number)                               │
│   - security_findings_count    (number)                               │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Creates Compliance Rule                                  │
│                                                                        │
│ Example: "Critical Compliance Violation"                              │
│                                                                        │
│ Conditions:                                                            │
│   ├─ policy_violations_count > 0                                      │
│   ├─ regulatory_risk_level == "critical"                              │
│   └─ days_since_violation < 30  // Recent violation                   │
│                                                                        │
│ Actions:                                                               │
│   ├─ escalate: executive (immediate attention required)               │
│   ├─ escalate: legal (regulatory exposure)                            │
│   ├─ notify_agent: PMOAgent (project may need halt)                   │
│   ├─ create_audit_trail: "compliance_violation"                       │
│   └─ send_notification: compliance_team (urgent)                      │
│                                                                        │
│ Priority: 10 (Critical - regulatory/legal risk)                       │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Governance Agent Monitors Compliance                          │
│                                                                        │
│ Continuous monitoring (server/agents/GovernanceAgent.ts)              │
│                                                                        │
│ Governance Agent checks:                                               │
│   - Policy-as-Code extracted rules (from POLICY_EXTRACTION)           │
│   - Custom compliance attributes                                      │
│   - Approval workflows and SLA adherence                              │
│   - Audit findings and remediation status                             │
│                                                                        │
│ Detects critical violation:                                            │
│   Project: "Healthcare Data Platform"                                 │
│     - Policy: HIPAA Encryption Requirements                           │
│     - Violation: Unencrypted PII found in dev environment            │
│     - Risk level: CRITICAL                                            │
│     - Violation date: 3 days ago                                      │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Governance Facts + Rule Fires                                 │
│                                                                        │
│ Facts written to Mem0:                                                 │
│   - policy_violations_count: 1                                        │
│   - regulatory_risk_level: "critical"                                 │
│   - days_since_violation: 3                                           │
│                                                                        │
│ Rule fires immediately (Priority 10 = highest)                        │
│                                                                        │
│ Actions executed:                                                      │
│                                                                        │
│ 1. Executive escalation                                                │
│    → CISO notified immediately                                        │
│    → CEO dashboard alert (critical regulatory risk)                   │
│                                                                        │
│ 2. Legal team notified                                                 │
│    → Regulatory exposure documented                                   │
│    → Incident response protocol activated                             │
│                                                                        │
│ 3. PMO Agent alerted                                                   │
│    → Project deployment HALTED                                        │
│    → Emergency remediation plan required                              │
│                                                                        │
│ 4. Audit trail created                                                 │
│    → Immutable record in audit log                                    │
│    → Timestamped evidence for regulators                              │
│                                                                        │
│ 5. Compliance team notification (Slack/Teams/Email)                   │
│    → Urgent remediation required within 24 hours                      │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Integration with Policy-as-Code                               │
│                                                                        │
│ Governance rules leverage policy-extracted attributes:                │
│                                                                        │
│ Example: HIPAA policy document was ingested via Policy-as-Code        │
│   ↓                                                                    │
│ LLM extracted custom attributes:                                       │
│   - hipaa_encryption_required: true                                   │
│   - phi_data_retention_days: 2555                                     │
│   - breach_notification_hours: 72                                     │
│   - audit_log_retention_years: 7                                      │
│   ↓                                                                    │
│ These attributes are visible to Governance Agent via visibleTo array  │
│   ↓                                                                    │
│ Governance rules can now reference:                                    │
│   IF project handles PHI data                                         │
│   AND hipaa_encryption_required == true                               │
│   AND encryption_enabled == false                                     │
│   THEN → CRITICAL VIOLATION                                           │
│                                                                        │
│ This creates a CLOSED LOOP from policy document → extracted rules     │
│ → agent monitoring → violation detection → enforcement                │
└────────────────────────────────────────────────────────────────────────┘
```

### Governance Rule Editor Summary

**Key Governance Metrics:**
- Compliance score (aggregate)
- Policy violations count
- Pending approvals (SLA tracking)
- Audit findings open
- Regulatory risk level
- Security findings

**Common Governance Rule Patterns:**
1. **Compliance Violation**: Policy breach detected → Immediate escalation
2. **Approval Bottleneck**: Approvals pending >SLA → Notify approvers
3. **Audit Finding Overdue**: Open findings >90 days → Escalate
4. **Security Risk**: Critical vulnerabilities unresolved → Halt deployment

---

## MEMORY ARCHITECTURE - COMPLETE FLOW

**Mem0 + Letta Integration** provides short-term fact sharing (Mem0) and long-term learning (Letta) across all agents.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      AGENT MEMORY SYSTEM                                 │
│                                                                          │
│  ┌────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  MEM0 (Shared Fact Ledger)     │  │  LETTA (Long-Term Memory)    │  │
│  │                                 │  │                              │  │
│  │  - agent_facts table            │  │  - agent_core_memory         │  │
│  │  - Real-time observations       │  │  - agent_archival_memory     │  │
│  │  - Cross-agent visibility       │  │  - Vector embeddings         │  │
│  │  - Confidence scores            │  │  - Pattern recognition       │  │
│  │  - Supersedes old facts         │  │  - Retrieval-augmented       │  │
│  └────────────────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Complete Memory Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Agent Detects Observation                                     │
│                                                                        │
│ Example: FinOps Agent detects budget overrun                          │
│                                                                        │
│ Project "Cloud Migration":                                             │
│   - Budget: $500K                                                      │
│   - Spent: $550K                                                       │
│   - Burn rate: $50K/month                                             │
│   - Months remaining: 2                                               │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Write Fact to Mem0 Shared Ledger                              │
│                                                                        │
│ mem0Service.addFact({                                                 │
│   entity: "project-cloud-migration",                                  │
│   attribute: "budget_status",                                         │
│   value: "overrun",                                                    │
│   sourceAgent: "FinOpsAgent",                                          │
│   confidence: 1.0,                                                     │
│   metadata: {                                                          │
│     budgeted: 500000,                                                  │
│     spent: 550000,                                                     │
│     variance: 50000,                                                   │
│     burn_rate: 50000                                                   │
│   }                                                                    │
│ });                                                                    │
│                                                                        │
│ Stored in: agent_facts table                                          │
│   - id: auto-generated                                                │
│   - entity: "project-cloud-migration"                                 │
│   - attribute: "budget_status"                                        │
│   - value: JSON { "status": "overrun", ... }                          │
│   - source_agent: "FinOpsAgent"                                        │
│   - confidence: 1.0                                                    │
│   - created_at: 2026-01-25 23:45:00                                   │
│   - supersedes: null (first observation)                              │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Other Agents Subscribe and Observe                            │
│                                                                        │
│ Agent subscriptions stored in: agent_fact_subscriptions               │
│                                                                        │
│ Example subscriptions:                                                 │
│   - PMOAgent subscribes to: "budget_status" (from any agent)          │
│   - VROAgent subscribes to: "budget_status" (impacts value)           │
│   - RiskAgent subscribes to: "*" (observes all facts)                 │
│                                                                        │
│ When FinOps writes "budget_status" fact:                              │
│   ↓                                                                    │
│ mem0Service.notifySubscribers({                                       │
│   entity: "project-cloud-migration",                                  │
│   attribute: "budget_status",                                         │
│   subscribers: ["PMOAgent", "VROAgent", "RiskAgent"]                  │
│ });                                                                    │
│   ↓                                                                    │
│ Each subscribed agent receives A2A message with fact details          │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Agents React to Observed Facts                                │
│                                                                        │
│ PMO Agent:                                                             │
│   - Adjusts project health score (financial risk detected)            │
│   - May trigger schedule review                                       │
│   - Writes own facts: project_health = "at_risk"                      │
│                                                                        │
│ VRO Agent:                                                             │
│   - Recalculates ROI (increased investment, same returns)             │
│   - Writes fact: roi_percentage = 8% (down from 15%)                  │
│                                                                        │
│ Risk Agent:                                                            │
│   - Increases financial risk score                                    │
│   - Writes fact: risk_score = 18 (high)                               │
│                                                                        │
│ This creates a CASCADE of related facts across agents                 │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Rules Engine Evaluates All Facts                              │
│                                                                        │
│ AgentCollaborationRulesEngine queries Mem0:                           │
│                                                                        │
│ Facts now available for rule evaluation:                              │
│   - budget_status: "overrun" (FinOps)                                 │
│   - project_health: "at_risk" (PMO)                                   │
│   - roi_percentage: 8 (VRO)                                           │
│   - risk_score: 18 (Risk)                                             │
│                                                                        │
│ Multiple rules may fire:                                               │
│   1. FinOps rule: "Budget Overrun Alert"                              │
│   2. PMO rule: "Project Health Degradation"                           │
│   3. VRO rule: "ROI Below Threshold"                                  │
│   4. Risk rule: "High Risk with Financial Impact"                     │
│                                                                        │
│ All rules execute their actions (notifications, escalations, tasks)   │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Long-Term Learning with Letta                                 │
│                                                                        │
│ FinOps Agent stores pattern in Letta archival memory:                 │
│                                                                        │
│ lettaAgentMemory.storeMemory({                                        │
│   agentId: "FinOpsAgent",                                              │
│   memoryKey: "cloud-migration-budget-overrun",                        │
│   content: "Cloud migrations consistently overrun budget by 10-15% in months 8-10. Primary drivers: unexpected egress costs and data transfer volumes. Projects with <3 month runway at 90% budget utilization should trigger early warning.", │
│   embedding: generateEmbedding(content),  // 1536-dim vector          │
│ });                                                                    │
│                                                                        │
│ PMO Agent stores related pattern:                                      │
│                                                                        │
│ lettaAgentMemory.storeMemory({                                        │
│   agentId: "PMOAgent",                                                 │
│   memoryKey: "budget-impact-on-health",                               │
│   content: "Budget overruns >10% with <3 months remaining correlate with scope reduction or timeline extension. 80% of projects in this state require change control board intervention.", │
│   embedding: generateEmbedding(content)                               │
│ });                                                                    │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Future Pattern Retrieval (RAG)                                │
│                                                                        │
│ 3 months later: New cloud migration project "Azure Modernization"     │
│                                                                        │
│ FinOps Agent analyzes project:                                        │
│   - Month 8 of 12                                                     │
│   - Budget: $800K                                                      │
│   - Spent: $720K (90% utilized)                                       │
│   - Months remaining: 4                                               │
│                                                                        │
│ FinOps Agent queries Letta for similar patterns:                      │
│   ↓                                                                    │
│ lettaAgentMemory.search({                                             │
│   agentId: "FinOpsAgent",                                              │
│   query: "cloud migration budget utilization 90% late stage",         │
│   topK: 3                                                              │
│ });                                                                    │
│   ↓                                                                    │
│ Returns: "Cloud migrations consistently overrun..." memory            │
│   ↓                                                                    │
│ FinOps Agent proactively recommends:                                   │
│   - Conduct detailed cost forecast review NOW                         │
│   - Analyze egress costs and data transfer patterns                   │
│   - Consider budget contingency request                               │
│   ↓                                                                    │
│ This is LEARNING IN ACTION - past patterns inform future decisions    │
└────────────────────────────────────────────────────────────────────────┘
```

### Memory Architecture Summary

**Mem0 (Short-Term Shared Facts):**
- Real-time agent observations
- Cross-agent visibility via subscriptions
- Confidence-scored facts
- Supersedes mechanism for updates
- Rules engine evaluation

**Letta (Long-Term Learning):**
- Vector embeddings for semantic search
- Pattern recognition across projects
- Proactive recommendations
- Continuous improvement
- Agent-specific memory stores

**Integration Flow:**
1. Agent observes → 2. Writes Mem0 fact → 3. Other agents notified → 4. Rules fire → 5. Store Letta pattern → 6. Future retrieval → 7. Proactive recommendations

---

## DEEP AGENT COLLABORATION - A2A MESSAGE BUS

**Agent-to-Agent (A2A) Communication** via DeepAgentOrchestrator enables sophisticated multi-agent collaboration.

### A2A Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DEEPAGENTORCHESTRATOR                                 │
│                    (A2A Message Bus)                                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Message Queue (In-Memory)                                          │ │
│  │  - Incoming messages from all agents                                │ │
│  │  - Priority-based routing                                           │ │
│  │  - Message persistence for audit                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │   PMOAgent  │  │  FinOpsAgent│  │  RiskAgent  │  │   VROAgent   │  │
│  │             │  │             │  │             │  │              │  │
│  │  Deep Agent │  │  Deep Agent │  │  Deep Agent │  │  Deep Agent  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │
│         ↑ ↓              ↑ ↓              ↑ ↓              ↑ ↓          │
│         └────────────────┴────────────────┴────────────────┘            │
│                    Bidirectional A2A Messages                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Complete A2A Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Agent Sends A2A Message                                       │
│                                                                        │
│ Scenario: Risk Agent detects critical risk                            │
│                                                                        │
│ riskAgent.sendA2AMessage({                                            │
│   to: "PMOAgent",                                                      │
│   from: "RiskAgent",                                                   │
│   type: "risk_escalation",                                             │
│   priority: "critical",                                                │
│   payload: {                                                           │
│     projectId: "erp-implementation",                                   │
│     riskId: "R-2024-089",                                              │
│     riskCategory: "technical",                                         │
│     probabilty: 0.8,                                                   │
│     impact: 5,                                                          │
│     riskScore: 20,                                                     │
│     description: "Critical database migration dependency at risk",    │
│     recommendation: "Consider split deployment approach"               │
│   }                                                                    │
│ });                                                                    │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: DeepAgentOrchestrator Routes Message                          │
│                                                                        │
│ deepAgentOrchestrator.routeMessage({                                  │
│   message: { ... },                                                    │
│   toAgent: "PMOAgent"                                                  │
│ });                                                                    │
│   ↓                                                                    │
│ Orchestrator checks:                                                   │
│   - Is PMOAgent currently running? Yes                                │
│   - Priority: critical → Execute immediately                          │
│   - Message history: Store in agent_messages table                    │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PMO Agent Receives and Processes Message                      │
│                                                                        │
│ PMOAgent.onA2AMessage(message):                                        │
│   ↓                                                                    │
│ Understands context:                                                   │
│   - Critical technical risk detected by Risk Agent                    │
│   - Project: ERP Implementation                                       │
│   - Risk score: 20 (very high)                                        │
│   - Recommendation provided                                           │
│   ↓                                                                    │
│ PMO Agent takes action:                                                │
│   1. Adjusts project health score                                     │
│   2. Writes facts to Mem0 (project_status = "critical_risk")          │
│   3. Creates task: "Evaluate split deployment approach"               │
│   4. Sends A2A response back to Risk Agent                            │
│   5. Sends A2A message to FinOps (schedule change → cost impact)      │
└────────────────────────┬───────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Multi-Agent Cascade                                           │
│                                                                        │
│ PMO → FinOps:                                                          │
│   "Schedule may extend due to technical risk mitigation"              │
│     ↓                                                                  │
│   FinOps recalculates budget impact                                   │
│   FinOps → VRO: "Cost increase of $80K projected"                     │
│     ↓                                                                  │
│   VRO recalculates ROI (increased cost)                               │
│   VRO → Executive: "ROI dropped from 25% to 18%"                      │
│     ↓                                                                  │
│   Executive Agent triggers briefing for C-suite                       │
│                                                                        │
│ This demonstrates EMERGENT COLLABORATION - no single agent programmed │
│ the full cascade, but agents working together produce sophisticated   │
│ portfolio-wide impact analysis.                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### A2A Message Bus Summary

**Key Features:**
- Bidirectional agent communication
- Priority-based routing
- Message persistence (audit trail)
- Asynchronous execution
- Context-aware processing

**Common A2A Message Types:**
1. **rule_triggered**: Rules engine fired, notify relevant agents
2. **risk_escalation**: Risk agent alerts others
3. **budget_impact**: FinOps notifies of cost changes
4. **schedule_change**: TMO alerts of timeline shifts
5. **value_impact**: VRO reports ROI/benefits changes
6. **compliance_violation**: Governance escalates issues
7. **change_resistance**: OCM reports adoption problems

---

**STATUS: 7 of 8 Rule Editors Complete + Memory + A2A Collaboration Documented**

**Remaining sections to complete:**
- MCP Integration flow (external tool connection)
- Knowledge Base/RAG flow (document parsing → vectorization → retrieval)
- Camunda workflows (DMN/BPMN integration)
- Notification system (WebSocket + email/Slack/Teams)
- 8 Workspace user journeys
- Project lifecycle (creation → execution → closure)
- Infrastructure layers (database, API, WebSocket)

**Total progress: ~40% complete (4,000+ lines documented)**
