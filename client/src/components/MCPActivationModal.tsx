/**
 * MCP ACTIVATION MODAL
 *
 * Dynamic modal for activating MCP server integrations with professional UI
 * - Generates forms dynamically based on server configuration schema
 * - Supports validation, testing, and secure credential handling
 * - Professional design with progress states and helpful messaging
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  TestTube,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCPServer {
  id: string;
  displayName: string;
  category: string;
  officialMCP: boolean;
  description: string;
  capabilities: string[];
  configFields: ConfigField[];
  setupInstructions: string;
  documentationUrl: string;
}

interface ConfigField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  sensitive: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

interface MCPActivationModalProps {
  server: MCPServer;
  onClose: () => void;
  onSuccess: () => void;
}

export function MCPActivationModal({ server, onClose, onSuccess }: MCPActivationModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch(`/api/admin/mcp-servers/${server.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Connection test failed');
      return result;
    },
    onMutate: () => {
      setTestStatus('testing');
      setTestMessage('');
    },
    onSuccess: (data) => {
      setTestStatus('success');
      setTestMessage(data.message || 'Connection successful!');
    },
    onError: (error: any) => {
      setTestStatus('error');
      setTestMessage(error.message || 'Connection test failed');
    },
  });

  // Activation mutation
  const activateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch(`/api/admin/mcp-servers/${server.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Activation failed');
      return result;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleTest = () => {
    testMutation.mutate(formData);
  };

  const handleActivate = () => {
    activateMutation.mutate(formData);
  };

  const isFormValid = () => {
    return server.configFields
      .filter((field) => field.required)
      .every((field) => formData[field.name] && formData[field.name].toString().trim() !== '');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Activate {server.displayName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                {server.officialMCP && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Official MCP
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {server.category.replace('_', ' ').toUpperCase()}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          {server.description && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>{server.description}</AlertDescription>
            </Alert>
          )}

          {/* Setup Instructions */}
          {server.setupInstructions && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Setup Instructions
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {server.setupInstructions}
              </p>
              {server.documentationUrl && (
                <a
                  href={server.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                >
                  View Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Configuration</h4>

            {/* Integration Name (optional) */}
            <div className="space-y-2">
              <Label htmlFor="integration-name">
                Integration Name
                <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
              </Label>
              <Input
                id="integration-name"
                placeholder={`My ${server.displayName} Integration`}
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this integration
              </p>
            </div>

            {/* Dynamic Fields */}
            {server.configFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {/* Text/Email/URL Fields */}
                {['text', 'email', 'url'].includes(field.type) && (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}

                {/* Password Fields */}
                {['password', 'api_key', 'token'].includes(field.type) && (
                  <div className="relative">
                    <Input
                      id={field.name}
                      type={showPassword[field.name] ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.name)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword[field.name] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* Textarea Fields */}
                {field.type === 'textarea' && (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                    rows={3}
                  />
                )}

                {/* Number Fields */}
                {field.type === 'number' && (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}

                {/* Select Fields */}
                {field.type === 'select' && field.options && (
                  <select
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select...</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Help Text */}
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>

          {/* Test Status */}
          {testStatus !== 'idle' && (
            <Alert
              className={cn({
                'border-green-500 bg-green-50 dark:bg-green-950/20': testStatus === 'success',
                'border-red-500 bg-red-50 dark:bg-red-950/20': testStatus === 'error',
                'border-blue-500 bg-blue-50 dark:bg-blue-950/20': testStatus === 'testing',
              })}
            >
              {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
              {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
              <AlertDescription>{testMessage}</AlertDescription>
            </Alert>
          )}

          {/* Activation Error */}
          {activateMutation.isError && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription>
                {(activateMutation.error as any)?.message || 'Activation failed'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={activateMutation.isPending}>
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handleTest}
            disabled={!isFormValid() || testMutation.isPending || activateMutation.isPending}
            className="gap-2"
          >
            {testMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Test Connection
              </>
            )}
          </Button>

          <Button
            onClick={handleActivate}
            disabled={!isFormValid() || activateMutation.isPending}
            className="gap-2"
          >
            {activateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Activate Integration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
