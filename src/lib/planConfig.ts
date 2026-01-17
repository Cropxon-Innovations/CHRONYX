// ============================================
// CHRONYX Plan Configuration
// India + Global pricing with guardrails
// ============================================

export interface PlanFeatures {
  manual_entries: boolean;
  dashboards: boolean;
  budgeting: boolean;
  basic_reports: boolean;
  gmail_import: boolean;
  ai_parsing: boolean;
  ocr: boolean;
  smart_categorization: boolean;
  priority_support: boolean;
  family_profiles: boolean;
  advanced_forecasts: boolean;
  export_all: boolean;
  lifetime: boolean;
}

export interface PlanLimit {
  gmail_imports_per_month: number;
  ai_parsing_per_month: number;
  ocr_scans_per_month: number;
  storage_gb: number;
  trial_duration_days?: number;
}

export interface Plan {
  id: 'free' | 'trial' | 'pro' | 'premium' | 'lifetime';
  name: string;
  description: string;
  price: {
    inr: { monthly: number; yearly?: number };
    usd: { monthly: number; yearly?: number };
  };
  limits: PlanLimit;
  features: PlanFeatures;
  popular?: boolean;
  bestValue?: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Personal Clarity',
    description: 'Everything you need to get started with manual tracking',
    price: {
      inr: { monthly: 0 },
      usd: { monthly: 0 },
    },
    limits: {
      gmail_imports_per_month: 0,
      ai_parsing_per_month: 0,
      ocr_scans_per_month: 0,
      storage_gb: 2,
    },
    features: {
      manual_entries: true,
      dashboards: true,
      budgeting: true,
      basic_reports: true,
      gmail_import: false,
      ai_parsing: false,
      ocr: false,
      smart_categorization: false,
      priority_support: false,
      family_profiles: false,
      advanced_forecasts: false,
      export_all: false,
      lifetime: false,
    },
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Auto Finance',
    description: 'Automation for salaried professionals & founders',
    price: {
      inr: { monthly: 199, yearly: 1999 },
      usd: { monthly: 3, yearly: 29 },
    },
    limits: {
      gmail_imports_per_month: 300,
      ai_parsing_per_month: 500,
      ocr_scans_per_month: 100,
      storage_gb: 10,
    },
    features: {
      manual_entries: true,
      dashboards: true,
      budgeting: true,
      basic_reports: true,
      gmail_import: true,
      ai_parsing: true,
      ocr: true,
      smart_categorization: true,
      priority_support: true,
      family_profiles: false,
      advanced_forecasts: false,
      export_all: false,
      lifetime: false,
    },
    popular: true,
    cta: 'Upgrade to Pro',
  },
  {
    id: 'premium',
    name: 'Life OS',
    description: 'Power users, families & high-income individuals',
    price: {
      inr: { monthly: 499, yearly: 4999 },
      usd: { monthly: 7, yearly: 69 },
    },
    limits: {
      gmail_imports_per_month: 1500,
      ai_parsing_per_month: 3000,
      ocr_scans_per_month: 500,
      storage_gb: 100,
    },
    features: {
      manual_entries: true,
      dashboards: true,
      budgeting: true,
      basic_reports: true,
      gmail_import: true,
      ai_parsing: true,
      ocr: true,
      smart_categorization: true,
      priority_support: true,
      family_profiles: true,
      advanced_forecasts: true,
      export_all: true,
      lifetime: false,
    },
    cta: 'Upgrade to Premium',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    description: 'One-time payment, lifetime access',
    price: {
      inr: { monthly: 9999 }, // One-time
      usd: { monthly: 149 }, // One-time
    },
    limits: {
      gmail_imports_per_month: 1500,
      ai_parsing_per_month: 3000,
      ocr_scans_per_month: 500,
      storage_gb: 100,
    },
    features: {
      manual_entries: true,
      dashboards: true,
      budgeting: true,
      basic_reports: true,
      gmail_import: true,
      ai_parsing: true,
      ocr: true,
      smart_categorization: true,
      priority_support: true,
      family_profiles: true,
      advanced_forecasts: true,
      export_all: true,
      lifetime: true,
    },
    bestValue: true,
    cta: 'Get Lifetime Access',
  },
];

// Trial plan config (not shown in pricing, auto-unlocked)
export const TRIAL_LIMITS: PlanLimit = {
  gmail_imports_per_month: 20, // 20 emails total
  ai_parsing_per_month: 50,
  ocr_scans_per_month: 10,
  storage_gb: 5,
  trial_duration_days: 7,
};

export function getPlanById(planId: string): Plan | undefined {
  return PLANS.find(p => p.id === planId);
}

export function getPlanLimits(planType: string): PlanLimit {
  const plan = PLANS.find(p => p.id === planType);
  if (planType === 'trial') return TRIAL_LIMITS;
  return plan?.limits || PLANS[0].limits;
}

export function canAccessFeature(planType: string, feature: keyof PlanFeatures): boolean {
  if (planType === 'trial') {
    // Trial has Pro features
    const proPlan = PLANS.find(p => p.id === 'pro');
    return proPlan?.features[feature] || false;
  }
  const plan = PLANS.find(p => p.id === planType);
  return plan?.features[feature] || false;
}

export function getUpgradeTargetPlan(currentPlan: string): Plan | null {
  if (currentPlan === 'free' || currentPlan === 'trial') {
    return PLANS.find(p => p.id === 'pro') || null;
  }
  if (currentPlan === 'pro') {
    return PLANS.find(p => p.id === 'premium') || null;
  }
  return null;
}

// Format price for display
export function formatPrice(amount: number, currency: 'INR' | 'USD'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount}`;
}

// Detect user's likely currency preference
export function detectCurrency(): 'INR' | 'USD' {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language;
  
  if (timezone.includes('Kolkata') || timezone.includes('Asia/Calcutta') || locale.startsWith('hi') || locale === 'en-IN') {
    return 'INR';
  }
  return 'USD';
}
