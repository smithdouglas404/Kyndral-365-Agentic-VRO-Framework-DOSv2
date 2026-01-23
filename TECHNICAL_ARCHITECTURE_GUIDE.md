# 🏗️ Technical Architecture Guide

## System Overview

The NextEra Energy ETO/VRO Platform is a semantic integration platform that unifies project data from multiple sources using:

1. **Ontology Layer** - RDF/RDFS semantic schema
2. **OBDA Engine** - Virtual data federation (no data warehouse)
3. **LangChain Agents** - 7 autonomous AI agents
4. **Knowledge Graph** - Neo4j for advanced analytics
5. **MCP Adapters** - Real-time sync with external systems

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        External Systems                           │
│  Jira │ Azure DevOps │ ServiceNow │ MS Project │ Smartsheet      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      MCP Adapter Layer                            │
│  • Real-time webhooks                                             │
│  • Polling sync (5-60 min intervals)                              │
│  • Field mapping & transformation                                 │
│  • Semantic reconciliation                                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Ontology Layer (RDF/RDFS)                     │
│  • core.ttl - Base PM ontology (TBox)                             │
│  • safe.ttl - SAFe 6.0 concepts                                   │
│  • pmbok.ttl - PMBOK 7 performance domains                        │
│  • prince2.ttl - PRINCE2 themes/processes                         │
│  • bridging.ttl - Cross-methodology semantic mappings             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                  OBDA Query Engine (Ontop)                        │
│  • SPARQL → SQL/JQL/WIQL query rewriting                          │
│  • Multi-source federation                                        │
│  • Query result caching (5 min TTL)                               │
│  • No data materialization                                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LangChain Agent System                         │
│  7 Autonomous Agents:                                             │
│  1. FinOps Agent      - Budget, Cost, CPI monitoring              │
│  2. TMO Agent         - Schedule, Timeline, SPI monitoring        │
│  3. Risk Agent        - Risk identification & mitigation          │
│  4. Governance Agent  - Compliance & policy adherence             │
│  5. Planning Agent    - Dependencies & capacity planning          │
│  6. OCM Agent         - Change management & readiness             │
│  7. Integrated Mgmt   - Quality, testing, defects                 │
│                                                                    │
│  • LangSmith observability (full tracing)                         │
│  • Claude Sonnet 4.5 powered                                      │
│  • Tool-calling capabilities                                      │
│  • Full/Supervised autonomy modes                                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Knowledge Graph (Neo4j)                         │
│  • Advanced relationship discovery                                │
│  • Root cause analysis (multi-hop traversal)                      │
│  • Critical path detection (PageRank)                             │
│  • Impact prediction ("what-if" scenarios)                        │
│  • Resource conflict detection                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                            │
│  • Projects, Epics, Features, Stories, Tasks                      │
│  • Dependencies, Resources, Risks, Milestones                     │
│  • Interventions (agent-created alerts)                           │
│  • Agent Activity Logs                                            │
│  • Ontology Entities & Mappings                                   │
│  • OBDA Query Cache                                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API Layer (Express)                          │
│  • REST API - /api/*                                              │
│  • GraphQL API - /api/graphql                                     │
│  • SPARQL Endpoint - /api/sparql                                  │
│  • WebSocket - Real-time notifications                            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Frontend (React 19 + Vite)                      │
│  • Project dashboards                                             │
│  • Agent activity monitoring                                      │
│  • Intervention approval workflows                                │
│  • Knowledge graph visualization (D3.js)                          │
│  • Real-time WebSocket updates                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20.20.0 | Server runtime |
| **Framework** | Express | 4.x | HTTP server |
| **Language** | TypeScript | 5.6.x | Type safety |
| **Database** | PostgreSQL | 16.x | Primary data store |
| **ORM** | Drizzle | 0.30.x | Type-safe SQL queries |
| **Ontology** | N3.js | 1.17.x | RDF triple store |
| **OBDA** | Custom | - | SPARQL → SQL rewriting |
| **Graph DB** | Neo4j | 5.15.x | Knowledge graph |
| **AI** | Claude Sonnet 4.5 | - | Agent LLM |
| **Agents** | LangChain.js | 0.1.x | Agent framework |
| **Observability** | LangSmith | - | Agent tracing |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 19.x | UI framework |
| **Build Tool** | Vite | 5.x | Fast HMR dev server |
| **State Mgmt** | TanStack Query | 5.x | Server state |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Components** | Radix UI | - | Accessible components |
| **Graphs** | D3.js | 7.x | Knowledge graph viz |
| **API Client** | graphql-request | - | GraphQL queries |

---

## Component Details

### 1. Ontology Layer

**Location:** `/server/ontology/`

**Files:**
- `schema/core.ttl` - Base PM ontology (TBox)
- `schema/safe.ttl` - SAFe 6.0 concepts
- `schema/pmbok.ttl` - PMBOK 7 performance domains
- `schema/prince2.ttl` - PRINCE2 themes/processes
- `schema/bridging.ttl` - Cross-methodology mappings
- `index.ts` - OntologyService

**Key Concepts:**
```turtle
# Core ontology (core.ttl)
pm:Project a rdfs:Class ;
  rdfs:label "Project" ;
  rdfs:comment "A project is a temporary endeavor" .

pm:hasTask a rdf:Property ;
  rdfs:domain pm:Project ;
  rdfs:range pm:Task .

pm:dependsOn a rdf:Property ;
  rdfs:domain pm:Task ;
  rdfs:range pm:Task .
```

**Equivalences (bridging.ttl):**
```turtle
# SAFe Epic = PMBOK Project = PRINCE2 Stage
safe:Epic owl:equivalentClass pmbok:Project .
safe:Epic owl:equivalentClass prince2:Stage .

# Map properties
safe:hasPI owl:equivalentProperty pm:hasSprint .
pmbok:hasPhase owl:equivalentProperty prince2:hasStage .
```

---

### 2. OBDA Query Engine

**Location:** `/server/obda/index.ts`

**Capabilities:**
- SPARQL query parsing
- SQL query generation (PostgreSQL)
- JQL query generation (Jira)
- WIQL query generation (Azure DevOps)
- Query result caching (5-minute TTL)
- Multi-source federation

**Example Flow:**

**Input SPARQL:**
```sparql
PREFIX pm: <http://nextera.com/ontology/pm#>

SELECT ?project ?cpi ?budget
WHERE {
  ?project a pm:Project .
  ?project pm:cpiValue ?cpi .
  ?project pm:budget ?budget .
  FILTER (?cpi < 0.9)
}
```

**Generated SQL (PostgreSQL):**
```sql
SELECT id, name, cpi_value, budget
FROM projects
WHERE cpi_value < 0.9
```

**Generated JQL (Jira):**
```
project = PROJ AND "CPI[Number]" < 0.9
```

---

### 3. LangChain Agents

**Location:** `/server/agents/`

**Architecture:**

```
AgentBase (Abstract)
├── FinOpsAgent
├── TMOAgent
├── RiskAgent
├── GovernanceAgent
├── PlanningAgent
├── OCMAgent
└── IntegratedMgmtAgent
```

**Agent Lifecycle:**

1. **Initialization**
   - Load agent-specific tools
   - Initialize Claude Sonnet 4.5 model
   - Register LangSmith tracer
   - Set up memory buffer

2. **Scheduled Scan**
   - Query ontology via OBDA
   - Analyze metrics (CPI, SPI, risks, etc.)
   - Apply business rules
   - Create interventions if issues found
   - Log activity

3. **Tool Execution**
   - `query_project_budgets` - Get projects with budget data
   - `query_project_schedules` - Get projects with schedule data
   - `calculate_budget_variance` - Calculate variance
   - `create_intervention` - Create alert

4. **LangSmith Trace**
   - Tool calls
   - LLM reasoning
   - Agent decisions
   - Execution time
   - Token usage

**Agent Configuration:**

```typescript
// FinOps Agent
{
  agentId: 'finops',
  agentName: 'FinOps Agent',
  focus: 'Budget, Cost, CPI monitoring',
  autonomy: 'full', // Can self-approve interventions
  temperature: 0.7,
  modelName: 'claude-sonnet-4-5-20250929'
}
```

**Agent Schedule:**

```typescript
// AgentScheduler.ts
FinOps:      Every 30 minutes
TMO:         Every 20 minutes
Risk:        Every 60 minutes
Governance:  Every 120 minutes
Planning:    Every 30 minutes
OCM:         Every 45 minutes
Integrated:  Every 45 minutes
```

---

### 4. Knowledge Graph (Neo4j)

**Location:** `/server/graph/GraphService.ts`

**Schema:**

```cypher
// Nodes
(:Project {id, name, status, cpi, spi, budget})
(:Epic {id, name, wsjfScore})
(:Feature {id, name, storyPoints})
(:Story {id, name, storyPoints})
(:Task {id, name, status, effortHours})
(:Resource {id, name, role, availability})
(:Risk {id, name, probability, impact})
(:Milestone {id, name, targetDate})
(:Dependency {id, type, lag})

// Relationships
(Project)-[:HAS_EPIC]->(Epic)
(Epic)-[:HAS_FEATURE]->(Feature)
(Feature)-[:HAS_STORY]->(Story)
(Story)-[:HAS_TASK]->(Task)
(Task)-[:DEPENDS_ON]->(Task)
(Task)-[:ASSIGNED_TO]->(Resource)
(Project)-[:HAS_RISK]->(Risk)
(Risk)-[:MITIGATES]->(Risk)
```

**Advanced Analytics:**

**1. Critical Path Detection:**
```cypher
MATCH (start:Task {status: 'in_progress'})
MATCH (end:Task {status: 'not_started'})
MATCH path = shortestPath((start)-[:DEPENDS_ON*]->(end))
WITH nodes(path) as criticalPath
RETURN criticalPath
ORDER BY length(criticalPath) DESC
LIMIT 1
```

**2. Resource Conflict Detection:**
```cypher
MATCH (r:Resource)<-[:ASSIGNED_TO]-(t1:Task)
MATCH (r)<-[:ASSIGNED_TO]-(t2:Task)
WHERE t1.startDate <= t2.endDate
  AND t2.startDate <= t1.endDate
  AND t1 <> t2
RETURN r.name, collect(t1.name) + collect(t2.name) as conflicts
```

**3. Impact Prediction:**
```cypher
MATCH (t:Task {id: $taskId})
MATCH path = (t)-[:DEPENDS_ON*1..5]->(affected:Task)
RETURN affected.id, affected.name, length(path) as impactDistance
ORDER BY impactDistance
```

---

### 5. Database Schema

**Location:** `/shared/schema.ts`

**Key Tables:**

```sql
-- Projects (30+ fields including EVM metrics)
CREATE TABLE projects (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  budget TEXT,
  budget_spent TEXT,
  cpi_value TEXT,
  spi_value TEXT,
  planned_value BIGINT,
  earned_value BIGINT,
  actual_cost BIGINT,
  -- ... 20+ more fields
);

-- Dependencies (FS/SS/FF/SF)
CREATE TABLE dependencies (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  project_id VARCHAR REFERENCES projects(id),
  predecessor_id VARCHAR,
  successor_id VARCHAR,
  type TEXT, -- finish_to_start, etc.
  lag INTEGER,
  status TEXT
);

-- Resources
CREATE TABLE resources (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR REFERENCES projects(id),
  name TEXT NOT NULL,
  type TEXT, -- person, equipment
  role TEXT,
  availability REAL,
  cost REAL,
  skills TEXT -- JSON array
);

-- Interventions (Agent-created alerts)
CREATE TABLE interventions (
  id VARCHAR PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_id VARCHAR REFERENCES projects(id),
  confidence TEXT,
  agent_source TEXT,
  is_autonomous TEXT,
  self_approved TEXT,
  status TEXT, -- pending, approved, dismissed
  langsmith_trace_id TEXT
);

-- Ontology Entities
CREATE TABLE ontology_entities (
  id VARCHAR PRIMARY KEY,
  entity_uri TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  local_entity_id VARCHAR,
  external_system TEXT,
  external_id TEXT,
  metadata TEXT -- JSON
);

-- OBDA Query Cache
CREATE TABLE obda_query_cache (
  id VARCHAR PRIMARY KEY,
  query_hash TEXT UNIQUE NOT NULL,
  sparql_query TEXT NOT NULL,
  rewritten_query TEXT,
  result_set TEXT, -- JSON
  execution_time_ms INTEGER,
  expires_at TIMESTAMP
);
```

---

## API Design

### REST API

**Base URL:** `http://localhost:5000/api`

**Endpoints:**

```
GET    /api/projects              - List projects
GET    /api/projects/:id          - Get project with relationships
POST   /api/projects              - Create project
PUT    /api/projects/:id          - Update project
DELETE /api/projects/:id          - Delete project

GET    /api/epics                 - List epics
POST   /api/epics                 - Create epic

GET    /api/features              - List features
POST   /api/features              - Create feature

GET    /api/stories               - List stories
POST   /api/stories               - Create story

GET    /api/tasks                 - List tasks
POST   /api/tasks                 - Create task

GET    /api/dependencies          - List dependencies
POST   /api/dependencies          - Create dependency

GET    /api/resources             - List resources
POST   /api/resources             - Create resource

GET    /api/interventions         - List agent interventions
POST   /api/interventions/approve - Approve intervention

GET    /api/agent-activity-log    - Agent activity logs

POST   /api/agents/test/:agentId  - Manually trigger agent
```

### GraphQL API

**Endpoint:** `POST /api/graphql`

**Schema Highlights:**

```graphql
type Project {
  id: String!
  name: String!
  status: String!

  # Financial (EVM)
  budget: String
  budgetSpent: String
  cpi: String
  spi: String
  plannedValue: String
  earnedValue: String
  actualCost: String

  # Relationships
  epics: [Epic!]!
  features: [Feature!]!
  risks: [Risk!]!
  resources: [Resource!]!
  dependencies: [Dependency!]!
  milestones: [Milestone!]!
  interventions: [Intervention!]!
}

type Query {
  project(id: String!): Project
  projects(status: String, portfolioId: String): [Project!]!

  resources(type: String, teamId: String): [Resource!]!
  dependencies(entityId: String, entityType: String): [Dependency!]!

  interventions(
    agentId: String
    projectId: String
    severity: String
  ): [Intervention!]!
}
```

### SPARQL Endpoint

**Endpoint:** `POST /api/sparql`

**Example:**

```bash
curl -X POST http://localhost:5000/api/sparql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "PREFIX pm: <http://nextera.com/ontology/pm#> SELECT ?project ?cpi WHERE { ?project a pm:Project . ?project pm:cpiValue ?cpi . FILTER (?cpi < 0.9) }"
  }'
```

---

## Deployment

### Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Seed test data
npm run seed

# Start dev server
npm run dev
```

**Environment:**
- Node.js 20.20.0
- PostgreSQL 16
- Port 5000

### Production (Docker)

```bash
# Build Docker image
docker build -t nextera-eto .

# Run with docker-compose
docker-compose up -d
```

**Services:**
- Express app (port 5000)
- PostgreSQL (port 5432)
- Neo4j (port 7687, 7474)

### Replit Deployment

See `DEPLOYMENT_REPLIT.md` for Replit-specific instructions.

---

## Performance Considerations

### Database Optimization

- Indexes on `project_id`, `status`, `cpi_value`, `spi_value`
- Connection pooling (max 10 connections)
- Query result caching (5-minute TTL)

### Agent Performance

- Agent scans run asynchronously (non-blocking)
- LangSmith traces don't block execution
- Tool calls are cached when possible
- Memory buffer limited to last 10 messages

### API Performance

- GraphQL query depth limited to 5 levels
- REST API paginated (default 50, max 100)
- WebSocket for real-time updates (no polling)
- Compression enabled (gzip)

---

## Security

### Authentication

- API keys for programmatic access
- Session-based auth for web UI
- OAuth 2.0 for external integrations

### Authorization

- Role-based access control (RBAC)
- Project-level permissions
- Agent autonomy levels (full / supervised)

### Data Protection

- API keys encrypted at rest
- HTTPS required in production
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

---

## Monitoring & Observability

### LangSmith

- Agent execution traces
- Tool call logs
- LLM reasoning
- Token usage
- Error tracking

### Application Logs

```bash
# Agent activity
curl http://localhost:5000/api/agent-activity-log

# Data quality
curl http://localhost:5000/api/data-quality/score

# MCP sync logs
curl http://localhost:5000/api/mcp/sync-log
```

### Metrics

- Agent execution time (avg <10s)
- SPARQL query time (95th percentile <2s)
- GraphQL query time (95th percentile <1s)
- Database connection pool usage
- Neo4j sync lag (<5 minutes)

---

## Extending the System

### Add New Agent

1. Create agent file: `/server/agents/NewAgent.ts`
2. Extend `AgentBase`
3. Define tools
4. Register in `AgentScheduler.ts`

```typescript
import { AgentBase } from './base/AgentBase.js';

export class NewAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'new-agent',
      agentName: 'New Agent',
      focus: 'Custom monitoring',
      autonomy: 'supervised'
    }, storage);
  }

  protected defineTools() {
    return [
      // Define tools
    ];
  }

  protected getSystemPrompt() {
    return 'You are the New Agent...';
  }
}
```

### Add New MCP Adapter

1. Create adapter file: `/server/adapters/NewSystemAdapter.ts`
2. Implement sync methods
3. Add field mappings
4. Register webhooks

---

## Architecture Decisions

### Why Virtual Data Federation (OBDA)?

✅ **Benefits:**
- No ETL jobs to maintain
- Always fresh data (no stale cache)
- Query sources in real-time
- Single semantic query layer

❌ **Trade-offs:**
- Dependent on external system availability
- Slightly slower than materialized views

### Why LangChain Agents?

✅ **Benefits:**
- Full observability via LangSmith
- Tool-calling built-in
- Easy to extend with new tools
- ReAct pattern for reasoning

❌ **Trade-offs:**
- More complex than rule-based systems
- LLM costs (mitigated with smart caching)

### Why Neo4j for Knowledge Graph?

✅ **Benefits:**
- Native graph algorithms (PageRank, shortest path)
- Cypher query language (intuitive)
- APOC + GDS plugins for advanced analytics
- Excellent performance for graph traversals

❌ **Trade-offs:**
- Additional infrastructure to manage
- Learning curve for Cypher

---

## Future Enhancements

### Planned Features

1. **Multi-agent Orchestration** (LangGraph)
   - Agent collaboration on complex problems
   - State machines for workflows

2. **Predictive Analytics**
   - ML models for risk prediction
   - Time-series forecasting for budget/schedule

3. **Document Intelligence**
   - PDF extraction (OKRs, KPIs)
   - Auto-mapping to ontology entities

4. **Advanced Visualization**
   - 3D knowledge graph
   - Sankey diagrams for resource flow
   - Gantt charts with critical path

---

## Resources

- **LangChain Docs:** https://js.langchain.com/
- **LangSmith:** https://smith.langchain.com/
- **Neo4j Docs:** https://neo4j.com/docs/
- **Drizzle ORM:** https://orm.drizzle.team/
- **Claude API:** https://docs.anthropic.com/

---

**For questions or contributions, see the main README.md**
