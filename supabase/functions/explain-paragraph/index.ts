import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExplainRequest {
  libraryItemId?: string;
  chapterIndex?: number;
  paragraphText: string;
  saveToExplanations?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { libraryItemId, chapterIndex, paragraphText, saveToExplanations }: ExplainRequest = await req.json();

    if (!paragraphText || paragraphText.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Paragraph text is required (minimum 10 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a hash for duplicate detection
    const paragraphHash = btoa(paragraphText.slice(0, 100)).slice(0, 32);

    // Check for existing explanation
    if (libraryItemId) {
      const { data: existing } = await supabase
        .from('study_explanations')
        .select('*')
        .eq('user_id', user.id)
        .eq('library_item_id', libraryItemId)
        .eq('paragraph_hash', paragraphHash)
        .single();

      if (existing) {
        console.log("Returning cached explanation");
        return new Response(
          JSON.stringify(existing),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Explaining paragraph, length: ${paragraphText.length}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Explain the selected paragraph in simple terms.

Rules:
- Do not add information not present in the text
- Do not summarize entire chapters
- Keep neutral tone
- Max 120 words
- Be helpful and educational

Format:
Start with a clear explanation, then if relevant:
- Key idea: (one sentence)
- Context: (if helpful)`
          },
          { role: "user", content: paragraphText }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      if (errorStatus === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (errorStatus === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${errorStatus}`);
    }

    const aiData = await aiResponse.json();
    const explanationText = aiData.choices?.[0]?.message?.content || "";

    if (!explanationText) {
      throw new Error("No explanation generated");
    }

    let savedExplanation = null;

    // Save if requested
    if (saveToExplanations && libraryItemId) {
      const { data, error } = await supabase
        .from('study_explanations')
        .insert({
          user_id: user.id,
          library_item_id: libraryItemId,
          chapter_index: chapterIndex,
          paragraph_hash: paragraphHash,
          original_text: paragraphText.slice(0, 1000),
          explanation_text: explanationText,
        })
        .select()
        .single();

      if (!error) {
        savedExplanation = data;
      } else {
        console.error("Failed to save explanation:", error);
      }
    }

    console.log("Explanation generated successfully");

    return new Response(
      JSON.stringify({
        explanation_text: explanationText,
        original_text: paragraphText.slice(0, 500),
        saved: !!savedExplanation,
        id: savedExplanation?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Explain paragraph error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
