import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, GitBranch, RefreshCw, BarChart3, Target, Shield,
  Calendar, Users, TrendingUp, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactiveAgentDemo } from '@/components/ReactiveAgentDemo';

const agents = [
  {
    id: 'value-realization',
    name: 'Value Realization Agent',
    icon: DollarSign,
    color: 'bg-green-500',
    description: 'Orchestrates outcome-based portfolio governance with real-time ROI tracking and investment decision support.',
  },
  {
    id: 'pmo-orchestrator',
    name: 'PMO WorkFlow Orchestrator',
    icon: GitBranch,
    color: 'bg-green-500',
    description: 'Implements Lean/Agile PMO with flow metrics and capacity planning.',
  },
  {
    id: 'tmo-agent',
    name: 'TMO Transformation Agent',
    icon: RefreshCw,
    color: 'bg-blue-500',
    description: 'Manages enterprise transformation initiatives with change impact analysis.',
  },
  {
    id: 'finops-agent',
    name: 'FinOps Intelligence Agent',
    icon: BarChart3,
    color: 'bg-purple-500',
    description: 'Provides financial intelligence with cost optimization and budget forecasting.',
  },
  {
    id: 'okr-agent',
    name: 'OKR Alignment Agent',
    icon: Target,
    color: 'bg-amber-500',
    description: 'Ensures strategic alignment through OKR tracking and goal achievement monitoring.',
  },
  {
    id: 'governance-agent',
    name: 'Governance Guardian Agent',
    icon: Shield,
    color: 'bg-red-500',
    description: 'Ensures compliance, risk management, and governance standards.',
  },
  {
    id: 'planning-agent',
    name: 'Strategic Planning Agent',
    icon: Calendar,
    color: 'bg-teal-500',
    description: 'Coordinates strategic planning with scenario modeling and resource optimization.',
  },
  {
    id: 'ocm-agent',
    name: 'OCM Readiness Agent',
    icon: Users,
    color: 'bg-pink-500',
    description: 'Manages organizational change readiness and stakeholder engagement.',
  }
];

export function VROFrameworkContent() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Value Realization Office Framework</h2>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous agent orchestration for enterprise transformation
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          8 Active Agents
        </Badge>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents">Agent Architecture</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <motion.div
                  key={agent.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                      <div className={`p-2 rounded-lg ${agent.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-medium leading-none">
                        {agent.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">
                        {agent.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="demo" className="mt-4">
          <ReactiveAgentDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
