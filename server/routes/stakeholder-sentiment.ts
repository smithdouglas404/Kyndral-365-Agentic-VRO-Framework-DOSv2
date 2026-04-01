import { Router, Request, Response } from 'express';
import type { IStorage } from '../storage.js';

export function createStakeholderSentimentRoutes(storage: IStorage): Router {
  const router = Router();

  router.get('/overview', async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');

      const stakeholderGroups = [
        { name: 'Executive Sponsors', size: 12, sentiment: 78, adoption: 82, engagement: 75 },
        { name: 'Program Managers', size: 24, sentiment: 72, adoption: 88, engagement: 80 },
        { name: 'Technical Teams', size: 85, sentiment: 65, adoption: 70, engagement: 68 },
        { name: 'Business Users', size: 150, sentiment: 58, adoption: 55, engagement: 50 },
        { name: 'Change Champions', size: 18, sentiment: 85, adoption: 92, engagement: 88 },
        { name: 'External Partners', size: 30, sentiment: 70, adoption: 60, engagement: 55 },
      ];

      const overallSentiment = Math.round(stakeholderGroups.reduce((s, g) => s + g.sentiment * g.size, 0) / stakeholderGroups.reduce((s, g) => s + g.size, 0));
      const overallAdoption = Math.round(stakeholderGroups.reduce((s, g) => s + g.adoption * g.size, 0) / stakeholderGroups.reduce((s, g) => s + g.size, 0));

      const changeReadiness = {
        awareness: 72,
        desire: 65,
        knowledge: 58,
        ability: 52,
        reinforcement: 48,
      };

      const adoptionCurve = Array.from({ length: 12 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - 11 + i);
        const base = 30 + i * 5;
        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          adoption: Math.min(95, base + Math.round(Math.sin(i * 0.5) * 5)),
          target: Math.min(95, 35 + i * 5.5),
        };
      });

      const resistanceHotspots = [
        { area: 'Legacy System Migration', severity: 'high', stakeholders: 45, reason: 'Fear of job displacement', mitigation: 'Reskilling program and clear communication plan' },
        { area: 'New Approval Workflows', severity: 'medium', stakeholders: 30, reason: 'Perceived slower processes', mitigation: 'Demonstrate time savings with pilot data' },
        { area: 'Data Governance Policies', severity: 'medium', stakeholders: 25, reason: 'Additional compliance burden', mitigation: 'Automated compliance checks reduce manual work' },
        { area: 'AI-Assisted Decisions', severity: 'low', stakeholders: 15, reason: 'Trust in AI recommendations', mitigation: 'Transparent AI reasoning and HITL controls' },
      ];

      const trainingStatus = {
        totalModules: 24,
        completedModules: 18,
        inProgressModules: 4,
        notStartedModules: 2,
        averageCompletion: 75,
        certifiedUsers: 120,
        totalUsers: 319,
      };

      const sentimentTimeline = Array.from({ length: 8 }, (_, i) => {
        const week = new Date();
        week.setDate(week.getDate() - (7 - i) * 7);
        return {
          week: week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          executive: 75 + Math.round(Math.sin(i * 0.7) * 5),
          technical: 60 + Math.round(Math.sin(i * 0.5 + 1) * 8),
          business: 55 + Math.round(Math.sin(i * 0.4 + 2) * 6),
          overall: overallSentiment + Math.round(Math.sin(i * 0.6) * 4 - (7 - i)),
        };
      });

      res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        overallSentiment,
        overallAdoption,
        stakeholderGroups,
        changeReadiness,
        adoptionCurve,
        resistanceHotspots,
        trainingStatus,
        sentimentTimeline,
        totalStakeholders: stakeholderGroups.reduce((s, g) => s + g.size, 0),
        activeProjectsCount: activeProjects.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
