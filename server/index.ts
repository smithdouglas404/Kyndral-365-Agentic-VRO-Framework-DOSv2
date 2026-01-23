import { config } from "dotenv";
config(); // Load .env file FIRST before anything else

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createAgentScheduler, type AgentScheduler } from "./agents/AgentScheduler.js";
import { BattleRhythmOrchestrator } from "./lib/BattleRhythmOrchestrator.js";
import { startSyncScheduler } from "./syncScheduler";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { log } from "./log";
import { registerHealthRoutes, trackRequestMetrics } from "./routes/health.js";

// Export agent scheduler instance (initialized after server starts)
export let agentScheduler: AgentScheduler | null = null;

// Export Battle Rhythm orchestrator (cadence-aware weekly scheduling)
export let battleRhythmOrchestrator: BattleRhythmOrchestrator | null = null;

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

// PRODUCTION: Track request metrics for health monitoring
app.use(trackRequestMetrics());

// PRODUCTION: Register health check endpoints FIRST (before auth/other middleware)
registerHealthRoutes(app, storage);

export { log };

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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
      // Start Battle Rhythm Orchestrator (MILITARY-INSPIRED CADENCE)
      // Weekly decision-making rhythm: Sunday Recon → Mon-Fri events
      // Replaces continuous 15-second agent polling with scheduled synthesis
      // ===================================================================
      log("🎖️  Initializing Battle Rhythm Orchestrator...");
      battleRhythmOrchestrator = new BattleRhythmOrchestrator(storage);
      await battleRhythmOrchestrator.start();
      log("✅ Battle Rhythm Orchestrator started - Weekly cadence active");

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

      // Start MCP sync scheduler for cron-based sync jobs
      startSyncScheduler().catch(err => {
        console.error("Failed to start sync scheduler:", err);
      });

      // Start automatic data sync scheduler for Planview/Google Sheets
      const { createSyncScheduler } = await import("./mcp/SyncScheduler.js");
      const dataSyncScheduler = createSyncScheduler(storage, {
        planview: {
          enabled: !!process.env.PLANVIEW_URL && !!process.env.PLANVIEW_API_KEY,
          intervalMs: 4 * 60 * 60 * 1000, // 4 hours
          portfolioId: process.env.PLANVIEW_DEFAULT_PORTFOLIO_ID,
        },
        googleSheets: {
          enabled: !!process.env.GOOGLE_SHEETS_API_KEY && !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          intervalMs: 6 * 60 * 60 * 1000, // 6 hours
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
          sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME,
        },
      });

      if (dataSyncScheduler.getStatus().planviewEnabled || dataSyncScheduler.getStatus().googleSheetsEnabled) {
        dataSyncScheduler.start();
        console.log("[Server] Automatic data sync scheduler started");
      } else {
        console.log("[Server] Automatic data sync scheduler disabled (no credentials configured)");
      }
    },
  );
})();
