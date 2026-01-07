import { 
  type User, type InsertUser, 
  type Policy, type InsertPolicy,
  type BusinessUnit, type InsertBusinessUnit,
  type Project, type InsertProject,
  type PolicyBusinessUnitLink, type InsertPolicyBusinessUnitLink,
  type PolicyProjectLink, type InsertPolicyProjectLink,
  users, policies, businessUnits, projects, policyBusinessUnitLinks, policyProjectLinks
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
  }
}

export const storage = new DatabaseStorage();

storage.seedDemoData().catch(err => {
  console.error("Failed to seed demo data:", err);
});
