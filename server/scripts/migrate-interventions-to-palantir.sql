-- ============================================================================
-- MIGRATION: Drop PostgreSQL Tables for Interventions/Alerts (Now in Palantir)
-- ============================================================================
-- Run this AFTER confirming Palantir HITL workflow is working
-- Date: 2026-03-02
-- Purpose: Remove intervention and alert tables now handled by Palantir Foundry
-- ============================================================================

-- SAFETY: Start transaction
BEGIN;

-- ============================================================================
-- PHASE 1: Drop Intervention Tables (Now Palantir Actions/HITL)
-- ============================================================================

-- Interventions are now Palantir Intervention objects with HITL workflow
DROP TABLE IF EXISTS intervention_outcomes CASCADE;
DROP TABLE IF EXISTS intervention_approvals CASCADE;
DROP TABLE IF EXISTS interventions CASCADE;

-- ============================================================================
-- PHASE 2: Drop Alert Tables (Now Palantir Alert objects)
-- ============================================================================

-- Alerts are now Palantir Alert objects with native notifications
DROP TABLE IF EXISTS alert_acknowledgments CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;

-- ============================================================================
-- PHASE 3: Drop Related Notification Tables
-- ============================================================================

-- Notification preferences handled by Palantir user settings
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_history CASCADE;
DROP TABLE IF EXISTS notification_subscriptions CASCADE;

-- ============================================================================
-- VERIFY: Tables that MUST remain
-- ============================================================================

DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'tenants',
        'users',
        'user_sessions',
        'agents',
        'agent_activity_log',
        'audit_logs',
        'mcp_definitions',
        'companies'
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
--   - HITL: interventions, intervention_outcomes, intervention_approvals
--   - Alerts: alerts, alert_acknowledgments
--   - Notifications: notification_preferences, notification_history, notification_subscriptions
--
-- These are now handled by Palantir Foundry:
--   - Interventions -> Palantir Intervention objects with HITL approval workflow
--   - Alerts -> Palantir Alert objects with native notification delivery
--   - Approvals -> Palantir Actions (approveIntervention, rejectIntervention)
--
-- Flow: Agent -> PalantirActionsService.createIntervention() -> Palantir HITL
-- ============================================================================
