import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxCalculationRequest {
  financial_year: string; // e.g., 'FY2025_26'
  regime: 'old' | 'new';
  gross_income: number;
  deductions?: Record<string, number>; // e.g., { '80C': 150000, '80D': 25000 }
  save_calculation?: boolean;
}

interface SlabBreakdown {
  slab_order: number;
  min_amount: number;
  max_amount: number | null;
  rate_percentage: number;
  taxable_in_slab: number;
  tax_in_slab: number;
}

interface TaxCalculationResult {
  financial_year: string;
  regime: string;
  gross_income: number;
  standard_deduction: number;
  total_deductions: number;
  deductions_breakdown: Record<string, number>;
  taxable_income: number;
  slab_breakdown: SlabBreakdown[];
  tax_before_rebate: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-calculate] Starting tax calculation request');

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('[tax-calculate] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with api schema
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client specifically for api schema
    const supabaseApi = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'api' }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[tax-calculate] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[tax-calculate] User authenticated:', user.id);

    // Parse request body
    const body: TaxCalculationRequest = await req.json();
    const { financial_year, regime, gross_income, deductions = {}, save_calculation = false } = body;

    console.log('[tax-calculate] Request params:', { financial_year, regime, gross_income, deductions });

    // Validate inputs
    if (!financial_year || !regime || gross_income === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: financial_year, regime, gross_income' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (gross_income < 0) {
      return new Response(
        JSON.stringify({ error: 'Gross income cannot be negative' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch financial year from DB (using api schema)
    const { data: fyData, error: fyError } = await supabaseApi
      .from('tax_financial_years')
      .select('*')
      .eq('code', financial_year)
      .eq('is_active', true)
      .single();

    if (fyError || !fyData) {
      console.error('[tax-calculate] FY not found:', fyError);
      return new Response(
        JSON.stringify({ error: `Financial year ${financial_year} not found or inactive` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[tax-calculate] Financial year found:', fyData.display_name);

    // Fetch regime details (using api schema)
    const { data: regimeData, error: regimeError } = await supabaseApi
      .from('tax_regimes')
      .select('*')
      .eq('code', regime)
      .eq('financial_year_id', fyData.id)
      .single();

    if (regimeError || !regimeData) {
      console.error('[tax-calculate] Regime not found:', regimeError);
      return new Response(
        JSON.stringify({ error: `Regime ${regime} not found for ${financial_year}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[tax-calculate] Regime found:', regimeData.display_name);

    // Fetch tax slabs for this regime (using api schema)
    const { data: slabsData, error: slabsError } = await supabaseApi
      .from('tax_slabs')
      .select('*')
      .eq('regime_id', regimeData.id)
      .order('slab_order', { ascending: true });

    if (slabsError || !slabsData || slabsData.length === 0) {
      console.error('[tax-calculate] Slabs not found:', slabsError);
      return new Response(
        JSON.stringify({ error: 'Tax slabs not configured for this regime' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[tax-calculate] Found', slabsData.length, 'tax slabs');

    // Fetch deduction limits if old regime (using api schema)
    let deductionLimits: Record<string, number | null> = {};
    if (regimeData.allows_deductions) {
      const { data: deductionsConfig, error: dedError } = await supabaseApi
        .from('tax_deductions')
        .select('*')
        .eq('financial_year_id', fyData.id);

      if (!dedError && deductionsConfig) {
        deductionsConfig.forEach((d: any) => {
          deductionLimits[d.section_code] = d.max_limit;
        });
      }
    }

    // ============================================
    // STEP 1: Calculate Standard Deduction
    // ============================================
    const standardDeduction = Number(regimeData.standard_deduction) || 0;
    let incomeAfterStdDeduction = Math.max(0, gross_income - standardDeduction);

    // ============================================
    // STEP 2: Calculate User Deductions (Old Regime Only)
    // ============================================
    let totalDeductions = 0;
    const appliedDeductions: Record<string, number> = {};

    if (regimeData.allows_deductions) {
      for (const [section, amount] of Object.entries(deductions)) {
        if (amount > 0) {
          const limit = deductionLimits[section];
          // Apply limit if exists, otherwise use full amount
          const appliedAmount = limit !== null && limit !== undefined 
            ? Math.min(amount, limit) 
            : amount;
          appliedDeductions[section] = appliedAmount;
          totalDeductions += appliedAmount;
        }
      }
    }

    // ============================================
    // STEP 3: Calculate Taxable Income
    // ============================================
    const taxableIncome = Math.max(0, incomeAfterStdDeduction - totalDeductions);

    console.log('[tax-calculate] Taxable income:', taxableIncome);

    // ============================================
    // STEP 4: Slab-by-Slab Tax Calculation
    // ============================================
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

      // Calculate how much income falls in this slab
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
    console.log('[tax-calculate] Tax before rebate:', taxBeforeRebate);

    // ============================================
    // STEP 5: Apply Section 87A Rebate
    // ============================================
    let rebate87a = 0;
    const rebateLimit = Number(regimeData.rebate_limit) || 0;
    const rebateMax = Number(regimeData.rebate_max) || 0;

    if (taxableIncome <= rebateLimit && taxBeforeRebate > 0) {
      rebate87a = Math.min(taxBeforeRebate, rebateMax);
    }

    const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87a);
    console.log('[tax-calculate] Tax after rebate:', taxAfterRebate);

    // ============================================
    // STEP 6: Calculate Surcharge (for high incomes)
    // ============================================
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

    // ============================================
    // STEP 7: Calculate Health & Education Cess (4%)
    // ============================================
    const taxWithSurcharge = taxAfterRebate + surcharge;
    const cess = Math.round(taxWithSurcharge * 0.04);

    // ============================================
    // STEP 8: Total Tax Payable
    // ============================================
    const totalTax = taxAfterRebate + surcharge + cess;

    // ============================================
    // STEP 9: Effective Tax Rate
    // ============================================
    const effectiveRate = gross_income > 0 
      ? Math.round((totalTax / gross_income) * 10000) / 100 
      : 0;

    console.log('[tax-calculate] Total tax:', totalTax, 'Effective rate:', effectiveRate);

    // Build result
    const result: TaxCalculationResult = {
      financial_year,
      regime,
      gross_income,
      standard_deduction: standardDeduction,
      total_deductions: totalDeductions,
      deductions_breakdown: appliedDeductions,
      taxable_income: taxableIncome,
      slab_breakdown: slabBreakdown,
      tax_before_rebate: taxBeforeRebate,
      rebate_87a: rebate87a,
      tax_after_rebate: taxAfterRebate,
      surcharge,
      cess,
      total_tax: totalTax,
      effective_rate: effectiveRate,
    };

    // ============================================
    // STEP 10: Save calculation if requested (using api schema)
    // ============================================
    if (save_calculation) {
      const { error: saveError } = await supabaseApi
        .from('tax_calculations')
        .insert({
          user_id: user.id,
          financial_year_id: fyData.id,
          regime_code: regime,
          gross_income,
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
          deductions_breakdown: appliedDeductions,
          slab_breakdown: slabBreakdown,
        });

      if (saveError) {
        console.error('[tax-calculate] Failed to save calculation:', saveError);
        // Don't fail the request, just log it
      } else {
        console.log('[tax-calculate] Calculation saved successfully');
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-calculate] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});