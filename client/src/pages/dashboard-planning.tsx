import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Calendar, CheckCircle2, Clock, AlertTriangle, Flag,
  ChevronRight, BarChart3, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

const milestones = [
  { 
    name: 'Phase 1: Foundation',
    status: 'complete',
    startDate: 'Oct 2024',
    endDate: 'Dec 2024',
    progress: 100,
    deliverables: ['Core platform setup', 'Team onboarding', 'Initial requirements']
  },
  { 
    name: 'Phase 2: Development',
    status: 'in-progress',
    startDate: 'Jan 2025',
    endDate: 'Jun 2025',
    progress: 45,
    deliverables: ['Digital platform build', 'Integration development', 'User testing']
  },
  { 
    name: 'Phase 3: Rollout',
    status: 'upcoming',
    startDate: 'Jul 2025',
    endDate: 'Dec 2025',
    progress: 0,
    deliverables: ['Phased deployment', 'Training delivery', 'Change management']
  },
  { 
    name: 'Phase 4: Optimization',
    status: 'planned',
    startDate: 'Jan 2026',
    endDate: 'Jun 2026',
    progress: 0,
    deliverables: ['Performance tuning', 'Feature enhancements', 'Value realization']
  }
];

const upcomingDeadlines = [
  { task: 'Customer Portal MVP', date: 'Jan 20, 2025', owner: 'Digital Team', status: 'on-track' },
  { task: 'Integration Testing Complete', date: 'Jan 28, 2025', owner: 'QA', status: 'at-risk' },
  { task: 'Security Audit', date: 'Feb 5, 2025', owner: 'InfoSec', status: 'on-track' },
  { task: 'Pilot Launch', date: 'Feb 15, 2025', owner: 'PMO', status: 'on-track' }
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

export default function PlanningDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");

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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Current Phase</p>
                    <p className="text-2xl font-bold text-indigo-600">2/4</p>
                  </div>
                  <Flag className="h-8 w-8 text-indigo-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Development</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-bold text-green-600">36%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
                <Progress value={36} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Upcoming Deadlines</p>
                    <p className="text-2xl font-bold text-amber-600">4</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Next 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">At Risk</p>
                    <p className="text-2xl font-bold text-red-600">1</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">milestone</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, i) => (
                    <div key={i} className="relative">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            milestone.status === 'complete' ? 'bg-green-500' :
                            milestone.status === 'in-progress' ? 'bg-indigo-500' :
                            'bg-gray-300'
                          }`}>
                            {milestone.status === 'complete' ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </div>
                          {i < milestones.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{milestone.name}</h4>
                            <Badge variant={
                              milestone.status === 'complete' ? 'default' :
                              milestone.status === 'in-progress' ? 'secondary' : 'outline'
                            }>
                              {milestone.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {milestone.startDate} - {milestone.endDate}
                          </p>
                          {milestone.status === 'in-progress' && (
                            <Progress value={milestone.progress} className="h-1.5 mb-2" />
                          )}
                          <div className="flex flex-wrap gap-1">
                            {milestone.deliverables.map((d, j) => (
                              <span key={j} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border-l-4 border-l-indigo-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{deadline.task}</span>
                        <Badge variant={deadline.status === 'at-risk' ? 'destructive' : 'secondary'}>
                          {deadline.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {deadline.date}
                        </span>
                        <span>{deadline.owner}</span>
                      </div>
                    </div>
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
