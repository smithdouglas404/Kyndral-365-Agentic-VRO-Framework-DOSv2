import { useState } from 'react';
import { Link } from 'wouter';
import { 
  Repeat, Users, TrendingUp, Target, CheckCircle2, 
  AlertTriangle, ArrowRight, BarChart3, Clock, Sparkles,
  ChevronRight, DollarSign, Building2, Bot,
  MessageSquare, Zap, Shield, Calendar, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function InitiativeRow({ initiative, onClick }: { initiative: Initiative; onClick: () => void }) {
  return (
    <div 
      className="p-3 border rounded-lg bg-white hover:shadow-md hover:border-teal-200 transition-all cursor-pointer"
      onClick={onClick}
      data-testid={`initiative-row-${initiative.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-medium text-sm truncate">{initiative.name}</span>
          <Badge variant={
            initiative.status === 'complete' ? 'default' :
            initiative.status === 'at-risk' ? 'destructive' : 'secondary'
          } className="text-[10px] shrink-0">
            {initiative.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {initiative.okrMappings.length}
            </span>
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              {initiative.collaboratingAgents.length}
            </span>
          </div>
          <div className="w-16">
            <Progress value={initiative.progress} className="h-1.5" />
          </div>
          <span className="text-xs font-medium text-teal-600 w-8">{initiative.progress}%</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function InitiativeDrawer({ initiative, open, onClose }: { initiative: Initiative | null; open: boolean; onClose: () => void }) {
  if (!initiative) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden p-0" data-testid="initiative-drawer">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  initiative.status === 'complete' ? 'default' :
                  initiative.status === 'at-risk' ? 'destructive' : 'secondary'
                }>
                  {initiative.status}
                </Badge>
                <span className="text-xs text-gray-500">Phase: {initiative.phase}</span>
              </div>
              <SheetTitle className="text-xl">{initiative.name}</SheetTitle>
              <SheetDescription>{initiative.description}</SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-500 mb-1">Cost Savings</p>
                  <p className="text-lg font-bold text-green-600">£{initiative.valueImpact.costSavings}M</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                  <p className="text-lg font-bold text-blue-600">£{initiative.valueImpact.revenueImpact}M</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p className="text-xs text-gray-500 mb-1">Efficiency</p>
                  <p className="text-lg font-bold text-purple-600">{initiative.valueImpact.efficiencyGain}%</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  OKR Mappings
                </h4>
                <div className="space-y-3">
                  {initiative.okrMappings.map((okr, i) => (
                    <div key={i} className="p-3 bg-white rounded border">
                      <p className="font-medium text-sm text-orange-700 mb-2">{okr.objectiveName}</p>
                      <div className="space-y-1">
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

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-500" />
                  Collaborating Agents
                </h4>
                <div className="space-y-2">
                  {initiative.collaboratingAgents.map((agent, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="font-medium text-sm">{agent.agentName}</p>
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

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Milestones
                </h4>
                <div className="space-y-2">
                  {initiative.milestones.map((milestone, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        milestone.status === 'complete' ? 'bg-green-500' :
                        milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm flex-1">{milestone.name}</span>
                      <span className="text-xs text-gray-500">{milestone.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  Risks & Mitigations
                </h4>
                <div className="space-y-2">
                  {initiative.risks.map((risk, i) => (
                    <div key={i} className="p-2 bg-white rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{risk.description}</span>
                        <Badge variant={
                          risk.severity === 'high' ? 'destructive' :
                          risk.severity === 'medium' ? 'secondary' : 'outline'
                        } className="text-[10px] shrink-0">
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">Mitigation: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span><strong>Division:</strong> {initiative.division}</span>
                  <span><strong>Owner:</strong> {initiative.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span>Started: {initiative.startDate}</span>
                  <span>Target: {initiative.targetDate}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function TMODashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

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
                  <Badge variant="outline" className="text-xs font-normal">Click for details</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {changeInitiatives.map((initiative) => (
                    <InitiativeRow 
                      key={initiative.id} 
                      initiative={initiative} 
                      onClick={() => setSelectedInitiative(initiative)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <CrossAgentCollaboration />
        </main>
      </div>

      <InitiativeDrawer 
        initiative={selectedInitiative} 
        open={!!selectedInitiative} 
        onClose={() => setSelectedInitiative(null)} 
      />
    </div>
  );
}
