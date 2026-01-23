CREATE TABLE "agent_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"primary_agent_id" text NOT NULL,
	"primary_agent_name" text NOT NULL,
	"secondary_agent_id" text,
	"secondary_agent_name" text,
	"intervention_id" text,
	"summary" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_discussions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"project_id" text,
	"project_name" text,
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'active',
	"consensus_reached" text DEFAULT 'false',
	"resolution" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_memory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"memory_type" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"target_name" text,
	"content" text NOT NULL,
	"confidence" text DEFAULT '0.75',
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_patterns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_identifier" text NOT NULL,
	"description" text NOT NULL,
	"occurrences" text DEFAULT '1',
	"confidence" text DEFAULT '0.5',
	"last_observed" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_task_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assigned_agent" text NOT NULL,
	"task_type" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'pending',
	"target_type" text,
	"target_id" text,
	"target_name" text,
	"description" text NOT NULL,
	"reasoning" text,
	"delegated_by" text,
	"conflicts_with" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'medium',
	"category" text DEFAULT 'system',
	"status" text DEFAULT 'active',
	"source" text,
	"source_entity_type" text,
	"source_entity_id" text,
	"metadata" text,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"resolved_by" text,
	"resolved_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" text NOT NULL,
	"config_value" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "app_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "arts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value_stream_id" varchar,
	"portfolio_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"release_train_engineer" text,
	"product_manager" text,
	"system_architect" text,
	"status" text DEFAULT 'active',
	"pi_cadence" text DEFAULT '10 weeks',
	"team_count" text,
	"velocity" text,
	"predictability" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"confirmation_code" varchar(12) NOT NULL,
	"action_type" text NOT NULL,
	"action_status" text DEFAULT 'completed' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar,
	"entity_title" text,
	"agent_source" text,
	"project_id" varchar,
	"project_name" text,
	"user_id" varchar,
	"user_name" text,
	"component_source" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "audit_trail_confirmation_code_unique" UNIQUE("confirmation_code")
);
--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_key" text NOT NULL,
	"name" text NOT NULL,
	"value" real NOT NULL,
	"unit" text,
	"category" text,
	"industry" text DEFAULT 'energy',
	"source" text,
	"year" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "benchmarks_benchmark_key_unique" UNIQUE("benchmark_key")
);
--> statement-breakpoint
CREATE TABLE "business_units" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department" text,
	"owner" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capabilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"epic_id" varchar,
	"value_stream_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'business',
	"status" text DEFAULT 'funnel',
	"owner" text,
	"story_points" text,
	"completed_points" text,
	"wsjf_score" text,
	"target_pi" text,
	"acceptance_criteria" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clarifying_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingestion_session_id" varchar,
	"question" text NOT NULL,
	"context" text,
	"question_type" text DEFAULT 'text',
	"options" text,
	"answer" text,
	"answered_by" text,
	"answered_at" timestamp,
	"impact_area" text,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "climate_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"metric_name" text NOT NULL,
	"value" real,
	"unit" text,
	"description" text,
	"target_value" real,
	"target_year" integer,
	"base_year" integer,
	"progress" real,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_overview" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text DEFAULT 'NextEra Energy' NOT NULL,
	"years_of_history" integer,
	"employees" integer,
	"adjusted_operating_profit_value" real,
	"adjusted_operating_profit_unit" text DEFAULT '$m',
	"adjusted_operating_profit_year" integer,
	"assets_under_management_value" real,
	"assets_under_management_unit" text DEFAULT '$bn',
	"proprietary_assets_value" real,
	"proprietary_assets_unit" text DEFAULT 'GW',
	"fortune_200" boolean DEFAULT false,
	"ceo" text,
	"cfo" text,
	"cro" text,
	"climate_director" text,
	"source" text,
	"sustainalytics_percentile" integer,
	"sustainalytics_rating" text,
	"msci_rating" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"widget_key" text NOT NULL,
	"widget_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"data_source" text,
	"category" text DEFAULT 'general',
	"size" text DEFAULT 'medium',
	"sort_order" integer DEFAULT 0,
	"is_visible" boolean DEFAULT true,
	"config" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_widgets_widget_key_unique" UNIQUE("widget_key")
);
--> statement-breakpoint
CREATE TABLE "dependencies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"dependency_type" text DEFAULT 'related',
	"status" text DEFAULT 'green',
	"description" text,
	"target_project_id" varchar,
	"impact_if_delayed" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussion_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discussion_id" varchar NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"message_type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "division_kpis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division_id" varchar NOT NULL,
	"name" text NOT NULL,
	"value_2023" text,
	"value_2024" text,
	"target_2025" text,
	"unit" text,
	"trend" text DEFAULT 'stable',
	"status" text DEFAULT 'on-track',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "division_okrs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division_id" varchar NOT NULL,
	"objective" text NOT NULL,
	"key_results" text,
	"owner" text,
	"due_date" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "division_risks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division_id" varchar NOT NULL,
	"type" text NOT NULL,
	"level" text DEFAULT 'medium',
	"description" text,
	"mitigation" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ceo" text,
	"profit_2023" integer,
	"profit_2024" integer,
	"change_percent" real,
	"description" text,
	"color" text,
	"portfolio_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_risk_categories" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"icon" text,
	"color" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_risks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium',
	"trend" text DEFAULT 'stable',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "epics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" varchar,
	"value_stream_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'business',
	"status" text DEFAULT 'funnel',
	"owner" text,
	"hypothesis" text,
	"expected_outcome" text,
	"acceptance_criteria" text,
	"estimated_size" text,
	"wsjf_score" text,
	"mvp" text,
	"estimated_cost" text,
	"estimated_benefit" text,
	"budget_unit" text DEFAULT '$M',
	"target_pi" text,
	"actual_pi" text,
	"progress" text DEFAULT '0',
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_type" text NOT NULL,
	"format" text DEFAULT 'csv' NOT NULL,
	"status" text DEFAULT 'pending',
	"filters" text,
	"file_path" text,
	"file_size" integer,
	"row_count" integer,
	"error_message" text,
	"requested_by" varchar,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'backlog',
	"story_points" text,
	"completed_points" text,
	"priority" text DEFAULT 'medium',
	"target_pi" text,
	"acceptance_criteria" text,
	"wsjf_score" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "field_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system_id" varchar,
	"name" text NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_field_path" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_field_path" text NOT NULL,
	"transform_type" text DEFAULT 'direct',
	"transform_config" text,
	"is_required" text DEFAULT 'false',
	"default_value" text,
	"validation_rules" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "graph_sync_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"sync_status" text NOT NULL,
	"error_message" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system_id" varchar,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"trigger_type" text DEFAULT 'manual',
	"started_at" timestamp,
	"completed_at" timestamp,
	"items_processed" text DEFAULT '0',
	"items_created" text DEFAULT '0',
	"items_updated" text DEFAULT '0',
	"items_skipped" text DEFAULT '0',
	"items_failed" text DEFAULT '0',
	"error_log" text,
	"source_data" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system_id" varchar,
	"mcp_adapter_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft',
	"sample_data" text,
	"ai_summary" text,
	"ai_pov" text,
	"safe_mapping" text,
	"quality_score" real,
	"total_records" integer DEFAULT 0,
	"mapped_records" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"created_by" text,
	"approved_by" text,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"project_id" text,
	"project_name" text,
	"confidence" text DEFAULT '0.85',
	"suggested_action" text NOT NULL,
	"impact" text,
	"status" text DEFAULT 'pending',
	"agent_source" text NOT NULL,
	"is_autonomous" text DEFAULT 'false',
	"self_approved" text DEFAULT 'false',
	"trigger_source" text DEFAULT 'manual',
	"escalated_from_agent_id" text,
	"approved_by" text,
	"approved_at" timestamp,
	"dismissed_by" text,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "key_results" (
	"id" varchar PRIMARY KEY NOT NULL,
	"okr_id" varchar NOT NULL,
	"description" text NOT NULL,
	"metric_name" text,
	"current_value" text,
	"target_value" text,
	"baseline_value" text,
	"unit" text DEFAULT '%',
	"progress" text DEFAULT '0',
	"trend" text DEFAULT 'stable',
	"data_source" text,
	"data_source_url" text,
	"last_measured_date" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" varchar PRIMARY KEY NOT NULL,
	"project_id" text,
	"business_unit_id" text,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"current_value" text,
	"target_value" text,
	"baseline_value" text,
	"unit" text DEFAULT '%',
	"trend" text DEFAULT 'stable',
	"weight" text DEFAULT '1',
	"data_source" text,
	"data_source_url" text,
	"data_source_date" text,
	"measurement_frequency" text DEFAULT 'quarterly',
	"last_measured_date" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mcp_adapters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system_id" varchar,
	"name" text NOT NULL,
	"adapter_type" text NOT NULL,
	"version" text DEFAULT '1.0.0',
	"server_url" text,
	"status" text DEFAULT 'inactive',
	"supported_tools" text,
	"supported_resources" text,
	"configuration" text,
	"last_health_check" timestamp,
	"health_status" text DEFAULT 'unknown',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mcp_tool_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcp_adapter_id" varchar,
	"mcp_tool_name" text NOT NULL,
	"safe_entity_type" text NOT NULL,
	"operation" text NOT NULL,
	"input_mapping" text,
	"output_mapping" text,
	"is_enabled" text DEFAULT 'true',
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"target_date" timestamp,
	"status" text DEFAULT 'pending',
	"deliverables" text,
	"pi_number" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'info',
	"source" text,
	"source_id" text,
	"is_read" boolean DEFAULT false,
	"is_dismissed" boolean DEFAULT false,
	"action_url" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "obda_query_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_hash" text NOT NULL,
	"sparql_query" text NOT NULL,
	"rewritten_query" text,
	"result_set" text,
	"source_systems" text,
	"execution_time_ms" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "obda_query_cache_query_hash_unique" UNIQUE("query_hash")
);
--> statement-breakpoint
CREATE TABLE "okrs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"objective" text NOT NULL,
	"business_unit_id" text,
	"strategic_priority" text DEFAULT 'high',
	"owner" text,
	"overall_progress" text DEFAULT '0',
	"status" text DEFAULT 'active',
	"data_source" text,
	"data_source_url" text,
	"data_source_date" text,
	"fiscal_year" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ontology_entities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_uri" text NOT NULL,
	"entity_type" text NOT NULL,
	"local_entity_type" text,
	"local_entity_id" varchar,
	"external_system" text,
	"external_id" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ontology_entities_entity_uri_unique" UNIQUE("entity_uri")
);
--> statement-breakpoint
CREATE TABLE "ontology_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system" text NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_field_path" text NOT NULL,
	"ontology_class" text NOT NULL,
	"ontology_property" text NOT NULL,
	"transform_function" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"document_id" text,
	"source_text" text,
	"generated_code" text NOT NULL,
	"code_format" text DEFAULT 'yaml',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_business_unit_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" varchar NOT NULL,
	"business_unit_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_project_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"impact_level" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"vision" text,
	"strategic_themes" text,
	"owner" text,
	"status" text DEFAULT 'active',
	"budget_allocation" text,
	"budget_unit" text DEFAULT '$M',
	"fiscal_year" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_increments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"art_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"pi_number" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"ip_iteration_start" timestamp,
	"ip_iteration_end" timestamp,
	"status" text DEFAULT 'planning',
	"objectives" text,
	"committed_points" text,
	"delivered_points" text,
	"predictability" text,
	"business_value" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_financials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"capitalex" text,
	"opex" text,
	"contingency" text,
	"npv" text,
	"irr" text,
	"payback_months" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "project_financials_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"project_name" text NOT NULL,
	"metric_key" text NOT NULL,
	"metric_name" text NOT NULL,
	"current_value" text NOT NULL,
	"previous_value" text,
	"threshold" text NOT NULL,
	"critical_threshold" text,
	"direction" text DEFAULT 'higher_is_better',
	"unit" text DEFAULT 'decimal',
	"agent_owner" text NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bu" text,
	"division" text,
	"description" text,
	"category" text,
	"template_data" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active',
	"business_unit_id" varchar,
	"division_id" varchar,
	"portfolio_id" varchar,
	"value_stream_id" varchar,
	"art_id" varchar,
	"team_id" varchar,
	"start_date" timestamp,
	"end_date" timestamp,
	"priority" text DEFAULT 'medium',
	"expected_roi" text,
	"roi_value" text,
	"art_name" text,
	"portfolio_theme" text,
	"safe_stage" text DEFAULT 'funnel',
	"current_pi" text,
	"total_pis" text,
	"velocity" text,
	"predictability" text,
	"flow_efficiency" text,
	"epic_id" text,
	"epic_name" text,
	"epic_progress" text,
	"budget_spent" text,
	"budget_total" text,
	"budget_unit" text DEFAULT '$m',
	"okr_objective" text,
	"okr_key_result" text,
	"okr_progress" integer,
	"ai_recommendation" text,
	"timeline_elapsed" integer,
	"timeline_total" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qa_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingestion_session_id" varchar,
	"review_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"score" real,
	"ai_analysis" text,
	"issues" text,
	"recommendations" text,
	"reviewer" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"allocation" text,
	"team" text,
	"skills" text,
	"cost_rate" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"probability" text DEFAULT 'medium',
	"impact" text DEFAULT 'medium',
	"status" text DEFAULT 'open',
	"mitigation" text,
	"owner" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduled_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"report_type" text NOT NULL,
	"schedule" text NOT NULL,
	"recipients" text,
	"format" text DEFAULT 'pdf',
	"filters" text,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "source_systems" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"base_url" text,
	"auth_type" text DEFAULT 'api_key',
	"status" text DEFAULT 'disconnected',
	"last_connected_at" timestamp,
	"sync_frequency" text DEFAULT 'hourly',
	"sync_direction" text DEFAULT 'bidirectional',
	"default_portfolio_id" varchar,
	"capabilities" text,
	"mcp_server_endpoint" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_increment_id" varchar,
	"team_id" varchar,
	"name" text NOT NULL,
	"sprint_number" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"goal" text,
	"status" text DEFAULT 'planning',
	"planned_points" text,
	"completed_points" text,
	"velocity" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staging_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingestion_job_id" varchar,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text,
	"raw_data" text NOT NULL,
	"mapped_data" text,
	"target_entity_type" text,
	"target_entity_id" text,
	"status" text DEFAULT 'pending',
	"validation_errors" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'backlog',
	"story_points" text,
	"sprint" text,
	"assigned_team" text,
	"acceptance_criteria" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "strategic_themes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"portfolio_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"time_horizon" text DEFAULT '3-year',
	"budget_allocation" text,
	"status" text DEFAULT 'active',
	"linked_okr_ids" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system_id" varchar,
	"ingestion_job_id" varchar,
	"operation" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"external_entity_type" text,
	"external_entity_id" text,
	"change_details" text,
	"status" text DEFAULT 'success',
	"conflict_resolution" text,
	"performed_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_job_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_job_id" varchar,
	"triggered_by" text NOT NULL,
	"status" text DEFAULT 'pending',
	"started_at" timestamp,
	"completed_at" timestamp,
	"records_processed" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_deleted" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"conflicts_detected" integer DEFAULT 0,
	"conflicts_resolved" integer DEFAULT 0,
	"error_log" text,
	"summary" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"mcp_adapter_id" varchar,
	"source_system_id" varchar,
	"sync_type" text NOT NULL,
	"sync_direction" text NOT NULL,
	"cron_expression" text,
	"is_enabled" text DEFAULT 'true',
	"entity_types" text,
	"filter_criteria" text,
	"field_mapping_overrides" text,
	"conflict_resolution_strategy" text DEFAULT 'last_write_wins',
	"retry_policy" text,
	"last_run_at" timestamp,
	"last_run_status" text,
	"last_run_error" text,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"feature_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo',
	"effort_hours" text,
	"assignee" text,
	"skills" text,
	"priority" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"art_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'feature',
	"scrum_master" text,
	"product_owner" text,
	"tech_lead" text,
	"member_count" text,
	"capacity" text,
	"velocity" text,
	"sprint_length" text DEFAULT '2 weeks',
	"status" text DEFAULT 'active',
	"skills" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tutorial_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tutorial_id" text NOT NULL,
	"current_step" integer DEFAULT 0,
	"total_steps" integer NOT NULL,
	"is_completed" boolean DEFAULT false,
	"is_skipped" boolean DEFAULT false,
	"completed_at" timestamp,
	"started_at" timestamp DEFAULT now(),
	"last_viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"permissions" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "value_streams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'operational',
	"customer_segment" text,
	"value_proposition" text,
	"owner" text,
	"status" text DEFAULT 'active',
	"lead_time" text,
	"throughput" text,
	"external_system" text,
	"external_id" text,
	"external_url" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vro_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"color" text,
	"source" text,
	"category" text DEFAULT 'vro',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vro_metrics_metric_key_unique" UNIQUE("metric_key")
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_system_id" varchar,
	"mcp_adapter_id" varchar,
	"endpoint_path" text NOT NULL,
	"secret_token" text,
	"is_enabled" text DEFAULT 'true',
	"event_types" text,
	"trigger_sync_job_id" varchar,
	"transform_script" text,
	"retry_policy" text,
	"last_received_at" timestamp,
	"total_received" integer DEFAULT 0,
	"total_processed" integer DEFAULT 0,
	"total_failed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_endpoint_id" varchar,
	"event_type" text,
	"external_event_id" text,
	"payload" text NOT NULL,
	"headers" text,
	"signature" text,
	"signature_valid" text,
	"status" text DEFAULT 'received',
	"processing_error" text,
	"sync_job_run_id" varchar,
	"received_at" timestamp DEFAULT now(),
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"permissions" varchar(2000),
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp DEFAULT now(),
	"user_agent" varchar(500),
	"ip_address" varchar(50),
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"password_hash" varchar(255),
	"role" varchar(50) DEFAULT 'team_member',
	"phone_number" varchar(20),
	"timezone" varchar(100),
	"mfa_enabled" varchar(10) DEFAULT 'false',
	"mfa_secret" varchar(255),
	"mfa_backup_codes" varchar(1000),
	"account_status" varchar(20) DEFAULT 'active',
	"last_login_at" timestamp,
	"failed_login_attempts" varchar(10) DEFAULT '0',
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "arts" ADD CONSTRAINT "arts_value_stream_id_value_streams_id_fk" FOREIGN KEY ("value_stream_id") REFERENCES "public"."value_streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arts" ADD CONSTRAINT "arts_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_epic_id_epics_id_fk" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_value_stream_id_value_streams_id_fk" FOREIGN KEY ("value_stream_id") REFERENCES "public"."value_streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarifying_questions" ADD CONSTRAINT "clarifying_questions_ingestion_session_id_ingestion_sessions_id_fk" FOREIGN KEY ("ingestion_session_id") REFERENCES "public"."ingestion_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_kpis" ADD CONSTRAINT "division_kpis_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_okrs" ADD CONSTRAINT "division_okrs_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "division_risks" ADD CONSTRAINT "division_risks_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_risks" ADD CONSTRAINT "enterprise_risks_category_id_enterprise_risk_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."enterprise_risk_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_value_stream_id_value_streams_id_fk" FOREIGN KEY ("value_stream_id") REFERENCES "public"."value_streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_mappings" ADD CONSTRAINT "field_mappings_source_system_id_source_systems_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "public"."source_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_source_system_id_source_systems_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "public"."source_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_sessions" ADD CONSTRAINT "ingestion_sessions_source_system_id_source_systems_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "public"."source_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_sessions" ADD CONSTRAINT "ingestion_sessions_mcp_adapter_id_mcp_adapters_id_fk" FOREIGN KEY ("mcp_adapter_id") REFERENCES "public"."mcp_adapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_okr_id_okrs_id_fk" FOREIGN KEY ("okr_id") REFERENCES "public"."okrs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_adapters" ADD CONSTRAINT "mcp_adapters_source_system_id_source_systems_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "public"."source_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tool_mappings" ADD CONSTRAINT "mcp_tool_mappings_mcp_adapter_id_mcp_adapters_id_fk" FOREIGN KEY ("mcp_adapter_id") REFERENCES "public"."mcp_adapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_increments" ADD CONSTRAINT "program_increments_art_id_arts_id_fk" FOREIGN KEY ("art_id") REFERENCES "public"."arts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_ingestion_session_id_ingestion_sessions_id_fk" FOREIGN KEY ("ingestion_session_id") REFERENCES "public"."ingestion_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_program_increment_id_program_increments_id_fk" FOREIGN KEY ("program_increment_id") REFERENCES "public"."program_increments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staging_records" ADD CONSTRAINT "staging_records_ingestion_job_id_ingestion_jobs_id_fk" FOREIGN KEY ("ingestion_job_id") REFERENCES "public"."ingestion_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_job_runs" ADD CONSTRAINT "sync_job_runs_sync_job_id_sync_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."sync_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_mcp_adapter_id_mcp_adapters_id_fk" FOREIGN KEY ("mcp_adapter_id") REFERENCES "public"."mcp_adapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_source_system_id_source_systems_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "public"."source_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_art_id_arts_id_fk" FOREIGN KEY ("art_id") REFERENCES "public"."arts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_streams" ADD CONSTRAINT "value_streams_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_source_system_id_source_systems_id_fk" FOREIGN KEY ("source_system_id") REFERENCES "public"."source_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_mcp_adapter_id_mcp_adapters_id_fk" FOREIGN KEY ("mcp_adapter_id") REFERENCES "public"."mcp_adapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_trigger_sync_job_id_sync_jobs_id_fk" FOREIGN KEY ("trigger_sync_job_id") REFERENCES "public"."sync_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_webhook_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_sync_job_run_id_sync_job_runs_id_fk" FOREIGN KEY ("sync_job_run_id") REFERENCES "public"."sync_job_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");