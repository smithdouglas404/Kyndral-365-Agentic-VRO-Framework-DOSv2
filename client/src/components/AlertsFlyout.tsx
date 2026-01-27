import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, AlertTriangle, Lightbulb, TrendingUp, GitBranch, Zap, Target, Clock, ChevronRight, DollarSign, Users, Shield } from 'lucide-react';
import { useUnifiedNotifications, UnifiedNotification, NotificationSeverity } from '@/contexts/UnifiedNotificationContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const priorityColors: Record<NotificationSeverity, string> = {
  critical: "#D50032",
  high: "#f59e0b",
  medium: "#005EB8",
  low: "#00843D",
  info: "#6B7280"
};

const typeIcons: Record<string, React.ReactNode> = {
  agent_insight: <Brain size={16} />,
  prediction: <TrendingUp size={16} />,
  recommendation: <Lightbulb size={16} />,
  intervention: <AlertTriangle size={16} />,
  system_event: <Zap size={16} />,
  budget: <DollarSign size={16} />,
  resource: <Users size={16} />,
  risk: <Shield size={16} />,
  dependency: <GitBranch size={16} />,
  value_milestone: <Target size={16} />,
};

interface AlertsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertsFlyout({ isOpen, onClose }: AlertsFlyoutProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    getByType,
    getBySeverity,
  } = useUnifiedNotifications();

  const handleNotificationClick = (notification: UnifiedNotification) => {
    markAsRead(notification.id);
    
    // For now, just mark as read
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const insights = getByType('agent_insight');
  const predictions = getByType('prediction');
  const interventions = getByType('intervention');
  const systemEvents = getByType('system_event');
  const critical = getBySeverity('critical');

  const renderNotification = (notification: UnifiedNotification) => {
    const icon = typeIcons[notification.type] || <Brain size={16} />;
    const title = 'title' in notification ? notification.title : 'Notification';
    const description = 'description' in notification ? notification.description :
                       'message' in notification ? notification.message : '';

    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, x: 4 }}
        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
          !notification.read
            ? 'bg-blue-50 border-blue-200'
            : 'bg-white border-gray-100 hover:border-gray-200'
        }`}
        style={{ borderLeftColor: priorityColors[notification.severity], borderLeftWidth: 4 }}
        onClick={() => handleNotificationClick(notification)}
        data-testid={`notification-item-${notification.id}`}
      >
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-lg text-white flex-shrink-0 mt-0.5"
            style={{ backgroundColor: priorityColors[notification.severity] }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                className="text-white text-[10px]"
                style={{ backgroundColor: priorityColors[notification.severity] }}
              >
                {notification.severity.toUpperCase()}
              </Badge>
              {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              )}
              <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                <Clock size={10} />
                {formatTime(notification.timestamp)}
              </span>
            </div>
            <p className="font-semibold text-sm leading-tight mb-1">{title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            {'sourceAgent' in notification && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {notification.sourceAgent}
                </Badge>
                {' projectName' in notification && notification.projectName && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {notification.projectName}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(notification.id);
              }}
            >
              <X size={12} />
            </Button>
            <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-[540px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            data-testid="alerts-flyout"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain size={24} />
                  <div>
                    <h2 className="font-bold text-lg">Notification Center</h2>
                    <p className="text-sm text-white/80">
                      {unreadCount} unread · {critical.length} critical
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-white hover:bg-white/20 text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                    data-testid="close-alerts-flyout"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b px-4 bg-gray-50">
                <TabsTrigger value="all" className="text-xs">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">
                  Insights ({insights.length})
                </TabsTrigger>
                <TabsTrigger value="predictions" className="text-xs">
                  Predictions ({predictions.length})
                </TabsTrigger>
                <TabsTrigger value="interventions" className="text-xs">
                  Interventions ({interventions.length})
                </TabsTrigger>
                <TabsTrigger value="critical" className="text-xs">
                  Critical ({critical.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Brain size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No notifications yet</p>
                        <p className="text-sm">Agents are monitoring your portfolio...</p>
                      </div>
                    ) : (
                      notifications.map(renderNotification)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="insights" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {insights.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Brain size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No insights yet</p>
                      </div>
                    ) : (
                      insights.map(renderNotification)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="predictions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {predictions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No predictions yet</p>
                      </div>
                    ) : (
                      predictions.map(renderNotification)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="interventions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {interventions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No interventions needed</p>
                      </div>
                    ) : (
                      interventions.map(renderNotification)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="critical" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {critical.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Shield size={48} className="mx-auto mb-4 opacity-30 text-green-500" />
                        <p className="text-green-600 font-semibold">All Clear</p>
                        <p className="text-sm">No critical issues detected</p>
                      </div>
                    ) : (
                      critical.map(renderNotification)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-center text-muted-foreground">
                Real-time notifications from agent collaboration
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
