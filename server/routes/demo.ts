/**
 * ACME Demo Data API Routes
 * Endpoints for loading industry-specific demo data
 */

import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory demo session store (in production, use Redis or database)
const demoSessions = new Map<string, { industryId: string; companyId: string; timestamp: number }>();

// Load ACME seed data files once at startup
let seedDataCache: any = null;

function loadSeedData() {
  if (seedDataCache) return seedDataCache;

  const seedDataPath = path.join(__dirname, "../seed-data");

  seedDataCache = {
    companies: JSON.parse(fs.readFileSync(path.join(seedDataPath, "acme-companies.json"), "utf8")),
    projects: JSON.parse(fs.readFileSync(path.join(seedDataPath, "acme-project-templates.json"), "utf8")),
    interventions: JSON.parse(fs.readFileSync(path.join(seedDataPath, "acme-interventions.json"), "utf8")),
    observations: JSON.parse(fs.readFileSync(path.join(seedDataPath, "acme-observations.json"), "utf8")),
    battleRhythm: JSON.parse(fs.readFileSync(path.join(seedDataPath, "acme-battle-rhythm.json"), "utf8")),
    rulesState: JSON.parse(fs.readFileSync(path.join(seedDataPath, "acme-rules-state.json"), "utf8")),
  };

  return seedDataCache;
}

export function registerDemoRoutes(app: Express) {
  /**
   * GET /api/demo/industries
   * Returns list of available ACME industries for demo mode
   */
  app.get("/api/demo/industries", async (req: Request, res: Response) => {
    try {
      const seedData = loadSeedData();
      const industries = seedData.companies.map((company: any) => ({
        id: company.industryId,
        name: company.industryName || company.gicsIndustry,
        companyId: company.id,
        companyName: company.tradeNames?.[0] || company.legalName,
        description: company.businessSummary || company.description,
      }));

      res.json(industries);
    } catch (error: any) {
      console.error("Error loading demo industries:", error);
      res.status(500).json({ error: "Failed to load demo industries" });
    }
  });

  /**
   * POST /api/demo/activate/:industryId
   * Activates demo mode for specified industry
   * Sets session cookie to enable demo data serving
   */
  app.post("/api/demo/activate/:industryId", async (req: Request, res: Response) => {
    try {
      const { industryId } = req.params;
      const seedData = loadSeedData();

      // Find the industry data
      const companyData = seedData.companies.find((c: any) => c.industryId === industryId);
      if (!companyData) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const industryProjects = seedData.projects.find((p: any) => p.industryId === industryId);
      if (!industryProjects) {
        return res.status(404).json({ error: "Industry projects not found" });
      }

      // Create demo session
      const sessionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const companyId = companyData.id;
      const companyName = companyData.tradeNames?.[0] || companyData.legalName;

      demoSessions.set(sessionId, {
        industryId,
        companyId,
        timestamp: Date.now(),
      });

      // Set session cookie (expires in 24 hours)
      res.cookie("demo_session", sessionId, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax",
      });

      res.json({
        success: true,
        message: `Activated ACME demo mode for ${companyName}`,
        sessionId,
        industryId,
        companyId,
        companyName,
        projectCount: industryProjects.projects.length,
      });
    } catch (error: any) {
      console.error("Error activating demo mode:", error);
      res.status(500).json({ error: "Failed to activate demo mode", details: error.message });
    }
  });

  /**
   * GET /api/demo/data
   * Returns demo data for current session's industry
   * Used by dashboard and other pages to load ACME data
   */
  app.get("/api/demo/data", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.demo_session;

      if (!sessionId || !demoSessions.has(sessionId)) {
        return res.status(404).json({ error: "No active demo session" });
      }

      const session = demoSessions.get(sessionId)!;
      const seedData = loadSeedData();

      // Get industry data
      const companyData = seedData.companies.find((c: any) => c.companyId === session.companyId);
      const projectsData = seedData.projects.find((p: any) => p.industryId === session.industryId);
      const interventions = seedData.interventions.filter((i: any) => i.industryId === session.industryId);
      const observations = seedData.observations.filter((o: any) => o.industryId === session.industryId);
      const battleRhythm = seedData.battleRhythm.filter((b: any) => b.industryId === session.industryId);
      const rulesState = seedData.rulesState.filter((r: any) => r.industryId === session.industryId);

      res.json({
        company: companyData,
        projects: projectsData?.projects || [],
        interventions,
        observations,
        battleRhythm,
        rulesState,
        isDemoMode: true,
      });
    } catch (error: any) {
      console.error("Error loading demo data:", error);
      res.status(500).json({ error: "Failed to load demo data", details: error.message });
    }
  });

  /**
   * POST /api/demo/deactivate
   * Deactivates demo mode for current session
   */
  app.post("/api/demo/deactivate", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.demo_session;

      if (sessionId && demoSessions.has(sessionId)) {
        demoSessions.delete(sessionId);
      }

      res.clearCookie("demo_session");
      res.json({ success: true, message: "Demo mode deactivated" });
    } catch (error: any) {
      console.error("Error deactivating demo mode:", error);
      res.status(500).json({ error: "Failed to deactivate demo mode" });
    }
  });

  /**
   * GET /api/demo/status
   * Checks if demo mode is active for current session
   */
  app.get("/api/demo/status", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.demo_session;

      if (!sessionId || !demoSessions.has(sessionId)) {
        return res.json({ active: false });
      }

      const session = demoSessions.get(sessionId)!;
      const seedData = loadSeedData();
      const companyData = seedData.companies.find((c: any) => c.companyId === session.companyId);

      res.json({
        active: true,
        industryId: session.industryId,
        companyId: session.companyId,
        companyName: companyData?.tradeNames?.[0] || companyData?.legalName,
      });
    } catch (error: any) {
      console.error("Error checking demo status:", error);
      res.json({ active: false });
    }
  });

  // Cleanup old demo sessions every hour
  setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of demoSessions.entries()) {
      if (now - session.timestamp > maxAge) {
        demoSessions.delete(sessionId);
      }
    }
  }, 60 * 60 * 1000); // Run every hour
}
