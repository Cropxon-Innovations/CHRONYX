-- ============================================
-- CHRONYX Indian Income Tax Calculation Engine
-- API Schema Only - Database Tables
-- ============================================

-- Create api schema if not exists
CREATE SCHEMA IF NOT EXISTS api;

-- ============================================
-- 1. Tax Financial Years Table
-- ============================================
CREATE TABLE IF NOT EXISTS api.tax_financial_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'FY2025_26'
  display_name VARCHAR(50) NOT NULL, -- e.g., 'FY 2025-26'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- ============================================
-- 2. Tax Regimes Table
-- ============================================
CREATE TABLE IF NOT EXISTS api.tax_regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL, -- 'old' or 'new'
  display_name VARCHAR(50) NOT NULL,
  financial_year_id UUID NOT NULL REFERENCES api.tax_financial_years(id) ON DELETE CASCADE,
  allows_deductions BOOLEAN DEFAULT false,
  standard_deduction NUMERIC(12, 2) DEFAULT 0,
  rebate_limit NUMERIC(12, 2) DEFAULT 0, -- 87A rebate threshold
  rebate_max NUMERIC(12, 2) DEFAULT 0, -- Max rebate amount
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_regime_per_fy UNIQUE (code, financial_year_id)
);

-- ============================================
-- 3. Tax Slabs Table
-- ============================================
CREATE TABLE IF NOT EXISTS api.tax_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_id UUID NOT NULL REFERENCES api.tax_regimes(id) ON DELETE CASCADE,
  slab_order INTEGER NOT NULL,
  min_amount NUMERIC(14, 2) NOT NULL,
  max_amount NUMERIC(14, 2), -- NULL means no upper limit
  rate_percentage NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_slab_range CHECK (max_amount IS NULL OR max_amount > min_amount),
  CONSTRAINT unique_slab_order UNIQUE (regime_id, slab_order)
);

-- ============================================
-- 4. Tax Deduction Types Table
-- ============================================
CREATE TABLE IF NOT EXISTS api.tax_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year_id UUID NOT NULL REFERENCES api.tax_financial_years(id) ON DELETE CASCADE,
  section_code VARCHAR(20) NOT NULL, -- e.g., '80C', '80D', 'HRA'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  max_limit NUMERIC(12, 2),
  is_percentage_based BOOLEAN DEFAULT false,
  percentage_of_field VARCHAR(50), -- Field to calculate percentage from
  requires_proof BOOLEAN DEFAULT true,
  category VARCHAR(50), -- 'investment', 'medical', 'housing', etc.
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_deduction_per_fy UNIQUE (section_code, financial_year_id)
);

-- ============================================
-- 5. User Tax Calculations Table
-- ============================================
CREATE TABLE IF NOT EXISTS api.tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  financial_year_id UUID NOT NULL REFERENCES api.tax_financial_years(id) ON DELETE CASCADE,
  regime_code VARCHAR(20) NOT NULL,
  
  -- Income Details
  gross_income NUMERIC(14, 2) NOT NULL,
  standard_deduction NUMERIC(12, 2) DEFAULT 0,
  total_deductions NUMERIC(12, 2) DEFAULT 0,
  taxable_income NUMERIC(14, 2) NOT NULL,
  
  -- Tax Computation
  tax_before_rebate NUMERIC(12, 2) DEFAULT 0,
  rebate_87a NUMERIC(12, 2) DEFAULT 0,
  tax_after_rebate NUMERIC(12, 2) DEFAULT 0,
  surcharge NUMERIC(12, 2) DEFAULT 0,
  cess NUMERIC(12, 2) DEFAULT 0,
  total_tax NUMERIC(12, 2) NOT NULL,
  effective_rate NUMERIC(5, 2) DEFAULT 0,
  
  -- Detailed Breakdown (JSON)
  deductions_breakdown JSONB DEFAULT '{}',
  slab_breakdown JSONB DEFAULT '[]',
  comparison_data JSONB DEFAULT '{}',
  
  -- Metadata
  calculation_date TIMESTAMPTZ DEFAULT now(),
  is_final BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. Tax Documents Table (for Form 16, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS api.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  calculation_id UUID REFERENCES api.tax_calculations(id) ON DELETE SET NULL,
  financial_year_id UUID NOT NULL REFERENCES api.tax_financial_years(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'form_16', 'itr', 'tax_summary', etc.
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  metadata JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE api.tax_financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.tax_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies - Master Data (Read-only for all authenticated users)
-- ============================================
CREATE POLICY "Financial years readable by authenticated users"
  ON api.tax_financial_years FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Regimes readable by authenticated users"
  ON api.tax_regimes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Slabs readable by authenticated users"
  ON api.tax_slabs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Deductions readable by authenticated users"
  ON api.tax_deductions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- RLS Policies - User Data (User owns their data)
-- ============================================
CREATE POLICY "Users can view their own calculations"
  ON api.tax_calculations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations"
  ON api.tax_calculations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculations"
  ON api.tax_calculations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations"
  ON api.tax_calculations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own documents"
  ON api.tax_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON api.tax_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON api.tax_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Seed Data: Financial Years
-- ============================================
INSERT INTO api.tax_financial_years (code, display_name, start_date, end_date, is_active, is_current)
VALUES 
  ('FY2024_25', 'FY 2024-25', '2024-04-01', '2025-03-31', true, false),
  ('FY2025_26', 'FY 2025-26', '2025-04-01', '2026-03-31', true, true),
  ('FY2026_27', 'FY 2026-27', '2026-04-01', '2027-03-31', true, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Seed Data: Tax Regimes for FY 2025-26
-- ============================================
INSERT INTO api.tax_regimes (code, display_name, financial_year_id, allows_deductions, standard_deduction, rebate_limit, rebate_max, is_default)
SELECT 
  'old', 'Old Tax Regime', id, true, 50000, 500000, 12500, false
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (code, financial_year_id) DO NOTHING;

INSERT INTO api.tax_regimes (code, display_name, financial_year_id, allows_deductions, standard_deduction, rebate_limit, rebate_max, is_default)
SELECT 
  'new', 'New Tax Regime', id, false, 75000, 700000, 25000, true
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (code, financial_year_id) DO NOTHING;

-- ============================================
-- Seed Data: Tax Slabs for New Regime FY 2025-26
-- ============================================
WITH new_regime AS (
  SELECT r.id FROM api.tax_regimes r
  JOIN api.tax_financial_years fy ON r.financial_year_id = fy.id
  WHERE r.code = 'new' AND fy.code = 'FY2025_26'
)
INSERT INTO api.tax_slabs (regime_id, slab_order, min_amount, max_amount, rate_percentage)
SELECT id, 1, 0, 300000, 0 FROM new_regime
UNION ALL SELECT id, 2, 300000, 700000, 5 FROM new_regime
UNION ALL SELECT id, 3, 700000, 1000000, 10 FROM new_regime
UNION ALL SELECT id, 4, 1000000, 1200000, 15 FROM new_regime
UNION ALL SELECT id, 5, 1200000, 1500000, 20 FROM new_regime
UNION ALL SELECT id, 6, 1500000, NULL, 30 FROM new_regime
ON CONFLICT (regime_id, slab_order) DO NOTHING;

-- ============================================
-- Seed Data: Tax Slabs for Old Regime FY 2025-26
-- ============================================
WITH old_regime AS (
  SELECT r.id FROM api.tax_regimes r
  JOIN api.tax_financial_years fy ON r.financial_year_id = fy.id
  WHERE r.code = 'old' AND fy.code = 'FY2025_26'
)
INSERT INTO api.tax_slabs (regime_id, slab_order, min_amount, max_amount, rate_percentage)
SELECT id, 1, 0, 250000, 0 FROM old_regime
UNION ALL SELECT id, 2, 250000, 500000, 5 FROM old_regime
UNION ALL SELECT id, 3, 500000, 1000000, 20 FROM old_regime
UNION ALL SELECT id, 4, 1000000, NULL, 30 FROM old_regime
ON CONFLICT (regime_id, slab_order) DO NOTHING;

-- ============================================
-- Seed Data: Deduction Types for FY 2025-26
-- ============================================
INSERT INTO api.tax_deductions (financial_year_id, section_code, display_name, description, max_limit, category, sort_order)
SELECT id, '80C', 'Section 80C', 'PPF, ELSS, LIC, EPF, Home Loan Principal', 150000, 'investment', 1
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (section_code, financial_year_id) DO NOTHING;

INSERT INTO api.tax_deductions (financial_year_id, section_code, display_name, description, max_limit, category, sort_order)
SELECT id, '80CCD1B', 'NPS (80CCD1B)', 'Additional NPS contribution', 50000, 'investment', 2
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (section_code, financial_year_id) DO NOTHING;

INSERT INTO api.tax_deductions (financial_year_id, section_code, display_name, description, max_limit, category, sort_order)
SELECT id, '80D', 'Section 80D', 'Health Insurance Premium', 100000, 'medical', 3
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (section_code, financial_year_id) DO NOTHING;

INSERT INTO api.tax_deductions (financial_year_id, section_code, display_name, description, max_limit, category, sort_order)
SELECT id, '80E', 'Section 80E', 'Education Loan Interest', NULL, 'education', 4
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (section_code, financial_year_id) DO NOTHING;

INSERT INTO api.tax_deductions (financial_year_id, section_code, display_name, description, max_limit, category, sort_order)
SELECT id, '24B', 'Section 24(b)', 'Home Loan Interest', 200000, 'housing', 5
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (section_code, financial_year_id) DO NOTHING;

INSERT INTO api.tax_deductions (financial_year_id, section_code, display_name, description, max_limit, category, sort_order)
SELECT id, 'HRA', 'HRA Exemption', 'House Rent Allowance', NULL, 'housing', 6
FROM api.tax_financial_years WHERE code = 'FY2025_26'
ON CONFLICT (section_code, financial_year_id) DO NOTHING;

-- ============================================
-- Create updated_at trigger function if not exists
-- ============================================
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Add triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_tax_financial_years_updated_at ON api.tax_financial_years;
CREATE TRIGGER update_tax_financial_years_updated_at
  BEFORE UPDATE ON api.tax_financial_years
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_regimes_updated_at ON api.tax_regimes;
CREATE TRIGGER update_tax_regimes_updated_at
  BEFORE UPDATE ON api.tax_regimes
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_calculations_updated_at ON api.tax_calculations;
CREATE TRIGGER update_tax_calculations_updated_at
  BEFORE UPDATE ON api.tax_calculations
  FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();