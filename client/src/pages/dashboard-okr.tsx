import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, CheckCircle2, Clock, TrendingUp, AlertTriangle,
  ChevronRight, ChevronDown, BarChart3, Bot, DollarSign,
  Building2, Repeat, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

interface LinkedInitiative {
  id: string;
  name: string;
  division: string;
  contribution: number;
  status: 'on-track' | 'at-risk' | 'complete';
  valueImpact: string;
  phase: string;
}

interface KeyResult {
  title: string;
  progress: number;
  target: string;
  current: string;
  linkedInitiatives: LinkedInitiative[];
}

interface Objective {
  id: string;
  title: string;
  owner: string;
  division: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'ahead';
  keyResults: KeyResult[];
  collaboratingAgents: {
    agentId: string;
    agentName: string;
    contribution: string;
    lastSync: string;
  }[];
  totalValueImpact: {
    costSavings: number;
    revenueImpact: number;
  };
}

const objectives: Objective[] = [
  {
    id: 'okr-prt-001',
    title: 'Accelerate PRT Market Leadership',
    owner: 'Andrew Kail',
    division: 'Institutional Retirement',
    progress: 82,
    status: 'on-track',
    totalValueImpact: {
      costSavings: 45,
      revenueImpact: 280
    },
    keyResults: [
      { 
        title: 'Achieve £10bn PRT volume', 
        progress: 82, 
        target: '£10bn', 
        current: '£8.2bn',
        linkedInitiatives: [
          { id: 'init-003', name: 'Data Analytics Transformation', division: 'Group Data', contribution: 8, status: 'complete', valueImpact: 'Enhanced deal analytics', phase: 'Complete' },
          { id: 'init-004', name: 'AI-Powered Deal Intake', division: 'Institutional Retirement', contribution: 15, status: 'on-track', valueImpact: '£85M annual efficiency', phase: 'Development' }
        ]
      },
      { 
        title: 'Increase market share to 25%', 
        progress: 88, 
        target: '25%', 
        current: '22%',
        linkedInitiatives: [
          { id: 'init-005', name: 'Competitive Intelligence Platform', division: 'Strategy', contribution: 12, status: 'on-track', valueImpact: 'Market insight edge', phase: 'Pilot' }
        ]
      },
      { 
        title: 'Launch 3 new DB solutions', 
        progress: 67, 
        target: '3', 
        current: '2',
        linkedInitiatives: [
          { id: 'init-006', name: 'DB Product Innovation', division: 'Institutional Retirement', contribution: 25, status: 'on-track', valueImpact: '£120M new revenue', phase: 'Development' }
        ]
      }
    ],
    collaboratingAgents: [
      { agentId: 'vro', agentName: 'VRO Agent', contribution: 'Value tracking & ROI measurement', lastSync: '2 min ago' },
      { agentId: 'finops', agentName: 'FinOps Agent', contribution: 'Deal economics analysis', lastSync: '5 min ago' },
      { agentId: 'planning', agentName: 'Planning Agent', contribution: 'Pipeline management', lastSync: '12 min ago' }
    ]
  },
  {
    id: 'okr-digital-001',
    title: 'Digital Transformation Excellence',
    owner: 'Group CTO',
    division: 'Group Technology',
    progress: 68,
    status: 'at-risk',
    totalValueImpact: {
      costSavings: 73,
      revenueImpact: 185
    },
    keyResults: [
      { 
        title: 'Complete platform modernization', 
        progress: 65, 
        target: '100%', 
        current: '65%',
        linkedInitiatives: [
          { id: 'init-001', name: 'Digital Platform Rollout', division: 'Group Technology', contribution: 40, status: 'on-track', valueImpact: '£120M revenue enablement', phase: 'Adoption' }
        ]
      },
      { 
        title: 'Achieve 85% digital adoption', 
        progress: 72, 
        target: '85%', 
        current: '61%',
        linkedInitiatives: [
          { id: 'init-001', name: 'Digital Platform Rollout', division: 'Group Technology', contribution: 25, status: 'on-track', valueImpact: '+25% adoption', phase: 'Adoption' },
          { id: 'init-002', name: 'Customer Portal Enhancement', division: 'Retail', contribution: 18, status: 'at-risk', valueImpact: '+18% digital adoption', phase: 'Training' }
        ]
      },
      { 
        title: 'Reduce manual processes by 40%', 
        progress: 68, 
        target: '40%', 
        current: '27%',
        linkedInitiatives: [
          { id: 'init-001', name: 'Digital Platform Rollout', division: 'Group Technology', contribution: 15, status: 'on-track', valueImpact: 'Process automation', phase: 'Adoption' },
          { id: 'init-007', name: 'RPA Implementation', division: 'Operations', contribution: 22, status: 'on-track', valueImpact: '£28M cost savings', phase: 'Scaling' }
        ]
      }
    ],
    collaboratingAgents: [
      { agentId: 'tmo', agentName: 'TMO Agent', contribution: 'Change management & adoption', lastSync: '3 min ago' },
      { agentId: 'ocm', agentName: 'OCM Agent', contribution: 'Training & readiness', lastSync: '8 min ago' },
      { agentId: 'governance', agentName: 'Governance Agent', contribution: 'Compliance oversight', lastSync: '15 min ago' }
    ]
  },
  {
    id: 'okr-efficiency-001',
    title: 'Operational Efficiency',
    owner: 'Group COO',
    division: 'Group Operations',
    progress: 91,
    status: 'ahead',
    totalValueImpact: {
      costSavings: 184,
      revenueImpact: 45
    },
    keyResults: [
      { 
        title: 'Deliver £200M cost savings', 
        progress: 92, 
        target: '£200M', 
        current: '£184M',
        linkedInitiatives: [
          { id: 'init-001', name: 'Digital Platform Rollout', division: 'Group Technology', contribution: 22, status: 'on-track', valueImpact: '£45M cost savings', phase: 'Adoption' },
          { id: 'init-003', name: 'Data Analytics Transformation', division: 'Group Data', contribution: 16, status: 'complete', valueImpact: '£32M cost savings', phase: 'Complete' },
          { id: 'init-008', name: 'Vendor Consolidation', division: 'Procurement', contribution: 35, status: 'on-track', valueImpact: '£70M savings', phase: 'Execution' }
        ]
      },
      { 
        title: 'Improve forecast accuracy to 85%', 
        progress: 89, 
        target: '85%', 
        current: '76%',
        linkedInitiatives: [
          { id: 'init-003', name: 'Data Analytics Transformation', division: 'Group Data', contribution: 45, status: 'complete', valueImpact: '+45% forecast accuracy', phase: 'Complete' }
        ]
      },
      { 
        title: 'Reduce cycle time by 30%', 
        progress: 91, 
        target: '30%', 
        current: '27%',
        linkedInitiatives: [
          { id: 'init-001', name: 'Digital Platform Rollout', division: 'Group Technology', contribution: 18, status: 'on-track', valueImpact: '-18% cycle time', phase: 'Adoption' },
          { id: 'init-003', name: 'Data Analytics Transformation', division: 'Group Data', contribution: 12, status: 'complete', valueImpact: 'Real-time insights', phase: 'Complete' }
        ]
      }
    ],
    collaboratingAgents: [
      { agentId: 'vro', agentName: 'VRO Agent', contribution: 'Value realization tracking', lastSync: '1 min ago' },
      { agentId: 'finops', agentName: 'FinOps Agent', contribution: 'Cost optimization', lastSync: '4 min ago' },
      { agentId: 'pmo', agentName: 'PMO Agent', contribution: 'Delivery tracking', lastSync: '7 min ago' }
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

function ObjectiveCard({ objective }: { objective: Objective }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid={`objective-card-${objective.id}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid={`objective-toggle-${objective.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              objective.status === 'ahead' ? 'bg-green-500' :
              objective.status === 'on-track' ? 'bg-blue-500' : 'bg-amber-500'
            }`}>
              {objective.progress}%
            </div>
            <div>
              <h3 className="font-semibold text-base">{objective.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {objective.division}
                </span>
                <span>{objective.owner}</span>
                <span className="flex items-center gap-1 text-green-600">
                  <DollarSign className="h-3 w-3" />
                  £{objective.totalValueImpact.costSavings + objective.totalValueImpact.revenueImpact}M value
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={
              objective.status === 'ahead' ? 'default' :
              objective.status === 'on-track' ? 'secondary' : 'destructive'
            }>
              {objective.status}
            </Badge>
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Cost Savings</p>
                    <p className="font-bold text-green-600">£{objective.totalValueImpact.costSavings}M</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Revenue Impact</p>
                    <p className="font-bold text-blue-600">£{objective.totalValueImpact.revenueImpact}M</p>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-sm mb-3">Key Results & Linked Initiatives</h4>
              <div className="space-y-4">
                {objective.keyResults.map((kr, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{kr.title}</span>
                      <span className="text-sm font-bold text-orange-600">{kr.progress}%</span>
                    </div>
                    <Progress value={kr.progress} className="h-1.5 mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Current: {kr.current}</span>
                      <span>Target: {kr.target}</span>
                    </div>
                    
                    {kr.linkedInitiatives.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          Contributing Initiatives
                        </p>
                        <div className="space-y-2">
                          {kr.linkedInitiatives.map((init, j) => (
                            <div key={j} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-100">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-orange-800">{init.name}</span>
                                  <Badge variant={
                                    init.status === 'complete' ? 'default' :
                                    init.status === 'at-risk' ? 'destructive' : 'secondary'
                                  } className="text-[10px]">
                                    {init.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  <span>{init.division}</span>
                                  <span>Phase: {init.phase}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-orange-600">+{init.contribution}%</span>
                                <p className="text-[10px] text-green-600">{init.valueImpact}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-500" />
                  Collaborating Agents
                </h4>
                <div className="flex flex-wrap gap-2">
                  {objective.collaboratingAgents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="font-medium text-sm text-purple-800">{agent.agentName}</span>
                      <span className="text-xs text-gray-500">{agent.lastSync}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function OKRDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");

  const avgProgress = Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length);
  const totalValue = objectives.reduce((sum, o) => sum + o.totalValueImpact.costSavings + o.totalValueImpact.revenueImpact, 0);
  const totalInitiatives = objectives.reduce((sum, o) => 
    sum + o.keyResults.reduce((s, kr) => s + kr.linkedInitiatives.length, 0), 0);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">OKR Mapping Agent</h1>
                <p className="text-muted-foreground">Objectives, Key Results & Initiative Alignment</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{avgProgress}%</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-200" />
                </div>
                <Progress value={avgProgress} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">£{totalValue}M</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">across all OKRs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">On Track</p>
                    <p className="text-2xl font-bold text-blue-600">2</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">objectives</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">At Risk</p>
                    <p className="text-2xl font-bold text-amber-600">1</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">needs attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Linked Initiatives</p>
                    <p className="text-2xl font-bold text-purple-600">{totalInitiatives}</p>
                  </div>
                  <Repeat className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">contributing</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Strategic Objectives</h2>
              <Badge variant="outline" className="text-xs">Click to expand for initiative details</Badge>
            </div>
            {objectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} />
            ))}
          </div>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
