import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_KEY = "chronyx_onboarding_complete";
const ONBOARDING_REPLAY_KEY = "chronyx_onboarding_replay";

export const useOnboarding = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if user explicitly requested replay
      const replayRequested = localStorage.getItem(`${ONBOARDING_REPLAY_KEY}_${user.id}`);
      if (replayRequested === "true") {
        // Clear the replay flag and show onboarding
        localStorage.removeItem(`${ONBOARDING_REPLAY_KEY}_${user.id}`);
        setShowOnboarding(true);
        setIsLoading(false);
        return;
      }

      // Check local storage first for quick response
      const localComplete = localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`);
      if (localComplete === "true") {
        setShowOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Check if user has a profile with display_name (indicating they've completed onboarding)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, birth_date, created_at")
        .eq("id", user.id)
        .single();

      // If user has a display_name, they've completed onboarding before
      if (profileData?.display_name) {
        localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
        setShowOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Check if this is an existing user with any data
      const [todosResult, expensesResult, incomeResult] = await Promise.all([
        supabase.from("todos").select("id").eq("user_id", user.id).limit(1),
        supabase.from("expenses").select("id").eq("user_id", user.id).limit(1),
        supabase.from("income_entries").select("id").eq("user_id", user.id).limit(1),
      ]);

      const hasData = 
        (todosResult.data && todosResult.data.length > 0) ||
        (expensesResult.data && expensesResult.data.length > 0) ||
        (incomeResult.data && incomeResult.data.length > 0);

      if (hasData) {
        // User has data, mark onboarding as complete
        localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
        setShowOnboarding(false);
      } else {
        // Check if account was created very recently (within last 5 minutes)
        // This helps identify truly new accounts
        const profileCreatedAt = profileData?.created_at ? new Date(profileData.created_at) : null;
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        // Show onboarding for new accounts (no display_name and no data)
        // OR if the profile was just created
        const isNewAccount = !profileData?.display_name && !hasData;
        const isRecentlyCreated = profileCreatedAt && profileCreatedAt > fiveMinutesAgo;
        
        if (isNewAccount || isRecentlyCreated) {
          setShowOnboarding(true);
        } else {
          // Older account without display_name but no recent activity - likely returning user
          localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
          setShowOnboarding(false);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const completeOnboarding = useCallback(() => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
    }
    setShowOnboarding(false);
  }, [user]);

  const resetOnboarding = useCallback(() => {
    if (user) {
      localStorage.removeItem(`${ONBOARDING_KEY}_${user.id}`);
    }
    setShowOnboarding(true);
  }, [user]);

  // Request onboarding replay on next login
  const requestOnboardingReplay = useCallback(() => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_REPLAY_KEY}_${user.id}`, "true");
    }
  }, [user]);

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    requestOnboardingReplay,
  };
};
