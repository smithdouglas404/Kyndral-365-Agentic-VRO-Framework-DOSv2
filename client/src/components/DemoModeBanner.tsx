/**
 * DEMO MODE BANNER
 *
 * Displayed at the top of the app when the system is in demo mode:
 * - No active company profile configured
 * - Company status is 'demo'
 *
 * Provides clear indication and easy path to complete setup.
 */

import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCompanyProfile } from '@/contexts/CompanyProfileContext';
import { Button } from '@/components/ui/button';

export function DemoModeBanner() {
  const { isDemoMode, isDemoUser, isLoading } = useCompanyProfile();
  const [, setLocation] = useLocation();

  // Don't show if loading or not in demo mode
  // Also don't show for demo users - they use DemoModeActiveBanner instead
  if (isLoading || !isDemoMode || isDemoUser) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              You're viewing demo data
            </p>
            <p className="text-xs opacity-90">
              Configure your company profile to unlock the full power of the platform
            </p>
          </div>
        </div>

        <Button
          onClick={() => setLocation('/setup')}
          size="sm"
          className="bg-white text-orange-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
