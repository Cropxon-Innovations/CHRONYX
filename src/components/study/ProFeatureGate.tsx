import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProFeatureGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
  fallback?: ReactNode;
  inline?: boolean;
}

export const ProFeatureGate = ({
  children,
  feature,
  description,
  fallback,
  inline = false,
}: ProFeatureGateProps) => {
  const { isPro } = useSubscription();

  if (isPro()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inline) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span className="text-sm">{feature} requires Pro</span>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <Link to="/pricing">Upgrade</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-base">{feature}</CardTitle>
      </CardHeader>
      <CardContent className="text-center pb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {description || `This feature helps you understand what you read deeply.`}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Available in CHRONYX Pro.
        </p>
        <Button variant="outline" asChild>
          <Link to="/pricing">See Pro Features</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

// Hook for checking feature access
export const useProFeature = () => {
  const { isPro, isPremium, getCurrentPlan } = useSubscription();

  const canAccess = (feature: ProFeature): boolean => {
    const plan = getCurrentPlan();
    const limits = FEATURE_LIMITS[feature];
    
    if (!limits) return true;
    
    if (plan === 'premium') return true;
    if (plan === 'pro') return limits.pro;
    return limits.free;
  };

  const getLimit = (feature: ProFeature): number => {
    const plan = getCurrentPlan();
    const limits = FEATURE_LIMITS[feature];
    
    if (!limits || !limits.limit) return Infinity;
    
    if (plan === 'premium' || plan === 'pro') return limits.limit.pro;
    return limits.limit.free;
  };

  return { canAccess, getLimit, isPro, isPremium };
};

// Feature definitions
type ProFeature = 
  | 'inline_dictionary'
  | 'save_vocabulary'
  | 'vocabulary_review'
  | 'explain_paragraph'
  | 'ai_summaries'
  | 'study_analytics'
  | 'pdf_exports'
  | 'multi_language_translation';

interface FeatureLimit {
  free: boolean;
  pro: boolean;
  limit?: {
    free: number;
    pro: number;
  };
}

const FEATURE_LIMITS: Record<ProFeature, FeatureLimit> = {
  inline_dictionary: { free: true, pro: true },
  save_vocabulary: { free: true, pro: true },
  vocabulary_review: { 
    free: true, 
    pro: true,
    limit: { free: 5, pro: 10 }
  },
  explain_paragraph: { free: false, pro: true },
  ai_summaries: { free: false, pro: true },
  study_analytics: { 
    free: true, 
    pro: true,
    // Free gets basic, Pro gets advanced
  },
  pdf_exports: { free: false, pro: true },
  multi_language_translation: { free: false, pro: true },
};
