/**
 * ASANA ADAPTER
 *
 * Maps Asana tasks/projects → Canonical Ontology
 *
 * Asana Data Model:
 * - Tasks (individual work items)
 * - Projects (collections of tasks)
 * - Sections (task groupings within projects)
 * - Portfolios (collections of projects)
 * - Custom Fields
 *
 * Canonical Mapping:
 * - Asana Project → Project
 * - Asana Task → Work Item
 * - Asana Portfolio → Portfolio Theme
 * - Asana Section → Workstream
 *
 * API Reference:
 * https://developers.asana.com/reference/rest-api-reference
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class AsanaAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.ASANA);
  }

  /**
   * Asana doesn't have predefined statuses - uses custom fields and sections
   * Map common section names and custom field values to universal status
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'to do': UniversalStatus.PLANNED,
    'backlog': UniversalStatus.PLANNED,
    'upcoming': UniversalStatus.PLANNED,
    'planned': UniversalStatus.PLANNED,
    'not started': UniversalStatus.PLANNED,

    'in progress': UniversalStatus.ACTIVE,
    'in review': UniversalStatus.ACTIVE,
    'doing': UniversalStatus.ACTIVE,
    'active': UniversalStatus.ACTIVE,

    'done': UniversalStatus.COMPLETED,
    'complete': UniversalStatus.COMPLETED,
    'completed': UniversalStatus.COMPLETED,
    'shipped': UniversalStatus.COMPLETED,

    'blocked': UniversalStatus.AT_RISK,
    'waiting': UniversalStatus.AT_RISK,

    'on hold': UniversalStatus.ON_HOLD,
    'paused': UniversalStatus.ON_HOLD,
  };

  /**
   * Asana Priority → Universal Priority Mapping
   *
   * Asana doesn't have built-in priority - uses custom fields
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'urgent': UniversalPriority.CRITICAL,
    'critical': UniversalPriority.CRITICAL,
    'high': UniversalPriority.HIGH,
    'medium': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
    'none': UniversalPriority.LOW,
  };

  /**
   * Asana Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'gid',                    // Global ID
    name: 'name',                         // Task/project name
    description: 'notes',                 // Description/notes
    owner: 'assignee.name',              // Assigned to
    startDate: 'start_on',               // Start date
    endDate: 'due_on',                   // Due date
    actualEndDate: 'completed_at',       // Completion date
    portfolioTheme: 'workspace.name',    // Workspace/portfolio
  };

  /**
   * Asana-specific transformation logic
   */
  async transform(rawTask: any): Promise<any> {
    // Asana-specific preprocessing
    const preprocessed = this.preprocessAsanaData(rawTask);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // Asana-specific post-processing
      result.canonicalProject = this.postProcessAsanaData(result.canonicalProject, rawTask);
    }

    return result;
  }

  /**
   * Preprocess Asana data before transformation
   */
  private preprocessAsanaData(task: any): any {
    const processed = { ...task };

    // Determine status from completion and section
    if (task.completed) {
      processed.status = 'completed';
      processed.percentComplete = 100;
    } else {
      // Use section name as status indicator
      if (task.memberships?.[0]?.section?.name) {
        processed.status = task.memberships[0].section.name;
      } else {
        processed.status = 'active';
      }
      processed.percentComplete = 0; // Asana doesn't track progress natively
    }

    // Extract priority from custom fields
    if (task.custom_fields) {
      for (const field of task.custom_fields) {
        const fieldName = field.name?.toLowerCase() || '';

        if (fieldName.includes('priority')) {
          processed.priority = field.display_value || field.enum_value?.name;
        } else if (fieldName.includes('status')) {
          processed.status = field.display_value || field.enum_value?.name;
        } else if (fieldName.includes('budget') || fieldName.includes('cost')) {
          processed.budget = parseFloat(field.number_value || field.display_value || '0');
        } else if (fieldName.includes('roi')) {
          processed.expectedROI = parseFloat(field.number_value || '0');
        } else if (fieldName.includes('theme') || fieldName.includes('portfolio')) {
          processed.portfolioTheme = field.display_value || field.text_value;
        }
      }
    }

    // Extract team members
    processed.team = [];
    if (task.assignee?.name) {
      processed.team.push(task.assignee.name);
    }
    if (task.followers) {
      processed.team.push(...task.followers.map((f: any) => f.name).filter(Boolean));
    }

    // Parse tags
    if (task.tags) {
      processed.tags = task.tags.map((t: any) => t.name);
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessAsanaData(canonical: any, rawTask: any): any {
    // Extract project info
    if (rawTask.projects?.[0]) {
      canonical.portfolioTheme = rawTask.projects[0].name;
      canonical.parentProjectId = rawTask.projects[0].gid;
    }

    // Extract workspace (organization)
    if (rawTask.workspace?.name) {
      canonical.divisionId = rawTask.workspace.name;
    }

    // Extract section (workstream)
    if (rawTask.memberships?.[0]?.section?.name) {
      canonical.workstream = rawTask.memberships[0].section.name;
    }

    // Count subtasks
    if (rawTask.num_subtasks) {
      canonical.subtaskCount = rawTask.num_subtasks;
    }

    // Count attachments
    if (rawTask.num_attachments) {
      canonical.attachmentCount = rawTask.num_attachments;
    }

    // Extract tags and map to OKRs
    if (rawTask.tags) {
      const okrTag = rawTask.tags.find((t: any) =>
        t.name?.toUpperCase().startsWith('OKR:')
      );
      if (okrTag) {
        canonical.okrObjective = okrTag.name.replace(/^OKR:/i, '');
      }
    }

    // Liked status can indicate importance
    if (rawTask.num_hearts > 0) {
      canonical.importanceScore = rawTask.num_hearts;
    }

    return canonical;
  }

  /**
   * Fetch projects from Asana API
   */
  async fetchFromAsana(config: {
    accessToken: string;
    workspaceId: string;
    projectId?: string;
    portfolioId?: string;
  }): Promise<any[]> {
    try {
      const { accessToken, workspaceId, projectId, portfolioId } = config;

      let tasks: any[] = [];

      if (projectId) {
        // Fetch tasks from specific project
        tasks = await this.fetchProjectTasks(accessToken, projectId);
      } else if (portfolioId) {
        // Fetch all projects in portfolio, then tasks
        const projects = await this.fetchPortfolioProjects(accessToken, portfolioId);
        for (const project of projects) {
          const projectTasks = await this.fetchProjectTasks(accessToken, project.gid);
          tasks.push(...projectTasks);
        }
      } else {
        // Fetch all projects in workspace
        const projects = await this.fetchWorkspaceProjects(accessToken, workspaceId);
        console.log(`[AsanaAdapter] Found ${projects.length} projects in workspace`);

        // For large workspaces, limit to first 10 projects
        const projectsToFetch = projects.slice(0, 10);
        for (const project of projectsToFetch) {
          const projectTasks = await this.fetchProjectTasks(accessToken, project.gid);
          tasks.push(...projectTasks);
        }
      }

      console.log(`[AsanaAdapter] Fetched ${tasks.length} total tasks`);
      return tasks;

    } catch (error: any) {
      console.error('[AsanaAdapter] Error fetching from Asana:', error);
      throw error;
    }
  }

  /**
   * Fetch projects in workspace
   */
  private async fetchWorkspaceProjects(accessToken: string, workspaceId: string): Promise<any[]> {
    const url = `https://app.asana.com/api/1.0/projects?workspace=${workspaceId}&archived=false`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Asana API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Fetch projects in portfolio
   */
  private async fetchPortfolioProjects(accessToken: string, portfolioId: string): Promise<any[]> {
    const url = `https://app.asana.com/api/1.0/portfolios/${portfolioId}/items`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Asana API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Fetch tasks from a project
   */
  private async fetchProjectTasks(accessToken: string, projectId: string): Promise<any[]> {
    const url = `https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=gid,name,notes,assignee,completed,due_on,start_on,completed_at,custom_fields,tags,projects,workspace,memberships.section,num_subtasks,num_attachments,num_hearts,followers`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Asana API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Test connection to Asana
   */
  async testConnection(config: {
    accessToken: string;
  }): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      const { accessToken } = config;

      // Test by fetching current user
      const url = 'https://app.asana.com/api/1.0/users/me';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      const user = data.data;

      return {
        success: true,
        message: 'Connection successful',
        userInfo: {
          gid: user.gid,
          name: user.name,
          email: user.email,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}
