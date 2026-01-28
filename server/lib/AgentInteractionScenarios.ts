/**
 * AGENT INTERACTION SCENARIOS
 *
 * Concrete examples of how agents interact through Logic Gates
 * These scenarios demonstrate real-world agent collaboration patterns
 */

import { LogicGateEngine } from './AgentLogicGates';

export interface InteractionStep {
  stepNumber: number;
  agent: string;
  action: string;
  trigger?: string;
  result?: string;
}

export interface AgentInteractionScenario {
  id: string;
  name: string;
  description: string;
  participatingAgents: string[];
  steps: InteractionStep[];
  outcome: string;
  businessValue: string;
}

/**
 * Scenario A: Budget Overrun (FinOps ↔ PMO ↔ VRO)
 *
 * Flow: FinOps detects overrun → PMO blocks → VRO recalculates
 */
export const SCENARIO_BUDGET_OVERRUN: AgentInteractionScenario = {
  id: 'scenario-a-budget-overrun',
  name: 'Budget Overrun Auto-Response',
  description: 'Automatic response when project exceeds allocated budget',
  participatingAgents: ['finops', 'pmo', 'vro'],
  steps: [
    {
      stepNumber: 1,
      agent: 'finops',
      action: 'Detects budget violation',
      trigger: 'actual_spend_to_date ($1.2M) > allocated_budget ($1.0M)',
      result: 'Sends "Budget Violation" event'
    },
    {
      stepNumber: 2,
      agent: 'finops',
      action: 'Triggers Logic Gate D: Budget Overrun Circuit Breaker',
      result: 'Gate evaluates conditions and executes actions'
    },
    {
      stepNumber: 3,
      agent: 'pmo',
      action: 'Reacts to gate action',
      trigger: 'Receives set_attribute command from gate',
      result: 'Sets flow_status = "Blocked" for Epic XYZ-123'
    },
    {
      stepNumber: 4,
      agent: 'vro',
      action: 'Reacts to gate action',
      trigger: 'Receives trigger_event command from gate',
      result: 'Recalculates roi_realized based on new actuals'
    },
    {
      stepNumber: 5,
      agent: 'vro',
      action: 'Assesses if project is still viable',
      result: 'roi_realized drops from 2.5x to 1.8x - still positive but lower'
    }
  ],
  outcome: 'Epic automatically paused until budget review. VRO provides updated ROI for stakeholder decision.',
  businessValue: 'Prevents runaway spending and forces data-driven continuation decisions'
};

/**
 * Scenario B: Burnout Brake (OCM ↔ Planning ↔ TMO)
 *
 * Flow: OCM detects burnout risk → Planning invalidates capacity → TMO triggers coaching
 */
export const SCENARIO_BURNOUT_BRAKE: AgentInteractionScenario = {
  id: 'scenario-b-burnout-brake',
  name: 'Burnout Prevention Auto-Response',
  description: 'Automatic response when team burnout risk is detected',
  participatingAgents: ['ocm', 'planning', 'tmo'],
  steps: [
    {
      stepNumber: 1,
      agent: 'ocm',
      action: 'Detects high burnout risk',
      trigger: 'burnout_risk_idx (0.87) > 0.85 threshold',
      result: 'Correlation of high Flow Load + low eNPS detected'
    },
    {
      stepNumber: 2,
      agent: 'ocm',
      action: 'Triggers Logic Gate E: Burnout Brake',
      result: 'Gate evaluates conditions and executes actions'
    },
    {
      stepNumber: 3,
      agent: 'planning',
      action: 'Reacts to gate action',
      trigger: 'Receives invalidate command from gate',
      result: 'Flags load_vs_capacity_ratio as "Invalid" for next PI planning'
    },
    {
      stepNumber: 4,
      agent: 'tmo',
      action: 'Reacts to gate action',
      trigger: 'Receives trigger_event command from gate',
      result: 'Creates coaching_event for Scrum Master and RTE'
    },
    {
      stepNumber: 5,
      agent: 'tmo',
      action: 'Schedules intervention',
      result: 'Books 1-on-1 coaching session and schedules retrospective review'
    }
  ],
  outcome: 'Next PI planning uses reduced capacity. Team gets proactive coaching intervention.',
  businessValue: 'Protects human capital and prevents costly team attrition'
};

/**
 * Scenario C: Regulatory Deadbolt (Risk ↔ Governance ↔ PMO)
 *
 * Flow: Risk escalates exposure → Governance blocks gate → PMO reprioritizes
 */
export const SCENARIO_REGULATORY_DEADBOLT: AgentInteractionScenario = {
  id: 'scenario-c-regulatory-deadbolt',
  name: 'Compliance-Driven Release Block',
  description: 'Automatic release block when compliance or security risks detected',
  participatingAgents: ['risk', 'governance', 'pmo'],
  steps: [
    {
      stepNumber: 1,
      agent: 'risk',
      action: 'Updates risk exposure',
      trigger: 'exposure_value increases to $150K due to new legal requirement',
      result: 'Sends "Legal Exposure" update event'
    },
    {
      stepNumber: 2,
      agent: 'risk',
      action: 'Triggers Logic Gate A: Compliance-Risk Deadbolt',
      trigger: 'exposure_value ($150K) > $100K threshold',
      result: 'Gate evaluates conditions (exposure_value OR critical_vuln_count)'
    },
    {
      stepNumber: 3,
      agent: 'governance',
      action: 'Reacts to gate action',
      trigger: 'Receives set_attribute command from gate',
      result: 'Sets gate_status = "Blocked" - compliance gate closes'
    },
    {
      stepNumber: 4,
      agent: 'pmo',
      action: 'Reacts to gate action',
      trigger: 'Receives set_attribute command from gate',
      result: 'Moves flow_status from "Implementing" back to "Analyzing"'
    },
    {
      stepNumber: 5,
      agent: 'governance',
      action: 'Triggers audit readiness check',
      trigger: 'Gate blocked with high exposure',
      result: 'Checks audit_readiness (75%) < 90% AND regulatory_date < 30 days'
    },
    {
      stepNumber: 6,
      agent: 'governance',
      action: 'Triggers Logic Gate C: Audit-Ready Barrier',
      result: 'Creates "Compliance Debt" epic with highest priority'
    },
    {
      stepNumber: 7,
      agent: 'pmo',
      action: 'Receives epic creation command',
      result: 'Creates Epic "Compliance Debt Remediation" at top of stack rank'
    }
  ],
  outcome: 'Release blocked. Compliance debt epic auto-created and prioritized above all other work.',
  businessValue: 'Prevents regulatory penalties by enforcing compliance gates automatically'
};

/**
 * Scenario D: Maturity Governor in Action (TMO ↔ PMO ↔ Planning)
 *
 * Flow: TMO reports low competency → PMO reduces load → Planning adjusts next PI
 */
export const SCENARIO_MATURITY_GOVERNOR: AgentInteractionScenario = {
  id: 'scenario-d-maturity-governor',
  name: 'Team Maturity-Based Load Adjustment',
  description: 'Automatic load reduction when team agile maturity is low',
  participatingAgents: ['tmo', 'pmo', 'planning'],
  steps: [
    {
      stepNumber: 1,
      agent: 'tmo',
      action: 'Assesses team competency',
      trigger: 'competency_score calculated as 2.2 (below 2.5 threshold)',
      result: 'Team struggling with agile practices'
    },
    {
      stepNumber: 2,
      agent: 'tmo',
      action: 'Triggers Logic Gate B: Maturity-Speed Governor',
      result: 'Gate evaluates competency_score < 2.5'
    },
    {
      stepNumber: 3,
      agent: 'pmo',
      action: 'Reacts to gate action',
      trigger: 'Receives set_attribute command with multiplier 0.8',
      result: 'Reduces sprint_load_factor from 0.90 to 0.72 (20% reduction)'
    },
    {
      stepNumber: 4,
      agent: 'planning',
      action: 'Reads updated sprint_load_factor for next PI',
      result: 'load_vs_capacity_ratio adjusted from 85% to 68%'
    },
    {
      stepNumber: 5,
      agent: 'planning',
      action: 'Recalculates available capacity',
      result: 'Total capacity reduced from 100 points to 80 points for safety'
    },
    {
      stepNumber: 6,
      agent: 'tmo',
      action: 'Schedules coaching and training',
      result: 'Books SAFe training and agile coaching sessions'
    }
  ],
  outcome: 'Team load automatically reduced. Training scheduled. Team protected from overcommitment.',
  businessValue: 'Prevents delivery failures and burnout by matching load to actual team capability'
};

/**
 * All Agent Interaction Scenarios
 *
 * These scenarios need to be implemented as Langflow workflows.
 * Refer to ALL_AGENTS_WIRED.md for existing agent Flow IDs.
 *
 * TODO: Create Langflow workflows for each scenario that:
 * 1. Listen for Logic Gate triggers from agents
 * 2. Execute cross-agent communication via /api/agent-actions/notify/{agent}
 * 3. Update agent attributes via server API
 * 4. Create Jira/ServiceNow tickets as needed
 * 5. Send Slack notifications for critical events
 *
 * Testing will use real data from production agents, not simulated data.
 */
export const ALL_SCENARIOS: AgentInteractionScenario[] = [
  SCENARIO_BUDGET_OVERRUN,
  SCENARIO_BURNOUT_BRAKE,
  SCENARIO_REGULATORY_DEADBOLT,
  SCENARIO_MATURITY_GOVERNOR
];
