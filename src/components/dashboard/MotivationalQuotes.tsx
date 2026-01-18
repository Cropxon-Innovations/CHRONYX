import { useState, useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Sparkles, PenTool } from "lucide-react";

// Static quotes for free plan (beautiful, timeless)
const FREE_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
];

// Backup quotes if AI fails
const BACKUP_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
];

interface Quote {
  text: string;
  author: string;
}

export const MotivationalQuotes = () => {
  const { isPro } = useSubscription();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Fetch AI quote for Pro users
  const fetchAIQuote = async (): Promise<Quote> => {
    try {
      const { data, error } = await supabase.functions.invoke('chronyx-bot', {
        body: {
          message: "Generate a single unique, inspiring motivational quote about life, success, learning, or personal growth. Return only the quote text and author name in format: 'quote text' - Author Name. Be creative and original.",
          context: "motivational_quote"
        }
      });

      if (error || !data?.response) {
        throw new Error("AI unavailable");
      }

      // Parse the response
      const response = data.response;
      const match = response.match(/"([^"]+)"\s*[-–—]\s*(.+)/);
      if (match) {
        return { text: match[1], author: match[2].trim() };
      }
      
      // Alternative parsing
      const parts = response.split(/[-–—]/);
      if (parts.length >= 2) {
        return { 
          text: parts[0].replace(/[""]/g, '').trim(), 
          author: parts.slice(1).join('-').trim() 
        };
      }

      throw new Error("Parse failed");
    } catch (error) {
      // Return a random backup quote
      return BACKUP_QUOTES[Math.floor(Math.random() * BACKUP_QUOTES.length)];
    }
  };

  // Get quote based on plan
  const getQuote = async () => {
    if (isPro()) {
      // Pro users get AI-generated quotes
      const newQuote = await fetchAIQuote();
      setQuote(newQuote);
    } else {
      // Free users cycle through static quotes
      const newQuote = FREE_QUOTES[quoteIndex % FREE_QUOTES.length];
      setQuote(newQuote);
      setQuoteIndex((prev) => (prev + 1) % FREE_QUOTES.length);
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (!quote) return;

    setDisplayText("");
    setIsTyping(true);
    let charIndex = 0;
    const fullText = `"${quote.text}"`;

    // Clear any existing typing animation
    if (typingRef.current) {
      clearInterval(typingRef.current);
    }

    typingRef.current = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        if (typingRef.current) {
          clearInterval(typingRef.current);
        }
      }
    }, 40); // Typing speed

    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
      }
    };
  }, [quote]);

  // Initial load and 30-minute interval
  useEffect(() => {
    getQuote();

    // Refresh every 30 minutes for Pro, never for free (they keep cycling on demand)
    if (isPro()) {
      intervalRef.current = setInterval(getQuote, 30 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPro()]);

  if (!quote) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 dark:from-primary/10 dark:via-primary/5 dark:to-accent/10 border border-primary/10 p-4 sm:p-6">
      {/* Decorative elements */}
      <div className="absolute top-2 right-2 opacity-20">
        <PenTool className="w-5 h-5 text-primary rotate-45" />
      </div>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />

      {/* Quote content */}
      <div className="relative z-10">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary/60 mt-1 flex-shrink-0" />
          <div className="min-h-[3rem] sm:min-h-[2.5rem]">
            <p className="text-sm sm:text-base font-serif italic text-foreground/90 leading-relaxed">
              {displayText}
              <span 
                className={cn(
                  "inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle transition-opacity",
                  showCursor && isTyping ? "opacity-100" : "opacity-0"
                )}
              />
            </p>
          </div>
        </div>
        
        {/* Author - appears after typing completes */}
        <div 
          className={cn(
            "flex items-center justify-end gap-2 mt-3 transition-all duration-500",
            isTyping ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            — {quote.author}
          </span>
        </div>
      </div>

      {/* Pro badge */}
      {isPro() && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-primary/40">
          <Sparkles className="w-3 h-3" />
          <span>AI Generated</span>
        </div>
      )}
    </div>
  );
};
