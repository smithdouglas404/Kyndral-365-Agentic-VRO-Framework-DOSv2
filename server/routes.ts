import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parsePolicyDocument, extractPolicyMetadata, generateLifecycleInsight } from "./anthropic";
import { registerCoPilotRoutes } from "./copilot";
import { askPM } from "./askPM";
import { generateExecutiveInsights, refreshInsights } from "./executiveInsights";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
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

  // Setup authentication (must be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

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
Budget: $${projectData.budget}M (${projectData.budgetUtilization}% utilized)
ROI: $${projectData.roi}M projected
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
      
      // Create project with full SAFe data
      const project = await storage.createProject({
        id: projectData.id,
        name: projectData.name,
        description: projectData.description || `${projectData.name} - SAFe 6.0 Managed Project`,
        businessUnitId: projectData.bu,
        status: projectData.status || 'planning',
        startDate: projectData.timeline?.startDate ? new Date(projectData.timeline.startDate) : null,
        endDate: projectData.timeline?.endDate ? new Date(projectData.timeline.endDate) : null,
        priority: projectData.priority,
        expectedRoi: projectData.expectedROI,
        roiValue: projectData.roiValue?.toString(),
        artName: projectData.artName,
        portfolioTheme: projectData.portfolioTheme,
        safeStage: projectData.safeStage || 'funnel',
        currentPi: projectData.safe?.currentPI,
        totalPis: projectData.safe?.totalPIs?.toString(),
        velocity: projectData.safe?.velocity?.toString(),
        predictability: projectData.safe?.predictability?.toString(),
        flowEfficiency: projectData.safe?.flowEfficiency?.toString(),
        epicId: projectData.safe?.epicId,
        epicName: projectData.safe?.epicName,
        epicProgress: projectData.safe?.epicProgress?.toString(),
        budgetSpent: projectData.budget?.spent?.toString(),
        budgetTotal: projectData.budget?.total?.toString(),
        budgetUnit: projectData.budget?.unit || '$m'
      });

      // Store features, stories, tasks
      if (projectData.features && Array.isArray(projectData.features)) {
        for (const feat of projectData.features) {
          const feature = await storage.createFeature({
            id: feat.id,
            projectId: project.id,
            name: feat.name,
            description: feat.description,
            status: feat.status,
            storyPoints: feat.storyPoints?.toString(),
            completedPoints: feat.completedPoints?.toString(),
            priority: feat.priority,
            targetPi: feat.targetPi?.toString(),
            acceptanceCriteria: JSON.stringify(feat.acceptanceCriteria || []),
            wsjfScore: feat.wsjf?.score?.toString()
          });

          if (feat.stories && Array.isArray(feat.stories)) {
            for (const st of feat.stories) {
              const story = await storage.createStory({
                id: st.id,
                featureId: feature.id,
                projectId: project.id,
                name: st.name,
                description: st.description,
                status: st.status,
                storyPoints: st.storyPoints?.toString(),
                acceptanceCriteria: JSON.stringify(st.acceptanceCriteria || [])
              });

              if (st.tasks && Array.isArray(st.tasks)) {
                for (const task of st.tasks) {
                  await storage.createTask({
                    id: task.id,
                    storyId: story.id,
                    featureId: feature.id,
                    projectId: project.id,
                    name: task.name,
                    status: task.status,
                    effortHours: task.effortHours?.toString(),
                    assignee: task.assignee,
                    skills: JSON.stringify(task.skills || [])
                  });
                }
              }
            }
          }
        }
      }

      // Handle top-level stories array (linked via featureId)
      if (projectData.stories && Array.isArray(projectData.stories)) {
        for (const st of projectData.stories) {
          await storage.createStory({
            id: st.id,
            featureId: st.featureId,
            projectId: project.id,
            name: st.name,
            description: st.description,
            status: st.status,
            storyPoints: st.storyPoints?.toString(),
            acceptanceCriteria: JSON.stringify(st.acceptanceCriteria || [])
          });
        }
      }

      // Handle top-level tasks array (linked via storyId and featureId)
      if (projectData.tasks && Array.isArray(projectData.tasks)) {
        for (const task of projectData.tasks) {
          await storage.createTask({
            id: task.id,
            storyId: task.storyId,
            featureId: task.featureId,
            projectId: project.id,
            name: task.name,
            status: task.status,
            effortHours: task.effortHours?.toString(),
            assignee: task.assignee,
            skills: JSON.stringify(task.skills || []),
            priority: task.priority
          });
        }
      }

      // Store resources
      if (projectData.resources && Array.isArray(projectData.resources)) {
        for (const res of projectData.resources) {
          await storage.createResource({
            id: res.id,
            projectId: project.id,
            name: res.name,
            role: res.role,
            allocation: res.allocation?.toString(),
            team: res.team,
            skills: JSON.stringify(res.skills || []),
            costRate: res.costRate?.toString()
          });
        }
      }

      // Store milestones
      if (projectData.milestones && Array.isArray(projectData.milestones)) {
        for (const ms of projectData.milestones) {
          await storage.createMilestone({
            id: ms.id,
            projectId: project.id,
            name: ms.name,
            targetDate: ms.date ? new Date(ms.date) : null,
            status: ms.status,
            deliverables: JSON.stringify(ms.deliverables || [])
          });
        }
      }

      // Store dependencies
      if (projectData.dependencies && Array.isArray(projectData.dependencies)) {
        for (const dep of projectData.dependencies) {
          await storage.createDependency({
            id: dep.id,
            projectId: project.id,
            name: dep.name,
            dependencyType: dep.type,
            status: dep.status,
            description: dep.description
          });
        }
      }

      // Store risks
      if (projectData.risks && Array.isArray(projectData.risks)) {
        for (const risk of projectData.risks) {
          await storage.createRisk({
            id: risk.id,
            projectId: project.id,
            name: risk.name,
            probability: risk.probability,
            impact: risk.impact,
            status: risk.status,
            mitigation: risk.mitigation,
            owner: risk.owner
          });
        }
      }

      // Store financials
      if (projectData.financials) {
        await storage.upsertProjectFinancials({
          projectId: project.id,
          capitalex: projectData.financials.capitalex?.toString(),
          opex: projectData.financials.opex?.toString(),
          contingency: projectData.financials.contingency?.toString(),
          npv: projectData.financials.npv?.toString(),
          irr: projectData.financials.irr?.toString(),
          paybackMonths: projectData.financials.paybackMonths?.toString()
        });
      }

      res.json({ 
        success: true, 
        projectId: project.id,
        message: `Project "${projectData.name}" ingested with full SAFe hierarchy`,
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

  // Full project with SAFe hierarchy
  app.get("/api/projects/:id/full", async (req, res) => {
    try {
      const fullProject = await storage.getFullProject(req.params.id);
      if (!fullProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(fullProject);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch full project" });
    }
  });

  // Features endpoints
  app.get("/api/projects/:id/features", async (req, res) => {
    try {
      const projectFeatures = await storage.getFeatures(req.params.id);
      res.json(projectFeatures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // Stories endpoints
  app.get("/api/projects/:id/stories", async (req, res) => {
    try {
      const projectStories = await storage.getStoriesByProject(req.params.id);
      res.json(projectStories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  // Tasks endpoints
  app.get("/api/projects/:id/tasks", async (req, res) => {
    try {
      const projectTasks = await storage.getTasksByProject(req.params.id);
      res.json(projectTasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Resources endpoints
  app.get("/api/projects/:id/resources", async (req, res) => {
    try {
      const projectResources = await storage.getResources(req.params.id);
      res.json(projectResources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // Milestones endpoints
  app.get("/api/projects/:id/milestones", async (req, res) => {
    try {
      const projectMilestones = await storage.getMilestones(req.params.id);
      res.json(projectMilestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // Risks endpoints
  app.get("/api/projects/:id/risks", async (req, res) => {
    try {
      const projectRisks = await storage.getRisks(req.params.id);
      res.json(projectRisks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risks" });
    }
  });

  // All projects with counts (enriched list)
  app.get("/api/projects/enriched", async (req, res) => {
    try {
      const allProjects = await storage.getProjects();
      const enrichedList = await Promise.all(allProjects.map(async (p) => {
        const [feats, strs, tsks, ress, deps] = await Promise.all([
          storage.getFeatures(p.id),
          storage.getStoriesByProject(p.id),
          storage.getTasksByProject(p.id),
          storage.getResources(p.id),
          storage.getDependencies(p.id)
        ]);
        return {
          ...p,
          featureCount: feats.length,
          storyCount: strs.length,
          taskCount: tsks.length,
          resourceCount: ress.length,
          dependencyCount: deps.length
        };
      }));
      res.json(enrichedList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enriched projects" });
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

  // Reset demo data for presentations - clears EVERYTHING
  app.post("/api/demo/reset", async (_req, res) => {
    try {
      // Clear ALL interventions and activity logs
      await storage.clearInterventions();
      await storage.clearAgentActivityLog();
      
      res.json({ 
        success: true, 
        message: 'Demo reset complete. All interventions and activity logs cleared.',
      });
    } catch (error: any) {
      console.error("Demo reset error:", error);
      res.status(500).json({ error: "Failed to reset demo" });
    }
  });

  // Seed demo data with autonomy labels
  app.post("/api/demo/seed", async (_req, res) => {
    try {
      await storage.seedDemoInterventions();
      
      res.json({ 
        success: true, 
        message: 'Demo seeded with autonomous intervention examples.',
      });
    } catch (error: any) {
      console.error("Demo seed error:", error);
      res.status(500).json({ error: "Failed to seed demo" });
    }
  });

  // Seed agent discussions and task queue
  app.post("/api/demo/seed-agent-data", async (_req, res) => {
    try {
      // @ts-ignore - using internal seed methods
      if (typeof storage.seedAgentDiscussions === 'function') {
        await storage.seedAgentDiscussions();
      }
      // @ts-ignore
      if (typeof storage.seedAgentTaskQueue === 'function') {
        await storage.seedAgentTaskQueue();
      }
      
      res.json({ 
        success: true, 
        message: 'Agent discussions and task queue seeded successfully.',
      });
    } catch (error: any) {
      console.error("Seed agent data error:", error);
      res.status(500).json({ error: "Failed to seed agent data" });
    }
  });

  // Get agent activity log
  app.get("/api/agent-activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getAgentActivityLog(limit);
      res.json({ activities });
    } catch (error: any) {
      console.error("Get agent activity error:", error);
      res.status(500).json({ error: "Failed to get agent activity" });
    }
  });

  // Alerts API
  app.get("/api/alerts", async (req, res) => {
    try {
      const { status, category } = req.query;
      const alertsList = await storage.getAlerts(
        status as string | undefined,
        category as string | undefined
      );
      res.json({ alerts: alertsList });
    } catch (error: any) {
      console.error("Get alerts error:", error);
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alert = await storage.createAlert(req.body);
      res.json({ success: true, alert });
    } catch (error: any) {
      console.error("Create alert error:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id/status", async (req, res) => {
    try {
      const { status, userId } = req.body;
      const alert = await storage.updateAlertStatus(req.params.id, status, userId);
      res.json({ success: true, alert });
    } catch (error: any) {
      console.error("Update alert status error:", error);
      res.status(500).json({ error: "Failed to update alert status" });
    }
  });

  app.post("/api/demo/seed-alerts", async (_req, res) => {
    try {
      const demoAlerts = [
        {
          title: 'Budget Threshold Exceeded',
          message: 'Grid Modernization Initiative has exceeded 90% of allocated budget with only 65% completion. Immediate review required.',
          severity: 'critical',
          category: 'budget',
          status: 'active',
          source: 'FinOps Agent',
          sourceEntityType: 'project',
          sourceEntityId: 'grid-mod-001',
          metadata: JSON.stringify({ budgetSpent: 112.5, budgetTotal: 125, completion: 65 })
        },
        {
          title: 'Sync Conflict Detected',
          message: 'Azure DevOps sync detected 3 conflicting field updates in Customer Experience stories. Manual resolution required.',
          severity: 'high',
          category: 'sync',
          status: 'active',
          source: 'Sync Engine',
          sourceEntityType: 'story',
          metadata: JSON.stringify({ conflicts: 3, sourceSystem: 'azure_devops' })
        },
        {
          title: 'Schedule Variance Warning',
          message: 'ERP Modernization SPI dropped to 0.82, below 0.85 threshold. 3-week delay projected without intervention.',
          severity: 'high',
          category: 'schedule',
          status: 'acknowledged',
          source: 'TMO Agent',
          sourceEntityType: 'project',
          sourceEntityId: 'erp-mod-001',
          acknowledgedBy: 'system',
          metadata: JSON.stringify({ spi: 0.82, projectedDelay: 21 })
        },
        {
          title: 'Dependency Risk Escalation',
          message: 'API Gateway dependency blocking 5 downstream features across 2 ARTs. Cross-ART coordination needed.',
          severity: 'high',
          category: 'risk',
          status: 'active',
          source: 'Planning Agent',
          sourceEntityType: 'dependency',
          metadata: JSON.stringify({ blockedFeatures: 5, affectedArts: 2 })
        },
        {
          title: 'Quality Gate Failed',
          message: 'Data Platform feature "Real-time Analytics" failed QA gate with 78% test coverage (minimum 80% required).',
          severity: 'medium',
          category: 'quality',
          status: 'active',
          source: 'QA Agent',
          sourceEntityType: 'feature',
          sourceEntityId: 'feat-analytics-001',
          metadata: JSON.stringify({ testCoverage: 78, required: 80 })
        },
        {
          title: 'New Integration Connected',
          message: 'Jira Cloud integration successfully connected. 245 epics and 1,842 stories ready for sync.',
          severity: 'info',
          category: 'sync',
          status: 'resolved',
          source: 'MCP Connector',
          resolvedBy: 'auto',
          metadata: JSON.stringify({ epics: 245, stories: 1842 })
        },
        {
          title: 'Agent Collaboration Completed',
          message: 'Resource Agent and FinOps Agent completed joint analysis of Cloud Infrastructure allocation. Report available.',
          severity: 'info',
          category: 'agent',
          status: 'resolved',
          source: 'Orchestration Engine',
          resolvedBy: 'auto',
          metadata: JSON.stringify({ participants: ['resource-agent', 'finops-agent'], duration: 45 })
        },
        {
          title: 'Risk Score Increased',
          message: 'Climate Analytics Platform risk score increased from 3.2 to 5.8 due to regulatory timeline changes.',
          severity: 'high',
          category: 'risk',
          status: 'active',
          source: 'Risk Agent',
          sourceEntityType: 'project',
          sourceEntityId: 'climate-001',
          metadata: JSON.stringify({ previousScore: 3.2, newScore: 5.8, trigger: 'regulatory_change' })
        },
        {
          title: 'Resource Overallocation',
          message: 'Senior Architect team member allocated at 145% across 3 projects. Rebalancing recommended.',
          severity: 'medium',
          category: 'resource',
          status: 'active',
          source: 'Resource Agent',
          sourceEntityType: 'resource',
          metadata: JSON.stringify({ allocation: 145, projects: 3 })
        },
        {
          title: 'PI Planning Reminder',
          message: 'PI 2025-Q2 planning session scheduled in 5 days. 8 teams, 42 features pending prioritization.',
          severity: 'low',
          category: 'system',
          status: 'active',
          source: 'Planning Agent',
          sourceEntityType: 'program_increment',
          metadata: JSON.stringify({ teams: 8, features: 42, daysUntil: 5 })
        }
      ];

      for (const alert of demoAlerts) {
        await storage.createAlert(alert);
      }

      res.json({ success: true, count: demoAlerts.length });
    } catch (error: any) {
      console.error("Seed alerts error:", error);
      res.status(500).json({ error: "Failed to seed alerts" });
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

  // OKR endpoints
  app.get("/api/okrs", async (req, res) => {
    try {
      const { businessUnitId } = req.query;
      const allOkrs = await storage.getOkrsWithKeyResults();
      if (businessUnitId) {
        const filtered = allOkrs.filter(o => o.businessUnitId === businessUnitId);
        return res.json({ okrs: filtered });
      }
      res.json({ okrs: allOkrs });
    } catch (error: any) {
      console.error("Get OKRs error:", error);
      res.status(500).json({ error: "Failed to get OKRs" });
    }
  });

  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const okr = await storage.getOkr(req.params.id);
      if (!okr) {
        return res.status(404).json({ error: "OKR not found" });
      }
      const keyResultsList = await storage.getKeyResults(req.params.id);
      res.json({ okr: { ...okr, keyResults: keyResultsList } });
    } catch (error: any) {
      console.error("Get OKR error:", error);
      res.status(500).json({ error: "Failed to get OKR" });
    }
  });

  app.post("/api/okrs", async (req, res) => {
    try {
      const { okr, keyResults: krs } = req.body;
      if (!okr || !okr.id || !okr.objective) {
        return res.status(400).json({ error: "OKR id and objective are required" });
      }
      const createdOkr = await storage.createOkr(okr);
      const createdKrs = [];
      if (krs && Array.isArray(krs)) {
        for (const kr of krs) {
          const created = await storage.createKeyResult({ ...kr, okrId: createdOkr.id });
          createdKrs.push(created);
        }
      }
      res.json({ success: true, okr: { ...createdOkr, keyResults: createdKrs } });
    } catch (error: any) {
      console.error("Create OKR error:", error);
      res.status(500).json({ error: "Failed to create OKR" });
    }
  });

  // KPI endpoints
  app.get("/api/kpis", async (req, res) => {
    try {
      const { projectId, businessUnitId } = req.query;
      const allKpis = await storage.getKpis(
        projectId as string | undefined, 
        businessUnitId as string | undefined
      );
      res.json({ kpis: allKpis });
    } catch (error: any) {
      console.error("Get KPIs error:", error);
      res.status(500).json({ error: "Failed to get KPIs" });
    }
  });

  app.post("/api/kpis", async (req, res) => {
    try {
      const kpi = req.body;
      if (!kpi || !kpi.id || !kpi.name) {
        return res.status(400).json({ error: "KPI id and name are required" });
      }
      const created = await storage.createKpi(kpi);
      res.json({ success: true, kpi: created });
    } catch (error: any) {
      console.error("Create KPI error:", error);
      res.status(500).json({ error: "Failed to create KPI" });
    }
  });

  // Seed OKRs and KPIs endpoint
  app.post("/api/okrs-kpis/seed", async (req, res) => {
    try {
      const { okrs: okrData, kpis: kpiData } = req.body;
      const createdOkrs = [];
      const createdKpis = [];
      
      if (okrData && Array.isArray(okrData)) {
        for (const item of okrData) {
          const { keyResults: krs, ...okr } = item;
          const createdOkr = await storage.createOkr(okr);
          const createdKrs = [];
          if (krs && Array.isArray(krs)) {
            for (const kr of krs) {
              const created = await storage.createKeyResult({ ...kr, okrId: createdOkr.id });
              createdKrs.push(created);
            }
          }
          createdOkrs.push({ ...createdOkr, keyResults: createdKrs });
        }
      }
      
      if (kpiData && Array.isArray(kpiData)) {
        for (const kpi of kpiData) {
          const created = await storage.createKpi(kpi);
          createdKpis.push(created);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Seeded ${createdOkrs.length} OKRs and ${createdKpis.length} KPIs`,
        okrs: createdOkrs,
        kpis: createdKpis
      });
    } catch (error: any) {
      console.error("Seed OKRs/KPIs error:", error);
      res.status(500).json({ error: "Failed to seed OKRs/KPIs" });
    }
  });

  // ============================================================================
  // SAFe ONTOLOGY API ENDPOINTS
  // ============================================================================

  // Strategic Themes
  app.get("/api/safe/strategic-themes", async (req, res) => {
    try {
      const { portfolioId } = req.query;
      const themes = await storage.getStrategicThemes(portfolioId as string | undefined);
      res.json({ strategicThemes: themes });
    } catch (error: any) {
      console.error("Get strategic themes error:", error);
      res.status(500).json({ error: "Failed to get strategic themes" });
    }
  });

  app.post("/api/safe/strategic-themes", async (req, res) => {
    try {
      const { insertStrategicThemeSchema } = await import("@shared/schema");
      const validated = insertStrategicThemeSchema.parse(req.body);
      const theme = await storage.createStrategicTheme(validated);
      res.json({ success: true, strategicTheme: theme });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create strategic theme" });
    }
  });

  app.post("/api/safe/seed-themes", async (_req, res) => {
    try {
      const existingThemes = await storage.getStrategicThemes();
      if (existingThemes.length > 0) {
        return res.json({ message: "Strategic themes already seeded", count: existingThemes.length });
      }
      
      const portfolios = await storage.getPortfolios();
      const primaryPortfolio = portfolios.find(p => p.id === 'portfolio-nee-001') || portfolios[0];
      
      if (!primaryPortfolio) {
        return res.status(400).json({ error: "No portfolios found. Seed portfolios first." });
      }
      
      const themesToSeed = [
        { id: 'theme-clean-energy', portfolioId: primaryPortfolio.id, name: 'Clean Energy Transition', description: 'Accelerate transition to zero-carbon energy generation and storage across all business units', timeHorizon: '10-year', budgetAllocation: '45', status: 'active' },
        { id: 'theme-grid-modernization', portfolioId: primaryPortfolio.id, name: 'Grid Modernization', description: 'Deploy smart grid infrastructure and advanced distribution management for reliability and resilience', timeHorizon: '5-year', budgetAllocation: '25', status: 'active' },
        { id: 'theme-customer-innovation', portfolioId: primaryPortfolio.id, name: 'Customer Innovation', description: 'Deliver innovative products and digital experiences that exceed customer expectations', timeHorizon: '3-year', budgetAllocation: '15', status: 'active' },
        { id: 'theme-operational-excellence', portfolioId: primaryPortfolio.id, name: 'Operational Excellence', description: 'Drive efficiency, safety, and cost optimization across all operations', timeHorizon: '3-year', budgetAllocation: '15', status: 'active' }
      ];
      
      const created = [];
      for (const theme of themesToSeed) {
        const t = await storage.createStrategicTheme(theme);
        created.push(t);
      }
      
      res.json({ success: true, message: 'Strategic themes seeded', themes: created, linkedPortfolio: primaryPortfolio.id });
    } catch (error: any) {
      console.error("Seed strategic themes error:", error);
      res.status(500).json({ error: "Failed to seed strategic themes" });
    }
  });

  // Portfolios
  app.get("/api/safe/portfolios", async (_req, res) => {
    try {
      const allPortfolios = await storage.getPortfolios();
      res.json({ portfolios: allPortfolios });
    } catch (error: any) {
      console.error("Get portfolios error:", error);
      res.status(500).json({ error: "Failed to get portfolios" });
    }
  });

  app.get("/api/safe/portfolios/:id", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });

  app.get("/api/safe/portfolios/:id/hierarchy", async (req, res) => {
    try {
      const hierarchy = await storage.getSafeHierarchy(req.params.id);
      if (!hierarchy) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      res.json(hierarchy);
    } catch (error: any) {
      console.error("Get SAFe hierarchy error:", error);
      res.status(500).json({ error: "Failed to get SAFe hierarchy" });
    }
  });

  app.post("/api/safe/portfolios", async (req, res) => {
    try {
      const portfolio = await storage.createPortfolio(req.body);
      res.json({ success: true, portfolio });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create portfolio" });
    }
  });

  // Value Streams
  app.get("/api/safe/value-streams", async (req, res) => {
    try {
      const { portfolioId } = req.query;
      const valueStreamsList = await storage.getValueStreams(portfolioId as string | undefined);
      res.json({ valueStreams: valueStreamsList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get value streams" });
    }
  });

  app.post("/api/safe/value-streams", async (req, res) => {
    try {
      const vs = await storage.createValueStream(req.body);
      res.json({ success: true, valueStream: vs });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create value stream" });
    }
  });

  // ARTs
  app.get("/api/safe/arts", async (req, res) => {
    try {
      const { valueStreamId } = req.query;
      const artsList = await storage.getArts(valueStreamId as string | undefined);
      res.json({ arts: artsList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get ARTs" });
    }
  });

  app.post("/api/safe/arts", async (req, res) => {
    try {
      const art = await storage.createArt(req.body);
      res.json({ success: true, art });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create ART" });
    }
  });

  // Teams
  app.get("/api/safe/teams", async (req, res) => {
    try {
      const { artId } = req.query;
      const teamsList = await storage.getTeams(artId as string | undefined);
      res.json({ teams: teamsList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get teams" });
    }
  });

  app.post("/api/safe/teams", async (req, res) => {
    try {
      const team = await storage.createTeam(req.body);
      res.json({ success: true, team });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  // Program Increments
  app.get("/api/safe/program-increments", async (req, res) => {
    try {
      const { artId } = req.query;
      const piList = await storage.getProgramIncrements(artId as string | undefined);
      res.json({ programIncrements: piList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get program increments" });
    }
  });

  app.post("/api/safe/program-increments", async (req, res) => {
    try {
      const pi = await storage.createProgramIncrement(req.body);
      res.json({ success: true, programIncrement: pi });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create program increment" });
    }
  });

  // Epics
  app.get("/api/safe/epics", async (req, res) => {
    try {
      const { portfolioId, valueStreamId } = req.query;
      const epicsList = await storage.getEpics(portfolioId as string | undefined, valueStreamId as string | undefined);
      res.json({ epics: epicsList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get epics" });
    }
  });

  app.post("/api/safe/epics", async (req, res) => {
    try {
      const epic = await storage.createEpic(req.body);
      res.json({ success: true, epic });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create epic" });
    }
  });

  // Capabilities
  app.get("/api/safe/capabilities", async (req, res) => {
    try {
      const { epicId } = req.query;
      const capsList = await storage.getCapabilities(epicId as string | undefined);
      res.json({ capabilities: capsList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get capabilities" });
    }
  });

  // Sprints
  app.get("/api/safe/sprints", async (req, res) => {
    try {
      const { piId, teamId } = req.query;
      const sprintsList = await storage.getSprints(piId as string | undefined, teamId as string | undefined);
      res.json({ sprints: sprintsList });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get sprints" });
    }
  });

  // ============================================================================
  // MCP & INTEGRATION API ENDPOINTS
  // ============================================================================

  // Source Systems
  app.get("/api/integrations/source-systems", async (_req, res) => {
    try {
      const systems = await storage.getSourceSystems();
      res.json({ sourceSystems: systems });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get source systems" });
    }
  });

  app.post("/api/integrations/source-systems", async (req, res) => {
    try {
      const system = await storage.createSourceSystem(req.body);
      res.json({ success: true, sourceSystem: system });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create source system" });
    }
  });

  app.patch("/api/integrations/source-systems/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateSourceSystemStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update source system status" });
    }
  });

  // MCP Adapters
  app.get("/api/integrations/mcp-adapters", async (req, res) => {
    try {
      const { sourceSystemId } = req.query;
      const adapters = await storage.getMcpAdapters(sourceSystemId as string | undefined);
      res.json({ mcpAdapters: adapters });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get MCP adapters" });
    }
  });

  app.post("/api/integrations/mcp-adapters", async (req, res) => {
    try {
      const adapter = await storage.createMcpAdapter(req.body);
      res.json({ success: true, mcpAdapter: adapter });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create MCP adapter" });
    }
  });

  // Field Mappings
  app.get("/api/integrations/field-mappings", async (req, res) => {
    try {
      const { sourceSystemId } = req.query;
      const mappings = await storage.getFieldMappings(sourceSystemId as string | undefined);
      res.json({ fieldMappings: mappings });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get field mappings" });
    }
  });

  app.post("/api/integrations/field-mappings", async (req, res) => {
    try {
      const mapping = await storage.createFieldMapping(req.body);
      res.json({ success: true, fieldMapping: mapping });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create field mapping" });
    }
  });

  // MCP Tool Mappings
  app.get("/api/integrations/mcp-tool-mappings", async (req, res) => {
    try {
      const { adapterId } = req.query;
      const mappings = await storage.getMcpToolMappings(adapterId as string | undefined);
      res.json({ mcpToolMappings: mappings });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get MCP tool mappings" });
    }
  });

  // Ingestion Jobs
  app.get("/api/integrations/ingestion-jobs", async (req, res) => {
    try {
      const { sourceSystemId } = req.query;
      const jobs = await storage.getIngestionJobs(sourceSystemId as string | undefined);
      res.json({ ingestionJobs: jobs });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get ingestion jobs" });
    }
  });

  app.post("/api/integrations/ingestion-jobs", async (req, res) => {
    try {
      const job = await storage.createIngestionJob(req.body);
      res.json({ success: true, ingestionJob: job });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create ingestion job" });
    }
  });

  // ============================================================================
  // SYNC ENGINE API ENDPOINTS
  // ============================================================================
  
  const { syncEngine } = await import("./syncEngine");

  app.post("/api/sync/start", async (req, res) => {
    try {
      const { sourceSystemId, entityTypes, direction } = req.body;
      if (!sourceSystemId || !entityTypes) {
        return res.status(400).json({ error: "sourceSystemId and entityTypes are required" });
      }
      const job = await syncEngine.startIngestionJob(sourceSystemId, entityTypes, direction || 'inbound');
      res.json({ success: true, job });
    } catch (error: any) {
      console.error("Start sync error:", error);
      res.status(500).json({ error: "Failed to start sync job" });
    }
  });

  app.post("/api/sync/analyze", async (req, res) => {
    try {
      const { sourceSystemId, sampleRecords, sourceEntityType } = req.body;
      if (!sourceSystemId || !sampleRecords || !sourceEntityType) {
        return res.status(400).json({ error: "sourceSystemId, sampleRecords, and sourceEntityType are required" });
      }
      const analysis = await syncEngine.analyzeDataForMapping(sourceSystemId, sampleRecords, sourceEntityType);
      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("Analyze data error:", error);
      res.status(500).json({ error: "Failed to analyze data" });
    }
  });

  app.get("/api/sync/mappings", async (_req, res) => {
    try {
      const mappings = syncEngine.getAvailableMappings();
      res.json({ mappings });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get mappings" });
    }
  });

  app.get("/api/sync/history", async (req, res) => {
    try {
      const { sourceSystemId, limit } = req.query;
      const history = await syncEngine.getSyncHistory(
        sourceSystemId as string | undefined, 
        limit ? parseInt(limit as string) : 20
      );
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get sync history" });
    }
  });

  // AI-Powered Data Analysis for MCP
  app.post("/api/sync/ai-analyze", async (req, res) => {
    try {
      const { sampleData, sourceSystem, sourceEntityType } = req.body;
      if (!sampleData || !sourceSystem || !sourceEntityType) {
        return res.status(400).json({ error: "sampleData, sourceSystem, and sourceEntityType are required" });
      }
      
      const { analyzeExternalDataForMCP } = await import("./anthropic");
      const records = Array.isArray(sampleData) ? sampleData : [sampleData];
      const analysis = await analyzeExternalDataForMCP(records, sourceSystem, sourceEntityType);
      
      await storage.createAgentActivityLog({
        eventType: 'ai_analysis',
        primaryAgentId: 'mcp-ai-analyzer',
        primaryAgentName: 'MCP AI Analyzer',
        summary: `AI analysis completed for ${sourceSystem} ${sourceEntityType} data`,
        details: JSON.stringify({ 
          recordCount: records.length, 
          qualityScore: analysis.dataQuality.score,
          suggestedMapping: analysis.safeMapping.suggestedEntityType
        }),
      });
      
      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze data with AI" });
    }
  });

  // QA Gate Approval Workflow
  app.post("/api/sync/qa-gate", async (req, res) => {
    try {
      const { dataAnalysis, userResponses } = req.body;
      if (!dataAnalysis) {
        return res.status(400).json({ error: "dataAnalysis is required" });
      }
      
      const { generateQAGateResponse } = await import("./anthropic");
      const qaResult = await generateQAGateResponse(dataAnalysis, userResponses || {});
      
      await storage.createAgentActivityLog({
        eventType: 'qa_gate_decision',
        primaryAgentId: 'qa-gate-agent',
        primaryAgentName: 'QA Gate Agent',
        summary: `QA Gate ${qaResult.approved ? 'APPROVED' : 'PENDING'}: ${qaResult.feedback.slice(0, 100)}`,
        details: JSON.stringify(qaResult),
      });
      
      res.json({ success: true, qaResult });
    } catch (error: any) {
      console.error("QA Gate error:", error);
      res.status(500).json({ error: "Failed to process QA gate" });
    }
  });

  // SAFe Ontology Summary - Full hierarchy for dashboard
  app.get("/api/safe/summary", async (_req, res) => {
    try {
      const [allPortfolios, allValueStreams, allArts, allTeams, allPIs, allEpics] = await Promise.all([
        storage.getPortfolios(),
        storage.getValueStreams(),
        storage.getArts(),
        storage.getTeams(),
        storage.getProgramIncrements(),
        storage.getEpics()
      ]);
      
      res.json({
        summary: {
          portfolioCount: allPortfolios.length,
          valueStreamCount: allValueStreams.length,
          artCount: allArts.length,
          teamCount: allTeams.length,
          piCount: allPIs.length,
          epicCount: allEpics.length
        },
        portfolios: allPortfolios,
        valueStreams: allValueStreams,
        arts: allArts,
        teams: allTeams,
        programIncrements: allPIs,
        epics: allEpics
      });
    } catch (error: any) {
      console.error("Get SAFe summary error:", error);
      res.status(500).json({ error: "Failed to get SAFe summary" });
    }
  });

  // Seed SAFe Hierarchy Data - NextEra Energy specific
  app.post("/api/safe/seed", async (_req, res) => {
    try {
      // Check if already seeded
      const existingPortfolios = await storage.getPortfolios();
      if (existingPortfolios.length > 0) {
        return res.json({ message: "SAFe data already seeded", portfolios: existingPortfolios.length });
      }

      // Define theme IDs for portfolio reference
      const themeIds = ['theme-clean-energy', 'theme-grid-modernization', 'theme-customer-innovation', 'theme-operational-excellence'];

      // Portfolio - NextEra Energy Enterprise Portfolio (create first for FK linkage)
      const portfolio = await storage.createPortfolio({
        name: 'NextEra Energy Enterprise Portfolio',
        description: 'Enterprise transformation portfolio managing all strategic initiatives across FPL, NEER, and Corporate',
        vision: 'To be the world leader in clean energy, delivering affordable, reliable, and sustainable power to our customers while maximizing shareholder value',
        strategicThemes: JSON.stringify(themeIds),
        owner: 'John Ketchum - Chairman & CEO',
        status: 'active',
        budgetAllocation: '8500',
        budgetUnit: '$M',
        fiscalYear: '2025'
      });

      // Strategic Themes - now linked to portfolio
      const themesData = [
        { id: 'theme-clean-energy', portfolioId: portfolio.id, name: 'Clean Energy Transition', description: 'Accelerate transition to zero-carbon energy generation and storage across all business units', timeHorizon: '10-year', budgetAllocation: '45', status: 'active' },
        { id: 'theme-grid-modernization', portfolioId: portfolio.id, name: 'Grid Modernization', description: 'Deploy smart grid infrastructure and advanced distribution management for reliability and resilience', timeHorizon: '5-year', budgetAllocation: '25', status: 'active' },
        { id: 'theme-customer-innovation', portfolioId: portfolio.id, name: 'Customer Innovation', description: 'Deliver innovative products and digital experiences that exceed customer expectations', timeHorizon: '3-year', budgetAllocation: '15', status: 'active' },
        { id: 'theme-operational-excellence', portfolioId: portfolio.id, name: 'Operational Excellence', description: 'Drive efficiency, safety, and cost optimization across all operations', timeHorizon: '3-year', budgetAllocation: '15', status: 'active' }
      ];

      for (const theme of themesData) {
        await storage.createStrategicTheme(theme);
      }

      // Value Streams
      const valueStreamsData = [
        { portfolioId: portfolio.id, name: 'FPL Customer Operations', description: 'End-to-end customer service delivery from metering to billing and support', type: 'operational', owner: 'Eric Silagy', status: 'active', leadTime: '2.5', throughput: '125' },
        { portfolioId: portfolio.id, name: 'Clean Energy Development', description: 'Solar, wind, and battery storage project development pipeline', type: 'development', owner: 'Rebecca Kujawa', status: 'active', leadTime: '365', throughput: '45' },
        { portfolioId: portfolio.id, name: 'Grid Infrastructure', description: 'Transmission and distribution network modernization and maintenance', type: 'operational', owner: 'Mark Hickson', status: 'active', leadTime: '30', throughput: '85' },
        { portfolioId: portfolio.id, name: 'Digital & Technology', description: 'Enterprise technology platforms, data analytics, and digital customer experience', type: 'development', owner: 'Charles Farrar', status: 'active', leadTime: '14', throughput: '210' }
      ];

      const createdValueStreams: any[] = [];
      for (const vs of valueStreamsData) {
        const created = await storage.createValueStream(vs);
        createdValueStreams.push(created);
      }

      // ARTs (Agile Release Trains)
      const artsData = [
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[0].id, name: 'Customer Experience ART', description: 'Delivering exceptional customer digital experiences and self-service capabilities', releaseTrainEngineer: 'Maria Santos', productManager: 'David Chen', systemArchitect: 'Alex Rivera', status: 'active', piCadence: '10 weeks', teamCount: '6', velocity: '450', predictability: '82' },
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[1].id, name: 'Renewable Development ART', description: 'Enabling rapid clean energy project origination and execution', releaseTrainEngineer: 'James Wilson', productManager: 'Sarah Kim', systemArchitect: 'Michael Brown', status: 'active', piCadence: '12 weeks', teamCount: '5', velocity: '380', predictability: '78' },
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[2].id, name: 'Smart Grid ART', description: 'Modernizing grid infrastructure with advanced monitoring and automation', releaseTrainEngineer: 'Lisa Anderson', productManager: 'Tom Harris', systemArchitect: 'Jennifer Lee', status: 'active', piCadence: '10 weeks', teamCount: '7', velocity: '520', predictability: '85' },
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[3].id, name: 'Enterprise Platforms ART', description: 'Building shared technology platforms and data capabilities', releaseTrainEngineer: 'Robert Chen', productManager: 'Amanda Foster', systemArchitect: 'David Wilson', status: 'active', piCadence: '10 weeks', teamCount: '8', velocity: '580', predictability: '80' }
      ];

      const createdArts: any[] = [];
      for (const art of artsData) {
        const created = await storage.createArt(art);
        createdArts.push(created);
      }

      // Teams
      const teamsData = [
        { artId: createdArts[0].id, name: 'Mobile App Team', description: 'Customer mobile application development', type: 'feature', scrumMaster: 'Emily Davis', productOwner: 'Mark Thompson', techLead: 'Chris Johnson', memberCount: '8', capacity: '64', velocity: '58', status: 'active' },
        { artId: createdArts[0].id, name: 'Billing Integration Team', description: 'Billing system modernization and integration', type: 'feature', scrumMaster: 'Rachel Green', productOwner: 'Steve Martinez', techLead: 'Karen White', memberCount: '7', capacity: '56', velocity: '52', status: 'active' },
        { artId: createdArts[1].id, name: 'Project Analytics Team', description: 'Development project performance analytics', type: 'feature', scrumMaster: 'Paul Adams', productOwner: 'Nicole Brown', techLead: 'Kevin Lee', memberCount: '6', capacity: '48', velocity: '44', status: 'active' },
        { artId: createdArts[2].id, name: 'SCADA Modernization Team', description: 'Grid control systems modernization', type: 'platform', scrumMaster: 'Diana Ross', productOwner: 'Frank Miller', techLead: 'George Chen', memberCount: '9', capacity: '72', velocity: '68', status: 'active' },
        { artId: createdArts[3].id, name: 'Data Platform Team', description: 'Enterprise data lake and analytics platform', type: 'platform', scrumMaster: 'Michelle Thompson', productOwner: 'Jason Park', techLead: 'Andrea Lopez', memberCount: '8', capacity: '64', velocity: '60', status: 'active' },
        { artId: createdArts[3].id, name: 'API Gateway Team', description: 'Enterprise API management and integration', type: 'platform', scrumMaster: 'Brian Evans', productOwner: 'Sophia Martin', techLead: 'Tyler Green', memberCount: '6', capacity: '48', velocity: '45', status: 'active' }
      ];

      for (const team of teamsData) {
        await storage.createTeam(team);
      }

      // Program Increments
      const pisData = [
        { artId: createdArts[0].id, name: 'PI 2025.1 - Customer Experience', description: 'Focus on mobile app modernization and self-service expansion', piNumber: '2025.1', startDate: new Date('2025-01-06'), endDate: new Date('2025-03-14'), status: 'executing', objectives: JSON.stringify(['Launch mobile app 3.0', 'Reduce call center volume 15%']), committedPoints: '450', deliveredPoints: '385', predictability: '85' },
        { artId: createdArts[1].id, name: 'PI 2025.1 - Renewable Development', description: 'Streamline project origination pipeline', piNumber: '2025.1', startDate: new Date('2025-01-06'), endDate: new Date('2025-03-21'), status: 'executing', objectives: JSON.stringify(['Deploy project analytics dashboard', 'Integrate permitting workflow']), committedPoints: '380', deliveredPoints: '312', predictability: '82' },
        { artId: createdArts[2].id, name: 'PI 2025.1 - Smart Grid', description: 'Advanced distribution management rollout', piNumber: '2025.1', startDate: new Date('2025-01-06'), endDate: new Date('2025-03-14'), status: 'executing', objectives: JSON.stringify(['Complete ADMS Phase 2', 'Deploy 500K smart meters']), committedPoints: '520', deliveredPoints: '468', predictability: '90' },
        { artId: createdArts[3].id, name: 'PI 2025.1 - Enterprise Platforms', description: 'Data platform foundation and API modernization', piNumber: '2025.1', startDate: new Date('2025-01-06'), endDate: new Date('2025-03-14'), status: 'executing', objectives: JSON.stringify(['Launch enterprise data catalog', 'API gateway v2 release']), committedPoints: '580', deliveredPoints: '493', predictability: '85' }
      ];

      for (const pi of pisData) {
        await storage.createProgramIncrement(pi);
      }

      // Epics
      const epicsData = [
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[0].id, name: 'Mobile App 3.0 Platform', description: 'Complete redesign of customer mobile application with enhanced self-service', type: 'business', status: 'implementing', owner: 'Maria Santos', hypothesis: 'Redesigning mobile app will increase digital adoption by 25% and reduce call center volume', expectedOutcome: 'Increase digital transactions to 75% of all customer interactions', estimatedCost: '4500000', estimatedBenefit: '12000000', wsjfScore: '28' },
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[1].id, name: 'Solar Project Automation', description: 'Automate solar project development lifecycle from site selection to commissioning', type: 'business', status: 'implementing', owner: 'James Wilson', hypothesis: 'Automating project development will reduce time-to-COD by 20%', expectedOutcome: 'Reduce average project timeline from 18 to 14 months', estimatedCost: '8000000', estimatedBenefit: '25000000', wsjfScore: '32' },
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[2].id, name: 'Advanced Distribution Management', description: 'Deploy ADMS across FPL service territory for enhanced grid reliability', type: 'enabler', status: 'implementing', owner: 'Lisa Anderson', hypothesis: 'ADMS will reduce outage duration by 30% through automated fault detection', expectedOutcome: 'Achieve industry-leading SAIDI and SAIFI metrics', estimatedCost: '15000000', estimatedBenefit: '35000000', wsjfScore: '35' },
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[3].id, name: 'Enterprise Data Lake', description: 'Build unified data platform for analytics and AI/ML initiatives', type: 'enabler', status: 'implementing', owner: 'Robert Chen', hypothesis: 'Unified data platform will enable advanced analytics and reduce data reconciliation by 80%', expectedOutcome: 'Single source of truth for all enterprise data', estimatedCost: '12000000', estimatedBenefit: '28000000', wsjfScore: '30' }
      ];

      for (const epic of epicsData) {
        await storage.createEpic(epic);
      }

      res.json({ 
        success: true, 
        message: 'SAFe hierarchy seeded successfully',
        data: {
          strategicThemes: themesData.length,
          portfolios: 1,
          valueStreams: createdValueStreams.length,
          arts: createdArts.length,
          teams: teamsData.length,
          programIncrements: pisData.length,
          epics: epicsData.length
        }
      });
    } catch (error: any) {
      console.error("Seed SAFe error:", error);
      res.status(500).json({ error: "Failed to seed SAFe hierarchy", details: error.message });
    }
  });

  // ============================================================================
  // DIVISIONS API - NextEra Business Segments (DB-backed)
  // ============================================================================
  
  app.get("/api/divisions", async (_req, res) => {
    try {
      const allDivisions = await storage.getDivisions();
      res.json(allDivisions);
    } catch (error: any) {
      console.error("Get divisions error:", error);
      res.status(500).json({ error: "Failed to get divisions" });
    }
  });

  app.get("/api/divisions/:id", async (req, res) => {
    try {
      const division = await storage.getDivision(req.params.id);
      if (!division) {
        return res.status(404).json({ error: "Division not found" });
      }
      res.json(division);
    } catch (error: any) {
      console.error("Get division error:", error);
      res.status(500).json({ error: "Failed to get division" });
    }
  });

  app.get("/api/divisions/:id/full", async (req, res) => {
    try {
      const fullDivision = await storage.getFullDivision(req.params.id);
      if (!fullDivision) {
        return res.status(404).json({ error: "Division not found" });
      }
      res.json(fullDivision);
    } catch (error: any) {
      console.error("Get full division error:", error);
      res.status(500).json({ error: "Failed to get full division" });
    }
  });

  app.get("/api/divisions/:id/kpis", async (req, res) => {
    try {
      const kpis = await storage.getDivisionKpis(req.params.id);
      res.json(kpis);
    } catch (error: any) {
      console.error("Get division KPIs error:", error);
      res.status(500).json({ error: "Failed to get division KPIs" });
    }
  });

  app.get("/api/divisions/:id/okrs", async (req, res) => {
    try {
      const okrs = await storage.getDivisionOkrs(req.params.id);
      res.json(okrs);
    } catch (error: any) {
      console.error("Get division OKRs error:", error);
      res.status(500).json({ error: "Failed to get division OKRs" });
    }
  });

  app.get("/api/divisions/:id/risks", async (req, res) => {
    try {
      const risks = await storage.getDivisionRisks(req.params.id);
      res.json(risks);
    } catch (error: any) {
      console.error("Get division risks error:", error);
      res.status(500).json({ error: "Failed to get division risks" });
    }
  });

  // ============================================================================
  // COMPANY OVERVIEW API - NextEra Corporate Info (DB-backed)
  // ============================================================================
  
  app.get("/api/company/overview", async (_req, res) => {
    try {
      const overview = await storage.getCompanyOverview();
      if (!overview) {
        return res.status(404).json({ error: "Company overview not found" });
      }
      res.json(overview);
    } catch (error: any) {
      console.error("Get company overview error:", error);
      res.status(500).json({ error: "Failed to get company overview" });
    }
  });

  // ============================================================================
  // CLIMATE METRICS API - Sustainability Data (DB-backed)
  // ============================================================================
  
  app.get("/api/climate/metrics", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const metrics = await storage.getClimateMetrics(category);
      res.json(metrics);
    } catch (error: any) {
      console.error("Get climate metrics error:", error);
      res.status(500).json({ error: "Failed to get climate metrics" });
    }
  });

  app.get("/api/climate/metrics/:category", async (req, res) => {
    try {
      const metrics = await storage.getClimateMetrics(req.params.category);
      res.json(metrics);
    } catch (error: any) {
      console.error("Get climate metrics by category error:", error);
      res.status(500).json({ error: "Failed to get climate metrics" });
    }
  });

  // ============================================================================
  // ENTERPRISE RISKS API - Corporate Risk Registry (DB-backed)
  // ============================================================================
  
  app.get("/api/enterprise-risks/categories", async (_req, res) => {
    try {
      const categories = await storage.getEnterpriseRiskCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Get enterprise risk categories error:", error);
      res.status(500).json({ error: "Failed to get enterprise risk categories" });
    }
  });

  app.get("/api/enterprise-risks", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const risks = await storage.getEnterpriseRisks(categoryId);
      res.json(risks);
    } catch (error: any) {
      console.error("Get enterprise risks error:", error);
      res.status(500).json({ error: "Failed to get enterprise risks" });
    }
  });

  app.get("/api/enterprise-risks/profile", async (_req, res) => {
    try {
      const profile = await storage.getFullEnterpriseRiskProfile();
      res.json(profile);
    } catch (error: any) {
      console.error("Get enterprise risk profile error:", error);
      res.status(500).json({ error: "Failed to get enterprise risk profile" });
    }
  });

  // ============================================================================
  // MCP SYNC JOBS API - Scheduled sync configurations with cron triggers
  // ============================================================================

  app.get("/api/mcp/sync-jobs", async (req, res) => {
    try {
      const mcpAdapterId = req.query.adapterId as string | undefined;
      const jobs = await storage.getSyncJobs(mcpAdapterId);
      res.json({ syncJobs: jobs });
    } catch (error: any) {
      console.error("Get sync jobs error:", error);
      res.status(500).json({ error: "Failed to get sync jobs" });
    }
  });

  app.get("/api/mcp/sync-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getSyncJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Sync job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Get sync job error:", error);
      res.status(500).json({ error: "Failed to get sync job" });
    }
  });

  app.post("/api/mcp/sync-jobs", async (req, res) => {
    try {
      const { insertSyncJobSchema } = await import("@shared/schema");
      const { reloadScheduledJobs } = await import("./syncScheduler");
      const parsed = insertSyncJobSchema.parse(req.body);
      const job = await storage.createSyncJob(parsed);
      
      // Reload scheduler to pick up new job
      await reloadScheduledJobs();
      
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Create sync job error:", error);
      res.status(400).json({ error: "Failed to create sync job", details: error.message });
    }
  });

  app.patch("/api/mcp/sync-jobs/:id", async (req, res) => {
    try {
      const { reloadScheduledJobs } = await import("./syncScheduler");
      const updated = await storage.updateSyncJob(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Sync job not found" });
      }
      
      // Reload scheduler to pick up changes
      await reloadScheduledJobs();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Update sync job error:", error);
      res.status(500).json({ error: "Failed to update sync job" });
    }
  });

  app.delete("/api/mcp/sync-jobs/:id", async (req, res) => {
    try {
      const { reloadScheduledJobs } = await import("./syncScheduler");
      await storage.deleteSyncJob(req.params.id);
      
      // Reload scheduler to remove deleted job
      await reloadScheduledJobs();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete sync job error:", error);
      res.status(500).json({ error: "Failed to delete sync job" });
    }
  });

  // Trigger a sync job manually
  app.post("/api/mcp/sync-jobs/:id/trigger", async (req, res) => {
    try {
      const job = await storage.getSyncJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Sync job not found" });
      }

      // Create a new sync job run
      const run = await storage.createSyncJobRun({
        syncJobId: job.id,
        triggeredBy: "manual",
        status: "running",
        startedAt: new Date()
      });

      // Simulate sync execution (in production, this would call MCP tools)
      setTimeout(async () => {
        const recordsProcessed = Math.floor(Math.random() * 100) + 10;
        const recordsCreated = Math.floor(recordsProcessed * 0.2);
        const recordsUpdated = Math.floor(recordsProcessed * 0.6);
        
        await storage.updateSyncJobRun(run.id, {
          status: "success",
          completedAt: new Date(),
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          recordsDeleted: 0,
          recordsFailed: 0,
          summary: JSON.stringify({ 
            duration: "2.3s", 
            entityTypes: JSON.parse(job.entityTypes || "[]")
          })
        });

        await storage.updateSyncJobLastRun(job.id, "success");
      }, 2000);

      res.json({ 
        message: "Sync job triggered", 
        runId: run.id,
        status: "running"
      });
    } catch (error: any) {
      console.error("Trigger sync job error:", error);
      res.status(500).json({ error: "Failed to trigger sync job" });
    }
  });

  // Get sync job run history
  app.get("/api/mcp/sync-jobs/:id/runs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const runs = await storage.getSyncJobRuns(req.params.id, limit);
      res.json({ runs });
    } catch (error: any) {
      console.error("Get sync job runs error:", error);
      res.status(500).json({ error: "Failed to get sync job runs" });
    }
  });

  // Get all sync job runs
  app.get("/api/mcp/sync-runs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const runs = await storage.getSyncJobRuns(undefined, limit);
      res.json({ runs });
    } catch (error: any) {
      console.error("Get all sync runs error:", error);
      res.status(500).json({ error: "Failed to get sync runs" });
    }
  });

  // ============================================================================
  // WEBHOOK ENDPOINTS API - Incoming webhook handlers for external PPM tools
  // ============================================================================

  app.get("/api/mcp/webhooks", async (req, res) => {
    try {
      const sourceSystemId = req.query.sourceSystemId as string | undefined;
      const endpoints = await storage.getWebhookEndpoints(sourceSystemId);
      res.json({ webhooks: endpoints });
    } catch (error: any) {
      console.error("Get webhooks error:", error);
      res.status(500).json({ error: "Failed to get webhooks" });
    }
  });

  app.get("/api/mcp/webhooks/:id", async (req, res) => {
    try {
      const endpoint = await storage.getWebhookEndpoint(req.params.id);
      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }
      res.json(endpoint);
    } catch (error: any) {
      console.error("Get webhook error:", error);
      res.status(500).json({ error: "Failed to get webhook" });
    }
  });

  app.post("/api/mcp/webhooks", async (req, res) => {
    try {
      const { insertWebhookEndpointSchema } = await import("@shared/schema");
      const parsed = insertWebhookEndpointSchema.parse(req.body);
      const endpoint = await storage.createWebhookEndpoint(parsed);
      res.status(201).json(endpoint);
    } catch (error: any) {
      console.error("Create webhook error:", error);
      res.status(400).json({ error: "Failed to create webhook", details: error.message });
    }
  });

  app.patch("/api/mcp/webhooks/:id", async (req, res) => {
    try {
      const updated = await storage.updateWebhookEndpoint(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Update webhook error:", error);
      res.status(500).json({ error: "Failed to update webhook" });
    }
  });

  app.delete("/api/mcp/webhooks/:id", async (req, res) => {
    try {
      await storage.deleteWebhookEndpoint(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete webhook error:", error);
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  // Dynamic webhook receiver - handles incoming webhooks from external systems
  app.post("/api/webhooks/:path(*)", async (req, res) => {
    try {
      const webhookPath = `/webhooks/${req.params.path}`;
      const endpoint = await storage.getWebhookEndpointByPath(webhookPath);
      
      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.isEnabled !== "true") {
        return res.status(403).json({ error: "Webhook endpoint is disabled" });
      }

      // Log the webhook event
      const event = await storage.createWebhookEvent({
        webhookEndpointId: endpoint.id,
        eventType: req.body.event_type || req.body.webhookEvent || "unknown",
        externalEventId: req.body.id || req.body.event_id,
        payload: JSON.stringify(req.body),
        headers: JSON.stringify({
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
          'x-webhook-signature': req.headers['x-webhook-signature']
        }),
        signature: req.headers['x-webhook-signature'] as string,
        signatureValid: "not_verified",
        status: "received"
      });

      // Increment webhook stats
      await storage.incrementWebhookStats(endpoint.id, true);

      // If webhook is configured to trigger a sync job, do so
      if (endpoint.triggerSyncJobId) {
        const run = await storage.createSyncJobRun({
          syncJobId: endpoint.triggerSyncJobId,
          triggeredBy: "webhook",
          status: "running",
          startedAt: new Date()
        });

        await storage.updateWebhookEventStatus(event.id, "processing", undefined, run.id);

        // Simulate processing
        setTimeout(async () => {
          await storage.updateSyncJobRun(run.id, {
            status: "success",
            completedAt: new Date(),
            recordsProcessed: 1,
            recordsCreated: req.body.action === "created" ? 1 : 0,
            recordsUpdated: req.body.action === "updated" ? 1 : 0,
            recordsDeleted: req.body.action === "deleted" ? 1 : 0
          });
          await storage.updateWebhookEventStatus(event.id, "processed");
        }, 500);
      } else {
        await storage.updateWebhookEventStatus(event.id, "processed");
      }

      res.json({ 
        received: true, 
        eventId: event.id,
        message: "Webhook processed successfully"
      });
    } catch (error: any) {
      console.error("Webhook receiver error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Get webhook events
  app.get("/api/mcp/webhooks/:id/events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getWebhookEvents(req.params.id, limit);
      res.json({ events });
    } catch (error: any) {
      console.error("Get webhook events error:", error);
      res.status(500).json({ error: "Failed to get webhook events" });
    }
  });

  // ============================================================================
  // MCP PPM ADAPTERS SEED - Pre-configured adapters for recommended PPM tools
  // ============================================================================

  app.post("/api/mcp/seed-ppm-adapters", async (_req, res) => {
    try {
      // Check existing entities for idempotent seeding
      const existingAdapters = await storage.getMcpAdapters();
      const existingSyncJobs = await storage.getSyncJobs();
      const existingWebhooks = await storage.getWebhookEndpoints();
      const existingSystems = await storage.getSourceSystems();
      
      let adaptersSeeded = 0;
      let syncJobsSeeded = 0;
      let webhooksSeeded = 0;
      let systemsSeeded = 0;

      // Source system definitions
      const sourceSystemsData: { name: string; type: string; status?: string; capabilities?: string }[] = [
        { name: "Jira Cloud", type: "jira", status: "active", capabilities: JSON.stringify(["issues", "sprints", "boards", "epics"]) },
        { name: "Azure DevOps", type: "azure-devops", status: "active", capabilities: JSON.stringify(["work-items", "iterations", "pipelines"]) },
        { name: "ServiceNow SPM", type: "servicenow", status: "active", capabilities: JSON.stringify(["demands", "portfolios", "projects"]) },
        { name: "Confluence", type: "confluence", status: "active", capabilities: JSON.stringify(["pages", "spaces", "comments"]) },
        { name: "SharePoint", type: "sharepoint", status: "inactive", capabilities: JSON.stringify(["files", "folders", "lists"]) },
        { name: "Jira Align (SAFe)", type: "jira-align", status: "inactive", capabilities: JSON.stringify(["portfolios", "arts", "pis", "epics"]) },
        { name: "Tempo Timesheets", type: "tempo", status: "inactive", capabilities: JSON.stringify(["worklogs", "teams", "capacity"]) }
      ];

      // Create source systems only if they don't exist (idempotent by type)
      const existingSystemTypes = new Set(existingSystems.map(s => s.type));
      const allSystems: { id: string; type: string }[] = existingSystems.map(s => ({ id: s.id, type: s.type }));
      
      for (const ss of sourceSystemsData) {
        if (!existingSystemTypes.has(ss.type)) {
          const created = await storage.createSourceSystem(ss);
          allSystems.push({ id: created.id, type: ss.type });
          systemsSeeded++;
        }
      }

      // Helper to find source system ID by type
      const getSystemId = (type: string) => allSystems.find(s => s.type === type)?.id;

      // Create MCP adapters for each source system
      const adaptersData = [
        {
          sourceSystemId: getSystemId("jira"),
          name: "Jira MCP Adapter",
          adapterType: "jira-mcp",
          version: "1.2.0",
          serverUrl: "mcp://jira.atlassian.com",
          status: "active",
          supportedTools: JSON.stringify([
            "jira_create_issue", "jira_update_issue", "jira_get_issue", "jira_search_issues",
            "jira_get_sprint", "jira_create_sprint", "jira_move_issues_to_sprint",
            "jira_get_board", "jira_get_epics", "jira_link_issues"
          ]),
          supportedResources: JSON.stringify(["issues", "projects", "sprints", "boards", "epics"]),
          healthStatus: "healthy"
        },
        {
          sourceSystemId: getSystemId("azure-devops"),
          name: "Azure DevOps MCP Adapter",
          adapterType: "azure-devops-mcp",
          version: "1.1.0",
          serverUrl: "mcp://dev.azure.com",
          status: "active",
          supportedTools: JSON.stringify([
            "ado_create_work_item", "ado_update_work_item", "ado_get_work_item", "ado_query_work_items",
            "ado_get_iteration", "ado_create_iteration", "ado_get_backlog",
            "ado_create_pipeline", "ado_get_builds"
          ]),
          supportedResources: JSON.stringify(["work-items", "iterations", "backlogs", "pipelines", "builds"]),
          healthStatus: "healthy"
        },
        {
          sourceSystemId: getSystemId("servicenow"),
          name: "ServiceNow SPM MCP Adapter",
          adapterType: "servicenow-mcp",
          version: "1.0.0",
          serverUrl: "mcp://instance.servicenow.com",
          status: "active",
          supportedTools: JSON.stringify([
            "snow_create_demand", "snow_update_demand", "snow_get_portfolio",
            "snow_create_project", "snow_update_project", "snow_get_resource_plan",
            "snow_create_task", "snow_get_financials"
          ]),
          supportedResources: JSON.stringify(["demands", "portfolios", "projects", "resources", "financials"]),
          healthStatus: "healthy"
        },
        {
          sourceSystemId: getSystemId("confluence"),
          name: "Confluence MCP Adapter",
          adapterType: "confluence-mcp",
          version: "1.0.0",
          serverUrl: "mcp://confluence.atlassian.com",
          status: "active",
          supportedTools: JSON.stringify([
            "confluence_create_page", "confluence_update_page", "confluence_get_page",
            "confluence_search", "confluence_get_space", "confluence_add_comment"
          ]),
          supportedResources: JSON.stringify(["pages", "spaces", "comments", "attachments"]),
          healthStatus: "healthy"
        },
        {
          sourceSystemId: getSystemId("sharepoint"),
          name: "SharePoint MCP Adapter",
          adapterType: "sharepoint-mcp",
          version: "1.0.0",
          serverUrl: "mcp://sharepoint.microsoft.com",
          status: "inactive",
          supportedTools: JSON.stringify([
            "sp_upload_file", "sp_get_file", "sp_create_folder",
            "sp_search_files", "sp_get_list_items", "sp_create_list_item"
          ]),
          supportedResources: JSON.stringify(["files", "folders", "lists", "sites"]),
          healthStatus: "unknown"
        },
        {
          sourceSystemId: getSystemId("jira-align"),
          name: "Jira Align MCP Adapter (SAFe)",
          adapterType: "jira-align-mcp",
          version: "1.0.0",
          serverUrl: "mcp://jiraalign.com",
          status: "inactive",
          supportedTools: JSON.stringify([
            "align_get_portfolio", "align_get_value_stream", "align_get_art",
            "align_get_pi", "align_create_epic", "align_get_features",
            "align_sync_safe_hierarchy"
          ]),
          supportedResources: JSON.stringify(["portfolios", "value-streams", "arts", "pis", "epics", "features"]),
          healthStatus: "unknown"
        },
        {
          sourceSystemId: getSystemId("tempo"),
          name: "Tempo Timesheets MCP Adapter",
          adapterType: "tempo-mcp",
          version: "1.0.0",
          serverUrl: "mcp://tempo.io",
          status: "inactive",
          supportedTools: JSON.stringify([
            "tempo_log_time", "tempo_get_worklogs", "tempo_get_team_schedule",
            "tempo_get_capacity", "tempo_create_plan"
          ]),
          supportedResources: JSON.stringify(["worklogs", "teams", "plans", "capacity"]),
          healthStatus: "unknown"
        }
      ];

      // Create adapters only if they don't exist (idempotent by adapterType)
      const existingAdapterTypes = new Set(existingAdapters.map(a => a.adapterType));
      const allAdapters: { id: string; type: string }[] = existingAdapters.map(a => ({ id: a.id, type: a.adapterType }));
      
      for (const adapter of adaptersData) {
        if (!existingAdapterTypes.has(adapter.adapterType)) {
          const created = await storage.createMcpAdapter(adapter);
          allAdapters.push({ id: created.id, type: adapter.adapterType });
          adaptersSeeded++;
        }
      }

      // Helper to find adapter ID by type
      const getAdapterId = (type: string) => allAdapters.find(a => a.type === type)?.id;

      // Create default sync jobs for active adapters (idempotent - check by name)
      const existingJobNames = new Set(existingSyncJobs.map(j => j.name));
      const syncJobsData = [
        {
          name: "Jira Daily Sync",
          description: "Full bidirectional sync of epics, features, stories, and sprints with Jira",
          mcpAdapterId: getAdapterId("jira-mcp"),
          sourceSystemId: getSystemId("jira"),
          syncType: "incremental",
          syncDirection: "bidirectional",
          cronExpression: "0 6 * * *", // Daily at 6 AM
          isEnabled: "true",
          entityTypes: JSON.stringify(["epic", "feature", "story", "task", "sprint"]),
          conflictResolutionStrategy: "last_write_wins"
        },
        {
          name: "Azure DevOps Hourly Sync",
          description: "Incremental sync of work items and iterations with Azure DevOps",
          mcpAdapterId: getAdapterId("azure-devops-mcp"),
          sourceSystemId: getSystemId("azure-devops"),
          syncType: "incremental",
          syncDirection: "bidirectional",
          cronExpression: "0 * * * *", // Every hour
          isEnabled: "true",
          entityTypes: JSON.stringify(["epic", "feature", "story", "task"]),
          conflictResolutionStrategy: "last_write_wins"
        },
        {
          name: "ServiceNow Weekly Portfolio Sync",
          description: "Weekly full sync of portfolio, demands, and financials with ServiceNow SPM",
          mcpAdapterId: getAdapterId("servicenow-mcp"),
          sourceSystemId: getSystemId("servicenow"),
          syncType: "full",
          syncDirection: "inbound",
          cronExpression: "0 2 * * 0", // Sundays at 2 AM
          isEnabled: "true",
          entityTypes: JSON.stringify(["portfolio", "epic", "resource"]),
          conflictResolutionStrategy: "source_wins"
        }
      ];

      for (const job of syncJobsData) {
        if (!existingJobNames.has(job.name)) {
          await storage.createSyncJob(job);
          syncJobsSeeded++;
        }
      }

      // Create webhook endpoints for real-time updates (idempotent - check by path)
      const existingWebhookPaths = new Set(existingWebhooks.map(w => w.endpointPath));
      const webhooksData = [
        {
          name: "Jira Issue Webhook",
          description: "Receives real-time issue updates from Jira",
          sourceSystemId: getSystemId("jira"),
          mcpAdapterId: getAdapterId("jira-mcp"),
          endpointPath: "/webhooks/jira/issues",
          isEnabled: "true",
          eventTypes: JSON.stringify(["issue_created", "issue_updated", "issue_deleted", "sprint_started", "sprint_closed"])
        },
        {
          name: "Azure DevOps Work Item Webhook",
          description: "Receives work item change notifications from Azure DevOps",
          sourceSystemId: getSystemId("azure-devops"),
          mcpAdapterId: getAdapterId("azure-devops-mcp"),
          endpointPath: "/webhooks/azure-devops/workitems",
          isEnabled: "true",
          eventTypes: JSON.stringify(["workitem.created", "workitem.updated", "workitem.deleted"])
        },
        {
          name: "ServiceNow Demand Webhook",
          description: "Receives demand and project updates from ServiceNow",
          sourceSystemId: getSystemId("servicenow"),
          mcpAdapterId: getAdapterId("servicenow-mcp"),
          endpointPath: "/webhooks/servicenow/demands",
          isEnabled: "true",
          eventTypes: JSON.stringify(["demand.created", "demand.updated", "project.status_changed"])
        }
      ];

      for (const webhook of webhooksData) {
        if (!existingWebhookPaths.has(webhook.endpointPath)) {
          await storage.createWebhookEndpoint(webhook);
          webhooksSeeded++;
        }
      }

      // Reload scheduler to pick up new jobs
      const { reloadScheduledJobs } = await import("./syncScheduler");
      await reloadScheduledJobs();

      res.json({
        success: true,
        message: "PPM adapters, sync jobs, and webhooks seeded successfully",
        data: {
          sourceSystems: systemsSeeded,
          adapters: adaptersSeeded,
          syncJobs: syncJobsSeeded,
          webhooks: webhooksSeeded,
          totals: {
            sourceSystems: sourceSystemsData.length,
            adapters: adaptersData.length,
            syncJobs: syncJobsData.length,
            webhooks: webhooksData.length
          }
        }
      });
    } catch (error: any) {
      console.error("Seed PPM adapters error:", error);
      res.status(500).json({ error: "Failed to seed PPM adapters", details: error.message });
    }
  });

  // Get MCP integration overview
  app.get("/api/mcp/overview", async (_req, res) => {
    try {
      const [sourceSystems, adapters, syncJobs, webhooks, recentRuns] = await Promise.all([
        storage.getSourceSystems(),
        storage.getMcpAdapters(),
        storage.getSyncJobs(),
        storage.getWebhookEndpoints(),
        storage.getSyncJobRuns(undefined, 10)
      ]);

      res.json({
        sourceSystems: sourceSystems.length,
        adapters: {
          total: adapters.length,
          active: adapters.filter(a => a.status === "active").length,
          healthy: adapters.filter(a => a.healthStatus === "healthy").length
        },
        syncJobs: {
          total: syncJobs.length,
          enabled: syncJobs.filter(j => j.isEnabled === "true").length
        },
        webhooks: {
          total: webhooks.length,
          enabled: webhooks.filter(w => w.isEnabled === "true").length
        },
        recentRuns: recentRuns.slice(0, 5)
      });
    } catch (error: any) {
      console.error("Get MCP overview error:", error);
      res.status(500).json({ error: "Failed to get MCP overview" });
    }
  });

  // ============================================================================
  // AI INGESTION WIZARD - Anthropic-powered data analysis and QA gate
  // ============================================================================

  const { analyzeDataForIngestion, generateClarifyingQuestions, runQaReview, suggestAdditionalTools, detectSourceOntology } = await import("./aiIngestion");

  // Create new ingestion session
  app.post("/api/ingestion/sessions", async (req, res) => {
    try {
      const { name, sourceSystemId, mcpAdapterId, sampleData, createdBy } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Session name is required" });
      }

      const session = await storage.createIngestionSession({
        name,
        sourceSystemId,
        mcpAdapterId,
        sampleData: sampleData ? JSON.stringify(sampleData) : undefined,
        createdBy: createdBy || "system",
        status: sampleData ? "analyzing" : "draft"
      });

      res.json({ success: true, session });
    } catch (error: any) {
      console.error("Create ingestion session error:", error);
      res.status(500).json({ error: "Failed to create session", details: error.message });
    }
  });

  // Get all ingestion sessions
  app.get("/api/ingestion/sessions", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const sessions = await storage.getIngestionSessions(status);
      res.json({ sessions });
    } catch (error: any) {
      console.error("Get ingestion sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  // Get single ingestion session with details
  app.get("/api/ingestion/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getIngestionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const [qaReviews, clarifyingQuestions] = await Promise.all([
        storage.getQaReviews(session.id),
        storage.getClarifyingQuestions(session.id)
      ]);

      res.json({ 
        session, 
        qaReviews,
        clarifyingQuestions,
        pendingQuestions: clarifyingQuestions.filter(q => q.status === "pending").length
      });
    } catch (error: any) {
      console.error("Get ingestion session error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Run AI analysis on session data
  app.post("/api/ingestion/sessions/:id/analyze", async (req, res) => {
    try {
      const session = await storage.getIngestionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const { sourceSystem, sourceEntityType } = req.body;
      const sampleData = session.sampleData ? JSON.parse(session.sampleData) : req.body.sampleData;

      if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
        return res.status(400).json({ error: "Sample data is required for analysis" });
      }

      await storage.updateIngestionSession(session.id, { status: "analyzing" });

      const analysis = await analyzeDataForIngestion(
        sampleData,
        sourceSystem || "unknown",
        sourceEntityType || "unknown"
      );

      await storage.updateIngestionSession(session.id, {
        aiSummary: analysis.summary,
        aiPov: analysis.pov,
        qualityScore: analysis.dataQualityScore,
        safeMapping: JSON.stringify(analysis.safeMapping),
        totalRecords: analysis.recordCount,
        sampleData: JSON.stringify(sampleData),
        status: "pending_approval"
      });

      // Auto-generate initial QA reviews
      const reviewTypes = ["data_quality", "mapping_accuracy", "schema_validation", "completeness"] as const;
      for (const reviewType of reviewTypes) {
        await storage.createQaReview({
          ingestionSessionId: session.id,
          reviewType,
          status: "pending",
          score: analysis.dataQualityScore,
          aiAnalysis: analysis.pov,
          issues: JSON.stringify(analysis.issues),
          recommendations: JSON.stringify(analysis.recommendations),
          reviewer: "ai"
        });
      }

      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("Analyze session error:", error);
      res.status(500).json({ error: "Failed to analyze session", details: error.message });
    }
  });

  // Detect source ontology (for non-SAFe data)
  app.post("/api/ingestion/detect-ontology", async (req, res) => {
    try {
      const { sampleData, sourceSystem } = req.body;
      
      if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
        return res.status(400).json({ error: "Sample data is required" });
      }

      const result = await detectSourceOntology(sampleData, sourceSystem || "unknown");
      res.json({ success: true, ontology: result });
    } catch (error: any) {
      console.error("Ontology detection error:", error);
      res.status(500).json({ error: "Failed to detect ontology", details: error.message });
    }
  });

  // Generate clarifying questions
  app.post("/api/ingestion/sessions/:id/questions", async (req, res) => {
    try {
      const session = await storage.getIngestionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const existingQuestions = await storage.getClarifyingQuestions(session.id);
      const sampleData = session.sampleData ? JSON.parse(session.sampleData) : [];
      const analysisResult = {
        summary: session.aiSummary || "",
        pov: session.aiPov || "",
        dataQualityScore: session.qualityScore || 0,
        recordCount: session.totalRecords || 0,
        fieldAnalysis: [],
        safeMapping: session.safeMapping ? JSON.parse(session.safeMapping) : [],
        issues: [],
        recommendations: []
      };

      const result = await generateClarifyingQuestions({
        sampleData,
        sourceSystem: req.body.sourceSystem || "unknown",
        sourceEntityType: req.body.sourceEntityType || "unknown",
        analysisResult,
        existingQuestions: existingQuestions.map(q => ({ question: q.question, answer: q.answer || undefined }))
      });

      // Save generated questions
      const createdQuestions = [];
      for (const q of result.questions) {
        const question = await storage.createClarifyingQuestion({
          ingestionSessionId: session.id,
          question: q.question,
          context: q.context,
          questionType: q.questionType,
          options: q.options ? JSON.stringify(q.options) : undefined,
          impactArea: q.impactArea,
          priority: q.priority,
          status: "pending"
        });
        createdQuestions.push(question);
      }

      res.json({ success: true, questions: createdQuestions });
    } catch (error: any) {
      console.error("Generate questions error:", error);
      res.status(500).json({ error: "Failed to generate questions", details: error.message });
    }
  });

  // Answer a clarifying question
  app.post("/api/ingestion/questions/:id/answer", async (req, res) => {
    try {
      const { answer, answeredBy } = req.body;
      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      const question = await storage.answerClarifyingQuestion(
        req.params.id,
        answer,
        answeredBy || "user"
      );

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      res.json({ success: true, question });
    } catch (error: any) {
      console.error("Answer question error:", error);
      res.status(500).json({ error: "Failed to answer question" });
    }
  });

  // Get all clarifying questions for a session
  app.get("/api/ingestion/sessions/:id/questions", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const questions = await storage.getClarifyingQuestions(req.params.id, status);
      res.json({ questions });
    } catch (error: any) {
      console.error("Get questions error:", error);
      res.status(500).json({ error: "Failed to get questions" });
    }
  });

  // Run QA review
  app.post("/api/ingestion/sessions/:id/qa-review", async (req, res) => {
    try {
      const session = await storage.getIngestionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const { reviewType } = req.body;
      if (!reviewType || !["data_quality", "mapping_accuracy", "schema_validation", "completeness"].includes(reviewType)) {
        return res.status(400).json({ error: "Valid review type is required" });
      }

      const sampleData = session.sampleData ? JSON.parse(session.sampleData) : [];
      const answeredQuestions = await storage.getClarifyingQuestions(session.id, "answered");
      
      const analysisResult = {
        summary: session.aiSummary || "",
        pov: session.aiPov || "",
        dataQualityScore: session.qualityScore || 0,
        recordCount: session.totalRecords || 0,
        fieldAnalysis: [],
        safeMapping: session.safeMapping ? JSON.parse(session.safeMapping) : [],
        issues: [],
        recommendations: []
      };

      const review = await runQaReview(
        {
          sampleData,
          sourceSystem: req.body.sourceSystem || "unknown",
          analysisResult,
          answeredQuestions: answeredQuestions.map(q => ({ question: q.question, answer: q.answer || "" }))
        },
        reviewType
      );

      const qaReview = await storage.createQaReview({
        ingestionSessionId: session.id,
        reviewType,
        status: review.status,
        score: review.score,
        aiAnalysis: review.analysis,
        issues: JSON.stringify(review.issues),
        recommendations: JSON.stringify(review.recommendations),
        reviewer: "ai"
      });

      res.json({ success: true, qaReview, review });
    } catch (error: any) {
      console.error("Run QA review error:", error);
      res.status(500).json({ error: "Failed to run QA review", details: error.message });
    }
  });

  // Approve ingestion session
  app.post("/api/ingestion/sessions/:id/approve", async (req, res) => {
    try {
      const session = await storage.getIngestionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const { approvedBy } = req.body;
      
      const updated = await storage.updateIngestionSession(session.id, {
        status: "approved",
        approvedBy: approvedBy || "user",
        approvedAt: new Date()
      });

      res.json({ success: true, session: updated });
    } catch (error: any) {
      console.error("Approve session error:", error);
      res.status(500).json({ error: "Failed to approve session" });
    }
  });

  // Start ingestion after approval
  app.post("/api/ingestion/sessions/:id/ingest", async (req, res) => {
    try {
      const session = await storage.getIngestionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.status !== "approved") {
        return res.status(400).json({ error: "Session must be approved before ingestion" });
      }

      await storage.updateIngestionSession(session.id, { status: "ingesting" });

      // Simulate ingestion process
      const sampleData = session.sampleData ? JSON.parse(session.sampleData) : [];
      const mappedRecords = Math.floor(sampleData.length * 0.95);

      await storage.updateIngestionSession(session.id, {
        status: "completed",
        mappedRecords,
        completedAt: new Date()
      });

      res.json({ 
        success: true, 
        message: "Ingestion completed",
        stats: {
          totalRecords: sampleData.length,
          mappedRecords,
          errors: sampleData.length - mappedRecords
        }
      });
    } catch (error: any) {
      console.error("Ingest session error:", error);
      res.status(500).json({ error: "Failed to ingest data", details: error.message });
    }
  });

  // Get QA reviews for a session
  app.get("/api/ingestion/sessions/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getQaReviews(req.params.id);
      res.json({ reviews });
    } catch (error: any) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // Suggest additional tools
  app.post("/api/mcp/suggest-tools", async (req, res) => {
    try {
      const { currentCapabilities, userContext } = req.body;
      const suggestions = await suggestAdditionalTools(
        currentCapabilities || ["connect", "mapping", "qa-gate", "sync-status", "ai-analysis"],
        userContext || "Enterprise SAFe PPM transformation"
      );
      res.json({ success: true, suggestions: suggestions.tools });
    } catch (error: any) {
      console.error("Suggest tools error:", error);
      res.status(500).json({ error: "Failed to suggest tools" });
    }
  });

  // ============================================================================
  // VRO METRICS API - Database-driven VRO performance metrics
  // ============================================================================

  app.get("/api/vro-metrics", async (_req, res) => {
    try {
      const metrics = await storage.getVroMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Get VRO metrics error:", error);
      res.status(500).json({ error: "Failed to get VRO metrics" });
    }
  });

  const updateVroMetricSchema = z.object({
    label: z.string().optional(),
    value: z.string().optional(),
    unit: z.string().optional(),
    color: z.string().optional(),
    source: z.string().optional(),
    category: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  });

  app.put("/api/vro-metrics/:id", async (req, res) => {
    try {
      const parseResult = updateVroMetricSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const metric = await storage.updateVroMetric(req.params.id, parseResult.data);
      if (!metric) {
        return res.status(404).json({ error: "Metric not found" });
      }
      res.json(metric);
    } catch (error: any) {
      console.error("Update VRO metric error:", error);
      res.status(500).json({ error: "Failed to update metric" });
    }
  });

  // ============================================================================
  // BENCHMARKS API - Industry benchmarks for comparison
  // ============================================================================

  app.get("/api/benchmarks", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const benchmarksList = await storage.getBenchmarks(category);
      res.json(benchmarksList);
    } catch (error: any) {
      console.error("Get benchmarks error:", error);
      res.status(500).json({ error: "Failed to get benchmarks" });
    }
  });

  // ============================================================================
  // APP CONFIG API - Application settings including demo mode
  // ============================================================================

  app.get("/api/config/:key", async (req, res) => {
    try {
      const config = await storage.getAppConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ error: "Config not found" });
      }
      res.json(config);
    } catch (error: any) {
      console.error("Get config error:", error);
      res.status(500).json({ error: "Failed to get config" });
    }
  });

  app.get("/api/config", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const configs = await storage.getAllAppConfig(category);
      res.json(configs);
    } catch (error: any) {
      console.error("Get all config error:", error);
      res.status(500).json({ error: "Failed to get configs" });
    }
  });

  const setAppConfigSchema = z.object({
    value: z.string().min(1, "Value is required"),
    description: z.string().optional(),
    category: z.string().optional(),
  });

  app.put("/api/config/:key", async (req, res) => {
    try {
      const parseResult = setAppConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const { value, description, category } = parseResult.data;
      const config = await storage.setAppConfig(req.params.key, value, description, category);
      res.json(config);
    } catch (error: any) {
      console.error("Set config error:", error);
      res.status(500).json({ error: "Failed to set config" });
    }
  });

  // ============================================================================
  // ALERTS API - Active alerts from database
  // ============================================================================

  app.get("/api/alerts/active", async (_req, res) => {
    try {
      const activeAlerts = await storage.getAlerts("active");
      res.json(activeAlerts);
    } catch (error: any) {
      console.error("Get active alerts error:", error);
      res.status(500).json({ error: "Failed to get active alerts" });
    }
  });

  return httpServer;
}
