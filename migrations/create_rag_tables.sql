-- =====================================================
-- RAG (Retrieval Augmented Generation) TABLES
-- For agent learning, pattern matching, and knowledge base
-- =====================================================

-- 1. Agent Decision History
-- Stores every decision/recommendation made by agents
CREATE TABLE IF NOT EXISTS agent_decision_history (
  id VARCHAR PRIMARY KEY,
  agent_name VARCHAR NOT NULL,
  decision_type VARCHAR NOT NULL,
  project_id VARCHAR,
  context_snapshot JSONB NOT NULL,
  recommendation TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence_score NUMERIC(3,2),
  predicted_outcome JSONB,
  actual_outcome JSONB,
  user_action VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  outcome_measured_at TIMESTAMP,
  embedding VECTOR(1536)
);

CREATE INDEX IF NOT EXISTS idx_agent_decision_embedding ON agent_decision_history USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_agent_decision_agent_type ON agent_decision_history(agent_name, decision_type);
CREATE INDEX IF NOT EXISTS idx_agent_decision_project ON agent_decision_history(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_decision_created ON agent_decision_history(created_at DESC);

-- 2. Project Outcome Patterns
-- Learned patterns from completed projects
CREATE TABLE IF NOT EXISTS project_outcome_patterns (
  id VARCHAR PRIMARY KEY,
  pattern_name VARCHAR NOT NULL,
  pattern_signature JSONB NOT NULL,
  observed_projects VARCHAR[],
  typical_outcome JSONB NOT NULL,
  success_interventions JSONB[],
  failed_interventions JSONB[],
  occurrence_count INTEGER DEFAULT 1,
  success_rate NUMERIC(3,2),
  last_observed TIMESTAMP DEFAULT NOW(),
  embedding VECTOR(1536)
);

CREATE INDEX IF NOT EXISTS idx_pattern_embedding ON project_outcome_patterns USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_pattern_name ON project_outcome_patterns(pattern_name);
CREATE INDEX IF NOT EXISTS idx_pattern_last_observed ON project_outcome_patterns(last_observed DESC);

-- 3. Agent Learning Feedback Loop
-- Tracks prediction accuracy and learnings
CREATE TABLE IF NOT EXISTS agent_learning_feedback (
  id VARCHAR PRIMARY KEY,
  decision_id VARCHAR REFERENCES agent_decision_history(id),
  feedback_type VARCHAR NOT NULL,
  expected_result JSONB,
  actual_result JSONB,
  accuracy_score NUMERIC(3,2),
  learnings TEXT,
  adjustments_made TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_decision ON agent_learning_feedback(decision_id);
CREATE INDEX IF NOT EXISTS idx_learning_type ON agent_learning_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_learning_created ON agent_learning_feedback(created_at DESC);

-- 4. Agent Narrative Templates
-- Templates for generating detailed narratives
CREATE TABLE IF NOT EXISTS agent_narrative_templates (
  id VARCHAR PRIMARY KEY,
  agent_name VARCHAR NOT NULL,
  narrative_type VARCHAR NOT NULL,
  template_structure TEXT NOT NULL,
  example_output TEXT,
  required_data_points JSONB,
  embedding VECTOR(1536)
);

CREATE INDEX IF NOT EXISTS idx_narrative_embedding ON agent_narrative_templates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_narrative_agent ON agent_narrative_templates(agent_name);

-- 5. Knowledge Base (SOPs, playbooks, PMBOK, methodologies)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR NOT NULL,
  tags VARCHAR[],
  source VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  embedding VECTOR(1536)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_base(source);

-- 6. Dependencies (if not exists)
CREATE TABLE IF NOT EXISTS dependencies (
  id VARCHAR PRIMARY KEY,
  blocking_project_id VARCHAR REFERENCES projects(id),
  blocked_project_id VARCHAR REFERENCES projects(id),
  dependency_type VARCHAR NOT NULL,
  deliverable VARCHAR,
  expected_completion_date TIMESTAMP,
  status VARCHAR DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dep_blocking ON dependencies(blocking_project_id);
CREATE INDEX IF NOT EXISTS idx_dep_blocked ON dependencies(blocked_project_id);
CREATE INDEX IF NOT EXISTS idx_dep_status ON dependencies(status);

COMMENT ON TABLE agent_decision_history IS 'Stores all agent decisions for learning and pattern matching';
COMMENT ON TABLE project_outcome_patterns IS 'Learned patterns from historical project outcomes';
COMMENT ON TABLE agent_learning_feedback IS 'Feedback loop tracking agent prediction accuracy';
COMMENT ON TABLE agent_narrative_templates IS 'Templates for generating detailed agent narratives';
COMMENT ON TABLE knowledge_base IS 'SOPs, playbooks, PMBOK, and organizational knowledge';
COMMENT ON TABLE dependencies IS 'Project dependencies for cross-project coordination';
