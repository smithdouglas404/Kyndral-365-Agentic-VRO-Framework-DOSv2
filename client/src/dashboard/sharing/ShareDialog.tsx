import { useState } from 'react';
import {
  Card,
  Text,
  TextInput,
  Badge,
  Button,
  Flex,
  Callout,
} from '@tremor/react';
import {
  Share2,
  Link,
  Copy,
  Check,
  Eye,
  Download,
  Users,
  Lock,
  Globe,
  Clock,
  QrCode,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DashboardConfig } from '@/lib/widgetRegistry';

// ============================================================================
// Types
// ============================================================================

export type ShareAccessLevel = 'view' | 'clone';

export interface ShareConfig {
  name: string;
  description?: string;
  accessLevel: ShareAccessLevel;
  isPublic: boolean;
  requirePassword: boolean;
  password?: string;
  expiresIn?: string; // 'never' | '1d' | '7d' | '30d' | '90d'
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardConfig: DashboardConfig;
  dashboardName: string;
  onShare: (config: ShareConfig) => Promise<{ shareUrl: string; shareToken: string }>;
}

// ============================================================================
// Share Dialog Component
// ============================================================================

export function ShareDialog({
  open,
  onOpenChange,
  dashboardConfig,
  dashboardName,
  onShare,
}: ShareDialogProps) {
  const [step, setStep] = useState<'configure' | 'success'>('configure');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; shareToken: string } | null>(null);

  const [config, setConfig] = useState<ShareConfig>({
    name: dashboardName,
    description: '',
    accessLevel: 'view',
    isPublic: false,
    requirePassword: false,
    password: '',
    expiresIn: 'never',
  });

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const result = await onShare(config);
      setShareResult(result);
      setStep('success');
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareResult?.shareUrl) {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('configure');
    setShareResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Dashboard
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for your dashboard configuration.
          </DialogDescription>
        </DialogHeader>

        {step === 'configure' ? (
          <div className="space-y-6 py-4">
            {/* Dashboard Info */}
            <Card className="p-4 bg-tremor-background-subtle">
              <Flex justifyContent="between" alignItems="center">
                <div>
                  <Text className="font-medium">{dashboardName}</Text>
                  <Text className="text-sm text-tremor-content-subtle">
                    {dashboardConfig.visibleWidgets.length} widgets
                  </Text>
                </div>
                <Badge color="blue">Dashboard</Badge>
              </Flex>
            </Card>

            {/* Share Name */}
            <div className="space-y-2">
              <Label htmlFor="share-name">Share Name</Label>
              <Input
                id="share-name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Dashboard"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="share-description">Description (optional)</Label>
              <Input
                id="share-description"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this dashboard"
              />
            </div>

            {/* Access Level */}
            <div className="space-y-3">
              <Label>Access Level</Label>
              <RadioGroup
                value={config.accessLevel}
                onValueChange={(value) => setConfig(prev => ({ ...prev, accessLevel: value as ShareAccessLevel }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-tremor-background-subtle cursor-pointer">
                  <RadioGroupItem value="view" id="view" />
                  <div className="flex-1">
                    <Label htmlFor="view" className="flex items-center gap-2 cursor-pointer">
                      <Eye className="h-4 w-4" />
                      View Only
                    </Label>
                    <Text className="text-xs text-tremor-content-subtle">
                      Recipients can view but not modify
                    </Text>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-tremor-background-subtle cursor-pointer">
                  <RadioGroupItem value="clone" id="clone" />
                  <div className="flex-1">
                    <Label htmlFor="clone" className="flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" />
                      Allow Cloning
                    </Label>
                    <Text className="text-xs text-tremor-content-subtle">
                      Recipients can clone this dashboard to their account
                    </Text>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label>Link Expiration</Label>
              <Select
                value={config.expiresIn}
                onValueChange={(value) => setConfig(prev => ({ ...prev, expiresIn: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password Protection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="require-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Require Password
                </Label>
                <Switch
                  id="require-password"
                  checked={config.requirePassword}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requirePassword: checked }))}
                />
              </div>
              {config.requirePassword && (
                <Input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <Callout title="Link Created" color="emerald" icon={Check}>
              Your shareable link has been created successfully.
            </Callout>

            {/* Share URL */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareResult?.shareUrl || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <ShadcnButton
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </ShadcnButton>
              </div>
            </div>

            {/* Share Info */}
            <Card className="p-4">
              <div className="space-y-3">
                <Flex justifyContent="between">
                  <Text className="text-tremor-content-subtle">Access Level</Text>
                  <Badge color={config.accessLevel === 'clone' ? 'blue' : 'gray'}>
                    {config.accessLevel === 'clone' ? 'View & Clone' : 'View Only'}
                  </Badge>
                </Flex>
                <Flex justifyContent="between">
                  <Text className="text-tremor-content-subtle">Expires</Text>
                  <Text>{config.expiresIn === 'never' ? 'Never' : config.expiresIn}</Text>
                </Flex>
                <Flex justifyContent="between">
                  <Text className="text-tremor-content-subtle">Password Protected</Text>
                  <Badge color={config.requirePassword ? 'amber' : 'gray'}>
                    {config.requirePassword ? 'Yes' : 'No'}
                  </Badge>
                </Flex>
              </div>
            </Card>

            {/* Additional Actions */}
            <Flex className="gap-2">
              <Button variant="secondary" className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button variant="secondary" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Invite Users
              </Button>
            </Flex>
          </div>
        )}

        <DialogFooter>
          {step === 'configure' ? (
            <>
              <ShadcnButton variant="outline" onClick={handleClose}>
                Cancel
              </ShadcnButton>
              <ShadcnButton
                onClick={handleShare}
                disabled={isLoading || !config.name}
              >
                {isLoading ? 'Creating...' : 'Create Link'}
              </ShadcnButton>
            </>
          ) : (
            <ShadcnButton onClick={handleClose}>
              Done
            </ShadcnButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
