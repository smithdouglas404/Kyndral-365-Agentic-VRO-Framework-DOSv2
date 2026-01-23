import { Router } from "express";
import type { IStorage } from "../storage";

export function createCOPRoutes(storage: IStorage): Router {
  const router = Router();

  // Get Strategic Layer data (VRO - 6-12 months)
  router.get("/strategic", async (_req, res) => {
    try {
      // Get portfolio-level strategic metrics
      const portfolioMetrics = await storage.db.query(`
        SELECT
          COUNT(*) as total_projects,
          COALESCE(AVG(CAST(NULLIF(meta->>'expected_roi', '') AS NUMERIC)), 0) as avg_roi,
          COALESCE(SUM(CAST(NULLIF(meta->>'planned_value', '') AS NUMERIC)), 0) as total_planned_value,
          COALESCE(SUM(CAST(NULLIF(meta->>'actual_value', '') AS NUMERIC)), 0) as total_actual_value,
          COUNT(*) FILTER (WHERE status = 'active') as active_projects,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_projects
        FROM projects
        WHERE status IN ('active', 'planning', 'completed')
      `);

      // Get strategic initiatives
      const initiatives = await storage.db.query(`
        SELECT
          id,
          name,
          description,
          status,
          meta->>'expected_roi' as expected_roi,
          meta->>'planned_value' as planned_value,
          meta->>'strategic_alignment' as strategic_alignment,
          start_date,
          end_date,
          (
            SELECT COUNT(*)
            FROM projects p2
            WHERE p2.meta->>'parent_initiative' = p.id
          ) as child_project_count
        FROM projects p
        WHERE meta->>'is_strategic_initiative' = 'true'
        ORDER BY meta->>'planned_value' DESC
        LIMIT 10
      `);

      // Get value leakage analysis
      const valueLeakage = await storage.db.query(`
        SELECT
          COUNT(*) as projects_with_leakage,
          COALESCE(SUM(
            CAST(NULLIF(meta->>'planned_value', '') AS NUMERIC) -
            CAST(NULLIF(meta->>'actual_value', '') AS NUMERIC)
          ), 0) as total_value_leakage
        FROM projects
        WHERE
          status IN ('active', 'completed')
          AND CAST(NULLIF(meta->>'actual_value', '') AS NUMERIC) <
              CAST(NULLIF(meta->>'planned_value', '') AS NUMERIC)
      `);

      res.json({
        success: true,
        layer: "strategic",
        horizon: "6-12 months",
        metrics: portfolioMetrics.rows[0],
        initiatives: initiatives.rows,
        valueLeakage: valueLeakage.rows[0]
      });
    } catch (error: any) {
      console.error("Error fetching strategic layer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Operational Layer data (TMO - 3-6 months)
  router.get("/operational", async (_req, res) => {
    try {
      // Get roadmap health metrics
      const roadmapHealth = await storage.db.query(`
        SELECT
          COUNT(*) as total_active_projects,
          COUNT(*) FILTER (WHERE meta->>'technical_debt_score' IS NOT NULL
            AND CAST(meta->>'technical_debt_score' AS NUMERIC) > 70) as high_debt_projects,
          COUNT(*) FILTER (WHERE meta->>'has_blockers' = 'true') as blocked_projects,
          AVG(CAST(NULLIF(meta->>'resource_utilization', '') AS NUMERIC)) as avg_resource_utilization
        FROM projects
        WHERE status = 'active'
      `);

      // Get cross-functional dependencies
      const dependencies = await storage.db.query(`
        SELECT
          p1.id as source_project_id,
          p1.name as source_project_name,
          p2.id as target_project_id,
          p2.name as target_project_name,
          dep.meta->>'status' as dependency_status,
          dep.meta->>'blocker_reason' as blocker_reason,
          dep.meta->>'impact' as impact
        FROM projects p1
        CROSS JOIN LATERAL jsonb_array_elements(p1.meta->'dependencies') dep
        LEFT JOIN projects p2 ON dep->>'project_id' = p2.id
        WHERE p1.status = 'active'
        AND dep->>'status' IN ('blocked', 'at-risk')
        LIMIT 20
      `);

      // Get architecture decisions pending
      const architectureDecisions = await storage.db.query(`
        SELECT
          COUNT(*) as pending_decisions,
          jsonb_agg(
            jsonb_build_object(
              'project_id', id,
              'project_name', name,
              'decision_required', meta->'architecture_decisions'
            )
          ) FILTER (WHERE meta->'architecture_decisions' IS NOT NULL) as decisions
        FROM projects
        WHERE status = 'active'
        AND meta->'architecture_decisions' IS NOT NULL
      `);

      res.json({
        success: true,
        layer: "operational",
        horizon: "3-6 months",
        roadmapHealth: roadmapHealth.rows[0],
        dependencies: dependencies.rows,
        architectureDecisions: architectureDecisions.rows[0]
      });
    } catch (error: any) {
      console.error("Error fetching operational layer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Tactical Layer data (PMO - Current week)
  router.get("/tactical", async (_req, res) => {
    try {
      // Get current week metrics
      const weekMetrics = await storage.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') as active_projects,
          COUNT(*) FILTER (WHERE meta->>'has_blockers' = 'true') as blocked_projects,
          COALESCE(AVG(CAST(NULLIF(meta->>'sprint_velocity', '') AS NUMERIC)), 0) as avg_velocity,
          COUNT(*) FILTER (WHERE meta->>'sprint_status' = 'on-track') as on_track_sprints,
          COUNT(*) FILTER (WHERE meta->>'sprint_status' = 'at-risk') as at_risk_sprints
        FROM projects
        WHERE status = 'active'
      `);

      // Get active sprints this week
      const activeSprints = await storage.db.query(`
        SELECT
          id,
          name,
          meta->>'team' as team,
          meta->>'sprint_velocity' as velocity,
          meta->>'sprint_status' as status,
          meta->>'sprint_progress' as progress,
          meta->>'blockers' as blockers
        FROM projects
        WHERE status = 'active'
        AND meta->>'sprint_active' = 'true'
        ORDER BY name
        LIMIT 20
      `);

      // Get blockers requiring immediate attention
      const blockers = await storage.db.query(`
        SELECT
          p.id as project_id,
          p.name as project_name,
          blocker->>'description' as blocker_description,
          blocker->>'severity' as severity,
          blocker->>'created_at' as created_at
        FROM projects p
        CROSS JOIN LATERAL jsonb_array_elements(p.meta->'blockers') blocker
        WHERE p.status = 'active'
        AND blocker->>'resolved' = 'false'
        ORDER BY
          CASE blocker->>'severity'
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            ELSE 4
          END,
          blocker->>'created_at' DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        layer: "tactical",
        horizon: "current week",
        weekMetrics: weekMetrics.rows[0],
        activeSprints: activeSprints.rows,
        blockers: blockers.rows
      });
    } catch (error: any) {
      console.error("Error fetching tactical layer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Action Queue - What needs attention TODAY
  router.get("/action-queue", async (_req, res) => {
    try {
      // Get critical actions from various sources
      const criticalDecisions = await storage.db.query(`
        SELECT
          'decision' as type,
          'immediate' as urgency,
          p.name || ' - Decision Node pending' as title,
          'Battle Rhythm Orchestrator' as source,
          dn.decision_date as due_date
        FROM decision_nodes dn
        JOIN projects p ON dn.project_id = p.id
        WHERE dn.decision_date = CURRENT_DATE
        AND dn.outcome IS NULL
      `);

      const criticalBlockers = await storage.db.query(`
        SELECT
          'blocker' as type,
          'today' as urgency,
          p.name || ' - ' || blocker->>'description' as title,
          'TMO Agent' as source,
          CURRENT_DATE as due_date
        FROM projects p
        CROSS JOIN LATERAL jsonb_array_elements(p.meta->'blockers') blocker
        WHERE p.status = 'active'
        AND blocker->>'severity' = 'critical'
        AND blocker->>'resolved' = 'false'
        LIMIT 5
      `);

      const budgetRisks = await storage.db.query(`
        SELECT
          'risk' as type,
          'this-week' as urgency,
          p.name || ' - Budget overrun detected' as title,
          'FinOps Agent' as source,
          CURRENT_DATE + INTERVAL '2 days' as due_date
        FROM projects p
        WHERE p.status = 'active'
        AND CAST(NULLIF(p.meta->>'cpi', '') AS NUMERIC) < 0.85
        LIMIT 5
      `);

      // Combine all actions
      const allActions = [
        ...criticalDecisions.rows,
        ...criticalBlockers.rows,
        ...budgetRisks.rows
      ];

      res.json({
        success: true,
        actionQueue: allActions,
        urgentCount: allActions.filter(a => a.urgency === 'immediate').length,
        todayCount: allActions.filter(a => a.urgency === 'today').length
      });
    } catch (error: any) {
      console.error("Error fetching action queue:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get full COP (all three layers + action queue)
  router.get("/full", async (_req, res) => {
    try {
      // Make parallel requests to all layers
      const [strategicResult, operationalResult, tacticalResult, actionQueueResult] = await Promise.all([
        storage.db.query(`
          SELECT
            COUNT(*) as total_projects,
            COALESCE(AVG(CAST(NULLIF(meta->>'expected_roi', '') AS NUMERIC)), 0) as avg_roi
          FROM projects
          WHERE status IN ('active', 'planning', 'completed')
        `),
        storage.db.query(`
          SELECT
            COUNT(*) as total_active_projects,
            COUNT(*) FILTER (WHERE meta->>'has_blockers' = 'true') as blocked_projects
          FROM projects
          WHERE status = 'active'
        `),
        storage.db.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'active') as active_projects,
            COALESCE(AVG(CAST(NULLIF(meta->>'sprint_velocity', '') AS NUMERIC)), 0) as avg_velocity
          FROM projects
          WHERE status = 'active'
        `),
        storage.db.query(`
          SELECT COUNT(*) as urgent_actions
          FROM decision_nodes
          WHERE decision_date = CURRENT_DATE
          AND outcome IS NULL
        `)
      ]);

      res.json({
        success: true,
        cop: {
          strategic: strategicResult.rows[0],
          operational: operationalResult.rows[0],
          tactical: tacticalResult.rows[0],
          actionQueue: actionQueueResult.rows[0]
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching full COP:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
