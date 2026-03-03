/**
 * COMPANY PROFILE CONTEXT
 *
 * Provides the active company profile to all components
 * - Loads active company on app startup
 * - Falls back to Enterprise demo data if no active company
 * - Makes the system truly white-label
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface CompanyInfo {
  id: string;
  legalName: string;
  tradeNames?: any;
  headquarters: any;
  industry?: string;
  businessSummary?: string;
  missionStatement?: string;
  fiscalYearEnd?: string;
  reportingCurrency?: string;
  status?: 'demo' | 'draft' | 'active'; // Company status
}

interface OrganizationalUnit {
  id: string;
  name: string;
  type: string;
  code?: string;
  description?: string;
  parentId?: string;
  revenueContribution?: number;
  operatingIncomeContribution?: number;
}

interface Metric {
  id: string;
  name: string;
  category?: string;
  unitOfMeasure?: string;
  targetValue?: number;
  currentValue?: number;
  thresholds?: any;
  frequency?: string;
  owner?: string;
}

interface Objective {
  id: string;
  title: string;
  category?: string;
  timeframe?: string;
  targetDate?: string;
  currentProgress?: number;
  status?: string;
  keyResults?: any[];
}

interface Rule {
  id: string;
  name: string;
  category?: string;
  description?: string;
  enforcementLevel?: string;
  isActive: boolean;
}

export interface CompanyProfile {
  active: boolean;
  company?: CompanyInfo;
  organizationalUnits: OrganizationalUnit[];
  metrics: Metric[];
  objectives: Objective[];
  rules: Rule[];
  meta?: {
    extractedAt?: string;
    approvedAt?: string;
    confidence?: number;
  };
}

interface DemoRequestStatus {
  isDemoUser: boolean;
  demoRequestId?: string;
  status?: string; // 'requested' | 'demo_active' | 'contacted' | 'converted'
  isApproved?: boolean;
  demoIndustry?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  message?: string;
}

interface CompanyProfileContextValue {
  profile: CompanyProfile | null;
  isLoading: boolean;
  error: Error | null;
  hasActiveCompany: boolean;
  isDemoMode: boolean; // True if no active company or status is 'demo'
  isDemoUser: boolean; // True if current user is a demo user
  isDemoApproved: boolean; // True if demo request is approved (status = 'demo_active')
  demoIndustry: string | null; // Selected demo industry
  demoStatus: DemoRequestStatus | null; // Full demo request status
  refresh: () => void;
}

const CompanyProfileContext = createContext<CompanyProfileContextValue | undefined>(undefined);

interface DemoSessionStatus {
  active: boolean;
  industryId?: string;
  companyId?: string;
  companyName?: string;
}

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  // Return static profile - all data comes from Palantir, no PostgreSQL
  const profile: CompanyProfile = {
    active: true,
    company: {
      id: 'palantir-demo',
      legalName: 'Enterprise Portfolio',
      headquarters: { city: 'New York', country: 'USA' },
      industry: 'Technology',
      status: 'active',
    },
    organizationalUnits: [],
    metrics: [],
    objectives: [],
    rules: [],
  };
  const isLoadingProfile = false;
  const error = null;
  const refetch = () => {};

  // No PostgreSQL - static demo status
  const demoSessionStatus: DemoSessionStatus = { active: false };
  const isLoadingDemoSession = false;

  // No PostgreSQL - static demo request status
  const demoRequestStatus: DemoRequestStatus = { isDemoUser: false };
  const isLoadingDemoRequest = false;
  const refetchDemoStatus = () => {};

  const isLoading = isLoadingProfile || isLoadingDemoSession || isLoadingDemoRequest;

  // Determine if this is a demo user and if they're approved
  const isDemoUser = demoRequestStatus?.isDemoUser ?? false;
  const isDemoApproved = demoRequestStatus?.isApproved ?? false;
  const demoIndustry = demoRequestStatus?.demoIndustry ?? null;

  // hasActiveCompany is true if:
  // 1. There's an active company in the database (real tenant), OR
  // 2. Demo user with APPROVED status (demo_active) - must be approved to access data
  // Note: Legacy cookie-based demo sessions are only valid for non-demo-token users
  const hasActiveCompany = (profile?.active ?? false) || 
    (isDemoUser && isDemoApproved) ||
    (!isDemoUser && (demoSessionStatus?.active ?? false)); // Legacy session only if not using token auth

  const isDemoMode = isDemoUser || 
    (!isDemoUser && demoSessionStatus?.active) || 
    (!profile?.active) || 
    profile?.company?.status === 'demo';

  const value: CompanyProfileContextValue = {
    profile: profile ?? null,
    isLoading,
    error: error as Error | null,
    hasActiveCompany,
    isDemoMode,
    isDemoUser,
    isDemoApproved,
    demoIndustry,
    demoStatus: demoRequestStatus ?? null,
    refresh: () => {
      refetch();
      refetchDemoStatus();
    },
  };

  return (
    <CompanyProfileContext.Provider value={value}>
      {children}
    </CompanyProfileContext.Provider>
  );
}

/**
 * Hook to access the active company profile
 */
export function useCompanyProfile() {
  const context = useContext(CompanyProfileContext);
  if (context === undefined) {
    throw new Error('useCompanyProfile must be used within CompanyProfileProvider');
  }
  return context;
}

/**
 * Hook to get company name (active company or fallback)
 */
export function useCompanyName(): string {
  const { profile, hasActiveCompany } = useCompanyProfile();

  if (hasActiveCompany && profile?.company) {
    return profile.company.legalName;
  }

  return 'ACME Corporation'; // Fallback to generic demo company (white-label)
}

/**
 * Hook to get organizational units (active company or fallback)
 */
export function useOrganizationalUnits(): OrganizationalUnit[] {
  const { profile, hasActiveCompany } = useCompanyProfile();

  if (hasActiveCompany && profile?.organizationalUnits) {
    return profile.organizationalUnits;
  }

  // Fallback to demo data
  return [];
}

/**
 * Hook to get metrics (active company or fallback)
 */
export function useMetrics(): Metric[] {
  const { profile, hasActiveCompany } = useCompanyProfile();

  if (hasActiveCompany && profile?.metrics) {
    return profile.metrics;
  }

  return [];
}

/**
 * Hook to get strategic objectives (active company or fallback)
 */
export function useObjectives(): Objective[] {
  const { profile, hasActiveCompany } = useCompanyProfile();

  if (hasActiveCompany && profile?.objectives) {
    return profile.objectives;
  }

  return [];
}

/**
 * Hook to get active governance rules
 */
export function useGovernanceRules(): Rule[] {
  const { profile, hasActiveCompany } = useCompanyProfile();

  if (hasActiveCompany && profile?.rules) {
    return profile.rules;
  }

  return [];
}
