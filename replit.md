# Agentic Nexus - Multi-Agent Portfolio Management System

## Overview

Agentic Nexus is an enterprise-grade multi-agent AI system for portfolio and project management. It features 6 specialized "Deep Agents" (FinOps, TMO, Risk, VRO, PMO, OCM) that collaborate through a message bus to provide intelligent analysis, risk assessment, and value realization tracking. The system integrates semantic knowledge through RDF ontologies, persistent memory via Mem0/Letta, and a comprehensive rules engine for automated decision-making.

The platform serves as a unified command center for transformation management, combining strategic planning (VRO), tactical execution (PMO), and operational coordination (TMO) with AI-powered insights and multi-channel notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **State Management**: TanStack React Query for server state with automatic caching and refetching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom plugins for meta images and Replit integration
- **UI Components**: Radix UI primitives wrapped in shadcn/ui components

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Structure**: RESTful endpoints organized by domain (admin, dashboard, agents, rules)
- **Agent System**: 6 Deep Agents with specialized capabilities communicating via DeepAgentOrchestrator message bus
- **LLM Integration**: Enhanced LLM Router supporting OpenRouter, Anthropic Claude, and Google Gemini with cost-tiered model selection

### Multi-Agent System (The 7 Layers)
1. **Presentation Layer**: React dashboard with role-based views
2. **API Layer**: Express REST endpoints
3. **Orchestration Layer**: DeepAgentOrchestrator for agent-to-agent messaging
4. **Agent Layer**: 6 specialized agents (FinOps, TMO, Risk, VRO, PMO, OCM)
5. **Memory Layer**: Mem0 for shared facts, Letta for agent-specific memory
6. **Ontology Layer**: RDF schemas with OBDA mapping for semantic queries
7. **Persistence Layer**: PostgreSQL with Drizzle ORM

### Rules Engine
- **Collaboration Rules**: AgentCollaborationRulesEngine for inter-agent coordination
- **Decision Tables**: Camunda 8 DMN/BPMN integration for complex business rules
- **Rule Editors**: 8 React components for domain-specific rule configuration (FinOps, TMO, Risk, VRO, PMO, OCM, Governance, Custom Attributes)

### Data Storage
- **Primary Database**: PostgreSQL (48 tables) with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit with migrations stored in `/migrations`
- **Vector Storage**: Supports Pinecone, Qdrant, Weaviate with fallback to in-memory

## External Dependencies

### AI/LLM Services
- **Anthropic Claude**: Primary LLM via `@anthropic-ai/sdk`
- **OpenRouter**: Multi-model routing for cost optimization
- **Google Gemini**: Alternative LLM via `@langchain/google-genai`
- **LangChain**: Orchestration framework for LLM workflows via `@langchain/core` and `@langchain/langgraph`

### Database & Storage
- **PostgreSQL**: Primary relational database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database operations
- **Vector Stores**: Optional Pinecone, Qdrant, or Weaviate for embeddings

### External Integrations (MCP Marketplace)
- **Project Management**: Jira, Azure DevOps, Monday.com, Asana, Linear, GitHub, GitLab
- **Enterprise PPM**: Microsoft Project Server, ServiceNow, Smartsheet, Planview
- **Email Providers**: SendGrid, Mailgun, AWS SES, SMTP
- **Communication**: Slack, Microsoft Teams webhooks
- **Financial**: Stripe, QuickBooks, Dynamics ERP

### Authentication & Security
- **JWT**: Token-based authentication via `jsonwebtoken`
- **bcrypt**: Password hashing
- **Credential Encryption**: For stored integration credentials

### Build & Development
- **Vite**: Frontend build with React plugin
- **TSX**: TypeScript execution for server
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner