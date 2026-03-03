/**
 * PRODUCTION-GRADE PROCESS MANAGEMENT
 *
 * Features:
 * - Graceful shutdown handling (SIGTERM, SIGINT)
 * - Uncaught exception handling
 * - Unhandled promise rejection handling
 * - Hanging process detection and cleanup
 * - Health check ping for monitoring
 * - Automatic restart coordination
 *
 * Usage:
 *   import { setupProcessHandlers } from './lib/processManager';
 *   setupProcessHandlers(server, cleanup);
 */

import { logger, logPerformance } from './logger.js';
import type { Server } from 'http';

interface ProcessManagerConfig {
  gracefulShutdownTimeout?: number; // Default: 30 seconds
  healthCheckInterval?: number; // Default: 60 seconds
  hangingProcessTimeout?: number; // Default: 5 minutes
}

const DEFAULT_CONFIG: Required<ProcessManagerConfig> = {
  gracefulShutdownTimeout: 30000, // 30 seconds
  healthCheckInterval: 60000, // 1 minute
  hangingProcessTimeout: 300000, // 5 minutes
};

let isShuttingDown = false;
let lastActivityTimestamp = Date.now();
let healthCheckInterval: NodeJS.Timeout | null = null;
let hangingProcessCheckInterval: NodeJS.Timeout | null = null;

/**
 * Update last activity timestamp (call this on every request/activity)
 */
export function recordActivity() {
  lastActivityTimestamp = Date.now();
}

/**
 * Check if process is hanging (no activity for extended period)
 */
function checkForHangingProcess(timeout: number) {
  const inactiveTime = Date.now() - lastActivityTimestamp;

  if (inactiveTime > timeout && !isShuttingDown) {
    logger.error('Process appears to be hanging', {
      inactiveTimeMs: inactiveTime,
      timeoutMs: timeout,
      lastActivity: new Date(lastActivityTimestamp).toISOString(),
    });

    // Force restart by exiting with error code
    logger.error('Forcing process restart due to hanging state');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(
  signal: string,
  server: Server | null,
  cleanupCallbacks: (() => Promise<void>)[],
  timeout: number
) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring duplicate signal');
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`, { signal });

  const shutdownStart = Date.now();

  // Set timeout for forced shutdown
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit', {
      timeoutMs: timeout,
    });
    process.exit(1);
  }, timeout);

  try {
    // 1. Stop accepting new requests
    if (server) {
      logger.info('Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server', err);
            reject(err);
          } else {
            logger.info('HTTP server closed successfully');
            resolve();
          }
        });
      });
    }

    // 2. Run cleanup callbacks (stop agents, close DB connections, etc.)
    logger.info(`Running ${cleanupCallbacks.length} cleanup callbacks...`);
    for (const cleanup of cleanupCallbacks) {
      try {
        await cleanup();
      } catch (err: any) {
        logger.error('Cleanup callback failed', err);
      }
    }

    // 3. Clear intervals
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    if (hangingProcessCheckInterval) {
      clearInterval(hangingProcessCheckInterval);
    }

    clearTimeout(forceShutdownTimer);

    const shutdownDuration = Date.now() - shutdownStart;
    logPerformance('graceful_shutdown', shutdownDuration);

    logger.info('Graceful shutdown completed successfully', {
      durationMs: shutdownDuration,
    });

    process.exit(0);
  } catch (err: any) {
    logger.error('Error during graceful shutdown', err);
    clearTimeout(forceShutdownTimer);
    process.exit(1);
  }
}

/**
 * Setup all process signal handlers and error handlers
 */
export function setupProcessHandlers(
  server: Server | null = null,
  cleanupCallbacks: (() => Promise<void>)[] = [],
  config: ProcessManagerConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  logger.info('Setting up process handlers', {
    gracefulShutdownTimeout: finalConfig.gracefulShutdownTimeout,
    healthCheckInterval: finalConfig.healthCheckInterval,
    hangingProcessTimeout: finalConfig.hangingProcessTimeout,
  });

  // SIGTERM handler (Docker, Kubernetes, PM2 graceful shutdown)
  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM', server, cleanupCallbacks, finalConfig.gracefulShutdownTimeout);
  });

  // SIGINT handler (Ctrl+C)
  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT', server, cleanupCallbacks, finalConfig.gracefulShutdownTimeout);
  });

  // Uncaught exception handler
  process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION - Process will exit', error, {
      type: 'uncaughtException',
      stack: error.stack,
    });

    // Give logger time to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Unhandled promise rejection handler
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('UNHANDLED PROMISE REJECTION', reason, {
      type: 'unhandledRejection',
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });

    // In production, we might want to exit on unhandled rejections
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  // Warning handler (e.g., memory leaks, deprecation warnings)
  process.on('warning', (warning: Error) => {
    logger.warn('Process warning', {
      type: 'warning',
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  // Health check ping (for monitoring systems)
  healthCheckInterval = setInterval(() => {
    logger.debug('Health check ping', {
      uptime: process.uptime(),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      lastActivityAge: Date.now() - lastActivityTimestamp,
    });
  }, finalConfig.healthCheckInterval);

  // Hanging process detection disabled - an idle web server is not hanging
  // hangingProcessCheckInterval = setInterval(() => {
  //   checkForHangingProcess(finalConfig.hangingProcessTimeout);
  // }, 60000);

  logger.info('Process handlers initialized successfully');
}

/**
 * Create cleanup callback for agent scheduler
 */
export function createAgentSchedulerCleanup(agentScheduler: any): () => Promise<void> {
  return async () => {
    logger.info('Stopping agent scheduler...');
    try {
      await agentScheduler.stopAll();
      logger.info('Agent scheduler stopped');
    } catch (err: any) {
      logger.error('Failed to stop agent scheduler', err);
    }
  };
}

/**
 * Create cleanup callback for orchestrator
 */
export function createOrchestratorCleanup(orchestrator: any): () => Promise<void> {
  return async () => {
    logger.info('Stopping orchestrator...');
    try {
      await orchestrator.stop();
      logger.info('Orchestrator stopped');
    } catch (err: any) {
      logger.error('Failed to stop orchestrator', err);
    }
  };
}

/**
 * Create cleanup callback for database connections
 */
export function createDatabaseCleanup(storage: any): () => Promise<void> {
  return async () => {
    logger.info('Closing database connections...');
    try {
      if (storage.close) {
        await storage.close();
      }
      logger.info('Database connections closed');
    } catch (err: any) {
      logger.error('Failed to close database connections', err);
    }
  };
}

/**
 * Create cleanup callback for WebSocket server
 */
export function createWebSocketCleanup(wss: any): () => Promise<void> {
  return async () => {
    logger.info('Closing WebSocket connections...');
    try {
      wss.clients.forEach((client: any) => {
        client.close();
      });
      logger.info('WebSocket connections closed');
    } catch (err: any) {
      logger.error('Failed to close WebSocket connections', err);
    }
  };
}

/**
 * Monitor memory usage and warn if high
 */
export function startMemoryMonitoring(thresholdMB: number = 512, intervalMs: number = 60000) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    if (heapUsedMB > thresholdMB) {
      logger.warn('High memory usage detected', {
        heapUsedMB,
        heapTotalMB,
        thresholdMB,
        percentUsed: Math.round((heapUsedMB / heapTotalMB) * 100),
      });
    }
  }, intervalMs);
}

export { isShuttingDown };
