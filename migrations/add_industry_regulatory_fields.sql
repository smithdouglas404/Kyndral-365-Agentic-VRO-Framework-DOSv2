-- Migration: Add Industry and Regulatory Context to Projects
-- Date: 2026-01-23
-- Description: Add industry classification and regulatory compliance fields

-- Add industry and regulatory fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS regulatory_context JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'not_assessed';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS compliance_requirements JSONB DEFAULT '[]';

-- Create index on industry for filtering
CREATE INDEX IF NOT EXISTS idx_projects_industry ON projects(industry);
CREATE INDEX IF NOT EXISTS idx_projects_compliance_status ON projects(compliance_status);

-- Create regulatory frameworks table
CREATE TABLE IF NOT EXISTS regulatory_frameworks (
  id VARCHAR(255) PRIMARY KEY,
  industry VARCHAR(100) NOT NULL,
  framework_name VARCHAR(255) NOT NULL,
  description TEXT,
  requirements JSONB NOT NULL, -- Array of compliance requirements
  severity VARCHAR(50) NOT NULL, -- mandatory, recommended, optional
  authority VARCHAR(255), -- Regulatory body (e.g., "SEC", "FDA", "FINRA")
  effective_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_industry ON regulatory_frameworks(industry);
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_severity ON regulatory_frameworks(severity);

-- Seed regulatory frameworks for key industries
INSERT INTO regulatory_frameworks (id, industry, framework_name, description, requirements, severity, authority, effective_date)
VALUES
  -- BANKING
  ('reg-banking-basel3', 'banking', 'Basel III', 'International banking regulations on capital adequacy',
   '["Capital adequacy ratio >= 8%", "Tier 1 capital >= 6%", "Leverage ratio >= 3%", "Liquidity coverage ratio >= 100%"]'::jsonb,
   'mandatory', 'Basel Committee on Banking Supervision', '2019-01-01'),

  ('reg-banking-dodd-frank', 'banking', 'Dodd-Frank Act', 'US financial reform and consumer protection',
   '["Stress testing", "Volcker Rule compliance", "Whistleblower protections", "Consumer protection"]'::jsonb,
   'mandatory', 'SEC / CFTC', '2010-07-21'),

  ('reg-banking-kyc-aml', 'banking', 'KYC/AML', 'Know Your Customer and Anti-Money Laundering',
   '["Customer identity verification", "Transaction monitoring", "Suspicious activity reporting", "Record keeping"]'::jsonb,
   'mandatory', 'FinCEN', '2001-10-26'),

  -- INSURANCE
  ('reg-insurance-solvency2', 'insurance', 'Solvency II', 'EU insurance regulation on capital and risk management',
   '["Solvency Capital Requirement", "Minimum Capital Requirement", "Risk management system", "Supervisory reporting"]'::jsonb,
   'mandatory', 'European Insurance and Occupational Pensions Authority', '2016-01-01'),

  ('reg-insurance-naic', 'insurance', 'NAIC Model Laws', 'US state insurance regulations',
   '["Market conduct standards", "Claims handling", "Privacy protection", "Rate filing"]'::jsonb,
   'mandatory', 'National Association of Insurance Commissioners', '1990-01-01'),

  -- HEALTHCARE
  ('reg-health-hipaa', 'health', 'HIPAA', 'Health Insurance Portability and Accountability Act',
   '["PHI protection", "Access controls", "Audit logging", "Data encryption", "Business associate agreements"]'::jsonb,
   'mandatory', 'HHS Office for Civil Rights', '1996-08-21'),

  ('reg-health-hitech', 'health', 'HITECH Act', 'Health Information Technology for Economic and Clinical Health',
   '["Breach notification", "Meaningful use", "EHR incentives", "Audits and enforcement"]'::jsonb,
   'mandatory', 'HHS', '2009-02-17'),

  ('reg-health-fda-21cfr11', 'health', 'FDA 21 CFR Part 11', 'Electronic records and signatures',
   '["E-signature validation", "Audit trails", "System validation", "Record retention"]'::jsonb,
   'mandatory', 'FDA', '1997-08-20'),

  -- FINANCE (General)
  ('reg-finance-sox', 'finance', 'Sarbanes-Oxley (SOX)', 'Corporate financial reporting and governance',
   '["Internal controls (Section 404)", "CEO/CFO certification", "Audit committee independence", "Disclosure controls"]'::jsonb,
   'mandatory', 'SEC', '2002-07-30'),

  ('reg-finance-gdpr', 'finance', 'GDPR', 'General Data Protection Regulation',
   '["Data protection by design", "Right to erasure", "Breach notification", "Data portability", "Consent management"]'::jsonb,
   'mandatory', 'European Data Protection Board', '2018-05-25'),

  ('reg-finance-pci-dss', 'finance', 'PCI DSS', 'Payment Card Industry Data Security Standard',
   '["Network security", "Cardholder data protection", "Vulnerability management", "Access control", "Monitoring"]'::jsonb,
   'mandatory', 'PCI Security Standards Council', '2006-12-15'),

  -- ENERGY (NextEra specific)
  ('reg-energy-nerc-cip', 'energy', 'NERC CIP', 'Critical Infrastructure Protection for electric utilities',
   '["Cyber security controls", "Personnel training", "Security management", "Incident reporting"]'::jsonb,
   'mandatory', 'North American Electric Reliability Corporation', '2008-01-01'),

  ('reg-energy-ferc', 'energy', 'FERC Regulations', 'Federal Energy Regulatory Commission standards',
   '["Market transparency", "Transmission planning", "Rate filing", "Environmental compliance"]'::jsonb,
   'mandatory', 'FERC', '1977-10-01'),

  ('reg-energy-epa', 'energy', 'EPA Clean Air Act', 'Environmental protection standards',
   '["Emissions monitoring", "Pollution controls", "Permit compliance", "Reporting"]'::jsonb,
   'mandatory', 'EPA', '1970-12-31')

ON CONFLICT (id) DO NOTHING;

-- Create compliance_checks table for tracking project compliance
CREATE TABLE IF NOT EXISTS compliance_checks (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  framework_id VARCHAR(255) NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL, -- compliant, non_compliant, in_progress, not_applicable
  findings JSONB, -- Array of compliance findings
  remediation_plan TEXT,
  checked_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (framework_id) REFERENCES regulatory_frameworks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_project ON compliance_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_framework ON compliance_checks(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);

COMMENT ON TABLE regulatory_frameworks IS 'Regulatory compliance frameworks by industry';
COMMENT ON TABLE compliance_checks IS 'Project-level compliance verification tracking';
COMMENT ON COLUMN projects.industry IS 'Industry classification: banking, insurance, health, finance, energy';
COMMENT ON COLUMN projects.compliance_status IS 'Overall compliance status: not_assessed, compliant, non_compliant, in_progress';
