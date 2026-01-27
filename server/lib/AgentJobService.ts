/**
 * AGENT JOB SERVICE
 *
 * Service for creating and managing agent jobs in the queue
 * Used by API routes to queue agent work instead of executing directly
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export interface CreateJobOptions {
  agentType: string;
  task: string;
  context?: Record<string, any>;
  priority?: number; // 1-10, higher = more urgent
  maxRetries?: number;
}

export interface AgentJob {
  id: string;
  agent_type: string;
  task: string;
  context: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  result: any;
  error: string | null;
  retry_count: number;
  max_retries: number;
}

export class AgentJobService {
  /**
   * Create a new agent job
   */
  static async createJob(options: CreateJobOptions): Promise<string> {
    const {
      agentType,
      task,
      context = {},
      priority = 5,
      maxRetries = 3
    } = options;

    const result = await db.execute(sql`
      INSERT INTO agent_jobs (
        agent_type,
        task,
        context,
        priority,
        max_retries,
        status
      ) VALUES (
        ${agentType},
        ${task},
        ${JSON.stringify(context)},
        ${priority},
        ${maxRetries},
        'pending'
      )
      RETURNING id
    `);

    const jobId = (result.rows[0] as any).id;

    console.log(`[AgentJobService] Created job ${jobId} for ${agentType}`);

    return jobId;
  }

  /**
   * Get job by ID
   */
  static async getJob(jobId: string): Promise<AgentJob | null> {
    const result = await db.execute(sql`
      SELECT
        id::text,
        agent_type,
        task,
        context,
        status,
        priority,
        created_at,
        started_at,
        completed_at,
        result,
        error,
        retry_count,
        max_retries
      FROM agent_jobs
      WHERE id = ${jobId}
    `);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as unknown as AgentJob;
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId: string): Promise<string | null> {
    const result = await db.execute(sql`
      SELECT status
      FROM agent_jobs
      WHERE id = ${jobId}
    `);

    if (result.rows.length === 0) {
      return null;
    }

    return (result.rows[0] as any).status;
  }

  /**
   * Wait for job completion (polling)
   */
  static async waitForJob(
    jobId: string,
    options: {
      timeoutMs?: number;
      pollIntervalMs?: number;
    } = {}
  ): Promise<AgentJob> {
    const { timeoutMs = 300000, pollIntervalMs = 1000 } = options; // 5 min timeout, 1 sec poll
    const startTime = Date.now();

    while (true) {
      const job = await this.getJob(jobId);

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Check if completed
      if (job.status === 'completed') {
        return job;
      }

      // Check if failed
      if (job.status === 'failed') {
        throw new Error(`Job failed: ${job.error}`);
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  /**
   * Get pending jobs count
   */
  static async getPendingJobsCount(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM agent_jobs
      WHERE status = 'pending'
    `);

    return parseInt((result.rows[0] as any).count);
  }

  /**
   * Get jobs by status
   */
  static async getJobsByStatus(
    status: 'pending' | 'running' | 'completed' | 'failed',
    limit: number = 50
  ): Promise<AgentJob[]> {
    const result = await db.execute(sql`
      SELECT
        id::text,
        agent_type,
        task,
        context,
        status,
        priority,
        created_at,
        started_at,
        completed_at,
        result,
        error,
        retry_count,
        max_retries
      FROM agent_jobs
      WHERE status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return result.rows as unknown as AgentJob[];
  }

  /**
   * Cancel a pending job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    const result = await db.execute(sql`
      UPDATE agent_jobs
      SET status = 'failed', error = 'Cancelled by user', completed_at = NOW()
      WHERE id = ${jobId} AND status = 'pending'
      RETURNING id
    `);

    return result.rows.length > 0;
  }

  /**
   * Retry a failed job
   */
  static async retryJob(jobId: string): Promise<boolean> {
    const result = await db.execute(sql`
      UPDATE agent_jobs
      SET
        status = 'pending',
        error = NULL,
        started_at = NULL,
        completed_at = NULL,
        retry_count = 0
      WHERE id = ${jobId} AND status = 'failed'
      RETURNING id
    `);

    return result.rows.length > 0;
  }

  /**
   * Clean up old completed/failed jobs
   */
  static async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    const result = await db.execute(sql`
      DELETE FROM agent_jobs
      WHERE status IN ('completed', 'failed')
        AND completed_at < NOW() - INTERVAL '${sql.raw(olderThanDays.toString())} days'
      RETURNING id
    `);

    const deletedCount = result.rows.length;
    console.log(`[AgentJobService] Cleaned up ${deletedCount} old jobs`);

    return deletedCount;
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const result = await db.execute(sql`
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(*) as total
      FROM agent_jobs
    `);

    const row = result.rows[0] as any;

    return {
      pending: parseInt(row.pending),
      running: parseInt(row.running),
      completed: parseInt(row.completed),
      failed: parseInt(row.failed),
      total: parseInt(row.total)
    };
  }
}
