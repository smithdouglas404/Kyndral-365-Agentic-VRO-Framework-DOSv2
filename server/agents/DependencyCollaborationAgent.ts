/**
 * DEPENDENCY COLLABORATION AGENT
 *
 * Proactively detects cross-project dependencies and fosters team collaboration via HITL.
 *
 * Capabilities:
 * 1. Monitors all project dependencies continuously
 * 2. Detects when blocking projects are delayed
 * 3. Identifies impacted (blocked) projects
 * 4. Searches RAG for successful resolution patterns
 * 5. Creates HITL interventions to bring teams together
 * 6. Recommends specific collaboration actions with proven success rates
 */

import { DeepAgentWithRAG } from "./deep/DeepAgentWithRAG.js";
import { DeepAgentConfig } from "./deep/DeepAgentBase.js";
import type { IStorage } from "../storage.js";
import { AgentTool } from "../lib/AgentTool.js";
import { z } from "zod";

interface DependencyRisk {
  blockingProject: {
    id: string;
    name: string;
    owner: string;
    status: string;
    delayDays: number;
  };
  blockedProjects: Array<{
    id: string;
    name: string;
    owner: string;
    waitingFor: string;
    impactDays: number;
  }>;
  riskLevel: "critical" | "high" | "medium" | "low";
  historicalPattern?: {
    patternName: string;
    averageDelayDays: number;
    successfulResolutions: string[];
    successRate: number;
  };
  recommendedCollaboration: {
    participants: string[];
    urgency: string;
    suggestedActions: string[];
  };
}

export class DependencyCollaborationAgent extends DeepAgentWithRAG {
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DependencyCollaboration",
      agentType: "cross_project_orchestration",
      description: "Detects cross-project dependencies and fosters team collaboration via HITL",
      capabilities: [
        "Dependency graph analysis",
        "Cross-project risk detection",
        "Team collaboration facilitation",
        "Historical pattern matching for dependency issues",
        "Proactive stakeholder coordination",
      ],
      enablePlanning: true,
      enableReflection: true,
    };
    super(config, storage);
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "analyze_dependency_graph",
        description: "Analyze all project dependencies and identify blocking/blocked relationships",
        schema: z.object({
          portfolioId: z.string().optional(),
        }),
        func: async ({ portfolioId }) => {
          // Note: portfolioId filtering not implemented yet, fetching all projects
          const projects = await this.storage.getProjects();

          const allDependencies = await this.storage.getAllDependencies();
          const dependencies = allDependencies.filter((d: any) => d.status === 'active');

          // Build dependency graph
          const graph = {
            nodes: projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              owner: p.owner || 'Unknown',
            })),
            edges: dependencies.map((d: any) => ({
              from: d.targetProjectId,  // The project being depended on
              to: d.projectId,          // The project with the dependency
              deliverable: d.description,
              expectedDate: null,  // Not tracked in this table
            })),
          };

          return graph;
        },
      }),

      new AgentTool({
        name: "detect_blocking_risks",
        description: "Identify projects that are blocking others due to delays",
        schema: z.object({
          portfolioId: z.string().optional(),
        }),
        func: async ({ portfolioId }) => {
          // Note: portfolioId filtering not implemented yet, fetching all projects
          const projects = await this.storage.getProjects();

          const allDependencies = await this.storage.getAllDependencies();
          const dependencies = allDependencies.filter((d: any) => d.status === 'active');

          const blockingRisks: DependencyRisk[] = [];

          for (const dep of dependencies) {
            // In our schema: projectId = project with dependency, targetProjectId = project being depended on
            const blockingProjId = dep.targetProjectId;  // The blocking project
            const blockedProjId = dep.projectId;         // The blocked project

            if (!blockingProjId || !blockedProjId) continue;

            const blockingProj = projects.find((p: any) => p.id === blockingProjId);
            const blockedProj = projects.find((p: any) => p.id === blockedProjId);

            if (!blockingProj || !blockedProj) continue;

            // Check if blocking project is delayed or at-risk
            const isDelayed = ['at-risk', 'delayed', 'red'].includes(blockingProj.status || '');
            // Note: dependencies table doesn't have expected_completion_date, using status instead
            const now = new Date();

            if (isDelayed) {
              // Calculate delay (estimate based on status)
              const delayDays = 7; // Default estimate when no date available

              // Find all projects blocked by this one
              const allBlocked = dependencies
                .filter((d: any) =>
                  d.targetProjectId === blockingProj.id &&
                  d.projectId !== blockingProj.id
                )
                .map((d: any) => {
                  return projects.find((p: any) => p.id === d.projectId);
                })
                .filter((p: any) => p);

              // Search RAG for similar dependency patterns
              const patterns: any = await this.ragService.findPatternMatches({
                type: 'dependency_delay',
                blockingProjectStatus: blockingProj.status,
                delayDays,
                numBlockedProjects: allBlocked.length,
              }, 3);

              const bestPattern: any = patterns[0];

              blockingRisks.push({
                blockingProject: {
                  id: blockingProj.id,
                  name: blockingProj.name,
                  owner: (blockingProj as any).owner || 'Unknown',
                  status: blockingProj.status || 'unknown',
                  delayDays,
                },
                blockedProjects: allBlocked.map((bp: any) => ({
                  id: bp.id,
                  name: bp.name,
                  owner: bp.owner || 'Unknown',
                  waitingFor: dep.description || 'Unknown deliverable',
                  impactDays: delayDays,
                })),
                riskLevel: delayDays > 14 ? 'critical' : delayDays > 7 ? 'high' : 'medium',
                historicalPattern: bestPattern ? {
                  patternName: bestPattern.patternName,
                  averageDelayDays: bestPattern.typicalOutcome?.averageDelayDays || delayDays * 2,
                  successfulResolutions: bestPattern.successInterventions?.map((i: any) => i.action || i) || [],
                  successRate: bestPattern.successRate || 0.5,
                } : undefined,
                recommendedCollaboration: {
                  participants: [
                    (blockingProj as any).owner,
                    ...allBlocked.map((bp: any) => bp.owner)
                  ].filter(Boolean).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i), // Unique
                  urgency: delayDays > 14 ? 'immediate' : 'within_48hrs',
                  suggestedActions: [
                    'Schedule joint planning session',
                    'Create interim solution/workaround',
                    'Escalate to Portfolio Manager if needed',
                  ],
                },
              });
            }
          }

          return blockingRisks;
        },
      }),

      new AgentTool({
        name: "create_collaboration_intervention",
        description: "Create HITL intervention to facilitate cross-team collaboration",
        schema: z.object({
          dependencyRisk: z.any(),
        }),
        func: async ({ dependencyRisk }) => {
          const risk = dependencyRisk as DependencyRisk;

          // Search RAG for successful collaboration strategies
          const collaborationKnowledge = await this.ragService.searchKnowledge(
            `cross-project dependency resolution collaboration strategies`,
            'sop',
            5
          );

          // Generate detailed narrative
          const narrative = await this.generateCollaborationNarrative(risk, collaborationKnowledge);

          // Create intervention
          const intervention = {
            agentName: this.config.agentName,
            type: 'dependency_collaboration',
            severity: risk.riskLevel,
            title: `Dependency Risk: ${risk.blockingProject.name} blocking ${risk.blockedProjects.length} projects`,
            description: narrative,
            recommendedAction: risk.recommendedCollaboration.suggestedActions.join('; '),
            affectedProjects: [
              risk.blockingProject.id,
              ...risk.blockedProjects.map(p => p.id),
            ],
            confidence: risk.historicalPattern ? risk.historicalPattern.successRate : 0.7,
            expectedImpact: `${risk.blockedProjects.length} projects affected, ${risk.blockingProject.delayDays} days delay`,
            status: 'pending',
            metadata: JSON.stringify({
              blockingProject: risk.blockingProject.name,
              blockedProjects: risk.blockedProjects.map(p => p.name),
              participants: risk.recommendedCollaboration.participants,
            }),
          };

          const interventionId = `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create intervention using storage method
          await this.storage.createIntervention({
            id: interventionId,
            agentName: intervention.agentName,
            type: intervention.type,
            severity: intervention.severity,
            title: intervention.title,
            description: intervention.description,
            recommendedAction: intervention.recommendedAction,
            confidence: intervention.confidence,
            expectedImpact: intervention.expectedImpact,
            status: intervention.status,
            metadata: intervention.metadata,
          } as any);

          console.log(`[DependencyAgent] Created intervention ${interventionId}`);

          return {
            interventionId,
            stakeholdersNotified: risk.recommendedCollaboration.participants,
            narrative,
          };
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are the Dependency Collaboration Agent, responsible for detecting cross-project dependencies
and fostering proactive collaboration between teams.

Your mission:
1. Monitor all project dependencies continuously
2. Detect when blocking projects are delayed
3. Identify impacted (blocked) projects
4. Search historical patterns for successful resolutions
5. Create HITL interventions that bring teams together
6. Recommend specific collaboration actions with proven success rates

You PROACTIVELY initiate collaboration before issues escalate. Don't wait for teams to ask for help.

When you detect a dependency risk, you:
- Generate a detailed predictive narrative
- Reference similar historical cases
- Recommend proven collaboration strategies
- Notify all stakeholders
- Track resolution outcomes for learning`;
  }

  /**
   * Generate detailed collaboration narrative using RAG
   */
  private async generateCollaborationNarrative(
    risk: DependencyRisk,
    knowledge: any[]
  ): Promise<string> {
    const { ModelTier } = await import("../lib/SmartModelRouter.js");

    const collabSystemPrompt = `Generate a detailed HITL intervention narrative for this cross-project dependency risk.

Structure:
1. SITUATION: Explain the dependency issue clearly with quantified impact
2. HISTORICAL ANALYSIS: Reference similar cases from portfolio history
3. PREDICTIVE FORECAST: What will happen if no action taken (week-by-week)
4. RECOMMENDED COLLABORATION: Specific actions with proven success rates
5. KNOWLEDGE BASE: Reference relevant SOPs/PMBOK
6. STAKEHOLDERS: Who needs to be involved
7. EXPECTED OUTCOME: What happens if actions are approved

Make it DETAILED, PREDICTIVE, and ACTIONABLE.`;

    const collabUserPrompt = `Blocking Project: ${risk.blockingProject.name} (${risk.blockingProject.delayDays} days delayed, status: ${risk.blockingProject.status})
Blocked Projects: ${risk.blockedProjects.map(p => `${p.name} (waiting for: ${p.waitingFor})`).join(', ')}
Risk Level: ${risk.riskLevel.toUpperCase()}

Historical Pattern: ${risk.historicalPattern
      ? JSON.stringify(risk.historicalPattern, null, 2)
      : 'No historical pattern match found'}

Knowledge Base References:
${knowledge.length > 0
      ? knowledge.map(k => `${k.title}: ${k.content.substring(0, 200)}...`).join('\n')
      : 'No specific knowledge articles found'}

Generate the collaboration intervention narrative.`;

    const response = await this.router.callModel(ModelTier.PREMIUM, collabSystemPrompt, collabUserPrompt);
    return response.content;
  }

  /**
   * Run continuous dependency monitoring (called by scheduler)
   */
  async runDependencyMonitoring(): Promise<{
    risksDetected: number;
    interventionsCreated: number;
  }> {
    console.log('[DependencyAgent] Running dependency monitoring...');

    try {
      const tool = this.defineTools()[1]; // detect_blocking_risks
      const risks = await tool.func({ portfolioId: undefined }) as DependencyRisk[];

      let interventionsCreated = 0;

      for (const risk of risks) {
        if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
          const createTool = this.defineTools()[2]; // create_collaboration_intervention
          await createTool.func({ dependencyRisk: risk });
          interventionsCreated++;
        }
      }

      console.log(`[DependencyAgent] Monitoring complete. Found ${risks.length} risks, created ${interventionsCreated} interventions.`);

      return {
        risksDetected: risks.length,
        interventionsCreated,
      };
    } catch (error) {
      console.error('[DependencyAgent] Monitoring failed:', error);
      return {
        risksDetected: 0,
        interventionsCreated: 0,
      };
    }
  }
}
