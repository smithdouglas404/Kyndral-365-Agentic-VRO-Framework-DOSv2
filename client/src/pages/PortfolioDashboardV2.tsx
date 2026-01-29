import { useState } from 'react';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { PortfolioFlowMetricsWidget } from '@/components/widgets/PortfolioFlowMetricsWidget';
import { AIExecutiveInsights } from '@/components/AIExecutiveInsights';
import { UnifiedMetricsSection } from '@/components/UnifiedMetricsSection';
import { AgentSidebar } from '@/components/AgentSidebar';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';

export default function PortfolioDashboard() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  const handleDrillDown = (type: string, id: string) => {
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  const widgetComponents = {
    'ai-executive-insights': <AIExecutiveInsights onDrillDown={handleDrillDown} />,
    'unified-metrics': <UnifiedMetricsSection onDrillDown={handleDrillDown} />,
    'portfolio-flow-metrics': <PortfolioFlowMetricsWidget />,
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Portfolio Dashboard</h1>
            <p className="text-muted-foreground">Lean Portfolio Management insights across strategic themes and investment horizons.</p>
          </div>

          <CustomizableDashboard
            activeTab="portfolio"
            widgetComponents={widgetComponents}
            onDrillDown={handleDrillDown}
          />
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
