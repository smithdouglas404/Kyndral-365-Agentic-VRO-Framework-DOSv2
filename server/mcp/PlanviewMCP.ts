/**
 * Planview MCP (Model Context Protocol) Server
 *
 * Purpose: Enable agents to read project data from Planview PPM
 * and write actions back (status updates, notifications)
 *
 * Planview is the enterprise PPM system many organizations use.
 * This MCP allows agents to query:
 * - Portfolio data
 * - Project timelines, budgets, resources
 * - Work breakdown structures
 * - Resource allocations
 * - Financial data
 */

import type { IStorage } from '../storage.js';

interface PlanviewConfig {
  baseUrl: string;
  apiKey: string;
  apiVersion?: string;
  tenantId?: string;
}

interface PlanviewProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  portfolioId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetSpent?: number;
  percentComplete?: number;
  owner?: string;
  priority?: string;
  customFields?: Record<string, any>;
}

interface PlanviewResource {
  id: string;
  name: string;
  role: string;
  allocation: number; // percentage
  cost: number;
}

interface PlanviewFinancials {
  projectId: string;
  budgetTotal: number;
  budgetSpent: number;
  forecastCost: number;
  actualCost: number;
  variance: number;
  costByPhase: Array<{ phase: string; cost: number }>;
}

export class PlanviewMCP {
  private config: PlanviewConfig;
  private storage: IStorage;
  private baseHeaders: Record<string, string>;

  constructor(storage: IStorage, config?: Partial<PlanviewConfig>) {
    this.storage = storage;

    // Get config from environment or use provided config
    this.config = {
      baseUrl: config?.baseUrl || process.env.PLANVIEW_URL || 'https://api.planview.com',
      apiKey: config?.apiKey || process.env.PLANVIEW_API_KEY || '',
      apiVersion: config?.apiVersion || 'v1',
      tenantId: config?.tenantId || process.env.PLANVIEW_TENANT_ID || '',
    };

    this.baseHeaders = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.tenantId) {
      this.baseHeaders['X-Planview-Tenant'] = this.config.tenantId;
    }

    console.log('[PlanviewMCP] Initialized with base URL:', this.config.baseUrl);
  }

  /**
   * Test connection to Planview
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch portfolios as a connection test
      const response = await fetch(`${this.config.baseUrl}/api/${this.config.apiVersion}/portfolios`, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      return response.ok;
    } catch (error) {
      console.error('[PlanviewMCP] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Fetch all projects from Planview
   */
  async fetchProjects(options?: {
    portfolioId?: string;
    status?: string[];
    limit?: number;
  }): Promise<PlanviewProject[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options?.portfolioId) params.append('portfolioId', options.portfolioId);
      if (options?.status) params.append('status', options.status.join(','));
      if (options?.limit) params.append('limit', options.limit.toString());

      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/projects?${params.toString()}`;

      console.log('[PlanviewMCP] Fetching projects from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        throw new Error(`Planview API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Planview data to our schema
      const projects: PlanviewProject[] = data.projects?.map((p: any) => ({
        id: p.id || p.projectId,
        name: p.name || p.title,
        description: p.description,
        status: this.mapPlanviewStatus(p.status),
        portfolioId: p.portfolioId,
        startDate: p.startDate,
        endDate: p.endDate || p.targetEndDate,
        budget: p.budget || p.totalBudget,
        budgetSpent: p.actualCost || p.spentToDate,
        percentComplete: p.percentComplete || p.progress,
        owner: p.owner || p.projectManager,
        priority: p.priority,
        customFields: p.customFields || {},
      })) || [];

      console.log(`[PlanviewMCP] Fetched ${projects.length} projects`);
      return projects;
    } catch (error) {
      console.error('[PlanviewMCP] Error fetching projects:', error);
      // Return empty array on error - don't crash the agent
      return [];
    }
  }

  /**
   * Fetch project financials from Planview
   */
  async fetchProjectFinancials(projectId: string): Promise<PlanviewFinancials | null> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/projects/${projectId}/financials`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        throw new Error(`Planview API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        projectId,
        budgetTotal: data.totalBudget || 0,
        budgetSpent: data.actualCost || 0,
        forecastCost: data.forecastCost || 0,
        actualCost: data.actualCost || 0,
        variance: data.variance || 0,
        costByPhase: data.costByPhase || [],
      };
    } catch (error) {
      console.error(`[PlanviewMCP] Error fetching financials for project ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Fetch resource allocations for a project
   */
  async fetchProjectResources(projectId: string): Promise<PlanviewResource[]> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/projects/${projectId}/resources`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        throw new Error(`Planview API error: ${response.status}`);
      }

      const data = await response.json();

      return data.resources?.map((r: any) => ({
        id: r.resourceId || r.id,
        name: r.name || r.resourceName,
        role: r.role || r.resourceRole,
        allocation: r.allocation || r.allocationPercent || 0,
        cost: r.cost || r.laborCost || 0,
      })) || [];
    } catch (error) {
      console.error(`[PlanviewMCP] Error fetching resources for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Update project status in Planview
   * Called by agents when they want to take action
   */
  async updateProjectStatus(projectId: string, status: string, comment?: string): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/projects/${projectId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.baseHeaders,
        body: JSON.stringify({
          status: this.mapToPlanviewStatus(status),
          comment: comment || `Status updated by AI Agent`,
          updatedBy: 'AI Agent',
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Planview API error: ${response.status}`);
      }

      console.log(`[PlanviewMCP] Updated project ${projectId} status to ${status}`);
      return true;
    } catch (error) {
      console.error(`[PlanviewMCP] Error updating project ${projectId}:`, error);
      return false;
    }
  }

  /**
   * Update full project details in Planview
   * Called by agents for bidirectional sync
   */
  async updateProject(projectId: string, updates: {
    name?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    percentComplete?: number;
    priority?: string;
    owner?: string;
  }): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/projects/${projectId}`;

      // Transform our internal data to Planview format
      const planviewUpdates: any = {};

      if (updates.name !== undefined) planviewUpdates.name = updates.name;
      if (updates.description !== undefined) planviewUpdates.description = updates.description;
      if (updates.status !== undefined) planviewUpdates.status = this.mapToPlanviewStatus(updates.status);
      if (updates.startDate !== undefined) planviewUpdates.startDate = updates.startDate;
      if (updates.endDate !== undefined) planviewUpdates.endDate = updates.endDate;
      if (updates.budget !== undefined) planviewUpdates.totalBudget = updates.budget;
      if (updates.percentComplete !== undefined) planviewUpdates.percentComplete = updates.percentComplete;
      if (updates.priority !== undefined) planviewUpdates.priority = updates.priority;
      if (updates.owner !== undefined) planviewUpdates.owner = updates.owner;

      planviewUpdates.updatedBy = 'AI Agent';
      planviewUpdates.updatedAt = new Date().toISOString();

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.baseHeaders,
        body: JSON.stringify(planviewUpdates),
      });

      if (!response.ok) {
        throw new Error(`Planview API error: ${response.status} ${response.statusText}`);
      }

      console.log(`[PlanviewMCP] Updated project ${projectId} in Planview`);
      return true;
    } catch (error) {
      console.error(`[PlanviewMCP] Error updating project ${projectId} in Planview:`, error);
      return false;
    }
  }

  /**
   * Create a comment/note in Planview
   * Used by agents to document their reasoning
   */
  async createProjectComment(projectId: string, comment: string, author: string = 'AI Agent'): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/projects/${projectId}/comments`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify({
          comment,
          author,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error(`[PlanviewMCP] Error creating comment for project ${projectId}:`, error);
      return false;
    }
  }

  /**
   * Sync projects from Planview to local database
   * This is called periodically by the sync scheduler
   */
  async syncProjectsToDatabase(options?: { portfolioId?: string }): Promise<number> {
    try {
      console.log('[PlanviewMCP] Starting project sync from Planview...');

      const planviewProjects = await this.fetchProjects(options);
      let syncedCount = 0;

      for (const pvProject of planviewProjects) {
        try {
          // Check if project already exists
          const existingProjects = await this.storage.getProjects();
          const existing = existingProjects.find(p =>
            p.id === pvProject.id ||
            p.name === pvProject.name // Match by name as fallback
          );

          if (existing) {
            // Update existing project
            await this.storage.updateProject(existing.id, {
              name: pvProject.name,
              description: pvProject.description,
              status: pvProject.status,
              portfolioId: pvProject.portfolioId,
              startDate: pvProject.startDate ? new Date(pvProject.startDate) : undefined,
              endDate: pvProject.endDate ? new Date(pvProject.endDate) : undefined,
              budget: pvProject.budget?.toString(),
              budgetTotal: pvProject.budget?.toString(),
              budgetSpent: pvProject.budgetSpent?.toString(),
              priority: pvProject.priority as any,
              // Calculate completionPercentage
              completionPercentage: pvProject.percentComplete?.toString(),
            });
            console.log(`[PlanviewMCP] Updated project: ${pvProject.name}`);
          } else {
            // Create new project
            await this.storage.createProject({
              name: pvProject.name,
              description: pvProject.description || '',
              status: pvProject.status as any || 'in_progress',
              portfolioId: pvProject.portfolioId,
              startDate: pvProject.startDate ? new Date(pvProject.startDate) : undefined,
              endDate: pvProject.endDate ? new Date(pvProject.endDate) : undefined,
              budget: pvProject.budget?.toString(),
              budgetTotal: pvProject.budget?.toString(),
              budgetSpent: pvProject.budgetSpent?.toString(),
              priority: (pvProject.priority as any) || 'medium',
              completionPercentage: pvProject.percentComplete?.toString(),
            });
            console.log(`[PlanviewMCP] Created new project: ${pvProject.name}`);
          }
          syncedCount++;
        } catch (error) {
          console.error(`[PlanviewMCP] Error syncing project ${pvProject.name}:`, error);
        }
      }

      console.log(`[PlanviewMCP] Sync complete: ${syncedCount} projects synced`);
      return syncedCount;
    } catch (error) {
      console.error('[PlanviewMCP] Sync failed:', error);
      return 0;
    }
  }

  /**
   * Map Planview status to our internal status
   */
  private mapPlanviewStatus(planviewStatus: string): string {
    const statusMap: Record<string, string> = {
      'active': 'in_progress',
      'in_progress': 'in_progress',
      'planning': 'planning',
      'on_hold': 'on_hold',
      'paused': 'on_hold',
      'completed': 'completed',
      'closed': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    return statusMap[planviewStatus?.toLowerCase()] || 'in_progress';
  }

  /**
   * Map our internal status to Planview status
   */
  private mapToPlanviewStatus(internalStatus: string): string {
    const statusMap: Record<string, string> = {
      'in_progress': 'Active',
      'planning': 'Planning',
      'on_hold': 'On Hold',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };

    return statusMap[internalStatus] || 'Active';
  }

  /**
   * Fetch portfolios from Planview
   */
  async fetchPortfolios(): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/portfolios`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        throw new Error(`Planview API error: ${response.status}`);
      }

      const data = await response.json();
      return data.portfolios || [];
    } catch (error) {
      console.error('[PlanviewMCP] Error fetching portfolios:', error);
      return [];
    }
  }
}

/**
 * Factory function to create Planview MCP instance
 */
export function createPlanviewMCP(storage: IStorage, config?: Partial<PlanviewConfig>): PlanviewMCP {
  return new PlanviewMCP(storage, config);
}
