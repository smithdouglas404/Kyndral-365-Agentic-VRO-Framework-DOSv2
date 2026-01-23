/**
 * AGENT CONFIGURATION PAGE
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Settings, Save } from 'lucide-react';

export default function AgentConfiguration() {
  const queryClient = useQueryClient();

  const { data: agentConfig } = useQuery({
    queryKey: ['agent-config'],
    queryFn: async () => {
      const res = await fetch('/api/agents/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
  });

  const agents = [
    { id: 'tmo', name: 'TMO Agent', description: 'Time Management Office - Schedule tracking' },
    { id: 'finops', name: 'FinOps Agent', description: 'Financial Operations - Budget monitoring' },
    { id: 'vro', name: 'VRO Agent', description: 'Value Realization Office - ROI tracking' },
    { id: 'risk', name: 'Risk Agent', description: 'Risk Management - Issue detection' },
    { id: 'okr', name: 'OKR Agent', description: 'OKR Inference - Strategic alignment' },
    { id: 'governance', name: 'Governance Agent', description: 'Compliance & approvals' },
    { id: 'planning', name: 'Planning Agent', description: 'Resource & dependency planning' },
    { id: 'ocm', name: 'OCM Agent', description: 'Organizational Change Management' },
    { id: 'integrated', name: 'Integrated Mgmt Agent', description: 'Cross-functional coordination' },
  ];

  const [config, setConfig] = useState<Record<string, any>>({});

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save config');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-config'] });
    },
  });

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agent Configuration</h1>
            <p className="text-muted-foreground">Configure AI agent behaviors and thresholds</p>
          </div>

          <button
            onClick={() => saveMutation.mutate(config)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Global Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Global Agent Settings
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Agent Scan Interval</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option value="1h">Every hour</option>
                  <option value="2h">Every 2 hours</option>
                  <option value="4h">Every 4 hours</option>
                  <option value="8h">Every 8 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Interventions Per Scan</label>
                <input
                  type="number"
                  defaultValue={15}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable all agents</span>
              </label>
            </div>
          </div>

          {/* Individual Agent Configuration */}
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-slate-800 rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {agent.id === 'finops' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Budget Variance Alert</label>
                      <input
                        type="number"
                        defaultValue={20}
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CPI Threshold</label>
                      <input
                        type="number"
                        defaultValue={0.85}
                        step={0.01}
                        min={0}
                        max={1}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {agent.id === 'tmo' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Schedule Slip Alert</label>
                      <input
                        type="number"
                        defaultValue={30}
                        min={1}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SPI Threshold</label>
                      <input
                        type="number"
                        defaultValue={0.85}
                        step={0.01}
                        min={0}
                        max={1}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {agent.id === 'vro' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">ROI Variance Alert</label>
                      <input
                        type="number"
                        defaultValue={20}
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Scan Frequency</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="2h">Every 2 hours</option>
                    <option value="4h">Every 4 hours</option>
                    <option value="6h">Every 6 hours</option>
                    <option value="8h">Every 8 hours</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
