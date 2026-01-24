# Rally (Broadcom) Integration Setup Guide

## Overview

This guide explains how to connect your Rally workspace to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (5 Minutes)

### Step 1: Get Your Rally API Key

1. Log into Rally
2. Click your profile name → API Keys
3. Click **Create New API Key**
4. Name it "Dashboard Integration"
5. Set to Full Access
6. Copy the key (keep it private)

### Step 2: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Rally**
4. Paste your API key
5. Click **Test Connection**
6. Select workspaces and projects to sync

### Step 3: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Scheduled | Regular updates (hourly/daily) |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Rally | Dashboard (SAFe) |
|-------|------------------|
| Portfolio Item - Epic | Epic |
| Portfolio Item - Feature | Feature |
| User Story | Story |
| Task | Task |
| Defect | Issue |
| Iteration | Sprint |
| Release | Release |
| Milestone | Milestone |

### Rally SAFe Edition

If using Rally's SAFe features, additional mappings apply:

| Rally SAFe | Dashboard |
|------------|-----------|
| PI | Planning Interval |
| Team | Agile Team |
| ART | Agile Release Train |

---

## Frequently Asked Questions

### Do I need admin access?

**No.** Any Rally user can generate an API key. You sync what you have access to.

### How are Portfolio Items handled?

Rally's multi-level Portfolio Items (Theme → Epic → Feature) map directly to SAFe hierarchy.

### Can I sync multiple workspaces?

**Yes.** Select all workspaces during setup. Cross-workspace dependencies are preserved.

### What about custom Portfolio Item types?

Custom PI types are mapped during setup using dropdown menus.

---

## Troubleshooting

### "Authentication Failed"

1. Verify API key is correct
2. Check that API key has Full Access
3. Ensure account is active

### "Workspace Not Found"

1. Verify you have access to the workspace
2. Check workspace name spelling

### "Portfolio Items Missing"

1. Ensure your subscription includes Portfolio Manager
2. Check that Portfolio Items are visible to your account

---

*Last Updated: January 2026*
