/**
 * AGENT INSIGHTS API
 * Exposes calculated insights from AI agent engines to UI dashboards
 * This bridges the gap between agent calculations and UI visualization
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { FinancialCalculationEngine } from '../engines/FinancialCalculationEngine.js';
import { PredictiveAnalyticsEngine } from '../engines/PredictiveAnalyticsEngine.js';
import { CrossProjectImpactEngine } from '../engines/CrossProjectImpactEngine.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export function registerAgentInsightsRoutes(app: Express, storage: IStorage) {
  const financialEngine = new FinancialCalculationEngine(storage);
  const predictiveEngine = new PredictiveAnalyticsEngine(storage);
  const impactEngine = new CrossProjectImpactEngine(storage);

  /**
   * FINANCIAL INSIGHTS (FinOps Agent)
   * Real-time EVM calculations with forecasting
   */
  app.get('/api/agent-insights/financial', async (req: Request, res: Response) => {
    try {
      const { projectIds, divisionId, portfolioId } = req.query;

      let projectsToAnalyze: string[];

      if (projectIds && typeof projectIds === 'string') {
        projectsToAnalyze = projectIds.split(',');
      } else if (divisionId && typeof divisionId === 'string') {
        const divisionProjects = await storage.getProjectsByDivision(divisionId);
        projectsToAnalyze = divisionProjects.map(p => p.id);
      } else if (portfolioId && typeof portfolioId === 'string') {
        const portfolioProjects = await storage.getProjectsByPortfolio(portfolioId);
        projectsToAnalyze = portfolioProjects.map(p => p.id);
      } else {
        const allProjects = await storage.getProjects();
        projectsToAnalyze = allProjects
          .filter(p => p.status === 'active')
          .slice(0, 50) // Limit to 50 for performance
          .map(p => p.id);
      }

      // Calculate EVM for each project
      const evmCalculations = await Promise.all(
        projectsToAnalyze.map(async (projectId) => {
          try {
            const evm = await financialEngine.calculateEVM(projectId);
            const forecast = await financialEngine.forecastBudget(projectId);

            return {
              projectId,
              evm,
              forecast,
              calculatedAt: new Date().toISOString(),
            };
          } catch (error) {
            console.error(`Error calculating EVM for project ${projectId}:`, error);
            return null;
          }
        })
      );

      const validCalculations = evmCalculations.filter(c => c !== null);

      // Aggregate portfolio-level metrics
      const aggregated = {
        totalProjects: validCalculations.length,
        totalBAC: validCalculations.reduce((sum, c) => sum + (c?.evm?.bac || 0), 0),
        totalAC: validCalculations.reduce((sum, c) => sum + (c?.evm?.ac || 0), 0),
        totalEV: validCalculations.reduce((sum, c) => sum + (c?.evm?.ev || 0), 0),
        totalPV: validCalculations.reduce((sum, c) => sum + (c?.evm?.pv || 0), 0),
        avgCPI: validCalculations.length > 0
          ? validCalculations.reduce((sum, c) => sum + (c?.evm?.cpi || 0), 0) / validCalculations.length
          : 0,
        avgSPI: validCalculations.length > 0
          ? validCalculations.reduce((sum, c) => sum + (c?.evm?.spi || 0), 0) / validCalculations.length
          : 0,
        totalEAC: validCalculations.reduce((sum, c) => sum + (c?.evm?.eac || 0), 0),
        portfolioHealth: validCalculations.filter(c => (c?.evm?.cpi || 0) >= 0.95).length / validCalculations.length,
      };

      res.json({
        success: true,
        calculations: validCalculations,
        aggregated,
        source: 'FinOps Agent - FinancialCalculationEngine',
      });
    } catch (error: any) {
      console.error('Error getting financial insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get financial insights',
        message: error.message,
      });
    }
  });

  /**
   * VALUE INSIGHTS (VRO Agent)
   * Benefits realization tracking and value leakage analysis
   */
  app.get('/api/agent-insights/value', async (req: Request, res: Response) => {
    try {
      const { projectIds, portfolioId } = req.query;

      let projectsToAnalyze: string[];

      if (projectIds && typeof projectIds === 'string') {
        projectsToAnalyze = projectIds.split(',');
      } else if (portfolioId && typeof portfolioId === 'string') {
        const portfolioProjects = await storage.getProjectsByPortfolio(portfolioId);
        projectsToAnalyze = portfolioProjects.map(p => p.id);
      } else {
        const allProjects = await storage.getProjects();
        projectsToAnalyze = allProjects
          .filter(p => {
            if (p.status !== 'active') return false;
            const name = p.name || '';
            if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') || name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') || name.startsWith('[Monday]') || name.startsWith('[Jira') || name.startsWith('[OpenProject]')) return false;
            const id = p.id || '';
            if (id.startsWith('feature-') || id.startsWith('story-') || id.startsWith('task-') || id.startsWith('agent-') || id.startsWith('source-') || id.startsWith('div-') || id.startsWith('monday-') || id.startsWith('story-test-') || id.startsWith('test-div-')) return false;
            return true;
          })
          .slice(0, 50)
          .map(p => p.id);
      }

      // Get benefits realization for each project
      const benefitsAnalysis = await Promise.all(
        projectsToAnalyze.map(async (projectId) => {
          try {
            // Query benefits_realization table
            const benefits = await db.execute(sql`
              SELECT * FROM benefits_realization
              WHERE project_id = ${projectId}
              ORDER BY realization_date DESC
            `);

            const project = await storage.getProject(projectId);

            const plannedValue = benefits.rows.reduce((sum: number, b: any) =>
              sum + (parseFloat(b.planned_value) || 0), 0);
            const actualValue = benefits.rows.reduce((sum: number, b: any) =>
              sum + (parseFloat(b.actual_value) || 0), 0);
            const valueLeakage = plannedValue - actualValue;
            const realizationRate = plannedValue > 0 ? (actualValue / plannedValue) * 100 : 0;

            return {
              projectId,
              projectName: project?.name,
              plannedValue,
              actualValue,
              valueLeakage,
              realizationRate,
              benefits: benefits.rows,
              status: realizationRate >= 90 ? 'on_track' :
                      realizationRate >= 70 ? 'at_risk' : 'high_risk',
            };
          } catch (error) {
            console.error(`Error analyzing value for project ${projectId}:`, error);
            return null;
          }
        })
      );

      const validAnalysis = benefitsAnalysis.filter(a => a !== null);

      // Portfolio-level value metrics
      const aggregated = {
        totalProjects: validAnalysis.length,
        totalPlannedValue: validAnalysis.reduce((sum, a) => sum + (a?.plannedValue || 0), 0),
        totalActualValue: validAnalysis.reduce((sum, a) => sum + (a?.actualValue || 0), 0),
        totalValueLeakage: validAnalysis.reduce((sum, a) => sum + (a?.valueLeakage || 0), 0),
        avgRealizationRate: validAnalysis.length > 0
          ? validAnalysis.reduce((sum, a) => sum + (a?.realizationRate || 0), 0) / validAnalysis.length
          : 0,
        projectsOnTrack: validAnalysis.filter(a => a?.status === 'on_track').length,
        projectsAtRisk: validAnalysis.filter(a => a?.status === 'at_risk').length,
        projectsHighRisk: validAnalysis.filter(a => a?.status === 'high_risk').length,
      };

      res.json({
        success: true,
        analysis: validAnalysis,
        aggregated,
        source: 'VRO Agent - Benefits Realization Tracking',
      });
    } catch (error: any) {
      console.error('Error getting value insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get value insights',
        message: error.message,
      });
    }
  });

  /**
   * RISK INSIGHTS (Risk Agent)
   * Quantitative risk scoring and portfolio risk analysis
   */
  app.get('/api/agent-insights/risks', async (req: Request, res: Response) => {
    try {
      const { portfolioId, threshold } = req.query;

      let projects;

      if (portfolioId && typeof portfolioId === 'string') {
        projects = await storage.getProjectsByPortfolio(portfolioId);
      } else {
        projects = await storage.getProjects();
      }

      const projectIds = projects.map(p => p.id);

      // Get quantitative risk scores for all projects
      const riskAnalysis = await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const risks = await storage.getRisks(projectId);
            const project = await storage.getProject(projectId);

            // Calculate risk scores (probability × impact)
            const quantitativeRisks = risks.map(risk => {
              // Convert qualitative to quantitative if needed
              let probNumeric = risk.probabilityNumeric || 0;
              let impactNumeric = risk.impactNumeric || 0;

              if (!probNumeric) {
                probNumeric = risk.probability === 'high' ? 0.7 :
                             risk.probability === 'medium' ? 0.4 : 0.1;
              }

              if (!impactNumeric) {
                const projectBudget = parseFloat(project?.budget || '1000000');
                impactNumeric = risk.impact === 'high' ? projectBudget * 0.3 :
                               risk.impact === 'medium' ? projectBudget * 0.15 :
                               projectBudget * 0.05;
              }

              const riskScore = probNumeric * impactNumeric;

              return {
                ...risk,
                probabilityNumeric: probNumeric,
                impactNumeric,
                riskScore,
              };
            });

            // Sort by risk score descending
            quantitativeRisks.sort((a, b) => b.riskScore - a.riskScore);

            const totalRiskExposure = quantitativeRisks.reduce((sum, r) => sum + r.riskScore, 0);
            const avgRiskScore = quantitativeRisks.length > 0
              ? totalRiskExposure / quantitativeRisks.length
              : 0;

            return {
              projectId,
              projectName: project?.name,
              totalRisks: quantitativeRisks.length,
              totalRiskExposure,
              avgRiskScore,
              topRisks: quantitativeRisks.slice(0, 5),
              riskLevel: totalRiskExposure > 100000 ? 'high' :
                        totalRiskExposure > 50000 ? 'medium' : 'low',
            };
          } catch (error) {
            console.error(`Error analyzing risks for project ${projectId}:`, error);
            return null;
          }
        })
      );

      let validAnalysis = riskAnalysis.filter(a => a !== null);

      // Apply threshold filter if specified
      if (threshold && typeof threshold === 'string') {
        const thresholdValue = parseFloat(threshold);
        validAnalysis = validAnalysis.filter(a => (a?.totalRiskExposure || 0) >= thresholdValue);
      }

      // Portfolio-level risk metrics
      const aggregated = {
        totalProjects: validAnalysis.length,
        totalRiskExposure: validAnalysis.reduce((sum, a) => sum + (a?.totalRiskExposure || 0), 0),
        totalRisks: validAnalysis.reduce((sum, a) => sum + (a?.totalRisks || 0), 0),
        avgRiskExposure: validAnalysis.length > 0
          ? validAnalysis.reduce((sum, a) => sum + (a?.totalRiskExposure || 0), 0) / validAnalysis.length
          : 0,
        highRiskProjects: validAnalysis.filter(a => a?.riskLevel === 'high').length,
        mediumRiskProjects: validAnalysis.filter(a => a?.riskLevel === 'medium').length,
        lowRiskProjects: validAnalysis.filter(a => a?.riskLevel === 'low').length,
      };

      res.json({
        success: true,
        analysis: validAnalysis,
        aggregated,
        source: 'Risk Agent - Quantitative Risk Analysis',
      });
    } catch (error: any) {
      console.error('Error getting risk insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk insights',
        message: error.message,
      });
    }
  });

  /**
   * PREDICTIVE INSIGHTS (Predictive Analytics Engine)
   * Forecasts and anomaly detection
   */
  app.get('/api/agent-insights/predictions', async (req: Request, res: Response) => {
    try {
      const { projectIds, portfolioId, includeAnomalies } = req.query;

      let projectsToAnalyze: string[];

      if (projectIds && typeof projectIds === 'string') {
        projectsToAnalyze = projectIds.split(',');
      } else if (portfolioId && typeof portfolioId === 'string') {
        const portfolioProjects = await storage.getProjectsByPortfolio(portfolioId);
        projectsToAnalyze = portfolioProjects.map(p => p.id);
      } else {
        const allProjects = await storage.getProjects();
        projectsToAnalyze = allProjects
          .filter(p => p.status === 'active')
          .slice(0, 30)
          .map(p => p.id);
      }

      // Get predictions for each project
      const predictions = await Promise.all(
        projectsToAnalyze.map(async (projectId) => {
          try {
            const riskPrediction = await predictiveEngine.predictRisk(projectId);
            const scheduleForecast = await predictiveEngine.forecastSchedule(projectId);

            let anomalies = null;
            if (includeAnomalies === 'true') {
              anomalies = await predictiveEngine.detectAnomalies(projectId);
            }

            return {
              projectId,
              riskPrediction,
              scheduleForecast,
              anomalies,
              predictedAt: new Date().toISOString(),
            };
          } catch (error) {
            console.error(`Error generating predictions for project ${projectId}:`, error);
            return null;
          }
        })
      );

      const validPredictions = predictions.filter(p => p !== null);

      // Aggregate portfolio-level predictions
      const aggregated = {
        totalProjects: validPredictions.length,
        highRiskProjects: validPredictions.filter(p =>
          (p?.riskPrediction?.overallRiskScore || 0) >= 70
        ).length,
        mediumRiskProjects: validPredictions.filter(p => {
          const score = p?.riskPrediction?.overallRiskScore || 0;
          return score >= 40 && score < 70;
        }).length,
        lowRiskProjects: validPredictions.filter(p =>
          (p?.riskPrediction?.overallRiskScore || 0) < 40
        ).length,
        avgRiskScore: validPredictions.length > 0
          ? validPredictions.reduce((sum, p) => sum + (p?.riskPrediction?.overallRiskScore || 0), 0) / validPredictions.length
          : 0,
        projectsWithAnomalies: includeAnomalies === 'true'
          ? validPredictions.filter(p => (p?.anomalies?.anomalies?.length || 0) > 0).length
          : null,
      };

      res.json({
        success: true,
        predictions: validPredictions,
        aggregated,
        source: 'Predictive Analytics Engine',
      });
    } catch (error: any) {
      console.error('Error getting predictive insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get predictive insights',
        message: error.message,
      });
    }
  });

  console.log('✅ Agent Insights routes registered (4 endpoints)');
}
