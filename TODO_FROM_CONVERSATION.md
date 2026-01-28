# TODO LIST - From Conversation Flow (Session Before Crash)

**Created**: 2026-01-27
**Source**: Conversation pasted by user showing work done before session crash

---

## ✅ COMPLETED (From Conversation)

### 1. LLM Calculator Integration with Mem0
- [x] Updated `server/lib/LLMCalculator.ts` to write calculation results to Mem0
- [x] Added entity and sourceAgent parameters to CalculationRequest
- [x] All calculations now stored in Mem0 with full context
- [x] Registered `/api/llm-calculator` routes in server/routes.ts

### 2. Rules Engine Integration with Mem0
- [x] Updated `server/lib/AgentCollaborationRulesEngine.ts` to write rule outcomes to Mem0
- [x] Rule outcomes include: trigger facts, actions, results, timestamp
- [x] Stored per entity (project or agent)

### 3. Langflow Components Created
- [x] `langflow-components/mem0_reader.py` - Read facts from Mem0
- [x] `langflow-components/mem0_writer.py` - Write facts to Mem0
- [x] `langflow-components/llm_calculator.py` - LLM calculations
- [x] `langflow-components/rule_evaluator.py` - Rule evaluation
- [x] `langflow-components/agent_mcp_query.py` - Agent MCP query
- [x] `langflow-components/README.md` - Component documentation

### 4. Agent-MCP Architecture
- [x] Created database schema (mcp_definitions, agent_mcp_connections, mcp_execution_log)
- [x] Created `server/lib/AgentMcpService.ts` - Core MCP service
- [x] Created `server/routes/admin/agent-mcp-connections.ts` - Admin API
- [x] Created `server/routes/agent-mcp.ts` - Public API
- [x] Created `server/scripts/migrate-agent-mcp-tables.ts` - Migration
- [x] Registered routes in server/routes.ts
- [x] Documentation: AGENT_MCP_ARCHITECTURE.md

### 5. SAFe 6.0 Agent Schemas (Foundation)
- [x] Created `server/lib/SAFeAgentSchemas.ts`
- [x] Lean Portfolio Management (LPM) Agent - 14 produces, 3 consumes
- [x] Agile Release Train (ART) Agent - 21 produces, 3 consumes
- [x] Value Stream Agent - 11 produces, 2 consumes

### 6. PMI PMBOK Agent Schemas (Optional Layer)
- [x] Created `server/lib/PMIAgentSchemas.ts`
- [x] PMO Agent - 50 attributes across 10 knowledge areas
- [x] Documentation: SAFE_vs_PMI_AGENT_ATTRIBUTES.md

### 7. Documentation
- [x] LANGFLOW_MEM0_ARCHITECTURE.md
- [x] LANGFLOW_MEM0_INTEGRATION_COMPLETE.md
- [x] AGENT_MCP_ARCHITECTURE.md
- [x] SAFE_vs_PMI_AGENT_ATTRIBUTES.md

---

## 🔴 CRITICAL TODO (From Conversation - User Requirements)

### 1. RUN DATABASE MIGRATION (Immediate)
```bash
npm run build
tsx server/scripts/migrate-agent-mcp-tables.ts
```
**Why**: Creates mcp_definitions, agent_mcp_connections, mcp_execution_log tables

### 2. EXPAND SAFe AGENT ATTRIBUTES TO 40+/30+ (User Requirement)

#### PMO Agent: Expand to 40+ Attributes
**User Said**: "Enhanced Agent Attributes PMO Agent (40+ attributes)"

**SAFe 6.0 Flow Metrics** (Add to SAFeAgentSchemas.ts):
- [ ] Flow Velocity - epics/features per PI
- [ ] Flow Time - concept-to-cash duration
- [ ] Flow Load - WIP items count
- [ ] Flow Efficiency - value-added time ratio
- [ ] Flow Predictability - objectives achieved
- [ ] ART Predictability scores

**PMBOK 7 Performance Domain** (Optional overlay):
- [ ] Milestone Completion Rate
- [ ] Defect Density
- [ ] Net Promoter Score (NPS)
- [ ] Team Velocity & Morale
- [ ] Schedule Quality Index

**Files to Update**:
- `server/lib/SAFeAgentSchemas.ts` - Add PMO attributes
- `server/lib/PMIAgentSchemas.ts` - Add PMBOK overlay attributes

#### FinOps Agent: Expand to 30+ Attributes
**User Said**: "FinOps Agent (30+ attributes)"

**SAFe 6.0 Lean Portfolio Budgeting** (Add to SAFeAgentSchemas.ts):
- [ ] Value Stream Budgets
- [ ] CapEx/OpEx Split
- [ ] Investment Horizons (H1/H2/H3)
- [ ] Epic Funding Status

**PMBOK 7 Earned Value Management** (Optional overlay):
- [ ] EV, PV, AC, BAC (core values)
- [ ] CV, SV (variances)
- [ ] CPI, SPI (performance indices)
- [ ] EAC, ETC, VAC (forecasts)
- [ ] TCPI (required performance)

**Files to Update**:
- `server/lib/SAFeAgentSchemas.ts` - Add FinOps attributes
- `server/lib/PMIAgentSchemas.ts` - Add PMBOK EVM attributes

#### VRO Agent: Expand to 30+ Attributes
**User Said**: "VRO Agent (30+ attributes)"

**SAFe 6.0 OKRs/KPIs** (Add to SAFeAgentSchemas.ts):
- [ ] OKR Progress tracking
- [ ] Customer Satisfaction (CSAT/NPS)
- [ ] Time to Market
- [ ] ROI & Revenue Growth
- [ ] Customer Retention

**PMI Benefits Realization** (Optional overlay):
- [ ] Benefits Register
- [ ] Benefits Dependency Map
- [ ] Leading & Lagging Indicators

**Files to Update**:
- `server/lib/SAFeAgentSchemas.ts` - Add VRO attributes
- `server/lib/PMIAgentSchemas.ts` - Add Benefits Realization attributes

### 3. BUILD SAFe DASHBOARDS (User Requirement)
**User Said**: "they say that is how the dashboards where created and the next leel project reporting"

#### A. Portfolio Dashboard (LPM Level)
- [ ] Create `client/src/pages/PortfolioDashboard.tsx`
- [ ] Display Strategic Themes
- [ ] Display Portfolio Vision
- [ ] WSJF Epic Prioritization chart
- [ ] Portfolio Flow Metrics (Flow Time, Flow Efficiency, Flow Load)
- [ ] Value Stream Budgets visualization
- [ ] Investment Horizons breakdown (H1/H2/H3)

#### B. ART Dashboard (Program Level)
- [ ] Create `client/src/pages/ARTDashboard.tsx`
- [ ] PI Objectives & Status
- [ ] PI Predictability Chart (80% target line)
- [ ] Flow Velocity chart (epics/features per PI)
- [ ] Team Velocity & Capacity
- [ ] Dependency Health Matrix
- [ ] DORA Metrics panel:
  - Deployment Frequency
  - Lead Time for Changes
  - Change Failure Rate
  - Mean Time to Recovery (MTTR)

#### C. Value Stream Dashboard
- [ ] Create `client/src/pages/ValueStreamDashboard.tsx`
- [ ] Value Stream Map visualization
- [ ] Lead Time tracking
- [ ] Flow Efficiency
- [ ] Cost of Delay
- [ ] Economic Framework metrics

#### D. Project Dashboard (SAFe + PMBOK Hybrid)
- [ ] Create `client/src/pages/ProjectDashboard.tsx`
- [ ] Level 1: SAFe Metrics (default)
  - PI Predictability
  - Flow Efficiency
  - Flow Time
- [ ] Level 2: PMBOK Metrics (toggle based on client methodology selection)
  - SPI, CPI
  - EAC, VAC
  - Schedule Performance
- [ ] Quality Metrics
- [ ] Resource Utilization

#### E. MCP Management Dashboard
- [ ] Create `client/src/pages/MCPDashboard.tsx`
- [ ] List all agents with their connected MCPs
- [ ] Toggle switches to enable/disable MCP connections per agent
- [ ] View MCP execution logs
- [ ] MCP usage statistics
- [ ] Governance decision history (allow/block/warn)

### 4. SEED MCP DEFINITIONS (Required for MCP Dashboard)

#### Knowledge MCPs
- [ ] Add Jira MCP definition
- [ ] Add Azure DevOps MCP definition
- [ ] Add SAP MCP definition
- [ ] Add Coupa MCP definition

#### Governance MCPs
- [ ] Add Responsible AI MCP definition
- [ ] Add QA MCP definition
- [ ] Add Policy MCP definition

### 5. CREATE DEFAULT AGENT-MCP CONNECTIONS
- [ ] PMO → Jira, Azure DevOps, Responsible AI, QA
- [ ] FinOps → SAP, Coupa, Responsible AI, QA
- [ ] Risk → All Governance MCPs
- [ ] VRO → Jira, SAP, QA
- [ ] TMO → Jira, Azure DevOps, QA
- [ ] Governance → All Governance MCPs
- [ ] Planning → Jira, Azure DevOps, Policy
- [ ] OCM → Jira, Responsible AI, Policy

### 6. IMPLEMENT REAL MCP SERVER COMMUNICATION (Beyond Current Mocks)
**User Said**: "we connect MCPs to agents 1. for knowledge as well becauses the data flows via the MCP so we get faster insights 2. we can apply Reponsible AI, QA and governanmce"

- [ ] Connect to actual Jira API (currently simulated)
- [ ] Connect to actual Azure DevOps API
- [ ] Connect to actual SAP API
- [ ] Connect to actual Coupa API
- [ ] Implement Responsible AI MCP validation (bias detection, safety checks)
- [ ] Implement QA MCP validation (quality standards)
- [ ] Implement Policy MCP enforcement (organizational policies)

### 7. WIRE DASHBOARDS TO USE SAFe SCHEMAS
**User Said**: "they want you to use the Safe schemea not PMBOK"

- [ ] Update AgentObjectSchema.ts to use SAFe 6.0 as default
- [ ] Allow PMBOK overlay via client methodology selection API
- [ ] Create `/api/agent-schemas/methodology` endpoint to switch between SAFe/PMBOK/Hybrid
- [ ] Wire dashboards to query agent schemas dynamically

---

## 🟡 MEDIUM PRIORITY (From Conversation Context)

### 8. TEST LANGFLOW COMPONENTS
- [ ] Copy langflow-components/*.py to Langflow custom_components directory
- [ ] Test mem0_reader component
- [ ] Test mem0_writer component
- [ ] Test llm_calculator component
- [ ] Test rule_evaluator component
- [ ] Test agent_mcp_query component

### 9. CREATE TEST LANGFLOW FLOWS
- [ ] Test Flow 1: Rule evaluation with Mem0 context
- [ ] Test Flow 2: LLM calculation with Mem0 storage
- [ ] Test Flow 3: Agent MCP query with governance validation

### 10. UPDATE INDUSTRY-SPECIFIC ATTRIBUTES
**User mentioned**: "Enhanced Agent Attributes... they said thre are more for you"

Currently exists in `server/lib/IndustryAgentSchemas.ts`:
- Energy sector attributes
- Healthcare sector attributes
- Finance sector attributes
- Manufacturing sector attributes

- [ ] Review and expand industry-specific attributes
- [ ] Add more sectors if needed
- [ ] Wire to dashboard methodology selector

---

## 📊 COMPLETION STATUS

### Work Done (From Conversation):
- ✅ Langflow + Mem0 integration (Mem0 writes working)
- ✅ Agent-MCP architecture created
- ✅ SAFe 6.0 schemas foundation
- ✅ PMBOK schemas as optional layer
- ✅ Langflow components created (5 Python files)
- ✅ Migration script created
- ✅ Routes registered
- ✅ Documentation written (4 MD files)

### Critical Next Steps (User Requirements):
1. **Run migration** (creates tables)
2. **Expand SAFe attributes** (40+/30+/30+ per agent)
3. **Build SAFe dashboards** (5 dashboards)
4. **Seed MCPs** (7 MCP definitions)
5. **Connect agents to MCPs** (8 agents × ~4 MCPs each)
6. **Implement real MCP communication** (not simulated)

### Progress:
- **Foundation**: 100% ✅ (Schemas, architecture, components)
- **Attributes**: 30% (Base schemas exist, need 40+/30+/30+ expansion)
- **Dashboards**: 0% (Need to build 5 SAFe dashboards)
- **MCP Integration**: 50% (Architecture done, need seeding + real APIs)
- **Testing**: 0% (Components created, not tested)

---

## 🎯 RECOMMENDED EXECUTION ORDER (From User Requirements)

### Week 1: Attributes & MCP Setup
1. Run migration
2. Expand PMO to 40+ attributes
3. Expand FinOps to 30+ attributes
4. Expand VRO to 30+ attributes
5. Seed MCP definitions
6. Create default agent-MCP connections

### Week 2: Dashboards (SAFe-Based)
7. Build Portfolio Dashboard (LPM)
8. Build ART Dashboard (Program)
9. Build Value Stream Dashboard
10. Build Project Dashboard (SAFe + PMBOK toggle)
11. Build MCP Management Dashboard

### Week 3: Real MCP Integration
12. Implement real Jira API connection
13. Implement real Azure DevOps API connection
14. Implement real SAP API connection
15. Implement real Coupa API connection
16. Implement Responsible AI MCP validation
17. Implement QA MCP validation
18. Implement Policy MCP enforcement

### Week 4: Testing & Polish
19. Test Langflow components
20. Test MCP connections end-to-end
21. Test dashboards with real data
22. Test methodology switching (SAFe/PMBOK/Hybrid)

---

## 💡 KEY INSIGHTS FROM CONVERSATION

1. **SAFe 6.0 is Foundation** - User said "use the Safe for now it covers the entire PPM process and our ontology is built on it"

2. **PMBOK is Optional Overlay** - Not the primary, just an option based on client methodology selection

3. **40+/30+/30+ Attributes Required** - User provided specific targets:
   - PMO: 40+ attributes
   - FinOps: 30+ attributes
   - VRO: 30+ attributes

4. **Dashboards Drive Value** - User said "that is how the dashboards where created and the next level project reporting"

5. **MCP Purpose Clear** - User said:
   - "for knowledge... data flows via the MCP so we get faster insights"
   - "apply Responsible AI, QA and governance so now we are proactive"

6. **Multi-PPM Support** - User said "a client may have multiple PPMs"

---

**THIS IS THE TODO LIST FROM YOUR CONVERSATION. FOCUS ON THESE TASKS.**
