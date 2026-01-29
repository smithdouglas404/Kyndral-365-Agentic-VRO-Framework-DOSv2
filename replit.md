# Kyndryl Clarity - Level 4 Autonomous System

**Version:** 2.0.2  
**Updated:** 2026-01-29

## Recent Changes

### January 29, 2026 - Demo Approval Workflow
- Demo requests now require admin approval before users can access dashboard
- New `/demo/pending` page shows users their request is being reviewed
- Industry-specific ACME data only shown after approval
- Full documentation in MASTER_ARCHITECTURE.md Section 4.11

## Overview

Kyndryl Clarity is a Level 4 fully autonomous, self-learning multi-agent platform for enterprise transformation management. The system implements 10 specialized Deep Agents that continuously monitor, learn, communicate, and take action without human intervention.

Key Architecture (v2.0.1):
- **Cost Optimization Flow** (2 tiers only):
  1. Cache check - Hash comparison, skip if unchanged (no API cost)
  2. OpenRouter CHEAP tier - Llama 3.1 8B, GPT-4o-mini, Mixtral ($0.10-0.50/1M tokens)
  3. Claude PREMIUM tier - Only for critical/complex decisions ($3-15/1M tokens)
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
- **AI Integration**: Multi-model architecture via LangChain with:
  - Anthropic Claude (primary)
  - OpenAI GPT-4
  - Google Gemini
  - OpenRouter for cost-optimized routing
- **Agent Framework**: LangGraph for multi-agent orchestration
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
- **Anthropic Claude**: Primary LLM via `@anthropic-ai/sdk` and `@langchain/anthropic`
- **OpenRouter**: Cost-optimized model routing with failover chains
- **Google Gemini**: Alternative LLM via `@langchain/google-genai`
- **LangChain/LangGraph**: Agent orchestration framework

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
- **Langflow**: Visual workflow builder via MCP integration
  - **Sync**: Bidirectional mapping between PostgreSQL rules and Langflow flows
  - **API**: `/api/langflow/sync/*` endpoints for rule-flow synchronization
  - **Webhook**: Secure webhook at `/api/langflow/webhook` (Bearer token auth)

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