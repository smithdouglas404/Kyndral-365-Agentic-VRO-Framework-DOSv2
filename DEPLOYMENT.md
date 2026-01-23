# 🚀 NextEra Energy ETO/VRO Platform - Deployment Guide

## Enterprise Ontology-Based System with Real Intelligent Agents

---

## ✅ What's Been Transformed

### Phase 1-3 Complete (Production Ready)

1. **✅ Unified Ontology Layer**
   - SAFe 6.0, PMBOK 7, PRINCE2 semantic integration
   - 300+ triples, 30+ classes, 50+ properties
   - Automatic terminology reconciliation

2. **✅ OBDA Query Engine**
   - Virtual data federation (no data warehouse)
   - SPARQL to SQL/JQL/WIQL query rewriting
   - 5-minute query caching
   - GraphQL gateway for frontend

3. **✅ LangChain Agent System**
   - **SIMULATION ELIMINATED** - No more fake data!
   - 7 production-ready intelligent agents
   - LangSmith observability integration
   - Real-time monitoring of actual projects

---

## 🛠️ Prerequisites

### Required
- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (recommended)
- Anthropic API Key (Claude)

### Recommended
- LangSmith API Key (agent observability)
- Neo4j 5.15+ (knowledge graph - optional)

---

## 📦 Quick Start (Docker)

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set required variables:
# - ANTHROPIC_API_KEY (required)
# - LANGCHAIN_API_KEY (recommended)
# - SESSION_SECRET (generate with: openssl rand -base64 32)
```

### 2. Start Services

```bash
# Start all services (PostgreSQL, Neo4j, App)
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### 3. Initialize Database

```bash
# Push schema to database (creates new ontology tables)
npm run db:push

# Verify tables created
docker exec -it nextera-postgres psql -U postgres -d nextera_eto -c "\dt"
```

### 4. Verify Agent System

Check logs for:
```
[AgentScheduler] Initializing LangChain agents...
[AgentScheduler] Initialized 7 agents
  - FinOps Agent (full autonomy)
  - TMO Agent (full autonomy)
  - OCM Agent (full autonomy)
  - Integrated Mgmt Agent (full autonomy)
  - Risk Agent (supervised autonomy)
  - Governance Agent (supervised autonomy)
  - Planning Agent (supervised autonomy)
[AgentScheduler] ✅ All agents scheduled and running
[AgentScheduler] 🎯 NO MORE FAKE DATA - Agents monitor real projects
```

### 5. Access Services

- **Application**: http://localhost:5000
- **Neo4j Browser**: http://localhost:7474 (user: neo4j, password: password)
- **GraphQL Playground**: http://localhost:5000/api/graphql
- **LangSmith Dashboard**: https://smith.langchain.com/

---

## 🔧 Manual Installation (Without Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL

```bash
# Create database
createdb nextera_eto

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/nextera_eto
```

### 3. Set Up Neo4j (Optional)

```bash
# Download and install Neo4j 5.15
# Or use Neo4j Desktop: https://neo4j.com/download/

# Install APOC and Graph Data Science plugins
# Set NEO4J_URI in .env
NEO4J_URI=neo4j://localhost:7687
```

### 4. Initialize Database

```bash
# Push schema (creates all tables including ontology tables)
npm run db:push
```

### 5. Start Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

---

## 📊 Database Schema Changes

### New Tables (Ontology Layer)

The following tables were added for the ontology/OBDA system:

```sql
-- Virtual representation of RDF entities
CREATE TABLE ontology_entities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_uri TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  local_entity_type TEXT,
  local_entity_id VARCHAR,
  external_system TEXT,
  external_id TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ontology mappings for source systems
CREATE TABLE ontology_mappings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL,
  source_entity_type TEXT NOT NULL,
  source_field_path TEXT NOT NULL,
  ontology_class TEXT NOT NULL,
  ontology_property TEXT NOT NULL,
  transform_function TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OBDA query cache
CREATE TABLE obda_query_cache (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL UNIQUE,
  sparql_query TEXT NOT NULL,
  rewritten_query TEXT,
  result_set TEXT,
  source_systems TEXT,
  execution_time_ms INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge graph sync log
CREATE TABLE graph_sync_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id VARCHAR NOT NULL,
  sync_status TEXT NOT NULL,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**These tables are automatically created when you run:** `npm run db:push`

---

## 🤖 Agent System

### Agent Schedule

| Agent | Interval | Autonomy | Focus |
|-------|----------|----------|-------|
| **FinOps** | 30 min | Full | Budget, CPI, cost optimization |
| **TMO** | 20 min | Full | Schedule, SPI, velocity |
| **OCM** | 45 min | Full | Change management, adoption |
| **Integrated Mgmt** | 45 min | Full | Quality, testing, defects |
| **Risk** | 60 min | Supervised | Risk identification, mitigation |
| **Governance** | 2 hours | Supervised | Compliance, approvals |
| **Planning** | 30 min | Supervised | Dependencies, capacity |

### Agent Observability (LangSmith)

To enable full agent tracing:

```bash
# In .env
LANGCHAIN_API_KEY=ls__your_key_here
LANGCHAIN_PROJECT=nextera-eto
LANGCHAIN_TRACING_V2=true
```

Then visit: https://smith.langchain.com/ to see real-time traces of all agent executions.

---

## 🔌 API Endpoints

### Ontology & OBDA

```bash
# GraphQL (unified query interface)
POST /api/graphql
Content-Type: application/json
{
  "query": "{ projects(limit: 5) { id name cpi spi } }"
}

# SPARQL (direct semantic queries)
POST /api/sparql
Content-Type: application/json
{
  "query": "PREFIX pm: <http://nextera.energy/ontology/pm#> SELECT ?project WHERE { ?project a pm:Project }"
}

# Ontology explorer
GET /api/ontology/classes
GET /api/ontology/properties
GET /api/ontology/statistics
GET /api/ontology/equivalent/:conceptUri

# Semantic reconciliation
POST /api/ontology/reconcile
Content-Type: application/json
{
  "sourceType": "epic",
  "sourceSystem": "jira"
}
```

### Examples

**Get all projects via GraphQL:**
```graphql
{
  projects(status: "active") {
    id
    name
    cpi
    spi
    features {
      name
      status
      stories {
        name
        assignedTeam
      }
    }
    risks {
      name
      probability
      mitigation
    }
  }
}
```

**Get budget alerts via SPARQL:**
```sparql
PREFIX pm: <http://nextera.energy/ontology/pm#>

SELECT ?project ?name ?cpi
WHERE {
  ?project a pm:Project ;
           pm:projectName ?name ;
           pm:cpiValue ?cpi .
  FILTER (?cpi < 0.9)
}
```

---

## 🔍 Verification Checklist

### ✅ Database Tables
```bash
docker exec -it nextera-postgres psql -U postgres -d nextera_eto -c "\dt" | grep ontology
# Should show: ontology_entities, ontology_mappings, obda_query_cache, graph_sync_log
```

### ✅ Ontology Loaded
```bash
curl http://localhost:5000/api/ontology/statistics
# Should show: totalTriples: 300+, totalClasses: 30+
```

### ✅ Agents Running
```bash
docker-compose logs app | grep AgentScheduler
# Should show: "All agents scheduled and running"
```

### ✅ No Simulation
```bash
# Verify agentSimulation.ts is deleted
ls server/agentSimulation.ts
# Should show: "No such file or directory"
```

### ✅ LangSmith Tracing (if configured)
Visit: https://smith.langchain.com/ and verify traces are appearing

---

## 🐛 Troubleshooting

### Agents Not Starting

**Check logs:**
```bash
docker-compose logs app | grep -i agent
```

**Common issues:**
- Missing ANTHROPIC_API_KEY
- PostgreSQL not accessible
- Port conflicts

### OBDA Queries Failing

**Check:**
- Database connection (DATABASE_URL)
- Ontology files loaded (`api/ontology/statistics` should return data)
- Query cache table exists

### Neo4j Connection Issues

**Verify:**
```bash
docker exec -it nextera-neo4j cypher-shell -u neo4j -p password
# Should connect successfully
```

---

## 📚 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                      │
│  - GraphQL Queries                                           │
│  - Real-time WebSocket updates                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              GraphQL Gateway (Express)                       │
│  - Unified query interface                                   │
│  - Type-safe schema                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│           OBDA Query Engine (Virtual Federation)             │
│  - SPARQL to SQL/JQL/WIQL rewriting                         │
│  - Query result caching (5 min TTL)                          │
│  - Multi-source result merging                               │
└────┬────────────┬────────────┬───────────────────────────┬──┘
     │            │            │                           │
┌────▼────┐  ┌───▼──┐  ┌─────▼────┐  ┌─────────────┐  ┌─▼───┐
│PostgreSQL│  │ Jira │  │  Azure   │  │ ServiceNow  │  │ ... │
│ (Local)  │  │(API) │  │DevOps(API)│  │   (API)     │  │     │
└──────────┘  └──────┘  └──────────┘  └─────────────┘  └─────┘
     │
     │            ┌─────────────────────────────────────┐
     └────────────►  Unified Ontology Layer (RDF)      │
                  │  - SAFe 6.0, PMBOK, PRINCE2         │
                  │  - Semantic reconciliation          │
                  └───────────┬─────────────────────────┘
                              │
                  ┌───────────▼─────────────────────────┐
                  │   LangChain Agent System (7 Agents) │
                  │   - FinOps, TMO, Risk, etc.         │
                  │   - LangSmith observability         │
                  │   - Real data only (NO SIMULATION)  │
                  └─────────────────────────────────────┘
```

---

## 🚨 Critical Success Indicators

### ✅ Zero Synthetic Data
- No fake alerts generated
- No simulated agent conversations
- Only real problems trigger real interventions

### ✅ Real-Time Monitoring
- Agents query actual project data
- Interventions based on real CPI, SPI, risks
- Full audit trail in database

### ✅ Full Observability
- LangSmith traces for all agent executions
- Agent activity logs
- OBDA query performance metrics

---

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f app`
2. Verify environment variables in `.env`
3. Test API endpoints manually with curl
4. Check LangSmith dashboard for agent traces

---

## 🎯 Next Steps (Future Phases)

The following phases are architected but not yet implemented:

- **Phase 4**: Neo4j Knowledge Graph (advanced analytics, PageRank, impact modeling)
- **Phase 5**: Document Intelligence (OKR/KPI extraction from PDFs)
- **Phase 6**: MCP Adapter Updates (ontology-aware sync)
- **Phase 7**: Frontend Components (graph visualization, agent dashboard)

These can be implemented incrementally without disrupting the current system.

---

## ✨ Summary

You now have a **production-ready ontology-based system** with:
- ✅ Unified semantic layer across methodologies
- ✅ Virtual data federation (no data warehouse)
- ✅ 7 intelligent agents monitoring real data
- ✅ Full observability via LangSmith
- ✅ **ZERO synthetic/fake data**

The system meets the client's requirements:
- ✅ "Systems to work on day 1" - Ready to deploy
- ✅ "Everything to be real and no more fake alerts" - Simulation eliminated
- ✅ "Use LangChain and LangSmith" - Fully integrated
- ✅ "MCP for data source integration" - MCP framework in place
- ✅ "Ontology/semantic based system" - Complete ontology layer

**Deploy with confidence!** 🚀
