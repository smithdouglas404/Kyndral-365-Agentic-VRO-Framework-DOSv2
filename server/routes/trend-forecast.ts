import { Router, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { TrendForecastEngine } from '../engines/TrendForecastEngine.js';

export function createTrendForecastRoutes(storage: IStorage): Router {
  const router = Router();
  const engine = new TrendForecastEngine(storage);

  router.get('/vro', async (req: Request, res: Response) => {
    try {
      const horizon = (req.query.horizon as string) || '90d';
      const forecast = await engine.generateVROForecast(horizon);
      res.json({ success: true, ...forecast });
    } catch (error: any) {
      console.error('[TrendForecast] VRO forecast error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/pmo', async (req: Request, res: Response) => {
    try {
      const horizon = (req.query.horizon as string) || '90d';
      const forecast = await engine.generatePMOForecast(horizon);
      res.json({ success: true, ...forecast });
    } catch (error: any) {
      console.error('[TrendForecast] PMO forecast error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/combined', async (req: Request, res: Response) => {
    try {
      const horizon = (req.query.horizon as string) || '90d';
      const [vro, pmo] = await Promise.all([
        engine.generateVROForecast(horizon),
        engine.generatePMOForecast(horizon),
      ]);

      const allInsights = [...vro.proactiveInsights, ...pmo.proactiveInsights]
        .sort((a, b) => {
          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
        });

      res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        horizon,
        summary: {
          portfolioValueScore: vro.portfolioValueScore,
          projectedValueScore: vro.projectedValueScore,
          valueTrend: vro.valueTrend,
          portfolioHealthScore: pmo.portfolioHealthScore,
          projectedHealthScore: pmo.projectedHealthScore,
          healthTrend: pmo.healthTrend,
          totalInsights: allInsights.length,
          criticalInsights: allInsights.filter(i => i.severity === 'critical').length,
          highInsights: allInsights.filter(i => i.severity === 'high').length,
        },
        vro,
        pmo,
        proactiveInsights: allInsights,
      });
    } catch (error: any) {
      console.error('[TrendForecast] Combined forecast error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('[TrendForecast] Trend forecast routes registered');
  return router;
}
