/**
 * ADMIN DASHBOARD
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { Users, Database, Activity, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Fetch admin statistics
      return {
        totalUsers: 0,
        activeIntegrations: 0,
        agentsRunning: 9,
        systemHealth: 'healthy',
      };
    },
  });

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">System overview and quick actions</p>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.totalUsers || 0}
            color="blue"
          />
          <StatCard
            icon={Database}
            label="Active Integrations"
            value={stats?.activeIntegrations || 0}
            color="green"
          />
          <StatCard
            icon={Activity}
            label="Agents Running"
            value={stats?.agentsRunning || 0}
            color="purple"
          />
          <StatCard
            icon={CheckCircle}
            label="System Health"
            value={stats?.systemHealth || 'Unknown'}
            color="green"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <ActionButton label="Add User" href="/admin/users" />
            <ActionButton label="Add Integration" href="/admin/integrations" />
            <ActionButton label="Configure Agents" href="/admin/agents" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-6`}>
      <Icon className="w-8 h-8 mb-3" />
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function ActionButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="block px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center font-medium"
    >
      {label}
    </a>
  );
}
