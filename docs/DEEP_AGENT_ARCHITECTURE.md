# Deep Agent Architecture

**Last Updated:** January 25, 2026

## Overview

Deep Agents are enhanced AI agents with three core components:
1. **Specialized Capabilities** - Domain-specific tools and actions
2. **RAG Knowledge Base** - Per-agent document repository
3. **A2A Collaboration** - Agent-to-Agent messaging

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   DeepAgentOrchestrator                          │
│                    (A2A Message Bus)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DeepFinOpsAgent ──┐                                            │
│  DeepTMOAgent ─────┼──► Message Queue ──► Collaboration         │
│  DeepRiskAgent ────┤                                            │
│  DeepVROAgent ─────┤                                            │
│  DeepPMOAgent ─────┤                                            │
│  DeepOCMAgent ─────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  AgentRAGService      │
              │  (Knowledge Base)     │
              ├───────────────────────┤
              │  deep-finops:         │
              │    - Budget docs      │
              │    - EVM guides       │
              │                       │
              │  deep-pmo:            │
              │    - PMO Playbook     │
              │    - Governance docs  │
              │                       │
              │  deep-ocm:            │
              │    - ADKAR Model      │
              │    - Stakeholder docs │
              └───────────────────────┘
```

## 1. Specialized Capabilities (Domain-Specific Actions)

Each Deep Agent has 5-6 specialized tools that it can invoke:

### DeepPMOAgent - Project Management Office

| Capability | What It Does |
|-----------|--------------|
| `analyze_project_health` | Scans all projects for schedule/budget/scope variance |
| `track_milestones` | Monitors milestone completion, predicts delays |
| `optimize_resources` | Identifies over/under-allocated resources across portfolio |
| `enforce_governance` | Checks compliance with PMO standards, gates, approvals |
| `generate_status_report` | Creates executive dashboards and status summaries |

### DeepOCMAgent - Organizational Change Management

| Capability | What It Does |
|-----------|--------------|
| `assess_change_impact` | Analyzes how changes affect teams, processes, systems |
| `map_stakeholders` | Identifies stakeholders, influence levels, resistance points |
| `measure_adoption` | Tracks user adoption metrics, training completion |
| `recommend_interventions` | Suggests communications, training, support actions |
| `forecast_resistance` | Predicts change resistance hotspots |

### DeepFinOpsAgent - Financial Intelligence

| Capability | What It Does |
|-----------|--------------|
| `analyze_budget_variance` | Budget vs actual comparison |
| `calculate_evm_metrics` | Earned Value Management (CPI, SPI, EAC) |
| `forecast_burn_rate` | Budget burn rate and runway estimation |
| `recommend_cost_optimization` | Cost reduction strategies |

### DeepTMOAgent - Time Management Office

| Capability | What It Does |
|-----------|--------------|
| `analyze_schedule` | Schedule variance and timeline analysis |
| `optimize_timeline` | Timeline optimization recommendations |
| `track_milestones` | Milestone tracking and predictions |
| `analyze_critical_path` | Critical path analysis |

### DeepRiskAgent - Risk Management

| Capability | What It Does |
|-----------|--------------|
| `identify_risks` | Identifies project risks |
| `assess_risks` | Risk severity and impact assessment |
| `recommend_mitigations` | Mitigation strategies |
| `monitor_risks` | Ongoing risk monitoring |

### DeepVROAgent - Value Realization Office

| Capability | What It Does |
|-----------|--------------|
| `track_value_realization` | Benefits tracking |
| `measure_roi` | ROI calculations |
| `analyze_value` | Value delivery analysis |
| `optimize_value` | Value optimization strategies |

## 2. RAG Knowledge Base (Per-Agent Document Store)

Each agent has its own knowledge base with domain-specific documents:

```javascript
// Example: DeepPMOAgent knowledge base
{
  agentId: 'deep-pmo',
  documents: [
    'PMO Playbook.pdf',
    'Stage-Gate Process.docx',
    'Resource Management Guidelines.pdf',
    'Project Governance Standards.docx',
    'Quality Metrics Framework.pdf'
  ]
}

// Example: DeepOCMAgent knowledge base
{
  agentId: 'deep-ocm',
  documents: [
    'ADKAR Change Model.pdf',
    'Stakeholder Analysis Template.docx',
    'Communication Plan Templates.pdf',
    'Training Curriculum Standards.docx',
    'Resistance Management Guide.pdf'
  ]
}
```

When an agent reasons, it:
1. Receives a goal (e.g., "Analyze project health for Project X")
2. Retrieves relevant context from its knowledge base via RAG
3. Plans multi-step approach using its capabilities
4. Executes the plan
5. Reflects on the results

## 3. A2A Collaboration (Agent-to-Agent Messaging)

All 6 agents communicate via the **DeepAgentOrchestrator** message bus.

### Example Collaboration Flow:

```
1. DeepPMOAgent detects project is 30% over budget
   ├─► Sends A2A message to DeepFinOpsAgent:
   │   "Analyze cost overrun root causes for Project X"
   │
   └─► DeepFinOpsAgent responds with:
       {
         costDrivers: ['vendor overruns', 'scope creep'],
         recommendations: ['renegotiate vendor', 'freeze scope']
       }

2. DeepPMOAgent sends to DeepOCMAgent:
   ├─► "Assess change impact if we descope Feature Y"
   │
   └─► DeepOCMAgent returns:
       {
         stakeholderImpact: 'high',
         resistanceLevel: 'moderate',
         interventions: ['town hall', 'stakeholder 1-on-1s']
       }

3. DeepPMOAgent synthesizes insights and recommends action
```

### A2A Message Types:

- `request_collaboration` - Agent needs help from another agent
- `share_insight` - Agent sharing findings with others
- `request_plan_review` - Agent asking for plan validation
- `share_reflection` - Agent sharing lessons learned

## Agent Class Structure

```typescript
class DeepPMOAgent extends DeepAgentBase {
  // Identity
  agentId = 'deep-pmo'
  agentType = 'project_management_office'

  // Capabilities (callable actions)
  capabilities = [
    'analyze_project_health',
    'track_milestones',
    'optimize_resources',
    'enforce_governance',
    'generate_status_report'
  ]

  // RAG integration
  knowledgeBaseId = 'pmo-knowledge-base'

  // Planning & Reflection
  enablePlanning = true
  enableReflection = true
  maxPlanSteps = 8

  // A2A message handlers
  handleMessage(from: string, message: A2AMessage) {
    // Process message from other agents
  }

  // Tool definitions
  protected defineTools() {
    return [
      new DynamicStructuredTool({
        name: "analyze_project_health",
        description: "Scans all projects for variance",
        schema: z.object({ ... }),
        func: async ({ projectId }) => {
          // Implementation
        }
      }),
      // ... other tools
    ];
  }
}
```

## Planning & Reflection

Each Deep Agent can:

1. **Plan** - Break down complex goals into steps
   ```
   Goal: "Improve project delivery performance"

   Plan:
   1. Analyze current project health scores
   2. Identify common failure patterns
   3. Assess resource allocation efficiency
   4. Check governance compliance
   5. Generate recommendations
   ```

2. **Reflect** - Learn from execution results
   ```
   Reflection after execution:
   - "Resource optimization revealed 3 over-allocated PMs"
   - "Governance checks found missing approvals in 40% of projects"
   - "Should prioritize governance enforcement next time"
   ```

3. **Collaborate** - Request help when needed
   ```
   If budget issues detected:
   → Request collaboration with DeepFinOpsAgent

   If stakeholder resistance high:
   → Request collaboration with DeepOCMAgent
   ```

## Rule-Based Decision Making

Each agent has default rules and attributes:

```typescript
// PMO Agent Rules
{
  id: 'pmo-low-health-score',
  name: 'Low Project Health Score',
  conditions: [
    { attribute: 'projectHealthScore', operator: '<', threshold: 60 }
  ],
  actions: [
    {
      type: 'alert',
      targetAgents: ['risk', 'vro'],
      message: 'Project health below 60 - assessment needed'
    }
  ]
}
```

## API Endpoints

### List Deep Agents
```
GET /api/deep-agents

Response:
{
  agents: [
    {
      name: "deep-pmo",
      capabilities: [
        "Project health analysis",
        "Milestone tracking",
        "Resource optimization",
        "Governance enforcement",
        "Status report generation"
      ],
      features: {
        planning: true,
        reflection: true,
        a2aCollaboration: true
      }
    },
    ...
  ]
}
```

### Run Deep Agent
```
POST /api/deep-agents/run
{
  "agentName": "deep-pmo",
  "goal": "Analyze portfolio health and provide recommendations",
  "context": {
    "includeMetrics": true
  }
}

Response:
{
  result: {
    plan: [...],
    execution: {...},
    reflections: [...],
    a2aMessagesCreated: 2,
    collaborationHistory: [...]
  }
}
```

### Get A2A Messages
```
GET /api/deep-agents/messages?agent=deep-pmo

Response:
{
  messages: [
    {
      from: "deep-pmo",
      to: "deep-finops",
      messageType: "request_collaboration",
      payload: {...}
    }
  ]
}
```

## Files Structure

```
server/
├── agents/
│   ├── deep/
│   │   ├── DeepAgentBase.ts           # Base class for all deep agents
│   │   ├── DeepAgentOrchestrator.ts   # A2A message bus
│   │   ├── DeepFinOpsAgent.ts         # Financial intelligence
│   │   ├── DeepTMOAgent.ts            # Time management
│   │   ├── DeepRiskAgent.ts           # Risk management
│   │   ├── DeepVROAgent.ts            # Value realization
│   │   ├── DeepPMOAgent.ts            # Project management office
│   │   └── DeepOCMAgent.ts            # Change management
│   │
│   └── attributes/
│       ├── FinOpsAgentAttributes.ts   # FinOps rules & attributes
│       ├── TMOAgentAttributes.ts      # TMO rules & attributes
│       ├── RiskAgentAttributes.ts     # Risk rules & attributes
│       ├── VROAgentAttributes.ts      # VRO rules & attributes
│       ├── PMOAgentAttributes.ts      # PMO rules & attributes
│       └── OCMAgentAttributes.ts      # OCM rules & attributes
│
└── routes/
    └── deep-agents.ts                 # API endpoints
```

## Testing Deep Agents

### Example 1: Project Health Analysis
```bash
curl -X POST http://localhost:5000/api/deep-agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "deep-pmo",
    "goal": "Analyze health of all projects in portfolio",
    "context": {
      "includeMetrics": true
    }
  }'
```

### Example 2: Change Impact Assessment
```bash
curl -X POST http://localhost:5000/api/deep-agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "deep-ocm",
    "goal": "Assess impact of new project management system rollout",
    "context": {
      "changeId": "change-123",
      "impactAreas": ["teams", "processes", "systems", "culture"]
    }
  }'
```

## Next Steps

1. ✅ DeepPMOAgent and DeepOCMAgent implemented
2. Seed knowledge base documents for each agent
3. Build Retool Rule Editors for PMO and OCM agents
4. Test A2A collaboration flows
5. Add more specialized capabilities as needed

---

**Status:** ✅ 6 Deep Agents fully operational
**Server:** Running on port 5000
**Orchestrator:** `[DeepAgentOrchestrator] Initialized with 6 deep agents`
