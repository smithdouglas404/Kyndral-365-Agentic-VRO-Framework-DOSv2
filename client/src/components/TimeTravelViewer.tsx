/**
 * Time Travel Viewer
 * Shows portfolio state at different points in time (4 weeks history)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingDown, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface PortfolioSnapshot {
  date: string;
  weekNumber: number;
  metrics: {
    totalProjects: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    avgCPI: number;
    avgSPI: number;
    portfolioBudgetVariance: number;
  };
  topIssues: string[];
  agentActivity: {
    interventions: number;
    patterns: number;
    a2aMessages: number;
  };
}

export function TimeTravelViewer() {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current, 1-4 = weeks ago
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      // Check if demo mode is active
      const demoResponse = await fetch('/api/demo/status', { credentials: 'include' });
      const demoStatus = await demoResponse.json();

      if (!demoStatus.active) {
        setLoading(false);
        return;
      }

      // Load demo data
      const dataResponse = await fetch('/api/demo/data', { credentials: 'include' });
      const demoData = await dataResponse.json();

      // Generate snapshots from Battle Rhythm events
      const mondayBriefings = demoData.battleRhythm
        ?.filter((event: any) => event.type === 'monday_briefing')
        .sort((a: any, b: any) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

      const generatedSnapshots: PortfolioSnapshot[] = [];

      // Current state (week 0)
      const currentSnapshot: PortfolioSnapshot = {
        date: new Date().toISOString(),
        weekNumber: 0,
        metrics: {
          totalProjects: demoData.projects.length,
          criticalCount: demoData.projects.filter((p: any) => p.healthStatus === 'critical').length,
          warningCount: demoData.projects.filter((p: any) => p.healthStatus === 'warning').length,
          healthyCount: demoData.projects.filter((p: any) => p.healthStatus === 'healthy').length,
          avgCPI: demoData.projects.reduce((sum: number, p: any) => sum + p.budget.cpi, 0) / demoData.projects.length,
          avgSPI: demoData.projects.reduce((sum: number, p: any) => sum + p.schedule.spi, 0) / demoData.projects.length,
          portfolioBudgetVariance: 0,
        },
        topIssues: demoData.interventions.slice(0, 3).map((i: any) => i.message.split('.')[0]),
        agentActivity: {
          interventions: demoData.interventions.length,
          patterns: demoData.observations.filter((o: any) => o.type === 'pattern_detection').length,
          a2aMessages: demoData.observations.filter((o: any) => o.type === 'agent_collaboration').length,
        },
      };
      generatedSnapshots.push(currentSnapshot);

      // Historical snapshots from Battle Rhythm
      mondayBriefings?.forEach((briefing: any) => {
        const summary = typeof briefing.summary === 'string' ? JSON.parse(briefing.summary) : briefing.summary;

        generatedSnapshots.push({
          date: briefing.eventDate,
          weekNumber: briefing.weekNumber,
          metrics: {
            totalProjects: demoData.projects.length,
            criticalCount: summary.criticalProjects || 0,
            warningCount: 0,
            healthyCount: 0,
            avgCPI: parseFloat(briefing.details?.metrics?.avgCPI || 0.95),
            avgSPI: parseFloat(briefing.details?.metrics?.avgSPI || 0.95),
            portfolioBudgetVariance: parseFloat(briefing.details?.metrics?.portfolioBudgetVariance || 0),
          },
          topIssues: summary.topIssues || [],
          agentActivity: {
            interventions: 0,
            patterns: 0,
            a2aMessages: 0,
          },
        });
      });

      setSnapshots(generatedSnapshots);
      setLoading(false);
    } catch (error) {
      console.error('Error loading historical data:', error);
      setLoading(false);
    }
  };

  const currentSnapshot = snapshots[currentWeek];
  const previousSnapshot = snapshots[currentWeek + 1];

  const getMetricChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading historical data...
        </CardContent>
      </Card>
    );
  }

  if (!currentSnapshot) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No historical data available. Activate demo mode to see Time Travel.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Travel: Portfolio History
            </CardTitle>
            <CardDescription>
              View portfolio state across the past 4 weeks
            </CardDescription>
          </div>
          <Badge variant="outline">
            {currentWeek === 0 ? 'Current Week' : `${currentWeek} ${currentWeek === 1 ? 'week' : 'weeks'} ago`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatDate(currentSnapshot.date)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.min(currentWeek + 1, snapshots.length - 1))}
                disabled={currentWeek >= snapshots.length - 1}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(Math.max(currentWeek - 1, 0))}
                disabled={currentWeek === 0}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Slider
            value={[snapshots.length - 1 - currentWeek]}
            onValueChange={([value]) => setCurrentWeek(snapshots.length - 1 - value)}
            max={snapshots.length - 1}
            step={1}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4 weeks ago</span>
            <span>Current</span>
          </div>
        </div>

        {/* Portfolio Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Projects at Risk"
            current={currentSnapshot.metrics.criticalCount + currentSnapshot.metrics.warningCount}
            previous={previousSnapshot?.metrics.criticalCount + previousSnapshot?.metrics.warningCount}
            format={(v) => v.toString()}
          />
          <MetricCard
            label="Avg CPI"
            current={currentSnapshot.metrics.avgCPI}
            previous={previousSnapshot?.metrics.avgCPI}
            format={(v) => v.toFixed(2)}
          />
          <MetricCard
            label="Avg SPI"
            current={currentSnapshot.metrics.avgSPI}
            previous={previousSnapshot?.metrics.avgSPI}
            format={(v) => v.toFixed(2)}
          />
          <MetricCard
            label="Agent Interventions"
            current={currentSnapshot.agentActivity.interventions}
            previous={previousSnapshot?.agentActivity.interventions}
            format={(v) => v.toString()}
          />
        </div>

        {/* Top Issues */}
        {currentSnapshot.topIssues.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Top Issues at This Time</h4>
            <div className="space-y-2">
              {currentSnapshot.topIssues.map((issue, idx) => (
                <div key={idx} className="text-sm p-2 bg-muted rounded border">
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, current, previous, format }: {
  label: string;
  current: number;
  previous?: number;
  format: (v: number) => string;
}) {
  const change = previous ? ((current - previous) / previous) * 100 : null;

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{format(current)}</div>
      {change !== null && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${
          change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
