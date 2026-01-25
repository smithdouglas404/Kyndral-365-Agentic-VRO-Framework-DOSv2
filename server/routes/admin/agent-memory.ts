/**
 * AGENT MEMORY API ROUTES
 *
 * Admin endpoints for viewing Mem0 facts and Letta memories
 * - View agent_facts (Mem0 shared ledger)
 * - View agent_core_memory (Letta core memory per agent)
 * - View agent_archival_memory (Letta long-term storage)
 * - View agent_fact_subscriptions (what agents observe)
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import { authenticate } from '../../auth/authMiddleware.js';

export function createAgentMemoryRoutes(): Router {
  const router = Router();

  /**
   * GET /api/admin/agent-memory/facts
   * Get Mem0 facts from shared ledger
   */
  router.get('/facts', authenticate, async (req: Request, res: Response) => {
    try {
      const {
        entity,
        attribute,
        sourceAgent,
        limit = 100,
        offset = 0,
      } = req.query;

      let query = `
        SELECT
          id,
          entity,
          attribute,
          value,
          source_agent,
          confidence,
          supersedes,
          created_at
        FROM agent_facts
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (entity) {
        query += ` AND entity = $${paramIndex}`;
        params.push(entity);
        paramIndex++;
      }

      if (attribute) {
        query += ` AND attribute = $${paramIndex}`;
        params.push(attribute);
        paramIndex++;
      }

      if (sourceAgent) {
        query += ` AND source_agent = $${paramIndex}`;
        params.push(sourceAgent);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await db.execute(sql.raw(query, params));

      const facts = result.rows.map((row: any) => ({
        id: row.id,
        entity: row.entity,
        attribute: row.attribute,
        value: JSON.parse(row.value),
        sourceAgent: row.source_agent,
        confidence: parseFloat(row.confidence),
        supersedes: row.supersedes,
        createdAt: row.created_at,
      }));

      // Get total count
      let countQuery = 'SELECT COUNT(*) as count FROM agent_facts WHERE 1=1';
      const countParams: any[] = [];
      let countParamIndex = 1;

      if (entity) {
        countQuery += ` AND entity = $${countParamIndex}`;
        countParams.push(entity);
        countParamIndex++;
      }

      if (attribute) {
        countQuery += ` AND attribute = $${countParamIndex}`;
        countParams.push(attribute);
        countParamIndex++;
      }

      if (sourceAgent) {
        countQuery += ` AND source_agent = $${countParamIndex}`;
        countParams.push(sourceAgent);
        countParamIndex++;
      }

      const countResult = await db.execute(sql.raw(countQuery, countParams));
      const total = parseInt((countResult.rows[0] as any).count);

      res.json({
        success: true,
        facts,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get facts failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/agent-memory/facts/entities
   * Get list of all entities that have facts
   */
  router.get('/facts/entities', authenticate, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT entity, COUNT(*) as fact_count
        FROM agent_facts
        GROUP BY entity
        ORDER BY fact_count DESC
      `);

      res.json({
        success: true,
        entities: result.rows.map((row: any) => ({
          entity: row.entity,
          factCount: parseInt(row.fact_count),
        })),
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get entities failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/agent-memory/facts/attributes
   * Get list of all attributes that have been tracked
   */
  router.get('/facts/attributes', authenticate, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT attribute, COUNT(*) as usage_count
        FROM agent_facts
        GROUP BY attribute
        ORDER BY usage_count DESC
      `);

      res.json({
        success: true,
        attributes: result.rows.map((row: any) => ({
          attribute: row.attribute,
          usageCount: parseInt(row.usage_count),
        })),
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get attributes failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/agent-memory/letta/core/:agentId
   * Get Letta core memory for an agent
   */
  router.get('/letta/core/:agentId', authenticate, async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      const result = await db.execute(sql`
        SELECT
          id,
          agent_id,
          persona,
          human_context,
          updated_at
        FROM agent_core_memory
        WHERE agent_id = ${agentId}
      `);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          coreMemory: null,
        });
      }

      const row = result.rows[0] as any;
      res.json({
        success: true,
        coreMemory: {
          id: row.id,
          agentId: row.agent_id,
          persona: row.persona,
          humanContext: row.human_context,
          updatedAt: row.updated_at,
        },
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get Letta core memory failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/agent-memory/letta/archival/:agentId
   * Get Letta archival memory for an agent
   */
  router.get('/letta/archival/:agentId', authenticate, async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { limit = 50, offset = 0, search } = req.query;

      let query = `
        SELECT
          id,
          agent_id,
          memory_key,
          content,
          embedding,
          created_at
        FROM agent_archival_memory
        WHERE agent_id = $1
      `;

      const params: any[] = [agentId];
      let paramIndex = 2;

      if (search) {
        query += ` AND (memory_key ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await db.execute(sql.raw(query, params));

      const memories = result.rows.map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        memoryKey: row.memory_key,
        content: row.content,
        hasEmbedding: !!row.embedding,
        createdAt: row.created_at,
      }));

      // Get total count
      let countQuery = 'SELECT COUNT(*) as count FROM agent_archival_memory WHERE agent_id = $1';
      const countParams: any[] = [agentId];

      if (search) {
        countQuery += ' AND (memory_key ILIKE $2 OR content ILIKE $2)';
        countParams.push(`%${search}%`);
      }

      const countResult = await db.execute(sql.raw(countQuery, countParams));
      const total = parseInt((countResult.rows[0] as any).count);

      res.json({
        success: true,
        memories,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get Letta archival memory failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/agent-memory/subscriptions
   * Get all agent fact subscriptions (what agents observe)
   */
  router.get('/subscriptions', authenticate, async (req: Request, res: Response) => {
    try {
      const { agentId } = req.query;

      let query = `
        SELECT
          id,
          agent_id,
          attribute,
          source_agent,
          created_at
        FROM agent_fact_subscriptions
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (agentId) {
        query += ` AND agent_id = $${paramIndex}`;
        params.push(agentId);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.execute(sql.raw(query, params));

      const subscriptions = result.rows.map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        attribute: row.attribute,
        sourceAgent: row.source_agent,
        createdAt: row.created_at,
      }));

      res.json({
        success: true,
        subscriptions,
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get subscriptions failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/agent-memory/stats
   * Get overall memory statistics
   */
  router.get('/stats', authenticate, async (req: Request, res: Response) => {
    try {
      // Total facts
      const factsCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM agent_facts
      `);

      // Facts by agent
      const factsByAgent = await db.execute(sql`
        SELECT source_agent, COUNT(*) as count
        FROM agent_facts
        GROUP BY source_agent
        ORDER BY count DESC
      `);

      // Total memories
      const memoriesCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM agent_archival_memory
      `);

      // Memories by agent
      const memoriesByAgent = await db.execute(sql`
        SELECT agent_id, COUNT(*) as count
        FROM agent_archival_memory
        GROUP BY agent_id
        ORDER BY count DESC
      `);

      // Recent activity
      const recentFacts = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM agent_facts
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `);

      res.json({
        success: true,
        stats: {
          totalFacts: parseInt((factsCount.rows[0] as any).count),
          totalMemories: parseInt((memoriesCount.rows[0] as any).count),
          factsByAgent: factsByAgent.rows.map((row: any) => ({
            agent: row.source_agent,
            count: parseInt(row.count),
          })),
          memoriesByAgent: memoriesByAgent.rows.map((row: any) => ({
            agent: row.agent_id,
            count: parseInt(row.count),
          })),
          recentActivity: parseInt((recentFacts.rows[0] as any).count),
        },
      });
    } catch (error: any) {
      console.error('[AgentMemory] Get stats failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log('[AgentMemory] Routes registered');
  return router;
}
