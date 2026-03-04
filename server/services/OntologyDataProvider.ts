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
  source: 'palantir' | 'cache' | 'fallback';
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

class OntologyDataProviderClass {
  private palantirService: PalantirAIPService | null = null;
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;

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
      return {
        data: cached,
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

      return {
        data: result.data as T[],
        nextPageToken: result.nextPageToken,
        source: 'palantir',
        objectType,
        queriedAt: new Date(),
      };
    } catch (error: any) {
      console.error(`[OntologyDataProvider] Query failed for ${objectType}: ${error.message}`);

      // Return empty result on error
      return {
        data: [],
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

    // Fetch all relevant data in parallel
    const [projectsResult, budgetsResult, risksResult, okrsResult] = await Promise.all([
      this.query(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 500 }),
      this.query(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 500 }), // Budget is on Project
      this.query(PALANTIR_OBJECT_TYPES.RISK, { pageSize: 500 }),
      this.query(PALANTIR_OBJECT_TYPES.OKR, { pageSize: 500 }),
    ]);

    const projects = projectsResult.data;
    const budgets = budgetsResult.data;
    const risks = risksResult.data;
    const objectives = okrsResult.data;

    // Calculate project metrics
    const projectMetrics = {
      total: projects.length,
      active: projects.filter((p: any) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'in progress').length,
      atRisk: projects.filter((p: any) => p.healthStatus?.toLowerCase() === 'at_risk' || p.status?.toLowerCase() === 'at risk').length,
      onTrack: projects.filter((p: any) => p.healthStatus?.toLowerCase() === 'on_track' || p.status?.toLowerCase() === 'on track').length,
      delayed: projects.filter((p: any) => p.healthStatus?.toLowerCase() === 'delayed' || p.status?.toLowerCase() === 'delayed').length,
    };

    // Calculate financial metrics
    const totalBudget = budgets.reduce((sum: number, b: any) => sum + (parseFloat(b.plannedBudget) || 0), 0);
    const totalSpent = budgets.reduce((sum: number, b: any) => sum + (parseFloat(b.actualSpend) || 0), 0);
    const variance = totalBudget - totalSpent;

    const financialMetrics = {
      totalBudget,
      totalSpent,
      variance,
      variancePercent: totalBudget > 0 ? (variance / totalBudget) * 100 : 0,
    };

    // Calculate risk metrics
    const riskMetrics = {
      total: risks.length,
      critical: risks.filter((r: any) => r.severity?.toLowerCase() === 'critical' || r.priority === 1).length,
      high: risks.filter((r: any) => r.severity?.toLowerCase() === 'high' || r.priority === 2).length,
      medium: risks.filter((r: any) => r.severity?.toLowerCase() === 'medium' || r.priority === 3).length,
      low: risks.filter((r: any) => r.severity?.toLowerCase() === 'low' || r.priority >= 4).length,
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
    return this.query(PALANTIR_OBJECT_TYPES.PROJECT, options); // Budget is on Project
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

  // Private helpers

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('OntologyDataProvider not initialized - call initialize() first');
    }
  }

  private buildCacheKey(objectType: string, options: QueryOptions): string {
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

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp.getTime();
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl,
    });
  }
}

// Singleton instance
export const OntologyDataProvider = new OntologyDataProviderClass();
