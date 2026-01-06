import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  generateVROCycleTimeData, 
  generateVROBenefitsData, 
  generateVRORiskDistribution, 
  generateVROEfficiencyData, 
  generateVROGovernanceHealth,
  generatePMOCycleTimeData,
  generatePMOBenefitsData,
  generatePMORiskDistribution,
  generatePMOEfficiencyData,
  generatePMOGovernanceHealth,
  citations
} from "@/lib/simulation";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DataMode = "VRO" | "PMO";

interface ChartProps {
  mode: DataMode;
  refreshKey: number;
}

function Citation({ citation }: { citation: { value: string; source: string; context: string } }) {
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            <Info size={12} className="text-muted-foreground" />
            <sup className="text-[10px] text-muted-foreground">†</sup>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-white border shadow-lg p-3">
          <p className="font-semibold text-sm">{citation.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{citation.context}</p>
          <p className="text-xs text-[hsl(209,100%,36%)] mt-2 font-medium">{citation.source}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export function CycleTimeChart({ mode, refreshKey }: ChartProps) {
  const [data, setData] = useState(() => mode === "VRO" ? generateVROCycleTimeData() : generatePMOCycleTimeData());

  useEffect(() => {
    setData(mode === "VRO" ? generateVROCycleTimeData() : generatePMOCycleTimeData());
  }, [mode, refreshKey]);

  const currentValue = data[data.length - 1]?.time || 0;
  const startValue = data[0]?.time || 0;
  const reduction = Math.round(((startValue - currentValue) / startValue) * 100);

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">
            Velocity: Cycle Time Reduction
          </CardTitle>
          <Badge variant={mode === "VRO" ? "default" : "secondary"} className={mode === "VRO" ? "bg-[hsl(148,100%,26%)]" : ""}>
            {mode}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Average days from intake to approval (Target: &lt;7 days)
          <Citation citation={citations.forecastAccuracy} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-foreground">{currentValue}d</div>
          <div className={`text-sm font-medium ${reduction > 50 ? 'text-green-600' : 'text-yellow-600'}`}>
            ↓ {reduction}% reduction
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(209, 100%, 36%)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(209, 100%, 36%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#757575" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#757575" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}d`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                itemStyle={{ color: '#000' }}
              />
              <Area 
                type="monotone" 
                dataKey="time" 
                stroke="hsl(209, 100%, 36%)" 
                fillOpacity={1} 
                fill="url(#colorTime)" 
                strokeWidth={2}
                name="Actual Cycle Time"
                isAnimationActive={true}
                animationDuration={800}
              />
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                stroke="hsl(148, 100%, 26%)" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                name="Target Benchmark"
                dot={false}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ValueRealizationChart({ mode, refreshKey }: ChartProps) {
  const [data, setData] = useState(() => mode === "VRO" ? generateVROBenefitsData() : generatePMOBenefitsData());

  useEffect(() => {
    setData(mode === "VRO" ? generateVROBenefitsData() : generatePMOBenefitsData());
  }, [mode, refreshKey]);

  const latestRealized = data[data.length - 1]?.realized || 0;
  const latestForecasted = data[data.length - 1]?.forecasted || 0;
  const realizationRate = Math.round((latestRealized / latestForecasted) * 100);

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Value Realization</CardTitle>
          <Badge variant={mode === "VRO" ? "default" : "secondary"} className={mode === "VRO" ? "bg-[hsl(148,100%,26%)]" : ""}>
            {mode}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Forecasted benefits vs. actual realized value (£M)
          <Citation citation={citations.prtVolume} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-foreground">£{latestRealized}m</div>
          <div className={`text-sm font-medium ${realizationRate >= 95 ? 'text-green-600' : realizationRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {realizationRate}% of forecast
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="quarter" stroke="#757575" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#757575" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}m`} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}
              />
              <Bar dataKey="forecasted" name="Forecasted" fill="hsl(209, 100%, 36%)" radius={[4, 4, 0, 0]} barSize={30} opacity={0.3} />
              <Bar dataKey="realized" name="Realized" fill="hsl(148, 100%, 26%)" radius={[4, 4, 0, 0]} barSize={30} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskProfileChart({ mode, refreshKey }: ChartProps) {
  const [data, setData] = useState(() => mode === "VRO" ? generateVRORiskDistribution() : generatePMORiskDistribution());

  useEffect(() => {
    setData(mode === "VRO" ? generateVRORiskDistribution() : generatePMORiskDistribution());
  }, [mode, refreshKey]);

  const lowRisk = data.find(d => d.name === 'Low Risk')?.value || 0;

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Portfolio Risk Profile</CardTitle>
          <Badge variant={mode === "VRO" ? "default" : "secondary"} className={mode === "VRO" ? "bg-[hsl(148,100%,26%)]" : ""}>
            {mode}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Distribution of active initiatives by risk level
          <Citation citation={citations.transformationRisk} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[hsl(209,100%,36%)]">
                {lowRisk}%
              </span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Predictable</span>
           </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                 itemStyle={{ color: '#000' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function EfficiencyChart({ mode, refreshKey }: ChartProps) {
  const [data, setData] = useState(() => mode === "VRO" ? generateVROEfficiencyData() : generatePMOEfficiencyData());

  useEffect(() => {
    setData(mode === "VRO" ? generateVROEfficiencyData() : generatePMOEfficiencyData());
  }, [mode, refreshKey]);

  const latestManual = data[data.length - 1]?.manual || 0;
  const latestAutomated = data[data.length - 1]?.automated || 0;
  const automationRate = Math.round((latestAutomated / (latestManual + latestAutomated)) * 100);

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Operational Efficiency</CardTitle>
          <Badge variant={mode === "VRO" ? "default" : "secondary"} className={mode === "VRO" ? "bg-[hsl(148,100%,26%)]" : ""}>
            {mode}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Shift from manual processing to automated workflows (Hours)
          <Citation citation={citations.costEfficiency} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-foreground">{automationRate}%</div>
          <div className="text-sm font-medium text-muted-foreground">automated</div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#757575" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#757575" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}
              />
              <Area 
                type="monotone" 
                dataKey="manual" 
                stackId="1" 
                stroke="hsl(51, 100%, 50%)" 
                fill="hsl(51, 100%, 50%)" 
                name="Manual Effort"
                fillOpacity={0.8}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Area 
                type="monotone" 
                dataKey="automated" 
                stackId="1" 
                stroke="hsl(209, 100%, 36%)" 
                fill="hsl(209, 100%, 36%)" 
                name="Automated Output"
                fillOpacity={0.8}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function GovernanceHealthChart({ mode, refreshKey }: ChartProps) {
  const [data, setData] = useState(() => mode === "VRO" ? generateVROGovernanceHealth() : generatePMOGovernanceHealth());

  useEffect(() => {
    setData(mode === "VRO" ? generateVROGovernanceHealth() : generatePMOGovernanceHealth());
  }, [mode, refreshKey]);

  const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Governance Health & Assurance</CardTitle>
          <Badge variant={mode === "VRO" ? "default" : "secondary"} className={mode === "VRO" ? "bg-[hsl(148,100%,26%)]" : ""}>
            {mode}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Compliance scores across key control gates
          <Citation citation={citations.transformationRisk} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-foreground">{avgScore}%</div>
          <div className={`text-sm font-medium ${avgScore >= 90 ? 'text-green-600' : avgScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgScore >= 90 ? 'Excellent' : avgScore >= 70 ? 'Good' : 'Needs Attention'}
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e0e0e0" />
              <XAxis type="number" domain={[0, 100]} stroke="#757575" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="category" stroke="#757575" fontSize={11} tickLine={false} axisLine={false} width={100} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}
              />
              <Bar 
                dataKey="score" 
                name="Health Score" 
                fill="hsl(148, 100%, 26%)" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface StrategicImpactSectionProps {
  mode: DataMode;
  refreshKey: number;
}

export function StrategicImpactSection({ mode, refreshKey }: StrategicImpactSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <CycleTimeChart mode={mode} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ValueRealizationChart mode={mode} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <EfficiencyChart mode={mode} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <RiskProfileChart mode={mode} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="md:col-span-2">
        <GovernanceHealthChart mode={mode} refreshKey={refreshKey} />
      </motion.div>
    </div>
  );
}
