/**
 * VOICE BRIEFING PLAYER
 * NotebookLM-style podcast player for project summaries
 *
 * Generates and plays conversational audio briefings with two AI hosts
 * discussing project status, risks, and agent recommendations.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Mic,
  Play,
  Pause,
  Download,
  Sparkles,
  Clock,
  Users,
  FileAudio,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceBriefingPlayerProps {
  projectId?: string;
  portfolioId?: string;
  projectName?: string;
  type?: 'project' | 'portfolio' | 'weekly_summary';
}

interface Briefing {
  id: string;
  type: string;
  projectId?: string;
  portfolioId?: string;
  script: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
}

export function VoiceBriefingPlayer({
  projectId,
  portfolioId,
  projectName = 'Project',
  type = 'project',
}: VoiceBriefingPlayerProps) {
  const { toast } = useToast();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate briefing mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/voice-briefings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          projectId,
          portfolioId,
          includeRisks: true,
          includeRecommendations: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate briefing');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setBriefing(data.briefing);
      toast({
        title: 'Briefing Generated',
        description: 'Your podcast-style briefing is ready to play.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Audio controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse script to display with speaker labels
  const parseScript = (script: string) => {
    const lines = script.split('\n').filter(line => line.trim());
    return lines.map((line, idx) => {
      const match = line.match(/^(Sarah|Marcus):\s*(.+)$/);
      if (match) {
        const [, speaker, content] = match;
        return {
          id: idx,
          speaker,
          content,
          color: speaker === 'Sarah' ? 'text-purple-700' : 'text-blue-700',
          bgColor: speaker === 'Sarah' ? 'bg-purple-50' : 'bg-blue-50',
        };
      }
      return { id: idx, speaker: '', content: line, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    });
  };

  if (!briefing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Briefing
          </CardTitle>
          <CardDescription>
            Generate a NotebookLM-style podcast summary with AI hosts discussing {projectName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">
                Meet Your AI Podcast Hosts
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Sarah
                  </Badge>
                  <span>PMO Analyst - Data-driven insights and metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    Marcus
                  </Badge>
                  <span>Executive Coach - Strategic perspective and impact</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated duration: 2-3 minutes</span>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Podcast...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Voice Briefing
              </>
            )}
          </Button>

          {generateMutation.isPending && (
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Creating conversational script...</p>
              <p className="text-xs">This may take 10-15 seconds</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const scriptLines = parseScript(briefing.script);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          Voice Briefing
        </CardTitle>
        <CardDescription>
          Podcast-style summary generated at {new Date(briefing.createdAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Player */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 space-y-4">
          {/* Play/Pause and Time */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-white"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-32"
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                if (!briefing?.audioUrl) {
                  toast({
                    title: 'Error',
                    description: 'No audio file available to download',
                    variant: 'destructive',
                  });
                  return;
                }

                // Create temporary anchor element and trigger download
                const link = document.createElement('a');
                link.href = briefing.audioUrl;
                link.download = `${projectName}-briefing-${new Date().toISOString().split('T')[0]}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast({
                  title: 'Download Started',
                  description: 'Your voice briefing audio is being downloaded',
                });
              }}
              disabled={!briefing?.audioUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Script Toggle */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Podcast Transcript</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScript(!showScript)}
          >
            {showScript ? 'Hide' : 'Show'} Script
          </Button>
        </div>

        {/* Script Display */}
        {showScript && (
          <ScrollArea className="h-64 rounded-lg border">
            <div className="p-4 space-y-3">
              {scriptLines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    'p-3 rounded-lg',
                    line.bgColor
                  )}
                >
                  {line.speaker && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          line.speaker === 'Sarah'
                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                            : 'bg-blue-100 text-blue-700 border-blue-300'
                        )}
                      >
                        {line.speaker}
                      </Badge>
                    </div>
                  )}
                  <p className={cn('text-sm', line.color)}>{line.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Generate New Briefing */}
        <Button
          variant="outline"
          onClick={() => {
            setBriefing(null);
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate New Briefing
        </Button>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={briefing.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </CardContent>
    </Card>
  );
}
