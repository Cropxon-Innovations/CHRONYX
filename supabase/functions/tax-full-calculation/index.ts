import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxCalculationResult {
  financial_year: string;
  regime: string;
  
  // Income
  salary_income: number;
  house_property_income: number;
  business_income: number;
  capital_gains_income: number;
  other_income: number;
  gross_total_income: number;
  
  // Deductions
  standard_deduction: number;
  chapter_via_deductions: number;
  total_deductions: number;
  deductions_breakdown: Record<string, number>;
  
  // Tax
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
  
  // Comparison
  alternate_regime_tax: number;
  savings_vs_alternate: number;
  is_optimal: boolean;
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
    const supabaseApi = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'api' }
    });

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
      save_calculation = false,
    } = body;

    // Get FY data
    const { data: fyData, error: fyError } = await supabaseApi
      .from('tax_financial_years')
      .select('*')
      .eq('code', financial_year)
      .eq('is_active', true)
      .single();

    if (fyError || !fyData) {
      return new Response(
        JSON.stringify({ error: 'Financial year not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get regime data
    const { data: regimeData, error: regimeError } = await supabaseApi
      .from('tax_regimes')
      .select('*')
      .eq('code', regime)
      .eq('financial_year_id', fyData.id)
      .single();

    if (regimeError || !regimeData) {
      return new Response(
        JSON.stringify({ error: 'Regime not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tax slabs
    const { data: slabs } = await supabaseApi
      .from('tax_slabs')
      .select('*')
      .eq('regime_id', regimeData.id)
      .order('slab_order', { ascending: true });

    if (!slabs || slabs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tax slabs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // STEP 1: Calculate Gross Total Income
    // ============================================
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

    // ============================================
    // STEP 2: Apply Deductions
    // ============================================
    const standardDeduction = Number(regimeData.standard_deduction) || 0;
    
    // Get deduction limits
    const { data: deductionLimits } = await supabaseApi
      .from('tax_deductions')
      .select('*')
      .eq('financial_year_id', fyData.id);

    const limitsMap: Record<string, number | null> = {};
    deductionLimits?.forEach((d: any) => {
      limitsMap[d.section_code] = d.max_limit;
    });

    let chapterViaDeductions = 0;
    const appliedDeductions: Record<string, number> = {};

    if (regimeData.allows_deductions) {
      for (const [section, amount] of Object.entries(deductions)) {
        const claimedAmount = Number(amount) || 0;
        if (claimedAmount > 0) {
          const limit = limitsMap[section];
          const allowed = limit !== null && limit !== undefined 
            ? Math.min(claimedAmount, limit) 
            : claimedAmount;
          appliedDeductions[section] = allowed;
          chapterViaDeductions += allowed;
        }
      }
    }

    const totalDeductions = standardDeduction + chapterViaDeductions;

    // ============================================
    // STEP 3: Calculate Taxable Income
    // ============================================
    const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

    // ============================================
    // STEP 4: Calculate Tax on Slabs
    // ============================================
    let taxOnIncome = 0;
    const slabBreakdown: any[] = [];
    let remainingIncome = taxableIncome;

    for (const slab of slabs) {
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
      const taxInSlab = Math.round((taxableInSlab * rate) / 100);

      slabBreakdown.push({
        slab_order: slab.slab_order,
        min_amount: minAmount,
        max_amount: slab.max_amount,
        rate_percentage: rate,
        taxable_in_slab: taxableInSlab,
        tax_in_slab: taxInSlab,
      });

      taxOnIncome += taxInSlab;
      remainingIncome -= taxableInSlab;
    }

    // ============================================
    // STEP 5: Apply Rebate 87A
    // ============================================
    const rebateLimit = Number(regimeData.rebate_limit) || 0;
    const rebateMax = Number(regimeData.rebate_max) || 0;
    let rebate87a = 0;

    if (taxableIncome <= rebateLimit && taxOnIncome > 0) {
      rebate87a = Math.min(taxOnIncome, rebateMax);
    }

    const taxAfterRebate = Math.max(0, taxOnIncome - rebate87a);

    // ============================================
    // STEP 6: Calculate Surcharge
    // ============================================
    let surcharge = 0;
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

    surcharge = Math.round(taxAfterRebate * surchargeRate / 100);

    // ============================================
    // STEP 7: Calculate Cess
    // ============================================
    const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);

    // ============================================
    // STEP 8: Total Tax Liability
    // ============================================
    const totalTaxLiability = taxAfterRebate + surcharge + cess;
    const effectiveRate = grossTotalIncome > 0 
      ? Math.round((totalTaxLiability / grossTotalIncome) * 10000) / 100 
      : 0;

    // ============================================
    // STEP 9: Calculate Alternate Regime for Comparison
    // ============================================
    const alternateRegime = regime === 'new' ? 'old' : 'new';
    const { data: altRegimeData } = await supabaseApi
      .from('tax_regimes')
      .select('*')
      .eq('code', alternateRegime)
      .eq('financial_year_id', fyData.id)
      .single();

    let alternateTax = 0;
    if (altRegimeData) {
      const { data: altSlabs } = await supabaseApi
        .from('tax_slabs')
        .select('*')
        .eq('regime_id', altRegimeData.id)
        .order('slab_order', { ascending: true });

      if (altSlabs) {
        const altStdDed = Number(altRegimeData.standard_deduction) || 0;
        const altDeductions = altRegimeData.allows_deductions ? chapterViaDeductions : 0;
        const altTaxableIncome = Math.max(0, grossTotalIncome - altStdDed - altDeductions);
        
        let altTaxOnIncome = 0;
        let altRemaining = altTaxableIncome;

        for (const slab of altSlabs) {
          if (altRemaining <= 0) break;
          const minAmt = Number(slab.min_amount);
          const maxAmt = slab.max_amount !== null ? Number(slab.max_amount) : Infinity;
          const rate = Number(slab.rate_percentage);
          const slabWidth = maxAmt === Infinity ? altRemaining : maxAmt - minAmt;
          const taxableInSlab = Math.min(altRemaining, slabWidth);
          altTaxOnIncome += Math.round((taxableInSlab * rate) / 100);
          altRemaining -= taxableInSlab;
        }

        // Apply rebate
        const altRebateLimit = Number(altRegimeData.rebate_limit) || 0;
        const altRebateMax = Number(altRegimeData.rebate_max) || 0;
        let altRebate = 0;
        if (altTaxableIncome <= altRebateLimit) {
          altRebate = Math.min(altTaxOnIncome, altRebateMax);
        }
        const altTaxAfterRebate = Math.max(0, altTaxOnIncome - altRebate);

        // Surcharge
        let altSurchargeRate = 0;
        if (altTaxableIncome > 50000000) {
          altSurchargeRate = alternateRegime === 'new' ? 25 : 37;
        } else if (altTaxableIncome > 20000000) {
          altSurchargeRate = 25;
        } else if (altTaxableIncome > 10000000) {
          altSurchargeRate = 15;
        } else if (altTaxableIncome > 5000000) {
          altSurchargeRate = 10;
        }
        const altSurcharge = Math.round(altTaxAfterRebate * altSurchargeRate / 100);
        const altCess = Math.round((altTaxAfterRebate + altSurcharge) * 4 / 100);
        alternateTax = altTaxAfterRebate + altSurcharge + altCess;
      }
    }

    const savingsVsAlternate = alternateTax - totalTaxLiability;
    const isOptimal = totalTaxLiability <= alternateTax;

    // ============================================
    // STEP 10: Build Result
    // ============================================
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

    // ============================================
    // STEP 11: Save if requested
    // ============================================
    if (save_calculation) {
      await supabaseApi
        .from('tax_calculations_v2')
        .insert({
          user_id: user.id,
          financial_year_id: fyData.id,
          calculation_type: 'preview',
          regime_code: regime,
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
          health_education_cess: cess,
          total_tax_liability: totalTaxLiability,
          effective_rate: effectiveRate,
          compared_with_regime: alternateRegime,
          savings_vs_other: savingsVsAlternate,
          is_optimal_regime: isOptimal,
          is_current: true,
        });
    }

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
