/**
 * FALKOR GRAPH SERVICE
 *
 * Thin connection layer for FalkorDB (openCypher property-graph database
 * speaking the Redis protocol, queried via GRAPH.QUERY).
 *
 * Configuration (env):
 * - FALKORDB_URL    redis://host:port connection string (default redis://localhost:6379)
 * - FALKORDB_GRAPH  graph key name (default 'kyndral_ontology')
 *
 * Design notes:
 * - Lazy connect: nothing happens at import time, so the server never crashes
 *   on startup because FalkorDB is missing or unreachable.
 * - Single-flight connection with a retry cooldown so an unreachable instance
 *   doesn't add latency to every request.
 * - query() returns `null` when FalkorDB is not configured/unreachable so
 *   callers can degrade gracefully (e.g. fall back to Palantir/Postgres).
 */

import { FalkorDB, Graph } from 'falkordb';

export interface FalkorGraphStatus {
  configured: boolean;
  connected: boolean;
  url: string;
  graph: string;
  lastError: string | null;
}

const RETRY_COOLDOWN_MS = 30 * 1000;

class FalkorGraphServiceClass {
  private db: FalkorDB | null = null;
  private graph: Graph | null = null;
  private connecting: Promise<Graph | null> | null = null;
  private lastError: string | null = null;
  private lastFailedAttempt = 0;

  getUrl(): string {
    return process.env.FALKORDB_URL || 'redis://localhost:6379';
  }

  getGraphName(): string {
    return process.env.FALKORDB_GRAPH || 'kyndral_ontology';
  }

  /** True when FALKORDB_URL is explicitly set (env-gated rollout switch). */
  isConfigured(): boolean {
    return !!process.env.FALKORDB_URL;
  }

  /** True when a live connection has been established. */
  isConnected(): boolean {
    return this.graph !== null;
  }

  getStatus(): FalkorGraphStatus {
    return {
      configured: this.isConfigured(),
      connected: this.isConnected(),
      url: this.getUrl(),
      graph: this.getGraphName(),
      lastError: this.lastError,
    };
  }

  /**
   * Lazily connect and return the graph handle, or null when FalkorDB is
   * unreachable. Never throws.
   */
  private async getGraph(): Promise<Graph | null> {
    if (this.graph) return this.graph;

    // Cooldown after a failed attempt so we don't slow down every request
    if (this.lastFailedAttempt && Date.now() - this.lastFailedAttempt < RETRY_COOLDOWN_MS) {
      return null;
    }

    if (!this.connecting) {
      this.connecting = (async (): Promise<Graph | null> => {
        try {
          const db = await FalkorDB.connect({
            url: this.getUrl(),
            socket: { connectTimeout: 5000, reconnectStrategy: false },
          } as any);

          // Swallow async socket errors so they never crash the process
          if (typeof (db as any).on === 'function') {
            (db as any).on('error', (err: any) => {
              this.lastError = err?.message || String(err);
              console.error(`[FalkorGraphService] Connection error: ${this.lastError}`);
              this.db = null;
              this.graph = null;
              this.lastFailedAttempt = Date.now();
            });
          }

          this.db = db;
          this.graph = db.selectGraph(this.getGraphName());
          this.lastError = null;
          this.lastFailedAttempt = 0;
          console.log(
            `[FalkorGraphService] Connected to FalkorDB at ${this.getUrl()} (graph: ${this.getGraphName()})`
          );
          return this.graph;
        } catch (error: any) {
          this.lastError = error?.message || String(error);
          this.lastFailedAttempt = Date.now();
          this.db = null;
          this.graph = null;
          console.warn(
            `[FalkorGraphService] FalkorDB unreachable at ${this.getUrl()}: ${this.lastError}`
          );
          return null;
        } finally {
          this.connecting = null;
        }
      })();
    }

    return this.connecting;
  }

  /**
   * Run a parameterized openCypher query (GRAPH.QUERY).
   * Returns result rows, or `null` when FalkorDB is not configured/unreachable.
   * Never throws for connectivity problems; query syntax errors are logged
   * and reported as `null` as well so callers fall back gracefully.
   */
  async query<T = Record<string, any>>(
    cypher: string,
    params: Record<string, any> = {}
  ): Promise<T[] | null> {
    if (!this.isConfigured()) return null;

    const graph = await this.getGraph();
    if (!graph) return null;

    try {
      const reply = await graph.query<T>(cypher, { params: this.sanitizeParams(params) });
      return (reply?.data as T[]) ?? [];
    } catch (error: any) {
      this.lastError = error?.message || String(error);
      console.error(`[FalkorGraphService] Query failed: ${this.lastError}`);
      // Connection-level failures: drop handle so the next call reconnects
      if (/connect|socket|closed|ECONN|timeout/i.test(this.lastError || '')) {
        this.graph = null;
        this.db = null;
        this.lastFailedAttempt = Date.now();
      }
      return null;
    }
  }

  /** Lightweight connectivity check (RETURN 1). */
  async checkConnectivity(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const result = await this.query('RETURN 1 AS ok');
    return result !== null;
  }

  async close(): Promise<void> {
    try {
      if (this.db) await this.db.close();
    } catch {
      // ignore
    } finally {
      this.db = null;
      this.graph = null;
    }
  }

  /** FalkorDB params must be primitives / arrays / maps — no undefined or Date. */
  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      out[key] = this.sanitizeValue(value);
    }
    return out;
  }

  private sanitizeValue(value: any): any {
    if (value === undefined) return null;
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => this.sanitizeValue(v));
    if (typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) out[k] = this.sanitizeValue(v);
      return out;
    }
    if (typeof value === 'function' || typeof value === 'symbol') return null;
    return value;
  }
}

// Singleton (lazy — does not connect until first query)
export const FalkorGraphService = new FalkorGraphServiceClass();
