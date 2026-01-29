# Day-One MCP Connection Guide

**Purpose**: Get your Deep Agent System operational with essential integrations.

---

## Overview

The Deep Agent System works **without any MCPs configured** - agents will run their analysis and log results. However, connecting MCPs enables agents to:
- ✅ Create Jira tickets automatically
- ✅ Send Slack notifications to your team
- ✅ Create ServiceNow incidents
- ✅ Update project management tools

**All MCPs are optional.** Agents degrade gracefully if not configured.

---

## Priority Order (Recommended)

### 1️⃣ CRITICAL: Langflow (REQUIRED)
**Why**: Enables agent workflows and Logic Gates
**Setup Time**: 10 minutes
**Agents Using**: All 8 agents

**Setup:**
```bash
# Start Docker Langflow
./START_LANGFLOW.sh

# Open http://localhost:7860
# Create account → Settings → API Keys → Copy key

# Add to .env
LANGFLOW_API_URL=http://localhost:7860/api/v1
LANGFLOW_API_KEY=<your-key>

# Create all flows
npx tsx server/scripts/create-all-langflow-flows.ts
```

---

### 2️⃣ HIGH: Slack (Recommended)
**Why**: Real-time team notifications for critical issues
**Setup Time**: 5 minutes
**Agents Using**: All 8 agents

**Setup:**
1. Go to https://api.slack.com/apps
2. Create New App → From Scratch
3. Name: "Deep Agents"
4. Activate Incoming Webhooks
5. Add New Webhook to Workspace
6. Select channel (e.g., #agent-alerts)
7. Copy Webhook URL

**Add to .env:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Test:**
```bash
curl -X POST http://localhost:5000/api/agent-actions/slack/notify \
  -H "Content-Type: application/json" \
  -d '{"channel":"#agent-alerts","text":"Test from Deep Agents","agentId":"system"}'
```

**What agents send:**
- FinOps: Budget alerts
- TMO: Schedule delays
- Risk: Critical risks
- All: General status updates

---

### 3️⃣ MEDIUM: Jira (Recommended for ticket tracking)
**Why**: Automatic ticket creation for issues
**Setup Time**: 10 minutes
**Agents Using**: FinOps, PMO, Risk, Governance

**Setup:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Copy token

**Add to .env:**
```bash
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=<your-token>
```

**Test:**
```bash
curl -X POST http://localhost:5000/api/agent-actions/jira/create-issue \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey":"PMO",
    "summary":"Test from Deep Agents",
    "description":"Testing Jira integration",
    "priority":"Medium",
    "issuetype":"Task",
    "agentId":"system"
  }'
```

**What agents create:**
- FinOps: Budget overrun tickets
- Risk: High-risk issue tickets
- Governance: Compliance violation tickets
- PMO: Project health alerts

---

### 4️⃣ LOW: ServiceNow (Optional - for enterprises using ServiceNow)
**Why**: Incident management for critical issues
**Setup Time**: 15 minutes
**Agents Using**: TMO, Risk, OCM

**Setup:**
1. Get ServiceNow instance URL (e.g., dev12345.service-now.com)
2. Create service account or use your credentials
3. Ensure account has incident_create role

**Add to .env:**
```bash
SERVICENOW_INSTANCE=dev12345.service-now.com
SERVICENOW_USERNAME=your_username
SERVICENOW_PASSWORD=your_password
```

**Test:**
```bash
curl -X POST http://localhost:5000/api/agent-actions/servicenow/create-incident \
  -H "Content-Type: application/json" \
  -d '{
    "shortDescription":"Test from Deep Agents",
    "description":"Testing ServiceNow integration",
    "priority":"3",
    "urgency":"3",
    "impact":"3",
    "category":"Project Management",
    "agentId":"system"
  }'
```

**What agents create:**
- TMO: Schedule delay incidents
- Risk: Critical risk incidents
- OCM: Change management incidents

---

### 5️⃣ LOW: Monday.com / Azure DevOps (Optional)
**Why**: Project management tool integration
**Setup Time**: 20 minutes
**Agents Using**: PMO, Planning

**Not implemented yet** - Coming in future release.

---

## Minimal Day-One Setup (15 minutes)

**Just want to get started quickly?**

1. **Langflow** (10 min) - Required for agents to work
2. **Slack** (5 min) - Get notifications

That's it! With just these two, you get:
- ✅ All 8 agents running
- ✅ Logic Gates active
- ✅ Real-time Slack notifications
- ✅ Full agent collaboration

Jira and ServiceNow can be added later when needed.

---

## Verification Checklist

After setup, verify everything works:

### ✅ Langflow
```bash
# Check flows exist
curl http://localhost:7860/api/v1/flows \
  -H "Authorization: Bearer YOUR_API_KEY"

# Should see 12 flows (8 agents + 4 scenarios)
```

### ✅ Slack
```bash
# Send test message
curl -X POST http://localhost:5000/api/agent-actions/slack/notify \
  -H "Content-Type: application/json" \
  -d '{"channel":"#agent-alerts","text":"✅ Deep Agents connected","agentId":"system"}'

# Check your Slack channel for message
```

### ✅ Jira
```bash
# Create test ticket
curl -X POST http://localhost:5000/api/agent-actions/jira/create-issue \
  -H "Content-Type: application/json" \
  -d '{"projectKey":"TEST","summary":"Integration Test","priority":"Low","issuetype":"Task","agentId":"system"}'

# Check Jira for new ticket
```

### ✅ ServiceNow
```bash
# Create test incident
curl -X POST http://localhost:5000/api/agent-actions/servicenow/create-incident \
  -H "Content-Type: application/json" \
  -d '{"shortDescription":"Integration Test","priority":"4","agentId":"system"}'

# Check ServiceNow for new incident
```

---

## What Happens If Not Configured?

**Without Langflow:**
- ❌ Agents cannot execute workflows
- ❌ Logic Gates don't work
- ❌ System non-functional

**Without Slack:**
- ⚠️ No real-time notifications
- ✅ Agents still run and log results
- ✅ Can view in UI dashboards

**Without Jira:**
- ⚠️ No automatic ticket creation
- ✅ Agents still detect issues
- ✅ Slack notifications still work (if configured)

**Without ServiceNow:**
- ⚠️ No incident management
- ✅ Agents still run normally
- ✅ Other integrations work

---

## Troubleshooting

### Slack: Message not appearing

**Check:**
```bash
# Verify webhook URL
echo $SLACK_WEBHOOK_URL

# Test directly
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Direct test"}'
```

**Common issues:**
- Wrong webhook URL
- Channel permissions
- App not installed in workspace

---

### Jira: 401 Unauthorized

**Check:**
```bash
# Verify credentials
echo $JIRA_DOMAIN
echo $JIRA_EMAIL
echo $JIRA_API_TOKEN

# Test authentication
curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "https://$JIRA_DOMAIN/rest/api/3/myself"
```

**Common issues:**
- API token expired
- Wrong email
- Domain typo (should not include https://)

---

### ServiceNow: Access Denied

**Check:**
- User has `incident_create` role
- Instance URL is correct (no https://)
- Credentials are correct

---

### Langflow: Can't create flows

**Check:**
```bash
# Verify Langflow is running
curl http://localhost:7860/health

# Verify API key
curl http://localhost:7860/api/v1/flows \
  -H "Authorization: Bearer $LANGFLOW_API_KEY"
```

**Common issues:**
- Docker not running
- Wrong API key
- Port 7860 already in use

---

## Security Best Practices

### 1. Use Environment Variables
- ✅ Store credentials in `.env`
- ❌ Never hardcode in code
- ❌ Never commit to git

### 2. Rotate Keys Regularly
- Jira API tokens: Every 90 days
- Slack webhooks: On team member departure
- ServiceNow passwords: Per company policy

### 3. Least Privilege
- Jira: Only grant permissions needed
- ServiceNow: Use service account with minimal roles
- Slack: Restrict to specific channels

### 4. Monitor Usage
- Check Jira API usage
- Review Slack message volume
- Audit ServiceNow incidents created

---

## Next Steps After Day One

### Week 1: Monitor and Tune
- Review agent notifications
- Adjust Slack channels
- Configure Jira project mappings
- Set up custom Logic Gate thresholds

### Week 2: Expand Integrations
- Add Monday.com (if used)
- Add Azure DevOps (if used)
- Configure custom webhooks
- Set up email notifications

### Month 1: Optimize
- Tune Logic Gate thresholds
- Create custom agent workflows
- Add custom MCP integrations
- Set up reporting dashboards

---

## Support

**Questions?**
- Check `/docs/mcps/<integration-name>` for detailed docs
- View MCP status: `/admin/integrations`
- Test endpoints: See `server/routes/agent-actions.ts`
- Audit logs: Check agent activity logs

---

**END OF GUIDE**
