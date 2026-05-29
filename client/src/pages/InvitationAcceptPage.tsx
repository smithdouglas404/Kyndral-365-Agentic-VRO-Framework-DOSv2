/**
 * INVITATION ACCEPTANCE PAGE
 * Accept tenant invitation and create account with password
 */

import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Sparkles, Loader2, UserPlus, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { setTokens, setAuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface InvitationDetails {
  email: string;
  role: string;
  tenant: {
    id: string;
    name: string;
  };
}

export default function InvitationAcceptPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/invite/:token');
  const token = params?.token || '';

  // Invitation loading state
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [invitationError, setInvitationError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load invitation details
  useEffect(() => {
    if (!token) {
      setInvitationError('Invalid invitation link');
      setLoadingInvitation(false);
      return;
    }

    const loadInvitation = async () => {
      try {
        const response = await fetch(`/api/tenant-auth/invitation/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load invitation');
        }

        setInvitation(data);
      } catch (err: any) {
        setInvitationError(err.message || 'Failed to load invitation');
      } finally {
        setLoadingInvitation(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError('');

    // Validate password
    if (formData.password.length < 8) {
      setAcceptError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAcceptError('Passwords do not match');
      return;
    }

    setAcceptLoading(true);

    try {
      const response = await fetch(`/api/tenant-auth/invitation/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Store JWT tokens using centralized auth
      setTokens(data.accessToken, data.refreshToken);
      setAuthUser(data.user);

      setSuccess(true);

      // Redirect after success message
      setTimeout(() => {
        navigate('/setup');
      }, 2000);
    } catch (err: any) {
      setAcceptError(err.message || 'Failed to accept invitation');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
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
            <h2 className="text-2xl font-bold mb-3">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Welcome to {invitation?.tenant.name}. Redirecting to setup...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loadingInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-6" />
            <p className="text-gray-600">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              {invitationError || 'This invitation link is invalid or has expired.'}
            </p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acceptance form
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
        </div>
      </header>

      {/* Acceptance Form */}
      <div className="max-w-lg mx-auto px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="w-6 h-6 text-blue-600" />
              Accept Your Invitation
            </CardTitle>
            <CardDescription>
              You've been invited to join <strong>{invitation.tenant.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Invitation Details */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Organization:</span>
                  <span className="font-semibold">{invitation.tenant.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-semibold">{invitation.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <Badge variant="secondary">{invitation.role.replace('_', ' ').toUpperCase()}</Badge>
                </div>
              </div>
            </div>

            {/* Acceptance Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {acceptError && (
                <Alert variant="destructive">
                  <AlertDescription>{acceptError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
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
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
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
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={acceptLoading}
              >
                {acceptLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Accept Invitation & Create Account
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By accepting, you agree to the Terms of Service and Privacy Policy
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
