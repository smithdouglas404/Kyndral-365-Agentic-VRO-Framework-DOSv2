/**
 * CONFIGURATION STATUS INDICATOR
 *
 * Shows red indicators when critical configurations are missing:
 * - MCPs not configured
 * - OKRs not seeded
 */

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface ConfigStatusData {
  mcps: {
    total: number;
    configured: number;
    missing: string[];
  };
  okrs: {
    total: number;
    seeded: boolean;
  };
}

interface ConfigurationStatusProps {
  variant?: 'card' | 'inline' | 'compact';
  className?: string;
}

export function ConfigurationStatus({ variant = 'card', className }: ConfigurationStatusProps) {
  const [, navigate] = useLocation();

  // Fetch configuration status
  const { data: status, isLoading } = useQuery<ConfigStatusData>({
    queryKey: ['config-status'],
    queryFn: async () => {
      const [mcpRes, okrRes] = await Promise.all([
        fetch('/api/admin/mcp-marketplace'),
        fetch('/api/admin/okrs'),
      ]);

      const mcpData = await mcpRes.json();
      const okrData = await okrRes.json();

      // Check MCP configuration
      const mcps = mcpData.mcps || [];
      const configured = mcps.filter((m: any) => m.status === 'installed' || m.status === 'configured').length;
      const missing = mcps
        .filter((m: any) => m.status === 'available' || !m.status)
        .map((m: any) => m.name);

      return {
        mcps: {
          total: mcps.length,
          configured,
          missing,
        },
        okrs: {
          total: okrData.okrs?.length || 0,
          seeded: (okrData.okrs?.length || 0) > 0,
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return null;
  }

  if (!status) {
    return null;
  }

  const mcpConfigured = status.mcps.configured === status.mcps.total;
  const okrConfigured = status.okrs.seeded;
  const allConfigured = mcpConfigured && okrConfigured;

  // Compact variant - just show indicators
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {!mcpConfigured && (
          <Badge variant="destructive" className="gap-1 cursor-pointer" onClick={() => navigate('/admin/mcp-marketplace')}>
            <AlertCircle className="w-3 h-3" />
            MCPs
          </Badge>
        )}
        {!okrConfigured && (
          <Badge variant="destructive" className="gap-1 cursor-pointer" onClick={() => navigate('/admin/okr-management')}>
            <AlertCircle className="w-3 h-3" />
            OKRs
          </Badge>
        )}
        {allConfigured && (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </Badge>
        )}
      </div>
    );
  }

  // Inline variant - show in a row
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-between p-4 bg-muted rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">System Configuration</p>
            <p className="text-xs text-muted-foreground">
              {allConfigured ? 'All systems configured' : 'Action required'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {mcpConfigured ? (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3" />
                MCPs ({status.mcps.configured}/{status.mcps.total})
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                MCPs ({status.mcps.configured}/{status.mcps.total})
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {okrConfigured ? (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3" />
                OKRs ({status.okrs.total})
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                OKRs (0)
              </Badge>
            )}
          </div>

          {!allConfigured && (
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/agents')}>
              Setup
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant - full details
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">System Configuration</CardTitle>
            <CardDescription>MCP and OKR setup status</CardDescription>
          </div>
          {allConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MCP Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">MCPs Configured</span>
            <Badge variant={mcpConfigured ? 'outline' : 'destructive'} className="gap-1">
              {status.mcps.configured}/{status.mcps.total}
            </Badge>
          </div>
          {!mcpConfigured && (
            <div className="text-xs text-muted-foreground bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-2">
              <p className="font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Action Required</p>
              <p>Configure {status.mcps.missing.length} MCPs: {status.mcps.missing.slice(0, 2).join(', ')}
                {status.mcps.missing.length > 2 && ` +${status.mcps.missing.length - 2} more`}
              </p>
              <Button
                size="sm"
                variant="link"
                className="h-auto p-0 mt-1 text-red-600"
                onClick={() => navigate('/admin/mcp-marketplace')}
              >
                Configure MCPs →
              </Button>
            </div>
          )}
        </div>

        {/* OKR Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">OKRs Configured</span>
            <Badge variant={okrConfigured ? 'outline' : 'destructive'} className="gap-1">
              {status.okrs.total} {okrConfigured ? 'Active' : 'Missing'}
            </Badge>
          </div>
          {!okrConfigured && (
            <div className="text-xs text-muted-foreground bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-2">
              <p className="font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Action Required</p>
              <p>No OKRs configured. Seed default OKRs or create custom ones.</p>
              <Button
                size="sm"
                variant="link"
                className="h-auto p-0 mt-1 text-red-600"
                onClick={() => navigate('/admin/okr-management')}
              >
                Setup OKRs →
              </Button>
            </div>
          )}
        </div>

        {allConfigured && (
          <div className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded p-2">
            <p className="font-medium">✓ All systems configured</p>
            <p className="text-muted-foreground">Your platform is ready for production use</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
