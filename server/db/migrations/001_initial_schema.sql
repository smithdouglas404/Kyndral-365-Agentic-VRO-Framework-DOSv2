-- ============================================================================
-- Initial Schema Migration - Ontology + Company Profile System
-- ============================================================================

-- Create ENUMs
CREATE TYPE ontology_type AS ENUM ('safe', 'pmo', 'prince2', 'waterfall', 'kanban', 'custom');
CREATE TYPE company_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'modified');
CREATE TYPE enforcement_level AS ENUM ('blocking', 'warning', 'advisory');
CREATE TYPE validation_status AS ENUM ('valid', 'invalid', 'needs_review');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE item_type AS ENUM ('organizational_unit', 'metric', 'rule', 'objective', 'risk', 'kpi', 'strategic_theme');

-- ============================================================================
-- ONTOLOGY LAYER
-- ============================================================================

CREATE TABLE ontology_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(100) NOT NULL UNIQUE,
    parent_class_id UUID REFERENCES ontology_classes(id),
    namespace VARCHAR(100),
    description TEXT,
    properties JSONB NOT NULL,
    validation_rules JSONB,
    default_visualization JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE ontology_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_class_id UUID REFERENCES ontology_classes(id) NOT NULL,
    to_class_id UUID REFERENCES ontology_classes(id) NOT NULL,
    relationship_type VARCHAR(100) NOT NULL,
    cardinality VARCHAR(20),
    is_required BOOLEAN DEFAULT FALSE,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE ontology_industry_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_name VARCHAR(100) NOT NULL UNIQUE,
    industry_code VARCHAR(20),
    primary_classes JSONB NOT NULL,
    class_extensions JSONB,
    standard_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- COMPANY LAYER
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(500) NOT NULL,
    trade_names JSONB,
    headquarters JSONB NOT NULL,
    incorporation_details JSONB,
    industry_profile_id UUID REFERENCES ontology_industry_profiles(id),
    primary_naics_code VARCHAR(10),
    primary_naics_description TEXT,
    secondary_naics_codes JSONB,
    gics_sector VARCHAR(100),
    gics_industry_group VARCHAR(100),
    gics_industry VARCHAR(100),
    gics_sub_industry VARCHAR(100),
    business_summary TEXT,
    mission_statement TEXT,
    primary_products_services JSONB,
    latest_annual_report_url TEXT,
    latest_annual_report_date DATE,
    latest_annual_report_type VARCHAR(20),
    fiscal_year_end VARCHAR(10),
    reporting_currency VARCHAR(3),
    profile_generated_at TIMESTAMP,
    profile_approved_at TIMESTAMP,
    profile_approved_by UUID,
    ai_extraction_confidence DECIMAL(3,2),
    extraction_metadata JSONB,
    org_structure_terminology JSONB,
    status company_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE organizational_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES organizational_units(id),
    unit_name VARCHAR(255) NOT NULL,
    unit_type VARCHAR(50),
    unit_code VARCHAR(50),
    description TEXT,
    primary_activities JSONB,
    geographic_scope JSONB,
    revenue_contribution_pct DECIMAL(5,2),
    operating_income_contribution_pct DECIMAL(5,2),
    extracted_from_source BOOLEAN DEFAULT FALSE,
    source_document_reference TEXT,
    extraction_confidence DECIMAL(3,2),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(company_id, unit_name)
);

-- ============================================================================
-- COMPANY ONTOLOGY INSTANCES
-- ============================================================================

CREATE TABLE company_ontology_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    ontology_class_id UUID REFERENCES ontology_classes(id) NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    instance_code VARCHAR(100),
    instance_data JSONB NOT NULL,
    extracted_from_report BOOLEAN DEFAULT FALSE,
    source_document TEXT,
    source_reference TEXT,
    extraction_confidence DECIMAL(3,2),
    validation_status validation_status DEFAULT 'valid',
    validation_errors JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(company_id, ontology_class_id, instance_code)
);

CREATE TABLE company_instance_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    ontology_relationship_id UUID REFERENCES ontology_relationships(id) NOT NULL,
    from_instance_id UUID REFERENCES company_ontology_instances(id) NOT NULL,
    to_instance_id UUID REFERENCES company_ontology_instances(id) NOT NULL,
    relationship_data JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(from_instance_id, to_instance_id, ontology_relationship_id)
);

-- ============================================================================
-- POLICY-AS-CODE
-- ============================================================================

CREATE TABLE company_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    rule_category VARCHAR(50) NOT NULL,
    rule_subcategory VARCHAR(100),
    rule_name VARCHAR(255) NOT NULL,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_description TEXT,
    rule_logic JSONB NOT NULL,
    extracted_from_report BOOLEAN DEFAULT FALSE,
    source_document TEXT,
    source_section TEXT,
    extraction_confidence DECIMAL(3,2),
    enforcement_level enforcement_level DEFAULT 'warning',
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiration_date DATE,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE rule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES company_rules(id) ON DELETE CASCADE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    exception_reason TEXT,
    approved_by UUID,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- METRICS & KPIs
-- ============================================================================

CREATE TABLE metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    organizational_unit_id UUID REFERENCES organizational_units(id),
    metric_name VARCHAR(255) NOT NULL,
    metric_code VARCHAR(100),
    metric_category VARCHAR(50),
    metric_subcategory VARCHAR(100),
    ontology_class VARCHAR(100),
    ontology_attributes JSONB,
    description TEXT,
    calculation_formula TEXT,
    unit_of_measure VARCHAR(50),
    data_type VARCHAR(20),
    reporting_frequency VARCHAR(20),
    reporting_lag_days INTEGER,
    target_value DECIMAL(18,4),
    target_range_min DECIMAL(18,4),
    target_range_max DECIMAL(18,4),
    benchmark_source TEXT,
    extracted_from_report BOOLEAN DEFAULT FALSE,
    source_document TEXT,
    source_page INTEGER,
    extraction_confidence DECIMAL(3,2),
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(company_id, metric_code)
);

CREATE TABLE metric_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_definition_id UUID REFERENCES metric_definitions(id) ON DELETE CASCADE NOT NULL,
    organizational_unit_id UUID REFERENCES organizational_units(id),
    reporting_period DATE NOT NULL,
    fiscal_year INTEGER,
    fiscal_quarter INTEGER,
    actual_value DECIMAL(18,4),
    target_value DECIMAL(18,4),
    variance DECIMAL(18,4),
    variance_pct DECIMAL(5,2),
    status VARCHAR(20),
    data_source VARCHAR(100),
    notes TEXT,
    entered_by UUID,
    entered_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(metric_definition_id, organizational_unit_id, reporting_period)
);

CREATE TABLE strategic_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    organizational_unit_id UUID REFERENCES organizational_units(id),
    objective_name VARCHAR(500) NOT NULL,
    objective_description TEXT,
    objective_category VARCHAR(50),
    start_date DATE,
    target_date DATE,
    extracted_from_report BOOLEAN DEFAULT FALSE,
    source_document TEXT,
    extraction_confidence DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'active',
    progress_pct DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategic_objective_id UUID REFERENCES strategic_objectives(id) ON DELETE CASCADE NOT NULL,
    key_result_name VARCHAR(500) NOT NULL,
    key_result_description TEXT,
    metric_definition_id UUID REFERENCES metric_definitions(id),
    target_value DECIMAL(18,4),
    current_value DECIMAL(18,4),
    unit_of_measure VARCHAR(50),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    progress_pct DECIMAL(5,2),
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- DASHBOARDS
-- ============================================================================

CREATE TABLE dashboard_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(100),
    template_type VARCHAR(50),
    description TEXT,
    target_roles JSONB,
    organizational_unit_filter BOOLEAN DEFAULT FALSE,
    layout_config JSONB NOT NULL,
    auto_generated BOOLEAN DEFAULT FALSE,
    generation_metadata JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- EXTRACTION & PROCESSING
-- ============================================================================

CREATE TABLE document_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(50),
    document_url TEXT NOT NULL,
    document_date DATE,
    document_filing_type VARCHAR(20),
    status processing_status DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    extraction_results JSONB,
    ai_model_used VARCHAR(100),
    tokens_consumed INTEGER,
    processing_time_seconds INTEGER,
    confidence_scores JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    initiated_by UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE extraction_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_processing_job_id UUID REFERENCES document_processing_jobs(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    item_type item_type NOT NULL,
    item_data JSONB NOT NULL,
    review_status review_status DEFAULT 'pending',
    confidence_score DECIMAL(3,2),
    requires_human_review BOOLEAN DEFAULT TRUE,
    source_document_section TEXT,
    source_page_number INTEGER,
    source_text_excerpt TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    modified_data JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE company_discovery_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    search_query VARCHAR(255),
    company_legal_name VARCHAR(500),
    doing_business_as VARCHAR(500),
    headquarters_location JSONB,
    industry_codes JSONB,
    entity_identifiers JSONB,
    confidence_score DECIMAL(3,2),
    data_sources JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_gics_industry ON companies(gics_industry);
CREATE INDEX idx_org_units_company ON organizational_units(company_id);
CREATE INDEX idx_org_units_parent ON organizational_units(parent_id);
CREATE INDEX idx_company_rules_company ON company_rules(company_id);
CREATE INDEX idx_company_rules_category ON company_rules(rule_category, is_active);
CREATE INDEX idx_metric_defs_company ON metric_definitions(company_id);
CREATE INDEX idx_metric_values_definition ON metric_values(metric_definition_id, reporting_period);
CREATE INDEX idx_strategic_obj_company ON strategic_objectives(company_id);
CREATE INDEX idx_doc_processing_company_status ON document_processing_jobs(company_id, status);
CREATE INDEX idx_extraction_review_status ON extraction_review_queue(review_status, requires_human_review);
CREATE INDEX idx_company_ontology_instances_company ON company_ontology_instances(company_id);
CREATE INDEX idx_company_ontology_instances_class ON company_ontology_instances(ontology_class_id);
CREATE INDEX idx_company_ontology_instances_code ON company_ontology_instances(instance_code);
