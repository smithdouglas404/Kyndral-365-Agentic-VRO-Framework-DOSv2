/**
 * AGENT ACTION QUEUE - HITL (Human-in-the-Loop) Dashboard
 *
 * This is the CRITICAL missing piece that makes agents "visible" to users.
 * Shows agent recommendations with approve/reject actions.
 *
 * Real-time updates via WebSocket (interventionEvents)
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Target,
  Sparkles,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AgentReasoningViewer } from '@/components/AgentReasoningViewer';

interface AgentIntervention {
  id: string;
  type: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality' | 'risk' | 'value';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  confidence: number;
  suggestedAction: string;
  impact: string;
  reasoning?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'dismissed' | 'executing' | 'completed';
  agentSource: string;
  estimatedValue?: number;
  estimatedTimeImpact?: string;
}

const severityConfig = {
  critical: { color: 'destructive', icon: AlertTriangle, label: 'Critical' },
  high: { color: 'destructive', icon: AlertTriangle, label: 'High' },
  medium: { color: 'warning', icon: Clock, label: 'Medium' },
  low: { color: 'secondary', icon: TrendingUp, label: 'Low' },
};

const typeConfig = {
  dependency: { icon: Target, label: 'Dependency', color: 'blue' },
  budget: { icon: DollarSign, label: 'Budget', color: 'green' },
  timeline: { icon: Calendar, label: 'Schedule', color: 'purple' },
  resource: { icon: Users, label: 'Resource', color: 'orange' },
  quality: { icon: CheckCircle2, label: 'Quality', color: 'teal' },
  risk: { icon: AlertTriangle, label: 'Risk', color: 'red' },
  value: { icon: TrendingUp, label: 'Value', color: 'indigo' },
};

export default function AgentActionQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [reasoningViewerOpen, setReasoningViewerOpen] = useState(false);
  const [selectedInterventionForReasoning, setSelectedInterventionForReasoning] = useState<AgentIntervention | null>(null);

  // Fetch interventions from backend
  const { data: interventions = [], isLoading } = useQuery<AgentIntervention[]>({
    queryKey: ['/api/interventions'],
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'interventionUpdate') {
        queryClient.invalidateQueries({ queryKey: ['/api/interventions'] });
      }
    };

    return () => ws.close();
  }, [queryClient]);

  // Approve intervention
  const approveMutation = useMutation({
    mutationFn: async (interventionId: string) => {
      const response = await fetch('/api/interventions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interventionId }),
      });
      if (!response.ok) throw new Error('Failed to approve intervention');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interventions'] });
      toast({
        title: 'Intervention Approved',
        description: 'Agent action has been approved and will be executed.',
      });
    },
  });

  // Dismiss intervention
  const dismissMutation = useMutation({
    mutationFn: async (interventionId: string) => {
      const response = await fetch('/api/interventions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interventionId }),
      });
      if (!response.ok) throw new Error('Failed to dismiss intervention');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interventions'] });
      toast({
        title: 'Intervention Dismissed',
        description: 'Agent recommendation has been dismissed.',
      });
    },
  });

  const filteredInterventions = activeTab === 'pending'
    ? interventions.filter(i => i.status === 'pending')
    : interventions;

  const pendingCount = interventions.filter(i => i.status === 'pending').length;
  const criticalCount = interventions.filter(i => i.severity === 'critical' && i.status === 'pending').length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Agent Action Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading agent recommendations...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Agent Action Queue
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI agents monitoring your portfolio and recommending actions
            </CardDescription>
          </div>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {criticalCount} critical
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({interventions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {filteredInterventions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No {activeTab === 'pending' ? 'pending' : ''} recommendations</p>
                <p className="text-sm mt-1">
                  Agents are monitoring your projects 24/7
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInterventions.map((intervention) => {
                  const TypeIcon = typeConfig[intervention.type]?.icon || Target;
                  const SeverityIcon = severityConfig[intervention.severity]?.icon || Clock;
                  const isExpanded = expandedCard === intervention.id;

                  return (
                    <Card
                      key={intervention.id}
                      className={`border-l-4 transition-all ${
                        intervention.severity === 'critical'
                          ? 'border-l-destructive bg-destructive/5'
                          : intervention.severity === 'high'
                          ? 'border-l-orange-500 bg-orange-50/50'
                          : 'border-l-primary'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg bg-${typeConfig[intervention.type]?.color}-100`}>
                                <TypeIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-semibold text-sm">
                                    {intervention.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {intervention.agentSource}
                                  </Badge>
                                  <Badge
                                    variant={intervention.severity === 'critical' || intervention.severity === 'high' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    <SeverityIcon className="h-3 w-3 mr-1" />
                                    {severityConfig[intervention.severity]?.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {intervention.projectName}
                                </p>
                                <p className="text-sm text-foreground/80">
                                  {intervention.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(intervention.timestamp).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {intervention.confidence && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {Math.round(intervention.confidence * 100)}% confidence
                              </div>
                            )}
                            {intervention.estimatedValue && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${intervention.estimatedValue.toLocaleString()} impact
                              </div>
                            )}
                            {intervention.estimatedTimeImpact && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {intervention.estimatedTimeImpact}
                              </div>
                            )}
                          </div>

                          {/* Suggested Action */}
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-foreground mb-1">
                                  Recommended Action
                                </p>
                                <p className="text-sm text-foreground/80">
                                  {intervention.suggestedAction}
                                </p>
                              </div>
                            </div>

                            {intervention.impact && (
                              <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-foreground mb-1">
                                    Expected Impact
                                  </p>
                                  <p className="text-sm text-foreground/80">
                                    {intervention.impact}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Reasoning (expandable or viewer) */}
                          {intervention.reasoning && (
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  setSelectedInterventionForReasoning(intervention);
                                  setReasoningViewerOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Agent Reasoning
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {intervention.status === 'pending' && (
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(intervention.id)}
                                disabled={approveMutation.isPending}
                                className="flex-1"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve & Execute
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => dismissMutation.mutate(intervention.id)}
                                disabled={dismissMutation.isPending}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Dismiss
                              </Button>
                            </div>
                          )}

                          {/* Status Badge for non-pending */}
                          {intervention.status !== 'pending' && (
                            <div className="flex items-center gap-2 pt-2">
                              <Badge
                                variant={
                                  intervention.status === 'approved' ? 'default' :
                                  intervention.status === 'executing' ? 'secondary' :
                                  intervention.status === 'completed' ? 'default' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {intervention.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {intervention.status === 'executing' && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                                {intervention.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {intervention.status === 'dismissed' && <XCircle className="h-3 w-3 mr-1" />}
                                {intervention.status.charAt(0).toUpperCase() + intervention.status.slice(1)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Agent Reasoning Viewer Dialog */}
      {selectedInterventionForReasoning && (
        <AgentReasoningViewer
          open={reasoningViewerOpen}
          onOpenChange={setReasoningViewerOpen}
          interventionId={selectedInterventionForReasoning.id}
          agentName={selectedInterventionForReasoning.agentSource}
          reasoning={selectedInterventionForReasoning.reasoning}
        />
      )}
    </Card>
  );
}
