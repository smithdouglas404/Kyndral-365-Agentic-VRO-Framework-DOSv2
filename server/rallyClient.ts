import { storage } from "./storage";

export interface RallyConfig {
  apiKey: string;
  workspace?: string;
  project?: string;
}

export interface RallyProject {
  _ref: string;
  _refObjectUUID: string;
  _refObjectName: string;
  Name: string;
  Description: string;
  State: string;
  Owner?: { _refObjectName: string };
}

export interface RallyPortfolioItem {
  _ref: string;
  _refObjectUUID: string;
  FormattedID: string;
  Name: string;
  Description: string;
  State: { Name: string };
  PortfolioItemType: { Name: string };
  Owner?: { _refObjectName: string };
  PlanEstimate?: number;
  Children?: { Count: number };
  Parent?: { _refObjectUUID: string };
}

export interface RallyUserStory {
  _ref: string;
  _refObjectUUID: string;
  FormattedID: string;
  Name: string;
  Description: string;
  ScheduleState: string;
  PlanEstimate?: number;
  Owner?: { _refObjectName: string };
  Feature?: { _refObjectUUID: string };
  Tasks?: { Count: number };
}

export interface RallyTask {
  _ref: string;
  _refObjectUUID: string;
  FormattedID: string;
  Name: string;
  Description: string;
  State: string;
  Estimate?: number;
  ToDo?: number;
  Owner?: { _refObjectName: string };
  WorkProduct?: { _refObjectUUID: string };
}

export interface RallySyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class RallyClient {
  private baseUrl = 'https://rally1.rallydev.com/slm/webservice/v2.0';
  private apiKey: string;
  private workspace?: string;
  private project?: string;

  constructor(config: RallyConfig) {
    this.apiKey = config.apiKey;
    this.workspace = config.workspace;
    this.project = config.project;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'ZSESSIONID': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rally API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/user');
      return { success: true, message: 'Successfully connected to Rally' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getWorkspaces(): Promise<any[]> {
    const response = await this.request<any>('/workspace');
    return response.QueryResult?.Results || [];
  }

  async getProjects(workspaceRef?: string): Promise<RallyProject[]> {
    let endpoint = '/project?fetch=true&pagesize=200';
    if (workspaceRef) {
      endpoint += `&workspace=${encodeURIComponent(workspaceRef)}`;
    }
    const response = await this.request<any>(endpoint);
    return response.QueryResult?.Results || [];
  }

  async getPortfolioItems(projectRef?: string, type = 'Feature'): Promise<RallyPortfolioItem[]> {
    let endpoint = `/portfolioitem/${type.toLowerCase()}?fetch=true&pagesize=200`;
    if (projectRef) {
      endpoint += `&project=${encodeURIComponent(projectRef)}`;
    }
    const response = await this.request<any>(endpoint);
    return response.QueryResult?.Results || [];
  }

  async getEpics(projectRef?: string): Promise<RallyPortfolioItem[]> {
    return this.getPortfolioItems(projectRef, 'Epic');
  }

  async getFeatures(projectRef?: string): Promise<RallyPortfolioItem[]> {
    return this.getPortfolioItems(projectRef, 'Feature');
  }

  async getUserStories(projectRef?: string): Promise<RallyUserStory[]> {
    let endpoint = '/hierarchicalrequirement?fetch=true&pagesize=200';
    if (projectRef) {
      endpoint += `&project=${encodeURIComponent(projectRef)}`;
    }
    const response = await this.request<any>(endpoint);
    return response.QueryResult?.Results || [];
  }

  async getTasks(projectRef?: string): Promise<RallyTask[]> {
    let endpoint = '/task?fetch=true&pagesize=200';
    if (projectRef) {
      endpoint += `&project=${encodeURIComponent(projectRef)}`;
    }
    const response = await this.request<any>(endpoint);
    return response.QueryResult?.Results || [];
  }

  private mapRallyStateToSafe(state: string): string {
    const stateLower = state.toLowerCase();
    if (stateLower === 'accepted' || stateLower === 'completed' || stateLower === 'done') {
      return 'completed';
    }
    if (stateLower === 'in-progress' || stateLower === 'in progress' || stateLower === 'defined') {
      return 'in-progress';
    }
    return 'not-started';
  }

  private mapRallyScheduleStateToSafe(scheduleState: string): string {
    const stateLower = scheduleState.toLowerCase();
    if (stateLower === 'accepted' || stateLower === 'completed') {
      return 'completed';
    }
    if (stateLower === 'in-progress' || stateLower === 'in progress') {
      return 'in-progress';
    }
    return 'not-started';
  }

  private stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async syncProject(projectRef: string, sourceSystemId: string): Promise<RallySyncResult> {
    const result: RallySyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const rallyProjects = await this.getProjects();
      const rallyProject = rallyProjects.find(p => p._ref === projectRef || p._refObjectUUID === projectRef);

      if (!rallyProject) {
        throw new Error(`Rally project not found: ${projectRef}`);
      }

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === rallyProject.Name);

      if (!project) {
        project = await storage.createProject({
          name: rallyProject.Name,
          description: this.stripHtml(rallyProject.Description) || `Imported from Rally`,
          status: 'green',
        });
        result.projectsCreated++;
      }

      const features = await this.getFeatures(projectRef);
      const featureIdMap: Record<string, string> = {};

      for (const feature of features) {
        try {
          const featureRecord = await storage.createFeature({
            projectId: project.id,
            name: feature.Name,
            description: this.stripHtml(feature.Description),
            status: feature.State ? this.mapRallyStateToSafe(feature.State.Name) : 'not-started',
            priority: 'medium',
            storyPoints: feature.PlanEstimate?.toString(),
          });
          featureIdMap[feature._refObjectUUID] = featureRecord.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature ${feature.FormattedID}: ${error.message}`);
        }
      }

      const stories = await this.getUserStories(projectRef);
      const storyIdMap: Record<string, string> = {};

      for (const story of stories) {
        try {
          const featureUUID = story.Feature?._refObjectUUID;
          const featureId = featureUUID ? featureIdMap[featureUUID] : Object.values(featureIdMap)[0];

          if (!featureId) {
            result.errors.push(`Story ${story.FormattedID} has no parent feature, skipping`);
            continue;
          }

          const storyRecord = await storage.createStory({
            projectId: project.id,
            featureId,
            name: story.Name,
            description: this.stripHtml(story.Description),
            status: this.mapRallyScheduleStateToSafe(story.ScheduleState),
            storyPoints: story.PlanEstimate?.toString(),
            assignedTeam: story.Owner?._refObjectName,
          });
          storyIdMap[story._refObjectUUID] = storyRecord.id;
          result.storiesCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create story ${story.FormattedID}: ${error.message}`);
        }
      }

      const tasks = await this.getTasks(projectRef);

      for (const task of tasks) {
        try {
          const workProductUUID = task.WorkProduct?._refObjectUUID;
          const storyId = workProductUUID ? storyIdMap[workProductUUID] : Object.values(storyIdMap)[0];
          const featureId = Object.values(featureIdMap)[0];

          if (!storyId || !featureId) {
            result.errors.push(`Task ${task.FormattedID} has no parent story/feature, skipping`);
            continue;
          }

          await storage.createTask({
            projectId: project.id,
            featureId,
            storyId,
            name: task.Name,
            description: this.stripHtml(task.Description),
            status: this.mapRallyStateToSafe(task.State),
            priority: 'medium',
            assignee: task.Owner?._refObjectName,
          });
          result.tasksCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create task ${task.FormattedID}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Rally Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from ${rallyProject.Name}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'rally_sync',
        sourceId: projectRef,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'Rally Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'rally_sync',
        sourceId: projectRef,
      });
    }

    return result;
  }
}

export async function createRallyClientFromAdapter(adapterId: string): Promise<RallyClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'rally') {
    console.error(`Rally adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.apiKey) {
      console.error('Rally adapter missing required field: apiKey');
      return null;
    }
    
    return new RallyClient({
      apiKey: config.apiKey,
      workspace: config.workspace,
      project: config.project,
    });
  } catch (error) {
    console.error('Failed to create Rally client:', error);
    return null;
  }
}
