/**
 * LLM CALCULATOR SERVICE
 *
 * NO MORE HARDCODED MATH!
 * Instead of system-level calculations, we ask LLM to:
 * 1. Calculate the value
 * 2. Provide narrative explanation
 * 3. Show sourcing (where data came from)
 * 4. Give reasoning
 *
 * Example: Instead of variance = (actual - budget) / budget
 * We ask LLM: "Calculate budget variance and explain why"
 *
 * IMPORTANT: All calculation results are written to Mem0
 * This allows Langflow workflows and agents to query past calculations
 */

import Anthropic from '@anthropic-ai/sdk';
import { getMem0Service } from './Mem0Service.js';

export interface CalculationRequest {
  attributeName: string;
  attributeDescription: string;
  inputData: Record<string, any>;
  context?: string; // Optional business context
  previousValue?: any; // For trend analysis
  entity?: string; // Entity to write to Mem0 (e.g., project_123, agent_pmo)
  sourceAgent?: string; // Agent requesting the calculation
}

export interface CalculationResult {
  value: any; // The calculated value
  narrative: string; // Human-readable explanation
  reasoning: string; // Why this value makes sense
  sources: string[]; // Which input data was used
  confidence: number; // 0-1 confidence score
  timestamp: Date;
  calculatedBy: 'llm';
}

export class LLMCalculator {
  private static instance: LLMCalculator;
  private anthropic: Anthropic;

  private constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    });
  }

  public static getInstance(): LLMCalculator {
    if (!LLMCalculator.instance) {
      LLMCalculator.instance = new LLMCalculator();
    }
    return LLMCalculator.instance;
  }

  /**
   * Calculate attribute value using LLM
   * Returns value + narrative + sources + reasoning
   */
  async calculate(request: CalculationRequest): Promise<CalculationResult> {
    try {
      const prompt = this.generateCalculationPrompt(request);

      console.log(`[LLMCalculator] Calculating ${request.attributeName}...`);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      // Parse LLM response
      const result = this.parseCalculationResponse(text, request);

      console.log(`[LLMCalculator] ✅ ${request.attributeName} = ${result.value}`);

      // Write calculation result to Mem0 (memory layer for Langflow and agents)
      if (request.entity || request.sourceAgent) {
        try {
          const mem0 = getMem0Service();
          const entity = request.entity || `agent_${request.sourceAgent}`;

          await mem0.writeFact({
            entity,
            attribute: request.attributeName,
            value: {
              calculatedValue: result.value,
              narrative: result.narrative,
              reasoning: result.reasoning,
              sources: result.sources,
              confidence: result.confidence,
              inputData: request.inputData,
              timestamp: result.timestamp.toISOString()
            },
            sourceAgent: request.sourceAgent || 'llm_calculator',
            confidence: result.confidence
          });

          console.log(`[LLMCalculator] Calculation result written to Mem0 for entity: ${entity}`);
        } catch (error: any) {
          console.error('[LLMCalculator] Failed to write to Mem0:', error.message);
          // Don't throw - calculation succeeded even if Mem0 write failed
        }
      }

      return result;
    } catch (error: any) {
      console.error(`[LLMCalculator] Calculation error:`, error.message);
      throw new Error(`Failed to calculate ${request.attributeName}: ${error.message}`);
    }
  }

  /**
   * Generate prompt for LLM calculation
   */
  private generateCalculationPrompt(request: CalculationRequest): string {
    const { attributeName, attributeDescription, inputData, context, previousValue } = request;

    let prompt = `You are a ${attributeName} calculator for project management.

**Task**: Calculate "${attributeName}" (${attributeDescription})

**Input Data**:
${JSON.stringify(inputData, null, 2)}
`;

    if (previousValue !== undefined) {
      prompt += `\n**Previous Value**: ${previousValue}\n`;
    }

    if (context) {
      prompt += `\n**Context**: ${context}\n`;
    }

    prompt += `
**Instructions**:
1. Calculate the value for "${attributeName}"
2. Provide a clear narrative explanation (2-3 sentences)
3. Explain your reasoning
4. List which input data you used (sources)
5. Rate your confidence (0-100%)

**Output Format** (JSON):
{
  "value": <calculated value>,
  "narrative": "<human-readable explanation>",
  "reasoning": "<why this calculation makes sense>",
  "sources": ["<field1>", "<field2>"],
  "confidence": <0-100>
}

Return ONLY valid JSON, no markdown code blocks.`;

    return prompt;
  }

  /**
   * Parse LLM response into CalculationResult
   */
  private parseCalculationResponse(text: string, request: CalculationRequest): CalculationResult {
    try {
      // Remove markdown code blocks if present
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleaned);

      return {
        value: parsed.value,
        narrative: parsed.narrative || 'No explanation provided',
        reasoning: parsed.reasoning || 'No reasoning provided',
        sources: parsed.sources || Object.keys(request.inputData),
        confidence: (parsed.confidence || 85) / 100, // Convert to 0-1
        timestamp: new Date(),
        calculatedBy: 'llm'
      };
    } catch (error: any) {
      console.error('[LLMCalculator] Parse error:', error.message);
      console.error('[LLMCalculator] Raw text:', text);

      // Fallback: Return text as narrative
      return {
        value: null,
        narrative: text,
        reasoning: 'Unable to parse structured response',
        sources: Object.keys(request.inputData),
        confidence: 0.5,
        timestamp: new Date(),
        calculatedBy: 'llm'
      };
    }
  }

  /**
   * Calculate multiple attributes in one call (batch)
   */
  async calculateBatch(requests: CalculationRequest[]): Promise<CalculationResult[]> {
    const results: CalculationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.calculate(request);
        results.push(result);
      } catch (error: any) {
        console.error(`[LLMCalculator] Batch calc failed for ${request.attributeName}:`, error.message);
        // Continue with other calculations
      }
    }

    return results;
  }

  /**
   * SPECIALIZED CALCULATORS
   * Common PPM calculations with best-practice prompts
   */

  /**
   * Calculate WIP (Work In Progress) score
   */
  async calculateWIP(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'wip_score',
      attributeDescription: 'Work In Progress score measuring active tasks vs capacity',
      inputData: {
        activeTasks: projectData.activeTasks || 0,
        totalTasks: projectData.totalTasks || 0,
        teamCapacity: projectData.teamCapacity || 0,
        blockedTasks: projectData.blockedTasks || 0,
        inReviewTasks: projectData.inReviewTasks || 0
      },
      context: `Project: ${projectData.projectName || 'Unknown'}. WIP score indicates workflow efficiency.`
    });
  }

  /**
   * Calculate budget variance (with narrative)
   */
  async calculateBudgetVariance(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'budget_variance',
      attributeDescription: 'Percentage difference between actual cost and planned budget',
      inputData: {
        plannedBudget: projectData.budget || 0,
        actualCost: projectData.actualCost || 0,
        committedCosts: projectData.committedCosts || 0,
        remainingWork: projectData.remainingWork || 0
      },
      context: `Project: ${projectData.projectName}. Consider committed costs and remaining work.`,
      previousValue: projectData.previousVariance
    });
  }

  /**
   * Calculate schedule delay (with root cause)
   */
  async calculateScheduleDelay(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'schedule_delay',
      attributeDescription: 'Days behind schedule with likely root causes',
      inputData: {
        plannedEndDate: projectData.plannedEndDate,
        currentDate: new Date().toISOString(),
        completionPercentage: projectData.progress || 0,
        remainingTasks: projectData.remainingTasks || 0,
        blockedTasks: projectData.blockedTasks || 0,
        resourceAvailability: projectData.resourceAvailability || 100
      },
      context: `Project: ${projectData.projectName}. Identify likely reasons for delay.`
    });
  }

  /**
   * Calculate project health score (holistic)
   */
  async calculateProjectHealth(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'project_health_score',
      attributeDescription: 'Overall project health score (0-100) considering budget, schedule, risk, and quality',
      inputData: {
        budgetStatus: projectData.budgetStatus || 'unknown',
        scheduleStatus: projectData.scheduleStatus || 'unknown',
        riskLevel: projectData.riskLevel || 'medium',
        qualityScore: projectData.qualityScore || 0,
        stakeholderSatisfaction: projectData.stakeholderSatisfaction || 0,
        teamMorale: projectData.teamMorale || 0
      },
      context: `Project: ${projectData.projectName}. Provide holistic health assessment.`,
      previousValue: projectData.previousHealthScore
    });
  }

  /**
   * Calculate resource utilization
   */
  async calculateResourceUtilization(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'resource_utilization',
      attributeDescription: 'Percentage of resource capacity being used effectively',
      inputData: {
        allocatedHours: projectData.allocatedHours || 0,
        actualHours: projectData.actualHours || 0,
        teamSize: projectData.teamSize || 0,
        workingDays: projectData.workingDays || 0,
        idleTime: projectData.idleTime || 0
      },
      context: `Project: ${projectData.projectName}. Consider efficiency and waste.`
    });
  }

  /**
   * Calculate dependency health
   */
  async calculateDependencyHealth(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'dependency_health',
      attributeDescription: 'Health score for cross-project dependencies',
      inputData: {
        totalDependencies: projectData.totalDependencies || 0,
        blockedDependencies: projectData.blockedDependencies || 0,
        atRiskDependencies: projectData.atRiskDependencies || 0,
        resolvedDependencies: projectData.resolvedDependencies || 0
      },
      context: `Project: ${projectData.projectName}. Assess dependency risks.`
    });
  }

  /**
   * Calculate value realization score (for VRO)
   */
  async calculateValueRealization(projectData: any): Promise<CalculationResult> {
    return this.calculate({
      attributeName: 'value_realization',
      attributeDescription: 'Percentage of expected business value being realized',
      inputData: {
        expectedValue: projectData.expectedValue || 0,
        realizedValue: projectData.realizedValue || 0,
        completionPercentage: projectData.progress || 0,
        benefitsTracked: projectData.benefitsTracked || [],
        kpiProgress: projectData.kpiProgress || {}
      },
      context: `Project: ${projectData.projectName}. Assess actual vs expected business value.`
    });
  }
}

// Singleton instance
export function getLLMCalculator(): LLMCalculator {
  return LLMCalculator.getInstance();
}
