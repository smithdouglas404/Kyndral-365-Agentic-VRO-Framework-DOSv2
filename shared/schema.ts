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
  priority: text("priority").default("medium"),
  expectedRoi: text("expected_roi"),
  roiValue: text("roi_value"),
  artName: text("art_name"),
  portfolioTheme: text("portfolio_theme"),
  safeStage: text("safe_stage").default("funnel"),
  currentPi: text("current_pi"),
  totalPis: text("total_pis"),
  velocity: text("velocity"),
  predictability: text("predictability"),
  flowEfficiency: text("flow_efficiency"),
  epicId: text("epic_id"),
  epicName: text("epic_name"),
  epicProgress: text("epic_progress"),
  budgetSpent: text("budget_spent"),
  budgetTotal: text("budget_total"),
  budgetUnit: text("budget_unit").default("$m"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const features = pgTable("features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("backlog"),
  storyPoints: text("story_points"),
  completedPoints: text("completed_points"),
  priority: text("priority").default("medium"),
  targetPi: text("target_pi"),
  acceptanceCriteria: text("acceptance_criteria"),
  wsjfScore: text("wsjf_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  createdAt: true,
});

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof features.$inferSelect;

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureId: varchar("feature_id").notNull(),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("backlog"),
  storyPoints: text("story_points"),
  sprint: text("sprint"),
  assignedTeam: text("assigned_team"),
  acceptanceCriteria: text("acceptance_criteria"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull(),
  featureId: varchar("feature_id").notNull(),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("todo"),
  effortHours: text("effort_hours"),
  assignee: text("assignee"),
  skills: text("skills"),
  priority: text("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  allocation: text("allocation"),
  team: text("team"),
  skills: text("skills"),
  costRate: text("cost_rate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  targetDate: timestamp("target_date"),
  status: text("status").default("pending"),
  deliverables: text("deliverables"),
  piNumber: text("pi_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export const dependencies = pgTable("dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  dependencyType: text("dependency_type").default("related"),
  status: text("status").default("green"),
  description: text("description"),
  targetProjectId: varchar("target_project_id"),
  impactIfDelayed: text("impact_if_delayed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
  createdAt: true,
});

export type InsertDependency = z.infer<typeof insertDependencySchema>;
export type Dependency = typeof dependencies.$inferSelect;

export const projectFinancials = pgTable("project_financials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().unique(),
  capitalex: text("capitalex"),
  opex: text("opex"),
  contingency: text("contingency"),
  npv: text("npv"),
  irr: text("irr"),
  paybackMonths: text("payback_months"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectFinancialsSchema = createInsertSchema(projectFinancials).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectFinancials = z.infer<typeof insertProjectFinancialsSchema>;
export type ProjectFinancials = typeof projectFinancials.$inferSelect;

export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  probability: text("probability").default("medium"),
  impact: text("impact").default("medium"),
  status: text("status").default("open"),
  mitigation: text("mitigation"),
  owner: text("owner"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
});

export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect;

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

// Project Metrics - Database-backed metrics for reactive monitoring
export const projectMetrics = pgTable("project_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  projectName: text("project_name").notNull(),
  metricKey: text("metric_key").notNull(), // spi, cpi, okr_progress, change_adoption, sprint_velocity
  metricName: text("metric_name").notNull(),
  currentValue: text("current_value").notNull(), // Stored as text, parsed as decimal
  previousValue: text("previous_value"), // For change detection
  threshold: text("threshold").notNull(), // Warning threshold
  criticalThreshold: text("critical_threshold"), // Critical threshold
  direction: text("direction").default("higher_is_better"), // higher_is_better, lower_is_better
  unit: text("unit").default("decimal"), // decimal, percentage, days, currency
  agentOwner: text("agent_owner").notNull(), // finops, planning, okr, ocm, tmo
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectMetricSchema = createInsertSchema(projectMetrics).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export type InsertProjectMetric = z.infer<typeof insertProjectMetricSchema>;
export type ProjectMetric = typeof projectMetrics.$inferSelect;

// Risk Interventions - AI-detected risks requiring human decision
export const interventions = pgTable("interventions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // dependency, budget, timeline, resource, quality
  severity: text("severity").notNull(), // critical, high, medium
  title: text("title").notNull(),
  description: text("description").notNull(),
  projectId: text("project_id"),
  projectName: text("project_name"),
  confidence: text("confidence").default("0.85"),
  suggestedAction: text("suggested_action").notNull(),
  impact: text("impact"),
  status: text("status").default("pending"), // pending, approved, dismissed, executing
  agentSource: text("agent_source").notNull(), // Which agent detected this
  isAutonomous: text("is_autonomous").default("false"), // true if created by agent without human input
  selfApproved: text("self_approved").default("false"), // true if agent self-approved (full autonomy)
  triggerSource: text("trigger_source").default("manual"), // metric_breach, agent_detection, agent_escalation, manual
  escalatedFromAgentId: text("escalated_from_agent_id"), // If escalated from another agent
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  dismissedBy: text("dismissed_by"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInterventionSchema = createInsertSchema(interventions).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  dismissedAt: true,
});

export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type Intervention = typeof interventions.$inferSelect;

// Agent Discussions - Multi-agent collaboration threads
export const agentDiscussions = pgTable("agent_discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topic: text("topic").notNull(),
  projectId: text("project_id"),
  projectName: text("project_name"),
  priority: text("priority").default("medium"), // low, medium, high, critical
  status: text("status").default("active"), // active, resolved, archived
  consensusReached: text("consensus_reached").default("false"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertAgentDiscussionSchema = createInsertSchema(agentDiscussions).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertAgentDiscussion = z.infer<typeof insertAgentDiscussionSchema>;
export type AgentDiscussion = typeof agentDiscussions.$inferSelect;

// Discussion Messages - Individual agent contributions to a discussion
export const discussionMessages = pgTable("discussion_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discussionId: varchar("discussion_id").notNull(),
  agentId: text("agent_id").notNull(), // planning, finops, governance, tmo, etc.
  agentName: text("agent_name").notNull(),
  messageType: text("message_type").notNull(), // analysis, recommendation, question, agreement, action
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiscussionMessageSchema = createInsertSchema(discussionMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertDiscussionMessage = z.infer<typeof insertDiscussionMessageSchema>;
export type DiscussionMessage = typeof discussionMessages.$inferSelect;

// Agent Activity Log - Real-time log of autonomous agent actions
export const agentActivityLog = pgTable("agent_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // detection, escalation, autonomous_action, agent_to_agent, approval_executed
  primaryAgentId: text("primary_agent_id").notNull(), // The agent that initiated the action
  primaryAgentName: text("primary_agent_name").notNull(),
  secondaryAgentId: text("secondary_agent_id"), // For agent-to-agent interactions
  secondaryAgentName: text("secondary_agent_name"),
  interventionId: text("intervention_id"), // Link to intervention if applicable
  summary: text("summary").notNull(), // Human-readable summary
  details: text("details"), // JSON payload with additional context
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentActivityLogSchema = createInsertSchema(agentActivityLog).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentActivityLog = z.infer<typeof insertAgentActivityLogSchema>;
export type AgentActivityLog = typeof agentActivityLog.$inferSelect;

// OKRs - Objectives and Key Results with source attribution
export const okrs = pgTable("okrs", {
  id: varchar("id").primaryKey(),
  objective: text("objective").notNull(),
  businessUnitId: text("business_unit_id"),
  strategicPriority: text("strategic_priority").default("high"), // critical, high, medium
  owner: text("owner"),
  overallProgress: text("overall_progress").default("0"),
  status: text("status").default("active"), // active, completed, at-risk
  dataSource: text("data_source"), // e.g., "NextEra 2025 Investor Presentation"
  dataSourceUrl: text("data_source_url"), // URL to source document
  dataSourceDate: text("data_source_date"), // Date of source data
  fiscalYear: text("fiscal_year"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOkrSchema = createInsertSchema(okrs).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertOkr = z.infer<typeof insertOkrSchema>;
export type Okr = typeof okrs.$inferSelect;

// Key Results - Individual measurable results for OKRs
export const keyResults = pgTable("key_results", {
  id: varchar("id").primaryKey(),
  okrId: varchar("okr_id").notNull().references(() => okrs.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  metricName: text("metric_name"),
  currentValue: text("current_value"),
  targetValue: text("target_value"),
  baselineValue: text("baseline_value"),
  unit: text("unit").default("%"),
  progress: text("progress").default("0"),
  trend: text("trend").default("stable"), // up, down, stable
  dataSource: text("data_source"),
  dataSourceUrl: text("data_source_url"),
  lastMeasuredDate: text("last_measured_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKeyResultSchema = createInsertSchema(keyResults).omit({
  createdAt: true,
});

export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type KeyResult = typeof keyResults.$inferSelect;

// KPIs - Key Performance Indicators with source attribution
export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey(),
  projectId: text("project_id"),
  businessUnitId: text("business_unit_id"),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // financial, operational, strategic, customer
  currentValue: text("current_value"),
  targetValue: text("target_value"),
  baselineValue: text("baseline_value"),
  unit: text("unit").default("%"),
  trend: text("trend").default("stable"), // up, down, stable
  weight: text("weight").default("1"),
  dataSource: text("data_source"), // e.g., "FPL 2024 10-K Filing"
  dataSourceUrl: text("data_source_url"),
  dataSourceDate: text("data_source_date"),
  measurementFrequency: text("measurement_frequency").default("quarterly"),
  lastMeasuredDate: text("last_measured_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKpiSchema = createInsertSchema(kpis).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpis.$inferSelect;
