/**
 * MyShares Page
 *
 * Manage shared dashboards:
 * - View shares you've created
 * - View shares others have shared with you
 * - Revoke, update, and monitor share links
 */

import { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Flex,
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Callout,
} from '@tremor/react';
import {
  Share2,
  Link,
  Copy,
  Check,
  Trash2,
  Edit,
  Eye,
  Download,
  Clock,
  Lock,
  Globe,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { AppShell } from '@/components/shell/AppShell';
import { useMyShares, useRevokeShare } from '@/hooks/useShare';
import { buildShareUrl, formatExpiration, isShareExpired } from '@/lib/shareManager';
import type { SharedItem } from '@/lib/shareManager';

// ============================================================================
// Share Row Component
// ============================================================================

interface ShareRowProps {
  share: SharedItem & { shareToken?: string };
  onCopy: (url: string) => void;
  onRevoke: (id: string) => void;
  onEdit: (share: SharedItem) => void;
  copied?: boolean;
}

function ShareRow({ share, onCopy, onRevoke, onEdit, copied }: ShareRowProps) {
  const shareUrl = share.shareToken ? buildShareUrl(share.shareToken) : '';
  const isExpired = isShareExpired(share.expiresAt);

  return (
    <TableRow className={isExpired ? 'opacity-50' : ''}>
      <TableCell>
        <div>
          <Text className="font-medium">{share.name}</Text>
          {share.description && (
            <Text className="text-xs text-tremor-content-subtle truncate max-w-xs">
              {share.description}
            </Text>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge color={share.shareType === 'dashboard' ? 'blue' : 'violet'}>
          {share.shareType}
        </Badge>
      </TableCell>
      <TableCell>
        <Flex alignItems="center" className="gap-1">
          {share.accessLevel === 'clone' ? (
            <>
              <Download className="h-3 w-3" />
              <Text className="text-sm">Clone</Text>
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              <Text className="text-sm">View</Text>
            </>
          )}
        </Flex>
      </TableCell>
      <TableCell>
        <Badge color={isExpired ? 'rose' : 'gray'} size="xs">
          {isExpired ? 'Expired' : formatExpiration(share.expiresAt)}
        </Badge>
      </TableCell>
      <TableCell>
        <Flex className="gap-2">
          <Text className="text-sm">
            <Eye className="h-3 w-3 inline mr-1" />
            {share.viewCount || 0}
          </Text>
          <Text className="text-sm">
            <Download className="h-3 w-3 inline mr-1" />
            {share.cloneCount || 0}
          </Text>
        </Flex>
      </TableCell>
      <TableCell>
        <Flex className="gap-1">
          {share.shareToken && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCopy(shareUrl)}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {share.shareToken && (
                <DropdownMenuItem onClick={() => window.open(shareUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(share)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-600"
                onClick={() => onRevoke(share.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ type }: { type: 'created' | 'received' }) {
  return (
    <Card className="p-12 text-center">
      <Share2 className="h-12 w-12 mx-auto text-tremor-content-subtle mb-4" />
      <Title className="mb-2">
        {type === 'created' ? 'No Shared Dashboards' : 'No Shares Received'}
      </Title>
      <Text className="text-tremor-content-subtle">
        {type === 'created'
          ? 'Share a dashboard to create a shareable link.'
          : "Dashboards shared with you will appear here."}
      </Text>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MyShares() {
  const { data: shares, isLoading, error, refetch } = useMyShares();
  const revokeMutation = useRevokeShare();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SharedItem | null>(null);

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;

    try {
      await revokeMutation.mutateAsync(revokeTarget);
      setRevokeTarget(null);
    } catch (e) {
      console.error('Failed to revoke share:', e);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-tremor-brand" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="p-6">
          <Callout title="Error Loading Shares" color="rose" icon={AlertTriangle}>
            Failed to load your shares. Please try again.
          </Callout>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Flex alignItems="center" className="gap-3 mb-2">
            <Share2 className="h-6 w-6 text-tremor-brand" />
            <h1 className="text-2xl font-bold">My Shares</h1>
          </Flex>
          <Text className="text-tremor-content-subtle">
            Manage your shared dashboards and view shares from others.
          </Text>
        </div>

        {/* Tabs */}
        <TabGroup>
          <TabList>
            <Tab icon={Share2}>
              Created ({shares?.created.length || 0})
            </Tab>
            <Tab icon={Download}>
              Received ({shares?.received.length || 0})
            </Tab>
          </TabList>

          <TabPanels>
            {/* Created Shares */}
            <TabPanel>
              <div className="mt-4">
                {shares?.created && shares.created.length > 0 ? (
                  <Card className="p-0 overflow-hidden">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Name</TableHeaderCell>
                          <TableHeaderCell>Type</TableHeaderCell>
                          <TableHeaderCell>Access</TableHeaderCell>
                          <TableHeaderCell>Expires</TableHeaderCell>
                          <TableHeaderCell>Stats</TableHeaderCell>
                          <TableHeaderCell>Actions</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shares.created.map((share) => (
                          <ShareRow
                            key={share.id}
                            share={share as any}
                            onCopy={(url) => handleCopy(url, share.id)}
                            onRevoke={setRevokeTarget}
                            onEdit={setEditTarget}
                            copied={copiedId === share.id}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ) : (
                  <EmptyState type="created" />
                )}
              </div>
            </TabPanel>

            {/* Received Shares */}
            <TabPanel>
              <div className="mt-4">
                {shares?.received && shares.received.length > 0 ? (
                  <div className="grid gap-4">
                    {shares.received.map((share) => (
                      <Card key={share.id} className="p-4">
                        <Flex justifyContent="between" alignItems="start">
                          <div>
                            <Text className="font-medium">{share.name}</Text>
                            {share.description && (
                              <Text className="text-sm text-tremor-content-subtle">
                                {share.description}
                              </Text>
                            )}
                            <Flex className="gap-2 mt-2">
                              <Badge color="blue" size="xs">
                                {share.shareType}
                              </Badge>
                              <Badge
                                color={share.accessLevel === 'clone' ? 'emerald' : 'gray'}
                                size="xs"
                              >
                                {share.accessLevel === 'clone' ? 'Can Clone' : 'View Only'}
                              </Badge>
                            </Flex>
                          </div>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </Flex>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState type="received" />
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently disable this share link. Anyone with the link
              will no longer be able to access the shared content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Share'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

export default MyShares;
