/**
 * PALANTIR ACTIONS SERVICE
 *
 * Service for executing Palantir Actions to create/update/delete objects in the ontology.
 * Actions are the write path for the ontology - all mutations go through Actions.
 *
 * Architecture:
 * - READ: Query ontology objects directly
 * - WRITE: Execute Actions to mutate objects
 *
 * Palantir Actions API:
 * - POST /api/v2/ontologies/{ontologyRid}/actions/{actionRid}/apply
 * - POST /api/v2/ontologies/{ontologyRid}/actions/{actionRid}/validate
 */

import { getPalantirService, PalantirAIPService } from "../mcp/MCPServiceFactory.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ActionParameter {
  name: string;
  value: unknown;
  type?: string;
}

export interface ActionResult {
  success: boolean;
  actionRid: string;
  objectRid?: string;
  validationResults?: ValidationResult[];
  error?: string;
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    parameter: string;
    message: string;
    code: string;
  }>;
}

export interface BulkActionResult {
  total: number;
  successful: number;
  failed: number;
  results: ActionResult[];
  errors: string[];
  timestamp: string;
}

// Action type definitions for common operations
export interface CreateProjectParams {
  name: string;
  description?: string;
  status: "green" | "amber" | "red";
  businessUnit: string;
  priority: "critical" | "high" | "medium" | "low";
  budgetTotal?: number;
  budgetSpent?: number;
  startDate?: string;
  endDate?: string;
  source?: string;
  externalId?: string;
}

export interface UpdateProjectParams {
  projectId: string;
  name?: string;
  description?: string;
  status?: "green" | "amber" | "red";
  priority?: "critical" | "high" | "medium" | "low";
  budgetTotal?: number;
  budgetSpent?: number;
  progress?: number;
}

export interface CreateRiskParams {
  title: string;
  description?: string;
  severity: "critical" | "high" | "medium" | "low";
  probability: number;
  impact: number;
  projectId?: string;
  owner?: string;
  mitigationPlan?: string;
}

export interface UpsertTaskParams {
  externalId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  projectId?: string;
  assignee?: string;
  dueDate?: string;
  source: "jira" | "openproject" | "monday";
}

// ============================================================================
// INTERVENTION & ALERT TYPES (HITL Workflow)
// ============================================================================

export interface CreateInterventionParams {
  title: string;
  description: string;
  interventionType: string; // budget_alert, risk_escalation, schedule_delay, etc.
  severity: "critical" | "high" | "medium" | "low";
  agentSource: string; // Which agent created this
  projectId?: string;
  entityType?: string; // project, portfolio, team, etc.
  entityId?: string;
  recommendation: string;
  estimatedImpact?: string;
  requiredApprovers?: string[]; // User IDs or roles
  autoApproveAfterHours?: number; // Auto-approve if no response
  metadata?: Record<string, unknown>;
}

export interface UpdateInterventionParams {
  interventionId: string;
  status?: "pending" | "approved" | "rejected" | "escalated" | "auto_approved" | "expired";
  approvedBy?: string;
  rejectedBy?: string;
  approvalNotes?: string;
  escalatedTo?: string;
}

export interface CreateAlertParams {
  title: string;
  message: string;
  alertType: string; // threshold_breach, rule_triggered, anomaly_detected, etc.
  severity: "critical" | "high" | "medium" | "low";
  agentSource: string;
  projectId?: string;
  entityType?: string;
  entityId?: string;
  notifyRoles?: string[]; // Roles to notify
  notifyUsers?: string[]; // Specific users to notify
  actionRequired: boolean;
  relatedInterventionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AcknowledgeAlertParams {
  alertId: string;
  acknowledgedBy: string;
  notes?: string;
}

// ============================================================================
// PALANTIR ACTIONS SERVICE
// ============================================================================

export class PalantirActionsService {
  private static instance: PalantirActionsService | null = null;
  private palantirService: PalantirAIPService | null = null;
  private ontologyRid: string | null = null;
  private actionCache: Map<string, string> = new Map(); // action name -> action RID

  // Default action RIDs (configured in Palantir Foundry)
  // These should be discovered or configured via environment variables
  private static readonly DEFAULT_ACTIONS = {
    createProject: process.env.PALANTIR_ACTION_CREATE_PROJECT || "ri.actions..action.create-project",
    updateProject: process.env.PALANTIR_ACTION_UPDATE_PROJECT || "ri.actions..action.update-project",
    deleteProject: process.env.PALANTIR_ACTION_DELETE_PROJECT || "ri.actions..action.delete-project",
    createRisk: process.env.PALANTIR_ACTION_CREATE_RISK || "ri.actions..action.create-risk",
    updateRisk: process.env.PALANTIR_ACTION_UPDATE_RISK || "ri.actions..action.update-risk",
    createTask: process.env.PALANTIR_ACTION_CREATE_TASK || "ri.actions..action.create-task",
    upsertTask: process.env.PALANTIR_ACTION_UPSERT_TASK || "ri.actions..action.upsert-task",
    createOKR: process.env.PALANTIR_ACTION_CREATE_OKR || "ri.actions..action.create-okr",
    updateOKR: process.env.PALANTIR_ACTION_UPDATE_OKR || "ri.actions..action.update-okr",
    syncFromExternal: process.env.PALANTIR_ACTION_SYNC_EXTERNAL || "ri.actions..action.sync-from-external",
    // HITL Workflow Actions
    createIntervention: process.env.PALANTIR_ACTION_CREATE_INTERVENTION || "ri.actions..action.create-intervention",
    updateIntervention: process.env.PALANTIR_ACTION_UPDATE_INTERVENTION || "ri.actions..action.update-intervention",
    approveIntervention: process.env.PALANTIR_ACTION_APPROVE_INTERVENTION || "ri.actions..action.approve-intervention",
    rejectIntervention: process.env.PALANTIR_ACTION_REJECT_INTERVENTION || "ri.actions..action.reject-intervention",
    escalateIntervention: process.env.PALANTIR_ACTION_ESCALATE_INTERVENTION || "ri.actions..action.escalate-intervention",
    createAlert: process.env.PALANTIR_ACTION_CREATE_ALERT || "ri.actions..action.create-alert",
    acknowledgeAlert: process.env.PALANTIR_ACTION_ACKNOWLEDGE_ALERT || "ri.actions..action.acknowledge-alert",
    dismissAlert: process.env.PALANTIR_ACTION_DISMISS_ALERT || "ri.actions..action.dismiss-alert",
  };

  private constructor() {}

  static getInstance(): PalantirActionsService {
    if (!PalantirActionsService.instance) {
      PalantirActionsService.instance = new PalantirActionsService();
    }
    return PalantirActionsService.instance;
  }

  /**
   * Initialize the service with Palantir connection
   */
  async initialize(palantirService: PalantirAIPService): Promise<void> {
    this.palantirService = palantirService;

    // Get ontology RID from the service
    try {
      const ontology = await this.palantirService.listOntologies();
      if (ontology && ontology.length > 0) {
        this.ontologyRid = ontology[0].rid;
        console.log(`[PalantirActions] Initialized with ontology: ${this.ontologyRid}`);
      }
    } catch (error: any) {
      console.warn(`[PalantirActions] Failed to get ontology: ${error.message}`);
    }
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return !!this.palantirService && !!this.ontologyRid;
  }

  // ============================================================================
  // CORE ACTION EXECUTION
  // ============================================================================

  /**
   * Execute a Palantir Action
   */
  async executeAction(
    actionRid: string,
    parameters: Record<string, unknown>
  ): Promise<ActionResult> {
    if (!this.isReady()) {
      return {
        success: false,
        actionRid,
        error: "Palantir service not initialized",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Palantir Actions API call
      const result = await this.palantirService!.executeAction(
        this.ontologyRid!,
        actionRid,
        parameters
      );

      return {
        success: true,
        actionRid,
        objectRid: result?.objectRid,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`[PalantirActions] Action ${actionRid} failed:`, error.message);
      return {
        success: false,
        actionRid,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate action parameters before execution
   */
  async validateAction(
    actionRid: string,
    parameters: Record<string, unknown>
  ): Promise<ValidationResult> {
    if (!this.isReady()) {
      return {
        valid: false,
        errors: [{ parameter: "", message: "Service not initialized", code: "NOT_INITIALIZED" }],
      };
    }

    try {
      const result = await this.palantirService!.validateAction(
        this.ontologyRid!,
        actionRid,
        parameters
      );

      return {
        valid: result?.valid ?? false,
        errors: result?.errors ?? [],
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [{ parameter: "", message: error.message, code: "VALIDATION_ERROR" }],
      };
    }
  }

  // ============================================================================
  // PROJECT ACTIONS
  // ============================================================================

  /**
   * Create a new project in Palantir
   */
  async createProject(params: CreateProjectParams): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.createProject, {
      name: params.name,
      description: params.description || "",
      status: params.status,
      businessUnit: params.businessUnit,
      priority: params.priority,
      budgetTotal: params.budgetTotal || 0,
      budgetSpent: params.budgetSpent || 0,
      startDate: params.startDate,
      endDate: params.endDate,
      source: params.source || "manual",
      externalId: params.externalId || null,
    });
  }

  /**
   * Update an existing project
   */
  async updateProject(params: UpdateProjectParams): Promise<ActionResult> {
    const updateParams: Record<string, unknown> = {
      projectId: params.projectId,
    };

    // Only include fields that are provided
    if (params.name !== undefined) updateParams.name = params.name;
    if (params.description !== undefined) updateParams.description = params.description;
    if (params.status !== undefined) updateParams.status = params.status;
    if (params.priority !== undefined) updateParams.priority = params.priority;
    if (params.budgetTotal !== undefined) updateParams.budgetTotal = params.budgetTotal;
    if (params.budgetSpent !== undefined) updateParams.budgetSpent = params.budgetSpent;
    if (params.progress !== undefined) updateParams.progress = params.progress;

    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.updateProject, updateParams);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.deleteProject, {
      projectId,
    });
  }

  // ============================================================================
  // RISK ACTIONS
  // ============================================================================

  /**
   * Create a new risk
   */
  async createRisk(params: CreateRiskParams): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.createRisk, {
      title: params.title,
      description: params.description || "",
      severity: params.severity,
      probability: params.probability,
      impact: params.impact,
      projectId: params.projectId || null,
      owner: params.owner || null,
      mitigationPlan: params.mitigationPlan || null,
    });
  }

  /**
   * Update a risk
   */
  async updateRisk(
    riskId: string,
    updates: Partial<CreateRiskParams>
  ): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.updateRisk, {
      riskId,
      ...updates,
    });
  }

  // ============================================================================
  // TASK/ISSUE ACTIONS (for Jira/OpenProject/Monday sync)
  // ============================================================================

  /**
   * Upsert a task from external system
   * Creates if not exists, updates if exists (based on externalId)
   */
  async upsertTask(params: UpsertTaskParams): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.upsertTask, {
      externalId: params.externalId,
      title: params.title,
      description: params.description || "",
      status: params.status,
      priority: params.priority || "medium",
      projectId: params.projectId || null,
      assignee: params.assignee || null,
      dueDate: params.dueDate || null,
      source: params.source,
      syncedAt: new Date().toISOString(),
    });
  }

  /**
   * Bulk upsert tasks from external sync
   */
  async bulkUpsertTasks(tasks: UpsertTaskParams[]): Promise<BulkActionResult> {
    const results: ActionResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        const result = await this.upsertTask(task);
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`Task ${task.externalId}: ${result.error}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`Task ${task.externalId}: ${error.message}`);
        results.push({
          success: false,
          actionRid: PalantirActionsService.DEFAULT_ACTIONS.upsertTask,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      total: tasks.length,
      successful,
      failed,
      results,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // OKR ACTIONS
  // ============================================================================

  /**
   * Create a new OKR
   */
  async createOKR(params: {
    objective: string;
    keyResults: Array<{ description: string; target: number; unit: string }>;
    owner?: string;
    period?: string;
    strategicPriority?: string;
  }): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.createOKR, {
      objective: params.objective,
      keyResults: params.keyResults,
      owner: params.owner || null,
      period: params.period || null,
      strategicPriority: params.strategicPriority || "medium",
      progress: 0,
    });
  }

  /**
   * Update OKR progress
   */
  async updateOKRProgress(
    okrId: string,
    keyResultUpdates: Array<{ id: string; currentValue: number }>
  ): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.updateOKR, {
      okrId,
      keyResultUpdates,
    });
  }

  // ============================================================================
  // SYNC ACTIONS
  // ============================================================================

  /**
   * Generic sync action for external system data
   */
  async syncFromExternal(params: {
    source: "jira" | "openproject" | "monday";
    objectType: string;
    data: Record<string, unknown>[];
    syncMode: "full" | "incremental";
  }): Promise<BulkActionResult> {
    const results: ActionResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    for (const item of params.data) {
      try {
        const result = await this.executeAction(
          PalantirActionsService.DEFAULT_ACTIONS.syncFromExternal,
          {
            source: params.source,
            objectType: params.objectType,
            data: item,
            syncedAt: new Date().toISOString(),
          }
        );
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`Sync item failed: ${result.error}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`Sync error: ${error.message}`);
      }
    }

    return {
      total: params.data.length,
      successful,
      failed,
      results,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // INTERVENTION ACTIONS (HITL Workflow)
  // ============================================================================

  /**
   * Create a new intervention requiring human approval
   * This creates an Intervention object in Palantir with HITL workflow
   */
  async createIntervention(params: CreateInterventionParams): Promise<ActionResult> {
    const interventionId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.createIntervention, {
      interventionId,
      title: params.title,
      description: params.description,
      interventionType: params.interventionType,
      severity: params.severity,
      agentSource: params.agentSource,
      projectId: params.projectId || null,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      recommendation: params.recommendation,
      estimatedImpact: params.estimatedImpact || null,
      requiredApprovers: params.requiredApprovers || [],
      autoApproveAfterHours: params.autoApproveAfterHours || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      metadata: params.metadata || {},
    });
  }

  /**
   * Approve an intervention (HITL approval action)
   */
  async approveIntervention(
    interventionId: string,
    approvedBy: string,
    notes?: string
  ): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.approveIntervention, {
      interventionId,
      status: "approved",
      approvedBy,
      approvalNotes: notes || "",
      approvedAt: new Date().toISOString(),
    });
  }

  /**
   * Reject an intervention (HITL rejection action)
   */
  async rejectIntervention(
    interventionId: string,
    rejectedBy: string,
    reason: string
  ): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.rejectIntervention, {
      interventionId,
      status: "rejected",
      rejectedBy,
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
    });
  }

  /**
   * Escalate an intervention to higher authority
   */
  async escalateIntervention(
    interventionId: string,
    escalatedBy: string,
    escalatedTo: string,
    reason: string
  ): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.escalateIntervention, {
      interventionId,
      status: "escalated",
      escalatedBy,
      escalatedTo,
      escalationReason: reason,
      escalatedAt: new Date().toISOString(),
    });
  }

  /**
   * Update intervention status
   */
  async updateIntervention(params: UpdateInterventionParams): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.updateIntervention, {
      interventionId: params.interventionId,
      status: params.status,
      approvedBy: params.approvedBy || null,
      rejectedBy: params.rejectedBy || null,
      approvalNotes: params.approvalNotes || null,
      escalatedTo: params.escalatedTo || null,
      updatedAt: new Date().toISOString(),
    });
  }

  // ============================================================================
  // ALERT ACTIONS (Notifications)
  // ============================================================================

  /**
   * Create a new alert in Palantir
   * Palantir will handle notification delivery based on notifyRoles/notifyUsers
   */
  async createAlert(params: CreateAlertParams): Promise<ActionResult> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.createAlert, {
      alertId,
      title: params.title,
      message: params.message,
      alertType: params.alertType,
      severity: params.severity,
      agentSource: params.agentSource,
      projectId: params.projectId || null,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      notifyRoles: params.notifyRoles || [],
      notifyUsers: params.notifyUsers || [],
      actionRequired: params.actionRequired,
      relatedInterventionId: params.relatedInterventionId || null,
      status: "active",
      createdAt: new Date().toISOString(),
      metadata: params.metadata || {},
    });
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(params: AcknowledgeAlertParams): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.acknowledgeAlert, {
      alertId: params.alertId,
      status: "acknowledged",
      acknowledgedBy: params.acknowledgedBy,
      acknowledgedAt: new Date().toISOString(),
      notes: params.notes || "",
    });
  }

  /**
   * Dismiss/close an alert
   */
  async dismissAlert(alertId: string, dismissedBy: string, reason?: string): Promise<ActionResult> {
    return this.executeAction(PalantirActionsService.DEFAULT_ACTIONS.dismissAlert, {
      alertId,
      status: "dismissed",
      dismissedBy,
      dismissedAt: new Date().toISOString(),
      dismissReason: reason || "",
    });
  }

  // ============================================================================
  // ACTION DISCOVERY
  // ============================================================================

  /**
   * List available actions in the ontology
   */
  async listAvailableActions(): Promise<Array<{
    rid: string;
    apiName: string;
    displayName: string;
    description?: string;
    parameters: Array<{ name: string; type: string; required: boolean }>;
  }>> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const actions = await this.palantirService!.listActions(this.ontologyRid!);
      return actions || [];
    } catch (error: any) {
      console.error(`[PalantirActions] Failed to list actions:`, error.message);
      return [];
    }
  }

  /**
   * Get action by name (with caching)
   */
  async getActionRid(actionName: string): Promise<string | null> {
    // Check cache first
    if (this.actionCache.has(actionName)) {
      return this.actionCache.get(actionName)!;
    }

    // Fetch from API
    const actions = await this.listAvailableActions();
    const action = actions.find(a => a.apiName === actionName);

    if (action) {
      this.actionCache.set(actionName, action.rid);
      return action.rid;
    }

    return null;
  }
}

// Export singleton instance getter
export function getPalantirActionsService(): PalantirActionsService {
  return PalantirActionsService.getInstance();
}
