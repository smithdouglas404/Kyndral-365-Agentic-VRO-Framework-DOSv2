/**
 * FINOPS DATA SOURCE CONFIGURATION
 *
 * Modal for FinOps agent to select which connected system has financial data.
 * Shows only systems that are already connected via MCP.
 *
 * Two data sources:
 * 1. Project Management (Jira, Azure DevOps, etc.) - for project data
 * 2. Financial/ERP (QuickBooks, SAP, etc.) - for financial reconciliation data
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
  Briefcase,
} from 'lucide-react';

interface FinOpsDataSourceConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ConnectedSystem {
  id: string;
  name: string;
  type: string;
  category: 'pm' | 'financial' | 'other';
  status: 'active' | 'inactive';
  hasFinancialData?: boolean; // PPM tools like Planview, Celoxis that track budgets/costs
  financialCapabilities?: string[]; // e.g., ['budgeting', 'evm', 'invoicing', 'profitability']
}

interface DataSourceMapping {
  projectDataSource: string; // PM system (Jira, Azure DevOps, etc.)
  financialDataSource: string; // Financial system (QuickBooks, SAP, etc.)
  reconciliationFrequency: 'daily' | 'weekly' | 'monthly';
}

export function FinOpsDataSourceConfig({
  open,
  onOpenChange,
  onSuccess,
}: FinOpsDataSourceConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [projectSource, setProjectSource] = useState<string>('');
  const [financialSource, setFinancialSource] = useState<string>('');
  const [reconciliationFreq, setReconciliationFreq] = useState<string>('daily');
  const [useSameSystem, setUseSameSystem] = useState<boolean>(false);

  // Fetch connected MCP systems
  const { data: systems, isLoading } = useQuery<ConnectedSystem[]>({
    queryKey: ['connected-mcp-systems'],
    queryFn: async () => {
      const res = await fetch('/api/admin/mcp-servers/connected');
      if (!res.ok) throw new Error('Failed to fetch connected systems');
      const data = await res.json();
      return data.systems || [];
    },
  });

  // Fetch current configuration
  const { data: currentConfig } = useQuery<DataSourceMapping>({
    queryKey: ['finops-data-source-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/finops/data-source-config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
    enabled: open,
  });

  // Update data source configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (config: DataSourceMapping) => {
      const res = await fetch('/api/admin/finops/data-source-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to update configuration');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finops-data-source-config'] });
      queryClient.invalidateQueries({ queryKey: ['finops-config-status'] });
      toast({
        title: 'Configuration Saved',
        description: 'FinOps data sources configured successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Configuration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set initial values from current config
  useState(() => {
    if (currentConfig) {
      setProjectSource(currentConfig.projectDataSource);
      setFinancialSource(currentConfig.financialDataSource);
      setReconciliationFreq(currentConfig.reconciliationFrequency);
    }
  });

  const pmSystems = systems?.filter((s) => s.category === 'pm' && s.status === 'active') || [];

  // Financial systems include both:
  // 1. Dedicated financial/ERP systems (QuickBooks, SAP, Oracle, etc.)
  // 2. PPM tools with financial capabilities (Planview, Celoxis, Clarity)
  const financialSystems =
    systems?.filter(
      (s) => (s.category === 'financial' || s.hasFinancialData) && s.status === 'active'
    ) || [];

  // Check if selected PM system has financial data
  const selectedPMSystem = pmSystems.find((s) => s.id === projectSource);
  const pmHasFinancialData = selectedPMSystem?.hasFinancialData || false;

  // Auto-select financial source if using same system
  const effectiveFinancialSource = useSameSystem && pmHasFinancialData ? projectSource : financialSource;

  const handleSave = () => {
    const finalFinancialSource = useSameSystem && pmHasFinancialData ? projectSource : financialSource;

    if (!projectSource || !finalFinancialSource) {
      toast({
        title: 'Missing Configuration',
        description: 'Please select both project and financial data sources',
        variant: 'destructive',
      });
      return;
    }

    updateConfigMutation.mutate({
      projectDataSource: projectSource,
      financialDataSource: finalFinancialSource,
      reconciliationFrequency: reconciliationFreq as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            FinOps Data Source Configuration
          </DialogTitle>
          <DialogDescription>
            Select which connected systems contain your project and financial data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Explanation */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Two Data Sources Required:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <strong>1. Project Management System:</strong> For project tasks, milestones,
                  status (Jira, Azure DevOps, etc.)
                </li>
                <li>
                  <strong>2. Financial/ERP System:</strong> For reconciled financial data -
                  invoices, expenses, budgets (QuickBooks, SAP, etc.)
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Project Management System */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Project Management System
                  </Label>
                  <Badge variant="outline">Real-time</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  System with project tasks, milestones, and team data
                </p>
                {pmSystems.length > 0 ? (
                  <Select value={projectSource} onValueChange={setProjectSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project management system" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmSystems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          <div className="flex items-center gap-2">
                            {system.name}
                            <Badge variant="secondary" className="text-xs">
                              {system.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      No project management systems connected. Please connect Jira, Azure DevOps,
                      or another PM tool first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Use Same System Option (if PM tool has financial data) */}
              {pmHasFinancialData && (
                <Alert>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{selectedPMSystem?.name}</strong> tracks financial data (budgets,
                        costs, EVM, profitability)
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSameSystem}
                          onChange={(e) => setUseSameSystem(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Use same system</span>
                      </label>
                    </div>
                    {selectedPMSystem?.financialCapabilities && (
                      <div className="mt-2 text-xs">
                        <strong>Financial Data Available:</strong>{' '}
                        {selectedPMSystem.financialCapabilities.join(', ')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Financial/ERP System */}
              {!useSameSystem && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Financial/ERP System
                    </Label>
                    <Badge variant="outline">Reconciled</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    System with invoices, expenses, budgets, and actual costs
                  </p>
                  {financialSystems.length > 0 ? (
                    <Select value={financialSource} onValueChange={setFinancialSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select financial/ERP system" />
                      </SelectTrigger>
                      <SelectContent>
                        {financialSystems.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {system.name}
                                <Badge variant="secondary" className="text-xs">
                                  {system.hasFinancialData ? 'PPM with Financial' : system.type}
                                </Badge>
                              </div>
                              {system.financialCapabilities && (
                                <span className="text-xs text-muted-foreground">
                                  {system.financialCapabilities.slice(0, 3).join(', ')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        No financial systems connected yet. You can configure this later by
                        connecting QuickBooks, SAP, Oracle ERP, or another financial system from the
                        MCP Marketplace.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Reconciliation Frequency */}
              {financialSource && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Reconciliation Frequency</Label>
                  <p className="text-sm text-muted-foreground">
                    How often is financial data reconciled and updated?
                  </p>
                  <Select value={reconciliationFreq} onValueChange={setReconciliationFreq}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (End of day)</SelectItem>
                      <SelectItem value="weekly">Weekly (End of week)</SelectItem>
                      <SelectItem value="monthly">Monthly (Month-end close)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Configuration Status */}
              {projectSource && effectiveFinancialSource && (
                <Alert>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription>
                    {useSameSystem && pmHasFinancialData ? (
                      <>
                        <strong>Ready to Configure:</strong> FinOps will use{' '}
                        <strong>{selectedPMSystem?.name}</strong> for both project data and financial
                        data (budgets, costs, EVM, profitability)
                      </>
                    ) : (
                      <>
                        <strong>Ready to Configure:</strong> FinOps will pull project data from{' '}
                        <strong>{pmSystems.find((s) => s.id === projectSource)?.name}</strong> and
                        financial data from{' '}
                        <strong>
                          {financialSystems.find((s) => s.id === effectiveFinancialSource)?.name}
                        </strong>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending || !projectSource || !effectiveFinancialSource}
          >
            {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
