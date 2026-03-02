/**
 * SIGNUP PAGE
 * Self-service signup for new users/companies
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles, Loader2, Building2, User, Mail, Lock, Eye, EyeOff,
  CheckCircle2, ArrowRight, ArrowLeft, Shield, Zap, Users
} from 'lucide-react';
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

// Industry profiles (matching backend seed data)
const INDUSTRIES = [
  { id: 'energy-utilities', name: 'Energy & Utilities', description: 'Power generation, renewables, grid modernization' },
  { id: 'technology', name: 'Technology', description: 'Software, hardware, cloud services' },
  { id: 'healthcare', name: 'Healthcare', description: 'Provider systems, payer operations, digital health' },
  { id: 'financial-services', name: 'Financial Services', description: 'Banking, insurance, fintech transformation' },
  { id: 'manufacturing', name: 'Manufacturing', description: 'Discrete & process manufacturing, supply chain' },
  { id: 'retail-ecommerce', name: 'Retail & E-commerce', description: 'Omnichannel retail, consumer products' },
  { id: 'telecommunications', name: 'Telecommunications', description: '5G rollout, network transformation' },
  { id: 'transportation-logistics', name: 'Transportation & Logistics', description: 'Supply chain, fleet management' },
  { id: 'realestate-construction', name: 'Real Estate & Construction', description: 'Property development, construction management' },
  { id: 'pharma-biotech', name: 'Pharma & Biotech', description: 'Drug development, clinical trials, regulatory' },
  { id: 'consumer-products', name: 'Consumer Products', description: 'CPG, brand management, product innovation' },
  { id: 'media-entertainment', name: 'Media & Entertainment', description: 'Content production, streaming, advertising' },
  { id: 'hospitality-tourism', name: 'Hospitality & Tourism', description: 'Hotels, travel, leisure services' },
  { id: 'agriculture-food', name: 'Agriculture & Food', description: 'Farming, food processing, agtech' },
  { id: 'education', name: 'Education', description: 'K-12, higher education, edtech' },
  { id: 'professional-services', name: 'Professional Services', description: 'Consulting, legal, accounting' },
  { id: 'insurance', name: 'Insurance', description: 'Life, P&C, reinsurance, insurtech' },
  { id: 'automotive', name: 'Automotive', description: 'OEM, suppliers, EV transformation' },
  { id: 'aerospace-defense', name: 'Aerospace & Defense', description: 'Aviation, defense systems, space' },
  { id: 'mining-materials', name: 'Mining & Materials', description: 'Extraction, processing, materials science' },
];

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    industry: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.companyName.trim()) return 'Company name is required';
    if (!formData.industry) return 'Please select your industry';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tenant-auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Check Your Email!</h2>
            <p className="text-gray-600 mb-2">
              We've sent a verification link to:
            </p>
            <p className="font-semibold text-blue-600 mb-6">{formData.email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to verify your account and start your 14-day free trial.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    await fetch('/api/tenant-auth/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: formData.email }),
                    });
                    alert('Verification email resent!');
                  } catch {
                    alert('Failed to resend email. Please try again.');
                  }
                }}
              >
                Resend Verification Email
              </Button>
            </div>
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
              <h1 className="text-xl font-bold text-gray-900">Kyndryl Clarity</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Already have an account?</span>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left Column - Benefits */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Start Your Free Trial
              </h1>
              <p className="text-xl text-gray-600">
                Get full access to Kyndryl Clarity for 14 days. No credit card required.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI-Powered Insights</h3>
                  <p className="text-gray-600">10 specialized agents working 24/7 to optimize your projects</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                  <p className="text-gray-600">SOC 2 compliant with end-to-end encryption</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Unlimited Team Members</h3>
                  <p className="text-gray-600">Invite your entire organization during the trial</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 italic">
                "Kyndryl Clarity transformed how we manage our portfolio. The AI agents caught issues
                we would have missed, saving us millions in potential overruns."
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-3">
                — VP of Technology, Fortune 500 Company
              </p>
            </div>
          </div>

          {/* Right Column - Signup Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Get started with your 14-day free trial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="John"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
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

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john@company.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="ACME Corporation"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Industry Selection */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleChange('industry', value)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select your industry..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{industry.name}</span>
                            <span className="text-xs text-gray-500">{industry.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    We'll customize your experience with industry-specific metrics and terminology
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  By signing up, you agree to our{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>
              </form>

              {/* Alternative options */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-center text-gray-600 mb-4">
                  Or explore with a demo
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/demo-request')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Request Industry Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
