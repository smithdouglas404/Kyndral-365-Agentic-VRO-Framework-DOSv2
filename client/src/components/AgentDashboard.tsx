import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, AlertTriangle, TrendingUp, CheckCircle2, Zap, 
  Clock, Users, ChevronRight, RefreshCw, Target, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAgentData } from '@/hooks/useAgentData';
import { AgentType } from '@/lib/dataHub';
import { DrillDownDrawer } from './DrillDownDrawer';
import { CrossAgentActivityFeed } from './CrossAgentActivityFeed';

interface AgentDashboardProps {
  agentId: AgentType;
  title: string;
  subtitle: string;
}

const statusColors = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  accelerating: 'bg-green-500',
  'on-track': 'bg-blue-500',
  'at-risk': 'bg-amber-500',
  blocked: 'bg-red-500'
};

export function AgentDashboard({ agentId, title, subtitle }: AgentDashboardProps) {
  const data = useAgentData(agentId);
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null);

  const handleEntityClick = (type: string, id: string) => {
    setSelectedEntity({ type, id });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => data.projects[0] && handleEntityClick('project', data.projects[0].id)}
          data-testid="metric-total-projects"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold">{data.metrics.totalProjects}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-green-600">{data.metrics.healthyProjects} healthy</span>
              <span className="text-xs text-amber-600">{data.metrics.atRiskProjects} at risk</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => data.programs[0] && handleEntityClick('program', data.programs[0].id)}
          data-testid="metric-total-value"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-2xl font-bold">£{data.metrics.totalValue}m</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-500">Realized:</span>
              <span className="text-xs font-medium">£{data.metrics.realizedValue}m</span>
              <Progress value={(data.metrics.realizedValue / data.metrics.totalValue) * 100} className="h-1 flex-1 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => data.programs[0] && handleEntityClick('program', data.programs[0].id)}
          data-testid="metric-confidence"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="text-2xl font-bold">{data.metrics.avgConfidence}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <Progress value={data.metrics.avgConfidence} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => data.events[0]?.relatedEntity && handleEntityClick(data.events[0].relatedEntity.type as string, data.events[0].relatedEntity.id)}
          data-testid="metric-active-alerts"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Alerts</p>
                <p className="text-2xl font-bold">{data.metrics.activeAlerts}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                {data.metrics.pendingActions} actions pending
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Projects & Programs
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700">Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.projects.slice(0, 5).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleEntityClick('project', project.id)}
                  data-testid={`project-${project.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[project.status]}`} />
                      <span className="font-medium text-sm">{project.name}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{project.bu}</span>
                    <span>Budget: £{project.budget.spent}m / £{project.budget.total}m</span>
                    <span>Velocity: {project.safe.velocity}</span>
                  </div>
                  {project.aiSignals.length > 0 && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
                      <Brain size={12} className="inline mr-1" />
                      {project.aiSignals[0].message}
                    </div>
                  )}
                </motion.div>
              ))}
              {data.programs.slice(0, 3).map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 5) * 0.05 }}
                  className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleEntityClick('program', program.id)}
                  data-testid={`program-${program.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[program.valueStatus]}`} />
                      <span className="font-medium text-sm">{program.name}</span>
                      <Badge variant="outline" className="text-xs">VRO Program</Badge>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>ROI: {program.expectedROI}</span>
                    <span>Realized: £{program.valueRealized}m</span>
                    <span>Alignment: {program.strategicAlignment}%</span>
                  </div>
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                    <Zap size={12} className="inline mr-1" />
                    {program.prediction}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Pending Actions
              </CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                {data.projects.reduce((sum, p) => sum + p.proactiveActions.length, 0)} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.projects.flatMap(p => 
                p.proactiveActions.map(action => ({
                  ...action,
                  projectName: p.name,
                  projectId: p.id
                }))
              ).slice(0, 8).map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left h-auto py-3 hover:bg-gray-50"
                    onClick={() => handleEntityClick('project', action.projectId)}
                    data-testid={`action-${action.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={
                            action.type === 'mitigate' ? 'bg-red-50 text-red-700 border-red-200' :
                            action.type === 'accelerate' ? 'bg-green-50 text-green-700 border-green-200' :
                            action.type === 'escalate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          {action.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={
                            action.urgency === 'immediate' ? 'bg-red-50 text-red-700' :
                            action.urgency === 'this-week' ? 'bg-amber-50 text-amber-700' :
                            'bg-gray-50 text-gray-700'
                          }
                        >
                          {action.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{action.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{action.projectName} • Impact: {action.impact}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <CrossAgentActivityFeed maxItems={6} />

      <DrillDownDrawer
        isOpen={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
        entityType={selectedEntity?.type || ''}
        entityId={selectedEntity?.id || ''}
      />
    </div>
  );
}
