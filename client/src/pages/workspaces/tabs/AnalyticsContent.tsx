import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, Target, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DashboardData {
  summary: {
    totalProjects: number;
    totalBudget: number;
    avgCPI: number;
    avgSPI: number;
    riskScore: number;
  };
  projectHealth: {
    onTrack: number;
    atRisk: number;
    delayed: number;
  };
  financials: {
    totalSpent: number;
    totalAllocated: number;
    utilizationRate: number;
  };
}

export function AnalyticsContent() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard-data');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const result = await res.json();

      return {
        summary: result.summary || {
          totalProjects: 0,
          totalBudget: 0,
          avgCPI: 1.0,
          avgSPI: 1.0,
          riskScore: 0,
        },
        projectHealth: result.projectHealth || {
          onTrack: 0,
          atRisk: 0,
          delayed: 0,
        },
        financials: result.financials || {
          totalSpent: 0,
          totalAllocated: 0,
          utilizationRate: 0,
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cpiTrend = (data?.summary.avgCPI || 1.0) >= 1.0 ? 'up' : 'down';
  const spiTrend = (data?.summary.avgSPI || 1.0) >= 1.0 ? 'up' : 'down';
  const totalProjects = (data?.projectHealth.onTrack || 0) + (data?.projectHealth.atRisk || 0) + (data?.projectHealth.delayed || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Data insights and performance analytics across your portfolio
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{data?.summary.totalProjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  ${((data?.summary.totalBudget || 0) / 1000000).toFixed(1)}M
                </p>
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
                <p className="text-sm text-muted-foreground">Avg CPI</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{(data?.summary.avgCPI || 1.0).toFixed(2)}</p>
                  {cpiTrend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg SPI</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{(data?.summary.avgSPI || 1.0).toFixed(2)}</p>
                  {spiTrend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Health Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Project Health Distribution
          </CardTitle>
          <CardDescription>Status breakdown across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">On Track</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{data?.projectHealth.onTrack || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalProjects > 0 ? Math.round(((data?.projectHealth.onTrack || 0) / totalProjects) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <Progress
                value={totalProjects > 0 ? ((data?.projectHealth.onTrack || 0) / totalProjects) * 100 : 0}
                className="h-2 bg-gray-200"
                indicatorClassName="bg-green-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">At Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{data?.projectHealth.atRisk || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalProjects > 0 ? Math.round(((data?.projectHealth.atRisk || 0) / totalProjects) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <Progress
                value={totalProjects > 0 ? ((data?.projectHealth.atRisk || 0) / totalProjects) * 100 : 0}
                className="h-2 bg-gray-200"
                indicatorClassName="bg-yellow-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Delayed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{data?.projectHealth.delayed || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalProjects > 0 ? Math.round(((data?.projectHealth.delayed || 0) / totalProjects) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <Progress
                value={totalProjects > 0 ? ((data?.projectHealth.delayed || 0) / totalProjects) * 100 : 0}
                className="h-2 bg-gray-200"
                indicatorClassName="bg-red-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Performance
          </CardTitle>
          <CardDescription>Budget utilization and spending trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ${((data?.financials.totalSpent || 0) / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold">
                  ${((data?.financials.totalAllocated || 0) / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">
                  {((data?.financials.utilizationRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget Utilization</span>
                <span className="font-semibold">
                  {((data?.financials.utilizationRate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={(data?.financials.utilizationRate || 0) * 100}
                className="h-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alert */}
      {(data?.summary.riskScore || 0) > 70 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">High Risk Portfolio</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Average risk score of {data?.summary.riskScore || 0} exceeds threshold. Review at-risk projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
