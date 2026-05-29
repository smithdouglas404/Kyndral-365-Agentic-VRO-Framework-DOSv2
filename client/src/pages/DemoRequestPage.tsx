/**
 * DEMO REQUEST PAGE
 * Lead capture form with industry selection for personalized demos
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, Building2, Phone, Mail, User } from 'lucide-react';
import { setTokens, setAuthUser, setDemoMode } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Demo industries (matching backend seed data)
const DEMO_INDUSTRIES = [
  { id: 'energy-utilities', name: 'Energy & Utilities', description: 'Power generation, renewables, grid modernization' },
  { id: 'technology', name: 'Technology', description: 'Software, hardware, cloud services' },
  { id: 'healthcare', name: 'Healthcare', description: 'Provider systems, payer operations, digital health' },
  { id: 'financial-services', name: 'Financial Services', description: 'Banking, insurance, fintech transformation' },
  { id: 'manufacturing', name: 'Manufacturing', description: 'Discrete & process manufacturing, supply chain' },
  { id: 'retail-ecommerce', name: 'Retail & E-commerce', description: 'Omnichannel retail, consumer products' },
  { id: 'telecommunications', name: 'Telecommunications', description: '5G rollout, network transformation' },
  { id: 'transportation-logistics', name: 'Transportation & Logistics', description: 'Supply chain, fleet management' },
];

export default function DemoRequestPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    demoIndustry: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/tenant-auth/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit demo request');
      }

      // Store demo access token using centralized auth
      setTokens(data.accessToken);
      setDemoMode(true);
      setAuthUser(data.user);

      setSuccess(true);

      // Redirect based on approval status
      setTimeout(() => {
        if (data.isApproved) {
          // Already approved (existing user) - go to dashboard
          navigate('/dashboard?demo=true');
        } else {
          // New request - go to pending approval page
          navigate('/demo/pending');
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit demo request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Demo Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your request for the {DEMO_INDUSTRIES.find(i => i.id === formData.demoIndustry)?.name || 'industry'} demo is being reviewed...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smith Clarity</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Experience Smith Clarity
            <br />
            <span className="text-blue-600">With Your Industry Data</span>
          </h1>
          <p className="text-xl text-gray-600">
            Get immediate access to a personalized demo with industry-specific scenarios
          </p>
        </div>

        {/* Demo Request Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Request Your Personalized Demo
            </CardTitle>
            <CardDescription>
              Fill out the form below and start exploring with realistic {formData.demoIndustry ? DEMO_INDUSTRIES.find(i => i.id === formData.demoIndustry)?.name : 'industry'} data immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Industry Selection */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Select Your Industry <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.demoIndustry}
                  onValueChange={(value) => handleChange('demoIndustry', value)}
                  required
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Choose your industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        <div>
                          <div className="font-medium">{industry.name}</div>
                          <div className="text-xs text-gray-500">{industry.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    <User className="w-4 h-4 inline mr-1" />
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Work Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john.smith@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="ACME Corporation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating your demo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start My Demo Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By submitting, you agree to receive product updates and demo access credentials
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Instant Access</h3>
            <p className="text-sm text-gray-600">Start exploring immediately after submission</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Industry-Specific</h3>
            <p className="text-sm text-gray-600">Pre-configured with your industry scenarios</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">10 AI Agents</h3>
            <p className="text-sm text-gray-600">Experience all specialized agents in action</p>
          </div>
        </div>

        {/* Quick Demo Link */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600">
            Just want to try it quickly?{' '}
            <button
              type="button"
              onClick={() => navigate('/login?tab=demo')}
              className="text-blue-600 hover:underline font-medium"
            >
              Use quick demo access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
