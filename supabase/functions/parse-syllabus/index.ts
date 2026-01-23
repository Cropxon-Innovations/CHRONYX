import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedTopic {
  id: string;
  name: string;
  estimatedHours: number;
  selected: boolean;
}

interface ParsedChapter {
  id: string;
  name: string;
  topics: ParsedTopic[];
  expanded: boolean;
}

interface ParsedSyllabus {
  subject: string;
  chapters: ParsedChapter[];
}

// Simple text-based parsing when AI is not available
function parseTextContent(text: string, subject: string): ParsedSyllabus {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const chapters: ParsedChapter[] = [];
  let currentChapter: ParsedChapter | null = null;
  let topicIndex = 0;

  // Common chapter patterns
  const chapterPatterns = [
    /^(chapter|unit|module|section|part)\s*\d*[\.:]/i,
    /^\d+[\.:]\s+[A-Z]/,
    /^[IVXLCDM]+[\.:]\s+/i,
    /^[A-Z][^a-z]*:/,
  ];

  // Common topic patterns
  const topicPatterns = [
    /^[-•*]\s+/,
    /^\d+\.\d+[\.:]/,
    /^[a-z]\)\s+/i,
    /^\(\d+\)\s+/,
    /^[ivx]+[\.:]/i,
  ];

  for (const line of lines) {
    const isChapter = chapterPatterns.some(p => p.test(line));
    const isTopic = topicPatterns.some(p => p.test(line));

    if (isChapter || (!currentChapter && !isTopic && line.length > 5 && line.length < 100)) {
      // Start new chapter
      if (currentChapter && currentChapter.topics.length > 0) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        id: `ch_${chapters.length + 1}`,
        name: line.replace(/^(chapter|unit|module|section|part)\s*\d*[\.:]\s*/i, "").trim(),
        topics: [],
        expanded: true,
      };
    } else if (currentChapter && (isTopic || line.length > 3)) {
      // Add topic to current chapter
      const topicName = line
        .replace(/^[-•*]\s+/, "")
        .replace(/^\d+\.\d+[\.:]\s*/, "")
        .replace(/^[a-z]\)\s+/i, "")
        .replace(/^\(\d+\)\s+/, "")
        .trim();

      if (topicName.length > 2 && topicName.length < 200) {
        topicIndex++;
        currentChapter.topics.push({
          id: `topic_${topicIndex}`,
          name: topicName,
          estimatedHours: 1, // Default 1 hour
          selected: true,
        });
      }
    }
  }

  // Add last chapter
  if (currentChapter && currentChapter.topics.length > 0) {
    chapters.push(currentChapter);
  }

  // If no chapters found, create a default one with all lines as topics
  if (chapters.length === 0) {
    const defaultChapter: ParsedChapter = {
      id: "ch_1",
      name: "Main Topics",
      topics: [],
      expanded: true,
    };

    lines.slice(0, 50).forEach((line, i) => {
      if (line.length > 3 && line.length < 200) {
        defaultChapter.topics.push({
          id: `topic_${i + 1}`,
          name: line.replace(/^[-•*\d.)\s]+/, "").trim(),
          estimatedHours: 1,
          selected: true,
        });
      }
    });

    if (defaultChapter.topics.length > 0) {
      chapters.push(defaultChapter);
    }
  }

  return {
    subject,
    chapters,
  };
}

// AI-powered parsing using Gemini
async function parseWithAI(text: string, subject: string): Promise<ParsedSyllabus> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  
  if (!geminiApiKey) {
    console.log("GEMINI_API_KEY not found, using fallback parser");
    return parseTextContent(text, subject);
  }

  try {
    const prompt = `You are an expert at parsing educational syllabi. Analyze the following syllabus content and extract chapters and topics in a structured format.

For each topic, estimate the study hours based on complexity (0.5 to 4 hours typically).

SYLLABUS CONTENT:
${text.substring(0, 8000)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "subject": "${subject}",
  "chapters": [
    {
      "id": "ch_1",
      "name": "Chapter Name",
      "topics": [
        {
          "id": "topic_1",
          "name": "Topic Name",
          "estimatedHours": 1.5,
          "selected": true
        }
      ],
      "expanded": true
    }
  ]
}

Important:
- Extract real chapter and topic names from the content
- Estimate reasonable study hours (0.5-4 hours per topic)
- Set all topics as selected: true
- Set all chapters as expanded: true
- Generate unique IDs like ch_1, ch_2, topic_1, topic_2, etc.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("Empty AI response");
    }

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedSyllabus;
    
    // Validate structure
    if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
      throw new Error("Invalid parsed structure");
    }

    console.log(`AI parsed ${parsed.chapters.length} chapters`);
    return parsed;

  } catch (error) {
    console.error("AI parsing failed, using fallback:", error);
    return parseTextContent(text, subject);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textContent, fileUrl, subject = "General" } = await req.json();

    let contentToProcess = textContent || "";

    // If PDF URL provided, fetch and extract text (basic extraction)
    if (fileUrl && !textContent) {
      console.log("PDF URL provided, attempting to process...");
      // For now, we'll just note that PDFs need client-side extraction
      // In production, you'd use a PDF parsing library
      contentToProcess = "Unable to extract PDF content server-side. Please copy and paste the syllabus text.";
    }

    if (!contentToProcess || contentToProcess.length < 10) {
      throw new Error("No valid content to parse");
    }

    console.log(`Parsing syllabus for subject: ${subject}, content length: ${contentToProcess.length}`);

    // Try AI parsing first, fallback to text parsing
    const result = await parseWithAI(contentToProcess, subject);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Parse syllabus error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to parse syllabus" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
