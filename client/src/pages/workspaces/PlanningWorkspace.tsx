import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { WorkspacePageLayout } from "@/components/WorkspacePageLayout";
import { usePageContext } from "@/contexts/PageContext";
import { Calendar, Users, GanttChart, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlanningWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'other',
      pageTitle: 'Planning Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "allocation",
      label: "Resource Allocation",
      icon: <Users className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Resource Allocation</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Resource allocation and assignment will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "capacity",
      label: "Capacity",
      icon: <Users className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Capacity Planning</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Capacity planning and utilization will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Project Schedule</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Project timelines and schedules will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "dependencies",
      label: "Dependencies",
      icon: <Network className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Dependencies</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Project dependencies and critical paths will be displayed here.</p></CardContent>
        </Card>
      ),
    },
  ];

  return (
    <WorkspacePageLayout>
      <WorkspaceLayout
        title="Planning Workspace"
        description="Strategic planning, resource allocation, and capacity management"
        icon={<Calendar className="h-6 w-6" />}
        tabs={tabs}
        defaultTab="allocation"
      />
    </WorkspacePageLayout>
  );
}
