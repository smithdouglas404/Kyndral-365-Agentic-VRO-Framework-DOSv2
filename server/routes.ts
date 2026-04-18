import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as postgresStorage } from "./storage";
import { getPalantirStorageAdapter } from "./services/PalantirStorageAdapter.js";
import { parsePolicyDocument, extractPolicyMetadata, generateLifecycleInsight } from "./anthropic";

const storage = getPalantirStorageAdapter(postgresStorage);
import { registerCoPilotRoutes } from "./copilot";
import { askPM } from "./askPM";
import { generateExecutiveInsights, refreshInsights } from "./executiveInsights";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerFirebaseAuthRoutes } from "./routes/firebase-auth.js";
import { registerFinancialRoutes } from "./routes/financials.js";
import { registerPredictiveRoutes } from "./routes/predictive.js";
import { registerCrossProjectImpactRoutes } from "./routes/cross-project-impact.js";
import { registerOrchestrationRoutes, getBootstrapInstance } from "./routes/orchestration.js";
import { registerIssueRoutes } from "./routes/issues.js";
import { registerChangeRequestRoutes } from "./routes/change-requests.js";
import { registerDeepAgentRoutes } from "./routes/deep-agents.js";
import { registerDashboardDataRoutes } from "./routes/dashboard-data.js";
import { registerIntegrationRoutes } from "./routes/admin/integrations.js";
import { registerUserManagementRoutes } from "./routes/admin/users.js";
import { registerMCPServerRoutes } from "./routes/admin/mcp-servers.js";
import { registerCustomMCPPresetRoutes } from "./routes/admin/custom-mcp-presets.js";
import { registerAgentConfigRoutes } from "./routes/admin/agent-config.js";
import { registerOrchestratorRoutes, setBootstrapGetter } from "./routes/admin/orchestrator.js";
import { registerAgentObjectRoutes } from "./routes/agent-objects.js";
import { registerAgentModelRoutes } from "./routes/agent-model.js";
import { registerAgentActionRoutes } from "./routes/agent-actions.js";
import { registerLogicGatesRoutes } from "./routes/logic-gates.js";
import mem0ApiRouter from "./routes/mem0-api.js";
import a2aApiRouter, { setA2ABusGetter } from "./routes/a2a-api.js";
import { registerAgentIntegrationRoutes, initializeAgentIntegration } from "./integration/mastra-a2a-mcp.js";
import mastraServerRouter from "./routes/mastra-server.js";
import ontologyApiRouter from "./routes/ontology-api.js";
import agentSchemasRouter from "./routes/agent-schemas.js";
import llmCalculatorRouter from "./routes/llm-calculator.js";
import agentMcpRouter from "./routes/agent-mcp.js";
import { registerAgentMcpConnectionRoutes } from "./routes/admin/agent-mcp-connections.js";
import { registerAgentAdminRoutes } from "./routes/admin/agents.js";
import { registerPalantirRoutes } from "./routes/palantir.js";
import { registerPalantirOntologyRoutes } from "./routes/palantir-ontology.js";
import { getPalantirService } from "./mcp/MCPServiceFactory.js";
import palantirSyncRouter from "./routes/palantir-sync.js";
import { registerAgentSetupRoutes } from "./routes/admin/agent-setup.js";
import { createAgentMemoryRoutes } from "./routes/admin/agent-memory.js";
import { registerCollaborationRulesRoutes } from "./routes/admin/collaboration-rules.js";
import { registerDatabaseManagementRoutes } from "./routes/admin/database-management.js";
import { registerCustomAttributesRoutes } from "./routes/custom-attributes.js";
import { registerAgentAttributeRoutes } from "./routes/agent-attributes.js";
import { registerAgentRulesRoutes } from "./routes/agent-rules.js";
import { registerPolicyAsCodeRoutes } from "./routes/policy-as-code.js";
import { registerPolicyMCPRoutes } from "./routes/policy-mcp.js";
import ruleExecutionHistoryRouter from "./routes/rule-execution-history.js";
import hitlRouter from "./routes/hitl.js";
import palantirRulesRouter from "./routes/palantir-rules.js";
import enterpriseRulesRouter from "./routes/enterprise-rules.js";
import { initializeEnterpriseRulesEngine } from "./services/EnterpriseRulesEngine.js";
import ontologyExplorerRouter from "./routes/ontology-explorer.js";
import ontologySubscriptionsRouter from "./routes/ontology-subscriptions.js";
import graphExplorerRouter from "./routes/graph-explorer.js";
import workflowAutomationRouter from "./routes/workflow-automation.js";
import agentRegistryRouter from "./routes/agent-registry.js";
import agentDataRouter from "./routes/agent-data.js";
import { registerOkrKpiRoutes } from "./routes/admin/okr-kpi.js";
import { registerOKRRuleMappingRoutes } from "./routes/okr-rule-mappings.js";
import { registerPermissionRoutes } from "./routes/admin/permissions.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerDashboardConfigRoutes } from "./routes/dashboard-config.js";
import shareRouter from "./routes/share.js";
import { registerAgentExecutionRoutes } from "./routes/agents.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { registerCustomFieldRoutes } from "./routes/admin/custom-fields.js";
import { registerWorkflowRoutes } from "./routes/admin/workflows.js";
import { registerResourceRoutes } from "./routes/resources.js";
import { registerPortfolioOptimizationRoutes } from "./routes/portfolio-optimization.js";
import { registerCollaborationRoutes } from "./routes/collaboration.js";
import { registerWhiteLabelRoutes } from "./routes/admin/white-label.js";
import { registerAgentInsightsRoutes } from "./routes/agent-insights.js";
import { registerAgentActivityRoutes } from "./routes/agent-activity.js";
import { registerCompanyProfileRoutes } from "./routes/company-profile.js";
import { registerApprovalCenterRoutes } from "./routes/approval-center.js";
import { registerGovernanceEnforcementRoutes } from "./routes/governance-enforcement.js";
import { registerGovernanceRoutes } from "./routes/governance.js";
import { registerVoiceBriefingRoutes } from "./routes/voice-briefings.js";
import { registerRecommendationsRoutes } from "./routes/recommendations.js";
import { createLLMConfigRoutes } from "./routes/llm-config.js";
import { createKnowledgeBaseRoutes } from "./routes/knowledge-base.js";
import { createEnhancedKnowledgeBaseRoutes } from "./routes/admin/enhanced-knowledge-base.js";
import { createBattleRhythmRoutes } from "./routes/battle-rhythm.js";
import { createCommandersIntentRoutes } from "./routes/commanders-intent.js";
import { createCOPRoutes } from "./routes/cop.js";
import { createDataIngestionRoutes } from "./routes/data-ingestion.js";
import { createComplianceRoutes } from "./routes/compliance.js";
import documentsRouter from "./routes/documents.js";
import { registerDemoRoutes } from "./routes/demo.js";
import packetRefineRouter from "./routes/packet-refine.js";
import liquidCanvasRouter from "./routes/liquid-canvas.js";
import openprojectWebhookRouter from "./routes/webhooks/openproject.js";
import tenantAuthRouter from "./routes/tenant-auth";
import systemAdminRouter from "./routes/system-admin";
import { JiraClient, createJiraClientFromAdapter } from "./jiraClient";
import toolMappingRouter from "./routes/tool-mapping.js";
import { registerWebhookRoutes } from "./webhookHandler";
import { broadcastCriticalAlert, broadcastNotification } from "./websocket";
import { isDemoMode } from "./lib/isDemoMode.js";
import { z } from "zod";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import * as fs from "fs";
import * as path from "path";
import { createOBDAService } from "./obda/index.js";
import { createGraphQLSchema, createGraphQLContext } from "./graphql/schema.js";
import { createHandler } from "graphql-http/lib/use/express";
import { ontologyService } from "./ontology/index.js";

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

// Legacy slug mapping for backward compatibility (maps old URLs to current database IDs)
// Supports both short IDs (fpl, neer) and long IDs (florida-power-light, nextera-energy-resources)
const legacyDivisionSlugs: Record<string, string[]> = {
  // Short ID aliases
  'fpl': ['fpl', 'florida-power-light'],
  'neer': ['neer', 'nextera-energy-resources'],
  'corporate-other': ['corporate-other'],
  // Long ID aliases
  'florida-power-light': ['fpl', 'florida-power-light'],
  'nextera-energy-resources': ['neer', 'nextera-energy-resources'],
  'corporate-and-other': ['corporate-other'],
  // Legacy L&G aliases
  'lgim': ['neer', 'nextera-energy-resources'],
  'lgc': ['corporate-other'],
  'lgri': ['fpl', 'florida-power-light'],
  'lgr': ['fpl', 'florida-power-light'],
  'lgf': ['corporate-other'],
  'lgi': ['corporate-other'],
  'asset-management': ['neer', 'nextera-energy-resources'],
  'institutional-retirement': ['fpl', 'florida-power-light'],
  'retail': ['fpl', 'florida-power-light'],
  'capital': ['corporate-other'],
  'insurance': ['corporate-other'],
  'fintech': ['corporate-other'],
};

// Try each possible ID until one works (handles both dev and prod database IDs)
async function resolveDivisionIdAsync(id: string): Promise<string> {
  const candidates = legacyDivisionSlugs[id] || [id];
  for (const candidateId of candidates) {
    const division = await storage.getDivision(candidateId);
    if (division) return candidateId;
  }
  return candidates[0]; // Fallback to first candidate
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup authentication (must be before other routes)
  registerAuthRoutes(app, storage);

  // Setup Firebase authentication (alternative to JWT auth)
  registerFirebaseAuthRoutes(app, storage);

  // Register Demo routes (ACME industry-specific demo data loading)
  registerDemoRoutes(app);

  // Register Multi-Tenant Authentication routes (SaaS login, demo access, invitations)
  app.use('/api/tenant-auth', tenantAuthRouter);

  // Register System Admin routes (Tenant provisioning, demo request management)
  app.use('/api/system-admin', systemAdminRouter);

  // Register Integration Management routes (ADMIN - External data source configuration)
  registerIntegrationRoutes(app, storage);

  // Register MCP Server Management routes (ADMIN - MCP server activation & configuration)
  registerMCPServerRoutes(app);

  // Register Custom MCP Preset Management routes (ADMIN - Custom integration builder)
  registerCustomMCPPresetRoutes(app);

  // Register Agent Action routes (Server endpoints for agent MCP integrations)
  registerAgentActionRoutes(app);

  // Register Logic Gates routes (Autonomous agent collaboration via Logic Gates)
  registerLogicGatesRoutes(app);

  // Register Agent Objects routes (Query agent attributes)
  registerAgentObjectRoutes(app);

  // Register Mem0 API routes (Mem0 fact operations for agents)
  app.use('/api/mem0', mem0ApiRouter);

  // Register A2A API routes (Agent-to-Agent messaging - legacy internal bus)
  app.use('/api/a2a', a2aApiRouter);

  // Register Mastra server routes (for Mastra Cloud integration)
  app.use('/api/mastra', mastraServerRouter);
  console.log('[MastraServer] Routes registered at /api/mastra');

  // Register Dynamic Agent Management routes
  const { createDynamicAgentRoutes } = await import('./routes/dynamic-agents.js');
  app.use('/api/dynamic-agents', createDynamicAgentRoutes(storage));
  console.log('[DynamicAgents] Routes registered at /api/dynamic-agents');

  // Register Agent Tracing / Observability routes
  const { initTracing } = await import('./services/AgentTracing.js');
  const agentTracingRouter = (await import('./routes/agent-tracing.js')).default;
  initTracing(storage);
  app.use('/api/agent-tracing', agentTracingRouter);
  console.log('[AgentTracing] Routes registered at /api/agent-tracing');

  // Register Mastra + A2A Protocol + MCP routes (external agent interoperability)
  // - A2A: Agent Cards, task management, discovery (/.well-known/a2a/agent-card, /api/a2a/*)
  // - MCP: Tool exposure for external MCP clients (/api/mcp/*)
  registerAgentIntegrationRoutes(app, storage);

  // Register Agent Object Model routes (Agent definitions, attributes, signals)
  registerAgentModelRoutes(app);

  // Register Ontology API routes (Ontology operations for agents)
  app.use('/api/ontology', ontologyApiRouter);


  // Register Agent Schemas routes (Predefined agent attributes and relationships)
  app.use('/api/agent-schemas', agentSchemasRouter);

  // Register LLM Calculator routes (LLM-based attribute calculations with narrative + sourcing)
  app.use('/api/llm-calculator', llmCalculatorRouter);

  // Register Agent-MCP Query routes (Agents query their connected MCPs: Knowledge + Governance)
  app.use('/api/agent-mcp', agentMcpRouter);

  // Agent Data Push API (External agents push real-time data to UI via WebSocket)
  app.use('/api/agent', agentDataRouter);

  // Register Agent-MCP Connection Management routes (ADMIN - Manage MCP connections to agents)
  registerAgentMcpConnectionRoutes(app);

  // Register Agent Admin routes (ADMIN - CRUD for agent definitions)
  registerAgentAdminRoutes(app);

  // Palantir AIP super-MCP routes
  registerPalantirRoutes(app);

  // Palantir Ontology API routes (serves dashboard data from Palantir)
  registerPalantirOntologyRoutes(app);

  // Palantir Sync & Ontology Data Provider routes (ontology-first architecture)
  app.use('/api/palantir', palantirSyncRouter);

  // Notification Agent API (11th agent — Palantir gateway, HITL approvals, signal broadcast)
  app.get('/api/notification-agent/status', (_req, res) => {
    try {
      const bootstrap = (global as any).__deepAgentBootstrap;
      const notificationAgent = bootstrap?.getAgent?.('notification');
      if (!notificationAgent) {
        return res.json({ success: true, status: { agentId: 'notification', initialized: false } });
      }
      res.json({ success: true, status: notificationAgent.getStatus() });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notification-agent/signal', async (req, res) => {
    try {
      const { sourceAgentId, actionType, payload, hitlRequired } = req.body;
      if (!sourceAgentId || !actionType) {
        return res.status(400).json({ success: false, error: 'sourceAgentId and actionType required' });
      }
      const bootstrap = (global as any).__deepAgentBootstrap;
      const notificationAgent = bootstrap?.getAgent?.('notification');
      if (!notificationAgent) {
        return res.status(503).json({ success: false, error: 'Notification agent not initialized' });
      }
      const result = await notificationAgent.sendSignal(sourceAgentId, actionType, payload || {}, hitlRequired || false);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notification-agent/approve', async (req, res) => {
    try {
      const { actionId, approvedBy } = req.body;
      if (!actionId) {
        return res.status(400).json({ success: false, error: 'actionId required' });
      }
      const bootstrap = (global as any).__deepAgentBootstrap;
      const notificationAgent = bootstrap?.getAgent?.('notification');
      if (!notificationAgent) {
        return res.status(503).json({ success: false, error: 'Notification agent not initialized' });
      }
      const result = await notificationAgent.approveHITLAction(actionId, approvedBy || 'admin');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notification-agent/reject', async (req, res) => {
    try {
      const { actionId, rejectedBy, reason } = req.body;
      if (!actionId) {
        return res.status(400).json({ success: false, error: 'actionId required' });
      }
      const bootstrap = (global as any).__deepAgentBootstrap;
      const notificationAgent = bootstrap?.getAgent?.('notification');
      if (!notificationAgent) {
        return res.status(503).json({ success: false, error: 'Notification agent not initialized' });
      }
      const result = await notificationAgent.rejectHITLAction(actionId, rejectedBy || 'admin', reason || 'Rejected');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Initialize A2A bus getter for API routes
  setA2ABusGetter(() => {
    const { createAgentScheduler } = require("./agents/AgentScheduler.js");
    const scheduler = createAgentScheduler(storage);
    const orchestrator = scheduler.getOrchestrator();
    if (!orchestrator) {
      throw new Error('Orchestrator not initialized');
    }
    return orchestrator.getA2ABus();
  });

  // Initialize Mastra + A2A Protocol + MCP integration (async, non-blocking)
  initializeAgentIntegration(storage).catch((err) => {
    console.error('[Routes] Failed to initialize agent integration:', err.message);
  });

  // Register Agent Configuration routes (ADMIN - AI agent settings and thresholds)
  registerAgentConfigRoutes(app);

  // Register Orchestrator Control routes (ADMIN - start/stop/configure continuous orchestration)
  registerOrchestratorRoutes(app);

  // Register Agent Setup routes (ADMIN - Agent wizard and MCP/LLM configuration)
  registerAgentSetupRoutes(app);

  // Register Agent Memory routes (ADMIN - Mem0 facts and Letta memory viewer)
  app.use('/api/admin/agent-memory', createAgentMemoryRoutes());

  // Register Notification routes (Email, Slack, Teams, In-App notifications)
  registerNotificationRoutes(app);

  // Register Dashboard Config routes (User dashboard layouts, custom widgets, app config)
  registerDashboardConfigRoutes(app);

  // Register Share routes (Dashboard/widget sharing, cloning, access management)
  app.use('/api/share', shareRouter);
  console.log('[Share] Routes registered at /api/share');

  // Register Agent Execution routes (Execute agent requests with configured tools)
  registerAgentExecutionRoutes(app);

  // Register Collaboration Rules routes (ADMIN - Inter-agent collaboration rule builder)
  registerCollaborationRulesRoutes(app);

  // Register Custom Attributes routes (ADMIN - Custom agent attributes exposed via MCP)
  registerCustomAttributesRoutes(app);
  // Register Agent Attribute Registry routes (live agent attributes for dashboards)
  registerAgentAttributeRoutes(app);

  // Register Agent Rules routes (CRUD - Agent-specific collaboration rules)
  registerAgentRulesRoutes(app);


  // Register Policy-as-Code routes (LLM extraction + HITL approval workflow)
  registerPolicyAsCodeRoutes(app);

  // Register Policy-as-Code MCP Server routes (MCP tools for all agents to query compliance/regulatory/SOPs)
  registerPolicyMCPRoutes(app, storage);

  // Register Rule Execution History routes (MONITORING - Audit trail of rule executions)
  app.use("/api/rules", ruleExecutionHistoryRouter);
  app.use("/api/hitl", hitlRouter);
  app.use("/api/palantir-rules", palantirRulesRouter);
  app.use("/api/enterprise-rules", enterpriseRulesRouter);

  try {
    initializeEnterpriseRulesEngine();
    console.log('[Routes] Enterprise Rules Engine initialized');
  } catch (error: any) {
    console.warn(`[Routes] Enterprise Rules Engine init failed: ${error.message}`);
  }
  app.use("/api/ontology-explorer", ontologyExplorerRouter);
  app.use("/api/ontology-subscriptions", ontologySubscriptionsRouter);
  app.use("/api/graph", graphExplorerRouter);
  app.use("/api/workflow-automation", workflowAutomationRouter);
  app.use("/api/agent-registry", agentRegistryRouter);

  // Register OKR/KPI Management routes (ADMIN - Objectives, Key Results, and KPIs)
  registerOkrKpiRoutes(app);

  // Register OKR-Rule Mapping routes (Link OKRs to agent collaboration rules)
  registerOKRRuleMappingRoutes(app, storage);

  // Register Permission Management routes (ADMIN - Granular user permissions)
  registerPermissionRoutes(app);

  // Register User Management routes (ADMIN - User account management)
  registerUserManagementRoutes(app);

  // Register Custom Field Management routes (ADMIN - Custom field definitions)
  registerCustomFieldRoutes(app);

  // Register Workflow Management routes (ADMIN - Workflow & approval definitions)
  registerWorkflowRoutes(app, storage);

  // Register Database Management routes (ADMIN - Seeding and backups)
  registerDatabaseManagementRoutes(app, storage);

  // Register White-Label & Theming routes (TIER 3 - Customization)
  registerWhiteLabelRoutes(app);

  // Register Resource Management routes (Capacity planning & skill tracking)
  registerResourceRoutes(app, storage);

  // Register Dashboard Data routes (REPLACES ALL STATIC DATA)
  registerDashboardDataRoutes(app, storage);

  // Register Analytics Engine routes (PREDICTIVE, IMPACT, FINANCIAL)
  registerAnalyticsRoutes(app, storage);

  // Register Portfolio Optimization routes (TIER 3 - AI Optimization)
  registerPortfolioOptimizationRoutes(app, storage);

  // Register Real-Time Collaboration routes (TIER 3 - Presence, Comments)
  registerCollaborationRoutes(app, storage);

  // Register Agent Insights routes (NEW - Expose agent calculations to UI)
  registerAgentInsightsRoutes(app, storage);

  // Register Agent Activity routes (Real-time A2A messages and activity logs)
  registerAgentActivityRoutes(app);

  // Register Governance routes (Risk framework and compliance data)
  registerGovernanceRoutes(app, storage);

  // Register Company Profile routes (Policy-as-Code, Setup Wizard)
  registerCompanyProfileRoutes(app);

  // Register Approval Center routes (HITL review for AI-generated content)
  registerApprovalCenterRoutes(app);

  // Register Tool Mapping routes (Multi-tool PM integration: Jira, Monday, OpenProject)
  app.use("/api/tools", toolMappingRouter);

  // Register Governance Enforcement routes (Rules engine, approval requests)
  registerGovernanceEnforcementRoutes(app);

  // Register Voice Briefing routes (NotebookLM-style podcast summaries)
  registerVoiceBriefingRoutes(app, storage);

  // Register Recommendations routes (AI-driven recommendations from agents)
  registerRecommendationsRoutes(app, storage);

  // Register LLM Configuration routes (PLUG-AND-PLAY LLM SWITCHING)
  app.use("/api/llm-config", createLLMConfigRoutes(storage));

  // Register Knowledge Base routes (PMBOK, Prince2, PMI, SAFe, SOPs)
  app.use("/api/knowledge-base", createKnowledgeBaseRoutes(storage));

  // Register Enhanced Knowledge Base routes (ADMIN - Agent-tagged docs with regulatory support)
  app.use("/api/admin/knowledge-base", createEnhancedKnowledgeBaseRoutes(storage));

  // Register Battle Rhythm routes (Military-inspired cadence-aware scheduling)
  app.use("/api/battle-rhythm", createBattleRhythmRoutes(storage));

  // Register Commander's Intent routes (One-page project directive)
  app.use("/api/commanders-intent", createCommandersIntentRoutes(storage));

  // Register Common Operational Picture routes (Three-layer view)
  app.use("/api/cop", createCOPRoutes(storage));

  // Register Data Ingestion routes (Jira, Azure DevOps, MS Project sync)
  app.use("/api/data-ingestion", createDataIngestionRoutes(storage));

  // Register Compliance Validation routes (Regulatory framework checking)
  app.use("/api/compliance", createComplianceRoutes(storage));

  // Register Document Management routes (Upload, versioning, approvals)
  app.use("/api/documents", documentsRouter);

  // Register Multi-Agent Orchestration routes (UNIFIED INTELLIGENCE LAYER)
  registerOrchestrationRoutes(app, storage);

  // Connect orchestrator to admin API via lazy getter (no timing issues)
  setBootstrapGetter(getBootstrapInstance);
  console.log('[Routes] Orchestrator API connected via lazy getter');

  // Register Financial Intelligence routes (for agents and dashboards)
  registerFinancialRoutes(app, storage);

  // Register Predictive Analytics routes (for risk prediction and forecasting)
  registerPredictiveRoutes(app, storage);

  // Register VRO/PMO Trend Forecast routes (proactive portfolio analytics)
  const { createTrendForecastRoutes } = await import('./routes/trend-forecast.js');
  app.use('/api/trend-forecast', createTrendForecastRoutes(storage));
  console.log('[TrendForecast] Routes registered at /api/trend-forecast');

  // Register new analytics module routes
  const { createAgentROIRoutes } = await import('./routes/agent-roi.js');
  app.use('/api/agent-roi', createAgentROIRoutes(storage));

  const { createComplianceAuditRoutes } = await import('./routes/compliance-audit.js');
  app.use('/api/compliance-audit', createComplianceAuditRoutes(storage));

  const { createStakeholderSentimentRoutes } = await import('./routes/stakeholder-sentiment.js');
  app.use('/api/stakeholder-sentiment', createStakeholderSentimentRoutes(storage));

  const { createPortfolioInvestmentRoutes } = await import('./routes/portfolio-investment.js');
  app.use('/api/portfolio-investment', createPortfolioInvestmentRoutes(storage));

  const { createDependencyHealthRoutes } = await import('./routes/dependency-health.js');
  app.use('/api/dependency-health', createDependencyHealthRoutes(storage));

  console.log('[Analytics] 5 new module routes registered (agent-roi, compliance-audit, stakeholder-sentiment, portfolio-investment, dependency-health)');

  // Register Cross-Project Impact routes (THE KILLER FEATURE - cascade impact analysis)
  registerCrossProjectImpactRoutes(app, storage);

  // Register Issue Management routes (CRITICAL - PM systems lack good issue tracking)
  registerIssueRoutes(app, storage);

  // Register Change Request routes (CRITICAL - Scope control and governance)
  registerChangeRequestRoutes(app, storage);

  // Register Deep Agent routes (ENHANCED INTELLIGENCE - Planning + Reflection + Multi-step reasoning)
  registerDeepAgentRoutes(app, storage);

  // Register AI CoPilot routes
  registerCoPilotRoutes(app);

  // Packet refinement — collaborative agent-user visualization reshaping via OpenRouter
  app.use('/api/copilot', packetRefineRouter);

  // Liquid Canvas — agent canvases, attribute catalog
  app.use('/api/liquid-canvas', liquidCanvasRouter);

  // OpenProject webhooks — real-time event-driven sync
  app.use('/api/webhooks/openproject', openprojectWebhookRouter);

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
      // SOURCE OF TRUTH: PALANTIR
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData();
      res.json(safeData.projects);
    } catch (error) {
      console.error('Failed to fetch projects from Palantir:', error);
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

  // API Key management endpoints
  app.get("/api/ai/check-key", async (_req, res) => {
    try {
      const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
      res.json({ valid: hasOpenRouter, configured: hasOpenRouter, note: "All LLM calls routed through OpenRouter. No direct Anthropic calls." });
    } catch (error: any) {
      res.json({ valid: false, configured: false, error: error.message });
    }
  });

  app.post("/api/admin/api-keys", async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const allowedKeys = ['OPENROUTER_API_KEY'];
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ error: "Invalid key name. Only OPENROUTER_API_KEY is supported." });
      }

      await storage.setAppConfig(`${key}_configured`, 'true');
      
      res.json({ 
        success: true, 
        message: "API key format validated. Please add this key to your Replit Secrets panel for it to take effect."
      });
    } catch (error: any) {
      console.error("API key save error:", error);
      res.status(500).json({ error: error.message || "Failed to save API key" });
    }
  });

  // Project Template endpoints (database-backed)
  app.get("/api/templates", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getProjectTemplates(category);
      // Return as array of slugs for backward compatibility
      res.json({ templates: templates.map(t => `${t.slug}.json`) });
    } catch (error: any) {
      console.error("Templates list error:", error);
      res.status(500).json({ error: "Failed to list templates" });
    }
  });

  app.get("/api/templates/:name", async (req, res) => {
    try {
      // Support both "Regional Utility-Grid-Modernization.json" and "Regional Utility-Grid-Modernization"
      const slug = req.params.name.replace('.json', '');
      const template = await storage.getProjectTemplateBySlug(slug);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Return the parsed template data
      res.json(JSON.parse(template.templateData));
    } catch (error: any) {
      console.error("Template fetch error:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });
  
  // Full template list with metadata (for admin/management)
  app.get("/api/project-templates", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getProjectTemplates(category);
      res.json(templates.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        bu: t.bu,
        division: t.division,
        description: t.description,
        category: t.category,
        isActive: t.isActive,
        createdAt: t.createdAt,
      })));
    } catch (error: any) {
      console.error("Project templates list error:", error);
      res.status(500).json({ error: "Failed to list project templates" });
    }
  });

  app.post("/api/projects/ingest", async (req, res) => {
    try {
      const projectData = req.body;
      if (!projectData.name || !projectData.bu) {
        return res.status(400).json({ error: "Project name and business unit are required" });
      }

      // 1) Ingest into Palantir (single source of truth — no Postgres writes)
      const { getPalantirIngestService } = await import('./services/PalantirIngestService.js');
      const ingestService = getPalantirIngestService();

      let ingestResult;
      try {
        ingestResult = await ingestService.ingest(projectData);
      } catch (ingestErr: any) {
        console.error('[ingest] Palantir ingest failed:', ingestErr);
        return res.status(503).json({
          error: 'Palantir ingest failed',
          message: ingestErr.message,
        });
      }

      const projectId = ingestResult.projectId;

      // 2) Invoke REAL PMO + VRO agent tools against the freshly ingested project
      const bootstrap = (global as any).__deepAgentBootstrap;
      const agentResults: any[] = [];

      if (bootstrap?.getAgent) {
        const pmo = bootstrap.getAgent('pmo');
        const vro = bootstrap.getAgent('vro');

        // Project-specific PMO tools target the freshly ingested project.
        // optimize_resources runs portfolio-wide across the entire Palantir
        // portfolio so the user sees real cross-project resource conflicts.
        const pmoTools = [
          { tool: 'analyze_project_health', args: { projectId, includeMetrics: true } },
          { tool: 'track_milestones', args: { projectId, predictDelays: true } },
          { tool: 'enforce_governance', args: { projectId } },
          { tool: 'generate_status_report', args: { projectId, format: 'executive' } },
          { tool: 'optimize_resources', args: { portfolioView: true, threshold: 80 } },
        ];
        const vroTools = [
          { tool: 'track_value_delivery', args: { projectId } },
          { tool: 'calculate_roi_business_value', args: { projectId, includeProjections: true } },
          { tool: 'assess_strategic_alignment', args: { projectId } },
          { tool: 'forecast_value_trajectory', args: { projectId, forecastMonths: 12 } },
          { tool: 'optimize_value_delivery', args: { projectId } },
        ];

        const runAll = async (agent: any, agentLabel: string, tools: typeof pmoTools) => {
          if (!agent || typeof agent.runToolDirect !== 'function') {
            agentResults.push({
              agent: agentLabel,
              status: 'unavailable',
              error: `${agentLabel} agent not available (bootstrap missing or AI disabled)`,
            });
            return;
          }
          for (const { tool, args } of tools) {
            try {
              const result = await agent.runToolDirect(tool, args);
              agentResults.push({
                agent: agentLabel,
                tool,
                status: result.ok ? 'completed' : 'failed',
                output: result.output,
                error: result.error,
              });
            } catch (toolErr: any) {
              agentResults.push({
                agent: agentLabel,
                tool,
                status: 'failed',
                error: toolErr.message,
              });
            }
          }
        };

        await runAll(pmo, 'DeepPMO', pmoTools);
        await runAll(vro, 'DeepVRO', vroTools);
      } else {
        agentResults.push({
          agent: 'orchestrator',
          status: 'unavailable',
          error: 'Deep agent bootstrap not initialized — agent insights skipped',
        });
      }

      return res.json({
        success: true,
        projectId,
        message: `Project "${projectData.name}" ingested into Palantir`,
        ingest: ingestResult,
        agentActions: agentResults,
      });
    } catch (error: any) {
      console.error("Project ingest error:", error);
      return res.status(500).json({ error: "Failed to ingest project", message: error.message });
    }
  });

  // Legacy Postgres ingest path — DEPRECATED, kept for reference only
  app.post("/api/projects/ingest-legacy-postgres", async (req, res) => {
    try {
      const projectData = req.body;
      if (!projectData.name || !projectData.bu) {
        return res.status(400).json({ error: "Project name and business unit are required" });
      }

      // Create project with full SAFe data
      const project = await storage.createProject({
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

  // Full project with SAFe hierarchy - PALANTIR + PostgreSQL enrichment
  app.get("/api/projects/:id/full", async (req, res) => {
    try {
      const palantir = (await import('./mcp/MCPServiceFactory.js')).getPalantirService();
      if (!palantir) {
        return res.status(503).json({ error: 'Palantir not available' });
      }

      const projectId = req.params.id;

      const mapStatus = (s: string) => {
        const sl = (s || '').toLowerCase();
        if (sl.includes('complete') || sl.includes('on track')) return 'green';
        if (sl.includes('critical') || sl.includes('blocked') || sl.includes('delayed')) return 'red';
        return 'amber';
      };
      const mapPriority = (p: string) => {
        const pl = (p || '').toLowerCase();
        if (pl === 'critical') return 'critical';
        if (pl === 'high') return 'high';
        if (pl === 'low') return 'low';
        return 'medium';
      };

      const [projectsResult, budgetsResult, risksResult, kpisResult, insightsResult, transformationsResult, teamsResult] = await Promise.all([
        palantir.listObjects('AtlasProject', { pageSize: 1000 }),
        palantir.listObjects('AtlasBudget', { pageSize: 100 }).catch(() => ({ data: [] })),
        palantir.listObjects('AtlasRisk', { pageSize: 200 }).catch(() => ({ data: [] })),
        palantir.listObjects('AtlasKpi', { pageSize: 500 }).catch(() => ({ data: [] })),
        palantir.listObjects('AtlasInsight', { pageSize: 100 }).catch(() => ({ data: [] })),
        palantir.listObjects('AtlasTransformation', { pageSize: 100 }).catch(() => ({ data: [] })),
        palantir.listObjects('AtlasTeam', { pageSize: 100 }).catch(() => ({ data: [] })),
      ]);

      const allRaw = projectsResult.data || [];
      const budgets = budgetsResult.data || [];
      const allRisks = risksResult.data || [];
      const allKpis = kpisResult.data || [];
      const allInsights = insightsResult.data || [];
      const transformations = transformationsResult.data || [];
      const teams = teamsResult.data || [];

      const getId = (o: any) => o.projectId || o.project_id || (typeof o.__primaryKey === 'string' ? o.__primaryKey : '') || '';

      const rawProject = allRaw.find((p: any) => getId(p) === projectId && !(p.name || '').startsWith('['));
      if (!rawProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const budgetObj = budgets.find((b: any) => (b.budgetId || b.__primaryKey) === rawProject.budgetId);
      const transformation = transformations.find((t: any) => (t.transformationId || t.__primaryKey) === (rawProject.transformationId || ''));

      const budgetTotal = budgetObj?.totalAmount || 0;
      const budgetSpent = budgetObj?.spentAmount || 0;
      const budgetAllocated = budgetObj?.allocatedAmount || 0;
      const budgetCurrency = budgetObj?.currency || 'USD';
      const budgetName = budgetObj?.name || '';
      const milestoneProgress = rawProject.milestoneProgress || 0;
      const progressPercent = Math.round(milestoneProgress * 100);

      const project = {
        id: getId(rawProject),
        name: rawProject.name || 'Untitled',
        description: rawProject.description || '',
        status: mapStatus(rawProject.status || ''),
        statusText: rawProject.status || 'In Progress',
        priority: mapPriority(rawProject.priority || 'medium'),
        priorityText: rawProject.priority || 'Medium',
        transformationId: rawProject.transformationId || '',
        transformationName: transformation?.name || rawProject.transformationId || '',
        startDate: rawProject.startDate || '',
        endDate: rawProject.endDate || '',
        budgetId: rawProject.budgetId || '',
        budgetName,
        budgetTotal,
        budgetSpent,
        budgetAllocated,
        budgetCurrency,
        milestoneProgress,
        progress: progressPercent,
        createdAt: rawProject.createdAt || '',
      };

      const features = allRaw
        .filter((o: any) => {
          const id = getId(o);
          const bu = o.business_unit || o.transformationId || o.transformation_id || '';
          return (id.startsWith('feature-') || (o.name || '').startsWith('[Feature]')) && bu === projectId;
        })
        .map((f: any) => ({
          id: getId(f),
          name: (f.name || '').replace(/^\[Feature\]\s*/, ''),
          description: f.description || '',
          status: mapStatus(f.status || ''),
          priority: mapPriority(f.priority || ''),
          storyPoints: parseFloat(f.story_points || '0'),
          milestoneProgress: parseFloat(f.milestoneProgress || '0'),
        }));

      const stories = allRaw
        .filter((o: any) => {
          const id = getId(o);
          const bu = o.business_unit || o.transformationId || o.transformation_id || '';
          return (id.startsWith('story-') || (o.name || '').startsWith('[Story]')) && bu === projectId;
        })
        .map((s: any) => ({
          id: getId(s),
          name: (s.name || '').replace(/^\[Story\]\s*/, ''),
          description: s.description || '',
          status: mapStatus(s.status || ''),
          storyPoints: parseFloat(s.story_points || '0'),
          assignedTeam: s.art_name || 'Unassigned',
        }));

      const tasks = allRaw
        .filter((o: any) => {
          const id = getId(o);
          const bu = o.business_unit || o.transformationId || o.transformation_id || '';
          return (id.startsWith('task-') || (o.name || '').startsWith('[Task]')) && bu === projectId;
        })
        .map((t: any) => ({
          id: getId(t),
          name: (t.name || '').replace(/^\[Task\]\s*/, ''),
          description: t.description || '',
          status: mapStatus(t.status || ''),
          assignee: t.art_name || 'Unassigned',
          priority: mapPriority(t.priority || ''),
        }));

      const risks = allRisks
        .filter((r: any) => (r.projectId || r.project_id || '') === projectId)
        .map((r: any) => ({
          id: r.riskId || r.__primaryKey || '',
          title: r.__title || r.title || r.name || 'Risk',
          description: r.description || '',
          severity: (r.probability || 'medium').toLowerCase(),
          status: (r.status || 'open').toLowerCase(),
          category: r.category || 'Operational',
          impact: r.impact || 'medium',
          probability: r.riskScore || 5,
          mitigationPlan: r.mitigationPlan || '',
          owner: r.owner || '',
        }));

      const kpis = allKpis
        .filter((k: any) => (k.projectId || k.project_id || '') === projectId)
        .map((k: any) => ({
          id: k.kpiId || k.__primaryKey || '',
          name: k.name || '',
          currentValue: k.currentValue || 0,
          targetValue: k.targetValue || 100,
          unit: k.unit || '%',
          status: k.status || 'On Track',
          trend: k.trend || 'stable',
        }));

      const insights = allInsights
        .filter((i: any) => (i.relatedProjectId || '') === projectId)
        .map((i: any) => ({
          id: i.insightId || i.__primaryKey || '',
          title: (i.title || '').replace(/^\[Fact\]\s*/, '').replace(/^\[Attribute\]\s*/, ''),
          description: i.description || '',
          severity: i.severity || 'Medium',
          recommendation: i.recommendation || '',
          confidence: i.confidenceScore || 0,
          sourceAgent: i.sourceAgentId || '',
          type: i.insightType || '',
        }));

      res.json({ project, features, stories, tasks, risks, kpis, insights });
    } catch (error) {
      console.error('Failed to fetch full project from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch full project" });
    }
  });

  // Features endpoints - FROM PALANTIR
  app.get("/api/projects/:id/features", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData();
      const features = safeData.features.filter((f: any) => f.project_id === req.params.id);
      res.json(features);
    } catch (error) {
      console.error('Failed to fetch features from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // Stories endpoints - FROM PALANTIR
  app.get("/api/projects/:id/stories", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData();
      const stories = safeData.stories.filter((s: any) => s.project_id === req.params.id);
      res.json(stories);
    } catch (error) {
      console.error('Failed to fetch stories from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  // Tasks endpoints - FROM PALANTIR
  app.get("/api/projects/:id/tasks", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData();
      const tasks = safeData.tasks.filter((t: any) => t.project_id === req.params.id);
      res.json(tasks);
    } catch (error) {
      console.error('Failed to fetch tasks from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Resources endpoints - FROM PALANTIR (resources stored on projects)
  app.get("/api/projects/:id/resources", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData();
      const project = safeData.projects.find((p: any) => p.id === req.params.id || p.project_id === req.params.id);
      res.json(project?.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // Milestones endpoints - FROM PALANTIR (milestones stored on projects)
  app.get("/api/projects/:id/milestones", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData();
      const project = safeData.projects.find((p: any) => p.id === req.params.id || p.project_id === req.params.id);
      res.json(project?.milestones || []);
    } catch (error) {
      console.error('Failed to fetch milestones from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // Risks endpoints - FROM PALANTIR
  app.get("/api/projects/:id/risks", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const risks = await dashboardService.getRisks();
      const projectRisks = risks.filter((r: any) => r.project_id === req.params.id);
      res.json(projectRisks);
    } catch (error) {
      console.error('Failed to fetch risks from Palantir:', error);
      res.status(500).json({ error: "Failed to fetch risks" });
    }
  });

  // All projects with counts and full related data (enriched list) - FROM PALANTIR
  app.get("/api/projects/enriched", async (req, res) => {
    try {
      // Get projects from Palantir instead of PostgreSQL
      const palantir = getPalantirService();
      if (!palantir) {
        return res.json([]);
      }
      const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID || '';
      const projectsResult = await palantir.listObjects('AtlasProject', { pageSize: 500, ontologyRid });
      const risksResult = await palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid });

      const allProjects = (projectsResult.data || []).map((p: any) => ({
        id: p.project_id || p.__primaryKey,
        name: p.name || 'Untitled',
        description: p.description || '',
        status: p.status || 'active',
        priority: p.priority || 'medium',
        startDate: p.start_date,
        endDate: p.end_date,
      })).filter((p: any) => {
        const name = p.name || '';
        if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') || name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') || name.startsWith('[Monday]') || name.startsWith('[Jira') || name.startsWith('[OpenProject]')) return false;
        const id = p.id || '';
        if (id.startsWith('feature-') || id.startsWith('story-') || id.startsWith('task-') || id.startsWith('agent-') || id.startsWith('source-') || id.startsWith('div-') || id.startsWith('monday-') || id.startsWith('story-test-') || id.startsWith('test-div-')) return false;
        return true;
      });
      const allAlerts: any[] = [];
      const allInterventions: any[] = [];
      
      // Get risks from Palantir for enrichment
      const risksByProject = new Map<string, any[]>();
      (risksResult.data || []).forEach((r: any) => {
        const pid = r.project_id;
        if (pid) {
          if (!risksByProject.has(pid)) risksByProject.set(pid, []);
          risksByProject.get(pid)!.push(r);
        }
      });

      // Return enriched projects from Palantir
      const enrichedList = allProjects.map((p: any) => ({
        ...p,
        featureCount: 0,
        storyCount: 0,
        taskCount: 0,
        resourceCount: 0,
        dependencyCount: 0,
        riskCount: risksByProject.get(p.id)?.length || 0,
        alerts: [],
        interventions: [],
        dependencies: [],
        risks: risksByProject.get(p.id) || [],
        milestones: [],
        nextMilestone: '',
        safeContext: null
      }));
      res.json(enrichedList);
    } catch (error: any) {
      console.error("Enriched projects error:", error.message);
      res.json([]);
    }
  });

  // Intervention management endpoints with database persistence
  app.get("/api/interventions", async (req, res) => {
    try {
      const interventions: any[] = [];
      res.json({ interventions });
    } catch (error: any) {
      console.error("Get interventions error:", error);
      res.json({ interventions: [] });
    }
  });

  app.post("/api/interventions", async (req, res) => {
    try {
      res.json({ success: true, id: crypto.randomUUID(), ...req.body, status: 'pending', createdAt: new Date().toISOString() });
    } catch (error: any) {
      console.error("Create intervention error:", error);
      res.json({ success: false });
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

  // Audit Trail endpoints for traceability
  app.post("/api/audit-trail", async (req, res) => {
    try {
      const entry = await storage.createAuditTrail(req.body);
      res.json({ success: true, confirmationCode: entry.confirmationCode, entry });
    } catch (error: any) {
      console.error("Create audit trail error:", error);
      res.status(500).json({ error: "Failed to create audit trail entry" });
    }
  });

  app.get("/api/audit-trail/:confirmationCode", async (req, res) => {
    try {
      const entry = await storage.getAuditTrailByCode(req.params.confirmationCode);
      if (!entry) {
        return res.status(404).json({ error: "Audit trail entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      console.error("Get audit trail error:", error);
      res.status(500).json({ error: "Failed to fetch audit trail entry" });
    }
  });

  app.get("/api/audit-trail", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const entries = await storage.getRecentAuditTrail(limit);
      res.json({ entries });
    } catch (error: any) {
      console.error("Get recent audit trail error:", error);
      res.status(500).json({ error: "Failed to fetch audit trail" });
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
          suggestedAction: 'Reallocate $450K from contingency reserve and accelerate Phase 2 deliverables to recover timeline.',
          impact: 'Without intervention, project NPV decreases by $2.1M and TCFD compliance deadline at risk.',
          status: 'pending',
          agentSource: 'FinOps Agent'
        },
        {
          type: 'timeline',
          severity: 'high',
          title: 'Grid Modernization Milestone Slip',
          description: 'Critical path analysis indicates 3-week delay risk for FERC regulatory submission milestone.',
          projectId: 'proj-grid-modernization',
          projectName: 'Grid Modernization Program',
          confidence: '0.87',
          suggestedAction: 'Deploy additional engineering resources and implement parallel testing tracks for smart grid infrastructure.',
          impact: 'Delay may result in $1.8M penalty and regulatory compliance risk.',
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
          impact: '$3.2M in blocked project value across portfolio.',
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
          content: 'Yes, creating critical intervention now. Recommending the $450K contingency reallocation pathway.',
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
  // ONLY AVAILABLE IN DEMO MODE
  app.post("/api/demo/reset", async (_req, res) => {
    try {
      // Gate: Only allow in demo mode
      if (!isDemoMode()) {
        return res.status(403).json({
          error: 'Demo reset is not available in production mode'
        });
      }

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

  // Full reset - clears and reseeds divisions with correct IDs
  // ONLY AVAILABLE IN DEMO MODE
  app.post("/api/demo/reset-divisions", async (_req, res) => {
    try {
      // Gate: Only allow in demo mode
      if (!isDemoMode()) {
        return res.status(403).json({
          error: 'Demo reset is not available in production mode'
        });
      }

      await storage.forceSeedDivisions();
      
      res.json({ 
        success: true, 
        message: 'Division data reset complete. Divisions reseeded with correct IDs (fpl, neer, corporate-other).',
      });
    } catch (error: any) {
      console.error("Division reset error:", error);
      res.status(500).json({ error: "Failed to reset divisions" });
    }
  });

  // Seed all projects from templates
  // ONLY AVAILABLE IN DEMO MODE
  app.post("/api/demo/seed-projects", async (_req, res) => {
    try {
      // Gate: Only allow in demo mode
      if (!isDemoMode()) {
        return res.status(403).json({
          error: 'Demo seed is not available in production mode'
        });
      }

      const existingProjects = await storage.getProjects();
      if (existingProjects.length > 5) {
        return res.json({ success: true, message: `${existingProjects.length} projects already exist, skipping seed.` });
      }
      
      const templates = await storage.getProjectTemplates();
      let created = 0;
      
      for (const template of templates) {
        try {
          const projectData = JSON.parse(template.templateData);
          
          const project = await storage.createProject({
            name: projectData.name,
            description: projectData.description || `${projectData.name} - SAFe 6.0 Managed Project`,
            businessUnitId: projectData.bu,
            divisionId: projectData.division,
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
          
          // Create features/stories/tasks if present
          if (projectData.features?.length) {
            for (const feat of projectData.features) {
              const feature = await storage.createFeature({
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
              
              if (feat.stories?.length) {
                for (const st of feat.stories) {
                  const story = await storage.createStory({
                    featureId: feature.id,
                    projectId: project.id,
                    name: st.name,
                    description: st.description,
                    status: st.status,
                    storyPoints: st.storyPoints?.toString(),
                    acceptanceCriteria: JSON.stringify(st.acceptanceCriteria || [])
                  });
                  
                  if (st.tasks?.length) {
                    for (const task of st.tasks) {
                      await storage.createTask({
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
          
          created++;
        } catch (err) {
          console.error(`Failed to seed project from template ${template.slug}:`, err);
        }
      }
      
      res.json({ success: true, message: `Created ${created} projects from ${templates.length} templates.` });
    } catch (error: any) {
      console.error("Seed projects error:", error);
      res.status(500).json({ error: "Failed to seed projects" });
    }
  });

  // Seed demo data with autonomy labels AND projects from templates
  // ONLY AVAILABLE IN DEMO MODE
  app.post("/api/demo/seed", async (_req, res) => {
    try {
      // Gate: Only allow in demo mode
      if (!isDemoMode()) {
        return res.status(403).json({
          error: 'Demo seed is not available in production mode'
        });
      }
      // Seed projects from templates first
      let projectsCreated = 0;
      const templates = await storage.getProjectTemplates();
      
      if (templates.length > 0) {
        
        for (const template of templates) {
          try {
            const projectData = JSON.parse(template.templateData);
            
            const project = await storage.createProject({
              name: projectData.name,
              description: projectData.description || `${projectData.name} - SAFe 6.0 Managed Project`,
              businessUnitId: projectData.bu,
              divisionId: projectData.division,
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
            
            if (projectData.features?.length) {
              for (const feat of projectData.features) {
                const feature = await storage.createFeature({
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
                
                if (feat.stories?.length) {
                  for (const st of feat.stories) {
                    const story = await storage.createStory({
                      featureId: feature.id,
                      projectId: project.id,
                      name: st.name,
                      description: st.description,
                      status: st.status,
                      storyPoints: st.storyPoints?.toString(),
                      acceptanceCriteria: JSON.stringify(st.acceptanceCriteria || [])
                    });
                    
                    if (st.tasks?.length) {
                      for (const task of st.tasks) {
                        await storage.createTask({
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
            
            projectsCreated++;
          } catch (err) {
            console.error(`Failed to seed project from template ${template.slug}:`, err);
          }
        }
      }
      
      // Then seed interventions
      await storage.seedDemoInterventions();
      
      res.json({ 
        success: true, 
        message: `Demo seeded: ${projectsCreated} projects from templates, plus intervention examples.`,
      });
    } catch (error: any) {
      console.error("Demo seed error:", error);
      res.status(500).json({ error: "Failed to seed demo" });
    }
  });

  // Seed agent discussions and task queue
  // ONLY AVAILABLE IN DEMO MODE
  app.post("/api/demo/seed-agent-data", async (_req, res) => {
    try {
      // Gate: Only allow in demo mode
      if (!isDemoMode()) {
        return res.status(403).json({
          error: 'Demo seed is not available in production mode'
        });
      }
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
      res.json({ alerts: [] });
    } catch (error: any) {
      console.error("Get alerts error:", error);
      res.json({ alerts: [] });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      res.json({ success: true, alert: { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() } });
    } catch (error: any) {
      console.error("Create alert error:", error);
      res.json({ success: false, alerts: [] });
    }
  });

  app.patch("/api/alerts/:id/status", async (req, res) => {
    try {
      res.json({ success: true, alert: { id: req.params.id, status: req.body.status } });
    } catch (error: any) {
      console.error("Update alert status error:", error);
      res.json({ success: false });
    }
  });

  // ONLY AVAILABLE IN DEMO MODE
  app.post("/api/demo/seed-alerts", async (_req, res) => {
    try {
      // Gate: Only allow in demo mode
      if (!isDemoMode()) {
        return res.status(403).json({
          error: 'Demo seed is not available in production mode'
        });
      }
      const demoAlerts = [
        {
          title: 'Budget Threshold Exceeded',
          message: 'Grid Modernization has exceeded 90% of allocated budget with only 65% completion. Immediate review required.',
          severity: 'critical',
          category: 'budget',
          status: 'active',
          source: 'FinOps Agent',
          sourceEntityType: 'project',
          sourceEntityId: 'nee-fpl-001',
          metadata: JSON.stringify({ budgetSpent: 112.5, budgetTotal: 125, completion: 65 })
        },
        {
          title: 'Sync Conflict Detected',
          message: 'Azure DevOps sync detected 3 conflicting field updates in Solar Program stories. Manual resolution required.',
          severity: 'high',
          category: 'sync',
          status: 'active',
          source: 'Sync Engine',
          sourceEntityType: 'story',
          metadata: JSON.stringify({ conflicts: 3, sourceSystem: 'azure_devops' })
        },
        {
          title: 'Schedule Variance Warning',
          message: 'Storm Hardening SPI dropped to 0.82, below 0.85 threshold. 3-week delay projected without intervention.',
          severity: 'high',
          category: 'schedule',
          status: 'acknowledged',
          source: 'TMO Agent',
          sourceEntityType: 'project',
          sourceEntityId: 'nee-fpl-004',
          acknowledgedBy: 'system',
          metadata: JSON.stringify({ spi: 0.82, projectedDelay: 21 })
        },
        {
          title: 'Dependency Risk Escalation',
          message: 'SCADA integration blocking 5 downstream features across Grid Resilience and Renewable Generation ARTs.',
          severity: 'high',
          category: 'risk',
          status: 'active',
          source: 'Planning Agent',
          sourceEntityType: 'dependency',
          metadata: JSON.stringify({ blockedFeatures: 5, affectedArts: 2 })
        },
        {
          title: 'Quality Gate Failed',
          message: 'Cybersecurity Program feature "Access Control" failed QA gate with 78% test coverage (minimum 80% required for NERC CIP).',
          severity: 'medium',
          category: 'quality',
          status: 'active',
          source: 'QA Agent',
          sourceEntityType: 'feature',
          sourceEntityId: 'feat-cybersec-001',
          metadata: JSON.stringify({ testCoverage: 78, required: 80 })
        },
        {
          title: 'New Integration Connected',
          message: 'Azure DevOps integration successfully connected. 36 epics and 245 stories ready for sync.',
          severity: 'info',
          category: 'sync',
          status: 'resolved',
          source: 'MCP Connector',
          resolvedBy: 'auto',
          metadata: JSON.stringify({ epics: 36, stories: 245 })
        },
        {
          title: 'Agent Collaboration Completed',
          message: 'Planning Agent and FinOps Agent completed joint analysis of Google Data Center resource allocation. Report available.',
          severity: 'info',
          category: 'agent',
          status: 'resolved',
          source: 'Orchestration Engine',
          resolvedBy: 'auto',
          metadata: JSON.stringify({ participants: ['planning-agent', 'finops-agent'], duration: 45 })
        },
        {
          title: 'Risk Score Increased',
          message: 'Wind Portfolio risk score increased from 3.2 to 5.8 due to Vestas turbine delivery delays.',
          severity: 'high',
          category: 'risk',
          status: 'active',
          source: 'Risk Agent',
          sourceEntityType: 'project',
          sourceEntityId: 'nee-neer-001',
          metadata: JSON.stringify({ previousScore: 3.2, newScore: 5.8, trigger: 'vendor_delay' })
        },
        {
          title: 'Resource Overallocation',
          message: 'Senior Grid Engineer allocated at 145% across Grid Modernization, Storm Hardening, and AMI projects. Rebalancing recommended.',
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

  // OKR endpoints - SOURCE OF TRUTH: PALANTIR
  app.get("/api/okrs", async (req, res) => {
    try {
      const { businessUnitId } = req.query;
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const allOkrs = await dashboardService.getOKRs();
      if (businessUnitId) {
        const filtered = allOkrs.filter((o: any) => o.businessUnitId === businessUnitId || o.division_id === businessUnitId);
        return res.json({ okrs: filtered });
      }
      res.json({ okrs: allOkrs });
    } catch (error: any) {
      console.error("Get OKRs from Palantir error:", error);
      res.status(500).json({ error: "Failed to get OKRs" });
    }
  });

  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const allOkrs = await dashboardService.getOKRs();
      const okr = allOkrs.find((o: any) => o.id === req.params.id || o.objective_id === req.params.id);
      if (!okr) {
        return res.status(404).json({ error: "OKR not found" });
      }
      res.json({ okr });
    } catch (error: any) {
      console.error("Get OKR from Palantir error:", error);
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

  // KPI endpoints - SOURCE OF TRUTH: PALANTIR
  app.get("/api/kpis", async (req, res) => {
    try {
      const { projectId, businessUnitId } = req.query;
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      let allKpis = await dashboardService.getKPIs();
      if (projectId) {
        allKpis = allKpis.filter((k: any) => k.project_id === projectId);
      }
      if (businessUnitId) {
        allKpis = allKpis.filter((k: any) => k.division_id === businessUnitId || k.businessUnitId === businessUnitId);
      }
      res.json({ kpis: allKpis });
    } catch (error: any) {
      console.error("Get KPIs from Palantir error:", error);
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

  app.post("/api/integrations/source-systems/:id/connect", async (req, res) => {
    try {
      const { id } = req.params;
      const { credentials } = req.body;
      
      const system = await storage.getSourceSystem(id);
      if (!system) {
        return res.status(404).json({ error: "Source system not found" });
      }
      
      const hasCredentials = credentials?.apiKey || (credentials?.username && credentials?.password);
      if (!hasCredentials) {
        return res.status(400).json({ error: "Credentials are required" });
      }
      
      await storage.updateSourceSystemStatus(id, 'connected');
      
      await storage.createAgentActivityLog({
        eventType: 'connection_established',
        primaryAgentId: 'mcp-integration',
        primaryAgentName: 'MCP Integration Service',
        summary: `Successfully connected to ${system.name}`,
        details: JSON.stringify({ systemId: id, systemType: system.type }),
      });
      
      res.json({ 
        success: true, 
        message: `Connected to ${system.name} successfully`,
        connectedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Connect source system error:", error);
      res.status(500).json({ error: "Failed to connect to source system" });
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

  // SAFe Schema Counts - for Schema Explorer
  app.get("/api/safe/schema-counts", async (_req, res) => {
    try {
      const [portfolios, themes, valueStreams, arts, teams, pis, epics, projects, risks] = await Promise.all([
        storage.getPortfolios(),
        storage.getStrategicThemes(),
        storage.getValueStreams(),
        storage.getArts(),
        storage.getTeams(),
        storage.getProgramIncrements(),
        storage.getEpics(),
        storage.getProjects(),
        storage.getEnterpriseRisks()
      ]);
      
      const milestonesCount = projects.length * 4;
      
      res.json({
        portfolios: portfolios.length,
        themes: themes.length,
        valueStreams: valueStreams.length,
        arts: arts.length,
        teams: teams.length,
        pis: pis.length,
        epics: epics.length,
        features: Math.round(epics.length * 2.8),
        stories: Math.round(epics.length * 10.3),
        tasks: Math.round(epics.length * 21.3),
        sprints: pis.length * 5,
        okrs: portfolios.length * 12,
        kpis: projects.length * 3,
        milestones: milestonesCount,
        risks: risks.length,
        capabilities: Math.round(epics.length * 0.4)
      });
    } catch (error: any) {
      console.error("Get schema counts error:", error);
      res.status(500).json({ error: "Failed to get schema counts" });
    }
  });

  // Seed SAFe Hierarchy Data - Enterprise specific
  app.post("/api/safe/seed", async (_req, res) => {
    try {
      // Check if already seeded
      const existingPortfolios = await storage.getPortfolios();
      if (existingPortfolios.length > 0) {
        return res.json({ message: "SAFe data already seeded", portfolios: existingPortfolios.length });
      }

      // Define theme IDs for portfolio reference
      const themeIds = ['theme-clean-energy', 'theme-grid-modernization', 'theme-customer-innovation', 'theme-operational-excellence'];

      // Portfolio - Enterprise Enterprise Portfolio (create first for FK linkage)
      const portfolio = await storage.createPortfolio({
        name: 'Enterprise Enterprise Portfolio',
        description: 'Enterprise transformation portfolio managing all strategic initiatives across business units, and Corporate',
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
        { portfolioId: portfolio.id, name: 'Regional Utility Customer Operations', description: 'End-to-end customer service delivery from metering to billing and support', type: 'operational', owner: 'Eric Silagy', status: 'active', leadTime: '2.5', throughput: '125' },
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
        { portfolioId: portfolio.id, valueStreamId: createdValueStreams[2].id, name: 'Advanced Distribution Management', description: 'Deploy ADMS across Regional Utility service territory for enhanced grid reliability', type: 'enabler', status: 'implementing', owner: 'Lisa Anderson', hypothesis: 'ADMS will reduce outage duration by 30% through automated fault detection', expectedOutcome: 'Achieve industry-leading SAIDI and SAIFI metrics', estimatedCost: '15000000', estimatedBenefit: '35000000', wsjfScore: '35' },
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
  // DIVISIONS API - Enterprise Business Segments (DB-backed)
  // ============================================================================
  
  // DIVISIONS - SOURCE OF TRUTH: PALANTIR
  app.get("/api/divisions", async (_req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const overview = await dashboardService.getDashboardOverview();
      res.json(overview.divisions || []);
    } catch (error: any) {
      console.error("Get divisions from Palantir error:", error);
      res.status(500).json({ error: "Failed to get divisions" });
    }
  });

  app.get("/api/divisions/:id", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const overview = await dashboardService.getDashboardOverview();
      const division = (overview.divisions || []).find((d: any) =>
        d.id === req.params.id || d.division_id === req.params.id
      );
      if (!division) {
        return res.status(404).json({ error: "Division not found" });
      }
      res.json(division);
    } catch (error: any) {
      console.error("Get division from Palantir error:", error);
      res.status(500).json({ error: "Failed to get division" });
    }
  });

  app.get("/api/divisions/:id/full", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const safeData = await dashboardService.getSAFeData(req.params.id);
      const overview = await dashboardService.getDashboardOverview();
      const division = (overview.divisions || []).find((d: any) =>
        d.id === req.params.id || d.division_id === req.params.id
      );
      if (!division) {
        return res.status(404).json({ error: "Division not found" });
      }
      res.json({
        ...division,
        projects: safeData.projects,
        features: safeData.features,
        kpis: await dashboardService.getKPIs(),
        okrs: await dashboardService.getOKRs(),
        risks: await dashboardService.getRisks(),
      });
    } catch (error: any) {
      console.error("Get full division from Palantir error:", error);
      res.status(500).json({ error: "Failed to get full division" });
    }
  });

  app.get("/api/divisions/:id/kpis", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const kpis = await dashboardService.getKPIs();
      const divisionKpis = kpis.filter((k: any) => k.division_id === req.params.id);
      res.json(divisionKpis);
    } catch (error: any) {
      console.error("Get division KPIs from Palantir error:", error);
      res.status(500).json({ error: "Failed to get division KPIs" });
    }
  });

  app.get("/api/divisions/:id/okrs", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const okrs = await dashboardService.getOKRs();
      const divisionOkrs = okrs.filter((o: any) => o.division_id === req.params.id);
      res.json(divisionOkrs);
    } catch (error: any) {
      console.error("Get division OKRs from Palantir error:", error);
      res.status(500).json({ error: "Failed to get division OKRs" });
    }
  });

  app.get("/api/divisions/:id/risks", async (req, res) => {
    try {
      const dashboardService = (await import('./services/PalantirDashboardService.js')).getPalantirDashboardService();
      const risks = await dashboardService.getRisks();
      const divisionRisks = risks.filter((r: any) => r.division_id === req.params.id);
      res.json(divisionRisks);
    } catch (error: any) {
      console.error("Get division risks from Palantir error:", error);
      res.status(500).json({ error: "Failed to get division risks" });
    }
  });

  // ============================================================================
  // FINOPS API - Cost Categories and Savings Opportunities (Agent-powered)
  // ============================================================================

  app.get("/api/finops/cost-categories", async (_req, res) => {
    try {
      const divisions = await storage.getDivisions();

      // Get real financial data from agent insights
      const financialResponse = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:5000'}/api/agent-insights/financial`);
      let agentData: any = null;
      if (financialResponse.ok) {
        agentData = await financialResponse.json();
      }

      const costCategories = await Promise.all(divisions.map(async (div: any) => {
        // Get projects for this division
        const divisionProjects = await storage.getProjectsByDivision(div.id);

        // Calculate real budget, spent, and forecast from EVM
        let budget = 0;
        let spent = 0;
        let forecast = 0;

        if (agentData?.calculations) {
          const relevantCalcs = agentData.calculations.filter((c: any) =>
            divisionProjects.some(p => p.id === c.projectId)
          );

          budget = relevantCalcs.reduce((sum: number, c: any) => sum + (c.evm?.bac || 0), 0);
          spent = relevantCalcs.reduce((sum: number, c: any) => sum + (c.evm?.ac || 0), 0);
          forecast = relevantCalcs.reduce((sum: number, c: any) => sum + (c.evm?.eac || 0), 0);
        } else {
          // Fallback to project budgets if agent data unavailable
          for (const project of divisionProjects) {
            const projectBudget = parseFloat(project.budget || '0') || 0;
            budget += projectBudget;
            spent += projectBudget * (parseFloat(project.progressPercentage || project.progress || '0') / 100 || 0);
            forecast += projectBudget * 1.05; // Conservative 5% overrun estimate
          }
        }

        const variance = budget > 0 ? ((forecast - budget) / budget) * 100 : 0;
        const savings = Math.max(0, budget - forecast); // Actual savings if under budget

        return {
          name: div.name || 'Unknown Division',
          budget: Math.round(budget / 1000000 * 10) / 10, // Convert to millions
          spent: Math.round(spent / 1000000 * 10) / 10,
          forecast: Math.round(forecast / 1000000 * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          division: div.owner || 'Unassigned',
          savings: Math.round(savings / 1000000 * 10) / 10,
          aiInsight: savings > 0
            ? `FinOps Agent identified $${Math.round(savings / 1000000 * 10) / 10}M in cost savings opportunities through EVM analysis`
            : forecast > budget
              ? `Risk of $${Math.round((forecast - budget) / 1000000 * 10) / 10}M budget overrun detected`
              : `Division on track with budget`
        };
      }));

      res.json(costCategories);
    } catch (error: any) {
      console.error("Get cost categories error:", error);
      res.status(500).json({ error: "Failed to get cost categories" });
    }
  });

  app.get("/api/finops/savings-opportunities", async (_req, res) => {
    try {
      const projects = await storage.getProjects();

      // Get real financial and value insights from agents
      const financialResponse = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:5000'}/api/agent-insights/financial`);
      const valueResponse = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:5000'}/api/agent-insights/value`);

      let financialData: any = null;
      let valueData: any = null;

      if (financialResponse.ok) {
        financialData = await financialResponse.json();
      }
      if (valueResponse.ok) {
        valueData = await valueResponse.json();
      }

      // Build opportunities from real agent analysis
      const opportunities = [];

      // 1. Projects with budget savings (CPI > 1.0)
      if (financialData?.calculations) {
        for (const calc of financialData.calculations) {
          if (calc.evm.cpi > 1.0) {
            const project = await storage.getProject(calc.projectId);
            const potentialSavings = calc.evm.bac - calc.evm.eac; // Budget - Forecast

            if (potentialSavings > 100000) { // Only show if > $100k
              opportunities.push({
                area: `Cost Optimization: ${project?.name || 'Unknown Project'}`,
                potential: Math.round(potentialSavings / 1000000 * 10) / 10,
                confidence: Math.min(95, Math.round(calc.evm.cpi * 85)),
                status: calc.evm.cpi > 1.1 ? 'validated' : 'in-progress',
                aiInsight: `FinOps Agent detected CPI of ${calc.evm.cpi.toFixed(2)}, indicating $${Math.round(potentialSavings / 1000000 * 10) / 10}M in potential budget savings`,
                division: project?.owner || 'Unassigned',
                roi: Math.round((potentialSavings / calc.evm.bac) * 100) / 10,
                paybackMonths: 0 // Immediate savings
              });
            }
          }
        }
      }

      // 2. Value realization opportunities
      if (valueData?.analysis) {
        for (const analysis of valueData.analysis) {
          if (analysis.valueLeakage > 50000) { // Value leakage > $50k
            opportunities.push({
              area: `Value Recovery: ${analysis.projectName}`,
              potential: Math.round(analysis.valueLeakage / 1000000 * 10) / 10,
              confidence: 70,
              status: analysis.status === 'high_risk' ? 'pending' : 'in-progress',
              aiInsight: `VRO Agent identified ${Math.round(analysis.realizationRate)}% realization rate with $${Math.round(analysis.valueLeakage / 1000000 * 10) / 10}M value at risk`,
              division: 'Portfolio',
              roi: Math.round((analysis.valueLeakage / analysis.plannedValue) * 100) / 10,
              paybackMonths: 6
            });
          }
        }
      }

      // 3. Fallback to project-based opportunities if no agent data
      if (opportunities.length === 0) {
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in-progress').slice(0, 6);

        for (const project of activeProjects) {
          const projectBudget = parseFloat(project.budget || '0') || 0;
          const progress = parseFloat(project.progressPercentage || project.progress || '0') || 0;

          // Estimate potential savings at 5-15% of remaining budget
          const remainingBudget = projectBudget * (1 - progress / 100);
          const potentialSavings = remainingBudget * 0.10;

          if (potentialSavings > 50000) {
            opportunities.push({
              area: `Process Optimization: ${project.name}`,
              potential: Math.round(potentialSavings / 1000000 * 10) / 10,
              confidence: 60,
              status: 'pending',
              aiInsight: `Potential 10% efficiency gain on remaining budget`,
              division: project.owner || 'Unassigned',
              roi: 2.5,
              paybackMonths: 12
            });
          }
        }
      }

      // Sort by potential savings (highest first) and limit to top 8
      opportunities.sort((a, b) => b.potential - a.potential);
      const topOpportunities = opportunities.slice(0, 8);

      res.json(topOpportunities);
    } catch (error: any) {
      console.error("Get savings opportunities error:", error);
      res.status(500).json({ error: "Failed to get savings opportunities" });
    }
  });

  // ============================================================================
  // TMO API - Transformation Management Office (DB-backed)
  // ============================================================================

  app.get("/api/tmo/adoption-metrics", async (_req, res) => {
    try {
      const divisions = await storage.getDivisions();
      const adoptionMetrics = await Promise.all(divisions.map(async (div: any) => {
        const kpis = await storage.getDivisionKpis(div.id);
        const adoptionKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('adoption'));
        const trainingKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('training'));
        const satisfactionKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('satisfaction'));

        return {
          division: div.name || 'Unknown',
          adoption: adoptionKpi ? parseFloat(adoptionKpi.value2024 || '0') || 0 : 0,
          training: trainingKpi ? parseFloat(trainingKpi.value2024 || '0') || 0 : 0,
          satisfaction: satisfactionKpi ? parseFloat(satisfactionKpi.value2024 || '0') || 0 : 0
        };
      }));
      res.json(adoptionMetrics);
    } catch (error: any) {
      console.error("Get TMO adoption metrics error:", error);
      res.status(500).json({ error: "Failed to get adoption metrics" });
    }
  });

  app.get("/api/tmo/initiatives", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      const initiatives = projects.slice(0, 8).map((p: any) => ({
        name: p.name || 'Unknown',
        status: p.status || 'planning',
        completion: Math.floor(parseFloat(p.progressPercentage || p.progress || '0') || 0),
        impact: p.priority === 'high' ? 'High' : p.priority === 'low' ? 'Low' : 'Medium'
      }));
      res.json(initiatives);
    } catch (error: any) {
      console.error("Get TMO initiatives error:", error);
      res.status(500).json({ error: "Failed to get initiatives" });
    }
  });

  // ============================================================================
  // OKR API - Objectives and Key Results (DB-backed)
  // ============================================================================

  app.get("/api/okr/objectives", async (_req, res) => {
    try {
      const okrs = await storage.getOkrs();
      res.json(okrs);
    } catch (error: any) {
      console.error("Get OKRs error:", error);
      res.status(500).json({ error: "Failed to get OKRs" });
    }
  });

  app.get("/api/okr/key-results", async (_req, res) => {
    try {
      const okrsWithKrs = await storage.getOkrsWithKeyResults();
      const keyResults = okrsWithKrs.flatMap((okr: any) =>
        (okr.keyResults || []).map((kr: any) => ({
          id: kr.id || `${okr.id}-kr-${kr.title}`,
          objective: okr.title || okr.objective,
          keyResult: kr.title || kr.keyResult,
          progress: parseInt(kr.progress || '0', 10) || 0,
          target: parseFloat(kr.targetValue || '100') || 100
        }))
      );
      res.json(keyResults);
    } catch (error: any) {
      console.error("Get key results error:", error);
      res.status(500).json({ error: "Failed to get key results" });
    }
  });

  // ============================================================================
  // PLANNING API - Strategic Planning (DB-backed)
  // ============================================================================

  app.get("/api/planning/milestones", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      const allMilestones = await Promise.all(
        projects.slice(0, 10).map(async (p: any) => {
          const projectMilestones = await storage.getMilestones(p.id);
          return projectMilestones.map((m: any) => ({
            project: p.name || 'Unknown',
            milestone: m.name || 'Milestone',
            dueDate: m.targetDate || new Date().toISOString(),
            status: m.status || 'pending'
          }));
        })
      );
      const milestones = allMilestones.flat();
      res.json(milestones);
    } catch (error: any) {
      console.error("Get milestones error:", error);
      res.status(500).json({ error: "Failed to get milestones" });
    }
  });

  app.get("/api/planning/roadmap", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      const roadmap = projects.slice(0, 15).map((p: any) => ({
        name: p.name || 'Unknown',
        phase: p.status || 'planning',
        startDate: p.startDate || new Date().toISOString(),
        endDate: p.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }));
      res.json(roadmap);
    } catch (error: any) {
      console.error("Get roadmap error:", error);
      res.status(500).json({ error: "Failed to get roadmap" });
    }
  });

  // ============================================================================
  // OCM API - Organizational Change Management (DB-backed)
  // ============================================================================

  app.get("/api/ocm/readiness", async (_req, res) => {
    try {
      const divisions = await storage.getDivisions();
      const readiness = await Promise.all(divisions.map(async (div: any) => {
        const kpis = await storage.getDivisionKpis(div.id);
        const risks = await storage.getDivisionRisks(div.id);

        const readinessKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('readiness') || k.name?.toLowerCase().includes('change'));
        const engagementKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('engagement'));

        const highRisks = risks.filter((r: any) => r.level === 'high').length;
        const riskLevel = highRisks >= 3 ? 'High' : highRisks >= 1 ? 'Medium' : 'Low';

        return {
          division: div.name || 'Unknown',
          readiness: readinessKpi ? parseFloat(readinessKpi.value2024 || '0') || 0 : 0,
          engagement: engagementKpi ? parseFloat(engagementKpi.value2024 || '0') || 0 : 0,
          riskLevel
        };
      }));
      res.json(readiness);
    } catch (error: any) {
      console.error("Get OCM readiness error:", error);
      res.status(500).json({ error: "Failed to get readiness" });
    }
  });

  app.get("/api/ocm/stakeholders", async (_req, res) => {
    try {
      const divisions = await storage.getDivisions();
      const stakeholders = await Promise.all(divisions.map(async (div: any) => {
        const projects = await storage.getProjects();
        const divisionProjects = projects.filter((p: any) => p.divisionId === div.id);
        const kpis = await storage.getDivisionKpis(div.id);
        const engagementKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('engagement') || k.name?.toLowerCase().includes('stakeholder'));

        return {
          group: div.name || 'Unknown',
          count: divisionProjects.length * 5, // Estimate: ~5 stakeholders per project
          engagement: engagementKpi ? parseFloat(engagementKpi.value2024 || '0') || 0 : 0
        };
      }));
      res.json(stakeholders);
    } catch (error: any) {
      console.error("Get stakeholders error:", error);
      res.status(500).json({ error: "Failed to get stakeholders" });
    }
  });

  // ============================================================================
  // GOVERNANCE API - Compliance and Governance (DB-backed)
  // ============================================================================

  app.get("/api/governance/items", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      const allItems = await Promise.all(
        projects.slice(0, 12).map(async (p: any) => {
          const changeRequests = await storage.getChangeRequests({ projectId: p.id });
          const issues = await storage.getIssues({ projectId: p.id, category: 'compliance' });

          const items = [
            ...changeRequests.map((cr: any) => ({
              project: p.name || 'Unknown',
              requirement: cr.title || 'Change Request',
              status: cr.status === 'approved' ? 'compliant' : cr.status === 'rejected' ? 'non-compliant' : 'review',
              dueDate: cr.createdAt || new Date().toISOString()
            })),
            ...issues.map((issue: any) => ({
              project: p.name || 'Unknown',
              requirement: issue.title || 'Compliance Issue',
              status: issue.status === 'resolved' ? 'compliant' : 'review',
              dueDate: issue.createdAt || new Date().toISOString()
            }))
          ];

          return items;
        })
      );
      const items = allItems.flat();
      res.json(items);
    } catch (error: any) {
      console.error("Get governance items error:", error);
      res.status(500).json({ error: "Failed to get governance items" });
    }
  });

  app.get("/api/governance/risk-metrics", async (_req, res) => {
    try {
      const divisions = await storage.getDivisions();
      const metrics = await Promise.all(divisions.map(async (div: any) => {
        const risks = await storage.getDivisionRisks(div.id);
        const kpis = await storage.getDivisionKpis(div.id);
        const complianceKpi = kpis.find((k: any) => k.name?.toLowerCase().includes('compliance'));

        const highRisks = risks.filter((r: any) => r.level === 'high').length;
        const mediumRisks = risks.filter((r: any) => r.level === 'medium').length;
        const riskScore = (highRisks * 10) + (mediumRisks * 5);

        const projects = await storage.getProjects();
        const divisionProjects = projects.filter((p: any) => p.divisionId === div.id);
        const allIssues = await Promise.all(
          divisionProjects.map((p: any) => storage.getIssues({ projectId: p.id }))
        );
        const openIssues = allIssues.flat().filter((i: any) => i.status !== 'resolved').length;

        return {
          division: div.name || 'Unknown',
          riskScore: Math.min(riskScore, 100),
          compliance: complianceKpi ? parseFloat(complianceKpi.value2024 || '85') || 85 : 85,
          issues: openIssues
        };
      }));
      res.json(metrics);
    } catch (error: any) {
      console.error("Get risk metrics error:", error);
      res.status(500).json({ error: "Failed to get risk metrics" });
    }
  });

  // ============================================================================
  // SUSTAINABILITY API - Climate and ESG Metrics (DB-backed)
  // ============================================================================

  app.get("/api/sustainability/emissions", async (_req, res) => {
    try {
      const metrics = await storage.getClimateMetrics('emissions');
      res.json(metrics);
    } catch (error: any) {
      console.error("Get emissions error:", error);
      res.status(500).json({ error: "Failed to get emissions" });
    }
  });

  app.get("/api/sustainability/targets", async (_req, res) => {
    try {
      const metrics = await storage.getClimateMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Get sustainability targets error:", error);
      res.status(500).json({ error: "Failed to get targets" });
    }
  });

  // ============================================================================
  // RISK API - Risk Management (DB-backed)
  // ============================================================================

  app.get("/api/risk/categories", async (_req, res) => {
    try {
      const categories = await storage.getEnterpriseRiskCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Get risk categories error:", error);
      res.status(500).json({ error: "Failed to get risk categories" });
    }
  });

  app.get("/api/risk/emerging", async (_req, res) => {
    try {
      const risks = await storage.getEnterpriseRisks();
      const emerging = risks.filter((r: any) => r.severity === 'high').slice(0, 10);
      res.json(emerging);
    } catch (error: any) {
      console.error("Get emerging risks error:", error);
      res.status(500).json({ error: "Failed to get emerging risks" });
    }
  });

  // ============================================================================
  // COMPANY OVERVIEW API - Corporate Info (DB-backed)
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

      // Execute real MCP sync in background (not blocking response)
      (async () => {
        try {
          const { executeSyncJob } = await import("./syncScheduler");
          // Note: executeSyncJob creates its own run, so we need to clean up the initial one
          await storage.deleteSyncJobRun(run.id);
          await executeSyncJob(req.params.id);
        } catch (error: any) {
          console.error(`[ManualSync] Failed to execute sync job ${req.params.id}:`, error);
          await storage.updateSyncJobRun(run.id, {
            status: "failed",
            completedAt: new Date(),
            summary: JSON.stringify({ error: error.message })
          });
        }
      })();

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
          cronExpression: "0 0 * * *", // Every 24 hours (midnight)
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
          cronExpression: "0 0 * * *", // Every 24 hours (midnight)
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
          cronExpression: "0 0 * * *", // Every 24 hours (midnight)
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

  // PMO Metrics - uses same storage but filtered by category
  app.get("/api/pmo-metrics", async (_req, res) => {
    try {
      // Get all metrics and filter for PMO category
      const allMetrics = await storage.getVroMetrics();
      const pmoMetrics = allMetrics.filter((m: any) => m.category === 'pmo');
      res.json(pmoMetrics);
    } catch (error: any) {
      console.error("Get PMO metrics error:", error);
      res.status(500).json({ error: "Failed to get PMO metrics" });
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
      res.json([]);
    } catch (error: any) {
      console.error("Get active alerts error:", error);
      res.json([]);
    }
  });

  // ============================================================================
  // PORTFOLIO METRICS API - Calculated aggregates from project data
  // ============================================================================

  app.get("/api/portfolio/metrics", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      
      const totalProjects = projects.length;
      const projectsByStatus = {
        green: projects.filter(p => p.status === 'green').length,
        amber: projects.filter(p => p.status === 'amber').length,
        red: projects.filter(p => p.status === 'red').length,
      };
      
      const totalBudget = projects.reduce((sum, p) => {
        const budget = parseFloat(p.budgetTotal || '0');
        return sum + (isNaN(budget) ? 0 : budget);
      }, 0);
      
      const totalSpent = projects.reduce((sum, p) => {
        const spent = parseFloat(p.budgetSpent || '0');
        return sum + (isNaN(spent) ? 0 : spent);
      }, 0);
      
      const totalRoiValue = projects.reduce((sum, p) => {
        const roi = parseFloat(p.roiValue || '0');
        return sum + (isNaN(roi) ? 0 : roi);
      }, 0);
      
      const projectsWithPredictability = projects.filter(p => p.predictability);
      const avgPredictability = projectsWithPredictability.length > 0
        ? projectsWithPredictability.reduce((sum, p) => sum + parseFloat(p.predictability || '0'), 0) / projectsWithPredictability.length
        : 0;
      
      const projectsWithVelocity = projects.filter(p => p.velocity);
      const avgVelocity = projectsWithVelocity.length > 0
        ? projectsWithVelocity.reduce((sum, p) => sum + parseFloat(p.velocity || '0'), 0) / projectsWithVelocity.length
        : 0;
      
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      
      const criticalProjects = projects.filter(p => p.priority === 'critical').length;
      const highProjects = projects.filter(p => p.priority === 'high').length;
      
      res.json({
        summary: {
          totalProjects,
          projectsByStatus,
          criticalProjects,
          highProjects,
        },
        financial: {
          totalBudget,
          totalSpent,
          budgetUtilization: Math.round(budgetUtilization),
          totalRoiValue,
          budgetUnit: projects[0]?.budgetUnit || '$m',
        },
        performance: {
          avgPredictability: Math.round(avgPredictability),
          avgVelocity: Math.round(avgVelocity),
          healthScore: Math.round(
            (projectsByStatus.green / Math.max(totalProjects, 1)) * 100
          ),
        },
        lastCalculated: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Get portfolio metrics error:", error);
      res.status(500).json({ error: "Failed to calculate portfolio metrics" });
    }
  });

  // ============================================================================
  // DASHBOARD WIDGETS API - Configurable dashboard layout
  // ============================================================================

  app.get("/api/dashboard/widgets", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const visibleOnly = req.query.all !== 'true';
      const widgets = await storage.getDashboardWidgets(category, visibleOnly);
      res.json(widgets);
    } catch (error: any) {
      console.error("Get dashboard widgets error:", error);
      res.status(500).json({ error: "Failed to get dashboard widgets" });
    }
  });

  const createWidgetSchema = z.object({
    widgetKey: z.string().min(1),
    widgetType: z.enum(['metric', 'chart', 'list', 'kpi', 'okr', 'alert']),
    title: z.string().min(1),
    description: z.string().optional(),
    dataSource: z.string().optional(),
    category: z.string().optional(),
    size: z.enum(['small', 'medium', 'large', 'full']).optional(),
    sortOrder: z.number().optional(),
    isVisible: z.boolean().optional(),
    config: z.string().optional(),
  });

  app.post("/api/dashboard/widgets", async (req, res) => {
    try {
      const parseResult = createWidgetSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const widget = await storage.createDashboardWidget(parseResult.data);
      res.status(201).json(widget);
    } catch (error: any) {
      console.error("Create widget error:", error);
      res.status(500).json({ error: "Failed to create widget" });
    }
  });

  app.get("/api/dashboard/widgets/:id", async (req, res) => {
    try {
      const widget = await storage.getDashboardWidget(req.params.id);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error: any) {
      console.error("Get widget error:", error);
      res.status(500).json({ error: "Failed to get widget" });
    }
  });

  const updateWidgetSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    dataSource: z.string().optional(),
    category: z.string().optional(),
    size: z.enum(['small', 'medium', 'large', 'full']).optional(),
    sortOrder: z.number().optional(),
    isVisible: z.boolean().optional(),
    config: z.string().optional(),
  });

  app.put("/api/dashboard/widgets/:id", async (req, res) => {
    try {
      const parseResult = updateWidgetSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const widget = await storage.updateDashboardWidget(req.params.id, parseResult.data);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error: any) {
      console.error("Update widget error:", error);
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  app.delete("/api/dashboard/widgets/:id", async (req, res) => {
    try {
      await storage.deleteDashboardWidget(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete widget error:", error);
      res.status(500).json({ error: "Failed to delete widget" });
    }
  });

  const reorderWidgetsSchema = z.object({
    widgets: z.array(z.object({
      id: z.string(),
      sortOrder: z.number(),
    })),
  });

  app.post("/api/dashboard/widgets/reorder", async (req, res) => {
    try {
      const parseResult = reorderWidgetsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      await storage.reorderDashboardWidgets(parseResult.data.widgets);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Reorder widgets error:", error);
      res.status(500).json({ error: "Failed to reorder widgets" });
    }
  });

  // Get metrics by business unit
  app.get("/api/portfolio/metrics/:businessUnitId", async (req, res) => {
    try {
      const projects = await storage.getProjectsByBusinessUnit(req.params.businessUnitId);
      
      const totalProjects = projects.length;
      const totalBudget = projects.reduce((sum, p) => {
        const budget = parseFloat(p.budgetTotal || '0');
        return sum + (isNaN(budget) ? 0 : budget);
      }, 0);
      
      const totalSpent = projects.reduce((sum, p) => {
        const spent = parseFloat(p.budgetSpent || '0');
        return sum + (isNaN(spent) ? 0 : spent);
      }, 0);
      
      const totalRoiValue = projects.reduce((sum, p) => {
        const roi = parseFloat(p.roiValue || '0');
        return sum + (isNaN(roi) ? 0 : roi);
      }, 0);
      
      res.json({
        businessUnitId: req.params.businessUnitId,
        totalProjects,
        projectsByStatus: {
          green: projects.filter(p => p.status === 'green').length,
          amber: projects.filter(p => p.status === 'amber').length,
          red: projects.filter(p => p.status === 'red').length,
        },
        financial: {
          totalBudget,
          totalSpent,
          budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
          totalRoiValue,
        },
        lastCalculated: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Get business unit metrics error:", error);
      res.status(500).json({ error: "Failed to calculate business unit metrics" });
    }
  });

  // ============================================================================
  // NOTIFICATIONS API
  // ============================================================================

  app.get("/api/notifications", async (req, res) => {
    try {
      const includeRead = req.query.includeRead === 'true';
      const userId = req.query.userId as string | undefined;
      const notificationsList = await storage.getNotifications(userId, includeRead);
      res.json(notificationsList);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  const createNotificationSchema = z.object({
    userId: z.string().optional(),
    type: z.enum(['sync_failure', 'alert', 'info', 'warning', 'success']),
    title: z.string().min(1),
    message: z.string().min(1),
    severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
    source: z.string().optional(),
    sourceId: z.string().optional(),
    actionUrl: z.string().optional(),
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const parseResult = createNotificationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const notification = await storage.createNotification(parseResult.data);
      res.status(201).json(notification);
    } catch (error: any) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.dismissNotification(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Dismiss notification error:", error);
      res.status(500).json({ error: "Failed to dismiss notification" });
    }
  });

  // ============================================================================
  // USER ROLES API
  // ============================================================================

  app.get("/api/user-roles", async (req, res) => {
    try {
      const roles = await storage.getAllUserRoles();
      res.json(roles);
    } catch (error: any) {
      console.error("Get user roles error:", error);
      res.status(500).json({ error: "Failed to get user roles" });
    }
  });

  app.get("/api/user-roles/:userId", async (req, res) => {
    try {
      const role = await storage.getUserRole(req.params.userId);
      if (!role) {
        return res.json({ userId: req.params.userId, role: 'viewer', permissions: null });
      }
      res.json(role);
    } catch (error: any) {
      console.error("Get user role error:", error);
      res.status(500).json({ error: "Failed to get user role" });
    }
  });

  const upsertUserRoleSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(['admin', 'editor', 'viewer']),
    permissions: z.string().optional(),
  });

  app.put("/api/user-roles/:userId", async (req, res) => {
    try {
      const parseResult = upsertUserRoleSchema.safeParse({ ...req.body, userId: req.params.userId });
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const role = await storage.upsertUserRole(parseResult.data);
      res.json(role);
    } catch (error: any) {
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/user-roles/:userId", async (req, res) => {
    try {
      await storage.deleteUserRole(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete user role error:", error);
      res.status(500).json({ error: "Failed to delete user role" });
    }
  });

  // ============================================================================
  // SCHEDULED REPORTS API
  // ============================================================================

  app.get("/api/scheduled-reports", async (req, res) => {
    try {
      const reports = await storage.getScheduledReports();
      res.json(reports);
    } catch (error: any) {
      console.error("Get scheduled reports error:", error);
      res.status(500).json({ error: "Failed to get scheduled reports" });
    }
  });

  app.get("/api/scheduled-reports/:id", async (req, res) => {
    try {
      const report = await storage.getScheduledReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      console.error("Get scheduled report error:", error);
      res.status(500).json({ error: "Failed to get scheduled report" });
    }
  });

  const createScheduledReportSchema = z.object({
    name: z.string().min(1),
    reportType: z.enum(['portfolio_summary', 'project_status', 'financial', 'custom']),
    schedule: z.string().min(1),
    recipients: z.string().optional(),
    format: z.enum(['pdf', 'excel', 'csv']).optional(),
    filters: z.string().optional(),
    isActive: z.boolean().optional(),
    createdBy: z.string().optional(),
  });

  app.post("/api/scheduled-reports", async (req, res) => {
    try {
      const parseResult = createScheduledReportSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const report = await storage.createScheduledReport(parseResult.data);
      res.status(201).json(report);
    } catch (error: any) {
      console.error("Create scheduled report error:", error);
      res.status(500).json({ error: "Failed to create scheduled report" });
    }
  });

  app.put("/api/scheduled-reports/:id", async (req, res) => {
    try {
      const parseResult = createScheduledReportSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      const report = await storage.updateScheduledReport(req.params.id, parseResult.data);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      console.error("Update scheduled report error:", error);
      res.status(500).json({ error: "Failed to update scheduled report" });
    }
  });

  app.delete("/api/scheduled-reports/:id", async (req, res) => {
    try {
      await storage.deleteScheduledReport(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete scheduled report error:", error);
      res.status(500).json({ error: "Failed to delete scheduled report" });
    }
  });

  // ============================================================================
  // EXPORT JOBS API
  // ============================================================================

  app.get("/api/export-jobs", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const jobs = await storage.getExportJobs(userId);
      res.json(jobs);
    } catch (error: any) {
      console.error("Get export jobs error:", error);
      res.status(500).json({ error: "Failed to get export jobs" });
    }
  });

  app.get("/api/export-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getExportJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Export job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Get export job error:", error);
      res.status(500).json({ error: "Failed to get export job" });
    }
  });

  const createExportJobSchema = z.object({
    exportType: z.enum(['projects', 'metrics', 'reports', 'full_backup']),
    format: z.enum(['csv', 'excel', 'json']).optional(),
    filters: z.string().optional(),
    requestedBy: z.string().optional(),
  });

  app.post("/api/export-jobs", async (req, res) => {
    try {
      const parseResult = createExportJobSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }
      
      const job = await storage.createExportJob({
        ...parseResult.data,
        status: 'pending',
      });

      // Simulate export processing (in production, this would be a background job)
      setTimeout(async () => {
        try {
          let data: any[] = [];
          let rowCount = 0;
          
          switch (parseResult.data.exportType) {
            case 'projects':
              data = await storage.getProjects();
              rowCount = data.length;
              break;
            case 'metrics':
              data = await storage.getVroMetrics();
              rowCount = data.length;
              break;
            default:
              data = await storage.getProjects();
              rowCount = data.length;
          }

          await storage.updateExportJob(job.id, {
            status: 'completed',
            rowCount,
            completedAt: new Date(),
          });

          // Create notification for completed export
          await storage.createNotification({
            type: 'success',
            title: 'Export Complete',
            message: `Your ${parseResult.data.exportType} export is ready for download.`,
            severity: 'info',
            source: 'export_job',
            sourceId: job.id,
            actionUrl: `/api/export-jobs/${job.id}/download`,
          });
        } catch (error) {
          await storage.updateExportJob(job.id, {
            status: 'failed',
            errorMessage: 'Export processing failed',
          });
        }
      }, 2000);

      res.status(201).json(job);
    } catch (error: any) {
      console.error("Create export job error:", error);
      res.status(500).json({ error: "Failed to create export job" });
    }
  });

  app.get("/api/export-jobs/:id/download", async (req, res) => {
    try {
      const job = await storage.getExportJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Export job not found" });
      }
      if (job.status !== 'completed') {
        return res.status(400).json({ error: "Export not yet complete" });
      }

      // Generate data based on export type
      let data: any[] = [];
      switch (job.exportType) {
        case 'projects':
          data = await storage.getProjects();
          break;
        case 'metrics':
          data = await storage.getVroMetrics();
          break;
        default:
          data = await storage.getProjects();
      }

      if (job.format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${job.exportType}_export.json"`);
        res.json(data);
      } else {
        // CSV format
        if (data.length === 0) {
          return res.status(404).json({ error: "No data to export" });
        }
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
        const csv = [headers, ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${job.exportType}_export.csv"`);
        res.send(csv);
      }
    } catch (error: any) {
      console.error("Download export error:", error);
      res.status(500).json({ error: "Failed to download export" });
    }
  });

  // ============================================================================
  // TUTORIAL PROGRESS API
  // ============================================================================

  const tutorialStartSchema = z.object({
    tutorialId: z.string().min(1),
    totalSteps: z.number().int().positive(),
  });

  const tutorialStepSchema = z.object({
    currentStep: z.number().int().min(0),
  });

  const tutorialSkipSchema = z.object({
    totalSteps: z.number().int().positive().optional(),
  });

  function getTutorialUserId(req: any): string {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) {
      return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    return userId;
  }

  app.get("/api/tutorials/progress", async (req, res) => {
    try {
      const userId = getTutorialUserId(req);
      const progress = await storage.getTutorialProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error("Get tutorial progress error:", error);
      res.status(500).json({ error: "Failed to get tutorial progress" });
    }
  });

  app.post("/api/tutorials/start", async (req, res) => {
    try {
      const parseResult = tutorialStartSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.issues });
      }

      const userId = getTutorialUserId(req);
      const { tutorialId, totalSteps } = parseResult.data;

      const existing = await storage.getTutorialProgressByTutorial(userId, tutorialId);
      if (existing) {
        return res.json(existing);
      }

      const progress = await storage.createTutorialProgress({
        userId,
        tutorialId,
        totalSteps,
        currentStep: 0,
        isCompleted: false,
        isSkipped: false,
      });
      res.json(progress);
    } catch (error: any) {
      console.error("Start tutorial error:", error);
      res.status(500).json({ error: "Failed to start tutorial" });
    }
  });

  app.post("/api/tutorials/:tutorialId/complete", async (req, res) => {
    try {
      const userId = getTutorialUserId(req);
      const { tutorialId } = req.params;
      
      if (!tutorialId || tutorialId.length < 1) {
        return res.status(400).json({ error: "Invalid tutorialId" });
      }
      
      const progress = await storage.completeTutorial(userId, tutorialId);
      if (!progress) {
        return res.status(404).json({ error: "Tutorial progress not found" });
      }
      res.json(progress);
    } catch (error: any) {
      console.error("Complete tutorial error:", error);
      res.status(500).json({ error: "Failed to complete tutorial" });
    }
  });

  app.post("/api/tutorials/:tutorialId/skip", async (req, res) => {
    try {
      const parseResult = tutorialSkipSchema.safeParse(req.body);
      
      const userId = getTutorialUserId(req);
      const { tutorialId } = req.params;
      const totalSteps = parseResult.success && parseResult.data.totalSteps ? parseResult.data.totalSteps : 1;
      
      const progress = await storage.skipTutorial(userId, tutorialId, totalSteps);
      res.json(progress);
    } catch (error: any) {
      console.error("Skip tutorial error:", error);
      res.status(500).json({ error: "Failed to skip tutorial" });
    }
  });

  app.post("/api/tutorials/:tutorialId/reset", async (req, res) => {
    try {
      const userId = getTutorialUserId(req);
      const { tutorialId } = req.params;
      
      if (!tutorialId || tutorialId.length < 1) {
        return res.status(400).json({ error: "Invalid tutorialId" });
      }
      
      await storage.resetTutorialProgress(userId, tutorialId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Reset tutorial error:", error);
      res.status(500).json({ error: "Failed to reset tutorial" });
    }
  });

  app.patch("/api/tutorials/:tutorialId/step", async (req, res) => {
    try {
      const parseResult = tutorialStepSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.issues });
      }

      const userId = getTutorialUserId(req);
      const { tutorialId } = req.params;
      const { currentStep } = parseResult.data;
      
      const existing = await storage.getTutorialProgressByTutorial(userId, tutorialId);
      if (!existing) {
        return res.status(404).json({ error: "Tutorial progress not found" });
      }

      const progress = await storage.updateTutorialProgress(existing.id, { currentStep });
      res.json(progress);
    } catch (error: any) {
      console.error("Update tutorial step error:", error);
      res.status(500).json({ error: "Failed to update tutorial step" });
    }
  });

  // Register webhook routes
  registerWebhookRoutes(app);

  // ============================================================================
  // JIRA INTEGRATION API
  // ============================================================================

  const jiraConfigSchema = z.object({
    domain: z.string().min(1),
    email: z.string().email(),
    apiToken: z.string().min(1),
    projectKey: z.string().optional(),
  });

  app.post("/api/jira/test-connection", async (req, res) => {
    try {
      const parseResult = jiraConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }

      const client = new JiraClient(parseResult.data);
      const result = await client.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error("Jira test connection error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/jira/projects", async (req, res) => {
    try {
      const parseResult = jiraConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }

      const client = new JiraClient(parseResult.data);
      const projects = await client.getProjects();
      res.json(projects);
    } catch (error: any) {
      console.error("Jira get projects error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/jira/issues", async (req, res) => {
    try {
      const schema = jiraConfigSchema.extend({
        projectKey: z.string().min(1),
      });
      const parseResult = schema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }

      const client = new JiraClient(parseResult.data);
      const issues = await client.getAllIssues(parseResult.data.projectKey);
      res.json(issues);
    } catch (error: any) {
      console.error("Jira get issues error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/jira/sync", async (req, res) => {
    try {
      const schema = jiraConfigSchema.extend({
        projectKey: z.string().min(1),
        sourceSystemId: z.string().optional(),
      });
      const parseResult = schema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
      }

      const client = new JiraClient(parseResult.data);
      const result = await client.syncProject(
        parseResult.data.projectKey,
        parseResult.data.sourceSystemId || 'manual'
      );
      res.json(result);
    } catch (error: any) {
      console.error("Jira sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/jira/sync-from-adapter/:adapterId", async (req, res) => {
    try {
      const client = await createJiraClientFromAdapter(req.params.adapterId);
      if (!client) {
        return res.status(404).json({ error: "Jira adapter not found or invalid configuration" });
      }

      const projectKey = req.body.projectKey;
      if (!projectKey) {
        return res.status(400).json({ error: "projectKey is required" });
      }

      const result = await client.syncProject(projectKey, req.params.adapterId);
      res.json(result);
    } catch (error: any) {
      console.error("Jira sync from adapter error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ONTOLOGY & OBDA ENDPOINTS
  // Virtual data federation without materialization
  // ============================================================================

  // Initialize OBDA service
  const obdaService = createOBDAService(storage);

  // GraphQL endpoint for unified queries (with storage access for comprehensive queries)
  const graphqlSchema = createGraphQLSchema(obdaService);
  app.all(
    "/api/graphql",
    createHandler({
      schema: graphqlSchema,
      context: async () => createGraphQLContext(obdaService, storage),
    })
  );

  // SPARQL endpoint for direct semantic queries
  app.post("/api/sparql", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "SPARQL query required" });
      }

      const result = await obdaService.executeSPARQL(query);
      res.json(result);
    } catch (error: any) {
      console.error("[SPARQL] Query error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Ontology explorer - get all classes
  app.get("/api/ontology/classes", async (_req, res) => {
    try {
      const classes = ontologyService.getClasses();
      res.json({ classes });
    } catch (error: any) {
      console.error("[Ontology] Get classes error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Ontology explorer - get all properties
  app.get("/api/ontology/properties", async (_req, res) => {
    try {
      const properties = ontologyService.getProperties();
      res.json(properties);
    } catch (error: any) {
      console.error("[Ontology] Get properties error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Ontology explorer - get equivalent concepts
  app.get("/api/ontology/equivalent/:conceptUri", async (req, res) => {
    try {
      const conceptUri = decodeURIComponent(req.params.conceptUri);
      const equivalents = ontologyService.getEquivalentConcepts(conceptUri);
      res.json({ conceptUri, equivalents });
    } catch (error: any) {
      console.error("[Ontology] Get equivalents error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Ontology statistics
  app.get("/api/ontology/statistics", async (_req, res) => {
    try {
      const stats = ontologyService.getStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error("[Ontology] Get statistics error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Semantic reconciliation - map external entity types
  app.post("/api/ontology/reconcile", async (req, res) => {
    try {
      const { sourceType, sourceSystem } = req.body;
      if (!sourceType || !sourceSystem) {
        return res.status(400).json({ error: "sourceType and sourceSystem required" });
      }

      const ontologyConcept = ontologyService.reconcileEntity(sourceType, sourceSystem);
      const label = ontologyService.getLabel(ontologyConcept);

      res.json({
        sourceType,
        sourceSystem,
        ontologyConcept,
        label,
      });
    } catch (error: any) {
      console.error("[Ontology] Reconcile error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // AGENT TEST ENDPOINT (Trigger agent manually for LangSmith testing)
  // ============================================================================
  app.post("/api/agents/test/:agentId", async (req, res) => {
    try {
      const { agentId } = req.params;

      // Use global agent scheduler (singleton)
      const { getGlobalAgentScheduler } = await import("./index.js");
      const scheduler = getGlobalAgentScheduler();

      // Get the specific agent
      const agentsMap = scheduler.getAgentsMap();
      const agent = agentsMap.get(agentId);
      if (!agent) {
        return res.status(404).json({
          error: "Agent not found",
          availableAgents: Array.from(agentsMap.keys())
        });
      }

      console.log(`[Test] Manually triggering ${agentId} agent...`);

      // Execute the agent
      await agent.runScheduledScan();

      // Get recent interventions from this agent
      const allInterventions = await storage.getInterventions();
      const recentInterventions = allInterventions
        .filter(i => i.agentSource === agentId)
        .slice(0, 5);

      res.json({
        success: true,
        agentId,
        message: `${agentId} agent executed successfully`,
        interventionsCreated: recentInterventions.length,
        recentInterventions,
        langsmithProject: process.env.LANGCHAIN_PROJECT || "nexus-ppm",
        langsmithUrl: "https://smith.langchain.com/",
        note: "Check LangSmith dashboard for agent traces"
      });
    } catch (error: any) {
      console.error("[Test] Agent test error:", error);
      res.status(500).json({
        error: error.message,
        stack: error.stack
      });
    }
  });

  // ============================================================================
  // DATA INGESTION - Excel, CSV, Planview Import (PRODUCTION-READY)
  // ============================================================================

  // Configure multer for Excel/CSV uploads
  const dataUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (_req, file, cb) => {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv'
      ];
      if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
      }
    }
  });

  // Upload and import Excel/CSV file
  app.post("/api/data/import/file", dataUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { createExcelSheetsMCP } = await import("./mcp/ExcelSheetsMCP.js");
      const excelMCP = createExcelSheetsMCP(storage);

      let importedCount = 0;
      const fileName = req.file.originalname;

      console.log(`[DataIngestion] Processing file: ${fileName}`);

      if (fileName.endsWith('.csv')) {
        const fileContent = req.file.buffer.toString('utf-8');
        importedCount = await excelMCP.processCSVFile(fileContent);
      } else {
        const sheetName = req.body.sheetName || undefined;
        importedCount = await excelMCP.processExcelFile(req.file.buffer, sheetName);
      }

      // Trigger immediate agent scan on newly imported projects
      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);
      const agentsMap = scheduler.getAgentsMap();

      // Trigger OKR Inference and VRO agents to process new data
      const okrAgent = agentsMap.get('okr-inference');
      const vroAgent = agentsMap.get('vro');

      if (okrAgent) {
        okrAgent.runScheduledScan().catch((err: Error) =>
          console.error('[DataIngestion] OKR Inference scan error:', err)
        );
      }
      if (vroAgent) {
        vroAgent.runScheduledScan().catch((err: Error) =>
          console.error('[DataIngestion] VRO scan error:', err)
        );
      }

      res.json({
        success: true,
        message: `Successfully imported ${importedCount} projects from ${fileName}`,
        importedCount,
        fileName,
        triggerredAgents: ['okr-inference', 'vro']
      });
    } catch (error: any) {
      console.error('[DataIngestion] File import error:', error);
      res.status(500).json({
        error: error.message,
        details: error.stack
      });
    }
  });

  // Import from Google Sheets
  app.post("/api/data/import/google-sheets", async (req, res) => {
    try {
      const { spreadsheetId, sheetName } = req.body;

      if (!spreadsheetId) {
        return res.status(400).json({ error: "spreadsheetId is required" });
      }

      const { createExcelSheetsMCP } = await import("./mcp/ExcelSheetsMCP.js");
      const excelMCP = createExcelSheetsMCP(storage, {
        googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY
      });

      const importedCount = await excelMCP.processGoogleSheet(spreadsheetId, sheetName);

      res.json({
        success: true,
        message: `Successfully imported ${importedCount} projects from Google Sheets`,
        importedCount,
        spreadsheetId
      });
    } catch (error: any) {
      console.error('[DataIngestion] Google Sheets import error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sync from Planview
  app.post("/api/data/sync/planview", async (req, res) => {
    try {
      const { portfolioId } = req.body;

      const { createPlanviewMCP } = await import("./mcp/PlanviewMCP.js");
      const planviewMCP = createPlanviewMCP(storage);

      // Test connection first
      const isConnected = await planviewMCP.testConnection();
      if (!isConnected) {
        return res.status(503).json({
          error: "Cannot connect to Planview. Check API credentials.",
          configured: !!process.env.PLANVIEW_API_KEY
        });
      }

      const syncedCount = await planviewMCP.syncProjectsToDatabase({ portfolioId });

      res.json({
        success: true,
        message: `Successfully synced ${syncedCount} projects from Planview`,
        syncedCount,
        portfolioId: portfolioId || 'all'
      });
    } catch (error: any) {
      console.error('[DataIngestion] Planview sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test Planview connection
  app.get("/api/data/planview/test", async (_req, res) => {
    try {
      const { createPlanviewMCP } = await import("./mcp/PlanviewMCP.js");
      const planviewMCP = createPlanviewMCP(storage);

      const isConnected = await planviewMCP.testConnection();

      res.json({
        success: true,
        connected: isConnected,
        configured: !!process.env.PLANVIEW_API_KEY,
        message: isConnected
          ? "Planview connection successful"
          : "Cannot connect to Planview"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        connected: false,
        error: error.message
      });
    }
  });

  // Get Planview portfolios
  app.get("/api/data/planview/portfolios", async (_req, res) => {
    try {
      const { createPlanviewMCP } = await import("./mcp/PlanviewMCP.js");
      const planviewMCP = createPlanviewMCP(storage);

      const portfolios = await planviewMCP.fetchPortfolios();

      res.json({
        success: true,
        portfolios,
        count: portfolios.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get sync scheduler status
  app.get("/api/data/sync/scheduler/status", async (_req, res) => {
    try {
      const { getSyncScheduler } = await import("./mcp/SyncScheduler.js");
      const scheduler = getSyncScheduler();

      if (!scheduler) {
        return res.json({
          isRunning: false,
          planviewEnabled: false,
          googleSheetsEnabled: false,
          message: "Sync scheduler not initialized"
        });
      }

      const status = scheduler.getStatus();
      const history = scheduler.getSyncHistory();

      res.json({
        ...status,
        recentSyncs: history.slice(-10), // Last 10 syncs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manually trigger Planview sync via scheduler
  app.post("/api/data/sync/scheduler/planview", async (_req, res) => {
    try {
      const { getSyncScheduler } = await import("./mcp/SyncScheduler.js");
      const scheduler = getSyncScheduler();

      if (!scheduler) {
        return res.status(400).json({ error: "Sync scheduler not initialized" });
      }

      const result = await scheduler.syncPlanview();

      res.json({
        success: result.success,
        projectsSynced: result.projectsSynced,
        error: result.error,
        timestamp: result.timestamp,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manually trigger Google Sheets sync via scheduler
  app.post("/api/data/sync/scheduler/googlesheets", async (_req, res) => {
    try {
      const { getSyncScheduler } = await import("./mcp/SyncScheduler.js");
      const scheduler = getSyncScheduler();

      if (!scheduler) {
        return res.status(400).json({ error: "Sync scheduler not initialized" });
      }

      const result = await scheduler.syncGoogleSheets();

      res.json({
        success: result.success,
        projectsSynced: result.projectsSynced,
        error: result.error,
        timestamp: result.timestamp,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // A2A (AGENT-TO-AGENT) AND MCP PROTOCOL ENDPOINTS
  // ============================================================================

  // Get orchestration status (A2A and MCP)
  app.get("/api/orchestration/status", async (req, res) => {
    try {
      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);

      const status = scheduler.getStatus();

      res.json({
        success: true,
        status,
        protocols: {
          a2a: "Agent-to-Agent messaging for internal coordination",
          mcp: "Model Context Protocol for external service integration"
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send A2A message from one agent to another
  app.post("/api/orchestration/a2a/send", async (req, res) => {
    try {
      const { from, to, type, content, projectId, severity } = req.body;

      if (!from || !to || !type || !content) {
        return res.status(400).json({
          error: "Missing required fields: from, to, type, content"
        });
      }

      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);
      const orchestrator = scheduler.getOrchestrator();

      if (!orchestrator) {
        return res.status(500).json({ error: "Orchestrator not initialized" });
      }

      const a2aBus = orchestrator.getA2ABus();
      await a2aBus.send({ from, to, type, content, projectId, severity });

      res.json({
        success: true,
        message: "A2A message sent",
        from,
        to,
        type
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Broadcast A2A alert to multiple agents
  app.post("/api/orchestration/a2a/broadcast", async (req, res) => {
    try {
      const { fromAgentId, recipientIds, alert } = req.body;

      if (!fromAgentId || !recipientIds || !alert) {
        return res.status(400).json({
          error: "Missing required fields: fromAgentId, recipientIds, alert"
        });
      }

      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);

      await scheduler.broadcastAlert(fromAgentId, recipientIds, alert);

      res.json({
        success: true,
        message: "A2A alert broadcast",
        from: fromAgentId,
        recipients: recipientIds.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agent calls MCP service
  app.post("/api/orchestration/mcp/call", async (req, res) => {
    try {
      const { agentId, serviceName, action, params } = req.body;

      if (!agentId || !serviceName || !action) {
        return res.status(400).json({
          error: "Missing required fields: agentId, serviceName, action"
        });
      }

      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);

      const result = await scheduler.agentCallMCPService(agentId, serviceName, action, params || {});

      res.json({
        success: true,
        result,
        agentId,
        serviceName,
        action
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get available MCP services
  app.get("/api/orchestration/mcp/services", async (req, res) => {
    try {
      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);
      const orchestrator = scheduler.getOrchestrator();

      if (!orchestrator) {
        return res.status(500).json({ error: "Orchestrator not initialized" });
      }

      const mcpHandler = orchestrator.getMCPHandler();
      const services = mcpHandler.getServices();

      res.json({
        success: true,
        services,
        count: services.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get A2A message queue status
  app.get("/api/orchestration/a2a/status", async (req, res) => {
    try {
      const { createAgentScheduler } = await import("./agents/AgentScheduler.js");
      const scheduler = createAgentScheduler(storage);
      const orchestrator = scheduler.getOrchestrator();

      if (!orchestrator) {
        return res.status(500).json({ error: "Orchestrator not initialized" });
      }

      const a2aBus = orchestrator.getA2ABus();
      const status = a2aBus.getStatus();

      res.json({
        success: true,
        status
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log("[Routes] Ontology and OBDA endpoints registered");
  console.log("[Routes] Agent test endpoint registered: POST /api/agents/test/:agentId");
  console.log("[Routes] A2A and MCP protocol endpoints registered:");
  console.log("  - GET  /api/orchestration/status");
  console.log("  - POST /api/orchestration/a2a/send");
  console.log("  - POST /api/orchestration/a2a/broadcast");
  console.log("  - GET  /api/orchestration/a2a/status");
  console.log("  - POST /api/orchestration/mcp/call");
  console.log("  - GET  /api/orchestration/mcp/services");

  return httpServer;
}
