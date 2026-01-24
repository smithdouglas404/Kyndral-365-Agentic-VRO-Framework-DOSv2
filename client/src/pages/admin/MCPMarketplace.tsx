/**
 * MCP MARKETPLACE
 *
 * Professional marketplace for browsing and activating MCP server integrations
 * - 30+ integrations across categories (Enterprise PPM, Agile/VRO, Finance, etc.)
 * - Search and filter functionality
 * - Category-based navigation
 * - Activation modals with dynamic configuration forms
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  Filter,
  CheckCircle,
  Plus,
  Sparkles,
  Building2,
  Zap,
  Code,
  FileText,
  MessageSquare,
  DollarSign,
  Users,
  Grid3x3,
  List,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MCPActivationModal } from '@/components/MCPActivationModal';
import { CustomMCPPresetForm } from '@/components/CustomMCPPresetForm';
import { cn } from '@/lib/utils';

interface MCPServer {
  id: string;
  displayName: string;
  category: string;
  officialMCP: boolean;
  description: string;
  capabilities: string[];
  usedBy: string[];
  configFields: ConfigField[];
  setupInstructions: string;
  documentationUrl: string;
  iconUrl?: string;
}

interface ConfigField {
  name: string;
  label: string;
  type: string;
  required?: boolean; // Defaults to false
  sensitive?: boolean; // Defaults to false
  placeholder?: string;
  helpText?: string;
}

interface ActiveIntegration {
  id: string;
  type: string;
  name: string;
  status: string;
}

const categoryIcons: Record<string, any> = {
  enterprise_ppm: Building2,
  agile_vro: Zap,
  development: Code,
  collaboration: Users,
  documentation: FileText,
  notification: MessageSquare,
  finance_erp: DollarSign,
};

const categoryLabels: Record<string, string> = {
  enterprise_ppm: 'Enterprise PPM',
  agile_vro: 'Agile & VRO',
  development: 'Development',
  collaboration: 'Collaboration',
  documentation: 'Documentation',
  notification: 'Notifications',
  finance_erp: 'Finance & ERP',
};

export default function MCPMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activatingServer, setActivatingServer] = useState<MCPServer | null>(null);
  const [showCustomPresetForm, setShowCustomPresetForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all available MCP servers
  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ['mcp-servers', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all'
        ? '/api/admin/mcp-servers'
        : `/api/admin/mcp-servers?category=${selectedCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch MCP servers');
      return res.json();
    },
  });

  // Fetch active integrations to show which are already activated
  const { data: activeIntegrations } = useQuery<{ integrations: ActiveIntegration[] }>({
    queryKey: ['active-integrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/mcp-servers/active/list');
      if (!res.ok) throw new Error('Failed to fetch active integrations');
      return res.json();
    },
  });

  const servers: MCPServer[] = serversData?.servers || [];
  const categories = serversData?.categories || [];

  // Check if server is already activated
  const isActivated = (serverId: string) => {
    return activeIntegrations?.integrations?.some(
      (integration) => integration.type === serverId
    );
  };

  // Filter servers by search query
  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      searchQuery === '' ||
      server.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.capabilities.some((cap) =>
        cap.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">MCP Marketplace</h1>
            </div>
            <p className="text-muted-foreground">
              Browse and activate professional integrations to connect your enterprise tools
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCustomPresetForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Integration
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{servers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activated</p>
                  <p className="text-2xl font-bold">
                    {activeIntegrations?.integrations?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Official MCP</p>
                  <p className="text-2xl font-bold">
                    {servers.filter((s) => s.officialMCP).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Filter className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="gap-2">
              <Store className="w-4 h-4" />
              All
            </TabsTrigger>
            {categories.map((category: string) => {
              const Icon = categoryIcons[category] || Building2;
              return (
                <TabsTrigger key={category} value={category} className="gap-2">
                  <Icon className="w-4 h-4" />
                  {categoryLabels[category] || category}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Server Grid/List */}
        {serversLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredServers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}
          >
            {filteredServers.map((server) => (
              <MCPServerCard
                key={server.id}
                server={server}
                isActivated={isActivated(server.id)}
                viewMode={viewMode}
                onActivate={() => setActivatingServer(server)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activation Modal */}
      {activatingServer && (
        <MCPActivationModal
          server={activatingServer}
          onClose={() => setActivatingServer(null)}
          onSuccess={() => {
            setActivatingServer(null);
            queryClient.invalidateQueries({ queryKey: ['active-integrations'] });
          }}
        />
      )}

      {/* Custom MCP Preset Form */}
      <CustomMCPPresetForm
        open={showCustomPresetForm}
        onOpenChange={setShowCustomPresetForm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
        }}
      />
    </AdminLayout>
  );
}

interface MCPServerCardProps {
  server: MCPServer;
  isActivated: boolean;
  viewMode: 'grid' | 'list';
  onActivate: () => void;
}

function MCPServerCard({ server, isActivated, viewMode, onActivate }: MCPServerCardProps) {
  const CategoryIcon = categoryIcons[server.category] || Building2;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CategoryIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold truncate">{server.displayName}</h3>
                {server.officialMCP && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="w-3 h-3" />
                    Official
                  </Badge>
                )}
                {isActivated && (
                  <Badge variant="default" className="bg-green-600 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {server.description || server.capabilities.slice(0, 3).join(' • ')}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  <CategoryIcon className="w-3 h-3" />
                  {categoryLabels[server.category]}
                </Badge>
                {server.usedBy.slice(0, 3).map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                onClick={onActivate}
                disabled={isActivated}
                className="gap-2"
              >
                {isActivated ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Activated
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <CategoryIcon className="w-6 h-6 text-white" />
          </div>

          <div className="flex gap-1">
            {server.officialMCP && (
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3" />
                Official
              </Badge>
            )}
            {isActivated && (
              <Badge variant="default" className="bg-green-600 gap-1">
                <CheckCircle className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className="line-clamp-1">{server.displayName}</CardTitle>
        <CardDescription className="line-clamp-2">
          {server.description || server.capabilities.slice(0, 2).join(' • ')}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">CATEGORY</p>
            <Badge variant="outline" className="gap-1">
              <CategoryIcon className="w-3 h-3" />
              {categoryLabels[server.category]}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">USED BY</p>
            <div className="flex flex-wrap gap-1">
              {server.usedBy.slice(0, 4).map((role) => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              CAPABILITIES ({server.capabilities.length})
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {server.capabilities.slice(0, 3).join(' • ')}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onActivate}
          disabled={isActivated}
          className="w-full gap-2"
        >
          {isActivated ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Activated
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Activate
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
