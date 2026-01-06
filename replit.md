# VRO Strategy Dashboard

## Overview

This is a **VRO (Value Realization Office) Strategy Dashboard** application for Legal & General. It's a full-stack TypeScript application that visualizes client challenges and VRO responses, comparing VRO performance metrics against traditional PMO approaches. The dashboard presents strategic value propositions, challenge cards with detailed solutions, and interactive data visualizations with simulated real-time data updates.

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