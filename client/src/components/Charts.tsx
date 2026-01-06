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

// Synthetic Data based on VRO Outcomes & L&G Context
const cycleTimeData = [
  { month: 'Jan', time: 30, benchmark: 25 },
  { month: 'Feb', time: 28, benchmark: 25 },
  { month: 'Mar', time: 22, benchmark: 25 },
  { month: 'Apr', time: 18, benchmark: 20 },
  { month: 'May', time: 12, benchmark: 15 },
  { month: 'Jun', time: 5, benchmark: 8 },
];

const benefitsData = [
  { quarter: 'Q1', forecasted: 45, realized: 18 },
  { quarter: 'Q2', forecasted: 55, realized: 28 },
  { quarter: 'Q3', forecasted: 65, realized: 58 },
  { quarter: 'Q4', forecasted: 80, realized: 75 },
];

const riskDistributionData = [
  { name: 'Low Risk', value: 65, color: 'hsl(148, 100%, 26%)' }, // Brand Teal
  { name: 'Medium Risk', value: 25, color: 'hsl(51, 100%, 50%)' }, // Accent Yellow
  { name: 'High Risk', value: 10, color: 'hsl(346, 100%, 42%)' }  // Brand Red
];

const fteEfficiencyData = [
  { month: 'Jan', manual: 120, automated: 0 },
  { month: 'Feb', manual: 100, automated: 20 },
  { month: 'Mar', manual: 80, automated: 40 },
  { month: 'Apr', manual: 60, automated: 60 },
  { month: 'May', manual: 40, automated: 80 },
  { month: 'Jun', manual: 30, automated: 90 },
];

export function CycleTimeChart() {
  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Velocity: Cycle Time Reduction</CardTitle>
        <CardDescription>Average days from intake to approval (Target: &lt;7 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cycleTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

export function ValueRealizationChart() {
  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Value Realization</CardTitle>
        <CardDescription>Forecasted benefits vs. actual realized value (£M)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benefitsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

export function RiskProfileChart() {
  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Portfolio Risk Profile</CardTitle>
        <CardDescription>Distribution of active initiatives by risk level (Post-VRO)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
           {/* Center Text Overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[hsl(209,100%,36%)]">90%</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Predictable</span>
           </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {riskDistributionData.map((entry, index) => (
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

export function EfficiencyChart() {
  return (
    <Card className="h-full border border-border bg-white rounded-[4px] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[hsl(209,100%,36%)]">Operational Efficiency</CardTitle>
        <CardDescription>Shift from manual processing to automated workflows (Hours)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fteEfficiencyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              />
              <Area 
                type="monotone" 
                dataKey="automated" 
                stackId="1" 
                stroke="hsl(209, 100%, 36%)" 
                fill="hsl(209, 100%, 36%)" 
                name="Automated Output"
                fillOpacity={0.8}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function StrategicImpactSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <CycleTimeChart />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ValueRealizationChart />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <EfficiencyChart />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <RiskProfileChart />
      </motion.div>
    </div>
  );
}
