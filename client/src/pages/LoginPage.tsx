/**
 * LOGIN PAGE - Multi-Tenant Authentication
 * Split-screen layout with value prop and clean login forms
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, Loader2, Sparkles, Zap, Shield, Brain, TrendingUp, CheckCircle2 } from 'lucide-react';
import { setTokens, setAuthUser, setAuthTenant, setDemoMode } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [, navigate] = useLocation();

  // Standard Login State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Demo Login State
  const [demoEmail, setDemoEmail] = useState('');
  const [demoError, setDemoError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'not_found' | 'pending' | 'approved' | 'rejected'>('idle');

  // Standard Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('/api/tenant-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store JWT tokens using centralized auth
      setTokens(data.accessToken, data.refreshToken);
      setAuthUser(data.user);
      setAuthTenant(data.tenant);

      // Route based on role
      if (data.user.isSystemAdmin) {
        navigate('/system-admin');
      } else if (!data.tenant) {
        // No company configured yet
        navigate('/setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Demo Status Check Handler
  const handleDemoCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError('');
    setDemoLoading(true);
    setDemoStatus('idle');

    try {
      const response = await fetch('/api/tenant-auth/demo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check demo status');
      }

      if (!data.found) {
        setDemoStatus('not_found');
        return;
      }

      if (data.isApproved && data.accessToken) {
        // Auto-login approved users
        setTokens(data.accessToken);
        setDemoMode(true);
        setAuthUser(data.user);
        // Invalidate cached demo status so fresh data is fetched on dashboard
        await queryClient.invalidateQueries({ queryKey: ['demo-request-status'] });
        navigate('/dashboard?demo=true');
        return;
      }

      // Show pending or rejected status
      setDemoStatus(data.status as any);
    } catch (err: any) {
      setDemoError(err.message || 'Failed to check demo status');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Smith Clarity</h1>
          </button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left Side - Value Proposition */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
          <div className="max-w-md mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                AI-Powered Portfolio Intelligence
              </h2>
              <p className="text-blue-100 text-lg">
                11 specialized AI agents monitoring your portfolio 24/7, detecting risks weeks before they escalate.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Brain, text: '11 specialized AI agents working around the clock' },
                { icon: Shield, text: 'Detect risks 2-3 weeks earlier than traditional PMO' },
                { icon: TrendingUp, text: 'Save 40% of your PMO team\'s time' },
                { icon: CheckCircle2, text: 'Enterprise-grade security and compliance' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-blue-50">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-blue-500/30">
              <p className="text-sm text-blue-200 italic">
                "The AI agents caught issues we would have missed, saving us millions in potential overruns."
              </p>
              <p className="text-sm text-blue-300 mt-2">— VP of Technology, Fortune 500</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Forms */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="demo">Try Demo</TabsTrigger>
              </TabsList>

              {/* Standard Login Tab */}
              <TabsContent value="login">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <LogIn className="w-5 h-5 text-blue-600" />
                      Welcome Back
                    </CardTitle>
                    <CardDescription>
                      Sign in to access your workspace
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      {loginError && (
                        <Alert variant="destructive">
                          <AlertDescription>{loginError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          placeholder="you@company.com"
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <button
                            type="button"
                            onClick={() => navigate('/password-reset')}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="Enter your password"
                          required
                          className="h-11"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                        disabled={loginLoading}
                      >
                        {loginLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                          </>
                        )}
                      </Button>

                      <div className="text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/signup')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Start free trial
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Demo Access Tab */}
              <TabsContent value="demo">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      Try the Demo
                    </CardTitle>
                    <CardDescription>
                      Explore with pre-configured sample data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleDemoCheck} className="space-y-4">
                      {demoError && (
                        <Alert variant="destructive">
                          <AlertDescription>{demoError}</AlertDescription>
                        </Alert>
                      )}

                      {/* Status-based UI */}
                      {demoStatus === 'not_found' && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertDescription className="text-sm text-yellow-900">
                            No demo request found for this email.{' '}
                            <button
                              type="button"
                              onClick={() => navigate('/demo')}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Request demo access
                            </button>
                          </AlertDescription>
                        </Alert>
                      )}

                      {demoStatus === 'pending' && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <Loader2 className="w-4 h-4 text-blue-600" />
                          <AlertDescription className="text-sm text-blue-900">
                            Your demo request is pending approval. We'll notify you once it's approved.
                          </AlertDescription>
                        </Alert>
                      )}

                      {demoStatus === 'rejected' && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-sm">
                            Your demo request was not approved. Please contact us for more information.
                          </AlertDescription>
                        </Alert>
                      )}

                      {demoStatus === 'idle' && (
                        <Alert className="bg-orange-50 border-orange-200">
                          <Zap className="w-4 h-4 text-orange-600" />
                          <AlertDescription className="text-sm text-orange-900">
                            Enter your email to check your demo access status or launch the demo.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="demo-email">Your Email</Label>
                        <Input
                          id="demo-email"
                          type="email"
                          value={demoEmail}
                          onChange={(e) => {
                            setDemoEmail(e.target.value);
                            setDemoStatus('idle');
                          }}
                          placeholder="you@company.com"
                          required
                          className="h-11"
                        />
                        <p className="text-xs text-gray-500">Enter the email you used to request demo access</p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-orange-600 hover:bg-orange-700"
                        disabled={demoLoading}
                      >
                        {demoLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking access...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Check Status & Access Demo
                          </>
                        )}
                      </Button>

                      <div className="text-center text-sm text-gray-600">
                        Don't have demo access yet?{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/demo')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Request a personalized demo
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Additional CTA */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <button onClick={() => navigate('/terms')} className="text-blue-600 hover:underline">Terms</button>
                {' '}and{' '}
                <button onClick={() => navigate('/privacy')} className="text-blue-600 hover:underline">Privacy Policy</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
