/**
 * BUILD LANGFLOW SCENARIO WORKFLOWS
 *
 * Creates the 4 Logic Gate scenario workflows in Langflow via API
 * Run: tsx server/scripts/build-langflow-scenarios.ts
 */

import fetch from 'node-fetch';

const LANGFLOW_API_URL = process.env.LANGFLOW_API_URL || 'https://aws-us-east-2.langflow.datastax.com/lf/ed39ba15-ded9-4b54-9389-4f58e97b6a57/api/v1';
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || '';
const LANGFLOW_ORG_ID = process.env.LANGFLOW_ORG_ID || '';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5000';

interface FlowNode {
  id: string;
  type: string;
  data: {
    node: {
      base_classes: string[];
      description: string;
      display_name: string;
      template: Record<string, any>;
    };
  };
  position: { x: number; y: number };
}

interface FlowEdge {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface FlowDefinition {
  name: string;
  description: string;
  data: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
}

/**
 * Create HTTP POST node for API calls
 */
function createHTTPNode(
  id: string,
  url: string,
  method: string,
  body: Record<string, any>,
  position: { x: number; y: number }
): FlowNode {
  return {
    id,
    type: 'HTTPRequest',
    data: {
      node: {
        base_classes: ['Data'],
        description: 'Make HTTP request to server API',
        display_name: 'HTTP Request',
        template: {
          url: { value: url },
          method: { value: method },
          headers: { value: JSON.stringify({ 'Content-Type': 'application/json' }) },
          body: { value: JSON.stringify(body) },
          timeout: { value: 30 }
        }
      }
    },
    position
  };
}

/**
 * SCENARIO A: Budget Overrun
 * FinOps ↔ PMO ↔ VRO
 */
function buildScenarioA(): FlowDefinition {
  const nodes: FlowNode[] = [
    // Input node
    {
      id: 'input-1',
      type: 'ChatInput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Receive trigger from Logic Gate',
          display_name: 'Gate Trigger Input',
          template: {
            input_value: { value: '' }
          }
        }
      },
      position: { x: 100, y: 100 }
    },

    // Parse input JSON
    {
      id: 'parse-1',
      type: 'ParseData',
      data: {
        node: {
          base_classes: ['Data'],
          description: 'Parse gate payload',
          display_name: 'Parse Payload',
          template: {
            data: { value: '' }
          }
        }
      },
      position: { x: 100, y: 200 }
    },

    // Block PMO Epic
    createHTTPNode(
      'http-pmo-1',
      `${SERVER_BASE_URL}/api/agent-actions/pmo/set-flow-status`,
      'POST',
      {
        projectId: '{{projectId}}',
        epicId: '{{epicId}}',
        flowStatus: 'Blocked',
        reason: 'Budget overrun detected'
      },
      { x: 300, y: 300 }
    ),

    // Recalculate VRO ROI
    createHTTPNode(
      'http-vro-1',
      `${SERVER_BASE_URL}/api/agent-actions/vro/recalculate-roi`,
      'POST',
      {
        projectId: '{{projectId}}',
        actualSpend: '{{actualSpend}}',
        allocatedBudget: '{{allocatedBudget}}'
      },
      { x: 300, y: 450 }
    ),

    // Create Jira issue (optional - will fail gracefully if not configured)
    createHTTPNode(
      'http-jira-1',
      `${SERVER_BASE_URL}/api/agent-actions/jira/create-issue`,
      'POST',
      {
        projectKey: 'PMO',
        summary: 'Budget Overrun - Epic Blocked',
        description: 'Budget exceeded: {{actualSpend}} > {{allocatedBudget}}',
        priority: 'Critical',
        issuetype: 'Task',
        agentId: 'finops'
      },
      { x: 300, y: 600 }
    ),

    // Send Slack notification (optional)
    createHTTPNode(
      'http-slack-1',
      `${SERVER_BASE_URL}/api/agent-actions/slack/notify`,
      'POST',
      {
        channel: '#budget-alerts',
        text: '@channel Critical: Budget overrun detected on project {{projectId}}',
        agentId: 'finops'
      },
      { x: 300, y: 750 }
    ),

    // Output node
    {
      id: 'output-1',
      type: 'ChatOutput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Return success status',
          display_name: 'Response',
          template: {
            output_value: { value: '' }
          }
        }
      },
      position: { x: 600, y: 500 }
    }
  ];

  const edges: FlowEdge[] = [
    { source: 'input-1', target: 'parse-1' },
    { source: 'parse-1', target: 'http-pmo-1' },
    { source: 'http-pmo-1', target: 'http-vro-1' },
    { source: 'http-vro-1', target: 'http-jira-1' },
    { source: 'http-jira-1', target: 'http-slack-1' },
    { source: 'http-slack-1', target: 'output-1' }
  ];

  return {
    name: 'Scenario A: Budget Overrun',
    description: 'Auto-response when project exceeds allocated budget (FinOps ↔ PMO ↔ VRO)',
    data: { nodes, edges }
  };
}

/**
 * SCENARIO B: Burnout Brake
 * OCM ↔ Planning ↔ TMO
 */
function buildScenarioB(): FlowDefinition {
  const nodes: FlowNode[] = [
    {
      id: 'input-1',
      type: 'ChatInput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Receive trigger from Logic Gate',
          display_name: 'Gate Trigger Input',
          template: { input_value: { value: '' } }
        }
      },
      position: { x: 100, y: 100 }
    },

    {
      id: 'parse-1',
      type: 'ParseData',
      data: {
        node: {
          base_classes: ['Data'],
          description: 'Parse gate payload',
          display_name: 'Parse Payload',
          template: { data: { value: '' } }
        }
      },
      position: { x: 100, y: 200 }
    },

    // Invalidate Planning capacity
    createHTTPNode(
      'http-planning-1',
      `${SERVER_BASE_URL}/api/agent-actions/planning/invalidate-capacity`,
      'POST',
      {
        projectId: '{{projectId}}',
        reason: 'High burnout risk detected (burnoutRiskIdx: {{burnoutRiskIdx}})'
      },
      { x: 300, y: 300 }
    ),

    // Schedule TMO coaching
    createHTTPNode(
      'http-tmo-1',
      `${SERVER_BASE_URL}/api/agent-actions/tmo/schedule-coaching`,
      'POST',
      {
        teamId: '{{teamId}}',
        projectId: '{{projectId}}',
        reason: 'Burnout prevention - risk index above 0.85'
      },
      { x: 300, y: 450 }
    ),

    // Create ServiceNow incident
    createHTTPNode(
      'http-servicenow-1',
      `${SERVER_BASE_URL}/api/agent-actions/servicenow/create-incident`,
      'POST',
      {
        shortDescription: 'Team Burnout Risk - HR Intervention Required',
        description: 'Team {{teamId}} burnout risk: {{burnoutRiskIdx}}',
        priority: '2',
        urgency: '2',
        impact: '2',
        category: 'HR',
        agentId: 'ocm'
      },
      { x: 300, y: 600 }
    ),

    // Slack notification
    createHTTPNode(
      'http-slack-1',
      `${SERVER_BASE_URL}/api/agent-actions/slack/notify`,
      'POST',
      {
        channel: '#team-health',
        text: 'High burnout risk detected on team {{teamId}} - capacity reduced and coaching scheduled',
        agentId: 'ocm'
      },
      { x: 300, y: 750 }
    ),

    {
      id: 'output-1',
      type: 'ChatOutput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Return success status',
          display_name: 'Response',
          template: { output_value: { value: '' } }
        }
      },
      position: { x: 600, y: 500 }
    }
  ];

  const edges: FlowEdge[] = [
    { source: 'input-1', target: 'parse-1' },
    { source: 'parse-1', target: 'http-planning-1' },
    { source: 'http-planning-1', target: 'http-tmo-1' },
    { source: 'http-tmo-1', target: 'http-servicenow-1' },
    { source: 'http-servicenow-1', target: 'http-slack-1' },
    { source: 'http-slack-1', target: 'output-1' }
  ];

  return {
    name: 'Scenario B: Burnout Brake',
    description: 'Auto-response when team burnout risk detected (OCM ↔ Planning ↔ TMO)',
    data: { nodes, edges }
  };
}

/**
 * SCENARIO C: Regulatory Deadbolt
 * Risk ↔ Governance ↔ PMO
 */
function buildScenarioC(): FlowDefinition {
  const nodes: FlowNode[] = [
    {
      id: 'input-1',
      type: 'ChatInput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Receive trigger from Logic Gate',
          display_name: 'Gate Trigger Input',
          template: { input_value: { value: '' } }
        }
      },
      position: { x: 100, y: 100 }
    },

    {
      id: 'parse-1',
      type: 'ParseData',
      data: {
        node: {
          base_classes: ['Data'],
          description: 'Parse gate payload',
          display_name: 'Parse Payload',
          template: { data: { value: '' } }
        }
      },
      position: { x: 100, y: 200 }
    },

    // Block Governance gate
    createHTTPNode(
      'http-governance-1',
      `${SERVER_BASE_URL}/api/agent-actions/governance/block-gate`,
      'POST',
      {
        projectId: '{{projectId}}',
        reason: 'Legal exposure exceeds $100K or critical vulnerabilities detected',
        severity: 'critical'
      },
      { x: 300, y: 300 }
    ),

    // Move PMO epic back to Analyzing
    createHTTPNode(
      'http-pmo-1',
      `${SERVER_BASE_URL}/api/agent-actions/pmo/set-flow-status`,
      'POST',
      {
        projectId: '{{projectId}}',
        epicId: '{{epicId}}',
        flowStatus: 'Analyzing',
        reason: 'Compliance gate blocked - moving back from Implementing'
      },
      { x: 300, y: 450 }
    ),

    // Conditional: Create compliance epic if audit deadline near
    {
      id: 'condition-1',
      type: 'Conditional',
      data: {
        node: {
          base_classes: ['Data'],
          description: 'Check if audit deadline approaching',
          display_name: 'Check Audit Deadline',
          template: {
            condition: { value: '{{auditReadiness}} < 90 && {{daysToDeadline}} < 30' }
          }
        }
      },
      position: { x: 300, y: 600 }
    },

    // Create compliance epic
    createHTTPNode(
      'http-pmo-2',
      `${SERVER_BASE_URL}/api/agent-actions/pmo/create-epic`,
      'POST',
      {
        title: 'Compliance Debt Remediation',
        description: 'Audit readiness < 90% with deadline approaching',
        priority: 'Highest',
        projectKey: 'PMO'
      },
      { x: 500, y: 700 }
    ),

    // Create P1 Jira ticket
    createHTTPNode(
      'http-jira-1',
      `${SERVER_BASE_URL}/api/agent-actions/jira/create-issue`,
      'POST',
      {
        projectKey: 'PMO',
        summary: 'CRITICAL: Compliance Gate Blocked',
        description: 'Release blocked due to compliance/security risk',
        priority: 'Highest',
        issuetype: 'Bug',
        agentId: 'governance'
      },
      { x: 300, y: 850 }
    ),

    // Critical Slack alert
    createHTTPNode(
      'http-slack-1',
      `${SERVER_BASE_URL}/api/agent-actions/slack/notify`,
      'POST',
      {
        channel: '#compliance-alerts',
        text: '@channel CRITICAL: Release blocked - compliance gate failure on project {{projectId}}',
        agentId: 'governance'
      },
      { x: 300, y: 1000 }
    ),

    {
      id: 'output-1',
      type: 'ChatOutput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Return success status',
          display_name: 'Response',
          template: { output_value: { value: '' } }
        }
      },
      position: { x: 600, y: 700 }
    }
  ];

  const edges: FlowEdge[] = [
    { source: 'input-1', target: 'parse-1' },
    { source: 'parse-1', target: 'http-governance-1' },
    { source: 'http-governance-1', target: 'http-pmo-1' },
    { source: 'http-pmo-1', target: 'condition-1' },
    { source: 'condition-1', target: 'http-pmo-2' }, // TRUE branch
    { source: 'condition-1', target: 'http-jira-1' }, // Continue regardless
    { source: 'http-pmo-2', target: 'http-jira-1' },
    { source: 'http-jira-1', target: 'http-slack-1' },
    { source: 'http-slack-1', target: 'output-1' }
  ];

  return {
    name: 'Scenario C: Regulatory Deadbolt',
    description: 'Auto-block releases when compliance/security risks detected (Risk ↔ Governance ↔ PMO)',
    data: { nodes, edges }
  };
}

/**
 * SCENARIO D: Maturity Governor
 * TMO ↔ PMO ↔ Planning
 */
function buildScenarioD(): FlowDefinition {
  const nodes: FlowNode[] = [
    {
      id: 'input-1',
      type: 'ChatInput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Receive trigger from Logic Gate',
          display_name: 'Gate Trigger Input',
          template: { input_value: { value: '' } }
        }
      },
      position: { x: 100, y: 100 }
    },

    {
      id: 'parse-1',
      type: 'ParseData',
      data: {
        node: {
          base_classes: ['Data'],
          description: 'Parse gate payload',
          display_name: 'Parse Payload',
          template: { data: { value: '' } }
        }
      },
      position: { x: 100, y: 200 }
    },

    // Calculate new load factor (80% of current)
    {
      id: 'calculate-1',
      type: 'PythonFunction',
      data: {
        node: {
          base_classes: ['Data'],
          description: 'Calculate reduced load factor',
          display_name: 'Calculate Load',
          template: {
            code: {
              value: `
def run(current_load):
    return current_load * 0.8  # 20% reduction
`
            }
          }
        }
      },
      position: { x: 300, y: 300 }
    },

    // Update PMO load factor
    createHTTPNode(
      'http-pmo-1',
      `${SERVER_BASE_URL}/api/agent-actions/pmo/set-flow-status`,
      'POST',
      {
        projectId: '{{projectId}}',
        sprint_load_factor: '{{newLoadFactor}}',
        reason: 'Load reduced by 20% due to low team competency (score: {{competencyScore}})'
      },
      { x: 300, y: 450 }
    ),

    // Invalidate Planning capacity
    createHTTPNode(
      'http-planning-1',
      `${SERVER_BASE_URL}/api/agent-actions/planning/invalidate-capacity`,
      'POST',
      {
        projectId: '{{projectId}}',
        reason: 'Capacity recalculation required - team maturity below threshold'
      },
      { x: 300, y: 600 }
    ),

    // Schedule TMO training
    createHTTPNode(
      'http-tmo-1',
      `${SERVER_BASE_URL}/api/agent-actions/tmo/schedule-coaching`,
      'POST',
      {
        teamId: '{{teamId}}',
        sessionType: 'SAFe Agile Training',
        reason: 'Team competency score below 2.5 - agile maturity improvement needed'
      },
      { x: 300, y: 750 }
    ),

    // Notify Scrum Master
    createHTTPNode(
      'http-slack-1',
      `${SERVER_BASE_URL}/api/agent-actions/slack/notify`,
      'POST',
      {
        channel: '#scrum-masters',
        text: 'Team {{teamId}} load reduced by 20% - SAFe training scheduled to improve maturity',
        agentId: 'tmo'
      },
      { x: 300, y: 900 }
    ),

    {
      id: 'output-1',
      type: 'ChatOutput',
      data: {
        node: {
          base_classes: ['Message'],
          description: 'Return success status',
          display_name: 'Response',
          template: { output_value: { value: '' } }
        }
      },
      position: { x: 600, y: 600 }
    }
  ];

  const edges: FlowEdge[] = [
    { source: 'input-1', target: 'parse-1' },
    { source: 'parse-1', target: 'calculate-1' },
    { source: 'calculate-1', target: 'http-pmo-1' },
    { source: 'http-pmo-1', target: 'http-planning-1' },
    { source: 'http-planning-1', target: 'http-tmo-1' },
    { source: 'http-tmo-1', target: 'http-slack-1' },
    { source: 'http-slack-1', target: 'output-1' }
  ];

  return {
    name: 'Scenario D: Maturity Governor',
    description: 'Auto-adjust load based on team maturity (TMO ↔ PMO ↔ Planning)',
    data: { nodes, edges }
  };
}

/**
 * Upload flow to Langflow
 */
async function uploadFlow(flow: FlowDefinition): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${LANGFLOW_API_KEY}`,
      'Content-Type': 'application/json'
    };

    if (LANGFLOW_ORG_ID) {
      headers['X-DataStax-Current-Org'] = LANGFLOW_ORG_ID;
    }

    const response = await fetch(`${LANGFLOW_API_URL}/flows`, {
      method: 'POST',
      headers,
      body: JSON.stringify(flow)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload flow: ${response.status} - ${error}`);
    }

    const result: any = await response.json();
    return result.id || result.flow_id || 'unknown';
  } catch (error: any) {
    console.error(`Error uploading ${flow.name}:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Building Langflow Scenario Workflows...\n');

  if (!LANGFLOW_API_KEY) {
    console.error('❌ LANGFLOW_API_KEY not set in environment');
    process.exit(1);
  }

  const scenarios = [
    { name: 'A', builder: buildScenarioA },
    { name: 'B', builder: buildScenarioB },
    { name: 'C', builder: buildScenarioC },
    { name: 'D', builder: buildScenarioD }
  ];

  const results: Record<string, string> = {};

  for (const scenario of scenarios) {
    console.log(`Building Scenario ${scenario.name}...`);
    const flow = scenario.builder();

    try {
      const flowId = await uploadFlow(flow);
      results[scenario.name] = flowId;
      console.log(`✅ Scenario ${scenario.name} created: ${flowId}\n`);
    } catch (error: any) {
      console.log(`❌ Scenario ${scenario.name} failed: ${error.message}\n`);
      results[scenario.name] = 'FAILED';
    }
  }

  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════════════');
  Object.entries(results).forEach(([scenario, id]) => {
    const status = id === 'FAILED' ? '❌' : '✅';
    console.log(`${status} Scenario ${scenario}: ${id}`);
  });
  console.log('═══════════════════════════════════════════\n');

  console.log('📝 Save these IDs to .env:');
  Object.entries(results).forEach(([scenario, id]) => {
    if (id !== 'FAILED') {
      console.log(`LANGFLOW_SCENARIO_${scenario}_ID=${id}`);
    }
  });
}

main().catch(console.error);
