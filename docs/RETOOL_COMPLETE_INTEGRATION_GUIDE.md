# Complete Retool Integration Guide

## Overview

This guide covers the complete integration between your Deep Agent system and Retool's platform. The integration leverages Retool's suite of tools while preserving your Deep Agents' autonomous intelligence.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  YOUR DEEP AGENTS                               │
│  ✓ Autonomous LLM-powered reasoning             │
│  ✓ Domain expertise (FinOps, Risk, TMO, VRO)    │
│  ✓ Multi-step planning & reflection             │
│  ✓ Agent-to-agent collaboration                 │
└─────────────────────────────────────────────────┘
          │
          │ A2A Protocol
          ↓
┌─────────────────────────────────────────────────┐
│  RETOOL PLATFORM                                │
│                                                 │
│  📚 Vectors: Knowledge base (RAG)               │
│  🤖 Agents: Simple task automation              │
│  🔄 Workflows: ETL, notifications, scheduling   │
│  🎨 Apps: Admin dashboards & interfaces         │
│  💾 Database: Managed PostgreSQL                │
└─────────────────────────────────────────────────┘
```

## Integration Components

### 1. A2A Protocol (Agent-to-Agent Communication)

**File:** `server/routes/a2a/agent-endpoints.ts`

Exposes your Deep Agents via the industry-standard A2A protocol.

**Endpoints:**
- `GET /a2a/agents` - List all available agents
- `GET /a2a/agents/:agentId/card` - Agent discovery (capabilities, schema)
- `POST /a2a/agents/:agentId/message` - Send task to agent (async)
- `GET /a2a/tasks/:taskId` - Poll task status
- `DELETE /a2a/tasks/:taskId` - Cancel task

**Features:**
- ✅ Async task execution
- ✅ SSE streaming support
- ✅ Task lifecycle management
- ✅ Automatic cleanup (keeps last 1000 tasks)

**Example: Retool Agent calls Deep Agent**
```javascript
// In Retool Workflow
const response = await fetch('https://your-domain.com/a2a/agents/deep-finops/message', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Analyze budget variance for Q4 projects',
    context: {
      projectId: 'proj_123',
      priority: 'high'
    }
  })
});

const { task_id } = await response.json();

// Poll for completion
const result = await fetch(`https://your-domain.com/a2a/tasks/${task_id}`);
```

### 2. Retool Vectors (RAG / Knowledge Base)

**File:** `server/integrations/RetoolVectorsClient.ts`

Provides RAG capabilities for your Deep Agents.

**Setup:**
1. Create vector database in Retool
2. Upload documents (PDFs, URLs, text files)
3. Configure environment variables:
```bash
RETOOL_INSTANCE_URL=https://yourcompany.retool.com
RETOOL_API_KEY=your_api_key
RETOOL_VECTOR_ID=your_vector_db_id
```

**How Deep Agents Use It:**

Automatic knowledge enrichment is built into `DeepAgentBase`:

```typescript
// server/agents/deep/DeepAgentBase.ts

protected async enrichContextWithKnowledge(goal: string, context: any) {
  // Queries Retool Vectors for relevant documents
  const relevantDocs = await vectorsClient.query({
    text: goal,
    topK: 3,
    filter: { domain: this.config.agentType }
  });

  return {
    ...context,
    knowledgeContext: relevantDocs,
    documentSources: relevantDocs.map(d => d.metadata.source)
  };
}
```

**Documents to Upload:**
- Regulatory compliance documents
- Financial policies
- Project management standards
- Risk assessment frameworks
- Historical project data

**Benefits:**
- ✅ Automatic chunking & embeddings (OpenAI)
- ✅ Context-aware agent responses
- ✅ Reduced hallucinations
- ✅ Auditable knowledge sources

### 3. Retool Workflows (Task Automation)

**File:** `server/integrations/RetoolWorkflowTrigger.ts`

Offloads deterministic tasks to Retool Workflows.

**Use Cases:**
- ✅ Email/Slack/Teams notifications
- ✅ ETL data pipelines
- ✅ Scheduled reports
- ✅ Data syncing
- ✅ Batch processing

**Example: Deep Agent triggers notification workflow**

```typescript
// In your Deep Agent
import { getRetoolWorkflowTrigger } from '../../integrations/RetoolWorkflowTrigger.js';

// Instead of hardcoded email logic
const workflowTrigger = getRetoolWorkflowTrigger();
await workflowTrigger.sendNotification({
  type: NotificationType.EMAIL,
  recipients: ['finops-lead@company.com'],
  subject: 'Budget Variance Alert',
  message: 'Project X budget variance exceeds 20%',
  severity: 'high',
  metadata: { projectId, variance }
});
```

**Workflow Types:**

1. **notification-handler** - Universal notification routing
   - Supports: Email, Slack, Teams, SMS, Webhooks
   - Retries on failure
   - Delivery tracking

2. **etl-data-sync** - Data synchronization
   - Source → Transform → Destination
   - Scheduled or event-driven
   - Error handling & rollback

3. **report-generator** - Automated reporting
   - Query data, generate report, distribute
   - Supports PDF, Excel, CSV
   - Custom templates

### 4. Webhook Endpoints (Retool → Your System)

**File:** `server/routes/webhooks/retool-workflows.ts`

Allows Retool to communicate back to your system.

**Endpoints:**
- `POST /webhooks/retool/workflow-complete` - Workflow completion callback
- `POST /webhooks/retool/trigger-agent` - Retool triggers Deep Agent
- `POST /webhooks/retool/etl-data` - ETL results
- `POST /webhooks/retool/agent-collaboration` - Retool Agent → Deep Agent
- `GET /webhooks/retool/health` - Health check

**Example: Retool Workflow completion**

```javascript
// In Retool Workflow (final step)
await fetch('https://your-domain.com/webhooks/retool/workflow-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflow_id: 'notification-handler',
    execution_id: workflowExecution.id,
    status: 'completed',
    result: { delivered: 5, failed: 0 }
  })
});
```

### 5. Retool Agent Router (Task Intelligence)

**File:** `server/integrations/RetoolAgentRouter.ts`

Intelligently routes tasks between Deep Agents, Retool Agents, and Workflows.

**Decision Logic:**

```typescript
import { RetoolAgentRouter, TaskCategory } from './RetoolAgentRouter.js';

// Automatic routing
const decision = RetoolAgentRouter.route({
  description: 'Analyze Q4 budget variance and recommend mitigation strategies',
  priority: 'high'
});

console.log(decision);
// {
//   routeTo: 'deep-agent',
//   agentId: 'deep-finops',
//   complexity: 'requires_expertise',
//   reasoning: 'Complex task requiring deep reasoning and domain expertise',
//   confidence: 0.95
// }

// Explicit category routing
const simpleTask = RetoolAgentRouter.route({
  description: 'Send notification to project stakeholders',
  category: TaskCategory.NOTIFICATION
});

console.log(simpleTask);
// {
//   routeTo: 'retool-agent',
//   complexity: 'simple',
//   reasoning: 'Category notification is deterministic and suitable for Retool Agent',
//   confidence: 0.95
// }
```

**Routing Rules:**

**→ Deep Agents** (Complex reasoning):
- Budget/financial analysis
- Risk assessment
- Strategic planning
- Multi-step coordination
- Cross-domain collaboration

**→ Retool Agents** (Simple tasks):
- Data entry
- Form processing
- CRUD operations
- Notifications (immediate)
- Basic queries

**→ Workflows** (Automated tasks):
- ETL pipelines
- Scheduled reports
- Batch processing
- Recurring tasks
- Data syncing

### 6. Retool Database (Managed PostgreSQL)

**Already Configured:** Your schema is in `shared/schema.ts`

**Migration:**
```bash
# Update DATABASE_URL to point to Retool-managed database
DATABASE_URL=retool_managed_postgres://...

# Run migrations
npm run db:push

# Seed collaboration rules
tsx scripts/seed-collaboration-rules.ts
```

**Benefits:**
- ✅ Retool's spreadsheet UI for data viewing
- ✅ No separate database hosting
- ✅ Built-in backups
- ✅ Your Deep Agents connect via standard PostgreSQL protocol

### 7. Retool Apps (Admin Dashboards)

**Use Retool's app builder for:**
- Collaboration rules management
- Agent activity monitoring
- KPI/OKR configuration
- Project health dashboards
- User management

**Setup Guide:** See `docs/RULES_ENGINE_SETUP_GUIDE.md`

## Complete Setup Steps

### Step 1: Environment Configuration

```bash
# .env
RETOOL_INSTANCE_URL=https://yourcompany.retool.com
RETOOL_API_KEY=your_api_key
RETOOL_VECTOR_ID=your_vector_database_id
RETOOL_WORKFLOW_API_KEY=your_workflow_api_key

# Optional: Use Retool Database
DATABASE_URL=retool_managed_postgres://...
```

### Step 2: Initialize Integrations

```typescript
// server/index.ts (or startup file)
import { initializeRetoolVectors } from './integrations/RetoolVectorsClient.js';
import { initializeRetoolWorkflow } from './integrations/RetoolWorkflowTrigger.js';
import { registerA2ARoutes } from './routes/a2a/agent-endpoints.js';
import { registerRetoolWorkflowWebhooks } from './routes/webhooks/retool-workflows.ts';

// Initialize Retool Vectors
if (process.env.RETOOL_API_KEY) {
  initializeRetoolVectors({
    apiKey: process.env.RETOOL_API_KEY,
    instanceUrl: process.env.RETOOL_INSTANCE_URL,
    vectorId: process.env.RETOOL_VECTOR_ID,
  });
}

// Initialize Retool Workflows
if (process.env.RETOOL_WORKFLOW_API_KEY) {
  initializeRetoolWorkflow({
    apiKey: process.env.RETOOL_WORKFLOW_API_KEY,
    instanceUrl: process.env.RETOOL_INSTANCE_URL,
  });
}

// Register A2A endpoints
registerA2ARoutes(app, storage);

// Register webhook endpoints
registerRetoolWorkflowWebhooks(app, storage);
```

### Step 3: Upload Knowledge Base

```typescript
// scripts/upload-knowledge-base.ts
import { getRetoolVectorsClient } from '../server/integrations/RetoolVectorsClient.js';

const client = getRetoolVectorsClient();

// Upload regulatory documents
await client.upload({
  content: fs.readFileSync('docs/financial-compliance.pdf'),
  metadata: {
    source: 'financial-compliance.pdf',
    domain: 'financial_intelligence',
    type: 'policy'
  }
});

// Upload URLs
await client.uploadUrl('https://company.com/project-standards', {
  domain: 'schedule_intelligence',
  type: 'standards'
});
```

### Step 4: Create Retool Workflows

**In Retool:**

1. Create "notification-handler" workflow:
   - Trigger: Webhook
   - Steps: Route notification → Send email/Slack/Teams → Log result
   - Callback: POST to `/webhooks/retool/workflow-complete`

2. Create "etl-data-sync" workflow:
   - Trigger: Schedule (daily)
   - Steps: Extract from source → Transform → Load to destination
   - Callback: POST to `/webhooks/retool/etl-data`

3. Create "report-generator" workflow:
   - Trigger: Schedule (weekly)
   - Steps: Query DB → Generate PDF → Email stakeholders

### Step 5: Configure A2A in Retool

**In Retool Agent Builder:**

1. Add "External Agent" tool
2. Configure A2A endpoint: `https://your-domain.com/a2a`
3. Add API key authentication
4. Test connection to Deep Agents

## Usage Examples

### Example 1: Deep Agent with Knowledge Context

```typescript
// Deep Agent automatically gets knowledge context
const result = await deepFinOpsAgent.run(
  'Analyze budget compliance for project X',
  { projectId: 'proj_x' }
);

// Agent receives:
// {
//   projectId: 'proj_x',
//   knowledgeContext: [
//     { content: '...financial policy excerpt...', source: 'policy.pdf', relevance: 0.92 },
//     { content: '...compliance standards...', source: 'standards.pdf', relevance: 0.85 }
//   ]
// }
```

### Example 2: Task Routing

```typescript
import { RetoolAgentRouter } from './integrations/RetoolAgentRouter.js';

// Intelligent routing
const tasks = [
  'Analyze Q4 budget variance',           // → Deep Agent (FinOps)
  'Send notification to stakeholders',     // → Retool Agent
  'Generate weekly status report',         // → Workflow
  'Assess project delivery risk',          // → Deep Agent (Risk)
];

tasks.forEach(description => {
  const decision = RetoolAgentRouter.route({ description });
  console.log(`${description} → ${decision.routeTo} (${decision.reasoning})`);
});
```

### Example 3: Workflow Trigger

```typescript
// Deep Agent detects issue and triggers workflow
if (budgetVariance > 20) {
  const workflowTrigger = getRetoolWorkflowTrigger();

  await workflowTrigger.trigger({
    workflowId: 'budget-alert-escalation',
    data: {
      projectId,
      variance: budgetVariance,
      severity: 'critical',
      detected_by: 'deep-finops'
    },
    async: true
  });
}
```

## Benefits Summary

### For Deep Agents:
- ✅ Access to knowledge base (RAG)
- ✅ Offload mundane tasks (notifications, ETL)
- ✅ Focus on complex reasoning
- ✅ Better context for decisions

### For Business Users:
- ✅ Visual dashboards (Retool Apps)
- ✅ Edit rules without code (Retool Database UI)
- ✅ Monitor workflows (Retool Workflows UI)
- ✅ Single platform for admin tasks

### For System:
- ✅ Reduced hardcoded logic
- ✅ Better separation of concerns
- ✅ Industry-standard protocols (A2A)
- ✅ Scalable architecture

## Monitoring & Debugging

### Check Integration Status

```bash
# Test A2A endpoints
curl https://your-domain.com/a2a/agents

# Test Retool Vectors
curl https://your-domain.com/api/vectors/stats

# Test webhook health
curl https://your-domain.com/webhooks/retool/health
```

### Common Issues

**1. Retool Vectors returns empty results**
- Check `RETOOL_VECTOR_ID` is correct
- Verify documents are uploaded
- Check API key permissions

**2. Workflow not triggering**
- Verify webhook URL is correct in Retool
- Check firewall/security settings
- Test with curl first

**3. A2A connection fails**
- Verify API key is valid
- Check agent is registered
- Test with Postman/curl

## Files Created/Modified

**New Files:**
- `server/routes/a2a/agent-endpoints.ts` - A2A protocol endpoints
- `server/integrations/RetoolVectorsClient.ts` - RAG integration
- `server/integrations/RetoolWorkflowTrigger.ts` - Workflow triggers
- `server/routes/webhooks/retool-workflows.ts` - Webhook handlers
- `server/integrations/RetoolAgentRouter.ts` - Task routing logic

**Modified Files:**
- `server/agents/deep/DeepAgentBase.ts` - Added knowledge enrichment
- `shared/schema.ts` - Added `agent_collaboration_rules` table
- `server/lib/AgentCollaborationRulesEngine.ts` - Removed ensureTables()

## Next Steps

1. ✅ Set up Retool account
2. ✅ Configure environment variables
3. ✅ Upload knowledge base documents
4. ✅ Create workflows in Retool
5. ✅ Build admin dashboards in Retool Apps
6. ✅ Test A2A integration
7. ✅ Monitor agent activity

## Support Resources

- [Retool Documentation](https://docs.retool.com)
- [A2A Protocol Spec](https://a2a-protocol.org/latest/)
- [Retool Vectors Guide](https://docs.retool.com/data-sources/quickstarts/retool-vectors)
- [Retool Workflows Guide](https://docs.retool.com/workflows)
- [Agent-to-Agent Communication](https://docs.retool.com/agents/concepts/a2a)
