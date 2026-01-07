import { 
  type User, type InsertUser, 
  type Policy, type InsertPolicy,
  type BusinessUnit, type InsertBusinessUnit,
  type Project, type InsertProject,
  type PolicyBusinessUnitLink, type InsertPolicyBusinessUnitLink,
  type PolicyProjectLink, type InsertPolicyProjectLink
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private policies: Map<string, Policy>;
  private businessUnits: Map<string, BusinessUnit>;
  private projects: Map<string, Project>;
  private policyBusinessUnitLinks: Map<string, PolicyBusinessUnitLink>;
  private policyProjectLinks: Map<string, PolicyProjectLink>;

  constructor() {
    this.users = new Map();
    this.policies = new Map();
    this.businessUnits = new Map();
    this.projects = new Map();
    this.policyBusinessUnitLinks = new Map();
    this.policyProjectLinks = new Map();
    this.seedDemoData();
  }

  private seedDemoData() {
    const buRetail: BusinessUnit = {
      id: 'bu-retail',
      name: 'Retail Insurance',
      description: 'Consumer-facing life insurance and protection products',
      department: 'Retail Division',
      owner: 'Sarah Johnson',
      createdAt: new Date(),
    };
    const buPensions: BusinessUnit = {
      id: 'bu-pensions',
      name: 'Workplace Pensions',
      description: 'Employer pension schemes and retirement solutions',
      department: 'Institutional Division',
      owner: 'Mark Williams',
      createdAt: new Date(),
    };
    const buWealth: BusinessUnit = {
      id: 'bu-wealth',
      name: 'Wealth Management',
      description: 'Investment and wealth advisory services',
      department: 'Wealth Division',
      owner: 'Emma Thompson',
      createdAt: new Date(),
    };
    this.businessUnits.set(buRetail.id, buRetail);
    this.businessUnits.set(buPensions.id, buPensions);
    this.businessUnits.set(buWealth.id, buWealth);

    const projects = [
      { id: 'proj-1', name: 'Digital Underwriting Platform', description: 'Automating underwriting decisions', status: 'active', businessUnitId: 'bu-retail' },
      { id: 'proj-2', name: 'Customer Portal Refresh', description: 'New self-service portal for policyholders', status: 'active', businessUnitId: 'bu-retail' },
      { id: 'proj-3', name: 'Claims Processing Automation', description: 'Streamlining claims handling with AI', status: 'active', businessUnitId: 'bu-retail' },
      { id: 'proj-4', name: 'Pension Auto-Enrolment Update', description: 'Compliance with new regulations', status: 'active', businessUnitId: 'bu-pensions' },
      { id: 'proj-5', name: 'Retirement Calculator', description: 'New online retirement planning tool', status: 'active', businessUnitId: 'bu-pensions' },
      { id: 'proj-6', name: 'Investment Risk Dashboard', description: 'Real-time portfolio risk monitoring', status: 'active', businessUnitId: 'bu-wealth' },
    ];
    projects.forEach(p => {
      this.projects.set(p.id, { ...p, startDate: null, endDate: null, createdAt: new Date() });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    return this.policies.get(id);
  }

  async createPolicy(insertPolicy: InsertPolicy): Promise<Policy> {
    const id = randomUUID();
    const policy: Policy = { 
      id, 
      name: insertPolicy.name,
      provider: insertPolicy.provider ?? null,
      documentId: insertPolicy.documentId ?? null,
      sourceText: insertPolicy.sourceText ?? null,
      generatedCode: insertPolicy.generatedCode,
      codeFormat: insertPolicy.codeFormat ?? 'yaml',
      createdAt: new Date(),
    };
    this.policies.set(id, policy);
    return policy;
  }

  async deletePolicy(id: string): Promise<void> {
    this.policies.delete(id);
    Array.from(this.policyBusinessUnitLinks.entries())
      .filter(([_, link]) => link.policyId === id)
      .forEach(([key]) => this.policyBusinessUnitLinks.delete(key));
    Array.from(this.policyProjectLinks.entries())
      .filter(([_, link]) => link.policyId === id)
      .forEach(([key]) => this.policyProjectLinks.delete(key));
  }

  async getBusinessUnits(): Promise<BusinessUnit[]> {
    return Array.from(this.businessUnits.values());
  }

  async getBusinessUnit(id: string): Promise<BusinessUnit | undefined> {
    return this.businessUnits.get(id);
  }

  async createBusinessUnit(bu: InsertBusinessUnit): Promise<BusinessUnit> {
    const id = randomUUID();
    const businessUnit: BusinessUnit = { 
      id, 
      name: bu.name,
      description: bu.description ?? null,
      department: bu.department ?? null,
      owner: bu.owner ?? null,
      createdAt: new Date() 
    };
    this.businessUnits.set(id, businessUnit);
    return businessUnit;
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(proj: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      id, 
      name: proj.name,
      description: proj.description ?? null,
      status: proj.status ?? 'active',
      businessUnitId: proj.businessUnitId ?? null,
      startDate: proj.startDate ?? null,
      endDate: proj.endDate ?? null,
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async getProjectsByBusinessUnit(businessUnitId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.businessUnitId === businessUnitId);
  }

  async linkPolicyToBusinessUnit(link: InsertPolicyBusinessUnitLink): Promise<PolicyBusinessUnitLink> {
    const existing = Array.from(this.policyBusinessUnitLinks.values()).find(
      l => l.policyId === link.policyId && l.businessUnitId === link.businessUnitId
    );
    if (existing) return existing;
    
    const id = randomUUID();
    const newLink: PolicyBusinessUnitLink = { ...link, id, createdAt: new Date() };
    this.policyBusinessUnitLinks.set(id, newLink);
    return newLink;
  }

  async unlinkPolicyFromBusinessUnit(policyId: string, businessUnitId: string): Promise<void> {
    const entry = Array.from(this.policyBusinessUnitLinks.entries()).find(
      ([_, link]) => link.policyId === policyId && link.businessUnitId === businessUnitId
    );
    if (entry) this.policyBusinessUnitLinks.delete(entry[0]);
  }

  async getBusinessUnitsForPolicy(policyId: string): Promise<BusinessUnit[]> {
    const linkIds = Array.from(this.policyBusinessUnitLinks.values())
      .filter(link => link.policyId === policyId)
      .map(link => link.businessUnitId);
    return Array.from(this.businessUnits.values()).filter(bu => linkIds.includes(bu.id));
  }

  async getPoliciesForBusinessUnit(businessUnitId: string): Promise<Policy[]> {
    const policyIds = Array.from(this.policyBusinessUnitLinks.values())
      .filter(link => link.businessUnitId === businessUnitId)
      .map(link => link.policyId);
    return Array.from(this.policies.values()).filter(p => policyIds.includes(p.id));
  }

  async linkPolicyToProject(link: InsertPolicyProjectLink): Promise<PolicyProjectLink> {
    const existing = Array.from(this.policyProjectLinks.values()).find(
      l => l.policyId === link.policyId && l.projectId === link.projectId
    );
    if (existing) return existing;
    
    const id = randomUUID();
    const newLink: PolicyProjectLink = { ...link, id, impactLevel: link.impactLevel ?? 'medium', createdAt: new Date() };
    this.policyProjectLinks.set(id, newLink);
    return newLink;
  }

  async unlinkPolicyFromProject(policyId: string, projectId: string): Promise<void> {
    const entry = Array.from(this.policyProjectLinks.entries()).find(
      ([_, link]) => link.policyId === policyId && link.projectId === projectId
    );
    if (entry) this.policyProjectLinks.delete(entry[0]);
  }

  async getProjectsForPolicy(policyId: string): Promise<(Project & { impactLevel: string })[]> {
    const links = Array.from(this.policyProjectLinks.values())
      .filter(link => link.policyId === policyId);
    return links.map(link => {
      const project = this.projects.get(link.projectId);
      return project ? { ...project, impactLevel: link.impactLevel || 'medium' } : null;
    }).filter(Boolean) as (Project & { impactLevel: string })[];
  }

  async getPoliciesForProject(projectId: string): Promise<Policy[]> {
    const policyIds = Array.from(this.policyProjectLinks.values())
      .filter(link => link.projectId === projectId)
      .map(link => link.policyId);
    return Array.from(this.policies.values()).filter(p => policyIds.includes(p.id));
  }
}

export const storage = new MemStorage();
