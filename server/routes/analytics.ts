/**
 * ANALYTICS ENGINE API ROUTES
 * Exposes the three major analytics engines to the UI:
 * - Predictive Analytics Engine
 * - Cross-Project Impact Engine
 * - Financial Calculation Engine
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { PredictiveAnalyticsEngine } from '../engines/PredictiveAnalyticsEngine.js';
import { CrossProjectImpactEngine } from '../engines/CrossProjectImpactEngine.js';
import { FinancialCalculationEngine } from '../engines/FinancialCalculationEngine.js';

export function registerAnalyticsRoutes(app: Express, storage: IStorage) {
  const predictiveEngine = new PredictiveAnalyticsEngine(storage);
  const impactEngine = new CrossProjectImpactEngine(storage);
  const financialEngine = new FinancialCalculationEngine(storage);

  /**
   * PREDICTIVE ANALYTICS ENGINE
   */

  // GET /api/analytics/predictions - Get risk predictions for all projects
  app.get('/api/analytics/predictions', async (req: Request, res: Response) => {
    try {
      const { projectIds, threshold } = req.query;

      let projectsToAnalyze: string[];

      if (projectIds && typeof projectIds === 'string') {
        projectsToAnalyze = projectIds.split(',');
      } else {
        // Get all active projects
        const allProjects = await storage.getProjects();
        projectsToAnalyze = allProjects
          .filter(p => p.status === 'active')
          .map(p => p.id);
      }

      // Get predictions for each project
      const predictions = await Promise.all(
        projectsToAnalyze.map(async (projectId) => {
          try {
            return await predictiveEngine.predictRisk(projectId);
          } catch (error) {
            console.error(`Error predicting risk for project ${projectId}:`, error);
            return null;
          }
        })
      );

      // Filter out failures and apply threshold if specified
      let filteredPredictions = predictions.filter(p => p !== null);

      if (threshold && typeof threshold === 'string') {
        const thresholdValue = parseInt(threshold, 10);
        filteredPredictions = filteredPredictions.filter(
          p => p!.overallRiskScore >= thresholdValue
        );
      }

      res.json({
        success: true,
        predictions: filteredPredictions,
        totalProjects: projectsToAnalyze.length,
        analyzedProjects: filteredPredictions.length,
      });
    } catch (error: any) {
      console.error('Error getting predictions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get predictions',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/predictions/:projectId - Get risk prediction for specific project
  app.get('/api/analytics/predictions/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const prediction = await predictiveEngine.predictRisk(projectId);

      res.json({
        success: true,
        prediction,
      });
    } catch (error: any) {
      console.error('Error getting prediction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get prediction',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/forecasts/:projectId - Get schedule forecast for project
  app.get('/api/analytics/forecasts/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const forecast = await predictiveEngine.forecastSchedule(projectId);

      res.json({
        success: true,
        forecast,
      });
    } catch (error: any) {
      console.error('Error getting forecast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get forecast',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/anomalies - Detect anomalies across all projects
  app.get('/api/analytics/anomalies', async (req: Request, res: Response) => {
    try {
      const { projectIds } = req.query;

      let projectsToAnalyze: string[];

      if (projectIds && typeof projectIds === 'string') {
        projectsToAnalyze = projectIds.split(',');
      } else {
        const allProjects = await storage.getProjects();
        projectsToAnalyze = allProjects
          .filter(p => p.status === 'active')
          .map(p => p.id);
      }

      const anomalies = await Promise.all(
        projectsToAnalyze.map(async (projectId) => {
          try {
            return await predictiveEngine.detectAnomalies(projectId);
          } catch (error) {
            console.error(`Error detecting anomalies for project ${projectId}:`, error);
            return null;
          }
        })
      );

      const validAnomalies = anomalies
        .filter(a => a !== null && a.anomalies.length > 0);

      res.json({
        success: true,
        anomalies: validAnomalies,
        totalProjects: projectsToAnalyze.length,
        projectsWithAnomalies: validAnomalies.length,
      });
    } catch (error: any) {
      console.error('Error detecting anomalies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect anomalies',
        message: error.message,
      });
    }
  });

  /**
   * CROSS-PROJECT IMPACT ENGINE
   */

  // GET /api/analytics/dependencies - Get all cross-project dependencies
  app.get('/api/analytics/dependencies', async (req: Request, res: Response) => {
    try {
      const { portfolioId, criticality } = req.query;

      // Get all projects and their dependencies
      const allProjects = await storage.getProjects();
      const allDependenciesArrays = await Promise.all(
        allProjects.map(p => storage.getDependencies(p.id))
      );
      const dependencies = allDependenciesArrays.flat();

      let filtered = dependencies;

      // Filter by portfolio if specified
      if (portfolioId && typeof portfolioId === 'string') {
        const portfolioProjects = await storage.getProjectsByPortfolio(portfolioId);
        const projectIds = new Set(portfolioProjects.map(p => p.id));
        filtered = filtered.filter(
          d => projectIds.has(d.sourceProjectId) || projectIds.has(d.targetProjectId)
        );
      }

      // Filter by criticality if specified
      if (criticality && typeof criticality === 'string') {
        filtered = filtered.filter(d => d.criticality === criticality);
      }

      res.json({
        success: true,
        dependencies: filtered,
        total: filtered.length,
      });
    } catch (error: any) {
      console.error('Error getting dependencies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dependencies',
        message: error.message,
      });
    }
  });

  // POST /api/analytics/impact - Analyze cascade impact of a project change
  app.post('/api/analytics/impact', async (req: Request, res: Response) => {
    try {
      const {
        projectId,
        changeType,
        delayDays,
        costImpact,
        description,
      } = req.body;

      if (!projectId || !changeType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: projectId, changeType',
        });
      }

      const analysis = await impactEngine.analyzeCascadeImpact({
        projectId,
        changeType,
        delayDays: delayDays || 0,
        costImpact: costImpact || 0,
        description: description || `${changeType} impact analysis`,
      });

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error('Error analyzing impact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze impact',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/impact/:projectId - Get project impact summary
  app.get('/api/analytics/impact/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const impactSummary = await impactEngine.getProjectImpactSummary(projectId);

      res.json({
        success: true,
        impactSummary,
      });
    } catch (error: any) {
      console.error('Error getting impact summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get impact summary',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/resource-contention - Detect resource contention across projects
  app.get('/api/analytics/resource-contention', async (req: Request, res: Response) => {
    try {
      const { portfolioId } = req.query;

      let projectIds: string[];

      if (portfolioId && typeof portfolioId === 'string') {
        const projects = await storage.getProjectsByPortfolio(portfolioId);
        projectIds = projects.map(p => p.id);
      } else {
        const allProjects = await storage.getProjects();
        projectIds = allProjects.filter(p => p.status === 'active').map(p => p.id);
      }

      const contentions = await impactEngine.detectResourceContention(projectIds);

      res.json({
        success: true,
        contentions,
        total: contentions.length,
      });
    } catch (error: any) {
      console.error('Error detecting resource contention:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect resource contention',
        message: error.message,
      });
    }
  });

  /**
   * FINANCIAL CALCULATION ENGINE
   */

  // GET /api/analytics/financial/metrics - Get comprehensive financial metrics
  app.get('/api/analytics/financial/metrics', async (req: Request, res: Response) => {
    try {
      const { portfolioId, businessUnitId } = req.query;

      let projects;

      if (portfolioId && typeof portfolioId === 'string') {
        projects = await storage.getProjectsByPortfolio(portfolioId);
      } else if (businessUnitId && typeof businessUnitId === 'string') {
        projects = await storage.getProjectsByBusinessUnit(businessUnitId);
      } else {
        projects = await storage.getProjects();
      }

      // Calculate EVM metrics for each project and aggregate
      const evmMetricsArray = await Promise.all(
        projects.slice(0, 20).map(async (project) => {
          try {
            return await financialEngine.calculateEVM(project.id);
          } catch (error) {
            console.error(`Error calculating EVM for project ${project.id}:`, error);
            return null;
          }
        })
      );

      const validMetrics = evmMetricsArray.filter(m => m !== null);

      // Aggregate metrics
      const aggregated = {
        totalBudget: validMetrics.reduce((sum, m) => sum + (m?.bac || 0), 0),
        totalActualCost: validMetrics.reduce((sum, m) => sum + (m?.ac || 0), 0),
        totalPlannedValue: validMetrics.reduce((sum, m) => sum + (m?.pv || 0), 0),
        totalEarnedValue: validMetrics.reduce((sum, m) => sum + (m?.ev || 0), 0),
        averageCPI: validMetrics.length > 0
          ? validMetrics.reduce((sum, m) => sum + (m?.cpi || 0), 0) / validMetrics.length
          : 0,
        averageSPI: validMetrics.length > 0
          ? validMetrics.reduce((sum, m) => sum + (m?.spi || 0), 0) / validMetrics.length
          : 0,
        projectCount: validMetrics.length,
        totalProjects: projects.length,
      };

      res.json({
        success: true,
        metrics: aggregated,
      });
    } catch (error: any) {
      console.error('Error calculating financial metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate financial metrics',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/financial/evm/:projectId - Get Earned Value Management metrics
  app.get('/api/analytics/financial/evm/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const evm = await financialEngine.calculateEVM(projectId);

      res.json({
        success: true,
        evm,
      });
    } catch (error: any) {
      console.error('Error calculating EVM:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate EVM',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/financial/roi/:projectId - Calculate ROI and value metrics
  app.get('/api/analytics/financial/roi/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const roi = await financialEngine.calculateROI(projectId);

      res.json({
        success: true,
        roi,
      });
    } catch (error: any) {
      console.error('Error calculating ROI:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate ROI',
        message: error.message,
      });
    }
  });

  // GET /api/analytics/financial/burn-rate/:projectId - Calculate burn rate and runway
  app.get('/api/analytics/financial/burn-rate/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const burnRate = await financialEngine.calculateBurnRate(projectId);

      res.json({
        success: true,
        burnRate,
      });
    } catch (error: any) {
      console.error('Error calculating burn rate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate burn rate',
        message: error.message,
      });
    }
  });

  // POST /api/analytics/financial/forecast - Forecast financial completion
  app.post('/api/analytics/financial/forecast', async (req: Request, res: Response) => {
    try {
      const { projectId, scenarios } = req.body;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: projectId',
        });
      }

      const forecast = await financialEngine.forecastCompletion(projectId, scenarios);

      res.json({
        success: true,
        forecast,
      });
    } catch (error: any) {
      console.error('Error forecasting completion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to forecast completion',
        message: error.message,
      });
    }
  });

  console.log('✅ Analytics engine routes registered (Predictive, Impact, Financial)');
}
