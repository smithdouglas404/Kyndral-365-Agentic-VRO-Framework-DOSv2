# Smartsheet Integration Setup Guide

## Overview

This guide explains how to connect your Smartsheet workspace to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (5 Minutes)

### Step 1: Get Your Smartsheet Access Token

1. Log into Smartsheet
2. Click your profile icon → Personal Settings
3. Go to **API Access** tab
4. Click **Generate new access token**
5. Copy the token (keep it private)

### Step 2: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Smartsheet**
4. Paste your access token
5. Click **Test Connection**
6. Select which sheets to sync

### Step 3: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Scheduled | Regular updates (hourly/daily) |
| Webhook | Real-time updates |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Smartsheet | Dashboard (SAFe) |
|------------|------------------|
| Sheet | Project |
| Row (Parent) | Feature |
| Row (Child) | Story |
| Row (Grandchild) | Task |
| Status Column | Status |
| Date Column | Timeline |
| Contact Column | Assignee |

### Hierarchy Detection

Smartsheet's row hierarchy is automatically detected:
- Top-level rows → Features
- Indented rows → Stories
- Double-indented rows → Tasks

---

## Frequently Asked Questions

### Do I need admin access?

**No.** Any user with sheet access can generate an access token. You only sync sheets you have permission to view.

### How are Smartsheet columns mapped?

The system auto-detects common column types:
- Status/Dropdown → Project Status
- Date → Timeline
- Contact → Assignee
- Number → Budget/Effort

### Can I sync multiple sheets?

**Yes.** Select all sheets during setup. Each sheet becomes a separate project.

### What about Smartsheet workspaces?

Workspaces are scanned for sheets. You choose which sheets to import regardless of workspace structure.

---

## Troubleshooting

### "Authentication Failed"

1. Verify access token is correct
2. Tokens expire - generate a new one if needed
3. Check that API access is enabled for your account

### "Sheet Not Found"

1. Verify you have access to the sheet
2. Shared sheets require the owner to grant access

### "Columns Not Mapping"

1. Ensure columns have consistent data types
2. Rename ambiguous columns to match expected types (Status, Date, etc.)

---

*Last Updated: January 2026*
