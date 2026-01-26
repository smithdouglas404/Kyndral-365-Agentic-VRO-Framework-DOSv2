/**
 * Demo Mode Active Banner
 * Shows when user is viewing ACME demo data with industry switcher
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface DemoStatus {
  active: boolean;
  industryId?: string;
  companyId?: string;
  companyName?: string;
}

export function DemoModeActiveBanner() {
  const [demoStatus, setDemoStatus] = useState<DemoStatus>({ active: false });
  const [industries, setIndustries] = useState<any[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkDemoStatus();
    loadIndustries();
  }, []);

  const checkDemoStatus = async () => {
    try {
      const response = await fetch('/api/demo/status', {
        credentials: 'include',
      });
      const data = await response.json();
      setDemoStatus(data);
    } catch (error) {
      console.error('Error checking demo status:', error);
    }
  };

  const loadIndustries = async () => {
    try {
      const response = await fetch('/api/demo/industries');
      const data = await response.json();
      setIndustries(data);
    } catch (error) {
      console.error('Error loading industries:', error);
    }
  };

  const handleSwitchIndustry = async (industryId: string) => {
    try {
      const response = await fetch(`/api/demo/activate/${industryId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to switch industry');

      const data = await response.json();

      toast({
        title: 'Industry Switched',
        description: `Now viewing ${data.companyName}`,
      });

      // Refresh the page to load new data
      window.location.reload();
    } catch (error) {
      console.error('Error switching industry:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch industry',
        variant: 'destructive',
      });
    }
  };

  const handleExitDemo = async () => {
    try {
      await fetch('/api/demo/deactivate', {
        method: 'POST',
        credentials: 'include',
      });

      toast({
        title: 'Demo Mode Exited',
        description: 'Returning to login',
      });

      setLocation('/login');
    } catch (error) {
      console.error('Error exiting demo:', error);
    }
  };

  if (!demoStatus.active) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <span className="font-semibold">Demo Mode Active</span>
            <span className="mx-2">•</span>
            <span className="text-sm opacity-90">{demoStatus.companyName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-orange-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch Industry
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              {industries.map((industry) => (
                <DropdownMenuItem
                  key={industry.id}
                  onClick={() => handleSwitchIndustry(industry.id)}
                  className={industry.id === demoStatus.industryId ? 'bg-orange-50' : ''}
                >
                  <div>
                    <div className="font-medium">{industry.name}</div>
                    <div className="text-xs text-muted-foreground">{industry.companyName}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitDemo}
            className="text-white hover:bg-orange-700"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
