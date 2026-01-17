import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditFlag {
  flag_type: 'missing_document' | 'limit_exceeded' | 'mismatch' | 'high_risk' | 'compliance' | 'verification_needed';
  severity: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affected_section?: string;
  affected_amount?: number;
  resolution_required: boolean;
  resolution_action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-audit] Starting audit check');

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
      gross_income = 0,
      deductions = {},
      incomes = [],
      regime = 'new'
    } = body;

    const flags: AuditFlag[] = [];
    let auditScore = 100; // Start with perfect score

    // 1. Check for document verification
    const unverifiedIncomes = incomes?.filter((i: any) => !i.user_confirmed && !i.document_url) || [];
    if (unverifiedIncomes.length > 0) {
      auditScore -= 15;
      flags.push({
        flag_type: 'missing_document',
        severity: 'warning',
        title: 'Unverified Income Sources',
        description: `${unverifiedIncomes.length} income source(s) without supporting documents`,
        resolution_required: false,
        resolution_action: 'Upload Form-16 or salary slips',
      });
    }

    // 2. Check 80C limit
    const total80C = Number(deductions?.['80C'] || 0);
    if (total80C > 150000) {
      auditScore -= 20;
      flags.push({
        flag_type: 'limit_exceeded',
        severity: 'error',
        title: '80C Limit Exceeded',
        description: `Claimed ₹${total80C.toLocaleString('en-IN')} but limit is ₹1,50,000`,
        affected_section: '80C',
        affected_amount: total80C - 150000,
        resolution_required: true,
        resolution_action: 'Reduce 80C claim to ₹1,50,000',
      });
    }

    // 3. Check 80D limit
    const total80D = Number(deductions?.['80D'] || 0);
    if (total80D > 75000) { // Max with senior citizen parents
      auditScore -= 15;
      flags.push({
        flag_type: 'limit_exceeded',
        severity: 'error',
        title: '80D Limit Exceeded',
        description: `Claimed ₹${total80D.toLocaleString('en-IN')} exceeds maximum limit`,
        affected_section: '80D',
        affected_amount: total80D - 75000,
        resolution_required: true,
        resolution_action: 'Verify 80D claim with supporting documents',
      });
    }

    // 4. Check home loan interest limit
    const homeLoanInterest = Number(deductions?.['24B'] || 0);
    if (homeLoanInterest > 200000) {
      auditScore -= 15;
      flags.push({
        flag_type: 'limit_exceeded',
        severity: 'error',
        title: 'Home Loan Interest Limit Exceeded',
        description: `Claimed ₹${homeLoanInterest.toLocaleString('en-IN')} but limit is ₹2,00,000`,
        affected_section: '24B',
        affected_amount: homeLoanInterest - 200000,
        resolution_required: true,
        resolution_action: 'Reduce 24(b) claim to ₹2,00,000',
      });
    }

    // 5. High refund flag
    const totalDeductions = Object.values(deductions || {}).reduce((sum: number, v: any) => sum + Number(v), 0);
    const deductionRatio = gross_income > 0 ? totalDeductions / gross_income : 0;
    
    if (deductionRatio > 0.5) {
      auditScore -= 10;
      flags.push({
        flag_type: 'high_risk',
        severity: 'warning',
        title: 'High Deduction Ratio',
        description: `Deductions are ${(deductionRatio * 100).toFixed(1)}% of gross income - may attract scrutiny`,
        resolution_required: false,
        resolution_action: 'Keep all supporting documents ready',
      });
    }

    // 6. Old regime without deductions
    if (regime === 'old' && totalDeductions < 50000) {
      auditScore -= 5;
      flags.push({
        flag_type: 'compliance',
        severity: 'info',
        title: 'Consider New Regime',
        description: 'Low deductions may make new regime more beneficial',
        resolution_required: false,
      });
    }

    // 7. Income mismatch check (basic)
    const declaredIncome = incomes?.reduce((sum: number, i: any) => sum + Number(i.gross_amount || 0), 0) || 0;
    if (Math.abs(declaredIncome - gross_income) > 10000 && declaredIncome > 0) {
      auditScore -= 10;
      flags.push({
        flag_type: 'mismatch',
        severity: 'warning',
        title: 'Income Mismatch',
        description: `Declared income ₹${declaredIncome.toLocaleString('en-IN')} differs from calculated ₹${gross_income.toLocaleString('en-IN')}`,
        affected_amount: Math.abs(declaredIncome - gross_income),
        resolution_required: true,
        resolution_action: 'Verify all income sources are included',
      });
    }

    // 8. No income reported
    if (gross_income <= 0 && incomes.length === 0) {
      auditScore -= 30;
      flags.push({
        flag_type: 'verification_needed',
        severity: 'critical',
        title: 'No Income Reported',
        description: 'Please add your income sources for accurate tax calculation',
        resolution_required: true,
        resolution_action: 'Add income from salary, business, or other sources',
      });
    }

    // Ensure score doesn't go below 0
    auditScore = Math.max(0, auditScore);

    // Determine readiness level
    let readinessLevel: string;
    if (auditScore >= 90) {
      readinessLevel = 'excellent';
    } else if (auditScore >= 75) {
      readinessLevel = 'good';
    } else if (auditScore >= 50) {
      readinessLevel = 'needs_attention';
    } else {
      readinessLevel = 'critical';
    }

    console.log('[tax-audit] Audit complete. Score:', auditScore);

    return new Response(
      JSON.stringify({
        success: true,
        audit_score: auditScore,
        readiness_level: readinessLevel,
        flags,
        summary: {
          total_flags: flags.length,
          critical: flags.filter(f => f.severity === 'critical').length,
          errors: flags.filter(f => f.severity === 'error').length,
          warnings: flags.filter(f => f.severity === 'warning').length,
          info: flags.filter(f => f.severity === 'info').length,
          resolution_required: flags.filter(f => f.resolution_required).length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-audit] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
