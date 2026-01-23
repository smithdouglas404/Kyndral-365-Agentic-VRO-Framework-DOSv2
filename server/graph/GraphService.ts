/**
 * Neo4j Knowledge Graph Service
 *
 * Phase 4: Knowledge Graph Layer for Advanced Analytics
 *
 * Capabilities:
 * - Relationship discovery (hidden dependencies, resource conflicts)
 * - Root cause analysis (multi-hop traversal)
 * - Predictive impact modeling (what-if scenarios)
 * - Critical path detection (PageRank algorithm)
 *
 * Graph Schema:
 * - Nodes: Project, Epic, Feature, Story, Task, Resource, Risk, Milestone, Dependency
 * - Relationships: HAS_EPIC, HAS_FEATURE, DEPENDS_ON, ASSIGNED_TO, MITIGATES, WORKS_ON
 */

import neo4j, { Driver, Session, Result } from 'neo4j-driver';

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphRelationship {
  type: string;
  from: string;
  to: string;
  properties?: Record<string, any>;
}

export interface DependencyAnalysis {
  directDependencies: string[];
  indirectDependencies: string[];
  circularDependencies: string[];
  criticalPath: string[];
}

export interface ImpactPrediction {
  affectedNodes: string[];
  impactScore: number;
  rippleEffect: Array<{
    nodeId: string;
    distance: number;
    impactLevel: 'high' | 'medium' | 'low';
  }>;
}

export class GraphService {
  private driver: Driver | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Neo4j connection
   */
  private initialize(): void {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        disableLosslessIntegers: true,
      });
      this.isConnected = true;
      console.log('[GraphService] ✅ Neo4j connection initialized');
    } catch (error: any) {
      console.warn('[GraphService] ⚠️ Neo4j not available:', error.message);
      console.warn('[GraphService] Graph analytics will be disabled. To enable:');
      console.warn('[GraphService] - Docker: Start Neo4j service in docker-compose');
      console.warn('[GraphService] - Replit: Use Neo4j Aura (https://neo4j.com/cloud/aura/)');
      this.isConnected = false;
    }
  }

  /**
   * Check if Neo4j is available
   */
  isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Get a Neo4j session
   */
  private getSession(): Session | null {
    if (!this.driver || !this.isConnected) {
      return null;
    }
    return this.driver.session();
  }

  /**
   * Execute a Cypher query
   */
  async executeCypher(query: string, params: Record<string, any> = {}): Promise<Result | null> {
    const session = this.getSession();
    if (!session) {
      console.warn('[GraphService] Neo4j not available, query skipped');
      return null;
    }

    try {
      const result = await session.run(query, params);
      return result;
    } catch (error: any) {
      console.error('[GraphService] Cypher query failed:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create or update a node in the graph
   */
  async upsertNode(node: GraphNode): Promise<void> {
    if (!this.isAvailable()) return;

    const labels = node.labels.join(':');
    const query = `
      MERGE (n:${labels} {id: $id})
      SET n += $properties
      RETURN n
    `;

    await this.executeCypher(query, {
      id: node.id,
      properties: node.properties,
    });
  }

  /**
   * Create or update a relationship in the graph
   */
  async upsertRelationship(rel: GraphRelationship): Promise<void> {
    if (!this.isAvailable()) return;

    const query = `
      MATCH (from {id: $fromId})
      MATCH (to {id: $toId})
      MERGE (from)-[r:${rel.type}]->(to)
      ${rel.properties ? 'SET r += $properties' : ''}
      RETURN r
    `;

    await this.executeCypher(query, {
      fromId: rel.from,
      toId: rel.to,
      properties: rel.properties || {},
    });
  }

  /**
   * Sync a project and its entities to the graph
   */
  async syncProject(project: any): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[GraphService] Skipping project sync (Neo4j not available)');
      return;
    }

    console.log(`[GraphService] Syncing project ${project.id} to knowledge graph`);

    // Create project node
    await this.upsertNode({
      id: project.id,
      labels: ['Project'],
      properties: {
        name: project.name,
        status: project.status,
        budget: project.budget,
        cpi: project.cpiValue || '1.0',
        spi: project.spiValue || '1.0',
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
      },
    });

    // TODO: Sync related entities (epics, features, stories, risks, etc.)
    // This will be implemented in Phase 4
  }

  /**
   * Analyze dependencies for a project
   * Returns direct, indirect, and circular dependencies
   */
  async analyzeDependencies(projectId: string): Promise<DependencyAnalysis | null> {
    if (!this.isAvailable()) return null;

    const query = `
      MATCH (p:Project {id: $projectId})

      // Direct dependencies
      OPTIONAL MATCH (p)-[:HAS_TASK]->(t1)-[:DEPENDS_ON]->(t2)
      WITH p, collect(DISTINCT t2.id) as direct

      // Indirect dependencies (2+ hops)
      OPTIONAL MATCH path = (p)-[:HAS_TASK]->(t1)-[:DEPENDS_ON*2..]->(t3)
      WITH p, direct, collect(DISTINCT t3.id) as indirect

      // Circular dependencies
      OPTIONAL MATCH cycle = (p)-[:HAS_TASK]->(t1)-[:DEPENDS_ON*]->(t1)

      RETURN {
        direct: direct,
        indirect: indirect,
        circular: collect(DISTINCT [node in nodes(cycle) | node.id])
      } as analysis
    `;

    const result = await this.executeCypher(query, { projectId });
    if (!result || result.records.length === 0) return null;

    const analysis = result.records[0].get('analysis');

    // TODO: Implement critical path using PageRank or similar
    const criticalPath: string[] = [];

    return {
      directDependencies: analysis.direct || [],
      indirectDependencies: analysis.indirect || [],
      circularDependencies: analysis.circular || [],
      criticalPath,
    };
  }

  /**
   * Detect resource conflicts
   * Finds resources over-allocated across multiple tasks
   */
  async detectResourceConflicts(): Promise<any[]> {
    if (!this.isAvailable()) return [];

    const query = `
      MATCH (r:Resource)-[:ASSIGNED_TO]->(t:Task)
      WHERE t.status IN ['in_progress', 'planned']
      WITH r, count(t) as taskCount, collect(t) as tasks
      WHERE taskCount > 1
      RETURN {
        resourceId: r.id,
        resourceName: r.name,
        conflictCount: taskCount,
        conflictingTasks: [task in tasks | {id: task.id, name: task.name}]
      } as conflict
      ORDER BY taskCount DESC
    `;

    const result = await this.executeCypher(query);
    if (!result) return [];

    return result.records.map(record => record.get('conflict'));
  }

  /**
   * Predict impact of a change
   * Simulates what-if scenarios using graph traversal
   */
  async predictImpact(nodeId: string, changeType: 'delay' | 'budget_increase' | 'resource_change'): Promise<ImpactPrediction | null> {
    if (!this.isAvailable()) return null;

    // Use BFS to find all affected nodes within 3 hops
    const query = `
      MATCH (n {id: $nodeId})
      CALL apoc.path.subgraphAll(n, {
        relationshipFilter: 'DEPENDS_ON>|HAS_FEATURE>|HAS_TASK>|ASSIGNED_TO>',
        maxLevel: 3
      })
      YIELD nodes, relationships

      UNWIND nodes as node
      WITH node,
           shortestPath((n)-[*..3]->(node)) as path,
           length(shortestPath((n)-[*..3]->(node))) as distance
      WHERE node.id <> $nodeId

      RETURN {
        nodeId: node.id,
        distance: distance,
        impactLevel: CASE
          WHEN distance = 1 THEN 'high'
          WHEN distance = 2 THEN 'medium'
          ELSE 'low'
        END
      } as impact
      ORDER BY distance ASC
    `;

    const result = await this.executeCypher(query, { nodeId });
    if (!result) return null;

    const rippleEffect = result.records.map(record => record.get('impact'));
    const impactScore = rippleEffect.reduce((score, impact) => {
      if (impact.impactLevel === 'high') return score + 1.0;
      if (impact.impactLevel === 'medium') return score + 0.5;
      return score + 0.25;
    }, 0);

    return {
      affectedNodes: rippleEffect.map((i: any) => i.nodeId),
      impactScore,
      rippleEffect,
    };
  }

  /**
   * Root cause analysis
   * Traces back from a symptom to potential root causes
   */
  async analyzeRootCause(symptomNodeId: string): Promise<any[]> {
    if (!this.isAvailable()) return [];

    const query = `
      MATCH path = (root)-[*..5]->(symptom {id: $symptomNodeId})
      WHERE NOT ()-[]->(root)  // Root has no incoming edges

      WITH path, root, length(path) as depth
      ORDER BY depth DESC
      LIMIT 10

      RETURN {
        rootCauseId: root.id,
        rootCauseName: root.name,
        rootCauseType: labels(root)[0],
        pathLength: depth,
        confidenceScore: 1.0 / depth,
        path: [node in nodes(path) | {id: node.id, type: labels(node)[0]}]
      } as analysis
      ORDER BY confidenceScore DESC
    `;

    const result = await this.executeCypher(query, { symptomNodeId });
    if (!result) return [];

    return result.records.map(record => record.get('analysis'));
  }

  /**
   * Calculate critical path using PageRank
   */
  async calculateCriticalPath(projectId: string): Promise<string[]> {
    if (!this.isAvailable()) return [];

    // This requires Graph Data Science plugin
    const query = `
      MATCH (p:Project {id: $projectId})
      CALL gds.pageRank.stream({
        nodeProjection: 'Task',
        relationshipProjection: 'DEPENDS_ON',
        maxIterations: 20,
        dampingFactor: 0.85
      })
      YIELD nodeId, score

      RETURN gds.util.asNode(nodeId).id as taskId, score
      ORDER BY score DESC
      LIMIT 20
    `;

    try {
      const result = await this.executeCypher(query, { projectId });
      if (!result) return [];

      return result.records.map(record => record.get('taskId'));
    } catch (error: any) {
      console.warn('[GraphService] PageRank failed (GDS plugin may not be installed):', error.message);
      return [];
    }
  }

  /**
   * Close the Neo4j connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
      console.log('[GraphService] Neo4j connection closed');
    }
  }
}

// Singleton instance
let graphServiceInstance: GraphService | null = null;

export function getGraphService(): GraphService {
  if (!graphServiceInstance) {
    graphServiceInstance = new GraphService();
  }
  return graphServiceInstance;
}
