# Kyndryl Clarity - Level 4 Autonomous System

**Version:** 2.7.0  
**Updated:** 2026-03-02

## Recent Changes

### March 2, 2026 - Complete Langflow Removal + Rulebricks (v2.7.0)
- **Langflow fully removed**: All imports, service files, route files, script files, and sync code deleted
- **Rulebricks replaces Langflow**: All 8 agent files now use `this.checkRule()` via Rulebricks instead of `executeLangflowFlow()`
- **AgentCollaborationRulesEngine**: trigger_workflow action now routes through Rulebricks; Langflow sync code removed
- **Agent Objects**: `LangflowService` type replaced with `RulesService` interface; attribute calculation uses Rulebricks
- **Deleted files**: `server/lib/Langflow*.ts` (6 files), `server/routes/langflow*.ts` (4 files), `server/scripts/*langflow*.ts` (5 files)
- **Rule slugs**: budget-alert, schedule-alert, risk-alert, compliance-alert, health-alert, change-impact, value-gap, dependency-alert

### March 2, 2026 - Notification Agent + Agent-MCP Manager (v2.6.0)
- **11th Agent**: DeepNotificationAgent — central gateway for all Palantir actions, HITL approvals, and signal broadcasting
  - All 10 domain agents subscribe via A2A; Notification Agent writes facts to Mem0 so all agents see signal outcomes
  - HITL workflow: actions flagged as critical/approval-required are queued for admin approval before execution
  - Palantir action mapping: risk_alert, budget_alert, schedule_alert, compliance_alert, escalation → Palantir actions
  - API: `/api/notification-agent/status`, `/api/notification-agent/signal`, `/api/notification-agent/approve`, `/api/notification-agent/reject`
  - File: `server/agents/deep/DeepNotificationAgent.ts`
- **Agent-MCP Connection Seeding**: 20 MCP definitions (16 knowledge + 4 governance) with 11 agent mappings including Notification Agent
  - Notification Agent → Palantir AIP, Slack, Teams, ServiceNow, Responsible AI, Audit Trail
  - Seed script: `server/scripts/seed-mcp-connections.ts`
- **Agent MCP Manager UI**: Full admin page at `/admin/agent-mcp` — select agent, view/add/remove MCPs, toggle enabled, filter by type
- **Ontology Field Mapping**: Per-connection ontology mappings via `GET/PUT /api/admin/agent-mcp-connections/:connectionId/ontology-mappings`
- **PalantirDataProvider**: Notification Agent mapped to AtlasAgent, AtlasInsight, AtlasProject, AtlasRisk, AtlasPerson
- **Bootstrap**: Global reference `__deepAgentBootstrap` for API route access to agents

### March 2, 2026 - Palantir AIP Super-MCP Integration (v2.5.0)
- **Palantir AIP connected** as super-MCP (Option B architecture): agents pull pre-reconciled enterprise data from Palantir's Ontology SDK v2
- **Auto-ontology discovery**: PalantirAIPService auto-selects the ontology with data (skips empty default ontology)
- **PalantirDataProvider**: Domain-specific data mapping — each agent gets only its relevant Atlas object types:
  - FinOps → AtlasBudget, AtlasFinancialRecord, AtlasKpi (59 objects)
  - TMO → AtlasProject, AtlasDependency, AtlasTeam (26 objects)
  - Risk → AtlasRisk, AtlasInsight, AtlasProject (32 objects)
  - PMO → AtlasProject, AtlasGovernanceCheckpoint, AtlasTransformation (23 objects)
  - Governance → AtlasGovernanceCheckpoint, AtlasInsight, AtlasProject (32 objects)
  - VRO → AtlasKpi, AtlasObjective, AtlasKeyResult (34 objects)
  - OCM → AtlasReadinessMetric, AtlasTeam, AtlasPerson (52 objects)
- **Scan cycle integration**: ContinuousOrchestrator enriches agent context with Palantir data before each agent scan
- **5-min TTL cache**: Palantir data cached per object type to minimize API calls
- **API endpoints**: `/api/palantir/status`, `/api/palantir/agent-data/:agentId`, `/api/palantir/project-summary/:projectId`, `/api/palantir/cache-stats`
- **Files**: `server/mcp/PalantirAIPService.ts`, `server/mcp/PalantirDataProvider.ts`, `server/routes/palantir.ts`
- **Env vars**: `PALANTIR_HOSTNAME`, `PALANTIR_TOKEN`, `PALANTIR_ONTOLOGY_RID` (optional, auto-discovered)

### March 1, 2026 - Orchestrator Scan Optimization v4.1 (v2.4.0)
- **Project fingerprinting**: ContinuousOrchestrator now hashes project data (budget, progress, SPI, CPI, risk, etc.) and skips unchanged projects
- **Per-agent cooldown**: 5-minute cooldown per agent+project pair — prevents re-scanning the same project unless data changes
- **Collaboration cost reduction**: Agent-to-agent collaboration requests now try heuristic/cache responses first before falling back to LLM
- **Scan efficiency tracking**: `getScanEfficiency()` exposed via `GET /api/orchestration/router-stats` as `scanEfficiency.skipRate`
- **Cost impact**: Eliminates ~80-90% of redundant scans when project data is static, further reducing API costs on top of 3-tier savings

### March 1, 2026 - SmartModelRouter v4.0: 3-Tier Intelligent Layer (v2.3.0)
- **Tier 0 HEURISTIC** (zero cost): Deterministic rule-based engine evaluates CPI, SPI, budget utilization, risk scores, compliance, adoption rates, stakeholder satisfaction — no API call needed
- **Tier 1 CHEAP** ($0.10-0.50/M tokens): Llama 3.1 8B / GPT-4o-mini via OpenRouter for routine language generation
- **Tier 2 PREMIUM** ($3-15/M tokens): Claude Sonnet for critical/complex decisions only
- `DeepAgentBase.run()` short-circuits to heuristic results when Tier 0 is sufficient — caches result and stores summary
- New `GET /api/orchestration/router-stats` endpoint exposes tier breakdown, savings, and cache hit rates
- Heuristic engine covers: FinOps (CPI, budget utilization), TMO (SPI, schedule variance), Risk (risk score, open risks, status), PMO (health status, completion), VRO (ROI tracking), Governance (compliance score, pending approvals), OCM (adoption rate, stakeholder satisfaction)
- Stats accounting: totalCalls tracked at classifyTask level, heuristicCalls/cheapCalls/premiumCalls tracked at resolution point — no double-counting

### March 1, 2026 - Complete LangChain Removal (v2.2.0)
- **ALL 6 LangChain packages removed** from package.json
- All LLM calls go through `OpenRouterClient.callLLM()` via `SmartModelRouter.callModel()`
- `DynamicStructuredTool` replaced with custom `AgentTool` class (`server/lib/AgentTool.ts`)
- `PostgresChatMessageHistory` replaced with direct Postgres queries in `MemoryManager`
- `ChatPromptTemplate` replaced with template literals in `DeepAgentWithRAG` and `DependencyCollaborationAgent`
- All 15 agent files updated
- AI kill switch (`ENABLE_AI_AGENTS=false`) verified working - zero token consumption

### January 29, 2026 - Demo Approval Workflow
- Demo requests now require admin approval before users can access dashboard
- New `/demo/pending` page shows users their request is being reviewed
- Industry-specific ACME data only shown after approval
- Full documentation in MASTER_ARCHITECTURE.md Section 4.11

## Overview

Kyndryl Clarity is a Level 4 fully autonomous, self-learning multi-agent platform for enterprise transformation management. The system implements 10 specialized Deep Agents that continuously monitor, learn, communicate, and take action without human intervention.

Key Architecture (v2.3.0):
- **Cost Optimization Flow** (3 tiers):
  0. Cache check - Hash comparison, skip if unchanged (no API cost)
  1. Tier 0 HEURISTIC - Deterministic rule engine, zero cost, handles ~60-70% of routine work
  2. Tier 1 CHEAP - Llama 3.1 8B, GPT-4o-mini via OpenRouter ($0.10-0.50/1M tokens)
  3. Tier 2 PREMIUM - Claude Sonnet for critical/complex only ($3-15/1M tokens)
- **Full Portfolio Scanning**: Agents scan ALL projects each cycle (not sampled)
- **Admin Control**: Orchestrator OFF by default, persisted setting survives restarts
- **Self-Learning**: Agents query their own Mem0 risks each cycle
- **A2A Communication**: Unlimited agent-to-agent messaging via message bus

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Styling**: TailwindCSS with shadcn/ui component library (New York style)
- **State Management**: TanStack React Query for server state, React Context for UI state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom implementations

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **AI Integration**: Multi-model architecture via direct API calls:
  - OpenRouterClient → OpenRouter (primary, cost-optimized)
  - Anthropic Claude (fallback via direct API)
  - SmartModelRouter for CHEAP/PREMIUM tier routing
- **Agent Framework**: Custom orchestration (no LangChain/LangGraph)
- **Process Management**: PM2 for production deployment

### Multi-Agent System
The system implements 10 specialized agents:
- **Deep Agents (6)**: FinOps, TMO, Risk, Governance, VRO, PMO, OCM
- **Standard Agents (4)**: Planning, Integrated, and specialized domain agents
- **Orchestration**: Continuous 24/7 orchestration with 15-second monitoring cycles
- **Communication**: A2A message bus for inter-agent collaboration
- **Protocol**: MCP (Model Context Protocol) for tool integration

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Vector Storage**: Support for Pinecone, Qdrant, Weaviate (configurable)
- **Memory Systems**: Mem0 integration for agent memory persistence

### Rules Engine
- **Engine**: Camunda 8 with DMN decision tables
- **Rules Storage**: PostgreSQL `collaboration_rules` table
- **Policy-as-Code**: Automated policy extraction and enforcement
- **Best Practices**: 21 pre-configured rules covering budget, schedule, risk, compliance

### Authentication & Security
- **Auth**: JWT-based authentication with bcrypt password hashing
- **Credential Storage**: Encrypted credentials for integrations
- **Admin Controls**: Role-based access with admin dashboard

### Key API Patterns
- RESTful endpoints under `/api/*`
- WebSocket connections for real-time notifications
- Unified notification system consolidating multiple alert sources
- Background orchestration running independently of HTTP requests

## External Dependencies

### AI/ML Services
- **Anthropic Claude**: Primary LLM via `@anthropic-ai/sdk` (direct API, no LangChain)
- **OpenRouter**: Cost-optimized model routing with failover chains
- **Google Gemini**: Alternative LLM via `@google/generative-ai` (direct API)
- **OpenRouterClient**: Unified LLM client with SmartModelRouter for CHEAP/PREMIUM tier routing

### Database & Storage
- **PostgreSQL**: Primary relational database (via `DATABASE_URL`)
- **Drizzle ORM**: Database schema and migrations
- **Vector Databases**: Pinecone, Qdrant, Weaviate (optional, for embeddings)

### Integration Platforms
- **MCP Servers**: 25+ pre-configured PM tool connectors including:
  - Jira Cloud/Align
  - Azure DevOps
  - ServiceNow
  - Monday, Asana, Wrike, ClickUp
  - GitHub, GitLab
  - Smartsheet, Planview

### Workflow & Rules
- **Camunda 8**: BPMN/DMN workflow and decision engine
- **Retool**: External rule editor interfaces (8 domain-specific apps)
- **Rulebricks**: Cloud rules engine for agent business rules
  - All 11 agents check rules via `this.checkRule(slug, input)` from DeepAgentBase
  - Rule slugs: budget-alert, schedule-alert, risk-alert, compliance-alert, health-alert, change-impact, value-gap, dependency-alert
  - API: `/api/rulebricks/status`, `/api/rulebricks/solve`, `/api/rulebricks/bulk-solve`

### Notifications
- **Email**: SendGrid, Mailgun, AWS SES, SMTP support
- **Chat**: Slack, Microsoft Teams integrations
- **In-App**: WebSocket-based real-time notifications

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `ANTHROPIC_API_KEY`: For Claude AI models
- `OPENROUTER_API_KEY`: For model routing (optional)
- `OPENAI_API_KEY`: For GPT models (optional)
- `GOOGLE_API_KEY`: For Gemini models (optional)

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema to database
npm run seed         # Seed development data
npm run seed:documents  # Seed regulatory frameworks
npm run check        # TypeScript type checking
```