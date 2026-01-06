import { challenges } from "@/lib/data";
import { ChallengeCard } from "@/components/ChallengeCard";
import { motion } from "framer-motion";
import { Activity, BarChart3, Clock, TrendingUp } from "lucide-react";
import heroBg from "@assets/generated_images/abstract_blue_geometric_corporate_network_background.png";

function StatsOverview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {[
        { label: "Cycle Time Reduction", value: "83%", icon: Clock, color: "text-blue-500" },
        { label: "Forecast Accuracy", value: "85%", icon: Target, color: "text-emerald-500" },
        { label: "Cost Variance", value: "±10%", icon: Activity, color: "text-orange-500" },
        { label: "Overhead Reduction", value: "75%", icon: TrendingUp, color: "text-purple-500" },
      ].map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className={`p-3 rounded-full bg-background mb-3 ${stat.color} bg-opacity-10`}>
              <Icon className={stat.color} size={24} />
            </div>
            <div className="text-3xl font-heading font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

import { Target } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[40vh] overflow-hidden flex items-center justify-center bg-slate-900">
        <div 
          className="absolute inset-0 z-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-slate-900/50 z-10" />
        
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 tracking-tight">
              Strategic Transformation <span className="text-primary-foreground/80 font-light">& Impact</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-light">
              Addressing client challenges through VRO responses, driving efficiency, speed, and certainty across the portfolio.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 -mt-20 relative z-30">
        <StatsOverview />

        <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border/50 pb-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">Core Challenges</h2>
            <p className="text-muted-foreground mt-1">
              8 Key areas of intervention and their measurable outcomes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {challenges.map((challenge, index) => (
            <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
          ))}
        </div>

        {/* Summary Footer */}
        <div className="mt-20 p-8 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
          <div 
             className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: `url(${heroBg})`,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold font-heading mb-2">Ready to accelerate delivery?</h3>
              <p className="text-slate-300">
                Transforming governance from a bottleneck into a strategic enabler.
              </p>
            </div>
            <button className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all">
              View Full Report
            </button>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50 bg-muted/20">
        <p>© 2026 Strategy & Transformation Office. Confidential.</p>
      </footer>
    </div>
  );
}
