import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, Building2, MapPin, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyCandidate } from '@/pages/SetupWizard';

interface CompanyDiscoveryProps {
  onCandidateSelected: (candidate: CompanyCandidate) => void;
}

export function CompanyDiscovery({ onCandidateSelected }: CompanyDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [filters, setFilters] = useState<{
    country?: string;
    state?: string;
  }>({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setSearching(true);
    setCandidates([]);

    try {
      const response = await fetch('/api/company-profile/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery, filters })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setCandidates(data.candidates);

      if (data.candidates.length === 0) {
        toast.info('No companies found. Try a different search term.');
      } else {
        toast.success(`Found ${data.candidates.length} matching companies`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search companies');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (candidate: CompanyCandidate) => {
    onCandidateSelected(candidate);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Find Your Company</h2>
        <p className="text-muted-foreground">
          We'll search public databases to find your company profile
        </p>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Company Name</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="search"
              type="text"
              placeholder="e.g., Enterprise, Apple Inc., Microsoft"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Spinner className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>
        </div>

        {/* Optional Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="country" className="text-xs">Country (optional)</Label>
            <Input
              id="country"
              type="text"
              placeholder="USA, UK, etc."
              value={filters.country || ''}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="state" className="text-xs">State/Region (optional)</Label>
            <Input
              id="state"
              type="text"
              placeholder="CA, FL, etc."
              value={filters.state || ''}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {searching && (
        <div className="text-center py-12">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Searching public databases...</p>
        </div>
      )}

      {/* Results */}
      {!searching && candidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Found {candidates.length} matches:</h3>
            <Button variant="ghost" size="sm" onClick={() => setCandidates([])}>
              Clear Results
            </Button>
          </div>

          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
                onClick={() => handleSelect(candidate)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold">{candidate.legalName}</h4>
                      {candidate.entityIdentifiers.ticker && (
                        <Badge variant="secondary" className="text-xs">
                          {candidate.entityIdentifiers.ticker}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {candidate.headquarters.city}
                        {candidate.headquarters.state && `, ${candidate.headquarters.state}`}
                        {' • '}
                        {candidate.headquarters.country}
                      </div>

                      {candidate.industryCodes.gics && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {candidate.industryCodes.gics.industry}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {candidate.dataSources.map((source) => (
                        <Badge key={source} variant="outline" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                      <Badge
                        variant={candidate.confidenceScore > 0.85 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {Math.round(candidate.confidenceScore * 100)}% match
                      </Badge>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searching && candidates.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No results yet</h3>
          <p className="text-muted-foreground text-sm">
            Enter your company name above to start searching
          </p>
        </div>
      )}
    </div>
  );
}
