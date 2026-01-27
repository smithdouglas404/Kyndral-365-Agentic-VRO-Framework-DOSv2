/**
 * RULE PROMPT GENERATOR
 *
 * When a rule needs to check a calculated attribute, we:
 * 1. Select the variables needed (from input data)
 * 2. Generate the correct LLM prompt
 * 3. Get value + narrative + sources back
 * 4. Evaluate rule condition
 *
 * NO MORE HARDCODED FORMULAS IN RULES!
 */

import { getLLMCalculator, type CalculationRequest } from './LLMCalculator.js';

export interface RuleVariable {
  name: string;
  source: 'database' | 'agent' | 'api' | 'calculated';
  valueType: 'number' | 'string' | 'boolean' | 'object';
  calculatedBy?: 'llm' | 'formula'; // If source is 'calculated'
}

export interface RuleEvaluationContext {
  ruleId: string;
  ruleName: string;
  agentId: string;
  entity: string; // project_123, portfolio_5, etc.
  inputData: Record<string, any>;
  variables: RuleVariable[];
}

export interface RuleEvaluationResult {
  conditionMet: boolean;
  calculatedValues: Record<string, {
    value: any;
    narrative: string;
    reasoning: string;
    sources: string[];
    confidence: number;
  }>;
  evaluationTime: number; // milliseconds
}

export class RulePromptGenerator {
  private static instance: RulePromptGenerator;
  private llmCalculator = getLLMCalculator();

  private constructor() {}

  public static getInstance(): RulePromptGenerator {
    if (!RulePromptGenerator.instance) {
      RulePromptGenerator.instance = new RulePromptGenerator();
    }
    return RulePromptGenerator.instance;
  }

  /**
   * Evaluate rule with LLM-calculated variables
   */
  async evaluateRule(context: RuleEvaluationContext, condition: any): Promise<RuleEvaluationResult> {
    const startTime = Date.now();

    try {
      console.log(`[RulePromptGen] Evaluating rule: ${context.ruleName}`);

      // Step 1: Identify which variables need LLM calculation
      const calculatedVariables = context.variables.filter(v => v.source === 'calculated' && v.calculatedBy === 'llm');

      // Step 2: Calculate each variable using LLM
      const calculatedValues: Record<string, any> = {};

      for (const variable of calculatedVariables) {
        const result = await this.calculateVariable(variable, context);
        calculatedValues[variable.name] = result;
      }

      // Step 3: Add non-calculated variables
      for (const variable of context.variables) {
        if (variable.source !== 'calculated') {
          calculatedValues[variable.name] = {
            value: context.inputData[variable.name],
            narrative: `Direct value from ${variable.source}`,
            reasoning: 'No calculation needed',
            sources: [variable.name],
            confidence: 1.0
          };
        }
      }

      // Step 4: Evaluate condition with calculated values
      const conditionMet = this.evaluateCondition(condition, calculatedValues);

      const evaluationTime = Date.now() - startTime;

      console.log(`[RulePromptGen] ✅ Rule evaluated in ${evaluationTime}ms. Condition met: ${conditionMet}`);

      return {
        conditionMet,
        calculatedValues,
        evaluationTime
      };
    } catch (error: any) {
      console.error(`[RulePromptGen] Evaluation error:`, error.message);
      throw error;
    }
  }

  /**
   * Calculate a single variable using LLM
   */
  private async calculateVariable(variable: RuleVariable, context: RuleEvaluationContext): Promise<any> {
    // Map variable name to specialized calculator
    const calculationRequest: CalculationRequest = {
      attributeName: variable.name,
      attributeDescription: this.getVariableDescription(variable.name),
      inputData: context.inputData
    };

    // Use specialized calculator if available
    switch (variable.name) {
      case 'wip_score':
        return await this.llmCalculator.calculateWIP(context.inputData);

      case 'budget_variance':
        return await this.llmCalculator.calculateBudgetVariance(context.inputData);

      case 'schedule_delay':
        return await this.llmCalculator.calculateScheduleDelay(context.inputData);

      case 'project_health_score':
        return await this.llmCalculator.calculateProjectHealth(context.inputData);

      case 'resource_utilization':
        return await this.llmCalculator.calculateResourceUtilization(context.inputData);

      case 'dependency_health':
        return await this.llmCalculator.calculateDependencyHealth(context.inputData);

      case 'value_realization':
        return await this.llmCalculator.calculateValueRealization(context.inputData);

      default:
        // Generic calculation
        return await this.llmCalculator.calculate(calculationRequest);
    }
  }

  /**
   * Get description for variable
   */
  private getVariableDescription(variableName: string): string {
    const descriptions: Record<string, string> = {
      wip_score: 'Work In Progress efficiency score',
      budget_variance: 'Budget variance percentage',
      schedule_delay: 'Schedule delay in days',
      project_health_score: 'Overall project health (0-100)',
      resource_utilization: 'Resource utilization percentage',
      dependency_health: 'Dependency health score',
      value_realization: 'Business value realization percentage',
      burn_rate: 'Budget burn rate',
      risk_score: 'Overall risk score',
      quality_score: 'Quality and predictability score'
    };

    return descriptions[variableName] || `Calculated value for ${variableName}`;
  }

  /**
   * Evaluate condition with calculated values
   */
  private evaluateCondition(condition: any, values: Record<string, any>): boolean {
    try {
      // Handle json-rules-engine format
      if (condition.all) {
        return condition.all.every((subCondition: any) =>
          this.evaluateSingleCondition(subCondition, values)
        );
      } else if (condition.any) {
        return condition.any.some((subCondition: any) =>
          this.evaluateSingleCondition(subCondition, values)
        );
      } else {
        return this.evaluateSingleCondition(condition, values);
      }
    } catch (error: any) {
      console.error('[RulePromptGen] Condition evaluation error:', error.message);
      return false;
    }
  }

  /**
   * Evaluate single condition
   */
  private evaluateSingleCondition(condition: any, values: Record<string, any>): boolean {
    const { fact, operator, value: conditionValue } = condition;

    const factData = values[fact];
    if (!factData) {
      console.warn(`[RulePromptGen] Fact not found: ${fact}`);
      return false;
    }

    const actualValue = factData.value;

    switch (operator) {
      case 'equal':
      case 'equals':
        return actualValue === conditionValue;

      case 'notEqual':
        return actualValue !== conditionValue;

      case 'greaterThan':
        return Number(actualValue) > Number(conditionValue);

      case 'greaterThanInclusive':
        return Number(actualValue) >= Number(conditionValue);

      case 'lessThan':
        return Number(actualValue) < Number(conditionValue);

      case 'lessThanInclusive':
        return Number(actualValue) <= Number(conditionValue);

      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(actualValue);

      case 'notIn':
        return Array.isArray(conditionValue) && !conditionValue.includes(actualValue);

      case 'contains':
        return String(actualValue).includes(String(conditionValue));

      default:
        console.warn(`[RulePromptGen] Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Generate prompt for rule explanation (for debugging/audit)
   */
  generateRuleExplanationPrompt(
    ruleName: string,
    condition: any,
    calculatedValues: Record<string, any>
  ): string {
    return `Explain why rule "${ruleName}" triggered:

**Condition**: ${JSON.stringify(condition, null, 2)}

**Calculated Values**:
${Object.entries(calculatedValues).map(([key, val]) => `
- ${key}: ${val.value}
  Narrative: ${val.narrative}
  Reasoning: ${val.reasoning}
  Confidence: ${(val.confidence * 100).toFixed(0)}%
`).join('\n')}

Provide a clear explanation for non-technical stakeholders.`;
  }
}

// Singleton instance
export function getRulePromptGenerator(): RulePromptGenerator {
  return RulePromptGenerator.getInstance();
}

/**
 * EXAMPLE USAGE
 *
 * Instead of hardcoded:
 * ```
 * const variance = (actualCost - budget) / budget;
 * if (variance > 0.20) {
 *   alert("Budget overrun!");
 * }
 * ```
 *
 * We use:
 * ```
 * const result = await rulePromptGen.evaluateRule({
 *   ruleId: 'rule_123',
 *   ruleName: 'Budget Overrun Alert',
 *   agentId: 'finops',
 *   entity: 'project_123',
 *   inputData: {
 *     budget: 1000000,
 *     actualCost: 1250000,
 *     projectName: 'ERP Migration'
 *   },
 *   variables: [
 *     { name: 'budget_variance', source: 'calculated', calculatedBy: 'llm', valueType: 'number' }
 *   ]
 * }, {
 *   all: [
 *     { fact: 'budget_variance', operator: 'greaterThan', value: 0.20 }
 *   ]
 * });
 *
 * // result.conditionMet = true
 * // result.calculatedValues.budget_variance = {
 * //   value: 0.25,
 * //   narrative: "Project is 25% over budget due to extended timeline and additional resources",
 * //   reasoning: "Actual cost ($1.25M) exceeds budget ($1M) by $250K",
 * //   sources: ["budget", "actualCost"],
 * //   confidence: 0.95
 * // }
 * ```
 */
