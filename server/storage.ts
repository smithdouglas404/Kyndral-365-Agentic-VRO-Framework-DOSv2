import { 
  type User, type InsertUser, 
  type Policy, type InsertPolicy,
  type BusinessUnit, type InsertBusinessUnit,
  type Project, type InsertProject,
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
  users, policies, businessUnits, projects, policyBusinessUnitLinks, policyProjectLinks,
  agentMemory, agentPatterns, agentTaskQueue, interventions, agentDiscussions, discussionMessages,
  projectMetrics, agentActivityLog, alerts, features, stories, tasks, resources, milestones, dependencies, projectFinancials, risks,
  okrs, keyResults, kpis,
  portfolios, valueStreams, arts, teams, programIncrements, epics, capabilities, sprints,
  sourceSystems, mcpAdapters, fieldMappings, ingestionJobs, mcpToolMappings,
  divisions, divisionKpis, divisionOkrs, divisionRisks,
  companyOverview, climateMetrics, enterpriseRiskCategories, enterpriseRisks
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and, inArray } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
      { id: 'bu-retail', name: 'Retail Insurance', description: 'Consumer-facing life insurance and protection products', department: 'Retail Division', owner: 'Sarah Johnson' },
      { id: 'bu-pensions', name: 'Workplace Pensions', description: 'Employer pension schemes and retirement solutions', department: 'Institutional Division', owner: 'Mark Williams' },
      { id: 'bu-wealth', name: 'Wealth Management', description: 'Investment and wealth advisory services', department: 'Wealth Division', owner: 'Emma Thompson' },
    ]);

    await db.insert(projects).values([
      { id: 'proj-1', name: 'Digital Underwriting Platform', description: 'Automating underwriting decisions', status: 'active', businessUnitId: 'bu-retail' },
      { id: 'proj-2', name: 'Customer Portal Refresh', description: 'New self-service portal for policyholders', status: 'active', businessUnitId: 'bu-retail' },
      { id: 'proj-3', name: 'Claims Processing Automation', description: 'Streamlining claims handling with AI', status: 'active', businessUnitId: 'bu-retail' },
      { id: 'proj-4', name: 'Pension Auto-Enrolment Update', description: 'Compliance with new regulations', status: 'active', businessUnitId: 'bu-pensions' },
      { id: 'proj-5', name: 'Retirement Calculator', description: 'New online retirement planning tool', status: 'active', businessUnitId: 'bu-pensions' },
      { id: 'proj-6', name: 'Investment Risk Dashboard', description: 'Real-time portfolio risk monitoring', status: 'active', businessUnitId: 'bu-wealth' },
    ]);
    
    await this.seedPortfolioMetrics();
  }
  
  async seedPortfolioMetrics(): Promise<void> {
    const existingMetrics = await db.select().from(projectMetrics).limit(1);
    if (existingMetrics.length > 0) return;
    
    const portfolioMetrics = [
      { projectId: 'portfolio-lgim', projectName: 'LGIM Portfolio', metricKey: 'spi', metricName: 'Schedule Performance Index', currentValue: '0.96', threshold: '0.95', criticalThreshold: '0.85', direction: 'higher_is_better', agentOwner: 'planning' },
      { projectId: 'portfolio-lgim', projectName: 'LGIM Portfolio', metricKey: 'cpi', metricName: 'Cost Performance Index', currentValue: '0.93', threshold: '0.92', criticalThreshold: '0.80', direction: 'higher_is_better', agentOwner: 'finops' },
      { projectId: 'portfolio-lgim', projectName: 'LGIM Portfolio', metricKey: 'okr_progress', metricName: 'OKR Progress', currentValue: '0.72', threshold: '0.70', criticalThreshold: '0.50', direction: 'higher_is_better', agentOwner: 'okr' },
      { projectId: 'portfolio-lgim', projectName: 'LGIM Portfolio', metricKey: 'change_adoption', metricName: 'Change Adoption Rate', currentValue: '0.78', threshold: '0.75', criticalThreshold: '0.60', direction: 'higher_is_better', agentOwner: 'ocm' },
      { projectId: 'portfolio-lgim', projectName: 'LGIM Portfolio', metricKey: 'sprint_velocity', metricName: 'Sprint Velocity Variance', currentValue: '0.08', threshold: '0.15', criticalThreshold: '0.25', direction: 'lower_is_better', agentOwner: 'planning' },
      { projectId: 'proj-cloud-migration', projectName: 'Cloud Infrastructure Migration', metricKey: 'spi', metricName: 'Schedule Performance Index', currentValue: '0.94', threshold: '0.95', criticalThreshold: '0.85', direction: 'higher_is_better', agentOwner: 'planning' },
      { projectId: 'proj-cloud-migration', projectName: 'Cloud Infrastructure Migration', metricKey: 'cpi', metricName: 'Cost Performance Index', currentValue: '0.88', threshold: '0.92', criticalThreshold: '0.80', direction: 'higher_is_better', agentOwner: 'finops' },
      { projectId: 'proj-climate-analytics', projectName: 'Climate Transition Analytics', metricKey: 'spi', metricName: 'Schedule Performance Index', currentValue: '0.91', threshold: '0.95', criticalThreshold: '0.85', direction: 'higher_is_better', agentOwner: 'planning' },
      { projectId: 'proj-climate-analytics', projectName: 'Climate Transition Analytics', metricKey: 'cpi', metricName: 'Cost Performance Index', currentValue: '0.82', threshold: '0.92', criticalThreshold: '0.80', direction: 'higher_is_better', agentOwner: 'finops' },
      { projectId: 'proj-agile-delivery', projectName: 'Agile Delivery Program', metricKey: 'sprint_velocity', metricName: 'Sprint Velocity Variance', currentValue: '0.12', threshold: '0.15', criticalThreshold: '0.25', direction: 'lower_is_better', agentOwner: 'planning' },
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

  async seedDemoInterventions(): Promise<void> {
    const demoInterventions: InsertIntervention[] = [
      {
        type: 'budget',
        severity: 'critical',
        title: '[AUTONOMOUS] Budget Overrun Detected',
        description: 'FinOps Agent detected CPI dropped below 0.85 threshold. Automatic cost analysis triggered.',
        projectId: 'proj-data-platform',
        projectName: 'Enterprise Data Platform',
        confidence: '0.95',
        suggestedAction: 'Reallocate £200K from contingency reserve and implement cost controls on external contractors.',
        impact: 'Without intervention, project will exceed budget by £1.2M by Q2.',
        status: 'pending',
        agentSource: 'FinOps Agent',
        isAutonomous: 'true',
        triggerSource: 'metric_breach'
      },
      {
        type: 'timeline',
        severity: 'critical',
        title: '[AUTONOMOUS] Schedule Variance Alert',
        description: 'TMO Agent detected SPI at 0.78, below critical threshold of 0.85.',
        projectId: 'proj-climate-analytics',
        projectName: 'Climate Analytics Platform',
        confidence: '0.92',
        suggestedAction: 'Fast-track critical path activities and add parallel workstreams.',
        impact: 'Current trajectory shows 6-week delay to regulatory deadline.',
        status: 'pending',
        agentSource: 'TMO Agent',
        isAutonomous: 'true',
        triggerSource: 'metric_breach'
      },
      {
        type: 'dependency',
        severity: 'high',
        title: '[AGENT→AGENT] Cross-ART Dependency Risk',
        description: 'Planning Agent escalated to Governance Agent: API dependency blocking 3 downstream teams.',
        projectId: 'proj-data-platform',
        projectName: 'Enterprise Data Platform',
        confidence: '0.88',
        suggestedAction: 'Convene emergency dependency resolution meeting with all ART leads.',
        impact: 'Blocking 12 story points across 3 teams.',
        status: 'pending',
        agentSource: 'Governance Agent',
        isAutonomous: 'true',
        triggerSource: 'agent_escalation',
        escalatedFromAgentId: 'planning'
      },
      {
        type: 'quality',
        severity: 'high',
        title: '[AUTONOMOUS] Quality Gate Failure',
        description: 'Integrated Management Agent detected test coverage dropped to 62%, below 80% threshold.',
        projectId: 'proj-customer-360',
        projectName: 'Customer 360 Platform',
        confidence: '0.91',
        suggestedAction: 'Pause feature development and allocate sprint capacity to test coverage.',
        impact: 'Risk of production defects increased by 40%.',
        status: 'pending',
        agentSource: 'Integrated Management Agent',
        isAutonomous: 'true',
        triggerSource: 'metric_breach'
      },
      {
        type: 'resource',
        severity: 'medium',
        title: '[AUTONOMOUS] Resource Utilization Warning',
        description: 'OCM Agent detected team velocity declining 15% over last 3 sprints.',
        projectId: 'proj-digital-transform',
        projectName: 'Digital Transformation Program',
        confidence: '0.85',
        suggestedAction: 'Review team capacity and consider change fatigue interventions.',
        impact: 'Continued decline will delay delivery by 2 sprints.',
        status: 'pending',
        agentSource: 'OCM Agent',
        isAutonomous: 'true',
        triggerSource: 'agent_detection'
      },
      // Pre-approved self-approved agent actions (Agent Actions tab)
      {
        type: 'budget',
        severity: 'medium',
        title: '[Agent Self Approved] Contractor Cost Optimization',
        description: 'FinOps Agent autonomously renegotiated cloud instance reservations, saving £45K/quarter.',
        projectId: 'proj-data-platform',
        projectName: 'Enterprise Data Platform',
        confidence: '0.96',
        suggestedAction: 'Applied 3-year reserved instance commitment for predictable workloads.',
        impact: 'Annual savings of £180K with no service impact.',
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
        title: '[Agent Self Approved] Sprint Rebalancing',
        description: 'TMO Agent automatically redistributed 8 story points from overloaded team to available capacity.',
        projectId: 'proj-climate-analytics',
        projectName: 'Climate Analytics Platform',
        confidence: '0.93',
        suggestedAction: 'Moved non-critical stories to Team Beta with available capacity.',
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
        description: 'Integrated Management Agent added 23 unit tests to critical payment module.',
        projectId: 'proj-customer-360',
        projectName: 'Customer 360 Platform',
        confidence: '0.97',
        suggestedAction: 'Generated test cases for uncovered edge cases in payment processing.',
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
        description: 'OCM Agent consolidated 3 redundant daily standups into one cross-team sync.',
        projectId: 'proj-digital-transform',
        projectName: 'Digital Transformation Program',
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
        id: "florida-power-light",
        name: "Florida Power & Light",
        ceo: "Armando Pimentel",
        profit2023: 4850,
        profit2024: 5200,
        changePercent: 7,
        description: "Rate-regulated electric utility serving Florida. One of the largest electric utilities in the U.S. with 35,052 MW net generating capacity.",
        color: "#0072CE"
      },
      {
        id: "nextera-energy-resources",
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
      { divisionId: "florida-power-light", name: "Operating Revenue", value2023: "17200", value2024: "18500", target2025: "19500", unit: "$m", trend: "up", status: "on-track" },
      { divisionId: "florida-power-light", name: "Net Generating Capacity", value2023: "33500", value2024: "35052", target2025: "37000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "florida-power-light", name: "Customer Accounts", value2023: "5.7", value2024: "5.9", target2025: "6.1", unit: "m", trend: "up", status: "on-track" },
      { divisionId: "florida-power-light", name: "System Reliability", value2023: "99.96", value2024: "99.98", target2025: "99.99", unit: "%", trend: "up", status: "on-track" }
    ];

    for (const kpi of fplKpis) {
      await db.insert(divisionKpis).values(kpi);
    }

    // Seed KPIs for NEER
    const neerKpis: InsertDivisionKpi[] = [
      { divisionId: "nextera-energy-resources", name: "Operating Revenue", value2023: "6200", value2024: "6800", target2025: "7500", unit: "$m", trend: "up", status: "on-track" },
      { divisionId: "nextera-energy-resources", name: "Wind Capacity", value2023: "21000", value2024: "22500", target2025: "25000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "nextera-energy-resources", name: "Solar Capacity", value2023: "5800", value2024: "7200", target2025: "9000", unit: "MW", trend: "up", status: "on-track" },
      { divisionId: "nextera-energy-resources", name: "Battery Storage", value2023: "2800", value2024: "3700", target2025: "5000", unit: "MW", trend: "up", status: "on-track" }
    ];

    for (const kpi of neerKpis) {
      await db.insert(divisionKpis).values(kpi);
    }

    // Seed OKRs
    const divOkrs: InsertDivisionOkr[] = [
      { 
        divisionId: "florida-power-light", 
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
        divisionId: "nextera-energy-resources", 
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
      { divisionId: "florida-power-light", type: "Hurricane", level: "high", description: "Florida exposure to severe weather events", mitigation: "Grid hardening and storm preparation protocols" },
      { divisionId: "florida-power-light", type: "Regulatory", level: "medium", description: "Rate case outcomes and regulatory changes", mitigation: "Proactive regulatory engagement" },
      { divisionId: "nextera-energy-resources", type: "Supply Chain", level: "medium", description: "Solar panel and battery component availability", mitigation: "Diversified supplier relationships" },
      { divisionId: "nextera-energy-resources", type: "Policy", level: "medium", description: "Changes to renewable energy incentives", mitigation: "Geographic and technology diversification" }
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
