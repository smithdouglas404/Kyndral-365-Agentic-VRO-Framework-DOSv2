/**
 * MFA SETUP MODAL
 * Modal for enabling Multi-Factor Authentication with QR code
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Shield, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/auth';

interface MFASetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MFASetupModal({ open, onOpenChange, onSuccess }: MFASetupModalProps) {
  const [step, setStep] = useState<'password' | 'setup' | 'verify'>('password');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaData, setMfaData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to enable MFA');
      }

      const data = await response.json();
      setMfaData({
        secret: data.secret,
        qrCode: data.qrCode,
        backupCodes: data.backupCodes || [],
      });
      setStep('setup');
      toast.success('MFA setup initiated');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setStep('verify');
      toast.success('MFA verification successful');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (mfaData?.secret) {
      navigator.clipboard.writeText(mfaData.secret);
      toast.success('Secret key copied to clipboard');
    }
  };

  const handleCopyBackupCodes = () => {
    if (mfaData?.backupCodes) {
      navigator.clipboard.writeText(mfaData.backupCodes.join('\n'));
      toast.success('Backup codes copied to clipboard');
    }
  };

  const handleClose = () => {
    setStep('password');
    setPassword('');
    setVerificationCode('');
    setMfaData(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Enable Multi-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {step === 'password' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Confirm Your Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                data-testid="input-mfa-password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Verify your identity before enabling MFA
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'setup' && mfaData && (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Scan the QR code below with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </AlertDescription>
            </Alert>

            {/* QR Code Display */}
            <div className="flex justify-center p-4 bg-white border-2 border-dashed rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaData.qrCode)}`}
                alt="MFA QR Code"
                className="w-48 h-48"
              />
            </div>

            {/* Manual Entry Secret */}
            <div>
              <Label className="text-sm font-medium">Manual Entry Key</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono break-all">
                  {mfaData.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                  data-testid="button-copy-secret"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use this if you can't scan the QR code
              </p>
            </div>

            {/* Backup Codes */}
            {mfaData.backupCodes && mfaData.backupCodes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Backup Codes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBackupCodes}
                    data-testid="button-copy-backup-codes"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  {mfaData.backupCodes.map((code, idx) => (
                    <code key={idx} className="text-sm font-mono text-amber-900">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Save these codes in a secure location. Each can be used once if you lose access to your authenticator.
                </p>
              </div>
            )}

            {/* Verification Step */}
            <div>
              <Label htmlFor="verification-code">Enter Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerificationSubmit()}
                className="text-center text-2xl tracking-widest font-mono"
                data-testid="input-verification-code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">MFA Enabled Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Your account is now protected with multi-factor authentication.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'password' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handlePasswordSubmit} disabled={loading} data-testid="button-continue-password">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </>
          )}

          {step === 'setup' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleVerificationSubmit} disabled={loading || verificationCode.length !== 6} data-testid="button-verify-code">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
