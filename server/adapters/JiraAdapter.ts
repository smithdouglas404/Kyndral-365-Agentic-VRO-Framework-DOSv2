/**
 * JIRA ADAPTER
 *
 * Maps Jira issues/epics → Canonical Ontology
 *
 * Jira Data Model:
 * - Issues (tasks, stories, bugs)
 * - Epics (large features)
 * - Sprints (time-boxed iterations)
 * - Story Points (estimation)
 *
 * Canonical Mapping:
 * - Jira Epic → Project
 * - Jira Issue → Work Item (or sub-project)
 * - Sprint → Program Increment (PI)
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class JiraAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.JIRA);
  }

  /**
   * Jira Status → Universal Status Mapping
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    // Jira standard statuses
    'to do': UniversalStatus.PLANNED,
    'planned': UniversalStatus.PLANNED,
    'backlog': UniversalStatus.PLANNED,

    'in progress': UniversalStatus.ACTIVE,
    'in review': UniversalStatus.ACTIVE,
    'in testing': UniversalStatus.ACTIVE,

    'done': UniversalStatus.COMPLETED,
    'closed': UniversalStatus.COMPLETED,
    'resolved': UniversalStatus.COMPLETED,

    'blocked': UniversalStatus.AT_RISK,
    'impediment': UniversalStatus.AT_RISK,

    'cancelled': UniversalStatus.CANCELLED,
    'wont do': UniversalStatus.CANCELLED,

    'on hold': UniversalStatus.ON_HOLD,
    'paused': UniversalStatus.ON_HOLD,
  };

  /**
   * Jira Priority → Universal Priority Mapping
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'highest': UniversalPriority.CRITICAL,
    'critical': UniversalPriority.CRITICAL,
    'blocker': UniversalPriority.CRITICAL,

    'high': UniversalPriority.HIGH,
    'major': UniversalPriority.HIGH,

    'medium': UniversalPriority.MEDIUM,
    'normal': UniversalPriority.MEDIUM,

    'low': UniversalPriority.LOW,
    'minor': UniversalPriority.LOW,
    'trivial': UniversalPriority.LOW,
  };

  /**
   * Jira Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'key',                        // PROJ-123
    name: 'fields.summary',                   // Issue title
    description: 'fields.description',        // Issue description
    owner: 'fields.assignee.displayName',     // Assigned to
    startDate: 'fields.created',              // Created date (Jira doesn't have explicit start)
    endDate: 'fields.duedate',                // Due date
    percentComplete: 'fields.progress.percent', // Progress %
    team: 'fields.components',                // Component = team
    epicId: 'fields.epic.key',                // Parent epic
    artName: 'fields.customfield_sprint',     // Sprint = ART (Agile Release Train)
    portfolioTheme: 'fields.project.name',    // Jira Project = Portfolio Theme
  };

  /**
   * Jira-specific transformation logic
   */
  async transform(rawJiraIssue: any): Promise<any> {
    // Jira-specific preprocessing
    const preprocessed = this.preprocessJiraData(rawJiraIssue);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // Jira-specific post-processing
      result.canonicalProject = this.postProcessJiraData(result.canonicalProject, rawJiraIssue);
    }

    return result;
  }

  /**
   * Preprocess Jira data before transformation
   */
  private preprocessJiraData(jiraIssue: any): any {
    const processed = { ...jiraIssue };

    // Calculate progress from Story Points if available
    if (jiraIssue.fields?.aggregateprogress) {
      const progress = jiraIssue.fields.aggregateprogress;
      if (progress.total > 0) {
        processed.percentComplete = Math.round((progress.progress / progress.total) * 100);
      }
    }

    // Extract team members from assignee and reporter
    processed.team = [];
    if (jiraIssue.fields?.assignee?.displayName) {
      processed.team.push(jiraIssue.fields.assignee.displayName);
    }
    if (jiraIssue.fields?.reporter?.displayName) {
      processed.team.push(jiraIssue.fields.reporter.displayName);
    }

    // Map custom fields (clients configure these)
    if (jiraIssue.fields?.customfield_budget) {
      processed.budget = parseFloat(jiraIssue.fields.customfield_budget);
    }
    if (jiraIssue.fields?.customfield_roi) {
      processed.expectedROI = parseFloat(jiraIssue.fields.customfield_roi);
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessJiraData(canonical: any, rawJiraIssue: any): any {
    // Extract portfolio theme from Jira project
    if (rawJiraIssue.fields?.project?.name) {
      canonical.portfolioTheme = rawJiraIssue.fields.project.name;
    }

    // Map epic to portfolio
    if (rawJiraIssue.fields?.epic?.name) {
      canonical.portfolioTheme = rawJiraIssue.fields.epic.name;
    }

    // Count defects (sub-tasks with type "Bug")
    if (rawJiraIssue.fields?.subtasks) {
      canonical.defectCount = rawJiraIssue.fields.subtasks.filter(
        (st: any) => st.fields?.issuetype?.name?.toLowerCase() === 'bug'
      ).length;
    }

    // Map labels to SAFe concepts
    if (rawJiraIssue.fields?.labels) {
      const labels = rawJiraIssue.fields.labels;

      // Check for SAFe labels
      const artLabel = labels.find((l: string) => l.startsWith('ART:'));
      if (artLabel) {
        canonical.artName = artLabel.replace('ART:', '');
      }

      const piLabel = labels.find((l: string) => l.startsWith('PI:'));
      if (piLabel) {
        canonical.piId = piLabel.replace('PI:', '');
      }
    }

    return canonical;
  }

  /**
   * Fetch projects from Jira API
   */
  async fetchFromJira(jiraConfig: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  }): Promise<any[]> {
    try {
      const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');

      // Fetch all epics in project (epics = projects in our ontology)
      const response = await fetch(
        `${jiraConfig.baseUrl}/rest/api/3/search?jql=project=${jiraConfig.projectKey} AND issuetype=Epic&maxResults=1000`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const data = await response.json();
      return data.issues || [];

    } catch (error: any) {
      console.error('[JiraAdapter] Error fetching from Jira:', error);
      return [];
    }
  }
}
