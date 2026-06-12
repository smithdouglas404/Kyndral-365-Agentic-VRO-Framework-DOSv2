/**
 * FALKOR ONTOLOGY DATA PROVIDER
 *
 * FalkorDB-backed implementation of the OntologyDataProvider public interface.
 * Drop-in replacement for the Palantir-backed provider: same methods, same
 * return shapes (QueryResult / DashboardMetrics / etc.), so all consumers
 * (UI, /api/palantir/ontology/* routes, deep agents, ingest service) keep
 * working unchanged.
 *
 * Graph model:
 * - Each ontology object type (AtlasProject, AtlasFeature, AtlasStory,
 *   AtlasTask, AtlasRisk, AtlasObjective, ...) is a node label; object
 *   properties are node properties.
 * - Upserts use MERGE on the stable primary-key property of the object type
 *   (projectId, riskId, featureId, ... — see primaryKeyField()).
 * - Relations are edges: (child)-[:BELONGS_TO]->(:AtlasProject) for project
 *   membership, (:AtlasStory)-[:PART_OF]->(:AtlasFeature) etc. for
 *   parent/child, and (a)-[:DEPENDS_ON]->(b) for dependencies.
 *
 * Degradation: when FalkorDB is not configured/unreachable (or has no data
 * yet for a type), reads fall back to the inherited Palantir/local-mirror
 * path, so behavior degrades exactly like the original provider.
 *
 * NOTE: the subclass is defined inside a factory function (instead of at
 * module top level) to avoid the ESM circular-import TDZ problem — this
 * module and OntologyDataProvider.ts import each other, and `extends` must
 * not be evaluated until both module bodies have run.
 */

import { FalkorGraphService } from './FalkorGraphService.js';
import {
  OntologyDataProviderClass,
  type QueryFilter,
  type QueryOptions,
  type QueryResult,
} from './OntologyDataProvider.js';
import type { PalantirAIPService } from '../mcp/PalantirAIPService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Marker prefix for nested values stored as JSON strings on node properties */
const JSON_MARKER = '__json__';

/** Allow only safe identifier characters in labels / property names */
function sanitizeIdentifier(name: string): string {
  return String(name).replace(/[^A-Za-z0-9_]/g, '_');
}

/** Encode a JS value into a FalkorDB-storable property value */
function encodeValue(value: any): any {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON_MARKER + JSON.stringify(value);
  if (typeof value === 'function' || typeof value === 'symbol') return null;
  return value;
}

/** Decode a stored property value back into its original JS shape */
function decodeValue(value: any): any {
  if (typeof value === 'string' && value.startsWith(JSON_MARKER)) {
    try {
      return JSON.parse(value.slice(JSON_MARKER.length));
    } catch {
      return value;
    }
  }
  return value;
}

/** Cypher operator per QueryFilter operator */
const OP_MAP: Record<QueryFilter['operator'], string> = {
  eq: '=',
  neq: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  contains: 'CONTAINS',
  startsWith: 'STARTS WITH',
};

/** Parent/child edges per object type: childFkField -> parent label */
const PARENT_EDGES: Record<string, { field: string; parentType: string; rel: string }[]> = {
  AtlasFeature: [{ field: 'projectId', parentType: 'AtlasProject', rel: 'BELONGS_TO' }],
  AtlasStory: [
    { field: 'featureId', parentType: 'AtlasFeature', rel: 'PART_OF' },
    { field: 'projectId', parentType: 'AtlasProject', rel: 'BELONGS_TO' },
  ],
  AtlasTask: [
    { field: 'storyId', parentType: 'AtlasStory', rel: 'PART_OF' },
    { field: 'projectId', parentType: 'AtlasProject', rel: 'BELONGS_TO' },
  ],
  AtlasKeyResult: [
    { field: 'objectiveId', parentType: 'AtlasObjective', rel: 'PART_OF' },
    { field: 'projectId', parentType: 'AtlasProject', rel: 'BELONGS_TO' },
  ],
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a FalkorDB-backed OntologyDataProvider exposing the exact same
 * public interface as the Palantir-backed OntologyDataProviderClass.
 */
export function createFalkorOntologyDataProvider(): OntologyDataProviderClass {
  class FalkorOntologyDataProviderClass extends OntologyDataProviderClass {
    constructor() {
      super();
      if (FalkorGraphService.isConfigured()) {
        // Graph-backed reads do not require Palantir initialization;
        // mark ready so routes gated on isReady() serve from the graph.
        this.isInitialized = true;
        console.log(
          `[FalkorOntologyDataProvider] Active (graph: ${FalkorGraphService.getGraphName()}, url: ${FalkorGraphService.getUrl()})`
        );
      }
    }

    // -- Backend identification -------------------------------------------

    getActiveBackend(): 'palantir' | 'falkordb' {
      return 'falkordb';
    }

    async getBackendStatus(): Promise<{
      backend: 'palantir' | 'falkordb';
      ready: boolean;
      details?: Record<string, any>;
    }> {
      const connected = await FalkorGraphService.checkConnectivity();
      return {
        backend: 'falkordb',
        ready: this.isReady(),
        details: { ...FalkorGraphService.getStatus(), connected, fallback: 'palantir' },
      };
    }

    // -- Lifecycle ----------------------------------------------------------

    async initialize(palantirService: PalantirAIPService): Promise<void> {
      try {
        // Keep Palantir wired up as the fallback/secondary store
        await super.initialize(palantirService);
      } catch (error: any) {
        console.warn(
          `[FalkorOntologyDataProvider] Palantir fallback init failed (continuing with FalkorDB only): ${error?.message}`
        );
      }
      this.isInitialized = true;
      console.log('[FalkorOntologyDataProvider] Initialized — backend: falkordb (Palantir retained as fallback)');
    }

    // -- Reads ----------------------------------------------------------------

    async query<T = any>(objectType: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
      const cacheKey = `falkor:${this.buildCacheKey(objectType, options)}`;
      const cached = this.getFromCache<T[]>(cacheKey);
      if (cached) {
        return {
          data: this.mergeLocal(objectType, cached as any[], options) as T[],
          source: 'cache',
          objectType,
          queriedAt: new Date(),
        };
      }

      const rows = await this.queryGraph(objectType, options);
      if (rows !== null && rows.length > 0) {
        this.setCache(cacheKey, rows);
        const pageSize = options.pageSize ?? 100;
        const offset = parseInt(options.pageToken || '0', 10) || 0;
        return {
          data: this.mergeLocal(objectType, rows, options) as T[],
          nextPageToken: rows.length >= pageSize ? String(offset + pageSize) : undefined,
          source: 'falkordb',
          objectType,
          queriedAt: new Date(),
        };
      }

      // FalkorDB unreachable, or no graph data yet for this type:
      // degrade to the inherited Palantir + local-mirror path.
      return super.query<T>(objectType, options);
    }

    async getById<T = any>(
      objectType: string,
      id: string,
      options: { select?: string[] } = {}
    ): Promise<T | null> {
      const cacheKey = `falkor:${objectType}:${id}`;
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;

      const label = sanitizeIdentifier(objectType);
      const pkField = sanitizeIdentifier(this.primaryKeyField(objectType));
      const rows = await FalkorGraphService.query(
        `MATCH (n:\`${label}\`) WHERE n.\`${pkField}\` = $id OR n.\`id\` = $id RETURN n LIMIT 1`,
        { id }
      );

      const node = rows && rows.length > 0 ? (rows[0] as any).n : null;
      if (node) {
        const record = this.nodeToRecord(objectType, node);
        this.setCache(cacheKey, record);
        return record as T;
      }

      // Fall back to Palantir-backed lookup
      return super.getById<T>(objectType, id, options);
    }

    // -- Writes ---------------------------------------------------------------

    /**
     * Keep the local-mirror semantics of the base class, and additionally
     * persist the record to FalkorDB (MERGE on the stable id) — this is how
     * the ingest pipeline populates the graph.
     */
    injectLocal(objectType: string, record: Record<string, any>): void {
      super.injectLocal(objectType, record);
      void this.upsertObject(objectType, record);
    }

    /**
     * Upsert an ontology object as a graph node (MERGE on its stable primary
     * key) and maintain its relationship edges. Never throws.
     */
    async upsertObject(objectType: string, record: Record<string, any>): Promise<boolean> {
      if (!record || !FalkorGraphService.isConfigured()) return false;

      const label = sanitizeIdentifier(objectType);
      const pkField = this.primaryKeyField(objectType);
      const pkValue = record[pkField] ?? record.id ?? record.__primaryKey;
      if (pkValue == null) return false;

      const props: Record<string, any> = {};
      for (const [key, value] of Object.entries(record)) {
        if (key.startsWith('__')) continue;
        const encoded = encodeValue(value);
        if (encoded !== null) props[sanitizeIdentifier(key)] = encoded;
      }
      props[sanitizeIdentifier(pkField)] = encodeValue(pkValue);

      const result = await FalkorGraphService.query(
        `MERGE (n:\`${label}\` {\`${sanitizeIdentifier(pkField)}\`: $pk}) SET n += $props RETURN n`,
        { pk: encodeValue(pkValue), props }
      );
      if (result === null) return false;

      // Maintain relationship edges (project membership, parent/child)
      const edges = PARENT_EDGES[objectType] || (
        objectType !== 'AtlasProject' && record.projectId != null
          ? [{ field: 'projectId', parentType: 'AtlasProject', rel: 'BELONGS_TO' }]
          : []
      );
      for (const edge of edges) {
        const parentId = record[edge.field];
        if (parentId == null) continue;
        await this.createRelation(objectType, String(pkValue), edge.rel, edge.parentType, String(parentId));
      }

      // Dependency edges (AtlasDependency: predecessorId -> successorId)
      if (objectType === 'AtlasDependency' && record.predecessorId && record.successorId) {
        await FalkorGraphService.query(
          `MERGE (a {id: $from}) MERGE (b {id: $to}) MERGE (a)-[:DEPENDS_ON {dependencyId: $depId}]->(b)`,
          { from: String(record.predecessorId), to: String(record.successorId), depId: encodeValue(pkValue) }
        );
      }

      // Bust falkor read caches for this type
      this.invalidateCache(`falkor:${objectType}`);
      return true;
    }

    /** MERGE an edge between two ontology objects (creating stubs if needed) */
    async createRelation(
      fromType: string,
      fromId: string,
      relationType: string,
      toType: string,
      toId: string
    ): Promise<boolean> {
      if (!FalkorGraphService.isConfigured()) return false;
      const fromLabel = sanitizeIdentifier(fromType);
      const toLabel = sanitizeIdentifier(toType);
      const fromPk = sanitizeIdentifier(this.primaryKeyField(fromType));
      const toPk = sanitizeIdentifier(this.primaryKeyField(toType));
      const rel = sanitizeIdentifier(relationType).toUpperCase();

      const result = await FalkorGraphService.query(
        `MERGE (a:\`${fromLabel}\` {\`${fromPk}\`: $fromId}) ` +
          `MERGE (b:\`${toLabel}\` {\`${toPk}\`: $toId}) ` +
          `MERGE (a)-[:\`${rel}\`]->(b)`,
        { fromId, toId }
      );
      return result !== null;
    }

    // -- Internals --------------------------------------------------------------

    /** Run a filtered/paginated node query; null = FalkorDB unavailable */
    private async queryGraph(objectType: string, options: QueryOptions): Promise<any[] | null> {
      const label = sanitizeIdentifier(objectType);
      const params: Record<string, any> = {};
      const where: string[] = [];

      (options.filters || []).forEach((filter, i) => {
        const paramKey = `f${i}`;
        params[paramKey] = encodeValue(filter.value);
        const field = sanitizeIdentifier(filter.field);
        const op = OP_MAP[filter.operator] || '=';
        where.push(`n.\`${field}\` ${op} $${paramKey}`);
      });

      const orderBy = (options.orderBy || [])
        .map((o) => `n.\`${sanitizeIdentifier(o.field)}\` ${o.direction === 'desc' ? 'DESC' : 'ASC'}`)
        .join(', ');

      const limit = Math.max(1, options.pageSize ?? 100);
      const skip = Math.max(0, parseInt(options.pageToken || '0', 10) || 0);

      const cypher =
        `MATCH (n:\`${label}\`)` +
        (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
        ' RETURN n' +
        (orderBy ? ` ORDER BY ${orderBy}` : '') +
        ` SKIP ${skip} LIMIT ${limit}`;

      const data = await FalkorGraphService.query(cypher, params);
      if (data === null) return null;

      return data
        .map((row: any) => this.nodeToRecord(objectType, row?.n))
        .filter((r: any) => r != null);
    }

    /** Convert a FalkorDB node reply into the record shape consumers expect */
    private nodeToRecord(objectType: string, node: any): Record<string, any> | null {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return null;

      let rawProps: Record<string, any>;
      if (node.properties && typeof node.properties === 'object') {
        rawProps = node.properties as Record<string, any>;
      } else {
        // Some reply shapes inline properties on the node object itself —
        // strip the internal graph metadata fields.
        const { id: _id, labels: _labels, relationshipType: _rel, ...rest } = node;
        rawProps = rest;
      }

      const record: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawProps)) {
        record[key] = decodeValue(value);
      }

      // Mirror PalantirObject envelope fields so existing consumers
      // (which read p.__primaryKey / p.__apiName) keep working.
      const pkField = this.primaryKeyField(objectType);
      const pkValue = record[pkField] ?? record.id;
      record.__apiName = objectType;
      if (record.__primaryKey === undefined && pkValue !== undefined) {
        record.__primaryKey = pkValue;
      }
      return record;
    }
  }

  return new FalkorOntologyDataProviderClass();
}
