-- ============================================================================
-- MIGRATION: Drop PostgreSQL Tables Now Replaced by Palantir Ontology
-- ============================================================================
-- Run this AFTER confirming Palantir sync is working
-- Date: 2026-03-02
-- Purpose: Remove business data tables that are now sourced from Palantir Foundry
-- ============================================================================

-- SAFETY: Start transaction
BEGIN;

-- ============================================================================
-- PHASE 1: Drop Business Data Tables (Now in Palantir Ontology)
-- ============================================================================

-- Projects hierarchy - now in Palantir Project/WorkItem objects
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS features CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Division/Enterprise data - now in Palantir BusinessUnit/Portfolio objects
DROP TABLE IF EXISTS division_risks CASCADE;
DROP TABLE IF EXISTS division_okrs CASCADE;
DROP TABLE IF EXISTS division_kpis CASCADE;
DROP TABLE IF EXISTS divisions CASCADE;
DROP TABLE IF EXISTS enterprise_risk_categories CASCADE;
DROP TABLE IF EXISTS enterprise_risks CASCADE;

-- Climate/ESG metrics - now in Palantir Metric objects
DROP TABLE IF EXISTS climate_metrics CASCADE;

-- ============================================================================
-- PHASE 2: Drop Old PM Tool Sync Tables (Replaced by Palantir Sync)
-- ============================================================================

-- Old integration sync tracking - replaced by Palantir sync
DROP TABLE IF EXISTS integration_sync_history CASCADE;
DROP TABLE IF EXISTS source_systems CASCADE;
DROP TABLE IF EXISTS field_mappings CASCADE;
DROP TABLE IF EXISTS stagingRecords CASCADE;
DROP TABLE IF EXISTS ingestion_jobs CASCADE;

-- Old integrations table if it only tracked non-Palantir systems
-- KEEP if it stores Palantir connection config
-- DROP TABLE IF EXISTS integrations CASCADE;

-- ============================================================================
-- PHASE 3: Drop Deprecated SAFe/Portfolio Tables (Now in Palantir)
-- ============================================================================

-- These are now in Palantir Portfolio/Program/Team objects
DROP TABLE IF EXISTS sprints CASCADE;
DROP TABLE IF EXISTS capabilities CASCADE;
DROP TABLE IF EXISTS epics CASCADE;
DROP TABLE IF EXISTS program_increments CASCADE;
DROP TABLE IF EXISTS arts CASCADE;
DROP TABLE IF EXISTS value_streams CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;

-- ============================================================================
-- PHASE 4: Clean Up Orphaned References
-- ============================================================================

-- Remove any foreign key constraints that might reference dropped tables
-- (Already handled by CASCADE above)

-- ============================================================================
-- VERIFY: Tables that MUST remain
-- ============================================================================
-- Run this SELECT to verify critical tables still exist:

DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'tenants',
        'users',
        'user_sessions',
        'agents',
        'agent_activity_log',
        'interventions',
        'alerts',
        'audit_logs',
        'mcp_definitions',
        'ontology_classes',
        'companies',
        'sync_logs'
    ];
    tbl TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOREACH tbl IN ARRAY required_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Note: Some expected tables not found (may use different naming): %', missing_tables;
    ELSE
        RAISE NOTICE 'All critical system tables verified present';
    END IF;
END $$;

-- ============================================================================
-- COMMIT: Apply all changes
-- ============================================================================
COMMIT;

-- ============================================================================
-- POST-MIGRATION: Vacuum to reclaim space
-- ============================================================================
VACUUM ANALYZE;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Dropped tables:
--   - Business data: projects, features, stories, tasks, divisions, enterprise_risks
--   - SAFe hierarchy: portfolios, value_streams, arts, program_increments, epics, capabilities, sprints
--   - Old sync: integration_sync_history, source_systems, field_mappings, stagingRecords
--   - Metrics: climate_metrics, division_kpis, division_okrs, division_risks
--
-- Data source is now: Palantir Foundry Ontology
-- Sync direction: Jira/OpenProject/Monday -> Palantir -> OntologyDataProvider -> Agents
-- ============================================================================
