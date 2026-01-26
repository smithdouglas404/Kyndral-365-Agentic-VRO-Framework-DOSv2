/**
 * ADVANCED FINANCIAL MANAGEMENT
 * Cost centers, chargebacks, invoicing, and financial forecasting
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialMetrics, useEVM, useBurnRate } from '@/hooks/useAnalytics';

export default function AdvancedFinancialManagement() {
  const [view, setView] = useState<'overview' | 'evm' | 'burn-rate' | 'forecast'>('overview');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');

  const { data: metricsData } = useFinancialMetrics({
    portfolioId: selectedPortfolio || undefined,
  });

  const metrics = metricsData?.metrics;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Management</h1>
          <p className="text-muted-foreground">Cost centers, EVM, and financial forecasting</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            <Plus className="w-4 h-4" />
            New Cost Center
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'overview', label: 'Overview', icon: PieChart },
          { value: 'evm', label: 'Earned Value', icon: TrendingUp },
          { value: 'burn-rate', label: 'Burn Rate', icon: TrendingDown },
          { value: 'forecast', label: 'Forecast', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setView(tab.value as any)}
              className={`px-4 py-2 rounded-lg ${
                view === tab.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Financial Overview */}
      {view === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(metrics.totalBudget / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Actual Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(metrics.totalActualCost / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.totalActualCost / metrics.totalBudget) * 100).toFixed(1)}% of budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Variance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  metrics.variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${Math.abs(metrics.variance / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.variance >= 0 ? 'Under budget' : 'Over budget'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  CPI (Cost Performance)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  metrics.avgCPI >= 1 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.avgCPI.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.avgCPI >= 1 ? 'Good performance' : 'Needs attention'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Center Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Center Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.costCenters?.map((cc: any) => (
                  <div key={cc.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{cc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cc.projectCount} projects
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(cc.totalCost / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of ${(cc.totalBudget / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Earned Value Management */}
      {view === 'evm' && (
        <Card>
          <CardHeader>
            <CardTitle>Earned Value Management (EVM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <p>Select a project to view EVM metrics</p>
              <p className="text-xs mt-2">PV, EV, AC, SPI, CPI, EAC, ETC, VAC</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Burn Rate Analysis */}
      {view === 'burn-rate' && (
        <Card>
          <CardHeader>
            <CardTitle>Burn Rate Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-4" />
              <p>Burn rate tracking and runway projections</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Forecast */}
      {view === 'forecast' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <p>AI-powered financial forecasting</p>
              <p className="text-xs mt-2">Monte Carlo simulations and predictive analytics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
