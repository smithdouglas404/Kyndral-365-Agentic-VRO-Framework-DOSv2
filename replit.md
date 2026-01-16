# NextEra Energy Enterprise Transformation Dashboard

## Overview

This is a **NextEra Energy Enterprise Transformation Dashboard** with complete SAFe PPM-ART ontology. It's a full-stack TypeScript application featuring MCP server integration for bidirectional sync with external PPM tools (Jira, Azure DevOps, ServiceNow), AI-powered data analysis via Anthropic, and comprehensive project portfolio management. All data is stored in PostgreSQL with no static content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with pages in `client/src/pages/` and reusable components in `client/src/components/`. The UI components from shadcn are in `client/src/components/ui/`.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Development**: tsx for TypeScript execution
- **Build**: esbuild for production bundling

The server uses a simple Express setup with:
- Route registration in `server/routes.ts`
- Static file serving for production in `server/static.ts`
- Vite dev server integration in `server/vite.ts`
- Storage abstraction layer in `server/storage.ts`

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Defined in `shared/schema.ts` using Drizzle's schema definition
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Current Implementation**: In-memory storage (`MemStorage` class) as default, with PostgreSQL support ready when `DATABASE_URL` is configured

The storage layer uses an interface pattern (`IStorage`) allowing easy swapping between memory and database implementations.

### Project Structure
```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and data
│   │   └── pages/        # Route pages
├── server/           # Express backend
├── shared/           # Shared types and schemas
└── migrations/       # Drizzle database migrations
```

### Key Design Patterns
1. **Monorepo Structure**: Client, server, and shared code in one repository with path aliases (`@/`, `@shared/`)
2. **Storage Interface Pattern**: Abstract storage operations behind an interface for flexibility
3. **Component Composition**: shadcn/ui components using Radix primitives with Tailwind styling
4. **Simulated Data**: Dashboard uses generated/simulated data in `client/src/lib/simulation.ts` for demonstration purposes
5. **Registry-Based Drill-Down Navigation**: All clickable entities resolve through `drilldownRegistry.ts` for consistent content

### Drill-Down Navigation System
The dashboard implements comprehensive 1-3 level drill-down navigation:

- **Registry Pattern**: `client/src/lib/drilldownRegistry.ts` maps 25+ entity types to structured dossiers
- **Content Resolution**: `getDrilldownContent()` returns registry data or null (no fabricated content)
- **Rendering Strategy**: 
  - `isFullDossier: true` → RegistryContentRenderer (action playbooks, metrics, teams, dependencies)
  - SAFe entities (theme, value-stream, feature, story, task) → Legacy renderer with contextual data
  - Unknown entities → Explicit "Content Not Available" guardrail state
- **Supported Entity Types**: action, metric, team, dependency, agent, data-source, agent-log, resource, scope, approval, contingency, risk, alert, report, system, benefit, bottleneck, stage, timeline, impact, trend, capability, and more

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema management (`npm run db:push`)

### UI Framework Dependencies
- **Radix UI**: Full suite of accessible primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library
- **Recharts**: Charting library for data visualizations
- **Embla Carousel**: Carousel component
- **cmdk**: Command menu component
- **Vaul**: Drawer component

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server-side bundling for production
- **Replit Plugins**: Custom Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)

### Form & Validation
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **@hookform/resolvers**: Zod integration with React Hook Form

### Session Management
- **connect-pg-simple**: PostgreSQL session store (ready for auth implementation)
- **express-session**: Session middleware

## MCP Integration System

### AI-Powered Ingestion Wizard
The application features a comprehensive MCP (Model Context Protocol) integration with AI-powered data ingestion:

- **5-Step Workflow**: Connect → Analyze → Questions → Review → Approve
- **AI Analysis**: Anthropic Claude-powered data summarization and POV generation
- **SAFe Mapping**: Automatic mapping recommendations to SAFe ontology entities
- **Clarifying Questions**: AI generates context-aware questions to resolve ambiguities
- **QA Gate**: Quality assurance reviews before data ingestion (data_quality, mapping_accuracy, schema_validation, completeness)

### MCP Tools (10 tools available at /mcp-config)
1. **AI Ingestion Wizard**: Full workflow for data import with AI analysis
2. **Connect & Analyze**: Connect to external PPM tools
3. **Field Mapping**: Configure source-to-SAFe field mappings
4. **Data QA Gate**: AI-powered quality assurance
5. **Sync Status**: Monitor sync jobs and history
6. **AI Data Analysis**: Standalone data analysis tool
7. **Schema Explorer**: Browse SAFe ontology hierarchy
8. **Conflict Resolver**: Manage data conflicts during sync
9. **Health Monitor**: MCP adapter health status
10. **Batch Import**: CSV/Excel/JSON file import

### External PPM Tool API Clients
The application includes production-ready API clients for three major PPM tools:

**Jira** (`server/jiraClient.ts`)
- Authentication: Basic Auth with API Token
- Required config: `domain`, `email`, `apiToken`, `projectKey`
- Syncs: Projects, Epics → Features, Stories, Tasks/Sub-tasks

**ServiceNow** (`server/serviceNowClient.ts`)
- Authentication: Basic Auth (username/password)
- Required config: `instanceUrl`, `username`, `password`
- Syncs: Projects, Demands/Epics → Features, Stories, Tasks

**Azure DevOps** (`server/azureDevOpsClient.ts`)
- Authentication: Personal Access Token (PAT)
- Required config: `organization`, `project`, `personalAccessToken`
- Syncs: Projects, Epics/Features, User Stories/PBIs, Tasks

### Sync Job Scheduling
- **Cron-based scheduling**: Configure sync jobs with cron expressions
- **Webhook handlers**: Receive real-time updates from external systems
- **Conflict resolution**: Strategies for handling data conflicts (source_wins, target_wins, last_write_wins, manual)
- **Background sync**: 60-second interval checks for due sync jobs

### Database Tables for MCP
- `sync_jobs`: Scheduled sync jobs with cron expressions
- `sync_job_runs`: Execution history for sync jobs
- `webhook_endpoints`: Incoming webhook handlers
- `webhook_events`: Log of received webhook events
- `ingestion_sessions`: AI-powered ingestion workflow state
- `qa_reviews`: QA gate reviews with scores and recommendations
- `clarifying_questions`: AI-generated questions and user answers