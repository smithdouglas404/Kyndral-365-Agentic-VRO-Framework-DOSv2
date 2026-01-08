import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { LiveEventDrawer } from "@/components/LiveEventDrawer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ValueProposition from "@/pages/value-proposition";
import DivisionPage from "@/pages/DivisionPage";
import ClimatePage from "@/pages/ClimatePage";
import RiskCenter from "@/pages/RiskCenter";
import PolicyGenerator from "@/pages/policy-generator";
import VROFramework from "@/pages/vro-framework";
import TMODashboard from "@/pages/dashboard-tmo";
import FinOpsDashboard from "@/pages/dashboard-finops";
import OKRDashboard from "@/pages/dashboard-okr";
import GovernanceDashboard from "@/pages/dashboard-governance";
import PlanningDashboard from "@/pages/dashboard-planning";
import OCMDashboard from "@/pages/dashboard-ocm";

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
      <Route path="/division/:id" component={DivisionPage} />
      <Route path="/climate" component={ClimatePage} />
      <Route path="/risk" component={RiskCenter} />
      <Route path="/policy-generator" component={PolicyGenerator} />
      <Route path="/vro-framework" component={VROFramework} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        <TooltipProvider>
          <Toaster />
          <LiveEventDrawer />
          <Router />
        </TooltipProvider>
      </SimulationProvider>
    </QueryClientProvider>
  );
}

export default App;
