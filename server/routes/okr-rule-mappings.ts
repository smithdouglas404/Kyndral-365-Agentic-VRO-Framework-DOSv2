/**
 * OKR-RULE MAPPINGS API
 *
 * Endpoints for managing mappings between OKRs and agent collaboration rules.
 * These mappings define how agent rules trigger based on OKR/KPI thresholds.
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';
import { z } from 'zod';

const mappingSchema = z.object({
  okrId: z.string(),
  camundaRuleId: z.string(),
  agent: z.string(),
  threshold: z.number(),
  thresholdOperator: z.enum(['<', '>', '<=', '>=', '==']),
  thresholdType: z.enum(['critical', 'warning', 'info']),
  actions: z.array(z.string()),
  notificationTargets: z.object({
    inApp: z.boolean().optional(),
    email: z.array(z.string()).optional(),
    slack: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
  }),
  isActive: z.boolean().default(true),
});

export function registerOKRRuleMappingRoutes(app: Express, storage: IStorage): void {
  /**
   * GET /api/okr-rule-mappings
   * Fetch all OKR-rule mappings (with optional filters)
   */
  app.get('/api/okr-rule-mappings', async (req, res) => {
    try {
      const { agent, okrId } = req.query;

      // Fetch OKRs
      const okrs = await storage.getOKRs();

      // Fetch collaboration rules
      const rules = await storage.getAgentCollaborationRules();

      // For now, create mappings based on OKR functional areas and rule agents
      // This creates a logical connection between OKRs and rules
      const mappings = okrs
        .map((okr) => {
          // Find rules that match this OKR's functional area
          const matchingRules = rules.filter((rule) => {
            // Extract agent names from rule conditions
            const ruleAgents = rule.conditionLogic?.agents || [];
            return okr.functionalArea && ruleAgents.includes(okr.functionalArea);
          });

          return matchingRules.map((rule) => ({
            id: `${okr.id}-${rule.id}`,
            okrId: okr.id,
            okrTitle: okr.title,
            kpiMetric: okr.description || 'N/A',
            agent: okr.functionalArea || 'unknown',
            threshold: 0.90, // Default threshold
            thresholdOperator: '<' as const,
            thresholdType: rule.priority > 7 ? ('critical' as const) : ('warning' as const),
            camundaRuleId: rule.id,
            ruleName: rule.name,
            actions: ['notify', 'email'],
            notificationTargets: {
              inApp: true,
              email: [],
              slack: [],
              teams: [],
            },
            isActive: rule.enabled,
          }));
        })
        .flat();

      // Apply filters
      let filtered = mappings;
      if (agent) {
        filtered = filtered.filter((m) => m.agent === agent);
      }
      if (okrId) {
        filtered = filtered.filter((m) => m.okrId === okrId);
      }

      res.json({ mappings: filtered });
    } catch (error: any) {
      console.error('Error fetching OKR-rule mappings:', error);
      res.status(500).json({
        error: 'Failed to fetch OKR-rule mappings',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/okr-rule-mappings
   * Create a new OKR-rule mapping
   */
  app.post('/api/okr-rule-mappings', async (req, res) => {
    try {
      const data = mappingSchema.parse(req.body);

      // For now, we'll store this as metadata in the collaboration rule
      // In a production system, you'd have a separate table for this
      const rule = await storage.getAgentCollaborationRuleById(data.camundaRuleId);

      if (!rule) {
        return res.status(404).json({ error: 'Rule not found' });
      }

      // Update rule with OKR linkage metadata
      await storage.updateAgentCollaborationRule(data.camundaRuleId, {
        ...rule,
        metadata: {
          ...rule.metadata,
          okrLinkages: [
            ...(rule.metadata?.okrLinkages || []),
            {
              okrId: data.okrId,
              threshold: data.threshold,
              thresholdOperator: data.thresholdOperator,
              thresholdType: data.thresholdType,
              actions: data.actions,
              notificationTargets: data.notificationTargets,
            },
          ],
        },
      });

      res.status(201).json({
        message: 'OKR-rule mapping created successfully',
        mapping: {
          id: `${data.okrId}-${data.camundaRuleId}`,
          ...data,
        },
      });
    } catch (error: any) {
      console.error('Error creating OKR-rule mapping:', error);
      res.status(500).json({
        error: 'Failed to create OKR-rule mapping',
        message: error.message,
      });
    }
  });

  /**
   * PUT /api/okr-rule-mappings/:mappingId
   * Update an existing OKR-rule mapping
   */
  app.put('/api/okr-rule-mappings/:mappingId', async (req, res) => {
    try {
      const { mappingId } = req.params;
      const data = mappingSchema.partial().parse(req.body);

      // Parse mapping ID (format: okrId-ruleId)
      const [okrId, ruleId] = mappingId.split('-');

      if (!ruleId) {
        return res.status(400).json({ error: 'Invalid mapping ID format' });
      }

      const rule = await storage.getAgentCollaborationRuleById(ruleId);

      if (!rule) {
        return res.status(404).json({ error: 'Rule not found' });
      }

      // Update the specific OKR linkage in rule metadata
      const okrLinkages = rule.metadata?.okrLinkages || [];
      const linkageIndex = okrLinkages.findIndex((l: any) => l.okrId === okrId);

      if (linkageIndex >= 0) {
        okrLinkages[linkageIndex] = {
          ...okrLinkages[linkageIndex],
          ...data,
        };
      }

      await storage.updateAgentCollaborationRule(ruleId, {
        ...rule,
        metadata: {
          ...rule.metadata,
          okrLinkages,
        },
      });

      res.json({
        message: 'OKR-rule mapping updated successfully',
        mapping: { id: mappingId, ...data },
      });
    } catch (error: any) {
      console.error('Error updating OKR-rule mapping:', error);
      res.status(500).json({
        error: 'Failed to update OKR-rule mapping',
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/okr-rule-mappings/:mappingId
   * Delete an OKR-rule mapping
   */
  app.delete('/api/okr-rule-mappings/:mappingId', async (req, res) => {
    try {
      const { mappingId } = req.params;

      // Parse mapping ID (format: okrId-ruleId)
      const [okrId, ruleId] = mappingId.split('-');

      if (!ruleId) {
        return res.status(400).json({ error: 'Invalid mapping ID format' });
      }

      const rule = await storage.getAgentCollaborationRuleById(ruleId);

      if (!rule) {
        return res.status(404).json({ error: 'Rule not found' });
      }

      // Remove the specific OKR linkage from rule metadata
      const okrLinkages = (rule.metadata?.okrLinkages || []).filter(
        (l: any) => l.okrId !== okrId
      );

      await storage.updateAgentCollaborationRule(ruleId, {
        ...rule,
        metadata: {
          ...rule.metadata,
          okrLinkages,
        },
      });

      res.json({ message: 'OKR-rule mapping deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting OKR-rule mapping:', error);
      res.status(500).json({
        error: 'Failed to delete OKR-rule mapping',
        message: error.message,
      });
    }
  });
}
