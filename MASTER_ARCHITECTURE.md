# DEEP AGENT SYSTEM - MASTER ARCHITECTURE

**Version:** 2.0
**Last Updated:** January 26, 2026
**Status:** Production Ready
**Current Release:** Event-Driven Multi-Agent Intelligence Platform

> **THIS IS THE SINGLE SOURCE OF TRUTH**
> All other documentation is supplementary to this document.

---

## TABLE OF CONTENTS

### Main Documentation
1. [Business Case](#1-business-case)
2. [Business Architecture](#2-business-architecture)
3. [User Guide](#3-user-guide)
4. [Administrator Guide](#4-administrator-guide)
5. [Technical Architecture](#5-technical-architecture)

### Appendices
- [Appendix A: Deprecated Features](#appendix-a-deprecated-features)
- [Appendix B: Implementation History](#appendix-b-implementation-history)
- [Appendix C: Troubleshooting](#appendix-c-troubleshooting)
- [Appendix D: API Reference](#appendix-d-api-reference)

---

# 1. BUSINESS CASE

## 1.1 Executive Summary

The Deep Agent System is an **AI-powered project management intelligence platform** that automatically monitors portfolios, predicts risks, and facilitates collaboration across 10 specialized AI agents. Unlike traditional dashboards that require manual monitoring, our system **proactively identifies issues and recommends actions** before problems escalate.

### Key Value Proposition

**Traditional PMO:**
- ❌ Manual status report reviews (8-10 hours/week)
- ❌ Reactive problem detection (issues found after they occur)
- ❌ Siloed functional areas (Finance, Risk, Change Management don't talk)
- ❌ Inconsistent decision-making (different interpretations of same data)

**Deep Agent System:**
- ✅ Automated 24/7 monitoring (zero manual effort)
- ✅ Predictive problem detection (issues flagged 2-3 weeks early)
- ✅ Cross-functional collaboration (agents share intelligence automatically)
- ✅ Consistent, data-driven recommendations (same data = same advice)

## 1.2 Problem Statement

### The Portfolio Management Challenge

Organizations running 50-100+ concurrent projects face three critical challenges:

1. **Information Overload**
   - 100 projects × 10 status reports/month = 1,000 reports to review
   - Average PMO spends 40% of time just reading status updates
   - Critical issues buried in hundreds of pages of documentation

2. **Functional Silos**
   - FinOps team doesn't know what Risk team discovered
   - Change Management operates independently from Timeline Management
   - No systematic way to share insights across teams

3. **Reactive Management**
   - Issues detected after they become problems
   - Decisions made with incomplete information
   - No predictive analytics or early warning systems

### The Financial Impact

**Cost of Status Quo** (per year, for 100-project portfolio):
- PMO Staff Time: $480K/year (3 FTEs @ $160K reviewing reports)
- Delayed Projects: $2-3M/year (15% of projects delayed due to late detection)
- Rework & Overruns: $1-2M/year (10% budget overruns from missed risks)
- **Total Cost: $3.5-5.5M/year**

## 1.3 Solution Overview

### What Is the Deep Agent System?

The Deep Agent System is an **event-driven multi-agent platform** where 10 specialized AI agents continuously monitor portfolios, share intelligence, and collaboratively solve problems.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOW IT WORKS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CONTINUOUS MONITORING (24/7)                                │
│     └─ 10 agents scan all projects every 15 seconds            │
│                                                                 │
│  2. INTELLIGENT DETECTION                                       │
│     └─ Rules + AI identify issues before they escalate         │
│                                                                 │
│  3. COLLABORATIVE PROBLEM-SOLVING                               │
│     └─ Agents share facts and request input from each other    │
│                                                                 │
│  4. HUMAN-IN-THE-LOOP APPROVAL                                  │
│     └─ Critical actions require human approval via UI          │
│                                                                 │
│  5. AUTOMATED EXECUTION                                         │
│     └─ Approved actions executed automatically                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The 10 Specialized Agents

1. **DeepFinOps** - Financial performance, budget tracking, cost optimization
2. **DeepTMO** - Timeline management, schedule adherence, critical path
3. **DeepRisk** - Risk identification, mitigation tracking, exposure monitoring
4. **DeepVRO** - Value realization, benefits tracking, ROI monitoring
5. **DeepPMO** - Project health, delivery confidence, resource allocation
6. **DeepOCM** - Change adoption, stakeholder readiness, training effectiveness
7. **DeepGovernance** - Compliance monitoring, policy enforcement, stage-gate approval
8. **DeepPlanning** - Dependency management, capacity planning, roadmap conflicts
9. **DeepIntegratedMgmt** - Quality metrics, testing coverage, milestone health
10. **DeepOKRInference** - Strategic alignment, data quality, OKR confidence

## 1.4 Return on Investment

### Quantified Benefits (Annual, 100-Project Portfolio)

| Benefit Category | Annual Savings | How Achieved |
|-----------------|----------------|--------------|
| **Reduced Manual Effort** | $480K | PMO staff freed from manual report review (3 FTEs) |
| **Early Risk Detection** | $2M | 15% fewer delayed projects (issues caught 2-3 weeks earlier) |
| **Budget Overrun Prevention** | $1.5M | 10% reduction in cost overruns (predictive budget alerts) |
| **Improved Decision Quality** | $500K | Data-driven recommendations reduce bad decisions |
| **Cross-Functional Efficiency** | $300K | Agents share intelligence, eliminating duplicate work |
| **Total Annual Benefits** | **$4.78M** | |

**System Cost:**
- Development: $800K (one-time)
- Annual Operations: $120K (hosting, LLM API costs, maintenance)
- Total Year 1: $920K

**ROI Calculation:**
- Net Benefit Year 1: $4.78M - $920K = **$3.86M**
- ROI: **420%**
- Payback Period: **2.3 months**

### Strategic Benefits (Non-Quantified)

- **Predictive Intelligence**: Know about problems before they happen
- **Consistent Decision-Making**: Same data = same recommendations across all projects
- **Institutional Memory**: System learns from every project, every decision
- **Scalability**: Handles 1,000 projects as easily as 100 (no additional headcount)
- **Competitive Advantage**: Deliver projects 15% faster than industry average

## 1.5 Implementation Timeline

```
Month 1-2: Foundation
├─ Install system, integrate with existing PPM tools
├─ Configure 10 agents with default rules
└─ Train 5-10 pilot users

Month 3-4: Pilot Program
├─ Monitor 10-20 projects with agent assistance
├─ Refine rules based on feedback
└─ Measure baseline performance improvements

Month 5-6: Full Rollout
├─ Expand to entire portfolio (100+ projects)
├─ Train all PMO staff and functional teams
└─ Establish governance and approval workflows

Month 7+: Optimization
├─ Continuous learning from agent recommendations
├─ Add custom rules for organization-specific patterns
└─ Expand to additional use cases (resource planning, forecasting)
```

## 1.6 Success Criteria

### Measurable Outcomes (6-Month Target)

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| **Time Spent on Status Reviews** | 40 hours/week (PMO team) | 10 hours/week | Time tracking |
| **Average Lead Time for Issue Detection** | 14 days after issue | 3 days before issue | Issue timestamp analysis |
| **Project Delivery On-Time Rate** | 72% | 85% | Project completion tracking |
| **Budget Accuracy** | ±12% variance | ±5% variance | Final cost vs budget |
| **Stakeholder Satisfaction** | 7.2/10 | 8.5/10 | Quarterly surveys |

---

# 2. BUSINESS ARCHITECTURE

## 2.1 System Overview

The Deep Agent System operates as an **intelligent layer** on top of your existing project management tools (Jira, Monday.com, Smartsheet, etc.). It does NOT replace these tools—it **enhances** them with AI-powered monitoring and recommendations.

### Architecture Layers

```
┌────────────────────────────────────────────────────────────────┐
│         HUMAN USERS (PMO, Finance, Risk, Change Mgmt)          │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────────┐
│              PRESENTATION LAYER (Web UI)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Dashboards (Executive, PMO, FinOps, Risk, etc.)       │  │
│  │ • Rule Editors (configure agent behavior)               │  │
│  │ • Intervention Queue (approve/reject recommendations)   │  │
│  │ • Voice Briefings (podcast-style summaries)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────────┐
│                INTELLIGENCE LAYER (10 Deep Agents)              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │ │ FinOps   │  │   TMO    │  │   Risk   │  │   VRO    │ │   │
│  │ │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │ │   │
│  │ └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │   │
│  │      │             │             │             │        │   │
│  │      └─────────────┴─────────────┴─────────────┘        │   │
│  │                         │                                │   │
│  │                   A2A MESSAGE BUS                        │   │
│  │               (Agent-to-Agent Communication)             │   │
│  │                         │                                │   │
│  │      ┌─────────────────┴──────────────────┐             │   │
│  │ ┌────┴────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐ │   │
│  │ │  PMO    │  │   OCM    │  │Governance │  │Planning │ │   │
│  │ │ Agent   │  │  Agent   │  │  Agent    │  │ Agent   │ │   │
│  │ └─────────┘  └──────────┘  └───────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         SHARED MEMORY (Mem0 Fact Ledger)                │   │
│  │  • Agents broadcast facts they discover                 │   │
│  │  • Other agents observe and respond to facts            │   │
│  │  • 175K facts/day signal stream                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         RULES ENGINE (json-rules-engine)                │   │
│  │  • 200+ default rules (budget, schedule, risk)          │   │
│  │  • Custom rules (user-configurable via UI)              │   │
│  │  • 1-2ms evaluation time (deterministic, fast)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────────┐
│              INTEGRATION LAYER (MCP Protocol)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Jira Connector     • Monday.com Connector             │   │
│  │ • Smartsheet Connector • Planview Connector             │   │
│  │ • Excel/Google Sheets  • Custom REST APIs               │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────────┐
│             DATA LAYER (PostgreSQL + Knowledge Base)            │
│  • 48 database tables (projects, tasks, metrics, agents)       │
│  • Knowledge repository (SOPs, policies, templates)            │
│  • Vector embeddings (RAG for document retrieval)              │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Key Concepts

### Event-Driven Architecture

Unlike traditional polling systems, our agents operate on an **event-driven model**:

1. **Rules Trigger Events**
   - When CPI drops below 0.90 → Event: "Budget_Overrun_Warning"
   - When SPI drops below 0.85 → Event: "Schedule_Risk_Critical"

2. **Events Generate Facts**
   - FinOps Agent broadcasts: `project_XYZ:remainingBudget = $150K (confidence: 90%)`
   - TMO Agent broadcasts: `project_XYZ:scheduleRisk = HIGH (confidence: 87%)`

3. **Facts Trigger Collaboration**
   - Risk Agent observes both facts → Requests collaboration
   - A2A Message: "FinOps + TMO: Project XYZ needs joint mitigation plan"

4. **Collaboration Produces Recommendations**
   - Agents discuss options via A2A message bus
   - Final recommendation: "Defer Feature X, add 2 weeks, release $50K contingency"

5. **Human Approval**
   - Recommendation appears in Intervention Queue
   - PMO Lead approves/rejects
   - If approved → Automated execution

### Signal Volume: Why Event-Driven Matters

**Option A: Scan-Based Detection** (traditional)
- 10 agents × 100 projects × 1 scan/hour = 24K scans/day
- Issues found: ~50/day (0.2% hit rate)
- **Problem**: 99.8% of scans are wasted effort

**Option B: Event-Driven Detection** (our system)
- 100 projects × 50 rules × 10 evaluations/day = 50K rule checks/day
- Matches found: ~500/day (1% hit rate)
- Facts generated: 500 × 5 attributes = **2,500 facts/day**
- **Benefit**: 50× more intelligence, zero wasted scans

## 2.3 Collaboration Patterns

### Pattern 1: Cross-Functional Risk Identification

**Scenario**: Budget overrun + schedule delay + low change adoption

**Flow**:
```
1. FinOps Agent: "Project ABC is 15% over budget" (CPI = 0.85)
   └─ Broadcasts fact: project_abc:budget_variance = -15%

2. TMO Agent: "Project ABC is 3 weeks behind schedule" (SPI = 0.78)
   └─ Broadcasts fact: project_abc:schedule_variance = -3 weeks

3. OCM Agent: "Project ABC has 42% change adoption rate" (target: 80%)
   └─ Broadcasts fact: project_abc:change_adoption = 42%

4. Risk Agent (Observing All 3 Facts):
   └─ Pattern recognition: Budget + Schedule + Change = "Death Spiral"
   └─ Requests collaboration: "FinOps + TMO + OCM: Emergency intervention needed"

5. Collaborative Analysis:
   FinOps: "Root cause is 40% rework due to scope creep"
   TMO: "Rework adds 2 weeks to critical path"
   OCM: "Users not trained on new features = more rework"

6. Joint Recommendation:
   "Immediate Actions:
   - Freeze scope (no new features)
   - Deploy OCM training ASAP (reduce rework by 50%)
   - Reforecast: Add 2 weeks, $80K budget
   - Expected outcome: Project recovers in 4 weeks"

7. Human Decision:
   PMO Lead reviews → Approves
   System executes: Updates schedule, notifies stakeholders, triggers training
```

### Pattern 2: Predictive Problem Prevention

**Scenario**: Early warning of resource contention

**Flow**:
```
1. Planning Agent: Analyzes Q3 capacity
   └─ Detects: "Team A allocated 140% in August (40% overcommit)"

2. PMO Agent: Observes Planning Agent's fact
   └─ Cross-references: "Project XYZ depends on Team A in August"

3. Collaborative Mitigation (Before Crisis Occurs):
   Planning: "Team A overcommit in August"
   PMO: "Project XYZ critical path requires Team A"
   Risk: "Historical data: 140% allocation → 60% chance of 3-week delay"

4. Proactive Recommendation (Generated in June):
   "Action: Hire contractor for Team A in August
    Cost: $45K
    Benefit: Prevents $120K delay penalty on Project XYZ
    ROI: 2.7×"

5. Human Decision:
   CFO reviews → Approves contractor hire
   System executes: Creates requisition, notifies HR

6. Outcome:
   August arrives → Team A delivers on time
   Project XYZ completes on schedule
   No crisis, no firefighting, no delay penalty
```

## 2.4 Business Value by Role

### For PMO Leaders
- **Visibility**: Real-time portfolio health across all 100+ projects
- **Predictive Insights**: Know about problems 2-3 weeks before they occur
- **Resource Optimization**: Data-driven recommendations for resource allocation
- **Executive Reporting**: Automated weekly briefings (podcast-style voice summaries)

### For Finance Teams
- **Budget Accuracy**: ±5% forecast accuracy (vs ±12% industry average)
- **Early Warning**: Budget overruns detected 3 weeks earlier
- **ROI Tracking**: Automated benefits realization monitoring
- **Cost Optimization**: AI-powered recommendations for cost reduction

### For Risk Managers
- **Comprehensive Coverage**: All 100+ projects monitored 24/7
- **Pattern Recognition**: Identifies complex risk patterns humans miss
- **Mitigation Tracking**: Ensures risk responses are actually executed
- **Predictive Risk Scoring**: Machine learning predicts likelihood and impact

### For Change Management
- **Adoption Metrics**: Real-time stakeholder readiness tracking
- **Early Intervention**: Low adoption rates flagged before go-live
- **Training Effectiveness**: Data-driven insights on what training works
- **Sentiment Analysis**: Automated analysis of stakeholder feedback

## 2.5 Integration Ecosystem

The Deep Agent System integrates with your existing tools:

| Category | Supported Tools | What's Synced |
|----------|----------------|---------------|
| **PPM Tools** | Jira, Monday.com, Smartsheet, Planview, Workfront | Projects, tasks, schedules, budgets, resources |
| **Financial Systems** | SAP, Oracle Financials, NetSuite, QuickBooks | Actuals, forecasts, invoices, purchase orders |
| **HR Systems** | Workday, SAP SuccessFactors, ADP | Resource availability, skills, capacity |
| **Document Repos** | SharePoint, Google Drive, Confluence, Notion | SOPs, policies, templates, RCAs |
| **Communication** | Slack, Microsoft Teams, Email | Notifications, alerts, approvals |
| **BI Tools** | Tableau, Power BI, Looker | Custom dashboards, executive reports |

**Integration Method**: Model Context Protocol (MCP)
- Secure, API-based connectivity
- No data duplication (real-time sync)
- Bidirectional updates (agents can write back)

---

# 3. USER GUIDE

## 3.1 Getting Started

### Accessing the System

**Web Interface**: `https://your-company.deepagents.io`

**Workspaces**: Role-based landing pages
- Executive Workspace (`/workspace/executive`)
- PMO Workspace (`/workspace/pm`)
- FinOps Workspace (`/workspace/finops`)
- Risk Workspace (`/workspace/risk`)
- And 6 more...

### First Login

1. Navigate to your company's Deep Agent URL
2. Log in with your corporate credentials (SSO supported)
3. You'll land in your default workspace based on your role
4. Complete the guided tour (5 minutes) to learn key features

## 3.2 Daily Workflow

### Morning Ritual (5 minutes)

**Step 1: Check Interventions**
```
Navigate to: Intervention Queue
Location: Header → Bell Icon → "View All Interventions"

What you see:
- Critical interventions (red badge): Require immediate action
- High-priority interventions (orange): Review today
- Medium-priority (yellow): Review this week

Actions:
- Click intervention → View details → Approve/Reject/Defer
```

**Step 2: Listen to Voice Briefing**
```
Navigate to: Voice Briefings
Location: Sidebar → "Voice Briefings"

What you get:
- 3-5 minute podcast-style summary
- Two AI hosts (Sarah & Marcus) discuss:
  * Top 3 portfolio risks
  * Budget/schedule status
  * Upcoming decisions requiring your input

Listen while commuting, exercising, or making coffee
```

**Step 3: Review Project Health**
```
Navigate to: Your Workspace Dashboard
Location: Sidebar → "Dashboard"

What you see:
- Traffic light indicators (Green/Yellow/Red) for each project
- Key metrics: CPI, SPI, Risk Score, Change Adoption
- Trending: Improving ↗️ or Declining ↘️

Actions:
- Click any red/yellow project → Drill into details
- View agent recommendations for that project
```

### Weekly Ritual (30 minutes)

**Monday Morning: Weekly Planning**
```
1. Review Last Week's Performance
   - Dashboard → "Last 7 Days" filter
   - Compare forecast vs actuals
   - Identify surprises (good or bad)

2. Review This Week's Risks
   - Risk Dashboard → "Next 7 Days" view
   - Prioritize top 5 risks requiring mitigation

3. Set Week's Focus
   - Mark 3-5 projects as "Watch Closely"
   - Agents will provide daily updates on these projects
```

**Friday Afternoon: Week Close**
```
1. Review Week's Interventions
   - How many approved/rejected?
   - Were agent recommendations accurate?
   - Provide feedback (thumbs up/down)

2. Generate Executive Report
   - Reports → "Weekly Executive Summary"
   - System auto-generates PowerPoint
   - Review and customize if needed

3. Prep for Monday
   - Check Monday's scheduled gate reviews
   - Ensure decision-makers have necessary data
```

## 3.3 Common Tasks

### Task 1: Approve a Budget Increase

**Scenario**: FinOps Agent recommends $50K budget increase for Project ABC

**Steps**:
```
1. Notification arrives: "FinOps Agent: Budget increase required for Project ABC"

2. Click notification → Opens intervention details
   You see:
   - Current Budget: $500K
   - Actual Spend to Date: $450K
   - Forecast at Completion: $550K
   - Recommended Increase: $50K
   - Rationale: "Scope change approved in Sprint 12 added 3 features..."
   - Impact if Denied: "Project will overrun $50K anyway, but team morale suffers"

3. Review supporting evidence:
   - Click "View Details" → See full FinOps analysis
   - Click "View Project History" → See all prior budget changes
   - Click "Compare to Similar Projects" → Benchmarking data

4. Make decision:
   Option A: Approve
   - Click "Approve" button
   - System updates budget in PPM tool
   - Notifies project team and stakeholders

   Option B: Reject
   - Click "Reject" button
   - Provide reason: "Budget is frozen per Q3 directive"
   - System notifies project team
   - FinOps Agent marks project as "Budget constrained" (factors into future recommendations)

   Option C: Defer
   - Click "Defer" button
   - Select deferral period: "Review next week after board meeting"
   - System reminds you next Monday

5. Done! (Total time: 2 minutes)
```

### Task 2: Investigate a Schedule Delay

**Scenario**: TMO Agent flags Project XYZ as 2 weeks behind schedule

**Steps**:
```
1. Navigate to: TMO Dashboard
   Sidebar → "Workspaces" → "Timeline Management"

2. Locate Project XYZ in "At Risk" section
   Click project name → Opens project detail view

3. Review TMO Agent's Analysis:
   - Critical Path Items Delayed: 3 tasks (lists them)
   - Root Cause: "Dependency on Team B (Team B is at 140% capacity)"
   - Historical Pattern: "This is 3rd delay due to Team B bottleneck"
   - Forecast: "Without intervention, project will be 4 weeks late by end of Q3"

4. View Recommendations:
   The system suggests 3 options:

   Option A: "Hire contractor for Team B ($40K)"
   - Pros: Fastest resolution (2 weeks back on track)
   - Cons: Costs $40K
   - ROI: Avoids $80K late delivery penalty (2× return)

   Option B: "Descope Feature X (low priority)"
   - Pros: No cost, removes dependency on Team B
   - Cons: Business value reduced by 15%
   - Impact: Stakeholder satisfaction drops from 8.5 to 7.8

   Option C: "Delay go-live by 2 weeks"
   - Pros: No budget impact, delivers full scope
   - Cons: Revenue delayed by $120K
   - Impact: Misses Q3 OKR deadline

5. Request Collaboration (Optional):
   Click "Request Multi-Agent Analysis"
   - TMO + FinOps + PMO will collaborate to find best option
   - Wait 5 minutes → Receive joint recommendation

6. Make Decision:
   Based on analysis, select Option A: Hire contractor
   - Click "Approve Option A"
   - System creates contractor requisition
   - HR notified, hiring process starts

7. Done! (Total time: 10 minutes)
```

### Task 3: Configure a Custom Rule

**Scenario**: You want FinOps Agent to alert you if ANY project's CPI drops below 0.92 (not just 0.90)

**Steps**:
```
1. Navigate to: Rule Editor
   Sidebar → "Admin" → "Agent Rules" → "FinOps Rules"

2. Find existing rule: "Budget Overrun - Critical"
   - Current threshold: CPI < 0.90
   - Action: "Trigger critical alert + request collaboration"

3. Click "Edit Rule"
   Rule Editor opens with visual designer:

   ┌─────────────────────────────────────────┐
   │ IF   [CPI] [is less than] [0.90]       │
   │ THEN [Trigger Alert] [Critical]        │
   │ AND  [Notify] [FinOps Lead, PMO Lead]  │
   │ AND  [Request Collaboration] [Risk Agent] │
   └─────────────────────────────────────────┘

4. Modify threshold:
   Change [0.90] → [0.92]

5. Add custom action:
   Click "+ Add Action"
   Select "Send Email" → Enter your email
   Select "Attach Document" → Choose "Budget Recovery Template"

6. Test rule (Optional):
   Click "Test on Project XYZ" (select a project with CPI = 0.91)
   System shows: "✅ Rule would trigger (CPI 0.91 < 0.92)"
   Preview: See what alert would look like

7. Save rule:
   Click "Save & Activate"
   System confirms: "Rule updated. Will apply to all future scans."

8. Done! (Total time: 5 minutes)
```

### Task 4: Generate an Executive Report

**Scenario**: Board meeting on Friday, need portfolio status report

**Steps**:
```
1. Navigate to: Reports
   Sidebar → "Reports" → "Executive Summary"

2. Configure report:
   - Time Period: "Last 30 Days"
   - Projects: "All" or "Select Portfolio"
   - Include: ☑️ Budget Status ☑️ Schedule Status ☑️ Top Risks ☑️ Upcoming Decisions

3. Choose format:
   - PowerPoint (recommended for board meetings)
   - PDF (for email distribution)
   - Voice Briefing (audio podcast)

4. Click "Generate Report"
   System takes 30 seconds, then shows preview:
   - Executive Summary (1 slide)
   - Portfolio Health (1 slide with traffic lights)
   - Budget Performance (1 slide with charts)
   - Schedule Performance (1 slide)
   - Top 5 Risks (1 slide)
   - Upcoming Decisions (1 slide)
   - Total: 6 slides

5. Customize (Optional):
   - Click any slide → Edit text, add notes
   - Drag/drop to reorder slides
   - Click "Add Slide" → Insert custom content

6. Export:
   Click "Download PowerPoint"
   File downloads: "Portfolio_Status_2026-01-26.pptx"

7. Done! (Total time: 3 minutes for a report that used to take 4 hours)
```

## 3.4 Advanced Features

### Voice Briefings

**What**: Podcast-style audio summaries narrated by two AI hosts

**How to Use**:
```
1. Navigate to: Admin → Voice Briefings
2. Select briefing type:
   - Project Summary (specific project)
   - Portfolio Overview (all projects)
   - Weekly Summary (last 7 days highlights)
3. Click "Generate Briefing"
4. Wait 30-60 seconds
5. Click "Play" or "Download MP3"
```

**Best For**:
- Commute time (listen in car/train)
- Executive updates (send link to busy executives)
- Team standups (play during morning meeting)

### Agent Memory Viewer

**What**: See what each agent "knows" and "remembers"

**How to Use**:
```
1. Navigate to: Admin → Agent Memory
2. Select agent: e.g., "FinOps Agent"
3. View three memory types:

   a) Mem0 Facts (Shared Knowledge)
      - "project_abc:cpi = 0.88 (observed yesterday)"
      - "project_xyz:budget_variance = -$45K (updated hourly)"

   b) Letta Core Memory (Agent's "Brain")
      - Persona: "I am a financial analyst focused on ROI and cost optimization"
      - Policies: "Always recommend contractor hire if ROI > 2×"

   c) Letta Archival Memory (Long-term Learning)
      - "Project ABC recovered after scope freeze (learned: scope control works)"
      - "Project XYZ failed despite budget increase (learned: money doesn't fix bad planning)"

4. Search: "Why did you recommend hiring a contractor for Project ABC?"
   Agent responds: "Because historical data shows 2.7× ROI, and my policy is to recommend when ROI > 2×"
```

### Policy-as-Code

**What**: Upload company policies, agents extract rules automatically

**How to Use**:
```
1. Navigate to: Admin → Policy as Code
2. Upload document: e.g., "Financial Management Policy v3.2.pdf"
3. System extracts rules using LLM:
   - "All projects >$500K require CFO approval for budget changes"
   - "Budget variances >10% must be reported to board within 5 days"
   - "No budget increases in Q4 without CEO approval"
4. Review extracted rules (Human-in-the-Loop):
   - ✅ Approve correct rules
   - ❌ Reject incorrect rules
   - ✏️ Edit rules that need tweaking
5. Activate rules:
   - Click "Activate All Approved Rules"
   - System adds rules to FinOps Agent's rule set
   - FinOps Agent enforces rules automatically
```

---

# 4. ADMINISTRATOR GUIDE

## 4.1 System Configuration

### Initial Setup

**Prerequisites**:
- PostgreSQL 14+ database
- Node.js 20+ runtime
- 4GB RAM, 2 CPU cores minimum
- HTTPS domain (for production)

**Installation Steps**:
```bash
# 1. Clone repository
git clone https://github.com/your-org/deep-agent-system
cd deep-agent-system

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Required settings:
DATABASE_URL=postgresql://user:pass@localhost:5432/deepagents
ANTHROPIC_API_KEY=sk-ant-...  # For Claude LLM
OPENAI_API_KEY=sk-...          # For voice briefings (optional)

# 4. Initialize database
npm run db:push
npm run seed              # Load default rules

# 5. Start server
npm run build
npm start                 # Production
# OR
npm run dev               # Development

# 6. Verify
curl http://localhost:5000/health
# Should return: {"status":"healthy"}
```

### Agent Configuration

**Enabling/Disabling Agents**:
```
Navigate to: Admin → Agent Configuration

For each agent:
- Toggle "Enabled" switch
- Set scan frequency (default: every 15 seconds)
- Set autonomy level:
  * Supervised: Requires human approval for all actions
  * Full Autonomy: Can execute approved action types without approval

Example:
- FinOps Agent: Supervised (budget changes always require approval)
- Risk Agent: Full Autonomy (can update risk registers automatically)
```

**Agent Thresholds**:
```
Navigate to: Admin → Agent Rules → [Agent Name]

Default thresholds (examples):
- FinOps: CPI < 0.90 (critical), CPI < 0.95 (warning)
- TMO: SPI < 0.85 (critical), SPI < 0.92 (warning)
- Risk: Risk Score > 8 (critical), Risk Score > 6 (warning)

To customize:
1. Find rule: e.g., "Budget Overrun - Critical"
2. Click "Edit"
3. Change threshold: 0.90 → 0.92
4. Save
```

## 4.2 User Management

### Adding Users

```
Navigate to: Admin → Users → "+ Add User"

Fields:
- Email: user@company.com
- Role: Executive | PMO Lead | FinOps | Risk | Viewer
- Default Workspace: (auto-set based on role)
- Permissions:
  ☑️ View Projects
  ☑️ Approve Interventions (if PMO Lead or higher)
  ☐ Configure Rules (admin only)
  ☐ Manage Users (admin only)

Click "Send Invitation"
→ User receives email with login link
```

### Role-Based Access Control

| Role | Can View | Can Approve | Can Configure | Can Manage Users |
|------|----------|-------------|---------------|------------------|
| **Executive** | All projects | Critical only | No | No |
| **PMO Lead** | All projects | All interventions | Project rules | No |
| **FinOps** | Budget data | Budget interventions | FinOps rules | No |
| **Risk Manager** | Risk data | Risk interventions | Risk rules | No |
| **Viewer** | Assigned projects only | No | No | No |
| **Admin** | Everything | Everything | Everything | Yes |

## 4.3 Integration Setup

### Connecting a PPM Tool (Example: Jira)

```
Navigate to: Admin → Integrations → "+ Add Integration"

1. Select integration type: "Jira Cloud"

2. Enter credentials:
   - Jira URL: https://your-company.atlassian.net
   - API Token: (generate from Jira settings)
   - Email: your-email@company.com

3. Test connection:
   Click "Test" → Should show "✅ Connected successfully"

4. Configure sync:
   - Sync Frequency: Every 5 minutes (recommended)
   - Sync Direction: "Bidirectional" (agents can update Jira)
   - Fields to Sync:
     ☑️ Projects
     ☑️ Tasks
     ☑️ Status
     ☑️ Due Dates
     ☑️ Budgets (if Jira has budget field)
     ☐ Comments (optional, high volume)

5. Initial Sync:
   Click "Start Initial Sync"
   - System imports all Jira data (takes 10-30 minutes for 1000+ projects)
   - Progress bar shows completion

6. Verify:
   Navigate to: Dashboard
   - You should see all your Jira projects listed
   - Check a few projects to ensure data is accurate

7. Done!
```

### Supported Integrations

| Tool | Type | Setup Complexity | Sync Speed |
|------|------|------------------|------------|
| **Jira** | PPM | Easy (API token) | 5 min intervals |
| **Monday.com** | PPM | Easy (API key) | 5 min intervals |
| **Smartsheet** | PPM | Easy (OAuth) | 10 min intervals |
| **Planview** | PPM | Medium (On-prem setup) | 15 min intervals |
| **SAP** | Finance | Complex (consultant recommended) | 1 hour intervals |
| **Excel/Google Sheets** | Data Source | Easy (file upload or API) | Manual or scheduled |
| **Slack** | Notifications | Easy (OAuth) | Real-time |
| **Microsoft Teams** | Notifications | Easy (OAuth) | Real-time |

## 4.4 Monitoring & Maintenance

### Health Checks

**System Health Dashboard**:
```
Navigate to: Admin → System Health

Monitors:
- ✅ Database Connection: OK (response time: 12ms)
- ✅ Agent Scheduler: Running (10 agents active)
- ✅ Memory System: OK (Mem0: 12,453 facts, Letta: 10 agent memories)
- ✅ Rule Engine: OK (200 rules loaded, 0 errors)
- ✅ Integrations: OK (Jira: connected, Slack: connected)
- ⚠️ LLM API: Degraded (OpenAI API slow, using fallback)

Alerts:
- If any component shows "❌ Down" → Investigate immediately
- If "⚠️ Degraded" → Monitor, may auto-recover
```

### Performance Metrics

```
Navigate to: Admin → System Metrics

Key Metrics:
- Interventions per Day: 12 (average)
- Agent Response Time: 2.3 seconds (average)
- Rule Evaluation Time: 1.8ms (average)
- Database Queries per Second: 45
- Memory Usage: 62% (of 4GB allocated)
- CPU Usage: 28% (of 2 cores)

Red Flags:
- Agent Response Time > 10 seconds → LLM API issues or database slow
- Rule Evaluation Time > 10ms → Rule engine overloaded (too many rules)
- Memory Usage > 90% → Need more RAM or memory leak
- CPU Usage > 80% → Need more CPU or inefficient queries
```

### Log Management

**Accessing Logs**:
```
# View logs in browser
Navigate to: Admin → Logs

# View logs via command line
tail -f logs/application-*.log  # General logs
tail -f logs/error-*.log        # Errors only
tail -f logs/agent-*.log        # Agent-specific logs
```

**Log Retention**:
- General logs: 14 days
- Error logs: 30 days
- Agent activity logs: 90 days (in database)
- Rule execution history: 365 days (in database)

### Backup & Recovery

**Automated Backups**:
```
Database: Automated daily backups at 2 AM
- Retention: 30 days
- Location: /backups/postgres/
- Restore command:
  pg_restore -d deepagents /backups/postgres/2026-01-26.backup
```

**Manual Backup**:
```bash
# Backup database
npm run db:backup

# Backup configuration
npm run config:export > config-backup-2026-01-26.json

# Backup knowledge base documents
tar -czf kb-backup-2026-01-26.tar.gz /var/lib/knowledge-base/
```

**Disaster Recovery**:
```
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 24 hours (last backup)

Recovery Steps:
1. Provision new server
2. Install Deep Agent System (npm install)
3. Restore database from latest backup
4. Restore configuration from backup
5. Restart services (npm start)
6. Verify health checks (all green)
7. Notify users system is back online
```

## 4.5 Troubleshooting Common Issues

### Issue 1: Agents Not Generating Interventions

**Symptoms**: Dashboard shows no new interventions despite project issues

**Diagnosis**:
```
1. Check agent status:
   Admin → System Health → Agents
   - Are all agents "Running"?
   - If "Stopped", click "Start Agent"

2. Check rule execution:
   Admin → Rule Execution History
   - Are rules being evaluated? (should see new entries every minute)
   - If no recent entries → Rule engine not running

3. Check data sync:
   Admin → Integrations → [Your PPM Tool]
   - When was last sync? (should be within 5-10 minutes)
   - If stale → Click "Force Sync Now"

4. Check thresholds:
   Admin → Agent Rules → FinOps Rules
   - Is CPI < 0.90 threshold too strict?
   - Try temporarily setting to CPI < 0.95 to test
```

**Resolution**:
```
Most common cause: Data not syncing from PPM tool

Fix:
1. Admin → Integrations → [PPM Tool] → "Test Connection"
2. If fails → Re-enter API credentials
3. Click "Force Full Sync"
4. Wait 5-10 minutes
5. Check Dashboard → Should now see projects/interventions
```

### Issue 2: Slow Agent Response Times

**Symptoms**: Clicking an intervention takes 10+ seconds to load

**Diagnosis**:
```
1. Check system metrics:
   Admin → System Metrics
   - CPU usage > 80%? → Need more CPU
   - Memory usage > 90%? → Need more RAM
   - Database queries > 100/second? → Database overloaded

2. Check LLM API:
   Admin → System Health → LLM API
   - Status: "⚠️ Degraded" or "❌ Down"? → Claude/OpenAI API issues

3. Check database performance:
   tail -f logs/application-*.log | grep "query took"
   - Queries taking > 1000ms? → Missing database indexes
```

**Resolution**:
```
Quick fix (temporary):
1. Restart agents: Admin → Agents → "Restart All"
2. Clear cache: Admin → System → "Clear Cache"

Permanent fix (if performance consistently slow):
1. Add more resources:
   - CPU: 2 cores → 4 cores
   - RAM: 4GB → 8GB
2. Optimize database:
   - Run: npm run db:optimize
   - Adds missing indexes
3. Enable caching:
   - Set REDIS_URL in .env
   - Caches expensive queries
```

### Issue 3: Wrong Agent Recommendations

**Symptoms**: Agent recommends action that doesn't make sense

**Diagnosis**:
```
1. Review agent's reasoning:
   Click intervention → "View Agent Analysis"
   - Read full explanation
   - Click "View Facts Used" → See what data agent based decision on

2. Check source data:
   - Is CPI actually 0.85, or is it wrong in source system?
   - Navigate to project in Jira/PPM tool
   - Verify numbers match

3. Check rule logic:
   Admin → Agent Rules → [Rule that triggered]
   - Read rule conditions
   - Does rule make sense? Or is threshold wrong?
```

**Resolution**:
```
If agent is wrong due to bad data:
1. Fix data in source system (Jira, etc.)
2. Admin → Integrations → "Force Sync Now"
3. Intervention should disappear (or update)

If agent is wrong due to bad rule:
1. Admin → Agent Rules → [Rule]
2. Edit rule:
   - Adjust threshold
   - Add additional conditions
   - Change action (e.g., "Warning" instead of "Critical")
3. Save rule
4. Future recommendations will use updated logic

Provide feedback:
1. Click intervention → "This recommendation was: 👍 Helpful / 👎 Not helpful"
2. System learns over time (future recommendations improve)
```

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 System Components

### Technology Stack

```
Frontend:
- React 19 (UI framework)
- TypeScript 5.6 (type safety)
- TanStack Query (data fetching/caching)
- Tailwind CSS 4 (styling)
- Wouter (routing)
- Framer Motion (animations)

Backend:
- Node.js 20 (runtime)
- Express 4 (web framework)
- TypeScript 5.6 (type safety)
- Drizzle ORM (database access)
- PostgreSQL 14+ (database)

AI/ML:
- Claude Sonnet 4.5 (primary LLM via Anthropic API)
- LangChain 0.3 (agent framework)
- json-rules-engine 7.3 (rules evaluation)
- OpenAI TTS (voice briefings, optional)

Infrastructure:
- PM2 (process management)
- Winston (logging with rotation)
- WebSockets (real-time notifications)
```

### Database Schema (48 Tables)

**Core Tables**:
```
projects
├─ id, name, status, budget, actual_cost, cpi, spi
├─ start_date, end_date, owner_id, portfolio_id
└─ created_at, updated_at

tasks
├─ id, project_id, title, status, priority
├─ start_date, due_date, duration, progress
├─ assigned_to, predecessor_ids
└─ created_at, updated_at

agent_facts (Mem0)
├─ id, entity, attribute, value, source_agent
├─ confidence, supersedes, created_at
└─ INDEX on (entity, attribute) for fast lookups

agent_core_memory (Letta)
├─ id, agent_id, persona, human_context
└─ updated_at

agent_archival_memory (Letta)
├─ id, agent_id, memory_key, content
├─ embedding (vector), has_embedding
└─ created_at

agent_collaboration_rules
├─ id, name, description, enabled, priority
├─ condition_logic (JSONB)
├─ action_config (JSONB)
├─ execution_count, last_executed
└─ created_at, updated_at

interventions
├─ id, project_id, agent_id, type, severity
├─ description, recommendation, confidence
├─ status (pending/approved/rejected), approved_by
└─ created_at, resolved_at

enhanced_knowledge_base
├─ id, title, category, document_type
├─ content (full text), embedding (vector)
├─ relevant_agents, tags
└─ created_at, updated_at
```

## 5.2 Agent Architecture

### Deep Agent Base Class

All 10 agents extend `DeepAgentBase`:

```typescript
class DeepAgentBase {
  // Core capabilities
  protected config: DeepAgentConfig;
  protected storage: IStorage;
  protected llm: ChatAnthropic;  // Claude Sonnet 4.5
  protected mem0: Mem0Service;    // Shared fact ledger
  protected letta: LettaAgentMemory;  // Per-agent memory

  // Agent lifecycle
  async initialize(): Promise<void>;
  async scan(project: Project): Promise<Finding[]>;
  async plan(findings: Finding[]): Promise<Plan>;
  async reflect(outcome: Outcome): Promise<Learnings>;
  async execute(plan: Plan): Promise<Outcome>;

  // Memory operations
  async broadcastFact(entity: string, attribute: string, value: any): Promise<void>;
  async observeFacts(pattern: string): Promise<Fact[]>;
  async remember(key: string, value: string): Promise<void>;
  async recall(query: string): Promise<string[]>;

  // Collaboration
  async requestCollaboration(agents: string[], context: Context): Promise<Response>;
  async respondToRequest(request: Request): Promise<Response>;

  // Tools (LangChain DynamicStructuredTool)
  protected defineTools(): DynamicStructuredTool[];
}
```

### Agent Scan Cycle

```
Every 15 seconds (configurable):

1. ContinuousOrchestrator selects agent (round-robin)
2. Agent.scan(projects[]) is called
3. Agent evaluates rules for each project:
   - Get project metrics from database
   - Evaluate 20-30 rules via json-rules-engine
   - Rules that match → Trigger events
4. Events generate facts:
   - Agent.broadcastFact() writes to agent_facts table
   - Other agents observe facts via subscriptions
5. Facts trigger collaboration:
   - If multiple agents flag same project → A2A collaboration request
   - Agents exchange messages via A2A bus
   - Joint recommendation produced
6. Recommendation becomes intervention:
   - Saved to interventions table
   - User notified via WebSocket
   - Appears in Intervention Queue

Total cycle time: 100-300ms per agent per project
```

## 5.3 Event-Driven Fact Broadcasting

### Implementation (Option 1 Architecture)

```typescript
// In ContinuousOrchestrator.ts, detectIssue() method

async detectIssue(agent: DeepAgentBase, project: Project): Promise<Issue | null> {
  const rules = agent.getRules();  // e.g., 30 rules for FinOps

  for (const rule of rules) {
    const metrics = this.getProjectMetrics(project);  // CPI, SPI, Risk Score, etc.
    const result = await this.rulesEngine.evaluate(rule, metrics);

    if (result.matches) {
      // ✅ RULE TRIGGERED → BROADCAST FACTS IMMEDIATELY
      if (typeof agent.broadcastFact === 'function') {
        for (const condition of rule.conditions) {
          const metricValue = metrics[condition.attribute];
          await agent.broadcastFact(
            `project_${project.id}`,
            condition.attribute,
            metricValue,
            0.90  // confidence
          );
        }
      }

      return {
        description: rule.description,
        severity: rule.severity,
        action: rule.action,
      };
    }
  }

  return null;
}
```

### Signal Volume Calculation

```
Assumptions:
- 100 projects in portfolio
- 10 agents × 25 rules each = 250 total rules
- Orchestration cycle every 15 seconds
- Each agent scans 3 projects per cycle (round-robin)

Calculations:
1. Rule evaluations per day:
   10 agents × 3 projects × 25 rules × (86400/15) = 4,320,000 rule evals/day

2. Rule matches per day (1% match rate):
   4,320,000 × 0.01 = 43,200 matches/day

3. Facts generated per day (4 attributes per match):
   43,200 × 4 = 172,800 facts/day ≈ 175K facts/day

4. Facts per minute:
   175,000 / 1440 = 121 facts/minute ≈ 2 facts/second

This 175K facts/day creates a rich signal stream that enables:
- Real-time cross-agent correlation
- Pattern detection (e.g., "budget + schedule + change adoption problems")
- Predictive trending (CPI declining 3 days in a row)
- Collaborative decision-making
```

## 5.4 Memory Architecture

### Mem0: Shared Fact Ledger

**Purpose**: Agent-to-agent knowledge sharing

**Data Model**:
```typescript
interface Fact {
  id: number;
  entity: string;           // e.g., "project_abc"
  attribute: string;        // e.g., "cpi"
  value: any;               // e.g., 0.85
  sourceAgent: string;      // e.g., "deepfinops"
  confidence: number;       // 0.0 - 1.0
  supersedes: number | null; // ID of fact this replaces
  createdAt: Date;
}
```

**Operations**:
```typescript
// Write a fact
await mem0.writeFact({
  entity: 'project_abc',
  attribute: 'cpi',
  value: 0.85,
  sourceAgent: 'deepfinops',
  confidence: 0.95
});

// Read facts (by entity)
const facts = await mem0.readFacts('project_abc');
// Returns: [{attribute: 'cpi', value: 0.85, sourceAgent: 'deepfinops', ...}, ...]

// Subscribe to fact pattern
mem0.subscribe('project_*:schedule_risk', (fact) => {
  console.log(`Schedule risk detected: ${fact.entity} = ${fact.value}`);
});
```

### Letta: Per-Agent Memory

**Purpose**: Agent's private "brain" for learning and remembering

**Data Model**:
```typescript
interface CoreMemory {
  id: number;
  agentId: string;
  persona: string;        // Agent's identity and role
  humanContext: string;   // What agent knows about users
  updatedAt: Date;
}

interface ArchivalMemory {
  id: number;
  agentId: string;
  memoryKey: string;      // e.g., "project_abc_recovery_2024"
  content: string;        // Full text of memory
  embedding: number[];    // Vector embedding for search
  createdAt: Date;
}
```

**Operations**:
```typescript
// Update core memory (agent editing its own "brain")
await letta.updateCoreMemory({
  persona: "I am FinOps Agent. I prioritize ROI and data-driven cost optimization.",
  humanContext: "User prefers contractor hires over project delays."
});

// Archive a long-term memory
await letta.archiveContext(
  'project_abc_recovery_2024',
  'Project ABC was recovered by freezing scope and hiring contractor. ROI was 2.7×.'
);

// Recall memories
const memories = await letta.recall('successful project recoveries');
// Returns: ["Project ABC recovery via scope freeze...", "Project XYZ recovery via..."]
```

## 5.5 Rules Engine

### json-rules-engine Integration

**Why json-rules-engine?**
- ✅ Deterministic: Same inputs = same outputs (vs LLM non-determinism)
- ✅ Fast: 1-2ms per rule evaluation (vs 2-5s for LLM)
- ✅ Auditable: Clear explanation of why rule triggered
- ✅ User-configurable: Business users can edit rules without code changes
- ✅ Version-controlled: Rule changes tracked in database

**Rule Format**:
```typescript
interface CollaborationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;

  conditionLogic: {
    any?: Array<{
      fact: string;      // e.g., "cpi"
      operator: string;  // e.g., "lessThan"
      value: number;     // e.g., 0.90
    }>;
    all?: Array<...>;    // All conditions must match
  };

  actionConfig: {
    type: string;        // e.g., "trigger_collaboration"
    agents: string[];    // e.g., ["finops", "risk"]
    severity: string;    // e.g., "critical"
    message: string;     // e.g., "Budget overrun detected"
  };
}
```

**Example Rule**:
```json
{
  "name": "Critical Budget Overrun",
  "conditionLogic": {
    "any": [
      {
        "fact": "cpi",
        "operator": "lessThan",
        "value": 0.90
      }
    ]
  },
  "actionConfig": {
    "type": "trigger_collaboration",
    "agents": ["finops", "risk", "pmo"],
    "severity": "critical",
    "message": "Project is 10%+ over budget (CPI < 0.90). Immediate intervention required."
  }
}
```

**Rule Evaluation Process**:
```typescript
// In AgentCollaborationRulesEngine.ts

async evaluate(project: Project): Promise<TriggeredRule[]> {
  const rules = await this.getRules({ enabled: true });
  const facts = this.extractFacts(project);  // CPI, SPI, Risk Score, etc.

  const triggered: TriggeredRule[] = [];

  for (const rule of rules) {
    const engine = new Engine();
    engine.addRule({
      conditions: rule.conditionLogic,
      event: { type: 'rule_triggered', params: rule.actionConfig }
    });

    const result = await engine.run(facts);

    if (result.events.length > 0) {
      triggered.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.actionConfig.severity,
        action: rule.actionConfig.message,
        agents: rule.actionConfig.agents
      });

      // Log execution for audit trail
      await this.storage.logRuleExecution({
        ruleId: rule.id,
        projectId: project.id,
        matched: true,
        facts: facts,
        timestamp: new Date()
      });
    }
  }

  return triggered;
}
```

## 5.6 API Endpoints

### Core Endpoints

```
GET  /api/projects                      # List all projects
GET  /api/projects/:id                  # Get project details
PUT  /api/projects/:id                  # Update project

GET  /api/interventions                 # List all interventions
GET  /api/interventions/:id             # Get intervention details
PUT  /api/interventions/:id/approve     # Approve intervention
PUT  /api/interventions/:id/reject      # Reject intervention

GET  /api/deep-agents                   # List all 10 agents
GET  /api/deep-agents/:id               # Get agent details
POST /api/deep-agents/:id/run           # Manually trigger agent scan

GET  /api/agent-rules                   # List all rules
POST /api/agent-rules                   # Create new rule
PUT  /api/agent-rules/:id               # Update rule
DELETE /api/agent-rules/:id             # Delete rule

GET  /api/admin/agent-memory/facts      # View Mem0 facts
GET  /api/admin/agent-memory/letta/:id  # View Letta memory for agent

GET  /api/health                        # System health check
GET  /api/health/agents                 # Agent health check
GET  /api/health/metrics                # Performance metrics
```

### Authentication

```typescript
// JWT-based authentication
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, user: User }

// All API requests require Authorization header:
Authorization: Bearer <jwt_token>

// Or Firebase authentication (if enabled):
Authorization: Firebase <firebase_id_token>
```

## 5.7 Deployment Architecture

### Production Deployment (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER (Nginx)                        │
│                  HTTPS termination, gzip, caching                │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────┴────────┐ ┌────┴────────┐ ┌────┴────────┐
│  Node.js       │ │  Node.js    │ │  Node.js    │
│  Instance 1    │ │  Instance 2 │ │  Instance 3 │
│  (PM2 managed) │ │  (PM2)      │ │  (PM2)      │
└───────┬────────┘ └────┬────────┘ └────┬────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
┌───────┴────────┐          ┌───────────┴─────────┐
│  PostgreSQL    │          │   Redis             │
│  Primary       │◄────────►│   Cache             │
└───────┬────────┘          └─────────────────────┘
        │
┌───────┴────────┐
│  PostgreSQL    │
│  Replica       │
│  (Read-only)   │
└────────────────┘
```

**Infrastructure Requirements**:
- **Load Balancer**: Nginx or AWS ALB
- **App Servers**: 3× servers (2 vCPU, 8GB RAM each)
- **Database**: PostgreSQL 14+ (4 vCPU, 16GB RAM, 500GB SSD)
- **Cache**: Redis 7+ (2GB RAM)
- **Storage**: S3 or equivalent (for document uploads)

**Deployment Steps**:
```bash
# 1. Build application
npm run build

# 2. Copy to server
scp -r dist/ user@server:/opt/deep-agents/

# 3. Install PM2 globally
npm install -g pm2

# 4. Start with PM2 (uses ecosystem.config.js)
cd /opt/deep-agents
pm2 start ecosystem.config.js --env production

# 5. Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup

# 6. Configure Nginx
# (See docs/nginx.conf for sample configuration)
```

### Monitoring

**Health Checks**:
```bash
# Kubernetes liveness probe
curl http://localhost:5000/health/live
# Returns 200 if server is running

# Kubernetes readiness probe
curl http://localhost:5000/health/ready
# Returns 200 if database is connected

# Detailed health with all components
curl http://localhost:5000/health
# Returns JSON with status of all subsystems
```

**Logging**:
```
Production logs written to:
- /var/log/deep-agents/application-YYYY-MM-DD.log  (14-day retention)
- /var/log/deep-agents/error-YYYY-MM-DD.log         (30-day retention)
- /var/log/deep-agents/agent-YYYY-MM-DD.log         (14-day retention)

Centralized logging (optional):
- Datadog: Set DD_API_KEY in environment
- Splunk: Configure Splunk forwarder
- CloudWatch: AWS CloudWatch Logs agent
```

**Metrics**:
```
PM2 Metrics:
pm2 monit                 # Real-time CPU/memory
pm2 list                  # Process status
pm2 logs deep-agent-system # View logs

Application Metrics (available via /api/health/metrics):
- Total requests per second
- Average response time
- Error rate
- Memory usage
- Agent scan frequency
- Rule evaluation count
- Fact generation rate
```

---

# APPENDIX A: DEPRECATED FEATURES

## A.1 Old Orchestration System (Pre-v2.0)

**Status**: ❌ Deprecated (replaced by ContinuousOrchestrator)

**What it was**: Original AgentOrchestrator with manual scheduling

**Why deprecated**:
- Only ran on manual trigger (not 24/7)
- No A2A collaboration support
- No Mem0/Letta integration

**Replacement**: ContinuousOrchestrator with A2A message bus

## A.2 Standalone Retool Interfaces (Pre-v2.0)

**Status**: ❌ Deprecated (replaced by integrated Rule Editors)

**What they were**: 8 separate Retool apps for rule configuration

**Why deprecated**:
- Required Retool subscription ($50/user/month)
- Data lived in Retool, not our database
- No version control
- Difficult to customize

**Replacement**: Built-in React-based Rule Editors at `/admin/agent-rules`

## A.3 Flowise Integration (Pre-v1.5)

**Status**: ❌ Deprecated (not production-ready)

**What it was**: Visual workflow builder integration

**Why deprecated**:
- Added unnecessary complexity
- Our rules engine + LangChain agents are sufficient
- Maintenance burden

**If needed**: Can be re-enabled in `/server/lib/FlowiseService.ts`

## A.4 Stack AI Integration (Pre-v1.5)

**Status**: ❌ Deprecated (not production-ready)

**What it was**: Alternative LLM orchestration platform

**Why deprecated**:
- We built our own orchestration (better fit)
- Stack AI is SaaS (vendor lock-in)
- Costs $199/month per agent

**Replacement**: DeepAgentBase with direct Claude API calls

---

# APPENDIX B: IMPLEMENTATION HISTORY

## Timeline

**January 2026**: v2.0 Release (Event-Driven Architecture)
- ✅ Event-driven fact broadcasting (175K facts/day)
- ✅ 10 Deep Agents (added 4 new agents)
- ✅ Mem0/Letta memory integration
- ✅ Policy-as-Code UI
- ✅ Voice Briefings
- ✅ OKR-Rule Mapping
- ✅ Production reliability (PM2, Winston logging, graceful shutdown)

**December 2025**: v1.5 Release (Memory Architecture)
- ✅ Mem0 shared fact ledger
- ✅ Letta per-agent memory
- ✅ Agent subscriptions to fact patterns
- ✅ Rules Engine (json-rules-engine)

**November 2025**: v1.0 Release (Core Platform)
- ✅ 6 Deep Agents (FinOps, TMO, Risk, VRO, PMO, OCM)
- ✅ A2A message bus
- ✅ LangChain integration
- ✅ PostgreSQL database (48 tables)
- ✅ React frontend
- ✅ MCP protocol integrations

---

# APPENDIX C: TROUBLESHOOTING

See [4.5 Troubleshooting Common Issues](#45-troubleshooting-common-issues) in Administrator Guide.

---

# APPENDIX D: API REFERENCE

See [5.6 API Endpoints](#56-api-endpoints) in Technical Architecture.

---

**END OF MASTER ARCHITECTURE DOCUMENT**

**Version**: 2.0
**Last Updated**: January 26, 2026
**Total Pages**: ~100
**Document Owner**: Deep Agent System Team
**Next Review Date**: February 15, 2026
