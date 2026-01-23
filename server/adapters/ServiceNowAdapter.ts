/**
 * SERVICENOW ADAPTER
 *
 * Maps ServiceNow projects/changes → Canonical Ontology
 *
 * ServiceNow Data Model:
 * - Projects (pm_project table)
 * - Change Requests (change_request table)
 * - Incidents (incident table)
 * - Resource Plans
 *
 * ServiceNow is used by IT Operations teams, so data model differs from Agile tools.
 *
 * Canonical Mapping:
 * - ServiceNow Project → Project
 * - ServiceNow Change Request → Project (for IT infrastructure changes)
 * - Priority Numbers (1-5) → Universal Priority
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class ServiceNowAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.SERVICENOW);
  }

  /**
   * ServiceNow State → Universal Status Mapping
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    // ServiceNow project states
    'pending': UniversalStatus.PLANNED,
    'planning': UniversalStatus.PLANNED,
    'approved': UniversalStatus.PLANNED,

    'in progress': UniversalStatus.ACTIVE,
    'work in progress': UniversalStatus.ACTIVE,
    'implementation': UniversalStatus.ACTIVE,

    'on hold': UniversalStatus.ON_HOLD,
    'pending approval': UniversalStatus.ON_HOLD,

    'completed': UniversalStatus.COMPLETED,
    'closed complete': UniversalStatus.COMPLETED,
    'closed': UniversalStatus.COMPLETED,

    'cancelled': UniversalStatus.CANCELLED,
    'closed cancelled': UniversalStatus.CANCELLED,
    'rejected': UniversalStatus.CANCELLED,

    // Change Request specific
    'assess': UniversalStatus.PLANNED,
    'authorize': UniversalStatus.PLANNED,
    'scheduled': UniversalStatus.PLANNED,
    'implement': UniversalStatus.ACTIVE,
    'review': UniversalStatus.ACTIVE,
    'closed successful': UniversalStatus.COMPLETED,
    'closed unsuccessful': UniversalStatus.CANCELLED,
  };

  /**
   * ServiceNow Priority → Universal Priority Mapping
   * ServiceNow uses numeric priorities: 1 (highest) to 5 (lowest)
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    '1': UniversalPriority.CRITICAL,
    '1 - critical': UniversalPriority.CRITICAL,
    'critical': UniversalPriority.CRITICAL,

    '2': UniversalPriority.HIGH,
    '2 - high': UniversalPriority.HIGH,
    'high': UniversalPriority.HIGH,

    '3': UniversalPriority.MEDIUM,
    '3 - moderate': UniversalPriority.MEDIUM,
    'moderate': UniversalPriority.MEDIUM,
    'medium': UniversalPriority.MEDIUM,

    '4': UniversalPriority.LOW,
    '4 - low': UniversalPriority.LOW,
    '5': UniversalPriority.LOW,
    '5 - planning': UniversalPriority.LOW,
    'low': UniversalPriority.LOW,
  };

  /**
   * ServiceNow Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'sys_id',                     // ServiceNow unique ID
    name: 'short_description',                // Project name
    description: 'description',               // Full description
    owner: 'assigned_to.name',                // Project manager
    sponsor: 'manager.name',                  // Sponsor
    startDate: 'start_date',                  // Planned start
    endDate: 'end_date',                      // Planned end
    actualStartDate: 'work_start',            // Actual start
    actualEndDate: 'work_end',                // Actual end
    budget: 'budget_cost',                    // Budget
    budgetSpent: 'actual_cost',               // Spent
    percentComplete: 'percent_complete',      // Progress
    portfolioTheme: 'portfolio.name',         // Portfolio
    divisionId: 'business_unit.sys_id',       // Business Unit
  };

  /**
   * ServiceNow-specific transformation
   */
  async transform(rawServiceNowRecord: any): Promise<any> {
    // ServiceNow preprocessing
    const preprocessed = this.preprocessServiceNowData(rawServiceNowRecord);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // ServiceNow post-processing
      result.canonicalProject = this.postProcessServiceNowData(result.canonicalProject, rawServiceNowRecord);
    }

    return result;
  }

  /**
   * Preprocess ServiceNow data
   */
  private preprocessServiceNowData(snowRecord: any): any {
    const processed = { ...snowRecord };

    // ServiceNow stores dates as strings in format "YYYY-MM-DD HH:MM:SS"
    // Convert to ISO format
    if (snowRecord.start_date) {
      processed.startDate = snowRecord.start_date.replace(' ', 'T') + 'Z';
    }
    if (snowRecord.end_date) {
      processed.endDate = snowRecord.end_date.replace(' ', 'T') + 'Z';
    }

    // ServiceNow percent_complete is 0-100 number
    if (snowRecord.percent_complete) {
      processed.percentComplete = parseInt(snowRecord.percent_complete, 10);
    }

    // Extract numeric priority
    if (snowRecord.priority) {
      processed.priority = snowRecord.priority.toString();
    }

    // ServiceNow state is numeric, map to string
    if (snowRecord.state) {
      const stateMap: Record<string, string> = {
        '-5': 'pending',
        '-1': 'planning',
        '1': 'approved',
        '2': 'in progress',
        '3': 'on hold',
        '4': 'completed',
        '7': 'cancelled',
      };
      processed.status = stateMap[snowRecord.state.toString()] || 'in progress';
    }

    return processed;
  }

  /**
   * Post-process ServiceNow data
   */
  private postProcessServiceNowData(canonical: any, rawServiceNowRecord: any): any {
    // Extract business unit as division
    if (rawServiceNowRecord.business_unit?.name) {
      canonical.divisionId = rawServiceNowRecord.business_unit.sys_id;
    }

    // Extract portfolio from parent portfolio
    if (rawServiceNowRecord.portfolio?.name) {
      canonical.portfolioTheme = rawServiceNowRecord.portfolio.name;
    }

    // Calculate budget remaining
    if (canonical.budget && canonical.budgetSpent) {
      canonical.budgetRemaining = canonical.budget - canonical.budgetSpent;
    }

    // Calculate CPI if budget data available
    if (canonical.budget && canonical.budgetSpent && canonical.percentComplete) {
      const earnedValue = (canonical.budget * canonical.percentComplete) / 100;
      canonical.cpi = canonical.budgetSpent > 0 ? earnedValue / canonical.budgetSpent : 1.0;
    }

    // Map risk count from related records
    if (rawServiceNowRecord.related_risks) {
      canonical.criticalRiskCount = rawServiceNowRecord.related_risks.filter(
        (r: any) => r.risk_level === '1' || r.risk_level === 'critical'
      ).length;
    }

    return canonical;
  }

  /**
   * Fetch projects from ServiceNow API
   */
  async fetchFromServiceNow(snowConfig: {
    instanceUrl: string;
    username: string;
    password: string;
  }): Promise<any[]> {
    try {
      const auth = Buffer.from(`${snowConfig.username}:${snowConfig.password}`).toString('base64');

      // Fetch all projects from pm_project table
      const response = await fetch(
        `${snowConfig.instanceUrl}/api/now/table/pm_project?sysparm_limit=1000&sysparm_display_value=true`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.status}`);
      }

      const data = await response.json();
      return data.result || [];

    } catch (error: any) {
      console.error('[ServiceNowAdapter] Error fetching from ServiceNow:', error);
      return [];
    }
  }
}
