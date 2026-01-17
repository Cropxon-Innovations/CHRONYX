import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxPdfRequest {
  calculation_id?: string;
  financial_year: string;
  regime: string;
  gross_income: number;
  standard_deduction: number;
  total_deductions: number;
  deductions_breakdown: Record<string, number>;
  taxable_income: number;
  slab_breakdown: Array<{
    slab_order: number;
    min_amount: number;
    max_amount: number | null;
    rate_percentage: number;
    taxable_in_slab: number;
    tax_in_slab: number;
  }>;
  tax_before_rebate: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
}

interface PdfStructuredOutput {
  document_type: 'tax_summary';
  generated_at: string;
  version: '1.0.0';
  user: {
    id: string;
    email: string;
    name?: string;
  };
  calculation: {
    financial_year: string;
    regime: string;
    regime_display: string;
    calculation_date: string;
  };
  income_summary: {
    gross_income: number;
    standard_deduction: number;
    income_after_std_deduction: number;
  };
  deductions_table: Array<{
    section: string;
    description: string;
    claimed_amount: number;
    allowed_amount: number;
  }>;
  total_deductions: number;
  taxable_income: number;
  slab_wise_tax_table: Array<{
    slab_range: string;
    rate: string;
    taxable_amount: number;
    tax_amount: number;
  }>;
  tax_computation: {
    tax_before_rebate: number;
    rebate_87a: number;
    tax_after_rebate: number;
    surcharge: number;
    cess: number;
    cess_rate: string;
    total_tax_payable: number;
  };
  summary: {
    effective_tax_rate: number;
    monthly_tax_equivalent: number;
  };
  disclaimer: string;
  footer: {
    company_name: string;
    generated_by: string;
    support_email: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-generate-pdf] Starting PDF generation request');

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

    const body: TaxPdfRequest = await req.json();

    // Fetch user profile for name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Map deductions to table format
    const deductionDescriptions: Record<string, string> = {
      '80C': 'PPF, ELSS, LIC, EPF, Home Loan Principal',
      '80CCD1B': 'Additional NPS Contribution',
      '80D': 'Health Insurance Premium',
      '80E': 'Education Loan Interest',
      '24B': 'Home Loan Interest',
      'HRA': 'House Rent Allowance Exemption',
    };

    const deductionsTable = Object.entries(body.deductions_breakdown).map(([section, amount]) => ({
      section,
      description: deductionDescriptions[section] || section,
      claimed_amount: amount,
      allowed_amount: amount, // Already capped by limits in calculate
    }));

    // Map slabs to readable format
    const slabTable = body.slab_breakdown.map(slab => {
      const minFormatted = (slab.min_amount / 100000).toFixed(1) + 'L';
      const maxFormatted = slab.max_amount 
        ? (slab.max_amount / 100000).toFixed(1) + 'L'
        : 'Above';
      const range = slab.max_amount 
        ? `₹${minFormatted} - ₹${maxFormatted}`
        : `Above ₹${minFormatted}`;
      
      return {
        slab_range: range,
        rate: `${slab.rate_percentage}%`,
        taxable_amount: slab.taxable_in_slab,
        tax_amount: slab.tax_in_slab,
      };
    });

    // Build PDF-ready structured output
    const pdfOutput: PdfStructuredOutput = {
      document_type: 'tax_summary',
      generated_at: new Date().toISOString(),
      version: '1.0.0',
      user: {
        id: user.id,
        email: user.email || '',
        name: profileData?.display_name || undefined,
      },
      calculation: {
        financial_year: body.financial_year,
        regime: body.regime,
        regime_display: body.regime === 'old' ? 'Old Tax Regime' : 'New Tax Regime',
        calculation_date: new Date().toISOString().split('T')[0],
      },
      income_summary: {
        gross_income: body.gross_income,
        standard_deduction: body.standard_deduction,
        income_after_std_deduction: body.gross_income - body.standard_deduction,
      },
      deductions_table: deductionsTable,
      total_deductions: body.total_deductions,
      taxable_income: body.taxable_income,
      slab_wise_tax_table: slabTable,
      tax_computation: {
        tax_before_rebate: body.tax_before_rebate,
        rebate_87a: body.rebate_87a,
        tax_after_rebate: body.tax_after_rebate,
        surcharge: body.surcharge,
        cess: body.cess,
        cess_rate: '4%',
        total_tax_payable: body.total_tax,
      },
      summary: {
        effective_tax_rate: body.effective_rate,
        monthly_tax_equivalent: Math.round(body.total_tax / 12),
      },
      disclaimer: 'This is a computer-generated tax estimate for informational purposes only. It does not constitute tax advice. Please consult a qualified Chartered Accountant or tax professional for accurate tax filing. CHRONYX and Cropxon Innovations Pvt. Ltd. are not responsible for any discrepancies or errors.',
      footer: {
        company_name: 'CHRONYX by Cropxon Innovations Pvt. Ltd.',
        generated_by: 'CHRONYX Tax Calculator v1.0',
        support_email: 'support@chronyx.in',
      },
    };

    console.log('[tax-generate-pdf] PDF structure generated successfully');

    // Save document reference (stub - actual PDF generation can be added later)
    if (body.calculation_id) {
      const { data: fyData } = await supabase
        .from('tax_financial_years')
        .select('id')
        .eq('code', body.financial_year)
        .single();

      if (fyData) {
        await supabase
          .from('tax_documents')
          .insert({
            user_id: user.id,
            calculation_id: body.calculation_id,
            financial_year_id: fyData.id,
            document_type: 'tax_summary',
            metadata: pdfOutput,
            generated_at: new Date().toISOString(),
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF structure generated successfully',
        data: pdfOutput,
        // Note: Actual PDF file generation to be implemented in next phase
        pdf_url: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-generate-pdf] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});