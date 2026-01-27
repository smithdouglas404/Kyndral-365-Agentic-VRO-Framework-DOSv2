/**
 * MEM0 API ENDPOINTS
 *
 * Exposes Mem0 fact operations to Langflow flows.
 * Allows flows to read/write facts from the shared ledger.
 */

import express from 'express';
import { getMem0Service } from '../lib/Mem0Service.js';

const router = express.Router();
const mem0 = getMem0Service();

/**
 * Write a fact to Mem0 shared ledger
 * POST /api/mem0/write-fact
 *
 * Body: {
 *   entity: "project_123",
 *   attribute: "budget_variance",
 *   value: 0.25,
 *   sourceAgent: "finops",
 *   confidence: 0.9
 * }
 */
router.post('/write-fact', async (req, res) => {
  try {
    const { entity, attribute, value, sourceAgent, confidence } = req.body;

    if (!entity || !attribute || value === undefined || !sourceAgent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entity, attribute, value, sourceAgent'
      });
    }

    const fact = await mem0.writeFact({
      entity,
      attribute,
      value,
      sourceAgent,
      confidence: confidence || 1.0
    });

    console.log(`[Mem0API] Fact written: ${entity}.${attribute} = ${JSON.stringify(value)} (by ${sourceAgent})`);

    res.json({
      success: true,
      fact: {
        id: fact.id,
        entity: fact.entity,
        attribute: fact.attribute,
        value: fact.value,
        sourceAgent: fact.sourceAgent,
        confidence: fact.confidence,
        timestamp: fact.timestamp
      }
    });
  } catch (error: any) {
    console.error('[Mem0API] Error writing fact:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Read facts from Mem0
 * GET /api/mem0/read-facts?entity=project_123&attribute=budget_variance
 */
router.get('/read-facts', async (req, res) => {
  try {
    const { entity, attribute, sourceAgent, since } = req.query;

    const facts = await mem0.observeFacts({
      entity: entity as string | undefined,
      attribute: attribute as string | undefined,
      sourceAgent: sourceAgent as string | undefined,
      sinceTimestamp: since ? new Date(since as string) : undefined
    });

    console.log(`[Mem0API] Read ${facts.length} facts (entity=${entity}, attribute=${attribute})`);

    res.json({
      success: true,
      count: facts.length,
      facts: facts.map(f => ({
        id: f.id,
        entity: f.entity,
        attribute: f.attribute,
        value: f.value,
        sourceAgent: f.sourceAgent,
        confidence: f.confidence,
        timestamp: f.timestamp
      }))
    });
  } catch (error: any) {
    console.error('[Mem0API] Error reading facts:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current state of an entity (latest facts win)
 * GET /api/mem0/entity-state/project_123
 */
router.get('/entity-state/:entity', async (req, res) => {
  try {
    const { entity } = req.params;

    const state = await mem0.getEntityState(entity);

    console.log(`[Mem0API] Entity state retrieved: ${entity} (${Object.keys(state).length} attributes)`);

    res.json({
      success: true,
      entity,
      state
    });
  } catch (error: any) {
    console.error('[Mem0API] Error getting entity state:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Semantic search across facts using vector similarity
 * POST /api/mem0/semantic-search
 *
 * Body: {
 *   query: "projects with budget problems",
 *   agentId: "finops" (optional),
 *   limit: 10,
 *   minSimilarity: 0.7
 * }
 */
router.post('/semantic-search', async (req, res) => {
  try {
    const { query, agentId, limit, minSimilarity } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: query'
      });
    }

    const results = await mem0.searchSemanticFacts(query, {
      agentId,
      limit: limit || 10,
      minSimilarity: minSimilarity || 0.7
    });

    console.log(`[Mem0API] Semantic search: "${query}" → ${results.length} results`);

    res.json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (error: any) {
    console.error('[Mem0API] Error in semantic search:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get fact history for an entity
 * GET /api/mem0/history/project_123?attribute=budget_variance
 */
router.get('/history/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const { attribute } = req.query;

    const history = await mem0.getFactHistory(entity, attribute as string | undefined);

    console.log(`[Mem0API] Fact history: ${entity} (${history.length} entries)`);

    res.json({
      success: true,
      entity,
      attribute: attribute || 'all',
      count: history.length,
      history: history.map(f => ({
        id: f.id,
        attribute: f.attribute,
        value: f.value,
        sourceAgent: f.sourceAgent,
        confidence: f.confidence,
        timestamp: f.timestamp
      }))
    });
  } catch (error: any) {
    console.error('[Mem0API] Error getting fact history:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Mem0 statistics
 * GET /api/mem0/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mem0.getStatistics();

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('[Mem0API] Error getting stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
