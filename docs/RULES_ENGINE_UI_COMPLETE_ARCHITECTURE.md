# Rules Engine UI - Complete Architecture

**Last Updated:** January 25, 2026
**Status:** Architecture clarification and component mapping

---

## Component Relationship Clarification

### ✅ ALREADY DOCUMENTED: 8 Retool Rule Editors

The **"Per-Agent Rules Dashboard (Retool-style)"** you described **IS** the 8 Retool Rule Editors we just documented in `RETOOL_RULE_EDITOR_SPECS.md`.

**They are the same thing:**
- 1 Retool app per team (FinOps, TMO, Risk, VRO, PMO, OCM)
- Each has the WHEN/THEN/NOTIFY pattern you described
- Each shows KPIs being monitored
- Each has Edit/Delete/Test buttons
- All write to `collaboration_rules` PostgreSQL table

**Status:** ✅ Specifications complete (8 apps documented)

---

## UI Components Taxonomy

### Category 1: Rule Configuration (Team-Facing)

| Component | Status | Description | Users |
|-----------|--------|-------------|-------|
| **8 Retool Rule Editors** | ✅ Spec complete | Per-team rule configuration apps | FinOps, TMO, Risk, VRO, PMO, OCM teams |
| **Rule Builder Wizard** | ⏳ Need to build | Step-by-step guided rule creation | All teams (alternative to Retool editors) |

**Decision Point:** Do we need BOTH Retool editors AND the Rule Builder Wizard?
- **Option A:** Retool editors only (simpler, matches your mockups)
- **Option B:** Both (wizard for beginners, Retool for power users)
- **Recommendation:** Start with Retool editors, add wizard later if needed

---

### Category 2: Visualization & Monitoring (Admin-Facing)

| Component | Status | Description | Users |
|-----------|--------|-------------|-------|
| **Agent Collaboration Matrix** | ❌ Need to build | Visual grid of A2A collaboration intensity | Admins, TMO, Governance |
| **DMN Decision Table Viewer** | ❌ Need to build | Read-only view of Camunda DMN tables | Admins, Governance |
| **Rule Execution History** | ❌ Need to build | Audit log of when rules fired | Admins, Compliance, All teams |

**Priority:** HIGH - These are essential for visibility and compliance

---

### Category 3: Integration Screens (Already Built?)

| Component | Status | Description | Location |
|-----------|--------|-------------|----------|
| **CamundaRulesEngine.tsx** | ❓ Verify exists | Connection to Camunda Desktop Modeler | Check `client/src/` |
| **RuleToOKRMapper.tsx** | ❓ Verify exists | Link OKR thresholds to Camunda rules | Check `client/src/` |
| **BusinessRulesViewer.tsx** | ❓ Verify exists | Visual policy rules (insurance example) | Check `client/src/` |

**Action Required:** Search codebase to verify these exist

---

## Detailed Specifications for NEW Screens

### 1. Agent Collaboration Matrix (NEW - HIGH PRIORITY)

**Purpose:** Visual grid showing which agents collaborate with which agents, and how frequently

**UI Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Agent-to-Agent Collaboration Matrix              [Last 7 Days]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│        │FinOps│ Risk │ TMO  │ VRO  │ PMO  │ OCM  │              │
│  ──────┼──────┼──────┼──────┼──────┼──────┼──────┤              │
│  FinOps│  -   │ ●●●  │ ●●●  │ ●●   │ ●    │      │  12 messages│
│  Risk  │ ●●   │  -   │ ●●●  │ ●    │ ●●   │ ●    │  18 messages│
│  TMO   │ ●●●  │ ●●●  │  -   │ ●●●  │ ●●●  │ ●●   │  34 messages│
│  VRO   │ ●●   │ ●    │ ●●●  │  -   │ ●●   │ ●●●  │  22 messages│
│  PMO   │ ●    │ ●●   │ ●●●  │ ●●   │  -   │ ●●●  │  28 messages│
│  OCM   │      │ ●    │ ●●   │ ●●●  │ ●●●  │  -   │  15 messages│
│                                                                  │
│  Legend:                                                         │
│  ● = 1-5 messages   ●● = 6-15 messages   ●●● = 16+ messages     │
│                                                                  │
│  [Click any cell to view collaboration details]                  │
│                                                                  │
│  ┌─ Selected: FinOps → TMO (23 messages) ───────────────────┐   │
│  │                                                           │   │
│  │  Most Frequent Collaboration:                            │   │
│  │  • "Budget overrun → Schedule review" (12 times)         │   │
│  │  • "CPI warning → Timeline adjustment" (8 times)         │   │
│  │  • "Burn rate alert → Milestone evaluation" (3 times)    │   │
│  │                                                           │   │
│  │  [ View All Messages ]  [ Configure Rules ]              │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Data Source:**
- Query `DeepAgentOrchestrator.getCollaborationStats()` API
- Aggregate A2A messages from `agent_execution_logs` table
- Count messages by `(from_agent, to_agent)` pairs

**API Endpoint:**
```
GET /api/deep-agents/collaboration-stats?timeframe=7days

Response:
{
  collaborationMatrix: {
    "finops->tmo": 23,
    "finops->risk": 18,
    "tmo->risk": 34,
    ...
  },
  topCollaborations: [
    {
      from: "finops",
      to: "tmo",
      count: 23,
      topReasons: ["budget_overrun", "cpi_warning"]
    }
  ]
}
```

**Implementation:**
- React component with grid layout
- Click cell to show drill-down panel
- Heatmap colors (green → yellow → red)
- Time range selector (24h, 7d, 30d)

---

### 2. DMN Decision Table Viewer (NEW - MEDIUM PRIORITY)

**Purpose:** Read-only view of Camunda DMN decision tables

**UI Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📋 Budget Overrun Collaboration Rules (DMN)    Version: 1.2    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Decision Table: budget-overrun-escalation                       │
│  DMN ID: Decision_BudgetOverrun_v1.2                            │
│  Last Modified: 2026-01-20 by John (Governance)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Input Columns          │ Output Columns                      ││
│  ├────────────────────────┼─────────────────────────────────────┤│
│  │ costPerformanceIndex   │ targetAgents                        ││
│  │ riskLevel              │ severity                            ││
│  │ projectPhase           │ escalationPath                      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Rules:                                                          │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ CPI     │ Risk    │ Phase    │ → Target Agents │ Sev   ││
│  ├───┼─────────┼─────────┼──────────┼─────────────────┼───────┤│
│  │ 1 │ < 0.80  │ any     │ any      │ [tmo,risk,gov]  │ high  ││
│  │ 2 │ 0.8-0.9 │ high    │ any      │ [tmo,risk]      │ high  ││
│  │ 3 │ 0.8-0.9 │ not high│ planning │ [tmo,vro]       │ med   ││
│  │ 4 │ 0.8-0.9 │ not high│ execution│ [tmo]           │ med   ││
│  │ 5 │ >= 0.90 │ critical│ any      │ [governance]    │ low   ││
│  │ 6 │ >= 0.90 │ not crit│ any      │ -               │ none  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ℹ️ This table is managed in Camunda Desktop Modeler            │
│                                                                  │
│  [Open in Camunda Operate]  [Download DMN XML]  [View History]   │
└──────────────────────────────────────────────────────────────────┘
```

**Data Source:**
- Fetch from Camunda 8 REST API: `GET /decision-definition/{key}/xml`
- Parse DMN XML to extract decision table
- Display in read-only grid format

**API Integration:**
```typescript
// Existing Camunda8Service.ts
async getDMNDecisionTable(decisionKey: string) {
  const response = await this.client.get(
    `/decision-definition/key/${decisionKey}/xml`
  );
  return parseDMNXML(response.data);
}
```

**Implementation:**
- React component with table renderer
- DMN XML parser (use `dmn-js` library)
- Link to open in Camunda Operate
- Version history viewer

---

### 3. Rule Execution History / Audit Log (NEW - HIGH PRIORITY)

**Purpose:** Track when rules fire, which agents collaborate, and outcomes

**UI Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📜 Rule Execution History                    [Export] [Filter]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [All Agents ▼] [All Rules ▼] [Last 7 Days ▼]          │
│                                                                  │
│  ┌─ Today ─────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  🔴 14:32  FinOps → TMO                                      ││
│  │  Rule: "CPI Critical" (cpi < 0.85)                           ││
│  │  Project: Project Alpha (id: proj-123)                       ││
│  │  Trigger: CPI = 0.78 (threshold 0.85)                        ││
│  │  Actions: Alert sent, Email sent                             ││
│  │  Status: ✅ Acknowledged by TMO in 4 min                    ││
│  │  TMO Response: "Scheduled recovery meeting for 15:00"        ││
│  │  [View Full Details]                                          ││
│  │                                                              ││
│  ├──────────────────────────────────────────────────────────────┤│
│  │  🟡 11:15  Risk → Governance                                 ││
│  │  Rule: "High Risk Escalation" (risk_score > 8)               ││
│  │  Project: Project Beta (id: proj-456)                        ││
│  │  Trigger: Risk Score = 8.5 (threshold 8.0)                   ││
│  │  Actions: Escalation created, Email sent                     ││
│  │  Status: 🔄 Pending governance review (2h 15m elapsed)      ││
│  │  [View Full Details] [Send Reminder]                         ││
│  │                                                              ││
│  ├──────────────────────────────────────────────────────────────┤│
│  │  🟢 09:45  VRO → OCM                                         ││
│  │  Rule: "Value Leakage Alert" (benefits < 90%)                ││
│  │  Project: Project Gamma (id: proj-789)                       ││
│  │  Trigger: Benefits Realization = 82% (threshold 90%)         ││
│  │  Actions: Alert sent, Intervention requested                 ││
│  │  Status: ✅ Change intervention scheduled for 2026-01-26    ││
│  │  OCM Response: "Stakeholder meeting booked"                  ││
│  │  [View Full Details]                                          ││
│  │                                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ Statistics ────────────────────────────────────────────────┐│
│  │  Today: 23 rules fired  |  18 resolved  |  5 pending         ││
│  │  Avg response time: 12 minutes                               ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Load More...] [Export to CSV]                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Data Source:**
- Query `agent_execution_logs` table
- Join with `collaboration_rules` table to get rule details
- Join with `projects` table to get project context

**Database Schema:**
```sql
-- Already exists in agent_execution_logs
SELECT
  ael.id,
  ael.agent_id,
  ael.created_at,
  ael.task_type,
  ael.prompt,
  ael.response,
  ael.tools_used,
  cr.rule_name,
  cr.conditions,
  cr.actions,
  p.name as project_name
FROM agent_execution_logs ael
LEFT JOIN collaboration_rules cr ON ael.rule_id = cr.id
LEFT JOIN projects p ON ael.project_id = p.id
ORDER BY ael.created_at DESC
LIMIT 50;
```

**API Endpoint:**
```
GET /api/rules/execution-history?timeframe=7days&agent=finops&status=pending

Response:
{
  executions: [
    {
      id: "exec-123",
      timestamp: "2026-01-25T14:32:00Z",
      fromAgent: "finops",
      toAgent: "tmo",
      ruleName: "CPI Critical",
      ruleId: "finops-cpi-critical",
      trigger: { attribute: "cpi", value: 0.78, threshold: 0.85 },
      project: { id: "proj-123", name: "Project Alpha" },
      actions: ["alert", "email"],
      status: "acknowledged",
      responseTime: 240, // seconds
      response: "Scheduled recovery meeting for 15:00"
    },
    ...
  ],
  stats: {
    totalFired: 23,
    resolved: 18,
    pending: 5,
    avgResponseTime: 720 // seconds
  }
}
```

**Implementation:**
- React component with timeline/list view
- Color-coded status indicators (🔴 critical, 🟡 warning, 🟢 resolved)
- Filter by agent, rule, date range, status
- Export to CSV functionality
- Real-time updates via WebSocket

---

### 4. Rule Builder Wizard (NEW - OPTIONAL)

**Purpose:** Guided step-by-step rule creation for non-technical users

**UI Layout (4-Step Wizard):**

**Step 1: Choose Source Agent**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 Create Collaboration Rule                   Step 1 of 4      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Which agent is detecting the condition?                         │
│                                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐               │
│  │FinOps  │  │  Risk  │  │  TMO   │  │  VRO   │               │
│  │  💰   │  │  ⚠️   │  │  ⏰   │  │  📈   │               │
│  └────────┘  └────────┘  └────────┘  └────────┘               │
│                                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐                           │
│  │  PMO   │  │  OCM   │  │Govern  │                           │
│  │  📊   │  │  👥   │  │  🛡️   │                           │
│  └────────┘  └────────┘  └────────┘                           │
│                                                                  │
│                                           [Next: Set Condition]  │
└──────────────────────────────────────────────────────────────────┘
```

**Step 2: Define Trigger Condition**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 Create Collaboration Rule                   Step 2 of 4      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Trigger Condition ──────────────────────────────────────────┐│
│  │                                                              ││
│  │  WHEN  [FinOps Agent]  detects:                             ││
│  │                                                              ││
│  │  [CPI (Cost Performance Index) ▼]  is  [< ▼]  [ 0.85 ]      ││
│  │                                                              ││
│  │  AND (optional)                                              ││
│  │                                                              ││
│  │  [Risk Level ▼]  is  [High or Critical ▼]                   ││
│  │                                                              ││
│  │  [+ Add Another Condition]                                   ││
│  │                                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  💡 This rule will trigger when CPI falls below 0.85 AND         │
│     risk level is high or critical                               │
│                                                                  │
│                           [Back]  [Next: Choose Actions]         │
└──────────────────────────────────────────────────────────────────┘
```

**Step 3: Select Actions**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 Create Collaboration Rule                   Step 3 of 4      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Actions ────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  When this rule triggers, do:                                ││
│  │                                                              ││
│  │  ☑ Notify Target Agent(s)                                    ││
│  │     └─ Select agents: [TMO ✓] [Risk ✓] [Governance ]       ││
│  │                                                              ││
│  │  ☑ Send Email Notification                                   ││
│  │     └─ Recipients: [ project-leads@company.com ]            ││
│  │                                                              ││
│  │  ☐ Create Jira Ticket                                        ││
│  │     └─ Project: [Select Jira Project ▼]                     ││
│  │                                                              ││
│  │  ☑ Log to Audit Trail                                        ││
│  │     └─ Severity: [High ▼]                                   ││
│  │                                                              ││
│  │  ☐ Execute Camunda Workflow                                  ││
│  │     └─ Process: [Select Process ▼]                          ││
│  │                                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│                           [Back]  [Next: Review & Deploy]        │
└──────────────────────────────────────────────────────────────────┘
```

**Step 4: Review and Deploy**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 Create Collaboration Rule                   Step 4 of 4      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Rule Summary ───────────────────────────────────────────────┐│
│  │                                                              ││
│  │  Rule Name: [ CPI Critical Collaboration ]                   ││
│  │                                                              ││
│  │  Source Agent: FinOps                                        ││
│  │                                                              ││
│  │  Trigger:                                                    ││
│  │  • CPI < 0.85                                                ││
│  │  • AND Risk Level is High or Critical                        ││
│  │                                                              ││
│  │  Actions:                                                    ││
│  │  • Notify TMO and Risk agents                                ││
│  │  • Send email to project-leads@company.com                   ││
│  │  • Log to audit trail (severity: high)                       ││
│  │                                                              ││
│  │  This rule will be ACTIVE immediately after deployment        ││
│  │                                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ☑ I understand this rule will affect agent collaboration        │
│                                                                  │
│  [Back]  [Test Rule]  [Deploy Rule]                              │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- React component with multi-step form
- Writes to same `collaboration_rules` table as Retool editors
- Alternative UI for non-technical users
- Validation at each step

**Decision:** Build this AFTER Retool editors are working, as an alternative interface

---

## Implementation Priority

### Phase 1: Core Functionality (ASAP)
1. ✅ **8 Retool Rule Editors** - Specifications complete
2. ❌ **Rule Execution History** - HIGH PRIORITY for visibility
3. ❌ **Agent Collaboration Matrix** - HIGH PRIORITY for monitoring

### Phase 2: Integration (Next)
4. ❓ **Verify Existing Screens** - CamundaRulesEngine, RuleToOKRMapper, BusinessRulesViewer
5. ❌ **DMN Decision Table Viewer** - MEDIUM PRIORITY for Camunda integration

### Phase 3: Enhanced UX (Later)
6. ❌ **Rule Builder Wizard** - OPTIONAL, alternative to Retool editors

---

## File Locations (Where to Build)

### Frontend (React/TypeScript)
```
client/src/components/rules/
├── collaboration-matrix/
│   ├── AgentCollaborationMatrix.tsx    (NEW)
│   └── CollaborationMatrixCell.tsx     (NEW)
│
├── execution-history/
│   ├── RuleExecutionHistory.tsx        (NEW)
│   ├── ExecutionLogEntry.tsx           (NEW)
│   └── ExecutionFilters.tsx            (NEW)
│
├── dmn-viewer/
│   ├── DMNDecisionTableViewer.tsx      (NEW)
│   └── DMNRuleRow.tsx                  (NEW)
│
├── rule-wizard/
│   ├── RuleBuilderWizard.tsx           (NEW - Optional)
│   ├── StepSourceAgent.tsx             (NEW - Optional)
│   ├── StepCondition.tsx               (NEW - Optional)
│   ├── StepActions.tsx                 (NEW - Optional)
│   └── StepReview.tsx                  (NEW - Optional)
│
└── existing/
    ├── CamundaRulesEngine.tsx          (VERIFY EXISTS)
    ├── RuleToOKRMapper.tsx             (VERIFY EXISTS)
    └── BusinessRulesViewer.tsx         (VERIFY EXISTS)
```

### Backend API Endpoints (Express/TypeScript)
```
server/routes/
├── rules-execution-history.ts          (NEW)
│   GET /api/rules/execution-history
│   GET /api/rules/execution-history/:id
│   POST /api/rules/execution-history/export
│
├── collaboration-stats.ts              (EXTEND EXISTING)
│   GET /api/deep-agents/collaboration-stats
│   GET /api/deep-agents/collaboration-matrix
│
└── dmn-viewer.ts                       (NEW)
    GET /api/camunda/dmn/:decisionKey
    GET /api/camunda/dmn/:decisionKey/history
```

---

## Database Schema Updates

### New Table: rule_execution_history
```sql
CREATE TABLE rule_execution_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT,
  project_id TEXT,

  -- Trigger details
  trigger_attribute TEXT NOT NULL,
  trigger_value TEXT NOT NULL,
  threshold TEXT NOT NULL,

  -- Execution details
  actions_taken JSONB NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'acknowledged', 'resolved', 'failed'

  -- Response tracking
  response_time_seconds INTEGER,
  response_message TEXT,

  -- Timestamps
  triggered_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  FOREIGN KEY (rule_id) REFERENCES collaboration_rules(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_rule_exec_history_agent ON rule_execution_history(from_agent, triggered_at DESC);
CREATE INDEX idx_rule_exec_history_project ON rule_execution_history(project_id, triggered_at DESC);
CREATE INDEX idx_rule_exec_history_status ON rule_execution_history(status, triggered_at DESC);
```

---

## Summary

### What You Need:

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **8 Retool Rule Editors** | ✅ Spec complete | CRITICAL | Same as "Per-Agent Rules Dashboard" |
| **Rule Execution History** | ❌ Need to build | HIGH | Essential for visibility & compliance |
| **Agent Collaboration Matrix** | ❌ Need to build | HIGH | Essential for monitoring A2A |
| **DMN Decision Table Viewer** | ❌ Need to build | MEDIUM | Read-only Camunda integration |
| **Rule Builder Wizard** | ❌ Need to build | LOW/OPTIONAL | Alternative UI (can skip initially) |
| **Existing Screens** | ❓ Verify | MEDIUM | Check if CamundaRulesEngine.tsx exists |

### What's Redundant:

- "Per-Agent Rules Dashboard" = 8 Retool Rule Editors (same thing)

---

**Next Steps:**
1. Build Rule Execution History screen (high priority)
2. Build Agent Collaboration Matrix (high priority)
3. Verify existing screens in codebase
4. Build DMN Viewer (medium priority)
5. Consider Rule Builder Wizard later

---

**Files Created:**
- `/docs/RETOOL_RULE_EDITOR_SPECS.md` - 8 Retool editors
- `/docs/RULES_ENGINE_UI_COMPLETE_ARCHITECTURE.md` - This file
