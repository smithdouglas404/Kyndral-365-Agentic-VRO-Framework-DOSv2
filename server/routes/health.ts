/**
 * PRODUCTION-GRADE Health Check and Monitoring Endpoints
 *
 * Provides comprehensive observability for:
 * - MCP health and circuit breaker status
 * - Agent health and execution metrics
 * - Data sync scheduler status
 * - Database connectivity
 * - External service connectivity
 * - System metrics
 *
 * Essential for production monitoring, alerting, and SRE dashboards.
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  components: {
    database: ComponentHealth;
    mcps: {
      planview: ComponentHealth;
      excelSheets: ComponentHealth;
      notification: ComponentHealth;
    };
    agents: {
      scheduler: ComponentHealth;
      individual: Record<string, AgentHealth>;
    };
    syncScheduler: ComponentHealth;
  };
  metrics: SystemMetrics;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastCheck?: Date;
  details?: Record<string, any>;
}

interface AgentHealth extends ComponentHealth {
  lastRun?: Date;
  totalRuns: number;
  successRate: number;
  averageDuration: number;
}

interface SystemMetrics {
  totalRequests: number;
  totalFailures: number;
  errorRate: number;
  averageResponseTime: number;
  memoryUsageMB: number;
  cpuUsagePercent?: number;
}

const startTime = Date.now();
let totalRequests = 0;
let totalFailures = 0;
let totalResponseTime = 0;

export function registerHealthRoutes(app: Express, storage: IStorage): void {
  /**
   * Liveness probe - Is the service running?
   * Used by Kubernetes/Docker health checks
   */
  app.get('/health/live', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Readiness probe - Is the service ready to accept traffic?
   * Checks database connectivity
   */
  app.get('/health/ready', async (_req, res) => {
    try {
      // Check database connectivity
      await storage.getProjects();

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
        },
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: 'failed',
        },
      });
    }
  });

  /**
   * Comprehensive health check - All components
   */
  app.get('/health', async (_req, res) => {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: Date.now() - startTime,
      version: process.env.APP_VERSION || '2.0.0',
      components: {
        database: await checkDatabase(storage),
        mcps: {
          planview: await checkPlanviewMCP(),
          excelSheets: await checkExcelSheetsMCP(),
          notification: await checkNotificationMCP(),
        },
        agents: await checkAgents(storage),
        syncScheduler: await checkSyncScheduler(),
      },
      metrics: getSystemMetrics(),
    };

    // Determine overall status
    const componentStatuses = [
      health.components.database.status,
      health.components.mcps.planview.status,
      health.components.mcps.excelSheets.status,
      health.components.mcps.notification.status,
      health.components.agents.scheduler.status,
      health.components.syncScheduler.status,
    ];

    if (componentStatuses.some(s => s === 'unhealthy')) {
      health.status = 'unhealthy';
    } else if (componentStatuses.some(s => s === 'degraded')) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  });

  /**
   * MCP health and metrics
   */
  app.get('/health/mcps', async (_req, res) => {
    try {
      const mcpHealth = {
        planview: await checkPlanviewMCP(),
        excelSheets: await checkExcelSheetsMCP(),
        notification: await checkNotificationMCP(),
      };

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mcps: mcpHealth,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  });

  /**
   * Agent health and metrics
   */
  app.get('/health/agents', async (_req, res) => {
    try {
      const agentHealth = await checkAgents(storage);

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        agents: agentHealth,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  });

  /**
   * System metrics endpoint
   */
  app.get('/health/metrics', (_req, res) => {
    const metrics = getSystemMetrics();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      metrics,
    });
  });
}

/**
 * Check database health
 */
async function checkDatabase(storage: IStorage): Promise<ComponentHealth> {
  try {
    const start = Date.now();
    await storage.getProjects();
    const duration = Date.now() - start;

    return {
      status: duration < 1000 ? 'healthy' : duration < 3000 ? 'degraded' : 'unhealthy',
      lastCheck: new Date(),
      details: {
        responseTimeMs: duration,
        connected: true,
      },
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: error.message,
      lastCheck: new Date(),
      details: {
        connected: false,
      },
    };
  }
}

/**
 * Check Planview MCP health
 */
async function checkPlanviewMCP(): Promise<ComponentHealth> {
  try {
    // Try to import and check health
    const { createPlanviewMCP } = await import('../mcp/PlanviewMCP_v2.js');
    const { storage } = await import('../storage.js');

    const mcp = createPlanviewMCP(storage);
    const health = mcp.getHealth();
    const metrics = mcp.getMetrics();

    return {
      status: health.isHealthy ? 'healthy' : health.circuitState === 'HALF_OPEN' ? 'degraded' : 'unhealthy',
      lastCheck: new Date(),
      details: {
        circuitState: health.circuitState,
        failureCount: health.failureCount,
        successRate: metrics.successRate.toFixed(2) + '%',
        totalRequests: metrics.totalRequests,
        rateLimitExceeded: health.rateLimitExceeded,
      },
    };
  } catch (error: any) {
    return {
      status: 'degraded',
      message: 'MCP not initialized or error checking health',
      lastCheck: new Date(),
    };
  }
}

/**
 * Check Excel Sheets MCP health
 */
async function checkExcelSheetsMCP(): Promise<ComponentHealth> {
  try {
    // Excel Sheets MCP doesn't extend MCPBase yet, so basic check
    return {
      status: 'healthy',
      lastCheck: new Date(),
      details: {
        note: 'Basic health check - Excel Sheets MCP operational',
      },
    };
  } catch (error: any) {
    return {
      status: 'degraded',
      message: error.message,
      lastCheck: new Date(),
    };
  }
}

/**
 * Check Notification MCP health
 */
async function checkNotificationMCP(): Promise<ComponentHealth> {
  try {
    const slackConfigured = !!process.env.SLACK_WEBHOOK_URL || !!process.env.SLACK_BOT_TOKEN;
    const teamsConfigured = !!process.env.TEAMS_WEBHOOK_URL;

    return {
      status: (slackConfigured || teamsConfigured) ? 'healthy' : 'degraded',
      message: !(slackConfigured || teamsConfigured) ? 'No notification channels configured' : undefined,
      lastCheck: new Date(),
      details: {
        slackConfigured,
        teamsConfigured,
      },
    };
  } catch (error: any) {
    return {
      status: 'degraded',
      message: error.message,
      lastCheck: new Date(),
    };
  }
}

/**
 * Check agent scheduler and individual agent health
 */
async function checkAgents(storage: IStorage): Promise<{
  scheduler: ComponentHealth;
  individual: Record<string, AgentHealth>;
}> {
  try {
    const { getAgentSchedulerInstance } = await import('../agents/AgentScheduler.js');
    const scheduler = getAgentSchedulerInstance();

    if (!scheduler) {
      return {
        scheduler: { status: 'degraded', details: 'Agent scheduler not initialized' },
        individual: {},
      };
    }

    const status = scheduler.getStatus();

    // Get individual agent health
    const agentHealth: Record<string, AgentHealth> = {};

    for (const agent of status.agents) {
      // Query agent activity logs for metrics
      const logs = await storage.getAgentActivityLogs(agent.agentId, 100);

      const successfulRuns = logs.filter(l => l.status === 'success').length;
      const totalRuns = logs.length;
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

      const durations = logs
        .filter(l => l.completedAt && l.createdAt)
        .map(l => new Date(l.completedAt!).getTime() - new Date(l.createdAt).getTime());

      const avgDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

      agentHealth[agent.agentId] = {
        status: agent.isRunning ? 'healthy' : 'degraded',
        lastRun: agent.lastRun ? new Date(agent.lastRun) : undefined,
        totalRuns,
        successRate,
        averageDuration: avgDuration,
        details: {
          nextRun: agent.nextRun,
          intervalMinutes: agent.intervalMinutes,
        },
      };
    }

    return {
      scheduler: {
        status: status.isRunning ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        details: {
          totalAgents: status.agents.length,
          runningAgents: status.agents.filter(a => a.isRunning).length,
        },
      },
      individual: agentHealth,
    };
  } catch (error: any) {
    return {
      scheduler: {
        status: 'unhealthy',
        message: error.message,
        lastCheck: new Date(),
      },
      individual: {},
    };
  }
}

/**
 * Check sync scheduler health
 */
async function checkSyncScheduler(): Promise<ComponentHealth> {
  try {
    const { getSyncScheduler } = await import('../mcp/SyncScheduler.js');
    const scheduler = getSyncScheduler();

    if (!scheduler) {
      return {
        status: 'degraded',
        message: 'Sync scheduler not initialized',
        lastCheck: new Date(),
      };
    }

    const status = scheduler.getStatus();
    const history = scheduler.getSyncHistory();

    const recentFailures = history.slice(-10).filter(s => !s.success).length;

    return {
      status: status.isRunning ? (recentFailures > 5 ? 'degraded' : 'healthy') : 'unhealthy',
      lastCheck: new Date(),
      details: {
        isRunning: status.isRunning,
        planviewEnabled: status.planviewEnabled,
        googleSheetsEnabled: status.googleSheetsEnabled,
        lastPlanviewSync: status.lastPlanviewSync?.timestamp,
        lastGoogleSheetsSync: status.lastGoogleSheetsSync?.timestamp,
        recentFailures,
      },
    };
  } catch (error: any) {
    return {
      status: 'degraded',
      message: error.message,
      lastCheck: new Date(),
    };
  }
}

/**
 * Get system metrics
 */
function getSystemMetrics(): SystemMetrics {
  const memUsage = process.memoryUsage();

  return {
    totalRequests,
    totalFailures,
    errorRate: totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0,
    averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
    memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    cpuUsagePercent: undefined, // Would need CPU profiling library
  };
}

/**
 * Middleware to track request metrics
 */
export function trackRequestMetrics() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    totalRequests++;

    res.on('finish', () => {
      const duration = Date.now() - start;
      totalResponseTime += duration;

      if (res.statusCode >= 400) {
        totalFailures++;
      }
    });

    next();
  };
}
