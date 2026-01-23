/**
 * SALESFORCE ADAPTER
 *
 * Maps Salesforce objects → Canonical Ontology
 *
 * Salesforce Data Model:
 * - Opportunities (sales projects)
 * - Accounts (customers/organizations)
 * - Products (deliverables)
 * - Custom Objects (project tracking)
 *
 * Canonical Mapping:
 * - Opportunity → Project
 * - Account → Portfolio/Client
 * - Product → Deliverable
 * - Custom Project Object → Project
 *
 * API Reference:
 * https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class SalesforceAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.EXCEL); // Placeholder, would need DataSourceType.SALESFORCE
  }

  /**
   * Salesforce Stage → Universal Status Mapping
   *
   * Opportunity stages vary by org, these are common defaults
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'prospecting': UniversalStatus.PLANNED,
    'qualification': UniversalStatus.PLANNED,
    'needs analysis': UniversalStatus.PLANNED,
    'proposal': UniversalStatus.PLANNED,

    'negotiation': UniversalStatus.ACTIVE,
    'in progress': UniversalStatus.ACTIVE,
    'executing': UniversalStatus.ACTIVE,

    'closed won': UniversalStatus.COMPLETED,
    'completed': UniversalStatus.COMPLETED,

    'closed lost': UniversalStatus.CANCELLED,
    'cancelled': UniversalStatus.CANCELLED,

    'on hold': UniversalStatus.ON_HOLD,
    'delayed': UniversalStatus.AT_RISK,
  };

  /**
   * Salesforce doesn't have standard priority - use custom fields
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'high': UniversalPriority.HIGH,
    'medium': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
  };

  /**
   * Salesforce Field Names → Canonical Field Names
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'Id',
    name: 'Name',
    description: 'Description',
    owner: 'Owner.Name',
    startDate: 'CreatedDate',
    endDate: 'CloseDate',
    budget: 'Amount',
    percentComplete: 'Probability',  // Opportunity probability as progress proxy
    portfolioTheme: 'Account.Name',  // Account as portfolio
  };

  /**
   * Salesforce-specific transformation logic
   */
  async transform(rawObject: any): Promise<any> {
    const preprocessed = this.preprocessSalesforceData(rawObject);
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      result.canonicalProject = this.postProcessSalesforceData(result.canonicalProject, rawObject);
    }

    return result;
  }

  /**
   * Preprocess Salesforce data
   */
  private preprocessSalesforceData(sfObject: any): any {
    const processed = { ...sfObject };

    // Map Stage to status
    if (sfObject.StageName) {
      processed.status = sfObject.StageName;
    }

    // Use Probability as percent complete proxy
    if (sfObject.Probability) {
      processed.percentComplete = sfObject.Probability;
    }

    // Extract owner
    if (sfObject.Owner?.Name) {
      processed.owner = sfObject.Owner.Name;
    }

    // Extract account (portfolio)
    if (sfObject.Account?.Name) {
      processed.portfolioTheme = sfObject.Account.Name;
    }

    return processed;
  }

  /**
   * Post-process Salesforce data
   */
  private postProcessSalesforceData(canonical: any, rawObject: any): any {
    // Extract account hierarchy
    if (rawObject.Account) {
      canonical.portfolioTheme = rawObject.Account.Name;
      canonical.clientName = rawObject.Account.Name;
    }

    // Extract products/line items
    if (rawObject.OpportunityLineItems?.records) {
      canonical.deliverables = rawObject.OpportunityLineItems.records.map((li: any) => ({
        name: li.Product2?.Name,
        quantity: li.Quantity,
        unitPrice: li.UnitPrice,
        totalPrice: li.TotalPrice,
      }));
    }

    // Extract custom fields (varies by org)
    if (rawObject.Project_Start_Date__c) {
      canonical.startDate = new Date(rawObject.Project_Start_Date__c);
    }

    if (rawObject.Expected_ROI__c) {
      canonical.expectedROI = rawObject.Expected_ROI__c;
    }

    return canonical;
  }

  /**
   * Fetch opportunities from Salesforce
   */
  async fetchFromSalesforce(config: {
    instanceUrl: string;
    accessToken: string;
    query?: string;
  }): Promise<any[]> {
    try {
      const { instanceUrl, accessToken, query } = config;

      // Default SOQL query for opportunities
      const soqlQuery = query || `
        SELECT Id, Name, Description, StageName, Amount, Probability, CloseDate, CreatedDate,
               Owner.Name, Account.Name, Account.Id,
               (SELECT Product2.Name, Quantity, UnitPrice, TotalPrice FROM OpportunityLineItems)
        FROM Opportunity
        WHERE IsClosed = false
        ORDER BY CreatedDate DESC
        LIMIT 500
      `.trim().replace(/\s+/g, ' ');

      const url = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(soqlQuery)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      console.log(`[SalesforceAdapter] Fetched ${data.records?.length || 0} opportunities`);

      return data.records || [];

    } catch (error: any) {
      console.error('[SalesforceAdapter] Error fetching from Salesforce:', error);
      throw error;
    }
  }

  /**
   * Test Salesforce connection
   */
  async testConnection(config: {
    instanceUrl: string;
    accessToken: string;
  }): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      const { instanceUrl, accessToken } = config;

      // Test by fetching user info
      const url = `${instanceUrl}/services/data/v58.0/sobjects/User/${accessToken.split('!')[0]}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
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
          name: user.Name,
          email: user.Email,
          username: user.Username,
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
