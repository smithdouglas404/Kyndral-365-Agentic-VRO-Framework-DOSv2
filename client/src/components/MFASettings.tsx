/**
 * MFA SETTINGS COMPONENT
 * UI for managing Multi-Factor Authentication
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { MFASetupModal } from '@/components/MFASetupModal';
import { toast } from 'sonner';

export function MFASettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setMfaEnabled(data.user.isMfaEnabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable multi-factor authentication? This will make your account less secure.')) {
      return;
    }

    setDisabling(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disable MFA');
      }

      setMfaEnabled(false);
      toast.success('MFA disabled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable MFA');
    } finally {
      setDisabling(false);
    }
  };

  const handleSetupSuccess = () => {
    setMfaEnabled(true);
    fetchMFAStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-base font-medium">Multi-Factor Authentication</span>
              {mfaEnabled ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {mfaEnabled
                ? 'Your account is protected with multi-factor authentication'
                : 'Add an extra layer of security with authenticator app'}
            </p>
          </div>
          {mfaEnabled ? (
            <Button
              variant="destructive"
              onClick={handleDisableMFA}
              disabled={disabling}
              data-testid="button-disable-mfa"
            >
              {disabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable MFA'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setShowSetupModal(true)}
              data-testid="button-enable-mfa"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enable MFA
            </Button>
          )}
        </div>

        {!mfaEnabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommended:</strong> Enable MFA to protect your account from unauthorized access.
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </AlertDescription>
          </Alert>
        )}

        {mfaEnabled && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              MFA is active. You'll be prompted for a verification code when signing in from a new device.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2 text-sm text-blue-800">
            <p className="font-medium">How MFA Works</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Download an authenticator app on your phone</li>
              <li>Scan the QR code or enter the secret key</li>
              <li>Enter the 6-digit code when prompted during login</li>
              <li>Save backup codes in case you lose access to your device</li>
            </ul>
          </div>
        </div>
      </div>

      <MFASetupModal
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
        onSuccess={handleSetupSuccess}
      />
    </div>
  );
}
