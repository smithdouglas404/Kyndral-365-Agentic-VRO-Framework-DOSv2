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
import { initializeLangflowService, type LangflowService } from "./lib/LangflowService.js";
import { LangflowFlowGenerator } from "./lib/LangflowFlowGenerator.js";
import { initializeMCPServices } from "./mcp/MCPServiceFactory.js";
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

// Export Langflow service (visual workflow orchestration)
export let langflowService: LangflowService | null = null;

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
  await registerRoutes(httpServer, app);

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
  } catch (e: any) {
    log(`[Seed] Master seed skipped: ${e.message}`);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);

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

      // ===================================================================
      // Initialize Langflow Service (Visual Workflow Orchestration)
      // ===================================================================
      log("🎨 Initializing Langflow Service...");
      langflowService = initializeLangflowService();
      if (langflowService) {
        const connected = await langflowService.testConnection();
        if (connected) {
          log("✅ Langflow connected - Visual workflow orchestration ready");
          const flows = await langflowService.listFlows();
          log(`📋 Langflow: ${flows.length} flows available`);

          // ===================================================================
          // Auto-Generate Agent Flows (Programmatic Flow Creation)
          // ===================================================================
          log("🤖 Generating Langflow flows for all Deep Agents...");
          const flowGenerator = new LangflowFlowGenerator(langflowService);
          try {
            const generatedFlows = await flowGenerator.generateAllAgentFlows();
            log(`✅ Generated ${generatedFlows.size} agent flows programmatically`);

            // Log flow IDs
            for (const [agent, flowId] of generatedFlows.entries()) {
              log(`   - ${agent}: ${flowId}`);
            }
          } catch (error: any) {
            log(`⚠️  Flow generation failed: ${error.message}`);
          }
        } else {
          log("⚠️  Langflow connection test failed");
        }
      } else {
        log("⚠️  Langflow not configured - set LANGFLOW_API_URL and LANGFLOW_API_KEY");
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

      // Start MCP sync scheduler for cron-based sync jobs
      startSyncScheduler().catch(err => {
        console.error("Failed to start sync scheduler:", err);
      });

      // DISABLED: SyncScheduler and MCPSyncScheduler files removed
      // Automatic sync functionality should be implemented via MCP registry
      console.log("[Server] Automatic data sync schedulers disabled");

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

      setupProcessHandlers(httpServer, cleanupCallbacks, {
        gracefulShutdownTimeout: 30000, // 30 seconds
        healthCheckInterval: 60000, // 1 minute
        hangingProcessTimeout: 300000, // 5 minutes
      });

      // Start memory monitoring (warn if >512MB heap usage)
      startMemoryMonitoring(512, 60000);

      logger.info("🚀 Server fully initialized with process management");
    },
  );
})();
