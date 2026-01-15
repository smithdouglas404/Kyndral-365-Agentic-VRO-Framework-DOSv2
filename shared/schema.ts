import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
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

// ============================================================================
// DIVISIONS - NextEra Energy Business Segments (from official filings)
// ============================================================================

export const divisions = pgTable("divisions", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  ceo: text("ceo"),
  profit2023: integer("profit_2023"), // in millions
  profit2024: integer("profit_2024"), // in millions
  changePercent: real("change_percent"),
  description: text("description"),
  color: text("color"), // Brand color hex
  portfolioId: varchar("portfolio_id"), // Link to SAFe portfolio
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDivisionSchema = createInsertSchema(divisions).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertDivision = z.infer<typeof insertDivisionSchema>;
export type Division = typeof divisions.$inferSelect;

// Division KPIs - Key Performance Indicators by division
export const divisionKpis = pgTable("division_kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: varchar("division_id").notNull().references(() => divisions.id),
  name: text("name").notNull(),
  value2023: text("value_2023"),
  value2024: text("value_2024"),
  target2025: text("target_2025"),
  unit: text("unit"),
  trend: text("trend").default("stable"), // up, down, stable
  status: text("status").default("on-track"), // on-track, at-risk, off-track
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDivisionKpiSchema = createInsertSchema(divisionKpis).omit({
  id: true,
  createdAt: true,
});

export type InsertDivisionKpi = z.infer<typeof insertDivisionKpiSchema>;
export type DivisionKpi = typeof divisionKpis.$inferSelect;

// Division OKRs - Objectives & Key Results by division
export const divisionOkrs = pgTable("division_okrs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: varchar("division_id").notNull().references(() => divisions.id),
  objective: text("objective").notNull(),
  keyResults: text("key_results"), // JSON array of key results
  owner: text("owner"),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDivisionOkrSchema = createInsertSchema(divisionOkrs).omit({
  id: true,
  createdAt: true,
});

export type InsertDivisionOkr = z.infer<typeof insertDivisionOkrSchema>;
export type DivisionOkr = typeof divisionOkrs.$inferSelect;

// Division Risks - Risk registry by division
export const divisionRisks = pgTable("division_risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: varchar("division_id").notNull().references(() => divisions.id),
  type: text("type").notNull(),
  level: text("level").default("medium"), // low, medium, high
  description: text("description"),
  mitigation: text("mitigation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDivisionRiskSchema = createInsertSchema(divisionRisks).omit({
  id: true,
  createdAt: true,
});

export type InsertDivisionRisk = z.infer<typeof insertDivisionRiskSchema>;
export type DivisionRisk = typeof divisionRisks.$inferSelect;

// ============================================================================
// COMPANY OVERVIEW - NextEra Energy Corporate Info (from official filings)
// ============================================================================

export const companyOverview = pgTable("company_overview", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull().default("NextEra Energy"),
  yearsOfHistory: integer("years_of_history"),
  employees: integer("employees"),
  adjustedOperatingProfitValue: real("adjusted_operating_profit_value"), // in millions
  adjustedOperatingProfitUnit: text("adjusted_operating_profit_unit").default("$m"),
  adjustedOperatingProfitYear: integer("adjusted_operating_profit_year"),
  assetsUnderManagementValue: real("assets_under_management_value"), // in billions
  assetsUnderManagementUnit: text("assets_under_management_unit").default("$bn"),
  proprietaryAssetsValue: real("proprietary_assets_value"), // in GW
  proprietaryAssetsUnit: text("proprietary_assets_unit").default("GW"),
  fortune200: boolean("fortune_200").default(false),
  ceo: text("ceo"),
  cfo: text("cfo"),
  cro: text("cro"),
  climateDirector: text("climate_director"),
  source: text("source"),
  // ESG Ratings
  sustainalyticsPercentile: integer("sustainalytics_percentile"),
  sustainalyticsRating: text("sustainalytics_rating"),
  msciRating: text("msci_rating"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanyOverviewSchema = createInsertSchema(companyOverview).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanyOverview = z.infer<typeof insertCompanyOverviewSchema>;
export type CompanyOverview = typeof companyOverview.$inferSelect;

// ============================================================================
// CLIMATE DATA - Sustainability & Environmental Metrics (from official filings)
// ============================================================================

export const climateMetrics = pgTable("climate_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // headline, operational, targets, cleanEnergy, context, nature
  metricName: text("metric_name").notNull(),
  value: real("value"),
  unit: text("unit"),
  description: text("description"),
  targetValue: real("target_value"),
  targetYear: integer("target_year"),
  baseYear: integer("base_year"),
  progress: real("progress"),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClimateMetricSchema = createInsertSchema(climateMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertClimateMetric = z.infer<typeof insertClimateMetricSchema>;
export type ClimateMetric = typeof climateMetrics.$inferSelect;

// ============================================================================
// ENTERPRISE RISKS - Corporate Risk Registry (from official filings)
// ============================================================================

export const enterpriseRiskCategories = pgTable("enterprise_risk_categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnterpriseRiskCategorySchema = createInsertSchema(enterpriseRiskCategories).omit({
  createdAt: true,
});

export type InsertEnterpriseRiskCategory = z.infer<typeof insertEnterpriseRiskCategorySchema>;
export type EnterpriseRiskCategory = typeof enterpriseRiskCategories.$inferSelect;

export const enterpriseRisks = pgTable("enterprise_risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => enterpriseRiskCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  severity: text("severity").default("medium"), // low, medium, high
  trend: text("trend").default("stable"), // improving, stable, worsening
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnterpriseRiskSchema = createInsertSchema(enterpriseRisks).omit({
  id: true,
  createdAt: true,
});

export type InsertEnterpriseRisk = z.infer<typeof insertEnterpriseRiskSchema>;
export type EnterpriseRisk = typeof enterpriseRisks.$inferSelect;

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"),
  businessUnitId: varchar("business_unit_id"),
  divisionId: varchar("division_id"), // FK to divisions (added for SAFe hierarchy)
  portfolioId: varchar("portfolio_id"), // FK to portfolios (added for SAFe hierarchy)
  valueStreamId: varchar("value_stream_id"), // FK to value_streams (added for SAFe hierarchy)
  artId: varchar("art_id"), // FK to arts (added for SAFe hierarchy)
  teamId: varchar("team_id"), // FK to teams (added for SAFe hierarchy)
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  priority: text("priority").default("medium"),
  expectedRoi: text("expected_roi"),
  roiValue: text("roi_value"),
  artName: text("art_name"), // Keep for backward compatibility
  portfolioTheme: text("portfolio_theme"), // Keep for backward compatibility
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

// Alerts - System alerts and notifications from agents and integrations
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").default("medium"), // critical, high, medium, low, info
  category: text("category").default("system"), // system, sync, agent, risk, budget, schedule, quality
  status: text("status").default("active"), // active, acknowledged, resolved, dismissed
  source: text("source"), // which agent or system generated it
  sourceEntityType: text("source_entity_type"), // project, feature, story, task, etc.
  sourceEntityId: text("source_entity_id"),
  metadata: text("metadata"), // JSON with additional alert context
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

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

// ============================================================================
// SAFe ONTOLOGY HIERARCHY - Complete Well-Architected Model
// Portfolio → Value Stream → ART → Team → PI → Epic → Capability → Feature → Story → Task
// ============================================================================

// Strategic Themes - High-level business objectives that guide portfolio investment
export const strategicThemes = pgTable("strategic_themes", {
  id: varchar("id").primaryKey(),
  portfolioId: varchar("portfolio_id"),
  name: text("name").notNull(),
  description: text("description"),
  timeHorizon: text("time_horizon").default("3-year"), // 1-year, 3-year, 5-year
  budgetAllocation: text("budget_allocation"), // % of portfolio budget
  status: text("status").default("active"), // active, retired, planned
  linkedOkrIds: text("linked_okr_ids"), // JSON array of OKR ids
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStrategicThemeSchema = createInsertSchema(strategicThemes).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertStrategicTheme = z.infer<typeof insertStrategicThemeSchema>;
export type StrategicTheme = typeof strategicThemes.$inferSelect;

// Portfolios - Top level of SAFe hierarchy
export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  vision: text("vision"),
  strategicThemes: text("strategic_themes"), // JSON array of themes
  owner: text("owner"),
  status: text("status").default("active"), // active, planning, closed
  budgetAllocation: text("budget_allocation"),
  budgetUnit: text("budget_unit").default("$M"),
  fiscalYear: text("fiscal_year"),
  // External sync fields
  externalSystem: text("external_system"), // jira, azure-devops, servicenow, etc.
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"), // none, synced, pending, error
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

// Value Streams - Flow of value through the portfolio
export const valueStreams = pgTable("value_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("operational"), // operational, development
  customerSegment: text("customer_segment"),
  valueProposition: text("value_proposition"),
  owner: text("owner"),
  status: text("status").default("active"),
  leadTime: text("lead_time"), // Average lead time in days
  throughput: text("throughput"), // Items delivered per PI
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertValueStreamSchema = createInsertSchema(valueStreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertValueStream = z.infer<typeof insertValueStreamSchema>;
export type ValueStream = typeof valueStreams.$inferSelect;

// Agile Release Trains (ARTs) - Long-lived team of agile teams
export const arts = pgTable("arts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  valueStreamId: varchar("value_stream_id").references(() => valueStreams.id),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  name: text("name").notNull(),
  description: text("description"),
  releaseTrainEngineer: text("release_train_engineer"), // RTE name
  productManager: text("product_manager"),
  systemArchitect: text("system_architect"),
  status: text("status").default("active"),
  piCadence: text("pi_cadence").default("10 weeks"), // Typical PI duration
  teamCount: text("team_count"),
  velocity: text("velocity"), // Average story points per PI
  predictability: text("predictability"), // % of committed work delivered
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArtSchema = createInsertSchema(arts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertArt = z.infer<typeof insertArtSchema>;
export type Art = typeof arts.$inferSelect;

// Teams - Agile teams within an ART
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artId: varchar("art_id").references(() => arts.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("feature"), // feature, platform, enabler, shared-services
  scrumMaster: text("scrum_master"),
  productOwner: text("product_owner"),
  techLead: text("tech_lead"),
  memberCount: text("member_count"),
  capacity: text("capacity"), // Story points per sprint
  velocity: text("velocity"), // Average story points delivered
  sprintLength: text("sprint_length").default("2 weeks"),
  status: text("status").default("active"),
  skills: text("skills"), // JSON array of team skills
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Program Increments (PIs) - Planning and execution timebox
export const programIncrements = pgTable("program_increments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artId: varchar("art_id").references(() => arts.id),
  name: text("name").notNull(), // e.g., "PI 2025.1"
  description: text("description"),
  piNumber: text("pi_number"), // e.g., "2025.1"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  ipIterationStart: timestamp("ip_iteration_start"), // Innovation & Planning iteration
  ipIterationEnd: timestamp("ip_iteration_end"),
  status: text("status").default("planning"), // planning, executing, complete
  objectives: text("objectives"), // JSON array of PI objectives
  committedPoints: text("committed_points"),
  deliveredPoints: text("delivered_points"),
  predictability: text("predictability"), // delivered/committed %
  businessValue: text("business_value"), // Total business value delivered
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramIncrementSchema = createInsertSchema(programIncrements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertProgramIncrement = z.infer<typeof insertProgramIncrementSchema>;
export type ProgramIncrement = typeof programIncrements.$inferSelect;

// Epics - Large initiatives spanning multiple PIs
export const epics = pgTable("epics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  valueStreamId: varchar("value_stream_id").references(() => valueStreams.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("business"), // business, enabler
  status: text("status").default("funnel"), // funnel, analyzing, backlog, implementing, done
  owner: text("owner"),
  hypothesis: text("hypothesis"), // Lean business case hypothesis
  expectedOutcome: text("expected_outcome"),
  acceptanceCriteria: text("acceptance_criteria"),
  estimatedSize: text("estimated_size"), // T-shirt size or story points
  wsjfScore: text("wsjf_score"), // Weighted Shortest Job First
  mvp: text("mvp"), // Minimum viable product definition
  // Financial lean business case
  estimatedCost: text("estimated_cost"),
  estimatedBenefit: text("estimated_benefit"),
  budgetUnit: text("budget_unit").default("$M"),
  targetPi: text("target_pi"), // Target PI for completion
  actualPi: text("actual_pi"), // Actual PI completed
  progress: text("progress").default("0"),
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEpicSchema = createInsertSchema(epics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertEpic = z.infer<typeof insertEpicSchema>;
export type Epic = typeof epics.$inferSelect;

// Capabilities - Large solution-level behaviors (Solution Train level)
export const capabilities = pgTable("capabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  epicId: varchar("epic_id").references(() => epics.id),
  valueStreamId: varchar("value_stream_id").references(() => valueStreams.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("business"), // business, enabler
  status: text("status").default("funnel"),
  owner: text("owner"),
  storyPoints: text("story_points"),
  completedPoints: text("completed_points"),
  wsjfScore: text("wsjf_score"),
  targetPi: text("target_pi"),
  acceptanceCriteria: text("acceptance_criteria"),
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCapabilitySchema = createInsertSchema(capabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertCapability = z.infer<typeof insertCapabilitySchema>;
export type Capability = typeof capabilities.$inferSelect;

// Sprints/Iterations - Time-boxed development cycles
export const sprints = pgTable("sprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programIncrementId: varchar("program_increment_id").references(() => programIncrements.id),
  teamId: varchar("team_id").references(() => teams.id),
  name: text("name").notNull(), // e.g., "Sprint 2025.1.3"
  sprintNumber: text("sprint_number"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  goal: text("goal"),
  status: text("status").default("planning"), // planning, active, complete
  plannedPoints: text("planned_points"),
  completedPoints: text("completed_points"),
  velocity: text("velocity"),
  // External sync fields
  externalSystem: text("external_system"),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSprintSchema = createInsertSchema(sprints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type Sprint = typeof sprints.$inferSelect;

// ============================================================================
// MCP ADAPTER & INTEGRATION CONFIGURATION
// ============================================================================

// Source Systems - External PPM tools that can sync with our ontology
export const sourceSystems = pgTable("source_systems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Corporate Jira", "Azure DevOps Prod"
  type: text("type").notNull(), // jira, azure-devops, servicenow, asana, monday, confluence
  baseUrl: text("base_url"), // e.g., "https://company.atlassian.net"
  authType: text("auth_type").default("api_key"), // api_key, oauth2, basic, pat
  status: text("status").default("disconnected"), // connected, disconnected, error
  lastConnectedAt: timestamp("last_connected_at"),
  syncFrequency: text("sync_frequency").default("hourly"), // realtime, hourly, daily, manual
  syncDirection: text("sync_direction").default("bidirectional"), // inbound, outbound, bidirectional
  defaultPortfolioId: varchar("default_portfolio_id"),
  capabilities: text("capabilities"), // JSON array: ["projects", "issues", "sprints", "users"]
  mcpServerEndpoint: text("mcp_server_endpoint"), // MCP server URL for this source
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSourceSystemSchema = createInsertSchema(sourceSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastConnectedAt: true,
});

export type InsertSourceSystem = z.infer<typeof insertSourceSystemSchema>;
export type SourceSystem = typeof sourceSystems.$inferSelect;

// MCP Adapters - Configuration for Model Context Protocol servers
export const mcpAdapters = pgTable("mcp_adapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystemId: varchar("source_system_id").references(() => sourceSystems.id),
  name: text("name").notNull(),
  adapterType: text("adapter_type").notNull(), // jira-mcp, azure-devops-mcp, servicenow-mcp
  version: text("version").default("1.0.0"),
  serverUrl: text("server_url"), // MCP server endpoint
  status: text("status").default("inactive"), // active, inactive, error
  supportedTools: text("supported_tools"), // JSON array of MCP tools available
  supportedResources: text("supported_resources"), // JSON array of MCP resources
  configuration: text("configuration"), // JSON config for the adapter
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: text("health_status").default("unknown"), // healthy, degraded, unhealthy, unknown
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMcpAdapterSchema = createInsertSchema(mcpAdapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastHealthCheck: true,
});

export type InsertMcpAdapter = z.infer<typeof insertMcpAdapterSchema>;
export type McpAdapter = typeof mcpAdapters.$inferSelect;

// Field Mappings - Map external fields to SAFe ontology
export const fieldMappings = pgTable("field_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystemId: varchar("source_system_id").references(() => sourceSystems.id),
  name: text("name").notNull(), // Human-readable mapping name
  sourceEntityType: text("source_entity_type").notNull(), // e.g., "issue", "project", "sprint"
  sourceFieldPath: text("source_field_path").notNull(), // e.g., "fields.customfield_10001"
  targetEntityType: text("target_entity_type").notNull(), // portfolio, valueStream, art, epic, feature, story, task
  targetFieldPath: text("target_field_path").notNull(), // e.g., "wsjfScore", "storyPoints"
  transformType: text("transform_type").default("direct"), // direct, lookup, formula, custom
  transformConfig: text("transform_config"), // JSON config for transformation
  isRequired: text("is_required").default("false"),
  defaultValue: text("default_value"),
  validationRules: text("validation_rules"), // JSON array of validation rules
  status: text("status").default("active"), // active, disabled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFieldMappingSchema = createInsertSchema(fieldMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFieldMapping = z.infer<typeof insertFieldMappingSchema>;
export type FieldMapping = typeof fieldMappings.$inferSelect;

// Ingestion Jobs - Track data import/sync operations
export const ingestionJobs = pgTable("ingestion_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystemId: varchar("source_system_id").references(() => sourceSystems.id),
  jobType: text("job_type").notNull(), // full_sync, incremental, file_import, webhook
  status: text("status").default("pending"), // pending, running, completed, failed, cancelled
  triggerType: text("trigger_type").default("manual"), // manual, scheduled, webhook
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  itemsProcessed: text("items_processed").default("0"),
  itemsCreated: text("items_created").default("0"),
  itemsUpdated: text("items_updated").default("0"),
  itemsSkipped: text("items_skipped").default("0"),
  itemsFailed: text("items_failed").default("0"),
  errorLog: text("error_log"), // JSON array of errors
  sourceData: text("source_data"), // Original file path or API response summary
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIngestionJobSchema = createInsertSchema(ingestionJobs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export type InsertIngestionJob = z.infer<typeof insertIngestionJobSchema>;
export type IngestionJob = typeof ingestionJobs.$inferSelect;

// Staging Table - Temporary storage for uploaded/imported data before mapping
export const stagingRecords = pgTable("staging_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingestionJobId: varchar("ingestion_job_id").references(() => ingestionJobs.id),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: text("source_entity_id"),
  rawData: text("raw_data").notNull(), // JSON of original record
  mappedData: text("mapped_data"), // JSON after field mapping applied
  targetEntityType: text("target_entity_type"),
  targetEntityId: text("target_entity_id"), // ID in our ontology if matched
  status: text("status").default("pending"), // pending, validated, mapped, imported, error
  validationErrors: text("validation_errors"), // JSON array of validation errors
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStagingRecordSchema = createInsertSchema(stagingRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertStagingRecord = z.infer<typeof insertStagingRecordSchema>;
export type StagingRecord = typeof stagingRecords.$inferSelect;

// Sync Audit Log - Track all sync operations for traceability
export const syncAuditLog = pgTable("sync_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystemId: varchar("source_system_id"),
  ingestionJobId: varchar("ingestion_job_id"),
  operation: text("operation").notNull(), // create, update, delete, link
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  externalEntityType: text("external_entity_type"),
  externalEntityId: text("external_entity_id"),
  changeDetails: text("change_details"), // JSON of field changes
  status: text("status").default("success"), // success, failed, conflict
  conflictResolution: text("conflict_resolution"), // How conflict was resolved
  performedBy: text("performed_by"), // User or system that performed the operation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSyncAuditLogSchema = createInsertSchema(syncAuditLog).omit({
  id: true,
  createdAt: true,
});

export type InsertSyncAuditLog = z.infer<typeof insertSyncAuditLogSchema>;
export type SyncAuditLog = typeof syncAuditLog.$inferSelect;

// ============================================================================
// SAFe ONTOLOGY ENTITY TYPES - For unified queries and MCP tool mapping
// ============================================================================

export const safeEntityTypes = [
  "portfolio",
  "value-stream", 
  "art",
  "team",
  "program-increment",
  "epic",
  "capability",
  "feature",
  "story",
  "task",
  "sprint",
  "milestone",
  "dependency",
  "risk",
  "resource",
  "okr",
  "kpi"
] as const;

export type SafeEntityType = typeof safeEntityTypes[number];

// MCP Tool to SAFe Entity Mapping - Maps MCP server tools to our ontology
export const mcpToolMappings = pgTable("mcp_tool_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mcpAdapterId: varchar("mcp_adapter_id").references(() => mcpAdapters.id),
  mcpToolName: text("mcp_tool_name").notNull(), // e.g., "jira_create_issue", "azure_get_work_items"
  safeEntityType: text("safe_entity_type").notNull(), // Maps to SafeEntityType
  operation: text("operation").notNull(), // create, read, update, delete, list, search
  inputMapping: text("input_mapping"), // JSON: how to map SAFe entity to MCP tool input
  outputMapping: text("output_mapping"), // JSON: how to map MCP tool output to SAFe entity
  isEnabled: text("is_enabled").default("true"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMcpToolMappingSchema = createInsertSchema(mcpToolMappings).omit({
  id: true,
  createdAt: true,
});

export type InsertMcpToolMapping = z.infer<typeof insertMcpToolMappingSchema>;
export type McpToolMapping = typeof mcpToolMappings.$inferSelect;

// ============================================================================
// MCP SYNC JOBS - Scheduled sync configurations with cron expressions
// ============================================================================

export const syncJobs = pgTable("sync_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  mcpAdapterId: varchar("mcp_adapter_id").references(() => mcpAdapters.id),
  sourceSystemId: varchar("source_system_id").references(() => sourceSystems.id),
  syncType: text("sync_type").notNull(), // full, incremental, delta
  syncDirection: text("sync_direction").notNull(), // inbound, outbound, bidirectional
  cronExpression: text("cron_expression"), // e.g., "0 */6 * * *" (every 6 hours)
  isEnabled: text("is_enabled").default("true"),
  entityTypes: text("entity_types"), // JSON array of SAFe entity types to sync
  filterCriteria: text("filter_criteria"), // JSON query filters
  fieldMappingOverrides: text("field_mapping_overrides"), // JSON field mapping customizations
  conflictResolutionStrategy: text("conflict_resolution_strategy").default("last_write_wins"), // last_write_wins, source_wins, target_wins, manual
  retryPolicy: text("retry_policy"), // JSON: maxRetries, backoffMs, etc.
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: text("last_run_status"), // success, failed, partial
  lastRunError: text("last_run_error"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSyncJobSchema = createInsertSchema(syncJobs).omit({
  id: true,
  lastRunAt: true,
  lastRunStatus: true,
  lastRunError: true,
  nextRunAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSyncJob = z.infer<typeof insertSyncJobSchema>;
export type SyncJob = typeof syncJobs.$inferSelect;

// Sync Job Runs - Execution history for sync jobs
export const syncJobRuns = pgTable("sync_job_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncJobId: varchar("sync_job_id").references(() => syncJobs.id),
  triggeredBy: text("triggered_by").notNull(), // schedule, manual, webhook
  status: text("status").default("pending"), // pending, running, success, failed, cancelled
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsDeleted: integer("records_deleted").default(0),
  recordsFailed: integer("records_failed").default(0),
  conflictsDetected: integer("conflicts_detected").default(0),
  conflictsResolved: integer("conflicts_resolved").default(0),
  errorLog: text("error_log"), // JSON array of errors
  summary: text("summary"), // JSON summary of sync results
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSyncJobRunSchema = createInsertSchema(syncJobRuns).omit({
  id: true,
  createdAt: true,
});

export type InsertSyncJobRun = z.infer<typeof insertSyncJobRunSchema>;
export type SyncJobRun = typeof syncJobRuns.$inferSelect;

// ============================================================================
// WEBHOOK ENDPOINTS - Incoming webhook handlers for external PPM tools
// ============================================================================

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  sourceSystemId: varchar("source_system_id").references(() => sourceSystems.id),
  mcpAdapterId: varchar("mcp_adapter_id").references(() => mcpAdapters.id),
  endpointPath: text("endpoint_path").notNull(), // e.g., "/webhooks/jira/issues"
  secretToken: text("secret_token"), // For webhook signature verification
  isEnabled: text("is_enabled").default("true"),
  eventTypes: text("event_types"), // JSON array of event types to handle
  triggerSyncJobId: varchar("trigger_sync_job_id").references(() => syncJobs.id), // Optional: trigger a sync job on webhook
  transformScript: text("transform_script"), // Optional JS/JSON transform for payload
  retryPolicy: text("retry_policy"), // JSON retry config
  lastReceivedAt: timestamp("last_received_at"),
  totalReceived: integer("total_received").default(0),
  totalProcessed: integer("total_processed").default(0),
  totalFailed: integer("total_failed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpoints).omit({
  id: true,
  lastReceivedAt: true,
  totalReceived: true,
  totalProcessed: true,
  totalFailed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;

// Webhook Events - Log of received webhook events
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookEndpointId: varchar("webhook_endpoint_id").references(() => webhookEndpoints.id),
  eventType: text("event_type"),
  externalEventId: text("external_event_id"), // ID from the source system
  payload: text("payload").notNull(), // JSON webhook payload
  headers: text("headers"), // JSON of relevant headers
  signature: text("signature"), // Webhook signature if provided
  signatureValid: text("signature_valid"), // true, false, not_verified
  status: text("status").default("received"), // received, processing, processed, failed, ignored
  processingError: text("processing_error"),
  syncJobRunId: varchar("sync_job_run_id").references(() => syncJobRuns.id), // If this triggered a sync
  receivedAt: timestamp("received_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  receivedAt: true,
});

export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
