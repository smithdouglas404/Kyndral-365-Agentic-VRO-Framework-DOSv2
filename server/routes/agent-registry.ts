/**
 * AGENT REGISTRY API
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * Agent definitions are managed through Palantir Ontology with
 * LLM-powered dynamic sync (no predefined actions required).
 */

import { Router } from "express";
import { getAgentRegistry } from "../services/AgentRegistryService.js";
import { getPalantirActionsService } from "../services/PalantirActionsService.js";
import { getPalantirService } from "../mcp/MCPServiceFactory.js";
import { getPalantirLLMBridge } from "../services/PalantirLLMBridge.js";
import { OntologyDataProvider } from "../services/OntologyDataProvider.js";

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
 * Sync all agents to Palantir using LLM Bridge (no predefined actions required)
 */
router.post("/sync-to-palantir", async (req, res) => {
  try {
    const registry = getAgentRegistry();
    const bridge = await getPalantirLLMBridge();

    const agentsToSync = await registry.prepareForPalantirSync();
    const results: any[] = [];

    for (const agent of agentsToSync) {
      try {
        // Use LLM Bridge for dynamic data ingestion - no predefined actions needed!
        const result = await bridge.ingestData({
          source: 'agent-registry',
          datasetName: 'agents',
          data: {
            agentId: agent.agentId,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            enabled: agent.enabled,
            capabilities: agent.capabilities,
            palantirObjectTypes: agent.palantirObjectTypes,
            palantirFunctions: agent.palantirFunctions,
            priority: agent.priority,
            metadata: agent.metadata,
            syncedAt: new Date().toISOString(),
          },
          tags: ['agent', 'registry', agent.category],
          metadata: {
            agentId: agent.agentId,
            syncSource: 'agent-registry-api',
          },
        });

        results.push({
          agentId: agent.agentId,
          success: result.success,
          datasetId: result.datasetId,
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
      message: `Synced ${successCount}/${agentsToSync.length} agents to Palantir via LLM Bridge`,
      results,
      syncedAt: new Date().toISOString(),
      method: 'llm-bridge', // No predefined actions required!
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
    const isOntologyReady = OntologyDataProvider.isReady();

    const agents = await registry.getAllAgents();

    // Check which agents exist in Palantir
    const status: any[] = [];
    for (const agent of agents) {
      try {
        if (isOntologyReady) {
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
        } else {
          // LLM Bridge mode - check local cache
          status.push({
            agentId: agent.id,
            name: agent.name,
            inPalantir: false,
            note: 'Using LLM Bridge (ontology not configured)',
          });
        }
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
      palantirConfigured: !!palantir,
      ontologyReady: isOntologyReady,
      llmBridgeActive: true, // LLM Bridge always available
      totalAgents: agents.length,
      syncedAgents: syncedCount,
      status,
      message: isOntologyReady
        ? 'Palantir Ontology active'
        : 'Using LLM Bridge - no predefined schemas required',
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
