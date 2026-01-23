# 📊 Data Sources - Real vs. Seed Data

## Overview

Your system is designed to work with **REAL DATA** from external systems. Seed data is **OPTIONAL** and only for testing.

---

## 🔄 Real Data Sources (Recommended)

### Option 1: MCP Adapters (External PPM Tools) - **PRIMARY**

Your system has MCP (Model Context Protocol) adapters for 9 external tools:

#### Jira
```bash
# Add to .env
JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# Sync command
npm run mcp:sync:jira
```

**What Gets Synced:**
- ✅ Epics → Projects
- ✅ Stories → User Stories
- ✅ Tasks → Tasks
- ✅ Sprint data → Sprints
- ✅ Users → Resources

#### Azure DevOps
```bash
# Add to .env
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PAT=your-personal-access-token

# Sync command
npm run mcp:sync:azure
```

**What Gets Synced:**
- ✅ Work Items → Tasks
- ✅ Features → Features
- ✅ Iterations → Sprints
- ✅ Team Members → Resources

#### ServiceNow
```bash
# Add to .env
SERVICENOW_INSTANCE=your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# Sync command
npm run mcp:sync:servicenow
```

**What Gets Synced:**
- ✅ Change Requests → Projects
- ✅ Incidents → Risks
- ✅ Tasks → Tasks

### Option 2: Manual Project Ingestion

#### Upload Excel/CSV
```bash
# API endpoint
POST /api/projects/ingest
Content-Type: multipart/form-data

# File format: Excel or CSV with columns:
# - Project Name
# - Budget
# - Start Date
# - End Date
# - Owner
# - Status
# (See template: /templates/project-import-template.xlsx)
```

#### Web Form
```
Navigate to: http://localhost:5000/projects/create
Fill in project details
Submit
```

### Option 3: Direct API Integration

#### GraphQL API
```graphql
mutation CreateProject {
  createProject(input: {
    name: "My Real Project"
    budget: "1000000"
    startDate: "2025-01-01"
    endDate: "2025-12-31"
    cpi: "1.0"
    spi: "1.0"
  }) {
    id
    name
  }
}
```

#### REST API
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Real Project",
    "budget": "1000000",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "cpi": "1.0",
    "spi": "1.0"
  }'
```

---

## 🧪 Seed Data (Optional - For Testing Only)

### When to Use Seed Data:
- ✅ **First-time setup** - Test agents before connecting real systems
- ✅ **Development** - Work on features without external dependencies
- ✅ **Demo** - Show stakeholders how system works
- ✅ **Training** - Train team without affecting real data

### When NOT to Use Seed Data:
- ❌ **Production** - Never use seed data in production
- ❌ **If you have real data** - Connect MCP adapters instead
- ❌ **For reporting** - Metrics based on fake data are meaningless

### How to Use Seed Data:
```bash
# Run once to populate test data
npm run seed

# What it creates:
# - 3 projects (1 over budget, 1 delayed, 1 healthy)
# - 3 epics
# - 4 features
# - 4 user stories
# - 5 tasks with dependencies
# - 5 resources (4 people, 1 equipment)
# - 4 resource assignments
# - 3 milestones
# - 3 risks
```

### Clear Seed Data:
```bash
# Reset database (WARNING: Deletes ALL data)
npm run db:reset

# Then re-run migration
npm run db:push
```

---

## 🤖 How Agents Work with Data

### Agents DON'T Care About Data Source:
Your LangChain agents work with **whatever data is in the database**:
- ✅ Real data from Jira
- ✅ Real data from Azure DevOps
- ✅ Manually entered data
- ✅ Seed data (for testing)

### Agent Behavior:
```typescript
// FinOps Agent scans ALL projects in database
const projects = await storage.getProjects();

// Analyzes each project
for (const project of projects) {
  const cpi = parseFloat(project.cpiValue);

  // Creates intervention ONLY if real problem detected
  if (cpi < 0.9) {
    await createIntervention({
      type: 'budget',
      severity: 'high',
      title: `Budget overrun on ${project.name}`,
      reasoning: `CPI of ${cpi} indicates project is over budget...`,
    });
  }
}
```

**Key Point:** Agents analyze **REAL DATA** and only create interventions when they find **REAL PROBLEMS**.

---

## 📋 Recommended Setup Workflow

### For Production (Real Data):

1. **Connect MCP Adapters**
   ```bash
   # Add credentials to .env
   JIRA_DOMAIN=...
   JIRA_EMAIL=...
   JIRA_API_TOKEN=...

   # Run sync
   npm run mcp:sync:jira
   ```

2. **Verify Data Imported**
   ```bash
   # Check projects
   curl http://localhost:5000/api/projects | jq

   # Check GraphQL
   curl -X POST http://localhost:5000/api/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ projects { id name status } }"}'
   ```

3. **Start Agents**
   ```bash
   npm run dev

   # Agents will scan imported data in 20-30 minutes
   ```

4. **Monitor in LangSmith**
   ```
   https://smith.langchain.com/
   ```

### For Testing/Demo (Seed Data):

1. **Run Seed Script**
   ```bash
   npm run seed
   ```

2. **Start Application**
   ```bash
   npm run dev
   ```

3. **Wait for Agent Scans**
   ```
   - FinOps Agent: 30 minutes → Flags project with CPI 0.76
   - TMO Agent: 20 minutes → Flags project with SPI 0.70
   - Risk Agent: 60 minutes → Analyzes 3 risks
   ```

---

## 🔍 Data Quality Checks

### Verify Real Data Imported:
```bash
# Count projects
curl http://localhost:5000/api/projects | jq 'length'

# Check data sources
curl http://localhost:5000/api/projects | jq '.[].source'

# Should show: "jira", "azure", "servicenow", etc.
# NOT: "manual" or "seed"
```

### Verify Agents Using Real Data:
```bash
# Check interventions
curl http://localhost:5000/api/interventions | jq

# Look for:
# - "projectId": "<real-project-id>"
# - "reasoning": "<agent's analysis of real metrics>"
# - "confidence": <0.0-1.0>

# Check agent activity log
curl http://localhost:5000/api/agent-activity-log | jq
```

---

## 🎯 Summary

### Real Data (Recommended):
- ✅ MCP adapters sync from Jira, Azure, ServiceNow
- ✅ Manual ingestion via Excel/CSV/Web form
- ✅ Direct API integration (GraphQL/REST)
- ✅ Agents analyze real metrics, create real interventions
- ✅ LangSmith traces show real decision-making

### Seed Data (Testing Only):
- ✅ Run `npm run seed` once for test data
- ✅ 3 sample projects with realistic metrics
- ✅ Tasks, dependencies, resources, milestones
- ✅ Agents will flag sample issues (budget overrun, schedule delay)
- ❌ **DO NOT USE IN PRODUCTION**

### You Choose:
```bash
# Option A: Real Data (Production)
npm run mcp:sync:jira
npm run dev

# Option B: Seed Data (Testing)
npm run seed
npm run dev

# Option C: Both (Development)
npm run seed
npm run mcp:sync:jira
npm run dev
```

---

## ✨ Next Steps

1. ✅ Credentials configured in `.env` (DONE)
2. ⏭️ Choose data source:
   - Real: Configure MCP adapter credentials
   - Test: Run `npm run seed`
3. ⏭️ Run database migration: `npm run db:push`
4. ⏭️ Start application: `npm run dev`
5. ⏭️ Verify agents running (check console logs)
6. ⏭️ Wait 20-30 minutes for first agent scans
7. ⏭️ View interventions in LangSmith dashboard

**Your system is designed for REAL DATA. Seed data is just a convenience for testing!** 🚀
