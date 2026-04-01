import { Router, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { getTraceSummary, getAgentMetrics } from '../services/AgentTracing.js';

export function createAgentROIRoutes(storage: IStorage): Router {
  const router = Router();

  router.get('/performance', async (req: Request, res: Response) => {
    try {
      const summary = getTraceSummary();
      const metricsArr = getAgentMetrics();
      const metrics: Record<string, any> = {};
      for (const m of metricsArr) { metrics[m.agentKey] = m; }

      const agents = [
        { key: 'pmo', name: 'PMO Agent', domain: 'Portfolio Health', costTier: 'tier-0' },
        { key: 'finops', name: 'FinOps Agent', domain: 'Financial Ops', costTier: 'tier-1' },
        { key: 'risk', name: 'Risk Agent', domain: 'Risk Management', costTier: 'tier-0' },
        { key: 'ocm', name: 'OCM Agent', domain: 'Change Mgmt', costTier: 'tier-0' },
        { key: 'tmo', name: 'TMO Agent', domain: 'Transformation', costTier: 'tier-1' },
        { key: 'vro', name: 'VRO Agent', domain: 'Value Realization', costTier: 'tier-1' },
        { key: 'governance', name: 'Governance Agent', domain: 'Compliance', costTier: 'tier-0' },
        { key: 'planning', name: 'Planning Agent', domain: 'Planning', costTier: 'tier-0' },
        { key: 'integrated', name: 'Integrated Mgmt Agent', domain: 'Cross-Cutting', costTier: 'tier-1' },
        { key: 'okr', name: 'OKR Inference Agent', domain: 'OKR Tracking', costTier: 'tier-0' },
        { key: 'notification', name: 'Notification Agent', domain: 'A2A Gateway', costTier: 'tier-0' },
      ];

      const agentPerformance = agents.map(agent => {
        const agentMetrics = metrics[agent.key] || {};
        const totalCalls = agentMetrics.totalInvocations || 0;
        const totalErrors = agentMetrics.totalErrors || 0;
        const successRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 100;
        const avgLatency = agentMetrics.avgDurationMs || 0;
        const costPerCall = agent.costTier === 'tier-0' ? 0 : agent.costTier === 'tier-1' ? 0.002 : 0.05;
        const totalCost = totalCalls * costPerCall;
        const insightsGenerated = Math.max(1, Math.round(totalCalls * 0.3));
        const decisionsInfluenced = Math.max(1, Math.round(insightsGenerated * 0.5));
        const estimatedValueSaved = decisionsInfluenced * 15000;
        const roi = totalCost > 0 ? (estimatedValueSaved / totalCost) : estimatedValueSaved > 0 ? 999 : 0;

        return {
          agentKey: agent.key,
          agentName: agent.name,
          domain: agent.domain,
          costTier: agent.costTier,
          totalCalls,
          successRate: Math.round(successRate * 10) / 10,
          avgLatencyMs: Math.round(avgLatency),
          totalCost: Math.round(totalCost * 100) / 100,
          insightsGenerated,
          decisionsInfluenced,
          estimatedValueSaved,
          roi: Math.round(roi),
          status: successRate >= 95 ? 'healthy' : successRate >= 80 ? 'degraded' : 'unhealthy',
          trend: 'stable' as const,
        };
      });

      const totals = {
        totalAgents: agents.length,
        totalCalls: agentPerformance.reduce((s, a) => s + a.totalCalls, 0),
        avgSuccessRate: Math.round(agentPerformance.reduce((s, a) => s + a.successRate, 0) / agents.length * 10) / 10,
        totalCost: Math.round(agentPerformance.reduce((s, a) => s + a.totalCost, 0) * 100) / 100,
        totalInsights: agentPerformance.reduce((s, a) => s + a.insightsGenerated, 0),
        totalValueSaved: agentPerformance.reduce((s, a) => s + a.estimatedValueSaved, 0),
        overallROI: 0,
        tier0Percentage: Math.round((agentPerformance.filter(a => a.costTier === 'tier-0').length / agents.length) * 100),
      };
      totals.overallROI = totals.totalCost > 0 ? Math.round(totals.totalValueSaved / totals.totalCost) : 999;

      res.json({ success: true, agents: agentPerformance, totals, generatedAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
