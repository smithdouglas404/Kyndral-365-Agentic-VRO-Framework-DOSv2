/**
 * Logic Gates API Routes
 *
 * Endpoints for evaluating and executing Logic Gates that enable autonomous agent collaboration
 */

import type { Express } from "express";
import { storage as postgresStorage } from "../storage";
import { getPalantirStorageAdapter } from "../services/PalantirStorageAdapter.js";
const storage = getPalantirStorageAdapter(postgresStorage);
import { LogicGateEngine, ALL_LOGIC_GATES } from "../lib/AgentLogicGates";
import { ALL_SCENARIOS } from "../lib/AgentInteractionScenarios";

export function registerLogicGatesRoutes(app: Express) {
  /**
   * POST /api/logic-gates/evaluate
   *
   * Evaluates all Logic Gates against current agent state
   *
   * Body: {
   *   agentState: Record<string, Record<string, any>> - Current state of all agents
   * }
   *
   * Returns: Array of triggered gates with their actions
   */
  app.post("/api/logic-gates/evaluate", async (req, res) => {
    try {
      const { agentState } = req.body;

      if (!agentState) {
        return res.status(400).json({
          error: "Missing required field: agentState"
        });
      }

      // Evaluate all gates
      const results = LogicGateEngine.evaluate(agentState);

      // Filter to only triggered gates
      const triggeredGates = results.filter(r => r.triggered);

      return res.json({
        evaluatedAt: new Date().toISOString(),
        totalGatesEvaluated: ALL_LOGIC_GATES.length,
        triggeredCount: triggeredGates.length,
        triggeredGates: triggeredGates.map(r => ({
          gateId: r.gate.id,
          gateName: r.gate.name,
          priority: r.gate.priority,
          description: r.gate.description,
          reasoning: r.gate.reasoning,
          actions: r.actions
        }))
      });
    } catch (error: any) {
      console.error("Error evaluating logic gates:", error);
      return res.status(500).json({
        error: "Failed to evaluate logic gates",
        message: error.message
      });
    }
  });

  /**
   * POST /api/logic-gates/execute
   *
   * Executes actions for triggered gates
   *
   * Body: {
   *   actions: LogicGateAction[] - Actions to execute
   *   agentState: Record<string, Record<string, any>> - Current agent state
   * }
   *
   * Returns: Updated agent state after executing actions
   */
  app.post("/api/logic-gates/execute", async (req, res) => {
    try {
      const { actions, agentState } = req.body;

      if (!actions || !agentState) {
        return res.status(400).json({
          error: "Missing required fields: actions, agentState"
        });
      }

      // Execute actions
      await LogicGateEngine.executeActions(actions, agentState);

      return res.json({
        executedAt: new Date().toISOString(),
        actionsExecuted: actions.length,
        updatedAgentState: agentState
      });
    } catch (error: any) {
      console.error("Error executing logic gate actions:", error);
      return res.status(500).json({
        error: "Failed to execute logic gate actions",
        message: error.message
      });
    }
  });

  /**
   * GET /api/logic-gates/list
   *
   * Returns list of all defined Logic Gates
   */
  app.get("/api/logic-gates/list", async (req, res) => {
    try {
      return res.json({
        gates: ALL_LOGIC_GATES.map(gate => ({
          id: gate.id,
          name: gate.name,
          description: gate.description,
          enabled: gate.enabled,
          priority: gate.priority,
          conditionCount: gate.conditions.length,
          actionCount: gate.actions.length,
          reasoning: gate.reasoning
        }))
      });
    } catch (error: any) {
      console.error("Error listing logic gates:", error);
      return res.status(500).json({
        error: "Failed to list logic gates",
        message: error.message
      });
    }
  });

  /**
   * GET /api/logic-gates/:gateId
   *
   * Returns details of a specific Logic Gate
   */
  app.get("/api/logic-gates/:gateId", async (req, res) => {
    try {
      const { gateId } = req.params;

      const gate = ALL_LOGIC_GATES.find(g => g.id === gateId);

      if (!gate) {
        return res.status(404).json({
          error: "Logic gate not found",
          gateId
        });
      }

      return res.json({ gate });
    } catch (error: any) {
      console.error("Error getting logic gate:", error);
      return res.status(500).json({
        error: "Failed to get logic gate",
        message: error.message
      });
    }
  });

  /**
   * GET /api/logic-gates/scenarios/list
   *
   * Returns list of all agent interaction scenarios
   */
  app.get("/api/logic-gates/scenarios/list", async (req, res) => {
    try {
      return res.json({
        scenarios: ALL_SCENARIOS.map(scenario => ({
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
          participatingAgents: scenario.participatingAgents,
          outcome: scenario.outcome,
          businessValue: scenario.businessValue,
          stepCount: scenario.steps.length
        }))
      });
    } catch (error: any) {
      console.error("Error listing scenarios:", error);
      return res.status(500).json({
        error: "Failed to list scenarios",
        message: error.message
      });
    }
  });

  /**
   * GET /api/logic-gates/scenarios/:scenarioId
   *
   * Returns details of a specific agent interaction scenario
   */
  app.get("/api/logic-gates/scenarios/:scenarioId", async (req, res) => {
    try {
      const { scenarioId } = req.params;

      const scenario = ALL_SCENARIOS.find(s => s.id === scenarioId);

      if (!scenario) {
        return res.status(404).json({
          error: "Scenario not found",
          scenarioId
        });
      }

      return res.json({ scenario });
    } catch (error: any) {
      console.error("Error getting scenario:", error);
      return res.status(500).json({
        error: "Failed to get scenario",
        message: error.message
      });
    }
  });

  console.log("✅ Logic Gates routes registered");
}
