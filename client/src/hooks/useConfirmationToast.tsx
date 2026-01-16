import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recordAuditTrail, generateConfirmationCode } from '@/lib/confirmationSystem';
import { ToastAction } from '@/components/ui/toast';

export interface ConfirmationToastOptions {
  actionType: 'approved' | 'dismissed' | 'escalated' | 'acknowledged' | 'created';
  entityType: 'intervention' | 'recommendation' | 'discussion' | 'risk';
  entityId?: string;
  entityTitle?: string;
  agentSource?: string;
  projectId?: string;
  projectName?: string;
  componentSource?: string;
  metadata?: Record<string, unknown>;
}

export function useConfirmationToast() {
  const { toast } = useToast();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showConfirmation = useCallback(async (options: ConfirmationToastOptions): Promise<string | null> => {
    const result = await recordAuditTrail({
      ...options,
      actionStatus: 'completed'
    });

    if (result.success && result.confirmationCode) {
      const code = result.confirmationCode;
      
      toast({
        title: options.actionType === 'approved' ? 'Action Approved' : 
               options.actionType === 'dismissed' ? 'Action Dismissed' :
               options.actionType === 'escalated' ? 'Action Escalated' :
               options.actionType === 'created' ? 'Action Created' : 'Action Acknowledged',
        description: (
          <div className="flex flex-col gap-1">
            <span>{options.entityTitle || 'Action processed successfully'}</span>
            <button 
              onClick={() => {
                setSelectedCode(code);
                setDrawerOpen(true);
              }}
              className="font-mono text-sm bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors text-left w-fit"
            >
              {code}
            </button>
          </div>
        ),
        duration: 5000,
      });

      return code;
    } else {
      toast({
        title: 'Action Failed',
        description: result.error || 'Failed to record action',
        variant: 'destructive',
        duration: 4000,
      });
      return null;
    }
  }, [toast]);

  const showFailure = useCallback((title: string, error?: string) => {
    const code = generateConfirmationCode();
    
    toast({
      title: 'Action Failed',
      description: (
        <div className="flex flex-col gap-1">
          <span>{title}</span>
          <span className="text-xs text-muted-foreground">{error}</span>
          <span className="font-mono text-xs opacity-60">{code}</span>
        </div>
      ),
      variant: 'destructive',
      duration: 5000,
    });

    return code;
  }, [toast]);

  return {
    showConfirmation,
    showFailure,
    selectedCode,
    drawerOpen,
    setDrawerOpen,
    setSelectedCode
  };
}
