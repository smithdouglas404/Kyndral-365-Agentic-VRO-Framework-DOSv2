import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, ArrowRight, TrendingUp, Activity, Network, Zap,
  BarChart3, Calendar, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgentMappings, useAgentMetadata } from '@/hooks/useAgentRegistry';

interface CollaborationMatrixProps {
  className?: string;
}

interface TopCollaboration {
  from: string;
  to: string;
  count: number;
  topReasons: string[];
}

interface MatrixData {
  timeframe: string;
  collaborationMatrix: Record<string, number>;
  topCollaborations: TopCollaboration[];
  totalInteractions: number;
}

export function AgentCollaborationMatrix({ className }: CollaborationMatrixProps) {
  const [timeframe, setTimeframe] = useState('7days');

  // Load agents from database
  const { data: agentMetadata = [] } = useAgentMetadata();
  const { getName, getColor, getEmoji } = useAgentMappings();
  const agentIds = useMemo(() => agentMetadata.map(a => a.id), [agentMetadata]);

  const { data, isLoading } = useQuery({
    queryKey: ['collaboration-matrix', timeframe],
    queryFn: async () => {
      const response = await fetch(
        `/api/deep-agents/collaboration-matrix?timeframe=${timeframe}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch collaboration matrix');
      }

      return response.json() as Promise<MatrixData>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const matrix = data?.collaborationMatrix || {};
  const topCollaborations = data?.topCollaborations || [];
  const totalInteractions = data?.totalInteractions || 0;

  // Build agent-to-agent grid
  const agents = agentIds.length > 0 ? agentIds : ['finops', 'tmo', 'risk', 'vro', 'pmo', 'ocm'];

  // Calculate total collaborations per agent
  const agentTotals: Record<string, number> = {};
  agents.forEach(agent => {
    agentTotals[agent] = 0;
  });

  Object.entries(matrix).forEach(([key, count]) => {
    const [from] = key.split('->');
    agentTotals[from] = (agentTotals[from] || 0) + count;
  });

  const maxCollaborations = Math.max(...Object.values(matrix), 1);

  return (
    <div className={className}>
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Network size={28} />
                Agent Collaboration Matrix
              </h2>
              <p className="text-white/80 text-sm">
                Real-time visualization of agent-to-agent collaboration patterns
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{totalInteractions}</p>
              <p className="text-sm text-white/80">Total Interactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeframe Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-gray-500" />
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Visualization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Collaboration Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header Row */}
              <div className="flex">
                <div className="w-32"></div>
                {agents.map((agent) => (
                  <div
                    key={agent}
                    className="w-24 text-center text-sm font-medium text-gray-600 py-2"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{getEmoji(agent)}</span>
                      <span>{getName(agent)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matrix Rows */}
              {agents.map((fromAgent) => (
                <div key={fromAgent} className="flex">
                  {/* Row Label */}
                  <div className="w-32 flex items-center gap-2 py-3 px-4 font-medium">
                    <span className="text-2xl">{getEmoji(fromAgent)}</span>
                    <span>{getName(fromAgent)}</span>
                  </div>

                  {/* Cells */}
                  {agents.map((toAgent) => {
                    const key = `${fromAgent}->${toAgent}`;
                    const count = matrix[key] || 0;
                    const opacity = count === 0 ? 0.05 : 0.2 + (count / maxCollaborations) * 0.8;
                    const isHighCollaboration = count > maxCollaborations * 0.5;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        className="w-24 p-1"
                      >
                        <div
                          className="h-16 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:shadow-lg relative"
                          style={{
                            backgroundColor: getColor(fromAgent),
                            opacity: opacity,
                          }}
                          title={`${getName(fromAgent)} → ${getName(toAgent)}: ${count} interactions`}
                        >
                          {count > 0 && (
                            <>
                              <span className={`font-bold ${isHighCollaboration ? 'text-white text-lg' : 'text-gray-800 text-sm'}`}>
                                {count}
                              </span>
                              {isHighCollaboration && (
                                <Zap size={12} className="absolute top-1 right-1 text-yellow-300" />
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>No collaboration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Low collaboration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Medium collaboration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-700 rounded"></div>
              <span>High collaboration</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Collaborations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Top Collaborations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCollaborations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p>No collaborations found for the selected timeframe</p>
              </div>
            ) : (
              topCollaborations.map((collab, index) => (
                <motion.div
                  key={`${collab.from}-${collab.to}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-l-4" style={{ borderLeftColor: getColor(collab.from) }}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getEmoji(collab.from)}</span>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${getColor(collab.from)}20`,
                              color: getColor(collab.from),
                              borderColor: getColor(collab.from),
                            }}
                          >
                            {getName(collab.from)}
                          </Badge>
                          <ArrowRight size={20} className="text-gray-400" />
                          <span className="text-2xl">{getEmoji(collab.to)}</span>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${getColor(collab.to)}20`,
                              color: getColor(collab.to),
                              borderColor: getColor(collab.to),
                            }}
                          >
                            {getName(collab.to)}
                          </Badge>
                        </div>
                        <Badge className="bg-indigo-600 text-white">
                          <Users size={14} className="mr-1" />
                          {collab.count} interactions
                        </Badge>
                      </div>
                      {collab.topReasons.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-500">Top reasons:</span>
                          {collab.topReasons.map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {reason.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Activity Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Agent Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents
              .sort((a, b) => (agentTotals[b] || 0) - (agentTotals[a] || 0))
              .map((agent) => (
                <Card key={agent} className="border-l-4" style={{ borderLeftColor: getColor(agent) }}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getEmoji(agent)}</span>
                        <span className="font-semibold">{getName(agent)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: getColor(agent) }}>
                          {agentTotals[agent] || 0}
                        </p>
                        <p className="text-xs text-gray-500">interactions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
