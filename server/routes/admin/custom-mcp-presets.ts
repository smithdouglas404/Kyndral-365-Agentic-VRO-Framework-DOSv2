/**
 * CUSTOM MCP PRESET MANAGEMENT
 *
 * Allows admins to define custom integrations without code!
 * - Add any tool with REST/GraphQL/OData API
 * - Test connection before saving
 * - Automatically appears in MCP Marketplace
 * - Share back to community (optional)
 */

import type { Express, Request, Response } from 'express';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import { authenticate } from '../../auth/authMiddleware.js';
import { z } from 'zod';

const CustomMCPPresetSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['enterprise_ppm', 'agile_vro', 'collaboration', 'development', 'documentation', 'finance', 'notification']),

  // API Configuration
  apiType: z.enum(['rest', 'graphql', 'odata', 'soap']),
  authType: z.enum(['basic', 'bearer', 'oauth2', 'api_key', 'custom']),
  baseUrl: z.string().url().optional(),

  // Endpoints
  endpoints: z.object({
    projects: z.string().optional(),
    tasks: z.string().optional(),
    users: z.string().optional(),
    statuses: z.string().optional(),
  }),

  // Field Mappings
  fieldMappings: z.object({
    project: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      status: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      owner: z.string().optional(),
      budget: z.string().optional(),
    }),
    task: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
    }).optional(),
  }),

  // Status Mappings
  statusMappings: z.record(z.enum(['active', 'planning', 'completed', 'on_hold', 'cancelled'])),

  // Pagination (optional)
  pagination: z.object({
    type: z.enum(['offset', 'cursor', 'page']),
    limitParam: z.string(),
    offsetParam: z.string().optional(),
    cursorParam: z.string().optional(),
    defaultLimit: z.number(),
  }).optional(),

  // Rate Limiting (optional)
  rateLimit: z.object({
    requestsPerSecond: z.number(),
    burstSize: z.number(),
  }).optional(),

  // Visibility
  isPublic: z.boolean().default(false), // Share with community
  isActive: z.boolean().default(true),
});

export function registerCustomMCPPresetRoutes(app: Express) {
  // Create table if not exists
  async function ensureTable() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS custom_mcp_presets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,

        api_type TEXT NOT NULL,
        auth_type TEXT NOT NULL,
        base_url TEXT,

        endpoints JSONB NOT NULL,
        field_mappings JSONB NOT NULL,
        status_mappings JSONB NOT NULL,
        pagination JSONB,
        rate_limit JSONB,

        is_public BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,

        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        test_connection_status TEXT,
        test_connection_message TEXT,
        last_tested_at TIMESTAMP
      )
    `);
  }

  /**
   * GET /api/admin/custom-mcp-presets
   * List all custom presets (for this org + public ones)
   */
  app.get('/api/admin/custom-mcp-presets', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTable();

      // Get all custom presets
      const result = await db.execute(sql`
        SELECT * FROM custom_mcp_presets
        WHERE is_active = true
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        presets: result.rows,
      });
    } catch (error: any) {
      console.error('[CustomMCPPresets] Error fetching presets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch custom presets',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/custom-mcp-presets/:id
   * Get single custom preset
   */
  app.get('/api/admin/custom-mcp-presets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTable();
      const { id } = req.params;

      const result = await db.execute(sql`
        SELECT * FROM custom_mcp_presets
        WHERE id = ${id}
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Custom preset not found',
        });
      }

      res.json({
        success: true,
        preset: result.rows[0],
      });
    } catch (error: any) {
      console.error('[CustomMCPPresets] Error fetching preset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch preset',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/custom-mcp-presets
   * Create new custom preset
   */
  app.post('/api/admin/custom-mcp-presets', authenticate, async (req: Request, res: Response) => {
    try {
      // Only system admins can create custom presets
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can create custom MCP presets',
        });
      }

      await ensureTable();

      // Validate request body
      const validated = CustomMCPPresetSchema.parse(req.body);

      // Check if name already exists
      const existing = await db.execute(sql`
        SELECT id FROM custom_mcp_presets WHERE name = ${validated.name}
      `);

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'A preset with this name already exists',
        });
      }

      // Insert new preset
      const result = await db.execute(sql`
        INSERT INTO custom_mcp_presets (
          name, display_name, description, category,
          api_type, auth_type, base_url,
          endpoints, field_mappings, status_mappings,
          pagination, rate_limit,
          is_public, is_active,
          created_by
        ) VALUES (
          ${validated.name},
          ${validated.displayName},
          ${validated.description || null},
          ${validated.category},
          ${validated.apiType},
          ${validated.authType},
          ${validated.baseUrl || null},
          ${JSON.stringify(validated.endpoints)},
          ${JSON.stringify(validated.fieldMappings)},
          ${JSON.stringify(validated.statusMappings)},
          ${validated.pagination ? JSON.stringify(validated.pagination) : null},
          ${validated.rateLimit ? JSON.stringify(validated.rateLimit) : null},
          ${validated.isPublic},
          ${validated.isActive},
          ${req.user?.email || 'system'}
        )
        RETURNING *
      `);

      console.log(`[CustomMCPPresets] Created preset: ${validated.name}`);

      res.status(201).json({
        success: true,
        preset: result.rows[0],
        message: 'Custom MCP preset created successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('[CustomMCPPresets] Error creating preset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create custom preset',
        message: error.message,
      });
    }
  });

  /**
   * PUT /api/admin/custom-mcp-presets/:id
   * Update custom preset
   */
  app.put('/api/admin/custom-mcp-presets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can update custom MCP presets',
        });
      }

      await ensureTable();
      const { id } = req.params;

      // Check if exists
      const existing = await db.execute(sql`
        SELECT id FROM custom_mcp_presets WHERE id = ${id}
      `);

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Custom preset not found',
        });
      }

      // Validate update
      const validated = CustomMCPPresetSchema.partial().parse(req.body);

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (validated.displayName) {
        updates.push(`display_name = $${values.length + 1}`);
        values.push(validated.displayName);
      }
      if (validated.description !== undefined) {
        updates.push(`description = $${values.length + 1}`);
        values.push(validated.description);
      }
      if (validated.category) {
        updates.push(`category = $${values.length + 1}`);
        values.push(validated.category);
      }
      if (validated.apiType) {
        updates.push(`api_type = $${values.length + 1}`);
        values.push(validated.apiType);
      }
      if (validated.authType) {
        updates.push(`auth_type = $${values.length + 1}`);
        values.push(validated.authType);
      }
      if (validated.baseUrl) {
        updates.push(`base_url = $${values.length + 1}`);
        values.push(validated.baseUrl);
      }
      if (validated.endpoints) {
        updates.push(`endpoints = $${values.length + 1}`);
        values.push(JSON.stringify(validated.endpoints));
      }
      if (validated.fieldMappings) {
        updates.push(`field_mappings = $${values.length + 1}`);
        values.push(JSON.stringify(validated.fieldMappings));
      }
      if (validated.statusMappings) {
        updates.push(`status_mappings = $${values.length + 1}`);
        values.push(JSON.stringify(validated.statusMappings));
      }
      if (validated.pagination) {
        updates.push(`pagination = $${values.length + 1}`);
        values.push(JSON.stringify(validated.pagination));
      }
      if (validated.rateLimit) {
        updates.push(`rate_limit = $${values.length + 1}`);
        values.push(JSON.stringify(validated.rateLimit));
      }
      if (validated.isPublic !== undefined) {
        updates.push(`is_public = $${values.length + 1}`);
        values.push(validated.isPublic);
      }
      if (validated.isActive !== undefined) {
        updates.push(`is_active = $${values.length + 1}`);
        values.push(validated.isActive);
      }

      updates.push('updated_at = NOW()');

      const result = await db.execute(sql`
        UPDATE custom_mcp_presets
        SET ${sql.raw(updates.join(', '))}
        WHERE id = ${id}
        RETURNING *
      `);

      console.log(`[CustomMCPPresets] Updated preset: ${id}`);

      res.json({
        success: true,
        preset: result.rows[0],
        message: 'Custom MCP preset updated successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('[CustomMCPPresets] Error updating preset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preset',
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/admin/custom-mcp-presets/:id
   * Delete custom preset
   */
  app.delete('/api/admin/custom-mcp-presets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only system administrators can delete custom MCP presets',
        });
      }

      await ensureTable();
      const { id } = req.params;

      await db.execute(sql`
        DELETE FROM custom_mcp_presets WHERE id = ${id}
      `);

      console.log(`[CustomMCPPresets] Deleted preset: ${id}`);

      res.json({
        success: true,
        message: 'Custom MCP preset deleted successfully',
      });
    } catch (error: any) {
      console.error('[CustomMCPPresets] Error deleting preset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete preset',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/custom-mcp-presets/:id/test
   * Test connection for custom preset
   */
  app.post('/api/admin/custom-mcp-presets/:id/test', authenticate, async (req: Request, res: Response) => {
    try {
      await ensureTable();
      const { id } = req.params;
      const { credentials } = req.body; // User provides test credentials

      // Get preset
      const presetResult = await db.execute(sql`
        SELECT * FROM custom_mcp_presets WHERE id = ${id}
      `);

      if (presetResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Custom preset not found',
        });
      }

      const preset = presetResult.rows[0];

      // Test connection using Universal Connector
      const { UniversalMCPConnector } = await import('../../mcp/UniversalMCPConnector.js');

      // Create mock integration for testing
      const mockIntegration: any = {
        connectionDetails: JSON.stringify({
          baseUrl: preset.base_url || credentials.baseUrl,
          authType: preset.auth_type,
          apiType: preset.api_type,
          endpoints: preset.endpoints,
          statusMappings: preset.status_mappings,
          pagination: preset.pagination,
          rateLimit: preset.rate_limit,
        }),
        credentials: JSON.stringify(credentials),
        fieldMappings: JSON.stringify(preset.field_mappings),
      };

      const connector = new UniversalMCPConnector(mockIntegration);
      const testResult = await connector.testConnection();

      // Update test status
      await db.execute(sql`
        UPDATE custom_mcp_presets
        SET
          test_connection_status = ${testResult.success ? 'success' : 'failed'},
          test_connection_message = ${testResult.message},
          last_tested_at = NOW()
        WHERE id = ${id}
      `);

      res.json({
        success: testResult.success,
        message: testResult.message,
        latency: testResult.latency,
      });
    } catch (error: any) {
      console.error('[CustomMCPPresets] Error testing preset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test connection',
        message: error.message,
      });
    }
  });

  console.log('[CustomMCPPresets] Custom MCP preset management routes registered');
}
