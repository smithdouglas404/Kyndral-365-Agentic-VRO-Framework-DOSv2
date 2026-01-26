/**
 * DATABASE MANAGEMENT PAGE
 * Admin page for database operations including seeding with Enterprise test data
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseManagement() {
  const { toast } = useToast();
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/seed-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to seed database');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSeedResult(data);
      toast({
        title: 'Database Seeded Successfully',
        description: `Loaded ${data.summary?.projects || 0} projects and ${data.summary?.total || 0} total records`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Seeding Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSeedDatabase = () => {
    setShowSeedConfirm(false);
    setSeedResult(null);
    seedMutation.mutate();
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Database Management</h1>
          <p className="text-muted-foreground">
            Manage database operations, seeding, and backups
          </p>
        </div>

        {/* Warning Banner */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Caution</AlertTitle>
          <AlertDescription className="text-amber-800">
            Database operations can modify or delete existing data. Always ensure you have recent backups
            before performing destructive operations.
          </AlertDescription>
        </Alert>

        {/* Seed Database Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Seed Database with Enterprise Test Data
                </CardTitle>
                <CardDescription className="mt-2">
                  Load production-ready test data including Enterprise projects, tasks, risks, and more.
                  This will clear existing data and load fresh test data.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Projects</div>
                <div className="text-2xl font-bold">74</div>
                <div className="text-xs text-muted-foreground">36 Enterprise + 38 Generic IT</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Tasks</div>
                <div className="text-2xl font-bold">180</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Risks</div>
                <div className="text-2xl font-bold">53</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">OKRs & KPIs</div>
                <div className="text-2xl font-bold">21</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                What gets loaded:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-6 list-disc">
                <li>3 Divisions (Regional Utility, Renewable Energy Division, Corporate & Other)</li>
                <li>8 Teams with leads and members</li>
                <li>74 Projects (real Enterprise + generic business projects)</li>
                <li>180 Tasks with assignees and due dates</li>
                <li>53 Risks with severity and mitigation plans</li>
                <li>6 OKRs (Objectives & Key Results)</li>
                <li>15 KPIs (Key Performance Indicators)</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowSeedConfirm(true)}
                disabled={seedMutation.isPending}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                {seedMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding Database...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Seed Database
                  </>
                )}
              </Button>

              {seedResult && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Successfully loaded {seedResult.summary?.total || 0} records
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seed Result Details */}
        {seedResult && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Seeding Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Divisions</div>
                  <div className="text-xl font-bold">{seedResult.summary?.divisions || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Teams</div>
                  <div className="text-xl font-bold">{seedResult.summary?.teams || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Projects</div>
                  <div className="text-xl font-bold">{seedResult.summary?.projects || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tasks</div>
                  <div className="text-xl font-bold">{seedResult.summary?.tasks || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Risks</div>
                  <div className="text-xl font-bold">{seedResult.summary?.risks || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">OKRs</div>
                  <div className="text-xl font-bold">{seedResult.summary?.okrs || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">KPIs</div>
                  <div className="text-xl font-bold">{seedResult.summary?.kpis || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="text-xl font-bold text-green-600">{seedResult.summary?.total || 0}</div>
                </div>
              </div>
              {seedResult.timestamp && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Completed at: {new Date(seedResult.timestamp).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Other Database Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" disabled className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Database Backup (Coming Soon)
              </Button>
              <Button variant="outline" disabled className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Import Database Backup (Coming Soon)
              </Button>
              <Button variant="outline" disabled className="w-full justify-start text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showSeedConfirm} onOpenChange={setShowSeedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Seed Database with Test Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                This will clear ALL existing data and load fresh Enterprise test data.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-2">
                  ⚠️ Warning: The following will be deleted:
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-4 list-disc">
                  <li>All existing projects</li>
                  <li>All tasks and subtasks</li>
                  <li>All risks and mitigations</li>
                  <li>All OKRs and KPIs</li>
                  <li>All teams and divisions</li>
                </ul>
              </div>
              <p className="text-sm">
                <strong>New data loaded:</strong> 74 projects, 180 tasks, 53 risks, 6 OKRs, 15 KPIs
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure you have a backup if you need to preserve existing data.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSeedDatabase}
              className="bg-green-600 hover:bg-green-700"
            >
              Yes, Seed Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
