/**
 * AGENT REGISTRY API
 *
 * Single source of truth for agent definitions.
 * All clients should use these endpoints instead of hardcoded values.
 */

import { Router } from "express";
import { getAgentRegistry } from "../services/AgentRegistryService.js";
import { getPalantirActionsService } from "../services/PalantirActionsService.js";
import { getPalantirService } from "../mcp/MCPServiceFactory.js";

const router = Router();

// ============================================================================
// AGENT LIST ENDPOINTS
// ============================================================================

/**
 * GET /api/agent-registry
 * Get all registered agents
 */
router.get("/", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const agents = await registry.getAllAgents();

    res.json({
      success: true,
      agents,
      total: agents.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get agents:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/enabled
 * Get only enabled agents
 */
router.get("/enabled", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const agents = await registry.getEnabledAgents();

    res.json({
      success: true,
      agents,
      total: agents.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get enabled agents:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/ids
 * Get list of agent IDs (lightweight)
 */
router.get("/ids", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const { enabled } = req.query;

    const ids = enabled === "true"
      ? await registry.getEnabledAgentIds()
      : await registry.getAgentIds();

    res.json({
      success: true,
      agentIds: ids,
      total: ids.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get agent IDs:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/metadata
 * Get agent metadata for UI (icons, colors, names)
 */
router.get("/metadata", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const metadata = await registry.getAllAgentMetadata();

    res.json({
      success: true,
      agents: metadata,
      total: metadata.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get metadata:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/:agentId
 * Get specific agent by ID
 */
router.get("/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const registry = getAgentRegistry();
    const agent = await registry.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    res.json({
      success: true,
      agent,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get agent:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/:agentId/metadata
 * Get metadata for specific agent
 */
router.get("/:agentId/metadata", async (req, res) => {
  try {
    const { agentId } = req.params;
    const registry = getAgentRegistry();
    const metadata = await registry.getAgentMetadata(agentId);

    if (!metadata) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get agent metadata:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/:agentId/functions
 * Get Palantir functions for an agent
 */
router.get("/:agentId/functions", async (req, res) => {
  try {
    const { agentId } = req.params;
    const registry = getAgentRegistry();
    const functions = await registry.getAgentPalantirFunctions(agentId);

    res.json({
      success: true,
      agentId,
      functions,
      total: functions.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get agent functions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PALANTIR SYNC ENDPOINTS
// ============================================================================

/**
 * POST /api/agent-registry/sync-to-palantir
 * Sync all agents to Palantir Ontology
 */
router.post("/sync-to-palantir", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const actionsService = getPalantirActionsService();
    const palantir = getPalantirService();

    if (!palantir) {
      return res.status(503).json({ success: false, error: "Palantir not configured" });
    }

    const agentsToSync = await registry.prepareForPalantirSync();
    const results: any[] = [];

    for (const agent of agentsToSync) {
      try {
        // Create or update Agent object in Palantir
        const result = await actionsService.executeAction(
          "ri.actions..action.upsert-agent",
          {
            agentId: agent.agentId,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            enabled: agent.enabled,
            capabilities: JSON.stringify(agent.capabilities),
            palantirObjectTypes: JSON.stringify(agent.palantirObjectTypes),
            palantirFunctions: JSON.stringify(agent.palantirFunctions),
            priority: agent.priority,
            metadata: JSON.stringify(agent.metadata),
            syncedAt: new Date().toISOString(),
          }
        );

        results.push({
          agentId: agent.agentId,
          success: result.success,
          objectRid: result.objectRid,
        });
      } catch (error: any) {
        results.push({
          agentId: agent.agentId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    res.json({
      success: true,
      message: `Synced ${successCount}/${agentsToSync.length} agents to Palantir`,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Palantir sync failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-registry/palantir-status
 * Check Palantir sync status for agents
 */
router.get("/palantir-status", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const palantir = getPalantirService();

    if (!palantir) {
      return res.json({
        success: true,
        palantirConfigured: false,
        message: "Palantir not configured",
      });
    }

    const agents = await registry.getAllAgents();

    // Check which agents exist in Palantir
    const status: any[] = [];
    for (const agent of agents) {
      try {
        // Query Palantir for this agent via OntologyDataProvider
        const { OntologyDataProvider } = await import("../services/OntologyDataProvider.js");
        const palantirAgent = await OntologyDataProvider.query("Agent", {
          filters: [{ field: "agentId", operator: "eq", value: agent.id }],
          pageSize: 1,
        }).catch(() => ({ data: [] }));

        status.push({
          agentId: agent.id,
          name: agent.name,
          inPalantir: palantirAgent?.data?.length > 0,
          palantirRid: palantirAgent?.data?.[0]?.rid,
          lastSynced: palantirAgent?.data?.[0]?.syncedAt,
        });
      } catch (e) {
        status.push({
          agentId: agent.id,
          name: agent.name,
          inPalantir: false,
          error: "Query failed",
        });
      }
    }

    const syncedCount = status.filter((s) => s.inPalantir).length;

    res.json({
      success: true,
      palantirConfigured: true,
      totalAgents: agents.length,
      syncedAgents: syncedCount,
      status,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to check Palantir status:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-registry/reload
 * Reload agents from database (useful after changes)
 */
router.post("/reload", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    await registry.reload();

    const agents = await registry.getAllAgents();

    res.json({
      success: true,
      message: "Agent registry reloaded",
      agentCount: agents.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to reload:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// QUERY BY PALANTIR OBJECT TYPE
// ============================================================================

/**
 * GET /api/agent-registry/by-object-type/:objectType
 * Get agents that work with a specific Palantir object type
 */
router.get("/by-object-type/:objectType", async (req, res) => {
  try {
    const { objectType } = req.params;
    const registry = getAgentRegistry();
    const agents = await registry.getAgentsByObjectType(objectType);

    res.json({
      success: true,
      objectType,
      agents,
      total: agents.length,
    });
  } catch (error: any) {
    console.error("[AgentRegistry] Failed to get agents by object type:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
