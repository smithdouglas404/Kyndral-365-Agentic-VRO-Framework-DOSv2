import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RefreshCw, Users, Clock, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScenarioParam {
  id: string;
  label: string;
  icon: React.ElementType;
  value: number;
  min: number;
  max: number;
  unit: string;
  description: string;
  affectsAgents: string[];
}

export function ScenarioParameters() {
  const [params, setParams] = useState<ScenarioParam[]>([
    {
      id: 'scope',
      label: 'Project Scope',
      icon: Target,
      value: 75,
      min: 25,
      max: 100,
      unit: '%',
      description: 'Affects ROI, timeline, and resource needs',
      affectsAgents: ['VRO', 'PMO', 'TMO']
    },
    {
      id: 'investment',
      label: 'Total Investment',
      icon: DollarSign,
      value: 125,
      min: 50,
      max: 200,
      unit: '£M',
      description: 'Budget changes require Governance approval',
      affectsAgents: ['VRO', 'Governance', 'FinOps']
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
      value: 24,
      min: 12,
      max: 36,
      unit: 'months',
      description: 'Synced with Planning agent milestones',
      affectsAgents: ['PMO', 'Planning']
    },
    {
      id: 'team',
      label: 'Team Size',
      icon: Users,
      value: 85,
      min: 25,
      max: 150,
      unit: 'FTE',
      description: 'Resource changes notify PMO agent',
      affectsAgents: ['PMO', 'OCM']
    }
  ]);

  const handleParamChange = (id: string, newValue: number[]) => {
    setParams(prev => prev.map(p => 
      p.id === id ? { ...p, value: newValue[0] } : p
    ));
  };

  const resetParams = () => {
    setParams(prev => prev.map(p => ({
      ...p,
      value: p.id === 'scope' ? 75 : 
             p.id === 'investment' ? 125 :
             p.id === 'timeline' ? 24 : 85
    })));
  };

  const quickScenarios = [
    { name: 'Conservative', scope: 50, investment: 80, timeline: 30, team: 50 },
    { name: 'Balanced', scope: 75, investment: 125, timeline: 24, team: 85 },
    { name: 'Aggressive', scope: 100, investment: 175, timeline: 18, team: 120 }
  ];

  const applyQuickScenario = (scenario: typeof quickScenarios[0]) => {
    setParams(prev => prev.map(p => ({
      ...p,
      value: p.id === 'scope' ? scenario.scope :
             p.id === 'investment' ? scenario.investment :
             p.id === 'timeline' ? scenario.timeline : scenario.team
    })));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-500" />
            Scenario Parameters
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetParams}
            className="text-xs"
            data-testid="reset-scenario"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Changes affect connected agents in real-time
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-5">
          {params.map((param) => {
            const Icon = param.icon;
            const percentage = ((param.value - param.min) / (param.max - param.min)) * 100;
            
            return (
              <div key={param.id} className="space-y-2" data-testid={`param-${param.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{param.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[#005EB8]">
                    {param.id === 'investment' ? '£' : ''}{param.value}{param.id === 'investment' ? 'M' : param.unit === '%' ? '%' : ` ${param.unit}`}
                  </span>
                </div>
                
                <Slider
                  value={[param.value]}
                  onValueChange={(val) => handleParamChange(param.id, val)}
                  min={param.min}
                  max={param.max}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{param.min}{param.unit}</span>
                  <span>{param.max}{param.unit}</span>
                </div>
                
                <p className="text-xs text-gray-500">{param.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-3">Quick Scenarios</p>
          <div className="flex gap-2">
            {quickScenarios.map((scenario) => (
              <Button
                key={scenario.name}
                variant="outline"
                size="sm"
                className="text-xs flex-1"
                onClick={() => applyQuickScenario(scenario)}
                data-testid={`quick-scenario-${scenario.name.toLowerCase()}`}
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
