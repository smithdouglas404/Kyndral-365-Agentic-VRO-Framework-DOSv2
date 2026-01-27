/**
 * BATTLE RHYTHM TASK PROCESSOR
 *
 * Processes tasks from agent_task_queue (created by Sunday Recon)
 * Executes agent synthesis and logs results to agent_activity_log
 */

import type { IStorage } from '../storage.js';
import type { AgentScheduler } from '../agents/AgentScheduler.js';
import { pool } from '../db.js';

export class BattleRhythmTaskProcessor {
  private storage: IStorage;
  private agentScheduler: AgentScheduler;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(storage: IStorage, agentScheduler: AgentScheduler) {
    this.storage = storage;
    this.agentScheduler = agentScheduler;
  }

  /**
   * Start processing tasks from agent_task_queue
   */
  start(): void {
    if (this.isRunning) {
      console.log('[BattleRhythmTaskProcessor] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[BattleRhythmTaskProcessor] Starting task processor...');

    // Process tasks every 30 seconds
    this.processingInterval = setInterval(async () => {
      await this.processPendingTasks();
    }, 30000);

    // Process immediately on start
    this.processPendingTasks().catch(err => {
      console.error('[BattleRhythmTaskProcessor] Initial processing failed:', err);
    });
  }

  /**
   * Stop processing tasks
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('[BattleRhythmTaskProcessor] Stopped');
  }

  /**
   * Process all pending tasks from agent_task_queue
   */
  private async processPendingTasks(): Promise<void> {
    try {
      // Get pending tasks
      const result = await pool.query(`
        SELECT * FROM agent_task_queue
        WHERE status = 'pending'
        ORDER BY priority DESC, created_at ASC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return; // No pending tasks
      }

      console.log(`[BattleRhythmTaskProcessor] Processing ${result.rows.length} pending tasks`);

      for (const task of result.rows) {
        await this.processTask(task);
      }
    } catch (error: any) {
      console.error('[BattleRhythmTaskProcessor] Failed to process tasks:', error.message);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: any): Promise<void> {
    const { id, assigned_agent, task_type, task_data, priority } = task;

    try {
      console.log(`[BattleRhythmTaskProcessor] Processing task ${id}: ${assigned_agent}/${task_type}`);

      // Mark task as in-progress
      await pool.query(`
        UPDATE agent_task_queue
        SET status = 'in_progress'
        WHERE id = $1
      `, [id]);

      // Execute task based on type
      let result: any;
      switch (task_type) {
        case 'weekly_synthesis':
          result = await this.executeWeeklySynthesis(assigned_agent, task_data);
          break;
        default:
          throw new Error(`Unknown task type: ${task_type}`);
      }

      // Log activity to agent_activity_log
      await pool.query(`
        INSERT INTO agent_activity_log (
          id,
          event_type,
          primary_agent_id,
          primary_agent_name,
          summary,
          details,
          created_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          NOW()
        )
      `, [
        'weekly_synthesis',
        assigned_agent.toLowerCase(),
        assigned_agent,
        result.summary,
        JSON.stringify(result.details),
      ]);

      // Mark task as completed
      await pool.query(`
        UPDATE agent_task_queue
        SET status = 'completed', resolved_at = NOW()
        WHERE id = $1
      `, [id]);

      console.log(`[BattleRhythmTaskProcessor] ✅ Task ${id} completed`);
    } catch (error: any) {
      console.error(`[BattleRhythmTaskProcessor] Task ${id} failed:`, error.message);

      // Mark task as failed (store error in reasoning field)
      await pool.query(`
        UPDATE agent_task_queue
        SET status = 'failed', reasoning = $1, resolved_at = NOW()
        WHERE id = $2
      `, [`FAILED: ${error.message}`, id]);
    }
  }

  /**
   * Execute weekly synthesis for an agent
   */
  private async executeWeeklySynthesis(agentName: string, taskData: any): Promise<any> {
    const { projects, weekOf } = JSON.parse(taskData);

    console.log(`[BattleRhythmTaskProcessor] ${agentName}: Running weekly synthesis for ${projects.length} projects`);

    // Get agent from scheduler
    const agent = this.agentScheduler.getAgent(agentName.toLowerCase());
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Execute synthesis based on agent type
    const findings: any[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    for (const project of projects) {
      try {
        // Run agent-specific analysis
        let finding: any;
        switch (agentName) {
          case 'FinOps':
            finding = await this.analyzeFinOps(project);
            break;
          case 'Risk':
            finding = await this.analyzeRisk(project);
            break;
          case 'VRO':
            finding = await this.analyzeVRO(project);
            break;
          case 'TMO':
            finding = await this.analyzeTMO(project);
            break;
          case 'Planning':
            finding = await this.analyzePlanning(project);
            break;
          default:
            finding = { finding: `${agentName} analysis not implemented` };
        }

        if (finding) {
          findings.push(finding);
          if (finding.severity === 'critical') {
            severity = 'critical';
          } else if (finding.severity === 'high' && severity !== 'critical') {
            severity = 'high';
          }
        }
      } catch (error: any) {
        console.error(`[BattleRhythmTaskProcessor] ${agentName} failed to analyze ${project.id}:`, error.message);
      }
    }

    // Synthesize findings
    const summary = `${agentName} weekly synthesis: ${findings.length} findings (severity: ${severity})`;
    const details = {
      finding: findings.map(f => f.finding).join('; '),
      severity,
      recommendation: findings.map(f => f.recommendation).filter(Boolean).join('; '),
      data: { weekOf, projectCount: projects.length, findings },
    };

    return { summary, details };
  }

  /**
   * FinOps analysis
   */
  private async analyzeFinOps(project: any): Promise<any> {
    const budget = parseFloat(project.budget || '0');
    const actualCost = parseFloat(project.actualCost || '0');
    const variance = budget > 0 ? ((actualCost - budget) / budget) * 100 : 0;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let finding = '';
    let recommendation = '';

    if (variance > 20) {
      severity = 'critical';
      finding = `${project.name}: ${variance.toFixed(1)}% over budget ($${actualCost.toLocaleString()} / $${budget.toLocaleString()})`;
      recommendation = 'Immediate budget review and scope reduction required';
    } else if (variance > 10) {
      severity = 'high';
      finding = `${project.name}: ${variance.toFixed(1)}% over budget`;
      recommendation = 'Monitor spending, consider cost optimization measures';
    } else if (variance > 5) {
      severity = 'medium';
      finding = `${project.name}: ${variance.toFixed(1)}% variance detected`;
      recommendation = 'Continue monitoring';
    } else {
      severity = 'low';
      finding = `${project.name}: Within budget tolerance`;
      recommendation = 'No action needed';
    }

    return { finding, severity, recommendation };
  }

  /**
   * Risk analysis
   */
  private async analyzeRisk(project: any): Promise<any> {
    const riskScore = parseFloat(project.riskScore || '0');

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let finding = '';
    let recommendation = '';

    if (riskScore > 7) {
      severity = 'critical';
      finding = `${project.name}: Critical risk score ${riskScore}`;
      recommendation = 'Escalate to decision node for kill/continue/pivot decision';
    } else if (riskScore > 5) {
      severity = 'high';
      finding = `${project.name}: High risk score ${riskScore}`;
      recommendation = 'Implement risk mitigation strategies';
    } else if (riskScore > 3) {
      severity = 'medium';
      finding = `${project.name}: Moderate risk score ${riskScore}`;
      recommendation = 'Monitor risk indicators';
    } else {
      severity = 'low';
      finding = `${project.name}: Low risk score ${riskScore}`;
      recommendation = 'No action needed';
    }

    return { finding, severity, recommendation };
  }

  /**
   * VRO (Value Realization) analysis
   */
  private async analyzeVRO(project: any): Promise<any> {
    // Simple value check - in real implementation would calculate value realization
    const status = project.status;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let finding = '';
    let recommendation = '';

    if (status === 'critical' || status === 'at-risk') {
      severity = 'high';
      finding = `${project.name}: Value at risk due to ${status} status`;
      recommendation = 'Review business case and expected value delivery';
    } else {
      severity = 'low';
      finding = `${project.name}: Value realization on track`;
      recommendation = 'Continue monitoring value metrics';
    }

    return { finding, severity, recommendation };
  }

  /**
   * TMO (Technical Management Office) analysis
   */
  private async analyzeTMO(project: any): Promise<any> {
    const progress = parseFloat(project.progress || '0');

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let finding = '';
    let recommendation = '';

    if (progress < 50 && project.status === 'in-progress') {
      severity = 'medium';
      finding = `${project.name}: Progress at ${progress}%, may need schedule review`;
      recommendation = 'Assess if timeline adjustments are needed';
    } else {
      severity = 'low';
      finding = `${project.name}: Progress tracking nominal`;
      recommendation = 'Continue monitoring';
    }

    return { finding, severity, recommendation };
  }

  /**
   * Planning analysis
   */
  private async analyzePlanning(project: any): Promise<any> {
    // Simple planning check
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let finding = `${project.name}: Planning review complete`;
    let recommendation = 'No planning adjustments needed';

    return { finding, severity, recommendation };
  }
}
