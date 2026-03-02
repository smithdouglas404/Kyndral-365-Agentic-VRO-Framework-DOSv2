import { Router } from 'express';
import type { Request, Response } from 'express';
import { createAgentObject, createAgentObjects } from '../lib/agent-objects/index.js';
import { isAgentType, type AgentType } from '../lib/AgentAttributeRegistry.js';
import { getPalantirRulesService } from '../lib/PalantirRulesService.js';

export function registerAgentObjectRoutes(app: Router) {

  const rulesService = getPalantirRulesService() || undefined;

  /**
   * GET /api/agent-objects/:agentType/:entityId/attributes/:attributeName
   * Get single attribute value for an entity
   */
  app.get('/api/agent-objects/:agentType/:entityId/attributes/:attributeName', async (req: Request, res: Response) => {
    try {
      const { agentType, entityId, attributeName } = req.params;

      if (!isAgentType(agentType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent type: ${agentType}`
        });
      }

      // Create agent object
      const agentObject = createAgentObject(agentType as AgentType, entityId, rulesService);

      // Get attribute (checks Mem0 cache first, triggers Langflow if not cached)
      const attributeValue = await agentObject.getAttribute(attributeName);

      res.json({
        success: true,
        agentType,
        entityId,
        attribute: attributeName,
        value: attributeValue.value,
        narrative: attributeValue.narrative,
        reasoning: attributeValue.reasoning,
        sources: attributeValue.sources,
        confidence: attributeValue.confidence,
        timestamp: attributeValue.timestamp,
        cached: attributeValue.cached,
        cacheAge: attributeValue.cacheAge
      });

    } catch (error: any) {
      console.error('[AgentObjects] Get attribute error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/agent-objects/:agentType/:entityId/attributes
   * Get multiple attributes for an entity
   * Query param: ?attributes=attr1,attr2,attr3
   */
  app.get('/api/agent-objects/:agentType/:entityId/attributes', async (req: Request, res: Response) => {
    try {
      const { agentType, entityId } = req.params;
      const { attributes: attributesParam } = req.query;

      if (!isAgentType(agentType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent type: ${agentType}`
        });
      }

      // Create agent object
      const agentObject = createAgentObject(agentType as AgentType, entityId, rulesService);

      // If specific attributes requested, get those. Otherwise get entity state (all cached)
      let attributes: Record<string, any>;

      if (typeof attributesParam === 'string' && attributesParam) {
        const attributeNames = attributesParam.split(',').map(a => a.trim());
        attributes = await agentObject.getAttributes(attributeNames);
      } else {
        attributes = await agentObject.getEntityState();
      }

      res.json({
        success: true,
        agentType,
        entityId,
        attributes,
        count: Object.keys(attributes).length,
        timestamp: new Date()
      });

    } catch (error: any) {
      console.error('[AgentObjects] Get attributes error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/agent-objects/:agentType/:entityId/list-attributes
   * List all available attributes for an agent type
   */
  app.get('/api/agent-objects/:agentType/:entityId/list-attributes', async (req: Request, res: Response) => {
    try {
      const { agentType, entityId } = req.params;

      if (!isAgentType(agentType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent type: ${agentType}`
        });
      }

      // Create agent object
      const agentObject = createAgentObject(agentType as AgentType, entityId, rulesService);

      // Get attribute definitions
      const attributes = agentObject.listAttributes();

      res.json({
        success: true,
        agentType,
        entityId,
        attributes: attributes.map(attr => ({
          name: attr.name,
          displayName: attr.displayName,
          type: attr.type,
          description: attr.description,
          unit: attr.unit,
          source: attr.source,
          defaultThresholds: attr.defaultThresholds,
          endpoint: attr.endpoint
        })),
        count: attributes.length
      });

    } catch (error: any) {
      console.error('[AgentObjects] List attributes error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/agent-objects/:agentType/:entityId/refresh/:attributeName
   * Force refresh attribute (bypass cache, recalculate via Langflow)
   */
  app.post('/api/agent-objects/:agentType/:entityId/refresh/:attributeName', async (req: Request, res: Response) => {
    try {
      const { agentType, entityId, attributeName } = req.params;

      if (!isAgentType(agentType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent type: ${agentType}`
        });
      }

      // Create agent object
      const agentObject = createAgentObject(agentType as AgentType, entityId, rulesService);

      // Refresh attribute (bypass cache)
      const attributeValue = await agentObject.refreshAttribute(attributeName);

      res.json({
        success: true,
        agentType,
        entityId,
        attribute: attributeName,
        value: attributeValue.value,
        narrative: attributeValue.narrative,
        reasoning: attributeValue.reasoning,
        sources: attributeValue.sources,
        confidence: attributeValue.confidence,
        timestamp: attributeValue.timestamp,
        refreshed: true
      });

    } catch (error: any) {
      console.error('[AgentObjects] Refresh attribute error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/agent-objects/:entityId/all
   * Get all agent perspectives for an entity
   */
  app.get('/api/agent-objects/:entityId/all', async (req: Request, res: Response) => {
    try {
      const { entityId } = req.params;

      // Create all agent objects for the entity
      const agents = createAgentObjects(entityId, rulesService);

      // Get entity state from each agent
      const perspectives: Record<string, any> = {};

      for (const [agentType, agentObject] of Object.entries(agents)) {
        perspectives[agentType] = await agentObject.getEntityState();
      }

      res.json({
        success: true,
        entityId,
        perspectives,
        timestamp: new Date()
      });

    } catch (error: any) {
      console.error('[AgentObjects] Get all perspectives error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/agent-objects/pmo/:entityId/health-report
   * Get PMO health report (convenience endpoint)
   */
  app.get('/api/agent-objects/pmo/:entityId/health-report', async (req: Request, res: Response) => {
    try {
      const { entityId } = req.params;

      const pmoAgent = createAgentObject('pmo', entityId, rulesService);

      // Use typed method if available
      if ('getHealthReport' in pmoAgent && typeof pmoAgent.getHealthReport === 'function') {
        const report = await (pmoAgent as any).getHealthReport();
        res.json({
          success: true,
          ...report
        });
      } else {
        return res.status(501).json({
          success: false,
          error: 'Health report not implemented for this agent'
        });
      }

    } catch (error: any) {
      console.error('[AgentObjects] PMO health report error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/agent-objects/finops/:entityId/financial-report
   * Get FinOps financial report (convenience endpoint)
   */
  app.get('/api/agent-objects/finops/:entityId/financial-report', async (req: Request, res: Response) => {
    try {
      const { entityId } = req.params;

      const finopsAgent = createAgentObject('finops', entityId, rulesService);

      // Use typed method if available
      if ('getFinancialReport' in finopsAgent && typeof finopsAgent.getFinancialReport === 'function') {
        const report = await (finopsAgent as any).getFinancialReport();
        res.json({
          success: true,
          ...report
        });
      } else {
        return res.status(501).json({
          success: false,
          error: 'Financial report not implemented for this agent'
        });
      }

    } catch (error: any) {
      console.error('[AgentObjects] FinOps financial report error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  console.log('[AgentObjects] Routes registered:');
  console.log('  GET  /api/agent-objects/:agentType/:entityId/attributes/:attributeName');
  console.log('  GET  /api/agent-objects/:agentType/:entityId/attributes?attributes=attr1,attr2');
  console.log('  GET  /api/agent-objects/:agentType/:entityId/list-attributes');
  console.log('  POST /api/agent-objects/:agentType/:entityId/refresh/:attributeName');
  console.log('  GET  /api/agent-objects/:entityId/all');
  console.log('  GET  /api/agent-objects/pmo/:entityId/health-report');
  console.log('  GET  /api/agent-objects/finops/:entityId/financial-report');
}
