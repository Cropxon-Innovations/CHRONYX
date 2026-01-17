import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, history } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are CHRONYX Bot, a friendly and helpful personal life assistant for the CHRONYX app. You help users understand their life data including:

- Tasks & Productivity (todos, completion rates, streaks)
- Finances (expenses, income, savings)
- Study Progress (hours logged, subjects studied)
- Insurance & Loans (policies, EMIs, coverage)
- Goals & Achievements
- Memory & Documents

Guidelines:
- Be concise but helpful (2-4 sentences typically)
- Use emojis sparingly to add personality
- Reference specific data from the user's context when available
- If asked about something not in context, acknowledge it kindly
- Provide actionable insights when possible
- Format numbers nicely (₹ for currency, proper date formats)
- Be encouraging about progress and gentle about areas needing improvement

Current User Context:
${context}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", response: null }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue.", response: null }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("chronyx-bot error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        response: "I'm having trouble right now. Please try again in a moment."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
