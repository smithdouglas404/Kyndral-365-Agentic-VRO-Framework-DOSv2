import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { AIExecutiveInsights } from '@/components/AIExecutiveInsights';
import { UnifiedMetricsSection } from '@/components/UnifiedMetricsSection';
import { PredictionRiskForecastWidget } from '@/components/widgets/PredictionRiskForecastWidget';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';

export default function PredictionHubDashboard() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  const handleDrillDown = (type: string, id: string) => {
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  const widgetComponents = {
    'ai-executive-insights': <AIExecutiveInsights onDrillDown={handleDrillDown} />,
    'unified-metrics': <UnifiedMetricsSection onDrillDown={handleDrillDown} />,
    'prediction-risk-forecast': <PredictionRiskForecastWidget />,
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-8 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Prediction Hub</h1>
              <p className="text-muted-foreground">
                14-day ahead risk forecasts and predictive analytics from agent collaboration
              </p>
            </div>
          </div>

          <CustomizableDashboard
            activeTab="predictions"
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
