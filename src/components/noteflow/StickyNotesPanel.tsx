import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Pin, Trash2, ArrowUpRight, Sparkles, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface StickyNote {
  id: string;
  content: string;
  color: StickyColor;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type StickyColor = "yellow" | "green" | "blue" | "pink" | "orange" | "purple";

interface StickyNotesPanelProps {
  notes: StickyNote[];
  onCreateNote: () => void;
  onEditNote: (id: string) => void;
  onPinNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onConvertToFull: (id: string) => void;
}

const STICKY_COLORS: Record<StickyColor, { bg: string; border: string; text: string }> = {
  yellow: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700",
    text: "text-amber-900 dark:text-amber-100",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-100",
  },
  blue: {
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-700",
    text: "text-sky-900 dark:text-sky-100",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-700",
    text: "text-pink-900 dark:text-pink-100",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700",
    text: "text-orange-900 dark:text-orange-100",
  },
  purple: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-700",
    text: "text-violet-900 dark:text-violet-100",
  },
};

const StickyNoteCard = ({
  note,
  onEdit,
  onPin,
  onDelete,
  onConvert,
}: {
  note: StickyNote;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
  onConvert: () => void;
}) => {
  const colors = STICKY_COLORS[note.color];

  const formatDate = (date: Date) => {
    if (isToday(date)) return format(date, "'Today' h:mm a");
    if (isYesterday(date)) return format(date, "'Yesterday' h:mm a");
    return format(date, "MMM d, h:mm a");
  };

  return (
    <div
      className={cn(
        "group relative p-4 rounded-2xl border-2 cursor-pointer",
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        "min-h-[120px]",
        colors.bg,
        colors.border
      )}
      onClick={onEdit}
    >
      {/* Pin indicator */}
      {note.isPinned && (
        <div className="absolute -top-1.5 -right-1.5">
          <div className="p-1 rounded-full bg-primary text-primary-foreground shadow-md">
            <Pin className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Content */}
      <p
        className={cn(
          "text-sm line-clamp-4 leading-relaxed font-medium",
          colors.text
        )}
      >
        {note.content || "Empty note..."}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/70">
          {formatDate(note.updatedAt)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
          >
            <Pin className={cn("w-3 h-3", note.isPinned && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onConvert();
            }}
          >
            <ArrowUpRight className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const QuickCaptureCard = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center",
      "min-h-[120px] p-4 rounded-2xl",
      "border-2 border-dashed border-border/60",
      "hover:border-primary/50 hover:bg-primary/5",
      "transition-all duration-300 group"
    )}
  >
    <div className="p-3 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors mb-2">
      <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
      Quick Note
    </span>
  </button>
);

export const StickyNotesPanel = ({
  notes,
  onCreateNote,
  onEditNote,
  onPinNote,
  onDeleteNote,
  onConvertToFull,
}: StickyNotesPanelProps) => {
  const pinnedNotes = useMemo(
    () => notes.filter((n) => n.isPinned),
    [notes]
  );
  const unpinnedNotes = useMemo(
    () =>
      notes
        .filter((n) => !n.isPinned)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [notes]
  );

  const colorCycle: StickyColor[] = ["yellow", "green", "blue", "pink", "orange", "purple"];

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No quick notes yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quick notes appear as colorful sticky pads
        </p>
        <Button onClick={onCreateNote} variant="outline" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Create Quick Note
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Pin className="w-3.5 h-3.5" />
            Pinned
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pinnedNotes.map((note, index) => (
              <StickyNoteCard
                key={note.id}
                note={{ ...note, color: colorCycle[index % colorCycle.length] }}
                onEdit={() => onEditNote(note.id)}
                onPin={() => onPinNote(note.id)}
                onDelete={() => onDeleteNote(note.id)}
                onConvert={() => onConvertToFull(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Notes */}
      <div>
        {pinnedNotes.length > 0 && (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent
          </h3>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <QuickCaptureCard onClick={onCreateNote} />
          {unpinnedNotes.map((note, index) => (
            <StickyNoteCard
              key={note.id}
              note={{
                ...note,
                color: colorCycle[(index + pinnedNotes.length) % colorCycle.length],
              }}
              onEdit={() => onEditNote(note.id)}
              onPin={() => onPinNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
              onConvert={() => onConvertToFull(note.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
