/**
 * PALANTIR STORAGE ADAPTER
 *
 * Source of Truth: PALANTIR FOUNDRY
 *
 * This adapter wraps the IStorage interface and redirects READ operations
 * to Palantir while maintaining PostgreSQL for WRITE operations during transition.
 *
 * Used by: Analytics Engines, Dashboard Services, API Routes
 */

import type { IStorage } from '../storage.js';
import { getPalantirDashboardService } from './PalantirDashboardService.js';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import type { Project, Feature, Story, Task, Dependency, Resource, ProjectMetric } from '@shared/schema';
import { PALANTIR_OBJECT_TYPES } from '../constants/palantirOntology.js';

export class PalantirStorageAdapter implements Partial<IStorage> {
  private palantirDashboard = getPalantirDashboardService();
  private palantirService = getPalantirService();
  private fallbackStorage: IStorage;

  constructor(fallbackStorage: IStorage) {
    this.fallbackStorage = fallbackStorage;
    console.log('[PalantirStorage] Initialized - Palantir is SOURCE OF TRUTH');
  }

  // Expose db for compatibility
  get db() {
    return this.fallbackStorage.db;
  }

  /**
   * Get all projects from Palantir
   */
  async getProjects(): Promise<Project[]> {
    try {
      const safeData = await this.palantirDashboard.getSAFeData();
      return this.mapPalantirProjectsToSchema(safeData.projects);
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getProjects failed, using fallback:', error.message);
      return this.fallbackStorage.getProjects();
    }
  }

  /**
   * Get a specific project from Palantir
   */
  async getProject(id: string): Promise<Project | undefined> {
    try {
      if (!this.palantirService) {
        return this.fallbackStorage.getProject(id);
      }

      const result = await this.palantirService.getObject(PALANTIR_OBJECT_TYPES.PROJECT, id);
      if (result) {
        return this.mapPalantirProjectToSchema(result);
      }
      return undefined;
    } catch (error: any) {
      // Try fallback
      console.warn('[PalantirStorage] Palantir getProject failed, using fallback:', error.message);
      return this.fallbackStorage.getProject(id);
    }
  }

  /**
   * Get projects by portfolio (using transformation_id as portfolio proxy)
   */
  async getProjectsByPortfolio(portfolioId: string): Promise<Project[]> {
    try {
      const safeData = await this.palantirDashboard.getSAFeData();
      const filtered = safeData.projects.filter((p: any) =>
        p.transformation_id === portfolioId || p.portfolioId === portfolioId
      );
      return this.mapPalantirProjectsToSchema(filtered);
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getProjectsByPortfolio failed, using fallback:', error.message);
      return this.fallbackStorage.getProjectsByPortfolio(portfolioId);
    }
  }

  /**
   * Get projects by business unit (using transformation_id as BU proxy)
   */
  async getProjectsByBusinessUnit(businessUnitId: string): Promise<Project[]> {
    try {
      const safeData = await this.palantirDashboard.getSAFeData();
      const filtered = safeData.projects.filter((p: any) =>
        p.transformation_id === businessUnitId || p.divisionId === businessUnitId
      );
      return this.mapPalantirProjectsToSchema(filtered);
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getProjectsByBusinessUnit failed, using fallback:', error.message);
      return this.fallbackStorage.getProjectsByBusinessUnit(businessUnitId);
    }
  }

  /**
   * Get project metrics from Palantir KPIs
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetric[]> {
    try {
      const kpis = await this.palantirDashboard.getKPIs(projectId);
      return kpis.map((kpi: any) => ({
        id: kpi.kpi_id || kpi.id,
        projectId: projectId,
        metricKey: kpi.name || kpi.kpi_id,
        metricType: 'kpi',
        value: String(kpi.current_value || 0),
        targetValue: String(kpi.target_value || 100),
        unit: kpi.unit || '%',
        recordedAt: new Date(),
        createdAt: new Date(),
      }));
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getProjectMetrics failed, using fallback:', error.message);
      return this.fallbackStorage.getProjectMetrics(projectId);
    }
  }

  /**
   * Get dependencies from Palantir
   */
  async getDependencies(projectId: string): Promise<Dependency[]> {
    try {
      if (!this.palantirService) {
        return this.fallbackStorage.getDependencies(projectId);
      }

      // Try to get Dependency objects (stored as project links)
      const result = await this.palantirService.listObjects(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 100 });
      const deps = (result.data || []).filter((d: any) =>
        d.source_project_id === projectId || d.target_project_id === projectId
      );

      return deps.map((d: any) => ({
        id: d.dependency_id || d.id,
        sourceProjectId: d.source_project_id || projectId,
        targetProjectId: d.target_project_id || '',
        dependencyType: d.dependency_type || 'finish-to-start',
        status: d.status || 'active',
        criticality: 'medium',
        description: d.description || '',
        createdAt: new Date(),
      }));
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getDependencies failed, using fallback:', error.message);
      return this.fallbackStorage.getDependencies(projectId);
    }
  }

  /**
   * Get tasks from Palantir (Project with [Task] prefix or Task object type)
   */
  async getTasks(projectId: string): Promise<Task[]> {
    try {
      const safeData = await this.palantirDashboard.getSAFeData();
      const tasks = safeData.tasks.filter((t: any) =>
        t.transformation_id === projectId || t.projectId === projectId
      );

      return tasks.map((t: any) => ({
        id: t.project_id?.replace('task-', '') || t.id,
        name: (t.name || '').replace('[Task] ', ''),
        description: t.description || '',
        status: this.mapPalantirStatusToTaskStatus(t.status),
        storyId: t.storyId || null,
        featureId: t.featureId || null,
        projectId: projectId,
        assignee: t.assignee || null,
        effortHours: t.effortHours || '8',
        skills: t.skills || null,
        dueDate: t.dueDate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getTasks failed, using fallback:', error.message);
      return this.fallbackStorage.getTasks(projectId);
    }
  }

  /**
   * Get resources for a project
   */
  async getResources(projectId: string): Promise<Resource[]> {
    try {
      // Resources aren't directly in Palantir yet, use fallback
      return this.fallbackStorage.getResources(projectId);
    } catch (error: any) {
      console.warn('[PalantirStorage] getResources failed:', error.message);
      return [];
    }
  }

  /**
   * Get features from Palantir (Feature object type)
   */
  async getFeatures(projectId: string): Promise<Feature[]> {
    try {
      const safeData = await this.palantirDashboard.getSAFeData();
      const features = safeData.features.filter((f: any) =>
        f.transformation_id === projectId || f.projectId === projectId
      );

      return features.map((f: any) => ({
        id: f.project_id?.replace('feature-', '') || f.id,
        name: (f.name || '').replace('[Feature] ', ''),
        description: f.description || '',
        status: f.status || 'Backlog',
        projectId: projectId,
        priority: f.priority || 'Medium',
        storyPoints: f.storyPoints || '0',
        completedPoints: f.completedPoints || '0',
        targetPi: f.targetPi || null,
        wsjfScore: f.wsjfScore || '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getFeatures failed, using fallback:', error.message);
      return this.fallbackStorage.getFeatures(projectId);
    }
  }

  /**
   * Get stories from Palantir (Story object type)
   */
  async getStories(featureId: string): Promise<Story[]> {
    try {
      const safeData = await this.palantirDashboard.getSAFeData();
      const stories = safeData.stories.filter((s: any) =>
        s.featureId === featureId || s.transformation_id === featureId
      );

      return stories.map((s: any) => ({
        id: s.project_id?.replace('story-', '') || s.id,
        name: (s.name || '').replace('[Story] ', ''),
        description: s.description || '',
        status: s.status || 'Backlog',
        featureId: featureId,
        projectId: s.projectId || null,
        storyPoints: s.storyPoints || '0',
        sprint: s.sprint || null,
        assignedTeam: s.assignedTeam || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getStories failed, using fallback:', error.message);
      return this.fallbackStorage.getStories(featureId);
    }
  }

  /**
   * Get risks from Palantir
   */
  async getRisks(projectId?: string): Promise<any[]> {
    try {
      const risks = await this.palantirDashboard.getRisks();
      if (projectId) {
        return risks.filter((r: any) => r.project_id === projectId);
      }
      return risks;
    } catch (error: any) {
      console.warn('[PalantirStorage] Palantir getRisks failed, using fallback:', error.message);
      return this.fallbackStorage.getRisks ? this.fallbackStorage.getRisks(projectId) : [];
    }
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  private mapPalantirProjectsToSchema(palantirProjects: any[]): Project[] {
    return palantirProjects.map(p => this.mapPalantirProjectToSchema(p));
  }

  private mapPalantirProjectToSchema(p: any): Project {
    // Extract project ID from various possible fields
    const projectId = p.project_id || p.projectId || p.__primaryKey?.project_id || p.id;

    // Map Palantir status to internal status
    const status = this.mapPalantirStatusToProjectStatus(p.status);

    return {
      id: projectId,
      name: p.name || 'Unnamed Project',
      description: p.description || '',
      status: status,
      priority: p.priority || 'Medium',
      startDate: p.start_date || p.startDate || null,
      endDate: p.end_date || p.endDate || null,
      divisionId: p.transformation_id || p.divisionId || null,
      portfolioId: p.portfolioId || null,
      ownerId: p.ownerId || null,
      budgetTotal: p.budgetTotal || '0',
      budgetSpent: p.budgetSpent || '0',
      budget: p.budget || '0',
      actualCost: p.actualCost || '0',
      progress: p.milestone_progress ? Math.round(p.milestone_progress * 100) : (p.progress || 0),
      cpiValue: p.cpiValue || 1.0,
      spiValue: p.spiValue || 1.0,
      currentPi: p.currentPi || null,
      velocity: p.velocity || '0',
      predictability: p.predictability || '0',
      flowEfficiency: p.flowEfficiency || '0',
      createdAt: p.created_at ? new Date(p.created_at) : new Date(),
      updatedAt: new Date(),
    } as Project;
  }

  private mapPalantirStatusToProjectStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'Not Started': 'planning',
      'In Progress': 'active',
      'Complete': 'completed',
      'At Risk': 'at-risk',
      'Blocked': 'blocked',
    };
    return statusMap[status] || status?.toLowerCase() || 'active';
  }

  private mapPalantirStatusToTaskStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'Not Started': 'todo',
      'In Progress': 'in_progress',
      'Complete': 'done',
      'Blocked': 'blocked',
    };
    return statusMap[status] || status?.toLowerCase() || 'todo';
  }

  // ============================================================================
  // DELEGATE ALL OTHER METHODS TO FALLBACK STORAGE
  // ============================================================================

  // This creates a proxy that delegates all unimplemented methods
  // to the fallback storage
}

/**
 * Create a Palantir storage adapter that wraps existing storage
 * and routes reads to Palantir while keeping writes to PostgreSQL
 */
export function createPalantirStorageAdapter(fallbackStorage: IStorage): IStorage {
  const adapter = new PalantirStorageAdapter(fallbackStorage);

  // Create a proxy that delegates undefined methods to fallbackStorage
  return new Proxy(adapter as unknown as IStorage, {
    get(target, prop) {
      // If the property exists on the adapter, use it
      if (prop in target && typeof (target as any)[prop] !== 'undefined') {
        const value = (target as any)[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }

      // Otherwise, delegate to fallback storage
      const fallbackValue = (fallbackStorage as any)[prop];
      if (typeof fallbackValue === 'function') {
        return fallbackValue.bind(fallbackStorage);
      }
      return fallbackValue;
    }
  });
}

// Singleton instance
let _palantirStorage: IStorage | null = null;

export function getPalantirStorageAdapter(fallbackStorage: IStorage): IStorage {
  if (!_palantirStorage) {
    _palantirStorage = createPalantirStorageAdapter(fallbackStorage);
  }
  return _palantirStorage;
}
