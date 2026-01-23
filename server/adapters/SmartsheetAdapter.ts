/**
 * SMARTSHEET ADAPTER
 *
 * Maps Smartsheet sheets/rows → Canonical Ontology
 *
 * Smartsheet Data Model:
 * - Sheets (spreadsheet-like project tracking)
 * - Rows (individual projects/tasks)
 * - Columns (custom fields)
 * - Cell Links (dependencies)
 *
 * Canonical Mapping:
 * - Smartsheet Row → Project
 * - Sheet → Portfolio
 * - Parent Row → Program
 * - Cell values mapped by column names
 *
 * API Reference:
 * https://smartsheet.redoc.ly/
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class SmartsheetAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.SMARTSHEET);
  }

  /**
   * Smartsheet Status → Universal Status Mapping
   *
   * Smartsheet uses dropdown columns with custom values.
   * Common status column values:
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'not started': UniversalStatus.PLANNED,
    'not yet started': UniversalStatus.PLANNED,
    'planned': UniversalStatus.PLANNED,
    'scheduled': UniversalStatus.PLANNED,

    'in progress': UniversalStatus.ACTIVE,
    'in-progress': UniversalStatus.ACTIVE,
    'active': UniversalStatus.ACTIVE,
    'started': UniversalStatus.ACTIVE,
    'ongoing': UniversalStatus.ACTIVE,

    'complete': UniversalStatus.COMPLETED,
    'completed': UniversalStatus.COMPLETED,
    'done': UniversalStatus.COMPLETED,
    'finished': UniversalStatus.COMPLETED,

    'on hold': UniversalStatus.ON_HOLD,
    'paused': UniversalStatus.ON_HOLD,
    'deferred': UniversalStatus.ON_HOLD,

    'at risk': UniversalStatus.AT_RISK,
    'delayed': UniversalStatus.AT_RISK,
    'behind': UniversalStatus.AT_RISK,
    'red': UniversalStatus.AT_RISK,

    'cancelled': UniversalStatus.CANCELLED,
    'canceled': UniversalStatus.CANCELLED,
    'dropped': UniversalStatus.CANCELLED,
  };

  /**
   * Smartsheet Priority → Universal Priority Mapping
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'critical': UniversalPriority.CRITICAL,
    'urgent': UniversalPriority.CRITICAL,
    'p0': UniversalPriority.CRITICAL,
    '1': UniversalPriority.CRITICAL,

    'high': UniversalPriority.HIGH,
    'p1': UniversalPriority.HIGH,
    '2': UniversalPriority.HIGH,

    'medium': UniversalPriority.MEDIUM,
    'normal': UniversalPriority.MEDIUM,
    'p2': UniversalPriority.MEDIUM,
    '3': UniversalPriority.MEDIUM,

    'low': UniversalPriority.LOW,
    'p3': UniversalPriority.LOW,
    '4': UniversalPriority.LOW,
  };

  /**
   * Smartsheet Field Names → Canonical Field Names
   *
   * Smartsheet uses column names defined by the user.
   * We map common column name patterns.
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'id',
    name: 'name', // Row name/title (Primary Column)
  };

  /**
   * Smartsheet-specific transformation logic
   */
  async transform(rawRow: any, sheet?: any): Promise<any> {
    // Smartsheet-specific preprocessing
    const preprocessed = this.preprocessSmartsheetData(rawRow, sheet);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // Smartsheet-specific post-processing
      result.canonicalProject = this.postProcessSmartsheetData(result.canonicalProject, rawRow, sheet);
    }

    return result;
  }

  /**
   * Preprocess Smartsheet data before transformation
   */
  private preprocessSmartsheetData(row: any, sheet?: any): any {
    const processed: any = {
      id: row.id,
      name: this.getPrimaryColumnValue(row),
    };

    // Map cells to fields based on column names
    if (row.cells && sheet?.columns) {
      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];
        const column = sheet.columns.find((c: any) => c.id === cell.columnId);

        if (!column) continue;

        const columnName = column.title.toLowerCase();
        const cellValue = cell.displayValue || cell.value;

        // Map common column names to canonical fields
        if (columnName.includes('status') || columnName === 'state') {
          processed.status = cellValue;
        } else if (columnName.includes('priority')) {
          processed.priority = cellValue;
        } else if (columnName.includes('start') && columnName.includes('date')) {
          processed.startDate = cellValue;
        } else if (columnName.includes('end') && columnName.includes('date') ||
                   columnName.includes('due') && columnName.includes('date')) {
          processed.endDate = cellValue;
        } else if (columnName.includes('budget') || columnName.includes('cost')) {
          processed.budget = parseFloat(cellValue?.toString().replace(/[^0-9.-]/g, '') || '0');
        } else if (columnName.includes('spent')) {
          processed.budgetSpent = parseFloat(cellValue?.toString().replace(/[^0-9.-]/g, '') || '0');
        } else if (columnName.includes('progress') || columnName.includes('complete')) {
          const percentStr = cellValue?.toString().replace(/[^0-9.-]/g, '');
          processed.percentComplete = parseFloat(percentStr || '0');
        } else if (columnName.includes('owner') || columnName.includes('assigned')) {
          processed.owner = cellValue;
        } else if (columnName.includes('description')) {
          processed.description = cellValue;
        } else if (columnName.includes('portfolio') || columnName.includes('theme')) {
          processed.portfolioTheme = cellValue;
        } else if (columnName.includes('division') || columnName.includes('department')) {
          processed.divisionId = cellValue;
        } else if (columnName.includes('roi')) {
          processed.expectedROI = parseFloat(cellValue?.toString().replace(/[^0-9.-]/g, '') || '0');
        }
      }
    }

    // Handle parent/child hierarchy
    if (row.parentId) {
      processed.parentProjectId = row.parentId;
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessSmartsheetData(canonical: any, rawRow: any, sheet?: any): any {
    // Sheet name becomes portfolio theme if not already set
    if (!canonical.portfolioTheme && sheet?.name) {
      canonical.portfolioTheme = sheet.name;
    }

    // Extract hierarchy info
    if (rawRow.parentId) {
      canonical.parentProjectId = String(rawRow.parentId);
    }

    // Smartsheet has a red/yellow/green status indicator (RYG)
    const rygCell = rawRow.cells?.find((c: any) =>
      sheet?.columns.find((col: any) =>
        col.id === c.columnId && col.symbol === 'RYG'
      )
    );

    if (rygCell?.value) {
      const rygValue = rygCell.value.toLowerCase();
      if (rygValue === 'red' && canonical.status === UniversalStatus.ACTIVE) {
        canonical.status = UniversalStatus.AT_RISK;
      }
    }

    // Extract attachments count
    if (rawRow.attachments) {
      canonical.attachmentCount = rawRow.attachments.length;
    }

    // Extract discussions count
    if (rawRow.discussions) {
      canonical.commentCount = rawRow.discussions.length;
    }

    return canonical;
  }

  /**
   * Get primary column value (the row name)
   */
  private getPrimaryColumnValue(row: any): string {
    // Primary column is marked in the cell
    const primaryCell = row.cells?.find((c: any) => c.columnId === row.primaryColumnId);
    return primaryCell?.displayValue || primaryCell?.value || `Row ${row.id}`;
  }

  /**
   * Fetch projects from Smartsheet API
   */
  async fetchFromSmartsheet(config: {
    accessToken: string;
    sheetId: string;
  }): Promise<{ rows: any[]; sheet: any }> {
    try {
      const { accessToken, sheetId } = config;

      // Fetch sheet with all rows
      const url = `https://api.smartsheet.com/2.0/sheets/${sheetId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Smartsheet API error: ${response.status} ${await response.text()}`);
      }

      const sheet = await response.json();

      console.log(`[SmartsheetAdapter] Fetched sheet "${sheet.name}" with ${sheet.rows?.length || 0} rows`);

      return {
        rows: sheet.rows || [],
        sheet: sheet,
      };

    } catch (error: any) {
      console.error('[SmartsheetAdapter] Error fetching from Smartsheet:', error);
      throw error;
    }
  }

  /**
   * List all sheets accessible to the user
   */
  async listSheets(accessToken: string): Promise<any[]> {
    try {
      const url = 'https://api.smartsheet.com/2.0/sheets';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Smartsheet API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error: any) {
      console.error('[SmartsheetAdapter] Error listing sheets:', error);
      return [];
    }
  }

  /**
   * Test connection to Smartsheet
   */
  async testConnection(config: {
    accessToken: string;
  }): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      const { accessToken } = config;

      // Test by fetching current user info
      const url = 'https://api.smartsheet.com/2.0/users/me';

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
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const userInfo = await response.json();

      return {
        success: true,
        message: 'Connection successful',
        userInfo: {
          id: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          account: userInfo.account,
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
