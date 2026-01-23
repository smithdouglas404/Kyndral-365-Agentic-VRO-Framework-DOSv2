/**
 * INTEGRATION MANAGEMENT PAGE
 *
 * Manage all integrations:
 * - PM Tools: Jira, Azure DevOps, Smartsheet, Rally, Asana, Monday, MS Project
 * - Communication: Slack, Microsoft Teams, Email (SMTP)
 * - Enterprise: Salesforce, SAP, Workday
 * - Development: GitHub
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Database, CheckCircle, XCircle, AlertCircle, Edit, Trash2, Play } from 'lucide-react';
import { FieldMappingEditor } from '@/components/FieldMappingEditor';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  nextSync?: string;
  projectsCount: number;
  config: any;
}

export default function IntegrationManagement() {
  const [showWizard, setShowWizard] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetch('/api/integrations');
      if (!res.ok) throw new Error('Failed to fetch integrations');
      return res.json();
    },
  });

  const triggerSync = async (integrationId: string) => {
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger sync');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const res = await fetch(`/api/integrations/${integrationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete integration');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Integration Management</h1>
            <p className="text-muted-foreground">Connect and manage data sources</p>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Add Integration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations?.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onEdit={() => setEditingIntegration(integration)}
              onDelete={() => deleteIntegration(integration.id)}
              onSync={() => triggerSync(integration.id)}
            />
          ))}

          {integrations?.length === 0 && !isLoading && (
            <div className="col-span-full bg-white dark:bg-slate-800 rounded-lg border border-dashed p-12 text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Integrations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first data source to start syncing projects
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Integration
              </button>
            </div>
          )}
        </div>

        {showWizard && (
          <IntegrationWizard
            onClose={() => setShowWizard(false)}
            onSuccess={() => {
              setShowWizard(false);
              queryClient.invalidateQueries({ queryKey: ['integrations'] });
            }}
          />
        )}

        {editingIntegration && (
          <IntegrationWizard
            integration={editingIntegration}
            onClose={() => setEditingIntegration(null)}
            onSuccess={() => {
              setEditingIntegration(null);
              queryClient.invalidateQueries({ queryKey: ['integrations'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function IntegrationCard({ integration, onEdit, onDelete, onSync }: any) {
  const statusIcons = {
    connected: CheckCircle,
    disconnected: XCircle,
    error: AlertCircle,
  };

  const statusColors = {
    connected: 'text-green-600',
    disconnected: 'text-gray-400',
    error: 'text-red-600',
  };

  const StatusIcon = statusIcons[integration.status];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="font-semibold">{integration.name}</h3>
            <p className="text-sm text-muted-foreground">{integration.type}</p>
          </div>
        </div>

        <StatusIcon className={`w-5 h-5 ${statusColors[integration.status]}`} />
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Projects:</span>
          <span className="font-medium">{integration.projectsCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Sync:</span>
          <span className="font-medium">
            {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSync}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          <Play className="w-4 h-4" />
          Sync Now
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 border border-red-200 dark:border-red-800 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function IntegrationWizard({ integration, onClose, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    type: integration?.type || 'jira',
    baseUrl: integration?.config?.baseUrl || '',
    email: integration?.config?.email || '',
    apiToken: integration?.config?.apiToken || '',
    syncFrequency: integration?.config?.syncFrequency || '4h',
    projects: integration?.config?.projects || '',
    fieldMappings: integration?.fieldMappings || '',
  });

  const totalSteps = 5; // Added field mapping step

  const handleSubmit = async () => {
    try {
      const url = integration ? `/api/integrations/${integration.id}` : '/api/integrations';
      const method = integration ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save integration');

      onSuccess();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          {integration ? 'Edit Integration' : 'Add New Integration'}
        </h2>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  s <= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < totalSteps && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">1. Choose Data Source</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Integration Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="jira">Jira</option>
                  <option value="servicenow">ServiceNow</option>
                  <option value="planview">Planview</option>
                  <option value="azure-devops">Azure DevOps</option>
                  <option value="smartsheet">Smartsheet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Integration Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Engineering Jira"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">2. Connection Details</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Base URL</label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://company.atlassian.net"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jira-service@company.com"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Token</label>
                <input
                  type="password"
                  value={formData.apiToken}
                  onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <button className="text-sm text-blue-500 hover:text-blue-600">
                Test Connection
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">3. Sync Configuration</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Sync Frequency</label>
                <select
                  value={formData.syncFrequency}
                  onChange={(e) => setFormData({ ...formData, syncFrequency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="1h">Every hour</option>
                  <option value="4h">Every 4 hours</option>
                  <option value="8h">Every 8 hours</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Projects to Sync</label>
                <input
                  type="text"
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  placeholder="PROJ, ENG, DATA (or leave empty for all)"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated project keys, or leave empty to sync all projects
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">4. Field Mapping</h3>
              <FieldMappingEditor
                integrationType={formData.type}
                existingMappings={integration?.fieldMappings}
                onSave={(mappings) => {
                  setFormData({ ...formData, fieldMappings: JSON.stringify(mappings) });
                }}
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">5. Review & Save</h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base URL:</span>
                  <span className="font-medium">{formData.baseUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync Frequency:</span>
                  <span className="font-medium">{formData.syncFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Field Mappings:</span>
                  <span className="font-medium">
                    {formData.fieldMappings ? 'Configured ✓' : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Back
            </button>
          )}

          <div className="flex-1" />

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Save Integration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
