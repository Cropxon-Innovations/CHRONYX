import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxCompareRequest {
  financial_year: string;
  gross_income: number;
  deductions?: Record<string, number>;
}

interface SlabBreakdown {
  slab_order: number;
  min_amount: number;
  max_amount: number | null;
  rate_percentage: number;
  taxable_in_slab: number;
  tax_in_slab: number;
}

interface RegimeResult {
  regime: string;
  display_name: string;
  gross_income: number;
  standard_deduction: number;
  total_deductions: number;
  taxable_income: number;
  tax_before_rebate: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
  slab_breakdown: SlabBreakdown[];
}

interface ComparisonResult {
  financial_year: string;
  gross_income: number;
  old_regime: RegimeResult;
  new_regime: RegimeResult;
  recommended_regime: 'old' | 'new';
  savings_amount: number;
  savings_percentage: number;
}

// Hardcoded tax rules for reliability
function getTaxRules(financialYear: string, regime: 'old' | 'new') {
  const rules: Record<string, Record<string, any>> = {
    'FY2025_26': {
      'new': {
        displayName: 'New Tax Regime',
        standardDeduction: 75000,
        allowsDeductions: false,
        rebateLimit: 700000,
        rebateMax: 25000,
        slabs: [
          { min: 0, max: 300000, rate: 0 },
          { min: 300000, max: 700000, rate: 5 },
          { min: 700000, max: 1000000, rate: 10 },
          { min: 1000000, max: 1200000, rate: 15 },
          { min: 1200000, max: 1500000, rate: 20 },
          { min: 1500000, max: null, rate: 30 },
        ],
        deductionLimits: {},
      },
      'old': {
        displayName: 'Old Tax Regime',
        standardDeduction: 50000,
        allowsDeductions: true,
        rebateLimit: 500000,
        rebateMax: 12500,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 },
          { min: 1000000, max: null, rate: 30 },
        ],
        deductionLimits: {
          '80C': 150000,
          '80CCC': 150000,
          '80CCD': 200000,
          '80D': 75000,
          '80E': null,
          '80G': null,
          '80TTA': 10000,
          '80TTB': 50000,
          'HRA': null,
          'LTA': null,
        },
      },
    },
    'FY2026_27': {
      'new': {
        displayName: 'New Tax Regime',
        standardDeduction: 75000,
        allowsDeductions: false,
        rebateLimit: 700000,
        rebateMax: 25000,
        slabs: [
          { min: 0, max: 300000, rate: 0 },
          { min: 300000, max: 700000, rate: 5 },
          { min: 700000, max: 1000000, rate: 10 },
          { min: 1000000, max: 1200000, rate: 15 },
          { min: 1200000, max: 1500000, rate: 20 },
          { min: 1500000, max: null, rate: 30 },
        ],
        deductionLimits: {},
      },
      'old': {
        displayName: 'Old Tax Regime',
        standardDeduction: 50000,
        allowsDeductions: true,
        rebateLimit: 500000,
        rebateMax: 12500,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 },
          { min: 1000000, max: null, rate: 30 },
        ],
        deductionLimits: {
          '80C': 150000,
          '80CCC': 150000,
          '80CCD': 200000,
          '80D': 75000,
          '80E': null,
          '80G': null,
          '80TTA': 10000,
          '80TTB': 50000,
          'HRA': null,
          'LTA': null,
        },
      },
    },
  };

  return rules[financialYear]?.[regime] || null;
}

// Calculate tax for a given regime
function calculateTaxForRegime(
  taxRules: any,
  regimeCode: string,
  grossIncome: number,
  userDeductions: Record<string, number>
): RegimeResult {
  // Standard deduction
  const standardDeduction = taxRules.standardDeduction;
  let incomeAfterStdDeduction = Math.max(0, grossIncome - standardDeduction);

  // User deductions (old regime only)
  let totalDeductions = 0;
  if (taxRules.allowsDeductions) {
    for (const [section, amount] of Object.entries(userDeductions)) {
      if (amount && (amount as number) > 0) {
        const limit = taxRules.deductionLimits[section];
        const appliedAmount = limit !== undefined && limit !== null 
          ? Math.min(amount as number, limit) 
          : amount as number;
        totalDeductions += appliedAmount;
      }
    }
  }

  // Taxable income
  const taxableIncome = Math.max(0, incomeAfterStdDeduction - totalDeductions);

  // Slab calculation
  let taxBeforeRebate = 0;
  const slabBreakdown: SlabBreakdown[] = [];
  let remainingIncome = taxableIncome;

  for (let i = 0; i < taxRules.slabs.length; i++) {
    const slab = taxRules.slabs[i];
    const minAmount = slab.min;
    const maxAmount = slab.max;
    const rate = slab.rate;

    if (remainingIncome <= 0) {
      slabBreakdown.push({
        slab_order: i + 1,
        min_amount: minAmount,
        max_amount: maxAmount,
        rate_percentage: rate,
        taxable_in_slab: 0,
        tax_in_slab: 0,
      });
      continue;
    }

    const slabWidth = maxAmount === null ? remainingIncome : maxAmount - minAmount;
    const taxableInSlab = Math.min(remainingIncome, slabWidth);
    const taxInSlab = (taxableInSlab * rate) / 100;

    slabBreakdown.push({
      slab_order: i + 1,
      min_amount: minAmount,
      max_amount: maxAmount,
      rate_percentage: rate,
      taxable_in_slab: taxableInSlab,
      tax_in_slab: Math.round(taxInSlab),
    });

    taxBeforeRebate += taxInSlab;
    remainingIncome -= taxableInSlab;
  }

  taxBeforeRebate = Math.round(taxBeforeRebate);

  // 87A rebate
  let rebate87a = 0;
  if (taxableIncome <= taxRules.rebateLimit && taxBeforeRebate > 0) {
    rebate87a = Math.min(taxBeforeRebate, taxRules.rebateMax);
  }

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87a);

  // Surcharge
  let surcharge = 0;
  if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
    surcharge = taxAfterRebate * 0.10;
  } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
    surcharge = taxAfterRebate * 0.15;
  } else if (taxableIncome > 20000000 && taxableIncome <= 50000000) {
    surcharge = taxAfterRebate * 0.25;
  } else if (taxableIncome > 50000000) {
    surcharge = taxAfterRebate * 0.37;
  }
  surcharge = Math.round(surcharge);

  // Cess
  const cess = Math.round((taxAfterRebate + surcharge) * 0.04);

  // Total tax
  const totalTax = taxAfterRebate + surcharge + cess;

  // Effective rate
  const effectiveRate = grossIncome > 0 
    ? Math.round((totalTax / grossIncome) * 10000) / 100 
    : 0;

  return {
    regime: regimeCode,
    display_name: taxRules.displayName,
    gross_income: grossIncome,
    standard_deduction: standardDeduction,
    total_deductions: totalDeductions,
    taxable_income: taxableIncome,
    tax_before_rebate: taxBeforeRebate,
    rebate_87a: rebate87a,
    tax_after_rebate: taxAfterRebate,
    surcharge,
    cess,
    total_tax: totalTax,
    effective_rate: effectiveRate,
    slab_breakdown: slabBreakdown,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-compare] Starting tax comparison request');

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: TaxCompareRequest = await req.json();
    const { financial_year, gross_income, deductions = {} } = body;

    console.log('[tax-compare] Request params:', { financial_year, gross_income, deductions });

    if (!financial_year || gross_income === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: financial_year, gross_income' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tax rules for both regimes
    const oldRegimeRules = getTaxRules(financial_year, 'old');
    const newRegimeRules = getTaxRules(financial_year, 'new');

    if (!oldRegimeRules || !newRegimeRules) {
      return new Response(
        JSON.stringify({ error: `Tax rules not configured for ${financial_year}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[tax-compare] Calculating for both regimes...');

    // Calculate for both regimes
    const oldRegimeResult = calculateTaxForRegime(oldRegimeRules, 'old', gross_income, deductions);
    const newRegimeResult = calculateTaxForRegime(newRegimeRules, 'new', gross_income, deductions);

    // Determine recommendation
    const savings = oldRegimeResult.total_tax - newRegimeResult.total_tax;
    const recommendedRegime: 'old' | 'new' = savings > 0 ? 'new' : 'old';
    const savingsAmount = Math.abs(savings);
    const savingsPercentage = gross_income > 0 
      ? Math.round((savingsAmount / gross_income) * 10000) / 100 
      : 0;

    const result: ComparisonResult = {
      financial_year,
      gross_income,
      old_regime: oldRegimeResult,
      new_regime: newRegimeResult,
      recommended_regime: recommendedRegime,
      savings_amount: savingsAmount,
      savings_percentage: savingsPercentage,
    };

    console.log('[tax-compare] Comparison complete. Recommended:', recommendedRegime, 'Savings:', savingsAmount);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-compare] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});