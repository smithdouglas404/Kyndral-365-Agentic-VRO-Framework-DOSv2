import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { onAuthChange, logout as firebaseLogout, getIdToken } from "@/lib/firebase";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  // Get Firebase ID token
  const idToken = await getIdToken();
  
  if (!idToken) {
    return null;
  }

  const response = await fetch("/api/auth/firebase/me", {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.user;
}

async function logout(): Promise<void> {
  try {
    const idToken = await getIdToken();
    if (idToken) {
      await fetch("/api/auth/firebase/logout", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
    }
  } catch (e) {
    console.error('[useAuth] Logout API call failed:', e);
  }
  
  await firebaseLogout();
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseReady, setFirebaseReady] = useState(false);
  
  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setFirebaseReady(true);
      if (!firebaseUser) {
        queryClient.setQueryData(["/api/auth/user"], null);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    });
    
    return () => unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading: isQueryLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: firebaseReady,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading: !firebaseReady || isQueryLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
