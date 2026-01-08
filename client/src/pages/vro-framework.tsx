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

const aiFeatures = [
  {
    id: 'alert-ticker',
    name: 'Live AI Alert Ticker',
    location: 'Dashboard Header',
    description: 'Real-time streaming of AI-generated insights, risk warnings, and opportunity alerts from across all portfolios.',
    value: 'Reduces time to identify critical issues from hours to seconds',
    icon: Activity
  },
  {
    id: 'command-center',
    name: 'AI Command Center',
    location: 'AI Insights Tab',
    description: 'Natural language interface for querying portfolio data, generating reports, and executing complex analyses.',
    value: 'Enables non-technical stakeholders to access deep analytics instantly',
    icon: Brain
  },
  {
    id: 'proactive-insights',
    name: 'Proactive Insights Engine',
    location: 'AI Insights Tab',
    description: 'Automatically surfaces emerging patterns, risks, and opportunities before they become obvious.',
    value: 'Shifts from reactive to predictive portfolio management',
    icon: Sparkles
  },
  {
    id: 'what-if-simulator',
    name: 'What-If Scenario Simulator',
    location: 'Policy Generator - Business View',
    description: 'Simulates policy changes against 245,000 historical applications to predict customer impact.',
    value: 'De-risks policy changes by showing exact customer impact before implementation',
    icon: TrendingUp
  },
  {
    id: 'policy-as-code',
    name: 'Policy as Code Generator',
    location: 'Policy Generator Page',
    description: 'Uses Claude AI to transform policy documents into machine-readable YAML rules.',
    value: 'Reduces policy digitization time from weeks to minutes',
    icon: FileCode
  },
  {
    id: 'business-rules-viewer',
    name: 'Business Rules Viewer',
    location: 'Policy Generator - Business View',
    description: 'AI-extracted plain English rules from complex policy documents for non-technical review.',
    value: 'Democratizes policy understanding across all stakeholders',
    icon: FileText
  }
];

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
            <TabsTrigger value="architecture" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-architecture">
              Architecture
            </TabsTrigger>
            <TabsTrigger value="mcp-a2a" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-mcp-a2a">
              MCP & A2A
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-integration">
              Integration
            </TabsTrigger>
            <TabsTrigger value="ai-in-app" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-ai-in-app">
              <Sparkles size={14} className="mr-1" />
              AI in This App
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent-lineage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="architecture">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-4">Agentic Architecture Overview</h2>
              <p className="text-gray-600 mb-6">
                The VRO Agentic Framework is built on a distributed agent architecture where each agent 
                operates autonomously while maintaining continuous communication with other agents through 
                the central message bus.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="text-blue-500" />
                      Agent Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      Specialized agents handle specific domains (Value, Risk, PMO) with dedicated 
                      knowledge bases and decision models.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Link2 className="text-purple-500" />
                      Communication Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      MCP (Model Context Protocol) enables agents to share context and A2A (Agent-to-Agent) 
                      messaging for coordinated actions.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="text-green-500" />
                      Data Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      Unified data platform aggregating portfolio, project, and financial data for 
                      cross-agent analysis.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mcp-a2a">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-4">MCP & Agent-to-Agent Communication</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <RefreshCw className="text-blue-500" />
                    Model Context Protocol (MCP)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    MCP provides a standardized way for agents to share context, including current state, 
                    historical decisions, and relevant data points.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Context serialization and deserialization
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Version-controlled context updates
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Conflict resolution protocols
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <GitBranch className="text-purple-500" />
                    Agent-to-Agent (A2A)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    A2A messaging enables direct communication between agents for coordinated decision-making 
                    and escalation workflows.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Priority-based message routing
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Acknowledgment and retry logic
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Cross-agent transaction support
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integration">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-4">Integration Points</h2>
              <p className="text-gray-600 mb-6">
                The VRO Framework integrates with enterprise systems for seamless data flow and automation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Jira / Azure DevOps', desc: 'Project and sprint data sync', status: 'Active' },
                  { name: 'ServiceNow', desc: 'ITSM and change management', status: 'Active' },
                  { name: 'Power BI / Tableau', desc: 'BI platform integration', status: 'Active' },
                  { name: 'SAP / Oracle Financials', desc: 'Budget and actuals data', status: 'Planned' },
                  { name: 'Slack / Teams', desc: 'Notification and alerts', status: 'Active' },
                  { name: 'SharePoint', desc: 'Document management', status: 'Active' }
                ].map((integration, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{integration.name}</span>
                        <Badge variant={integration.status === 'Active' ? 'default' : 'secondary'}>
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{integration.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-in-app">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles size={28} />
                  <h2 className="text-2xl font-bold">AI Features in This Application</h2>
                </div>
                <p className="text-white/80">
                  This dashboard leverages {aiFeatures.length} AI-powered features to deliver intelligent 
                  transformation management.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <feature.icon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {feature.location}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <p className="text-xs text-green-600 font-medium">
                              ✓ {feature.value}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
