# Complete PPM & Project Management Integration Guide

This comprehensive guide covers all supported project portfolio management (PPM) tools, from enterprise platforms to spreadsheets. Each section includes setup instructions, field mappings, and frequently asked questions.

---

## Table of Contents

1. [Enterprise PPM Tools](#enterprise-ppm-tools)
   - [Monday.com](#mondaycom)
   - [Jira](#jira)
   - [Azure DevOps](#azure-devops)
   - [ServiceNow](#servicenow)
   - [Planview](#planview)
   - [Rally (Broadcom)](#rally-broadcom)
   - [Microsoft Project Online](#microsoft-project-online)

2. [Collaborative Work Management](#collaborative-work-management)
   - [Asana](#asana)
   - [Smartsheet](#smartsheet)
   - [Wrike](#wrike)
   - [Basecamp](#basecamp)
   - [ClickUp](#clickup)
   - [Notion](#notion)
   - [Trello](#trello)
   - [Airtable](#airtable)

3. [Spreadsheet & File-Based Tools](#spreadsheet--file-based-tools)
   - [Microsoft Excel](#microsoft-excel)
   - [Google Sheets](#google-sheets)
   - [CSV Files](#csv-files)
   - [JSON/XML Files](#jsonxml-files)

4. [Specialized Tools](#specialized-tools)
   - [Targetprocess](#targetprocess)
   - [Aha!](#aha)
   - [ProductBoard](#productboard)
   - [Clarity PPM (Broadcom)](#clarity-ppm-broadcom)
   - [Workfront (Adobe)](#workfront-adobe)
   - [LiquidPlanner](#liquidplanner)

5. [General FAQ](#general-faq)

---

# Enterprise PPM Tools

---

## Monday.com

### Overview
Monday.com is a work operating system that powers teams to run projects and workflows with confidence. It maps well to SAFe hierarchies through its Board → Group → Item → Subitem structure.

### Quick Setup

1. **Get API Key**: Profile → Admin → API → Generate Token
2. **Connect**: Admin Workspace → Integrations → Connect Monday.com
3. **Paste Key**: Enter your API token
4. **Select Boards**: Choose which boards to sync
5. **Approve Mapping**: Confirm or adjust the suggested mappings

### Field Mapping

| Monday.com | Dashboard (SAFe) |
|------------|------------------|
| Board | Project |
| Group | Feature |
| Item | Story |
| Subitem | Task |
| Status Column | Project Status |
| Date Column | Timeline |
| People Column | Assignee |
| Numbers Column | Budget/Effort |

### FAQ

**Q: Do I need admin access to Monday.com?**
A: No. Any user can generate an API token from their profile settings.

**Q: How do I find my API key?**
A: Click your profile picture → Admin → API → Generate a new token.

**Q: Can I sync multiple boards?**
A: Yes. Select all boards you want during setup. Each can map to a separate project or be combined.

**Q: What if my board structure doesn't match the suggested mapping?**
A: Use the dropdown menus during setup to customize how each board/group/item type maps to SAFe entities.

**Q: How often does data sync?**
A: Choose from Manual (on-demand), Scheduled (hourly/daily), or Real-time (webhooks).

**Q: Are Monday.com automations preserved?**
A: The dashboard reads your data but doesn't interfere with Monday.com automations. They continue to work independently.

**Q: What happens if I delete an item in Monday.com?**
A: On next sync, the item will be marked as deleted/archived in the dashboard. Historical data is preserved.

---

## Jira

### Overview
Jira is the leading issue and project tracking tool for agile teams. It has native Epic → Story → Subtask hierarchy that maps directly to SAFe.

### Quick Setup

1. **Get API Token**: https://id.atlassian.com/manage-profile/security/api-tokens
2. **Gather Details**: 
   - Domain: `yourcompany.atlassian.net`
   - Email: Your Jira login email
   - Project Key: e.g., `PROJ`, `DEV`
3. **Connect**: Admin Workspace → Integrations → Connect Jira
4. **Test & Sync**: Verify connection and select projects

### Field Mapping

| Jira | Dashboard (SAFe) |
|------|------------------|
| Project | Portfolio |
| Epic | Epic |
| Story | Story |
| Task | Task |
| Sub-task | Sub-task |
| Bug | Issue |
| Sprint | Planning Interval |
| Fix Version | Release |
| Component | Capability |

### FAQ

**Q: Do I need Jira admin access?**
A: No for basic sync. Yes for webhook setup (real-time sync).

**Q: Which Jira editions work?**
A: Jira Cloud, Jira Server, and Jira Data Center are all supported.

**Q: Can I sync Jira Service Management tickets?**
A: Yes. Service requests map to Issues in the dashboard.

**Q: How are custom fields handled?**
A: Custom fields are detected during setup and can be mapped to dashboard properties.

**Q: What about Jira Advanced Roadmaps (formerly Portfolio)?**
A: Initiatives and child issues from Advanced Roadmaps sync along with standard issues.

**Q: Can I write back to Jira?**
A: Yes, bidirectional sync is supported. Changes in the dashboard can update Jira (with confirmation).

**Q: How are Jira boards different from projects?**
A: We sync Jira projects (the container). Boards are views of project data and don't affect what syncs.

---

## Azure DevOps

### Overview
Azure DevOps provides developer services including Boards, Repos, Pipelines, and more. The Boards module maps to SAFe through its work item hierarchy.

### Quick Setup

1. **Create PAT**: User Settings → Personal Access Tokens → New Token
   - Scopes needed: Work Items (Read/Write), Project (Read)
2. **Gather Details**:
   - Organization: From `dev.azure.com/yourorg`
   - Project: Project name
3. **Connect**: Admin Workspace → Integrations → Connect Azure DevOps
4. **Select Work Items**: Choose which types to sync

### Field Mapping

| Azure DevOps | Dashboard (SAFe) |
|--------------|------------------|
| Epic | Epic |
| Feature | Feature |
| Product Backlog Item | Story |
| User Story | Story |
| Task | Task |
| Bug | Issue |
| Iteration | Sprint |
| Area Path | Division |

### FAQ

**Q: Which process templates work?**
A: Agile, Scrum, CMMI, and custom templates are all supported. Mappings auto-adjust.

**Q: Can I sync Azure Repos or Pipelines?**
A: Currently we sync Boards only. Repo commits can be linked via work item references.

**Q: How are Area Paths handled?**
A: Area Paths map to organizational divisions, preserving your hierarchy.

**Q: What about Azure DevOps Server (on-premises)?**
A: Supported if accessible from the network. Contact admin for connection details.

**Q: Can I sync multiple projects?**
A: Yes. Add each project separately or sync an entire organization.

**Q: How do I set up real-time sync?**
A: Create a Service Hook in Azure DevOps pointing to the dashboard's webhook endpoint.

---

## ServiceNow

### Overview
ServiceNow provides IT service management (ITSM) and IT business management (ITBM). Both modules can sync to the dashboard.

### Quick Setup

1. **Gather Credentials**:
   - Instance URL: `yourcompany.service-now.com`
   - Username: Account with API access
   - Password: Account password
2. **Verify Permissions**: Need `rest_api_explorer` role
3. **Connect**: Admin Workspace → Integrations → Connect ServiceNow
4. **Select Tables**: Choose Projects, Demands, Stories, Incidents, etc.

### Field Mapping

| ServiceNow | Dashboard (SAFe) |
|------------|------------------|
| Project [pm_project] | Project |
| Demand [dmn_demand] | Epic |
| Story [rm_story] | Story |
| Task [task] | Task |
| Incident | Issue |
| Change Request | Change Request |
| Release | Release |

### FAQ

**Q: Do I need ServiceNow admin access?**
A: Not necessarily. You need API access role which your admin can grant.

**Q: ITSM vs ITBM - which do I need?**
A: Both work. ITSM syncs incidents/changes. ITBM/SPM syncs projects/demands/stories.

**Q: Can I sync custom tables?**
A: Yes, if they follow ServiceNow's standard schema with required fields.

**Q: How is assignment handled?**
A: The Assigned To field maps to project owner and task assignees.

**Q: What about CMDB data?**
A: Configuration items can be linked as dependencies or resources.

**Q: Real-time sync available?**
A: Yes, via Business Rules in ServiceNow (requires admin setup).

---

## Planview

### Overview
Planview offers enterprise portfolio and work management solutions including Planview Enterprise One, PPM Pro, and Portfolios.

### Quick Setup

1. **Get API Key**: Administration → API Settings → Generate Key
2. **Gather Details**:
   - Instance URL: `yourcompany.planview.com`
3. **Connect**: Admin Workspace → Integrations → Connect Planview
4. **Select Portfolios**: Choose which portfolios and programs to sync

### Field Mapping

| Planview | Dashboard (SAFe) |
|----------|------------------|
| Portfolio | Portfolio |
| Program | Program |
| Project | Project |
| Work Item | Feature/Story |
| Resource | Resource |
| Milestone | Milestone |
| Financial Data | Budget |

### FAQ

**Q: Which Planview products work?**
A: Enterprise One, PPM Pro, Portfolios, and AgilePlace (LeanKit) are supported.

**Q: Is resource/capacity data included?**
A: Yes. Resources, allocations, and capacity sync to the dashboard.

**Q: Can I sync financial data?**
A: Yes. Budgets, actuals, and forecasts sync to FinOps views.

**Q: Do I need admin access?**
A: Usually yes, for API key generation. Once generated, standard users can sync.

**Q: How are custom fields handled?**
A: Custom fields map during setup. Some may require manual mapping.

---

## Rally (Broadcom)

### Overview
Rally is an enterprise agile planning tool with native SAFe support including Portfolio Items, PIs, and ARTs.

### Quick Setup

1. **Get API Key**: Profile → API Keys → Create New API Key
2. **Connect**: Admin Workspace → Integrations → Connect Rally
3. **Select Workspaces**: Choose which workspaces and projects to sync

### Field Mapping

| Rally | Dashboard (SAFe) |
|-------|------------------|
| Portfolio Item - Epic | Epic |
| Portfolio Item - Feature | Feature |
| User Story | Story |
| Task | Task |
| Defect | Issue |
| Iteration | Sprint |
| Release | Release |
| PI (SAFe Edition) | Planning Interval |

### FAQ

**Q: Does Rally SAFe Edition map differently?**
A: Yes. SAFe-specific entities (PI, ART, Team) map to their dashboard equivalents.

**Q: Can I sync multiple workspaces?**
A: Yes. Cross-workspace dependencies are preserved.

**Q: What about custom Portfolio Item types?**
A: Custom PI types can be mapped during setup.

**Q: Is real-time sync available?**
A: Scheduled sync is recommended. Rally doesn't have native webhooks.

**Q: How are Rally tags handled?**
A: Tags sync as labels in the dashboard.

---

## Microsoft Project Online

### Overview
Microsoft Project Online provides cloud-based project management integrated with Microsoft 365. Setup requires Azure AD configuration.

### Quick Setup

1. **Register Azure AD App**: 
   - Azure Portal → Azure AD → App Registrations → New
   - Copy Client ID and Tenant ID
2. **Create Client Secret**: Certificates & secrets → New client secret
3. **Grant Permissions**: API Permissions → ProjectRead.All → Grant consent
4. **Connect**: Admin Workspace → Integrations → Connect MS Project
5. **Select Projects**: Choose which Project Online projects to sync

### Field Mapping

| MS Project | Dashboard (SAFe) |
|------------|------------------|
| Project | Project |
| Summary Task | Feature |
| Task | Story/Task |
| Milestone | Milestone |
| Resource | Resource |
| Baseline | Baseline |

### FAQ

**Q: Do I need Azure admin access?**
A: Yes, for initial app registration. Once registered, standard users can authenticate.

**Q: Project Desktop vs Project Online?**
A: Only Project Online and Project Server are supported. Desktop files must be exported.

**Q: Are baselines preserved?**
A: Yes. Baselines sync for variance tracking.

**Q: Can I sync Planner too?**
A: Planner is a separate integration but can be combined in the dashboard.

**Q: How are enterprise custom fields handled?**
A: Enterprise custom fields map to dashboard properties.

---

# Collaborative Work Management

---

## Asana

### Overview
Asana is a popular work management platform for teams. Its Project → Section → Task → Subtask hierarchy maps to SAFe.

### Quick Setup

1. **Get Token**: https://app.asana.com/0/developer-console → Create new token
2. **Connect**: Admin Workspace → Integrations → Connect Asana
3. **Select Projects**: Choose workspaces and projects to sync

### Field Mapping

| Asana | Dashboard (SAFe) |
|-------|------------------|
| Workspace | Portfolio |
| Project | Project |
| Section | Feature |
| Task | Story |
| Subtask | Task |
| Milestone | Milestone |
| Goal | OKR Objective |

### FAQ

**Q: Can I sync Asana Portfolios?**
A: Yes. Asana Portfolios map to Programs in the dashboard.

**Q: How are Asana Goals handled?**
A: Goals map to OKR Objectives.

**Q: What about completed tasks?**
A: By default, completed tasks sync. You can filter them in sync settings.

**Q: Do I need admin access?**
A: No. Any user can create a Personal Access Token.

---

## Smartsheet

### Overview
Smartsheet provides a spreadsheet-like interface for project management. Row hierarchy determines the SAFe mapping.

### Quick Setup

1. **Get Token**: Profile → Personal Settings → API Access → Generate token
2. **Connect**: Admin Workspace → Integrations → Connect Smartsheet
3. **Select Sheets**: Choose which sheets to sync

### Field Mapping

| Smartsheet | Dashboard (SAFe) |
|------------|------------------|
| Sheet | Project |
| Parent Row | Feature |
| Child Row | Story |
| Grandchild Row | Task |
| Status Column | Status |
| Date Column | Timeline |

### FAQ

**Q: How is row hierarchy detected?**
A: Indentation level determines the mapping. Top rows = Features, indented = Stories.

**Q: Can I sync multiple sheets?**
A: Yes. Each sheet becomes a separate project.

**Q: What column types work?**
A: Status, Date, Contact, Number, and Text columns are auto-detected.

**Q: Do formulas sync?**
A: Formula results sync. The dashboard doesn't execute Smartsheet formulas.

---

## Wrike

### Overview
Wrike is an enterprise work management platform with folders, projects, and tasks.

### Quick Setup

1. **Get Token**: Profile → Apps & Integrations → API → Create new token
2. **Connect**: Admin Workspace → Integrations → Connect Wrike
3. **Select Folders**: Choose which folders and projects to sync

### Field Mapping

| Wrike | Dashboard (SAFe) |
|-------|------------------|
| Space | Portfolio |
| Folder | Program |
| Project | Project |
| Task | Story |
| Subtask | Task |

### FAQ

**Q: How are Wrike spaces handled?**
A: Spaces map to Portfolios.

**Q: Can I sync Wrike calendars?**
A: Task dates sync. Calendar-specific views are reflected in timelines.

**Q: What about Wrike proofing?**
A: Proofing data doesn't sync (visual review tool).

---

## Basecamp

### Overview
Basecamp provides project management with to-do lists, message boards, and schedules.

### Quick Setup

1. **Get Token**: Basecamp ID → Integrations → Personal access tokens
2. **Connect**: Admin Workspace → Integrations → Connect Basecamp
3. **Select Projects**: Choose which Basecamp projects to sync

### Field Mapping

| Basecamp | Dashboard (SAFe) |
|----------|------------------|
| Project | Project |
| To-do List | Feature |
| To-do | Story/Task |
| Milestone | Milestone |
| Schedule Entry | Event |

### FAQ

**Q: What Basecamp version works?**
A: Basecamp 3 and Basecamp 4 are supported.

**Q: Are message boards synced?**
A: No. Only to-dos and schedules sync.

**Q: How are completed to-dos handled?**
A: Completed items sync as closed stories/tasks.

---

## ClickUp

### Overview
ClickUp offers a flexible workspace with Lists, Folders, and Tasks.

### Quick Setup

1. **Get Token**: Settings → Apps → Generate API token
2. **Connect**: Admin Workspace → Integrations → Connect ClickUp
3. **Select Spaces**: Choose which spaces and folders to sync

### Field Mapping

| ClickUp | Dashboard (SAFe) |
|---------|------------------|
| Space | Portfolio |
| Folder | Program |
| List | Project |
| Task | Story |
| Subtask | Task |
| Goal | OKR Objective |

### FAQ

**Q: How are ClickUp Goals synced?**
A: Goals map to OKR Objectives with targets as Key Results.

**Q: What about custom statuses?**
A: Custom statuses map to the dashboard's status workflow.

**Q: Can I sync multiple spaces?**
A: Yes. Select all spaces you want during setup.

---

## Notion

### Overview
Notion provides flexible databases that can be configured for project management.

### Quick Setup

1. **Create Integration**: https://www.notion.so/my-integrations → New integration
2. **Share Database**: Share your project database with the integration
3. **Connect**: Admin Workspace → Integrations → Connect Notion
4. **Select Databases**: Choose which databases to sync

### Field Mapping

| Notion | Dashboard (SAFe) |
|--------|------------------|
| Database | Project |
| Page (Parent) | Feature |
| Page (Child) | Story |
| Sub-page | Task |
| Status Property | Status |
| Date Property | Timeline |

### FAQ

**Q: Which Notion databases work?**
A: Any database with project/task-like properties (Status, Date, Assignee).

**Q: How are relations synced?**
A: Notion relations map to dependencies.

**Q: Can I use Notion templates?**
A: Templates don't sync. Only actual pages/entries sync.

**Q: What about Notion formulas?**
A: Formula results sync. The dashboard doesn't execute Notion formulas.

---

## Trello

### Overview
Trello provides Kanban-style boards with lists and cards.

### Quick Setup

1. **Get Token**: https://trello.com/power-ups/admin → Generate API key and token
2. **Connect**: Admin Workspace → Integrations → Connect Trello
3. **Select Boards**: Choose which boards to sync

### Field Mapping

| Trello | Dashboard (SAFe) |
|--------|------------------|
| Board | Project |
| List | Feature/Status |
| Card | Story |
| Checklist Item | Task |
| Label | Tag |

### FAQ

**Q: How are Trello lists mapped?**
A: Lists can map to Features (by grouping) or Status (by workflow).

**Q: What about Trello Power-Ups?**
A: Power-Up data may sync if it adds card properties.

**Q: Can I sync archived cards?**
A: By default, only active cards sync. Enable archived in settings.

---

## Airtable

### Overview
Airtable provides spreadsheet-database hybrids with flexible schemas.

### Quick Setup

1. **Get Token**: Account → Developer hub → Personal access tokens
2. **Connect**: Admin Workspace → Integrations → Connect Airtable
3. **Select Bases**: Choose which bases and tables to sync

### Field Mapping

| Airtable | Dashboard (SAFe) |
|----------|------------------|
| Base | Portfolio |
| Table | Project |
| Record (Parent) | Feature |
| Record (Child) | Story |
| Linked Record | Dependency |

### FAQ

**Q: How are linked records handled?**
A: Linked records map to dependencies between entities.

**Q: What field types work?**
A: Single select, Date, Number, and Text are auto-detected.

**Q: Can I sync multiple tables?**
A: Yes. Each table can map to a different entity type.

---

# Spreadsheet & File-Based Tools

---

## Microsoft Excel

### Overview
Excel files (.xlsx, .xls) can be imported directly. The dashboard interprets rows as work items based on column headers.

### Quick Setup

1. **Prepare File**: Ensure columns have headers (Name, Status, Date, etc.)
2. **Upload**: Admin Workspace → Integrations → Import Excel
3. **Map Columns**: Match Excel columns to dashboard fields
4. **Import**: Review and confirm

### Field Mapping

| Excel Column | Dashboard (SAFe) |
|--------------|------------------|
| Project/Name | Project Name |
| Status | Status |
| Owner/Assignee | Assignee |
| Start Date | Start Date |
| End Date | End Date |
| Budget | Budget |
| Parent | Creates hierarchy |

### FAQ

**Q: What Excel format works?**
A: .xlsx (Excel 2007+) and .xls (older) are supported.

**Q: Can I sync from SharePoint/OneDrive?**
A: Yes. Connect SharePoint, then select the Excel file.

**Q: How is hierarchy determined?**
A: Use a "Parent" column or row indentation. Or map all as flat list.

**Q: Can I do recurring syncs from Excel?**
A: If stored in SharePoint/OneDrive, yes. Local files are one-time imports.

**Q: What about Excel formulas?**
A: Formula results are imported, not the formulas themselves.

**Q: Multiple sheets in one file?**
A: Select which sheet to import. Each can be a separate project.

---

## Google Sheets

### Overview
Google Sheets can sync directly via the Google Sheets API.

### Quick Setup

1. **Authorize**: Admin Workspace → Integrations → Connect Google Sheets
2. **Select Sheet**: Choose from your Google Drive
3. **Map Columns**: Match sheet columns to dashboard fields
4. **Enable Sync**: Choose manual or scheduled

### Field Mapping

| Google Sheets | Dashboard (SAFe) |
|---------------|------------------|
| Row | Work Item |
| Column A | Name |
| Date Column | Timeline |
| Status Column | Status |
| Number Column | Budget/Effort |

### FAQ

**Q: Do I need Google Workspace admin?**
A: No. Any Google account with sheet access works.

**Q: Can I sync shared sheets?**
A: Yes, if you have at least view access.

**Q: How often can it sync?**
A: Manual, hourly, or daily. Real-time not available.

**Q: Are formulas preserved?**
A: Formula results sync. The dashboard doesn't execute Google formulas.

---

## CSV Files

### Overview
CSV (Comma-Separated Values) files provide the simplest import method for any data source.

### Quick Setup

1. **Export Data**: From any tool, export as CSV
2. **Upload**: Admin Workspace → Integrations → Import CSV
3. **Map Columns**: Match CSV headers to dashboard fields
4. **Import**: Review and confirm

### Field Mapping

First row must be headers. Common mappings:

| CSV Header | Dashboard Field |
|------------|-----------------|
| name, title, project | Project Name |
| status, state | Status |
| owner, assignee | Assignee |
| start, start_date | Start Date |
| end, due_date | End Date |
| budget, cost | Budget |
| parent, parent_id | Creates hierarchy |

### FAQ

**Q: What delimiter is supported?**
A: Comma (default), semicolon, and tab are supported.

**Q: How do I handle special characters?**
A: Ensure UTF-8 encoding. Wrap text with commas in quotes.

**Q: Can I import multiple CSVs at once?**
A: Yes. Batch import allows multiple files.

**Q: Maximum file size?**
A: 50MB per file. For larger files, split into multiple CSVs.

---

## JSON/XML Files

### Overview
JSON and XML files can be imported for more structured data.

### Quick Setup

1. **Prepare File**: Ensure valid JSON or XML format
2. **Upload**: Admin Workspace → Integrations → Import JSON/XML
3. **Map Structure**: Identify array/element containing work items
4. **Map Fields**: Match properties to dashboard fields
5. **Import**: Review and confirm

### JSON Example

```json
{
  "projects": [
    {
      "name": "Project Alpha",
      "status": "active",
      "budget": 500000,
      "tasks": [
        { "name": "Task 1", "status": "done" }
      ]
    }
  ]
}
```

### FAQ

**Q: Nested structures supported?**
A: Yes. Nested objects/arrays map to hierarchies.

**Q: What about XML namespaces?**
A: Namespaces are supported. Specify during mapping.

**Q: Can I import from API responses?**
A: Yes. Paste JSON directly or provide API endpoint.

---

# Specialized Tools

---

## Targetprocess

### Overview
Targetprocess provides visual portfolio and project management with native SAFe support.

### Quick Setup

1. **Get Token**: Settings → Access Tokens → Create Token
2. **Connect**: Admin Workspace → Integrations → Connect Targetprocess
3. **Select Projects**: Choose entities to sync

### Field Mapping

| Targetprocess | Dashboard (SAFe) |
|---------------|------------------|
| Portfolio Epic | Epic |
| Feature | Feature |
| User Story | Story |
| Task | Task |
| Bug | Issue |
| Release | Release |
| Team Iteration | Sprint |

### FAQ

**Q: Does SAFe Board data sync?**
A: Yes. SAFe-specific views and data are preserved.

**Q: What about custom entity types?**
A: Custom entities can be mapped during setup.

---

## Aha!

### Overview
Aha! provides product roadmapping and portfolio management.

### Quick Setup

1. **Get API Key**: Settings → Account → API key
2. **Connect**: Admin Workspace → Integrations → Connect Aha!
3. **Select Products**: Choose which products and initiatives to sync

### Field Mapping

| Aha! | Dashboard (SAFe) |
|------|------------------|
| Product | Portfolio |
| Initiative | Epic |
| Feature | Feature |
| Requirement | Story |
| Release | Release |
| Goal | OKR Objective |

### FAQ

**Q: Are Aha! ideas synced?**
A: Ideas can be included if promoted to features.

**Q: How are roadmaps handled?**
A: Roadmap dates sync as timeline data.

---

## ProductBoard

### Overview
ProductBoard provides product management with customer feedback integration.

### Quick Setup

1. **Get Token**: Settings → Integrations → Public API → Generate token
2. **Connect**: Admin Workspace → Integrations → Connect ProductBoard
3. **Select Products**: Choose which products to sync

### Field Mapping

| ProductBoard | Dashboard (SAFe) |
|--------------|------------------|
| Product | Project |
| Feature | Feature |
| Sub-feature | Story |
| Objective | OKR Objective |

### FAQ

**Q: Is customer feedback included?**
A: Feedback metrics (votes, impact) can sync as value scores.

**Q: How are prioritization scores handled?**
A: Value and effort scores sync to influence AI recommendations.

---

## Clarity PPM (Broadcom)

### Overview
Clarity PPM (formerly CA PPM) provides enterprise portfolio management.

### Quick Setup

1. **Get Credentials**: Admin provides API access credentials
2. **Connect**: Admin Workspace → Integrations → Connect Clarity
3. **Select Investments**: Choose projects and ideas to sync

### Field Mapping

| Clarity | Dashboard (SAFe) |
|---------|------------------|
| Portfolio | Portfolio |
| Program | Program |
| Project | Project |
| Task | Task |
| Resource | Resource |
| Timesheet | Time Entry |

### FAQ

**Q: Is financial data included?**
A: Yes. Budgets, actuals, and forecasts sync.

**Q: What about ideas/demands?**
A: Ideas map to proposed projects for pipeline analysis.

---

## Workfront (Adobe)

### Overview
Adobe Workfront provides enterprise work management.

### Quick Setup

1. **Get API Key**: Setup → System → Customer Info → API Key
2. **Connect**: Admin Workspace → Integrations → Connect Workfront
3. **Select Portfolios**: Choose which portfolios and projects to sync

### Field Mapping

| Workfront | Dashboard (SAFe) |
|-----------|------------------|
| Portfolio | Portfolio |
| Program | Program |
| Project | Project |
| Task | Story/Task |
| Issue | Issue |
| Request | Request |

### FAQ

**Q: Are Workfront proofs included?**
A: Proof status syncs. Proof content doesn't.

**Q: How are resource pools handled?**
A: Resources and allocations sync for capacity planning.

---

## LiquidPlanner

### Overview
LiquidPlanner provides predictive project scheduling with range-based estimates.

### Quick Setup

1. **Get Token**: Settings → API → Generate Token
2. **Connect**: Admin Workspace → Integrations → Connect LiquidPlanner
3. **Select Workspaces**: Choose which workspaces to sync

### Field Mapping

| LiquidPlanner | Dashboard (SAFe) |
|---------------|------------------|
| Workspace | Portfolio |
| Package | Project |
| Task | Story |
| Milestone | Milestone |
| Expected Finish | Timeline (probabilistic) |

### FAQ

**Q: Are probability ranges preserved?**
A: Yes. Expected dates include confidence intervals.

**Q: How is scheduling uncertainty shown?**
A: Range estimates display in timeline views.

---

# General FAQ

## Getting Started

**Q: Which tool should I connect first?**
A: Start with your primary PPM tool (where most projects live). You can add others later.

**Q: Can I connect multiple tools at once?**
A: Yes. All data appears in a unified dashboard regardless of source.

**Q: Do I need IT help?**
A: Usually no. Most tools just need an API key from your user settings.

## Data & Syncing

**Q: How often does data sync?**
A: Depends on your chosen mode: Manual (on-demand), Scheduled (hourly/daily), or Real-time (where available).

**Q: What if data conflicts between tools?**
A: The dashboard uses last-write-wins by default. You can configure conflict resolution rules.

**Q: Is my data copied or just linked?**
A: Data is copied to enable cross-tool analysis. Original data stays in your tool.

**Q: Can I write back to my PPM tool?**
A: Bidirectional sync is available for most tools (Jira, Azure DevOps, Monday, Asana, etc.).

## Mapping & Schema

**Q: What if my tool doesn't match SAFe hierarchy?**
A: The mapping wizard lets you define custom mappings. Not everything needs to be SAFe.

**Q: Are custom fields supported?**
A: Yes. Custom fields from any tool can be mapped during setup.

**Q: What if I'm missing required fields?**
A: Nothing is strictly required. AI agents help identify and fill gaps.

## Security & Access

**Q: Are my API keys secure?**
A: Yes. Keys are encrypted and stored securely. You can revoke access anytime.

**Q: Who can see my synced data?**
A: Only users with dashboard access. Role-based permissions apply.

**Q: Can I limit what syncs?**
A: Yes. Select specific projects, boards, or workspaces during setup.

## AI & Agents

**Q: Do AI agents work with all tools?**
A: Yes. Agents analyze all data regardless of source.

**Q: How do agents handle tool-specific data?**
A: The ontology normalizes data. Agents see unified entities.

---

*Last Updated: January 2026*
