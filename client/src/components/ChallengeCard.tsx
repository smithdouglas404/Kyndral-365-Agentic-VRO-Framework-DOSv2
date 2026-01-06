import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-4xl font-heading font-bold text-muted-foreground/10 group-hover:text-primary/10 transition-colors">
              {String(challenge.number).padStart(2, '0')}
            </span>
          </div>
          <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
            {challenge.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">The Challenge</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {challenge.problem}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">VRO Solution</h4>
            <p className="text-sm font-medium text-foreground">
              {challenge.solution}
            </p>
          </div>

          <div className="mt-auto space-y-3 pt-4">
            <div className="flex flex-wrap gap-2">
              {challenge.mechanism.slice(0, 3).map((mech, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal bg-secondary/50 text-secondary-foreground/80">
                  {mech}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 bg-muted/30 rounded-lg p-3">
              {challenge.metrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-2 font-mono font-semibold">
                    {metric.before && (
                      <>
                        <span className="text-muted-foreground line-through decoration-destructive/50 text-xs">
                          {metric.before}
                        </span>
                        <ArrowRight size={12} className="text-muted-foreground/50" />
                      </>
                    )}
                    <span className={cn(
                      "text-primary",
                      metric.value?.includes("+") && "text-emerald-600 dark:text-emerald-400"
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
