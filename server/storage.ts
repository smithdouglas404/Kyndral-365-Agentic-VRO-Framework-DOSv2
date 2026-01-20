import { 
  type User, type UpsertUser, 
  type Policy, type InsertPolicy,
  type BusinessUnit, type InsertBusinessUnit,
  type Project, type InsertProject,
  type ProjectTemplate, type InsertProjectTemplate,
  type PolicyBusinessUnitLink, type InsertPolicyBusinessUnitLink,
  type PolicyProjectLink, type InsertPolicyProjectLink,
  type AgentMemory, type InsertAgentMemory,
  type AgentPattern, type InsertAgentPattern,
  type AgentTaskQueue, type InsertAgentTaskQueue,
  type Intervention, type InsertIntervention,
  type AgentDiscussion, type InsertAgentDiscussion,
  type DiscussionMessage, type InsertDiscussionMessage,
  type ProjectMetric, type InsertProjectMetric,
  type AgentActivityLog, type InsertAgentActivityLog,
  type Alert, type InsertAlert,
  type Feature, type InsertFeature,
  type Story, type InsertStory,
  type Task, type InsertTask,
  type Resource, type InsertResource,
  type Milestone, type InsertMilestone,
  type Dependency, type InsertDependency,
  type ProjectFinancials, type InsertProjectFinancials,
  type Risk, type InsertRisk,
  type Okr, type InsertOkr,
  type KeyResult, type InsertKeyResult,
  type Kpi, type InsertKpi,
  type Portfolio, type InsertPortfolio,
  type ValueStream, type InsertValueStream,
  type Art, type InsertArt,
  type Team, type InsertTeam,
  type ProgramIncrement, type InsertProgramIncrement,
  type Epic, type InsertEpic,
  type Capability, type InsertCapability,
  type Sprint, type InsertSprint,
  type StrategicTheme, type InsertStrategicTheme,
  type SourceSystem, type InsertSourceSystem,
  type McpAdapter, type InsertMcpAdapter,
  type FieldMapping, type InsertFieldMapping,
  type IngestionJob, type InsertIngestionJob,
  type McpToolMapping, type InsertMcpToolMapping,
  type Division, type InsertDivision,
  type DivisionKpi, type InsertDivisionKpi,
  type DivisionOkr, type InsertDivisionOkr,
  type DivisionRisk, type InsertDivisionRisk,
  type CompanyOverview, type InsertCompanyOverview,
  type ClimateMetric, type InsertClimateMetric,
  type EnterpriseRiskCategory, type InsertEnterpriseRiskCategory,
  type EnterpriseRisk, type InsertEnterpriseRisk,
  type SyncJob, type InsertSyncJob,
  type SyncJobRun, type InsertSyncJobRun,
  type WebhookEndpoint, type InsertWebhookEndpoint,
  type WebhookEvent, type InsertWebhookEvent,
  type IngestionSession, type InsertIngestionSession,
  type QaReview, type InsertQaReview,
  type ClarifyingQuestion, type InsertClarifyingQuestion,
  type VroMetric, type InsertVroMetric,
  type Benchmark, type InsertBenchmark,
  type AppConfig, type InsertAppConfig,
  type DashboardWidget, type InsertDashboardWidget,
  type Notification, type InsertNotification,
  type UserRole, type InsertUserRole,
  type ScheduledReport, type InsertScheduledReport,
  type ExportJob, type InsertExportJob,
  type TutorialProgress, type InsertTutorialProgress,
  type AuditTrail, type InsertAuditTrail,
  users, policies, businessUnits, projects, projectTemplates, policyBusinessUnitLinks, policyProjectLinks,
  agentMemory, agentPatterns, agentTaskQueue, interventions, agentDiscussions, discussionMessages,
  projectMetrics, agentActivityLog, alerts, features, stories, tasks, resources, milestones, dependencies, projectFinancials, risks,
  okrs, keyResults, kpis,
  portfolios, valueStreams, arts, teams, programIncrements, epics, capabilities, sprints, strategicThemes,
  sourceSystems, mcpAdapters, fieldMappings, ingestionJobs, mcpToolMappings,
  divisions, divisionKpis, divisionOkrs, divisionRisks,
  companyOverview, climateMetrics, enterpriseRiskCategories, enterpriseRisks,
  syncJobs, syncJobRuns, webhookEndpoints, webhookEvents,
  ingestionSessions, qaReviews, clarifyingQuestions,
  vroMetrics, benchmarks, appConfig, dashboardWidgets,
  notifications, userRoles, scheduledReports, exportJobs, tutorialProgress, auditTrail
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and, inArray } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: string): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  deletePolicy(id: string): Promise<void>;
  getBusinessUnits(): Promise<BusinessUnit[]>;
  getBusinessUnit(id: string): Promise<BusinessUnit | undefined>;
  createBusinessUnit(bu: InsertBusinessUnit): Promise<BusinessUnit>;
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  getProjectsByBusinessUnit(businessUnitId: string): Promise<Project[]>;
  linkPolicyToBusinessUnit(link: InsertPolicyBusinessUnitLink): Promise<PolicyBusinessUnitLink>;
  unlinkPolicyFromBusinessUnit(policyId: string, businessUnitId: string): Promise<void>;
  getBusinessUnitsForPolicy(policyId: string): Promise<BusinessUnit[]>;
  getPoliciesForBusinessUnit(businessUnitId: string): Promise<Policy[]>;
  linkPolicyToProject(link: InsertPolicyProjectLink): Promise<PolicyProjectLink>;
  unlinkPolicyFromProject(policyId: string, projectId: string): Promise<void>;
  getProjectsForPolicy(policyId: string): Promise<(Project & { impactLevel: string })[]>;
  getPoliciesForProject(projectId: string): Promise<Policy[]>;
  seedDemoData(): Promise<void>;
  
  getAgentMemory(agentId?: string, limit?: number): Promise<AgentMemory[]>;
  createAgentMemory(memory: InsertAgentMemory): Promise<AgentMemory>;
  getAgentPatterns(targetType?: string): Promise<AgentPattern[]>;
  createOrUpdateAgentPattern(pattern: InsertAgentPattern): Promise<AgentPattern>;
  getAgentTasks(agentId?: string, status?: string): Promise<AgentTaskQueue[]>;
  createAgentTask(task: InsertAgentTaskQueue): Promise<AgentTaskQueue>;
  updateAgentTaskStatus(taskId: string, status: string): Promise<void>;
  
  getInterventions(status?: string): Promise<Intervention[]>;
  createIntervention(intervention: InsertIntervention): Promise<Intervention>;
  updateInterventionStatus(id: string, status: string, userId?: string): Promise<Intervention>;
  
  getDiscussions(status?: string): Promise<AgentDiscussion[]>;
  createDiscussion(discussion: InsertAgentDiscussion): Promise<AgentDiscussion>;
  getDiscussionMessages(discussionId: string): Promise<DiscussionMessage[]>;
  addDiscussionMessage(message: InsertDiscussionMessage): Promise<DiscussionMessage>;
  
  getProjectMetrics(projectId: string): Promise<ProjectMetric[]>;
  getAllProjectMetrics(): Promise<ProjectMetric[]>;
  upsertProjectMetric(metric: InsertProjectMetric): Promise<ProjectMetric>;
  
  getOkrs(businessUnitId?: string): Promise<Okr[]>;
  getOkr(id: string): Promise<Okr | undefined>;
  createOkr(okr: InsertOkr): Promise<Okr>;
  getKeyResults(okrId: string): Promise<KeyResult[]>;
  createKeyResult(kr: InsertKeyResult): Promise<KeyResult>;
  getOkrsWithKeyResults(): Promise<(Okr & { keyResults: KeyResult[] })[]>;
  
  getKpis(projectId?: string, businessUnitId?: string): Promise<Kpi[]>;
  createKpi(kpi: InsertKpi): Promise<Kpi>;
  
  getAgentActivityLog(limit?: number): Promise<AgentActivityLog[]>;
  createAgentActivityLog(activity: InsertAgentActivityLog): Promise<AgentActivityLog>;
  clearAgentActivityLog(): Promise<void>;
  
  getAlerts(status?: string, category?: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlertStatus(id: string, status: string, userId?: string): Promise<Alert>;
  
  seedDemoInterventions(): Promise<void>;
  clearInterventions(): Promise<void>;
  clearDivisions(): Promise<void>;
  forceSeedDivisions(): Promise<void>;
  
  getFeatures(projectId: string): Promise<Feature[]>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  getStories(featureId: string): Promise<Story[]>;
  getStoriesByProject(projectId: string): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  getTasks(storyId: string): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  getResources(projectId: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  getMilestones(projectId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  getDependencies(projectId: string): Promise<Dependency[]>;
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  getProjectFinancials(projectId: string): Promise<ProjectFinancials | undefined>;
  upsertProjectFinancials(financials: InsertProjectFinancials): Promise<ProjectFinancials>;
  getRisks(projectId: string): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  getFullProject(projectId: string): Promise<{
    project: Project;
    features: Feature[];
    stories: Story[];
    tasks: Task[];
    resources: Resource[];
    milestones: Milestone[];
    dependencies: Dependency[];
    financials: ProjectFinancials | undefined;
    risks: Risk[];
  } | undefined>;
  
  // SAFe Ontology Methods
  getStrategicThemes(portfolioId?: string): Promise<StrategicTheme[]>;
  createStrategicTheme(theme: InsertStrategicTheme): Promise<StrategicTheme>;
  backfillStrategicThemesPortfolioId(): Promise<number>;
  getPortfolios(): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  getValueStreams(portfolioId?: string): Promise<ValueStream[]>;
  createValueStream(vs: InsertValueStream): Promise<ValueStream>;
  getArts(valueStreamId?: string): Promise<Art[]>;
  createArt(art: InsertArt): Promise<Art>;
  getTeams(artId?: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  getProgramIncrements(artId?: string): Promise<ProgramIncrement[]>;
  createProgramIncrement(pi: InsertProgramIncrement): Promise<ProgramIncrement>;
  getEpics(portfolioId?: string, valueStreamId?: string): Promise<Epic[]>;
  createEpic(epic: InsertEpic): Promise<Epic>;
  getCapabilities(epicId?: string): Promise<Capability[]>;
  createCapability(cap: InsertCapability): Promise<Capability>;
  getSprints(piId?: string, teamId?: string): Promise<Sprint[]>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  
  // MCP & Integration Methods
  getSourceSystems(): Promise<SourceSystem[]>;
  getSourceSystem(id: string): Promise<SourceSystem | undefined>;
  createSourceSystem(ss: InsertSourceSystem): Promise<SourceSystem>;
  updateSourceSystemStatus(id: string, status: string): Promise<void>;
  getMcpAdapters(sourceSystemId?: string): Promise<McpAdapter[]>;
  createMcpAdapter(adapter: InsertMcpAdapter): Promise<McpAdapter>;
  getFieldMappings(sourceSystemId?: string): Promise<FieldMapping[]>;
  createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping>;
  getIngestionJobs(sourceSystemId?: string): Promise<IngestionJob[]>;
  createIngestionJob(job: InsertIngestionJob): Promise<IngestionJob>;
  updateIngestionJobStatus(id: string, status: string, stats?: { processed?: number; created?: number; updated?: number; failed?: number }): Promise<void>;
  getMcpToolMappings(adapterId?: string): Promise<McpToolMapping[]>;
  createMcpToolMapping(mapping: InsertMcpToolMapping): Promise<McpToolMapping>;
  
  // Full SAFe Hierarchy Query
  getSafeHierarchy(portfolioId: string): Promise<{
    portfolio: Portfolio;
    valueStreams: (ValueStream & { arts: (Art & { teams: Team[]; programIncrements: ProgramIncrement[] })[] })[];
    epics: Epic[];
  } | undefined>;
  
  // Division Methods (NextEra Business Segments)
  getDivisions(): Promise<Division[]>;
  getDivision(id: string): Promise<Division | undefined>;
  createDivision(division: InsertDivision): Promise<Division>;
  getDivisionKpis(divisionId: string): Promise<DivisionKpi[]>;
  createDivisionKpi(kpi: InsertDivisionKpi): Promise<DivisionKpi>;
  getDivisionOkrs(divisionId: string): Promise<DivisionOkr[]>;
  createDivisionOkr(okr: InsertDivisionOkr): Promise<DivisionOkr>;
  getDivisionRisks(divisionId: string): Promise<DivisionRisk[]>;
  createDivisionRisk(risk: InsertDivisionRisk): Promise<DivisionRisk>;
  getFullDivision(divisionId: string): Promise<{
    division: Division;
    kpis: DivisionKpi[];
    okrs: DivisionOkr[];
    risks: DivisionRisk[];
  } | undefined>;
  seedDivisions(): Promise<void>;
  
  // Company Overview Methods (NextEra Corporate Info)
  getCompanyOverview(): Promise<CompanyOverview | undefined>;
  createCompanyOverview(overview: InsertCompanyOverview): Promise<CompanyOverview>;
  
  // Climate Metrics Methods (Sustainability Data)
  getClimateMetrics(category?: string): Promise<ClimateMetric[]>;
  createClimateMetric(metric: InsertClimateMetric): Promise<ClimateMetric>;
  
  // Enterprise Risk Methods (Corporate Risk Registry)
  getEnterpriseRiskCategories(): Promise<EnterpriseRiskCategory[]>;
  createEnterpriseRiskCategory(category: InsertEnterpriseRiskCategory): Promise<EnterpriseRiskCategory>;
  getEnterpriseRisks(categoryId?: string): Promise<EnterpriseRisk[]>;
  createEnterpriseRisk(risk: InsertEnterpriseRisk): Promise<EnterpriseRisk>;
  getFullEnterpriseRiskProfile(): Promise<{
    categories: (EnterpriseRiskCategory & { risks: EnterpriseRisk[] })[];
  }>;
  
  // Seed company/climate/risk data
  seedCompanyData(): Promise<void>;
  
  // Sync Job Methods (MCP Scheduling)
  getSyncJobs(mcpAdapterId?: string): Promise<SyncJob[]>;
  getSyncJob(id: string): Promise<SyncJob | undefined>;
  createSyncJob(job: InsertSyncJob): Promise<SyncJob>;
  updateSyncJob(id: string, updates: Partial<SyncJob>): Promise<SyncJob | undefined>;
  deleteSyncJob(id: string): Promise<void>;
  getEnabledSyncJobs(): Promise<SyncJob[]>;
  updateSyncJobLastRun(id: string, status: string, error?: string): Promise<void>;
  
  // Sync Job Run Methods (Execution History)
  getSyncJobRuns(syncJobId?: string, limit?: number): Promise<SyncJobRun[]>;
  getSyncJobRun(id: string): Promise<SyncJobRun | undefined>;
  createSyncJobRun(run: InsertSyncJobRun): Promise<SyncJobRun>;
  updateSyncJobRun(id: string, updates: Partial<SyncJobRun>): Promise<SyncJobRun | undefined>;
  
  // Webhook Endpoint Methods
  getWebhookEndpoints(sourceSystemId?: string): Promise<WebhookEndpoint[]>;
  getWebhookEndpoint(id: string): Promise<WebhookEndpoint | undefined>;
  getWebhookEndpointByPath(path: string): Promise<WebhookEndpoint | undefined>;
  createWebhookEndpoint(endpoint: InsertWebhookEndpoint): Promise<WebhookEndpoint>;
  updateWebhookEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | undefined>;
  deleteWebhookEndpoint(id: string): Promise<void>;
  incrementWebhookStats(id: string, processed: boolean): Promise<void>;
  
  // Webhook Event Methods
  getWebhookEvents(webhookEndpointId?: string, limit?: number): Promise<WebhookEvent[]>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  updateWebhookEventStatus(id: string, status: string, error?: string, syncJobRunId?: string): Promise<void>;
  
  // Ingestion Session Methods (AI-powered ingestion workflow)
  getIngestionSessions(status?: string): Promise<IngestionSession[]>;
  getIngestionSession(id: string): Promise<IngestionSession | undefined>;
  createIngestionSession(session: InsertIngestionSession): Promise<IngestionSession>;
  updateIngestionSession(id: string, updates: Partial<IngestionSession>): Promise<IngestionSession | undefined>;
  deleteIngestionSession(id: string): Promise<void>;
  
  // QA Review Methods
  getQaReviews(ingestionSessionId?: string): Promise<QaReview[]>;
  getQaReview(id: string): Promise<QaReview | undefined>;
  createQaReview(review: InsertQaReview): Promise<QaReview>;
  updateQaReview(id: string, updates: Partial<QaReview>): Promise<QaReview | undefined>;
  
  // Clarifying Question Methods
  getClarifyingQuestions(ingestionSessionId?: string, status?: string): Promise<ClarifyingQuestion[]>;
  getClarifyingQuestion(id: string): Promise<ClarifyingQuestion | undefined>;
  createClarifyingQuestion(question: InsertClarifyingQuestion): Promise<ClarifyingQuestion>;
  answerClarifyingQuestion(id: string, answer: string, answeredBy: string): Promise<ClarifyingQuestion | undefined>;
  
  // VRO Metrics Methods
  getVroMetrics(category?: string): Promise<VroMetric[]>;
  getVroMetric(id: string): Promise<VroMetric | undefined>;
  createVroMetric(metric: InsertVroMetric): Promise<VroMetric>;
  updateVroMetric(id: string, updates: Partial<VroMetric>): Promise<VroMetric | undefined>;
  
  // Benchmarks Methods
  getBenchmarks(category?: string): Promise<Benchmark[]>;
  getBenchmark(id: string): Promise<Benchmark | undefined>;
  createBenchmark(benchmark: InsertBenchmark): Promise<Benchmark>;
  
  // App Config Methods
  getAppConfig(key: string): Promise<AppConfig | undefined>;
  getAllAppConfig(category?: string): Promise<AppConfig[]>;
  setAppConfig(key: string, value: string, description?: string, category?: string): Promise<AppConfig>;
  
  // Dashboard Widget Methods
  getDashboardWidgets(category?: string, visibleOnly?: boolean): Promise<DashboardWidget[]>;
  getDashboardWidget(id: string): Promise<DashboardWidget | undefined>;
  createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget>;
  updateDashboardWidget(id: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined>;
  deleteDashboardWidget(id: string): Promise<void>;
  reorderDashboardWidgets(widgetOrders: { id: string; sortOrder: number }[]): Promise<void>;
  
  // Project Template Methods
  getProjectTemplates(category?: string): Promise<ProjectTemplate[]>;
  getProjectTemplate(id: string): Promise<ProjectTemplate | undefined>;
  getProjectTemplateBySlug(slug: string): Promise<ProjectTemplate | undefined>;
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;
  updateProjectTemplate(id: string, updates: Partial<ProjectTemplate>): Promise<ProjectTemplate | undefined>;
  deleteProjectTemplate(id: string): Promise<void>;
  
  // Audit Trail Methods
  createAuditTrail(entry: InsertAuditTrail): Promise<AuditTrail>;
  getAuditTrailByCode(confirmationCode: string): Promise<AuditTrail | undefined>;
  getRecentAuditTrail(limit?: number): Promise<AuditTrail[]>;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getPolicies(): Promise<Policy[]> {
    return await db.select().from(policies).orderBy(desc(policies.createdAt));
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    const result = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
    return result[0];
  }

  async createPolicy(insertPolicy: InsertPolicy): Promise<Policy> {
    const result = await db.insert(policies).values(insertPolicy).returning();
    return result[0];
  }

  async deletePolicy(id: string): Promise<void> {
    await db.delete(policyBusinessUnitLinks).where(eq(policyBusinessUnitLinks.policyId, id));
    await db.delete(policyProjectLinks).where(eq(policyProjectLinks.policyId, id));
    await db.delete(policies).where(eq(policies.id, id));
  }

  async getBusinessUnits(): Promise<BusinessUnit[]> {
    return await db.select().from(businessUnits);
  }

  async getBusinessUnit(id: string): Promise<BusinessUnit | undefined> {
    const result = await db.select().from(businessUnits).where(eq(businessUnits.id, id)).limit(1);
    return result[0];
  }

  async createBusinessUnit(bu: InsertBusinessUnit): Promise<BusinessUnit> {
    const result = await db.insert(businessUnits).values(bu).returning();
    return result[0];
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async createProject(proj: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(proj).returning();
    return result[0];
  }

  async getProjectsByBusinessUnit(businessUnitId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.businessUnitId, businessUnitId));
  }

  async linkPolicyToBusinessUnit(link: InsertPolicyBusinessUnitLink): Promise<PolicyBusinessUnitLink> {
    const existing = await db.select().from(policyBusinessUnitLinks)
      .where(and(
        eq(policyBusinessUnitLinks.policyId, link.policyId),
        eq(policyBusinessUnitLinks.businessUnitId, link.businessUnitId)
      )).limit(1);
    if (existing[0]) return existing[0];
    
    const result = await db.insert(policyBusinessUnitLinks).values(link).returning();
    return result[0];
  }

  async unlinkPolicyFromBusinessUnit(policyId: string, businessUnitId: string): Promise<void> {
    await db.delete(policyBusinessUnitLinks).where(and(
      eq(policyBusinessUnitLinks.policyId, policyId),
      eq(policyBusinessUnitLinks.businessUnitId, businessUnitId)
    ));
  }

  async getBusinessUnitsForPolicy(policyId: string): Promise<BusinessUnit[]> {
    const links = await db.select().from(policyBusinessUnitLinks)
      .where(eq(policyBusinessUnitLinks.policyId, policyId));
    if (links.length === 0) return [];
    
    const buIds = links.map(l => l.businessUnitId);
    return await db.select().from(businessUnits).where(inArray(businessUnits.id, buIds));
  }

  async getPoliciesForBusinessUnit(businessUnitId: string): Promise<Policy[]> {
    const links = await db.select().from(policyBusinessUnitLinks)
      .where(eq(policyBusinessUnitLinks.businessUnitId, businessUnitId));
    if (links.length === 0) return [];
    
    const policyIds = links.map(l => l.policyId);
    return await db.select().from(policies).where(inArray(policies.id, policyIds));
  }

  async linkPolicyToProject(link: InsertPolicyProjectLink): Promise<PolicyProjectLink> {
    const existing = await db.select().from(policyProjectLinks)
      .where(and(
        eq(policyProjectLinks.policyId, link.policyId),
        eq(policyProjectLinks.projectId, link.projectId)
      )).limit(1);
    if (existing[0]) return existing[0];
    
    const result = await db.insert(policyProjectLinks).values(link).returning();
    return result[0];
  }

  async unlinkPolicyFromProject(policyId: string, projectId: string): Promise<void> {
    await db.delete(policyProjectLinks).where(and(
      eq(policyProjectLinks.policyId, policyId),
      eq(policyProjectLinks.projectId, projectId)
    ));
  }

  async getProjectsForPolicy(policyId: string): Promise<(Project & { impactLevel: string })[]> {
    const links = await db.select().from(policyProjectLinks)
      .where(eq(policyProjectLinks.policyId, policyId));
    if (links.length === 0) return [];
    
    const projectIds = links.map(l => l.projectId);
    const projs = await db.select().from(projects).where(inArray(projects.id, projectIds));
    
    return projs.map(p => {
      const link = links.find(l => l.projectId === p.id);
      return { ...p, impactLevel: link?.impactLevel || 'medium' };
    });
  }

  async getPoliciesForProject(projectId: string): Promise<Policy[]> {
    const links = await db.select().from(policyProjectLinks)
      .where(eq(policyProjectLinks.projectId, projectId));
    if (links.length === 0) return [];
    
    const policyIds = links.map(l => l.policyId);
    return await db.select().from(policies).where(inArray(policies.id, policyIds));
  }

  async seedDemoData(): Promise<void> {
    const existingBUs = await db.select().from(businessUnits).limit(1);
    if (existingBUs.length > 0) return;

    await db.insert(businessUnits).values([
      { id: 'bu-renewables', name: 'NextEra Energy Resources', description: 'Clean energy generation and battery storage', department: 'Renewables Division', owner: 'Rebecca Kujawa' },
      { id: 'bu-fpl', name: 'Florida Power & Light', description: 'Electric utility serving Florida customers', department: 'Utility Division', owner: 'Armando Pimentel' },
      { id: 'bu-transmission', name: 'NextEra Energy Transmission', description: 'Grid modernization and transmission assets', department: 'Infrastructure Division', owner: 'John Ketchum' },
    ]);

    await db.insert(projects).values([
      { id: 'proj-1', name: 'Solar Array Expansion Phase 4', description: 'Adding 500MW of solar capacity', status: 'active', businessUnitId: 'bu-renewables' },
      { id: 'proj-2', name: 'Smart Grid Modernization', description: 'Next-gen smart meter and grid automation', status: 'active', businessUnitId: 'bu-fpl' },
      { id: 'proj-3', name: 'Green Hydrogen Pilot', description: 'Testing industrial hydrogen production', status: 'active', businessUnitId: 'bu-renewables' },
      { id: 'proj-4', name: 'Substation Digitization', description: 'IoT sensor deployment in Florida grid', status: 'active', businessUnitId: 'bu-fpl' },
      { id: 'proj-5', name: 'Wind Asset Optimization', description: 'AI-driven turbine performance tuning', status: 'active', businessUnitId: 'bu-renewables' },
      { id: 'proj-6', name: 'Battery Storage Utility Scale', description: 'Large scale BESS deployment', status: 'active', businessUnitId: 'bu-transmission' },
    ]);
    
    await this.seedPortfolioMetrics();
  }
  
  async seedPortfolioMetrics(): Promise<void> {
    const existingMetrics = await db.select().from(projectMetrics).limit(1);
    if (existingMetrics.length > 0) return;
    
    const portfolioMetrics = [
      { projectId: 'portfolio-nextera', projectName: 'NextEra Portfolio', metricKey: 'renewable_gw', metricName: 'Renewable Capacity (GW)', currentValue: '45.2', threshold: '40.0', criticalThreshold: '35.0', direction: 'higher_is_better', agentOwner: 'planning' },
      { projectId: 'portfolio-nextera', projectName: 'NextEra Portfolio', metricKey: 'grid_uptime', metricName: 'Grid Reliability Index', currentValue: '99.98', threshold: '99.95', criticalThreshold: '99.90', direction: 'higher_is_better', agentOwner: 'finops' },
      { projectId: 'portfolio-nextera', projectName: 'NextEra Portfolio', metricKey: 'decarbonization', metricName: 'Carbon Intensity Reduction', currentValue: '12.5', threshold: '10.0', criticalThreshold: '5.0', direction: 'higher_is_better', agentOwner: 'okr' },
      { projectId: 'portfolio-nextera', projectName: 'NextEra Portfolio', metricKey: 'change_adoption', metricName: 'Change Adoption Rate', currentValue: '0.78', threshold: '0.75', criticalThreshold: '0.60', direction: 'higher_is_better', agentOwner: 'ocm' },
      { projectId: 'portfolio-nextera', projectName: 'NextEra Portfolio', metricKey: 'sprint_velocity', metricName: 'Sprint Velocity Variance', currentValue: '0.08', threshold: '0.15', criticalThreshold: '0.25', direction: 'lower_is_better', agentOwner: 'planning' },
      { projectId: 'proj-solar-expansion', projectName: 'Solar Array Expansion Phase 4', metricKey: 'spi', metricName: 'Schedule Performance Index', currentValue: '0.94', threshold: '0.95', criticalThreshold: '0.85', direction: 'higher_is_better', agentOwner: 'planning' },
      { projectId: 'proj-solar-expansion', projectName: 'Solar Array Expansion Phase 4', metricKey: 'cpi', metricName: 'Cost Performance Index', currentValue: '0.88', threshold: '0.92', criticalThreshold: '0.80', direction: 'higher_is_better', agentOwner: 'finops' },
      { projectId: 'proj-smart-grid', projectName: 'Smart Grid Modernization', metricKey: 'spi', metricName: 'Schedule Performance Index', currentValue: '0.91', threshold: '0.95', criticalThreshold: '0.85', direction: 'higher_is_better', agentOwner: 'planning' },
      { projectId: 'proj-smart-grid', projectName: 'Smart Grid Modernization', metricKey: 'cpi', metricName: 'Cost Performance Index', currentValue: '0.82', threshold: '0.92', criticalThreshold: '0.80', direction: 'higher_is_better', agentOwner: 'finops' },
      { projectId: 'proj-battery-storage', projectName: 'Battery Storage Utility Scale', metricKey: 'sprint_velocity', metricName: 'Sprint Velocity Variance', currentValue: '0.12', threshold: '0.15', criticalThreshold: '0.25', direction: 'lower_is_better', agentOwner: 'planning' },
    ];
    
    for (const metric of portfolioMetrics) {
      await db.insert(projectMetrics).values(metric);
    }
    console.log('[Storage] Seeded portfolio metrics');
  }

  async getAgentMemory(agentId?: string, limit: number = 100): Promise<AgentMemory[]> {
    if (agentId) {
      return await db.select().from(agentMemory)
        .where(eq(agentMemory.agentId, agentId))
        .orderBy(desc(agentMemory.createdAt))
        .limit(limit);
    }
    return await db.select().from(agentMemory)
      .orderBy(desc(agentMemory.createdAt))
      .limit(limit);
  }

  async createAgentMemory(memory: InsertAgentMemory): Promise<AgentMemory> {
    const result = await db.insert(agentMemory).values(memory).returning();
    return result[0];
  }

  async getAgentPatterns(targetType?: string): Promise<AgentPattern[]> {
    if (targetType) {
      return await db.select().from(agentPatterns)
        .where(eq(agentPatterns.targetType, targetType))
        .orderBy(desc(agentPatterns.lastObserved));
    }
    return await db.select().from(agentPatterns)
      .orderBy(desc(agentPatterns.lastObserved));
  }

  async createOrUpdateAgentPattern(pattern: InsertAgentPattern): Promise<AgentPattern> {
    const existing = await db.select().from(agentPatterns)
      .where(and(
        eq(agentPatterns.patternType, pattern.patternType),
        eq(agentPatterns.targetType, pattern.targetType),
        eq(agentPatterns.targetIdentifier, pattern.targetIdentifier)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      const updated = await db.update(agentPatterns)
        .set({
          occurrences: String(parseInt(existing[0].occurrences || '1') + 1),
          confidence: String(Math.min(0.95, parseFloat(existing[0].confidence || '0.5') + 0.05)),
          lastObserved: new Date()
        })
        .where(eq(agentPatterns.id, existing[0].id))
        .returning();
      return updated[0];
    }
    
    const result = await db.insert(agentPatterns).values(pattern).returning();
    return result[0];
  }

  async getAgentTasks(agentId?: string, status?: string): Promise<AgentTaskQueue[]> {
    let query = db.select().from(agentTaskQueue);
    
    if (agentId && status) {
      return await query
        .where(and(
          eq(agentTaskQueue.assignedAgent, agentId),
          eq(agentTaskQueue.status, status)
        ))
        .orderBy(desc(agentTaskQueue.createdAt));
    } else if (agentId) {
      return await query
        .where(eq(agentTaskQueue.assignedAgent, agentId))
        .orderBy(desc(agentTaskQueue.createdAt));
    } else if (status) {
      return await query
        .where(eq(agentTaskQueue.status, status))
        .orderBy(desc(agentTaskQueue.createdAt));
    }
    
    return await query.orderBy(desc(agentTaskQueue.createdAt));
  }

  async createAgentTask(task: InsertAgentTaskQueue): Promise<AgentTaskQueue> {
    const result = await db.insert(agentTaskQueue).values(task).returning();
    return result[0];
  }

  async updateAgentTaskStatus(taskId: string, status: string): Promise<void> {
    await db.update(agentTaskQueue)
      .set({ 
        status,
        resolvedAt: status === 'completed' || status === 'cancelled' ? new Date() : undefined
      })
      .where(eq(agentTaskQueue.id, taskId));
  }

  async getInterventions(status?: string): Promise<Intervention[]> {
    if (status) {
      return await db.select().from(interventions)
        .where(eq(interventions.status, status))
        .orderBy(desc(interventions.createdAt));
    }
    return await db.select().from(interventions)
      .orderBy(desc(interventions.createdAt));
  }

  async createIntervention(intervention: InsertIntervention): Promise<Intervention> {
    const result = await db.insert(interventions).values(intervention).returning();
    return result[0];
  }

  async updateInterventionStatus(id: string, status: string, userId?: string): Promise<Intervention> {
    const updates: any = { status };
    if (status === 'approved') {
      updates.approvedAt = new Date();
      updates.approvedBy = userId || 'system';
    } else if (status === 'dismissed') {
      updates.dismissedAt = new Date();
      updates.dismissedBy = userId || 'system';
    }
    const result = await db.update(interventions)
      .set(updates)
      .where(eq(interventions.id, id))
      .returning();
    return result[0];
  }

  async getDiscussions(status?: string): Promise<AgentDiscussion[]> {
    if (status) {
      return await db.select().from(agentDiscussions)
        .where(eq(agentDiscussions.status, status))
        .orderBy(desc(agentDiscussions.createdAt));
    }
    return await db.select().from(agentDiscussions)
      .orderBy(desc(agentDiscussions.createdAt));
  }

  async createDiscussion(discussion: InsertAgentDiscussion): Promise<AgentDiscussion> {
    const result = await db.insert(agentDiscussions).values(discussion).returning();
    return result[0];
  }

  async getDiscussionMessages(discussionId: string): Promise<DiscussionMessage[]> {
    return await db.select().from(discussionMessages)
      .where(eq(discussionMessages.discussionId, discussionId))
      .orderBy(discussionMessages.createdAt);
  }

  async addDiscussionMessage(message: InsertDiscussionMessage): Promise<DiscussionMessage> {
    const result = await db.insert(discussionMessages).values(message).returning();
    return result[0];
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetric[]> {
    return await db.select().from(projectMetrics)
      .where(eq(projectMetrics.projectId, projectId))
      .orderBy(projectMetrics.metricKey);
  }

  async getAllProjectMetrics(): Promise<ProjectMetric[]> {
    return await db.select().from(projectMetrics)
      .orderBy(desc(projectMetrics.lastUpdated));
  }

  async upsertProjectMetric(metric: InsertProjectMetric): Promise<ProjectMetric> {
    const existing = await db.select().from(projectMetrics)
      .where(and(
        eq(projectMetrics.projectId, metric.projectId),
        eq(projectMetrics.metricKey, metric.metricKey)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      const result = await db.update(projectMetrics)
        .set({
          ...metric,
          previousValue: existing[0].currentValue,
          lastUpdated: new Date()
        })
        .where(eq(projectMetrics.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(projectMetrics).values(metric).returning();
      return result[0];
    }
  }

  async getAgentActivityLog(limit?: number): Promise<AgentActivityLog[]> {
    const query = db.select().from(agentActivityLog).orderBy(desc(agentActivityLog.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createAgentActivityLog(activity: InsertAgentActivityLog): Promise<AgentActivityLog> {
    const result = await db.insert(agentActivityLog).values(activity).returning();
    return result[0];
  }

  async clearAgentActivityLog(): Promise<void> {
    await db.delete(agentActivityLog);
  }

  async getAlerts(status?: string, category?: string): Promise<Alert[]> {
    let query = db.select().from(alerts).orderBy(desc(alerts.createdAt));
    if (status && category) {
      return await db.select().from(alerts)
        .where(and(eq(alerts.status, status), eq(alerts.category, category)))
        .orderBy(desc(alerts.createdAt));
    } else if (status) {
      return await db.select().from(alerts)
        .where(eq(alerts.status, status))
        .orderBy(desc(alerts.createdAt));
    } else if (category) {
      return await db.select().from(alerts)
        .where(eq(alerts.category, category))
        .orderBy(desc(alerts.createdAt));
    }
    return await query;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
  }

  async updateAlertStatus(id: string, status: string, userId?: string): Promise<Alert> {
    const updates: any = { status };
    if (status === 'acknowledged') {
      updates.acknowledgedBy = userId;
      updates.acknowledgedAt = new Date();
    } else if (status === 'resolved') {
      updates.resolvedBy = userId;
      updates.resolvedAt = new Date();
    }
    const result = await db.update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return result[0];
  }

  async clearInterventions(): Promise<void> {
    await db.delete(interventions);
  }

  async clearDivisions(): Promise<void> {
    // Clear in order due to foreign key constraints
    await db.delete(divisionRisks);
    await db.delete(divisionOkrs);
    await db.delete(divisionKpis);
    await db.delete(divisions);
    console.log("[Storage] Cleared all division data");
  }

  async forceSeedDivisions(): Promise<void> {
    await this.clearDivisions();
    // Now seed - the existing check will pass since we cleared
    const divisionData: InsertDivision[] = [
      {
        id: "fpl",
        name: "Florida Power & Light",
        ceo: "Armando Pimentel",
        profit2023: 4850,
        profit2024: 5200,
        changePercent: 7,
        description: "Rate-regulated electric utility serving Florida. One of the largest electric utilities in the U.S. with 35,052 MW net generating capacity.",
        color: "#0072CE"
      },
      {
        id: "neer",
        name: "NextEra Energy Resources",
        ceo: "Rebecca Kujawa",
        profit2023: 2100,
        profit2024: 2350,
        changePercent: 12,
        description: "World's largest generator of renewable energy from wind and solar. Leading battery storage provider with 33,410 MW net generating capacity.",
        color: "#00A651"
      },
      {
        id: "corporate-other",
        name: "Corporate & Other",
        ceo: "John Ketchum",
        profit2023: 450,
        profit2024: 480,
        changePercent: 7,
        description: "Corporate functions including finance, legal, IT, human resources, and other shared services supporting NextEra Energy operations.",
        color: "#8B5CF6"
      }
    ];

    for (const div of divisionData) {
      await db.insert(divisions).values(div);
    }

    // Seed KPIs for FPL
    const fplKpis: InsertDivisionKpi[] = [
      { divisionId: "fpl", name: "Operating Revenue", value2023: "17200", value2024: "18500", target2025: "19500", unit: "$m", trend: "up", status: "on-track" },
      { divisionId: "fpl", name: "Net Generating Capacity", value2023: "33500", value2024: "35052", target2025: "37000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "fpl", name: "Customer Accounts", value2023: "5.7", value2024: "5.9", target2025: "6.1", unit: "m", trend: "up", status: "on-track" },
      { divisionId: "fpl", name: "System Reliability", value2023: "99.96", value2024: "99.98", target2025: "99.99", unit: "%", trend: "up", status: "on-track" }
    ];

    for (const kpi of fplKpis) {
      await db.insert(divisionKpis).values(kpi);
    }

    // Seed KPIs for NEER
    const neerKpis: InsertDivisionKpi[] = [
      { divisionId: "neer", name: "Operating Revenue", value2023: "6200", value2024: "6800", target2025: "7500", unit: "$m", trend: "up", status: "on-track" },
      { divisionId: "neer", name: "Wind Capacity", value2023: "21000", value2024: "22500", target2025: "25000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "neer", name: "Solar Capacity", value2023: "5800", value2024: "7200", target2025: "9000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "neer", name: "Battery Storage", value2023: "2800", value2024: "3700", target2025: "5000", unit: "MW", trend: "up", status: "on-track" }
    ];

    for (const kpi of neerKpis) {
      await db.insert(divisionKpis).values(kpi);
    }

    // Seed OKRs
    const divOkrs: InsertDivisionOkr[] = [
      { 
        divisionId: "fpl", 
        objective: "Accelerate grid modernization through automation",
        keyResults: JSON.stringify([
          { result: "Reduce outage duration", progress: 18, target: 5, unit: "minutes" },
          { result: "Increase smart meter coverage", progress: 92, target: 100, unit: "%" },
          { result: "Automate grid switching", progress: 75, target: 95, unit: "%" }
        ]),
        owner: "Armando Pimentel",
        dueDate: "Q4 2025"
      },
      { 
        divisionId: "neer", 
        objective: "Expand renewable energy generation capacity",
        keyResults: JSON.stringify([
          { result: "Add new wind capacity", progress: 1500, target: 3000, unit: "MW" },
          { result: "Deploy solar installations", progress: 1200, target: 2000, unit: "MW" },
          { result: "Secure long-term contracts", progress: 4, target: 8, unit: "GW" }
        ]),
        owner: "Rebecca Kujawa",
        dueDate: "2026"
      }
    ];

    for (const okr of divOkrs) {
      await db.insert(divisionOkrs).values(okr);
    }

    // Seed Risks
    const divRisks: InsertDivisionRisk[] = [
      { divisionId: "fpl", type: "Hurricane", level: "high", description: "Florida exposure to severe weather events", mitigation: "Grid hardening and storm preparation protocols" },
      { divisionId: "fpl", type: "Regulatory", level: "medium", description: "Rate case outcomes and regulatory changes", mitigation: "Proactive regulatory engagement" },
      { divisionId: "neer", type: "Supply Chain", level: "medium", description: "Solar panel and battery component availability", mitigation: "Diversified supplier relationships" },
      { divisionId: "neer", type: "Policy", level: "medium", description: "Changes to renewable energy incentives", mitigation: "Geographic and technology diversification" }
    ];

    for (const risk of divRisks) {
      await db.insert(divisionRisks).values(risk);
    }

    console.log("[Storage] Force reseeded 3 divisions with KPIs, OKRs, and risks");
  }

  async seedDemoInterventions(): Promise<void> {
    const demoInterventions: InsertIntervention[] = [
      {
        type: 'budget',
        severity: 'critical',
        title: '[AUTONOMOUS] Budget Overrun Detected',
        description: 'FinOps Agent detected CPI dropped below 0.85 threshold on grid modernization. Automatic cost analysis triggered.',
        projectId: 'nee-fpl-001',
        projectName: 'FPL Grid Modernization & Automation',
        confidence: '0.95',
        suggestedAction: 'Reallocate $2M from contingency reserve and renegotiate smart meter procurement contracts.',
        impact: 'Without intervention, project will exceed budget by $8M by Q2.',
        status: 'pending',
        agentSource: 'FinOps Agent',
        isAutonomous: 'true',
        triggerSource: 'metric_breach'
      },
      {
        type: 'timeline',
        severity: 'critical',
        title: '[AUTONOMOUS] Hurricane Season Schedule Risk',
        description: 'TMO Agent detected SPI at 0.78 - storm hardening must complete before June 1 hurricane season.',
        projectId: 'fpl-storm-hardening',
        projectName: 'FPL Storm Secure Underground Program',
        confidence: '0.92',
        suggestedAction: 'Fast-track critical path activities and add parallel construction crews in Miami-Dade.',
        impact: 'Current trajectory shows 4-week delay to hurricane season deadline.',
        status: 'pending',
        agentSource: 'TMO Agent',
        isAutonomous: 'true',
        triggerSource: 'metric_breach'
      },
      {
        type: 'dependency',
        severity: 'high',
        title: '[AGENT→AGENT] Cross-ART Dependency Risk',
        description: 'Planning Agent escalated to Governance Agent: SCADA integration blocking 3 downstream solar projects.',
        projectId: 'nee-fpl-001',
        projectName: 'FPL Grid Modernization & Automation',
        confidence: '0.88',
        suggestedAction: 'Convene emergency dependency resolution meeting with Grid Resilience and Renewable Generation ARTs.',
        impact: 'Blocking 18 story points across Solar and Battery Storage teams.',
        status: 'pending',
        agentSource: 'Governance Agent',
        isAutonomous: 'true',
        triggerSource: 'agent_escalation',
        escalatedFromAgentId: 'planning'
      },
      {
        type: 'quality',
        severity: 'high',
        title: '[AUTONOMOUS] Quality Gate Failure - NERC CIP',
        description: 'Integrated Management Agent detected cybersecurity test coverage dropped to 62%, below NERC CIP 80% threshold.',
        projectId: 'nee-corp-002',
        projectName: 'NextEra Cybersecurity Enhancement Program',
        confidence: '0.91',
        suggestedAction: 'Pause feature development and allocate sprint capacity to security test coverage for NERC audit.',
        impact: 'Risk of NERC CIP audit findings increased by 40%.',
        status: 'pending',
        agentSource: 'Integrated Management Agent',
        isAutonomous: 'true',
        triggerSource: 'metric_breach'
      },
      {
        type: 'resource',
        severity: 'medium',
        title: '[AUTONOMOUS] Solar Development Team Utilization Warning',
        description: 'OCM Agent detected Solar Development Team velocity declining 15% over last 3 sprints.',
        projectId: 'fpl-solar-expansion',
        projectName: 'FPL SolarTogether Phase III',
        confidence: '0.85',
        suggestedAction: 'Review team capacity and address permitting delay fatigue.',
        impact: 'Continued decline will delay 200MW commissioning by 2 sprints.',
        status: 'pending',
        agentSource: 'OCM Agent',
        isAutonomous: 'true',
        triggerSource: 'agent_detection'
      },
      // Pre-approved self-approved agent actions (Agent Actions tab)
      {
        type: 'budget',
        severity: 'medium',
        title: '[Agent Self Approved] Cloud Infrastructure Optimization',
        description: 'FinOps Agent autonomously renegotiated AWS reserved instances for grid analytics, saving $120K/quarter.',
        projectId: 'nee-corp-001',
        projectName: 'NextEra Enterprise Data Platform',
        confidence: '0.96',
        suggestedAction: 'Applied 3-year reserved instance commitment for SCADA data processing workloads.',
        impact: 'Annual savings of $480K with no service impact.',
        status: 'approved',
        agentSource: 'FinOps Agent',
        isAutonomous: 'true',
        selfApproved: 'true',
        triggerSource: 'agent_detection',
        approvedBy: 'FinOps Agent (Autonomous)'
      },
      {
        type: 'timeline',
        severity: 'medium',
        title: '[Agent Self Approved] Sprint Rebalancing - Battery Storage',
        description: 'TMO Agent automatically redistributed 8 story points from overloaded Storage Solutions Team to Grid Modernization Team.',
        projectId: 'fpl-battery-storage',
        projectName: 'FPL Manatee Battery Storage',
        confidence: '0.93',
        suggestedAction: 'Moved non-critical commissioning stories to available capacity.',
        impact: 'Prevented 2-day delay on critical path items.',
        status: 'approved',
        agentSource: 'TMO Agent',
        isAutonomous: 'true',
        selfApproved: 'true',
        triggerSource: 'agent_detection',
        approvedBy: 'TMO Agent (Autonomous)'
      },
      {
        type: 'quality',
        severity: 'low',
        title: '[Agent Self Approved] Automated Test Suite Expansion',
        description: 'Integrated Management Agent added 23 unit tests to critical SCADA integration module.',
        projectId: 'nee-fpl-001',
        projectName: 'FPL Grid Modernization & Automation',
        confidence: '0.97',
        suggestedAction: 'Generated test cases for uncovered edge cases in substation communication.',
        impact: 'Test coverage increased from 62% to 78%.',
        status: 'approved',
        agentSource: 'Integrated Management Agent',
        isAutonomous: 'true',
        selfApproved: 'true',
        triggerSource: 'agent_detection',
        approvedBy: 'Integrated Management Agent (Autonomous)'
      },
      {
        type: 'resource',
        severity: 'low',
        title: '[Agent Self Approved] Team Communication Optimization',
        description: 'OCM Agent consolidated 3 redundant daily standups into one cross-team sync for wind development.',
        projectId: 'nee-neer-001',
        projectName: 'NEER Wind Portfolio Expansion 2024-2027',
        confidence: '0.89',
        suggestedAction: 'Merged overlapping ceremonies to reduce meeting fatigue.',
        impact: 'Recovered 4.5 hours/week of developer time across teams.',
        status: 'approved',
        agentSource: 'OCM Agent',
        isAutonomous: 'true',
        selfApproved: 'true',
        triggerSource: 'agent_detection',
        approvedBy: 'OCM Agent (Autonomous)'
      }
    ];

    for (const intervention of demoInterventions) {
      await db.insert(interventions).values(intervention);
    }

    const demoActivities: InsertAgentActivityLog[] = [
      // Stream 1: FinOps detecting and acting on budget issues
      {
        eventType: 'detection',
        primaryAgentId: 'finops',
        primaryAgentName: 'FinOps Agent',
        summary: 'Scanning 21 portfolio projects for financial anomalies...',
      },
      {
        eventType: 'detection',
        primaryAgentId: 'finops',
        primaryAgentName: 'FinOps Agent',
        summary: 'Detected CPI breach on Enterprise Data Platform (0.82 < 0.85)',
        details: JSON.stringify({ metric: 'CPI', value: 0.82, threshold: 0.85 })
      },
      {
        eventType: 'agent_to_agent',
        primaryAgentId: 'finops',
        primaryAgentName: 'FinOps Agent',
        secondaryAgentId: 'tmo',
        secondaryAgentName: 'TMO Agent',
        summary: 'Notifying TMO Agent of budget variance - may impact schedule',
      },
      {
        eventType: 'autonomous_action',
        primaryAgentId: 'finops',
        primaryAgentName: 'FinOps Agent',
        summary: 'Created intervention for budget overrun - awaiting human approval',
      },
      // Stream 2: TMO detecting schedule slippage
      {
        eventType: 'detection',
        primaryAgentId: 'tmo',
        primaryAgentName: 'TMO Agent',
        summary: 'Analyzing sprint velocity trends across Climate Analytics...',
      },
      {
        eventType: 'detection',
        primaryAgentId: 'tmo',
        primaryAgentName: 'TMO Agent',
        summary: 'Detected SPI breach on Climate Analytics (0.78 < 0.85)',
        details: JSON.stringify({ metric: 'SPI', value: 0.78, threshold: 0.85 })
      },
      {
        eventType: 'agent_to_agent',
        primaryAgentId: 'tmo',
        primaryAgentName: 'TMO Agent',
        secondaryAgentId: 'governance',
        secondaryAgentName: 'Governance Agent',
        summary: 'Alerting Governance - regulatory deadline at risk',
      },
      {
        eventType: 'autonomous_action',
        primaryAgentId: 'tmo',
        primaryAgentName: 'TMO Agent',
        summary: 'Auto-generated schedule recovery plan for review',
      },
      // Stream 3: Cross-ART dependency chain
      {
        eventType: 'detection',
        primaryAgentId: 'planning',
        primaryAgentName: 'Planning Agent',
        summary: 'Scanning inter-team dependencies across 5 ARTs...',
      },
      {
        eventType: 'agent_to_agent',
        primaryAgentId: 'planning',
        primaryAgentName: 'Planning Agent',
        secondaryAgentId: 'governance',
        secondaryAgentName: 'Governance Agent',
        summary: 'Escalated cross-ART dependency blocking 3 teams',
      },
      {
        eventType: 'agent_to_agent',
        primaryAgentId: 'governance',
        primaryAgentName: 'Governance Agent',
        secondaryAgentId: 'ocm',
        secondaryAgentName: 'OCM Agent',
        summary: 'Requesting change impact assessment for dependency resolution',
      },
      {
        eventType: 'autonomous_action',
        primaryAgentId: 'governance',
        primaryAgentName: 'Governance Agent',
        summary: 'Created high-priority intervention for dependency resolution',
      },
      // Stream 4: Quality monitoring
      {
        eventType: 'detection',
        primaryAgentId: 'integrated',
        primaryAgentName: 'Integrated Management Agent',
        summary: 'Running quality gate checks on Customer 360 Platform...',
      },
      {
        eventType: 'detection',
        primaryAgentId: 'integrated',
        primaryAgentName: 'Integrated Management Agent',
        summary: 'Test coverage dropped to 62% - below 80% threshold',
      },
      {
        eventType: 'agent_to_agent',
        primaryAgentId: 'integrated',
        primaryAgentName: 'Integrated Management Agent',
        secondaryAgentId: 'ocm',
        secondaryAgentName: 'OCM Agent',
        summary: 'Notifying OCM - team may need capacity reallocation',
      },
      // Stream 5: Resource monitoring
      {
        eventType: 'detection',
        primaryAgentId: 'ocm',
        primaryAgentName: 'OCM Agent',
        summary: 'Analyzing team velocity patterns for change fatigue signals...',
      },
      {
        eventType: 'agent_to_agent',
        primaryAgentId: 'ocm',
        primaryAgentName: 'OCM Agent',
        secondaryAgentId: 'finops',
        secondaryAgentName: 'FinOps Agent',
        summary: 'Velocity decline detected - may impact cost projections',
      },
      {
        eventType: 'autonomous_action',
        primaryAgentId: 'ocm',
        primaryAgentName: 'OCM Agent',
        summary: 'Generated change fatigue assessment report',
      }
    ];

    for (const activity of demoActivities) {
      await db.insert(agentActivityLog).values(activity);
    }
    
    // Seed agent discussions and messages
    await this.seedAgentDiscussions();
    await this.seedAgentTaskQueue();
  }

  async seedAgentDiscussions(): Promise<void> {
    // Check if discussions already exist
    const existing = await db.select().from(agentDiscussions).limit(1);
    if (existing.length > 0) return;

    const demoDiscussions = [
      {
        id: 'disc-001',
        topic: 'Q1 Budget Reallocation for Data Center Initiative',
        projectId: 'nee-google-001',
        projectName: 'Google Cloud Data Center Partnership',
        priority: 'critical',
        status: 'active',
        consensusReached: 'false'
      },
      {
        id: 'disc-002',
        topic: 'Cross-ART Dependency Resolution - API Platform Blocking Teams',
        projectId: 'nee-grid-mod',
        projectName: 'Grid Modernization Program',
        priority: 'high',
        status: 'active',
        consensusReached: 'false'
      },
      {
        id: 'disc-003',
        topic: 'Hurricane Season Preparedness - Resource Allocation',
        projectId: 'nee-storm-001',
        projectName: 'FPL Storm Hardening Phase III',
        priority: 'high',
        status: 'resolved',
        consensusReached: 'true',
        resolution: 'Approved 15% contingency increase with phased resource deployment'
      },
      {
        id: 'disc-004',
        topic: 'AI/ML Model Governance for Grid Analytics',
        projectId: 'nee-ai-grid',
        projectName: 'AI-Powered Grid Analytics',
        priority: 'medium',
        status: 'active',
        consensusReached: 'false'
      },
      {
        id: 'disc-005',
        topic: 'Sprint Velocity Decline - Change Fatigue Assessment',
        projectId: 'nee-digital-001',
        projectName: 'Digital Transformation Program',
        priority: 'medium',
        status: 'resolved',
        consensusReached: 'true',
        resolution: 'Implemented team wellness check and reduced meeting load by 30%'
      }
    ];

    for (const disc of demoDiscussions) {
      await db.insert(agentDiscussions).values(disc);
    }

    const demoMessages = [
      // Discussion 1: Budget reallocation
      { discussionId: 'disc-001', agentId: 'finops', agentName: 'FinOps Agent', messageType: 'analysis', content: 'Current spend rate on Google Data Center Partnership is 18% above forecast. Q1 burn rate at $127M vs $107M planned. Recommend immediate cost review.' },
      { discussionId: 'disc-001', agentId: 'planning', agentName: 'Planning Agent', messageType: 'analysis', content: 'Accelerated timeline is driving the overspend. We pulled forward 3 workstreams to meet Google milestone dates. This was approved in December steering committee.' },
      { discussionId: 'disc-001', agentId: 'tmo', agentName: 'TMO Agent', messageType: 'recommendation', content: 'Based on velocity data, we can absorb 60% of the overspend through efficiency gains in PI-4. Remaining 40% needs budget reallocation from contingency.' },
      { discussionId: 'disc-001', agentId: 'governance', agentName: 'Governance Agent', messageType: 'question', content: 'What is the risk to other portfolio projects if we reallocate contingency? Need approval threshold analysis.' },
      { discussionId: 'disc-001', agentId: 'finops', agentName: 'FinOps Agent', messageType: 'analysis', content: 'Reallocation from contingency would reduce portfolio buffer from 15% to 11%. Still within policy guidelines but at lower comfort level.' },
      
      // Discussion 2: Cross-ART dependency
      { discussionId: 'disc-002', agentId: 'planning', agentName: 'Planning Agent', messageType: 'analysis', content: 'API Platform team blocking 3 downstream teams: Solar Analytics, Battery Management, and Customer Portal. Total of 34 story points blocked.' },
      { discussionId: 'disc-002', agentId: 'tmo', agentName: 'TMO Agent', messageType: 'analysis', content: 'API team is at 110% capacity utilization. Cannot absorb additional work without impacting their own commitments.' },
      { discussionId: 'disc-002', agentId: 'ocm', agentName: 'OCM Agent', messageType: 'recommendation', content: 'Recommend temporary resource augmentation. Have identified 2 contractors with relevant API experience available within 2 weeks.' },
      { discussionId: 'disc-002', agentId: 'finops', agentName: 'FinOps Agent', messageType: 'analysis', content: 'Contractor augmentation would cost $85K for 8-week engagement. Cost of delay to downstream teams is estimated at $240K in opportunity cost.' },
      { discussionId: 'disc-002', agentId: 'governance', agentName: 'Governance Agent', messageType: 'action', content: 'Escalating to Portfolio Steering Committee for emergency resource approval. ROI clearly supports intervention.' },
      
      // Discussion 3: Hurricane preparedness (resolved)
      { discussionId: 'disc-003', agentId: 'planning', agentName: 'Planning Agent', messageType: 'analysis', content: 'Hurricane season starts June 1. Current storm hardening progress at 67%. Need to accelerate critical path activities.' },
      { discussionId: 'disc-003', agentId: 'finops', agentName: 'FinOps Agent', messageType: 'analysis', content: 'Acceleration requires $12M additional investment. Propose 15% contingency increase funded from FY25 CapEx reserve.' },
      { discussionId: 'disc-003', agentId: 'ocm', agentName: 'OCM Agent', messageType: 'recommendation', content: 'Phased resource deployment recommended: Critical circuits first (May), secondary circuits (July), tertiary (September).' },
      { discussionId: 'disc-003', agentId: 'governance', agentName: 'Governance Agent', messageType: 'agreement', content: 'Approved phased approach with 15% contingency. Aligns with FPSC regulatory requirements for storm resilience.' },
      
      // Discussion 4: AI/ML Governance
      { discussionId: 'disc-004', agentId: 'governance', agentName: 'Governance Agent', messageType: 'analysis', content: 'AI models for grid load prediction need governance framework. Current models operating without formal model risk management.' },
      { discussionId: 'disc-004', agentId: 'tmo', agentName: 'TMO Agent', messageType: 'question', content: 'What validation requirements are needed before production deployment? NERC CIP compliance implications?' },
      { discussionId: 'disc-004', agentId: 'planning', agentName: 'Planning Agent', messageType: 'recommendation', content: 'Propose adding Model Validation Sprint before each major release. 2-week cycle with defined acceptance criteria.' },
      
      // Discussion 5: Change fatigue (resolved)
      { discussionId: 'disc-005', agentId: 'ocm', agentName: 'OCM Agent', messageType: 'analysis', content: 'Team velocity declined 15% over last 3 sprints. Survey data indicates meeting overload and unclear priorities.' },
      { discussionId: 'disc-005', agentId: 'tmo', agentName: 'TMO Agent', messageType: 'analysis', content: 'Teams have 8.5 hours of recurring meetings per week on average. Industry benchmark is 5-6 hours.' },
      { discussionId: 'disc-005', agentId: 'planning', agentName: 'Planning Agent', messageType: 'recommendation', content: 'Consolidate 3 daily standups into 1 cross-team sync. Cancel duplicate status meetings.' },
      { discussionId: 'disc-005', agentId: 'ocm', agentName: 'OCM Agent', messageType: 'action', content: 'Implementing wellness checks and reducing meeting load by 30%. Will monitor velocity recovery over next 2 sprints.' }
    ];

    for (const msg of demoMessages) {
      await db.insert(discussionMessages).values(msg);
    }
  }

  async seedAgentTaskQueue(): Promise<void> {
    const existing = await db.select().from(agentTaskQueue).limit(1);
    if (existing.length > 0) return;

    const demoTasks = [
      {
        id: 'task-001',
        assignedAgent: 'finops',
        taskType: 'investigate',
        priority: 'high',
        status: 'in_progress',
        targetType: 'project',
        targetId: 'nee-google-001',
        targetName: 'Google Cloud Data Center Partnership',
        description: 'Investigate Q1 budget variance and provide cost optimization recommendations',
        reasoning: 'CPI dropped below 0.90 threshold, triggering automatic investigation',
        delegatedBy: 'VRO Orchestrator'
      },
      {
        id: 'task-002',
        assignedAgent: 'tmo',
        taskType: 'mitigate',
        priority: 'critical',
        status: 'pending',
        targetType: 'project',
        targetId: 'nee-grid-mod',
        targetName: 'Grid Modernization Program',
        description: 'Develop schedule recovery plan for API platform delay impact',
        reasoning: 'SPI at 0.78, critical dependencies at risk',
        delegatedBy: 'Planning Agent',
        conflictsWith: '["task-003"]'
      },
      {
        id: 'task-003',
        assignedAgent: 'ocm',
        taskType: 'notify',
        priority: 'medium',
        status: 'pending',
        targetType: 'team',
        targetId: 'team-api-platform',
        targetName: 'API Platform Team',
        description: 'Communicate capacity constraints and available support options to team leads',
        reasoning: 'Team at 110% utilization, change fatigue signals detected',
        delegatedBy: 'TMO Agent'
      },
      {
        id: 'task-004',
        assignedAgent: 'governance',
        taskType: 'escalate',
        priority: 'high',
        status: 'completed',
        targetType: 'portfolio',
        targetId: 'portfolio-nee-001',
        targetName: 'NextEra Energy Enterprise Transformation',
        description: 'Escalate contractor augmentation request to Portfolio Steering Committee',
        reasoning: 'Emergency resource need with clear ROI justification',
        delegatedBy: 'FinOps Agent'
      },
      {
        id: 'task-005',
        assignedAgent: 'planning',
        taskType: 'investigate',
        priority: 'medium',
        status: 'in_progress',
        targetType: 'epic',
        targetId: 'epic-nee-001',
        targetName: 'Data Center Infrastructure Development',
        description: 'Analyze feature completion trends and update PI forecast',
        reasoning: 'Quarterly planning cycle requires updated projections',
        delegatedBy: 'VRO Orchestrator'
      }
    ];

    for (const task of demoTasks) {
      await db.insert(agentTaskQueue).values(task);
    }
  }

  async getFeatures(projectId: string): Promise<Feature[]> {
    return await db.select().from(features).where(eq(features.projectId, projectId));
  }

  async createFeature(feature: InsertFeature): Promise<Feature> {
    const result = await db.insert(features).values(feature).returning();
    return result[0];
  }

  async getStories(featureId: string): Promise<Story[]> {
    return await db.select().from(stories).where(eq(stories.featureId, featureId));
  }

  async getStoriesByProject(projectId: string): Promise<Story[]> {
    return await db.select().from(stories).where(eq(stories.projectId, projectId));
  }

  async createStory(story: InsertStory): Promise<Story> {
    const result = await db.insert(stories).values(story).returning();
    return result[0];
  }

  async getTasks(storyId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.storyId, storyId));
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async getResources(projectId: string): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.projectId, projectId));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const result = await db.insert(resources).values(resource).returning();
    return result[0];
  }

  async getMilestones(projectId: string): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.projectId, projectId));
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const result = await db.insert(milestones).values(milestone).returning();
    return result[0];
  }

  async getDependencies(projectId: string): Promise<Dependency[]> {
    return await db.select().from(dependencies).where(eq(dependencies.projectId, projectId));
  }

  async createDependency(dependency: InsertDependency): Promise<Dependency> {
    const result = await db.insert(dependencies).values(dependency).returning();
    return result[0];
  }

  async getProjectFinancials(projectId: string): Promise<ProjectFinancials | undefined> {
    const result = await db.select().from(projectFinancials).where(eq(projectFinancials.projectId, projectId)).limit(1);
    return result[0];
  }

  async upsertProjectFinancials(fin: InsertProjectFinancials): Promise<ProjectFinancials> {
    const existing = await this.getProjectFinancials(fin.projectId);
    if (existing) {
      const result = await db.update(projectFinancials).set(fin).where(eq(projectFinancials.projectId, fin.projectId)).returning();
      return result[0];
    }
    const result = await db.insert(projectFinancials).values(fin).returning();
    return result[0];
  }

  async getRisks(projectId: string): Promise<Risk[]> {
    return await db.select().from(risks).where(eq(risks.projectId, projectId));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const result = await db.insert(risks).values(risk).returning();
    return result[0];
  }

  async getFullProject(projectId: string): Promise<{
    project: Project;
    features: Feature[];
    stories: Story[];
    tasks: Task[];
    resources: Resource[];
    milestones: Milestone[];
    dependencies: Dependency[];
    financials: ProjectFinancials | undefined;
    risks: Risk[];
  } | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    const [projectFeatures, projectStories, projectTasks, projectResources, projectMilestones, projectDependencies, projectFinancialsData, projectRisks] = await Promise.all([
      this.getFeatures(projectId),
      this.getStoriesByProject(projectId),
      this.getTasksByProject(projectId),
      this.getResources(projectId),
      this.getMilestones(projectId),
      this.getDependencies(projectId),
      this.getProjectFinancials(projectId),
      this.getRisks(projectId)
    ]);

    return {
      project,
      features: projectFeatures,
      stories: projectStories,
      tasks: projectTasks,
      resources: projectResources,
      milestones: projectMilestones,
      dependencies: projectDependencies,
      financials: projectFinancialsData,
      risks: projectRisks
    };
  }

  async getOkrs(businessUnitId?: string): Promise<Okr[]> {
    if (businessUnitId) {
      return await db.select().from(okrs).where(eq(okrs.businessUnitId, businessUnitId));
    }
    return await db.select().from(okrs);
  }

  async getOkr(id: string): Promise<Okr | undefined> {
    const result = await db.select().from(okrs).where(eq(okrs.id, id)).limit(1);
    return result[0];
  }

  async createOkr(okr: InsertOkr): Promise<Okr> {
    const result = await db.insert(okrs).values(okr).returning();
    return result[0];
  }

  async getKeyResults(okrId: string): Promise<KeyResult[]> {
    return await db.select().from(keyResults).where(eq(keyResults.okrId, okrId));
  }

  async createKeyResult(kr: InsertKeyResult): Promise<KeyResult> {
    const result = await db.insert(keyResults).values(kr).returning();
    return result[0];
  }

  async getOkrsWithKeyResults(): Promise<(Okr & { keyResults: KeyResult[] })[]> {
    const allOkrs = await this.getOkrs();
    const result = await Promise.all(
      allOkrs.map(async (okr) => ({
        ...okr,
        keyResults: await this.getKeyResults(okr.id)
      }))
    );
    return result;
  }

  async getKpis(projectId?: string, businessUnitId?: string): Promise<Kpi[]> {
    if (projectId) {
      return await db.select().from(kpis).where(eq(kpis.projectId, projectId));
    }
    if (businessUnitId) {
      return await db.select().from(kpis).where(eq(kpis.businessUnitId, businessUnitId));
    }
    return await db.select().from(kpis);
  }

  async createKpi(kpi: InsertKpi): Promise<Kpi> {
    const result = await db.insert(kpis).values(kpi).returning();
    return result[0];
  }

  // SAFe Ontology Methods
  async getStrategicThemes(portfolioId?: string): Promise<StrategicTheme[]> {
    if (portfolioId) {
      return await db.select().from(strategicThemes).where(eq(strategicThemes.portfolioId, portfolioId));
    }
    return await db.select().from(strategicThemes);
  }

  async createStrategicTheme(theme: InsertStrategicTheme): Promise<StrategicTheme> {
    const result = await db.insert(strategicThemes).values(theme).returning();
    return result[0];
  }

  async backfillStrategicThemesPortfolioId(): Promise<number> {
    const allThemes = await this.getStrategicThemes();
    const orphanThemes = allThemes.filter(t => !t.portfolioId);
    if (orphanThemes.length === 0) return 0;
    
    const allPortfolios = await this.getPortfolios();
    const primaryPortfolio = allPortfolios.find(p => p.id === 'portfolio-nee-001') || allPortfolios[0];
    if (!primaryPortfolio) return 0;
    
    for (const theme of orphanThemes) {
      await db.update(strategicThemes).set({ portfolioId: primaryPortfolio.id }).where(eq(strategicThemes.id, theme.id));
    }
    return orphanThemes.length;
  }

  async getPortfolios(): Promise<Portfolio[]> {
    return await db.select().from(portfolios);
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    const result = await db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
    return result[0];
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const result = await db.insert(portfolios).values(portfolio).returning();
    return result[0];
  }

  async getValueStreams(portfolioId?: string): Promise<ValueStream[]> {
    if (portfolioId) {
      return await db.select().from(valueStreams).where(eq(valueStreams.portfolioId, portfolioId));
    }
    return await db.select().from(valueStreams);
  }

  async createValueStream(vs: InsertValueStream): Promise<ValueStream> {
    const result = await db.insert(valueStreams).values(vs).returning();
    return result[0];
  }

  async getArts(valueStreamId?: string): Promise<Art[]> {
    if (valueStreamId) {
      return await db.select().from(arts).where(eq(arts.valueStreamId, valueStreamId));
    }
    return await db.select().from(arts);
  }

  async createArt(art: InsertArt): Promise<Art> {
    const result = await db.insert(arts).values(art).returning();
    return result[0];
  }

  async getTeams(artId?: string): Promise<Team[]> {
    if (artId) {
      return await db.select().from(teams).where(eq(teams.artId, artId));
    }
    return await db.select().from(teams);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async getProgramIncrements(artId?: string): Promise<ProgramIncrement[]> {
    if (artId) {
      return await db.select().from(programIncrements).where(eq(programIncrements.artId, artId));
    }
    return await db.select().from(programIncrements);
  }

  async createProgramIncrement(pi: InsertProgramIncrement): Promise<ProgramIncrement> {
    const result = await db.insert(programIncrements).values(pi).returning();
    return result[0];
  }

  async getEpics(portfolioId?: string, valueStreamId?: string): Promise<Epic[]> {
    if (portfolioId && valueStreamId) {
      return await db.select().from(epics).where(and(eq(epics.portfolioId, portfolioId), eq(epics.valueStreamId, valueStreamId)));
    }
    if (portfolioId) {
      return await db.select().from(epics).where(eq(epics.portfolioId, portfolioId));
    }
    if (valueStreamId) {
      return await db.select().from(epics).where(eq(epics.valueStreamId, valueStreamId));
    }
    return await db.select().from(epics);
  }

  async createEpic(epic: InsertEpic): Promise<Epic> {
    const result = await db.insert(epics).values(epic).returning();
    return result[0];
  }

  async getCapabilities(epicId?: string): Promise<Capability[]> {
    if (epicId) {
      return await db.select().from(capabilities).where(eq(capabilities.epicId, epicId));
    }
    return await db.select().from(capabilities);
  }

  async createCapability(cap: InsertCapability): Promise<Capability> {
    const result = await db.insert(capabilities).values(cap).returning();
    return result[0];
  }

  async getSprints(piId?: string, teamId?: string): Promise<Sprint[]> {
    if (piId && teamId) {
      return await db.select().from(sprints).where(and(eq(sprints.programIncrementId, piId), eq(sprints.teamId, teamId)));
    }
    if (piId) {
      return await db.select().from(sprints).where(eq(sprints.programIncrementId, piId));
    }
    if (teamId) {
      return await db.select().from(sprints).where(eq(sprints.teamId, teamId));
    }
    return await db.select().from(sprints);
  }

  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const result = await db.insert(sprints).values(sprint).returning();
    return result[0];
  }

  // MCP & Integration Methods
  async getSourceSystems(): Promise<SourceSystem[]> {
    return await db.select().from(sourceSystems);
  }

  async getSourceSystem(id: string): Promise<SourceSystem | undefined> {
    const results = await db.select().from(sourceSystems).where(eq(sourceSystems.id, id));
    return results[0];
  }

  async createSourceSystem(ss: InsertSourceSystem): Promise<SourceSystem> {
    const result = await db.insert(sourceSystems).values(ss).returning();
    return result[0];
  }

  async updateSourceSystemStatus(id: string, status: string): Promise<void> {
    await db.update(sourceSystems).set({ status, lastConnectedAt: new Date() }).where(eq(sourceSystems.id, id));
  }

  async getMcpAdapters(sourceSystemId?: string): Promise<McpAdapter[]> {
    if (sourceSystemId) {
      return await db.select().from(mcpAdapters).where(eq(mcpAdapters.sourceSystemId, sourceSystemId));
    }
    return await db.select().from(mcpAdapters);
  }

  async createMcpAdapter(adapter: InsertMcpAdapter): Promise<McpAdapter> {
    const result = await db.insert(mcpAdapters).values(adapter).returning();
    return result[0];
  }

  async getFieldMappings(sourceSystemId?: string): Promise<FieldMapping[]> {
    if (sourceSystemId) {
      return await db.select().from(fieldMappings).where(eq(fieldMappings.sourceSystemId, sourceSystemId));
    }
    return await db.select().from(fieldMappings);
  }

  async createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping> {
    const result = await db.insert(fieldMappings).values(mapping).returning();
    return result[0];
  }

  async getIngestionJobs(sourceSystemId?: string): Promise<IngestionJob[]> {
    if (sourceSystemId) {
      return await db.select().from(ingestionJobs).where(eq(ingestionJobs.sourceSystemId, sourceSystemId)).orderBy(desc(ingestionJobs.createdAt));
    }
    return await db.select().from(ingestionJobs).orderBy(desc(ingestionJobs.createdAt));
  }

  async createIngestionJob(job: InsertIngestionJob): Promise<IngestionJob> {
    const result = await db.insert(ingestionJobs).values(job).returning();
    return result[0];
  }

  async updateIngestionJobStatus(id: string, status: string, stats?: { processed?: number; created?: number; updated?: number; failed?: number }): Promise<void> {
    const updates: any = { status };
    if (status === 'running') updates.startedAt = new Date();
    if (status === 'completed' || status === 'failed') updates.completedAt = new Date();
    if (stats) {
      if (stats.processed !== undefined) updates.itemsProcessed = String(stats.processed);
      if (stats.created !== undefined) updates.itemsCreated = String(stats.created);
      if (stats.updated !== undefined) updates.itemsUpdated = String(stats.updated);
      if (stats.failed !== undefined) updates.itemsFailed = String(stats.failed);
    }
    await db.update(ingestionJobs).set(updates).where(eq(ingestionJobs.id, id));
  }

  async getMcpToolMappings(adapterId?: string): Promise<McpToolMapping[]> {
    if (adapterId) {
      return await db.select().from(mcpToolMappings).where(eq(mcpToolMappings.mcpAdapterId, adapterId));
    }
    return await db.select().from(mcpToolMappings);
  }

  async createMcpToolMapping(mapping: InsertMcpToolMapping): Promise<McpToolMapping> {
    const result = await db.insert(mcpToolMappings).values(mapping).returning();
    return result[0];
  }

  async getSafeHierarchy(portfolioId: string): Promise<{
    portfolio: Portfolio;
    valueStreams: (ValueStream & { arts: (Art & { teams: Team[]; programIncrements: ProgramIncrement[] })[] })[];
    epics: Epic[];
  } | undefined> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) return undefined;

    const portfolioValueStreams = await this.getValueStreams(portfolioId);
    const portfolioEpics = await this.getEpics(portfolioId);

    const valueStreamsWithArts = await Promise.all(
      portfolioValueStreams.map(async (vs) => {
        const vsArts = await this.getArts(vs.id);
        const artsWithTeamsAndPIs = await Promise.all(
          vsArts.map(async (art) => ({
            ...art,
            teams: await this.getTeams(art.id),
            programIncrements: await this.getProgramIncrements(art.id)
          }))
        );
        return {
          ...vs,
          arts: artsWithTeamsAndPIs
        };
      })
    );

    return {
      portfolio,
      valueStreams: valueStreamsWithArts,
      epics: portfolioEpics
    };
  }

  // Division Methods
  async getDivisions(): Promise<Division[]> {
    return await db.select().from(divisions);
  }

  async getDivision(id: string): Promise<Division | undefined> {
    const result = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
    return result[0];
  }

  async createDivision(division: InsertDivision): Promise<Division> {
    const result = await db.insert(divisions).values(division).returning();
    return result[0];
  }

  async getDivisionKpis(divisionId: string): Promise<DivisionKpi[]> {
    return await db.select().from(divisionKpis).where(eq(divisionKpis.divisionId, divisionId));
  }

  async createDivisionKpi(kpi: InsertDivisionKpi): Promise<DivisionKpi> {
    const result = await db.insert(divisionKpis).values(kpi).returning();
    return result[0];
  }

  async getDivisionOkrs(divisionId: string): Promise<DivisionOkr[]> {
    return await db.select().from(divisionOkrs).where(eq(divisionOkrs.divisionId, divisionId));
  }

  async createDivisionOkr(okr: InsertDivisionOkr): Promise<DivisionOkr> {
    const result = await db.insert(divisionOkrs).values(okr).returning();
    return result[0];
  }

  async getDivisionRisks(divisionId: string): Promise<DivisionRisk[]> {
    return await db.select().from(divisionRisks).where(eq(divisionRisks.divisionId, divisionId));
  }

  async createDivisionRisk(risk: InsertDivisionRisk): Promise<DivisionRisk> {
    const result = await db.insert(divisionRisks).values(risk).returning();
    return result[0];
  }

  async getFullDivision(divisionId: string): Promise<{
    division: Division;
    kpis: DivisionKpi[];
    okrs: DivisionOkr[];
    risks: DivisionRisk[];
  } | undefined> {
    const division = await this.getDivision(divisionId);
    if (!division) return undefined;
    
    const [kpis, okrs, risks] = await Promise.all([
      this.getDivisionKpis(divisionId),
      this.getDivisionOkrs(divisionId),
      this.getDivisionRisks(divisionId)
    ]);
    
    return { division, kpis, okrs, risks };
  }

  async seedDivisions(): Promise<void> {
    const existing = await db.select().from(divisions).limit(1);
    if (existing.length > 0) return;

    const divisionData: InsertDivision[] = [
      {
        id: "fpl",
        name: "Florida Power & Light",
        ceo: "Armando Pimentel",
        profit2023: 4850,
        profit2024: 5200,
        changePercent: 7,
        description: "Rate-regulated electric utility serving Florida. One of the largest electric utilities in the U.S. with 35,052 MW net generating capacity.",
        color: "#0072CE"
      },
      {
        id: "neer",
        name: "NextEra Energy Resources",
        ceo: "Rebecca Kujawa",
        profit2023: 2100,
        profit2024: 2350,
        changePercent: 12,
        description: "World's largest generator of renewable energy from wind and solar. Leading battery storage provider with 33,410 MW net generating capacity.",
        color: "#00A651"
      },
      {
        id: "corporate-other",
        name: "Corporate & Other",
        ceo: "John Ketchum",
        profit2023: 450,
        profit2024: 480,
        changePercent: 7,
        description: "Corporate functions including finance, legal, IT, human resources, and other shared services supporting NextEra Energy operations.",
        color: "#8B5CF6"
      }
    ];

    for (const div of divisionData) {
      await db.insert(divisions).values(div);
    }

    // Seed KPIs for FPL
    const fplKpis: InsertDivisionKpi[] = [
      { divisionId: "fpl", name: "Operating Revenue", value2023: "17200", value2024: "18500", target2025: "19500", unit: "$m", trend: "up", status: "on-track" },
      { divisionId: "fpl", name: "Net Generating Capacity", value2023: "33500", value2024: "35052", target2025: "37000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "fpl", name: "Customer Accounts", value2023: "5.7", value2024: "5.9", target2025: "6.1", unit: "m", trend: "up", status: "on-track" },
      { divisionId: "fpl", name: "System Reliability", value2023: "99.96", value2024: "99.98", target2025: "99.99", unit: "%", trend: "up", status: "on-track" }
    ];

    for (const kpi of fplKpis) {
      await db.insert(divisionKpis).values(kpi);
    }

    // Seed KPIs for NEER
    const neerKpis: InsertDivisionKpi[] = [
      { divisionId: "neer", name: "Operating Revenue", value2023: "6200", value2024: "6800", target2025: "7500", unit: "$m", trend: "up", status: "on-track" },
      { divisionId: "neer", name: "Wind Capacity", value2023: "21000", value2024: "22500", target2025: "25000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "neer", name: "Solar Capacity", value2023: "5800", value2024: "7200", target2025: "9000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "neer", name: "Battery Storage", value2023: "2800", value2024: "3700", target2025: "5000", unit: "MW", trend: "up", status: "on-track" }
    ];

    for (const kpi of neerKpis) {
      await db.insert(divisionKpis).values(kpi);
    }

    // Seed OKRs
    const divOkrs: InsertDivisionOkr[] = [
      { 
        divisionId: "fpl", 
        objective: "Accelerate grid modernization through automation",
        keyResults: JSON.stringify([
          { result: "Reduce outage duration", progress: 18, target: 5, unit: "minutes" },
          { result: "Increase smart meter coverage", progress: 92, target: 100, unit: "%" },
          { result: "Automate grid switching", progress: 75, target: 95, unit: "%" }
        ]),
        owner: "Armando Pimentel",
        dueDate: "Q4 2025"
      },
      { 
        divisionId: "neer", 
        objective: "Expand renewable energy generation capacity",
        keyResults: JSON.stringify([
          { result: "Add new wind capacity", progress: 1500, target: 3000, unit: "MW" },
          { result: "Deploy solar installations", progress: 1200, target: 2000, unit: "MW" },
          { result: "Secure long-term contracts", progress: 4, target: 8, unit: "GW" }
        ]),
        owner: "Rebecca Kujawa",
        dueDate: "2026"
      }
    ];

    for (const okr of divOkrs) {
      await db.insert(divisionOkrs).values(okr);
    }

    // Seed Risks
    const divRisks: InsertDivisionRisk[] = [
      { divisionId: "fpl", type: "Hurricane", level: "high", description: "Florida exposure to severe weather events", mitigation: "Grid hardening and storm preparation protocols" },
      { divisionId: "fpl", type: "Regulatory", level: "medium", description: "Rate case outcomes and regulatory changes", mitigation: "Proactive regulatory engagement" },
      { divisionId: "neer", type: "Supply Chain", level: "medium", description: "Solar panel and battery component availability", mitigation: "Diversified supplier relationships" },
      { divisionId: "neer", type: "Policy", level: "medium", description: "Changes to renewable energy incentives", mitigation: "Geographic and technology diversification" }
    ];

    for (const risk of divRisks) {
      await db.insert(divisionRisks).values(risk);
    }

    console.log("[Seed] Seeded 3 divisions with KPIs, OKRs, and risks");
  }

  // ============================================================================
  // Company Overview Methods
  // ============================================================================
  
  async getCompanyOverview(): Promise<CompanyOverview | undefined> {
    const result = await db.select().from(companyOverview).limit(1);
    return result[0];
  }

  async createCompanyOverview(overview: InsertCompanyOverview): Promise<CompanyOverview> {
    const result = await db.insert(companyOverview).values(overview).returning();
    return result[0];
  }

  // ============================================================================
  // Climate Metrics Methods
  // ============================================================================
  
  async getClimateMetrics(category?: string): Promise<ClimateMetric[]> {
    if (category) {
      return await db.select().from(climateMetrics).where(eq(climateMetrics.category, category));
    }
    return await db.select().from(climateMetrics);
  }

  async createClimateMetric(metric: InsertClimateMetric): Promise<ClimateMetric> {
    const result = await db.insert(climateMetrics).values(metric).returning();
    return result[0];
  }

  // ============================================================================
  // Enterprise Risk Methods
  // ============================================================================
  
  async getEnterpriseRiskCategories(): Promise<EnterpriseRiskCategory[]> {
    return await db.select().from(enterpriseRiskCategories);
  }

  async createEnterpriseRiskCategory(category: InsertEnterpriseRiskCategory): Promise<EnterpriseRiskCategory> {
    const result = await db.insert(enterpriseRiskCategories).values(category).returning();
    return result[0];
  }

  async getEnterpriseRisks(categoryId?: string): Promise<EnterpriseRisk[]> {
    if (categoryId) {
      return await db.select().from(enterpriseRisks).where(eq(enterpriseRisks.categoryId, categoryId));
    }
    return await db.select().from(enterpriseRisks);
  }

  async createEnterpriseRisk(risk: InsertEnterpriseRisk): Promise<EnterpriseRisk> {
    const result = await db.insert(enterpriseRisks).values(risk).returning();
    return result[0];
  }

  async getFullEnterpriseRiskProfile(): Promise<{
    categories: (EnterpriseRiskCategory & { risks: EnterpriseRisk[] })[];
  }> {
    const allCategories = await this.getEnterpriseRiskCategories();
    const allRisks = await this.getEnterpriseRisks();
    
    const categoriesWithRisks = allCategories.map(cat => ({
      ...cat,
      risks: allRisks.filter(r => r.categoryId === cat.id)
    }));
    
    return { categories: categoriesWithRisks };
  }

  // ============================================================================
  // Seed Company Data (Overview, Climate, Risks)
  // ============================================================================
  
  async seedCompanyData(): Promise<void> {
    // Check if already seeded
    const existing = await db.select().from(companyOverview).limit(1);
    if (existing.length > 0) {
      console.log("[Seed] Company data already exists, skipping...");
      return;
    }

    // Seed company overview
    await db.insert(companyOverview).values({
      companyName: "NextEra Energy",
      yearsOfHistory: 100,
      employees: 16800,
      adjustedOperatingProfitValue: 24753,
      adjustedOperatingProfitUnit: "$m",
      adjustedOperatingProfitYear: 2024,
      assetsUnderManagementValue: 180,
      assetsUnderManagementUnit: "$bn",
      proprietaryAssetsValue: 68,
      proprietaryAssetsUnit: "GW",
      fortune200: true,
      ceo: "John Ketchum",
      cfo: "Kirk Crews",
      cro: "Rebecca Kujawa",
      climateDirector: "Eric Silagy",
      source: "NextEra Energy Annual Report 2024",
      sustainalyticsPercentile: 85,
      sustainalyticsRating: "Low Risk",
      msciRating: "A"
    });

    // Seed climate metrics
    const climateData: InsertClimateMetric[] = [
      // Headline metrics
      { category: "headline", metricName: "Operational Footprint Reduction", value: 65, unit: "%", description: "CO2 emissions rate reduction since 2005", baseYear: 2005 },
      { category: "headline", metricName: "Renewable Capacity", value: 33, unit: "GW", description: "Total renewable generation capacity" },
      { category: "headline", metricName: "Clean Energy Investment", value: 12, unit: "$bn", description: "Annual clean energy investment" },
      { category: "headline", metricName: "Net Zero Target Year", value: 2045, unit: "year", description: "Target year for net zero operations" },
      // Operational metrics
      { category: "operational", metricName: "Total Carbon Footprint", value: 25000000, unit: "tCO2e", description: "Total operational carbon footprint 2024" },
      { category: "operational", metricName: "Scope 1&2 Reduction", value: 12, unit: "%", description: "Fleet-wide emissions reduction vs 2023" },
      { category: "operational", metricName: "Smart Grid Assets", value: 5900000, unit: "meters", description: "Smart meters deployed" },
      { category: "operational", metricName: "Solar Installations", value: 7200, unit: "MW", description: "Utility-scale solar capacity" },
      { category: "operational", metricName: "Battery Storage", value: 3700, unit: "MW", description: "Grid-scale battery storage" },
      // Targets
      { category: "targets", metricName: "Carbon Intensity Reduction", value: 65, targetValue: 70, unit: "%", targetYear: 2025, baseYear: 2005, progress: 65 },
      { category: "targets", metricName: "Renewable Expansion", value: 33, targetValue: 50, unit: "GW", targetYear: 2030, progress: 66 },
      // Clean energy
      { category: "cleanEnergy", metricName: "Wind Capacity", value: 22500, unit: "MW", description: "Wind generation capacity" },
      { category: "cleanEnergy", metricName: "Solar Capacity", value: 7200, unit: "MW", description: "Solar generation capacity" },
      { category: "cleanEnergy", metricName: "Hydrogen Projects", value: 5, unit: "projects", description: "Green hydrogen pilot initiatives" },
      // Nature
      { category: "nature", metricName: "Land Conservation", value: 50000, unit: "acres", description: "Protected habitat and conservation lands" },
      { category: "nature", metricName: "Manatee Protection", value: 12, unit: "projects", description: "Manatee habitat protection initiatives" }
    ];

    for (const metric of climateData) {
      await db.insert(climateMetrics).values(metric);
    }

    // Seed enterprise risk categories
    const riskCategories: InsertEnterpriseRiskCategory[] = [
      { id: "operational", name: "Operational Risk", subtitle: "Infrastructure and execution", icon: "Shield", color: "#C50B30" },
      { id: "regulatory", name: "Regulatory Risk", subtitle: "Policy and compliance", icon: "TrendingUp", color: "#007FAA" },
      { id: "market", name: "Market Risk", subtitle: "Economic and competitive", icon: "BarChart2", color: "#8B5CF6" },
      { id: "credit", name: "Credit Risk", subtitle: "Counterparty exposure", icon: "CreditCard", color: "#F59E0B" },
      { id: "strategic", name: "Strategic Risk", subtitle: "Business model", icon: "Target", color: "#10B981" }
    ];

    for (const cat of riskCategories) {
      await db.insert(enterpriseRiskCategories).values(cat);
    }

    // Seed enterprise risks
    const riskItems: InsertEnterpriseRisk[] = [
      // Operational risks
      { categoryId: "operational", name: "Hurricane and severe weather exposure", description: "FPL service territory in Florida exposed to hurricanes, tropical storms, and severe weather. Storm damage restoration costs can exceed $1B per major event.", severity: "high", trend: "worsening" },
      { categoryId: "operational", name: "Project execution and development", description: "NEER's 36.5-46.5 GW renewable buildout through 2027 faces execution risks including permitting delays and interconnection queue backlogs.", severity: "high", trend: "stable" },
      { categoryId: "operational", name: "Equipment and infrastructure reliability", description: "Critical dependence on generation, transmission, and distribution infrastructure. Equipment failures or extended maintenance periods impact reliability.", severity: "high", trend: "improving" },
      { categoryId: "operational", name: "Nuclear operations", description: "Point Beach and other nuclear facilities require NRC compliance, safe operations, and extended license renewals.", severity: "medium", trend: "stable" },
      // Regulatory risks
      { categoryId: "regulatory", name: "Rate case outcomes", description: "FPL rate-regulated earnings depend on Florida PSC approval. Rate case filings every 4 years determine allowed ROE. Current ROE range 10.15-11.15%.", severity: "high", trend: "stable" },
      { categoryId: "regulatory", name: "Federal energy policy changes", description: "IRA tax credits, PTC/ITC provisions, and federal renewable energy policy significantly impact NEER economics.", severity: "high", trend: "worsening" },
      { categoryId: "regulatory", name: "Environmental compliance", description: "EPA regulations on emissions, water usage, and waste disposal. Coal combustion residuals management at legacy sites.", severity: "medium", trend: "stable" },
      // Market risks  
      { categoryId: "market", name: "Power price volatility", description: "NEER merchant power exposure to wholesale electricity price fluctuations. Basis risk between contracted prices and delivery points.", severity: "high", trend: "stable" },
      { categoryId: "market", name: "Interest rate exposure", description: "Rate increases impact cost of capital and refinancing. Significant impact on $35B+ development capital program.", severity: "medium", trend: "worsening" },
      { categoryId: "market", name: "Supply chain constraints", description: "Solar panel, battery, and transformer availability. Global competition for clean energy equipment.", severity: "high", trend: "improving" },
      // Credit risks
      { categoryId: "credit", name: "Counterparty credit risk", description: "Long-term PPA counterparty creditworthiness. Large utility and corporate offtakers concentration.", severity: "medium", trend: "stable" },
      // Strategic risks
      { categoryId: "strategic", name: "Technology disruption", description: "Emerging technologies in storage, hydrogen, and distributed generation may disrupt current business models.", severity: "medium", trend: "stable" },
      { categoryId: "strategic", name: "Talent and succession", description: "Competition for skilled workforce in growing clean energy sector. Leadership succession planning.", severity: "medium", trend: "stable" }
    ];

    for (const risk of riskItems) {
      await db.insert(enterpriseRisks).values(risk);
    }

    console.log("[Seed] Seeded company overview, climate metrics, and enterprise risks");
  }

  // Sync Job Methods
  async getSyncJobs(mcpAdapterId?: string): Promise<SyncJob[]> {
    if (mcpAdapterId) {
      return await db.select().from(syncJobs).where(eq(syncJobs.mcpAdapterId, mcpAdapterId)).orderBy(desc(syncJobs.createdAt));
    }
    return await db.select().from(syncJobs).orderBy(desc(syncJobs.createdAt));
  }

  async getSyncJob(id: string): Promise<SyncJob | undefined> {
    const result = await db.select().from(syncJobs).where(eq(syncJobs.id, id)).limit(1);
    return result[0];
  }

  async createSyncJob(job: InsertSyncJob): Promise<SyncJob> {
    const result = await db.insert(syncJobs).values(job).returning();
    return result[0];
  }

  async updateSyncJob(id: string, updates: Partial<SyncJob>): Promise<SyncJob | undefined> {
    const result = await db.update(syncJobs).set({ ...updates, updatedAt: new Date() }).where(eq(syncJobs.id, id)).returning();
    return result[0];
  }

  async deleteSyncJob(id: string): Promise<void> {
    await db.delete(syncJobs).where(eq(syncJobs.id, id));
  }

  async getEnabledSyncJobs(): Promise<SyncJob[]> {
    return await db.select().from(syncJobs).where(eq(syncJobs.isEnabled, "true"));
  }

  async updateSyncJobLastRun(id: string, status: string, error?: string): Promise<void> {
    await db.update(syncJobs).set({
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastRunError: error || null,
      updatedAt: new Date()
    }).where(eq(syncJobs.id, id));
  }

  // Sync Job Run Methods
  async getSyncJobRuns(syncJobId?: string, limit?: number): Promise<SyncJobRun[]> {
    const query = syncJobId 
      ? db.select().from(syncJobRuns).where(eq(syncJobRuns.syncJobId, syncJobId)).orderBy(desc(syncJobRuns.createdAt))
      : db.select().from(syncJobRuns).orderBy(desc(syncJobRuns.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getSyncJobRun(id: string): Promise<SyncJobRun | undefined> {
    const result = await db.select().from(syncJobRuns).where(eq(syncJobRuns.id, id)).limit(1);
    return result[0];
  }

  async createSyncJobRun(run: InsertSyncJobRun): Promise<SyncJobRun> {
    const result = await db.insert(syncJobRuns).values(run).returning();
    return result[0];
  }

  async updateSyncJobRun(id: string, updates: Partial<SyncJobRun>): Promise<SyncJobRun | undefined> {
    const result = await db.update(syncJobRuns).set(updates).where(eq(syncJobRuns.id, id)).returning();
    return result[0];
  }

  // Webhook Endpoint Methods
  async getWebhookEndpoints(sourceSystemId?: string): Promise<WebhookEndpoint[]> {
    if (sourceSystemId) {
      return await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.sourceSystemId, sourceSystemId)).orderBy(desc(webhookEndpoints.createdAt));
    }
    return await db.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.createdAt));
  }

  async getWebhookEndpoint(id: string): Promise<WebhookEndpoint | undefined> {
    const result = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, id)).limit(1);
    return result[0];
  }

  async getWebhookEndpointByPath(path: string): Promise<WebhookEndpoint | undefined> {
    const result = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.endpointPath, path)).limit(1);
    return result[0];
  }

  async createWebhookEndpoint(endpoint: InsertWebhookEndpoint): Promise<WebhookEndpoint> {
    const result = await db.insert(webhookEndpoints).values(endpoint).returning();
    return result[0];
  }

  async updateWebhookEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | undefined> {
    const result = await db.update(webhookEndpoints).set({ ...updates, updatedAt: new Date() }).where(eq(webhookEndpoints.id, id)).returning();
    return result[0];
  }

  async deleteWebhookEndpoint(id: string): Promise<void> {
    await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));
  }

  async incrementWebhookStats(id: string, processed: boolean): Promise<void> {
    const endpoint = await this.getWebhookEndpoint(id);
    if (endpoint) {
      await db.update(webhookEndpoints).set({
        totalReceived: (endpoint.totalReceived || 0) + 1,
        totalProcessed: processed ? (endpoint.totalProcessed || 0) + 1 : endpoint.totalProcessed,
        totalFailed: !processed ? (endpoint.totalFailed || 0) + 1 : endpoint.totalFailed,
        lastReceivedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(webhookEndpoints.id, id));
    }
  }

  // Webhook Event Methods
  async getWebhookEvents(webhookEndpointId?: string, limit?: number): Promise<WebhookEvent[]> {
    const query = webhookEndpointId
      ? db.select().from(webhookEvents).where(eq(webhookEvents.webhookEndpointId, webhookEndpointId)).orderBy(desc(webhookEvents.receivedAt))
      : db.select().from(webhookEvents).orderBy(desc(webhookEvents.receivedAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const result = await db.insert(webhookEvents).values(event).returning();
    return result[0];
  }

  async updateWebhookEventStatus(id: string, status: string, error?: string, syncJobRunId?: string): Promise<void> {
    await db.update(webhookEvents).set({
      status,
      processingError: error || null,
      syncJobRunId: syncJobRunId || null,
      processedAt: status === 'processed' || status === 'failed' ? new Date() : null
    }).where(eq(webhookEvents.id, id));
  }

  // Ingestion Session Methods
  async getIngestionSessions(status?: string): Promise<IngestionSession[]> {
    if (status) {
      return await db.select().from(ingestionSessions).where(eq(ingestionSessions.status, status)).orderBy(desc(ingestionSessions.createdAt));
    }
    return await db.select().from(ingestionSessions).orderBy(desc(ingestionSessions.createdAt));
  }

  async getIngestionSession(id: string): Promise<IngestionSession | undefined> {
    const result = await db.select().from(ingestionSessions).where(eq(ingestionSessions.id, id)).limit(1);
    return result[0];
  }

  async createIngestionSession(session: InsertIngestionSession): Promise<IngestionSession> {
    const result = await db.insert(ingestionSessions).values(session).returning();
    return result[0];
  }

  async updateIngestionSession(id: string, updates: Partial<IngestionSession>): Promise<IngestionSession | undefined> {
    const result = await db.update(ingestionSessions).set({ ...updates, updatedAt: new Date() }).where(eq(ingestionSessions.id, id)).returning();
    return result[0];
  }

  async deleteIngestionSession(id: string): Promise<void> {
    await db.delete(clarifyingQuestions).where(eq(clarifyingQuestions.ingestionSessionId, id));
    await db.delete(qaReviews).where(eq(qaReviews.ingestionSessionId, id));
    await db.delete(ingestionSessions).where(eq(ingestionSessions.id, id));
  }

  // QA Review Methods
  async getQaReviews(ingestionSessionId?: string): Promise<QaReview[]> {
    if (ingestionSessionId) {
      return await db.select().from(qaReviews).where(eq(qaReviews.ingestionSessionId, ingestionSessionId)).orderBy(desc(qaReviews.createdAt));
    }
    return await db.select().from(qaReviews).orderBy(desc(qaReviews.createdAt));
  }

  async getQaReview(id: string): Promise<QaReview | undefined> {
    const result = await db.select().from(qaReviews).where(eq(qaReviews.id, id)).limit(1);
    return result[0];
  }

  async createQaReview(review: InsertQaReview): Promise<QaReview> {
    const result = await db.insert(qaReviews).values(review).returning();
    return result[0];
  }

  async updateQaReview(id: string, updates: Partial<QaReview>): Promise<QaReview | undefined> {
    const result = await db.update(qaReviews).set({ ...updates, reviewedAt: new Date() }).where(eq(qaReviews.id, id)).returning();
    return result[0];
  }

  // Clarifying Question Methods
  async getClarifyingQuestions(ingestionSessionId?: string, status?: string): Promise<ClarifyingQuestion[]> {
    if (ingestionSessionId && status) {
      return await db.select().from(clarifyingQuestions)
        .where(and(eq(clarifyingQuestions.ingestionSessionId, ingestionSessionId), eq(clarifyingQuestions.status, status)))
        .orderBy(desc(clarifyingQuestions.createdAt));
    }
    if (ingestionSessionId) {
      return await db.select().from(clarifyingQuestions)
        .where(eq(clarifyingQuestions.ingestionSessionId, ingestionSessionId))
        .orderBy(desc(clarifyingQuestions.createdAt));
    }
    if (status) {
      return await db.select().from(clarifyingQuestions)
        .where(eq(clarifyingQuestions.status, status))
        .orderBy(desc(clarifyingQuestions.createdAt));
    }
    return await db.select().from(clarifyingQuestions).orderBy(desc(clarifyingQuestions.createdAt));
  }

  async getClarifyingQuestion(id: string): Promise<ClarifyingQuestion | undefined> {
    const result = await db.select().from(clarifyingQuestions).where(eq(clarifyingQuestions.id, id)).limit(1);
    return result[0];
  }

  async createClarifyingQuestion(question: InsertClarifyingQuestion): Promise<ClarifyingQuestion> {
    const result = await db.insert(clarifyingQuestions).values(question).returning();
    return result[0];
  }

  async answerClarifyingQuestion(id: string, answer: string, answeredBy: string): Promise<ClarifyingQuestion | undefined> {
    const result = await db.update(clarifyingQuestions).set({
      answer,
      answeredBy,
      answeredAt: new Date(),
      status: 'answered'
    }).where(eq(clarifyingQuestions.id, id)).returning();
    return result[0];
  }

  // VRO Metrics Methods
  async getVroMetrics(category?: string): Promise<VroMetric[]> {
    if (category) {
      return await db.select().from(vroMetrics)
        .where(and(eq(vroMetrics.category, category), eq(vroMetrics.isActive, true)))
        .orderBy(vroMetrics.sortOrder);
    }
    return await db.select().from(vroMetrics)
      .where(eq(vroMetrics.isActive, true))
      .orderBy(vroMetrics.sortOrder);
  }

  async getVroMetric(id: string): Promise<VroMetric | undefined> {
    const result = await db.select().from(vroMetrics).where(eq(vroMetrics.id, id)).limit(1);
    return result[0];
  }

  async createVroMetric(metric: InsertVroMetric): Promise<VroMetric> {
    const result = await db.insert(vroMetrics).values(metric).returning();
    return result[0];
  }

  async updateVroMetric(id: string, updates: Partial<VroMetric>): Promise<VroMetric | undefined> {
    const result = await db.update(vroMetrics).set({ ...updates, updatedAt: new Date() }).where(eq(vroMetrics.id, id)).returning();
    return result[0];
  }

  // Benchmarks Methods
  async getBenchmarks(category?: string): Promise<Benchmark[]> {
    if (category) {
      return await db.select().from(benchmarks)
        .where(and(eq(benchmarks.category, category), eq(benchmarks.isActive, true)));
    }
    return await db.select().from(benchmarks).where(eq(benchmarks.isActive, true));
  }

  async getBenchmark(id: string): Promise<Benchmark | undefined> {
    const result = await db.select().from(benchmarks).where(eq(benchmarks.id, id)).limit(1);
    return result[0];
  }

  async createBenchmark(benchmark: InsertBenchmark): Promise<Benchmark> {
    const result = await db.insert(benchmarks).values(benchmark).returning();
    return result[0];
  }

  // App Config Methods
  async getAppConfig(key: string): Promise<AppConfig | undefined> {
    const result = await db.select().from(appConfig).where(eq(appConfig.configKey, key)).limit(1);
    return result[0];
  }

  async getAllAppConfig(category?: string): Promise<AppConfig[]> {
    if (category) {
      return await db.select().from(appConfig).where(eq(appConfig.category, category));
    }
    return await db.select().from(appConfig);
  }

  async setAppConfig(key: string, value: string, description?: string, category?: string): Promise<AppConfig> {
    const result = await db.insert(appConfig).values({
      configKey: key,
      configValue: value,
      description,
      category: category || 'general'
    }).onConflictDoUpdate({
      target: appConfig.configKey,
      set: { configValue: value, updatedAt: new Date() }
    }).returning();
    return result[0];
  }

  // Seed VRO Metrics
  async seedVroMetrics(): Promise<void> {
    const existingMetrics = await db.select().from(vroMetrics).limit(1);
    if (existingMetrics.length > 0) {
      console.log("[Seed] VRO metrics already exist, skipping...");
      return;
    }

    const defaultMetrics: InsertVroMetric[] = [
      { metricKey: 'current-roi', label: 'Current ROI', value: '64', unit: '%', color: 'text-[#D50032]', source: 'VRO Financial Analysis', category: 'vro', sortOrder: 1 },
      { metricKey: 'net-present-value', label: 'Net Present Value', value: '$36.25', unit: 'M', color: 'text-[#0072CE]', source: '5-year projection', category: 'vro', sortOrder: 2 },
      { metricKey: 'timeline-progress', label: 'Timeline Progress', value: '69', unit: '%', color: 'text-[#00A651]', source: 'Value Stream Mapping', category: 'vro', sortOrder: 3 },
      { metricKey: 'budget-utilization', label: 'Budget Utilization', value: '94', unit: '%', color: 'text-[#FFD700]', source: 'FinOps Tracking', category: 'vro', sortOrder: 4 },
    ];

    for (const metric of defaultMetrics) {
      await this.createVroMetric(metric);
    }
    console.log("[Seed] VRO metrics seeded successfully");
  }

  // Seed Demo Mode Config
  async seedAppConfig(): Promise<void> {
    const existingConfig = await this.getAppConfig('demo_mode');
    if (!existingConfig) {
      await this.setAppConfig('demo_mode', 'true', 'Enable demo simulation mode', 'system');
      console.log("[Seed] App config seeded with demo_mode=true");
    }
  }

  // Dashboard Widget Methods
  async getDashboardWidgets(category?: string, visibleOnly: boolean = true): Promise<DashboardWidget[]> {
    if (category && visibleOnly) {
      return await db.select().from(dashboardWidgets)
        .where(and(eq(dashboardWidgets.category, category), eq(dashboardWidgets.isVisible, true)))
        .orderBy(dashboardWidgets.sortOrder);
    }
    if (category) {
      return await db.select().from(dashboardWidgets)
        .where(eq(dashboardWidgets.category, category))
        .orderBy(dashboardWidgets.sortOrder);
    }
    if (visibleOnly) {
      return await db.select().from(dashboardWidgets)
        .where(eq(dashboardWidgets.isVisible, true))
        .orderBy(dashboardWidgets.sortOrder);
    }
    return await db.select().from(dashboardWidgets).orderBy(dashboardWidgets.sortOrder);
  }

  async getDashboardWidget(id: string): Promise<DashboardWidget | undefined> {
    const result = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.id, id)).limit(1);
    return result[0];
  }

  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const result = await db.insert(dashboardWidgets).values(widget).returning();
    return result[0];
  }

  async updateDashboardWidget(id: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined> {
    const result = await db.update(dashboardWidgets).set({ ...updates, updatedAt: new Date() }).where(eq(dashboardWidgets.id, id)).returning();
    return result[0];
  }

  async deleteDashboardWidget(id: string): Promise<void> {
    await db.delete(dashboardWidgets).where(eq(dashboardWidgets.id, id));
  }

  async reorderDashboardWidgets(widgetOrders: { id: string; sortOrder: number }[]): Promise<void> {
    for (const { id, sortOrder } of widgetOrders) {
      await db.update(dashboardWidgets).set({ sortOrder, updatedAt: new Date() }).where(eq(dashboardWidgets.id, id));
    }
  }

  // Seed Dashboard Widgets
  async seedDashboardWidgets(): Promise<void> {
    const existingWidgets = await db.select().from(dashboardWidgets).limit(1);
    if (existingWidgets.length > 0) {
      console.log("[Seed] Dashboard widgets already exist, skipping...");
      return;
    }

    const defaultWidgets: InsertDashboardWidget[] = [
      { widgetKey: 'portfolio-health', widgetType: 'metric', title: 'Portfolio Health', description: 'Overall portfolio health score', dataSource: '/api/portfolio/metrics', category: 'vro', size: 'medium', sortOrder: 1 },
      { widgetKey: 'budget-utilization', widgetType: 'metric', title: 'Budget Utilization', description: 'Budget spent vs allocated', dataSource: '/api/portfolio/metrics', category: 'financial', size: 'medium', sortOrder: 2 },
      { widgetKey: 'project-status', widgetType: 'chart', title: 'Project Status', description: 'Projects by status breakdown', dataSource: '/api/portfolio/metrics', category: 'pmo', size: 'large', sortOrder: 3 },
      { widgetKey: 'total-roi', widgetType: 'metric', title: 'Total ROI Value', description: 'Combined ROI across all projects', dataSource: '/api/portfolio/metrics', category: 'financial', size: 'medium', sortOrder: 4 },
      { widgetKey: 'active-alerts', widgetType: 'list', title: 'Active Alerts', description: 'Current active system alerts', dataSource: '/api/alerts/active', category: 'general', size: 'large', sortOrder: 5 },
      { widgetKey: 'avg-predictability', widgetType: 'metric', title: 'Avg Predictability', description: 'Average SAFe predictability score', dataSource: '/api/portfolio/metrics', category: 'performance', size: 'small', sortOrder: 6 },
    ];

    for (const widget of defaultWidgets) {
      await this.createDashboardWidget(widget);
    }
    console.log("[Seed] Dashboard widgets seeded successfully");
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  async getNotifications(userId?: string, includeRead = false): Promise<Notification[]> {
    if (userId) {
      if (includeRead) {
        return await db.select().from(notifications)
          .where(and(eq(notifications.userId, userId), eq(notifications.isDismissed, false)))
          .orderBy(desc(notifications.createdAt));
      }
      return await db.select().from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false), eq(notifications.isDismissed, false)))
        .orderBy(desc(notifications.createdAt));
    }
    if (includeRead) {
      return await db.select().from(notifications)
        .where(eq(notifications.isDismissed, false))
        .orderBy(desc(notifications.createdAt));
    }
    return await db.select().from(notifications)
      .where(and(eq(notifications.isRead, false), eq(notifications.isDismissed, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId?: string): Promise<void> {
    if (userId) {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    } else {
      await db.update(notifications).set({ isRead: true });
    }
  }

  async dismissNotification(id: string): Promise<void> {
    await db.update(notifications).set({ isDismissed: true }).where(eq(notifications.id, id));
  }

  // ============================================================================
  // USER ROLES
  // ============================================================================

  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const result = await db.select().from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
    return result[0];
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles).orderBy(userRoles.createdAt);
  }

  async upsertUserRole(role: InsertUserRole): Promise<UserRole> {
    const existing = await this.getUserRole(role.userId);
    if (existing) {
      const result = await db.update(userRoles)
        .set({ role: role.role, permissions: role.permissions, updatedAt: new Date() })
        .where(eq(userRoles.userId, role.userId))
        .returning();
      return result[0];
    }
    const result = await db.insert(userRoles).values(role).returning();
    return result[0];
  }

  async deleteUserRole(userId: string): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
  }

  // ============================================================================
  // SCHEDULED REPORTS
  // ============================================================================

  async getScheduledReports(): Promise<ScheduledReport[]> {
    return await db.select().from(scheduledReports).orderBy(scheduledReports.name);
  }

  async getScheduledReport(id: string): Promise<ScheduledReport | undefined> {
    const result = await db.select().from(scheduledReports).where(eq(scheduledReports.id, id)).limit(1);
    return result[0];
  }

  async createScheduledReport(report: InsertScheduledReport): Promise<ScheduledReport> {
    const result = await db.insert(scheduledReports).values(report).returning();
    return result[0];
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport | undefined> {
    const result = await db.update(scheduledReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduledReports.id, id))
      .returning();
    return result[0];
  }

  async deleteScheduledReport(id: string): Promise<void> {
    await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
  }

  // ============================================================================
  // EXPORT JOBS
  // ============================================================================

  async getExportJobs(userId?: string): Promise<ExportJob[]> {
    if (userId) {
      return await db.select().from(exportJobs)
        .where(eq(exportJobs.requestedBy, userId))
        .orderBy(desc(exportJobs.createdAt));
    }
    return await db.select().from(exportJobs).orderBy(desc(exportJobs.createdAt));
  }

  async getExportJob(id: string): Promise<ExportJob | undefined> {
    const result = await db.select().from(exportJobs).where(eq(exportJobs.id, id)).limit(1);
    return result[0];
  }

  async createExportJob(job: InsertExportJob): Promise<ExportJob> {
    const result = await db.insert(exportJobs).values(job).returning();
    return result[0];
  }

  async updateExportJob(id: string, updates: Partial<ExportJob>): Promise<ExportJob | undefined> {
    const result = await db.update(exportJobs).set(updates).where(eq(exportJobs.id, id)).returning();
    return result[0];
  }

  // ============================================================================
  // TUTORIAL PROGRESS
  // ============================================================================

  async getTutorialProgress(userId: string): Promise<TutorialProgress[]> {
    return await db.select().from(tutorialProgress)
      .where(eq(tutorialProgress.userId, userId))
      .orderBy(tutorialProgress.startedAt);
  }

  async getTutorialProgressByTutorial(userId: string, tutorialId: string): Promise<TutorialProgress | undefined> {
    const result = await db.select().from(tutorialProgress)
      .where(and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.tutorialId, tutorialId)
      ))
      .limit(1);
    return result[0];
  }

  async createTutorialProgress(progress: InsertTutorialProgress): Promise<TutorialProgress> {
    const result = await db.insert(tutorialProgress).values(progress).returning();
    return result[0];
  }

  async updateTutorialProgress(id: string, updates: Partial<TutorialProgress>): Promise<TutorialProgress | undefined> {
    const result = await db.update(tutorialProgress)
      .set({ ...updates, lastViewedAt: new Date() })
      .where(eq(tutorialProgress.id, id))
      .returning();
    return result[0];
  }

  async completeTutorial(userId: string, tutorialId: string): Promise<TutorialProgress | undefined> {
    const existing = await this.getTutorialProgressByTutorial(userId, tutorialId);
    if (existing) {
      return await this.updateTutorialProgress(existing.id, {
        isCompleted: true,
        completedAt: new Date(),
      });
    }
    return undefined;
  }

  async skipTutorial(userId: string, tutorialId: string, totalSteps: number): Promise<TutorialProgress> {
    const existing = await this.getTutorialProgressByTutorial(userId, tutorialId);
    if (existing) {
      const result = await this.updateTutorialProgress(existing.id, {
        isSkipped: true,
      });
      return result!;
    }
    return await this.createTutorialProgress({
      userId,
      tutorialId,
      totalSteps,
      isSkipped: true,
    });
  }

  async resetTutorialProgress(userId: string, tutorialId: string): Promise<void> {
    await db.delete(tutorialProgress)
      .where(and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.tutorialId, tutorialId)
      ));
  }

  // Project Template Methods
  async getProjectTemplates(category?: string): Promise<ProjectTemplate[]> {
    if (category) {
      return await db.select().from(projectTemplates)
        .where(and(eq(projectTemplates.category, category), eq(projectTemplates.isActive, true)))
        .orderBy(projectTemplates.name);
    }
    return await db.select().from(projectTemplates)
      .where(eq(projectTemplates.isActive, true))
      .orderBy(projectTemplates.name);
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate | undefined> {
    const result = await db.select().from(projectTemplates)
      .where(eq(projectTemplates.id, id)).limit(1);
    return result[0];
  }

  async getProjectTemplateBySlug(slug: string): Promise<ProjectTemplate | undefined> {
    const result = await db.select().from(projectTemplates)
      .where(eq(projectTemplates.slug, slug)).limit(1);
    return result[0];
  }

  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const result = await db.insert(projectTemplates).values(template).returning();
    return result[0];
  }

  async updateProjectTemplate(id: string, updates: Partial<ProjectTemplate>): Promise<ProjectTemplate | undefined> {
    const result = await db.update(projectTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteProjectTemplate(id: string): Promise<void> {
    await db.delete(projectTemplates).where(eq(projectTemplates.id, id));
  }

  // Audit Trail Methods
  async createAuditTrail(entry: InsertAuditTrail): Promise<AuditTrail> {
    const result = await db.insert(auditTrail).values(entry).returning();
    return result[0];
  }

  async getAuditTrailByCode(confirmationCode: string): Promise<AuditTrail | undefined> {
    const result = await db.select().from(auditTrail)
      .where(eq(auditTrail.confirmationCode, confirmationCode)).limit(1);
    return result[0];
  }

  async getRecentAuditTrail(limit: number = 20): Promise<AuditTrail[]> {
    return await db.select().from(auditTrail)
      .orderBy(desc(auditTrail.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();

storage.seedDemoData().catch(err => {
  console.error("Failed to seed demo data:", err);
});

storage.seedDivisions().catch(err => {
  console.error("Failed to seed divisions:", err);
});

storage.seedCompanyData().catch(err => {
  console.error("Failed to seed company data:", err);
});

storage.seedVroMetrics().catch(err => {
  console.error("Failed to seed VRO metrics:", err);
});

storage.seedAppConfig().catch(err => {
  console.error("Failed to seed app config:", err);
});

storage.seedDashboardWidgets().catch(err => {
  console.error("Failed to seed dashboard widgets:", err);
});

// Seed project templates from JSON files
async function seedProjectTemplates() {
  const fs = await import('fs');
  const path = await import('path');
  
  const templatesDir = path.join(process.cwd(), 'attached_assets', 'project_templates');
  
  if (!fs.existsSync(templatesDir)) {
    console.log("No project templates directory found, skipping seed");
    return;
  }
  
  const existingTemplates = await storage.getProjectTemplates();
  if (existingTemplates.length > 0) {
    console.log(`${existingTemplates.length} templates already exist in database, skipping seed`);
    return;
  }
  
  const files = fs.readdirSync(templatesDir).filter((f: string) => f.endsWith('.json'));
  console.log(`[TemplateSeed] Migrating ${files.length} project templates to database...`);
  
  for (const file of files) {
    try {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      const slug = file.replace('.json', '');
      let category = 'Other';
      if (slug.startsWith('FPL-') || slug.startsWith('fpl-')) category = 'FPL';
      else if (slug.startsWith('NEER-') || slug.startsWith('neer-')) category = 'NEER';
      else if (slug.startsWith('Corp-') || slug.startsWith('corp-') || slug.startsWith('nee-')) category = 'Corporate';
      
      await storage.createProjectTemplate({
        name: data.name || slug.replace(/-/g, ' '),
        slug: slug,
        bu: data.bu || category,
        division: data.division,
        description: data.description,
        category: category,
        templateData: content,
        isActive: true,
      });
      
      console.log(`[TemplateSeed] Migrated: ${slug}`);
    } catch (err) {
      console.error(`[TemplateSeed] Failed to migrate ${file}:`, err);
    }
  }
  
  console.log("[TemplateSeed] Template migration complete");
}

seedProjectTemplates().catch(err => {
  console.error("Failed to seed project templates:", err);
});
