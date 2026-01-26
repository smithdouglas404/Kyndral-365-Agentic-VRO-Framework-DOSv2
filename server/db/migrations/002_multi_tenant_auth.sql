-- ============================================================================
-- MIGRATION 002: Multi-Tenant Authentication & Authorization
-- Purpose: Convert single-tenant app to multi-tenant SaaS
-- ============================================================================

-- ============================================================================
-- 1. TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,                      -- "Acme Corporation"
  slug VARCHAR(255) UNIQUE NOT NULL,               -- "acme-corp" (URL-safe)
  status VARCHAR(50) DEFAULT 'trial',              -- 'trial', 'active', 'suspended', 'cancelled'
  subscription_tier VARCHAR(50) DEFAULT 'demo',    -- 'demo', 'professional', 'enterprise'
  provisioned_by UUID,                             -- System Admin who created this tenant
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                      -- bcrypt hash
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',               -- 'system_admin', 'tenant_admin', 'pmo', 'finops', 'risk', 'ocm', 'viewer'
  is_system_admin BOOLEAN DEFAULT FALSE,           -- Kyndryl staff (can access all tenants)
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 3. TENANT INVITATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  invited_by UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,              -- One-time invitation token
  status VARCHAR(50) DEFAULT 'pending',            -- 'pending', 'accepted', 'expired', 'cancelled'
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON tenant_invitations(token);
CREATE INDEX idx_invitations_tenant_id ON tenant_invitations(tenant_id);
CREATE INDEX idx_invitations_status ON tenant_invitations(status);

-- ============================================================================
-- 4. DEMO REQUESTS (Lead Capture)
-- ============================================================================
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  demo_session_id VARCHAR(255),                    -- Links to demo session if they proceed
  demo_industry VARCHAR(50),                       -- Which ACME industry they tried
  status VARCHAR(50) DEFAULT 'requested',          -- 'requested', 'demo_active', 'contacted', 'converted'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_demo_requests_email ON demo_requests(email);
CREATE INDEX idx_demo_requests_status ON demo_requests(status);
CREATE INDEX idx_demo_requests_created_at ON demo_requests(created_at DESC);

-- ============================================================================
-- 5. ADD TENANT_ID TO EXISTING TABLES
-- ============================================================================

-- Companies table (already exists)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);

-- Add tenant_id to other critical tables
-- (You'll need to add this to projects, interventions, etc. as they're created)

-- ============================================================================
-- 6. SESSIONS TABLE (Optional - for JWT refresh tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(512) UNIQUE NOT NULL,
  access_token_jti VARCHAR(255),                   -- JWT ID for access token
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- 7. AUDIT LOG (Track tenant/user actions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,                    -- 'login', 'create_project', 'invite_user', etc.
  entity_type VARCHAR(100),                        -- 'project', 'user', 'company', etc.
  entity_id UUID,
  metadata JSONB,                                  -- Additional context
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 8. SEED DATA: System Admin Account
-- ============================================================================

-- Create a "System" tenant for Kyndryl staff
INSERT INTO tenants (id, name, slug, status, subscription_tier)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Nexus PPM System',
  'system',
  'active',
  'enterprise'
) ON CONFLICT (id) DO NOTHING;

-- Create System Admin user (dsmith@smithfamilyusa.com)
-- Password: Will be set via separate script (bcrypt hash of '9fue39AQ!404')
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_system_admin, email_verified)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'dsmith@smithfamilyusa.com',
  '$2b$10$placeholder',  -- Replace with actual bcrypt hash
  'Dave',
  'Smith',
  'system_admin',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE tenants IS 'Multi-tenant organizations (one per customer company)';
COMMENT ON TABLE users IS 'Users belonging to tenants (multi-user per tenant)';
COMMENT ON TABLE tenant_invitations IS 'Email invitations for users to join a tenant';
COMMENT ON TABLE demo_requests IS 'Lead capture from demo request form';
COMMENT ON TABLE user_sessions IS 'JWT refresh token storage for session management';
COMMENT ON TABLE audit_logs IS 'Audit trail of all user actions across all tenants';
