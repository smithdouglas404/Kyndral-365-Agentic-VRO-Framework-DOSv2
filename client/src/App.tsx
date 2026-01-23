import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/components/SimulationProvider";
import { SimulationProvider as EventSimulationProvider } from "@/contexts/SimulationContext";
import { PageContextProvider } from "@/contexts/PageContext";
import { LiveEventDrawer } from "@/components/LiveEventDrawer";
import { FloatingAlertBanner } from "@/components/FloatingAlertBanner";
import { CrossAgentActivityFeed } from "@/components/CrossAgentActivityFeed";
import { AlertBubble } from "@/components/AlertBubble";
import { AskPMChat } from "@/components/AskPMChat";
import { RealTimeNotifications } from "@/components/RealTimeNotifications";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { useLiveMetrics, useCrossAgentFeed } from "@/hooks/useAgentData";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, X } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ValueProposition from "@/pages/value-proposition";
import SegmentPage from "@/pages/SegmentPage";
import SustainabilityPage from "@/pages/SustainabilityPage";
import RiskCenter from "@/pages/RiskCenter";
import VROFramework from "@/pages/vro-framework";
import TMODashboard from "@/pages/dashboard-tmo";
import FinOpsDashboard from "@/pages/dashboard-finops";
import OKRDashboard from "@/pages/dashboard-okr";
import GovernanceDashboard from "@/pages/dashboard-governance";
import PlanningDashboard from "@/pages/dashboard-planning";
import OCMDashboard from "@/pages/dashboard-ocm";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectIngestionPage from "@/pages/ProjectIngestionPage";
import AgentCommandCenterPage from "@/pages/AgentCommandCenterPage";
import MCPConfigPage from "@/pages/MCPConfigPage";
import SettingsPage from "@/pages/SettingsPage";
import DataQualityPage from "@/pages/DataQualityPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/pmo" component={Dashboard} />
      <Route path="/dashboard/tmo" component={TMODashboard} />
      <Route path="/dashboard/finops" component={FinOpsDashboard} />
      <Route path="/dashboard/okr" component={OKRDashboard} />
      <Route path="/dashboard/governance" component={GovernanceDashboard} />
      <Route path="/dashboard/planning" component={PlanningDashboard} />
      <Route path="/dashboard/ocm" component={OCMDashboard} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalAIOverlay() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('ai-overlay-visible');
    // Default to hidden - user must explicitly open it
    return saved === 'true';
  });
  const messages = useCrossAgentFeed();
  const metrics = useLiveMetrics();
  
  // Check if we should show on this route
  const shouldShowOverlay = location && (
    location === '/dashboard' || 
    location.startsWith('/dashboard/') || 
    location.startsWith('/segment/') ||
    location.startsWith('/division/') ||
    location.startsWith('/project/')
  );
  
  // Handle visibility change - also collapse when hiding
  const handleSetVisible = (visible: boolean) => {
    setIsVisible(visible);
    if (!visible) {
      setIsExpanded(false); // Collapse when hiding
    }
    localStorage.setItem('ai-overlay-visible', String(visible));
  };
  
  const activeAlerts = metrics.activeAlerts;
  const messageCount = messages.length;
  
  // Only show on specified pages
  if (!shouldShowOverlay) {
    return null;
  }

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
        onClick={() => handleSetVisible(true)}
        data-testid="button-show-ai-overlay"
      >
        <Activity size={20} />
        {activeAlerts > 0 && (
          <AlertBubble 
            count={activeAlerts} 
            severity={activeAlerts > 5 ? 'critical' : 'warning'} 
          />
        )}
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" data-testid="global-ai-overlay">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden max-h-[400px] overflow-y-auto"
          >
            <CrossAgentActivityFeed compact={false} maxItems={8} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="button-toggle-ai-feed"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity size={18} />
              {activeAlerts > 0 && (
                <AlertBubble 
                  count={activeAlerts} 
                  severity={activeAlerts > 5 ? 'critical' : 'warning'}
                  className="-top-2 -right-2"
                />
              )}
            </div>
            <div>
              <span className="text-sm font-medium">AI Agent Activity</span>
              <span className="text-xs opacity-80 ml-2">
                {messageCount} messages
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSetVisible(false);
              }}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              data-testid="button-hide-ai-overlay"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        
        {!isExpanded && messageCount > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-white/20"
          >
            <CrossAgentActivityFeed compact={true} maxItems={3} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <SimulationProvider>
          <EventSimulationProvider>
            <PageContextProvider>
              <TooltipProvider>
                <Toaster />
                <RealTimeNotifications />
                <FloatingAlertBanner />
                <LiveEventDrawer />
                <GlobalAIOverlay />
                <AskPMChat />
                <Router />
              </TooltipProvider>
            </PageContextProvider>
          </EventSimulationProvider>
        </SimulationProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
