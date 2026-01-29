# MASTER_TODO (RECONCILED SUPPLEMENT)

**Status**: Reconciled with `MASTER_TODO_EXACT_ATTRIBUTES.md` and `MASTER_ARCHITECTURE.md` on 2026-01-29.  
**Authority**: `MASTER_ARCHITECTURE.md` is the source of truth. This file remains as a supplemental execution tracker and historical research record.

---

**Created**: 2026-01-27
**Status**: Foundation Complete (60%) - Attributes & Dashboards Remaining (40%)

---

## 📋 EXECUTION ORDER

### ⭐ PHASE 1: RESEARCH & DOCUMENT ATTRIBUTES (Week 1 - Days 1-3)
### 🔧 PHASE 2: EXPAND AGENT ATTRIBUTES (Week 1 - Days 4-7)
### 🎨 PHASE 3: BUILD DASHBOARDS (Week 2-3)
### 🔌 PHASE 4: WIRE AGENT-MCP CONNECTIONS (Week 3-4)
### ✅ PHASE 5: TESTING & VALIDATION (Week 4)

---

## ⭐ PHASE 1: RESEARCH & DOCUMENT ATTRIBUTES

### Task 1.1: Extract SAFe 6.0 Attributes (COMPLETE ✅)
**Sources Found**:
- [SAFe 6.0 Flow Metrics Guide](https://premieragile.com/complete-details-on-safe-flow-metrics/)
- [SAFe 6.0 Metrics, KPIs & OKRs](https://www.cprime.com/safe-6-0-deep-dive-flow-metrics-part-1-of-2/)
- [SAFe Framework - Measure and Grow](https://framework.scaledagile.com/measure-and-grow)
- [SAFe LPM Guide](https://www.ppm.express/blog/safe-lean-portfolio-management)

**SAFe 6.0 Core Metrics Identified**:
- **6 Flow Metrics**: Flow Distribution, Flow Velocity, Flow Time, Flow Load, Flow Efficiency, Flow Predictability
- **DORA Metrics**: Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR
- **LPM Metrics**: Portfolio ROI, Resource Utilization, Delivery Speed, Investment Horizons (H1/H2/H3)
- **OKR System**: Strategic Themes as OKRs, Portfolio/ART/Team OKRs
- **Economic Framework**: Cost of Delay, WSJF Scores
- **PI Planning Metrics**: PI Predictability (80% target), Team Velocity, Dependency Health

### Task 1.2: Extract PMBOK Attributes (COMPLETE ✅)
**Sources Found**:
- [PMBOK 7 Measurement Performance Domain](https://onlinepmcourses.com/monitoring-and-controlling-what-is-the-pmbok-7-measurement-performance-domain/)
- [EVM Complete Guide](https://www.projectengineer.net/guide-to-earned-value-management/)
- [PMBOK 8 Updates for 2026](https://projectmanagementacademy.net/resources/blog/what-is-pmbok-8/)

**PMBOK EVM Metrics Identified** (Complete Set):
- **Foundation**: PV (Planned Value), EV (Earned Value), AC (Actual Cost), BAC (Budget at Completion)
- **Variance**: CV (Cost Variance), SV (Schedule Variance), VAC (Variance at Completion)
- **Performance Indices**: CPI (Cost Performance Index), SPI (Schedule Performance Index), TCPI (To-Complete Performance Index)
- **Forecasting**: EAC (Estimate at Completion), ETC (Estimate to Complete)
- **8 Performance Domains**: Stakeholders, Team, Development Approach, Planning, Project Work, Delivery, Measurement, Uncertainty
- **SMART Metrics**: Specific, Meaningful, Achievable, Relevant, Timely

### Task 1.3: Analyze Existing Dashboards for Attributes
**Dashboards Found**:
- `/client/src/pages/dashboard-finops.tsx` - Shows: Budget, YTD Spend, Forecast, Variance%, Savings, Cost Categories
- `/client/src/components/VROMetricsTable.tsx` - Shows: VRO Metrics per challenge, Cadence, Core Tracking Fields
- `/client/src/pages/dashboard-tmo.tsx`
- `/client/src/pages/dashboard-governance.tsx`
- `/client/src/pages/dashboard-planning.tsx`
- `/client/src/pages/dashboard-ocm.tsx`

**Attributes Currently Shown in Dashboards**:
- FinOps: budget, spent, forecast, variance, savings, aiInsight, division
- VRO: vroMetrics (name, cadence), challenges, tracking fields
- Mini Dashboards: Project-level metrics next to PMO dashboard

---

## 🔧 PHASE 2: EXPAND AGENT ATTRIBUTES TO DATABASE

### Task 2.1: PMO Agent - Expand to 40+ Attributes
**File**: `server/agents/attributes/PMOAgentAttributes.ts`
**Current**: 8 attributes
**Target**: 40+ attributes

**Add SAFe 6.0 Flow Metrics** (11 attributes):
- [ ] flowVelocity (number) - epics/features completed per PI
- [ ] flowTime (number, days) - concept-to-cash duration
- [ ] flowLoad (number) - WIP items count
- [ ] flowEfficiency (percentage) - value-added time ratio (target: 35-40%)
- [ ] flowPredictability (percentage) - objectives achieved vs planned
- [ ] flowDistribution (object) - work item type distribution
- [ ] artPredictability (percentage) - ART predictability score (target: 80%)
- [ ] piObjectivesDelivered (percentage) - PI objectives completed
- [ ] teamVelocityAverage (number, points) - avg story points per sprint
- [ ] dependencyHealth (number, score 0-100) - cross-team dependency health
- [ ] innovationRatio (percentage) - % capacity for innovation (target: 20%)

**Add PMBOK 7 Performance Domain** (10 attributes):
- [ ] milestoneCompletionRate (percentage) - milestones completed on time
- [ ] defectDensity (number) - defects per 1000 lines of code
- [ ] netPromoterScore (number, -100 to 100) - NPS from stakeholders
- [ ] teamMoraleIndex (number, score 0-100) - team satisfaction score
- [ ] scheduleQualityIndex (number, score 0-100) - schedule accuracy metric
- [ ] stakeholderEngagement (number, score 0-100) - stakeholder satisfaction
- [ ] riskExposure (number, currency) - total risk exposure value
- [ ] changeRequestVolume (number) - # of change requests
- [ ] resourceUtilization (percentage) - resource allocation efficiency
- [ ] deliveryThroughput (number) - work items delivered per period

**Add DORA Metrics** (4 attributes):
- [ ] deploymentFrequency (string) - daily, weekly, monthly
- [ ] leadTimeForChanges (number, hours) - commit to production time
- [ ] changeFailureRate (percentage) - % of deployments causing failures (target: <15%)
- [ ] meanTimeToRestore (number, hours) - MTTR (target: <1 hour)

**Add SAFe PI Planning** (8 attributes):
- [ ] piStatus (string) - planning, execution, inspect_adapt
- [ ] programBoardHealth (number, score 0-100) - program board quality
- [ ] featureCycleTime (number, days) - avg time to complete features
- [ ] teamSyncEffectiveness (number, score 0-100) - sync meeting quality
- [ ] technicalDebtRatio (percentage) - technical debt vs new features
- [ ] testAutomationCoverage (percentage) - automated test coverage
- [ ] builtInQualityScore (number, score 0-100) - quality practices score
- [ ] releaseOnDemandCapability (boolean) - can release any time

**Total**: 8 (current) + 33 (new) = **41 attributes ✅**

### Task 2.2: FinOps Agent - Expand to 30+ Attributes
**File**: `server/agents/attributes/FinOpsAgentAttributes.ts`
**Current**: ~10 attributes (need to count)
**Target**: 30+ attributes

**Add PMBOK 7 Earned Value Management** (12 attributes):
- [ ] plannedValue (number, currency) - PV / BCWS
- [ ] earnedValue (number, currency) - EV / BCWP
- [ ] actualCost (number, currency) - AC / ACWP
- [ ] budgetAtCompletion (number, currency) - BAC
- [ ] costVariance (number, currency) - CV = EV - AC
- [ ] scheduleVariance (number, currency) - SV = EV - PV
- [ ] costPerformanceIndex (number, ratio) - CPI = EV / AC (target: >= 1.0)
- [ ] schedulePerformanceIndex (number, ratio) - SPI = EV / PV (target: >= 1.0)
- [ ] estimateAtCompletion (number, currency) - EAC forecast
- [ ] estimateToComplete (number, currency) - ETC = EAC - AC
- [ ] varianceAtCompletion (number, currency) - VAC = BAC - EAC
- [ ] toCompletePerformanceIndex (number, ratio) - TCPI = (BAC - EV) / (BAC - AC)

**Add SAFe 6.0 Lean Portfolio Budgeting** (10 attributes):
- [ ] valueStreamBudgets (object) - budget per value stream
- [ ] capexOpexSplit (object) - {capex: %, opex: %}
- [ ] investmentHorizonH1 (number, currency) - Horizon 1 sustaining budget
- [ ] investmentHorizonH2 (number, currency) - Horizon 2 growth budget
- [ ] investmentHorizonH3 (number, currency) - Horizon 3 transformation budget
- [ ] epicFundingStatus (array) - [{epicId, status: funded|unfunded}]
- [ ] portfolioBudgetUtilization (percentage) - % of portfolio budget used
- [ ] budgetBurnRate (number, currency/day) - daily burn rate
- [ ] leanBudgetGuardrails (object) - budget constraints and limits
- [ ] economicFramework (object) - cost of delay, WSJF factors

**Add Financial KPIs** (8 attributes):
- [ ] returnOnInvestment (percentage) - ROI for portfolio
- [ ] costOfDelay (number, currency/week) - economic impact of delays
- [ ] valueStreamROI (object) - ROI per value stream
- [ ] totalCostOfOwnership (number, currency) - TCO
- [ ] runRate (number, currency/month) - monthly operational cost
- [ ] savingsRealized (number, currency) - actual savings achieved
- [ ] forecastAccuracy (percentage) - budget forecast accuracy
- [ ] cashFlowProjection (array) - monthly cash flow forecast

**Total**: 10 (current) + 30 (new) = **40 attributes ✅**

### Task 2.3: VRO Agent - Expand to 30+ Attributes
**File**: `server/agents/attributes/VROAgentAttributes.ts`
**Current**: ~7 attributes (need to count)
**Target**: 30+ attributes

**Add SAFe 6.0 OKRs/KPIs** (12 attributes):
- [ ] okrProgress (array) - [{objective, keyResults: [{kr, progress}]}]
- [ ] strategicThemeAlignment (number, score 0-100) - alignment to strategic themes
- [ ] customerSatisfactionScore (number, score 0-100) - CSAT
- [ ] netPromoterScore (number, -100 to 100) - NPS
- [ ] timeToMarket (number, days) - concept to delivery time
- [ ] returnOnInvestment (percentage) - portfolio ROI
- [ ] revenueGrowth (percentage) - revenue increase %
- [ ] customerRetentionRate (percentage) - customer retention %
- [ ] customerLifetimeValue (number, currency) - CLV
- [ ] marketShareGrowth (percentage) - market share increase
- [ ] innovationRate (percentage) - % new features vs maintenance
- [ ] customerAcquisitionCost (number, currency) - CAC

**Add PMI Benefits Realization** (10 attributes):
- [ ] benefitsRegister (array) - [{benefit, target, actual, status}]
- [ ] benefitsDependencyMap (object) - benefit interdependencies
- [ ] leadingIndicators (array) - early signals of success
- [ ] laggingIndicators (array) - outcome measures
- [ ] benefitsRealizationRate (percentage) - % of expected benefits achieved
- [ ] benefitCostRatio (number, ratio) - BCR (target: >= 1.5)
- [ ] businessValueScore (number, score 0-100) - delivered business value
- [ ] valueStreamEfficiency (percentage) - value stream flow efficiency
- [ ] outcomeRealizationTime (number, days) - time to realize outcomes
- [ ] benefitsSustainability (number, score 0-100) - benefit longevity score

**Add Value Metrics** (8 attributes):
- [ ] economicValueAdded (number, currency) - EVA
- [ ] customerEngagementScore (number, score 0-100) - engagement metrics
- [ ] featureAdoptionRate (percentage) - % users adopting new features
- [ ] systemReliability (percentage) - uptime/availability
- [ ] userExperienceScore (number, score 0-100) - UX metrics
- [ ] competitivePositioning (number, score 0-100) - market position
- [ ] brandPerceptionIndex (number, score 0-100) - brand health
- [ ] sustainabilityImpact (object) - environmental/social impact metrics

**Total**: 7 (current) + 30 (new) = **37 attributes ✅**

### Task 2.4: TMO Agent - Expand Attributes
**File**: `server/agents/attributes/TMOAgentAttributes.ts`
**Add**:
- [ ] criticalPathLength (number, days) - critical path duration
- [ ] scheduleBufferRemaining (number, days) - buffer available
- [ ] milestoneVariance (number, days) - milestone date variance
- [ ] resourceLeveling (number, score 0-100) - resource smoothing effectiveness
- [ ] scheduleCompression (number, days) - fast-tracking/crashing achieved

### Task 2.5: Risk Agent - Expand Attributes
**File**: `server/agents/attributes/RiskAgentAttributes.ts`
**Add**:
- [ ] riskBurndownRate (number) - risks closed per period
- [ ] riskVelocity (number) - new risks per period
- [ ] contingencyReserve (number, currency) - remaining risk budget
- [ ] threatOpportunityRatio (ratio) - negative vs positive risks
- [ ] riskResponseEffectiveness (percentage) - % of risks mitigated successfully

### Task 2.6: Planning Agent - Expand Attributes
**File**: `server/agents/attributes/PlanningAgentAttributes.ts`
**Add**:
- [ ] roadmapHealth (number, score 0-100) - roadmap quality
- [ ] dependencyComplexity (number, score 0-100) - dependency graph complexity
- [ ] planningAccuracy (percentage) - actual vs planned variance
- [ ] capacityForecast (object) - future capacity predictions
- [ ] backlogHealth (number, score 0-100) - backlog quality

### Task 2.7: Governance Agent - Expand Attributes
**File**: `server/agents/attributes/GovernanceAgentAttributes.ts`
**Add**:
- [ ] complianceScore (number, score 0-100) - overall compliance
- [ ] policyViolations (number) - # of violations detected
- [ ] auditReadiness (number, score 0-100) - audit preparedness
- [ ] regulatoryRisk (number, score 0-100) - regulatory exposure
- [ ] controlEffectiveness (percentage) - % of controls passing

### Task 2.8: OCM Agent - Expand Attributes
**File**: `server/agents/attributes/OCMAgentAttributes.ts`
**Add**:
- [ ] changeAdoptionRate (percentage) - % users adopting change
- [ ] resistanceIndex (number, score 0-100) - resistance level
- [ ] trainingCompletionRate (percentage) - % completed training
- [ ] changeImpactScore (number, score 0-100) - change impact magnitude
- [ ] stakeholderReadiness (number, score 0-100) - readiness for change

### Task 2.9: Company Agent - CREATE NEW
**File**: `server/agents/attributes/CompanyAgentAttributes.ts` (CREATE)
**Why**: Company needs to be a full agent with attributes and functions

**Company Agent Attributes** (20+ attributes):
- [ ] companyName (string) - organization name
- [ ] stockTicker (string) - stock symbol
- [ ] industry (string) - industry sector
- [ ] annualRevenue (number, currency) - yearly revenue
- [ ] employeeCount (number) - total employees
- [ ] fiscalYear (object) - {start, end, quarter}
- [ ] strategicPriorities (array) - company strategic themes
- [ ] riskFactors (array) - enterprise risks
- [ ] governanceScore (number, score 0-100) - corporate governance
- [ ] boardSize (number) - # of board members
- [ ] mission (string) - company mission statement
- [ ] vision (string) - company vision
- [ ] values (array) - company values
- [ ] portfolioHealth (number, score 0-100) - overall portfolio health
- [ ] organizationalMaturity (number, score 0-100) - agile maturity level
- [ ] marketCapitalization (number, currency) - market cap
- [ ] debtToEquityRatio (number, ratio) - financial leverage
- [ ] operatingMargin (percentage) - operating profit margin
- [ ] cashReserves (number, currency) - available cash
- [ ] creditRating (string) - credit rating (AAA, AA, etc.)

**Total**: **20 attributes ✅**

---

## 🎨 PHASE 3: BUILD DASHBOARDS

### Task 3.1: Portfolio Dashboard (LPM Level)
**File**: `client/src/pages/PortfolioDashboard.tsx` (CREATE NEW)
**Uses**: LPM Agent attributes from SAFeAgentSchemas.ts

**Components**:
- [ ] Strategic Themes display (cards showing each theme + progress)
- [ ] Portfolio Vision panel (text + alignment score)
- [ ] WSJF Epic Prioritization chart (horizontal bar: epic name vs WSJF score)
- [ ] Portfolio Flow Metrics panel:
  - Flow Time trend line chart
  - Flow Efficiency gauge (target: 40%)
  - Flow Load current count
  - Flow Velocity bar chart (epics per PI)
- [ ] Value Stream Budgets pie chart (budget allocation per stream)
- [ ] Investment Horizons stacked bar (H1 sustaining, H2 growth, H3 transformation)
- [ ] Budget Guardrails indicators (green/yellow/red)
- [ ] Portfolio KPIs grid (4x2 cards with key metrics)

**API Endpoints**:
- GET /api/agents/lpm/attributes
- GET /api/portfolio/strategic-themes
- GET /api/portfolio/flow-metrics
- GET /api/portfolio/value-streams

### Task 3.2: ART Dashboard (Program Level)
**File**: `client/src/pages/ARTDashboard.tsx` (CREATE NEW)
**Uses**: ART Agent attributes from SAFeAgentSchemas.ts

**Components**:
- [ ] PI Objectives board (Kanban-style: planned, committed, delivered)
- [ ] PI Predictability trend chart (line chart with 80% target line)
- [ ] Flow Velocity chart (bar chart: features per PI)
- [ ] Team Velocity & Capacity (grouped bar: velocity vs capacity per team)
- [ ] Dependency Health matrix (grid: teams x teams, color-coded by health)
- [ ] DORA Metrics panel (4 gauges):
  - Deployment Frequency
  - Lead Time for Changes
  - Change Failure Rate (target: <15%)
  - MTTR (target: <1 hour)
- [ ] ART Risks ROAM board (Resolved, Owned, Accepted, Mitigated)
- [ ] Built-in Quality Score gauge

**API Endpoints**:
- GET /api/agents/art/attributes
- GET /api/art/pi-objectives
- GET /api/art/flow-metrics
- GET /api/art/dora-metrics
- GET /api/art/teams

### Task 3.3: Value Stream Dashboard
**File**: `client/src/pages/ValueStreamDashboard.tsx` (CREATE NEW)
**Uses**: Value Stream Agent attributes from SAFeAgentSchemas.ts

**Components**:
- [ ] Value Stream Map visualization (flow diagram with steps, wait times, process times)
- [ ] Lead Time tracking (line chart over time)
- [ ] Flow Efficiency gauge (target: 30%)
- [ ] Process Time vs Wait Time comparison (stacked bar)
- [ ] Cost of Delay calculator widget
- [ ] Economic Framework panel (WSJF factors, CD3 scores)
- [ ] Value Stream KPIs grid
- [ ] Solution Intent health indicator

**API Endpoints**:
- GET /api/agents/value-stream/attributes
- GET /api/value-streams/:id/map
- GET /api/value-streams/:id/metrics

### Task 3.4: Project Dashboard (Enhanced - SAFe + PMBOK Hybrid)
**File**: `client/src/pages/dashboard.tsx` (ENHANCE EXISTING)
**Uses**: PMO, FinOps, TMO, VRO agent attributes

**SAFe Metrics (Level 1 - Always Show)**:
- [ ] PI Predictability gauge (current PI performance)
- [ ] Flow Efficiency gauge (team flow efficiency)
- [ ] Flow Time trend (story cycle time)
- [ ] Team Velocity chart (sprint velocity over time)
- [ ] Dependency Health indicator

**PMBOK Metrics (Level 2 - Toggle via Methodology Selector)**:
- [ ] SPI/CPI dual gauge (schedule & cost performance indices)
- [ ] EAC vs BAC comparison (forecast vs budget)
- [ ] VAC indicator (variance at completion)
- [ ] Schedule Performance chart (planned vs actual)
- [ ] EVM S-curve (PV, EV, AC over time)

**Quality & Resource Panels**:
- [ ] Defect Density trend line
- [ ] Resource Utilization heatmap (team members x weeks)
- [ ] Test Automation Coverage gauge

**Methodology Toggle**:
- [ ] Radio buttons: SAFe Only | PMBOK Only | Hybrid (default)
- [ ] Dynamically show/hide metric panels based on selection
- [ ] Save preference per project

**Mini Dashboards** (Flyouts next to main dashboard):
- [ ] VRO Mini Dashboard (value metrics for current project)
- [ ] FinOps Mini Dashboard (cost metrics for current project)
- [ ] Risk Mini Dashboard (top 5 risks for current project)

**API Endpoints**:
- GET /api/projects/:id/safe-metrics
- GET /api/projects/:id/pmbok-metrics
- GET /api/projects/:id/methodology
- PUT /api/projects/:id/methodology

### Task 3.5: MCP Management Dashboard ⭐ CRITICAL
**File**: `client/src/pages/MCPDashboard.tsx` (CREATE NEW)
**Purpose**: Toggle MCPs per agent (unique feature, no one has built this)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ MCP Management Dashboard                                │
│                                                          │
│ [Filter: All Agents ▼] [Search MCPs...]                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ PMO Agent ────────────────────────────────────────┐ │
│ │ Knowledge MCPs (Priority 1)                        │ │
│ │   [✓] Jira Integration        245 calls  99.2%    │ │
│ │   [✓] Azure DevOps           180 calls 100.0%    │ │
│ │ Governance MCPs (Priority 2)                       │ │
│ │   [✓] Responsible AI          425 calls 100.0%    │ │
│ │   [✓] QA Validator            425 calls  98.8%    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ FinOps Agent ─────────────────────────────────────┐ │
│ │ Knowledge MCPs                                      │ │
│ │   [✓] SAP Integration         312 calls  99.7%    │ │
│ │   [✓] Coupa                   156 calls 100.0%    │ │
│ │ Governance MCPs                                     │ │
│ │   [✓] Responsible AI          468 calls 100.0%    │ │
│ │   [✓] QA Validator            468 calls  99.1%    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [...8 more agents...]                                   │
├─────────────────────────────────────────────────────────┤
│ Recent MCP Executions (Last 100)                        │
│ PMO → Jira → Success (45ms) → Allow                    │
│ PMO → Responsible AI → Success (12ms) → Allow          │
│ FinOps → SAP → Success (67ms) → Allow                  │
│ Risk → Policy → Success (8ms) → Warn (threshold near) │
└─────────────────────────────────────────────────────────┘
```

**Components**:
- [ ] Agent list (accordion, one per agent)
- [ ] For each agent:
  - Toggle switches for each connected MCP
  - Usage stats (call count, success rate, avg execution time)
  - Priority indicator
- [ ] MCP execution log table:
  - Columns: Timestamp, Agent, MCP, Operation, Result, Decision, Time, Reason
  - Filter by agent, MCP type, decision
  - Search by operation
- [ ] Usage statistics panel:
  - Most used MCPs (bar chart)
  - Success rate by MCP (horizontal bar)
  - Avg execution time by MCP (horizontal bar)
- [ ] Governance decision breakdown:
  - Pie chart: Allow / Warn / Block counts
  - Trend over time (line chart)

**API Endpoints** (ALREADY EXIST):
- GET /api/agent-mcp/agent/{agentId}/mcps
- PUT /api/admin/agent-mcp-connections/{connectionId} (toggle enabled)
- GET /api/admin/agent-mcp-connections/logs?agentId={id}&limit=100
- GET /api/admin/agent-mcp-connections/stats

### Task 3.6: FinOps Dashboard Enhancement
**File**: `client/src/pages/dashboard-finops.tsx` (ENHANCE EXISTING)
**Add EVM Metrics**:
- [ ] EVM S-curve chart (PV, EV, AC over time)
- [ ] CPI/SPI gauges (current performance indices)
- [ ] EAC vs BAC comparison card
- [ ] TCPI gauge (required future performance)
- [ ] Variance analysis table (CV, SV, VAC)

### Task 3.7: Governance Dashboard Enhancement
**File**: `client/src/pages/dashboard-governance.tsx` (ENHANCE EXISTING)
**Add**:
- [ ] Compliance score card
- [ ] Policy violations list
- [ ] Audit readiness gauge
- [ ] Control effectiveness heatmap

### Task 3.8: Planning Dashboard Enhancement
**File**: `client/src/pages/dashboard-planning.tsx` (ENHANCE EXISTING)
**Add**:
- [ ] Roadmap health visualization
- [ ] Dependency graph (interactive network diagram)
- [ ] Backlog health metrics
- [ ] Capacity forecast chart

---

## 🔌 PHASE 4: WIRE AGENT-MCP CONNECTIONS

### Task 4.1: Run Database Migration ⭐ START HERE
```bash
cd /home/runner/workspace
npm run build
tsx server/scripts/migrate-agent-mcp-tables.ts
```

**Creates**:
- `mcp_definitions` table
- `agent_mcp_connections` table (many-to-many)
- `mcp_execution_log` table
- **Seeds 7 default MCPs** (4 knowledge + 3 governance)
- **Creates default agent-MCP connections**

**Verify**:
```sql
SELECT * FROM mcp_definitions;
SELECT * FROM agent_mcp_connections WHERE agent_id = 'pmo';
SELECT COUNT(*) FROM mcp_execution_log;
```

### Task 4.2: Implement Real MCP Server Communication

#### 4.2a: Enhance Jira MCP (Knowledge)
**File**: `server/mcp/JiraService.ts` (ALREADY EXISTS)
- [ ] Test with real Jira credentials
- [ ] Add operations: query-projects, query-sprints, query-boards
- [ ] Add real-time data capture to Mem0
- [ ] Add error handling and retries

#### 4.2b: Create Azure DevOps MCP (Knowledge)
**File**: `server/mcp/AzureDevOpsService.ts` (CREATE NEW)
- [ ] Implement Azure DevOps REST API client
- [ ] Operations: query-work-items, query-boards, create-work-item, update-work-item
- [ ] Store results immediately to Mem0 (5-minute cache)
- [ ] Add to MCPServiceFactory routing

#### 4.2c: Create SAP MCP (Knowledge)
**File**: `server/mcp/SAPService.ts` (CREATE NEW)
- [ ] Implement SAP OData API client
- [ ] Operations: query-financials, query-budgets, query-cost-centers, query-gl-accounts
- [ ] Real-time financial data capture to Mem0
- [ ] Add to MCPServiceFactory routing

#### 4.2d: Create Coupa MCP (Knowledge)
**File**: `server/mcp/CoupaService.ts` (CREATE NEW)
- [ ] Implement Coupa REST API client
- [ ] Operations: query-procurement, query-suppliers, query-contracts, query-invoices
- [ ] Real-time procurement data to Mem0
- [ ] Add to MCPServiceFactory routing

#### 4.2e: Create Responsible AI MCP (Governance) ⭐ UNIQUE
**File**: `server/mcp/ResponsibleAIService.ts` (CREATE NEW)
- [ ] Implement bias detection checks (LLM-based)
- [ ] Implement safety validation
- [ ] Implement ethical concern screening
- [ ] Return: {decision: 'allow'|'block'|'warn', reason: string, confidence: number}
- [ ] Store all decisions to Mem0 for audit trail

#### 4.2f: Create QA MCP (Governance) ⭐ UNIQUE
**File**: `server/mcp/QAService.ts` (CREATE NEW)
- [ ] Implement quality standards validation
- [ ] Implement best practices checks
- [ ] Implement data quality assessment
- [ ] Return: {decision: 'allow'|'block'|'warn', reason: string, suggestions: array}
- [ ] Store QA decisions to Mem0

#### 4.2g: Create Policy MCP (Governance) ⭐ UNIQUE
**File**: `server/mcp/PolicyService.ts` (CREATE NEW)
- [ ] Load organizational policies from database
- [ ] Validate agent actions against policies
- [ ] Support policy versioning
- [ ] Return: {decision: 'allow'|'block'|'warn', reason: string, policyViolated: string}
- [ ] Store policy enforcement to Mem0

### Task 4.3: Wire MCPs to AgentMcpService
**File**: `server/lib/AgentMcpService.ts` (UPDATE)
- [ ] Update queryKnowledgeMCPs() to call real services
- [ ] Update validateGovernanceMCPs() to call real services
- [ ] Remove all mock/simulated responses
- [ ] Implement 5-minute caching to Mem0 (already architected)
- [ ] Add error handling and fallback logic
- [ ] Log all MCP calls to mcp_execution_log

### Task 4.4: Create Default Agent-MCP Connections (After Migration)
- [ ] PMO → Jira, Azure DevOps, Responsible AI, QA
- [ ] FinOps → SAP, Coupa, Responsible AI, QA
- [ ] Risk → All Governance MCPs (Responsible AI, QA, Policy)
- [ ] VRO → Jira, SAP, QA
- [ ] TMO → Jira, Azure DevOps, QA
- [ ] Governance → All Governance MCPs
- [ ] Planning → Jira, Azure DevOps, Policy
- [ ] OCM → Jira, Responsible AI, Policy

---

## ✅ PHASE 5: TESTING & VALIDATION

### Task 5.1: Test Agent Attributes in Database
- [ ] Verify all PMO attributes (40+) stored correctly
- [ ] Verify all FinOps attributes (30+) stored correctly
- [ ] Verify all VRO attributes (30+) stored correctly
- [ ] Query attributes via API: GET /api/agents/{agentId}/attributes
- [ ] Test attribute updates: PUT /api/agents/{agentId}/attributes

### Task 5.2: Test Dashboards with Real Data
- [ ] Portfolio Dashboard displays LPM data
- [ ] ART Dashboard displays ART data
- [ ] Value Stream Dashboard displays VSM data
- [ ] Project Dashboard methodology toggle works
- [ ] MCP Dashboard shows all agent connections
- [ ] Mini dashboards (VRO, FinOps, Risk) display correctly

### Task 5.3: Test Agent-MCP Integration End-to-End
- [ ] PMO agent queries Jira MCP → data returned
- [ ] Governance MCP blocks action → agent respects decision
- [ ] Knowledge MCP result cached in Mem0 → subsequent query fast
- [ ] MCP execution logged → visible in MCP Dashboard
- [ ] Toggle MCP on/off in dashboard → connection disabled/enabled

### Task 5.4: Test Langflow Components
- [ ] Copy langflow-components/*.py to Langflow instance
- [ ] Test mem0_reader component
- [ ] Test mem0_writer component
- [ ] Test llm_calculator component
- [ ] Test rule_evaluator component
- [ ] Test agent_mcp_query component (with real MCPs)

### Task 5.5: Performance Testing
- [ ] Test MCP cache (5-minute Mem0 cache working)
- [ ] Measure MCP execution times (target: <100ms for most)
- [ ] Test concurrent agent MCP queries (10 agents × 4 MCPs)
- [ ] Test governance MCP blocking (decision made in <50ms)

### Task 5.6: Documentation Updates
- [ ] Update AGENT_MCP_ARCHITECTURE.md with real MCP implementations
- [ ] Create DASHBOARD_USER_GUIDE.md
- [ ] Create MCP_ADMIN_GUIDE.md
- [ ] Update COMPLETE_IMPLEMENTATION_SUMMARY.md
- [ ] Create ATTRIBUTE_REFERENCE.md (all attributes per agent)

---

## 📊 PROGRESS TRACKING

| Phase | Tasks | Done | Remaining | Progress |
|-------|-------|------|-----------|----------|
| **Foundation (Pre-Crash)** | 13 | 13 | 0 | 100% ✅ |
| Phase 1: Research Attributes | 3 | 3 | 0 | 100% ✅ |
| Phase 2: Expand Attributes | 9 | 0 | 9 | 0% |
| Phase 3: Build Dashboards | 8 | 0 | 8 | 0% |
| Phase 4: Wire MCPs | 11 | 0 | 11 | 0% |
| Phase 5: Testing | 6 | 0 | 6 | 0% |
| **TOTAL** | **50** | **16** | **34** | **32%** |

---

## 🔑 KEY ARCHITECTURAL INSIGHTS

### Why This Matters (From Conversation + Documents):

1. **SAFe 6.0 as Foundation** ✅
   - Ontology is built on SAFe
   - Complete PPM framework with KPIs, OKRs, Flow Metrics
   - Provides industry-standard metrics

2. **PMBOK as Optional Overlay** ✅
   - Clients can choose methodology per project
   - EVM metrics for traditional PM
   - Hybrid approach (SAFe + PMBOK) is best

3. **Agent-MCP Architecture is UNIQUE** ⭐
   - **Real-time data capture** via MCPs
   - Agents **store immediately to Mem0**
   - Agents **act quickly** on fresh data
   - **Proactive governance** before agent acts
   - **No one has built this** - breakthrough feature

4. **Attributes in Database Enable**:
   - Keep current dashboards working
   - Recreate deleted dashboards
   - Build new dashboards easily
   - Dynamic dashboard configuration

5. **Company as Agent** ✅
   - Company has attributes like other agents
   - Company has functions (provide context to all agents)
   - Root of agent hierarchy

---

## 🚀 EXECUTION STRATEGY

### Week 1: Attributes
- Days 1-3: Research complete ✅
- Days 4-5: Expand PMO, FinOps, VRO attributes (Tasks 2.1-2.3)
- Days 6-7: Expand other agents + Company agent (Tasks 2.4-2.9)

### Week 2: Dashboards Part 1
- Days 1-2: Portfolio & ART Dashboards (Tasks 3.1-3.2)
- Days 3-4: Value Stream & Project Dashboards (Tasks 3.3-3.4)
- Day 5: MCP Management Dashboard (Task 3.5) ⭐

### Week 3: Dashboards Part 2 + MCPs
- Days 1-2: Enhanced dashboards (Tasks 3.6-3.8)
- Days 3-5: Real MCP implementations (Tasks 4.2a-4.2g)

### Week 4: Integration & Testing
- Days 1-2: Wire MCPs, create connections (Tasks 4.3-4.4)
- Days 3-5: Testing all phases (Tasks 5.1-5.6)

---

## 📝 SOURCES

### SAFe 6.0 Resources:
- [SAFe Flow Metrics Complete Guide](https://premieragile.com/complete-details-on-safe-flow-metrics/)
- [SAFe 6.0 Deep Dive Part 1](https://www.cprime.com/safe-6-0-deep-dive-flow-metrics-part-1-of-2/)
- [SAFe Framework - Measure and Grow](https://framework.scaledagile.com/measure-and-grow)
- [SAFe LPM Implementation Guide](https://www.ppm.express/blog/safe-lean-portfolio-management)
- [SAFe Value Stream KPIs](https://framework.scaledagile.com/value-stream-kpis/)

### PMBOK Resources:
- [PMBOK 7 Measurement Performance Domain](https://onlinepmcourses.com/monitoring-and-controlling-what-is-the-pmbok-7-measurement-performance-domain/)
- [EVM Complete Guide](https://www.projectengineer.net/guide-to-earned-value-management/)
- [PMBOK 8 2026 Updates](https://projectmanagementacademy.net/resources/blog/what-is-pmbok-8/)
- [EVM Metrics Study Guide](https://pmstudycircle.com/earned-value-management-evm/)

---

## ✅ WHAT'S ALREADY DONE (60%)

**Foundation Architecture** (100% Complete):
- ✅ Langflow + Mem0 Integration (Mem0 writes working)
- ✅ Agent-MCP architecture created (schema, services, APIs)
- ✅ LLM Calculator (no hardcoded math)
- ✅ All 8 Deep Agents wired to Langflow with Flow IDs
- ✅ Real MCP services (Jira, ServiceNow, Monday) exist
- ✅ Unified Memory (Postgres+pgvector+Mem0+Letta)
- ✅ BattleRhythm Task Processor running
- ✅ SAFe 6.0 schemas foundation (LPM, ART, Value Stream)
- ✅ PMBOK schemas optional layer
- ✅ 5 Langflow components created
- ✅ Migration script ready
- ✅ API endpoints exist
- ✅ 11 documentation files

**What Remains** (40%):
- Expand agent attributes to 40+/30+/30+ per agent
- Build 8 dashboards (Portfolio, ART, Value Stream, Project, MCP, + 3 enhanced)
- Implement real MCP servers (7 MCPs: 4 knowledge + 3 governance)
- Wire agents to MCPs with default connections
- Test everything end-to-end

---

**THIS IS THE MASTER TODO. All work tracks against this list. Start with Phase 2: Expand Attributes.**
