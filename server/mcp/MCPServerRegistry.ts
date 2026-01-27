/**
 * MCP SERVER REGISTRY
 *
 * Comprehensive registry of all available MCP (Model Context Protocol) servers
 * for integrating external project management and collaboration tools.
 *
 * This allows users to activate integrations through the UI with proper configuration.
 */

export type MCPServerCategory =
  | 'enterprise_ppm' // Enterprise PPM & Portfolio Management
  | 'agile_vro' // Agile & Value Realization Office
  | 'collaboration' // Team Collaboration & Communication
  | 'development' // Software Development & DevOps
  | 'documentation' // Documentation & Knowledge Management
  | 'finance' // Financial & ERP Systems
  | 'notification' // Notification & Alerting
  | 'orchestration' // Workflow & Agent Orchestration
  | 'data_platform'; // Enterprise Data Platforms & Process Mining

export type MCPServerStatus = 'available' | 'coming_soon' | 'community' | 'enterprise_only';

export interface MCPConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'email' | 'select' | 'number';
  required: boolean;
  description: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  sensitive?: boolean; // Will be encrypted
}

export interface MCPServerDefinition {
  id: string;
  name: string;
  displayName: string;
  category: MCPServerCategory;
  status: MCPServerStatus;
  description: string;
  logo?: string;
  officialMCP: boolean; // Has official MCP server
  capabilities: string[];
  usedBy: string[]; // Which offices use this (PMO, TMO, VRO, FinOps, etc.)
  configFields: MCPConfigField[];
  documentation?: string;
  setupInstructions?: string;
}

/**
 * Complete MCP Server Registry
 * All available integrations with their configuration requirements
 */
export const MCP_SERVER_REGISTRY: Record<string, MCPServerDefinition> = {
  // ============================================================================
  // ENTERPRISE PPM & PORTFOLIO MANAGEMENT
  // ============================================================================

  'microsoft-project-server': {
    id: 'microsoft-project-server',
    name: 'Microsoft Project Server',
    displayName: 'Microsoft Project Server / Online',
    category: 'enterprise_ppm',
    status: 'available',
    officialMCP: true,
    description:
      'Complex Waterfall & Enterprise Resource Management. Official MCP Server via Microsoft 365 integration.',
    capabilities: [
      'Project Portfolio Management',
      'Resource Capacity Planning',
      'Gantt Charts & Dependencies',
      'Timesheet Management',
      'Financial Tracking',
      'Risk & Issues Management',
    ],
    usedBy: ['PMO', 'TMO', 'FinOps', 'Resource Management'],
    configFields: [
      {
        name: 'tenantId',
        label: 'Tenant ID',
        type: 'text',
        required: true,
        description: 'Your Microsoft 365 Tenant ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      },
      {
        name: 'clientId',
        label: 'Client ID (App ID)',
        type: 'text',
        required: true,
        description: 'Azure AD App Registration Client ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'Azure AD App Registration Client Secret',
        sensitive: true,
      },
      {
        name: 'siteUrl',
        label: 'Project Site URL',
        type: 'url',
        required: true,
        description: 'Your Project Web App (PWA) URL',
        placeholder: 'https://tenant.sharepoint.com/sites/pwa',
      },
    ],
    documentation: 'https://docs.microsoft.com/en-us/project/project-server-2016',
    setupInstructions: `
1. Register app in Azure AD: https://portal.azure.com
2. Grant permissions: Sites.Read.All, Project.Read, User.Read
3. Create client secret and copy tenant/client IDs
4. Enter PWA site URL
    `,
  },

  planview: {
    id: 'planview',
    name: 'Planview',
    displayName: 'Planview Enterprise One',
    category: 'enterprise_ppm',
    status: 'available',
    officialMCP: true,
    description:
      'Strategic Portfolio Management & Capacity Planning. Custom MCP connectors for enterprise PPM.',
    capabilities: [
      'Portfolio Management',
      'Strategic Planning',
      'Resource Management',
      'Financial Management',
      'Idea Management',
      'Reporting & Analytics',
    ],
    usedBy: ['PMO', 'VRO', 'FinOps', 'Executive'],
    configFields: [
      {
        name: 'baseUrl',
        label: 'Planview URL',
        type: 'url',
        required: true,
        description: 'Your Planview instance URL',
        placeholder: 'https://your-company.planview.com',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Planview API Key',
        sensitive: true,
      },
      {
        name: 'tenantId',
        label: 'Tenant ID',
        type: 'text',
        required: false,
        description: 'Optional: Tenant ID for multi-tenant environments',
      },
      {
        name: 'apiVersion',
        label: 'API Version',
        type: 'select',
        required: false,
        description: 'Planview API Version',
        options: [
          { label: 'v1', value: 'v1' },
          { label: 'v2', value: 'v2' },
          { label: 'v3', value: 'v3' },
        ],
      },
    ],
    documentation: 'https://success.planview.com/Planview_Enterprise_One/Developer_and_API_Documentation',
  },

  'servicenow-spm': {
    id: 'servicenow-spm',
    name: 'ServiceNow SPM',
    displayName: 'ServiceNow Strategic Portfolio Management',
    category: 'enterprise_ppm',
    status: 'available',
    officialMCP: true,
    description: 'IT Governance & Strategic Alignment with integrated AI agents.',
    capabilities: [
      'Strategic Planning',
      'Demand Management',
      'Portfolio Management',
      'Resource Management',
      'IT Governance',
      'Change Management',
    ],
    usedBy: ['PMO', 'Governance', 'IT Management'],
    configFields: [
      {
        name: 'instance',
        label: 'ServiceNow Instance',
        type: 'text',
        required: true,
        description: 'Your ServiceNow instance name',
        placeholder: 'your-company.service-now.com',
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        description: 'ServiceNow username',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        description: 'ServiceNow password',
        sensitive: true,
      },
      {
        name: 'clientId',
        label: 'OAuth Client ID (Optional)',
        type: 'text',
        required: false,
        description: 'For OAuth authentication',
      },
      {
        name: 'clientSecret',
        label: 'OAuth Client Secret (Optional)',
        type: 'password',
        required: false,
        description: 'For OAuth authentication',
        sensitive: true,
      },
    ],
    documentation: 'https://docs.servicenow.com/bundle/tokyo-strategic-portfolio-management',
  },

  smartsheet: {
    id: 'smartsheet',
    name: 'Smartsheet',
    displayName: 'Smartsheet',
    category: 'enterprise_ppm',
    status: 'available',
    officialMCP: true,
    description: 'Flexible Workflows & "Spreadsheet-plus" project management. Community MCP Server available.',
    capabilities: [
      'Flexible Spreadsheets',
      'Gantt Charts',
      'Card View',
      'Calendar View',
      'Resource Management',
      'Automation',
    ],
    usedBy: ['PMO', 'All Teams'],
    configFields: [
      {
        name: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Smartsheet API Access Token',
        placeholder: 'Get from: Account > Apps & Integrations > API Access',
        sensitive: true,
      },
    ],
    documentation: 'https://smartsheet.redoc.ly/',
    setupInstructions: `
1. Go to Account > Apps & Integrations
2. Click "API Access"
3. Generate new access token
4. Copy and paste token here
    `,
  },

  triskell: {
    id: 'triskell',
    name: 'Triskell',
    displayName: 'Triskell Software',
    category: 'enterprise_ppm',
    status: 'available',
    officialMCP: false,
    description: 'Strategy Execution & Agile Portfolios. REST API (MCP-ready).',
    capabilities: [
      'Strategic Planning',
      'Portfolio Management',
      'Agile & Waterfall',
      'Resource Management',
      'Financial Tracking',
      'OKR Management',
    ],
    usedBy: ['PMO', 'VRO', 'Strategy'],
    configFields: [
      {
        name: 'baseUrl',
        label: 'Triskell URL',
        type: 'url',
        required: true,
        description: 'Your Triskell instance URL',
        placeholder: 'https://your-company.triskell.com',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Triskell API Key',
        sensitive: true,
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: false,
        description: 'Optional: For basic auth',
      },
    ],
    documentation: 'https://help.triskell.com/',
  },

  // ============================================================================
  // AGILE & VALUE REALIZATION OFFICE (VRO)
  // ============================================================================

  jira: {
    id: 'jira',
    name: 'Jira',
    displayName: 'Jira Software (Atlassian)',
    category: 'agile_vro',
    status: 'available',
    officialMCP: true,
    description:
      'Industry standard for Agile. Official MCP Server for automated ticket management and sprint reports.',
    capabilities: [
      'Sprint Management',
      'Backlog Grooming',
      'Epic & Story Tracking',
      'Kanban Boards',
      'Burndown Charts',
      'Custom Workflows',
    ],
    usedBy: ['VRO', 'TMO', 'Development Teams', 'PMO'],
    configFields: [
      {
        name: 'domain',
        label: 'Jira Domain',
        type: 'text',
        required: true,
        description: 'Your Atlassian domain',
        placeholder: 'your-company.atlassian.net',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        description: 'Your Atlassian account email',
      },
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        description: 'Jira API Token',
        placeholder: 'Get from: https://id.atlassian.com/manage-profile/security/api-tokens',
        sensitive: true,
      },
    ],
    documentation: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/',
    setupInstructions: `
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the generated token
4. Enter your domain (without https://)
    `,
  },

  linear: {
    id: 'linear',
    name: 'Linear',
    displayName: 'Linear',
    category: 'agile_vro',
    status: 'available',
    officialMCP: true,
    description: 'High-performance Agile tool. Robust MCP Server for automated ticket triage and backlog grooming.',
    capabilities: [
      'Issue Tracking',
      'Sprint Planning',
      'Roadmap Planning',
      'Triage Automation',
      'Project Updates',
      'Slack Integration',
    ],
    usedBy: ['VRO', 'Development Teams', 'Product Management'],
    configFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Linear API Key',
        placeholder: 'Get from: Settings > API > Personal API keys',
        sensitive: true,
      },
    ],
    documentation: 'https://developers.linear.app/docs',
    setupInstructions: `
1. Go to Linear Settings > API
2. Create Personal API key
3. Copy and paste here
    `,
  },

  'azure-devops': {
    id: 'azure-devops',
    name: 'Azure DevOps',
    displayName: 'Azure Boards / DevOps',
    category: 'agile_vro',
    status: 'available',
    officialMCP: true,
    description: "Part of Azure DevOps suite. Integrates with Microsoft's MCP ecosystem for enterprise Agile.",
    capabilities: [
      'Work Item Tracking',
      'Sprint Planning',
      'Backlogs',
      'Boards',
      'Queries',
      'CI/CD Integration',
    ],
    usedBy: ['VRO', 'Development Teams', 'DevOps'],
    configFields: [
      {
        name: 'organization',
        label: 'Organization',
        type: 'text',
        required: true,
        description: 'Your Azure DevOps organization name',
        placeholder: 'your-company',
      },
      {
        name: 'pat',
        label: 'Personal Access Token (PAT)',
        type: 'password',
        required: true,
        description: 'Azure DevOps Personal Access Token',
        placeholder: 'Get from: User Settings > Personal access tokens',
        sensitive: true,
      },
      {
        name: 'project',
        label: 'Default Project (Optional)',
        type: 'text',
        required: false,
        description: 'Default project to use',
      },
    ],
    documentation: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/',
    setupInstructions: `
1. Click your avatar > Security > Personal access tokens
2. Create new token with Work Items (Read & Write) scope
3. Copy token immediately (shown only once)
4. Enter organization name (from URL)
    `,
  },

  targetprocess: {
    id: 'targetprocess',
    name: 'Targetprocess',
    displayName: 'Targetprocess (Apptio)',
    category: 'agile_vro',
    status: 'available',
    officialMCP: false,
    description: 'Value Stream Management and scaled Agile (SAFe). REST API available.',
    capabilities: [
      'SAFe Framework',
      'Value Stream Mapping',
      'Portfolio Management',
      'Agile at Scale',
      'Custom Workflows',
      'Reporting',
    ],
    usedBy: ['VRO', 'Scaled Agile Teams', 'Portfolio Management'],
    configFields: [
      {
        name: 'baseUrl',
        label: 'Targetprocess URL',
        type: 'url',
        required: true,
        description: 'Your Targetprocess instance URL',
        placeholder: 'https://your-company.tpondemand.com',
      },
      {
        name: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Targetprocess API Access Token',
        sensitive: true,
      },
    ],
    documentation: 'https://dev.targetprocess.com/',
  },

  'jira-align': {
    id: 'jira-align',
    name: 'Jira Align',
    displayName: 'Jira Align',
    category: 'agile_vro',
    status: 'available',
    officialMCP: true,
    description: 'Enterprise Agile planning and value stream management at scale.',
    capabilities: [
      'SAFe/LeSS/DAD Support',
      'PI Planning',
      'Value Stream Management',
      'Portfolio Management',
      'OKR Alignment',
      'Agile Metrics',
    ],
    usedBy: ['VRO', 'Scaled Agile', 'Enterprise PMO'],
    configFields: [
      {
        name: 'instance',
        label: 'Jira Align Instance',
        type: 'text',
        required: true,
        description: 'Your Jira Align instance name',
        placeholder: 'your-company',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        description: 'Your Jira Align account email',
      },
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        description: 'Jira Align API Token',
        sensitive: true,
      },
    ],
    documentation: 'https://help.jiraalign.com/hc/en-us/articles/115000043063-Public-API',
  },

  // ============================================================================
  // DEVELOPMENT & DEVOPS
  // ============================================================================

  github: {
    id: 'github',
    name: 'GitHub',
    displayName: 'GitHub',
    category: 'development',
    status: 'available',
    officialMCP: true,
    description: 'Track PRs, issues, and project milestones directly within development repos.',
    capabilities: [
      'Issue Tracking',
      'Pull Request Management',
      'Project Boards',
      'Milestones',
      'Code Review',
      'Actions Integration',
    ],
    usedBy: ['Development Teams', 'DevOps', 'TMO'],
    configFields: [
      {
        name: 'accessToken',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        description: 'GitHub Personal Access Token',
        placeholder: 'Get from: Settings > Developer settings > Personal access tokens',
        sensitive: true,
      },
      {
        name: 'owner',
        label: 'Default Owner/Organization',
        type: 'text',
        required: false,
        description: 'Default repository owner or organization',
      },
    ],
    documentation: 'https://docs.github.com/en/rest',
    setupInstructions: `
1. Go to GitHub Settings > Developer settings
2. Click Personal access tokens > Tokens (classic)
3. Generate new token with repo scope
4. Copy token immediately
    `,
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    displayName: 'GitLab',
    category: 'development',
    status: 'available',
    officialMCP: true,
    description: 'Complete DevOps platform with issue tracking, CI/CD, and project management.',
    capabilities: [
      'Issue Management',
      'Merge Requests',
      'CI/CD Pipelines',
      'Project Planning',
      'Milestones',
      'Boards',
    ],
    usedBy: ['Development Teams', 'DevOps'],
    configFields: [
      {
        name: 'baseUrl',
        label: 'GitLab URL',
        type: 'url',
        required: true,
        description: 'GitLab instance URL',
        placeholder: 'https://gitlab.com or your self-hosted URL',
      },
      {
        name: 'accessToken',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        description: 'GitLab Personal Access Token',
        sensitive: true,
      },
    ],
    documentation: 'https://docs.gitlab.com/ee/api/',
  },

  // ============================================================================
  // COLLABORATION & COMMUNICATION
  // ============================================================================

  asana: {
    id: 'asana',
    name: 'Asana',
    displayName: 'Asana',
    category: 'collaboration',
    status: 'available',
    officialMCP: true,
    description: 'Community-supported MCP server for task management, project owners, and deadlines.',
    capabilities: [
      'Task Management',
      'Project Tracking',
      'Team Collaboration',
      'Timeline View',
      'Portfolio Management',
      'Automation',
    ],
    usedBy: ['All Teams', 'PMO', 'Marketing'],
    configFields: [
      {
        name: 'accessToken',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        description: 'Asana Personal Access Token',
        placeholder: 'Get from: Settings > Apps > Developer apps',
        sensitive: true,
      },
    ],
    documentation: 'https://developers.asana.com/docs',
    setupInstructions: `
1. Go to Asana Settings > Apps
2. Click "Developer apps" > "Create new token"
3. Copy token
    `,
  },

  monday: {
    id: 'monday',
    name: 'Monday.com',
    displayName: 'Monday.com',
    category: 'collaboration',
    status: 'available',
    officialMCP: true,
    description: 'Work OS for tracking large-scale organizational changes. Used by TMO.',
    capabilities: [
      'Custom Workflows',
      'Project Tracking',
      'Team Collaboration',
      'Automations',
      'Dashboards',
      'Time Tracking',
    ],
    usedBy: ['TMO', 'PMO', 'All Teams'],
    configFields: [
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        description: 'Monday.com API Token',
        placeholder: 'Get from: Profile > Admin > API',
        sensitive: true,
      },
    ],
    documentation: 'https://developer.monday.com/api-reference/docs',
    setupInstructions: `
1. Click your avatar > Admin > API
2. Generate new token
3. Copy token
    `,
  },

  wrike: {
    id: 'wrike',
    name: 'Wrike',
    displayName: 'Wrike',
    category: 'collaboration',
    status: 'available',
    officialMCP: false,
    description: 'Track large-scale organizational changes and transformation initiatives.',
    capabilities: [
      'Project Management',
      'Gantt Charts',
      'Custom Workflows',
      'Resource Management',
      'Time Tracking',
      'Reporting',
    ],
    usedBy: ['TMO', 'PMO', 'Marketing'],
    configFields: [
      {
        name: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Wrike API Access Token',
        sensitive: true,
      },
    ],
    documentation: 'https://developers.wrike.com/',
  },

  clickup: {
    id: 'clickup',
    name: 'ClickUp',
    displayName: 'ClickUp',
    category: 'collaboration',
    status: 'available',
    officialMCP: true,
    description: 'All-in-one project management platform with extensive customization.',
    capabilities: [
      'Task Management',
      'Multiple Views',
      'Custom Fields',
      'Automation',
      'Time Tracking',
      'Dashboards',
    ],
    usedBy: ['All Teams', 'PMO'],
    configFields: [
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        description: 'ClickUp API Token',
        placeholder: 'Get from: Settings > Apps > API Token',
        sensitive: true,
      },
    ],
    documentation: 'https://clickup.com/api',
  },

  // ============================================================================
  // DOCUMENTATION & KNOWLEDGE MANAGEMENT
  // ============================================================================

  notion: {
    id: 'notion',
    name: 'Notion',
    displayName: 'Notion',
    category: 'documentation',
    status: 'available',
    officialMCP: true,
    description: 'Programmable hub for documentation and project databases.',
    capabilities: [
      'Wiki & Documentation',
      'Project Databases',
      'Task Management',
      'Meeting Notes',
      'Knowledge Base',
      'Collaboration',
    ],
    usedBy: ['All Teams', 'Documentation'],
    configFields: [
      {
        name: 'apiKey',
        label: 'Internal Integration Token',
        type: 'password',
        required: true,
        description: 'Notion Internal Integration Token',
        placeholder: 'Get from: Settings > Integrations > Develop your own integration',
        sensitive: true,
      },
    ],
    documentation: 'https://developers.notion.com/',
    setupInstructions: `
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Copy Internal Integration Token
4. Share pages with your integration
    `,
  },

  confluence: {
    id: 'confluence',
    name: 'Confluence',
    displayName: 'Confluence (Atlassian)',
    category: 'documentation',
    status: 'available',
    officialMCP: true,
    description: 'Team collaboration and documentation platform.',
    capabilities: [
      'Documentation',
      'Team Spaces',
      'Page Templates',
      'Comments',
      'Version History',
      'Integration with Jira',
    ],
    usedBy: ['All Teams', 'Documentation'],
    configFields: [
      {
        name: 'domain',
        label: 'Confluence Domain',
        type: 'text',
        required: true,
        description: 'Your Atlassian domain',
        placeholder: 'your-company.atlassian.net',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        description: 'Your Atlassian account email',
      },
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        description: 'Confluence API Token',
        sensitive: true,
      },
    ],
    documentation: 'https://developer.atlassian.com/cloud/confluence/rest/v1/intro/',
  },

  airtable: {
    id: 'airtable',
    name: 'Airtable',
    displayName: 'Airtable',
    category: 'documentation',
    status: 'available',
    officialMCP: true,
    description: 'Read/write access to custom project databases and trackers.',
    capabilities: [
      'Custom Databases',
      'Flexible Views',
      'Relational Data',
      'Automation',
      'Forms',
      'Integrations',
    ],
    usedBy: ['All Teams', 'Data Management'],
    configFields: [
      {
        name: 'apiKey',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        description: 'Airtable Personal Access Token',
        placeholder: 'Get from: Account > Generate API key',
        sensitive: true,
      },
    ],
    documentation: 'https://airtable.com/developers/web/api/introduction',
  },

  ragie: {
    id: 'ragie',
    name: 'Ragie',
    displayName: 'Ragie RAG Platform',
    category: 'documentation',
    status: 'available',
    officialMCP: true,
    description: 'Enterprise RAG platform for intelligent document retrieval and knowledge management. Replaces Weaviate/Pinecone with managed solution.',
    capabilities: [
      'Document Ingestion (PDF, DOCX, TXT, MD)',
      'Intelligent Chunking & Embedding',
      'Semantic Search & Retrieval',
      'Multi-Source Data Connectors',
      'Auto-Sync from Google Drive, SharePoint, Confluence, etc.',
      'Production-Ready RAG Pipeline',
      'Query Analytics & Monitoring',
      'Enterprise Security & Access Control',
    ],
    usedBy: ['All Agents', 'Knowledge Base', 'Document Intelligence', 'Governance', 'Risk', 'Compliance'],
    configFields: [
      {
        name: 'apiKey',
        label: 'Ragie API Key',
        type: 'password',
        required: true,
        description: 'Your Ragie API Key from dashboard',
        placeholder: 'Get from: https://app.ragie.ai/settings/api-keys',
        sensitive: true,
      },
      {
        name: 'partition',
        label: 'Partition Name (Optional)',
        type: 'text',
        required: false,
        description: 'Partition to organize documents by tenant/project',
        placeholder: 'e.g., project-123, tenant-acme',
      },
      {
        name: 'mode',
        label: 'Retrieval Mode',
        type: 'select',
        required: false,
        description: 'How Ragie retrieves documents',
        options: [
          { label: 'Hybrid (Default)', value: 'hybrid' },
          { label: 'Semantic Only', value: 'semantic' },
          { label: 'Keyword Only', value: 'keyword' },
        ],
      },
    ],
    documentation: 'https://docs.ragie.ai',
    setupInstructions: `
1. Sign up at https://ragie.ai
2. Go to Settings > API Keys and create a new key
3. (Optional) Set up data connectors for auto-sync:
   - Google Drive, SharePoint, Confluence, Notion, etc.
   - See: https://www.ragie.ai/connectors
4. (Optional) Create a partition for multi-tenancy
5. Paste API key here to connect

Ragie will automatically:
- Process and chunk uploaded documents
- Generate embeddings
- Enable semantic search across your knowledge base
- Sync changes from connected sources
    `,
  },

  // ============================================================================
  // COMMUNICATION & NOTIFICATIONS
  // ============================================================================

  slack: {
    id: 'slack',
    name: 'Slack',
    displayName: 'Slack',
    category: 'notification',
    status: 'available',
    officialMCP: true,
    description: 'Team communication and notifications.',
    capabilities: [
      'Channel Messaging',
      'Direct Messages',
      'File Sharing',
      'Workflow Automation',
      'Bot Integration',
    ],
    usedBy: ['All Teams'],
    configFields: [
      {
        name: 'botToken',
        label: 'Bot User OAuth Token',
        type: 'password',
        required: true,
        description: 'Slack Bot Token (starts with xoxb-)',
        placeholder: 'xoxb-your-bot-token',
        sensitive: true,
      },
      {
        name: 'webhookUrl',
        label: 'Webhook URL (Optional)',
        type: 'url',
        required: false,
        description: 'Incoming webhook URL for simple notifications',
        sensitive: true,
      },
    ],
    documentation: 'https://api.slack.com/',
    setupInstructions: `
1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Install app to workspace
4. Copy Bot User OAuth Token (xoxb-...)
    `,
  },

  'microsoft-teams': {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    displayName: 'Microsoft Teams',
    category: 'notification',
    status: 'available',
    officialMCP: true,
    description: 'Team communication and collaboration in Microsoft 365.',
    capabilities: [
      'Team Chat',
      'Channel Messaging',
      'Meetings',
      'File Collaboration',
      'Bot Integration',
      'Adaptive Cards',
    ],
    usedBy: ['All Teams'],
    configFields: [
      {
        name: 'webhookUrl',
        label: 'Incoming Webhook URL',
        type: 'url',
        required: true,
        description: 'Teams Incoming Webhook URL',
        placeholder: 'https://outlook.office.com/webhook/...',
        sensitive: true,
      },
    ],
    documentation: 'https://docs.microsoft.com/en-us/microsoftteams/platform/',
    setupInstructions: `
1. Go to Teams channel > Connectors
2. Add "Incoming Webhook"
3. Configure webhook and copy URL
    `,
  },

  // ============================================================================
  // FINANCE & ERP
  // ============================================================================

  sap: {
    id: 'sap',
    name: 'SAP',
    displayName: 'SAP ERP',
    category: 'finance',
    status: 'enterprise_only',
    officialMCP: false,
    description: 'Enterprise Resource Planning and financial integration.',
    capabilities: [
      'Financial Management',
      'Project System (PS)',
      'Controlling (CO)',
      'Procurement',
      'HR Integration',
    ],
    usedBy: ['FinOps', 'PMO', 'Finance'],
    configFields: [
      {
        name: 'baseUrl',
        label: 'SAP System URL',
        type: 'url',
        required: true,
        description: 'SAP Gateway or OData service URL',
      },
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'SAP Client ID',
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        description: 'SAP Username',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        description: 'SAP Password',
        sensitive: true,
      },
    ],
    documentation: 'https://api.sap.com/',
  },

  workday: {
    id: 'workday',
    name: 'Workday',
    displayName: 'Workday',
    category: 'finance',
    status: 'enterprise_only',
    officialMCP: false,
    description: 'Financial planning and human capital management.',
    capabilities: [
      'Financial Planning',
      'HR Management',
      'Project Costing',
      'Resource Management',
      'Analytics',
    ],
    usedBy: ['FinOps', 'HR', 'Finance'],
    configFields: [
      {
        name: 'tenant',
        label: 'Tenant Name',
        type: 'text',
        required: true,
        description: 'Your Workday tenant name',
      },
      {
        name: 'username',
        label: 'Integration Username',
        type: 'text',
        required: true,
        description: 'Workday integration system user',
      },
      {
        name: 'password',
        label: 'Integration Password',
        type: 'password',
        required: true,
        description: 'Integration system user password',
        sensitive: true,
      },
    ],
    documentation: 'https://community.workday.com/sites/default/files/file-hosting/productionapi/index.html',
  },

  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    displayName: 'QuickBooks Online',
    category: 'finance',
    status: 'available',
    officialMCP: false,
    description: 'Accounting and financial management integration.',
    capabilities: [
      'Accounting',
      'Invoicing',
      'Expense Tracking',
      'Financial Reporting',
      'Project Costing',
    ],
    usedBy: ['FinOps', 'Finance', 'Accounting'],
    configFields: [
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'QuickBooks OAuth Client ID',
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'QuickBooks OAuth Client Secret',
        sensitive: true,
      },
      {
        name: 'realmId',
        label: 'Company ID (Realm ID)',
        type: 'text',
        required: true,
        description: 'QuickBooks Company ID',
      },
    ],
    documentation: 'https://developer.intuit.com/app/developer/qbo/docs/get-started',
  },

  rally: {
    id: 'rally',
    name: 'Rally',
    displayName: 'Rally (Broadcom)',
    category: 'agile_vro',
    status: 'available',
    officialMCP: false,
    description: 'Enterprise Agile Application Lifecycle Management.',
    capabilities: [
      'Agile Planning',
      'Portfolio Management',
      'Release Tracking',
      'Team Collaboration',
      'Custom Metrics',
    ],
    usedBy: ['VRO', 'Scaled Agile', 'PMO'],
    configFields: [
      {
        name: 'server',
        label: 'Rally Server',
        type: 'url',
        required: true,
        description: 'Rally server URL',
        placeholder: 'https://rally1.rallydev.com',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Rally API Key',
        sensitive: true,
      },
    ],
    documentation: 'https://rally1.rallydev.com/slm/doc/webservice/',
  },

  // ============================================================================
  // WORKFLOW & AGENT ORCHESTRATION
  // ============================================================================

  flowise: {
    id: 'flowise',
    name: 'Flowise',
    displayName: 'Flowise AI Workflow Builder',
    category: 'orchestration',
    status: 'available',
    officialMCP: true,
    description: 'Visual AI workflow and agent orchestration platform. Build multi-agent systems with drag-and-drop interface powered by LangChain.',
    capabilities: [
      'Multi-Agent Orchestration',
      'Visual Workflow Builder',
      'LangChain Integration',
      'Conditional Routing',
      'Agent-to-Agent Handoffs',
      'MCP Tool Integration',
      'Workflow Versioning',
      'Real-time Debugging',
      'API Endpoints',
    ],
    usedBy: ['All Agents', 'Workflow Designers', 'Technical Teams'],
    configFields: [
      {
        name: 'apiUrl',
        label: 'Flowise API URL',
        type: 'url',
        required: true,
        description: 'Flowise server URL',
        placeholder: 'http://localhost:3000 or https://flowise.yourdomain.com',
      },
      {
        name: 'apiKey',
        label: 'API Key (Optional)',
        type: 'password',
        required: false,
        description: 'Flowise API key if authentication is enabled',
        placeholder: 'Your Flowise API key',
        sensitive: true,
      },
      {
        name: 'chatflowId',
        label: 'Chatflow ID (Optional)',
        type: 'text',
        required: false,
        description: 'Specific chatflow/agentflow ID to connect to',
        placeholder: 'abc123-def456-ghi789',
      },
    ],
    documentation: 'https://docs.flowiseai.com',
    setupInstructions: `
1. Install Flowise: npm install -g flowise
2. Start Flowise: npx flowise start
3. Access UI at http://localhost:3000
4. Create an Agentflow for multi-agent orchestration
5. Enable API and copy the endpoint URL
6. (Optional) Enable authentication and generate API key
7. Connect your custom agents as MCP tools in Flowise

Flowise Features:
- Agentflow: Multi-agent orchestration with workflow coordination
- Chatflow: Single-agent systems and chatbots
- Assistant: Chat assistants with RAG capabilities
- 100+ integrations with LLMs, vector DBs, and tools
- MCP support for connecting to external tools

For agent integration:
- Add "MCP Tool" node in Flowise
- Point to your agent's MCP server URL
- Configure tool parameters
- Connect to workflow logic
    `,
  },

  retool: {
    id: 'retool',
    name: 'Retool',
    displayName: 'Retool Internal Tools',
    category: 'orchestration',
    status: 'available',
    officialMCP: true,
    description: 'Low-code platform for building internal tools, admin dashboards, and configuration UIs. Perfect for non-technical users to manage agent configurations and KPIs.',
    capabilities: [
      'Admin Dashboard Builder',
      'Form Builder',
      'Table/Grid Components',
      'Data Visualization',
      'Workflow Triggers',
      'Database Integration',
      'API Integration',
      'Access Control',
      'Audit Logging',
      'MCP Agent Integration',
    ],
    usedBy: ['Governance Team', 'Business Users', 'Administrators'],
    configFields: [
      {
        name: 'instanceUrl',
        label: 'Retool Instance URL',
        type: 'url',
        required: true,
        description: 'Your Retool instance URL',
        placeholder: 'https://yourcompany.retool.com',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Retool API key for programmatic access',
        placeholder: 'retool_api_...',
        sensitive: true,
      },
      {
        name: 'appId',
        label: 'App ID (Optional)',
        type: 'text',
        required: false,
        description: 'Specific Retool app to connect to',
        placeholder: 'app-collaboration-rules',
      },
    ],
    documentation: 'https://docs.retool.com',
    setupInstructions: `
1. Sign up at https://retool.com (free for <5 users)
2. Create new app for "Agent Configuration Dashboard"
3. Add components:
   - Table for listing all collaboration rules
   - Form for editing thresholds and configurations
   - Buttons for "Test" and "Publish" actions
4. Connect to your PostgreSQL database
5. Create REST API resources for:
   - GET /api/collaboration-rules (list rules)
   - PUT /api/collaboration-rules/:id (update rule)
   - POST /api/collaboration-rules/test (test changes)
6. Generate API key: Settings > API & Webhooks
7. Enable MCP agent access (optional)

Use Cases:
- Configuration dashboards for agent collaboration rules
- KPI threshold management
- Workflow approval interfaces
- Admin panels for governance teams
- Real-time monitoring dashboards

Retool MCP Integration:
- Agents can connect to Retool MCP server
- Query configuration data from agents
- Trigger workflow changes from agent logic
- See: https://docs.retool.com/agents/guides/tools/connect-to-mcp-server
    `,
  },

  // ============================================================================
  // DATA PLATFORMS & PROCESS INTELLIGENCE
  // ============================================================================

  celonis: {
    id: 'celonis',
    name: 'Celonis',
    displayName: 'Celonis Process Mining',
    category: 'data_platform',
    status: 'available',
    officialMCP: true,
    description: 'Enterprise process mining and execution management platform. Real-time process intelligence, bottleneck analysis, and process optimization powered by object-centric process mining (OCPM).',
    capabilities: [
      'Process Mining & Discovery',
      'Process Variant Analysis',
      'Bottleneck Detection',
      'Cycle Time Analytics',
      'Conformance Checking',
      'Root Cause Analysis',
      'Process Simulation',
      'Action Engine (Automation)',
      'Real-time Process Monitoring',
      'Executive Dashboards',
    ],
    usedBy: ['PMO', 'VRO', 'TMO', 'Process Excellence', 'Operations'],
    configFields: [
      {
        name: 'teamUrl',
        label: 'Celonis Team URL',
        type: 'url',
        required: true,
        description: 'Your Celonis team instance URL',
        placeholder: 'https://your-team.celonis.cloud',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Celonis API key from App Keys management',
        placeholder: 'Your Celonis API key',
        sensitive: true,
      },
      {
        name: 'dataModelId',
        label: 'Data Model ID (Optional)',
        type: 'text',
        required: false,
        description: 'Specific data model to query',
        placeholder: 'your-uuid-here',
      },
      {
        name: 'workspaceId',
        label: 'Workspace ID (Optional)',
        type: 'text',
        required: false,
        description: 'Workspace containing your analyses',
        placeholder: 'your-uuid-here',
      },
    ],
    documentation: 'https://docs.celonis.com/en/introduction.html',
    setupInstructions: `
1. Login to your Celonis instance
2. Navigate to: Profile > App Keys > Create App Key
3. Grant permissions:
   - Read access to data models
   - Read access to analyses
   - Execute action flows (optional)
4. Copy the API key and team URL
5. (Optional) Find your Data Model ID:
   - Open Studio > Data Models
   - Click on your data model
   - Copy ID from URL
6. Configure data connection to your source systems

What Your Agents Can Do:
- Query process mining data (variants, bottlenecks, cycle times)
- Analyze conformance violations (processes deviating from standards)
- Detect automation opportunities in workflows
- Track KPIs from real process execution data
- Identify process inefficiencies and recommend optimizations
- Compare actual vs. planned process execution

Integration Benefits:
- PMO agents can see real execution data from Jira/ServiceNow
- VRO agents can measure actual value delivery cycle times
- TMO agents can optimize change management processes
- Governance agents can enforce process compliance
    `,
  },

  palantir: {
    id: 'palantir',
    name: 'Palantir',
    displayName: 'Palantir Foundry',
    category: 'data_platform',
    status: 'available',
    officialMCP: true,
    description: 'Enterprise data platform with ontology-driven analytics. Unify siloed enterprise data, query across systems, and leverage Palantir\'s knowledge graph for AI-powered insights.',
    capabilities: [
      'Ontology-Based Data Model',
      'Cross-System Data Integration',
      'SQL Query Interface',
      'Knowledge Graph',
      'Data Lineage Tracking',
      'Object Explorer',
      'Workshop Analytics',
      'Pipeline Builder',
      'Multipass (Fine-grained permissions)',
      'AIP (AI-Powered Analysis)',
    ],
    usedBy: ['All Agents', 'Data Teams', 'Executive', 'Analytics'],
    configFields: [
      {
        name: 'foundryUrl',
        label: 'Foundry Instance URL',
        type: 'url',
        required: true,
        description: 'Your Palantir Foundry instance URL',
        placeholder: 'https://your-org.palantirfoundry.com',
      },
      {
        name: 'clientId',
        label: 'OAuth Client ID',
        type: 'text',
        required: true,
        description: 'OAuth2 client ID from Foundry',
        placeholder: 'Your client ID',
      },
      {
        name: 'clientSecret',
        label: 'OAuth Client Secret',
        type: 'password',
        required: true,
        description: 'OAuth2 client secret',
        placeholder: 'Your client secret',
        sensitive: true,
      },
      {
        name: 'ontologyRid',
        label: 'Ontology RID (Optional)',
        type: 'text',
        required: false,
        description: 'Resource Identifier for your ontology',
        placeholder: 'ri.ontology.main.ontology.00000000-0000-0000-0000-000000000000',
      },
    ],
    documentation: 'https://www.palantir.com/docs/foundry/',
    setupInstructions: `
1. Access your Palantir Foundry instance
2. Navigate to: Workspace Settings > Third-Party Applications
3. Create new OAuth2 application:
   - Name: "PMO/VRO Integration"
   - Scopes: api:read-data, api:write-data, ontology:read
4. Copy Client ID and Client Secret
5. (Optional) Get your Ontology RID:
   - Open Ontology Manager
   - Click on your ontology
   - Copy RID from URL or info panel
6. Whitelist your application's redirect URI

What Your Agents Can Do:
- Query unified enterprise data across all systems
- Access Palantir's knowledge graph for relationship analysis
- Run SQL queries on integrated datasets
- Leverage Palantir AIP for AI-powered data analysis
- Track data lineage from source to insight
- Execute saved Workshop analyses programmatically

Integration Benefits:
- Unify data from Jira, SAP, Workday, Salesforce, etc.
- Single source of truth for enterprise metrics
- AI agents can query across siloed systems without custom connectors
- Leverage Palantir's data quality and governance
- Use Palantir's ontology as your system of record
- Combine process mining (Celonis) with data platform (Palantir)

Positioning:
Your platform becomes the AI orchestration layer on top of Palantir's data layer. Palantir provides unified data, your agents provide intelligence and automation.
    `,
  },

  anaplan: {
    id: 'anaplan',
    name: 'Anaplan',
    displayName: 'Anaplan Connected Planning',
    category: 'finance',
    status: 'available',
    officialMCP: true,
    description: 'Enterprise planning and financial modeling platform. Real-time budgets, forecasts, scenarios, and workforce planning data integrated into your FinOps and PMO workflows.',
    capabilities: [
      'Financial Planning & Budgeting',
      'Scenario Modeling',
      'Workforce Planning',
      'Sales & Operations Planning',
      'Demand Planning',
      'Capital Planning',
      'Real-time What-If Analysis',
      'Multi-dimensional Models',
      'Connected Planning',
      'Custom Dashboards',
    ],
    usedBy: ['FinOps', 'PMO', 'Resource Planning', 'Executive', 'CFO Office'],
    configFields: [
      {
        name: 'workspaceId',
        label: 'Workspace ID',
        type: 'text',
        required: true,
        description: 'Your Anaplan workspace ID',
        placeholder: 'your-api-key-here',
      },
      {
        name: 'modelId',
        label: 'Model ID',
        type: 'text',
        required: true,
        description: 'Anaplan model ID containing your planning data',
        placeholder: '7B2C4D5E6F7G8H9I',
      },
      {
        name: 'authToken',
        label: 'Authentication Token',
        type: 'password',
        required: true,
        description: 'Anaplan API authentication token (Basic or Certificate)',
        placeholder: 'Your auth token or certificate',
        sensitive: true,
      },
      {
        name: 'apiUrl',
        label: 'API Base URL',
        type: 'url',
        required: false,
        description: 'Anaplan API endpoint (leave default for cloud)',
        placeholder: 'https://api.anaplan.com',
      },
    ],
    documentation: 'https://help.anaplan.com/anapedia/Content/APIs/Introduction-to-the-Anaplan-API.html',
    setupInstructions: `
1. Login to Anaplan at https://anaplan.com
2. Navigate to: Administration > Integrations
3. Create API authentication:
   Option A - Basic Auth:
   - Use your email + password
   - Generate auth token via API

   Option B - Certificate Auth (Recommended):
   - Generate certificate in Anaplan
   - Download private key
   - Use certificate-based authentication
4. Find your Workspace ID:
   - URL when viewing workspace: ...workspace/[WORKSPACE_ID]
5. Find your Model ID:
   - Open model
   - URL: ...model/[MODEL_ID]
6. Test connection with: GET /workspaces/{workspaceId}/models

What Your Agents Can Do:
- Query budget and forecast data in real-time
- Access approved vs. actual spending
- Pull workforce capacity plans
- Retrieve scenario analysis results
- Check project funding availability
- Validate budget requests against approved plans
- Track capital expenditure allocations

Integration Benefits:
- FinOps agents can validate project costs against approved budgets
- PMO agents can check resource capacity from workforce plans
- Governance agents can enforce spend policies from Anaplan rules
- Real-time budget updates instead of static spreadsheets
- Scenario planning integration (what-if analysis for projects)
- Connected planning across finance and operations

Positioning:
Anaplan is the planning layer, your platform is the execution layer. Anaplan provides budgets and forecasts, your agents ensure projects stay aligned with financial plans.
    `,
  },
};

/**
 * Get MCP servers by category
 */
export function getMCPServersByCategory(category: MCPServerCategory): MCPServerDefinition[] {
  return Object.values(MCP_SERVER_REGISTRY).filter((server) => server.category === category);
}

/**
 * Get MCP servers by office (PMO, TMO, VRO, etc.)
 */
export function getMCPServersByOffice(office: string): MCPServerDefinition[] {
  return Object.values(MCP_SERVER_REGISTRY).filter((server) => server.usedBy.includes(office));
}

/**
 * Get all available MCP servers
 */
export function getAllMCPServers(): MCPServerDefinition[] {
  return Object.values(MCP_SERVER_REGISTRY).filter((server) => server.status === 'available');
}

/**
 * Get MCP server by ID
 */
export function getMCPServer(id: string): MCPServerDefinition | undefined {
  return MCP_SERVER_REGISTRY[id];
}

/**
 * Get official MCP servers only
 */
export function getOfficialMCPServers(): MCPServerDefinition[] {
  return Object.values(MCP_SERVER_REGISTRY).filter((server) => server.officialMCP && server.status === 'available');
}

/**
 * Get category display information
 */
export const MCP_CATEGORIES = {
  enterprise_ppm: {
    label: 'Enterprise PPM & Portfolio Management',
    description: 'Strategic portfolio management and enterprise resource planning',
    icon: 'Building2',
  },
  agile_vro: {
    label: 'Agile & Value Realization',
    description: 'Agile delivery and value stream management',
    icon: 'TrendingUp',
  },
  collaboration: {
    label: 'Collaboration & Work Management',
    description: 'Team collaboration and project tracking',
    icon: 'Users',
  },
  development: {
    label: 'Development & DevOps',
    description: 'Software development and continuous delivery',
    icon: 'Code',
  },
  documentation: {
    label: 'Documentation & Knowledge',
    description: 'Documentation and knowledge management',
    icon: 'BookOpen',
  },
  finance: {
    label: 'Finance & ERP',
    description: 'Financial management and enterprise systems',
    icon: 'DollarSign',
  },
  notification: {
    label: 'Communication & Notifications',
    description: 'Team communication and alerting',
    icon: 'Bell',
  },
  orchestration: {
    label: 'Workflow & Agent Orchestration',
    description: 'Multi-agent workflows and visual orchestration tools',
    icon: 'GitBranch',
  },
  data_platform: {
    label: 'Enterprise Data Platforms',
    description: 'Process mining, data integration, and enterprise analytics platforms',
    icon: 'Database',
  },
};
