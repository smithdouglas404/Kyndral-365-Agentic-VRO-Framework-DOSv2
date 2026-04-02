/**
 * MIGRATION: Add Agent-MCP Connection Tables
 *
 * Creates tables for connecting MCPs to agents:
 * 1. mcp_definitions - Available MCPs (Knowledge + Governance)
 * 2. agent_mcp_connections - Agent-MCP connections (many-to-many)
 * 3. mcp_execution_log - MCP execution logs
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

async function migrateAgentMcpTables() {
  console.log('[Migration] Creating Agent-MCP tables...');

  try {
    // 1. Create mcp_definitions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mcp_definitions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('knowledge', 'governance')),
        category TEXT,
        description TEXT,
        server_url TEXT,
        config TEXT,
        capabilities TEXT,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created mcp_definitions table');

    // 2. Create agent_mcp_connections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_mcp_connections (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id VARCHAR NOT NULL,
        mcp_id VARCHAR NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        priority INTEGER NOT NULL DEFAULT 1,
        config TEXT,
        last_used TIMESTAMP,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agent_id, mcp_id)
      )
    `);
    console.log('✅ Created agent_mcp_connections table');

    // 3. Create mcp_execution_log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mcp_execution_log (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id VARCHAR NOT NULL,
        mcp_id VARCHAR NOT NULL,
        mcp_type TEXT NOT NULL,
        operation TEXT NOT NULL,
        input TEXT,
        output TEXT,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        execution_time INTEGER,
        governance_decision TEXT CHECK (governance_decision IN ('allow', 'block', 'warn')),
        governance_reason TEXT,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created mcp_execution_log table');

    // 4. Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_mcp_definitions_type ON mcp_definitions(type)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_mcp_connections_agent ON agent_mcp_connections(agent_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_mcp_connections_mcp ON agent_mcp_connections(mcp_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_mcp_execution_log_agent ON mcp_execution_log(agent_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_mcp_execution_log_mcp ON mcp_execution_log(mcp_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_mcp_execution_log_executed ON mcp_execution_log(executed_at)
    `);
    console.log('✅ Created indexes');

    // 5. Seed default MCPs
    console.log('[Migration] Seeding default MCPs...');

    // Knowledge MCPs
    await db.execute(sql`
      INSERT INTO mcp_definitions (name, display_name, type, category, description, enabled)
      VALUES
        ('jira-mcp', 'Jira Integration', 'knowledge', 'ppm', 'Query Jira projects, issues, sprints', true),
        ('azure-devops-mcp', 'Azure DevOps Integration', 'knowledge', 'ppm', 'Query Azure DevOps work items and boards', true),
        ('sap-mcp', 'SAP Integration', 'knowledge', 'erp', 'Query SAP financial data', true),
        ('coupa-mcp', 'Coupa Integration', 'knowledge', 'erp', 'Query Coupa procurement data', true)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Seeded Knowledge MCPs');

    // Governance MCPs
    await db.execute(sql`
      INSERT INTO mcp_definitions (name, display_name, type, category, description, enabled)
      VALUES
        ('responsible-ai-mcp', 'Responsible AI Validator', 'governance', 'responsible_ai', 'Validates for bias, safety, ethical concerns', true),
        ('qa-mcp', 'Quality Assurance Validator', 'governance', 'qa', 'Validates quality standards and best practices', true),
        ('policy-mcp', 'Policy Enforcement', 'governance', 'policy', 'Enforces organizational policies', true)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Seeded Governance MCPs');

    // 6. Connect default MCPs to agents
    console.log('[Migration] Creating default agent-MCP connections...');

    // PMO agent connections
    await db.execute(sql`
      INSERT INTO agent_mcp_connections (agent_id, mcp_id, enabled, priority)
      SELECT 'pmo', id, true, 1 FROM mcp_definitions WHERE name IN ('jira-mcp', 'azure-devops-mcp')
      UNION ALL
      SELECT 'pmo', id, true, 2 FROM mcp_definitions WHERE name IN ('responsible-ai-mcp', 'qa-mcp')
      ON CONFLICT (agent_id, mcp_id) DO NOTHING
    `);

    // FinOps agent connections
    await db.execute(sql`
      INSERT INTO agent_mcp_connections (agent_id, mcp_id, enabled, priority)
      SELECT 'finops', id, true, 1 FROM mcp_definitions WHERE name IN ('sap-mcp', 'coupa-mcp')
      UNION ALL
      SELECT 'finops', id, true, 2 FROM mcp_definitions WHERE name IN ('responsible-ai-mcp', 'qa-mcp')
      ON CONFLICT (agent_id, mcp_id) DO NOTHING
    `);

    // All agents get governance MCPs
    await db.execute(sql`
      INSERT INTO agent_mcp_connections (agent_id, mcp_id, enabled, priority)
      SELECT agent_id, id, true, 2
      FROM (SELECT 'tmo' as agent_id UNION SELECT 'risk' UNION SELECT 'vro' UNION SELECT 'governance' UNION SELECT 'planning' UNION SELECT 'ocm') agents
      CROSS JOIN mcp_definitions
      WHERE mcp_definitions.type = 'governance'
      ON CONFLICT (agent_id, mcp_id) DO NOTHING
    `);

    console.log('✅ Created default connections');

    console.log('[Migration] ✅ Agent-MCP tables migration complete!');

    console.log('\n📊 Summary:');
    const mcpCount = await db.execute(sql`SELECT COUNT(*) FROM mcp_definitions`);
    const connCount = await db.execute(sql`SELECT COUNT(*) FROM agent_mcp_connections`);

    console.log(`  - MCPs created: ${mcpCount.rows[0].count}`);
    console.log(`  - Connections created: ${connCount.rows[0].count}`);

    console.log('\n🎯 What You Can Do Now:');
    console.log('  1. Toggle MCPs on/off per agent in dashboard');
    console.log('  2. Agents automatically use governance MCPs for validation');
    console.log('  3. Agents query knowledge MCPs for data');
    console.log('  4. View MCP execution logs for audit');
    console.log('  5. Add more MCPs via API or admin dashboard');

  } catch (error: any) {
    console.error('[Migration] ❌ Error:', error.message);
    throw error;
  }
}

// Run if called directly
if (!(globalThis as any).__BUNDLED__ && import.meta.url === `file://${process.argv[1]}`) {
  migrateAgentMcpTables()
    .then(() => {
      console.log('[Migration] Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Migration] Failed:', error);
      process.exit(1);
    });
}

export { migrateAgentMcpTables };

export {};
