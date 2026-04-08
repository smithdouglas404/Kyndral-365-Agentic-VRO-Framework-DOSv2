/**
 * ShareManager - Client-side share management utilities
 *
 * Handles share token generation, URL construction, and API interactions
 * for the widget sharing system.
 */

import { DashboardConfig } from './widgetRegistry';

// ============================================================================
// Types
// ============================================================================

export type ShareAccessLevel = 'view' | 'clone';
export type ShareType = 'widget' | 'dashboard' | 'template';

export interface ShareConfig {
  name: string;
  description?: string;
  accessLevel: ShareAccessLevel;
  isPublic: boolean;
  requirePassword: boolean;
  password?: string;
  expiresIn?: string; // 'never' | '1d' | '7d' | '30d' | '90d'
}

export interface ShareResult {
  shareId: string;
  shareToken: string;
  shareUrl: string;
  shortUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SharedItem {
  id: string;
  shareType: ShareType;
  name: string;
  description?: string;
  ownerName?: string;
  accessLevel: ShareAccessLevel;
  isPasswordProtected: boolean;
  expiresAt?: string;
  createdAt: string;
  viewCount: number;
  cloneCount: number;
  configSnapshot: DashboardConfig | Record<string, unknown>;
}

export interface ShareAccessRequest {
  shareToken: string;
  password?: string;
}

export interface ShareAccessResponse {
  success: boolean;
  error?: string;
  item?: SharedItem;
  accessToken?: string; // JWT for authenticated access
}

export interface CloneResult {
  success: boolean;
  error?: string;
  newDashboardId?: string;
  newDashboardName?: string;
}

export interface MyShares {
  created: SharedItem[];
  received: SharedItem[];
}

// ============================================================================
// API Client
// ============================================================================

const API_BASE = '/api/share';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Share Management Functions
// ============================================================================

/**
 * Create a new share link for a dashboard or widget
 */
export async function createShare(
  shareType: ShareType,
  sourceId: string,
  config: ShareConfig,
  configSnapshot: DashboardConfig | Record<string, unknown>
): Promise<ShareResult> {
  return apiRequest<ShareResult>('/', {
    method: 'POST',
    body: JSON.stringify({
      shareType,
      sourceId,
      ...config,
      configSnapshot,
    }),
  });
}

/**
 * Access a shared item by token
 */
export async function accessShare(
  request: ShareAccessRequest
): Promise<ShareAccessResponse> {
  return apiRequest<ShareAccessResponse>(`/${request.shareToken}`, {
    method: 'POST',
    body: JSON.stringify({ password: request.password }),
  });
}

/**
 * Get shared item info (public metadata only)
 */
export async function getShareInfo(shareToken: string): Promise<SharedItem | null> {
  try {
    return await apiRequest<SharedItem>(`/${shareToken}/info`);
  } catch {
    return null;
  }
}

/**
 * Clone a shared dashboard to user's account
 */
export async function cloneSharedDashboard(
  shareToken: string,
  accessToken: string,
  newName?: string
): Promise<CloneResult> {
  return apiRequest<CloneResult>(`/${shareToken}/clone`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ newName }),
  });
}

/**
 * Revoke a share link
 */
export async function revokeShare(shareId: string): Promise<void> {
  await apiRequest(`/${shareId}`, {
    method: 'DELETE',
  });
}

/**
 * Update share settings
 */
export async function updateShare(
  shareId: string,
  updates: Partial<ShareConfig>
): Promise<SharedItem> {
  return apiRequest<SharedItem>(`/${shareId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Get all shares created by or shared with the current user
 */
export async function getMyShares(): Promise<MyShares> {
  return apiRequest<MyShares>('/my');
}

/**
 * Log access to a shared item (for analytics)
 */
export async function logShareAccess(
  shareToken: string,
  action: 'view' | 'clone'
): Promise<void> {
  await apiRequest(`/${shareToken}/log`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Build a share URL from a token
 */
export function buildShareUrl(shareToken: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';
  return `${baseUrl}/shared/${shareToken}`;
}

/**
 * Extract share token from URL
 */
export function extractShareToken(url: string): string | null {
  const match = url.match(/\/shared\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Validate share token format
 */
export function isValidShareToken(token: string): boolean {
  // Token should be 32 characters, alphanumeric with - and _
  return /^[a-zA-Z0-9_-]{16,64}$/.test(token);
}

// ============================================================================
// Expiration Helpers
// ============================================================================

const EXPIRATION_MAP: Record<string, number> = {
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

/**
 * Calculate expiration date from duration string
 */
export function calculateExpirationDate(expiresIn: string): Date | null {
  if (expiresIn === 'never') return null;
  const ms = EXPIRATION_MAP[expiresIn];
  if (!ms) return null;
  return new Date(Date.now() + ms);
}

/**
 * Check if a share has expired
 */
export function isShareExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Format expiration date for display
 */
export function formatExpiration(expiresAt?: string): string {
  if (!expiresAt) return 'Never';
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs < 0) return 'Expired';

  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return date.toLocaleDateString();
}

// ============================================================================
// Token Generation (client-side preview only, actual generation on server)
// ============================================================================

/**
 * Generate a preview token (for UI purposes)
 * Actual token generation happens server-side
 */
export function generatePreviewToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================================================
// React Query Keys
// ============================================================================

export const shareQueryKeys = {
  all: ['shares'] as const,
  my: () => [...shareQueryKeys.all, 'my'] as const,
  detail: (token: string) => [...shareQueryKeys.all, 'detail', token] as const,
  info: (token: string) => [...shareQueryKeys.all, 'info', token] as const,
};

export default {
  createShare,
  accessShare,
  getShareInfo,
  cloneSharedDashboard,
  revokeShare,
  updateShare,
  getMyShares,
  logShareAccess,
  buildShareUrl,
  extractShareToken,
  isValidShareToken,
  calculateExpirationDate,
  isShareExpired,
  formatExpiration,
};
