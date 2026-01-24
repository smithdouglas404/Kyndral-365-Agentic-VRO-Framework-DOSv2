import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { format } from 'date-fns';

interface OKR {
  id: string;
  title: string;
  description?: string;
  level: 'company' | 'project' | 'functional';
  functionalArea?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'at_risk';
  progress: number;
  keyResults?: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

export function OKRDashboardContent() {
  const [, navigate] = useLocation();

  const { data: okrs, isLoading } = useQuery<OKR[]>({
    queryKey: ['okrs-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/okrs');
      if (!res.ok) throw new Error('Failed to fetch OKRs');
      const result = await res.json();
      return result.okrs || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeOKRs = okrs?.filter(o => o.status === 'active') || [];
  const completedOKRs = okrs?.filter(o => o.status === 'completed') || [];
  const atRiskOKRs = okrs?.filter(o => o.status === 'at_risk') || [];
  const avgProgress = activeOKRs.length > 0
    ? Math.round(activeOKRs.reduce((sum, o) => sum + o.progress, 0) / activeOKRs.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">OKR Alignment</h2>
          <p className="text-sm text-gray-500 mt-1">
            Strategic objectives and key results tracking
          </p>
        </div>
        <Button onClick={() => navigate('/admin/okr-management')}>
          Manage OKRs
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total OKRs</p>
                <p className="text-2xl font-bold">{okrs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeOKRs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold">{atRiskOKRs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active OKRs */}
      {activeOKRs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active OKRs</h3>
          {activeOKRs.map((okr) => (
            <Card key={okr.id} className={okr.status === 'at_risk' ? 'border-red-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {okr.level}
                      </Badge>
                      {okr.functionalArea && (
                        <Badge variant="outline">{okr.functionalArea.toUpperCase()}</Badge>
                      )}
                      {okr.status === 'at_risk' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          At Risk
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{okr.title}</CardTitle>
                    {okr.description && (
                      <CardDescription className="mt-2">{okr.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-semibold">{okr.progress}%</span>
                  </div>
                  <Progress value={okr.progress} className="h-3" />
                </div>

                {okr.keyResults && okr.keyResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Key Results:</p>
                    {okr.keyResults.map((kr) => (
                      <div key={kr.id} className="pl-4 border-l-2 border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{kr.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  kr.status === 'on_track'
                                    ? 'text-green-600 border-green-600'
                                    : kr.status === 'at_risk'
                                    ? 'text-yellow-600 border-yellow-600'
                                    : kr.status === 'completed'
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-red-600 border-red-600'
                                }
                              >
                                {kr.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-sm font-semibold">{kr.progress}%</span>
                        </div>
                        <Progress
                          value={kr.progress}
                          className="h-2"
                          indicatorClassName={
                            kr.status === 'on_track'
                              ? 'bg-green-500'
                              : kr.status === 'at_risk'
                              ? 'bg-yellow-500'
                              : kr.status === 'completed'
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(okr.startDate), 'MMM d')} - {format(new Date(okr.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed OKRs */}
      {completedOKRs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700">Completed OKRs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedOKRs.map((okr) => (
              <Card key={okr.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completed
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{okr.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={100} className="h-2" indicatorClassName="bg-green-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!okrs || okrs.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No OKRs Configured</h3>
            <p className="text-muted-foreground mb-4">
              Set up objectives and key results to track strategic alignment
            </p>
            <Button onClick={() => navigate('/admin/okr-management')}>
              Create OKRs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
