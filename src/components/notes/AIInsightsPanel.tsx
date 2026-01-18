import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Link2,
  Calendar,
  IndianRupee,
  Check,
  X,
  Loader2,
} from "lucide-react";

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

interface AIInsightsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  detectedEntities: DetectedEntity[];
  isAnalyzing: boolean;
  onAcceptLink: (entity: DetectedEntity) => void;
  onIgnoreEntity: (entity: DetectedEntity) => void;
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case "amount":
      return IndianRupee;
    case "date":
      return Calendar;
    default:
      return Link2;
  }
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case "high":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const AIInsightsPanel = ({
  isOpen,
  onToggle,
  detectedEntities,
  isAnalyzing,
  onAcceptLink,
  onIgnoreEntity,
}: AIInsightsPanelProps) => {
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "flex items-center gap-1 px-2 py-3 rounded-l-xl",
          "bg-card border border-r-0 border-border shadow-lg",
          "hover:bg-accent/50 transition-all duration-200",
          isOpen && "translate-x-80"
        )}
      >
        <Sparkles className="w-4 h-4 text-primary" />
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 z-30",
          "bg-card border-l border-border shadow-xl",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Insights</h3>
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-auto h-[calc(100%-57px)]">
          {detectedEntities.length === 0 && !isAnalyzing ? (
            <div className="text-center py-8">
              <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Start typing to see AI insights
              </p>
            </div>
          ) : (
            <>
              {/* Detected Section */}
              {detectedEntities.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Detected
                  </h4>
                  <div className="space-y-2">
                    {detectedEntities.map((entity, index) => {
                      const Icon = getEntityIcon(entity.type);
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground truncate">
                                {entity.value}
                              </span>
                              <span
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-full",
                                  getConfidenceColor(entity.confidence)
                                )}
                              >
                                {entity.confidence}
                              </span>
                            </div>
                            {entity.suggestedLink && (
                              <p className="text-xs text-muted-foreground mb-2">
                                CHRONYX noticed this may relate to{" "}
                                <span className="font-medium text-foreground">
                                  {entity.suggestedLink.label}
                                </span>
                              </p>
                            )}
                            {entity.suggestedLink && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => onAcceptLink(entity)}
                                >
                                  <Check className="w-3 h-3" />
                                  Link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => onIgnoreEntity(entity)}
                                >
                                  <X className="w-3 h-3" />
                                  Ignore
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Privacy Note */}
          <div className="mt-6 p-3 rounded-xl bg-muted/20 border border-border/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium">Privacy:</span> AI analysis runs locally when possible. 
              Your notes are never used for training.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
