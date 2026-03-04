/**
 * ORCHESTRATOR SERVICE
 *
 * Manages AI agent scan cycles with proper safeguards:
 * - Waits for server to be fully ready
 * - Applies configurable startup delay
 * - Runs scans sequentially (one at a time)
 * - Monitors memory and defers if threshold exceeded
 * - Handles timeouts and retries gracefully
 */

import { EventEmitter } from 'events';
import { getSettings, logSettings, OrchestratorSettings } from './OrchestratorConfig.js';
import { serverReadyService } from './ServerReadyService.js';
import { memoryMonitorService } from './MemoryMonitorService.js';

export interface AgentScanRequest {
  agentId: string;
  agentName: string;
  priority: number;
  requestedAt: number;
}

export interface ScanResult {
  agentId: string;
  success: boolean;
  duration: number;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface OrchestratorState {
  initialized: boolean;
  running: boolean;
  currentScan: AgentScanRequest | null;
  pendingScans: AgentScanRequest[];
  completedScans: number;
  failedScans: number;
  skippedScans: number;
  lastScanTime: number;
  nextScanTime: number;
}

type ScanHandler = (agentId: string) => Promise<void>;

class OrchestratorServiceImpl extends EventEmitter {
  private settings: OrchestratorSettings;
  private state: OrchestratorState = {
    initialized: false,
    running: false,
    currentScan: null,
    pendingScans: [],
    completedScans: 0,
    failedScans: 0,
    skippedScans: 0,
    lastScanTime: 0,
    nextScanTime: 0,
  };

  private scanHandler: ScanHandler | null = null;
  private scanInterval: NodeJS.Timeout | null = null;
  private startupTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.settings = getSettings();
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(scanHandler: ScanHandler): Promise<boolean> {
    if (this.state.initialized) {
      console.log('[Orchestrator] Already initialized');
      return true;
    }

    this.scanHandler = scanHandler;
    this.settings = getSettings();

    console.log('[Orchestrator] Initializing...');
    logSettings(this.settings);

    if (!this.settings.enabled) {
      console.log('[Orchestrator] Disabled via configuration');
      return false;
    }

    // Wait for server to be ready
    console.log('[Orchestrator] Waiting for server to be ready...');
    const ready = await serverReadyService.waitForReady(120000);

    if (!ready) {
      console.error('[Orchestrator] Server did not become ready in time');
      return false;
    }

    console.log(`[Orchestrator] Server ready. Waiting ${this.settings.startupDelayMs}ms before starting scans...`);

    // Apply startup delay
    await this.delay(this.settings.startupDelayMs);

    this.state.initialized = true;
    console.log('[Orchestrator] Initialized and ready to start');

    return true;
  }

  /**
   * Start the orchestrator scan cycle
   */
  start(): void {
    if (!this.state.initialized) {
      console.error('[Orchestrator] Cannot start - not initialized');
      return;
    }

    if (this.state.running) {
      console.log('[Orchestrator] Already running');
      return;
    }

    this.state.running = true;
    console.log(`[Orchestrator] Starting scan cycle (interval: ${this.settings.scanIntervalMs}ms)`);

    // Run first scan immediately (after startup delay already applied)
    this.runScanCycle();

    // Schedule regular scan cycles
    this.scanInterval = setInterval(() => {
      this.runScanCycle();
    }, this.settings.scanIntervalMs);

    this.emit('started');
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    if (!this.state.running) {
      return;
    }

    console.log('[Orchestrator] Stopping...');

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.startupTimeout) {
      clearTimeout(this.startupTimeout);
      this.startupTimeout = null;
    }

    this.state.running = false;
    this.emit('stopped');
    console.log('[Orchestrator] Stopped');
  }

  /**
   * Run a scan cycle for all agents
   */
  private async runScanCycle(): Promise<void> {
    // Check if already processing
    if (this.state.currentScan) {
      console.log('[Orchestrator] Scan already in progress, skipping cycle');
      return;
    }

    // Check memory before starting
    const memCheck = memoryMonitorService.checkMemory(this.settings.memoryThresholdPercent);
    if (!memCheck.canProceed) {
      console.warn(`[Orchestrator] Deferring scan: ${memCheck.reason}`);
      this.state.skippedScans++;
      memoryMonitorService.forceGC();
      return;
    }

    console.log('[Orchestrator] Starting scan cycle...');
    memoryMonitorService.logStatus();

    // Get list of agents to scan (this would typically come from the database)
    const agents = await this.getAgentsToScan();

    for (const agent of agents) {
      await this.runAgentScan(agent);

      // Brief pause between agents to allow GC
      await this.delay(1000);

      // Re-check memory between agents
      const midCheck = memoryMonitorService.checkMemory(this.settings.memoryThresholdPercent);
      if (!midCheck.canProceed) {
        console.warn(`[Orchestrator] Pausing scan cycle: ${midCheck.reason}`);
        memoryMonitorService.forceGC();
        await this.delay(5000);
      }
    }

    this.state.lastScanTime = Date.now();
    this.state.nextScanTime = Date.now() + this.settings.scanIntervalMs;
    console.log('[Orchestrator] Scan cycle complete');
  }

  /**
   * Run a single agent scan with timeout
   */
  private async runAgentScan(request: AgentScanRequest): Promise<ScanResult> {
    if (!this.scanHandler) {
      return {
        agentId: request.agentId,
        success: false,
        duration: 0,
        error: 'No scan handler configured',
      };
    }

    this.state.currentScan = request;
    const startTime = Date.now();

    console.log(`[Orchestrator] Scanning agent: ${request.agentName} (${request.agentId})`);

    try {
      // Run scan with timeout
      await Promise.race([
        this.scanHandler(request.agentId),
        this.timeout(this.settings.scanTimeoutMs, `Scan timeout for ${request.agentId}`),
      ]);

      const duration = Date.now() - startTime;
      this.state.completedScans++;

      console.log(`[Orchestrator] Scan complete: ${request.agentName} (${duration}ms)`);

      this.state.currentScan = null;
      return {
        agentId: request.agentId,
        success: true,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.state.failedScans++;

      console.error(`[Orchestrator] Scan failed: ${request.agentName} - ${error.message}`);

      this.state.currentScan = null;
      return {
        agentId: request.agentId,
        success: false,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Get list of agents to scan
   * Override this or provide agents via queue
   */
  private async getAgentsToScan(): Promise<AgentScanRequest[]> {
    // Default list of core agents
    const coreAgents = [
      'finops',
      'tmo',
      'risk',
      'pmo',
      'governance',
      'vro',
      'planning',
      'okr',
    ];

    return coreAgents.map((id, index) => ({
      agentId: id,
      agentName: id.charAt(0).toUpperCase() + id.slice(1),
      priority: index,
      requestedAt: Date.now(),
    }));
  }

  /**
   * Queue a specific agent for scanning
   */
  queueScan(request: AgentScanRequest): void {
    // Check for duplicates
    const exists = this.state.pendingScans.some((r) => r.agentId === request.agentId);
    if (!exists) {
      this.state.pendingScans.push(request);
      this.state.pendingScans.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * Get current orchestrator state
   */
  getState(): OrchestratorState {
    return { ...this.state };
  }

  /**
   * Helper: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper: timeout promise
   */
  private timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Reset orchestrator (for testing)
   */
  reset(): void {
    this.stop();
    this.state = {
      initialized: false,
      running: false,
      currentScan: null,
      pendingScans: [],
      completedScans: 0,
      failedScans: 0,
      skippedScans: 0,
      lastScanTime: 0,
      nextScanTime: 0,
    };
    this.scanHandler = null;
  }
}

// Singleton instance
export const orchestratorService = new OrchestratorServiceImpl();
