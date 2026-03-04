/**
 * PALANTIR RULES ENGINE API
 *
 * LLM-POWERED RULES ENGINE - No predefined schemas required!
 *
 * This is the "interface layer on top of Palantir" that uses LLM reasoning
 * to evaluate business rules dynamically. No more "ActionTypeNotFound" errors.
 *
 * Features:
 * - Natural language rule definitions
 * - LLM-based rule evaluation
 * - Dynamic data ingestion from any source
 * - Semantic querying without schema definitions
 * - Agent-driven widget updates
 */

import { Router } from "express";
import { getPalantirLLMBridge } from "../services/PalantirLLMBridge.js";
import { getPalantirService } from "../mcp/MCPServiceFactory.js";

const router = Router();

// ============================================================================
// SEMANTIC QUERIES - Natural Language Data Access
// ============================================================================

/**
 * POST /api/palantir-rules/query
 * Execute a natural language query over Palantir data
 *
 * This is how we handle "foreign data" - you can query anything
 * without needing predefined object types.
 */
router.post("/query", async (req, res) => {
  try {
    const { query, context, objectTypes, maxResults } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const bridge = await getPalantirLLMBridge();
    const result = await bridge.semanticQuery({
      naturalLanguage: query,
      context,
      objectTypes,
      maxResults,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Semantic query failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LLM-POWERED RULE EVALUATION
// ============================================================================

/**
 * POST /api/palantir-rules/evaluate
 * Evaluate a natural language rule against data using LLM reasoning
 *
 * Example rule: "If project budget exceeds 90% and risk level is high,
 * escalate to PMO and reduce non-critical spend"
 */
router.post("/evaluate", async (req, res) => {
  try {
    const { rule, context, data } = req.body;

    if (!rule) {
      return res.status(400).json({ success: false, error: "Rule is required" });
    }

    const bridge = await getPalantirLLMBridge();
    const result = await bridge.evaluateRule({
      rule,
      context: context || {},
      data: data || {},
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Rule evaluation failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/batch-evaluate
 * Evaluate multiple rules in batch
 */
router.post("/batch-evaluate", async (req, res) => {
  try {
    const { rules, context, data } = req.body;

    if (!Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ success: false, error: "Rules array is required" });
    }

    const bridge = await getPalantirLLMBridge();
    const results = await Promise.all(
      rules.map((rule: string) =>
        bridge.evaluateRule({
          rule,
          context: context || {},
          data: data || {},
        })
      )
    );

    const summary = {
      total: results.length,
      triggered: results.filter(r => r.triggered).length,
      avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
    };

    res.json({
      success: true,
      results,
      summary,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Batch evaluation failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DYNAMIC DATA INGESTION - No Predefined Schemas!
// ============================================================================

/**
 * POST /api/palantir-rules/ingest
 * Ingest data from any source without predefined schemas
 *
 * This solves the "what happens when we ingest weather data" problem.
 * The LLM infers the schema automatically.
 */
router.post("/ingest", async (req, res) => {
  try {
    const { source, datasetName, data, schema, tags, metadata } = req.body;

    if (!source || !datasetName || !data) {
      return res.status(400).json({
        success: false,
        error: "source, datasetName, and data are required",
      });
    }

    const bridge = await getPalantirLLMBridge();
    const result = await bridge.ingestData({
      source,
      datasetName,
      data,
      schema, // optional - will be inferred if not provided
      tags,
      metadata,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[PalantirRules] Data ingestion failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/connect-external
 * Connect to an external data source (weather, APIs, databases, etc.)
 */
router.post("/connect-external", async (req, res) => {
  try {
    const { sourceName, sourceType, config } = req.body;

    if (!sourceName || !sourceType) {
      return res.status(400).json({
        success: false,
        error: "sourceName and sourceType are required",
      });
    }

    const validTypes = ['weather', 'api', 'webhook', 'file', 'database'];
    if (!validTypes.includes(sourceType)) {
      return res.status(400).json({
        success: false,
        error: `sourceType must be one of: ${validTypes.join(', ')}`,
      });
    }

    const bridge = await getPalantirLLMBridge();
    const result = await bridge.connectExternalSource(sourceName, sourceType, config || {});

    res.json({
      success: result.connected,
      ...result,
    });
  } catch (error: any) {
    console.error("[PalantirRules] External connection failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AGENT WIDGET UPDATES
// ============================================================================

/**
 * POST /api/palantir-rules/agent/:agentId/update
 * Allow agents to update their own widgets/dashboards
 */
router.post("/agent/:agentId/update", async (req, res) => {
  try {
    const { agentId } = req.params;
    const { updateType, data } = req.body;

    if (!updateType || !data) {
      return res.status(400).json({
        success: false,
        error: "updateType and data are required",
      });
    }

    const validTypes = ['widget', 'metric', 'insight', 'alert'];
    if (!validTypes.includes(updateType)) {
      return res.status(400).json({
        success: false,
        error: `updateType must be one of: ${validTypes.join(', ')}`,
      });
    }

    const bridge = await getPalantirLLMBridge();
    const result = await bridge.agentUpdateData(agentId, updateType, data);

    res.json(result);
  } catch (error: any) {
    console.error("[PalantirRules] Agent update failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LEGACY PALANTIR FUNCTIONS (kept for backward compatibility)
// ============================================================================

/**
 * GET /api/palantir-rules/functions
 * List available Palantir Functions (if ontology is configured)
 */
router.get("/functions", async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      // Return LLM-based capabilities instead
      return res.json({
        success: true,
        functions: [],
        llmCapabilities: [
          {
            name: 'semantic-query',
            description: 'Natural language queries over any data',
            endpoint: '/api/palantir-rules/query',
          },
          {
            name: 'rule-evaluation',
            description: 'LLM-powered business rule evaluation',
            endpoint: '/api/palantir-rules/evaluate',
          },
          {
            name: 'dynamic-ingestion',
            description: 'Ingest data without predefined schemas',
            endpoint: '/api/palantir-rules/ingest',
          },
          {
            name: 'external-connect',
            description: 'Connect to external data sources',
            endpoint: '/api/palantir-rules/connect-external',
          },
        ],
        message: 'Using LLM-powered rules engine - no predefined functions required',
        total: 4,
      });
    }

    // Try to list Palantir functions
    const functions = await (palantir as any).listFunctions?.() || [];

    res.json({
      success: true,
      functions: functions.map((f: any) => ({
        rid: f.rid,
        apiName: f.apiName,
        displayName: f.displayName || f.apiName,
        description: f.description,
        parameters: f.parameters || [],
        returnType: f.returnType,
        category: f.category || "general",
      })),
      total: functions.length,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to list functions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/functions/:functionId/execute
 * Execute a Palantir Function (legacy) or use LLM evaluation
 */
router.post("/functions/:functionId/execute", async (req, res) => {
  try {
    const { functionId } = req.params;
    const { parameters, context } = req.body;
    const palantir = getPalantirService();

    const startTime = Date.now();

    // If Palantir is configured and function exists, use it
    if (palantir) {
      try {
        const result = await (palantir as any).executeFunction?.(functionId, parameters);
        if (result) {
          return res.json({
            success: true,
            functionId,
            result,
            executionTime: Date.now() - startTime,
            executedAt: new Date().toISOString(),
            context,
            source: 'palantir',
          });
        }
      } catch {
        // Fall through to LLM evaluation
      }
    }

    // Use LLM-based evaluation as fallback
    const bridge = await getPalantirLLMBridge();
    const result = await bridge.evaluateRule({
      rule: `Execute function ${functionId} with given parameters`,
      context: context || {},
      data: parameters || {},
    });

    res.json({
      success: true,
      functionId,
      result,
      executionTime: Date.now() - startTime,
      executedAt: new Date().toISOString(),
      context,
      source: 'llm',
    });
  } catch (error: any) {
    console.error("[PalantirRules] Function execution failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATUS AND HEALTH
// ============================================================================

/**
 * GET /api/palantir-rules/status
 * Get status of the rules engine
 */
router.get("/status", async (req, res) => {
  try {
    const palantir = getPalantirService();
    const bridge = await getPalantirLLMBridge();

    res.json({
      success: true,
      status: 'operational',
      palantirConnected: !!palantir,
      llmBridgeActive: true,
      capabilities: {
        semanticQueries: true,
        llmRuleEvaluation: true,
        dynamicIngestion: true,
        externalConnections: true,
        agentUpdates: true,
        legacyFunctions: !!palantir,
      },
      message: palantir
        ? 'Full Palantir + LLM capabilities available'
        : 'LLM-powered rules engine active (Palantir ontology not required)',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
