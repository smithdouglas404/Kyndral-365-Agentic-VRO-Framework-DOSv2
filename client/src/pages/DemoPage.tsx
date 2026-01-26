import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Cpu, HeartPulse, Landmark, Factory, ShoppingCart, Truck, Radio,
  Home, Pill, Package, Film, Hotel, Wheat, GraduationCap, Briefcase,
  Shield, Car, Plane, Pickaxe, Sparkles
} from 'lucide-react';

interface Industry {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  companyName: string;
  projectCount: number;
  color: string;
}

const industries: Industry[] = [
  { id: 'energy-utilities', name: 'Energy & Utilities', icon: Building2, description: 'Electric utilities, renewable energy, grid modernization', companyName: 'ACME Energy', projectCount: 10, color: 'text-yellow-600' },
  { id: 'technology', name: 'Technology', icon: Cpu, description: 'Software, cloud, AI, enterprise technology', companyName: 'ACME Tech', projectCount: 10, color: 'text-blue-600' },
  { id: 'healthcare', name: 'Healthcare', icon: HeartPulse, description: 'Hospitals, health systems, medical services', companyName: 'ACME Healthcare', projectCount: 10, color: 'text-red-600' },
  { id: 'financial-services', name: 'Financial Services', icon: Landmark, description: 'Banking, wealth management, payments', companyName: 'ACME Financial', projectCount: 10, color: 'text-green-600' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Factory, description: 'Industrial manufacturing, automation', companyName: 'ACME Manufacturing', projectCount: 10, color: 'text-gray-600' },
  { id: 'retail-ecommerce', name: 'Retail & E-commerce', icon: ShoppingCart, description: 'Omnichannel retail, online commerce', companyName: 'ACME Retail', projectCount: 10, color: 'text-purple-600' },
  { id: 'transportation-logistics', name: 'Transportation', icon: Truck, description: 'Logistics, freight, fleet management', companyName: 'ACME Transport', projectCount: 10, color: 'text-orange-600' },
  { id: 'telecommunications', name: 'Telecommunications', icon: Radio, description: '5G networks, fiber, wireless services', companyName: 'ACME Telecom', projectCount: 10, color: 'text-indigo-600' },
  { id: 'realestate-construction', name: 'Real Estate', icon: Home, description: 'Property development, construction', companyName: 'ACME Properties', projectCount: 10, color: 'text-amber-600' },
  { id: 'pharma-biotech', name: 'Pharma & Biotech', icon: Pill, description: 'Drug development, clinical trials', companyName: 'ACME Pharma', projectCount: 10, color: 'text-pink-600' },
  { id: 'consumer-products', name: 'Consumer Products', icon: Package, description: 'CPG brands, product manufacturing', companyName: 'ACME Consumer', projectCount: 10, color: 'text-teal-600' },
  { id: 'media-entertainment', name: 'Media & Entertainment', icon: Film, description: 'Streaming, content, theme parks', companyName: 'ACME Media', projectCount: 10, color: 'text-rose-600' },
  { id: 'hospitality-tourism', name: 'Hospitality', icon: Hotel, description: 'Hotels, resorts, guest services', companyName: 'ACME Hospitality', projectCount: 10, color: 'text-cyan-600' },
  { id: 'agriculture-food', name: 'Agriculture & Food', icon: Wheat, description: 'Farming, food processing, distribution', companyName: 'ACME Agriculture', projectCount: 10, color: 'text-lime-600' },
  { id: 'education', name: 'Education', icon: GraduationCap, description: 'Higher education, online learning', companyName: 'ACME Education', projectCount: 10, color: 'text-violet-600' },
  { id: 'professional-services', name: 'Professional Services', icon: Briefcase, description: 'Consulting, advisory, services', companyName: 'ACME Consulting', projectCount: 10, color: 'text-slate-600' },
  { id: 'insurance', name: 'Insurance', icon: Shield, description: 'P&C, life, health insurance', companyName: 'ACME Insurance', projectCount: 10, color: 'text-emerald-600' },
  { id: 'automotive', name: 'Automotive', icon: Car, description: 'Vehicle manufacturing, EV development', companyName: 'ACME Automotive', projectCount: 10, color: 'text-red-700' },
  { id: 'aerospace-defense', name: 'Aerospace & Defense', icon: Plane, description: 'Aircraft, satellites, defense systems', companyName: 'ACME Aerospace', projectCount: 10, color: 'text-sky-600' },
  { id: 'mining-materials', name: 'Mining & Materials', icon: Pickaxe, description: 'Mining operations, materials processing', companyName: 'ACME Mining', projectCount: 10, color: 'text-stone-600' }
];

export default function DemoPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleIndustrySelect = async (industryId: string) => {
    setSelectedIndustry(industryId);
    setIsLoading(true);

    try {
      // Call API to activate ACME demo mode for this industry
      const response = await fetch(`/api/demo/activate/${industryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }

      const data = await response.json();

      toast({
        title: 'Demo Loaded Successfully',
        description: `Loaded ${data.companyName} with ${data.projectCount} projects`,
      });

      // Redirect to demo showcase after successful load
      setTimeout(() => {
        setLocation('/demo/showcase');
      }, 1500);
    } catch (error) {
      console.error('Error loading demo data:', error);
      toast({
        title: 'Error Loading Demo',
        description: 'Failed to load demo data. Please try again.',
        variant: 'destructive',
      });
      setSelectedIndustry(null);
      setIsLoading(false);
    }
  };

  if (selectedIndustry && isLoading) {
    const industry = industries.find(i => i.id === selectedIndustry);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Loading {industry?.name} Demo</CardTitle>
            <CardDescription>
              Setting up {industry?.companyName} with {industry?.projectCount} live projects...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="text-sm text-slate-600">Generating realistic project data...</p>
              <p className="text-xs text-slate-500">Agent interventions, battle rhythm, and rules engine</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Interactive Demo
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Experience the Deep Agent System
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Select an industry to explore ACME demo data with 10 realistic projects,
            active agent interventions, and live insights
          </p>
        </div>

        {/* Industry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <Card
                key={industry.id}
                className="group cursor-pointer transition-all hover:shadow-xl hover:scale-105 hover:border-orange-500"
                onClick={() => handleIndustrySelect(industry.id)}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-slate-100 group-hover:bg-orange-50 transition-colors ${industry.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {industry.projectCount} projects
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg mb-2">{industry.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {industry.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {industry.companyName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="group-hover:bg-orange-100 group-hover:text-orange-700"
                    >
                      View Demo →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Footer */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            What's Included in Each Demo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900 mb-2">Live Project Data</div>
              <div className="text-sm text-slate-600">
                10 realistic projects with mixed health: critical, warning, healthy, risk, and governance states
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900 mb-2">Agent Intelligence</div>
              <div className="text-sm text-slate-600">
                Pre-fired interventions from FinOps, TMO, Risk, Governance, and OCM agents
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900 mb-2">Battle Rhythm History</div>
              <div className="text-sm text-slate-600">
                4 weeks of Sunday recon, Monday briefings, Wednesday checkpoints, Friday synthesis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
