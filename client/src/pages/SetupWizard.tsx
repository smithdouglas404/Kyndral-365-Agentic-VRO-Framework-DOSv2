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
import { Check, Sparkles, Zap, Building2, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

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
  { id: 1, name: 'Setup Type', description: 'Choose demo or real company' },
  { id: 2, name: 'Company Discovery', description: 'Search and select your company' },
  { id: 3, name: 'Company Profile', description: 'Review and confirm details' },
  { id: 4, name: 'Extracting Data', description: 'AI analyzes your annual report' },
  { id: 5, name: 'Review Data', description: 'Approve extracted information' },
  { id: 6, name: 'Complete', description: 'Your system is configured' },
];

export default function SetupWizard() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupType, setSetupType] = useState<'demo' | 'real' | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CompanyCandidate | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const progress = (currentStep / STEPS.length) * 100;

  const handleSetupTypeSelected = (type: 'demo' | 'real') => {
    setSetupType(type);
    if (type === 'real') {
      setCurrentStep(2); // Go to Company Discovery
    } else {
      // For demo, we'll show industry selection in step 2
      setCurrentStep(2);
    }
  };

  const handleDemoIndustrySelected = async (industryId: string) => {
    setSelectedIndustry(industryId);
    // Activate the demo
    try {
      const response = await fetch(`/api/demo/activate/${industryId}`, {
        method: 'POST',
      });
      if (response.ok) {
        // Skip to completion
        setCurrentStep(6);
      }
    } catch (error) {
      console.error('Failed to activate demo:', error);
    }
  };

  const handleCandidateSelected = (candidate: CompanyCandidate) => {
    setSelectedCandidate(candidate);
    setCurrentStep(3);
  };

  const handleProfileConfirmed = (profile: CompanyProfile, createdCompanyId: string) => {
    setCompanyProfile(profile);
    setCompanyId(createdCompanyId);
    setCurrentStep(4);
  };

  const handleExtractionStarted = (jobId: string) => {
    setExtractionJobId(jobId);
  };

  const handleExtractionComplete = () => {
    setCurrentStep(5);
  };

  const handleReviewComplete = () => {
    setCurrentStep(6);
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
          {/* Step 1: Choose Setup Type */}
          {currentStep === 1 && (
            <SetupTypeSelection onTypeSelected={handleSetupTypeSelected} />
          )}

          {/* Step 2: Demo Industry Selection OR Real Company Discovery */}
          {currentStep === 2 && setupType === 'demo' && (
            <DemoIndustrySelection onIndustrySelected={handleDemoIndustrySelected} />
          )}

          {currentStep === 2 && setupType === 'real' && (
            <CompanyDiscovery onCandidateSelected={handleCandidateSelected} />
          )}

          {currentStep === 3 && selectedCandidate && (
            <CompanyPreview
              candidate={selectedCandidate}
              onConfirm={handleProfileConfirmed}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && companyProfile && companyId && (
            <OntologyMapping
              companyProfile={companyProfile}
              companyId={companyId}
              onExtractionStarted={handleExtractionStarted}
              onExtractionComplete={handleExtractionComplete}
            />
          )}

          {currentStep === 5 && companyId && extractionJobId && (
            <ReviewExtraction
              companyId={companyId}
              extractionJobId={extractionJobId}
              onReviewComplete={handleReviewComplete}
              onBack={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 6 && (setupType === 'demo' || companyId) && (
            <CompletionStep
              setupType={setupType!}
              companyId={companyId}
              selectedIndustry={selectedIndustry}
              onComplete={() => navigate('/dashboard')}
            />
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

// Setup Type Selection Component
function SetupTypeSelection({ onTypeSelected }: { onTypeSelected: (type: 'demo' | 'real') => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to Your PPM System</h2>
        <p className="text-muted-foreground">Choose how you'd like to get started</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Demo Option */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
              onClick={() => onTypeSelected('demo')}>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold">Quick Demo Setup</h3>
            <p className="text-sm text-muted-foreground">
              Start immediately with pre-configured ACME industry data. Perfect for exploring features and testing workflows.
            </p>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Instant setup (no data entry required)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Industry-specific sample projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Full system capabilities enabled</span>
              </li>
            </ul>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              Start Demo
            </Button>
          </div>
        </Card>

        {/* Real Company Option */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
              onClick={() => onTypeSelected('real')}>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold">Real Company Setup</h3>
            <p className="text-sm text-muted-foreground">
              Configure the system with your actual company data. AI extracts information from your annual report.
            </p>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>AI-powered data extraction from 10-K/annual reports</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Custom org structure and metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Policy-as-code governance rules</span>
              </li>
            </ul>
            <Button className="w-full">
              Set Up My Company
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Demo Industry Selection Component
function DemoIndustrySelection({ onIndustrySelected }: { onIndustrySelected: (industryId: string) => void }) {
  const { data: industries, isLoading } = useQuery({
    queryKey: ['demo-industries'],
    queryFn: async () => {
      const response = await fetch('/api/demo/industries');
      if (!response.ok) throw new Error('Failed to fetch industries');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading ACME industries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Industry</h2>
        <p className="text-muted-foreground">
          Select an ACME industry variant to explore. Each comes with realistic sample data.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {industries?.map((industry: any) => (
          <Card
            key={industry.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
            onClick={() => onIndustrySelected(industry.id)}
          >
            <div className="space-y-3">
              <h3 className="font-bold text-lg">{industry.name}</h3>
              <p className="text-sm text-muted-foreground">{industry.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{industry.projectCount} Projects</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Completion Step Component
function CompletionStep({
  setupType,
  companyId,
  selectedIndustry,
  onComplete,
}: {
  setupType: 'demo' | 'real';
  companyId: string | null;
  selectedIndustry: string | null;
  onComplete: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-2">Setup Complete!</h2>
        <p className="text-muted-foreground">
          {setupType === 'demo'
            ? 'Your demo environment is ready. Explore the full system with sample data.'
            : 'Your company profile has been configured. The system is ready to use.'}
        </p>
      </div>

      <Button size="lg" onClick={onComplete} className="px-8">
        Go to Dashboard
      </Button>
    </div>
  );
}
