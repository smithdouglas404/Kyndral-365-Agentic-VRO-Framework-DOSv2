import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, Users, TrendingUp, Target, CheckCircle2, 
  AlertTriangle, ArrowRight, BarChart3, Clock, Sparkles,
  ChevronDown, ChevronRight, DollarSign, Building2, Bot,
  MessageSquare, Zap, Shield, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

const adoptionMetrics = [
  { division: 'Institutional Retirement', adoption: 78, target: 85, users: 1240 },
  { division: 'Retail', adoption: 65, target: 80, users: 890 },
  { division: 'Capital', adoption: 82, target: 90, users: 456 },
  { division: 'Asset Management (LGIM)', adoption: 71, target: 85, users: 2100 },
  { division: 'Affordable Homes', adoption: 88, target: 90, users: 234 }
];

interface Initiative {
  id: string;
  name: string;
  description: string;
  phase: string;
  progress: number;
  impactedUsers: number;
  status: 'on-track' | 'at-risk' | 'complete';
  division: string;
  owner: string;
  startDate: string;
  targetDate: string;
  valueImpact: {
    costSavings: number;
    revenueImpact: number;
    efficiencyGain: number;
  };
  okrMappings: {
    objectiveId: string;
    objectiveName: string;
    keyResults: { name: string; contribution: number }[];
    valueImpact: string;
  }[];
  collaboratingAgents: {
    agentId: string;
    agentName: string;
    role: string;
    lastSync: string;
    status: 'active' | 'pending' | 'complete';
  }[];
  milestones: {
    name: string;
    date: string;
    status: 'complete' | 'in-progress' | 'pending';
  }[];
  risks: { description: string; severity: 'low' | 'medium' | 'high'; mitigation: string }[];
}

const changeInitiatives: Initiative[] = [
  { 
    id: 'init-001',
    name: 'Digital Platform Rollout', 
    description: 'Enterprise-wide deployment of the new digital platform across all L&G divisions, enabling streamlined operations and enhanced customer experience.',
    phase: 'Adoption',
    progress: 68,
    impactedUsers: 4500,
    status: 'on-track',
    division: 'Group Technology',
    owner: 'Sarah Mitchell',
    startDate: 'Oct 2024',
    targetDate: 'Jun 2025',
    valueImpact: {
      costSavings: 45,
      revenueImpact: 120,
      efficiencyGain: 35
    },
    okrMappings: [
      {
        objectiveId: 'okr-digital-001',
        objectiveName: 'Digital Transformation Excellence',
        keyResults: [
          { name: 'Complete platform modernization', contribution: 40 },
          { name: 'Achieve 85% digital adoption', contribution: 25 },
          { name: 'Reduce manual processes by 40%', contribution: 15 }
        ],
        valueImpact: '+£120M revenue enablement'
      },
      {
        objectiveId: 'okr-efficiency-001',
        objectiveName: 'Operational Efficiency',
        keyResults: [
          { name: 'Deliver £200M cost savings', contribution: 22 },
          { name: 'Reduce cycle time by 30%', contribution: 18 }
        ],
        valueImpact: '+£45M cost savings'
      }
    ],
    collaboratingAgents: [
      { agentId: 'vro', agentName: 'VRO Agent', role: 'Value tracking & ROI measurement', lastSync: '2 min ago', status: 'active' },
      { agentId: 'pmo', agentName: 'PMO Agent', role: 'Project delivery oversight', lastSync: '5 min ago', status: 'active' },
      { agentId: 'ocm', agentName: 'OCM Agent', role: 'Change readiness & adoption', lastSync: '15 min ago', status: 'active' },
      { agentId: 'finops', agentName: 'FinOps Agent', role: 'Budget monitoring', lastSync: '1 hour ago', status: 'pending' }
    ],
    milestones: [
      { name: 'Platform Selection', date: 'Nov 2024', status: 'complete' },
      { name: 'Core Development', date: 'Feb 2025', status: 'complete' },
      { name: 'User Training', date: 'Apr 2025', status: 'in-progress' },
      { name: 'Full Deployment', date: 'Jun 2025', status: 'pending' }
    ],
    risks: [
      { description: 'Integration complexity with legacy systems', severity: 'medium', mitigation: 'Phased rollout with fallback protocols' },
      { description: 'User adoption resistance', severity: 'low', mitigation: 'Comprehensive change management program' }
    ]
  },
  { 
    id: 'init-002',
    name: 'Customer Portal Enhancement', 
    description: 'Major upgrade to customer-facing portals improving self-service capabilities, reducing call center volume, and enhancing customer satisfaction scores.',
    phase: 'Training',
    progress: 45,
    impactedUsers: 2800,
    status: 'at-risk',
    division: 'Retail',
    owner: 'James Thompson',
    startDate: 'Jan 2025',
    targetDate: 'Aug 2025',
    valueImpact: {
      costSavings: 28,
      revenueImpact: 65,
      efficiencyGain: 42
    },
    okrMappings: [
      {
        objectiveId: 'okr-cx-001',
        objectiveName: 'Customer Experience Excellence',
        keyResults: [
          { name: 'Improve NPS by 15 points', contribution: 35 },
          { name: 'Reduce call center volume by 25%', contribution: 28 },
          { name: 'Achieve 90% self-service completion', contribution: 20 }
        ],
        valueImpact: '+15pts NPS improvement'
      },
      {
        objectiveId: 'okr-digital-001',
        objectiveName: 'Digital Transformation Excellence',
        keyResults: [
          { name: 'Achieve 85% digital adoption', contribution: 18 }
        ],
        valueImpact: '+18% digital adoption'
      }
    ],
    collaboratingAgents: [
      { agentId: 'vro', agentName: 'VRO Agent', role: 'Customer value measurement', lastSync: '8 min ago', status: 'active' },
      { agentId: 'tmo', agentName: 'TMO Agent', role: 'Training coordination', lastSync: '3 min ago', status: 'active' },
      { agentId: 'governance', agentName: 'Governance Agent', role: 'Compliance review', lastSync: '2 hours ago', status: 'pending' }
    ],
    milestones: [
      { name: 'Requirements Gathering', date: 'Feb 2025', status: 'complete' },
      { name: 'UX Design Complete', date: 'Mar 2025', status: 'complete' },
      { name: 'Development Sprint', date: 'May 2025', status: 'in-progress' },
      { name: 'UAT Testing', date: 'Jul 2025', status: 'pending' },
      { name: 'Production Launch', date: 'Aug 2025', status: 'pending' }
    ],
    risks: [
      { description: 'Resource constraints due to competing priorities', severity: 'high', mitigation: 'Escalated to steering committee for resolution' },
      { description: 'Scope creep from stakeholder requests', severity: 'medium', mitigation: 'Strict change control process implemented' }
    ]
  },
  { 
    id: 'init-003',
    name: 'Data Analytics Transformation', 
    description: 'Implementation of advanced analytics platform enabling real-time insights, predictive modeling, and AI-driven decision support across the enterprise.',
    phase: 'Pilot',
    progress: 92,
    impactedUsers: 890,
    status: 'complete',
    division: 'Group Data',
    owner: 'Dr. Priya Sharma',
    startDate: 'Jun 2024',
    targetDate: 'Jan 2025',
    valueImpact: {
      costSavings: 32,
      revenueImpact: 85,
      efficiencyGain: 48
    },
    okrMappings: [
      {
        objectiveId: 'okr-efficiency-001',
        objectiveName: 'Operational Efficiency',
        keyResults: [
          { name: 'Improve forecast accuracy to 85%', contribution: 45 },
          { name: 'Reduce cycle time by 30%', contribution: 12 }
        ],
        valueImpact: '+45% forecast accuracy'
      },
      {
        objectiveId: 'okr-prt-001',
        objectiveName: 'Accelerate PRT Market Leadership',
        keyResults: [
          { name: 'Increase market share to 25%', contribution: 8 }
        ],
        valueImpact: 'Enhanced deal analytics'
      }
    ],
    collaboratingAgents: [
      { agentId: 'vro', agentName: 'VRO Agent', role: 'Analytics value realization', lastSync: '1 min ago', status: 'complete' },
      { agentId: 'finops', agentName: 'FinOps Agent', role: 'Cost optimization insights', lastSync: '5 min ago', status: 'complete' },
      { agentId: 'okr', agentName: 'OKR Agent', role: 'Performance tracking', lastSync: '10 min ago', status: 'complete' }
    ],
    milestones: [
      { name: 'Platform Architecture', date: 'Jul 2024', status: 'complete' },
      { name: 'Data Integration', date: 'Sep 2024', status: 'complete' },
      { name: 'ML Model Deployment', date: 'Nov 2024', status: 'complete' },
      { name: 'User Onboarding', date: 'Jan 2025', status: 'complete' }
    ],
    risks: [
      { description: 'Data quality issues in source systems', severity: 'low', mitigation: 'Automated data validation pipeline implemented' }
    ]
  }
];

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap">Legal & General</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className="border rounded-lg bg-white overflow-hidden transition-all hover:shadow-md"
      data-testid={`initiative-card-${initiative.id}`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`initiative-toggle-${initiative.id}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
            <span className="font-semibold text-base">{initiative.name}</span>
          </div>
          <Badge variant={
            initiative.status === 'complete' ? 'default' :
            initiative.status === 'at-risk' ? 'destructive' : 'secondary'
          }>
            {initiative.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
          <span>Phase: {initiative.phase}</span>
          <span>{initiative.impactedUsers.toLocaleString()} users</span>
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {initiative.okrMappings.length} OKRs linked
          </span>
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            {initiative.collaboratingAgents.length} agents
          </span>
        </div>
        <Progress value={initiative.progress} className="h-1.5 mt-3 ml-8" />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-4">{initiative.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Cost Savings</p>
                  <p className="text-lg font-bold text-green-600">£{initiative.valueImpact.costSavings}M</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Revenue Impact</p>
                  <p className="text-lg font-bold text-blue-600">£{initiative.valueImpact.revenueImpact}M</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Efficiency Gain</p>
                  <p className="text-lg font-bold text-purple-600">{initiative.valueImpact.efficiencyGain}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    OKR Mappings
                  </h4>
                  <div className="space-y-3">
                    {initiative.okrMappings.map((okr, i) => (
                      <div key={i} className="p-2 bg-orange-50 rounded border border-orange-100">
                        <p className="font-medium text-sm text-orange-800">{okr.objectiveName}</p>
                        <div className="mt-2 space-y-1">
                          {okr.keyResults.map((kr, j) => (
                            <div key={j} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{kr.name}</span>
                              <span className="font-bold text-orange-600">+{kr.contribution}%</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-2">{okr.valueImpact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-500" />
                    Collaborating Agents
                  </h4>
                  <div className="space-y-2">
                    {initiative.collaboratingAgents.map((agent, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-100">
                        <div>
                          <p className="font-medium text-sm text-purple-800">{agent.agentName}</p>
                          <p className="text-xs text-gray-500">{agent.role}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            agent.status === 'active' ? 'default' :
                            agent.status === 'complete' ? 'secondary' : 'outline'
                          } className="text-[10px]">
                            {agent.status}
                          </Badge>
                          <p className="text-[10px] text-gray-400 mt-1">{agent.lastSync}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Milestones
                  </h4>
                  <div className="space-y-2">
                    {initiative.milestones.map((milestone, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          milestone.status === 'complete' ? 'bg-green-500' :
                          milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm flex-1">{milestone.name}</span>
                        <span className="text-xs text-gray-500">{milestone.date}</span>
                        <Badge variant={
                          milestone.status === 'complete' ? 'default' :
                          milestone.status === 'in-progress' ? 'secondary' : 'outline'
                        } className="text-[10px]">
                          {milestone.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    Risks & Mitigations
                  </h4>
                  <div className="space-y-2">
                    {initiative.risks.map((risk, i) => (
                      <div key={i} className="p-2 bg-red-50 rounded border border-red-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-red-800">{risk.description}</span>
                          <Badge variant={
                            risk.severity === 'high' ? 'destructive' :
                            risk.severity === 'medium' ? 'secondary' : 'outline'
                          } className="text-[10px]">
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">Mitigation: {risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span><strong>Division:</strong> {initiative.division}</span>
                  <span><strong>Owner:</strong> {initiative.owner}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Started: {initiative.startDate}</span>
                  <span>Target: {initiative.targetDate}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TMODashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-500 rounded-lg">
                <Repeat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transformation Agent</h1>
                <p className="text-muted-foreground">Change Management & Adoption Analytics</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Adoption</p>
                    <p className="text-2xl font-bold text-teal-600">72%</p>
                  </div>
                  <Users className="h-8 w-8 text-teal-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">+8% vs last quarter</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Training Completion</p>
                    <p className="text-2xl font-bold text-blue-600">68%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Target: 85%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active Changes</p>
                    <p className="text-2xl font-bold text-purple-600">12</p>
                  </div>
                  <Repeat className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">3 at risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">User Satisfaction</p>
                    <p className="text-2xl font-bold text-green-600">4.2/5</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Based on 2,340 responses</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Division Adoption Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adoptionMetrics.map((metric, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.division}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-teal-600">{metric.adoption}%</span>
                          <span className="text-xs text-gray-400">/ {metric.target}%</span>
                        </div>
                      </div>
                      <Progress value={metric.adoption} className="h-2" />
                      <p className="text-xs text-gray-500">{metric.users.toLocaleString()} users impacted</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Active Change Initiatives</span>
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {changeInitiatives.map((initiative) => (
                    <InitiativeCard key={initiative.id} initiative={initiative} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
