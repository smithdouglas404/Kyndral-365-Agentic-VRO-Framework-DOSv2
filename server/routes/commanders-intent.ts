import { Router } from "express";
import type { IStorage } from "../storage";

export function createCommandersIntentRoutes(storage: IStorage): Router {
  const router = Router();

  // Get Commander's Intent for a project
  router.get("/project/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const result = await storage.db.query(`
        SELECT * FROM commanders_intent
        WHERE project_id = $1 AND status = 'active'
        ORDER BY version DESC
        LIMIT 1
      `, [projectId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Commander's Intent not found for this project" });
      }

      res.json({ success: true, intent: result.rows[0] });
    } catch (error: any) {
      console.error("Error fetching Commander's Intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all versions of Commander's Intent for a project
  router.get("/project/:projectId/history", async (req, res) => {
    try {
      const { projectId } = req.params;
      const result = await storage.db.query(`
        SELECT * FROM commanders_intent
        WHERE project_id = $1
        ORDER BY version DESC
      `, [projectId]);

      res.json({ success: true, history: result.rows });
    } catch (error: any) {
      console.error("Error fetching Commander's Intent history:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create new Commander's Intent
  router.post("/", async (req, res) => {
    try {
      const {
        id,
        projectId,
        purpose,
        keyTasks,
        endState,
        riskTolerance,
        decisionAuthority,
        status,
        version,
        createdBy
      } = req.body;

      // Validate required fields
      if (!projectId || !purpose || !keyTasks || !endState) {
        return res.status(400).json({
          error: "Missing required fields: projectId, purpose, keyTasks, endState"
        });
      }

      // If creating active intent, archive previous active intents for this project
      if (status === 'active') {
        await storage.db.query(`
          UPDATE commanders_intent
          SET status = 'superseded', updated_at = NOW()
          WHERE project_id = $1 AND status = 'active'
        `, [projectId]);
      }

      // Get next version number
      const versionResult = await storage.db.query(`
        SELECT COALESCE(MAX(version), 0) + 1 as next_version
        FROM commanders_intent
        WHERE project_id = $1
      `, [projectId]);
      const nextVersion = version || versionResult.rows[0].next_version;

      const result = await storage.db.query(`
        INSERT INTO commanders_intent (
          id, project_id, purpose, key_tasks, end_state,
          risk_tolerance, decision_authority, status, version, created_by,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `, [
        id || `ci-${Date.now()}`,
        projectId,
        purpose,
        keyTasks,
        endState,
        JSON.stringify(riskTolerance),
        JSON.stringify(decisionAuthority),
        status || 'draft',
        nextVersion,
        createdBy
      ]);

      res.json({ success: true, intent: result.rows[0] });
    } catch (error: any) {
      console.error("Error creating Commander's Intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Commander's Intent
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        purpose,
        keyTasks,
        endState,
        riskTolerance,
        decisionAuthority,
        status
      } = req.body;

      const result = await storage.db.query(`
        UPDATE commanders_intent
        SET
          purpose = COALESCE($1, purpose),
          key_tasks = COALESCE($2, key_tasks),
          end_state = COALESCE($3, end_state),
          risk_tolerance = COALESCE($4, risk_tolerance),
          decision_authority = COALESCE($5, decision_authority),
          status = COALESCE($6, status),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [purpose, keyTasks, endState,
          riskTolerance ? JSON.stringify(riskTolerance) : null,
          decisionAuthority ? JSON.stringify(decisionAuthority) : null,
          status, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Commander's Intent not found" });
      }

      res.json({ success: true, intent: result.rows[0] });
    } catch (error: any) {
      console.error("Error updating Commander's Intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Activate Commander's Intent (supersede previous)
  router.post("/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;

      // Get the intent to find its project
      const intentResult = await storage.db.query(`
        SELECT project_id FROM commanders_intent WHERE id = $1
      `, [id]);

      if (intentResult.rows.length === 0) {
        return res.status(404).json({ error: "Commander's Intent not found" });
      }

      const projectId = intentResult.rows[0].project_id;

      // Archive previous active intents
      await storage.db.query(`
        UPDATE commanders_intent
        SET status = 'superseded', updated_at = NOW()
        WHERE project_id = $1 AND status = 'active'
      `, [projectId]);

      // Activate this intent
      const result = await storage.db.query(`
        UPDATE commanders_intent
        SET status = 'active', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      res.json({ success: true, intent: result.rows[0] });
    } catch (error: any) {
      console.error("Error activating Commander's Intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Archive Commander's Intent
  router.post("/:id/archive", async (req, res) => {
    try {
      const { id } = req.params;

      const result = await storage.db.query(`
        UPDATE commanders_intent
        SET status = 'archived', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Commander's Intent not found" });
      }

      res.json({ success: true, intent: result.rows[0] });
    } catch (error: any) {
      console.error("Error archiving Commander's Intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all active Commander's Intents (portfolio view)
  router.get("/active", async (_req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT ci.*, p.name as project_name
        FROM commanders_intent ci
        LEFT JOIN projects p ON ci.project_id = p.id
        WHERE ci.status = 'active'
        ORDER BY ci.updated_at DESC
      `);

      res.json({ success: true, intents: result.rows });
    } catch (error: any) {
      console.error("Error fetching active Commander's Intents:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Validate Commander's Intent completeness
  router.get("/:id/validate", async (req, res) => {
    try {
      const { id } = req.params;

      const result = await storage.db.query(`
        SELECT * FROM commanders_intent WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Commander's Intent not found" });
      }

      const intent = result.rows[0];
      const issues: string[] = [];

      if (!intent.purpose || intent.purpose.trim().length < 50) {
        issues.push("Purpose is too short or missing (minimum 50 characters)");
      }

      if (!intent.key_tasks || intent.key_tasks.trim().length < 50) {
        issues.push("Key Tasks are too short or missing (minimum 50 characters)");
      }

      if (!intent.end_state || intent.end_state.trim().length < 50) {
        issues.push("End State is too short or missing (minimum 50 characters)");
      }

      const isComplete = issues.length === 0;

      res.json({
        success: true,
        isComplete,
        issues,
        intent
      });
    } catch (error: any) {
      console.error("Error validating Commander's Intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
