/**
 * ROLE-BASED ACCESS CONTROL HOOK
 *
 * Provides role-based navigation filtering and page access checks
 */

import { useMemo } from 'react';

export type UserRole =
  | 'pm'              // Project Manager
  | 'vro'             // Value Realization Office
  | 'tmo'             // Timeline Management Office
  | 'finops'          // Financial Operations
  | 'risk'            // Risk Management
  | 'governance'      // Governance & Compliance
  | 'ocm'             // Organizational Change Management
  | 'executive'       // Executive Leadership
  | 'system_admin';   // System Administrator

interface RoleWorkspace {
  allowedPages: string[];
  homePage: string;
  displayName: string;
}

const ROLE_WORKSPACES: Record<UserRole, RoleWorkspace> = {
  pm: {
    allowedPages: [
      '/workspace/pm',
      '/workspace/executive', // PMs can view executive dashboard
      '/project/:id',
    ],
    homePage: '/workspace/pm',
    displayName: 'Project Manager',
  },
  vro: {
    allowedPages: [
      '/workspace/executive',
      '/workspace/pm',
      '/project/:id',
    ],
    homePage: '/workspace/executive',
    displayName: 'Value Realization Office',
  },
  tmo: {
    allowedPages: [
      '/workspace/tmo',
      '/workspace/executive',
      '/workspace/planning',
      '/project/:id',
    ],
    homePage: '/workspace/tmo',
    displayName: 'Timeline Management Office',
  },
  finops: {
    allowedPages: [
      '/workspace/finops',
      '/workspace/executive',
      '/project/:id',
    ],
    homePage: '/workspace/finops',
    displayName: 'Financial Operations',
  },
  risk: {
    allowedPages: [
      '/workspace/pm',
      '/workspace/governance',
      '/workspace/executive',
      '/project/:id',
    ],
    homePage: '/workspace/governance',
    displayName: 'Risk Management',
  },
  governance: {
    allowedPages: [
      '/workspace/governance',
      '/workspace/executive',
      '/workspace/admin',
      '/project/:id',
    ],
    homePage: '/workspace/governance',
    displayName: 'Governance & Compliance',
  },
  ocm: {
    allowedPages: [
      '/workspace/ocm',
      '/workspace/executive',
      '/workspace/tmo',
      '/project/:id',
    ],
    homePage: '/workspace/ocm',
    displayName: 'Organizational Change Management',
  },
  executive: {
    allowedPages: ['*'], // Full access
    homePage: '/workspace/executive',
    displayName: 'Executive Leadership',
  },
  system_admin: {
    allowedPages: ['*'], // Full access
    homePage: '/workspace/admin',
    displayName: 'System Administrator',
  },
};

export function useRoleBasedAccess(userRole?: string) {
  const role = (userRole || 'pm') as UserRole;

  const workspace = useMemo(() => {
    return ROLE_WORKSPACES[role] || ROLE_WORKSPACES.pm;
  }, [role]);

  const canAccessPage = (path: string): boolean => {
    // Full access roles
    if (workspace.allowedPages.includes('*')) {
      return true;
    }

    // Check exact match
    if (workspace.allowedPages.includes(path)) {
      return true;
    }

    // Check pattern match (e.g., /project/:id)
    const matchesPattern = workspace.allowedPages.some(allowedPath => {
      if (allowedPath.includes(':')) {
        const pattern = allowedPath.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      }
      return false;
    });

    return matchesPattern;
  };

  const getHomePage = (): string => {
    return workspace.homePage;
  };

  const getAllowedPages = (): string[] => {
    return workspace.allowedPages;
  };

  const getDisplayName = (): string => {
    return workspace.displayName;
  };

  return {
    role,
    workspace,
    canAccessPage,
    getHomePage,
    getAllowedPages,
    getDisplayName,
  };
}

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(
  navItems: Array<{ path: string; label: string; [key: string]: any }>,
  userRole: string
): Array<{ path: string; label: string; [key: string]: any }> {
  const { canAccessPage } = useRoleBasedAccess(userRole);

  return navItems.filter(item => canAccessPage(item.path));
}

/**
 * Get all available roles for admin UI
 */
export function getAllRoles(): Array<{ id: UserRole; name: string }> {
  return Object.entries(ROLE_WORKSPACES).map(([id, workspace]) => ({
    id: id as UserRole,
    name: workspace.displayName,
  }));
}
