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
      '/cop',
      '/dashboard',
      '/projects',
      '/project/:id',
      '/issues',
      '/change-requests',
      '/collaboration',
      '/analytics',
      '/reports',
    ],
    homePage: '/cop',
    displayName: 'Project Manager',
  },
  vro: {
    allowedPages: [
      '/dashboard',
      '/cop',
      '/vro-framework',
      '/value-proposition',
      '/analytics',
      '/reports',
      '/projects',
      '/project/:id',
    ],
    homePage: '/dashboard',
    displayName: 'Value Realization Office',
  },
  tmo: {
    allowedPages: [
      '/dashboard-tmo',
      '/cop',
      '/resources',
      '/programs',
      '/analytics',
      '/reports',
      '/projects',
      '/project/:id',
    ],
    homePage: '/dashboard-tmo',
    displayName: 'Timeline Management Office',
  },
  finops: {
    allowedPages: [
      '/dashboard-finops',
      '/cop',
      '/financial',
      '/financial-advanced',
      '/reports',
      '/analytics',
      '/projects',
      '/project/:id',
    ],
    homePage: '/dashboard-finops',
    displayName: 'Financial Operations',
  },
  risk: {
    allowedPages: [
      '/risk',
      '/risks',
      '/cop',
      '/analytics',
      '/reports',
      '/projects',
      '/project/:id',
    ],
    homePage: '/risk',
    displayName: 'Risk Management',
  },
  governance: {
    allowedPages: [
      '/dashboard-governance',
      '/cop',
      '/admin/workflows',
      '/admin/custom-fields',
      '/compliance',
      '/reports',
      '/projects',
      '/project/:id',
    ],
    homePage: '/dashboard-governance',
    displayName: 'Governance & Compliance',
  },
  ocm: {
    allowedPages: [
      '/dashboard-ocm',
      '/cop',
      '/collaboration',
      '/stakeholder-management',
      '/analytics',
      '/projects',
      '/project/:id',
    ],
    homePage: '/dashboard-ocm',
    displayName: 'Organizational Change Management',
  },
  executive: {
    allowedPages: ['*'], // Full access
    homePage: '/cop',
    displayName: 'Executive Leadership',
  },
  system_admin: {
    allowedPages: ['*'], // Full access
    homePage: '/admin',
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
