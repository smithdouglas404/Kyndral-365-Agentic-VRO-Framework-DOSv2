/**
 * DEMO MODE DETECTION
 *
 * Centralized function to check if system is in demo mode
 * All fake/mock data should be gated behind this check
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo';
}

export function requireProduction(action: string): void {
  if (isDemoMode()) {
    throw new Error(`${action} is not available in demo mode`);
  }
}

export function getDemoData<T>(demoData: T, productionData: T): T {
  return isDemoMode() ? demoData : productionData;
}
