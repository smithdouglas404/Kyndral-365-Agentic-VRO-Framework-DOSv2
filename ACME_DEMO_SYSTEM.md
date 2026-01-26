# ACME DEMO DATA SYSTEM

**Version:** 1.0
**Created:** January 26, 2026
**Status:** Design Specification

---

## Overview

The ACME Demo Data System replaces static NextEra fallback data with a **living, breathing demonstration environment** that showcases the full power of the Deep Agent System. Each industry gets a complete ACME variant with 10 realistic projects, active agent interventions, fired rules, and industry-specific terminology.

### Vision

**Instead of:** "Here's a dashboard with fake data"
**We show:** "Here's a portfolio manager at ACME Healthcare dealing with real challenges—late projects, budget overruns, compliance issues—and watch how AI agents detect patterns, collaborate, and recommend solutions."

---

## Architecture

### Multi-Industry ACME Variants

```
ACME Corporation (Base)
├─ ACME Energy & Utilities
│  └─ 10 projects (Grid Modernization, Renewable Installation, etc.)
├─ ACME Healthcare
│  └─ 10 projects (EHR Implementation, Clinical Workflow, etc.)
├─ ACME Technology
│  └─ 10 projects (API Platform Migration, Mobile App Launch, etc.)
├─ ACME Retail
│  └─ 10 projects (E-commerce Platform, Store Modernization, etc.)
├─ ACME Financial Services
│  └─ 10 projects (Digital Banking, Core System Migration, etc.)
├─ ACME Manufacturing
│  └─ 10 projects (Production Line Automation, Lean Six Sigma, etc.)
└─ ... (14 more industry variants)
```

**Each ACME variant includes:**
- Company profile using industry ontology terminology
- 10 projects in various health states
- 15-20 active agent interventions
- 30-40 agent observations (fact broadcasts, pattern detection)
- 5-10 fired rules with context
- 3-5 Battle Rhythm event summaries
- Industry-specific dashboards
- Realistic metrics triggering agent actions

---

## Project Template Structure

### 10 Projects Per Industry (Health State Distribution)

**Project 1-2: CRITICAL - Late & Over Budget**
- Status: Red
- CPI: 0.75-0.85 (25-15% over budget)
- SPI: 0.70-0.80 (30-20% schedule delay)
- **Triggers:** DeepFinOps, DeepTMO, DeepRisk
- **Interventions:** "Emergency project recovery needed", "Reforecast budget +$500K", "Add 3 weeks to schedule"
- **Root Causes:** Scope creep, resource turnover, technical debt, vendor delays

**Project 3-4: WARNING - Metrics Out of Range**
- Status: Yellow
- CPI: 0.88-0.92 (12-8% variance)
- SPI: 0.90-0.95 (10-5% delay)
- **Triggers:** Rules engine warnings, DeepPMO monitoring
- **Interventions:** "Budget trending down, review actuals", "Minor schedule risk detected"
- **Root Causes:** Underestimated complexity, learning curve on new technology

**Project 5-6: HEALTHY - On Track & Under Budget**
- Status: Green
- CPI: 1.05-1.15 (5-15% under budget)
- SPI: 1.00-1.10 (on time or ahead)
- **Triggers:** DeepVRO (value realization opportunities)
- **Interventions:** "Ahead of schedule, consider pulling work forward", "Under budget, opportunity to add scope"
- **Success Factors:** Strong PM leadership, clear requirements, experienced team

**Project 7-8: RISK - Multiple Risk Factors**
- Status: Yellow/Red
- High risk count: 8-12 risks
- Risk exposure: $2M-$5M
- **Triggers:** DeepRisk pattern detection
- **Interventions:** "Three critical risks unmitigated", "Risk exposure exceeds tolerance", "Recommend risk response plan"
- **Risk Categories:** Technical, vendor, organizational change, regulatory

**Project 9-10: GOVERNANCE - Compliance Issues**
- Status: Yellow
- Governance score: 65-75%
- Missing approvals, documentation gaps
- **Triggers:** DeepGovernance policy violations
- **Interventions:** "Stage gate approval overdue", "Required documentation missing", "Compliance framework violation"
- **Issues:** Missing architecture review, security audit pending, change board approval needed

### Project Naming Convention

**Format:** `[Industry Terminology] - [Project Type]`

**Examples:**
- **Energy:** "Grid Modernization - Smart Meter Rollout", "Renewable Installation - Solar Farm Phase 2"
- **Healthcare:** "EHR Implementation - Epic Upgrade", "Clinical Workflow Optimization - Emergency Dept"
- **Tech:** "API Platform Migration - Microservices", "Mobile App Launch - iOS 2.0"
- **Retail:** "E-commerce Platform Upgrade - Checkout Redesign", "Store Modernization - POS System Refresh"
- **Financial:** "Digital Banking Transformation - Mobile App", "Core System Migration - Temenos T24"
- **Manufacturing:** "Production Line Automation - Robot Cell 5", "Lean Six Sigma - Defect Reduction"

---

## Project Template Details (Example: Energy)

### Project 1: Grid Modernization - Smart Meter Rollout ❌ CRITICAL

**Status:** Red - Late & Over Budget

**Metrics:**
- Budget: $15M (Original), $18.5M (Current), $20M (Forecast) → CPI: 0.81
- Schedule: Jan 2025 - Dec 2025 (Original), Now Jan 2026 (4 weeks late) → SPI: 0.76
- Scope: 500,000 meters (Original), 450,000 completed → 90% complete but behind
- Risk Exposure: $3.2M

**Tasks Causing Delays:**
- Task: "Install communication network" - 6 weeks late (vendor equipment delayed)
- Task: "Customer opt-in campaign" - 30% adoption vs 60% target (low engagement)
- Task: "System integration testing" - discovered 45 critical bugs (quality issues)

**Active Interventions (5):**
1. **DeepFinOps:** "Budget overrun detected - Project consuming 23% more than allocated. Root cause: Vendor cost increase ($1.2M) + rework ($800K). Recommend: Reforecast +$2M or descope to 400K meters."
2. **DeepTMO:** "Schedule critical - 4 weeks behind with 8 weeks remaining. Critical path: Network install → Integration test → Cutover. Recommend: Add weekend work shifts, expedite vendor deliveries."
3. **DeepRisk:** "Triple threat pattern - Budget + Schedule + Quality issues detected. Historical data shows 85% chance of further delays. Recommend: Executive escalation, recovery plan required."
4. **DeepOCM:** "Change adoption risk - Customer opt-in at 30% vs 60% target. Sentiment analysis shows confusion about benefits. Recommend: Enhanced communication campaign, incentive program."
5. **DeepGovernance:** "Stage gate approval overdue - Project requires Architecture Review Board sign-off before production deployment. Missing: Security assessment, disaster recovery plan."

**Agent Observations (8):**
- "Pattern: Projects with vendor dependencies delayed 40% more on average"
- "Fact: Integration testing revealing 3x expected defects → Quality assurance gap"
- "Correlation: Low customer adoption correlated with insufficient training materials"
- "Collaboration Request: FinOps + TMO + OCM joint mitigation plan needed"

**Fired Rules (3):**
- Rule: "Budget Overrun Critical" (CPI < 0.85) → Triggered 2 weeks ago
- Rule: "Schedule Delay High" (SPI < 0.80) → Triggered 3 weeks ago
- Rule: "Governance Gate Violation" (Stage gate overdue > 14 days) → Triggered 1 week ago

**Battle Rhythm Context:**
- **Sunday Recon (Last Week):** "Grid Modernization flagged as top portfolio risk. Recommend executive attention."
- **Monday Briefing:** "Recovery plan needed for Grid Modernization. Finance approved additional $2M contingency."
- **Wednesday Checkpoint:** "Vendor committed to expedited delivery by Feb 15. Testing resources doubled."

---

### Project 5: Transmission Upgrade - Line Reliability ✅ HEALTHY

**Status:** Green - On Track & Under Budget

**Metrics:**
- Budget: $8M (Original), $7.2M (Current), $7.5M (Forecast) → CPI: 1.07 (7% under)
- Schedule: Mar 2025 - Sep 2025, Currently on track for Aug 2025 completion → SPI: 1.05 (5% ahead)
- Scope: 100% on track
- Risk Exposure: $200K (low)

**Success Factors:**
- Strong PM with 15 years utility experience
- Clear requirements, no scope changes
- Experienced contractor team
- Favorable weather conditions

**Active Interventions (1):**
1. **DeepVRO:** "Opportunity detected - Project 5% ahead of schedule and under budget. Consider: (A) Pull forward Phase 2 work, or (B) Add scope for grid hardening. ROI analysis: Option A yields $500K NPV."

**Agent Observations (2):**
- "Success Pattern: Projects led by PMs with 10+ years experience have 75% on-time delivery rate"
- "Best Practice: Clear requirements docs correlated with 60% fewer change requests"

**Fired Rules (1):**
- Rule: "Value Realization Opportunity" (CPI > 1.05 AND SPI > 1.00) → Triggered this week

---

### Project 7: Renewable Installation - Wind Farm Phase 3 ⚠️ RISK

**Status:** Yellow - High Risk Exposure

**Metrics:**
- Budget: $25M (Original), $24M (Current) → CPI: 1.04 (on budget)
- Schedule: On track → SPI: 1.00
- Risk Exposure: $8.5M (HIGH - 34% of budget at risk)
- Open Risks: 12 (3 critical, 5 high, 4 medium)

**Critical Risks:**
1. **Environmental Permit Delay** - Probability: 60%, Impact: $3M, 12 weeks delay
2. **Turbine Supply Chain Disruption** - Probability: 40%, Impact: $2.5M, 8 weeks delay
3. **Grid Interconnection Approval** - Probability: 50%, Impact: $3M, 10 weeks delay

**Active Interventions (3):**
1. **DeepRisk:** "Risk exposure exceeds tolerance - 3 critical risks unmitigated, combined exposure $8.5M (34% of budget). Historical data: Wind projects with permit issues delay 85% of time. Recommend: Engage environmental counsel, accelerate permit expediting."
2. **DeepRisk:** "Pattern detected - Supply chain risks increasing across renewable portfolio. 4 projects now facing turbine delays. Recommend: Portfolio-level mitigation: bulk order with penalty clause."
3. **DeepGovernance:** "Risk response plans overdue - 3 critical risks lack approved mitigation strategies. Policy requires executive approval for risks >$2M. Action needed within 48 hours."

**Fired Rules (2):**
- Rule: "High Risk Exposure" (Total risk exposure > 30% budget) → Triggered this week
- Rule: "Critical Risk Unmitigated" (Critical risk open > 30 days) → Triggered 1 week ago

---

## Agent Intervention Templates

### Intervention Structure

```typescript
interface AgentIntervention {
  id: string;
  agentId: 'finops' | 'tmo' | 'risk' | 'vro' | 'pmo' | 'ocm' | 'governance' | 'planning';
  projectId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string; // AI explanation
  recommendations: string[];
  factsUsed: string[]; // Which data points triggered this
  collaboratingAgents?: string[]; // If multi-agent intervention
  confidence: number; // 0.0-1.0
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: timestamp;
  respondBy?: timestamp;
}
```

### Intervention Patterns by Agent

**DeepFinOps Interventions:**
- "Budget overrun detected - CPI below threshold"
- "Burn rate exceeds allocation - Forecast deficit"
- "Cost optimization opportunity - Vendor consolidation"
- "Invoice variance detected - $X discrepancy from PO"

**DeepTMO Interventions:**
- "Schedule critical - Critical path extended X weeks"
- "Milestone at risk - Deliverable Y slipping"
- "Resource bottleneck - Team A overallocated 140%"
- "Dependency broken - Project B blocking Project A"

**DeepRisk Interventions:**
- "High risk exposure - Total exposure exceeds tolerance"
- "Critical risk unmitigated - Risk X open > 30 days"
- "Risk pattern detected - Similar risks across 3 projects"
- "Emerging risk - Market condition change impacts portfolio"

**DeepVRO Interventions:**
- "Value realization at risk - Benefits not tracking to plan"
- "Opportunity detected - Under budget, consider scope addition"
- "ROI declining - Business case assumptions no longer valid"
- "Benefits measurement gap - No tracking mechanism in place"

**DeepPMO Interventions:**
- "Project health declining - Multiple yellow indicators"
- "Resource conflict - Team competing for same resources"
- "Quality metrics below threshold - Defect rate high"
- "Delivery confidence low - 50% chance of on-time completion"

**DeepOCM Interventions:**
- "Change adoption risk - Readiness assessment shows gaps"
- "Stakeholder resistance - Sentiment analysis negative"
- "Training effectiveness low - Post-training scores < 70%"
- "Communication breakdown - Key stakeholders not engaged"

**DeepGovernance Interventions:**
- "Policy violation - Required approval missing"
- "Stage gate overdue - Review needed before proceeding"
- "Compliance gap - Documentation not meeting standard"
- "Audit finding - Control weakness identified"

**DeepPlanning Interventions:**
- "Capacity overcommit - Q3 portfolio allocation 135%"
- "Dependency conflict - Circular dependency detected"
- "Portfolio imbalance - 80% budget on run-the-business"
- "Resource gap - No available architects for Q2"

---

## Agent Observation Templates

### Observation Types

**Pattern Detection:**
- "Pattern: Projects with vendor dependencies delayed 40% more"
- "Pattern: Agile projects deliver 25% faster than waterfall"
- "Pattern: Projects with dedicated BAs have 60% fewer change requests"

**Fact Broadcasting:**
- "Fact: Project_Phoenix:CPI = 0.82 (confidence: 95%)"
- "Fact: Resource_TeamA:Utilization = 140% (confidence: 90%)"
- "Fact: Risk_Supply_Chain:Likelihood = INCREASING (confidence: 85%)"

**Correlation Discovery:**
- "Correlation: Low change adoption → 3x rework (r=0.78)"
- "Correlation: PM experience > 10 years → On-time delivery (r=0.65)"
- "Correlation: Unclear requirements → Budget overruns (r=0.72)"

**Collaboration Requests:**
- "FinOps + TMO collaboration needed for Project_Phoenix recovery"
- "Risk + Governance joint review required for compliance risks"
- "VRO + PMO alignment needed on benefit tracking approach"

**Learning Evidence:**
- "Learned: Weather delays in Q1 → Add 20% buffer for outdoor projects"
- "Learned: New technology → 30% learning curve penalty first 2 months"
- "Learned: Vendor X delivers late 70% of time → Avoid or penalize"

---

## Rules Engine Pre-Fired State

### Rule Categories & Examples

**Budget Rules:**
- "Budget Overrun Critical" (CPI < 0.85) → 2 projects triggered
- "Budget Overrun Warning" (CPI < 0.90) → 4 projects triggered
- "Burn Rate High" (Monthly spend > 120% average) → 1 project triggered

**Schedule Rules:**
- "Schedule Delay Critical" (SPI < 0.80) → 2 projects triggered
- "Schedule Delay Warning" (SPI < 0.90) → 3 projects triggered
- "Milestone Overdue" (Key milestone > 7 days late) → 5 milestones triggered

**Risk Rules:**
- "High Risk Exposure" (Total risk > 30% budget) → 2 projects triggered
- "Critical Risk Unmitigated" (Critical risk open > 30 days) → 3 risks triggered
- "Risk Velocity High" (5+ new risks in 2 weeks) → 1 project triggered

**Governance Rules:**
- "Stage Gate Overdue" (Gate approval > 14 days past due) → 1 project triggered
- "Required Approval Missing" (Spend > $500K without CFO sign-off) → 2 projects triggered
- "Audit Documentation Gap" (Required docs incomplete) → 3 projects triggered

**Value Rules:**
- "Value Realization Opportunity" (CPI > 1.05 AND SPI > 1.00) → 2 projects triggered
- "Benefits Tracking Gap" (No benefits measurement for >60 days) → 4 projects triggered
- "ROI Below Threshold" (Projected ROI < 15%) → 1 project triggered

### Rule Fired Context

```typescript
interface RuleFiredEvent {
  ruleId: string;
  ruleName: string;
  projectId: string;
  triggeredAt: timestamp;
  conditions: {
    field: string;
    operator: string;
    threshold: any;
    actualValue: any;
  }[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  actionsTriggered: string[]; // "create_intervention", "send_notification", "escalate"
  context: {
    projectName: string;
    projectStatus: string;
    relatedMetrics: Record<string, any>;
    historicalPattern?: string;
  };
}
```

---

## Battle Rhythm Event Templates

### Weekly Cadence Events

**Sunday Reconnaissance (Portfolio-Level)**
```
Date: Sunday, Jan 19, 2026 9:00 AM
Type: Weekly Recon
Scope: Entire ACME Portfolio

KEY FINDINGS:
• 2 projects CRITICAL (Grid Modernization, Customer Portal)
• 4 projects WARNING (Meter Data Analytics, Renewable Phase 3, etc.)
• 4 projects GREEN (Transmission Upgrade, Substation Refresh, etc.)
• Total portfolio risk exposure: $15.2M (up from $12.8M last week)
• Top recommendation: Executive attention needed for Grid Modernization

PATTERNS DETECTED:
• Vendor delays impacting 3 projects (recommend portfolio-level discussion)
• Permit issues on 2 renewable projects (regulatory strategy needed)
• Budget pressure across portfolio (Q1 actuals 8% over forecast)

RECOMMENDATIONS:
1. Emergency recovery plan for Grid Modernization ($3.2M risk)
2. Portfolio-level vendor performance review
3. Increase Q1 contingency reserve by $2M
```

**Monday Briefing (Project-Level Focus)**
```
Date: Monday, Jan 20, 2026 8:00 AM
Type: Weekly Kick-Off
Focus Projects: Grid Modernization, Meter Data Analytics, Renewable Phase 3

GRID MODERNIZATION UPDATE:
• Status: Still RED (CPI 0.81, SPI 0.76)
• Actions taken: Finance approved +$2M contingency, vendor escalated
• This week: Recovery plan review, resource augmentation decision
• Blockers: Network equipment still delayed, integration bugs

METER DATA ANALYTICS UPDATE:
• Status: YELLOW (CPI 0.89, SPI 0.92)
• Concerns: Data quality issues discovered, ETL rework needed
• This week: Data remediation plan, impact assessment
• Good news: Core platform stable

RENEWABLE PHASE 3 UPDATE:
• Status: YELLOW (High risk exposure $8.5M)
• Concerns: 3 critical risks unmitigated (permit, supply chain, interconnection)
• This week: Risk mitigation strategies due, executive approval needed
• Timeline: Still on schedule if risks don't materialize
```

**Wednesday Checkpoint (Mid-Week Check-In)**
```
Date: Wednesday, Jan 22, 2026 2:00 PM
Type: Mid-Week Checkpoint
Focus: Key Issues Resolution

PROGRESS THIS WEEK:
• Grid Modernization: Vendor committed to expedited delivery by Feb 15 ✓
• Meter Data Analytics: Data quality triage completed, 2-week remediation plan approved ✓
• Renewable Phase 3: Environmental counsel engaged, permit acceleration underway ✓

NEW ISSUES:
• Customer Portal: Security vulnerability discovered in testing (severity: HIGH)
• Substation Refresh: Key resource unexpected medical leave (2-week impact)

DECISIONS NEEDED:
• Grid Modernization: Approve weekend work authorization ($150K)?
• Customer Portal: Delay go-live by 2 weeks for security fix?
```

**Friday Synthesis (Week Summary)**
```
Date: Friday, Jan 24, 2026 4:00 PM
Type: Weekly Synthesis
Week: Jan 20-24, 2026

WEEK SUMMARY:
• 2 critical issues addressed (Grid Modernization vendor, Renewable Phase 3 risks)
• 1 new critical issue emerged (Customer Portal security)
• Portfolio budget variance improved from -8% to -6%
• 3 projects advanced to next stage gate

AGENT ACTIVITY THIS WEEK:
• 24 new interventions created
• 18 interventions approved and executed
• 6 interventions rejected with feedback
• 45 agent observations logged
• 12 rules fired across portfolio

LESSONS LEARNED:
• Vendor escalation effective: Grid Mod equipment now prioritized
• Early risk identification working: Renewable risks flagged before impact
• Security testing paying off: Customer Portal issue found before production

NEXT WEEK PRIORITIES:
1. Grid Modernization recovery plan execution
2. Customer Portal security fix and re-test
3. Renewable Phase 3 risk mitigation approval
4. Portfolio budget re-forecast
```

---

## Dashboard Layout with Industry Ontology

### Terminology Mapping

**Energy Dashboard:**
- Org Units: "Generation", "Transmission & Distribution", "Renewable Energy"
- Project Types: "Grid Modernization", "Renewable Installation", "Compliance Initiative"
- Metrics: "Renewable Capacity (GW)", "Grid Reliability Index (%)", "Carbon Intensity"

**Healthcare Dashboard:**
- Org Units: "Clinical Services", "Hospital Operations", "Research & Development"
- Project Types: "EHR Implementation", "Clinical Program", "Facility Expansion"
- Metrics: "Patient Satisfaction Score", "Bed Utilization Rate", "Readmission Rate (%)"

**Tech Dashboard:**
- Org Units: "Engineering", "Product Management", "Platform Engineering"
- Project Types: "Product Launch", "Platform Migration", "Technical Debt"
- Metrics: "ARR ($)", "Deployment Frequency (deploys/week)", "System Uptime (%)"

**Retail Dashboard:**
- Org Units: "Store Operations", "Digital Commerce", "Supply Chain"
- Project Types: "Store Opening", "E-commerce Platform", "Supply Chain Optimization"
- Metrics: "Same-Store Sales Growth (%)", "Conversion Rate (%)", "Inventory Turnover"

### Uniform Layout Structure

**All Industry Dashboards Follow Same Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│  ACME [Industry] - Executive Dashboard                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  PORTFOLIO HEALTH                                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐   │
│  │ Total       │ Critical    │ Warning     │ Healthy     │   │
│  │ Projects    │ Projects    │ Projects    │ Projects    │   │
│  │ 10          │ 2 🔴        │ 4 🟡        │ 4 🟢        │   │
│  └─────────────┴─────────────┴─────────────┴─────────────┘   │
│                                                                │
│  KEY METRICS (Industry-Specific)                               │
│  ┌──────────────────┬──────────────────┬──────────────────┐  │
│  │ [Metric 1]       │ [Metric 2]       │ [Metric 3]       │  │
│  │ [Value]          │ [Value]          │ [Value]          │  │
│  │ [Trend] ↑↓→      │ [Trend] ↑↓→      │ [Trend] ↑↓→      │  │
│  └──────────────────┴──────────────────┴──────────────────┘  │
│                                                                │
│  AGENT ACTIVITY (Last 7 Days)                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 24 Interventions Created  │  18 Approved  │  6 Rejected│   │
│  │ 45 Observations Logged    │  12 Rules Fired             │   │
│  │ 5 Patterns Detected       │  3 Collaborations          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  PROJECTS BY [ORG UNIT TYPE]                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ [Org Unit 1]: 3 projects (1🔴 1🟡 1🟢)                  │   │
│  │ [Org Unit 2]: 4 projects (1🔴 2🟡 1🟢)                  │   │
│  │ [Org Unit 3]: 3 projects (1🟡 2🟢)                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  BATTLE RHYTHM TIMELINE                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Sun: Portfolio Recon  │ Mon: Kick-Off  │ Wed: Checkpoint│   │
│  │ ✓ Completed           │ ✓ Completed    │ ✓ Completed    │   │
│  │ Fri: Synthesis (Today)                                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Same layout, different terminology** - Healthcare sees "Clinical Services", Tech sees "Engineering", Retail sees "Store Operations", etc.

---

## Rule Change Detection System

### Real-Time Rule Re-Evaluation

**When User Changes Rule Threshold:**

```typescript
async function onRuleThresholdChanged(ruleId: string, oldThreshold: any, newThreshold: any) {
  console.log(`[RuleEngine] Rule ${ruleId} threshold changed from ${oldThreshold} to ${newThreshold}`);

  // 1. Get all active projects
  const projects = await db.select().from(projects).where(eq(projects.status, 'active'));

  // 2. Re-evaluate rule against all projects
  const results = await Promise.all(
    projects.map(project => evaluateRule(ruleId, project))
  );

  // 3. Identify newly triggered projects
  const newlyTriggered = results.filter(r => r.triggered && !r.wasTriggeredBefore);

  // 4. Identify no longer triggered projects
  const noLongerTriggered = results.filter(r => !r.triggered && r.wasTriggeredBefore);

  // 5. Create new interventions for newly triggered
  for (const result of newlyTriggered) {
    await createIntervention({
      projectId: result.projectId,
      ruleId: ruleId,
      severity: determineRuleSeverity(result),
      reason: `Rule "${result.ruleName}" threshold changed, now triggered`,
      recommendations: generateRecommendations(result)
    });
  }

  // 6. Dismiss interventions for no longer triggered
  for (const result of noLongerTriggered) {
    await dismissIntervention({
      projectId: result.projectId,
      ruleId: ruleId,
      reason: `Rule threshold changed, condition no longer met`
    });
  }

  // 7. Broadcast notification
  await broadcastNotification({
    type: 'rule_change',
    title: `Rule Updated: ${getRuleName(ruleId)}`,
    message: `${newlyTriggered.length} projects now triggered, ${noLongerTriggered.length} no longer triggered`,
    severity: newlyTriggered.length > 0 ? 'high' : 'info'
  });

  return {
    newlyTriggered: newlyTriggered.length,
    noLongerTriggered: noLongerTriggered.length,
    totalAffected: newlyTriggered.length + noLongerTriggered.length
  };
}
```

**UI Flow:**
1. User goes to Admin → Agent Rules
2. Edits "Budget Overrun Critical" threshold from 0.85 to 0.80
3. Clicks "Save Changes"
4. System immediately re-evaluates all 10 projects
5. Notification appears: "Rule updated: Budget Overrun Critical - 1 project now triggered (Project X), 2 projects no longer triggered"
6. Dashboard updates showing new intervention for Project X
7. Old interventions for other projects dismissed with note

---

## Industry Selector for Demo Mode

### UI Component

**Location:** Demo Mode Banner (when in demo mode)

**Appearance:**
```
┌────────────────────────────────────────────────────────────┐
│ ⚠ You're viewing demo data (ACME Energy & Utilities)       │
│ Try different industries: [Energy ▼] [🔄 Switch]           │
│ [View Setup Status]  [✨ Complete Setup]                  │
└────────────────────────────────────────────────────────────┘
```

**Dropdown Options:**
```
ACME Energy & Utilities (Current)
ACME Healthcare ✨
ACME Technology ✨
ACME Financial Services ✨
ACME Retail & E-commerce ✨
ACME Manufacturing ✨
────────────────────────────
View All Industries (20) →
```

**When User Switches:**
1. Show loading overlay: "Loading ACME Healthcare demo data..."
2. Reload company profile with ACME Healthcare
3. Dashboard terminology updates (Clinical Services vs Generation)
4. Projects reload (EHR Implementation vs Grid Modernization)
5. Interventions reload (HIPAA compliance vs NERC CIP)
6. Notification: "Now viewing ACME Healthcare - 10 projects, 18 active interventions"

---

## Implementation Plan

### Phase 1: Data Structures (Week 1)

**Files to Create:**
1. `server/seed-data/acme-companies.json` - 20 ACME company variants
2. `server/seed-data/acme-projects.json` - 10 projects × 20 industries = 200 project templates
3. `server/seed-data/acme-interventions.json` - Intervention templates
4. `server/seed-data/acme-observations.json` - Agent observation templates
5. `server/seed-data/acme-rules-fired.json` - Pre-fired rule state
6. `server/seed-data/acme-battle-rhythm.json` - Battle Rhythm event templates

**Schema Updates:**
- Add `demoIndustry` field to company profile
- Add `isDemoData` boolean flag to projects, interventions
- Add `templateId` for linking demo projects to templates

### Phase 2: Seed Script (Week 1-2)

**Create:** `server/scripts/seed-acme-demo.ts`

```typescript
export async function seedACMEDemo(industryId?: string) {
  // Default to Energy if no industry specified
  const industry = industryId || 'energy-utilities';

  console.log(`[ACME] Seeding demo data for industry: ${industry}`);

  // 1. Create ACME company for this industry
  const company = await createACMECompany(industry);

  // 2. Seed 10 projects with realistic health states
  const projects = await seedACMEProjects(company.id, industry);

  // 3. Seed agent interventions for problematic projects
  const interventions = await seedACMEInterventions(projects);

  // 4. Seed agent observations (pattern detection, fact broadcasting)
  const observations = await seedACMEObservations(projects);

  // 5. Seed rules engine fired state
  const rulesFired = await seedACMERulesFired(projects);

  // 6. Seed Battle Rhythm event history
  const battleRhythm = await seedACMEBattleRhythm(company.id, projects);

  console.log(`[ACME] ✅ Demo data seeded successfully`);
  console.log(`  • Company: ACME ${industry}`);
  console.log(`  • Projects: ${projects.length}`);
  console.log(`  • Interventions: ${interventions.length}`);
  console.log(`  • Observations: ${observations.length}`);
  console.log(`  • Rules Fired: ${rulesFired.length}`);
  console.log(`  • Battle Rhythm Events: ${battleRhythm.length}`);

  return { company, projects, interventions, observations, rulesFired, battleRhythm };
}
```

### Phase 3: Rule Change Detection (Week 2)

**Create:** `server/services/ruleChangeDetector.ts`

- Implement rule re-evaluation logic
- Create intervention auto-generation
- Implement intervention dismissal
- Add notification broadcasting

### Phase 4: Industry Selector UI (Week 2)

**Update:** `client/src/components/DemoModeBanner.tsx`

- Add industry dropdown
- Add switch handler
- Implement reload logic with loading state

### Phase 5: Dashboard Terminology Updates (Week 3)

**Update:** Dashboard components to use industry ontology

- Replace hardcoded "Generation", "Transmission" with dynamic terminology
- Use `companyProfile.industryProfile.terminology.orgUnits`
- Update project type labels
- Update metric names and units

### Phase 6: Testing & Validation (Week 3)

**Test Scenarios:**
1. Fresh install shows ACME Energy demo
2. Industry selector switches to Healthcare, terminology updates
3. Edit rule threshold, see new interventions created
4. Agent activity visible in logs
5. Battle Rhythm events display correctly
6. Interventions link to actual project data
7. Dashboards use industry terminology

---

## Success Criteria

**Demo Feels Real When:**
- ✅ Projects have believable issues (not perfect, not disaster)
- ✅ Agents actively working (interventions updating)
- ✅ Rules firing on real conditions (CPI/SPI thresholds)
- ✅ Battle Rhythm shows weekly cadence (events with timestamps)
- ✅ Industry terminology matches domain (Healthcare says "Clinical Services", not "Business Unit")
- ✅ Rule changes have immediate effect (new interventions appear)
- ✅ Users can see cause-and-effect ("I changed threshold, 2 projects now triggered")
- ✅ Multiple problem patterns visible (budget, schedule, risk, governance)
- ✅ Agent collaboration evident (FinOps + TMO working together)
- ✅ Learning demonstrated (patterns detected, correlations found)

**User Reactions We Want:**
- "Wow, this is actually working on real problems!"
- "I can see the agents thinking and collaborating"
- "The industry terminology is perfect for our domain"
- "When I changed that rule, it immediately updated - that's powerful"
- "This looks like our actual portfolio"

---

## Future Enhancements

1. **Time Travel** - Rewind demo to show how project degraded over time
2. **Scenario Simulator** - "What if vendor delays by 2 more weeks?"
3. **Agent Training Mode** - Watch agents learn from feedback in real-time
4. **Multi-Company Demos** - Compare ACME Energy vs ACME Healthcare portfolios
5. **Custom Demo Builder** - Let users configure their own demo scenarios
6. **Demo Analytics** - Track which features users interact with most in demo
7. **Guided Tours** - "Let me show you how agents detected this issue..."
8. **Export Demo Data** - "Start your real project based on this demo project"

---

**END OF SPECIFICATION**
