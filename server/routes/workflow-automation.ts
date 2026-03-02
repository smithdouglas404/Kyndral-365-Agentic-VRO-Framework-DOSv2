/**
 * WORKFLOW AUTOMATION API
 *
 * Create and manage multi-step workflows using Palantir Actions
 * Supports triggers, conditions, and automated actions
 */

import { Router } from "express";
import { OntologyDataProvider } from "../services/OntologyDataProvider.js";
import { getPalantirActionsService } from "../services/PalantirActionsService.js";

const router = Router();

// In-memory workflow store (would use Palantir Ontology in production)
const workflows: Map<string, Workflow> = new Map();
const workflowExecutions: Map<string, WorkflowExecution[]> = new Map();

interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "condition" | "delay" | "notification" | "approval";
  config: {
    actionId?: string;
    actionParams?: Record<string, any>;
    condition?: {
      field: string;
      operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "contains";
      value: any;
    };
    delayMinutes?: number;
    notificationConfig?: {
      title: string;
      message: string;
      severity: string;
      notifyRoles?: string[];
    };
    approvalConfig?: {
      title: string;
      description: string;
      requiredApprovers?: string[];
      timeoutHours?: number;
    };
  };
  nextStepOnSuccess?: string;
  nextStepOnFailure?: string;
}

interface WorkflowTrigger {
  type: "ontology_change" | "schedule" | "manual" | "threshold_breach" | "rule_match";
  config: {
    objectType?: string;
    eventType?: "created" | "updated" | "deleted";
    filters?: any[];
    cronSchedule?: string;
    thresholdId?: string;
    ruleId?: string;
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  executionCount: number;
  lastExecutedAt?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed" | "paused" | "cancelled";
  currentStepId?: string;
  triggerData: any;
  stepResults: Record<string, {
    status: "success" | "failure" | "skipped";
    output?: any;
    error?: string;
    executedAt: string;
  }>;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * GET /api/workflow-automation/workflows
 * List all workflows
 */
router.get("/workflows", async (req, res) => {
  try {
    const { enabled, triggerType } = req.query;

    let allWorkflows = Array.from(workflows.values());

    if (enabled !== undefined) {
      allWorkflows = allWorkflows.filter(w => w.enabled === (enabled === "true"));
    }

    if (triggerType) {
      allWorkflows = allWorkflows.filter(w => w.trigger.type === triggerType);
    }

    res.json({
      success: true,
      workflows: allWorkflows,
      total: allWorkflows.length,
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to list:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workflow-automation/workflows/:workflowId
 * Get a single workflow
 */
router.get("/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = workflows.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found" });
    }

    res.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to get:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/workflow-automation/workflows
 * Create a new workflow
 */
router.post("/workflows", async (req, res) => {
  try {
    const { name, description, trigger, steps, enabled = true, createdBy = "system" } = req.body;

    if (!name || !trigger || !steps || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: "name, trigger, and at least one step are required",
      });
    }

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflow: Workflow = {
      id: workflowId,
      name,
      description: description || "",
      trigger,
      steps: steps.map((s: any, i: number) => ({
        id: s.id || `step_${i + 1}`,
        ...s,
      })),
      enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      executionCount: 0,
    };

    workflows.set(workflowId, workflow);

    // Also save to Palantir if available
    try {
      const actionsService = getPalantirActionsService();
      await actionsService.executeAction("ri.actions..action.create-workflow", {
        workflowId,
        name,
        description,
        triggerType: trigger.type,
        triggerConfig: JSON.stringify(trigger.config),
        stepsJson: JSON.stringify(steps),
        enabled,
        createdBy,
        createdAt: workflow.createdAt,
      });
    } catch (e) {
      console.warn("[Workflow] Could not save to Palantir:", e);
    }

    res.json({
      success: true,
      workflow,
      message: "Workflow created",
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to create:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/workflow-automation/workflows/:workflowId
 * Update a workflow
 */
router.put("/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const workflow = workflows.get(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found" });
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      id: workflowId, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    workflows.set(workflowId, updatedWorkflow);

    res.json({
      success: true,
      workflow: updatedWorkflow,
      message: "Workflow updated",
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to update:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/workflow-automation/workflows/:workflowId
 * Delete a workflow
 */
router.delete("/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = req.params;

    if (!workflows.has(workflowId)) {
      return res.status(404).json({ success: false, error: "Workflow not found" });
    }

    workflows.delete(workflowId);
    workflowExecutions.delete(workflowId);

    res.json({
      success: true,
      message: "Workflow deleted",
      workflowId,
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to delete:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/workflow-automation/workflows/:workflowId/toggle
 * Enable/disable a workflow
 */
router.post("/workflows/:workflowId/toggle", async (req, res) => {
  try {
    const { workflowId } = req.params;

    const workflow = workflows.get(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found" });
    }

    workflow.enabled = !workflow.enabled;
    workflow.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      workflowId,
      enabled: workflow.enabled,
      message: `Workflow ${workflow.enabled ? "enabled" : "disabled"}`,
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to toggle:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

/**
 * POST /api/workflow-automation/workflows/:workflowId/execute
 * Manually execute a workflow
 */
router.post("/workflows/:workflowId/execute", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { triggerData = {} } = req.body;

    const workflow = workflows.get(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found" });
    }

    if (!workflow.enabled) {
      return res.status(400).json({ success: false, error: "Workflow is disabled" });
    }

    const execution = await executeWorkflow(workflow, triggerData);

    res.json({
      success: true,
      execution,
      message: `Workflow execution ${execution.status}`,
    });
  } catch (error: any) {
    console.error("[Workflow] Execution failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workflow-automation/workflows/:workflowId/executions
 * Get execution history for a workflow
 */
router.get("/workflows/:workflowId/executions", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { limit = 20 } = req.query;

    const executions = workflowExecutions.get(workflowId) || [];

    res.json({
      success: true,
      workflowId,
      executions: executions.slice(-Number(limit)),
      total: executions.length,
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to get executions:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workflow-automation/executions/:executionId
 * Get details of a specific execution
 */
router.get("/executions/:executionId", async (req, res) => {
  try {
    const { executionId } = req.params;

    // Search all executions
    for (const [wfId, execs] of workflowExecutions.entries()) {
      const execution = execs.find(e => e.id === executionId);
      if (execution) {
        return res.json({
          success: true,
          execution,
          workflow: workflows.get(wfId),
        });
      }
    }

    res.status(404).json({ success: false, error: "Execution not found" });
  } catch (error: any) {
    console.error("[Workflow] Failed to get execution:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * GET /api/workflow-automation/templates
 * Get pre-built workflow templates
 */
router.get("/templates", async (req, res) => {
  const templates = [
    {
      id: "budget-overrun-alert",
      name: "Budget Overrun Alert",
      description: "Notify stakeholders when project budget exceeds threshold",
      trigger: {
        type: "threshold_breach",
        config: { thresholdId: "budget_variance" },
      },
      steps: [
        {
          id: "step_1",
          name: "Create Alert",
          type: "notification",
          config: {
            notificationConfig: {
              title: "Budget Overrun Detected",
              message: "Project {{projectName}} has exceeded budget by {{overrunPercent}}%",
              severity: "high",
              notifyRoles: ["project_manager", "finance"],
            },
          },
        },
        {
          id: "step_2",
          name: "Request Intervention",
          type: "approval",
          config: {
            approvalConfig: {
              title: "Budget Intervention Required",
              description: "Review and approve budget reallocation for {{projectName}}",
              requiredApprovers: ["portfolio_manager"],
              timeoutHours: 24,
            },
          },
        },
      ],
    },
    {
      id: "risk-escalation",
      name: "Risk Escalation Workflow",
      description: "Automatically escalate high-severity risks",
      trigger: {
        type: "ontology_change",
        config: {
          objectType: "Risk",
          eventType: "created",
          filters: [{ field: "severity", operator: "eq", value: "critical" }],
        },
      },
      steps: [
        {
          id: "step_1",
          name: "Notify Risk Owner",
          type: "notification",
          config: {
            notificationConfig: {
              title: "Critical Risk Created",
              message: "New critical risk: {{riskTitle}}",
              severity: "critical",
              notifyRoles: ["risk_owner", "project_manager"],
            },
          },
        },
        {
          id: "step_2",
          name: "Create Intervention",
          type: "action",
          config: {
            actionId: "ri.actions..action.create-intervention",
            actionParams: {
              title: "Critical Risk Requires Mitigation",
              description: "{{riskDescription}}",
              severity: "critical",
              interventionType: "risk_mitigation",
            },
          },
        },
      ],
    },
    {
      id: "milestone-reminder",
      name: "Milestone Reminder",
      description: "Send reminders for upcoming milestones",
      trigger: {
        type: "schedule",
        config: { cronSchedule: "0 9 * * 1" }, // Every Monday at 9 AM
      },
      steps: [
        {
          id: "step_1",
          name: "Check Upcoming Milestones",
          type: "action",
          config: {
            actionId: "ri.actions..action.query-upcoming-milestones",
            actionParams: { daysAhead: 7 },
          },
        },
        {
          id: "step_2",
          name: "Send Reminders",
          type: "notification",
          config: {
            notificationConfig: {
              title: "Upcoming Milestones This Week",
              message: "{{milestoneCount}} milestones due this week",
              severity: "medium",
              notifyRoles: ["project_manager"],
            },
          },
        },
      ],
    },
    {
      id: "approval-escalation",
      name: "Approval Escalation",
      description: "Escalate stale approvals to management",
      trigger: {
        type: "schedule",
        config: { cronSchedule: "0 10 * * *" }, // Daily at 10 AM
      },
      steps: [
        {
          id: "step_1",
          name: "Check Stale Interventions",
          type: "condition",
          config: {
            condition: {
              field: "pendingHours",
              operator: "gt",
              value: 48,
            },
          },
          nextStepOnSuccess: "step_2",
          nextStepOnFailure: "step_3",
        },
        {
          id: "step_2",
          name: "Escalate to Management",
          type: "action",
          config: {
            actionId: "ri.actions..action.escalate-intervention",
            actionParams: {
              escalatedTo: "executive",
              reason: "No response for 48+ hours",
            },
          },
        },
        {
          id: "step_3",
          name: "No Escalation Needed",
          type: "notification",
          config: {
            notificationConfig: {
              title: "Approval Queue Healthy",
              message: "All pending approvals are within SLA",
              severity: "info",
            },
          },
        },
      ],
    },
  ];

  res.json({
    success: true,
    templates,
    total: templates.length,
  });
});

/**
 * POST /api/workflow-automation/templates/:templateId/instantiate
 * Create a workflow from a template
 */
router.post("/templates/:templateId/instantiate", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, customizations = {} } = req.body;

    // Get template (would fetch from list above)
    const templatesRes = await fetch(`http://localhost:${process.env.PORT || 5000}/api/workflow-automation/templates`);
    const { templates } = await templatesRes.json();
    const template = templates.find((t: any) => t.id === templateId);

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    // Create workflow from template
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflow: Workflow = {
      id: workflowId,
      name: name || template.name,
      description: template.description,
      trigger: { ...template.trigger, ...customizations.trigger },
      steps: template.steps.map((s: any) => ({
        ...s,
        config: { ...s.config, ...customizations.steps?.[s.id] },
      })),
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "template",
      executionCount: 0,
    };

    workflows.set(workflowId, workflow);

    res.json({
      success: true,
      workflow,
      message: `Workflow created from template '${template.name}'`,
    });
  } catch (error: any) {
    console.error("[Workflow] Failed to instantiate template:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function executeWorkflow(workflow: Workflow, triggerData: any): Promise<WorkflowExecution> {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const execution: WorkflowExecution = {
    id: executionId,
    workflowId: workflow.id,
    status: "running",
    triggerData,
    stepResults: {},
    startedAt: new Date().toISOString(),
  };

  // Store execution
  if (!workflowExecutions.has(workflow.id)) {
    workflowExecutions.set(workflow.id, []);
  }
  workflowExecutions.get(workflow.id)!.push(execution);

  try {
    // Execute steps sequentially
    let currentStepId = workflow.steps[0]?.id;

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) break;

      execution.currentStepId = currentStepId;

      try {
        const result = await executeStep(step, triggerData, execution.stepResults);

        execution.stepResults[currentStepId] = {
          status: "success",
          output: result,
          executedAt: new Date().toISOString(),
        };

        // Determine next step
        currentStepId = step.nextStepOnSuccess || getNextStepId(workflow.steps, currentStepId);
      } catch (stepError: any) {
        execution.stepResults[currentStepId] = {
          status: "failure",
          error: stepError.message,
          executedAt: new Date().toISOString(),
        };

        // Try failure path or stop
        if (step.nextStepOnFailure) {
          currentStepId = step.nextStepOnFailure;
        } else {
          throw stepError;
        }
      }
    }

    execution.status = "completed";
    execution.completedAt = new Date().toISOString();

    // Update workflow stats
    workflow.executionCount++;
    workflow.lastExecutedAt = execution.completedAt;

  } catch (error: any) {
    execution.status = "failed";
    execution.error = error.message;
    execution.completedAt = new Date().toISOString();
  }

  return execution;
}

async function executeStep(step: WorkflowStep, triggerData: any, previousResults: any): Promise<any> {
  const actionsService = getPalantirActionsService();

  switch (step.type) {
    case "action":
      if (step.config.actionId) {
        const params = interpolateParams(step.config.actionParams || {}, triggerData, previousResults);
        return await actionsService.executeAction(step.config.actionId, params);
      }
      break;

    case "condition":
      if (step.config.condition) {
        const { field, operator, value } = step.config.condition;
        const actualValue = getNestedValue(triggerData, field);
        return evaluateCondition(actualValue, operator, value);
      }
      break;

    case "delay":
      if (step.config.delayMinutes) {
        await new Promise(resolve => setTimeout(resolve, step.config.delayMinutes! * 60 * 1000));
      }
      return { delayed: step.config.delayMinutes };

    case "notification":
      if (step.config.notificationConfig) {
        const config = step.config.notificationConfig;
        return await actionsService.createAlert({
          title: interpolateString(config.title, triggerData),
          message: interpolateString(config.message, triggerData),
          alertType: "workflow_notification",
          severity: config.severity as any || "medium",
          agentSource: "workflow",
          notifyRoles: config.notifyRoles,
          actionRequired: false,
        });
      }
      break;

    case "approval":
      if (step.config.approvalConfig) {
        const config = step.config.approvalConfig;
        return await actionsService.createIntervention({
          title: interpolateString(config.title, triggerData),
          description: interpolateString(config.description, triggerData),
          interventionType: "workflow_approval",
          severity: "high",
          agentSource: "workflow",
          recommendation: "Please review and approve",
          requiredApprovers: config.requiredApprovers,
          autoApproveAfterHours: config.timeoutHours,
        });
      }
      break;
  }

  return null;
}

function getNextStepId(steps: WorkflowStep[], currentStepId: string): string | undefined {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  return steps[currentIndex + 1]?.id;
}

function interpolateParams(params: Record<string, any>, data: any, results: any): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      result[key] = interpolateString(value, { ...data, ...results });
    } else {
      result[key] = value;
    }
  }
  return result;
}

function interpolateString(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return getNestedValue(data, key) ?? `{{${key}}}`;
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((curr, key) => curr?.[key], obj);
}

function evaluateCondition(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case "eq": return actual === expected;
    case "ne": return actual !== expected;
    case "gt": return actual > expected;
    case "lt": return actual < expected;
    case "gte": return actual >= expected;
    case "lte": return actual <= expected;
    case "contains": return String(actual).includes(String(expected));
    default: return false;
  }
}

export default router;
