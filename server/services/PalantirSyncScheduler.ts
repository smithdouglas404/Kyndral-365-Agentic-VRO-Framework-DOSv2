/**
 * PALANTIR SYNC SCHEDULER
 *
 * Scheduled sync jobs for external systems → Palantir Foundry.
 * Runs on configurable intervals to keep Palantir ontology in sync
 * with Jira, OpenProject, and Monday.com.
 *
 * Sync Flow:
 * 1. External System → MCP Service → Transform → Palantir Actions → Ontology
 * 2. All data flows INTO Palantir (source of truth)
 * 3. Application reads FROM Palantir only
 */

import { PalantirSyncService, SyncResult } from "./PalantirSyncService.js";
import { storage } from "../storage.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SyncJobConfig {
  id: string;
  name: string;
  system: "jira" | "openproject" | "monday";
  enabled: boolean;
  cronSchedule: string; // cron expression
  lastRun?: string;
  nextRun?: string;
  config: {
    // Jira config
    baseUrl?: string;
    email?: string;
    apiToken?: string;
    projectKey?: string;
    jql?: string;
    // OpenProject config
    apiKey?: string;
    projectId?: string;
    // Monday config
    boardId?: string;
  };
}

export interface SyncJobRun {
  id: string;
  jobId: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  result?: SyncResult;
  error?: string;
}

// ============================================================================
// CRON PARSER (simple implementation)
// ============================================================================

function parseCronExpression(cron: string): {
  minutes: number[];
  hours: number[];
  daysOfMonth: number[];
  months: number[];
  daysOfWeek: number[];
} {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: ${cron}`);
  }

  const parseField = (field: string, min: number, max: number): number[] => {
    if (field === "*") {
      return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }
    if (field.includes("/")) {
      const [, step] = field.split("/");
      const stepNum = parseInt(step);
      return Array.from({ length: Math.floor((max - min) / stepNum) + 1 }, (_, i) => min + i * stepNum);
    }
    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    }
    if (field.includes(",")) {
      return field.split(",").map(Number);
    }
    return [parseInt(field)];
  };

  return {
    minutes: parseField(parts[0], 0, 59),
    hours: parseField(parts[1], 0, 23),
    daysOfMonth: parseField(parts[2], 1, 31),
    months: parseField(parts[3], 1, 12),
    daysOfWeek: parseField(parts[4], 0, 6),
  };
}

function getNextRunTime(cron: string, from: Date = new Date()): Date {
  const parsed = parseCronExpression(cron);
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  // Simple approach: check each minute for the next 7 days
  const maxAttempts = 7 * 24 * 60;
  for (let i = 0; i < maxAttempts; i++) {
    if (
      parsed.minutes.includes(next.getMinutes()) &&
      parsed.hours.includes(next.getHours()) &&
      parsed.daysOfMonth.includes(next.getDate()) &&
      parsed.months.includes(next.getMonth() + 1) &&
      parsed.daysOfWeek.includes(next.getDay())
    ) {
      return next;
    }
    next.setMinutes(next.getMinutes() + 1);
  }

  return new Date(from.getTime() + 24 * 60 * 60 * 1000); // Default: tomorrow
}

// ============================================================================
// PALANTIR SYNC SCHEDULER
// ============================================================================

export class PalantirSyncScheduler {
  private jobs: Map<string, SyncJobConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private runHistory: SyncJobRun[] = [];
  private isRunning = false;

  // Default sync schedules
  private static readonly DEFAULT_SCHEDULES = {
    jira: "0 0 * * *",        // Every 24 hours (midnight)
    openproject: "0 0 * * *",  // Every 24 hours (midnight)
    monday: "0 0 * * *",       // Every 24 hours (midnight)
  };

  constructor() {
    this.loadJobsFromEnv();
  }

  /**
   * Load sync jobs from environment variables
   */
  private loadJobsFromEnv(): void {
    // Jira sync job
    if (process.env.JIRA_SYNC_ENABLED === "true") {
      this.registerJob({
        id: "jira-sync",
        name: "Jira → Palantir Sync",
        system: "jira",
        enabled: true,
        cronSchedule: process.env.JIRA_SYNC_CRON || PalantirSyncScheduler.DEFAULT_SCHEDULES.jira,
        config: {
          baseUrl: process.env.JIRA_DOMAIN,
          email: process.env.JIRA_EMAIL,
          apiToken: process.env.JIRA_API_TOKEN,
          projectKey: process.env.JIRA_PROJECT_KEY,
          jql: process.env.JIRA_SYNC_JQL,
        },
      });
    }

    // OpenProject sync job
    if (process.env.OPENPROJECT_SYNC_ENABLED === "true") {
      this.registerJob({
        id: "openproject-sync",
        name: "OpenProject → Palantir Sync",
        system: "openproject",
        enabled: true,
        cronSchedule: process.env.OPENPROJECT_SYNC_CRON || PalantirSyncScheduler.DEFAULT_SCHEDULES.openproject,
        config: {
          baseUrl: process.env.OPENPROJECT_URL,
          apiKey: process.env.OPENPROJECT_API_KEY,
          projectId: process.env.OPENPROJECT_PROJECT_ID,
        },
      });
    }

    // Monday.com sync job
    if (process.env.MONDAY_SYNC_ENABLED === "true") {
      this.registerJob({
        id: "monday-sync",
        name: "Monday.com → Palantir Sync",
        system: "monday",
        enabled: true,
        cronSchedule: process.env.MONDAY_SYNC_CRON || PalantirSyncScheduler.DEFAULT_SCHEDULES.monday,
        config: {
          apiToken: process.env.MONDAY_API_TOKEN,
          boardId: process.env.MONDAY_BOARD_ID,
        },
      });
    }
  }

  /**
   * Register a sync job
   */
  registerJob(job: SyncJobConfig): void {
    job.nextRun = getNextRunTime(job.cronSchedule).toISOString();
    this.jobs.set(job.id, job);
    console.log(`[SyncScheduler] Registered job: ${job.name} (${job.cronSchedule})`);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[SyncScheduler] Already running");
      return;
    }

    this.isRunning = true;
    console.log("[SyncScheduler] Starting sync scheduler...");

    // Schedule all enabled jobs
    for (const [jobId, job] of this.jobs) {
      if (job.enabled) {
        this.scheduleJob(jobId);
      }
    }

    console.log(`[SyncScheduler] Started with ${this.jobs.size} jobs`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;

    // Clear all timers
    for (const [jobId, timer] of this.timers) {
      clearTimeout(timer);
      console.log(`[SyncScheduler] Stopped job: ${jobId}`);
    }
    this.timers.clear();

    console.log("[SyncScheduler] Stopped");
  }

  /**
   * Schedule a specific job
   */
  private scheduleJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) return;

    // Clear existing timer
    if (this.timers.has(jobId)) {
      clearTimeout(this.timers.get(jobId)!);
    }

    // Calculate delay until next run
    const nextRun = getNextRunTime(job.cronSchedule);
    const delay = nextRun.getTime() - Date.now();

    // Update job with next run time
    job.nextRun = nextRun.toISOString();

    // Schedule the job
    const timer = setTimeout(async () => {
      await this.executeJob(jobId);
      // Reschedule for next run
      if (this.isRunning && job.enabled) {
        this.scheduleJob(jobId);
      }
    }, Math.max(delay, 1000)); // Minimum 1 second delay

    this.timers.set(jobId, timer);

    const delayMinutes = Math.round(delay / 60000);
    console.log(`[SyncScheduler] Job ${job.name} scheduled for ${nextRun.toISOString()} (in ${delayMinutes} minutes)`);
  }

  /**
   * Execute a sync job
   */
  private async executeJob(jobId: string): Promise<SyncJobRun> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const run: SyncJobRun = {
      id: `${jobId}-${Date.now()}`,
      jobId,
      startedAt: new Date().toISOString(),
      status: "running",
    };

    this.runHistory.push(run);
    console.log(`[SyncScheduler] Starting job: ${job.name}`);

    try {
      let result: SyncResult;

      switch (job.system) {
        case "jira":
          result = await PalantirSyncService.syncFromJira({
            baseUrl: job.config.baseUrl!,
            email: job.config.email!,
            apiToken: job.config.apiToken!,
            projectKey: job.config.projectKey,
            jql: job.config.jql,
          });
          break;

        case "openproject":
          result = await PalantirSyncService.syncFromOpenProject({
            baseUrl: job.config.baseUrl!,
            apiToken: job.config.apiKey!,
            projectId: job.config.projectId,
          });
          break;

        case "monday":
          result = await PalantirSyncService.syncFromMonday({
            apiToken: job.config.apiToken!,
            boardId: job.config.boardId!,
          });
          break;

        default:
          throw new Error(`Unknown system: ${job.system}`);
      }

      run.status = "completed";
      run.result = result;
      run.completedAt = new Date().toISOString();

      // Update job last run
      job.lastRun = run.completedAt;

      // Log to database if available
      try {
        await this.logSyncRun(run);
      } catch (e) {
        // Ignore logging errors
      }

      console.log(`[SyncScheduler] Job ${job.name} completed: ${result.synced} synced, ${result.failed} failed`);
    } catch (error: any) {
      run.status = "failed";
      run.error = error.message;
      run.completedAt = new Date().toISOString();
      console.error(`[SyncScheduler] Job ${job.name} failed: ${error.message}`);
    }

    return run;
  }

  /**
   * Log sync run to database
   */
  private async logSyncRun(run: SyncJobRun): Promise<void> {
    // Store in agent_activity_log for audit trail
    await storage.createAgentActivityLog({
      agentId: `sync-${run.jobId}`,
      activityType: "data_sync",
      description: `Sync job ${run.jobId}: ${run.status}`,
      metadata: {
        runId: run.id,
        status: run.status,
        result: run.result,
        error: run.error,
      },
    });
  }

  /**
   * Manually trigger a sync job
   */
  async triggerJob(jobId: string): Promise<SyncJobRun> {
    return this.executeJob(jobId);
  }

  /**
   * Get all registered jobs
   */
  getJobs(): SyncJobConfig[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): SyncJobConfig | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job configuration
   */
  updateJob(jobId: string, updates: Partial<SyncJobConfig>): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    Object.assign(job, updates);

    // Reschedule if enabled and schedule changed
    if (job.enabled && this.isRunning) {
      this.scheduleJob(jobId);
    }

    return true;
  }

  /**
   * Enable/disable a job
   */
  setJobEnabled(jobId: string, enabled: boolean): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.enabled = enabled;

    if (enabled && this.isRunning) {
      this.scheduleJob(jobId);
    } else if (!enabled && this.timers.has(jobId)) {
      clearTimeout(this.timers.get(jobId)!);
      this.timers.delete(jobId);
    }

    return true;
  }

  /**
   * Get run history
   */
  getRunHistory(limit = 50): SyncJobRun[] {
    return this.runHistory.slice(-limit).reverse();
  }

  /**
   * Get run history for a specific job
   */
  getJobRunHistory(jobId: string, limit = 10): SyncJobRun[] {
    return this.runHistory
      .filter((r) => r.jobId === jobId)
      .slice(-limit)
      .reverse();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let schedulerInstance: PalantirSyncScheduler | null = null;

export function getPalantirSyncScheduler(): PalantirSyncScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new PalantirSyncScheduler();
  }
  return schedulerInstance;
}

export function startPalantirSyncScheduler(): void {
  const scheduler = getPalantirSyncScheduler();
  scheduler.start();
}

export function stopPalantirSyncScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}
