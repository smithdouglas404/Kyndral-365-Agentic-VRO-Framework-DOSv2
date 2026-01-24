# PPM Financial Metrics Dashboard Mapping

## Overview

PPM tools (Planview, Celoxis, Clarity) collect financial data in 3 phases. This document shows **where each metric appears** across dashboards.

---

## 1. PRE-PROJECT METRICS (Budgeting & Planning)

Collected before project begins to help leadership decide if project is worth investment.

### Metrics Collected by PPM Tools:
- **Cost Estimates**: Labor (salaries), materials, licenses, consultants
- **CAPEX vs OPEX**: Capital vs Operational Expense categorization
- **NPV (Net Present Value)**: Time value of money calculation
- **IRR (Internal Rate of Return)**: Profitability rate
- **ROI (Return on Investment)**: Expected return percentage
- **Payback Period**: Time to recover investment

### Dashboard Locations:

#### A. **Planning Workspace** (`/workspace/planning`)
```
┌─────────────────────────────────────────────────────┐
│          Planning Workspace - Portfolio View        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Project Proposal Pipeline                           │
│  ├─ Project A                                        │
│  │  ├─ Est. Cost: $450,000                          │
│  │  ├─ CAPEX: $300K | OPEX: $150K                   │
│  │  ├─ NPV: $1.2M                                   │
│  │  ├─ IRR: 24%                                     │
│  │  ├─ ROI: 165%                                    │
│  │  ├─ Payback: 18 months                           │
│  │  └─ Status: 🟢 Approved                          │
│  │                                                   │
│  ├─ Project B                                        │
│  │  ├─ Est. Cost: $280,000                          │
│  │  ├─ NPV: $640K                                   │
│  │  ├─ IRR: 18%                                     │
│  │  └─ Status: 🟡 Pending Review                    │
└─────────────────────────────────────────────────────┘
```

**Component**: `PortfolioFinancialSummary.tsx`
**Data Source**: PPM Tool (Planview/Celoxis/Clarity) API → `/projects` endpoint
**Update Frequency**: Daily (business case updates)

#### B. **Executive Workspace** (`/workspace/executive`)
```
┌─────────────────────────────────────────────────────┐
│     Executive Dashboard - Investment Portfolio      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Portfolio Value Summary                             │
│  ├─ Total Pipeline Value: $12.3M                    │
│  ├─ Average IRR: 21%                                 │
│  ├─ Average ROI: 142%                                │
│  ├─ CAPEX Budget Remaining: $2.1M of $5M            │
│  └─ OPEX Budget Remaining: $880K of $2M             │
│                                                      │
│  Top ROI Projects (Awaiting Approval)                │
│  ├─ Digital Transformation → ROI: 245% | NPV: $3.2M │
│  ├─ Cloud Migration → ROI: 198% | NPV: $1.8M        │
│  └─ Platform Modernization → ROI: 167% | NPV: $1.2M │
└─────────────────────────────────────────────────────┘
```

**Component**: `ExecutiveFinancialSummary.tsx`
**Data Source**: PPM Tool API → `/portfolio-summary`
**Update Frequency**: Daily

---

## 2. DURING EXECUTION METRICS (Cost Tracking)

Collected during active project to monitor actual spend vs plan.

### Metrics Collected by PPM Tools:
- **Actual Costs**: Labor hours × billable rates + materials
- **Budget Variance**: (Actual - Planned) / Planned × 100%
- **Burn Rate**: Spending rate per week/month
- **EVM Metrics**:
  - **CPI (Cost Performance Index)**: Budget / Actual Cost
  - **SPI (Schedule Performance Index)**: Earned Value / Planned Value
  - **CV (Cost Variance)**: Earned Value - Actual Cost
  - **SV (Schedule Variance)**: Earned Value - Planned Value
  - **EAC (Estimate at Completion)**: Projected final cost
  - **ETC (Estimate to Complete)**: Remaining cost estimate

### Dashboard Locations:

#### A. **FinOps Workspace** (`/workspace/finops`)

**Main Dashboard View:**
```
┌──────────────────────────────────────────────────────────────────┐
│              FinOps Dashboard - Live Project Financials          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Portfolio Health Overview                                        │
│  ├─ Total Active Budget: $8.4M                                   │
│  ├─ Total Actual Spend: $7.1M (84.5%)                            │
│  ├─ Avg Cost Performance Index (CPI): 0.92 🟡                    │
│  ├─ Avg Schedule Performance Index (SPI): 1.03 🟢                │
│  └─ Projects Over Budget: 3 of 12 🔴                             │
│                                                                   │
│  Critical Projects (CPI < 0.85)                                   │
│  ┌────────────────────────────────────────────────────┐          │
│  │ Project: Cloud Migration Phase 2                    │          │
│  │ ├─ Budget: $450K | Actual: $532K                   │          │
│  │ ├─ CPI: 0.82 🔴 CRITICAL                           │          │
│  │ ├─ Variance: +$82K (+18.2%)                        │          │
│  │ ├─ Burn Rate: $44K/week                            │          │
│  │ ├─ EAC: $618K (37% over budget)                    │          │
│  │ ├─ ETC: $86K remaining                             │          │
│  │ └─ Alert: Budget overrun rule triggered            │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
│  Warning Projects (0.85 ≤ CPI < 0.95)                            │
│  ├─ Platform Modernization: CPI 0.88 🟡                          │
│  └─ Data Warehouse Upgrade: CPI 0.91 🟡                          │
└──────────────────────────────────────────────────────────────────┘
```

**Detailed Project View:**
```
┌──────────────────────────────────────────────────────────────────┐
│          Project Detail - Cloud Migration Phase 2                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Earned Value Management (EVM) Dashboard                          │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Budget Baseline:       $450,000                    │          │
│  │  Planned Value (PV):    $360,000 (80% complete)    │          │
│  │  Earned Value (EV):     $324,000 (72% complete)    │          │
│  │  Actual Cost (AC):      $532,000                    │          │
│  │                                                      │          │
│  │  Cost Performance Index (CPI):   0.82 🔴           │          │
│  │  Schedule Performance Index (SPI): 0.90 🟡          │          │
│  │  Cost Variance (CV):    -$208,000 (over budget)    │          │
│  │  Schedule Variance (SV): -$36,000 (behind)         │          │
│  │                                                      │          │
│  │  Estimate at Completion (EAC):   $618,000          │          │
│  │  Estimate to Complete (ETC):     $86,000           │          │
│  │  Variance at Completion (VAC):   -$168,000         │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
│  Cost Breakdown (from Timesheets)                                 │
│  ├─ Labor: $412K (77.4%)                                         │
│  │  ├─ Developers: $280K                                         │
│  │  ├─ Architects: $95K                                          │
│  │  └─ Project Manager: $37K                                     │
│  ├─ Cloud Infrastructure: $85K (16.0%)                           │
│  ├─ Licenses: $28K (5.3%)                                        │
│  └─ External Consultants: $7K (1.3%)                             │
│                                                                   │
│  Burn Rate Analysis                                               │
│  ├─ Avg Weekly Burn: $44,333                                     │
│  ├─ Weeks Remaining: ~2 weeks                                    │
│  ├─ Projected Overspend: $168K                                   │
│  └─ Runway: Budget exhausted in 2 weeks                          │
└──────────────────────────────────────────────────────────────────┘
```

**Components**:
- `FinOpsPortfolioOverview.tsx` - Portfolio summary
- `EVMDashboard.tsx` - Earned Value Management metrics
- `CostBreakdownChart.tsx` - Cost category visualization
- `BurnRateTracker.tsx` - Spending rate monitoring

**Data Source**: PPM Tool API → `/timesheets`, `/actual-costs`, `/evm-metrics`
**Update Frequency**: Real-time (every 15 minutes for critical projects)

#### B. **Project Detail Page** (`/project/:id`)
```
┌──────────────────────────────────────────────────────────────────┐
│              Project: Cloud Migration Phase 2                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Overview] [Tasks] [Team] [Financials] [Risks] [Reports]       │
│                                                                   │
│  ┌─ Financial Tab ─────────────────────────────────────┐         │
│  │                                                       │         │
│  │  Quick Metrics                                        │         │
│  │  ├─ Budget: $450K                                    │         │
│  │  ├─ Actual: $532K (118%)                             │         │
│  │  ├─ CPI: 0.82 🔴                                     │         │
│  │  └─ SPI: 0.90 🟡                                     │         │
│  │                                                       │         │
│  │  [Budget Variance Chart]                              │         │
│  │   📊 Line graph showing planned vs actual over time  │         │
│  │                                                       │         │
│  │  [Cost Breakdown Pie Chart]                           │         │
│  │   🥧 Labor (77%) | Cloud (16%) | Licenses (5%)      │         │
│  │                                                       │         │
│  │  Recent Transactions (from Timesheets)                │         │
│  │  ├─ Jan 15: Developer hours - $12,400                │         │
│  │  ├─ Jan 14: AWS costs - $3,200                       │         │
│  │  └─ Jan 13: License renewal - $4,800                 │         │
│  └───────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

**Component**: `ProjectFinancialsTab.tsx`
**Data Source**: PPM Tool API → `/projects/{id}/financials`
**Update Frequency**: Real-time

#### C. **PMO Workspace** (`/workspace/pm`)
```
┌──────────────────────────────────────────────────────────────────┐
│               PM Workspace - Project Portfolio                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Active Projects Table                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Project              | Progress | CPI  | SPI  | Budget     │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Cloud Migration      | 72%      | 0.82 | 0.90 | $532/$450K │  │
│  │ Platform Modern.     | 65%      | 0.88 | 1.05 | $310/$350K │  │
│  │ Data Warehouse       | 58%      | 0.91 | 0.95 | $215/$240K │  │
│  │ Mobile App           | 85%      | 1.08 | 1.12 | $180/$195K │  │
│  │ API Gateway          | 40%      | 0.95 | 1.03 | $95/$100K  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Financial Health Indicators                                      │
│  ├─ 🔴 Critical (CPI < 0.85): 1 project                          │
│  ├─ 🟡 Warning (0.85-0.95): 2 projects                           │
│  └─ 🟢 Healthy (CPI > 0.95): 2 projects                          │
└──────────────────────────────────────────────────────────────────┘
```

**Component**: `PMProjectTable.tsx`
**Data Source**: PPM Tool API → `/projects/summary`
**Update Frequency**: Every 30 minutes

---

## 3. POST-PROJECT METRICS (Revenue & Benefits)

Collected after project delivery to track profitability and benefits realization.

### Metrics Collected by PPM Tools:
- **Invoicing & Billing**: Milestone payments, hourly billables
- **Revenue Recognition**: Accrued revenue vs cash collected
- **Profit Margin**: (Revenue - Costs) / Revenue × 100%
- **Benefits Realization**: Actual savings/revenue vs projected
- **Customer Satisfaction**: NPS, CSAT scores
- **Time to Value**: Days from launch to first revenue

### Dashboard Locations:

#### A. **FinOps Workspace** (`/workspace/finops`) - "Profitability" Tab
```
┌──────────────────────────────────────────────────────────────────┐
│          FinOps Dashboard - Project Profitability                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Completed Projects (Last 6 Months)                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Project         | Cost   | Revenue | Margin | Benefits     │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Mobile App      | $195K  | $340K   | 42.6%  | $145K/year  │  │
│  │ API Gateway     | $100K  | $165K   | 39.4%  | $85K/year   │  │
│  │ Data Warehouse  | $240K  | $380K   | 36.8%  | $120K/year  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Portfolio Total | $535K  | $885K   | 39.5%  | $350K/year  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Benefits Realization Tracking                                    │
│  ├─ Mobile App                                                    │
│  │  ├─ Projected Savings: $150K/year                             │
│  │  ├─ Actual Savings: $145K/year (6 months measured)            │
│  │  ├─ Realization: 96.7% 🟢                                     │
│  │  └─ Payback: Achieved in 15 months                            │
│  │                                                                │
│  ├─ API Gateway                                                   │
│  │  ├─ Projected Revenue: $100K/year                             │
│  │  ├─ Actual Revenue: $85K/year (6 months measured)             │
│  │  ├─ Realization: 85% 🟡                                       │
│  │  └─ Payback: Expected in 18 months                            │
└──────────────────────────────────────────────────────────────────┘
```

#### B. **VRO (Value Realization) Workspace** (`/workspace/vro`)
```
┌──────────────────────────────────────────────────────────────────┐
│         VRO Dashboard - Value Realization Tracking               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Portfolio Value Delivered (YTD)                                  │
│  ├─ Total Investment: $8.4M                                      │
│  ├─ Total Value Delivered: $12.8M                                │
│  ├─ ROI Achieved: 152%                                           │
│  └─ Net Benefit: $4.4M                                           │
│                                                                   │
│  Benefits Realization by Category                                 │
│  ┌────────────────────────────────────────────────────┐          │
│  │ Cost Savings:      $2.8M (projected $3.0M) - 93%   │          │
│  │ Revenue Growth:    $1.6M (projected $1.8M) - 89%   │          │
│  │ Productivity Gain: $950K (projected $900K) - 106%  │          │
│  │ Risk Reduction:    $340K (projected $400K) - 85%   │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
│  Time to Value Analysis                                           │
│  ├─ Mobile App: 4 months (target: 6 months) 🟢                  │
│  ├─ API Gateway: 8 months (target: 6 months) 🟡                 │
│  └─ Data Warehouse: 12 months (target: 12 months) 🟢            │
└──────────────────────────────────────────────────────────────────┘
```

**Components**:
- `ProfitabilityDashboard.tsx` - Project profit margins
- `BenefitsRealizationTracker.tsx` - Projected vs actual benefits
- `TimeToValueChart.tsx` - Launch to first value timeline

**Data Source**: PPM Tool API → `/projects/profitability`, `/benefits-realization`
**Update Frequency**: Weekly (reconciled with accounting)

#### C. **Executive Workspace** (`/workspace/executive`) - "Portfolio Performance" Tab
```
┌──────────────────────────────────────────────────────────────────┐
│      Executive Dashboard - Portfolio Performance Summary         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Quarterly Performance (Q4 2024)                                  │
│  ├─ Projects Delivered: 8                                        │
│  ├─ Total Investment: $3.2M                                      │
│  ├─ Total Revenue: $5.1M                                         │
│  ├─ Average Margin: 37.3%                                        │
│  ├─ Benefits Realized: 91% of projections                        │
│  └─ Portfolio Health Score: 8.2/10 🟢                            │
│                                                                   │
│  Top Performing Projects (by Margin)                              │
│  ├─ 1. Mobile App Redesign → 42.6% margin                       │
│  ├─ 2. API Gateway → 39.4% margin                                │
│  └─ 3. Data Warehouse → 36.8% margin                             │
│                                                                   │
│  Underperforming Projects (< 80% benefits realized)              │
│  ├─ API Gateway → 85% (revenue below target)                    │
│  └─ Risk Reduction Initiative → 78% (delayed adoption)           │
└──────────────────────────────────────────────────────────────────┘
```

**Component**: `ExecutivePortfolioPerformance.tsx`
**Data Source**: PPM Tool API → `/portfolio/performance`
**Update Frequency**: Daily

---

## 4. PPM Tool Capabilities by Vendor

| PPM Tool      | Pre-Project | During Execution | Post-Project | Best For              |
|---------------|-------------|------------------|--------------|----------------------|
| **Planview**  | ✅ NPV/IRR   | ✅ EVM/CPI/SPI    | ✅ Benefits   | Enterprise Strategy  |
| **Celoxis**   | ✅ ROI       | ✅ Timesheets     | ✅ Margins    | All-in-one PPM       |
| **Clarity**   | ✅ CAPEX     | ✅ Chargebacks    | ✅ Invoicing  | Large-scale IT       |
| **Jira**      | ⚠️ Limited  | ⚠️ Basic costs    | ❌ No         | Agile PM (not PPM)   |
| **Azure DevOps** | ⚠️ Limited | ⚠️ Basic costs | ❌ No         | Dev workflow         |

**Legend:**
- ✅ = Full support with native features
- ⚠️ = Limited support (manual entry or plugins required)
- ❌ = Not supported

---

## 5. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PPM Tool (Planview/Celoxis)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Pre-Project  │  │   During     │  │ Post-Project │          │
│  │  - NPV/IRR   │  │   - Timesheets│  │  - Invoicing │          │
│  │  - CAPEX/OPEX│  │   - EVM       │  │  - Margins   │          │
│  │  - ROI       │  │   - Burn Rate │  │  - Benefits  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ REST API / OData
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│              Universal MCP Connector (Backend)                     │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ - Syncs data every 15 minutes (execution phase)        │       │
│  │ - Daily sync for pre/post project data                 │       │
│  │ - Caches metrics in PostgreSQL                         │       │
│  │ - Calculates CPI, SPI, burn rate, variance             │       │
│  └────────────────────────────────────────────────────────┘       │
└───────────────────────────┬───────────────────────────────────────┘
                            │ Internal API
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    FinOps Agent (Runtime)                          │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ 1. Monitors CPI/SPI thresholds                         │       │
│  │ 2. Triggers Camunda rules if CPI < 0.85               │       │
│  │ 3. Calculates EAC, ETC, VAC                            │       │
│  │ 4. Sends alerts to Risk/Governance agents              │       │
│  └────────────────────────────────────────────────────────┘       │
└───────────────────────────┬───────────────────────────────────────┘
                            │ WebSocket + REST
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Dashboard (Frontend)                           │
│  ├─ FinOps Workspace → EVM metrics, burn rate, variance           │
│  ├─ PM Workspace → Project table with CPI/SPI                     │
│  ├─ Executive Workspace → Portfolio summary                       │
│  ├─ VRO Workspace → Benefits realization                          │
│  └─ Project Detail → Financial tab with charts                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. Configuration Status Indicator

**Red Circle Indicator** appears until financial data source is configured:

```
┌─────────────────────────────────────────────────┐
│        FinOps Workspace (Not Configured)        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ⚠️ Financial Data Source Not Configured  🔴    │
│  ┌──────────────────────────────────────────┐   │
│  │ FinOps requires a financial data source  │   │
│  │ to track budgets, costs, and EVM metrics.│   │
│  │                                           │   │
│  │ [Configure Financial Data Source]        │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Dashboards unavailable until configured:        │
│  ├─ Portfolio Financial Overview                │
│  ├─ EVM Dashboard                               │
│  ├─ Cost Breakdown                              │
│  └─ Burn Rate Tracker                           │
└─────────────────────────────────────────────────┘
```

Once configured:

```
┌─────────────────────────────────────────────────┐
│          FinOps Workspace (Configured) ✅       │
├─────────────────────────────────────────────────┤
│                                                  │
│  Data Source: Planview (PPM with Financial)     │
│  Update Frequency: Every 15 minutes             │
│  Last Sync: 2 minutes ago                       │
│                                                  │
│  [Full dashboard with all metrics visible]      │
└─────────────────────────────────────────────────┘
```

---

## Summary

**PPM Financial Data Appears In:**
1. **Planning Workspace** → Pre-project metrics (NPV, IRR, ROI, CAPEX/OPEX)
2. **FinOps Workspace** → Execution metrics (CPI, SPI, EVM, burn rate, variance)
3. **PM Workspace** → Project table with financial health indicators
4. **VRO Workspace** → Post-project benefits realization
5. **Executive Workspace** → Portfolio performance summary
6. **Project Detail Page** → Full financial tab with charts and transactions

**Configuration:**
- Wizard allows "Configure Later" for financial system
- Red 🔴 indicator shown until configured
- Dropdown shows:
  - Dedicated ERP systems (QuickBooks, SAP, Oracle, etc.)
  - PPM tools with financial data (Planview, Celoxis, Clarity)
  - Option to "Use same system" if PM tool has financial capabilities
