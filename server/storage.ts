import { type User, type InsertUser, type Policy, type InsertPolicy } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: string): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  deletePolicy(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private policies: Map<string, Policy>;

  constructor() {
    this.users = new Map();
    this.policies = new Map();
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
  }
}

export const storage = new MemStorage();
