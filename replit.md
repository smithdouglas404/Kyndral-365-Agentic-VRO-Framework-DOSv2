# Kyndryl Clarity - Level 4 Autonomous System

**Last Updated**: March 21, 2026

## Overview

Kyndryl Clarity is a Level 4 fully autonomous, self-learning multi-agent platform designed for enterprise transformation management. It employs 11 specialized Deep Agents (10 domain + 1 Notification gateway) that continuously monitor, learn, communicate, and act without human intervention. The system prioritizes cost optimization through a 3-tier AI model approach and uses Palantir AIP as the **super-MCP** — ALL project data reads flow through Palantir Ontology exclusively (zero PostgreSQL for project data). PostgreSQL is used only for auth, config, and agent state. Zero LangChain dependency. Rulebricks and Palantir Functions serve as the rules engine. The Notification Agent (11th agent) acts as the single A2A gateway for all HITL approvals and external notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fastRefresh: false, hmr: false for stability)
- **Styling**: TailwindCSS with shadcn/ui (New York style)
- **State Management**: TanStack React Query for server state, React Context for UI state
- **Routing**: Wouter
- **UI Components**: Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js on port 5000
- **Language**: TypeScript with ESM modules
- **AI Integration**: SmartModelRouter with 3-tier routing:
  - Tier 0: Deterministic heuristics (zero cost, zero LLM calls)
  - Tier 1: Cheap models via OpenRouter ($0.10-0.50/M tokens)
  - Tier 2: Premium Claude (critical only, $3-15/M tokens)
- **Agent Framework**: Custom orchestration — zero LangChain dependency
- **Process Management**: PM2 for production
- **AI Kill Switch**: `ENABLE_AI_AGENTS=false` in .env blocks all LLM calls; orchestrator runs in Palantir-native heuristic-only mode

### Multi-Agent System (Dynamic, Database-Driven)
- **Agent Registration**: Fully dynamic — agents stored in `dynamic_agents` PostgreSQL table, loaded at startup, hot-reloadable via API (no restart needed)
- **Default Agents (11)**: PMO, FinOps, Risk, OCM, TMO, VRO, Governance, Planning, Integrated, OKR Inference, Notification — auto-seeded on first run
- **MCP Tool Counts**: PMO(6), FinOps(7), Risk(4), OCM(3), TMO(4), VRO(5), Governance(6), Planning(4), Integrated(5), OKR(3), Notification(3) = 50 skills + 11 agent tools = 61 MCP tools
- **Dynamic Agent API**: `POST /api/dynamic-agents/agents` (create), `PUT /api/dynamic-agents/agents/:key` (update), `DELETE /api/dynamic-agents/agents/:key` (remove) — instantly registers in Mastra + A2A + MCP
- **Tool Registry**: 16 reusable tool sets (11 agent + 5 cross-cutting) that new agents can compose from — `GET /api/dynamic-agents/tool-registry`
  - Cross-cutting sets: `simulation` (2), `policy` (1), `intervention` (1), `data-quality` (1), `resource` (1)
- **Agent Observability**: `server/services/AgentTracing.ts` — in-memory trace buffer with per-agent metrics, tool breakdown, error tracking; wired into `executeWithMemory()` for automatic tracing
  - API: `/api/agent-tracing/summary`, `/api/agent-tracing/metrics`, `/api/agent-tracing/traces`, `/api/agent-tracing/toggle`
- **Admin UI**: `/admin/dynamic-agents` — 4-tab interface (Agents, Tool Registry, Observability, Traces) for creating/editing/toggling/deleting agents with live hot-reload
- **Agent Loader**: `server/mastra/DynamicAgentLoader.ts` — replaces hardcoded configs, reads from DB, creates Mastra agents, builds A2A cards
- **Orchestration**: Single master ContinuousOrchestrator (created by DeepAgentBootstrap, shared by AgentScheduler) runs 24/7 (600s interval) with:
  - A2A message bus for inter-agent collaboration
  - Model Context Protocol (MCP) with 4 active services (Palantir, Jira, OpenProject, Monday.com)
  - Palantir-native scan flow: pre-fetch once per cycle → `runHeuristics()` → `broadcastFact()` — zero LLM calls
  - **CRITICAL**: Only one orchestrator instance — DeepAgentBootstrap owns it, AgentScheduler references it via `(global).__deepAgentBootstrap`
- **Agent Memory**: Mem0 shared fact ledger with semantic search; PalantirMemoryBridge syncs facts
- **Agent Subscriptions**: PMO subscribes to 5 fact patterns; Notification subscribes to 10 fact patterns (alerts, approvals, HITL requests)

### Data Architecture — Palantir as Source of Truth
- **Primary Data Source**: Palantir Foundry Ontology (27 object types, 22 SAFe projects)
  - All reads routed through `PalantirStorageAdapter` (Proxy pattern)
  - Adapter wraps PostgreSQL storage; intercepts `getProjects`, `getProject`, `getDependencies`, `getTasks`, `getProjectMetrics`
  - Falls back to PostgreSQL for methods not yet implemented in Palantir
- **Fallback Database**: PostgreSQL with Drizzle ORM (writes, auth, config, agent state)
- **CRITICAL**: Never run `npm run db:push` for Palantir data — no Postgres tables for Palantir-managed entities
- **Storage Wrapping**: `routes.ts`, `ContinuousOrchestrator.ts`, `agents.ts`, `logic-gates.ts` all use `getPalantirStorageAdapter(postgresStorage)`
- **Vector Storage**: Support for Pinecone, Qdrant, Weaviate (configurable)
- **Memory Systems**: Mem0 integration for agent memory persistence

### Palantir Integration
- **Hostname**: `ssg.usw-17.palantirfoundry.com`
- **Ontology**: 27 object types loaded at startup with agent-specific mappings:
  - FinOps → AtlasFinancialRecord, AtlasBudget
  - TMO → AtlasDependency, AtlasTransformation, AtlasProject, AtlasTeam
  - Risk → AtlasRisk
  - PMO → AtlasGovernanceCheckpoint, AtlasProject
  - VRO → AtlasObjective, AtlasKpi, AtlasKeyResult
  - Governance → AtlasGovernanceCheckpoint
  - OCM → AtlasPerson, AtlasReadinessMetric
  - Planning → AtlasObjective, AtlasKpi
  - OKR → AtlasObjective, AtlasKpi, AtlasKeyResult
  - Notification → AtlasPerson, AtlasRisk, AtlasInsight, AtlasRouteAlert
- **PalantirDashboardService**: Source of truth for dashboard data
- **OntologyDataProvider**: Palantir-first data provider for knowledge graph
- **PalantirSync**: Scheduled sync jobs (Jira 4h, OpenProject 6h, Monday.com 2h)

### Rules Engine (Enterprise Rules Engine)
- **Unified Pipeline**: `EnterpriseRulesEngine` → Rulebricks evaluation → Local threshold fallback → Palantir Action response
- **Rulebricks Integration**: 16 enterprise rules defined, API at `https://rulebricks.com/api/v1/solve`, falls back to local thresholds if API unavailable
- **PalantirRulesService**: Local threshold-based rule evaluation with configurable thresholds per agent
- **Palantir Actions (real, wired)**: 8 action mappings fire on threshold breaches:
  - `atlas-flag-budget-anomaly` (budget overrun, burn rate)
  - `atlas-update-risk` (risk score escalation)
  - `atlas-record-governance-decision` (compliance alerts)
  - `atlas-create-insight` (schedule, health, value gap alerts)
  - `atlas-update-readiness-score` (readiness scores)
- **Rule-to-Agent Mapping**: budget-alert→finops, schedule-alert→tmo, risk-alert→risk, compliance-alert→governance, health-alert→pmo, value-gap→vro, change-impact→ocm, dependency-alert→planning
- **API Routes**: `/api/enterprise-rules/status`, `/api/enterprise-rules/rules`, `/api/enterprise-rules/evaluate/project/:id`, `/api/enterprise-rules/evaluate/portfolio`
- **Auth Guard**: `executeActions=true` requires `x-admin-token` header

### Authentication & Security
- **Auth**: JWT-based authentication with bcrypt password hashing
- **Multi-Tenant**: Tenant authentication system with signup, email verification, demo access
- **Firebase**: Optional Firebase authentication (requires `FIREBASE_SERVICE_ACCOUNT_JSON`)
- **Credentials**: Encrypted storage for integration credentials (`ENCRYPTION_KEY`)
- **Admin Controls**: Role-based access with system admin dashboard
- **Security Headers**: Helmet with frameguard/CSP/COOP disabled for dev environment

### Key API Patterns
- RESTful endpoints (`/api/*`)
- WebSocket connections for real-time notifications (`/ws`)
- Unified notification system via Notification Agent
- Background orchestration independent of HTTP requests
- OBDA (Ontology-Based Data Access) for SPARQL queries with virtual data federation

### Trend Forecast Engine (Predictive Analytics Module)
- **Engine**: `server/engines/TrendForecastEngine.ts` — linear regression + exponential smoothing with deterministic seeded series
- **VRO Forecasting**: Portfolio value score, OKR attainment, benefits realization, strategic alignment trend lines
- **PMO Forecasting**: Portfolio health, team velocity, budget variance, schedule performance (SPI) trend lines
- **OKR Trajectory**: 4 strategic objectives with key results tracking and projected completion dates
- **Benefits Forecast**: Realization rate by category (Cost Savings, Revenue Growth, Efficiency Gains, Risk Reduction)
- **Capacity Forecast**: Monthly utilization projections with overallocation risk detection
- **Proactive Insights**: Agent-attributed insights (risk, warning, opportunity, recommendation) with severity, confidence, and suggested actions
- **API Routes**: `/api/trend-forecast/vro`, `/api/trend-forecast/pmo`, `/api/trend-forecast/combined`
- **Dashboard**: `/dashboard/predictive-analytics` — 5-tab UI (Overview, VRO Trends, PMO Trends, OKR Trajectory, Insights) with sparkline visualizations

### Battle Rhythm
- Weekly cadence orchestrator with scheduled ceremonies:
  - Scrum of Scrums, Cross-Functional Optimization, Decision Nodes, Value Pulse, Weekly Orders
- Task processor for synthesis tasks
- Integrated with Agent Scheduler

## External Dependencies

### AI/ML Services
- **Anthropic Claude**: Primary LLM via `@anthropic-ai/sdk`
- **OpenRouter**: Cost-optimized model routing with failover chains ($5/day + 500K token/day hard limits)
- **Google Gemini**: Alternative LLM via `@google/generative-ai`

### Database & Storage
- **PostgreSQL**: Fallback relational database (auth, config, agent state)
- **Drizzle ORM**: Database schema and migrations
- **Vector Databases**: Pinecone, Qdrant, Weaviate (optional)

### Integration Platforms
- **MCP Services (4 active)**: Palantir, Jira, OpenProject, Monday.com
- **Palantir AIP**: Super-MCP — source of truth for all enterprise data, rule evaluation (Palantir Functions), and workflow orchestration (Palantir Actions)
- **Sync Scheduler**: Automated sync jobs for external PM tools into Palantir

### Notifications
- **Email**: SendGrid, Mailgun, AWS SES, SMTP support
- **Chat**: Slack, Microsoft Teams integrations
- **In-App**: WebSocket-based notifications
- **Gateway**: All notifications routed through Notification Agent (A2A gateway)

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection
- `ANTHROPIC_API_KEY` — Claude API access
- `PALANTIR_HOSTNAME` — Palantir Foundry hostname
- `PALANTIR_TOKEN` — Palantir API token
- `ENCRYPTION_KEY` — Credential encryption
- `RULEBRICKS_API_KEY` — Rules engine
- `ENABLE_AI_AGENTS` — AI kill switch (false = heuristic-only mode)
- `OPENROUTER_API_KEY` (optional) — Cost-optimized LLM routing
- `OPENAI_API_KEY` (optional) — OpenAI embeddings
- `GOOGLE_API_KEY` (optional) — Gemini LLM
- `PALANTIR_ONTOLOGY_RID` (optional) — Specific ontology RID
- `MONDAY_API_KEY` — Monday.com integration
- `LANGCHAIN_API_KEY` — Not used (zero LangChain); legacy key
- `LANGFLOW_MCP_TOKEN` — Langflow MCP integration

## Important Files

| File | Purpose |
|------|---------|
| `server/routes.ts` | Main route registration — uses `getPalantirStorageAdapter(postgresStorage)` |
| `server/agents/ContinuousOrchestrator.ts` | 24/7 orchestrator — Palantir-native scan, A2A bus, MCP services |
| `server/services/PalantirStorageAdapter.ts` | Proxy adapter wrapping PostgreSQL with Palantir-first reads |
| `server/services/PalantirDashboardService.ts` | Dashboard data from Palantir (source of truth) |
| `server/lib/SmartModelRouter.ts` | 3-tier AI model routing (heuristic/cheap/premium) |
| `server/mcp/PalantirDataProvider.ts` | Palantir MCP data provider and ontology cache |
| `server/lib/PalantirRulesService.ts` | Palantir Functions/Actions for rule evaluation |
| `server/engines/TrendForecastEngine.ts` | VRO/PMO trend forecasting — linear regression + exponential smoothing |
| `server/routes/trend-forecast.ts` | Trend forecast API routes (/vro, /pmo, /combined) |
| `server/services/RulebricksService.ts` | Rulebricks external rules engine integration |
| `server/services/EnterpriseRulesEngine.ts` | Unified rules pipeline (Rulebricks + Palantir Actions + thresholds) |
| `server/routes/enterprise-rules.ts` | Enterprise rules API routes |
| `server/services/OrchestratorConfig.ts` | Orchestrator settings and configuration |
| `server/routes/agents.ts` | Agent execution routes (Palantir-wrapped storage) |
| `server/routes/logic-gates.ts` | Logic gate evaluation (Palantir-wrapped storage) |
| `server/obda/index.ts` | OBDA virtual data federation (SPARQL queries) |
| `shared/schema.ts` | Drizzle ORM schema definitions |
