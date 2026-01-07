import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Repeat, Users, TrendingUp, Target, CheckCircle2, 
  AlertTriangle, ArrowRight, BarChart3, Clock, Sparkles
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

const changeInitiatives = [
  { 
    name: 'Digital Platform Rollout', 
    phase: 'Adoption',
    progress: 68,
    impactedUsers: 4500,
    status: 'on-track'
  },
  { 
    name: 'Customer Portal Enhancement', 
    phase: 'Training',
    progress: 45,
    impactedUsers: 2800,
    status: 'at-risk'
  },
  { 
    name: 'Data Analytics Transformation', 
    phase: 'Pilot',
    progress: 92,
    impactedUsers: 890,
    status: 'complete'
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
                <CardTitle className="text-lg">Active Change Initiatives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {changeInitiatives.map((initiative, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{initiative.name}</span>
                        <Badge variant={
                          initiative.status === 'complete' ? 'default' :
                          initiative.status === 'at-risk' ? 'destructive' : 'secondary'
                        }>
                          {initiative.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Phase: {initiative.phase}</span>
                        <span>{initiative.impactedUsers.toLocaleString()} users</span>
                      </div>
                      <Progress value={initiative.progress} className="h-1.5 mt-2" />
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
