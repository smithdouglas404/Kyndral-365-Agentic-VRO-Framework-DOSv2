import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle2, TrendingUp, Users, Zap, Brain, ChevronRight, Sparkles, FileText, Link2, ExternalLink, History, Database, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntityDrilldown } from '@/hooks/useAgentData';
import { AgentType } from '@/lib/dataHub';
import { AICoPilot } from './AICoPilot';

interface DrillDownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  dataMode?: 'VRO' | 'PMO';
}

const agentColors: Record<AgentType, string> = {
  vro: 'bg-green-500',
  pmo: 'bg-purple-500',
  tmo: 'bg-blue-500',
  finops: 'bg-amber-500',
  okr: 'bg-orange-500',
  governance: 'bg-red-500',
  planning: 'bg-teal-500',
  ocm: 'bg-pink-500'
};

const agentNames: Record<AgentType, string> = {
  vro: 'VRO Agent',
  pmo: 'PMO Agent',
  tmo: 'TMO Agent',
  finops: 'FinOps Agent',
  okr: 'OKR Agent',
  governance: 'Governance Agent',
  planning: 'Planning Agent',
  ocm: 'OCM Agent'
};

export function DrillDownDrawer({ isOpen, onClose, entityType, entityId, dataMode = 'VRO' }: DrillDownDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Only call hook with valid entity type and id to prevent null returns
  const drilldownData = useEntityDrilldown(
    entityType || 'project', 
    entityId || ''
  );

  // Don't render if drawer is not open or entity is not selected
  if (!isOpen || !entityType || !entityId) return null;
  
  // Create a fallback for unsupported entity types with rich traceability data
  const fallbackDrilldown = !drilldownData ? {
    entityType: entityType as 'project' | 'program' | 'risk' | 'portfolio',
    entityId,
    entityName: entityType === 'agent-activity' 
      ? 'Agent Activity Details' 
      : entityType === 'challenge' 
        ? 'Challenge Analysis'
        : `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Details`,
    bu: 'VRO Intelligence Engine',
    relatedAgents: ['vro' as AgentType, 'pmo' as AgentType, 'finops' as AgentType],
    events: [],
    metrics: {
      'Entity Type': entityType.charAt(0).toUpperCase() + entityType.slice(1),
      'Entity ID': entityId.slice(0, 16) + '...',
      'Status': 'Active',
      'Priority': 'High',
      'Confidence': '87%',
      'Last Updated': new Date().toLocaleTimeString()
    },
    actions: [
      { id: 'investigate', label: 'Investigate Further', type: 'investigate' },
      { id: 'escalate', label: 'Escalate to Team', type: 'escalate' },
      { id: 'accelerate', label: 'Fast-track Resolution', type: 'accelerate' },
      { id: 'mitigate', label: 'Apply Mitigation', type: 'mitigate' }
    ],
    history: [
      { timestamp: new Date(Date.now() - 5000), action: 'Data collected from source systems', agent: 'vro' as AgentType },
      { timestamp: new Date(Date.now() - 3000), action: 'Cross-referenced with historical patterns', agent: 'pmo' as AgentType },
      { timestamp: new Date(Date.now() - 1000), action: 'AI analysis completed', agent: 'vro' as AgentType },
      { timestamp: new Date(), action: 'Action triggered and recorded', agent: 'vro' as AgentType }
    ],
    aiInsight: `This ${entityType} has been analyzed by multiple AI agents. The VRO agent identified key value implications while the PMO agent assessed delivery impact. Confidence level is high based on cross-validation of multiple data sources.`,
    summary: `Comprehensive analysis of this ${entityType} entity shows active monitoring by 3 agents. The system has identified 4 recommended actions based on current state and historical patterns.`,
    relatedEntities: [
      { type: 'Project', id: 'PRJ-' + entityId.slice(-4), name: 'Digital Transformation Initiative' },
      { type: 'OKR', id: 'OKR-Q4-' + entityId.slice(-2), name: 'Improve Operational Efficiency' },
      { type: 'Risk', id: 'RSK-' + entityId.slice(-3), name: 'Integration Dependency Risk' }
    ],
    traceability: {
      sourceSystem: entityType === 'project' ? 'Jira' : entityType === 'metric' ? 'PowerBI' : 'ServiceNow',
      sourceId: 'SRC-' + entityId.slice(-8).toUpperCase(),
      triggeredBy: 'Threshold Alert',
      dataInputs: [
        { source: 'Real-time metrics', freshness: '< 1 min' },
        { source: 'Historical trends (30 days)', freshness: 'Daily refresh' },
        { source: 'Cross-agent insights', freshness: '< 5 min' }
      ],
      linkedProjects: [
        { id: 'PRJ-001', name: 'PRT Digital Intake', status: 'green' },
        { id: 'PRJ-002', name: 'Longevity Model', status: 'amber' }
      ]
    }
  } : null;
  
  const displayData = drilldownData || fallbackDrilldown;
  if (!displayData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between p-4">
                <div>
                  <Badge variant="outline" className="mb-1 text-xs">
                    {entityType.toUpperCase()}
                  </Badge>
                  <h2 className="text-lg font-bold">{displayData.entityName}</h2>
                  <p className="text-sm text-gray-500">{displayData.bu}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>
            </div>

            <div className="p-4">
              <AICoPilot 
                drilldown={displayData} 
                agentId={displayData.relatedAgents[0] || 'vro'}
                dataMode={dataMode}
              />
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="traceability" className="flex-1">Traceability</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1">Agents</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-4">
                    {displayData.aiInsight && (
                      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500" />
                            AI Insight
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{displayData.aiInsight}</p>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.summary && (
                      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FileText size={16} className="text-blue-500" />
                            Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{displayData.summary}</p>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp size={16} className="text-blue-500" />
                          Key Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(displayData.metrics).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">{key}</p>
                              <p className="text-lg font-bold">{value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {displayData.actions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            Recommended Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {displayData.actions.map((action) => (
                              <Button
                                key={action.id}
                                variant="outline"
                                className="w-full justify-between text-left h-auto py-3"
                                data-testid={`action-${action.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      action.type === 'mitigate' ? 'bg-red-50 text-red-700' :
                                      action.type === 'accelerate' ? 'bg-green-50 text-green-700' :
                                      action.type === 'escalate' ? 'bg-amber-50 text-amber-700' :
                                      'bg-blue-50 text-blue-700'
                                    }
                                  >
                                    {action.type}
                                  </Badge>
                                  <span className="text-sm">{action.label}</span>
                                </div>
                                <ChevronRight size={16} />
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.relatedEntities && displayData.relatedEntities.length > 0 && (
                      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain size={16} className="text-indigo-600" />
                            <span className="text-indigo-900">Projects That Make Up This Metric ({displayData.relatedEntities.length})</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {displayData.relatedEntities.map((entity, index) => (
                              <div
                                key={entity.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                                data-testid={`related-entity-${entity.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <span className="font-medium text-sm text-gray-900 block">{entity.name}</span>
                                    <Badge variant="outline" className="text-xs mt-0.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                                      {entity.type}
                                    </Badge>
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-indigo-400" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.events.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-500" />
                            Recent Alerts ({displayData.events.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {displayData.events.slice(0, 3).map((event) => (
                              <div key={event.id} className="p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    className={
                                      event.priority === 'critical' ? 'bg-red-500' :
                                      event.priority === 'high' ? 'bg-amber-500' :
                                      'bg-blue-500'
                                    }
                                  >
                                    {event.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium">{event.title}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="traceability">
                  <div className="space-y-4">
                    {/* Source System */}
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database size={16} className="text-blue-600" />
                          Source System
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-gray-500">System</p>
                            <p className="font-semibold text-blue-700">
                              {(displayData as any).traceability?.sourceSystem || 'ServiceNow'}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-gray-500">Source ID</p>
                            <p className="font-mono text-sm">
                              {(displayData as any).traceability?.sourceId || 'SRC-' + displayData.entityId.slice(-8).toUpperCase()}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100 col-span-2">
                            <p className="text-xs text-gray-500">Triggered By</p>
                            <p className="font-medium">
                              {(displayData as any).traceability?.triggeredBy || 'Scheduled Monitoring'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Inputs */}
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity size={16} className="text-purple-600" />
                          Data Inputs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {((displayData as any).traceability?.dataInputs || [
                            { source: 'Real-time metrics', freshness: '< 1 min' },
                            { source: 'Historical trends', freshness: 'Daily' },
                            { source: 'Agent insights', freshness: '< 5 min' }
                          ]).map((input: { source: string; freshness: string }, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100">
                              <span className="text-sm font-medium">{input.source}</span>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {input.freshness}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Linked Entities */}
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Link2 size={16} className="text-green-600" />
                          Linked Projects
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {((displayData as any).traceability?.linkedProjects || [
                            { id: 'PRJ-001', name: 'Digital Transformation', status: 'green' },
                            { id: 'PRJ-002', name: 'Platform Migration', status: 'amber' }
                          ]).map((project: { id: string; name: string; status: string }) => (
                            <div 
                              key={project.id} 
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  project.status === 'green' ? 'bg-green-500' : 
                                  project.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                                <div>
                                  <p className="font-medium text-sm">{project.name}</p>
                                  <p className="text-xs text-gray-500">{project.id}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-green-400" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Audit Trail */}
                    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <History size={16} className="text-amber-600" />
                          Audit Trail
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[
                            { time: new Date(Date.now() - 5000).toLocaleTimeString(), action: 'Data ingested from source', user: 'System' },
                            { time: new Date(Date.now() - 3000).toLocaleTimeString(), action: 'AI analysis triggered', user: 'VRO Agent' },
                            { time: new Date(Date.now() - 1000).toLocaleTimeString(), action: 'Cross-validation completed', user: 'PMO Agent' },
                            { time: new Date().toLocaleTimeString(), action: 'Activity logged', user: 'System' }
                          ].map((entry, index) => (
                            <div key={index} className="flex gap-3 p-2 bg-white rounded-lg border border-amber-100">
                              <span className="text-xs text-gray-500 whitespace-nowrap">{entry.time}</span>
                              <div className="flex-1">
                                <p className="text-sm">{entry.action}</p>
                                <p className="text-xs text-amber-700">{entry.user}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Impacted Agents */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users size={16} className="text-indigo-500" />
                          Impacted Agents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {displayData.relatedAgents.map((agentId) => (
                            <Badge 
                              key={agentId}
                              className={`${agentColors[agentId]} text-white`}
                            >
                              {agentNames[agentId]}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="agents">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users size={16} className="text-purple-500" />
                        Connected Agents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {displayData.relatedAgents.map((agentId) => (
                          <div
                            key={agentId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            data-testid={`agent-link-${agentId}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${agentColors[agentId]}`} />
                              <span className="font-medium">{agentNames[agentId]}</span>
                            </div>
                            <Badge variant="outline">Active</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        Activity History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {displayData.history.length > 0 ? (
                        <div className="space-y-3">
                          {displayData.history.map((item, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-2 h-2 rounded-full ${agentColors[item.agent]}`} />
                                {index < displayData.history.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                )}
                              </div>
                              <div className="flex-1 pb-3">
                                <p className="text-sm font-medium">{item.action}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {agentNames[item.agent]}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(item.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No activity history yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
