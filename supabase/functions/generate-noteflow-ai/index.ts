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
    const { type, content, title, mode, customPrompt, slideCount } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating Noteflow AI content:", { type, mode, slideCount });

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "image") {
      systemPrompt = `You are a creative AI image prompt generator. Your job is to create detailed, vivid image prompts based on note content.`;
      
      if (mode === "private") {
        userPrompt = `Based on this note titled "${title}", create a detailed image generation prompt that captures the essence of the content:

${content}

${customPrompt ? `Additional direction: ${customPrompt}` : ""}

Respond with a detailed image prompt description that could be used by an AI image generator.`;
      } else {
        userPrompt = `Create an enhanced, research-backed image prompt based on this note titled "${title}":

${content}

${customPrompt ? `Additional direction: ${customPrompt}` : ""}

Include accurate visual details and enhance with relevant context. Respond with a detailed image prompt.`;
      }
    } else if (type === "slides") {
      systemPrompt = `You are a professional presentation designer. Create structured slide outlines that are clear, engaging, and visually organized.`;
      
      if (mode === "private") {
        userPrompt = `Create a ${slideCount}-slide presentation outline based on this note titled "${title}":

${content}

${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Format each slide with:
- Slide number and title
- Key points (2-4 bullet points)
- Speaker notes (optional)`;
      } else {
        userPrompt = `Create an enhanced ${slideCount}-slide presentation outline based on this note titled "${title}":

${content}

${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Research and add accurate, relevant details to fill all ${slideCount} slides.
Format each slide with:
- Slide number and title
- Key points (2-4 bullet points)
- Speaker notes with enhanced context`;
      }
    } else {
      throw new Error(`Unsupported generation type: ${type}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "Generation completed successfully!";

    console.log("Generation completed successfully");

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-noteflow-ai:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
