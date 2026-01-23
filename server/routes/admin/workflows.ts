/**
 * WORKFLOW MANAGEMENT API
 * Admin endpoints for defining approval workflows, escalation paths, and automated actions
 */

import type { Express, Request, Response } from "express";
import { db } from "../../db.js";
import { sql } from "drizzle-orm";
import { z } from "zod";

const WorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  entityType: z.enum(['project', 'task', 'issue', 'risk', 'change_request', 'budget_change']),
  trigger: z.object({
    type: z.enum(['manual', 'status_change', 'field_change', 'threshold', 'scheduled']),
    conditions: z.any(),
  }),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['approval', 'notification', 'action', 'condition', 'parallel', 'wait']),
    config: z.any(),
    approvers: z.array(z.string()).optional(),
    timeout: z.number().optional(),
    escalation: z.any().optional(),
  })),
  isActive: z.boolean().default(true),
});

export function registerWorkflowRoutes(app: Express) {

  // GET /api/admin/workflows - List all workflows
  app.get("/api/admin/workflows", async (req: Request, res: Response) => {
    try {
      const { entityType, isActive } = req.query;

      // Create workflows table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          description TEXT,
          entity_type TEXT NOT NULL,
          trigger JSONB NOT NULL,
          steps JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      let query = sql`SELECT * FROM workflows`;
      const conditions: any[] = [];

      if (entityType) {
        conditions.push(sql`entity_type = ${entityType}`);
      }

      if (isActive !== undefined) {
        conditions.push(sql`is_active = ${isActive === 'true'}`);
      }

      if (conditions.length > 0) {
        query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
      }

      query = sql`${query} ORDER BY created_at DESC`;

      const result = await db.execute(query);

      res.json({
        success: true,
        workflows: result.rows,
      });
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch workflows",
        message: error.message,
      });
    }
  });

  // POST /api/admin/workflows - Create new workflow
  app.post("/api/admin/workflows", async (req: Request, res: Response) => {
    try {
      const validated = WorkflowSchema.parse(req.body);

      const result = await db.execute(sql`
        INSERT INTO workflows (
          name, description, entity_type, trigger, steps, is_active
        ) VALUES (
          ${validated.name},
          ${validated.description || null},
          ${validated.entityType},
          ${JSON.stringify(validated.trigger)},
          ${JSON.stringify(validated.steps)},
          ${validated.isActive}
        )
        RETURNING *
      `);

      res.status(201).json({
        success: true,
        workflow: result.rows[0],
        message: "Workflow created successfully",
      });
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create workflow",
        message: error.message,
      });
    }
  });

  // PUT /api/admin/workflows/:id - Update workflow
  app.put("/api/admin/workflows/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = WorkflowSchema.parse(req.body);

      const result = await db.execute(sql`
        UPDATE workflows SET
          name = ${validated.name},
          description = ${validated.description || null},
          entity_type = ${validated.entityType},
          trigger = ${JSON.stringify(validated.trigger)},
          steps = ${JSON.stringify(validated.steps)},
          is_active = ${validated.isActive},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      res.json({
        success: true,
        workflow: result.rows[0],
        message: "Workflow updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating workflow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update workflow",
        message: error.message,
      });
    }
  });

  // DELETE /api/admin/workflows/:id - Delete workflow
  app.delete("/api/admin/workflows/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(
        sql`DELETE FROM workflows WHERE id = ${id} RETURNING id`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      res.json({
        success: true,
        message: "Workflow deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete workflow",
        message: error.message,
      });
    }
  });

  // POST /api/admin/workflows/:id/toggle - Toggle active status
  app.post("/api/admin/workflows/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(sql`
        UPDATE workflows
        SET is_active = NOT is_active, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      res.json({
        success: true,
        workflow: result.rows[0],
        message: "Workflow status toggled successfully",
      });
    } catch (error: any) {
      console.error("Error toggling workflow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle workflow",
        message: error.message,
      });
    }
  });

  // GET /api/workflows/execute/:id - Execute workflow (for testing)
  app.post("/api/workflows/execute/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { context } = req.body;

      const result = await db.execute(
        sql`SELECT * FROM workflows WHERE id = ${id} AND is_active = true LIMIT 1`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found or inactive",
        });
      }

      const workflow = result.rows[0];

      // TODO: Implement actual workflow execution engine
      // For now, return a simulated execution result
      const executionResult = {
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: 'completed',
        steps: workflow.steps.map((step: any) => ({
          stepId: step.id,
          type: step.type,
          status: 'completed',
          completedAt: new Date().toISOString(),
        })),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        execution: executionResult,
      });
    } catch (error: any) {
      console.error("Error executing workflow:", error);
      res.status(500).json({
        success: false,
        error: "Failed to execute workflow",
        message: error.message,
      });
    }
  });

  console.log('✅ Workflow management routes registered');
}
