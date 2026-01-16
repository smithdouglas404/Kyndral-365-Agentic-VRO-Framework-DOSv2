import { useState } from "react";
import { HelpCircle, BookOpen, PlayCircle, Check, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTutorials } from "@/hooks/useTutorials";
import { GuidedTour, TourWelcomeModal } from "@/components/GuidedTour";

export function HelpMenu() {
  const {
    allTutorials,
    tutorialStats,
    activeTour,
    showWelcome,
    pendingTutorial,
    isTutorialCompleted,
    isTutorialSkipped,
    startTutorial,
    confirmStartTutorial,
    skipCurrentTutorial,
    completeTutorial,
    closeTutorial,
    resetTutorial,
    updateStep,
  } = useTutorials();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleStartTutorial = (tutorialId: string) => {
    setMenuOpen(false);
    startTutorial(tutorialId);
  };

  const handleResetTutorial = (e: React.MouseEvent, tutorialId: string) => {
    e.stopPropagation();
    resetTutorial(tutorialId);
  };

  const progressPercent = tutorialStats.total > 0 
    ? Math.round((tutorialStats.completed / tutorialStats.total) * 100) 
    : 0;

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full relative"
            data-testid="help-menu-trigger"
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            {tutorialStats.completed < tutorialStats.total && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80" data-testid="help-menu-content">
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Interactive Tutorials</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {tutorialStats.completed}/{tutorialStats.total}
            </Badge>
          </DropdownMenuLabel>
          
          <div className="px-2 py-2">
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {progressPercent}% completed
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          {allTutorials.map((tutorial) => {
            const completed = isTutorialCompleted(tutorial.id);
            const skipped = isTutorialSkipped(tutorial.id);
            
            return (
              <DropdownMenuItem
                key={tutorial.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleStartTutorial(tutorial.id)}
                data-testid={`tutorial-item-${tutorial.id}`}
              >
                <div className="mt-0.5">
                  {completed ? (
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <PlayCircle className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tutorial.name}</span>
                    {skipped && !completed && (
                      <Badge variant="secondary" className="text-xs">Skipped</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{tutorial.steps.length} steps</span>
                    <span>~{Math.ceil(tutorial.steps.length * 0.5)} min</span>
                  </div>
                </div>
                {completed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => handleResetTutorial(e, tutorial.id)}
                    data-testid={`reset-tutorial-${tutorial.id}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="gap-2 text-muted-foreground" data-testid="help-documentation">
            <ExternalLink className="h-4 w-4" />
            <span>View Documentation</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {pendingTutorial && (
        <TourWelcomeModal
          tour={pendingTutorial}
          isOpen={showWelcome}
          onStart={confirmStartTutorial}
          onSkip={skipCurrentTutorial}
        />
      )}

      {activeTour && (
        <GuidedTour
          tour={activeTour}
          isOpen={true}
          onClose={closeTutorial}
          onComplete={completeTutorial}
          onStepChange={updateStep}
        />
      )}
    </>
  );
}
