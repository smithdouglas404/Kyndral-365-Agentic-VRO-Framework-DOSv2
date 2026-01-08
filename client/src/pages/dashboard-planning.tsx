import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle2, Flag,
  ChevronRight, ChevronDown, BarChart3, Target, Bot,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { divisions } from '@/lib/lgData';
import { useSimulation } from '@/contexts/SimulationContext';
import { 
  getMilestonesFromProjects,
  getDeadlinesFromProjects,
  getCompanyMetrics,
  type DataMode,
  type TransformedMilestone,
  type TransformedDeadline
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

function MilestoneCard({ milestone, mode }: { milestone: TransformedMilestone, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'upcoming': return 'bg-purple-500';
      case 'at-risk': return 'bg-red-500';
      case 'planned': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const budgetVariance = milestone.budget.actual > 0 
    ? ((milestone.budget.actual - milestone.budget.planned) / milestone.budget.planned) * 100 
    : 0;

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`milestone-${milestone.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <div className={`w-3 h-3 rounded-full ${getStatusColor(milestone.status)}`} />
            <span className="font-semibold">{milestone.name}</span>
          </div>
          <Badge variant={
            milestone.status === 'complete' ? 'default' :
            milestone.status === 'in-progress' ? 'secondary' :
            milestone.status === 'at-risk' ? 'destructive' : 'outline'
          }>
            {milestone.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 ml-7 mb-2">
          <span>{milestone.startDate} → {milestone.endDate}</span>
          <span className="font-bold text-indigo-600">{milestone.progress}%</span>
        </div>
        <Progress value={milestone.progress} className="h-2 ml-7" />
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
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">Deliverables</h4>
                <div className="flex flex-wrap gap-2">
                  {milestone.deliverables.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Planned Budget</p>
                  <p className="font-bold text-blue-600">£{milestone.budget.planned}M</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Actual Spend</p>
                  <p className={`font-bold ${budgetVariance > 10 ? 'text-red-600' : budgetVariance < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    £{milestone.budget.actual.toFixed(1)}M
                    {milestone.budget.actual > 0 && (
                      <span className="text-xs ml-1">
                        ({budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(0)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Division</p>
                  <p className="font-bold text-gray-700">{milestone.division}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI Insight' : 'Status Update'}
                </h4>
                <p className="text-sm text-gray-700">{milestone.aiInsight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeadlineCard({ deadline, mode }: { deadline: TransformedDeadline, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`deadline-${deadline.task.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-medium text-sm">{deadline.task}</span>
          </div>
          <Badge variant={
            deadline.status === 'complete' ? 'default' :
            deadline.status === 'on-track' ? 'secondary' :
            deadline.status === 'at-risk' ? 'destructive' : 'outline'
          } className="text-[10px]">
            {deadline.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 ml-6 mt-1">
          <span>{deadline.date}</span>
          <span>{deadline.owner}</span>
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
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white p-2 rounded border">
                  <p className="text-xs text-gray-500">Division</p>
                  <p className="font-medium text-sm">{deadline.division}</p>
                </div>
                <div className="bg-white p-2 rounded border">
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="font-medium text-sm">{deadline.owner}</p>
                </div>
              </div>
              <div className={`p-2 rounded border ${mode === 'VRO' ? 'bg-blue-50 border-blue-100' : 'bg-gray-100'}`}>
                <p className="text-xs text-gray-500">AI Prediction</p>
                <p className="font-medium text-sm">{deadline.aiPrediction}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlanningDashboard() {
  const { dataMode, setDataMode } = useSimulation();
  
  const milestones = getMilestonesFromProjects(dataMode);
  const deadlines = getDeadlinesFromProjects(dataMode);
  
  const completedPhases = milestones.filter(m => m.status === 'complete').length;
  const currentPhase = milestones.find(m => m.status === 'in-progress');
  const overallProgress = Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length);
  const totalBudget = milestones.reduce((sum, m) => sum + m.budget.planned, 0);
  const totalSpent = milestones.reduce((sum, m) => sum + m.budget.actual, 0);
  
  const onTrackDeadlines = deadlines.filter(d => d.status === 'on-track' || d.status === 'complete').length;
  const atRiskDeadlines = deadlines.filter(d => d.status === 'at-risk').length;

  const allProjects = divisions.flatMap(d => d.potentialProjects);
  const inProgressProjects = allProjects.filter(p => p.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Planning Agent</h1>
                <p className="text-muted-foreground">Roadmap, Milestones & Timeline Management</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
              <Badge variant="outline" className="ml-2">{dataMode} Mode</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Current Phase</p>
                    <p className="text-2xl font-bold text-indigo-600">{completedPhases + 1}/{milestones.length}</p>
                  </div>
                  <Flag className="h-8 w-8 text-indigo-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{currentPhase?.name.replace('Phase ', '').split(':')[1]?.trim() || 'Development'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-bold text-green-600">{overallProgress}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
                <Progress value={overallProgress} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Budget Status</p>
                    <p className="text-2xl font-bold text-blue-600">£{totalSpent.toFixed(1)}M</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">of £{totalBudget}M planned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Deadlines On Track</p>
                    <p className="text-2xl font-bold text-green-600">{onTrackDeadlines}/{deadlines.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
                {atRiskDeadlines > 0 && (
                  <p className="text-xs text-red-600 mt-2">{atRiskDeadlines} at risk</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active Projects</p>
                    <p className="text-2xl font-bold text-purple-600">{inProgressProjects}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">across divisions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Program Roadmap</span>
                  <Badge variant="outline" className="text-xs">From Division Projects</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((milestone, i) => (
                    <MilestoneCard key={i} milestone={milestone} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Upcoming Deadlines</span>
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadlines.map((deadline, i) => (
                    <DeadlineCard key={i} deadline={deadline} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Division Projects Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {divisions.map((division) => (
                  <Link key={division.id} href={`/division/${division.id}`}>
                    <div 
                      className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                      style={{ borderLeftColor: division.color, borderLeftWidth: '4px' }}
                    >
                      <p className="text-sm font-medium text-gray-500">{division.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl font-bold" style={{ color: division.color }}>
                          {division.potentialProjects.length}
                        </span>
                        <span className="text-sm text-gray-500">projects</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {division.potentialProjects.filter(p => p.status === 'in-progress').length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {division.potentialProjects.filter(p => p.status === 'in-progress').length} active
                          </Badge>
                        )}
                        {division.potentialProjects.filter(p => p.priority === 'high').length > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {division.potentialProjects.filter(p => p.priority === 'high').length} high priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
