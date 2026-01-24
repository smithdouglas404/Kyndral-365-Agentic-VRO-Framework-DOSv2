/**
 * CUSTOM FIELD MANAGEMENT API
 * Admin endpoints for defining custom fields for projects, tasks, issues, etc.
 * Supports different field types, validation rules, and calculated fields
 */

import type { Express, Request, Response } from "express";
import { db } from "../../db.js";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Custom field definition
const CustomFieldSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  entityType: z.enum(['project', 'task', 'issue', 'risk', 'okr', 'resource']),
  fieldType: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email', 'calculated']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select/multiselect
  formula: z.string().optional(), // For calculated fields
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    customRule: z.string().optional(),
  }).optional(),
  defaultValue: z.any().optional(),
  isActive: z.boolean().default(true),
});

export function registerCustomFieldRoutes(app: Express) {

  // GET /api/admin/custom-fields - List all custom fields
  app.get("/api/admin/custom-fields", authenticate, async (req: Request, res: Response) => {
    try {
      const { entityType, isActive } = req.query;

      // Create custom fields table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS custom_fields (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          label TEXT NOT NULL,
          description TEXT,
          entity_type TEXT NOT NULL,
          field_type TEXT NOT NULL,
          required BOOLEAN DEFAULT false,
          options JSONB,
          formula TEXT,
          validation JSONB,
          default_value TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      let query = sql`SELECT * FROM custom_fields`;
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
        fields: result.rows,
      });
    } catch (error: any) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch custom fields",
        message: error.message,
      });
    }
  });

  // GET /api/admin/custom-fields/:id - Get single custom field
  app.get("/api/admin/custom-fields/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(
        sql`SELECT * FROM custom_fields WHERE id = ${id} LIMIT 1`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Custom field not found",
        });
      }

      res.json({
        success: true,
        field: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error fetching custom field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch custom field",
        message: error.message,
      });
    }
  });

  // POST /api/admin/custom-fields - Create new custom field
  app.post("/api/admin/custom-fields", authenticate, async (req: Request, res: Response) => {
    try {
      const validated = CustomFieldSchema.parse(req.body);

      const result = await db.execute(sql`
        INSERT INTO custom_fields (
          name, label, description, entity_type, field_type,
          required, options, formula, validation, default_value, is_active
        ) VALUES (
          ${validated.name},
          ${validated.label},
          ${validated.description || null},
          ${validated.entityType},
          ${validated.fieldType},
          ${validated.required},
          ${validated.options ? JSON.stringify(validated.options) : null},
          ${validated.formula || null},
          ${validated.validation ? JSON.stringify(validated.validation) : null},
          ${validated.defaultValue || null},
          ${validated.isActive}
        )
        RETURNING *
      `);

      res.status(201).json({
        success: true,
        field: result.rows[0],
        message: "Custom field created successfully",
      });
    } catch (error: any) {
      console.error("Error creating custom field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create custom field",
        message: error.message,
      });
    }
  });

  // PUT /api/admin/custom-fields/:id - Update custom field
  app.put("/api/admin/custom-fields/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = CustomFieldSchema.parse(req.body);

      const result = await db.execute(sql`
        UPDATE custom_fields SET
          name = ${validated.name},
          label = ${validated.label},
          description = ${validated.description || null},
          entity_type = ${validated.entityType},
          field_type = ${validated.fieldType},
          required = ${validated.required},
          options = ${validated.options ? JSON.stringify(validated.options) : null},
          formula = ${validated.formula || null},
          validation = ${validated.validation ? JSON.stringify(validated.validation) : null},
          default_value = ${validated.defaultValue || null},
          is_active = ${validated.isActive},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Custom field not found",
        });
      }

      res.json({
        success: true,
        field: result.rows[0],
        message: "Custom field updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating custom field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update custom field",
        message: error.message,
      });
    }
  });

  // DELETE /api/admin/custom-fields/:id - Delete custom field
  app.delete("/api/admin/custom-fields/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(
        sql`DELETE FROM custom_fields WHERE id = ${id} RETURNING id`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Custom field not found",
        });
      }

      res.json({
        success: true,
        message: "Custom field deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete custom field",
        message: error.message,
      });
    }
  });

  // POST /api/admin/custom-fields/:id/toggle - Toggle active status
  app.post("/api/admin/custom-fields/:id/toggle", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(sql`
        UPDATE custom_fields
        SET is_active = NOT is_active, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Custom field not found",
        });
      }

      res.json({
        success: true,
        field: result.rows[0],
        message: "Custom field status toggled successfully",
      });
    } catch (error: any) {
      console.error("Error toggling custom field:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle custom field",
        message: error.message,
      });
    }
  });

  // GET /api/admin/custom-fields/schema/:entityType - Get field schema for entity
  app.get("/api/admin/custom-fields/schema/:entityType", authenticate, async (req: Request, res: Response) => {
    try {
      const { entityType } = req.params;

      const result = await db.execute(sql`
        SELECT * FROM custom_fields
        WHERE entity_type = ${entityType} AND is_active = true
        ORDER BY created_at ASC
      `);

      res.json({
        success: true,
        entityType,
        fields: result.rows,
      });
    } catch (error: any) {
      console.error("Error fetching field schema:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch field schema",
        message: error.message,
      });
    }
  });

  console.log('✅ Custom field management routes registered');
}
