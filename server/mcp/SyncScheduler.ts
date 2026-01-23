/**
 * Data Sync Scheduler
 *
 * Purpose: Automatically sync project data from external sources on scheduled intervals
 * - Planview PPM: Every 4 hours
 * - Google Sheets: Every 6 hours (if configured)
 * - Manual triggers available via API
 *
 * This ensures the VRO/PMO system always has fresh data for agent decision-making
 */

import type { IStorage } from '../storage.js';
import { PlanviewMCP } from './PlanviewMCP.js';
import { ExcelSheetsMCP } from './ExcelSheetsMCP.js';

interface SyncSchedulerConfig {
  planview?: {
    enabled: boolean;
    intervalMs?: number; // Default: 4 hours
    portfolioId?: string; // Optional: sync specific portfolio
  };
  googleSheets?: {
    enabled: boolean;
    intervalMs?: number; // Default: 6 hours
    spreadsheetId: string;
    sheetName?: string;
  };
}

interface SyncResult {
  source: 'planview' | 'googleSheets';
  success: boolean;
  projectsSynced?: number;
  error?: string;
  timestamp: Date;
}

export class DataSyncScheduler {
  private storage: IStorage;
  private config: SyncSchedulerConfig;
  private planviewMCP?: PlanviewMCP;
  private excelSheetsMCP?: ExcelSheetsMCP;

  private planviewInterval?: NodeJS.Timeout;
  private googleSheetsInterval?: NodeJS.Timeout;

  private syncHistory: SyncResult[] = [];
  private isRunning: boolean = false;

  constructor(storage: IStorage, config: SyncSchedulerConfig) {
    this.storage = storage;
    this.config = config;

    // Initialize MCPs
    if (config.planview?.enabled) {
      this.planviewMCP = new PlanviewMCP(storage);
    }

    if (config.googleSheets?.enabled) {
      this.excelSheetsMCP = new ExcelSheetsMCP(storage);
    }

    console.log('[SyncScheduler] Initialized with config:', {
      planview: config.planview?.enabled ? 'enabled' : 'disabled',
      googleSheets: config.googleSheets?.enabled ? 'enabled' : 'disabled',
    });
  }

  /**
   * Start all scheduled syncs
   */
  start(): void {
    if (this.isRunning) {
      console.log('[SyncScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[SyncScheduler] Starting scheduled syncs...');

    // Start Planview sync
    if (this.config.planview?.enabled && this.planviewMCP) {
      const intervalMs = this.config.planview.intervalMs || 4 * 60 * 60 * 1000; // 4 hours default

      // Run immediately on start
      this.syncPlanview().catch(err =>
        console.error('[SyncScheduler] Initial Planview sync error:', err)
      );

      // Schedule recurring sync
      this.planviewInterval = setInterval(() => {
        this.syncPlanview().catch(err =>
          console.error('[SyncScheduler] Planview sync error:', err)
        );
      }, intervalMs);

      console.log(`[SyncScheduler] Planview sync scheduled every ${intervalMs / 1000 / 60} minutes`);
    }

    // Start Google Sheets sync
    if (this.config.googleSheets?.enabled && this.excelSheetsMCP) {
      const intervalMs = this.config.googleSheets.intervalMs || 6 * 60 * 60 * 1000; // 6 hours default

      // Run immediately on start
      this.syncGoogleSheets().catch(err =>
        console.error('[SyncScheduler] Initial Google Sheets sync error:', err)
      );

      // Schedule recurring sync
      this.googleSheetsInterval = setInterval(() => {
        this.syncGoogleSheets().catch(err =>
          console.error('[SyncScheduler] Google Sheets sync error:', err)
        );
      }, intervalMs);

      console.log(`[SyncScheduler] Google Sheets sync scheduled every ${intervalMs / 1000 / 60} minutes`);
    }
  }

  /**
   * Stop all scheduled syncs
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('[SyncScheduler] Stopping scheduled syncs...');

    if (this.planviewInterval) {
      clearInterval(this.planviewInterval);
      this.planviewInterval = undefined;
    }

    if (this.googleSheetsInterval) {
      clearInterval(this.googleSheetsInterval);
      this.googleSheetsInterval = undefined;
    }
  }

  /**
   * Manually trigger Planview sync
   */
  async syncPlanview(): Promise<SyncResult> {
    console.log('[SyncScheduler] Starting Planview sync...');
    const result: SyncResult = {
      source: 'planview',
      success: false,
      timestamp: new Date(),
    };

    try {
      if (!this.planviewMCP) {
        throw new Error('Planview MCP not initialized');
      }

      const projectsSynced = await this.planviewMCP.syncProjectsToDatabase({
        portfolioId: this.config.planview?.portfolioId,
      });

      result.success = true;
      result.projectsSynced = projectsSynced;
      console.log(`[SyncScheduler] Planview sync completed: ${projectsSynced} projects synced`);

      // Trigger agent scans after sync
      await this.triggerAgentScans();
    } catch (error: any) {
      result.error = error.message;
      console.error('[SyncScheduler] Planview sync failed:', error);
    }

    this.syncHistory.push(result);
    this.trimSyncHistory();

    return result;
  }

  /**
   * Manually trigger Google Sheets sync
   */
  async syncGoogleSheets(): Promise<SyncResult> {
    console.log('[SyncScheduler] Starting Google Sheets sync...');
    const result: SyncResult = {
      source: 'googleSheets',
      success: false,
      timestamp: new Date(),
    };

    try {
      if (!this.excelSheetsMCP) {
        throw new Error('Excel Sheets MCP not initialized');
      }

      if (!this.config.googleSheets?.spreadsheetId) {
        throw new Error('Google Sheets spreadsheet ID not configured');
      }

      const projectsSynced = await this.excelSheetsMCP.processGoogleSheet(
        this.config.googleSheets.spreadsheetId,
        this.config.googleSheets.sheetName
      );

      result.success = true;
      result.projectsSynced = projectsSynced;
      console.log(`[SyncScheduler] Google Sheets sync completed: ${projectsSynced} projects synced`);

      // Trigger agent scans after sync
      await this.triggerAgentScans();
    } catch (error: any) {
      result.error = error.message;
      console.error('[SyncScheduler] Google Sheets sync failed:', error);
    }

    this.syncHistory.push(result);
    this.trimSyncHistory();

    return result;
  }

  /**
   * Trigger agent scans after data sync
   * This ensures agents immediately process new/updated data
   */
  private async triggerAgentScans(): Promise<void> {
    try {
      // Import agent scheduler dynamically to avoid circular dependencies
      const { getAgentScheduler } = await import('../agents/AgentScheduler.js');
      const scheduler = getAgentScheduler(this.storage);

      // Trigger immediate scan for data-dependent agents
      console.log('[SyncScheduler] Triggering agent scans after data sync...');

      // OKR Inference Agent - assess new data quality
      const okrAgent = scheduler.getAgent('okr-inference');
      if (okrAgent) {
        await okrAgent.runScheduledScan();
      }

      // VRO Agent - check value realization on updated projects
      const vroAgent = scheduler.getAgent('vro');
      if (vroAgent) {
        await vroAgent.runScheduledScan();
      }

      console.log('[SyncScheduler] Agent scans triggered');
    } catch (error) {
      console.error('[SyncScheduler] Error triggering agent scans:', error);
    }
  }

  /**
   * Get sync history (last 50 syncs)
   */
  getSyncHistory(): SyncResult[] {
    return [...this.syncHistory];
  }

  /**
   * Get sync status
   */
  getStatus(): {
    isRunning: boolean;
    planviewEnabled: boolean;
    googleSheetsEnabled: boolean;
    lastPlanviewSync?: SyncResult;
    lastGoogleSheetsSync?: SyncResult;
  } {
    const planviewSyncs = this.syncHistory.filter(s => s.source === 'planview');
    const googleSheetsSyncs = this.syncHistory.filter(s => s.source === 'googleSheets');

    return {
      isRunning: this.isRunning,
      planviewEnabled: this.config.planview?.enabled || false,
      googleSheetsEnabled: this.config.googleSheets?.enabled || false,
      lastPlanviewSync: planviewSyncs[planviewSyncs.length - 1],
      lastGoogleSheetsSync: googleSheetsSyncs[googleSheetsSyncs.length - 1],
    };
  }

  /**
   * Keep only last 50 sync results
   */
  private trimSyncHistory(): void {
    if (this.syncHistory.length > 50) {
      this.syncHistory = this.syncHistory.slice(-50);
    }
  }
}

/**
 * Singleton instance for easy access
 */
let syncSchedulerInstance: DataSyncScheduler | null = null;

export function createSyncScheduler(storage: IStorage, config: SyncSchedulerConfig): DataSyncScheduler {
  syncSchedulerInstance = new DataSyncScheduler(storage, config);
  return syncSchedulerInstance;
}

export function getSyncScheduler(): DataSyncScheduler | null {
  return syncSchedulerInstance;
}
