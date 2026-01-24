/**
 * USER ROLE MANAGEMENT PAGE
 *
 * Admin interface for managing user roles
 * Only accessible to system_admin role
 */

import { useState, useEffect } from 'react';
import { Users, Shield, Check, X, Loader2 } from 'lucide-react';
import { useRoleBasedAccess, getAllRoles, type UserRole } from '@/hooks/useRoleBasedAccess';
import { getIdToken } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isActive: boolean;
  createdAt: string;
  firebaseUid?: string | null;
}

export default function UserRoleManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);

  const availableRoles = getAllRoles();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const idToken = await getIdToken();

      const response = await fetch('/api/auth/firebase/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    try {
      setSaving(true);
      const idToken = await getIdToken();

      const response = await fetch('/api/auth/firebase/set-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRoleValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update role');
      }

      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRoleValue } : u))
      );

      setEditingUserId(null);
      setNewRole('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (userId: string, currentRole: string) => {
    setEditingUserId(userId);
    setNewRole(currentRole);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setNewRole('');
  };

  const getRoleBadgeColor = (role: string): string => {
    const colors: Record<string, string> = {
      system_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      executive: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      finops: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      vro: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      tmo: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      risk: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      governance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      ocm: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      pm: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[role] || colors.pm;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">User Role Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage user roles and permissions. Only system administrators can access this page.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '?')}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">
                          {user.firstName || ''} {user.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700"
                      >
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {availableRoles.find(r => r.id === user.role)?.name || user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingUserId === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRoleChange(user.id, newRole)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(user.id, user.role)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Change Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">Role Permissions</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li><strong>Project Manager:</strong> Manages projects, sprints, issues</li>
          <li><strong>Value Realization Office:</strong> Tracks ROI, benefits, value delivery</li>
          <li><strong>Timeline Management Office:</strong> Monitors schedules, SPI, velocity</li>
          <li><strong>Financial Operations:</strong> Manages budgets, EVM, cost control</li>
          <li><strong>Risk Management:</strong> Tracks risks, issues, mitigation</li>
          <li><strong>Governance & Compliance:</strong> Ensures regulatory compliance</li>
          <li><strong>Organizational Change Mgmt:</strong> Manages stakeholder engagement</li>
          <li><strong>Executive Leadership:</strong> Strategic oversight (full access)</li>
          <li><strong>System Administrator:</strong> Full system access and user management</li>
        </ul>
      </div>
    </div>
  );
}
