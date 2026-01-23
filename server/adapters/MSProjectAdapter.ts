/**
 * MICROSOFT PROJECT ADAPTER
 *
 * Maps MS Project tasks/projects → Canonical Ontology
 *
 * MS Project Data Model:
 * - Projects (MPP files or Project Online)
 * - Tasks (work items with WBS)
 * - Resources (people, equipment, materials)
 * - Assignments (resource allocations to tasks)
 * - Baselines (planned vs actual tracking)
 *
 * Canonical Mapping:
 * - MS Project → Project
 * - Task → Work Item
 * - Summary Task → Workstream/Phase
 * - Baseline → Budget/Schedule Baseline
 *
 * API Reference (Project Online):
 * https://learn.microsoft.com/en-us/previous-versions/office/project-javascript-api/jj712820(v=office.15)
 *
 * Note: This adapter supports both Project Online (REST API) and
 * parsing of MS Project XML files exported from Project Desktop.
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class MSProjectAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.MS_PROJECT);
  }

  /**
   * MS Project Status → Universal Status Mapping
   *
   * MS Project tracks % complete and uses constraints
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'not started': UniversalStatus.PLANNED,
    'future': UniversalStatus.PLANNED,
    'scheduled': UniversalStatus.PLANNED,

    'in progress': UniversalStatus.ACTIVE,
    'active': UniversalStatus.ACTIVE,
    'started': UniversalStatus.ACTIVE,

    'completed': UniversalStatus.COMPLETED,
    'finished': UniversalStatus.COMPLETED,
    '100%': UniversalStatus.COMPLETED,

    'late': UniversalStatus.AT_RISK,
    'overdue': UniversalStatus.AT_RISK,
    'critical': UniversalStatus.AT_RISK,
  };

  /**
   * MS Project Priority → Universal Priority Mapping
   *
   * MS Project uses numeric priority 0-1000 (default 500)
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    // Map numeric ranges
    '900': UniversalPriority.CRITICAL, // 800-1000
    '800': UniversalPriority.CRITICAL,
    '700': UniversalPriority.HIGH,     // 600-799
    '600': UniversalPriority.HIGH,
    '500': UniversalPriority.MEDIUM,   // 400-599 (default)
    '400': UniversalPriority.MEDIUM,
    '300': UniversalPriority.LOW,      // 0-399
    '200': UniversalPriority.LOW,
    '100': UniversalPriority.LOW,
  };

  /**
   * MS Project Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'Id',                    // Unique task ID
    name: 'Name',                         // Task name
    description: 'Notes',                 // Task notes
    owner: 'ResourceNames',              // Assigned resources
    startDate: 'Start',                  // Start date
    endDate: 'Finish',                   // Finish date
    actualStartDate: 'ActualStart',      // Actual start
    actualEndDate: 'ActualFinish',       // Actual finish
    budget: 'Cost',                      // Planned cost
    budgetSpent: 'ActualCost',           // Actual cost
    budgetRemaining: 'RemainingCost',    // Remaining cost
    percentComplete: 'PercentComplete',  // % complete
  };

  /**
   * MS Project-specific transformation logic
   */
  async transform(rawTask: any): Promise<any> {
    // MS Project-specific preprocessing
    const preprocessed = this.preprocessMSProjectData(rawTask);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // MS Project-specific post-processing
      result.canonicalProject = this.postProcessMSProjectData(result.canonicalProject, rawTask);
    }

    return result;
  }

  /**
   * Preprocess MS Project data before transformation
   */
  private preprocessMSProjectData(task: any): any {
    const processed = { ...task };

    // Determine status from % complete
    const percentComplete = task.PercentComplete || 0;
    if (percentComplete === 0) {
      processed.status = 'not started';
    } else if (percentComplete === 100) {
      processed.status = 'completed';
    } else {
      processed.status = 'in progress';
    }

    // Check if task is late (past finish date but not complete)
    const finishDate = task.Finish ? new Date(task.Finish) : null;
    if (finishDate && finishDate < new Date() && percentComplete < 100) {
      processed.status = 'late';
    }

    // Check if task is on critical path
    if (task.Critical) {
      processed.isCriticalPath = true;
      if (percentComplete < 100) {
        processed.status = 'critical';
      }
    }

    // Normalize priority (0-1000 → text)
    if (task.Priority !== undefined) {
      const priority = parseInt(task.Priority);
      if (priority >= 800) {
        processed.priority = 'critical';
      } else if (priority >= 600) {
        processed.priority = 'high';
      } else if (priority >= 400) {
        processed.priority = 'medium';
      } else {
        processed.priority = 'low';
      }
    }

    // Parse resource assignments
    if (task.ResourceNames) {
      if (typeof task.ResourceNames === 'string') {
        processed.team = task.ResourceNames.split(',').map((r: string) => r.trim());
      } else if (Array.isArray(task.ResourceNames)) {
        processed.team = task.ResourceNames;
      }
    }

    // Parse WBS (Work Breakdown Structure)
    if (task.WBS) {
      processed.wbsCode = task.WBS;
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessMSProjectData(canonical: any, rawTask: any): any {
    // Calculate EVM metrics from MS Project baseline
    if (rawTask.BaselineCost && rawTask.ActualCost && rawTask.PercentComplete) {
      const plannedValue = rawTask.BaselineCost;
      const earnedValue = rawTask.BaselineCost * (rawTask.PercentComplete / 100);
      const actualCost = rawTask.ActualCost;

      canonical.cpi = actualCost > 0 ? earnedValue / actualCost : 1.0;
      canonical.spi = plannedValue > 0 ? earnedValue / plannedValue : 1.0;
    }

    // Extract baseline info
    if (rawTask.BaselineStart) {
      canonical.baselineStartDate = new Date(rawTask.BaselineStart);
    }
    if (rawTask.BaselineFinish) {
      canonical.baselineEndDate = new Date(rawTask.BaselineFinish);
    }
    if (rawTask.BaselineCost) {
      canonical.baselineBudget = rawTask.BaselineCost;
    }

    // Calculate variance
    if (rawTask.CostVariance) {
      canonical.costVariance = rawTask.CostVariance;
    }
    if (rawTask.DurationVariance) {
      canonical.scheduleVariance = rawTask.DurationVariance;
    }

    // Extract WBS hierarchy
    if (rawTask.WBS) {
      canonical.wbsCode = rawTask.WBS;

      // Extract parent from WBS (e.g., "1.2.3" → parent is "1.2")
      const wbsParts = rawTask.WBS.split('.');
      if (wbsParts.length > 1) {
        wbsParts.pop();
        canonical.parentWBS = wbsParts.join('.');
      }
    }

    // Summary task indicates this is a phase/workstream
    if (rawTask.Summary) {
      canonical.isWorkstream = true;
    }

    // Milestone flag
    if (rawTask.Milestone) {
      canonical.isMilestone = true;
    }

    // Critical path flag
    if (rawTask.Critical) {
      canonical.isCriticalPath = true;
    }

    // Extract custom fields (MS Project Enterprise Custom Fields)
    if (rawTask.Text1) canonical.customText1 = rawTask.Text1; // Often used for portfolio theme
    if (rawTask.Text2) canonical.customText2 = rawTask.Text2;
    if (rawTask.Number1) canonical.customNumber1 = rawTask.Number1; // Often ROI
    if (rawTask.Number2) canonical.customNumber2 = rawTask.Number2;

    // Portfolio theme from outline code or custom field
    if (rawTask.OutlineCode1) {
      canonical.portfolioTheme = rawTask.OutlineCode1;
    } else if (rawTask.Text1) {
      canonical.portfolioTheme = rawTask.Text1;
    }

    return canonical;
  }

  /**
   * Fetch tasks from MS Project Online (REST API)
   */
  async fetchFromProjectOnline(config: {
    siteUrl: string;      // SharePoint/Project Online site
    accessToken: string;  // OAuth token
    projectId?: string;   // Specific project GUID
  }): Promise<any[]> {
    try {
      const { siteUrl, accessToken, projectId } = config;

      let tasks: any[] = [];

      if (projectId) {
        // Fetch tasks from specific project
        tasks = await this.fetchProjectTasks(siteUrl, accessToken, projectId);
      } else {
        // Fetch all published projects
        const projects = await this.fetchAllProjects(siteUrl, accessToken);
        console.log(`[MSProjectAdapter] Found ${projects.length} projects`);

        // Fetch tasks from first 10 projects
        const projectsToFetch = projects.slice(0, 10);
        for (const project of projectsToFetch) {
          const projectTasks = await this.fetchProjectTasks(siteUrl, accessToken, project.Id);
          tasks.push(...projectTasks);
        }
      }

      console.log(`[MSProjectAdapter] Fetched ${tasks.length} total tasks`);
      return tasks;

    } catch (error: any) {
      console.error('[MSProjectAdapter] Error fetching from Project Online:', error);
      throw error;
    }
  }

  /**
   * Fetch all projects from Project Online
   */
  private async fetchAllProjects(siteUrl: string, accessToken: string): Promise<any[]> {
    const url = `${siteUrl}/_api/ProjectServer/Projects`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json;odata=verbose',
      },
    });

    if (!response.ok) {
      throw new Error(`Project Online API error: ${response.status}`);
    }

    const data = await response.json();
    return data.d?.results || [];
  }

  /**
   * Fetch tasks from a project
   */
  private async fetchProjectTasks(siteUrl: string, accessToken: string, projectId: string): Promise<any[]> {
    const url = `${siteUrl}/_api/ProjectServer/Projects('${projectId}')/Tasks`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json;odata=verbose',
      },
    });

    if (!response.ok) {
      throw new Error(`Project Online API error: ${response.status}`);
    }

    const data = await response.json();
    return data.d?.results || [];
  }

  /**
   * Test connection to Project Online
   */
  async testConnection(config: {
    siteUrl: string;
    accessToken: string;
  }): Promise<{ success: boolean; message: string; siteInfo?: any }> {
    try {
      const { siteUrl, accessToken } = config;

      // Test by fetching site info
      const url = `${siteUrl}/_api/ProjectServer`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json;odata=verbose',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      return {
        success: true,
        message: 'Connection successful',
        siteInfo: {
          siteUrl: siteUrl,
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
