/**
 * A2A API ENDPOINTS
 *
 * Exposes Agent-to-Agent messaging operations to Langflow flows.
 * Allows flows to send messages between agents using the A2A bus.
 */

import express from 'express';
import type { AgentMessage } from '../agents/ContinuousOrchestrator.js';

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

export default router;
