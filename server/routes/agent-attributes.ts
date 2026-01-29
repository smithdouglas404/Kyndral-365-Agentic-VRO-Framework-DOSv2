import type { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { agentFacts, customAttributes } from '../../shared/schema.js';
import { sql, eq } from 'drizzle-orm';
import { authenticate } from '../auth/authMiddleware.js';
import {
  getDefaultAttributes,
  isAgentType,
  type AgentType,
  type AgentAttributeRegistryEntry,
} from '../lib/AgentAttributeRegistry.js';

interface AttributeValueSnapshot {
  value: string | null;
  createdAt: string | null;
}

export function registerAgentAttributeRoutes(app: Express): void {
  app.get('/api/agents/:agentType/attributes', authenticate, async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType;
      if (!isAgentType(agentType)) {
        return res.status(400).json({ error: 'Invalid agent type' });
      }

      const includeValues = req.query.includeValues === 'true';

      const defaultAttributes = getDefaultAttributes(agentType);
      const customAttributeRows = await db
        .select()
        .from(customAttributes)
        .where(eq(customAttributes.ownerAgent, agentType));

      const customAttributeEntries: AgentAttributeRegistryEntry[] = customAttributeRows.map((attr) => ({
        name: attr.name,
        displayName: attr.label,
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

      const allAttributes = [...defaultAttributes, ...customAttributeEntries];

      const latestFacts = await db.execute(sql`
        SELECT DISTINCT ON (attribute)
          attribute,
          value,
          created_at
        FROM agent_facts
        WHERE source_agent = ${agentType}
        ORDER BY attribute, created_at DESC
      `);

      const latestMap = new Map<string, AttributeValueSnapshot>();
      (latestFacts.rows || []).forEach((row: any) => {
        latestMap.set(row.attribute, {
          value: row.value ?? null,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        });
      });

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
      });
    } catch (error: any) {
      console.error('[AgentAttributes] List error:', error);
      res.status(500).json({ error: error.message || 'Failed to load attributes' });
    }
  });

  app.get('/api/agents/:agentType/attributes/:attribute', authenticate, async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType;
      const attributeName = req.params.attribute;

      if (!isAgentType(agentType)) {
        return res.status(400).json({ error: 'Invalid agent type' });
      }

      const defaultAttributes = getDefaultAttributes(agentType);
      const defaultEntry = defaultAttributes.find((attr) => attr.name === attributeName) || null;
      const [customEntry] = await db
        .select()
        .from(customAttributes)
        .where(eq(customAttributes.name, attributeName))
        .limit(1);

      const latestFacts = await db.execute(sql`
        SELECT value, created_at
        FROM agent_facts
        WHERE source_agent = ${agentType}
          AND attribute = ${attributeName}
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const latest = latestFacts.rows?.[0] as any;
      const value = latest?.value ?? null;
      const lastUpdated = latest?.created_at ? new Date(latest.created_at).toISOString() : null;

      const metadata = defaultEntry || (customEntry
        ? {
            name: customEntry.name,
            displayName: customEntry.label,
            type: (customEntry.dataType as AgentAttributeRegistryEntry['type']) || 'text',
            description: customEntry.description || 'Custom attribute',
            unit: customEntry.unit || undefined,
            source: 'external_api',
            ownerAgent: agentType as AgentType,
            sourceKind: customEntry.mcpToolName ? 'external_api' : 'admin_input',
            endpoint: `/api/agents/${agentType}/attributes/${customEntry.name}`,
          }
        : null);

      if (!metadata) {
        return res.status(404).json({ error: 'Attribute not found' });
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
      });
    } catch (error: any) {
      console.error('[AgentAttributes] Get attribute error:', error);
      res.status(500).json({ error: error.message || 'Failed to load attribute' });
    }
  });
}
