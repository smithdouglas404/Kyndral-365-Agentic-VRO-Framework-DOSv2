import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  divisionalProfitData, 
  groupFinancials, 
  aumBreakdown,
  globalPRTData,
  strategicTargets2028,
  climateMetrics,
  shareholderReturns
} from "@/lib/scenarios";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  PieChart as PieChartIcon, 
  Target, 
  Leaf,
  PoundSterling,
  BarChart3,
  Globe,
  Info
} from "lucide-react";

const LG_BLUE = "#005EB8";
const LG_TEAL = "#00843D";

function MetricCard({ 
  title, 
  value, 
  change, 
  unit, 
  icon: Icon,
  source 
}: { 
  title: string; 
  value: number | string; 
  change?: number; 
  unit: string;
  icon: React.ElementType;
  source?: string;
}) {
  return (
    <Card className="bg-card" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{change >= 0 ? '+' : ''}{change}% YoY</span>
              </div>
            )}
          </div>
          <div className="p-2 bg-[#005EB8]/10 rounded-lg">
            <Icon size={20} className="text-[#005EB8]" />
          </div>
        </div>
        {source && (
          <p className="text-[10px] text-muted-foreground mt-2 truncate">{source}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DivisionalProfitChart() {
  const data = divisionalProfitData.map(d => ({
    name: d.division.replace("Institutional Retirement", "Inst. Retirement").replace("Corporate Investments", "Corp. Inv."),
    "2023": d.profit2023,
    "2024": d.profit2024,
    change: d.change
  }));

  return (
    <Card className="bg-card" data-testid="card-divisional-profit">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-[#005EB8]" />
              Operating Profit by Division
            </CardTitle>
            <CardDescription>2023 vs 2024 comparison (£m)</CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-700">+6% Core Growth</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `£${v}m`} />
              <RechartsTooltip 
                formatter={(value: number) => [`£${value}m`, '']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="2023" fill="#94a3b8" name="2023" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2024" fill={LG_BLUE} name="2024" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {divisionalProfitData.map((d, i) => (
            <div key={i} className="text-center p-2 bg-gray-50 rounded">
              <span className={`text-xs font-medium ${d.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {d.change >= 0 ? '+' : ''}{d.change}%
              </span>
              <p className="text-[10px] text-muted-foreground truncate">{d.division.split(' ')[0]}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AUMBreakdownChart() {
  const pieData = aumBreakdown.slice(1).map(a => ({
    name: a.segment,
    value: a.aum2024,
    color: a.color
  }));

  return (
    <Card className="bg-card" data-testid="card-aum-breakdown">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon size={18} className="text-[#00843D]" />
              Assets Under Management
            </CardTitle>
            <CardDescription>Key AUM segments (£bn)</CardDescription>
          </div>
          <Badge variant="outline">£1.1tn Total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number) => [`£${value}bn`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {aumBreakdown.slice(1).map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: a.color }} />
              <span className="truncate">{a.segment}</span>
              <span className={`ml-auto font-medium ${a.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {a.change >= 0 ? '+' : ''}{a.change}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GlobalPRTChart() {
  const data = [
    { region: "UK", value: globalPRTData.ukPRT2024, color: LG_BLUE },
    { region: "US", value: globalPRTData.usPRT2024, color: LG_TEAL },
    { region: "Canada", value: globalPRTData.canadaPRT2024, color: "#6366f1" }
  ];

  return (
    <Card className="bg-card" data-testid="card-global-prt">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe size={18} className="text-[#005EB8]" />
          Global PRT Written 2024
        </CardTitle>
        <CardDescription>£{globalPRTData.totalGlobal2024}bn total across regions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((d, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{d.region}</span>
                <span className="font-medium">£{d.value}bn</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(d.value / globalPRTData.totalGlobal2024) * 100}%`,
                    backgroundColor: d.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="text-center">
            <span className="text-lg font-bold text-[#005EB8]">{globalPRTData.ukSolvencyMargin2024}%</span>
            <p className="text-xs text-muted-foreground">UK Solvency II Margin</p>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-[#00843D]">{globalPRTData.ifrsNewBusinessMargin2024}%</span>
            <p className="text-xs text-muted-foreground">IFRS New Business Margin</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategicTargetsCard() {
  return (
    <Card className="bg-card" data-testid="card-strategic-targets">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target size={18} className="text-amber-500" />
          2028 Strategic Targets
        </CardTitle>
        <CardDescription>Progress toward medium-term goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {strategicTargets2028.map((t, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{t.metric}</span>
                <span className="text-muted-foreground">
                  {t.current2024}{t.unit} → {t.target2028}{t.unit}
                </span>
              </div>
              <Progress value={t.progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClimateMetricsCard() {
  return (
    <Card className="bg-card" data-testid="card-climate-metrics">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf size={18} className="text-green-600" />
              Climate & ESG Progress
            </CardTitle>
            <CardDescription>Key environmental metrics from Climate Report 2024</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={16} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Verified by Deloitte. TCFD-aligned reporting.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <span className="text-xl font-bold text-green-700">{climateMetrics.ghgIntensityReduction.current}%</span>
            <p className="text-xs text-green-600">GHG Intensity Reduction</p>
            <p className="text-[10px] text-muted-foreground">Target: {climateMetrics.ghgIntensityReduction.target2030}% by 2030</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <span className="text-xl font-bold text-blue-700">{climateMetrics.temperatureAlignment.current}°C</span>
            <p className="text-xs text-blue-600">Temperature Alignment</p>
            <p className="text-[10px] text-muted-foreground">Target: 1.5°C Paris</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <span className="text-xl font-bold text-purple-700">£{climateMetrics.transitionFinance.current}bn</span>
            <p className="text-xs text-purple-600">Transition Finance</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <span className="text-xl font-bold text-amber-700">{climateMetrics.climateImpactPledgeCoverage.current}%</span>
            <p className="text-xs text-amber-600">CIP Coverage</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <span>Coal Phase-out: 2030</span>
          <span>Net Zero: 2050</span>
          <span>{climateMetrics.environmentEngagements.current.toLocaleString()} Engagements</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ShareholderReturnsCard() {
  const totalBuybacks = shareholderReturns.buyback2024Completed + shareholderReturns.buybackAnnounced + shareholderReturns.additionalBuybackPostUSSale;
  
  return (
    <Card className="bg-card" data-testid="card-shareholder-returns">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PoundSterling size={18} className="text-[#005EB8]" />
          Shareholder Returns
        </CardTitle>
        <CardDescription>Capital allocation 2024-2027</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-[#005EB8]">£{(shareholderReturns.totalReturnTarget2024_27 / 1000).toFixed(0)}bn+</span>
          <p className="text-sm text-muted-foreground">Total Return Target (40% of market cap)</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm">2024 Buyback (Completed)</span>
            <Badge variant="secondary">£{shareholderReturns.buyback2024Completed}m</Badge>
          </div>
          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
            <span className="text-sm">New Buyback (Announced)</span>
            <Badge className="bg-[#005EB8]">£{shareholderReturns.buybackAnnounced}m</Badge>
          </div>
          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
            <span className="text-sm">Post-US Sale Buyback</span>
            <Badge className="bg-[#00843D]">£{(shareholderReturns.additionalBuybackPostUSSale / 1000).toFixed(0)}bn</Badge>
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Dividend Growth: {shareholderReturns.dividendGrowth2025Plus}% p.a. from 2025
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessPerformanceSection() {
  const { coreOperatingProfit, dividendPerShare, solvencyIICoverage, coreEPSGrowth } = groupFinancials;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">L&G Business Performance</h2>
          <p className="text-muted-foreground">Full Year Results 2024 - Demonstrating deep business understanding</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Source: L&G Annual Report & Accounts 2024
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Core Operating Profit" 
          value={`£${coreOperatingProfit.value2024}`}
          change={coreOperatingProfit.change}
          unit="m"
          icon={TrendingUp}
        />
        <MetricCard 
          title="Dividend per Share" 
          value={dividendPerShare.value2024}
          change={dividendPerShare.change}
          unit="p"
          icon={PoundSterling}
        />
        <MetricCard 
          title="Solvency II Coverage" 
          value={solvencyIICoverage.value2024}
          unit="%"
          icon={Building2}
        />
        <MetricCard 
          title="Core EPS Growth" 
          value={`+${coreEPSGrowth.value2024}`}
          unit="%"
          icon={BarChart3}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <DivisionalProfitChart />
        <AUMBreakdownChart />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <GlobalPRTChart />
        <StrategicTargetsCard />
        <ShareholderReturnsCard />
      </div>

      <ClimateMetricsCard />
    </motion.section>
  );
}
