/**
 * PALANTIR ONTOLOGY API ROUTES
 *
 * 100% Palantir Foundry — zero PostgreSQL for project data.
 * All reads: AtlasProject, AtlasBudget, AtlasRisk, AtlasObjective, AtlasKeyResult, AtlasDependency.
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
    console.error('[PalantirOntology] Palantir service not available - check PALANTIR_HOSTNAME and PALANTIR_TOKEN env vars');
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

    const [projectsResult, budgetsResult, risksResult, okrsResult, keyResultsResult, featuresResult, storiesResult, tasksResult] = await Promise.all([
      palantir.listObjects('AtlasProject', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasObjective', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasKeyResult', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasFeature', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasStory', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasTask', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
    ]);

    const safeExcludePrefixes = ['[Feature]', '[Story]', '[Task]', '[Agent]', '[Integration]', '[Division]', '[Monday]', '[Jira'];
    const safeExcludeIdPrefixes = ['feature-', 'story-', 'task-', 'agent-', 'source-', 'div-', 'monday-', 'story-test-', 'test-div-'];

    const allProjects = (projectsResult.data || []).filter((p: any) => {
      const name = p.name || '';
      const id = p.projectId || p.__primaryKey || '';
      return !safeExcludePrefixes.some(prefix => name.startsWith(prefix)) &&
             !safeExcludeIdPrefixes.some(prefix => id.startsWith(prefix));
    });

    const budgetMap = new Map<string, any>();
    for (const b of (budgetsResult.data || [])) {
      budgetMap.set(b.budgetId || b.__primaryKey, b);
    }

    const totalProjects = allProjects.length;
    const activeProjects = allProjects.filter((p: any) =>
      p.status && !p.status.toLowerCase().includes('complete')
    ).length;

    const projectsByStatus = {
      green: allProjects.filter((p: any) => mapStatusToColor(p.status || '') === 'green').length,
      amber: allProjects.filter((p: any) => mapStatusToColor(p.status || '') === 'amber').length,
      red: allProjects.filter((p: any) => mapStatusToColor(p.status || '') === 'red').length,
    };

    let totalBudget = 0;
    let spentBudget = 0;
    let progressSum = 0;
    let projectsWithProgress = 0;

    for (const [, budget] of budgetMap) {
      totalBudget += budget.totalAmount || 0;
      spentBudget += budget.spentAmount || 0;
    }

    for (const p of allProjects) {
      const progress = (p.milestoneProgress || 0) * 100;
      if (progress > 0) {
        progressSum += progress;
        projectsWithProgress++;
      }
    }

    const avgProgress = projectsWithProgress > 0 ? progressSum / projectsWithProgress : 0;

    const allRisks = risksResult.data || [];
    const totalRisks = allRisks.length;
    const criticalRisks = allRisks.filter((r: any) =>
      (r.riskScore || 0) >= 8 || r.impact?.toLowerCase() === 'critical' || r.impact?.toLowerCase() === 'high'
    ).length;

    const allOkrs = okrsResult.data || [];
    const allKeyResults = keyResultsResult.data || [];
    let okrProgress = 0;
    if (allKeyResults.length > 0) {
      const krs = allKeyResults.filter((kr: any) => (kr.targetValue || 0) > 0);
      if (krs.length > 0) {
        okrProgress = krs.reduce((sum: number, kr: any) =>
          sum + ((kr.currentValue || 0) / (kr.targetValue || 1)) * 100, 0) / krs.length;
      }
    }

    const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

    // Count SAFe work items
    const totalFeatures = (featuresResult.data || []).length;
    const totalStories = (storiesResult.data || []).length;
    const totalTasks = (tasksResult.data || []).length;

    res.json({
      totalProjects,
      activeProjects,
      onTrackProjects: projectsByStatus.green,
      atRiskProjects: projectsByStatus.amber,
      delayedProjects: projectsByStatus.red,
      avgProgress,
      projectsByStatus,
      totalBudget,
      spentBudget,
      budgetUtilization,
      totalRisks,
      criticalRisks,
      okrProgress,
      totalFeatures,
      totalStories,
      totalTasks,
      totalDependencies: 0,
      avgCPI: budgetUtilization > 0 ? (avgProgress / budgetUtilization) : 1,
      avgSPI: 1,
      costPerformance: spentBudget <= totalBudget ? 'On Budget' : 'Over Budget',
      schedulePerformance: 'On Schedule',
      agentAssignments: {},
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// ============================================================================
// PROJECTS - 100% Palantir with AtlasBudget joins
// ============================================================================

router.get('/projects', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { status, businessUnit, priority, businessUnits } = req.query;

    console.log('[PalantirOntology] Fetching projects from Palantir...');

    const [projectsResult, budgetsResult, risksResult] = await Promise.all([
      palantir.listObjects('AtlasProject', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch((e) => {
        console.error('[PalantirOntology] Error fetching AtlasProject:', e.message);
        return { data: [] };
      }),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch((e) => {
        console.error('[PalantirOntology] Error fetching AtlasBudget:', e.message);
        return { data: [] };
      }),
      palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch((e) => {
        console.error('[PalantirOntology] Error fetching AtlasRisk:', e.message);
        return { data: [] };
      }),
    ]);

    console.log(`[PalantirOntology] Fetched ${projectsResult.data?.length || 0} projects, ${budgetsResult.data?.length || 0} budgets, ${risksResult.data?.length || 0} risks`);

    const safeExcludePrefixes = ['[Feature]', '[Story]', '[Task]', '[Agent]', '[Integration]', '[Division]', '[Monday]', '[Jira'];
    const safeExcludeIdPrefixes = ['feature-', 'story-', 'task-', 'agent-', 'source-', 'div-', 'monday-', 'story-test-', 'test-div-'];

    const budgetMap = new Map<string, any>();
    for (const b of (budgetsResult.data || [])) {
      budgetMap.set(b.budgetId || b.__primaryKey, b);
    }

    const riskCounts = new Map<string, number>();
    for (const r of (risksResult.data || [])) {
      const pid = r.projectId || '';
      riskCounts.set(pid, (riskCounts.get(pid) || 0) + 1);
    }

    let projectList = (projectsResult.data || [])
      .filter((p: any) => {
        const name = p.name || '';
        const id = p.projectId || p.__primaryKey || '';
        return !safeExcludePrefixes.some(prefix => name.startsWith(prefix)) &&
               !safeExcludeIdPrefixes.some(prefix => id.startsWith(prefix));
      })
      .map((p: any) => {
        const id = p.projectId || p.__primaryKey || '';
        const budget = budgetMap.get(p.budgetId);
        const budgetTotal = budget ? (budget.totalAmount || 0) : 0;
        const budgetSpent = budget ? (budget.spentAmount || 0) : 0;
        const progress = (p.milestoneProgress || 0) * 100;

        return {
          id,
          name: p.name || 'Untitled Project',
          description: p.description || '',
          status: mapStatusToColor(p.status || ''),
          statusText: p.status || 'Unknown',
          businessUnit: 'General',
          startDate: p.startDate,
          endDate: p.endDate,
          priority: mapPriorityToLevel(p.priority || 'medium'),
          priorityText: p.priority || 'Medium',
          budgetTotal,
          budgetSpent,
          budgetUnit: budget?.currency || 'USD',
          budgetRemaining: budgetTotal - budgetSpent,
          budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
          budgetName: budget?.name || '',
          expectedRoi: '',
          roiValue: 0,
          milestoneProgress: progress,
          progress,
          cpiValue: 1,
          spiValue: 1,
          earnedValue: 0,
          plannedValue: 0,
          artName: '',
          portfolioTheme: '',
          safeStage: '',
          currentPi: '',
          velocity: 0,
          predictability: 0,
          flowEfficiency: 0,
          epicId: '',
          epicName: '',
          featureCount: 0,
          storyCount: 0,
          taskCount: 0,
          riskCount: riskCounts.get(id) || 0,
          dependencyCount: 0,
          transformationId: p.transformationId || '',
        };
      });

    if (status) {
      projectList = projectList.filter((p: any) => p.status === status);
    }
    if (priority) {
      projectList = projectList.filter((p: any) => p.priority === priority);
    }
    if (businessUnit) {
      projectList = projectList.filter((p: any) => p.businessUnit === businessUnit);
    }
    if (businessUnits) {
      const buList = (businessUnits as string).split(',');
      projectList = projectList.filter((p: any) => buList.includes(p.businessUnit));
    }

    res.json(projectList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/projects/:projectId', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const [project, budgetsResult, transformationsResult] = await Promise.all([
      palantir.getObject('AtlasProject', req.params.projectId, { ontologyRid: ONTOLOGY_RID }),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasTransformation', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
    ]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const budget = (budgetsResult.data || []).find((b: any) => (b.budgetId || b.__primaryKey) === project.budgetId);
    const transformation = (transformationsResult.data || []).find((t: any) => (t.transformationId || t.__primaryKey) === project.transformationId);
    const milestoneProgress = project.milestoneProgress || 0;

    res.json({
      id: project.projectId || project.__primaryKey,
      name: project.name || project.__title || 'Untitled Project',
      description: project.description || '',
      status: mapStatusToColor(project.status || ''),
      statusText: project.status || 'Unknown',
      businessUnit: project.transformationId || 'General',
      transformationName: transformation?.name || project.transformationId || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      priority: mapPriorityToLevel(project.priority || 'medium'),
      priorityText: project.priority || 'Medium',
      budgetId: project.budgetId || '',
      budgetName: budget?.name || '',
      budgetTotal: budget?.totalAmount || 0,
      budgetSpent: budget?.spentAmount || 0,
      budgetAllocated: budget?.allocatedAmount || 0,
      budgetCurrency: budget?.currency || 'USD',
      milestoneProgress,
      progress: Math.round(milestoneProgress * 100),
      createdAt: project.createdAt || '',
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
      id: r.riskId || r.__primaryKey,
      title: r.__title || r.title || r.name || r.description || 'Risk',
      description: r.description || '',
      severity: (r.probability || r.severity || 'medium').toLowerCase(),
      probability: r.riskScore ? r.riskScore / 10 : 0.5,
      impact: (r.impact || 'medium').toLowerCase(),
      riskScore: r.riskScore || 5,
      status: (r.status || 'open').toLowerCase(),
      projectId: r.projectId || '',
      owner: r.owner || '',
      mitigationPlan: r.mitigationPlan || '',
      identifiedDate: r.identifiedDate || r.createdAt || '',
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

    const keyResultsData = await palantir.listObjects('AtlasKeyResult', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    }).catch(() => ({ data: [] }));

    const krByObjective = new Map<string, any[]>();
    for (const kr of (keyResultsData.data || [])) {
      const oid = kr.objectiveId || '';
      if (!krByObjective.has(oid)) krByObjective.set(oid, []);
      krByObjective.get(oid)!.push({
        id: kr.keyResultId || kr.__primaryKey,
        name: kr.name || '',
        currentValue: kr.currentValue || 0,
        targetValue: kr.targetValue || 100,
        unit: kr.unit || '%',
        status: kr.status || 'On Track',
        progress: kr.targetValue ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0,
      });
    }

    let okrs = (result.data || []).map((o: any) => {
      const krs = krByObjective.get(o.objectiveId || o.__primaryKey) || [];
      const avgProgress = krs.length > 0 ? Math.round(krs.reduce((sum: number, kr: any) => sum + kr.progress, 0) / krs.length) : 0;
      return {
        id: o.objectiveId || o.__primaryKey,
        objective: o.name || o.__title || 'Untitled Objective',
        description: o.description || '',
        keyResults: krs,
        progress: avgProgress,
        status: o.status || 'On Track',
        timeframe: o.timeframe || '',
      };
    });

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

    let financials = (result.data || []).map((b: any) => {
      const total = b.totalAmount || 0;
      const spent = b.spentAmount || 0;
      const allocated = b.allocatedAmount || total;
      return {
        id: b.budgetId || b.__primaryKey,
        name: b.name || '',
        budgetAllocated: allocated,
        budgetSpent: spent,
        budgetRemaining: total - spent,
        totalAmount: total,
        currency: b.currency || 'USD',
        fiscalYear: b.fiscalYear || '',
        forecastAtCompletion: total,
        variance: total > 0 ? (total - spent) / total : 0,
        variancePercent: total > 0 ? Math.round(((total - spent) / total) * 100) : 0,
        utilization: total > 0 ? Math.round((spent / total) * 100) : 0,
        lastUpdated: b.createdAt || new Date().toISOString(),
      };
    });

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

    const result = await palantir.listObjects('AtlasFeature', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    let featureList = (result.data || []).map((f: any) => ({
      id: f.featureId || f.__primaryKey,
      name: f.name || '',
      description: f.description || '',
      status: f.status || 'Backlog',
      projectId: f.projectId || '',
      storyPoints: f.storyPoints || 0,
      completedPoints: f.completedPoints || 0,
      priority: f.priority || 'Medium',
      targetPi: f.targetPi || '',
      wsjfScore: f.wsjfScore || 0,
      owner: f.owner || '',
      progress: f.storyPoints > 0 ? Math.round((f.completedPoints / f.storyPoints) * 100) : 0,
    }));

    if (projectId) {
      const projectIdLower = (projectId as string).toLowerCase();
      featureList = featureList.filter((f: any) =>
        (f.projectId || '').toLowerCase() === projectIdLower
      );
    }
    if (status) {
      featureList = featureList.filter((f: any) =>
        f.status.toLowerCase() === (status as string).toLowerCase()
      );
    }

    res.json(featureList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/stories', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { featureId, projectId, status } = req.query;

    // First try to get from AtlasStory (proper object type)
    let stories: any[] = [];
    try {
      const result = await palantir.listObjects('AtlasStory', {
        pageSize: 500,
        ontologyRid: ONTOLOGY_RID,
      });
      stories = (result.data || []).map((s: any) => ({
        id: s.storyId || s.__primaryKey,
        name: s.name || '',
        description: s.description || '',
        status: s.status || 'Backlog',
        featureId: s.featureId || '',
        projectId: s.projectId || '',
        storyPoints: s.storyPoints || 0,
        priority: s.priority || 'Medium',
        assignee: s.assignee || '',
        sprint: s.sprint || '',
        teamId: s.teamId || '',
      }));
    } catch (e) {
      // Fallback to AtlasProject with naming conventions
      console.log('[PalantirOntology] AtlasStory not available, falling back to AtlasProject');
      const result = await palantir.listObjects('AtlasProject', {
        pageSize: 500,
        ontologyRid: ONTOLOGY_RID,
      });
      stories = (result.data || [])
        .filter((p: any) => {
          const name = p.name || '';
          const id = p.projectId || p.__primaryKey || '';
          return name.startsWith('[Story]') || id.startsWith('story-');
        })
        .map((s: any) => ({
          id: s.projectId || s.__primaryKey,
          name: (s.name || '').replace('[Story] ', ''),
          description: s.description || '',
          status: s.status || 'In Progress',
          featureId: '',
          projectId: s.transformationId || '',
          storyPoints: 0,
          priority: s.priority || 'Medium',
          assignee: '',
          sprint: '',
        }));
    }

    if (featureId) {
      const featureIdLower = (featureId as string).toLowerCase();
      stories = stories.filter((s: any) =>
        (s.featureId || '').toLowerCase() === featureIdLower
      );
    }
    if (projectId) {
      const projectIdLower = (projectId as string).toLowerCase();
      stories = stories.filter((s: any) =>
        (s.projectId || '').toLowerCase() === projectIdLower
      );
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

    // First try to get from AtlasTask (proper object type)
    let tasks: any[] = [];
    try {
      const result = await palantir.listObjects('AtlasTask', {
        pageSize: 500,
        ontologyRid: ONTOLOGY_RID,
      });
      tasks = (result.data || []).map((t: any) => ({
        id: t.taskId || t.__primaryKey,
        name: t.name || '',
        description: t.description || '',
        status: t.status || 'To Do',
        storyId: t.storyId || '',
        featureId: t.featureId || '',
        projectId: t.projectId || '',
        estimatedHours: t.estimatedHours || 0,
        actualHours: t.actualHours || 0,
        remainingHours: t.remainingHours || 0,
        taskType: t.taskType || '',
        priority: t.priority || 'Medium',
        assignee: t.assignee || '',
        sprint: t.sprint || '',
        teamId: t.teamId || '',
        dueDate: t.completedDate || '',
      }));
    } catch (e) {
      // Fallback to AtlasProject with naming conventions
      console.log('[PalantirOntology] AtlasTask not available, falling back to AtlasProject');
      const result = await palantir.listObjects('AtlasProject', {
        pageSize: 500,
        ontologyRid: ONTOLOGY_RID,
      });
      tasks = (result.data || [])
        .filter((p: any) => {
          const name = p.name || '';
          const id = p.projectId || p.__primaryKey || '';
          return name.startsWith('[Task]') || id.startsWith('task-');
        })
        .map((t: any) => ({
          id: t.projectId || t.__primaryKey,
          name: (t.name || '').replace('[Task] ', ''),
          description: t.description || '',
          status: t.status || 'In Progress',
          storyId: '',
          projectId: t.transformationId || '',
          estimatedHours: 0,
          actualHours: 0,
          priority: t.priority || 'Medium',
          assignee: '',
          dueDate: t.endDate || '',
        }));
    }

    if (storyId) {
      const storyIdLower = (storyId as string).toLowerCase();
      tasks = tasks.filter((t: any) =>
        (t.storyId || '').toLowerCase() === storyIdLower
      );
    }
    if (projectId) {
      const projectIdLower = (projectId as string).toLowerCase();
      tasks = tasks.filter((t: any) =>
        (t.projectId || '').toLowerCase() === projectIdLower
      );
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
        id: d.dependencyId || d.__primaryKey,
        sourceProjectId: d.sourceProjectId || '',
        targetProjectId: d.targetProjectId || '',
        type: d.dependencyType || 'blocks',
        status: d.status || 'active',
        description: d.description || '',
        dueDate: d.dueDate || '',
        createdAt: d.createdAt || '',
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
    const projectIdLower = projectId.toLowerCase();

    // Fetch project and related data
    const [project, budgetsResult, risksResult, dependenciesResult] = await Promise.all([
      palantir.getObject('AtlasProject', projectId, { ontologyRid: ONTOLOGY_RID }).catch(() => null),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasDependency', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
    ]);

    // Try to fetch from proper object types first, fallback to AtlasProject naming conventions
    let projectFeatures: any[] = [];
    let projectStories: any[] = [];
    let projectTasks: any[] = [];

    try {
      // Try AtlasFeature
      const featuresResult = await palantir.listObjects('AtlasFeature', { pageSize: 500, ontologyRid: ONTOLOGY_RID });
      projectFeatures = (featuresResult.data || [])
        .filter((f: any) => (f.projectId || '').toLowerCase() === projectIdLower)
        .map((f: any) => ({
          id: f.featureId || f.__primaryKey,
          name: f.name || 'Untitled Feature',
          description: f.description || '',
          status: f.status || 'Backlog',
          priority: f.priority || 'Medium',
          storyPoints: f.storyPoints || 0,
          completedPoints: f.completedPoints || 0,
          owner: f.owner || '',
          targetPi: f.targetPi || '',
          progress: f.storyPoints > 0 ? Math.round((f.completedPoints / f.storyPoints) * 100) : 0,
        }));
    } catch (e) {
      console.log('[PalantirOntology] AtlasFeature not available for project360');
    }

    try {
      // Try AtlasStory
      const storiesResult = await palantir.listObjects('AtlasStory', { pageSize: 500, ontologyRid: ONTOLOGY_RID });
      projectStories = (storiesResult.data || [])
        .filter((s: any) => (s.projectId || '').toLowerCase() === projectIdLower)
        .map((s: any) => ({
          id: s.storyId || s.__primaryKey,
          name: s.name || 'Untitled Story',
          description: s.description || '',
          status: s.status || 'Backlog',
          storyPoints: s.storyPoints || 0,
          priority: s.priority || 'Medium',
          assignee: s.assignee || '',
          sprint: s.sprint || '',
          featureId: s.featureId || '',
        }));
    } catch (e) {
      console.log('[PalantirOntology] AtlasStory not available for project360');
    }

    try {
      // Try AtlasTask
      const tasksResult = await palantir.listObjects('AtlasTask', { pageSize: 500, ontologyRid: ONTOLOGY_RID });
      projectTasks = (tasksResult.data || [])
        .filter((t: any) => (t.projectId || '').toLowerCase() === projectIdLower)
        .map((t: any) => ({
          id: t.taskId || t.__primaryKey,
          name: t.name || 'Untitled Task',
          description: t.description || '',
          status: t.status || 'To Do',
          priority: t.priority || 'Medium',
          assignee: t.assignee || '',
          estimatedHours: t.estimatedHours || 0,
          actualHours: t.actualHours || 0,
          storyId: t.storyId || '',
          taskType: t.taskType || '',
        }));
    } catch (e) {
      console.log('[PalantirOntology] AtlasTask not available for project360');
    }

    // Fallback to AtlasProject naming conventions if no proper objects found
    if (projectFeatures.length === 0 && projectStories.length === 0 && projectTasks.length === 0) {
      try {
        const allProjectsResult = await palantir.listObjects('AtlasProject', { pageSize: 1000, ontologyRid: ONTOLOGY_RID });
        const allProjects = allProjectsResult.data || [];

        projectFeatures = allProjects
          .filter((p: any) => {
            const name = p.name || '';
            const id = p.projectId || p.__primaryKey || '';
            const transformId = (p.transformationId || '').toLowerCase();
            return (name.startsWith('[Feature]') || id.startsWith('feature-')) && transformId === projectIdLower;
          })
          .map((f: any) => ({
            id: f.projectId || f.__primaryKey,
            name: (f.name || 'Untitled Feature').replace('[Feature] ', ''),
            description: f.description || '',
            status: f.status || 'Backlog',
            priority: f.priority || 'Medium',
            storyPoints: 0,
            completedPoints: 0,
            progress: (f.milestoneProgress || 0) * 100,
          }));

        projectStories = allProjects
          .filter((p: any) => {
            const name = p.name || '';
            const id = p.projectId || p.__primaryKey || '';
            const transformId = (p.transformationId || '').toLowerCase();
            return (name.startsWith('[Story]') || id.startsWith('story-')) && transformId === projectIdLower;
          })
          .map((s: any) => ({
            id: s.projectId || s.__primaryKey,
            name: (s.name || 'Untitled Story').replace('[Story] ', ''),
            description: s.description || '',
            status: s.status || 'Backlog',
            storyPoints: 0,
            priority: s.priority || 'Medium',
            assignee: '',
            sprint: '',
            featureId: '',
          }));

        projectTasks = allProjects
          .filter((p: any) => {
            const name = p.name || '';
            const id = p.projectId || p.__primaryKey || '';
            const transformId = (p.transformationId || '').toLowerCase();
            return (name.startsWith('[Task]') || id.startsWith('task-')) && transformId === projectIdLower;
          })
          .map((t: any) => ({
            id: t.projectId || t.__primaryKey,
            name: (t.name || 'Untitled Task').replace('[Task] ', ''),
            description: t.description || '',
            status: t.status || 'Backlog',
            priority: t.priority || 'Medium',
            assignee: '',
            estimatedHours: 0,
            actualHours: 0,
            storyId: '',
          }));
      } catch (e) {
        console.log('[PalantirOntology] Fallback to AtlasProject naming conventions failed');
      }
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const budget = (budgetsResult.data || []).find((b: any) => (b.budgetId || b.__primaryKey) === project.budgetId);
    const budgetTotal = budget ? (budget.totalAmount || 0) : 0;
    const budgetSpent = budget ? (budget.spentAmount || 0) : 0;
    const progress = (project.milestoneProgress || 0) * 100;

    const projectRisks = (risksResult.data || []).filter((r: any) =>
      (r.projectId || '').toLowerCase() === projectIdLower
    );
    const projectDeps = (dependenciesResult.data || []).filter((d: any) =>
      (d.sourceProjectId || '').toLowerCase() === projectIdLower ||
      (d.targetProjectId || '').toLowerCase() === projectIdLower
    );

    res.json({
      id: project.projectId || project.__primaryKey,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      status: mapStatusToColor(project.status || ''),
      statusText: project.status || 'Unknown',
      priority: mapPriorityToLevel(project.priority || 'medium'),
      priorityText: project.priority || 'Medium',
      startDate: project.startDate,
      endDate: project.endDate,
      businessUnit: 'General',
      artName: '',
      portfolioTheme: '',
      budgetTotal,
      budgetSpent,
      budgetUnit: budget?.currency || 'USD',
      budgetRemaining: budgetTotal - budgetSpent,
      budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
      budgetName: budget?.name || '',
      expectedRoi: '',
      roiValue: 0,
      progress,
      milestoneProgress: progress,
      cpiValue: 1,
      spiValue: 1,
      earnedValue: 0,
      plannedValue: 0,
      safeStage: '',
      currentPi: '',
      velocity: 0,
      predictability: 0,
      flowEfficiency: 0,
      epicId: '',
      epicName: '',
      epicProgress: '',
      okrObjective: '',
      okrKeyResult: '',
      okrProgress: 0,
      aiRecommendation: '',
      timelineElapsed: 0,
      timelineTotal: 0,
      transformationId: project.transformationId || '',
      featureCount: projectFeatures.length,
      storyCount: projectStories.length,
      taskCount: projectTasks.length,
      riskCount: projectRisks.length,
      dependencyCount: projectDeps.length,
      features: projectFeatures,
      stories: projectStories,
      tasks: projectTasks,
      risks: projectRisks.map((r: any) => ({
        id: r.riskId || r.__primaryKey,
        name: r.description || r.__title || 'Risk',
        description: r.description || '',
        severity: (r.impact || 'medium').toLowerCase(),
        status: (r.status || 'open').toLowerCase(),
        likelihood: r.probability || 'medium',
        riskScore: r.riskScore || 0,
        mitigationPlan: r.mitigationPlan || '',
        owner: r.owner || '',
      })),
      dependencies: projectDeps.map((d: any) => ({
        id: d.dependencyId || d.__primaryKey,
        sourceProjectId: d.sourceProjectId || '',
        targetProjectId: d.targetProjectId || '',
        type: d.dependencyType || 'blocks',
        status: d.status || 'active',
        description: d.description || '',
      })),
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
