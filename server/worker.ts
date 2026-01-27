/**
 * AGENT WORKER PROCESS
 *
 * Separate Node.js process that runs agents in isolation from the API server
 *
 * Benefits:
 * - If agents crash, API stays up
 * - Better resource management
 * - Agents can be restarted independently
 * - Horizontal scaling (run multiple workers)
 *
 * Run with: node dist/worker.cjs
 */

import { config } from 'dotenv';
config();

import { createAgentScheduler } from './agents/AgentScheduler.js';
import { DeepAgentOrchestrator } from './agents/deep/DeepAgentOrchestrator.js';
import { storage } from './storage.js';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

interface AgentJob {
  id: string;
  agent_type: string;
  task: string;
  context: any;
  retry_count: number;
  max_retries: number;
}

class AgentWorker {
  private scheduler: ReturnType<typeof createAgentScheduler>;
  private deepOrchestrator: DeepAgentOrchestrator;
  private pollIntervalMs: number;
  private isShuttingDown: boolean = false;
  private currentJobId: string | null = null;

  constructor(pollIntervalMs: number = 5000) {
    this.pollIntervalMs = pollIntervalMs;

    // Initialize agent scheduler (singleton)
    console.log('[Worker] Initializing agent scheduler...');
    this.scheduler = createAgentScheduler(storage);

    // Initialize deep agent orchestrator
    console.log('[Worker] Initializing deep agent orchestrator...');
    this.deepOrchestrator = new DeepAgentOrchestrator(storage);

    console.log('[Worker] Agent worker started');
    console.log(`[Worker] Polling for jobs every ${pollIntervalMs}ms`);
  }

  /**
   * Start the worker (main loop)
   */
  async start(): Promise<void> {
    console.log('[Worker] Starting job processing loop...\n');

    // Main worker loop
    while (!this.isShuttingDown) {
      try {
        await this.processNextJob();
      } catch (error: any) {
        console.error('[Worker] Error in main loop:', error.message);
      }

      // Wait before polling again
      await this.sleep(this.pollIntervalMs);
    }

    console.log('[Worker] Shutting down...');
  }

  /**
   * Process the next pending job from the queue
   */
  private async processNextJob(): Promise<void> {
    // Get next pending job (highest priority, oldest first)
    const result = await db.execute(sql`
      SELECT id, agent_type, task, context, retry_count, max_retries
      FROM agent_jobs
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (result.rows.length === 0) {
      // No jobs available
      return;
    }

    const job = result.rows[0] as unknown as AgentJob;
    this.currentJobId = job.id;

    console.log(`[Worker] Processing job ${job.id} (${job.agent_type}): ${job.task.substring(0, 50)}...`);

    try {
      // Mark job as running
      await db.execute(sql`
        UPDATE agent_jobs
        SET status = 'running', started_at = NOW()
        WHERE id = ${job.id}
      `);

      // Check if this is a deep agent or regular agent
      let jobResult: any;

      if (job.agent_type.startsWith('deep-')) {
        // Deep agent - use orchestrator
        console.log(`[Worker] Executing deep agent: ${job.agent_type}`);
        jobResult = await this.deepOrchestrator.runDeepAgent(
          job.agent_type,
          job.task,
          job.context
        );
      } else {
        // Regular agent - use scheduler
        const agent = this.scheduler.getAgentsMap().get(job.agent_type);
        if (!agent) {
          throw new Error(`Agent type '${job.agent_type}' not found`);
        }

        console.log(`[Worker] Executing regular agent: ${job.agent_type}`);
        jobResult = await agent.run(job.task, job.context);
      }

      // Mark job as completed
      await db.execute(sql`
        UPDATE agent_jobs
        SET
          status = 'completed',
          completed_at = NOW(),
          result = ${JSON.stringify(jobResult)}
        WHERE id = ${job.id}
      `);

      console.log(`[Worker] ✅ Job ${job.id} completed successfully\n`);
    } catch (error: any) {
      console.error(`[Worker] ❌ Job ${job.id} failed:`, error.message);

      // Check if we should retry
      const shouldRetry = job.retry_count < job.max_retries;

      if (shouldRetry) {
        // Retry the job
        await db.execute(sql`
          UPDATE agent_jobs
          SET
            status = 'pending',
            retry_count = retry_count + 1,
            error = ${error.message}
          WHERE id = ${job.id}
        `);

        console.log(`[Worker] 🔄 Job ${job.id} will be retried (attempt ${job.retry_count + 2}/${job.max_retries + 1})\n`);
      } else {
        // Mark as failed
        await db.execute(sql`
          UPDATE agent_jobs
          SET
            status = 'failed',
            completed_at = NOW(),
            error = ${error.message}
          WHERE id = ${job.id}
        `);

        console.log(`[Worker] 💀 Job ${job.id} failed permanently after ${job.retry_count + 1} attempts\n`);
      }
    } finally {
      this.currentJobId = null;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.currentJobId) {
      console.log(`[Worker] Waiting for current job ${this.currentJobId} to complete...`);

      // Mark current job as pending so another worker can pick it up
      await db.execute(sql`
        UPDATE agent_jobs
        SET status = 'pending', started_at = NULL
        WHERE id = ${this.currentJobId} AND status = 'running'
      `);
    }

    console.log('[Worker] Shutdown complete');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===================================================================
// Worker Process Entry Point
// ===================================================================

async function main() {
  const worker = new AgentWorker(5000); // Poll every 5 seconds

  // Handle graceful shutdown
  const shutdownHandler = async () => {
    console.log('\n[Worker] Received shutdown signal');
    await worker.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[Worker] UNCAUGHT EXCEPTION:', error);
    // Don't exit - let worker continue processing other jobs
  });

  process.on('unhandledRejection', (error) => {
    console.error('[Worker] UNHANDLED REJECTION:', error);
    // Don't exit - let worker continue processing other jobs
  });

  // Start the worker
  await worker.start();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[Worker] Fatal error:', error);
    process.exit(1);
  });
}

export { AgentWorker };
