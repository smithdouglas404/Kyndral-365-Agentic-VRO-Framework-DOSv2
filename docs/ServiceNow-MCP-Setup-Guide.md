# ServiceNow Integration Setup Guide

## Overview

This guide explains how to connect your ServiceNow instance to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (10 Minutes)

### Step 1: Gather Your ServiceNow Details

You'll need:
- **Instance URL**: Your ServiceNow URL (e.g., `yourcompany.service-now.com`)
- **Username**: A ServiceNow account with API access
- **Password**: Account password

### Step 2: Verify API Access

Your ServiceNow account needs these roles:
- `rest_api_explorer` (for API access)
- Access to Project, Demand, and Story tables

Contact your ServiceNow admin if you don't have these permissions.

### Step 3: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect ServiceNow**
4. Enter instance URL, username, and password
5. Click **Test Connection**
6. Select which record types to sync

### Step 4: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Scheduled | Regular updates (hourly/daily) |
| Business Rules | Real-time (requires ServiceNow config) |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| ServiceNow | Dashboard (SAFe) |
|------------|------------------|
| Project [pm_project] | Project |
| Demand [dmn_demand] | Epic |
| Story [rm_story] | Story |
| Task [task] | Task |
| Incident | Issue |
| Change Request | Change Request |
| Release [rm_release] | Release |

### ITSM vs ITBM

The system works with both ServiceNow modules:

| Module | Tables Used |
|--------|-------------|
| ITSM | Incidents, Changes, Problems |
| ITBM/SPM | Projects, Demands, Stories |

---

## Frequently Asked Questions

### Do I need admin access to ServiceNow?

**Usually no.** You need a user account with API access and read permissions on project tables. Your ServiceNow admin can grant this.

### Can I sync both ITSM and project data?

**Yes.** Select both during setup. Incidents map to Issues, Projects map to Projects.

### How are ServiceNow assignments handled?

Assigned To fields map to project owners and task assignees in the dashboard.

### What about custom tables?

Custom tables can be mapped during setup if they follow ServiceNow's standard schema.

---

## Troubleshooting

### "Authentication Failed"

1. Verify username and password
2. Check that account has API access role
3. Ensure instance URL is correct (no trailing slash)

### "Table Not Found"

1. Your instance may not have ITBM/SPM installed
2. Check with your ServiceNow admin about available modules

### "Permission Denied"

1. Your account lacks read access to required tables
2. Request `rest_api_explorer` role from admin

---

*Last Updated: January 2026*
