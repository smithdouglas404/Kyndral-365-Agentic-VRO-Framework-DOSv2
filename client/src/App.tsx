import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageContextProvider } from "@/contexts/PageContext";
import { CompanyProfileProvider } from "@/contexts/CompanyProfileContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { LiquidCanvasProvider } from "@/contexts/LiquidCanvasContext";
import { UnifiedNotificationProvider } from "@/contexts/UnifiedNotificationContext";
import AppTheme from "@/theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[ErrorBoundary]", error, info.componentStack); }
  render() {
    if (this.state.error) {
      return <div style={{padding: 40, fontFamily: 'monospace', color: 'red', whiteSpace: 'pre-wrap'}}>
        <h1>React Error</h1>
        <p>{this.state.error.message}</p>
        <pre>{this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

function PageLoading() {
  return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontFamily:'system-ui'}}>
    <div data-testid="text-loading">Loading...</div>
  </div>;
}

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DemoRequestPage = lazy(() => import("@/pages/DemoRequestPage"));
const DemoIngestPage = lazy(() => import("@/pages/demo-ingest"));
const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"));
const InvitationAcceptPage = lazy(() => import("@/pages/InvitationAcceptPage"));
const SystemAdminPage = lazy(() => import("@/pages/SystemAdminPage"));
const DemoShowcase = lazy(() => import("@/pages/DemoShowcase"));
const SetupWizard = lazy(() => import("@/pages/SetupWizard"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const PortfolioDashboard = lazy(() => import("@/pages/PortfolioDashboard"));
const ARTDashboard = lazy(() => import("@/pages/ARTDashboard"));
const ValueStreamDashboard = lazy(() => import("@/pages/ValueStreamDashboard"));
const MCPDashboard = lazy(() => import("@/pages/MCPDashboard"));
const PredictionHubDashboard = lazy(() => import("@/pages/PredictionHubDashboard"));
const PredictiveAnalytics = lazy(() => import("@/pages/PredictiveAnalytics"));
const ResourceOptimization = lazy(() => import("@/pages/ResourceOptimization"));
const ChangeImpactSimulator = lazy(() => import("@/pages/ChangeImpactSimulator"));
const AgentPerformance = lazy(() => import("@/pages/AgentPerformance"));
const ComplianceAudit = lazy(() => import("@/pages/ComplianceAudit"));
const StakeholderSentiment = lazy(() => import("@/pages/StakeholderSentiment"));
const PortfolioInvestment = lazy(() => import("@/pages/PortfolioInvestment"));
const DependencyHealth = lazy(() => import("@/pages/DependencyHealth"));
const DependencyMapDashboard = lazy(() => import("@/pages/DependencyMapDashboard"));
const DecisionBoardDashboard = lazy(() => import("@/pages/DecisionBoardDashboard"));
const COPDashboard = lazy(() => import("@/pages/COPDashboard"));
const TMODashboard = lazy(() => import("@/pages/dashboard-tmo"));
const FinOpsDashboard = lazy(() => import("@/pages/dashboard-finops"));
const OKRDashboard = lazy(() => import("@/pages/dashboard-okr"));
const GovernanceDashboard = lazy(() => import("@/pages/dashboard-governance"));
const PlanningDashboard = lazy(() => import("@/pages/dashboard-planning"));
const OCMDashboard = lazy(() => import("@/pages/dashboard-ocm"));
const ValueProposition = lazy(() => import("@/pages/value-proposition"));
const SegmentPage = lazy(() => import("@/pages/SegmentPage"));
const SustainabilityPage = lazy(() => import("@/pages/SustainabilityPage"));
const RiskCenter = lazy(() => import("@/pages/RiskCenter"));
const VROFramework = lazy(() => import("@/pages/vro-framework"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const ProjectIngestionPage = lazy(() => import("@/pages/ProjectIngestionPage"));
const AgentCommandCenterPage = lazy(() => import("@/pages/AgentCommandCenterPage"));
const MCPConfigPage = lazy(() => import("@/pages/MCPConfigPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const DataQualityPage = lazy(() => import("@/pages/DataQualityPage"));
const LiquidIntelligencePage = lazy(() => import("@/pages/LiquidIntelligencePage"));
const OrchestrationMonitoringPage = lazy(() => import("@/pages/OrchestrationMonitoringPage"));
const DeepAgentMonitoring = lazy(() => import("@/pages/DeepAgentMonitoring"));
const IssueManagement = lazy(() => import("@/pages/IssueManagement"));
const ChangeRequestManagement = lazy(() => import("@/pages/ChangeRequestManagement"));
const ResourceManagementPage = lazy(() => import("@/pages/ResourceManagement"));
const FinancialManagement = lazy(() => import("@/pages/FinancialManagement"));
const DocumentManagement = lazy(() => import("@/pages/DocumentManagement"));
const ProgramManagement = lazy(() => import("@/pages/ProgramManagement"));
const ReportingAnalytics = lazy(() => import("@/pages/ReportingAnalytics"));
const RiskManagement = lazy(() => import("@/pages/RiskManagement"));
const CollaborationHub = lazy(() => import("@/pages/CollaborationHub"));
const AgentCollaboration = lazy(() => import("@/pages/AgentCollaboration"));
const AdvancedAnalytics = lazy(() => import("@/pages/AdvancedAnalytics"));
const AdvancedFinancialManagement = lazy(() => import("@/pages/AdvancedFinancialManagement"));
const CustomReportBuilder = lazy(() => import("@/pages/CustomReportBuilder"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const EmailVerificationPage = lazy(() => import("@/pages/EmailVerificationPage"));
const PasswordResetRequestPage = lazy(() => import("@/pages/PasswordResetRequestPage"));
const PasswordResetPage = lazy(() => import("@/pages/PasswordResetPage"));
const DemoPage = lazy(() => import("@/pages/DemoPage"));
const PPMDashboard = lazy(() => import("@/pages/PPMDashboard"));
const PPMExecutiveDashboard = lazy(() => import("@/pages/PPMExecutiveDashboard"));
const PPMEnterprise = lazy(() => import("@/pages/PPMEnterprise"));
const SharedDashboard = lazy(() => import("@/pages/SharedDashboard"));
const MyShares = lazy(() => import("@/pages/MyShares"));
const FeatureDetailPage = lazy(() => import("@/pages/FeatureDetailPage"));
const StoryDetailPage = lazy(() => import("@/pages/StoryDetailPage"));
const TaskBoardPage = lazy(() => import("@/pages/TaskBoardPage"));

const LiquidWorkspace = lazy(() => import("@/pages/LiquidWorkspace"));

const ExecutiveWorkspace = lazy(() => import("@/pages/workspaces/ExecutiveWorkspace"));
const PMWorkspace = lazy(() => import("@/pages/workspaces/PMWorkspace"));
const FinOpsWorkspace = lazy(() => import("@/pages/workspaces/FinOpsWorkspace"));
const TMOWorkspace = lazy(() => import("@/pages/workspaces/TMOWorkspace"));
const PlanningWorkspace = lazy(() => import("@/pages/workspaces/PlanningWorkspace"));
const GovernanceWorkspace = lazy(() => import("@/pages/workspaces/GovernanceWorkspace"));
const OCMWorkspace = lazy(() => import("@/pages/workspaces/OCMWorkspace"));
const AdminWorkspace = lazy(() => import("@/pages/workspaces/AdminWorkspace"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const SystemConfiguration = lazy(() => import("@/pages/admin/SystemConfiguration"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const IntegrationManagement = lazy(() => import("@/pages/admin/IntegrationManagement"));
const SystemSettings = lazy(() => import("@/pages/admin/SystemSettings"));
const AgentConfiguration = lazy(() => import("@/pages/admin/AgentConfiguration"));
const CustomFieldManagement = lazy(() => import("@/pages/admin/CustomFieldManagement"));
const WorkflowBuilder = lazy(() => import("@/pages/admin/WorkflowBuilder"));
const MCPMarketplace = lazy(() => import("@/pages/admin/MCPMarketplace"));
const ActiveIntegrations = lazy(() => import("@/pages/admin/ActiveIntegrations"));
const DatabaseManagement = lazy(() => import("@/pages/admin/DatabaseManagement"));
const AgentRules = lazy(() => import("@/pages/admin/AgentRules"));
const AgentManagement = lazy(() => import("@/pages/admin/AgentManagement"));
const OKRManagement = lazy(() => import("@/pages/admin/OKRManagement"));
const UserPermissions = lazy(() => import("@/pages/admin/UserPermissions"));
const CamundaRulesEngine = lazy(() => import("@/pages/admin/CamundaRulesEngine"));
const KnowledgeBaseManagement = lazy(() => import("@/pages/admin/KnowledgeBaseManagement"));
const RuleExecutionHistory = lazy(() => import("@/pages/admin/RuleExecutionHistory"));
const AgentCollaborationMatrix = lazy(() => import("@/pages/admin/AgentCollaborationMatrix"));
const CustomAttributes = lazy(() => import("@/pages/admin/CustomAttributes"));
const PolicyAsCode = lazy(() => import("@/pages/admin/PolicyAsCode"));
const AgentMemoryViewer = lazy(() => import("@/pages/admin/AgentMemoryViewer"));
const VoiceBriefings = lazy(() => import("@/pages/admin/VoiceBriefings"));
const AgentAttributeAdmin = lazy(() => import("@/pages/admin/AgentAttributeAdmin"));
const CompanyProfile = lazy(() => import("@/pages/admin/CompanyProfile"));
const ApprovalCenter = lazy(() => import("@/pages/admin/ApprovalCenter"));
const ApprovalRequests = lazy(() => import("@/pages/admin/ApprovalRequests"));
const AgentMCPManager = lazy(() => import("@/pages/admin/AgentMCPManager"));
const PalantirSyncManager = lazy(() => import("@/pages/admin/PalantirSyncManager"));
const HITLApprovalCenter = lazy(() => import("@/pages/admin/HITLApprovalCenter"));
const PalantirRulesEngine = lazy(() => import("@/pages/admin/PalantirRulesEngine"));
const OntologyExplorer = lazy(() => import("@/pages/admin/OntologyExplorer"));
const RealTimeSubscriptions = lazy(() => import("@/pages/admin/RealTimeSubscriptions"));
const WorkflowAutomation = lazy(() => import("@/pages/admin/WorkflowAutomation"));
const DynamicAgentAdmin = lazy(() => import("@/pages/admin/DynamicAgentAdmin"));

function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/demo" component={DemoRequestPage} />
        <Route path="/demo-ingest" component={DemoIngestPage} />
        <Route path="/demo/pending" component={PendingApprovalPage} />
        <Route path="/invite/:token" component={InvitationAcceptPage} />
        <Route path="/system-admin" component={SystemAdminPage} />
        <Route path="/demo/showcase" component={DemoShowcase} />
        <Route path="/setup" component={SetupWizard} />

        <Route path="/workspace/executive" component={ExecutiveWorkspace} />
        <Route path="/workspace/pm" component={PMWorkspace} />
        <Route path="/workspace/finops" component={FinOpsWorkspace} />
        <Route path="/workspace/tmo" component={TMOWorkspace} />
        <Route path="/workspace/planning" component={PlanningWorkspace} />
        <Route path="/workspace/governance" component={GovernanceWorkspace} />
        <Route path="/workspace/ocm" component={OCMWorkspace} />
        <Route path="/workspace/admin" component={AdminWorkspace} />

        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/pmo" component={Dashboard} />
        <Route path="/dashboard/portfolio" component={PortfolioDashboard} />
        <Route path="/dashboard/art" component={ARTDashboard} />
        <Route path="/dashboard/value-stream" component={ValueStreamDashboard} />
        <Route path="/dashboard/mcp" component={MCPDashboard} />
        <Route path="/dashboard/predictions" component={PredictionHubDashboard} />
        <Route path="/dashboard/predictive-analytics" component={PredictiveAnalytics} />
        <Route path="/dashboard/resource-optimization" component={ResourceOptimization} />
        <Route path="/dashboard/impact-simulator" component={ChangeImpactSimulator} />
        <Route path="/dashboard/agent-performance" component={AgentPerformance} />
        <Route path="/dashboard/compliance-audit" component={ComplianceAudit} />
        <Route path="/dashboard/stakeholder-sentiment" component={StakeholderSentiment} />
        <Route path="/dashboard/portfolio-investment" component={PortfolioInvestment} />
        <Route path="/dashboard/dependency-health" component={DependencyHealth} />
        <Route path="/dashboard/dependencies" component={DependencyMapDashboard} />
        <Route path="/dashboard/decisions" component={DecisionBoardDashboard} />
        <Route path="/cop" component={COPDashboard} />
        <Route path="/dashboard/tmo" component={TMODashboard} />
        <Route path="/dashboard/finops" component={FinOpsDashboard} />
        <Route path="/dashboard/okr" component={OKRDashboard} />
        <Route path="/dashboard/governance" component={GovernanceDashboard} />
        <Route path="/dashboard/planning" component={PlanningDashboard} />
        <Route path="/dashboard/ocm" component={OCMDashboard} />
        <Route path="/dashboard/ppm" component={PPMDashboard} />
        <Route path="/ppm" component={PPMExecutiveDashboard} />
        <Route path="/ppm-enterprise" component={PPMEnterprise} />
        <Route path="/liquid" component={LiquidWorkspace} />
        <Route path="/canvas" component={LiquidWorkspace} />
        <Route path="/canvas/:agentId" component={LiquidWorkspace} />
        <Route path="/ppm-old" component={PPMDashboard} />
        <Route path="/shared/:token" component={SharedDashboard} />
        <Route path="/my-shares" component={MyShares} />
        <Route path="/feature/:id" component={FeatureDetailPage} />
        <Route path="/story/:id" component={StoryDetailPage} />
        <Route path="/tasks" component={TaskBoardPage} />
        <Route path="/value-proposition" component={ValueProposition} />
        <Route path="/segment/:id" component={SegmentPage} />
        <Route path="/division/:id" component={SegmentPage} />
        <Route path="/sustainability" component={SustainabilityPage} />
        <Route path="/risk" component={RiskCenter} />
        <Route path="/vro-framework" component={VROFramework} />
        <Route path="/project/:id" component={ProjectDetailPage} />
        <Route path="/ingestion" component={ProjectIngestionPage} />
        <Route path="/command-center" component={AgentCommandCenterPage} />
        <Route path="/mcp-config" component={MCPConfigPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/data-quality" component={DataQualityPage} />
        <Route path="/intelligence" component={LiquidIntelligencePage} />
        <Route path="/monitoring" component={OrchestrationMonitoringPage} />
        <Route path="/deep-agent-monitoring" component={DeepAgentMonitoring} />
        <Route path="/issues" component={IssueManagement} />
        <Route path="/change-requests" component={ChangeRequestManagement} />
        <Route path="/resources" component={ResourceManagementPage} />
        <Route path="/financial" component={FinancialManagement} />
        <Route path="/documents" component={DocumentManagement} />
        <Route path="/programs" component={ProgramManagement} />
        <Route path="/reports" component={ReportingAnalytics} />
        <Route path="/risks" component={RiskManagement} />
        <Route path="/collaboration" component={CollaborationHub} />
        <Route path="/agent-collaboration" component={AgentCollaboration} />
        <Route path="/analytics" component={AdvancedAnalytics} />
        <Route path="/financial-advanced" component={AdvancedFinancialManagement} />
        <Route path="/report-builder" component={CustomReportBuilder} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/verify-email/:token" component={EmailVerificationPage} />
        <Route path="/password-reset" component={PasswordResetRequestPage} />
        <Route path="/password-reset/:token" component={PasswordResetPage} />

        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/company-profile" component={CompanyProfile} />
        <Route path="/admin/approval-center" component={ApprovalCenter} />
        <Route path="/admin/hitl" component={HITLApprovalCenter} />
        <Route path="/admin/approval-requests" component={ApprovalRequests} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/admin/integrations" component={IntegrationManagement} />
        <Route path="/admin/settings" component={SystemSettings} />
        <Route path="/admin/agents" component={AgentConfiguration} />
        <Route path="/admin/agent-management" component={AgentManagement} />
        <Route path="/admin/system-config" component={SystemConfiguration} />
        <Route path="/admin/custom-fields" component={CustomFieldManagement} />
        <Route path="/admin/workflows" component={WorkflowBuilder} />
        <Route path="/admin/mcp-marketplace" component={MCPMarketplace} />
        <Route path="/admin/active-integrations" component={ActiveIntegrations} />
        <Route path="/admin/database-management" component={DatabaseManagement} />
        <Route path="/admin/rules" component={AgentRules} />
        <Route path="/admin/okrs" component={OKRManagement} />
        <Route path="/admin/permissions" component={UserPermissions} />
        <Route path="/admin/rules-engine" component={CamundaRulesEngine} />
        <Route path="/admin/knowledge-base" component={KnowledgeBaseManagement} />
        <Route path="/admin/rule-execution-history" component={RuleExecutionHistory} />
        <Route path="/admin/agent-collaboration-matrix" component={AgentCollaborationMatrix} />
        <Route path="/admin/custom-attributes" component={CustomAttributes} />
        <Route path="/admin/policies" component={PolicyAsCode} />
        <Route path="/admin/agent-memory" component={AgentMemoryViewer} />
        <Route path="/admin/agent-attributes" component={AgentAttributeAdmin} />
        <Route path="/admin/voice-briefings" component={VoiceBriefings} />
        <Route path="/admin/agent-mcp" component={AgentMCPManager} />
        <Route path="/admin/palantir-sync" component={PalantirSyncManager} />
        <Route path="/admin/palantir-rules" component={PalantirRulesEngine} />
        <Route path="/admin/ontology-explorer" component={OntologyExplorer} />
        <Route path="/admin/subscriptions" component={RealTimeSubscriptions} />
        <Route path="/admin/workflow-automation" component={WorkflowAutomation} />
        <Route path="/admin/dynamic-agents" component={DynamicAgentAdmin} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <QueryClientProvider client={queryClient}>
          <WebSocketProvider>
            <LiquidCanvasProvider>
            <CompanyProfileProvider>
              <UnifiedNotificationProvider>
                <PageContextProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Router />
                  </TooltipProvider>
                </PageContextProvider>
              </UnifiedNotificationProvider>
            </CompanyProfileProvider>
            </LiquidCanvasProvider>
          </WebSocketProvider>
        </QueryClientProvider>
      </AppTheme>
    </ErrorBoundary>
  );
}

export default App;
