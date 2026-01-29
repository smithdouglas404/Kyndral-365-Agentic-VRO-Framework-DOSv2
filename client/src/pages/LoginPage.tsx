/**
 * LOGIN PAGE - Multi-Tenant Authentication
 * Standard login (email/password) and Demo access (email + "nexusppm")
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, Loader2, Sparkles, Zap } from 'lucide-react';
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

      // Store JWT tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_tenant', JSON.stringify(data.tenant));

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

  // Demo Login Handler
  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError('');
    setDemoLoading(true);

    try {
      const response = await fetch('/api/tenant-auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: 'nexusppm', // Hardcoded demo password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      // Store demo access token
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      // Navigate to dashboard with demo flag
      navigate('/dashboard?demo=true');
    } catch (err: any) {
      setDemoError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Nexus PPM</h1>
              <p className="text-xs text-gray-600">Kyndryl Clarity</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Login Forms */}
      <div className="max-w-md mx-auto px-6 py-12">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="demo">Demo Access</TabsTrigger>
          </TabsList>

          {/* Standard Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Sign In to Your Account
                </CardTitle>
                <CardDescription>
                  Enter your email and password to access your tenant
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
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
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

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => navigate('/password-reset')}
                      className="text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Access Tab */}
          <TabsContent value="demo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Try Demo Access
                </CardTitle>
                <CardDescription>
                  Enter your email to explore with ACME sample data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDemoLogin} className="space-y-4">
                  {demoError && (
                    <Alert variant="destructive">
                      <AlertDescription>{demoError}</AlertDescription>
                    </Alert>
                  )}

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm text-blue-900">
                      <strong>Demo Password:</strong> nexusppm<br />
                      Access pre-configured ACME industry scenarios instantly
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="demo-email">Email Address</Label>
                    <Input
                      id="demo-email"
                      type="email"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={demoLoading}
                  >
                    {demoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Accessing demo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Access Demo Now
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Want a full demo with your industry?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/demo')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Request personalized demo
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            New customer?{' '}
            <a href="mailto:sales@nexusppm.com" className="text-blue-600 hover:underline">
              Contact sales
            </a>
            {' '}for tenant provisioning
          </p>
        </div>
      </div>
    </div>
  );
}
