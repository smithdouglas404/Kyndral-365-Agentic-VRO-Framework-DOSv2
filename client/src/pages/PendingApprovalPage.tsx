/**
 * PENDING APPROVAL PAGE
 * 
 * Shown to demo users whose request is still pending admin approval.
 * They can see their request status and wait for approval.
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Building2, Mail, RefreshCw } from 'lucide-react';

interface DemoStatusResponse {
  isDemoUser: boolean;
  status?: string;
  isApproved?: boolean;
  demoIndustry?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  createdAt?: string;
  message?: string;
}

export default function PendingApprovalPage() {
  const [, setLocation] = useLocation();

  const { data: demoStatus, isLoading, refetch } = useQuery<DemoStatusResponse>({
    queryKey: ['demo-request-status'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { isDemoUser: false };
      }
      
      const response = await fetch('/api/tenant-auth/demo-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        return { isDemoUser: false };
      }
      return response.json();
    },
    staleTime: 10 * 1000, // Check every 10 seconds
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  });

  // Redirect to dashboard if approved
  useEffect(() => {
    if (demoStatus?.isApproved) {
      setLocation('/dashboard');
    }
  }, [demoStatus?.isApproved, setLocation]);

  // Redirect if not a demo user
  useEffect(() => {
    if (!isLoading && !demoStatus?.isDemoUser) {
      setLocation('/demo');
    }
  }, [isLoading, demoStatus?.isDemoUser, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const industryLabels: Record<string, string> = {
    'energy-utilities': 'Energy & Utilities',
    'technology': 'Technology',
    'healthcare': 'Healthcare',
    'financial-services': 'Financial Services',
    'manufacturing': 'Manufacturing',
    'retail-ecommerce': 'Retail & E-commerce',
    'telecommunications': 'Telecommunications',
    'transportation-logistics': 'Transportation & Logistics',
    'realestate-construction': 'Real Estate & Construction',
    'pharma-biotech': 'Pharma & Biotech',
    'consumer-products': 'Consumer Products',
    'media-entertainment': 'Media & Entertainment',
    'hospitality-tourism': 'Hospitality & Tourism',
    'agriculture-food': 'Agriculture & Food',
    'education': 'Education',
    'professional-services': 'Professional Services',
    'insurance': 'Insurance',
    'automotive': 'Automotive',
    'aerospace-defense': 'Aerospace & Defense',
    'mining-materials': 'Mining & Materials',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle className="text-2xl text-white">Demo Request Pending</CardTitle>
          <CardDescription className="text-slate-400">
            Your demo access request is being reviewed by an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{demoStatus?.email || 'Not provided'}</p>
              </div>
            </div>
            
            {demoStatus?.companyName && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Company</p>
                  <p className="text-white">{demoStatus.companyName}</p>
                </div>
              </div>
            )}
            
            {demoStatus?.demoIndustry && (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Selected Industry</p>
                  <p className="text-white">
                    {industryLabels[demoStatus.demoIndustry] || demoStatus.demoIndustry}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-400 text-sm">
              Once approved, you'll have access to the ACME {industryLabels[demoStatus?.demoIndustry || ''] || ''} demo environment 
              with 10 realistic projects, agent interventions, and live data.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => refetch()}
              variant="outline" 
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="button-refresh-status"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>
            
            <p className="text-center text-xs text-slate-500">
              Status checks automatically every 10 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
