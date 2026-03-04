import express, { type RequestHandler } from 'express';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_OBJECT_TYPES, PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

const router = express.Router();

router.get('/status', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      return res.json({
        configured: false,
        connected: false,
        message: 'Palantir AIP not configured. Set PALANTIR_HOSTNAME and PALANTIR_TOKEN.',
      });
    }

    const result = await palantir.testConnection();
    res.json({ configured: true, ...result });
  } catch (error: any) {
    res.status(500).json({ configured: true, connected: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const ontologies = await palantir.listOntologies();
    res.json({ success: true, ontologies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/object-types', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const objectTypes = await palantir.listObjectTypes(req.params.rid);
    res.json({ success: true, objectTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/object-types/:objectType', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const objectType = await palantir.getObjectType(req.params.objectType, req.params.rid);
    res.json({ success: true, objectType });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/objects/:objectType', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const { objectType, rid } = req.params;
    const result = await palantir.listObjects(objectType, {
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      pageToken: req.query.pageToken as string,
      select: req.query.select ? (req.query.select as string).split(',') : undefined,
      ontologyRid: rid,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/objects/:objectType/:primaryKey', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const obj = await palantir.getObject(req.params.objectType, req.params.primaryKey, {
      ontologyRid: req.params.rid,
    });
    res.json({ success: true, object: obj });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/ontologies/:rid/objects/:objectType/search', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const { objectType, rid } = req.params;
    const { where, pageSize, pageToken, orderBy, select } = req.body;

    if (!where) {
      return res.status(400).json({ error: 'Search filter (where) is required' });
    }

    const result = await palantir.searchObjects(objectType, where, {
      pageSize,
      pageToken,
      orderBy,
      select,
      ontologyRid: rid,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/ontologies/:rid/actions/:actionApiName/apply', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const result = await palantir.applyAction(
      req.params.actionApiName,
      req.body.parameters || {},
      req.params.rid,
    );
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/ontologies/:rid/queries/:queryApiName/execute', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const result = await palantir.executeQuery(
      req.params.queryApiName,
      req.body.parameters || {},
      req.params.rid,
    );
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/metadata', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const metadata = await palantir.getOntologyFullMetadata(req.params.rid);
    res.json({ success: true, metadata });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/project-summary/:projectId', (async (req, res) => {
  try {
    const { getPalantirDataProvider } = await import('../mcp/PalantirDataProvider.js');
    const provider = getPalantirDataProvider();
    if (!provider.isAvailable()) {
      return res.status(503).json({ error: 'Palantir AIP not configured' });
    }
    const summary = await provider.getSummaryForProject(req.params.projectId);
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/agent-data/:agentId', (async (req, res) => {
  try {
    const { getPalantirDataProvider } = await import('../mcp/PalantirDataProvider.js');
    const provider = getPalantirDataProvider();
    if (!provider.isAvailable()) {
      return res.status(503).json({ error: 'Palantir AIP not configured' });
    }
    const projectId = req.query.projectId as string | undefined;
    const data = await provider.fetchForAgent(req.params.agentId, projectId);
    const totalObjects = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
    res.json({
      success: true,
      agentId: req.params.agentId,
      objectTypes: Object.keys(data),
      totalObjects,
      data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/cache-stats', (async (_req, res) => {
  try {
    const { getPalantirDataProvider } = await import('../mcp/PalantirDataProvider.js');
    const provider = getPalantirDataProvider();
    res.json({ success: true, available: provider.isAvailable(), ...provider.getCacheStats() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/cache/clear', (async (_req, res) => {
  try {
    const { getPalantirDataProvider } = await import('../mcp/PalantirDataProvider.js');
    const provider = getPalantirDataProvider();
    provider.clearCache();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

/**
 * POST /api/palantir/sync/full
 *
 * Manually trigger a full sync of PostgreSQL data to Palantir Foundry.
 * This creates:
 * - Master transformation structure
 * - Projects, features, risks from database
 * - Business rules (companyRules)
 * - Project dependencies
 * - Integration source projects for data lineage
 * - Default KPIs for integration health
 *
 * Use this endpoint when you want to initialize or reset Palantir data.
 */
router.post('/sync/full', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      return res.status(503).json({
        success: false,
        error: 'Palantir AIP not configured. Set PALANTIR_HOSTNAME and PALANTIR_TOKEN.',
      });
    }

    console.log('[Palantir Sync] Starting full sync...');

    const { seedPalantirDefaults } = await import('../scripts/seed-palantir-defaults.js');
    const result = await seedPalantirDefaults();

    res.json({
      success: result.success,
      message: result.success
        ? 'Full sync completed successfully'
        : 'Sync completed with errors',
      ...result,
    });
  } catch (error: any) {
    console.error('[Palantir Sync] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

/**
 * POST /api/palantir/sync/lineage
 *
 * Sync only the data lineage structure (integration sources + dependencies).
 * Lighter operation that just creates the lineage visualization structure.
 */
router.post('/sync/lineage', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      return res.status(503).json({
        success: false,
        error: 'Palantir AIP not configured',
      });
    }

    console.log('[Palantir Sync] Creating data lineage structure...');

    let created = 0;
    let skipped = 0;

    // Create integration source projects
    const sources = [
      { id: 'source-jira', name: '[Integration] Jira' },
      { id: 'source-openproject', name: '[Integration] OpenProject' },
      { id: 'source-monday', name: '[Integration] Monday.com' },
      { id: 'source-postgres', name: '[Integration] PostgreSQL' },
    ];

    for (const src of sources) {
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          project_id: src.id,
          name: src.name,
          status: 'Active',
          transformation_id: 'atlas-master-transformation',
        });
        created++;
      } catch (e: any) {
        if (e.message?.includes('already exists')) skipped++;
      }
    }

    // Create lineage dependencies
    const deps = [
      { id: 'lineage-jira-postgres', source: 'source-jira', target: 'source-postgres' },
      { id: 'lineage-openproject-postgres', source: 'source-openproject', target: 'source-postgres' },
      { id: 'lineage-monday-postgres', source: 'source-monday', target: 'source-postgres' },
    ];

    for (const dep of deps) {
      try {
        await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
          dependency_id: dep.id,
          source_project_id: dep.source,
          target_project_id: dep.target,
          dependency_type: 'data-sync',
          status: 'Active',
        });
        created++;
      } catch (e: any) {
        if (e.message?.includes('already exists')) skipped++;
      }
    }

    res.json({
      success: true,
      message: 'Data lineage structure created',
      created,
      skipped,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

/**
 * GET /api/palantir/sync/status
 *
 * Check the current sync status - what's in Palantir vs what's in PostgreSQL.
 */
router.get('/sync/status', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      return res.status(503).json({
        success: false,
        palantirConfigured: false,
        error: 'Palantir AIP not configured',
      });
    }

    // Count objects in Palantir
    const [projectsResult, insightsResult, risksResult, kpisResult, okrsResult] = await Promise.all([
      palantir.listObjects(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 1 }),
      palantir.listObjects(PALANTIR_OBJECT_TYPES.INTERVENTION, { pageSize: 1 }),
      palantir.listObjects(PALANTIR_OBJECT_TYPES.RISK, { pageSize: 1 }),
      palantir.listObjects(PALANTIR_OBJECT_TYPES.KPI, { pageSize: 1 }).catch(() => ({ totalCount: 0 })),
      palantir.listObjects(PALANTIR_OBJECT_TYPES.OKR, { pageSize: 1 }).catch(() => ({ totalCount: 0 })),
    ]);

    res.json({
      success: true,
      palantirConfigured: true,
      palantirObjects: {
        projects: projectsResult.totalCount || 0,
        insights: insightsResult.totalCount || 0,
        risks: risksResult.totalCount || 0,
        kpis: kpisResult.totalCount || 0,
        okrs: okrsResult.totalCount || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

export function registerPalantirRoutes(app: express.Application): void {
  app.use('/api/palantir', router);
}

export default router;
