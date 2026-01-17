import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredIncome {
  income_type: string;
  sub_type?: string;
  description: string;
  gross_amount: number;
  source_id?: string;
  source_type: string;
  confidence_score: number;
  is_auto_detected: boolean;
  document_ref?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[tax-discover-income] Starting income discovery');

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
    const { financial_year } = body;

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

    const fyStart = fyData.start_date;
    const fyEnd = fyData.end_date;

    const discoveredIncomes: DiscoveredIncome[] = [];
    const missingSources: string[] = [];

    // 1. Discover from income_entries
    const { data: incomeEntries } = await supabase
      .from('income_entries')
      .select(`
        id,
        amount,
        income_date,
        notes,
        income_source:income_sources(source_name, category)
      `)
      .eq('user_id', user.id)
      .gte('income_date', fyStart)
      .lte('income_date', fyEnd);

    if (incomeEntries && incomeEntries.length > 0) {
      // Group by source
      const groupedIncome: Record<string, { total: number; category: string; source_name: string }> = {};
      
      for (const entry of incomeEntries) {
        const source = (entry.income_source as any);
        const key = source?.source_name || 'Other Income';
        const category = source?.category || 'other_sources';
        
        if (!groupedIncome[key]) {
          groupedIncome[key] = { total: 0, category, source_name: key };
        }
        groupedIncome[key].total += Number(entry.amount);
      }

      for (const [sourceName, data] of Object.entries(groupedIncome)) {
        const incomeType = mapCategoryToIncomeType(data.category);
        discoveredIncomes.push({
          income_type: incomeType,
          sub_type: data.category,
          description: `Income from ${sourceName}`,
          gross_amount: data.total,
          source_type: 'income_entry',
          confidence_score: 0.95,
          is_auto_detected: true,
        });
      }
    } else {
      missingSources.push('salary');
    }

    // 2. Discover interest income from savings (if any bank statements)
    // For now, mark as potentially missing
    if (!discoveredIncomes.some(i => i.income_type === 'interest')) {
      missingSources.push('interest');
    }

    // 3. Check for rental income in expenses (rent paid = potential HRA, but we also check if user receives rent)
    // This would come from income_entries with rental category
    if (!discoveredIncomes.some(i => i.income_type === 'rental')) {
      // Don't add to missing - rental is optional
    }

    // 4. Return discovered incomes and what's missing
    const summary = {
      discovered_count: discoveredIncomes.length,
      total_gross_income: discoveredIncomes.reduce((sum, i) => sum + i.gross_amount, 0),
      income_types: [...new Set(discoveredIncomes.map(i => i.income_type))],
      missing_sources: missingSources,
      needs_user_confirmation: discoveredIncomes.length > 0,
    };

    console.log('[tax-discover-income] Discovery complete:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        financial_year,
        incomes: discoveredIncomes,
        summary,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[tax-discover-income] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapCategoryToIncomeType(category: string): string {
  const mapping: Record<string, string> = {
    'salary': 'salary',
    'freelance': 'freelance',
    'business': 'business',
    'investment': 'other_sources',
    'rental': 'rental',
    'dividend': 'dividend',
    'interest': 'interest',
    'pension': 'pension',
    'gift': 'gift',
    'other': 'other_sources',
  };
  return mapping[category.toLowerCase()] || 'other_sources';
}
