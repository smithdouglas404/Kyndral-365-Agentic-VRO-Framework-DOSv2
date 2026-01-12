import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Building2, 
  Briefcase, 
  PieChart, 
  Sparkles, 
  Brain, 
  Zap, 
  Target,
  GitBranch,
  Compass
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

type DataMode = "VRO" | "PMO";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  modes: ("VRO" | "PMO")[] | "all";
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 size={18} />, modes: "all" },
  { id: "portfolios", label: "Portfolios", icon: <Building2 size={18} />, modes: "all" },
  { id: "business-cases", label: "Business Cases", icon: <Briefcase size={18} />, modes: "all" },
  { id: "kpi-tracking", label: "KPIs", icon: <PieChart size={18} />, modes: "all" },
  { id: "ai-recommendations", label: "AI Actions", icon: <Sparkles size={18} />, modes: "all" },
  { id: "ai-insights", label: "AI Insights", icon: <Brain size={18} />, modes: "all" },
  { id: "lifecycle", label: "Lifecycle", icon: <Zap size={18} />, modes: ["VRO"] },
  { id: "performance", label: "Performance", icon: <Target size={18} />, modes: ["VRO"] },
  { id: "workspace", label: "Co-Pilot", icon: <Compass size={18} />, modes: ["PMO"] },
];

interface DashboardSectionSidebarProps {
  dataMode: DataMode;
  onModeChange: (mode: DataMode) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardSectionSidebar({ 
  dataMode, 
  onModeChange, 
  activeTab, 
  onTabChange 
}: DashboardSectionSidebarProps) {
  const filteredItems = navItems.filter(item => 
    item.modes === "all" || item.modes.includes(dataMode)
  );

  const coreItems = filteredItems.filter(item => item.modes === "all");
  const modeSpecificItems = filteredItems.filter(item => item.modes !== "all");

  return (
    <div className="w-64 min-h-screen bg-slate-50 border-r border-slate-200 flex-shrink-0">
      <div className="sticky top-0 p-4 space-y-6">
        <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
          <span className={cn(
            "text-sm font-semibold transition-colors",
            dataMode === "VRO" ? "text-teal-600" : "text-slate-400"
          )}>
            VRO
          </span>
          <Switch
            checked={dataMode === "PMO"}
            onCheckedChange={(checked) => onModeChange(checked ? "PMO" : "VRO")}
            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-teal-600"
            data-testid="switch-mode-toggle"
          />
          <span className={cn(
            "text-sm font-semibold transition-colors",
            dataMode === "PMO" ? "text-purple-600" : "text-slate-400"
          )}>
            PMO
          </span>
        </div>

        <nav className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
          {coreItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === item.id
                  ? "bg-[#005EB8] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              data-testid={`nav-${item.id}`}
            >
              <span className={cn(
                "transition-colors",
                activeTab === item.id ? "text-white" : "text-slate-500"
              )}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {modeSpecificItems.length > 0 && (
          <nav className="space-y-1 pt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-2">
              {dataMode === "VRO" ? "VRO Tools" : "PMO Tools"}
            </p>
            {modeSpecificItems.map((item) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === item.id
                    ? dataMode === "VRO" 
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-purple-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                data-testid={`nav-${item.id}`}
              >
                <span className={cn(
                  "transition-colors",
                  activeTab === item.id ? "text-white" : "text-slate-500"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </motion.button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
