# Microsoft Project Online Integration Setup Guide

## Overview

This guide explains how to connect your Microsoft Project Online to the NextEra Enterprise Transformation Dashboard. This integration requires Azure AD setup.

---

## Quick Start (15 Minutes)

### Step 1: Register an Azure AD Application

1. Go to Azure Portal → Azure Active Directory → App Registrations
2. Click **New registration**
3. Name: "Dashboard Integration"
4. Supported account types: Single tenant
5. Click **Register**
6. Copy the **Application (client) ID** and **Directory (tenant) ID**

### Step 2: Create Client Secret

1. In your new app, go to **Certificates & secrets**
2. Click **New client secret**
3. Set expiration (recommend 24 months)
4. Copy the secret value immediately (shown only once)

### Step 3: Grant API Permissions

1. Go to **API Permissions**
2. Click **Add a permission** → Microsoft Graph
3. Add: `ProjectRead.All`, `User.Read`
4. Click **Grant admin consent**

### Step 4: Connect to Dashboard

1. Log into the Dashboard
2. Go to **Admin Workspace** → **Integrations** tab
3. Click **Connect Microsoft Project**
4. Enter Tenant ID, Client ID, and Client Secret
5. Click **Test Connection**
6. Select projects to sync

---

## Field Mapping Reference

### Default Mappings (Automatic)

| MS Project | Dashboard (SAFe) |
|------------|------------------|
| Project | Project |
| Summary Task | Feature |
| Task | Story/Task |
| Milestone | Milestone |
| Resource | Resource |
| Bucket | Feature Group |

### Project Server vs Project Online

| Version | Supported |
|---------|-----------|
| Project Online | ✅ Yes |
| Project Server 2019 | ✅ Yes (on-premises) |
| Project Server 2016 | ⚠️ Limited |
| Project Desktop | ❌ No (use export) |

---

## Frequently Asked Questions

### Do I need admin access?

**Yes, partially.** Azure AD app registration requires admin access. Once registered, the app can be used by any authorized user.

### Can I sync Project Online plans and Planner?

**Yes.** Both are supported through different endpoints but consolidated in the dashboard.

### How are MS Project baselines handled?

Baselines are imported and tracked for variance analysis.

### What about custom fields?

Enterprise custom fields map to custom properties in the dashboard.

---

## Troubleshooting

### "Authentication Failed"

1. Verify Tenant ID, Client ID, and Client Secret
2. Check that admin consent was granted
3. Ensure client secret hasn't expired

### "Insufficient Permissions"

1. Verify API permissions include ProjectRead.All
2. Admin consent must be granted

### "Project Not Found"

1. Ensure the project is published to Project Online
2. Check that your account has access

---

*Last Updated: January 2026*
