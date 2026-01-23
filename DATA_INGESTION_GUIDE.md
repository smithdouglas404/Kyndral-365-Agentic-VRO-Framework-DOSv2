# 📊 Data Ingestion Guide - How to Load Your Project Data

## Overview

The NextEra Energy ETO/VRO platform supports multiple data ingestion methods:

1. **MCP Adapters** - Real-time sync from external PPM tools (Jira, Azure DevOps, ServiceNow, etc.)
2. **REST API** - Direct API uploads for custom integrations
3. **GraphQL Mutations** - Structured data uploads
4. **Bulk Import** - CSV/Excel file uploads
5. **Webhook Listeners** - Real-time event processing from external systems

---

## 🔌 Method 1: MCP Adapters (Recommended for Production)

MCP (Model Context Protocol) Adapters enable real-time bidirectional sync with external systems.

### Supported Systems

| System | Status | Features |
|--------|--------|----------|
| **Jira** | ✅ Production Ready | Projects, Epics, Stories, Tasks, Custom Fields |
| **Azure DevOps** | ✅ Production Ready | Work Items, Sprints, Boards, Queries |
| **ServiceNow** | ✅ Production Ready | Projects, Change Requests, Incidents |
| **Microsoft Project** | ✅ Production Ready | Tasks, Resources, Dependencies, Gantt |
| **Smartsheet** | ✅ Production Ready | Sheets, Rows, Columns, Formulas |
| **Asana** | ⚠️ Beta | Projects, Tasks, Teams |
| **Monday.com** | ⚠️ Beta | Boards, Items, Updates |
| **ClickUp** | ⚠️ Beta | Spaces, Lists, Tasks |
| **Rally** | 🔄 In Development | User Stories, Iterations |

### Setup MCP Adapter

#### Step 1: Configure Credentials

Add credentials to `.env`:

```bash
# Jira
JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# Azure DevOps
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PAT=your-personal-access-token

# ServiceNow
SERVICENOW_INSTANCE=your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
```

#### Step 2: Enable Sync

```bash
# Start MCP sync scheduler
npm run dev
```

The sync scheduler will automatically:
- Poll external systems every 5 minutes
- Process webhooks in real-time
- Handle rate limiting and retries
- Log all sync activity

#### Step 3: Configure Sync Settings

**Web UI:**
1. Go to Settings → Data Sources
2. Select your system (e.g., Jira)
3. Click "Connect"
4. Authenticate
5. Select projects/boards to sync
6. Choose sync frequency (5 min / 15 min / 30 min / 60 min)

**API:**
```bash
curl -X POST http://localhost:5000/api/mcp/configure \
  -H "Content-Type: application/json" \
  -d '{
    "system": "jira",
    "enabled": true,
    "syncInterval": 300000,
    "projects": ["PROJ-1", "PROJ-2"],
    "webhooks": true
  }'
```

#### Step 4: Verify Sync

```bash
# Check sync status
curl http://localhost:5000/api/mcp/status

# View sync logs
curl http://localhost:5000/api/mcp/sync-log?limit=10
```

---

## 📡 Method 2: REST API (Recommended for Custom Integrations)

Use REST API for custom integrations, scripts, or one-time imports.

### Create a Project

**Endpoint:** `POST /api/projects`

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Portal Modernization",
    "status": "in_progress",
    "portfolioId": "portfolio-123",
    "startDate": "2024-01-15",
    "endDate": "2024-12-31",
    "budget": "2500000",
    "budgetSpent": "1200000",
    "cpiValue": "0.85",
    "spiValue": "0.92",
    "completionPercentage": 45,
    "plannedValue": 2000000,
    "earnedValue": 1840000,
    "actualCost": 2165000,
    "description": "Modernize customer-facing portal with React and microservices"
  }'
```

### Add Epics, Features, Stories, Tasks

**Create Epic:**
```bash
curl -X POST http://localhost:5000/api/epics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "name": "User Authentication",
    "description": "SSO and OAuth integration",
    "status": "in_progress",
    "wsjfScore": "85"
  }'
```

**Create Feature:**
```bash
curl -X POST http://localhost:5000/api/features \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "epicId": "epic-id-here",
    "name": "OAuth 2.0 Integration",
    "status": "in_progress",
    "storyPoints": "13"
  }'
```

**Create Story:**
```bash
curl -X POST http://localhost:5000/api/stories \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "featureId": "feature-id-here",
    "name": "As a user, I can login with Google",
    "status": "in_progress",
    "storyPoints": "5"
  }'
```

**Create Task:**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "featureId": "feature-id-here",
    "storyId": "story-id-here",
    "name": "Implement Google OAuth callback",
    "status": "in_progress",
    "effortHours": "8",
    "assignee": "john.doe@company.com"
  }'
```

### Add Dependencies

```bash
curl -X POST http://localhost:5000/api/dependencies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OAuth Design → OAuth Implementation",
    "projectId": "project-id-here",
    "predecessorId": "task-1-id",
    "successorId": "task-2-id",
    "type": "finish_to_start",
    "lag": 2
  }'
```

**Dependency Types:**
- `finish_to_start` (FS) - Predecessor must finish before successor starts
- `start_to_start` (SS) - Both start at same time
- `finish_to_finish` (FF) - Both finish at same time
- `start_to_finish` (SF) - Successor finishes when predecessor starts

### Add Resources

```bash
curl -X POST http://localhost:5000/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "name": "Alice Thompson",
    "type": "person",
    "role": "Solutions Architect",
    "availability": 1.0,
    "cost": 150,
    "skills": ["Architecture", "OAuth", "Security"]
  }'
```

### Add Milestones

```bash
curl -X POST http://localhost:5000/api/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "name": "MVP Release",
    "type": "release",
    "targetDate": "2024-06-30",
    "status": "on_track",
    "completionPercentage": 45
  }'
```

### Add Risks

```bash
curl -X POST http://localhost:5000/api/risks \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "name": "OAuth Provider Downtime",
    "description": "Google OAuth service may experience downtime",
    "probability": "medium",
    "impact": "high",
    "status": "active",
    "mitigation": "Implement fallback authentication and retry logic"
  }'
```

---

## 🔍 Method 3: GraphQL Mutations

Use GraphQL for structured, type-safe data uploads.

### GraphQL Endpoint

`POST /api/graphql`

### Create Project via GraphQL

```graphql
mutation CreateProject {
  createProject(input: {
    name: "API Gateway Implementation"
    status: "in_progress"
    budget: "500000"
    cpi: "1.05"
    spi: "1.15"
  }) {
    id
    name
    status
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createProject(input: { name: \"API Gateway\", status: \"in_progress\" }) { id name } }"
  }'
```

---

## 📄 Method 4: Bulk Import (CSV/Excel)

Upload CSV or Excel files for bulk project imports.

### CSV Format

**projects.csv:**
```csv
name,status,budget,budgetSpent,cpi,spi,startDate,endDate
Customer Portal,in_progress,2500000,1200000,0.85,0.92,2024-01-15,2024-12-31
Cloud Migration,in_progress,3000000,900000,0.78,0.70,2024-02-01,2024-11-30
API Gateway,completed,500000,450000,1.11,1.05,2024-01-01,2024-06-30
```

### Upload via UI

1. Go to Projects → Import
2. Click "Upload CSV"
3. Select file
4. Map columns (if needed)
5. Preview data
6. Click "Import"

### Upload via API

```bash
curl -X POST http://localhost:5000/api/import/csv \
  -F "file=@projects.csv" \
  -F "type=projects"
```

### Supported CSV Types

- `projects` - Project data
- `epics` - Epic data
- `features` - Feature data
- `stories` - User story data
- `tasks` - Task data
- `dependencies` - Dependency relationships
- `resources` - Resource/people data
- `risks` - Risk data

---

## 🔔 Method 5: Webhooks (Real-Time)

Configure external systems to push updates to your platform via webhooks.

### Webhook Endpoint

`POST /api/webhooks/:system`

**Systems:**
- `/api/webhooks/jira`
- `/api/webhooks/azure`
- `/api/webhooks/servicenow`
- `/api/webhooks/github`

### Configure Jira Webhook

1. Go to Jira → System → Webhooks
2. Click "Create Webhook"
3. Name: "NextEra ETO Sync"
4. URL: `https://your-domain.com/api/webhooks/jira`
5. Events: Issue Created, Issue Updated, Issue Deleted
6. Save

### Webhook Payload Example

**Jira Issue Updated:**
```json
{
  "webhookEvent": "jira:issue_updated",
  "issue": {
    "key": "PROJ-123",
    "fields": {
      "summary": "Implement OAuth callback",
      "status": { "name": "In Progress" },
      "assignee": { "emailAddress": "john@company.com" }
    }
  }
}
```

---

## 🎯 Data Mapping & Transformation

### Ontology-Based Mapping

The platform uses semantic ontology to map external data to internal schema:

**Jira → Platform Mapping:**
```
Jira Epic        →  pm:Epic
Jira Story       →  pm:Story
Jira Task        →  pm:Task
Jira Status      →  pm:status
Jira Assignee    →  pm:assignedTo
```

**Azure DevOps → Platform Mapping:**
```
Azure Epic       →  pm:Epic
Azure Feature    →  pm:Feature
Azure User Story →  pm:Story
Azure Task       →  pm:Task
Azure State      →  pm:status
```

### Custom Field Mapping

**Define custom mappings in `.env`:**
```bash
# Map Jira custom field to platform field
JIRA_CUSTOM_FIELD_10001=budgetSpent
JIRA_CUSTOM_FIELD_10002=earnedValue
JIRA_CUSTOM_FIELD_10003=actualCost
```

**Or via API:**
```bash
curl -X POST http://localhost:5000/api/mcp/field-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "system": "jira",
    "mappings": {
      "customfield_10001": "budgetSpent",
      "customfield_10002": "earnedValue",
      "customfield_10003": "actualCost"
    }
  }'
```

---

## 🔐 Authentication & Authorization

### API Keys

Generate API key for programmatic access:

```bash
curl -X POST http://localhost:5000/api/auth/generate-key \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Import Script",
    "scopes": ["projects:write", "epics:write", "features:write"]
  }'
```

Response:
```json
{
  "apiKey": "eto_live_abc123xyz789",
  "scopes": ["projects:write", "epics:write", "features:write"]
}
```

### Use API Key

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer eto_live_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{ "name": "New Project" }'
```

---

## 📊 Data Validation & Quality

### Validation Rules

All imported data is validated:

✅ **Required Fields:**
- Project: `name`, `status`
- Epic: `name`, `projectId`
- Feature: `name`, `projectId`, `epicId`
- Story: `name`, `projectId`, `featureId`
- Task: `name`, `projectId`

✅ **Data Types:**
- `budget`, `budgetSpent`, `earnedValue`, `actualCost`: Numbers or strings
- `cpi`, `spi`: Decimal between 0.0 and 10.0
- `startDate`, `endDate`: ISO 8601 date format
- `status`: Enum (planning, in_progress, completed, on_hold, cancelled)

✅ **Business Rules:**
- CPI = Earned Value / Actual Cost
- SPI = Earned Value / Planned Value
- Budget Spent ≤ Budget Total
- Start Date < End Date

### Validation Error Handling

**Invalid data returns 400 error:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "cpiValue",
      "message": "CPI must be between 0.0 and 10.0",
      "received": "15.5"
    }
  ]
}
```

---

## 🚀 Best Practices

### 1. Use MCP Adapters for Production

✅ **DO:**
- Use MCP adapters for Jira, Azure, ServiceNow
- Enable webhooks for real-time updates
- Set sync interval to 5-15 minutes

❌ **DON'T:**
- Poll APIs more frequently than every 5 minutes (rate limits)
- Import all historical data (only last 6 months needed)

### 2. Batch Imports for Historical Data

✅ **DO:**
- Use bulk CSV import for historical data
- Import in batches of 100-500 records
- Validate data before import

❌ **DON'T:**
- Import via API one-by-one (too slow)
- Import duplicate data

### 3. Use GraphQL for Complex Queries

✅ **DO:**
- Use GraphQL to fetch projects with all relationships
- Request only the fields you need

❌ **DON'T:**
- Use REST API to fetch projects then fetch epics, features, stories separately

### 4. Monitor Data Quality

✅ **DO:**
- Check `/api/data-quality/score` endpoint daily
- Review validation errors
- Fix missing required fields

---

## 🔧 Troubleshooting

### MCP Sync Failing

**Issue:** Jira sync returns 401 Unauthorized

**Fix:**
1. Verify `JIRA_API_TOKEN` in `.env`
2. Check token hasn't expired
3. Verify token has correct permissions (Browse Projects, View Issues)

### Import Validation Errors

**Issue:** CSV import fails with "Missing required field: projectId"

**Fix:**
1. Add `projectId` column to CSV
2. Ensure all rows have valid projectId values

### Duplicate Data

**Issue:** Same project imported multiple times

**Fix:**
1. Use `externalId` field to prevent duplicates
2. Platform deduplicates by `externalId + source system`

---

## 📖 API Reference

**Full API documentation:** http://localhost:5000/api-docs

**GraphQL Schema:** http://localhost:5000/api/graphql

---

## 🆘 Support

**Check data quality:**
```bash
curl http://localhost:5000/api/data-quality/score
```

**View recent imports:**
```bash
curl http://localhost:5000/api/import/history?limit=10
```

**View MCP sync logs:**
```bash
curl http://localhost:5000/api/mcp/sync-log?limit=20
```

---

## ✅ Quick Start Checklist

- [ ] Choose ingestion method (MCP / REST API / CSV / GraphQL)
- [ ] Configure credentials in `.env` (if using MCP)
- [ ] Test connection: `curl http://localhost:5000/api/projects`
- [ ] Import sample data
- [ ] Verify data: `curl http://localhost:5000/api/projects | jq`
- [ ] Check data quality: `curl http://localhost:5000/api/data-quality/score`
- [ ] Monitor agent interventions: `curl http://localhost:5000/api/interventions`

---

**You're ready to ingest project data!** 🎉
