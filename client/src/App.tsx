import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { LiveEventDrawer } from "@/components/LiveEventDrawer";
import { FloatingAlertBanner } from "@/components/FloatingAlertBanner";
import { AlertsFlyout } from "@/components/AlertsFlyout";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ValueProposition from "@/pages/value-proposition";
import DivisionPage from "@/pages/DivisionPage";
import ClimatePage from "@/pages/ClimatePage";
import RiskCenter from "@/pages/RiskCenter";
import PolicyGenerator from "@/pages/policy-generator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/value-proposition" component={ValueProposition} />
      <Route path="/division/:id" component={DivisionPage} />
      <Route path="/climate" component={ClimatePage} />
      <Route path="/risk" component={RiskCenter} />
      <Route path="/policy-generator" component={PolicyGenerator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [alertsFlyoutOpen, setAlertsFlyoutOpen] = useState(false);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        <TooltipProvider>
          <Toaster />
          <FloatingAlertBanner onOpenFlyout={() => setAlertsFlyoutOpen(true)} />
          <AlertsFlyout isOpen={alertsFlyoutOpen} onClose={() => setAlertsFlyoutOpen(false)} />
          <LiveEventDrawer />
          <Router />
        </TooltipProvider>
      </SimulationProvider>
    </QueryClientProvider>
  );
}

export default App;
