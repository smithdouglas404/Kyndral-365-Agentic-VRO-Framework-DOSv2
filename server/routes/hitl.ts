/**
 * HITL (Human-in-the-Loop) API Routes
 *
 * Provides endpoints for the HITL UI to:
 * - List pending interventions from Palantir
 * - Approve/reject interventions
 * - List active alerts
 * - Acknowledge/dismiss alerts
 */

import { Router } from "express";
import { OntologyDataProvider } from "../services/OntologyDataProvider.js";
import { getPalantirActionsService } from "../services/PalantirActionsService.js";

const router = Router();

// ============================================================================
// INTERVENTIONS (HITL Approval Workflow)
// ============================================================================

/**
 * GET /api/hitl/interventions
 * List all interventions (pending, approved, rejected)
 */
router.get("/interventions", async (req, res) => {
  try {
    const { status, severity, agentSource, projectId, limit = 50 } = req.query;

    const filters: any[] = [];
    if (status) filters.push({ field: "status", operator: "eq", value: status });
    if (severity) filters.push({ field: "severity", operator: "eq", value: severity });
    if (agentSource) filters.push({ field: "agentSource", operator: "eq", value: agentSource });
    if (projectId) filters.push({ field: "projectId", operator: "eq", value: projectId });

    const result = await OntologyDataProvider.query("AtlasInsight", {
      filters,
      pageSize: Number(limit),
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });

    res.json({
      success: true,
      interventions: result.data,
      total: result.data.length,
      source: result.source,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to list interventions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hitl/interventions/pending
 * List only pending interventions requiring approval
 */
router.get("/interventions/pending", async (req, res) => {
  try {
    const { severity, agentSource, limit = 50 } = req.query;

    const filters: any[] = [
      { field: "status", operator: "eq", value: "pending" },
    ];
    if (severity) filters.push({ field: "severity", operator: "eq", value: severity });
    if (agentSource) filters.push({ field: "agentSource", operator: "eq", value: agentSource });

    const result = await OntologyDataProvider.query("AtlasInsight", {
      filters,
      pageSize: Number(limit),
      orderBy: [
        { field: "severity", direction: "desc" }, // Critical first
        { field: "createdAt", direction: "asc" },  // Oldest first
      ],
    });

    // Group by severity for UI
    const bySeverity = {
      critical: result.data.filter((i: any) => i.severity === "critical"),
      high: result.data.filter((i: any) => i.severity === "high"),
      medium: result.data.filter((i: any) => i.severity === "medium"),
      low: result.data.filter((i: any) => i.severity === "low"),
    };

    res.json({
      success: true,
      interventions: result.data,
      bySeverity,
      total: result.data.length,
      source: result.source,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to list pending interventions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hitl/interventions/:id
 * Get a single intervention with full details
 */
router.get("/interventions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await OntologyDataProvider.query("AtlasInsight", {
      filters: [{ field: "interventionId", operator: "eq", value: id }],
      pageSize: 1,
    });

    if (result.data.length === 0) {
      return res.status(404).json({ success: false, error: "Intervention not found" });
    }

    res.json({
      success: true,
      intervention: result.data[0],
      source: result.source,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to get intervention:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hitl/interventions/:id/approve
 * Approve an intervention
 */
router.post("/interventions/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ success: false, error: "approvedBy is required" });
    }

    const actionsService = getPalantirActionsService();
    const result = await actionsService.approveIntervention(id, approvedBy, notes);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      interventionId: id,
      status: "approved",
      approvedBy,
      approvedAt: result.timestamp,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to approve intervention:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hitl/interventions/:id/reject
 * Reject an intervention
 */
router.post("/interventions/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;

    if (!rejectedBy || !reason) {
      return res.status(400).json({ success: false, error: "rejectedBy and reason are required" });
    }

    const actionsService = getPalantirActionsService();
    const result = await actionsService.rejectIntervention(id, rejectedBy, reason);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      interventionId: id,
      status: "rejected",
      rejectedBy,
      reason,
      rejectedAt: result.timestamp,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to reject intervention:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hitl/interventions/:id/escalate
 * Escalate an intervention to higher authority
 */
router.post("/interventions/:id/escalate", async (req, res) => {
  try {
    const { id } = req.params;
    const { escalatedBy, escalatedTo, reason } = req.body;

    if (!escalatedBy || !escalatedTo || !reason) {
      return res.status(400).json({
        success: false,
        error: "escalatedBy, escalatedTo, and reason are required"
      });
    }

    const actionsService = getPalantirActionsService();
    const result = await actionsService.escalateIntervention(id, escalatedBy, escalatedTo, reason);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      interventionId: id,
      status: "escalated",
      escalatedBy,
      escalatedTo,
      reason,
      escalatedAt: result.timestamp,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to escalate intervention:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ALERTS
// ============================================================================

/**
 * GET /api/hitl/alerts
 * List all alerts
 */
router.get("/alerts", async (req, res) => {
  try {
    const { status, severity, alertType, limit = 50 } = req.query;

    const filters: any[] = [];
    if (status) filters.push({ field: "status", operator: "eq", value: status });
    if (severity) filters.push({ field: "severity", operator: "eq", value: severity });
    if (alertType) filters.push({ field: "alertType", operator: "eq", value: alertType });

    const result = await OntologyDataProvider.query("AtlasRisk", {
      filters,
      pageSize: Number(limit),
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });

    res.json({
      success: true,
      alerts: result.data,
      total: result.data.length,
      source: result.source,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to list alerts:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hitl/alerts/active
 * List only active (unacknowledged) alerts
 */
router.get("/alerts/active", async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;

    const filters: any[] = [
      { field: "status", operator: "eq", value: "active" },
    ];
    if (severity) filters.push({ field: "severity", operator: "eq", value: severity });

    const result = await OntologyDataProvider.query("AtlasRisk", {
      filters,
      pageSize: Number(limit),
      orderBy: [
        { field: "severity", direction: "desc" },
        { field: "createdAt", direction: "desc" },
      ],
    });

    res.json({
      success: true,
      alerts: result.data,
      total: result.data.length,
      source: result.source,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to list active alerts:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hitl/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post("/alerts/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy, notes } = req.body;

    if (!acknowledgedBy) {
      return res.status(400).json({ success: false, error: "acknowledgedBy is required" });
    }

    const actionsService = getPalantirActionsService();
    const result = await actionsService.acknowledgeAlert({
      alertId: id,
      acknowledgedBy,
      notes,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      alertId: id,
      status: "acknowledged",
      acknowledgedBy,
      acknowledgedAt: result.timestamp,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to acknowledge alert:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hitl/alerts/:id/dismiss
 * Dismiss an alert
 */
router.post("/alerts/:id/dismiss", async (req, res) => {
  try {
    const { id } = req.params;
    const { dismissedBy, reason } = req.body;

    if (!dismissedBy) {
      return res.status(400).json({ success: false, error: "dismissedBy is required" });
    }

    const actionsService = getPalantirActionsService();
    const result = await actionsService.dismissAlert(id, dismissedBy, reason);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      alertId: id,
      status: "dismissed",
      dismissedBy,
      reason,
      dismissedAt: result.timestamp,
    });
  } catch (error: any) {
    console.error("[HITL] Failed to dismiss alert:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

/**
 * GET /api/hitl/summary
 * Get HITL dashboard summary (counts, recent activity)
 */
router.get("/summary", async (req, res) => {
  try {
    // Get pending interventions count by severity
    const pendingInterventions = await OntologyDataProvider.query("AtlasInsight", {
      filters: [{ field: "status", operator: "eq", value: "pending" }],
      pageSize: 100,
    });

    // Get active alerts count by severity
    const activeAlerts = await OntologyDataProvider.query("AtlasRisk", {
      filters: [{ field: "status", operator: "eq", value: "active" }],
      pageSize: 100,
    });

    // Compute summary stats
    const interventionsBySeverity = {
      critical: pendingInterventions.data.filter((i: any) => i.severity === "critical").length,
      high: pendingInterventions.data.filter((i: any) => i.severity === "high").length,
      medium: pendingInterventions.data.filter((i: any) => i.severity === "medium").length,
      low: pendingInterventions.data.filter((i: any) => i.severity === "low").length,
    };

    const alertsBySeverity = {
      critical: activeAlerts.data.filter((a: any) => a.severity === "critical").length,
      high: activeAlerts.data.filter((a: any) => a.severity === "high").length,
      medium: activeAlerts.data.filter((a: any) => a.severity === "medium").length,
      low: activeAlerts.data.filter((a: any) => a.severity === "low").length,
    };

    // Get unique agents that have pending items
    const agentsWithPending = [...new Set(pendingInterventions.data.map((i: any) => i.agentSource))];

    res.json({
      success: true,
      summary: {
        interventions: {
          pending: pendingInterventions.data.length,
          bySeverity: interventionsBySeverity,
          critical: interventionsBySeverity.critical,
        },
        alerts: {
          active: activeAlerts.data.length,
          bySeverity: alertsBySeverity,
          critical: alertsBySeverity.critical,
        },
        agentsWithPending,
        requiresAttention: interventionsBySeverity.critical > 0 || alertsBySeverity.critical > 0,
      },
      // Include recent items for quick display
      recentInterventions: pendingInterventions.data.slice(0, 5),
      recentAlerts: activeAlerts.data.slice(0, 5),
    });
  } catch (error: any) {
    console.error("[HITL] Failed to get summary:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
