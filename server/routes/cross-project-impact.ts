/**
 * CROSS-PROJECT IMPACT API ROUTES
 *
 * THE CRITICAL DIFFERENTIATOR FROM PM TOOLS
 *
 * Exposes cross-project intelligence to:
 * - All agents for cascade impact analysis
 * - Executive dashboards for portfolio-wide insights
 * - Email alerts for cross-project warnings
 * - PMs for dependency management
 */

import type { Express } from 'express';
import { authenticate } from '../auth/authMiddleware.js';
import type { IStorage } from '../storage.js';
import { CrossProjectImpactEngine } from '../engines/CrossProjectImpactEngine.js';

export function registerCrossProjectImpactRoutes(app: Express, storage: IStorage): void {
  const impactEngine = new CrossProjectImpactEngine(storage);

  /**
   * GET /api/cross-project/dependencies
   * Map all cross-project dependencies in portfolio
   */
  app.get('/api/cross-project/dependencies', authenticate, async (req, res) => {
    try {
      const { portfolioId } = req.query;

      const dependencies = await impactEngine.mapCrossProjectDependencies(portfolioId as string | undefined);

      res.json({
        success: true,
        totalDependencies: dependencies.length,
        criticalDependencies: dependencies.filter(d => d.criticality === 'critical').length,
        blockedDependencies: dependencies.filter(d => d.status === 'blocked').length,
        dependencies,
      });
    } catch (error: any) {
      console.error('[CrossProject] Dependencies mapping error:', error);
      res.status(500).json({
        error: error.message || 'Failed to map dependencies',
      });
    }
  });

  /**
   * POST /api/cross-project/cascade-impact
   * Analyze cascade impacts of a project change
   * THIS IS THE KILLER FEATURE - PM TOOLS CAN'T DO THIS
   */
  app.post('/api/cross-project/cascade-impact', authenticate, async (req, res) => {
    try {
      const { projectId, changeType, changeValue } = req.body;

      if (!projectId || !changeType) {
        return res.status(400).json({
          error: 'projectId and changeType are required',
        });
      }

      const analysis = await impactEngine.analyzeCascadeImpact(
        projectId,
        changeType,
        changeValue || {}
      );

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error('[CrossProject] Cascade impact analysis error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to analyze cascade impact',
      });
    }
  });

  /**
   * POST /api/cross-project/recommendations
   * Generate AI recommendations with full traceability
   */
  app.post('/api/cross-project/recommendations', authenticate, async (req, res) => {
    try {
      const { projectId, context, createdBy } = req.body;

      if (!projectId || !context) {
        return res.status(400).json({
          error: 'projectId and context are required',
        });
      }

      const recommendations = await impactEngine.generateRecommendationsWithTraceability(
        projectId,
        context,
        createdBy || 'system'
      );

      res.json({
        success: true,
        totalRecommendations: recommendations.length,
        recommendations,
      });
    } catch (error: any) {
      console.error('[CrossProject] Recommendations generation error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to generate recommendations',
      });
    }
  });

  /**
   * GET /api/cross-project/resource-contention
   * Detect resource contention across projects
   */
  app.get('/api/cross-project/resource-contention', authenticate, async (req, res) => {
    try {
      const { portfolioId } = req.query;

      const contentions = await impactEngine.detectResourceContention(portfolioId as string | undefined);

      res.json({
        success: true,
        totalContentions: contentions.length,
        criticalContentions: contentions.filter(c => c.severity === 'critical').length,
        contentions,
      });
    } catch (error: any) {
      console.error('[CrossProject] Resource contention detection error:', error);
      res.status(500).json({
        error: error.message || 'Failed to detect resource contention',
      });
    }
  });

  /**
   * POST /api/cross-project/what-if-scenario
   * Run what-if scenario simulation
   */
  app.post('/api/cross-project/what-if-scenario', authenticate, async (req, res) => {
    try {
      const scenario = req.body;

      if (!scenario.scenarioName || !scenario.changes) {
        return res.status(400).json({
          error: 'scenarioName and changes are required',
        });
      }

      const result = await impactEngine.simulateWhatIfScenario(scenario);

      res.json({
        success: true,
        scenario: result,
      });
    } catch (error: any) {
      console.error('[CrossProject] What-if scenario error:', error);
      res.status(500).json({
        error: error.message || 'Failed to simulate scenario',
      });
    }
  });

  /**
   * GET /api/cross-project/dependency-health
   * Get portfolio-wide dependency health dashboard
   * Used by executive dashboard
   */
  app.get('/api/cross-project/dependency-health', authenticate, async (req, res) => {
    try {
      const { portfolioId } = req.query;

      const dependencies = await impactEngine.mapCrossProjectDependencies(portfolioId as string | undefined);

      // Calculate health metrics
      const healthMetrics = {
        totalDependencies: dependencies.length,
        healthyDependencies: dependencies.filter(d => d.status === 'healthy').length,
        atRiskDependencies: dependencies.filter(d => d.status === 'at-risk').length,
        blockedDependencies: dependencies.filter(d => d.status === 'blocked').length,
        averageRiskScore: dependencies.reduce((sum, d) => sum + d.riskScore, 0) / dependencies.length,
        criticalityDistribution: {
          critical: dependencies.filter(d => d.criticality === 'critical').length,
          high: dependencies.filter(d => d.criticality === 'high').length,
          medium: dependencies.filter(d => d.criticality === 'medium').length,
          low: dependencies.filter(d => d.criticality === 'low').length,
        },
        topRiskDependencies: dependencies
          .sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 10),
      };

      res.json({
        success: true,
        healthMetrics,
      });
    } catch (error: any) {
      console.error('[CrossProject] Dependency health error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get dependency health',
      });
    }
  });

  console.log('[CrossProject] Cross-project impact routes registered');
}
