# Agentic Nexus - Deep Agent System

## Overview

Agentic Nexus is an enterprise-grade AI-powered project management and governance platform that orchestrates multiple specialized AI agents to provide continuous monitoring, risk assessment, and intelligent interventions across organizational portfolios. The system implements a sophisticated multi-agent architecture with 10 specialized agents (6 Deep Agents + 4 Standard Agents) that collaborate via an A2A (Agent-to-Agent) message bus to deliver real-time insights, predictions, and automated recommendations.

The platform serves as a comprehensive transformation management office (TMO) solution, integrating portfolio management, risk assessment, financial operations (FinOps), value realization (VRO), organizational change management (OCM), and governance capabilities into a unified AI-driven system.

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