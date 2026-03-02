/**
 * EMAIL VERIFICATION PAGE
 * Verifies user email when they click the verification link
 */

import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Loader2, CheckCircle2, AlertCircle, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmailVerificationPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/verify-email/:token');
  const token = params?.token || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/tenant-auth/verify-email/${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
        setEmail(data.email || '');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token]);

  // Verifying state
  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we verify your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kyndryl Clarity</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-md mx-auto px-6 py-20">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Email Verified!</h2>
              {email && (
                <p className="text-gray-600 mb-2">
                  <strong>{email}</strong> has been verified.
                </p>
              )}
              <p className="text-gray-600 mb-8">
                Your account is now active. You can sign in and start using Kyndryl Clarity.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In to Your Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* What's Next */}
          <div className="mt-8 text-center">
            <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">1</div>
                <span>Sign in with your email and password</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">2</div>
                <span>Complete the setup wizard</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">3</div>
                <span>Invite your team members</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kyndryl Clarity</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-20">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Verification Failed</h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'This verification link is invalid or has expired.'}
            </p>
            <div className="space-y-3">
              <ResendVerificationForm />
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Resend verification form component
function ResendVerificationForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await fetch('/api/tenant-auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Still show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
        <Mail className="w-4 h-4 inline mr-2" />
        If an account exists, a new verification link has been sent.
      </div>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-3">
      <p className="text-sm text-gray-600">
        Enter your email to receive a new verification link:
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
          required
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
        </Button>
      </div>
    </form>
  );
}
