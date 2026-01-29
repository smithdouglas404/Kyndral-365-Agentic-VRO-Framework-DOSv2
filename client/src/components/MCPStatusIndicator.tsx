/**
 * MCP STATUS INDICATOR
 *
 * Shows which MCPs are connected and which agents need them
 * Helps admins understand what needs to be configured
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Loader2
} from 'lucide-react';

interface MCPStatus {
  id: string;
  name: string;
  connected: boolean;
  required: boolean;
  optional: boolean;
  usedByAgents: string[];
  configUrl?: string;
  errorMessage?: string;
}

interface AgentMCPRequirements {
  agentId: string;
  agentName: string;
  requiredMCPs: string[];
  optionalMCPs: string[];
  status: 'ready' | 'partial' | 'not-configured';
}

export function MCPStatusIndicator() {
  const [mcpStatuses, setMcpStatuses] = useState<MCPStatus[]>([]);
  const [agentRequirements, setAgentRequirements] = useState<AgentMCPRequirements[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMCPStatus();
  }, []);

  const loadMCPStatus = async () => {
    try {
      setLoading(true);

      // Load MCP connection status
      const mcpResponse = await fetch('/api/admin/mcp/status');
      if (mcpResponse.ok) {
        const data = await mcpResponse.json();
        setMcpStatuses(data.mcps || getMockMCPStatuses());
      } else {
        setMcpStatuses(getMockMCPStatuses());
      }

      // Load agent requirements
      const agentsResponse = await fetch('/api/agents/mcp-requirements');
      if (agentsResponse.ok) {
        const data = await agentsResponse.json();
        setAgentRequirements(data.agents || getMockAgentRequirements());
      } else {
        setAgentRequirements(getMockAgentRequirements());
      }
    } catch (error) {
      console.error('Failed to load MCP status:', error);
      setMcpStatuses(getMockMCPStatuses());
      setAgentRequirements(getMockAgentRequirements());
    } finally {
      setLoading(false);
    }
  };

  const getMockMCPStatuses = (): MCPStatus[] => [
    {
      id: 'jira',
      name: 'Jira',
      connected: false,
      required: false,
      optional: true,
      usedByAgents: ['FinOps', 'PMO', 'Risk', 'Governance'],
      configUrl: '/admin/integrations/jira',
      errorMessage: 'Not configured - Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN in .env'
    },
    {
      id: 'servicenow',
      name: 'ServiceNow',
      connected: false,
      required: false,
      optional: true,
      usedByAgents: ['TMO', 'Risk', 'OCM'],
      configUrl: '/admin/integrations/servicenow',
      errorMessage: 'Not configured - Set SERVICENOW_INSTANCE, SERVICENOW_USERNAME, SERVICENOW_PASSWORD in .env'
    },
    {
      id: 'slack',
      name: 'Slack',
      connected: false,
      required: false,
      optional: true,
      usedByAgents: ['All Agents'],
      configUrl: '/admin/integrations/slack',
      errorMessage: 'Not configured - Set SLACK_WEBHOOK_URL in .env'
    },
    {
      id: 'monday',
      name: 'Monday.com',
      connected: false,
      required: false,
      optional: true,
      usedByAgents: ['PMO', 'Planning'],
      configUrl: '/admin/integrations/monday'
    },
    {
      id: 'azure-devops',
      name: 'Azure DevOps',
      connected: false,
      required: false,
      optional: true,
      usedByAgents: ['TMO', 'PMO'],
      configUrl: '/admin/integrations/azure-devops'
    }
  ];

  const getMockAgentRequirements = (): AgentMCPRequirements[] => [
    {
      agentId: 'finops',
      agentName: 'FinOps',
      requiredMCPs: [],
      optionalMCPs: ['jira', 'slack'],
      status: 'not-configured'
    },
    {
      agentId: 'tmo',
      agentName: 'TMO',
      requiredMCPs: [],
      optionalMCPs: ['servicenow', 'slack', 'azure-devops'],
      status: 'not-configured'
    },
    {
      agentId: 'risk',
      agentName: 'Risk',
      requiredMCPs: [],
      optionalMCPs: ['jira', 'servicenow', 'slack'],
      status: 'not-configured'
    },
    {
      agentId: 'pmo',
      agentName: 'PMO',
      requiredMCPs: [],
      optionalMCPs: ['jira', 'monday', 'slack'],
      status: 'not-configured'
    },
    {
      agentId: 'ocm',
      agentName: 'OCM',
      requiredMCPs: [],
      optionalMCPs: ['servicenow', 'slack'],
      status: 'not-configured'
    },
    {
      agentId: 'governance',
      agentName: 'Governance',
      requiredMCPs: [],
      optionalMCPs: ['jira', 'slack'],
      status: 'not-configured'
    },
    {
      agentId: 'planning',
      agentName: 'Planning',
      requiredMCPs: [],
      optionalMCPs: ['monday', 'slack'],
      status: 'not-configured'
    },
    {
      agentId: 'vro',
      agentName: 'VRO',
      requiredMCPs: [],
      optionalMCPs: ['slack'],
      status: 'not-configured'
    }
  ];

  const getStatusIcon = (connected: boolean, required: boolean) => {
    if (connected) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (required) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getAgentStatusBadge = (status: string) => {
    const variants = {
      'ready': 'default',
      'partial': 'secondary',
      'not-configured': 'destructive'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status === 'ready' && 'Ready'}
        {status === 'partial' && 'Partial'}
        {status === 'not-configured' && 'Not Configured'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MCP Integration Status</CardTitle>
          <CardDescription>Checking MCP connections...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const connectedCount = mcpStatuses.filter(m => m.connected).length;
  const totalCount = mcpStatuses.length;

  return (
    <div className="space-y-6">
      {/* Overall Status Alert */}
      {connectedCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No MCPs configured.</strong> Agents will work with limited functionality.
            Configure Jira, ServiceNow, or Slack to enable external notifications and ticketing.
          </AlertDescription>
        </Alert>
      )}

      {/* MCP Status Cards */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Integrations ({connectedCount}/{totalCount} Connected)</CardTitle>
          <CardDescription>
            Model Context Protocol integrations enable agents to create tickets, send notifications, and interact with external systems.
            All MCPs are optional - agents degrade gracefully if not configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mcpStatuses.map((mcp) => (
              <div key={mcp.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(mcp.connected, mcp.required)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{mcp.name}</h4>
                      {mcp.required && <Badge variant="destructive">Required</Badge>}
                      {mcp.optional && <Badge variant="outline">Optional</Badge>}
                    </div>

                    {!mcp.connected && mcp.errorMessage && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {mcp.errorMessage}
                      </p>
                    )}

                    {mcp.connected && (
                      <p className="text-sm text-green-600 mb-2">
                        ✓ Connected and ready
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Used by: {mcp.usedByAgents.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!mcp.connected && mcp.configUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = mcp.configUrl!}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/docs/mcps/${mcp.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Agent MCP Requirements</CardTitle>
          <CardDescription>
            Each agent can use specific MCPs to enhance functionality. All are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agentRequirements.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{agent.agentName}</span>
                    {getAgentStatusBadge(agent.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {agent.optionalMCPs.length > 0 && (
                      <>Optional: {agent.optionalMCPs.join(', ')}</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = '/admin/integrations'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure All Integrations
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open('/docs/mcp-setup-guide', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Day-One Setup Guide
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
