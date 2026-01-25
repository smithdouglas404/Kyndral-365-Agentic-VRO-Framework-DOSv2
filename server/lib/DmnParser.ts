/**
 * DMN PARSER
 *
 * Parses DMN (Decision Model and Notation) XML files
 * into structured data for display in the UI.
 *
 * DMN Structure:
 * - Decision Table: Input expressions → Output expressions
 * - Rules: Combinations of inputs that produce outputs
 * - Hit Policy: How rules are evaluated (FIRST, COLLECT, etc.)
 */

import * as xml2js from 'xml2js';

export interface DmnInput {
  id: string;
  label: string;
  expression: string;
  typeRef?: string;
}

export interface DmnOutput {
  id: string;
  label: string;
  name: string;
  typeRef?: string;
}

export interface DmnRule {
  id: string;
  inputEntries: Array<{
    id: string;
    text: string;
  }>;
  outputEntries: Array<{
    id: string;
    text: string;
  }>;
  description?: string;
}

export interface DmnDecisionTable {
  id: string;
  name: string;
  hitPolicy: 'FIRST' | 'UNIQUE' | 'PRIORITY' | 'ANY' | 'COLLECT' | 'RULE ORDER' | 'OUTPUT ORDER';
  inputs: DmnInput[];
  outputs: DmnOutput[];
  rules: DmnRule[];
  description?: string;
}

export interface ParsedDmn {
  name: string;
  id: string;
  namespace: string;
  decisionTables: DmnDecisionTable[];
}

/**
 * Parse DMN XML into structured format
 */
export async function parseDmnXml(xml: string): Promise<ParsedDmn> {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    normalize: true,
    normalizeTags: true,
    trim: true,
  });

  try {
    const result = await parser.parseStringPromise(xml);

    // Navigate DMN structure
    const definitions = result['definitions'] || result['dmn:definitions'];

    if (!definitions) {
      throw new Error('Invalid DMN XML: No definitions element found');
    }

    const namespace = definitions['namespace'] || definitions['targetNamespace'] || 'unknown';
    const name = definitions['name'] || 'Unnamed Decision';
    const id = definitions['id'] || 'unknown-id';

    // Extract decisions
    const decisions = Array.isArray(definitions['decision'])
      ? definitions['decision']
      : definitions['decision']
      ? [definitions['decision']]
      : [];

    const decisionTables: DmnDecisionTable[] = [];

    for (const decision of decisions) {
      const decisionTable = decision['decisiontable'] || decision['decisionTable'];

      if (decisionTable) {
        decisionTables.push(parseDecisionTable(decision, decisionTable));
      }
    }

    return {
      name,
      id,
      namespace,
      decisionTables,
    };
  } catch (error) {
    console.error('[DmnParser] Failed to parse DMN XML:', error);
    throw new Error(`DMN parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse a single decision table
 */
function parseDecisionTable(decision: any, decisionTable: any): DmnDecisionTable {
  const id = decision['id'] || 'unknown-decision';
  const name = decision['name'] || 'Unnamed Decision';
  const hitPolicy = (decisionTable['hitpolicy'] || 'FIRST').toUpperCase();
  const description = decision['description'] || undefined;

  // Parse inputs
  const inputs: DmnInput[] = [];
  const inputElements = Array.isArray(decisionTable['input'])
    ? decisionTable['input']
    : decisionTable['input']
    ? [decisionTable['input']]
    : [];

  for (const input of inputElements) {
    const inputExpression = input['inputexpression'] || input['inputExpression'] || {};
    inputs.push({
      id: input['id'] || `input-${inputs.length}`,
      label: input['label'] || `Input ${inputs.length + 1}`,
      expression: inputExpression['text'] || inputExpression['_'] || '',
      typeRef: inputExpression['typeref'] || inputExpression['typeRef'] || 'string',
    });
  }

  // Parse outputs
  const outputs: DmnOutput[] = [];
  const outputElements = Array.isArray(decisionTable['output'])
    ? decisionTable['output']
    : decisionTable['output']
    ? [decisionTable['output']]
    : [];

  for (const output of outputElements) {
    outputs.push({
      id: output['id'] || `output-${outputs.length}`,
      label: output['label'] || output['name'] || `Output ${outputs.length + 1}`,
      name: output['name'] || `output${outputs.length + 1}`,
      typeRef: output['typeref'] || output['typeRef'] || 'string',
    });
  }

  // Parse rules
  const rules: DmnRule[] = [];
  const ruleElements = Array.isArray(decisionTable['rule'])
    ? decisionTable['rule']
    : decisionTable['rule']
    ? [decisionTable['rule']]
    : [];

  for (const rule of ruleElements) {
    const inputEntries = Array.isArray(rule['inputentry'] || rule['inputEntry'])
      ? (rule['inputentry'] || rule['inputEntry'])
      : (rule['inputentry'] || rule['inputEntry'])
      ? [rule['inputentry'] || rule['inputEntry']]
      : [];

    const outputEntries = Array.isArray(rule['outputentry'] || rule['outputEntry'])
      ? (rule['outputentry'] || rule['outputEntry'])
      : (rule['outputentry'] || rule['outputEntry'])
      ? [rule['outputentry'] || rule['outputEntry']]
      : [];

    rules.push({
      id: rule['id'] || `rule-${rules.length}`,
      inputEntries: inputEntries.map((entry: any, idx: number) => ({
        id: entry['id'] || `input-entry-${idx}`,
        text: entry['text'] || entry['_'] || '-',
      })),
      outputEntries: outputEntries.map((entry: any, idx: number) => ({
        id: entry['id'] || `output-entry-${idx}`,
        text: entry['text'] || entry['_'] || '-',
      })),
      description: rule['description'],
    });
  }

  return {
    id,
    name,
    hitPolicy,
    inputs,
    outputs,
    rules,
    description,
  };
}

/**
 * Generate sample DMN for testing/demo purposes
 */
export function generateSampleDmn(decisionName: string): ParsedDmn {
  return {
    name: `${decisionName} Decision`,
    id: `decision-${decisionName.toLowerCase().replace(/\s+/g, '-')}`,
    namespace: 'http://example.com/dmn',
    decisionTables: [
      {
        id: `table-${decisionName.toLowerCase().replace(/\s+/g, '-')}`,
        name: decisionName,
        hitPolicy: 'FIRST',
        inputs: [
          {
            id: 'input-1',
            label: 'CPI (Cost Performance Index)',
            expression: 'cpi',
            typeRef: 'number',
          },
          {
            id: 'input-2',
            label: 'Risk Score',
            expression: 'riskScore',
            typeRef: 'number',
          },
          {
            id: 'input-3',
            label: 'Project Phase',
            expression: 'projectPhase',
            typeRef: 'string',
          },
        ],
        outputs: [
          {
            id: 'output-1',
            label: 'Should Collaborate',
            name: 'shouldCollaborate',
            typeRef: 'boolean',
          },
          {
            id: 'output-2',
            label: 'Target Agents',
            name: 'targetAgents',
            typeRef: 'string',
          },
          {
            id: 'output-3',
            label: 'Priority',
            name: 'priority',
            typeRef: 'string',
          },
        ],
        rules: [
          {
            id: 'rule-1',
            inputEntries: [
              { id: 'rule-1-input-1', text: '< 0.7' },
              { id: 'rule-1-input-2', text: '> 8' },
              { id: 'rule-1-input-3', text: '"execution"' },
            ],
            outputEntries: [
              { id: 'rule-1-output-1', text: 'true' },
              { id: 'rule-1-output-2', text: '"tmo,risk,governance"' },
              { id: 'rule-1-output-3', text: '"urgent"' },
            ],
            description: 'Critical: Low CPI + High Risk in execution phase → Urgent escalation',
          },
          {
            id: 'rule-2',
            inputEntries: [
              { id: 'rule-2-input-1', text: '< 0.85' },
              { id: 'rule-2-input-2', text: '> 5' },
              { id: 'rule-2-input-3', text: '-' },
            ],
            outputEntries: [
              { id: 'rule-2-output-1', text: 'true' },
              { id: 'rule-2-output-2', text: '"tmo,risk"' },
              { id: 'rule-2-output-3', text: '"high"' },
            ],
            description: 'High: Low CPI + Moderate Risk → Alert TMO and Risk',
          },
          {
            id: 'rule-3',
            inputEntries: [
              { id: 'rule-3-input-1', text: '< 0.9' },
              { id: 'rule-3-input-2', text: '-' },
              { id: 'rule-3-input-3', text: '"planning"' },
            ],
            outputEntries: [
              { id: 'rule-3-output-1', text: 'true' },
              { id: 'rule-3-output-2', text: '"finops"' },
              { id: 'rule-3-output-3', text: '"medium"' },
            ],
            description: 'Medium: Low CPI in planning → Alert FinOps for review',
          },
          {
            id: 'rule-4',
            inputEntries: [
              { id: 'rule-4-input-1', text: '>= 0.9' },
              { id: 'rule-4-input-2', text: '<= 5' },
              { id: 'rule-4-input-3', text: '-' },
            ],
            outputEntries: [
              { id: 'rule-4-output-1', text: 'false' },
              { id: 'rule-4-output-2', text: '""' },
              { id: 'rule-4-output-3', text: '"low"' },
            ],
            description: 'Low: Good CPI + Low Risk → No collaboration needed',
          },
        ],
        description: 'Determines when and which agents should collaborate based on project metrics',
      },
    ],
  };
}

/**
 * Format DMN table as Markdown for documentation
 */
export function formatDmnAsMarkdown(dmn: ParsedDmn): string {
  let md = `# ${dmn.name}\n\n`;

  for (const table of dmn.decisionTables) {
    md += `## ${table.name}\n\n`;

    if (table.description) {
      md += `${table.description}\n\n`;
    }

    md += `**Hit Policy:** ${table.hitPolicy}\n\n`;

    // Header row
    md += '| ';
    table.inputs.forEach((input) => {
      md += `${input.label} | `;
    });
    table.outputs.forEach((output) => {
      md += `${output.label} | `;
    });
    md += '\n';

    // Separator
    md += '| ';
    table.inputs.forEach(() => md += '--- | ');
    table.outputs.forEach(() => md += '--- | ');
    md += '\n';

    // Rules
    table.rules.forEach((rule) => {
      md += '| ';
      rule.inputEntries.forEach((entry) => {
        md += `${entry.text} | `;
      });
      rule.outputEntries.forEach((entry) => {
        md += `${entry.text} | `;
      });
      md += '\n';
    });

    md += '\n';
  }

  return md;
}
