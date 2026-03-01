/**
 * LLM Configuration API Routes
 *
 * Endpoints for managing LLM router configuration, model selection, and usage analytics
 */

import { Router, type Request, type Response } from "express";
import { getLLMRouter, initLLMRouter, type LLMConfig } from "../lib/LLMRouter.js";
import type { IStorage } from "../storage.js";

export function createLLMConfigRoutes(storage: IStorage): Router {
  const router = Router();

  // Initialize LLM Router
  initLLMRouter(storage);
  const llmRouter = getLLMRouter();

  /**
   * GET /api/llm-config
   * Get current default LLM configuration
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const config = llmRouter.getDefaultConfig();
      res.json({ success: true, config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/llm-config
   * Update default LLM configuration
   */
  router.put("/", async (req: Request, res: Response) => {
    try {
      const updates: Partial<LLMConfig> = req.body;
      await llmRouter.updateDefaultConfig(updates);

      // Clear cache to force new instances with updated config
      llmRouter.clearCache();

      res.json({
        success: true,
        message: "LLM configuration updated successfully",
        config: llmRouter.getDefaultConfig()
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/llm-config/models
   * List all available models with capabilities
   */
  router.get("/models", async (req: Request, res: Response) => {
    try {
      const models = llmRouter.listAvailableModels();
      res.json({ success: true, models });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/llm-config/metrics
   * Get usage metrics for all models
   */
  router.get("/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = llmRouter.getAllMetrics();
      const metricsArray = Array.from(metrics.entries()).map(([key, value]) => {
        const [provider, model] = key.split(":");
        return { provider, model, ...value };
      });

      res.json({ success: true, metrics: metricsArray });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/llm-config/metrics/:provider/:model
   * Get usage metrics for a specific model
   */
  router.get("/metrics/:provider/:model", async (req: Request, res: Response) => {
    try {
      const { provider, model } = req.params;
      const metrics = llmRouter.getMetrics(provider as any, model);

      if (!metrics) {
        return res.status(404).json({
          success: false,
          error: "No metrics found for this model"
        });
      }

      res.json({ success: true, metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/llm-config/recommend
   * Get model recommendation based on requirements
   */
  router.post("/recommend", async (req: Request, res: Response) => {
    try {
      const requirements = req.body;
      const recommendation = llmRouter.recommendModel(requirements);

      res.json({ success: true, recommendation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/llm-config/analytics
   * Get aggregated usage analytics from database
   */
  router.get("/analytics", async (req: Request, res: Response) => {
    try {
      const { timeRange = "7d" } = req.query;

      let dateFilter = "";
      if (timeRange === "24h") {
        dateFilter = "created_at >= NOW() - INTERVAL '24 hours'";
      } else if (timeRange === "7d") {
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
      } else if (timeRange === "30d") {
        dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
      } else {
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
      }

      const result = await storage.db.query(`
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
        WHERE ${dateFilter}
        GROUP BY provider, model
        ORDER BY total_calls DESC
      `);

      res.json({ success: true, analytics: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/llm-config/agent/:agentName
   * Get LLM configuration for a specific agent
   */
  router.get("/agent/:agentName", async (req: Request, res: Response) => {
    try {
      const { agentName } = req.params;

      const result = await storage.db.query(`
        SELECT * FROM agent_llm_config WHERE agent_name = $1
      `, [agentName]);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          config: null,
          message: "Using default LLM configuration"
        });
      }

      res.json({ success: true, config: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/llm-config/agent/:agentName
   * Set LLM configuration for a specific agent
   */
  router.put("/agent/:agentName", async (req: Request, res: Response) => {
    try {
      const { agentName } = req.params;
      const { provider, model, temperature, max_tokens, fallback_provider, fallback_model, config } = req.body;

      const id = `agent-llm-${agentName}`;

      await storage.db.query(`
        INSERT INTO agent_llm_config
        (id, agent_name, provider, model, temperature, max_tokens, fallback_provider, fallback_model, config, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (agent_name)
        DO UPDATE SET
          provider = $3,
          model = $4,
          temperature = $5,
          max_tokens = $6,
          fallback_provider = $7,
          fallback_model = $8,
          config = $9,
          updated_at = NOW()
      `, [
        id,
        agentName,
        provider,
        model,
        temperature || 0.7,
        max_tokens || 4096,
        fallback_provider || null,
        fallback_model || null,
        config ? JSON.stringify(config) : null
      ]);

      res.json({
        success: true,
        message: `LLM configuration updated for agent: ${agentName}`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/llm-config/agent/:agentName
   * Remove agent-specific LLM configuration (revert to default)
   */
  router.delete("/agent/:agentName", async (req: Request, res: Response) => {
    try {
      const { agentName } = req.params;

      await storage.db.query(`
        DELETE FROM agent_llm_config WHERE agent_name = $1
      `, [agentName]);

      res.json({
        success: true,
        message: `Agent ${agentName} will now use default LLM configuration`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/llm-config/test
   * Test LLM configuration with a simple query
   */
  router.post("/test", async (req: Request, res: Response) => {
    try {
      const config: Partial<LLMConfig> = req.body;

      const startTime = Date.now();

      const response = await llmRouter.chat(
        "You are a helpful assistant.",
        "Say 'Hello, I am working correctly!' and nothing else.",
        config
      );

      const latency = Date.now() - startTime;

      res.json({
        success: true,
        response,
        latency,
        message: "LLM configuration test successful"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: "LLM configuration test failed"
      });
    }
  });

  return router;
}
