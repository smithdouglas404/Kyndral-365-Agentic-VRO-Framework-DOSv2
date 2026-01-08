import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DataModeToggleProps {
  viewMode: 'realtime' | 'snapshot';
  onViewModeChange: (mode: 'realtime' | 'snapshot') => void;
}

export function DataModeToggle({ viewMode, onViewModeChange }: DataModeToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('realtime')}
        className={cn(
          "gap-2 h-8 px-3 transition-all",
          viewMode === 'realtime' 
            ? "bg-white shadow-sm text-green-700" 
            : "text-gray-500 hover:text-gray-700"
        )}
        data-testid="btn-realtime-mode"
      >
        <span className="relative flex h-2 w-2">
          {viewMode === 'realtime' && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </>
          )}
          {viewMode !== 'realtime' && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
          )}
        </span>
        <span className="text-xs font-medium">Real-time</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('snapshot')}
        className={cn(
          "gap-2 h-8 px-3 transition-all",
          viewMode === 'snapshot' 
            ? "bg-white shadow-sm text-blue-700" 
            : "text-gray-500 hover:text-gray-700"
        )}
        data-testid="btn-snapshot-mode"
      >
        <Calendar size={14} />
        <span className="text-xs font-medium">30-Day Snapshot</span>
      </Button>
    </div>
  );
}

export function LiveBadge() {
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
      </span>
      Live
    </Badge>
  );
}
