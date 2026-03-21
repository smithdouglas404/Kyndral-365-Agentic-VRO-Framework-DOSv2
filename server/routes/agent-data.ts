/**
 * AGENT DATA ENDPOINT
 *
 * This endpoint allows external agents to push real-time data to the UI.
 * Data is broadcast via WebSocket to all connected clients for live updates.
 *
 * Usage:
 *   POST /api/agent/push
 *   {
 *     "type": "metrics" | "project-update" | "risk-alert" | "insight" | "activity",
 *     "payload": { ... },
 *     "priority": "critical" | "high" | "normal" | "low",
 *     "agentId": "agent-123",
 *     "agentName": "Risk Monitor Agent"
 *   }
 */

import express from "express";
import { z } from "zod";
import { broadcastNotification, broadcastAgentInsight, broadcastCriticalAlert } from "../websocket";
import { log } from "../log";

const router = express.Router();

// Schema for agent data push
const AgentDataPushSchema = z.object({
  type: z.enum([
    "metrics",
    "project-update",
    "risk-alert",
    "insight",
    "activity",
    "status-change",
    "financial-update",
    "okr-progress",
    "dependency-alert",
    "custom"
  ]),
  payload: z.record(z.unknown()),
  priority: z.enum(["critical", "high", "normal", "low"]).default("normal"),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  targetProjectId: z.string().optional(),
  timestamp: z.string().optional(),
});

// In-memory store for recent agent data (for clients that reconnect)
const recentAgentData: Array<{
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
}> = [];

const MAX_RECENT_DATA = 100;

/**
 * POST /api/agent/push
 * Agents POST data here, which is then broadcast to all connected UI clients
 */
router.post("/push", async (req, res) => {
  try {
    const validationResult = AgentDataPushSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: validationResult.error.format(),
      });
    }

    const data = validationResult.data;
    const id = `agent-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = data.timestamp || new Date().toISOString();

    // Store in recent data buffer
    const dataRecord = {
      id,
      type: data.type,
      payload: data.payload,
      priority: data.priority,
      agentId: data.agentId,
      agentName: data.agentName,
      timestamp,
    };

    recentAgentData.unshift(dataRecord);
    if (recentAgentData.length > MAX_RECENT_DATA) {
      recentAgentData.pop();
    }

    // Broadcast based on type and priority
    switch (data.type) {
      case "risk-alert":
        if (data.priority === "critical" || data.priority === "high") {
          broadcastCriticalAlert({
            id,
            title: (data.payload.title as string) || "Risk Alert",
            message: (data.payload.message as string) || "A risk has been detected",
            severity: data.priority as "critical" | "high" | "medium" | "low",
            projectName: data.payload.projectName as string,
            agentSource: data.agentName,
          });
        } else {
          broadcastNotification({
            id,
            type: `agent:${data.type}`,
            title: (data.payload.title as string) || "Risk Update",
            message: (data.payload.message as string) || "Risk status updated",
            severity: data.priority,
            source: "agent",
            sourceId: data.agentId,
          });
        }
        break;

      case "insight":
        broadcastAgentInsight({
          id,
          sourceAgent: data.agentId || "unknown",
          agentName: data.agentName || "Agent",
          severity: data.priority as "critical" | "high" | "medium" | "low",
          title: (data.payload.title as string) || "Agent Insight",
          description: (data.payload.description as string) || "",
          currentState: data.payload.currentState,
          rootCause: data.payload.rootCause,
          recommendations: data.payload.recommendations as any[],
          prediction: data.payload.prediction,
          relatedAgents: data.payload.relatedAgents as any[],
          projectId: data.targetProjectId,
          projectName: data.payload.projectName as string,
        });
        break;

      case "metrics":
      case "project-update":
      case "financial-update":
      case "okr-progress":
      case "status-change":
      case "activity":
      case "dependency-alert":
      case "custom":
      default:
        broadcastNotification({
          id,
          type: `agent:${data.type}`,
          title: (data.payload.title as string) || `${data.type} Update`,
          message: (data.payload.message as string) || `Data updated by ${data.agentName || "agent"}`,
          severity: data.priority,
          source: "agent",
          sourceId: data.agentId,
          createdAt: timestamp,
        });
        break;
    }

    log(`Agent data pushed: ${data.type} from ${data.agentName || data.agentId || "unknown"}`, "agent-data");

    res.json({
      success: true,
      id,
      timestamp,
      broadcastType: data.type,
    });
  } catch (error) {
    log(`Error processing agent data push: ${error}`, "agent-data");
    res.status(500).json({
      success: false,
      error: "Failed to process agent data",
    });
  }
});

/**
 * GET /api/agent/recent
 * Get recent agent data (for clients that need to catch up)
 */
router.get("/recent", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, MAX_RECENT_DATA);
  const type = req.query.type as string;
  const agentId = req.query.agentId as string;

  let filtered = recentAgentData;

  if (type) {
    filtered = filtered.filter((d) => d.type === type);
  }
  if (agentId) {
    filtered = filtered.filter((d) => d.agentId === agentId);
  }

  res.json({
    success: true,
    data: filtered.slice(0, limit),
    total: filtered.length,
  });
});

/**
 * GET /api/agent/stream-status
 * Check the status of the real-time data stream
 */
router.get("/stream-status", (req, res) => {
  res.json({
    success: true,
    status: "active",
    recentDataCount: recentAgentData.length,
    oldestTimestamp: recentAgentData.length > 0
      ? recentAgentData[recentAgentData.length - 1].timestamp
      : null,
    newestTimestamp: recentAgentData.length > 0
      ? recentAgentData[0].timestamp
      : null,
  });
});

/**
 * POST /api/agent/batch-push
 * Push multiple data items at once
 */
router.post("/batch-push", async (req, res) => {
  try {
    const items = req.body.items;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "Request body must contain an 'items' array",
      });
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const item of items) {
      const validationResult = AgentDataPushSchema.safeParse(item);

      if (!validationResult.success) {
        results.push({
          id: "invalid",
          success: false,
          error: "Invalid item format",
        });
        continue;
      }

      const data = validationResult.data;
      const id = `agent-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = data.timestamp || new Date().toISOString();

      // Store in recent data buffer
      recentAgentData.unshift({
        id,
        type: data.type,
        payload: data.payload,
        priority: data.priority,
        agentId: data.agentId,
        agentName: data.agentName,
        timestamp,
      });

      // Broadcast notification
      broadcastNotification({
        id,
        type: `agent:${data.type}`,
        title: (data.payload.title as string) || `${data.type} Update`,
        message: (data.payload.message as string) || `Batch update from ${data.agentName || "agent"}`,
        severity: data.priority,
        source: "agent",
        sourceId: data.agentId,
        createdAt: timestamp,
      });

      results.push({ id, success: true });
    }

    // Trim buffer if needed
    while (recentAgentData.length > MAX_RECENT_DATA) {
      recentAgentData.pop();
    }

    log(`Batch agent data pushed: ${results.length} items`, "agent-data");

    res.json({
      success: true,
      results,
      processedCount: results.filter((r) => r.success).length,
    });
  } catch (error) {
    log(`Error processing batch agent data: ${error}`, "agent-data");
    res.status(500).json({
      success: false,
      error: "Failed to process batch agent data",
    });
  }
});

export default router;
