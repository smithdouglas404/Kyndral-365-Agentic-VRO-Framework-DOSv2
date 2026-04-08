/**
 * OpenProject Webhook Handler
 *
 * Receives real-time events from OpenProject when work packages, projects,
 * time entries, or memberships change. Routes events to:
 * - Palantir sync (push to ontology)
 * - WebSocket broadcast (real-time UI update)
 * - Agent event bus (trigger re-analysis)
 *
 * Route: POST /api/webhooks/openproject/:endpointId
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getOPToPalantirSync } from '../services/sync/OpenProjectToPalantirSync.js';
import { broadcastNotification } from '../websocket.js';

const router = Router();

// ============================================================================
// HMAC signature verification
// ============================================================================

function verifyWebhookSignature(req: Request, secret: string): boolean {
  const signature = req.headers['x-op-signature'] as string;
  if (!signature || !secret) return true; // Skip if no secret configured

  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ============================================================================
// Event processing
// ============================================================================

interface OPWebhookEvent {
  action: string; // work_package:created, work_package:updated, project:updated, etc.
  work_package?: any;
  project?: any;
  time_entry?: any;
  membership?: any;
}

async function processEvent(event: OPWebhookEvent): Promise<void> {
  const { action } = event;
  console.log(`[OPWebhook] Processing event: ${action}`);

  // Deduplication: skip if this change was made by our system
  const syncSource = event.work_package?.customField_sync_source ||
                     event.work_package?._embedded?.customField_sync_source;
  if (syncSource === 'nextera-agent') {
    console.log(`[OPWebhook] Skipping agent-originated event for WP ${event.work_package?.id}`);
    return;
  }

  const sync = getOPToPalantirSync();

  switch (action) {
    case 'work_package:created':
    case 'work_package:updated': {
      const wpId = event.work_package?.id;
      if (wpId) {
        // Sync to Palantir
        await sync.syncSingleWorkPackage(wpId);

        // Broadcast to UI
        broadcastNotification({
          type: 'openproject:work_package',
          title: `Work Package ${action.split(':')[1]}`,
          message: event.work_package?.subject || `WP #${wpId}`,
          severity: 'info',
        });
      }
      break;
    }

    case 'project:created':
    case 'project:updated': {
      // Trigger a full project sync
      console.log(`[OPWebhook] Project ${action}: ${event.project?.name || event.project?.id}`);
      broadcastNotification({
        type: 'openproject:project',
        title: `Project ${action.split(':')[1]}`,
        message: event.project?.name || 'Unknown project',
        severity: 'info',
      });
      break;
    }

    case 'time_entry:created': {
      // Time entries affect EVM calculations — notify FinOps agent
      console.log(`[OPWebhook] Time entry created: ${event.time_entry?.id}`);
      broadcastNotification({
        type: 'openproject:time_entry',
        title: 'Time Entry Logged',
        message: `${event.time_entry?.hours || '?'} hours logged`,
        severity: 'info',
      });
      break;
    }

    case 'membership:created':
    case 'membership:updated': {
      // Membership changes affect resource capacity — notify PMO/Planning agents
      console.log(`[OPWebhook] Membership ${action}: ${event.membership?.id}`);
      break;
    }

    default:
      console.log(`[OPWebhook] Unhandled event type: ${action}`);
  }
}

// ============================================================================
// Route handler
// ============================================================================

router.post('/:endpointId', async (req: Request, res: Response) => {
  const { endpointId } = req.params;
  const webhookSecret = process.env.OPENPROJECT_WEBHOOK_SECRET || '';

  // Verify signature
  if (webhookSecret && !verifyWebhookSignature(req, webhookSecret)) {
    console.warn(`[OPWebhook] Invalid signature for endpoint ${endpointId}`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse event
  const event: OPWebhookEvent = req.body;
  if (!event.action) {
    return res.status(400).json({ error: 'Missing action field' });
  }

  // Acknowledge immediately, process async
  res.status(200).json({ received: true, action: event.action });

  // Process in background
  try {
    await processEvent(event);
  } catch (err: any) {
    console.error(`[OPWebhook] Error processing ${event.action}:`, err.message);
  }
});

// Health check for webhook endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'openproject-webhook-handler' });
});

export default router;
