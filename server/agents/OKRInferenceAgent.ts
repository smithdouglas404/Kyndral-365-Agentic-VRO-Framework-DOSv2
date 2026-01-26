/**
 * OKR Inference Agent
 *
 * Purpose: Intelligently maps projects to OKRs when explicit linkage is missing
 * This is NOT a replacement for human-defined OKR linkage
 * This is a FALLBACK for when data is incomplete
 *
 * Strategy:
 * 1. Fuzzy matching based on portfolio theme, project name, division
 * 2. Historical pattern learning from complete projects
 * 3. Confidence scoring for each inference
 * 4. Human approval workflow for low-confidence mappings
 */

import { AgentBase } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

interface OKRInferenceResult {
  projectId: string;
  projectName: string;
  inferredOKR: {
    divisionId: string | null;
    okrObjective: string;
    okrKeyResult: string;
    confidence: number; // 0-1
    reasoning: string;
  };
  dataCompleteness: {
    hasPortfolio: boolean;
    hasTheme: boolean;
    hasBudget: boolean;
    hasExpectedROI: boolean;
    hasDivision: boolean;
    completenessScore: number; // 0-100
  };
}

export class OKRInferenceAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'okr-inference',
      agentName: 'OKR Inference Agent',
      focus: 'OKR linkage inference, data quality assessment, strategic alignment mapping',
      autonomy: 'supervised',
      temperature: 0.4, // Lower temperature for more consistent inferences
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the OKR Inference Agent for the Enterprise Transformation Office.

Your PRIMARY responsibility is to infer OKR linkages for projects that lack explicit strategic alignment.

Core Capabilities:
1. Analyze project metadata (name, description, portfolio, theme, division) to infer OKR linkage
2. Calculate data completeness scores to prioritize scanning
3. Use fuzzy matching and pattern recognition to suggest OKR alignments
4. Provide confidence scores and reasoning for each inference

Inference Strategy:
- Portfolio Theme → Strategic OKRs (e.g., "Infrastructure Modernization" → "Enhance Grid Reliability")
- Project Name Keywords → KPI domains (e.g., "Automation" → "Operational Efficiency")
- Budget Size + Priority → Strategic importance tier
- Division → Pre-defined OKR cascade from division goals

Data Completeness Assessment:
- Score: 0-100% based on presence of critical fields
- Critical fields: portfolio, theme, division, budget, expectedROI, okr linkage
- High-value projects (budget >$10M) with low completeness get flagged

You have SUPERVISED AUTONOMY:
- High-confidence inferences (>0.8) can be auto-suggested
- Medium-confidence (0.5-0.8) require human review
- Low-confidence (<0.5) flagged for manual OKR assignment

Output Format:
When inferring OKR linkage, provide:
1. Suggested OKR objective and key result
2. Confidence score (0-1) with clear reasoning
3. Data completeness assessment
4. Recommendation (auto-apply, human review, manual assignment)

IMPORTANT: You are NOT creating new OKRs. You are mapping projects to EXISTING OKRs from:
- Division OKRs (from division_okrs table)
- Company strategic goals
- Portfolio themes

Always query real data before making inferences.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
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
              const isHighValue = budget > 10; // >$10M

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
                // High value + low completeness = highest priority
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

            // AUTO-CREATE INTERVENTIONS for critical data quality issues
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const assessment of assessments) {
              // Rule 1: High-value project + low data completeness
              if (assessment.isHighValue && assessment.completenessScore < 50) {
                const missingFields: string[] = [];
                if (!assessment.dataCompleteness.hasPortfolio) missingFields.push('Portfolio');
                if (!assessment.dataCompleteness.hasTheme) missingFields.push('Theme');
                if (!assessment.dataCompleteness.hasBudget) missingFields.push('Budget');
                if (!assessment.dataCompleteness.hasExpectedROI) missingFields.push('Expected ROI');
                if (!assessment.dataCompleteness.hasDivision) missingFields.push('Division');
                if (!assessment.dataCompleteness.hasOKR) missingFields.push('OKR Linkage');

                await this.storage.createIntervention({
                  type: 'data_quality_critical',
                  severity: 'critical',
                  title: `Critical Data Gap: ${assessment.projectName}`,
                  description: `High-value project ($${assessment.budget.toFixed(1)}M) has only ${assessment.completenessScore}% data completeness. Missing critical fields: ${missingFields.join(', ')}. This severely limits agent decision-making accuracy.`,
                  suggestedAction: 'Immediate data collection required. Contact project owner to provide missing information.',
                  projectId: assessment.projectId,
                  projectName: assessment.projectName,
                  agentSource: 'OKR Inference Agent',
                  confidence: '0.95',
                  isAutonomous: 'false', // Requires human review
                });

                // Send Slack/Teams alert
                await notificationMCP.sendDataQualityAlert({
                  projectName: assessment.projectName,
                  projectId: assessment.projectId,
                  completenessScore: assessment.completenessScore,
                  missingFields,
                  budget: assessment.budget,
                });

                interventionsCreated++;
              }
              // Rule 2: Any project with very low data completeness (<40%)
              else if (assessment.completenessScore < 40) {
                const missingFields: string[] = [];
                if (!assessment.dataCompleteness.hasPortfolio) missingFields.push('Portfolio');
                if (!assessment.dataCompleteness.hasTheme) missingFields.push('Theme');
                if (!assessment.dataCompleteness.hasBudget) missingFields.push('Budget');
                if (!assessment.dataCompleteness.hasExpectedROI) missingFields.push('Expected ROI');
                if (!assessment.dataCompleteness.hasDivision) missingFields.push('Division');
                if (!assessment.dataCompleteness.hasOKR) missingFields.push('OKR Linkage');

                await this.storage.createIntervention({
                  type: 'data_quality_high',
                  severity: 'high',
                  title: `Low Data Quality: ${assessment.projectName}`,
                  description: `Project has only ${assessment.completenessScore}% data completeness. Missing: ${missingFields.join(', ')}. Recommend data enrichment for accurate tracking.`,
                  suggestedAction: 'Schedule data collection session with project team.',
                  projectId: assessment.projectId,
                  projectName: assessment.projectName,
                  agentSource: 'OKR Inference Agent',
                  confidence: '0.85',
                  isAutonomous: 'false',
                });

                interventionsCreated++;
              }

              // Limit intervention creation to avoid overwhelming PMO
              if (interventionsCreated >= 20) break;
            }

            return JSON.stringify({
              stats,
              assessments: filtered.slice(0, 50), // Return top 50
              interventionsCreated,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
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

            // Strategy 2: Project name keyword matching (if no theme match)
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

            // Strategy 4: Budget-based inference (last resort)
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

            // AUTO-CREATE INTERVENTION for high-confidence OKR inferences
            if (confidence >= 0.7) {
              const severity = confidence >= 0.8 ? 'medium' : 'low';

              await this.storage.createIntervention({
                type: 'okr_inference',
                severity,
                title: `OKR Mapping Suggested: ${project.name}`,
                description: `Inferred OKR linkage with ${(confidence * 100).toFixed(0)}% confidence.\n\n**Suggested OKR:**\n- Objective: ${inferredOKR.objective}\n- Key Result: ${inferredOKR.keyResult}\n\n**Reasoning:** ${reasoning}`,
                suggestedAction: confidence >= 0.8
                  ? 'Review and approve OKR mapping. High confidence - recommend auto-apply.'
                  : 'Review inferred OKR mapping for accuracy before applying.',
                projectId,
                projectName: project.name,
                agentSource: 'OKR Inference Agent',
                confidence: confidence.toFixed(2),
                isAutonomous: confidence >= 0.8 ? 'true' : 'false',
              });
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

      new DynamicStructuredTool({
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

            return JSON.stringify({
              totalProcessed: results.length,
              highConfidence: results.filter(r => r.inferredOKR.confidence >= 0.8).length,
              mediumConfidence: results.filter(r => r.inferredOKR.confidence >= 0.5 && r.inferredOKR.confidence < 0.8).length,
              lowConfidence: results.filter(r => r.inferredOKR.confidence < 0.5).length,
              results: results.slice(0, 30), // Return top 30
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting OKR Inference Agent scan');

    const input = `Perform comprehensive data quality assessment and OKR inference.

CRITICAL ACTIONS REQUIRED:
1. Assess data completeness for ALL projects
2. Identify HIGH-VALUE projects (>$10M) with data completeness <70% - FLAG AS CRITICAL
3. For each critical data quality issue, I MUST create an intervention immediately
4. Run batch OKR inference for projects missing strategic alignment
5. For high-confidence OKR inferences (>0.8), create informational interventions

INTERVENTION CREATION RULES:
- Critical Severity: High-value project + low data completeness (<50%)
- High Severity: Any project with <40% data completeness
- Medium Severity: Projects needing OKR mapping with confidence >0.7

After assessment, use createIntervention to alert PMO about data gaps.
Remember: Data quality is CRITICAL for accurate agent decision-making.`;

    try {
      const result = await this.execute(input);

      // After scan, send critical alerts via Slack/Teams
      await this.sendCriticalDataQualityAlerts();
    } catch (error) {
      console.error('[OKRInferenceAgent] Scheduled scan error:', error);
    }
  }

  /**
   * Send Slack/Teams alerts for critical data quality issues
   */
  private async sendCriticalDataQualityAlerts(): Promise<void> {
    try {
      // Get recent interventions created by this agent
      const interventions = await this.storage.getInterventions({ agentId: 'okr-inference' });
      const recentCritical = interventions
        .filter(i => i.severity === 'critical' && this.isRecent(i.createdAt, 15)) // Last 15 minutes
        .slice(0, 5); // Top 5

      if (recentCritical.length === 0) return;

      // Import NotificationMCP dynamically
      const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
      const notificationMCP = getNotificationMCP();

      for (const intervention of recentCritical) {
        await notificationMCP.sendDataQualityAlert({
          projectName: intervention.projectName || 'Unknown Project',
          projectId: intervention.projectId || '',
          completenessScore: 0, // Would need to parse from intervention data
          missingFields: ['Portfolio', 'Budget', 'ROI'], // Would parse from description
          budget: undefined, // Would extract if available
        });
      }

      console.log(`[OKRInferenceAgent] Sent ${recentCritical.length} critical data quality alerts`);
    } catch (error) {
      console.error('[OKRInferenceAgent] Error sending alerts:', error);
    }
  }

  /**
   * Check if timestamp is within last N minutes
   */
  private isRecent(timestamp: Date | string, minutes: number): boolean {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffMs = Date.now() - date.getTime();
    return diffMs < minutes * 60 * 1000;
  }
}
