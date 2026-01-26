/**
 * AGENT NETWORK DIAGRAM
 * Live visualization of the 10 Deep Agents collaborating in real-time
 * Shows agent-to-agent communication, active processing, and rule triggering
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

interface Agent {
  id: string;
  name: string;
  type: 'deep' | 'standard';
  status: 'active' | 'idle' | 'processing';
  color: string;
  icon: string;
}

interface Connection {
  source: string;
  target: string;
  type: 'collaboration' | 'handoff' | 'trigger';
  active: boolean;
}

interface NetworkData {
  agents: Agent[];
  connections: Connection[];
}

interface AgentNetworkDiagramProps {
  warRoomMode?: boolean;
}

export function AgentNetworkDiagram({ warRoomMode = false }: AgentNetworkDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [dimensions, setDimensions] = useState({
    width: warRoomMode ? 1400 : 800,
    height: warRoomMode ? 900 : 600
  });

  // Update dimensions when warRoomMode changes
  useEffect(() => {
    if (warRoomMode) {
      setDimensions({
        width: Math.min(window.innerWidth - 100, 1600),
        height: Math.min(window.innerHeight - 200, 1000)
      });
    } else {
      setDimensions({ width: 800, height: 600 });
    }
  }, [warRoomMode]);

  // Fetch real agent list from API (no hardcoding)
  const { data: agentsData } = useQuery({
    queryKey: ['agent-activity', 'agents'],
    queryFn: async () => {
      const res = await fetch('/api/agent-activity/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch real A2A connections from activity log
  const { data: connectionsData } = useQuery({
    queryKey: ['agent-activity', 'connections'],
    queryFn: async () => {
      const res = await fetch('/api/agent-activity/connections?hours=1');
      if (!res.ok) throw new Error('Failed to fetch connections');
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Use real agent data from API
  const agents: Agent[] = agentsData?.agents || [];

  // Use real A2A connections from API (NO FALLBACK - empty state if no data)
  const connections: Connection[] = connectionsData?.connections?.length > 0
    ? connectionsData.connections.map((conn: any) => ({
        source: conn.source,
        target: conn.target,
        type: conn.type || 'collaboration',
        active: conn.active,
      }))
    : [];

  useEffect(() => {
    if (!svgRef.current || agents.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Create force simulation
    const simulation = d3.forceSimulation(agents as any)
      .force('link', d3.forceLink(connections)
        .id((d: any) => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create container group
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create links (connections)
    const link = g.append('g')
      .selectAll('line')
      .data(connections)
      .join('line')
      .attr('class', 'agent-link')
      .attr('stroke', (d) => d.active ? '#3b82f6' : '#94a3b8')
      .attr('stroke-width', (d) => d.active ? 2 : 1)
      .attr('stroke-opacity', (d) => d.active ? 0.8 : 0.3)
      .attr('stroke-dasharray', (d) => d.type === 'trigger' ? '5,5' : '0');

    // Animate active connections
    link.filter((d) => d.active)
      .attr('stroke-dasharray', '10,5')
      .append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('from', '0')
      .attr('to', '15')
      .attr('dur', '1s')
      .attr('repeatCount', 'indefinite');

    // Create message particles flowing along active connections
    const messageParticles = g.append('g')
      .attr('class', 'message-particles');

    // Add 2-3 particles per active connection
    connections.filter(c => c.active).forEach((conn, i) => {
      const particleCount = 3;
      for (let j = 0; j < particleCount; j++) {
        const particle = messageParticles.append('circle')
          .attr('r', 4)
          .attr('fill', '#3b82f6')
          .attr('opacity', 0.8)
          .attr('filter', 'drop-shadow(0 0 3px #3b82f6)');

        // Animate particle along the path
        const animateParticle = () => {
          const source: any = agents.find(a => a.id === conn.source);
          const target: any = agents.find(a => a.id === conn.target);

          if (!source || !target) return;

          const duration = 2000 + Math.random() * 1000; // 2-3 seconds
          const startDelay = (j * duration / particleCount) + (i * 100);

          const animate = () => {
            particle
              .attr('cx', source.x || width / 2)
              .attr('cy', source.y || height / 2)
              .transition()
              .delay(startDelay)
              .duration(duration)
              .ease(d3.easeLinear)
              .attr('cx', target.x || width / 2)
              .attr('cy', target.y || height / 2)
              .on('end', () => {
                // Restart animation
                setTimeout(animate, Math.random() * 500);
              });
          };

          animate();
        };

        animateParticle();
      }
    });

    // Update particle positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      // Re-animate particles with updated positions
      messageParticles.selectAll('circle').each(function(d, i) {
        const conn = connections.filter(c => c.active)[Math.floor(i / 3)];
        if (conn) {
          const source: any = agents.find(a => a.id === conn.source);
          const target: any = agents.find(a => a.id === conn.target);
          if (source && target) {
            const t = (Date.now() % 2000) / 2000; // 0 to 1 over 2 seconds
            const x = source.x + (target.x - source.x) * t;
            const y = source.y + (target.y - source.y) * t;
            d3.select(this).attr('cx', x).attr('cy', y);
          }
        }
      });

      // Update node positions
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(agents)
      .join('g')
      .attr('class', 'agent-node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        setSelectedAgent(d);
      });

    // Add pulse circles for active agents
    node.append('circle')
      .attr('class', 'pulse-circle')
      .attr('r', 35)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .style('animation', 'pulse 2s infinite');

    // Add main circles
    node.append('circle')
      .attr('r', 30)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

    // Add emoji icons
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.1em')
      .attr('font-size', '24px')
      .text((d) => d.icon);

    // Add labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '50')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text((d) => d.name);

    // Add status indicators (small dot for processing)
    node.filter((d) => d.status === 'processing')
      .append('circle')
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('r', 6)
      .attr('fill', '#ef4444')
      .style('animation', 'blink 1s infinite');

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [dimensions]);

  return (
    <div className="space-y-4">
      <Card className={warRoomMode ? 'bg-slate-900 border-slate-700' : ''}>
        <CardHeader>
          <CardTitle className={warRoomMode ? 'text-white' : ''}>
            Agent Collaboration Network
          </CardTitle>
          <p className={warRoomMode ? 'text-sm text-slate-300' : 'text-sm text-muted-foreground'}>
            Live visualization of 10 Deep Agents collaborating across your projects
          </p>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <div className="mb-4">⏳</div>
              <p className="text-sm font-medium">Loading agent network...</p>
              <p className="text-xs mt-2">Initializing Deep Agent system</p>
            </div>
          ) : (
          <>
            <div className="relative">
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="border rounded-lg bg-slate-50 dark:bg-slate-900"
              />
              <style>{`
                @keyframes pulse {
                  0%, 100% {
                    opacity: 0;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 0.5;
                    transform: scale(1.2);
                  }
                }

                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.3; }
                }

                .agent-node:hover circle:first-of-type {
                  stroke-width: 4;
                }
              `}</style>
            </div>

            {/* Legend */}
            <div className={`flex gap-6 mt-6 text-sm ${warRoomMode ? 'text-slate-200' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Active Collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <span>Idle Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed' }}></div>
                <span>Rule Trigger</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span>Processing</span>
              </div>
            </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <Card className={warRoomMode ? 'bg-slate-900 border-slate-700' : ''}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${warRoomMode ? 'text-white' : ''}`}>
              <span className="text-2xl">{selectedAgent.icon}</span>
              {selectedAgent.name} Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={warRoomMode ? 'text-slate-400' : 'text-muted-foreground'}>Type:</span>
                <span className={`font-semibold capitalize ${warRoomMode ? 'text-slate-200' : ''}`}>{selectedAgent.type} Agent</span>
              </div>
              <div className="flex justify-between">
                <span className={warRoomMode ? 'text-slate-400' : 'text-muted-foreground'}>Status:</span>
                <span className={`font-semibold ${
                  selectedAgent.status === 'active' ? 'text-green-600' :
                  selectedAgent.status === 'processing' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {selectedAgent.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={warRoomMode ? 'text-slate-400' : 'text-muted-foreground'}>Capabilities:</span>
                <span className={`font-semibold ${warRoomMode ? 'text-slate-200' : ''}`}>RAG, Mem0, Letta, Rules, A2A</span>
              </div>
              <div className={`mt-4 p-3 rounded-md ${warRoomMode ? 'bg-blue-950/50 border border-blue-800' : 'bg-blue-50 dark:bg-blue-950'}`}>
                <p className={`text-xs ${warRoomMode ? 'text-slate-300' : 'text-muted-foreground'}`}>
                  Click and drag agents to rearrange the network. Active connections show real-time collaboration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
