import { storage } from "./storage";

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string | { content?: any[] };
    issuetype: { name: string; id: string };
    status: { name: string; statusCategory: { key: string } };
    priority?: { name: string };
    assignee?: { displayName: string; emailAddress: string };
    reporter?: { displayName: string };
    created: string;
    updated: string;
    parent?: { key: string; id: string };
    subtasks?: JiraIssue[];
    customfield_10016?: number; // Story points (common field)
    [key: string]: any;
  };
}

export interface JiraSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class JiraClient {
  private baseUrl: string;
  private authHeader: string;
  private projectKey?: string;

  constructor(config: JiraConfig) {
    this.baseUrl = `https://${config.domain}.atlassian.net/rest/api/3`;
    this.authHeader = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.projectKey = config.projectKey;
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
      throw new Error(`Jira API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/myself');
      return { success: true, message: 'Successfully connected to Jira' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getProjects(): Promise<JiraProject[]> {
    const response = await this.request<{ values: JiraProject[] }>('/project/search');
    return response.values;
  }

  async getProject(projectKey: string): Promise<JiraProject> {
    return this.request<JiraProject>(`/project/${projectKey}`);
  }

  async getIssues(projectKey: string, issueType?: string, maxResults = 100): Promise<JiraIssue[]> {
    let jql = `project = ${projectKey}`;
    if (issueType) {
      jql += ` AND issuetype = "${issueType}"`;
    }
    jql += ' ORDER BY created DESC';

    // Use new search/jql endpoint with fields parameter
    const fields = 'summary,description,issuetype,status,priority,assignee,reporter,created,updated,parent,subtasks,customfield_10016';
    const response = await this.request<{ issues: JiraIssue[] }>(
      `/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${fields}`,
      { method: 'GET' }
    );
    return response.issues || [];
  }

  async getEpics(projectKey: string): Promise<JiraIssue[]> {
    return this.getIssues(projectKey, 'Epic');
  }

  async getStories(projectKey: string): Promise<JiraIssue[]> {
    return this.getIssues(projectKey, 'Story');
  }

  async getTasks(projectKey: string): Promise<JiraIssue[]> {
    const tasks = await this.getIssues(projectKey, 'Task');
    const subtasks = await this.getIssues(projectKey, 'Sub-task');
    return [...tasks, ...subtasks];
  }

  async getAllIssues(projectKey: string): Promise<JiraIssue[]> {
    return this.getIssues(projectKey);
  }

  private extractDescription(desc: string | { content?: any[] } | undefined): string {
    if (!desc) return '';
    if (typeof desc === 'string') return desc;
    if (desc.content) {
      return desc.content
        .map((block: any) => {
          if (block.content) {
            return block.content.map((item: any) => item.text || '').join('');
          }
          return '';
        })
        .join('\n');
    }
    return '';
  }

  private mapJiraStatusToSafe(statusCategory: string): string {
    switch (statusCategory.toLowerCase()) {
      case 'done':
        return 'completed';
      case 'indeterminate':
        return 'in-progress';
      case 'new':
      default:
        return 'not-started';
    }
  }

  private mapJiraStatusToProjectHealth(statusCategory: string): string {
    switch (statusCategory.toLowerCase()) {
      case 'done':
        return 'green';
      case 'indeterminate':
        return 'amber';
      case 'new':
      default:
        return 'green';
    }
  }

  async syncProject(projectKey: string, sourceSystemId: string): Promise<JiraSyncResult> {
    const result: JiraSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const jiraProject = await this.getProject(projectKey);
      
      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === jiraProject.name || p.name === jiraProject.key);

      if (!project) {
        project = await storage.createProject({
          name: jiraProject.name,
          description: jiraProject.description || `Imported from Jira: ${jiraProject.key}`,
          status: 'green',
        });
        result.projectsCreated++;
      }

      const allIssues = await this.getAllIssues(projectKey);
      const epics = allIssues.filter(i => i.fields.issuetype.name === 'Epic');
      const stories = allIssues.filter(i => i.fields.issuetype.name === 'Story');
      const tasks = allIssues.filter(i => 
        i.fields.issuetype.name === 'Task' || i.fields.issuetype.name === 'Sub-task'
      );

      const epicIdMap: Record<string, string> = {};

      for (const epic of epics) {
        try {
          const feature = await storage.createFeature({
            projectId: project.id,
            name: epic.fields.summary,
            description: this.extractDescription(epic.fields.description),
            status: this.mapJiraStatusToSafe(epic.fields.status.statusCategory.key),
            priority: epic.fields.priority?.name || 'medium',
            storyPoints: epic.fields.customfield_10016?.toString(),
          });
          epicIdMap[epic.id] = feature.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from epic ${epic.key}: ${error.message}`);
        }
      }

      const storyIdMap: Record<string, string> = {};

      for (const story of stories) {
        try {
          const parentEpicId = story.fields.parent?.id;
          const featureId = parentEpicId ? epicIdMap[parentEpicId] : Object.values(epicIdMap)[0];

          if (!featureId) {
            result.errors.push(`Story ${story.key} has no parent feature, skipping`);
            continue;
          }

          const storyRecord = await storage.createStory({
            projectId: project.id,
            featureId: featureId,
            name: story.fields.summary,
            description: this.extractDescription(story.fields.description),
            status: this.mapJiraStatusToSafe(story.fields.status.statusCategory.key),
            storyPoints: story.fields.customfield_10016?.toString(),
            assignedTeam: story.fields.assignee?.displayName,
          });
          storyIdMap[story.id] = storyRecord.id;
          result.storiesCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create story from ${story.key}: ${error.message}`);
        }
      }

      for (const task of tasks) {
        try {
          const parentId = task.fields.parent?.id;
          const storyId = parentId ? storyIdMap[parentId] : Object.values(storyIdMap)[0];
          const featureId = Object.values(epicIdMap)[0];

          if (!storyId || !featureId) {
            result.errors.push(`Task ${task.key} has no parent story/feature, skipping`);
            continue;
          }

          await storage.createTask({
            projectId: project.id,
            featureId: featureId,
            storyId: storyId,
            name: task.fields.summary,
            description: this.extractDescription(task.fields.description),
            status: this.mapJiraStatusToSafe(task.fields.status.statusCategory.key),
            priority: task.fields.priority?.name || 'medium',
            assignee: task.fields.assignee?.displayName,
          });
          result.tasksCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create task from ${task.key}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Jira Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from ${projectKey}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'jira_sync',
        sourceId: projectKey,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      
      await storage.createNotification({
        type: 'sync_failure',
        title: 'Jira Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'jira_sync',
        sourceId: projectKey,
      });
    }

    return result;
  }
}

export async function createJiraClientFromAdapter(adapterId: string): Promise<JiraClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'jira') {
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    return new JiraClient({
      domain: config.domain,
      email: config.email,
      apiToken: config.apiToken,
      projectKey: config.projectKey,
    });
  } catch (error) {
    console.error('Failed to create Jira client:', error);
    return null;
  }
}
