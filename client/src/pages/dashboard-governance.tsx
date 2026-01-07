import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Shield, CheckCircle2, Clock, AlertTriangle, FileText,
  Users, Calendar, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

const governanceItems = [
  { 
    title: 'Steering Committee Review',
    type: 'decision',
    status: 'pending',
    priority: 'high',
    dueDate: 'Jan 15, 2025',
    owner: 'Group CTO'
  },
  { 
    title: 'Budget Variance Approval',
    type: 'approval',
    status: 'in-review',
    priority: 'high',
    dueDate: 'Jan 12, 2025',
    owner: 'CFO'
  },
  { 
    title: 'Risk Assessment Update',
    type: 'review',
    status: 'complete',
    priority: 'medium',
    dueDate: 'Jan 8, 2025',
    owner: 'CRO'
  },
  { 
    title: 'Regulatory Compliance Check',
    type: 'compliance',
    status: 'complete',
    priority: 'high',
    dueDate: 'Jan 5, 2025',
    owner: 'Compliance'
  }
];

const riskCategories = [
  { name: 'Strategic Risk', score: 'Medium', trend: 'stable', items: 4 },
  { name: 'Operational Risk', score: 'Low', trend: 'improving', items: 8 },
  { name: 'Financial Risk', score: 'Medium', trend: 'stable', items: 5 },
  { name: 'Regulatory Risk', score: 'Low', trend: 'stable', items: 3 },
  { name: 'Technology Risk', score: 'High', trend: 'worsening', items: 6 }
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

export default function GovernanceDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Governance Agent</h1>
                <p className="text-muted-foreground">Compliance, Controls & Decision Tracking</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Pending Decisions</p>
                    <p className="text-2xl font-bold text-amber-600">3</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">1 high priority</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Compliance Score</p>
                    <p className="text-2xl font-bold text-green-600">94%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">FCA aligned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active Risks</p>
                    <p className="text-2xl font-bold text-red-600">26</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">5 categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Audit Items</p>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Q1 review</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Governance Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {governanceItems.map((item, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border-l-4 border-l-transparent hover:border-l-[#005EB8] transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{item.title}</span>
                        <Badge variant={
                          item.status === 'complete' ? 'default' :
                          item.status === 'in-review' ? 'secondary' : 'outline'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.owner}
                        </span>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Risk Categories
                  <span className="text-xs text-gray-500 font-normal">(L&G Three Lines Model)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskCategories.map((risk, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{risk.name}</span>
                        <Badge variant={
                          risk.score === 'Low' ? 'default' :
                          risk.score === 'Medium' ? 'secondary' : 'destructive'
                        }>
                          {risk.score}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{risk.items} items tracked</span>
                        <span className={
                          risk.trend === 'improving' ? 'text-green-600' :
                          risk.trend === 'worsening' ? 'text-red-600' : 'text-gray-500'
                        }>
                          {risk.trend}
                        </span>
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
