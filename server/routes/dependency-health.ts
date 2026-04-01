import { Router, Request, Response } from 'express';
import type { IStorage } from '../storage.js';

export function createDependencyHealthRoutes(storage: IStorage): Router {
  const router = Router();

  router.get('/overview', async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      const allDeps: any[] = [];
      for (const p of projects) {
        try {
          const deps = await storage.getDependencies(p.id?.toString() || '');
          allDeps.push(...deps);
        } catch { }
      }
      const dependencies = allDeps;

      const depHealth = dependencies.map(dep => {
        const sourceProject = projects.find(p => p.id === dep.projectId);
        const targetProject = projects.find(p => p.id === dep.targetProjectId);
        const sourceSPI = parseFloat((sourceProject as any)?.spi || '1.0');
        const targetSPI = parseFloat((targetProject as any)?.spi || '1.0');
        const healthScore = Math.round(Math.min(sourceSPI, targetSPI) * 100);
        const status = healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'at-risk' : 'blocked';

        return {
          id: dep.id,
          sourceProjectId: dep.projectId,
          sourceProjectName: sourceProject?.name || 'Unknown',
          targetProjectId: dep.targetProjectId,
          targetProjectName: targetProject?.name || 'Unknown',
          dependencyType: dep.dependencyType || 'finish-to-start',
          criticality: dep.criticality || 'medium',
          status,
          healthScore,
          lagDays: dep.lagDays || 0,
          impactIfDelayed: dep.impactIfDelayed || 'Schedule delay on downstream project',
          riskFlag: healthScore < 70,
        };
      });

      const healthyCount = depHealth.filter(d => d.status === 'healthy').length;
      const atRiskCount = depHealth.filter(d => d.status === 'at-risk').length;
      const blockedCount = depHealth.filter(d => d.status === 'blocked').length;
      const overallHealth = depHealth.length > 0
        ? Math.round(depHealth.reduce((s, d) => s + d.healthScore, 0) / depHealth.length)
        : 100;

      const criticalChains = depHealth
        .filter(d => d.criticality === 'critical' || d.criticality === 'high')
        .sort((a, b) => a.healthScore - b.healthScore);

      const riskAlerts = depHealth
        .filter(d => d.healthScore < 70)
        .map(d => ({
          dependencyId: d.id,
          title: `${d.sourceProjectName} → ${d.targetProjectName}`,
          severity: d.healthScore < 50 ? 'critical' as const : 'high' as const,
          description: `Dependency health at ${d.healthScore}% — ${d.impactIfDelayed}`,
          suggestedAction: d.healthScore < 50
            ? 'Immediate escalation required — schedule emergency sync between project leads'
            : 'Monitor closely and prepare contingency plan',
        }));

      const typeDistribution = ['finish-to-start', 'start-to-start', 'finish-to-finish', 'resource-sharing', 'data-dependency'].map(type => ({
        type,
        count: depHealth.filter(d => d.dependencyType === type).length,
        healthAvg: (() => {
          const matching = depHealth.filter(d => d.dependencyType === type);
          return matching.length > 0 ? Math.round(matching.reduce((s, d) => s + d.healthScore, 0) / matching.length) : 0;
        })(),
      }));

      const projectDependencyCounts = projects.map(p => {
        const outgoing = depHealth.filter(d => d.sourceProjectId === p.id).length;
        const incoming = depHealth.filter(d => d.targetProjectId === p.id).length;
        return {
          projectId: p.id,
          projectName: p.name,
          outgoing,
          incoming,
          total: outgoing + incoming,
          criticalDeps: depHealth.filter(d => (d.sourceProjectId === p.id || d.targetProjectId === p.id) && d.criticality === 'critical').length,
        };
      }).filter(p => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 15);

      res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        overallHealth,
        totalDependencies: depHealth.length,
        healthyCount,
        atRiskCount,
        blockedCount,
        dependencies: depHealth,
        criticalChains,
        riskAlerts,
        typeDistribution,
        projectDependencyCounts,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
