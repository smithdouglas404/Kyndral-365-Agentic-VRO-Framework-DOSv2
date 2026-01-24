# System Activation Guide

## Complete Setup in 4 Steps

### 1. Install Dependencies

```bash
npm install
```

**What it installs**:
- `nodemailer` - Email sending
- `json-rules-engine` - Collaboration rules
- All other dependencies

---

### 2. Run Database Migrations

```bash
npm run db:push
```

**What it creates**:
- `agent_setup_config` - Agent enabled/disabled status
- `agent_mcp_mappings` - Agent-to-MCP-tool assignments
- `agent_llm_strategies` - LLM model routing per agent
- `llm_cost_settings` - Budget limits and alerts
- `agent_collaboration_rules` - Inter-agent collaboration rules
- `notification_logs` - Email/Slack/Teams notification history
- `in_app_notifications` - User notifications
- `agent_execution_logs` - Agent request history

---

### 3. Configure Integrations in MCP Marketplace

Go to **Admin → MCP Marketplace** and configure:

#### A. Email Provider (Choose One)

**Option 1: SendGrid (Recommended)**
- Free tier: 100 emails/day
- Configuration:
  - API Key: Get from SendGrid dashboard
  - From Email: `noreply@yourcompany.com`
- See: [docs/EMAIL_NOTIFICATION_SETUP.md](./EMAIL_NOTIFICATION_SETUP.md)

**Option 2: Gmail SMTP (Quickest)**
- Use existing Gmail account
- Configuration:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Username: Your Gmail address
  - Password: Generate App Password from Google Account settings

**Option 3: Mailgun**
- Free tier: 5,000 emails/month (3 months)
- Good for high volume

**Option 4: AWS SES**
- Cheapest at scale ($0.10 per 1,000 emails)
- Best for AWS users

#### B. Data Sources (Optional)

**ClickHouse** (for PMO/TMO agents)
- Portfolio analytics
- Historical project data
- Configuration: Connection string + credentials

**Weaviate** (for Risk/TMO agents)
- Vector search for RCA documents
- Semantic search for lessons learned
- Configuration: Weaviate Cloud or self-hosted URL + API key

**Neo4j** (for TMO agent)
- Project dependency mapping
- Knowledge graph queries
- Configuration: Neo4j URL + username/password

#### C. Communication (Optional)

**Slack**
- Configuration: Incoming webhook URL
- Get from: https://api.slack.com/apps

**Microsoft Teams**
- Configuration: Incoming webhook URL
- Get from: Teams channel → Connectors

---

### 4. Configure Agents in Setup Wizard

Go to **Admin → Agent Setup Wizard**

#### Step 1: Enable Agents

Select which agents to activate:
- ☑ Governance Agent - Policy compliance, approvals
- ☑ Risk Agent - Risk assessment, RCA analysis
- ☑ FinOps Agent - Budget tracking, cost analysis
- ☑ TMO Agent - Transformation strategy, dependency mapping
- ☑ VRO Agent - Value realization, ROI tracking
- ☑ Planning Agent - Project planning, resource allocation
- ☑ OCM Agent - Change management, stakeholder communication
- ☑ PMO Agent - Portfolio analytics, governance oversight
- ☑ OKR Agent - Objective and key result tracking

#### Step 2: Assign MCP Tools

For each enabled agent, assign relevant tools:

**Governance Agent**:
- ☑ project-knowledge-graph (Neo4j)
- ☑ sequential-thinking
- ☑ filesystem
- ☑ semgrep (code scanning)
- ☑ sendgrid (email notifications)

**Risk Agent**:
- ☑ weaviate (RCA search)
- ☑ sequential-thinking
- ☑ filesystem
- ☑ sentry (error tracking)
- ☑ sendgrid (email notifications)
- ☑ slack (team alerts)

**FinOps Agent**:
- ☑ quickbooks
- ☑ dynamics-365-erp
- ☑ clickhouse (data warehouse)
- ☑ filesystem
- ☑ sendgrid (email notifications)

**TMO Agent**:
- ☑ project-knowledge-graph (Neo4j)
- ☑ sequential-thinking
- ☑ weaviate (strategy docs)
- ☑ clickhouse (portfolio data)
- ☑ filesystem
- ☑ sendgrid (email notifications)
- ☑ microsoft-teams (stakeholder updates)

**VRO Agent**:
- ☑ dynamics-365-erp
- ☑ greptimedb (time series data)
- ☑ clickhouse (value metrics)
- ☑ financial-datasets
- ☑ sendgrid (email notifications)

**PMO Agent**:
- ☑ clickhouse (portfolio analytics)
- ☑ filesystem
- ☑ jira_cloud
- ☑ asana
- ☑ sendgrid (email notifications)

#### Step 3: Configure LLM Strategy

System automatically configures optimal LLM routing:
- **Premium tasks** (policy interpretation, risk assessment): Claude Opus 4 / GPT-4
- **Standard tasks** (analysis, reporting): Claude Sonnet 4.5 / GPT-4o
- **Budget tasks** (searches, data extraction): Llama 3.1 70B / Mistral

You can customize per agent if needed.

#### Step 4: Set Cost Limits

Configure budget controls:
- **Daily Budget**: $50 (default)
- **Monthly Budget**: $1,000 (default)
- **Alert Threshold**: 80% (default)
- **Downgrade on Limit**: Yes (automatically use budget models when limit reached)

#### Step 5: Review & Save

Review configuration and click **Save & Activate**.

**What happens**:
1. Configuration saves to database
2. Agent Orchestrator automatically reloads (no manual reload needed!)
3. Agents are now active with assigned tools
4. MCP connectors initialize for each tool
5. System is ready to accept agent requests

---

## Verification

### 1. Check Enabled Agents

```bash
GET /api/agents/enabled
```

Expected response:
```json
{
  "success": true,
  "agents": [
    {
      "id": "governance",
      "name": "Governance Agent",
      "enabled": true,
      "mcpServers": ["project-knowledge-graph", "filesystem", "sendgrid"],
      "llmStrategy": [...]
    },
    ...
  ]
}
```

### 2. Test Email Sending

```bash
POST /api/notifications/email
{
  "to": "your-email@example.com",
  "subject": "Test from PMO System",
  "body": "Email is working!"
}
```

### 3. Execute Agent Request

```bash
POST /api/agents/execute
{
  "agentId": "governance",
  "taskType": "policy_interpretation",
  "prompt": "What are the approval requirements for projects over $1M?"
}
```

Expected response:
```json
{
  "success": true,
  "response": {
    "agentId": "governance",
    "content": "Based on company policy...",
    "model": "anthropic/claude-opus-4",
    "tokensUsed": 1234,
    "cost": 0.0234,
    "latency": 3500,
    "toolsUsed": ["project-knowledge-graph", "filesystem"],
    "triggersExecuted": 0
  }
}
```

### 4. Check Collaboration Rules

```bash
GET /api/admin/collaboration-rules
```

Should return any defined inter-agent collaboration rules.

---

## What's Activated Now

### ✅ Agent Orchestration
- 9 specialized agents
- MCP tool connections
- LLM routing with cost optimization
- Automatic failover

### ✅ Email & Notifications
- SendGrid/Mailgun/AWS SES/SMTP integration
- Slack webhooks
- Microsoft Teams webhooks
- In-app notifications

### ✅ Knowledge Base
- Agent-tagged documents
- Trigger-based auto-attachment
- Semantic search
- Form schemas

### ✅ Collaboration Rules
- User-defined rules engine
- AI-driven reasoning (coming soon)
- Pattern-based learning (coming soon)

### ✅ Cost Management
- Budget tracking
- Alert thresholds
- Auto-downgrade to budget models
- Per-agent cost reporting

---

## Common Workflows

### Workflow 1: Budget Overrun Detection

**Trigger**: FinOps Agent detects CPI < 0.70

**What Happens**:
1. Collaboration rule fires
2. Email sent to exec team (via SendGrid)
3. TMO Agent notified (via A2A message bus)
4. Risk Agent notified
5. In-app notification created for project manager
6. Relevant SOPs auto-attached from Knowledge Base

**No manual intervention needed!**

### Workflow 2: High Risk Escalation

**Trigger**: Risk Agent finds risk_score > 8

**What Happens**:
1. Collaboration rule fires
2. Governance Agent escalated (approval required)
3. Email sent to VP Engineering
4. Slack alert posted to #critical-risks
5. RCA documents from Weaviate attached
6. Follow-up task created in Jira

**All automated!**

### Workflow 3: Value Realization Check

**Trigger**: Project reaches 70% completion

**What Happens**:
1. TMO Agent checks completion status (via ClickHouse)
2. VRO Agent triggered for value assessment
3. Benefits realization tracked
4. ROI calculated
5. Business case assumptions validated
6. Email report sent to stakeholders

**Proactive value tracking!**

---

## No Environment Variables Needed!

### ❌ Old Way (Don't Do This)
```bash
NOTIFICATION_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
TEAMS_WEBHOOK_URL=https://outlook.office.com/...
```

### ✅ New Way (Do This)
1. Go to MCP Marketplace
2. Configure integrations in UI
3. Assign to agents
4. Done!

**Benefits**:
- Change configs without redeployment
- Test connections in UI
- Multiple email providers
- Per-environment configs
- Audit trail

---

## Troubleshooting

### Agent Not Responding

**Check**:
```bash
GET /api/agents/:agentId/config
```

**Fix**:
- Ensure agent is enabled in wizard
- Check MCP tools are configured in marketplace
- Verify LLM strategy is set

### Email Not Sending

**Check**:
```bash
GET /api/notifications/logs?channel=email&limit=10
```

**Fix**:
- Test email integration in marketplace
- Verify API key is correct
- Check notification logs for errors

### Rule Not Firing

**Check**:
```bash
GET /api/admin/collaboration-rules
```

**Fix**:
- Ensure rule is enabled
- Check conditions match facts
- Verify source agent is correct
- Check rule execution logs

---

## Next Steps

### 1. Create Collaboration Rules

Go to **Admin → Collaboration Rules** and create rules like:
- "When CPI < 0.70 → Notify TMO + Risk"
- "When risk_score > 8 → Escalate to Governance"
- "When project completion > 70% → Trigger VRO assessment"

### 2. Upload Knowledge Base Documents

Go to **Admin → Knowledge Base** and upload:
- PM guidelines
- SOPs
- RCA templates
- Compliance forms
- Best practices

Tag documents to relevant agents.

### 3. Integrate Project Management Tools

Go to **MCP Marketplace** and add:
- Jira Cloud
- Asana
- Microsoft Project Server
- Monday.com

### 4. Set Up Dashboards

Configure executive dashboards to show:
- Agent execution metrics
- Cost tracking
- Collaboration patterns
- Rule effectiveness

---

## Summary

### What You Did:
1. ✅ Installed dependencies
2. ✅ Created database tables
3. ✅ Configured email provider in marketplace
4. ✅ Enabled agents and assigned tools in wizard
5. ✅ System auto-activated

### What You Get:
- 🤖 9 intelligent agents with real tools
- 📧 Email/Slack/Teams notifications
- 🔄 Inter-agent collaboration
- 💰 Cost tracking and optimization
- 📚 Knowledge base with agent tagging
- 📋 Rule-based automation

### What's Next:
- Create collaboration rules
- Upload knowledge documents
- Integrate PM tools
- Monitor and optimize

**You're live!** 🚀
