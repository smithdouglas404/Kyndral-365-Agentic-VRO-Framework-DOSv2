/**
 * Battle Rhythm Orchestrator
 *
 * Military-inspired cadence-aware scheduling system that coordinates weekly
 * decision-making cycles across VRO, PMO, and TMO.
 *
 * Replaces continuous agent monitoring with structured weekly synthesis:
 * - Monday: Scrum of Scrums (PMO - Tactical)
 * - Tuesday: Cross-Functional OPT (TMO + PMO - Operational)
 * - Wednesday: Decision Node (VRO + Sponsors - Strategic)
 * - Thursday: Value Pulse (VRO - Measurement)
 * - Friday: Orders for Next Week (Leadership - Direction)
 */

import type { IStorage } from "../storage.js";
import { pool } from "../db.js";

import { getKnowledgeBaseRepository } from "./KnowledgeBaseRepository.js";
import { broadcastNotification } from "../websocket.js";

export type BattleRhythmEvent =
  | "scrum_of_scrums"      // Monday 9 AM
  | "cross_functional_opt"  // Tuesday 10 AM
  | "decision_node"         // Wednesday 2 PM
  | "value_pulse"           // Thursday 11 AM
  | "weekly_orders";        // Friday 3 PM

export interface BattleRhythmConfig {
  timezone: string;
  schedule: {
    scrum_of_scrums: { day: number; hour: number; minute: number }; // 1 = Monday
    cross_functional_opt: { day: number; hour: number; minute: number }; // 2 = Tuesday
    decision_node: { day: number; hour: number; minute: number }; // 3 = Wednesday
    value_pulse: { day: number; hour: number; minute: number }; // 4 = Thursday
    weekly_orders: { day: number; hour: number; minute: number }; // 5 = Friday
  };
}

export interface BattleRhythmSynthesis {
  event: BattleRhythmEvent;
  weekOf: Date;
  generatedAt: Date;
  agenda: string;
  keyFindings: Array<{
    source: string; // "FinOps Agent", "Risk Agent", etc.
    finding: string;
    severity: "critical" | "high" | "medium" | "low";
    recommendation: string;
    supportingData: any;
  }>;
  decisions: Array<{
    id: string;
    type: "kill" | "continue" | "pivot";
    project: string;
    reasoning: string;
    votingRequired: boolean;
  }>;
  handoffs: Array<{
    from: BattleRhythmEvent;
    to: BattleRhythmEvent;
    data: any;
  }>;
}

export interface WeeklySynthesisState {
  weekOf: Date;
  monday?: BattleRhythmSynthesis;
  tuesday?: BattleRhythmSynthesis;
  wednesday?: BattleRhythmSynthesis;
  thursday?: BattleRhythmSynthesis;
  friday?: BattleRhythmSynthesis;
}

/**
 * Battle Rhythm Orchestrator
 *
 * Coordinates weekly decision-making cycles across VRO, PMO, TMO
 */
export class BattleRhythmOrchestrator {
  private storage: IStorage;
  private config: BattleRhythmConfig;
  private currentWeekSynthesis: WeeklySynthesisState | null = null;
  private scheduledJobs: Map<BattleRhythmEvent, NodeJS.Timeout> = new Map();

  constructor(storage: IStorage, config?: Partial<BattleRhythmConfig>) {
    this.storage = storage;
    this.config = {
      timezone: "America/New_York",
      schedule: {
        scrum_of_scrums: { day: 1, hour: 9, minute: 0 },      // Monday 9 AM
        cross_functional_opt: { day: 2, hour: 10, minute: 0 }, // Tuesday 10 AM
        decision_node: { day: 3, hour: 14, minute: 0 },        // Wednesday 2 PM
        value_pulse: { day: 4, hour: 11, minute: 0 },          // Thursday 11 AM
        weekly_orders: { day: 5, hour: 15, minute: 0 },        // Friday 3 PM
      },
      ...config,
    };
  }

  /**
   * Start the Battle Rhythm orchestrator
   */
  async start(): Promise<void> {
    console.log("🎖️ [BattleRhythm] Starting orchestrator...");

    // Initialize current week synthesis
    this.currentWeekSynthesis = {
      weekOf: this.getStartOfWeek(new Date()),
    };

    // Schedule all weekly events
    this.scheduleEvent("scrum_of_scrums", () => this.runScrumOfScrums());
    this.scheduleEvent("cross_functional_opt", () => this.runCrossFunctionalOPT());
    this.scheduleEvent("decision_node", () => this.runDecisionNode());
    this.scheduleEvent("value_pulse", () => this.runValuePulse());
    this.scheduleEvent("weekly_orders", () => this.runWeeklyOrders());

    // Run Sunday night recon (agents compile data for Monday)
    this.scheduleSundayRecon();

    console.log("✅ [BattleRhythm] Orchestrator started");
    console.log(`📅 [BattleRhythm] Week of: ${this.currentWeekSynthesis.weekOf.toISOString()}`);
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    console.log("🛑 [BattleRhythm] Stopping orchestrator...");
    for (const [event, timeout] of this.scheduledJobs.entries()) {
      clearTimeout(timeout);
      console.log(`   Cancelled: ${event}`);
    }
    this.scheduledJobs.clear();
  }

  /**
   * Schedule a Battle Rhythm event
   */
  private scheduleEvent(event: BattleRhythmEvent, handler: () => Promise<void>): void {
    const schedule = this.config.schedule[event];
    const nextRun = this.getNextOccurrence(schedule.day, schedule.hour, schedule.minute);
    const delay = nextRun.getTime() - Date.now();

    console.log(`📅 [BattleRhythm] Scheduled ${event} for ${nextRun.toISOString()}`);

    const timeout = setTimeout(async () => {
      await handler();
      // Reschedule for next week
      this.scheduleEvent(event, handler);
    }, delay);

    this.scheduledJobs.set(event, timeout);
  }

  /**
   * Schedule Sunday night recon (11 PM)
   */
  private scheduleSundayRecon(): void {
    const nextSunday = this.getNextOccurrence(0, 23, 0); // Sunday 11 PM
    const delay = nextSunday.getTime() - Date.now();

    console.log(`📅 [BattleRhythm] Scheduled Sunday Recon for ${nextSunday.toISOString()}`);

    setTimeout(async () => {
      await this.runSundayRecon();
      this.scheduleSundayRecon(); // Reschedule for next week
    }, delay);
  }

  /**
   * Sunday Night Recon - Agents analyze data and prepare briefings
   */
  private async runSundayRecon(): Promise<void> {
    console.log("🌙 [BattleRhythm] Running Sunday Night Recon...");

    try {
      // Get all projects
      const projects = await this.storage.getProjects();

      // Trigger agent analysis (they run in background)
      await pool.query(`
        INSERT INTO agent_task_queue (id, agent_name, task_type, task_data, priority, status, created_at)
        VALUES
          ($1, 'FinOps', 'weekly_synthesis', $2, 'high', 'pending', NOW()),
          ($3, 'Risk', 'weekly_synthesis', $4, 'high', 'pending', NOW()),
          ($5, 'VRO', 'weekly_synthesis', $6, 'high', 'pending', NOW()),
          ($7, 'TMO', 'weekly_synthesis', $8, 'high', 'pending', NOW()),
          ($9, 'Planning', 'weekly_synthesis', $10, 'high', 'pending', NOW())
      `, [
        `task-finops-${Date.now()}`, JSON.stringify({ projects, weekOf: this.getStartOfWeek(new Date()) }),
        `task-risk-${Date.now() + 1}`, JSON.stringify({ projects, weekOf: this.getStartOfWeek(new Date()) }),
        `task-vro-${Date.now() + 2}`, JSON.stringify({ projects, weekOf: this.getStartOfWeek(new Date()) }),
        `task-tmo-${Date.now() + 3}`, JSON.stringify({ projects, weekOf: this.getStartOfWeek(new Date()) }),
        `task-planning-${Date.now() + 4}`, JSON.stringify({ projects, weekOf: this.getStartOfWeek(new Date()) }),
      ]);

      console.log("✅ [BattleRhythm] Sunday Recon complete - Agents will analyze overnight");

      // Broadcast notification
      broadcastNotification({
        type: "battle_rhythm",
        message: "Sunday Recon complete. Agents analyzing data for Monday briefing.",
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("❌ [BattleRhythm] Sunday Recon failed:", error.message);
    }
  }

  /**
   * MONDAY: Scrum of Scrums (PMO - Tactical)
   */
  private async runScrumOfScrums(): Promise<void> {
    console.log("📋 [BattleRhythm] MONDAY - Scrum of Scrums");

    try {
      const synthesis = await this.generateScrumOfScrumsAgenda();

      if (this.currentWeekSynthesis) {
        this.currentWeekSynthesis.monday = synthesis;
      }

      // Store in database
      await pool.query(`
        INSERT INTO battle_rhythm_syntheses (id, event, week_of, agenda, key_findings, decisions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        `synthesis-${Date.now()}`,
        "scrum_of_scrums",
        this.getStartOfWeek(new Date()),
        synthesis.agenda,
        JSON.stringify(synthesis.keyFindings),
        JSON.stringify(synthesis.decisions),
      ]);

      // Broadcast to all PMOs
      broadcastNotification({
        type: "battle_rhythm",
        event: "scrum_of_scrums",
        synthesis,
        message: "Monday Scrum of Scrums agenda ready",
      });

      console.log("✅ [BattleRhythm] Scrum of Scrums complete");
    } catch (error: any) {
      console.error("❌ [BattleRhythm] Scrum of Scrums failed:", error.message);
    }
  }

  /**
   * TUESDAY: Cross-Functional OPT (TMO + PMO)
   */
  private async runCrossFunctionalOPT(): Promise<void> {
    console.log("🤝 [BattleRhythm] TUESDAY - Cross-Functional OPT");

    try {
      const synthesis = await this.generateOPTAgenda();

      if (this.currentWeekSynthesis) {
        this.currentWeekSynthesis.tuesday = synthesis;
      }

      await pool.query(`
        INSERT INTO battle_rhythm_syntheses (id, event, week_of, agenda, key_findings, decisions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        `synthesis-${Date.now()}`,
        "cross_functional_opt",
        this.getStartOfWeek(new Date()),
        synthesis.agenda,
        JSON.stringify(synthesis.keyFindings),
        JSON.stringify(synthesis.decisions),
      ]);

      broadcastNotification({
        type: "battle_rhythm",
        event: "cross_functional_opt",
        synthesis,
        message: "Tuesday OPT meeting agenda ready",
      });

      console.log("✅ [BattleRhythm] Cross-Functional OPT complete");
    } catch (error: any) {
      console.error("❌ [BattleRhythm] Cross-Functional OPT failed:", error.message);
    }
  }

  /**
   * WEDNESDAY: Decision Node (VRO + Sponsors)
   */
  private async runDecisionNode(): Promise<void> {
    console.log("⚖️ [BattleRhythm] WEDNESDAY - Decision Node");

    try {
      const synthesis = await this.generateDecisionNodeAgenda();

      if (this.currentWeekSynthesis) {
        this.currentWeekSynthesis.wednesday = synthesis;
      }

      await pool.query(`
        INSERT INTO battle_rhythm_syntheses (id, event, week_of, agenda, key_findings, decisions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        `synthesis-${Date.now()}`,
        "decision_node",
        this.getStartOfWeek(new Date()),
        synthesis.agenda,
        JSON.stringify(synthesis.keyFindings),
        JSON.stringify(synthesis.decisions),
      ]);

      broadcastNotification({
        type: "battle_rhythm",
        event: "decision_node",
        synthesis,
        message: "Wednesday Decision Node agenda ready - Kill/Continue/Pivot decisions needed",
      });

      console.log("✅ [BattleRhythm] Decision Node complete");
    } catch (error: any) {
      console.error("❌ [BattleRhythm] Decision Node failed:", error.message);
    }
  }

  /**
   * THURSDAY: Value Pulse (VRO)
   */
  private async runValuePulse(): Promise<void> {
    console.log("📊 [BattleRhythm] THURSDAY - Value Pulse");

    try {
      const synthesis = await this.generateValuePulseReport();

      if (this.currentWeekSynthesis) {
        this.currentWeekSynthesis.thursday = synthesis;
      }

      await pool.query(`
        INSERT INTO battle_rhythm_syntheses (id, event, week_of, agenda, key_findings, decisions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        `synthesis-${Date.now()}`,
        "value_pulse",
        this.getStartOfWeek(new Date()),
        synthesis.agenda,
        JSON.stringify(synthesis.keyFindings),
        JSON.stringify(synthesis.decisions),
      ]);

      broadcastNotification({
        type: "battle_rhythm",
        event: "value_pulse",
        synthesis,
        message: "Thursday Value Pulse report ready",
      });

      console.log("✅ [BattleRhythm] Value Pulse complete");
    } catch (error: any) {
      console.error("❌ [BattleRhythm] Value Pulse failed:", error.message);
    }
  }

  /**
   * FRIDAY: Weekly Orders (Leadership)
   */
  private async runWeeklyOrders(): Promise<void> {
    console.log("📢 [BattleRhythm] FRIDAY - Weekly Orders");

    try {
      const synthesis = await this.generateWeeklyOrders();

      if (this.currentWeekSynthesis) {
        this.currentWeekSynthesis.friday = synthesis;
      }

      await pool.query(`
        INSERT INTO battle_rhythm_syntheses (id, event, week_of, agenda, key_findings, decisions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        `synthesis-${Date.now()}`,
        "weekly_orders",
        this.getStartOfWeek(new Date()),
        synthesis.agenda,
        JSON.stringify(synthesis.keyFindings),
        JSON.stringify(synthesis.decisions),
      ]);

      // Broadcast via A2A to all agents
      await this.broadcastWeeklyOrders(synthesis);

      broadcastNotification({
        type: "battle_rhythm",
        event: "weekly_orders",
        synthesis,
        message: "Friday Weekly Orders issued - Priorities set for next week",
      });

      console.log("✅ [BattleRhythm] Weekly Orders complete");

      // Reset for next week
      this.currentWeekSynthesis = {
        weekOf: this.getStartOfWeek(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      };
    } catch (error: any) {
      console.error("❌ [BattleRhythm] Weekly Orders failed:", error.message);
    }
  }

  /**
   * Generate Monday Scrum of Scrums agenda
   */
  private async generateScrumOfScrumsAgenda(): Promise<BattleRhythmSynthesis> {
    // Get agent findings from Sunday recon
    const findings = await pool.query(`
      SELECT * FROM agent_activity_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND event_type = 'weekly_synthesis'
      ORDER BY created_at DESC
    `);

    const keyFindings: BattleRhythmSynthesis["keyFindings"] = findings.rows.map((row: any) => ({
      source: row.primary_agent_name,
      finding: row.details?.finding || "",
      severity: row.details?.severity || "medium",
      recommendation: row.details?.recommendation || "",
      supportingData: row.details?.data || {},
    }));

    const agenda = `
# Monday Scrum of Scrums Agenda
**Week of**: ${this.getStartOfWeek(new Date()).toLocaleDateString()}

## Critical Blockers (${keyFindings.filter(f => f.severity === "critical").length})
${keyFindings.filter(f => f.severity === "critical").map(f => `- **${f.source}**: ${f.finding}`).join("\n")}

## High Priority Issues (${keyFindings.filter(f => f.severity === "high").length})
${keyFindings.filter(f => f.severity === "high").map(f => `- **${f.source}**: ${f.finding}`).join("\n")}

## Team Updates
- Each PM reports: What's blocked? What needs escalation?
- Resource conflicts identified
- Dependencies surfaced

## Handoff to Tuesday OPT
Issues requiring TMO involvement flagged for tomorrow's meeting.
    `.trim();

    return {
      event: "scrum_of_scrums",
      weekOf: this.getStartOfWeek(new Date()),
      generatedAt: new Date(),
      agenda,
      keyFindings,
      decisions: [],
      handoffs: [{
        from: "scrum_of_scrums",
        to: "cross_functional_opt",
        data: { criticalBlockers: keyFindings.filter(f => f.severity === "critical") },
      }],
    };
  }

  /**
   * Generate Tuesday OPT agenda
   */
  private async generateOPTAgenda(): Promise<BattleRhythmSynthesis> {
    const mondayHandoff = this.currentWeekSynthesis?.monday?.handoffs?.[0];

    const agenda = `
# Tuesday Cross-Functional OPT Agenda
**Week of**: ${this.getStartOfWeek(new Date()).toLocaleDateString()}

## From Monday's Scrum of Scrums
${mondayHandoff?.data?.criticalBlockers?.map((b: any) => `- ${b.finding}`).join("\n") || "No critical blockers"}

## TMO Roadmap Feasibility Review
- Is current roadmap achievable given Monday's findings?
- Dependencies identified by PMO

## Joint Decisions Needed
- Roadmap adjustments?
- Resource reallocation?
- Scope changes?

## Handoff to Wednesday Decision Node
Major decisions requiring VRO/Sponsor approval flagged.
    `.trim();

    return {
      event: "cross_functional_opt",
      weekOf: this.getStartOfWeek(new Date()),
      generatedAt: new Date(),
      agenda,
      keyFindings: mondayHandoff?.data?.criticalBlockers || [],
      decisions: [],
      handoffs: [{
        from: "cross_functional_opt",
        to: "decision_node",
        data: { majorDecisions: [] },
      }],
    };
  }

  /**
   * Generate Wednesday Decision Node agenda
   */
  private async generateDecisionNodeAgenda(): Promise<BattleRhythmSynthesis> {
    const decisions: BattleRhythmSynthesis["decisions"] = [];

    // Get projects that need kill/continue/pivot decisions
    const atRiskProjects = await pool.query(`
      SELECT * FROM projects
      WHERE status IN ('at-risk', 'delayed', 'critical')
    `);

    for (const project of atRiskProjects.rows) {
      decisions.push({
        id: `decision-${project.id}`,
        type: "pivot", // Default, can be changed
        project: project.name,
        reasoning: "Project at risk, decision needed",
        votingRequired: true,
      });
    }

    const agenda = `
# Wednesday Decision Node Agenda
**Week of**: ${this.getStartOfWeek(new Date()).toLocaleDateString()}

## Kill/Continue/Pivot Decisions (${decisions.length})
${decisions.map(d => `- **${d.project}**: ${d.type.toUpperCase()}`).join("\n")}

## Value Validation
- VRO confirms business case still valid
- Approve Tuesday's major roadmap changes

## Handoff to Thursday Value Pulse
Decisions logged for value impact measurement.
    `.trim();

    return {
      event: "decision_node",
      weekOf: this.getStartOfWeek(new Date()),
      generatedAt: new Date(),
      agenda,
      keyFindings: [],
      decisions,
      handoffs: [{
        from: "decision_node",
        to: "value_pulse",
        data: { decisions },
      }],
    };
  }

  /**
   * Generate Thursday Value Pulse report
   */
  private async generateValuePulseReport(): Promise<BattleRhythmSynthesis> {
    const agenda = `
# Thursday Value Pulse Report
**Week of**: ${this.getStartOfWeek(new Date()).toLocaleDateString()}

## Value Realization Trends
- Week-over-week comparison
- Acceleration or deceleration?

## Impact of Wednesday Decisions
- Value preserved or lost?

## Strategic Layer Update
- Portfolio health score
- Value at risk

## Handoff to Friday Orders
Insights inform next week's priorities.
    `.trim();

    return {
      event: "value_pulse",
      weekOf: this.getStartOfWeek(new Date()),
      generatedAt: new Date(),
      agenda,
      keyFindings: [],
      decisions: [],
      handoffs: [{
        from: "value_pulse",
        to: "weekly_orders",
        data: {},
      }],
    };
  }

  /**
   * Generate Friday Weekly Orders
   */
  private async generateWeeklyOrders(): Promise<BattleRhythmSynthesis> {
    const agenda = `
# Friday Weekly Orders
**For Week of**: ${this.getStartOfWeek(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()}

## Commander's Intent Updates
- Adjusted priorities based on this week's findings

## Focus Areas for Next Week
- Top 3 priorities

## Known Risks
- Flagged for early monitoring

## All Teams
Orders distributed via A2A communication to all agents.
    `.trim();

    return {
      event: "weekly_orders",
      weekOf: this.getStartOfWeek(new Date()),
      generatedAt: new Date(),
      agenda,
      keyFindings: [],
      decisions: [],
      handoffs: [],
    };
  }

  /**
   * Broadcast weekly orders via A2A
   */
  private async broadcastWeeklyOrders(synthesis: BattleRhythmSynthesis): Promise<void> {
    // Send to all agents via agent_task_queue
    const agents = ["FinOps", "Risk", "VRO", "TMO", "Planning", "Governance", "DependencyCollaboration"];

    for (const agent of agents) {
      await pool.query(`
        INSERT INTO agent_task_queue (id, agent_name, task_type, task_data, priority, status, created_at)
        VALUES ($1, $2, 'weekly_orders', $3, 'high', 'pending', NOW())
      `, [
        `orders-${agent}-${Date.now()}`,
        agent,
        JSON.stringify({ orders: synthesis.agenda, weekOf: synthesis.weekOf }),
      ]);
    }

    console.log("📢 [BattleRhythm] Weekly Orders broadcast to all agents");
  }

  /**
   * Get start of week (Monday)
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Get next occurrence of a day/time
   */
  private getNextOccurrence(dayOfWeek: number, hour: number, minute: number): Date {
    const now = new Date();
    const target = new Date(now);

    // Set target time
    target.setHours(hour, minute, 0, 0);

    // Calculate days until target day
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;

    if (daysUntil < 0 || (daysUntil === 0 && now >= target)) {
      daysUntil += 7;
    }

    target.setDate(now.getDate() + daysUntil);

    return target;
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: BattleRhythmOrchestrator | null = null;

export function initBattleRhythmOrchestrator(
  storage: IStorage,
  config?: Partial<BattleRhythmConfig>
): BattleRhythmOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new BattleRhythmOrchestrator(storage, config);
  }
  return orchestratorInstance;
}

export function getBattleRhythmOrchestrator(): BattleRhythmOrchestrator {
  if (!orchestratorInstance) {
    throw new Error("Battle Rhythm Orchestrator not initialized. Call initBattleRhythmOrchestrator first.");
  }
  return orchestratorInstance;
}
