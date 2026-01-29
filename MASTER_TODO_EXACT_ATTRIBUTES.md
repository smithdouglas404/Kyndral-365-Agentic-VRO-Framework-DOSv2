# MASTER TODO - Complete Agent Attribute Expansion (EXACT SAFe Attributes)

**⚠️ THIS IS THE AUTHORITATIVE EXECUTION PLAN FOR ATTRIBUTES + EXECUTION**
**NOTE**: `MASTER_ARCHITECTURE.md` is the primary authority. `MASTER_TODO.md` remains a reconciled supplement (not deprecated).

**Created**: 2026-01-27
**Updated**: 2026-01-27 (Phase 2 Complete - 315 Attributes + Logic Gates)
**Status**: Foundation + Attributes Complete (46%) - Langflow Scenarios, Dashboards & MCPs Remaining (54%)

**Reference Documents**:
- `ALL_AGENTS_WIRED.md` - Existing Langflow Flow IDs for all 8 agents
- `AGENT_MCP_ARCHITECTURE.md` - MCP integration architecture
- `TODO_FROM_CONVERSATION.md` - Historical context
- `BACKLOG.md` - Historical backlog
- `FINAL_TODO.md` - Old version
- `MASTER_TODO.md` - Reconciled supplement (dashboards + research archive)
- `MASTER_ARCHITECTURE.md` - Authoritative architecture

---

## 🔁 RECONCILED BACKLOG (FROM MASTER_ARCHITECTURE + MASTER_TODO)

### A. Architecture-Defined Implementation (not previously tracked here)
- [x] Company Discovery Service (SEC EDGAR + OpenCorporates, dedupe) → `server/services/companyDiscovery.ts`
- [x] Policy-as-Code Extractor (Claude prompts, confidence scoring, ontology mapping) → `server/services/policyAsCodeExtractor.ts`
- [x] Dashboard Generator (executive/value stream/risk templates) → `server/services/dashboardGenerator.ts`
- [x] Company Profile routes (10 endpoints) → `server/routes/company-profile.ts`
- [x] Approval Center routes (5 endpoints) → `server/routes/approval-center.ts`
- [x] Register routes in `server/routes.ts` for company profile + approval center
- [ ] Add required env vars (ANTHROPIC_API_KEY, SEC_EDGAR_EMAIL)
- [ ] Testing: company discovery, extraction, dashboard generation workflows

### B. Dashboard Build (from deprecated MASTER_TODO.md)
- [x] Portfolio Dashboard page created → `client/src/pages/PortfolioDashboard.tsx`
- [x] ART Dashboard page created → `client/src/pages/ARTDashboard.tsx`
- [x] Value Stream Dashboard page created → `client/src/pages/ValueStreamDashboard.tsx`
- [x] MCP Management Dashboard page created → `client/src/pages/MCPDashboard.tsx`
- [ ] Custom Dashboard Builder (widget-based, add/remove metric tiles) → `client/src/components/CustomizableDashboard.tsx`
- [ ] Project Dashboard enhancements (SAFe/PMBOK toggle + widgets)
- [ ] FinOps dashboard enhancements (EVM S-curve, TCPI, variance table)
- [ ] Governance dashboard enhancements (compliance/audit/control panels)
- [ ] Planning dashboard enhancements (roadmap health, dependency graph, backlog health, capacity forecast)

---

## 📋 CRITICAL UNDERSTANDING

**This is a real-time data fabric where 100+ agents feed dashboards requiring high-fidelity granularity (30+ attributes per domain).**

**Attributes include**:
- **Telemetry** (real-time status)
- **Metadata** (context and history)
- **Relational Pointers** (links between entities)
- **Logic Gates** (agent interaction rules)

---

## ✅ PHASE 2 COMPLETION SUMMARY

**Status**: Phase 2 100% Complete - Ready for Phase 2B (Langflow Implementation)

### What Was Accomplished

**1. Agent Attributes Expanded (315 Total)**

All 9 agents now have 30-40 attributes based on exact SAFe 6.0 methodology:

| Agent | Before | After | File Location |
|-------|--------|-------|---------------|
| PMO | 8 | 38 | `server/agents/attributes/PMOAgentAttributes.ts` |
| FinOps | 10 | 40 | `server/agents/attributes/FinOpsAgentAttributes.ts` |
| VRO | 7 | 37 | `server/agents/attributes/VROAgentAttributes.ts` |
| Planning | 0 | 30 | `server/agents/attributes/PlanningAgentAttributes.ts` (NEW) |
| OCM | 8 | 38 | `server/agents/attributes/OCMAgentAttributes.ts` |
| Risk | 8 | 39 | `server/agents/attributes/RiskAgentAttributes.ts` |
| Governance | 0 | 32 | `server/agents/attributes/GovernanceAgentAttributes.ts` (NEW) |
| TMO | 8 | 38 | `server/agents/attributes/TMOAgentAttributes.ts` |
| Company (ROOT) | 0 | 23 | `server/agents/attributes/CompanyAgentAttributes.ts` (NEW) |
| **TOTAL** | 49 | **315** | ✅ |

**2. Critical SAFe Metrics Implemented**

Key attributes that enable autonomous agent collaboration:
- ⭐ `wip_age` (PMO) - Time in "Implementing" status
- ⭐ `flow_efficiency` (PMO) - Active Time / Total Lead Time
- ⭐ `load_vs_capacity_ratio` (Planning) - Goal: < 90%
- ⭐ `burnout_risk_idx` (OCM) - Correlation of Flow Load + eNPS
- ⭐ `exposure_value` (Risk) - Financial risk ($)
- ⭐ `gate_status` (Governance) - Release gate control
- ⭐ `critical_vuln_count` (Governance) - Security gate trigger
- ⭐ `competency_score` (TMO) - Team agile maturity (0-5)
- ⭐ `enps_sentiment` (TMO) - Employee Net Promoter Score

**3. Logic Gates Implemented (5 Gates)**

File: `server/lib/AgentLogicGates.ts`

1. **Gate A: Compliance-Risk Deadbolt** (Priority 100) - Block releases when exposure > $100K or critical vulnerabilities detected
2. **Gate D: Budget Overrun Circuit Breaker** (Priority 95) - Block work when budget exceeded
3. **Gate C: Audit-Ready Barrier** (Priority 90) - Create compliance epic when audit deadline approaching
4. **Gate E: Burnout Brake** (Priority 85) - Invalidate capacity when burnout risk high
5. **Gate B: Maturity-Speed Governor** (Priority 80) - Reduce load when team maturity low

**4. Agent Interaction Scenarios Defined (4 Scenarios)**

File: `server/lib/AgentInteractionScenarios.ts`

1. **Scenario A: Budget Overrun** (FinOps ↔ PMO ↔ VRO) - Gate D
2. **Scenario B: Burnout Brake** (OCM ↔ Planning ↔ TMO) - Gate E
3. **Scenario C: Regulatory Deadbolt** (Risk ↔ Governance ↔ PMO) - Gates A + C
4. **Scenario D: Maturity Governor** (TMO ↔ PMO ↔ Planning) - Gate B

**IMPORTANT**: Scenario simulators and fake data removed. Testing will use real production data only.

**Files Created/Modified**:
- ✅ 3 new attribute files (Planning, Governance, Company)
- ✅ 6 attribute files expanded (PMO, FinOps, VRO, OCM, Risk, TMO)
- ✅ 2 new lib files (AgentLogicGates.ts, AgentInteractionScenarios.ts)

---

## 🔧 PHASE 2: EXPAND AGENT ATTRIBUTES (EXACT SAFE METHODOLOGY)

### Task 2.1: PMO Agent - Expand to 30+ Attributes
**File**: `server/agents/attributes/PMOAgentAttributes.ts`
**Current**: 8 attributes
**Target**: 30+ attributes
**Source**: SAFe 6.0 PMO Agent Cluster (Execution & Delivery)

**Add These EXACT Attributes**:

```typescript
// Identifiers & Traceability
1. feature_uuid: string - Global unique identifier across ALM tools
2. parent_epic_id: string - Upward traceability to Portfolio
3. art_id: string - The specific Agile Release Train responsible

// WSJF Prioritization (Cost of Delay / Job Size)
4. wsjf_score: number - (CoD/JobSize) primary priority driver
5. user_business_value: number (1-20) - Component of CoD
6. time_criticality: number (1-20) - Component of CoD
7. rroe_value: number (1-20) - Risk Reduction / Opp Enablement (Component of CoD)

// Story Points & Completion
8. estimated_story_points: number - Total size of feature in points
9. actual_points_completed: number - Real-time burn count from synced Stories
10. percent_complete: number (%) - Actual/Estimated

// Flow Status & Timing
11. flow_status: enum - ['Funnel', 'Analyzing', 'Backlog', 'Implementing', 'Validating', 'Done']
12. wip_age: number (days) - Time elapsed since entering "Implementing" ⭐
13. flow_efficiency: number (%) - Active Time / Total Lead Time
14. cycle_time_avg: number - Average time to finish similar features
15. lead_time: number - Total time from Funnel to Done

// Dependencies & Blockers
16. dependency_count: number - Number of blocked/blocking links
17. blocker_status: boolean - Is there an active "Red" impediment?

// Dates & Forecasting
18. planned_finish_date: date - Targeted PI/Sprint end
19. forecasted_finish_date: date - Agent-calculated date based on current velocity
20. say_do_variance: number - Variance between planned vs actual points

// Quality & Readiness
21. refinement_depth: number (%) - % of child stories with "Ready" status
22. quality_gate_status: enum - ['Pass', 'Fail'] based on DoD (Definition of Done)
23. enabler_ratio: number - Ratio of technical debt/infra vs business value

// Team Metrics
24. team_velocity_current: number - Combined velocity of teams assigned to feature
25. sprint_load_factor: number - Current WIP vs Capacity for assigned teams
26. scope_growth: number (%) - Points added after Feature was "In Progress"

// Release & Ownership
27. release_vehicle_id: string - The deployment package ID
28. feature_owner: string - Human PM responsible

// Agent Health & Sync
29. last_sync_timestamp: datetime - When agent last polled the ALM
30. agent_health_status: enum - ['Green', 'Yellow', 'Red'] for data integrity
```

**Total**: 8 (current) + 30 (exact SAFe) = **38 attributes ✅**

---

### Task 2.2: FinOps Agent - Expand to 30+ Attributes
**File**: `server/agents/attributes/FinOpsAgentAttributes.ts`
**Current**: ~10 attributes
**Target**: 30+ attributes
**Source**: SAFe 6.0 FinOps Agent Cluster (Economics & Funding)

**Add These EXACT Attributes**:

```typescript
// Funding Classification
1. budget_line_item: string (ID) - Link to specific funding source
2. investment_horizon: enum - ['H1_Current', 'H2_Emerging', 'H3_Future']
3. capital_vs_operating: enum - ['CapEx', 'OpEx'] classification for accounting

// Budget & Spend
4. allocated_budget: number (currency) - Total funding approved for Epic/Feature
5. actual_spend_to_date: number (currency) - Real-time cost based on labor + tools
6. burn_rate_monthly: number (currency) - Projected spend per month

// EVM Forecasting
7. etc_estimate_to_complete: number (currency) - Financial forecast to finish work
8. eac_estimate_at_completion: number (currency) - Actual + ETC
9. cost_variance: number (currency) - Budget − Actual

// Labor & External Costs
10. labor_rate_blended: number (currency) - Average cost per team member/day
11. external_vendor_spend: number (currency) - 3rd party contractors/licenses

// Economic Impact
12. cost_of_delay_monthly: number (currency) - Revenue/Value lost per month delayed
13. roi_projected: number - Expected multiplier (Value/Cost)
14. roi_realized: number - Post-launch financial impact

// Funding Status & Compliance
15. funding_status: enum - ['Funded', 'Partially', 'Pending', 'Over-budget']
16. financial_guardrail_compliance: boolean - Within 10% variance limit?
17. participatory_budget_rank: number - Ranking from last PB event

// Tax & Benefits
18. tax_credit_eligibility: boolean - Is this R&D Tax Credit eligible?
19. benefit_owner: string - Exec responsible for realizing value

// Efficiency Metrics
20. cost_per_story_point: number (currency) - ActualSpend/Points

// Additional Financial Metadata
21. depreciation_schedule: object - Asset depreciation timeline
22. amortization_start: date - When amortization begins
23. capital_approval_date: date - Board approval date
24. accounting_period: string - Fiscal quarter/year
25. cost_center: string - Organizational cost center code
26. gl_account: string - General Ledger account number
27. payment_terms: string - Vendor payment schedule
28. currency_code: string - ISO currency code
29. exchange_rate: number - Current forex rate if applicable
30. inflation_adjustment: number (%) - Annual inflation factor
```

**Total**: 10 (current) + 30 (exact SAFe) = **40 attributes ✅**

---

### Task 2.3: VRO Agent - Expand to 30+ Attributes
**File**: `server/agents/attributes/VROAgentAttributes.ts`
**Current**: ~7 attributes
**Target**: 30+ attributes
**Source**: SAFe 6.0 VRO Agent Cluster (Value & Strategy)

**Add These EXACT Attributes**:

```typescript
// Strategic Alignment
1. strategic_theme_id: string (ID) - Alignment to top-level corporate goals
2. okr_key_result_link: string (ID) - The specific KR this work moves

// Leading Indicators
3. leading_indicator_name: string - e.g., "Page Load Time" or "Sign-up Rate"
4. leading_indicator_baseline: number - Starting value before work began
5. leading_indicator_current: number - Real-time movement of indicator

// Hypothesis Testing
6. hypothesis_state: enum - ['Not Started', 'Testing', 'Proven', 'Disproven']

// Customer Impact
7. customer_segment: string - Who is this value for?
8. nps_impact_score: number - Survey-based impact on satisfaction
9. value_threshold: number - Minimum Viable value needed to continue

// Market Impact
10. market_share_impact: number (%) - Estimated gain in market position
11. adoption_rate: number (%) - % of users adopting feature
12. churn_impact: number (%) - Effect on customer churn
13. feature_usage_daily: number - Daily active users of feature

// Customer Metrics
14. customer_acquisition_cost: number (currency) - CAC
15. customer_lifetime_value: number (currency) - CLV
16. customer_retention_rate: number (%) - Retention %
17. customer_satisfaction_score: number (0-100) - CSAT

// Revenue & Growth
18. revenue_growth: number (%) - Revenue increase attributed to feature
19. return_on_investment: number (%) - Portfolio ROI

// Time to Value
20. time_to_market: number (days) - Concept to delivery time
21. time_to_value: number (days) - Concept to customer realizes value

// Innovation
22. innovation_rate: number (%) - % new features vs maintenance

// Benefits Realization
23. benefits_register: array - [{benefit, target, actual, status}]
24. benefits_dependency_map: object - Benefit interdependencies
25. leading_indicators_list: array - Early signals of success
26. lagging_indicators_list: array - Outcome measures
27. benefits_realization_rate: number (%) - % expected benefits achieved
28. benefit_cost_ratio: number - BCR (target: >= 1.5)
29. business_value_score: number (0-100) - Delivered business value
30. outcome_realization_time: number (days) - Time to realize outcomes
```

**Total**: 7 (current) + 30 (exact SAFe) = **37 attributes ✅**

---

### Task 2.4: Planning Agent - Expand to 30+ Attributes
**File**: `server/agents/attributes/PlanningAgentAttributes.ts`
**Current**: ~3 attributes
**Target**: 30+ attributes
**Source**: SAFe 6.0 Planning Agent Cluster (Capacity & Feasibility)

**Add These EXACT Attributes**:

```typescript
// Plan Identification
1. plan_id: string (UUID) - Unique identifier for PI or Sprint plan

// Capacity Planning
2. total_capacity_pts: number - Aggregated story points available across teams
3. load_vs_capacity_ratio: number - Planned Points / Capacity (goal: < 90%) ⭐
4. uncommitted_objectives: number - Count of "Stretch" goals for PI

// Dependencies & Critical Path
5. dependency_map_id: string - Link to visual cross-team dependency string
6. critical_path_id: string - Sequence of features dictating end date
7. buffer_allocation_pct: number (%) - Points held back for emergent work

// Velocity & History
8. historical_velocity_avg: number - 3-PI average of points delivered
9. planning_confidence_score: number (1-5) - Team vote during PI Planning

// Synchronization
10. cross_art_sync_status: enum - ['In-Sync', 'Lagging', 'Conflict Detected']
11. milestone_alignment: boolean - Does plan hit hard "Fixed-Date" milestones?

// Resource Constraints
12. resource_bottleneck_id: string - Shared service over-capacity (UX, DevOps)
13. capacity_leaks: number - Points lost to non-value work

// Plan Stability
14. plan_volatility_idx: number - Rate of change to plan after PI start
15. iteration_cadence_days: number - Length of sprint cycles

// Backlog Health
16. backlog_readiness_idx: number (%) - % features meeting "Definition of Ready"
17. feature_priority_rank: number - Global stack rank

// Team Stability
18. team_stability_score: number (%) - % team members consistent (no churn)

// Sync Frequency
19. sync_frequency_hrs: number - How often agent polls for plan changes

// Sprint Performance
20. sprint_goal_attainment: number (%) - Historical success rate hitting goals
21. sprint_overrun_avg: number (days) - Average sprint overrun

// Calendar & Timezone
22. holiday_calendar_ref: string - Reference to org holiday schedule
23. timezone_offset: string - Team timezone

// Program Board
24. program_board_health: number (0-100) - Program board quality score
25. feature_cycle_time: number (days) - Avg time to complete features

// Technical Metrics
26. technical_debt_ratio: number (%) - Technical debt vs new features
27. test_automation_coverage: number (%) - Automated test coverage

// Quality & Readiness
28. built_in_quality_score: number (0-100) - Quality practices score
29. release_on_demand_capability: boolean - Can release any time?

// Team Sync
30. team_sync_effectiveness: number (0-100) - Sync meeting quality score
```

**Total**: 3 (current) + 30 (exact SAFe) = **33 attributes ✅**

---

### Task 2.5: OCM Agent - Expand to 30 Attributes
**File**: `server/agents/attributes/OCMAgentAttributes.ts`
**Current**: ~3 attributes
**Target**: 30 attributes
**Source**: SAFe 6.0 OCM Agent Cluster (Change Management)

**Add These EXACT Attributes**:

```typescript
// Change Identification
1. change_impact_id: string (UUID) - Identifier for specific change initiative
2. persona_impact_list: array - List of roles affected by change

// Adoption Metrics
3. adoption_velocity: number - Speed users migrate to new process/tool
4. resistance_level: enum - ['Low', 'Medium', 'High', 'Critical']
5. sentiment_trend: string - ['Improving', 'Neutral', 'Declining']

// Training & Communication
6. training_saturation: number (%) - % target audience completed training
7. communication_reach: number (%) - % employees opened/read updates
8. tooling_proficiency: number (%) - Actual skill level using Jira/ADO/Miro

// Leadership & Culture
9. leadership_alignment: number (1-10) - Executive "walk the talk" consistency
10. vibrancy_score: number - Activity in Slack/Teams/CoP channels
11. agile_mindset_delta: number (%) - Growth in "Growth Mindset" surveys

// Change Champions
12. advocate_count: number - # of "Change Champions" active in ART
13. benefit_awareness_pct: number (%) - % staff who can articulate "Why"

// Burnout & Fatigue
14. burnout_risk_idx: number - Correlation of high Flow Load + low eNPS ⭐
15. transformation_fatigue: number - Org's capacity for more change

// Feedback & Response
16. feedback_response_time: number (hours) - How fast OCM responds to concerns
17. friction_point_id: string - Top reason for adoption failure

// HR Alignment
18. incentive_alignment: boolean - HR goals aligned with new SAFe behaviors?

// Readiness
19. readiness_gate_status: boolean - Final "Human Go" for major transition
20. culture_survey_id: string - Link to latest culture assessment

// Legacy Behavior
21. legacy_behavior_count: number - # of "Old Way" processes still used

// Workshop & Engagement
22. workshop_attendance: number (%) - % attendance at change workshops
23. resistance_reason_code: string - Coded reason for resistance

// Change Impact Assessment
24. change_magnitude: number (0-100) - Size of change impact
25. stakeholder_readiness: number (0-100) - Readiness for change

// Adoption Stages
26. awareness_level: number (%) - % aware of upcoming change
27. understanding_level: number (%) - % understand why change needed
28. acceptance_level: number (%) - % accept change is necessary
29. proficiency_level: number (%) - % proficient in new way

// Change Metrics
30. time_to_proficiency: number (days) - Average time to become proficient
```

**Total**: 3 (current) + 30 (exact SAFe) = **33 attributes ✅**

---

### Task 2.6: Risk Agent - Expand to 31 Attributes
**File**: `server/agents/attributes/RiskAgentAttributes.ts`
**Current**: ~3 attributes
**Target**: 31 attributes
**Source**: SAFe 6.0 Risk Agent Cluster

**Add These EXACT Attributes**:

```typescript
// Risk Identification
1. risk_id: string (UUID) - Unique risk identifier
2. parent_risk_id: string - Parent risk if this is a sub-risk

// ROAM Classification
3. roam_status: enum - ['Resolved', 'Owned', 'Accepted', 'Mitigated']

// Risk Assessment
4. exposure_value: number (currency) - Financial exposure (Probability × Impact) ⭐
5. impact_score: number (1-10) - Severity if risk occurs
6. probability_score: number (0-1) - Likelihood of occurrence
7. risk_score: number - impact_score × probability_score × 10

// Risk Type
8. risk_category: enum - ['Technical', 'Schedule', 'Budget', 'Resource', 'External']
9. risk_tier: enum - ['Portfolio', 'Program', 'Team']

// Mitigation
10. mitigation_strategy: string - Planned response
11. mitigation_owner: string - Person responsible
12. mitigation_cost: number (currency) - Cost to mitigate
13. mitigation_deadline: date - When mitigation must be complete
14. mitigation_status: enum - ['Not Started', 'In Progress', 'Complete']
15. mitigation_velocity: number - Risks mitigated per period ⭐

// Residual Risk
16. residual_risk: number - Risk remaining after mitigation ⭐
17. residual_exposure: number (currency) - Financial exposure after mitigation

// Risk Metrics
18. risk_burndown_rate: number - Risks closed per period
19. risk_velocity: number - New risks identified per period
20. threat_opportunity_ratio: number - Negative vs positive risks

// Contingency
21. contingency_reserve: number (currency) - Remaining risk budget ⭐
22. contingency_used: number (currency) - Reserve already consumed

// Risk Response
23. risk_response_type: enum - ['Avoid', 'Transfer', 'Mitigate', 'Accept', 'Exploit']
24. risk_response_effectiveness: number (%) - % risks successfully mitigated

// Dependencies
25. dependency_risks: array - Risks related to dependencies
26. external_dependencies: array - Risks from external parties

// Tracking
27. risk_identified_date: date - When risk was first identified
28. risk_closed_date: date - When risk was resolved
29. last_assessment_date: date - Last time risk was reviewed

// Escalation
30. escalation_required: boolean - Does this need executive attention?
31. escalation_level: enum - ['Team', 'Program', 'Portfolio', 'Executive']
```

**Total**: 3 (current) + 31 (exact SAFe) = **34 attributes ✅**

---

### Task 2.7: Governance Agent - Expand to 32 Attributes
**File**: `server/agents/attributes/GovernanceAgentAttributes.ts`
**Current**: ~3 attributes
**Target**: 32 attributes
**Source**: SAFe 6.0 Governance Agent Cluster

**Add These EXACT Attributes**:

```typescript
// Compliance Framework
1. compliance_framework: enum - ['GDPR', 'SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS']
2. compliance_version: string - Version of framework (e.g., "ISO27001:2013")

// Gate Status
3. gate_status: enum - ['Open', 'Blocked', 'Conditional'] ⭐
4. gate_decision_reason: string - Why gate is in current state
5. gate_decision_date: datetime - When status last changed

// Vulnerability Management
6. critical_vuln_count: number - # of critical vulnerabilities ⭐
7. high_vuln_count: number - # of high severity vulnerabilities
8. medium_vuln_count: number - # of medium severity vulnerabilities
9. vuln_remediation_time_avg: number (days) - Avg time to fix vulns

// Definition of Done
10. dod_adherence: number (%) - % of DoD criteria met ⭐
11. dod_exceptions: number - # of approved DoD exceptions
12. dod_checklist_items: array - List of DoD criteria

// Audit & Compliance
13. audit_readiness: number (%) - Readiness for external audit ⭐
14. last_audit_date: date - Most recent audit
15. next_audit_date: date - Scheduled next audit
16. audit_findings: array - Open findings from last audit
17. audit_score: number (0-100) - Score from last audit

// Compliance Debt
18. compliance_debt_count: number - # of compliance issues
19. compliance_debt_severity: enum - ['Low', 'Medium', 'High', 'Critical']
20. compliance_debt_age: number (days) - Age of oldest issue

// Regulatory
21. regulatory_date: date - Hard deadline for compliance ⭐
22. regulatory_risk: number (0-100) - Risk of regulatory penalty
23. regulatory_body: string - Regulating organization

// Control Effectiveness
24. control_effectiveness: number (%) - % controls passing ⭐
25. control_failures: number - # of failed controls
26. control_test_frequency: string - How often controls tested

// Policy
27. policy_violations: number - # violations detected ⭐
28. policy_version: string - Current policy version
29. policy_review_date: date - Last policy review

// Security
30. security_score: number (0-100) - Overall security posture
31. pen_test_date: date - Last penetration test
32. security_exceptions: array - Approved security exceptions
```

**Total**: 3 (current) + 32 (exact SAFe) = **35 attributes ✅**

---

### Task 2.8: TMO Agent - Expand to 30 Attributes
**File**: `server/agents/attributes/TMOAgentAttributes.ts`
**Current**: ~3 attributes
**Target**: 30 attributes
**Source**: SAFe 6.0 TMO Agent Cluster (Team Management)

**Add These EXACT Attributes**:

```typescript
// Team Maturity
1. competency_score: number (0-5) - Team agile maturity level ⭐
2. business_agility_score: number (0-100) - Overall business agility

// Sentiment & Morale
3. enps_sentiment: number (-100 to 100) - Employee Net Promoter Score ⭐
4. team_morale: number (0-100) - Team satisfaction
5. psychological_safety: number (0-100) - Team safety to speak up

// Flow Metrics
6. flow_load_variance: number - Variability in WIP over time ⭐
7. lead_time_reduction: number (%) - Improvement in lead time ⭐
8. throughput: number - Work items completed per period

// Capacity Management
9. capacity_utilization: number (%) - Actual vs available capacity
10. capacity_forecast: object - Future capacity predictions
11. overtime_hours: number - Unplanned extra hours worked

// Velocity Stability
12. velocity_variance: number (%) - Sprint-to-sprint velocity variance
13. velocity_trend: string - ['Improving', 'Stable', 'Declining']
14. predictability: number (%) - Ability to meet commitments

// Team Health
15. team_size: number - # of team members
16. team_tenure_avg: number (months) - Average time on team
17. turnover_rate: number (%) - Annual turnover rate
18. vacancy_count: number - Open positions

// Impediments
19. impediment_count: number - Active blockers
20. impediment_age_avg: number (days) - Avg age of impediments
21. impediment_resolution_time: number (days) - Avg time to resolve

// Collaboration
22. collaboration_score: number (0-100) - Cross-team collaboration
23. dependency_wait_time: number (days) - Time waiting on dependencies

// Skills & Growth
24. skill_gap_count: number - # of identified skill gaps
25. training_hours_per_person: number - Annual training hours
26. certification_count: number - # of team certifications

// Coaching
27. coaching_sessions: number - # coaching sessions per period
28. retrospective_action_items: number - Open retro actions
29. improvement_experiments: number - Active improvement experiments

// Metrics Tracking
30. metrics_dashboard_usage: number (%) - % team using metrics
```

**Total**: 3 (current) + 30 (exact SAFe) = **33 attributes ✅**

---

### Task 2.9: Company Agent - CREATE NEW
**File**: `server/agents/attributes/CompanyAgentAttributes.ts` (CREATE)
**Why**: Company is ROOT agent - provides context to all other agents

**Company Agent Attributes** (20+ attributes):

```typescript
// Company Identity
1. company_name: string - Organization name
2. stock_ticker: string - Stock symbol (if public)
3. industry: string - Industry sector

// Financial
4. annual_revenue: number (currency) - Yearly revenue
5. fiscal_year: object - {start, end, current_quarter}
6. market_capitalization: number (currency) - Market cap
7. debt_to_equity_ratio: number - Financial leverage
8. operating_margin: number (%) - Operating profit margin
9. cash_reserves: number (currency) - Available cash
10. credit_rating: string - Credit rating (AAA, AA, etc.)

// Organization
11. employee_count: number - Total employees
12. board_size: number - # board members
13. organizational_maturity: number (0-5) - Agile maturity level

// Strategy
14. strategic_priorities: array - Company strategic themes (provides to LPM)
15. mission: string - Company mission statement
16. vision: string - Company vision
17. values: array - Company values

// Risk & Governance
18. risk_factors: array - Enterprise risks (provides to Risk agent)
19. governance_score: number (0-100) - Corporate governance
20. compliance_frameworks: array - ['SOX', 'GDPR', etc.]

// Portfolio Health
21. portfolio_health: number (0-100) - Overall portfolio health
22. art_count: number - # of Agile Release Trains
23. value_stream_count: number - # of Value Streams
```

**Total**: **23 attributes ✅**

---

## 🔗 PHASE 2B: IMPLEMENT LOGIC GATES (Agent Interactions)

### Task 2.10: Auto-Block Logic Gates
**File**: `server/lib/AgentLogicGates.ts` (CREATE NEW)

**Gate A: Compliance-Risk Deadbolt** ⭐
```typescript
// Trigger
IF (Risk.exposure_value > 100000) OR (Governance.critical_vuln_count > 0)
// Action
THEN Governance.gate_status = 'Blocked'
// Cross-Agent Alert
AND PMO.flow_status = 'Analyzing' (move back from 'Implementing')
```

**Gate B: Maturity-Speed Governor** ⭐
```typescript
// Trigger
IF TMO.competency_score < 2.5
// Action
THEN PMO.sprint_load_factor = PMO.sprint_load_factor * 0.8  // Reduce by 20%
// Reasoning
// Protect team from burnout when maturity is low
```

**Gate C: Audit-Ready Barrier** ⭐
```typescript
// Trigger
IF (Governance.audit_readiness < 90) AND (Governance.regulatory_date < NOW + 30_DAYS)
// Action
THEN Create Epic: "Compliance Debt" with Priority = "Highest"
// Override PMO backlog priority
```

**Gate D: Budget Overrun Circuit Breaker** ⭐
```typescript
// Trigger
IF FinOps.actual_spend_to_date > FinOps.allocated_budget
// Action
THEN PMO.flow_status = 'Blocked'
AND VRO.recalculate roi_realized
AND Alert: "Budget Violation - Epic Paused"
```

**Gate E: Burnout Brake** ⭐
```typescript
// Trigger
IF OCM.burnout_risk_idx > 0.85
// Action
THEN Planning.load_vs_capacity_ratio = 'Invalid'
AND TMO.trigger coaching_event
AND Alert: "Human Capital Risk - Reduce Load"
```

### Task 2.11: Agent Interaction Scenarios
**File**: `server/lib/AgentInteractionScenarios.ts` (CREATE NEW)

**Scenario A: Budget Overrun (FinOps ↔ PMO ↔ VRO)**
```typescript
1. FinOps detects: actual_spend > allocated_budget
2. FinOps sends: "Budget Violation" event
3. PMO reacts: sets flow_status = 'Blocked' for that Epic
4. VRO reacts: recalculates roi_realized to assess if still worth finishing
```

**Scenario B: Burnout Brake (OCM ↔ Planning ↔ TMO)**
```typescript
1. OCM detects: burnout_risk_idx > 0.85
2. OCM sends: "Human Capital Risk" event
3. Planning reacts: flags load_vs_capacity_ratio as "Invalid" for next PI
4. TMO reacts: triggers coaching_event for Scrum Master
```

**Scenario C: Regulatory Deadbolt (Risk ↔ Governance ↔ PMO)**
```typescript
1. Risk updates: exposure_value due to new legal requirement
2. Risk sends: "Legal Exposure" update
3. Governance checks: compliance_gate status = 'Failed'
4. PMO receives: "Hard Stop" → moves "Compliance Debt" to top of stack rank
```

---

## 📊 UPDATED PROGRESS TRACKING

| Phase | Tasks | Done | Remaining | Progress |
|-------|-------|------|-----------|----------|
| **Foundation (Pre-Crash)** | 13 | 13 | 0 | 100% ✅ |
| Phase 1: Research Attributes | 3 | 3 | 0 | 100% ✅ |
| Phase 2: Expand Attributes (EXACT) | 11 | 11 | 0 | 100% ✅ |
| Phase 2B: Langflow Scenarios | 7 | 0 | 7 | 0% ← **START HERE** |
| Phase 3: Build Dashboards | 8 | 0 | 8 | 0% |
| Phase 4: Wire MCPs | 11 | 0 | 11 | 0% |
| Phase 5: Testing | 6 | 0 | 6 | 0% |
| **TOTAL** | **59** | **27** | **32** | **46%** |

---

## 🎯 ATTRIBUTE COUNT SUMMARY

| Agent | Current | Target | Exact SAFe | Status |
|-------|---------|--------|------------|--------|
| PMO | 8 | 30+ | 38 | ✅ Ready |
| FinOps | 10 | 30+ | 40 | ✅ Ready |
| VRO | 7 | 30+ | 37 | ✅ Ready |
| Planning | 3 | 30+ | 33 | ✅ Ready |
| OCM | 3 | 30 | 33 | ✅ Ready |
| Risk | 3 | 31 | 34 | ✅ Ready |
| Governance | 3 | 32 | 35 | ✅ Ready |
| TMO | 3 | 30 | 33 | ✅ Ready |
| Company | 0 | 20+ | 23 | ✅ Ready |
| **TOTAL** | **40** | **233+** | **306** | **✅ All Defined** |

---

## 🔗 PHASE 2B: IMPLEMENT LANGFLOW SCENARIO WORKFLOWS

**Status**: Phase 2 Complete (315 attributes + Logic Gates) → Now implement in Langflow
**Reference**: See ALL_AGENTS_WIRED.md for existing agent Flow IDs

### Overview

The 4 Agent Interaction Scenarios defined in `server/lib/AgentInteractionScenarios.ts` need to be implemented as Langflow workflows. These scenarios demonstrate how Logic Gates enable autonomous agent collaboration.

**IMPORTANT**:
- ❌ Remove all hard-coded/fake data
- ❌ Remove scenario simulators
- ✅ Test with real production data only
- ✅ Use existing agent Flow IDs from ALL_AGENTS_WIRED.md
- ✅ Integrate with Logic Gate triggers from `server/lib/AgentLogicGates.ts`

### Task 2B.1: Scenario A - Budget Overrun (FinOps ↔ PMO ↔ VRO)

**File**: Create new Langflow workflow
**Participants**: FinOps, PMO, VRO agents
**Logic Gate**: Gate D - Budget Overrun Circuit Breaker

**Workflow Steps**:
1. Listen for FinOps budget violation event (`actual_spend_to_date > allocated_budget`)
2. Trigger Logic Gate D evaluation via `/api/logic-gates/evaluate`
3. Execute gate actions:
   - Set PMO.flow_status = 'Blocked'
   - Trigger VRO ROI recalculation
4. Call `/api/agent-actions/notify/pmo` to block epic
5. Call `/api/agent-actions/notify/vro` to recalculate ROI
6. Create Jira ticket for budget review
7. Send Slack alert to finance team

**Existing Flow IDs**:
- FinOps: `70d569d8-3e9c-4684-9227-ee4743d4be09`
- PMO: `27bc79cd-2302-4356-a039-3238de8218b8`
- VRO: `a5e06553-0e6b-42ed-9d68-5003b0c2a2be`

### Task 2B.2: Scenario B - Burnout Brake (OCM ↔ Planning ↔ TMO)

**File**: Create new Langflow workflow
**Participants**: OCM, Planning, TMO agents
**Logic Gate**: Gate E - Burnout Brake

**Workflow Steps**:
1. Listen for OCM burnout risk event (`burnout_risk_idx > 0.85`)
2. Trigger Logic Gate E evaluation
3. Execute gate actions:
   - Invalidate Planning.load_vs_capacity_ratio
   - Trigger TMO coaching event
4. Call `/api/agent-actions/notify/planning` to invalidate capacity
5. Call `/api/agent-actions/notify/tmo` to schedule coaching
6. Create ServiceNow incident for HR intervention
7. Send Slack alert to team leads

**Existing Flow IDs**:
- OCM: `06ef7ded-63df-4ed7-8a90-9ad3e8ddeef9`
- Planning: `6128dcc0-e61f-4853-96bc-42e483473059`
- TMO: `be3ebfe5-ac51-456d-8b22-c7ff5d123ed4`

### Task 2B.3: Scenario C - Regulatory Deadbolt (Risk ↔ Governance ↔ PMO)

**File**: Create new Langflow workflow
**Participants**: Risk, Governance, PMO agents
**Logic Gate**: Gate A - Compliance-Risk Deadbolt & Gate C - Audit-Ready Barrier

**Workflow Steps**:
1. Listen for Risk exposure event (`exposure_value > $100K`) OR Governance vulnerability event (`critical_vuln_count > 0`)
2. Trigger Logic Gate A evaluation
3. Execute gate actions:
   - Set Governance.gate_status = 'Blocked'
   - Move PMO.flow_status back to 'Analyzing'
4. Check if Gate C conditions met (`audit_readiness < 90% AND regulatory_date < 30 days`)
5. If yes, create "Compliance Debt" epic via `/api/agent-actions/pmo/create-epic`
6. Call `/api/agent-actions/notify/governance` to block release
7. Call `/api/agent-actions/notify/pmo` to reprioritize
8. Create P1 Jira ticket
9. Send @channel Slack alert

**Existing Flow IDs**:
- Risk: `9be34a7d-1a53-455e-ad22-6d94565c5a7e`
- Governance: `5d29ac9d-fd49-4400-bdf2-8f7877ff0fa4`
- PMO: `27bc79cd-2302-4356-a039-3238de8218b8`

### Task 2B.4: Scenario D - Maturity Governor (TMO ↔ PMO ↔ Planning)

**File**: Create new Langflow workflow
**Participants**: TMO, PMO, Planning agents
**Logic Gate**: Gate B - Maturity-Speed Governor

**Workflow Steps**:
1. Listen for TMO competency event (`competency_score < 2.5`)
2. Trigger Logic Gate B evaluation
3. Execute gate actions:
   - Reduce PMO.sprint_load_factor by 20% (multiply by 0.8)
   - Update Planning capacity calculations
4. Call `/api/agent-actions/notify/pmo` with load reduction
5. Call `/api/agent-actions/notify/planning` to recalculate capacity
6. Schedule coaching sessions via `/api/agent-actions/tmo/schedule-coaching`
7. Send Slack notification to Scrum Master

**Existing Flow IDs**:
- TMO: `be3ebfe5-ac51-456d-8b22-c7ff5d123ed4`
- PMO: `27bc79cd-2302-4356-a039-3238de8218b8`
- Planning: `6128dcc0-e61f-4853-96bc-42e483473059`

### Task 2B.5: Wire Logic Gate Triggers to Langflow

**File**: Update `server/lib/AgentLogicGates.ts`

Add Langflow integration to `LogicGateEngine.executeActions()`:
- Call scenario workflows when gates trigger
- Pass agent state to Langflow
- Use existing `orchestrator.executeLangflowFlow()` pattern

### Task 2B.6: Create Server API Endpoints for Logic Gate Actions

**Files**: Create new route files

Create endpoints for Logic Gate actions:
- `POST /api/logic-gates/evaluate` - Evaluate all gates against agent state
- `POST /api/logic-gates/execute` - Execute gate actions
- `POST /api/agent-actions/pmo/create-epic` - Create compliance/priority epics
- `POST /api/agent-actions/planning/invalidate-capacity` - Invalidate capacity planning
- `POST /api/agent-actions/tmo/schedule-coaching` - Schedule coaching sessions

### Task 2B.7: Document Scenario Workflows

**File**: Create `LANGFLOW_SCENARIOS.md`

Document:
- Each scenario workflow architecture
- How Logic Gates trigger workflows
- API endpoints used
- Testing procedures with real data
- Troubleshooting guide

---

## 🔑 KEY INSIGHTS FROM SAFE METHODOLOGY

1. **WIP_Age** - Track how long work sits in "Implementing" status
2. **load_vs_capacity_ratio** - Critical metric (goal: < 90%)
3. **burnout_risk_idx** - Correlate Flow Load + eNPS
4. **exposure_value** - Financial risk assessment
5. **gate_status** - Governance can auto-block releases
6. **critical_vuln_count** - Security gate trigger
7. **audit_readiness** - Compliance deadline tracking
8. **competency_score** - Team maturity affects WIP limits
9. **say_do_variance** - Planned vs actual delivery
10. **roam_status** - Risk classification (Resolved, Owned, Accepted, Mitigated)

---

## 🚀 NEXT STEPS

**✅ Phase 2 COMPLETE**: All agent attributes expanded (315 total), Logic Gates implemented

**Immediate Action**: Start Phase 2B - Implement Langflow Scenario Workflows

**Order of Execution**:
1. ✅ Update PMO Agent attributes (Task 2.1) - DONE
2. ✅ Update FinOps Agent attributes (Task 2.2) - DONE
3. ✅ Update VRO Agent attributes (Task 2.3) - DONE
4. ✅ Update Planning Agent attributes (Task 2.4) - DONE
5. ✅ Update OCM Agent attributes (Task 2.5) - DONE
6. ✅ Update Risk Agent attributes (Task 2.6) - DONE
7. ✅ Update Governance Agent attributes (Task 2.7) - DONE
8. ✅ Update TMO Agent attributes (Task 2.8) - DONE
9. ✅ Create Company Agent (Task 2.9) - DONE
10. ✅ Implement Logic Gates (Task 2.10) - DONE
11. ✅ Implement Interaction Scenarios (Task 2.11) - DONE

**Phase 2B** (IN PROGRESS):
1. Create Langflow workflow for Scenario A: Budget Overrun (Task 2B.1)
2. Create Langflow workflow for Scenario B: Burnout Brake (Task 2B.2)
3. Create Langflow workflow for Scenario C: Regulatory Deadbolt (Task 2B.3)
4. Create Langflow workflow for Scenario D: Maturity Governor (Task 2B.4)
5. Wire Logic Gate triggers to Langflow (Task 2B.5)
6. Create server API endpoints for Logic Gate actions (Task 2B.6)
7. Document scenario workflows (Task 2B.7)

**Then proceed to Phase 3: Build Dashboards with these exact attributes**

---

## 📝 PHASE 2 COMPLETION SUMMARY

**✅ All Tasks Complete**:
- 9 Agent attribute files expanded (315 total attributes)
- Logic Gates implemented (5 autonomous gates)
- Agent Interaction Scenarios defined (4 cross-agent flows)
- Company Agent created (ROOT agent with 23 attributes)

**Files Created/Updated**:
- ✅ `server/agents/attributes/PMOAgentAttributes.ts` - 38 attributes
- ✅ `server/agents/attributes/FinOpsAgentAttributes.ts` - 40 attributes
- ✅ `server/agents/attributes/VROAgentAttributes.ts` - 37 attributes
- ✅ `server/agents/attributes/PlanningAgentAttributes.ts` - 30 attributes
- ✅ `server/agents/attributes/OCMAgentAttributes.ts` - 38 attributes
- ✅ `server/agents/attributes/RiskAgentAttributes.ts` - 39 attributes
- ✅ `server/agents/attributes/GovernanceAgentAttributes.ts` - 32 attributes
- ✅ `server/agents/attributes/TMOAgentAttributes.ts` - 38 attributes
- ✅ `server/agents/attributes/CompanyAgentAttributes.ts` - 23 attributes
- ✅ `server/lib/AgentLogicGates.ts` - 5 Logic Gates + Engine
- ✅ `server/lib/AgentInteractionScenarios.ts` - 4 Scenarios (simulators removed, ready for Langflow)

**Next Phase**: Phase 2B - Implement 4 scenarios in Langflow using real production data

---

## 📌 IMPORTANT NOTES

**Single Source of Truth**: This document (`MASTER_TODO_EXACT_ATTRIBUTES.md`) is the ONLY active TODO document. All other TODO/BACKLOG files are deprecated and kept for historical reference only.

**Todo List**: The active todo list (use `/tasks` command) references tasks from this document with format: "Phase 2B.X: [Task Name] (see MASTER_TODO_EXACT_ATTRIBUTES.md Task 2B.X)"

**Next Steps**: Start Phase 2B.1 - Create Langflow workflow for Budget Overrun scenario. Refer to:
- Task 2B.1 section above for detailed requirements
- `ALL_AGENTS_WIRED.md` for existing Flow IDs
- `server/lib/AgentInteractionScenarios.ts` for scenario steps

---

**THIS IS THE MASTER TODO WITH EXACT SAFe 6.0 METHODOLOGY ATTRIBUTES - PHASE 2 COMPLETE.**
