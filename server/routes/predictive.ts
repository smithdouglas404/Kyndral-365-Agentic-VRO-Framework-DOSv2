/**
 * PREDICTIVE ANALYTICS API ROUTES
 *
 * Exposes predictive intelligence to:
 * - Risk Agent for proactive risk management
 * - TMO Agent for schedule optimization
 * - Executive dashboards for early warnings
 * - PMs for predictive insights
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';
import { PredictiveAnalyticsEngine } from '../engines/PredictiveAnalyticsEngine.js';

export function registerPredictiveRoutes(app: Express, storage: IStorage): void {
  const predictiveEngine = new PredictiveAnalyticsEngine(storage);

  /**
   * GET /api/predictive/projects/:projectId/risks
   * Predict project risks with ML-based scoring
   */
  app.get('/api/predictive/projects/:projectId/risks', async (req, res) => {
    try {
      const { projectId } = req.params;

      const risks = await predictiveEngine.predictRisks(projectId);

      res.json({
        success: true,
        projectId,
        risks,
      });
    } catch (error: any) {
      console.error('[Predictive] Risk prediction error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to predict risks',
      });
    }
  });

  /**
   * GET /api/predictive/projects/:projectId/schedule-forecast
   * Forecast schedule completion with Monte Carlo simulation
   */
  app.get('/api/predictive/projects/:projectId/schedule-forecast', async (req, res) => {
    try {
      const { projectId } = req.params;

      const forecast = await predictiveEngine.forecastSchedule(projectId);

      res.json({
        success: true,
        projectId,
        forecast,
      });
    } catch (error: any) {
      console.error('[Predictive] Schedule forecast error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to forecast schedule',
      });
    }
  });

  /**
   * GET /api/predictive/projects/:projectId/anomalies
   * Detect anomalies in project metrics
   */
  app.get('/api/predictive/projects/:projectId/anomalies', async (req, res) => {
    try {
      const { projectId } = req.params;

      const anomalies = await predictiveEngine.detectAnomalies(projectId);

      res.json({
        success: true,
        projectId,
        anomalies,
      });
    } catch (error: any) {
      console.error('[Predictive] Anomaly detection error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to detect anomalies',
      });
    }
  });

  /**
   * GET /api/predictive/projects/:projectId/early-warnings
   * Generate early warning alerts
   */
  app.get('/api/predictive/projects/:projectId/early-warnings', async (req, res) => {
    try {
      const { projectId } = req.params;

      const warnings = await predictiveEngine.generateEarlyWarnings(projectId);

      res.json({
        success: true,
        projectId,
        warnings,
      });
    } catch (error: any) {
      console.error('[Predictive] Early warnings error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to generate early warnings',
      });
    }
  });

  /**
   * POST /api/predictive/batch/risks
   * Batch risk prediction for multiple projects
   * Used by Risk Agent for portfolio-wide risk analysis
   */
  app.post('/api/predictive/batch/risks', async (req, res) => {
    try {
      const { projectIds } = req.body;

      if (!Array.isArray(projectIds) || projectIds.length === 0) {
        return res.status(400).json({
          error: 'projectIds must be a non-empty array',
        });
      }

      if (projectIds.length > 100) {
        return res.status(400).json({
          error: 'Maximum 100 projects per batch request',
        });
      }

      const results = await Promise.allSettled(
        projectIds.map(id => predictiveEngine.predictRisks(id))
      );

      const successResults = results.map((result, index) => ({
        projectId: projectIds[index],
        success: result.status === 'fulfilled',
        risks: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
      }));

      const successCount = successResults.filter(r => r.success).length;

      res.json({
        success: true,
        totalRequested: projectIds.length,
        successCount,
        failureCount: projectIds.length - successCount,
        results: successResults,
      });
    } catch (error: any) {
      console.error('[Predictive] Batch risk prediction error:', error);
      res.status(500).json({
        error: error.message || 'Failed to predict batch risks',
      });
    }
  });

  /**
   * POST /api/predictive/batch/early-warnings
   * Batch early warnings for multiple projects
   * Used by agents for portfolio-wide monitoring
   */
  app.post('/api/predictive/batch/early-warnings', async (req, res) => {
    try {
      const { projectIds } = req.body;

      if (!Array.isArray(projectIds) || projectIds.length === 0) {
        return res.status(400).json({
          error: 'projectIds must be a non-empty array',
        });
      }

      if (projectIds.length > 100) {
        return res.status(400).json({
          error: 'Maximum 100 projects per batch request',
        });
      }

      const results = await Promise.allSettled(
        projectIds.map(id => predictiveEngine.generateEarlyWarnings(id))
      );

      const allWarnings: any[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allWarnings.push(...result.value);
        }
      });

      // Sort by severity (critical first)
      const sortedWarnings = allWarnings.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      res.json({
        success: true,
        totalProjects: projectIds.length,
        totalWarnings: allWarnings.length,
        criticalCount: allWarnings.filter(w => w.severity === 'critical').length,
        warningCount: allWarnings.filter(w => w.severity === 'warning').length,
        warnings: sortedWarnings,
      });
    } catch (error: any) {
      console.error('[Predictive] Batch early warnings error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate batch early warnings',
      });
    }
  });

  /**
   * GET /api/predictive/portfolio-risk-heatmap
   * Generate risk heatmap for all projects
   * Used by executive dashboard
   */
  app.get('/api/predictive/portfolio-risk-heatmap', async (req, res) => {
    try {
      const allProjects = await storage.getProjects();

      // Calculate risk for all projects
      const riskResults = await Promise.allSettled(
        allProjects.map(p => predictiveEngine.predictRisks(p.id))
      );

      const heatmap = riskResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            const risks = result.value;
            return {
              projectId: allProjects[index].id,
              projectName: allProjects[index].name,
              overallRiskScore: risks.overallRiskScore,
              budgetRiskScore: risks.budgetRiskScore,
              scheduleRiskScore: risks.scheduleRiskScore,
              riskLevel: risks.overallRiskScore > 70 ? 'critical' :
                         risks.overallRiskScore > 50 ? 'high' :
                         risks.overallRiskScore > 30 ? 'medium' : 'low',
            };
          }
          return null;
        })
        .filter(item => item !== null)
        .sort((a, b) => b!.overallRiskScore - a!.overallRiskScore);

      const riskDistribution = {
        critical: heatmap.filter(p => p!.riskLevel === 'critical').length,
        high: heatmap.filter(p => p!.riskLevel === 'high').length,
        medium: heatmap.filter(p => p!.riskLevel === 'medium').length,
        low: heatmap.filter(p => p!.riskLevel === 'low').length,
      };

      res.json({
        success: true,
        totalProjects: heatmap.length,
        riskDistribution,
        heatmap,
      });
    } catch (error: any) {
      console.error('[Predictive] Portfolio risk heatmap error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate risk heatmap',
      });
    }
  });

  console.log('[Predictive] Predictive analytics routes registered');
}
