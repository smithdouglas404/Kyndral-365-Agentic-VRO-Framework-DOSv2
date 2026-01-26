import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink, Info, X } from "lucide-react";
import { Challenge } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompanyName } from "@/contexts/CompanyProfileContext";

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
  onDrillDown?: (type: string, id: string) => void;
}

export function ChallengeCard({ challenge, index, onDrillDown }: ChallengeCardProps) {
  const companyName = useCompanyName();
  const Icon = challenge.icon;
  const [isOpen, setIsOpen] = useState(false);

  // Escape key handler for accessibility
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClick = () => {
    if (onDrillDown) {
      onDrillDown("challenge", challenge.id);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05, ease: "easeInOut" }}
        className="h-full"
      >
        <Card 
          className="h-full flex flex-col hover:shadow-lg transition-all duration-150 border border-border bg-white rounded-[4px] cursor-pointer hover:border-[hsl(209,100%,36%)]/30 group"
          onClick={handleClick}
          data-testid={`card-challenge-${challenge.id}`}
        >
          <CardHeader className="pb-3 border-b border-border/50 bg-background/30">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 rounded-[4px] bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={24} strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-muted-foreground/20">
                  {String(challenge.number).padStart(2, '0')}
                </span>
                <ExternalLink size={14} className="text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-[hsl(209,100%,36%)] transition-colors">
              {challenge.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-4 pt-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">The Challenge</h4>
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                {challenge.problem}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Solution</h4>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {challenge.solution}
              </p>
            </div>

            <div className="mt-auto space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {challenge.strategicAlignment && challenge.strategicAlignment.slice(0, 2).map((align, i) => (
                  <Badge key={`align-${i}`} variant="outline" className="text-xs font-medium text-[hsl(209,100%,36%)] border-[hsl(209,100%,36%)]/20 bg-[hsl(209,100%,36%)]/5">
                    {align}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 bg-background rounded-[4px] p-3 border border-border">
                {challenge.metrics.slice(0, 2).map((metric, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{metric.label}</span>
                    <div className="flex items-center gap-2 font-mono font-bold">
                      {metric.before && (
                        <>
                          <span className="text-muted-foreground/60 line-through text-xs font-normal">
                            {metric.before}
                          </span>
                          <ArrowRight size={12} className="text-muted-foreground/40" />
                        </>
                      )}
                      <span className={cn(
                        "text-primary",
                        metric.value?.includes("+") && "text-[hsl(148,100%,26%)]"
                      )}>
                        {metric.after || metric.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-center text-muted-foreground group-hover:text-[hsl(209,100%,36%)] transition-colors">
                Click to view details →
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Flyout Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col"
              data-testid={`flyout-challenge-${challenge.id}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[hsl(209,100%,36%)]/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[hsl(209,100%,36%)]/10 text-[hsl(209,100%,36%)]">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Challenge #{challenge.number}</span>
                    <h2 className="text-xl font-bold">{challenge.title}</h2>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} data-testid="button-close-flyout">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-2">The Challenge</h4>
                    <p className="text-sm text-red-900 leading-relaxed">
                      {challenge.problem}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                    <h4 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-2">VRO Solution</h4>
                    <p className="text-sm text-green-900 leading-relaxed">
                      {challenge.solution}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Implementation Mechanism</h4>
                    <div className="flex flex-wrap gap-2">
                      {challenge.mechanism.map((mech, i) => (
                        <Badge key={i} variant="secondary" className="text-sm bg-background border">
                          {mech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Strategic Alignment</h4>
                    <div className="flex flex-wrap gap-2">
                      {challenge.strategicAlignment?.map((align, i) => (
                        <Badge key={i} className="text-sm bg-[hsl(209,100%,36%)] text-white">
                          {align}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Key Metrics</h4>
                    <div className="space-y-3">
                      {challenge.metrics.map((metric, i) => (
                        <div key={i} className="p-3 bg-background rounded-lg border flex items-center justify-between">
                          <span className="font-medium">{metric.label}</span>
                          <div className="flex items-center gap-3 font-mono">
                            {metric.before && (
                              <>
                                <span className="text-muted-foreground line-through">
                                  {metric.before}
                                </span>
                                <ArrowRight size={16} className="text-[hsl(148,100%,26%)]" />
                              </>
                            )}
                            <span className="text-xl font-bold text-[hsl(148,100%,26%)]">
                              {metric.after || metric.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {challenge.vroMetrics && challenge.vroMetrics.length > 0 && (
                    <div className="p-4 bg-[hsl(209,100%,36%)]/5 border border-[hsl(209,100%,36%)]/20 rounded-lg">
                      <h4 className="text-sm font-bold text-[hsl(209,100%,36%)] uppercase tracking-wide mb-3">VRO Metrics (Tracked Continuously)</h4>
                      <div className="space-y-2">
                        {challenge.vroMetrics.map((metric, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-foreground font-medium">{metric.name}</span>
                            <Badge variant="outline" className="text-xs border-[hsl(209,100%,36%)]/30 text-[hsl(209,100%,36%)]">
                              {metric.cadence}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {challenge.coreTrackingFields && challenge.coreTrackingFields.length > 0 && (
                    <div className="p-4 bg-[hsl(148,100%,26%)]/5 border border-[hsl(148,100%,26%)]/20 rounded-lg">
                      <h4 className="text-sm font-bold text-[hsl(148,100%,26%)] uppercase tracking-wide mb-3">Core Tracking Fields</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {challenge.coreTrackingFields.map((field, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(148,100%,26%)]" />
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {challenge.relatedIds && challenge.relatedIds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Related Challenges</h4>
                      <div className="flex flex-wrap gap-2">
                        {challenge.relatedIds.map((id, i) => (
                          <Badge key={i} variant="outline" className="text-sm">
                            {id.replace('pmo-', '').replace(/-/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Info size={12} />
                    Data sourced from {companyName} Annual Report 2024
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
