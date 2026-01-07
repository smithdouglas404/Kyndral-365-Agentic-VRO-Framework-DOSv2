import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parsePolicyDocument } from "./anthropic";
import { z } from "zod";
import multer from "multer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const parsePolicyRequestSchema = z.object({
  text: z.string().min(1, "Policy text is required"),
  name: z.string().optional(),
  provider: z.string().optional(),
  documentId: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/policies/upload-pdf", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;
      
      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({ error: "Could not extract meaningful text from PDF" });
      }

      res.json({
        text: extractedText,
        filename: req.file.originalname,
        pages: pdfData.numpages,
        info: pdfData.info,
      });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: error.message || "Failed to process PDF" });
    }
  });
  
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
      const parsed = parsePolicyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { text, name, provider, documentId } = parsed.data;
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
