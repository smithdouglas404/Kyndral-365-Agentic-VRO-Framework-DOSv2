/**
 * LOGIN PAGE - Firebase Authentication
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, Loader2, Sparkles } from 'lucide-react';
import { signIn, getIdToken } from '@/lib/firebase';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signIn(email, password);

      // Get Firebase ID token
      const idToken = await getIdToken();

      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      // Verify with backend and get user data
      const response = await fetch('/api/auth/firebase/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();

      // Store user data
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      // Navigate to role-specific home page
      const homePage = data.homePage || '/dashboard';
      navigate(homePage);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <LogIn className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/password-reset')}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Forgot password?
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Sign up
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/demo')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Try Interactive Demo
          </button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Explore the Deep Agent System with realistic industry data
          </p>
        </div>
      </div>
    </div>
  );
}
