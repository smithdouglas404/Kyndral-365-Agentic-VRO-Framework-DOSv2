import { storage } from "./storage";
import { createJiraClientFromAdapter } from "./jiraClient";
import { createServiceNowClientFromAdapter } from "./serviceNowClient";
import { createAzureDevOpsClientFromAdapter } from "./azureDevOpsClient";
import { createPlanviewClientFromAdapter } from "./planviewClient";
import { createMSProjectClientFromAdapter } from "./msProjectClient";
import { createSmartsheetClientFromAdapter } from "./smartsheetClient";
import { createRallyClientFromAdapter } from "./rallyClient";
import { createMondayClientFromAdapter } from "./mondayClient";
import { createAsanaClientFromAdapter } from "./asanaClient";
import { createOpenProjectClientFromAdapter, syncOpenProjectProjects } from "./openProjectClient";

interface ScheduledJob {
  jobId: string;
  cronExpression: string;
  nextRun: Date;
  lastRun?: Date;
}

const scheduledJobs: Map<string, ScheduledJob> = new Map();
let schedulerInterval: NodeJS.Timeout | null = null;

function parseCronExpression(cron: string): { minute: number; hour: number; dayOfMonth: number; month: number; dayOfWeek: number } | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const parseField = (field: string, max: number): number => {
    if (field === "*") return -1;
    if (field.startsWith("*/")) {
      return parseInt(field.substring(2));
    }
    return parseInt(field);
  };

  return {
    minute: parseField(parts[0], 59),
    hour: parseField(parts[1], 23),
    dayOfMonth: parseField(parts[2], 31),
    month: parseField(parts[3], 12),
    dayOfWeek: parseField(parts[4], 6)
  };
}

function getNextRunTime(cronExpression: string, from: Date = new Date()): Date {
  const parsed = parseCronExpression(cronExpression);
  if (!parsed) {
    const next = new Date(from);
    next.setHours(next.getHours() + 1);
    return next;
  }

  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);

  if (parsed.minute >= 0) {
    if (next.getMinutes() >= parsed.minute) {
      next.setHours(next.getHours() + 1);
    }
    next.setMinutes(parsed.minute);
  } else {
    next.setMinutes(next.getMinutes() + 1);
  }

  if (parsed.hour >= 0) {
    if (next.getHours() !== parsed.hour) {
      next.setHours(parsed.hour);
      next.setMinutes(parsed.minute >= 0 ? parsed.minute : 0);
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
    }
  }

  return next;
}

function normalizeSyncType(job: any): string {
  const syncType = (job.syncType || '').toLowerCase().trim();

  if (['jira', 'servicenow', 'azure_devops', 'planview', 'msproject', 'smartsheet', 'rally', 'monday', 'asana', 'openproject'].includes(syncType)) {
    return syncType;
  }

  const jobName = (job.name || '').toLowerCase();
  if (jobName.includes('azure') || jobName.includes('devops')) return 'azure_devops';
  if (jobName.includes('servicenow') || jobName.includes('snow')) return 'servicenow';
  if (jobName.includes('jira')) return 'jira';
  if (jobName.includes('monday')) return 'monday';
  if (jobName.includes('openproject')) return 'openproject';
  if (jobName.includes('asana')) return 'asana';
  if (jobName.includes('planview')) return 'planview';
  if (jobName.includes('smartsheet')) return 'smartsheet';
  if (jobName.includes('rally')) return 'rally';
  if (jobName.includes('msproject') || jobName.includes('ms project')) return 'msproject';

  return syncType;
}

async function executeSyncJob(jobId: string): Promise<void> {
  try {
    const job = await storage.getSyncJob(jobId);
    if (!job || job.isEnabled !== "true") {
      console.log(`[SyncScheduler] Job ${jobId} not found or disabled, skipping`);
      return;
    }

    console.log(`[SyncScheduler] Executing sync job: ${job.name}`);

    const run = await storage.createSyncJobRun({
      syncJobId: job.id,
      triggeredBy: "schedule",
      status: "running",
      startedAt: new Date()
    });

    try {
      let recordsProcessed = 0;
      let recordsCreated = 0;
      let recordsFailed = 0;
      const errors: string[] = [];

      const normalizedSyncType = normalizeSyncType(job);

      if (normalizedSyncType === 'jira' && job.mcpAdapterId) {
        const client = await createJiraClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Jira client - check adapter configuration");
        }
        
        let config: { projectKey?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const projectKey = config.projectKey;
        if (!projectKey) {
          throw new Error("Missing projectKey in sync job filterCriteria - set filterCriteria to {\"projectKey\":\"YOUR_PROJECT\"}");
        }
        
        const result = await client.syncProject(projectKey, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'servicenow' && job.mcpAdapterId) {
        const client = await createServiceNowClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create ServiceNow client - check adapter configuration");
        }
        
        let config: { projectId?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const projectId = config.projectId;
        if (!projectId) {
          throw new Error("Missing projectId in sync job filterCriteria - set filterCriteria to {\"projectId\":\"YOUR_PROJECT_SYS_ID\"}");
        }
        
        const result = await client.syncProject(projectId, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'azure_devops' && job.mcpAdapterId) {
        const client = await createAzureDevOpsClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Azure DevOps client - check adapter configuration");
        }
        
        const result = await client.syncProject();
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'planview' && job.mcpAdapterId) {
        const client = await createPlanviewClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Planview client - check adapter configuration (instanceUrl, apiKey)");
        }
        
        let config: { projectId?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const projectId = config.projectId;
        if (!projectId) {
          throw new Error("Missing projectId in sync job filterCriteria");
        }
        
        const result = await client.syncProject(projectId, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'msproject' && job.mcpAdapterId) {
        const client = await createMSProjectClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create MS Project client - check adapter configuration (tenantId, clientId, clientSecret)");
        }
        
        let config: { projectId?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const projectId = config.projectId;
        if (!projectId) {
          throw new Error("Missing projectId in sync job filterCriteria");
        }
        
        const result = await client.syncProject(projectId, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'smartsheet' && job.mcpAdapterId) {
        const client = await createSmartsheetClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Smartsheet client - check adapter configuration (accessToken)");
        }
        
        let config: { sheetId?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const sheetId = config.sheetId;
        if (!sheetId) {
          throw new Error("Missing sheetId in sync job filterCriteria");
        }
        
        const result = await client.syncSheet(sheetId, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'rally' && job.mcpAdapterId) {
        const client = await createRallyClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Rally client - check adapter configuration (apiKey)");
        }
        
        let config: { projectRef?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const projectRef = config.projectRef;
        if (!projectRef) {
          throw new Error("Missing projectRef in sync job filterCriteria");
        }
        
        const result = await client.syncProject(projectRef, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'monday' && job.mcpAdapterId) {
        const client = await createMondayClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Monday.com client - check adapter configuration (apiKey)");
        }
        
        let config: { boardId?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const boardId = config.boardId;
        if (!boardId) {
          throw new Error("Missing boardId in sync job filterCriteria");
        }
        
        const result = await client.syncBoard(boardId, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) + 
                        (result.featuresCreated || 0) + 
                        (result.storiesCreated || 0) + 
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'asana' && job.mcpAdapterId) {
        const client = await createAsanaClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create Asana client - check adapter configuration (accessToken)");
        }
        
        let config: { projectGid?: string } = {};
        try {
          config = JSON.parse(job.filterCriteria || '{}');
        } catch (e) {
          throw new Error("Invalid filterCriteria JSON in sync job configuration");
        }
        
        const projectGid = config.projectGid;
        if (!projectGid) {
          throw new Error("Missing projectGid in sync job filterCriteria");
        }
        
        const result = await client.syncProject(projectGid, job.mcpAdapterId);
        recordsCreated = (result.projectsCreated || 0) +
                        (result.featuresCreated || 0) +
                        (result.storiesCreated || 0) +
                        (result.tasksCreated || 0);
        recordsProcessed = recordsCreated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else if (normalizedSyncType === 'openproject' && job.mcpAdapterId) {
        const client = await createOpenProjectClientFromAdapter(job.mcpAdapterId);
        if (!client) {
          throw new Error("Failed to create OpenProject client - check adapter configuration (baseUrl, apiKey)");
        }

        const result = await syncOpenProjectProjects(client);
        recordsCreated = result.projectsCreated;
        recordsProcessed = result.projectsCreated + result.projectsUpdated;
        recordsFailed = result.errors?.length || 0;
        errors.push(...(result.errors || []));
      } else {
        throw new Error(`Unsupported sync type: ${normalizedSyncType} (original: ${job.syncType}) - supported types: jira, servicenow, azure_devops, planview, msproject, smartsheet, rally, monday, asana, openproject`);
      }

      await storage.updateSyncJobRun(run.id, {
        status: recordsFailed > 0 ? "completed_with_errors" : "success",
        completedAt: new Date(),
        recordsProcessed,
        recordsCreated,
        recordsUpdated: 0,
        recordsDeleted: 0,
        recordsFailed,
        conflictsDetected: 0,
        conflictsResolved: 0,
        summary: JSON.stringify({
          entityTypes: JSON.parse(job.entityTypes || "[]"),
          syncDirection: job.syncDirection,
          errors: errors.slice(0, 5)
        })
      });

      await storage.updateSyncJobLastRun(job.id, recordsFailed > 0 ? "warning" : "success");
      console.log(`[SyncScheduler] Job ${job.name} completed: ${recordsProcessed} records processed, ${recordsFailed} errors`);

    } catch (execError: any) {
      await storage.updateSyncJobRun(run.id, {
        status: "failed",
        completedAt: new Date(),
        errorLog: JSON.stringify([{ message: execError.message, timestamp: new Date().toISOString() }])
      });
      await storage.updateSyncJobLastRun(job.id, "failed", execError.message);
      console.error(`[SyncScheduler] Job ${job.name} failed:`, execError.message);
    }

  } catch (error: any) {
    console.error(`[SyncScheduler] Error executing job ${jobId}:`, error.message);
  }
}

async function checkAndRunDueJobs(): Promise<void> {
  const now = new Date();
  const entries = Array.from(scheduledJobs.entries());

  for (const [jobId, scheduled] of entries) {
    if (scheduled.nextRun <= now) {
      await executeSyncJob(jobId);

      scheduled.lastRun = now;
      scheduled.nextRun = getNextRunTime(scheduled.cronExpression, now);
      scheduledJobs.set(jobId, scheduled);

      try {
        await storage.updateSyncJob(jobId, { nextRunAt: scheduled.nextRun });
      } catch (e) {
      }
    }
  }
}

async function loadScheduledJobs(): Promise<void> {
  try {
    const enabledJobs = await storage.getEnabledSyncJobs();
    
    scheduledJobs.clear();

    for (const job of enabledJobs) {
      if (job.cronExpression) {
        const nextRun = getNextRunTime(job.cronExpression);
        scheduledJobs.set(job.id, {
          jobId: job.id,
          cronExpression: job.cronExpression,
          nextRun,
          lastRun: job.lastRunAt || undefined
        });

        try {
          await storage.updateSyncJob(job.id, { nextRunAt: nextRun });
        } catch (e) {
        }

        console.log(`[SyncScheduler] Scheduled job: ${job.name} (${job.cronExpression}) - next run: ${nextRun.toISOString()}`);
      }
    }

    console.log(`[SyncScheduler] Loaded ${scheduledJobs.size} scheduled sync jobs`);
  } catch (error: any) {
    console.error("[SyncScheduler] Failed to load scheduled jobs:", error.message);
  }
}

export async function startSyncScheduler(): Promise<void> {
  console.log("[SyncScheduler] Starting MCP sync scheduler...");

  await loadScheduledJobs();

  schedulerInterval = setInterval(async () => {
    await checkAndRunDueJobs();
  }, 60000);

  console.log("[SyncScheduler] Sync scheduler started (checking every 60 seconds)");
}

export async function stopSyncScheduler(): Promise<void> {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SyncScheduler] Sync scheduler stopped");
  }
}

export async function reloadScheduledJobs(): Promise<void> {
  await loadScheduledJobs();
}

export function getScheduledJobsStatus(): { jobId: string; nextRun: Date; lastRun?: Date }[] {
  return Array.from(scheduledJobs.values()).map(job => ({
    jobId: job.jobId,
    nextRun: job.nextRun,
    lastRun: job.lastRun
  }));
}
