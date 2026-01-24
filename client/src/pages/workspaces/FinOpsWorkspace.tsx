import { useEffect } from "react";
import { WorkspaceLayout, WorkspaceTab } from "@/components/WorkspaceLayout";
import { WorkspacePageLayout } from "@/components/WorkspacePageLayout";
import { usePageContext } from "@/contexts/PageContext";
import { DollarSign, TrendingUp, PieChart, Target, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder tab content components
function BudgetTrackingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Budget allocation and tracking will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function ForecastsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecasts</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Financial forecasting and projections will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function CostOptimizationTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Optimization</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Cost savings opportunities and optimization insights will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function ROIAnalysisTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ROI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Return on investment analysis and value realization will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

function ReportsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Financial reports and analytics will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}

export default function FinOpsWorkspace() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'other',
      pageTitle: 'FinOps Workspace',
    });
  }, [setPageContext]);

  const tabs: WorkspaceTab[] = [
    {
      id: "budget",
      label: "Budget Tracking",
      icon: <DollarSign className="h-4 w-4" />,
      content: <BudgetTrackingTab />,
    },
    {
      id: "forecasts",
      label: "Forecasts",
      icon: <TrendingUp className="h-4 w-4" />,
      content: <ForecastsTab />,
    },
    {
      id: "optimization",
      label: "Cost Optimization",
      icon: <PieChart className="h-4 w-4" />,
      content: <CostOptimizationTab />,
    },
    {
      id: "roi",
      label: "ROI Analysis",
      icon: <Target className="h-4 w-4" />,
      content: <ROIAnalysisTab />,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText className="h-4 w-4" />,
      content: <ReportsTab />,
    },
  ];

  return (
    <WorkspacePageLayout>
      <WorkspaceLayout
        title="FinOps Workspace"
        description="Financial operations, budget tracking, and cost optimization"
        icon={<DollarSign className="h-6 w-6" />}
        tabs={tabs}
        defaultTab="budget"
      />
    </WorkspacePageLayout>
  );
}
