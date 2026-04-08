import { useState, useMemo, type ReactNode } from 'react';
import {
  Card,
  Text,
  Flex,
  Badge,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  type Color,
} from '@tremor/react';
import {
  Plus,
  Share2,
  Settings,
  Sparkles,
  Filter,
  Download,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  type Workspace,
  type WorkspaceTab,
} from '@/lib/navigationRegistry';
import { DynamicDashboard, type DashboardMode } from '@/dashboard/core/DynamicDashboard';
import { ShareDialog, type ShareConfig } from '@/dashboard/sharing/ShareDialog';
import { WidgetCatalog } from '@/dashboard/catalog/WidgetCatalog';
import { AIWidgetBuilder } from '@/dashboard/ai-builder/AIWidgetBuilder';

// ============================================================================
// Types
// ============================================================================

interface WorkspacePageProps {
  workspace: Workspace;
  initialTab?: string;
  onTabChange?: (tabId: string) => void;
  customActions?: ReactNode;
}

interface WorkspaceHeaderProps {
  workspace: Workspace;
  onAddWidget: () => void;
  onShare: () => void;
  onAIBuilder: () => void;
  onRefresh: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

// ============================================================================
// Workspace Header Component
// ============================================================================

function WorkspaceHeader({
  workspace,
  onAddWidget,
  onShare,
  onAIBuilder,
  onRefresh,
  isEditMode,
  onToggleEditMode,
}: WorkspaceHeaderProps) {
  return (
    <div className="bg-tremor-background border-b border-tremor-border">
      <div className="px-6 py-4">
        <Flex justifyContent="between" alignItems="start">
          {/* Left: Title and Description */}
          <div>
            <Flex alignItems="center" className="gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                `bg-${workspace.color || 'blue'}-100 dark:bg-${workspace.color || 'blue'}-900/30`
              )}>
                <workspace.icon className={cn(
                  'h-6 w-6',
                  `text-${workspace.color || 'blue'}-600`
                )} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-tremor-content-emphasis">
                  {workspace.label}
                </h1>
                <Text className="text-tremor-content-subtle">
                  {workspace.description}
                </Text>
              </div>
            </Flex>
          </div>

          {/* Right: Actions */}
          <Flex className="gap-2">
            {/* Refresh */}
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* AI Widget Builder */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAIBuilder}
              className="gap-1"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Widget
            </Button>

            {/* Add Widget */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAddWidget}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>

            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-1"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            {/* Edit Mode Toggle */}
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleEditMode}
            >
              {isEditMode ? 'Done Editing' : 'Customize'}
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Workspace Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>
        </Flex>

        {/* Role Badge */}
        {workspace.allowedRoles && workspace.allowedRoles.length > 0 && (
          <Flex className="mt-3 gap-2">
            <Text className="text-xs text-tremor-content-subtle">Access:</Text>
            {workspace.allowedRoles.map((role) => (
              <Badge key={role} color="gray" size="xs">
                {role}
              </Badge>
            ))}
          </Flex>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Workspace Tabs Component
// ============================================================================

interface WorkspaceTabsContentProps {
  tabs: WorkspaceTab[];
  activeTab: number;
  onTabChange: (index: number) => void;
  isEditMode: boolean;
  workspaceId: string;
}

function WorkspaceTabsContent({
  tabs,
  activeTab,
  onTabChange,
  isEditMode,
  workspaceId,
}: WorkspaceTabsContentProps) {
  return (
    <TabGroup index={activeTab} onIndexChange={onTabChange}>
      <div className="border-b border-tremor-border bg-tremor-background-subtle/50">
        <TabList className="px-6">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              className="px-4"
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </div>

      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.id}>
            <div className="p-6">
              <DynamicDashboard
                workspaceType={workspaceId}
                tabId={tab.id}
                defaultWidgets={tab.defaultWidgets || []}
                mode={isEditMode ? 'edit' : 'view'}
              />
            </div>
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}

// ============================================================================
// Main Workspace Page Component
// ============================================================================

export function WorkspacePage({
  workspace,
  initialTab,
  onTabChange,
  customActions,
}: WorkspacePageProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    if (initialTab) {
      const index = workspace.tabs.findIndex((t) => t.id === initialTab);
      return index >= 0 ? index : 0;
    }
    return 0;
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeTab = workspace.tabs[activeTabIndex];

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    onTabChange?.(workspace.tabs[index].id);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleShare = async (config: ShareConfig) => {
    // TODO: Implement actual share API call
    console.log('Sharing with config:', config);
    // Return mock share URL
    return `https://app.example.com/shared/${Math.random().toString(36).slice(2)}`;
  };

  const handleAddWidget = (widgetIds: string[]) => {
    // TODO: Add widgets to dashboard
    console.log('Adding widgets:', widgetIds);
    setShowWidgetCatalog(false);
  };

  const handleAIWidgetGenerate = async (prompt: string) => {
    // TODO: Generate widget with AI
    console.log('Generating widget from prompt:', prompt);
    return {
      code: `// Generated widget for: ${prompt}`,
      name: 'AI Generated Widget',
    };
  };

  return (
    <div className="min-h-screen bg-tremor-background-subtle" key={refreshKey}>
      {/* Header */}
      <WorkspaceHeader
        workspace={workspace}
        onAddWidget={() => setShowWidgetCatalog(true)}
        onShare={() => setShowShareDialog(true)}
        onAIBuilder={() => setShowAIBuilder(true)}
        onRefresh={handleRefresh}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
      />

      {/* Custom Actions Slot */}
      {customActions && (
        <div className="px-6 py-3 bg-tremor-background border-b border-tremor-border">
          {customActions}
        </div>
      )}

      {/* Tabs and Content */}
      {workspace.tabs.length > 0 ? (
        <WorkspaceTabsContent
          tabs={workspace.tabs}
          activeTab={activeTabIndex}
          onTabChange={handleTabChange}
          isEditMode={isEditMode}
          workspaceId={workspace.id}
        />
      ) : (
        <div className="p-6">
          <DynamicDashboard
            workspaceType={workspace.id}
            defaultWidgets={workspace.defaultWidgets || []}
            mode={isEditMode ? 'edit' : 'view'}
          />
        </div>
      )}

      {/* Dialogs */}
      <WidgetCatalog
        open={showWidgetCatalog}
        onOpenChange={setShowWidgetCatalog}
        onAddWidgets={handleAddWidget}
        currentWidgets={[]}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={handleShare}
        shareType="dashboard"
        itemName={`${workspace.label} - ${activeTab?.label || 'Dashboard'}`}
      />

      <AIWidgetBuilder
        open={showAIBuilder}
        onOpenChange={setShowAIBuilder}
        onGenerate={handleAIWidgetGenerate}
        onSave={(widget) => {
          console.log('Saving AI widget:', widget);
          setShowAIBuilder(false);
        }}
      />
    </div>
  );
}

// ============================================================================
// Simple Dashboard Page (No Tabs)
// ============================================================================

interface DashboardPageProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  color?: Color;
  defaultWidgets?: string[];
  showAIInsights?: boolean;
}

export function DashboardPage({
  title,
  subtitle,
  icon: Icon,
  color = 'blue',
  defaultWidgets = [],
  showAIInsights = true,
}: DashboardPageProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  return (
    <div className="min-h-screen bg-tremor-background-subtle">
      {/* Header */}
      <div className="bg-tremor-background border-b border-tremor-border px-6 py-4">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="gap-3">
            {Icon && (
              <div className={cn(
                'p-2 rounded-lg',
                `bg-${color}-100 dark:bg-${color}-900/30`
              )}>
                <Icon className={cn('h-6 w-6', `text-${color}-600`)} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-tremor-content-emphasis">
                {title}
              </h1>
              {subtitle && (
                <Text className="text-tremor-content-subtle">{subtitle}</Text>
              )}
            </div>
          </Flex>

          <Flex className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetCatalog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Widget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Done' : 'Customize'}
            </Button>
          </Flex>
        </Flex>
      </div>

      {/* Content */}
      <div className="p-6">
        <DynamicDashboard
          workspaceType="dashboard"
          defaultWidgets={defaultWidgets}
          mode={isEditMode ? 'edit' : 'view'}
          showAIInsights={showAIInsights}
        />
      </div>

      {/* Dialogs */}
      <WidgetCatalog
        open={showWidgetCatalog}
        onOpenChange={setShowWidgetCatalog}
        onAddWidgets={(ids) => {
          console.log('Adding widgets:', ids);
          setShowWidgetCatalog(false);
        }}
        currentWidgets={[]}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={async (config) => {
          console.log('Sharing:', config);
          return `https://app.example.com/shared/${Date.now()}`;
        }}
        shareType="dashboard"
        itemName={title}
      />
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default WorkspacePage;
