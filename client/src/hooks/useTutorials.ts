import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTutorials, getTutorial, type TourDefinition } from "@/lib/tutorials";

interface TutorialProgress {
  id: string;
  userId: string;
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  completedAt: string | null;
  startedAt: string;
  lastViewedAt: string;
}

export function useTutorials() {
  const queryClient = useQueryClient();
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingTutorialId, setPendingTutorialId] = useState<string | null>(null);

  const { data: progress = [], isLoading } = useQuery<TutorialProgress[]>({
    queryKey: ["/api/tutorials/progress"],
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: async ({ tutorialId, totalSteps }: { tutorialId: string; totalSteps: number }) => {
      const res = await fetch("/api/tutorials/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialId, totalSteps }),
      });
      if (!res.ok) throw new Error("Failed to start tutorial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials/progress"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (tutorialId: string) => {
      const res = await fetch(`/api/tutorials/${tutorialId}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to complete tutorial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials/progress"] });
    },
  });

  const skipMutation = useMutation({
    mutationFn: async ({ tutorialId, totalSteps }: { tutorialId: string; totalSteps: number }) => {
      const res = await fetch(`/api/tutorials/${tutorialId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSteps }),
      });
      if (!res.ok) throw new Error("Failed to skip tutorial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials/progress"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (tutorialId: string) => {
      const res = await fetch(`/api/tutorials/${tutorialId}/reset`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset tutorial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials/progress"] });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ tutorialId, currentStep }: { tutorialId: string; currentStep: number }) => {
      const res = await fetch(`/api/tutorials/${tutorialId}/step`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep }),
      });
      if (!res.ok) throw new Error("Failed to update step");
      return res.json();
    },
  });

  const updateStep = useCallback((tutorialId: string, currentStep: number) => {
    updateStepMutation.mutate({ tutorialId, currentStep });
  }, [updateStepMutation]);

  const isTutorialCompleted = useCallback((tutorialId: string) => {
    const p = progress.find(t => t.tutorialId === tutorialId);
    return p?.isCompleted || false;
  }, [progress]);

  const isTutorialSkipped = useCallback((tutorialId: string) => {
    const p = progress.find(t => t.tutorialId === tutorialId);
    return p?.isSkipped || false;
  }, [progress]);

  const getTutorialProgress = useCallback((tutorialId: string) => {
    return progress.find(t => t.tutorialId === tutorialId);
  }, [progress]);

  const startTutorial = useCallback((tutorialId: string) => {
    const tour = getTutorial(tutorialId);
    if (!tour) return;

    const existingProgress = getTutorialProgress(tutorialId);
    if (!existingProgress) {
      startMutation.mutate({ tutorialId, totalSteps: tour.steps.length });
    }
    
    setPendingTutorialId(tutorialId);
    setShowWelcome(true);
  }, [getTutorialProgress, startMutation]);

  const confirmStartTutorial = useCallback(() => {
    if (!pendingTutorialId) return;
    const tour = getTutorial(pendingTutorialId);
    if (tour) {
      setShowWelcome(false);
      setActiveTour(tour);
    }
    setPendingTutorialId(null);
  }, [pendingTutorialId]);

  const skipCurrentTutorial = useCallback(() => {
    if (pendingTutorialId) {
      const tour = getTutorial(pendingTutorialId);
      if (tour) {
        skipMutation.mutate({ tutorialId: pendingTutorialId, totalSteps: tour.steps.length });
      }
    }
    setShowWelcome(false);
    setPendingTutorialId(null);
  }, [pendingTutorialId, skipMutation]);

  const completeTutorial = useCallback((tutorialId: string) => {
    completeMutation.mutate(tutorialId);
    setActiveTour(null);
  }, [completeMutation]);

  const closeTutorial = useCallback(() => {
    setActiveTour(null);
  }, []);

  const resetTutorial = useCallback((tutorialId: string) => {
    resetMutation.mutate(tutorialId);
  }, [resetMutation]);

  const allTutorials = getAllTutorials();

  const tutorialStats = {
    total: allTutorials.length,
    completed: progress.filter(p => p.isCompleted).length,
    skipped: progress.filter(p => p.isSkipped && !p.isCompleted).length,
  };

  return {
    allTutorials,
    progress,
    isLoading,
    activeTour,
    showWelcome,
    pendingTutorial: pendingTutorialId ? getTutorial(pendingTutorialId) : null,
    tutorialStats,
    isTutorialCompleted,
    isTutorialSkipped,
    getTutorialProgress,
    startTutorial,
    confirmStartTutorial,
    skipCurrentTutorial,
    completeTutorial,
    closeTutorial,
    resetTutorial,
    updateStep,
  };
}
