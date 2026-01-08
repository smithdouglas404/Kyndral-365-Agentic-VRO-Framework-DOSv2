import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, Users, TrendingUp, Target, CheckCircle2, 
  AlertTriangle, ChevronDown, ChevronRight, Bot,
  Building2, Calendar, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { divisions } from '@/lib/lgData';
import { useSimulation } from '@/contexts/SimulationContext';
import { 
  getAdoptionMetricsFromDivisions,
  getInitiativesFromDivisions,
  getCompanyMetrics,
  type DataMode,
  type TransformedAdoptionMetric,
  type TransformedInitiative
} from '@/lib/agentDataTransformers';

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

function AdoptionMetricCard({ metric, mode }: { metric: TransformedAdoptionMetric, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);
  const progressPercent = (metric.adoption / metric.target) * 100;

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`adoption-${metric.division.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
            <span className="font-medium text-sm">{metric.division}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-teal-600">{metric.adoption}%</span>
            <span className="text-xs text-gray-400">/ {metric.target}%</span>
          </div>
        </div>
        <Progress value={progressPercent > 100 ? 100 : progressPercent} className="h-1.5" />
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>{metric.users.toLocaleString()} users</span>
          <span className={metric.trend.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-600'}>{metric.trend}</span>
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
            <div className="p-3 bg-gray-50">
              <div className={`p-2 rounded border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{mode === 'VRO' ? 'AI Insight' : 'Status'}</span>
                </div>
                <p className="text-xs text-gray-700">{metric.aiInsight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InitiativeCard({ initiative, mode }: { initiative: TransformedInitiative, mode: DataMode }) {
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
  const { dataMode, setDataMode, viewMode, setViewMode } = useSimulation();
  
  const adoptionMetrics = getAdoptionMetricsFromDivisions(dataMode);
  const initiatives = getInitiativesFromDivisions(dataMode);
  const companyMetrics = getCompanyMetrics();
  
  const avgAdoption = Math.round(adoptionMetrics.reduce((sum, m) => sum + m.adoption, 0) / adoptionMetrics.length);
  const totalUsers = adoptionMetrics.reduce((sum, m) => sum + m.users, 0);
  const completeInitiatives = initiatives.filter(i => i.status === 'complete').length;
  const atRiskInitiatives = initiatives.filter(i => i.status === 'at-risk').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <Repeat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">AI Operations Hub</h1>
                  <p className="text-muted-foreground">Change Management & Adoption Intelligence</p>
                </div>
                <Badge className="ml-4 bg-green-100 text-green-700 gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
                <Badge variant="outline" className="ml-2">{dataMode} Mode</Badge>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('realtime')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'realtime' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
                  data-testid="btn-realtime"
                >
                  Real-time
                </button>
                <button
                  onClick={() => setViewMode('snapshot')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'snapshot' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  data-testid="btn-snapshot"
                >
                  30-Day Snapshot
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Adoption</p>
                    <p className="text-2xl font-bold text-teal-600">{avgAdoption}%</p>
                  </div>
                  <Users className="h-8 w-8 text-teal-200" />
                </div>
                <Progress value={avgAdoption} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Impacted Users</p>
                    <p className="text-2xl font-bold text-blue-600">{totalUsers.toLocaleString()}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">across {divisions.length} divisions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active Initiatives</p>
                    <p className="text-2xl font-bold text-purple-600">{initiatives.length}</p>
                  </div>
                  <Repeat className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{completeInitiatives} complete</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">At Risk</p>
                    <p className={`text-2xl font-bold ${atRiskInitiatives > 0 ? 'text-red-600' : 'text-green-600'}`}>{atRiskInitiatives}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{atRiskInitiatives > 0 ? 'Needs attention' : 'All healthy'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">L&G Employees</p>
                    <p className="text-2xl font-bold text-green-600">{companyMetrics.totalEmployees.toLocaleString()}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">total workforce</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Division Adoption Rates</span>
                  <Badge variant="outline" className="text-xs">From L&G Divisions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {adoptionMetrics.map((metric, i) => (
                    <AdoptionMetricCard key={i} metric={metric} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Active Change Initiatives</span>
                  <Badge variant="outline" className="text-xs">From Division Projects</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {initiatives.map((initiative) => (
                    <InitiativeCard key={initiative.id} initiative={initiative} mode={dataMode} />
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
