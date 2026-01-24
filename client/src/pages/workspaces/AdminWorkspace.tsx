import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { WorkspacePageLayout } from "@/components/WorkspacePageLayout";
import { usePageContext } from "@/contexts/PageContext";
import { Settings, Users, Plug, Bot, FileText, Sliders } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/DocumentList";

export default function AdminWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'other',
      pageTitle: 'Admin Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "users",
      label: "Users",
      icon: <Users className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">User accounts and permissions management will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "roles",
      label: "Roles",
      icon: <Sliders className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Role Management</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Role configuration and access control will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <Plug className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Integration Management</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">External integrations and API connections will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "agents",
      label: "Agents",
      icon: <Bot className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Agent Configuration</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">AI agent settings and configuration will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="h-4 w-4" />,
      content: <DocumentList />,
    },
    {
      id: "system",
      label: "System",
      icon: <Settings className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">System settings and configuration will be displayed here.</p></CardContent>
        </Card>
      ),
    },
  ];

  return (
    <WorkspacePageLayout>
      <WorkspaceLayout
        title="Admin Workspace"
        description="System administration, user management, and configuration"
        icon={<Settings className="h-6 w-6" />}
        tabs={tabs}
        defaultTab="users"
      />
    </WorkspacePageLayout>
  );
}
