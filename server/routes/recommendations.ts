/**
 * AGENT RECOMMENDATIONS API
 * Provides AI-driven recommendations from various agents
 *
 * Replaces hardcoded recommendation arrays in client components
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';

interface Recommendation {
  id: string;
  title: string;
  confidence: number;
  description: string;
  actionLabel: string;
  type: 'risk' | 'opportunity' | 'savings';
  impact?: string;
  actionType: 'mitigate' | 'accelerate' | 'investigate' | 'escalate';
  agentSource: string;
  projectId?: string;
  projectName?: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Generate recommendations based on current interventions, risks, and project data
 */
async function generateRecommendations(
  storage: IStorage,
  agentType?: string
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Fetch real data from database
  const interventions = await storage.db.query.interventions.findMany({
    where: (interventions, { eq }) => eq(interventions.status, 'pending'),
    limit: 50,
    orderBy: (interventions, { desc }) => [desc(interventions.createdAt)],
  });

  const risks = await storage.db.query.risks.findMany({
    where: (risks, { eq }) => eq(risks.status, 'open'),
    limit: 50,
    orderBy: (risks, { desc }) => [desc(risks.severity)],
  });

  const projects = await storage.db.query.projects.findMany({
    limit: 100,
  });

  // Convert interventions to recommendations
  interventions.forEach((intervention, index) => {
    // Filter by agent type if specified
    if (agentType && intervention.agentSource &&
        !intervention.agentSource.toLowerCase().includes(agentType.toLowerCase())) {
      return;
    }

    const rec: Recommendation = {
      id: intervention.id || `int-${index}`,
      title: intervention.title || 'Intervention Required',
      confidence: parseFloat(intervention.confidence || '0.85') * 100,
      description: intervention.description || '',
      actionLabel: intervention.suggestedAction || 'Review',
      type: intervention.type === 'budget' ? 'savings' :
            intervention.type === 'risk' ? 'risk' : 'opportunity',
      impact: intervention.impact,
      actionType: intervention.severity === 'critical' ? 'escalate' :
                  intervention.type === 'risk' ? 'mitigate' :
                  intervention.type === 'opportunity' ? 'accelerate' : 'investigate',
      agentSource: intervention.agentSource || 'System',
      projectId: intervention.projectId,
      projectName: intervention.projectName,
      createdAt: intervention.createdAt || new Date(),
      priority: (intervention.severity as any) || 'medium',
    };

    recommendations.push(rec);
  });

  // Convert high-severity risks to recommendations
  risks.filter(r => r.severity === 'high' || r.severity === 'critical')
    .slice(0, 10)
    .forEach((risk, index) => {
      const rec: Recommendation = {
        id: risk.id || `risk-${index}`,
        title: risk.title || 'Risk Mitigation Needed',
        confidence: 85,
        description: risk.description || '',
        actionLabel: 'Mitigate Risk',
        type: 'risk',
        impact: risk.impact,
        actionType: 'mitigate',
        agentSource: 'Risk Agent',
        projectId: risk.projectId,
        createdAt: risk.createdAt || new Date(),
        priority: (risk.severity as any) || 'high',
      };

      recommendations.push(rec);
    });

  // Add project-based opportunities for at-risk projects
  const atRiskProjects = projects.filter(p =>
    (p.cpi && p.cpi < 0.95) || (p.spi && p.spi < 0.92)
  );

  atRiskProjects.slice(0, 5).forEach((project, index) => {
    const cpiIssue = project.cpi && project.cpi < 0.95;
    const spiIssue = project.spi && project.spi < 0.92;
    const variance = cpiIssue ? Math.round((1 - (project.cpi || 1)) * 100) : 0;

    const rec: Recommendation = {
      id: `proj-rec-${project.id}-${index}`,
      title: `${project.name} Performance Review`,
      confidence: 88,
      description: `Project trending ${cpiIssue ? 'over budget' : 'behind schedule'}. CPI: ${project.cpi?.toFixed(2) || 'N/A'}, SPI: ${project.spi?.toFixed(2) || 'N/A'}`,
      actionLabel: 'Review Performance',
      type: 'risk',
      impact: `Potential ${variance}% cost variance`,
      actionType: 'investigate',
      agentSource: 'PMO Agent',
      projectId: project.id,
      projectName: project.name,
      createdAt: new Date(),
      priority: (project.cpi && project.cpi < 0.90) ? 'critical' : 'high',
    };

    recommendations.push(rec);
  });

  // Sort by priority and confidence
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.confidence - a.confidence;
    })
    .slice(0, 20); // Limit to top 20 recommendations
}

export function registerRecommendationsRoutes(app: Express, storage: IStorage) {
  /**
   * GET /api/recommendations
   * Get AI-driven recommendations, optionally filtered by agent type
   */
  app.get('/api/recommendations', async (req: Request, res: Response) => {
    try {
      const { agentType } = req.query;

      const recommendations = await generateRecommendations(
        storage,
        agentType as string | undefined
      );

      res.json({
        success: true,
        recommendations,
        count: recommendations.length,
      });
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendations',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/recommendations/:id
   * Get a specific recommendation by ID
   */
  app.get('/api/recommendations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const allRecommendations = await generateRecommendations(storage);
      const recommendation = allRecommendations.find(r => r.id === id);

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          error: 'Recommendation not found',
        });
      }

      res.json({
        success: true,
        recommendation,
      });
    } catch (error: any) {
      console.error('Error fetching recommendation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendation',
        message: error.message,
      });
    }
  });

  console.log('[Recommendations] Recommendation routes registered');
}
