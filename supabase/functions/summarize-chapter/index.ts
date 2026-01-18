import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SummaryRequest {
  libraryItemId: string;
  chapterIndex: number;
  chapterText: string;
  summaryType: 'short' | 'detailed' | 'study';
}

const SUMMARY_PROMPTS: Record<string, string> = {
  short: `Summarize the following chapter for a personal study system.

Rules:
- Be factual
- Do not invent content
- Do not add opinions
- Keep neutral tone

Output format:
- 5 bullet points
- Clear and concise`,

  detailed: `Provide a detailed summary of the following chapter.

Rules:
- Be comprehensive but factual
- Do not invent content
- Do not add opinions
- Maintain neutral academic tone

Output format:
- Write 2-3 paragraphs
- Cover all major points
- Include key details and context`,

  study: `Create a study-focused summary of the following chapter.

Rules:
- Focus on key concepts and ideas
- Highlight important definitions
- Note any formulas or key terms
- Be factual, do not invent content

Output format:
- Key Concepts: (3-5 bullet points)
- Important Terms: (list with brief definitions)
- Main Takeaways: (2-3 points)`,
};

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

    const { libraryItemId, chapterIndex, chapterText, summaryType }: SummaryRequest = await req.json();

    if (!libraryItemId || chapterIndex === undefined || !chapterText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing summary
    const { data: existingSummary } = await supabase
      .from('chapter_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('library_item_id', libraryItemId)
      .eq('chapter_index', chapterIndex)
      .single();

    if (existingSummary) {
      console.log("Returning cached summary");
      return new Response(
        JSON.stringify(existingSummary),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new summary using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const type = summaryType || 'short';
    const prompt = SUMMARY_PROMPTS[type] || SUMMARY_PROMPTS.short;

    // Chunk text if too long (keep first ~3000 chars for efficiency)
    const maxChars = 8000;
    const truncatedText = chapterText.length > maxChars 
      ? chapterText.slice(0, maxChars) + "\n\n[Text truncated for processing]"
      : chapterText;

    console.log(`Generating ${type} summary for chapter ${chapterIndex}, text length: ${chapterText.length}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: truncatedText }
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
    const summaryText = aiData.choices?.[0]?.message?.content || "";

    if (!summaryText) {
      throw new Error("No summary generated");
    }

    // Store the summary
    const { data: newSummary, error: insertError } = await supabase
      .from('chapter_summaries')
      .insert({
        user_id: user.id,
        library_item_id: libraryItemId,
        chapter_index: chapterIndex,
        summary_type: type,
        summary_text: summaryText,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store summary:", insertError);
      // Return summary anyway even if storage fails
      return new Response(
        JSON.stringify({ 
          summary_text: summaryText, 
          summary_type: type,
          cached: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Summary generated and stored successfully");

    return new Response(
      JSON.stringify(newSummary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Summarize chapter error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
