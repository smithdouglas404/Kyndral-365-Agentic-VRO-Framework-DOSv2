/**
 * POLICY-AS-CODE API
 *
 * CRUD operations + HITL approval workflow for policy-as-code.
 *
 * Endpoints:
 * - POST /api/policy/extract/:documentId - Extract policy from document
 * - GET /api/policy - List all policies
 * - GET /api/policy/:id - Get single policy
 * - PUT /api/policy/:id/approve - Approve policy (HITL)
 * - PUT /api/policy/:id/reject - Reject policy
 * - PUT /api/policy/:id/activate - Activate scheduled policy
 * - DELETE /api/policy/:id - Delete policy
 * - GET /api/policy/:id/audit - Get extraction audit trail
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db.js';
import {
  policyAsCode,
  policyExtractionAudit,
  customAttributes,
  agentCollaborationRules,
} from '../../shared/schema.js';
import { sql, eq, desc } from 'drizzle-orm';
import { authenticate } from '../auth/authMiddleware.js';
import { policyExtractionService } from '../lib/PolicyExtractionService.js';

export function registerPolicyAsCodeRoutes(app: Express): void {
  /**
   * POST /api/policy/extract/:documentId
   * Extract policy from a document using LLM
   */
  app.post('/api/policy/extract/:documentId', authenticate, async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { model, complianceFramework } = req.body;

      const policyId = await policyExtractionService.extractPolicy(documentId, {
        model: model || 'gpt-4',
        complianceFramework,
        createdBy: req.user?.id || 'system',
      });

      res.json({
        success: true,
        policyId,
        message: 'Policy extracted successfully. Awaiting human approval.',
      });
    } catch (error: any) {
      console.error('[PolicyExtraction] Extract error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy
   * List all policies with filters
   */
  app.get('/api/policy', authenticate, async (req: Request, res: Response) => {
    try {
      const { status, complianceFramework, documentType } = req.query;

      let query = db.select().from(policyAsCode).orderBy(desc(policyAsCode.createdAt));

      // Apply filters
      if (status) {
        query = query.where(eq(policyAsCode.status, status as string)) as any;
      }
      if (complianceFramework) {
        query = query.where(eq(policyAsCode.complianceFramework, complianceFramework as string)) as any;
      }
      if (documentType) {
        query = query.where(eq(policyAsCode.documentType, documentType as string)) as any;
      }

      const policies = await query;

      res.json({
        success: true,
        policies: policies.map((p) => ({
          ...p,
          sectionsCovered: JSON.parse(p.sectionsCovered),
          fullPolicyCode: JSON.parse(p.fullPolicyCode),
        })),
      });
    } catch (error: any) {
      console.error('[Policy] List error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy/:id
   * Get single policy by ID
   */
  app.get('/api/policy/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [policy] = await db.select().from(policyAsCode).where(eq(policyAsCode.id, id)).limit(1);

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: 'Policy not found',
        });
      }

      res.json({
        success: true,
        policy: {
          ...policy,
          sectionsCovered: JSON.parse(policy.sectionsCovered),
          fullPolicyCode: JSON.parse(policy.fullPolicyCode),
        },
      });
    } catch (error: any) {
      console.error('[Policy] Get by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/policy/:id/approve
   * Approve policy and activate rules (HITL step)
   */
  app.put('/api/policy/:id/approve', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { effectiveDate, activateImmediately, reviewNotes } = req.body;

      await policyExtractionService.approvePolicy(id, {
        approvedBy: req.user?.id || 'system',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        activateImmediately: activateImmediately !== false, // Default to true
        reviewNotes,
      });

      res.json({
        success: true,
        message: activateImmediately
          ? 'Policy approved and activated'
          : `Policy approved. Will activate on ${effectiveDate}`,
      });
    } catch (error: any) {
      console.error('[Policy] Approve error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/policy/:id/reject
   * Reject policy
   */
  app.put('/api/policy/:id/reject', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        return res.status(400).json({
          success: false,
          error: 'Review notes are required for rejection',
        });
      }

      await policyExtractionService.rejectPolicy(id, req.user?.id || 'system', reviewNotes);

      res.json({
        success: true,
        message: 'Policy rejected',
      });
    } catch (error: any) {
      console.error('[Policy] Reject error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/policy/:id/activate
   * Manually activate a scheduled policy
   */
  app.put('/api/policy/:id/activate', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [policy] = await db.select().from(policyAsCode).where(eq(policyAsCode.id, id)).limit(1);

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: 'Policy not found',
        });
      }

      if (policy.status !== 'scheduled') {
        return res.status(400).json({
          success: false,
          error: `Cannot activate policy with status: ${policy.status}`,
        });
      }

      // Enable all rules associated with this policy
      await db
        .update(agentCollaborationRules)
        .set({ enabled: true })
        .where(eq(agentCollaborationRules.sourcePolicyId, id));

      // Update policy status
      await db
        .update(policyAsCode)
        .set({
          status: 'active',
          activatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(policyAsCode.id, id));

      res.json({
        success: true,
        message: 'Policy activated successfully',
      });
    } catch (error: any) {
      console.error('[Policy] Activate error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/policy/:id
   * Delete policy and associated rules/attributes
   */
  app.delete('/api/policy/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Delete associated custom attributes
      await db.delete(customAttributes).where(eq(customAttributes.sourcePolicyId, id));

      // Delete associated rules
      await db.delete(agentCollaborationRules).where(eq(agentCollaborationRules.sourcePolicyId, id));

      // Delete policy
      await db.delete(policyAsCode).where(eq(policyAsCode.id, id));

      res.json({
        success: true,
        message: 'Policy and associated rules/attributes deleted',
      });
    } catch (error: any) {
      console.error('[Policy] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy/:id/audit
   * Get extraction audit trail for a policy
   */
  app.get('/api/policy/:id/audit', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const auditTrail = await db
        .select()
        .from(policyExtractionAudit)
        .where(eq(policyExtractionAudit.policyId, id))
        .orderBy(policyExtractionAudit.createdAt);

      res.json({
        success: true,
        auditTrail: auditTrail.map((audit) => ({
          ...audit,
          extractedContent: audit.extractedContent ? JSON.parse(audit.extractedContent) : null,
          confidenceScores: audit.confidenceScores ? JSON.parse(audit.confidenceScores) : null,
          errors: audit.errors ? JSON.parse(audit.errors) : null,
          warnings: audit.warnings ? JSON.parse(audit.warnings) : null,
        })),
      });
    } catch (error: any) {
      console.error('[Policy] Audit trail error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy/stats
   * Get policy statistics
   */
  app.get('/api/policy/stats', authenticate, async (req: Request, res: Response) => {
    try {
      const stats = await db.query.raw(`
        SELECT
          COUNT(*) as total_policies,
          SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_review,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(custom_attributes_created) as total_attributes,
          SUM(rules_generated) as total_rules,
          AVG(extraction_confidence) as avg_confidence,
          SUM(extraction_cost) as total_cost
        FROM policy_as_code
      `);

      res.json({
        success: true,
        stats: stats.rows[0],
      });
    } catch (error: any) {
      console.error('[Policy] Stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[PolicyAsCode] Routes registered');
}
