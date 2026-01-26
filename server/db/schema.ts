import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const ontologyTypeEnum = pgEnum('ontology_type', ['safe', 'pmo', 'prince2', 'waterfall', 'kanban', 'custom']);
export const companyStatusEnum = pgEnum('company_status', ['draft', 'active', 'archived']);
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'approved', 'rejected', 'modified']);
export const enforcementLevelEnum = pgEnum('enforcement_level', ['blocking', 'warning', 'advisory']);
export const validationStatusEnum = pgEnum('validation_status', ['valid', 'invalid', 'needs_review']);
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed']);
export const itemTypeEnum = pgEnum('item_type', ['organizational_unit', 'metric', 'rule', 'objective', 'risk', 'kpi', 'strategic_theme']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'cancelled']);

// Multi-tenant enums
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended', 'cancelled']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['demo', 'professional', 'enterprise']);
export const userRoleEnum = pgEnum('user_role', ['system_admin', 'tenant_admin', 'pmo', 'finops', 'risk', 'ocm', 'tmo', 'vro', 'governance', 'viewer']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired', 'cancelled']);
export const demoRequestStatusEnum = pgEnum('demo_request_status', ['requested', 'demo_active', 'contacted', 'converted']);

// ============================================================================
// MULTI-TENANT AUTHENTICATION & AUTHORIZATION
// ============================================================================

// Tenants (Organizations)
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  status: tenantStatusEnum('status').default('trial').notNull(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('demo').notNull(),
  provisionedBy: uuid('provisioned_by'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  role: userRoleEnum('role').default('viewer').notNull(),
  isSystemAdmin: boolean('is_system_admin').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Tenant Invitations
export const tenantInvitations = pgTable('tenant_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('viewer').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: invitationStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Demo Requests (Lead Capture)
export const demoRequests = pgTable('demo_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  demoSessionId: varchar('demo_session_id', { length: 255 }),
  demoIndustry: varchar('demo_industry', { length: 50 }),
  status: demoRequestStatusEnum('status').default('requested').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User Sessions (JWT refresh tokens)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: varchar('refresh_token', { length: 512 }).notNull().unique(),
  accessTokenJti: varchar('access_token_jti', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull()
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================================================
// ONTOLOGY LAYER - Universal Schema
// ============================================================================

export const ontologyClasses = pgTable('ontology_classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  className: varchar('class_name', { length: 100 }).notNull().unique(),
  parentClassId: uuid('parent_class_id').references(() => ontologyClasses.id),
  namespace: varchar('namespace', { length: 100 }), // 'Metrics', 'Organization', 'Governance'
  description: text('description'),

  // Class definition
  properties: jsonb('properties').notNull(), // Schema for instances
  validationRules: jsonb('validation_rules'),
  defaultVisualization: jsonb('default_visualization'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const ontologyRelationships = pgTable('ontology_relationships', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromClassId: uuid('from_class_id').references(() => ontologyClasses.id).notNull(),
  toClassId: uuid('to_class_id').references(() => ontologyClasses.id).notNull(),
  relationshipType: varchar('relationship_type', { length: 100 }).notNull(), // 'measures', 'belongs_to', 'governs'
  cardinality: varchar('cardinality', { length: 20 }), // 'one-to-one', 'one-to-many', 'many-to-many'
  isRequired: boolean('is_required').default(false),
  properties: jsonb('properties'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const ontologyIndustryProfiles = pgTable('ontology_industry_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  industryName: varchar('industry_name', { length: 100 }).notNull().unique(),
  industryCode: varchar('industry_code', { length: 20 }), // GICS, NAICS
  primaryClasses: jsonb('primary_classes').notNull(), // Array of ontology_classes.id
  classExtensions: jsonb('class_extensions'), // Industry-specific property extensions
  standardMetrics: jsonb('standard_metrics'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================================================
// COMPANY LAYER - Instances of Ontology
// ============================================================================

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Basic Information
  legalName: varchar('legal_name', { length: 500 }).notNull(),
  tradeNames: jsonb('trade_names'), // Array of DBAs
  headquarters: jsonb('headquarters').notNull(),
  incorporationDetails: jsonb('incorporation_details'),

  // Industry Classification
  industryProfileId: uuid('industry_profile_id').references(() => ontologyIndustryProfiles.id),
  primaryNaicsCode: varchar('primary_naics_code', { length: 10 }),
  primaryNaicsDescription: text('primary_naics_description'),
  secondaryNaicsCodes: jsonb('secondary_naics_codes'),
  gicsSector: varchar('gics_sector', { length: 100 }),
  gicsIndustryGroup: varchar('gics_industry_group', { length: 100 }),
  gicsIndustry: varchar('gics_industry', { length: 100 }),
  gicsSubIndustry: varchar('gics_sub_industry', { length: 100 }),

  // Business Summary
  businessSummary: text('business_summary'),
  missionStatement: text('mission_statement'),
  primaryProductsServices: jsonb('primary_products_services'), // Array

  // Latest Filing Information
  latestAnnualReportUrl: text('latest_annual_report_url'),
  latestAnnualReportDate: date('latest_annual_report_date'),
  latestAnnualReportType: varchar('latest_annual_report_type', { length: 20 }),
  fiscalYearEnd: varchar('fiscal_year_end', { length: 10 }),
  reportingCurrency: varchar('reporting_currency', { length: 3 }),

  // Extraction Metadata
  profileGeneratedAt: timestamp('profile_generated_at'),
  profileApprovedAt: timestamp('profile_approved_at'),
  profileApprovedBy: uuid('profile_approved_by'),
  aiExtractionConfidence: decimal('ai_extraction_confidence', { precision: 3, scale: 2 }),
  extractionMetadata: jsonb('extraction_metadata'),

  // Organizational Terminology
  orgStructureTerminology: jsonb('org_structure_terminology'),

  // Multi-tenant
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),

  // System
  status: companyStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const organizationalUnits = pgTable('organizational_units', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id').references(() => organizationalUnits.id),

  // Core Information
  unitName: varchar('unit_name', { length: 255 }).notNull(),
  unitType: varchar('unit_type', { length: 50 }), // 'segment', 'division', 'business_unit', 'geography'
  unitCode: varchar('unit_code', { length: 50 }),

  // Business Context
  description: text('description'),
  primaryActivities: jsonb('primary_activities'), // Array
  geographicScope: jsonb('geographic_scope'),

  // Financial Context
  revenueContributionPct: decimal('revenue_contribution_pct', { precision: 5, scale: 2 }),
  operatingIncomeContributionPct: decimal('operating_income_contribution_pct', { precision: 5, scale: 2 }),

  // Extraction Source
  extractedFromSource: boolean('extracted_from_source').default(false),
  sourceDocumentReference: text('source_document_reference'),
  extractionConfidence: decimal('extraction_confidence', { precision: 3, scale: 2 }),

  // System
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================================================
// COMPANY ONTOLOGY INSTANCES - Maps company data to ontology
// ============================================================================

export const companyOntologyInstances = pgTable('company_ontology_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  ontologyClassId: uuid('ontology_class_id').references(() => ontologyClasses.id).notNull(),

  // Instance identification
  instanceName: varchar('instance_name', { length: 255 }).notNull(),
  instanceCode: varchar('instance_code', { length: 100 }),

  // Instance data (conforms to ontology_class properties schema)
  instanceData: jsonb('instance_data').notNull(),

  // Source of this instance
  extractedFromReport: boolean('extracted_from_report').default(false),
  sourceDocument: text('source_document'),
  sourceReference: text('source_reference'),
  extractionConfidence: decimal('extraction_confidence', { precision: 3, scale: 2 }),

  // Validation status
  validationStatus: validationStatusEnum('validation_status').default('valid'),
  validationErrors: jsonb('validation_errors'),

  // System
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const companyInstanceRelationships = pgTable('company_instance_relationships', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  ontologyRelationshipId: uuid('ontology_relationship_id').references(() => ontologyRelationships.id).notNull(),

  fromInstanceId: uuid('from_instance_id').references(() => companyOntologyInstances.id).notNull(),
  toInstanceId: uuid('to_instance_id').references(() => companyOntologyInstances.id).notNull(),

  relationshipData: jsonb('relationship_data'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================================================
// POLICY-AS-CODE: RULES ENGINE
// ============================================================================

export const companyRules = pgTable('company_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Rule Classification
  ruleCategory: varchar('rule_category', { length: 50 }).notNull(),
  ruleSubcategory: varchar('rule_subcategory', { length: 100 }),
  ruleName: varchar('rule_name', { length: 255 }).notNull(),
  ruleCode: varchar('rule_code', { length: 100 }).notNull().unique(),

  // Rule Definition
  ruleDescription: text('rule_description'),
  ruleLogic: jsonb('rule_logic').notNull(),

  // Source & Confidence
  extractedFromReport: boolean('extracted_from_report').default(false),
  sourceDocument: text('source_document'),
  sourceSection: text('source_section'),
  extractionConfidence: decimal('extraction_confidence', { precision: 3, scale: 2 }),

  // Rule Enforcement
  enforcementLevel: enforcementLevelEnum('enforcement_level').default('warning'),
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),

  // System
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const ruleExceptions = pgTable('rule_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleId: uuid('rule_id').references(() => companyRules.id, { onDelete: 'cascade' }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  exceptionReason: text('exception_reason'),
  approvedBy: uuid('approved_by'),
  validFrom: date('valid_from'),
  validUntil: date('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const ruleExecutions = pgTable('rule_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleId: uuid('rule_id').references(() => companyRules.id, { onDelete: 'cascade' }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Execution Context
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  executedBy: uuid('executed_by'),

  // Execution Result
  conditionsMet: boolean('conditions_met').notNull(),
  actionTaken: varchar('action_taken', { length: 50 }).notNull(), // block|require_approval|warn|allow
  executionResult: text('execution_result'),
  executionMetadata: jsonb('execution_metadata'),

  // Timestamps
  executedAt: timestamp('executed_at').defaultNow().notNull()
});

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Request Details
  requestType: varchar('request_type', { length: 50 }).notNull(), // rule_enforcement|budget_change|scope_change
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  entityData: jsonb('entity_data').notNull(),

  // Requester
  requestedBy: uuid('requested_by'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),

  // Approvers
  requiredApprovers: jsonb('required_approvers'), // Array of user IDs or roles
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  approverComments: text('approver_comments'),

  // Status
  status: approvalStatusEnum('status').default('pending').notNull(),

  // Details
  reason: text('reason'),
  metadata: jsonb('metadata')
});

// ============================================================================
// METRICS & KPI FRAMEWORK
// ============================================================================

export const metricDefinitions = pgTable('metric_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  organizationalUnitId: uuid('organizational_unit_id').references(() => organizationalUnits.id),

  // Metric Identity
  metricName: varchar('metric_name', { length: 255 }).notNull(),
  metricCode: varchar('metric_code', { length: 100 }),
  metricCategory: varchar('metric_category', { length: 50 }),
  metricSubcategory: varchar('metric_subcategory', { length: 100 }),

  // Ontology Mapping
  ontologyClass: varchar('ontology_class', { length: 100 }),
  ontologyAttributes: jsonb('ontology_attributes'),

  // Metric Definition
  description: text('description'),
  calculationFormula: text('calculation_formula'),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  dataType: varchar('data_type', { length: 20 }),

  // Reporting
  reportingFrequency: varchar('reporting_frequency', { length: 20 }),
  reportingLagDays: integer('reporting_lag_days'),

  // Targets & Benchmarks
  targetValue: decimal('target_value', { precision: 18, scale: 4 }),
  targetRangeMin: decimal('target_range_min', { precision: 18, scale: 4 }),
  targetRangeMax: decimal('target_range_max', { precision: 18, scale: 4 }),
  benchmarkSource: text('benchmark_source'),

  // Extraction Source
  extractedFromReport: boolean('extracted_from_report').default(false),
  sourceDocument: text('source_document'),
  sourcePage: integer('source_page'),
  extractionConfidence: decimal('extraction_confidence', { precision: 3, scale: 2 }),

  // System
  isActive: boolean('is_active').default(true),
  requiresApproval: boolean('requires_approval').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const metricValues = pgTable('metric_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  metricDefinitionId: uuid('metric_definition_id').references(() => metricDefinitions.id, { onDelete: 'cascade' }).notNull(),
  organizationalUnitId: uuid('organizational_unit_id').references(() => organizationalUnits.id),

  // Time Period
  reportingPeriod: date('reporting_period').notNull(),
  fiscalYear: integer('fiscal_year'),
  fiscalQuarter: integer('fiscal_quarter'),

  // Values
  actualValue: decimal('actual_value', { precision: 18, scale: 4 }),
  targetValue: decimal('target_value', { precision: 18, scale: 4 }),
  variance: decimal('variance', { precision: 18, scale: 4 }),
  variancePct: decimal('variance_pct', { precision: 5, scale: 2 }),

  // Status
  status: varchar('status', { length: 20 }),

  // Source
  dataSource: varchar('data_source', { length: 100 }),
  notes: text('notes'),

  // System
  enteredBy: uuid('entered_by'),
  enteredAt: timestamp('entered_at').defaultNow().notNull()
});

export const strategicObjectives = pgTable('strategic_objectives', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  organizationalUnitId: uuid('organizational_unit_id').references(() => organizationalUnits.id),

  // Objective Details
  objectiveName: varchar('objective_name', { length: 500 }).notNull(),
  objectiveDescription: text('objective_description'),
  objectiveCategory: varchar('objective_category', { length: 50 }),

  // Timeline
  startDate: date('start_date'),
  targetDate: date('target_date'),

  // Source
  extractedFromReport: boolean('extracted_from_report').default(false),
  sourceDocument: text('source_document'),
  extractionConfidence: decimal('extraction_confidence', { precision: 3, scale: 2 }),

  // Status
  status: varchar('status', { length: 20 }).default('active'),
  progressPct: decimal('progress_pct', { precision: 5, scale: 2 }),

  // System
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const keyResults = pgTable('key_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  strategicObjectiveId: uuid('strategic_objective_id').references(() => strategicObjectives.id, { onDelete: 'cascade' }).notNull(),

  // Key Result Details
  keyResultName: varchar('key_result_name', { length: 500 }).notNull(),
  keyResultDescription: text('key_result_description'),

  // Measurement
  metricDefinitionId: uuid('metric_definition_id').references(() => metricDefinitions.id),
  targetValue: decimal('target_value', { precision: 18, scale: 4 }),
  currentValue: decimal('current_value', { precision: 18, scale: 4 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),

  // Timeline
  dueDate: date('due_date'),

  // Status
  status: varchar('status', { length: 20 }).default('active'),
  progressPct: decimal('progress_pct', { precision: 5, scale: 2 }),

  // System
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================================================
// DASHBOARD TEMPLATES
// ============================================================================

export const dashboardTemplates = pgTable('dashboard_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Template Identity
  templateName: varchar('template_name', { length: 255 }).notNull(),
  templateCode: varchar('template_code', { length: 100 }),
  templateType: varchar('template_type', { length: 50 }),
  description: text('description'),

  // Target Audience
  targetRoles: jsonb('target_roles'), // Array of role types
  organizationalUnitFilter: boolean('organizational_unit_filter').default(false),

  // Template Definition
  layoutConfig: jsonb('layout_config').notNull(),

  // Auto-generated Flag
  autoGenerated: boolean('auto_generated').default(false),
  generationMetadata: jsonb('generation_metadata'),

  // System
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================================================
// EXTRACTION & AI PROCESSING TRACKING
// ============================================================================

export const documentProcessingJobs = pgTable('document_processing_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Document Information
  documentType: varchar('document_type', { length: 50 }),
  documentUrl: text('document_url').notNull(),
  documentDate: date('document_date'),
  documentFilingType: varchar('document_filing_type', { length: 20 }),

  // Processing Status
  status: processingStatusEnum('status').default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Extraction Results
  extractionResults: jsonb('extraction_results'),

  // AI Processing Details
  aiModelUsed: varchar('ai_model_used', { length: 100 }),
  tokensConsumed: integer('tokens_consumed'),
  processingTimeSeconds: integer('processing_time_seconds'),
  confidenceScores: jsonb('confidence_scores'),

  // Error Handling
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),

  // System
  initiatedBy: uuid('initiated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const extractionReviewQueue = pgTable('extraction_review_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentProcessingJobId: uuid('document_processing_job_id').references(() => documentProcessingJobs.id, { onDelete: 'cascade' }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),

  // Extraction Item
  itemType: itemTypeEnum('item_type').notNull(),
  itemData: jsonb('item_data').notNull(),

  // Review Status
  reviewStatus: reviewStatusEnum('review_status').default('pending'),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  requiresHumanReview: boolean('requires_human_review').default(true),

  // Source Reference
  sourceDocumentSection: text('source_document_section'),
  sourcePageNumber: integer('source_page_number'),
  sourceTextExcerpt: text('source_text_excerpt'),

  // Review Actions
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  modifiedData: jsonb('modified_data'),

  // System
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================================================
// COMPANY DISCOVERY (Temporary during setup)
// ============================================================================

export const companyDiscoveryCandidates = pgTable('company_discovery_candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  searchQuery: varchar('search_query', { length: 255 }),

  companyLegalName: varchar('company_legal_name', { length: 500 }),
  doingBusinessAs: varchar('doing_business_as', { length: 500 }),
  headquartersLocation: jsonb('headquarters_location'),
  industryCodes: jsonb('industry_codes'),
  entityIdentifiers: jsonb('entity_identifiers'),

  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  dataSources: jsonb('data_sources'),

  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================================================
// RELATIONS
// ============================================================================

export const ontologyClassesRelations = relations(ontologyClasses, ({ one, many }) => ({
  parent: one(ontologyClasses, {
    fields: [ontologyClasses.parentClassId],
    references: [ontologyClasses.id]
  }),
  children: many(ontologyClasses),
  relationshipsFrom: many(ontologyRelationships, { relationName: 'fromClass' }),
  relationshipsTo: many(ontologyRelationships, { relationName: 'toClass' }),
  instances: many(companyOntologyInstances)
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  industryProfile: one(ontologyIndustryProfiles, {
    fields: [companies.industryProfileId],
    references: [ontologyIndustryProfiles.id]
  }),
  organizationalUnits: many(organizationalUnits),
  ontologyInstances: many(companyOntologyInstances),
  rules: many(companyRules),
  metrics: many(metricDefinitions),
  objectives: many(strategicObjectives),
  dashboards: many(dashboardTemplates),
  processingJobs: many(documentProcessingJobs)
}));

export const organizationalUnitsRelations = relations(organizationalUnits, ({ one, many }) => ({
  company: one(companies, {
    fields: [organizationalUnits.companyId],
    references: [companies.id]
  }),
  parent: one(organizationalUnits, {
    fields: [organizationalUnits.parentId],
    references: [organizationalUnits.id]
  }),
  children: many(organizationalUnits),
  metrics: many(metricDefinitions),
  metricValues: many(metricValues),
  objectives: many(strategicObjectives)
}));

export const companyOntologyInstancesRelations = relations(companyOntologyInstances, ({ one, many }) => ({
  company: one(companies, {
    fields: [companyOntologyInstances.companyId],
    references: [companies.id]
  }),
  ontologyClass: one(ontologyClasses, {
    fields: [companyOntologyInstances.ontologyClassId],
    references: [ontologyClasses.id]
  }),
  relationshipsFrom: many(companyInstanceRelationships, { relationName: 'fromInstance' }),
  relationshipsTo: many(companyInstanceRelationships, { relationName: 'toInstance' })
}));
