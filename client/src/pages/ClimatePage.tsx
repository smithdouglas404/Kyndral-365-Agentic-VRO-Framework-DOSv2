import { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { usePageContext } from "@/contexts/PageContext";
import { ArrowLeft, Leaf, TrendingDown, Target, AlertTriangle, Thermometer, Factory, Home, Building2, Globe2 } from "lucide-react";
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { climateData, lgCompanyOverview } from "@/lib/lgData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, RadialBarChart, RadialBar } from "recharts";

export default function ClimatePage() {
  const [, navigate] = useLocation();
  const { setPageContext } = usePageContext();
  const [selectedEntity, setSelectedEntity] = useState<{type: string; id: string} | null>(null);
  const handleDrillDown = (type: string, id: string) => setSelectedEntity({ type, id });

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'tool',
      entityId: 'climate',
      entityName: 'Climate & Nature',
      breadcrumb: ['Dashboard', 'Climate']
    });
  }, [setPageContext]);

  const emissionsTrajectory = [
    { year: "2019", emissions: 100, target: 100 },
    { year: "2020", emissions: 92, target: 95 },
    { year: "2021", emissions: 88, target: 90 },
    { year: "2022", emissions: 78, target: 85 },
    { year: "2023", emissions: 70, target: 75 },
    { year: "2024", emissions: 63, target: 65 },
    { year: "2025", emissions: null, target: 55 },
    { year: "2030", emissions: null, target: 50 }
  ];

  const operationalBreakdown = [
    { name: "Private Markets Real Estate", value: 24647, color: "#C50B30" },
    { name: "Office Operations", value: 3200, color: "#007FAA" },
    { name: "Business Travel", value: 1800, color: "#f59e0b" },
    { name: "Data Centers", value: 950, color: "#6366f1" },
    { name: "Other", value: 850, color: "#94a3b8" }
  ];

  const temperatureData = [
    { name: "Current Portfolio", value: 2.4, fill: "#f59e0b" },
    { name: "Paris Target", value: 1.5, fill: "#10b981" }
  ];

  const housingProgress = [
    { category: "LGAH Gas-Free", current: 61, target: 100 },
    { category: "SBTR Gas-Free", current: 100, target: 100 },
    { category: "Heat Pump Installs", current: 45, target: 100 },
    { category: "Solar Coverage", current: 38, target: 80 }
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <header className="bg-gradient-to-r from-green-800 to-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-green-700" 
                onClick={() => navigate('/dashboard')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Leaf className="h-8 w-8" />
                <h1 className="text-3xl font-bold" data-testid="text-page-title">Climate & Nature</h1>
              </div>
              <p className="text-green-100 mt-1">NextEra Energy Sustainability Report 2024 | TCFD Aligned</p>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-sm">Net Zero Target</p>
              <p className="text-4xl font-bold">{climateData.headline.netZeroTargetYear}</p>
              <Badge className="bg-white text-green-800 mt-1">SBTi Validated</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-t-4 border-t-green-600 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('operational-reduction', 'op-reduction-001')} data-testid="card-operational-reduction">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Operational Reduction</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-operational-reduction">
                    {climateData.headline.operationalFootprintReduction.value}%
                  </p>
                  <p className="text-xs text-gray-400">from {climateData.headline.operationalFootprintReduction.baseYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-600 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('financed-emissions', 'financed-001')} data-testid="card-financed-emissions">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Factory className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Financed Emissions</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-financed-reduction">
                    -{climateData.headline.financedEmissionsReduction.value}%
                  </p>
                  <p className="text-xs text-gray-400">from {climateData.headline.financedEmissionsReduction.baseYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('portfolio-temperature', 'temp-001')} data-testid="card-portfolio-temperature">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Thermometer className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Portfolio Temperature</p>
                  <p className="text-2xl font-bold text-amber-600" data-testid="text-portfolio-temp">
                    {climateData.targets.portfolioTemperature.current}°C
                  </p>
                  <p className="text-xs text-gray-400">Target: {climateData.targets.portfolioTemperature.target}°C</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-600 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('transition-finance', 'finance-001')} data-testid="card-transition-finance">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transition Finance</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-transition-finance">
                    ${climateData.headline.transitionFinance.value}bn
                  </p>
                  <p className="text-xs text-gray-400">invested in transition</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="emissions" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="emissions" data-testid="tab-emissions">Emissions</TabsTrigger>
            <TabsTrigger value="targets" data-testid="tab-targets">Targets & Progress</TabsTrigger>
            <TabsTrigger value="operations" data-testid="tab-operations">Operations</TabsTrigger>
            <TabsTrigger value="housing" data-testid="tab-housing">Sustainable Housing</TabsTrigger>
            <TabsTrigger value="nature" data-testid="tab-nature">Nature</TabsTrigger>
            <TabsTrigger value="context" data-testid="tab-context">Climate Context</TabsTrigger>
          </TabsList>

          <TabsContent value="emissions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('emissions-trajectory', 'emissions-chart-001')} data-testid="card-emissions-trajectory">
                <CardHeader>
                  <CardTitle>Emissions Reduction Trajectory</CardTitle>
                  <CardDescription>Indexed to 2019 baseline (100)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={emissionsTrajectory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="emissions" stroke="#C50B30" fill="#C50B3020" name="Actual Emissions" />
                      <Area type="monotone" dataKey="target" stroke="#10b981" fill="#10b98120" name="Target Pathway" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('carbon-footprint', 'footprint-chart-001')} data-testid="card-carbon-footprint">
                <CardHeader>
                  <CardTitle>Operational Carbon Footprint Breakdown</CardTitle>
                  <CardDescription>Total: {climateData.operational.totalFootprint2024.value.toLocaleString()} tCO2e</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={operationalBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                      >
                        {operationalBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} tCO2e`, "Emissions"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Largest contributor: {climateData.operational.largestContributor}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="targets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('scope3-occupier', 'scope3-001')} data-testid="card-scope3-occupier">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Scope 3 Occupier Emissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="font-bold">{climateData.targets.scope3OccupierReduction.progress}% / {climateData.targets.scope3OccupierReduction.target}%</span>
                    </div>
                    <Progress value={(climateData.targets.scope3OccupierReduction.progress / climateData.targets.scope3OccupierReduction.target) * 100} className="h-3" />
                    <p className="text-xs text-gray-400">Target by {climateData.targets.scope3OccupierReduction.by} from {climateData.targets.scope3OccupierReduction.baseYear}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('supplier-engagement', 'supplier-001')} data-testid="card-supplier-engagement">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Supplier Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Suppliers with SBTs</span>
                      <span className="font-bold">{climateData.targets.supplierEngagement.progress}% / {climateData.targets.supplierEngagement.target}%</span>
                    </div>
                    <Progress value={climateData.targets.supplierEngagement.progress} className="h-3" />
                    <p className="text-xs text-gray-400">Target by end of {climateData.targets.supplierEngagement.by}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('portfolio-temperature-target', 'temp-target-001')} data-testid="card-portfolio-temp-target">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-amber-600" />
                    Portfolio Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-5xl font-bold text-amber-600">{climateData.targets.portfolioTemperature.current}°C</div>
                    <p className="text-gray-500 mt-2">Paris-aligned target: {climateData.targets.portfolioTemperature.target}°C</p>
                    <Badge variant="secondary" className="mt-2">
                      {((climateData.targets.portfolioTemperature.current - climateData.targets.portfolioTemperature.target) / climateData.targets.portfolioTemperature.target * 100).toFixed(0)}% above target
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('key-commitments', 'commitments-001')} data-testid="card-key-commitments">
              <CardHeader>
                <CardTitle>Key Commitments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center cursor-pointer hover:bg-green-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('commitment-netzero', 'netzero-2050'); }} data-testid="metric-netzero-target">
                    <p className="text-3xl font-bold text-green-700">2050</p>
                    <p className="text-sm text-green-600">Net Zero Target</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('commitment-scope3', 'scope3-2030'); }} data-testid="metric-scope3-reduction">
                    <p className="text-3xl font-bold text-blue-700">55%</p>
                    <p className="text-sm text-blue-600">Scope 3 Reduction by 2030</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center cursor-pointer hover:bg-purple-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('commitment-supplier', 'supplier-2026'); }} data-testid="metric-supplier-sbts">
                    <p className="text-3xl font-bold text-purple-700">100%</p>
                    <p className="text-sm text-purple-600">Supplier SBTs by 2026</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center cursor-pointer hover:bg-amber-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('commitment-alignment', 'alignment-1-5c'); }} data-testid="metric-portfolio-alignment">
                    <p className="text-3xl font-bold text-amber-700">1.5°C</p>
                    <p className="text-sm text-amber-600">Portfolio Alignment Goal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('digital-infrastructure', 'infrastructure-001')} data-testid="card-digital-infrastructure">
                <CardHeader>
                  <CardTitle>Digital Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('meter-readers', 'amr-001'); }} data-testid="metric-meter-readers">
                    <div className="flex justify-between items-center">
                      <span>Automatic Meter Readers</span>
                      <Badge variant="outline">{climateData.operational.automaticMeterReaders.value} assets</Badge>
                    </div>
                    <p className="text-sm text-green-600 mt-1">+{climateData.operational.automaticMeterReaders.changeFrom2023}% from 2023</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('vizta-platform', 'vizta-001'); }} data-testid="metric-vizta-platform">
                    <div className="flex justify-between items-center">
                      <span>Vizta Platform Coverage</span>
                      <Badge variant="outline">{climateData.operational.viztaPlatformAssets.value} assets</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Occupier engagement platform</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('ies-projects', 'ies-001'); }} data-testid="metric-ies-projects">
                    <div className="flex justify-between items-center">
                      <span>IES Projects</span>
                      <Badge variant="outline">{climateData.operational.iesProjects.count} projects</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Integrated Energy Solutions</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('operational-achievements', 'achievements-001')} data-testid="card-operational-achievements">
                <CardHeader>
                  <CardTitle>Operational Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('scope1-2-reduction', 'scope12-001'); }} data-testid="metric-scope12-reduction">
                      <p className="text-sm text-gray-500">Scope 1 & 2 Reduction (Housing)</p>
                      <p className="text-3xl font-bold text-green-600">{climateData.operational.scope1And2Reduction.value}%</p>
                      <p className="text-sm text-gray-400">vs {climateData.operational.scope1And2Reduction.vsYear}</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('total-footprint', 'footprint-2024'); }} data-testid="metric-total-footprint">
                      <p className="text-sm text-gray-500">Total Footprint 2024</p>
                      <p className="text-3xl font-bold">{(climateData.operational.totalFootprint2024.value / 1000).toFixed(1)}k</p>
                      <p className="text-sm text-gray-400">tCO2e</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('ies-initiative', 'ies-key-001'); }} data-testid="metric-ies-initiative">
                    <p className="font-medium text-green-800">Key Initiative: Integrated Energy Solutions (IES)</p>
                    <p className="text-sm text-green-700 mt-1">Holistic approach integrating on-site renewables, EV charging, microgrid and battery storage across 27 assets</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="housing" className="space-y-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('netzero-homes', 'housing-001')} data-testid="card-netzero-homes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Net Zero Carbon Homes Progress
                </CardTitle>
                <CardDescription>Commitment: New homes operating at net zero carbon by 2030</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {housingProgress.map((item, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('housing-progress', `housing-${item.category.toLowerCase().replace(/\s+/g, '-')}`); }} data-testid={`metric-housing-${i}`}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-green-600 font-bold">{item.current}%</span>
                        </div>
                        <Progress value={item.current} className="h-3" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('smart-meters', 'smart-meter-001'); }} data-testid="metric-smart-meters">
                      <h4 className="font-semibold text-green-800">Smart Meter Deployment</h4>
                      <p className="text-sm text-green-700 mt-1">{climateData.housing.smartMeterProgress.description}</p>
                      <Badge className="mt-2 bg-green-600">{climateData.housing.smartMeterProgress.current}% Complete</Badge>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('grid-hardening', 'grid-001'); }} data-testid="metric-grid-hardening">
                      <h4 className="font-semibold text-blue-800">Grid Hardening Program</h4>
                      <p className="text-sm text-blue-700 mt-1">{climateData.housing.gridHardening.description}</p>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('solar-rooftop', 'solar-001'); }} data-testid="metric-solar-rooftop">
                      <h4 className="font-semibold text-amber-800">Rooftop Solar Program</h4>
                      <p className="text-sm text-amber-700 mt-1">{climateData.housing.solarRooftop.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nature" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('conservation-lands', 'conservation-001')} data-testid="card-conservation-lands">
                <CardHeader>
                  <CardTitle>Land Conservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-green-600">{climateData.nature.landConservation.value.toLocaleString()}</p>
                    <p className="text-gray-600 mt-2">{climateData.nature.landConservation.unit} protected</p>
                    <p className="text-sm text-gray-500 mt-4">{climateData.nature.landConservation.description}</p>
                    <Badge className="mt-3 bg-green-600">Wildlife Safe Programs Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('nature-framework', 'nature-001')} data-testid="card-nature-framework">
                <CardHeader>
                  <CardTitle>Nature Framework</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('tnfd-adopter', 'tnfd-001'); }} data-testid="metric-tnfd-adopter">
                    <Badge className="bg-blue-600">TNFD Adopter</Badge>
                    <span className="text-sm">Task Force on Nature-related Financial Disclosures</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('bng-aligned', 'bng-001'); }} data-testid="metric-bng-aligned">
                    <Badge className="bg-green-600">BNG Aligned</Badge>
                    <span className="text-sm">Biodiversity Net Gain planning requirements</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Guidance document developed to support design teams with new regulations and optimize nature enhancement opportunities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="context" className="space-y-6">
            <Card className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDrillDown('climate-reality', 'reality-2024')} data-testid="card-climate-reality">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Climate Reality 2024
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg text-center cursor-pointer hover:bg-red-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('warmest-year', 'warmest-2024'); }} data-testid="metric-warmest-year">
                    <p className="text-3xl font-bold text-red-600">{climateData.context.warmestYearOnRecord}</p>
                    <p className="text-sm text-red-700">Warmest Year on Record</p>
                    <p className="text-xs text-gray-500 mt-1">Since records began in 1850</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center cursor-pointer hover:bg-amber-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('temperature-breach', 'temp-breach-001'); }} data-testid="metric-temperature-breach">
                    <p className="text-3xl font-bold text-amber-600">{climateData.context.temperatureBreached.value}°C</p>
                    <p className="text-sm text-amber-700">Temperature Breached</p>
                    <p className="text-xs text-gray-500 mt-1">First calendar year above threshold</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center cursor-pointer hover:bg-orange-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('permanent-breach', 'breach-probability'); }} data-testid="metric-permanent-breach">
                    <p className="text-3xl font-bold text-orange-600">{climateData.context.probabilityOf1_5Breach.timeframe}</p>
                    <p className="text-sm text-orange-700">Permanent 1.5°C Breach</p>
                    <p className="text-xs text-gray-500 mt-1">{climateData.context.probabilityOf1_5Breach.likelihood}</p>
                  </div>
                  <div className="p-4 bg-red-100 rounded-lg text-center cursor-pointer hover:bg-red-200 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('worst-case', 'worst-warming'); }} data-testid="metric-worst-case">
                    <p className="text-3xl font-bold text-red-700">{climateData.context.worstCaseWarming.value}°C</p>
                    <p className="text-sm text-red-800">Worst Case Warming</p>
                    <p className="text-xs text-gray-500 mt-1">On current trajectory</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); handleDrillDown('lg-response', 'response-001'); }} data-testid="metric-lg-response">
                  <h4 className="font-semibold mb-2">NextEra Response</h4>
                  <p className="text-sm text-gray-700">
                    "Climate risk is increasingly financially material to understanding a company's future success and must be an integral part of our investment analysis. While we continue to do what is within our control to decarbonise our business, as a financial organisation the success of our transition is dependent on the companies we invest in delivering on their decarbonisation targets."
                  </p>
                  <p className="text-sm text-gray-500 mt-2">— Carl Moxley, Group Climate Director</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DrillDownDrawer
          isOpen={!!selectedEntity}
          onClose={() => setSelectedEntity(null)}
          entityType={selectedEntity?.type || 'entity'}
          entityId={selectedEntity?.id || ''}
        />
      </main>
    </div>
  );
}
