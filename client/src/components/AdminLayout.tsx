/**
 * ADMIN LAYOUT
 *
 * Layout wrapper for all admin pages with navigation
 */

import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import {
  Settings,
  Users,
  Database,
  DatabaseBackup,
  Zap,
  LogOut,
  LayoutDashboard,
  Bell,
  Activity,
  Sliders,
  GitBranch,
  Store,
  CheckCircle,
  Shield,
  Brain,
  Mic,
  Plug,
  Bot,
  Cloud,
  Code,
  Layers,
  Radio,
  Workflow,
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfigurationStatus } from './ConfigurationStatus';
import { GlobalNotificationBell } from './GlobalNotificationBell';
import { ConnectionIndicator } from './RealTimeNotifications';
import { clearAuth } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/hitl', icon: Shield, label: 'HITL Approvals' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/integrations', icon: Database, label: 'Integrations' },
    { path: '/admin/mcp-marketplace', icon: Store, label: 'MCP Marketplace' },
    { path: '/admin/active-integrations', icon: CheckCircle, label: 'Active Integrations' },
    { path: '/admin/database-management', icon: DatabaseBackup, label: 'Database Management' },
    { path: '/admin/custom-fields', icon: Sliders, label: 'Custom Fields' },
    { path: '/admin/workflows', icon: GitBranch, label: 'Workflows' },
    { path: '/admin/policies', icon: Shield, label: 'Policy as Code' },
    { path: '/admin/agents', icon: Activity, label: 'Agents' },
    { path: '/admin/agent-management', icon: Bot, label: 'Agent Registry' },
    { path: '/admin/rules', icon: Zap, label: 'Agent Rules' },
    { path: '/admin/agent-mcp', icon: Plug, label: 'Agent MCP Manager' },
    { path: '/admin/palantir-sync', icon: Cloud, label: 'Palantir Ontology' },
    { path: '/admin/rules-engine', icon: Code, label: 'Enterprise Rules' },
    { path: '/admin/ontology-explorer', icon: Layers, label: 'Ontology Explorer' },
    { path: '/admin/subscriptions', icon: Radio, label: 'Real-Time Subscriptions' },
    { path: '/admin/workflow-automation', icon: Workflow, label: 'Workflow Automation' },
    { path: '/admin/agent-memory', icon: Brain, label: 'Agent Memory' },
    { path: '/admin/agent-attributes', icon: Sliders, label: 'Agent Attributes' },
    { path: '/admin/voice-briefings', icon: Mic, label: 'Voice Briefings' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold">Admin Console</h1>
              <p className="text-xs text-muted-foreground">System Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
              <ConnectionIndicator />
            </div>

            {/* Notification Bell */}
            <GlobalNotificationBell />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Configuration Status */}
          <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700">
            <ConfigurationStatus variant="compact" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
