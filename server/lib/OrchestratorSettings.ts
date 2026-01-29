/**
 * ORCHESTRATOR SETTINGS
 * 
 * Persistent settings for the continuous orchestrator.
 * Default: OFF until admin enables it.
 * 
 * Version: 2.0.0
 * Date: 2026-01-29
 */

import { db } from '../db.js';
import { appConfig } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const ORCHESTRATOR_ENABLED_KEY = 'orchestrator_enabled';
const ORCHESTRATOR_INTERVAL_KEY = 'orchestrator_interval';
const OPENROUTER_CONFIGURED_KEY = 'openrouter_configured';

export interface OrchestratorSettings {
  enabled: boolean;
  interval: number; // milliseconds
  openRouterConfigured: boolean;
}

/**
 * Get orchestrator settings from database
 * DEFAULT: OFF until admin enables
 */
export async function getOrchestratorSettings(): Promise<OrchestratorSettings> {
  try {
    const [enabledRow] = await db.select()
      .from(appConfig)
      .where(eq(appConfig.configKey, ORCHESTRATOR_ENABLED_KEY))
      .limit(1);

    const [intervalRow] = await db.select()
      .from(appConfig)
      .where(eq(appConfig.configKey, ORCHESTRATOR_INTERVAL_KEY))
      .limit(1);

    return {
      enabled: enabledRow?.configValue === 'true',
      interval: intervalRow ? parseInt(intervalRow.configValue) : 60000,
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    };
  } catch (error) {
    console.error('[OrchestratorSettings] Error getting settings:', error);
    return {
      enabled: false, // Default OFF
      interval: 60000,
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    };
  }
}

/**
 * Update orchestrator enabled setting
 */
export async function setOrchestratorEnabled(enabled: boolean): Promise<void> {
  try {
    const [existing] = await db.select()
      .from(appConfig)
      .where(eq(appConfig.configKey, ORCHESTRATOR_ENABLED_KEY))
      .limit(1);

    if (existing) {
      await db.update(appConfig)
        .set({ 
          configValue: enabled ? 'true' : 'false',
          updatedAt: new Date(),
        })
        .where(eq(appConfig.configKey, ORCHESTRATOR_ENABLED_KEY));
    } else {
      await db.insert(appConfig).values({
        configKey: ORCHESTRATOR_ENABLED_KEY,
        configValue: enabled ? 'true' : 'false',
        description: 'Enable/disable continuous agent orchestration',
        category: 'orchestrator',
      });
    }

    console.log(`[OrchestratorSettings] Orchestrator ${enabled ? 'ENABLED' : 'DISABLED'}`);
  } catch (error) {
    console.error('[OrchestratorSettings] Error setting enabled:', error);
    throw error;
  }
}

/**
 * Update orchestrator interval
 */
export async function setOrchestratorInterval(intervalMs: number): Promise<void> {
  try {
    // Minimum 30 seconds to prevent credit burn
    const safeInterval = Math.max(30000, intervalMs);

    const [existing] = await db.select()
      .from(appConfig)
      .where(eq(appConfig.configKey, ORCHESTRATOR_INTERVAL_KEY))
      .limit(1);

    if (existing) {
      await db.update(appConfig)
        .set({ 
          configValue: safeInterval.toString(),
          updatedAt: new Date(),
        })
        .where(eq(appConfig.configKey, ORCHESTRATOR_INTERVAL_KEY));
    } else {
      await db.insert(appConfig).values({
        configKey: ORCHESTRATOR_INTERVAL_KEY,
        configValue: safeInterval.toString(),
        description: 'Continuous orchestration interval in milliseconds',
        category: 'orchestrator',
      });
    }

    console.log(`[OrchestratorSettings] Interval set to ${safeInterval}ms`);
  } catch (error) {
    console.error('[OrchestratorSettings] Error setting interval:', error);
    throw error;
  }
}

/**
 * Check if OpenRouter is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Get cost optimization status
 */
export function getCostOptimizationStatus(): {
  openRouterEnabled: boolean;
  anthropicEnabled: boolean;
  preferredTier: string;
} {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  return {
    openRouterEnabled: hasOpenRouter,
    anthropicEnabled: hasAnthropic,
    preferredTier: hasOpenRouter ? 'OpenRouter (cost-optimized)' : 'Anthropic (premium)',
  };
}
