import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Wifi, WifiOff } from 'lucide-react';

export function RealTimeNotifications() {
  return null;
}

export function ConnectionIndicator() {
  const { isConnected } = useWebSocketContext();
  
  return (
    <div 
      className="flex items-center gap-1.5 text-xs" 
      title={isConnected ? 'Real-time updates active' : 'Connecting to real-time updates...'}
      data-testid="connection-indicator"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-600 hidden sm:inline">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-gray-400 animate-pulse" />
          <span className="text-gray-400 hidden sm:inline">Connecting...</span>
        </>
      )}
    </div>
  );
}
