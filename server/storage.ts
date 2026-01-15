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
  type Feature, type InsertFeature,
  type Story, type InsertStory,
  type Task, type InsertTask,
  type Resource, type InsertResource,
  type Milestone, type InsertMilestone,
  type Dependency, type InsertDependency,
  type ProjectFinancials, type InsertProjectFinancials,
  type Risk, type InsertRisk,
  users, policies, businessUnits, projects, policyBusinessUnitLinks, policyProjectLinks,
  agentMemory, agentPatterns, agentTaskQueue, interventions, agentDiscussions, discussionMessages,
  projectMetrics, agentActivityLog, features, stories, tasks, resources, milestones, dependencies, projectFinancials, risks
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
  
  getAgentActivityLog(limit?: number): Promise<AgentActivityLog[]>;
  createAgentActivityLog(activity: InsertAgentActivityLog): Promise<AgentActivityLog>;
  clearAgentActivityLog(): Promise<void>;
  
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
}

export const storage = new DatabaseStorage();

storage.seedDemoData().catch(err => {
  console.error("Failed to seed demo data:", err);
});
