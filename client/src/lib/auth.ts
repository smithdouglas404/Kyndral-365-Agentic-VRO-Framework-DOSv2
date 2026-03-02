/**
 * CENTRALIZED AUTH TOKEN MANAGEMENT
 * Single source of truth for token storage/retrieval
 * Standardizes on 'accessToken' as the primary key
 */

// Token storage keys - use these constants everywhere
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  AUTH_USER: 'auth_user',
  AUTH_TENANT: 'auth_tenant',
  DEMO_MODE: 'demoMode',
} as const;

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
}

/**
 * Get the refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
}

/**
 * Store access token (and optionally refresh token)
 */
export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

/**
 * Store user data
 */
export function setAuthUser(user: any): void {
  localStorage.setItem(TOKEN_KEYS.AUTH_USER, JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getAuthUser(): any | null {
  const data = localStorage.getItem(TOKEN_KEYS.AUTH_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Store tenant data
 */
export function setAuthTenant(tenant: any): void {
  if (tenant) {
    localStorage.setItem(TOKEN_KEYS.AUTH_TENANT, JSON.stringify(tenant));
  }
}

/**
 * Get stored tenant data
 */
export function getAuthTenant(): any | null {
  const data = localStorage.getItem(TOKEN_KEYS.AUTH_TENANT);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Set demo mode flag
 */
export function setDemoMode(isDemo: boolean): void {
  if (isDemo) {
    localStorage.setItem(TOKEN_KEYS.DEMO_MODE, 'true');
  } else {
    localStorage.removeItem(TOKEN_KEYS.DEMO_MODE);
  }
}

/**
 * Check if in demo mode
 */
export function isDemoMode(): boolean {
  return localStorage.getItem(TOKEN_KEYS.DEMO_MODE) === 'true';
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.AUTH_USER);
  localStorage.removeItem(TOKEN_KEYS.AUTH_TENANT);
  localStorage.removeItem(TOKEN_KEYS.DEMO_MODE);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
