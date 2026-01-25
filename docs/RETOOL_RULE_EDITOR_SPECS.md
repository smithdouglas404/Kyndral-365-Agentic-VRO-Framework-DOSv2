# Retool Rule Editor Interface Specifications

**Last Updated:** January 25, 2026
**Purpose:** Reference mockups for building 8 team-specific Rule Editor interfaces in Retool

---

## Overview

Each team gets their own dedicated Rule Editor app in Retool to configure collaboration rules. All rules write to the `collaboration_rules` PostgreSQL table and are evaluated by `AgentCollaborationRulesEngine.ts`.

---

## ✅ Existing Mockups (Already Documented)

1. **FinOps Team Dashboard** - Budget variance, cost overruns, EVM thresholds
2. **Governance Team Dashboard** - Compliance violations, approval requirements
3. **Risk Team Dashboard** - Risk thresholds, escalation rules
4. **TMO Team Dashboard** - Schedule delays, milestone tracking
5. **Custom Attributes Builder** - Create custom attributes for any team

See: `docs/UIAI/` folder for existing mockup screenshots

---

## ❌ New Mockups (VRO, PMO, OCM)

### 5. VRO Team Dashboard - Value Realization Office

**Focus:** Value & Benefits tracking, ROI monitoring, business case validation

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  VRO Value Realization Rules                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Value Tracking & Benefits Rules:                                   │
│                                                                     │
│  Rule Name           │ Threshold  │ Action       │ Status          │
│  ────────────────────┼────────────┼──────────────┼────────────────  │
│  Benefits Shortfall  │ < 85%      │ Alert TMO    │ ✓ Active        │
│  Value Leakage       │ > $250K    │ Escalate     │ ✓ Active        │
│  ROI Below Target    │ < 15%      │ Alert FinOps │ ✓ Active        │
│  Benefit Delay       │ > 30 days  │ Alert PMO    │ ✓ Active        │
│                                                                     │
│  Edit Rule: Benefits Shortfall                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Benefits Threshold: [  85  ] %                                 ││
│  │                                                                 ││
│  │  When benefits fall below threshold:                            ││
│  │  [✓] Alert TMO for intervention                                 ││
│  │  [✓] Notify FinOps for cost review                              ││
│  │  [ ] Request OCM stakeholder assessment                         ││
│  │  [✓] Flag for executive dashboard                               ││
│  │                                                                 ││
│  │  Track Against: [▼ Original Business Case ]                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [ Update Rule ]  [ Value Simulation ]  [ Publish ]                 │
│                                                                     │
│  Change History:                                                    │
│  • 2026-01-24 11:00 - Maria (VRO) added ROI tracking               │
│  • 2026-01-22 09:15 - Tom (VRO) updated threshold 80% → 85%        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Default Rules for VRO

| Rule ID | Rule Name | Attribute | Operator | Threshold | Actions | Target Agents |
|---------|-----------|-----------|----------|-----------|---------|---------------|
| `vro-benefits-shortfall` | Benefits Shortfall | `benefitsRealizationRate` | `<` | 85% | Alert, Notify | TMO, FinOps |
| `vro-value-leakage` | Value Leakage | `valueLoss` | `>` | $250K | Escalate | FinOps, Governance |
| `vro-roi-below-target` | ROI Below Target | `actualROI` | `<` | 15% | Alert | FinOps, PMO |
| `vro-benefit-delay` | Benefit Delay | `benefitDelayDays` | `>` | 30 days | Alert | PMO, TMO |

#### Attributes Measured by VRO
- `benefitsRealizationRate` (percentage) - % of expected benefits achieved
- `valueLoss` (currency) - Gap between expected and actual value
- `actualROI` (percentage) - Return on investment
- `benefitDelayDays` (number) - Days behind benefits realization schedule
- `businessCaseVariance` (percentage) - Deviation from business case
- `valueAtRisk` (currency) - Forecasted value at risk

#### Special Features
- **Track Against Dropdown:** Original Business Case, Updated Forecast, Industry Benchmark
- **Value Simulation Button:** Projects future value based on current trends
- **Executive Dashboard Flag:** Marks critical issues for C-level visibility

#### Maps to DeepVROAgent Capabilities
- Value realization tracking
- Benefits measurement
- ROI analysis
- Value optimization

---

### 6. PMO Team Dashboard - Project Management Office

**Focus:** Project health, governance gates, resource management, delivery tracking

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  PMO Project Governance Rules                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Project Health & Gate Rules:                                       │
│                                                                     │
│  Rule Name           │ Threshold  │ Action         │ Status        │
│  ────────────────────┼────────────┼────────────────┼──────────────  │
│  Red Status Project  │ Score < 50 │ Escalate       │ ✓ Active      │
│  Gate Approval Delay │ > 5 days   │ Alert Govern   │ ✓ Active      │
│  Resource Conflict   │ > 120%     │ Alert TMO      │ ✓ Active      │
│  Missing Deliverable │ > 2 items  │ Block Progress │ ✓ Active      │
│                                                                     │
│  Edit Rule: Red Status Project                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Health Score Threshold: [  50  ]                               ││
│  │                                                                 ││
│  │  When project goes red:                                         ││
│  │  [✓] Escalate to Governance                                     ││
│  │  [✓] Notify TMO for schedule review                             ││
│  │  [✓] Alert Risk Agent for assessment                            ││
│  │  [✓] Request OCM change impact review                           ││
│  │                                                                 ││
│  │  Auto-schedule: [✓] Recovery meeting                            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [ Update Rule ]  [ View Dependencies ]  [ Publish ]                │
│                                                                     │
│  Stage Gate Configuration:                                          │
│  • Gate 1: Initiation → [✓] Requires Governance sign-off           │
│  • Gate 2: Planning → [✓] Requires FinOps budget approval          │
│  • Gate 3: Execution → [✓] Requires Risk assessment                │
│  • Gate 4: Closure → [✓] Requires VRO benefits validation          │
└─────────────────────────────────────────────────────────────────────┘
```

#### Default Rules for PMO

| Rule ID | Rule Name | Attribute | Operator | Threshold | Actions | Target Agents |
|---------|-----------|-----------|----------|-----------|---------|---------------|
| `pmo-red-status` | Red Status Project | `projectHealthScore` | `<` | 50 | Escalate | Governance, Risk, OCM, TMO |
| `pmo-gate-delay` | Gate Approval Delay | `gateDelayDays` | `>` | 5 days | Alert | Governance |
| `pmo-resource-conflict` | Resource Conflict | `resourceAllocation` | `>` | 120% | Alert | TMO |
| `pmo-missing-deliverable` | Missing Deliverable | `missingDeliverableCount` | `>` | 2 items | Block | TMO, Risk |

#### Attributes Measured by PMO
- `projectHealthScore` (0-100) - Composite health score
- `gateDelayDays` (number) - Days past gate deadline
- `resourceAllocation` (percentage) - Resource utilization rate
- `missingDeliverableCount` (number) - Count of incomplete deliverables
- `onTimeDeliveryRate` (percentage) - % of milestones delivered on time
- `teamVelocityTrend` (percentage) - Change in team velocity
- `qualityMetrics` (0-100) - Quality score
- `scopeCreep` (percentage) - Scope growth beyond baseline

#### Special Features
- **Stage Gate Configuration Section:** Define requirements for each project gate
- **Auto-schedule Recovery Meeting:** Checkbox to auto-create meeting when rule fires
- **View Dependencies Button:** Shows impact on other projects/teams
- **Block Progress Action:** Prevents project advancement until issue resolved

#### Stage Gates (Configurable)
1. **Gate 1: Initiation** - Business case approval, governance sign-off
2. **Gate 2: Planning** - Budget approval (FinOps), risk assessment
3. **Gate 3: Execution** - Quality gates, milestone completion
4. **Gate 4: Closure** - Benefits validation (VRO), lessons learned

#### Maps to DeepPMOAgent Capabilities
- Project health analysis
- Milestone tracking
- Resource optimization
- Governance enforcement
- Status report generation

---

### 7. OCM Team Dashboard - Organizational Change Management

**Focus:** Adoption tracking, stakeholder management, resistance monitoring, ADKAR assessment

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  OCM Change Management Rules                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Adoption & Stakeholder Rules:                                      │
│                                                                     │
│  Rule Name           │ Threshold  │ Action         │ Status        │
│  ────────────────────┼────────────┼────────────────┼──────────────  │
│  Low Adoption Rate   │ < 60%      │ Alert VRO      │ ✓ Active      │
│  High Resistance     │ Score > 7  │ Escalate       │ ✓ Active      │
│  Training Gap        │ < 80%      │ Alert PMO      │ ✓ Active      │
│  Stakeholder Risk    │ > 3 issues │ Alert Risk     │ ✓ Active      │
│                                                                     │
│  Edit Rule: Low Adoption Rate                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Adoption Threshold: [  60  ] %                                 ││
│  │                                                                 ││
│  │  When adoption falls below threshold:                           ││
│  │  [✓] Alert VRO - benefits at risk                               ││
│  │  [✓] Notify PMO for project impact                              ││
│  │  [✓] Generate intervention recommendations                      ││
│  │  [ ] Auto-schedule stakeholder meeting                          ││
│  │                                                                 ││
│  │  ADKAR Stage: [▼ Reinforcement ]                                ││
│  │  Measurement: [▼ Survey Results ]                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [ Update Rule ]  [ Resistance Analysis ]  [ Publish ]              │
│                                                                     │
│  Change Readiness Assessment:                                       │
│  • Awareness: 78% ████████░░                                        │
│  • Desire: 65% ██████░░░░                                           │
│  • Knowledge: 82% ████████░░                                        │
│  • Ability: 71% ███████░░░                                          │
│  • Reinforcement: 45% ████░░░░░░                                    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Default Rules for OCM

| Rule ID | Rule Name | Attribute | Operator | Threshold | Actions | Target Agents |
|---------|-----------|-----------|----------|-----------|---------|---------------|
| `ocm-low-adoption` | Low Adoption Rate | `adoptionRate` | `<` | 60% | Alert | VRO, PMO |
| `ocm-high-resistance` | High Resistance | `resistanceScore` | `>` | 7 (out of 10) | Escalate | Governance, VRO |
| `ocm-training-gap` | Training Gap | `trainingCompletionRate` | `<` | 80% | Alert | PMO |
| `ocm-stakeholder-risk` | Stakeholder Risk | `stakeholderIssueCount` | `>` | 3 issues | Alert | Risk, PMO |

#### Attributes Measured by OCM
- `adoptionRate` (percentage) - % of target users actively adopting
- `resistanceScore` (0-10) - Level of change resistance
- `trainingCompletionRate` (percentage) - % of required training completed
- `stakeholderIssueCount` (number) - Count of stakeholder concerns
- `stakeholderReadinessScore` (0-100) - Overall stakeholder readiness
- `communicationEffectiveness` (0-100) - Communication effectiveness score
- `sponsorEngagement` (0-100) - Executive sponsor engagement level

#### ADKAR Framework Integration
The dashboard visualizes change readiness across 5 stages:
1. **Awareness** (0-100%) - Understanding of need for change
2. **Desire** (0-100%) - Motivation to support change
3. **Knowledge** (0-100%) - Knowledge of how to change
4. **Ability** (0-100%) - Ability to implement change
5. **Reinforcement** (0-100%) - Sustaining the change

#### Special Features
- **ADKAR Stage Dropdown:** Associate rules with specific ADKAR stages
- **Measurement Source Dropdown:** Survey Results, Usage Data, Focus Groups, etc.
- **Resistance Analysis Button:** Generates resistance forecast and hotspot report
- **Generate Intervention Recommendations:** AI-powered intervention suggestions
- **Change Readiness Assessment:** Live ADKAR visualization with progress bars

#### Maps to DeepOCMAgent Capabilities
- Change impact assessment
- Stakeholder mapping
- Adoption metrics tracking
- Intervention recommendations
- Resistance forecasting

---

## Complete Rule Editor Suite (8 Apps)

| # | Team | Focus Area | Key Metrics | Status |
|---|------|------------|-------------|--------|
| 1 | **FinOps** | Budget & Cost | Variance, EVM, Burn Rate | ✅ Spec exists |
| 2 | **Governance** | Compliance | Violations, Approvals | ✅ Spec exists |
| 3 | **Risk** | Risk Management | Risk Score, Mitigation | ✅ Spec exists |
| 4 | **TMO** | Schedule & Time | Delays, Milestones | ✅ Spec exists |
| 5 | **VRO** | Value & Benefits | ROI, Benefits, Value Loss | ✅ Spec complete |
| 6 | **PMO** | Project Health | Health Score, Resources, Gates | ✅ Spec complete |
| 7 | **OCM** | Change Adoption | Adoption Rate, Resistance, ADKAR | ✅ Spec complete |
| 8 | **Custom Attributes** | Attribute Builder | Create custom attributes | ✅ Spec exists |

---

## Common UI Patterns (All Dashboards)

### Table Structure
```
Rule Name  │ Threshold  │ Action         │ Status
───────────┼────────────┼────────────────┼──────────
[Name]     │ [Value]    │ [Agent/Action] │ ✓ Active
```

### Edit Panel Structure
```
┌─────────────────────────────────────────────────┐
│  [Attribute]: [  Input  ] [Unit]                │
│                                                 │
│  When [condition]:                              │
│  [✓] [Action 1]                                 │
│  [✓] [Action 2]                                 │
│  [ ] [Action 3]                                 │
│                                                 │
│  [Dropdown 1]: [▼ Option ]                      │
│  [Dropdown 2]: [▼ Option ]                      │
└─────────────────────────────────────────────────┘
```

### Action Buttons
```
[ Update Rule ]  [ Special Feature ]  [ Publish ]
```

### Change History
```
Change History:
• 2026-01-24 11:00 - User (Team) made change description
• 2026-01-22 09:15 - User (Team) made change description
```

---

## Database Schema: `collaboration_rules`

```sql
CREATE TABLE collaboration_rules (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,              -- e.g., 'vro', 'pmo', 'ocm'
  rule_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,

  -- Conditions
  conditions JSONB NOT NULL,           -- Array of condition objects

  -- Actions
  actions JSONB NOT NULL,              -- Array of action objects

  -- Metadata
  priority TEXT DEFAULT 'medium',      -- low, medium, high, critical
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Change tracking
  version INTEGER DEFAULT 1,
  change_history JSONB DEFAULT '[]'
);
```

### Example Rule JSON Structure

```json
{
  "id": "vro-benefits-shortfall",
  "agent_id": "vro",
  "rule_name": "Benefits Shortfall",
  "description": "Alert when benefits realization falls below target",
  "enabled": true,
  "conditions": [
    {
      "attribute": "benefitsRealizationRate",
      "operator": "<",
      "threshold": 85,
      "unit": "%"
    }
  ],
  "actions": [
    {
      "type": "alert",
      "target_agents": ["tmo"],
      "severity": "high",
      "message": "Benefits below 85% - intervention needed"
    },
    {
      "type": "notify",
      "target_agents": ["finops"],
      "severity": "medium",
      "message": "Cost review needed for underperforming benefits"
    },
    {
      "type": "flag",
      "target": "executive_dashboard",
      "severity": "high"
    }
  ],
  "priority": "high",
  "metadata": {
    "track_against": "original_business_case",
    "auto_schedule_meeting": false
  }
}
```

---

## Implementation Checklist

### For Each Rule Editor:
- [ ] Create Retool app named "[Team] Rule Editor"
- [ ] Build rule list table with columns: Rule Name, Threshold, Action, Status
- [ ] Add edit panel with checkboxes for actions
- [ ] Connect to `collaboration_rules` PostgreSQL table
- [ ] Implement CRUD operations (Create, Read, Update, Delete)
- [ ] Add change history tracking
- [ ] Include team-specific special features (dropdowns, buttons)
- [ ] Test rule publishing to `AgentCollaborationRulesEngine`
- [ ] Verify agent receives and evaluates rules correctly

### Integration Points:
1. **PostgreSQL** → `collaboration_rules` table
2. **Backend** → `AgentCollaborationRulesEngine.ts` reads rules
3. **Agents** → Deep Agents evaluate rules during execution
4. **A2A Messages** → Triggered actions send messages via DeepAgentOrchestrator

---

## Next Steps

1. ✅ Deep Agents implemented (DeepPMOAgent, DeepOCMAgent)
2. ✅ Agent attributes defined (PMOAgentAttributes.ts, OCMAgentAttributes.ts)
3. ✅ Specifications documented (this file)
4. ⏳ Build 8 Retool Rule Editor interfaces
5. ⏳ Test rule evaluation with live agents
6. ⏳ Seed default rules for each team

---

**Status:** Specifications complete, ready for Retool implementation
**Dependencies:** PostgreSQL `collaboration_rules` table, `AgentCollaborationRulesEngine.ts`
**Deep Agents:** All 6 agents operational and ready to receive rules
