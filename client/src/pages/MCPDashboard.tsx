import { useState } from 'react';
import { Cpu } from 'lucide-react';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { AIExecutiveInsights } from '@/components/AIExecutiveInsights';
import { UnifiedMetricsSection } from '@/components/UnifiedMetricsSection';
import { MCPConnectionStatusWidget } from '@/components/widgets/MCPConnectionStatusWidget';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';

export default function MCPDashboard() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  const handleDrillDown = (type: string, id: string) => {
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  const widgetComponents = {
    'ai-executive-insights': <AIExecutiveInsights onDrillDown={handleDrillDown} />,
    'unified-metrics': <UnifiedMetricsSection onDrillDown={handleDrillDown} />,
    'mcp-connection-status': <MCPConnectionStatusWidget agentId="pmo" />,
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-8 flex items-center gap-3">
            <Cpu className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">MCP Management</h1>
              <p className="text-muted-foreground">
                Model Context Protocol connection management and monitoring
              </p>
            </div>
          </div>

          <CustomizableDashboard
            activeTab="mcp"
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
