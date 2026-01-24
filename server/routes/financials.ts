/**
 * FINANCIAL INTELLIGENCE API ROUTES
 *
 * Exposes financial calculation engine to:
 * - FinOps Agent for autonomous budget monitoring
 * - VRO Agent for value realization tracking
 * - Executive dashboards for portfolio insights
 * - PM tools for deep financial analytics
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';
import { FinancialCalculationEngine } from '../engines/FinancialCalculationEngine.js';
import { authenticate } from '../auth/authMiddleware.js';

export function registerFinancialRoutes(app: Express, storage: IStorage): void {
  const financialEngine = new FinancialCalculationEngine(storage);

  /**
   * GET /api/financials/projects/:projectId/evm
   * Get comprehensive EVM metrics for a project
   */
  app.get('/api/financials/projects/:projectId/evm', authenticate, async (req, res) => {
    try {
      const { projectId } = req.params;

      const evm = await financialEngine.calculateEVM(projectId);

      res.json({
        success: true,
        projectId,
        evm,
      });
    } catch (error: any) {
      console.error('[Financials] EVM calculation error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to calculate EVM metrics',
      });
    }
  });

  /**
   * GET /api/financials/projects/:projectId/forecast
   * Get budget forecast with confidence scoring
   */
  app.get('/api/financials/projects/:projectId/forecast', authenticate, async (req, res) => {
    try {
      const { projectId } = req.params;

      const forecast = await financialEngine.forecastBudget(projectId);

      res.json({
        success: true,
        projectId,
        forecast,
      });
    } catch (error: any) {
      console.error('[Financials] Budget forecast error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to forecast budget',
      });
    }
  });

  /**
   * GET /api/financials/projects/:projectId/value-realization
   * Get value realization metrics (ROI tracking)
   */
  app.get('/api/financials/projects/:projectId/value-realization', authenticate, async (req, res) => {
    try {
      const { projectId } = req.params;

      const valueRealization = await financialEngine.calculateValueRealization(projectId);

      res.json({
        success: true,
        projectId,
        valueRealization,
      });
    } catch (error: any) {
      console.error('[Financials] Value realization error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to calculate value realization',
      });
    }
  });

  /**
   * GET /api/financials/projects/:projectId/cost-attribution
   * Get detailed cost attribution across resources, phases, categories
   */
  app.get('/api/financials/projects/:projectId/cost-attribution', authenticate, async (req, res) => {
    try {
      const { projectId } = req.params;

      const attribution = await financialEngine.calculateCostAttribution(projectId);

      res.json({
        success: true,
        projectId,
        attribution,
      });
    } catch (error: any) {
      console.error('[Financials] Cost attribution error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to calculate cost attribution',
      });
    }
  });

  /**
   * GET /api/financials/portfolios/:portfolioId/analysis
   * Get portfolio-level budget analysis
   */
  app.get('/api/financials/portfolios/:portfolioId/analysis', authenticate, async (req, res) => {
    try {
      const { portfolioId } = req.params;

      const analysis = await financialEngine.analyzePortfolioBudget(portfolioId);

      res.json({
        success: true,
        portfolioId,
        analysis,
      });
    } catch (error: any) {
      console.error('[Financials] Portfolio analysis error:', error);
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to analyze portfolio budget',
      });
    }
  });

  /**
   * POST /api/financials/batch/evm
   * Batch calculate EVM for multiple projects
   * Used by agents for portfolio-wide analysis
   */
  app.post('/api/financials/batch/evm', authenticate, async (req, res) => {
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
        projectIds.map(id => financialEngine.calculateEVM(id))
      );

      const successResults = results
        .map((result, index) => ({
          projectId: projectIds[index],
          success: result.status === 'fulfilled',
          evm: result.status === 'fulfilled' ? result.value : null,
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
      console.error('[Financials] Batch EVM error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate batch EVM',
      });
    }
  });

  /**
   * POST /api/financials/batch/value-realization
   * Batch calculate value realization for multiple projects
   * Used by VRO Agent for portfolio-wide value tracking
   */
  app.post('/api/financials/batch/value-realization', authenticate, async (req, res) => {
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
        projectIds.map(id => financialEngine.calculateValueRealization(id))
      );

      const successResults = results
        .map((result, index) => ({
          projectId: projectIds[index],
          success: result.status === 'fulfilled',
          valueRealization: result.status === 'fulfilled' ? result.value : null,
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
      console.error('[Financials] Batch value realization error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate batch value realization',
      });
    }
  });

  /**
   * GET /api/financials/portfolio-overview
   * Get financial overview across all portfolios
   * Used by executive dashboard
   */
  app.get('/api/financials/portfolio-overview', authenticate, async (req, res) => {
    try {
      const portfolios = await storage.getPortfolios();

      const portfolioAnalyses = await Promise.allSettled(
        portfolios.map(p => financialEngine.analyzePortfolioBudget(p.id))
      );

      const results = portfolioAnalyses.map((result, index) => ({
        portfolioId: portfolios[index].id,
        portfolioName: portfolios[index].name,
        success: result.status === 'fulfilled',
        analysis: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
      }));

      // Calculate enterprise totals
      const successfulAnalyses = results.filter(r => r.success && r.analysis).map(r => r.analysis!);

      const enterpriseTotals = {
        totalBudget: successfulAnalyses.reduce((sum, a) => sum + a.totalBudget, 0),
        totalSpent: successfulAnalyses.reduce((sum, a) => sum + a.totalSpent, 0),
        totalForecasted: successfulAnalyses.reduce((sum, a) => sum + a.totalForecasted, 0),
        totalProjects: successfulAnalyses.reduce((sum, a) => sum + a.totalProjects, 0),
        overallCPI: successfulAnalyses.reduce((sum, a) => sum + a.averageCPI, 0) / successfulAnalyses.length,
        overallSPI: successfulAnalyses.reduce((sum, a) => sum + a.averageSPI, 0) / successfulAnalyses.length,
        healthDistribution: {
          healthy: successfulAnalyses.reduce((sum, a) => sum + a.healthDistribution.healthy, 0),
          atRisk: successfulAnalyses.reduce((sum, a) => sum + a.healthDistribution.atRisk, 0),
          critical: successfulAnalyses.reduce((sum, a) => sum + a.healthDistribution.critical, 0),
        },
      };

      res.json({
        success: true,
        enterpriseTotals,
        portfolios: results,
      });
    } catch (error: any) {
      console.error('[Financials] Portfolio overview error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate portfolio overview',
      });
    }
  });

  console.log('[Financials] Financial intelligence routes registered');
}
