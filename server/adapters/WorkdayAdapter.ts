/**
 * WORKDAY ADAPTER
 *
 * Maps Workday Projects → Canonical Ontology
 *
 * Workday Data Model:
 * - Projects
 * - Project Tasks
 * - Project Resources
 * - Time Tracking
 *
 * Canonical Mapping:
 * - Workday Project → Project
 * - Project Task → Work Item
 * - Project Plan → Schedule Baseline
 *
 * API Reference:
 * https://community.workday.com/sites/default/files/file-hosting/restapi/index.html
 * Workday REST API
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class WorkdayAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.EXCEL); // Placeholder, would need DataSourceType.WORKDAY
  }

  /**
   * Workday Status → Universal Status Mapping
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'inactive': UniversalStatus.PLANNED,
    'active': UniversalStatus.ACTIVE,
    'in progress': UniversalStatus.ACTIVE,
    'completed': UniversalStatus.COMPLETED,
    'closed': UniversalStatus.COMPLETED,
    'cancelled': UniversalStatus.CANCELLED,
    'on hold': UniversalStatus.ON_HOLD,
  };

  /**
   * Workday Priority → Universal Priority Mapping
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'critical': UniversalPriority.CRITICAL,
    'high': UniversalPriority.HIGH,
    'medium': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
  };

  /**
   * Workday Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'id',
    name: 'descriptor',
    owner: 'projectManager.descriptor',
    startDate: 'startDate',
    endDate: 'endDate',
    budget: 'totalProjectedCost',
    budgetSpent: 'totalActualCost',
  };

  /**
   * Workday-specific transformation logic
   */
  async transform(rawProject: any): Promise<any> {
    const preprocessed = this.preprocessWorkdayData(rawProject);
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      result.canonicalProject = this.postProcessWorkdayData(result.canonicalProject, rawProject);
    }

    return result;
  }

  /**
   * Preprocess Workday data
   */
  private preprocessWorkdayData(project: any): any {
    const processed = { ...project };

    // Extract status
    if (project.projectStatus?.descriptor) {
      processed.status = project.projectStatus.descriptor.toLowerCase();
    }

    // Calculate percent complete
    if (project.percentComplete) {
      processed.percentComplete = project.percentComplete * 100; // Workday uses 0-1
    } else if (project.totalProjectedCost && project.totalActualCost) {
      processed.percentComplete = Math.min(100, (project.totalActualCost / project.totalProjectedCost) * 100);
    }

    // Extract project manager
    if (project.projectManager?.descriptor) {
      processed.owner = project.projectManager.descriptor;
    }

    return processed;
  }

  /**
   * Post-process Workday data
   */
  private postProcessWorkdayData(canonical: any, rawProject: any): any {
    // Extract organization (portfolio)
    if (rawProject.organization?.descriptor) {
      canonical.portfolioTheme = rawProject.organization.descriptor;
      canonical.divisionId = rawProject.organization.id;
    }

    // Extract project hierarchy
    if (rawProject.parentProject?.id) {
      canonical.parentProjectId = rawProject.parentProject.id;
    }

    // Extract project type
    if (rawProject.projectType?.descriptor) {
      canonical.projectType = rawProject.projectType.descriptor;
    }

    // Extract custom fields
    if (rawProject.customFields) {
      for (const field of rawProject.customFields) {
        const fieldName = field.descriptor?.toLowerCase() || '';

        if (fieldName.includes('roi')) {
          canonical.expectedROI = parseFloat(field.value || '0');
        } else if (fieldName.includes('theme') || fieldName.includes('portfolio')) {
          canonical.portfolioTheme = field.value;
        }
      }
    }

    return canonical;
  }

  /**
   * Fetch projects from Workday
   */
  async fetchFromWorkday(config: {
    baseUrl: string;
    tenantName: string;
    username: string;
    password: string;
  }): Promise<any[]> {
    try {
      const { baseUrl, tenantName, username, password } = config;

      // Workday REST API endpoint
      const url = `${baseUrl}/ccx/api/v1/${tenantName}/projects`;

      const auth = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Workday API error: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      const results = data.data || [];

      console.log(`[WorkdayAdapter] Fetched ${results.length} projects`);
      return results;

    } catch (error: any) {
      console.error('[WorkdayAdapter] Error fetching from Workday:', error);
      throw error;
    }
  }

  /**
   * Test Workday connection
   */
  async testConnection(config: {
    baseUrl: string;
    tenantName: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { baseUrl, tenantName, username, password } = config;

      // Test by fetching a small amount of data
      const url = `${baseUrl}/ccx/api/v1/${tenantName}/projects?limit=1`;
      const auth = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status}`,
        };
      }

      return {
        success: true,
        message: 'Workday REST API connection successful',
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}
