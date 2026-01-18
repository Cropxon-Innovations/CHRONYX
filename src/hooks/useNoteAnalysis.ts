import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DetectedEntity {
  type: "amount" | "date" | "keyword" | "entity";
  value: string;
  confidence: "high" | "medium" | "low";
  suggestedLink?: {
    type: string;
    label: string;
    id?: string;
  };
}

interface AnalysisResult {
  detected: {
    amounts: string[];
    dates: string[];
    keywords: string[];
    financeKeywords: string[];
    memoryKeywords: string[];
  };
  suggestions: {
    type: string;
    reason: string;
    confidence: string;
    detectedAmount?: string;
    detectedDate?: string;
    detectedKeyword?: string;
  }[];
}

export const useNoteAnalysis = (debounceMs = 1000) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedEntities, setDetectedEntities] = useState<DetectedEntity[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert analysis result to detected entities for UI
  const convertToEntities = useCallback((result: AnalysisResult): DetectedEntity[] => {
    const entities: DetectedEntity[] = [];

    // Add amounts
    result.detected.amounts.forEach((amount) => {
      const suggestion = result.suggestions.find(
        (s) => s.type === "finance_link" || s.type === "insurance_link" || s.type === "loan_link"
      );
      entities.push({
        type: "amount",
        value: amount,
        confidence: (suggestion?.confidence as "high" | "medium" | "low") || "low",
        suggestedLink: suggestion
          ? {
              type: suggestion.type.replace("_link", ""),
              label: suggestion.type === "insurance_link"
                ? "Insurance Policy"
                : suggestion.type === "loan_link"
                ? "Loan/EMI"
                : "Finance Record",
            }
          : undefined,
      });
    });

    // Add dates
    result.detected.dates.forEach((date) => {
      const suggestion = result.suggestions.find(
        (s) => s.type === "timeline_link" || s.type === "memory_link"
      );
      entities.push({
        type: "date",
        value: date,
        confidence: (suggestion?.confidence as "high" | "medium" | "low") || "low",
        suggestedLink: suggestion
          ? {
              type: suggestion.type.replace("_link", ""),
              label: suggestion.type === "memory_link" ? "Memory" : "Timeline Event",
            }
          : undefined,
      });
    });

    // Add keywords as entities
    result.detected.keywords.slice(0, 3).forEach((keyword) => {
      entities.push({
        type: "keyword",
        value: keyword,
        confidence: "medium",
      });
    });

    return entities;
  }, []);

  // Analyze note content
  const analyzeNote = useCallback(async (content: string, noteType?: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't analyze very short content
    if (content.length < 10) {
      setDetectedEntities([]);
      setLastAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    abortControllerRef.current = new AbortController();

    try {
      const { data, error } = await supabase.functions.invoke("analyze-note", {
        body: { content, noteType },
      });

      if (error) throw error;

      const result = data as AnalysisResult;
      setLastAnalysis(result);
      setDetectedEntities(convertToEntities(result));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Note analysis error:", err);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [convertToEntities]);

  // Debounced analysis
  const debouncedAnalyze = useCallback(
    (content: string, noteType?: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        analyzeNote(content, noteType);
      }, debounceMs);
    },
    [analyzeNote, debounceMs]
  );

  // Clear analysis
  const clearAnalysis = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setDetectedEntities([]);
    setLastAnalysis(null);
    setIsAnalyzing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isAnalyzing,
    detectedEntities,
    lastAnalysis,
    analyzeNote: debouncedAnalyze,
    clearAnalysis,
    setDetectedEntities,
  };
};
