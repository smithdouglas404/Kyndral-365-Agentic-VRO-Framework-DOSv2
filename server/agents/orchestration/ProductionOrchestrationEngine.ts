/**
 * PRODUCTION-GRADE ORCHESTRATION ENGINE
 *
 * Enhanced with:
 * - Circuit breakers for agent failures
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Health checks and monitoring
 * - Performance metrics
 * - Graceful degradation
 */

import type { IStorage } from '../../storage.js';
import { UnifiedOrchestrationEngine, type AgentContext } from './UnifiedOrchestrationEngine.js';
import type { AgentMessage } from '../ContinuousOrchestrator.js';

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failures: 0,
    lastFailureTime: 0,
    successCount: 0,
  };

  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 60 seconds
  private readonly halfOpenMaxAttempts = 3;

  async execute<T>(operation: () => Promise<T>, context: string): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'OPEN') {
      const now = Date.now();
      if (now - this.state.lastFailureTime > this.timeout) {
        console.log(`[CircuitBreaker] ${context}: Transitioning to HALF_OPEN`);
        this.state.state = 'HALF_OPEN';
        this.state.successCount = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for ${context}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(context);
      throw error;
    }
  }

  private onSuccess(context: string): void {
    this.state.failures = 0;

    if (this.state.state === 'HALF_OPEN') {
      this.state.successCount++;
      if (this.state.successCount >= this.halfOpenMaxAttempts) {
        console.log(`[CircuitBreaker] ${context}: Transitioning to CLOSED`);
        this.state.state = 'CLOSED';
        this.state.successCount = 0;
      }
    }
  }

  private onFailure(context: string): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      console.error(`[CircuitBreaker] ${context}: OPENING circuit (${this.state.failures} failures)`);
      this.state.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class RetryHandler {
  private config: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  async execute<T>(
    operation: () => Promise<T>,
    context: string,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const finalConfig = { ...this.config, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[Retry] ${context}: Attempt ${attempt}/${finalConfig.maxAttempts} failed: ${error.message}`
        );

        if (attempt < finalConfig.maxAttempts) {
          const delay = Math.min(
            finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
            finalConfig.maxDelay
          );
          console.log(`[Retry] ${context}: Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed after ${finalConfig.maxAttempts} attempts`);
  }
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastSuccessfulExecution: number;
  consecutiveFailures: number;
  totalExecutions: number;
  totalFailures: number;
  averageExecutionTime: number;
  circuitBreakerState: CircuitBreakerState;
}

class HealthMonitor {
  private agentHealth: Map<string, AgentHealth> = new Map();
  private executionTimes: Map<string, number[]> = new Map();

  recordExecution(agentId: string, success: boolean, executionTime: number): void {
    let health = this.agentHealth.get(agentId);

    if (!health) {
      health = {
        agentId,
        status: 'healthy',
        lastSuccessfulExecution: Date.now(),
        consecutiveFailures: 0,
        totalExecutions: 0,
        totalFailures: 0,
        averageExecutionTime: 0,
        circuitBreakerState: {
          state: 'CLOSED',
          failures: 0,
          lastFailureTime: 0,
          successCount: 0,
        },
      };
    }

    health.totalExecutions++;

    if (success) {
      health.consecutiveFailures = 0;
      health.lastSuccessfulExecution = Date.now();
    } else {
      health.consecutiveFailures++;
      health.totalFailures++;
    }

    // Update average execution time
    const times = this.executionTimes.get(agentId) || [];
    times.push(executionTime);
    if (times.length > 100) times.shift(); // Keep last 100 samples
    this.executionTimes.set(agentId, times);

    health.averageExecutionTime = times.reduce((a, b) => a + b, 0) / times.length;

    // Determine health status
    if (health.consecutiveFailures >= 5) {
      health.status = 'unhealthy';
    } else if (health.consecutiveFailures >= 2) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }

    this.agentHealth.set(agentId, health);
  }

  getAgentHealth(agentId: string): AgentHealth | undefined {
    return this.agentHealth.get(agentId);
  }

  getAllHealth(): AgentHealth[] {
    return Array.from(this.agentHealth.values());
  }

  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    healthyAgents: number;
    degradedAgents: number;
    unhealthyAgents: number;
    totalAgents: number;
  } {
    const health = Array.from(this.agentHealth.values());
    const healthyCount = health.filter(h => h.status === 'healthy').length;
    const degradedCount = health.filter(h => h.status === 'degraded').length;
    const unhealthyCount = health.filter(h => h.status === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      healthyAgents: healthyCount,
      degradedAgents: degradedCount,
      unhealthyAgents: unhealthyCount,
      totalAgents: health.length,
    };
  }
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

interface PerformanceMetrics {
  totalOrchestrations: number;
  successfulOrchestrations: number;
  failedOrchestrations: number;
  averageOrchestrationTime: number;
  totalMessages: number;
  totalWorkflowTriggers: number;
  totalContextShares: number;
  uptime: number;
  startTime: number;
}

class MetricsCollector {
  private metrics: PerformanceMetrics;
  private orchestrationTimes: number[] = [];

  constructor() {
    this.metrics = {
      totalOrchestrations: 0,
      successfulOrchestrations: 0,
      failedOrchestrations: 0,
      averageOrchestrationTime: 0,
      totalMessages: 0,
      totalWorkflowTriggers: 0,
      totalContextShares: 0,
      uptime: 0,
      startTime: Date.now(),
    };
  }

  recordOrchestration(success: boolean, executionTime: number): void {
    this.metrics.totalOrchestrations++;
    if (success) {
      this.metrics.successfulOrchestrations++;
    } else {
      this.metrics.failedOrchestrations++;
    }

    this.orchestrationTimes.push(executionTime);
    if (this.orchestrationTimes.length > 1000) {
      this.orchestrationTimes.shift();
    }

    this.metrics.averageOrchestrationTime =
      this.orchestrationTimes.reduce((a, b) => a + b, 0) / this.orchestrationTimes.length;
  }

  recordMessage(): void {
    this.metrics.totalMessages++;
  }

  recordWorkflowTrigger(): void {
    this.metrics.totalWorkflowTriggers++;
  }

  recordContextShare(): void {
    this.metrics.totalContextShares++;
  }

  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
    };
  }
}

// ============================================================================
// PRODUCTION ORCHESTRATION ENGINE
// ============================================================================

export class ProductionOrchestrationEngine extends UnifiedOrchestrationEngine {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryHandler: RetryHandler = new RetryHandler();
  private healthMonitor: HealthMonitor = new HealthMonitor();
  private metricsCollector: MetricsCollector = new MetricsCollector();

  /**
   * Execute agent with circuit breaker and retry logic
   */
  async executeAgentSafely(
    agentId: string,
    agent: any,
    prompt: string,
    context: any
  ): Promise<any> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(agentId);
    const startTime = Date.now();

    try {
      const result = await circuitBreaker.execute(async () => {
        return await this.retryHandler.execute(
          async () => {
            if (typeof agent.execute !== 'function') {
              throw new Error(`Agent ${agentId} does not have execute method`);
            }
            return await agent.execute(prompt, context);
          },
          `Agent ${agentId}`,
          { maxAttempts: 2 } // Fewer retries for agents
        );
      }, agentId);

      const executionTime = Date.now() - startTime;
      this.healthMonitor.recordExecution(agentId, true, executionTime);
      this.metricsCollector.recordOrchestration(true, executionTime);

      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.healthMonitor.recordExecution(agentId, false, executionTime);
      this.metricsCollector.recordOrchestration(false, executionTime);

      console.error(`[ProductionOrchestration] Agent ${agentId} execution failed:`, error.message);

      // Return graceful degradation
      return {
        output: `Agent ${agentId} temporarily unavailable`,
        error: error.message,
        degraded: true,
      };
    }
  }

  /**
   * Share context with monitoring
   */
  async shareContextSafely(agentId: string, context: AgentContext): Promise<void> {
    try {
      await super.shareContext(agentId, context);
      this.metricsCollector.recordContextShare();
    } catch (error: any) {
      console.error(`[ProductionOrchestration] Context share failed for ${agentId}:`, error.message);
    }
  }

  /**
   * Send message with monitoring
   */
  async sendMessageSafely(
    from: string,
    to: string,
    message: string,
    projectId?: string
  ): Promise<void> {
    try {
      await super.sendMessage(from, to, message, projectId);
      this.metricsCollector.recordMessage();
    } catch (error: any) {
      console.error(`[ProductionOrchestration] Message send failed (${from} → ${to}):`, error.message);
    }
  }

  /**
   * Trigger workflow with monitoring
   */
  async triggerWorkflowSafely(agentId: string, event: string, data: any): Promise<void> {
    try {
      await super.triggerWorkflow(agentId, event, data);
      this.metricsCollector.recordWorkflowTrigger();
    } catch (error: any) {
      console.error(
        `[ProductionOrchestration] Workflow trigger failed (${agentId}.${event}):`,
        error.message
      );
    }
  }

  /**
   * Get or create circuit breaker for agent
   */
  private getOrCreateCircuitBreaker(agentId: string): CircuitBreaker {
    let breaker = this.circuitBreakers.get(agentId);
    if (!breaker) {
      breaker = new CircuitBreaker();
      this.circuitBreakers.set(agentId, breaker);
    }
    return breaker;
  }

  /**
   * Get agent health
   */
  getAgentHealth(agentId: string): AgentHealth | undefined {
    return this.healthMonitor.getAgentHealth(agentId);
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    return this.healthMonitor.getSystemHealth();
  }

  /**
   * Get all agent health
   */
  getAllAgentHealth(): AgentHealth[] {
    return this.healthMonitor.getAllHealth();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Reset circuit breaker for agent
   */
  resetCircuitBreaker(agentId: string): void {
    const breaker = this.circuitBreakers.get(agentId);
    if (breaker) {
      breaker.reset();
      console.log(`[ProductionOrchestration] Circuit breaker reset for ${agentId}`);
    }
  }

  /**
   * Get enhanced status
   */
  getEnhancedStatus() {
    return {
      ...super.getStatus(),
      systemHealth: this.getSystemHealth(),
      metrics: this.getMetrics(),
      agentHealth: this.getAllAgentHealth(),
    };
  }
}

/**
 * Factory function
 */
export function createProductionOrchestrationEngine(storage: IStorage): ProductionOrchestrationEngine {
  return new ProductionOrchestrationEngine(storage);
}
