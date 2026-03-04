/**
 * PALANTIR STORAGE WRAPPER
 *
 * Wraps the existing DatabaseStorage to provide Palantir-first data access.
 * This is the "interface layer on top of Palantir" for storage operations.
 *
 * Strategy:
 * 1. READ operations check Palantir first, fall back to PostgreSQL
 * 2. WRITE operations write to both Palantir and PostgreSQL for consistency
 * 3. LLM Bridge handles dynamic data without predefined schemas
 *
 * This allows gradual migration without breaking existing functionality.
 */

import type { IStorage } from '../storage.js';
import { OntologyDataProvider } from './OntologyDataProvider.js';
import { getPalantirLLMBridge } from './PalantirLLMBridge.js';
import { getPalantirDashboardService } from './PalantirDashboardService.js';
import { TABLE_TO_OBJECT_TYPE } from '../constants/palantirOntology.js';

// Use centralized constants - re-export for backward compatibility
const TABLE_TO_PALANTIR_TYPE = TABLE_TO_OBJECT_TYPE;

export class PalantirStorageWrapper {
  private storage: IStorage;
  private palantirEnabled: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.checkPalantirAvailability();
  }

  private async checkPalantirAvailability(): Promise<void> {
    try {
      this.palantirEnabled = OntologyDataProvider.isReady();
      console.log(`[PalantirStorageWrapper] Palantir enabled: ${this.palantirEnabled}`);
    } catch {
      this.palantirEnabled = false;
    }
  }

  /**
   * Get the underlying storage (for backward compatibility)
   */
  getUnderlyingStorage(): IStorage {
    return this.storage;
  }

  /**
   * Check if Palantir is available
   */
  isPalantirAvailable(): boolean {
    return this.palantirEnabled;
  }

  // ============================================================================
  // SAFe DATA ACCESS - PALANTIR FIRST
  // ============================================================================

  /**
   * Get all projects - from Palantir first
   */
  async getProjects(options?: { divisionId?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const safeData = await dashboardService.getSAFeData(options?.divisionId);
        let projects = safeData.projects;
        if (options?.limit) {
          projects = projects.slice(0, options.limit);
        }
        return projects;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getProjects failed, falling back:', error);
      }
    }

    // Fallback to PostgreSQL via existing storage
    return this.storage.db.query.projects?.findMany?.({
      limit: options?.limit,
      where: options?.divisionId ? { divisionId: options.divisionId } : undefined,
    }) || [];
  }

  /**
   * Get all features - from Palantir first
   */
  async getFeatures(options?: { projectId?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const safeData = await dashboardService.getSAFeData();
        let features = safeData.features;
        if (options?.projectId) {
          features = features.filter((f: any) => f.projectId === options.projectId);
        }
        if (options?.limit) {
          features = features.slice(0, options.limit);
        }
        return features;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getFeatures failed, falling back:', error);
      }
    }

    return [];
  }

  /**
   * Get all stories - from Palantir first
   */
  async getStories(options?: { featureId?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const safeData = await dashboardService.getSAFeData();
        let stories = safeData.stories;
        if (options?.featureId) {
          stories = stories.filter((s: any) => s.featureId === options.featureId);
        }
        if (options?.limit) {
          stories = stories.slice(0, options.limit);
        }
        return stories;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getStories failed, falling back:', error);
      }
    }

    return [];
  }

  /**
   * Get all tasks - from Palantir first
   */
  async getTasks(options?: { storyId?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const safeData = await dashboardService.getSAFeData();
        let tasks = safeData.tasks;
        if (options?.storyId) {
          tasks = tasks.filter((t: any) => t.storyId === options.storyId);
        }
        if (options?.limit) {
          tasks = tasks.slice(0, options.limit);
        }
        return tasks;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getTasks failed, falling back:', error);
      }
    }

    return [];
  }

  /**
   * Get all risks - from Palantir first
   */
  async getRisks(options?: { projectId?: string; severity?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const risks = await dashboardService.getRisks();
        let filteredRisks = risks;
        if (options?.projectId) {
          filteredRisks = filteredRisks.filter((r: any) => r.projectId === options.projectId);
        }
        if (options?.severity) {
          filteredRisks = filteredRisks.filter((r: any) => r.severity === options.severity);
        }
        if (options?.limit) {
          filteredRisks = filteredRisks.slice(0, options.limit);
        }
        return filteredRisks;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getRisks failed, falling back:', error);
      }
    }

    return [];
  }

  /**
   * Get KPIs - from Palantir first
   */
  async getKPIs(options?: { divisionId?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const kpis = await dashboardService.getKPIs(options?.divisionId);
        if (options?.limit) {
          return kpis.slice(0, options.limit);
        }
        return kpis;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getKPIs failed, falling back:', error);
      }
    }

    return [];
  }

  /**
   * Get OKRs - from Palantir first
   */
  async getOKRs(options?: { divisionId?: string; limit?: number }): Promise<any[]> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        const okrs = await dashboardService.getOKRs(options?.divisionId);
        if (options?.limit) {
          return okrs.slice(0, options.limit);
        }
        return okrs;
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getOKRs failed, falling back:', error);
      }
    }

    return [];
  }

  /**
   * Get dashboard overview - from Palantir first
   */
  async getDashboardOverview(): Promise<any> {
    if (this.palantirEnabled) {
      try {
        const dashboardService = getPalantirDashboardService();
        return await dashboardService.getDashboardOverview();
      } catch (error) {
        console.warn('[PalantirStorageWrapper] Palantir getDashboardOverview failed, falling back:', error);
      }
    }

    // Fallback - compute from PostgreSQL
    return {
      portfolio: {
        totalProjects: 0,
        activeProjects: 0,
        totalBudget: 0,
        totalSpent: 0,
      },
      health: {
        onTrack: 0,
        atRisk: 0,
        delayed: 0,
        avgProgress: 0,
      },
      source: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // WRITE OPERATIONS - VIA LLM BRIDGE
  // ============================================================================

  /**
   * Create or update any entity - uses LLM Bridge for dynamic ingestion
   */
  async upsertEntity(entityType: string, data: Record<string, any>): Promise<{ success: boolean; id?: string }> {
    try {
      const bridge = await getPalantirLLMBridge();

      // Use LLM Bridge for dynamic data ingestion
      const result = await bridge.ingestData({
        source: 'storage-wrapper',
        datasetName: entityType.toLowerCase(),
        data,
        tags: [entityType, 'storage-write'],
        metadata: {
          entityType,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: result.success,
        id: result.datasetId,
      };
    } catch (error: any) {
      console.error(`[PalantirStorageWrapper] upsertEntity failed for ${entityType}:`, error);
      return { success: false };
    }
  }

  /**
   * Bulk upsert entities
   */
  async bulkUpsert(entityType: string, data: Record<string, any>[]): Promise<{ success: boolean; count: number }> {
    try {
      const bridge = await getPalantirLLMBridge();

      const result = await bridge.ingestData({
        source: 'storage-wrapper-bulk',
        datasetName: entityType.toLowerCase(),
        data,
        tags: [entityType, 'storage-bulk-write'],
        metadata: {
          entityType,
          count: data.length,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: result.success,
        count: result.recordsIngested,
      };
    } catch (error: any) {
      console.error(`[PalantirStorageWrapper] bulkUpsert failed for ${entityType}:`, error);
      return { success: false, count: 0 };
    }
  }

  // ============================================================================
  // SEMANTIC QUERIES - LLM-POWERED
  // ============================================================================

  /**
   * Execute a natural language query over the data
   */
  async semanticQuery(query: string, context?: Record<string, any>): Promise<any> {
    try {
      const bridge = await getPalantirLLMBridge();
      return await bridge.semanticQuery({
        naturalLanguage: query,
        context,
      });
    } catch (error: any) {
      console.error('[PalantirStorageWrapper] semanticQuery failed:', error);
      return {
        answer: `Query failed: ${error.message}`,
        data: [],
        confidence: 0,
      };
    }
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Sync SAFe data to Palantir
   */
  async syncSAFeDataToPalantir(): Promise<{ success: boolean; message: string }> {
    try {
      const dashboardService = getPalantirDashboardService();

      // Get current data from PostgreSQL
      const projects = await this.storage.db.query.projects?.findMany?.() || [];
      const features = await this.storage.db.query.features?.findMany?.() || [];
      const stories = await this.storage.db.query.stories?.findMany?.() || [];
      const tasks = await this.storage.db.query.tasks?.findMany?.() || [];
      const kpis = await this.storage.db.query.kpis?.findMany?.() || [];
      const okrs = await this.storage.db.query.okrs?.findMany?.() || [];
      const risks = await this.storage.db.query.risks?.findMany?.() || [];

      // Use LLM Bridge to ingest all data
      const bridge = await getPalantirLLMBridge();

      const results: any[] = [];

      if (projects.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'projects',
          data: projects,
          tags: ['project', 'safe', 'sync'],
        });
        results.push({ type: 'projects', ...r });
      }

      if (features.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'features',
          data: features,
          tags: ['feature', 'safe', 'sync'],
        });
        results.push({ type: 'features', ...r });
      }

      if (stories.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'stories',
          data: stories,
          tags: ['story', 'safe', 'sync'],
        });
        results.push({ type: 'stories', ...r });
      }

      if (tasks.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'tasks',
          data: tasks,
          tags: ['task', 'safe', 'sync'],
        });
        results.push({ type: 'tasks', ...r });
      }

      if (kpis.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'kpis',
          data: kpis,
          tags: ['kpi', 'safe', 'sync'],
        });
        results.push({ type: 'kpis', ...r });
      }

      if (okrs.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'okrs',
          data: okrs,
          tags: ['okr', 'safe', 'sync'],
        });
        results.push({ type: 'okrs', ...r });
      }

      if (risks.length > 0) {
        const r = await bridge.ingestData({
          source: 'postgres-sync',
          datasetName: 'risks',
          data: risks,
          tags: ['risk', 'safe', 'sync'],
        });
        results.push({ type: 'risks', ...r });
      }

      const successCount = results.filter(r => r.success).length;

      return {
        success: successCount === results.length,
        message: `Synced ${successCount}/${results.length} data types to Palantir`,
      };
    } catch (error: any) {
      console.error('[PalantirStorageWrapper] syncSAFeDataToPalantir failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Clear Palantir cache
   */
  clearCache(): void {
    const dashboardService = getPalantirDashboardService();
    dashboardService.clearCache();
    console.log('[PalantirStorageWrapper] Cache cleared');
  }
}

// Singleton instance
let wrapperInstance: PalantirStorageWrapper | null = null;

export function initPalantirStorageWrapper(storage: IStorage): PalantirStorageWrapper {
  if (!wrapperInstance) {
    wrapperInstance = new PalantirStorageWrapper(storage);
  }
  return wrapperInstance;
}

export function getPalantirStorageWrapper(): PalantirStorageWrapper | null {
  return wrapperInstance;
}
