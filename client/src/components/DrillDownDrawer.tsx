import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle2, TrendingUp, Users, Zap, Brain, ChevronRight } from 'lucide-react';
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

export function DrillDownDrawer({ isOpen, onClose, entityType, entityId }: DrillDownDrawerProps) {
  const drilldown = useEntityDrilldown(entityType, entityId);
  const [activeTab, setActiveTab] = useState('overview');

  if (!drilldown) return null;

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
                  <h2 className="text-lg font-bold">{drilldown.entityName}</h2>
                  <p className="text-sm text-gray-500">{drilldown.bu}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>
            </div>

            <div className="p-4">
              <AICoPilot 
                drilldown={drilldown} 
                agentId={drilldown.relatedAgents[0] || 'vro'} 
              />
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1">Agents</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp size={16} className="text-blue-500" />
                          Key Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(drilldown.metrics).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">{key}</p>
                              <p className="text-lg font-bold">{value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {drilldown.actions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            Recommended Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {drilldown.actions.map((action) => (
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

                    {drilldown.relatedEntities && drilldown.relatedEntities.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain size={16} className="text-purple-500" />
                            Related Items ({drilldown.relatedEntities.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {drilldown.relatedEntities.map((entity) => (
                              <div
                                key={entity.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                data-testid={`related-entity-${entity.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-xs">
                                    {entity.type}
                                  </Badge>
                                  <span className="font-medium text-sm">{entity.name}</span>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {drilldown.events.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-500" />
                            Recent Alerts ({drilldown.events.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {drilldown.events.slice(0, 3).map((event) => (
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
                        {drilldown.relatedAgents.map((agentId) => (
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
                      {drilldown.history.length > 0 ? (
                        <div className="space-y-3">
                          {drilldown.history.map((item, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-2 h-2 rounded-full ${agentColors[item.agent]}`} />
                                {index < drilldown.history.length - 1 && (
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
