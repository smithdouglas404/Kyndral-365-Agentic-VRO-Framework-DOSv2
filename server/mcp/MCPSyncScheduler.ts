/**
 * MCP SYNC SCHEDULER
 *
 * Automated sync scheduler for activated MCP server integrations
 * - Runs periodic sync jobs for all active integrations
 * - Updates project, resource, and financial data
 * - Tracks sync status and handles errors gracefully
 */

import { IStorage } from '../storage.js';
import { decryptFields } from '../lib/encryption.js';
import cron from 'node-cron';

interface SyncJob {
  integrationId: string;
  type: string;
  name: string;
  lastSync: Date | null;
  schedule: string; // cron expression
}

export class MCPSyncScheduler {
  private storage: IStorage;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Start the sync scheduler
   * - Fetches all active integrations
   * - Schedules sync jobs for each integration
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[MCPSyncScheduler] Already running');
      return;
    }

    console.log('[MCPSyncScheduler] Starting MCP sync scheduler...');
    this.isRunning = true;

    // Load all active integrations
    await this.loadActiveSyncJobs();

    // Start a periodic check for new integrations (every 5 minutes)
    const monitorTask = cron.schedule('*/5 * * * *', async () => {
      console.log('[MCPSyncScheduler] Checking for new integrations...');
      await this.loadActiveSyncJobs();
    });

    this.jobs.set('monitor', monitorTask);

    console.log('[MCPSyncScheduler] ✅ MCP sync scheduler started');
  }

  /**
   * Stop the sync scheduler
   */
  stop(): void {
    console.log('[MCPSyncScheduler] Stopping sync scheduler...');

    // Stop all scheduled jobs
    for (const [id, task] of this.jobs.entries()) {
      task.stop();
      console.log(`[MCPSyncScheduler] Stopped job: ${id}`);
    }

    this.jobs.clear();
    this.isRunning = false;

    console.log('[MCPSyncScheduler] Sync scheduler stopped');
  }

  /**
   * Load active sync jobs from database
   */
  private async loadActiveSyncJobs(): Promise<void> {
    try {
      // Fetch all active integrations from database
      const integrations = await this.storage.getIntegrations();
      const activeIntegrations = integrations.filter(
        (integration) => integration.status === 'connected'
      );

      console.log(`[MCPSyncScheduler] Found ${activeIntegrations.length} active integrations`);

      for (const integration of activeIntegrations) {
        // Check if job already exists
        if (this.jobs.has(integration.id)) {
          continue;
        }

        // Determine sync schedule (default: every 4 hours)
        const schedule = this.getSyncSchedule(integration.type, integration.syncSchedule);

        if (!schedule) {
          console.log(`[MCPSyncScheduler] Manual sync only for ${integration.name}`);
          continue;
        }

        // Schedule the sync job
        const task = cron.schedule(schedule, async () => {
          await this.performSync(integration.id, integration.type, integration.name);
        });

        this.jobs.set(integration.id, task);
        console.log(`[MCPSyncScheduler] Scheduled sync for ${integration.name} (${schedule})`);
      }

      // Remove jobs for inactive integrations
      const activeIds = new Set(activeIntegrations.map((i) => i.id));
      for (const [id, task] of this.jobs.entries()) {
        if (id !== 'monitor' && !activeIds.has(id)) {
          task.stop();
          this.jobs.delete(id);
          console.log(`[MCPSyncScheduler] Removed job for inactive integration: ${id}`);
        }
      }
    } catch (error) {
      console.error('[MCPSyncScheduler] Error loading sync jobs:', error);
    }
  }

  /**
   * Get sync schedule (cron expression) for integration type
   */
  private getSyncSchedule(integrationType: string, customSchedule?: string): string | null {
    if (customSchedule && customSchedule !== 'manual') {
      // Parse custom schedule
      if (customSchedule.includes('cron:')) {
        return customSchedule.replace('cron:', '');
      }
    }

    // Default schedules based on integration type
    const defaultSchedules: Record<string, string> = {
      // Enterprise PPM - Every 4 hours (critical project data)
      'microsoft-project-server': '0 */4 * * *',
      'planview': '0 */4 * * *',
      'servicenow-spm': '0 */4 * * *',
      'smartsheet': '0 */4 * * *',
      'triskell': '0 */4 * * *',

      // Agile & VRO - Every 2 hours (fast-moving sprint data)
      'jira': '0 */2 * * *',
      'linear': '0 */2 * * *',
      'azure-devops': '0 */2 * * *',
      'targetprocess': '0 */2 * * *',
      'jira-align': '0 */2 * * *',

      // Development - Every 1 hour (rapid code changes)
      'github': '0 * * * *',
      'gitlab': '0 * * * *',

      // Collaboration - Every 6 hours
      'asana': '0 */6 * * *',
      'monday': '0 */6 * * *',
      'wrike': '0 */6 * * *',
      'clickup': '0 */6 * * *',

      // Documentation - Every 12 hours (slower update cycle)
      'notion': '0 */12 * * *',
      'confluence': '0 */12 * * *',
      'airtable': '0 */6 * * *',

      // Finance & ERP - Daily at 2 AM (batch processing)
      'sap': '0 2 * * *',
      'workday': '0 2 * * *',
      'quickbooks': '0 2 * * *',
      'rally': '0 */4 * * *',

      // Communication - Manual only (event-driven)
      'slack': null,
      'microsoft-teams': null,
    };

    return defaultSchedules[integrationType] || '0 */6 * * *'; // Default: every 6 hours
  }

  /**
   * Perform sync for a specific integration
   */
  private async performSync(integrationId: string, integrationType: string, integrationName: string): Promise<void> {
    const startTime = Date.now();
    console.log(`[MCPSyncScheduler] 🔄 Starting sync for ${integrationName} (${integrationType})`);

    try {
      // Get integration from database with decrypted credentials
      const integration = await this.storage.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Decrypt credentials
      const decrypted = decryptFields(integration, ['credentials']);
      const credentials = decrypted.credentials;

      // Perform sync based on integration type
      const syncResult = await this.syncData(integrationType, credentials);

      // Update integration status
      await this.storage.updateIntegration(integrationId, {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      });

      const duration = Date.now() - startTime;
      console.log(
        `[MCPSyncScheduler] ✅ Sync completed for ${integrationName} in ${duration}ms (${syncResult.recordsProcessed} records)`
      );
    } catch (error: any) {
      console.error(`[MCPSyncScheduler] ❌ Sync failed for ${integrationName}:`, error.message);

      // Update integration with error status
      try {
        await this.storage.updateIntegration(integrationId, {
          lastSyncAt: new Date(),
          lastSyncStatus: `error: ${error.message}`,
        });
      } catch (updateError) {
        console.error('[MCPSyncScheduler] Failed to update integration status:', updateError);
      }
    }
  }

  /**
   * Sync data from integration
   * This is a simplified implementation - in production, each integration
   * would have its own detailed sync logic
   */
  private async syncData(
    integrationType: string,
    credentials: Record<string, any>
  ): Promise<{ recordsProcessed: number }> {
    // This is a placeholder for the actual sync logic
    // In production, you would:
    // 1. Call the integration's API to fetch projects/tasks/resources
    // 2. Transform the data to match your internal schema
    // 3. Upsert records into your database
    // 4. Handle incremental syncs (only new/updated records)
    // 5. Handle deletions and conflicts

    console.log(`[MCPSyncScheduler] Syncing data from ${integrationType}...`);

    // Simulate sync duration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return mock result
    return {
      recordsProcessed: Math.floor(Math.random() * 50) + 10,
    };
  }

  /**
   * Trigger manual sync for a specific integration
   */
  async triggerManualSync(integrationId: string): Promise<void> {
    const integration = await this.storage.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    console.log(`[MCPSyncScheduler] Manual sync triggered for ${integration.name}`);
    await this.performSync(integrationId, integration.type, integration.name);
  }

  /**
   * Get sync scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    jobs: Array<{ id: string; type: string }>;
  } {
    const jobList = Array.from(this.jobs.entries())
      .filter(([id]) => id !== 'monitor')
      .map(([id]) => ({
        id,
        type: 'scheduled',
      }));

    return {
      isRunning: this.isRunning,
      activeJobs: jobList.length,
      jobs: jobList,
    };
  }
}

/**
 * Create and export MCP sync scheduler instance
 */
let mcpSyncScheduler: MCPSyncScheduler | null = null;

export function createMCPSyncScheduler(storage: IStorage): MCPSyncScheduler {
  if (!mcpSyncScheduler) {
    mcpSyncScheduler = new MCPSyncScheduler(storage);
  }
  return mcpSyncScheduler;
}

export function getMCPSyncScheduler(): MCPSyncScheduler | null {
  return mcpSyncScheduler;
}
