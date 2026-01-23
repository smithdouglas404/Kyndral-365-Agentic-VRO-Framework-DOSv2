-- Migration: Add LLM Router and Knowledge Base tables
-- Date: 2026-01-23
-- Description: Tables for LLM routing, usage tracking, and enhanced knowledge base management

-- ============================================================================
-- LLM USAGE METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS llm_usage_metrics (
  id VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  tokens INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_provider_model ON llm_usage_metrics(provider, model);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created_at ON llm_usage_metrics(created_at);

-- ============================================================================
-- SYSTEM CONFIG TABLE (for LLM default config)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- KNOWLEDGE USAGE LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_usage_log (
  id VARCHAR(255) PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  relevance_score DECIMAL(3, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (article_id) REFERENCES knowledge_base(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_usage_article ON knowledge_usage_log(article_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_agent ON knowledge_usage_log(agent_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_created ON knowledge_usage_log(created_at);

-- ============================================================================
-- ENHANCE KNOWLEDGE_BASE TABLE (add missing columns if they don't exist)
-- ============================================================================
DO $$
BEGIN
  -- Add subcategory column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_base' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN subcategory VARCHAR(100);
  END IF;

  -- Add summary column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_base' AND column_name = 'summary'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN summary TEXT;
  END IF;

  -- Add version column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_base' AND column_name = 'version'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN version VARCHAR(50) DEFAULT '1.0';
  END IF;

  -- Add author column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_base' AND column_name = 'author'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN author VARCHAR(255);
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_base' AND column_name = 'status'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN status VARCHAR(20) DEFAULT 'published';
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_base' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- AGENT LLM CONFIG TABLE (per-agent LLM preferences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_llm_config (
  id VARCHAR(255) PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  fallback_provider VARCHAR(50),
  fallback_model VARCHAR(100),
  config JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_llm_config_agent ON agent_llm_config(agent_name);

-- ============================================================================
-- KNOWLEDGE BASE CATEGORIES TABLE (for better organization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS kb_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_id VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (parent_id) REFERENCES kb_categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON kb_categories(parent_id);

-- ============================================================================
-- INSERT DEFAULT KB CATEGORIES
-- ============================================================================
INSERT INTO kb_categories (id, name, display_name, description, icon, sort_order)
VALUES
  ('cat-pmbok', 'pmbok', 'PMBOK', 'Project Management Body of Knowledge - PMI Standard', '📘', 1),
  ('cat-prince2', 'prince2', 'PRINCE2', 'Projects in Controlled Environments - UK Standard', '👑', 2),
  ('cat-pmi', 'pmi_standard', 'PMI Standards', 'Project Management Institute Standards and Practices', '📊', 3),
  ('cat-safe', 'safe', 'SAFe', 'Scaled Agile Framework for Enterprise Agility', '🚀', 4),
  ('cat-sop', 'sop', 'SOPs', 'Standard Operating Procedures - Internal Processes', '📋', 5),
  ('cat-playbook', 'playbook', 'Playbooks', 'Proven Playbooks and Tactical Guides', '🎯', 6),
  ('cat-lesson', 'lesson_learned', 'Lessons Learned', 'Post-Mortem Insights and Retrospectives', '💡', 7),
  ('cat-best', 'best_practice', 'Best Practices', 'Industry Best Practices and Guidelines', '⭐', 8),
  ('cat-template', 'template', 'Templates', 'Document Templates and Forms', '📄', 9),
  ('cat-checklist', 'checklist', 'Checklists', 'Process Checklists and Validation Lists', '✅', 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- LLM ROUTER ANALYTICS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW llm_usage_analytics AS
SELECT
  provider,
  model,
  COUNT(*) as total_calls,
  SUM(tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(latency_ms) as avg_latency_ms,
  AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
  MAX(created_at) as last_used
FROM llm_usage_metrics
GROUP BY provider, model;

-- ============================================================================
-- KNOWLEDGE BASE ANALYTICS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW kb_analytics AS
SELECT
  kb.id,
  kb.title,
  kb.category,
  kb.subcategory,
  (kb.metadata->>'usageCount')::int as usage_count,
  COUNT(DISTINCT kul.agent_name) as unique_agents,
  AVG(kul.relevance_score) as avg_relevance,
  MAX(kul.created_at) as last_referenced,
  kb.status,
  kb.created_at
FROM knowledge_base kb
LEFT JOIN knowledge_usage_log kul ON kb.id = kul.article_id
GROUP BY kb.id, kb.title, kb.category, kb.subcategory, kb.metadata, kb.status, kb.created_at;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE llm_usage_metrics IS 'Tracks usage, performance, and cost of LLM API calls';
COMMENT ON TABLE system_config IS 'System-wide configuration including default LLM settings';
COMMENT ON TABLE knowledge_usage_log IS 'Logs when agents reference knowledge base articles';
COMMENT ON TABLE agent_llm_config IS 'Per-agent LLM configuration and preferences';
COMMENT ON TABLE kb_categories IS 'Hierarchical categories for knowledge base organization';
