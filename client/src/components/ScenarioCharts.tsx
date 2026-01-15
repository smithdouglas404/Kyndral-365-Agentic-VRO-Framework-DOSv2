import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Scenario, 
  StageId, 
  stages,
  generateScenarioChartData,
  generateScenarioBenefitsData,
  generateScenarioRiskData,
  generateScenarioEfficiencyData,
  generateScenarioGovernanceData
} from "@/lib/scenarios";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScenarioChartProps {
  scenario: Scenario;
  stage: StageId;
  refreshKey: number;
}

function SourceBadge({ source }: { source: string }) {
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            <Info size={12} className="text-muted-foreground" />
            <sup className="text-[10px] text-muted-foreground">†</sup>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-white border shadow-lg p-2">
          <p className="text-xs text-[hsl(209,100%,36%)] font-medium">{source}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export function ScenarioCycleTimeChart({ scenario, stage, refreshKey }: ScenarioChartProps) {
  const [data, setData] = useState(() => generateScenarioChartData(scenario, stage));

  useEffect(() => {
    setData(generateScenarioChartData(scenario, stage));
  }, [scenario.id, stage, refreshKey]);

  const currentValue = data[data.length - 1]?.time || 0;
  const targetValue = data[data.length - 1]?.benchmark || 7;
  const stageColor = stages.find(s => s.id === stage)?.color || "hsl(209, 100%, 36%)";

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">
            Cycle Time Trajectory
          </CardTitle>
          <Badge style={{ backgroundColor: stageColor }} className="text-white">
            {stages.find(s => s.id === stage)?.name}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Projected days from intake to approval
          <SourceBadge source="NextEra Energy Annual Report 2024, Strategic Objectives" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <motion.div 
            key={`${stage}-${refreshKey}`}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-foreground"
          >
            {currentValue}d
          </motion.div>
          <div className="text-sm text-muted-foreground">
            Target: <span className="font-semibold text-[hsl(148,100%,26%)]">{targetValue}d</span>
          </div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scenarioColorTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stageColor} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={stageColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#757575" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#757575" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}d`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
              <Area 
                type="monotone" 
                dataKey="time" 
                stroke={stageColor}
                fillOpacity={1} 
                fill="url(#scenarioColorTime)" 
                strokeWidth={2}
                name="Projected Cycle Time"
                isAnimationActive={true}
                animationDuration={600}
              />
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                stroke="hsl(148, 100%, 26%)" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                name="Target"
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

export function ScenarioBenefitsChart({ scenario, stage, refreshKey }: ScenarioChartProps) {
  const [data, setData] = useState(() => generateScenarioBenefitsData(scenario, stage));

  useEffect(() => {
    setData(generateScenarioBenefitsData(scenario, stage));
  }, [scenario.id, stage, refreshKey]);

  const latestRealized = data[data.length - 1]?.realized || 0;
  const latestForecasted = data[data.length - 1]?.forecasted || 0;
  const realizationRate = Math.round((latestRealized / latestForecasted) * 100);
  const stageColor = stages.find(s => s.id === stage)?.color || "hsl(209, 100%, 36%)";

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Benefits Realization</CardTitle>
          <Badge style={{ backgroundColor: stageColor }} className="text-white">
            {stages.find(s => s.id === stage)?.name}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Forecasted vs. realized value (%)
          <SourceBadge source="NextEra Energy Annual Report 2024, p.52" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <motion.div 
            key={`${stage}-${refreshKey}`}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-foreground"
          >
            {latestRealized}%
          </motion.div>
          <div className={`text-sm font-medium ${realizationRate >= 90 ? 'text-green-600' : realizationRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
            {realizationRate}% of forecast
          </div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="quarter" stroke="#757575" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#757575" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
              <Bar dataKey="forecasted" name="Forecasted" fill={stageColor} radius={[4, 4, 0, 0]} barSize={25} opacity={0.3} />
              <Bar dataKey="realized" name="Realized" fill="hsl(148, 100%, 26%)" radius={[4, 4, 0, 0]} barSize={25} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScenarioRiskChart({ scenario, stage, refreshKey }: ScenarioChartProps) {
  const [data, setData] = useState(() => generateScenarioRiskData(scenario, stage));

  useEffect(() => {
    setData(generateScenarioRiskData(scenario, stage));
  }, [scenario.id, stage, refreshKey]);

  const lowRisk = data.find(d => d.name === 'Low Risk')?.value || 0;
  const stageColor = stages.find(s => s.id === stage)?.color || "hsl(209, 100%, 36%)";

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Risk Profile</CardTitle>
          <Badge style={{ backgroundColor: stageColor }} className="text-white">
            {stages.find(s => s.id === stage)?.name}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Portfolio risk distribution
          <SourceBadge source="NextEra Energy Annual Report 2024, Risk Section p.78" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.span 
              key={`${stage}-${refreshKey}`}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold text-[hsl(209,100%,36%)]"
            >
              {lowRisk}%
            </motion.span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Low Risk</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={600}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScenarioEfficiencyChart({ scenario, stage, refreshKey }: ScenarioChartProps) {
  const [data, setData] = useState(() => generateScenarioEfficiencyData(scenario, stage));

  useEffect(() => {
    setData(generateScenarioEfficiencyData(scenario, stage));
  }, [scenario.id, stage, refreshKey]);

  const latestManual = data[data.length - 1]?.manual || 0;
  const latestAutomated = data[data.length - 1]?.automated || 0;
  const automationRate = Math.round((latestAutomated / (latestManual + latestAutomated)) * 100);
  const stageColor = stages.find(s => s.id === stage)?.color || "hsl(209, 100%, 36%)";

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Operational Efficiency</CardTitle>
          <Badge style={{ backgroundColor: stageColor }} className="text-white">
            {stages.find(s => s.id === stage)?.name}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Manual vs. automated processing
          <SourceBadge source="NextEra Energy Annual Report 2024, p.23" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <motion.div 
            key={`${stage}-${refreshKey}`}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-foreground"
          >
            {automationRate}%
          </motion.div>
          <div className="text-sm text-muted-foreground">automated</div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#757575" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#757575" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
              <Area type="monotone" dataKey="manual" stackId="1" stroke="hsl(51, 100%, 50%)" fill="hsl(51, 100%, 50%)" name="Manual" fillOpacity={0.8} />
              <Area type="monotone" dataKey="automated" stackId="1" stroke={stageColor} fill={stageColor} name="Automated" fillOpacity={0.8} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScenarioGovernanceChart({ scenario, stage, refreshKey }: ScenarioChartProps) {
  const [data, setData] = useState(() => generateScenarioGovernanceData(scenario, stage));

  useEffect(() => {
    setData(generateScenarioGovernanceData(scenario, stage));
  }, [scenario.id, stage, refreshKey]);

  const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  const stageColor = stages.find(s => s.id === stage)?.color || "hsl(209, 100%, 36%)";

  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Governance Health</CardTitle>
          <Badge style={{ backgroundColor: stageColor }} className="text-white">
            {stages.find(s => s.id === stage)?.name}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Compliance across control gates
          <SourceBadge source="NextEra Energy Annual Report 2024, Governance Section" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <motion.div 
            key={`${stage}-${refreshKey}`}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-foreground"
          >
            {avgScore}%
          </motion.div>
          <div className={`text-sm font-medium ${avgScore >= 90 ? 'text-green-600' : avgScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgScore >= 90 ? 'Excellent' : avgScore >= 70 ? 'Good' : 'Needs Work'}
          </div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e0e0e0" />
              <XAxis type="number" domain={[0, 100]} stroke="#757575" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="category" stroke="#757575" fontSize={10} tickLine={false} axisLine={false} width={90} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
              <Bar dataKey="score" name="Score" fill="hsl(148, 100%, 26%)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ScenarioChartsGridProps {
  scenario: Scenario;
  stage: StageId;
  isLive: boolean;
}

export function ScenarioChartsGrid({ scenario, stage, isLive }: ScenarioChartsGridProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ScenarioCycleTimeChart scenario={scenario} stage={stage} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ScenarioBenefitsChart scenario={scenario} stage={stage} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <ScenarioEfficiencyChart scenario={scenario} stage={stage} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <ScenarioRiskChart scenario={scenario} stage={stage} refreshKey={refreshKey} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="md:col-span-2">
        <ScenarioGovernanceChart scenario={scenario} stage={stage} refreshKey={refreshKey} />
      </motion.div>
    </div>
  );
}
