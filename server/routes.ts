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

  return httpServer;
}
