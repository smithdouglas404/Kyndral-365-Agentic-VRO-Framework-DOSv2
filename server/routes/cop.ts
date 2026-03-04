/**
 * COMMON OPERATING PICTURE (COP) ROUTES
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * Provides three-layer view of portfolio health:
 * - Strategic Layer (VRO) - 6-12 months horizon
 * - Operational Layer (TMO) - 3-6 months horizon
 * - Tactical Layer (PMO) - Current week
 * - Action Queue - Immediate attention items
 *
 * All endpoints use PalantirDashboardService with PostgreSQL fallback.
 */

import { Router } from "express";
import type { IStorage } from "../storage";
import { getPalantirDashboardService } from "../services/PalantirDashboardService.js";

export function createCOPRoutes(storage: IStorage): Router {
  const router = Router();

  // Get Strategic Layer data (VRO - 6-12 months)
  router.get("/strategic", async (_req, res) => {
    try {
      const dashboardService = getPalantirDashboardService();

      // Get data from Palantir (with PostgreSQL fallback)
      const overview = await dashboardService.getDashboardOverview();
      const safeData = await dashboardService.getSAFeData();
      const risks = await dashboardService.getRisks();

      // Calculate strategic metrics from the data
      const activeProjects = safeData.projects.filter((p: any) =>
        p.status?.toLowerCase().includes('progress') || p.status === 'active'
      );

      const totalPlannedValue = activeProjects.reduce((sum: number, p: any) =>
        sum + (p.plannedValue || 0), 0);
      const totalEarnedValue = activeProjects.reduce((sum: number, p: any) =>
        sum + (p.earnedValue || 0), 0);
      const avgRoi = activeProjects.length > 0
        ? activeProjects.reduce((sum: number, p: any) => sum + parseFloat(p.expectedRoi || '0'), 0) / activeProjects.length
        : 0;

      // Get strategic initiatives (high priority projects)
      const initiatives = activeProjects
        .filter((p: any) => p.priority === 'Critical' || p.priority === 'High')
        .slice(0, 10)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          expected_roi: p.expectedRoi,
          planned_value: p.plannedValue,
          strategic_alignment: p.safeStage,
          start_date: p.startDate,
          end_date: p.endDate,
        }));

      // Calculate value leakage
      const projectsWithLeakage = activeProjects.filter((p: any) =>
        (p.earnedValue || 0) < (p.plannedValue || 0)
      );
      const totalValueLeakage = projectsWithLeakage.reduce((sum: number, p: any) =>
        sum + ((p.plannedValue || 0) - (p.earnedValue || 0)), 0);

      res.json({
        success: true,
        layer: "strategic",
        horizon: "6-12 months",
        source: overview.source,
        metrics: {
          total_projects: overview.portfolio.totalProjects,
          avg_roi: avgRoi,
          total_planned_value: totalPlannedValue,
          total_actual_value: totalEarnedValue,
          active_projects: activeProjects.length,
          completed_projects: safeData.projects.filter((p: any) =>
            p.status?.toLowerCase() === 'complete' || p.status?.toLowerCase() === 'completed'
          ).length,
        },
        initiatives,
        valueLeakage: {
          projects_with_leakage: projectsWithLeakage.length,
          total_value_leakage: totalValueLeakage,
        },
        timestamp: overview.timestamp,
      });
    } catch (error: any) {
      console.error("Error fetching strategic layer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Operational Layer data (TMO - 3-6 months)
  router.get("/operational", async (_req, res) => {
    try {
      const dashboardService = getPalantirDashboardService();

      // Get data from Palantir (with PostgreSQL fallback)
      const safeData = await dashboardService.getSAFeData();
      const risks = await dashboardService.getRisks();

      const activeProjects = safeData.projects.filter((p: any) =>
        p.status?.toLowerCase().includes('progress') || p.status === 'active'
      );

      // Calculate roadmap health metrics
      const highDebtProjects = activeProjects.filter((p: any) =>
        p.flowEfficiency && parseInt(p.flowEfficiency) < 60
      ).length;

      const blockedProjects = activeProjects.filter((p: any) =>
        p.status?.toLowerCase().includes('risk') || p.status?.toLowerCase().includes('blocked')
      ).length;

      const avgResourceUtilization = activeProjects.length > 0
        ? activeProjects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / activeProjects.length
        : 0;

      // Get cross-functional dependencies (projects at risk)
      const dependencies = activeProjects
        .filter((p: any) => p.spiValue && p.spiValue < 0.9)
        .slice(0, 20)
        .map((p: any) => ({
          source_project_id: p.id,
          source_project_name: p.name,
          dependency_status: p.spiValue < 0.85 ? 'blocked' : 'at-risk',
          impact: p.spiValue < 0.85 ? 'high' : 'medium',
          spi: p.spiValue,
          cpi: p.cpiValue,
        }));

      // Get architecture decisions (features not yet started)
      const pendingFeatures = safeData.features
        .filter((f: any) => f.status === 'Not Started' || f.status === 'Defining')
        .slice(0, 10);

      res.json({
        success: true,
        layer: "operational",
        horizon: "3-6 months",
        source: safeData.source,
        roadmapHealth: {
          total_active_projects: activeProjects.length,
          high_debt_projects: highDebtProjects,
          blocked_projects: blockedProjects,
          avg_resource_utilization: Math.round(avgResourceUtilization),
        },
        dependencies,
        architectureDecisions: {
          pending_decisions: pendingFeatures.length,
          decisions: pendingFeatures.map((f: any) => ({
            feature_id: f.id,
            feature_name: f.name,
            project_id: f.projectId,
            priority: f.priority,
            wsjf_score: f.wsjfScore,
          })),
        },
        risks: {
          total: risks.length,
          high: risks.filter((r: any) => r.severity === 'high' || r.severity === 'critical').length,
          by_category: risks.reduce((acc: any, r: any) => {
            const cat = r.categoryId || 'uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {}),
        },
        timestamp: safeData.timestamp,
      });
    } catch (error: any) {
      console.error("Error fetching operational layer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Tactical Layer data (PMO - Current week)
  router.get("/tactical", async (_req, res) => {
    try {
      const dashboardService = getPalantirDashboardService();

      // Get data from Palantir (with PostgreSQL fallback)
      const safeData = await dashboardService.getSAFeData();

      const activeProjects = safeData.projects.filter((p: any) =>
        p.status?.toLowerCase().includes('progress') || p.status === 'active'
      );

      // Calculate current week metrics
      const onTrackProjects = activeProjects.filter((p: any) => {
        const cpi = p.cpiValue || 1.0;
        const spi = p.spiValue || 1.0;
        return cpi >= 0.95 && spi >= 0.95;
      }).length;

      const atRiskProjects = activeProjects.filter((p: any) => {
        const cpi = p.cpiValue || 1.0;
        const spi = p.spiValue || 1.0;
        return (cpi < 0.95 && cpi >= 0.85) || (spi < 0.95 && spi >= 0.85);
      }).length;

      const avgVelocity = activeProjects.length > 0
        ? activeProjects.reduce((sum: number, p: any) => sum + parseInt(p.velocity || '0'), 0) / activeProjects.length
        : 0;

      const avgPredictability = activeProjects.length > 0
        ? activeProjects.reduce((sum: number, p: any) => sum + parseInt(p.predictability || '0'), 0) / activeProjects.length
        : 0;

      // Get active sprints (current PI projects)
      const activeSprints = activeProjects
        .filter((p: any) => p.currentPi)
        .slice(0, 20)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          team: p.divisionId,
          velocity: p.velocity,
          status: p.spiValue >= 0.95 ? 'on-track' : p.spiValue >= 0.85 ? 'at-risk' : 'behind',
          progress: p.progress,
          pi: p.currentPi,
        }));

      // Get blockers (projects with low SPI)
      const blockers = activeProjects
        .filter((p: any) => p.spiValue && p.spiValue < 0.85)
        .slice(0, 10)
        .map((p: any) => ({
          project_id: p.id,
          project_name: p.name,
          blocker_description: `SPI at ${(p.spiValue * 100).toFixed(0)}% - schedule performance issue`,
          severity: p.spiValue < 0.75 ? 'critical' : 'high',
          spi: p.spiValue,
          cpi: p.cpiValue,
        }));

      // Get task completion metrics
      const totalTasks = safeData.tasks.length;
      const completedTasks = safeData.tasks.filter((t: any) =>
        t.status === 'done' || t.status === 'completed'
      ).length;
      const inProgressTasks = safeData.tasks.filter((t: any) =>
        t.status === 'in_progress' || t.status === 'in-progress'
      ).length;

      res.json({
        success: true,
        layer: "tactical",
        horizon: "current week",
        source: safeData.source,
        weekMetrics: {
          active_projects: activeProjects.length,
          blocked_projects: blockers.length,
          avg_velocity: Math.round(avgVelocity),
          avg_predictability: Math.round(avgPredictability),
          on_track_sprints: onTrackProjects,
          at_risk_sprints: atRiskProjects,
        },
        taskMetrics: {
          total: totalTasks,
          completed: completedTasks,
          in_progress: inProgressTasks,
          completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        activeSprints,
        blockers,
        timestamp: safeData.timestamp,
      });
    } catch (error: any) {
      console.error("Error fetching tactical layer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Action Queue - What needs attention TODAY
  router.get("/action-queue", async (_req, res) => {
    try {
      const dashboardService = getPalantirDashboardService();

      // Get data from Palantir (with PostgreSQL fallback)
      const overview = await dashboardService.getDashboardOverview();
      const safeData = await dashboardService.getSAFeData();
      const risks = await dashboardService.getRisks();

      const allActions: any[] = [];

      // Critical budget risks (CPI < 0.85)
      const budgetRisks = safeData.projects
        .filter((p: any) => p.cpiValue && p.cpiValue < 0.85)
        .slice(0, 5)
        .map((p: any) => ({
          type: 'risk',
          urgency: 'today',
          title: `${p.name} - Budget overrun detected (CPI: ${(p.cpiValue * 100).toFixed(0)}%)`,
          source: 'FinOps Agent',
          project_id: p.id,
          metric: p.cpiValue,
        }));
      allActions.push(...budgetRisks);

      // Schedule blockers (SPI < 0.85)
      const scheduleBlockers = safeData.projects
        .filter((p: any) => p.spiValue && p.spiValue < 0.85)
        .slice(0, 5)
        .map((p: any) => ({
          type: 'blocker',
          urgency: 'immediate',
          title: `${p.name} - Schedule delay detected (SPI: ${(p.spiValue * 100).toFixed(0)}%)`,
          source: 'TMO Agent',
          project_id: p.id,
          metric: p.spiValue,
        }));
      allActions.push(...scheduleBlockers);

      // High/Critical risks requiring attention
      const criticalRisks = risks
        .filter((r: any) => r.severity === 'high' || r.severity === 'critical')
        .slice(0, 5)
        .map((r: any) => ({
          type: 'risk',
          urgency: r.severity === 'critical' ? 'immediate' : 'today',
          title: `Risk: ${r.name || r.title}`,
          source: 'Risk Agent',
          risk_id: r.id,
          severity: r.severity,
        }));
      allActions.push(...criticalRisks);

      // Projects at critical health
      if (overview.health.critical > 0) {
        allActions.push({
          type: 'alert',
          urgency: 'immediate',
          title: `${overview.health.critical} project(s) in critical status`,
          source: 'PMO Agent',
          count: overview.health.critical,
        });
      }

      // Low flow efficiency items
      const lowFlowProjects = safeData.projects
        .filter((p: any) => p.flowEfficiency && parseInt(p.flowEfficiency) < 50)
        .slice(0, 3)
        .map((p: any) => ({
          type: 'improvement',
          urgency: 'this-week',
          title: `${p.name} - Low flow efficiency (${p.flowEfficiency}%)`,
          source: 'VRO Agent',
          project_id: p.id,
        }));
      allActions.push(...lowFlowProjects);

      res.json({
        success: true,
        source: overview.source,
        actionQueue: allActions,
        urgentCount: allActions.filter(a => a.urgency === 'immediate').length,
        todayCount: allActions.filter(a => a.urgency === 'today').length,
        thisWeekCount: allActions.filter(a => a.urgency === 'this-week').length,
        totalCount: allActions.length,
        timestamp: overview.timestamp,
      });
    } catch (error: any) {
      console.error("Error fetching action queue:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get full COP (all three layers + action queue)
  router.get("/full", async (_req, res) => {
    try {
      const dashboardService = getPalantirDashboardService();

      // Get all data from Palantir (with PostgreSQL fallback)
      const overview = await dashboardService.getDashboardOverview();
      const safeData = await dashboardService.getSAFeData();
      const risks = await dashboardService.getRisks();
      const kpis = await dashboardService.getKPIs();
      const okrs = await dashboardService.getOKRs();

      const activeProjects = safeData.projects.filter((p: any) =>
        p.status?.toLowerCase().includes('progress') || p.status === 'active'
      );

      // Calculate all metrics
      const avgVelocity = activeProjects.length > 0
        ? activeProjects.reduce((sum: number, p: any) => sum + parseInt(p.velocity || '0'), 0) / activeProjects.length
        : 0;

      const totalPlannedValue = activeProjects.reduce((sum: number, p: any) =>
        sum + (p.plannedValue || 0), 0);

      const criticalActions = safeData.projects.filter((p: any) =>
        (p.cpiValue && p.cpiValue < 0.85) || (p.spiValue && p.spiValue < 0.85)
      ).length;

      res.json({
        success: true,
        source: overview.source,
        cop: {
          strategic: {
            total_projects: overview.portfolio.totalProjects,
            avg_roi: overview.portfolio.avgCPI * 100,
            total_planned_value: totalPlannedValue,
            health_score: overview.health.healthScore,
          },
          operational: {
            total_active_projects: activeProjects.length,
            blocked_projects: overview.health.critical,
            at_risk_projects: overview.health.atRisk,
            total_risks: risks.length,
            high_risks: risks.filter((r: any) => r.severity === 'high' || r.severity === 'critical').length,
          },
          tactical: {
            active_projects: activeProjects.length,
            avg_velocity: Math.round(avgVelocity),
            on_track: overview.health.onTrack,
            total_features: safeData.features.length,
            total_stories: safeData.stories.length,
            total_tasks: safeData.tasks.length,
          },
          actionQueue: {
            urgent_actions: criticalActions,
            budget_alerts: safeData.projects.filter((p: any) => p.cpiValue && p.cpiValue < 0.85).length,
            schedule_alerts: safeData.projects.filter((p: any) => p.spiValue && p.spiValue < 0.85).length,
          },
        },
        metrics: {
          kpis: kpis.length,
          okrs: okrs.length,
          value_streams: safeData.valueStreams.length,
        },
        lastUpdated: overview.timestamp,
      });
    } catch (error: any) {
      console.error("Error fetching full COP:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check endpoint
  router.get("/status", async (_req, res) => {
    try {
      const dashboardService = getPalantirDashboardService();
      const isPalantirAvailable = dashboardService.isPalantirAvailable();

      res.json({
        success: true,
        status: 'operational',
        palantirConnected: isPalantirAvailable,
        dataSource: isPalantirAvailable ? 'palantir' : 'postgres',
        message: isPalantirAvailable
          ? 'COP using Palantir as source of truth'
          : 'COP using PostgreSQL fallback',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
