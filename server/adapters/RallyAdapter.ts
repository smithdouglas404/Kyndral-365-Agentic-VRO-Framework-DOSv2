/**
 * RALLY (BROADCOM) ADAPTER
 *
 * Maps Rally artifacts → Canonical Ontology
 *
 * Rally Data Model:
 * - User Stories
 * - Defects
 * - Epics (Portfolio Items)
 * - Features
 * - Releases
 * - Iterations
 *
 * Canonical Mapping:
 * - Rally Epic/Feature → Project
 * - User Story → Work Item
 * - Iteration → Sprint
 * - Release → Program Increment
 *
 * API Reference:
 * https://rally1.rallydev.com/slm/doc/webservice/
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class RallyAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.RALLY);
  }

  /**
   * Rally ScheduleState → Universal Status Mapping
   *
   * Rally uses ScheduleState for tracking progress
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'defined': UniversalStatus.PLANNED,
    'idea': UniversalStatus.PLANNED,
    'backlog': UniversalStatus.PLANNED,

    'in-progress': UniversalStatus.ACTIVE,
    'in progress': UniversalStatus.ACTIVE,
    'developing': UniversalStatus.ACTIVE,
    'testing': UniversalStatus.ACTIVE,

    'completed': UniversalStatus.COMPLETED,
    'accepted': UniversalStatus.COMPLETED,
    'released': UniversalStatus.COMPLETED,

    'blocked': UniversalStatus.AT_RISK,
    'stuck': UniversalStatus.AT_RISK,

    'deferred': UniversalStatus.ON_HOLD,
    'on hold': UniversalStatus.ON_HOLD,
  };

  /**
   * Rally Priority → Universal Priority Mapping
   *
   * Rally uses text-based priority
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'resolve immediately': UniversalPriority.CRITICAL,
    'high attention': UniversalPriority.HIGH,
    'normal': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
  };

  /**
   * Rally Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'FormattedID',           // US123, DE456
    name: 'Name',                         // Title
    description: 'Description',           // HTML description
    owner: 'Owner._refObjectName',       // Assigned user
    startDate: 'CreationDate',           // Rally doesn't have explicit start date
    endDate: 'PlannedEndDate',           // Target date
    actualEndDate: 'AcceptedDate',       // When accepted
    percentComplete: 'PercentDoneByStoryPlanEstimate', // Progress metric
    portfolioTheme: 'Project.Name',      // Rally Project
    epicId: 'PortfolioItem._refObjectName', // Parent epic/feature
    artName: 'Iteration.Name',           // Sprint/iteration name
    piId: 'Release.Name',                // Release
  };

  /**
   * Rally-specific transformation logic
   */
  async transform(rawArtifact: any): Promise<any> {
    // Rally-specific preprocessing
    const preprocessed = this.preprocessRallyData(rawArtifact);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // Rally-specific post-processing
      result.canonicalProject = this.postProcessRallyData(result.canonicalProject, rawArtifact);
    }

    return result;
  }

  /**
   * Preprocess Rally data before transformation
   */
  private preprocessRallyData(artifact: any): any {
    const processed = { ...artifact };

    // Map ScheduleState to status
    if (artifact.ScheduleState) {
      processed.status = artifact.ScheduleState;
    }

    // Calculate percent complete from Plan Estimate
    if (artifact.PlanEstimate && artifact.TaskEstimateTotal && artifact.TaskRemainingTotal !== undefined) {
      const completed = artifact.TaskEstimateTotal - artifact.TaskRemainingTotal;
      processed.percentComplete = Math.round((completed / artifact.TaskEstimateTotal) * 100);
    } else if (artifact.PercentDoneByStoryPlanEstimate !== undefined) {
      processed.percentComplete = artifact.PercentDoneByStoryPlanEstimate * 100;
    }

    // Convert story points to effort estimate (assume 8 hours per point)
    if (artifact.PlanEstimate) {
      processed.budget = artifact.PlanEstimate * 8 * 100; // Story points * hours * hourly rate
    }

    // Extract team from Owner
    processed.team = [];
    if (artifact.Owner?._refObjectName) {
      processed.team.push(artifact.Owner._refObjectName);
    }
    if (artifact.SubmittedBy?._refObjectName) {
      processed.team.push(artifact.SubmittedBy._refObjectName);
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessRallyData(canonical: any, rawArtifact: any): any {
    // Extract project/portfolio info
    if (rawArtifact.Project?.Name) {
      canonical.portfolioTheme = rawArtifact.Project.Name;
    }

    // Extract release info (PI)
    if (rawArtifact.Release?.Name) {
      canonical.piId = rawArtifact.Release.Name;
    }

    // Extract iteration/sprint
    if (rawArtifact.Iteration?.Name) {
      canonical.artName = rawArtifact.Iteration.Name;
    }

    // Count defects
    if (rawArtifact.Defects) {
      canonical.defectCount = rawArtifact.Defects.Count || 0;
    }

    // Extract portfolio item hierarchy (Epic → Feature)
    if (rawArtifact.PortfolioItem) {
      canonical.epicId = rawArtifact.PortfolioItem.FormattedID;
      canonical.parentProjectId = rawArtifact.PortfolioItem._ref;
    }

    // Rally-specific metrics
    if (rawArtifact.PlanEstimate) {
      canonical.storyPoints = rawArtifact.PlanEstimate;
    }

    // Extract tags
    if (rawArtifact.Tags?._tagsNameArray) {
      canonical.tags = rawArtifact.Tags._tagsNameArray;

      // Look for OKR tags
      const okrTag = canonical.tags.find((t: string) => t.toUpperCase().startsWith('OKR:'));
      if (okrTag) {
        canonical.okrObjective = okrTag.replace(/^OKR:/i, '');
      }
    }

    // Calculate velocity (for forecasting)
    if (rawArtifact.Iteration?.PlannedVelocity) {
      canonical.plannedVelocity = rawArtifact.Iteration.PlannedVelocity;
    }

    return canonical;
  }

  /**
   * Fetch artifacts from Rally API
   */
  async fetchFromRally(config: {
    apiKey: string;
    workspace: string;
    project?: string;
    artifactType?: 'HierarchicalRequirement' | 'PortfolioItem/Feature' | 'PortfolioItem/Epic' | 'Defect';
    query?: string;
  }): Promise<any[]> {
    try {
      const { apiKey, workspace, project, artifactType = 'HierarchicalRequirement', query } = config;

      // Build query
      let queryStr = query || '(ScheduleState != "")';
      if (project) {
        queryStr += ` AND (Project.Name = "${project}")`;
      }

      // Rally WSAPI endpoint
      const url = new URL(`https://rally1.rallydev.com/slm/webservice/v2.0/${artifactType}`);
      url.searchParams.set('workspace', workspace);
      url.searchParams.set('query', queryStr);
      url.searchParams.set('fetch', 'FormattedID,Name,Description,ScheduleState,Owner,PlanEstimate,Iteration,Release,Project,PortfolioItem,Defects,Tags,PercentDoneByStoryPlanEstimate,CreationDate,PlannedEndDate,AcceptedDate,Priority');
      url.searchParams.set('pagesize', '200');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'ZSESSIONID': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Rally API error: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      const results = data.QueryResult?.Results || [];

      console.log(`[RallyAdapter] Fetched ${results.length} ${artifactType} artifacts`);
      return results;

    } catch (error: any) {
      console.error('[RallyAdapter] Error fetching from Rally:', error);
      throw error;
    }
  }

  /**
   * Test connection to Rally
   */
  async testConnection(config: {
    apiKey: string;
    workspace: string;
  }): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      const { apiKey, workspace } = config;

      // Test by fetching user info
      const url = `https://rally1.rallydev.com/slm/webservice/v2.0/user?fetch=UserName,DisplayName,EmailAddress&workspace=${workspace}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'ZSESSIONID': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      const user = data.QueryResult?.Results?.[0];

      return {
        success: true,
        message: 'Connection successful',
        userInfo: {
          userName: user?.UserName,
          displayName: user?.DisplayName,
          email: user?.EmailAddress,
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
