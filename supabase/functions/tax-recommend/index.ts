import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recommendation {
  type: 'mandatory' | 'optimization' | 'risk_alert' | 'compliance' | 'planning';
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  impact_amount: number;
  impact_description: string;
  confidence: 'high' | 'medium' | 'low';
  action_required: boolean;
  action_type?: string;
  action_label?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-recommend] Starting recommendation engine');

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
      regime = 'new',
      old_regime_tax = 0,
      new_regime_tax = 0,
      deductions = {},
      incomes = []
    } = body;

    const recommendations: Recommendation[] = [];

    // 1. Regime Recommendation
    if (old_regime_tax !== undefined && new_regime_tax !== undefined) {
      const savings = Math.abs(old_regime_tax - new_regime_tax);
      const betterRegime = old_regime_tax < new_regime_tax ? 'old' : 'new';
      
      if (savings > 0) {
        recommendations.push({
          type: 'optimization',
          category: 'regime',
          priority: 'high',
          title: `Switch to ${betterRegime === 'old' ? 'Old' : 'New'} Regime`,
          description: `You can save ₹${savings.toLocaleString('en-IN')} by choosing the ${betterRegime} tax regime`,
          reason: betterRegime === 'old' 
            ? 'Your deductions make the old regime more beneficial' 
            : 'With limited deductions, the new regime offers better rates',
          impact_amount: savings,
          impact_description: `₹${savings.toLocaleString('en-IN')} annual tax savings`,
          confidence: 'high',
          action_required: regime !== betterRegime,
          action_type: 'switch_regime',
          action_label: `Switch to ${betterRegime === 'old' ? 'Old' : 'New'} Regime`,
        });
      }
    }

    // 2. 80C Optimization
    const total80C = Object.entries(deductions || {})
      .filter(([key]) => key === '80C')
      .reduce((sum, [_, val]) => sum + Number(val), 0);
    
    if (total80C < 150000 && gross_income > 500000) {
      const gap = 150000 - total80C;
      const taxBracket = gross_income > 1500000 ? 0.30 : 
                         gross_income > 1000000 ? 0.15 : 0.05;
      const potentialSavings = gap * taxBracket;

      recommendations.push({
        type: 'optimization',
        category: 'deduction',
        priority: 'high',
        title: 'Maximize Section 80C',
        description: `You can claim ₹${gap.toLocaleString('en-IN')} more under Section 80C`,
        reason: 'Investing in tax-saving instruments reduces taxable income',
        impact_amount: potentialSavings,
        impact_description: `Up to ₹${Math.round(potentialSavings).toLocaleString('en-IN')} tax savings`,
        confidence: 'high',
        action_required: true,
        action_type: 'add_deduction',
        action_label: 'Add 80C Investment',
      });
    }

    // 3. NPS Recommendation (80CCD1B)
    const npsDeduction = deductions?.['80CCD1B'] || 0;
    if (npsDeduction < 50000 && gross_income > 700000) {
      const gap = 50000 - npsDeduction;
      const taxBracket = gross_income > 1500000 ? 0.30 : 0.20;
      const potentialSavings = gap * taxBracket;

      recommendations.push({
        type: 'optimization',
        category: 'deduction',
        priority: 'medium',
        title: 'NPS Contribution (80CCD1B)',
        description: 'Additional ₹50,000 deduction available for NPS',
        reason: 'NPS offers an exclusive tax benefit over and above 80C limit',
        impact_amount: potentialSavings,
        impact_description: `Up to ₹${Math.round(potentialSavings).toLocaleString('en-IN')} tax savings`,
        confidence: 'high',
        action_required: true,
        action_type: 'add_deduction',
        action_label: 'Add NPS Investment',
      });
    }

    // 4. Health Insurance Check (80D)
    const healthDeduction = deductions?.['80D'] || 0;
    if (healthDeduction === 0 && gross_income > 300000) {
      recommendations.push({
        type: 'mandatory',
        category: 'insurance',
        priority: 'high',
        title: 'Get Health Insurance',
        description: 'No health insurance premium detected for 80D deduction',
        reason: 'Health insurance provides both tax benefits and financial protection',
        impact_amount: 7500,
        impact_description: 'Up to ₹7,500 tax savings + health coverage',
        confidence: 'high',
        action_required: true,
        action_type: 'upload_document',
        action_label: 'Upload Insurance Policy',
      });
    }

    // 5. Missing Income Sources
    if (!incomes || incomes.length === 0) {
      recommendations.push({
        type: 'mandatory',
        category: 'income',
        priority: 'critical',
        title: 'Add Income Sources',
        description: 'No income sources detected for this financial year',
        reason: 'Accurate income reporting is mandatory for tax calculation',
        impact_amount: 0,
        impact_description: 'Required for accurate tax computation',
        confidence: 'high',
        action_required: true,
        action_type: 'confirm_data',
        action_label: 'Add Income',
      });
    }

    // 6. High Income Warning
    if (gross_income > 5000000) {
      recommendations.push({
        type: 'risk_alert',
        category: 'compliance',
        priority: 'high',
        title: 'High Income - Surcharge Applicable',
        description: `Surcharge will apply on your income above ₹50L`,
        reason: 'High-income taxpayers attract additional surcharge on tax',
        impact_amount: 0,
        impact_description: 'Plan investments to optimize surcharge impact',
        confidence: 'high',
        action_required: false,
      });
    }

    // 7. Advance Tax Reminder
    if (gross_income > 1000000) {
      recommendations.push({
        type: 'planning',
        category: 'compliance',
        priority: 'medium',
        title: 'Advance Tax Payment',
        description: 'Consider paying advance tax to avoid interest',
        reason: 'If tax liability exceeds ₹10,000, advance tax is required',
        impact_amount: 0,
        impact_description: 'Avoid 1% interest per month on unpaid tax',
        confidence: 'medium',
        action_required: false,
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log('[tax-recommend] Generated', recommendations.length, 'recommendations');

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        summary: {
          total: recommendations.length,
          by_type: {
            mandatory: recommendations.filter(r => r.type === 'mandatory').length,
            optimization: recommendations.filter(r => r.type === 'optimization').length,
            risk_alert: recommendations.filter(r => r.type === 'risk_alert').length,
            planning: recommendations.filter(r => r.type === 'planning').length,
          },
          action_required: recommendations.filter(r => r.action_required).length,
          total_potential_savings: recommendations.reduce((sum, r) => sum + r.impact_amount, 0),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-recommend] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
