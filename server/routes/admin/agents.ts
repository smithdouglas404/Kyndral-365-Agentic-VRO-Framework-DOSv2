/**
 * AGENTS ADMIN API
 *
 * CRUD operations for agent definitions (database-driven)
 *
 * Endpoints:
 * - GET /api/admin/agents - List all agents
 * - GET /api/admin/agents/:id - Get single agent
 * - POST /api/admin/agents - Create new agent
 * - PUT /api/admin/agents/:id - Update agent
 * - DELETE /api/admin/agents/:id - Delete agent
 */

import type { Express, Request, Response } from 'express';
import { db } from '../../db.js';
import { agents } from '../../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import { authenticate } from '../../auth/authMiddleware.js';

export function registerAgentAdminRoutes(app: Express): void {
  /**
   * GET /api/admin/agents
   * List all agents
   */
  app.get('/api/admin/agents', authenticate, async (req: Request, res: Response) => {
    try {
      const { enabled, category } = req.query;

      let query = db.select().from(agents);

      // Filter by enabled status if specified
      if (enabled !== undefined) {
        query = query.where(eq(agents.enabled, enabled === 'true'));
      }

      const allAgents = await query.orderBy(agents.name);

      // Filter by category in memory (drizzle doesn't chain where easily)
      let filteredAgents = allAgents;
      if (category && typeof category === 'string') {
        filteredAgents = allAgents.filter(a => a.category === category);
      }

      res.json({
        success: true,
        agents: filteredAgents.map(agent => ({
          ...agent,
          capabilities: agent.capabilities ? JSON.parse(agent.capabilities) : [],
          palantirObjectTypes: agent.palantirObjectTypes ? JSON.parse(agent.palantirObjectTypes) : [],
          mcpConnections: agent.mcpConnections ? JSON.parse(agent.mcpConnections) : [],
        })),
        total: filteredAgents.length,
      });
    } catch (error: any) {
      console.error('[AgentAdmin] List error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agents/:id
   * Get single agent by ID
   */
  app.get('/api/admin/agents/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const agent = await db.select().from(agents).where(eq(agents.id, id)).limit(1);

      if (agent.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }

      const a = agent[0];
      res.json({
        success: true,
        agent: {
          ...a,
          capabilities: a.capabilities ? JSON.parse(a.capabilities) : [],
          palantirObjectTypes: a.palantirObjectTypes ? JSON.parse(a.palantirObjectTypes) : [],
          mcpConnections: a.mcpConnections ? JSON.parse(a.mcpConnections) : [],
        },
      });
    } catch (error: any) {
      console.error('[AgentAdmin] Get by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/admin/agents
   * Create new agent
   */
  app.post('/api/admin/agents', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        id,
        name,
        description,
        category,
        enabled,
        capabilities,
        defaultPriority,
        ownerUserId,
        ownerTeam,
        palantirObjectTypes,
        mcpConnections,
        icon,
        color,
      } = req.body;

      // Validation
      if (!id || !name || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: id, name, category',
        });
      }

      // Check if ID already exists
      const existing = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Agent with ID '${id}' already exists`,
        });
      }

      const newAgent = await db
        .insert(agents)
        .values({
          id,
          name,
          description: description || null,
          category,
          enabled: enabled !== undefined ? enabled : true,
          capabilities: capabilities ? JSON.stringify(capabilities) : null,
          defaultPriority: defaultPriority || 5,
          ownerUserId: ownerUserId || null,
          ownerTeam: ownerTeam || null,
          palantirObjectTypes: palantirObjectTypes ? JSON.stringify(palantirObjectTypes) : null,
          mcpConnections: mcpConnections ? JSON.stringify(mcpConnections) : null,
          icon: icon || null,
          color: color || null,
        })
        .returning();

      const a = newAgent[0];
      res.json({
        success: true,
        agent: {
          ...a,
          capabilities: a.capabilities ? JSON.parse(a.capabilities) : [],
          palantirObjectTypes: a.palantirObjectTypes ? JSON.parse(a.palantirObjectTypes) : [],
          mcpConnections: a.mcpConnections ? JSON.parse(a.mcpConnections) : [],
        },
      });
    } catch (error: any) {
      console.error('[AgentAdmin] Create error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/admin/agents/:id
   * Update existing agent
   */
  app.put('/api/admin/agents/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        enabled,
        capabilities,
        defaultPriority,
        ownerUserId,
        ownerTeam,
        palantirObjectTypes,
        mcpConnections,
        icon,
        color,
      } = req.body;

      // Check if agent exists
      const existing = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }

      const updateData: Record<string, any> = {
        updatedAt: sql`NOW()`,
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (capabilities !== undefined) updateData.capabilities = JSON.stringify(capabilities);
      if (defaultPriority !== undefined) updateData.defaultPriority = defaultPriority;
      if (ownerUserId !== undefined) updateData.ownerUserId = ownerUserId;
      if (ownerTeam !== undefined) updateData.ownerTeam = ownerTeam;
      if (palantirObjectTypes !== undefined) updateData.palantirObjectTypes = JSON.stringify(palantirObjectTypes);
      if (mcpConnections !== undefined) updateData.mcpConnections = JSON.stringify(mcpConnections);
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;

      const updated = await db
        .update(agents)
        .set(updateData)
        .where(eq(agents.id, id))
        .returning();

      const a = updated[0];
      res.json({
        success: true,
        agent: {
          ...a,
          capabilities: a.capabilities ? JSON.parse(a.capabilities) : [],
          palantirObjectTypes: a.palantirObjectTypes ? JSON.parse(a.palantirObjectTypes) : [],
          mcpConnections: a.mcpConnections ? JSON.parse(a.mcpConnections) : [],
        },
      });
    } catch (error: any) {
      console.error('[AgentAdmin] Update error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/admin/agents/:id
   * Delete agent
   */
  app.delete('/api/admin/agents/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await db.delete(agents).where(eq(agents.id, id)).returning();

      if (deleted.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }

      res.json({
        success: true,
        message: 'Agent deleted successfully',
        deletedId: id,
      });
    } catch (error: any) {
      console.error('[AgentAdmin] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[AgentAdmin] Routes registered');
}
