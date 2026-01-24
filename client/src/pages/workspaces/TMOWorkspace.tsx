import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { WorkspacePageLayout } from "@/components/WorkspacePageLayout";
import { usePageContext } from "@/contexts/PageContext";
import { RefreshCw, Map, Target, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TMOWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'other',
      pageTitle: 'TMO Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "roadmap",
      label: "Roadmap",
      icon: <Map className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Transformation Roadmap</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Transformation roadmap and initiatives will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "initiatives",
      label: "Change Initiatives",
      icon: <RefreshCw className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Change Initiatives</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Change initiatives and programs will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "milestones",
      label: "Milestones",
      icon: <Target className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Key milestones and deliverables will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "resources",
      label: "Resources",
      icon: <Users className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Resource Management</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Resource allocation and capacity planning will be displayed here.</p></CardContent>
        </Card>
      ),
    },
  ];

  return (
    <WorkspacePageLayout>
      <WorkspaceLayout
        title="TMO Workspace"
        description="Transformation management, roadmaps, and change initiatives"
        icon={<RefreshCw className="h-6 w-6" />}
        tabs={tabs}
        defaultTab="roadmap"
      />
    </WorkspacePageLayout>
  );
}
