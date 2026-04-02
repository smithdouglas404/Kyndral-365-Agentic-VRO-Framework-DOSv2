# Kyndryl Clarity - Level 4 Autonomous System

## Overview

Kyndryl Clarity is a Level 4 autonomous, self-learning multi-agent platform for enterprise transformation management. It utilizes 11 specialized Deep Agents for continuous monitoring, learning, communication, and action without human intervention, focusing on cost optimization through a 3-tier AI model approach. The system uses Palantir AIP as the primary data source (super-MCP) for all project data, with PostgreSQL reserved for authentication, configuration, and agent state. It leverages Rulebricks and Palantir Functions as its rules engine. The 11th Notification Agent manages all human-in-the-loop approvals and external notifications, acting as a single Application-to-Application (A2A) gateway.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: TailwindCSS with shadcn/ui (New York style) and Radix UI primitives.
- **State Management**: TanStack React Query for server state, React Context for UI state.
- **Routing**: Wouter.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ESM modules.
- **AI Integration**: Custom SmartModelRouter with a 3-tier routing strategy (deterministic heuristics, cheap models via OpenRouter, premium Claude for critical tasks).
- **Agent Framework**: Custom orchestration, no LangChain dependency.
- **Process Management**: PM2 for production.
- **AI Kill Switch**: Environment variable `ENABLE_AI_AGENTS=false` disables all LLM calls, switching to heuristic-only mode.

### Multi-Agent System
- **Dynamic Agent Management**: Agents are dynamically registered and stored in a PostgreSQL table, hot-reloadable via API without server restarts.
- **Default Agents**: Includes PMO, FinOps, Risk, OCM, TMO, VRO, Governance, Planning, Integrated, OKR Inference, and Notification agents, auto-seeded on first run.
- **Tool Registry**: 16 reusable tool sets (11 agent-specific, 5 cross-cutting) for agent composition.
- **Agent Observability**: In-memory trace buffer with per-agent metrics, tool breakdown, and error tracking.
- **Orchestration**: A single master ContinuousOrchestrator runs 24/7, utilizing an A2A message bus and a Model Context Protocol (MCP) integrating with Palantir, Jira, OpenProject, and Monday.com. It uses a Palantir-native scan flow (pre-fetch, run heuristics, broadcast facts) without LLM calls in its primary cycle.
- **Agent Memory**: Mem0 shared fact ledger with semantic search, synced with PalantirMemoryBridge.
- **Agent Subscriptions**: Agents subscribe to specific fact patterns for alerts and approvals.

### Data Architecture
- **Primary Data Source**: Palantir Foundry Ontology (27 object types, 22 SAFe projects) is the single source of truth; all reads are routed through `PalantirStorageAdapter`.
- **Fallback Database**: PostgreSQL with Drizzle ORM for writes, authentication, configuration, and agent state.
- **Vector Storage**: Support for Pinecone, Qdrant, and Weaviate.

### Palantir Integration
- **Ontology Mapping**: 27 object types are mapped to agent-specific data (e.g., FinOps to AtlasFinancialRecord).
- **Services**: `PalantirDashboardService` for dashboard data and `OntologyDataProvider` for knowledge graphs.
- **Sync**: Scheduled jobs synchronize external PM tools (Jira, OpenProject, Monday.com) with Palantir.

### Neo4j Knowledge Graph
- **Purpose**: Provides a relationship/graph traversal layer over Palantir data for cross-domain insights.
- **Data Flow**: Palantir data is synced to Neo4j every 5 minutes.
- **Graph Schema**: 12 node types and 14 relationship types.
- **Insight Patterns**: Implements 8 Cypher queries for critical insights like orphaned projects, high-risk + low readiness, and dependency bottlenecks.
- **Integration**: ContinuousOrchestrator generates cross-domain insights using Neo4j.

### Rules Engine
- **Unified Pipeline**: `EnterpriseRulesEngine` integrates Rulebricks for rule evaluation, with local threshold fallbacks and Palantir Action responses.
- **Rulebricks Integration**: 16 enterprise rules defined, with fallback to local thresholds.
- **Palantir Actions**: 8 defined actions triggered by threshold breaches (e.g., `atlas-flag-budget-anomaly`, `atlas-update-risk`).
- **Rule-to-Agent Mapping**: Specific alerts map to responsible agents (e.g., budget-alert to FinOps).

### Authentication & Security
- **Auth**: JWT-based authentication with bcrypt hashing.
- **Multi-Tenant**: Supports tenant authentication, signup, and email verification.
- **Security**: Utilizes Helmet for security headers (with some disabled in dev).

### Trend Forecast Engine
- **Engine**: `server/engines/TrendForecastEngine.ts` uses linear regression and exponential smoothing.
- **Forecasting**: Provides VRO (Value Realization Office) and PMO (Project Management Office) forecasts for various metrics like portfolio value score, OKR attainment, budget variance, and schedule performance.
- **Proactive Insights**: Generates agent-attributed insights (risk, warning, opportunity) with severity, confidence, and suggested actions.

## External Dependencies

### AI/ML Services
- **Anthropic Claude**: Primary LLM.
- **OpenRouter**: For cost-optimized model routing and failover.
- **Google Gemini**: Alternative LLM.

### Database & Storage
- **PostgreSQL**: For authentication, configuration, and agent state.
- **Drizzle ORM**: For database schema.
- **Vector Databases**: Pinecone, Qdrant, Weaviate (optional).

### Integration Platforms
- **MCP Services**: Palantir, Jira, OpenProject, Monday.com.
- **Palantir AIP**: Super-MCP, source of truth, rules evaluation (Palantir Functions), workflow orchestration (Palantir Actions).
- **Sync Scheduler**: Automates synchronization of external PM tools to Palantir.
- **Rulebricks**: External rules engine.

### Notifications
- **Email**: SendGrid, Mailgun, AWS SES, SMTP.
- **Chat**: Slack, Microsoft Teams.
- **In-App**: WebSocket-based notifications.