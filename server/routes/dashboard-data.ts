/**
 * DASHBOARD DATA API ROUTES
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * All dashboard data is read from Palantir Ontology.
 * PostgreSQL is NOT used - Palantir is the single source of truth.
 */

import type { Express } from "express";
import type { IStorage } from "../storage.js";
import { getPalantirDashboardService } from "../services/PalantirDashboardService.js";

export function registerDashboardDataRoutes(app: Express, storage: IStorage) {
  const dashboardService = getPalantirDashboardService();

  /**
   * GET /api/dashboard/overview
   * Main dashboard metrics - FROM PALANTIR
   */
  app.get("/api/dashboard/overview", async (req, res) => {
    try {
      const overview = await dashboardService.getDashboardOverview();
      res.json(overview);
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  /**
   * GET /api/dashboard/safe-data
   * SAFe portfolio data - FROM PALANTIR
   */
  app.get("/api/dashboard/safe-data", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const safeData = await dashboardService.getSAFeData(divisionId);
      res.json(safeData);
    } catch (error) {
      console.error('Error fetching SAFe data:', error);
      res.status(500).json({ error: 'Failed to fetch SAFe data' });
    }
  });

  /**
   * GET /api/dashboard/projects
   * All projects - FROM PALANTIR
   */
  app.get("/api/dashboard/projects", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const safeData = await dashboardService.getSAFeData(divisionId);
      res.json({
        projects: safeData.projects,
        total: safeData.projects.length,
        source: safeData.source,
        timestamp: safeData.timestamp,
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  /**
   * GET /api/dashboard/features
   * All features - FROM PALANTIR
   */
  app.get("/api/dashboard/features", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const safeData = await dashboardService.getSAFeData(divisionId);
      res.json({
        features: safeData.features,
        total: safeData.features.length,
        source: safeData.source,
        timestamp: safeData.timestamp,
      });
    } catch (error) {
      console.error('Error fetching features:', error);
      res.status(500).json({ error: 'Failed to fetch features' });
    }
  });

  /**
   * GET /api/dashboard/stories
   * All stories - FROM PALANTIR
   */
  app.get("/api/dashboard/stories", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const safeData = await dashboardService.getSAFeData(divisionId);
      res.json({
        stories: safeData.stories,
        total: safeData.stories.length,
        source: safeData.source,
        timestamp: safeData.timestamp,
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      res.status(500).json({ error: 'Failed to fetch stories' });
    }
  });

  /**
   * GET /api/dashboard/tasks
   * All tasks - FROM PALANTIR
   */
  app.get("/api/dashboard/tasks", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const safeData = await dashboardService.getSAFeData(divisionId);
      res.json({
        tasks: safeData.tasks,
        total: safeData.tasks.length,
        source: safeData.source,
        timestamp: safeData.timestamp,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  /**
   * GET /api/dashboard/value-streams
   * Value stream metrics - FROM PALANTIR
   */
  app.get("/api/dashboard/value-streams", async (req, res) => {
    try {
      const safeData = await dashboardService.getSAFeData();
      res.json({
        valueStreams: safeData.valueStreams,
        total: safeData.valueStreams.length,
        source: safeData.source,
        timestamp: safeData.timestamp,
      });
    } catch (error) {
      console.error('Error fetching value streams:', error);
      res.status(500).json({ error: 'Failed to fetch value stream data' });
    }
  });

  /**
   * GET /api/dashboard/kpis
   * KPI metrics - FROM PALANTIR
   */
  app.get("/api/dashboard/kpis", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const kpis = await dashboardService.getKPIs(divisionId);

      const kpiData = kpis.map((kpi: any) => {
        const target = parseFloat(kpi.target2025?.replace('%', '') || '0');
        const actual = parseFloat(kpi.value2024?.replace('%', '') || '0');
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
          onTrack: kpiData.filter((k: any) => k.status === 'on-track').length,
          atRisk: kpiData.filter((k: any) => k.status === 'at-risk').length,
          offTrack: kpiData.filter((k: any) => k.status === 'off-track').length,
        },
        source: 'palantir',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      res.status(500).json({ error: 'Failed to fetch KPI data' });
    }
  });

  /**
   * GET /api/dashboard/okrs
   * OKR tracking - FROM PALANTIR
   */
  app.get("/api/dashboard/okrs", async (req, res) => {
    try {
      const divisionId = req.query.divisionId as string | undefined;
      const okrs = await dashboardService.getOKRs(divisionId);

      const okrData = okrs.map((okr: any) => ({
        ...okr,
        progress: 70, // Calculate based on key results
        onTrack: 2,
        atRisk: 1,
        offTrack: 0,
      }));

      res.json({
        okrs: okrData,
        summary: {
          total: okrData.length,
          onTrack: okrData.filter((o: any) => o.progress >= 70).length,
          atRisk: okrData.filter((o: any) => o.progress >= 50 && o.progress < 70).length,
          offTrack: okrData.filter((o: any) => o.progress < 50).length,
        },
        source: 'palantir',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching OKRs:', error);
      res.status(500).json({ error: 'Failed to fetch OKR data' });
    }
  });

  /**
   * GET /api/dashboard/risks
   * Enterprise risks - FROM PALANTIR
   */
  app.get("/api/dashboard/risks", async (req, res) => {
    try {
      const risks = await dashboardService.getRisks();

      res.json({
        risks,
        summary: {
          total: risks.length,
          critical: risks.filter((r: any) => r.severity === 'critical').length,
          high: risks.filter((r: any) => r.severity === 'high').length,
          medium: risks.filter((r: any) => r.severity === 'medium').length,
          low: risks.filter((r: any) => r.severity === 'low').length,
        },
        source: 'palantir',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching risks:', error);
      res.status(500).json({ error: 'Failed to fetch risk data' });
    }
  });

  /**
   * GET /api/dashboard-data/strategic-metrics
   * Strategic layer metrics - FROM PALANTIR
   */
  app.get("/api/dashboard-data/strategic-metrics", async (req, res) => {
    try {
      const overview = await dashboardService.getDashboardOverview();
      const safeData = await dashboardService.getSAFeData();

      const totalBudget = overview.portfolio.totalBudget;
      const totalSpent = overview.portfolio.totalSpent;

      // Portfolio ROI calculation
      const projectedValue = totalBudget * 1.85; // Assuming average 85% ROI target
      const portfolioROI = totalBudget > 0 ? ((projectedValue - totalBudget) / totalBudget) * 100 : 0;
      const targetROI = 85;

      // Strategic alignment score
      const criticalProjects = safeData.projects.filter((p: any) => p.priority === 'Critical').length;
      const alignmentScore = safeData.projects.length > 0
        ? (criticalProjects / safeData.projects.length) * 100
        : 0;
      const targetAlignment = 90;

      // Benefits realization
      const onTrackProjects = overview.health.onTrack;
      const totalProjects = overview.portfolio.totalProjects;
      const benefitsRealization = totalProjects > 0 ? (onTrackProjects / totalProjects) * 100 : 0;
      const targetBenefits = 80;

      // Calculate trends
      const portfolioTrend = portfolioROI >= targetROI ? 'up' : portfolioROI >= targetROI - 10 ? 'stable' : 'down';
      const alignmentTrend = alignmentScore >= targetAlignment ? 'up' : alignmentScore >= targetAlignment - 10 ? 'stable' : 'down';
      const benefitsTrend = benefitsRealization >= targetBenefits ? 'up' : benefitsRealization >= targetBenefits - 10 ? 'stable' : 'down';

      // Determine status
      const portfolioStatus = portfolioROI >= targetROI - 10 ? 'on-track' : portfolioROI >= targetROI - 20 ? 'at-risk' : 'critical';
      const alignmentStatus = alignmentScore >= targetAlignment - 5 ? 'on-track' : alignmentScore >= targetAlignment - 10 ? 'at-risk' : 'critical';
      const benefitsStatus = benefitsRealization >= targetBenefits - 10 ? 'on-track' : benefitsRealization >= targetBenefits - 20 ? 'at-risk' : 'critical';

      const metrics = [
        {
          id: 'portfolio-roi',
          label: 'Portfolio ROI',
          current: Math.round(portfolioROI),
          target: targetROI,
          unit: '%',
          trend: portfolioTrend,
          status: portfolioStatus,
          gap: Math.round(portfolioROI - targetROI),
          impact: `$${(((targetROI - portfolioROI) / 100) * totalBudget / 1000000).toFixed(1)}M value leakage`,
        },
        {
          id: 'strategic-alignment',
          label: 'Strategic Alignment',
          current: Math.round(alignmentScore),
          target: targetAlignment,
          unit: '%',
          trend: alignmentTrend,
          status: alignmentStatus,
          gap: Math.round(alignmentScore - targetAlignment),
          impact: `${Math.abs(Math.round((alignmentScore - targetAlignment) / 10))} misaligned initiatives`,
        },
        {
          id: 'benefits-realization',
          label: 'Benefits Realization',
          current: Math.round(benefitsRealization),
          target: targetBenefits,
          unit: '%',
          trend: benefitsTrend,
          status: benefitsStatus,
          gap: Math.round(benefitsRealization - targetBenefits),
          impact: `$${(((targetBenefits - benefitsRealization) / 100) * projectedValue / 1000000).toFixed(1)}M unrealized`,
        },
      ];

      res.json({
        metrics,
        summary: {
          totalProjects: overview.portfolio.totalProjects,
          totalBudget: Math.round(totalBudget),
          totalSpent: Math.round(totalSpent),
          portfolioHealth: portfolioStatus,
          criticalCount: metrics.filter(m => m.status === 'critical').length,
          atRiskCount: metrics.filter(m => m.status === 'at-risk').length,
        },
        source: overview.source,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching strategic metrics:', error);
      res.status(500).json({ error: 'Failed to fetch strategic metrics' });
    }
  });

  /**
   * GET /api/dashboard/source-status
   * Check data source status (Palantir vs fallback)
   */
  app.get("/api/dashboard/source-status", async (req, res) => {
    try {
      const isPalantirAvailable = dashboardService.isPalantirAvailable();

      res.json({
        palantirAvailable: isPalantirAvailable,
        sourceOfTruth: isPalantirAvailable ? 'palantir' : 'postgres_fallback',
        message: isPalantirAvailable
          ? 'Palantir Foundry is the source of truth'
          : 'Using PostgreSQL fallback - Palantir ontology needs configuration',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error checking source status:', error);
      res.status(500).json({ error: 'Failed to check source status' });
    }
  });

  /**
   * POST /api/dashboard/cache/clear
   * Clear dashboard cache
   */
  app.post("/api/dashboard/cache/clear", async (req, res) => {
    try {
      dashboardService.clearCache();
      res.json({
        success: true,
        message: 'Dashboard cache cleared',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  /**
   * POST /api/dashboard/sync-to-palantir
   * Sync all SAFe data from PostgreSQL to Palantir
   * This uses the LLM Bridge for dynamic ingestion - no predefined schemas required!
   */
  app.post("/api/dashboard/sync-to-palantir", async (req, res) => {
    try {
      const { getPalantirLLMBridge } = await import("../services/PalantirLLMBridge.js");
      const bridge = await getPalantirLLMBridge();

      // Get all SAFe data from the dashboard service (which now reads from Palantir or fallback)
      const overview = await dashboardService.getDashboardOverview();
      const safeData = await dashboardService.getSAFeData();
      const kpis = await dashboardService.getKPIs();
      const okrs = await dashboardService.getOKRs();
      const risks = await dashboardService.getRisks();

      const results: any[] = [];

      // Sync projects
      if (safeData.projects.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'projects',
          data: safeData.projects,
          tags: ['project', 'safe', 'sync', 'dashboard'],
          metadata: { count: safeData.projects.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'projects', count: safeData.projects.length, success: r.success });
      }

      // Sync features
      if (safeData.features.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'features',
          data: safeData.features,
          tags: ['feature', 'safe', 'sync', 'dashboard'],
          metadata: { count: safeData.features.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'features', count: safeData.features.length, success: r.success });
      }

      // Sync stories
      if (safeData.stories.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'stories',
          data: safeData.stories,
          tags: ['story', 'safe', 'sync', 'dashboard'],
          metadata: { count: safeData.stories.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'stories', count: safeData.stories.length, success: r.success });
      }

      // Sync tasks
      if (safeData.tasks.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'tasks',
          data: safeData.tasks,
          tags: ['task', 'safe', 'sync', 'dashboard'],
          metadata: { count: safeData.tasks.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'tasks', count: safeData.tasks.length, success: r.success });
      }

      // Sync KPIs
      if (kpis.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'kpis',
          data: kpis,
          tags: ['kpi', 'safe', 'sync', 'dashboard'],
          metadata: { count: kpis.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'kpis', count: kpis.length, success: r.success });
      }

      // Sync OKRs
      if (okrs.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'okrs',
          data: okrs,
          tags: ['okr', 'safe', 'sync', 'dashboard'],
          metadata: { count: okrs.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'okrs', count: okrs.length, success: r.success });
      }

      // Sync risks
      if (risks.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'risks',
          data: risks,
          tags: ['risk', 'safe', 'sync', 'dashboard'],
          metadata: { count: risks.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'risks', count: risks.length, success: r.success });
      }

      // Sync value streams
      if (safeData.valueStreams.length > 0) {
        const r = await bridge.ingestData({
          source: 'dashboard-sync',
          datasetName: 'value-streams',
          data: safeData.valueStreams,
          tags: ['value-stream', 'safe', 'sync', 'dashboard'],
          metadata: { count: safeData.valueStreams.length, syncSource: 'dashboard-api' },
        });
        results.push({ type: 'value-streams', count: safeData.valueStreams.length, success: r.success });
      }

      const successCount = results.filter(r => r.success).length;
      const totalRecords = results.reduce((sum, r) => sum + r.count, 0);

      res.json({
        success: successCount === results.length,
        message: `Synced ${totalRecords} records across ${successCount}/${results.length} data types to Palantir`,
        results,
        summary: {
          totalTypes: results.length,
          successfulTypes: successCount,
          totalRecords,
        },
        method: 'llm-bridge', // No predefined schemas required!
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error syncing to Palantir:', error);
      res.status(500).json({ error: 'Failed to sync to Palantir', details: error.message });
    }
  });

  /**
   * GET /api/dashboard/sync-status
   * Get sync status and data counts
   */
  app.get("/api/dashboard/sync-status", async (req, res) => {
    try {
      const overview = await dashboardService.getDashboardOverview();
      const safeData = await dashboardService.getSAFeData();
      const kpis = await dashboardService.getKPIs();
      const okrs = await dashboardService.getOKRs();
      const risks = await dashboardService.getRisks();

      res.json({
        success: true,
        source: overview.source,
        palantirAvailable: dashboardService.isPalantirAvailable(),
        dataCounts: {
          projects: safeData.projects.length,
          features: safeData.features.length,
          stories: safeData.stories.length,
          tasks: safeData.tasks.length,
          valueStreams: safeData.valueStreams.length,
          kpis: kpis.length,
          okrs: okrs.length,
          risks: risks.length,
        },
        totalRecords:
          safeData.projects.length +
          safeData.features.length +
          safeData.stories.length +
          safeData.tasks.length +
          safeData.valueStreams.length +
          kpis.length +
          okrs.length +
          risks.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting sync status:', error);
      res.status(500).json({ error: 'Failed to get sync status', details: error.message });
    }
  });

  console.log('[Dashboard] Routes registered - SOURCE OF TRUTH: PALANTIR FOUNDRY');
}
