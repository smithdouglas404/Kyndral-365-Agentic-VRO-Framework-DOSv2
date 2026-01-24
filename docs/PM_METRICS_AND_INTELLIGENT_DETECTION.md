# PM Metrics Dashboard Mapping + Intelligent Agent Detection

## Overview

This document shows:
1. **Where PM metrics** (tasks, WIP, late projects, velocity, etc.) **appear on dashboards**
2. **How agents intelligently detect issues** without needing manual rules for every metric

---

## Part 1: Where PM Metrics Appear on Dashboards

### PM Tools Data Collected:
- **Tasks**: Status (To Do, In Progress, Done), assignee, due dates, dependencies
- **Projects**: Progress %, milestones, deliverables, timeline
- **Team**: Workload, capacity, velocity, utilization
- **Workflow**: Cycle time, lead time, WIP limits, blocked tasks
- **Quality**: Defects, rework rate, code review coverage

---

## Dashboard Location Map

### 1. **PM Workspace** (`/workspace/pm`)

**Main View: Active Projects Table**
```
┌──────────────────────────────────────────────────────────────────┐
│                  PM Workspace - Active Projects                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [All Projects] [My Projects] [At Risk] [Behind Schedule]       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Project         | Progress | Status | Late Tasks | WIP      │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Cloud Migration | 72% ████▒ | 🟡 At Risk | 3 🔴 | 12/15    │  │
│  │ Platform Modern.| 65% ███▓▒ | 🟢 On Track| 0    | 8/10     │  │
│  │ Data Warehouse  | 58% ███▒▒ | 🔴 Delayed | 8 🔴 | 15/12 ⚠️ │  │
│  │ Mobile App      | 85% ████▓ | 🟢 On Track| 1    | 6/10     │  │
│  │ API Gateway     | 40% ██▒▒▒ | 🟡 At Risk | 2 🟡 | 9/10     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Smart Alerts (Agent-Detected Issues)                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔴 Data Warehouse: WIP limit exceeded (15/12 tasks)        │  │
│  │    → Agent detected: Team overloaded, velocity dropping    │  │
│  │                                                             │  │
│  │ 🔴 Data Warehouse: 8 tasks overdue by avg 4 days           │  │
│  │    → Agent detected: Schedule slippage pattern             │  │
│  │                                                             │  │
│  │ 🟡 API Gateway: 2 tasks blocked for 3+ days                │  │
│  │    → Agent detected: Dependency bottleneck                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Data Source: Jira (via MCP)                                     │
│  Last Sync: 2 minutes ago                                        │
└──────────────────────────────────────────────────────────────────┘
```

**Metrics Shown:**
- Project progress percentage
- Late tasks count (red if > 2, yellow if 1-2)
- WIP (Work in Progress) vs WIP limit
- Project health status (auto-detected by agent)

**Data Source**: Jira/Azure DevOps/Planview API → `/projects`, `/tasks`

---

### 2. **Project Detail Page** (`/project/:id`)

**Tasks Tab:**
```
┌──────────────────────────────────────────────────────────────────┐
│          Project: Data Warehouse Upgrade - Tasks Tab             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Kanban Board] [Task List] [Gantt Chart] [Metrics]             │
│                                                                   │
│  Kanban Board View:                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ To Do    │ In Prog. │ Review   │ Done     │                  │
│  │ (8)      │ (15) ⚠️  │ (4)      │ (42)     │                  │
│  ├──────────┼──────────┼──────────┼──────────┤                  │
│  │ TASK-401 │ TASK-378 │ TASK-364 │ TASK-301 │                  │
│  │ TASK-402 │ TASK-379 │ TASK-365 │ TASK-302 │                  │
│  │ TASK-403 │ TASK-380 │ TASK-366 │ ...      │                  │
│  │ ...      │ ... 🔴   │ TASK-367 │          │                  │
│  │          │ ↑ WIP    │          │          │                  │
│  │          │ Limit:12 │          │          │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│                                                                   │
│  🔴 Agent Alert: WIP limit exceeded in "In Progress"            │
│     • Current: 15 tasks (Limit: 12)                              │
│     • Recommendation: Team overloaded, consider moving tasks     │
│       back to "To Do" or adding resources                        │
│                                                                   │
│  Overdue Tasks:                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ TASK-378: Database schema migration                        │  │
│  │ • Due: Jan 10 (5 days overdue) 🔴                          │  │
│  │ • Assignee: John Smith                                      │  │
│  │ • Blocker: Waiting on DBA review                           │  │
│  │ • Agent Note: External dependency, 3 days stalled          │  │
│  │                                                             │  │
│  │ TASK-380: ETL pipeline optimization                        │  │
│  │ • Due: Jan 12 (3 days overdue) 🔴                          │  │
│  │ • Assignee: Sarah Johnson                                   │  │
│  │ • Agent Note: High complexity, may need pairing            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Blocked Tasks (Agent-Detected):                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔴 TASK-382: Performance testing                            │  │
│  │    Blocked by: TASK-378 (overdue)                           │  │
│  │    Blocked for: 5 days                                      │  │
│  │    → Agent: Critical path at risk                           │  │
│  │                                                             │  │
│  │ 🟡 TASK-385: Documentation update                           │  │
│  │    Blocked by: External dependency (API team)              │  │
│  │    Blocked for: 3 days                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Metrics Shown:**
- WIP count per column with limit indicators
- Overdue tasks with days late
- Blocked tasks with blocker reason and duration
- Cycle time, lead time per task

**Data Source**: Jira API → `/board`, `/issues`

---

**Metrics Tab:**
```
┌──────────────────────────────────────────────────────────────────┐
│          Project: Data Warehouse Upgrade - Metrics Tab           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Sprint Velocity (Story Points)                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📊 Bar Chart                                               │  │
│  │  Sprint 1: 42 pts                                           │  │
│  │  Sprint 2: 38 pts                                           │  │
│  │  Sprint 3: 28 pts 🔴 (33% drop)                            │  │
│  │  Sprint 4: 25 pts 🔴 (Target: 40 pts)                      │  │
│  │                                                             │  │
│  │  🔴 Agent Alert: Velocity declining for 2 sprints          │  │
│  │     Likely causes: Team overload (WIP 15/12) + blockers    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Cycle Time Analysis                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Average Cycle Time: 8.2 days                              │  │
│  │  Industry Benchmark: 5-7 days                               │  │
│  │  Status: 🟡 Above benchmark                                 │  │
│  │                                                             │  │
│  │  Breakdown:                                                 │  │
│  │  • To Do → In Progress: 1.2 days                           │  │
│  │  • In Progress → Review: 5.8 days 🔴 (slowest stage)       │  │
│  │  • Review → Done: 1.2 days                                 │  │
│  │                                                             │  │
│  │  🟡 Agent Insight: Bottleneck in "In Progress"             │  │
│  │     Tasks spending 5.8 days on average before review       │  │
│  │     Recommendation: Break down large tasks, add checkpoints│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Lead Time for Changes (DORA Metric)                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Current: 12 days                                           │  │
│  │  Elite: < 1 day | High: < 7 days | Medium: < 30 days       │  │
│  │  Status: 🟡 High Performer                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Team Capacity vs. Load                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Available Capacity: 240 hours/week                         │  │
│  │  Committed Work: 280 hours/week 🔴 (117% overload)         │  │
│  │                                                             │  │
│  │  🔴 Agent Alert: Team 17% over capacity                     │  │
│  │     This explains WIP buildup and velocity drop            │  │
│  │     Recommendation: Descope 40 hours or add 1 team member  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Metrics Shown:**
- Sprint velocity with trend detection
- Cycle time breakdown by stage
- Lead time with DORA benchmarks
- Team capacity vs committed load

**Data Source**: Jira API → `/sprint/report`, `/cycle-time`, `/capacity`

---

### 3. **Planning Workspace** (`/workspace/planning`)

**Sprint Overview:**
```
┌──────────────────────────────────────────────────────────────────┐
│              Planning Workspace - Sprint Metrics                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Current Sprint (Sprint 24)                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Sprint Goal: Complete data migration module                 │  │
│  │ Progress: 62% (Day 8 of 14)                                 │  │
│  │ Velocity: 25 pts (Target: 40 pts) 🔴                        │  │
│  │ Completion Risk: 🔴 High (38% behind target)                │  │
│  │                                                             │  │
│  │ 🔴 Agent Prediction: Sprint likely to miss target          │  │
│  │    • Completed: 25 pts                                      │  │
│  │    • Remaining: 15 pts (would need 7.5 pts/day, avg is 3)  │  │
│  │    • Recommendation: Descope 8 pts or extend sprint        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Team Velocity Trend                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📈 Line Graph                                              │  │
│  │  Sprint 20: 42 pts                                          │  │
│  │  Sprint 21: 38 pts                                          │  │
│  │  Sprint 22: 28 pts                                          │  │
│  │  Sprint 23: 25 pts                                          │  │
│  │  Sprint 24: 25 pts (projected: 30-35 pts)                  │  │
│  │                                                             │  │
│  │  🔴 Agent Analysis: 40% velocity decline over 4 sprints    │  │
│  │     Root causes detected:                                   │  │
│  │     1. Team overload (280h committed vs 240h capacity)     │  │
│  │     2. Increased WIP (15/12 tasks in progress)             │  │
│  │     3. More blockers (avg 3.5 blocked tasks per sprint)    │  │
│  │     4. 2 team members on PTO last 2 sprints                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Dependency Health                                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Blocked Tasks: 4 🟡                                        │  │
│  │  • TASK-382: Blocked by overdue TASK-378 (5 days)         │  │
│  │  • TASK-385: Waiting on API team (3 days)                  │  │
│  │  • TASK-391: Waiting on security review (2 days)           │  │
│  │  • TASK-394: Blocked by TASK-391 (2 days)                  │  │
│  │                                                             │  │
│  │  🟡 Agent Note: 10% of sprint tasks blocked (Target: <5%) │  │
│  │     Dependency blocking is above threshold                  │  │
│  │     Recommendation: Escalate API team dependency           │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Metrics Shown:**
- Sprint progress vs target
- Velocity trend with decline detection
- Blocked tasks percentage
- Sprint completion risk prediction

**Data Source**: Jira API → `/sprint`, `/velocity`, `/dependencies`

---

### 4. **Team Dashboard** (`/workspace/pm` → Team Tab)

**Team Capacity & Workload:**
```
┌──────────────────────────────────────────────────────────────────┐
│                     Team Workload Analysis                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Team Members (Data Warehouse Team)                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Name          | Capacity | Assigned | Utilization | Status │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ John Smith    | 40h      | 52h      | 130% 🔴    | Overload│  │
│  │ Sarah Johnson | 40h      | 48h      | 120% 🔴    | Overload│  │
│  │ Mike Chen     | 40h      | 38h      | 95% 🟢     | Optimal │  │
│  │ Emily Davis   | 40h      | 32h      | 80% 🟢     | Optimal │  │
│  │ Alex Kumar    | 40h      | 55h      | 138% 🔴    | Critical│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  🔴 Agent Alert: 3 team members over 110% capacity              │  │
│     • John Smith: 12h overload (3 overdue tasks)                │  │
│     • Sarah Johnson: 8h overload (2 overdue tasks)              │  │
│     • Alex Kumar: 15h overload 🚨 (critical, 5 tasks at risk)   │  │
│                                                                   │
│     Recommendations:                                             │
│     1. Reassign 15h from Alex to Emily (underutilized)          │  │
│     2. Descope 12h from John's queue                             │  │
│     3. Consider adding contractor for 2-week burst              │  │
│                                                                   │
│  Task Distribution (by Person)                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📊 Stacked Bar Chart                                       │  │
│  │  Alex Kumar:  [████████████] 15 tasks 🔴                   │  │
│  │  John Smith:  [██████████] 12 tasks 🔴                     │  │
│  │  Sarah J.:    [████████] 10 tasks 🟡                       │  │
│  │  Mike Chen:   [██████] 8 tasks 🟢                          │  │
│  │  Emily Davis: [████] 6 tasks 🟢                            │  │
│  │                                                             │  │
│  │  🟡 Agent Note: Uneven distribution                         │  │
│  │     Top 2 members have 53% of tasks                         │  │
│  │     Recommendation: Balance load across team                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Metrics Shown:**
- Individual capacity vs workload
- Utilization percentage per person
- Task distribution evenness
- Overload alerts and recommendations

**Data Source**: Jira API → `/users`, `/worklog`, `/assignments`

---

### 5. **Executive Workspace** (`/workspace/executive`)

**Portfolio Health Summary:**
```
┌──────────────────────────────────────────────────────────────────┐
│         Executive Dashboard - Portfolio Health Summary           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Active Projects Overview                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Total Projects: 12                                          │  │
│  │ 🟢 On Track: 6 (50%)                                        │  │
│  │ 🟡 At Risk: 4 (33%)                                         │  │
│  │ 🔴 Critical: 2 (17%)                                        │  │
│  │                                                             │  │
│  │ Portfolio Health Score: 6.8/10 🟡                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Critical Attention Required                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔴 Data Warehouse Upgrade                                   │  │
│  │    • 8 tasks overdue (avg 4 days late)                     │  │
│  │    • Team 17% over capacity                                 │  │
│  │    • Sprint velocity down 40%                               │  │
│  │    • Projected completion: 3 weeks behind                   │  │
│  │    → Agent: Recommend executive escalation                  │  │
│  │                                                             │  │
│  │ 🔴 Cloud Migration Phase 2                                  │  │
│  │    • Budget overrun: $82K over (18%)                        │  │
│  │    • CPI: 0.82 (critical threshold)                         │  │
│  │    • 3 blocked tasks waiting on vendor                      │  │
│  │    → Agent: Financial + schedule risk detected             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Key Portfolio Metrics                                           │
│  ├─ Avg On-Time Delivery: 72% 🟡 (Target: 90%)                  │  │
│  ├─ Avg Team Utilization: 96% 🟡 (Target: 80-90%)               │  │
│  ├─ Portfolio Velocity Trend: ↓ Declining 🔴                     │  │
│  └─ Resource Contention: 18% 🔴 (Target: <10%)                  │  │
└──────────────────────────────────────────────────────────────────┘
```

**Metrics Shown:**
- Portfolio health score (agent-calculated)
- Project status distribution
- Critical projects requiring intervention
- Key portfolio-level KPIs

**Data Source**: Aggregate from all PM tools via MCP

---

## Part 2: Intelligent Agent Detection (How Agents Know Good vs Bad)

### Detection Methodology

Agents use **3-layer intelligence** to detect issues without manual rules:

```
Layer 1: Industry Benchmarks (Built-in Knowledge)
  └─ Pre-trained on industry standards for each metric

Layer 2: Historical Baseline (Your Organization)
  └─ Learns from your past 90 days of project data

Layer 3: AI Pattern Recognition (LLM-powered)
  └─ Detects anomalies, trends, correlations
```

---

### Example: "Task is Late" Detection

**How Agent Knows Without Manual Rules:**

```
TASK-378: Database schema migration
Due Date: Jan 10, 2025
Current Date: Jan 15, 2025
Status: In Progress

┌─────────────────────────────────────────────────────────────┐
│ Agent Analysis (Planning Agent)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Layer 1: Industry Benchmark                                 │
│ • Late by 5 days                                            │
│ • Industry standard: <5% tasks late                         │
│ • Classification: 🔴 LATE                                   │
│                                                              │
│ Layer 2: Historical Baseline                                │
│ • Your org avg: 8% of tasks are late                        │
│ • This project: 20% of tasks late (above org avg)           │
│ • Classification: 🔴 PATTERN - Project consistently late    │
│                                                              │
│ Layer 3: AI Pattern Recognition                             │
│ • Blocker detected: "Waiting on DBA review" for 3 days     │
│ • Similar past tasks: External dependencies avg 5 days     │
│ • Correlation: Tasks with external deps are 3x more likely │
│   to be late in this project                                │
│ • Prediction: Will be late by 7-10 days total               │
│                                                              │
│ Agent Decision: 🔴 CRITICAL - Late task on critical path    │
│ Recommended Actions:                                         │
│ 1. Escalate DBA review (blocking 2 other tasks)            │
│ 2. Notify PMO + Risk agent                                  │
│ 3. Consider workaround if DBA unavailable                   │
└─────────────────────────────────────────────────────────────┘
```

**No Manual Rule Needed!** Agent automatically:
- Detects task is late (vs due date)
- Compares to industry + org baselines
- Identifies root cause (external blocker)
- Predicts final delay (7-10 days)
- Recommends corrective actions

---

### Example: "WIP Limit Exceeded" Detection

```
Data Warehouse Project - Kanban Board
Column: "In Progress"
Current WIP: 15 tasks
WIP Limit: 12 tasks

┌─────────────────────────────────────────────────────────────┐
│ Agent Analysis (Planning Agent)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Layer 1: Industry Benchmark                                 │
│ • Kanban best practice: Respect WIP limits                  │
│ • 15/12 = 125% of limit (25% over)                          │
│ • Classification: 🔴 WIP LIMIT EXCEEDED                     │
│                                                              │
│ Layer 2: Historical Baseline                                │
│ • Past 3 months: WIP averaged 9.2 tasks (within limit)     │
│ • Last 2 sprints: WIP climbing (11 → 13 → 15)              │
│ • Velocity correlation: When WIP > 12, velocity drops 30%   │
│ • Classification: 🔴 TREND - Getting worse                  │
│                                                              │
│ Layer 3: AI Pattern Recognition                             │
│ • Root cause detected: Team overload (280h vs 240h)        │
│ • Bottleneck stage: "In Progress" (avg 5.8 days)           │
│ • Correlation: High WIP + long cycle time = burnout risk   │
│ • Similar historical pattern: Sprint 18 had same issue,    │
│   led to 2 team members taking sick leave                   │
│ • Prediction: If not addressed, expect:                     │
│   - Further velocity drop (to ~20 pts)                      │
│   - Increased defect rate                                   │
│   - Team morale decline                                     │
│                                                              │
│ Agent Decision: 🔴 CRITICAL - Immediate action required     │
│ Recommended Actions:                                         │
│ 1. Move 5 tasks back to "To Do" queue                       │
│ 2. Identify 40h of work to descope/defer                    │
│ 3. Consider adding 1 contractor for 2-week burst           │
│ 4. Notify PMO + FinOps (budget impact) + OCM (team morale) │
└─────────────────────────────────────────────────────────────┘
```

**Intelligence Features:**
- Detects WIP limit breach automatically
- Correlates with velocity drop
- Predicts future consequences
- References past similar incidents
- Recommends multi-pronged solution

---

### Example: "Velocity Declining" Detection

```
Sprint Velocity Trend
Sprint 20: 42 pts
Sprint 21: 38 pts
Sprint 22: 28 pts
Sprint 23: 25 pts
Sprint 24: 25 pts (current)

┌─────────────────────────────────────────────────────────────┐
│ Agent Analysis (Planning Agent + Risk Agent)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Layer 1: Industry Benchmark                                 │
│ • Healthy velocity: ±10% variance sprint-to-sprint          │
│ • Current: -40% over 4 sprints                              │
│ • Classification: 🔴 SIGNIFICANT DECLINE                    │
│                                                              │
│ Layer 2: Historical Baseline                                │
│ • Your org avg velocity: 38 pts/sprint                      │
│ • This team's baseline (6 months ago): 40-45 pts           │
│ • Current: 25 pts (38% below baseline)                      │
│ • Classification: 🔴 WELL BELOW NORMAL                      │
│                                                              │
│ Layer 3: AI Root Cause Analysis                             │
│ • Analyzed 47 factors, found 4 primary causes:             │
│                                                              │
│   1. Team Overload (45% contribution)                       │
│      → 280h committed vs 240h capacity                      │
│      → 3 members >110% utilization                          │
│                                                              │
│   2. Increased WIP (25% contribution)                       │
│      → WIP climbed from 9 → 15 tasks                        │
│      → Cycle time increased 5.2d → 8.2d                     │
│                                                              │
│   3. More Blockers (20% contribution)                       │
│      → Avg 1.2 → 3.5 blocked tasks per sprint              │
│      → External dependencies increased 180%                 │
│                                                              │
│   4. Team Changes (10% contribution)                        │
│      → 2 members on PTO last 2 sprints                      │
│      → 1 new team member onboarding (learning curve)        │
│                                                              │
│ • Prediction: If unchanged, velocity will drop to 18-20 pts│
│ • Timeline impact: Project will miss deadline by 6 weeks    │
│ • Budget impact: $128K cost overrun (extra 6 weeks labor)  │
│                                                              │
│ Agent Decision: 🔴 CRITICAL - Executive escalation needed   │
│ Cross-Agent Collaboration Triggered:                         │
│ • Planning Agent → FinOps Agent (budget impact)             │
│ • Planning Agent → Risk Agent (schedule risk)               │
│ • Planning Agent → OCM Agent (team morale)                  │
│ • Planning Agent → PMO (portfolio impact)                   │
│                                                              │
│ Recommended Actions (Priority Order):                        │
│ 1. Immediate: Descope 40h of work from current sprint      │
│ 2. This week: Rebalance tasks (move 15h from Alex to Emily)│
│ 3. This week: Escalate external dependencies to VP level   │
│ 4. Next week: Add 1 contractor for 4-week engagement       │
│ 5. Next sprint: Implement stricter WIP limits (10 max)     │
│ 6. Long-term: Cross-train team on external dependencies    │
└─────────────────────────────────────────────────────────────┘
```

**Intelligence Features:**
- Multi-sprint trend analysis
- Root cause breakdown with contribution %
- Predicts future velocity and timeline impact
- Calculates budget consequence
- Triggers cross-agent collaboration
- Provides prioritized action plan

---

## Part 3: Built-in Intelligence Rules (Pre-trained Knowledge)

Agents come with **industry-standard intelligence** for common scenarios:

| Metric | Good (🟢) | Warning (🟡) | Critical (🔴) | Agent Knowledge Source |
|--------|-----------|--------------|---------------|------------------------|
| **Sprint Velocity Variance** | ±10% | ±15-20% | >20% | Agile benchmarks (Scrum Guide) |
| **WIP Limit Adherence** | At or below limit | 10% over | >10% over | Kanban Method (David Anderson) |
| **Cycle Time** | 3-7 days | 7-10 days | >10 days | Lean metrics (industry avg) |
| **Lead Time** | <7 days (Elite) | 7-30 days | >30 days | DORA metrics (DevOps Research) |
| **Team Utilization** | 80-90% | 70-80% or 90-95% | <70% or >95% | Resource Management best practices |
| **Blocked Tasks** | <5% | 5-10% | >10% | Agile flow metrics |
| **On-Time Delivery** | >90% | 80-90% | <80% | PMI (Project Management Institute) |
| **Defect Rate** | <5% | 5-10% | >10% | Software Engineering Institute |
| **Code Review Time** | <24 hours | 24-48 hours | >48 hours | GitHub/GitLab benchmarks |

**How Agents Use This:**
1. Compare current value to table thresholds
2. Check historical baseline (is this normal for you?)
3. Analyze context (is there a good reason? PTO, holidays, etc.)
4. Recommend action based on severity + context

---

## Part 4: Context-Aware Intelligence

Agents are **smart enough to understand context**:

### Example: Late Task (But Justified)

```
TASK-456: Year-end compliance audit
Due Date: Dec 31, 2024
Current Date: Jan 5, 2025
Status: In Progress

┌─────────────────────────────────────────────────────────────┐
│ Agent Analysis (Governance Agent)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Layer 1: Industry Benchmark                                 │
│ • 5 days late → 🔴 LATE                                     │
│                                                              │
│ Layer 2: Historical Baseline                                │
│ • Compliance audits historically take 45 days               │
│ • This one is on day 42 → 🟢 WITHIN EXPECTED RANGE          │
│                                                              │
│ Layer 3: AI Context Recognition                             │
│ • Original due date: Dec 31 (arbitrary, end-of-year)       │
│ • Actual requirement: "Before Q1 board meeting" (Jan 15)    │
│ • Real deadline: Jan 15 (10 days remaining)                 │
│ • 3-day company holiday (Dec 23-26) → task was paused       │
│ • Adjusted timeline: On track for Jan 12 completion         │
│                                                              │
│ Agent Decision: 🟢 ON TRACK (despite calendar "late" date)  │
│ Reason: Agent understands:                                   │
│ • Original due date was placeholder                          │
│ • Real deadline is Jan 15 (not yet reached)                 │
│ • Holiday pause was expected                                 │
│ • Historical context: audits always take 40-45 days         │
│                                                              │
│ No alert generated. No action needed.                        │
└─────────────────────────────────────────────────────────────┘
```

**Context Understood:**
- Placeholder vs real deadlines
- Holidays and expected pauses
- Historical task duration patterns
- Business requirements vs arbitrary dates

---

### Example: High WIP (But Justified)

```
API Gateway Project - Kanban Board
Column: "In Progress"
Current WIP: 18 tasks
WIP Limit: 12 tasks

┌─────────────────────────────────────────────────────────────┐
│ Agent Analysis (Planning Agent)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Layer 1: Industry Benchmark                                 │
│ • 18/12 = 150% of limit → 🔴 WIP EXCEEDED                   │
│                                                              │
│ Layer 2: Historical Baseline                                │
│ • Unusual: This team usually respects WIP (avg 9-11)       │
│                                                              │
│ Layer 3: AI Context Recognition                             │
│ • Sprint context: Final sprint before major release         │
│ • Task types: 15 of 18 are small defects (1-2 hour fixes)  │
│ • Avg cycle time: Still fast at 1.8 days (usually 2.1d)    │
│ • Team notes: "Bug bash week - fixing release blockers"    │
│ • Velocity impact: None detected (still on target)          │
│ • Historical: Same pattern in past releases (Q2, Q3)        │
│                                                              │
│ Agent Decision: 🟡 ACCEPTABLE (temporary, justified)        │
│ Reason: Agent understands:                                   │
│ • Pre-release bug fixing is standard practice                │
│ • Tasks are small (not real WIP issues)                     │
│ • Team velocity unaffected                                   │
│ • Historical precedent: Always happens at releases          │
│ • Will self-resolve in 3 days (release date)                │
│                                                              │
│ Monitor but no action needed.                                │
│ Will auto-alert if WIP stays high post-release.             │
└─────────────────────────────────────────────────────────────┘
```

**Context Understood:**
- Pre-release bug bash patterns
- Task size (small vs large)
- Temporary vs sustained issues
- Historical precedents

---

## Summary

### Where PM Metrics Appear:
1. **PM Workspace** → Project table, smart alerts, portfolio view
2. **Project Detail** → Kanban board, overdue tasks, blocked tasks, metrics tab
3. **Planning Workspace** → Sprint overview, velocity trends, dependency health
4. **Team Dashboard** → Capacity, workload, utilization, task distribution
5. **Executive Workspace** → Portfolio health, critical projects, key KPIs

### How Agents Know Good vs Bad:
1. **Industry Benchmarks** → Pre-trained on standards (DORA, Agile, PMI, etc.)
2. **Historical Baseline** → Learns from your org's past 90 days
3. **AI Pattern Recognition** → Detects anomalies, correlations, root causes
4. **Context Awareness** → Understands holidays, releases, task types, deadlines

**No Manual Rules Needed!** Agents intelligently detect:
- Late tasks (with context)
- WIP limit breaches
- Velocity declines
- Team overload
- Blocked tasks
- Schedule risks
- Quality issues

All shown on dashboards with **actionable recommendations** and **cross-agent collaboration triggers**.
