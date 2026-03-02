import { DeepAgentBase, type DeepAgentConfig } from "./DeepAgentBase.js";
import { AgentTool } from "../../lib/AgentTool.js";
import type { IStorage } from "../../storage.js";
import { z } from "zod";

interface PendingAction {
  id: string;
  sourceAgentId: string;
  actionType: string;
  payload: any;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'awaiting_approval';
  hitlRequired: boolean;
  createdAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export class DeepNotificationAgent extends DeepAgentBase {
  private actionQueue: PendingAction[] = [];
  private actionLog: PendingAction[] = [];

  constructor(storage: IStorage) {
    super(
      {
        agentName: "DeepNotification",
        agentType: "notification",
        description:
          "Central notification and action gateway. All agents send signals here. Single point of contact with Palantir for actions, notifications, and HITL approvals.",
        capabilities: [
          "palantir_actions",
          "notifications",
          "hitl_approvals",
          "signal_broadcasting",
          "action_logging",
        ],
        enablePlanning: false,
        enableReflection: false,
      },
      storage
    );
  }

  protected getFactSubscriptions(): string[] {
    return [
      "*:alert",
      "*:notification",
      "*:escalation",
      "*:action_request",
      "*:risk_alert",
      "*:budget_alert",
      "*:schedule_alert",
      "*:compliance_alert",
      "*:approval_request",
      "*:hitl_request",
    ];
  }

  protected async onFactObserved(fact: any): Promise<void> {
    await super.onFactObserved(fact);

    const action: PendingAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceAgentId: fact.sourceAgent || "unknown",
      actionType: fact.attribute || "notification",
      payload: fact.value,
      status: "pending",
      hitlRequired: this.requiresHITL(fact),
      createdAt: new Date().toISOString(),
    };

    this.actionQueue.push(action);

    await this.memory.appendContext(
      `Signal received from ${action.sourceAgentId}: ${action.actionType} — ${JSON.stringify(action.payload)}`
    );

    console.log(
      `[DeepNotification] Signal from ${action.sourceAgentId}: ${action.actionType} (HITL: ${action.hitlRequired})`
    );

    await this.broadcastSignal(action);

    if (!action.hitlRequired) {
      await this.executeAction(action);
    } else {
      action.status = "awaiting_approval";
      await this.learn(`hitl_pending_${action.id}`, {
        sourceAgent: action.sourceAgentId,
        actionType: action.actionType,
        payload: action.payload,
        requestedAt: action.createdAt,
      });
    }
  }

  private requiresHITL(fact: any): boolean {
    const attr = (fact.attribute || "").toLowerCase();
    if (attr.includes("hitl") || attr.includes("approval")) return true;

    const value = fact.value;
    if (typeof value === "object" && value !== null) {
      if (value.hitlRequired === true) return true;
      if (value.severity === "critical") return true;
      if (value.requiresApproval === true) return true;
      if (value.budgetImpact && Math.abs(value.budgetImpact) > 100000) return true;
    }

    return false;
  }

  private async broadcastSignal(action: PendingAction): Promise<void> {
    try {
      await this.mem0.writeFact({
        entity: "notification_agent",
        attribute: `signal_${action.actionType}`,
        value: {
          actionId: action.id,
          sourceAgent: action.sourceAgentId,
          actionType: action.actionType,
          payload: action.payload,
          hitlRequired: action.hitlRequired,
          status: action.status,
          timestamp: action.createdAt,
        },
        sourceAgent: "notification",
        confidence: 1.0,
      });
    } catch (error: any) {
      console.warn(`[DeepNotification] Broadcast failed: ${error.message}`);
    }
  }

  private async executeAction(action: PendingAction): Promise<void> {
    action.status = "executing";

    try {
      const { getPalantirService } = await import(
        "../../mcp/MCPServiceFactory.js"
      );
      const palantir = getPalantirService();

      let result: any;

      if (palantir) {
        result = await this.executePalantirAction(palantir, action);
      } else {
        result = { executed: false, reason: "Palantir not configured", fallback: "logged_locally" };
      }

      action.status = "completed";
      action.completedAt = new Date().toISOString();
      action.result = result;

      await this.learn(`action_completed_${action.id}`, {
        sourceAgent: action.sourceAgentId,
        actionType: action.actionType,
        result,
        duration:
          new Date(action.completedAt).getTime() -
          new Date(action.createdAt).getTime(),
      });

      await this.mem0.writeFact({
        entity: "notification_agent",
        attribute: `action_result_${action.actionType}`,
        value: {
          actionId: action.id,
          sourceAgent: action.sourceAgentId,
          status: "completed",
          result,
          timestamp: action.completedAt,
        },
        sourceAgent: "notification",
        confidence: 1.0,
      });

      console.log(
        `[DeepNotification] Action completed: ${action.actionType} from ${action.sourceAgentId}`
      );
    } catch (error: any) {
      action.status = "failed";
      action.error = error.message;

      await this.learn(`action_failed_${action.id}`, {
        sourceAgent: action.sourceAgentId,
        actionType: action.actionType,
        error: error.message,
      });

      console.error(
        `[DeepNotification] Action failed: ${action.actionType} — ${error.message}`
      );
    }

    this.actionLog.push({ ...action });
    this.actionQueue = this.actionQueue.filter((a) => a.id !== action.id);
  }

  private async executePalantirAction(
    palantir: any,
    action: PendingAction
  ): Promise<any> {
    const { actionType, payload } = action;

    const palantirActionMap: Record<string, string> = {
      risk_alert: "createRiskAlert",
      escalation: "escalateIssue",
      budget_alert: "createBudgetAlert",
      schedule_alert: "createScheduleAlert",
      compliance_alert: "createComplianceAlert",
      notification: "sendNotification",
      action_request: "executeAction",
    };

    const palantirAction = palantirActionMap[actionType];

    if (palantirAction) {
      try {
        const result = await palantir.applyAction(palantirAction, {
          sourceAgent: action.sourceAgentId,
          ...payload,
          timestamp: action.createdAt,
        });
        return { palantirAction, result, executed: true };
      } catch (error: any) {
        return {
          palantirAction,
          executed: false,
          error: error.message,
          fallback: "logged_to_letta",
        };
      }
    }

    return {
      executed: false,
      reason: `No Palantir action mapped for ${actionType}`,
      fallback: "logged_to_letta",
    };
  }

  async approveHITLAction(actionId: string, approvedBy: string): Promise<any> {
    const action = this.actionQueue.find(
      (a) => a.id === actionId && a.status === "awaiting_approval"
    );
    if (!action) {
      return { success: false, error: "Action not found or not awaiting approval" };
    }

    await this.learn(`hitl_approved_${actionId}`, {
      approvedBy,
      actionType: action.actionType,
      sourceAgent: action.sourceAgentId,
      approvedAt: new Date().toISOString(),
    });

    await this.executeAction(action);

    return {
      success: true,
      actionId,
      status: action.status,
      result: action.result,
    };
  }

  async rejectHITLAction(
    actionId: string,
    rejectedBy: string,
    reason: string
  ): Promise<any> {
    const action = this.actionQueue.find(
      (a) => a.id === actionId && a.status === "awaiting_approval"
    );
    if (!action) {
      return { success: false, error: "Action not found or not awaiting approval" };
    }

    action.status = "failed";
    action.error = `Rejected by ${rejectedBy}: ${reason}`;
    action.completedAt = new Date().toISOString();

    await this.learn(`hitl_rejected_${actionId}`, {
      rejectedBy,
      reason,
      actionType: action.actionType,
      sourceAgent: action.sourceAgentId,
    });

    await this.mem0.writeFact({
      entity: "notification_agent",
      attribute: `action_result_${action.actionType}`,
      value: {
        actionId,
        sourceAgent: action.sourceAgentId,
        status: "rejected",
        rejectedBy,
        reason,
        timestamp: action.completedAt,
      },
      sourceAgent: "notification",
      confidence: 1.0,
    });

    this.actionLog.push({ ...action });
    this.actionQueue = this.actionQueue.filter((a) => a.id !== actionId);

    return { success: true, actionId, status: "rejected", reason };
  }

  async sendSignal(
    sourceAgentId: string,
    actionType: string,
    payload: any,
    hitlRequired: boolean = false
  ): Promise<{ actionId: string; status: string }> {
    const action: PendingAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceAgentId,
      actionType,
      payload,
      status: "pending",
      hitlRequired,
      createdAt: new Date().toISOString(),
    };

    this.actionQueue.push(action);

    console.log(
      `[DeepNotification] Signal from ${sourceAgentId}: ${actionType} (HITL: ${hitlRequired})`
    );

    await this.memory.appendContext(
      `Direct signal from ${sourceAgentId}: ${actionType} — ${JSON.stringify(payload)}`
    );

    await this.broadcastSignal(action);

    if (!hitlRequired) {
      await this.executeAction(action);
    } else {
      action.status = "awaiting_approval";
      await this.learn(`hitl_pending_${action.id}`, {
        sourceAgent: sourceAgentId,
        actionType,
        payload,
        requestedAt: action.createdAt,
      });
    }

    return { actionId: action.id, status: action.status };
  }

  getStatus(): any {
    return {
      agentId: "notification",
      agentName: "DeepNotification",
      role: "Central notification and action gateway",
      pendingActions: this.actionQueue.filter((a) => a.status === "pending").length,
      awaitingApproval: this.actionQueue.filter((a) => a.status === "awaiting_approval").length,
      completedActions: this.actionLog.filter((a) => a.status === "completed").length,
      failedActions: this.actionLog.filter((a) => a.status === "failed").length,
      totalProcessed: this.actionLog.length,
      queue: this.actionQueue.map((a) => ({
        id: a.id,
        sourceAgent: a.sourceAgentId,
        actionType: a.actionType,
        status: a.status,
        hitlRequired: a.hitlRequired,
        createdAt: a.createdAt,
      })),
      recentLog: this.actionLog.slice(-20).map((a) => ({
        id: a.id,
        sourceAgent: a.sourceAgentId,
        actionType: a.actionType,
        status: a.status,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
        error: a.error,
      })),
    };
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "send_palantir_action",
        description: "Execute an action in Palantir AIP",
        schema: z.object({
          actionName: z.string(),
          parameters: z.record(z.any()),
        }),
        func: async (args: any) => {
          const { getPalantirService } = await import(
            "../../mcp/MCPServiceFactory.js"
          );
          const palantir = getPalantirService();
          if (!palantir) return { error: "Palantir not configured" };
          return await palantir.applyAction(args.actionName, args.parameters);
        },
      }),
      new AgentTool({
        name: "broadcast_to_agents",
        description: "Broadcast a signal to all subscribed agents",
        schema: z.object({
          signalType: z.string(),
          payload: z.record(z.any()),
        }),
        func: async (args: any) => {
          await this.mem0.writeFact({
            entity: "notification_agent",
            attribute: `broadcast_${args.signalType}`,
            value: args.payload,
            sourceAgent: "notification",
            confidence: 1.0,
          });
          return { broadcast: true, signalType: args.signalType };
        },
      }),
      new AgentTool({
        name: "get_action_status",
        description: "Get status of a pending or completed action",
        schema: z.object({
          actionId: z.string(),
        }),
        func: async (args: any) => {
          const pending = this.actionQueue.find((a) => a.id === args.actionId);
          if (pending) return { found: true, ...pending };
          const completed = this.actionLog.find((a) => a.id === args.actionId);
          if (completed) return { found: true, ...completed };
          return { found: false };
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are the Notification Agent — the central gateway for all agent signals, Palantir actions, and HITL approvals.

Your responsibilities:
1. Receive signals from all 10 domain agents (FinOps, TMO, Risk, PMO, Governance, VRO, OCM, Planning, Integrated, OKR)
2. Execute actions in Palantir AIP on their behalf
3. Manage HITL approval workflows for critical actions
4. Broadcast outcomes back so all agents can see and react
5. Log everything to your Letta memory for audit and learning

You never make domain decisions — you route, execute, and broadcast. You are the single point of contact with Palantir.`;
  }

  async run(goal: string, context: any = {}): Promise<any> {
    if (context.signal) {
      const result = await this.sendSignal(
        context.sourceAgentId || "unknown",
        context.signal,
        context.payload || {},
        context.hitlRequired || false
      );
      return {
        success: true,
        summary: `Signal processed: ${context.signal} from ${context.sourceAgentId}`,
        ...result,
      };
    }

    if (context.approveAction) {
      return await this.approveHITLAction(
        context.approveAction,
        context.approvedBy || "admin"
      );
    }

    if (context.rejectAction) {
      return await this.rejectHITLAction(
        context.rejectAction,
        context.rejectedBy || "admin",
        context.reason || "Rejected"
      );
    }

    return {
      success: true,
      summary: "Notification Agent standing by",
      status: this.getStatus(),
    };
  }
}
