import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Zap, AlertTriangle, DollarSign, TrendingDown,
  Loader2, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { triggerDemoScenario } from '@/lib/backgroundAgentMonitor';

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  agents: string[];
  duration: string;
}

const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'budget-breach',
    name: 'Budget Breach Cascade',
    description: 'FinOps detects overspend → alerts PMO → Governance reviews',
    icon: DollarSign,
    color: 'bg-green-500',
    agents: ['FinOps', 'PMO', 'Governance'],
    duration: '~5s'
  },
  {
    id: 'critical-project',
    name: 'Critical Project Alert',
    description: 'PMO flags critical status → VRO assesses value → TMO mobilizes',
    icon: AlertTriangle,
    color: 'bg-red-500',
    agents: ['PMO', 'VRO', 'TMO', 'Governance'],
    duration: '~6s'
  },
  {
    id: 'value-at-risk',
    name: 'Value at Risk Response',
    description: 'VRO detects shortfall → PMO investigates → FinOps reallocates',
    icon: TrendingDown,
    color: 'bg-amber-500',
    agents: ['VRO', 'PMO', 'FinOps'],
    duration: '~7s'
  }
];

export function DemoScenarioPanel() {
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());

  const handleRunScenario = (scenarioId: string) => {
    setRunningScenario(scenarioId);
    triggerDemoScenario(scenarioId);
    
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId);
    const duration = scenario?.id === 'value-at-risk' ? 7000 : scenario?.id === 'critical-project' ? 6000 : 5000;
    
    setTimeout(() => {
      setRunningScenario(null);
      setCompletedScenarios(prev => new Set([...Array.from(prev), scenarioId]));
    }, duration);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-600" />
          Demo Scenarios
        </CardTitle>
        <CardDescription className="text-xs">
          Trigger cross-agent coordination scenarios to see agents in action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {DEMO_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isRunning = runningScenario === scenario.id;
          const isCompleted = completedScenarios.has(scenario.id);
          
          return (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.01 }}
              className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${scenario.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{scenario.name}</span>
                    <Badge variant="outline" className="text-[10px]">{scenario.duration}</Badge>
                    {isCompleted && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {scenario.agents.map((agent, i) => (
                      <span key={agent} className="flex items-center text-[10px] text-gray-400">
                        {agent}
                        {i < scenario.agents.length - 1 && (
                          <span className="mx-1">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant={isRunning ? "outline" : "default"}
                  disabled={isRunning || runningScenario !== null}
                  onClick={() => handleRunScenario(scenario.id)}
                  className="shrink-0"
                  data-testid={`button-run-scenario-${scenario.id}`}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
