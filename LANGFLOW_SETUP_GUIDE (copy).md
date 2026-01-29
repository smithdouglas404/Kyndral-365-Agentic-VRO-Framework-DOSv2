# Langflow Setup Guide for Nexus PPM

## Overview

This guide shows you how to set up Langflow flows on DataStax to replace hardcoded MCP orchestration with visual, configurable workflows.

---

## Step 1: Complete Astra DB Setup

You're currently creating the Astra DB instance. Once ready:

1. Copy the **API Endpoint** from DataStax console
2. Update `.env`:
   ```bash
   ASTRA_DB_API_ENDPOINT=https://YOUR-DB-ID-REGION.apps.astra.datastax.com
   ```

---

## Step 2: Deploy Langflow on DataStax

DataStax provides hosted Langflow with Astra integration:

1. Go to https://astra.datastax.com
2. Navigate to "Langflow" section
3. Create new Langflow instance
4. Once deployed, copy:
   - Langflow URL: `https://YOUR-INSTANCE.langflow.datastax.com`
   - API Key (from settings)

5. Update `.env`:
   ```bash
   LANGFLOW_API_URL=https://YOUR-INSTANCE.langflow.datastax.com
   LANGFLOW_API_KEY=your_api_key_here
   ```

---

## Step 3: Create MCP Integration Flows

### Flow 1: FinOps Budget Alert

**Purpose:** Replace hardcoded budget overrun detection with configurable flow

**Nodes:**
```
[Input: Budget Data]
  ↓
[Conditional: variance > threshold?]
  ├─ YES → [Jira: Create Issue]
  │         ↓
  │        [Slack: Notify Channel]
  │         ↓
  │        [A2A: Message TMO Agent]
  │         ↓
  │        [Monday.com: Log Action]
  │
  └─ NO  → [Log: Within tolerance]
```

**Input Schema:**
```json
{
  "projectId": "proj_123",
  "projectName": "Cloud Migration",
  "budgetVariance": 0.18,
  "currentBudget": 500000,
  "actualSpent": 590000,
  "forecastedSpent": 650000
}
```

**Configuration:**
- Threshold: `0.15` (15% - editable in UI)
- Jira Project: `PMO`
- Priority: `High`
- Slack Channel: `#budget-alerts`

---

### Flow 2: TMO Schedule Delay Response

**Purpose:** Automatic escalation when schedule delays detected

**Nodes:**
```
[Input: Schedule Data]
  ↓
[Conditional: delay > 5 days?]
  ├─ YES → [ServiceNow: Create Incident]
  │         ↓
  │        [Call FinOps Agent API]
  │         (check budget impact)
  │         ↓
  │        [Jira: Update Epic]
  │         ↓
  │        [A2A: Alert Risk Agent]
  │
  └─ NO  → [Monday.com: Update Status]
```

**Input Schema:**
```json
{
  "projectId": "proj_456",
  "projectName": "Website Redesign",
  "scheduledDate": "2026-02-15",
  "currentDate": "2026-01-27",
  "delayDays": 7,
  "criticalPath": true
}
```

---

### Flow 3: Risk Escalation Workflow

**Purpose:** Multi-tier risk escalation with external service integration

**Nodes:**
```
[Input: Risk Assessment]
  ↓
[Switch on Risk Score]
  ├─ 8-10 → [Jira: Critical Issue]
  │         ↓
  │        [ServiceNow: P1 Incident]
  │         ↓
  │        [A2A: Alert VRO + PMO]
  │         ↓
  │        [Slack: @channel Notification]
  │
  ├─ 6-7  → [Jira: High Priority]
  │         ↓
  │        [A2A: Alert PMO]
  │
  └─ 0-5  → [Monday.com: Log Finding]
```

---

### Flow 4: Weekly Synthesis Aggregation

**Purpose:** Collect agent findings for BattleRhythm synthesis

**Nodes:**
```
[Webhook: Sunday Recon Trigger]
  ↓
[Parallel Execution]
  ├─ [Call FinOps Agent API]
  ├─ [Call TMO Agent API]
  ├─ [Call Risk Agent API]
  ├─ [Call VRO Agent API]
  └─ [Call Planning Agent API]
  ↓
[Aggregate Results]
  ↓
[Store in Astra DB]
  ↓
[Trigger Monday Scrum of Scrums]
```

**Schedule:** Sunday 11 PM (via Langflow cron)

---

## Step 4: Integrate Flows with Agents

### Update ContinuousOrchestrator to Call Langflow

**Before (hardcoded):**
```typescript
// In FinOpsAgent
if (budgetVariance > 0.15) {
  await this.orchestrator.agentCallMCPService(
    'finops',
    'jira',
    'createIssue',
    { fields: {...} }
  );
}
```

**After (Langflow):**
```typescript
// In FinOpsAgent
if (budgetVariance > 0.15) {
  await this.orchestrator.executeLangflowFlow(
    'finops-budget-alert',
    {
      projectId: project.id,
      projectName: project.name,
      budgetVariance,
      currentBudget: project.budget,
      actualSpent: project.actualCost,
    }
  );
}
```

---

## Step 5: Configure Flow IDs in Environment

Add flow IDs to `.env` once created:

```bash
# Langflow Flow IDs (from Langflow UI)
LANGFLOW_FLOW_FINOPS_BUDGET_ALERT=flow_abc123
LANGFLOW_FLOW_TMO_SCHEDULE_DELAY=flow_def456
LANGFLOW_FLOW_RISK_ESCALATION=flow_ghi789
LANGFLOW_FLOW_WEEKLY_SYNTHESIS=flow_jkl012
```

---

## Step 6: Testing Flows

### Test in Langflow UI
1. Go to Langflow instance
2. Click "Run" on flow
3. Paste test input JSON
4. Verify outputs

### Test from Nexus PPM
```bash
# Via API route (we'll create this)
curl -X POST http://localhost:5000/api/langflow/test \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "finops-budget-alert",
    "input": {
      "projectId": "test_123",
      "budgetVariance": 0.20
    }
  }'
```

---

## Step 7: Admin UI Integration

Once flows are created, the admin UI at `/admin/langflow` will show:

- **Flow List:** All configured flows
- **Test Playground:** Run flows with sample data
- **Execution History:** Recent flow runs with status
- **Flow Editor Link:** Direct link to Langflow UI for editing

---

## Benefits Over Hardcoded MCP Calls

| Aspect | Before (TypeScript) | After (Langflow) |
|--------|---------------------|------------------|
| **Visibility** | Hidden in 2,500 line files | Visual diagram |
| **Modification** | Edit code, rebuild, restart | Drag-drop in UI |
| **Testing** | Full agent run required | Test button in UI |
| **Who Can Change** | Developers only | Anyone with access |
| **Threshold Changes** | Code edit + deploy | Change node value |
| **Error Debugging** | Read server logs | See errors in flow UI |
| **New Integrations** | Write TypeScript class | Add pre-built node |

---

## Next Steps

Once you provide:
1. ✅ `ASTRA_DB_API_ENDPOINT` (from Astra console)
2. ✅ `LANGFLOW_API_URL` (from DataStax Langflow)
3. ✅ `LANGFLOW_API_KEY` (from Langflow settings)

I will:
1. Test Langflow connection
2. Update orchestrator to use Langflow service
3. Create admin UI routes for flow management
4. Migrate 3 agent patterns to Langflow flows
5. Document flow creation process

---

## Architecture After Integration

```
┌─────────────────────────────────────────────────┐
│           DEEP AGENTS (TypeScript)              │
│  Planning, Reflection, Memory, RAG              │
│  FinOps, TMO, Risk, VRO, PMO, OCM, Planning    │
└────────────────┬────────────────────────────────┘
                 │
                 │ Detects condition
                 ↓
┌─────────────────────────────────────────────────┐
│         LANGFLOW (Visual Orchestration)         │
│  ┌────────────────────────────────────────┐    │
│  │ Flow: "FinOps Budget Alert"            │    │
│  │ [Input]→[Check]→[Jira]→[Slack]→[A2A]  │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  Stored in: Astra DB (DataStax)                │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
        Real MCP Services
   (Jira, ServiceNow, Monday.com)
```

---

**This replaces Camunda with Langflow and makes your MCP orchestration visual, testable, and no-code configurable.**
