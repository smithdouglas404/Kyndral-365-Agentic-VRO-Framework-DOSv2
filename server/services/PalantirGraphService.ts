/**
 * PALANTIR GRAPH SERVICE
 *
 * Provides graph exploration and cross-domain insights directly from Palantir.
 * Neo4j handles graph traversal; Palantir provides the data.
 *
 * Features:
 * - Node/edge traversal via Palantir Ontology API
 * - Cross-domain insight generation
 * - Relationship discovery between entities
 * - Drill-down capabilities for risks, issues, dependencies
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { getPalantirDataProvider } from '../mcp/PalantirDataProvider.js';

// Node types in the knowledge graph (Palantir object types)
export const GRAPH_NODE_TYPES = {
  project: 'AtlasProject',
  risk: 'AtlasRisk',
  objective: 'AtlasObjective',
  keyResult: 'AtlasKeyResult',
  dependency: 'AtlasDependency',
  team: 'AtlasTeam',
  person: 'AtlasPerson',
  budget: 'AtlasBudget',
  kpi: 'AtlasKpi',
  insight: 'AtlasInsight',
  checkpoint: 'AtlasGovernanceCheckpoint',
  readiness: 'AtlasReadinessMetric',
  transformation: 'AtlasTransformation',
  epic: 'AtlasEpic',
  feature: 'AtlasFeature',
} as const;

// Relationship types between nodes
export const GRAPH_RELATIONSHIPS = {
  project_has_risk: { from: 'AtlasProject', to: 'AtlasRisk', label: 'HAS_RISK' },
  project_has_dependency: { from: 'AtlasProject', to: 'AtlasDependency', label: 'DEPENDS_ON' },
  project_has_objective: { from: 'AtlasProject', to: 'AtlasObjective', label: 'ALIGNED_TO' },
  project_has_team: { from: 'AtlasProject', to: 'AtlasTeam', label: 'ASSIGNED_TO' },
  project_has_budget: { from: 'AtlasProject', to: 'AtlasBudget', label: 'HAS_BUDGET' },
  objective_has_keyresult: { from: 'AtlasObjective', to: 'AtlasKeyResult', label: 'MEASURED_BY' },
  team_has_person: { from: 'AtlasTeam', to: 'AtlasPerson', label: 'INCLUDES' },
  risk_mitigated_by: { from: 'AtlasRisk', to: 'AtlasProject', label: 'MITIGATED_BY' },
  dependency_blocks: { from: 'AtlasDependency', to: 'AtlasProject', label: 'BLOCKS' },
} as const;

// Graph node representation
export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  severity?: string;
  status?: string;
}

// Graph edge representation
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  properties?: Record<string, any>;
}

// Graph data for visualization
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
  };
}

// Insight for a node
export interface NodeInsight {
  nodeId: string;
  nodeType: string;
  insights: {
    type: string;
    severity: 'info' | 'warning' | 'high' | 'critical';
    title: string;
    description: string;
    recommendation: string;
    confidence: number;
    relatedNodes: string[];
  }[];
  relationships: {
    type: string;
    count: number;
    items: { id: string; label: string; status?: string }[];
  }[];
}

class PalantirGraphService {
  private palantirService: ReturnType<typeof getPalantirService> | null = null;
  private palantirProvider: ReturnType<typeof getPalantirDataProvider> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.palantirService = getPalantirService();
    this.palantirProvider = getPalantirDataProvider();

    if (!this.palantirService) {
      console.warn('[PalantirGraph] Palantir service not available');
    } else {
      console.log('[PalantirGraph] Initialized - Palantir is the knowledge graph');
    }

    this.initialized = true;
  }

  isAvailable(): boolean {
    return this.palantirProvider?.isAvailable() || false;
  }

  /**
   * Get the full graph for visualization
   * Returns nodes and edges for rendering
   */
  async getGraph(options?: {
    nodeTypes?: string[];
    limit?: number;
    includeEdges?: boolean;
  }): Promise<GraphData> {
    await this.initialize();

    if (!this.palantirService) {
      return { nodes: [], edges: [], stats: { nodeCount: 0, edgeCount: 0, nodeTypes: {} } };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeTypes: Record<string, number> = {};

    const typesToFetch = options?.nodeTypes || ['AtlasProject', 'AtlasRisk', 'AtlasObjective', 'AtlasDependency'];
    const limit = options?.limit || 50;

    // Fetch nodes for each type
    for (const objectType of typesToFetch) {
      try {
        const result = await this.palantirService.listObjects(objectType, { pageSize: limit });
        const objects = result.data || [];

        nodeTypes[objectType] = objects.length;

        for (const obj of objects) {
          nodes.push({
            id: obj.id,
            type: objectType,
            label: obj.title || obj.name || obj.id,
            properties: obj,
            severity: obj.severity,
            status: obj.status,
          });
        }
      } catch (error) {
        console.warn(`[PalantirGraph] Failed to fetch ${objectType}:`, error);
      }
    }

    // Build edges from relationships
    if (options?.includeEdges !== false) {
      edges.push(...this.buildEdges(nodes));
    }

    return {
      nodes,
      edges,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeTypes,
      },
    };
  }

  /**
   * Build edges by analyzing node relationships
   */
  private buildEdges(nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const node of nodes) {
      const props = node.properties;

      // Project → Risk relationship
      if (node.type === 'AtlasRisk' && props.projectId) {
        if (nodeMap.has(props.projectId)) {
          edges.push({
            id: `${props.projectId}-${node.id}`,
            source: props.projectId,
            target: node.id,
            type: 'HAS_RISK',
            label: 'has risk',
          });
        }
      }

      // Project → Objective relationship
      if (node.type === 'AtlasProject' && props.objectiveId) {
        if (nodeMap.has(props.objectiveId)) {
          edges.push({
            id: `${node.id}-${props.objectiveId}`,
            source: node.id,
            target: props.objectiveId,
            type: 'ALIGNED_TO',
            label: 'aligned to',
          });
        }
      }

      // Dependency relationships
      if (node.type === 'AtlasDependency') {
        if (props.sourceProjectId && nodeMap.has(props.sourceProjectId)) {
          edges.push({
            id: `${props.sourceProjectId}-${node.id}`,
            source: props.sourceProjectId,
            target: node.id,
            type: 'HAS_DEPENDENCY',
            label: 'depends on',
          });
        }
        if (props.targetProjectId && nodeMap.has(props.targetProjectId)) {
          edges.push({
            id: `${node.id}-${props.targetProjectId}`,
            source: node.id,
            target: props.targetProjectId,
            type: 'BLOCKS',
            label: 'blocks',
          });
        }
      }

      // Team relationships
      if (props.teamId && nodeMap.has(props.teamId)) {
        edges.push({
          id: `${node.id}-${props.teamId}`,
          source: node.id,
          target: props.teamId,
          type: 'ASSIGNED_TO',
          label: 'assigned to',
        });
      }
    }

    return edges;
  }

  /**
   * Get a single node with its relationships
   */
  async getNode(nodeType: string, nodeId: string): Promise<GraphNode | null> {
    await this.initialize();

    if (!this.palantirService) return null;

    try {
      const result = await this.palantirService.getObject(nodeType, nodeId);
      if (!result) return null;

      return {
        id: result.id,
        type: nodeType,
        label: result.title || result.name || result.id,
        properties: result,
        severity: result.severity,
        status: result.status,
      };
    } catch (error) {
      console.error(`[PalantirGraph] Failed to get node ${nodeType}/${nodeId}:`, error);
      return null;
    }
  }

  /**
   * Get insights for a specific node (drill-down)
   * This is what happens when user clicks a node
   */
  async getNodeInsights(nodeType: string, nodeId: string): Promise<NodeInsight> {
    await this.initialize();

    const insights: NodeInsight['insights'] = [];
    const relationships: NodeInsight['relationships'] = [];

    if (!this.palantirService) {
      return { nodeId, nodeType, insights, relationships };
    }

    try {
      // Get the node
      const node = await this.palantirService.getObject(nodeType, nodeId);
      if (!node) {
        return { nodeId, nodeType, insights, relationships };
      }

      // Generate insights based on node type
      if (nodeType === 'AtlasProject') {
        // Check CPI/SPI
        if (node.cpi !== undefined && node.cpi < 0.9) {
          insights.push({
            type: 'budget_risk',
            severity: node.cpi < 0.8 ? 'critical' : 'warning',
            title: 'Budget Performance Issue',
            description: `CPI is ${(node.cpi * 100).toFixed(0)}% - project is over budget`,
            recommendation: 'Review budget allocation and identify cost reduction opportunities',
            confidence: 0.95,
            relatedNodes: [],
          });
        }

        if (node.spi !== undefined && node.spi < 0.9) {
          insights.push({
            type: 'schedule_risk',
            severity: node.spi < 0.8 ? 'critical' : 'warning',
            title: 'Schedule Performance Issue',
            description: `SPI is ${(node.spi * 100).toFixed(0)}% - project is behind schedule`,
            recommendation: 'Assess critical path and consider scope adjustment',
            confidence: 0.95,
            relatedNodes: [],
          });
        }

        // Get related risks
        const risks = await this.palantirService.searchObjects('AtlasRisk', {
          type: 'eq',
          field: 'projectId',
          value: nodeId,
        }, { pageSize: 50 });

        if (risks.data?.length > 0) {
          const criticalRisks = risks.data.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
          relationships.push({
            type: 'risks',
            count: risks.data.length,
            items: risks.data.slice(0, 10).map((r: any) => ({
              id: r.id,
              label: r.title || r.name,
              status: r.status,
            })),
          });

          if (criticalRisks.length > 0) {
            insights.push({
              type: 'critical_risks',
              severity: 'high',
              title: `${criticalRisks.length} Critical/High Risks`,
              description: `Project has ${criticalRisks.length} unresolved critical or high severity risks`,
              recommendation: 'Review risk mitigation plans and escalate if needed',
              confidence: 0.9,
              relatedNodes: criticalRisks.map((r: any) => r.id),
            });
          }
        }

        // Get dependencies
        const deps = await this.palantirService.searchObjects('AtlasDependency', {
          type: 'or',
          conditions: [
            { type: 'eq', field: 'sourceProjectId', value: nodeId },
            { type: 'eq', field: 'targetProjectId', value: nodeId },
          ],
        }, { pageSize: 50 });

        if (deps.data?.length > 0) {
          const blockedDeps = deps.data.filter((d: any) => d.status === 'blocked');
          relationships.push({
            type: 'dependencies',
            count: deps.data.length,
            items: deps.data.slice(0, 10).map((d: any) => ({
              id: d.id,
              label: d.title || `${d.sourceProjectId} → ${d.targetProjectId}`,
              status: d.status,
            })),
          });

          if (blockedDeps.length > 0) {
            insights.push({
              type: 'blocked_dependencies',
              severity: 'warning',
              title: `${blockedDeps.length} Blocked Dependencies`,
              description: 'Project has blocked dependencies that may impact delivery',
              recommendation: 'Prioritize unblocking or find alternative approaches',
              confidence: 0.85,
              relatedNodes: blockedDeps.map((d: any) => d.id),
            });
          }
        }
      }

      // Risk-specific insights
      if (nodeType === 'AtlasRisk') {
        if (!node.mitigationPlan && (node.severity === 'critical' || node.severity === 'high')) {
          insights.push({
            type: 'unmitigated_risk',
            severity: 'critical',
            title: 'No Mitigation Plan',
            description: `${node.severity} severity risk without a mitigation plan`,
            recommendation: 'Immediately create and assign a mitigation plan',
            confidence: 0.95,
            relatedNodes: node.projectId ? [node.projectId] : [],
          });
        }

        if (node.projectId) {
          relationships.push({
            type: 'project',
            count: 1,
            items: [{ id: node.projectId, label: 'Parent Project' }],
          });
        }
      }

      // Dependency-specific insights
      if (nodeType === 'AtlasDependency') {
        if (node.status === 'blocked') {
          insights.push({
            type: 'blocked_dependency',
            severity: 'high',
            title: 'Dependency Blocked',
            description: 'This dependency is currently blocked',
            recommendation: 'Identify blockers and create action plan to resolve',
            confidence: 0.95,
            relatedNodes: [node.sourceProjectId, node.targetProjectId].filter(Boolean),
          });
        }
      }

    } catch (error) {
      console.error(`[PalantirGraph] Failed to get insights for ${nodeType}/${nodeId}:`, error);
    }

    return { nodeId, nodeType, insights, relationships };
  }

  /**
   * Get neighbors of a node (for graph expansion)
   */
  async getNodeNeighbors(nodeType: string, nodeId: string): Promise<GraphNode[]> {
    await this.initialize();
    if (!this.palantirService) return [];

    const neighbors: GraphNode[] = [];
    const seen = new Set<string>();
    const push = (n: GraphNode) => {
      const key = `${n.type}::${n.id}`;
      if (seen.has(key) || !n.id) return;
      seen.add(key);
      neighbors.push(n);
    };
    const toNode = (type: string, raw: any, labelFallback?: string): GraphNode => ({
      id: raw.id || raw.__primaryKey || raw[`${type.toLowerCase()}Id`],
      type,
      label: raw.title || raw.name || raw.__title || labelFallback || raw.id,
      properties: raw,
      severity: raw.severity,
      status: raw.status,
    });
    const search = async (type: string, field: string, value: string, limit = 25) => {
      try {
        const r = await this.palantirService!.searchObjects(type, { type: 'eq', field, value }, { pageSize: limit });
        return r.data || [];
      } catch { return []; }
    };
    const fetch = async (type: string, id: string) => {
      try { return await this.palantirService!.getObject(type, id); } catch { return null; }
    };

    try {
      const node = await fetch(nodeType, nodeId);
      if (!node) return [];

      if (nodeType === 'AtlasProject') {
        for (const r of await search('AtlasRisk', 'projectId', nodeId))      push(toNode('AtlasRisk', r, 'Risk'));
        for (const d of await search('AtlasDependency', 'sourceProjectId', nodeId)) push(toNode('AtlasDependency', d, 'Dependency'));
        for (const d of await search('AtlasDependency', 'targetProjectId', nodeId)) push(toNode('AtlasDependency', d, 'Dependency'));
        for (const k of await search('AtlasKpi', 'projectId', nodeId))       push(toNode('AtlasKpi', k, 'KPI'));
        for (const b of await search('AtlasBudget', 'projectId', nodeId))    push(toNode('AtlasBudget', b, 'Budget'));
        for (const i of await search('AtlasInsight', 'projectId', nodeId, 10)) push(toNode('AtlasInsight', i, 'Insight'));
        if (node.objectiveId) {
          const o = await fetch('AtlasObjective', node.objectiveId);
          if (o) push(toNode('AtlasObjective', o, 'Objective'));
        }
        if (node.teamId) {
          const t = await fetch('AtlasTeam', node.teamId);
          if (t) push(toNode('AtlasTeam', t, 'Team'));
        }
      } else if (nodeType === 'AtlasRisk') {
        if (node.projectId) {
          const p = await fetch('AtlasProject', node.projectId);
          if (p) push(toNode('AtlasProject', p));
        }
      } else if (nodeType === 'AtlasObjective') {
        for (const kr of await search('AtlasKeyResult', 'objectiveId', nodeId)) push(toNode('AtlasKeyResult', kr, 'Key Result'));
        for (const p of await search('AtlasProject', 'objectiveId', nodeId))    push(toNode('AtlasProject', p));
      } else if (nodeType === 'AtlasKeyResult' && node.objectiveId) {
        const o = await fetch('AtlasObjective', node.objectiveId);
        if (o) push(toNode('AtlasObjective', o));
      } else if (nodeType === 'AtlasDependency') {
        if (node.sourceProjectId) { const p = await fetch('AtlasProject', node.sourceProjectId); if (p) push(toNode('AtlasProject', p)); }
        if (node.targetProjectId) { const p = await fetch('AtlasProject', node.targetProjectId); if (p) push(toNode('AtlasProject', p)); }
      } else if (nodeType === 'AtlasTeam') {
        for (const m of await search('AtlasPerson', 'teamId', nodeId))     push(toNode('AtlasPerson', m, 'Member'));
        for (const p of await search('AtlasProject', 'teamId', nodeId))    push(toNode('AtlasProject', p));
      } else if (nodeType === 'AtlasBudget' && node.projectId) {
        const p = await fetch('AtlasProject', node.projectId); if (p) push(toNode('AtlasProject', p));
      } else if (nodeType === 'AtlasKpi' && node.projectId) {
        const p = await fetch('AtlasProject', node.projectId); if (p) push(toNode('AtlasProject', p));
      } else if (nodeType === 'AtlasInsight' && node.projectId) {
        const p = await fetch('AtlasProject', node.projectId); if (p) push(toNode('AtlasProject', p));
      } else if (nodeType === 'AtlasPerson' && node.teamId) {
        const t = await fetch('AtlasTeam', node.teamId); if (t) push(toNode('AtlasTeam', t));
      }
    } catch (error) {
      console.error(`[PalantirGraph] Failed to get neighbors for ${nodeType}/${nodeId}:`, error);
    }

    return neighbors;
  }

  /**
   * Generate cross-domain insights from Palantir data
   */
  async generateCrossDomainInsights(): Promise<NodeInsight['insights']> {
    await this.initialize();

    if (!this.palantirService) return [];

    const insights: NodeInsight['insights'] = [];

    try {
      // Get all projects
      const projects = await this.palantirService.listObjects('AtlasProject', { pageSize: 100 });
      const objectives = await this.palantirService.listObjects('AtlasObjective', { pageSize: 100 });
      const risks = await this.palantirService.listObjects('AtlasRisk', { pageSize: 100 });

      // Find orphaned projects
      const linkedProjectIds = new Set(
        (objectives.data || []).flatMap((o: any) => o.linkedProjectIds || [])
      );
      const orphanedProjects = (projects.data || []).filter((p: any) =>
        !linkedProjectIds.has(p.id) && !p.objectiveId && p.status !== 'completed'
      );

      if (orphanedProjects.length > 0) {
        insights.push({
          type: 'orphaned_projects',
          severity: orphanedProjects.length > 5 ? 'high' : 'warning',
          title: 'Projects Without Strategic Alignment',
          description: `${orphanedProjects.length} projects are not linked to any OKR`,
          recommendation: 'Review and align projects to strategic objectives',
          confidence: 0.95,
          relatedNodes: orphanedProjects.slice(0, 10).map((p: any) => p.id),
        });
      }

      // Find unmitigated critical risks
      const unmitigatedRisks = (risks.data || []).filter((r: any) =>
        (r.severity === 'critical' || r.severity === 'high') &&
        !r.mitigationPlan &&
        r.status !== 'resolved'
      );

      if (unmitigatedRisks.length > 0) {
        insights.push({
          type: 'unmitigated_risks',
          severity: 'critical',
          title: 'Critical Risks Without Mitigation',
          description: `${unmitigatedRisks.length} critical/high risks have no mitigation plan`,
          recommendation: 'Immediately create mitigation plans and assign owners',
          confidence: 0.95,
          relatedNodes: unmitigatedRisks.slice(0, 10).map((r: any) => r.id),
        });
      }

      // Find budget/schedule correlation
      const atRiskProjects = (projects.data || []).filter((p: any) =>
        p.cpi !== undefined && p.spi !== undefined &&
        p.cpi < 0.9 && p.spi < 0.9
      );

      if (atRiskProjects.length > 0) {
        insights.push({
          type: 'budget_schedule_correlation',
          severity: 'critical',
          title: 'Budget and Schedule Issues',
          description: `${atRiskProjects.length} projects have both budget overruns and schedule delays`,
          recommendation: 'Conduct root cause analysis and consider scope reduction',
          confidence: 0.9,
          relatedNodes: atRiskProjects.slice(0, 10).map((p: any) => p.id),
        });
      }

    } catch (error) {
      console.error('[PalantirGraph] Failed to generate cross-domain insights:', error);
    }

    return insights;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      palantirAvailable: this.isAvailable(),
      nodeTypes: Object.keys(GRAPH_NODE_TYPES),
      relationshipTypes: Object.keys(GRAPH_RELATIONSHIPS),
    };
  }
}

// Singleton instance
export const palantirGraphService = new PalantirGraphService();
