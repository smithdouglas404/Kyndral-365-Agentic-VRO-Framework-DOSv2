/**
 * FIX TENANT TYPE COMPATIBILITY
 * Drop and recreate tenants table with VARCHAR to match existing users table
 */

-- ============================================================================
-- 1. DROP EXISTING TENANTS TABLE (if any data, we'll lose it)
-- ============================================================================
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================================
-- 2. CREATE TENANTS TABLE WITH VARCHAR IDs (matching users table)
-- ============================================================================
CREATE TABLE tenants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'trial',
  subscription_tier VARCHAR(50) DEFAULT 'demo',
  provisioned_by VARCHAR,  -- Will add FK constraint after users are updated
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================================================
-- 3. ADD FOREIGN KEY FOR provisioned_by (references users)
-- ============================================================================
ALTER TABLE tenants
ADD CONSTRAINT tenants_provisioned_by_fkey
FOREIGN KEY (provisioned_by) REFERENCES users(id);

-- ============================================================================
-- 4. ALTER USERS TABLE - ADD MULTI-TENANT COLUMNS
-- ============================================================================
-- Add tenant_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
    ALTER TABLE users ADD COLUMN tenant_id VARCHAR;
  END IF;
END $$;

-- Add is_system_admin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'is_system_admin') THEN
    ALTER TABLE users ADD COLUMN is_system_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add email_verified
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add FK constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;

ALTER TABLE users
ADD CONSTRAINT users_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_is_system_admin ON users(is_system_admin);

-- ============================================================================
-- 5. CREATE TENANT INVITATIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS tenant_invitations CASCADE;

CREATE TABLE tenant_invitations (
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

CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_tenant_id ON tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_status ON tenant_invitations(status);

-- ============================================================================
-- 6. ALTER COMPANIES TABLE - ADD TENANT_ID
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    -- Drop existing FK constraint if exists
    ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_tenant_id_fkey;

    -- Add tenant_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'companies' AND column_name = 'tenant_id') THEN
      ALTER TABLE companies ADD COLUMN tenant_id VARCHAR;
    END IF;

    -- Add FK constraint
    ALTER TABLE companies
    ADD CONSTRAINT companies_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);
  END IF;
END $$;

-- ============================================================================
-- 7. CREATE USER SESSIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- 8. CREATE AUDIT LOGS TABLE
-- ============================================================================
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
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

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 9. SEED SYSTEM TENANT
-- ============================================================================
INSERT INTO tenants (name, slug, status, subscription_tier, created_at)
VALUES ('Nexus PPM System', 'system', 'active', 'enterprise', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 10. CREATE DEFAULT TENANT FOR EXISTING USERS
-- ============================================================================
INSERT INTO tenants (name, slug, status, subscription_tier)
VALUES ('Default Organization', 'default', 'active', 'professional')
ON CONFLICT (slug) DO NOTHING;

-- Update existing users with no tenant_id
UPDATE users
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default'),
    email_verified = TRUE
WHERE tenant_id IS NULL;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE tenants IS 'Multi-tenant organizations (customer companies)';
COMMENT ON TABLE tenant_invitations IS 'Email invitations for new tenant users';
COMMENT ON TABLE user_sessions IS 'JWT refresh token sessions';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
