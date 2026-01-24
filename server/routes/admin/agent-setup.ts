/**
 * AGENT SETUP API ROUTES
 *
 * Backend routes for initial agent configuration wizard and ongoing management.
 * Handles:
 * - Agent enable/disable
 * - MCP-to-Agent mappings
 * - LLM strategy per agent
 * - Cost limits and failover settings
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../../auth/authMiddleware.js';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';

interface Agent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface AgentMCPMapping {
  agentId: string;
  mcpServers: string[];
}

interface LLMPreference {
  taskType: string;
  primary: string;
  fallback: string[];
}

interface AgentLLMStrategy {
  agentId: string;
  preferences: LLMPreference[];
}

interface CostSettings {
  dailyBudget: number;
  monthlyBudget: number;
  alertThreshold: number;
  downgradeOnLimit: boolean;
}

interface SetupConfiguration {
  agents: Agent[];
  mcpMappings: AgentMCPMapping[];
  llmStrategies: AgentLLMStrategy[];
  costSettings: CostSettings;
}

export function registerAgentSetupRoutes(app: Express): void {
  /**
   * Ensure tables exist
   */
  async function ensureTables() {
    // Agent configurations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_setup_config (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        agent_id TEXT NOT NULL UNIQUE,
        agent_name TEXT NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // MCP-to-Agent mappings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_mcp_mappings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        agent_id TEXT NOT NULL,
        mcp_server_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agent_id, mcp_server_id)
      )
    `);

    // LLM strategy table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_llm_strategies (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        agent_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        primary_model TEXT NOT NULL,
        fallback_models JSONB NOT NULL,
        cost_tier INTEGER,
        max_retries INTEGER DEFAULT 2,
        timeout_ms INTEGER DEFAULT 45000,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agent_id, task_type)
      )
    `);

    // Cost settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS llm_cost_settings (
        id TEXT PRIMARY KEY DEFAULT 'singleton',
        daily_budget_usd DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        monthly_budget_usd DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
        alert_threshold INTEGER NOT NULL DEFAULT 80,
        downgrade_on_limit BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  /**
   * POST /api/admin/agent-setup/save
   * Save complete agent setup configuration
   */
  app.post('/api/admin/agent-setup/save', authenticate, async (req: Request, res: Response) => {
    try {
      // Only system admins can configure agents
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can configure agents',
        });
      }

      await ensureTables();

      const config: SetupConfiguration = req.body;

      // Validate required fields
      if (!config.agents || !config.mcpMappings || !config.llmStrategies || !config.costSettings) {
        return res.status(400).json({
          success: false,
          error: 'Missing required configuration fields',
        });
      }

      // Transaction-like operations
      // 1. Save agent configurations
      for (const agent of config.agents) {
        await db.execute(sql`
          INSERT INTO agent_setup_config (agent_id, agent_name, description, enabled)
          VALUES (${agent.id}, ${agent.name}, ${agent.description}, ${agent.enabled})
          ON CONFLICT (agent_id)
          DO UPDATE SET
            agent_name = EXCLUDED.agent_name,
            description = EXCLUDED.description,
            enabled = EXCLUDED.enabled,
            updated_at = NOW()
        `);
      }

      // 2. Clear and save MCP mappings
      await db.execute(sql`DELETE FROM agent_mcp_mappings`);
      for (const mapping of config.mcpMappings) {
        for (const mcpServerId of mapping.mcpServers) {
          await db.execute(sql`
            INSERT INTO agent_mcp_mappings (agent_id, mcp_server_id)
            VALUES (${mapping.agentId}, ${mcpServerId})
            ON CONFLICT (agent_id, mcp_server_id) DO NOTHING
          `);
        }
      }

      // 3. Clear and save LLM strategies
      await db.execute(sql`DELETE FROM agent_llm_strategies`);
      for (const strategy of config.llmStrategies) {
        for (const preference of strategy.preferences) {
          await db.execute(sql`
            INSERT INTO agent_llm_strategies (
              agent_id, task_type, primary_model, fallback_models, cost_tier
            )
            VALUES (
              ${strategy.agentId},
              ${preference.taskType},
              ${preference.primary},
              ${JSON.stringify(preference.fallback)},
              ${1}
            )
            ON CONFLICT (agent_id, task_type)
            DO UPDATE SET
              primary_model = EXCLUDED.primary_model,
              fallback_models = EXCLUDED.fallback_models,
              updated_at = NOW()
          `);
        }
      }

      // 4. Save cost settings (singleton)
      await db.execute(sql`
        INSERT INTO llm_cost_settings (
          id, daily_budget_usd, monthly_budget_usd, alert_threshold, downgrade_on_limit
        )
        VALUES (
          'singleton',
          ${config.costSettings.dailyBudget},
          ${config.costSettings.monthlyBudget},
          ${config.costSettings.alertThreshold},
          ${config.costSettings.downgradeOnLimit}
        )
        ON CONFLICT (id)
        DO UPDATE SET
          daily_budget_usd = EXCLUDED.daily_budget_usd,
          monthly_budget_usd = EXCLUDED.monthly_budget_usd,
          alert_threshold = EXCLUDED.alert_threshold,
          downgrade_on_limit = EXCLUDED.downgrade_on_limit,
          updated_at = NOW()
      `);

      console.log('[AgentSetup] Configuration saved successfully');

      res.json({
        success: true,
        message: 'Agent configuration saved successfully',
      });
    } catch (error: any) {
      console.error('[AgentSetup] Error saving configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save configuration',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agent-setup/config
   * Get current agent setup configuration
   */
  app.get('/api/admin/agent-setup/config', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTables();

      // Get agent configurations
      const agentsResult = await db.execute(sql`
        SELECT * FROM agent_setup_config ORDER BY agent_name
      `);

      // Get MCP mappings
      const mappingsResult = await db.execute(sql`
        SELECT agent_id, array_agg(mcp_server_id) as mcp_servers
        FROM agent_mcp_mappings
        GROUP BY agent_id
      `);

      // Get LLM strategies
      const strategiesResult = await db.execute(sql`
        SELECT * FROM agent_llm_strategies ORDER BY agent_id, task_type
      `);

      // Get cost settings
      const costResult = await db.execute(sql`
        SELECT * FROM llm_cost_settings WHERE id = 'singleton'
      `);

      // Format response
      const agents = agentsResult.rows.map((row: any) => ({
        id: row.agent_id,
        name: row.agent_name,
        description: row.description,
        enabled: row.enabled,
      }));

      const mcpMappings = mappingsResult.rows.map((row: any) => ({
        agentId: row.agent_id,
        mcpServers: row.mcp_servers || [],
      }));

      // Group strategies by agent
      const llmStrategiesMap = new Map<string, LLMPreference[]>();
      for (const row of strategiesResult.rows as any[]) {
        if (!llmStrategiesMap.has(row.agent_id)) {
          llmStrategiesMap.set(row.agent_id, []);
        }
        llmStrategiesMap.get(row.agent_id)!.push({
          taskType: row.task_type,
          primary: row.primary_model,
          fallback: JSON.parse(row.fallback_models),
        });
      }

      const llmStrategies = Array.from(llmStrategiesMap.entries()).map(([agentId, preferences]) => ({
        agentId,
        preferences,
      }));

      const costSettings = costResult.rows.length > 0
        ? {
            dailyBudget: parseFloat(costResult.rows[0].daily_budget_usd as string),
            monthlyBudget: parseFloat(costResult.rows[0].monthly_budget_usd as string),
            alertThreshold: costResult.rows[0].alert_threshold as number,
            downgradeOnLimit: costResult.rows[0].downgrade_on_limit as boolean,
          }
        : {
            dailyBudget: 50,
            monthlyBudget: 1000,
            alertThreshold: 80,
            downgradeOnLimit: true,
          };

      res.json({
        success: true,
        config: {
          agents,
          mcpMappings,
          llmStrategies,
          costSettings,
        },
      });
    } catch (error: any) {
      console.error('[AgentSetup] Error fetching configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agent-setup/mcp-mappings/:agentId
   * Get MCP servers assigned to specific agent
   */
  app.get('/api/admin/agent-setup/mcp-mappings/:agentId', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const { agentId } = req.params;

      const result = await db.execute(sql`
        SELECT mcp_server_id FROM agent_mcp_mappings WHERE agent_id = ${agentId}
      `);

      const mcpServers = result.rows.map((row: any) => row.mcp_server_id);

      res.json({
        success: true,
        agentId,
        mcpServers,
      });
    } catch (error: any) {
      console.error('[AgentSetup] Error fetching MCP mappings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch MCP mappings',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agent-setup/llm-strategy/:agentId
   * Get LLM strategy for specific agent
   */
  app.get('/api/admin/agent-setup/llm-strategy/:agentId', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const { agentId } = req.params;

      const result = await db.execute(sql`
        SELECT * FROM agent_llm_strategies WHERE agent_id = ${agentId}
      `);

      const preferences = result.rows.map((row: any) => ({
        taskType: row.task_type,
        primary: row.primary_model,
        fallback: JSON.parse(row.fallback_models),
        costTier: row.cost_tier,
        maxRetries: row.max_retries,
        timeout: row.timeout_ms,
      }));

      res.json({
        success: true,
        agentId,
        preferences,
      });
    } catch (error: any) {
      console.error('[AgentSetup] Error fetching LLM strategy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch LLM strategy',
        message: error.message,
      });
    }
  });

  /**
   * PATCH /api/admin/agent-setup/agent/:agentId/toggle
   * Toggle agent enabled/disabled
   */
  app.patch('/api/admin/agent-setup/agent/:agentId/toggle', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can toggle agents',
        });
      }

      await ensureTables();
      const { agentId } = req.params;

      const result = await db.execute(sql`
        UPDATE agent_setup_config
        SET enabled = NOT enabled, updated_at = NOW()
        WHERE agent_id = ${agentId}
        RETURNING enabled
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }

      const enabled = result.rows[0].enabled;

      console.log(`[AgentSetup] Agent ${agentId} ${enabled ? 'enabled' : 'disabled'}`);

      res.json({
        success: true,
        agentId,
        enabled,
      });
    } catch (error: any) {
      console.error('[AgentSetup] Error toggling agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle agent',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agent-setup/cost-settings
   * Get current cost settings
   */
  app.get('/api/admin/agent-setup/cost-settings', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTables();

      const result = await db.execute(sql`
        SELECT * FROM llm_cost_settings WHERE id = 'singleton'
      `);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          costSettings: {
            dailyBudget: 50,
            monthlyBudget: 1000,
            alertThreshold: 80,
            downgradeOnLimit: true,
          },
        });
      }

      const row = result.rows[0];
      res.json({
        success: true,
        costSettings: {
          dailyBudget: parseFloat(row.daily_budget_usd as string),
          monthlyBudget: parseFloat(row.monthly_budget_usd as string),
          alertThreshold: row.alert_threshold as number,
          downgradeOnLimit: row.downgrade_on_limit as boolean,
        },
      });
    } catch (error: any) {
      console.error('[AgentSetup] Error fetching cost settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cost settings',
        message: error.message,
      });
    }
  });

  console.log('[AgentSetup] Agent setup routes registered');
}
