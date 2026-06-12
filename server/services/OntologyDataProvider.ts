/**
 * ONTOLOGY DATA PROVIDER
 *
 * The single interface for all data access in the application.
 * Implements ontology-first architecture where Palantir Foundry is the source of truth.
 *
 * All UI components and API endpoints should use this provider instead of:
 * - Direct PostgreSQL queries
 * - Direct MCP calls
 * - Hardcoded data
 *
 * Data flow:
 * UI -> OntologyDataProvider -> PalantirAIPService -> Palantir Foundry
 *                            -> Local cache (5-min TTL)
 */

import { PalantirAIPService, PalantirObject, PalantirSearchFilter } from '../mcp/PalantirAIPService';
import { OntologySchemaService, OntologyObjectType } from './OntologySchemaService';
import { PALANTIR_OBJECT_TYPES } from '../constants/palantirOntology.js';
import { createFalkorOntologyDataProvider } from './FalkorOntologyDataProvider.js';

export interface QueryOptions {
  pageSize?: number;
  pageToken?: string;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  select?: string[];
  // For filtering
  filters?: QueryFilter[];
  // For agent context
  agentId?: string;
  projectId?: string;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith';
  value: any;
}

export interface QueryResult<T = any> {
  data: T[];
  totalCount?: number;
  nextPageToken?: string;
  source: 'palantir' | 'falkordb' | 'cache' | 'fallback';
  objectType: string;
  queriedAt: Date;
}

export interface DashboardMetrics {
  projects: {
    total: number;
    active: number;
    atRisk: number;
    onTrack: number;
    delayed: number;
  };
  financials: {
    totalBudget: number;
    totalSpent: number;
    variance: number;
    variancePercent: number;
  };
  risks: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  okrs: {
    totalObjectives: number;
    onTrack: number;
    atRisk: number;
    avgProgress: number;
  };
}

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

export class OntologyDataProviderClass {
  protected palantirService: PalantirAIPService | null = null;
  protected cache = new Map<string, CacheEntry<any>>();
  protected defaultTTL = 5 * 60 * 1000; // 5 minutes
  protected isInitialized = false;
  // Local mirror: lets ingest service keep agent reads working even when
  // Palantir writes are rejected (e.g. unmapped action params). Palantir
  // remains the authoritative store; this is a transient overlay merged
  // into query() results and getById() lookups.
  protected localMirror = new Map<string, any[]>(); // objectType -> records

  /**
   * Inject (or replace) a local mirror record for a given object type.
   * Records are matched/replaced by their primary key field
   * (projectId, riskId, featureId, etc — falls back to `id`).
   */
  injectLocal(objectType: string, record: Record<string, any>): void {
    if (!record) return;
    const list = this.localMirror.get(objectType) || [];
    const pkField = this.primaryKeyField(objectType);
    const pkVal = record[pkField] ?? record.id ?? record.__primaryKey;
    if (pkVal != null) {
      const idx = list.findIndex(
        (r) => (r[pkField] ?? r.id ?? r.__primaryKey) === pkVal
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...record };
      } else {
        list.push(record);
      }
    } else {
      list.push(record);
    }
    this.localMirror.set(objectType, list);
    // Bust cache for this objectType so subsequent queries see the mirror
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${objectType}:`)) this.cache.delete(key);
    }
  }

  /** Heuristic primary key field per object type */
  protected primaryKeyField(objectType: string): string {
    const map: Record<string, string> = {
      AtlasProject: 'projectId',
      AtlasFeature: 'featureId',
      AtlasStory: 'storyId',
      AtlasTask: 'taskId',
      AtlasRisk: 'riskId',
      AtlasObjective: 'objectiveId',
      AtlasKeyResult: 'keyResultId',
      AtlasKpi: 'kpiId',
      AtlasGovernanceCheckpoint: 'checkpointId',
      AtlasDependency: 'dependencyId',
    };
    return map[objectType] || 'id';
  }

  /** Apply local-mirror entries on top of (possibly empty) Palantir results */
  protected mergeLocal(objectType: string, palantirData: any[], options: QueryOptions): any[] {
    const local = this.localMirror.get(objectType);
    if (!local || local.length === 0) return palantirData;
    // Apply filters to local mirror entries
    let filtered = local;
    if (options.filters && options.filters.length > 0) {
      filtered = local.filter((rec) =>
        options.filters!.every((f) => {
          const v = rec[f.field];
          switch (f.operator) {
            case 'eq': return v === f.value;
            case 'neq': return v !== f.value;
            case 'gt': return v > f.value;
            case 'gte': return v >= f.value;
            case 'lt': return v < f.value;
            case 'lte': return v <= f.value;
            case 'contains': return typeof v === 'string' && v.includes(f.value);
            case 'startsWith': return typeof v === 'string' && v.startsWith(f.value);
            default: return true;
          }
        })
      );
    }
    // Dedupe: prefer Palantir if same primary key exists
    const pkField = this.primaryKeyField(objectType);
    const palantirKeys = new Set(
      palantirData.map((r) => r?.[pkField] ?? r?.id ?? r?.__primaryKey).filter((v) => v != null)
    );
    const localOnly = filtered.filter(
      (r) => !palantirKeys.has(r[pkField] ?? r.id ?? r.__primaryKey)
    );
    return [...palantirData, ...localOnly];
  }

  /**
   * Initialize with Palantir service
   */
  async initialize(palantirService: PalantirAIPService): Promise<void> {
    this.palantirService = palantirService;

    // Initialize schema service
    await OntologySchemaService.initialize(palantirService);

    this.isInitialized = true;
    console.log('[OntologyDataProvider] Initialized with Palantir connection');
  }

  /**
   * Query objects of a specific type
   */
  async query<T = PalantirObject>(
    objectType: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    this.ensureInitialized();

    const cacheKey = this.buildCacheKey(objectType, options);

    // Check cache
    const cached = this.getFromCache<T[]>(cacheKey);
    if (cached) {
      const merged = this.mergeLocal(objectType, cached as any[], options);
      return {
        data: merged as T[],
        source: 'cache',
        objectType,
        queriedAt: new Date(),
      };
    }

    try {
      // Build Palantir query
      let result: { data: PalantirObject[]; nextPageToken?: string };

      if (options.filters && options.filters.length > 0) {
        const filter = this.buildPalantirFilter(options.filters);
        result = await this.palantirService!.searchObjects(objectType, filter, {
          pageSize: options.pageSize,
          pageToken: options.pageToken,
          orderBy: options.orderBy ? { fields: options.orderBy.map(o => ({ field: o.field, direction: o.direction })) } : undefined,
          select: options.select,
        });
      } else {
        result = await this.palantirService!.listObjects(objectType, {
          pageSize: options.pageSize,
          pageToken: options.pageToken,
          orderBy: options.orderBy?.[0]?.field,
          select: options.select,
        });
      }

      // Cache result
      this.setCache(cacheKey, result.data);

      const merged = this.mergeLocal(objectType, result.data, options);
      return {
        data: merged as T[],
        nextPageToken: result.nextPageToken,
        source: 'palantir',
        objectType,
        queriedAt: new Date(),
      };
    } catch (error: any) {
      console.error(`[OntologyDataProvider] Query failed for ${objectType}: ${error.message}`);

      const merged = this.mergeLocal(objectType, [], options);
      return {
        data: merged as T[],
        source: 'fallback',
        objectType,
        queriedAt: new Date(),
      };
    }
  }

  /**
   * Get a single object by ID
   */
  async getById<T = PalantirObject>(
    objectType: string,
    id: string,
    options: { select?: string[] } = {}
  ): Promise<T | null> {
    this.ensureInitialized();

    const cacheKey = `${objectType}:${id}`;
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.palantirService!.getObject(objectType, id, {
        select: options.select,
      });

      this.setCache(cacheKey, result);
      return result as T;
    } catch (error) {
      console.error(`[OntologyDataProvider] GetById failed for ${objectType}/${id}`);
      return null;
    }
  }

  /**
   * Get data for a specific agent
   */
  async getAgentData(
    agentId: string,
    options: QueryOptions = {}
  ): Promise<Map<string, QueryResult>> {
    this.ensureInitialized();

    const results = new Map<string, QueryResult>();

    // Get object types for this agent
    const objectTypes = await OntologySchemaService.getAgentObjectTypes(agentId);

    // Query each object type in parallel
    await Promise.all(
      objectTypes.map(async (objType) => {
        const queryOptions: QueryOptions = {
          ...options,
          agentId,
        };

        // Add project filter if specified
        if (options.projectId) {
          queryOptions.filters = [
            ...(queryOptions.filters || []),
            { field: 'projectId', operator: 'eq', value: options.projectId },
          ];
        }

        const result = await this.query(objType.apiName, queryOptions);
        results.set(objType.apiName, result);
      })
    );

    return results;
  }

  /**
   * Get dashboard metrics aggregated from ontology
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    this.ensureInitialized();

    const cacheKey = 'dashboard:metrics';
    const cached = this.getFromCache<DashboardMetrics>(cacheKey);
    if (cached) return cached;

    const [projectsResult, budgetsResult, risksResult, okrsResult] = await Promise.all([
      this.query(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 500 }),
      this.query('AtlasBudget', { pageSize: 100 }),
      this.query(PALANTIR_OBJECT_TYPES.RISK, { pageSize: 500 }),
      this.query(PALANTIR_OBJECT_TYPES.OKR, { pageSize: 500 }),
    ]);

    const projects = projectsResult.data;
    const budgets = budgetsResult.data;
    const risks = risksResult.data;
    const objectives = okrsResult.data;

    const safeProjects = projects.filter((p: any) => {
      const id = p.projectId || p.__primaryKey || '';
      const name = p.name || '';
      if (id.startsWith('feature-') || id.startsWith('story-') || id.startsWith('task-') ||
          id.startsWith('agent-') || id.startsWith('source-') || id.startsWith('div-') || id.startsWith('monday-') || id.startsWith('story-test-') || id.startsWith('test-div-')) return false;
      if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') ||
          name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') ||
          name.startsWith('[Monday]') || name.startsWith('[Jira')) return false;
      return true;
    });

    const projectMetrics = {
      total: safeProjects.length,
      active: safeProjects.filter((p: any) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'in progress').length,
      atRisk: safeProjects.filter((p: any) => p.status?.toLowerCase() === 'at risk').length,
      onTrack: safeProjects.filter((p: any) => p.status?.toLowerCase() === 'on track' || p.status?.toLowerCase() === 'complete').length,
      delayed: safeProjects.filter((p: any) => p.status?.toLowerCase() === 'delayed' || p.status?.toLowerCase() === 'blocked').length,
    };

    const totalBudget = budgets.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
    const totalSpent = budgets.reduce((sum: number, b: any) => sum + (b.spentAmount || 0), 0);
    const variance = totalBudget - totalSpent;

    const financialMetrics = {
      totalBudget,
      totalSpent,
      variance,
      variancePercent: totalBudget > 0 ? (variance / totalBudget) * 100 : 0,
    };

    const riskMetrics = {
      total: risks.length,
      critical: risks.filter((r: any) => (r.riskScore || 0) >= 8 || r.impact?.toLowerCase() === 'critical').length,
      high: risks.filter((r: any) => ((r.riskScore || 0) >= 6 && (r.riskScore || 0) < 8) || r.impact?.toLowerCase() === 'high').length,
      medium: risks.filter((r: any) => ((r.riskScore || 0) >= 4 && (r.riskScore || 0) < 6) || r.impact?.toLowerCase() === 'medium').length,
      low: risks.filter((r: any) => (r.riskScore || 0) < 4 || r.impact?.toLowerCase() === 'low').length,
    };

    // Calculate OKR metrics
    const avgProgress = objectives.length > 0
      ? objectives.reduce((sum: number, o: any) => sum + (parseFloat(o.progress) || 0), 0) / objectives.length
      : 0;

    const okrMetrics = {
      totalObjectives: objectives.length,
      onTrack: objectives.filter((o: any) => (parseFloat(o.progress) || 0) >= 70).length,
      atRisk: objectives.filter((o: any) => {
        const progress = parseFloat(o.progress) || 0;
        return progress < 70 && progress >= 40;
      }).length,
      avgProgress,
    };

    const metrics: DashboardMetrics = {
      projects: projectMetrics,
      financials: financialMetrics,
      risks: riskMetrics,
      okrs: okrMetrics,
    };

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get projects list with pagination
   */
  async getProjects(options: QueryOptions = {}): Promise<QueryResult> {
    return this.query(PALANTIR_OBJECT_TYPES.PROJECT, options);
  }

  /**
   * Get risks with optional filters
   */
  async getRisks(options: QueryOptions = {}): Promise<QueryResult> {
    return this.query(PALANTIR_OBJECT_TYPES.RISK, options);
  }

  /**
   * Get budgets/financial records
   */
  async getBudgets(options: QueryOptions = {}): Promise<QueryResult> {
    return this.query('AtlasBudget', options);
  }

  /**
   * Get OKRs (objectives and key results)
   */
  async getOKRs(options: QueryOptions = {}): Promise<{
    objectives: QueryResult;
    keyResults: QueryResult;
  }> {
    const [objectives, keyResults] = await Promise.all([
      this.query(PALANTIR_OBJECT_TYPES.OKR, options),
      this.query(PALANTIR_OBJECT_TYPES.OKR, options), // Key results are part of OKR
    ]);

    return { objectives, keyResults };
  }

  /**
   * Get insights generated by agents
   */
  async getInsights(options: QueryOptions = {}): Promise<QueryResult> {
    return this.query(PALANTIR_OBJECT_TYPES.INTERVENTION, options);
  }

  /**
   * Get teams data
   */
  async getTeams(options: QueryOptions = {}): Promise<QueryResult> {
    return this.query(PALANTIR_OBJECT_TYPES.DIVISION, options); // Teams map to Division
  }

  /**
   * Get all ontology object types
   */
  async getObjectTypes(): Promise<OntologyObjectType[]> {
    return OntologySchemaService.getAllObjectTypes();
  }

  /**
   * Invalidate cache for a specific key or pattern
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      console.log('[OntologyDataProvider] Cache cleared');
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[OntologyDataProvider] Invalidated ${keysToDelete.length} cache entries matching "${pattern}"`);
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Which graph/ontology backend is actively serving reads.
   * Overridden by the FalkorDB-backed provider.
   */
  getActiveBackend(): 'palantir' | 'falkordb' {
    return 'palantir';
  }

  /**
   * Status of the active ontology backend (for health/status surfaces).
   */
  async getBackendStatus(): Promise<{
    backend: 'palantir' | 'falkordb';
    ready: boolean;
    details?: Record<string, any>;
  }> {
    return { backend: this.getActiveBackend(), ready: this.isReady() };
  }

  // Private helpers

  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('OntologyDataProvider not initialized - call initialize() first');
    }
  }

  protected buildCacheKey(objectType: string, options: QueryOptions): string {
    const parts = [objectType];
    if (options.pageSize) parts.push(`ps:${options.pageSize}`);
    if (options.pageToken) parts.push(`pt:${options.pageToken}`);
    if (options.filters) parts.push(`f:${JSON.stringify(options.filters)}`);
    if (options.agentId) parts.push(`a:${options.agentId}`);
    if (options.projectId) parts.push(`p:${options.projectId}`);
    return parts.join(':');
  }

  private buildPalantirFilter(filters: QueryFilter[]): PalantirSearchFilter {
    if (filters.length === 1) {
      return this.convertFilter(filters[0]);
    }

    return {
      type: 'and',
      filters: filters.map(f => this.convertFilter(f)),
    };
  }

  private convertFilter(filter: QueryFilter): PalantirSearchFilter {
    const operatorMap: Record<string, string> = {
      eq: 'eq',
      neq: 'neq',
      gt: 'gt',
      gte: 'gte',
      lt: 'lt',
      lte: 'lte',
      contains: 'contains',
      startsWith: 'startsWith',
    };

    return {
      type: operatorMap[filter.operator] || 'eq',
      field: filter.field,
      value: filter.value,
    };
  }

  protected getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp.getTime();
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  protected setCache<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl,
    });
  }
}

// Singleton instance — env-gated backend selection (safe rollout):
// When FALKORDB_URL is set, the singleton is the FalkorDB-backed provider
// (same public interface; Palantir path is retained internally as fallback).
// Otherwise the original Palantir-backed provider is used unchanged.
export const OntologyDataProvider: OntologyDataProviderClass = process.env.FALKORDB_URL
  ? createFalkorOntologyDataProvider()
  : new OntologyDataProviderClass();
