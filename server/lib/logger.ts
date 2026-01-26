/**
 * PRODUCTION-GRADE STRUCTURED LOGGING SYSTEM
 *
 * Features:
 * - Log rotation (daily, max 14 days retention)
 * - Multiple log levels (error, warn, info, debug)
 * - Separate error log file for critical issues
 * - JSON formatting for machine parsing
 * - Console output for development
 * - Context tracking (request ID, user ID, agent ID)
 * - Performance metrics logging
 *
 * Usage:
 *   import { logger } from './lib/logger';
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('Database error', { error: err.message });
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Log directory configuration
const LOG_DIR = process.env.LOG_DIR || './logs';

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// Custom format for console output (colorized, human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

// JSON format for file output (machine-parseable)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transport: Daily rotating files (general logs)
const dailyRotateTransport = new DailyRotateFile({
  filename: `${LOG_DIR}/application-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'info',
});

// Transport: Error logs (separate file for critical issues)
const errorRotateTransport = new DailyRotateFile({
  filename: `${LOG_DIR}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error',
});

// Transport: Console (development)
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'deep-agent-system',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    consoleTransport,
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: `${LOG_DIR}/exceptions.log` }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: `${LOG_DIR}/rejections.log` }),
  ],
});

/**
 * Context-aware logger that adds metadata to all logs
 */
export class ContextLogger {
  constructor(private context: Record<string, any> = {}) {}

  info(message: string, meta?: Record<string, any>) {
    logger.info(message, { ...this.context, ...meta });
  }

  warn(message: string, meta?: Record<string, any>) {
    logger.warn(message, { ...this.context, ...meta });
  }

  error(message: string, error?: Error | string, meta?: Record<string, any>) {
    const errorMeta = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error };

    logger.error(message, { ...this.context, ...errorMeta, ...meta });
  }

  debug(message: string, meta?: Record<string, any>) {
    logger.debug(message, { ...this.context, ...meta });
  }

  child(additionalContext: Record<string, any>): ContextLogger {
    return new ContextLogger({ ...this.context, ...additionalContext });
  }
}

/**
 * Create a context-aware logger for a specific component
 */
export function createLogger(context: Record<string, any>): ContextLogger {
  return new ContextLogger(context);
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, any>
) {
  logger.info(`Performance: ${operation}`, {
    operation,
    durationMs,
    ...metadata,
    type: 'performance',
  });
}

/**
 * Log agent activity
 */
export function logAgentActivity(
  agentId: string,
  action: string,
  status: 'start' | 'success' | 'error',
  metadata?: Record<string, any>
) {
  const level = status === 'error' ? 'error' : 'info';
  logger.log(level, `Agent ${agentId}: ${action} [${status}]`, {
    agentId,
    action,
    status,
    ...metadata,
    type: 'agent_activity',
  });
}

/**
 * Log orchestration cycle
 */
export function logOrchestrationCycle(
  cycle: number,
  status: 'start' | 'complete' | 'error',
  metadata?: Record<string, any>
) {
  logger.info(`Orchestration Cycle ${cycle} [${status}]`, {
    cycle,
    status,
    ...metadata,
    type: 'orchestration',
  });
}

/**
 * Log HTTP requests
 */
export function logHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  metadata?: Record<string, any>
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    durationMs,
    ...metadata,
    type: 'http_request',
  });
}

// Export default logger
export { logger };
export default logger;
