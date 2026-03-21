/**
 * OBJECTIVES BOARD WIDGET
 *
 * Displays OKR objectives with key results and progress.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, Bot, DollarSign, TrendingUp, Building2, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOKRObjectives } from '@/hooks/useDashboardData';
import { formatValueInMillions } from '@/lib/formatters';
import type { DataMode, TransformedObjective } from '@/lib/agentDataTransformers';

interface ObjectivesBoardWidgetProps {
  mode: DataMode;
}

function ObjectiveCard({ objective, mode }: { objective: TransformedObjective; mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              objective.status === 'ahead' ? 'bg-green-500' :
              objective.status === 'on-track' ? 'bg-blue-500' : 'bg-amber-500'
            }`}>
              {objective.progress}%
            </div>
            <div>
              <h3 className="font-semibold text-base">{objective.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {objective.division}
                </span>
                <span>{objective.owner}</span>
                <span className="flex items-center gap-1 text-green-600">
                  <DollarSign className="h-3 w-3" />
                  {formatValueInMillions((objective.totalValueImpact?.costSavings || 0) + (objective.totalValueImpact?.revenueImpact || 0))} value
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={
              objective.status === 'ahead' ? 'default' :
              objective.status === 'on-track' ? 'secondary' : 'destructive'
            }>
              {objective.status}
            </Badge>
            {expanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
          </div>
        </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Cost Savings</p>
                    <p className="font-bold text-green-600">{formatValueInMillions(objective.totalValueImpact?.costSavings || 0)}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Revenue Impact</p>
                    <p className="font-bold text-blue-600">{formatValueInMillions(objective.totalValueImpact?.revenueImpact || 0)}</p>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-sm mb-3">Key Results</h4>
              <div className="space-y-3">
                {objective.keyResults.map((kr, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{kr.title || kr.name}</span>
                      <span className="text-sm font-bold text-orange-600">{kr.progress || 0}%</span>
                    </div>
                    <Progress value={kr.progress || 0} className="h-1.5 mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Current: {kr.current}</span>
                      <span>Target: {kr.target}</span>
                    </div>
                  </div>
                ))}
              </div>

              {objective.collaboratingAgents && objective.collaboratingAgents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-500" />
                    Collaborating Agents
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {objective.collaboratingAgents.map((agent, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                        <div className={`w-2 h-2 rounded-full ${mode === 'VRO' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="font-medium text-sm text-purple-800">{agent.agentName || agent.name}</span>
                        <span className="text-xs text-gray-500">{agent.lastSync || 'Just now'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function ObjectivesBoardWidget({ mode }: ObjectivesBoardWidgetProps) {
  const { data: rawObjectives = [] } = useOKRObjectives();

  // Transform raw OKR data to expected format
  const objectives: TransformedObjective[] = (rawObjectives as any[]).map((o: any, i: number) => {
    const progress = typeof o.progress === 'number' ? o.progress : parseInt(o.progress || '0', 10) || 50;
    return {
      id: o.id || `obj-${i}`,
      name: o.title || o.objective || o.name || `Objective ${i + 1}`,
      title: o.title || o.objective || o.name || `Objective ${i + 1}`,
      progress,
      status: o.status || (progress >= 80 ? 'ahead' : progress >= 50 ? 'on-track' : 'at-risk'),
      division: o.division || o.businessUnit || 'Operations',
      owner: o.owner || 'TBD',
      totalValueImpact: o.totalValueImpact || { costSavings: 100000 + i * 50000, revenueImpact: 200000 + i * 75000 },
      collaboratingAgents: (o.collaboratingAgents || []).map((a: any) => ({
        name: a.name || 'Agent',
        role: a.role || 'Tracker',
        agentName: a.agentName || a.name || 'Agent',
        lastSync: a.lastSync || new Date().toISOString(),
      })),
      keyResults: (o.keyResults || []).map((kr: any, j: number) => ({
        name: kr.title || kr.keyResult || kr.name || `Key Result ${j + 1}`,
        title: kr.title || kr.keyResult || kr.name || `Key Result ${j + 1}`,
        target: parseFloat(kr.targetValue || kr.target || '100') || 100,
        current: parseFloat(kr.currentValue || kr.current || '0') || 0,
        status: kr.status || 'on-track',
        progress: typeof kr.progress === 'number' ? kr.progress : parseInt(kr.progress || '0', 10) || 0,
        linkedInitiatives: [],
      })),
    };
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Strategic Objectives</span>
          <Badge variant="outline" className="text-xs">Click to expand</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {objectives.map((objective) => (
            <ObjectiveCard key={objective.id} objective={objective} mode={mode} />
          ))}
          {objectives.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No objectives available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
