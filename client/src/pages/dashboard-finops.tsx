/**
 * FINOPS DASHBOARD
 *
 * Financial operations intelligence dashboard using CustomizableDashboard.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { Calculator, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AgentSidebar } from '@/components/AgentSidebar';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { BudgetOverviewWidget } from '@/components/widgets/finops/BudgetOverviewWidget';
import { CostCategoriesWidget } from '@/components/widgets/finops/CostCategoriesWidget';
import { SavingsOpportunitiesWidget } from '@/components/widgets/finops/SavingsOpportunitiesWidget';
import { EVMMetricsWidget } from '@/components/widgets/finops/EVMMetricsWidget';
import { AIRecommendations } from '@/components/AIRecommendations';
import AgentActionQueue from '@/components/AgentActionQueue';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { useFinancialInsights } from '@/hooks/useAgentInsights';
import type { DataMode } from '@/lib/agentDataTransformers';

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap">Enterprise</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

export default function FinOpsDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>('VRO');
  const [viewMode, setViewMode] = useState<'realtime' | 'snapshot'>('realtime');
  const { setPageContext } = usePageContext();
  const { data: financialInsights } = useFinancialInsights();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'finops',
      entityName: 'FinOps Intelligence Center',
      breadcrumb: ['Dashboard', 'FinOps']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };

  // Map widget IDs to their components
  const widgetComponents = useMemo(() => ({
    'finops-budget-overview': <BudgetOverviewWidget mode={dataMode} onDrillDown={handleDrillDown} />,
    'finops-cost-categories': <CostCategoriesWidget mode={dataMode} />,
    'finops-savings-opportunities': <SavingsOpportunitiesWidget mode={dataMode} />,
    'finops-evm-metrics': <EVMMetricsWidget mode={dataMode} />,
    'agent-action-queue': <AgentActionQueue />,
    'cross-agent-collaboration': <CrossAgentActivityFeed maxItems={5} compact />,
  }), [dataMode]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">FinOps Intelligence Center</h1>
                  <p className="text-muted-foreground">Cost Optimization & Financial Analytics</p>
                </div>
                <Badge className="ml-4 bg-green-100 text-green-700 gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
                <Badge variant="outline" className="ml-2">{dataMode} Mode</Badge>
                {financialInsights && (
                  <Badge variant="default" className="ml-2 bg-purple-600">
                    <Brain className="h-3 w-3 mr-1" />
                    Agent EVM
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('realtime')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'realtime' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
                  data-testid="btn-realtime"
                >
                  Real-time
                </button>
                <button
                  onClick={() => setViewMode('snapshot')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'snapshot' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  data-testid="btn-snapshot"
                >
                  30-Day Snapshot
                </button>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="mb-8">
            <AIRecommendations agentType="finops" />
          </div>

          {/* Customizable Dashboard */}
          <CustomizableDashboard
            activeTab="finops"
            dashboardType="finops"
            widgetComponents={widgetComponents}
            onDrillDown={handleDrillDown}
          />

          {/* Cross-Agent Collaboration */}
          <CrossAgentCollaboration />
        </main>
      </div>

      <DrillDownDrawer
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        entityType={drillDownEntity.type}
        entityId={drillDownEntity.id}
      />
    </div>
  );
}
