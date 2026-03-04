/**
 * SERVER READY SERVICE
 *
 * Tracks server initialization state and provides a gate for services
 * that should wait until the server is fully ready before starting.
 */

import { EventEmitter } from 'events';

export interface ServerReadyState {
  portBound: boolean;
  viteReady: boolean;
  dbConnected: boolean;
  seedsComplete: boolean;
  mcpReady: boolean;
  routesRegistered: boolean;
  timestamp: number;
}

class ServerReadyServiceImpl extends EventEmitter {
  private state: ServerReadyState = {
    portBound: false,
    viteReady: false,
    dbConnected: false,
    seedsComplete: false,
    mcpReady: false,
    routesRegistered: false,
    timestamp: 0,
  };

  private readyPromiseResolve: (() => void) | null = null;
  private readyPromise: Promise<void>;

  constructor() {
    super();
    this.readyPromise = new Promise((resolve) => {
      this.readyPromiseResolve = resolve;
    });
  }

  /**
   * Check if server is fully ready
   */
  isFullyReady(): boolean {
    return (
      this.state.portBound &&
      this.state.dbConnected &&
      this.state.routesRegistered
      // viteReady and seedsComplete are optional (may not apply in production)
    );
  }

  /**
   * Get current ready state
   */
  getState(): ServerReadyState {
    return { ...this.state };
  }

  /**
   * Wait for server to be fully ready
   */
  async waitForReady(timeoutMs: number = 120000): Promise<boolean> {
    if (this.isFullyReady()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[ServerReady] Timeout waiting for server ready');
        resolve(false);
      }, timeoutMs);

      this.readyPromise.then(() => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  /**
   * Mark port as bound
   */
  setPortBound(): void {
    this.state.portBound = true;
    console.log('[ServerReady] Port bound');
    this.checkReady();
  }

  /**
   * Mark Vite as ready
   */
  setViteReady(): void {
    this.state.viteReady = true;
    console.log('[ServerReady] Vite ready');
    this.checkReady();
  }

  /**
   * Mark database as connected
   */
  setDbConnected(): void {
    this.state.dbConnected = true;
    console.log('[ServerReady] Database connected');
    this.checkReady();
  }

  /**
   * Mark seeds as complete
   */
  setSeedsComplete(): void {
    this.state.seedsComplete = true;
    console.log('[ServerReady] Seeds complete');
    this.checkReady();
  }

  /**
   * Mark MCP services as ready
   */
  setMcpReady(): void {
    this.state.mcpReady = true;
    console.log('[ServerReady] MCP services ready');
    this.checkReady();
  }

  /**
   * Mark routes as registered
   */
  setRoutesRegistered(): void {
    this.state.routesRegistered = true;
    console.log('[ServerReady] Routes registered');
    this.checkReady();
  }

  /**
   * Check if all required components are ready and emit event
   */
  private checkReady(): void {
    if (this.isFullyReady() && this.state.timestamp === 0) {
      this.state.timestamp = Date.now();
      console.log('[ServerReady] Server is FULLY READY');
      this.emit('ready', this.state);
      if (this.readyPromiseResolve) {
        this.readyPromiseResolve();
      }
    }
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.state = {
      portBound: false,
      viteReady: false,
      dbConnected: false,
      seedsComplete: false,
      mcpReady: false,
      routesRegistered: false,
      timestamp: 0,
    };
    this.readyPromise = new Promise((resolve) => {
      this.readyPromiseResolve = resolve;
    });
  }

  /**
   * Get time since server became ready (ms)
   */
  getUptime(): number {
    if (this.state.timestamp === 0) {
      return 0;
    }
    return Date.now() - this.state.timestamp;
  }

  /**
   * Log current state
   */
  logState(): void {
    console.log('[ServerReady] Current state:');
    console.log(`  Port Bound: ${this.state.portBound}`);
    console.log(`  Vite Ready: ${this.state.viteReady}`);
    console.log(`  DB Connected: ${this.state.dbConnected}`);
    console.log(`  Seeds Complete: ${this.state.seedsComplete}`);
    console.log(`  MCP Ready: ${this.state.mcpReady}`);
    console.log(`  Routes Registered: ${this.state.routesRegistered}`);
    console.log(`  Fully Ready: ${this.isFullyReady()}`);
  }
}

// Singleton instance
export const serverReadyService = new ServerReadyServiceImpl();
