import { challenges } from "@/lib/data";
import { ChallengeCard } from "@/components/ChallengeCard";
import { motion } from "framer-motion";
import { Activity, BarChart3, Clock, TrendingUp, Filter, Search, User, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function StatsOverview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: "Cycle Time Reduction", value: "83%", icon: Clock, color: "text-[hsl(209,100%,36%)]" },
        { label: "Forecast Accuracy", value: "85%", icon: Target, color: "text-[hsl(148,100%,26%)]" },
        { label: "Cost Variance", value: "±10%", icon: Activity, color: "text-[hsl(51,100%,50%)]" },
        { label: "Overhead Reduction", value: "75%", icon: TrendingUp, color: "text-[hsl(209,100%,36%)]" },
      ].map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            className="bg-white border border-border rounded-[4px] p-6 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            <div className="flex items-center justify-between w-full mb-4">
               <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
               <Icon className={stat.color} size={20} strokeWidth={1.5} />
            </div>
            <div className="text-4xl font-bold text-foreground tracking-tight">{stat.value}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="font-bold text-2xl text-[hsl(209,100%,36%)] tracking-tight">Legal & General</div>
        <nav className="hidden md:flex gap-6">
          {["Dashboard", "Projects", "Reports", "Settings"].map((item, i) => (
            <a 
              key={item} 
              href="#" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-[hsl(209,100%,36%)]",
                i === 0 ? "text-[hsl(209,100%,36%)]" : "text-muted-foreground"
              )}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search dashboard..." 
            className="pl-9 h-9 bg-background border-border rounded-[4px]" 
          />
        </div>
        <Button size="icon" variant="ghost" className="rounded-full">
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

import { cn } from "@/lib/utils";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <main className="container mx-auto px-8 py-8 max-w-[1400px]">
        {/* Header Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-[48px] font-bold text-foreground mb-2 tracking-tight">VRO Strategy Dashboard</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Monitoring strategic transformation initiatives across the portfolio. 
              Real-time insights on efficiency, speed, and certainty.
            </p>
          </motion.div>
        </div>

        <StatsOverview />

        <div className="flex flex-col gap-6">
           <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-[32px] font-bold text-foreground">Challenge Responses</h2>
              <div className="flex gap-2">
                 <Button variant="outline" className="gap-2 bg-white rounded-[4px]">
                    <Filter className="h-4 w-4" /> Filter
                 </Button>
                 <Button className="bg-[hsl(209,100%,36%)] hover:bg-[hsl(209,100%,32%)] text-white rounded-[4px]">
                    Download Report
                 </Button>
              </div>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {challenges.map((challenge, index) => (
              <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
            ))}
          </div>
        </div>
      </main>
      
      <footer className="mt-12 py-8 border-t border-border bg-white px-8">
        <div className="container mx-auto flex justify-between items-center text-sm text-muted-foreground">
           <p>© 2026 Legal & General. Internal Use Only.</p>
           <div className="flex gap-4">
             <a href="#" className="hover:text-primary">Privacy Policy</a>
             <a href="#" className="hover:text-primary">Terms of Use</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
