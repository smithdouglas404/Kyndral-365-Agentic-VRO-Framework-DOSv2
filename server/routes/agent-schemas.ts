/**
 * AGENT SCHEMAS API
 *
 * Expose predefined agent schemas (attributes, functions, relationships).
 * Users can select from 80% predefined attributes, customize 20%.
 */

import express from 'express';
import {
  AGENT_SCHEMAS,
  getAgentSchema,
  getAttributeDependencies,
  discoverAgentRelationships
} from '../lib/AgentObjectSchema.js';
import { getSignalBroadcaster } from '../lib/SignalBroadcaster.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

const router = express.Router();
const signalBroadcaster = getSignalBroadcaster();

/**
 * GET /api/agent-schemas
 * Get all predefined agent schemas
 */
router.get('/', async (req, res) => {
  try {
    const schemas = Object.values(AGENT_SCHEMAS);

    res.json({
      success: true,
      count: schemas.length,
      schemas: schemas.map(schema => ({
        agentType: schema.agentType,
        displayName: schema.displayName,
        description: schema.description,
        icon: schema.icon,
        color: schema.color,
        producesCount: schema.produces.length,
        consumesCount: schema.consumes.length,
        functionsCount: schema.functions.length
      }))
    });
  } catch (error: any) {
    console.error('[AgentSchemas] List error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-schemas/:agentType
 * Get detailed schema for specific agent type
 */
router.get('/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const schema = getAgentSchema(agentType);

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: `Agent schema not found: ${agentType}`
      });
    }

    res.json({
      success: true,
      schema
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Get schema error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-schemas/:agentType/attributes
 * Get all attributes for agent (produces + consumes)
 */
router.get('/:agentType/attributes', async (req, res) => {
  try {
    const { agentType } = req.params;
    const schema = getAgentSchema(agentType);

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: `Agent schema not found: ${agentType}`
      });
    }

    res.json({
      success: true,
      agentType,
      produces: schema.produces,
      consumes: schema.consumes,
      total: schema.produces.length + schema.consumes.length
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Get attributes error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-schemas/relationships
 * Get all discovered relationships between agents
 * (Based on who produces what and who consumes what)
 */
router.get('/relationships/all', async (req, res) => {
  try {
    const relationships = discoverAgentRelationships();

    // Group by from-to pairs
    const grouped: Record<string, { from: string, to: string, attributes: string[] }> = {};

    for (const rel of relationships) {
      const key = `${rel.from}→${rel.to}`;
      if (!grouped[key]) {
        grouped[key] = {
          from: rel.from,
          to: rel.to,
          attributes: []
        };
      }
      grouped[key].attributes.push(rel.via);
    }

    res.json({
      success: true,
      count: Object.keys(grouped).length,
      relationships: Object.values(grouped)
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Get relationships error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-schemas/dependencies
 * Get attribute dependency map (who produces/consumes each attribute)
 */
router.get('/dependencies/all', async (req, res) => {
  try {
    const dependencies = getAttributeDependencies();
    const result: Record<string, { producers: string[], consumers: string[] }> = {};

    for (const [attr, deps] of dependencies) {
      result[attr] = deps;
    }

    res.json({
      success: true,
      count: Object.keys(result).length,
      dependencies: result
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Get dependencies error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agent-schemas/instantiate/:agentType
 * Instantiate an agent with predefined attributes
 * Creates custom_attributes entries for all predefined attributes
 */
router.post('/instantiate/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { companyId } = req.body;

    const schema = getAgentSchema(agentType);
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: `Agent schema not found: ${agentType}`
      });
    }

    // Create custom_attributes for all produces
    const createdAttributes: any[] = [];

    for (const attr of schema.produces) {
      // Check if attribute already exists
      const existing = await db.execute(sql`
        SELECT id FROM custom_attributes
        WHERE name = ${attr.name} AND owner_agent = ${agentType}
        LIMIT 1
      `);

      if (existing.rows.length > 0) {
        console.log(`[AgentSchemas] Attribute ${attr.name} already exists for ${agentType}`);
        continue;
      }

      // Get consumers from schema
      const dependencies = getAttributeDependencies();
      const consumers = dependencies.get(attr.name)?.consumers || [];

      const result = await db.execute(sql`
        INSERT INTO custom_attributes (
          name, label, description, data_type, owner_agent,
          visible_to, unit, default_value, mcp_tool_name, created_by
        ) VALUES (
          ${attr.name},
          ${attr.label},
          ${attr.description},
          ${attr.dataType},
          ${agentType},
          ${JSON.stringify(consumers)},
          ${attr.unit || null},
          ${attr.defaultValue || null},
          ${'get_' + attr.name},
          'system'
        )
        RETURNING *
      `);

      createdAttributes.push(result.rows[0]);
    }

    console.log(`[AgentSchemas] Instantiated ${agentType} with ${createdAttributes.length} attributes`);

    res.json({
      success: true,
      agentType,
      createdAttributes: createdAttributes.length,
      attributes: createdAttributes
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Instantiate error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-schemas/subscription-stats
 * Get signal subscription statistics
 */
router.get('/subscription-stats/current', async (req, res) => {
  try {
    const stats = signalBroadcaster.getSubscriptionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Subscription stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agent-schemas/broadcast-signal
 * Manually broadcast a signal (for testing)
 */
router.post('/broadcast-signal', async (req, res) => {
  try {
    const { sourceType, sourceId, attributeName, attributeValue, entity, confidence } = req.body;

    if (!sourceType || !sourceId || !attributeName || attributeValue === undefined || !entity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceType, sourceId, attributeName, attributeValue, entity'
      });
    }

    await signalBroadcaster.broadcast({
      sourceType,
      sourceId,
      attributeName,
      attributeValue,
      entity,
      timestamp: new Date(),
      confidence: confidence || 0.85,
      metadata: req.body.metadata
    });

    res.json({
      success: true,
      message: 'Signal broadcasted successfully'
    });
  } catch (error: any) {
    console.error('[AgentSchemas] Broadcast signal error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
