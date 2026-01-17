import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxCalculationResult {
  financial_year: string;
  regime: string;
  salary_income: number;
  house_property_income: number;
  business_income: number;
  capital_gains_income: number;
  other_income: number;
  gross_total_income: number;
  standard_deduction: number;
  chapter_via_deductions: number;
  total_deductions: number;
  deductions_breakdown: Record<string, number>;
  taxable_income: number;
  slab_breakdown: any[];
  tax_on_income: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  surcharge_rate: number;
  cess: number;
  total_tax_liability: number;
  effective_rate: number;
  alternate_regime_tax: number;
  savings_vs_alternate: number;
  is_optimal: boolean;
}

// Hardcoded tax rules for FY 2025-26 and FY 2026-27
function getTaxRules(financialYear: string, regime: 'old' | 'new') {
  const rules: Record<string, Record<string, any>> = {
    'FY2024_25': {
      'new': {
        standard_deduction: 50000,
        rebate_limit: 700000,
        rebate_max: 25000,
        allows_deductions: false,
        slabs: [
          { min: 0, max: 300000, rate: 0 },
          { min: 300000, max: 600000, rate: 5 },
          { min: 600000, max: 900000, rate: 10 },
          { min: 900000, max: 1200000, rate: 15 },
          { min: 1200000, max: 1500000, rate: 20 },
          { min: 1500000, max: null, rate: 30 },
        ],
      },
      'old': {
        standard_deduction: 50000,
        rebate_limit: 500000,
        rebate_max: 12500,
        allows_deductions: true,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 },
          { min: 1000000, max: null, rate: 30 },
        ],
      },
    },
    'FY2025_26': {
      'new': {
        standard_deduction: 75000,
        rebate_limit: 1200000,
        rebate_max: 60000,
        allows_deductions: false,
        slabs: [
          { min: 0, max: 400000, rate: 0 },
          { min: 400000, max: 800000, rate: 5 },
          { min: 800000, max: 1200000, rate: 10 },
          { min: 1200000, max: 1600000, rate: 15 },
          { min: 1600000, max: 2000000, rate: 20 },
          { min: 2000000, max: 2400000, rate: 25 },
          { min: 2400000, max: null, rate: 30 },
        ],
      },
      'old': {
        standard_deduction: 50000,
        rebate_limit: 500000,
        rebate_max: 12500,
        allows_deductions: true,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 },
          { min: 1000000, max: null, rate: 30 },
        ],
      },
    },
    'FY2026_27': {
      'new': {
        standard_deduction: 75000,
        rebate_limit: 1200000,
        rebate_max: 60000,
        allows_deductions: false,
        slabs: [
          { min: 0, max: 400000, rate: 0 },
          { min: 400000, max: 800000, rate: 5 },
          { min: 800000, max: 1200000, rate: 10 },
          { min: 1200000, max: 1600000, rate: 15 },
          { min: 1600000, max: 2000000, rate: 20 },
          { min: 2000000, max: 2400000, rate: 25 },
          { min: 2400000, max: null, rate: 30 },
        ],
      },
      'old': {
        standard_deduction: 50000,
        rebate_limit: 500000,
        rebate_max: 12500,
        allows_deductions: true,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 },
          { min: 1000000, max: null, rate: 30 },
        ],
      },
    },
  };
  return rules[financialYear]?.[regime] || null;
}

// Deduction limits
const DEDUCTION_LIMITS: Record<string, number | null> = {
  '80C': 150000,
  '80CCC': 150000,
  '80CCD1': 150000,
  '80CCD1B': 50000,
  '80CCD2': null, // 10% of salary, no fixed limit
  '80D': 75000,
  '80DD': 125000,
  '80DDB': 100000,
  '80E': null, // No limit
  '80EE': 50000,
  '80EEA': 150000,
  '80G': null, // Varies
  '80GG': 60000,
  '80TTA': 10000,
  '80TTB': 50000,
  '80U': 125000,
  '24B': 200000,
  'HRA': null, // Calculated
};

function calculateTaxForRegime(
  grossIncome: number,
  deductions: Record<string, number>,
  regime: 'old' | 'new',
  taxRules: any
): { tax: number; taxableIncome: number; slabBreakdown: any[]; rebate: number } {
  const standardDeduction = taxRules.standard_deduction;
  
  let chapterViaDeductions = 0;
  if (taxRules.allows_deductions) {
    for (const [section, amount] of Object.entries(deductions)) {
      const claimedAmount = Number(amount) || 0;
      if (claimedAmount > 0) {
        const limit = DEDUCTION_LIMITS[section];
        const allowed = limit !== null && limit !== undefined 
          ? Math.min(claimedAmount, limit) 
          : claimedAmount;
        chapterViaDeductions += allowed;
      }
    }
  }

  const totalDeductions = standardDeduction + chapterViaDeductions;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Calculate tax on slabs
  let taxOnIncome = 0;
  const slabBreakdown: any[] = [];
  let remainingIncome = taxableIncome;

  for (const slab of taxRules.slabs) {
    const minAmount = slab.min;
    const maxAmount = slab.max !== null ? slab.max : Infinity;
    const rate = slab.rate;

    if (remainingIncome <= 0) {
      slabBreakdown.push({
        slab_order: slabBreakdown.length + 1,
        min_amount: minAmount,
        max_amount: slab.max,
        rate_percentage: rate,
        taxable_in_slab: 0,
        tax_in_slab: 0,
      });
      continue;
    }

    const slabWidth = maxAmount === Infinity ? remainingIncome : maxAmount - minAmount;
    const taxableInSlab = Math.min(remainingIncome, slabWidth);
    const taxInSlab = Math.round((taxableInSlab * rate) / 100);

    slabBreakdown.push({
      slab_order: slabBreakdown.length + 1,
      min_amount: minAmount,
      max_amount: slab.max,
      rate_percentage: rate,
      taxable_in_slab: taxableInSlab,
      tax_in_slab: taxInSlab,
    });

    taxOnIncome += taxInSlab;
    remainingIncome -= taxableInSlab;
  }

  // Apply rebate 87A
  let rebate = 0;
  if (taxableIncome <= taxRules.rebate_limit && taxOnIncome > 0) {
    rebate = Math.min(taxOnIncome, taxRules.rebate_max);
  }

  const taxAfterRebate = Math.max(0, taxOnIncome - rebate);

  // Calculate surcharge
  let surchargeRate = 0;
  if (taxableIncome > 50000000) {
    surchargeRate = regime === 'new' ? 25 : 37;
  } else if (taxableIncome > 20000000) {
    surchargeRate = 25;
  } else if (taxableIncome > 10000000) {
    surchargeRate = 15;
  } else if (taxableIncome > 5000000) {
    surchargeRate = 10;
  }

  const surcharge = Math.round(taxAfterRebate * surchargeRate / 100);
  const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);
  const totalTax = taxAfterRebate + surcharge + cess;

  return { tax: totalTax, taxableIncome, slabBreakdown, rebate };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-full-calculation] Starting comprehensive tax calculation');

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

    const body = await req.json();
    const { 
      financial_year, 
      regime = 'new',
      incomes = [],
      deductions = {},
    } = body;

    // Get tax rules
    const taxRules = getTaxRules(financial_year, regime as 'old' | 'new');
    if (!taxRules) {
      return new Response(
        JSON.stringify({ error: `Tax rules not found for ${financial_year} ${regime} regime` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate income by type
    let salaryIncome = 0;
    let housePropertyIncome = 0;
    let businessIncome = 0;
    let capitalGainsIncome = 0;
    let otherIncome = 0;

    for (const income of incomes) {
      const amount = Number(income.gross_amount) || 0;
      switch (income.income_type) {
        case 'salary':
        case 'pension':
          salaryIncome += amount;
          break;
        case 'house_property':
        case 'rental':
          housePropertyIncome += amount;
          break;
        case 'business':
        case 'freelance':
          businessIncome += amount;
          break;
        case 'capital_gains_stcg':
        case 'capital_gains_ltcg':
          capitalGainsIncome += amount;
          break;
        default:
          otherIncome += amount;
      }
    }

    const grossTotalIncome = salaryIncome + housePropertyIncome + businessIncome + capitalGainsIncome + otherIncome;

    // Apply deductions
    const standardDeduction = taxRules.standard_deduction;
    let chapterViaDeductions = 0;
    const appliedDeductions: Record<string, number> = {};

    if (taxRules.allows_deductions) {
      for (const [section, amount] of Object.entries(deductions)) {
        const claimedAmount = Number(amount) || 0;
        if (claimedAmount > 0) {
          const limit = DEDUCTION_LIMITS[section];
          const allowed = limit !== null && limit !== undefined 
            ? Math.min(claimedAmount, limit) 
            : claimedAmount;
          appliedDeductions[section] = allowed;
          chapterViaDeductions += allowed;
        }
      }
    }

    const totalDeductions = standardDeduction + chapterViaDeductions;
    const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

    // Calculate tax on slabs
    let taxOnIncome = 0;
    const slabBreakdown: any[] = [];
    let remainingIncome = taxableIncome;

    for (const slab of taxRules.slabs) {
      const minAmount = slab.min;
      const maxAmount = slab.max !== null ? slab.max : Infinity;
      const rate = slab.rate;

      if (remainingIncome <= 0) {
        slabBreakdown.push({
          slab_order: slabBreakdown.length + 1,
          min_amount: minAmount,
          max_amount: slab.max,
          rate_percentage: rate,
          taxable_in_slab: 0,
          tax_in_slab: 0,
        });
        continue;
      }

      const slabWidth = maxAmount === Infinity ? remainingIncome : maxAmount - minAmount;
      const taxableInSlab = Math.min(remainingIncome, slabWidth);
      const taxInSlab = Math.round((taxableInSlab * rate) / 100);

      slabBreakdown.push({
        slab_order: slabBreakdown.length + 1,
        min_amount: minAmount,
        max_amount: slab.max,
        rate_percentage: rate,
        taxable_in_slab: taxableInSlab,
        tax_in_slab: taxInSlab,
      });

      taxOnIncome += taxInSlab;
      remainingIncome -= taxableInSlab;
    }

    // Apply rebate 87A
    let rebate87a = 0;
    if (taxableIncome <= taxRules.rebate_limit && taxOnIncome > 0) {
      rebate87a = Math.min(taxOnIncome, taxRules.rebate_max);
    }

    const taxAfterRebate = Math.max(0, taxOnIncome - rebate87a);

    // Calculate surcharge
    let surchargeRate = 0;
    if (taxableIncome > 50000000) {
      surchargeRate = regime === 'new' ? 25 : 37;
    } else if (taxableIncome > 20000000) {
      surchargeRate = 25;
    } else if (taxableIncome > 10000000) {
      surchargeRate = 15;
    } else if (taxableIncome > 5000000) {
      surchargeRate = 10;
    }

    const surcharge = Math.round(taxAfterRebate * surchargeRate / 100);
    const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);
    const totalTaxLiability = taxAfterRebate + surcharge + cess;
    const effectiveRate = grossTotalIncome > 0 
      ? Math.round((totalTaxLiability / grossTotalIncome) * 10000) / 100 
      : 0;

    // Calculate alternate regime for comparison
    const alternateRegime = regime === 'new' ? 'old' : 'new';
    const altTaxRules = getTaxRules(financial_year, alternateRegime as 'old' | 'new');
    
    let alternateTax = 0;
    if (altTaxRules) {
      const altResult = calculateTaxForRegime(grossTotalIncome, deductions, alternateRegime as 'old' | 'new', altTaxRules);
      alternateTax = altResult.tax;
    }

    const savingsVsAlternate = alternateTax - totalTaxLiability;
    const isOptimal = totalTaxLiability <= alternateTax;

    const result: TaxCalculationResult = {
      financial_year,
      regime,
      salary_income: salaryIncome,
      house_property_income: housePropertyIncome,
      business_income: businessIncome,
      capital_gains_income: capitalGainsIncome,
      other_income: otherIncome,
      gross_total_income: grossTotalIncome,
      standard_deduction: standardDeduction,
      chapter_via_deductions: chapterViaDeductions,
      total_deductions: totalDeductions,
      deductions_breakdown: appliedDeductions,
      taxable_income: taxableIncome,
      slab_breakdown: slabBreakdown,
      tax_on_income: taxOnIncome,
      rebate_87a: rebate87a,
      tax_after_rebate: taxAfterRebate,
      surcharge,
      surcharge_rate: surchargeRate,
      cess,
      total_tax_liability: totalTaxLiability,
      effective_rate: effectiveRate,
      alternate_regime_tax: alternateTax,
      savings_vs_alternate: savingsVsAlternate,
      is_optimal: isOptimal,
    };

    console.log('[tax-full-calculation] Calculation complete. Tax:', totalTaxLiability);

    return new Response(
      JSON.stringify({
        success: true,
        calculation: result,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-full-calculation] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
