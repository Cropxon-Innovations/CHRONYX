import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { NoteData } from "./NoteCard";
import { StickyNoteCard, StickyColor } from "./StickyNoteCard";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickNotesGridProps {
  notes: NoteData[];
  onNoteClick: (note: NoteData) => void;
  onCreateQuickNote: () => void;
}

export const QuickNotesGrid = ({
  notes,
  onNoteClick,
  onCreateQuickNote,
}: QuickNotesGridProps) => {
  // Filter only quick notes
  const quickNotes = useMemo(() => {
    return notes.filter((n) => n.type === "quick_note" && !n.is_archived);
  }, [notes]);

  // Separate pinned and unpinned
  const pinnedNotes = quickNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = quickNotes.filter((n) => !n.is_pinned);

  // Sort by updated_at for temporal layout
  const sortedUnpinned = [...unpinnedNotes].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Assign varied colors for visual interest
  const colorCycle: StickyColor[] = ["sand", "sage", "sky", "lavender", "peach", "slate"];

  if (quickNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-amber-100/50 dark:bg-amber-900/20 mb-4">
          <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No quick notes yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quick notes appear as colorful sticky pads
        </p>
        <Button onClick={onCreateQuickNote} variant="outline" className="gap-2">
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
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            📌 Pinned
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pinnedNotes.map((note, index) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteClick(note)}
                colorOverride={colorCycle[index % colorCycle.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Card + Recent Notes */}
      <div>
        {pinnedNotes.length > 0 && (
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Recent
          </h3>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Quick Add Card */}
          <button
            onClick={onCreateQuickNote}
            className={cn(
              "flex flex-col items-center justify-center",
              "min-h-[120px] p-4 rounded-2xl",
              "border-2 border-dashed border-border/60",
              "hover:border-primary/50 hover:bg-primary/5",
              "transition-all duration-200 group"
            )}
          >
            <div className="p-2 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors mb-2">
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Quick Note
            </span>
          </button>

          {/* Notes */}
          {sortedUnpinned.map((note, index) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              onClick={() => onNoteClick(note)}
              colorOverride={colorCycle[(index + pinnedNotes.length) % colorCycle.length]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
