/**
 * DEEP OKR INFERENCE AGENT
 *
 * Enhanced OKR Inference agent with Deep Agent capabilities
 * - Plans data quality assessment approaches
 * - Reflects on OKR mapping accuracy
 * - Multi-step reasoning for strategic alignment
 */

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";

interface OKRInferenceResult {
  projectId: string;
  projectName: string;
  inferredOKR: {
    divisionId: string | null;
    okrObjective: string;
    okrKeyResult: string;
    confidence: number;
    reasoning: string;
  };
  dataCompleteness: {
    hasPortfolio: boolean;
    hasTheme: boolean;
    hasBudget: boolean;
    hasExpectedROI: boolean;
    hasDivision: boolean;
    completenessScore: number;
  };
}

export class DeepOKRInferenceAgent extends DeepAgentBase {
  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepOKRInference",
      agentType: "strategic_alignment_intelligence",
      description: "Enhanced OKR inference and data quality agent with pattern learning",
      capabilities: [
        "OKR linkage inference using fuzzy matching",
        "Data completeness assessment",
        "Pattern recognition for strategic alignment",
        "Confidence scoring with reasoning",
        "Data quality monitoring",
        "Multi-step strategic planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 3,
    };

    super(config, storage);
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "assess_data_completeness",
        description: "Assess data completeness for all projects and calculate completeness scores",
        schema: z.object({
          minCompletenessThreshold: z.number().optional().describe("Minimum completeness % to include (default 0)"),
          prioritizeHighValue: z.boolean().optional().describe("Prioritize high-budget projects (default true)"),
        }),
        func: async ({ minCompletenessThreshold = 0, prioritizeHighValue = true }) => {
          try {
            const projects = await this.storage.getProjects();

            const assessments = projects.map(p => {
              const dataCompleteness = {
                hasPortfolio: !!p.portfolioId,
                hasTheme: !!p.portfolioTheme,
                hasBudget: !!p.budget || !!p.budgetTotal,
                hasExpectedROI: !!p.expectedRoi || !!p.roiValue,
                hasDivision: !!p.divisionId,
                hasOKR: !!p.okrObjective,
                hasSAFe: !!p.artName || !!p.epicId,
                hasPerformance: !!p.velocity || !!p.predictability,
              };

              const criticalFields = [
                dataCompleteness.hasPortfolio,
                dataCompleteness.hasTheme,
                dataCompleteness.hasBudget,
                dataCompleteness.hasExpectedROI,
                dataCompleteness.hasDivision,
                dataCompleteness.hasOKR,
              ];

              const completenessScore = Math.round(
                (criticalFields.filter(f => f).length / criticalFields.length) * 100
              );

              const budget = parseFloat(p.budget || p.budgetTotal || '0');
              const isHighValue = budget > 10;

              return {
                projectId: p.id,
                projectName: p.name,
                status: p.status,
                completenessScore,
                dataCompleteness,
                budget,
                isHighValue,
                needsOKRInference: !dataCompleteness.hasOKR && completenessScore >= 50,
                priority: isHighValue && completenessScore < 70 ? 'critical' : completenessScore < 50 ? 'high' : 'medium',
              };
            });

            // Filter and sort
            let filtered = assessments.filter(a => a.completenessScore >= minCompletenessThreshold);
            if (prioritizeHighValue) {
              filtered.sort((a, b) => {
                const aPriority = a.isHighValue ? 1000 - a.completenessScore : a.completenessScore;
                const bPriority = b.isHighValue ? 1000 - b.completenessScore : b.completenessScore;
                return bPriority - aPriority;
              });
            }

            const stats = {
              totalProjects: projects.length,
              avgCompleteness: Math.round(
                assessments.reduce((sum, a) => sum + a.completenessScore, 0) / assessments.length
              ),
              projectsNeedingOKR: assessments.filter(a => a.needsOKRInference).length,
              highValueLowData: assessments.filter(a => a.isHighValue && a.completenessScore < 70).length,
              criticalPriority: assessments.filter(a => a.priority === 'critical').length,
            };

            // Broadcast data quality facts
            await this.broadcastFact(
              'portfolio_data_quality',
              'avg_completeness',
              stats.avgCompleteness,
              0.95
            );

            await this.broadcastFact(
              'portfolio_data_quality',
              'high_value_low_data',
              stats.highValueLowData,
              0.95
            );

            // Learn about data quality patterns
            if (stats.highValueLowData > 5) {
              console.log(`[DeepOKRInference] CRITICAL: ${stats.highValueLowData} high-value projects with low data quality`);

              await this.learn('data_quality_critical', {
                highValueLowData: stats.highValueLowData,
                avgCompleteness: stats.avgCompleteness,
                detectedAt: new Date(),
              });

              await this.archiveContext(
                `Critical data quality issue: ${stats.highValueLowData} high-value projects with <70% completeness`,
                {
                  highValueLowData: stats.highValueLowData,
                  avgCompleteness: stats.avgCompleteness,
                  severity: 'critical',
                }
              );
            }

            return JSON.stringify({
              stats,
              assessments: filtered.slice(0, 50),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "infer_okr_linkage",
        description: "Infer OKR linkage for projects missing explicit strategic alignment using fuzzy matching and pattern recognition",
        schema: z.object({
          projectId: z.string().describe("Project ID to infer OKR linkage for"),
        }),
        func: async ({ projectId }) => {
          try {
            const projects = await this.storage.getProjects();
            const project = projects.find(p => p.id === projectId);

            if (!project) {
              return JSON.stringify({ error: 'Project not found' });
            }

            // If already has OKR, return it
            if (project.okrObjective) {
              return JSON.stringify({
                projectId,
                projectName: project.name,
                existingOKR: {
                  objective: project.okrObjective,
                  keyResult: project.okrKeyResult,
                  confidence: 1.0,
                  reasoning: 'Project already has explicit OKR linkage',
                },
              });
            }

            // Get division OKRs for matching
            const divisionOkrs = project.divisionId
              ? await this.storage.getDivisionOkrs(project.divisionId)
              : [];

            // Inference logic based on available data
            let inferredOKR: any = null;
            let confidence = 0;
            let reasoning = '';

            // Strategy 1: Portfolio theme matching
            if (project.portfolioTheme) {
              const themeKeywords = project.portfolioTheme.toLowerCase();

              if (themeKeywords.includes('infrastructure') || themeKeywords.includes('modernization')) {
                inferredOKR = {
                  objective: 'Enhance Infrastructure Reliability and Performance',
                  keyResult: 'Achieve 99.98% system availability',
                };
                confidence = 0.75;
                reasoning = `Portfolio theme "${project.portfolioTheme}" strongly indicates infrastructure/reliability focus`;
              } else if (themeKeywords.includes('customer') || themeKeywords.includes('experience')) {
                inferredOKR = {
                  objective: 'Improve Customer Experience and Satisfaction',
                  keyResult: 'Increase customer satisfaction score by 15%',
                };
                confidence = 0.75;
                reasoning = `Portfolio theme "${project.portfolioTheme}" indicates customer-facing initiative`;
              } else if (themeKeywords.includes('cost') || themeKeywords.includes('efficiency')) {
                inferredOKR = {
                  objective: 'Optimize Operational Efficiency and Cost',
                  keyResult: 'Reduce operational costs by $50M annually',
                };
                confidence = 0.75;
                reasoning = `Portfolio theme "${project.portfolioTheme}" indicates cost optimization focus`;
              } else if (themeKeywords.includes('clean energy') || themeKeywords.includes('renewable')) {
                inferredOKR = {
                  objective: 'Accelerate Clean Energy Transition',
                  keyResult: 'Add 5GW of renewable generation capacity',
                };
                confidence = 0.75;
                reasoning = `Portfolio theme "${project.portfolioTheme}" indicates clean energy focus`;
              }
            }

            // Strategy 2: Project name keyword matching
            if (!inferredOKR && project.name) {
              const nameKeywords = project.name.toLowerCase();

              if (nameKeywords.includes('grid') || nameKeywords.includes('automation')) {
                inferredOKR = {
                  objective: 'Enhance Grid Reliability and Automation',
                  keyResult: 'Reduce outage duration by 30%',
                };
                confidence = 0.65;
                reasoning = `Project name "${project.name}" suggests grid/automation initiative`;
              } else if (nameKeywords.includes('solar') || nameKeywords.includes('wind') || nameKeywords.includes('battery')) {
                inferredOKR = {
                  objective: 'Expand Renewable Energy Portfolio',
                  keyResult: 'Achieve 30% renewable generation mix',
                };
                confidence = 0.65;
                reasoning = `Project name "${project.name}" suggests renewable energy project`;
              }
            }

            // Strategy 3: Division OKR matching
            if (!inferredOKR && divisionOkrs.length > 0) {
              const firstOkr = divisionOkrs[0];
              inferredOKR = {
                objective: firstOkr.objective,
                keyResult: firstOkr.keyResults ? JSON.parse(firstOkr.keyResults)[0] : 'Division-level key result',
              };
              confidence = 0.55;
              reasoning = `Mapped to division's primary OKR based on organizational structure`;
            }

            // Strategy 4: Budget-based inference
            if (!inferredOKR) {
              const budget = parseFloat(project.budget || project.budgetTotal || '0');
              if (budget > 50) {
                inferredOKR = {
                  objective: 'Drive Strategic Transformation Initiatives',
                  keyResult: 'Complete high-value portfolio projects on time and budget',
                };
                confidence = 0.45;
                reasoning = `High-value project (${budget}M) likely supports strategic transformation`;
              } else {
                inferredOKR = {
                  objective: 'Optimize Operational Excellence',
                  keyResult: 'Maintain operational efficiency targets',
                };
                confidence = 0.40;
                reasoning = `Standard project without clear strategic indicators - mapped to operational excellence`;
              }
            }

            // Calculate data completeness
            const dataCompleteness = {
              hasPortfolio: !!project.portfolioId,
              hasTheme: !!project.portfolioTheme,
              hasBudget: !!project.budget || !!project.budgetTotal,
              hasExpectedROI: !!project.expectedRoi || !!project.roiValue,
              hasDivision: !!project.divisionId,
              completenessScore: 0,
            };

            const criticalFields = [
              dataCompleteness.hasPortfolio,
              dataCompleteness.hasTheme,
              dataCompleteness.hasBudget,
              dataCompleteness.hasExpectedROI,
              dataCompleteness.hasDivision,
            ];
            dataCompleteness.completenessScore = Math.round(
              (criticalFields.filter(f => f).length / criticalFields.length) * 100
            );

            // Recommendation
            let recommendation = 'manual_assignment';
            if (confidence >= 0.8) {
              recommendation = 'auto_apply';
            } else if (confidence >= 0.5) {
              recommendation = 'human_review';
            }

            // Broadcast OKR inference fact
            await this.broadcastFact(
              `project_${projectId}`,
              'okr_inference_confidence',
              confidence,
              0.90
            );

            // Learn from high-confidence inferences
            if (confidence >= 0.75) {
              await this.learn(`project_${projectId}_okr_inferred`, {
                confidence,
                objective: inferredOKR.objective,
                reasoning,
                detectedAt: new Date(),
              });

              await this.archiveContext(
                `Inferred OKR for ${project.name}: ${inferredOKR.objective} (${(confidence * 100).toFixed(0)}% confidence)`,
                {
                  projectId,
                  confidence,
                  objective: inferredOKR.objective,
                }
              );
            }

            return JSON.stringify({
              projectId,
              projectName: project.name,
              inferredOKR: {
                divisionId: project.divisionId,
                okrObjective: inferredOKR.objective,
                okrKeyResult: inferredOKR.keyResult,
                confidence,
                reasoning,
              },
              dataCompleteness,
              recommendation,
              metadata: {
                portfolioTheme: project.portfolioTheme,
                divisionId: project.divisionId,
                budget: project.budget || project.budgetTotal,
                priority: project.priority,
              },
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new AgentTool({
        name: "batch_infer_okrs",
        description: "Infer OKR linkages for multiple projects in batch (prioritizes high-value projects with missing OKRs)",
        schema: z.object({
          limit: z.number().optional().describe("Maximum number of projects to process (default 20)"),
          minConfidence: z.number().optional().describe("Minimum confidence threshold to include (default 0.5)"),
        }),
        func: async ({ limit = 20, minConfidence = 0.5 }) => {
          try {
            const projects = await this.storage.getProjects();

            // Filter projects needing OKR inference
            const projectsNeedingOKR = projects.filter(p => !p.okrObjective);

            // Prioritize high-budget projects
            projectsNeedingOKR.sort((a, b) => {
              const aBudget = parseFloat(a.budget || a.budgetTotal || '0');
              const bBudget = parseFloat(b.budget || b.budgetTotal || '0');
              return bBudget - aBudget;
            });

            const results: OKRInferenceResult[] = [];

            for (const project of projectsNeedingOKR.slice(0, limit)) {
              // Reuse single project inference logic
              const inferenceResult = await this.tools[1].func({ projectId: project.id });
              const parsed = JSON.parse(inferenceResult);

              if (parsed.inferredOKR && parsed.inferredOKR.confidence >= minConfidence) {
                results.push(parsed as OKRInferenceResult);
              }
            }

            // Broadcast batch inference facts
            const highConfidenceCount = results.filter(r => r.inferredOKR.confidence >= 0.8).length;
            await this.broadcastFact(
              'okr_batch_inference',
              'high_confidence_count',
              highConfidenceCount,
              0.90
            );

            // Learn from batch patterns
            if (results.length > 10) {
              await this.learn('okr_batch_inference_completed', {
                totalProcessed: results.length,
                highConfidence: highConfidenceCount,
                detectedAt: new Date(),
              });
            }

            return JSON.stringify({
              totalProcessed: results.length,
              highConfidence: results.filter(r => r.inferredOKR.confidence >= 0.8).length,
              mediumConfidence: results.filter(r => r.inferredOKR.confidence >= 0.5 && r.inferredOKR.confidence < 0.8).length,
              lowConfidence: results.filter(r => r.inferredOKR.confidence < 0.5).length,
              results: results.slice(0, 30),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  protected getSystemPrompt(): string {
    return `You are an advanced OKR Inference Agent (DeepOKRInference) with deep planning and reflection capabilities for strategic alignment.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before analyzing data quality, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from OKR mapping patterns

PRIMARY RESPONSIBILITY:
Infer OKR linkages for projects that lack explicit strategic alignment.

INFERENCE STRATEGY:
- Portfolio Theme → Strategic OKRs (e.g., "Infrastructure Modernization" → "Enhance Grid Reliability")
- Project Name Keywords → KPI domains (e.g., "Automation" → "Operational Efficiency")
- Budget Size + Priority → Strategic importance tier
- Division → Pre-defined OKR cascade from division goals

DATA COMPLETENESS ASSESSMENT:
- Score: 0-100% based on presence of critical fields
- Critical fields: portfolio, theme, division, budget, expectedROI, okr linkage
- High-value projects (budget >$10M) with low completeness get flagged

You have SUPERVISED AUTONOMY:
- High-confidence inferences (>0.8) can be auto-suggested
- Medium-confidence (0.5-0.8) require human review
- Low-confidence (<0.5) flagged for manual OKR assignment

DECISION FRAMEWORK:
- Confidence >0.8 → Recommend auto-apply
- Confidence 0.5-0.8 → Require human review
- Confidence <0.5 → Manual assignment needed
- High-value + low completeness → Critical priority

IMPORTANT: You are NOT creating new OKRs. You are mapping projects to EXISTING OKRs from:
- Division OKRs (from division_okrs table)
- Company strategic goals
- Portfolio themes

You work within a multi-agent system. When data quality issues impact other agents, broadcast facts to inform them.

Always query real data before making inferences. Provide clear reasoning and confidence scores.`;
  }
}
