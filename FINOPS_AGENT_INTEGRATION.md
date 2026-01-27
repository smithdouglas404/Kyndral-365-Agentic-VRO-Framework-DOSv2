# FinOps Agent → Langflow Integration

## Current State

FinOps agent has hardcoded Jira calls:

**File:** `server/agents/deep/DeepFinOpsAgent.ts`
**Lines:** ~78-96

```typescript
if (variance > 20) {
  console.log(`[DeepFinOps] CRITICAL: Project ${project.name} is ${variance.toFixed(1)}% over budget`);

  await this.learn(`project_${projectId}_budget_overrun`, {
    variance,
    budget,
    actualCost,
    detectedAt: new Date(),
  });

  await this.archiveContext(
    `Project ${project.name} detected with ${variance.toFixed(1)}% budget overrun (critical threshold exceeded)`,
    {
      projectId,
      variance,
      severity: 'critical',
    }
  );
}
```

---

## After Langflow Flow Created

### Step 1: Get Flow ID from Langflow
After creating "FinOps Budget Alert" flow in Langflow UI, copy the Flow ID.

Example: `abc123-def456-ghi789`

### Step 2: Update FinOps Agent Code

Replace the hardcoded logic with Langflow call:

```typescript
if (variance > 20) {
  console.log(`[DeepFinOps] CRITICAL: Project ${project.name} is ${variance.toFixed(1)}% over budget`);

  // Archive learning (keep this)
  await this.learn(`project_${projectId}_budget_overrun`, {
    variance,
    budget,
    actualCost,
    detectedAt: new Date(),
  });

  // Call Langflow flow for orchestrated response
  const flowResult = await this.orchestrator.executeLangflowFlow(
    'YOUR_FLOW_ID_HERE',  // Replace with actual Flow ID
    {
      projectId,
      projectName: project.name,
      budgetVariance: variance / 100,  // Convert to decimal
      currentBudget: budget,
      actualSpent: actualCost,
      severity: variance > 30 ? 'critical' : 'high',
    },
    'finops'  // Agent ID
  );

  if (flowResult.success) {
    console.log(`[DeepFinOps] Langflow flow executed: ${flowResult.flowId}`);
    console.log(`[DeepFinOps] Actions taken:`, flowResult.outputs);
  } else {
    console.error(`[DeepFinOps] Langflow flow failed:`, flowResult.error);
  }

  // Archive context (keep this)
  await this.archiveContext(
    `Project ${project.name} detected with ${variance.toFixed(1)}% budget overrun (critical threshold exceeded)`,
    {
      projectId,
      variance,
      severity: 'critical',
      langflowResult: flowResult,
    }
  );
}
```

### Step 3: Add to .env (Optional - for reference)

```bash
# Langflow Flow IDs
LANGFLOW_FLOW_FINOPS_BUDGET_ALERT=YOUR_FLOW_ID_HERE
LANGFLOW_FLOW_TMO_SCHEDULE_DELAY=
LANGFLOW_FLOW_RISK_ESCALATION=
```

### Step 4: Rebuild and Test

```bash
npm run build
# Restart server
# Trigger FinOps agent or wait for scan
```

---

## What Happens When Triggered

1. **FinOps agent detects** budget variance > 20%
2. **Calls Langflow flow** with project data
3. **Langflow executes:**
   - Creates Jira ticket in PMO project
   - Sends Slack notification to #budget-alerts
   - Notifies TMO agent via HTTP
4. **Returns result** to FinOps agent
5. **FinOps logs outcome** in memory and context

---

## Benefits

### Before (Hardcoded)
```typescript
// To change Jira project or priority:
// 1. Edit TypeScript code
// 2. Rebuild
// 3. Restart server
// 4. Test
```

### After (Langflow)
```
// To change Jira project or priority:
// 1. Edit flow in Langflow UI
// 2. Click Save
// 3. Done (no rebuild/restart)
```

---

## Next Steps

1. **Create flow in Langflow UI** (see main guide)
2. **Get Flow ID**
3. **Send me the Flow ID** → I'll update the agent code
4. **Test it** by triggering budget variance

---

## Other Agents to Integrate

Once FinOps works, create flows for:

- **TMO Schedule Delay** → ServiceNow + Slack + FinOps notification
- **Risk Escalation** → Jira Critical + Multi-agent alert
- **VRO Value Gap** → Monday.com + Stakeholder email
- **Weekly Synthesis** → Aggregate all agents + Store in DB
