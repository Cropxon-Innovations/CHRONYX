import { useState, useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

// Static quotes pool - different quotes on refresh
const QUOTES_POOL = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
];

interface Quote {
  text: string;
  author: string;
}

export const HeaderQuote = () => {
  const { isPro } = useSubscription();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      // Return a random quote from pool
      return QUOTES_POOL[Math.floor(Math.random() * QUOTES_POOL.length)];
    }
  };

  // Get quote - random on each page load/refresh
  const getQuote = async () => {
    if (isPro()) {
      const newQuote = await fetchAIQuote();
      setQuote(newQuote);
    } else {
      // Free users get random quote from pool on each load
      const randomIndex = Math.floor(Math.random() * QUOTES_POOL.length);
      setQuote(QUOTES_POOL[randomIndex]);
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (!quote) return;

    setDisplayText("");
    setIsTyping(true);
    let charIndex = 0;
    const fullText = `"${quote.text}"`;

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
    }, 35);

    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
      }
    };
  }, [quote]);

  // Initial load and 30-minute interval for Pro
  useEffect(() => {
    getQuote();

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
    <div className="flex-1 max-w-xl mx-4 overflow-hidden">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs font-serif italic text-muted-foreground truncate">
            {displayText}
            <span 
              className={cn(
                "inline-block w-0.5 h-3 bg-primary/60 ml-0.5 align-middle transition-opacity",
                showCursor && isTyping ? "opacity-100" : "opacity-0"
              )}
            />
            {!isTyping && (
              <span className="text-muted-foreground/60 ml-2">— {quote.author}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeaderQuote;
