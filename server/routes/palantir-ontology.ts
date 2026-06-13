/**
 * ONTOLOGY API ROUTES (served at /api/palantir/ontology/* — URL kept for the
 * 59-page Kyndral UI; the backend is FalkorDB, NOT Palantir Foundry).
 *
 * All reads of ontology objects (AtlasProject, AtlasBudget, AtlasRisk,
 * AtlasObjective, AtlasKeyResult, AtlasDependency, …) come from the FalkorDB
 * graph via FalkorOntologyDataProvider. These routes map to the
 * usePalantirOntology.ts hooks on the frontend.
 */

import express, { type RequestHandler } from 'express';
import { getOntologyProvider } from '../FalkorOntologyDataProvider.js';

const router = express.Router();

// Retained only so existing call sites that pass `{ ontologyRid: ONTOLOGY_RID }`
// still resolve; the FalkorDB shim ignores it (no Foundry ontology RID exists).
const ONTOLOGY_RID = '';

// The Atlas object types the UI reads (FalkorDB has no schema registry, so the
// /schema endpoint reports this fixed set rather than a Foundry ontology RID).
const ATLAS_OBJECT_TYPES = [
  'AtlasProject', 'AtlasBudget', 'AtlasRisk', 'AtlasObjective', 'AtlasKeyResult',
  'AtlasDependency', 'AtlasKpi', 'AtlasTransformation', 'AtlasFeature', 'AtlasMilestone',
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Thin read-shim that preserves the small surface the route used from the old
 * Palantir AIP client (listObjects/getObject/listObjectTypes) but is backed by
 * FalkorDB. Returns 503 (same graceful-degradation contract as before) when the
 * graph isn't configured.
 */
interface OntologyReadShim {
  listObjects(type: string, opts?: { pageSize?: number }): Promise<{ data: Array<Record<string, any>> }>;
  getObject(type: string, id: string, opts?: unknown): Promise<Record<string, any> | null>;
  listObjectTypes(rid?: string): Promise<Array<{ apiName: string }>>;
}

function getPalantirOrFail(res: express.Response): OntologyReadShim | null {
  if (!process.env.FALKORDB_HOST && !process.env.FALKORDB_URL) {
    console.error('[Ontology] FalkorDB not configured - set FALKORDB_HOST/FALKORDB_PORT/FALKORDB_GRAPH');
    res.status(503).json({ error: 'Ontology graph (FalkorDB) not configured' });
    return null;
  }
  const provider = getOntologyProvider();
  return {
    async listObjects(type, opts) {
      const data = await provider.getObjects(type, undefined, opts?.pageSize ?? 500);
      return { data: data as Array<Record<string, any>> };
    },
    async getObject(type, id) {
      return (await provider.getObject(type, id)) as Record<string, any> | null;
    },
    async listObjectTypes() {
      return ATLAS_OBJECT_TYPES.map((apiName) => ({ apiName }));
    },
  };
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

    const [projectsResult, budgetsResult, risksResult, okrsResult, keyResultsResult] = await Promise.all([
      palantir.listObjects('AtlasProject', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasObjective', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasKeyResult', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
    ]);

    // Work items are stored as AtlasProject objects with name prefixes
    const allProjectData = projectsResult.data || [];
    const featuresResult = { data: allProjectData.filter((p: any) => (p.name || '').startsWith('[Feature]')) };
    const storiesResult = { data: allProjectData.filter((p: any) => (p.name || '').startsWith('[Story]')) };
    const tasksResult = { data: allProjectData.filter((p: any) => (p.name || '').startsWith('[Task]')) };

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

// Helper: parse key-value pairs from description text
function parseWorkItemDescription(desc: string): Record<string, string> {
  const lines: Record<string, string> = {};
  (desc || '').split('\n').forEach((line: string) => {
    const match = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
    if (match) lines[match[1].trim().toLowerCase()] = match[2].trim();
  });
  return lines;
}

router.get('/features', (async (req, res) => {
  try {
    const palantir = getPalantirOrFail(res);
    if (!palantir) return;

    const { projectId, status } = req.query;

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    let featureList = (result.data || [])
      .filter((f: any) => (f.name || '').startsWith('[Feature]'))
      .map((f: any) => {
        const desc = parseWorkItemDescription(f.description || '');
        return {
          id: f.__primaryKey || f.projectId,
          name: (f.name || '').replace('[Feature] ', ''),
          description: (f.description || '').split('\n\n')[0] || '',
          status: f.status || desc['status'] || 'Backlog',
          projectId: f.transformationId || '',
          storyPoints: parseInt(desc['points'] || desc['story points'] || '0') || 0,
          completedPoints: 0,
          priority: f.priority || desc['priority'] || 'Medium',
          targetPi: desc['pi'] || '',
          wsjfScore: parseInt(desc['wsjf'] || '0') || 0,
          owner: desc['owner'] || '',
          progress: (f.milestoneProgress || 0) * 100,
        };
      });

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

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    let stories = (result.data || [])
      .filter((s: any) => (s.name || '').startsWith('[Story]'))
      .map((s: any) => {
        const desc = parseWorkItemDescription(s.description || '');
        return {
          id: s.__primaryKey || s.projectId,
          name: (s.name || '').replace('[Story] ', ''),
          description: (s.description || '').split('\n\n')[0] || '',
          status: s.status || desc['status'] || 'Backlog',
          featureId: desc['feature'] || '',
          projectId: s.transformationId || '',
          storyPoints: parseInt(desc['points'] || desc['story points'] || '0') || 0,
          priority: s.priority || desc['priority'] || 'Medium',
          assignee: desc['assignee'] || desc['team'] || '',
          sprint: desc['sprint'] || '',
          teamId: desc['team'] || '',
        };
      });

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

    const result = await palantir.listObjects('AtlasProject', {
      pageSize: 500,
      ontologyRid: ONTOLOGY_RID,
    });

    let tasks = (result.data || [])
      .filter((t: any) => (t.name || '').startsWith('[Task]'))
      .map((t: any) => {
        const desc = parseWorkItemDescription(t.description || '');
        return {
          id: t.__primaryKey || t.projectId,
          name: (t.name || '').replace('[Task] ', ''),
          description: (t.description || '').split('\n\n')[0] || '',
          status: t.status || desc['status'] || 'To Do',
          storyId: desc['story'] || '',
          featureId: desc['feature'] || '',
          projectId: t.transformationId || '',
          estimatedHours: parseFloat(desc['effort']?.replace('h', '') || '0') || 0,
          actualHours: 0,
          remainingHours: 0,
          taskType: desc['skills'] || '',
          priority: t.priority || desc['priority'] || 'Medium',
          assignee: desc['assignee'] || '',
          sprint: desc['sprint'] || '',
          teamId: desc['team'] || '',
          dueDate: '',
        };
      });

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

    // Fetch project and all related data
    // NOTE: AtlasFeature/AtlasStory/AtlasTask don't exist as separate object types in Palantir.
    // Work items are stored as AtlasProject objects with name prefixes [Feature], [Story], [Task]
    // and linked to parent projects via transformationId.
    const [project, allProjectObjects, budgetsResult, risksResult, dependenciesResult] = await Promise.all([
      palantir.getObject('AtlasProject', projectId, { ontologyRid: ONTOLOGY_RID }).catch(() => null),
      palantir.listObjects('AtlasProject', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasDependency', { pageSize: 500, ontologyRid: ONTOLOGY_RID }).catch(() => ({ data: [] })),
    ]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Work items reference parent projects via transformationId using prj-XXX format.
    // But projects may have different primary keys (PRJ-XXX). We need to find ALL
    // project IDs (primary keys) that share the same name as this project,
    // so we can match work items that reference any of those IDs.
    const allObjects = allProjectObjects.data || [];
    const projectName = (project.name || '').toLowerCase().trim();
    const matchingProjectIds = new Set<string>();
    matchingProjectIds.add((project.__primaryKey || '').toLowerCase());
    matchingProjectIds.add((project.projectId || '').toLowerCase());
    if (project.transformationId) matchingProjectIds.add(project.transformationId.toLowerCase());

    for (const obj of allObjects) {
      const objName = (obj.name || '').toLowerCase().trim();
      if (objName === projectName && !objName.startsWith('[')) {
        matchingProjectIds.add((obj.__primaryKey || '').toLowerCase());
        if (obj.projectId) matchingProjectIds.add(obj.projectId.toLowerCase());
        if (obj.transformationId) matchingProjectIds.add(obj.transformationId.toLowerCase());
      }
    }
    matchingProjectIds.delete('');

    const parseDescription = (desc: string) => {
      const lines: Record<string, string> = {};
      (desc || '').split('\n').forEach((line: string) => {
        const match = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
        if (match) lines[match[1].trim().toLowerCase()] = match[2].trim();
      });
      return lines;
    };

    const projectFeatures = allObjects
      .filter((f: any) => {
        const name = f.name || '';
        const tid = (f.transformationId || '').toLowerCase();
        return name.startsWith('[Feature]') && matchingProjectIds.has(tid);
      })
      .map((f: any) => {
        const desc = parseDescription(f.description || '');
        return {
          id: f.__primaryKey || f.projectId,
          name: (f.name || '').replace('[Feature] ', ''),
          description: (f.description || '').split('\n\n')[0] || '',
          status: f.status || desc['status'] || 'Backlog',
          priority: f.priority || desc['priority'] || 'Medium',
          storyPoints: parseInt(desc['points'] || desc['story points'] || '0') || 0,
          completedPoints: 0,
          owner: desc['owner'] || '',
          targetPi: desc['pi'] || '',
          wsjf: parseInt(desc['wsjf'] || '0') || 0,
          progress: (f.milestoneProgress || 0) * 100,
        };
      });

    const projectStories = allObjects
      .filter((s: any) => {
        const name = s.name || '';
        const tid = (s.transformationId || '').toLowerCase();
        return name.startsWith('[Story]') && matchingProjectIds.has(tid);
      })
      .map((s: any) => {
        const desc = parseDescription(s.description || '');
        return {
          id: s.__primaryKey || s.projectId,
          name: (s.name || '').replace('[Story] ', ''),
          description: (s.description || '').split('\n\n')[0] || '',
          status: s.status || desc['status'] || 'Backlog',
          storyPoints: parseInt(desc['points'] || desc['story points'] || '0') || 0,
          priority: s.priority || desc['priority'] || 'Medium',
          assignee: desc['assignee'] || desc['team'] || '',
          sprint: desc['sprint'] || '',
          featureId: desc['feature'] || '',
        };
      });

    const projectTasks = allObjects
      .filter((t: any) => {
        const name = t.name || '';
        const tid = (t.transformationId || '').toLowerCase();
        return name.startsWith('[Task]') && matchingProjectIds.has(tid);
      })
      .map((t: any) => {
        const desc = parseDescription(t.description || '');
        return {
          id: t.__primaryKey || t.projectId,
          name: (t.name || '').replace('[Task] ', ''),
          description: (t.description || '').split('\n\n')[0] || '',
          status: t.status || desc['status'] || 'To Do',
          priority: t.priority || desc['priority'] || 'Medium',
          assignee: desc['assignee'] || '',
          estimatedHours: parseFloat(desc['effort']?.replace('h', '') || '0') || 0,
          actualHours: 0,
          storyId: desc['story'] || '',
          taskType: desc['skills'] || '',
        };
      });

    const budget = (budgetsResult.data || []).find((b: any) => (b.budgetId || b.__primaryKey) === project.budgetId);
    const budgetTotal = budget ? (budget.totalAmount || 0) : 0;
    const budgetSpent = budget ? (budget.spentAmount || 0) : 0;
    const progress = (project.milestoneProgress || 0) * 100;

    const projectRisks = (risksResult.data || []).filter((r: any) =>
      matchingProjectIds.has((r.projectId || '').toLowerCase())
    );
    const projectDeps = (dependenciesResult.data || []).filter((d: any) =>
      matchingProjectIds.has((d.sourceProjectId || '').toLowerCase()) ||
      matchingProjectIds.has((d.targetProjectId || '').toLowerCase())
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
