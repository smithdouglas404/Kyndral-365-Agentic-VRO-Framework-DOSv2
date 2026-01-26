/**
 * MULTI-TENANT SAAS - COMPATIBLE MIGRATION
 * Works with existing users table (varchar IDs)
 */

-- ============================================================================
-- 1. CREATE TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'trial',
  subscription_tier VARCHAR(50) DEFAULT 'demo',
  provisioned_by VARCHAR REFERENCES users(id),
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================================================
-- 2. ALTER EXISTING USERS TABLE - ADD MULTI-TENANT COLUMNS
-- ============================================================================
-- Add tenant_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
    ALTER TABLE users ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add is_system_admin if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'is_system_admin') THEN
    ALTER TABLE users ADD COLUMN is_system_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add email_verified if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_is_system_admin ON users(is_system_admin);

-- ============================================================================
-- 3. CREATE TENANT INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  invited_by VARCHAR REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_id ON tenant_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status ON tenant_invitations(status);

-- ============================================================================
-- 4. CREATE DEMO REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS demo_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  demo_session_id VARCHAR(255),
  demo_industry VARCHAR(50),
  status VARCHAR(50) DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at);

-- ============================================================================
-- 5. ALTER COMPANIES TABLE - ADD TENANT_ID
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'companies' AND column_name = 'tenant_id') THEN
      ALTER TABLE companies ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 6. CREATE USER SESSIONS TABLE (for JWT refresh tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- 7. CREATE AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR REFERENCES users(id),
  tenant_id VARCHAR REFERENCES tenants(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 8. SEED SYSTEM TENANT
-- ============================================================================
INSERT INTO tenants (id, name, slug, status, subscription_tier, created_at)
VALUES ('system-tenant', 'Nexus PPM System', 'system', 'active', 'enterprise', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 9. UPDATE EXISTING USERS - SET DEFAULT TENANT
-- ============================================================================
-- For any existing users without tenant_id, assign them to a default tenant
DO $$
BEGIN
  -- Create a default tenant for existing users if needed
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'default') THEN
    INSERT INTO tenants (id, name, slug, status, subscription_tier)
    VALUES ('default-tenant', 'Default Organization', 'default', 'active', 'professional');
  END IF;

  -- Update users with no tenant_id
  UPDATE users
  SET tenant_id = 'default-tenant',
      email_verified = TRUE
  WHERE tenant_id IS NULL;
END $$;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE tenants IS 'Multi-tenant organizations (customer companies)';
COMMENT ON TABLE tenant_invitations IS 'Email invitations for new tenant users';
COMMENT ON TABLE demo_requests IS 'Lead capture from demo request form';
COMMENT ON TABLE user_sessions IS 'JWT refresh token sessions';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- All tables created and existing schema compatible
