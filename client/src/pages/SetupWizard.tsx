import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CompanyDiscovery } from '@/components/setup/CompanyDiscovery';
import { CompanyPreview } from '@/components/setup/CompanyPreview';
import { OntologyMapping } from '@/components/setup/OntologyMapping';
import { ReviewExtraction } from '@/components/setup/ReviewExtraction';
import { GeneratedKit } from '@/components/setup/GeneratedKit';
import { Check, Sparkles } from 'lucide-react';

export interface CompanyCandidate {
  legalName: string;
  doingBusinessAs?: string;
  headquarters: {
    city: string;
    state?: string;
    country: string;
    fullAddress?: string;
  };
  industryCodes: {
    naics?: string[];
    sic?: string[];
    gics?: {
      sector: string;
      industryGroup: string;
      industry: string;
      subIndustry: string;
      code: string;
    };
  };
  entityIdentifiers: {
    lei?: string;
    cik?: string;
    ticker?: string;
    companyNumber?: string;
  };
  confidenceScore: number;
  dataSources: string[];
}

export interface CompanyProfile extends CompanyCandidate {
  latestAnnualReport?: {
    url: string;
    date: string;
    type: string;
  };
  businessSummary?: string;
  organizationalUnits?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

const STEPS = [
  { id: 1, name: 'Company Discovery', description: 'Search and select your company' },
  { id: 2, name: 'Company Profile', description: 'Review and confirm details' },
  { id: 3, name: 'Extracting Data', description: 'AI analyzes your annual report' },
  { id: 4, name: 'Review Data', description: 'Approve extracted information' },
  { id: 5, name: 'Complete', description: 'Your system is configured' },
];

export default function SetupWizard() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<CompanyCandidate | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const progress = (currentStep / STEPS.length) * 100;

  const handleCandidateSelected = (candidate: CompanyCandidate) => {
    setSelectedCandidate(candidate);
    setCurrentStep(2);
  };

  const handleProfileConfirmed = (profile: CompanyProfile, createdCompanyId: string) => {
    setCompanyProfile(profile);
    setCompanyId(createdCompanyId);
    setCurrentStep(3);
  };

  const handleExtractionStarted = (jobId: string) => {
    setExtractionJobId(jobId);
  };

  const handleExtractionComplete = () => {
    setCurrentStep(4);
  };

  const handleReviewComplete = () => {
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Profile Setup</h1>
            <p className="text-muted-foreground">
              Let's configure your PPM system with your company's information
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/demo')}
            className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          >
            <Sparkles className="w-4 h-4" />
            Skip to Demo
          </Button>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 p-6">
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center flex-1 ${
                  step.id < currentStep ? 'text-primary' : step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 ${
                    step.id < currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{step.name}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Step Content */}
        <Card className="p-6">
          {currentStep === 1 && (
            <CompanyDiscovery onCandidateSelected={handleCandidateSelected} />
          )}

          {currentStep === 2 && selectedCandidate && (
            <CompanyPreview
              candidate={selectedCandidate}
              onConfirm={handleProfileConfirmed}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && companyProfile && companyId && (
            <OntologyMapping
              companyProfile={companyProfile}
              companyId={companyId}
              onExtractionStarted={handleExtractionStarted}
              onExtractionComplete={handleExtractionComplete}
            />
          )}

          {currentStep === 4 && companyId && extractionJobId && (
            <ReviewExtraction
              companyId={companyId}
              extractionJobId={extractionJobId}
              onReviewComplete={handleReviewComplete}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && companyId && (
            <GeneratedKit companyId={companyId} />
          )}
        </Card>

        {/* Footer Help */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Need help? Contact your system administrator or check the documentation.</p>
        </div>
      </div>
    </div>
  );
}
