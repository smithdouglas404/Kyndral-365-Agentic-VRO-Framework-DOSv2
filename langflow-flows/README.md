# Langflow Scenario Workflows - Import Instructions

## Files Created

✅ `scenario-a-budget-overrun.json` - Budget Overrun (FinOps ↔ PMO ↔ VRO)
✅ `scenario-b-burnout-brake.json` - Burnout Brake (OCM ↔ Planning ↔ TMO)
✅ `scenario-c-regulatory-deadbolt.json` - Regulatory Deadbolt (Risk ↔ Governance ↔ PMO)
✅ `scenario-d-maturity-governor.json` - Maturity Governor (TMO ↔ PMO ↔ Planning)

## How to Import (5 minutes)

### Step 1: Open DataStax Langflow

Navigate to: https://aws-us-east-2.langflow.datastax.com/

### Step 2: Import Each Flow

For each of the 4 JSON files:

1. Click **"New Flow"** or **"Import"** button
2. Select **"Import from JSON"**
3. Upload the JSON file
4. Click **"Save"**
5. **Copy the Flow ID** from the URL (e.g., `https://.../flows/abc-123-def`)

### Step 3: Save Flow IDs to .env

Add these to your `.env` file:

```bash
LANGFLOW_SCENARIO_A_ID=<paste-flow-id-here>
LANGFLOW_SCENARIO_B_ID=<paste-flow-id-here>
LANGFLOW_SCENARIO_C_ID=<paste-flow-id-here>
LANGFLOW_SCENARIO_D_ID=<paste-flow-id-here>
```

### Step 4: Test a Flow

```bash
curl -X POST "https://aws-us-east-2.langflow.datastax.com/lf/ed39ba15-ded9-4b54-9389-4f58e97b6a57/api/v1/run/FLOW_ID" \
  -H "Authorization: Bearer $LANGFLOW_API_KEY" \
  -H "X-DataStax-Current-Org: $LANGFLOW_ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "{\"projectId\":\"PRJ-123\",\"actualSpend\":1200000,\"allocatedBudget\":1000000}",
    "tweaks": {}
  }'
```

## What Each Flow Does

### Scenario A: Budget Overrun
**Trigger**: `FinOps.actual_spend_to_date > allocated_budget`
**Actions**:
1. Block PMO Epic (`POST /api/agent-actions/pmo/set-flow-status`)
2. Recalculate VRO ROI (`POST /api/agent-actions/vro/recalculate-roi`)
3. Create Jira ticket (optional)
4. Send Slack alert (optional)

### Scenario B: Burnout Brake
**Trigger**: `OCM.burnout_risk_idx > 0.85`
**Actions**:
1. Invalidate Planning capacity (`POST /api/agent-actions/planning/invalidate-capacity`)
2. Schedule TMO coaching (`POST /api/agent-actions/tmo/schedule-coaching`)
3. Create ServiceNow incident (optional)
4. Send Slack alert (optional)

### Scenario C: Regulatory Deadbolt
**Trigger**: `Risk.exposure_value > $100K OR Governance.critical_vuln_count > 0`
**Actions**:
1. Block Governance gate (`POST /api/agent-actions/governance/block-gate`)
2. Move PMO epic to Analyzing (`POST /api/agent-actions/pmo/set-flow-status`)
3. Create compliance epic (`POST /api/agent-actions/pmo/create-epic`)
4. Create Jira ticket (optional)
5. Send Slack alert (optional)

### Scenario D: Maturity Governor
**Trigger**: `TMO.competency_score < 2.5`
**Actions**:
1. Reduce PMO load by 20% (`POST /api/agent-actions/pmo/set-flow-status`)
2. Invalidate Planning capacity (`POST /api/agent-actions/planning/invalidate-capacity`)
3. Schedule TMO training (`POST /api/agent-actions/tmo/schedule-coaching`)
4. Send Slack alert (optional)

## Notes

- **MCP integrations (Jira, ServiceNow, Slack) are OPTIONAL** - flows will work without them
- Flows degrade gracefully if MCPs aren't configured
- Server endpoints are at `http://localhost:5000` (change if different)
- All flows call server API endpoints that are already built

## Next Steps

After importing:
1. Save flow IDs to `.env`
2. Test each flow
3. Verify Logic Gates trigger them correctly
4. Move to Phase 3: Build Dashboards
