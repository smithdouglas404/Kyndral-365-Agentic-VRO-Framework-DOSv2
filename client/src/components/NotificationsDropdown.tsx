import { Bell, Check, X, AlertCircle, CheckCircle, Info, AlertTriangle, ExternalLink, Wifi, WifiOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDismissNotification, type Notification } from "@/hooks/useNotifications";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { useCompanyProfile } from "@/contexts/CompanyProfileContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

function getSeverityIcon(severity: string | null) {
  switch (severity) {
    case 'critical':
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'sync_failure':
    case 'alert':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function NotificationItem({ notification, onMarkRead, onDismiss }: { 
  notification: Notification; 
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const timeAgo = notification.createdAt 
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : 'Just now';

  return (
    <div 
      className={cn(
        "p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors",
        !notification.isRead && "bg-blue-50/50"
      )}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-medium truncate", !notification.isRead && "text-gray-900")}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-gray-400">{timeAgo}</span>
            <div className="flex items-center gap-1">
              {notification.actionUrl && (
                <Link href={notification.actionUrl}>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" data-testid={`notification-action-${notification.id}`}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </Link>
              )}
              {!notification.isRead && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
                  data-testid={`notification-read-${notification.id}`}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-gray-400 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                data-testid={`notification-dismiss-${notification.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsDropdown() {
  const { hasActiveCompany, isLoading: profileLoading } = useCompanyProfile();
  const { data: notifications = [], isLoading } = useNotifications(true);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const { isConnected } = useWebSocketContext();

  // Only show notification count if setup is complete
  const unreadCount = hasActiveCompany ? notifications.filter(n => !n.isRead).length : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" data-testid="button-notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {hasActiveCompany && isConnected && (
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" title="Live updates active" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {hasActiveCompany && isConnected ? (
              <span className="flex items-center gap-1 text-[10px] text-green-600">
                <Wifi className="h-3 w-3" />
                Live
              </span>
            ) : hasActiveCompany ? (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <WifiOff className="h-3 w-3" />
              </span>
            ) : null}
          </div>
          {hasActiveCompany && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => markAllRead.mutate()}
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {!hasActiveCompany ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="font-medium text-gray-600 mb-1">Setup Required</p>
              <p className="text-xs">Complete the setup wizard to enable notifications</p>
            </div>
          ) : isLoading || profileLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No notifications
            </div>
          ) : (
            notifications.slice(0, 20).map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markRead.mutate(notification.id)}
                onDismiss={() => dismiss.mutate(notification.id)}
              />
            ))
          )}
        </ScrollArea>
        
        {hasActiveCompany && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="w-full text-xs" data-testid="button-view-all-notifications">
                  View notification settings
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
