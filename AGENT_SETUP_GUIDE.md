# 🤖 Agent Setup Guide - Connect Your LangChain/LangSmith Credentials

## Quick Setup (5 Minutes)

Your 7 LangChain agents are **already implemented and ready to run**. You just need to configure your credentials.

---

## Step 1: Create .env File

```bash
# Copy the example file
cp .env.example .env
```

---

## Step 2: Add Your Credentials to .env

Open `.env` and add your credentials from the vault:

```bash
# ============================================================================
# REQUIRED: Anthropic AI (Claude) - Your agents need this to run
# ============================================================================
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# ============================================================================
# REQUIRED: LangSmith (Agent Observability) - See your agents in action
# ============================================================================
LANGCHAIN_API_KEY=lsv2_pt_YOUR_KEY_HERE
LANGCHAIN_PROJECT=nextera-eto
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com

# ============================================================================
# REQUIRED: Database (for Replit, see options below)
# ============================================================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/nextera_eto

# ============================================================================
# REQUIRED: Session Security
# ============================================================================
SESSION_SECRET=your-random-secret-string-here
```

---

## Step 3: Where to Find Your Keys

### Anthropic API Key
1. Go to: https://console.anthropic.com/
2. Click "API Keys" in sidebar
3. Copy your key (starts with `sk-ant-api03-`)
4. Paste into `ANTHROPIC_API_KEY` in `.env`

### LangSmith API Key
1. Go to: https://smith.langchain.com/
2. Click your profile icon → "Settings"
3. Click "API Keys" tab
4. Click "Create API Key"
5. Copy the key (starts with `lsv2_pt_` or `ls__`)
6. Paste into `LANGCHAIN_API_KEY` in `.env`

### LangSmith Project Name
- Use `LANGCHAIN_PROJECT=nextera-eto` (or any name you want)
- This creates a separate project in LangSmith for your agents
- You'll see all agent traces under this project

---

## Step 4: Database Setup (Choose One)

### Option A: Replit Built-in PostgreSQL (Easiest)
1. Go to "Database" tab in Replit
2. Click "Create Database" → Select "PostgreSQL"
3. Copy the connection string
4. Paste into `DATABASE_URL` in Replit Secrets

### Option B: Neon (Free PostgreSQL Cloud)
1. Sign up: https://neon.tech
2. Create a new project
3. Copy connection string
4. Paste into `DATABASE_URL`

### Option C: Local PostgreSQL (if using Docker)
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/nextera_eto
```

---

## Step 5: Initialize Database

```bash
# Install dependencies (if not done)
npm install

# Push schema to database (creates all tables including ontology tables)
npm run db:push
```

Expected output:
```
✅ Created table: projects
✅ Created table: ontology_entities
✅ Created table: ontology_mappings
✅ Created table: obda_query_cache
✅ Created table: graph_sync_log
✅ Created table: interventions
... (and more)
```

---

## Step 6: Start the Application

```bash
# Development mode (recommended)
npm run dev
```

---

## Step 7: Verify Agents Started

Check your console for this output:

```
[AgentScheduler] Initializing LangChain agents...
[AgentScheduler] Loading agent: finops
[AgentScheduler] Loading agent: tmo
[AgentScheduler] Loading agent: risk
[AgentScheduler] Loading agent: governance
[AgentScheduler] Loading agent: planning
[AgentScheduler] Loading agent: ocm
[AgentScheduler] Loading agent: integrated
[AgentScheduler] Initialized 7 agents
[AgentScheduler] ✅ All agents scheduled and running
[AgentScheduler] 🎯 NO MORE FAKE DATA - Agents monitor real projects

[AgentScheduler] 📅 Agent Schedules:
[AgentScheduler]   - FinOps Agent: Every 30 minutes (full autonomy)
[AgentScheduler]   - TMO Agent: Every 20 minutes (full autonomy)
[AgentScheduler]   - Risk Agent: Every 60 minutes (supervised autonomy)
[AgentScheduler]   - Governance Agent: Every 2 hours (supervised autonomy)
[AgentScheduler]   - Planning Agent: Every 30 minutes (supervised autonomy)
[AgentScheduler]   - OCM Agent: Every 45 minutes (full autonomy)
[AgentScheduler]   - Integrated Mgmt Agent: Every 45 minutes (full autonomy)
```

✅ **If you see this, your agents are running!**

---

## Step 8: View Your Agents in LangSmith

### Access LangSmith Dashboard
1. Go to: https://smith.langchain.com/
2. Select your project: `nextera-eto` (or whatever you named it)
3. You'll see agent traces appear as they execute

### What You'll See in LangSmith:

**Project Dashboard:**
- All agent executions (runs)
- Success/failure rates
- Average execution time
- Token usage

**Individual Traces:**
- Agent name (FinOps, TMO, Risk, etc.)
- Tools used (query_project_budgets, analyze_schedule, etc.)
- Chain-of-thought reasoning
- LLM prompts and responses
- Execution timeline
- Errors (if any)

**Example Trace:**
```
Run: FinOps Agent Scheduled Scan
├── Tool: query_project_budgets
│   └── Input: { "minCPI": 0.8 }
│   └── Output: [{ "id": "proj-123", "cpi": "0.75", ... }]
├── Tool: calculate_budget_variance
│   └── Input: { "projectId": "proj-123" }
│   └── Output: { "variance": -25000, "percentage": -12.5 }
├── Tool: create_intervention
│   └── Input: {
│         "type": "budget",
│         "severity": "high",
│         "title": "Budget overrun detected",
│         "recommendation": "Review cost centers..."
│       }
│   └── Output: { "interventionId": "int-456" }
└── Agent Output: "Created 1 budget intervention for Project Alpha"
```

---

## Step 9: Monitor Agent Activity

### In Your Application:
- Go to http://localhost:5000 (or your Replit URL)
- Navigate to Agent Dashboard
- You'll see real interventions from agents (no more fake data!)

### API Endpoints to Test:

**Get All Interventions:**
```bash
curl http://localhost:5000/api/interventions
```

**Get Agent Activity Log:**
```bash
curl http://localhost:5000/api/agent-activity-log?limit=10
```

**GraphQL Query (Interventions with Reasoning):**
```bash
curl -X POST http://localhost:5000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ interventions(limit: 5) { id agentName title severity confidence reasoning langsmithTraceId } }"
  }'
```

---

## 🤖 Your 7 Agents Explained

| Agent | ID | Focus | Autonomy | Schedule |
|-------|-----|-------|----------|----------|
| **FinOps Agent** | `finops` | Budget, Cost, CPI, spending, financial health | **Full** (auto-creates interventions) | Every 30 min |
| **TMO Agent** | `tmo` | Schedule, Timeline, SPI, velocity, sprint planning | **Full** (auto-creates interventions) | Every 20 min |
| **Risk Agent** | `risk` | Risk identification, probability, impact, mitigation | **Supervised** (requires approval) | Every 60 min |
| **Governance Agent** | `governance` | Compliance, approvals, policy adherence | **Supervised** (requires approval) | Every 2 hours |
| **Planning Agent** | `planning` | Dependencies, roadmap, capacity planning | **Supervised** (requires approval) | Every 30 min |
| **OCM Agent** | `ocm` | Change management, stakeholder readiness | **Full** (auto-creates interventions) | Every 45 min |
| **Integrated Mgmt Agent** | `integrated` | Quality, testing, defects, integration | **Full** (auto-creates interventions) | Every 45 min |

### Agent Tools

Each agent has 4-5 specialized tools. Examples:

**FinOps Agent Tools:**
- `query_project_budgets` - Get projects with budget data
- `calculate_budget_variance` - Calculate budget variance
- `get_spending_trends` - Analyze spending trends
- `create_intervention` - Create budget intervention

**TMO Agent Tools:**
- `query_project_schedules` - Get projects with schedule data
- `calculate_completion_forecast` - Forecast completion date
- `analyze_velocity` - Analyze team velocity
- `create_intervention` - Create schedule intervention

---

## 🔍 Troubleshooting

### Agents Not Starting

**Check 1: API Key Valid?**
```bash
# Test Anthropic API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

Expected: `{"content":[{"text":"Hello...`

**Check 2: Database Connected?**
```bash
# Check if tables were created
npm run db:push
```

Expected: No errors, should show tables created.

**Check 3: Environment Variables Loaded?**
```bash
# Check if .env is loaded
node -e "console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing')"
```

### No Traces in LangSmith

**Issue:** LangSmith API key not set or invalid

**Fix:**
1. Verify `LANGCHAIN_API_KEY` in `.env`
2. Verify `LANGCHAIN_TRACING_V2=true` in `.env`
3. Restart application
4. Check LangSmith dashboard after 5 minutes

### Agents Running But No Interventions

**This is normal!** Agents only create interventions when they find actual problems:
- FinOps Agent: Only if CPI < 0.9 or budget variance > 10%
- TMO Agent: Only if SPI < 0.9 or schedule delays detected
- Risk Agent: Only if high-probability risks identified

**To test agent execution manually:**
```bash
# Trigger agent scan via API (coming soon)
curl -X POST http://localhost:5000/api/agents/finops/trigger-scan
```

Or wait for scheduled execution (check console logs).

---

## 📊 Expected Behavior

### First 30 Minutes After Startup:

**Minute 0:**
- ✅ 7 agents initialized
- ✅ Schedules set

**Minute 20:**
- 🤖 TMO Agent executes scheduled scan
- 📊 Queries project schedules via ontology/OBDA
- 🔍 Analyzes SPI values
- ✅ Creates intervention if SPI < 0.9
- 📈 Trace appears in LangSmith

**Minute 30:**
- 🤖 FinOps Agent executes scheduled scan
- 💰 Queries project budgets via ontology/OBDA
- 🔍 Analyzes CPI values
- ✅ Creates intervention if CPI < 0.9
- 📈 Trace appears in LangSmith
- 🤖 Planning Agent also executes

**Minute 45:**
- 🤖 OCM Agent executes
- 🤖 Integrated Mgmt Agent executes

**Minute 60:**
- 🤖 Risk Agent executes (requires supervisor approval)

**Minute 120:**
- 🤖 Governance Agent executes (requires supervisor approval)

### What You Won't See:
- ❌ No fake data generated every 12 seconds
- ❌ No simulated alerts
- ❌ No synthetic metrics

### What You Will See:
- ✅ Real agent scans at appropriate intervals
- ✅ Real interventions based on actual data
- ✅ Agent reasoning and confidence scores
- ✅ LangSmith traces with full execution details

---

## 🎯 Quick Start Checklist

- [ ] Create `.env` file from `.env.example`
- [ ] Add `ANTHROPIC_API_KEY` (from https://console.anthropic.com/)
- [ ] Add `LANGCHAIN_API_KEY` (from https://smith.langchain.com/)
- [ ] Add `DATABASE_URL` (Replit PostgreSQL, Neon, or local)
- [ ] Run `npm install`
- [ ] Run `npm run db:push` (creates database tables)
- [ ] Run `npm run dev` (starts application)
- [ ] Check console for "✅ All agents scheduled and running"
- [ ] Visit https://smith.langchain.com/ to see agent traces
- [ ] Wait 20-30 minutes for first agent executions
- [ ] Check `/api/interventions` endpoint for real agent interventions

---

## 🆘 Need Help?

**Check agent logs:**
```bash
# View agent activity
curl http://localhost:5000/api/agent-activity-log | jq

# View interventions
curl http://localhost:5000/api/interventions | jq
```

**Check LangSmith:**
- Go to https://smith.langchain.com/
- Select project: `nextera-eto`
- Look for runs in last hour

**Check database:**
```bash
# Verify tables exist
npm run db:push
```

**Check environment variables:**
```bash
# List all set variables (don't show values for security)
env | grep -E "ANTHROPIC|LANGCHAIN|DATABASE" | sed 's/=.*/=***/'
```

---

## ✨ You're All Set!

Once you complete the checklist, your agents will be running and you'll see them in:
1. **Console logs** - Agent initialization and scan results
2. **LangSmith dashboard** - Full execution traces with reasoning
3. **Application UI** - Real interventions (no fake data!)
4. **GraphQL API** - Query interventions with agent reasoning

**Welcome to real AI agent monitoring!** 🎉
