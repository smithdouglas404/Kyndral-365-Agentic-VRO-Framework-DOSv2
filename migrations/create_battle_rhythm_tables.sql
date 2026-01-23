-- Migration: Add Battle Rhythm tables
-- Date: 2026-01-23
-- Description: Tables for military-inspired cadence-aware scheduling system

-- ============================================================================
-- BATTLE RHYTHM SYNTHESES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS battle_rhythm_syntheses (
  id VARCHAR(255) PRIMARY KEY,
  event VARCHAR(50) NOT NULL, -- scrum_of_scrums, cross_functional_opt, decision_node, value_pulse, weekly_orders
  week_of DATE NOT NULL, -- Monday of the week
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  agenda TEXT NOT NULL,
  key_findings JSONB, -- Array of findings from agents
  decisions JSONB, -- Array of kill/continue/pivot decisions
  handoffs JSONB, -- Data passed to next event
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battle_rhythm_event ON battle_rhythm_syntheses(event);
CREATE INDEX IF NOT EXISTS idx_battle_rhythm_week ON battle_rhythm_syntheses(week_of);
CREATE INDEX IF NOT EXISTS idx_battle_rhythm_created ON battle_rhythm_syntheses(created_at);

-- ============================================================================
-- COMMANDERS INTENT TABLE (Project-level)
-- ============================================================================
CREATE TABLE IF NOT EXISTS commanders_intent (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL, -- The "Why" - TMO perspective
  key_tasks TEXT NOT NULL, -- The "What" - PMO perspective
  end_state TEXT NOT NULL, -- Success criteria - VRO perspective
  risk_tolerance JSONB NOT NULL, -- What we're willing to trade off
  decision_authority JSONB NOT NULL, -- Who can pivot what
  status VARCHAR(50) DEFAULT 'active', -- active, archived, superseded
  version INTEGER DEFAULT 1,
  created_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_commanders_intent_project ON commanders_intent(project_id);
CREATE INDEX IF NOT EXISTS idx_commanders_intent_status ON commanders_intent(status);

-- ============================================================================
-- DECISION NODES TABLE (Kill/Continue/Pivot tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_nodes (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  decision_type VARCHAR(20) NOT NULL, -- kill, continue, pivot
  decision_date DATE NOT NULL,
  reasoning TEXT NOT NULL,
  decided_by VARCHAR(255), -- User who made decision
  supporting_data JSONB, -- Agent findings, metrics, etc.
  outcome TEXT, -- What happened after decision (filled later)
  outcome_date DATE, -- When outcome was measured
  outcome_matched_prediction BOOLEAN, -- Did it work as expected?
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_decision_nodes_project ON decision_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_decision_nodes_type ON decision_nodes(decision_type);
CREATE INDEX IF NOT EXISTS idx_decision_nodes_date ON decision_nodes(decision_date);

-- ============================================================================
-- VRO/PMO/TMO CONFLICT MATRIX TABLE (Authority boundaries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_matrix (
  id VARCHAR(255) PRIMARY KEY,
  decision_type VARCHAR(100) NOT NULL, -- "Define Value", "Build Roadmap", etc.
  decision_level VARCHAR(50) NOT NULL, -- strategic, operational, tactical
  vro_authority VARCHAR(20) NOT NULL, -- owns, approves, advises, informs, no_vote
  tmo_authority VARCHAR(20) NOT NULL,
  pmo_authority VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authority_matrix_level ON authority_matrix(decision_level);

-- ============================================================================
-- INSERT DEFAULT AUTHORITY MATRIX
-- ============================================================================
INSERT INTO authority_matrix (id, decision_type, decision_level, vro_authority, tmo_authority, pmo_authority, description)
VALUES
  -- STRATEGIC LEVEL
  ('auth-define-value', 'Define Value', 'strategic', 'owns', 'advises', 'informs', 'VRO owns value definition'),
  ('auth-success-criteria', 'Set Success Criteria', 'strategic', 'owns', 'advises', 'informs', 'VRO defines what success looks like'),
  ('auth-business-case', 'Approve Business Case Changes', 'strategic', 'owns', 'validates', 'no_vote', 'VRO owns business case, TMO validates feasibility'),
  ('auth-portfolio-prioritization', 'Portfolio Prioritization', 'strategic', 'owns', 'advises', 'no_vote', 'VRO prioritizes based on value'),

  -- OPERATIONAL LEVEL
  ('auth-build-roadmap', 'Build Roadmap', 'operational', 'approves', 'owns', 'advises', 'TMO owns roadmap, VRO approves'),
  ('auth-sequence-work', 'Sequence Work', 'operational', 'constraints', 'owns', 'advises', 'TMO sequences work within VRO constraints'),
  ('auth-manage-dependencies', 'Manage Dependencies', 'operational', 'informs', 'owns', 'advises', 'TMO owns cross-project dependencies'),
  ('auth-architecture', 'Architecture Decisions', 'operational', 'informs', 'owns', 'implements', 'TMO defines architecture, PMO implements'),
  ('auth-resource-allocation', 'Resource Allocation', 'operational', 'constraints', 'allocates', 'requests', 'TMO allocates resources within VRO constraints'),

  -- TACTICAL LEVEL
  ('auth-assign-tasks', 'Assign Tasks', 'tactical', 'no_vote', 'monitors', 'owns', 'PMO owns daily task assignment'),
  ('auth-daily-execution', 'Daily Execution', 'tactical', 'no_vote', 'no_vote', 'owns', 'PMO executes within intent'),
  ('auth-resolve-blockers', 'Resolve Blockers', 'tactical', 'no_vote', 'escalation', 'owns', 'PMO resolves, escalates to TMO if needed'),
  ('auth-quality', 'Quality Standards', 'tactical', 'informs', 'standards', 'executes', 'TMO sets standards, PMO executes'),
  ('auth-sprint-planning', 'Sprint Planning', 'tactical', 'no_vote', 'advises', 'owns', 'PMO owns sprint planning'),

  -- PIVOT DECISIONS
  ('auth-tactical-pivot', 'Tactical Pivot (same end state)', 'tactical', 'informed', 'informed', 'autonomous', 'PMO can pivot autonomously within intent'),
  ('auth-operational-pivot', 'Operational Pivot (roadmap)', 'operational', 'consulted', 'decides', 'recommends', 'TMO decides on roadmap changes'),
  ('auth-strategic-pivot', 'Strategic Pivot (end state changes)', 'strategic', 'decides', 'recommends', 'informs', 'VRO decides if end state changes')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- WEEKLY ORDERS TABLE (Friday broadcasts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_orders (
  id VARCHAR(255) PRIMARY KEY,
  week_of DATE NOT NULL,
  issued_by VARCHAR(255), -- Leadership who issued
  intent_updates TEXT, -- Updates to Commander's Intent
  priorities TEXT, -- Top 3 priorities for next week
  known_risks TEXT, -- Risks to watch
  distributed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_orders_week ON weekly_orders(week_of);

-- ============================================================================
-- BATTLE RHYTHM CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS battle_rhythm_config (
  id VARCHAR(255) PRIMARY KEY,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  scrum_of_scrums_day INTEGER DEFAULT 1, -- 1 = Monday
  scrum_of_scrums_hour INTEGER DEFAULT 9,
  scrum_of_scrums_minute INTEGER DEFAULT 0,
  cross_functional_opt_day INTEGER DEFAULT 2, -- 2 = Tuesday
  cross_functional_opt_hour INTEGER DEFAULT 10,
  cross_functional_opt_minute INTEGER DEFAULT 0,
  decision_node_day INTEGER DEFAULT 3, -- 3 = Wednesday
  decision_node_hour INTEGER DEFAULT 14,
  decision_node_minute INTEGER DEFAULT 0,
  value_pulse_day INTEGER DEFAULT 4, -- 4 = Thursday
  value_pulse_hour INTEGER DEFAULT 11,
  value_pulse_minute INTEGER DEFAULT 0,
  weekly_orders_day INTEGER DEFAULT 5, -- 5 = Friday
  weekly_orders_hour INTEGER DEFAULT 15,
  weekly_orders_minute INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default config
INSERT INTO battle_rhythm_config (id, timezone, enabled)
VALUES ('default', 'America/New_York', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Current week's Battle Rhythm view
CREATE OR REPLACE VIEW current_week_battle_rhythm AS
SELECT
  week_of,
  MAX(CASE WHEN event = 'scrum_of_scrums' THEN id END) as monday_id,
  MAX(CASE WHEN event = 'scrum_of_scrums' THEN generated_at END) as monday_generated,
  MAX(CASE WHEN event = 'cross_functional_opt' THEN id END) as tuesday_id,
  MAX(CASE WHEN event = 'cross_functional_opt' THEN generated_at END) as tuesday_generated,
  MAX(CASE WHEN event = 'decision_node' THEN id END) as wednesday_id,
  MAX(CASE WHEN event = 'decision_node' THEN generated_at END) as wednesday_generated,
  MAX(CASE WHEN event = 'value_pulse' THEN id END) as thursday_id,
  MAX(CASE WHEN event = 'value_pulse' THEN generated_at END) as thursday_generated,
  MAX(CASE WHEN event = 'weekly_orders' THEN id END) as friday_id,
  MAX(CASE WHEN event = 'weekly_orders' THEN generated_at END) as friday_generated
FROM battle_rhythm_syntheses
WHERE week_of >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY week_of
ORDER BY week_of DESC
LIMIT 1;

-- Decision effectiveness view
CREATE OR REPLACE VIEW decision_effectiveness AS
SELECT
  decision_type,
  COUNT(*) as total_decisions,
  COUNT(CASE WHEN outcome_matched_prediction = true THEN 1 END) as successful,
  COUNT(CASE WHEN outcome_matched_prediction = false THEN 1 END) as unsuccessful,
  COUNT(CASE WHEN outcome_matched_prediction IS NULL THEN 1 END) as pending,
  ROUND(
    COUNT(CASE WHEN outcome_matched_prediction = true THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN outcome_matched_prediction IS NOT NULL THEN 1 END), 0) * 100,
    1
  ) as success_rate_percent
FROM decision_nodes
GROUP BY decision_type;

COMMENT ON TABLE battle_rhythm_syntheses IS 'Weekly Battle Rhythm event syntheses and agendas';
COMMENT ON TABLE commanders_intent IS 'Project-level Commander Intent (Purpose, Tasks, End State, Authority)';
COMMENT ON TABLE decision_nodes IS 'Kill/Continue/Pivot decisions made at Wednesday Decision Nodes';
COMMENT ON TABLE authority_matrix IS 'VRO/PMO/TMO conflict matrix defining decision authority boundaries';
COMMENT ON TABLE weekly_orders IS 'Friday weekly orders broadcast to all teams';
COMMENT ON TABLE battle_rhythm_config IS 'Configuration for Battle Rhythm scheduling';
