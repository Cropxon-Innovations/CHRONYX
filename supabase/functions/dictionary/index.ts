import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DictionaryRequest {
  word: string;
  targetLanguage?: string;
}

interface DictionaryResponse {
  word: string;
  meaning: string;
  phonetic: string;
  audioUrl?: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  translation?: string;
  partOfSpeech?: string;
}

// Free Dictionary API
async function fetchDictionary(word: string): Promise<Partial<DictionaryResponse>> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      console.log("Dictionary API returned:", response.status);
      return {};
    }
    
    const data = await response.json();
    if (!data || data.length === 0) return {};
    
    const entry = data[0];
    const meaning = entry.meanings?.[0];
    const definition = meaning?.definitions?.[0];
    
    return {
      phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "",
      audioUrl: entry.phonetics?.find((p: any) => p.audio)?.audio || "",
      meaning: definition?.definition || "",
      synonyms: meaning?.synonyms?.slice(0, 5) || [],
      antonyms: meaning?.antonyms?.slice(0, 5) || [],
      examples: definition?.example ? [definition.example] : [],
      partOfSpeech: meaning?.partOfSpeech || "",
    };
  } catch (error) {
    console.error("Dictionary fetch error:", error);
    return {};
  }
}

// Translate using Lovable AI
async function translateWord(word: string, meaning: string, targetLang: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return "";
  }

  const langMap: Record<string, string> = {
    'or': 'Odia',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'te': 'Telugu',
    'ta': 'Tamil',
    'ml': 'Malayalam',
  };

  const targetLanguage = langMap[targetLang] || targetLang;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a translator. Translate the given English word and its meaning to ${targetLanguage}. Return ONLY the translation of the word, nothing else.`
          },
          {
            role: "user",
            content: `Translate "${word}" (meaning: ${meaning}) to ${targetLanguage}. Return only the translated word.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, targetLanguage }: DictionaryRequest = await req.json();

    if (!word || typeof word !== 'string') {
      return new Response(
        JSON.stringify({ error: "Word is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Looking up word: ${word}, target language: ${targetLanguage || 'none'}`);

    // Fetch dictionary data
    const dictData = await fetchDictionary(word.toLowerCase().trim());

    const result: DictionaryResponse = {
      word: word.toLowerCase().trim(),
      meaning: dictData.meaning || "Definition not found",
      phonetic: dictData.phonetic || "",
      audioUrl: dictData.audioUrl || "",
      synonyms: dictData.synonyms || [],
      antonyms: dictData.antonyms || [],
      examples: dictData.examples || [],
      partOfSpeech: dictData.partOfSpeech || "",
    };

    // Translate if target language specified
    if (targetLanguage && dictData.meaning) {
      result.translation = await translateWord(word, dictData.meaning, targetLanguage);
    }

    console.log(`Dictionary result for "${word}":`, JSON.stringify(result).slice(0, 200));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dictionary function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
