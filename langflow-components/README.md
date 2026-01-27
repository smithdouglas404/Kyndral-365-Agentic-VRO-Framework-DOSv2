# Langflow + Mem0 Custom Components

## Overview

These custom components integrate **Langflow** (orchestration) with **Mem0** (memory layer) to create an intelligent agent system where:

- **Langflow** = Nervous system (routing and processing)
- **Mem0** = Hippocampus (storing and recalling experiences)

## The Dynamic Duo: Logic + Memory

```
User Input → Mem0 Reader (retrieve context) →
Inject memories into prompt → LLM generates response →
Mem0 Writer (store new facts) → Response
```

## Components

### 1. **Mem0 Reader** (`mem0_reader.py`)

Reads facts from Mem0 memory layer before processing with LLM.

**Use Cases**:
- Retrieve user preferences before generating response
- Get historical project data for context
- Query past agent interactions
- Semantic search for relevant memories

**Example Flow**:
```
[Input] → [Mem0 Reader: entity="project_123"] → [Prompt Template] → [LLM] → [Output]
```

**Configuration**:
- `entity`: Entity to read facts for (e.g., `project_123`, `agent_pmo`)
- `attributes`: Comma-separated list of attributes to read (optional)
- `limit`: Maximum number of facts to retrieve
- `semantic_query`: Optional semantic search query

**Output**:
```json
{
  "context": "# Context from Mem0 Memory...",
  "facts": [...],
  "entity": "project_123",
  "count": 5
}
```

### 2. **Mem0 Writer** (`mem0_writer.py`)

Writes facts to Mem0 memory layer after LLM processing.

**Use Cases**:
- Store LLM calculation results
- Save rule outcomes
- Record agent decisions
- Build agent memory over time

**Example Flow**:
```
[LLM Response] → [Mem0 Writer: attribute="budget_variance"] → [Success]
```

**Configuration**:
- `entity`: Entity to write fact for (e.g., `project_123`)
- `attribute`: Attribute name (e.g., `budget_variance`)
- `value`: The value to store (any type)
- `source_agent`: Agent that produced this fact
- `confidence`: Confidence score (0.0 to 1.0)
- `narrative`: Optional explanation

**Output**:
```json
{
  "success": true,
  "fact": {...},
  "message": "Successfully wrote budget_variance to Mem0 for project_123"
}
```

### 3. **LLM Calculator** (`llm_calculator.py`)

Calculates agent attributes using LLM with narrative and sourcing. **NO MORE HARDCODED MATH!**

**Use Cases**:
- Calculate WIP score with explanation
- Calculate budget variance with narrative
- Calculate project health with sourcing
- Any calculation that needs context

**Example Flow**:
```
[Input Data] → [LLM Calculator: type="budget-variance"] → [Result + Narrative] → [Mem0 Writer]
```

**Configuration**:
- `calculation_type`: Type of calculation (wip-score, budget-variance, project-health, etc.)
- `input_data`: JSON object with input data
- `attribute_name`: For custom calculations
- `context`: Optional business context
- `entity`: For Mem0 storage
- `source_agent`: Agent requesting calculation

**Output**:
```json
{
  "value": 0.25,
  "narrative": "Project is 25% over budget due to extended timeline...",
  "reasoning": "Actual cost ($1.25M) exceeds budget ($1M) by $250K",
  "sources": ["budget", "actualCost"],
  "confidence": 0.95
}
```

### 4. **Rule Evaluator** (`rule_evaluator.py`)

Evaluates rules with LLM-calculated variables instead of hardcoded formulas.

**Use Cases**:
- Evaluate compliance rules
- Check project health thresholds
- Trigger alerts based on LLM analysis
- Complex multi-factor decisions

**Example Flow**:
```
[Input Data] → [Rule Evaluator] → [Condition Met?] → [If True: Send Alert]
```

**Configuration**:
- `rule_id`: Unique identifier for the rule
- `agent_id`: Agent evaluating the rule
- `entity`: Entity to evaluate
- `input_data`: Data for rule evaluation
- `variables`: Variables needed by rule
- `condition`: Rule condition

**Output**:
```json
{
  "condition_met": true,
  "calculated_values": {
    "budget_variance": {
      "value": 0.25,
      "narrative": "...",
      "confidence": 0.95
    }
  },
  "should_trigger_action": true
}
```

## Installation

1. **Copy components to Langflow**:
```bash
cp langflow-components/*.py /path/to/langflow/custom_components/
```

2. **Restart Langflow**:
```bash
langflow run
```

3. **Components will appear in Langflow UI** under "Custom Components"

## Example Workflows

### Workflow 1: Contextual Agent Response

```
[User Input]
    ↓
[Mem0 Reader: Read user preferences]
    ↓
[Prompt Template: Inject {context}]
    ↓
[LLM: Generate response with context]
    ↓
[Mem0 Writer: Store interaction]
    ↓
[Output]
```

### Workflow 2: Budget Overrun Alert

```
[Trigger: Budget Updated]
    ↓
[Mem0 Reader: Get historical budget data]
    ↓
[LLM Calculator: Calculate budget_variance]
    ↓
[Mem0 Writer: Store calculation result]
    ↓
[Rule Evaluator: Check if variance > 20%]
    ↓
[If True: Send A2A Alert to PMO, TMO, VRO]
```

### Workflow 3: Project Health Dashboard

```
[Trigger: Daily]
    ↓
[Mem0 Reader: Get project data]
    ↓
[LLM Calculator: Calculate project_health_score]
    ↓
[LLM Calculator: Calculate wip_score]
    ↓
[LLM Calculator: Calculate dependency_health]
    ↓
[Mem0 Writer: Store all metrics]
    ↓
[Rule Evaluator: Check thresholds]
    ↓
[Generate Dashboard]
```

### Workflow 4: Multi-Agent Collaboration

```
[VRO Agent needs WIP score from PMO]
    ↓
[Mem0 Reader: Check if PMO has recent WIP score]
    ↓
[If not found: Trigger PMO calculation]
    ↓
[PMO: LLM Calculator → WIP Score]
    ↓
[PMO: Mem0 Writer → Store WIP Score]
    ↓
[VRO: Mem0 Reader → Get WIP Score]
    ↓
[VRO: Use WIP in value_realization calculation]
```

## Why This Matters

### Hyper-Personalization
Your AI remembers project history, user preferences, and past decisions without complex database schemas.

### Adaptive Learning
Memory evolves. If a project's status changes, Mem0 updates facts automatically.

### Modular Low-Code
Swap LLMs in Langflow (GPT-4 → Claude 3.5) while Mem0 remains the consistent "source of truth".

### No More Hardcoded Math
LLM calculates with narrative + sourcing instead of brittle formulas.

### Auditability
Every calculation has sources, reasoning, and confidence scores.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATABASE WRITE                                           │
│    actualCost updated for project_123                       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SIGNAL BROADCASTER                                       │
│    Broadcasts to subscribed agents                          │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LANGFLOW WORKFLOW TRIGGERED                              │
│    FinOps workflow activates                                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. MEM0 READER                                              │
│    Read historical budget data from Mem0                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. LLM CALCULATOR                                           │
│    Calculate budget_variance with narrative                 │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. MEM0 WRITER                                              │
│    Store calculation result + narrative in Mem0            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. RULE EVALUATOR                                           │
│    Check if budget_variance > 0.20                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. A2A MESSAGE BUS                                          │
│    Send alerts to PMO, TMO, VRO with narrative            │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Used

These components call your backend APIs:

- `POST /api/mem0/write-fact` - Write facts to Mem0
- `GET /api/mem0/read-facts` - Read facts from Mem0
- `POST /api/mem0/semantic-search` - Semantic search
- `POST /api/llm-calculator/calculate` - Generic LLM calculation
- `POST /api/llm-calculator/budget-variance` - Budget variance
- `POST /api/llm-calculator/wip-score` - WIP score
- `POST /api/llm-calculator/evaluate-rule` - Rule evaluation

## Configuration

Set your API URL in each component (default: `http://localhost:5000`).

For production:
```python
"api_url": {
    "value": "https://your-production-domain.com"
}
```

## Support

For questions or issues:
1. Check backend API logs
2. Check Langflow component logs
3. Verify Mem0 service is running
4. Check API endpoints are accessible

## Summary

**Old Way**: Hardcoded workflows → Postgres queries → Fixed formulas
**New Way**: Langflow orchestration → Mem0 memory → LLM calculations with narrative

This creates a truly intelligent, adaptive agent system where memory and reasoning work together!
