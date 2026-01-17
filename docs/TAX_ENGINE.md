# CHRONYX Tax Calculation Engine

## Overview

The CHRONYX Tax Calculation Engine provides comprehensive Indian Income Tax calculations with support for:
- Multiple Financial Years (FY 2024-25, 2025-26, 2026-27, and future-ready)
- Old & New Tax Regimes
- Transparent slab-by-slab breakdown
- Deductions optimization (Old Regime only)
- PDF-ready structured output

## Architecture

### Database Schema (api schema)

All tax-related tables are stored in the `api` schema for separation from the main `public` schema.

#### Tables

1. **api.tax_financial_years**
   - Stores financial year definitions
   - Fields: `code`, `display_name`, `start_date`, `end_date`, `is_current`, `is_active`

2. **api.tax_regimes**
   - Tax regime configurations per FY
   - Fields: `code` (old/new), `financial_year_id`, `display_name`, `standard_deduction`, `rebate_limit`, `rebate_max`, `allows_deductions`

3. **api.tax_slabs**
   - Tax slabs for each regime
   - Fields: `regime_id`, `slab_order`, `min_amount`, `max_amount`, `rate_percentage`

4. **api.tax_deductions**
   - Available deductions per FY
   - Fields: `financial_year_id`, `section_code`, `description`, `max_limit`

5. **api.tax_calculations**
   - User's saved calculations
   - Fields: User ID, all calculation details, timestamps

6. **api.tax_documents**
   - PDF export metadata
   - Fields: `calculation_id`, `file_url`, `generated_at`

### Edge Functions

#### 1. `tax-calculate`

Calculates tax for a single regime.

**Input:**
```json
{
  "financial_year": "FY2025_26",
  "regime": "old" | "new",
  "gross_income": 1200000,
  "deductions": {
    "80C": 150000,
    "80D": 25000
  },
  "save_calculation": true
}
```

**Output:**
```json
{
  "financial_year": "FY2025_26",
  "regime": "old",
  "gross_income": 1200000,
  "standard_deduction": 50000,
  "total_deductions": 175000,
  "deductions_breakdown": { "80C": 150000, "80D": 25000 },
  "taxable_income": 975000,
  "slab_breakdown": [...],
  "tax_before_rebate": 107500,
  "rebate_87a": 0,
  "tax_after_rebate": 107500,
  "surcharge": 0,
  "cess": 4300,
  "total_tax": 111800,
  "effective_rate": 9.32
}
```

#### 2. `tax-compare`

Compares Old vs New regime and recommends the better option.

**Input:**
```json
{
  "financial_year": "FY2025_26",
  "gross_income": 1200000,
  "deductions": {
    "80C": 150000,
    "80D": 25000
  }
}
```

**Output:**
```json
{
  "financial_year": "FY2025_26",
  "gross_income": 1200000,
  "old_regime": {...},
  "new_regime": {...},
  "recommended_regime": "new",
  "savings_amount": 15000,
  "savings_percentage": 1.25
}
```

#### 3. `tax-generate-pdf`

Generates a structured JSON for PDF export (stub for now).

## Calculation Logic

### Step-by-Step Process

1. **Fetch Financial Year** - Validate and get FY data from DB
2. **Fetch Regime** - Get regime configuration (standard deduction, rebate limits)
3. **Fetch Slabs** - Get tax slabs for the regime
4. **Apply Standard Deduction** - Subtract from gross income
5. **Apply User Deductions** (Old Regime only) - Honor limits from DB
6. **Calculate Taxable Income** - Gross - Standard - Deductions
7. **Slab-by-Slab Tax** - Calculate tax for each slab progressively
8. **Apply Section 87A Rebate** - If taxable income ≤ limit
9. **Calculate Surcharge** - For high incomes (>50L, 1Cr, 2Cr, 5Cr)
10. **Calculate Cess** - 4% Health & Education Cess
11. **Compute Total Tax** - Tax + Surcharge + Cess

### Surcharge Rates

| Taxable Income | Surcharge Rate |
|----------------|----------------|
| Up to ₹50L | 0% |
| ₹50L - ₹1Cr | 10% |
| ₹1Cr - ₹2Cr | 15% |
| ₹2Cr - ₹5Cr | 25% |
| Above ₹5Cr | 37% |

### Section 87A Rebate

- **Old Regime**: Up to ₹12,500 if taxable income ≤ ₹5L
- **New Regime**: Up to ₹25,000 if taxable income ≤ ₹7L

## UI Components

### Tax Dashboard (`/app/tax`)
- Financial Year selector
- Regime toggle (Old/New)
- Gross income input
- Deductions input (Old Regime)
- Calculate & Compare buttons
- Results display with slab breakdown
- TAXYN bot for inline questions

### Components

- `TaxCalculatorEngine` - Main calculator component
- `TaxynBot` - Inline tax assistant (Pro feature)
- `TaxLegalDisclaimer` - Legal notices
- `RegimeSavingsCard` - Old vs New comparison
- `MissedDeductionsCard` - Deduction suggestions

## Security

- All tables have RLS enabled
- User data is scoped by `auth.uid() = user_id`
- Edge functions verify JWT tokens
- Service role key only used server-side

## Future Roadmap

1. **Phase 2**: Form-16 PDF parsing
2. **Phase 3**: Capital gains (STCG/LTCG)
3. **Phase 4**: Business income (44AD/44ADA)
4. **Phase 5**: Rental income logic
5. **Phase 6**: Multi-FY comparison
6. **Phase 7**: Audit-ready PDF export

## Legal Disclaimer

CHRONYX provides tax calculations and informational insights based on user-provided data and publicly available tax rules. CHRONYX is not a Chartered Accountant (CA) and does not provide legal or professional tax advice. Users are advised to consult a qualified tax professional before filing official tax returns.
