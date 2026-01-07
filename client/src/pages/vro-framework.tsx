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
    color: 'bg-blue-500',
    description: 'Orchestrates outcome-based portfolio governance with real-time ROI tracking, NPV analysis, and investment decision support.',
    responsibilities: [
      'Portfolio investment prioritization and optimization',
      'ROI and NPV calculation with scenario modeling',
      'Budget variance monitoring and forecasting',
      'Value stream mapping and optimization'
    ]
  },
  {
    id: 'pmo-orchestrator',
    name: 'PMO Flow Orchestrator',
    category: 'Project Management',
    icon: GitBranch,
    color: 'bg-purple-500',
    description: 'Implements Lean/Agile PMO with flow metrics, replacing traditional Gantt charts with cycle time, throughput, and WIP analysis.',
    responsibilities: [
      'Flow metrics management (cycle time, throughput, WIP)',
      'Milestone tracking and critical path analysis',
      'Resource allocation and capacity planning',
      'Dependency management and risk identification'
    ]
  },
  {
    id: 'risk-sentinel',
    name: 'Risk Sentinel Agent',
    category: 'Risk Management',
    icon: Shield,
    color: 'bg-red-500',
    description: 'Proactive risk detection using pattern recognition and predictive analytics to identify issues before they impact delivery.',
    responsibilities: [
      'Early warning system for project risks',
      'Pattern-based anomaly detection',
      'Risk heat mapping and prioritization',
      'Mitigation recommendation engine'
    ]
  },
  {
    id: 'stakeholder-engagement',
    name: 'Stakeholder Engagement Agent',
    category: 'Communication',
    icon: Users,
    color: 'bg-green-500',
    description: 'Manages stakeholder communications, sentiment analysis, and automated reporting across all transformation initiatives.',
    responsibilities: [
      'Automated status report generation',
      'Stakeholder sentiment tracking',
      'Communication cadence management',
      'Executive briefing preparation'
    ]
  },
  {
    id: 'compliance-guardian',
    name: 'Compliance Guardian',
    category: 'Governance',
    icon: CheckCircle2,
    color: 'bg-amber-500',
    description: 'Ensures regulatory compliance and governance standards are maintained across all transformation activities.',
    responsibilities: [
      'Regulatory requirement tracking',
      'Audit trail maintenance',
      'Policy compliance verification',
      'Governance checkpoint automation'
    ]
  },
  {
    id: 'insight-engine',
    name: 'Insight Engine',
    category: 'Analytics',
    icon: Lightbulb,
    color: 'bg-teal-500',
    description: 'Generates actionable insights from cross-portfolio data, identifying patterns, opportunities, and optimization recommendations.',
    responsibilities: [
      'Cross-portfolio pattern analysis',
      'Predictive trend identification',
      'Opportunity discovery and ranking',
      'Performance benchmark comparisons'
    ]
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
  },
  {
    id: 'early-warning',
    name: 'Early Warning Dashboard',
    location: 'Early Warning Tab',
    description: 'AI-powered detection of project health issues using multi-signal analysis.',
    value: 'Catches 85% of delivery issues 3+ weeks before traditional methods',
    icon: AlertTriangle
  },
  {
    id: 'metadata-extraction',
    name: 'Smart Document Analysis',
    location: 'PDF Upload',
    description: 'Automatically extracts policy name, provider, and document ID from uploaded PDFs.',
    value: 'Eliminates manual data entry and reduces errors',
    icon: Zap
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
            A state-of-the-art, fully autonomous enterprise framework supporting VRO, PMO, and TMO 
            functions with real-time stakeholder engagement and predictive insights. Our agentic 
            architecture enables AI agents to communicate, monitor, and inform each other continuously.
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-gray-400" />
              <span className="font-semibold text-gray-900">6</span>
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

          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-documentation">
              <FileText size={16} />
              Full Documentation (50+ Pages)
            </Button>
            <Button variant="outline" className="gap-2" data-testid="button-explore-agents">
              <ArrowLeft size={16} className="rotate-180" />
              Explore Live Agents
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 p-1 mb-8">
            <TabsTrigger value="architecture" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-architecture">
              Architecture
            </TabsTrigger>
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
            <TabsTrigger value="ai-in-app" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" data-testid="tab-ai-in-app">
              <Sparkles size={14} className="mr-1" />
              AI in This App
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="agent-lineage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-700 flex items-center gap-1">
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                The VRO Framework is a guide that VRO teams can reference for ideas and innovative approaches.
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

          <TabsContent value="roadmap">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-4">Phased Implementation Roadmap</h2>
              <div className="space-y-6">
                {[
                  { phase: 'Phase 1', title: 'Foundation', items: ['Core agent deployment', 'Basic MCP implementation', 'Dashboard integration'] },
                  { phase: 'Phase 2', title: 'Intelligence', items: ['Predictive analytics', 'Cross-agent learning', 'Advanced risk models'] },
                  { phase: 'Phase 3', title: 'Autonomy', items: ['Self-healing workflows', 'Autonomous decision execution', 'Full A2A orchestration'] },
                  { phase: 'Phase 4', title: 'Scale', items: ['Multi-portfolio support', 'Enterprise-wide rollout', 'Partner ecosystem'] }
                ].map((phase, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-[#005EB8]">
                        {i + 1}
                      </div>
                      {i < 3 && <div className="w-0.5 h-16 bg-gray-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">{phase.phase}</span>
                        <h3 className="text-lg font-semibold">{phase.title}</h3>
                      </div>
                      <ul className="space-y-1">
                        {phase.items.map((item, j) => (
                          <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-[#005EB8]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
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
                  transformation management. Each feature below shows where it's used and the business value it provides.
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
                            </div>
                            <Badge variant="outline" className="mb-2 text-xs">
                              {feature.location}
                            </Badge>
                            <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                              <p className="text-xs text-green-800 flex items-start gap-1">
                                <TrendingUp size={12} className="mt-0.5 flex-shrink-0" />
                                <span><strong>Value:</strong> {feature.value}</span>
                              </p>
                            </div>
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
