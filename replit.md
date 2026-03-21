# Kyndryl Clarity - Level 4 Autonomous System

## Overview

Kyndryl Clarity is a Level 4 fully autonomous, self-learning multi-agent platform designed for enterprise transformation management. It employs 10 specialized Deep Agents that continuously monitor, learn, communicate, and act without human intervention. The system prioritizes cost optimization through a tiered AI model approach and integrates deeply with Palantir AIP for enterprise data reconciliation, rule evaluation, and workflow orchestration. Its core purpose is to provide full portfolio scanning, enabling proactive management and autonomous decision-making across various enterprise functions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with shadcn/ui (New York style)
- **State Management**: TanStack React Query for server state, React Context for UI state
- **Routing**: Wouter
- **UI Components**: Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **AI Integration**: Multi-model architecture with a SmartModelRouter for tiered routing (Heuristic, Cheap, Premium) via OpenRouter and direct Anthropic API calls for critical tasks.
- **Agent Framework**: Custom orchestration, no external frameworks like LangChain.
- **Process Management**: PM2 for production.

### Multi-Agent System
- **Agents**: 10 specialized Deep Agents (FinOps, TMO, Risk, Governance, VRO, PMO, OCM, Planning, Integrated, Notification Agent) operating continuously.
- **Orchestration**: 24/7 continuous monitoring and orchestration with A2A message bus for inter-agent collaboration using the Model Context Protocol (MCP).
- **Palantir-Native Integration**: All rule evaluation, threshold checks, and workflow actions are routed through Palantir Functions/Actions. Orchestrator scans are rewritten to use Palantir data and Tier 0 heuristics, reducing LLM calls.

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM.
- **Vector Storage**: Support for Pinecone, Qdrant, Weaviate (configurable).
- **Memory Systems**: Mem0 integration for agent memory persistence.

### Rules Engine
- **Enterprise Rules**: Palantir Functions for business rule evaluation.
- **Workflow**: Palantir Actions for workflow orchestration.
- **Local Fallbacks**: Local threshold definitions ensure continuity when Palantir is unavailable.

### Authentication & Security
- **Auth**: JWT-based authentication with bcrypt password hashing.
- **Credentials**: Encrypted storage for integration credentials.
- **Admin Controls**: Role-based access with an admin dashboard.

### Key API Patterns
- RESTful endpoints (`/api/*`).
- WebSocket connections for real-time notifications.
- Unified notification system.
- Background orchestration independent of HTTP requests.

## External Dependencies

### AI/ML Services
- **Anthropic Claude**: Primary LLM via `@anthropic-ai/sdk`.
- **OpenRouter**: Cost-optimized model routing with failover chains.
- **Google Gemini**: Alternative LLM via `@google/generative-ai`.

### Database & Storage
- **PostgreSQL**: Primary relational database.
- **Drizzle ORM**: Database schema and migrations.
- **Vector Databases**: Pinecone, Qdrant, Weaviate (optional).

### Integration Platforms
- **MCP Servers**: 25+ pre-configured PM tool connectors (e.g., Jira, Azure DevOps, ServiceNow, GitHub).
- **Palantir AIP**: Used for enterprise data reconciliation, rule evaluation (Palantir Functions), and workflow orchestration (Palantir Actions).

### Notifications
- **Email**: SendGrid, Mailgun, AWS SES, SMTP support.
- **Chat**: Slack, Microsoft Teams integrations.
- **In-App**: WebSocket-based notifications.

### Required Environment Variables
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY` (optional)
- `OPENAI_API_KEY` (optional)
- `GOOGLE_API_KEY` (optional)
- `PALANTIR_HOSTNAME`
- `PALANTIR_TOKEN`
- `PALANTIR_ONTOLOGY_RID` (optional)