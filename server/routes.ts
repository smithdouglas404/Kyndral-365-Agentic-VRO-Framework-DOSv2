import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parsePolicyDocument } from "./anthropic";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/policies", async (_req, res) => {
    try {
      const policies = await storage.getPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  app.get("/api/policies/:id", async (req, res) => {
    try {
      const policy = await storage.getPolicy(req.params.id);
      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch policy" });
    }
  });

  app.post("/api/policies/parse", async (req, res) => {
    try {
      const { text, name, provider, documentId } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Policy text is required" });
      }

      const generatedCode = await parsePolicyDocument(text);
      
      const policy = await storage.createPolicy({
        name: name || "Untitled Policy",
        provider: provider || null,
        documentId: documentId || null,
        sourceText: text,
        generatedCode,
        codeFormat: "yaml",
      });

      res.json(policy);
    } catch (error: any) {
      console.error("Policy parsing error:", error);
      res.status(500).json({ error: error.message || "Failed to parse policy" });
    }
  });

  app.delete("/api/policies/:id", async (req, res) => {
    try {
      await storage.deletePolicy(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete policy" });
    }
  });

  return httpServer;
}
