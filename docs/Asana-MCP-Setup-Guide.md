# Asana Integration Setup Guide

## Overview

This guide explains how to connect your Asana workspace to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (5 Minutes)

### Step 1: Get Your Asana Access Token

1. Go to https://app.asana.com/0/developer-console
2. Click **Create new token**
3. Name it "Dashboard Integration"
4. Copy the token (keep it private)

### Step 2: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Asana**
4. Paste your access token
5. Click **Test Connection**
6. Select which workspaces and projects to sync

### Step 3: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Scheduled | Regular updates (hourly/daily) |
| Webhook | Real-time updates |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Asana | Dashboard (SAFe) |
|-------|------------------|
| Workspace | Portfolio |
| Project | Project |
| Section | Feature |
| Task | Story |
| Subtask | Task |
| Milestone | Milestone |

### Asana Portfolios

If using Asana Portfolios:

| Asana | Dashboard |
|-------|-----------|
| Portfolio | Program |
| Portfolio Project | Project |

---

## Frequently Asked Questions

### Do I need admin access?

**No.** Any Asana user can create a Personal Access Token. You sync what you have access to.

### How are Asana sections handled?

Sections map to Features, grouping tasks logically within a project.

### Can I sync multiple workspaces?

**Yes.** Select all workspaces during setup. Each becomes a separate portfolio in the dashboard.

### What about Asana Goals?

Asana Goals map to OKR Objectives when synced.

---

## Troubleshooting

### "Authentication Failed"

1. Verify access token is correct
2. Tokens can be deauthorized - generate new one if needed
3. Check that your Asana account is active

### "Project Not Found"

1. Verify you're a member of the project
2. Check project permissions

### "Tasks Not Syncing"

1. Completed tasks may be filtered - check sync settings
2. Ensure tasks aren't in "My Tasks" only (not in a project)

---

*Last Updated: January 2026*
