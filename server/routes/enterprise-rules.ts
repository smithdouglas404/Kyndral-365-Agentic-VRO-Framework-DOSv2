/**
 * ENTERPRISE RULES ENGINE API ROUTES
 *
 * Exposes the unified Rulebricks + Palantir rules pipeline.
 * All rule evaluation flows through here.
 */

import express, { type RequestHandler } from 'express';
import { getEnterpriseRulesEngine } from '../services/EnterpriseRulesEngine.js';
import { getRulebricksService } from '../services/RulebricksService.js';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

const router = express.Router();

router.get('/status', (async (_req, res) => {
  const engine = getEnterpriseRulesEngine();
  if (!engine) {
    return res.status(503).json({ error: 'Rules engine not initialized' });
  }
  res.json(engine.getStatus());
}) as RequestHandler);

router.get('/rules', (async (_req, res) => {
  const rb = getRulebricksService();
  if (!rb) {
    return res.status(503).json({ error: 'Rulebricks service not initialized' });
  }
  res.json({
    rules: rb.getEnterpriseRules(),
    totalRules: rb.getEnterpriseRules().length,
    source: rb.isAvailable() ? 'rulebricks' : 'local-fallback',
  });
}) as RequestHandler);

router.get('/rules/agent/:agentType', (async (req, res) => {
  const rb = getRulebricksService();
  if (!rb) {
    return res.status(503).json({ error: 'Rulebricks service not initialized' });
  }
  const rules = rb.getRulesForAgent(req.params.agentType);
  res.json({ agentType: req.params.agentType, rules, count: rules.length });
}) as RequestHandler);

router.post('/evaluate/project/:projectId', (async (req, res) => {
  const engine = getEnterpriseRulesEngine();
  if (!engine) {
    return res.status(503).json({ error: 'Rules engine not initialized' });
  }

  const { projectId } = req.params;
  const { executeActions = false, agentFilter } = req.body;

  if (executeActions && !req.headers['x-admin-token']) {
    return res.status(403).json({ error: 'executeActions requires admin authorization' });
  }

  const palantir = getPalantirService();
  let projectData: Record<string, any> = req.body.data || {};

  if (palantir && Object.keys(projectData).length === 0) {
    try {
      const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID || '';
      const [project, budgets, risks] = await Promise.all([
        palantir.getObject('AtlasProject', projectId, { ontologyRid }).catch(() => null),
        palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid }).catch(() => ({ data: [] })),
        palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid }).catch(() => ({ data: [] })),
      ]);

      if (project) {
        const budget = (budgets.data || []).find((b: any) => (b.budgetId || b.__primaryKey) === project.budgetId);
        const projectRisks = (risks.data || []).filter((r: any) => r.projectId === projectId);
        const budgetTotal = budget?.totalAmount || 0;
        const budgetSpent = budget?.spentAmount || 0;

        projectData = {
          projectId,
          budgetId: project.budgetId,
          budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
          burnRatePercent: 100,
          healthScore: (project.milestoneProgress || 0) * 100,
          riskScore: projectRisks.length > 0 ? Math.max(...projectRisks.map((r: any) => r.riskScore || 0)) : 0,
          complianceScore: 85,
          readinessScore: 70,
          adoptionRate: 60,
          spiValue: 1.0,
          varianceDays: 0,
          overdueDays: 0,
          violationCount: 0,
          blockedCount: 0,
          valueGapPercent: 0,
          roiValue: 1.5,
          utilizationPercent: 80,
          driftPercent: 0,
        };
      }
    } catch (error: any) {
      console.warn(`[EnterpriseRules] Failed to fetch project data: ${error.message}`);
    }
  }

  const evaluations = await engine.evaluateProjectRules(projectId, projectData, {
    executeActions,
    agentFilter,
  });

  const triggered = evaluations.filter(e => e.triggered);

  res.json({
    projectId,
    totalEvaluated: evaluations.length,
    totalTriggered: triggered.length,
    triggered,
    all: evaluations,
    dataSource: Object.keys(req.body.data || {}).length > 0 ? 'provided' : 'palantir',
  });
}) as RequestHandler);

router.post('/evaluate/portfolio', (async (req, res) => {
  const engine = getEnterpriseRulesEngine();
  if (!engine) {
    return res.status(503).json({ error: 'Rules engine not initialized' });
  }

  const { executeActions = false } = req.body;

  if (executeActions && !req.headers['x-admin-token']) {
    return res.status(403).json({ error: 'executeActions requires admin authorization' });
  }

  const palantir = getPalantirService();
  if (!palantir) {
    return res.status(503).json({ error: 'Palantir not available for portfolio scan' });
  }

  try {
    const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID || '';
    const [projectsResult, budgetsResult, risksResult] = await Promise.all([
      palantir.listObjects('AtlasProject', { pageSize: 500, ontologyRid }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasBudget', { pageSize: 100, ontologyRid }).catch(() => ({ data: [] })),
      palantir.listObjects('AtlasRisk', { pageSize: 500, ontologyRid }).catch(() => ({ data: [] })),
    ]);

    const budgetMap = new Map<string, any>();
    for (const b of (budgetsResult.data || [])) {
      budgetMap.set(b.budgetId || b.__primaryKey, b);
    }

    const safeExcludePrefixes = ['[Feature]', '[Story]', '[Task]', '[Agent]', '[Integration]', '[Division]', '[Monday]', '[Jira'];
    const safeExcludeIdPrefixes = ['feature-', 'story-', 'task-', 'agent-', 'source-', 'div-', 'monday-', 'story-test-', 'test-div-'];

    const projects = (projectsResult.data || [])
      .filter((p: any) => {
        const name = p.name || '';
        const id = p.projectId || p.__primaryKey || '';
        return !safeExcludePrefixes.some(prefix => name.startsWith(prefix)) &&
               !safeExcludeIdPrefixes.some(prefix => id.startsWith(prefix));
      })
      .map((p: any) => {
        const id = p.projectId || p.__primaryKey;
        const budget = budgetMap.get(p.budgetId);
        const budgetTotal = budget?.totalAmount || 0;
        const budgetSpent = budget?.spentAmount || 0;
        const projectRisks = (risksResult.data || []).filter((r: any) => r.projectId === id);

        return {
          projectId: id,
          data: {
            projectId: id,
            budgetId: p.budgetId,
            budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
            burnRatePercent: 100,
            healthScore: (p.milestoneProgress || 0) * 100,
            riskScore: projectRisks.length > 0 ? Math.max(...projectRisks.map((r: any) => r.riskScore || 0)) : 0,
            complianceScore: 85,
            readinessScore: 70,
            adoptionRate: 60,
            spiValue: 1.0,
            varianceDays: 0,
            overdueDays: 0,
            violationCount: 0,
            blockedCount: 0,
            valueGapPercent: 0,
            roiValue: 1.5,
            utilizationPercent: 80,
            driftPercent: 0,
          },
        };
      });

    const report = await engine.evaluatePortfolioRules(projects, { executeActions });

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.post('/evaluate/threshold', (async (req, res) => {
  const engine = getEnterpriseRulesEngine();
  if (!engine) {
    return res.status(503).json({ error: 'Rules engine not initialized' });
  }

  const { agentType, thresholdType, currentValue, context } = req.body;

  if (!agentType || !thresholdType || currentValue === undefined) {
    return res.status(400).json({ error: 'agentType, thresholdType, and currentValue are required' });
  }

  const result = await engine.evaluateSingleThreshold(agentType, thresholdType, currentValue, context);
  res.json(result);
}) as RequestHandler);

router.get('/palantir-actions', (async (_req, res) => {
  const palantir = getPalantirService();
  if (!palantir) {
    return res.status(503).json({ error: 'Palantir not available' });
  }

  try {
    const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID || '';
    const actionTypes = await palantir.listActionTypes(ontologyRid);
    res.json({
      actionTypes: (actionTypes || []).map((a: any) => ({
        apiName: a.apiName,
        description: a.description || '',
        status: a.status || 'ACTIVE',
      })),
      totalActions: (actionTypes || []).length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

export default router;
