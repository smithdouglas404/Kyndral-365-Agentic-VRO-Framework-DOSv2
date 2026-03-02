/**
 * PALANTIR SYNC API ROUTES
 *
 * Endpoints for syncing external systems (Jira, OpenProject, Monday) TO Palantir.
 * And for fetching data FROM the Palantir ontology.
 */

import { Router, Request, Response } from 'express';
import { PalantirSyncService, SyncResult } from '../services/PalantirSyncService.js';
import { OntologyDataProvider } from '../services/OntologyDataProvider.js';
import { OntologySchemaService } from '../services/OntologySchemaService.js';
import { getPalantirSyncScheduler } from '../services/PalantirSyncScheduler.js';
import { getPostgresToPalantirSync } from '../services/PostgresToPalantirSync.js';
import { getPostgresToExternalSync } from '../services/PostgresToExternalSync.js';
import { seedAgentAttributes } from '../scripts/seed-agent-attributes.js';
import { seedWidgetDefinitions } from '../scripts/seed-widget-definitions.js';
import { seedAll } from '../scripts/seed-all.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

const router = Router();

// =====================
// SYNC OPERATIONS
// =====================

/**
 * POST /api/palantir/sync/jira
 * Sync Jira data TO Palantir
 */
router.post('/sync/jira', async (req: Request, res: Response) => {
  try {
    const { baseUrl, email, apiToken, projectKey, jql } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({
        error: 'Missing required fields: baseUrl, email, apiToken',
      });
    }

    if (PalantirSyncService.isSyncing('jira')) {
      return res.status(409).json({
        error: 'Jira sync already in progress',
      });
    }

    const result = await PalantirSyncService.syncFromJira({
      baseUrl,
      email,
      apiToken,
      projectKey,
      jql,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[API] Jira sync failed:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/palantir/sync/openproject
 * Sync OpenProject data TO Palantir
 */
router.post('/sync/openproject', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken, projectId } = req.body;

    if (!baseUrl || !apiToken) {
      return res.status(400).json({
        error: 'Missing required fields: baseUrl, apiToken',
      });
    }

    if (PalantirSyncService.isSyncing('openproject')) {
      return res.status(409).json({
        error: 'OpenProject sync already in progress',
      });
    }

    const result = await PalantirSyncService.syncFromOpenProject({
      baseUrl,
      apiToken,
      projectId,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[API] OpenProject sync failed:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/palantir/sync/monday
 * Sync Monday.com data TO Palantir
 */
router.post('/sync/monday', async (req: Request, res: Response) => {
  try {
    const { apiToken, boardId } = req.body;

    if (!apiToken || !boardId) {
      return res.status(400).json({
        error: 'Missing required fields: apiToken, boardId',
      });
    }

    if (PalantirSyncService.isSyncing('monday')) {
      return res.status(409).json({
        error: 'Monday.com sync already in progress',
      });
    }

    const result = await PalantirSyncService.syncFromMonday({
      apiToken,
      boardId,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[API] Monday sync failed:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/palantir/sync/all
 * Sync all configured integrations TO Palantir
 */
router.post('/sync/all', async (req: Request, res: Response) => {
  try {
    const results = await PalantirSyncService.syncAllIntegrations();

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.failed === 0).length,
        failed: results.filter(r => r.failed > 0).length,
      },
    });
  } catch (error: any) {
    console.error('[API] Sync all failed:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/palantir/sync/status
 * Get current sync status
 */
router.get('/sync/status', async (req: Request, res: Response) => {
  res.json({
    syncing: {
      jira: PalantirSyncService.isSyncing('jira'),
      openproject: PalantirSyncService.isSyncing('openproject'),
      monday: PalantirSyncService.isSyncing('monday'),
    },
  });
});

// =====================
// ONTOLOGY DATA ACCESS
// =====================

/**
 * GET /api/palantir/ontology/schema
 * Get full ontology schema
 */
router.get('/ontology/schema', async (req: Request, res: Response) => {
  try {
    const schema = await OntologySchemaService.getSchema();

    res.json({
      ontologyRid: schema.ontologyRid,
      version: schema.version,
      lastUpdated: schema.lastUpdated,
      objectTypes: Array.from(schema.objectTypes.values()),
      agentMappings: Object.fromEntries(schema.agentMappings),
    });
  } catch (error: any) {
    console.error('[API] Schema fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/objects/:objectType
 * Query objects of a specific type
 */
router.get('/ontology/objects/:objectType', async (req: Request, res: Response) => {
  try {
    const { objectType } = req.params;
    const { pageSize, pageToken, agentId, projectId, filters } = req.query;

    const result = await OntologyDataProvider.query(objectType, {
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      pageToken: pageToken as string,
      agentId: agentId as string,
      projectId: projectId as string,
      filters: filters ? JSON.parse(filters as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error(`[API] Query ${req.params.objectType} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/objects/:objectType/:id
 * Get a specific object by ID
 */
router.get('/ontology/objects/:objectType/:id', async (req: Request, res: Response) => {
  try {
    const { objectType, id } = req.params;
    const result = await OntologyDataProvider.getById(objectType, id);

    if (!result) {
      return res.status(404).json({ error: 'Object not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error(`[API] GetById ${req.params.objectType}/${req.params.id} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/agent/:agentId
 * Get all data for a specific agent
 */
router.get('/ontology/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { projectId } = req.query;

    const results = await OntologyDataProvider.getAgentData(agentId, {
      projectId: projectId as string,
    });

    // Convert Map to object for JSON response
    const data: Record<string, any> = {};
    results.forEach((value, key) => {
      data[key] = value;
    });

    res.json({
      agentId,
      objectTypes: Object.keys(data),
      data,
    });
  } catch (error: any) {
    console.error(`[API] Agent data ${req.params.agentId} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/metrics
 * Get aggregated dashboard metrics
 */
router.get('/ontology/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await OntologyDataProvider.getDashboardMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('[API] Metrics fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// CONVENIENCE ENDPOINTS
// =====================

/**
 * GET /api/palantir/projects
 * Get projects from ontology
 */
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const { pageSize, pageToken, status, source } = req.query;

    const filters = [];
    if (status) filters.push({ field: 'status', operator: 'eq' as const, value: status });
    if (source) filters.push({ field: 'source', operator: 'eq' as const, value: source });

    const result = await OntologyDataProvider.getProjects({
      pageSize: pageSize ? parseInt(pageSize as string) : 50,
      pageToken: pageToken as string,
      filters: filters.length > 0 ? filters : undefined,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/risks
 * Get risks from ontology
 */
router.get('/risks', async (req: Request, res: Response) => {
  try {
    const { pageSize, severity, projectId } = req.query;

    const filters = [];
    if (severity) filters.push({ field: 'severity', operator: 'eq' as const, value: severity });
    if (projectId) filters.push({ field: 'projectId', operator: 'eq' as const, value: projectId });

    const result = await OntologyDataProvider.getRisks({
      pageSize: pageSize ? parseInt(pageSize as string) : 50,
      filters: filters.length > 0 ? filters : undefined,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/budgets
 * Get financial data from ontology
 */
router.get('/budgets', async (req: Request, res: Response) => {
  try {
    const { pageSize, projectId } = req.query;

    const filters = [];
    if (projectId) filters.push({ field: 'projectId', operator: 'eq' as const, value: projectId });

    const result = await OntologyDataProvider.getBudgets({
      pageSize: pageSize ? parseInt(pageSize as string) : 50,
      filters: filters.length > 0 ? filters : undefined,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/okrs
 * Get OKRs from ontology
 */
router.get('/okrs', async (req: Request, res: Response) => {
  try {
    const { pageSize } = req.query;

    const result = await OntologyDataProvider.getOKRs({
      pageSize: pageSize ? parseInt(pageSize as string) : 50,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/cache/invalidate
 * Invalidate cache
 */
router.post('/cache/invalidate', async (req: Request, res: Response) => {
  try {
    const { pattern } = req.body;
    OntologyDataProvider.invalidateCache(pattern);
    res.json({ success: true, pattern: pattern || 'all' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/cache/clear
 * Clear all cache entries
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    OntologyDataProvider.invalidateCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/status
 * Check Palantir connection status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const schema = await OntologySchemaService.getSchema();
    res.json({
      connected: !!schema.ontologyRid,
      hostname: process.env.PALANTIR_HOSTNAME || 'Not configured',
      objectTypeCount: schema.objectTypes.size,
      lastSync: schema.lastUpdated,
    });
  } catch (error: any) {
    res.json({
      connected: false,
      hostname: process.env.PALANTIR_HOSTNAME || 'Not configured',
      objectTypeCount: 0,
      error: error.message,
    });
  }
});

/**
 * GET /api/palantir/sync/history
 * Get sync history from scheduler
 */
router.get('/sync/history', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const scheduler = getPalantirSyncScheduler();
  const history = scheduler.getRunHistory(limit);

  // Transform to expected format
  const formattedHistory = history.map(run => ({
    system: run.jobId.replace('-sync', ''),
    success: run.status === 'completed',
    objectsCreated: (run.result as any)?.created || (run.result as any)?.synced || 0,
    objectsUpdated: (run.result as any)?.updated || 0,
    errors: run.error ? [run.error] : ((run.result as any)?.errors || []),
    syncedAt: run.completedAt || run.startedAt,
    duration: run.completedAt
      ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
      : 0,
  }));

  res.json(formattedHistory);
});

// =====================
// SYNC SCHEDULER MANAGEMENT
// =====================

/**
 * GET /api/palantir/scheduler/jobs
 * Get all registered sync jobs
 */
router.get('/scheduler/jobs', async (req: Request, res: Response) => {
  const scheduler = getPalantirSyncScheduler();
  res.json({
    jobs: scheduler.getJobs(),
  });
});

/**
 * GET /api/palantir/scheduler/jobs/:jobId
 * Get a specific sync job
 */
router.get('/scheduler/jobs/:jobId', async (req: Request, res: Response) => {
  const scheduler = getPalantirSyncScheduler();
  const job = scheduler.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    job,
    history: scheduler.getJobRunHistory(req.params.jobId, 10),
  });
});

/**
 * POST /api/palantir/scheduler/jobs/:jobId/trigger
 * Manually trigger a sync job
 */
router.post('/scheduler/jobs/:jobId/trigger', async (req: Request, res: Response) => {
  const scheduler = getPalantirSyncScheduler();
  const job = scheduler.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  try {
    const run = await scheduler.triggerJob(req.params.jobId);
    res.json({
      success: run.status === 'completed',
      run,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/palantir/scheduler/jobs/:jobId
 * Update a sync job configuration
 */
router.patch('/scheduler/jobs/:jobId', async (req: Request, res: Response) => {
  const scheduler = getPalantirSyncScheduler();
  const { enabled, cronSchedule, config } = req.body;

  const updates: any = {};
  if (enabled !== undefined) updates.enabled = enabled;
  if (cronSchedule !== undefined) updates.cronSchedule = cronSchedule;
  if (config !== undefined) updates.config = config;

  const success = scheduler.updateJob(req.params.jobId, updates);

  if (!success) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    success: true,
    job: scheduler.getJob(req.params.jobId),
  });
});

/**
 * POST /api/palantir/scheduler/jobs/:jobId/enable
 * Enable a sync job
 */
router.post('/scheduler/jobs/:jobId/enable', async (req: Request, res: Response) => {
  const scheduler = getPalantirSyncScheduler();
  const success = scheduler.setJobEnabled(req.params.jobId, true);

  if (!success) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    success: true,
    job: scheduler.getJob(req.params.jobId),
  });
});

/**
 * POST /api/palantir/scheduler/jobs/:jobId/disable
 * Disable a sync job
 */
router.post('/scheduler/jobs/:jobId/disable', async (req: Request, res: Response) => {
  const scheduler = getPalantirSyncScheduler();
  const success = scheduler.setJobEnabled(req.params.jobId, false);

  if (!success) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    success: true,
    job: scheduler.getJob(req.params.jobId),
  });
});

/**
 * POST /api/palantir/scheduler/jobs
 * Register a new sync job
 */
router.post('/scheduler/jobs', async (req: Request, res: Response) => {
  const { id, name, system, enabled, cronSchedule, config } = req.body;

  if (!id || !name || !system || !cronSchedule) {
    return res.status(400).json({
      error: 'Missing required fields: id, name, system, cronSchedule',
    });
  }

  if (!['jira', 'openproject', 'monday'].includes(system)) {
    return res.status(400).json({
      error: 'Invalid system. Must be one of: jira, openproject, monday',
    });
  }

  const scheduler = getPalantirSyncScheduler();

  scheduler.registerJob({
    id,
    name,
    system,
    enabled: enabled ?? true,
    cronSchedule,
    config: config || {},
  });

  res.json({
    success: true,
    job: scheduler.getJob(id),
  });
});

// =====================
// ONTOLOGY DIRECT ACCESS ENDPOINTS
// (Aliased for cleaner API paths)
// =====================

/**
 * GET /api/palantir/ontology/projects
 * Get projects from ontology
 */
router.get('/ontology/projects', async (req: Request, res: Response) => {
  try {
    const { status, businessUnit, businessUnits, priority, pageSize } = req.query;

    const filters = [];
    if (status) filters.push({ field: 'status', operator: 'eq' as const, value: status });
    if (businessUnit) filters.push({ field: 'businessUnit', operator: 'eq' as const, value: businessUnit });
    if (priority) filters.push({ field: 'priority', operator: 'eq' as const, value: priority });

    // Handle multiple business units
    let result;
    if (businessUnits) {
      const buList = (businessUnits as string).split(',');
      const allResults = [];
      for (const bu of buList) {
        const buResult = await OntologyDataProvider.getProjects({
          pageSize: pageSize ? parseInt(pageSize as string) : 100,
          filters: [...filters, { field: 'businessUnit', operator: 'eq' as const, value: bu }],
        });
        allResults.push(...buResult.data);
      }
      result = allResults;
    } else {
      const queryResult = await OntologyDataProvider.getProjects({
        pageSize: pageSize ? parseInt(pageSize as string) : 100,
        filters: filters.length > 0 ? filters : undefined,
      });
      result = queryResult.data;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[API] Ontology projects fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/projects/:projectId
 * Get a specific project from ontology
 */
router.get('/ontology/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const result = await OntologyDataProvider.getById('Project', projectId);

    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('[API] Project fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/risks
 * Get risks from ontology
 */
router.get('/ontology/risks', async (req: Request, res: Response) => {
  try {
    const { severity, status, projectId, pageSize } = req.query;

    const filters = [];
    if (severity) filters.push({ field: 'severity', operator: 'eq' as const, value: severity });
    if (status) filters.push({ field: 'status', operator: 'eq' as const, value: status });
    if (projectId) filters.push({ field: 'projectId', operator: 'eq' as const, value: projectId });

    const result = await OntologyDataProvider.getRisks({
      pageSize: pageSize ? parseInt(pageSize as string) : 100,
      filters: filters.length > 0 ? filters : undefined,
    });

    res.json(result.data);
  } catch (error: any) {
    console.error('[API] Ontology risks fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/okrs
 * Get OKRs from ontology
 */
router.get('/ontology/okrs', async (req: Request, res: Response) => {
  try {
    const { period, owner, pageSize } = req.query;

    const filters = [];
    if (period) filters.push({ field: 'period', operator: 'eq' as const, value: period });
    if (owner) filters.push({ field: 'owner', operator: 'eq' as const, value: owner });

    const result = await OntologyDataProvider.getOKRs({
      pageSize: pageSize ? parseInt(pageSize as string) : 100,
      filters: filters.length > 0 ? filters : undefined,
    });

    res.json({
      objectives: result.objectives.data,
      keyResults: result.keyResults.data,
    });
  } catch (error: any) {
    console.error('[API] Ontology OKRs fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/financials
 * Get financial data from ontology
 */
router.get('/ontology/financials', async (req: Request, res: Response) => {
  try {
    const { projectId, pageSize } = req.query;

    const filters = [];
    if (projectId) filters.push({ field: 'projectId', operator: 'eq' as const, value: projectId });

    const result = await OntologyDataProvider.getBudgets({
      pageSize: pageSize ? parseInt(pageSize as string) : 100,
      filters: filters.length > 0 ? filters : undefined,
    });

    res.json(result.data);
  } catch (error: any) {
    console.error('[API] Ontology financials fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/:objectType
 * Generic endpoint for querying any object type
 */
router.get('/ontology/:objectType', async (req: Request, res: Response) => {
  try {
    const { objectType } = req.params;
    const { pageSize, pageToken, ...filters } = req.query;

    // Skip if this is a known sub-route
    if (['schema', 'metrics', 'agent', 'projects', 'risks', 'okrs', 'financials', 'objects'].includes(objectType)) {
      return res.status(404).json({ error: 'Use specific endpoint for this type' });
    }

    // Convert query params to filter format
    const queryFilters = Object.keys(filters).length > 0
      ? Object.entries(filters).map(([field, value]) => ({
          field,
          operator: 'eq' as const,
          value: value as string,
        }))
      : undefined;

    const result = await OntologyDataProvider.query(objectType, {
      pageSize: pageSize ? parseInt(pageSize as string) : 100,
      pageToken: pageToken as string,
      filters: queryFilters,
    });

    res.json(result);
  } catch (error: any) {
    console.error(`[API] Ontology ${req.params.objectType} fetch failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/ontology/:objectType/:objectId
 * Get a specific object by type and ID
 */
router.get('/ontology/:objectType/:objectId', async (req: Request, res: Response) => {
  try {
    const { objectType, objectId } = req.params;

    // Skip if this is a known sub-route
    if (['schema', 'metrics', 'agent', 'objects'].includes(objectType)) {
      return res.status(404).json({ error: 'Invalid object type' });
    }

    const result = await OntologyDataProvider.getById(objectType, objectId);

    if (!result) {
      return res.status(404).json({ error: `${objectType} not found` });
    }

    res.json(result);
  } catch (error: any) {
    console.error(`[API] Ontology ${req.params.objectType}/${req.params.objectId} fetch failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// POSTGRES TO PALANTIR SYNC
// =====================

/**
 * POST /api/palantir/pg-sync/all
 * Sync all PostgreSQL data TO Palantir ontology
 */
router.post('/pg-sync/all', async (req: Request, res: Response) => {
  try {
    const sync = getPostgresToPalantirSync();
    const result = await sync.syncAll();
    res.json(result);
  } catch (error: any) {
    console.error('[API] PG to Palantir sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/pg-sync/projects
 * Sync PostgreSQL projects TO Palantir
 */
router.post('/pg-sync/projects', async (req: Request, res: Response) => {
  try {
    const sync = getPostgresToPalantirSync();
    const result = await sync.syncProjects();
    res.json({ success: result.failed === 0, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/pg-sync/divisions
 * Sync PostgreSQL divisions TO Palantir
 */
router.post('/pg-sync/divisions', async (req: Request, res: Response) => {
  try {
    const sync = getPostgresToPalantirSync();
    const result = await sync.syncDivisions();
    res.json({ success: result.failed === 0, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/pg-sync/agents
 * Sync PostgreSQL agents TO Palantir
 */
router.post('/pg-sync/agents', async (req: Request, res: Response) => {
  try {
    const sync = getPostgresToPalantirSync();
    const result = await sync.syncAgents();
    res.json({ success: result.failed === 0, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/pg-sync/available
 * Get list of available sync types
 */
router.get('/pg-sync/available', async (req: Request, res: Response) => {
  res.json({
    types: [
      'projects',
      'divisions',
      'agents',
      'features',
      'stories',
      'tasks',
      'kpis',
      'okrs',
      'risks',
    ],
    endpoints: {
      all: 'POST /api/palantir/pg-sync/all',
      projects: 'POST /api/palantir/pg-sync/projects',
      divisions: 'POST /api/palantir/pg-sync/divisions',
      agents: 'POST /api/palantir/pg-sync/agents',
    },
  });
});

// =====================
// POSTGRES TO EXTERNAL SYSTEMS SYNC
// =====================

/**
 * POST /api/palantir/external-sync/all
 * Sync PostgreSQL data TO all external systems (Jira, OpenProject, Monday)
 */
router.post('/external-sync/all', async (req: Request, res: Response) => {
  try {
    const sync = getPostgresToExternalSync();
    const result = await sync.syncAllToAllSystems();
    res.json(result);
  } catch (error: any) {
    console.error('[API] External sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/external-sync/jira
 * Sync PostgreSQL data TO Jira
 */
router.post('/external-sync/jira', async (req: Request, res: Response) => {
  try {
    const { projectKey } = req.body;
    const sync = getPostgresToExternalSync();
    const result = await sync.syncToJira(projectKey);
    res.json({ success: result.failed === 0, result });
  } catch (error: any) {
    console.error('[API] Jira external sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/external-sync/openproject
 * Sync PostgreSQL data TO OpenProject
 */
router.post('/external-sync/openproject', async (req: Request, res: Response) => {
  try {
    const { projectIdentifier } = req.body;
    const sync = getPostgresToExternalSync();
    const result = await sync.syncToOpenProject(projectIdentifier);
    res.json({ success: result.failed === 0, result });
  } catch (error: any) {
    console.error('[API] OpenProject external sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/external-sync/monday
 * Sync PostgreSQL data TO Monday.com
 */
router.post('/external-sync/monday', async (req: Request, res: Response) => {
  try {
    const { boardId } = req.body;
    const sync = getPostgresToExternalSync();
    const result = await sync.syncToMonday(boardId);
    res.json({ success: result.failed === 0, result });
  } catch (error: any) {
    console.error('[API] Monday external sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/external-sync/available
 * Get available external systems
 */
router.get('/external-sync/available', async (req: Request, res: Response) => {
  const sync = getPostgresToExternalSync();
  res.json({
    systems: sync.getAvailableSystems(),
    endpoints: {
      all: 'POST /api/palantir/external-sync/all',
      jira: 'POST /api/palantir/external-sync/jira',
      openproject: 'POST /api/palantir/external-sync/openproject',
      monday: 'POST /api/palantir/external-sync/monday',
    },
  });
});

// =====================
// AGENT ATTRIBUTES API
// =====================

/**
 * GET /api/palantir/attributes
 * Get all agent attributes
 */
router.get('/attributes', async (req: Request, res: Response) => {
  try {
    const { agentId, category, dataType } = req.query;

    let query = 'SELECT * FROM agent_attributes WHERE 1=1';
    const params: any[] = [];

    if (agentId) {
      params.push(agentId);
      query += ` AND agent_id = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (dataType) {
      params.push(dataType);
      query += ` AND data_type = $${params.length}`;
    }

    query += ' ORDER BY agent_id, category, name';

    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error: any) {
    console.error('[API] Attributes fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/attributes/by-agent
 * Get attributes grouped by agent
 */
router.get('/attributes/by-agent', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT agent_id,
             json_agg(json_build_object(
               'id', id,
               'name', name,
               'displayName', display_name,
               'category', category,
               'dataType', data_type,
               'unit', unit,
               'valueSource', value_source,
               'currentValue', current_value,
               'defaultWidgetType', default_widget_type,
               'thresholds', thresholds,
               'palantirPropertyName', palantir_property_name
             ) ORDER BY category, name) as attributes
      FROM agent_attributes
      GROUP BY agent_id
      ORDER BY agent_id
    `);

    const grouped: Record<string, any[]> = {};
    for (const row of result.rows as any[]) {
      grouped[row.agent_id] = row.attributes;
    }

    res.json(grouped);
  } catch (error: any) {
    console.error('[API] Attributes by agent failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/attributes/:attributeId
 * Get a specific attribute
 */
router.get('/attributes/:attributeId', async (req: Request, res: Response) => {
  try {
    const { attributeId } = req.params;
    const result = await db.execute(sql`
      SELECT * FROM agent_attributes WHERE id = ${attributeId} LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/palantir/attributes/:attributeId/value
 * Update an attribute's current value
 */
router.patch('/attributes/:attributeId/value', async (req: Request, res: Response) => {
  try {
    const { attributeId } = req.params;
    const { value, previousValue } = req.body;

    await db.execute(sql`
      UPDATE agent_attributes
      SET current_value = ${value},
          previous_value = ${previousValue || null},
          last_calculated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${attributeId}
    `);

    // Record history
    await db.execute(sql`
      INSERT INTO attribute_value_history (attribute_id, value, calculated_at, triggered_by)
      VALUES (${attributeId}, ${value}, CURRENT_TIMESTAMP, 'api')
    `);

    res.json({ success: true, attributeId, value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/attributes/:attributeId/history
 * Get historical values for an attribute
 */
router.get('/attributes/:attributeId/history', async (req: Request, res: Response) => {
  try {
    const { attributeId } = req.params;
    const { limit } = req.query;

    const result = await db.execute(sql`
      SELECT * FROM attribute_value_history
      WHERE attribute_id = ${attributeId}
      ORDER BY calculated_at DESC
      LIMIT ${parseInt(limit as string) || 100}
    `);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// WIDGET DEFINITIONS API
// =====================

/**
 * GET /api/palantir/widgets
 * Get all widget definitions
 */
router.get('/widgets', async (req: Request, res: Response) => {
  try {
    const { agentId, category, widgetType, isDefault } = req.query;

    let query = 'SELECT * FROM widget_definitions WHERE 1=1';
    const params: any[] = [];

    if (agentId) {
      params.push(agentId);
      query += ` AND agent_id = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (widgetType) {
      params.push(widgetType);
      query += ` AND widget_type = $${params.length}`;
    }
    if (isDefault !== undefined) {
      params.push(isDefault === 'true');
      query += ` AND is_default = $${params.length}`;
    }

    query += ' ORDER BY agent_id, sort_order, name';

    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error: any) {
    console.error('[API] Widgets fetch failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/widgets/by-agent
 * Get widgets grouped by agent
 */
router.get('/widgets/by-agent', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT agent_id,
             json_agg(json_build_object(
               'id', id,
               'slug', slug,
               'name', name,
               'description', description,
               'widgetType', widget_type,
               'size', size,
               'category', category,
               'primaryAttributeId', primary_attribute_id,
               'config', config,
               'isDefault', is_default,
               'sortOrder', sort_order,
               'palantirObjectType', palantir_object_type
             ) ORDER BY sort_order, name) as widgets
      FROM widget_definitions
      GROUP BY agent_id
      ORDER BY agent_id
    `);

    const grouped: Record<string, any[]> = {};
    for (const row of result.rows as any[]) {
      grouped[row.agent_id] = row.widgets;
    }

    res.json(grouped);
  } catch (error: any) {
    console.error('[API] Widgets by agent failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/widgets/:slug
 * Get a specific widget by slug
 */
router.get('/widgets/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await db.execute(sql`
      SELECT w.*,
             a.display_name as attribute_display_name,
             a.data_type as attribute_data_type,
             a.current_value as attribute_current_value
      FROM widget_definitions w
      LEFT JOIN agent_attributes a ON w.primary_attribute_id = a.id
      WHERE w.slug = ${slug}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/widgets/:slug/data
 * Get widget with populated attribute data
 */
router.get('/widgets/:slug/data', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Get widget definition
    const widgetResult = await db.execute(sql`
      SELECT * FROM widget_definitions WHERE slug = ${slug} LIMIT 1
    `);

    if (widgetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const widget = widgetResult.rows[0] as any;

    // Get primary attribute
    const primaryAttrResult = await db.execute(sql`
      SELECT * FROM agent_attributes WHERE id = ${widget.primary_attribute_id} LIMIT 1
    `);

    // Get secondary attributes if any
    let secondaryAttrs: any[] = [];
    if (widget.secondary_attribute_ids) {
      const secondaryIds = JSON.parse(widget.secondary_attribute_ids);
      if (secondaryIds.length > 0) {
        const secondaryResult = await db.execute(sql`
          SELECT * FROM agent_attributes WHERE id = ANY(${secondaryIds})
        `);
        secondaryAttrs = secondaryResult.rows as any[];
      }
    }

    res.json({
      widget,
      primaryAttribute: primaryAttrResult.rows[0] || null,
      secondaryAttributes: secondaryAttrs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// DASHBOARD LAYOUT API
// =====================

/**
 * GET /api/palantir/dashboard/:userId
 * Get user's dashboard layout
 */
router.get('/dashboard/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { dashboardId } = req.query;

    const result = await db.execute(sql`
      SELECT * FROM user_dashboard_layouts
      WHERE user_id = ${userId}
      ${dashboardId ? sql`AND dashboard_id = ${dashboardId}` : sql``}
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      // Return default layout
      const defaultWidgets = await db.execute(sql`
        SELECT slug, sort_order FROM widget_definitions
        WHERE is_default = true
        ORDER BY agent_id, sort_order
      `);

      return res.json({
        userId,
        dashboardId: dashboardId || 'default',
        layout: defaultWidgets.rows,
        isDefault: true,
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/palantir/dashboard/:userId
 * Save user's dashboard layout
 */
router.put('/dashboard/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { dashboardId, layout, hiddenWidgets, customWidgets, defaultFilters } = req.body;

    const dId = dashboardId || 'default';

    // Upsert layout
    await db.execute(sql`
      INSERT INTO user_dashboard_layouts (
        user_id, dashboard_id, layout, hidden_widgets, custom_widgets, default_filters
      ) VALUES (
        ${userId},
        ${dId},
        ${JSON.stringify(layout)},
        ${hiddenWidgets ? JSON.stringify(hiddenWidgets) : null},
        ${customWidgets ? JSON.stringify(customWidgets) : null},
        ${defaultFilters ? JSON.stringify(defaultFilters) : null}
      )
      ON CONFLICT (user_id, dashboard_id) DO UPDATE SET
        layout = EXCLUDED.layout,
        hidden_widgets = EXCLUDED.hidden_widgets,
        custom_widgets = EXCLUDED.custom_widgets,
        default_filters = EXCLUDED.default_filters,
        updated_at = CURRENT_TIMESTAMP
    `);

    res.json({ success: true, userId, dashboardId: dId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// SEEDING ENDPOINTS
// =====================

/**
 * POST /api/palantir/seed/attributes
 * Seed agent attributes
 */
router.post('/seed/attributes', async (req: Request, res: Response) => {
  try {
    const result = await seedAgentAttributes();
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API] Seed attributes failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/seed/widgets
 * Seed widget definitions
 */
router.post('/seed/widgets', async (req: Request, res: Response) => {
  try {
    const result = await seedWidgetDefinitions();
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API] Seed widgets failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/palantir/seed/all
 * Run all seed scripts
 */
router.post('/seed/all', async (req: Request, res: Response) => {
  try {
    const results = await seedAll();
    res.json({ success: true, results });
  } catch (error: any) {
    console.error('[API] Seed all failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/palantir/seed/status
 * Check current seeded data status
 */
router.get('/seed/status', async (req: Request, res: Response) => {
  try {
    const agentsCount = await db.execute(sql`SELECT COUNT(*) as count FROM agents`);
    const attributesCount = await db.execute(sql`SELECT COUNT(*) as count FROM agent_attributes`);
    const widgetsCount = await db.execute(sql`SELECT COUNT(*) as count FROM widget_definitions`);

    res.json({
      agents: parseInt((agentsCount.rows[0] as any)?.count || '0'),
      attributes: parseInt((attributesCount.rows[0] as any)?.count || '0'),
      widgets: parseInt((widgetsCount.rows[0] as any)?.count || '0'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
