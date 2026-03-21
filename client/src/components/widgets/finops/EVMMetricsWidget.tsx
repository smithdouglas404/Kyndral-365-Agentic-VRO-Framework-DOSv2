/**
 * EVM METRICS WIDGET
 *
 * Displays Earned Value Management metrics including CPI, SPI, and portfolio health.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { useFinancialInsights } from '@/hooks/useAgentInsights';
import type { DataMode } from '@/lib/agentDataTransformers';

interface EVMMetricsWidgetProps {
  mode: DataMode;
}

export function EVMMetricsWidget({ mode }: EVMMetricsWidgetProps) {
  const { data: financialInsights, isLoading } = useFinancialInsights();

  const agentMetrics = financialInsights?.aggregated;
  const avgCPI = agentMetrics?.avgCPI || 1.0;
  const avgSPI = agentMetrics?.avgSPI || 1.0;
  const totalEV = agentMetrics?.totalEV || 0;
  const portfolioHealth = agentMetrics?.portfolioHealth || 0;

  if (!financialInsights) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          No EVM data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Agent-Calculated EVM Metrics
          <Badge variant="outline" className="ml-2 text-xs">
            Real-time from FinancialCalculationEngine
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Cost Performance Index</p>
            <p className={`text-2xl font-bold ${avgCPI >= 0.95 ? 'text-green-600' : avgCPI >= 0.85 ? 'text-amber-600' : 'text-red-600'}`}>
              {avgCPI.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {avgCPI >= 1.0 ? 'Under budget' : avgCPI >= 0.85 ? 'Acceptable' : 'Over budget'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Schedule Performance Index</p>
            <p className={`text-2xl font-bold ${avgSPI >= 0.95 ? 'text-green-600' : avgSPI >= 0.85 ? 'text-amber-600' : 'text-red-600'}`}>
              {avgSPI.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {avgSPI >= 1.0 ? 'Ahead of schedule' : avgSPI >= 0.85 ? 'Acceptable' : 'Behind schedule'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Earned Value (EV)</p>
            <p className="text-2xl font-bold text-blue-600">
              ${(totalEV / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Value of work completed
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Portfolio Health</p>
            <p className={`text-2xl font-bold ${portfolioHealth >= 0.8 ? 'text-green-600' : portfolioHealth >= 0.6 ? 'text-amber-600' : 'text-red-600'}`}>
              {(portfolioHealth * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Projects with CPI ≥ 0.95
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Total Projects Analyzed</p>
              <p className="font-semibold">{agentMetrics?.totalProjects || 0} projects</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs mb-1">Data Source</p>
              <p className="font-semibold text-purple-600">FinOps Agent Engine</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
