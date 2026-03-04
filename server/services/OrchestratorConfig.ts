/**
 * ORCHESTRATOR CONFIGURATION SERVICE
 *
 * Centralized configuration for the AI agent orchestrator.
 * Controls startup behavior, scan intervals, memory limits, and throttling.
 */

export interface OrchestratorSettings {
  // Enable/disable orchestrator
  enabled: boolean;

  // Delay after server ready before first scan (ms)
  startupDelayMs: number;

  // Interval between scan cycles (ms)
  scanIntervalMs: number;

  // Timeout for individual agent scans (ms)
  scanTimeoutMs: number;

  // Memory threshold percentage (0-100) - defer scans if exceeded
  memoryThresholdPercent: number;

  // Maximum concurrent scans (should always be 1 for safety)
  maxConcurrentScans: number;

  // Retry settings
  maxRetries: number;
  retryDelayMs: number;

  // Logging verbosity
  verbose: boolean;
}

/**
 * Get orchestrator settings from environment variables with defaults
 */
export function getOrchestratorSettings(): OrchestratorSettings {
  return {
    enabled: process.env.ORCHESTRATOR_ENABLED === 'true',
    startupDelayMs: parseInt(process.env.ORCHESTRATOR_STARTUP_DELAY_MS || '60000', 10),
    scanIntervalMs: parseInt(process.env.ORCHESTRATOR_SCAN_INTERVAL_MS || '300000', 10),
    scanTimeoutMs: parseInt(process.env.ORCHESTRATOR_SCAN_TIMEOUT_MS || '300000', 10),
    memoryThresholdPercent: parseInt(process.env.ORCHESTRATOR_MEMORY_THRESHOLD_PERCENT || '80', 10),
    maxConcurrentScans: 1, // Always 1 for safety
    maxRetries: parseInt(process.env.ORCHESTRATOR_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.ORCHESTRATOR_RETRY_DELAY_MS || '5000', 10),
    verbose: process.env.ORCHESTRATOR_VERBOSE === 'true',
  };
}

/**
 * Validate orchestrator settings
 */
export function validateSettings(settings: OrchestratorSettings): string[] {
  const errors: string[] = [];

  if (settings.startupDelayMs < 0) {
    errors.push('startupDelayMs must be >= 0');
  }

  if (settings.scanIntervalMs < 10000) {
    errors.push('scanIntervalMs must be >= 10000 (10 seconds)');
  }

  if (settings.scanTimeoutMs < 30000) {
    errors.push('scanTimeoutMs must be >= 30000 (30 seconds)');
  }

  if (settings.memoryThresholdPercent < 50 || settings.memoryThresholdPercent > 95) {
    errors.push('memoryThresholdPercent must be between 50 and 95');
  }

  return errors;
}

/**
 * Log orchestrator settings (for debugging)
 */
export function logSettings(settings: OrchestratorSettings): void {
  console.log('[Orchestrator] Configuration:');
  console.log(`  Enabled: ${settings.enabled}`);
  console.log(`  Startup Delay: ${settings.startupDelayMs}ms (${settings.startupDelayMs / 1000}s)`);
  console.log(`  Scan Interval: ${settings.scanIntervalMs}ms (${settings.scanIntervalMs / 1000}s)`);
  console.log(`  Scan Timeout: ${settings.scanTimeoutMs}ms (${settings.scanTimeoutMs / 1000}s)`);
  console.log(`  Memory Threshold: ${settings.memoryThresholdPercent}%`);
  console.log(`  Max Concurrent Scans: ${settings.maxConcurrentScans}`);
}

// Singleton instance
let cachedSettings: OrchestratorSettings | null = null;

/**
 * Get cached orchestrator settings (singleton pattern)
 */
export function getSettings(): OrchestratorSettings {
  if (!cachedSettings) {
    cachedSettings = getOrchestratorSettings();
    const errors = validateSettings(cachedSettings);
    if (errors.length > 0) {
      console.warn('[Orchestrator] Configuration warnings:', errors);
    }
  }
  return cachedSettings;
}

/**
 * Reset cached settings (for testing)
 */
export function resetSettings(): void {
  cachedSettings = null;
}
