import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, MessageSquare, TrendingUp,
  Award, ChevronDown, ChevronRight,
  Bot, Building2, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { AlertBubble } from '@/components/AlertBubble';
import { useSimulation } from '@/contexts/SimulationContext';
import { useAgentData } from '@/hooks/useAgentData';
import { 
  getChangeReadinessFromDivisions,
  getStakeholderGroupsFromDivisions,
  getTrainingProgramsFromOKRs,
  getCompanyMetrics,
  type DataMode,
  type TransformedReadinessMetric,
  type TransformedStakeholderGroup,
  type TransformedTrainingProgram
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

function ReadinessMetricCard({ metric, mode }: { metric: TransformedReadinessMetric, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);
  const progressPercent = (metric.score / metric.target) * 100;

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`readiness-${metric.category.toLowerCase()}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold">{metric.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-pink-600">{metric.score}%</span>
            <span className="text-xs text-gray-400">/ {metric.target}%</span>
          </div>
        </div>
        <Progress value={progressPercent > 100 ? 100 : progressPercent} className="h-2" />
        <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
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
              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI-Driven Insight' : 'Current Status'}
                </h4>
                <p className="text-sm text-gray-700">{metric.aiInsight}</p>
              </div>

              {mode === 'VRO' && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-500">Trend</p>
                    <p className="font-bold text-green-600">+{metric.trend}%</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-500">Velocity</p>
                    <p className="font-bold text-blue-600">2.3x</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-500">Prediction</p>
                    <p className="font-bold text-purple-600">On track</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StakeholderCard({ group, mode }: { group: TransformedStakeholderGroup, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-700';
      case 'neutral': return 'bg-gray-100 text-gray-700';
      case 'mixed': return 'bg-amber-100 text-amber-700';
      case 'negative': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`stakeholder-${group.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold">{group.name}</span>
          </div>
          <Badge className={getSentimentColor(group.sentiment)}>{group.sentiment}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{group.count.toLocaleString()} people</span>
          <span className="font-bold text-blue-600">{group.engagement}% engaged</span>
        </div>
        <Progress value={group.engagement} className="h-1.5 mt-2" />
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
              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-blue-50 border-blue-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2">Engagement Actions</h4>
                <p className="text-sm text-gray-700">{group.aiActions}</p>
              </div>

              {mode === 'VRO' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded border">
                    <p className="text-xs text-gray-500">Response Rate</p>
                    <p className="font-bold text-green-600">{Math.round(group.engagement * 1.1)}%</p>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="text-xs text-gray-500">NPS Change</p>
                    <p className="font-bold text-blue-600">+{Math.round(group.engagement / 5)}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrainingCard({ program, mode }: { program: TransformedTrainingProgram, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);
  const completionRate = Math.round((program.completed / program.enrolled) * 100);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`training-${program.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold text-sm">{program.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="font-bold">{program.satisfaction.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{program.completed.toLocaleString()} / {program.enrolled.toLocaleString()} completed</span>
          <span className="font-bold text-green-600">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-1.5 mt-2" />
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
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Format</p>
                  <p className="font-semibold text-sm">{program.format}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold text-sm">{program.duration}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Division</p>
                  <p className="font-semibold text-sm">{program.division}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OCMDashboard() {
  const { dataMode, setDataMode, viewMode, setViewMode } = useSimulation();
  const liveData = useAgentData('ocm');
  
  const readinessMetrics = getChangeReadinessFromDivisions(dataMode);
  const stakeholderGroups = getStakeholderGroupsFromDivisions(dataMode);
  const trainingPrograms = getTrainingProgramsFromOKRs(dataMode);
  const companyMetrics = getCompanyMetrics();
  
  const avgReadiness = Math.round(readinessMetrics.reduce((sum, m) => sum + m.score, 0) / readinessMetrics.length);
  const totalCompleted = trainingPrograms.reduce((sum, p) => sum + p.completed, 0);
  const totalEnrolled = trainingPrograms.reduce((sum, p) => sum + p.enrolled, 0);
  const avgSatisfaction = (trainingPrograms.reduce((sum, p) => sum + p.satisfaction, 0) / trainingPrograms.length).toFixed(1);
  
  const positiveStakeholders = stakeholderGroups.filter(g => g.sentiment === 'positive').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">OCM Intelligence Console</h1>
                  <p className="text-muted-foreground">OCM Intelligence & Adoption Operations</p>
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
            <Card className="relative">
              {liveData.metrics.activeAlerts > 0 && (
                <AlertBubble count={liveData.metrics.activeAlerts} severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Change Readiness</p>
                    <p className="text-2xl font-bold text-pink-600">{liveData.metrics.avgConfidence || avgReadiness}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-pink-200" />
                </div>
                <Progress value={liveData.metrics.avgConfidence || avgReadiness} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Training Completion</p>
                    <p className="text-2xl font-bold text-blue-600">{Math.round((totalCompleted / totalEnrolled) * 100)}%</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{totalCompleted.toLocaleString()} completed</p>
              </CardContent>
            </Card>
            <Card className="relative">
              {liveData.metrics.atRiskProjects > 0 && (
                <AlertBubble count={liveData.metrics.atRiskProjects} severity="critical" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Stakeholder Sentiment</p>
                    <p className="text-2xl font-bold text-green-600">{positiveStakeholders}/{stakeholderGroups.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">positive groups</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Avg Satisfaction</p>
                    <p className="text-2xl font-bold text-amber-600">{avgSatisfaction}/5</p>
                  </div>
                  <Award className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">training rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Impacted Staff</p>
                    <p className="text-2xl font-bold text-purple-600">{companyMetrics.totalEmployees.toLocaleString()}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">L&G employees</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>ADKAR Readiness</span>
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {readinessMetrics.map((metric, i) => (
                    <ReadinessMetricCard key={i} metric={metric} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Division Stakeholders</span>
                  <Badge variant="outline" className="text-xs">From L&G Divisions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stakeholderGroups.map((group, i) => (
                    <StakeholderCard key={i} group={group} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Training Programs</span>
                  <Badge variant="outline" className="text-xs">From OKRs</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainingPrograms.map((program, i) => (
                    <TrainingCard key={i} program={program} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cross-Agent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CrossAgentActivityFeed maxItems={5} compact />
            </CardContent>
          </Card>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
