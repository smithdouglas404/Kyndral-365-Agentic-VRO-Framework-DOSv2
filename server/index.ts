import { config } from "dotenv";
config(); // Load .env file FIRST before anything else

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createAgentScheduler, type AgentScheduler } from "./agents/AgentScheduler.js";
import { BattleRhythmOrchestrator } from "./lib/BattleRhythmOrchestrator.js";
import { BattleRhythmTaskProcessor } from "./lib/BattleRhythmTaskProcessor.js";
import { getEventDrivenOrchestrator } from "./lib/EventDrivenOrchestrator.js";
import { getBootstrapInstance } from "./routes/orchestration.js";
import { initializeMCPServices, getPalantirService } from "./mcp/MCPServiceFactory.js";
import { OntologyDataProvider } from "./services/OntologyDataProvider.js";
import { PalantirSyncService } from "./services/PalantirSyncService.js";
import { startPalantirSyncScheduler, stopPalantirSyncScheduler } from "./services/PalantirSyncScheduler.js";
import { initializeFirebaseAuthService } from "./auth/firebaseAdmin.js";
import { startSyncScheduler } from "./syncScheduler";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { log } from "./log";
import { logger } from "./lib/logger.js";
import {
  setupProcessHandlers,
  recordActivity,
  createAgentSchedulerCleanup,
  createOrchestratorCleanup,
  startMemoryMonitoring,
} from "./lib/processManager.js";
import { registerHealthRoutes, trackRequestMetrics } from "./routes/health.js";
import { configureSecurityHeaders } from "./auth/securityMiddleware.js";
import { serverReadyService } from "./services/ServerReadyService.js";

// Export agent scheduler instance (initialized after server starts)
export let agentScheduler: AgentScheduler | null = null;

/**
 * Get the global agent scheduler instance
 * Use this in routes instead of creating new schedulers
 */
export function getGlobalAgentScheduler(): AgentScheduler {
  if (!agentScheduler) {
    throw new Error('Agent scheduler not initialized. Server may still be starting.');
  }
  return agentScheduler;
}

// Export Battle Rhythm orchestrator (cadence-aware weekly scheduling)
export let battleRhythmOrchestrator: BattleRhythmOrchestrator | null = null;

// Export Battle Rhythm task processor (processes Sunday Recon tasks)
export let battleRhythmTaskProcessor: BattleRhythmTaskProcessor | null = null;


const app = express();
const httpServer = createServer(app);

setupWebSocket(httpServer);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// PRODUCTION: Track request metrics for health monitoring
app.use(trackRequestMetrics());

// PRODUCTION: Register health check endpoints FIRST (before auth/other middleware)
registerHealthRoutes(app, storage);

// SECURITY: Configure security headers (Helmet.js)
configureSecurityHeaders(app);

export { log };

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Record activity for hanging process detection
  recordActivity();

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Database is connected at this point (via storage import)
  serverReadyService.setDbConnected();

  await registerRoutes(httpServer, app);
  serverReadyService.setRoutesRegistered();

  // Backfill orphan strategic themes with portfolio linkage
  try {
    const backfillCount = await storage.backfillStrategicThemesPortfolioId();
    if (backfillCount > 0) {
      log(`Backfilled ${backfillCount} strategic themes with portfolio linkage`);
    }
  } catch (e: any) {
    log(`Strategic themes backfill skipped: ${e.message}`);
  }

  // Run master seed (ontology + industries + rules + agents)
  try {
    const { runMasterSeed } = await import('./scripts/seed-master.js');
    await runMasterSeed();
    log('[Seed] ✅ Master seed completed - System fully initialized');
    serverReadyService.setSeedsComplete();
  } catch (e: any) {
    log(`[Seed] Master seed skipped: ${e.message}`);
    // Seeds are optional, still mark as complete to unblock orchestrator
    serverReadyService.setSeedsComplete();
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: process.env.HOST || "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);
      serverReadyService.setPortBound();

      // Setup Vite AFTER port binding so the workflow monitor sees the port quickly
      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
        serverReadyService.setViteReady(); // Static serving ready
      } else {
        const { setupVite } = await import("./vite");
        await setupVite(httpServer, app);
        log("Vite dev server ready");
        serverReadyService.setViteReady();
      }

      // ===================================================================
      // Initialize Firebase Authentication Service
      // Provides Firebase Admin SDK integration for user authentication
      // ===================================================================
      try {
        log("🔥 Initializing Firebase Authentication...");
        initializeFirebaseAuthService(storage);
        log("✅ Firebase Authentication initialized");
      } catch (error: any) {
        log(`⚠️  Firebase Authentication not configured: ${error.message}`);
        log("   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable Firebase auth");
      }

      // ===================================================================
      // Start Battle Rhythm Orchestrator (MILITARY-INSPIRED CADENCE)
      // Weekly decision-making rhythm: Sunday Recon → Mon-Fri events
      // Replaces continuous 15-second agent polling with scheduled synthesis
      // ===================================================================
      log("🎖️  Initializing Battle Rhythm Orchestrator...");
      battleRhythmOrchestrator = new BattleRhythmOrchestrator(storage);
      await battleRhythmOrchestrator.start();
      log("✅ Battle Rhythm Orchestrator started - Weekly cadence active");

      // ===================================================================
      // Initialize MCP Services (Jira, ServiceNow, Monday.com, etc.)
      // ===================================================================
      log("🔌 Initializing MCP Services...");
      initializeMCPServices();
      log("✅ MCP Services initialized - Real API integrations ready");
      serverReadyService.setMcpReady();

      // ===================================================================
      // Initialize Palantir Ontology Services (ONTOLOGY-FIRST ARCHITECTURE)
      // All data flows through Palantir Foundry as source of truth
      // External systems (Jira, OpenProject, Monday) sync TO Palantir
      // ===================================================================
      try {
        const palantirService = getPalantirService();
        if (palantirService) {
          log("🎯 Initializing Ontology Data Provider (Palantir-first)...");
          await OntologyDataProvider.initialize(palantirService);
          PalantirSyncService.initialize(palantirService);
          log("✅ Ontology Data Provider initialized - Palantir is source of truth");
        } else {
          log("⚠️  Palantir service not configured - ontology features disabled");
          log("   Set PALANTIR_HOSTNAME and PALANTIR_TOKEN to enable");
        }
      } catch (error: any) {
        log(`⚠️  Ontology Data Provider initialization failed: ${error.message}`);
      }

      // ===================================================================
      // Start LangChain Agent Scheduler (INTEGRATED WITH BATTLE RHYTHM)
      // Agents now compile findings for weekly synthesis instead of continuous alerts
      // Agent runs triggered by Battle Rhythm events (Sun → Mon → Tue → Wed → Thu → Fri)
      // ===================================================================
      log("🤖 Initializing Agent Scheduler...");
      agentScheduler = createAgentScheduler(storage);
      agentScheduler.startAll().catch(err => {
        console.error("Failed to start agent scheduler:", err);
      });
      log("✅ Agent Scheduler started - Integrated with Battle Rhythm");

      // ===================================================================
      // Start Battle Rhythm Task Processor
      // Processes tasks from agent_task_queue (created by Sunday Recon)
      // Executes agent synthesis and logs to agent_activity_log
      // ===================================================================
      log("⚙️  Initializing Battle Rhythm Task Processor...");
      battleRhythmTaskProcessor = new BattleRhythmTaskProcessor(storage, agentScheduler);
      battleRhythmTaskProcessor.start();
      log("✅ Battle Rhythm Task Processor started - Processing synthesis tasks");

      // ===================================================================
      // Start Event-Driven Orchestrator (replaces 15s continuous polling)
      // Agents fire ONLY when data changes (registerChange / registerMemoryChange)
      // ~93% LLM cost reduction vs the fixed-interval polling loop
      // ===================================================================
      try {
        log("⚡ Initializing Event-Driven Orchestrator...");
        const eventOrchestrator = getEventDrivenOrchestrator(storage);
        if (eventOrchestrator) {
          // Map DeepAgentBootstrap agent keys → ids expected by
          // EventDrivenOrchestrator.determineAgentsForEvents()
          const AGENT_ID_MAP: Record<string, string> = {
            finops: "deepfinops",
            tmo: "deeptmo",
            risk: "deeprisk",
            vro: "deepvro",
            pmo: "deeppmo",
            ocm: "deepocm",
            governance: "deepgovernance",
            planning: "deepplanning",
            integrated: "deepintegratedmgmt",
            okr: "deepokrinference",
            notification: "deepnotification",
          };

          // Deep agents are loaded asynchronously by DeepAgentBootstrap
          // (see routes/orchestration.ts) - retry until they are available.
          const registerDeepAgents = (): boolean => {
            const bootstrap = getBootstrapInstance();
            const agents = bootstrap?.getAgents();
            if (!agents || agents.size === 0) return false;
            for (const [id, agent] of agents.entries()) {
              eventOrchestrator.registerAgent(AGENT_ID_MAP[id] || `deep${id}`, agent);
            }
            return true;
          };

          if (!registerDeepAgents()) {
            let attempts = 0;
            const retry = setInterval(() => {
              attempts++;
              if (registerDeepAgents()) {
                clearInterval(retry);
                log("✅ Deep agents registered with Event-Driven Orchestrator");
              } else if (attempts >= 30) {
                clearInterval(retry);
                log("⚠️  Deep agents not available for Event-Driven Orchestrator after 30 attempts");
              }
            }, 5000);
          }

          eventOrchestrator.startListening(5000);
          log("✅ Event-Driven Orchestrator listening - agents fire on data changes, not a timer");
        }
      } catch (error: any) {
        log(`⚠️  Event-Driven Orchestrator initialization failed: ${error.message}`);
      }

      // Start MCP sync scheduler for cron-based sync jobs
      startSyncScheduler().catch(err => {
        console.error("Failed to start sync scheduler:", err);
      });

      // ===================================================================
      // Start Palantir Sync Scheduler
      // Syncs external systems (Jira, OpenProject, Monday) TO Palantir
      // Configured via environment variables (JIRA_SYNC_ENABLED, etc.)
      // ===================================================================
      log("📡 Initializing Palantir Sync Scheduler...");
      startPalantirSyncScheduler();
      log("✅ Palantir Sync Scheduler started - External system sync jobs active");

      // ===================================================================
      // Setup Process Management & Graceful Shutdown
      // Handles SIGTERM, SIGINT, uncaught exceptions, hanging processes
      // ===================================================================
      const cleanupCallbacks = [];

      if (agentScheduler) {
        cleanupCallbacks.push(createAgentSchedulerCleanup(agentScheduler));
      }

      if (battleRhythmOrchestrator) {
        cleanupCallbacks.push(createOrchestratorCleanup(battleRhythmOrchestrator));
      }

      if (battleRhythmTaskProcessor) {
        cleanupCallbacks.push(async () => {
          console.log('[Cleanup] Stopping Battle Rhythm Task Processor...');
          battleRhythmTaskProcessor?.stop();
        });
      }

      // Add Event-Driven Orchestrator cleanup
      cleanupCallbacks.push(async () => {
        console.log('[Cleanup] Stopping Event-Driven Orchestrator...');
        getEventDrivenOrchestrator()?.stopListening();
      });

      // Add Palantir Sync Scheduler cleanup
      cleanupCallbacks.push(async () => {
        console.log('[Cleanup] Stopping Palantir Sync Scheduler...');
        stopPalantirSyncScheduler();
      });

      setupProcessHandlers(httpServer, cleanupCallbacks, {
        gracefulShutdownTimeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || "30000", 10), // 30 seconds
        healthCheckInterval: 60000, // 1 minute
        hangingProcessTimeout: 300000, // 5 minutes
      });

      // Start memory monitoring (warn if >512MB heap usage)
      startMemoryMonitoring(512, 60000);

      // Log server ready state for orchestrator
      serverReadyService.logState();
      logger.info("🚀 Server fully initialized with process management");
    },
  );
})();
