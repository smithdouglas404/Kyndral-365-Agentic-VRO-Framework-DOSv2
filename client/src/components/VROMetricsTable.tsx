import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { challenges } from "@/lib/data";
import { 
  Clock, Calendar, TrendingUp, Zap, Target, 
  CheckCircle, Activity, BarChart3 
} from "lucide-react";

const cadenceColors: Record<string, { bg: string; text: string; border: string }> = {
  "Weekly": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Bi-weekly": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Monthly": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Quarterly": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Real-time": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "On demand": { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" }
};

const cadenceIcons: Record<string, React.ReactNode> = {
  "Weekly": <Clock size={12} />,
  "Bi-weekly": <Calendar size={12} />,
  "Monthly": <Calendar size={12} />,
  "Quarterly": <BarChart3 size={12} />,
  "Real-time": <Activity size={12} />,
  "On demand": <Zap size={12} />
};

export function VROMetricsTable() {
  return (
    <Card className="border-l-4 border-l-[#005EB8]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#005EB8]/10">
              <Target className="text-[#005EB8]" size={24} />
            </div>
            <div>
              <CardTitle className="text-lg">VRO Metrics Framework</CardTitle>
              <p className="text-sm text-muted-foreground">Tracked continuously across all challenges</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-[#005EB8] text-[#005EB8]">
            Kyndryl Framework
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-vro-metrics">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-semibold text-slate-700">Challenge</th>
                <th className="text-left p-3 font-semibold text-slate-700">VRO Metric</th>
                <th className="text-left p-3 font-semibold text-slate-700">Cadence</th>
                <th className="text-left p-3 font-semibold text-slate-700">Core Tracking Fields</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((challenge, idx) => (
                <motion.tr 
                  key={challenge.id}
                  className="border-b hover:bg-slate-50/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  data-testid={`row-challenge-${challenge.id}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{challenge.number}</span>
                      <span className="font-medium text-slate-800">{challenge.title}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {challenge.vroMetrics.map((metric, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="text-xs bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20"
                        >
                          {metric.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(challenge.vroMetrics.map(m => m.cadence))).map((cadence, i) => {
                        const colors = cadenceColors[cadence] || cadenceColors["Monthly"];
                        return (
                          <Badge 
                            key={i}
                            variant="outline"
                            className={`text-xs ${colors.bg} ${colors.text} ${colors.border} flex items-center gap-1`}
                          >
                            {cadenceIcons[cadence]}
                            {cadence}
                          </Badge>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {challenge.coreTrackingFields.map((field, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 rounded px-2 py-0.5"
                        >
                          <CheckCircle size={10} className="text-[#00843D]" />
                          {field}
                        </span>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-[#005EB8]/5 to-[#00843D]/5 rounded-lg border border-[#005EB8]/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Total Metrics:</span>
                <Badge className="bg-[#005EB8]">{challenges.reduce((sum, c) => sum + c.vroMetrics.length, 0)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tracking Fields:</span>
                <Badge className="bg-[#00843D]">{challenges.reduce((sum, c) => sum + c.coreTrackingFields.length, 0)}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp size={14} className="text-[#00843D]" />
              <span>Data sourced from Kyndryl VRO Framework</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
