import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';

export interface NoteflowLMUsage {
  dailyUsed: number;
  dailyLimit: number;
  remaining: number;
  canGenerate: boolean;
  loading: boolean;
}

const PLAN_LIMITS = {
  free: 5,
  pro: 12,
  premium: 20,
  trial: 12,
  lifetime: 20,
};

export const useNoteflowLMUsage = () => {
  const { user } = useAuth();
  const { getCurrentPlan, loading: subscriptionLoading } = useSubscription();
  const [usage, setUsage] = useState<NoteflowLMUsage>({
    dailyUsed: 0,
    dailyLimit: 5,
    remaining: 5,
    canGenerate: true,
    loading: true,
  });

  const fetchDailyUsage = useCallback(async () => {
    if (!user) {
      setUsage(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const plan = getCurrentPlan();
      const dailyLimit = PLAN_LIMITS[plan] || 5;

      // Count today's generations
      const { count, error } = await supabase
        .from('noteflowlm_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('generation_date', today);

      if (error) throw error;

      const dailyUsed = count || 0;
      const remaining = Math.max(dailyLimit - dailyUsed, 0);

      setUsage({
        dailyUsed,
        dailyLimit,
        remaining,
        canGenerate: dailyUsed < dailyLimit,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching NoteflowLM usage:', error);
      setUsage(prev => ({ ...prev, loading: false }));
    }
  }, [user, getCurrentPlan]);

  const recordGeneration = useCallback(async (params: {
    generationType: 'image' | 'slides' | 'infographic' | 'video';
    noteId?: string;
    noteTitle?: string;
    mode: 'private' | 'public';
    customPrompt?: string;
    resultSummary?: string;
    success?: boolean;
  }): Promise<boolean> => {
    if (!user) return false;

    // Check if can generate
    if (!usage.canGenerate) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('noteflowlm_generations')
        .insert({
          user_id: user.id,
          generation_type: params.generationType,
          note_id: params.noteId,
          note_title: params.noteTitle,
          mode: params.mode,
          custom_prompt: params.customPrompt,
          result_summary: params.resultSummary,
          success: params.success ?? true,
        });

      if (error) throw error;

      // Update local state
      setUsage(prev => ({
        ...prev,
        dailyUsed: prev.dailyUsed + 1,
        remaining: Math.max(prev.remaining - 1, 0),
        canGenerate: prev.dailyUsed + 1 < prev.dailyLimit,
      }));

      return true;
    } catch (error) {
      console.error('Error recording generation:', error);
      return false;
    }
  }, [user, usage.canGenerate]);

  const getUsageMessage = useCallback((): string => {
    if (usage.loading) return 'Loading...';
    if (!usage.canGenerate) {
      return `Daily limit reached (${usage.dailyUsed}/${usage.dailyLimit}). Upgrade for more.`;
    }
    if (usage.remaining <= 2) {
      return `⚠️ ${usage.remaining} generation${usage.remaining === 1 ? '' : 's'} remaining today`;
    }
    return `${usage.remaining} of ${usage.dailyLimit} generations remaining today`;
  }, [usage]);

  useEffect(() => {
    if (!subscriptionLoading) {
      fetchDailyUsage();
    }
  }, [fetchDailyUsage, subscriptionLoading]);

  return {
    ...usage,
    recordGeneration,
    getUsageMessage,
    refetch: fetchDailyUsage,
  };
};
