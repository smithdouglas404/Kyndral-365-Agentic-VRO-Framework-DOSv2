/**
 * SAP ADAPTER
 *
 * Maps SAP Project System (PS) → Canonical Ontology
 *
 * SAP Data Model:
 * - WBS Elements (Work Breakdown Structure)
 * - Networks/Activities
 * - Cost Elements
 * - Resources
 *
 * Canonical Mapping:
 * - WBS Element → Project
 * - Network Activity → Work Item
 * - Cost Element → Budget Category
 *
 * API Reference:
 * https://api.sap.com/api/OP_API_PROJECT_V2_SRV/overview
 * SAP Project System (PS) via OData
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class SAPAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.EXCEL); // Placeholder, would need DataSourceType.SAP
  }

  /**
   * SAP System Status → Universal Status Mapping
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'crtd': UniversalStatus.PLANNED,    // Created
    'rel': UniversalStatus.ACTIVE,      // Released
    'prel': UniversalStatus.ACTIVE,     // Partially released
    'lckd': UniversalStatus.ON_HOLD,    // Locked
    'teco': UniversalStatus.COMPLETED,  // Technically complete
    'clsd': UniversalStatus.COMPLETED,  // Closed
    'dlfl': UniversalStatus.CANCELLED,  // Deleted
  };

  /**
   * SAP Priority → Universal Priority Mapping
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    '1': UniversalPriority.CRITICAL,
    '2': UniversalPriority.HIGH,
    '3': UniversalPriority.MEDIUM,
    '4': UniversalPriority.LOW,
  };

  /**
   * SAP Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'WBSElement',
    name: 'WBSElementDescription',
    owner: 'ResponsibleCostCenter',
    startDate: 'PlannedStartDate',
    endDate: 'PlannedEndDate',
    budget: 'TotalPlannedCosts',
    budgetSpent: 'ActualCosts',
  };

  /**
   * SAP-specific transformation logic
   */
  async transform(rawWBS: any): Promise<any> {
    const preprocessed = this.preprocessSAPData(rawWBS);
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      result.canonicalProject = this.postProcessSAPData(result.canonicalProject, rawWBS);
    }

    return result;
  }

  /**
   * Preprocess SAP data
   */
  private preprocessSAPData(wbs: any): any {
    const processed = { ...wbs };

    // Map system status
    if (wbs.SystemStatus) {
      processed.status = wbs.SystemStatus.toLowerCase();
    }

    // Calculate percent complete from cost progress
    if (wbs.TotalPlannedCosts && wbs.ActualCosts) {
      processed.percentComplete = Math.min(100, Math.round((wbs.ActualCosts / wbs.TotalPlannedCosts) * 100));
    }

    // SAP uses cost centers as organizational units
    if (wbs.ResponsibleCostCenter) {
      processed.divisionId = wbs.ResponsibleCostCenter;
    }

    return processed;
  }

  /**
   * Post-process SAP data
   */
  private postProcessSAPData(canonical: any, rawWBS: any): any {
    // Extract WBS hierarchy
    if (rawWBS.SuperiorWBSElement) {
      canonical.parentProjectId = rawWBS.SuperiorWBSElement;
    }

    // Extract profit center (portfolio)
    if (rawWBS.ProfitCenter) {
      canonical.portfolioTheme = rawWBS.ProfitCenter;
    }

    // EVM metrics from SAP PS
    if (rawWBS.PlannedValue && rawWBS.EarnedValue && rawWBS.ActualCosts) {
      canonical.cpi = rawWBS.ActualCosts > 0 ? rawWBS.EarnedValue / rawWBS.ActualCosts : 1.0;
      canonical.spi = rawWBS.PlannedValue > 0 ? rawWBS.EarnedValue / rawWBS.PlannedValue : 1.0;
    }

    // Cost variance
    if (rawWBS.CostVariance) {
      canonical.costVariance = rawWBS.CostVariance;
    }

    return canonical;
  }

  /**
   * Fetch WBS elements from SAP
   */
  async fetchFromSAP(config: {
    baseUrl: string;
    username: string;
    password: string;
    projectDefinition?: string;
  }): Promise<any[]> {
    try {
      const { baseUrl, username, password, projectDefinition } = config;

      // SAP OData service endpoint
      let url = `${baseUrl}/sap/opu/odata/sap/API_ENTERPRISE_PROJECT_SRV_02/A_EnterpriseProjectElement`;

      if (projectDefinition) {
        url += `?$filter=ProjectDefinition eq '${projectDefinition}'`;
      }

      const auth = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`SAP API error: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      const results = data.d?.results || [];

      console.log(`[SAPAdapter] Fetched ${results.length} WBS elements`);
      return results;

    } catch (error: any) {
      console.error('[SAPAdapter] Error fetching from SAP:', error);
      throw error;
    }
  }

  /**
   * Test SAP connection
   */
  async testConnection(config: {
    baseUrl: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { baseUrl, username, password } = config;

      // Test by fetching service metadata
      const url = `${baseUrl}/sap/opu/odata/sap/API_ENTERPRISE_PROJECT_SRV_02/$metadata`;
      const auth = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
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
        message: 'SAP OData connection successful',
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}
