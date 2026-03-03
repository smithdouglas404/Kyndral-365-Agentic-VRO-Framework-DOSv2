import { Link, useLocation } from 'wouter';
import {
  TrendingUp, FolderKanban, DollarSign, RefreshCw,
  Calendar, Shield, Users, Settings, Bot, Activity, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleBasedAccess, UserRole } from '@/hooks/useRoleBasedAccess';
import { useCompanyName, useCompanyProfile } from '@/contexts/CompanyProfileContext';

interface WorkspaceNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  roles: UserRole[]; // Which roles can see this workspace
}

const workspaces: WorkspaceNavItem[] = [
  {
    id: 'executive',
    label: 'Executive',
    icon: TrendingUp,
    href: '/workspace/executive',
    color: 'bg-blue-500',
    roles: ['executive', 'vro', 'pm', 'tmo', 'finops', 'risk', 'governance', 'ocm'],
  },
  {
    id: 'pm',
    label: 'Projects',
    icon: FolderKanban,
    href: '/workspace/pm',
    color: 'bg-green-500',
    roles: ['pm', 'vro', 'risk'],
  },
  {
    id: 'finops',
    label: 'Finance',
    icon: DollarSign,
    href: '/workspace/finops',
    color: 'bg-purple-500',
    roles: ['finops'],
  },
  {
    id: 'tmo',
    label: 'Transformation',
    icon: RefreshCw,
    href: '/workspace/tmo',
    color: 'bg-teal-500',
    roles: ['tmo', 'ocm'],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: Calendar,
    href: '/workspace/planning',
    color: 'bg-indigo-500',
    roles: ['tmo'],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: Shield,
    href: '/workspace/governance',
    color: 'bg-red-500',
    roles: ['governance', 'risk'],
  },
  {
    id: 'ocm',
    label: 'Change Mgmt',
    icon: Users,
    href: '/workspace/ocm',
    color: 'bg-pink-500',
    roles: ['ocm'],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    href: '/workspace/admin',
    color: 'bg-gray-500',
    roles: ['system_admin', 'governance'],
  },
];

interface WorkspaceSidebarProps {
  userRole?: string;
}

export function WorkspaceSidebar({ userRole = 'pm' }: WorkspaceSidebarProps) {
  const [location] = useLocation();
  const { role, canAccessPage } = useRoleBasedAccess(userRole);
  const companyName = useCompanyName();
  const { isDemoMode } = useCompanyProfile();

  // Filter workspaces based on user role
  const visibleWorkspaces = workspaces.filter(workspace =>
    workspace.roles.includes(role) || role === 'executive' || role === 'system_admin'
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo / Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm leading-tight block">{companyName}</span>
              {isDemoMode && (
                <span className="text-xs text-orange-600 font-medium">Demo</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Workspaces Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Workspaces
          </div>
          <ul className="space-y-1">
            {visibleWorkspaces.map((workspace) => {
              const Icon = workspace.icon;
              const isActive = location === workspace.href || location.startsWith(workspace.href + '/');
              const hasAccess = canAccessPage(workspace.href);

              if (!hasAccess) return null;

              return (
                <li key={workspace.id}>
                  <Link href={workspace.href}>
                    <a
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg",
                          isActive ? workspace.color : "bg-gray-100"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-600")} />
                      </div>
                      <span>{workspace.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Actions Section */}
        <div className="px-3 mt-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Quick Actions
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/agent-collaboration">
                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <span>Agent Network</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/command-center">
                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <span>AI Command</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Profile / Settings */}
      <div className="border-t border-gray-200 p-4">
        <Link href="/settings">
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
        </Link>
      </div>
    </aside>
  );
}
