-- =====================================================
-- TAXYN: Comprehensive Indian Tax Computation System
-- =====================================================

-- 1. TAX PROFILES - One record per user per assessment year
CREATE TABLE public.tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  assessment_year TEXT NOT NULL,              -- e.g. '2026-27'
  financial_year TEXT NOT NULL,               -- e.g. '2025-26'
  regime_selected TEXT DEFAULT 'auto',        -- 'old' | 'new' | 'auto'
  
  pan TEXT,
  aadhaar_linked BOOLEAN DEFAULT FALSE,
  employer_name TEXT,
  employer_tan TEXT,
  
  residential_status TEXT DEFAULT 'resident', -- 'resident' | 'non-resident' | 'rnor'
  age_category TEXT DEFAULT 'below_60',       -- 'below_60' | '60_to_80' | 'above_80'
  
  form16_uploaded BOOLEAN DEFAULT FALSE,
  form16_url TEXT,
  
  is_locked BOOLEAN DEFAULT FALSE,            -- Lock after filing
  filed_at TIMESTAMPTZ,
  acknowledgement_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, assessment_year)
);

-- 2. INCOME COMPONENTS - Every income item, normalized
CREATE TABLE public.income_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  
  source_type TEXT NOT NULL,          -- 'salary' | 'bonus' | 'arrears' | 'interest' | 'rent' | 'capital_gains' | 'other'
  employer_name TEXT,
  tan TEXT,
  
  component_name TEXT NOT NULL,       -- 'Basic Salary', 'HRA', 'LTA', 'Special Allowance', etc.
  gross_amount NUMERIC(14,2) DEFAULT 0,
  
  exemption_section TEXT,             -- e.g. '10(13A)' for HRA
  exemption_applied NUMERIC(14,2) DEFAULT 0,
  taxable_amount NUMERIC(14,2) DEFAULT 0,
  
  is_auto_detected BOOLEAN DEFAULT FALSE,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  user_confirmed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DEDUCTIONS - All Chapter VI-A and other deductions
CREATE TABLE public.tax_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  
  section_code TEXT NOT NULL,         -- '80C', '80D', '80E', '80G', '80CCD1B', '24B', 'HRA', 'LTA'
  description TEXT,
  
  claimed_amount NUMERIC(14,2) DEFAULT 0,
  allowed_amount NUMERIC(14,2) DEFAULT 0,
  max_limit NUMERIC(14,2),
  
  regime_applicable TEXT DEFAULT 'old', -- 'old' | 'new' | 'both'
  
  document_required BOOLEAN DEFAULT TRUE,
  document_uploaded BOOLEAN DEFAULT FALSE,
  document_url TEXT,
  
  is_auto_detected BOOLEAN DEFAULT FALSE,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TAX COMPUTATIONS - Versioned calculation ledger
CREATE TABLE public.tax_computations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  
  computation_version INT DEFAULT 1,
  regime_used TEXT NOT NULL,          -- 'old' | 'new'
  is_optimal BOOLEAN DEFAULT FALSE,
  
  -- Income Breakdown
  gross_salary NUMERIC(14,2) DEFAULT 0,
  other_income NUMERIC(14,2) DEFAULT 0,
  gross_total_income NUMERIC(14,2) DEFAULT 0,
  
  -- Deductions
  standard_deduction NUMERIC(14,2) DEFAULT 0,
  professional_tax NUMERIC(14,2) DEFAULT 0,
  total_exemptions NUMERIC(14,2) DEFAULT 0,
  total_deductions NUMERIC(14,2) DEFAULT 0,
  
  -- Tax Calculation
  taxable_income NUMERIC(14,2) DEFAULT 0,
  slab_tax NUMERIC(14,2) DEFAULT 0,
  surcharge NUMERIC(14,2) DEFAULT 0,
  cess NUMERIC(14,2) DEFAULT 0,
  rebate_87a NUMERIC(14,2) DEFAULT 0,
  
  total_tax_liability NUMERIC(14,2) DEFAULT 0,
  effective_rate NUMERIC(5,2) DEFAULT 0,
  
  -- TDS & Payments
  tds_paid NUMERIC(14,2) DEFAULT 0,
  advance_tax_paid NUMERIC(14,2) DEFAULT 0,
  self_assessment_tax NUMERIC(14,2) DEFAULT 0,
  
  -- Final Result
  refund_or_payable NUMERIC(14,2) DEFAULT 0,
  
  -- Comparison
  alternate_regime_tax NUMERIC(14,2),
  savings_vs_alternate NUMERIC(14,2),
  
  -- Audit Score
  audit_score INT DEFAULT 100,
  risk_level TEXT DEFAULT 'low',      -- 'low' | 'medium' | 'high'
  
  -- Explanation JSON for TAXYN Bot
  computation_breakdown JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TAX DOCUMENTS - Compliance proofs
CREATE TABLE public.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL,        -- 'Form16', 'Form16A', 'RentReceipt', 'Insurance', 'ELSS', 'HomeLoan', 'Other'
  section_code TEXT,                  -- Linked deduction section
  
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  
  extracted_data JSONB,               -- OCR extracted data
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TAX AUDIT LOG - Legal defensibility trail
CREATE TABLE public.tax_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL,          -- 'create' | 'update' | 'delete' | 'compute' | 'file'
  entity_type TEXT NOT NULL,          -- 'income' | 'deduction' | 'computation' | 'document'
  entity_id UUID,
  
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  
  changed_by TEXT DEFAULT 'user',     -- 'user' | 'system' | 'taxyn_bot' | 'form16_ocr'
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TAX SLABS - Assessment year aware
CREATE TABLE public.tax_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_year TEXT NOT NULL,
  regime TEXT NOT NULL,               -- 'old' | 'new'
  
  min_income NUMERIC(14,2) NOT NULL,
  max_income NUMERIC(14,2),           -- NULL for unlimited
  
  rate NUMERIC(5,4) NOT NULL,         -- 0.05, 0.10, 0.20, 0.30
  
  rebate_applicable BOOLEAN DEFAULT FALSE,
  surcharge_applicable BOOLEAN DEFAULT FALSE,
  
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DEDUCTION RULES - Data-driven deduction limits
CREATE TABLE public.deduction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_year TEXT NOT NULL,
  
  section_code TEXT NOT NULL,         -- '80C', '80D', '80CCD1B', '24B', 'HRA', 'LTA'
  section_name TEXT NOT NULL,
  description TEXT,
  
  regime_applicable TEXT NOT NULL,    -- 'old' | 'new' | 'both'
  
  max_limit NUMERIC(14,2),
  calculation_type TEXT DEFAULT 'fixed', -- 'fixed' | 'percentage' | 'conditional' | 'formula'
  calculation_formula TEXT,           -- For complex rules
  
  age_limit_applies BOOLEAN DEFAULT FALSE,
  senior_limit NUMERIC(14,2),         -- Higher limit for seniors
  super_senior_limit NUMERIC(14,2),
  
  conditions JSONB,                   -- Eligibility conditions
  
  document_required BOOLEAN DEFAULT TRUE,
  document_types TEXT[],              -- Accepted document types
  
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. EXEMPTION RULES - HRA, LTA, etc.
CREATE TABLE public.exemption_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_year TEXT NOT NULL,
  
  exemption_type TEXT NOT NULL,       -- 'HRA', 'LTA', 'StandardDeduction'
  section_reference TEXT,             -- e.g. '10(13A)'
  description TEXT,
  
  regime_applicable TEXT NOT NULL,    -- 'old' | 'new' | 'both'
  
  calculation_type TEXT NOT NULL,     -- 'fixed' | 'formula' | 'least_of'
  calculation_formula TEXT,
  max_limit NUMERIC(14,2),
  
  conditions JSONB,
  
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TAX FILING RECORDS - Track all filings
CREATE TABLE public.tax_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  computation_id UUID REFERENCES public.tax_computations(id),
  
  filing_type TEXT NOT NULL,          -- 'self' | 'chronyx_assisted'
  filing_status TEXT DEFAULT 'draft', -- 'draft' | 'submitted' | 'verified' | 'filed' | 'rejected'
  
  itr_form TEXT,                      -- 'ITR-1', 'ITR-2', etc.
  acknowledgement_number TEXT,
  filing_date TIMESTAMPTZ,
  
  -- User Consent (CRITICAL for legal protection)
  user_consent BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  consent_ip TEXT,
  
  -- Fees
  filing_fee NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT,
  payment_id TEXT,
  
  -- Documents
  itr_pdf_url TEXT,
  computation_pdf_url TEXT,
  itrv_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_computations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deduction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemption_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Tax Profiles
CREATE POLICY "Users can view their own tax profiles" ON public.tax_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tax profiles" ON public.tax_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tax profiles" ON public.tax_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tax profiles" ON public.tax_profiles FOR DELETE USING (auth.uid() = user_id);

-- Income Components (via tax_profile ownership)
CREATE POLICY "Users can view their income components" ON public.income_components FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can create income components" ON public.income_components FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can update income components" ON public.income_components FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete income components" ON public.income_components FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));

-- Tax Deductions
CREATE POLICY "Users can view their deductions" ON public.tax_deductions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can create deductions" ON public.tax_deductions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can update deductions" ON public.tax_deductions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete deductions" ON public.tax_deductions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));

-- Tax Computations
CREATE POLICY "Users can view their computations" ON public.tax_computations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can create computations" ON public.tax_computations FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can update computations" ON public.tax_computations FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));

-- Tax Documents
CREATE POLICY "Users can view their tax documents" ON public.tax_documents FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can upload tax documents" ON public.tax_documents FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete tax documents" ON public.tax_documents FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));

-- Tax Audit Log (read-only for users, system writes)
CREATE POLICY "Users can view their audit log" ON public.tax_audit_log FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));

-- Tax Slabs (public read)
CREATE POLICY "Anyone can view tax slabs" ON public.tax_slabs FOR SELECT USING (true);

-- Deduction Rules (public read)
CREATE POLICY "Anyone can view deduction rules" ON public.deduction_rules FOR SELECT USING (true);

-- Exemption Rules (public read)
CREATE POLICY "Anyone can view exemption rules" ON public.exemption_rules FOR SELECT USING (true);

-- Tax Filings
CREATE POLICY "Users can view their filings" ON public.tax_filings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can create filings" ON public.tax_filings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));
CREATE POLICY "Users can update filings" ON public.tax_filings FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.tax_profiles WHERE id = tax_profile_id AND user_id = auth.uid()));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_tax_profiles_user_year ON public.tax_profiles(user_id, assessment_year);
CREATE INDEX idx_income_components_profile ON public.income_components(tax_profile_id);
CREATE INDEX idx_tax_deductions_profile ON public.tax_deductions(tax_profile_id);
CREATE INDEX idx_tax_computations_profile ON public.tax_computations(tax_profile_id);
CREATE INDEX idx_tax_documents_profile ON public.tax_documents(tax_profile_id);
CREATE INDEX idx_tax_audit_log_profile ON public.tax_audit_log(tax_profile_id);
CREATE INDEX idx_tax_slabs_year_regime ON public.tax_slabs(assessment_year, regime);
CREATE INDEX idx_deduction_rules_year ON public.deduction_rules(assessment_year);
CREATE INDEX idx_exemption_rules_year ON public.exemption_rules(assessment_year);
CREATE INDEX idx_tax_filings_profile ON public.tax_filings(tax_profile_id);

-- =====================================================
-- UPDATE TRIGGER FOR tax_profiles
-- =====================================================

CREATE TRIGGER update_tax_profiles_updated_at
  BEFORE UPDATE ON public.tax_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_filings_updated_at
  BEFORE UPDATE ON public.tax_filings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();