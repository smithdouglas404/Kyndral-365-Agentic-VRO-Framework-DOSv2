import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  industryBenchmarks, 
  ukPrtMarketData, 
  lgYearOverYearData,
  type IndustryCompetitor 
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
  LineChart,
  Line,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Building2, Trophy, Target, Info } from "lucide-react";

const NEE_BLUE = "#0072CE";
const NEE_GREEN = "#00A651";
const COMPETITOR_GRAY = "#94a3b8";

function getBarColor(name: string): string {
  return name === "NextEra Energy" ? NEE_BLUE : COMPETITOR_GRAY;
}

export function MarketShareChart() {
  const data = industryBenchmarks.map(c => ({
    name: c.name.replace("NextEra Energy", "NEE").replace("Duke Energy", "Duke").replace("Southern Company", "Southern"),
    volume: c.prtVolume2024,
    share: c.marketShare,
    isNEE: c.name === "NextEra Energy"
  })).sort((a, b) => b.volume - a.volume);

  return (
    <Card className="bg-card" data-testid="card-market-share">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 size={18} className="text-[#0072CE]" />
              US Clean Energy Market Share 2024
            </CardTitle>
            <CardDescription>NextEra vs competitors by generation capacity (GW)</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Total: {ukPrtMarketData.totalVolume2024}GW
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 10]} tickFormatter={(v) => `${v}GW`} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value}GW`, 'Capacity']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.isNEE ? NEE_BLUE : COMPETITOR_GRAY} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: NEE_BLUE }} />
            <span>NextEra Energy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COMPETITOR_GRAY }} />
            <span>Competitors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function YearOverYearChart() {
  return (
    <Card className="bg-card" data-testid="card-yoy-performance">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-[#00A651]" />
              NextEra Year-over-Year Performance
            </CardTitle>
            <CardDescription>Clean energy capacity and operating revenue trajectory</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={16} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>2023 & 2024 are actuals from NextEra Annual Reports. 2025 projections and 2026 targets are VRO strategy goals.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lgYearOverYearData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis 
                yAxisId="left" 
                domain={[0, 15]} 
                tickFormatter={(v) => `${v}GW`}
                label={{ value: 'Capacity', angle: -90, position: 'insideLeft', offset: -5 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[900, 1400]} 
                tickFormatter={(v) => `$${v}m`}
                label={{ value: 'Operating Revenue', angle: 90, position: 'insideRight', offset: -5 }}
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => {
                  if (name === 'prtVolume') return [`${value}GW`, 'Capacity'];
                  if (name === 'operatingProfit') return [`$${value}m`, 'Operating Revenue'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="prtVolume" 
                stroke={NEE_BLUE} 
                strokeWidth={3}
                dot={{ fill: NEE_BLUE, strokeWidth: 2 }}
                name="Capacity"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="operatingProfit" 
                stroke={NEE_GREEN} 
                strokeWidth={3}
                dot={{ fill: NEE_GREEN, strokeWidth: 2 }}
                name="Operating Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompetitorCards() {
  const topCompetitors = industryBenchmarks.filter(c => c.name !== "NextEra Energy").slice(0, 4);
  const nee = industryBenchmarks.find(c => c.name === "NextEra Energy")!;

  return (
    <Card className="bg-card" data-testid="card-competitor-comparison">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Competitive Positioning
            </CardTitle>
            <CardDescription>NextEra market leadership vs key competitors</CardDescription>
          </div>
          <Badge className="bg-[#0072CE]">#1 Clean Energy Leader</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[#0072CE]">NextEra Energy</span>
            <span className="text-2xl font-bold text-[#0072CE]">{nee.prtVolume2024}GW</span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{nee.transactions2024} projects</span>
            <span>•</span>
            <span>{nee.marketShare}% market share</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {nee.notableDeals.map((deal, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{deal}</Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {topCompetitors.map((competitor, index) => (
            <motion.div
              key={competitor.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              data-testid={`competitor-card-${index}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm truncate">{competitor.name.replace("Pension Insurance Corp (PIC)", "PIC").replace("Phoenix/Standard Life", "Phoenix")}</span>
                <span className="font-semibold">£{competitor.prtVolume2024}bn</span>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{competitor.transactions2024} deals</span>
                <span>•</span>
                <span>{competitor.marketShare}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full bg-gray-400"
                  style={{ width: `${(competitor.prtVolume2024 / lg.prtVolume2024) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketOverview() {
  return (
    <Card className="bg-card" data-testid="card-market-overview">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target size={18} className="text-[#0072CE]" />
          US Clean Energy Market Overview
        </CardTitle>
        <CardDescription>Source: EIA Energy Data 2024, S&P Global Energy Research</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-[#0072CE]">{ukPrtMarketData.totalVolume2024}GW</div>
            <div className="text-xs text-muted-foreground">2024 Total Capacity</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-[#00A651]">{ukPrtMarketData.totalTransactions2024}</div>
            <div className="text-xs text-muted-foreground">Projects (Record)</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{ukPrtMarketData.largeDeals2024}</div>
            <div className="text-xs text-muted-foreground">Deals Over $1bn</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{ukPrtMarketData.marketGrowthRate}%</div>
            <div className="text-xs text-muted-foreground">CAGR Growth</div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          2023: {ukPrtMarketData.totalVolume2023}GW (record year) → 2024: {ukPrtMarketData.totalVolume2024}GW → 2025 Est: {ukPrtMarketData.projectedVolume2025}GW
        </div>
      </CardContent>
    </Card>
  );
}

export function IndustryBenchmarksSection() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Industry Benchmarks & Comparison</h2>
          <p className="text-muted-foreground">NextEra performance vs US clean energy market competitors (2023-2026)</p>
        </div>
      </div>

      <MarketOverview />
      
      <div className="grid md:grid-cols-2 gap-6">
        <MarketShareChart />
        <YearOverYearChart />
      </div>

      <CompetitorCards />
    </motion.section>
  );
}
