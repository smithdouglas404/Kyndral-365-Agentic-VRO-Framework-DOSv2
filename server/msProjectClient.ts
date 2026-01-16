import { storage } from "./storage";

export interface MSProjectConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl?: string;
}

export interface MSProject {
  Id: string;
  Name: string;
  Description: string;
  StartDate: string;
  FinishDate: string;
  PercentComplete: number;
  Status: number;
  ProjectSiteUrl: string;
}

export interface MSTask {
  Id: string;
  Name: string;
  Notes: string;
  Start: string;
  Finish: string;
  PercentComplete: number;
  Work: number;
  Duration: string;
  Priority: number;
  ParentId: string;
  OutlineLevel: number;
  IsSummary: boolean;
  Assignments: MSAssignment[];
}

export interface MSAssignment {
  Id: string;
  ResourceId: string;
  ResourceName: string;
}

export interface MSProjectSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class MSProjectClient {
  private graphUrl = 'https://graph.microsoft.com/v1.0';
  private projectUrl: string;
  private accessToken?: string;
  private config: MSProjectConfig;

  constructor(config: MSProjectConfig) {
    this.config = config;
    this.projectUrl = config.siteUrl || 'https://project.microsoft.com';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken!;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${this.graphUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MS Project API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAccessToken();
      return { success: true, message: 'Successfully connected to Microsoft Project' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getProjects(): Promise<MSProject[]> {
    const response = await this.request<{ value: MSProject[] }>(
      '/sites/root/lists/Projects/items?$expand=fields'
    );
    return response.value || [];
  }

  async getProject(projectId: string): Promise<MSProject> {
    return this.request<MSProject>(`/planner/plans/${projectId}`);
  }

  async getTasks(projectId: string): Promise<MSTask[]> {
    const response = await this.request<{ value: MSTask[] }>(
      `/planner/plans/${projectId}/tasks`
    );
    return response.value || [];
  }

  async getBuckets(projectId: string): Promise<any[]> {
    const response = await this.request<{ value: any[] }>(
      `/planner/plans/${projectId}/buckets`
    );
    return response.value || [];
  }

  private mapMSStatusToSafe(percentComplete: number): string {
    if (percentComplete >= 100) return 'completed';
    if (percentComplete > 0) return 'in-progress';
    return 'not-started';
  }

  private mapMSPriorityToSafe(priority: number): string {
    if (priority <= 1) return 'critical';
    if (priority <= 3) return 'high';
    if (priority >= 7) return 'low';
    return 'medium';
  }

  private mapMSStatusToHealth(percentComplete: number): string {
    if (percentComplete >= 100) return 'green';
    if (percentComplete >= 50) return 'green';
    if (percentComplete >= 25) return 'amber';
    return 'green';
  }

  async syncProject(projectId: string, sourceSystemId: string): Promise<MSProjectSyncResult> {
    const result: MSProjectSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const msProject = await this.getProject(projectId);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === (msProject as any).title);

      if (!project) {
        project = await storage.createProject({
          name: (msProject as any).title || `MS Project ${projectId}`,
          description: `Imported from Microsoft Project`,
          status: 'green',
        });
        result.projectsCreated++;
      }

      const buckets = await this.getBuckets(projectId);
      const bucketIdMap: Record<string, string> = {};

      for (const bucket of buckets) {
        try {
          const feature = await storage.createFeature({
            projectId: project.id,
            name: bucket.name,
            description: `Bucket from MS Project`,
            status: 'not-started',
            priority: 'medium',
          });
          bucketIdMap[bucket.id] = feature.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from bucket ${bucket.name}: ${error.message}`);
        }
      }

      const tasks = await this.getTasks(projectId);
      
      const defaultStoryId = await this.ensureDefaultStory(project.id, Object.values(bucketIdMap)[0]);

      for (const task of tasks) {
        try {
          const featureId = task.ParentId ? bucketIdMap[task.ParentId] : Object.values(bucketIdMap)[0];

          if (!featureId) {
            result.errors.push(`Task ${task.Name} has no parent feature, skipping`);
            continue;
          }

          await storage.createTask({
            projectId: project.id,
            featureId: featureId,
            storyId: defaultStoryId,
            name: task.Name || (task as any).title,
            description: task.Notes || '',
            status: this.mapMSStatusToSafe(task.PercentComplete || (task as any).percentComplete || 0),
            priority: this.mapMSPriorityToSafe(task.Priority || (task as any).priority || 5),
            assignee: task.Assignments?.[0]?.ResourceName,
          });
          result.tasksCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create task from ${task.Name}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'MS Project Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.tasksCreated} tasks`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'msproject_sync',
        sourceId: projectId,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'MS Project Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'msproject_sync',
        sourceId: projectId,
      });
    }

    return result;
  }

  private async ensureDefaultStory(projectId: string, featureId: string): Promise<string> {
    const stories = await storage.getStoriesByProject(projectId);
    if (stories.length > 0) return stories[0].id;

    const story = await storage.createStory({
      projectId,
      featureId,
      name: 'Default Story',
      description: 'Auto-created for MS Project tasks',
      status: 'not-started',
    });
    return story.id;
  }
}

export async function createMSProjectClientFromAdapter(adapterId: string): Promise<MSProjectClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'msproject') {
    console.error(`MS Project adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.tenantId) {
      console.error('MS Project adapter missing required field: tenantId');
      return null;
    }
    if (!config.clientId) {
      console.error('MS Project adapter missing required field: clientId');
      return null;
    }
    if (!config.clientSecret) {
      console.error('MS Project adapter missing required field: clientSecret');
      return null;
    }
    
    return new MSProjectClient({
      tenantId: config.tenantId,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      siteUrl: config.siteUrl,
    });
  } catch (error) {
    console.error('Failed to create MS Project client:', error);
    return null;
  }
}
