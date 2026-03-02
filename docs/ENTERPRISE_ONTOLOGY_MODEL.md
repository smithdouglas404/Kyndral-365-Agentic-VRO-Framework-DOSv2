# Enterprise Ontology Model for Palantir AIP

## Product: Portfolio Intelligence Platform

This document defines the enterprise ontology for the Portfolio Intelligence Platform - a multi-agent AI system for enterprise portfolio, program, and project management.

---

## Design Principles

1. **Domain-Driven Naming** - Names reflect business domain, not technical implementation
2. **Consistency** - All object types follow `{Domain}{Entity}` pattern
3. **Relationships First** - Clear linkages between entities
4. **Agent-Ready** - Structured for AI agent consumption
5. **Industry Agnostic** - Works across industries (not tied to specific verticals)

---

## Ontology Namespace: `portfolio`

All object types prefixed with domain context for clarity in Palantir.

---

## Core Object Types

### 1. Organizational Structure

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `Organization` | Top-level enterprise entity | `organizationId` |
| `BusinessUnit` | Division or business segment | `businessUnitId` |
| `Portfolio` | Investment portfolio (collection of programs) | `portfolioId` |
| `Program` | Collection of related projects | `programId` |
| `Team` | Delivery team (agile team, squad) | `teamId` |

**Hierarchy:**
```
Organization
  └── BusinessUnit (1:N)
        └── Portfolio (1:N)
              └── Program (1:N)
                    └── Project (1:N)
                          └── Team (N:N)
```

### 2. Work Management

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `Project` | Discrete initiative with budget/timeline | `projectId` |
| `Milestone` | Key deliverable checkpoint | `milestoneId` |
| `Deliverable` | Tangible output or artifact | `deliverableId` |
| `Dependency` | Cross-project/team dependency | `dependencyId` |
| `WorkItem` | Trackable unit of work (epic, feature, story) | `workItemId` |

### 3. Financial Management

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `Budget` | Financial allocation for project/program | `budgetId` |
| `Expenditure` | Actual spend record | `expenditureId` |
| `Forecast` | Financial projection | `forecastId` |
| `CostBaseline` | Approved budget baseline | `baselineId` |

### 4. Risk & Governance

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `Risk` | Identified risk with probability/impact | `riskId` |
| `Issue` | Materialized problem requiring resolution | `issueId` |
| `ChangeRequest` | Formal change to scope/schedule/budget | `changeRequestId` |
| `ComplianceCheck` | Governance checkpoint result | `checkId` |
| `PolicyViolation` | Detected policy breach | `violationId` |

### 5. Performance & Value

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `Objective` | Strategic objective (OKR O) | `objectiveId` |
| `KeyResult` | Measurable outcome (OKR KR) | `keyResultId` |
| `Metric` | Performance measurement | `metricId` |
| `MetricReading` | Point-in-time metric value | `readingId` |
| `BenefitRealization` | Tracked business benefit | `benefitId` |

### 6. Resource Management

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `Resource` | Person, equipment, or capacity | `resourceId` |
| `ResourceAllocation` | Assignment of resource to work | `allocationId` |
| `CapacityPlan` | Team/resource capacity projection | `capacityId` |
| `SkillProfile` | Resource capabilities | `skillId` |

### 7. Change Management (OCM)

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `ChangeInitiative` | Organizational change effort | `initiativeId` |
| `Stakeholder` | Person affected by or influencing change | `stakeholderId` |
| `AdoptionMetric` | Change adoption measurement | `adoptionId` |
| `TrainingRecord` | Training completion tracking | `trainingId` |

### 8. Agent Intelligence (Internal)

| Object Type | Description | Primary Key |
|-------------|-------------|-------------|
| `AgentInsight` | AI-generated insight or recommendation | `insightId` |
| `Intervention` | Agent-proposed action requiring approval | `interventionId` |
| `Alert` | System-generated notification | `alertId` |
| `DecisionRecord` | Logged decision with rationale | `decisionId` |

---

## Object Type Specifications

### Project

```yaml
objectType: Project
description: "A discrete initiative with defined scope, budget, and timeline"
primaryKey: projectId
properties:
  # Identity
  projectId: { type: string, description: "Unique identifier" }
  name: { type: string, description: "Project name" }
  description: { type: string, description: "Project description" }
  code: { type: string, description: "Short project code" }

  # Hierarchy
  portfolioId: { type: string, description: "Parent portfolio" }
  programId: { type: string, description: "Parent program" }
  businessUnitId: { type: string, description: "Owning business unit" }

  # Status
  status: { type: string, enum: [planning, active, on_hold, completed, cancelled] }
  healthStatus: { type: string, enum: [green, amber, red] }
  phase: { type: string, description: "Current project phase" }

  # Timeline
  plannedStartDate: { type: date }
  plannedEndDate: { type: date }
  actualStartDate: { type: date }
  actualEndDate: { type: date }
  forecastEndDate: { type: date }

  # Financial
  totalBudget: { type: decimal, description: "Approved budget" }
  budgetSpent: { type: decimal, description: "Actual spend to date" }
  budgetRemaining: { type: decimal, description: "Remaining budget" }

  # Earned Value
  plannedValue: { type: decimal, description: "PV - Budgeted cost of work scheduled" }
  earnedValue: { type: decimal, description: "EV - Budgeted cost of work performed" }
  actualCost: { type: decimal, description: "AC - Actual cost of work performed" }
  costPerformanceIndex: { type: decimal, description: "CPI = EV/AC" }
  schedulePerformanceIndex: { type: decimal, description: "SPI = EV/PV" }
  estimateAtCompletion: { type: decimal, description: "EAC - Projected total cost" }
  varianceAtCompletion: { type: decimal, description: "VAC = BAC - EAC" }

  # Progress
  percentComplete: { type: decimal, description: "0-100 completion percentage" }

  # Risk
  riskScore: { type: decimal, description: "Aggregate risk score 0-10" }

  # Strategic Alignment
  strategicPriority: { type: string, enum: [critical, high, medium, low] }
  objectiveId: { type: string, description: "Linked strategic objective" }

  # Ownership
  projectManagerId: { type: string }
  sponsorId: { type: string }

  # Metadata
  createdAt: { type: timestamp }
  updatedAt: { type: timestamp }
```

### Risk

```yaml
objectType: Risk
description: "An uncertain event that may impact project objectives"
primaryKey: riskId
properties:
  riskId: { type: string }
  projectId: { type: string, description: "Associated project" }
  name: { type: string }
  description: { type: string }

  # Assessment
  category: { type: string, enum: [technical, financial, schedule, resource, external, compliance, quality] }
  probability: { type: string, enum: [very_low, low, medium, high, very_high] }
  probabilityScore: { type: decimal, description: "0-1 probability" }
  impact: { type: string, enum: [minimal, minor, moderate, major, catastrophic] }
  impactScore: { type: decimal, description: "1-5 impact score" }
  riskScore: { type: decimal, description: "probability x impact" }

  # Response
  responseStrategy: { type: string, enum: [avoid, mitigate, transfer, accept] }
  mitigationPlan: { type: string }
  contingencyPlan: { type: string }

  # Status
  status: { type: string, enum: [identified, analyzing, mitigating, monitoring, closed, realized] }
  ownerId: { type: string }

  # Timeline
  identifiedDate: { type: date }
  targetResolutionDate: { type: date }
  actualResolutionDate: { type: date }

  createdAt: { type: timestamp }
  updatedAt: { type: timestamp }
```

### Budget

```yaml
objectType: Budget
description: "Financial allocation for a project or program"
primaryKey: budgetId
properties:
  budgetId: { type: string }
  projectId: { type: string }
  programId: { type: string }

  # Allocation
  fiscalYear: { type: integer }
  fiscalQuarter: { type: integer }
  totalAmount: { type: decimal }

  # Breakdown
  capitalExpenditure: { type: decimal, description: "CapEx allocation" }
  operatingExpenditure: { type: decimal, description: "OpEx allocation" }
  contingency: { type: decimal, description: "Risk contingency" }

  # Utilization
  committed: { type: decimal, description: "Committed but not spent" }
  spent: { type: decimal, description: "Actual expenditure" }
  available: { type: decimal, description: "Remaining available" }
  utilizationPercent: { type: decimal, description: "Spent/Total * 100" }

  # Status
  status: { type: string, enum: [draft, approved, active, frozen, closed] }
  approvedBy: { type: string }
  approvedDate: { type: date }

  createdAt: { type: timestamp }
  updatedAt: { type: timestamp }
```

### Metric

```yaml
objectType: Metric
description: "A defined measurement for tracking performance"
primaryKey: metricId
properties:
  metricId: { type: string }

  # Definition
  name: { type: string, description: "Metric name" }
  code: { type: string, description: "Short code (e.g., CPI, SPI)" }
  description: { type: string }
  formula: { type: string, description: "Calculation formula" }
  unit: { type: string, description: "Unit of measure" }

  # Classification
  category: { type: string, enum: [financial, schedule, quality, risk, value, adoption] }
  agentDomain: { type: string, enum: [finops, tmo, risk, pmo, vro, ocm, governance, planning] }

  # Targets
  targetValue: { type: decimal }
  warningThreshold: { type: decimal }
  criticalThreshold: { type: decimal }
  thresholdDirection: { type: string, enum: [above_is_good, below_is_good] }

  # Frequency
  measurementFrequency: { type: string, enum: [realtime, daily, weekly, monthly, quarterly] }

  createdAt: { type: timestamp }
  updatedAt: { type: timestamp }
```

### MetricReading

```yaml
objectType: MetricReading
description: "A point-in-time value for a metric"
primaryKey: readingId
properties:
  readingId: { type: string }
  metricId: { type: string }

  # Context
  projectId: { type: string }
  programId: { type: string }
  portfolioId: { type: string }
  teamId: { type: string }

  # Value
  value: { type: decimal }
  targetValue: { type: decimal }
  variance: { type: decimal }
  variancePercent: { type: decimal }

  # Status
  status: { type: string, enum: [on_target, warning, critical] }

  # Time
  measurementDate: { type: date }
  measurementTimestamp: { type: timestamp }

  # Source
  source: { type: string, enum: [calculated, manual, integrated, agent] }
  sourceAgentId: { type: string }

  createdAt: { type: timestamp }
```

### AgentInsight

```yaml
objectType: AgentInsight
description: "AI-generated insight from agent analysis"
primaryKey: insightId
properties:
  insightId: { type: string }

  # Source
  agentId: { type: string, enum: [finops, tmo, risk, pmo, vro, ocm, governance, planning, integrated, notification] }
  agentName: { type: string }

  # Context
  projectId: { type: string }
  portfolioId: { type: string }

  # Insight
  type: { type: string, enum: [observation, recommendation, prediction, alert, pattern] }
  category: { type: string }
  title: { type: string }
  description: { type: string }

  # Assessment
  severity: { type: string, enum: [info, low, medium, high, critical] }
  confidence: { type: decimal, description: "0-1 confidence score" }

  # Impact
  impactedMetrics: { type: array, items: string }
  estimatedImpact: { type: string }

  # Action
  recommendedAction: { type: string }
  actionPriority: { type: string, enum: [immediate, short_term, medium_term, long_term] }

  # Status
  status: { type: string, enum: [new, acknowledged, in_review, actioned, dismissed] }
  acknowledgedBy: { type: string }
  acknowledgedAt: { type: timestamp }

  createdAt: { type: timestamp }
  expiresAt: { type: timestamp }
```

### Intervention

```yaml
objectType: Intervention
description: "Agent-proposed action requiring human approval (HITL)"
primaryKey: interventionId
properties:
  interventionId: { type: string }

  # Source
  sourceAgentId: { type: string }
  sourceAgentName: { type: string }
  triggerInsightId: { type: string }

  # Context
  projectId: { type: string }
  portfolioId: { type: string }

  # Intervention
  type: { type: string, enum: [budget_adjustment, schedule_change, risk_escalation, resource_reallocation, scope_change, policy_override] }
  title: { type: string }
  description: { type: string }
  justification: { type: string }

  # Proposed Action
  proposedAction: { type: string }
  proposedParameters: { type: object }
  estimatedOutcome: { type: string }

  # Risk Assessment
  riskIfApproved: { type: string }
  riskIfRejected: { type: string }

  # Approval
  status: { type: string, enum: [pending, approved, rejected, expired, cancelled] }
  priority: { type: string, enum: [low, medium, high, critical] }
  requiredApproverRole: { type: string }
  approvedBy: { type: string }
  approvedAt: { type: timestamp }
  rejectionReason: { type: string }

  # Execution
  executedAt: { type: timestamp }
  executionResult: { type: string }

  createdAt: { type: timestamp }
  expiresAt: { type: timestamp }
```

### Alert

```yaml
objectType: Alert
description: "System-generated notification for threshold breach or event"
primaryKey: alertId
properties:
  alertId: { type: string }

  # Source
  sourceAgentId: { type: string }
  triggerType: { type: string, enum: [threshold_breach, pattern_detected, rule_triggered, manual] }
  triggerMetricId: { type: string }

  # Context
  projectId: { type: string }
  portfolioId: { type: string }

  # Alert
  type: { type: string, enum: [budget_alert, schedule_alert, risk_alert, compliance_alert, health_alert, dependency_alert, change_impact_alert] }
  title: { type: string }
  message: { type: string }

  # Severity
  severity: { type: string, enum: [info, warning, critical] }

  # Threshold
  metricValue: { type: decimal }
  thresholdValue: { type: decimal }
  thresholdDirection: { type: string }

  # Status
  status: { type: string, enum: [active, acknowledged, resolved, escalated] }
  acknowledgedBy: { type: string }
  acknowledgedAt: { type: timestamp }
  resolvedBy: { type: string }
  resolvedAt: { type: timestamp }

  # Escalation
  escalatedTo: { type: string }
  escalatedAt: { type: timestamp }

  createdAt: { type: timestamp }
```

---

## Relationships

| From | To | Relationship | Cardinality |
|------|-----|--------------|-------------|
| Organization | BusinessUnit | contains | 1:N |
| BusinessUnit | Portfolio | owns | 1:N |
| Portfolio | Program | contains | 1:N |
| Program | Project | contains | 1:N |
| Project | Team | assignedTo | N:N |
| Project | Milestone | has | 1:N |
| Project | Risk | has | 1:N |
| Project | Issue | has | 1:N |
| Project | Budget | has | 1:N |
| Project | Dependency | hasDependency | N:N |
| Objective | KeyResult | has | 1:N |
| KeyResult | Project | linkedTo | N:N |
| Metric | MetricReading | has | 1:N |
| AgentInsight | Intervention | triggers | 1:1 |
| Risk | Alert | generates | 1:N |

---

## Palantir Functions (Replace Rulebricks Rules)

These functions evaluate business rules and return decisions:

### Financial Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateBudgetUtilization` | FinOps | projectId, utilization% | {status, severity, action, notify, escalate} |
| `evaluateCostPerformance` | FinOps | projectId, CPI | {status, severity, action, notify, escalate} |
| `evaluateBurnRate` | FinOps | projectId, burnRate, runway | {status, severity, action, notify, escalate} |

### Schedule Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateSchedulePerformance` | TMO | projectId, SPI | {status, severity, action, notify, escalate} |
| `evaluateMilestoneHealth` | TMO | milestoneId, daysVariance | {status, severity, action, notify, escalate} |
| `evaluateCriticalPath` | TMO | projectId, slackDays | {status, severity, action, notify, escalate} |

### Risk Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateRiskScore` | Risk | riskId, score | {status, severity, action, notify, escalate} |
| `evaluateRiskTrend` | Risk | projectId, trend | {status, severity, action, notify, escalate} |
| `evaluateMitigationCoverage` | Risk | projectId, coverage% | {status, severity, action, notify, escalate} |

### Portfolio Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateProjectHealth` | PMO | projectId, healthScore | {status, severity, action, notify, escalate} |
| `evaluateGovernanceCompliance` | PMO | projectId, compliance% | {status, severity, action, notify, escalate} |
| `evaluateResourceUtilization` | PMO | teamId, utilization% | {status, severity, action, notify, escalate} |

### Value Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateValueRealization` | VRO | projectId, realization% | {status, severity, action, notify, escalate} |
| `evaluateROI` | VRO | projectId, roi% | {status, severity, action, notify, escalate} |
| `evaluateStrategicAlignment` | VRO | projectId, alignment% | {status, severity, action, notify, escalate} |

### Compliance Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluatePolicyCompliance` | Governance | projectId, policy, data | {compliant, violations, action, notify, escalate} |
| `evaluateStageGate` | Governance | projectId, gate, criteria | {passed, gaps, action, notify, escalate} |

### Change Management Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateChangeImpact` | OCM | initiativeId, impactAreas | {status, severity, action, notify, escalate} |
| `evaluateAdoptionRate` | OCM | initiativeId, adoption% | {status, severity, action, notify, escalate} |
| `evaluateResistance` | OCM | initiativeId, resistanceScore | {status, severity, action, notify, escalate} |

### Planning Functions

| Function | Agent | Input | Output |
|----------|-------|-------|--------|
| `evaluateDependencyHealth` | Planning | projectId, blockedCount | {status, severity, action, notify, escalate} |
| `evaluateCapacity` | Planning | teamId, utilization% | {status, severity, action, notify, escalate} |

---

## Palantir Actions (Notification Agent Executes)

| Action | Description | Parameters |
|--------|-------------|------------|
| `createAlert` | Create alert record | type, severity, projectId, message |
| `createInsight` | Create agent insight | agentId, type, title, description, severity |
| `createIntervention` | Create HITL intervention | agentId, type, title, proposedAction, priority |
| `escalateToLeadership` | Escalate critical issue | alertId, escalationReason, targetRole |
| `sendNotification` | Send user notification | recipientId, channel, message |
| `updateProjectHealth` | Update project health status | projectId, healthStatus, reason |
| `createRiskRecord` | Create new risk | projectId, name, probability, impact, category |
| `updateMetricReading` | Record metric value | metricId, projectId, value, source |

---

## Migration Mapping: Current → Enterprise

| Current Name (Atlas*) | Enterprise Name | Notes |
|-----------------------|-----------------|-------|
| AtlasProject | Project | Direct mapping |
| AtlasRisk | Risk | Direct mapping |
| AtlasBudget | Budget | Direct mapping |
| AtlasFinancialRecord | Expenditure | Renamed for clarity |
| AtlasKpi | Metric + MetricReading | Split into definition + readings |
| AtlasTeam | Team | Direct mapping |
| AtlasDependency | Dependency | Direct mapping |
| AtlasGovernanceCheckpoint | ComplianceCheck | Renamed for clarity |
| AtlasInsight | AgentInsight | Renamed with Agent prefix |
| AtlasObjective | Objective | Direct mapping |
| AtlasKeyResult | KeyResult | Direct mapping |
| AtlasReadinessMetric | AdoptionMetric | Renamed for clarity |
| AtlasPerson | Resource | Generalized to Resource |
| AtlasTransformation | ChangeInitiative | Renamed for clarity |
| AtlasAgent | (internal only) | Not exposed in ontology |

---

## Summary

This ontology provides:

1. **Clean Naming** - No "Atlas" prefix, clear domain-driven names
2. **Complete Coverage** - All 11 agents have required object types
3. **Proper Relationships** - Clear hierarchy and linkages
4. **Function-Ready** - Palantir Functions replace Rulebricks rules
5. **Action-Ready** - Palantir Actions for notification agent
6. **HITL Support** - Intervention object type for approvals
7. **Audit Trail** - Timestamps on all objects
8. **Agent Attribution** - Source agent tracked on insights/alerts
