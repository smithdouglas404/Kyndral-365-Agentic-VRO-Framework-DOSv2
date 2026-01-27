/**
 * LANGFLOW FLOW GENERATOR
 *
 * Programmatically creates Langflow flows for each Deep Agent
 * This replaces manual flow creation with auto-generated workflows
 */

import type { LangflowService } from './LangflowService.js';

export interface AgentFlowDefinition {
  agentName: string;
  flowName: string;
  description: string;
  inputSchema: Record<string, any>;
  nodes: any[];
  edges: any[];
}

export class LangflowFlowGenerator {
  private langflowService: LangflowService;
  private generatedFlows: Map<string, string> = new Map(); // agentName -> flowId

  constructor(langflowService: LangflowService) {
    this.langflowService = langflowService;
  }

  /**
   * Generate and create flows for all Deep Agents
   */
  async generateAllAgentFlows(): Promise<Map<string, string>> {
    console.log('[LangflowGen] Generating flows for all Deep Agents...');

    const agents = [
      'finops',
      'tmo',
      'risk',
      'vro',
      'pmo',
      'ocm',
      'governance',
      'planning',
    ];

    for (const agent of agents) {
      try {
        const flowId = await this.generateAgentFlow(agent);
        if (flowId) {
          this.generatedFlows.set(agent, flowId);
          console.log(`[LangflowGen] ✅ ${agent}: ${flowId}`);
        }
      } catch (error: any) {
        console.error(`[LangflowGen] ❌ Failed to generate ${agent} flow:`, error.message);
      }
    }

    console.log(`[LangflowGen] Generated ${this.generatedFlows.size}/${agents.length} flows`);
    return this.generatedFlows;
  }

  /**
   * Generate flow for specific agent
   */
  async generateAgentFlow(agentName: string): Promise<string | null> {
    const definition = this.getAgentFlowDefinition(agentName);
    if (!definition) {
      console.warn(`[LangflowGen] No flow definition for ${agentName}`);
      return null;
    }

    const flowData = this.buildFlowJSON(definition);

    // Create flow via Langflow API
    const response = await fetch(
      `${process.env.LANGFLOW_API_URL?.replace('/api/v1', '')}/api/v1/flows/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LANGFLOW_API_KEY}`,
          'X-DataStax-Current-Org': process.env.LANGFLOW_ORG_ID || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create flow: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Get flow definition for agent
   */
  private getAgentFlowDefinition(agentName: string): AgentFlowDefinition | null {
    switch (agentName) {
      case 'finops':
        return this.getFinOpsFlowDefinition();
      case 'tmo':
        return this.getTMOFlowDefinition();
      case 'risk':
        return this.getRiskFlowDefinition();
      case 'vro':
        return this.getVROFlowDefinition();
      case 'pmo':
        return this.getPMOFlowDefinition();
      case 'ocm':
        return this.getOCMFlowDefinition();
      case 'governance':
        return this.getGovernanceFlowDefinition();
      case 'planning':
        return this.getPlanningFlowDefinition();
      default:
        return null;
    }
  }

  /**
   * FinOps flow: Budget overrun → Jira + Slack + TMO notification
   * TEMPLATE FLOW - Team configures real endpoints in Langflow UI
   */
  private getFinOpsFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'finops',
      flowName: 'FinOps Budget Alert',
      description: 'Budget variance analysis → Jira ticket → Slack notification → TMO alert (CONFIGURE: Set your Jira domain, Slack webhook, and auth tokens in flow settings)',
      inputSchema: {
        projectId: 'string',
        projectName: 'string',
        budgetVariance: 'number',
        currentBudget: 'number',
        actualSpent: 'number',
        severity: 'string',
      },
      nodes: this.createFinOpsAgentNodes(),
      edges: this.createFinOpsAgentEdges(),
    };
  }

  /**
   * FinOps Agent Flow Nodes (REAL AGENT WORKFLOW)
   */
  private createFinOpsAgentNodes(): any[] {
    return [
      // Input: Budget data from FinOps agent
      {
        id: 'input-1',
        type: 'ChatInput',
        position: { x: 100, y: 200 },
        data: {
          type: 'ChatInput',
          node: {
            display_name: 'Budget Data Input',
            description: 'Receives budget variance data from FinOps agent',
          },
        },
      },
      // Python Code: Check threshold and calculate severity
      {
        id: 'python-threshold',
        type: 'PythonCode',
        position: { x: 300, y: 200 },
        data: {
          type: 'PythonCode',
          node: {
            display_name: 'Threshold Check',
            template: {
              code: {
                value: `import json

def check_budget_threshold(input_data):
    data = json.loads(input_data)
    variance = float(data.get('budgetVariance', 0))

    # Determine action based on variance
    if variance > 0.20:  # 20% critical
        return {
            "action": "create_jira",
            "severity": "critical",
            "priority": "Highest",
            "notify_slack": True,
            "notify_tmo": True
        }
    elif variance > 0.15:  # 15% high
        return {
            "action": "create_jira",
            "severity": "high",
            "priority": "High",
            "notify_slack": True,
            "notify_tmo": True
        }
    elif variance > 0.10:  # 10% warning
        return {
            "action": "log_only",
            "severity": "medium",
            "notify_slack": True,
            "notify_tmo": False
        }
    else:
        return {
            "action": "skip",
            "severity": "low",
            "notify_slack": False,
            "notify_tmo": False
        }

result = check_budget_threshold(input_value)
output = json.dumps(result)`,
              },
            },
          },
        },
      },
      // API Call: Create Jira ticket (SERVER-SIDE INTEGRATION)
      {
        id: 'jira-create',
        type: 'APIRequest',
        position: { x: 550, y: 100 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Create Jira Ticket',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL (e.g., https://your-domain.com or http://localhost:5000). Server handles Jira credentials from .env file.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/jira/create-issue' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  projectKey: 'PMO',
                  summary: 'Budget Overrun: {{projectName}}',
                  description: 'Budget variance detected: {{budgetVariance}}%. Current budget: {{currentBudget}}, Actual spent: {{actualSpent}}',
                  priority: 'High',
                  issuetype: 'Task',
                  labels: ['budget-alert', 'finops', 'auto-generated'],
                  agentId: 'finops'
                }),
              },
            },
          },
        },
      },
      // API Call: Slack notification (SERVER-SIDE INTEGRATION)
      {
        id: 'slack-notify',
        type: 'APIRequest',
        position: { x: 550, y: 300 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Slack Alert',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Server handles Slack webhook from .env file.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/slack/notify' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  channel: '#budget-alerts',
                  text: '🚨 Budget Alert: {{projectName}}',
                  blocks: [
                    {
                      type: 'section',
                      text: {
                        type: 'mrkdwn',
                        text: '*Budget Overrun*\n*Project:* {{projectName}}\n*Variance:* {{budgetVariance}}%\n*Budget:* ${{currentBudget}}\n*Spent:* ${{actualSpent}}'
                      }
                    }
                  ],
                  agentId: 'finops'
                }),
              },
            },
          },
        },
      },
      // API Call: Notify TMO agent (A2A COMMUNICATION)
      {
        id: 'tmo-notify',
        type: 'APIRequest',
        position: { x: 550, y: 500 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Notify TMO Agent',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Sends agent-to-agent notification.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/notify/tmo' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  from: 'finops',
                  projectId: '{{projectId}}',
                  message: 'Budget overrun detected - review schedule impact',
                  severity: '{{severity}}',
                  metadata: {
                    budgetVariance: '{{budgetVariance}}',
                    currentBudget: '{{currentBudget}}',
                    actualSpent: '{{actualSpent}}'
                  }
                }),
              },
            },
          },
        },
      },
      // Output: Return result
      {
        id: 'output-1',
        type: 'ChatOutput',
        position: { x: 800, y: 200 },
        data: {
          type: 'ChatOutput',
          node: {
            display_name: 'Result',
          },
        },
      },
    ];
  }

  /**
   * FinOps Agent Flow Edges (CONNECTS REAL WORKFLOW)
   */
  private createFinOpsAgentEdges(): any[] {
    return [
      { source: 'input-1', target: 'python-threshold' },
      { source: 'python-threshold', target: 'jira-create' },
      { source: 'python-threshold', target: 'slack-notify' },
      { source: 'python-threshold', target: 'tmo-notify' },
      { source: 'jira-create', target: 'output-1' },
      { source: 'slack-notify', target: 'output-1' },
      { source: 'tmo-notify', target: 'output-1' },
    ];
  }

  /**
   * TMO flow: Schedule delay → ServiceNow + FinOps check
   * TEMPLATE FLOW - Team configures real endpoints in Langflow UI
   */
  private getTMOFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'tmo',
      flowName: 'TMO Schedule Delay Response',
      description: 'Schedule delay analysis → ServiceNow incident → Risk assessment → Budget impact check (CONFIGURE: Set your ServiceNow instance and auth in flow settings)',
      inputSchema: {
        projectId: 'string',
        projectName: 'string',
        delayDays: 'number',
        criticalPath: 'boolean',
        scheduledDate: 'string',
      },
      nodes: this.createTMOAgentNodes(),
      edges: this.createTMOAgentEdges(),
    };
  }

  private createTMOAgentNodes(): any[] {
    return [
      {
        id: 'input-1',
        type: 'ChatInput',
        position: { x: 100, y: 200 },
        data: { type: 'ChatInput', node: { display_name: 'Schedule Data' } },
      },
      {
        id: 'python-delay-check',
        type: 'PythonCode',
        position: { x: 300, y: 200 },
        data: {
          type: 'PythonCode',
          node: {
            display_name: 'Delay Severity Check',
            template: {
              code: {
                value: `import json
def check_delay(input_data):
    data = json.loads(input_data)
    delay = int(data.get('delayDays', 0))
    critical = data.get('criticalPath', False)

    if delay > 10 and critical:
        return {"action": "critical_incident", "priority": "P1", "notify_all": True}
    elif delay > 5:
        return {"action": "create_incident", "priority": "P2", "notify_finops": True}
    else:
        return {"action": "log_only", "priority": "P3", "notify_finops": False}

result = check_delay(input_value)
output = json.dumps(result)`,
              },
            },
          },
        },
      },
      {
        id: 'servicenow-incident',
        type: 'APIRequest',
        position: { x: 550, y: 100 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'ServiceNow Incident',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Server handles ServiceNow credentials from .env file.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/servicenow/create-incident' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  shortDescription: 'Schedule Delay: {{projectName}}',
                  description: 'Project delayed by {{delayDays}} days. Critical path: {{criticalPath}}',
                  priority: '2',
                  urgency: '2',
                  impact: '2',
                  category: 'Project Management',
                  agentId: 'tmo'
                }),
              },
            },
          },
        },
      },
      {
        id: 'finops-check',
        type: 'APIRequest',
        position: { x: 550, y: 300 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Check Budget Impact',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Notifies FinOps agent of schedule delay.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/notify/finops' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  from: 'tmo',
                  projectId: '{{projectId}}',
                  message: 'Schedule delay detected - check budget impact',
                  severity: 'high',
                  metadata: {
                    delayDays: '{{delayDays}}',
                    criticalPath: '{{criticalPath}}'
                  }
                }),
              },
            },
          },
        },
      },
      {
        id: 'output-1',
        type: 'ChatOutput',
        position: { x: 800, y: 200 },
        data: { type: 'ChatOutput', node: { display_name: 'Response' } },
      },
    ];
  }

  private createTMOAgentEdges(): any[] {
    return [
      { source: 'input-1', target: 'python-delay-check' },
      { source: 'python-delay-check', target: 'servicenow-incident' },
      { source: 'python-delay-check', target: 'finops-check' },
      { source: 'servicenow-incident', target: 'output-1' },
      { source: 'finops-check', target: 'output-1' },
    ];
  }

  /**
   * Risk flow: Risk escalation → Multi-tier alerting
   * TEMPLATE FLOW - Team configures real endpoints in Langflow UI
   */
  private getRiskFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'risk',
      flowName: 'Risk Escalation Workflow',
      description: 'Risk scoring → Tiered escalation → Jira/ServiceNow/Slack → PMO/VRO notification (CONFIGURE: Set your integration endpoints and auth in flow settings)',
      inputSchema: {
        projectId: 'string',
        projectName: 'string',
        riskScore: 'number',
        riskCategory: 'string',
        impact: 'string',
      },
      nodes: this.createRiskAgentNodes(),
      edges: this.createRiskAgentEdges(),
    };
  }

  private createRiskAgentNodes(): any[] {
    return [
      {
        id: 'input-1',
        type: 'ChatInput',
        position: { x: 100, y: 200 },
        data: { type: 'ChatInput', node: { display_name: 'Risk Data' } },
      },
      {
        id: 'python-risk-tier',
        type: 'PythonCode',
        position: { x: 300, y: 200 },
        data: {
          type: 'PythonCode',
          node: {
            display_name: 'Risk Tier Classification',
            template: {
              code: {
                value: `import json
def classify_risk(input_data):
    data = json.loads(input_data)
    score = float(data.get('riskScore', 0))

    if score >= 8:  # Critical
        return {
            "tier": "critical",
            "create_jira": True,
            "create_servicenow": True,
            "jira_priority": "Highest",
            "notify_pmo": True,
            "notify_vro": True,
            "notify_slack": True,
            "escalate_leadership": True
        }
    elif score >= 6:  # High
        return {
            "tier": "high",
            "create_jira": True,
            "create_servicenow": False,
            "jira_priority": "High",
            "notify_pmo": True,
            "notify_vro": False,
            "notify_slack": True,
            "escalate_leadership": False
        }
    elif score >= 4:  # Medium
        return {
            "tier": "medium",
            "create_jira": True,
            "create_servicenow": False,
            "jira_priority": "Medium",
            "notify_pmo": True,
            "notify_vro": False,
            "notify_slack": False,
            "escalate_leadership": False
        }
    else:  # Low
        return {
            "tier": "low",
            "create_jira": False,
            "create_servicenow": False,
            "notify_pmo": False,
            "notify_vro": False,
            "notify_slack": False,
            "escalate_leadership": False
        }

result = classify_risk(input_value)
output = json.dumps(result)`,
              },
            },
          },
        },
      },
      {
        id: 'jira-critical',
        type: 'APIRequest',
        position: { x: 550, y: 50 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Jira Critical Issue',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Server handles Jira credentials.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/jira/create-issue' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  projectKey: 'RISK',
                  summary: 'CRITICAL RISK: {{projectName}} - {{riskCategory}}',
                  description: 'Risk score: {{riskScore}}/10. Impact: {{impact}}',
                  issuetype: 'Bug',
                  priority: 'Highest',
                  labels: ['risk-alert', 'critical', 'auto-generated'],
                  agentId: 'risk'
                }),
              },
            },
          },
        },
      },
      {
        id: 'servicenow-p1',
        type: 'APIRequest',
        position: { x: 550, y: 200 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'ServiceNow P1 Incident',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Server handles ServiceNow credentials.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/servicenow/create-incident' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  shortDescription: 'CRITICAL RISK: {{projectName}}',
                  description: 'Risk score: {{riskScore}}/10. Category: {{riskCategory}}. Impact: {{impact}}',
                  priority: '1',
                  urgency: '1',
                  impact: '1',
                  category: 'Risk Management',
                  agentId: 'risk'
                }),
              },
            },
          },
        },
      },
      {
        id: 'slack-critical',
        type: 'APIRequest',
        position: { x: 550, y: 350 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Slack @channel Alert',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Server handles Slack webhook.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/slack/notify' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  channel: '#risk-alerts',
                  text: '<!channel> 🚨 CRITICAL RISK DETECTED',
                  blocks: [
                    {
                      type: 'section',
                      text: {
                        type: 'mrkdwn',
                        text: '*CRITICAL RISK*\n*Project:* {{projectName}}\n*Score:* {{riskScore}}/10\n*Category:* {{riskCategory}}\n*Impact:* {{impact}}'
                      }
                    }
                  ],
                  agentId: 'risk'
                }),
              },
            },
          },
        },
      },
      {
        id: 'notify-pmo',
        type: 'APIRequest',
        position: { x: 550, y: 500 },
        data: {
          type: 'APIRequest',
          node: {
            display_name: 'Notify PMO Agent',
            description: 'CONFIGURE IN LANGFLOW UI: Replace {{SERVER_URL}} with your server URL. Sends agent-to-agent notification.',
            template: {
              method: { value: 'POST' },
              url: { value: '{{SERVER_URL}}/api/agent-actions/notify/pmo' },
              headers: {
                value: JSON.stringify({
                  'Content-Type': 'application/json'
                }),
              },
              body: {
                value: JSON.stringify({
                  from: 'risk',
                  projectId: '{{projectId}}',
                  message: 'Critical risk detected - review project health',
                  severity: 'critical',
                  metadata: {
                    riskScore: '{{riskScore}}',
                    riskCategory: '{{riskCategory}}',
                    impact: '{{impact}}'
                  }
                }),
              },
            },
          },
        },
      },
      {
        id: 'output-1',
        type: 'ChatOutput',
        position: { x: 800, y: 200 },
        data: { type: 'ChatOutput', node: { display_name: 'Escalation Result' } },
      },
    ];
  }

  private createRiskAgentEdges(): any[] {
    return [
      { source: 'input-1', target: 'python-risk-tier' },
      { source: 'python-risk-tier', target: 'jira-critical' },
      { source: 'python-risk-tier', target: 'servicenow-p1' },
      { source: 'python-risk-tier', target: 'slack-critical' },
      { source: 'python-risk-tier', target: 'notify-pmo' },
      { source: 'jira-critical', target: 'output-1' },
      { source: 'servicenow-p1', target: 'output-1' },
      { source: 'slack-critical', target: 'output-1' },
      { source: 'notify-pmo', target: 'output-1' },
    ];
  }

  /**
   * VRO flow: Value gap detection
   */
  private getVROFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'vro',
      flowName: 'VRO Value Gap Alert',
      description: 'Value realization monitoring with stakeholder notifications',
      inputSchema: {
        projectId: 'string',
        projectName: 'string',
        valueGap: 'number',
        expectedValue: 'number',
        actualValue: 'number',
      },
      nodes: this.createStandardNodes('Value Data', 'Gap Alert'),
      edges: this.createStandardEdges(),
    };
  }

  /**
   * PMO flow: Project health monitoring
   */
  private getPMOFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'pmo',
      flowName: 'PMO Health Alert',
      description: 'Project health monitoring with multi-channel notifications',
      inputSchema: {
        projectId: 'string',
        projectName: 'string',
        healthScore: 'number',
        issues: 'array',
      },
      nodes: this.createStandardNodes('Health Data', 'Alert Summary'),
      edges: this.createStandardEdges(),
    };
  }

  /**
   * OCM flow: Change management alerts
   */
  private getOCMFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'ocm',
      flowName: 'OCM Change Alert',
      description: 'Organizational change monitoring and stakeholder communication',
      inputSchema: {
        changeId: 'string',
        changeType: 'string',
        impact: 'string',
        stakeholders: 'array',
      },
      nodes: this.createStandardNodes('Change Data', 'Communication Plan'),
      edges: this.createStandardEdges(),
    };
  }

  /**
   * Governance flow: Compliance violations
   */
  private getGovernanceFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'governance',
      flowName: 'Governance Compliance Alert',
      description: 'Compliance violation detection and escalation',
      inputSchema: {
        projectId: 'string',
        violationType: 'string',
        severity: 'string',
        policyId: 'string',
      },
      nodes: this.createStandardNodes('Compliance Data', 'Violation Response'),
      edges: this.createStandardEdges(),
    };
  }

  /**
   * Planning flow: Strategic alignment
   */
  private getPlanningFlowDefinition(): AgentFlowDefinition {
    return {
      agentName: 'planning',
      flowName: 'Planning Alignment Alert',
      description: 'Strategic alignment monitoring and recommendations',
      inputSchema: {
        projectId: 'string',
        alignmentScore: 'number',
        strategicGoals: 'array',
        gaps: 'array',
      },
      nodes: this.createStandardNodes('Planning Data', 'Alignment Report'),
      edges: this.createStandardEdges(),
    };
  }

  /**
   * Create standard input/output nodes
   */
  private createStandardNodes(inputLabel: string, outputLabel: string): any[] {
    return [
      {
        id: 'chatinput-1',
        type: 'ChatInput',
        position: { x: 250, y: 50 },
        data: {
          type: 'ChatInput',
          node: {
            template: {
              input_value: {
                type: 'str',
                required: false,
                placeholder: '',
                list: false,
                show: true,
                multiline: true,
                value: '',
                fileTypes: [],
                file_path: '',
                password: false,
                name: 'input_value',
                advanced: false,
                dynamic: false,
                info: '',
                title_case: false,
              },
            },
            description: `Get ${inputLabel.toLowerCase()} from agent`,
            base_classes: ['Message'],
            display_name: inputLabel,
            documentation: '',
            custom_fields: {},
            output_types: [],
            pinned: false,
            conditional_paths: [],
            frozen: false,
            outputs: [
              {
                types: ['Message'],
                selected: 'Message',
                name: 'message',
                display_name: 'Message',
                method: 'message_response',
              },
            ],
          },
        },
      },
      {
        id: 'chatoutput-1',
        type: 'ChatOutput',
        position: { x: 750, y: 50 },
        data: {
          type: 'ChatOutput',
          node: {
            template: {
              input_value: {
                type: 'str',
                required: false,
                placeholder: '',
                list: false,
                show: true,
                multiline: true,
                value: '',
                fileTypes: [],
                file_path: '',
                password: false,
                name: 'input_value',
                advanced: false,
                dynamic: false,
                info: '',
                title_case: false,
              },
            },
            description: `Return ${outputLabel.toLowerCase()} to agent`,
            base_classes: ['Message'],
            display_name: outputLabel,
            documentation: '',
            custom_fields: {},
            output_types: [],
            pinned: false,
            conditional_paths: [],
            frozen: false,
          },
        },
      },
    ];
  }

  /**
   * Create standard edges connecting input to output
   */
  private createStandardEdges(): any[] {
    return [
      {
        source: 'chatinput-1',
        sourceHandle:
          '{œid{:chatinput-1{|shownode{:false{|dataType{:Message{|id{:chatinput-1{|output_types{:[{Qmessage{Q]{|proxy{:}baseClasses{:[{QMessage{Q]{|id{:message{ª',
        target: 'chatoutput-1',
        targetHandle:
          '{œid{:chatoutput-1{|fieldName{:input_value{|inputTypes{:[{QMessage{Q]{|type{:str{|id{:input_value{ª',
        id: 'reactflow__edge-chatinput-1{œid{:chatinput-1{|shownode{:false{|dataType{:Message{|id{:chatinput-1{|output_types{:[{Qmessage{Q]{|proxy{:}baseClasses{:[{QMessage{Q]{|id{:message{ª-chatoutput-1{œid{:chatoutput-1{|fieldName{:input_value{|inputTypes{:[{QMessage{Q]{|type{:str{|id{:input_value{ª',
      },
    ];
  }

  /**
   * Build full Langflow flow JSON
   */
  private buildFlowJSON(definition: AgentFlowDefinition): any {
    return {
      name: definition.flowName,
      description: definition.description,
      data: {
        nodes: definition.nodes,
        edges: definition.edges,
      },
      is_component: false,
    };
  }

  /**
   * Get generated flow ID for agent
   */
  getFlowId(agentName: string): string | undefined {
    return this.generatedFlows.get(agentName);
  }

  /**
   * Get all generated flows
   */
  getAllFlows(): Map<string, string> {
    return this.generatedFlows;
  }
}
