import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Finance-related keywords for detection
const FINANCE_KEYWORDS = [
  "insurance",
  "emi",
  "loan",
  "premium",
  "rent",
  "salary",
  "investment",
  "tax",
  "form 16",
  "80c",
  "80d",
  "hra",
  "mutual fund",
  "sip",
  "policy",
  "claim",
  "deduction",
  "refund",
  "interest",
  "principal",
  "payment",
  "due",
  "renewal",
];

// Memory-related keywords
const MEMORY_KEYWORDS = [
  "birthday",
  "anniversary",
  "wedding",
  "vacation",
  "trip",
  "celebration",
  "achievement",
  "milestone",
  "graduation",
  "promotion",
];

// Extract currency amounts (INR and USD)
function extractAmounts(text: string): string[] {
  const patterns = [
    /₹\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, // ₹1,00,000 or ₹1000.00
    /Rs\.?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi, // Rs. 1,00,000
    /INR\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi, // INR 1,00,000
    /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, // $1,000.00
  ];
  
  const amounts: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) amounts.push(...matches);
  }
  return [...new Set(amounts)]; // Remove duplicates
}

// Extract dates in various formats
function extractDates(text: string): string[] {
  const patterns = [
    /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g, // 01/01/2024 or 01-01-2024
    /\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?\d{2,4}\b/gi, // 14 Jan 2024
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{1,2},?\s?\d{2,4}\b/gi, // Jan 14, 2024
    /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/g, // 2024-01-14
  ];
  
  const dates: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) dates.push(...matches);
  }
  return [...new Set(dates)];
}

// Detect keywords in text
function detectKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase()));
}

// Build suggestions based on detected entities
function buildSuggestions(
  amounts: string[],
  dates: string[],
  financeKeywords: string[],
  memoryKeywords: string[]
): any[] {
  const suggestions: any[] = [];

  // Finance link suggestion
  if (amounts.length > 0 && financeKeywords.length > 0) {
    suggestions.push({
      type: "finance_link",
      reason: `Amount (${amounts[0]}) and finance keyword (${financeKeywords[0]}) detected`,
      confidence: "medium",
      detectedAmount: amounts[0],
      detectedKeyword: financeKeywords[0],
    });
  }

  // Timeline/Memory suggestion
  if (dates.length > 0) {
    const hasMemoryContext = memoryKeywords.length > 0;
    suggestions.push({
      type: hasMemoryContext ? "memory_link" : "timeline_link",
      reason: hasMemoryContext 
        ? `Date (${dates[0]}) and memory keyword (${memoryKeywords[0]}) detected`
        : `Date (${dates[0]}) detected`,
      confidence: hasMemoryContext ? "medium" : "low",
      detectedDate: dates[0],
      detectedKeyword: memoryKeywords[0] || null,
    });
  }

  // Insurance-specific suggestion
  if (financeKeywords.some(k => ["insurance", "premium", "policy", "claim"].includes(k))) {
    suggestions.push({
      type: "insurance_link",
      reason: "Insurance-related content detected",
      confidence: "high",
    });
  }

  // Loan-specific suggestion
  if (financeKeywords.some(k => ["emi", "loan", "interest", "principal"].includes(k))) {
    suggestions.push({
      type: "loan_link",
      reason: "Loan-related content detected",
      confidence: "high",
    });
  }

  // Tax-specific suggestion
  if (financeKeywords.some(k => ["tax", "form 16", "80c", "80d", "hra", "deduction"].includes(k))) {
    suggestions.push({
      type: "tax_link",
      reason: "Tax-related content detected",
      confidence: "high",
    });
  }

  return suggestions;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, noteType } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract entities
    const amounts = extractAmounts(content);
    const dates = extractDates(content);
    const financeKeywords = detectKeywords(content, FINANCE_KEYWORDS);
    const memoryKeywords = detectKeywords(content, MEMORY_KEYWORDS);

    // Build suggestions
    const suggestions = buildSuggestions(amounts, dates, financeKeywords, memoryKeywords);

    // Return analysis results
    const result = {
      detected: {
        amounts,
        dates,
        keywords: [...financeKeywords, ...memoryKeywords],
        financeKeywords,
        memoryKeywords,
      },
      suggestions,
      noteType: noteType || "unknown",
      analyzedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing note:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze note" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
