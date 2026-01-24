/**
 * ACCESS DENIED COMPONENT
 *
 * Polite message shown when users try to access features they don't have permission for
 */

import { ShieldAlert, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  feature?: string;
  message?: string;
  showContactAdmin?: boolean;
}

export function AccessDenied({
  feature = 'this feature',
  message,
  showContactAdmin = true
}: AccessDeniedProps) {
  const defaultMessage = `Access to ${feature} is not available for your current access level.`;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <ShieldAlert className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Not Available</CardTitle>
          <CardDescription className="text-base mt-2">
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showContactAdmin && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                If you believe you should have access to this feature, please contact your system administrator.
              </p>
              <Button variant="outline" className="w-full gap-2">
                <Mail className="w-4 h-4" />
                Contact Administrator
              </Button>
            </div>
          )}

          <div className="text-xs text-center text-muted-foreground">
            <p>Your administrator can grant you access by updating your permissions in the Admin workspace.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Simple inline version for smaller spaces
 */
export function AccessDeniedInline({ feature = 'this feature' }: { feature?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
      <ShieldAlert className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
          Access Not Available
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          Access to {feature} is not available for your current access level.
        </p>
      </div>
    </div>
  );
}
