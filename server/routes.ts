import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parsePolicyDocument, extractPolicyMetadata, generateLifecycleInsight } from "./anthropic";
import { registerCoPilotRoutes } from "./copilot";
import { z } from "zod";
import multer from "multer";
import { PDFParse } from "pdf-parse";

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; numpages: number; info: any }> {
  const parser = new PDFParse({ data: buffer });
  const textResult = await parser.getText();
  const infoResult = await parser.getInfo();
  
  // Get page count from the pages array
  const pageCount = textResult.pages?.length || 0;
  
  const result = {
    text: textResult.text.trim(),
    numpages: pageCount,
    info: infoResult.info || {}
  };
  
  await parser.destroy();
  return result;
}

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
  name: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register AI CoPilot routes
  registerCoPilotRoutes(app);

  app.post("/api/policies/upload-pdf", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const pdfData = await parsePdfBuffer(req.file.buffer);
      const extractedText = pdfData.text;
      
      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({ error: "Could not extract meaningful text from PDF" });
      }

      let metadata = {
        policyName: req.file.originalname.replace('.pdf', '').replace(/_/g, ' '),
        provider: '',
        documentId: '',
      };
      
      try {
        metadata = await extractPolicyMetadata(extractedText, req.file.originalname);
      } catch (metadataError) {
        console.warn("Failed to extract metadata with AI, using defaults:", metadataError);
      }

      res.json({
        text: extractedText,
        filename: req.file.originalname,
        pages: pdfData.numpages,
        info: pdfData.info,
        suggestedName: metadata.policyName,
        suggestedProvider: metadata.provider,
        suggestedDocumentId: metadata.documentId,
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

  app.get("/api/business-units", async (_req, res) => {
    try {
      const units = await storage.getBusinessUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business units" });
    }
  });

  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/policies/:id/business-units", async (req, res) => {
    try {
      const units = await storage.getBusinessUnitsForPolicy(req.params.id);
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch linked business units" });
    }
  });

  app.post("/api/policies/:id/business-units", async (req, res) => {
    try {
      const { businessUnitId } = req.body;
      if (!businessUnitId) {
        return res.status(400).json({ error: "businessUnitId is required" });
      }
      const link = await storage.linkPolicyToBusinessUnit({
        policyId: req.params.id,
        businessUnitId,
      });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to link policy to business unit" });
    }
  });

  app.delete("/api/policies/:id/business-units/:buId", async (req, res) => {
    try {
      await storage.unlinkPolicyFromBusinessUnit(req.params.id, req.params.buId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlink policy from business unit" });
    }
  });

  app.get("/api/policies/:id/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsForPolicy(req.params.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch linked projects" });
    }
  });

  app.post("/api/policies/:id/projects", async (req, res) => {
    try {
      const { projectId, impactLevel } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }
      const link = await storage.linkPolicyToProject({
        policyId: req.params.id,
        projectId,
        impactLevel: impactLevel || 'medium',
      });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to link policy to project" });
    }
  });

  app.delete("/api/policies/:id/projects/:projId", async (req, res) => {
    try {
      await storage.unlinkPolicyFromProject(req.params.id, req.params.projId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlink policy from project" });
    }
  });

  app.get("/api/policies/:id/impact-analysis", async (req, res) => {
    try {
      const policy = await storage.getPolicy(req.params.id);
      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }
      
      const businessUnits = await storage.getBusinessUnitsForPolicy(req.params.id);
      const linkedProjects = await storage.getProjectsForPolicy(req.params.id);
      
      const allProjects = await storage.getProjects();
      const potentialImpact = allProjects.filter(p => 
        businessUnits.some(bu => bu.id === p.businessUnitId) &&
        !linkedProjects.some(lp => lp.id === p.id)
      );

      res.json({
        policy: { id: policy.id, name: policy.name },
        businessUnits,
        linkedProjects,
        potentialImpact,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to perform impact analysis" });
    }
  });

  // Agent Memory & Learning API Routes with Zod validation
  const agentMemorySchema = z.object({
    agentId: z.string().min(1),
    memoryType: z.enum(['action', 'pattern', 'insight', 'learning']),
    targetType: z.string().optional(),
    targetId: z.string().optional(),
    targetName: z.string().optional(),
    content: z.string().min(1),
    confidence: z.string().optional(),
    metadata: z.string().optional(),
  });

  const agentPatternSchema = z.object({
    patternType: z.string().min(1),
    targetType: z.string().min(1),
    targetIdentifier: z.string().min(1),
    description: z.string().min(1),
  });

  const agentTaskSchema = z.object({
    assignedAgent: z.string().min(1),
    taskType: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    targetType: z.string().optional(),
    targetId: z.string().optional(),
    targetName: z.string().optional(),
    description: z.string().min(1),
    reasoning: z.string().optional(),
    delegatedBy: z.string().optional(),
  });

  app.get("/api/agents/memory", async (req, res) => {
    try {
      const agentId = req.query.agentId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const memories = await storage.getAgentMemory(agentId, limit);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent memory" });
    }
  });

  app.post("/api/agents/memory", async (req, res) => {
    try {
      const parsed = agentMemorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }
      const memory = await storage.createAgentMemory(parsed.data);
      res.json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to create agent memory" });
    }
  });

  app.get("/api/agents/patterns", async (req, res) => {
    try {
      const targetType = req.query.targetType as string | undefined;
      const patterns = await storage.getAgentPatterns(targetType);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent patterns" });
    }
  });

  app.post("/api/agents/patterns", async (req, res) => {
    try {
      const parsed = agentPatternSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }
      const pattern = await storage.createOrUpdateAgentPattern(parsed.data);
      res.json(pattern);
    } catch (error) {
      res.status(500).json({ error: "Failed to create/update agent pattern" });
    }
  });

  app.get("/api/agents/tasks", async (req, res) => {
    try {
      const agentId = req.query.agentId as string | undefined;
      const status = req.query.status as string | undefined;
      const tasks = await storage.getAgentTasks(agentId, status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent tasks" });
    }
  });

  app.post("/api/agents/tasks", async (req, res) => {
    try {
      const parsed = agentTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }
      const task = await storage.createAgentTask(parsed.data);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to create agent task" });
    }
  });

  app.patch("/api/agents/tasks/:taskId/status", async (req, res) => {
    try {
      const statusSchema = z.object({ status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']) });
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await storage.updateAgentTaskStatus(req.params.taskId, parsed.data.status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update agent task status" });
    }
  });

  app.post("/api/ai/lifecycle-insight", async (req, res) => {
    try {
      const { metrics, funnel, recentChanges } = req.body;
      const insight = await generateLifecycleInsight(metrics, funnel, recentChanges);
      res.json({ insight });
    } catch (error: any) {
      console.error("Lifecycle insight error:", error);
      res.status(500).json({ error: error.message || "Failed to generate insight" });
    }
  });

  return httpServer;
}
