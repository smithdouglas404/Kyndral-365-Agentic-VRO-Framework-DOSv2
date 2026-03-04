/**
 * MEMORY MONITOR SERVICE
 *
 * Monitors memory usage and provides throttling decisions
 * for memory-intensive operations like AI agent scans.
 */

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  heapUsedMB: number;
  heapTotalMB: number;
  usagePercent: number;
  rss: number;
  rssMB: number;
  external: number;
  arrayBuffers: number;
}

export interface MemoryCheck {
  canProceed: boolean;
  stats: MemoryStats;
  reason?: string;
}

class MemoryMonitorServiceImpl {
  private lastCheck: MemoryStats | null = null;
  private checkHistory: MemoryStats[] = [];
  private maxHistorySize = 60; // Keep last 60 readings

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats {
    const usage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      usagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      rss: usage.rss,
      rssMB: Math.round(usage.rss / 1024 / 1024),
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
    };

    this.lastCheck = stats;
    this.checkHistory.push(stats);
    if (this.checkHistory.length > this.maxHistorySize) {
      this.checkHistory.shift();
    }

    return stats;
  }

  /**
   * Check if memory usage is below threshold
   */
  checkMemory(thresholdPercent: number = 80): MemoryCheck {
    const stats = this.getStats();

    if (stats.usagePercent >= thresholdPercent) {
      return {
        canProceed: false,
        stats,
        reason: `Memory usage (${stats.usagePercent}%) exceeds threshold (${thresholdPercent}%)`,
      };
    }

    // Also check RSS (total process memory)
    const rssThresholdMB = 1500; // 1.5GB RSS threshold
    if (stats.rssMB >= rssThresholdMB) {
      return {
        canProceed: false,
        stats,
        reason: `RSS memory (${stats.rssMB}MB) exceeds threshold (${rssThresholdMB}MB)`,
      };
    }

    return {
      canProceed: true,
      stats,
    };
  }

  /**
   * Force garbage collection if available (requires --expose-gc flag)
   */
  forceGC(): boolean {
    if (global.gc) {
      console.log('[MemoryMonitor] Forcing garbage collection...');
      const before = this.getStats();
      global.gc();
      const after = this.getStats();
      console.log(
        `[MemoryMonitor] GC complete: ${before.heapUsedMB}MB -> ${after.heapUsedMB}MB (freed ${before.heapUsedMB - after.heapUsedMB}MB)`
      );
      return true;
    }
    return false;
  }

  /**
   * Get average memory usage over recent checks
   */
  getAverageUsage(): number {
    if (this.checkHistory.length === 0) {
      return 0;
    }
    const sum = this.checkHistory.reduce((acc, s) => acc + s.usagePercent, 0);
    return Math.round(sum / this.checkHistory.length);
  }

  /**
   * Check if memory is trending upward
   */
  isMemoryTrendingUp(): boolean {
    if (this.checkHistory.length < 5) {
      return false;
    }

    const recent = this.checkHistory.slice(-5);
    let increasing = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].heapUsed > recent[i - 1].heapUsed) {
        increasing++;
      }
    }
    return increasing >= 4; // 4 out of 5 readings increasing
  }

  /**
   * Log current memory status
   */
  logStatus(): void {
    const stats = this.getStats();
    console.log('[MemoryMonitor] Memory Status:');
    console.log(`  Heap: ${stats.heapUsedMB}MB / ${stats.heapTotalMB}MB (${stats.usagePercent}%)`);
    console.log(`  RSS: ${stats.rssMB}MB`);
    console.log(`  Avg Usage: ${this.getAverageUsage()}%`);
    console.log(`  Trending Up: ${this.isMemoryTrendingUp()}`);
  }

  /**
   * Get last check result
   */
  getLastCheck(): MemoryStats | null {
    return this.lastCheck;
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(): void {
    this.checkHistory = [];
    this.lastCheck = null;
  }
}

// Singleton instance
export const memoryMonitorService = new MemoryMonitorServiceImpl();
