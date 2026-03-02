import { db } from '../db.js';
import { sql } from 'drizzle-orm';

interface McpDef {
  name: string;
  displayName: string;
  type: 'knowledge' | 'governance';
  category: string;
  description: string;
  capabilities: string[];
}

interface AgentMapping {
  agentId: string;
  mcpNames: string[];
}

const MCP_DEFINITIONS: McpDef[] = [
  {
    name: 'monday',
    displayName: 'Monday.com',
    type: 'knowledge',
    category: 'agile_ppm',
    description: 'Work management platform for project tracking, task boards, and team collaboration',
    capabilities: ['Project Tracking', 'Task Management', 'Board Management', 'Status Updates', 'Timeline Views'],
  },
  {
    name: 'jira',
    displayName: 'Jira Cloud',
    type: 'knowledge',
    category: 'agile_ppm',
    description: 'Agile project management with sprint planning, backlog management, and velocity tracking',
    capabilities: ['Sprint Planning', 'Backlog Management', 'Issue Tracking', 'Velocity Reports', 'Kanban Boards'],
  },
  {
    name: 'azure-devops',
    displayName: 'Azure DevOps',
    type: 'knowledge',
    category: 'agile_ppm',
    description: 'Microsoft DevOps platform with boards, repos, pipelines, and test plans',
    capabilities: ['Work Items', 'Sprint Boards', 'Repos', 'Pipelines', 'Test Plans'],
  },
  {
    name: 'servicenow',
    displayName: 'ServiceNow SPM',
    type: 'knowledge',
    category: 'enterprise_ppm',
    description: 'Enterprise service management with ITSM, ITOM, and strategic portfolio management',
    capabilities: ['Incident Management', 'Change Management', 'Portfolio Management', 'Risk Management', 'Compliance'],
  },
  {
    name: 'sap',
    displayName: 'SAP S/4HANA',
    type: 'knowledge',
    category: 'erp_finance',
    description: 'Enterprise resource planning with financial accounting, controlling, and project systems',
    capabilities: ['Financial Accounting', 'Cost Centers', 'Project Systems', 'Budget Management', 'Procurement'],
  },
  {
    name: 'quickbooks',
    displayName: 'QuickBooks',
    type: 'knowledge',
    category: 'erp_finance',
    description: 'Financial management with invoicing, expense tracking, and budget reporting',
    capabilities: ['Invoicing', 'Expense Tracking', 'Budget Reports', 'P&L Statements', 'Cash Flow'],
  },
  {
    name: 'ms-project',
    displayName: 'Microsoft Project',
    type: 'knowledge',
    category: 'enterprise_ppm',
    description: 'Enterprise project scheduling with Gantt charts, resource leveling, and critical path analysis',
    capabilities: ['Gantt Charts', 'Resource Leveling', 'Critical Path', 'Baseline Tracking', 'WBS'],
  },
  {
    name: 'smartsheet',
    displayName: 'Smartsheet',
    type: 'knowledge',
    category: 'enterprise_ppm',
    description: 'Work execution platform with sheets, reports, dashboards, and automation',
    capabilities: ['Sheet Management', 'Reports', 'Dashboards', 'Automation', 'Resource Management'],
  },
  {
    name: 'planview',
    displayName: 'Planview',
    type: 'knowledge',
    category: 'enterprise_ppm',
    description: 'Strategic portfolio management with roadmaps, resource capacity, and financial planning',
    capabilities: ['Strategic Planning', 'Roadmaps', 'Resource Capacity', 'Financial Planning', 'Value Streams'],
  },
  {
    name: 'github',
    displayName: 'GitHub',
    type: 'knowledge',
    category: 'devops',
    description: 'Source code management with pull requests, issues, actions, and dependency tracking',
    capabilities: ['Repositories', 'Pull Requests', 'Issues', 'Actions', 'Dependency Graph'],
  },
  {
    name: 'gitlab',
    displayName: 'GitLab',
    type: 'knowledge',
    category: 'devops',
    description: 'DevOps platform with CI/CD, issue tracking, and container registry',
    capabilities: ['CI/CD Pipelines', 'Issue Boards', 'Merge Requests', 'Container Registry', 'Security Scanning'],
  },
  {
    name: 'slack',
    displayName: 'Slack',
    type: 'knowledge',
    category: 'communication',
    description: 'Team communication platform with channels, threads, and integration webhooks',
    capabilities: ['Messaging', 'Channels', 'Threads', 'File Sharing', 'Webhooks'],
  },
  {
    name: 'teams',
    displayName: 'Microsoft Teams',
    type: 'knowledge',
    category: 'communication',
    description: 'Enterprise collaboration with chat, meetings, and channel-based communication',
    capabilities: ['Chat', 'Meetings', 'Channels', 'File Collaboration', 'Adaptive Cards'],
  },
  {
    name: 'palantir-aip',
    displayName: 'Palantir AIP',
    type: 'knowledge',
    category: 'enterprise_analytics',
    description: 'Enterprise ontology platform with federated data integration, AIP Logic, and action orchestration',
    capabilities: ['Ontology Objects', 'Data Pipelines', 'AIP Logic', 'Actions', 'Workshop Apps'],
  },
  {
    name: 'salesforce',
    displayName: 'Salesforce',
    type: 'knowledge',
    category: 'crm',
    description: 'CRM platform with opportunity tracking, account management, and revenue forecasting',
    capabilities: ['Opportunities', 'Accounts', 'Forecasting', 'Reports', 'Dashboards'],
  },
  {
    name: 'workday',
    displayName: 'Workday',
    type: 'knowledge',
    category: 'hrm',
    description: 'Human capital management with workforce planning, skills tracking, and organizational data',
    capabilities: ['Workforce Planning', 'Skills Tracking', 'Org Structure', 'Compensation', 'Learning'],
  },
  {
    name: 'responsible-ai',
    displayName: 'Responsible AI Governance',
    type: 'governance',
    category: 'responsible_ai',
    description: 'Validates agent actions against ethical AI guidelines, bias detection, and fairness policies',
    capabilities: ['Bias Detection', 'Fairness Validation', 'Transparency Checks', 'Ethics Review'],
  },
  {
    name: 'quality-assurance',
    displayName: 'Quality Assurance',
    type: 'governance',
    category: 'qa',
    description: 'Validates data quality, completeness, and consistency before agent actions',
    capabilities: ['Data Quality Checks', 'Completeness Validation', 'Consistency Rules', 'Outlier Detection'],
  },
  {
    name: 'policy-enforcement',
    displayName: 'Policy Enforcement',
    type: 'governance',
    category: 'policy',
    description: 'Enforces organizational policies, regulatory compliance, and approval workflows',
    capabilities: ['Policy Validation', 'Compliance Checks', 'Approval Workflows', 'Regulatory Rules'],
  },
  {
    name: 'audit-trail',
    displayName: 'Audit Trail',
    type: 'governance',
    category: 'audit',
    description: 'Records all agent decisions, data access, and actions for compliance audit trail',
    capabilities: ['Decision Logging', 'Access Tracking', 'Action History', 'Compliance Reporting'],
  },
];

const AGENT_MCP_MAPPINGS: AgentMapping[] = [
  {
    agentId: 'finops',
    mcpNames: ['sap', 'monday', 'quickbooks', 'palantir-aip', 'responsible-ai', 'quality-assurance', 'audit-trail'],
  },
  {
    agentId: 'tmo',
    mcpNames: ['jira', 'azure-devops', 'ms-project', 'responsible-ai', 'quality-assurance'],
  },
  {
    agentId: 'risk',
    mcpNames: ['servicenow', 'jira', 'palantir-aip', 'responsible-ai', 'policy-enforcement', 'quality-assurance'],
  },
  {
    agentId: 'pmo',
    mcpNames: ['jira', 'azure-devops', 'smartsheet', 'planview', 'responsible-ai', 'audit-trail'],
  },
  {
    agentId: 'governance',
    mcpNames: ['servicenow', 'responsible-ai', 'policy-enforcement', 'quality-assurance', 'audit-trail'],
  },
  {
    agentId: 'vro',
    mcpNames: ['planview', 'salesforce', 'sap', 'responsible-ai', 'quality-assurance'],
  },
  {
    agentId: 'ocm',
    mcpNames: ['slack', 'teams', 'workday', 'responsible-ai', 'quality-assurance'],
  },
  {
    agentId: 'planning',
    mcpNames: ['jira', 'github', 'azure-devops', 'ms-project', 'responsible-ai', 'quality-assurance'],
  },
  {
    agentId: 'okr',
    mcpNames: ['monday', 'jira', 'planview', 'responsible-ai', 'policy-enforcement'],
  },
  {
    agentId: 'integrated',
    mcpNames: ['palantir-aip', 'responsible-ai', 'policy-enforcement', 'quality-assurance', 'audit-trail'],
  },
  {
    agentId: 'notification',
    mcpNames: ['palantir-aip', 'slack', 'teams', 'servicenow', 'responsible-ai', 'audit-trail'],
  },
];

export async function seedMcpConnections() {
  console.log('[Seed] Starting MCP definitions and agent connections seed...');

  const mcpIdMap = new Map<string, string>();
  let mcpCreated = 0;
  let mcpExisted = 0;

  for (const mcp of MCP_DEFINITIONS) {
    const existing = await db.execute(sql`
      SELECT id FROM mcp_definitions WHERE name = ${mcp.name} LIMIT 1
    `);

    if (existing.rows.length > 0) {
      mcpIdMap.set(mcp.name, (existing.rows[0] as any).id);
      mcpExisted++;
    } else {
      const result = await db.execute(sql`
        INSERT INTO mcp_definitions (name, display_name, type, category, description, capabilities, enabled)
        VALUES (
          ${mcp.name},
          ${mcp.displayName},
          ${mcp.type},
          ${mcp.category},
          ${mcp.description},
          ${JSON.stringify(mcp.capabilities)},
          true
        )
        RETURNING id
      `);
      const id = (result.rows[0] as any).id;
      mcpIdMap.set(mcp.name, id);
      mcpCreated++;
      console.log(`[Seed] Created MCP: ${mcp.displayName} (${mcp.type}) → ${id}`);
    }
  }

  console.log(`[Seed] MCP definitions: ${mcpCreated} created, ${mcpExisted} already existed`);

  let connectionCreated = 0;
  let connectionExisted = 0;

  for (const mapping of AGENT_MCP_MAPPINGS) {
    for (let i = 0; i < mapping.mcpNames.length; i++) {
      const mcpName = mapping.mcpNames[i];
      const mcpId = mcpIdMap.get(mcpName);
      if (!mcpId) {
        console.warn(`[Seed] MCP not found: ${mcpName} for agent ${mapping.agentId}`);
        continue;
      }

      const existingConn = await db.execute(sql`
        SELECT id FROM agent_mcp_connections
        WHERE agent_id = ${mapping.agentId} AND mcp_id = ${mcpId}
        LIMIT 1
      `);

      if (existingConn.rows.length > 0) {
        connectionExisted++;
        continue;
      }

      await db.execute(sql`
        INSERT INTO agent_mcp_connections (agent_id, mcp_id, enabled, priority)
        VALUES (${mapping.agentId}, ${mcpId}, true, ${i + 1})
      `);
      connectionCreated++;
    }
    console.log(`[Seed] ${mapping.agentId}: ${mapping.mcpNames.length} MCPs processed`);
  }

  console.log(`[Seed] Agent connections: ${connectionCreated} created, ${connectionExisted} already existed`);
  console.log('[Seed] MCP seed complete!');
}

if (process.argv[1]?.includes('seed-mcp-connections')) {
  seedMcpConnections()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
