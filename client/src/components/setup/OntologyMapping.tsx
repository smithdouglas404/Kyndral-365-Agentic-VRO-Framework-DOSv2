import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Check, FileText, Target, Building2, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/pages/SetupWizard';

interface OntologyMappingProps {
  companyProfile: CompanyProfile;
  companyId: string;
  onExtractionStarted: (jobId: string) => void;
  onExtractionComplete: () => void;
}

export function OntologyMapping({
  companyProfile,
  companyId,
  onExtractionStarted,
  onExtractionComplete
}: OntologyMappingProps) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'extracting' | 'completed' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [extractedCounts, setExtractedCounts] = useState({
    financialMetrics: 0,
    strategicObjectives: 0,
    organizationalUnits: 0,
    governanceRules: 0,
    riskFactors: 0
  });

  useEffect(() => {
    if (status === 'idle') {
      startExtraction();
    }
  }, []);

  useEffect(() => {
    if (status === 'extracting' && jobId) {
      const interval = setInterval(() => {
        checkExtractionStatus();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status, jobId]);

  const startExtraction = async () => {
    if (!companyProfile.latestAnnualReport) {
      toast.error('No annual report available for extraction');
      setStatus('error');
      return;
    }

    setStatus('starting');

    try {
      const response = await fetch('/api/company-profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          documentUrl: companyProfile.latestAnnualReport.url,
          industryCode: companyProfile.company.industryCodes.gics?.code
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start extraction');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setStatus('extracting');
      setProgress(10);
      onExtractionStarted(data.jobId);
    } catch (error: any) {
      console.error('Extraction start error:', error);
      toast.error(error.message || 'Failed to start extraction');
      setStatus('error');
    }
  };

  const checkExtractionStatus = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/company-profile/extraction-status/${jobId}`);

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const data = await response.json();

      if (data.status === 'completed') {
        setStatus('completed');
        setProgress(100);

        // Parse extraction results
        if (data.extractionResults) {
          setExtractedCounts({
            financialMetrics: data.extractionResults.financialMetrics?.length || 0,
            strategicObjectives: data.extractionResults.strategicObjectives?.length || 0,
            organizationalUnits: data.extractionResults.organizationalUnits?.length || 0,
            governanceRules: data.extractionResults.governanceRules?.length || 0,
            riskFactors: data.extractionResults.riskFactors?.length || 0
          });
        }

        toast.success('Extraction complete!');

        // Auto-advance after 2 seconds
        setTimeout(() => {
          onExtractionComplete();
        }, 2000);
      } else if (data.status === 'failed') {
        setStatus('error');
        toast.error(data.errorMessage || 'Extraction failed');
      } else if (data.status === 'processing') {
        // Gradually increase progress
        setProgress((prev) => Math.min(prev + 5, 90));
      }
    } catch (error: any) {
      console.error('Status check error:', error);
    }
  };

  const extractionSteps = [
    {
      icon: FileText,
      label: 'Parsing Annual Report',
      description: 'Reading sections from 10-K',
      completed: progress > 20
    },
    {
      icon: Building2,
      label: 'Extracting Organizational Structure',
      description: `Found ${extractedCounts.organizationalUnits} units`,
      completed: progress > 40
    },
    {
      icon: Target,
      label: 'Identifying Strategic Objectives',
      description: `Found ${extractedCounts.strategicObjectives} objectives`,
      completed: progress > 60
    },
    {
      icon: Shield,
      label: 'Extracting Governance Rules',
      description: `Found ${extractedCounts.governanceRules} rules`,
      completed: progress > 80
    },
    {
      icon: AlertTriangle,
      label: 'Mapping Risk Factors',
      description: `Found ${extractedCounts.riskFactors} risks`,
      completed: progress >= 100
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Analyzing Annual Report</h2>
        <p className="text-muted-foreground">
          Our AI is extracting strategic information from your {companyProfile.latestAnnualReport?.type}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {status === 'starting' && 'Starting extraction...'}
            {status === 'extracting' && 'Extracting data...'}
            {status === 'completed' && 'Extraction complete!'}
            {status === 'error' && 'Extraction failed'}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        {status === 'extracting' && (
          <p className="text-xs text-muted-foreground text-center">
            This may take 30-60 seconds...
          </p>
        )}
      </div>

      {/* Extraction Steps */}
      <div className="space-y-4">
        {extractionSteps.map((step, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
              step.completed
                ? 'border-primary bg-accent/50'
                : 'border-muted'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.completed ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1">{step.label}</div>
              <div className="text-sm text-muted-foreground">
                {step.description}
              </div>
            </div>
            {status === 'extracting' && !step.completed && index === extractionSteps.findIndex(s => !s.completed) && (
              <Spinner className="w-5 h-5 text-primary" />
            )}
          </div>
        ))}
      </div>

      {/* Summary Box */}
      {status === 'completed' && (
        <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
          <h3 className="font-semibold mb-4 text-center">Extraction Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{extractedCounts.organizationalUnits}</div>
              <div className="text-xs text-muted-foreground">Org Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{extractedCounts.financialMetrics}</div>
              <div className="text-xs text-muted-foreground">KPIs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{extractedCounts.strategicObjectives}</div>
              <div className="text-xs text-muted-foreground">OKRs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{extractedCounts.governanceRules}</div>
              <div className="text-xs text-muted-foreground">Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{extractedCounts.riskFactors}</div>
              <div className="text-xs text-muted-foreground">Risks</div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold mb-2">Extraction Failed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We encountered an error while processing your annual report.
          </p>
          <Button onClick={startExtraction}>
            Retry Extraction
          </Button>
        </div>
      )}
    </div>
  );
}
