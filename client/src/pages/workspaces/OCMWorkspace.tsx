import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { usePageContext } from "@/contexts/PageContext";
import { Users, MessageSquare, BookOpen, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OCMWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'ocm-workspace',
      pageTitle: 'OCM Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "stakeholders",
      label: "Stakeholder Engagement",
      icon: <Users className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Stakeholder Engagement</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Stakeholder mapping and engagement tracking will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "communications",
      label: "Communications",
      icon: <MessageSquare className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Communications</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Communication plans and messaging will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "training",
      label: "Training",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Training Programs</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Training materials and completion tracking will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "collaboration",
      label: "Collaboration",
      icon: <UserCheck className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Team Collaboration</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Collaboration tools and team coordination will be displayed here.</p></CardContent>
        </Card>
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title="OCM Workspace"
      description="Organizational change management, stakeholder engagement, and training"
      icon={<Users className="h-6 w-6" />}
      tabs={tabs}
      defaultTab="stakeholders"
    />
  );
}
