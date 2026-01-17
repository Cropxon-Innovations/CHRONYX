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

// Helper function to calculate tax for a regime
async function calculateTaxForRegime(
  supabase: any,
  fyData: any,
  regimeCode: string,
  grossIncome: number,
  userDeductions: Record<string, number>
): Promise<RegimeResult> {
  // Fetch regime details
  const { data: regimeData, error: regimeError } = await supabase
    .from('tax_regimes')
    .select('*')
    .eq('code', regimeCode)
    .eq('financial_year_id', fyData.id)
    .single();

  if (regimeError || !regimeData) {
    throw new Error(`Regime ${regimeCode} not found`);
  }

  // Fetch tax slabs
  const { data: slabsData, error: slabsError } = await supabase
    .from('tax_slabs')
    .select('*')
    .eq('regime_id', regimeData.id)
    .order('slab_order', { ascending: true });

  if (slabsError || !slabsData || slabsData.length === 0) {
    throw new Error('Tax slabs not configured');
  }

  // Fetch deduction limits
  let deductionLimits: Record<string, number | null> = {};
  if (regimeData.allows_deductions) {
    const { data: deductionsConfig } = await supabase
      .from('tax_deductions')
      .select('*')
      .eq('financial_year_id', fyData.id);

    if (deductionsConfig) {
      deductionsConfig.forEach((d: any) => {
        deductionLimits[d.section_code] = d.max_limit;
      });
    }
  }

  // Calculate standard deduction
  const standardDeduction = Number(regimeData.standard_deduction) || 0;
  let incomeAfterStdDeduction = Math.max(0, grossIncome - standardDeduction);

  // Calculate user deductions (old regime only)
  let totalDeductions = 0;
  if (regimeData.allows_deductions) {
    for (const [section, amount] of Object.entries(userDeductions)) {
      if (amount > 0) {
        const limit = deductionLimits[section];
        const appliedAmount = limit !== null && limit !== undefined 
          ? Math.min(amount, limit) 
          : amount;
        totalDeductions += appliedAmount;
      }
    }
  }

  // Calculate taxable income
  const taxableIncome = Math.max(0, incomeAfterStdDeduction - totalDeductions);

  // Slab-by-slab calculation
  let taxBeforeRebate = 0;
  const slabBreakdown: SlabBreakdown[] = [];
  let remainingIncome = taxableIncome;

  for (const slab of slabsData) {
    const minAmount = Number(slab.min_amount);
    const maxAmount = slab.max_amount !== null ? Number(slab.max_amount) : Infinity;
    const rate = Number(slab.rate_percentage);

    if (remainingIncome <= 0) {
      slabBreakdown.push({
        slab_order: slab.slab_order,
        min_amount: minAmount,
        max_amount: slab.max_amount,
        rate_percentage: rate,
        taxable_in_slab: 0,
        tax_in_slab: 0,
      });
      continue;
    }

    const slabWidth = maxAmount === Infinity ? remainingIncome : maxAmount - minAmount;
    const taxableInSlab = Math.min(remainingIncome, slabWidth);
    const taxInSlab = (taxableInSlab * rate) / 100;

    slabBreakdown.push({
      slab_order: slab.slab_order,
      min_amount: minAmount,
      max_amount: slab.max_amount,
      rate_percentage: rate,
      taxable_in_slab: taxableInSlab,
      tax_in_slab: Math.round(taxInSlab),
    });

    taxBeforeRebate += taxInSlab;
    remainingIncome -= taxableInSlab;
  }

  taxBeforeRebate = Math.round(taxBeforeRebate);

  // Apply 87A rebate
  let rebate87a = 0;
  const rebateLimit = Number(regimeData.rebate_limit) || 0;
  const rebateMax = Number(regimeData.rebate_max) || 0;

  if (taxableIncome <= rebateLimit && taxBeforeRebate > 0) {
    rebate87a = Math.min(taxBeforeRebate, rebateMax);
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
    display_name: regimeData.display_name,
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

    if (!financial_year || gross_income === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: financial_year, gross_income' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch financial year
    const { data: fyData, error: fyError } = await supabase
      .from('tax_financial_years')
      .select('*')
      .eq('code', financial_year)
      .eq('is_active', true)
      .single();

    if (fyError || !fyData) {
      return new Response(
        JSON.stringify({ error: `Financial year ${financial_year} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[tax-compare] Calculating for both regimes...');

    // Calculate for both regimes
    const [oldRegimeResult, newRegimeResult] = await Promise.all([
      calculateTaxForRegime(supabase, fyData, 'old', gross_income, deductions),
      calculateTaxForRegime(supabase, fyData, 'new', gross_income, deductions),
    ]);

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