/**
 * Share Hooks
 *
 * React Query hooks for share operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createShare,
  accessShare,
  getShareInfo,
  cloneSharedDashboard,
  revokeShare,
  updateShare,
  getMyShares,
  shareQueryKeys,
  type ShareConfig,
  type ShareType,
  type ShareResult,
  type SharedItem,
  type ShareAccessResponse,
  type CloneResult,
  type MyShares,
} from '@/lib/shareManager';
import type { DashboardConfig } from '@/lib/widgetRegistry';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get public info about a share (before authentication)
 */
export function useShareInfo(shareToken: string | null) {
  return useQuery({
    queryKey: shareQueryKeys.info(shareToken || ''),
    queryFn: () => getShareInfo(shareToken!),
    enabled: !!shareToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get user's created and received shares
 */
export function useMyShares() {
  return useQuery({
    queryKey: shareQueryKeys.my(),
    queryFn: getMyShares,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new share link
 */
export function useCreateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareType,
      sourceId,
      config,
      configSnapshot,
    }: {
      shareType: ShareType;
      sourceId: string;
      config: ShareConfig;
      configSnapshot: DashboardConfig | Record<string, unknown>;
    }): Promise<ShareResult> => {
      return createShare(shareType, sourceId, config, configSnapshot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareQueryKeys.my() });
    },
  });
}

/**
 * Access a shared item (with optional password)
 */
export function useAccessShare() {
  return useMutation({
    mutationFn: async ({
      shareToken,
      password,
    }: {
      shareToken: string;
      password?: string;
    }): Promise<ShareAccessResponse> => {
      return accessShare({ shareToken, password });
    },
  });
}

/**
 * Clone a shared dashboard
 */
export function useCloneShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareToken,
      accessToken,
      newName,
    }: {
      shareToken: string;
      accessToken: string;
      newName?: string;
    }): Promise<CloneResult> => {
      return cloneSharedDashboard(shareToken, accessToken, newName);
    },
    onSuccess: () => {
      // Invalidate dashboard queries to show the new clone
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.invalidateQueries({ queryKey: shareQueryKeys.my() });
    },
  });
}

/**
 * Revoke a share link
 */
export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareQueryKeys.my() });
    },
  });
}

/**
 * Update share settings
 */
export function useUpdateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      updates,
    }: {
      shareId: string;
      updates: Partial<ShareConfig>;
    }): Promise<SharedItem> => {
      return updateShare(shareId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareQueryKeys.my() });
    },
  });
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Combined hook for the share flow
 */
export function useShareFlow(dashboardConfig: DashboardConfig, dashboardName: string) {
  const createShareMutation = useCreateShare();
  const { data: myShares, isLoading: isLoadingShares } = useMyShares();

  const createLink = async (config: ShareConfig) => {
    return createShareMutation.mutateAsync({
      shareType: 'dashboard',
      sourceId: dashboardName,
      config,
      configSnapshot: dashboardConfig,
    });
  };

  return {
    createLink,
    isCreating: createShareMutation.isPending,
    createError: createShareMutation.error,
    myShares,
    isLoadingShares,
  };
}

/**
 * Hook for accessing and viewing a shared dashboard
 */
export function useSharedDashboard(shareToken: string | null) {
  const { data: shareInfo, isLoading: isLoadingInfo, error: infoError } = useShareInfo(shareToken);
  const accessMutation = useAccessShare();
  const cloneMutation = useCloneShare();

  const access = async (password?: string) => {
    if (!shareToken) throw new Error('No share token');
    return accessMutation.mutateAsync({ shareToken, password });
  };

  const clone = async (accessToken: string, newName?: string) => {
    if (!shareToken) throw new Error('No share token');
    return cloneMutation.mutateAsync({ shareToken, accessToken, newName });
  };

  return {
    shareInfo,
    isLoadingInfo,
    infoError,
    access,
    isAccessing: accessMutation.isPending,
    accessError: accessMutation.error,
    accessData: accessMutation.data,
    clone,
    isCloning: cloneMutation.isPending,
    cloneError: cloneMutation.error,
    cloneResult: cloneMutation.data,
  };
}

export default {
  useShareInfo,
  useMyShares,
  useCreateShare,
  useAccessShare,
  useCloneShare,
  useRevokeShare,
  useUpdateShare,
  useShareFlow,
  useSharedDashboard,
};
