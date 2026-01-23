/**
 * AZURE DEVOPS ADAPTER
 *
 * Maps Azure DevOps Work Items → Canonical Ontology
 *
 * Azure DevOps Data Model:
 * - Work Items (User Stories, Tasks, Bugs, Epics, Features)
 * - Iterations (sprints)
 * - Areas (teams/organizational hierarchy)
 * - Boards (Kanban-style workflow)
 *
 * Canonical Mapping:
 * - Azure DevOps Epic/Feature → Project
 * - Work Item → Task (or sub-project)
 * - Iteration → Program Increment (PI)
 * - Area Path → Division/Team
 *
 * API Reference:
 * https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class AzureDevOpsAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.AZURE_DEVOPS);
  }

  /**
   * Azure DevOps State → Universal Status Mapping
   *
   * Azure DevOps uses "State" field with customizable values.
   * Common states across all process templates:
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    // Agile Process
    'new': UniversalStatus.PLANNED,
    'proposed': UniversalStatus.PLANNED,
    'design': UniversalStatus.PLANNED,

    'active': UniversalStatus.ACTIVE,
    'committed': UniversalStatus.ACTIVE,
    'in progress': UniversalStatus.ACTIVE,
    'doing': UniversalStatus.ACTIVE,

    'resolved': UniversalStatus.COMPLETED,
    'done': UniversalStatus.COMPLETED,
    'closed': UniversalStatus.COMPLETED,
    'completed': UniversalStatus.COMPLETED,

    'removed': UniversalStatus.CANCELLED,
    'cut': UniversalStatus.CANCELLED,

    // CMMI Process
    'approved': UniversalStatus.PLANNED,
    'analyze': UniversalStatus.ACTIVE,
    'build': UniversalStatus.ACTIVE,
    'test': UniversalStatus.ACTIVE,

    // Scrum Process
    'to do': UniversalStatus.PLANNED,

    // Risk states
    'blocked': UniversalStatus.AT_RISK,
    'risk': UniversalStatus.AT_RISK,
  };

  /**
   * Azure DevOps Priority → Universal Priority Mapping
   *
   * Azure DevOps uses numeric priority (1-4) and severity.
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    // Numeric priority (1 is highest)
    '1': UniversalPriority.CRITICAL,
    '2': UniversalPriority.HIGH,
    '3': UniversalPriority.MEDIUM,
    '4': UniversalPriority.LOW,

    // Severity mapping
    '1 - critical': UniversalPriority.CRITICAL,
    '2 - high': UniversalPriority.HIGH,
    '3 - medium': UniversalPriority.MEDIUM,
    '4 - low': UniversalPriority.LOW,

    // Text priorities
    'critical': UniversalPriority.CRITICAL,
    'high': UniversalPriority.HIGH,
    'medium': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
  };

  /**
   * Azure DevOps Field Names → Canonical Field Names
   *
   * Azure DevOps uses System.* and Microsoft.VSTS.* field names.
   * Reference: https://learn.microsoft.com/en-us/azure/devops/boards/work-items/guidance/work-item-field
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'id',                                           // Work Item ID
    name: 'fields.System.Title',                                // Title
    description: 'fields.System.Description',                   // Description (HTML)
    owner: 'fields.System.AssignedTo.displayName',             // Assigned to
    startDate: 'fields.Microsoft.VSTS.Scheduling.StartDate',   // Start date
    endDate: 'fields.Microsoft.VSTS.Scheduling.FinishDate',    // Finish date
    actualStartDate: 'fields.Microsoft.VSTS.Scheduling.ActualStartDate',
    actualEndDate: 'fields.Microsoft.VSTS.Scheduling.ActualFinishDate',
    budget: 'fields.Microsoft.VSTS.Scheduling.OriginalEstimate', // Original estimate (hours)
    budgetSpent: 'fields.Microsoft.VSTS.Scheduling.CompletedWork', // Completed work (hours)
    budgetRemaining: 'fields.Microsoft.VSTS.Scheduling.RemainingWork', // Remaining work
    percentComplete: 'fields.Microsoft.VSTS.Scheduling.CompletedWork', // We'll calculate this
    artName: 'fields.System.IterationPath',                     // Iteration = Sprint/ART
    portfolioTheme: 'fields.System.AreaPath',                   // Area = Portfolio/Division
    epicId: 'fields.System.Parent',                             // Parent work item
    team: 'fields.System.AssignedTo.displayName',              // Team member
  };

  /**
   * Azure DevOps-specific transformation logic
   */
  async transform(rawWorkItem: any): Promise<any> {
    // Azure DevOps-specific preprocessing
    const preprocessed = this.preprocessAzureDevOpsData(rawWorkItem);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // Azure DevOps-specific post-processing
      result.canonicalProject = this.postProcessAzureDevOpsData(result.canonicalProject, rawWorkItem);
    }

    return result;
  }

  /**
   * Preprocess Azure DevOps data before transformation
   */
  private preprocessAzureDevOpsData(workItem: any): any {
    const processed = { ...workItem };

    // Extract state (Azure DevOps uses State field)
    if (workItem.fields?.['System.State']) {
      processed.status = workItem.fields['System.State'];
    }

    // Extract priority
    if (workItem.fields?.['Microsoft.VSTS.Common.Priority']) {
      processed.priority = String(workItem.fields['Microsoft.VSTS.Common.Priority']);
    } else if (workItem.fields?.['Microsoft.VSTS.Common.Severity']) {
      processed.priority = workItem.fields['Microsoft.VSTS.Common.Severity'];
    }

    // Calculate percent complete from effort tracking
    const originalEstimate = workItem.fields?.['Microsoft.VSTS.Scheduling.OriginalEstimate'];
    const completedWork = workItem.fields?.['Microsoft.VSTS.Scheduling.CompletedWork'];

    if (originalEstimate && originalEstimate > 0) {
      processed.percentComplete = Math.round((completedWork || 0) / originalEstimate * 100);
    } else if (workItem.fields?.['System.State']?.toLowerCase() === 'done' ||
               workItem.fields?.['System.State']?.toLowerCase() === 'closed') {
      processed.percentComplete = 100;
    } else if (workItem.fields?.['System.State']?.toLowerCase() === 'new') {
      processed.percentComplete = 0;
    }

    // Convert effort hours to financial estimates (if hourly rate available)
    // For now, just pass through the hours as budget
    if (originalEstimate) {
      processed.budget = originalEstimate * 100; // Assume $100/hour default
    }
    if (completedWork) {
      processed.budgetSpent = completedWork * 100;
    }

    // Extract team from assigned to and created by
    processed.team = [];
    if (workItem.fields?.['System.AssignedTo']?.displayName) {
      processed.team.push(workItem.fields['System.AssignedTo'].displayName);
    }
    if (workItem.fields?.['System.CreatedBy']?.displayName) {
      processed.team.push(workItem.fields['System.CreatedBy'].displayName);
    }

    // Tags become strategic alignment
    if (workItem.fields?.['System.Tags']) {
      processed.tags = workItem.fields['System.Tags'].split(';').map((t: string) => t.trim());
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessAzureDevOpsData(canonical: any, rawWorkItem: any): any {
    // Extract portfolio theme from Area Path
    // Area Path format: "CompanyName\\Division\\Team"
    if (rawWorkItem.fields?.['System.AreaPath']) {
      const areaPath = rawWorkItem.fields['System.AreaPath'];
      const parts = areaPath.split('\\');

      if (parts.length > 1) {
        canonical.divisionId = parts[1]; // Division
        canonical.portfolioTheme = parts[parts.length - 1]; // Team/Product
      } else {
        canonical.portfolioTheme = areaPath;
      }
    }

    // Extract sprint/iteration info
    // Iteration Path format: "CompanyName\\Release 1\\Sprint 1"
    if (rawWorkItem.fields?.['System.IterationPath']) {
      const iterationPath = rawWorkItem.fields['System.IterationPath'];
      const parts = iterationPath.split('\\');

      if (parts.length > 1) {
        canonical.piId = parts[1]; // Program Increment / Release
        canonical.artName = parts[parts.length - 1]; // Sprint
      }
    }

    // Count related work items by type
    if (rawWorkItem.relations) {
      const bugs = rawWorkItem.relations.filter((r: any) =>
        r.rel === 'System.LinkTypes.Hierarchy-Forward' &&
        r.attributes?.name?.toLowerCase().includes('bug')
      );
      canonical.defectCount = bugs.length;

      // Count risks
      const risks = rawWorkItem.relations.filter((r: any) =>
        r.attributes?.name?.toLowerCase().includes('risk') ||
        r.attributes?.name?.toLowerCase().includes('impediment')
      );
      canonical.criticalRiskCount = risks.length;
    }

    // Extract work item type for categorization
    if (rawWorkItem.fields?.['System.WorkItemType']) {
      canonical.projectType = rawWorkItem.fields['System.WorkItemType'];
    }

    // Extract story points (common custom field)
    if (rawWorkItem.fields?.['Microsoft.VSTS.Scheduling.StoryPoints']) {
      canonical.storyPoints = rawWorkItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'];
    }

    // Map tags to OKRs if they follow convention
    if (rawWorkItem.fields?.['System.Tags']) {
      const tags = rawWorkItem.fields['System.Tags'].split(';').map((t: string) => t.trim());

      const okrTag = tags.find((t: string) => t.toUpperCase().startsWith('OKR:'));
      if (okrTag) {
        canonical.okrObjective = okrTag.replace(/^OKR:/i, '');
      }

      const themeTag = tags.find((t: string) => t.toUpperCase().startsWith('THEME:'));
      if (themeTag) {
        canonical.portfolioTheme = themeTag.replace(/^THEME:/i, '');
      }
    }

    // Extract value area (Business vs Architecture)
    if (rawWorkItem.fields?.['Microsoft.VSTS.Common.ValueArea']) {
      canonical.valueArea = rawWorkItem.fields['Microsoft.VSTS.Common.ValueArea'];
    }

    return canonical;
  }

  /**
   * Fetch work items from Azure DevOps API
   */
  async fetchFromAzureDevOps(config: {
    organization: string;
    project: string;
    personalAccessToken: string;
    workItemType?: string; // 'Epic', 'Feature', 'User Story', etc.
    iterationPath?: string;
    areaPath?: string;
  }): Promise<any[]> {
    try {
      const { organization, project, personalAccessToken, workItemType, iterationPath, areaPath } = config;

      // Build WIQL (Work Item Query Language) query
      let wiqlQuery = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] FROM WorkItems WHERE [System.TeamProject] = '${project}'`;

      if (workItemType) {
        wiqlQuery += ` AND [System.WorkItemType] = '${workItemType}'`;
      }

      if (iterationPath) {
        wiqlQuery += ` AND [System.IterationPath] UNDER '${iterationPath}'`;
      }

      if (areaPath) {
        wiqlQuery += ` AND [System.AreaPath] UNDER '${areaPath}'`;
      }

      // Step 1: Execute WIQL query to get work item IDs
      const wiqlUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=7.1`;

      const wiqlResponse = await fetch(wiqlUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query: wiqlQuery }),
      });

      if (!wiqlResponse.ok) {
        throw new Error(`Azure DevOps WIQL query error: ${wiqlResponse.status} ${await wiqlResponse.text()}`);
      }

      const wiqlData = await wiqlResponse.json();
      const workItemIds = wiqlData.workItems?.map((wi: any) => wi.id) || [];

      if (workItemIds.length === 0) {
        console.log('[AzureDevOpsAdapter] No work items found matching query');
        return [];
      }

      console.log(`[AzureDevOpsAdapter] Found ${workItemIds.length} work items, fetching details...`);

      // Step 2: Fetch full work item details (batch request)
      // Azure DevOps API allows up to 200 IDs per request
      const batchSize = 200;
      const allWorkItems = [];

      for (let i = 0; i < workItemIds.length; i += batchSize) {
        const batchIds = workItemIds.slice(i, i + batchSize);
        const idsParam = batchIds.join(',');

        const workItemsUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems?ids=${idsParam}&$expand=relations&api-version=7.1`;

        const workItemsResponse = await fetch(workItemsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        });

        if (!workItemsResponse.ok) {
          throw new Error(`Azure DevOps work items error: ${workItemsResponse.status}`);
        }

        const workItemsData = await workItemsResponse.json();
        allWorkItems.push(...(workItemsData.value || []));
      }

      console.log(`[AzureDevOpsAdapter] Successfully fetched ${allWorkItems.length} work items`);
      return allWorkItems;

    } catch (error: any) {
      console.error('[AzureDevOpsAdapter] Error fetching from Azure DevOps:', error);
      throw error;
    }
  }

  /**
   * Test connection to Azure DevOps
   */
  async testConnection(config: {
    organization: string;
    project: string;
    personalAccessToken: string;
  }): Promise<{ success: boolean; message: string; projectInfo?: any }> {
    try {
      const { organization, project, personalAccessToken } = config;

      // Test by fetching project info
      const url = `https://dev.azure.com/${organization}/_apis/projects/${project}?api-version=7.1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const projectInfo = await response.json();

      return {
        success: true,
        message: 'Connection successful',
        projectInfo: {
          id: projectInfo.id,
          name: projectInfo.name,
          description: projectInfo.description,
          url: projectInfo.url,
          state: projectInfo.state,
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
