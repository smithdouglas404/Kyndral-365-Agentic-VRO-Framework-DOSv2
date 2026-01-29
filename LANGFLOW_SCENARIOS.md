# Langflow Scenario Workflows - Implementation Guide

**Version**: 1.0
**Created**: 2026-01-29
**Status**: Implementation Guide (Scenarios need to be created in Langflow UI)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Scenario A: Budget Overrun](#scenario-a-budget-overrun)
5. [Scenario B: Burnout Brake](#scenario-b-burnout-brake)
6. [Scenario C: Regulatory Deadbolt](#scenario-c-regulatory-deadbolt)
7. [Scenario D: Maturity Governor](#scenario-d-maturity-governor)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This document describes the 4 Langflow scenario workflows that implement **autonomous agent collaboration** via Logic Gates. These scenarios demonstrate how agents detect issues, trigger Logic Gates, and coordinate responses without human intervention.

### What Are Logic Gates?

Logic Gates are automated rules that:
- Monitor agent state continuously
- Trigger when specific conditions are met (e.g., budget overrun, burnout risk)
- Execute coordinated actions across multiple agents
- Call Langflow workflows to orchestrate complex responses

### The 4 Scenarios

| Scenario | Participants | Logic Gate | Purpose |
|----------|--------------|------------|---------|
| **A: Budget Overrun** | FinOps ↔ PMO ↔ VRO | Gate D | Block work when budget exceeded |
| **B: Burnout Brake** | OCM ↔ Planning ↔ TMO | Gate E | Reduce load when burnout risk detected |
| **C: Regulatory Deadbolt** | Risk ↔ Governance ↔ PMO | Gates A + C | Block releases for compliance issues |
| **D: Maturity Governor** | TMO ↔ PMO ↔ Planning | Gate B | Reduce load when team maturity low |

---

## Prerequisites

### Required Services

1. **Langflow**: Running at `http://localhost:7860` (or configure `LANGFLOW_BASE_URL`)
2. **Langflow API Key**: Set `LANGFLOW_API_KEY` in `.env`
3. **Database**: PostgreSQL with agent attributes tables
4. **MCP Integrations**: Jira, ServiceNow, Slack (optional but recommended)

### Environment Variables

```bash
# Langflow Configuration
LANGFLOW_BASE_URL=http://localhost:7860
LANGFLOW_API_KEY=your_api_key_here

# MCP Integrations (optional)
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_token

SERVICENOW_INSTANCE=your-instance.service-now.com
SERVICENOW_USERNAME=your_username
SERVICENOW_PASSWORD=your_password

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Agent Flow IDs

Reference the existing agent Flow IDs from `ALL_AGENTS_WIRED.md`:

```typescript
const AGENT_FLOW_IDS = {
  finops: '70d569d8-3e9c-4684-9227-ee4743d4be09',
  pmo: '27bc79cd-2302-4356-a039-3238de8218b8',
  vro: 'a5e06553-0e6b-42ed-9d68-5003b0c2a2be',
  ocm: '06ef7ded-63df-4ed7-8a90-9ad3e8ddeef9',
  planning: '6128dcc0-e61f-4853-96bc-42e483473059',
  tmo: 'be3ebfe5-ac51-456d-8b22-c7ff5d123ed4',
  risk: '9be34a7d-1a53-455e-ad22-6d94565c5a7e',
  governance: '5d29ac9d-fd49-4400-bdf2-8f7877ff0fa4'
};
```

---

## Architecture

### How Logic Gates Trigger Langflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Agent State Change (e.g., budget overrun detected)          │
│    └─> FinOps.actual_spend_to_date > allocated_budget          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Logic Gate Evaluation (AgentLogicGates.ts)                  │
│    └─> Gate D: Budget Overrun Circuit Breaker triggers         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Langflow Scenario Workflow Called                           │
│    └─> POST /api/v1/run/scenario-a-budget-overrun              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Langflow Orchestrates Multi-Agent Response                  │
│    ├─> Call /api/agent-actions/pmo/set-flow-status (Block)     │
│    ├─> Call /api/agent-actions/vro/recalculate-roi             │
│    ├─> Call /api/agent-actions/jira/create-issue               │
│    └─> Call /api/agent-actions/slack/notify                    │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints Used

All scenarios use these server API endpoints:

**Logic Gates:**
- `POST /api/logic-gates/evaluate` - Evaluate all gates
- `POST /api/logic-gates/execute` - Execute gate actions

**Agent Actions:**
- `POST /api/agent-actions/pmo/create-epic` - Create high-priority epic
- `POST /api/agent-actions/pmo/set-flow-status` - Block or unblock work
- `POST /api/agent-actions/planning/invalidate-capacity` - Invalidate capacity planning
- `POST /api/agent-actions/tmo/schedule-coaching` - Schedule coaching session
- `POST /api/agent-actions/vro/recalculate-roi` - Recalculate project ROI
- `POST /api/agent-actions/governance/block-gate` - Block release gate
- `POST /api/agent-actions/notify/{agent}` - Notify specific agent

**MCP Integrations:**
- `POST /api/agent-actions/jira/create-issue` - Create Jira ticket
- `POST /api/agent-actions/servicenow/create-incident` - Create ServiceNow incident
- `POST /api/agent-actions/slack/notify` - Send Slack notification

---

## Scenario A: Budget Overrun

**ID**: `scenario-a-budget-overrun`
**Participants**: FinOps ↔ PMO ↔ VRO
**Logic Gate**: Gate D - Budget Overrun Circuit Breaker
**Priority**: 95 (Critical)

### Business Purpose

Prevent runaway spending by automatically blocking work when budget is exceeded and forcing a data-driven decision on whether to continue.

### Trigger Condition

```typescript
IF FinOps.actual_spend_to_date > FinOps.allocated_budget
```

### Workflow Steps

1. **FinOps Agent** detects `actual_spend_to_date ($1.2M) > allocated_budget ($1.0M)`
2. **Logic Gate D** triggers and evaluates conditions
3. **Langflow Workflow** executes the following actions:
   - Call `POST /api/agent-actions/pmo/set-flow-status` with `{ flowStatus: "Blocked", reason: "Budget overrun" }`
   - Call `POST /api/agent-actions/vro/recalculate-roi` with `{ actualSpend: 1200000, allocatedBudget: 1000000 }`
   - Call `POST /api/agent-actions/jira/create-issue` with priority "Critical"
   - Call `POST /api/agent-actions/slack/notify` with `@channel` alert
4. **PMO** sets `flow_status = 'Blocked'` for the Epic
5. **VRO** recalculates `roi_realized` (e.g., drops from 2.5x to 1.8x)
6. Stakeholders receive notification and can review whether to continue

### Langflow Workflow Creation

**Create a new flow in Langflow UI:**

```
┌────────────┐
│   Input    │ - Receives payload from Logic Gate
│  Component │   { agent, action, projectId, actualSpend, allocatedBudget }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/pmo/set-flow-status
│    to PMO  │   Body: { projectId, flowStatus: "Blocked", reason: "Budget overrun" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/vro/recalculate-roi
│    to VRO  │   Body: { projectId, actualSpend, allocatedBudget }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/jira/create-issue
│   to Jira  │   Body: { projectKey, summary: "Budget Overrun", priority: "Critical" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/slack/notify
│  to Slack  │   Body: { channel: "#budget-alerts", text: "@channel Budget exceeded" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Output   │ - Return success/failure status
│  Component │   { success: true, epicBlocked: true, roiRecalculated: true }
└────────────┘
```

**Save the flow with ID**: `scenario-a-budget-overrun`

### Testing

```bash
# 1. Simulate budget overrun
curl -X POST http://localhost:5000/api/logic-gates/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "agentState": {
      "finops": {
        "actual_spend_to_date": 1200000,
        "allocated_budget": 1000000
      }
    }
  }'

# 2. Execute the triggered gate
curl -X POST http://localhost:5000/api/logic-gates/execute \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [...],
    "agentState": {...},
    "callLangflow": true,
    "projectId": "PRJ-123"
  }'

# 3. Verify Epic blocked
curl -X GET http://localhost:5000/api/projects/PRJ-123/status
# Expected: { flowStatus: "Blocked", reason: "Budget overrun" }
```

---

## Scenario B: Burnout Brake

**ID**: `scenario-b-burnout-brake`
**Participants**: OCM ↔ Planning ↔ TMO
**Logic Gate**: Gate E - Burnout Brake
**Priority**: 85 (High)

### Business Purpose

Protect human capital by automatically reducing workload when burnout risk is detected, preventing costly team attrition.

### Trigger Condition

```typescript
IF OCM.burnout_risk_idx > 0.85
```

### Workflow Steps

1. **OCM Agent** detects `burnout_risk_idx (0.87) > 0.85 threshold`
2. **Logic Gate E** triggers
3. **Langflow Workflow** executes:
   - Call `POST /api/agent-actions/planning/invalidate-capacity` with `{ reason: "High burnout risk" }`
   - Call `POST /api/agent-actions/tmo/schedule-coaching` with `{ teamId, reason: "Burnout prevention" }`
   - Call `POST /api/agent-actions/servicenow/create-incident` for HR intervention
   - Call `POST /api/agent-actions/slack/notify` to team leads
4. **Planning** flags `load_vs_capacity_ratio = null` (invalidated) for next PI
5. **TMO** schedules coaching session with Scrum Master and RTE
6. Team workload automatically reduced in next sprint planning

### Langflow Workflow Creation

```
┌────────────┐
│   Input    │ - { agent: "ocm", burnoutRiskIdx: 0.87, teamId, projectId }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/planning/invalidate-capacity
│ to Planning│   Body: { projectId, reason: "High burnout risk detected" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/tmo/schedule-coaching
│   to TMO   │   Body: { teamId, reason: "Burnout prevention" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/servicenow/create-incident
│ ServiceNow │   Body: { shortDescription: "Team Burnout Risk", priority: "2" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/slack/notify
│  to Slack  │   Body: { channel: "#team-health", text: "Burnout risk detected" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Output   │ - { success: true, capacityInvalidated: true, coachingScheduled: true }
└────────────┘
```

**Save the flow with ID**: `scenario-b-burnout-brake`

---

## Scenario C: Regulatory Deadbolt

**ID**: `scenario-c-regulatory-deadbolt`
**Participants**: Risk ↔ Governance ↔ PMO
**Logic Gates**: Gate A (Compliance-Risk Deadbolt) + Gate C (Audit-Ready Barrier)
**Priority**: 100 + 90 (Highest)

### Business Purpose

Prevent regulatory penalties by automatically blocking releases when compliance or security risks are detected and prioritizing remediation work.

### Trigger Conditions

**Gate A:**
```typescript
IF (Risk.exposure_value > $100K) OR (Governance.critical_vuln_count > 0)
```

**Gate C:**
```typescript
IF (Governance.audit_readiness < 90%) AND (Governance.regulatory_date < 30 days)
```

### Workflow Steps

1. **Risk Agent** updates `exposure_value = $150K` (new legal requirement)
2. **Logic Gate A** triggers (exposure > $100K threshold)
3. **Langflow Workflow** executes:
   - Call `POST /api/agent-actions/governance/block-gate` with `{ reason: "Legal exposure > $100K" }`
   - Call `POST /api/agent-actions/pmo/set-flow-status` with `{ flowStatus: "Analyzing" }` (move back from "Implementing")
   - Check if Gate C conditions met (audit_readiness < 90% AND regulatory_date < 30 days)
   - If yes: Call `POST /api/agent-actions/pmo/create-epic` with `{ title: "Compliance Debt Remediation", priority: "Highest" }`
   - Call `POST /api/agent-actions/jira/create-issue` with priority "P1"
   - Call `POST /api/agent-actions/slack/notify` with `@channel` critical alert
4. **Governance** sets `gate_status = 'Blocked'`
5. **PMO** moves Epic `flow_status` from "Implementing" → "Analyzing"
6. If audit deadline near, new "Compliance Debt" epic created at top of backlog

### Langflow Workflow Creation

```
┌────────────┐
│   Input    │ - { agent: "risk", exposureValue: 150000, auditReadiness: 75, regulatoryDate }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/governance/block-gate
│Governance  │   Body: { projectId, reason: "Legal exposure > $100K", severity: "critical" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/pmo/set-flow-status
│   to PMO   │   Body: { projectId, flowStatus: "Analyzing", reason: "Compliance gate blocked" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│ Condition  │ - IF auditReadiness < 90 AND daysToDeadline < 30
│   Check    │   THEN create epic
└─────┬──────┘
      │ TRUE
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/pmo/create-epic
│   to PMO   │   Body: { title: "Compliance Debt Remediation", priority: "Highest" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/jira/create-issue
│   to Jira  │   Body: { priority: "P1", summary: "Compliance gate blocked" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/slack/notify
│  to Slack  │   Body: { channel: "#compliance-alerts", text: "@channel CRITICAL: Release blocked" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Output   │ - { success: true, gateBlocked: true, epicCreated: true }
└────────────┘
```

**Save the flow with ID**: `scenario-c-regulatory-deadbolt`

---

## Scenario D: Maturity Governor

**ID**: `scenario-d-maturity-governor`
**Participants**: TMO ↔ PMO ↔ Planning
**Logic Gate**: Gate B - Maturity-Speed Governor
**Priority**: 80 (Medium)

### Business Purpose

Prevent delivery failures and burnout by automatically matching team workload to their actual capability level.

### Trigger Condition

```typescript
IF TMO.competency_score < 2.5
```

### Workflow Steps

1. **TMO Agent** assesses `competency_score = 2.2` (below 2.5 threshold)
2. **Logic Gate B** triggers
3. **Langflow Workflow** executes:
   - Call `POST /api/agent-actions/pmo/set-flow-status` with load reduction (multiply `sprint_load_factor` by 0.8)
   - Call `POST /api/agent-actions/planning/invalidate-capacity` with `{ reason: "Low team maturity" }`
   - Call `POST /api/agent-actions/tmo/schedule-coaching` with `{ reason: "Agile maturity training" }`
   - Call `POST /api/agent-actions/slack/notify` to Scrum Master
4. **PMO** reduces `sprint_load_factor` from 0.90 to 0.72 (20% reduction)
5. **Planning** recalculates `load_vs_capacity_ratio` from 85% to 68%
6. **TMO** books SAFe training and agile coaching sessions

### Langflow Workflow Creation

```
┌────────────┐
│   Input    │ - { agent: "tmo", competencyScore: 2.2, teamId, projectId }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  Calculate │ - newLoadFactor = currentLoadFactor * 0.8 (20% reduction)
│Load Factor │
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/pmo/set-flow-status
│   to PMO   │   Body: { projectId, sprint_load_factor: newLoadFactor, reason: "Low maturity" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/planning/invalidate-capacity
│ to Planning│   Body: { projectId, reason: "Load reduced due to low team maturity" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/tmo/schedule-coaching
│   to TMO   │   Body: { teamId, sessionType: "SAFe training", reason: "Maturity improvement" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│  HTTP POST │ - POST /api/agent-actions/slack/notify
│  to Slack  │   Body: { channel: "#scrum-masters", text: "Team load reduced - training scheduled" }
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Output   │ - { success: true, loadReduced: true, trainingScheduled: true }
└────────────┘
```

**Save the flow with ID**: `scenario-d-maturity-governor`

---

## Testing Guide

### Manual Testing

**1. Test Logic Gate Evaluation**

```bash
# Test Gate D: Budget Overrun
curl -X POST http://localhost:5000/api/logic-gates/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "agentState": {
      "finops": {
        "actual_spend_to_date": 1200000,
        "allocated_budget": 1000000
      }
    }
  }'

# Expected output:
{
  "evaluatedAt": "2026-01-29T12:00:00Z",
  "totalGatesEvaluated": 5,
  "triggeredCount": 1,
  "triggeredGates": [
    {
      "gateId": "gate-d-budget-overrun-circuit-breaker",
      "gateName": "Budget Overrun Circuit Breaker",
      "priority": 95,
      "actions": [...]
    }
  ]
}
```

**2. Test Langflow Scenario Execution**

```bash
# Directly call Langflow scenario
curl -X POST http://localhost:7860/api/v1/run/scenario-a-budget-overrun \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "input_value": "{\"agent\":\"finops\",\"projectId\":\"PRJ-123\",\"actualSpend\":1200000,\"allocatedBudget\":1000000}",
    "output_type": "chat",
    "input_type": "chat",
    "tweaks": {}
  }'
```

**3. Test End-to-End Flow**

```bash
# 1. Create test project with budget
# 2. Update FinOps agent state to exceed budget
# 3. Trigger Logic Gate evaluation
# 4. Verify PMO Epic is blocked
# 5. Verify Jira ticket created
# 6. Verify Slack notification sent
```

### Automated Testing

Create integration tests in `/server/tests/logic-gates.test.ts`:

```typescript
import { LogicGateEngine } from '../lib/AgentLogicGates';

describe('Logic Gate Scenarios', () => {
  it('should trigger Scenario A when budget overrun detected', async () => {
    const agentState = {
      finops: {
        actual_spend_to_date: 1200000,
        allocated_budget: 1000000
      }
    };

    const results = LogicGateEngine.evaluate(agentState);
    expect(results.some(r => r.gate.id === 'gate-d-budget-overrun-circuit-breaker')).toBe(true);
  });

  // Add tests for other scenarios...
});
```

---

## Troubleshooting

### Common Issues

**1. Langflow Not Available**

```
Error: [LogicGate] Langflow not available
```

**Solution:**
- Check Langflow is running: `curl http://localhost:7860`
- Verify `LANGFLOW_BASE_URL` in `.env`
- Logic Gates will degrade gracefully and still execute local actions

**2. API Endpoints Return 404**

```
Error: Cannot POST /api/agent-actions/pmo/create-epic
```

**Solution:**
- Verify server is built: `npm run build`
- Check routes are registered in `server/routes.ts`
- Restart server

**3. Langflow Flow Not Found**

```
Error: Flow scenario-a-budget-overrun not found
```

**Solution:**
- Create the flow in Langflow UI
- Save it with the exact ID specified
- Verify flow is published/enabled

**4. Jira/ServiceNow Integration Fails**

```
Error: Jira not configured
```

**Solution:**
- Set required env vars: `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
- Test credentials manually
- Scenarios will still work without MCP integrations (just won't create tickets)

### Debug Mode

Enable debug logging:

```bash
export DEBUG=logic-gates,langflow
npm run dev
```

View logs:

```bash
# Logic Gate triggers
tail -f logs/logic-gates.log

# Langflow calls
tail -f logs/langflow.log
```

---

## Next Steps

**Phase 2B Completion Checklist:**

- [x] API endpoints created (`/api/logic-gates/*`, `/api/agent-actions/*`)
- [x] Logic Gate Langflow integration wired (`AgentLogicGates.ts`)
- [x] Documentation created (`LANGFLOW_SCENARIOS.md`)
- [ ] **Scenario A** workflow created in Langflow UI
- [ ] **Scenario B** workflow created in Langflow UI
- [ ] **Scenario C** workflow created in Langflow UI
- [ ] **Scenario D** workflow created in Langflow UI

**To create the workflows:**

1. Open Langflow UI at `http://localhost:7860`
2. Create a new flow for each scenario
3. Follow the workflow diagrams in this document
4. Add HTTP POST components for each API endpoint
5. Save the flow with the exact ID specified
6. Test using the curl commands provided
7. Verify in production with real agent data

**Once all 4 scenarios are created, proceed to Phase 3: Build Dashboards**

---

**END OF DOCUMENTATION**
