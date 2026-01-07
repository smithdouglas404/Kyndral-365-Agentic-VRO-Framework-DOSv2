import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/london_city_skyline_with_digital_data_overlay_corporate_blue.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navigation */}
      <header className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold text-[hsl(209,100%,36%)] tracking-tight">
            Legal & General
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button className="bg-[hsl(209,100%,36%)] hover:bg-[hsl(209,100%,32%)] text-white px-6">
                Enter Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(209,100%,15%)]/90 via-[hsl(209,100%,20%)]/80 to-[hsl(209,100%,36%)]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center pt-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-white space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[hsl(148,100%,50%)] animate-pulse" />
              <span className="text-sm font-medium tracking-wide">Enterprise Transformation Office</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              Speed Without <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                Compromise.
              </span>
            </h1>
            
            <p className="text-xl text-blue-100/90 leading-relaxed max-w-lg font-light">
              Transforming portfolio management through agentic automation, predictive assurance, and unified governance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg bg-white text-[hsl(209,100%,36%)] hover:bg-blue-50 border-0">
                  Explore The Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Abstract Floating Cards Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden md:block relative h-[500px]"
          >
            {/* Decorative elements simulating dashboard interface */}
            <div className="absolute top-10 right-10 w-80 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transform rotate-3">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[hsl(209,100%,36%)] text-white">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-sm text-blue-200">Cycle Time</div>
                  <div className="text-2xl font-bold text-white">5 Days</div>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-[hsl(148,100%,50%)]" />
              </div>
            </div>

            <div className="absolute bottom-20 left-10 w-80 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transform -rotate-2 z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[hsl(148,100%,26%)] text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="text-sm text-blue-200">Risk Detection</div>
                  <div className="text-2xl font-bold text-white">Proactive</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-blue-200 mt-2">
                <span>Previous: Reactive</span>
                <span>Now: Predictive</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest">Scroll to discover</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[hsl(209,100%,36%)] mb-4">Strategic Pillars</h2>
            <p className="text-muted-foreground text-lg">
              Our approach balances speed with control, leveraging automation to drive certainty across the portfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Speed & Agility",
                desc: "Reducing cycle times from 30 days to 5 days through automated intake and smart classification.",
                icon: Zap
              },
              {
                title: "Certainty & Value",
                desc: "Moving from optimistic estimates to benchmark-driven realism with continuous drift detection.",
                icon: ShieldCheck
              },
              {
                title: "Efficiency at Scale",
                desc: "Standardizing 12 ways of working into 1 unified model, reducing overhead by 75%.",
                icon: BarChart3
              }
            ].map((pillar, i) => (
              <div key={i} className="bg-white p-8 rounded-lg border border-border hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 rounded-lg bg-[hsl(209,100%,36%)]/10 text-[hsl(209,100%,36%)] flex items-center justify-center mb-6">
                  <pillar.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
