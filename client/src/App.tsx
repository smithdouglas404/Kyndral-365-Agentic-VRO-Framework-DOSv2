import { Component, Suspense, lazy, type ErrorInfo, type ReactNode, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageContextProvider } from "@/contexts/PageContext";
import { CompanyProfileProvider } from "@/contexts/CompanyProfileContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
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

// Redirect helper for legacy URLs → Agent Lens
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(to, { replace: true }); }, [to, setLocation]);
  return <PageLoading />;
}

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const EmailVerificationPage = lazy(() => import("@/pages/EmailVerificationPage"));
const PasswordResetRequestPage = lazy(() => import("@/pages/PasswordResetRequestPage"));
const PasswordResetPage = lazy(() => import("@/pages/PasswordResetPage"));
const DemoRequestPage = lazy(() => import("@/pages/DemoRequestPage"));
const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"));
const InvitationAcceptPage = lazy(() => import("@/pages/InvitationAcceptPage"));
const SystemAdminPage = lazy(() => import("@/pages/SystemAdminPage"));
const SetupWizard = lazy(() => import("@/pages/SetupWizard"));

// New agent-first surface
const AgentLensIndex = lazy(() => import("@/pages/AgentLensIndex"));
const AgentLens = lazy(() => import("@/pages/AgentLens"));
const ClarityChat = lazy(() => import("@/pages/ClarityChat"));
const GraphExplorer = lazy(() => import("@/pages/GraphExplorer"));
const DemoIngestPage = lazy(() => import("@/pages/demo-ingest"));
const ProjectIngestionPage = lazy(() => import("@/pages/ProjectIngestionPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));

// Operational
const AgentCommandCenterPage = lazy(() => import("@/pages/AgentCommandCenterPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const OrchestrationMonitoringPage = lazy(() => import("@/pages/OrchestrationMonitoringPage"));
const DeepAgentMonitoring = lazy(() => import("@/pages/DeepAgentMonitoring"));

// Admin (full kept)
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
const OntologyMappingStudio = lazy(() => import("@/pages/admin/OntologyMappingStudio"));

// Map legacy /dashboard/<slug> URLs to lens agentIds
const LEGACY_DASHBOARD_REDIRECT: Record<string, string> = {
  pmo: 'pmo', tmo: 'tmo', finops: 'finops', okr: 'okr',
  governance: 'governance', planning: 'planning', ocm: 'ocm',
  risk: 'risk', vro: 'vro', integrated: 'integrated', notification: 'notification',
};

function LegacyDashboardRedirect({ params }: { params: { slug?: string } }) {
  const slug = params?.slug;
  const target = (slug && LEGACY_DASHBOARD_REDIRECT[slug]) ? `/lens/${LEGACY_DASHBOARD_REDIRECT[slug]}` : '/lens';
  return <Redirect to={target} />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        {/* Public / auth */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/verify-email/:token" component={EmailVerificationPage} />
        <Route path="/password-reset" component={PasswordResetRequestPage} />
        <Route path="/password-reset/:token" component={PasswordResetPage} />
        <Route path="/demo" component={DemoRequestPage} />
        <Route path="/demo/pending" component={PendingApprovalPage} />
        <Route path="/invite/:token" component={InvitationAcceptPage} />
        <Route path="/system-admin" component={SystemAdminPage} />
        <Route path="/setup" component={SetupWizard} />

        {/* Agent-first surface (the new way) */}
        <Route path="/lens" component={AgentLensIndex} />
        <Route path="/lens/:agentId" component={AgentLens} />
        <Route path="/chat" component={ClarityChat} />
        <Route path="/graph" component={GraphExplorer} />

        {/* Ingestion + project drill-down */}
        <Route path="/demo-ingest" component={DemoIngestPage} />
        <Route path="/ingestion" component={ProjectIngestionPage} />
        <Route path="/project/:id" component={ProjectDetailPage} />

        {/* Operational */}
        <Route path="/command-center" component={AgentCommandCenterPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/monitoring" component={OrchestrationMonitoringPage} />
        <Route path="/deep-agent-monitoring" component={DeepAgentMonitoring} />

        {/* Legacy redirects → agent lens */}
        <Route path="/dashboard"><Redirect to="/lens" /></Route>
        <Route path="/dashboard/:slug" component={LegacyDashboardRedirect} />
        <Route path="/canvas"><Redirect to="/lens" /></Route>
        <Route path="/canvas/:agentId"><Redirect to="/lens" /></Route>
        <Route path="/liquid"><Redirect to="/lens" /></Route>
        <Route path="/ppm"><Redirect to="/lens" /></Route>
        <Route path="/ppm-enterprise"><Redirect to="/lens" /></Route>
        <Route path="/workspace/:slug*"><Redirect to="/lens" /></Route>
        <Route path="/intelligence"><Redirect to="/lens" /></Route>
        <Route path="/cop"><Redirect to="/lens" /></Route>

        {/* Admin */}
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
        <Route path="/admin/mapping-studio" component={OntologyMappingStudio} />
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
          </WebSocketProvider>
        </QueryClientProvider>
      </AppTheme>
    </ErrorBoundary>
  );
}

export default App;
