/**
 * PALANTIR ONTOLOGY API ROUTES
 *
 * Serves dashboard data from Palantir Foundry ontology.
 * This is the SINGLE SOURCE OF TRUTH for all business data.
 *
 * These routes map to the usePalantirOntology.ts hooks on the frontend.
 */

import express, { type RequestHandler } from 'express';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

const router = express.Router();

const ONTOLOGY_RID = process.env.PALANTIR_ONTOLOGY_RID || '';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPalantirOrFail(res: express.Response) {
  const palantir = getPalantirService();
  if (!palantir) {
    res.status(503).json({ error: 'Palantir AIP not configured' });
    return null;
  }
  return palantir;
}

function mapStatusToColor(status: string): 'green' | 'amber' | 'red' {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('complete') || statusLower.includes('on track')) return 'green';
  if (statusLower.includes('at risk') || statusLower.includes('behind')) return 'amber';
  if (statusLower.includes('critical') || statusLower.includes('blocked') || statusLower.includes('delayed')) return 'red';
  return 'amber'; // Default to amber for "In Progress"
}

function mapPriorityToLevel(priority: string): 'critical' | 'high' | 'medium' | 'low' {
  const priorityLower = priority?.toLowerCase() || '';
  if (priorityLower === 'critical') return 'critical';
  if (priorityLower === 'high') return 'high';
  if (priorityLower === 'low') return 'low';
  return 'medium';
}

// ============================================================================
// ONTOLOGY SCHEMA
// ============================================================================

router.get('/schema', (async (_req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const objectTypes = await palantir.listObjectTypes(ONTOLOGY_RID);

    res.json({
      objectTypes: objectTypes || [],
      totalCount: objectTypes?.length || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

router.get('/metrics', (async (_req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    // Fetch projects
    const projectsResult = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    const projects = projectsResult.data || [];

    // Fetch budgets
    const budgetsResult = await palantir.listObjects('AtlasBudget', {
      pageSize: 100,
      ontologyRid: ONTOLOGY_RID,
    });

    const budgets = budgetsResult.data || [];

    // Fetch risks
    const risksResult = await palantir.listObjects('AtlasRisk', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    const risks = risksResult.data || [];

    // Fetch objectives
    const objectivesResult = await palantir.listObjects('AtlasObjective', {
      pageSize: 100,
      ontologyRid: ONTOLOGY_RID,
    });

    const objectives = objectivesResult.data || [];

    // Filter to only SAFe-level projects (exclude features, stories, tasks, agents, integrations)
    const safeProjects = projects.filter((p: any) => {
      const name = p.name || '';
      if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') || name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') || name.startsWith('[Monday]') || name.startsWith('[Jira') || name.startsWith('[OpenProject]')) return false;
      const id = p.__primaryKey || p.id || '';
      if (id.startsWith('feature-') || id.startsWith('story-') || id.startsWith('task-') || id.startsWith('agent-') || id.startsWith('source-') || id.startsWith('div-') || id.startsWith('monday-') || id.startsWith('story-test-') || id.startsWith('test-div-')) return false;
      return true;
    });

    // Calculate metrics from SAFe projects only
    const totalProjects = safeProjects.length;
    const activeProjects = safeProjects.filter((p: any) =>
      p.status && !p.status.toLowerCase().includes('complete')
    ).length;

    const projectsByStatus = {
      green: safeProjects.filter((p: any) => mapStatusToColor(p.status) === 'green').length,
      amber: safeProjects.filter((p: any) => mapStatusToColor(p.status) === 'amber').length,
      red: safeProjects.filter((p: any) => mapStatusToColor(p.status) === 'red').length,
    };

    const totalBudget = budgets.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
    const spentBudget = budgets.reduce((sum: number, b: any) => sum + (b.spent_amount || 0), 0);

    const totalRisks = risks.length;
    const criticalRisks = risks.filter((r: any) =>
      r.severity?.toLowerCase() === 'critical' || r.severity?.toLowerCase() === 'high'
    ).length;

    const okrProgress = objectives.length > 0
      ? objectives.reduce((sum: number, o: any) => sum + (o.progress || 0), 0) / objectives.length
      : 0;

    res.json({
      totalProjects,
      activeProjects,
      onTrackProjects: projectsByStatus.green,
      atRiskProjects: projectsByStatus.amber,
      delayedProjects: projectsByStatus.red,
      avgProgress: okrProgress,
      projectsByStatus,
      totalBudget,
      spentBudget,
      totalRisks,
      criticalRisks,
      okrProgress,
      agentAssignments: {},
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// PROJECTS
// ============================================================================

router.get('/projects', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { status, businessUnit, priority, businessUnits } = req.query;

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    let projects = (result.data || []).map((p: any) => ({
      id: p.projectId || p.project_id || p.__primaryKey,
      name: p.name || p.__title || 'Untitled Project',
      description: p.description || '',
      status: mapStatusToColor(p.status || ''),
      statusText: p.status || 'Unknown',
      businessUnit: p.business_unit || p.transformationId || p.transformation_id || 'General',
      startDate: p.startDate || p.start_date,
      endDate: p.endDate || p.end_date,
      priority: mapPriorityToLevel(p.priority || 'medium'),
      priorityText: p.priority || 'Medium',
      budgetTotal: p.budget_total || p.budgetTotal || 0,
      budgetSpent: p.budget_spent || p.budgetSpent || 0,
      expectedRoi: p.expected_roi || p.expectedRoi || '',
      milestoneProgress: p.milestone_progress || p.milestoneProgress || 0,
      artName: p.art_name || p.artName,
      portfolioTheme: p.portfolio_theme || p.portfolioTheme,
      safeStage: p.safe_stage || p.safeStage,
      currentPi: p.current_pi || p.currentPi,
      velocity: p.velocity,
      predictability: p.predictability,
      flowEfficiency: p.flow_efficiency || p.flowEfficiency,
    }));

    // Filter out non-SAFe items by default (features, stories, tasks, agents, integrations)
    const includeSafeOnly = req.query.safeOnly !== 'false';
    if (includeSafeOnly) {
      projects = projects.filter((p: any) => {
        const name = p.name || '';
        if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') || name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') || name.startsWith('[Monday]') || name.startsWith('[Jira') || name.startsWith('[OpenProject]')) return false;
        const id = p.id || '';
        if (id.startsWith('feature-') || id.startsWith('story-') || id.startsWith('task-') || id.startsWith('agent-') || id.startsWith('source-') || id.startsWith('div-') || id.startsWith('monday-') || id.startsWith('story-test-') || id.startsWith('test-div-')) return false;
        return true;
      });
    }

    // Apply additional filters
    if (status) {
      projects = projects.filter((p: any) => p.status === status);
    }
    if (priority) {
      projects = projects.filter((p: any) => p.priority === priority);
    }
    if (businessUnit) {
      projects = projects.filter((p: any) => p.businessUnit === businessUnit);
    }
    if (businessUnits) {
      const buList = (businessUnits as string).split(',');
      projects = projects.filter((p: any) => buList.includes(p.businessUnit));
    }

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/projects/:projectId', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const project = await palantir.getObject('AtlasProject', req.params.projectId, {
      ontologyRid: ONTOLOGY_RID,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      id: project.projectId || project.project_id || project.__primaryKey,
      name: project.name || project.__title || 'Untitled Project',
      description: project.description || '',
      status: mapStatusToColor(project.status || ''),
      statusText: project.status || 'Unknown',
      businessUnit: project.business_unit || project.transformationId || project.transformation_id || 'General',
      startDate: project.startDate || project.start_date,
      endDate: project.endDate || project.end_date,
      priority: mapPriorityToLevel(project.priority || 'medium'),
      priorityText: project.priority || 'Medium',
      budgetTotal: project.budget_total || project.budgetTotal || 0,
      budgetSpent: project.budget_spent || project.budgetSpent || 0,
      expectedRoi: project.expected_roi || project.expectedRoi || '',
      milestoneProgress: project.milestone_progress || project.milestoneProgress || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// RISKS
// ============================================================================

router.get('/risks', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { severity, status, projectId } = req.query;

    const result = await palantir.listObjects('AtlasRisk', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    let risks = (result.data || []).map((r: any) => ({
      id: r.risk_id || r.__primaryKey,
      title: r.title || r.name || 'Untitled Risk',
      description: r.description || '',
      severity: r.severity?.toLowerCase() || 'medium',
      probability: parseFloat(r.probability) || 0.5,
      impact: parseFloat(r.impact) || 0.5,
      status: r.status?.toLowerCase() || 'open',
      projectId: r.project_id,
      owner: r.owner,
      mitigationPlan: r.mitigation_strategy || r.mitigation_plan || '',
    }));

    // Apply filters
    if (severity) {
      risks = risks.filter((r: any) => r.severity === severity);
    }
    if (status) {
      risks = risks.filter((r: any) => r.status === status);
    }
    if (projectId) {
      risks = risks.filter((r: any) => r.projectId === projectId);
    }

    res.json(risks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// OKRS / OBJECTIVES
// ============================================================================

router.get('/okrs', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { period, owner } = req.query;

    const result = await palantir.listObjects('AtlasObjective', {
      pageSize: 100,
      ontologyRid: ONTOLOGY_RID,
    });

    let okrs = (result.data || []).map((o: any) => ({
      id: o.objective_id || o.__primaryKey,
      objective: o.title || o.objective || 'Untitled Objective',
      keyResults: o.key_results || [],
      progress: o.progress || 0,
      owner: o.owner,
      period: o.period || o.time_period,
      strategicPriority: o.strategic_priority || o.category,
    }));

    // Apply filters
    if (period) {
      okrs = okrs.filter((o: any) => o.period === period);
    }
    if (owner) {
      okrs = okrs.filter((o: any) => o.owner === owner);
    }

    res.json(okrs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// FINANCIALS
// ============================================================================

router.get('/financials', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { projectId } = req.query;

    const result = await palantir.listObjects('AtlasBudget', {
      pageSize: 100,
      ontologyRid: ONTOLOGY_RID,
    });

    let financials = (result.data || []).map((b: any) => ({
      id: b.budget_id || b.__primaryKey,
      projectId: b.project_id,
      budgetAllocated: b.allocated_amount || b.total_amount || 0,
      budgetSpent: b.spent_amount || 0,
      budgetRemaining: (b.allocated_amount || b.total_amount || 0) - (b.spent_amount || 0),
      forecastAtCompletion: b.forecast_at_completion || b.total_amount || 0,
      variance: ((b.allocated_amount || b.total_amount || 0) - (b.spent_amount || 0)) / (b.allocated_amount || b.total_amount || 1),
      variancePercent: (((b.allocated_amount || b.total_amount || 0) - (b.spent_amount || 0)) / (b.allocated_amount || b.total_amount || 1)) * 100,
      burnRate: b.burn_rate,
      lastUpdated: b.updated_at || new Date().toISOString(),
    }));

    if (projectId) {
      financials = financials.filter((f: any) => f.projectId === projectId);
    }

    res.json(financials);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// KPIS
// ============================================================================

router.get('/kpis', (async (_req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const result = await palantir.listObjects('AtlasKpi', {
      pageSize: 100,
      ontologyRid: ONTOLOGY_RID,
    });

    const kpis = (result.data || []).map((k: any) => ({
      id: k.kpi_id || k.__primaryKey,
      name: k.name || k.metric_name || 'Untitled KPI',
      category: k.category || 'General',
      currentValue: k.current_value || k.value || 0,
      targetValue: k.target_value || 100,
      unit: k.unit || '',
      trend: k.trend || 'stable',
      status: k.status || 'on_track',
      lastUpdated: k.updated_at || new Date().toISOString(),
    }));

    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// AGENT-SPECIFIC DATA
// ============================================================================

router.get('/agent/:agentType', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const agentType = req.params.agentType;

    // Map agent types to the object types they need
    const agentObjectMapping: Record<string, string[]> = {
      pmo: ['AtlasProject', 'AtlasBudget', 'AtlasRisk'],
      finops: ['AtlasBudget', 'AtlasProject'],
      risk: ['AtlasRisk', 'AtlasProject'],
      vro: ['AtlasProject', 'AtlasObjective', 'AtlasKpi'],
      ocm: ['AtlasProject', 'AtlasObjective'],
      tmo: ['AtlasProject', 'AtlasTransformation'],
      governance: ['AtlasProject', 'AtlasRisk', 'AtlasObjective'],
    };

    const objectTypes = agentObjectMapping[agentType.toLowerCase()] || ['AtlasProject'];

    const data: Record<string, any[]> = {};
    const summary: Record<string, number> = {};

    for (const objectType of objectTypes) {
      try {
        const result = await palantir.listObjects(objectType, {
          pageSize: 500,
          ontologyRid: ONTOLOGY_RID,
        });
        data[objectType] = result.data || [];
        summary[objectType] = (result.data || []).length;
      } catch {
        data[objectType] = [];
        summary[objectType] = 0;
      }
    }

    res.json({
      objectTypes,
      data,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// GENERIC OBJECT QUERIES
// ============================================================================

router.get('/:objectType', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { objectType } = req.params;

    const result = await palantir.listObjects(objectType, {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    res.json(result.data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/:objectType/:objectId', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { objectType, objectId } = req.params;

    const obj = await palantir.getObject(objectType, objectId, {
      ontologyRid: ONTOLOGY_RID,
    });

    if (!obj) {
      return res.status(404).json({ error: `${objectType} not found` });
    }

    res.json(obj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// EXPORT
// ============================================================================

export function registerPalantirOntologyRoutes(app: express.Application): void {
  app.use('/api/palantir/ontology', router);
}

export default router;
