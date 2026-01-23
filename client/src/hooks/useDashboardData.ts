/**
 * DASHBOARD DATA HOOKS
 * Replace ALL static data imports with API calls
 * NO MORE HARDCODED DATA
 */

import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api';

// Dashboard Overview
export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/overview`);
      if (!res.ok) throw new Error('Failed to fetch dashboard overview');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Business Units
export function useBusinessUnits() {
  return useQuery({
    queryKey: ['dashboard', 'business-units'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/business-units`);
      if (!res.ok) throw new Error('Failed to fetch business units');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Portfolios
export function usePortfolios() {
  return useQuery({
    queryKey: ['dashboard', 'portfolios'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/portfolios`);
      if (!res.ok) throw new Error('Failed to fetch portfolios');
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// SAFe Data (Features, Stories, Tasks)
export function useSafeData() {
  return useQuery({
    queryKey: ['dashboard', 'safe-data'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/safe-data`);
      if (!res.ok) throw new Error('Failed to fetch SAFe data');
      return res.json();
    },
    refetchInterval: 30000,
  });
}

// OKRs
export function useOKRs() {
  return useQuery({
    queryKey: ['dashboard', 'okrs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/okrs`);
      if (!res.ok) throw new Error('Failed to fetch OKRs');
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// KPIs
export function useKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/kpis`);
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// Value Streams
export function useValueStreams() {
  return useQuery({
    queryKey: ['dashboard', 'value-streams'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/value-streams`);
      if (!res.ok) throw new Error('Failed to fetch value streams');
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// Resources
export function useResources() {
  return useQuery({
    queryKey: ['dashboard', 'resources'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/resources`);
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// Projects (from existing API)
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    refetchInterval: 30000,
  });
}

// Single Project
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID required');
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
    enabled: !!projectId,
    refetchInterval: 30000,
  });
}

// Risks
export function useRisks() {
  return useQuery({
    queryKey: ['risks'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/risks`);
      if (!res.ok) throw new Error('Failed to fetch risks');
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// Issues
export function useIssues() {
  return useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/issues`);
      if (!res.ok) throw new Error('Failed to fetch issues');
      return res.json();
    },
    refetchInterval: 30000,
  });
}
