/**
 * PPM Layout - Unified Enterprise Layout
 *
 * Hybrid approach combining:
 * - Grid Dashboard (Tremor) - Primary operational view
 * - Canvas - Agent-driven exploration
 * - Command Center - Dense monitoring
 * - Persistent Chat - Quick questions
 */

import { useState, createContext, useContext, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Layers,
  Monitor,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Bell,
  Settings,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge, Flex, Text } from '@tremor/react';

// ============================================================================
// Types
// ============================================================================

export type PPMView = 'dashboard' | 'canvas' | 'command';

interface PPMLayoutContextValue {
  activeView: PPMView;
  setActiveView: (view: PPMView) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatMinimized: boolean;
  setChatMinimized: (minimized: boolean) => void;
  notifications: number;
}

interface PPMLayoutProps {
  children: ReactNode;
  dashboardView: ReactNode;
  canvasView: ReactNode;
  commandView: ReactNode;
  chatView: ReactNode;
  defaultView?: PPMView;
}

// ============================================================================
// Context
// ============================================================================

const PPMLayoutContext = createContext<PPMLayoutContextValue | null>(null);

export function usePPMLayout() {
  const context = useContext(PPMLayoutContext);
  if (!context) {
    throw new Error('usePPMLayout must be used within PPMLayout');
  }
  return context;
}

// ============================================================================
// View Switcher
// ============================================================================

interface ViewSwitcherProps {
  activeView: PPMView;
  onViewChange: (view: PPMView) => void;
}

function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  const views: { id: PPMView; label: string; icon: typeof LayoutDashboard; description: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Grid layout for daily operations',
    },
    {
      id: 'canvas',
      label: 'Canvas',
      icon: Layers,
      description: 'Infinite workspace for exploration',
    },
    {
      id: 'command',
      label: 'Command',
      icon: Monitor,
      description: 'Dense monitoring view',
    },
  ];

  return (
    <div className="flex items-center bg-tremor-background-subtle rounded-lg p-1">
      <TooltipProvider>
        {views.map((view) => (
          <Tooltip key={view.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange(view.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  activeView === view.id
                    ? 'bg-tremor-background text-tremor-content-emphasis shadow-sm'
                    : 'text-tremor-content-subtle hover:text-tremor-content-emphasis'
                )}
              >
                <view.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{view.label}</p>
              <p className="text-xs text-muted-foreground">{view.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// Header
// ============================================================================

interface PPMHeaderProps {
  activeView: PPMView;
  onViewChange: (view: PPMView) => void;
  onChatToggle: () => void;
  chatOpen: boolean;
  notifications: number;
}

function PPMHeader({
  activeView,
  onViewChange,
  onChatToggle,
  chatOpen,
  notifications,
}: PPMHeaderProps) {
  return (
    <header className="h-14 border-b border-tremor-border bg-tremor-background px-4 flex items-center justify-between">
      {/* Left: Logo + View Switcher */}
      <Flex alignItems="center" className="gap-6">
        <Flex alignItems="center" className="gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden md:inline">PPM Command</span>
        </Flex>

        <ViewSwitcher activeView={activeView} onViewChange={onViewChange} />
      </Flex>

      {/* Right: Actions */}
      <Flex alignItems="center" className="gap-2">
        {/* AI Chat Toggle */}
        <Button
          variant={chatOpen ? 'default' : 'outline'}
          size="sm"
          onClick={onChatToggle}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User */}
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </Flex>
    </header>
  );
}

// ============================================================================
// Chat Panel
// ============================================================================

interface ChatPanelProps {
  open: boolean;
  minimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  children: ReactNode;
}

function ChatPanel({ open, minimized, onClose, onMinimize, children }: ChatPanelProps) {
  if (!open) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="gap-2 shadow-lg"
        >
          <MessageSquare className="h-4 w-4" />
          AI Assistant
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-14 bottom-0 w-96 bg-tremor-background border-l border-tremor-border shadow-xl z-40 flex flex-col">
      {/* Chat Header */}
      <div className="h-12 border-b border-tremor-border px-4 flex items-center justify-between shrink-0">
        <Flex alignItems="center" className="gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <Text className="font-medium">AI Assistant</Text>
          <Badge color="emerald" size="xs">Online</Badge>
        </Flex>
        <Flex className="gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMinimize}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </Flex>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Main Layout
// ============================================================================

export function PPMLayout({
  children,
  dashboardView,
  canvasView,
  commandView,
  chatView,
  defaultView = 'dashboard',
}: PPMLayoutProps) {
  const [activeView, setActiveView] = useState<PPMView>(defaultView);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [notifications] = useState(3); // TODO: Connect to real notifications

  const contextValue: PPMLayoutContextValue = {
    activeView,
    setActiveView,
    chatOpen,
    setChatOpen,
    chatMinimized,
    setChatMinimized,
    notifications,
  };

  const handleChatToggle = () => {
    if (chatOpen && !chatMinimized) {
      setChatOpen(false);
    } else {
      setChatOpen(true);
      setChatMinimized(false);
    }
  };

  return (
    <PPMLayoutContext.Provider value={contextValue}>
      <div className="min-h-screen bg-tremor-background-subtle flex flex-col">
        {/* Header */}
        <PPMHeader
          activeView={activeView}
          onViewChange={setActiveView}
          onChatToggle={handleChatToggle}
          chatOpen={chatOpen && !chatMinimized}
          notifications={notifications}
        />

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            chatOpen && !chatMinimized ? 'mr-96' : ''
          )}
        >
          {/* View Content */}
          <div className={cn(activeView !== 'dashboard' && 'hidden')}>
            {dashboardView}
          </div>
          <div className={cn(activeView !== 'canvas' && 'hidden')}>
            {canvasView}
          </div>
          <div className={cn(activeView !== 'command' && 'hidden')}>
            {commandView}
          </div>

          {/* Additional children */}
          {children}
        </main>

        {/* Chat Panel */}
        <ChatPanel
          open={chatOpen}
          minimized={chatMinimized}
          onClose={() => setChatOpen(false)}
          onMinimize={() => setChatMinimized(!chatMinimized)}
        >
          {chatView}
        </ChatPanel>
      </div>
    </PPMLayoutContext.Provider>
  );
}

export default PPMLayout;
