import { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { usePageContext } from "@/contexts/PageContext";
import { ArrowLeft, Shield, AlertTriangle, TrendingUp, CreditCard, Droplets, Settings, Eye, Users } from "lucide-react";
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { riskData, aiAlerts } from "@/lib/lgData";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis, Cell } from "recharts";

export default function RiskCenter() {
  const [, navigate] = useLocation();
  const { setPageContext } = usePageContext();
  const [selectedEntity, setSelectedEntity] = useState<{type: string; id: string} | null>(null);
  const handleDrillDown = (type: string, id: string) => setSelectedEntity({ type, id });

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'tool',
      entityId: 'risk-center',
      entityName: 'Risk Command Center',
      breadcrumb: ['Dashboard', 'Risk Center']
    });
  }, [setPageContext]);

  const riskAlerts = aiAlerts.filter(a => 
    a.title.toLowerCase().includes("risk") || 
    a.title.toLowerCase().includes("credit") || 
    a.title.toLowerCase().includes("longevity")
  );

  const categoryIcons: Record<string, React.ReactNode> = {
    "insurance": <Shield className="h-6 w-6" />,
    "market": <TrendingUp className="h-6 w-6" />,
    "credit": <CreditCard className="h-6 w-6" />,
    "liquidity": <Droplets className="h-6 w-6" />,
    "non-financial": <Settings className="h-6 w-6" />
  };

  const radarData = riskData.categories.map(cat => ({
    subject: cat.name.replace(" Risk", ""),
    severity: cat.subRisks.filter(r => r.severity === "high").length * 30 + 
              cat.subRisks.filter(r => r.severity === "medium").length * 20 +
              cat.subRisks.filter(r => r.severity === "low").length * 10,
    fullMark: 100
  }));

  const emergingRisksData = riskData.emergingRisks.keyEmergingRisks.map(risk => ({
    name: risk.name,
    impact: risk.impact === "high" ? 90 : risk.impact === "medium" ? 60 : 30,
    probability: risk.probability === "high" ? 90 : risk.probability === "medium" ? 60 : 30,
    horizon: risk.horizon
  }));

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <header className="bg-gradient-to-r from-slate-800 to-slate-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-slate-700" 
                onClick={() => navigate('/dashboard')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <h1 className="text-3xl font-bold" data-testid="text-page-title">Risk Command Center</h1>
              </div>
              <p className="text-slate-300 mt-1">NextEra Risk Management Supplement 2024 | CRO: {riskData.overview.cro}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-sm">Largest Exposures</p>
              <div className="flex gap-2 mt-1">
                {riskData.overview.largestExposures.map((exp, i) => (
                  <Badge key={i} className="bg-red-500">{exp}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('governance', 'three-lines-defence')} data-testid="card-three-lines-defence">
            <CardHeader>
              <CardTitle>Three Lines of Defence</CardTitle>
              <CardDescription>Risk governance model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {riskData.threeLines.map((line) => (
                  <div 
                    key={line.line} 
                    className={`p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${line.line === 1 ? "bg-blue-50 border-blue-200" : line.line === 2 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"} border`}
                    onClick={(e) => { e.stopPropagation(); handleDrillDown('defence-line', `line-${line.line}`); }}
                    data-testid={`card-defence-line-${line.line}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${line.line === 1 ? "bg-blue-600" : line.line === 2 ? "bg-amber-600" : "bg-green-600"}`}>
                        {line.line}
                      </span>
                      <span className="font-semibold">{line.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{line.role}</p>
                    <p className="text-xs text-gray-500 mt-2 italic">{line.accountable}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('risk-profile', 'radar-overview')} data-testid="card-risk-profile-radar">
            <CardHeader>
              <CardTitle>Risk Profile Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Risk Severity" dataKey="severity" stroke="#C50B30" fill="#C50B30" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="categories" data-testid="tab-categories">Risk Categories</TabsTrigger>
            <TabsTrigger value="emerging" data-testid="tab-emerging">Emerging Risks</TabsTrigger>
            <TabsTrigger value="climate" data-testid="tab-climate-risk">Climate Risk</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-risk-alerts">AI Risk Alerts ({riskAlerts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {riskData.categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" 
                  style={{ borderLeftColor: category.color }}
                  onClick={() => handleDrillDown('risk-category', category.id)}
                  data-testid={`card-risk-category-${category.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                        {categoryIcons[category.id]}
                      </div>
                      <div>
                        <CardTitle>{category.name}</CardTitle>
                        <CardDescription>{category.subtitle}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.subRisks.map((risk, i) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-lg border cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${risk.severity === "high" ? "border-red-200 bg-red-50" : risk.severity === "medium" ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}
                          onClick={(e) => { e.stopPropagation(); handleDrillDown('sub-risk', `${category.id}-${i}`); }}
                          data-testid={`card-sub-risk-${category.id}-${i}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{risk.name}</span>
                            <div className="flex gap-1">
                              <Badge variant={risk.severity === "high" ? "destructive" : risk.severity === "medium" ? "secondary" : "default"} className="text-xs">
                                {risk.severity}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${risk.trend === "worsening" ? "text-red-600" : risk.trend === "improving" ? "text-green-600" : risk.trend === "volatile" ? "text-amber-600" : ""}`}>
                                {risk.trend}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="emerging" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('emerging-risk', 'radar-analysis')} data-testid="card-emerging-risk-radar">
                <CardHeader>
                  <CardTitle>Emerging Risk Radar</CardTitle>
                  <CardDescription>Impact vs Probability Analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="probability" name="Probability" domain={[0, 100]} label={{ value: 'Probability', position: 'bottom' }} />
                      <YAxis type="number" dataKey="impact" name="Impact" domain={[0, 100]} label={{ value: 'Impact', angle: -90, position: 'left' }} />
                      <ZAxis range={[100, 400]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                        if (payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm">Impact: {data.impact}%</p>
                              <p className="text-sm">Probability: {data.probability}%</p>
                              <p className="text-sm text-gray-500">Horizon: {data.horizon}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Scatter name="Emerging Risks" data={emergingRisksData} fill="#C50B30">
                        {emergingRisksData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.impact > 70 && entry.probability > 70 ? "#ef4444" : entry.impact > 50 || entry.probability > 50 ? "#f59e0b" : "#22c55e"} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('emerging-risk', 'key-risks-list')} data-testid="card-key-emerging-risks">
                <CardHeader>
                  <CardTitle>Key Emerging Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskData.emergingRisks.keyEmergingRisks.map((risk, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-lg border cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${risk.impact === "high" && risk.probability === "high" ? "border-red-300 bg-red-50" : risk.impact === "high" || risk.probability === "high" ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}
                        onClick={(e) => { e.stopPropagation(); handleDrillDown('emerging-risk', `emerging-${i}`); }}
                        data-testid={`card-emerging-risk-${i}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{risk.name}</span>
                          <div className="flex gap-1">
                            <Badge variant={risk.impact === "high" ? "destructive" : "secondary"}>
                              Impact: {risk.impact}
                            </Badge>
                            <Badge variant={risk.probability === "high" ? "destructive" : "outline"}>
                              Prob: {risk.probability}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Horizon: {risk.horizon}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="climate" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {riskData.climateRiskCategories.map((cat, i) => (
                <Card 
                  key={i} 
                  className={`border-t-4 cursor-pointer hover:shadow-md transition-shadow ${cat.type === "Transition Risk" ? "border-t-blue-500" : cat.type === "Physical Risk" ? "border-t-amber-500" : "border-t-purple-500"}`}
                  onClick={() => handleDrillDown('climate-risk', `climate-${i}`)}
                  data-testid={`card-climate-risk-${i}`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{cat.type}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{cat.description}</p>
                    <div className="space-y-2">
                      {cat.examples.map((ex, j) => (
                        <div 
                          key={j} 
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleDrillDown('climate-example', `climate-${i}-example-${j}`); }}
                          data-testid={`card-climate-example-${i}-${j}`}
                        >
                          <AlertTriangle className={`h-4 w-4 ${cat.type === "Transition Risk" ? "text-blue-500" : cat.type === "Physical Risk" ? "text-amber-500" : "text-purple-500"}`} />
                          <span className="text-sm">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('climate-statement', 'climate-overview')} data-testid="card-climate-statement">
              <CardHeader>
                <CardTitle>Climate Risk Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 italic">
                    "The deterioration of the health of ecosystems on which we and all other species depend is the biggest challenge our generation faces. The potential physical impacts resulting from the changing climate, along with the necessary mitigating actions, have wide-ranging impacts."
                  </p>
                  <p className="text-sm text-gray-500 mt-2">— NextEra Risk Management Supplement 2024</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {riskAlerts.length === 0 ? (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('alerts', 'no-alerts')} data-testid="card-no-alerts">
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No active risk alerts</p>
                </CardContent>
              </Card>
            ) : (
              riskAlerts.map(alert => (
                <Card 
                  key={alert.id} 
                  className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${alert.severity === "critical" ? "border-l-red-500" : alert.severity === "warning" ? "border-l-amber-500" : "border-l-blue-500"}`}
                  onClick={() => handleDrillDown('risk-alert', alert.id)}
                  data-testid={`card-risk-alert-${alert.id}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${alert.severity === "critical" ? "bg-red-100" : "bg-amber-100"}`}>
                        <AlertTriangle className={`h-5 w-5 ${alert.severity === "critical" ? "text-red-600" : "text-amber-600"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge variant="outline">{alert.type}</Badge>
                          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                        </div>
                        <p className="text-gray-700">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Target: {alert.targetPersona}</span>
                          <span>Confidence: {alert.confidence}%</span>
                        </div>
                        <div 
                          className="p-3 bg-gray-50 rounded-lg mt-3 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleDrillDown('recommendation', `rec-${alert.id}`); }}
                          data-testid={`card-recommendation-${alert.id}`}
                        >
                          <p className="text-sm font-medium">Recommendation:</p>
                          <p className="text-sm text-gray-700">{alert.recommendation}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {alert.actions.map((action, i) => (
                            <Button 
                              key={i} 
                              size="sm" 
                              variant={action.type === "primary" ? "default" : "outline"}
                              onClick={(e) => { e.stopPropagation(); handleDrillDown('action', `${alert.id}-action-${i}`); }}
                              data-testid={`button-alert-action-${alert.id}-${i}`}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <DrillDownDrawer
        isOpen={selectedEntity !== null}
        onClose={() => setSelectedEntity(null)}
        entityType={selectedEntity?.type || ''}
        entityId={selectedEntity?.id || ''}
      />
    </div>
  );
}
