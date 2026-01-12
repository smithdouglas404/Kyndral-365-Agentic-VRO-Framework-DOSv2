import { Link, useLocation } from 'wouter';
import { 
  Repeat, Calculator, Target, 
  Shield, Calendar, Users, Sparkles, ChevronRight,
  BarChart3, Building2, Briefcase, PieChart, Upload, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllAgentsSummary } from '@/hooks/useAgentData';
import { AgentType } from '@/lib/dataHub';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

// Core navigation items
const coreNavItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "portfolios", label: "Portfolios", icon: Building2 },
  { id: "business-cases", label: "Business Cases", icon: Briefcase },
  { id: "kpi-tracking", label: "KPIs", icon: PieChart },
  { id: "agent-command", label: "Agent Command", icon: Bot },
  { id: "ingestion", label: "Project Ingestion", icon: Upload },
];


interface Agent {
  id: AgentType | 'policy';
  name: string;
  shortName: string;
  icon: React.ElementType;
  href: string;
  color: string;
  description: string;
}

const agents: Agent[] = [
  {
    id: 'integrated-management',
    name: 'Integrated Management',
    shortName: 'IMA',
    icon: Sparkles,
    href: '/dashboard',
    color: 'bg-gradient-to-r from-teal-500 to-blue-500',
    description: 'Unified Value & Delivery'
  },
  {
    id: 'tmo',
    name: 'Transformation',
    shortName: 'TMO',
    icon: Repeat,
    href: '/dashboard/tmo',
    color: 'bg-teal-500',
    description: 'Change & adoption'
  },
  {
    id: 'finops',
    name: 'FinOps',
    shortName: 'FIN',
    icon: Calculator,
    href: '/dashboard/finops',
    color: 'bg-green-500',
    description: 'Cost optimization'
  },
  {
    id: 'okr',
    name: 'OKR Mapping',
    shortName: 'OKR',
    icon: Target,
    href: '/dashboard/okr',
    color: 'bg-orange-500',
    description: 'Objectives & key results'
  },
  {
    id: 'governance',
    name: 'Governance',
    shortName: 'GOV',
    icon: Shield,
    href: '/dashboard/governance',
    color: 'bg-red-500',
    description: 'Compliance & controls'
  },
  {
    id: 'planning',
    name: 'Planning',
    shortName: 'PLN',
    icon: Calendar,
    href: '/dashboard/planning',
    color: 'bg-indigo-500',
    description: 'Roadmap & milestones'
  },
  {
    id: 'ocm',
    name: 'OCM',
    shortName: 'OCM',
    icon: Users,
    href: '/dashboard/ocm',
    color: 'bg-pink-500',
    description: 'Organizational change'
  }
];

interface AgentSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  collapsed?: boolean;
}

export function AgentSidebar({ activeTab = "overview", onTabChange = () => {}, collapsed = false }: AgentSidebarProps) {
  const [location, setLocation] = useLocation();
  const agentSummary = useAllAgentsSummary();
  
  // Check if we're on the main dashboard
  const isOnDashboard = location === '/dashboard' || location === '/';

  const isActive = (href: string) => {
    if (href === '/dashboard' && location === '/dashboard') return true;
    if (href !== '/dashboard' && location.startsWith(href)) return true;
    return false;
  };

  const getAgentMetrics = (agentId: string) => {
    if (agentId === 'policy') return null;
    const metrics = agentSummary[agentId as AgentType];
    return metrics;
  };

  const handleNavClick = (itemId: string) => {
    if (itemId === 'ingestion') {
      setLocation('/ingestion');
      return;
    }
    if (itemId === 'agent-command') {
      setLocation('/command-center');
      return;
    }
    if (!isOnDashboard) {
      setLocation('/dashboard');
    }
    onTabChange(itemId);
  };

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isItemActive = activeTab === item.id && isOnDashboard;
    const activeClass = "bg-[#005EB8] text-white";
    
    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={cn(
          "w-full px-3 py-2 rounded-lg cursor-pointer transition-all text-left flex items-center gap-3",
          isItemActive ? activeClass : "hover:bg-gray-100 text-gray-700"
        )}
        data-testid={`nav-${item.id}`}
      >
        <Icon className={cn("h-4 w-4", isItemActive ? "text-white" : "text-gray-500")} />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-64px)] sticky top-16 transition-all",
      collapsed ? "w-16" : "w-64"
    )}>
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Core Sections */}
        {!collapsed && (
          <div className="px-3 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sections</span>
          </div>
        )}
        <div className="px-2 space-y-1">
          {coreNavItems.map((item) => renderNavButton(item))}
        </div>

        
        {/* AI Agents Section */}
        {!collapsed && (
          <div className="px-3 mt-4 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Agents</span>
          </div>
        )}
        {agents.map((agent) => {
          const Icon = agent.icon;
          const active = isActive(agent.href);
          const metrics = getAgentMetrics(agent.id);
          
          return (
            <Link key={agent.id} href={agent.href}>
              <div
                className={cn(
                  "mx-2 mb-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative",
                  active 
                    ? "bg-[#005EB8] text-white" 
                    : "hover:bg-gray-100 text-gray-700"
                )}
                data-testid={`sidebar-agent-${agent.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-md relative",
                    active ? "bg-white/20" : agent.color
                  )}>
                    <Icon className={cn("h-4 w-4", active ? "text-white" : "text-white")} />
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{agent.name}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        )}>
                          {agent.shortName}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        active ? "text-white/70" : "text-gray-500"
                      )}>
                        {agent.description}
                      </p>
                    </div>
                  )}
                  {!collapsed && (
                    <ChevronRight className={cn(
                      "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                      active ? "text-white" : "text-gray-400"
                    )} />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <Link href="/vro-framework">
          <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 cursor-pointer hover:shadow-sm transition-all" data-testid="sidebar-framework-link">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              {!collapsed && (
                <span className="text-xs font-medium text-purple-700">VRO Framework</span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
