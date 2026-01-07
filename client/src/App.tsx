import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ValueProposition from "@/pages/value-proposition";
import DivisionPage from "@/pages/DivisionPage";
import ClimatePage from "@/pages/ClimatePage";
import RiskCenter from "@/pages/RiskCenter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/value-proposition" component={ValueProposition} />
      <Route path="/division/:id" component={DivisionPage} />
      <Route path="/climate" component={ClimatePage} />
      <Route path="/risk" component={RiskCenter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
