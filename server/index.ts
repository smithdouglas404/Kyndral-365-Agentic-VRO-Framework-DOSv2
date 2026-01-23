import { config } from "dotenv";
config(); // Load .env file FIRST before anything else

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createAgentScheduler } from "./agents/AgentScheduler.js";
import { startSyncScheduler } from "./syncScheduler";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { log } from "./log";

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
    () => {
      log(`serving on port ${port}`);

      // ===================================================================
      // Start LangChain Agent Scheduler (REPLACES SIMULATION)
      // This starts real intelligent agents that monitor actual project data
      // NO MORE FAKE DATA - agents query real projects via ontology/OBDA
      // ===================================================================
      const agentScheduler = createAgentScheduler(storage);
      agentScheduler.startAll().catch(err => {
        console.error("Failed to start agent scheduler:", err);
      });

      // Start MCP sync scheduler for cron-based sync jobs
      startSyncScheduler().catch(err => {
        console.error("Failed to start sync scheduler:", err);
      });
    },
  );
})();
