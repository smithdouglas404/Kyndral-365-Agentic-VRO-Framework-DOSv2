import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { usePageContext } from "@/contexts/PageContext";
import { FolderKanban, CheckSquare, AlertCircle, FileEdit, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder tab content components
function ProjectsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Project portfolio and details will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function TasksTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Task management and tracking will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function IssuesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Issue tracking and resolution will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function ChangeRequestsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Change request management will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function RiskTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Risk tracking and mitigation will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function CollaborationTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaboration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Team collaboration and communication tools will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

export default function PMWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'pm-workspace',
      pageTitle: 'PM Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "projects",
      label: "My Projects",
      icon: <FolderKanban className="h-4 w-4" />,
      content: <ProjectsTab />,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: <CheckSquare className="h-4 w-4" />,
      content: <TasksTab />,
    },
    {
      id: "issues",
      label: "Issues",
      icon: <AlertCircle className="h-4 w-4" />,
      content: <IssuesTab />,
    },
    {
      id: "changes",
      label: "Change Requests",
      icon: <FileEdit className="h-4 w-4" />,
      content: <ChangeRequestsTab />,
    },
    {
      id: "risks",
      label: "Risks",
      icon: <Shield className="h-4 w-4" />,
      content: <RiskTab />,
    },
    {
      id: "collaboration",
      label: "Collaboration",
      icon: <Users className="h-4 w-4" />,
      content: <CollaborationTab />,
    },
  ];

  return (
    <WorkspaceLayout
      title="PM Workspace"
      description="Project management, tasks, issues, and risk tracking"
      icon={<FolderKanban className="h-6 w-6" />}
      tabs={tabs}
      defaultTab="projects"
    />
  );
}
