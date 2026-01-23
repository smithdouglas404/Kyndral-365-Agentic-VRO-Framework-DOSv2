/**
 * COMPLIANCE VALIDATION API ROUTES
 *
 * Provides endpoints for regulatory compliance checking and validation
 */

import { Router } from 'express';
import type { IStorage } from '../storage.js';
import { createComplianceValidationService } from '../lib/ComplianceValidationService.js';

export function createComplianceRoutes(storage: IStorage): Router {
  const router = Router();
  const complianceService = createComplianceValidationService(storage);

  /**
   * GET /api/compliance/validate/:projectId
   * Validate project against applicable regulatory frameworks
   */
  router.get('/validate/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;

      const result = await complianceService.validateProject(projectId);

      res.json({
        success: true,
        compliance: result,
      });
    } catch (error: any) {
      console.error('[Compliance] Validation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/compliance/portfolio
   * Get compliance summary for entire portfolio or specific portfolio
   */
  router.get('/portfolio', async (req, res) => {
    try {
      const { portfolioId } = req.query;

      const summary = await complianceService.getPortfolioCompliance(
        portfolioId as string | undefined
      );

      res.json({
        success: true,
        summary,
      });
    } catch (error: any) {
      console.error('[Compliance] Portfolio summary error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/compliance/frameworks/:industry
   * Get applicable regulatory frameworks for an industry
   */
  router.get('/frameworks/:industry', async (req, res) => {
    try {
      const { industry } = req.params;

      const result = await storage.db.query(
        `SELECT id, industry, framework_name, requirements, severity, authority
         FROM regulatory_frameworks
         WHERE industry = $1 OR industry = 'general'
         ORDER BY severity DESC`,
        [industry]
      );

      const frameworks = result.rows.map(row => ({
        id: row.id,
        industry: row.industry,
        frameworkName: row.framework_name,
        requirements: JSON.parse(row.requirements || '[]'),
        severity: row.severity,
        authority: row.authority,
      }));

      res.json({
        success: true,
        frameworks,
      });
    } catch (error: any) {
      console.error('[Compliance] Get frameworks error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/compliance/check-requirement
   * Check if specific requirement is met
   */
  router.post('/check-requirement', async (req, res) => {
    try {
      const { projectId, requirement } = req.body;

      if (!projectId || !requirement) {
        return res.status(400).json({
          success: false,
          error: 'projectId and requirement are required',
        });
      }

      const isMet = await complianceService.checkRequirement(projectId, requirement);

      res.json({
        success: true,
        requirementMet: isMet,
      });
    } catch (error: any) {
      console.error('[Compliance] Check requirement error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}
