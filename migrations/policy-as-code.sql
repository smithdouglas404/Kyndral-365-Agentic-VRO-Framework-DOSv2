-- ============================================================================
-- POLICY AS CODE MIGRATION
-- Created: 2026-01-25
-- Purpose: Add policy-as-code tables and columns for compliance automation
-- ============================================================================

-- 1. Create policy_as_code table
CREATE TABLE IF NOT EXISTS policy_as_code (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id VARCHAR,
  document_name TEXT NOT NULL,
  document_type TEXT,
  policy_name TEXT NOT NULL,
  policy_description TEXT,
  sections_covered TEXT NOT NULL,
  policy_summary TEXT,
  full_policy_code TEXT NOT NULL,
  custom_attributes_created INTEGER DEFAULT 0,
  rules_generated INTEGER DEFAULT 0,

  -- HITL Approval Workflow
  status TEXT DEFAULT 'pending_review',
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,

  -- Activation Control
  effective_date TIMESTAMP,
  activated_at TIMESTAMP,
  deactivated_at TIMESTAMP,

  -- LLM Extraction Metadata
  llm_model_used TEXT,
  extraction_confidence REAL,
  extraction_tokens_used INTEGER,
  extraction_cost REAL,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_policy_id VARCHAR,

  -- Compliance Tracking
  mandatory BOOLEAN DEFAULT true,
  compliance_framework TEXT,
  enforcement_level TEXT DEFAULT 'strict',

  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create policy_extraction_audit table
CREATE TABLE IF NOT EXISTS policy_extraction_audit (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id VARCHAR NOT NULL,
  document_id VARCHAR NOT NULL,

  -- Extraction Details
  extraction_phase TEXT NOT NULL,
  status TEXT NOT NULL,

  -- What was extracted
  extracted_content TEXT,
  confidence_scores TEXT,

  -- LLM Request/Response
  llm_prompt TEXT,
  llm_response TEXT,
  llm_model TEXT,
  tokens_used INTEGER,

  -- Errors/Warnings
  errors TEXT,
  warnings TEXT,

  -- Performance
  processing_time_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create agent_configs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS agent_configs (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  config TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Add policy-as-code columns to agent_collaboration_rules (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='agent_collaboration_rules' AND column_name='source_policy_id') THEN
    ALTER TABLE agent_collaboration_rules ADD COLUMN source_policy_id VARCHAR;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='agent_collaboration_rules' AND column_name='auto_generated') THEN
    ALTER TABLE agent_collaboration_rules ADD COLUMN auto_generated BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='agent_collaboration_rules' AND column_name='policy_section') THEN
    ALTER TABLE agent_collaboration_rules ADD COLUMN policy_section TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='agent_collaboration_rules' AND column_name='mandatory') THEN
    ALTER TABLE agent_collaboration_rules ADD COLUMN mandatory BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='agent_collaboration_rules' AND column_name='compliance_type') THEN
    ALTER TABLE agent_collaboration_rules ADD COLUMN compliance_type TEXT;
  END IF;
END $$;

-- 5. Add policy-as-code columns to custom_attributes (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='custom_attributes' AND column_name='source_policy_id') THEN
    ALTER TABLE custom_attributes ADD COLUMN source_policy_id VARCHAR;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='custom_attributes' AND column_name='auto_generated') THEN
    ALTER TABLE custom_attributes ADD COLUMN auto_generated BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='custom_attributes' AND column_name='policy_section') THEN
    ALTER TABLE custom_attributes ADD COLUMN policy_section TEXT;
  END IF;
END $$;

-- 6. Add document_type column to documents table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='documents' AND column_name='document_type') THEN
    ALTER TABLE documents ADD COLUMN document_type TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_as_code_status ON policy_as_code(status);
CREATE INDEX IF NOT EXISTS idx_policy_as_code_source_doc ON policy_as_code(source_document_id);
CREATE INDEX IF NOT EXISTS idx_policy_extraction_audit_policy ON policy_extraction_audit(policy_id);
CREATE INDEX IF NOT EXISTS idx_agent_collab_rules_policy ON agent_collaboration_rules(source_policy_id);
CREATE INDEX IF NOT EXISTS idx_custom_attributes_policy ON custom_attributes(source_policy_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Policy-as-Code migration completed successfully!';
  RAISE NOTICE '  - Created policy_as_code table';
  RAISE NOTICE '  - Created policy_extraction_audit table';
  RAISE NOTICE '  - Created agent_configs table';
  RAISE NOTICE '  - Added 5 columns to agent_collaboration_rules';
  RAISE NOTICE '  - Added 3 columns to custom_attributes';
  RAISE NOTICE '  - Added 1 column to documents';
END $$;
