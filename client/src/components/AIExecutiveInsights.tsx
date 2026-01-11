import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  Target,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ExecutiveInsight {
  headline: string;
  portfolioHealth: 'green' | 'amber' | 'red';
  healthSummary: string;
  keyRisks: Array<{
    title: string;
    impact: string;
    mitigation: string;
    severity: 'high' | 'medium' | 'low';
    linkedEntity?: string;
  }>;
  opportunities: Array<{
    title: string;
    potentialValue: string;
    action: string;
    linkedEntity?: string;
  }>;
  recommendations: Array<{
    action: string;
    rationale: string;
    priority: 'urgent' | 'high' | 'medium';
    actionRef?: string;
  }>;
  kpiHighlights: Array<{
    name: string;
    status: 'on-track' | 'at-risk' | 'off-track';
    delta: string;
  }>;
  generatedAt: string;
}

async function fetchExecutiveInsights(): Promise<ExecutiveInsight> {
  const res = await fetch('/api/insights/executive', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}

async function refreshExecutiveInsights(): Promise<ExecutiveInsight> {
  const res = await fetch('/api/insights/executive/refresh', { 
    method: 'POST',
    credentials: 'include' 
  });
  if (!res.ok) throw new Error('Failed to refresh insights');
  return res.json();
}

const healthColors = {
  green: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-200' },
  red: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200' }
};

const severityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
};

const priorityColors = {
  urgent: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-blue-500 text-white'
};

const kpiStatusColors = {
  'on-track': 'text-emerald-600 bg-emerald-50',
  'at-risk': 'text-amber-600 bg-amber-50',
  'off-track': 'text-red-600 bg-red-50'
};

export function AIExecutiveInsights() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: insights, isLoading, error } = useQuery<ExecutiveInsight>({
    queryKey: ['executive-insights'],
    queryFn: fetchExecutiveInsights,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const refreshMutation = useMutation({
    mutationFn: refreshExecutiveInsights,
    onSuccess: (data) => {
      queryClient.setQueryData(['executive-insights'], data);
    }
  });

  const handleActionClick = (actionRef?: string) => {
    if (!actionRef) return;
    
    if (actionRef.startsWith('OPEN_PROJECT:')) {
      const projectId = actionRef.replace('OPEN_PROJECT:', '');
      setLocation(`/pmo/projects/${projectId}`);
    } else if (actionRef === 'REVIEW_DEPENDENCIES' || actionRef.startsWith('REVIEW_DEP:')) {
      setLocation('/pmo/dependencies');
    } else if (actionRef.startsWith('REVIEW_RISK:') || actionRef === 'REVIEW_RISKS') {
      setLocation('/pmo/risk-register');
    } else if (actionRef.startsWith('REVIEW_PI:') || actionRef === 'REVIEW_PI') {
      setLocation('/pmo/pi-planning');
    } else if (actionRef.startsWith('REVIEW_OKR:') || actionRef === 'REVIEW_OKRS') {
      setLocation('/pmo/okrs');
    } else if (actionRef.startsWith('ASK_PM:')) {
      const query = actionRef.replace('ASK_PM:', '');
      setLocation(`/pmo/ask-pm?q=${encodeURIComponent(query)}`);
    } else {
      console.warn('Unknown action reference:', actionRef);
    }
  };

  const keyRisks = insights?.keyRisks || [];
  const opportunities = insights?.opportunities || [];
  const recommendations = insights?.recommendations || [];
  const kpiHighlights = insights?.kpiHighlights || [];

  if (isLoading) {
    return (
      <Card className="mb-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card className="mb-6 border-2 border-red-100">
        <CardContent className="py-6 text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load executive insights</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refreshMutation.mutate()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const health = healthColors[insights.portfolioHealth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className={`border-2 ${health.border} bg-gradient-to-br from-slate-50 to-white shadow-lg`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${health.light}`}>
                <Brain className={`h-6 w-6 ${health.text}`} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  AI Executive Intelligence
                  <Badge variant="outline" className={`text-xs ${health.light} ${health.text} border-0`}>
                    <span className={`w-2 h-2 rounded-full ${health.bg} mr-1`} />
                    {insights.portfolioHealth.toUpperCase()}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  Generated {new Date(insights.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="text-gray-500 hover:text-blue-600"
              data-testid="button-refresh-insights"
            >
              <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 rounded-lg ${health.light} border ${health.border}`}
          >
            <h3 className={`text-lg font-semibold ${health.text} mb-2`}>
              {insights.headline}
            </h3>
            <p className="text-sm text-gray-700">{insights.healthSummary}</p>
          </motion.div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {kpiHighlights.map((kpi, i) => (
              <motion.div
                key={kpi.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`flex-shrink-0 px-3 py-2 rounded-lg ${kpiStatusColors[kpi.status]} border`}
                data-testid={`kpi-highlight-${i}`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">{kpi.name}</span>
                </div>
                <p className="text-xs mt-1">{kpi.delta}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="font-semibold text-sm">Key Risks</h4>
              </div>
              {keyRisks.map((risk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-3 rounded-lg bg-white border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all"
                  data-testid={`risk-card-${i}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{risk.title}</span>
                    <Badge className={`text-xs ${severityColors[risk.severity]} border`}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-red-600 font-medium mb-1">{risk.impact}</p>
                  <p className="text-xs text-gray-600">{risk.mitigation}</p>
                  {risk.linkedEntity && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {risk.linkedEntity}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Lightbulb className="h-4 w-4" />
                <h4 className="font-semibold text-sm">Opportunities</h4>
              </div>
              {opportunities.map((opp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-3 rounded-lg bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all"
                  data-testid={`opportunity-card-${i}`}
                >
                  <span className="text-sm font-medium text-gray-900">{opp.title}</span>
                  <p className="text-xs text-emerald-600 font-medium mt-1">{opp.potentialValue}</p>
                  <p className="text-xs text-gray-600 mt-1">{opp.action}</p>
                  {opp.linkedEntity && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {opp.linkedEntity}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Zap className="h-4 w-4" />
                <h4 className="font-semibold text-sm">Recommended Actions</h4>
              </div>
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => handleActionClick(rec.actionRef)}
                  data-testid={`recommendation-card-${i}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {rec.action}
                    </span>
                    <Badge className={`text-xs ${priorityColors[rec.priority]} shrink-0`}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{rec.rationale}</p>
                  {rec.actionRef && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>Click to navigate</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
