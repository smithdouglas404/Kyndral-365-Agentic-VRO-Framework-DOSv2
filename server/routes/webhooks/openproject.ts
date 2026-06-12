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
import { getOPToPalantirSync } from '../../services/sync/OpenProjectToPalantirSync.js';
import { broadcastNotification } from '../../websocket.js';
import { getEventDrivenOrchestrator, type ChangeEvent } from '../../lib/EventDrivenOrchestrator.js';

const router = Router();

/**
 * Register a change with the EventDrivenOrchestrator so the relevant agents
 * fire on this OpenProject event. Never throws - webhook processing
 * (Palantir sync, UI broadcast) must keep working even if this fails.
 */
function notifyEventOrchestrator(
  type: ChangeEvent['type'],
  projectId: string | number | undefined,
  field: string | undefined,
  newValue: any,
  severity: ChangeEvent['severity'] = 'medium'
): void {
  if (projectId === undefined || projectId === null) return;
  try {
    const orchestrator = getEventDrivenOrchestrator();
    orchestrator?.registerChange({
      type,
      projectId: String(projectId),
      field,
      newValue,
      severity,
      timestamp: new Date(),
      source: 'openproject_webhook',
    });
  } catch (err: any) {
    console.warn('[OPWebhook] Failed to register change event:', err?.message);
  }
}

/** Extract the OpenProject project id from a webhook payload entity */
function extractProjectId(entity: any): string | undefined {
  if (!entity) return undefined;
  const direct = entity.project?.id ?? entity.project_id;
  if (direct !== undefined && direct !== null) return String(direct);
  const href: string | undefined = entity._links?.project?.href;
  if (href) {
    const id = href.split('/').filter(Boolean).pop();
    if (id) return id;
  }
  return undefined;
}

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

        // EVENT-DRIVEN: work package change → trigger relevant agents
        notifyEventOrchestrator(
          'project_update',
          extractProjectId(event.work_package),
          `work_package:${wpId}`,
          event.work_package?.subject,
          'medium'
        );

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

      // EVENT-DRIVEN: project create/update → trigger relevant agents
      notifyEventOrchestrator(
        'project_update',
        event.project?.id,
        action,
        event.project?.name,
        'medium'
      );

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

      // EVENT-DRIVEN: time entry affects cost/EVM → budget_change (FinOps + Risk)
      notifyEventOrchestrator(
        'budget_change',
        extractProjectId(event.time_entry),
        `time_entry:${event.time_entry?.id}`,
        event.time_entry?.hours,
        'low'
      );

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

      // EVENT-DRIVEN: membership change → resource_change (OCM + PMO)
      notifyEventOrchestrator(
        'resource_change',
        extractProjectId(event.membership),
        `membership:${event.membership?.id}`,
        action,
        'low'
      );
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
