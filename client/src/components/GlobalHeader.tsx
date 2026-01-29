import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, Activity, User, Settings, LogOut, Menu, LayoutDashboard } from 'lucide-react';
import { GlobalNotificationBell } from './GlobalNotificationBell';
import { ConnectionIndicator } from './RealTimeNotifications';
import { useUnifiedNotifications } from '@/contexts/UnifiedNotificationContext';
import { useCompanyProfile } from '@/contexts/CompanyProfileContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { responsive, touchFriendly } from '@/lib/mobileResponsive';

/**
 * GLOBAL HEADER COMPONENT
 *
 * Unified header for all pages with:
 * - Workspace switcher
 * - GlobalNotificationBell
 * - Agent activity indicator
 * - User menu
 * - Connection status
 *
 * Usage:
 * <GlobalHeader title="Dashboard" />
 */

interface GlobalHeaderProps {
  title?: string;
  subtitle?: string;
  showWorkspaceSwitcher?: boolean;
  className?: string;
}

const WORKSPACES = [
  { id: 'executive', label: 'Executive', path: '/workspace/executive', icon: '📊' },
  { id: 'pm', label: 'Project Management', path: '/workspace/pm', icon: '📋' },
  { id: 'finops', label: 'FinOps', path: '/workspace/finops', icon: '💰' },
  { id: 'tmo', label: 'Timeline Management', path: '/workspace/tmo', icon: '⏱️' },
  { id: 'planning', label: 'Planning', path: '/workspace/planning', icon: '🎯' },
  { id: 'governance', label: 'Governance', path: '/workspace/governance', icon: '⚖️' },
  { id: 'ocm', label: 'Change Management', path: '/workspace/ocm', icon: '🔄' },
  { id: 'admin', label: 'Administration', path: '/workspace/admin', icon: '⚙️' },
];

const DASHBOARD_SHORTCUTS = [
  { id: 'portfolio', label: 'Portfolio Dashboard', path: '/dashboard/portfolio' },
  { id: 'art', label: 'ART Dashboard', path: '/dashboard/art' },
  { id: 'value-stream', label: 'Value Stream Dashboard', path: '/dashboard/value-stream' },
  { id: 'prediction', label: 'Prediction Hub', path: '/dashboard/predictions' },
  { id: 'dependency', label: 'Dependency Map', path: '/dashboard/dependencies' },
  { id: 'decision', label: 'Decision Board', path: '/dashboard/decisions' },
  { id: 'mcp', label: 'MCP Management', path: '/dashboard/mcp' },
];

const LEGACY_ROUTES = [
  { path: '/dashboard', workspace: 'pm' },
  { path: '/dashboard/finops', workspace: 'finops' },
  { path: '/dashboard/tmo', workspace: 'tmo' },
  { path: '/dashboard/planning', workspace: 'planning' },
  { path: '/dashboard/governance', workspace: 'governance' },
  { path: '/dashboard/ocm', workspace: 'ocm' },
];

export function GlobalHeader({
  title,
  subtitle,
  showWorkspaceSwitcher = true,
  className,
}: GlobalHeaderProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasActiveCompany } = useCompanyProfile();
  const { notifications, criticalCount } = useUnifiedNotifications();

  // Detect current workspace from URL
  const currentWorkspace = WORKSPACES.find(w => location.startsWith(w.path)) ||
    LEGACY_ROUTES.find(r => location.startsWith(r.path))?.workspace;

  const currentWorkspaceData = WORKSPACES.find(w => w.id === currentWorkspace);

  // Count active agent activities (last 5 minutes) - only if setup is complete
  const recentActivities = hasActiveCompany ? notifications.filter(n => {
    const age = Date.now() - n.timestamp.getTime();
    return age < 5 * 60 * 1000; // 5 minutes
  }).length : 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className={cn('container flex h-16 items-center justify-between', responsive.padding.page)}>
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <a className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                EP
              </div>
              <span className="hidden sm:inline-block font-semibold text-lg">
                Enterprise PMO
              </span>
            </a>
          </Link>

          {title && (
            <>
              <div className="h-6 w-px bg-border hidden md:block" />
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: Workspace Switcher */}
        {showWorkspaceSwitcher && (
          <div className="hidden lg:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="text-base">{currentWorkspaceData?.icon || '📊'}</span>
                  <span className="hidden xl:inline">
                    {currentWorkspaceData?.label || 'Workspaces'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WORKSPACES.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => navigate(workspace.path)}
                    className={cn(
                      'cursor-pointer',
                      currentWorkspace === workspace.id && 'bg-accent'
                    )}
                  >
                    <span className="mr-2 text-base">{workspace.icon}</span>
                    <span>{workspace.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden xl:inline">Dashboards</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Dashboards</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DASHBOARD_SHORTCUTS.map((dashboard) => (
                  <DropdownMenuItem
                    key={dashboard.id}
                    onClick={() => navigate(dashboard.path)}
                    className={cn(
                      'cursor-pointer',
                      location.startsWith(dashboard.path) && 'bg-accent'
                    )}
                  >
                    <span>{dashboard.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Agent Activity Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-xs text-slate-600">
                {recentActivities > 0 ? (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {recentActivities}
                  </Badge>
                ) : (
                  'Monitoring'
                )}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <ConnectionIndicator />
          </div>

          {/* Notification Bell - Touch-friendly on mobile */}
          <GlobalNotificationBell className={touchFriendly.button} />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
                {criticalCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/login')} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Workspace Menu */}
      {mobileMenuOpen && showWorkspaceSwitcher && (
        <div className="lg:hidden border-t bg-background p-4">
          <div className="space-y-4">
            <p className="text-sm font-medium mb-2">Workspaces</p>
            {WORKSPACES.map((workspace) => (
              <Button
                key={workspace.id}
                variant={currentWorkspace === workspace.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  navigate(workspace.path);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="mr-2">{workspace.icon}</span>
                <span>{workspace.label}</span>
              </Button>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium mb-2">Dashboards</p>
            {DASHBOARD_SHORTCUTS.map((dashboard) => (
              <Button
                key={dashboard.id}
                variant={location.startsWith(dashboard.path) ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  navigate(dashboard.path);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{dashboard.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Simplified header for pages that don't need workspace switcher
 */
export function SimpleHeader({ title, subtitle, className }: Omit<GlobalHeaderProps, 'showWorkspaceSwitcher'>) {
  return <GlobalHeader title={title} subtitle={subtitle} showWorkspaceSwitcher={false} className={className} />;
}
