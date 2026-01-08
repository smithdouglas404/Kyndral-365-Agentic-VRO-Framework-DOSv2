import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle2, TrendingUp, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { PageAgentWizard } from "@/components/PageAgentWizard";

export default function ValueProposition() {
  const [, navigate] = useLocation();
  
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navigation */}
      <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="font-bold text-lg text-[hsl(209,100%,36%)]">VRO Strategic Value</div>
        </div>
        <Link href="/dashboard">
          <Button className="bg-[hsl(209,100%,36%)] hover:bg-[hsl(209,100%,32%)] text-white">
            Access Dashboard
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-8 py-12 max-w-4xl">
        <PageAgentWizard 
          context={{
            pageName: 'Value Proposition',
            pageType: 'overview',
            metrics: {
              'Cycle Time Reduction': '83%',
              'Speed Improvement': '30 Days → 5 Days',
              'Forecast Accuracy': '85%',
              'Overhead Reduction': '75%',
              'Portfolio Visibility': '100%'
            }
          }}
          agentName="Value Agent"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[hsl(209,100%,36%)] mb-6">
              Delivering Value for Legal & General
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              How the Value Realization Office (VRO) addresses critical challenges to drive speed, certainty, and efficiency across the enterprise.
            </p>
          </div>

          <div className="space-y-12">
            {/* Value Pillar 1 */}
            <section className="bg-white border border-border rounded-lg p-8 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="p-3 bg-[hsl(209,100%,36%)]/10 rounded-lg text-[hsl(209,100%,36%)]">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">Accelerating Delivery & Speed</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    By implementing agentic automation and smart classification, we remove the manual bottlenecks that historically slowed down decision-making. 
                    This creates a paradigm shift from a 30-day cycle to a 5-day cycle, ensuring L&G can respond to market demands with agility without sacrificing governance.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["83% Reduction in Cycle Time", "Automated Intake & Approvals", "30 Days → 5 Days Speed", "Governance Quality Maintained"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(148,100%,26%)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Value Pillar 2 */}
            <section className="bg-white border border-border rounded-lg p-8 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="p-3 bg-[hsl(209,100%,36%)]/10 rounded-lg text-[hsl(209,100%,36%)]">
                  <Shield size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">Certainty & Risk Mitigation</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    We replace optimistic estimates with benchmark-driven realism. Continuous drift detection and variance monitoring provide early warnings, 
                    transforming "late discovery" of risks into proactive management. This ensures we deliver on our promises to shareholders and customers.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Forecast Accuracy up to 85%", "Early Warning Systems", "Cost Variance within ±10%", "100% Portfolio Visibility"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(148,100%,26%)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Value Pillar 3 */}
            <section className="bg-white border border-border rounded-lg p-8 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="p-3 bg-[hsl(209,100%,36%)]/10 rounded-lg text-[hsl(209,100%,36%)]">
                  <Users size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">Operational Efficiency & Standardization</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Moving from 12 fragmented ways of working to 1 unified standard. We automate the routine, labor-intensive tasks of data collation and reporting, 
                    freeing up our talent to focus on high-value strategic interventions rather than administrative overhead.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["75% Reduction in Overhead", "FTE Reallocated to Strategy", "Unified Governance Model", "Real-time Data Feeds"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(148,100%,26%)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-16 bg-[hsl(209,100%,36%)] rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Explore the Data?</h3>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Dive into the interactive dashboard to see how these strategies are being applied across the 8 core challenge areas.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-[hsl(209,100%,36%)] hover:bg-blue-50 font-bold px-8">
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 border-t border-border bg-white text-center text-sm text-muted-foreground mt-12">
        <p>© 2026 Legal & General. Strategic Transformation Office.</p>
      </footer>
    </div>
  );
}
