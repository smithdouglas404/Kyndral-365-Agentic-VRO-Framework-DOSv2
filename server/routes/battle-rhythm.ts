import { Router } from "express";
import type { IStorage } from "../storage";

export function createBattleRhythmRoutes(storage: IStorage): Router {
  const router = Router();

  // Get current week's Battle Rhythm status
  router.get("/current-week", async (_req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT * FROM current_week_battle_rhythm LIMIT 1
      `);
      res.json({ success: true, data: result.rows[0] || null });
    } catch (error: any) {
      console.error("Error fetching current week Battle Rhythm:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all syntheses for a specific week
  router.get("/week/:weekOf", async (req, res) => {
    try {
      const { weekOf } = req.params;
      const result = await storage.db.query(`
        SELECT * FROM battle_rhythm_syntheses
        WHERE week_of = $1
        ORDER BY generated_at DESC
      `, [weekOf]);
      res.json({ success: true, syntheses: result.rows });
    } catch (error: any) {
      console.error("Error fetching week syntheses:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific event synthesis
  router.get("/synthesis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.db.query(`
        SELECT * FROM battle_rhythm_syntheses WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Synthesis not found" });
      }

      res.json({ success: true, synthesis: result.rows[0] });
    } catch (error: any) {
      console.error("Error fetching synthesis:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Battle Rhythm configuration
  router.get("/config", async (_req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT * FROM battle_rhythm_config WHERE id = 'default'
      `);
      res.json({ success: true, config: result.rows[0] });
    } catch (error: any) {
      console.error("Error fetching Battle Rhythm config:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Battle Rhythm configuration
  router.put("/config", async (req, res) => {
    try {
      const {
        timezone,
        scrum_of_scrums_day,
        scrum_of_scrums_hour,
        scrum_of_scrums_minute,
        cross_functional_opt_day,
        cross_functional_opt_hour,
        cross_functional_opt_minute,
        decision_node_day,
        decision_node_hour,
        decision_node_minute,
        value_pulse_day,
        value_pulse_hour,
        value_pulse_minute,
        weekly_orders_day,
        weekly_orders_hour,
        weekly_orders_minute,
        enabled
      } = req.body;

      const result = await storage.db.query(`
        UPDATE battle_rhythm_config
        SET
          timezone = COALESCE($1, timezone),
          scrum_of_scrums_day = COALESCE($2, scrum_of_scrums_day),
          scrum_of_scrums_hour = COALESCE($3, scrum_of_scrums_hour),
          scrum_of_scrums_minute = COALESCE($4, scrum_of_scrums_minute),
          cross_functional_opt_day = COALESCE($5, cross_functional_opt_day),
          cross_functional_opt_hour = COALESCE($6, cross_functional_opt_hour),
          cross_functional_opt_minute = COALESCE($7, cross_functional_opt_minute),
          decision_node_day = COALESCE($8, decision_node_day),
          decision_node_hour = COALESCE($9, decision_node_hour),
          decision_node_minute = COALESCE($10, decision_node_minute),
          value_pulse_day = COALESCE($11, value_pulse_day),
          value_pulse_hour = COALESCE($12, value_pulse_hour),
          value_pulse_minute = COALESCE($13, value_pulse_minute),
          weekly_orders_day = COALESCE($14, weekly_orders_day),
          weekly_orders_hour = COALESCE($15, weekly_orders_hour),
          weekly_orders_minute = COALESCE($16, weekly_orders_minute),
          enabled = COALESCE($17, enabled),
          updated_at = NOW()
        WHERE id = 'default'
        RETURNING *
      `, [
        timezone, scrum_of_scrums_day, scrum_of_scrums_hour, scrum_of_scrums_minute,
        cross_functional_opt_day, cross_functional_opt_hour, cross_functional_opt_minute,
        decision_node_day, decision_node_hour, decision_node_minute,
        value_pulse_day, value_pulse_hour, value_pulse_minute,
        weekly_orders_day, weekly_orders_hour, weekly_orders_minute,
        enabled
      ]);

      res.json({ success: true, config: result.rows[0] });
    } catch (error: any) {
      console.error("Error updating Battle Rhythm config:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get decision nodes for a project
  router.get("/decisions/project/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const result = await storage.db.query(`
        SELECT * FROM decision_nodes
        WHERE project_id = $1
        ORDER BY decision_date DESC
      `, [projectId]);
      res.json({ success: true, decisions: result.rows });
    } catch (error: any) {
      console.error("Error fetching project decisions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a decision node (Kill/Continue/Pivot)
  router.post("/decisions", async (req, res) => {
    try {
      const {
        id,
        projectId,
        decisionType,
        decisionDate,
        reasoning,
        decidedBy,
        supportingData
      } = req.body;

      if (!projectId || !decisionType || !decisionDate || !reasoning) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!['kill', 'continue', 'pivot'].includes(decisionType)) {
        return res.status(400).json({ error: "Decision type must be kill, continue, or pivot" });
      }

      const result = await storage.db.query(`
        INSERT INTO decision_nodes (
          id, project_id, decision_type, decision_date, reasoning,
          decided_by, supporting_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        id || `dn-${Date.now()}`,
        projectId,
        decisionType,
        decisionDate,
        reasoning,
        decidedBy,
        JSON.stringify(supportingData || {})
      ]);

      res.json({ success: true, decision: result.rows[0] });
    } catch (error: any) {
      console.error("Error creating decision node:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update decision outcome
  router.patch("/decisions/:id/outcome", async (req, res) => {
    try {
      const { id } = req.params;
      const { outcome, outcomeDate, outcomeMatchedPrediction } = req.body;

      const result = await storage.db.query(`
        UPDATE decision_nodes
        SET
          outcome = $1,
          outcome_date = $2,
          outcome_matched_prediction = $3
        WHERE id = $4
        RETURNING *
      `, [outcome, outcomeDate, outcomeMatchedPrediction, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Decision not found" });
      }

      res.json({ success: true, decision: result.rows[0] });
    } catch (error: any) {
      console.error("Error updating decision outcome:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get decision effectiveness metrics
  router.get("/decisions/effectiveness", async (_req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT * FROM decision_effectiveness
      `);
      res.json({ success: true, effectiveness: result.rows });
    } catch (error: any) {
      console.error("Error fetching decision effectiveness:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get weekly orders
  router.get("/weekly-orders", async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const result = await storage.db.query(`
        SELECT * FROM weekly_orders
        ORDER BY week_of DESC
        LIMIT $1
      `, [limit]);
      res.json({ success: true, orders: result.rows });
    } catch (error: any) {
      console.error("Error fetching weekly orders:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create weekly orders
  router.post("/weekly-orders", async (req, res) => {
    try {
      const {
        id,
        weekOf,
        issuedBy,
        intentUpdates,
        priorities,
        knownRisks
      } = req.body;

      const result = await storage.db.query(`
        INSERT INTO weekly_orders (
          id, week_of, issued_by, intent_updates, priorities, known_risks,
          distributed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [
        id || `wo-${Date.now()}`,
        weekOf,
        issuedBy,
        intentUpdates,
        priorities,
        knownRisks
      ]);

      res.json({ success: true, order: result.rows[0] });
    } catch (error: any) {
      console.error("Error creating weekly orders:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get authority matrix
  router.get("/authority-matrix", async (_req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT * FROM authority_matrix
        ORDER BY
          CASE decision_level
            WHEN 'strategic' THEN 1
            WHEN 'operational' THEN 2
            WHEN 'tactical' THEN 3
          END,
          decision_type
      `);
      res.json({ success: true, matrix: result.rows });
    } catch (error: any) {
      console.error("Error fetching authority matrix:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check decision authority for specific decision type
  router.get("/authority-matrix/:decisionType", async (req, res) => {
    try {
      const { decisionType } = req.params;
      const result = await storage.db.query(`
        SELECT * FROM authority_matrix WHERE decision_type = $1
      `, [decisionType]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Decision type not found in authority matrix" });
      }

      res.json({ success: true, authority: result.rows[0] });
    } catch (error: any) {
      console.error("Error fetching authority for decision:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
