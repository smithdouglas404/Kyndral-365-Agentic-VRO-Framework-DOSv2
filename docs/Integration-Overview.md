# MCP Integration Overview

## Supported Integrations

The NextEra Enterprise Transformation Dashboard connects to 9 major PPM (Project Portfolio Management) tools via the Model Context Protocol (MCP).

| Integration | Auth Method | Real-time? | Setup Time |
|-------------|-------------|------------|------------|
| [Monday.com](Monday-MCP-Setup-Guide.md) | API Key | ✅ Webhook | 5 min |
| [Jira](Jira-MCP-Setup-Guide.md) | API Token + Email | ✅ Webhook | 5 min |
| [Azure DevOps](AzureDevOps-MCP-Setup-Guide.md) | Personal Access Token | ✅ Service Hook | 5 min |
| [ServiceNow](ServiceNow-MCP-Setup-Guide.md) | Username/Password | ⚠️ Business Rules | 10 min |
| [Planview](Planview-MCP-Setup-Guide.md) | API Key | ❌ Scheduled | 10 min |
| [Smartsheet](Smartsheet-MCP-Setup-Guide.md) | Access Token | ✅ Webhook | 5 min |
| [Rally](Rally-MCP-Setup-Guide.md) | API Key | ❌ Scheduled | 5 min |
| [Asana](Asana-MCP-Setup-Guide.md) | Access Token | ✅ Webhook | 5 min |
| [MS Project](MSProject-MCP-Setup-Guide.md) | Azure AD OAuth | ❌ Scheduled | 15 min |

---

## How It Works

```
External PPM Tool          Dashboard                    AI Agents
─────────────────         ─────────                    ──────────
                              │
Monday.com ────┐              │
Jira ──────────┤              │
Azure DevOps ──┤   ──────►    │   ──────►   9 Specialized
ServiceNow ────┤    MCP       │   Unified   Agents analyze
Planview ──────┤   Sync       │    Data     all projects
Smartsheet ────┤              │   Model     together
Rally ─────────┤              │
Asana ─────────┤              │
MS Project ────┘              │
```

---

## Multi-Tool Support

You can connect **multiple tools simultaneously**:

- Project A comes from Monday.com
- Project B comes from Jira
- Project C comes from Azure DevOps

All projects appear in a **unified dashboard** with:
- Combined portfolio views
- Cross-tool dependency tracking
- AI agents analyzing everything together

---

## SAFe Ontology Mapping

All tools map to the same SAFe 6.0 structure:

| Level | SAFe Entity | Maps From |
|-------|-------------|-----------|
| 1 | Portfolio | Workspace, Organization |
| 2 | Epic | Epic, Demand, Initiative |
| 3 | Feature | Feature, Group, Section |
| 4 | Story | Story, Item, Task, PBI |
| 5 | Task | Subtask, Subitem |

---

## Common Questions

### Can I use multiple tools at once?
**Yes.** Each tool syncs independently. Projects from all sources appear together.

### Do I need technical help?
**Usually no.** Most integrations are self-service with API keys. Only MS Project requires Azure AD setup.

### What if my tool isn't listed?
Contact your administrator. Custom integrations can be built using the MCP framework.

### How often does data sync?
- **Manual**: On-demand
- **Scheduled**: Hourly or daily
- **Real-time**: Within seconds (where supported)

---

## Getting Started

1. Choose your tool from the list above
2. Follow the setup guide
3. Test the connection
4. Select projects to sync
5. Configure sync schedule

Your data will appear in the dashboard within minutes.

---

*Last Updated: January 2026*
