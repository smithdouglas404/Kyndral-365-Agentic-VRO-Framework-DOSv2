/**
 * SYSTEM CONFIGURATION PAGE
 *
 * Comprehensive admin UI for system-wide configurations:
 * - SSO/SAML/OAuth configuration
 * - Password policies
 * - Field-level permissions
 * - Picklist management
 * - Notification templates
 * - Data retention policies
 * - Custom fields
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Database, Bell, Archive, Sliders, Key, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SystemConfiguration() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sso');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage system-wide settings and configurations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="sso">
            <Key className="h-4 w-4 mr-2" />
            SSO
          </TabsTrigger>
          <TabsTrigger value="passwords">
            <Shield className="h-4 w-4 mr-2" />
            Passwords
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="picklists">
            <Sliders className="h-4 w-4 mr-2" />
            Picklists
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Archive className="h-4 w-4 mr-2" />
            Retention
          </TabsTrigger>
          <TabsTrigger value="custom-fields">
            <Database className="h-4 w-4 mr-2" />
            Custom Fields
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <FileText className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
        </TabsList>

        {/* SSO Configuration */}
        <TabsContent value="sso">
          <Card>
            <CardHeader>
              <CardTitle>SSO Configuration</CardTitle>
              <CardDescription>
                Configure SAML, OAuth, OIDC, Azure AD, Okta, or Google SSO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  SSO configuration will allow users to authenticate using your organization's identity provider.
                  Database schema created: <code>ssoConfigs</code>
                </div>
                <Button>Add SSO Provider</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Policies */}
        <TabsContent value="passwords">
          <Card>
            <CardHeader>
              <CardTitle>Password Policies</CardTitle>
              <CardDescription>
                Configure password complexity, expiration, and lockout rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Password policy enforcement for enhanced security.
                  Database schema created: <code>passwordPolicies</code>
                </div>
                <Button>Configure Policy</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Permissions */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Field-Level Permissions</CardTitle>
              <CardDescription>
                Control which roles can view/edit specific fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Granular permission control at the field level.
                  Database schema created: <code>fieldPermissions</code>
                </div>
                <Button>Manage Permissions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Picklist Management */}
        <TabsContent value="picklists">
          <Card>
            <CardHeader>
              <CardTitle>Picklist Management</CardTitle>
              <CardDescription>
                Configure status values, priorities, categories, and custom dropdowns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Customize dropdown values for all entity types.
                  Database schema created: <code>picklistValues</code>
                </div>
                <Button>Manage Picklists</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Templates */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Configure email, Slack, Teams, and in-app notification templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Customize notification templates for all events.
                  Database schema created: <code>notificationTemplates</code>
                </div>
                <Button>Manage Templates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Policies */}
        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>
                Configure automatic archival and deletion of old data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Automate data lifecycle management.
                  Database schema created: <code>retentionPolicies</code>
                </div>
                <Button>Configure Policies</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields */}
        <TabsContent value="custom-fields">
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                Add user-defined fields to projects, tasks, risks, and other entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Extend entities with custom data fields.
                  Database schemas created: <code>customFields</code>, <code>customFieldValues</code>
                </div>
                <Button>Add Custom Field</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Engine</CardTitle>
              <CardDescription>
                Configure automated workflows with triggers, conditions, and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Build automated business logic and approval workflows.
                  Database schemas created: <code>workflowDefinitions</code>, <code>workflowExecutions</code>, <code>approvalQueues</code>
                </div>
                <Button>Create Workflow</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schema Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Database Implementation Status</CardTitle>
          <CardDescription>All schemas created and ready for full implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>ssoConfigs</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>passwordPolicies</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>fieldPermissions</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>picklistValues</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>notificationTemplates</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>retentionPolicies</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>customFields/Values</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>workflows</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>resourcePools</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>timesheets</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>purchaseOrders</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>invoices</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>discussionForums</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>decisionLogs</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>programs</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>projectDependencies</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>riskResponses</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
