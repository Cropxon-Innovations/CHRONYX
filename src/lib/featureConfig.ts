// ============================================
// CHRONYX Feature Configuration
// Centralized feature access control by plan
// ============================================

export type PlanType = 'free' | 'pro' | 'premium' | 'trial' | 'lifetime';

export type FeatureKey =
  // Core Features (Available to all)
  | 'todos'
  | 'notes'
  | 'basic_expenses'
  | 'basic_income'
  | 'basic_loans'
  | 'basic_insurance'
  | 'basic_documents'
  | 'basic_memory'
  | 'lifespan_view'
  | 'family_tree'
  | 'study_tracking'
  
  // Pro Features
  | 'advanced_analytics'
  | 'tax_calculator'
  | 'unlimited_tax_calculations'
  | 'tax_pdf_reports'
  | 'regime_comparison'
  | 'taxyn_unlimited'
  | 'financeflow_gmail'
  | 'priority_reminders'
  | 'extended_storage'
  | 'ocr_scanning'
  | 'smart_categorization'
  | 'ai_parsing'
  | 'study_analytics'
  | 'explain_paragraph'
  | 'ai_summaries'
  | 'pdf_exports'
  | 'vocabulary_unlimited'
  
  // Premium Features
  | 'unlimited_storage'
  | 'ai_insights'
  | 'family_profiles'
  | 'export_all_formats'
  | 'multi_year_tax'
  | 'ca_consultation'
  | 'private_discord'
  | 'founder_support'
  | 'early_access';

interface FeatureConfig {
  name: string;
  description: string;
  plans: PlanType[];
  limit?: {
    free?: number;
    pro?: number;
    premium?: number;
  };
}

export const FEATURES: Record<FeatureKey, FeatureConfig> = {
  // Core Features - Available to all
  todos: {
    name: 'Tasks & Todos',
    description: 'Unlimited task management',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  notes: {
    name: 'Notes',
    description: 'Personal notes and journaling',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  basic_expenses: {
    name: 'Expense Tracking',
    description: 'Track your expenses manually',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  basic_income: {
    name: 'Income Tracking',
    description: 'Track your income sources',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  basic_loans: {
    name: 'Loan Management',
    description: 'Track loans and EMIs',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  basic_insurance: {
    name: 'Insurance Tracking',
    description: 'Manage insurance policies',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  basic_documents: {
    name: 'Document Storage',
    description: 'Store important documents',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  basic_memory: {
    name: 'Memory Vault',
    description: 'Store photos and memories',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
    limit: { free: 2, pro: 10, premium: 100 }, // GB
  },
  lifespan_view: {
    name: 'Lifespan View',
    description: 'Visualize your life in weeks',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  family_tree: {
    name: 'Family Tree',
    description: 'Build your family tree',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },
  study_tracking: {
    name: 'Study Tracking',
    description: 'Track study progress and syllabus',
    plans: ['free', 'pro', 'premium', 'trial', 'lifetime'],
  },

  // Pro Features
  advanced_analytics: {
    name: 'Advanced Analytics',
    description: 'Deep financial insights and trends',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
  },
  tax_calculator: {
    name: 'Tax Calculator',
    description: 'Calculate taxes with deductions',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
  },
  unlimited_tax_calculations: {
    name: 'Unlimited Tax Calculations',
    description: 'No limits on tax calculations',
    plans: ['pro', 'premium', 'lifetime'],
    limit: { free: 3 }, // Free gets 3 per day
  },
  tax_pdf_reports: {
    name: 'Tax PDF Reports',
    description: 'Generate professional tax reports',
    plans: ['pro', 'premium', 'lifetime'],
  },
  regime_comparison: {
    name: 'Regime Comparison',
    description: 'Compare old vs new tax regime',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
  },
  taxyn_unlimited: {
    name: 'TAXYN AI Unlimited',
    description: 'Unlimited AI tax assistant queries',
    plans: ['pro', 'premium', 'lifetime'],
    limit: { free: 3 }, // Free gets 3 per day
  },
  financeflow_gmail: {
    name: 'FinanceFlow Gmail Import',
    description: 'Auto-import transactions from Gmail',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
    limit: { pro: 300, premium: 1500 }, // per month
  },
  priority_reminders: {
    name: 'Priority Reminders',
    description: 'Advanced reminder system',
    plans: ['pro', 'premium', 'lifetime'],
  },
  extended_storage: {
    name: 'Extended Storage',
    description: '10GB storage for documents',
    plans: ['pro', 'premium', 'lifetime'],
  },
  ocr_scanning: {
    name: 'OCR Scanning',
    description: 'Extract text from documents',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
    limit: { pro: 100, premium: 500 }, // per month
  },
  smart_categorization: {
    name: 'Smart Categorization',
    description: 'AI-powered expense categorization',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
  },
  ai_parsing: {
    name: 'AI Document Parsing',
    description: 'AI extraction from documents',
    plans: ['pro', 'premium', 'trial', 'lifetime'],
    limit: { pro: 500, premium: 3000 }, // per month
  },
  study_analytics: {
    name: 'Study Analytics',
    description: 'Advanced study statistics',
    plans: ['pro', 'premium', 'lifetime'],
  },
  explain_paragraph: {
    name: 'Explain Paragraph',
    description: 'AI paragraph explanations',
    plans: ['pro', 'premium', 'lifetime'],
  },
  ai_summaries: {
    name: 'AI Summaries',
    description: 'Chapter and book summaries',
    plans: ['pro', 'premium', 'lifetime'],
  },
  pdf_exports: {
    name: 'PDF Exports',
    description: 'Export premium PDF reports',
    plans: ['pro', 'premium', 'lifetime'],
  },
  vocabulary_unlimited: {
    name: 'Unlimited Vocabulary',
    description: 'No limits on saved words',
    plans: ['pro', 'premium', 'lifetime'],
  },

  // Premium Features
  unlimited_storage: {
    name: 'Unlimited Storage',
    description: '100GB storage for everything',
    plans: ['premium', 'lifetime'],
  },
  ai_insights: {
    name: 'AI Insights',
    description: 'Advanced AI-powered insights',
    plans: ['premium', 'lifetime'],
  },
  family_profiles: {
    name: 'Family Profiles',
    description: 'Manage family member profiles',
    plans: ['premium', 'lifetime'],
  },
  export_all_formats: {
    name: 'Export All Formats',
    description: 'Export data in all formats',
    plans: ['premium', 'lifetime'],
  },
  multi_year_tax: {
    name: 'Multi-Year Tax History',
    description: 'Tax records across years',
    plans: ['premium', 'lifetime'],
  },
  ca_consultation: {
    name: 'CA Consultation Credits',
    description: 'Access to CA consultations',
    plans: ['premium', 'lifetime'],
  },
  private_discord: {
    name: 'Private Discord',
    description: 'Access to private community',
    plans: ['premium', 'lifetime'],
  },
  founder_support: {
    name: 'Founder Support',
    description: 'Direct access to founders',
    plans: ['premium', 'lifetime'],
  },
  early_access: {
    name: 'Early Access',
    description: 'Early access to new features',
    plans: ['premium', 'lifetime'],
  },
};

export function canAccessFeature(plan: PlanType, feature: FeatureKey): boolean {
  const config = FEATURES[feature];
  if (!config) return false;
  return config.plans.includes(plan);
}

export function getFeatureLimit(
  plan: PlanType,
  feature: FeatureKey
): number | undefined {
  const config = FEATURES[feature];
  if (!config?.limit) return undefined;
  
  if (plan === 'lifetime') plan = 'premium';
  if (plan === 'trial') plan = 'pro';
  
  return config.limit[plan as 'free' | 'pro' | 'premium'];
}

export function getRequiredPlan(feature: FeatureKey): PlanType {
  const config = FEATURES[feature];
  if (!config) return 'premium';
  
  // Return the minimum required plan
  if (config.plans.includes('free')) return 'free';
  if (config.plans.includes('pro')) return 'pro';
  return 'premium';
}

// Feature groups for UI display
export const FEATURE_GROUPS = {
  core: [
    'todos',
    'notes',
    'basic_expenses',
    'basic_income',
    'basic_loans',
    'basic_insurance',
    'basic_documents',
    'basic_memory',
    'lifespan_view',
    'family_tree',
    'study_tracking',
  ] as FeatureKey[],
  
  pro: [
    'advanced_analytics',
    'tax_calculator',
    'unlimited_tax_calculations',
    'tax_pdf_reports',
    'regime_comparison',
    'taxyn_unlimited',
    'financeflow_gmail',
    'priority_reminders',
    'extended_storage',
    'ocr_scanning',
    'smart_categorization',
    'ai_parsing',
    'study_analytics',
    'explain_paragraph',
    'ai_summaries',
    'pdf_exports',
    'vocabulary_unlimited',
  ] as FeatureKey[],
  
  premium: [
    'unlimited_storage',
    'ai_insights',
    'family_profiles',
    'export_all_formats',
    'multi_year_tax',
    'ca_consultation',
    'private_discord',
    'founder_support',
    'early_access',
  ] as FeatureKey[],
};
