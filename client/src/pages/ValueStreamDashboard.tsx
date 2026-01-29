import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { AIExecutiveInsights } from '@/components/AIExecutiveInsights';
import { UnifiedMetricsSection } from '@/components/UnifiedMetricsSection';
import { ValueStreamLeadTimeWidget } from '@/components/widgets/ValueStreamLeadTimeWidget';
import { ValueStreamMapWidget } from '@/components/widgets/ValueStreamMapWidget';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';

export default function ValueStreamDashboard() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  const handleDrillDown = (type: string, id: string) => {
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  const widgetComponents = {
    'ai-executive-insights': <AIExecutiveInsights onDrillDown={handleDrillDown} />,
    'unified-metrics': <UnifiedMetricsSection onDrillDown={handleDrillDown} />,
    'value-stream-lead-time': <ValueStreamLeadTimeWidget />,
    'value-stream-map': <ValueStreamMapWidget />,
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-8 flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Value Stream Dashboard</h1>
              <p className="text-muted-foreground">
                End-to-end value stream flow efficiency and cycle time analysis
              </p>
            </div>
          </div>

          <CustomizableDashboard
            activeTab="value-stream"
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
