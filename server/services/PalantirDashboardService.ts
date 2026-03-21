/**
 * PALANTIR DASHBOARD SERVICE
 *
 * Source of Truth: PALANTIR FOUNDRY
 *
 * This service provides all dashboard data from Palantir Ontology.
 * PostgreSQL is only used as fallback during transition period.
 *
 * All widgets, agents, and dashboards should read from this service.
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import type { PalantirAIPService } from '../mcp/PalantirAIPService.js';
import { db } from '../db.js';
import {
  projects, features, stories, tasks,
  divisions, divisionKpis, divisionOkrs,
  enterpriseRisks, risks, issues
} from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { PALANTIR_OBJECT_TYPES } from '../constants/palantirOntology.js';

// Cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

export interface DashboardOverview {
  portfolio: {
    totalProjects: number;
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    avgProgress: number;
    avgCPI: number;
    avgSPI: number;
  };
  health: {
    onTrack: number;
    atRisk: number;
    critical: number;
    healthScore: number;
  };
  risks: {
    total: number;
    high: number;
    active: number;
  };
  issues: {
    total: number;
    critical: number;
    open: number;
  };
  source: 'palantir' | 'postgres' | 'cache';
  timestamp: string;
}

export interface SAFeData {
  projects: any[];
  features: any[];
  stories: any[];
  tasks: any[];
  valueStreams: any[];
  kpis: any[];
  okrs: any[];
  risks: any[];
  metrics: {
    totalProjects: number;
    totalFeatures: number;
    totalStories: number;
    totalTasks: number;
    completionRate: number;
    velocity: number;
  };
  source: 'palantir' | 'postgres' | 'cache';
  timestamp: string;
}

class PalantirDashboardServiceClass {
  private palantir: PalantirAIPService | null = null;
  private usePalantirSource = true;

  constructor() {
    this.palantir = getPalantirService();
    if (!this.palantir) {
      console.log('[PalantirDashboard] Palantir not available - using PostgreSQL fallback');
      this.usePalantirSource = false;
    } else {
      console.log('[PalantirDashboard] Initialized with Palantir as SOURCE OF TRUTH');
    }
  }

  /**
   * Check if Palantir is available as source of truth
   */
  isPalantirAvailable(): boolean {
    return this.palantir !== null;
  }

  /**
   * Get dashboard overview metrics
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const cacheKey = 'dashboard:overview';
    const cached = getFromCache<DashboardOverview>(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    try {
      // Try Palantir first
      if (this.palantir && this.usePalantirSource) {
        const overview = await this.getDashboardOverviewFromPalantir();
        setCache(cacheKey, overview);
        return overview;
      }
    } catch (error: any) {
      console.warn('[PalantirDashboard] Palantir fetch failed, using PostgreSQL:', error.message);
    }

    // Fallback to PostgreSQL
    const overview = await this.getDashboardOverviewFromPostgres();
    setCache(cacheKey, overview);
    return overview;
  }

  /**
   * Get all SAFe data (projects, features, stories, tasks, KPIs, OKRs, risks)
   */
  async getSAFeData(divisionId?: string): Promise<SAFeData> {
    const cacheKey = `safe:${divisionId || 'all'}`;
    const cached = getFromCache<SAFeData>(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    try {
      // Try Palantir first
      if (this.palantir && this.usePalantirSource) {
        const safeData = await this.getSAFeDataFromPalantir(divisionId);
        setCache(cacheKey, safeData);
        return safeData;
      }
    } catch (error: any) {
      console.warn('[PalantirDashboard] Palantir SAFe fetch failed, using PostgreSQL:', error.message);
    }

    // Fallback to PostgreSQL
    const safeData = await this.getSAFeDataFromPostgres(divisionId);
    setCache(cacheKey, safeData);
    return safeData;
  }

  /**
   * Get KPIs for a division - SOURCE OF TRUTH: PALANTIR ONLY
   */
  async getKPIs(divisionId?: string): Promise<any[]> {
    const cacheKey = `kpis:${divisionId || 'all'}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    // Re-check Palantir connection (may have connected after startup)
    if (!this.palantir) {
      this.palantir = getPalantirService();
      if (this.palantir) {
        this.usePalantirSource = true;
        console.log('[PalantirDashboard] Palantir now available for KPIs');
      }
    }

    if (!this.palantir) {
      throw new Error('Palantir not available - KPIs require Palantir connection');
    }

    const kpis = await this.getKPIsFromPalantir(divisionId);
    setCache(cacheKey, kpis);
    return kpis;
  }

  /**
   * Get OKRs for a division - SOURCE OF TRUTH: PALANTIR ONLY
   */
  async getOKRs(divisionId?: string): Promise<any[]> {
    const cacheKey = `okrs:${divisionId || 'all'}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    // Re-check Palantir connection (may have connected after startup)
    if (!this.palantir) {
      this.palantir = getPalantirService();
      if (this.palantir) {
        this.usePalantirSource = true;
        console.log('[PalantirDashboard] Palantir now available for OKRs');
      }
    }

    if (!this.palantir) {
      throw new Error('Palantir not available - OKRs require Palantir connection');
    }

    const okrs = await this.getOKRsFromPalantir(divisionId);
    setCache(cacheKey, okrs);
    return okrs;
  }

  /**
   * Get risks (enterprise-level)
   */
  async getRisks(): Promise<any[]> {
    const cacheKey = 'risks:all';
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      if (this.palantir && this.usePalantirSource) {
        const riskData = await this.getRisksFromPalantir();
        setCache(cacheKey, riskData);
        return riskData;
      }
    } catch (error: any) {
      console.warn('[PalantirDashboard] Risk fetch failed:', error.message);
    }

    const riskData = await this.getRisksFromPostgres();
    setCache(cacheKey, riskData);
    return riskData;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    cache.clear();
    console.log('[PalantirDashboard] Cache cleared');
  }

  // ============================================================================
  // PALANTIR DATA FETCHERS
  // ============================================================================

  private async getDashboardOverviewFromPalantir(): Promise<DashboardOverview> {
    if (!this.palantir) throw new Error('Palantir not available');

    // Fetch projects from Palantir
    const projectsResult = await this.palantir.listObjects(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 500 });
    const projectList = projectsResult.data || [];

    // Calculate metrics
    const activeProjects = projectList.filter((p: any) =>
      p.status?.toLowerCase().includes('progress') || p.status === 'active' || p.status === 'In Progress'
    );

    const totalBudget = activeProjects.reduce((sum: number, p: any) =>
      sum + parseFloat(p.budgetTotal || p.budget || '0'), 0);
    const totalSpent = activeProjects.reduce((sum: number, p: any) =>
      sum + parseFloat(p.budgetSpent || p.actualCost || '0'), 0);
    const avgProgress = activeProjects.length > 0
      ? activeProjects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / activeProjects.length
      : 0;
    const avgCPI = activeProjects.length > 0
      ? activeProjects.reduce((sum: number, p: any) => sum + (p.cpiValue || 1.0), 0) / activeProjects.length
      : 1.0;
    const avgSPI = activeProjects.length > 0
      ? activeProjects.reduce((sum: number, p: any) => sum + (p.spiValue || 1.0), 0) / activeProjects.length
      : 1.0;

    const onTrack = activeProjects.filter((p: any) => {
      const cpi = p.cpiValue || 1.0;
      const spi = p.spiValue || 1.0;
      return cpi >= 0.95 && spi >= 0.95;
    }).length;

    const atRisk = activeProjects.filter((p: any) => {
      const cpi = p.cpiValue || 1.0;
      const spi = p.spiValue || 1.0;
      return (cpi < 0.95 && cpi >= 0.85) || (spi < 0.95 && spi >= 0.85);
    }).length;

    const critical = activeProjects.filter((p: any) => {
      const cpi = p.cpiValue || 1.0;
      const spi = p.spiValue || 1.0;
      return cpi < 0.85 || spi < 0.85;
    }).length;

    // Fetch risks
    let riskList: any[] = [];
    try {
      const risksResult = await this.palantir.listObjects(PALANTIR_OBJECT_TYPES.RISK, { pageSize: 200 });
      riskList = risksResult.data || [];
    } catch (e) {
      // Risk object type might not exist
    }

    const activeRisks = riskList.filter((r: any) => r.status !== 'closed');
    const highRisks = riskList.filter((r: any) => r.severity === 'high' || r.severity === 'critical');

    return {
      portfolio: {
        totalProjects: activeProjects.length,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        avgProgress: Math.round(avgProgress),
        avgCPI: Number(avgCPI.toFixed(3)),
        avgSPI: Number(avgSPI.toFixed(3)),
      },
      health: {
        onTrack,
        atRisk,
        critical,
        healthScore: activeProjects.length > 0 ? Math.round((onTrack / activeProjects.length) * 100) : 0,
      },
      risks: {
        total: riskList.length,
        high: highRisks.length,
        active: activeRisks.length,
      },
      issues: {
        total: 0,
        critical: 0,
        open: 0,
      },
      source: 'palantir',
      timestamp: new Date().toISOString(),
    };
  }

  private async getSAFeDataFromPalantir(divisionId?: string): Promise<SAFeData> {
    if (!this.palantir) throw new Error('Palantir not available');

    // Fetch all SAFe entities from Palantir
    // Note: Features, Stories, Tasks are stored as Project with prefixed names
    const [projectsResult, divisionsResult, kpisResult, okrsResult, risksResult] = await Promise.all([
      this.palantir.listObjects(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 1000 }),
      this.palantir.listObjects(PALANTIR_OBJECT_TYPES.DIVISION, { pageSize: 100 }),
      this.palantir.listObjects(PALANTIR_OBJECT_TYPES.KPI, { pageSize: 500 }),
      this.palantir.listObjects(PALANTIR_OBJECT_TYPES.OKR, { pageSize: 100 }),
      this.palantir.listObjects(PALANTIR_OBJECT_TYPES.RISK, { pageSize: 200 }),
    ].map(p => p.catch(() => ({ data: [] }))));

    const allProjects = projectsResult.data || [];

    // Separate Projects, Features, Stories, Tasks by prefix in name or project_id
    // Filter out all non-project items: agents, integrations, divisions, Monday boards, Jira epics
    let projectList = allProjects.filter((p: any) => {
      const id = p.project_id || p.projectId || p.__primaryKey?.project_id || '';
      const name = p.name || '';
      if (id.startsWith('feature-') || id.startsWith('story-') || id.startsWith('task-') ||
          id.startsWith('agent-') || id.startsWith('source-') || id.startsWith('div-') || id.startsWith('monday-') || id.startsWith('story-test-') || id.startsWith('test-div-')) return false;
      if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') ||
          name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') ||
          name.startsWith('[Monday]') || name.startsWith('[Jira')) return false;
      return true;
    });

    let featureList = allProjects.filter((p: any) => {
      const id = p.project_id || p.projectId || p.__primaryKey?.project_id || '';
      const name = p.name || '';
      return id.startsWith('feature-') || name.startsWith('[Feature]');
    });

    let storyList = allProjects.filter((p: any) => {
      const id = p.project_id || p.projectId || p.__primaryKey?.project_id || '';
      const name = p.name || '';
      return id.startsWith('story-') || name.startsWith('[Story]');
    });

    let taskList = allProjects.filter((p: any) => {
      const id = p.project_id || p.projectId || p.__primaryKey?.project_id || '';
      const name = p.name || '';
      return id.startsWith('task-') || name.startsWith('[Task]');
    });

    // Filter by division/transformation if specified
    if (divisionId) {
      projectList = projectList.filter((p: any) =>
        p.divisionId === divisionId || p.transformation_id === divisionId
      );
      featureList = featureList.filter((f: any) =>
        f.transformation_id === divisionId || projectList.some((p: any) => f.transformation_id === p.project_id)
      );
    }

    const totalStoryPoints = featureList.reduce((sum: number, f: any) =>
      sum + parseFloat(f.storyPoints || f.story_points || '0'), 0);
    const completedPoints = featureList.reduce((sum: number, f: any) =>
      sum + parseFloat(f.completedPoints || f.completed_points || '0'), 0);

    return {
      projects: projectList,
      features: featureList,
      stories: storyList,
      tasks: taskList,
      valueStreams: divisionsResult.data || [],
      kpis: kpisResult.data || [],
      okrs: okrsResult.data || [],
      risks: risksResult.data || [],
      metrics: {
        totalProjects: projectList.length,
        totalFeatures: featureList.length,
        totalStories: storyList.length,
        totalTasks: taskList.length,
        completionRate: totalStoryPoints > 0 ? (completedPoints / totalStoryPoints) * 100 : 0,
        velocity: Math.round(completedPoints / 4), // Assuming 4 sprints
      },
      source: 'palantir',
      timestamp: new Date().toISOString(),
    };
  }

  private async getKPIsFromPalantir(divisionId?: string): Promise<any[]> {
    if (!this.palantir) throw new Error('Palantir not available');

    const result = await this.palantir.listObjects(PALANTIR_OBJECT_TYPES.KPI, { pageSize: 500 });
    let kpis = result.data || [];

    if (divisionId) {
      kpis = kpis.filter((k: any) =>
        k.divisionId === divisionId || k.project_id === divisionId
      );
    }

    return kpis;
  }

  private async getOKRsFromPalantir(divisionId?: string): Promise<any[]> {
    if (!this.palantir) throw new Error('Palantir not available');

    const result = await this.palantir.listObjects(PALANTIR_OBJECT_TYPES.OKR, { pageSize: 100 });
    let okrs = result.data || [];

    if (divisionId) {
      okrs = okrs.filter((o: any) =>
        o.divisionId === divisionId || o.objective_id?.includes(divisionId)
      );
    }

    return okrs;
  }

  private async getRisksFromPalantir(): Promise<any[]> {
    if (!this.palantir) throw new Error('Palantir not available');

    const result = await this.palantir.listObjects(PALANTIR_OBJECT_TYPES.RISK, { pageSize: 200 });
    return result.data || [];
  }

  // ============================================================================
  // POSTGRESQL FALLBACK FETCHERS
  // ============================================================================

  private async getDashboardOverviewFromPostgres(): Promise<DashboardOverview> {
    const allProjects = await db.select().from(projects);
    const activeProjects = allProjects.filter(p =>
      p.status?.toLowerCase().includes('progress') || p.status === 'active' || p.status === 'In Progress'
    );

    const totalBudget = activeProjects.reduce((sum, p) =>
      sum + parseFloat(p.budgetTotal || p.budget || '0'), 0);
    const totalSpent = activeProjects.reduce((sum, p) =>
      sum + parseFloat(p.budgetSpent || p.actualCost || '0'), 0);
    const avgProgress = activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjects.length
      : 0;
    const avgCPI = activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + (p.cpiValue || 1.0), 0) / activeProjects.length
      : 1.0;
    const avgSPI = activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + (p.spiValue || 1.0), 0) / activeProjects.length
      : 1.0;

    const onTrack = activeProjects.filter(p => {
      const cpi = p.cpiValue || 1.0;
      const spi = p.spiValue || 1.0;
      return cpi >= 0.95 && spi >= 0.95;
    }).length;

    const atRisk = activeProjects.filter(p => {
      const cpi = p.cpiValue || 1.0;
      const spi = p.spiValue || 1.0;
      return (cpi < 0.95 && cpi >= 0.85) || (spi < 0.95 && spi >= 0.85);
    }).length;

    const critical = activeProjects.filter(p => {
      const cpi = p.cpiValue || 1.0;
      const spi = p.spiValue || 1.0;
      return cpi < 0.85 || spi < 0.85;
    }).length;

    const allRisks = await db.select().from(enterpriseRisks);
    const highRisks = allRisks.filter(r => r.severity === 'high' || r.severity === 'critical');

    const allIssues = await db.select().from(issues);
    const openIssues = allIssues.filter(i => i.status === 'open' || i.status === 'in-progress');
    const criticalIssues = openIssues.filter(i => i.priority === 'critical' || i.priority === 'high');

    return {
      portfolio: {
        totalProjects: activeProjects.length,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        avgProgress: Math.round(avgProgress),
        avgCPI: Number(avgCPI.toFixed(3)),
        avgSPI: Number(avgSPI.toFixed(3)),
      },
      health: {
        onTrack,
        atRisk,
        critical,
        healthScore: activeProjects.length > 0 ? Math.round((onTrack / activeProjects.length) * 100) : 0,
      },
      risks: {
        total: allRisks.length,
        high: highRisks.length,
        active: allRisks.length,
      },
      issues: {
        total: openIssues.length,
        critical: criticalIssues.length,
        open: openIssues.length,
      },
      source: 'postgres',
      timestamp: new Date().toISOString(),
    };
  }

  private async getSAFeDataFromPostgres(divisionId?: string): Promise<SAFeData> {
    let projectList = await db.select().from(projects);
    let featureList = await db.select().from(features);
    let storyList = await db.select().from(stories);
    let taskList = await db.select().from(tasks);
    const valueStreamList = await db.select().from(divisions);
    const kpiList = await db.select().from(divisionKpis);
    const okrList = await db.select().from(divisionOkrs);
    const riskList = await db.select().from(enterpriseRisks);

    // Filter by division if specified
    if (divisionId) {
      projectList = projectList.filter(p => p.divisionId === divisionId);
      const projectIds = new Set(projectList.map(p => p.id));
      featureList = featureList.filter(f => projectIds.has(f.projectId));
      const featureIds = new Set(featureList.map(f => f.id));
      storyList = storyList.filter(s => featureIds.has(s.featureId));
      const storyIds = new Set(storyList.map(s => s.id));
      taskList = taskList.filter(t => storyIds.has(t.storyId));
    }

    const totalStoryPoints = featureList.reduce((sum, f) =>
      sum + parseFloat(f.storyPoints || '0'), 0);
    const completedPoints = featureList.reduce((sum, f) =>
      sum + parseFloat(f.completedPoints || '0'), 0);

    return {
      projects: projectList,
      features: featureList,
      stories: storyList,
      tasks: taskList,
      valueStreams: valueStreamList,
      kpis: kpiList,
      okrs: okrList,
      risks: riskList,
      metrics: {
        totalProjects: projectList.length,
        totalFeatures: featureList.length,
        totalStories: storyList.length,
        totalTasks: taskList.length,
        completionRate: totalStoryPoints > 0 ? (completedPoints / totalStoryPoints) * 100 : 0,
        velocity: Math.round(completedPoints / 4),
      },
      source: 'postgres',
      timestamp: new Date().toISOString(),
    };
  }

  private async getKPIsFromPostgres(divisionId?: string): Promise<any[]> {
    if (divisionId) {
      return db.select().from(divisionKpis).where(eq(divisionKpis.divisionId, divisionId));
    }
    return db.select().from(divisionKpis);
  }

  private async getOKRsFromPostgres(divisionId?: string): Promise<any[]> {
    if (divisionId) {
      return db.select().from(divisionOkrs).where(eq(divisionOkrs.divisionId, divisionId));
    }
    return db.select().from(divisionOkrs);
  }

  private async getRisksFromPostgres(): Promise<any[]> {
    return db.select().from(enterpriseRisks);
  }
}

// Singleton instance
let _service: PalantirDashboardServiceClass | null = null;

export function getPalantirDashboardService(): PalantirDashboardServiceClass {
  if (!_service) {
    _service = new PalantirDashboardServiceClass();
  }
  return _service;
}

export const PalantirDashboardService = {
  getInstance: getPalantirDashboardService,
};
