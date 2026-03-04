/**
 * AGENT ATTRIBUTES API
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * Agent attributes are now managed through Palantir Ontology with
 * LLM-powered dynamic attribute handling.
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../auth/authMiddleware.js';
import {
  getDefaultAttributes,
  isAgentType,
  type AgentType,
  type AgentAttributeRegistryEntry,
} from '../lib/AgentAttributeRegistry.js';
import { getPalantirLLMBridge } from '../services/PalantirLLMBridge.js';
import { OntologyDataProvider } from '../services/OntologyDataProvider.js';

interface AttributeValueSnapshot {
  value: string | null;
  createdAt: string | null;
}

export function registerAgentAttributeRoutes(app: Express): void {
  /**
   * GET /api/agents/:agentType/attributes
   * Get all attributes for an agent - FROM PALANTIR
   */
  app.get('/api/agents/:agentType/attributes', authenticate, async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType;
      if (!isAgentType(agentType)) {
        return res.status(400).json({ error: 'Invalid agent type' });
      }

      const includeValues = req.query.includeValues === 'true';

      // Get default attributes from registry
      const defaultAttributes = getDefaultAttributes(agentType);

      // Get custom attributes from Palantir
      let customAttributeEntries: AgentAttributeRegistryEntry[] = [];
      try {
        if (OntologyDataProvider.isReady()) {
          const customResult = await OntologyDataProvider.query('AgentAttribute', {
            filters: [{ field: 'ownerAgent', operator: 'eq', value: agentType }],
            pageSize: 100,
          });

          customAttributeEntries = (customResult.data || []).map((attr: any) => ({
            name: attr.name,
            displayName: attr.label || attr.displayName,
            type: (attr.dataType as AgentAttributeRegistryEntry['type']) || 'text',
            description: attr.description || 'Custom attribute',
            unit: attr.unit || undefined,
            source: 'external_api',
            sourcePath: undefined,
            values: undefined,
            defaultThresholds: undefined,
            ownerAgent: agentType,
            sourceKind: attr.mcpToolName ? 'external_api' : 'admin_input',
            endpoint: `/api/agents/${agentType}/attributes/${attr.name}`,
          }));
        }
      } catch (error) {
        console.warn('[AgentAttributes] Palantir query failed, using defaults:', error);
      }

      const allAttributes = [...defaultAttributes, ...customAttributeEntries];

      // Get latest attribute values from Palantir
      let latestMap = new Map<string, AttributeValueSnapshot>();
      try {
        if (OntologyDataProvider.isReady()) {
          const factsResult = await OntologyDataProvider.query('AgentFact', {
            filters: [{ field: 'sourceAgent', operator: 'eq', value: agentType }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
            pageSize: 500,
          });

          // Build map of latest values per attribute
          const seenAttributes = new Set<string>();
          for (const fact of factsResult.data || []) {
            if (!seenAttributes.has(fact.attribute)) {
              seenAttributes.add(fact.attribute);
              latestMap.set(fact.attribute, {
                value: fact.value ?? null,
                createdAt: fact.createdAt ? new Date(fact.createdAt).toISOString() : null,
              });
            }
          }
        }
      } catch (error) {
        console.warn('[AgentAttributes] Failed to get facts from Palantir:', error);
      }

      const attributes = allAttributes.map((attr) => {
        const latest = latestMap.get(attr.name);
        const isAvailable = Boolean(latest?.value);
        const availability = isAvailable
          ? 'available'
          : attr.sourceKind === 'admin_input'
            ? 'admin_required'
            : attr.sourceKind === 'external_api'
              ? 'mcp_required'
              : 'missing';

        return {
          ...attr,
          availability,
          lastUpdated: latest?.createdAt ?? null,
          value: includeValues ? latest?.value ?? null : undefined,
        };
      });

      res.json({
        agentType,
        attributes,
        source: OntologyDataProvider.isReady() ? 'palantir' : 'local',
      });
    } catch (error: any) {
      console.error('[AgentAttributes] List error:', error);
      res.status(500).json({ error: error.message || 'Failed to load attributes' });
    }
  });

  /**
   * GET /api/agents/:agentType/attributes/:attribute
   * Get a specific attribute value - FROM PALANTIR
   */
  app.get('/api/agents/:agentType/attributes/:attribute', authenticate, async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType;
      const attributeName = req.params.attribute;

      if (!isAgentType(agentType)) {
        return res.status(400).json({ error: 'Invalid agent type' });
      }

      // Check default attributes first
      const defaultAttributes = getDefaultAttributes(agentType);
      let metadata = defaultAttributes.find((attr) => attr.name === attributeName) || null;

      // Check custom attributes in Palantir
      if (!metadata && OntologyDataProvider.isReady()) {
        try {
          const customResult = await OntologyDataProvider.query('AgentAttribute', {
            filters: [
              { field: 'name', operator: 'eq', value: attributeName },
              { field: 'ownerAgent', operator: 'eq', value: agentType },
            ],
            pageSize: 1,
          });

          const customEntry = customResult.data?.[0];
          if (customEntry) {
            metadata = {
              name: customEntry.name,
              displayName: customEntry.label || customEntry.displayName,
              type: (customEntry.dataType as AgentAttributeRegistryEntry['type']) || 'text',
              description: customEntry.description || 'Custom attribute',
              unit: customEntry.unit || undefined,
              source: 'external_api',
              ownerAgent: agentType as AgentType,
              sourceKind: customEntry.mcpToolName ? 'external_api' : 'admin_input',
              endpoint: `/api/agents/${agentType}/attributes/${customEntry.name}`,
            };
          }
        } catch (error) {
          console.warn('[AgentAttributes] Palantir query for custom attribute failed:', error);
        }
      }

      if (!metadata) {
        return res.status(404).json({ error: 'Attribute not found' });
      }

      // Get latest value from Palantir
      let value: string | null = null;
      let lastUpdated: string | null = null;

      if (OntologyDataProvider.isReady()) {
        try {
          const factsResult = await OntologyDataProvider.query('AgentFact', {
            filters: [
              { field: 'sourceAgent', operator: 'eq', value: agentType },
              { field: 'attribute', operator: 'eq', value: attributeName },
            ],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
            pageSize: 1,
          });

          const latest = factsResult.data?.[0];
          value = latest?.value ?? null;
          lastUpdated = latest?.createdAt ? new Date(latest.createdAt).toISOString() : null;
        } catch (error) {
          console.warn('[AgentAttributes] Failed to get fact from Palantir:', error);
        }
      }

      const availability = value
        ? 'available'
        : metadata.sourceKind === 'admin_input'
          ? 'admin_required'
          : metadata.sourceKind === 'external_api'
            ? 'mcp_required'
            : 'missing';

      res.json({
        agentType,
        attribute: metadata,
        availability,
        value,
        lastUpdated,
        source: OntologyDataProvider.isReady() ? 'palantir' : 'local',
      });
    } catch (error: any) {
      console.error('[AgentAttributes] Get attribute error:', error);
      res.status(500).json({ error: error.message || 'Failed to load attribute' });
    }
  });

  /**
   * POST /api/agents/:agentType/attributes/:attribute
   * Update an attribute value - TO PALANTIR
   */
  app.post('/api/agents/:agentType/attributes/:attribute', authenticate, async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType;
      const attributeName = req.params.attribute;
      const { value, source = 'admin' } = req.body;

      if (!isAgentType(agentType)) {
        return res.status(400).json({ error: 'Invalid agent type' });
      }

      // Use LLM Bridge for dynamic data ingestion
      const bridge = await getPalantirLLMBridge();
      const result = await bridge.agentUpdateData(agentType, 'metric', {
        attribute: attributeName,
        value,
        source,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: result.success,
        message: result.message,
        agentType,
        attribute: attributeName,
        value,
      });
    } catch (error: any) {
      console.error('[AgentAttributes] Update error:', error);
      res.status(500).json({ error: error.message || 'Failed to update attribute' });
    }
  });

  /**
   * POST /api/agents/:agentType/attributes/bulk-update
   * Bulk update attributes - TO PALANTIR
   */
  app.post('/api/agents/:agentType/attributes/bulk-update', authenticate, async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType;
      const { attributes } = req.body;

      if (!isAgentType(agentType)) {
        return res.status(400).json({ error: 'Invalid agent type' });
      }

      if (!Array.isArray(attributes)) {
        return res.status(400).json({ error: 'attributes must be an array' });
      }

      const bridge = await getPalantirLLMBridge();
      const results: any[] = [];

      for (const attr of attributes) {
        const result = await bridge.agentUpdateData(agentType, 'metric', {
          attribute: attr.name,
          value: attr.value,
          source: attr.source || 'admin',
          timestamp: new Date().toISOString(),
        });
        results.push({
          attribute: attr.name,
          success: result.success,
        });
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `Updated ${successCount}/${attributes.length} attributes`,
        results,
      });
    } catch (error: any) {
      console.error('[AgentAttributes] Bulk update error:', error);
      res.status(500).json({ error: error.message || 'Failed to bulk update attributes' });
    }
  });
}
