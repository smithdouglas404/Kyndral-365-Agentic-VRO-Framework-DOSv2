/**
 * GITHUB ADAPTER
 *
 * Maps GitHub issues/projects → Canonical Ontology
 *
 * GitHub Data Model:
 * - Issues (tasks, bugs, features)
 * - Projects (project boards)
 * - Milestones (releases)
 * - Pull Requests (code changes)
 *
 * Canonical Mapping:
 * - GitHub Project → Project
 * - GitHub Issue → Work Item
 * - GitHub Milestone → Program Increment
 * - GitHub Repository → Portfolio
 *
 * API Reference:
 * https://docs.github.com/en/rest
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class GitHubAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.EXCEL); // Placeholder, would need DataSourceType.GITHUB
  }

  /**
   * GitHub State → Universal Status Mapping
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'open': UniversalStatus.ACTIVE,
    'in progress': UniversalStatus.ACTIVE,
    'todo': UniversalStatus.PLANNED,
    'closed': UniversalStatus.COMPLETED,
    'done': UniversalStatus.COMPLETED,
  };

  /**
   * GitHub Labels → Universal Priority Mapping
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'priority: critical': UniversalPriority.CRITICAL,
    'priority: high': UniversalPriority.HIGH,
    'priority: medium': UniversalPriority.MEDIUM,
    'priority: low': UniversalPriority.LOW,
    'critical': UniversalPriority.CRITICAL,
    'high': UniversalPriority.HIGH,
    'medium': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
  };

  /**
   * GitHub Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'number',
    name: 'title',
    description: 'body',
    owner: 'assignee.login',
    startDate: 'created_at',
    endDate: 'closed_at',
    portfolioTheme: 'repository.name',
  };

  /**
   * GitHub-specific transformation logic
   */
  async transform(rawIssue: any): Promise<any> {
    const preprocessed = this.preprocessGitHubData(rawIssue);
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      result.canonicalProject = this.postProcessGitHubData(result.canonicalProject, rawIssue);
    }

    return result;
  }

  /**
   * Preprocess GitHub data
   */
  private preprocessGitHubData(issue: any): any {
    const processed = { ...issue };

    // Determine status from state and labels
    processed.status = issue.state; // 'open' or 'closed'

    // Extract priority from labels
    const priorityLabel = issue.labels?.find((l: any) =>
      l.name?.toLowerCase().includes('priority')
    );
    if (priorityLabel) {
      processed.priority = priorityLabel.name;
    }

    // Extract assignees
    processed.team = issue.assignees?.map((a: any) => a.login) || [];

    // Calculate progress from task list if present
    if (issue.body) {
      const taskMatches = issue.body.match(/- \[[ x]\]/g);
      if (taskMatches) {
        const completedTasks = issue.body.match(/- \[x\]/g)?.length || 0;
        processed.percentComplete = Math.round((completedTasks / taskMatches.length) * 100);
      }
    }

    return processed;
  }

  /**
   * Post-process GitHub data
   */
  private postProcessGitHubData(canonical: any, rawIssue: any): any {
    // Extract repository info
    if (rawIssue.repository) {
      canonical.portfolioTheme = rawIssue.repository.name;
      canonical.repositoryUrl = rawIssue.repository.html_url;
    }

    // Extract milestone (PI)
    if (rawIssue.milestone) {
      canonical.piId = rawIssue.milestone.title;
      canonical.milestoneUrl = rawIssue.milestone.html_url;
    }

    // Extract labels as tags
    if (rawIssue.labels) {
      canonical.tags = rawIssue.labels.map((l: any) => l.name);
    }

    // Count comments as engagement metric
    if (rawIssue.comments) {
      canonical.commentCount = rawIssue.comments;
    }

    // Link to issue
    canonical.externalUrl = rawIssue.html_url;

    return canonical;
  }

  /**
   * Fetch issues from GitHub
   */
  async fetchFromGitHub(config: {
    token: string;
    owner: string;
    repo: string;
    state?: 'open' | 'closed' | 'all';
    labels?: string;
  }): Promise<any[]> {
    try {
      const { token, owner, repo, state = 'all', labels } = config;

      let url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=100`;
      if (labels) {
        url += `&labels=${encodeURIComponent(labels)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PMO-Integration',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
      }

      const issues = await response.json();

      // Filter out pull requests (they appear as issues in GitHub API)
      const actualIssues = issues.filter((issue: any) => !issue.pull_request);

      console.log(`[GitHubAdapter] Fetched ${actualIssues.length} issues from ${owner}/${repo}`);
      return actualIssues;

    } catch (error: any) {
      console.error('[GitHubAdapter] Error fetching from GitHub:', error);
      throw error;
    }
  }

  /**
   * Test GitHub connection
   */
  async testConnection(config: {
    token: string;
  }): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      const { token } = config;

      const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PMO-Integration',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status}`,
        };
      }

      const user = await response.json();

      return {
        success: true,
        message: 'Connection successful',
        userInfo: {
          login: user.login,
          name: user.name,
          email: user.email,
          company: user.company,
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
