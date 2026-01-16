import { storage } from "./storage";

export interface ServiceNowConfig {
  instanceUrl: string;
  username: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
}

export interface ServiceNowProject {
  sys_id: string;
  number: string;
  short_description: string;
  description: string;
  state: string;
  priority: string;
  assignment_group: string;
  business_service: string;
  start_date: string;
  end_date: string;
}

export interface ServiceNowDemand {
  sys_id: string;
  number: string;
  short_description: string;
  description: string;
  state: string;
  priority: string;
  business_value: number;
  requested_for: string;
  start_date: string;
  end_date: string;
}

export interface ServiceNowTask {
  sys_id: string;
  number: string;
  short_description: string;
  description: string;
  state: string;
  priority: string;
  assigned_to: string;
  parent: string;
  work_start: string;
  work_end: string;
  story_points: number;
}

export interface ServiceNowSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class ServiceNowClient {
  private baseUrl: string;
  private authHeader: string;
  private accessToken?: string;

  constructor(config: ServiceNowConfig) {
    this.baseUrl = config.instanceUrl.replace(/\/$/, '');
    this.authHeader = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/now/table${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else {
      headers['Authorization'] = `Basic ${this.authHeader}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ServiceNow API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.result as T;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/sys_user?sysparm_limit=1');
      return { success: true, message: 'Successfully connected to ServiceNow' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getProjects(limit = 100): Promise<ServiceNowProject[]> {
    return this.request<ServiceNowProject[]>(
      `/pm_project?sysparm_limit=${limit}&sysparm_display_value=true`
    );
  }

  async getProject(projectId: string): Promise<ServiceNowProject> {
    const results = await this.request<ServiceNowProject[]>(
      `/pm_project?sysparm_query=sys_id=${projectId}&sysparm_display_value=true`
    );
    if (results.length === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return results[0];
  }

  async getDemands(limit = 100): Promise<ServiceNowDemand[]> {
    return this.request<ServiceNowDemand[]>(
      `/dmn_demand?sysparm_limit=${limit}&sysparm_display_value=true`
    );
  }

  async getProjectDemands(projectId: string): Promise<ServiceNowDemand[]> {
    return this.request<ServiceNowDemand[]>(
      `/dmn_demand?sysparm_query=project=${projectId}&sysparm_display_value=true`
    );
  }

  async getTasks(projectId: string, limit = 100): Promise<ServiceNowTask[]> {
    return this.request<ServiceNowTask[]>(
      `/pm_project_task?sysparm_query=parent.sys_id=${projectId}&sysparm_limit=${limit}&sysparm_display_value=true`
    );
  }

  async getStories(projectId: string, limit = 100): Promise<ServiceNowTask[]> {
    return this.request<ServiceNowTask[]>(
      `/rm_story?sysparm_query=project=${projectId}&sysparm_limit=${limit}&sysparm_display_value=true`
    );
  }

  async getEpics(projectId: string, limit = 100): Promise<ServiceNowTask[]> {
    return this.request<ServiceNowTask[]>(
      `/rm_epic?sysparm_query=project=${projectId}&sysparm_limit=${limit}&sysparm_display_value=true`
    );
  }

  private mapServiceNowStateToSafe(state: string): string {
    const stateLower = state.toLowerCase();
    if (stateLower.includes('complete') || stateLower.includes('closed') || stateLower.includes('done')) {
      return 'completed';
    }
    if (stateLower.includes('progress') || stateLower.includes('work') || stateLower.includes('active')) {
      return 'in-progress';
    }
    return 'not-started';
  }

  private mapServiceNowPriorityToSafe(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower === '1') {
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

  private mapServiceNowStatusToHealth(state: string): string {
    const stateLower = state.toLowerCase();
    if (stateLower.includes('complete') || stateLower.includes('closed')) {
      return 'green';
    }
    if (stateLower.includes('risk') || stateLower.includes('blocked') || stateLower.includes('hold')) {
      return 'red';
    }
    if (stateLower.includes('delay') || stateLower.includes('warning')) {
      return 'amber';
    }
    return 'green';
  }

  async syncProject(projectId: string, sourceSystemId: string): Promise<ServiceNowSyncResult> {
    const result: ServiceNowSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const snowProject = await this.getProject(projectId);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(
        p => p.name === snowProject.short_description || p.name === snowProject.number
      );

      if (!project) {
        project = await storage.createProject({
          name: snowProject.short_description || snowProject.number,
          description: snowProject.description || `Imported from ServiceNow: ${snowProject.number}`,
          status: this.mapServiceNowStatusToHealth(snowProject.state),
        });
        result.projectsCreated++;
      }

      let epics: ServiceNowTask[] = [];
      try {
        epics = await this.getEpics(projectId);
      } catch (e) {
        console.log('No epics table available, using demands as features');
      }

      if (epics.length === 0) {
        const demands = await this.getProjectDemands(projectId);
        for (const demand of demands) {
          try {
            await storage.createFeature({
              projectId: project.id,
              name: demand.short_description,
              description: demand.description,
              status: this.mapServiceNowStateToSafe(demand.state),
              priority: this.mapServiceNowPriorityToSafe(demand.priority),
            });
            result.featuresCreated++;
          } catch (error: any) {
            result.errors.push(`Failed to create feature from demand ${demand.number}: ${error.message}`);
          }
        }
      } else {
        const epicIdMap: Record<string, string> = {};

        for (const epic of epics) {
          try {
            const feature = await storage.createFeature({
              projectId: project.id,
              name: epic.short_description,
              description: epic.description,
              status: this.mapServiceNowStateToSafe(epic.state),
              priority: this.mapServiceNowPriorityToSafe(epic.priority),
              storyPoints: epic.story_points?.toString(),
            });
            epicIdMap[epic.sys_id] = feature.id;
            result.featuresCreated++;
          } catch (error: any) {
            result.errors.push(`Failed to create feature from epic ${epic.number}: ${error.message}`);
          }
        }

        let stories: ServiceNowTask[] = [];
        try {
          stories = await this.getStories(projectId);
        } catch (e) {
          console.log('No stories table available');
        }

        const storyIdMap: Record<string, string> = {};

        for (const story of stories) {
          try {
            const featureId = story.parent ? epicIdMap[story.parent] : Object.values(epicIdMap)[0];
            if (!featureId) {
              result.errors.push(`Story ${story.number} has no parent feature, skipping`);
              continue;
            }

            const storyRecord = await storage.createStory({
              projectId: project.id,
              featureId: featureId,
              name: story.short_description,
              description: story.description,
              status: this.mapServiceNowStateToSafe(story.state),
              storyPoints: story.story_points?.toString(),
              assignedTeam: story.assigned_to,
            });
            storyIdMap[story.sys_id] = storyRecord.id;
            result.storiesCreated++;
          } catch (error: any) {
            result.errors.push(`Failed to create story from ${story.number}: ${error.message}`);
          }
        }
      }

      let tasks: ServiceNowTask[] = [];
      try {
        tasks = await this.getTasks(projectId);
      } catch (e) {
        console.log('No pm_project_task table available or accessible');
      }
      
      if (tasks.length > 0) {
        const allFeatures = await storage.getFeatures(project.id);
        const allStories = await storage.getStoriesByProject(project.id);
        
        if (allFeatures.length === 0 || allStories.length === 0) {
          result.errors.push(`No features or stories available to link tasks`);
        } else {
          for (const task of tasks) {
            try {
              await storage.createTask({
                projectId: project.id,
                featureId: allFeatures[0].id,
                storyId: allStories[0].id,
                name: task.short_description,
                description: task.description,
                status: this.mapServiceNowStateToSafe(task.state),
                priority: this.mapServiceNowPriorityToSafe(task.priority),
                assignee: task.assigned_to,
              });
              result.tasksCreated++;
            } catch (error: any) {
              result.errors.push(`Failed to create task from ${task.number}: ${error.message}`);
            }
          }
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'ServiceNow Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from project ${snowProject.number}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'servicenow_sync',
        sourceId: projectId,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'ServiceNow Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'servicenow_sync',
        sourceId: projectId,
      });
    }

    return result;
  }
}

export async function createServiceNowClientFromAdapter(adapterId: string): Promise<ServiceNowClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'servicenow') {
    console.error(`ServiceNow adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.instanceUrl) {
      console.error('ServiceNow adapter missing required field: instanceUrl (e.g., https://your-instance.service-now.com)');
      return null;
    }
    if (!config.username) {
      console.error('ServiceNow adapter missing required field: username');
      return null;
    }
    if (!config.password) {
      console.error('ServiceNow adapter missing required field: password (or API token)');
      return null;
    }
    
    return new ServiceNowClient({
      instanceUrl: config.instanceUrl,
      username: config.username,
      password: config.password,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  } catch (error) {
    console.error('Failed to create ServiceNow client:', error);
    return null;
  }
}
