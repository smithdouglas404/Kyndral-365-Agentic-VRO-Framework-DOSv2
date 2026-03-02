/**
 * ONTOLOGY SUBSCRIPTIONS API
 *
 * Real-time subscriptions to Palantir Ontology changes
 * Uses WebSocket to push changes to clients
 */

import { Router } from "express";
import { OntologyDataProvider } from "../services/OntologyDataProvider.js";
import { getPalantirService } from "../mcp/MCPServiceFactory.js";

const router = Router();

// In-memory subscription store (would use Redis in production)
const subscriptions: Map<string, {
  id: string;
  userId: string;
  objectType: string;
  filters?: any[];
  webhookUrl?: string;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}> = new Map();

// Event history for replay
const eventHistory: Array<{
  id: string;
  objectType: string;
  objectId: string;
  eventType: "created" | "updated" | "deleted";
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
}> = [];

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * GET /api/ontology-subscriptions
 * List all subscriptions for the current user
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId as string || "default-user";

    const userSubscriptions = Array.from(subscriptions.values())
      .filter(s => s.userId === userId);

    res.json({
      success: true,
      subscriptions: userSubscriptions,
      total: userSubscriptions.length,
    });
  } catch (error: any) {
    console.error("[Subscriptions] Failed to list:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ontology-subscriptions
 * Create a new subscription
 */
router.post("/", async (req, res) => {
  try {
    const { objectType, filters, webhookUrl, userId = "default-user" } = req.body;

    if (!objectType) {
      return res.status(400).json({ success: false, error: "objectType is required" });
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscription = {
      id: subscriptionId,
      userId,
      objectType,
      filters,
      webhookUrl,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };

    subscriptions.set(subscriptionId, subscription);

    // If Palantir supports native subscriptions, register there too
    const palantir = getPalantirService();
    if (palantir?.createSubscription) {
      try {
        await palantir.createSubscription({
          objectType,
          filters,
          callbackUrl: webhookUrl || `/api/ontology-subscriptions/${subscriptionId}/callback`,
        });
      } catch (e) {
        console.warn("[Subscriptions] Native subscription not supported:", e);
      }
    }

    res.json({
      success: true,
      subscription,
      message: `Subscribed to ${objectType} changes`,
    });
  } catch (error: any) {
    console.error("[Subscriptions] Failed to create:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/ontology-subscriptions/:subscriptionId
 * Delete a subscription
 */
router.delete("/:subscriptionId", async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptions.has(subscriptionId)) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    subscriptions.delete(subscriptionId);

    res.json({
      success: true,
      message: "Subscription deleted",
      subscriptionId,
    });
  } catch (error: any) {
    console.error("[Subscriptions] Failed to delete:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// EVENT STREAM
// ============================================================================

/**
 * GET /api/ontology-subscriptions/events
 * Get recent events (for polling fallback)
 */
router.get("/events", async (req, res) => {
  try {
    const { since, objectType, limit = 50 } = req.query;

    let events = [...eventHistory];

    if (since) {
      const sinceDate = new Date(since as string);
      events = events.filter(e => new Date(e.timestamp) > sinceDate);
    }

    if (objectType) {
      events = events.filter(e => e.objectType === objectType);
    }

    events = events.slice(-Number(limit));

    res.json({
      success: true,
      events,
      total: events.length,
      latestTimestamp: events.length > 0 ? events[events.length - 1].timestamp : null,
    });
  } catch (error: any) {
    console.error("[Subscriptions] Failed to get events:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ontology-subscriptions/stream
 * Server-Sent Events stream for real-time updates
 */
router.get("/stream", async (req, res) => {
  const { objectTypes, userId = "default-user" } = req.query;

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  // Filter function for events
  const typeFilter = objectTypes ? (objectTypes as string).split(",") : null;
  const shouldSend = (event: any) => {
    if (!typeFilter) return true;
    return typeFilter.includes(event.objectType);
  };

  // Poll for new events (in production, use Palantir webhooks or native subscriptions)
  let lastEventId = eventHistory.length;

  const pollInterval = setInterval(() => {
    const newEvents = eventHistory.slice(lastEventId);
    lastEventId = eventHistory.length;

    for (const event of newEvents) {
      if (shouldSend(event)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    }
  }, 1000);

  // Keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Clean up on close
  req.on("close", () => {
    clearInterval(pollInterval);
    clearInterval(heartbeat);
  });
});

// ============================================================================
// CALLBACK (for Palantir webhooks)
// ============================================================================

/**
 * POST /api/ontology-subscriptions/:subscriptionId/callback
 * Webhook callback from Palantir
 */
router.post("/:subscriptionId/callback", async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const event = req.body;

    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    // Record event
    const eventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      objectType: event.objectType || subscription.objectType,
      objectId: event.objectId,
      eventType: event.eventType || "updated",
      changes: event.changes,
      timestamp: new Date().toISOString(),
    };

    eventHistory.push(eventRecord);

    // Keep history bounded
    while (eventHistory.length > 1000) {
      eventHistory.shift();
    }

    // Update subscription stats
    subscription.lastTriggered = eventRecord.timestamp;
    subscription.triggerCount++;

    res.json({
      success: true,
      eventId: eventRecord.id,
      message: "Event recorded",
    });
  } catch (error: any) {
    console.error("[Subscriptions] Callback failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SIMULATE EVENTS (for testing)
// ============================================================================

/**
 * POST /api/ontology-subscriptions/simulate
 * Simulate an ontology change event (for testing)
 */
router.post("/simulate", async (req, res) => {
  try {
    const { objectType, objectId, eventType, changes } = req.body;

    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      objectType,
      objectId: objectId || `${objectType.toLowerCase()}_${Date.now()}`,
      eventType: eventType || "updated",
      changes,
      timestamp: new Date().toISOString(),
    };

    eventHistory.push(event);

    res.json({
      success: true,
      event,
      message: "Event simulated",
    });
  } catch (error: any) {
    console.error("[Subscriptions] Simulation failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * GET /api/ontology-subscriptions/stats
 * Get subscription statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const allSubs = Array.from(subscriptions.values());

    const byObjectType = allSubs.reduce((acc: Record<string, number>, s) => {
      acc[s.objectType] = (acc[s.objectType] || 0) + 1;
      return acc;
    }, {});

    const totalTriggers = allSubs.reduce((sum, s) => sum + s.triggerCount, 0);

    res.json({
      success: true,
      stats: {
        totalSubscriptions: allSubs.length,
        byObjectType,
        totalTriggers,
        eventHistorySize: eventHistory.length,
        oldestEvent: eventHistory[0]?.timestamp,
        newestEvent: eventHistory[eventHistory.length - 1]?.timestamp,
      },
    });
  } catch (error: any) {
    console.error("[Subscriptions] Stats failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
