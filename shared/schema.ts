import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const policies = pgTable("policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: text("provider"),
  documentId: text("document_id"),
  sourceText: text("source_text"),
  generatedCode: text("generated_code").notNull(),
  codeFormat: text("code_format").default("yaml"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
  createdAt: true,
});

export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policies.$inferSelect;

export const businessUnits = pgTable("business_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  department: text("department"),
  owner: text("owner"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBusinessUnitSchema = createInsertSchema(businessUnits).omit({
  id: true,
  createdAt: true,
});

export type InsertBusinessUnit = z.infer<typeof insertBusinessUnitSchema>;
export type BusinessUnit = typeof businessUnits.$inferSelect;

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"),
  businessUnitId: varchar("business_unit_id"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const policyBusinessUnitLinks = pgTable("policy_business_unit_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policyId: varchar("policy_id").notNull(),
  businessUnitId: varchar("business_unit_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPolicyBusinessUnitLinkSchema = createInsertSchema(policyBusinessUnitLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertPolicyBusinessUnitLink = z.infer<typeof insertPolicyBusinessUnitLinkSchema>;
export type PolicyBusinessUnitLink = typeof policyBusinessUnitLinks.$inferSelect;

export const policyProjectLinks = pgTable("policy_project_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policyId: varchar("policy_id").notNull(),
  projectId: varchar("project_id").notNull(),
  impactLevel: text("impact_level").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPolicyProjectLinkSchema = createInsertSchema(policyProjectLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertPolicyProjectLink = z.infer<typeof insertPolicyProjectLinkSchema>;
export type PolicyProjectLink = typeof policyProjectLinks.$inferSelect;

// Agent Memory System - Stores agent actions, learnings, and patterns
export const agentMemory = pgTable("agent_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: text("agent_id").notNull(), // vro, pmo, tmo, finops, etc.
  memoryType: text("memory_type").notNull(), // action, pattern, insight, learning
  targetType: text("target_type"), // project, metric, team, portfolio
  targetId: text("target_id"),
  targetName: text("target_name"),
  content: text("content").notNull(), // The actual memory/learning
  confidence: text("confidence").default("0.75"), // Stored as text, parsed as number
  metadata: text("metadata"), // JSON string for additional context
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemory.$inferSelect;

// Agent Task Queue - For orchestration layer
export const agentTaskQueue = pgTable("agent_task_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignedAgent: text("assigned_agent").notNull(),
  taskType: text("task_type").notNull(), // investigate, escalate, notify, mitigate, etc.
  priority: text("priority").default("medium"), // low, medium, high, critical
  status: text("status").default("pending"), // pending, in_progress, completed, cancelled
  targetType: text("target_type"),
  targetId: text("target_id"),
  targetName: text("target_name"),
  description: text("description").notNull(),
  reasoning: text("reasoning"),
  delegatedBy: text("delegated_by"), // Which agent or system created this task
  conflictsWith: text("conflicts_with"), // JSON array of task IDs this conflicts with
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentTaskQueueSchema = createInsertSchema(agentTaskQueue).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertAgentTaskQueue = z.infer<typeof insertAgentTaskQueueSchema>;
export type AgentTaskQueue = typeof agentTaskQueue.$inferSelect;

// Learned Patterns - Historical pattern detection
export const agentPatterns = pgTable("agent_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patternType: text("pattern_type").notNull(), // schedule_slip, budget_overrun, resource_constraint, etc.
  targetType: text("target_type").notNull(), // team, project_type, portfolio, phase
  targetIdentifier: text("target_identifier").notNull(), // e.g., "Cloud Team", "Infrastructure", "Week 3"
  description: text("description").notNull(),
  occurrences: text("occurrences").default("1"), // Stored as text, parsed as number
  confidence: text("confidence").default("0.5"),
  lastObserved: timestamp("last_observed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentPatternSchema = createInsertSchema(agentPatterns).omit({
  id: true,
  createdAt: true,
  lastObserved: true,
});

export type InsertAgentPattern = z.infer<typeof insertAgentPatternSchema>;
export type AgentPattern = typeof agentPatterns.$inferSelect;
