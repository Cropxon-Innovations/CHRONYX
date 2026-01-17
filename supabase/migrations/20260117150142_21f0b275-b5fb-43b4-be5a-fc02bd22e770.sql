-- ============================================
-- CHRONYX TAX ENGINE - CA-GRADE DATABASE SCHEMA
-- ============================================

-- 1. Tax Profiles - User tax preferences and settings
CREATE TABLE api.tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_regime TEXT DEFAULT 'new' CHECK (default_regime IN ('old', 'new')),
  pan_number TEXT,
  tan_number TEXT,
  residential_status TEXT DEFAULT 'resident' CHECK (residential_status IN ('resident', 'non_resident', 'rnor')),
  age_category TEXT DEFAULT 'below_60' CHECK (age_category IN ('below_60', '60_to_80', 'above_80')),
  employment_type TEXT DEFAULT 'salaried' CHECK (employment_type IN ('salaried', 'self_employed', 'business', 'retired', 'other')),
  employer_name TEXT,
  employer_tan TEXT,
  bank_account TEXT,
  ifsc_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Tax Incomes - All income sources for tax calculation
CREATE TABLE api.tax_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  income_type TEXT NOT NULL CHECK (income_type IN ('salary', 'house_property', 'business', 'capital_gains_stcg', 'capital_gains_ltcg', 'other_sources', 'interest', 'dividend', 'rental', 'freelance', 'pension', 'gift')),
  sub_type TEXT,
  description TEXT,
  gross_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  exemptions DECIMAL(15,2) DEFAULT 0,
  taxable_amount DECIMAL(15,2) GENERATED ALWAYS AS (gross_amount - exemptions) STORED,
  source_id UUID, -- Reference to income_entries, etc.
  source_type TEXT, -- 'income_entry', 'expense', 'manual'
  document_ref TEXT,
  document_url TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 1.00,
  is_verified BOOLEAN DEFAULT false,
  is_auto_detected BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tax User Deductions - User's claimed deductions
CREATE TABLE api.tax_user_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  deduction_id UUID REFERENCES api.tax_deductions(id),
  section_code TEXT NOT NULL,
  claimed_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  allowed_amount DECIMAL(15,2), -- Computed after validation
  source_id UUID, -- Reference to insurances, etc.
  source_type TEXT,
  document_ref TEXT,
  document_url TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 1.00,
  is_verified BOOLEAN DEFAULT false,
  is_auto_detected BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'partial')),
  validation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tax Rules Engine - Configurable rules per FY
CREATE TABLE api.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('slab', 'surcharge', 'cess', 'rebate', 'deduction_limit', 'exemption', 'threshold')),
  regime TEXT CHECK (regime IN ('old', 'new', 'both')),
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT,
  condition_json JSONB, -- For complex conditions
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),
  rate_percentage DECIMAL(5,2),
  fixed_amount DECIMAL(15,2),
  priority_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(financial_year_id, rule_type, rule_code, regime)
);

-- 5. Tax Calculations - Complete calculation snapshots
CREATE TABLE api.tax_calculations_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  calculation_type TEXT DEFAULT 'preview' CHECK (calculation_type IN ('preview', 'draft', 'final', 'amended')),
  regime_code TEXT NOT NULL CHECK (regime_code IN ('old', 'new')),
  
  -- Income Breakdown
  salary_income DECIMAL(15,2) DEFAULT 0,
  house_property_income DECIMAL(15,2) DEFAULT 0,
  business_income DECIMAL(15,2) DEFAULT 0,
  capital_gains_income DECIMAL(15,2) DEFAULT 0,
  other_income DECIMAL(15,2) DEFAULT 0,
  gross_total_income DECIMAL(15,2) DEFAULT 0,
  
  -- Deductions
  standard_deduction DECIMAL(15,2) DEFAULT 0,
  chapter_via_deductions DECIMAL(15,2) DEFAULT 0,
  deductions_breakdown JSONB,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  
  -- Tax Computation
  taxable_income DECIMAL(15,2) DEFAULT 0,
  tax_on_income DECIMAL(15,2) DEFAULT 0,
  slab_breakdown JSONB,
  rebate_87a DECIMAL(15,2) DEFAULT 0,
  tax_after_rebate DECIMAL(15,2) DEFAULT 0,
  surcharge DECIMAL(15,2) DEFAULT 0,
  surcharge_rate DECIMAL(5,2) DEFAULT 0,
  health_education_cess DECIMAL(15,2) DEFAULT 0,
  total_tax_liability DECIMAL(15,2) DEFAULT 0,
  
  -- TDS & Advance Tax
  tds_deducted DECIMAL(15,2) DEFAULT 0,
  advance_tax_paid DECIMAL(15,2) DEFAULT 0,
  self_assessment_tax DECIMAL(15,2) DEFAULT 0,
  total_tax_paid DECIMAL(15,2) DEFAULT 0,
  
  -- Final
  tax_payable DECIMAL(15,2) DEFAULT 0,
  refund_due DECIMAL(15,2) DEFAULT 0,
  effective_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Audit & Compliance
  audit_score INT DEFAULT 0,
  compliance_flags JSONB,
  warnings JSONB,
  
  -- Comparison
  compared_with_regime TEXT,
  savings_vs_other DECIMAL(15,2) DEFAULT 0,
  is_optimal_regime BOOLEAN DEFAULT false,
  
  -- Metadata
  calculation_version INT DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tax Recommendations - AI-powered suggestions
CREATE TABLE api.tax_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  calculation_id UUID REFERENCES api.tax_calculations_v2(id) ON DELETE CASCADE,
  
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('mandatory', 'optimization', 'risk_alert', 'compliance', 'planning')),
  category TEXT, -- 'deduction', 'regime', 'income', 'document', 'timing'
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  impact_amount DECIMAL(15,2),
  impact_description TEXT,
  confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  
  action_required BOOLEAN DEFAULT false,
  action_type TEXT, -- 'upload_document', 'confirm_data', 'switch_regime', 'add_deduction'
  action_label TEXT,
  action_completed BOOLEAN DEFAULT false,
  action_completed_at TIMESTAMPTZ,
  
  source_data JSONB, -- Reference to actual data that triggered this
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tax Audit Flags - Compliance and audit tracking
CREATE TABLE api.tax_audit_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  calculation_id UUID REFERENCES api.tax_calculations_v2(id) ON DELETE CASCADE,
  
  flag_type TEXT NOT NULL CHECK (flag_type IN ('missing_document', 'limit_exceeded', 'mismatch', 'high_risk', 'compliance', 'verification_needed')),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  
  title TEXT NOT NULL,
  description TEXT,
  affected_section TEXT, -- '80C', 'HRA', etc.
  affected_amount DECIMAL(15,2),
  
  resolution_required BOOLEAN DEFAULT false,
  resolution_action TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tax Filing Documents - All tax-related documents
CREATE TABLE api.tax_filing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  
  document_type TEXT NOT NULL CHECK (document_type IN ('form_16', 'form_16a', 'form_26as', 'ais', 'tis', 'investment_proof', 'rent_receipt', 'home_loan', 'insurance', 'bank_statement', 'salary_slip', 'itr_acknowledgement', 'other')),
  document_name TEXT NOT NULL,
  file_url TEXT,
  file_size INT,
  mime_type TEXT,
  
  extracted_data JSONB, -- Parsed data from document
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_confidence DECIMAL(3,2),
  
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tax Filings - ITR filing history
CREATE TABLE api.tax_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year_id UUID REFERENCES api.tax_financial_years(id),
  calculation_id UUID REFERENCES api.tax_calculations_v2(id),
  
  itr_type TEXT, -- 'ITR-1', 'ITR-2', 'ITR-3', etc.
  filing_type TEXT DEFAULT 'original' CHECK (filing_type IN ('original', 'revised', 'belated', 'updated')),
  
  filing_status TEXT DEFAULT 'draft' CHECK (filing_status IN ('draft', 'validated', 'submitted', 'processed', 'defective', 'completed')),
  
  -- Filing details
  acknowledgement_number TEXT,
  filing_date DATE,
  verification_status TEXT,
  verification_date DATE,
  
  -- ITR data snapshot
  itr_json JSONB,
  itr_xml TEXT,
  
  -- Generated documents
  preview_pdf_url TEXT,
  acknowledgement_pdf_url TEXT,
  
  -- User approval
  user_approved BOOLEAN DEFAULT false,
  user_approved_at TIMESTAMPTZ,
  user_signature TEXT, -- Digital signature reference
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE api.tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_user_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_calculations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_audit_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_filing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_filings ENABLE ROW LEVEL SECURITY;

-- Tax Profiles
CREATE POLICY "Users can manage their tax profile"
  ON api.tax_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Tax Incomes
CREATE POLICY "Users can manage their tax incomes"
  ON api.tax_incomes FOR ALL
  USING (auth.uid() = user_id);

-- Tax User Deductions
CREATE POLICY "Users can manage their deductions"
  ON api.tax_user_deductions FOR ALL
  USING (auth.uid() = user_id);

-- Tax Rules (read-only for all)
CREATE POLICY "Tax rules are readable by authenticated users"
  ON api.tax_rules FOR SELECT
  USING (auth.role() = 'authenticated');

-- Tax Calculations
CREATE POLICY "Users can manage their calculations"
  ON api.tax_calculations_v2 FOR ALL
  USING (auth.uid() = user_id);

-- Tax Recommendations
CREATE POLICY "Users can manage their recommendations"
  ON api.tax_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Tax Audit Flags
CREATE POLICY "Users can manage their audit flags"
  ON api.tax_audit_flags FOR ALL
  USING (auth.uid() = user_id);

-- Tax Filing Documents
CREATE POLICY "Users can manage their filing documents"
  ON api.tax_filing_documents FOR ALL
  USING (auth.uid() = user_id);

-- Tax Filings
CREATE POLICY "Users can manage their filings"
  ON api.tax_filings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_tax_incomes_user_fy ON api.tax_incomes(user_id, financial_year_id);
CREATE INDEX idx_tax_user_deductions_user_fy ON api.tax_user_deductions(user_id, financial_year_id);
CREATE INDEX idx_tax_calculations_user_fy ON api.tax_calculations_v2(user_id, financial_year_id);
CREATE INDEX idx_tax_recommendations_user_fy ON api.tax_recommendations(user_id, financial_year_id);
CREATE INDEX idx_tax_audit_flags_user_fy ON api.tax_audit_flags(user_id, financial_year_id);
CREATE INDEX idx_tax_filings_user_fy ON api.tax_filings(user_id, financial_year_id);
CREATE INDEX idx_tax_rules_fy_type ON api.tax_rules(financial_year_id, rule_type);

-- ============================================
-- SEED TAX RULES FOR FY 2025-26 & FY 2026-27
-- ============================================

-- Get FY IDs
DO $$
DECLARE
  fy_2025_id UUID;
  fy_2026_id UUID;
BEGIN
  SELECT id INTO fy_2025_id FROM api.tax_financial_years WHERE code = 'FY2025_26';
  SELECT id INTO fy_2026_id FROM api.tax_financial_years WHERE code = 'FY2026_27';

  -- Surcharge Rules for FY 2025-26
  INSERT INTO api.tax_rules (financial_year_id, rule_type, regime, rule_code, rule_name, min_amount, max_amount, rate_percentage, priority_order) VALUES
  (fy_2025_id, 'surcharge', 'both', 'SURCHARGE_50L_1CR', 'Surcharge 50L-1Cr', 5000000, 10000000, 10, 1),
  (fy_2025_id, 'surcharge', 'both', 'SURCHARGE_1CR_2CR', 'Surcharge 1Cr-2Cr', 10000000, 20000000, 15, 2),
  (fy_2025_id, 'surcharge', 'both', 'SURCHARGE_2CR_5CR', 'Surcharge 2Cr-5Cr', 20000000, 50000000, 25, 3),
  (fy_2025_id, 'surcharge', 'old', 'SURCHARGE_ABOVE_5CR', 'Surcharge Above 5Cr (Old)', 50000000, NULL, 37, 4),
  (fy_2025_id, 'surcharge', 'new', 'SURCHARGE_ABOVE_5CR', 'Surcharge Above 5Cr (New)', 50000000, NULL, 25, 4);

  -- Cess Rule
  INSERT INTO api.tax_rules (financial_year_id, rule_type, regime, rule_code, rule_name, rate_percentage, priority_order) VALUES
  (fy_2025_id, 'cess', 'both', 'HEALTH_EDU_CESS', 'Health & Education Cess', 4, 1);

  -- Deduction Limits for FY 2025-26
  INSERT INTO api.tax_rules (financial_year_id, rule_type, regime, rule_code, rule_name, max_amount, priority_order) VALUES
  (fy_2025_id, 'deduction_limit', 'old', '80C_LIMIT', 'Section 80C Limit', 150000, 1),
  (fy_2025_id, 'deduction_limit', 'old', '80CCD1B_LIMIT', 'NPS 80CCD(1B) Limit', 50000, 2),
  (fy_2025_id, 'deduction_limit', 'both', '80CCD2_LIMIT', 'Employer NPS 80CCD(2)', 750000, 3),
  (fy_2025_id, 'deduction_limit', 'old', '80D_SELF_LIMIT', '80D Self & Family', 25000, 4),
  (fy_2025_id, 'deduction_limit', 'old', '80D_SENIOR_LIMIT', '80D Senior Citizen', 50000, 5),
  (fy_2025_id, 'deduction_limit', 'old', '80D_PARENTS_LIMIT', '80D Parents', 25000, 6),
  (fy_2025_id, 'deduction_limit', 'old', '80D_PARENTS_SENIOR', '80D Parents Senior', 50000, 7),
  (fy_2025_id, 'deduction_limit', 'old', '24B_LIMIT', 'Home Loan Interest 24(b)', 200000, 8),
  (fy_2025_id, 'deduction_limit', 'old', '80E_LIMIT', 'Education Loan Interest', NULL, 9),
  (fy_2025_id, 'deduction_limit', 'old', '80G_LIMIT', 'Donations 80G', NULL, 10),
  (fy_2025_id, 'deduction_limit', 'old', '80TTA_LIMIT', 'Savings Interest 80TTA', 10000, 11),
  (fy_2025_id, 'deduction_limit', 'old', '80TTB_LIMIT', 'Senior Savings 80TTB', 50000, 12);

  -- Copy rules to FY 2026-27
  INSERT INTO api.tax_rules (financial_year_id, rule_type, regime, rule_code, rule_name, description, condition_json, min_amount, max_amount, rate_percentage, fixed_amount, priority_order)
  SELECT fy_2026_id, rule_type, regime, rule_code, rule_name, description, condition_json, min_amount, max_amount, rate_percentage, fixed_amount, priority_order
  FROM api.tax_rules WHERE financial_year_id = fy_2025_id;

END $$;

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_tax_profiles_updated_at
  BEFORE UPDATE ON api.tax_profiles
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_tax_incomes_updated_at
  BEFORE UPDATE ON api.tax_incomes
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_tax_user_deductions_updated_at
  BEFORE UPDATE ON api.tax_user_deductions
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_tax_calculations_v2_updated_at
  BEFORE UPDATE ON api.tax_calculations_v2
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_tax_filing_documents_updated_at
  BEFORE UPDATE ON api.tax_filing_documents
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

CREATE TRIGGER update_tax_filings_updated_at
  BEFORE UPDATE ON api.tax_filings
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();