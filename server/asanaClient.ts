import { storage } from "./storage";

export interface AsanaConfig {
  accessToken: string;
  workspaceGid?: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  resource_type: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  notes: string;
  color: string;
  archived: boolean;
  created_at: string;
  modified_at: string;
  owner?: { gid: string; name: string };
  current_status?: { color: string; text: string };
  workspace: { gid: string; name: string };
}

export interface AsanaSection {
  gid: string;
  name: string;
  project: { gid: string };
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes: string;
  completed: boolean;
  completed_at?: string;
  due_on?: string;
  start_on?: string;
  assignee?: { gid: string; name: string };
  parent?: { gid: string; name: string };
  memberships: { section: { gid: string; name: string } }[];
  custom_fields?: { gid: string; name: string; display_value: string }[];
  subtasks?: AsanaTask[];
}

export interface AsanaSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class AsanaClient {
  private baseUrl = 'https://app.asana.com/api/1.0';
  private accessToken: string;
  private workspaceGid?: string;

  constructor(config: AsanaConfig) {
    this.accessToken = config.accessToken;
    this.workspaceGid = config.workspaceGid;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Asana API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/users/me');
      return { success: true, message: 'Successfully connected to Asana' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getWorkspaces(): Promise<AsanaWorkspace[]> {
    return this.request<AsanaWorkspace[]>('/workspaces');
  }

  async getProjects(workspaceGid?: string): Promise<AsanaProject[]> {
    const wsGid = workspaceGid || this.workspaceGid;
    if (!wsGid) {
      const workspaces = await this.getWorkspaces();
      if (workspaces.length === 0) throw new Error('No workspaces available');
      return this.request<AsanaProject[]>(`/workspaces/${workspaces[0].gid}/projects?opt_fields=name,notes,color,archived,owner,current_status`);
    }
    return this.request<AsanaProject[]>(`/workspaces/${wsGid}/projects?opt_fields=name,notes,color,archived,owner,current_status`);
  }

  async getProject(projectGid: string): Promise<AsanaProject> {
    return this.request<AsanaProject>(`/projects/${projectGid}?opt_fields=name,notes,color,archived,owner,current_status,workspace`);
  }

  async getSections(projectGid: string): Promise<AsanaSection[]> {
    return this.request<AsanaSection[]>(`/projects/${projectGid}/sections`);
  }

  async getTasks(projectGid: string): Promise<AsanaTask[]> {
    return this.request<AsanaTask[]>(
      `/projects/${projectGid}/tasks?opt_fields=name,notes,completed,completed_at,due_on,start_on,assignee,parent,memberships.section,custom_fields`
    );
  }

  async getSubtasks(taskGid: string): Promise<AsanaTask[]> {
    return this.request<AsanaTask[]>(
      `/tasks/${taskGid}/subtasks?opt_fields=name,notes,completed,assignee`
    );
  }

  private mapAsanaStatusToSafe(completed: boolean): string {
    return completed ? 'completed' : 'not-started';
  }

  private mapAsanaColorToHealth(color: string, statusColor?: string): string {
    const c = (statusColor || color || '').toLowerCase();
    if (c.includes('green') || c.includes('complete')) return 'green';
    if (c.includes('red') || c.includes('at_risk')) return 'red';
    if (c.includes('yellow') || c.includes('amber') || c.includes('off_track')) return 'amber';
    return 'green';
  }

  async syncProject(projectGid: string, sourceSystemId: string): Promise<AsanaSyncResult> {
    const result: AsanaSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const asanaProject = await this.getProject(projectGid);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === asanaProject.name);

      if (!project) {
        project = await storage.createProject({
          name: asanaProject.name,
          description: asanaProject.notes || `Imported from Asana`,
          status: this.mapAsanaColorToHealth(asanaProject.color, asanaProject.current_status?.color),
        });
        result.projectsCreated++;
      }

      const sections = await this.getSections(projectGid);
      const sectionIdMap: Record<string, string> = {};

      for (const section of sections) {
        try {
          const feature = await storage.createFeature({
            projectId: project.id,
            name: section.name,
            description: `Section from Asana project`,
            status: 'not-started',
            priority: 'medium',
          });
          sectionIdMap[section.gid] = feature.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from section ${section.name}: ${error.message}`);
        }
      }

      const tasks = await this.getTasks(projectGid);
      const taskIdMap: Record<string, string> = {};

      const topLevelTasks = tasks.filter(t => !t.parent);

      for (const task of topLevelTasks) {
        try {
          const sectionGid = task.memberships?.[0]?.section?.gid;
          const featureId = sectionGid ? sectionIdMap[sectionGid] : Object.values(sectionIdMap)[0];

          if (!featureId) {
            result.errors.push(`Task ${task.name} has no section, skipping`);
            continue;
          }

          const story = await storage.createStory({
            projectId: project.id,
            featureId,
            name: task.name,
            description: task.notes || '',
            status: this.mapAsanaStatusToSafe(task.completed),
            assignedTeam: task.assignee?.name,
          });
          taskIdMap[task.gid] = story.id;
          result.storiesCreated++;

          try {
            const subtasks = await this.getSubtasks(task.gid);
            for (const subtask of subtasks) {
              try {
                await storage.createTask({
                  projectId: project.id,
                  featureId,
                  storyId: story.id,
                  name: subtask.name,
                  description: subtask.notes || '',
                  status: this.mapAsanaStatusToSafe(subtask.completed),
                  priority: 'medium',
                  assignee: subtask.assignee?.name,
                });
                result.tasksCreated++;
              } catch (error: any) {
                result.errors.push(`Failed to create task from subtask ${subtask.name}: ${error.message}`);
              }
            }
          } catch (error: any) {
            result.errors.push(`Failed to fetch subtasks for ${task.name}: ${error.message}`);
          }
        } catch (error: any) {
          result.errors.push(`Failed to create story from task ${task.name}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Asana Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from ${asanaProject.name}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'asana_sync',
        sourceId: projectGid,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'Asana Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'asana_sync',
        sourceId: projectGid,
      });
    }

    return result;
  }
}

export async function createAsanaClientFromAdapter(adapterId: string): Promise<AsanaClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'asana') {
    console.error(`Asana adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.accessToken) {
      console.error('Asana adapter missing required field: accessToken');
      return null;
    }
    
    return new AsanaClient({
      accessToken: config.accessToken,
      workspaceGid: config.workspaceGid,
    });
  } catch (error) {
    console.error('Failed to create Asana client:', error);
    return null;
  }
}
