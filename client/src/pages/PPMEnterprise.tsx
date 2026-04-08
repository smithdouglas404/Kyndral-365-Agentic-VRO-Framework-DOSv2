/**
 * PPM Enterprise Page
 *
 * Unified enterprise PPM interface combining:
 * - Grid Dashboard - Primary operational view with Tremor widgets
 * - Canvas - Infinite workspace for agent exploration
 * - Command Center - Dense monitoring and control
 * - Persistent Chat - AI assistant sidebar
 *
 * All views share agent state through PPMAgentContext.
 */

import { useCallback } from 'react';
import { PPMLayout, PPMCanvas, PPMCommandCenter, PPMChat, usePPMLayout } from '@/components/ppm';
import { DynamicDashboard } from '@/dashboard/core/DynamicDashboard';
import { PPMAgentProvider, usePPMAgents } from '@/contexts/PPMAgentContext';

// ============================================================================
// Dashboard View Content
// ============================================================================

function DashboardViewContent() {
  return (
    <div className="p-6">
      <DynamicDashboard
        workspaceType="ppm"
        defaultWidgets={[
          'budget-overview',
          'risk-forecast',
          'portfolio-health',
          'agent-insights',
          'project-status',
          'milestones',
        ]}
        widgetComponents={{}}
      />
    </div>
  );
}

// ============================================================================
// Canvas View Content (with shared agent state)
// ============================================================================

function CanvasViewContent() {
  const { setChatOpen, setChatMinimized } = usePPMLayout();
  const { setActiveAgentChat, setSelectedAgent } = usePPMAgents();

  const handleAgentChat = useCallback((agentId: string) => {
    // Extract agent ID from node ID (e.g., 'agent-finops' -> 'finops')
    const cleanId = agentId.replace('agent-', '');
    setActiveAgentChat(cleanId);
    setSelectedAgent(cleanId);
    setChatOpen(true);
    setChatMinimized(false);
  }, [setActiveAgentChat, setSelectedAgent, setChatOpen, setChatMinimized]);

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <PPMCanvas onAgentChat={handleAgentChat} />
    </div>
  );
}

// ============================================================================
// Command Center View Content (with shared agent state)
// ============================================================================

function CommandCenterViewContent() {
  const { setChatOpen, setChatMinimized } = usePPMLayout();
  const {
    updateAgentStatus,
    acknowledgeAlert,
    setActiveAgentChat,
    triggerAction,
  } = usePPMAgents();

  const handleAgentAction = useCallback(
    (agentId: string, action: string) => {
      switch (action) {
        case 'chat':
          setActiveAgentChat(agentId);
          setChatOpen(true);
          setChatMinimized(false);
          break;
        case 'pause':
          updateAgentStatus(agentId, 'paused');
          triggerAction(agentId, 'pause');
          break;
        case 'resume':
          updateAgentStatus(agentId, 'running');
          triggerAction(agentId, 'resume');
          break;
        case 'details':
          // Could open a modal or navigate to agent details
          console.log('Show details for agent:', agentId);
          break;
        default:
          triggerAction(agentId, action);
      }
    },
    [
      setActiveAgentChat,
      setChatOpen,
      setChatMinimized,
      updateAgentStatus,
      triggerAction,
    ]
  );

  const handleAlertAction = useCallback(
    (alertId: string, action: string) => {
      switch (action) {
        case 'acknowledge':
          acknowledgeAlert(alertId);
          break;
        case 'view':
          // Could open alert details or navigate
          console.log('View alert:', alertId);
          break;
        default:
          console.log('Alert action:', alertId, action);
      }
    },
    [acknowledgeAlert]
  );

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <PPMCommandCenter
        onAgentAction={handleAgentAction}
        onAlertAction={handleAlertAction}
      />
    </div>
  );
}

// ============================================================================
// Chat View Content (with shared agent state)
// ============================================================================

function ChatViewContent() {
  const { activeAgentChat, sendMessage, triggerAction } = usePPMAgents();

  const handleSendMessage = useCallback(
    async (message: string, agentId: string) => {
      console.log('Sending message to agent:', agentId, message);

      // Record the action
      triggerAction(agentId, 'chat-message');

      // Actually send the message (in real implementation, this would call the API)
      try {
        const response = await sendMessage(agentId, message);
        console.log('Agent response:', response);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [sendMessage, triggerAction]
  );

  return <PPMChat onSendMessage={handleSendMessage} />;
}

// ============================================================================
// Inner PPM Layout (needs access to PPMAgentContext)
// ============================================================================

function PPMEnterpriseInner() {
  return (
    <PPMLayout
      defaultView="dashboard"
      dashboardView={<DashboardViewContent />}
      canvasView={<CanvasViewContent />}
      commandView={<CommandCenterViewContent />}
      chatView={<ChatViewContent />}
    >
      {/* Additional content can be added here */}
    </PPMLayout>
  );
}

// ============================================================================
// Main PPM Enterprise Page (with Provider)
// ============================================================================

export function PPMEnterprise() {
  return (
    <PPMAgentProvider>
      <PPMEnterpriseInner />
    </PPMAgentProvider>
  );
}

// ============================================================================
// Alternative: PPM with Custom Views
// ============================================================================

interface PPMEnterpriseCustomProps {
  customDashboard?: React.ReactNode;
  customCanvas?: React.ReactNode;
  customCommand?: React.ReactNode;
  customChat?: React.ReactNode;
  defaultView?: 'dashboard' | 'canvas' | 'command';
}

export function PPMEnterpriseCustom({
  customDashboard,
  customCanvas,
  customCommand,
  customChat,
  defaultView = 'dashboard',
}: PPMEnterpriseCustomProps) {
  return (
    <PPMAgentProvider>
      <PPMLayout
        defaultView={defaultView}
        dashboardView={customDashboard || <DashboardViewContent />}
        canvasView={customCanvas || <CanvasViewContent />}
        commandView={customCommand || <CommandCenterViewContent />}
        chatView={customChat || <ChatViewContent />}
      >
        {null}
      </PPMLayout>
    </PPMAgentProvider>
  );
}

export default PPMEnterprise;
