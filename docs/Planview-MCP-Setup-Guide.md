# Planview Integration Setup Guide

## Overview

This guide explains how to connect your Planview instance to the NextEra Enterprise Transformation Dashboard. No technical expertise required.

---

## Quick Start (10 Minutes)

### Step 1: Get Your Planview API Key

1. Log into Planview
2. Go to Administration → API Settings
3. Generate a new API key
4. Copy the key (keep it private)

### Step 2: Gather Your Planview Details

You'll need:
- **Instance URL**: Your Planview URL (e.g., `yourcompany.planview.com`)
- **API Key**: From Step 1

### Step 3: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Planview**
4. Enter instance URL and API key
5. Click **Test Connection**
6. Select portfolios and programs to sync

### Step 4: Choose Sync Mode

| Mode | Best For |
|------|----------|
| Manual | Testing, occasional updates |
| Scheduled | Regular updates (hourly/daily) |

---

## Field Mapping Reference

### Default Mappings (Automatic)

| Planview | Dashboard (SAFe) |
|----------|------------------|
| Portfolio | Portfolio |
| Program | Program |
| Project | Project |
| Work Item | Feature/Story |
| Resource | Resource |
| Milestone | Milestone |

### Planview Products Supported

| Product | Supported |
|---------|-----------|
| Planview Enterprise One | ✅ Yes |
| Planview PPM Pro | ✅ Yes |
| Planview Portfolios | ✅ Yes |
| Planview AgilePlace (LeanKit) | ✅ Yes |

---

## Frequently Asked Questions

### Do I need admin access?

**Depends.** API key generation usually requires admin access. Once you have the key, standard user permissions work.

### Can I sync multiple portfolios?

**Yes.** Select all portfolios during setup. Each maintains its hierarchy in the dashboard.

### How is resource data handled?

Planview resources map to dashboard resources, including allocations and capacity.

---

## Troubleshooting

### "Authentication Failed"

1. Verify API key is correct
2. Check that API access is enabled for your instance
3. Ensure instance URL is correct

### "Portfolio Not Found"

1. Verify your account has access to the portfolio
2. Check portfolio name spelling

---

*Last Updated: January 2026*
