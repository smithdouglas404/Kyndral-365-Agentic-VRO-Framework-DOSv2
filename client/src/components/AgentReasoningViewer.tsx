/**
 * AGENT REASONING VIEWER
 *
 * Shows step-by-step agent decision-making process:
 * - Tool calls and results
 * - Reasoning steps
 * - Data sources consulted
 * - Confidence scores
 * - LangSmith trace links
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Search,
  Database,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningStep {
  id: string;
  type: 'thought' | 'tool_call' | 'observation' | 'conclusion';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
  confidence?: number;
  dataSources?: string[];
}

interface AgentTrace {
  interventionId: string;
  agentName: string;
  startTime: Date;
  endTime?: Date;
  steps: ReasoningStep[];
  finalDecision: string;
  confidence: number;
  langsmithTraceUrl?: string;
  dataSourcesUsed: string[];
}

interface AgentReasoningViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interventionId: string;
  agentName: string;
  reasoning?: string;
}

// Mock trace data generator (in production, this would fetch from LangSmith API or database)
function generateMockTrace(interventionId: string, agentName: string, reasoning?: string): AgentTrace {
  const now = new Date();
  const steps: ReasoningStep[] = [
    {
      id: 'step-1',
      type: 'thought',
      content: 'Analyzing project financial metrics to identify budget trajectory anomalies.',
      timestamp: new Date(now.getTime() - 5000),
      confidence: 95,
    },
    {
      id: 'step-2',
      type: 'tool_call',
      content: 'Fetching EVM metrics from FinancialCalculationEngine',
      timestamp: new Date(now.getTime() - 4500),
      toolName: 'get_evm_metrics',
      toolInput: { projectId: interventionId, includeForecast: true },
      dataSources: ['projects table', 'tasks table', 'benefits_realization table'],
    },
    {
      id: 'step-3',
      type: 'observation',
      content: 'Retrieved EVM data: CPI=0.82 (18% over budget), SPI=0.91 (9% behind schedule), EAC=$2.4M (20% increase from BAC)',
      timestamp: new Date(now.getTime() - 4000),
      confidence: 100,
      dataSources: ['database query results', 'calculated metrics'],
    },
    {
      id: 'step-4',
      type: 'thought',
      content: 'CPI < 0.85 indicates severe cost overrun. Analyzing burn rate trend to forecast completion date.',
      timestamp: new Date(now.getTime() - 3500),
      confidence: 92,
    },
    {
      id: 'step-5',
      type: 'tool_call',
      content: 'Running predictive forecast model',
      timestamp: new Date(now.getTime() - 3000),
      toolName: 'forecast_budget',
      toolInput: { projectId: interventionId, horizonWeeks: 12 },
      dataSources: ['historical spend data', 'resource allocation', 'task completion rates'],
    },
    {
      id: 'step-6',
      type: 'observation',
      content: 'Forecast shows trajectory exceeding budget by $480K if current burn rate continues. Critical intervention threshold (>15% overage) will be reached in 3 weeks.',
      timestamp: new Date(now.getTime() - 2500),
      confidence: 87,
    },
    {
      id: 'step-7',
      type: 'thought',
      content: 'Cross-referencing with scope and value realization data to identify descope opportunities that minimize value loss.',
      timestamp: new Date(now.getTime() - 2000),
      confidence: 90,
    },
    {
      id: 'step-8',
      type: 'tool_call',
      content: 'Analyzing value streams and benefits linkage',
      timestamp: new Date(now.getTime() - 1500),
      toolName: 'get_benefits_realization',
      toolInput: { projectId: interventionId },
      dataSources: ['benefits_realization table', 'okr_linkages table', 'strategic_themes'],
    },
    {
      id: 'step-9',
      type: 'observation',
      content: 'Identified Phase 2 features account for 35% of remaining scope but only 18% of planned value realization. Deferring Phase 2 would reduce budget by $420K while preserving 82% of strategic value.',
      timestamp: new Date(now.getTime() - 1000),
      confidence: 85,
      dataSources: ['value analysis', 'scope breakdown', 'strategic alignment matrix'],
    },
    {
      id: 'step-10',
      type: 'conclusion',
      content: reasoning || 'Recommendation: Defer Phase 2 scope to control budget overrun. This action will bring EAC back to $2.1M (5% over BAC), preserve 82% of strategic value, and maintain on-track delivery for Phase 1 commitments.',
      timestamp: new Date(now.getTime() - 500),
      confidence: 87,
    },
  ];

  return {
    interventionId,
    agentName,
    startTime: new Date(now.getTime() - 5000),
    endTime: now,
    steps,
    finalDecision: reasoning || 'Defer Phase 2 scope to control budget trajectory',
    confidence: 87,
    langsmithTraceUrl: `https://smith.langchain.com/public/DFIN-Pipeline/r/${interventionId}`,
    dataSourcesUsed: [
      'PostgreSQL: projects, tasks, benefits_realization, okr_linkages',
      'FinancialCalculationEngine: EVM metrics',
      'PredictiveAnalyticsEngine: Budget forecast',
      'Strategic Themes: Value alignment matrix',
    ],
  };
}

const stepTypeConfig = {
  thought: {
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Reasoning',
  },
  tool_call: {
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Tool Call',
  },
  observation: {
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Observation',
  },
  conclusion: {
    icon: Lightbulb,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Conclusion',
  },
};

function ReasoningStepCard({ step, index }: { step: ReasoningStep; index: number }) {
  const config = stepTypeConfig[step.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          config.bgColor,
          config.borderColor,
          'border-2'
        )}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        {index < 10 && (
          <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[40px]" />
        )}
      </div>

      {/* Step content */}
      <Card className={cn(
        'flex-1 border-l-4 mb-4',
        config.borderColor
      )}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {index + 1}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
              {step.confidence && (
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {step.confidence}% confidence
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {step.timestamp.toLocaleTimeString()}
            </span>
          </div>

          <p className="text-sm text-foreground/90 mb-3">
            {step.content}
          </p>

          {/* Tool details */}
          {step.toolName && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">Tool: </span>
                <code className="bg-muted px-1.5 py-0.5 rounded">
                  {step.toolName}
                </code>
              </div>
              {step.toolInput && (
                <div className="ml-5">
                  <span className="text-muted-foreground">Input: </span>
                  <code className="text-xs text-foreground/70">
                    {JSON.stringify(step.toolInput, null, 2)}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Data sources */}
          {step.dataSources && step.dataSources.length > 0 && (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Data Sources: </span>
                <span>{step.dataSources.join(', ')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AgentReasoningViewer({
  open,
  onOpenChange,
  interventionId,
  agentName,
  reasoning,
}: AgentReasoningViewerProps) {
  // In production, fetch actual trace data from API
  const trace = generateMockTrace(interventionId, agentName, reasoning);
  const durationMs = trace.endTime && trace.startTime
    ? trace.endTime.getTime() - trace.startTime.getTime()
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Agent Reasoning Trace
              </DialogTitle>
              <DialogDescription>
                Step-by-step decision-making process for this recommendation
              </DialogDescription>
            </div>
            {trace.langsmithTraceUrl && (
              <a
                href={trace.langsmithTraceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View in LangSmith
              </a>
            )}
          </div>
        </DialogHeader>

        {/* Trace metadata */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Agent</span>
              </div>
              <p className="text-sm font-semibold">{trace.agentName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Confidence</span>
              </div>
              <p className="text-sm font-semibold">{trace.confidence}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Duration</span>
              </div>
              <p className="text-sm font-semibold">{(durationMs / 1000).toFixed(1)}s</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-muted-foreground">Data Sources</span>
              </div>
              <p className="text-sm font-semibold">{trace.dataSourcesUsed.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Data sources used */}
        <Card className="bg-muted/30 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-2">Data Sources Consulted</h4>
                <div className="space-y-1">
                  {trace.dataSourcesUsed.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      <span>{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        {/* Reasoning steps timeline */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Reasoning Timeline
            </h4>
            {trace.steps.map((step, index) => (
              <ReasoningStepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </ScrollArea>

        {/* Final decision */}
        <Card className="border-2 border-primary/20 bg-primary/5 mt-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">Final Decision</h4>
                <p className="text-sm text-foreground/80">{trace.finalDecision}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    {trace.confidence}% confidence
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {trace.steps.length} reasoning steps
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
