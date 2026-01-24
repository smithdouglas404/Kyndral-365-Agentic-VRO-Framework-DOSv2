import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { usePageContext } from "@/contexts/PageContext";
import { Shield, CheckCircle, FileText, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GovernanceWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'governance-workspace',
      pageTitle: 'Governance Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "approvals",
      label: "Approvals",
      icon: <CheckCircle className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Approval Queue</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Pending approvals and decision workflows will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: <Shield className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Compliance Status</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Compliance monitoring and regulatory tracking will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "audit",
      label: "Audit Trail",
      icon: <FileText className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Audit logs and compliance history will be displayed here.</p></CardContent>
        </Card>
      ),
    },
    {
      id: "workflows",
      label: "Workflows",
      icon: <Workflow className="h-4 w-4" />,
      content: (
        <Card>
          <CardHeader><CardTitle>Workflow Management</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">Workflow configuration and automation will be displayed here.</p></CardContent>
        </Card>
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title="Governance Workspace"
      description="Governance, compliance, and approval workflows"
      icon={<Shield className="h-6 w-6" />}
      tabs={tabs}
      defaultTab="approvals"
    />
  );
}
