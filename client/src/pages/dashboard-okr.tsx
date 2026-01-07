import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Target, CheckCircle2, Clock, TrendingUp, AlertTriangle,
  ChevronRight, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

const objectives = [
  {
    id: '1',
    title: 'Accelerate PRT Market Leadership',
    owner: 'Institutional Retirement',
    progress: 82,
    status: 'on-track',
    keyResults: [
      { title: 'Achieve £10bn PRT volume', progress: 82, target: '£10bn', current: '£8.2bn' },
      { title: 'Increase market share to 25%', progress: 88, target: '25%', current: '22%' },
      { title: 'Launch 3 new DB solutions', progress: 67, target: '3', current: '2' }
    ]
  },
  {
    id: '2',
    title: 'Digital Transformation Excellence',
    owner: 'Group Technology',
    progress: 68,
    status: 'at-risk',
    keyResults: [
      { title: 'Complete platform modernization', progress: 65, target: '100%', current: '65%' },
      { title: 'Achieve 85% digital adoption', progress: 72, target: '85%', current: '61%' },
      { title: 'Reduce manual processes by 40%', progress: 68, target: '40%', current: '27%' }
    ]
  },
  {
    id: '3',
    title: 'Operational Efficiency',
    owner: 'Group Operations',
    progress: 91,
    status: 'ahead',
    keyResults: [
      { title: 'Deliver £200M cost savings', progress: 92, target: '£200M', current: '£184M' },
      { title: 'Improve forecast accuracy to 85%', progress: 89, target: '85%', current: '76%' },
      { title: 'Reduce cycle time by 30%', progress: 91, target: '30%', current: '27%' }
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

export default function OKRDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");
  const [expandedObjective, setExpandedObjective] = useState<string | null>('1');

  const avgProgress = Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length);

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
                <p className="text-muted-foreground">Objectives & Key Results Tracking</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                    <p className="text-xs text-gray-500">On Track</p>
                    <p className="text-2xl font-bold text-green-600">2</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
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
                    <p className="text-xs text-gray-500">Key Results</p>
                    <p className="text-2xl font-bold text-blue-600">9</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">being tracked</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 mb-8">
            {objectives.map((objective) => (
              <Card key={objective.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedObjective(expandedObjective === objective.id ? null : objective.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        objective.status === 'ahead' ? 'bg-green-500' :
                        objective.status === 'on-track' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}>
                        {objective.progress}%
                      </div>
                      <div>
                        <h3 className="font-semibold">{objective.title}</h3>
                        <p className="text-sm text-gray-500">{objective.owner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        objective.status === 'ahead' ? 'default' :
                        objective.status === 'on-track' ? 'secondary' : 'destructive'
                      }>
                        {objective.status}
                      </Badge>
                      <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedObjective === objective.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                </div>
                
                {expandedObjective === objective.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 py-3">Key Results</p>
                    <div className="space-y-3">
                      {objective.keyResults.map((kr, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{kr.title}</span>
                            <span className="text-sm font-bold text-orange-600">{kr.progress}%</span>
                          </div>
                          <Progress value={kr.progress} className="h-1.5 mb-2" />
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Current: {kr.current}</span>
                            <span>Target: {kr.target}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
