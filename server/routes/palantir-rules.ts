/**
 * PALANTIR RULES ENGINE API
 *
 * Manages business rules as Palantir Functions
 * Replaces Rulebricks with native Palantir capabilities
 */

import { Router } from "express";
import { OntologyDataProvider } from "../services/OntologyDataProvider.js";
import { getPalantirActionsService } from "../services/PalantirActionsService.js";
import { getPalantirService } from "../mcp/MCPServiceFactory.js";

const router = Router();

// ============================================================================
// RULE DEFINITIONS
// ============================================================================

/**
 * GET /api/palantir-rules/functions
 * List all Palantir Functions (business rules)
 */
router.get("/functions", async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      return res.status(503).json({ success: false, error: "Palantir not configured" });
    }

    // Query Palantir for available functions
    const functions = await palantir.listFunctions?.() || [];

    // Also get from our ontology if stored there
    const storedRules = await OntologyDataProvider.query("BusinessRule", {
      pageSize: 100,
      orderBy: [{ field: "name", direction: "asc" }],
    }).catch(() => ({ data: [] }));

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
      storedRules: storedRules.data,
      total: functions.length,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to list functions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/palantir-rules/functions/:functionId
 * Get details of a specific function
 */
router.get("/functions/:functionId", async (req, res) => {
  try {
    const { functionId } = req.params;
    const palantir = getPalantirService();

    if (!palantir) {
      return res.status(503).json({ success: false, error: "Palantir not configured" });
    }

    const func = await palantir.getFunction?.(functionId);

    res.json({
      success: true,
      function: func,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to get function:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/functions/:functionId/execute
 * Execute a Palantir Function with parameters
 */
router.post("/functions/:functionId/execute", async (req, res) => {
  try {
    const { functionId } = req.params;
    const { parameters, context } = req.body;
    const palantir = getPalantirService();

    if (!palantir) {
      return res.status(503).json({ success: false, error: "Palantir not configured" });
    }

    const startTime = Date.now();
    const result = await palantir.executeFunction?.(functionId, parameters);
    const executionTime = Date.now() - startTime;

    // Log execution
    await OntologyDataProvider.query("RuleExecution", {
      filters: [{ field: "functionId", operator: "eq", value: "log" }],
    }).catch(() => null);

    res.json({
      success: true,
      functionId,
      result,
      executionTime,
      executedAt: new Date().toISOString(),
      context,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Function execution failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/test
 * Test a rule against sample data without saving
 */
router.post("/test", async (req, res) => {
  try {
    const { functionId, testData } = req.body;
    const palantir = getPalantirService();

    if (!palantir) {
      return res.status(503).json({ success: false, error: "Palantir not configured" });
    }

    const startTime = Date.now();
    const result = await palantir.executeFunction?.(functionId, testData);
    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      testResult: result,
      executionTime,
      input: testData,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Test execution failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RULE MAPPINGS (Agent -> Rule associations)
// ============================================================================

/**
 * GET /api/palantir-rules/mappings
 * List all agent-to-rule mappings
 */
router.get("/mappings", async (req, res) => {
  try {
    const { agentId } = req.query;

    const filters: any[] = [];
    if (agentId) filters.push({ field: "agentId", operator: "eq", value: agentId });

    const result = await OntologyDataProvider.query("RuleMapping", {
      filters,
      pageSize: 100,
    }).catch(() => ({ data: [] }));

    res.json({
      success: true,
      mappings: result.data,
      total: result.data.length,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to list mappings:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/mappings
 * Create a new agent-to-rule mapping
 */
router.post("/mappings", async (req, res) => {
  try {
    const { agentId, functionId, triggerCondition, priority, enabled } = req.body;

    const actionsService = getPalantirActionsService();
    const result = await actionsService.executeAction("ri.actions..action.create-rule-mapping", {
      agentId,
      functionId,
      triggerCondition,
      priority: priority || 5,
      enabled: enabled ?? true,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: result.success,
      mappingId: result.objectRid,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to create mapping:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// THRESHOLDS
// ============================================================================

/**
 * GET /api/palantir-rules/thresholds
 * List all threshold definitions
 */
router.get("/thresholds", async (req, res) => {
  try {
    const { category, agentId } = req.query;

    const filters: any[] = [];
    if (category) filters.push({ field: "category", operator: "eq", value: category });
    if (agentId) filters.push({ field: "agentId", operator: "eq", value: agentId });

    const result = await OntologyDataProvider.query("Threshold", {
      filters,
      pageSize: 100,
      orderBy: [{ field: "name", direction: "asc" }],
    }).catch(() => ({ data: [] }));

    res.json({
      success: true,
      thresholds: result.data,
      total: result.data.length,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to list thresholds:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/palantir-rules/thresholds
 * Create or update a threshold
 */
router.post("/thresholds", async (req, res) => {
  try {
    const { name, category, agentId, warningValue, criticalValue, operator, unit, description } = req.body;

    const actionsService = getPalantirActionsService();
    const result = await actionsService.executeAction("ri.actions..action.upsert-threshold", {
      name,
      category,
      agentId,
      warningValue,
      criticalValue,
      operator: operator || "gt", // gt, lt, eq, gte, lte
      unit,
      description,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: result.success,
      thresholdId: result.objectRid,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to upsert threshold:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// EXECUTION HISTORY
// ============================================================================

/**
 * GET /api/palantir-rules/executions
 * Get rule execution history
 */
router.get("/executions", async (req, res) => {
  try {
    const { functionId, agentId, status, limit = 50 } = req.query;

    const filters: any[] = [];
    if (functionId) filters.push({ field: "functionId", operator: "eq", value: functionId });
    if (agentId) filters.push({ field: "agentId", operator: "eq", value: agentId });
    if (status) filters.push({ field: "status", operator: "eq", value: status });

    const result = await OntologyDataProvider.query("RuleExecution", {
      filters,
      pageSize: Number(limit),
      orderBy: [{ field: "executedAt", direction: "desc" }],
    }).catch(() => ({ data: [] }));

    res.json({
      success: true,
      executions: result.data,
      total: result.data.length,
    });
  } catch (error: any) {
    console.error("[PalantirRules] Failed to list executions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
