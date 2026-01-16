import { storage } from "./storage";

export interface PlanviewConfig {
  instanceUrl: string;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
}

export interface PlanviewPortfolio {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  owner: string;
}

export interface PlanviewProgram {
  id: string;
  portfolioId: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  programManager: string;
}

export interface PlanviewProject {
  id: string;
  programId: string;
  portfolioId: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  projectManager: string;
  percentComplete: number;
}

export interface PlanviewWork {
  id: string;
  projectId: string;
  name: string;
  description: string;
  workType: string;
  status: string;
  priority: string;
  assignedTo: string;
  effort: number;
  percentComplete: number;
}

export interface PlanviewSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class PlanviewClient {
  private baseUrl: string;
  private apiKey: string;
  private accessToken?: string;

  constructor(config: PlanviewConfig) {
    this.baseUrl = config.instanceUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken || this.apiKey}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Planview API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/me');
      return { success: true, message: 'Successfully connected to Planview' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getPortfolios(): Promise<PlanviewPortfolio[]> {
    const response = await this.request<{ data: PlanviewPortfolio[] }>('/portfolios');
    return response.data || [];
  }

  async getPrograms(portfolioId?: string): Promise<PlanviewProgram[]> {
    const endpoint = portfolioId 
      ? `/portfolios/${portfolioId}/programs` 
      : '/programs';
    const response = await this.request<{ data: PlanviewProgram[] }>(endpoint);
    return response.data || [];
  }

  async getProjects(programId?: string): Promise<PlanviewProject[]> {
    const endpoint = programId 
      ? `/programs/${programId}/projects` 
      : '/projects';
    const response = await this.request<{ data: PlanviewProject[] }>(endpoint);
    return response.data || [];
  }

  async getProject(projectId: string): Promise<PlanviewProject> {
    return this.request<PlanviewProject>(`/projects/${projectId}`);
  }

  async getWorkItems(projectId: string): Promise<PlanviewWork[]> {
    const response = await this.request<{ data: PlanviewWork[] }>(
      `/projects/${projectId}/work`
    );
    return response.data || [];
  }

  async getEpics(projectId: string): Promise<PlanviewWork[]> {
    const work = await this.getWorkItems(projectId);
    return work.filter(w => w.workType === 'Epic' || w.workType === 'Feature');
  }

  async getStories(projectId: string): Promise<PlanviewWork[]> {
    const work = await this.getWorkItems(projectId);
    return work.filter(w => w.workType === 'Story' || w.workType === 'User Story');
  }

  async getTasks(projectId: string): Promise<PlanviewWork[]> {
    const work = await this.getWorkItems(projectId);
    return work.filter(w => w.workType === 'Task' || w.workType === 'Activity');
  }

  private mapPlanviewStatusToSafe(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('closed') || statusLower.includes('done')) {
      return 'completed';
    }
    if (statusLower.includes('progress') || statusLower.includes('active') || statusLower.includes('work')) {
      return 'in-progress';
    }
    return 'not-started';
  }

  private mapPlanviewPriorityToSafe(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower === '1' || priorityLower === 'highest') {
      return 'critical';
    }
    if (priorityLower.includes('high') || priorityLower === '2') {
      return 'high';
    }
    if (priorityLower.includes('low') || priorityLower === '4' || priorityLower === '5') {
      return 'low';
    }
    return 'medium';
  }

  private mapPlanviewStatusToHealth(status: string, percentComplete: number): string {
    if (percentComplete >= 100) return 'green';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('risk') || statusLower.includes('red') || statusLower.includes('critical')) {
      return 'red';
    }
    if (statusLower.includes('warning') || statusLower.includes('yellow') || statusLower.includes('amber')) {
      return 'amber';
    }
    return 'green';
  }

  async syncProject(projectId: string, sourceSystemId: string): Promise<PlanviewSyncResult> {
    const result: PlanviewSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const pvProject = await this.getProject(projectId);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === pvProject.name);

      if (!project) {
        project = await storage.createProject({
          name: pvProject.name,
          description: pvProject.description || `Imported from Planview`,
          status: this.mapPlanviewStatusToHealth(pvProject.status, pvProject.percentComplete),
        });
        result.projectsCreated++;
      }

      const epics = await this.getEpics(projectId);
      const epicIdMap: Record<string, string> = {};

      for (const epic of epics) {
        try {
          const feature = await storage.createFeature({
            projectId: project.id,
            name: epic.name,
            description: epic.description,
            status: this.mapPlanviewStatusToSafe(epic.status),
            priority: this.mapPlanviewPriorityToSafe(epic.priority),
            storyPoints: epic.effort?.toString(),
          });
          epicIdMap[epic.id] = feature.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from ${epic.name}: ${error.message}`);
        }
      }

      const stories = await this.getStories(projectId);
      const storyIdMap: Record<string, string> = {};

      for (const story of stories) {
        try {
          const featureId = Object.values(epicIdMap)[0];
          if (!featureId) {
            result.errors.push(`Story ${story.name} has no parent feature, skipping`);
            continue;
          }

          const storyRecord = await storage.createStory({
            projectId: project.id,
            featureId: featureId,
            name: story.name,
            description: story.description,
            status: this.mapPlanviewStatusToSafe(story.status),
            storyPoints: story.effort?.toString(),
            assignedTeam: story.assignedTo,
          });
          storyIdMap[story.id] = storyRecord.id;
          result.storiesCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create story from ${story.name}: ${error.message}`);
        }
      }

      const tasks = await this.getTasks(projectId);
      for (const task of tasks) {
        try {
          const storyId = Object.values(storyIdMap)[0];
          const featureId = Object.values(epicIdMap)[0];

          if (!storyId || !featureId) {
            result.errors.push(`Task ${task.name} has no parent story/feature, skipping`);
            continue;
          }

          await storage.createTask({
            projectId: project.id,
            featureId: featureId,
            storyId: storyId,
            name: task.name,
            description: task.description,
            status: this.mapPlanviewStatusToSafe(task.status),
            priority: this.mapPlanviewPriorityToSafe(task.priority),
            assignee: task.assignedTo,
          });
          result.tasksCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create task from ${task.name}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Planview Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'planview_sync',
        sourceId: projectId,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'Planview Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'planview_sync',
        sourceId: projectId,
      });
    }

    return result;
  }
}

export async function createPlanviewClientFromAdapter(adapterId: string): Promise<PlanviewClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'planview') {
    console.error(`Planview adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.instanceUrl) {
      console.error('Planview adapter missing required field: instanceUrl');
      return null;
    }
    if (!config.apiKey) {
      console.error('Planview adapter missing required field: apiKey');
      return null;
    }
    
    return new PlanviewClient({
      instanceUrl: config.instanceUrl,
      apiKey: config.apiKey,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  } catch (error) {
    console.error('Failed to create Planview client:', error);
    return null;
  }
}
