import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Challenge } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
}

export function ChallengeCard({ challenge, index }: ChallengeCardProps) {
  const Icon = challenge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: "easeInOut" }}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-150 border border-border bg-white rounded-[4px]">
        <CardHeader className="pb-3 border-b border-border/50 bg-background/30">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-[4px] bg-primary/10 text-primary">
              <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-3xl font-bold text-muted-foreground/20">
              {String(challenge.number).padStart(2, '0')}
            </span>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {challenge.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4 pt-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">The Challenge</h4>
            <p className="text-sm text-foreground leading-relaxed">
              {challenge.problem}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wide">VRO Solution</h4>
            <p className="text-sm font-medium text-foreground">
              {challenge.solution}
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {challenge.strategicAlignment && challenge.strategicAlignment.map((align, i) => (
                <Badge key={`align-${i}`} variant="outline" className="text-xs font-medium text-[hsl(209,100%,36%)] border-[hsl(209,100%,36%)]/20 bg-[hsl(209,100%,36%)]/5">
                  {align}
                </Badge>
              ))}
              {challenge.mechanism.slice(0, 3).map((mech, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal bg-background text-foreground border border-border rounded-[4px]">
                  {mech}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 bg-background rounded-[4px] p-3 border border-border">
              {challenge.metrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
