# Camunda 8 Setup Guide

## Overview

Camunda 8 replaces `json-rules-engine` for agent collaboration rules. It provides:

- **DMN Decision Tables** - Visual rule builder for agent collaboration
- **BPMN Workflows** - Orchestrate complex inter-agent processes
- **Zeebe Engine** - High-performance workflow execution
- **Beautiful UI** - Camunda Modeler for visual design
- **Industry Standard** - Enterprise-grade, production-ready

---

## Why Camunda 8?

### Before (json-rules-engine)
```javascript
// JSON rule - hard to visualize
{
  "conditions": {
    "all": [
      { "fact": "cpi", "operator": "lessThan", "value": 0.70 },
      { "fact": "severity", "operator": "equal", "value": "high" }
    ]
  },
  "event": { "type": "notify-tmo" }
}
```

**Problems**:
- JSON-based (not visual)
- No built-in UI
- Limited workflow support
- Not industry standard

### After (Camunda 8 DMN)
```
┌──────────────────────────────────────────────────────────────────────┐
│ Agent Collaboration Decision Table                                    │
├──────────┬──────┬────────────┬──────────┬───────────┬──────────────┤
│ Source   │ CPI  │ Risk Score │ Severity │ Target    │ Priority     │
│ Agent    │      │            │          │ Agents    │              │
├──────────┼──────┼────────────┼──────────┼───────────┼──────────────┤
│ finops   │ <0.7 │     -      │ high     │ tmo,risk  │ urgent       │
│ finops   │ <0.85│     -      │ medium   │ tmo,vro   │ high         │
│ risk     │  -   │    >8      │ high     │ governance│ urgent       │
│ tmo      │  -   │     -      │ critical │ risk,plan │ high         │
└──────────┴──────┴────────────┴──────────┴───────────┴──────────────┘
```

**Benefits**:
- ✅ Visual decision tables
- ✅ Beautiful UI (Camunda Modeler)
- ✅ BPMN workflow support
- ✅ Industry standard (DMN/BPMN)
- ✅ Enterprise-grade

---

## Setup Options

### Option 1: Camunda Cloud (SaaS) - Recommended

**Why**: Easiest setup, managed infrastructure, free tier.

**Free Tier**:
- 1 cluster
- 5 workflow instances/day
- Perfect for development/testing

**Setup Steps**:

1. **Sign Up**
   ```
   Go to: https://camunda.com/sign-up/
   Create account (free tier)
   ```

2. **Create Cluster**
   ```
   Console → Clusters → Create New Cluster
   Name: "PMO-Agent-System"
   Plan: Free (Starter)
   Region: Choose closest (e.g., Belgium bru-2)
   Click "Create"
   ```

3. **Get Credentials**
   ```
   Clusters → Your Cluster → API

   Copy:
   - Client ID: xxxxxxxxx
   - Client Secret: xxxxxxxxx
   - Cluster ID: xxxxxxxxx
   - Region: bru-2
   - Zeebe Address: xxxxxxxxx.bru-2.zeebe.camunda.io:443
   ```

4. **Add to MCP Marketplace**
   ```
   Admin → MCP Marketplace → Add Integration

   Name: Camunda 8
   Type: Workflow Engine
   Base URL: [Zeebe Address from above]
   API Key: [Client Secret]

   Config (JSON):
   {
     "clientId": "your-client-id",
     "clusterId": "your-cluster-id",
     "region": "bru-2"
   }

   Test Connection → Save & Activate
   ```

5. **Deploy Decision Tables**
   ```bash
   # Upload DMN file via API or Camunda Console
   POST /api/admin/camunda/workflows/deploy
   {
     "bpmnXml": "<DMN XML content>",
     "resourceName": "agent-collaboration-decision.dmn"
   }
   ```

---

### Option 2: Self-Hosted (Docker)

**Why**: Full control, no cloud dependency, unlimited usage.

**Requirements**:
- Docker & Docker Compose
- 8GB RAM minimum
- Linux/Mac/Windows with WSL2

**Setup Steps**:

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     zeebe:
       image: camunda/zeebe:8.5
       environment:
         - ZEEBE_LOG_LEVEL=debug
       ports:
         - "26500:26500"
         - "9600:9600"
       volumes:
         - zeebe-data:/usr/local/zeebe/data

     operate:
       image: camunda/operate:8.5
       environment:
         - CAMUNDA_OPERATE_ZEEBE_GATEWAYADDRESS=zeebe:26500
       ports:
         - "8081:8080"
       depends_on:
         - zeebe

     tasklist:
       image: camunda/tasklist:8.5
       environment:
         - CAMUNDA_TASKLIST_ZEEBE_GATEWAYADDRESS=zeebe:26500
       ports:
         - "8082:8080"
       depends_on:
         - zeebe

   volumes:
     zeebe-data:
   ```

2. **Start Camunda**
   ```bash
   docker-compose up -d
   ```

3. **Verify**
   ```bash
   # Check Zeebe
   curl http://localhost:9600/ready

   # Access Operate UI
   http://localhost:8081
   Login: demo/demo

   # Access Tasklist UI
   http://localhost:8082
   Login: demo/demo
   ```

4. **Add to MCP Marketplace**
   ```
   Admin → MCP Marketplace → Add Integration

   Name: Camunda 8 (Self-Hosted)
   Type: Workflow Engine
   Base URL: localhost:26500
   API Key: none

   Config (JSON):
   {
     "selfHosted": true,
     "zeebeAddress": "localhost:26500"
   }

   Test Connection → Save & Activate
   ```

---

## Camunda Modeler Setup

**Camunda Modeler** is a desktop app for visual DMN/BPMN editing.

### Download & Install

```
1. Go to: https://camunda.com/download/modeler/
2. Download for your OS (Windows/Mac/Linux)
3. Install
4. Launch
```

### Create Decision Table

1. **New DMN Diagram**
   ```
   File → New File → DMN Diagram
   ```

2. **Create Decision Table**
   ```
   Add decision node
   Double-click → "Decision Table"
   Name: "Agent Collaboration Decision"
   ID: "agent-collaboration-decision"
   ```

3. **Add Inputs**
   ```
   Click "Add Input Column"

   Input 1:
   - Label: Source Agent
   - Type: string
   - Expression: sourceAgent

   Input 2:
   - Label: CPI
   - Type: number
   - Expression: cpi

   Input 3:
   - Label: Risk Score
   - Type: number
   - Expression: riskScore

   Input 4:
   - Label: Severity
   - Type: string
   - Expression: severity
   ```

4. **Add Outputs**
   ```
   Click "Add Output Column"

   Output 1:
   - Label: Should Collaborate
   - Name: shouldCollaborate
   - Type: boolean

   Output 2:
   - Label: Target Agents
   - Name: targetAgents
   - Type: string

   Output 3:
   - Label: Priority
   - Name: priority
   - Type: string
   ```

5. **Add Rules**
   ```
   Click "Add Rule"

   Rule 1: Critical Budget Overrun
   ┌──────────┬──────┬────────────┬──────────┬───────────┬───────────┬──────────┐
   │ finops   │ <0.7 │     -      │ high     │ true      │ tmo,risk  │ urgent   │
   └──────────┴──────┴────────────┴──────────┴───────────┴───────────┴──────────┘

   Rule 2: Moderate Budget Overrun
   ┌──────────┬──────┬────────────┬──────────┬───────────┬───────────┬──────────┐
   │ finops   │ <0.85│     -      │ medium   │ true      │ tmo,vro   │ high     │
   └──────────┴──────┴────────────┴──────────┴───────────┴───────────┴──────────┘

   Rule 3: High Risk
   ┌──────────┬──────┬────────────┬──────────┬───────────┬──────────────┬────────┐
   │ risk     │  -   │    >8      │ high     │ true      │ governance   │ urgent │
   └──────────┴──────┴────────────┴──────────┴───────────┴──────────────┴────────┘
   ```

6. **Save & Deploy**
   ```
   File → Save As → agent-collaboration-decision.dmn

   Deploy to Camunda:
   Deploy → Select cluster → Deploy
   ```

### Create BPMN Workflow

1. **New BPMN Diagram**
   ```
   File → New File → BPMN Diagram
   ```

2. **Design Workflow**
   ```
   Add:
   - Start Event: "Budget Overrun Detected"
   - Service Task: "Notify TMO Agent"
   - Parallel Gateway: Split into 3 paths
   - Service Task: "Notify Risk Agent"
   - Service Task: "Send Email"
   - Business Rule Task: "Evaluate Decision"
   - Parallel Gateway: Converge
   - User Task: "Approve Remediation"
   - Exclusive Gateway: Check approval
   - Service Task: "Execute Remediation" (if approved)
   - Service Task: "Escalate" (if rejected)
   - End Events
   ```

3. **Configure Service Tasks**
   ```
   Click service task → Properties panel

   Task: "Notify TMO Agent"
   - Type: notify-agent
   - Headers:
     - targetAgent: tmo
   ```

4. **Save & Deploy**
   ```
   File → Save As → budget-overrun-workflow.bpmn

   Deploy to Camunda:
   Deploy → Select cluster → Deploy
   ```

---

## Testing

### Test Decision Table

```bash
POST /api/admin/camunda/agent-collaboration/evaluate
{
  "sourceAgent": "finops",
  "cpi": 0.65,
  "riskScore": 3,
  "severity": "high"
}
```

**Expected Response**:
```json
{
  "success": true,
  "result": {
    "shouldCollaborate": true,
    "targetAgents": ["tmo", "risk", "governance"],
    "priority": "urgent",
    "actions": [
      { "type": "notify", "target": "tmo" },
      { "type": "notify", "target": "risk" },
      { "type": "escalate", "target": "governance" },
      { "type": "email", "target": "exec@company.com" }
    ]
  }
}
```

### Test Workflow

```bash
POST /api/admin/camunda/workflows/start
{
  "bpmnProcessId": "budget-overrun-workflow",
  "variables": {
    "projectId": "proj-123",
    "cpi": 0.65,
    "overrunAmount": 150000,
    "severity": "high"
  }
}
```

**Expected Response**:
```json
{
  "success": true,
  "instance": {
    "workflowInstanceKey": "2251799813685249",
    "bpmnProcessId": "budget-overrun-workflow",
    "version": 1
  }
}
```

### Monitor in Operate

```
1. Go to http://localhost:8081 (or Camunda Cloud Console)
2. Login
3. Click "Processes" → "budget-overrun-workflow"
4. See running instances
5. Click instance → View flow diagram
6. See current state (highlighted in blue)
```

---

## Integration with Agents

### Update Agent Orchestrator

The `AgentOrchestrator` will now call Camunda for collaboration decisions:

```typescript
// In AgentOrchestrator.ts
import { getCamunda8Service } from '../lib/Camunda8Service.js';

async executeAgentRequest(request: AgentRequest): Promise<AgentResponse> {
  // ... existing code ...

  // Check if collaboration needed
  const camunda = getCamunda8Service();
  const collaboration = await camunda.evaluateAgentCollaboration({
    sourceAgent: request.agentId,
    cpi: context.cpi,
    riskScore: context.riskScore,
    severity: context.severity,
  });

  if (collaboration.shouldCollaborate) {
    // Execute collaboration actions
    for (const action of collaboration.actions) {
      if (action.type === 'notify') {
        // Send message to target agent
      } else if (action.type === 'email') {
        // Send email via NotificationService
      } else if (action.type === 'escalate') {
        // Escalate to target agent
      }
    }
  }

  // ... rest of execution ...
}
```

---

## Example Decision Tables

We've included example DMN files in `docs/camunda/`:

### 1. Agent Collaboration Decision
**File**: `agent-collaboration-decision.dmn`

**What it does**: Decides which agents should collaborate based on metrics.

**Rules**:
- Critical budget overrun (CPI < 0.70) → Notify TMO, Risk, Governance
- Moderate overrun (CPI < 0.85) → Notify TMO, VRO
- High risk (score > 8) → Escalate to Governance
- Schedule slippage → Notify Risk, FinOps, Planning
- Value leakage (CPI < 0.90) → Notify FinOps, TMO

### 2. Budget Overrun Workflow
**File**: `budget-overrun-workflow.bpmn`

**What it does**: Orchestrates the full budget overrun response process.

**Steps**:
1. Start when budget overrun detected
2. Notify TMO Agent
3. Parallel actions:
   - Notify Risk Agent
   - Send email to exec
   - Evaluate DMN decision
4. Wait for all to complete
5. User task: Approve remediation plan
6. If approved → Execute remediation
7. If rejected → Escalate to Governance

---

## Deployment

### Deploy via API

```bash
# Deploy DMN decision table
curl -X POST http://localhost:5000/api/admin/camunda/workflows/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "bpmnXml": "<DMN XML content>",
    "resourceName": "agent-collaboration-decision.dmn"
  }'

# Deploy BPMN workflow
curl -X POST http://localhost:5000/api/admin/camunda/workflows/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "bpmnXml": "<BPMN XML content>",
    "resourceName": "budget-overrun-workflow.bpmn"
  }'
```

### Deploy via Modeler

```
Camunda Modeler → Deploy button → Select cluster → Deploy
```

### Deploy via Camunda Console

```
Camunda Cloud Console → Clusters → Your Cluster → Processes → Deploy
```

---

## Monitoring & Analytics

### Operate (Workflow Monitoring)

```
http://localhost:8081 (self-hosted)
or Camunda Cloud Console → Operate

Features:
- View running instances
- See workflow state
- Debug issues
- Cancel instances
- View variables
```

### Optimize (Analytics)

```
Camunda Cloud Console → Optimize

Features:
- Workflow performance metrics
- Decision table hit rates
- Bottleneck analysis
- Process mining
- KPIs and dashboards
```

---

## Advantages Over json-rules-engine

| Feature | json-rules-engine | Camunda 8 |
|---------|------------------|-----------|
| **Visual Editor** | ❌ JSON only | ✅ Beautiful DMN tables |
| **Workflows** | ❌ Not supported | ✅ BPMN workflows |
| **Monitoring** | ❌ No UI | ✅ Operate dashboard |
| **User Tasks** | ❌ Not supported | ✅ Tasklist for approvals |
| **Analytics** | ❌ DIY | ✅ Optimize built-in |
| **Industry Standard** | ❌ Custom format | ✅ DMN/BPMN standard |
| **Scalability** | ⚠️ Limited | ✅ Enterprise-grade |
| **Learning Curve** | ⚠️ Medium | ⚠️ Medium |
| **Cost** | ✅ Free | ✅ Free tier, paid at scale |

---

## Troubleshooting

### Connection Failed

**Error**: `Failed to connect to Camunda 8`

**Fix**:
```bash
# Check Zeebe is running
curl http://localhost:9600/ready

# Check credentials
GET /api/admin/camunda/topology

# Verify marketplace config
SELECT * FROM integrations WHERE name = 'camunda-8';
```

### Decision Not Found

**Error**: `Decision 'agent-collaboration-decision' not found`

**Fix**:
```bash
# Deploy decision table
POST /api/admin/camunda/workflows/deploy
{
  "bpmnXml": "<DMN content from file>",
  "resourceName": "agent-collaboration-decision.dmn"
}

# Verify deployment
GET /api/admin/camunda/topology
```

### Workflow Stuck

**Issue**: Workflow instance not progressing

**Fix**:
```
1. Go to Operate (http://localhost:8081)
2. Find instance
3. Check current state
4. Look for:
   - Missing job workers
   - Failed service tasks
   - Unresolved incidents
5. Resolve or cancel instance
```

---

## Summary

### What You Get:
- ✅ Visual decision tables (DMN)
- ✅ Workflow orchestration (BPMN)
- ✅ Beautiful Camunda Modeler
- ✅ Operate monitoring dashboard
- ✅ Tasklist for user tasks
- ✅ Industry-standard formats
- ✅ Enterprise-grade scalability

### Next Steps:
1. Sign up for Camunda Cloud (or run self-hosted)
2. Add to MCP Marketplace
3. Download Camunda Modeler
4. Create decision tables
5. Deploy and test
6. Monitor in Operate

**You now have enterprise-grade workflow automation!** 🎉
