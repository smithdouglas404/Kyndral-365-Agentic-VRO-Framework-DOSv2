/**
 * AGENT LOGIC GATES
 *
 * Auto-block rules that allow agents to negotiate without human intervention
 * These gates implement SAFe 6.0 governance patterns for autonomous agent interactions
 */

export interface LogicGateCondition {
  agentType: string;
  attribute: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number | string | boolean;
}

export interface LogicGateAction {
  targetAgent: string;
  actionType: 'block' | 'set_attribute' | 'create_epic' | 'trigger_event' | 'invalidate' | 'alert';
  attribute?: string;
  value?: any;
  message?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface LogicGate {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Higher priority gates execute first
  conditions: LogicGateCondition[];
  conditionOperator: 'AND' | 'OR';
  actions: LogicGateAction[];
  reasoning: string;
}

/**
 * Gate A: Compliance-Risk Deadbolt ⭐
 *
 * Trigger: IF (Risk.exposure_value > 100000) OR (Governance.critical_vuln_count > 0)
 * Action: Governance.gate_status = 'Blocked' AND PMO.flow_status = 'Analyzing'
 */
export const GATE_COMPLIANCE_RISK_DEADBOLT: LogicGate = {
  id: 'gate-a-compliance-risk-deadbolt',
  name: 'Compliance-Risk Deadbolt',
  description: 'Auto-block releases when critical risks or vulnerabilities detected',
  enabled: true,
  priority: 100, // Highest priority - security and compliance
  conditions: [
    {
      agentType: 'risk',
      attribute: 'exposure_value',
      operator: '>',
      threshold: 100000
    },
    {
      agentType: 'governance',
      attribute: 'critical_vuln_count',
      operator: '>',
      threshold: 0
    }
  ],
  conditionOperator: 'OR',
  actions: [
    {
      targetAgent: 'governance',
      actionType: 'set_attribute',
      attribute: 'gate_status',
      value: 'Blocked',
      message: 'Gate blocked due to critical risk exposure or vulnerabilities'
    },
    {
      targetAgent: 'pmo',
      actionType: 'set_attribute',
      attribute: 'flow_status',
      value: 'Analyzing',
      message: 'Flow moved back to Analyzing due to governance gate block'
    },
    {
      targetAgent: 'governance',
      actionType: 'alert',
      message: 'CRITICAL: Release blocked - exposure > $100K or critical vulnerabilities detected',
      severity: 'critical'
    }
  ],
  reasoning: 'Protect organization from financial and security risks by auto-blocking releases when exposure exceeds $100K or critical vulnerabilities are present'
};

/**
 * Gate B: Maturity-Speed Governor ⭐
 *
 * Trigger: IF TMO.competency_score < 2.5
 * Action: PMO.sprint_load_factor = PMO.sprint_load_factor * 0.8 (Reduce by 20%)
 */
export const GATE_MATURITY_SPEED_GOVERNOR: LogicGate = {
  id: 'gate-b-maturity-speed-governor',
  name: 'Maturity-Speed Governor',
  description: 'Reduce WIP when team maturity is low to prevent burnout',
  enabled: true,
  priority: 80,
  conditions: [
    {
      agentType: 'tmo',
      attribute: 'competency_score',
      operator: '<',
      threshold: 2.5
    }
  ],
  conditionOperator: 'AND',
  actions: [
    {
      targetAgent: 'pmo',
      actionType: 'set_attribute',
      attribute: 'sprint_load_factor',
      value: 0.8, // Reduce by 20%
      message: 'Load factor reduced by 20% due to low team competency'
    },
    {
      targetAgent: 'tmo',
      actionType: 'alert',
      message: 'MEDIUM: Team competency below 2.5 - load factor reduced to protect team',
      severity: 'medium'
    }
  ],
  reasoning: 'Protect team from burnout when maturity is low by automatically reducing sprint load'
};

/**
 * Gate C: Audit-Ready Barrier ⭐
 *
 * Trigger: IF (Governance.audit_readiness < 90) AND (Governance.regulatory_date < NOW + 30_DAYS)
 * Action: Create Epic: "Compliance Debt" with Priority = "Highest"
 */
export const GATE_AUDIT_READY_BARRIER: LogicGate = {
  id: 'gate-c-audit-ready-barrier',
  name: 'Audit-Ready Barrier',
  description: 'Create high-priority compliance epic when audit readiness is low and deadline approaching',
  enabled: true,
  priority: 90,
  conditions: [
    {
      agentType: 'governance',
      attribute: 'audit_readiness',
      operator: '<',
      threshold: 90
    },
    {
      agentType: 'governance',
      attribute: 'regulatory_date',
      operator: '<',
      threshold: 30 // Days until regulatory deadline
    }
  ],
  conditionOperator: 'AND',
  actions: [
    {
      targetAgent: 'pmo',
      actionType: 'create_epic',
      attribute: 'epic_title',
      value: 'Compliance Debt Remediation',
      message: 'Auto-created epic for compliance debt due to low audit readiness'
    },
    {
      targetAgent: 'governance',
      actionType: 'alert',
      message: 'HIGH: Compliance epic created - audit readiness < 90% with 30 days to deadline',
      severity: 'high'
    }
  ],
  reasoning: 'Proactively address compliance gaps by creating highest-priority epic when audit deadline is near and readiness is insufficient'
};

/**
 * Gate D: Budget Overrun Circuit Breaker ⭐
 *
 * Trigger: IF FinOps.actual_spend_to_date > FinOps.allocated_budget
 * Action: PMO.flow_status = 'Blocked' AND VRO.recalculate roi_realized
 */
export const GATE_BUDGET_OVERRUN_CIRCUIT_BREAKER: LogicGate = {
  id: 'gate-d-budget-overrun-circuit-breaker',
  name: 'Budget Overrun Circuit Breaker',
  description: 'Block work and recalculate ROI when budget is exceeded',
  enabled: true,
  priority: 95,
  conditions: [
    {
      agentType: 'finops',
      attribute: 'actual_spend_to_date',
      operator: '>',
      threshold: 'allocated_budget' // Dynamic threshold from same agent
    }
  ],
  conditionOperator: 'AND',
  actions: [
    {
      targetAgent: 'pmo',
      actionType: 'block',
      attribute: 'flow_status',
      value: 'Blocked',
      message: 'Epic blocked due to budget overrun'
    },
    {
      targetAgent: 'vro',
      actionType: 'trigger_event',
      attribute: 'recalculate_roi',
      value: true,
      message: 'ROI recalculation triggered due to budget overrun'
    },
    {
      targetAgent: 'finops',
      actionType: 'alert',
      message: 'CRITICAL: Budget Violation - Epic Paused',
      severity: 'critical'
    }
  ],
  reasoning: 'Prevent further budget overruns by blocking work and reassessing value when allocated budget is exceeded'
};

/**
 * Gate E: Burnout Brake ⭐
 *
 * Trigger: IF OCM.burnout_risk_idx > 0.85
 * Action: Planning.load_vs_capacity_ratio = 'Invalid' AND TMO.trigger coaching_event
 */
export const GATE_BURNOUT_BRAKE: LogicGate = {
  id: 'gate-e-burnout-brake',
  name: 'Burnout Brake',
  description: 'Invalidate capacity planning and trigger coaching when burnout risk is high',
  enabled: true,
  priority: 85,
  conditions: [
    {
      agentType: 'ocm',
      attribute: 'burnout_risk_idx',
      operator: '>',
      threshold: 0.85
    }
  ],
  conditionOperator: 'AND',
  actions: [
    {
      targetAgent: 'planning',
      actionType: 'invalidate',
      attribute: 'load_vs_capacity_ratio',
      message: 'Capacity planning invalidated due to high burnout risk'
    },
    {
      targetAgent: 'tmo',
      actionType: 'trigger_event',
      attribute: 'coaching_event',
      value: true,
      message: 'Coaching event triggered for Scrum Master'
    },
    {
      targetAgent: 'ocm',
      actionType: 'alert',
      message: 'HIGH: Human Capital Risk - Reduce Load Immediately',
      severity: 'high'
    }
  ],
  reasoning: 'Protect human capital by invalidating capacity plans and triggering coaching when burnout risk exceeds 85%'
};

/**
 * All Logic Gates (sorted by priority)
 */
export const ALL_LOGIC_GATES: LogicGate[] = [
  GATE_COMPLIANCE_RISK_DEADBOLT,       // Priority 100
  GATE_BUDGET_OVERRUN_CIRCUIT_BREAKER, // Priority 95
  GATE_AUDIT_READY_BARRIER,            // Priority 90
  GATE_BURNOUT_BRAKE,                  // Priority 85
  GATE_MATURITY_SPEED_GOVERNOR         // Priority 80
].sort((a, b) => b.priority - a.priority);

/**
 * Logic Gate Evaluation Engine
 *
 * Evaluates all logic gates against current agent state and executes actions
 */
export class LogicGateEngine {
  /**
   * Evaluate all logic gates against current agent state
   * @param agentState Current state of all agents
   * @returns Array of triggered gates with their actions
   */
  static evaluate(agentState: Record<string, Record<string, any>>): {
    gate: LogicGate;
    triggered: boolean;
    actions: LogicGateAction[];
  }[] {
    const results = [];

    for (const gate of ALL_LOGIC_GATES) {
      if (!gate.enabled) {
        continue;
      }

      const triggered = this.evaluateGateConditions(gate, agentState);

      if (triggered) {
        results.push({
          gate,
          triggered: true,
          actions: gate.actions
        });
      }
    }

    return results;
  }

  /**
   * Evaluate gate conditions against agent state
   */
  private static evaluateGateConditions(
    gate: LogicGate,
    agentState: Record<string, Record<string, any>>
  ): boolean {
    const conditionResults = gate.conditions.map(condition => {
      const agent = agentState[condition.agentType];
      if (!agent) return false;

      const value = agent[condition.attribute];
      if (value === undefined) return false;

      return this.evaluateCondition(value, condition.operator, condition.threshold);
    });

    if (gate.conditionOperator === 'AND') {
      return conditionResults.every(result => result === true);
    } else {
      return conditionResults.some(result => result === true);
    }
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(
    value: any,
    operator: string,
    threshold: any
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value == threshold;
      case '!=':
        return value != threshold;
      default:
        return false;
    }
  }

  /**
   * Execute gate actions
   */
  static async executeActions(
    actions: LogicGateAction[],
    agentState: Record<string, Record<string, any>>
  ): Promise<void> {
    for (const action of actions) {
      switch (action.actionType) {
        case 'set_attribute':
          if (action.attribute && action.value !== undefined) {
            agentState[action.targetAgent][action.attribute] = action.value;
          }
          break;

        case 'block':
          if (action.attribute) {
            agentState[action.targetAgent][action.attribute] = action.value || 'Blocked';
          }
          break;

        case 'invalidate':
          if (action.attribute) {
            agentState[action.targetAgent][action.attribute] = null;
          }
          break;

        case 'create_epic':
          // TODO: Integrate with project management system to create epic
          console.log(`Creating epic: ${action.value} for ${action.targetAgent}`);
          break;

        case 'trigger_event':
          // TODO: Integrate with event system
          console.log(`Triggering event ${action.attribute} for ${action.targetAgent}`);
          break;

        case 'alert':
          // TODO: Integrate with alert system
          console.log(`Alert for ${action.targetAgent}: ${action.message}`);
          break;
      }
    }
  }
}
