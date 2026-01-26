import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2,
  MapPin,
  FileText,
  Calendar,
  Edit,
  Plus,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyCandidate, CompanyProfile } from '@/pages/SetupWizard';

interface CompanyPreviewProps {
  candidate: CompanyCandidate;
  onConfirm: (profile: CompanyProfile, companyId: string) => void;
  onBack: () => void;
}

export function CompanyPreview({ candidate, onConfirm, onBack }: CompanyPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [enrichedProfile, setEnrichedProfile] = useState<CompanyProfile | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [businessSummary, setBusinessSummary] = useState('');
  const [orgTerminology, setOrgTerminology] = useState({
    primary: 'business_unit' as 'business_unit' | 'segment' | 'division',
    alternatives: [] as string[]
  });
  const [orgUnits, setOrgUnits] = useState<Array<{ name: string; type: string }>>([]);
  const [newUnitName, setNewUnitName] = useState('');

  useEffect(() => {
    enrichProfile();
  }, []);

  const enrichProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/company-profile/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate })
      });

      if (!response.ok) {
        throw new Error('Failed to enrich profile');
      }

      const profile: CompanyProfile = await response.json();
      setEnrichedProfile(profile);
      setBusinessSummary(profile.company.businessSummary || '');
      setOrgUnits(profile.organizationalUnits || []);
    } catch (error: any) {
      console.error('Enrichment error:', error);
      toast.error('Failed to fetch company details');
    } finally {
      setLoading(false);
    }
  };

  const addOrgUnit = () => {
    if (newUnitName.trim()) {
      setOrgUnits([...orgUnits, { name: newUnitName, type: orgTerminology.primary }]);
      setNewUnitName('');
    }
  };

  const removeOrgUnit = (index: number) => {
    setOrgUnits(orgUnits.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!enrichedProfile) return;

    setLoading(true);
    try {
      // Create company profile
      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyData: {
            legalName: enrichedProfile.company.legalName,
            tradeNames: enrichedProfile.company.doingBusinessAs ? [enrichedProfile.company.doingBusinessAs] : [],
            headquarters: enrichedProfile.company.headquarters,
            primaryNaicsCode: enrichedProfile.company.industryCodes.naics?.[0],
            gicsSector: enrichedProfile.company.industryCodes.gics?.sector,
            gicsIndustry: enrichedProfile.company.industryCodes.gics?.industry,
            businessSummary,
            latestAnnualReportUrl: enrichedProfile.latestAnnualReport?.url,
            latestAnnualReportDate: enrichedProfile.latestAnnualReport?.date,
            fiscalYearEnd: 'December 31', // Default, can be edited
            reportingCurrency: 'USD', // Default, can be edited
            orgStructureTerminology: orgTerminology
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create company profile');
      }

      const company = await response.json();

      toast.success('Company profile created!');
      onConfirm(enrichedProfile, company.id);
    } catch (error: any) {
      console.error('Creation error:', error);
      toast.error(error.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  if (loading || !enrichedProfile) {
    return (
      <div className="text-center py-12">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading company details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Company Profile Preview</h2>
          <p className="text-muted-foreground">
            Review and confirm your company information
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
          <Edit className="w-4 h-4" />
          {editMode ? 'Cancel Edit' : 'Edit'}
        </Button>
      </div>

      {/* Company Info */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">{enrichedProfile.company.legalName}</h3>
            {enrichedProfile.company.entityIdentifiers.ticker && (
              <Badge>{enrichedProfile.company.entityIdentifiers.ticker}</Badge>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <div>{enrichedProfile.company.headquarters.fullAddress ||
                `${enrichedProfile.company.headquarters.city}, ${enrichedProfile.company.headquarters.state || enrichedProfile.company.headquarters.country}`}
              </div>
            </div>
          </div>

          {enrichedProfile.company.industryCodes.gics && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Industry:</span>
              <Badge variant="outline">
                {enrichedProfile.company.industryCodes.gics.industry}
              </Badge>
              <span className="text-muted-foreground text-xs">
                GICS: {enrichedProfile.company.industryCodes.gics.code}
              </span>
            </div>
          )}
        </div>

        {/* Business Summary */}
        <div>
          <Label htmlFor="summary">Business Summary</Label>
          {editMode ? (
            <Textarea
              id="summary"
              value={businessSummary}
              onChange={(e) => setBusinessSummary(e.target.value)}
              className="mt-1"
              rows={4}
              placeholder="Brief description of what the company does..."
            />
          ) : (
            <p className="mt-1 text-sm p-3 border rounded-lg bg-muted/30">
              {businessSummary || 'No summary available'}
            </p>
          )}
        </div>

        {/* Latest Annual Report */}
        {enrichedProfile.latestAnnualReport && (
          <div className="border rounded-lg p-4 bg-accent/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Latest Annual Report</h4>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">{enrichedProfile.latestAnnualReport.type}</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(enrichedProfile.latestAnnualReport.date).toLocaleDateString()}
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={enrichedProfile.latestAnnualReport.url} target="_blank" rel="noopener noreferrer">
                  View Report
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Organizational Structure */}
        <div className="space-y-3">
          <div>
            <Label>Organizational Structure</Label>
            <p className="text-xs text-muted-foreground mt-1">
              What do you call your major organizational units?
            </p>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={orgTerminology.primary === 'business_unit'}
                onCheckedChange={() => setOrgTerminology({ ...orgTerminology, primary: 'business_unit' })}
                disabled={!editMode}
              />
              <span className="text-sm">Business Units</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={orgTerminology.primary === 'segment'}
                onCheckedChange={() => setOrgTerminology({ ...orgTerminology, primary: 'segment' })}
                disabled={!editMode}
              />
              <span className="text-sm">Segments</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={orgTerminology.primary === 'division'}
                onCheckedChange={() => setOrgTerminology({ ...orgTerminology, primary: 'division' })}
                disabled={!editMode}
              />
              <span className="text-sm">Divisions</span>
            </label>
          </div>

          <div>
            <Label>Detected Units:</Label>
            <div className="space-y-2 mt-2">
              {orgUnits.map((unit, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm font-medium">{unit.name}</span>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrgUnit(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              {editMode && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add organizational unit"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addOrgUnit()}
                  />
                  <Button variant="outline" onClick={addOrgUnit}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={enrichProfile}>
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? <Spinner className="w-4 h-4" /> : 'Looks Good - Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
