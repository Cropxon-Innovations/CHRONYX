import { useMemo } from "react";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { NoteData } from "./NoteCard";
import { getNoteTypeConfig } from "./NoteTypeSelector";
import { getEmotionConfig } from "./EmotionSelector";
import { Pin, Link2 } from "lucide-react";

// Muted, elegant sticky note colors
export const STICKY_COLORS = {
  sand: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200/60 dark:border-amber-800/40",
    shadow: "shadow-amber-100/50 dark:shadow-amber-900/20",
  },
  sage: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    shadow: "shadow-emerald-100/50 dark:shadow-emerald-900/20",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200/60 dark:border-sky-800/40",
    shadow: "shadow-sky-100/50 dark:shadow-sky-900/20",
  },
  lavender: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200/60 dark:border-violet-800/40",
    shadow: "shadow-violet-100/50 dark:shadow-violet-900/20",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-900/60",
    border: "border-slate-200/60 dark:border-slate-700/40",
    shadow: "shadow-slate-100/50 dark:shadow-slate-900/20",
  },
  peach: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200/60 dark:border-orange-800/40",
    shadow: "shadow-orange-100/50 dark:shadow-orange-900/20",
  },
} as const;

export type StickyColor = keyof typeof STICKY_COLORS;

// Assign colors based on note type
const getColorForType = (type: string): StickyColor => {
  const colorMap: Record<string, StickyColor> = {
    quick_note: "sand",
    journal: "lavender",
    document: "slate",
    finance_note: "sage",
    memory_note: "sky",
    tax_note: "peach",
    story: "lavender",
  };
  return colorMap[type] || "sand";
};

// Determine size based on content length
const getStickySize = (textLength: number): "small" | "medium" | "large" => {
  if (textLength < 140) return "small";
  if (textLength <= 400) return "medium";
  return "large";
};

// Format time in a friendly way
const getTimeLabel = (date: string): string => {
  const d = new Date(date);
  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  if (isYesterday(d)) {
    return "Yesterday";
  }
  if (isThisWeek(d)) {
    return format(d, "EEEE");
  }
  return format(d, "MMM d");
};

// Calculate visual age (opacity reduction)
const getAgeOpacity = (date: string): number => {
  const d = new Date(date);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 1) return 1;
  if (daysDiff < 3) return 0.95;
  if (daysDiff < 7) return 0.9;
  if (daysDiff < 14) return 0.85;
  return 0.8;
};

interface StickyNoteCardProps {
  note: NoteData;
  onClick: () => void;
  colorOverride?: StickyColor;
}

export const StickyNoteCard = ({ note, onClick, colorOverride }: StickyNoteCardProps) => {
  const color = colorOverride || (note.color as StickyColor) || getColorForType(note.type);
  const colorStyles = STICKY_COLORS[color];
  const typeConfig = getNoteTypeConfig(note.type || "quick_note");
  const TypeIcon = typeConfig.icon;
  const emotionConfig = note.emotion ? getEmotionConfig(note.emotion) : null;
  
  // Extract text from content_json
  const previewText = useMemo(() => {
    if (note.content_json) {
      try {
        let json = note.content_json;
        if (typeof json === 'string') {
          json = JSON.parse(json);
          if (typeof json === 'string') json = JSON.parse(json);
        }
        return extractText(json).trim();
      } catch {
        return "";
      }
    }
    return note.content || "";
  }, [note.content_json, note.content]);

  const size = getStickySize(previewText.length);
  const timeLabel = getTimeLabel(note.updated_at);
  const ageOpacity = getAgeOpacity(note.updated_at);
  const linkedCount = note.linked_entities?.length || 0;

  const sizeClasses = {
    small: "min-h-[120px] max-h-[160px]",
    medium: "min-h-[160px] max-h-[220px]",
    large: "min-h-[200px] max-h-[280px]",
  };

  return (
    <div
      onClick={onClick}
      style={{ opacity: ageOpacity }}
      className={cn(
        "group relative flex flex-col p-4 cursor-pointer",
        "rounded-2xl border-2 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1",
        colorStyles.bg,
        colorStyles.border,
        colorStyles.shadow,
        "shadow-lg",
        sizeClasses[size]
      )}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-card border border-border shadow-md">
          <Pin className="w-3 h-3 text-primary" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <TypeIcon className={cn("w-3.5 h-3.5", typeConfig.color)} />
          <span className="text-xs font-medium text-muted-foreground/80">
            {typeConfig.label}
          </span>
        </div>
        {emotionConfig && (
          <emotionConfig.icon className={cn("w-4 h-4", emotionConfig.color)} />
        )}
      </div>

      {/* Title */}
      {note.title && (
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1.5">
          {note.title}
        </h3>
      )}

      {/* Content Preview */}
      <p className={cn(
        "text-sm text-foreground/80 flex-1 overflow-hidden",
        size === "small" ? "line-clamp-2" : size === "medium" ? "line-clamp-4" : "line-clamp-6"
      )}>
        {previewText}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
        <span className="text-xs text-muted-foreground/70">{timeLabel}</span>
        {linkedCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <Link2 className="w-3 h-3" />
            {linkedCount}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to extract text from TipTap JSON
function extractText(node: any): string {
  if (!node) return "";
  if (typeof node === 'string') return node;
  if (node.text) return node.text + " ";
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join("");
  }
  return "";
}
