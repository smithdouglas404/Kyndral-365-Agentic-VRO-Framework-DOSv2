# Jira Integration Setup Guide

## Overview

This guide explains how to connect your Jira workspace to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (5 Minutes)

### Step 1: Get Your Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Name it "Dashboard Integration"
4. Copy the token (keep it private)

### Step 2: Gather Your Jira Details

You'll need:
- **Domain**: Your Jira URL (e.g., `yourcompany.atlassian.net`)
- **Email**: Your Jira account email
- **API Token**: From Step 1
- **Project Key**: The short code for your project (e.g., `PROJ`, `DEV`)

### Step 3: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Jira**
4. Enter your domain, email, and API token
5. Click **Test Connection**
6. Select which projects to sync

### Step 4: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Hourly | Regular updates, low API usage |
| Real-time (Webhook) | Live collaboration, instant updates |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Jira | Dashboard (SAFe) |
|------|------------------|
| Project | Portfolio |
| Epic | Epic |
| Story | Story |
| Task | Task |
| Sub-task | Sub-task |
| Bug | Issue |
| Status | Project Status |
| Sprint | Planning Interval |
| Fix Version | Release |

### Custom Fields

Jira custom fields can be mapped during setup:
- Story Points → Effort
- Business Value → Value Score
- Custom dropdowns → Tags

---

## Frequently Asked Questions

### Do I need admin access to Jira?

**No.** You only need a user account with access to the projects you want to sync. However, admin access is needed for webhook setup (real-time sync).

### What Jira editions are supported?

| Edition | Supported |
|---------|-----------|
| Jira Cloud | ✅ Yes |
| Jira Server | ✅ Yes (requires network access) |
| Jira Data Center | ✅ Yes |

### Can I sync multiple Jira projects?

**Yes.** During setup, select all projects you want to include. Each becomes a separate project in the dashboard.

### How are Jira Epics handled?

Jira Epics map directly to SAFe Epics. Stories under an Epic maintain their parent relationship in the dashboard.

---

## Troubleshooting

### "Authentication Failed"

1. Verify your email matches your Jira account
2. Ensure the API token is correct (regenerate if needed)
3. Check that your account has access to the project

### "Project Not Found"

1. Verify the project key is correct (case-sensitive)
2. Ensure your account has access to the project

### "Webhook Connection Failed"

1. Webhooks require Jira admin access
2. Use scheduled sync as an alternative

---

*Last Updated: January 2026*
