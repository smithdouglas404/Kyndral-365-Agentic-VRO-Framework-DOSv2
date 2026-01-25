import { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { showSuccess } from '@/lib/errorHandling';

/**
 * NOTIFICATION PREFERENCES
 *
 * User preferences for notification behavior:
 * - Sound notifications
 * - Desktop notifications
 * - Severity filters
 * - Agent-specific preferences
 */

interface NotificationPreferences {
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  notifySeverities: ('critical' | 'high' | 'medium' | 'low')[];
  notifyAgents: string[];
  soundVolume: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: false,
  desktopNotificationsEnabled: false,
  notifySeverities: ['critical', 'high'],
  notifyAgents: [],
  soundVolume: 0.5,
};

const AGENTS = [
  { id: 'finops', label: 'FinOps Agent' },
  { id: 'tmo', label: 'TMO Agent' },
  { id: 'risk', label: 'Risk Agent' },
  { id: 'vro', label: 'VRO Agent' },
  { id: 'pmo', label: 'PMO Agent' },
  { id: 'ocm', label: 'OCM Agent' },
];

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }
  }, []);

  // Save preferences
  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
    setHasChanges(false);
    showSuccess('Notification preferences saved');
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    savePreferences(updated);
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreference('desktopNotificationsEnabled', true);
        showSuccess('Desktop notifications enabled');

        // Test notification
        new Notification('Enterprise PMO', {
          body: 'You will now receive desktop notifications for critical alerts',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const testSound = () => {
    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.volume = preferences.soundVolume;
    audio.play().catch((e) => console.log('Audio playback failed:', e));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sound Notifications</CardTitle>
          <CardDescription>
            Play a sound when new notifications arrive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {preferences.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="sound-enabled">Enable sound</Label>
            </div>
            <Switch
              id="sound-enabled"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
            />
          </div>

          {preferences.soundEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="volume"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.soundVolume}
                    onChange={(e) => updatePreference('soundVolume', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3ch]">
                    {Math.round(preferences.soundVolume * 100)}%
                  </span>
                </div>
              </div>
              <button
                onClick={testSound}
                className="text-sm text-blue-600 hover:underline"
              >
                Test sound
              </button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desktop Notifications</CardTitle>
          <CardDescription>
            Show notifications even when the browser is in the background
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="desktop-notifications">Enable desktop notifications</Label>
            </div>
            {!('Notification' in window) ? (
              <span className="text-sm text-muted-foreground">Not supported</span>
            ) : Notification.permission === 'denied' ? (
              <span className="text-sm text-red-600">Blocked by browser</span>
            ) : (
              <Switch
                id="desktop-notifications"
                checked={preferences.desktopNotificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked && Notification.permission === 'default') {
                    requestDesktopPermission();
                  } else {
                    updatePreference('desktopNotificationsEnabled', checked);
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Severity Filters</CardTitle>
          <CardDescription>
            Choose which severity levels trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {['critical', 'high', 'medium', 'low'].map((severity) => (
            <div key={severity} className="flex items-center justify-between">
              <Label htmlFor={`severity-${severity}`} className="capitalize">
                {severity}
              </Label>
              <Switch
                id={`severity-${severity}`}
                checked={preferences.notifySeverities.includes(severity as any)}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...preferences.notifySeverities, severity as any]
                    : preferences.notifySeverities.filter((s) => s !== severity);
                  updatePreference('notifySeverities', updated);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Notifications</CardTitle>
          <CardDescription>
            Select which agents you want to receive notifications from (empty = all agents)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between">
              <Label htmlFor={`agent-${agent.id}`}>{agent.label}</Label>
              <Switch
                id={`agent-${agent.id}`}
                checked={
                  preferences.notifyAgents.length === 0 ||
                  preferences.notifyAgents.includes(agent.id)
                }
                onCheckedChange={(checked) => {
                  if (preferences.notifyAgents.length === 0) {
                    // If all agents enabled, disable this one
                    const updated = AGENTS.filter((a) => a.id !== agent.id).map((a) => a.id);
                    updatePreference('notifyAgents', updated);
                  } else {
                    const updated = checked
                      ? [...preferences.notifyAgents, agent.id]
                      : preferences.notifyAgents.filter((id) => id !== agent.id);

                    // If all agents selected, clear array (meaning "all")
                    if (updated.length === AGENTS.length) {
                      updatePreference('notifyAgents', []);
                    } else {
                      updatePreference('notifyAgents', updated);
                    }
                  }
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to access notification preferences
 */
export function useNotificationPreferences(): NotificationPreferences {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }
  }, []);

  return preferences;
}

/**
 * Check if notification should be shown based on preferences
 */
export function shouldShowNotification(
  severity: string,
  agent: string,
  preferences: NotificationPreferences
): boolean {
  // Check severity
  if (!preferences.notifySeverities.includes(severity as any)) {
    return false;
  }

  // Check agent (empty array means all agents)
  if (preferences.notifyAgents.length > 0 && !preferences.notifyAgents.includes(agent)) {
    return false;
  }

  return true;
}
