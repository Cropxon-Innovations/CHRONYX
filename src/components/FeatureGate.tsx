import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { canAccessFeature, getRequiredPlan, FEATURES, FeatureKey, PlanType } from '@/lib/featureConfig';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) => {
  const { getCurrentPlan, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-muted/30 rounded-lg h-20" />;
  }

  const currentPlan = getCurrentPlan() as PlanType;
  const hasAccess = canAccessFeature(currentPlan, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredPlan = getRequiredPlan(feature);
  const featureConfig = FEATURES[feature];
  const Icon = requiredPlan === 'premium' ? Crown : Sparkles;

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-muted-foreground/20 bg-muted/5 p-6">
      {/* Blur overlay effect */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-background/70 flex items-center justify-center z-10">
        <div className="text-center p-4 max-w-xs">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {featureConfig?.name || feature.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {requiredPlan === 'premium' ? 'Premium' : 'Pro'} feature
          </p>
          <Link to="/pricing">
            <Button size="sm" className="gap-2">
              <Icon className="w-3.5 h-3.5" />
              Upgrade to {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Blurred content preview */}
      <div className="opacity-30 blur-sm pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
};

// Hook for checking feature access in code
export const useFeatureAccess = () => {
  const { getCurrentPlan, isPro, isPremium, loading } = useSubscription();
  
  const currentPlan = getCurrentPlan() as PlanType;

  const canAccess = (feature: FeatureKey): boolean => {
    return canAccessFeature(currentPlan, feature);
  };

  const getUpgradeMessage = (feature: FeatureKey): string => {
    const requiredPlan = getRequiredPlan(feature);
    return `This feature requires a ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan.`;
  };

  return {
    canAccess,
    getUpgradeMessage,
    getRequiredPlan,
    isPro,
    isPremium,
    currentPlan,
    loading,
  };
};

// HOC for wrapping entire components
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureKey
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature}>
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };
}

// Badge component for showing feature availability
export const FeatureBadge = ({ feature }: { feature: FeatureKey }) => {
  const requiredPlan = getRequiredPlan(feature);
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
      requiredPlan === 'premium' 
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
        : requiredPlan === 'pro'
          ? 'bg-primary/15 text-primary'
          : 'bg-muted text-muted-foreground'
    }`}>
      {requiredPlan === 'premium' ? (
        <Crown className="w-3 h-3" />
      ) : requiredPlan === 'pro' ? (
        <Sparkles className="w-3 h-3" />
      ) : null}
      {requiredPlan === 'free' ? 'Free' : requiredPlan === 'premium' ? 'Premium' : 'Pro'}
    </span>
  );
};

// Re-export the Feature type for convenience
export type { FeatureKey as Feature } from '@/lib/featureConfig';
