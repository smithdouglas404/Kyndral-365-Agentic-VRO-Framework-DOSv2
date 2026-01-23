# 📘 User Guide - NextEra Energy ETO/VRO Platform

## Welcome

The NextEra Energy Enterprise Transformation Office (ETO) / Value Realization Office (VRO) Platform is an AI-powered project portfolio management system that provides:

- **Real-time project monitoring** across multiple methodologies (SAFe, PMBOK, PRINCE2)
- **7 Intelligent AI Agents** that autonomously monitor budgets, schedules, risks, quality, and compliance
- **Unified data integration** from Jira, Azure DevOps, ServiceNow, and other PPM tools
- **Predictive analytics** and knowledge graph insights
- **Automated interventions** and actionable recommendations

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Projects & Portfolios](#projects--portfolios)
4. [AI Agents](#ai-agents)
5. [Interventions & Alerts](#interventions--alerts)
6. [Reports & Analytics](#reports--analytics)
7. [Settings & Configuration](#settings--configuration)
8. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Getting Started

### First Login

1. Navigate to your platform URL: `https://your-company.com` or `http://localhost:5000`
2. Log in with your company credentials
3. You'll see the main dashboard with project overview

### Navigation

**Main Menu (Left Sidebar):**
- 🏠 Dashboard - Overview of all projects
- 📊 Projects - Browse and manage projects
- 🤖 Agents - View AI agent activity
- 🚨 Interventions - Review agent recommendations
- 📈 Reports - Access analytics and reports
- ⚙️ Settings - Configure data sources and preferences

---

## Dashboard Overview

The dashboard provides a high-level view of your entire project portfolio.

### Key Metrics (Top Row)

- **Total Projects** - Number of active projects
- **Health Score** - Overall portfolio health (Green/Amber/Red)
- **Budget Status** - Total budget vs. spent
- **Schedule Status** - On-time vs. delayed projects

### Project Health Chart

Visual representation of project status:
- 🟢 **Green** - On track (CPI > 0.9, SPI > 0.9)
- 🟡 **Amber** - At risk (CPI 0.8-0.9 or SPI 0.8-0.9)
- 🔴 **Red** - Critical (CPI < 0.8 or SPI < 0.8)

### Recent Agent Activity

Shows the latest interventions and recommendations from your 7 AI agents:
- 💰 **FinOps Agent** - Budget and cost monitoring
- ⏱️ **TMO Agent** - Timeline and schedule tracking
- ⚠️ **Risk Agent** - Risk identification
- ✅ **Governance Agent** - Compliance monitoring
- 🗓️ **Planning Agent** - Dependency management
- 🔄 **OCM Agent** - Change management
- 🎯 **Integrated Mgmt Agent** - Quality assurance

---

## Projects & Portfolios

### Viewing Projects

**Project List:**
1. Click **Projects** in the left sidebar
2. You'll see a table of all projects with key metrics:
   - Name
   - Status (Green/Amber/Red)
   - CPI (Cost Performance Index)
   - SPI (Schedule Performance Index)
   - Budget
   - Progress %
   - Owner

**Filtering Projects:**
- Use the filter bar at the top to filter by:
  - Portfolio
  - Status
  - Owner
  - Date range

**Sorting:**
- Click column headers to sort by that field
- Click again to reverse sort order

### Project Details

Click on any project to view detailed information:

**Overview Tab:**
- Project summary and description
- Key metrics (CPI, SPI, Budget, Schedule)
- Earned Value Management (EVM) charts
- Recent agent interventions

**Work Items Tab:**
- Epics
- Features
- User Stories
- Tasks

**Dependencies Tab:**
- Dependency network visualization
- Blocked dependencies
- Critical path items

**Resources Tab:**
- Team members and allocation
- Resource capacity and utilization
- Skills matrix

**Risks Tab:**
- Active risks with probability and impact
- Mitigation plans
- Risk trends over time

**Milestones Tab:**
- Upcoming milestones
- Completion status
- Milestone dependencies

**Timeline Tab:**
- Gantt chart view
- Critical path visualization
- Schedule variance

---

## AI Agents

### How Agents Work

Your platform includes 7 intelligent AI agents that continuously monitor your projects and create interventions when issues are detected.

**Agent Types:**

| Agent | Focus | Autonomy | Frequency |
|-------|-------|----------|-----------|
| **FinOps Agent** | Budget, cost, CPI | **Full Autonomy** | Every 30 min |
| **TMO Agent** | Schedule, timeline, SPI | **Full Autonomy** | Every 20 min |
| **Risk Agent** | Risk identification | Supervised | Every 60 min |
| **Governance Agent** | Compliance, approvals | Supervised | Every 2 hours |
| **Planning Agent** | Dependencies, capacity | Supervised | Every 30 min |
| **OCM Agent** | Change management | **Full Autonomy** | Every 45 min |
| **Integrated Mgmt Agent** | Quality, testing | **Full Autonomy** | Every 45 min |

**Autonomy Levels:**
- **Full Autonomy** - Agent can auto-approve and execute low-risk interventions
- **Supervised** - All interventions require human approval

### Viewing Agent Activity

1. Click **Agents** in the left sidebar
2. You'll see:
   - Agent execution history
   - Success/failure rates
   - Average execution time
   - Recent findings

**Agent Detail View:**
- Click on any agent to see:
  - Detailed execution logs
  - Tool calls made
  - LLM reasoning (via LangSmith integration)
  - Interventions created
  - Historical trends

### LangSmith Observability

For deep technical insights into agent decision-making:

1. Navigate to: https://smith.langchain.com/
2. Select project: `nextera-eto` or your configured project name
3. View:
   - Full execution traces
   - Tool calls and responses
   - LLM prompts and completions
   - Token usage
   - Execution time

---

## Interventions & Alerts

### What are Interventions?

Interventions are actionable recommendations created by AI agents when they detect issues in your projects.

**Intervention Types:**
- 💰 **Budget** - Cost overruns, budget variance
- ⏱️ **Timeline** - Schedule delays, missed milestones
- ⚠️ **Risk** - New risks, risk escalations
- ✅ **Governance** - Compliance issues, missing approvals
- 🗓️ **Dependency** - Blocked dependencies, conflicts
- 🔄 **Resource** - Over-allocation, capacity issues
- 🎯 **Quality** - Test failures, quality gate issues

### Reviewing Interventions

1. Click **Interventions** in the left sidebar
2. You'll see a list of all pending interventions

**Intervention Card:**
- Agent source (e.g., "FinOps Agent")
- Severity (Critical/High/Medium/Low)
- Title and description
- Project affected
- Recommended action
- Confidence score
- Created date

**Filtering Interventions:**
- By severity
- By agent
- By project
- By status (Pending/Approved/Dismissed)

### Acting on Interventions

**For Supervised Agent Interventions (Require Approval):**

1. Click on the intervention to view details
2. Review the agent's reasoning and recommendation
3. Click **View in LangSmith** to see full execution trace (optional)
4. Choose:
   - **Approve** - Execute the recommended action
   - **Dismiss** - Reject the intervention (with reason)
   - **Modify** - Adjust the recommendation before approval

**For Full Autonomy Agent Interventions (Auto-Approved):**

These interventions are automatically approved and executed by the agent. You can:
- View what actions were taken
- Provide feedback (helped/didn't help)
- Override if needed

### Intervention Workflow

```
Agent Detects Issue
       ↓
Creates Intervention
       ↓
[If Supervised]
  → Human Reviews → Approve/Dismiss
       ↓
[If Approved or Full Autonomy]
  → Action Executed
       ↓
Outcome Tracked
```

---

## Reports & Analytics

### Standard Reports

**Budget Performance Report:**
- CPI trends across all projects
- Budget variance by project
- Top 10 budget overruns
- Forecast to completion

**Schedule Performance Report:**
- SPI trends across all projects
- Schedule variance by project
- Critical path analysis
- Milestone completion rates

**Risk Report:**
- Active risks by severity
- Risk heat map
- Top risks by project
- Mitigation effectiveness

**Resource Utilization Report:**
- Team capacity vs. allocation
- Over-allocated resources
- Skills gap analysis
- Resource forecasting

**Quality Metrics Report:**
- Test coverage by project
- Defect density
- Quality gate pass rates
- Technical debt trends

### Custom Reports

1. Click **Reports** → **Create Custom Report**
2. Select data sources:
   - Projects
   - Interventions
   - Resources
   - Milestones
   - Dependencies
3. Choose metrics and dimensions
4. Apply filters
5. Select visualization (Table/Chart/Graph)
6. Save and schedule (optional)

### Exporting Data

**Export Options:**
- **CSV** - Spreadsheet format
- **PDF** - Formatted report
- **Excel** - With charts and formatting
- **PowerPoint** - Executive summary

**To Export:**
1. Open any report
2. Click **Export** button (top right)
3. Select format
4. Download

---

## Settings & Configuration

### Data Sources

**Connecting External Systems:**

1. Go to **Settings** → **Data Sources**
2. Click **Connect New Source**
3. Select system:
   - Jira
   - Azure DevOps
   - ServiceNow
   - Microsoft Project
   - Smartsheet
   - Custom API
4. Enter credentials
5. Select projects/boards to sync
6. Set sync frequency (5 min / 15 min / 30 min / 60 min)
7. Enable webhooks for real-time updates (recommended)

**Sync Status:**
- View last sync time
- Check sync logs
- Manually trigger sync

### Agent Configuration

**Adjusting Agent Behavior:**

1. Go to **Settings** → **Agents**
2. For each agent, you can configure:
   - **Scan Frequency** - How often agent runs (minutes)
   - **Severity Threshold** - Minimum severity for interventions
   - **Auto-Approval** - Enable/disable for full autonomy agents
   - **Notification Preferences** - Email/Slack/Teams

**Agent Tools:**
- View available tools for each agent
- Enable/disable specific tools
- Configure tool parameters

### Notification Settings

**Configure Alerts:**

1. Go to **Settings** → **Notifications**
2. Choose channels:
   - **Email** - Enter email addresses
   - **Slack** - Connect Slack workspace
   - **Microsoft Teams** - Connect Teams channel
   - **WebSocket** - Real-time in-app notifications
3. Set preferences:
   - Which agents to receive notifications from
   - Minimum severity level
   - Digest vs. real-time
   - Quiet hours

### User Management

**Adding Users:**

1. Go to **Settings** → **Users**
2. Click **Invite User**
3. Enter email address
4. Assign role:
   - **Admin** - Full access
   - **Portfolio Manager** - Manage portfolios
   - **Project Manager** - Manage assigned projects
   - **Viewer** - Read-only access
5. Send invitation

**Permissions:**
- View projects
- Edit projects
- Approve interventions
- Configure agents
- Manage users
- Access reports

---

## FAQ & Troubleshooting

### General Questions

**Q: How often do agents scan projects?**
A: Each agent has a different schedule:
- TMO: Every 20 minutes
- FinOps: Every 30 minutes
- Planning: Every 30 minutes
- OCM: Every 45 minutes
- Integrated Mgmt: Every 45 minutes
- Risk: Every 60 minutes
- Governance: Every 2 hours

**Q: Can I trigger an agent scan manually?**
A: Yes! Go to the Agents page, select an agent, and click "Run Scan Now". This is useful for testing or when you need immediate analysis.

**Q: What's the difference between Full Autonomy and Supervised agents?**
A:
- **Full Autonomy** agents (FinOps, TMO, OCM, Integrated Mgmt) can automatically approve and execute low-risk interventions without human approval.
- **Supervised** agents (Risk, Governance, Planning) always require human approval before any action is taken.

**Q: Where can I see the agent's reasoning?**
A: Click on any intervention, then click "View in LangSmith" to see the full execution trace, including LLM reasoning, tool calls, and decision-making process.

**Q: How accurate are agent recommendations?**
A: Each intervention includes a confidence score (0-100%). Agents use Claude Sonnet 4.5 and are trained on project management best practices. Typical confidence scores are 75-95%.

### Data & Integration

**Q: How long does it take for data to sync?**
A:
- **Webhooks (recommended)**: Real-time (seconds)
- **Polling**: Based on your sync frequency (5-60 minutes)
- **Manual import**: Immediate

**Q: What if my data source isn't supported?**
A: You can:
1. Use the REST API to import data programmatically
2. Use CSV/Excel bulk import
3. Request a custom integration (contact support)

**Q: Can I connect multiple Jira instances?**
A: Yes! You can connect multiple instances of the same system. Each connection appears as a separate data source.

**Q: How do I map custom fields from Jira/Azure?**
A: Go to Settings → Data Sources → [Your Source] → Field Mapping. You can map custom fields to platform fields or create new ones.

### Interventions & Approvals

**Q: What happens if I dismiss an intervention?**
A: Dismissed interventions are archived and marked as "Dismissed". The agent will not create the same intervention again for that specific issue. However, if the underlying problem persists or worsens, the agent may create a new intervention.

**Q: Can I modify an intervention before approving?**
A: Yes! Click "Modify" on any pending intervention to adjust the recommended action, priority, or assignee before approval.

**Q: Do Full Autonomy agents ever require approval?**
A: Yes, if the intervention is high-risk or above a certain budget threshold. You can configure these thresholds in Settings → Agents.

### Troubleshooting

**Problem: Agents not creating interventions**

**Solution:**
1. Check agent is enabled: Settings → Agents
2. Verify data is syncing: Settings → Data Sources → Check last sync
3. Check severity thresholds: Settings → Agents → [Agent] → Severity Threshold
4. Wait for next scheduled scan (agents don't run constantly)

**Problem: No data showing in dashboard**

**Solution:**
1. Verify data source is connected: Settings → Data Sources
2. Check sync status and logs
3. Manually trigger a sync
4. Verify you have projects in the connected system

**Problem: Webhooks not working**

**Solution:**
1. Verify webhook URL is correctly configured in source system (Jira/Azure)
2. Check firewall rules allow incoming webhooks
3. Review webhook logs: Settings → Data Sources → [Source] → Webhook Logs
4. Test webhook manually using the "Send Test" button

**Problem: Agent scan taking too long**

**Solution:**
1. Check LangSmith traces for bottlenecks
2. Reduce scan frequency if needed
3. Contact support if consistently slow (>60 seconds)

**Problem: Can't see LangSmith traces**

**Solution:**
1. Verify LANGCHAIN_API_KEY is configured
2. Verify LANGCHAIN_TRACING_V2=true
3. Check LangSmith project name matches configuration
4. Wait a few minutes for traces to appear (may be delayed)

---

## Keyboard Shortcuts

- `Ctrl+K` (or `Cmd+K`) - Quick search
- `Ctrl+/` - Show all shortcuts
- `G` then `D` - Go to Dashboard
- `G` then `P` - Go to Projects
- `G` then `A` - Go to Agents
- `G` then `I` - Go to Interventions
- `Esc` - Close modal/dialog

---

## Best Practices

### 1. Review Interventions Daily

Set aside 15-30 minutes each morning to review pending interventions. Address critical and high-severity items first.

### 2. Monitor Agent Activity

Check the Agents dashboard weekly to ensure all agents are running successfully and creating appropriate interventions.

### 3. Provide Agent Feedback

After an intervention is executed, mark it as "Helpful" or "Not Helpful" to train the agents over time.

### 4. Keep Data Sources Synchronized

Ensure your data sources (Jira, Azure, etc.) are syncing regularly. Enable webhooks for real-time updates.

### 5. Customize Agent Thresholds

Adjust agent severity thresholds based on your organization's risk tolerance. For example, if you're getting too many low-severity interventions, increase the threshold.

### 6. Use Custom Reports

Create custom reports for your specific needs rather than relying solely on standard reports. Save and schedule them for regular delivery.

### 7. Leverage LangSmith

When an intervention seems incorrect or unclear, view the LangSmith trace to understand the agent's reasoning. This helps you decide whether to approve or dismiss.

---

## Support & Resources

### Documentation

- **Technical Architecture Guide**: `TECHNICAL_ARCHITECTURE_GUIDE.md`
- **Data Ingestion Guide**: `DATA_INGESTION_GUIDE.md`
- **API Documentation**: http://localhost:5000/api-docs

### Getting Help

**In-App Support:**
- Click the "?" icon in the bottom right for help articles
- Use the chat widget for live support (business hours)

**Email Support:**
- support@nextera-eto.com

**LangSmith Community:**
- https://smith.langchain.com/community

**Feature Requests:**
- Submit via Settings → Feedback → Request Feature

---

## Glossary

- **CPI (Cost Performance Index)** - Earned Value / Actual Cost. >1.0 = under budget, <1.0 = over budget
- **SPI (Schedule Performance Index)** - Earned Value / Planned Value. >1.0 = ahead of schedule, <1.0 = behind
- **EVM (Earned Value Management)** - Method for measuring project performance
- **Intervention** - Actionable recommendation created by an AI agent
- **OBDA (Ontology-Based Data Access)** - Virtual data federation technology
- **MCP (Model Context Protocol)** - Standard for integrating external data sources
- **LangSmith** - Observability platform for AI agents
- **Full Autonomy** - Agent can auto-approve low-risk interventions
- **Supervised Autonomy** - Agent requires human approval for all interventions

---

## Version Information

**Platform Version**: 1.0.0
**Last Updated**: January 2025
**Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

---

**Thank you for using the NextEra Energy ETO/VRO Platform!** 🎉

For questions or feedback, contact your platform administrator or email support@nextera-eto.com.
