/**
 * CUSTOM ATTRIBUTES API
 *
 * CRUD operations for custom agent attributes exposed via MCP.
 *
 * Endpoints:
 * - GET /api/custom-attributes - List all custom attributes
 * - GET /api/custom-attributes/agent/:agentType - Get attributes visible to agent
 * - POST /api/custom-attributes - Create new custom attribute
 * - PUT /api/custom-attributes/:id - Update custom attribute
 * - DELETE /api/custom-attributes/:id - Delete custom attribute
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { customAttributes } from '../../shared/schema.js';
import { sql, eq } from 'drizzle-orm';
import { authenticate } from '../auth/authMiddleware.js';

export function registerCustomAttributesRoutes(app: Express): void {
  /**
   * GET /api/custom-attributes
   * List all custom attributes
   */
  app.get('/api/custom-attributes', authenticate, async (req: Request, res: Response) => {
    try {
      const attributes = await db.select().from(customAttributes).orderBy(customAttributes.createdAt);

      res.json({
        success: true,
        attributes: attributes.map((attr) => ({
          ...attr,
          visibleTo: JSON.parse(attr.visibleTo),
          validationRules: attr.validationRules ? JSON.parse(attr.validationRules) : null,
        })),
      });
    } catch (error: any) {
      console.error('[CustomAttributes] List error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/custom-attributes/agent/:agentType
   * Get attributes visible to a specific agent
   */
  app.get('/api/custom-attributes/agent/:agentType', authenticate, async (req: Request, res: Response) => {
    try {
      const { agentType } = req.params;

      // Get all attributes where agent is owner OR in visibleTo array
      const allAttributes = await db.select().from(customAttributes).orderBy(customAttributes.createdAt);

      const visibleAttributes = allAttributes.filter((attr) => {
        if (attr.ownerAgent === agentType) return true;
        const visibleTo = JSON.parse(attr.visibleTo);
        return visibleTo.includes(agentType);
      });

      res.json({
        success: true,
        attributes: visibleAttributes.map((attr) => ({
          ...attr,
          visibleTo: JSON.parse(attr.visibleTo),
          validationRules: attr.validationRules ? JSON.parse(attr.validationRules) : null,
        })),
      });
    } catch (error: any) {
      console.error('[CustomAttributes] Get by agent error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/custom-attributes
   * Create new custom attribute
   */
  app.post('/api/custom-attributes', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        name,
        label,
        description,
        dataType,
        ownerAgent,
        visibleTo,
        validationRules,
        defaultValue,
        unit,
        mcpToolName,
      } = req.body;

      // Validation
      if (!name || !label || !dataType || !ownerAgent) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, label, dataType, ownerAgent',
        });
      }

      // Check if attribute name already exists for this agent
      const existing = await db
        .select()
        .from(customAttributes)
        .where(sql`${customAttributes.name} = ${name} AND ${customAttributes.ownerAgent} = ${ownerAgent}`)
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Attribute '${name}' already exists for ${ownerAgent} agent`,
        });
      }

      // Ensure owner is always in visibleTo
      const visibilityArray = Array.isArray(visibleTo) ? visibleTo : [];
      if (!visibilityArray.includes(ownerAgent)) {
        visibilityArray.push(ownerAgent);
      }

      // Generate MCP tool name if not provided
      const finalMcpToolName = mcpToolName || `get_${name}`;

      const newAttribute = await db
        .insert(customAttributes)
        .values({
          name,
          label,
          description: description || null,
          dataType,
          ownerAgent,
          visibleTo: JSON.stringify(visibilityArray),
          validationRules: validationRules ? JSON.stringify(validationRules) : null,
          defaultValue: defaultValue || null,
          unit: unit || null,
          mcpToolName: finalMcpToolName,
          createdBy: req.user?.id || 'system',
        })
        .returning();

      res.json({
        success: true,
        attribute: {
          ...newAttribute[0],
          visibleTo: JSON.parse(newAttribute[0].visibleTo),
          validationRules: newAttribute[0].validationRules ? JSON.parse(newAttribute[0].validationRules) : null,
        },
      });
    } catch (error: any) {
      console.error('[CustomAttributes] Create error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/custom-attributes/:id
   * Update custom attribute
   */
  app.put('/api/custom-attributes/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        label,
        description,
        dataType,
        visibleTo,
        validationRules,
        defaultValue,
        unit,
        mcpToolName,
      } = req.body;

      // Get existing attribute
      const existing = await db.select().from(customAttributes).where(eq(customAttributes.id, id)).limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Attribute not found',
        });
      }

      // Ensure owner is always in visibleTo
      const visibilityArray = Array.isArray(visibleTo) ? visibleTo : JSON.parse(existing[0].visibleTo);
      if (!visibilityArray.includes(existing[0].ownerAgent)) {
        visibilityArray.push(existing[0].ownerAgent);
      }

      const updated = await db
        .update(customAttributes)
        .set({
          name: name || existing[0].name,
          label: label || existing[0].label,
          description: description !== undefined ? description : existing[0].description,
          dataType: dataType || existing[0].dataType,
          visibleTo: JSON.stringify(visibilityArray),
          validationRules: validationRules ? JSON.stringify(validationRules) : existing[0].validationRules,
          defaultValue: defaultValue !== undefined ? defaultValue : existing[0].defaultValue,
          unit: unit !== undefined ? unit : existing[0].unit,
          mcpToolName: mcpToolName || existing[0].mcpToolName,
          updatedAt: sql`NOW()`,
        })
        .where(eq(customAttributes.id, id))
        .returning();

      res.json({
        success: true,
        attribute: {
          ...updated[0],
          visibleTo: JSON.parse(updated[0].visibleTo),
          validationRules: updated[0].validationRules ? JSON.parse(updated[0].validationRules) : null,
        },
      });
    } catch (error: any) {
      console.error('[CustomAttributes] Update error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/custom-attributes/:id
   * Delete custom attribute
   */
  app.delete('/api/custom-attributes/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await db.delete(customAttributes).where(eq(customAttributes.id, id)).returning();

      if (deleted.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Attribute not found',
        });
      }

      res.json({
        success: true,
        message: 'Attribute deleted successfully',
        deletedId: id,
      });
    } catch (error: any) {
      console.error('[CustomAttributes] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[CustomAttributes] Routes registered');
}
