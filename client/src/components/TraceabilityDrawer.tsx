import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, User, Bot, Calendar, FileText, Hash, AlertTriangle } from 'lucide-react';
import { getAuditTrailByCode, type AuditTrailEntry } from '@/lib/confirmationSystem';

interface TraceabilityDrawerProps {
  confirmationCode: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TraceabilityDrawer({ confirmationCode, open, onOpenChange }: TraceabilityDrawerProps) {
  const [entry, setEntry] = useState<AuditTrailEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && confirmationCode) {
      setLoading(true);
      getAuditTrailByCode(confirmationCode)
        .then(data => setEntry(data))
        .finally(() => setLoading(false));
    } else {
      setEntry(null);
    }
  }, [open, confirmationCode]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-500 text-white';
      case 'dismissed':
        return 'bg-gray-500 text-white';
      case 'escalated':
        return 'bg-red-500 text-white';
      case 'acknowledged':
        return 'bg-blue-500 text-white';
      case 'created':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Action Traceability
          </SheetTitle>
          <SheetDescription>
            Full audit trail for confirmation code
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : entry ? (
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Confirmation Code</span>
                  {getStatusIcon(entry.actionStatus)}
                </div>
                <p className="text-xl font-mono font-bold text-primary">{entry.confirmationCode}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Badge className={getActionBadgeColor(entry.actionType)}>
                      {entry.actionType.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Action Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {entry.actionType} action recorded
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Timestamp</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Entity</p>
                    <p className="text-sm text-muted-foreground capitalize">{entry.entityType}</p>
                    {entry.entityTitle && (
                      <p className="text-sm font-medium mt-1">{entry.entityTitle}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Agent Source</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.agentSource || 'Unknown Agent'}
                    </p>
                  </div>
                </div>

                {entry.projectName && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Project Affected</p>
                        <p className="text-sm text-muted-foreground">{entry.projectName}</p>
                      </div>
                    </div>
                  </>
                )}

                {entry.userName && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">User</p>
                        <p className="text-sm text-muted-foreground">{entry.userName}</p>
                      </div>
                    </div>
                  </>
                )}

                {entry.componentSource && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Source Component</p>
                        <p className="text-sm text-muted-foreground">{entry.componentSource}</p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={entry.actionStatus === 'completed' ? 'default' : 'destructive'}>
                      {entry.actionStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Hash className="h-12 w-12 mb-4 opacity-50" />
            <p>No audit trail entry found</p>
            <p className="text-sm">Code: {confirmationCode}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
