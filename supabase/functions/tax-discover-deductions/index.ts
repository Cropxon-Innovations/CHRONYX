import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredDeduction {
  section_code: string;
  description: string;
  claimed_amount: number;
  max_limit: number | null;
  source_id?: string;
  source_type: string;
  confidence_score: number;
  is_auto_detected: boolean;
  document_ref?: string;
  savings_impact: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-discover-deductions] Starting deduction discovery');

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
    const { financial_year, gross_income = 0 } = body;

    if (!financial_year) {
      return new Response(
        JSON.stringify({ error: 'Missing financial_year' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get FY data
    const { data: fyData } = await supabaseApi
      .from('tax_financial_years')
      .select('*')
      .eq('code', financial_year)
      .single();

    if (!fyData) {
      return new Response(
        JSON.stringify({ error: 'Financial year not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get deduction limits from rules
    const { data: deductionRules } = await supabaseApi
      .from('tax_deductions')
      .select('*')
      .eq('financial_year_id', fyData.id);

    const deductionLimits: Record<string, number | null> = {};
    deductionRules?.forEach((d: any) => {
      deductionLimits[d.section_code] = d.max_limit;
    });

    const discoveredDeductions: DiscoveredDeduction[] = [];
    const suggestedDeductions: any[] = [];

    // Calculate approximate tax bracket for savings impact
    const taxBracket = gross_income > 1500000 ? 0.30 : 
                       gross_income > 1200000 ? 0.20 :
                       gross_income > 1000000 ? 0.15 :
                       gross_income > 700000 ? 0.10 :
                       gross_income > 300000 ? 0.05 : 0;

    // 1. Discover from insurances (80D)
    const { data: insurances } = await supabase
      .from('insurances')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (insurances && insurances.length > 0) {
      const healthPremiums = insurances
        .filter((i: any) => i.policy_type === 'Health')
        .reduce((sum: number, i: any) => sum + Number(i.premium_amount), 0);

      if (healthPremiums > 0) {
        const limit = deductionLimits['80D'] || 25000;
        const claimable = Math.min(healthPremiums, limit);
        discoveredDeductions.push({
          section_code: '80D',
          description: 'Health Insurance Premium',
          claimed_amount: claimable,
          max_limit: limit,
          source_type: 'insurance',
          confidence_score: 0.95,
          is_auto_detected: true,
          savings_impact: claimable * taxBracket,
        });
      }

      // Life insurance for 80C
      const lifePremiums = insurances
        .filter((i: any) => i.policy_type === 'Life' || i.policy_type === 'Term')
        .reduce((sum: number, i: any) => sum + Number(i.premium_amount), 0);

      if (lifePremiums > 0) {
        discoveredDeductions.push({
          section_code: '80C',
          description: 'Life Insurance Premium',
          claimed_amount: lifePremiums,
          max_limit: 150000,
          source_type: 'insurance',
          confidence_score: 0.95,
          is_auto_detected: true,
          savings_impact: Math.min(lifePremiums, 150000) * taxBracket,
        });
      }
    }

    // 2. Check for home loan from loans table
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (loans && loans.length > 0) {
      const homeLoans = loans.filter((l: any) => 
        l.loan_type?.toLowerCase().includes('home') || 
        l.loan_type?.toLowerCase().includes('housing')
      );

      if (homeLoans.length > 0) {
        // Calculate approximate interest paid this FY
        const totalHomeLoanInterest = homeLoans.reduce((sum: number, l: any) => {
          const principal = Number(l.principal_amount);
          const rate = Number(l.interest_rate) / 100;
          const yearlyInterest = principal * rate * 0.7; // Approximate
          return sum + yearlyInterest;
        }, 0);

        if (totalHomeLoanInterest > 0) {
          const limit = 200000;
          const claimable = Math.min(totalHomeLoanInterest, limit);
          discoveredDeductions.push({
            section_code: '24B',
            description: 'Home Loan Interest',
            claimed_amount: claimable,
            max_limit: limit,
            source_type: 'loan',
            confidence_score: 0.80,
            is_auto_detected: true,
            savings_impact: claimable * taxBracket,
          });

          // Principal repayment under 80C
          const principalRepaid = homeLoans.reduce((sum: number, l: any) => {
            return sum + (Number(l.emi_amount) * 12 * 0.3); // Approximate principal portion
          }, 0);

          if (principalRepaid > 0) {
            discoveredDeductions.push({
              section_code: '80C',
              description: 'Home Loan Principal Repayment',
              claimed_amount: principalRepaid,
              max_limit: 150000,
              source_type: 'loan',
              confidence_score: 0.75,
              is_auto_detected: true,
              savings_impact: Math.min(principalRepaid, 150000) * taxBracket,
            });
          }
        }
      }

      // Education loans for 80E
      const educationLoans = loans.filter((l: any) => 
        l.loan_type?.toLowerCase().includes('education')
      );

      if (educationLoans.length > 0) {
        const eduInterest = educationLoans.reduce((sum: number, l: any) => {
          return sum + (Number(l.principal_amount) * Number(l.interest_rate) / 100 * 0.7);
        }, 0);

        if (eduInterest > 0) {
          discoveredDeductions.push({
            section_code: '80E',
            description: 'Education Loan Interest',
            claimed_amount: eduInterest,
            max_limit: null, // No limit
            source_type: 'loan',
            confidence_score: 0.80,
            is_auto_detected: true,
            savings_impact: eduInterest * taxBracket,
          });
        }
      }
    }

    // 3. Suggest common deductions not discovered
    const discovered80C = discoveredDeductions.filter(d => d.section_code === '80C');
    const total80C = discovered80C.reduce((sum, d) => sum + d.claimed_amount, 0);
    
    if (total80C < 150000) {
      const remaining = 150000 - total80C;
      suggestedDeductions.push({
        section_code: '80C',
        title: 'Maximize 80C Deductions',
        description: `You can claim up to ₹${remaining.toLocaleString('en-IN')} more under Section 80C`,
        options: ['PPF', 'ELSS', 'NSC', 'Tax Saver FD', 'Tuition Fees'],
        potential_savings: remaining * taxBracket,
      });
    }

    if (!discoveredDeductions.some(d => d.section_code === '80CCD1B')) {
      suggestedDeductions.push({
        section_code: '80CCD1B',
        title: 'NPS Contribution',
        description: 'Additional ₹50,000 deduction for NPS contribution',
        potential_savings: 50000 * taxBracket,
      });
    }

    // Summary
    const totalDeductions = discoveredDeductions.reduce((sum, d) => sum + d.claimed_amount, 0);
    const totalSavings = discoveredDeductions.reduce((sum, d) => sum + d.savings_impact, 0);

    const summary = {
      discovered_count: discoveredDeductions.length,
      total_deductions: totalDeductions,
      total_tax_savings: totalSavings,
      sections_covered: [...new Set(discoveredDeductions.map(d => d.section_code))],
      suggestions_count: suggestedDeductions.length,
    };

    console.log('[tax-discover-deductions] Discovery complete:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        financial_year,
        deductions: discoveredDeductions,
        suggestions: suggestedDeductions,
        summary,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-discover-deductions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
