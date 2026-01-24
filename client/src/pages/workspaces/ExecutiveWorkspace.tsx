import { useEffect, useState } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { usePageContext } from "@/contexts/PageContext";
import { TrendingUp, Target, BarChart3, Leaf, BookOpen, Activity } from "lucide-react";
import { CommonOperationalPicture } from "@/components/CommonOperationalPicture";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";

// Import existing page components to reuse in tabs
import { VROFrameworkContent } from "./tabs/VROFrameworkContent";
import { OKRDashboardContent } from "./tabs/OKRDashboardContent";
import { SustainabilityContent } from "./tabs/SustainabilityContent";
import { AnalyticsContent } from "./tabs/AnalyticsContent";
import { AgentMonitoringContent } from "./tabs/AgentMonitoringContent";

export default function ExecutiveWorkspace() {
  const { setPageContext } = usePageContext();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState<{type: string; id: string} | null>(null);

  useEffect(() => {
    setPageContext({
      pageType: 'executive-workspace',
      pageTitle: 'Executive Workspace',
    });
  }, [setPageContext]);

  const handleDrillDown = (type: string, id: string) => {
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  const tabs: WorkspaceTab[] = [
    {
      id: "portfolio",
      label: "Portfolio",
      icon: <BarChart3 className="h-4 w-4" />,
      content: <CommonOperationalPicture onDrillDown={handleDrillDown} />,
    },
    {
      id: "value",
      label: "Value Realization",
      icon: <TrendingUp className="h-4 w-4" />,
      content: <VROFrameworkContent />,
    },
    {
      id: "okrs",
      label: "OKRs",
      icon: <Target className="h-4 w-4" />,
      content: <OKRDashboardContent />,
    },
    {
      id: "sustainability",
      label: "Sustainability",
      icon: <Leaf className="h-4 w-4" />,
      content: <SustainabilityContent />,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BookOpen className="h-4 w-4" />,
      content: <AnalyticsContent />,
    },
    {
      id: "agents",
      label: "Agent Monitoring",
      icon: <Activity className="h-4 w-4" />,
      content: <AgentMonitoringContent />,
    },
  ];

  return (
    <>
      <WorkspaceLayout
        title="Executive Workspace"
        description="Portfolio health, value realization, and strategic alignment"
        icon={<TrendingUp className="h-6 w-6" />}
        tabs={tabs}
        defaultTab="portfolio"
      />

      <DrillDownDrawer
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        entityType={drillDownEntity?.type || ''}
        entityId={drillDownEntity?.id || ''}
      />
    </>
  );
}
