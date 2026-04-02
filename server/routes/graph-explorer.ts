/**
 * GRAPH EXPLORER API
 *
 * REST endpoints for exploring the Palantir knowledge graph.
 * Enables drill-down, relationship discovery, and node insights.
 */

import { Router, Request, Response } from 'express';
import { palantirGraphService, GRAPH_NODE_TYPES } from '../services/PalantirGraphService.js';

const router = Router();

/**
 * GET /api/graph/status
 * Get graph service status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    await palantirGraphService.initialize();
    res.json(palantirGraphService.getStatus());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/types
 * Get available node types in the graph
 */
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    nodeTypes: GRAPH_NODE_TYPES,
    count: Object.keys(GRAPH_NODE_TYPES).length,
  });
});

/**
 * GET /api/graph
 * Get the full graph for visualization
 * Query params:
 *   - types: comma-separated node types (default: project,risk,objective,dependency)
 *   - limit: max nodes per type (default: 50)
 *   - includeEdges: whether to include edges (default: true)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const typesParam = req.query.types as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const includeEdges = req.query.includeEdges !== 'false';

    // Map friendly names to Palantir types
    const typeMapping: Record<string, string> = {
      project: 'AtlasProject',
      risk: 'AtlasRisk',
      objective: 'AtlasObjective',
      dependency: 'AtlasDependency',
      team: 'AtlasTeam',
      person: 'AtlasPerson',
      budget: 'AtlasBudget',
      kpi: 'AtlasKpi',
      insight: 'AtlasInsight',
    };

    let nodeTypes: string[];
    if (typesParam) {
      nodeTypes = typesParam.split(',').map(t => typeMapping[t.trim()] || t.trim());
    } else {
      nodeTypes = ['AtlasProject', 'AtlasRisk', 'AtlasObjective', 'AtlasDependency'];
    }

    const graph = await palantirGraphService.getGraph({
      nodeTypes,
      limit,
      includeEdges,
    });

    res.json(graph);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/node/:type/:id
 * Get a specific node
 */
router.get('/node/:type/:id', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    // Map friendly name to Palantir type
    const typeMapping: Record<string, string> = {
      project: 'AtlasProject',
      risk: 'AtlasRisk',
      objective: 'AtlasObjective',
      dependency: 'AtlasDependency',
    };

    const nodeType = typeMapping[type] || type;
    const node = await palantirGraphService.getNode(nodeType, id);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.json(node);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/node/:type/:id/insights
 * Get insights for a specific node (drill-down)
 * This is what happens when user clicks a node
 */
router.get('/node/:type/:id/insights', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    const typeMapping: Record<string, string> = {
      project: 'AtlasProject',
      risk: 'AtlasRisk',
      objective: 'AtlasObjective',
      dependency: 'AtlasDependency',
    };

    const nodeType = typeMapping[type] || type;
    const insights = await palantirGraphService.getNodeInsights(nodeType, id);

    res.json(insights);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/node/:type/:id/neighbors
 * Get neighbors of a node (for graph expansion)
 */
router.get('/node/:type/:id/neighbors', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    const typeMapping: Record<string, string> = {
      project: 'AtlasProject',
      risk: 'AtlasRisk',
      objective: 'AtlasObjective',
      dependency: 'AtlasDependency',
    };

    const nodeType = typeMapping[type] || type;
    const neighbors = await palantirGraphService.getNodeNeighbors(nodeType, id);

    res.json({
      sourceNode: { type: nodeType, id },
      neighbors,
      count: neighbors.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/insights
 * Get cross-domain insights across the entire graph
 */
router.get('/insights', async (_req: Request, res: Response) => {
  try {
    const insights = await palantirGraphService.generateCrossDomainInsights();

    res.json({
      insights,
      count: insights.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/search
 * Search nodes by label/name
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as string;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    // Get graph and filter by search query
    const typeMapping: Record<string, string> = {
      project: 'AtlasProject',
      risk: 'AtlasRisk',
      objective: 'AtlasObjective',
      dependency: 'AtlasDependency',
    };

    const nodeTypes = type ? [typeMapping[type] || type] : undefined;

    const graph = await palantirGraphService.getGraph({
      nodeTypes,
      limit: 100,
      includeEdges: false,
    });

    // Filter nodes by search query
    const matchingNodes = graph.nodes.filter(node =>
      node.label.toLowerCase().includes(query.toLowerCase()) ||
      node.id.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      query,
      results: matchingNodes.slice(0, 20),
      count: matchingNodes.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
