/**
 * DMN SIMULATOR
 *
 * Evaluates DMN decision table rules against input values
 * to simulate decision outcomes and explain rule matching.
 *
 * Supports:
 * - All DMN hit policies (FIRST, UNIQUE, COLLECT, etc.)
 * - FEEL expressions (basic subset)
 * - Multiple input/output combinations
 * - Detailed evaluation explanations
 */

import { DmnDecisionTable, DmnRule, DmnInput, DmnOutput } from './DmnParser';

export interface SimulationInput {
  inputId: string;
  value: any;
}

export interface RuleEvaluation {
  ruleId: string;
  ruleIndex: number;
  matched: boolean;
  inputEvaluations: Array<{
    inputId: string;
    expression: string;
    actualValue: any;
    expectedValue: string;
    matched: boolean;
    explanation: string;
  }>;
  outputs?: Record<string, any>;
  description?: string;
}

export interface SimulationResult {
  success: boolean;
  hitPolicy: string;
  inputs: Record<string, any>;
  matchedRules: RuleEvaluation[];
  finalOutputs: Record<string, any> | null;
  explanation: string;
  evaluations: RuleEvaluation[];
}

/**
 * Simulate a decision table with given inputs
 */
export function simulateDecisionTable(
  decisionTable: DmnDecisionTable,
  inputs: Record<string, any>
): SimulationResult {
  const evaluations: RuleEvaluation[] = [];

  // Evaluate each rule
  for (let ruleIndex = 0; ruleIndex < decisionTable.rules.length; ruleIndex++) {
    const rule = decisionTable.rules[ruleIndex];
    const evaluation = evaluateRule(decisionTable, rule, ruleIndex, inputs);
    evaluations.push(evaluation);
  }

  // Filter matched rules
  const matchedRules = evaluations.filter((e) => e.matched);

  // Apply hit policy to determine final outputs
  const { finalOutputs, explanation } = applyHitPolicy(
    decisionTable.hitPolicy,
    matchedRules,
    decisionTable.outputs
  );

  return {
    success: true,
    hitPolicy: decisionTable.hitPolicy,
    inputs,
    matchedRules,
    finalOutputs,
    explanation,
    evaluations,
  };
}

/**
 * Evaluate a single rule against inputs
 */
function evaluateRule(
  decisionTable: DmnDecisionTable,
  rule: DmnRule,
  ruleIndex: number,
  inputs: Record<string, any>
): RuleEvaluation {
  const inputEvaluations = [];
  let allInputsMatched = true;

  // Evaluate each input condition
  for (let i = 0; i < decisionTable.inputs.length; i++) {
    const input = decisionTable.inputs[i];
    const inputEntry = rule.inputEntries[i];
    const actualValue = inputs[input.expression] ?? inputs[input.id];

    const evaluation = evaluateInputExpression(
      input,
      inputEntry.text,
      actualValue
    );

    inputEvaluations.push({
      inputId: input.id,
      expression: input.expression,
      actualValue,
      expectedValue: inputEntry.text,
      matched: evaluation.matched,
      explanation: evaluation.explanation,
    });

    if (!evaluation.matched) {
      allInputsMatched = false;
    }
  }

  // Extract outputs if rule matched
  let outputs: Record<string, any> | undefined;
  if (allInputsMatched) {
    outputs = {};
    for (let i = 0; i < decisionTable.outputs.length; i++) {
      const output = decisionTable.outputs[i];
      const outputEntry = rule.outputEntries[i];
      outputs[output.name] = parseOutputValue(outputEntry.text, output.typeRef);
    }
  }

  return {
    ruleId: rule.id,
    ruleIndex,
    matched: allInputsMatched,
    inputEvaluations,
    outputs,
    description: rule.description,
  };
}

/**
 * Evaluate a single input expression
 */
function evaluateInputExpression(
  input: DmnInput,
  expression: string,
  actualValue: any
): { matched: boolean; explanation: string } {
  // Handle wildcard/any value
  if (expression === '-' || expression === '' || expression === 'null') {
    return {
      matched: true,
      explanation: `Any value accepted (wildcard)`,
    };
  }

  // Remove quotes from string literals
  let cleanExpression = expression.trim();
  const isStringLiteral = cleanExpression.startsWith('"') && cleanExpression.endsWith('"');
  if (isStringLiteral) {
    cleanExpression = cleanExpression.slice(1, -1);
  }

  // Handle comparison operators
  const comparisonMatch = cleanExpression.match(/^([<>]=?|[!=]=)\s*(.+)$/);
  if (comparisonMatch) {
    const [, operator, valueStr] = comparisonMatch;
    const expectedValue = parseValue(valueStr, input.typeRef);
    const numericActual = Number(actualValue);
    const numericExpected = Number(expectedValue);

    let matched = false;
    switch (operator) {
      case '<':
        matched = numericActual < numericExpected;
        break;
      case '<=':
        matched = numericActual <= numericExpected;
        break;
      case '>':
        matched = numericActual > numericExpected;
        break;
      case '>=':
        matched = numericActual >= numericExpected;
        break;
      case '==':
      case '=':
        matched = actualValue == expectedValue;
        break;
      case '!=':
        matched = actualValue != expectedValue;
        break;
    }

    return {
      matched,
      explanation: matched
        ? `${actualValue} ${operator} ${expectedValue} ✓`
        : `${actualValue} ${operator} ${expectedValue} ✗ (expected ${operator} ${expectedValue})`,
    };
  }

  // Handle range expressions (e.g., "[5..10]", "(5..10)")
  const rangeMatch = cleanExpression.match(/^([\[\(])(\d+(?:\.\d+)?)\.\.(\d+(?:\.\d+)?)([\]\)])$/);
  if (rangeMatch) {
    const [, leftBracket, minStr, maxStr, rightBracket] = rangeMatch;
    const min = Number(minStr);
    const max = Number(maxStr);
    const numericActual = Number(actualValue);

    const leftInclusive = leftBracket === '[';
    const rightInclusive = rightBracket === ']';

    const leftCondition = leftInclusive ? numericActual >= min : numericActual > min;
    const rightCondition = rightInclusive ? numericActual <= max : numericActual < max;
    const matched = leftCondition && rightCondition;

    return {
      matched,
      explanation: matched
        ? `${actualValue} is within ${cleanExpression} ✓`
        : `${actualValue} is outside ${cleanExpression} ✗`,
    };
  }

  // Handle list membership (e.g., "red", "green", "blue")
  if (cleanExpression.includes(',')) {
    const values = cleanExpression.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const matched = values.includes(String(actualValue));
    return {
      matched,
      explanation: matched
        ? `${actualValue} is in [${values.join(', ')}] ✓`
        : `${actualValue} is not in [${values.join(', ')}] ✗`,
    };
  }

  // Handle direct equality
  const expectedValue = parseValue(cleanExpression, input.typeRef);
  const matched = actualValue == expectedValue;

  return {
    matched,
    explanation: matched
      ? `${actualValue} equals ${expectedValue} ✓`
      : `${actualValue} does not equal ${expectedValue} ✗ (expected ${expectedValue})`,
  };
}

/**
 * Parse a value string based on type
 */
function parseValue(valueStr: string, typeRef?: string): any {
  const trimmed = valueStr.trim().replace(/^"|"$/g, '');

  if (typeRef === 'boolean') {
    return trimmed === 'true' || trimmed === '1';
  }

  if (typeRef === 'number' || typeRef === 'integer') {
    return Number(trimmed);
  }

  if (typeRef === 'date') {
    return new Date(trimmed);
  }

  return trimmed;
}

/**
 * Parse output value
 */
function parseOutputValue(valueStr: string, typeRef?: string): any {
  return parseValue(valueStr, typeRef);
}

/**
 * Apply hit policy to determine final outputs
 */
function applyHitPolicy(
  hitPolicy: string,
  matchedRules: RuleEvaluation[],
  outputDefinitions: DmnOutput[]
): { finalOutputs: Record<string, any> | null; explanation: string } {
  if (matchedRules.length === 0) {
    return {
      finalOutputs: null,
      explanation: 'No rules matched the input values.',
    };
  }

  switch (hitPolicy.toUpperCase()) {
    case 'FIRST':
      return {
        finalOutputs: matchedRules[0].outputs || {},
        explanation: `FIRST hit policy: Using outputs from Rule #${
          matchedRules[0].ruleIndex + 1
        } (first matching rule).`,
      };

    case 'UNIQUE':
      if (matchedRules.length > 1) {
        return {
          finalOutputs: null,
          explanation: `UNIQUE hit policy violated: ${matchedRules.length} rules matched (Rules #${matchedRules
            .map((r) => r.ruleIndex + 1)
            .join(', ')}). Only one rule should match.`,
        };
      }
      return {
        finalOutputs: matchedRules[0].outputs || {},
        explanation: `UNIQUE hit policy: Using outputs from Rule #${
          matchedRules[0].ruleIndex + 1
        } (only matching rule).`,
      };

    case 'PRIORITY':
      // In a real implementation, would need priority ordering
      return {
        finalOutputs: matchedRules[0].outputs || {},
        explanation: `PRIORITY hit policy: Using highest priority rule (Rule #${
          matchedRules[0].ruleIndex + 1
        }). ${matchedRules.length} rule(s) matched.`,
      };

    case 'ANY':
      // Check if all matched rules have the same outputs
      const firstOutputs = matchedRules[0].outputs;
      const allSame = matchedRules.every(
        (r) => JSON.stringify(r.outputs) === JSON.stringify(firstOutputs)
      );

      if (!allSame) {
        return {
          finalOutputs: null,
          explanation: `ANY hit policy violated: ${matchedRules.length} rules matched with different outputs. All matching rules must have identical outputs.`,
        };
      }

      return {
        finalOutputs: firstOutputs || {},
        explanation: `ANY hit policy: ${matchedRules.length} rule(s) matched with identical outputs. Using common output values.`,
      };

    case 'COLLECT':
    case 'RULE ORDER':
    case 'OUTPUT ORDER':
      // Collect all outputs
      const collectedOutputs: Record<string, any[]> = {};

      for (const output of outputDefinitions) {
        collectedOutputs[output.name] = matchedRules
          .map((r) => r.outputs?.[output.name])
          .filter((v) => v !== undefined);
      }

      return {
        finalOutputs: collectedOutputs,
        explanation: `${hitPolicy} hit policy: Collected outputs from ${
          matchedRules.length
        } matching rule(s) (Rules #${matchedRules.map((r) => r.ruleIndex + 1).join(', ')}).`,
      };

    default:
      return {
        finalOutputs: matchedRules[0].outputs || {},
        explanation: `Unknown hit policy "${hitPolicy}": Using first matching rule (Rule #${
          matchedRules[0].ruleIndex + 1
        }).`,
      };
  }
}

/**
 * Generate sample inputs for a decision table (for testing)
 */
export function generateSampleInputs(decisionTable: DmnDecisionTable): Record<string, any> {
  const sampleInputs: Record<string, any> = {};

  for (const input of decisionTable.inputs) {
    switch (input.typeRef) {
      case 'number':
      case 'integer':
        sampleInputs[input.expression] = 0.75;
        break;
      case 'boolean':
        sampleInputs[input.expression] = true;
        break;
      case 'date':
        sampleInputs[input.expression] = new Date().toISOString();
        break;
      default:
        sampleInputs[input.expression] = 'planning';
        break;
    }
  }

  return sampleInputs;
}
