/**
 * DASHBOARD DATA API ROUTES
 * Replaces ALL static/hardcoded data with database-backed endpoints
 * NO MORE client/src/lib/data.ts, safe6Data.ts, lgData.ts, scenarios.ts, buPrograms.ts
 */

import type { Express } from "express";
import type { IStorage } from "../storage.js";
import { db } from "../db.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  projects, portfolios, programs, businessUnits, valueStreams,
  features, stories, tasks, sprints, risks, issues,
  okrs, keyResults, kpis, milestones, dependencies,
  projectFinancials, resources, resourceAllocations
} from "../../shared/schema.js";

export function registerDashboardDataRoutes(app: Express, storage: IStorage) {

  /**
   * GET /api/dashboard/overview
   * Main dashboard metrics - replaces hardcoded VRO metrics
   */
  app.get("/api/dashboard/overview", async (req, res) => {
    try {
      // Get all active projects with calculations
      const allProjects = await storage.getAllProjects();
      const activeProjects = allProjects.filter(p => p.status === 'active');

      // Calculate portfolio-wide metrics
      const totalBudget = activeProjects.reduce((sum, p) =>
        sum + parseFloat(p.budget || '0'), 0);
      const totalSpent = activeProjects.reduce((sum, p) =>
        sum + parseFloat(p.actualCost || '0'), 0);
      const avgProgress = activeProjects.reduce((sum, p) =>
        sum + (p.progress || 0), 0) / activeProjects.length;

      // Calculate CPI and SPI averages
      const avgCPI = activeProjects.reduce((sum, p) =>
        sum + parseFloat(String(p.cpiValue || '1.0')), 0) / activeProjects.length;
      const avgSPI = activeProjects.reduce((sum, p) =>
        sum + parseFloat(String(p.spiValue || '1.0')), 0) / activeProjects.length;

      // Count projects by status
      const onTrack = activeProjects.filter(p => {
        const cpi = parseFloat(String(p.cpiValue || '1.0'));
        const spi = parseFloat(String(p.spiValue || '1.0'));
        return cpi >= 0.95 && spi >= 0.95;
      }).length;

      const atRisk = activeProjects.filter(p => {
        const cpi = parseFloat(String(p.cpiValue || '1.0'));
        const spi = parseFloat(String(p.spiValue || '1.0'));
        return (cpi < 0.95 && cpi >= 0.85) || (spi < 0.95 && spi >= 0.85);
      }).length;

      const critical = activeProjects.filter(p => {
        const cpi = parseFloat(String(p.cpiValue || '1.0'));
        const spi = parseFloat(String(p.spiValue || '1.0'));
        return cpi < 0.85 || spi < 0.85;
      }).length;

      // Get active risks and issues
      const allRisks = await storage.getAllRisks();
      const activeRisks = allRisks.filter(r => r.status === 'active');
      const highRisks = activeRisks.filter(r => r.probability === 'high' && r.impact === 'high');

      const allIssues = await storage.getAllIssues();
      const openIssues = allIssues.filter(i => i.status === 'open' || i.status === 'in-progress');
      const criticalIssues = openIssues.filter(i => i.priority === 'critical' || i.priority === 'high');

      res.json({
        portfolio: {
          totalProjects: activeProjects.length,
          totalBudget,
          totalSpent,
          budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          avgProgress: Math.round(avgProgress),
          avgCPI: Number(avgCPI.toFixed(3)),
          avgSPI: Number(avgSPI.toFixed(3)),
        },
        health: {
          onTrack,
          atRisk,
          critical,
          healthScore: Math.round((onTrack / activeProjects.length) * 100),
        },
        risks: {
          total: activeRisks.length,
          high: highRisks.length,
          active: activeRisks.length,
        },
        issues: {
          total: openIssues.length,
          critical: criticalIssues.length,
          open: openIssues.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  /**
   * GET /api/dashboard/business-units
   * Business unit performance - replaces hardcoded buPrograms.ts
   */
  app.get("/api/dashboard/business-units", async (req, res) => {
    try {
      const bus = await db.select().from(businessUnits);

      const buData = await Promise.all(bus.map(async (bu) => {
        // Get all projects for this BU
        const buProjects = await db.select()
          .from(projects)
          .where(eq(projects.businessUnitId, bu.id));

        // Calculate BU metrics
        const totalBudget = buProjects.reduce((sum, p) =>
          sum + parseFloat(p.budget || '0'), 0);
        const totalSpent = buProjects.reduce((sum, p) =>
          sum + parseFloat(p.actualCost || '0'), 0);
        const avgProgress = buProjects.length > 0
          ? buProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / buProjects.length
          : 0;

        return {
          id: bu.id,
          name: bu.name,
          code: bu.code,
          description: bu.description,
          leader: bu.leader,
          metrics: {
            projectCount: buProjects.length,
            totalBudget,
            totalSpent,
            avgProgress: Math.round(avgProgress),
            utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          },
          projects: buProjects.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            progress: p.progress,
            budget: p.budget,
            actualCost: p.actualCost,
          })),
        };
      }));

      res.json({
        businessUnits: buData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching business units:', error);
      res.status(500).json({ error: 'Failed to fetch business unit data' });
    }
  });

  /**
   * GET /api/dashboard/portfolios
   * Portfolio rollup - replaces hardcoded portfolio data
   */
  app.get("/api/dashboard/portfolios", async (req, res) => {
    try {
      const allPortfolios = await storage.getAllPortfolios();

      const portfolioData = await Promise.all(allPortfolios.map(async (portfolio) => {
        // Get all projects in this portfolio
        const portfolioProjects = await db.select()
          .from(projects)
          .where(eq(projects.portfolioId, portfolio.id));

        // Get all programs in this portfolio
        const portfolioPrograms = await db.select()
          .from(programs)
          .where(eq(programs.portfolioId, portfolio.id));

        // Calculate metrics
        const projectBudget = portfolioProjects.reduce((sum, p) =>
          sum + parseFloat(p.budget || '0'), 0);
        const projectSpent = portfolioProjects.reduce((sum, p) =>
          sum + parseFloat(p.actualCost || '0'), 0);

        return {
          id: portfolio.id,
          name: portfolio.name,
          description: portfolio.description,
          owner: portfolio.owner,
          status: portfolio.status,
          budgetTotal: portfolio.budgetTotal,
          budgetAllocated: portfolio.budgetAllocated,
          budgetSpent: portfolio.budgetSpent,
          calculatedMetrics: {
            projectCount: portfolioProjects.length,
            programCount: portfolioPrograms.length,
            projectBudget,
            projectSpent,
            utilization: projectBudget > 0 ? (projectSpent / projectBudget) * 100 : 0,
          },
          projects: portfolioProjects.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            progress: p.progress,
          })),
          programs: portfolioPrograms.map(pg => ({
            id: pg.id,
            name: pg.name,
            status: pg.status,
          })),
        };
      }));

      res.json({
        portfolios: portfolioData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio data' });
    }
  });

  /**
   * GET /api/dashboard/safe-data
   * SAFe portfolio data - replaces hardcoded safe6Data.ts
   */
  app.get("/api/dashboard/safe-data", async (req, res) => {
    try {
      // Get all features with their stories and tasks
      const allFeatures = await db.select().from(features);
      const allStories = await db.select().from(stories);
      const allTasks = await db.select().from(tasks);

      // Group stories by feature
      const featuresWithStories = allFeatures.map(feature => ({
        ...feature,
        stories: allStories.filter(s => s.featureId === feature.id).map(story => ({
          ...story,
          tasks: allTasks.filter(t => t.storyId === story.id),
        })),
      }));

      // Calculate SAFe metrics
      const totalStoryPoints = allFeatures.reduce((sum, f) =>
        sum + (f.storyPoints || 0), 0);
      const completedPoints = allFeatures.reduce((sum, f) =>
        sum + (f.completedPoints || 0), 0);
      const velocity = completedPoints > 0 ? Math.round(completedPoints / 4) : 0; // Assuming 4 sprints

      res.json({
        features: featuresWithStories,
        metrics: {
          totalFeatures: allFeatures.length,
          totalStories: allStories.length,
          totalTasks: allTasks.length,
          totalStoryPoints,
          completedPoints,
          velocity,
          completionRate: totalStoryPoints > 0 ? (completedPoints / totalStoryPoints) * 100 : 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching SAFe data:', error);
      res.status(500).json({ error: 'Failed to fetch SAFe data' });
    }
  });

  /**
   * GET /api/dashboard/okrs
   * OKR tracking - replaces hardcoded OKR data
   */
  app.get("/api/dashboard/okrs", async (req, res) => {
    try {
      const allOkrs = await storage.getAllOkrs();

      const okrData = await Promise.all(allOkrs.map(async (okr) => {
        const okrKeyResults = await storage.getKeyResultsByOkr(okr.id);

        // Calculate OKR progress
        const avgProgress = okrKeyResults.length > 0
          ? okrKeyResults.reduce((sum, kr) => {
              const range = kr.targetValue - kr.startValue;
              const current = kr.currentValue - kr.startValue;
              return sum + (range > 0 ? (current / range) * 100 : 0);
            }, 0) / okrKeyResults.length
          : 0;

        return {
          ...okr,
          keyResults: okrKeyResults,
          progress: Math.round(avgProgress),
          onTrack: okrKeyResults.filter(kr => kr.status === 'on-track').length,
          atRisk: okrKeyResults.filter(kr => kr.status === 'at-risk').length,
          offTrack: okrKeyResults.filter(kr => kr.status === 'off-track').length,
        };
      }));

      res.json({
        okrs: okrData,
        summary: {
          total: okrData.length,
          onTrack: okrData.filter(o => o.progress >= 70).length,
          atRisk: okrData.filter(o => o.progress >= 50 && o.progress < 70).length,
          offTrack: okrData.filter(o => o.progress < 50).length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching OKRs:', error);
      res.status(500).json({ error: 'Failed to fetch OKR data' });
    }
  });

  /**
   * GET /api/dashboard/kpis
   * KPI metrics - replaces hardcoded KPI data
   */
  app.get("/api/dashboard/kpis", async (req, res) => {
    try {
      const allKpis = await storage.getAllKpis();

      const kpiData = allKpis.map(kpi => {
        const target = parseFloat(kpi.target || '0');
        const actual = parseFloat(kpi.actual || '0');
        const variance = target > 0 ? ((actual - target) / target) * 100 : 0;

        return {
          ...kpi,
          variance,
          status: actual >= target ? 'on-track' : actual >= target * 0.9 ? 'at-risk' : 'off-track',
        };
      });

      res.json({
        kpis: kpiData,
        summary: {
          total: kpiData.length,
          onTrack: kpiData.filter(k => k.status === 'on-track').length,
          atRisk: kpiData.filter(k => k.status === 'at-risk').length,
          offTrack: kpiData.filter(k => k.status === 'off-track').length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      res.status(500).json({ error: 'Failed to fetch KPI data' });
    }
  });

  /**
   * GET /api/dashboard/value-streams
   * Value stream metrics - replaces hardcoded value stream data
   */
  app.get("/api/dashboard/value-streams", async (req, res) => {
    try {
      const allValueStreams = await db.select().from(valueStreams);

      const vsData = await Promise.all(allValueStreams.map(async (vs) => {
        // Get portfolio info
        const portfolio = vs.portfolioId
          ? await storage.getPortfolio(vs.portfolioId)
          : null;

        return {
          ...vs,
          portfolio: portfolio ? {
            id: portfolio.id,
            name: portfolio.name,
          } : null,
          metrics: {
            leadTime: vs.leadTime,
            cycleTime: vs.cycleTime,
            throughput: vs.throughput,
            efficiency: vs.cycleTime && vs.leadTime
              ? Math.round((parseFloat(vs.cycleTime) / parseFloat(vs.leadTime)) * 100)
              : 0,
          },
        };
      }));

      res.json({
        valueStreams: vsData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching value streams:', error);
      res.status(500).json({ error: 'Failed to fetch value stream data' });
    }
  });

  /**
   * GET /api/dashboard/resources
   * Resource utilization - replaces hardcoded resource data
   */
  app.get("/api/dashboard/resources", async (req, res) => {
    try {
      const allResources = await db.select().from(resources);
      const allAllocations = await db.select().from(resourceAllocations);

      const resourceData = allResources.map(resource => {
        const resourceAllocs = allAllocations.filter(a => a.resourceId === resource.id);
        const totalAllocation = resourceAllocs.reduce((sum, a) =>
          sum + parseFloat(a.allocationPercentage || '0'), 0);

        return {
          ...resource,
          allocations: resourceAllocs,
          utilization: Math.min(totalAllocation, 100),
          available: Math.max(100 - totalAllocation, 0),
          overallocated: totalAllocation > 100,
        };
      });

      res.json({
        resources: resourceData,
        summary: {
          total: resourceData.length,
          fullyUtilized: resourceData.filter(r => r.utilization >= 90).length,
          underutilized: resourceData.filter(r => r.utilization < 70).length,
          overallocated: resourceData.filter(r => r.overallocated).length,
          avgUtilization: resourceData.reduce((sum, r) => sum + r.utilization, 0) / resourceData.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resource data' });
    }
  });

  console.log('✅ Dashboard data routes registered (replacing ALL static data)');
}
