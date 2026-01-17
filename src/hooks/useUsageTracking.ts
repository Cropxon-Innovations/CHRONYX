import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { getPlanLimits, canAccessFeature, PlanFeatures } from '@/lib/planConfig';

export type UsageType = 'gmail_import' | 'ai_parsing' | 'ocr_scan' | 'export';

export interface UsageStatus {
  current: number;
  limit: number;
  remaining: number;
  canUse: boolean;
  usagePercent: number;
  warningThreshold: boolean; // true if at 80%+
}

export const useUsageTracking = () => {
  const { user } = useAuth();
  const { getCurrentPlan, subscription } = useSubscription();
  const [usageData, setUsageData] = useState<Record<UsageType, UsageStatus>>({
    gmail_import: { current: 0, limit: 0, remaining: 0, canUse: false, usagePercent: 0, warningThreshold: false },
    ai_parsing: { current: 0, limit: 0, remaining: 0, canUse: false, usagePercent: 0, warningThreshold: false },
    ocr_scan: { current: 0, limit: 0, remaining: 0, canUse: false, usagePercent: 0, warningThreshold: false },
    export: { current: 0, limit: 0, remaining: 0, canUse: false, usagePercent: 0, warningThreshold: false },
  });
  const [loading, setLoading] = useState(true);

  const currentPlan = getCurrentPlan();
  const planLimits = getPlanLimits(currentPlan);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('usage_type, usage_count')
        .eq('user_id', user.id)
        .eq('usage_month', currentMonth);

      if (error) throw error;

      const usageMap: Record<string, number> = {};
      data?.forEach(row => {
        usageMap[row.usage_type] = row.usage_count;
      });

      // Build usage status for each type
      const newUsageData: Record<UsageType, UsageStatus> = {
        gmail_import: buildUsageStatus(usageMap['gmail_import'] || 0, planLimits.gmail_imports_per_month),
        ai_parsing: buildUsageStatus(usageMap['ai_parsing'] || 0, planLimits.ai_parsing_per_month),
        ocr_scan: buildUsageStatus(usageMap['ocr_scan'] || 0, planLimits.ocr_scans_per_month),
        export: buildUsageStatus(usageMap['export'] || 0, 1000), // High limit for export
      };

      setUsageData(newUsageData);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }, [user, planLimits]);

  const buildUsageStatus = (current: number, limit: number): UsageStatus => {
    const remaining = Math.max(limit - current, 0);
    const usagePercent = limit > 0 ? Math.round((current / limit) * 100) : 0;
    return {
      current,
      limit,
      remaining,
      canUse: current < limit,
      usagePercent,
      warningThreshold: usagePercent >= 80,
    };
  };

  const checkCanUse = useCallback((usageType: UsageType): { canUse: boolean; message: string } => {
    const status = usageData[usageType];
    
    if (currentPlan === 'free') {
      // Free plan cannot use automation features
      const automationTypes: UsageType[] = ['gmail_import', 'ai_parsing', 'ocr_scan'];
      if (automationTypes.includes(usageType)) {
        return { 
          canUse: false, 
          message: `${usageType.replace('_', ' ')} requires Pro or Premium plan. Upgrade to unlock.` 
        };
      }
    }

    if (!status.canUse) {
      return { 
        canUse: false, 
        message: `Monthly limit reached (${status.current}/${status.limit}). Upgrade for more.` 
      };
    }

    if (status.warningThreshold) {
      return { 
        canUse: true, 
        message: `⚠️ ${status.remaining} remaining this month` 
      };
    }

    return { canUse: true, message: '' };
  }, [usageData, currentPlan]);

  const incrementUsage = useCallback(async (usageType: UsageType, count: number = 1): Promise<boolean> => {
    if (!user) return false;

    const { canUse } = checkCanUse(usageType);
    if (!canUse) return false;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Upsert usage record
      const { error } = await supabase
        .from('usage_tracking')
        .upsert({
          user_id: user.id,
          usage_type: usageType,
          usage_month: currentMonth,
          usage_count: (usageData[usageType]?.current || 0) + count,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,usage_type,usage_month',
        });

      if (error) throw error;

      // Update local state
      setUsageData(prev => ({
        ...prev,
        [usageType]: buildUsageStatus(
          (prev[usageType]?.current || 0) + count,
          prev[usageType]?.limit || 0
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }, [user, usageData, checkCanUse]);

  const canUseFeature = useCallback((feature: keyof PlanFeatures): boolean => {
    return canAccessFeature(currentPlan, feature);
  }, [currentPlan]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usageData,
    loading,
    checkCanUse,
    incrementUsage,
    canUseFeature,
    currentPlan,
    refetch: fetchUsage,
  };
};
