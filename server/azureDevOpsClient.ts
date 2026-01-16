import { storage } from "./storage";

export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  personalAccessToken: string;
}

export interface AzureDevOpsProject {
  id: string;
  name: string;
  description: string;
  url: string;
  state: string;
  revision: number;
  visibility: string;
  lastUpdateTime: string;
}

export interface AzureDevOpsWorkItem {
  id: number;
  rev: number;
  fields: {
    'System.Title': string;
    'System.Description'?: string;
    'System.State': string;
    'System.WorkItemType': string;
    'System.AssignedTo'?: { displayName: string; uniqueName: string };
    'System.CreatedDate': string;
    'System.ChangedDate': string;
    'System.Parent'?: number;
    'Microsoft.VSTS.Common.Priority'?: number;
    'Microsoft.VSTS.Scheduling.StoryPoints'?: number;
    'Microsoft.VSTS.Scheduling.Effort'?: number;
    [key: string]: any;
  };
  url: string;
}

export interface AzureDevOpsSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class AzureDevOpsClient {
  private baseUrl: string;
  private authHeader: string;
  private projectName: string;

  constructor(config: AzureDevOpsConfig) {
    this.baseUrl = `https://dev.azure.com/${config.organization}`;
    this.authHeader = Buffer.from(`:${config.personalAccessToken}`).toString('base64');
    this.projectName = config.project;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${this.authHeader}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure DevOps API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/_apis/projects?api-version=7.0');
      return { success: true, message: 'Successfully connected to Azure DevOps' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getProjects(): Promise<AzureDevOpsProject[]> {
    const response = await this.request<{ value: AzureDevOpsProject[] }>(
      '/_apis/projects?api-version=7.0'
    );
    return response.value;
  }

  async getProject(projectName: string): Promise<AzureDevOpsProject> {
    return this.request<AzureDevOpsProject>(
      `/_apis/projects/${encodeURIComponent(projectName)}?api-version=7.0`
    );
  }

  private escapeWiqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

  async queryWorkItems(wiql: string): Promise<number[]> {
    const response = await this.request<{ workItems: { id: number }[] }>(
      `/${encodeURIComponent(this.projectName)}/_apis/wit/wiql?api-version=7.0`,
      {
        method: 'POST',
        body: JSON.stringify({ query: wiql }),
      }
    );
    return response.workItems?.map(wi => wi.id) || [];
  }

  async getWorkItemsByIds(ids: number[]): Promise<AzureDevOpsWorkItem[]> {
    if (ids.length === 0) return [];

    const batchSize = 200;
    const allWorkItems: AzureDevOpsWorkItem[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const response = await this.request<{ value: AzureDevOpsWorkItem[] }>(
        `/_apis/wit/workitems?ids=${batchIds.join(',')}&$expand=all&api-version=7.0`
      );
      allWorkItems.push(...response.value);
    }

    return allWorkItems;
  }

  async getEpics(): Promise<AzureDevOpsWorkItem[]> {
    const escapedProject = this.escapeWiqlString(this.projectName);
    const ids = await this.queryWorkItems(
      `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${escapedProject}' AND [System.WorkItemType] = 'Epic' ORDER BY [System.CreatedDate] DESC`
    );
    return this.getWorkItemsByIds(ids);
  }

  async getFeatures(): Promise<AzureDevOpsWorkItem[]> {
    const escapedProject = this.escapeWiqlString(this.projectName);
    const ids = await this.queryWorkItems(
      `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${escapedProject}' AND [System.WorkItemType] = 'Feature' ORDER BY [System.CreatedDate] DESC`
    );
    return this.getWorkItemsByIds(ids);
  }

  async getUserStories(): Promise<AzureDevOpsWorkItem[]> {
    const escapedProject = this.escapeWiqlString(this.projectName);
    const ids = await this.queryWorkItems(
      `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${escapedProject}' AND ([System.WorkItemType] = 'User Story' OR [System.WorkItemType] = 'Product Backlog Item') ORDER BY [System.CreatedDate] DESC`
    );
    return this.getWorkItemsByIds(ids);
  }

  async getTasks(): Promise<AzureDevOpsWorkItem[]> {
    const escapedProject = this.escapeWiqlString(this.projectName);
    const ids = await this.queryWorkItems(
      `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${escapedProject}' AND [System.WorkItemType] = 'Task' ORDER BY [System.CreatedDate] DESC`
    );
    return this.getWorkItemsByIds(ids);
  }

  async getBugs(): Promise<AzureDevOpsWorkItem[]> {
    const escapedProject = this.escapeWiqlString(this.projectName);
    const ids = await this.queryWorkItems(
      `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${escapedProject}' AND [System.WorkItemType] = 'Bug' ORDER BY [System.CreatedDate] DESC`
    );
    return this.getWorkItemsByIds(ids);
  }

  async getAllWorkItems(): Promise<AzureDevOpsWorkItem[]> {
    const escapedProject = this.escapeWiqlString(this.projectName);
    const ids = await this.queryWorkItems(
      `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${escapedProject}' ORDER BY [System.CreatedDate] DESC`
    );
    return this.getWorkItemsByIds(ids);
  }

  private mapAzureStateToSafe(state: string): string {
    const stateLower = state.toLowerCase();
    if (stateLower === 'done' || stateLower === 'closed' || stateLower === 'resolved' || stateLower === 'completed') {
      return 'completed';
    }
    if (stateLower === 'active' || stateLower === 'in progress' || stateLower === 'committed') {
      return 'in-progress';
    }
    return 'not-started';
  }

  private mapAzurePriorityToSafe(priority?: number): string {
    if (!priority) return 'medium';
    if (priority === 1) return 'critical';
    if (priority === 2) return 'high';
    if (priority === 4) return 'low';
    return 'medium';
  }

  private mapAzureStateToHealth(state: string): string {
    const stateLower = state.toLowerCase();
    if (stateLower === 'done' || stateLower === 'closed' || stateLower === 'resolved') {
      return 'green';
    }
    if (stateLower === 'removed' || stateLower === 'blocked') {
      return 'red';
    }
    return 'green';
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

  async syncProject(): Promise<AzureDevOpsSyncResult> {
    const result: AzureDevOpsSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const adoProject = await this.getProject(this.projectName);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === adoProject.name);

      if (!project) {
        project = await storage.createProject({
          name: adoProject.name,
          description: adoProject.description || `Imported from Azure DevOps`,
          status: this.mapAzureStateToHealth(adoProject.state),
        });
        result.projectsCreated++;
      }

      const [epics, features, stories, tasks] = await Promise.all([
        this.getEpics(),
        this.getFeatures(),
        this.getUserStories(),
        this.getTasks(),
      ]);

      const featureIdMap: Record<number, string> = {};

      const featureItems = features.length > 0 ? features : epics;

      for (const feature of featureItems) {
        try {
          const featureRecord = await storage.createFeature({
            projectId: project.id,
            name: feature.fields['System.Title'],
            description: this.stripHtml(feature.fields['System.Description']),
            status: this.mapAzureStateToSafe(feature.fields['System.State']),
            priority: this.mapAzurePriorityToSafe(feature.fields['Microsoft.VSTS.Common.Priority']),
            storyPoints: (feature.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || feature.fields['Microsoft.VSTS.Scheduling.Effort'])?.toString(),
          });
          featureIdMap[feature.id] = featureRecord.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from work item ${feature.id}: ${error.message}`);
        }
      }

      const storyIdMap: Record<number, string> = {};

      for (const story of stories) {
        try {
          const parentId = story.fields['System.Parent'];
          const featureId = parentId ? featureIdMap[parentId] : Object.values(featureIdMap)[0];

          if (!featureId) {
            result.errors.push(`Story ${story.id} has no parent feature, skipping`);
            continue;
          }

          const storyRecord = await storage.createStory({
            projectId: project.id,
            featureId: featureId,
            name: story.fields['System.Title'],
            description: this.stripHtml(story.fields['System.Description']),
            status: this.mapAzureStateToSafe(story.fields['System.State']),
            storyPoints: (story.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || story.fields['Microsoft.VSTS.Scheduling.Effort'])?.toString(),
            assignedTeam: story.fields['System.AssignedTo']?.displayName,
          });
          storyIdMap[story.id] = storyRecord.id;
          result.storiesCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create story from work item ${story.id}: ${error.message}`);
        }
      }

      for (const task of tasks) {
        try {
          const parentId = task.fields['System.Parent'];
          const storyId = parentId ? storyIdMap[parentId] : Object.values(storyIdMap)[0];
          const featureId = Object.values(featureIdMap)[0];

          if (!storyId || !featureId) {
            result.errors.push(`Task ${task.id} has no parent story/feature, skipping`);
            continue;
          }

          await storage.createTask({
            projectId: project.id,
            featureId: featureId,
            storyId: storyId,
            name: task.fields['System.Title'],
            description: this.stripHtml(task.fields['System.Description']),
            status: this.mapAzureStateToSafe(task.fields['System.State']),
            priority: this.mapAzurePriorityToSafe(task.fields['Microsoft.VSTS.Common.Priority']),
            assignee: task.fields['System.AssignedTo']?.displayName,
          });
          result.tasksCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create task from work item ${task.id}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Azure DevOps Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from ${this.projectName}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'azure_devops_sync',
        sourceId: this.projectName,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'Azure DevOps Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'azure_devops_sync',
        sourceId: this.projectName,
      });
    }

    return result;
  }
}

export async function createAzureDevOpsClientFromAdapter(adapterId: string): Promise<AzureDevOpsClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'azure_devops') {
    console.error(`Azure DevOps adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.organization) {
      console.error('Azure DevOps adapter missing required field: organization');
      return null;
    }
    if (!config.project) {
      console.error('Azure DevOps adapter missing required field: project');
      return null;
    }
    if (!config.personalAccessToken) {
      console.error('Azure DevOps adapter missing required field: personalAccessToken');
      return null;
    }
    
    return new AzureDevOpsClient({
      organization: config.organization,
      project: config.project,
      personalAccessToken: config.personalAccessToken,
    });
  } catch (error) {
    console.error('Failed to create Azure DevOps client:', error);
    return null;
  }
}
