# Monday.com Integration Setup Guide

## Overview

This guide explains how to connect your Monday.com workspace to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (5 Minutes)

### Step 1: Get Your Monday.com API Key

1. Log into Monday.com
2. Click your profile picture (bottom left)
3. Go to **Administration** → **Connections** → **API**
4. Click **Generate** to create a new API token
5. Copy the token (keep it private)

### Step 2: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Monday.com**
4. Paste your API key
5. Click **Test Connection**
6. You'll see: ✅ "Connected - Found X boards"

### Step 3: Select Boards to Sync

The system will show all your Monday.com boards. Select which ones to import:

| Your Board | Maps To |
|------------|---------|
| Epics | Projects |
| Stories | Features |
| Tasks | Tasks |
| Bugs Queue | Issues |
| OKRs | Objectives |

Click **Approve Mapping** or adjust using the dropdowns.

### Step 4: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Hourly | Regular updates, low API usage |
| Real-time | Live collaboration, instant updates |

---

## Frequently Asked Questions

### Do I need a technical person to set this up?

**No.** The entire setup is done through the web interface with no coding required.

### What if my Monday.com boards don't have all the fields?

**That's fine.** The system works with whatever data you have:

- Missing budget? Marked as "Unknown" - you can add later
- Missing dates? Agents will flag for attention
- Missing OKRs? AI will suggest OKRs based on project name

The AI agents help **identify and fill gaps**, not block your work.

### How do new Monday.com projects appear in the dashboard?

Depends on your sync mode:

- **Manual:** Click "Sync Now" when you want updates
- **Scheduled:** New projects appear within the hour
- **Real-time:** New projects appear within seconds

### What if I use both Monday.com AND Jira?

**Both work together.** You can connect multiple tools:

- All projects appear in one unified dashboard
- AI agents see everything regardless of source
- Cross-tool dependencies are supported
- Portfolio views combine data from all sources

### Can Monday.com projects reference Jira projects?

**Yes.** The system uses a unified data model. A Monday.com epic can depend on a Jira story, and the AI agents will understand the relationship.

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Monday.com | Dashboard (SAFe) |
|------------|------------------|
| Board | Project |
| Group | Feature |
| Item | Story |
| Subitem | Task |
| Status column | Project Status |
| Date column | Timeline |
| People column | Assignee |
| Numbers column | Budget (if labeled) |

### Custom Mappings

During setup, you can customize any mapping:

1. Click the dropdown next to any Monday.com field
2. Select the corresponding Dashboard field
3. Click Save

---

## Sync Status Indicators

| Icon | Meaning |
|------|---------|
| 🟢 | Synced successfully |
| 🟡 | Sync in progress |
| 🔴 | Sync error - check connection |
| ⏸️ | Sync paused |

---

## Troubleshooting

### "Connection Failed"

1. Verify your API key is correct
2. Check that your Monday.com account has API access enabled
3. Try generating a new API key

### "No Boards Found"

1. Ensure your API key has access to the workspace
2. Check that you have at least one board in Monday.com

### "Mapping Error"

1. Some fields couldn't be auto-mapped
2. Use the dropdown to manually select the correct mapping
3. Fields can be left unmapped (data will be stored but not categorized)

---

## Support

For additional help:
- Contact your Dashboard administrator
- Check the Admin → System → Logs for detailed sync information

---

*Last Updated: January 2026*
