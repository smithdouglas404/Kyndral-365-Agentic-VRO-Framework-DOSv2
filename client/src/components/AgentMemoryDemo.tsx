/**
 * Agent Memory Demo
 * Visualizes Mem0 agent memory - facts learned, patterns recognized, and recall
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Lightbulb, Database, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MemoryFact {
  id: string;
  agentName: string;
  entity: string;
  attribute: string;
  value: any;
  confidence: number;
  timestamp: string;
  source: string;
}

interface PatternRecognition {
  pattern: string;
  confidence: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  relatedProjects: string[];
  historicalContext: string;
}

export function AgentMemoryDemo() {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [patterns, setPatterns] = useState<PatternRecognition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemoryData();
  }, []);

  const loadMemoryData = async () => {
    try {
      // Check if demo mode is active
      const demoResponse = await fetch('/api/demo/status', { credentials: 'include' });
      const demoStatus = await demoResponse.json();

      if (!demoStatus.active) {
        setLoading(false);
        return;
      }

      // Load demo data
      const dataResponse = await fetch('/api/demo/data', { credentials: 'include' });
      const demoData = await dataResponse.json();

      // Extract facts from fact_broadcast observations
      const extractedFacts: MemoryFact[] = [];
      demoData.observations
        ?.filter((obs: any) => obs.type === 'fact_broadcast')
        .forEach((obs: any, idx: number) => {
          // Parse fact from description
          const factMatch = obs.description.match(/(\w+)\s+([\w\s]+):\s+(.+)/);
          if (factMatch) {
            extractedFacts.push({
              id: `fact-${idx}`,
              agentName: obs.sourceAgent,
              entity: factMatch[1],
              attribute: factMatch[2].trim(),
              value: factMatch[3],
              confidence: obs.confidence || 0.9,
              timestamp: obs.broadcastAt,
              source: obs.projectName || 'Portfolio Analysis',
            });
          }
        });

      // Extract patterns from pattern_detection observations
      const extractedPatterns: PatternRecognition[] = [];
      const patternMap = new Map<string, any>();

      demoData.observations
        ?.filter((obs: any) => obs.type === 'pattern_detection')
        .forEach((obs: any) => {
          const patternName = obs.pattern;

          if (patternMap.has(patternName)) {
            const existing = patternMap.get(patternName);
            existing.occurrences++;
            existing.lastSeen = obs.observedAt;
            existing.relatedProjects.push(obs.projectName);
          } else {
            patternMap.set(patternName, {
              pattern: patternName,
              confidence: obs.confidence,
              occurrences: 1,
              firstSeen: obs.observedAt,
              lastSeen: obs.observedAt,
              relatedProjects: [obs.projectName],
              historicalContext: obs.historicalContext || 'Pattern recognized through historical analysis',
            });
          }
        });

      extractedPatterns.push(...Array.from(patternMap.values()));

      setFacts(extractedFacts.slice(0, 50)); // Limit to 50 most recent
      setPatterns(extractedPatterns);
      setLoading(false);
    } catch (error) {
      console.error('Error loading memory data:', error);
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading agent memory...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Agent Memory (Mem0)
            </CardTitle>
            <CardDescription>
              Facts learned and patterns recognized by AI agents over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              <Database className="w-3 h-3 mr-1" />
              {facts.length} Facts
            </Badge>
            <Badge variant="outline">
              <TrendingUp className="w-3 h-3 mr-1" />
              {patterns.length} Patterns
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="facts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facts">Facts Learned</TabsTrigger>
            <TabsTrigger value="patterns">Patterns Recognized</TabsTrigger>
          </TabsList>

          <TabsContent value="facts">
            {facts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No facts in memory. Activate demo mode to see agent learning.
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {facts.map((fact) => (
                    <div key={fact.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {fact.agentName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{fact.source}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(fact.timestamp)}
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-semibold">{fact.entity}</span>
                        <span className="text-muted-foreground"> {fact.attribute}: </span>
                        <span className="font-medium">{String(fact.value)}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${fact.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(fact.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="patterns">
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No patterns recognized yet. Activate demo mode to see pattern detection.
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {patterns.map((pattern, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-500" />
                          <h4 className="font-semibold">{pattern.pattern}</h4>
                        </div>
                        <Badge variant="secondary">
                          {pattern.occurrences} occurrence{pattern.occurrences > 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {pattern.historicalContext}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div>
                          First seen: {formatTimestamp(pattern.firstSeen)}
                        </div>
                        <span>•</span>
                        <div>
                          Last seen: {formatTimestamp(pattern.lastSeen)}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-medium mb-1">Related Projects:</div>
                        <div className="flex flex-wrap gap-1">
                          {pattern.relatedProjects.slice(0, 3).map((project, pIdx) => (
                            <Badge key={pIdx} variant="outline" className="text-xs">
                              {project}
                            </Badge>
                          ))}
                          {pattern.relatedProjects.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{pattern.relatedProjects.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${pattern.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(pattern.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
