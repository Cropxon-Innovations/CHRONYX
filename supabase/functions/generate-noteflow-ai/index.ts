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

    console.log("NoteflowLM generating content:", { type, mode, slideCount, contentLength: content?.length });

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "image") {
      // Use the image generation model
      const imagePrompt = mode === "private"
        ? `Create a professional, visually stunning image based on this content titled "${title}":

${content}

${customPrompt ? `Style direction: ${customPrompt}` : "Create a clean, modern visual representation."}

The image should be high-quality and capture the essence of the content. Include subtle "CHRONYX BY ORIGINX LABS PVT LTD" branding in the bottom right corner.`
        : `Create an enhanced, research-backed professional image based on this content titled "${title}":

${content}

${customPrompt ? `Style direction: ${customPrompt}` : "Create a visually rich, detailed image with accurate context."}

Add relevant visual details that enhance the message. Include subtle "CHRONYX BY ORIGINX LABS PVT LTD" branding in the bottom right corner.`;

      console.log("Calling image generation API...");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: imagePrompt },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Usage limit reached. Please contact support." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Image generation response received");

      const textResult = data.choices?.[0]?.message?.content || "Image generated successfully with CHRONYX branding!";
      const images = data.choices?.[0]?.message?.images || [];

      return new Response(
        JSON.stringify({
          success: true,
          result: textResult,
          images: images,
          type: "image",
          branding: "CHRONYX BY ORIGINX LABS PVT LTD"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (type === "slides") {
      systemPrompt = `You are a professional presentation designer for CHRONYX by ORIGINX LABS PVT LTD. Create structured, engaging slide outlines that are clear and visually organized. Always include the branding "CHRONYX BY ORIGINX LABS PVT LTD" on the first and last slide.`;

      userPrompt = mode === "private"
        ? `Create a ${slideCount}-slide presentation outline based on this content titled "${title}":

${content}

${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Format each slide with:
- **Slide [number]: [Title]**
- Key points (2-4 bullet points)
- Speaker notes (optional)
- Visual suggestions

Include "CHRONYX BY ORIGINX LABS PVT LTD" branding on title and closing slides.`
        : `Create an enhanced ${slideCount}-slide presentation outline based on this content titled "${title}":

${content}

${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Research and add accurate, relevant details to fill all ${slideCount} slides with valuable content.

Format each slide with:
- **Slide [number]: [Title]**
- Key points (2-4 bullet points with enhanced details)
- Speaker notes with context
- Visual suggestions

Include "CHRONYX BY ORIGINX LABS PVT LTD" branding on title and closing slides.`;

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
      const result = data.choices?.[0]?.message?.content || "Slides generated successfully!";

      console.log("Slides generation completed successfully");

      return new Response(
        JSON.stringify({
          success: true,
          result,
          type: "slides",
          branding: "CHRONYX BY ORIGINX LABS PVT LTD"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error(`Unsupported generation type: ${type}. Supported types: image, slides`);
    }
  } catch (error) {
    console.error("Error in generate-noteflow-ai:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to generate content" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
