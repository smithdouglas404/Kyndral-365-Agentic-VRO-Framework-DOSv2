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

    // Identify features, stories, tasks from all projects
    const features = projects.filter((p: any) => {
      const name = p.name || '';
      const id = p.__primaryKey || p.project_id || p.id || '';
      return name.startsWith('[Feature]') || id.startsWith('feature-');
    });

    const stories = projects.filter((p: any) => {
      const name = p.name || '';
      const id = p.__primaryKey || p.project_id || p.id || '';
      return name.startsWith('[Story]') || id.startsWith('story-');
    });

    const tasks = projects.filter((p: any) => {
      const name = p.name || '';
      const id = p.__primaryKey || p.project_id || p.id || '';
      return name.startsWith('[Task]') || id.startsWith('task-');
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

    // Calculate budget from AtlasBudget objects
    let totalBudget = budgets.reduce((sum: number, b: any) => sum + (b.total_amount || b.planned_amount || 0), 0);
    let spentBudget = budgets.reduce((sum: number, b: any) => sum + (b.spent_amount || b.actual_amount || 0), 0);

    // If no AtlasBudget objects, calculate from project fields
    if (totalBudget === 0) {
      totalBudget = safeProjects.reduce((sum: number, p: any) => {
        const budget = parseFloat(p.budget_total || p.budgetTotal || p.budget || '0');
        return sum + (isNaN(budget) ? 0 : budget);
      }, 0);
    }
    if (spentBudget === 0) {
      spentBudget = safeProjects.reduce((sum: number, p: any) => {
        const spent = parseFloat(p.budget_spent || p.budgetSpent || p.actual_cost || '0');
        return sum + (isNaN(spent) ? 0 : spent);
      }, 0);
    }

    // Calculate average progress from projects
    const avgProjectProgress = safeProjects.length > 0
      ? safeProjects.reduce((sum: number, p: any) => {
          const progress = parseFloat(p.milestone_progress || p.progress || '0');
          // milestone_progress is 0-1, progress is 0-100
          return sum + (progress > 1 ? progress : progress * 100);
        }, 0) / safeProjects.length
      : 0;

    // Calculate EVM metrics
    const cpiSum = safeProjects.reduce((sum: number, p: any) => {
      const cpi = parseFloat(p.cpi_value || p.cpiValue || '1');
      return sum + (isNaN(cpi) ? 1 : cpi);
    }, 0);
    const avgCPI = safeProjects.length > 0 ? cpiSum / safeProjects.length : 1;

    const spiSum = safeProjects.reduce((sum: number, p: any) => {
      const spi = parseFloat(p.spi_value || p.spiValue || '1');
      return sum + (isNaN(spi) ? 1 : spi);
    }, 0);
    const avgSPI = safeProjects.length > 0 ? spiSum / safeProjects.length : 1;

    const totalRisks = risks.length;
    const criticalRisks = risks.filter((r: any) =>
      r.severity?.toLowerCase() === 'critical' || r.severity?.toLowerCase() === 'high'
    ).length;

    const okrProgress = objectives.length > 0
      ? objectives.reduce((sum: number, o: any) => sum + (o.progress || 0), 0) / objectives.length
      : 0;

    // Fetch dependencies count
    let totalDependencies = 0;
    try {
      const depsResult = await palantir.listObjects('AtlasDependency', {
        pageSize: 500,
        ontologyRid: ONTOLOGY_RID,
      });
      totalDependencies = depsResult.data?.length || 0;
    } catch {
      // AtlasDependency might not exist, ignore
    }

    res.json({
      totalProjects,
      activeProjects,
      onTrackProjects: projectsByStatus.green,
      atRiskProjects: projectsByStatus.amber,
      delayedProjects: projectsByStatus.red,
      avgProgress: avgProjectProgress,
      projectsByStatus,
      totalBudget,
      spentBudget,
      budgetUtilization: totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0,
      totalRisks,
      criticalRisks,
      okrProgress,
      // SAFe breakdown
      totalFeatures: features.length,
      totalStories: stories.length,
      totalTasks: tasks.length,
      totalDependencies,
      // EVM metrics
      avgCPI,
      avgSPI,
      costPerformance: avgCPI >= 1 ? 'On Budget' : 'Over Budget',
      schedulePerformance: avgSPI >= 1 ? 'On Schedule' : 'Behind Schedule',
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

    let projects = (result.data || []).map((p: any) => {
      // Parse budget values
      const budgetTotal = parseFloat(p.budget_total || p.budgetTotal || p.budget || '0') || 0;
      const budgetSpent = parseFloat(p.budget_spent || p.budgetSpent || p.actual_cost || '0') || 0;
      const progress = p.milestone_progress || p.progress || 0;
      // milestone_progress is 0-1, progress is 0-100
      const normalizedProgress = progress > 1 ? progress : progress * 100;

      return {
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
        // Budget fields
        budgetTotal,
        budgetSpent,
        budgetUnit: p.budget_unit || p.budgetUnit || 'USD',
        budgetRemaining: budgetTotal - budgetSpent,
        budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
        // ROI
        expectedRoi: p.expected_roi || p.expectedRoi || p.roi_value || '',
        roiValue: parseFloat(p.roi_value || p.roiValue || '0') || 0,
        // Progress
        milestoneProgress: normalizedProgress,
        progress: normalizedProgress,
        // EVM metrics
        cpiValue: parseFloat(p.cpi_value || p.cpiValue || '1') || 1,
        spiValue: parseFloat(p.spi_value || p.spiValue || '1') || 1,
        earnedValue: parseFloat(p.earned_value || p.earnedValue || '0') || 0,
        plannedValue: parseFloat(p.planned_value || p.plannedValue || '0') || 0,
        // SAFe fields
        artName: p.art_name || p.artName || '',
        portfolioTheme: p.portfolio_theme || p.portfolioTheme || '',
        safeStage: p.safe_stage || p.safeStage || '',
        currentPi: p.current_pi || p.currentPi || '',
        velocity: parseFloat(p.velocity || '0') || 0,
        predictability: parseFloat(p.predictability || '0') || 0,
        flowEfficiency: parseFloat(p.flow_efficiency || p.flowEfficiency || '0') || 0,
        // Epic linkage
        epicId: p.epic_id || p.epicId || '',
        epicName: p.epic_name || p.epicName || '',
        // Source tracking
        source: p.source || '',
        syncedAt: p.synced_at || p.syncedAt || '',
      };
    });

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
// SAFE WORK ITEMS (Features, Stories, Tasks)
// ============================================================================

router.get('/features', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { projectId, status } = req.query;

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    // Filter to features only
    let features = (result.data || [])
      .filter((p: any) => {
        const name = p.name || '';
        const id = p.__primaryKey || p.project_id || p.id || '';
        return name.startsWith('[Feature]') || id.startsWith('feature-');
      })
      .map((f: any) => ({
        id: f.projectId || f.project_id || f.__primaryKey,
        name: (f.name || '').replace('[Feature] ', ''),
        description: f.description || '',
        status: f.status || 'In Progress',
        projectId: f.parent_project_id || f.epic_id || '',
        storyPoints: parseInt(f.story_points || '0') || 0,
        completedPoints: parseInt(f.completed_points || '0') || 0,
        priority: f.priority || 'Medium',
        targetPi: f.current_pi || f.target_pi || '',
        wsjfScore: parseFloat(f.wsjf_score || '0') || 0,
        progress: f.milestone_progress ? f.milestone_progress * 100 : 0,
      }));

    if (projectId) {
      features = features.filter((f: any) => f.projectId === projectId);
    }
    if (status) {
      features = features.filter((f: any) => f.status.toLowerCase() === (status as string).toLowerCase());
    }

    res.json(features);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/stories', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { featureId, projectId, status } = req.query;

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    // Filter to stories only
    let stories = (result.data || [])
      .filter((p: any) => {
        const name = p.name || '';
        const id = p.__primaryKey || p.project_id || p.id || '';
        return name.startsWith('[Story]') || id.startsWith('story-');
      })
      .map((s: any) => ({
        id: s.projectId || s.project_id || s.__primaryKey,
        name: (s.name || '').replace('[Story] ', ''),
        description: s.description || '',
        status: s.status || 'In Progress',
        featureId: s.parent_feature_id || s.feature_id || '',
        projectId: s.parent_project_id || s.epic_id || '',
        storyPoints: parseInt(s.story_points || '0') || 0,
        priority: s.priority || 'Medium',
        assignee: s.assignee || '',
        sprint: s.sprint || s.current_pi || '',
      }));

    if (featureId) {
      stories = stories.filter((s: any) => s.featureId === featureId);
    }
    if (projectId) {
      stories = stories.filter((s: any) => s.projectId === projectId);
    }
    if (status) {
      stories = stories.filter((s: any) => s.status.toLowerCase() === (status as string).toLowerCase());
    }

    res.json(stories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/tasks', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { storyId, projectId, status, assignee } = req.query;

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    // Filter to tasks only
    let tasks = (result.data || [])
      .filter((p: any) => {
        const name = p.name || '';
        const id = p.__primaryKey || p.project_id || p.id || '';
        return name.startsWith('[Task]') || id.startsWith('task-');
      })
      .map((t: any) => ({
        id: t.projectId || t.project_id || t.__primaryKey,
        name: (t.name || '').replace('[Task] ', ''),
        description: t.description || '',
        status: t.status || 'In Progress',
        storyId: t.parent_story_id || t.story_id || '',
        projectId: t.parent_project_id || t.epic_id || '',
        estimatedHours: parseFloat(t.estimated_hours || '0') || 0,
        actualHours: parseFloat(t.actual_hours || '0') || 0,
        priority: t.priority || 'Medium',
        assignee: t.assignee || '',
        dueDate: t.due_date || t.end_date || '',
      }));

    if (storyId) {
      tasks = tasks.filter((t: any) => t.storyId === storyId);
    }
    if (projectId) {
      tasks = tasks.filter((t: any) => t.projectId === projectId);
    }
    if (status) {
      tasks = tasks.filter((t: any) => t.status.toLowerCase() === (status as string).toLowerCase());
    }
    if (assignee) {
      tasks = tasks.filter((t: any) => t.assignee === assignee);
    }

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// DEPENDENCIES
// ============================================================================

router.get('/dependencies', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { projectId, status, type } = req.query;

    // Try to get from AtlasDependency first
    let dependencies: any[] = [];
    try {
      const result = await palantir.listObjects('AtlasDependency', {
        pageSize: 500,
        ontologyRid: ONTOLOGY_RID,
      });
      dependencies = (result.data || []).map((d: any) => ({
        id: d.dependency_id || d.__primaryKey,
        sourceProjectId: d.source_project_id || d.from_project,
        targetProjectId: d.target_project_id || d.to_project,
        type: d.dependency_type || d.type || 'blocks',
        status: d.status || 'active',
        description: d.description || '',
        impact: d.impact || 'medium',
        resolvedAt: d.resolved_at || null,
      }));
    } catch {
      // AtlasDependency might not exist
    }

    if (projectId) {
      dependencies = dependencies.filter((d: any) =>
        d.sourceProjectId === projectId || d.targetProjectId === projectId
      );
    }
    if (status) {
      dependencies = dependencies.filter((d: any) => d.status === status);
    }
    if (type) {
      dependencies = dependencies.filter((d: any) => d.type === type);
    }

    res.json(dependencies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// PROJECT 360 VIEW (Full project data with related items)
// ============================================================================

router.get('/project360/:projectId', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { projectId } = req.params;

    // Get project
    const projectResult = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    const allProjects = projectResult.data || [];
    const project = allProjects.find((p: any) =>
      (p.projectId || p.project_id || p.__primaryKey) === projectId
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get related features, stories, tasks
    const features = allProjects.filter((p: any) => {
      const name = p.name || '';
      const id = p.__primaryKey || p.project_id || '';
      const isFeature = name.startsWith('[Feature]') || id.startsWith('feature-');
      const belongsToProject = (p.parent_project_id || p.epic_id) === projectId;
      return isFeature && belongsToProject;
    });

    const stories = allProjects.filter((p: any) => {
      const name = p.name || '';
      const id = p.__primaryKey || p.project_id || '';
      const isStory = name.startsWith('[Story]') || id.startsWith('story-');
      const belongsToProject = (p.parent_project_id || p.epic_id) === projectId;
      return isStory && belongsToProject;
    });

    const tasks = allProjects.filter((p: any) => {
      const name = p.name || '';
      const id = p.__primaryKey || p.project_id || '';
      const isTask = name.startsWith('[Task]') || id.startsWith('task-');
      const belongsToProject = (p.parent_project_id || p.epic_id) === projectId;
      return isTask && belongsToProject;
    });

    // Get risks
    let risks: any[] = [];
    try {
      const risksResult = await palantir.listObjects('AtlasRisk', {
        pageSize: 100,
        ontologyRid: ONTOLOGY_RID,
      });
      risks = (risksResult.data || []).filter((r: any) => r.project_id === projectId);
    } catch {}

    // Get dependencies
    let dependencies: any[] = [];
    try {
      const depsResult = await palantir.listObjects('AtlasDependency', {
        pageSize: 100,
        ontologyRid: ONTOLOGY_RID,
      });
      dependencies = (depsResult.data || []).filter((d: any) =>
        d.source_project_id === projectId || d.target_project_id === projectId
      );
    } catch {}

    // Parse project fields
    const budgetTotal = parseFloat(project.budget_total || project.budgetTotal || project.budget || '0') || 0;
    const budgetSpent = parseFloat(project.budget_spent || project.budgetSpent || project.actual_cost || '0') || 0;
    const progress = project.milestone_progress || project.progress || 0;
    const normalizedProgress = progress > 1 ? progress : progress * 100;

    res.json({
      // Core project info
      id: project.projectId || project.project_id || project.__primaryKey,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      status: mapStatusToColor(project.status || ''),
      statusText: project.status || 'Unknown',
      priority: mapPriorityToLevel(project.priority || 'medium'),
      priorityText: project.priority || 'Medium',
      // Dates
      startDate: project.startDate || project.start_date,
      endDate: project.endDate || project.end_date,
      // Organization
      businessUnit: project.business_unit || project.transformationId || project.transformation_id || 'General',
      artName: project.art_name || project.artName || '',
      portfolioTheme: project.portfolio_theme || project.portfolioTheme || '',
      // Budget & Financial
      budgetTotal,
      budgetSpent,
      budgetUnit: project.budget_unit || project.budgetUnit || 'USD',
      budgetRemaining: budgetTotal - budgetSpent,
      budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
      expectedRoi: project.expected_roi || project.expectedRoi || '',
      roiValue: parseFloat(project.roi_value || project.roiValue || '0') || 0,
      // EVM Metrics
      progress: normalizedProgress,
      cpiValue: parseFloat(project.cpi_value || project.cpiValue || '1') || 1,
      spiValue: parseFloat(project.spi_value || project.spiValue || '1') || 1,
      earnedValue: parseFloat(project.earned_value || project.earnedValue || '0') || 0,
      plannedValue: parseFloat(project.planned_value || project.plannedValue || '0') || 0,
      // SAFe fields
      safeStage: project.safe_stage || project.safeStage || '',
      currentPi: project.current_pi || project.currentPi || '',
      velocity: parseFloat(project.velocity || '0') || 0,
      predictability: parseFloat(project.predictability || '0') || 0,
      flowEfficiency: parseFloat(project.flow_efficiency || project.flowEfficiency || '0') || 0,
      // Counts
      featureCount: features.length,
      storyCount: stories.length,
      taskCount: tasks.length,
      riskCount: risks.length,
      dependencyCount: dependencies.length,
      // Related items
      features: features.map((f: any) => ({
        id: f.projectId || f.project_id || f.__primaryKey,
        name: (f.name || '').replace('[Feature] ', ''),
        status: f.status,
        progress: f.milestone_progress ? f.milestone_progress * 100 : 0,
      })),
      stories: stories.map((s: any) => ({
        id: s.projectId || s.project_id || s.__primaryKey,
        name: (s.name || '').replace('[Story] ', ''),
        status: s.status,
        storyPoints: parseInt(s.story_points || '0') || 0,
      })),
      tasks: tasks.map((t: any) => ({
        id: t.projectId || t.project_id || t.__primaryKey,
        name: (t.name || '').replace('[Task] ', ''),
        status: t.status,
        assignee: t.assignee || '',
      })),
      risks: risks.map((r: any) => ({
        id: r.risk_id || r.__primaryKey,
        title: r.title || r.name,
        severity: r.severity,
        status: r.status,
      })),
      dependencies: dependencies.map((d: any) => ({
        id: d.dependency_id || d.__primaryKey,
        type: d.dependency_type || d.type,
        targetProjectId: d.target_project_id,
        sourceProjectId: d.source_project_id,
        status: d.status,
      })),
      // Source tracking
      source: project.source || '',
      syncedAt: project.synced_at || project.syncedAt || '',
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
