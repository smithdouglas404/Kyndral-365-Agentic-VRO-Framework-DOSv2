/**
 * COMPANY PROFILE CONTEXT
 *
 * Provides the active company profile to all components
 * - Loads active company on app startup
 * - Falls back to Enterprise demo data if no active company
 * - Makes the system truly white-label
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

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

interface CompanyProfileContextValue {
  profile: CompanyProfile | null;
  isLoading: boolean;
  error: Error | null;
  hasActiveCompany: boolean;
  isDemoMode: boolean; // True if no active company or status is 'demo'
  refresh: () => void;
}

const CompanyProfileContext = createContext<CompanyProfileContextValue | undefined>(undefined);

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const { data: profile, isLoading, error, refetch } = useQuery<CompanyProfile>({
    queryKey: ['company-profile', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/company-profile/active');
      if (!response.ok) {
        throw new Error('Failed to fetch active company profile');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const hasActiveCompany = profile?.active ?? false;
  const isDemoMode = !hasActiveCompany || profile?.company?.status === 'demo';

  const value: CompanyProfileContextValue = {
    profile: profile ?? null,
    isLoading,
    error: error as Error | null,
    hasActiveCompany,
    isDemoMode,
    refresh: () => refetch(),
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
