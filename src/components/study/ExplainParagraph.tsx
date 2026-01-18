import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lightbulb, BookmarkPlus, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExplainParagraphProps {
  paragraphText: string;
  libraryItemId?: string;
  chapterIndex?: number;
  position: { x: number; y: number };
  onClose: () => void;
  onSaveToNotes?: (text: string, explanation: string) => void;
}

export const ExplainParagraph = ({
  paragraphText,
  libraryItemId,
  chapterIndex,
  position,
  onClose,
  onSaveToNotes,
}: ExplainParagraphProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Adjust position to keep card in viewport
  const getAdjustedPosition = () => {
    const cardWidth = 360;
    const cardHeight = 300;
    const padding = 16;
    
    let x = position.x;
    let y = position.y + 10;
    
    if (typeof window !== 'undefined') {
      if (x + cardWidth > window.innerWidth - padding) {
        x = window.innerWidth - cardWidth - padding;
      }
      if (x < padding) x = padding;
      
      if (y + cardHeight > window.innerHeight - padding) {
        y = position.y - cardHeight - 10;
      }
      if (y < padding) y = padding;
    }
    
    return { x, y };
  };

  const adjustedPos = getAdjustedPosition();

  const fetchExplanation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('explain-paragraph', {
        body: {
          paragraphText,
          libraryItemId,
          chapterIndex,
          saveToExplanations: true,
        },
      });

      if (error) throw error;
      setExplanation(data.explanation_text);
    } catch (error: any) {
      console.error('Explanation error:', error);
      toast({
        title: "Failed to explain",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotes = () => {
    if (explanation && onSaveToNotes) {
      onSaveToNotes(paragraphText, explanation);
      setIsSaved(true);
      toast({
        title: "Saved to Notes",
        description: "Explanation added to your study notes",
      });
    }
  };

  return (
    <Card
      className={cn(
        "fixed z-[100] w-[360px] max-h-[80vh] overflow-hidden shadow-2xl border-2",
        "bg-background/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      )}
      style={{ 
        left: adjustedPos.x, 
        top: adjustedPos.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-sm">Explain</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      <CardContent className="p-4">
        {/* Selected text preview */}
        <div className="p-2 bg-muted/50 rounded-md mb-3 max-h-20 overflow-hidden">
          <p className="text-xs text-muted-foreground line-clamp-3">
            "{paragraphText.slice(0, 200)}..."
          </p>
        </div>

        {!explanation && !isLoading && (
          <Button onClick={fetchExplanation} className="w-full">
            <Lightbulb className="w-4 h-4 mr-2" />
            Explain This
          </Button>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing...</p>
          </div>
        )}

        {explanation && !isLoading && (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto">
              {explanation.split("\n").map((line, i) => (
                <p key={i} className="text-sm leading-relaxed">{line}</p>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToNotes}
                disabled={isSaved}
                className="flex-1"
              >
                {isSaved ? (
                  <>
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Saved
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 mr-1" />
                    Save to Notes
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
