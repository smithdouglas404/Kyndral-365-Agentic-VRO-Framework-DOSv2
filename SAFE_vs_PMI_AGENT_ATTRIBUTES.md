# SAFe 6.0 vs PMI (PMBOK) Agent Attributes

## Overview

This document shows the comprehensive attributes for agents based on:
- **SAFe 6.0** - Scaled Agile Framework (Lean-Agile approach)
- **PMI PMBOK** - Project Management Body of Knowledge (Process-based approach)

Both methodologies are implemented in the ontology and can be used based on organizational preference.

---

## SAFe 6.0 Agents

### 1. Lean Portfolio Management (LPM) Agent

**Role**: Strategic portfolio management with Lean-Agile principles

#### Strategic Alignment Attributes (5)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `strategic_themes` | array | No | Portfolio-level strategic themes |
| `portfolio_vision` | string | No | Long-term vision |
| `portfolio_canvas` | object | No | Complete portfolio canvas |
| `portfolio_okrs` | array | No | Objectives and Key Results |
| `portfolio_kpis` | object | Yes | Key Performance Indicators |

#### Lean Budget Guardrails (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `lean_budget_guardrails` | object | No | Budget constraints and rules |
| `portfolio_budget` | number ($) | No | Total portfolio budget |
| `value_stream_budgets` | object | Yes | Budget per value stream |

#### WSJF and Prioritization (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `epic_wsjf_scores` | array | Yes | Weighted Shortest Job First scores |
| `portfolio_kanban_state` | object | No | Kanban state (Funnel → Done) |
| `epic_wsjf_scores` | array | Yes | *Formula: (Value + Criticality + Risk) / Size* |

#### Portfolio Flow Metrics (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `portfolio_flow_time` | number (days) | Yes | Time through kanban |
| `portfolio_flow_efficiency` | number (%) | Yes | Active time / Total time |
| `portfolio_flow_load` | number | No | Epics in progress |

**Total Attributes**: 14 produces, 3 consumes

---

### 2. Agile Release Train (ART) Agent

**Role**: Team of Agile teams delivering value in Program Increments (PIs)

#### PI Planning Outcomes (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `pi_objectives` | array | No | PI objectives committed by ART |
| `pi_predictability` | number (%) | Yes | *Formula: (Actual BV / Planned BV) * 100* |
| `program_board` | object | No | Features, dependencies, milestones |

#### Team Metrics (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `team_velocity` | number (points) | Yes | Avg story points per sprint |
| `team_capacity` | number (points) | No | Available capacity |
| `team_load` | number (%) | Yes | Workload vs capacity |

#### Dependencies and Risks (4)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `art_dependencies` | array | No | Cross-team dependencies |
| `dependency_health` | number (score) | Yes | Health of dependencies |
| `art_risks` | array | No | Program-level risks |
| `roam_board` | object | No | Resolved, Owned, Accepted, Mitigated |

#### Flow Metrics (SAFe 6.0 Core) (5)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `art_flow_velocity` | number | Yes | Features completed per PI |
| `art_flow_time` | number (days) | Yes | Backlog to done time |
| `art_flow_efficiency` | number (%) | Yes | *Formula: Active Time / Total Time* |
| `art_flow_load` | number | No | Features in progress |
| `art_flow_distribution` | object | Yes | Work distribution by type |

#### Quality and DevOps (DORA Metrics) (5)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `built_in_quality_score` | number (score) | Yes | Quality metrics aggregate |
| `deployment_frequency` | string | No | Deploy frequency |
| `lead_time_for_changes` | number (hours) | Yes | Commit to production |
| `change_failure_rate` | number (%) | Yes | Failed deployment % |
| `mttr` | number (hours) | Yes | Mean Time to Restore |

#### Innovation (1)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `innovation_and_planning_ratio` | number (%) | Yes | IP iteration capacity % |

**Total Attributes**: 21 produces, 3 consumes

---

### 3. Value Stream Agent

**Role**: End-to-end flow of value delivery

#### Value Stream Definition (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `value_stream_name` | string | No | Name of value stream |
| `value_stream_type` | string | No | Operational or Development |
| `value_stream_kpis` | object | Yes | KPIs for value stream |

#### Value Stream Mapping (4)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `vsm_steps` | array | No | Steps from trigger to delivery |
| `vsm_lead_time` | number (days) | Yes | Concept to cash time |
| `vsm_process_time` | number (days) | Yes | Total active time |
| `vsm_efficiency` | number (%) | Yes | *Formula: Process Time / Lead Time* |

#### Solution Context (2)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `solution_intent` | object | No | Requirements repository |
| `solution_context` | object | No | Customer, regulatory, technical |

#### Economic Framework (2)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `economic_framework` | object | No | Value vs cost tradeoffs |
| `cost_of_delay` | number ($) | Yes | Economic impact of delays |

**Total Attributes**: 11 produces, 2 consumes

---

## PMI (PMBOK) Agents

### PMO Agent (PMI Standards)

**Role**: Traditional project management across 10 Knowledge Areas

#### 1. Integration Management (4)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `project_charter` | object | No | Formal authorization |
| `project_management_plan` | object | No | Integrated baseline |
| `change_requests_count` | number | No | Active change requests |
| `change_control_board_status` | object | No | CCB review status |

#### 2. Scope Management (4)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `wbs` | object | No | Work Breakdown Structure |
| `scope_baseline` | object | No | Approved scope + WBS |
| `scope_creep_percentage` | number (%) | Yes | *Formula: Unapproved Changes / Total Scope* |
| `requirements_traceability_matrix` | object | No | Requirements → Deliverables |

#### 3. Schedule Management (6)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `schedule_baseline` | object | No | Approved schedule |
| `critical_path` | array | No | Longest path through network |
| `schedule_variance_sv` | number ($) | Yes | *Formula: EV - PV* |
| `spi` | number | Yes | *Formula: EV / PV* (< 1.0 = behind) |
| `total_float` | number (days) | Yes | Schedule slack |
| `milestone_completion` | number (%) | Yes | On-time milestone % |

#### 4. Cost Management (8)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `cost_baseline` | object | No | Approved budget |
| `cost_variance_cv` | number ($) | Yes | *Formula: EV - AC* |
| `cpi` | number | Yes | *Formula: EV / AC* (< 1.0 = over budget) |
| `bac` | number ($) | No | Budget at Completion |
| `eac` | number ($) | Yes | *Formula: BAC / CPI* |
| `etc` | number ($) | Yes | *Formula: EAC - AC* |
| `vac` | number ($) | Yes | *Formula: BAC - EAC* |
| `tcpi` | number | Yes | *Formula: (BAC - EV) / (BAC - AC)* |

#### 5. Quality Management (4)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `quality_metrics` | object | Yes | Defect density, coverage |
| `quality_control_measurements` | array | No | Inspection results |
| `defect_density` | number | Yes | Defects per unit |
| `cost_of_quality` | number ($) | Yes | Prevention + Appraisal + Failure |

#### 6. Resource Management (4)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `resource_calendar` | object | No | Resource availability |
| `resource_utilization` | number (%) | Yes | *Formula: Allocated / Available* |
| `resource_leveling_adjustments` | array | No | Schedule changes |
| `team_performance_assessments` | array | No | Team effectiveness |

#### 7. Communications Management (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `communications_management_plan` | object | No | Who, what, when, how |
| `stakeholder_engagement_level` | object | Yes | Unaware → Leading |
| `communication_effectiveness` | number (score) | Yes | Response rates, feedback |

#### 8. Risk Management (6)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `risk_register` | array | No | Identified risks |
| `risk_matrix` | object | No | Probability-Impact matrix |
| `risk_exposure` | number ($) | Yes | *Formula: Σ(Probability × Impact)* |
| `risk_velocity` | number (days) | Yes | Time until impact |
| `contingency_reserves` | number ($) | No | Budget for known risks |
| `management_reserves` | number ($) | No | Budget for unknown risks |

#### 9. Procurement Management (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `procurement_documents` | array | No | RFPs, contracts, SOWs |
| `vendor_performance` | object | Yes | Vendor scorecards |
| `contract_closure_status` | object | No | Closeout status |

#### 10. Stakeholder Management (3)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `stakeholder_register` | array | No | Stakeholder list |
| `stakeholder_power_interest_grid` | object | No | Power-Interest classification |
| `stakeholder_satisfaction_score` | number (score) | Yes | Overall satisfaction |

#### PMBOK 7 Performance Domains (5)
| Attribute | Type | LLM Calculated | Description |
|-----------|------|----------------|-------------|
| `project_work_performance` | number (score) | Yes | Process establishment |
| `delivery_performance` | number (score) | Yes | Scope and quality |
| `measurement_performance` | number (score) | Yes | Metrics and forecasting |
| `uncertainty_performance` | number (score) | Yes | Risk management |
| `team_performance` | number (score) | Yes | Culture and collaboration |

**Total Attributes**: 50 produces, 3 consumes

---

## Comparison Matrix

### Attribute Count

| Agent Type | Framework | Produces | Consumes | LLM Calculated |
|------------|-----------|----------|----------|----------------|
| LPM | SAFe 6.0 | 14 | 3 | 8 (57%) |
| ART | SAFe 6.0 | 21 | 3 | 14 (67%) |
| Value Stream | SAFe 6.0 | 11 | 2 | 7 (64%) |
| **SAFe Total** | | **46** | **8** | **29 (63%)** |
| PMO | PMI PMBOK | 50 | 3 | 26 (52%) |

### Philosophy Comparison

| Aspect | SAFe 6.0 | PMI PMBOK |
|--------|----------|-----------|
| **Approach** | Lean-Agile, iterative | Process-based, phased |
| **Focus** | Flow, value streams | Earned Value, baselines |
| **Key Metrics** | PI Predictability, Flow Efficiency | SPI, CPI, EAC |
| **Planning** | PI Planning every 10 weeks | Upfront detailed planning |
| **Change** | Embrace change | Control change via CCB |
| **Team Structure** | ARTs (50-125 people) | Project teams (variable) |
| **Cadence** | Fixed PIs | Variable project lifecycle |
| **Quality** | Built-in quality | Quality control processes |

### Key Formulas

#### SAFe 6.0
```
WSJF = (User-Business Value + Time Criticality + Risk Reduction) / Job Size
PI Predictability = (Actual Business Value / Planned Business Value) × 100
Flow Efficiency = Active Time / Total Flow Time × 100
```

#### PMI PMBOK (Earned Value Management)
```
SV = EV - PV                    (Schedule Variance)
SPI = EV / PV                   (Schedule Performance Index)
CV = EV - AC                    (Cost Variance)
CPI = EV / AC                   (Cost Performance Index)
EAC = BAC / CPI                 (Estimate at Completion)
VAC = BAC - EAC                 (Variance at Completion)
TCPI = (BAC - EV) / (BAC - AC)  (To-Complete Performance Index)
```

### When to Use Which Framework

#### Use SAFe 6.0 When:
- ✅ Large-scale Agile transformation (50+ people)
- ✅ Need for continuous delivery
- ✅ Complex systems with multiple teams
- ✅ Emphasis on innovation and flow
- ✅ DevOps and CI/CD culture
- ✅ Product-centric organization

#### Use PMI PMBOK When:
- ✅ Traditional project-based work
- ✅ Fixed scope, budget, timeline
- ✅ Regulated industries (government, construction)
- ✅ Emphasis on predictability and control
- ✅ Contract-driven projects
- ✅ Need for detailed upfront planning

### Hybrid Approach (Our Ontology)

Our ontology supports **BOTH** frameworks:

```typescript
// Level 1: Universal attributes (both frameworks)
- budget_variance
- schedule_delay
- risk_score
- quality_score

// Level 2: Framework-specific
- SAFe: pi_predictability, art_flow_efficiency, wsjf
- PMI: spi, cpi, eac, vac, tcpi

// Level 3: Industry-specific (Energy, Healthcare, Finance, Manufacturing)
- Energy: regulatory_compliance_score, safety_score
- Healthcare: patient_impact_score, hipaa_compliance_score
```

## Implementation

### SAFe Schemas
```typescript
import { getSAFeAgentSchema } from './SAFeAgentSchemas.js';

const lpmAgent = getSAFeAgentSchema('lpm');
const artAgent = getSAFeAgentSchema('art');
const valueStreamAgent = getSAFeAgentSchema('value_stream');
```

### PMI Schemas
```typescript
import { getPMIAgentSchema } from './PMIAgentSchemas.js';

const pmiPMO = getPMIAgentSchema('pmi_pmo');
```

### Combined Usage
```typescript
// Organization can choose methodology
const methodology = company.methodology; // 'safe' or 'pmi'

if (methodology === 'safe') {
  const agent = getSAFeAgentSchema('art');
} else if (methodology === 'pmi') {
  const agent = getPMIAgentSchema('pmi_pmo');
}

// All agents write to Mem0 for memory-based collaboration
await mem0.writeFact({
  entity: 'project_123',
  attribute: methodology === 'safe' ? 'pi_predictability' : 'spi',
  value: result.value,
  sourceAgent: agentId
});
```

## Summary

**SAFe 6.0**: 46 attributes across 3 agents (LPM, ART, Value Stream)
- Focus: Flow, PI Planning, WSJF, DevOps metrics
- 63% LLM-calculated

**PMI PMBOK**: 50 attributes in 1 comprehensive PMO agent
- Focus: Earned Value, Baselines, Knowledge Areas
- 52% LLM-calculated

Both frameworks are fully integrated with:
- ✅ Mem0 memory layer
- ✅ LLM calculations with narrative
- ✅ Signal broadcasting
- ✅ A2A agent collaboration
- ✅ Langflow orchestration

Organizations can choose the framework that best fits their culture and project types!
