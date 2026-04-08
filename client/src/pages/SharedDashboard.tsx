/**
 * SharedDashboard Page
 *
 * Displays a shared dashboard to recipients.
 * Handles password authentication, viewing, and cloning.
 */

import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import {
  Card,
  Title,
  Text,
  Flex,
  Badge,
  Callout,
  Grid,
  Col,
} from '@tremor/react';
import {
  Share2,
  Lock,
  Eye,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  User,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSharedDashboard } from '@/hooks/useShare';
import { formatExpiration, isShareExpired } from '@/lib/shareManager';
import { DynamicDashboard } from '@/dashboard/core/DynamicDashboard';
import type { DashboardConfig } from '@/lib/widgetRegistry';

// ============================================================================
// Types
// ============================================================================

interface SharedDashboardState {
  step: 'loading' | 'password' | 'viewing' | 'error' | 'expired' | 'not_found';
  accessToken?: string;
  config?: DashboardConfig;
}

// ============================================================================
// Password Dialog
// ============================================================================

interface PasswordDialogProps {
  open: boolean;
  onSubmit: (password: string) => void;
  isLoading: boolean;
  error?: string;
}

function PasswordDialog({ open, onSubmit, isLoading, error }: PasswordDialogProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            This shared dashboard is password protected.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
            {error && (
              <Text className="text-sm text-rose-500">{error}</Text>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading || !password}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Access Dashboard'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Clone Dialog
// ============================================================================

interface CloneDialogProps {
  open: boolean;
  onClose: () => void;
  onClone: (name: string) => void;
  isLoading: boolean;
  originalName: string;
  error?: string;
}

function CloneDialog({
  open,
  onClose,
  onClone,
  isLoading,
  originalName,
  error,
}: CloneDialogProps) {
  const [name, setName] = useState(`${originalName} (Clone)`);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Clone Dashboard
          </DialogTitle>
          <DialogDescription>
            Create a copy of this dashboard in your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clone-name">Dashboard Name</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Dashboard"
            />
          </div>

          {error && (
            <Callout title="Error" color="rose" icon={AlertTriangle}>
              {error}
            </Callout>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onClone(name)} disabled={isLoading || !name}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Clone to My Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Share Info Header
// ============================================================================

interface ShareHeaderProps {
  name: string;
  description?: string;
  ownerName?: string;
  accessLevel: string;
  expiresAt?: string;
  viewCount?: number;
  canClone: boolean;
  onClone: () => void;
}

function ShareHeader({
  name,
  description,
  ownerName,
  accessLevel,
  expiresAt,
  viewCount,
  canClone,
  onClone,
}: ShareHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-tremor-background border-b border-tremor-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Flex alignItems="center" className="gap-3 mb-1">
              <Share2 className="h-6 w-6 text-tremor-brand" />
              <Title>{name}</Title>
              <Badge color={accessLevel === 'clone' ? 'blue' : 'gray'}>
                {accessLevel === 'clone' ? 'View & Clone' : 'View Only'}
              </Badge>
            </Flex>
            {description && (
              <Text className="text-tremor-content-subtle">{description}</Text>
            )}
            <Flex className="gap-4 mt-2">
              {ownerName && (
                <Flex alignItems="center" className="gap-1">
                  <User className="h-3 w-3 text-tremor-content-subtle" />
                  <Text className="text-xs text-tremor-content-subtle">
                    Shared by {ownerName}
                  </Text>
                </Flex>
              )}
              {expiresAt && (
                <Flex alignItems="center" className="gap-1">
                  <Clock className="h-3 w-3 text-tremor-content-subtle" />
                  <Text className="text-xs text-tremor-content-subtle">
                    Expires: {formatExpiration(expiresAt)}
                  </Text>
                </Flex>
              )}
              {viewCount !== undefined && (
                <Flex alignItems="center" className="gap-1">
                  <Eye className="h-3 w-3 text-tremor-content-subtle" />
                  <Text className="text-xs text-tremor-content-subtle">
                    {viewCount} views
                  </Text>
                </Flex>
              )}
            </Flex>
          </div>

          <Flex className="gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-4 w-4 mr-1 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            {canClone && (
              <Button size="sm" onClick={onClone}>
                <Download className="h-4 w-4 mr-1" />
                Clone to My Account
              </Button>
            )}
          </Flex>
        </Flex>
      </div>
    </div>
  );
}

// ============================================================================
// Error States
// ============================================================================

function NotFoundState() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-tremor-background-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <Title className="mb-2">Share Not Found</Title>
        <Text className="text-tremor-content-subtle mb-6">
          This share link doesn't exist or has been removed.
        </Text>
        <Button onClick={() => setLocation('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}

function ExpiredState() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-tremor-background-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <Clock className="h-12 w-12 mx-auto text-rose-500 mb-4" />
        <Title className="mb-2">Share Expired</Title>
        <Text className="text-tremor-content-subtle mb-6">
          This share link has expired and is no longer available.
        </Text>
        <Button onClick={() => setLocation('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-tremor-background-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-rose-500 mb-4" />
        <Title className="mb-2">Error</Title>
        <Text className="text-tremor-content-subtle mb-6">{message}</Text>
        <Button onClick={() => setLocation('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-tremor-background-subtle flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-tremor-brand mb-4" />
        <Text>Loading shared dashboard...</Text>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SharedDashboard() {
  const [, params] = useRoute('/shared/:token');
  const shareToken = params?.token || null;

  const {
    shareInfo,
    isLoadingInfo,
    infoError,
    access,
    isAccessing,
    accessError,
    accessData,
    clone,
    isCloning,
    cloneError,
    cloneResult,
  } = useSharedDashboard(shareToken);

  const [state, setState] = useState<SharedDashboardState>({ step: 'loading' });
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();

  // Handle initial load and state transitions
  useEffect(() => {
    if (!shareToken) {
      setState({ step: 'not_found' });
      return;
    }

    if (isLoadingInfo) {
      setState({ step: 'loading' });
      return;
    }

    if (infoError) {
      if ((infoError as any)?.message?.includes('expired')) {
        setState({ step: 'expired' });
      } else {
        setState({ step: 'not_found' });
      }
      return;
    }

    if (!shareInfo) {
      setState({ step: 'not_found' });
      return;
    }

    // Check if password is required
    if (shareInfo.isPasswordProtected && !accessData?.success) {
      setState({ step: 'password' });
      return;
    }

    // If we have access data, show the dashboard
    if (accessData?.success && accessData.item) {
      setState({
        step: 'viewing',
        accessToken: accessData.accessToken,
        config: accessData.item.configSnapshot as DashboardConfig,
      });
      return;
    }

    // If no password required, auto-access
    if (!shareInfo.isPasswordProtected && !accessData) {
      access().then((result) => {
        if (result.success && result.item) {
          setState({
            step: 'viewing',
            accessToken: result.accessToken,
            config: result.item.configSnapshot as DashboardConfig,
          });
        }
      }).catch(() => {
        setState({ step: 'error' });
      });
    }
  }, [shareToken, isLoadingInfo, infoError, shareInfo, accessData]);

  // Handle password submit
  const handlePasswordSubmit = async (password: string) => {
    setPasswordError(undefined);
    try {
      const result = await access(password);
      if (result.success && result.item) {
        setState({
          step: 'viewing',
          accessToken: result.accessToken,
          config: result.item.configSnapshot as DashboardConfig,
        });
      } else {
        setPasswordError(result.error || 'Invalid password');
      }
    } catch (e) {
      setPasswordError('Failed to verify password');
    }
  };

  // Handle clone
  const handleClone = async (newName: string) => {
    if (!state.accessToken) return;

    try {
      const result = await clone(state.accessToken, newName);
      if (result.success) {
        setShowCloneDialog(false);
        // Show success message or redirect
      }
    } catch (e) {
      // Error handled by mutation state
    }
  };

  // Render based on state
  switch (state.step) {
    case 'loading':
      return <LoadingState />;

    case 'not_found':
      return <NotFoundState />;

    case 'expired':
      return <ExpiredState />;

    case 'error':
      return <ErrorState message="Something went wrong" />;

    case 'password':
      return (
        <div className="min-h-screen bg-tremor-background-subtle flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <div className="text-center mb-6">
              <Share2 className="h-12 w-12 mx-auto text-tremor-brand mb-4" />
              <Title>{shareInfo?.name || 'Shared Dashboard'}</Title>
              {shareInfo?.description && (
                <Text className="text-tremor-content-subtle mt-1">
                  {shareInfo.description}
                </Text>
              )}
            </div>
            <PasswordDialog
              open={true}
              onSubmit={handlePasswordSubmit}
              isLoading={isAccessing}
              error={passwordError}
            />
          </Card>
        </div>
      );

    case 'viewing':
      return (
        <div className="min-h-screen bg-tremor-background-subtle">
          {/* Header */}
          <ShareHeader
            name={shareInfo?.name || 'Shared Dashboard'}
            description={shareInfo?.description}
            accessLevel={shareInfo?.accessLevel || 'view'}
            expiresAt={shareInfo?.expiresAt}
            viewCount={shareInfo?.viewCount}
            canClone={shareInfo?.accessLevel === 'clone'}
            onClone={() => setShowCloneDialog(true)}
          />

          {/* Dashboard Content */}
          <div className="p-6">
            {state.config ? (
              <DynamicDashboard
                workspaceType="shared"
                defaultWidgets={state.config.visibleWidgets}
                widgetComponents={{}}
              />
            ) : (
              <Card className="p-12 text-center">
                <Text className="text-tremor-content-subtle">
                  No widgets in this dashboard
                </Text>
              </Card>
            )}
          </div>

          {/* Clone Dialog */}
          <CloneDialog
            open={showCloneDialog}
            onClose={() => setShowCloneDialog(false)}
            onClone={handleClone}
            isLoading={isCloning}
            originalName={shareInfo?.name || 'Dashboard'}
            error={cloneError?.message}
          />

          {/* Clone Success Message */}
          {cloneResult?.success && (
            <div className="fixed bottom-4 right-4 z-50">
              <Callout
                title="Dashboard Cloned!"
                color="emerald"
                icon={Check}
              >
                <Text>
                  "{cloneResult.newDashboardName}" has been added to your dashboards.
                </Text>
                <Button variant="secondary" size="sm" className="mt-2">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Dashboard
                </Button>
              </Callout>
            </div>
          )}
        </div>
      );

    default:
      return <LoadingState />;
  }
}

export default SharedDashboard;
