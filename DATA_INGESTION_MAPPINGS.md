# Data Ingestion Mappings
**Purpose:** Map external system fields to internal project schema

---

## System Schema (Target)

### EVM Fields
| Field | Type | Description | Source Systems |
|-------|------|-------------|----------------|
| `cpi_value` | REAL | Cost Performance Index (EV/AC) | MS Project, Primavera, SAP |
| `spi_value` | REAL | Schedule Performance Index (EV/PV) | MS Project, Primavera, SAP |
| `planned_value` | REAL | Planned Value (PV) - Budgeted cost of work scheduled | MS Project, Oracle, SAP |
| `earned_value` | REAL | Earned Value (EV) - Budgeted cost of work performed | MS Project, Oracle, SAP |
| `actual_cost` | TEXT | Actual Cost (AC) - Actual cost of work performed | SAP, Oracle Financials |
| `bac` | REAL | Budget at Completion | MS Project, SAP |
| `eac` | REAL | Estimate at Completion | MS Project, SAP |
| `etc` | REAL | Estimate to Complete | MS Project, SAP |
| `cv` | REAL | Cost Variance (EV - AC) | Calculated |
| `sv` | REAL | Schedule Variance (EV - PV) | Calculated |
| `vac` | REAL | Variance at Completion (BAC - EAC) | Calculated |

### Sprint/Agile Fields
| Field | Type | Description | Source Systems |
|-------|------|-------------|----------------|
| `velocity` | TEXT | Sprint velocity (story points per sprint) | Jira, Azure DevOps, Rally |
| `predictability` | TEXT | Velocity predictability percentage | Jira, Azure DevOps |
| `flow_efficiency` | TEXT | Flow efficiency percentage | Jira, Azure DevOps |
| `art_name` | TEXT | Agile Release Train name | Jira (SAFe), Rally |
| `current_pi` | TEXT | Current Program Increment | Jira (SAFe), Rally |
| `epic_progress` | TEXT | Epic completion percentage | Jira, Azure DevOps |

---

## Source System Mappings

### 1. JIRA

#### Sprint Metrics
```typescript
{
  velocity: SUM(customfield_10016) WHERE status IN ('Done', 'Closed'),
  predictability: CALCULATED based on velocity consistency,
  flowEfficiency: completedStoryPoints / totalStoryPoints,
  artName: customfield_10001?.value || null,
  currentPI: customfield_10002?.value || null,
  epicProgress: (doneIssues / totalIssues) * 100
}
```

**Field Mappings:**
- `customfield_10016` → Story Points
- `customfield_10020` → Sprint
- `customfield_10001` → ART (Agile Release Train)
- `customfield_10002` → PI (Program Increment)
- `aggregatetimeoriginalestimate` → Original Estimate (hours)
- `aggregatetimespent` → Time Spent (hours)

**API Endpoints:**
- `/rest/api/3/search` - JQL queries for issues
- `/rest/api/3/issue/{issueKey}` - Individual issue details
- `/rest/agile/1.0/sprint/{sprintId}` - Sprint details
- `/rest/agile/1.0/board/{boardId}/sprint` - Board sprints

**Authentication:** Bearer token or Basic auth

---

### 2. Azure DevOps

#### Sprint Metrics
```typescript
{
  velocity: SUM(Microsoft.VSTS.Scheduling.StoryPoints) WHERE System.State IN ('Done', 'Closed'),
  predictability: CALCULATED,
  flowEfficiency: completedStoryPoints / totalStoryPoints,
  iterationPath: System.IterationPath
}
```

**Field Mappings:**
- `Microsoft.VSTS.Scheduling.StoryPoints` → Story Points
- `Microsoft.VSTS.Scheduling.OriginalEstimate` → Original Estimate (hours)
- `Microsoft.VSTS.Scheduling.CompletedWork` → Completed Work (hours)
- `Microsoft.VSTS.Scheduling.RemainingWork` → Remaining Work (hours)
- `System.IterationPath` → Sprint/Iteration
- `System.TeamProject` → Project Name
- `System.State` → Work Item State

**API Endpoints:**
- `https://dev.azure.com/{org}/{project}/_apis/wit/wiql` - Work Item Query
- `https://dev.azure.com/{org}/{project}/_apis/wit/workitems` - Work Items
- `https://dev.azure.com/{org}/{project}/_apis/work/teamsettings/iterations` - Iterations

**Authentication:** Personal Access Token (PAT)

---

### 3. MS Project / Primavera P6

#### EVM Metrics (XML Export)
```xml
<Project>
  <CPI>0.95</CPI>
  <SPI>0.92</SPI>
  <PlannedValue>5000000</PlannedValue>
  <EarnedValue>4600000</EarnedValue>
  <ActualCost>4842000</ActualCost>
  <BAC>10000000</BAC>
  <EAC>10526000</EAC>
  <Tasks>
    <Task>
      <ID>1</ID>
      <Name>Phase 1</Name>
      <PercentComplete>75</PercentComplete>
      <ActualCost>500000</ActualCost>
      <BaselineCost>450000</BaselineCost>
    </Task>
  </Tasks>
</Project>
```

**Field Mappings (MS Project):**
- `CPI` → cpi_value
- `SPI` → spi_value
- `PlannedValue` → planned_value
- `EarnedValue` → earned_value
- `ActualCost` → actual_cost
- `BAC` (Budget at Completion) → bac
- `EAC` (Estimate at Completion) → eac
- `CV` (Cost Variance) → cv
- `SV` (Schedule Variance) → sv

**Export Formats:**
- XML (`.xml`)
- MPP (requires parser library)
- Excel export (`.xlsx`)

---

### 4. SAP PS (Project System)

#### Financial Actuals
```sql
-- SAP Tables
SELECT
  ps_posid AS project_id,
  ps_pspnr AS wbs_element,
  wkgbtr AS actual_cost,
  verme AS planned_cost,
  -- EVM calculated fields
  (wkgbtr / NULLIF(verme, 0)) AS cost_performance
FROM coep -- Actual Line Items
JOIN prps -- WBS Elements
  ON prps.pspnr = coep.objnr
WHERE gjahr = CURRENT_YEAR
```

**Field Mappings:**
- `PS_POSID` → Project ID
- `WKGBTR` → Actual Cost
- `VERME` → Planned Cost
- `BEAUFTR` → Budgeted Cost
- `UMBEW` → Revaluation

**Integration Method:**
- RFC/BAPI calls
- OData services
- CSV export (batch)

---

### 5. Oracle Financials

#### Project Costing
```sql
SELECT
  project_id,
  task_id,
  sum(burdened_cost) AS actual_cost,
  sum(quantity) AS actual_hours,
  budget_version_id
FROM pa_expenditure_items_all
WHERE project_id = :project_id
GROUP BY project_id, task_id
```

**Field Mappings:**
- `burdened_cost` → actual_cost
- `raw_cost` → direct_cost
- `quantity` → actual_hours
- `budget_version_id` → budget reference

**Integration Method:**
- REST API
- Database link (if on-premise)
- CSV export

---

## Ingestion Frequency

| Data Type | Recommended Frequency | Source System | Method |
|-----------|----------------------|---------------|--------|
| **Sprint Velocity** | Daily (EOD) | Jira, Azure DevOps | REST API |
| **EVM Actuals** | Weekly (Friday) | MS Project, SAP | File upload or API |
| **Financial Actuals** | Monthly (Month-end close) | SAP, Oracle | Scheduled batch |
| **Resource Utilization** | Weekly | Jira, Azure DevOps | REST API |
| **Risk Register** | Weekly | SharePoint, Smartsheet | File upload |

---

## Sync Jobs Configuration

### Cron Schedule
```typescript
{
  jiraSprint: "0 18 * * *",         // Daily 6 PM
  azureDevOps: "0 19 * * *",        // Daily 7 PM
  msProject: "0 8 * * FRI",          // Friday 8 AM
  sapFinancials: "0 2 1 * *",        // 1st of month 2 AM
  oracleFinancials: "0 3 1 * *"      // 1st of month 3 AM
}
```

### API Rate Limits
- **Jira Cloud:** 10 requests/second
- **Azure DevOps:** 200 requests per user per hour
- **SAP:** Depends on RFC connection pool
- **Oracle:** Depends on database connection

---

## Error Handling

### Retry Policy
```typescript
{
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // ms
  maxDelay: 30000     // ms
}
```

### Failure Notifications
- Slack webhook on sync failure
- Email to admin on 3 consecutive failures
- PagerDuty alert if critical system unreachable

---

## Data Validation Rules

### EVM Constraints
- `0.5 <= CPI <= 1.5` (outside range = flag for review)
- `0.5 <= SPI <= 1.5`
- `EV = PV * SPI` (within 5% tolerance)
- `AC = EV / CPI` (within 5% tolerance)
- `BAC > 0`
- `EAC = BAC / CPI`

### Sprint Constraints
- `velocity >= 0`
- `0 <= flowEfficiency <= 100`
- `0 <= predictability <= 100`
- Sprint velocity should not vary >50% week-to-week (flag outliers)

---

## Security & Compliance

### API Credentials Storage
- Store in **Replit Secrets** or **AWS Secrets Manager**
- Rotate tokens every 90 days
- Use service accounts (not personal accounts)

### Data Privacy
- Do not store PII in project fields
- Anonymize resource names if required by policy
- Encrypt credentials at rest

### Audit Trail
- Log all ingestion jobs: start time, end time, records processed
- Log all data modifications
- Retain audit logs for 7 years (compliance)

---

## Testing Strategy

### Unit Tests
- Test each adapter independently
- Mock API responses
- Validate field mapping logic

### Integration Tests
- Test against Jira/Azure DevOps sandbox
- Verify data flows to database correctly
- Check calculated fields (CPI, SPI, CV, SV)

### Load Tests
- Simulate 1000 projects syncing simultaneously
- Measure sync time and database load
- Optimize batch sizes

---

## Next Steps for Production

1. **Configure API Credentials** - Add to environment variables
2. **Schedule Sync Jobs** - Use node-cron or external scheduler
3. **Build Admin UI** - Allow users to configure integration settings
4. **Monitor & Alert** - Set up Datadog/New Relic for sync health
5. **Document Custom Fields** - Each organization may customize Jira/Azure DevOps
