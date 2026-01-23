import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TAXYN, an expert AI tax advisor for Indian Income Tax. You are part of the Chronyx financial management platform.

Your expertise includes:
- Indian Income Tax Act provisions (2024, 2025, 2026 and beyond)
- Old Regime vs New Regime comparisons
- All tax deduction sections (80C, 80CCD, 80D, 80E, 80G, 24(b), etc.)
- TDS calculations and refund eligibility
- Capital gains (STCG, LTCG)
- Salary structure optimization for tax efficiency
- HRA exemption calculations
- Advance tax requirements

Key rules:
1. ALWAYS provide accurate, up-to-date tax information based on Indian tax laws
2. When discussing amounts, use Indian Rupees (₹) format
3. Be clear about which regime (Old/New) applies to specific advice
4. Mention relevant sections of the Income Tax Act when applicable
5. If tax rules depend on the financial year, clarify which FY you're discussing
6. Always recommend consulting a CA for complex situations or final filings
7. Be concise but thorough

Tax slabs for FY 2025-26 (New Regime):
- ₹0 - ₹4L: 0%
- ₹4L - ₹8L: 5%
- ₹8L - ₹12L: 10%
- ₹12L - ₹16L: 15%
- ₹16L - ₹20L: 20%
- ₹20L - ₹24L: 25%
- Above ₹24L: 30%
- Standard Deduction: ₹75,000
- 87A Rebate: Up to ₹60,000 if taxable income ≤ ₹12L

Tax slabs for FY 2025-26 (Old Regime):
- ₹0 - ₹2.5L: 0%
- ₹2.5L - ₹5L: 5%
- ₹5L - ₹10L: 20%
- Above ₹10L: 30%
- Standard Deduction: ₹50,000
- 87A Rebate: Up to ₹12,500 if taxable income ≤ ₹5L

You have access to the user's current tax calculation context (if provided). Use it to give personalized advice.`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, taxContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (taxContext) {
      systemPrompt += `\n\nCurrent User Tax Context:
- Financial Year: ${taxContext.financialYear || 'Not specified'}
- Selected Regime: ${taxContext.regime || 'Not specified'}
- Gross Income: ₹${taxContext.grossIncome?.toLocaleString('en-IN') || 'Not specified'}
- Total Deductions: ₹${taxContext.totalDeductions?.toLocaleString('en-IN') || '0'}
- Calculated Tax: ₹${taxContext.calculatedTax?.toLocaleString('en-IN') || 'Not calculated'}
- TDS Paid: ₹${taxContext.tdsPaid?.toLocaleString('en-IN') || '0'}

Deductions breakdown: ${JSON.stringify(taxContext.deductions || {})}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("TAXYN chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
