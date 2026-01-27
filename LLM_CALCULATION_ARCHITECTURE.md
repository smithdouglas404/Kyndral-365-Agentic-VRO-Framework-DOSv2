Human: # 🧠 LLM Calculation Architecture

## The Revolutionary Change

### ❌ OLD WAY (Hardcoded Math)
```typescript
// System-level calculation
const variance = (actualCost - budget) / budget;

if (variance > 0.20) {
  alert("Budget overrun!");
}
```

**Problems**:
- Just a number, no explanation
- No sourcing
- No reasoning
- Brittle formulas
- Hard to maintain

### ✅ NEW WAY (LLM Calculates + Narratives)
```typescript
// LLM calculation with narrative
const result = await llmCalculator.calculateBudgetVariance({
  budget: 1000000,
  actualCost: 1250000,
  projectName: 'ERP Migration'
});

// Returns:
{
  value: 0.25,
  narrative: "Project is 25% over budget due to extended timeline requiring 3 additional resources and unexpected infrastructure costs",
  reasoning: "Actual cost ($1.25M) exceeds budget ($1M) by $250K. Primary drivers: timeline extension (40% of overrun) and infrastructure (60% of overrun)",
  sources: ["budget", "actualCost", "timeline", "resourceCost"],
  confidence: 0.95
}
```

**Benefits**:
- ✅ Value + Explanation
- ✅ Sourcing (audit trail)
- ✅ Reasoning (why this makes sense)
- ✅ Confidence score
- ✅ Human-readable
- ✅ No hardcoded formulas

## Agent Attributes Are Calculated by LLM

### PMO Agent (PPM Best Practices)

**Produces** (with LLM calculation):
- `wip_score` - Work In Progress efficiency
- `project_health_score` - Holistic project health
- `dependency_health` - Cross-project dependency status
- `resource_utilization` - Team capacity utilization
- `quality_score` - Quality and predictability
- `portfolio_health` - Aggregated portfolio status

**Consumes** (from other agents):
- `budget_variance` (from FinOps) - with narrative
- `schedule_delay` (from TMO) - with narrative
- `risk_score` (from Risk) - with narrative
- `value_score` (from VRO) - with narrative

### Agent-to-Agent Data Exchange Example

```
┌─────────────────────────────────────────────────┐
│ 1. VRO Agent needs WIP score from PMO           │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ VRO → A2A Message → PMO                         │
│ "I need WIP score for project X"               │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ PMO asks LLM to calculate                       │
│ Input: activeTasks, blockedTasks, capacity     │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ LLM returns:                                    │
│ {                                               │
│   value: 0.72,                                  │
│   narrative: "Team is at 72% capacity with 8   │
│     active tasks and 2 blocked tasks. WIP is   │
│     healthy but blocking issues need attention",│
│   sources: ["activeTasks", "blockedTasks"]     │
│ }                                               │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ PMO broadcasts signal via Mem0                  │
│ + Sends A2A response to VRO                     │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ VRO receives WIP score WITH narrative           │
│ Uses it to calculate value realization         │
└─────────────────────────────────────────────────┘
```

## Rules Engine with LLM Calculations

### OLD: Hardcoded Formula in Rule
```json
{
  "name": "Budget Overrun Alert",
  "conditions": {
    "all": [
      {
        "fact": "budget_variance",
        "operator": "greaterThan",
        "value": 0.20
      }
    ]
  },
  "actions": [
    { "type": "notify_agent", "parameters": { "targetAgent": "tmo" } }
  ]
}
```

System calculates: `variance = (actual - budget) / budget`

### NEW: LLM Calculates with Narrative
```json
{
  "name": "Budget Overrun Alert",
  "variables": [
    {
      "name": "budget_variance",
      "source": "calculated",
      "calculatedBy": "llm",
      "inputs": ["budget", "actualCost", "committedCosts", "remainingWork"]
    }
  ],
  "conditions": {
    "all": [
      {
        "fact": "budget_variance",
        "operator": "greaterThan",
        "value": 0.20
      }
    ]
  },
  "actions": [
    {
      "type": "notify_agent",
      "parameters": {
        "targetAgent": "tmo",
        "includeNarrative": true
      }
    }
  ]
}
```

When rule fires:
1. **Select variables**: budget, actualCost, committedCosts, remainingWork
2. **Generate LLM prompt**: "Calculate budget_variance with explanation..."
3. **LLM returns**:
   ```json
   {
     "value": 0.25,
     "narrative": "Project is 25% over budget. Primary cause is timeline extension requiring additional resources.",
     "reasoning": "Actual ($1.25M) exceeds budget ($1M) by $250K",
     "sources": ["budget", "actualCost", "resourceCost"],
     "confidence": 0.95
   }
   ```
4. **Evaluate condition**: 0.25 > 0.20 = TRUE
5. **Trigger action**: Notify TMO with narrative

## Complete Flow

```
┌───────────────────────────────────────────────────────────┐
│ 1. DATABASE WRITE                                         │
│    New project data: actualCost updated                   │
└───────────────────────────────────────────────────────────┘
                    ↓ (broadcast signal)
┌───────────────────────────────────────────────────────────┐
│ 2. SIGNAL BROADCASTER                                     │
│    Detects: actualCost changed for project_123           │
│    → Broadcasts to all subscribed agents                  │
└───────────────────────────────────────────────────────────┘
                    ↓ (FinOps subscribed to actualCost)
┌───────────────────────────────────────────────────────────┐
│ 3. FINOPS AGENT                                           │
│    Receives signal → Triggers rule evaluation            │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 4. RULE PROMPT GENERATOR                                  │
│    Rule needs: budget_variance                           │
│    Variables: budget, actualCost, committedCosts         │
│    → Generates LLM prompt                                │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 5. LLM CALCULATOR                                         │
│    Calculates budget_variance                            │
│    Returns: value + narrative + sources + reasoning     │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 6. RULES ENGINE                                           │
│    Evaluates: budget_variance > 0.20 = TRUE             │
│    Triggers: notify_agent action                         │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 7. SIGNAL BROADCASTER (again)                            │
│    Broadcasts: budget_variance = 0.25                    │
│    WITH narrative and reasoning                          │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 8. MEM0 + A2A                                             │
│    - Writes to Mem0 (historical record)                  │
│    - Sends A2A messages (TMO, VRO, PMO notified)        │
│    - All agents can observe (even non-subscribed)       │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 9. LANGFLOW (Optional)                                    │
│    Visualizes the flow:                                  │
│    [Budget Check] → [LLM Calc] → [Broadcast] → [Notify] │
└───────────────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────────┐
│ 10. NEO4J (Graph Visualization)                          │
│     Shows relationships:                                 │
│     FinOps --[budget_variance]--> PMO                    │
│     FinOps --[budget_variance]--> TMO                    │
│     FinOps --[budget_variance]--> VRO                    │
└───────────────────────────────────────────────────────────┘
```

## PPM Best Practice Attributes (80%)

### PMO Agent
**Produces** (LLM-calculated):
- `wip_score` - Work in progress efficiency
- `project_health_score` - Overall health (0-100)
- `dependency_health` - Cross-project dependencies
- `resource_utilization` - Team capacity usage
- `quality_score` - Quality & predictability
- `portfolio_health` - Aggregated portfolio status
- `governance_compliance` - Compliance score

**Consumes**:
- `budget_variance`, `burn_rate`, `cost_forecast` (from FinOps)
- `schedule_delay`, `spi`, `critical_path_risk` (from TMO)
- `risk_score`, `risk_trend` (from Risk)
- `value_realization`, `roi` (from VRO)
- `strategic_alignment` (from Planning)

### FinOps Agent
**Produces** (LLM-calculated):
- `budget_variance` - Over/under budget %
- `burn_rate` - Budget consumption rate
- `cost_forecast` - Projected final cost
- `cost_efficiency` - Cost per deliverable
- `financial_risk` - Financial exposure score

### TMO Agent
**Produces** (LLM-calculated):
- `schedule_delay` - Days behind schedule
- `spi` - Schedule Performance Index
- `critical_path_risk` - Critical path health
- `milestone_health` - Milestone status
- `velocity` - Team velocity trend

### VRO Agent
**Produces** (LLM-calculated):
- `value_realization` - Business value %
- `roi` - Return on investment
- `benefit_realization` - Benefits delivered
- `strategic_contribution` - Strategic value score

### Risk Agent
**Produces** (LLM-calculated):
- `risk_score` - Overall risk level
- `risk_trend` - Risk increasing/decreasing
- `mitigation_coverage` - % risks mitigated
- `risk_velocity` - Speed of risk changes

## API Endpoints

```bash
# Calculate attribute using LLM
POST /api/llm-calculator/calculate
{
  "attributeName": "wip_score",
  "inputData": {
    "activeTasks": 8,
    "blockedTasks": 2,
    "teamCapacity": 10
  }
}

# Evaluate rule with LLM calculations
POST /api/rules/evaluate-with-llm
{
  "ruleId": "rule_123",
  "entity": "project_123",
  "inputData": { ... }
}

# Get agent schema with calculation methods
GET /api/agent-schemas/pmo

# Broadcast signal with narrative
POST /api/signal-broadcaster/broadcast
{
  "attributeName": "budget_variance",
  "value": 0.25,
  "narrative": "...",
  "sources": ["budget", "actualCost"]
}
```

## Benefits

### For Users
1. **Explainability**: Every number comes with a story
2. **Auditability**: Sources are tracked
3. **Trust**: Reasoning is transparent
4. **Context**: Narrative provides business context

### For Developers
1. **No hardcoded formulas**: LLM handles all calculations
2. **Easy to extend**: Add new attributes without code changes
3. **Maintainable**: Prompts > formulas
4. **Flexible**: LLM adapts to context

### For Agents
1. **Richer signals**: Value + narrative + sources
2. **Better collaboration**: Understand WHY not just WHAT
3. **Learning**: Patterns emerge from narratives
4. **Intelligent**: AI reasoning vs rigid math

## Summary

**Old**: System calculates → Returns number → Agents use number
**New**: Agent asks LLM → LLM calculates + explains → Broadcasts value + narrative + sources → All agents observe and learn

This is truly **brain-like**: Instead of hardwired circuits (formulas), you have neurons (LLMs) that reason about data and communicate with narratives!
