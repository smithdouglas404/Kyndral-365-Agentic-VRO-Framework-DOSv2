/**
 * LANGFLOW ATTRIBUTE SYNC API ROUTES
 *
 * Bidirectional sync between agent attributes and Langflow flows
 */

import express from 'express';
import { getLangflowAttributeSync } from '../lib/LangflowAttributeSync.js';
import { isAgentType, type AgentType } from '../lib/AgentAttributeRegistry.js';

const router = express.Router();
const syncService = getLangflowAttributeSync();

/**
 * Webhook: Langflow → Database
 * Called by Langflow when attribute is calculated
 * POST /api/langflow-attribute-sync/from-flow
 */
router.post('/from-flow', async (req, res) => {
  try {
    const { agentType, entityId, attributeName, value, narrative, reasoning, sources, confidence } = req.body;

    if (!agentType || !entityId || !attributeName || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentType, entityId, attributeName, value'
      });
    }

    if (!isAgentType(agentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`
      });
    }

    console.log(`[AttributeSync] Webhook received: ${agentType}.${attributeName} for ${entityId}`);

    const success = await syncService.syncAttributeFromLangflow({
      agentType: agentType as AgentType,
      entityId,
      attributeName,
      value,
      narrative,
      reasoning,
      sources,
      confidence
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to sync attribute from Langflow'
      });
    }

    res.json({
      success: true,
      message: `Attribute ${attributeName} synced successfully`
    });
  } catch (error: any) {
    console.error('[AttributeSync] Webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manual Sync: Database → Langflow
 * Sync specific attribute to Langflow
 * POST /api/langflow-attribute-sync/to-flow
 */
router.post('/to-flow', async (req, res) => {
  try {
    const { agentType, attributeName, displayName, type, description, defaultThresholds } = req.body;

    if (!agentType || !attributeName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentType, attributeName'
      });
    }

    if (!isAgentType(agentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`
      });
    }

    const success = await syncService.syncAttributeToLangflow({
      agentType: agentType as AgentType,
      attributeName,
      displayName: displayName || attributeName,
      type: type || 'number',
      description: description || '',
      defaultThresholds
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to sync attribute to Langflow'
      });
    }

    res.json({
      success: true,
      message: `Attribute ${attributeName} synced to Langflow`
    });
  } catch (error: any) {
    console.error('[AttributeSync] Sync to flow error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Batch Sync: Sync all attributes for an agent
 * POST /api/langflow-attribute-sync/sync-agent/:agentType
 */
router.post('/sync-agent/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;

    if (!isAgentType(agentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`
      });
    }

    console.log(`[AttributeSync] Batch syncing all attributes for: ${agentType}`);

    const syncedCount = await syncService.syncAllAttributesForAgent(agentType as AgentType);

    res.json({
      success: true,
      agentType,
      syncedCount,
      message: `Synced ${syncedCount} attributes to Langflow`
    });
  } catch (error: any) {
    console.error('[AttributeSync] Batch sync error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get sync status
 * GET /api/langflow-attribute-sync/status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      enabled: true,
      endpoints: {
        fromFlow: 'POST /api/langflow-attribute-sync/from-flow',
        toFlow: 'POST /api/langflow-attribute-sync/to-flow',
        syncAgent: 'POST /api/langflow-attribute-sync/sync-agent/:agentType'
      },
      message: 'Langflow attribute sync is operational'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
