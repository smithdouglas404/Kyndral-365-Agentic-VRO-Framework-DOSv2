/**
 * A2A API ENDPOINTS
 *
 * Exposes Agent-to-Agent messaging operations to Langflow flows.
 * Allows flows to send messages between agents using the A2A bus.
 *
 * PALANTIR INTEGRATION:
 * Critical messages (alerts, approvals, high/critical severity) are synced
 * to Palantir for audit trail and dashboard visibility.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { AgentMessage } from '../agents/ContinuousOrchestrator.js';
import { getPalantirMemoryBridge, type A2AMessage } from '../services/PalantirMemoryBridge.js';

const router = express.Router();

// Get A2A bus from orchestrator (injected by routes.ts)
let a2aBusGetter: (() => any) | null = null;

export function setA2ABusGetter(getter: () => any) {
  a2aBusGetter = getter;
}

/**
 * Send A2A message between agents
 * POST /api/a2a/send
 *
 * Body: {
 *   from: "finops",
 *   to: "tmo",
 *   type: "request",
 *   content: "Budget overrun detected - check schedule impact",
 *   projectId: "project_123",
 *   severity: "high"
 * }
 */
router.post('/send', async (req, res) => {
  try {
    if (!a2aBusGetter) {
      return res.status(503).json({
        success: false,
        error: 'A2A bus not initialized'
      });
    }

    const { from, to, type, content, projectId, severity, requiresApproval } = req.body;

    if (!from || !to || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, to, type, content'
      });
    }

    const validTypes = ['scan', 'detection', 'request', 'alert', 'response', 'action', 'celebration', 'communication'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const message: AgentMessage = {
      from,
      to,
      type: type as any,
      content,
      projectId,
      severity: severity as any,
      requiresApproval
    };

    const a2aBus = a2aBusGetter();
    await a2aBus.send(message);

    console.log(`[A2AAPI] Message sent: ${from} → ${to} (${type})`);

    // SYNC TO PALANTIR: Critical messages for audit trail and dashboard visibility
    const shouldSyncToPalantir =
      requiresApproval ||
      severity === 'high' ||
      severity === 'critical' ||
      type === 'alert' ||
      type === 'action';

    if (shouldSyncToPalantir) {
      const bridge = getPalantirMemoryBridge();
      const a2aMessage: A2AMessage = {
        id: uuidv4(),
        fromAgentId: from,
        toAgentId: to,
        type: type as any,
        content,
        severity: severity as any,
        requiresApproval,
        timestamp: new Date(),
      };
      bridge.syncA2AMessage(a2aMessage).catch(err => {
        console.error('[A2AAPI] Failed to sync to Palantir:', err.message);
      });
    }

    res.json({
      success: true,
      message: {
        from,
        to,
        type,
        content,
        projectId,
        severity
      }
    });
  } catch (error: any) {
    console.error('[A2AAPI] Error sending message:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Broadcast message to multiple agents
 * POST /api/a2a/broadcast
 *
 * Body: {
 *   from: "risk",
 *   recipients: ["pmo", "vro", "governance"],
 *   type: "alert",
 *   content: "Critical risk detected",
 *   projectId: "project_123",
 *   severity: "critical"
 * }
 */
router.post('/broadcast', async (req, res) => {
  try {
    if (!a2aBusGetter) {
      return res.status(503).json({
        success: false,
        error: 'A2A bus not initialized'
      });
    }

    const { from, recipients, type, content, projectId, severity } = req.body;

    if (!from || !recipients || !Array.isArray(recipients) || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, recipients (array), type, content'
      });
    }

    const message: Omit<AgentMessage, 'to'> = {
      from,
      type: type as any,
      content,
      projectId,
      severity: severity as any
    };

    const a2aBus = a2aBusGetter();
    await a2aBus.broadcast(message, recipients);

    console.log(`[A2AAPI] Broadcast: ${from} → ${recipients.join(', ')} (${type})`);

    // SYNC TO PALANTIR: Broadcasts are typically important - sync critical ones
    const shouldSyncToPalantir =
      severity === 'high' ||
      severity === 'critical' ||
      type === 'alert' ||
      type === 'action';

    if (shouldSyncToPalantir) {
      const bridge = getPalantirMemoryBridge();
      // Sync as a single broadcast message
      const a2aMessage: A2AMessage = {
        id: uuidv4(),
        fromAgentId: from,
        toAgentId: `broadcast:${recipients.join(',')}`,
        type: type as any,
        content,
        severity: severity as any,
        requiresApproval: false,
        timestamp: new Date(),
      };
      bridge.syncA2AMessage(a2aMessage).catch(err => {
        console.error('[A2AAPI] Failed to sync broadcast to Palantir:', err.message);
      });
    }

    res.json({
      success: true,
      broadcast: {
        from,
        recipients,
        type,
        content,
        projectId,
        severity
      }
    });
  } catch (error: any) {
    console.error('[A2AAPI] Error broadcasting:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get A2A bus status
 * GET /api/a2a/status
 */
router.get('/status', async (req, res) => {
  try {
    if (!a2aBusGetter) {
      return res.status(503).json({
        success: false,
        error: 'A2A bus not initialized'
      });
    }

    const a2aBus = a2aBusGetter();
    const status = a2aBus.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    console.error('[A2AAPI] Error getting status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Palantir Memory Bridge sync status
 * GET /api/a2a/palantir-sync-status
 */
router.get('/palantir-sync-status', async (req, res) => {
  try {
    const bridge = getPalantirMemoryBridge();
    const status = bridge.getStatus();

    res.json({
      success: true,
      syncStatus: status
    });
  } catch (error: any) {
    console.error('[A2AAPI] Error getting Palantir sync status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Force flush pending Palantir syncs
 * POST /api/a2a/palantir-sync-flush
 */
router.post('/palantir-sync-flush', async (req, res) => {
  try {
    const bridge = getPalantirMemoryBridge();
    await bridge.flush();

    res.json({
      success: true,
      message: 'Palantir sync queue flushed'
    });
  } catch (error: any) {
    console.error('[A2AAPI] Error flushing Palantir sync:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
