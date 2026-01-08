import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bot, Zap, Brain, RefreshCw, FileText, 
  Target, GitBranch, Layers, Link2, Calendar, DollarSign,
  CheckCircle2, AlertTriangle, TrendingUp, Shield, Users,
  Sparkles, Activity, BarChart3, FileCode, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageAgentWizard } from "@/components/PageAgentWizard";

const agents = [
  {
    id: 'value-realization',
    name: 'Value Realization Agent',
    category: 'Value Realization',
    icon: DollarSign,
    color: 'bg-green-500',
    description: 'Orchestrates outcome-based portfolio governance with real-time ROI tracking, NPV analysis, and investment decision support.',
    responsibilities: [
      'Portfolio investment prioritization and optimization',
      'ROI and NPV calculation with scenario modeling',
      'Budget variance monitoring and forecasting'
    ],
    dataInputs: ['Project financials', 'Resource costs'],
    outputs: ['Investment recommendations', 'Budget alerts'],
    integratesWith: ['PMO Agent', 'Governance Agent', 'OKR Agent']
  },
  {
    id: 'pmo-orchestrator',
    name: 'PMO Flow Orchestrator',
    category: 'Project Management',
    icon: GitBranch,
    color: 'bg-green-500',
    description: 'Implements Lean/Agile PMO with flow metrics, replacing traditional Gantt charts with cycle time, throughput, and WIP analysis.',
    responsibilities: [
      'Flow metrics management (cycle time, throughput, WIP)',
      'Milestone tracking and critical path analysis',
      'Resource allocation and capacity planning'
    ],
    dataInputs: ['Task data', 'Resource availability'],
    outputs: ['Flow metrics', 'Milestone alerts'],
    integratesWith: ['TMO Agent', 'Value Realization Agent', 'OCM Agent']
  },
  {
    id: 'tmo-agent',
    name: 'TMO Transformation Agent',
    category: 'Transformation',
    icon: RefreshCw,
    color: 'bg-blue-500',
    description: 'Manages enterprise transformation initiatives with change impact analysis, adoption tracking, and benefits realization.',
    responsibilities: [
      'Transformation roadmap orchestration',
      'Change impact assessment and tracking',
      'Benefits realization monitoring'
    ],
    dataInputs: ['Initiative status', 'Change requests'],
    outputs: ['Impact assessments', 'Adoption metrics'],
    integratesWith: ['OCM Agent', 'PMO Agent', 'Governance Agent']
  },
  {
    id: 'finops-agent',
    name: 'FinOps Intelligence Agent',
    category: 'Financial Operations',
    icon: BarChart3,
    color: 'bg-purple-500',
    description: 'Provides financial intelligence with cost optimization, budget forecasting, and spend analytics across portfolios.',
    responsibilities: [
      'Cost optimization recommendations',
      'Budget forecasting and variance analysis',
      'Spend pattern detection and alerts'
    ],
    dataInputs: ['Financial data', 'Budget allocations'],
    outputs: ['Cost insights', 'Forecast reports'],
    integratesWith: ['Value Realization Agent', 'Governance Agent', 'Planning Agent']
  },
  {
    id: 'okr-agent',
    name: 'OKR Alignment Agent',
    category: 'Strategy Execution',
    icon: Target,
    color: 'bg-amber-500',
    description: 'Ensures strategic alignment through OKR tracking, cascade management, and goal achievement monitoring.',
    responsibilities: [
      'OKR cascade and alignment tracking',
      'Key result progress monitoring',
      'Strategic initiative linkage'
    ],
    dataInputs: ['Strategic goals', 'Initiative outcomes'],
    outputs: ['Alignment scores', 'Progress alerts'],
    integratesWith: ['Governance Agent', 'Value Realization Agent', 'TMO Agent']
  },
  {
    id: 'governance-agent',
    name: 'Governance Guardian Agent',
    category: 'Governance',
    icon: Shield,
    color: 'bg-red-500',
    description: 'Ensures compliance, risk management, and governance standards across all transformation activities.',
    responsibilities: [
      'Regulatory compliance monitoring',
      'Risk assessment and mitigation tracking',
      'Governance checkpoint automation'
    ],
    dataInputs: ['Compliance data', 'Risk registers'],
    outputs: ['Compliance status', 'Risk alerts'],
    integratesWith: ['All Agents']
  },
  {
    id: 'planning-agent',
    name: 'Strategic Planning Agent',
    category: 'Planning',
    icon: Calendar,
    color: 'bg-teal-500',
    description: 'Coordinates strategic planning with scenario modeling, capacity planning, and resource optimization.',
    responsibilities: [
      'Strategic scenario modeling',
      'Capacity and resource planning',
      'Dependency management'
    ],
    dataInputs: ['Resource data', 'Strategic inputs'],
    outputs: ['Capacity plans', 'Scenario analyses'],
    integratesWith: ['PMO Agent', 'FinOps Agent', 'TMO Agent']
  },
  {
    id: 'ocm-agent',
    name: 'OCM Readiness Agent',
    category: 'Change Management',
    icon: Users,
    color: 'bg-pink-500',
    description: 'Manages organizational change readiness, stakeholder engagement, and adoption tracking.',
    responsibilities: [
      'Change readiness assessment',
      'Stakeholder engagement tracking',
      'Training and adoption monitoring'
    ],
    dataInputs: ['Stakeholder data', 'Training completion'],
    outputs: ['Readiness scores', 'Engagement reports'],
    integratesWith: ['TMO Agent', 'PMO Agent', 'Governance Agent']
  }
];

const mcpAgents = [
  {
    id: 'mcp-context',
    name: 'MCP Context Manager',
    category: 'Protocol',
    icon: RefreshCw,
    color: 'bg-blue-500',
    description: 'Manages context serialization and sharing between agents using Model Context Protocol standards.',
    responsibilities: [
      'Context serialization and deserialization',
      'Version-controlled context updates',
      'Conflict resolution protocols'
    ],
    dataInputs: ['Agent states', 'Context payloads'],
    outputs: ['Synchronized context', 'Version history'],
    integratesWith: ['All Agents', 'A2A Router']
  },
  {
    id: 'a2a-router',
    name: 'A2A Message Router',
    category: 'Communication',
    icon: GitBranch,
    color: 'bg-purple-500',
    description: 'Routes messages between agents with priority handling, acknowledgment, and retry logic.',
    responsibilities: [
      'Priority-based message routing',
      'Acknowledgment and retry logic',
      'Cross-agent transaction support'
    ],
    dataInputs: ['Agent messages', 'Priority rules'],
    outputs: ['Routed messages', 'Delivery confirmations'],
    integratesWith: ['MCP Context Manager', 'All Agents']
  }
];

const integrationAgents = [
  {
    id: 'jira-connector',
    name: 'Jira/Azure DevOps Connector',
    category: 'Project Tools',
    icon: GitBranch,
    color: 'bg-blue-500',
    description: 'Synchronizes project and sprint data with Jira and Azure DevOps for seamless workflow integration.',
    responsibilities: [
      'Two-way sprint data synchronization',
      'Issue and task mapping',
      'Velocity and burndown tracking'
    ],
    dataInputs: ['Sprint data', 'Issue updates'],
    outputs: ['Synced projects', 'Status updates'],
    integratesWith: ['PMO Agent', 'Planning Agent']
  },
  {
    id: 'servicenow-connector',
    name: 'ServiceNow Connector',
    category: 'ITSM',
    icon: Shield,
    color: 'bg-green-500',
    description: 'Integrates with ServiceNow for ITSM and change management workflows.',
    responsibilities: [
      'Change request automation',
      'Incident correlation',
      'CMDB synchronization'
    ],
    dataInputs: ['Change requests', 'Incidents'],
    outputs: ['Approved changes', 'Incident reports'],
    integratesWith: ['Governance Agent', 'TMO Agent']
  },
  {
    id: 'bi-connector',
    name: 'Power BI/Tableau Connector',
    category: 'Analytics',
    icon: BarChart3,
    color: 'bg-amber-500',
    description: 'Exports data to BI platforms for advanced visualization and executive reporting.',
    responsibilities: [
      'Automated data refresh',
      'Dashboard embedding',
      'Report distribution'
    ],
    dataInputs: ['Portfolio metrics', 'KPI data'],
    outputs: ['BI datasets', 'Embedded reports'],
    integratesWith: ['Value Realization Agent', 'FinOps Agent']
  },
  {
    id: 'comms-connector',
    name: 'Slack/Teams Connector',
    category: 'Communication',
    icon: Users,
    color: 'bg-purple-500',
    description: 'Delivers notifications and alerts to collaboration platforms with actionable buttons.',
    responsibilities: [
      'Real-time alert delivery',
      'Interactive notifications',
      'Channel-based routing'
    ],
    dataInputs: ['Alert events', 'User preferences'],
    outputs: ['Notifications', 'Action responses'],
    integratesWith: ['All Agents', 'OCM Agent']
  }
];

const roadmapPhases = [
  {
    id: 'phase-1',
    name: 'Phase 1: Foundation',
    category: 'Q1 2025',
    icon: Layers,
    color: 'bg-blue-500',
    description: 'Establish core agent infrastructure and basic communication protocols.',
    responsibilities: [
      'Core agent deployment',
      'Basic MCP implementation',
      'Dashboard integration'
    ],
    dataInputs: ['Requirements', 'Architecture specs'],
    outputs: ['Deployed agents', 'Basic dashboards'],
    integratesWith: ['IT Infrastructure', 'Security Team']
  },
  {
    id: 'phase-2',
    name: 'Phase 2: Intelligence',
    category: 'Q2 2025',
    icon: Brain,
    color: 'bg-purple-500',
    description: 'Add predictive analytics and cross-agent learning capabilities.',
    responsibilities: [
      'Predictive analytics integration',
      'Cross-agent learning models',
      'Advanced risk modeling'
    ],
    dataInputs: ['Historical data', 'ML models'],
    outputs: ['Predictions', 'Risk scores'],
    integratesWith: ['Data Science Team', 'Phase 1 Agents']
  },
  {
    id: 'phase-3',
    name: 'Phase 3: Autonomy',
    category: 'Q3 2025',
    icon: Zap,
    color: 'bg-amber-500',
    description: 'Enable self-healing workflows and autonomous decision execution.',
    responsibilities: [
      'Self-healing workflows',
      'Autonomous decision execution',
      'Full A2A orchestration'
    ],
    dataInputs: ['Decision rules', 'Escalation policies'],
    outputs: ['Automated actions', 'Audit trails'],
    integratesWith: ['Governance Team', 'Phase 2 Agents']
  },
  {
    id: 'phase-4',
    name: 'Phase 4: Scale',
    category: 'Q4 2025',
    icon: TrendingUp,
    color: 'bg-green-500',
    description: 'Enterprise-wide rollout with multi-portfolio support and partner ecosystem.',
    responsibilities: [
      'Multi-portfolio support',
      'Enterprise-wide rollout',
      'Partner ecosystem integration'
    ],
    dataInputs: ['Scale requirements', 'Partner APIs'],
    outputs: ['Global deployment', 'Partner integrations'],
    integratesWith: ['All Business Units', 'External Partners']
  }
];

const valueAgents = [
  {
    id: 'roi-tracker',
    name: 'ROI Tracking Engine',
    category: 'Value Measurement',
    icon: TrendingUp,
    color: 'bg-green-500',
    description: 'Tracks return on investment across all transformation initiatives with real-time calculations.',
    responsibilities: [
      'Real-time ROI calculation',
      'Benefit realization tracking',
      'Value leakage detection'
    ],
    dataInputs: ['Investment data', 'Benefit metrics'],
    outputs: ['ROI reports', 'Value dashboards'],
    integratesWith: ['Value Realization Agent', 'FinOps Agent']
  },
  {
    id: 'cost-optimizer',
    name: 'Cost Optimization Agent',
    category: 'Cost Management',
    icon: DollarSign,
    color: 'bg-blue-500',
    description: 'Identifies cost reduction opportunities and optimizes resource allocation.',
    responsibilities: [
      'Cost reduction identification',
      'Resource optimization',
      'Vendor spend analysis'
    ],
    dataInputs: ['Spend data', 'Resource utilization'],
    outputs: ['Savings opportunities', 'Optimization plans'],
    integratesWith: ['FinOps Agent', 'Planning Agent']
  },
  {
    id: 'benefit-realizer',
    name: 'Benefit Realization Agent',
    category: 'Benefits',
    icon: Target,
    color: 'bg-purple-500',
    description: 'Ensures planned benefits are achieved and tracks against business case projections.',
    responsibilities: [
      'Benefit tracking and validation',
      'Business case alignment',
      'Stakeholder value reporting'
    ],
    dataInputs: ['Business cases', 'Actuals data'],
    outputs: ['Benefit reports', 'Variance analysis'],
    integratesWith: ['Value Realization Agent', 'Governance Agent']
  },
  {
    id: 'efficiency-monitor',
    name: 'Efficiency Monitor',
    category: 'Productivity',
    icon: Activity,
    color: 'bg-amber-500',
    description: 'Monitors productivity gains and operational efficiency improvements.',
    responsibilities: [
      'Productivity measurement',
      'Process efficiency tracking',
      'Automation impact assessment'
    ],
    dataInputs: ['Process metrics', 'Automation data'],
    outputs: ['Efficiency scores', 'Improvement trends'],
    integratesWith: ['PMO Agent', 'TMO Agent']
  }
];

function AgentCard({ agent, index }: { agent: typeof agents[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 ${agent.color} rounded-lg`}>
              <agent.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {agent.category}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mt-1">{agent.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-green-700 flex items-center gap-1 mb-2">
              <CheckCircle2 size={14} />
              Key Responsibilities
            </p>
            <ul className="space-y-1">
              {agent.responsibilities.map((resp, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-1">›</span>
                  {resp}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-8 pt-2 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-1">Data Inputs</p>
              <div className="flex flex-wrap gap-1">
                {agent.dataInputs.map((input, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                    {input}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Outputs</p>
              <div className="flex flex-wrap gap-1">
                {agent.outputs.map((output, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {output}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">Integrates with:</p>
            <div className="flex flex-wrap gap-1">
              {agent.integratesWith.map((integration, i) => (
                <Badge key={i} className="text-xs bg-green-100 text-green-700 border-green-200">
                  {integration}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function VROFramework() {
  const [activeTab, setActiveTab] = useState('agent-lineage');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">
        <PageAgentWizard 
          context={{
            pageName: 'VRO Framework',
            pageType: 'framework',
            metrics: {
              'Core Agents': agents.length,
              'MCP/A2A Agents': mcpAgents.length,
              'Integration Connectors': integrationAgents.length,
              'Roadmap Phases': roadmapPhases.length,
              'Value Agents': valueAgents.length
            }
          }}
          agentName="Framework Agent"
        />

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">VRO Agentic Framework</h1>
              <p className="text-gray-500">Enterprise Agentic Architecture</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6 max-w-3xl">
            Our Kyndryl Agentic Framework brings our State of the Art concept to life. Showing the vision for a fully autonomous enterprise framework supporting VRO, PMO, and TMO functions with real-time stakeholder engagement and predictive insights.
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-gray-400" />
              <span className="font-semibold text-gray-900">8</span>
              <span className="text-gray-500">Core Agents</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-blue-600">Real-Time</span>
              <span className="text-gray-500">Cross-Agent Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-purple-600">AI-Powered</span>
              <span className="text-gray-500">Recommendations</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 p-1 mb-8">
            <TabsTrigger value="agent-lineage" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-agent-lineage">
              Agent Lineage
            </TabsTrigger>
            <TabsTrigger value="mcp-a2a" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-mcp-a2a">
              MCP & A2A
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-integration">
              Integration
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-roadmap">
              Phased Roadmap
            </TabsTrigger>
            <TabsTrigger value="value-benefits" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-value-benefits">
              Value & Benefits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent-lineage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mcp-a2a">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mcpAgents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrationAgents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roadmap">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roadmapPhases.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="value-benefits">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {valueAgents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
