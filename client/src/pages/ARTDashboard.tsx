import { useState } from 'react';
import { Activity } from 'lucide-react';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { AIExecutiveInsights } from '@/components/AIExecutiveInsights';
import { UnifiedMetricsSection } from '@/components/UnifiedMetricsSection';
import { ARTPredictabilityWidget } from '@/components/widgets/ARTPredictabilityWidget';
import { ARTPIObjectivesWidget } from '@/components/widgets/ARTPIObjectivesWidget';
import { ARTDORAMetricsWidget } from '@/components/widgets/ARTDORAMetricsWidget';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';

export default function ARTDashboard() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  const handleDrillDown = (type: string, id: string) => {
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  const widgetComponents = {
    'ai-executive-insights': <AIExecutiveInsights onDrillDown={handleDrillDown} />,
    'unified-metrics': <UnifiedMetricsSection onDrillDown={handleDrillDown} />,
    'art-predictability': <ARTPredictabilityWidget />,
    'art-pi-objectives': <ARTPIObjectivesWidget />,
    'art-dora-metrics': <ARTDORAMetricsWidget />,
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-8 flex items-center gap-3">
            <Activity className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">ART Dashboard</h1>
              <p className="text-muted-foreground">
                Agile Release Train PI execution, flow, and delivery health
              </p>
            </div>
          </div>

          <CustomizableDashboard
            activeTab="art"
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
