import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle2, BookOpen, MessageSquare, TrendingUp,
  AlertTriangle, BarChart3, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

const readinessMetrics = [
  { category: 'Awareness', score: 82, target: 90, description: 'Understanding of change purpose' },
  { category: 'Desire', score: 68, target: 80, description: 'Willingness to participate' },
  { category: 'Knowledge', score: 71, target: 85, description: 'Training completion' },
  { category: 'Ability', score: 58, target: 75, description: 'Skill proficiency' },
  { category: 'Reinforcement', score: 45, target: 70, description: 'Sustainment practices' }
];

const stakeholderGroups = [
  { name: 'Executive Leadership', sentiment: 'positive', engagement: 92, count: 24 },
  { name: 'Middle Management', sentiment: 'neutral', engagement: 68, count: 156 },
  { name: 'Front-line Staff', sentiment: 'mixed', engagement: 54, count: 2400 },
  { name: 'IT & Technology', sentiment: 'positive', engagement: 85, count: 340 },
  { name: 'External Partners', sentiment: 'positive', engagement: 78, count: 45 }
];

const trainingPrograms = [
  { name: 'Digital Platform Fundamentals', enrolled: 2100, completed: 1428, satisfaction: 4.2 },
  { name: 'New Process Workflows', enrolled: 1850, completed: 1110, satisfaction: 3.8 },
  { name: 'Leadership Change Management', enrolled: 180, completed: 162, satisfaction: 4.5 },
  { name: 'Customer Experience Excellence', enrolled: 890, completed: 534, satisfaction: 4.1 }
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

export default function OCMDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");

  const avgReadiness = Math.round(readinessMetrics.reduce((sum, m) => sum + m.score, 0) / readinessMetrics.length);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">OCM Agent</h1>
                <p className="text-muted-foreground">Organizational Change Management</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Change Readiness</p>
                    <p className="text-2xl font-bold text-pink-600">{avgReadiness}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-pink-200" />
                </div>
                <Progress value={avgReadiness} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Training Completion</p>
                    <p className="text-2xl font-bold text-blue-600">68%</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">3,234 completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Stakeholder Sentiment</p>
                    <p className="text-2xl font-bold text-green-600">72%</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">positive or neutral</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Resistance Points</p>
                    <p className="text-2xl font-bold text-amber-600">5</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">being addressed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ADKAR Readiness Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {readinessMetrics.map((metric, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{metric.category}</span>
                          <p className="text-xs text-gray-500">{metric.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-pink-600">{metric.score}%</span>
                          <span className="text-xs text-gray-400 ml-1">/ {metric.target}%</span>
                        </div>
                      </div>
                      <Progress value={metric.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stakeholder Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stakeholderGroups.map((group, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{group.name}</span>
                        <Badge variant={
                          group.sentiment === 'positive' ? 'default' :
                          group.sentiment === 'neutral' ? 'secondary' : 'outline'
                        }>
                          {group.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{group.count.toLocaleString()} people</span>
                        <span>{group.engagement}% engaged</span>
                      </div>
                      <Progress value={group.engagement} className="h-1 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Training Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trainingPrograms.map((program, i) => (
                  <div key={i} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-sm mb-3">{program.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Completion</span>
                        <span className="font-bold">{Math.round((program.completed / program.enrolled) * 100)}%</span>
                      </div>
                      <Progress value={(program.completed / program.enrolled) * 100} className="h-1.5" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{program.completed.toLocaleString()} / {program.enrolled.toLocaleString()}</span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {program.satisfaction}/5
                        </span>
                      </div>
                    </div>
                  </div>
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
