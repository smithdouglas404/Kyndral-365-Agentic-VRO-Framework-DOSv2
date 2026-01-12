import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parsePolicyDocument, extractPolicyMetadata, generateLifecycleInsight } from "./anthropic";
import { registerCoPilotRoutes } from "./copilot";
import { askPM } from "./askPM";
import { generateExecutiveInsights, refreshInsights } from "./executiveInsights";
import { z } from "zod";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import * as fs from "fs";
import * as path from "path";

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

  // Executive AI Insights endpoint
  app.get("/api/insights/executive", async (_req, res) => {
    try {
      const insights = await generateExecutiveInsights();
      res.json(insights);
    } catch (error: any) {
      console.error("Executive insights error:", error);
      res.status(500).json({ error: error.message || "Failed to generate insights" });
    }
  });

  app.post("/api/insights/executive/refresh", async (_req, res) => {
    try {
      const insights = await refreshInsights();
      res.json(insights);
    } catch (error: any) {
      console.error("Executive insights refresh error:", error);
      res.status(500).json({ error: error.message || "Failed to refresh insights" });
    }
  });

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

  const askPMSchema = z.object({
    question: z.string().min(1, "Question is required").max(500, "Question too long"),
    pageContext: z.object({
      pageType: z.enum(['dashboard', 'division', 'project', 'portfolio', 'other']).optional(),
      entityId: z.string().optional(),
      entityName: z.string().optional(),
      businessUnit: z.string().optional()
    }).optional()
  });

  app.post("/api/ai/ask-pm", async (req, res) => {
    try {
      const parsed = askPMSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { question, pageContext } = parsed.data;
      const response = await askPM(question, pageContext);
      
      // Detect action keywords in user question and create agent cascade
      const actionKeywords = ['increase budget', 'extend deadline', 'reallocate', 'add resources', 'change priority', 'escalate', 'approve', 'delay', 'accelerate'];
      const questionLower = question.toLowerCase();
      const triggersAction = actionKeywords.some(keyword => questionLower.includes(keyword));
      
      let agentCascade = null;
      if (triggersAction && pageContext?.entityId && pageContext?.entityName) {
        // Create an intervention based on PM Chat action
        const interventionType = questionLower.includes('budget') ? 'budget' : 
                                 questionLower.includes('deadline') || questionLower.includes('delay') ? 'timeline' :
                                 questionLower.includes('resource') ? 'resource' : 'quality';
        
        try {
          const intervention = await storage.createIntervention({
            type: interventionType,
            severity: 'medium',
            title: `PM Chat Action: ${pageContext.entityName}`,
            description: `Action requested via PM Chat: "${question.substring(0, 100)}..."`,
            projectId: pageContext.entityId,
            projectName: pageContext.entityName,
            confidence: '0.85',
            suggestedAction: `Review and approve the requested change for ${pageContext.entityName}.`,
            impact: 'Impact analysis pending - review recommended.',
            status: 'pending',
            agentSource: 'PM Chat Assistant'
          });
          
          // Also create a discussion about this action
          const discussion = await storage.createDiscussion({
            topic: `PM Chat Request: ${pageContext.entityName}`,
            status: 'active',
            projectId: pageContext.entityId,
            projectName: pageContext.entityName,
            priority: 'medium'
          });
          
          await storage.addDiscussionMessage({
            discussionId: discussion.id,
            agentId: 'pm-chat',
            agentName: 'PM Chat Assistant',
            content: `User requested: "${question}". AI analysis provided. Recommending agent review.`,
            messageType: 'analysis'
          });
          
          await storage.addDiscussionMessage({
            discussionId: discussion.id,
            agentId: 'integrated-management',
            agentName: 'Integrated Management Agent',
            content: `Acknowledged. Evaluating impact on portfolio and dependent projects.`,
            messageType: 'agreement'
          });
          
          agentCascade = { interventionId: intervention.id, discussionId: discussion.id };
          console.log(`PM Chat triggered agent cascade for ${pageContext.entityName}`);
        } catch (cascadeError) {
          console.error('Failed to create agent cascade:', cascadeError);
        }
      }
      
      res.json({ response, agentCascade });
    } catch (error: any) {
      console.error("Ask PM error:", error);
      res.status(500).json({ error: error.message || "Failed to get AI response" });
    }
  });

  app.post("/api/ai/executive-summary", async (req, res) => {
    try {
      const { projectId, projectName, projectData } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const prompt = `Generate a concise executive summary (150-200 words) for this project for a C-level audience. Focus on strategic value, key risks, and recommended actions.

Project: ${projectName || projectId}
${projectData ? `
Status: ${projectData.status}
Priority: ${projectData.priority}
Business Unit: ${projectData.bu}
Budget: £${projectData.budget}M (${projectData.budgetUtilization}% utilized)
ROI: £${projectData.roi}M projected
Timeline: PI ${projectData.currentPI} of ${projectData.totalPIs}
Key Risks: ${projectData.risks || 'None identified'}
Dependencies: ${projectData.dependencies || 'None'}
` : ''}

Format the response with clear sections: Strategic Value, Current Status, Key Risks, Recommended Actions.`;

      const response = await askPM(prompt, { pageType: 'project', entityId: projectId, entityName: projectName });
      res.json({ summary: response });
    } catch (error: any) {
      console.error("Executive summary error:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  // Project Template endpoints
  const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');
  
  app.get("/api/templates", async (_req, res) => {
    try {
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }
      const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
      res.json({ templates: files });
    } catch (error: any) {
      console.error("Templates list error:", error);
      res.status(500).json({ error: "Failed to list templates" });
    }
  });

  app.get("/api/templates/:name", async (req, res) => {
    try {
      const templatePath = path.join(templatesDir, req.params.name);
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: "Template not found" });
      }
      const content = fs.readFileSync(templatePath, 'utf-8');
      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("Template fetch error:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/projects/ingest", async (req, res) => {
    try {
      const projectData = req.body;
      if (!projectData.name || !projectData.bu) {
        return res.status(400).json({ error: "Project name and business unit are required" });
      }
      
      // Create project in database
      const project = await storage.createProject({
        name: projectData.name,
        description: projectData.description || `${projectData.name} - SAFe 6.0 Managed Project`,
        businessUnitId: projectData.bu,
        status: projectData.status || 'planning',
        startDate: projectData.startDate ? new Date(projectData.startDate) : null,
        endDate: projectData.endDate ? new Date(projectData.endDate) : null
      });

      res.json({ 
        success: true, 
        projectId: project.id,
        message: `Project "${projectData.name}" created successfully`,
        agentActions: [
          { agent: 'TMO Agent', action: 'Team notification sent', status: 'completed' },
          { agent: 'Planning Agent', action: 'Kickoff meeting scheduled', status: 'completed' },
          { agent: 'FinOps Agent', action: 'Budget allocated', status: 'completed' },
          { agent: 'Governance Agent', action: 'Approval workflow initiated', status: 'completed' },
          { agent: 'OKR Agent', action: 'Strategic objectives linked', status: 'completed' },
          { agent: 'OCM Agent', action: 'Change communication prepared', status: 'completed' }
        ]
      });
    } catch (error: any) {
      console.error("Project ingest error:", error);
      res.status(500).json({ error: "Failed to ingest project" });
    }
  });

  // Intervention management endpoints with database persistence
  app.get("/api/interventions", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const interventions = await storage.getInterventions(status);
      res.json({ interventions });
    } catch (error: any) {
      console.error("Get interventions error:", error);
      res.status(500).json({ error: "Failed to get interventions" });
    }
  });

  app.post("/api/interventions", async (req, res) => {
    try {
      const intervention = await storage.createIntervention(req.body);
      res.json(intervention);
    } catch (error: any) {
      console.error("Create intervention error:", error);
      res.status(500).json({ error: "Failed to create intervention" });
    }
  });

  app.post("/api/interventions/approve", async (req, res) => {
    try {
      const { interventionId, userId } = req.body;
      if (!interventionId) {
        return res.status(400).json({ error: "Intervention ID is required" });
      }
      const intervention = await storage.updateInterventionStatus(interventionId, 'approved', userId);
      console.log(`Intervention ${interventionId} approved`);
      res.json({ 
        success: true, 
        intervention,
        message: 'Intervention approved and agent cascade initiated'
      });
    } catch (error: any) {
      console.error("Intervention approve error:", error);
      res.status(500).json({ error: "Failed to approve intervention" });
    }
  });

  app.post("/api/interventions/dismiss", async (req, res) => {
    try {
      const { interventionId, userId } = req.body;
      if (!interventionId) {
        return res.status(400).json({ error: "Intervention ID is required" });
      }
      const intervention = await storage.updateInterventionStatus(interventionId, 'dismissed', userId);
      console.log(`Intervention ${interventionId} dismissed`);
      res.json({ 
        success: true, 
        intervention,
        message: 'Intervention dismissed'
      });
    } catch (error: any) {
      console.error("Intervention dismiss error:", error);
      res.status(500).json({ error: "Failed to dismiss intervention" });
    }
  });

  // Agent discussion endpoints with database persistence (both /api/discussions and /api/agent-discussions)
  const discussionsHandler = async (req: any, res: any) => {
    try {
      const status = req.query.status as string | undefined;
      const discussions = await storage.getDiscussions(status);
      res.json({ discussions });
    } catch (error: any) {
      console.error("Get discussions error:", error);
      res.status(500).json({ error: "Failed to get discussions" });
    }
  };
  app.get("/api/discussions", discussionsHandler);
  app.get("/api/agent-discussions", discussionsHandler);

  const createDiscussionHandler = async (req: any, res: any) => {
    try {
      const discussion = await storage.createDiscussion(req.body);
      res.json(discussion);
    } catch (error: any) {
      console.error("Create discussion error:", error);
      res.status(500).json({ error: "Failed to create discussion" });
    }
  };
  app.post("/api/discussions", createDiscussionHandler);
  app.post("/api/agent-discussions", createDiscussionHandler);

  const getMessagesHandler = async (req: any, res: any) => {
    try {
      const messages = await storage.getDiscussionMessages(req.params.discussionId);
      res.json({ messages });
    } catch (error: any) {
      console.error("Get discussion messages error:", error);
      res.status(500).json({ error: "Failed to get discussion messages" });
    }
  };
  app.get("/api/discussions/:discussionId/messages", getMessagesHandler);
  app.get("/api/agent-discussions/:discussionId/messages", getMessagesHandler);

  const addMessageHandler = async (req: any, res: any) => {
    try {
      const message = await storage.addDiscussionMessage({
        ...req.body,
        discussionId: req.params.discussionId
      });
      res.json(message);
    } catch (error: any) {
      console.error("Add discussion message error:", error);
      res.status(500).json({ error: "Failed to add discussion message" });
    }
  };
  app.post("/api/discussions/:discussionId/messages", addMessageHandler);
  app.post("/api/agent-discussions/:discussionId/messages", addMessageHandler);

  // Seed Command Center with sample data endpoint
  app.post("/api/command-center/seed", async (_req, res) => {
    try {
      const sampleInterventions = [
        {
          type: 'budget',
          severity: 'critical',
          title: 'Climate Analytics Budget Overrun Detected',
          description: 'The Climate Transition Analytics project is trending 18% over budget due to expanded TCFD compliance requirements.',
          projectId: 'proj-climate-analytics',
          projectName: 'Climate Transition Analytics',
          confidence: '0.92',
          suggestedAction: 'Reallocate £450K from contingency reserve and accelerate Phase 2 deliverables to recover timeline.',
          impact: 'Without intervention, project NPV decreases by £2.1M and TCFD compliance deadline at risk.',
          status: 'pending',
          agentSource: 'FinOps Agent'
        },
        {
          type: 'timeline',
          severity: 'high',
          title: 'Bulk Annuity Pricing Engine Milestone Slip',
          description: 'Critical path analysis indicates 3-week delay risk for PRA regulatory submission milestone.',
          projectId: 'proj-pricing-engine',
          projectName: 'Bulk Annuity Pricing Engine',
          confidence: '0.87',
          suggestedAction: 'Deploy additional actuarial resources and implement parallel testing tracks.',
          impact: 'Delay may result in £1.8M penalty and reputational risk with regulator.',
          status: 'pending',
          agentSource: 'TMO Agent'
        },
        {
          type: 'dependency',
          severity: 'high',
          title: 'Data Platform Integration Blocker',
          description: 'Enterprise Data Platform dependency blocking 4 downstream projects. SFDR reporting capability delayed.',
          projectId: 'proj-data-platform',
          projectName: 'Enterprise Data Platform',
          confidence: '0.94',
          suggestedAction: 'Escalate to Architecture Board and implement temporary data bridge solution.',
          impact: '£3.2M in blocked project value across portfolio.',
          status: 'pending',
          agentSource: 'Integrated Management Agent'
        },
        {
          type: 'resource',
          severity: 'medium',
          title: 'Client Portal Resource Contention',
          description: 'Key senior developers allocated to multiple concurrent sprints. Velocity at risk.',
          projectId: 'proj-client-portal',
          projectName: 'Client Portal Modernization',
          confidence: '0.78',
          suggestedAction: 'Request dedicated team allocation for Q2 sprint cycle.',
          impact: 'Current trajectory shows 15% velocity reduction.',
          status: 'pending',
          agentSource: 'OCM Agent'
        }
      ];

      const createdInterventions = [];
      for (const intervention of sampleInterventions) {
        const created = await storage.createIntervention(intervention as any);
        createdInterventions.push(created);
      }

      // Create a sample agent discussion
      const discussion = await storage.createDiscussion({
        topic: 'Climate Analytics Risk Assessment',
        status: 'active',
        projectId: 'proj-climate-analytics',
        projectName: 'Climate Transition Analytics',
        priority: 'high'
      });

      const discussionMessages = [
        {
          discussionId: discussion.id,
          agentId: 'finops',
          agentName: 'FinOps Agent',
          content: 'I\'ve detected an 18% budget overrun on Climate Analytics. This aligns with the expanded TCFD scope approved last month. Recommending contingency reallocation.',
          messageType: 'analysis'
        },
        {
          discussionId: discussion.id,
          agentId: 'governance',
          agentName: 'Governance Agent',
          content: 'Confirmed. The TCFD compliance expansion was Board-approved. However, we should document the variance in our regulatory risk register.',
          messageType: 'agreement'
        },
        {
          discussionId: discussion.id,
          agentId: 'integrated-management',
          agentName: 'Integrated Management Agent',
          content: 'I can see this impacts our portfolio health score. Should we create an intervention for executive review?',
          messageType: 'question'
        },
        {
          discussionId: discussion.id,
          agentId: 'finops',
          agentName: 'FinOps Agent',
          content: 'Yes, creating critical intervention now. Recommending the £450K contingency reallocation pathway.',
          messageType: 'action'
        }
      ];

      for (const msg of discussionMessages) {
        await storage.addDiscussionMessage(msg as any);
      }

      res.json({ 
        success: true, 
        interventionsCreated: createdInterventions.length,
        discussionCreated: discussion.id,
        message: 'Command Center seeded with sample data'
      });
    } catch (error: any) {
      console.error("Seed command center error:", error);
      res.status(500).json({ error: "Failed to seed command center" });
    }
  });

  // Reset demo data for presentations
  app.post("/api/demo/reset", async (_req, res) => {
    try {
      // Clear all pending interventions from reactive demo
      const allInterventions = await storage.getInterventions();
      const demoInterventions = allInterventions.filter(i => 
        i.projectId === 'proj-reactive-demo' || 
        i.projectName?.includes('Reactive') ||
        i.title?.includes('Alert')
      );
      
      for (const intervention of demoInterventions) {
        await storage.updateInterventionStatus(intervention.id, 'dismissed', 'demo-reset');
      }
      
      res.json({ 
        success: true, 
        message: `Demo reset complete. Cleared ${demoInterventions.length} interventions.`,
        clearedCount: demoInterventions.length
      });
    } catch (error: any) {
      console.error("Demo reset error:", error);
      res.status(500).json({ error: "Failed to reset demo" });
    }
  });

  // Reactive Metric Watcher Routes
  const { updateMetricAndCheck, getThresholdConfigs } = await import("./reactiveMetricWatcher");

  app.get("/api/metrics/thresholds", async (_req, res) => {
    try {
      const configs = getThresholdConfigs();
      res.json({ thresholds: configs });
    } catch (error: any) {
      console.error("Get thresholds error:", error);
      res.status(500).json({ error: "Failed to get thresholds" });
    }
  });

  app.get("/api/metrics/:projectId", async (req, res) => {
    try {
      const metrics = await storage.getProjectMetrics(req.params.projectId);
      res.json({ metrics });
    } catch (error: any) {
      console.error("Get project metrics error:", error);
      res.status(500).json({ error: "Failed to get project metrics" });
    }
  });

  app.get("/api/metrics", async (_req, res) => {
    try {
      const metrics = await storage.getAllProjectMetrics();
      res.json({ metrics });
    } catch (error: any) {
      console.error("Get all metrics error:", error);
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });

  app.post("/api/metrics/update", async (req, res) => {
    try {
      const { projectId, projectName, metricKey, value } = req.body;
      
      if (!projectId || !projectName || !metricKey || value === undefined) {
        return res.status(400).json({ error: "Missing required fields: projectId, projectName, metricKey, value" });
      }

      const result = await updateMetricAndCheck(projectId, projectName, metricKey, parseFloat(value));
      
      res.json({
        success: true,
        intervention: result.intervention,
        autonomousAction: result.autonomousAction,
        message: result.intervention 
          ? `Threshold breach detected - intervention created` 
          : `Metric updated successfully - within acceptable range`
      });
    } catch (error: any) {
      console.error("Update metric error:", error);
      res.status(500).json({ error: "Failed to update metric" });
    }
  });

  app.post("/api/metrics/simulate", async (req, res) => {
    try {
      const { projectId, projectName, metricKey, targetValue, steps = 5 } = req.body;
      
      if (!projectId || !projectName || !metricKey || targetValue === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingMetrics = await storage.getProjectMetrics(projectId);
      const existing = existingMetrics.find(m => m.metricKey === metricKey);
      const startValue = existing ? parseFloat(existing.currentValue) : 1.0;
      
      const stepSize = (targetValue - startValue) / steps;
      const results = [];

      for (let i = 1; i <= steps; i++) {
        const newValue = startValue + (stepSize * i);
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = await updateMetricAndCheck(projectId, projectName, metricKey, newValue);
        results.push({ step: i, value: newValue, ...result });
      }

      res.json({
        success: true,
        simulation: {
          startValue,
          targetValue,
          steps,
          results
        }
      });
    } catch (error: any) {
      console.error("Simulate metric error:", error);
      res.status(500).json({ error: "Failed to simulate metric" });
    }
  });

  return httpServer;
}
