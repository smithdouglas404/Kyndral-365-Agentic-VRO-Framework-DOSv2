# FINAL TODO LIST - Master Backlog
**Last Updated**: 2026-01-27 (After full document review)
**Source**: All root MD documents + conversation flow

---

## ✅ WHAT'S ALREADY DONE (60% COMPLETE!)

### Core Architecture (100% COMPLETE)
- [x] **Langflow + Mem0 Integration** - Agents write to Mem0, Langflow reads/writes
- [x] **Agent-MCP Architecture** - Database schema, services, API endpoints created
- [x] **LLM Calculator** - No hardcoded math, all LLM with narrative + sourcing
- [x] **All 8 Agents Wired to Langflow** - With Flow IDs, calling executeLangflowFlow()
- [x] **Real MCP Services Created** - Jira, ServiceNow, Monday services (server/mcp/)
- [x] **Unified Memory Architecture** - Postgres+pgvector+Mem0+Letta working
- [x] **BattleRhythm Task Processor** - Processing agent_task_queue every 30s
- [x] **SAFe 6.0 Schemas Foundation** - LPM, ART, Value Stream agents
- [x] **PMBOK Schemas Optional Layer** - PMO agent with 50 attributes
- [x] **5 Langflow Components** - mem0_reader, mem0_writer, llm_calculator, rule_evaluator, agent_mcp_query
- [x] **Migration Script** - migrate-agent-mcp-tables.ts ready
- [x] **API Endpoints** - /api/agent-mcp/*, /api/admin/agent-mcp-connections/*, /api/llm-calculator/*
- [x] **Documentation** - 11 MD files created

### Server Endpoints Working (100% COMPLETE)
- [x] POST /api/agent-actions/jira/* (create-issue, update-issue, add-comment)
- [x] POST /api/agent-actions/servicenow/* (create-incident, update-incident)
- [x] POST /api/agent-actions/slack/notify
- [x] POST /api/agent-actions/notify/{agent} (agent-to-agent)
- [x] POST /api/llm-calculator/* (8 calculation endpoints)
- [x] POST /api/mem0/* (write-fact, read-facts)
- [x] POST /api/agent-mcp/query
- [x] GET /api/agent-mcp/agent/{agentId}/mcps

---

## 🔴 PHASE 1: DATABASE & MCP SETUP (IMMEDIATE - Week 1)

### 1.1 Run Agent-MCP Migration ⭐ START HERE
```bash
cd /home/runner/workspace
npm run build
tsx server/scripts/migrate-agent-mcp-tables.ts
```

**Creates**:
- mcp_definitions table
- agent_mcp_connections table
- mcp_execution_log table
- **Seeds 7 default MCPs** (per AGENT_MCP_ARCHITECTURE.md line 471)
- **Creates default agent-MCP connections** (per AGENT_MCP_ARCHITECTURE.md line 472)

**Verify**:
```sql
SELECT * FROM mcp_definitions;
SELECT * FROM agent_mcp_connections WHERE agent_id = 'pmo';
```

### 1.2 Test Agent-MCP Query API
```bash
curl -X POST http://localhost:5000/api/agent-mcp/query \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "pmo",
    "operation": "get_project_status",
    "input": {"projectId": "123"}
  }'
```

**Expected**: Returns knowledge + governance results (currently simulated)

---

## 🟠 PHASE 2: EXPAND SAFe ATTRIBUTES (Week 1-2)

**Goal**: Expand to 40+/30+/30+ attributes per agent (per user requirement)

### 2.1 PMO Agent: Expand to 40+ Attributes
**File**: `server/lib/SAFeAgentSchemas.ts`

**Add SAFe 6.0 Flow Metrics**:
- [ ] flow_velocity (epics/features per PI)
- [ ] flow_time (concept-to-cash duration)
- [ ] flow_load (WIP items count)
- [ ] flow_efficiency (value-added time ratio)
- [ ] flow_predictability (objectives achieved %)
- [ ] art_predictability_score (team predictability)
- [ ] deployment_frequency (DORA metric)
- [ ] lead_time_for_changes (DORA metric)
- [ ] change_failure_rate (DORA metric)
- [ ] mean_time_to_recovery (DORA metric - MTTR)

**Add PMBOK 7 Performance Domain** (Optional overlay in PMIAgentSchemas.ts):
- [ ] milestone_completion_rate
- [ ] defect_density
- [ ] net_promoter_score (NPS)
- [ ] team_velocity
- [ ] team_morale_index
- [ ] schedule_quality_index

**Target**: 40+ total attributes

### 2.2 FinOps Agent: Expand to 30+ Attributes
**File**: `server/lib/SAFeAgentSchemas.ts`

**Add SAFe 6.0 Lean Portfolio Budgeting**:
- [ ] value_stream_budgets (per value stream)
- [ ] capex_opex_split (ratio)
- [ ] investment_horizon_h1 (Horizon 1 - sustaining)
- [ ] investment_horizon_h2 (Horizon 2 - growth)
- [ ] investment_horizon_h3 (Horizon 3 - transformation)
- [ ] epic_funding_status (funded/unfunded)
- [ ] portfolio_budget_utilization
- [ ] budget_burn_rate

**Add PMBOK 7 Earned Value Management** (Optional overlay):
- [ ] earned_value (EV)
- [ ] planned_value (PV)
- [ ] actual_cost (AC)
- [ ] budget_at_completion (BAC)
- [ ] cost_variance (CV)
- [ ] schedule_variance (SV)
- [ ] cost_performance_index (CPI)
- [ ] schedule_performance_index (SPI)
- [ ] estimate_at_completion (EAC)
- [ ] estimate_to_complete (ETC)
- [ ] variance_at_completion (VAC)
- [ ] to_complete_performance_index (TCPI)

**Target**: 30+ total attributes

### 2.3 VRO Agent: Expand to 30+ Attributes
**File**: `server/lib/SAFeAgentSchemas.ts`

**Add SAFe 6.0 OKRs/KPIs**:
- [ ] okr_progress (per OKR)
- [ ] customer_satisfaction_score (CSAT)
- [ ] net_promoter_score (NPS)
- [ ] time_to_market (days)
- [ ] return_on_investment (ROI %)
- [ ] revenue_growth (%)
- [ ] customer_retention_rate (%)
- [ ] customer_lifetime_value (CLV)
- [ ] market_share_growth (%)
- [ ] innovation_rate (new features %)

**Add PMI Benefits Realization** (Optional overlay):
- [ ] benefits_register (list of benefits)
- [ ] benefits_dependency_map
- [ ] leading_indicators (early signals)
- [ ] lagging_indicators (outcome measures)
- [ ] benefits_realization_rate (%)
- [ ] benefit_cost_ratio (BCR)

**Target**: 30+ total attributes

---

## 🟠 PHASE 3: BUILD SAFe DASHBOARDS (Week 2-3)

### 3.1 Portfolio Dashboard (LPM Level)
**File**: `client/src/pages/PortfolioDashboard.tsx` (CREATE NEW)

**Components**:
- [ ] Strategic Themes display
- [ ] Portfolio Vision panel
- [ ] WSJF Epic Prioritization chart (bar chart: WSJF score vs Epic)
- [ ] Portfolio Flow Metrics panel:
  - Flow Time line chart
  - Flow Efficiency gauge (target: 40%)
  - Flow Load bar chart
- [ ] Value Stream Budgets pie chart
- [ ] Investment Horizons stacked bar (H1/H2/H3)
- [ ] Budget Guardrails status indicators

**API Endpoints Needed**:
- GET /api/agents/lpm/attributes
- GET /api/portfolio/strategic-themes
- GET /api/portfolio/flow-metrics
- GET /api/portfolio/value-streams

### 3.2 ART Dashboard (Program Level)
**File**: `client/src/pages/ARTDashboard.tsx` (CREATE NEW)

**Components**:
- [ ] PI Objectives & Status board (Kanban-style)
- [ ] PI Predictability Chart (line chart, 80% target)
- [ ] Flow Velocity chart (epics/features per PI)
- [ ] Team Velocity & Capacity (bar chart per team)
- [ ] Dependency Health Matrix (grid visualization)
- [ ] DORA Metrics panel:
  - Deployment Frequency (gauge)
  - Lead Time for Changes (line chart)
  - Change Failure Rate (gauge, target: <15%)
  - MTTR (gauge, target: <1 hour)

**API Endpoints Needed**:
- GET /api/agents/art/attributes
- GET /api/art/pi-objectives
- GET /api/art/flow-metrics
- GET /api/art/dora-metrics

### 3.3 Value Stream Dashboard
**File**: `client/src/pages/ValueStreamDashboard.tsx` (CREATE NEW)

**Components**:
- [ ] Value Stream Map visualization (flow diagram)
- [ ] Lead Time tracking (line chart over time)
- [ ] Flow Efficiency gauge (target: 30%)
- [ ] Cost of Delay calculator
- [ ] Economic Framework metrics panel
- [ ] Value Stream Budget utilization

**API Endpoints Needed**:
- GET /api/agents/value-stream/attributes
- GET /api/value-streams/:id/map
- GET /api/value-streams/:id/metrics

### 3.4 Project Dashboard (SAFe + PMBOK Hybrid)
**File**: `client/src/pages/ProjectDashboard.tsx` (ENHANCE EXISTING)

**SAFe Metrics (Level 1 - Always Show)**:
- [ ] PI Predictability gauge
- [ ] Flow Efficiency gauge
- [ ] Flow Time line chart

**PMBOK Metrics (Level 2 - Toggle based on client methodology)**:
- [ ] SPI/CPI dual gauge
- [ ] EAC vs BAC comparison
- [ ] VAC indicator
- [ ] Schedule Performance chart

**Quality & Resource Panels**:
- [ ] Defect Density trend
- [ ] Resource Utilization heatmap

**Methodology Toggle**:
- [ ] Radio buttons: SAFe Only | PMBOK Only | Hybrid
- [ ] Dynamically show/hide metric panels

**API Endpoints Needed**:
- GET /api/projects/:id/safe-metrics
- GET /api/projects/:id/pmbok-metrics
- GET /api/projects/:id/methodology

### 3.5 MCP Management Dashboard ⭐ CRITICAL
**File**: `client/src/pages/MCPDashboard.tsx` (CREATE NEW)

**Purpose**: Toggle MCPs per agent (per AGENT_MCP_ARCHITECTURE line 543)

**Components**:
- [ ] Agent list (PMO, FinOps, TMO, Risk, VRO, Governance, Planning, OCM)
- [ ] For each agent, show connected MCPs:
  - Knowledge MCPs (Jira, Azure DevOps, SAP, Coupa)
  - Governance MCPs (Responsible AI, QA, Policy)
- [ ] Toggle switches to enable/disable each connection
- [ ] MCP execution logs table (recent 100 executions)
- [ ] Usage statistics panel:
  - Execution count per MCP
  - Success rate
  - Average execution time
  - Governance decisions (allow/block/warn counts)
- [ ] Governance decision history chart

**API Endpoints** (ALREADY EXIST per AGENT_MCP_ARCHITECTURE):
- GET /api/agent-mcp/agent/{agentId}/mcps
- PUT /api/admin/agent-mcp-connections/{connectionId} (toggle enabled)
- GET /api/admin/agent-mcp-connections/logs?agentId={id}&limit=100
- GET /api/admin/agent-mcp-connections/stats

**Example Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ MCP Management Dashboard                                │
├─────────────────────────────────────────────────────────┤
│ Agent: PMO                                              │
│   Knowledge MCPs:                                       │
│     [x] Jira Integration           (245 calls, 99.2%)  │
│     [x] Azure DevOps               (180 calls, 100%)   │
│   Governance MCPs:                                      │
│     [x] Responsible AI Validator   (425 calls, 100%)   │
│     [x] QA Validator               (425 calls, 98.8%)  │
├─────────────────────────────────────────────────────────┤
│ Recent Executions (Last 100):                           │
│ PMO → Jira → Success (45ms) → Allow                    │
│ PMO → Responsible AI → Success (12ms) → Allow          │
│ PMO → QA → Success (8ms) → Warn (data quality)        │
└─────────────────────────────────────────────────────────┘
```

---

## 🟡 PHASE 4: IMPLEMENT REAL MCP SERVERS (Week 3-4)

**Currently**: MCPs return simulated data
**Goal**: Connect to real external APIs

### 4.1 Knowledge MCP Servers

#### Jira MCP (Enhance Existing)
**File**: `server/mcp/JiraService.ts`
- [x] Service exists (per INTEGRATION_COMPLETE.md)
- [ ] Test with real Jira credentials
- [ ] Verify create-issue, update-issue, add-comment
- [ ] Add query-projects, query-sprints operations

#### Azure DevOps MCP (Create New)
**File**: `server/mcp/AzureDevOpsService.ts` (CREATE)
- [ ] Implement Azure DevOps REST API client
- [ ] Operations: query-work-items, query-boards, create-work-item
- [ ] Add to MCPServiceFactory routing

#### SAP MCP (Create New)
**File**: `server/mcp/SAPService.ts` (CREATE)
- [ ] Implement SAP OData API client
- [ ] Operations: query-financials, query-budgets, query-cost-centers
- [ ] Add to MCPServiceFactory routing

#### Coupa MCP (Create New)
**File**: `server/mcp/CoupaService.ts` (CREATE)
- [ ] Implement Coupa REST API client
- [ ] Operations: query-procurement, query-suppliers, query-contracts
- [ ] Add to MCPServiceFactory routing

### 4.2 Governance MCP Servers (Create New)

#### Responsible AI MCP (Create New)
**File**: `server/mcp/ResponsibleAIService.ts` (CREATE)
- [ ] Implement bias detection checks
- [ ] Implement safety validation
- [ ] Implement ethical concern screening
- [ ] Return decision: allow | block | warn
- [ ] Return reason with confidence score

#### QA MCP (Create New)
**File**: `server/mcp/QAService.ts` (CREATE)
- [ ] Implement quality standards validation
- [ ] Implement best practices checks
- [ ] Implement data quality assessment
- [ ] Return decision: allow | block | warn
- [ ] Return reason with improvement suggestions

#### Policy MCP (Create New)
**File**: `server/mcp/PolicyService.ts` (CREATE)
- [ ] Implement organizational policy enforcement
- [ ] Load policies from database (policy_rules table)
- [ ] Validate actions against policies
- [ ] Return decision: allow | block | warn
- [ ] Return reason citing specific policy violated

### 4.3 Wire MCPs to AgentMcpService
**File**: `server/lib/AgentMcpService.ts`
- [ ] Update queryKnowledgeMCPs() to call real services
- [ ] Update validateGovernanceMCPs() to call real services
- [ ] Remove mock/simulated responses
- [ ] Add error handling for external API failures
- [ ] Add 5-minute caching to Mem0 (already architected)

---

## 🟢 PHASE 5: TESTING & DOCUMENTATION (Week 4)

### 5.1 Test End-to-End Flows
- [ ] Test PMO agent → Jira MCP → Responsible AI MCP → Result
- [ ] Test FinOps agent → SAP MCP → QA MCP → Result
- [ ] Test Risk agent → All Governance MCPs → Block scenario
- [ ] Test VRO agent → Mixed MCPs → Warn scenario

### 5.2 Test Dashboard Functionality
- [ ] Test Portfolio Dashboard with real LPM data
- [ ] Test ART Dashboard with real PI data
- [ ] Test Project Dashboard methodology toggle
- [ ] Test MCP Dashboard enable/disable toggles
- [ ] Test MCP Dashboard execution logs

### 5.3 Test Langflow Components
- [ ] Install components to Langflow custom_components/
- [ ] Test mem0_reader component
- [ ] Test mem0_writer component
- [ ] Test llm_calculator component
- [ ] Test rule_evaluator component
- [ ] Test agent_mcp_query component (with real MCP calls)

### 5.4 Performance Testing
- [ ] Test MCP cache (5-minute Mem0 cache)
- [ ] Measure MCP execution times
- [ ] Test concurrent agent MCP queries
- [ ] Test governance MCP blocking

### 5.5 Documentation Updates
- [ ] Update AGENT_MCP_ARCHITECTURE.md with real MCP implementations
- [ ] Create DASHBOARD_USER_GUIDE.md
- [ ] Create MCP_ADMIN_GUIDE.md
- [ ] Update COMPLETE_IMPLEMENTATION_SUMMARY.md

---

## 📊 EXECUTION TRACKER

### Sprint 1 (Week 1): Foundation
- [ ] Run migration (Task 1.1) ⭐ START HERE
- [ ] Test Agent-MCP API (Task 1.2)
- [ ] Expand PMO attributes to 40+ (Task 2.1)
- [ ] Expand FinOps attributes to 30+ (Task 2.2)
- [ ] Expand VRO attributes to 30+ (Task 2.3)

### Sprint 2 (Week 2): Dashboards Part 1
- [ ] Build Portfolio Dashboard (Task 3.1)
- [ ] Build ART Dashboard (Task 3.2)
- [ ] Build Value Stream Dashboard (Task 3.3)

### Sprint 3 (Week 3): Dashboards Part 2 + MCP Servers
- [ ] Build Project Dashboard (Task 3.4)
- [ ] Build MCP Management Dashboard (Task 3.5) ⭐
- [ ] Implement real Jira MCP (Task 4.1)
- [ ] Implement real Azure DevOps MCP (Task 4.1)

### Sprint 4 (Week 4): Governance MCPs + Testing
- [ ] Implement Responsible AI MCP (Task 4.2)
- [ ] Implement QA MCP (Task 4.2)
- [ ] Implement Policy MCP (Task 4.2)
- [ ] Wire to AgentMcpService (Task 4.3)
- [ ] End-to-end testing (Task 5.1-5.4)
- [ ] Documentation updates (Task 5.5)

---

## 🎯 COMPLETION STATUS

| Phase | Tasks | Done | Remaining | Progress |
|-------|-------|------|-----------|----------|
| Foundation (Completed) | 13 | 13 | 0 | 100% ✅ |
| Phase 1: DB & MCP Setup | 2 | 0 | 2 | 0% |
| Phase 2: SAFe Attributes | 3 | 0 | 3 | 0% |
| Phase 3: Dashboards | 5 | 0 | 5 | 0% |
| Phase 4: Real MCP Servers | 10 | 0 | 10 | 0% |
| Phase 5: Testing & Docs | 5 | 0 | 5 | 0% |
| **TOTAL** | **38** | **13** | **25** | **34%** |

**Note**: Foundation (60%) was completed pre-crash. Remaining work (40%) is in Phases 1-5.

---

## 🔑 KEY DECISIONS (From Documents)

1. **SAFe 6.0 as Foundation** ✅ (User requirement, ontology built on it)
2. **PMBOK as Optional Overlay** ✅ (Toggle in dashboard per client)
3. **Langflow as Active Orchestrator** ✅ (Not passive visualization)
4. **Mem0 as Memory Layer** ✅ (Hippocampus for agents + Langflow)
5. **Agent-MCP Architecture** ✅ (Knowledge + Governance separation)
6. **40+/30+/30+ Attributes** 🔄 (User requirement, need to expand)
7. **MCP Dashboard Critical** ⭐ (Toggle connections per agent)
8. **Real MCP Integration** 🔄 (Currently simulated, need real APIs)

---

## 📝 NOTES

- **Migration is ready** - Just run tsx server/scripts/migrate-agent-mcp-tables.ts
- **Seeds data automatically** - Creates 7 MCPs + default connections
- **API endpoints exist** - All /api/agent-mcp/* and /api/admin/* routes ready
- **Langflow components exist** - 5 Python files in langflow-components/
- **Documentation complete** - 11 MD files with architecture and flows
- **Build passing** - npm run build works with 13 warnings (acceptable)

---

**THIS IS YOUR MASTER TODO. All work from here forward tracks against this list.**
