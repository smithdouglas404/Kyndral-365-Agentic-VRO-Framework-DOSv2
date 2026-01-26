import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Target,
  Shield,
  TrendingUp,
  Building2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface GeneratedKitProps {
  companyId: string;
}

export function GeneratedKit({ companyId }: GeneratedKitProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch(`/api/company-profile/${companyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch company profile');
      }

      const data = await response.json();
      setCompanyProfile(data);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);

    try {
      const response = await fetch(`/api/company-profile/${companyId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to activate profile');
      }

      toast.success('Company profile activated!');

      // Navigate to dashboard
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    } catch (error: any) {
      console.error('Activation error:', error);
      toast.error(error.message || 'Failed to activate profile');
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!companyProfile) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h3 className="font-semibold mb-2">Profile Not Found</h3>
        <p className="text-sm text-muted-foreground">Unable to load company profile</p>
      </div>
    );
  }

  const stats = {
    organizationalUnits: companyProfile.organizationalUnits?.length || 0,
    metrics: companyProfile.metrics?.length || 0,
    objectives: companyProfile.strategicObjectives?.length || 0,
    // These would come from other endpoints
    rules: 0, // TODO: fetch from company_rules
    risks: 0, // TODO: fetch from risks
    dashboards: 4 // Auto-generated dashboards
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Your System is Ready!</h2>
        <p className="text-muted-foreground">
          We've configured your PPM system with {companyProfile.legalName}'s information
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.organizationalUnits}</div>
          <div className="text-xs text-muted-foreground">Value Streams / Business Units</div>
        </Card>

        <Card className="p-4 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.metrics}</div>
          <div className="text-xs text-muted-foreground">KPIs & Metrics</div>
        </Card>

        <Card className="p-4 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.objectives}</div>
          <div className="text-xs text-muted-foreground">Strategic OKRs</div>
        </Card>

        <Card className="p-4 text-center">
          <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.rules}</div>
          <div className="text-xs text-muted-foreground">Governance Rules</div>
        </Card>

        <Card className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.risks}</div>
          <div className="text-xs text-muted-foreground">Risk Factors</div>
        </Card>

        <Card className="p-4 text-center">
          <LayoutDashboard className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{stats.dashboards}</div>
          <div className="text-xs text-muted-foreground">Auto-Generated Dashboards</div>
        </Card>
      </div>

      {/* What's Been Created */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">What We've Created:</h3>

        <div className="space-y-3">
          {/* Dashboards */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">📊 Starter Dashboards ({stats.dashboards})</h4>
            </div>
            <ul className="text-sm text-muted-foreground ml-7 space-y-1">
              <li>• Executive Overview - Financial performance, strategic OKRs, risks</li>
              {companyProfile.organizationalUnits?.map((unit: any) => (
                <li key={unit.id}>• {unit.unitName} Dashboard - Unit-specific KPIs and projects</li>
              ))}
              <li>• Portfolio Risk Monitor - Risk tracking and mitigation status</li>
            </ul>
          </div>

          {/* Rules */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">📋 Policy-as-Code Rules ({stats.rules})</h4>
            </div>
            <ul className="text-sm text-muted-foreground ml-7 space-y-1">
              <li>• Governance policies extracted from annual report</li>
              <li>• Approval thresholds and workflows</li>
              <li>• Compliance requirements</li>
              <li className="italic mt-2">These rules are now actively enforced in the system</li>
            </ul>
          </div>

          {/* Metrics */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">🎯 Pre-Populated Metrics ({stats.metrics})</h4>
            </div>
            <ul className="text-sm text-muted-foreground ml-7 space-y-1">
              <li>• Financial KPIs (Revenue, Margin, Profit by segment)</li>
              <li>• Operational metrics (industry-specific)</li>
              <li>• Strategic objectives with targets</li>
              <li className="italic mt-2">Ready to start tracking progress</li>
            </ul>
          </div>

          {/* Org Structure */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">🏢 Organizational Hierarchy ({stats.organizationalUnits})</h4>
            </div>
            <ul className="text-sm text-muted-foreground ml-7 space-y-1">
              {companyProfile.organizationalUnits?.map((unit: any) => (
                <li key={unit.id}>• {unit.unitName} ({unit.unitType})</li>
              ))}
              <li className="italic mt-2">Mapped to SAFe Value Streams and ARTs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-primary" />
          Next Steps:
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">1.</span>
            <span>Activate your company profile to start using the system</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">2.</span>
            <span>Explore your auto-generated dashboards</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">3.</span>
            <span>Create your first Epic or Project</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">4.</span>
            <span>Invite team members from Admin {'>'} User Management</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">5.</span>
            <span>Customize metrics and OKRs in Admin {'>'} Company Profile</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={() => setLocation('/admin/company-profile')}>
          <FileText className="w-4 h-4" />
          Review in Admin
        </Button>
        <Button
          size="lg"
          onClick={handleActivate}
          disabled={activating}
          className="px-8"
        >
          {activating ? (
            <>
              <Spinner className="w-4 h-4" />
              Activating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Activate & Go to Dashboard
            </>
          )}
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          You can always re-run extraction or update your profile in{' '}
          <strong>Admin {'>'} Company Profile</strong>
        </p>
      </div>
    </div>
  );
}
