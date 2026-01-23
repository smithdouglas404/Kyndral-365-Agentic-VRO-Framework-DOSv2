/**
 * Remaining 4 Agents - Simplified implementations
 * These follow the same pattern as FinOps, TMO, and Risk agents
 */

import { AgentBase } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

// ============================================================================
// GOVERNANCE AGENT
// ============================================================================

export class GovernanceAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'governance',
      agentName: 'Governance Agent',
      focus: 'compliance, approvals, escalations, policies',
      autonomy: 'supervised',
      temperature: 0.5,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Governance Agent for policy compliance and approval workflows.
Focus on: Compliance gates, approval workflows, policy enforcement.
Autonomy: SUPERVISED - all interventions require human approval.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "check_compliance_status",
        description: "Check compliance status for projects",
        schema: z.object({ projectId: z.string().optional() }),
        func: async () => JSON.stringify({ status: "compliant", checks: [] }),
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Governance scan (placeholder)');
  }
}

// ============================================================================
// PLANNING AGENT
// ============================================================================

export class PlanningAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'planning',
      agentName: 'Planning Agent',
      focus: 'dependencies, roadmap, capacity, resource planning',
      autonomy: 'supervised',
      temperature: 0.6,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Planning Agent for dependency management and capacity planning.
Focus on: Dependencies, roadmap alignment, resource capacity.
Autonomy: SUPERVISED - all interventions require human approval.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "analyze_dependencies",
        description: "Analyze project dependencies for conflicts",
        schema: z.object({ projectId: z.string() }),
        func: async ({ projectId }) => {
          try {
            const dependencies = await this.storage.getDependenciesByProject(projectId);
            return JSON.stringify({
              projectId,
              totalDependencies: dependencies.length,
              blocked: dependencies.filter(d => d.status === 'blocked').length,
              dependencies: dependencies.slice(0, 10),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Planning scan (placeholder)');
  }
}

// ============================================================================
// OCM AGENT (Organizational Change Management)
// ============================================================================

export class OCMAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'ocm',
      agentName: 'OCM Agent',
      focus: 'change management, adoption, training, communication',
      autonomy: 'full',
      temperature: 0.7,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the OCM (Organizational Change Management) Agent.
Focus on: Change adoption, team communication, training needs.
Autonomy: FULL - can self-approve communication and training interventions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "track_adoption_metrics",
        description: "Track change adoption metrics across teams",
        schema: z.object({ teamId: z.string().optional() }),
        func: async () => JSON.stringify({ adoptionRate: "75%", trainingCompleted: 12 }),
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'OCM scan (placeholder)');
  }
}

// ============================================================================
// INTEGRATED MANAGEMENT AGENT (Quality/Testing)
// ============================================================================

export class IntegratedMgmtAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'integrated',
      agentName: 'Integrated Mgmt Agent',
      focus: 'quality, testing, defects, coverage, technical debt',
      autonomy: 'full',
      temperature: 0.6,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Integrated Management Agent for quality and testing.
Focus on: QA gates, test coverage, defect management, technical debt.
Autonomy: FULL - can self-approve quality gates and testing recommendations.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "query_test_coverage",
        description: "Query test coverage metrics for projects",
        schema: z.object({ projectId: z.string() }),
        func: async ({ projectId }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return JSON.stringify({ error: "Project not found" });
            }

            // Placeholder - in production would query actual test metrics
            return JSON.stringify({
              projectId,
              projectName: project.name,
              unitTestCoverage: "85%",
              integrationTestCoverage: "70%",
              e2eTestCoverage: "60%",
              status: "ACCEPTABLE",
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Quality scan (placeholder)');
  }
}
