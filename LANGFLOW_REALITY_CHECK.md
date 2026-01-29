# LANGFLOW INTEGRATION - REALITY CHECK

**Created**: 2026-01-29
**Status**: 🟡 **PARTIALLY IMPLEMENTED**

---

## WHAT THE DOCUMENTATION CLAIMS

`ALL_AGENTS_WIRED.md` says:
> "All Deep Agents now call their Langflow workflows when they detect critical conditions. The integration is **complete and working**."
> "🎉 **The system is now fully operational!**"

---

## WHAT ACTUALLY EXISTS

### ✅ Code is Written (Agent Side)

**8 agents DO call Langflow:**

| Agent | File | Line | Flow ID (Hardcoded) |
|-------|------|------|---------------------|
| FinOps | `DeepFinOpsAgent.ts` | 91 | `70d569d8-3e9c-4684-9227-ee4743d4be09` |
| TMO | `DeepTMOAgent.ts` | 107 | `be3ebfe5-ac51-456d-8b22-c7ff5d123ed4` |
| Risk | `DeepRiskAgent.ts` | 798 | `9be34a7d-1a53-455e-ad22-6d94565c5a7e` |
| VRO | `DeepVROAgent.ts` | 176 | `a5e06553-0e6b-42ed-9d68-5003b0c2a2be` |
| PMO | `DeepPMOAgent.ts` | 77 | `27bc79cd-2302-4356-a039-3238de8218b8` |
| OCM | `DeepOCMAgent.ts` | 162 | `06ef7ded-63df-4ed7-8a90-9ad3e8ddeef9` |
| Governance | `DeepGovernanceAgent.ts` | 96 | `5d29ac9d-fd49-4400-bdf2-8f7877ff0fa4` |
| Planning | `DeepPlanningAgent.ts` | 100 | `6128dcc0-e61f-4853-96bc-42e483473059` |

**They all call:**
```typescript
const flowResult = await executeLangflowFlow(
  'hardcoded-flow-id',
  { projectId, data, ... },
  'agent-name'
);
```

### ⚠️ Unknown: Do These Flows Exist?

**WE DON'T KNOW if these 8 Flow IDs actually exist in your Langflow instance.**

The code calls them, but:
- ❌ Not verified if flows exist
- ❌ Not tested end-to-end
- ❌ No error handling if flow doesn't exist
- ❌ Flow IDs hardcoded (not in database)

**These flows were likely created in a previous Langflow instance that may no longer exist.**

---

## WHAT NEEDS TO BE DONE

### OPTION A: DataStax Langflow (Current Setup)

**If you keep DataStax:**

1. ✅ **Import 8 Agent Flows** (Use `LangflowFlowGenerator.ts` approach)
   - We have the code to generate these flows
   - Use the Flow IDs from `ALL_AGENTS_WIRED.md`
   - OR create new flows and update the hardcoded IDs in agent code

2. ✅ **Import 4 Logic Gate Scenarios** (Already created)
   - `/langflow-flows/scenario-a-budget-overrun.json`
   - `/langflow-flows/scenario-b-burnout-brake.json`
   - `/langflow-flows/scenario-c-regulatory-deadbolt.json`
   - `/langflow-flows/scenario-d-maturity-governor.json`

3. ✅ **Provide API Key**
   - You said you'll provide this once documentation is ready
   - Add to `.env`: `LANGFLOW_API_KEY=your-key-here`

4. ✅ **Test Each Flow**
   - Verify all 12 flows (8 agents + 4 scenarios) execute successfully
   - Update Flow IDs in code if they changed

---

### OPTION B: Docker Langflow (Your Preference)

**If you want to move to Docker:**

1. ✅ **Install Langflow via Docker**
   ```bash
   docker run -d \
     --name langflow \
     -p 7860:7860 \
     -v $(pwd)/langflow-data:/app/langflow \
     langflowai/langflow:latest
   ```

2. ✅ **Update .env**
   ```bash
   LANGFLOW_API_URL=http://localhost:7860/api/v1
   LANGFLOW_API_KEY=<get-from-langflow-ui>
   LANGFLOW_ORG_ID=  # Not needed for local Docker
   ```

3. ✅ **Import Flows**
   - Use the same JSON files in `/langflow-flows/`
   - Use `LangflowFlowGenerator.ts` to create the 8 agent flows
   - Get the new Flow IDs

4. ✅ **Update Hardcoded Flow IDs**
   - Update each agent file with new Flow IDs
   - OR store Flow IDs in database `agent_configs` table (better approach)

---

## HOW AGENTS CALL LANGFLOW (Currently)

### Code Flow:

```
Agent detects critical condition (e.g., budget > 20% over)
    ↓
Agent calls: executeLangflowFlow(flowId, data, agentName)
    ↓
Function in LangflowMCPClient.ts:
    - Calls: POST {LANGFLOW_API_URL}/run/{flowId}
    - Headers: Authorization: Bearer {LANGFLOW_API_KEY}
    - Body: { input_value: JSON.stringify(data), tweaks: {} }
    ↓
Langflow executes the workflow:
    1. Input node receives data
    2. Python code node (decision logic)
    3. HTTP POST nodes call server APIs:
       - /api/agent-actions/jira/create-issue
       - /api/agent-actions/slack/notify
       - /api/agent-actions/notify/{other-agent}
    4. Output node returns result
    ↓
Agent logs success/failure
```

### Example from FinOpsAgent:

```typescript
// DeepFinOpsAgent.ts line 89-112
if (variance > 20) {
  console.log(`[DeepFinOps] CRITICAL: ${variance}% over budget`);

  const flowResult = await executeLangflowFlow(
    '70d569d8-3e9c-4684-9227-ee4743d4be09',  // ← HARDCODED FLOW ID
    {
      projectId,
      projectName: project.name,
      budgetVariance: variance / 100,
      currentBudget: budget,
      actualSpent: actualCost,
      severity: 'critical',
    },
    'finops'
  );

  if (flowResult.success) {
    console.log('[DeepFinOps] ✅ Langflow workflow executed');
  } else {
    console.log('[DeepFinOps] ❌ Langflow workflow failed:', flowResult.error);
  }
}
```

**Problem**: If Flow ID `70d569d8...` doesn't exist in Langflow, this fails silently.

---

## WHAT THE FLOWS DO (When They Exist)

Each agent flow follows this pattern:

```
┌─────────────────────────────────────────────────────┐
│ INPUT NODE: Receive agent data                     │
│ { projectId, variance, budget, severity, ... }     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ PYTHON CODE NODE: Decision Logic                   │
│ if variance > 0.20:                                 │
│   action = "create_jira"                            │
│   priority = "Highest"                              │
│   notify_slack = True                               │
│ elif variance > 0.15:                               │
│   action = "create_jira"                            │
│   priority = "High"                                 │
│ else:                                               │
│   action = "log_only"                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ HTTP POST NODE: Create Jira Ticket                 │
│ POST http://localhost:5000/api/agent-actions/      │
│      jira/create-issue                              │
│ Body: { projectKey, summary, priority, ... }       │
│ (Server handles Jira credentials from .env)        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ HTTP POST NODE: Send Slack Alert                   │
│ POST http://localhost:5000/api/agent-actions/      │
│      slack/notify                                   │
│ Body: { channel, text, blocks, ... }               │
│ (Server handles Slack webhook from .env)           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ HTTP POST NODE: Notify TMO Agent                   │
│ POST http://localhost:5000/api/agent-actions/      │
│      notify/tmo                                     │
│ Body: { from: "finops", message, severity, ... }   │
│ (Logs agent-to-agent communication)                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ OUTPUT NODE: Return Success                        │
│ { success: true, actions: [...] }                  │
└─────────────────────────────────────────────────────┘
```

**Key Point**: All credentials (Jira, ServiceNow, Slack) are stored server-side in `.env`. Langflow flows just call HTTP endpoints.

---

## SERVER ENDPOINTS (Already Built)

These are already implemented and working:

### ✅ Jira Integration
- `POST /api/agent-actions/jira/create-issue` - Create ticket
- `POST /api/agent-actions/jira/update-issue` - Update ticket
- `POST /api/agent-actions/jira/add-comment` - Add comment

**Implementation**: `server/routes/agent-actions.ts` lines 25-108
**MCP Service**: `server/mcp/JiraService.ts`

### ✅ ServiceNow Integration
- `POST /api/agent-actions/servicenow/create-incident` - Create incident
- `POST /api/agent-actions/servicenow/update-incident` - Update incident

**Implementation**: `server/routes/agent-actions.ts` lines 153-236
**MCP Service**: `server/mcp/ServiceNowService.ts`

### ✅ Slack Integration
- `POST /api/agent-actions/slack/notify` - Send message

**Implementation**: `server/routes/agent-actions.ts` lines 245-286

### ✅ Agent-to-Agent Communication
- `POST /api/agent-actions/notify/finops` - Notify FinOps
- `POST /api/agent-actions/notify/tmo` - Notify TMO
- `POST /api/agent-actions/notify/pmo` - Notify PMO
- `POST /api/agent-actions/notify/risk` - Notify Risk
- `POST /api/agent-actions/notify/vro` - Notify VRO
- `POST /api/agent-actions/notify/planning` - Notify Planning
- `POST /api/agent-actions/notify/ocm` - Notify OCM
- `POST /api/agent-actions/notify/governance` - Notify Governance

**Implementation**: `server/routes/agent-actions.ts` lines 293-450

### ✅ Logic Gate Actions
- `POST /api/agent-actions/pmo/create-epic` - Create high-priority epic
- `POST /api/agent-actions/pmo/set-flow-status` - Block/unblock work
- `POST /api/agent-actions/planning/invalidate-capacity` - Invalidate capacity
- `POST /api/agent-actions/tmo/schedule-coaching` - Schedule coaching
- `POST /api/agent-actions/vro/recalculate-roi` - Recalculate ROI
- `POST /api/agent-actions/governance/block-gate` - Block release gate

**Implementation**: `server/routes/agent-actions.ts` lines 462-629

---

## CREDENTIALS REQUIRED (.env)

For the server endpoints to work, add these to `.env`:

```bash
# Jira (Optional - flows degrade gracefully if not configured)
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token

# ServiceNow (Optional)
SERVICENOW_INSTANCE=dev12345.service-now.com
SERVICENOW_USERNAME=your_username
SERVICENOW_PASSWORD=your_password

# Slack (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Langflow (REQUIRED)
LANGFLOW_API_URL=http://localhost:7860/api/v1  # Or DataStax URL
LANGFLOW_API_KEY=your_api_key_here
LANGFLOW_ORG_ID=your_org_id  # Only if using DataStax
```

**Note**: Jira/ServiceNow/Slack are **optional**. If not configured:
- API endpoints return success=false with error message
- Flows continue executing (don't crash)
- Agents log warning but continue running

---

## TESTING CHECKLIST

### 1. Test Server Endpoints (No Langflow Required)

```bash
# Test Jira endpoint (will fail gracefully if not configured)
curl -X POST http://localhost:5000/api/agent-actions/jira/create-issue \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "TEST",
    "summary": "Test from API",
    "description": "Testing Jira integration",
    "priority": "High",
    "issuetype": "Task",
    "agentId": "finops"
  }'

# Test Slack endpoint (will fail gracefully if not configured)
curl -X POST http://localhost:5000/api/agent-actions/slack/notify \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#test",
    "text": "Test from API",
    "agentId": "finops"
  }'

# Test agent notification (always works - just logs)
curl -X POST http://localhost:5000/api/agent-actions/notify/tmo \
  -H "Content-Type: application/json" \
  -d '{
    "from": "finops",
    "projectId": "PRJ-123",
    "message": "Test notification",
    "severity": "medium"
  }'
```

### 2. Test Langflow Connection

```bash
# List available flows
npx tsx server/scripts/list-langflow-mcp-tools.ts
```

### 3. Test End-to-End (Agent → Langflow → APIs)

```bash
# Trigger FinOps agent with budget overrun
# Agent will detect > 20% variance and call Langflow
# Langflow will call Jira/Slack/TMO endpoints
# Check logs for success/failure
```

---

## DECISION REQUIRED

**You need to decide:**

### Option 1: DataStax Langflow (Current)
- ✅ Already configured
- ✅ Cloud-hosted (no Docker needed)
- ❌ Requires API key from you
- ❌ DataStax-specific auth

**Next Steps:**
1. You provide `LANGFLOW_API_KEY`
2. I use `LangflowFlowGenerator.ts` to create 8 agent flows
3. You manually import 4 Logic Gate scenarios (or I automate if API key works)
4. Test end-to-end

---

### Option 2: Docker Langflow (Your Preference)
- ✅ Fully local control
- ✅ No DataStax dependency
- ✅ Can move to any provider easily
- ❌ Need to set up Docker container
- ❌ Need to update all Flow IDs

**Next Steps:**
1. I provide Docker Compose setup
2. You run `docker-compose up -d`
3. I create all 12 flows programmatically
4. I update all hardcoded Flow IDs in agent code
5. Test end-to-end

---

## RECOMMENDATION

**Go with Option 2 (Docker Langflow)** because:

1. **Full control** - Not dependent on DataStax
2. **Easier migration** - Can move to any cloud provider later
3. **Simpler auth** - No org ID complications
4. **Cost** - Free (vs DataStax pricing)
5. **Testing** - Can easily reset/recreate flows

**Let me know your decision and I'll implement it.**

---

## FILES CREATED TODAY

### Logic Gate Scenarios (Ready to Import)
- `/langflow-flows/scenario-a-budget-overrun.json` - Budget Overrun (FinOps ↔ PMO ↔ VRO)
- `/langflow-flows/scenario-b-burnout-brake.json` - Burnout Brake (OCM ↔ Planning ↔ TMO)
- `/langflow-flows/scenario-c-regulatory-deadbolt.json` - Regulatory Deadbolt (Risk ↔ Governance ↔ PMO)
- `/langflow-flows/scenario-d-maturity-governor.json` - Maturity Governor (TMO ↔ PMO ↔ Planning)
- `/langflow-flows/README.md` - Import instructions

### Agent Flow Generator (Ready to Use)
- `/server/lib/LangflowFlowGenerator.ts` - Generates 8 agent flows programmatically
- `/server/scripts/create-logic-gate-scenarios.ts` - Script to create flows

### Documentation
- `/BRUTAL_HONEST_AUDIT.md` - Complete system audit (300+ issues)
- `/LANGFLOW_SCENARIOS.md` - Logic Gate scenario documentation
- **THIS FILE** - Reality check on current state

---

## BOTTOM LINE

**What works:**
- ✅ Server API endpoints are built and working
- ✅ Agents have code to call Langflow
- ✅ JSON flow definitions are ready

**What doesn't work:**
- ❌ Flows don't exist in Langflow (or we can't verify)
- ❌ No way to create them without API key OR manual import
- ❌ Can't test end-to-end until flows exist

**What you need to do:**
1. Choose: DataStax OR Docker Langflow
2. Provide API key (DataStax) OR run Docker (local)
3. I'll create all 12 flows programmatically
4. We test end-to-end

**Then the system will be truly operational.**

---

**END OF REALITY CHECK**
