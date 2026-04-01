import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

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
// AGENTS - Core agent definitions (database-driven)
// ============================================================================

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey(), // e.g., 'finops', 'tmo', 'risk'
  name: text("name").notNull(), // Display name e.g., 'FinOps Agent'
  description: text("description"),
  category: text("category").notNull(), // 'domain', 'orchestration', 'utility'
  enabled: boolean("enabled").default(true),

  // Configuration
  capabilities: text("capabilities"), // JSON array of capability strings
  defaultPriority: integer("default_priority").default(5), // 1-10 for rule evaluation order

  // Ownership
  ownerUserId: varchar("owner_user_id"), // Who owns/manages this agent
  ownerTeam: text("owner_team"), // Team responsible for the agent

  // Integration
  palantirObjectTypes: text("palantir_object_types"), // JSON array of Palantir object types this agent works with
  mcpConnections: text("mcp_connections"), // JSON array of MCP connection IDs

  // Metadata
  icon: text("icon"), // Icon name from lucide-react
  color: text("color"), // Hex color for UI

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// ============================================================================
// AGENT ATTRIBUTES - Dynamic attributes for agents (widget data sources)
// Every widget on the UI is backed by an agent attribute
// ============================================================================

export const agentAttributes = pgTable("agent_attributes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(), // FK to agents table

  // Attribute Definition
  name: text("name").notNull(), // e.g., 'total_budget_variance'
  displayName: text("display_name").notNull(), // e.g., 'Total Budget Variance'
  description: text("description"),
  category: text("category").notNull(), // e.g., 'financial', 'schedule', 'risk', 'quality'

  // Data Type & Format
  dataType: text("data_type").notNull().default("number"), // number, percentage, currency, text, boolean, date, array
  unit: text("unit"), // e.g., '$', '%', 'days', 'points'
  format: text("format"), // e.g., 'currency', 'decimal:2', 'percentage'

  // Value Source
  valueSource: text("value_source").notNull().default("calculated"), // 'static', 'calculated', 'aggregated', 'external'
  calculationRule: text("calculation_rule"), // Rulebricks rule ID or formula
  aggregationMethod: text("aggregation_method"), // 'sum', 'avg', 'min', 'max', 'count', 'latest'
  sourceQuery: text("source_query"), // SQL or ontology query for aggregated values

  // Current Value (cached)
  currentValue: text("current_value"), // JSON-encoded current value
  previousValue: text("previous_value"), // For trend calculation
  targetValue: text("target_value"), // Target/goal value
  thresholds: text("thresholds"), // JSON: { warning: 80, critical: 90 }

  // Metadata
  refreshInterval: integer("refresh_interval").default(300), // Seconds between refreshes
  lastCalculatedAt: timestamp("last_calculated_at"),
  palantirPropertyName: text("palantir_property_name"), // Mapped Palantir ontology property
  externalSystemMapping: text("external_system_mapping"), // JSON: { jira: 'customfield_10001', monday: 'column_id' }

  // UI Hints
  defaultWidgetType: text("default_widget_type").default("stat-card"), // stat-card, chart, gauge, table, progress
  chartConfig: text("chart_config"), // JSON config for chart widgets

  // Permissions
  visibility: text("visibility").default("all"), // all, admin, owner
  isEditable: boolean("is_editable").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentAttributeSchema = createInsertSchema(agentAttributes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentAttribute = z.infer<typeof insertAgentAttributeSchema>;
export type AgentAttribute = typeof agentAttributes.$inferSelect;

// ============================================================================
// WIDGET DEFINITIONS - Dashboard widget configurations
// Maps agent attributes to UI widgets for the "liquid" dashboard experience
// ============================================================================

export const widgetDefinitions = pgTable("widget_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Widget Identity
  name: text("name").notNull(), // e.g., 'Budget Health Card'
  slug: text("slug").notNull(), // URL-friendly: 'budget-health-card'
  description: text("description"),

  // Widget Type & Display
  widgetType: text("widget_type").notNull(), // stat-card, line-chart, bar-chart, pie-chart, gauge, table, kanban, timeline
  size: text("size").default("medium"), // small, medium, large, full
  defaultWidth: integer("default_width").default(1), // Grid columns (1-4)
  defaultHeight: integer("default_height").default(1), // Grid rows (1-4)

  // Data Binding
  primaryAttributeId: varchar("primary_attribute_id"), // Main attribute to display
  secondaryAttributeIds: text("secondary_attribute_ids"), // JSON array of supporting attribute IDs
  agentId: varchar("agent_id"), // Which agent owns this widget

  // Visualization Config
  config: text("config"), // JSON: { chartType, colors, labels, axes, etc. }
  drilldownConfig: text("drilldown_config"), // JSON: where to navigate on click

  // Conditional Display
  showConditions: text("show_conditions"), // JSON: rules for when to show/hide
  highlightConditions: text("highlight_conditions"), // JSON: rules for visual emphasis

  // Layout & Grouping
  category: text("category"), // e.g., 'financial', 'delivery', 'risk'
  tags: text("tags"), // JSON array for filtering
  sortOrder: integer("sort_order").default(0),

  // Permissions
  roles: text("roles"), // JSON array: which roles can see this widget
  isDefault: boolean("is_default").default(false), // Show by default on dashboards
  isCustomizable: boolean("is_customizable").default(true), // Can users modify

  // Palantir Integration
  palantirObjectType: text("palantir_object_type"), // Maps to Palantir object type
  palantirQuery: text("palantir_query"), // Ontology query for data

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWidgetDefinitionSchema = createInsertSchema(widgetDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWidgetDefinition = z.infer<typeof insertWidgetDefinitionSchema>;
export type WidgetDefinition = typeof widgetDefinitions.$inferSelect;

// ============================================================================
// USER DASHBOARD LAYOUTS - User-specific widget arrangements
// ============================================================================

export const userDashboardLayouts = pgTable("user_dashboard_layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  dashboardId: varchar("dashboard_id").notNull(), // e.g., 'executive', 'finops', 'pmo'

  // Layout Configuration
  layout: text("layout").notNull(), // JSON: grid positions for each widget
  hiddenWidgets: text("hidden_widgets"), // JSON array of widget IDs to hide
  customWidgets: text("custom_widgets"), // JSON array of user-created widget configs

  // Filters & Preferences
  defaultFilters: text("default_filters"), // JSON: saved filter state
  refreshInterval: integer("refresh_interval").default(60),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDashboardLayoutSchema = createInsertSchema(userDashboardLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserDashboardLayout = z.infer<typeof insertUserDashboardLayoutSchema>;
export type UserDashboardLayout = typeof userDashboardLayouts.$inferSelect;

// ============================================================================
// ATTRIBUTE VALUES HISTORY - Time series of attribute values for trending
// ============================================================================

export const attributeValueHistory = pgTable("attribute_value_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attributeId: varchar("attribute_id").notNull(),

  value: text("value").notNull(), // JSON-encoded value
  calculatedAt: timestamp("calculated_at").notNull(),

  // Context
  triggeredBy: text("triggered_by"), // 'scheduled', 'manual', 'rule', 'sync'
  metadata: text("metadata"), // JSON: additional context

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttributeValueHistorySchema = createInsertSchema(attributeValueHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertAttributeValueHistory = z.infer<typeof insertAttributeValueHistorySchema>;
export type AttributeValueHistory = typeof attributeValueHistory.$inferSelect;

// ============================================================================
// COMPANIES - Top-level legal entities (for multi-company support)
// ============================================================================

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ticker: text("ticker"), // Stock ticker symbol (e.g., NEE)
  legalEntity: text("legal_entity"), // Full legal name
  parentCompanyId: varchar("parent_company_id"), // For subsidiaries
  headquarters: text("headquarters"),
  industry: text("industry"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// ============================================================================
// DIVISIONS - Business Segments
// @deprecated - Now sourced from Palantir Foundry BusinessUnit objects
// Table will be dropped. Keep types for backward compatibility during migration.
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
  companyId: varchar("company_id"), // FK to companies - organizational hierarchy
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
// @deprecated - Now sourced from Palantir Foundry Metric objects
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
// @deprecated - Now sourced from Palantir Foundry Objective/KeyResult objects
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

// OKR Linkages - Cascade OKRs from division to projects/epics/features
export const okrLinkages = pgTable("okr_linkages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentOkrId: varchar("parent_okr_id"), // Can reference divisionOkrs or another okrLinkage
  childEntityType: text("child_entity_type").notNull(), // project, epic, feature, team
  childEntityId: varchar("child_entity_id").notNull(),
  alignmentScore: real("alignment_score"), // 0.0-1.0 confidence of alignment
  confidence: text("confidence").default("medium"), // low, medium, high
  inferredBy: text("inferred_by"), // Agent that created this linkage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOkrLinkageSchema = createInsertSchema(okrLinkages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOkrLinkage = z.infer<typeof insertOkrLinkageSchema>;
export type OkrLinkage = typeof okrLinkages.$inferSelect;

// Benefits Realization - Track planned vs actual benefits over time (for VRO agent)
export const benefitsRealization = pgTable("benefits_realization", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  benefitName: text("benefit_name").notNull(),
  benefitCategory: text("benefit_category"), // cost_reduction, revenue_increase, efficiency, customer_satisfaction
  plannedValue: real("planned_value"), // Expected benefit in dollars or percentage
  actualValue: real("actual_value"), // Realized benefit to date
  realizationDate: timestamp("realization_date"), // When benefit was/will be realized
  status: text("status").default("planned"), // planned, on_track, at_risk, realized, delayed
  valueUnit: text("value_unit").default("$"), // $, %, hours, etc.
  notes: text("notes"),
  measuredBy: text("measured_by"), // How the benefit is measured
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBenefitsRealizationSchema = createInsertSchema(benefitsRealization).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBenefitsRealization = z.infer<typeof insertBenefitsRealizationSchema>;
export type BenefitsRealization = typeof benefitsRealization.$inferSelect;

// Division Risks - Risk registry by division
// @deprecated - Now sourced from Palantir Foundry Risk objects
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
// COMPANY OVERVIEW - Corporate Info
// ============================================================================

export const companyOverview = pgTable("company_overview", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull().default("Enterprise"),
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
// @deprecated - Now sourced from Palantir Foundry Metric objects
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
// @deprecated - Now sourced from Palantir Foundry Risk objects
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

// @deprecated - Now sourced from Palantir Foundry Project objects
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
  okrObjective: text("okr_objective"),
  okrKeyResult: text("okr_key_result"),
  okrProgress: integer("okr_progress"),
  aiRecommendation: text("ai_recommendation"),
  timelineElapsed: integer("timeline_elapsed"),
  timelineTotal: integer("timeline_total"),
  budget: text("budget"),
  actualCost: text("actual_cost"),
  cpiValue: real("cpi_value"),
  spiValue: real("spi_value"),
  // EVM (Earned Value Management) fields for FinOps agent
  earnedValue: real("earned_value"), // EV - value of work actually completed
  plannedValue: real("planned_value"), // PV - value of work scheduled to be completed
  budgetAtCompletion: real("bac"), // BAC - total planned budget
  estimateAtCompletion: real("eac"), // EAC - forecasted total cost at completion
  estimateToComplete: real("etc"), // ETC - forecasted cost to finish remaining work
  costVariance: real("cv"), // CV = EV - AC
  scheduleVariance: real("sv"), // SV = EV - PV
  varianceAtCompletion: real("vac"), // VAC = BAC - EAC
  progress: integer("progress"),
  progressPercentage: real("progress_percentage"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project Templates - Stores reusable project templates for the ingestion wizard
export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier (e.g., "Grid-Modernization")
  bu: text("bu"), // Business unit
  division: text("division"),
  description: text("description"),
  category: text("category"), // Division A, Division B, Corporate
  templateData: text("template_data").notNull(), // Full JSON template
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;

// @deprecated - Now sourced from Palantir Foundry WorkItem (Feature) objects
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

// @deprecated - Now sourced from Palantir Foundry WorkItem (Story) objects
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

// @deprecated - Now sourced from Palantir Foundry WorkItem (Task) objects
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
  dueDate: timestamp("due_date"),
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
  probability: text("probability").default("medium"), // low/medium/high (qualitative)
  impact: text("impact").default("medium"), // low/medium/high (qualitative)
  status: text("status").default("open"),
  mitigation: text("mitigation"),
  owner: text("owner"),
  // Quantitative risk fields for Risk agent
  riskScore: real("risk_score"), // Probability × Impact (0-100)
  riskCategory: text("risk_category"), // schedule, cost, technical, resource, external, compliance
  identifiedDate: timestamp("identified_date"),
  probabilityNumeric: real("probability_numeric"), // 0.0-1.0 for Monte Carlo
  impactNumeric: real("impact_numeric"), // Dollar amount or percentage impact
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
});

export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect;

// ============================================================================
// ISSUES - Project Issue Tracking
// ============================================================================

export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // critical, high, medium, low
  status: text("status").default("open"), // open, in_progress, resolved, closed, blocked
  category: text("category").default("other"), // technical, business, resource, scope, schedule, quality, risk, other
  impact: text("impact").default("medium"), // high, medium, low
  assignedTo: varchar("assigned_to"),
  createdBy: varchar("created_by"),
  dueDate: timestamp("due_date"),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  tags: text("tags"), // JSON array of tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;

export const issueComments = pgTable("issue_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull(),
  userId: varchar("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIssueCommentSchema = createInsertSchema(issueComments).omit({
  id: true,
  createdAt: true,
});

export type InsertIssueComment = z.infer<typeof insertIssueCommentSchema>;
export type IssueComment = typeof issueComments.$inferSelect;

// ============================================================================
// CHANGE REQUESTS - Project Change Management
// ============================================================================

export const changeRequests = pgTable("change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  changeType: text("change_type").notNull(), // scope, schedule, budget, quality, resource, technical, other
  priority: text("priority").default("medium"), // critical, high, medium, low
  status: text("status").default("submitted"), // submitted, under_review, approved, rejected, implemented, cancelled
  estimatedCost: real("estimated_cost"),
  estimatedDuration: integer("estimated_duration"), // days
  businessJustification: text("business_justification"),
  impactAssessment: text("impact_assessment"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  approvalNotes: text("approval_notes"),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;
export type ChangeRequest = typeof changeRequests.$inferSelect;

// ============================================================================
// SSO CONFIGURATION - SAML, OAuth, OIDC
// ============================================================================

export const ssoConfigs = pgTable("sso_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // saml, oauth, oidc, azure_ad, okta, google
  enabled: boolean("enabled").default(false),
  config: text("config").notNull(), // JSON config (entityId, ssoUrl, certificate, clientId, clientSecret, etc.)
  domains: text("domains"), // JSON array of allowed email domains
  defaultRole: varchar("default_role").default("user"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSsoConfigSchema = createInsertSchema(ssoConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSsoConfig = z.infer<typeof insertSsoConfigSchema>;
export type SsoConfig = typeof ssoConfigs.$inferSelect;

// ============================================================================
// PASSWORD POLICIES
// ============================================================================

export const passwordPolicies = pgTable("password_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  minLength: integer("min_length").default(12),
  requireUppercase: boolean("require_uppercase").default(true),
  requireLowercase: boolean("require_lowercase").default(true),
  requireNumbers: boolean("require_numbers").default(true),
  requireSpecialChars: boolean("require_special_chars").default(true),
  maxAge: integer("max_age"), // days before password must be changed
  preventReuse: integer("prevent_reuse").default(5), // number of previous passwords to prevent
  lockoutThreshold: integer("lockout_threshold").default(5), // failed attempts before lockout
  lockoutDuration: integer("lockout_duration").default(30), // minutes
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPasswordPolicySchema = createInsertSchema(passwordPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPasswordPolicy = z.infer<typeof insertPasswordPolicySchema>;
export type PasswordPolicy = typeof passwordPolicies.$inferSelect;

// ============================================================================
// FIELD-LEVEL PERMISSIONS
// ============================================================================

export const fieldPermissions = pgTable("field_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // admin, pm, user, viewer
  entityType: text("entity_type").notNull(), // project, task, risk, etc.
  fieldName: text("field_name").notNull(),
  canView: boolean("can_view").default(true),
  canEdit: boolean("can_edit").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFieldPermissionSchema = createInsertSchema(fieldPermissions).omit({
  id: true,
  createdAt: true,
});

export type InsertFieldPermission = z.infer<typeof insertFieldPermissionSchema>;
export type FieldPermission = typeof fieldPermissions.$inferSelect;

// ============================================================================
// PICKLIST VALUES - Status, Priority, Category configurations
// ============================================================================

export const picklistValues = pgTable("picklist_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  picklistType: text("picklist_type").notNull(), // status, priority, category, etc.
  entityType: text("entity_type").notNull(), // project, task, issue, risk
  value: text("value").notNull(),
  label: text("label").notNull(),
  color: text("color"), // hex color for UI
  icon: text("icon"), // icon name
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPicklistValueSchema = createInsertSchema(picklistValues).omit({
  id: true,
  createdAt: true,
});

export type InsertPicklistValue = z.infer<typeof insertPicklistValueSchema>;
export type PicklistValue = typeof picklistValues.$inferSelect;

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  event: text("event").notNull(), // project_created, task_assigned, risk_elevated, etc.
  channel: text("channel").notNull(), // email, slack, teams, in_app
  subject: text("subject"),
  template: text("template").notNull(), // template with {{variables}}
  enabled: boolean("enabled").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;

// ============================================================================
// DATA RETENTION POLICIES
// ============================================================================

export const retentionPolicies = pgTable("retention_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entityType: text("entity_type").notNull(), // audit_logs, notifications, old_projects, etc.
  retentionDays: integer("retention_days").notNull(),
  action: text("action").default("archive"), // archive, delete
  enabled: boolean("enabled").default(true),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRetentionPolicySchema = createInsertSchema(retentionPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRetentionPolicy = z.infer<typeof insertRetentionPolicySchema>;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;

// ============================================================================
// CUSTOM FIELDS - User-defined fields for entities
// ============================================================================

export const customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // project, task, risk, etc.
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull(), // text, number, date, boolean, select, multiselect
  options: text("options"), // JSON array for select/multiselect
  required: boolean("required").default(false),
  defaultValue: text("default_value"),
  validation: text("validation"), // JSON validation rules
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomField = typeof customFields.$inferSelect;

export const customFieldValues = pgTable("custom_field_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customFieldId: varchar("custom_field_id").notNull(),
  entityId: varchar("entity_id").notNull(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomFieldValueSchema = createInsertSchema(customFieldValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomFieldValue = z.infer<typeof insertCustomFieldValueSchema>;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

export const resourcePools = pgTable("resource_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  poolType: text("pool_type").default("general"), // general, specialized, contractor
  capacity: integer("capacity"),
  manager: varchar("manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourcePoolSchema = createInsertSchema(resourcePools).omit({
  id: true,
  createdAt: true,
});

export type InsertResourcePool = z.infer<typeof insertResourcePoolSchema>;
export type ResourcePool = typeof resourcePools.$inferSelect;

export const resourceAllocations = pgTable("resource_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(),
  projectId: varchar("project_id").notNull(),
  allocationPercent: integer("allocation_percent").notNull(), // 0-100
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  role: text("role"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceAllocationSchema = createInsertSchema(resourceAllocations).omit({
  id: true,
  createdAt: true,
});

export type InsertResourceAllocation = z.infer<typeof insertResourceAllocationSchema>;
export type ResourceAllocation = typeof resourceAllocations.$inferSelect;

export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  projectId: varchar("project_id").notNull(),
  taskId: varchar("task_id"),
  date: timestamp("date").notNull(),
  hours: real("hours").notNull(),
  status: text("status").default("draft"), // draft, submitted, approved, rejected
  description: text("description"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheets.$inferSelect;

// ============================================================================
// FINANCIAL MANAGEMENT
// ============================================================================

export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  poNumber: text("po_number").notNull(),
  vendor: text("vendor").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("draft"), // draft, approved, issued, received, closed
  requestedBy: varchar("requested_by"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  issueDate: timestamp("issue_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
});

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  poId: varchar("po_id"),
  invoiceNumber: text("invoice_number").notNull(),
  vendor: text("vendor").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("received"), // received, approved, paid, disputed
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const costCategories = pgTable("cost_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCostCategorySchema = createInsertSchema(costCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertCostCategory = z.infer<typeof insertCostCategorySchema>;
export type CostCategory = typeof costCategories.$inferSelect;

export const budgetAllocations = pgTable("budget_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  phase: text("phase"), // planning, execution, closeout
  workstream: text("workstream"),
  categoryId: varchar("category_id"),
  allocatedAmount: real("allocated_amount").notNull(),
  spentAmount: real("spent_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBudgetAllocationSchema = createInsertSchema(budgetAllocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBudgetAllocation = z.infer<typeof insertBudgetAllocationSchema>;
export type BudgetAllocation = typeof budgetAllocations.$inferSelect;

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  documentType: text("document_type"), // e.g., "policy_compliance", "sop", "regulation", "general"
  version: integer("version").default(1),
  status: text("status").default("draft"), // draft, review, approved, archived
  checkedOutBy: varchar("checked_out_by"),
  checkedOutAt: timestamp("checked_out_at"),
  uploadedBy: varchar("uploaded_by"),
  tags: text("tags"), // JSON array
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  version: integer("version").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  changeNotes: text("change_notes"),
  uploadedBy: varchar("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;

export const documentApprovals = pgTable("document_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  approverId: varchar("approver_id").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  comments: text("comments"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals).omit({
  id: true,
  createdAt: true,
});

export type InsertDocumentApproval = z.infer<typeof insertDocumentApprovalSchema>;
export type DocumentApproval = typeof documentApprovals.$inferSelect;

// ============================================================================
// COLLABORATION
// ============================================================================

export const discussionForums = pgTable("discussion_forums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiscussionForumSchema = createInsertSchema(discussionForums).omit({
  id: true,
  createdAt: true,
});

export type InsertDiscussionForum = z.infer<typeof insertDiscussionForumSchema>;
export type DiscussionForum = typeof discussionForums.$inferSelect;

export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forumId: varchar("forum_id").notNull(),
  parentId: varchar("parent_id"), // for threaded replies
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  mentions: text("mentions"), // JSON array of user IDs
  attachments: text("attachments"), // JSON array
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;

export const meetingMinutes = pgTable("meeting_minutes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  meetingDate: timestamp("meeting_date").notNull(),
  attendees: text("attendees"), // JSON array of user IDs
  agenda: text("agenda"),
  notes: text("notes"),
  actionItems: text("action_items"), // JSON array
  nextMeetingDate: timestamp("next_meeting_date"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingMinutesSchema = createInsertSchema(meetingMinutes).omit({
  id: true,
  createdAt: true,
});

export type InsertMeetingMinutes = z.infer<typeof insertMeetingMinutesSchema>;
export type MeetingMinutes = typeof meetingMinutes.$inferSelect;

export const decisionLogs = pgTable("decision_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  decision: text("decision").notNull(),
  rationale: text("rationale"),
  alternatives: text("alternatives"), // JSON array
  decisionMaker: varchar("decision_maker"),
  stakeholders: text("stakeholders"), // JSON array
  impact: text("impact").default("medium"),
  status: text("status").default("active"), // active, superseded, cancelled
  decisionDate: timestamp("decision_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDecisionLogSchema = createInsertSchema(decisionLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertDecisionLog = z.infer<typeof insertDecisionLogSchema>;
export type DecisionLog = typeof decisionLogs.$inferSelect;

// ============================================================================
// WORKFLOW ENGINE
// ============================================================================

export const workflowDefinitions = pgTable("workflow_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  entityType: text("entity_type").notNull(), // project, issue, change_request, document
  triggerEvent: text("trigger_event").notNull(), // created, updated, status_changed
  conditions: text("conditions"), // JSON rules
  actions: text("actions").notNull(), // JSON array of actions
  enabled: boolean("enabled").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowDefinitionSchema = createInsertSchema(workflowDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowDefinition = z.infer<typeof insertWorkflowDefinitionSchema>;
export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;

export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  entityId: varchar("entity_id").notNull(),
  status: text("status").default("running"), // running, completed, failed, cancelled
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  result: text("result"), // JSON execution result
  error: text("error"),
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  startedAt: true,
});

export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

export const approvalQueues = pgTable("approval_queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  approvers: text("approvers").notNull(), // JSON array of user IDs
  currentApprover: varchar("current_approver"),
  status: text("status").default("pending"), // pending, approved, rejected, cancelled
  comments: text("comments"),
  decidedBy: varchar("decided_by"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApprovalQueueSchema = createInsertSchema(approvalQueues).omit({
  id: true,
  createdAt: true,
});

export type InsertApprovalQueue = z.infer<typeof insertApprovalQueueSchema>;
export type ApprovalQueue = typeof approvalQueues.$inferSelect;

// ============================================================================
// PROGRAM/PORTFOLIO MANAGEMENT
// ============================================================================

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id"),
  name: text("name").notNull(),
  description: text("description"),
  manager: varchar("manager"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: real("budget"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
});

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export const projectDependencies = pgTable("project_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  predecessorId: varchar("predecessor_id").notNull(),
  successorId: varchar("successor_id").notNull(),
  dependencyType: text("dependency_type").default("finish_to_start"), // FS, SS, FF, SF
  lagDays: integer("lag_days").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectDependencySchema = createInsertSchema(projectDependencies).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectDependency = z.infer<typeof insertProjectDependencySchema>;
export type ProjectDependency = typeof projectDependencies.$inferSelect;

export const masterSchedule = pgTable("master_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id"),
  portfolioId: varchar("portfolio_id"),
  name: text("name").notNull(),
  baseline: text("baseline"), // JSON snapshot
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMasterScheduleSchema = createInsertSchema(masterSchedule).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export type InsertMasterSchedule = z.infer<typeof insertMasterScheduleSchema>;
export type MasterSchedule = typeof masterSchedule.$inferSelect;

// ============================================================================
// RISK MANAGEMENT (EXTENDED)
// ============================================================================

export const riskCategories = pgTable("risk_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRiskCategorySchema = createInsertSchema(riskCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertRiskCategory = z.infer<typeof insertRiskCategorySchema>;
export type RiskCategory = typeof riskCategories.$inferSelect;

export const riskResponses = pgTable("risk_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  riskId: varchar("risk_id").notNull(),
  strategy: text("strategy").notNull(), // avoid, mitigate, transfer, accept
  actionPlan: text("action_plan").notNull(),
  owner: varchar("owner"),
  dueDate: timestamp("due_date"),
  status: text("status").default("planned"),
  effectivenessScore: integer("effectiveness_score"), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRiskResponseSchema = createInsertSchema(riskResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRiskResponse = z.infer<typeof insertRiskResponseSchema>;
export type RiskResponse = typeof riskResponses.$inferSelect;

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
// @deprecated - Now handled by Palantir Foundry Intervention objects with HITL workflow
// Use PalantirActionsService.createIntervention() instead
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

// Agent Collaboration Rules - Dynamic rules for inter-agent collaboration
export const agentCollaborationRules = pgTable("agent_collaboration_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  priority: integer("priority").default(5), // 1-10, higher = runs first
  sourceAgent: text("source_agent").notNull(), // Agent that triggers the rule
  conditions: text("conditions").notNull(), // JSON array of conditions
  actions: text("actions").notNull(), // JSON array of actions

  // Policy-as-Code Integration
  sourcePolicyId: varchar("source_policy_id"), // Links to policy_as_code.id if auto-generated from policy
  autoGenerated: boolean("auto_generated").default(false), // True if generated by LLM extraction
  policySection: text("policy_section"), // Which section of the policy document this came from
  mandatory: boolean("mandatory").default(false), // True if this is a compliance requirement (cannot be disabled)
  complianceType: text("compliance_type"), // e.g., "ISO27001", "SOX", "GDPR", "internal_policy"

  createdBy: text("created_by").notNull(),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentCollaborationRuleSchema = createInsertSchema(agentCollaborationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  executionCount: true,
  lastExecuted: true,
});

export type InsertAgentCollaborationRule = z.infer<typeof insertAgentCollaborationRuleSchema>;
export type AgentCollaborationRule = typeof agentCollaborationRules.$inferSelect;

// Rule Execution History - Audit trail of when collaboration rules trigger and execute
export const ruleExecutionHistory = pgTable("rule_execution_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: text("rule_id").notNull(),
  ruleName: text("rule_name").notNull(),
  fromAgent: text("from_agent").notNull(),
  toAgent: text("to_agent"),
  projectId: text("project_id"),

  // Trigger details
  triggerAttribute: text("trigger_attribute").notNull(),
  triggerValue: text("trigger_value").notNull(),
  threshold: text("threshold").notNull(),

  // Execution details
  actionsTaken: text("actions_taken").notNull(), // JSON array of actions performed
  status: text("status").notNull().default("pending"), // 'pending', 'acknowledged', 'resolved', 'failed'

  // Response tracking
  responseTimeSeconds: integer("response_time_seconds"),
  responseMessage: text("response_message"),

  // Timestamps
  triggeredAt: timestamp("triggered_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),

  // Metadata
  metadata: text("metadata"), // JSON with additional execution context
});

export const insertRuleExecutionHistorySchema = createInsertSchema(ruleExecutionHistory).omit({
  id: true,
  triggeredAt: true,
});

export type InsertRuleExecutionHistory = z.infer<typeof insertRuleExecutionHistorySchema>;
export type RuleExecutionHistory = typeof ruleExecutionHistory.$inferSelect;

// Custom Attributes - User-defined attributes for agents (exposed via MCP)
export const customAttributes = pgTable("custom_attributes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Attribute name (e.g., "teamMorale", "technicalDebt")
  label: text("label").notNull(), // Display name (e.g., "Team Morale", "Technical Debt")
  description: text("description"),
  dataType: text("data_type").notNull(), // 'number', 'string', 'boolean', 'date'
  ownerAgent: text("owner_agent").notNull(), // Agent that created this attribute
  visibleTo: text("visible_to").notNull(), // JSON array of agent types that can see this attribute
  validationRules: text("validation_rules"), // JSON with min/max, regex, etc.
  defaultValue: text("default_value"),
  unit: text("unit"), // Unit of measurement (e.g., "%", "$", "days")
  mcpToolName: text("mcp_tool_name"), // Name of MCP tool to query this attribute

  // Policy-as-Code Integration
  sourcePolicyId: varchar("source_policy_id"), // Links to policy_as_code.id if auto-generated from policy
  autoGenerated: boolean("auto_generated").default(false), // True if generated by LLM extraction
  policySection: text("policy_section"), // Which section of the policy document this came from

  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomAttributeSchema = createInsertSchema(customAttributes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomAttribute = z.infer<typeof insertCustomAttributeSchema>;
export type CustomAttribute = typeof customAttributes.$inferSelect;

// ============================================================================
// POLICY AS CODE - Convert compliance documents to executable rules
// ============================================================================

// Policy as Code - Extracted executable policies from compliance documents
export const policyAsCode = pgTable("policy_as_code", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceDocumentId: varchar("source_document_id"), // Links to documents.id or knowledge_base.id
  documentName: text("document_name").notNull(),
  documentType: text("document_type"), // e.g., "compliance", "sop", "regulation"
  policyName: text("policy_name").notNull(),
  policyDescription: text("policy_description"),
  sectionsCovered: text("sections_covered").notNull(), // JSON array of document sections
  policySummary: text("policy_summary"), // LLM-generated summary
  fullPolicyCode: text("full_policy_code").notNull(), // JSON: {customAttributes: [...], rules: [...], validations: [...]}
  customAttributesCreated: integer("custom_attributes_created").default(0),
  rulesGenerated: integer("rules_generated").default(0),

  // HITL Approval Workflow
  status: text("status").default("pending_review"), // pending_review, approved, rejected, scheduled, active, archived
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),

  // Activation Control
  effectiveDate: timestamp("effective_date"), // When this policy should become active
  activatedAt: timestamp("activated_at"), // When it was actually activated
  deactivatedAt: timestamp("deactivated_at"),

  // LLM Extraction Metadata
  llmModelUsed: text("llm_model_used"), // e.g., "gpt-4", "gemini-pro"
  extractionConfidence: real("extraction_confidence"), // 0.0 - 1.0
  extractionTokensUsed: integer("extraction_tokens_used"),
  extractionCost: real("extraction_cost"), // USD

  // Versioning
  version: integer("version").default(1),
  parentPolicyId: varchar("parent_policy_id"), // For policy revisions

  // Compliance Tracking
  mandatory: boolean("mandatory").default(true),
  complianceFramework: text("compliance_framework"), // e.g., "ISO27001", "SOX", "GDPR"
  enforcementLevel: text("enforcement_level").default("strict"), // strict, advisory, monitoring

  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPolicyAsCodeSchema = createInsertSchema(policyAsCode).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPolicyAsCode = z.infer<typeof insertPolicyAsCodeSchema>;
export type PolicyAsCode = typeof policyAsCode.$inferSelect;

// Policy Extraction Audit - Track LLM extraction process
export const policyExtractionAudit = pgTable("policy_extraction_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policyId: varchar("policy_id").notNull(),
  documentId: varchar("document_id").notNull(),

  // Extraction Details
  extractionPhase: text("extraction_phase").notNull(), // "section_analysis", "attribute_extraction", "rule_generation", "validation"
  status: text("status").notNull(), // "started", "success", "failed", "partial"

  // What was extracted
  extractedContent: text("extracted_content"), // JSON with extracted data
  confidenceScores: text("confidence_scores"), // JSON: {overall: 0.95, attributes: [...], rules: [...]}

  // LLM Request/Response
  llmPrompt: text("llm_prompt"), // The prompt sent to LLM
  llmResponse: text("llm_response"), // Raw LLM response
  llmModel: text("llm_model"),
  tokensUsed: integer("tokens_used"),

  // Errors/Warnings
  errors: text("errors"), // JSON array of error messages
  warnings: text("warnings"), // JSON array of warnings

  // Performance
  processingTimeMs: integer("processing_time_ms"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPolicyExtractionAuditSchema = createInsertSchema(policyExtractionAudit).omit({
  id: true,
  createdAt: true,
});

export type InsertPolicyExtractionAudit = z.infer<typeof insertPolicyExtractionAuditSchema>;
export type PolicyExtractionAudit = typeof policyExtractionAudit.$inferSelect;

// Mem0: Shared facts that all agents can observe
export const agentFacts = pgTable("agent_facts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entity: varchar("entity", { length: 255 }).notNull(),
  attribute: varchar("attribute", { length: 255 }).notNull(),
  value: text("value").notNull(), // JSON
  sourceAgent: varchar("source_agent", { length: 50 }).notNull(),
  confidence: text("confidence").default("1.0"), // Decimal as text
  supersedes: varchar("supersedes", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentFactSchema = createInsertSchema(agentFacts).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentFact = z.infer<typeof insertAgentFactSchema>;
export type AgentFact = typeof agentFacts.$inferSelect;

// Letta: Core memory per agent (self-editing)
export const agentCoreMemory = pgTable("agent_core_memory", {
  agentId: varchar("agent_id", { length: 50 }).primaryKey(),
  persona: text("persona"),
  policies: text("policies").default("[]"), // JSON array
  learnedFacts: text("learned_facts").default("{}"), // JSON object
  currentContext: text("current_context"),
  pendingActions: text("pending_actions").default("[]"), // JSON array
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentCoreMemorySchema = createInsertSchema(agentCoreMemory).omit({
  updatedAt: true,
});

export type InsertAgentCoreMemory = z.infer<typeof insertAgentCoreMemorySchema>;
export type AgentCoreMemory = typeof agentCoreMemory.$inferSelect;

// Letta: Archival memory (long-term searchable storage)
export const agentArchivalMemory = pgTable("agent_archival_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id", { length: 50 }).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata").default("{}"), // JSON object
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentArchivalMemorySchema = createInsertSchema(agentArchivalMemory).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentArchivalMemory = z.infer<typeof insertAgentArchivalMemorySchema>;
export type AgentArchivalMemory = typeof agentArchivalMemory.$inferSelect;

// Mem0 subscriptions (which agents are watching which patterns)
export const agentFactSubscriptions = pgTable("agent_fact_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id", { length: 50 }).notNull(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentFactSubscriptionSchema = createInsertSchema(agentFactSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentFactSubscription = z.infer<typeof insertAgentFactSubscriptionSchema>;
export type AgentFactSubscription = typeof agentFactSubscriptions.$inferSelect;

// Alerts - System alerts and notifications from agents and integrations
// @deprecated - Now handled by Palantir Foundry Alert objects with native notifications
// Use PalantirActionsService.createAlert() instead
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

// NOTE: OKR tables are defined later in the file (see OKR/KPI MANAGEMENT section around line 2809)
// The old OKR definition was removed to eliminate duplicate exports

export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type KeyResult = typeof keyResults.$inferSelect;

// NOTE: KPI tables are defined later in the file (see OKR/KPI MANAGEMENT section around line 2816)
// The old KPI definition was removed to eliminate duplicate exports

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
// @deprecated - Now sourced from Palantir Foundry Portfolio objects
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
  divisionId: varchar("division_id"), // FK to divisions - organizational hierarchy
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
// @deprecated - Now sourced from Palantir Foundry ValueStream objects
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
// @deprecated - Now sourced from Palantir Foundry ART objects
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
// @deprecated - Now sourced from Palantir Foundry ProgramIncrement objects
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
// @deprecated - Now sourced from Palantir Foundry Epic objects
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
// @deprecated - Now sourced from Palantir Foundry Capability objects
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
// @deprecated - Now sourced from Palantir Foundry Sprint objects
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
  actualVelocity: text("actual_velocity"),
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
// @deprecated - Sync now handled by Palantir Foundry connectors
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
// @deprecated - Field mappings now handled in Palantir Foundry connectors
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
// @deprecated - Ingestion now handled by Palantir Foundry pipelines
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
// @deprecated - Staging now handled by Palantir Foundry pipelines
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

// ============================================================================
// MCP INGESTION SESSIONS - AI-powered data ingestion workflow
// ============================================================================

export const ingestionSessions = pgTable("ingestion_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystemId: varchar("source_system_id").references(() => sourceSystems.id),
  mcpAdapterId: varchar("mcp_adapter_id").references(() => mcpAdapters.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft"), // draft, analyzing, pending_approval, approved, ingesting, completed, failed, cancelled
  sampleData: text("sample_data"), // JSON sample data provided
  aiSummary: text("ai_summary"), // AI-generated summary of the data
  aiPov: text("ai_pov"), // AI point of view / recommendations
  safeMapping: text("safe_mapping"), // JSON mapping to SAFe entities
  qualityScore: real("quality_score"), // 0-100 data quality score
  totalRecords: integer("total_records").default(0),
  mappedRecords: integer("mapped_records").default(0),
  errorCount: integer("error_count").default(0),
  createdBy: text("created_by"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIngestionSessionSchema = createInsertSchema(ingestionSessions).omit({
  id: true,
  approvedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIngestionSession = z.infer<typeof insertIngestionSessionSchema>;
export type IngestionSession = typeof ingestionSessions.$inferSelect;

// ============================================================================
// QA REVIEWS - Quality assurance reviews for ingestion sessions
// ============================================================================

export const qaReviews = pgTable("qa_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingestionSessionId: varchar("ingestion_session_id").references(() => ingestionSessions.id),
  reviewType: text("review_type").notNull(), // data_quality, mapping_accuracy, schema_validation, completeness
  status: text("status").default("pending"), // pending, passed, failed, needs_attention
  score: real("score"), // 0-100
  aiAnalysis: text("ai_analysis"), // AI-generated analysis
  issues: text("issues"), // JSON array of issues found
  recommendations: text("recommendations"), // JSON array of recommendations
  reviewer: text("reviewer"), // user or "ai"
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQaReviewSchema = createInsertSchema(qaReviews).omit({
  id: true,
  reviewedAt: true,
  createdAt: true,
});

export type InsertQaReview = z.infer<typeof insertQaReviewSchema>;
export type QaReview = typeof qaReviews.$inferSelect;

// ============================================================================
// CLARIFYING QUESTIONS - AI-generated questions during ingestion
// ============================================================================

export const clarifyingQuestions = pgTable("clarifying_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingestionSessionId: varchar("ingestion_session_id").references(() => ingestionSessions.id),
  question: text("question").notNull(),
  context: text("context"), // Why the AI is asking this question
  questionType: text("question_type").default("text"), // text, choice, confirmation
  options: text("options"), // JSON array of options for choice type
  answer: text("answer"),
  answeredBy: text("answered_by"),
  answeredAt: timestamp("answered_at"),
  impactArea: text("impact_area"), // mapping, quality, schema, etc.
  priority: text("priority").default("normal"), // critical, high, normal, low
  status: text("status").default("pending"), // pending, answered, skipped
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClarifyingQuestionSchema = createInsertSchema(clarifyingQuestions).omit({
  id: true,
  answeredAt: true,
  createdAt: true,
});

export type InsertClarifyingQuestion = z.infer<typeof insertClarifyingQuestionSchema>;
export type ClarifyingQuestion = typeof clarifyingQuestions.$inferSelect;

// ============================================================================
// VRO METRICS - Value Realization Office performance metrics
// ============================================================================

export const vroMetrics = pgTable("vro_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricKey: text("metric_key").notNull().unique(), // current-roi, net-present-value, etc.
  label: text("label").notNull(),
  value: text("value").notNull(),
  unit: text("unit"), // %, M, etc.
  color: text("color"), // Tailwind color class
  source: text("source"), // Where this metric comes from
  category: text("category").default("vro"), // vro, pmo, financial
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVroMetricSchema = createInsertSchema(vroMetrics).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type InsertVroMetric = z.infer<typeof insertVroMetricSchema>;
export type VroMetric = typeof vroMetrics.$inferSelect;

// ============================================================================
// BENCHMARKS - Industry benchmarks for comparison
// ============================================================================

export const benchmarks = pgTable("benchmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  benchmarkKey: text("benchmark_key").notNull().unique(),
  name: text("name").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
  category: text("category"), // financial, operational, project
  industry: text("industry").default("energy"),
  source: text("source"),
  year: integer("year"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBenchmarkSchema = createInsertSchema(benchmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBenchmark = z.infer<typeof insertBenchmarkSchema>;
export type Benchmark = typeof benchmarks.$inferSelect;

// ============================================================================
// APP CONFIG - Application configuration and settings
// ============================================================================

export const appConfig = pgTable("app_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id"), // null = global config
  configKey: text("config_key").notNull(),
  configValue: text("config_value").notNull(),
  description: text("description"),
  category: text("category").default("general"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppConfigSchema = createInsertSchema(appConfig).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AppConfig = typeof appConfig.$inferSelect;

// ============================================================================
// DASHBOARD WIDGETS - Configurable dashboard layout and widgets
// ============================================================================

export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  widgetKey: text("widget_key").notNull().unique(),
  widgetType: text("widget_type").notNull(), // metric, chart, list, kpi, okr, alert
  title: text("title").notNull(),
  description: text("description"),
  dataSource: text("data_source"), // api endpoint or data key
  category: text("category").default("general"), // vro, pmo, financial, performance
  size: text("size").default("medium"), // small, medium, large, full
  sortOrder: integer("sort_order").default(0),
  isVisible: boolean("is_visible").default(true),
  config: text("config"), // JSON configuration for the widget
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;

// ============================================================================
// NOTIFICATIONS - System notifications for alerts, sync failures, etc.
// ============================================================================

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // null = broadcast to all
  type: text("type").notNull(), // sync_failure, alert, info, warning, success
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").default("info"), // info, warning, error, critical
  source: text("source"), // sync_job, system, agent, manual
  sourceId: text("source_id"), // reference to source entity
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  actionUrl: text("action_url"), // optional link to relevant page
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================================================
// USER ROLES - Role-based access control
// ============================================================================

export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("viewer"), // admin, editor, viewer
  permissions: text("permissions"), // JSON array of specific permissions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRoleAssignment = typeof userRoles.$inferSelect;

// ============================================================================
// SCHEDULED REPORTS - Report scheduling and distribution
// ============================================================================

export const scheduledReports = pgTable("scheduled_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  reportType: text("report_type").notNull(), // portfolio_summary, project_status, financial, custom
  schedule: text("schedule").notNull(), // cron expression
  recipients: text("recipients"), // JSON array of email addresses
  format: text("format").default("pdf"), // pdf, excel, csv
  filters: text("filters"), // JSON object with report filters
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScheduledReportSchema = createInsertSchema(scheduledReports).omit({
  id: true,
  lastRunAt: true,
  nextRunAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScheduledReport = z.infer<typeof insertScheduledReportSchema>;
export type ScheduledReport = typeof scheduledReports.$inferSelect;

// ============================================================================
// EXPORT JOBS - Track data export requests
// ============================================================================

export const exportJobs = pgTable("export_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exportType: text("export_type").notNull(), // projects, metrics, reports, full_backup
  format: text("format").notNull().default("csv"), // csv, excel, json
  status: text("status").default("pending"), // pending, processing, completed, failed
  filters: text("filters"), // JSON object with export filters
  filePath: text("file_path"), // path to generated file
  fileSize: integer("file_size"), // in bytes
  rowCount: integer("row_count"),
  errorMessage: text("error_message"),
  requestedBy: varchar("requested_by"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // when the file will be deleted
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExportJobSchema = createInsertSchema(exportJobs).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export type InsertExportJob = z.infer<typeof insertExportJobSchema>;
export type ExportJob = typeof exportJobs.$inferSelect;

// ============================================================================
// TUTORIAL PROGRESS - Track user progress through guided tours
// ============================================================================

export const tutorialProgress = pgTable("tutorial_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tutorialId: text("tutorial_id").notNull(), // e.g., "dashboard_tour", "mcp_setup", "settings_intro"
  currentStep: integer("current_step").default(0),
  totalSteps: integer("total_steps").notNull(),
  isCompleted: boolean("is_completed").default(false),
  isSkipped: boolean("is_skipped").default(false),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow(),
  lastViewedAt: timestamp("last_viewed_at").defaultNow(),
});

export const insertTutorialProgressSchema = createInsertSchema(tutorialProgress).omit({
  id: true,
  startedAt: true,
  lastViewedAt: true,
});

export type InsertTutorialProgress = z.infer<typeof insertTutorialProgressSchema>;
export type TutorialProgress = typeof tutorialProgress.$inferSelect;

// ============================================================================
// AUDIT TRAIL - Track all user actions with confirmation codes for traceability
// ============================================================================

export const auditTrail = pgTable("audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationCode: varchar("confirmation_code", { length: 12 }).notNull().unique(),
  actionType: text("action_type").notNull(), // approved, dismissed, escalated, acknowledged, created
  actionStatus: text("action_status").notNull().default("completed"), // completed, failed, pending
  entityType: text("entity_type").notNull(), // intervention, recommendation, discussion, risk
  entityId: varchar("entity_id"),
  entityTitle: text("entity_title"),
  agentSource: text("agent_source"), // Which AI agent generated the item
  projectId: varchar("project_id"),
  projectName: text("project_name"),
  userId: varchar("user_id"),
  userName: text("user_name"),
  componentSource: text("component_source"), // Which UI component the action came from
  metadata: text("metadata"), // JSON for additional context
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;

// ============================================================================
// ONTOLOGY ENTITIES - Virtual representation of triple store
// ============================================================================

export const ontologyEntities = pgTable("ontology_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityUri: text("entity_uri").notNull().unique(), // RDF URI
  entityType: text("entity_type").notNull(), // Class name from ontology (pm:Project, safe:Epic, etc.)
  localEntityType: text("local_entity_type"), // projects, epics, features, stories, tasks
  localEntityId: varchar("local_entity_id"), // FK to local table
  externalSystem: text("external_system"), // jira, azure, excel, servicenow, etc.
  externalId: text("external_id"), // ID in external system
  metadata: text("metadata"), // JSON with additional RDF properties
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOntologyEntitySchema = createInsertSchema(ontologyEntities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOntologyEntity = z.infer<typeof insertOntologyEntitySchema>;
export type OntologyEntity = typeof ontologyEntities.$inferSelect;

// ============================================================================
// INTEGRATIONS - External data source configurations
// ============================================================================

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // jira, azure-devops, servicenow, sap, github, etc.
  status: text("status").default('disconnected'), // connected, disconnected, error
  connectionDetails: text("connection_details"), // JSON: URL, API endpoints, etc.
  credentials: text("credentials"), // JSON: Encrypted credentials
  syncSchedule: text("sync_schedule").default('manual'), // manual, hourly, daily, weekly
  fieldMappings: text("field_mappings"), // JSON: Field mapping configuration
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"), // success, failed, partial
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// ============================================================================
// INTEGRATION SYNC HISTORY - Track sync operations
// ============================================================================

export const integrationSyncHistory = pgTable("integration_sync_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: 'cascade' }),
  integrationName: text("integration_name").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // success, failed, partial
  recordsImported: integer("records_imported").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsDeleted: integer("records_deleted").default(0),
  errors: integer("errors").default(0),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON: Additional sync details
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIntegrationSyncHistorySchema = createInsertSchema(integrationSyncHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertIntegrationSyncHistory = z.infer<typeof insertIntegrationSyncHistorySchema>;
export type IntegrationSyncHistory = typeof integrationSyncHistory.$inferSelect;

// ============================================================================
// AGENT CONFIGURATIONS - AI Agent settings and thresholds
// ============================================================================

export const agentConfigs = pgTable("agent_configs", {
  id: varchar("id").primaryKey(), // finops, tmo, risk, vro, governance, planning, ocm, integrated, okr
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  scanInterval: integer("scan_interval").default(60).notNull(), // in minutes
  autonomyLevel: text("autonomy_level").default('supervised').notNull(), // 'full' or 'supervised'
  config: text("config"), // JSON: Agent-specific threshold settings
  status: text("status").default('idle'), // idle, running, error
  lastRun: timestamp("last_run"),
  lastRunDuration: integer("last_run_duration"), // in milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentConfigSchema = createInsertSchema(agentConfigs).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentConfig = z.infer<typeof insertAgentConfigSchema>;
export type AgentConfig = typeof agentConfigs.$inferSelect;

// ============================================================================
// OKR/KPI MANAGEMENT - Objectives and Key Results tracking
// ============================================================================

export const okrs = pgTable("okrs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  level: text("level").notNull(), // company, project, functional
  levelId: varchar("level_id"), // FK to companies, projects, or null for functional
  functionalArea: text("functional_area"), // vro, tmo, pmo, finops, governance, planning, ocm, risk
  owner: varchar("owner"), // User ID
  parentOkrId: varchar("parent_okr_id"), // For hierarchical alignment
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default('active').notNull(), // active, completed, cancelled, at_risk
  progress: integer("progress").default(0), // 0-100
  weight: integer("weight").default(100), // Relative importance (0-100)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOkrSchema = createInsertSchema(okrs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOkr = z.infer<typeof insertOkrSchema>;
export type Okr = typeof okrs.$inferSelect;

export const keyResults = pgTable("key_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  okrId: varchar("okr_id").notNull().references(() => okrs.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").default(0).notNull(),
  unit: text("unit"), // %, $, hours, count, etc.
  startValue: real("start_value").default(0),
  status: text("status").default('on_track').notNull(), // on_track, at_risk, behind, completed
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKeyResultSchema = createInsertSchema(keyResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type KeyResult = typeof keyResults.$inferSelect;

export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  level: text("level").notNull(), // company, project, functional
  levelId: varchar("level_id"), // FK to companies, projects, or null for functional
  functionalArea: text("functional_area"), // vro, tmo, pmo, finops, governance, planning, ocm, risk
  category: text("category"), // financial, schedule, quality, risk, resource, custom
  metric: text("metric").notNull(), // e.g., CPI, SPI, Budget Variance
  currentValue: real("current_value"),
  targetValue: real("target_value"),
  thresholdWarning: real("threshold_warning"),
  thresholdCritical: real("threshold_critical"),
  unit: text("unit"), // %, $, hours, count, etc.
  frequency: text("frequency").default('weekly'), // daily, weekly, monthly, quarterly
  dataSource: text("data_source"), // Manual, Jira, Azure DevOps, Excel, etc.
  calculationMethod: text("calculation_method"), // JSON formula or description
  owner: varchar("owner"), // User ID
  status: text("status").default('green').notNull(), // green, yellow, red
  trend: text("trend").default('stable'), // improving, stable, declining
  isActive: boolean("is_active").default(true),
  lastCalculated: timestamp("last_calculated"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKpiSchema = createInsertSchema(kpis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpis.$inferSelect;

export const kpiHistory = pgTable("kpi_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kpiId: varchar("kpi_id").notNull().references(() => kpis.id, { onDelete: 'cascade' }),
  value: real("value").notNull(),
  status: text("status").notNull(), // green, yellow, red
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const insertKpiHistorySchema = createInsertSchema(kpiHistory).omit({
  id: true,
  recordedAt: true,
});

export type InsertKpiHistory = z.infer<typeof insertKpiHistorySchema>;
export type KpiHistory = typeof kpiHistory.$inferSelect;

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// ============================================================================
// ONTOLOGY MAPPINGS - Track how data sources map to ontology
// ============================================================================

export const ontologyMappings = pgTable("ontology_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystem: text("source_system").notNull(), // jira, azure, postgresql, excel
  sourceEntityType: text("source_entity_type").notNull(), // issue, work_item, project, task
  sourceFieldPath: text("source_field_path").notNull(), // e.g., "fields.System.Title", "summary"
  ontologyClass: text("ontology_class").notNull(), // pm:Project, safe:Epic, pm:Task
  ontologyProperty: text("ontology_property").notNull(), // pm:hasBudget, pm:taskName
  transformFunction: text("transform_function"), // JavaScript function for complex mappings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOntologyMappingSchema = createInsertSchema(ontologyMappings).omit({
  id: true,
  createdAt: true,
});

export type InsertOntologyMapping = z.infer<typeof insertOntologyMappingSchema>;
export type OntologyMapping = typeof ontologyMappings.$inferSelect;

// ============================================================================
// OBDA QUERY CACHE - Cache for virtual data federation queries
// ============================================================================

export const obdaQueryCache = pgTable("obda_query_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queryHash: text("query_hash").notNull().unique(),
  sparqlQuery: text("sparql_query").notNull(), // Original SPARQL query
  rewrittenQuery: text("rewritten_query"), // Rewritten SQL/JQL/WIQL query
  resultSet: text("result_set"), // JSON cached results
  sourceSystems: text("source_systems"), // JSON array of sources queried
  executionTimeMs: integer("execution_time_ms"), // Query execution time
  expiresAt: timestamp("expires_at"), // Cache expiration (5 minutes TTL)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOBDAQueryCacheSchema = createInsertSchema(obdaQueryCache).omit({
  id: true,
  createdAt: true,
});

export type InsertOBDAQueryCache = z.infer<typeof insertOBDAQueryCacheSchema>;
export type OBDAQueryCache = typeof obdaQueryCache.$inferSelect;

// ============================================================================
// GRAPH SYNC LOG - Track synchronization between PostgreSQL and Neo4j
// ============================================================================

export const graphSyncLog = pgTable("graph_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // project, epic, feature, story, task, resource, risk
  entityId: varchar("entity_id").notNull(),
  syncStatus: text("sync_status").notNull(), // pending, synced, failed
  errorMessage: text("error_message"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export const insertGraphSyncLogSchema = createInsertSchema(graphSyncLog).omit({
  id: true,
  syncedAt: true,
});

export type InsertGraphSyncLog = z.infer<typeof insertGraphSyncLogSchema>;
export type GraphSyncLog = typeof graphSyncLog.$inferSelect;

// ============================================================================
// FLOW RULE MAPPINGS - Langflow to PostgreSQL rule sync
// ============================================================================

export const flowRuleMappings = pgTable("flow_rule_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull(),
  flowId: varchar("flow_id").notNull(),
  flowName: varchar("flow_name").notNull(),
  sourceAgent: varchar("source_agent").notNull(),
  syncDirection: varchar("sync_direction").notNull().default("manual"), // 'rule_to_flow' | 'flow_to_rule' | 'manual'
  lastSynced: timestamp("last_synced").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlowRuleMappingSchema = createInsertSchema(flowRuleMappings).omit({
  id: true,
  lastSynced: true,
  createdAt: true,
});

export type InsertFlowRuleMapping = z.infer<typeof insertFlowRuleMappingSchema>;
export type FlowRuleMapping = typeof flowRuleMappings.$inferSelect;

// ============================================================================
// AGENT-MCP CONNECTIONS - Connect MCPs to specific agents for knowledge + governance
// ============================================================================

/**
 * MCP DEFINITIONS
 * Stores available MCPs with their type and configuration
 *
 * Two MCP Types:
 * 1. Knowledge MCPs: Data sources (Jira, SAP, Azure DevOps, etc.)
 * 2. Governance MCPs: Responsible AI, QA, Policy enforcement
 */
export const mcpDefinitions = pgTable("mcp_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "jira-mcp", "sap-mcp", "responsible-ai-mcp"
  displayName: text("display_name").notNull(), // "Jira Integration"
  type: text("type").notNull(), // 'knowledge' or 'governance'
  category: text("category"), // For knowledge: 'ppm', 'erp', 'crm'; For governance: 'responsible_ai', 'qa', 'policy'
  description: text("description"),
  serverUrl: text("server_url"), // MCP server endpoint
  config: text("config"), // JSON: MCP-specific configuration
  capabilities: text("capabilities"), // JSON: Array of capabilities this MCP provides
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMcpDefinitionSchema = createInsertSchema(mcpDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMcpDefinition = z.infer<typeof insertMcpDefinitionSchema>;
export type McpDefinition = typeof mcpDefinitions.$inferSelect;

/**
 * AGENT-MCP CONNECTIONS
 * Connects agents to their MCPs (many-to-many)
 *
 * Example:
 * - PMO agent → Jira MCP, Azure DevOps MCP, Responsible AI MCP
 * - FinOps agent → SAP MCP, Coupa MCP, QA MCP
 * - Risk agent → Governance MCP (enforces policies)
 */
export const agentMcpConnections = pgTable("agent_mcp_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(), // FK to agentConfigs.id (finops, pmo, risk, etc.)
  mcpId: varchar("mcp_id").notNull(), // FK to mcpDefinitions.id
  enabled: boolean("enabled").default(true).notNull(), // Toggle on/off in dashboard
  priority: integer("priority").default(1).notNull(), // Execution order (lower = higher priority)
  config: text("config"), // JSON: Agent-specific MCP configuration
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentMcpConnectionSchema = createInsertSchema(agentMcpConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentMcpConnection = z.infer<typeof insertAgentMcpConnectionSchema>;
export type AgentMcpConnection = typeof agentMcpConnections.$inferSelect;

/**
 * MCP EXECUTION LOG
 * Logs MCP calls for audit and debugging
 */
export const mcpExecutionLog = pgTable("mcp_execution_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  mcpId: varchar("mcp_id").notNull(),
  mcpType: text("mcp_type").notNull(), // 'knowledge' or 'governance'
  operation: text("operation").notNull(), // 'query', 'validate', 'enforce'
  input: text("input"), // JSON: Input to MCP
  output: text("output"), // JSON: Output from MCP
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  executionTime: integer("execution_time"), // in milliseconds
  governanceDecision: text("governance_decision"), // For governance MCPs: 'allow', 'block', 'warn'
  governanceReason: text("governance_reason"), // Why governance MCP made this decision
  executedAt: timestamp("executed_at").defaultNow(),
});

export const insertMcpExecutionLogSchema = createInsertSchema(mcpExecutionLog).omit({
  id: true,
  executedAt: true,
});

export type InsertMcpExecutionLog = z.infer<typeof insertMcpExecutionLogSchema>;
export type McpExecutionLog = typeof mcpExecutionLog.$inferSelect;

// ============================================================================
// USER DASHBOARD CONFIGS - Per-user layout persistence for customizable dashboards
// ============================================================================

export const userDashboardConfigs = pgTable("user_dashboard_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id"),
  dashboardType: text("dashboard_type").notNull(), // 'finops', 'governance', 'ppm', etc.
  layouts: text("layouts").notNull(), // JSON: { lg: [], md: [], sm: [] }
  visibleWidgets: text("visible_widgets").notNull(), // JSON array of widget IDs
  widgetSizes: text("widget_sizes"), // JSON: { widgetId: 'small' | 'medium' | 'large' }
  widgetConfigs: text("widget_configs"), // JSON: per-widget settings
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDashboardConfigSchema = createInsertSchema(userDashboardConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserDashboardConfig = z.infer<typeof insertUserDashboardConfigSchema>;
export type UserDashboardConfig = typeof userDashboardConfigs.$inferSelect;

// ============================================================================
// USER WIDGETS - User-created custom widgets
// ============================================================================

export const userWidgets = pgTable("user_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  description: text("description"),
  templateId: varchar("template_id"), // Optional: based on existing widget template
  dataSourceConfig: text("data_source_config").notNull(), // JSON: { type, objectType, endpoint, filters }
  visualizationConfig: text("visualization_config").notNull(), // JSON: { type, chartType, fields, thresholds }
  size: text("size").default("medium"), // small, medium, large
  refreshInterval: integer("refresh_interval").default(60000), // milliseconds
  isShared: boolean("is_shared").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserWidgetSchema = createInsertSchema(userWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserWidget = z.infer<typeof insertUserWidgetSchema>;
export type UserWidget = typeof userWidgets.$inferSelect;

export const dynamicAgents = pgTable("dynamic_agents", {
  id: serial("id").primaryKey(),
  agentKey: varchar("agent_key", { length: 100 }).notNull().unique(),
  agentId: varchar("agent_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  instructions: text("instructions").notNull(),
  model: varchar("model", { length: 200 }).default("anthropic:claude-sonnet-4-20250514"),
  enabled: boolean("enabled").default(true),
  skills: text("skills").notNull().default("[]"),
  toolMappings: text("tool_mappings").notNull().default("[]"),
  tags: text("tags").notNull().default("[]"),
  palantirObjectTypes: text("palantir_object_types").default("[]"),
  rulebricksRules: text("rulebricks_rules").default("[]"),
  a2aMessageTypes: text("a2a_message_types").default("[]"),
  memoryNamespace: varchar("memory_namespace", { length: 100 }),
  factSubscriptions: text("fact_subscriptions").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDynamicAgentSchema = createInsertSchema(dynamicAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDynamicAgent = z.infer<typeof insertDynamicAgentSchema>;
export type DynamicAgent = typeof dynamicAgents.$inferSelect;
