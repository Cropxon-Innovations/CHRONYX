import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, Clock } from "lucide-react";

interface CurrentStudyItem {
  id: string;
  title: string;
  author?: string;
  type: "book" | "topic" | "document";
  currentPage?: number;
  totalPages?: number;
  subject?: string;
  lastStudiedAt?: string;
}

interface FocusContextCardProps {
  currentItem?: CurrentStudyItem | null;
  onContinue?: () => void;
  onStartSession?: () => void;
  className?: string;
}

export const FocusContextCard = ({
  currentItem,
  onContinue,
  onStartSession,
  className,
}: FocusContextCardProps) => {
  if (!currentItem) {
    return (
      <div className={cn(
        "bg-card border border-border rounded-2xl p-8 text-center",
        className
      )}>
        <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          What would you like to study?
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Begin when you're ready. No pressure.
        </p>
        <Button onClick={onStartSession} className="gap-2">
          <Play className="w-4 h-4" />
          Start Focus Session
        </Button>
      </div>
    );
  }

  const progress = currentItem.totalPages && currentItem.currentPage
    ? Math.round((currentItem.currentPage / currentItem.totalPages) * 100)
    : null;

  return (
    <div className={cn(
      "bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-6",
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {currentItem.type === "book" ? "Currently Reading" : "Currently Studying"}
          </p>
          
          <h2 className="text-xl font-medium text-foreground mb-1 truncate">
            {currentItem.title}
          </h2>
          
          {currentItem.author && (
            <p className="text-sm text-muted-foreground mb-3">
              {currentItem.author}
            </p>
          )}
          
          {currentItem.subject && (
            <p className="text-sm text-muted-foreground mb-3">
              {currentItem.subject}
            </p>
          )}

          {/* Progress */}
          {progress !== null && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                Page {currentItem.currentPage} of {currentItem.totalPages}
              </span>
            </div>
          )}
        </div>

        {/* Book cover placeholder */}
        {currentItem.type === "book" && (
          <div className="w-16 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-2">
        <Button onClick={onContinue} variant="secondary" className="gap-2">
          <BookOpen className="w-4 h-4" />
          {currentItem.type === "book" ? "Continue Reading" : "Resume Study"}
        </Button>
        <Button onClick={onStartSession} variant="outline" className="gap-2">
          <Clock className="w-4 h-4" />
          Start Focus Session
        </Button>
      </div>
    </div>
  );
};
