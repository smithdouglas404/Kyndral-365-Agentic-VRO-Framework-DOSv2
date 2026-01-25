# Agent Collaboration Rules Engine - Setup Guide

## Overview

The Agent Collaboration Rules Engine enables business users to configure dynamic rules for inter-agent collaboration through a low-code Retool interface.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  RETOOL (External Admin Dashboard)              │
│  - Table: List all collaboration rules          │
│  - Form: Edit thresholds/conditions             │
│  - Buttons: Test, Publish                       │
└─────────────────────────────────────────────────┘
          │
          │ REST API calls
          ▼
   GET /api/admin/collaboration-rules
   PUT /api/admin/collaboration-rules/:id
   POST /api/admin/collaboration-rules/test
   POST /api/admin/collaboration-rules/reload
          │
          ▼
   PostgreSQL: agent_collaboration_rules
          │
          ▼
   AgentCollaborationRulesEngine.loadRules()
          │
          ▼
   Deep Agents evaluate rules dynamically
```

## Database Setup

### 1. Create the Table

The table schema is defined in `shared/schema.ts` (lines 1561-1587):

```typescript
export const agentCollaborationRules = pgTable("agent_collaboration_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  priority: integer("priority").default(5),
  sourceAgent: text("source_agent").notNull(),
  conditions: text("conditions").notNull(), // JSON
  actions: text("actions").notNull(), // JSON
  createdBy: text("created_by").notNull(),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**To create the table:**

```bash
npm run db:push
```

This will sync the Drizzle schema to your PostgreSQL database.

### 2. Seed Default Rules

Default rules are defined in the attribute files:
- `server/agents/attributes/FinOpsAgentAttributes.ts` → `FINOPS_DEFAULT_RULES`
- `server/agents/attributes/RiskAgentAttributes.ts` → `RISK_DEFAULT_RULES`
- `server/agents/attributes/TMOAgentAttributes.ts` → `TMO_DEFAULT_RULES`
- `server/agents/attributes/VROAgentAttributes.ts` → `VRO_DEFAULT_RULES`
- `server/agents/attributes/PMOAgentAttributes.ts` → `PMO_DEFAULT_RULES`
- `server/agents/attributes/OCMAgentAttributes.ts` → `OCM_DEFAULT_RULES`

**To seed the table:**

```bash
tsx scripts/seed-collaboration-rules.ts
```

This populates the table with ~30-40 default rules covering common scenarios like:
- Budget variance alerts
- Schedule delays
- Risk escalations
- Value realization tracking

## API Endpoints

The REST API is implemented in `server/routes/admin/collaboration-rules.ts`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/collaboration-rules` | List all rules |
| GET | `/api/admin/collaboration-rules/:id` | Get specific rule |
| POST | `/api/admin/collaboration-rules` | Create new rule (admin only) |
| PATCH | `/api/admin/collaboration-rules/:id` | Update rule (admin only) |
| DELETE | `/api/admin/collaboration-rules/:id` | Delete rule (admin only) |
| POST | `/api/admin/collaboration-rules/reload` | Reload rules into engine |

**Authentication:** All endpoints require authentication. Create/Update/Delete require `system_admin` role.

## Retool Setup

### Prerequisites
1. Sign up at [retool.com](https://retool.com) (free for <5 users)
2. Create API key: Settings → API & Webhooks

### Configure MCP Connector

In your application's admin panel:

1. Navigate to **MCP Servers** or **Integrations**
2. Find "Retool Internal Tools" in the list
3. Click **Activate** and configure:
   - **Instance URL**: Your Retool URL (e.g., `https://yourcompany.retool.com`)
   - **API Key**: Generate from Retool Settings → API & Webhooks
   - **App ID** (optional): Specific Retool app for collaboration rules

### Build the Retool Dashboard

#### 1. Create New App

In Retool:
1. Click **Create New** → **App**
2. Name it "Agent Collaboration Rules Manager"

#### 2. Add Database Resource

1. Click **Resources** → **Create New**
2. Choose **PostgreSQL**
3. Configure connection:
   ```
   Host: <your-db-host>
   Port: 5432
   Database: <your-db-name>
   User: <db-user>
   Password: <db-password>
   SSL: Required
   ```
4. Test connection and save

#### 3. Build the UI

**Components to add:**

**a) Table Component (List Rules)**
```javascript
// Query: listRules
SELECT id, name, description, enabled, priority, source_agent,
       execution_count, last_executed, created_at
FROM agent_collaboration_rules
ORDER BY priority DESC, created_at DESC
```

Configure table:
- Enable row selection
- Add "Edit" button → Opens form
- Add "Delete" button → Confirms deletion

**b) Form Component (Edit Rule)**
```javascript
// Fields:
- name (Text Input)
- description (Text Area)
- enabled (Toggle)
- priority (Number Input, 1-10)
- source_agent (Dropdown: finops, tmo, vro, risk, pmo, ocm)
- conditions (JSON Editor)
- actions (JSON Editor)
```

**c) Action Buttons**

Test Button:
```javascript
// Query: testRule
{{ restApiResource.run({
  method: 'POST',
  url: '/api/admin/collaboration-rules/test',
  body: {
    conditions: form.data.conditions,
    facts: { /* test data */ }
  }
})}}
```

Publish Button:
```javascript
// Query: updateRule
{{ restApiResource.run({
  method: 'PATCH',
  url: `/api/admin/collaboration-rules/${table.selectedRow.id}`,
  body: form.data
})}}

// Then reload rules engine:
{{ restApiResource.run({
  method: 'POST',
  url: '/api/admin/collaboration-rules/reload'
})}}
```

#### 4. Add REST API Resource

In Retool Resources:
1. Create **REST API** resource
2. Base URL: `https://your-app-domain.com`
3. Add headers:
   ```
   Authorization: Bearer {{ user.authToken }}
   Content-Type: application/json
   ```

## How It Works

### Rule Structure

```json
{
  "id": "finops-high-variance",
  "name": "High Budget Variance Alert",
  "description": "Alert when budget variance exceeds 20%",
  "enabled": true,
  "priority": 8,
  "sourceAgent": "finops",
  "conditions": [
    {
      "attribute": "variance",
      "operator": ">",
      "threshold": 20
    }
  ],
  "actions": [
    {
      "type": "alert",
      "targetAgents": ["risk"],
      "severity": "high",
      "message": "Budget variance exceeds 20% - risk assessment needed"
    }
  ]
}
```

### Rule Evaluation

When a Deep Agent runs:

1. **Collect Metrics**: Agent gathers current project metrics (CPI, SPI, variance, etc.)
2. **Evaluate Rules**: Calls `agent.evaluateRules(metrics)`
3. **Check Conditions**: Each rule's conditions are evaluated
4. **Trigger Actions**: If all conditions match, execute the rule's actions

Example:
```typescript
// DeepFinOpsAgent evaluates budget variance
const metrics = {
  variance: 25,
  burnRate: 150,
  budgetHealth: 'critical'
};

const results = agent.evaluateRules(metrics);
// Returns: [{ rule: "finops-high-variance", triggered: true, ... }]
```

### Supported Operators

- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `==` - Equal to
- `!=` - Not equal to

### Supported Actions

- `alert` - Send alert to target agents
- `escalate` - Escalate to governance/management
- `trigger_agent` - Activate another agent
- `notify` - Send notification to users
- `send_email` - Send email notification
- `create_task` - Create task in project management system

## Files Modified

1. **shared/schema.ts** - Added `agentCollaborationRules` table
2. **server/lib/AgentCollaborationRulesEngine.ts** - Removed `ensureTables()` (now uses Drizzle schema)
3. **server/agents/deep/DeepFinOpsAgent.ts** - Added `evaluateRules()` method
4. **server/agents/deep/DeepRiskAgent.ts** - Added `evaluateRules()` method
5. **server/agents/deep/DeepTMOAgent.ts** - Added `evaluateRules()` method
6. **server/agents/deep/DeepVROAgent.ts** - Added `evaluateRules()` method
7. **server/agents/ContinuousOrchestrator.ts** - Replaced hardcoded logic with rule evaluation
8. **scripts/seed-collaboration-rules.ts** - Created seed script

## Testing

### 1. Verify Table Creation

```sql
SELECT * FROM agent_collaboration_rules LIMIT 5;
```

### 2. Test API Endpoints

```bash
# List all rules
curl http://localhost:5000/api/admin/collaboration-rules \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific rule
curl http://localhost:5000/api/admin/collaboration-rules/finops-high-variance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update rule
curl -X PATCH http://localhost:5000/api/admin/collaboration-rules/finops-high-variance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Reload rules engine
curl -X POST http://localhost:5000/api/admin/collaboration-rules/reload \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Rule Evaluation

Start the continuous orchestrator and watch the logs:

```bash
npm run dev
```

Look for:
```
[DeepFinOps] Rule triggered: High Budget Variance Alert
[RulesEngine] Rule triggered: finops-high-variance
```

## Troubleshooting

### Table doesn't exist
```bash
npm run db:push
```

### Rules not loading
```bash
# Check if table has data
SELECT COUNT(*) FROM agent_collaboration_rules;

# If empty, run seed script
tsx scripts/seed-collaboration-rules.ts
```

### Rules engine not evaluating
Check that Deep Agents are importing the rules:
```typescript
import { FINOPS_DEFAULT_RULES } from "../attributes/FinOpsAgentAttributes.js";
```

### Retool can't connect
1. Verify database credentials in Retool Resource settings
2. Check network access (whitelist Retool IPs if needed)
3. Test REST API endpoints with Postman first

## Next Steps

1. ✅ Create table: `npm run db:push`
2. ✅ Seed rules: `tsx scripts/seed-collaboration-rules.ts`
3. ⏳ Configure Retool instance
4. ⏳ Build Retool dashboard
5. ⏳ Test rule creation/editing through Retool
6. ⏳ Monitor rule execution in production

## Resources

- Retool Documentation: https://docs.retool.com
- MCP Server Registry: `server/mcp/MCPServerRegistry.ts` (line 1298)
- Default Rules: `server/agents/attributes/*AgentAttributes.ts`
- API Routes: `server/routes/admin/collaboration-rules.ts`
