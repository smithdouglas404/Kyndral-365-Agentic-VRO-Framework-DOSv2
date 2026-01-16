import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Lightbulb, CheckCircle } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

export interface TourDefinition {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}

interface GuidedTourProps {
  tour: TourDefinition;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (tourId: string) => void;
  onStepChange?: (tourId: string, step: number) => void;
  initialStep?: number;
}

export function GuidedTour({ tour, isOpen, onClose, onComplete, onStepChange, initialStep = 0 }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);

  const step = tour.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tour.steps.length - 1;
  const progress = ((currentStep + 1) / tour.steps.length) * 100;

  const findTarget = useCallback(() => {
    if (!step?.target) {
      setTargetMissing(true);
      setTargetRect(null);
      return;
    }
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setTargetMissing(false);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
      setTargetMissing(true);
    }
  }, [step?.target]);

  useEffect(() => {
    if (isOpen) {
      findTarget();
      const handleResize = () => findTarget();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize, true);
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize, true);
      };
    }
  }, [isOpen, currentStep, findTarget]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete(tour.id);
      onClose();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(tour.id, nextStep);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(tour.id, prevStep);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const padding = step?.spotlightPadding || 8;
    const placement = step?.placement || "bottom";
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    switch (placement) {
      case "top":
        return {
          top: targetRect.top - tooltipHeight - padding - 20,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding + 20,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding - 20,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding + 20,
        };
      default:
        return {
          top: targetRect.bottom + padding + 20,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  if (!isOpen) return null;

  const tooltipStyle = getTooltipPosition();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" data-testid="guided-tour-overlay">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={handleSkip}
        />
        
        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bg-transparent rounded-lg ring-4 ring-primary ring-offset-4 ring-offset-transparent pointer-events-none"
            style={{
              top: targetRect.top - (step?.spotlightPadding || 8),
              left: targetRect.left - (step?.spotlightPadding || 8),
              width: targetRect.width + (step?.spotlightPadding || 8) * 2,
              height: targetRect.height + (step?.spotlightPadding || 8) * 2,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-10"
          style={{
            ...tooltipStyle,
            width: 360,
          }}
        >
          <Card className="shadow-2xl border-primary/20" data-testid="tour-tooltip">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{step?.title}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSkip} data-testid="tour-close">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Progress value={progress} className="h-1 mt-2" />
            </CardHeader>
            
            <CardContent className="text-sm text-muted-foreground">
              {step?.content}
            </CardContent>
            
            <CardFooter className="flex items-center justify-between pt-0">
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {tour.steps.length}
              </span>
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button variant="outline" size="sm" onClick={handlePrevious} data-testid="tour-prev">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} data-testid="tour-next">
                  {isLastStep ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function TourWelcomeModal({ 
  tour, 
  isOpen, 
  onStart, 
  onSkip 
}: { 
  tour: TourDefinition; 
  isOpen: boolean; 
  onStart: () => void; 
  onSkip: () => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center" data-testid="tour-welcome-modal">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={onSkip}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10"
        >
          <Card className="w-[420px] shadow-2xl" data-testid="welcome-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{tour.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{tour.description}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded">{tour.steps.length} steps</span>
                <span>~{Math.ceil(tour.steps.length * 0.5)} min</span>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={onSkip} data-testid="tour-skip">
                Skip for now
              </Button>
              <Button onClick={onStart} data-testid="tour-start">
                Start Tour
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
