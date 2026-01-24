# Azure DevOps Integration Setup Guide

## Overview

This guide explains how to connect your Azure DevOps organization to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (5 Minutes)

### Step 1: Create a Personal Access Token (PAT)

1. Go to Azure DevOps → User Settings (gear icon) → Personal Access Tokens
2. Click **New Token**
3. Name it "Dashboard Integration"
4. Set expiration (recommend 1 year)
5. Scopes: Select **Work Items (Read & Write)**, **Project (Read)**
6. Click **Create** and copy the token

### Step 2: Gather Your Azure DevOps Details

You'll need:
- **Organization**: Your org name (from `dev.azure.com/yourorg`)
- **Project**: The project name to sync
- **PAT**: From Step 1

### Step 3: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Azure DevOps**
4. Enter organization, project, and PAT
5. Click **Test Connection**
6. Select work item types to sync

### Step 4: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Hourly | Regular updates |
| Real-time (Service Hook) | Live collaboration |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Azure DevOps | Dashboard (SAFe) |
|--------------|------------------|
| Epic | Epic |
| Feature | Feature |
| Product Backlog Item | Story |
| User Story | Story |
| Task | Task |
| Bug | Issue |
| Sprint/Iteration | Planning Interval |
| Area Path | Division |

### Agile vs Scrum vs CMMI

The system auto-detects your process template and adjusts mappings:

| Template | PBI Type |
|----------|----------|
| Agile | User Story |
| Scrum | Product Backlog Item |
| CMMI | Requirement |

---

## Frequently Asked Questions

### Do I need admin access?

**No.** A standard user with project access can set up the integration. Admin is only needed for service hooks (real-time sync).

### Can I sync multiple projects?

**Yes.** Add each project separately, or sync an entire organization.

### How are Area Paths handled?

Area Paths map to Divisions in the dashboard, preserving your organizational hierarchy.

### What about custom work item types?

Custom types can be mapped to standard SAFe entities during setup using dropdown menus.

---

## Troubleshooting

### "Authentication Failed"

1. Verify PAT hasn't expired
2. Ensure PAT has correct scopes
3. Check organization name spelling

### "Project Not Found"

1. Verify project name is exact (case-sensitive)
2. Ensure your account has access

### "Work Items Not Syncing"

1. Check that work item types are mapped
2. Verify query permissions

---

*Last Updated: January 2026*
