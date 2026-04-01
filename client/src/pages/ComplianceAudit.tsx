import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { Shield, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ComplianceBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-green-500' : value >= 75 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function ComplianceAudit() {
  const [activeTab, setActiveTab] = useState('frameworks');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['compliance-audit'],
    queryFn: async () => { const r = await fetch('/api/compliance-audit/overview'); return r.json(); },
  });

  const frameworks = data?.frameworks || [];
  const auditTrail = data?.auditTrail || [];
  const violations = data?.policyViolations || [];
  const trend = data?.complianceTrend || [];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Compliance & Audit Trail</h1>
                <p className="text-muted-foreground text-sm">Governance decisions, policy evaluations, and compliance tracking</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Overall Compliance</div>
                    <div className="text-4xl font-bold text-green-600">{data?.overallCompliance || 0}%</div>
                    <ComplianceBar value={data?.overallCompliance || 0} />
                  </CardContent>
                </Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Controls</div>
                  <div className="text-3xl font-bold">{data?.totalControls || 0}</div>
                  <p className="text-xs text-green-600">{data?.passedControls || 0} passed</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Frameworks</div>
                  <div className="text-3xl font-bold">{frameworks.length}</div>
                  <p className="text-xs text-muted-foreground">actively monitored</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Open Violations</div>
                  <div className="text-3xl font-bold text-red-600">{data?.openViolations || 0}</div>
                  <p className="text-xs text-muted-foreground">requiring attention</p>
                </CardContent></Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="frameworks" data-testid="tab-frameworks"><Shield className="w-4 h-4 mr-2" /> Frameworks</TabsTrigger>
                  <TabsTrigger value="audit" data-testid="tab-audit"><FileText className="w-4 h-4 mr-2" /> Audit Trail ({auditTrail.length})</TabsTrigger>
                  <TabsTrigger value="violations" data-testid="tab-violations"><AlertTriangle className="w-4 h-4 mr-2" /> Violations ({violations.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="frameworks" className="space-y-4">
                  {frameworks.map((fw: any) => (
                    <Card key={fw.id} data-testid={`card-framework-${fw.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">{fw.name}</span>
                            <Badge variant="outline">{fw.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${fw.compliance >= 90 ? 'text-green-600' : fw.compliance >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{fw.compliance}%</span>
                          </div>
                        </div>
                        <ComplianceBar value={fw.compliance} />
                        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                          <span>{fw.passedControls}/{fw.controls} controls passed</span>
                          <span>Last audit: {fw.lastAudit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="audit" className="space-y-2">
                  {auditTrail.map((event: any) => (
                    <Card key={event.id} className="hover:border-blue-200 transition-colors">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {event.status === 'passed' ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                           event.status === 'flagged' ? <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" /> :
                           <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{event.description}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{event.agent}</Badge>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{event.framework}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                              <span>{event.eventType.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <Badge className={event.status === 'passed' ? 'bg-green-100 text-green-800' : event.status === 'flagged' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                            {event.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="violations" className="space-y-3">
                  {violations.map((v: any) => (
                    <Card key={v.id} className={v.status === 'open' ? 'border-red-200' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <XCircle className={`w-4 h-4 ${v.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                            <span className="font-semibold">{v.policy}</span>
                            <Badge className={v.severity === 'high' ? 'bg-red-100 text-red-800' : v.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>{v.severity}</Badge>
                          </div>
                          <Badge variant="outline">{v.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{v.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Project: {v.projectName}</span>
                          <span>Detected: {new Date(v.detectedAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
