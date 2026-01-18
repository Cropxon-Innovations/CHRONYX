import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { NoteData, NoteCard } from "./NoteCard";
import { getNoteTypeConfig } from "./NoteTypeSelector";
import { Calendar, Clock } from "lucide-react";

interface NotesTimelineProps {
  notes: NoteData[];
  onEditNote: (note: NoteData) => void;
  onPinNote: (note: NoteData) => void;
  onArchiveNote: (note: NoteData) => void;
  onDeleteNote: (note: NoteData) => void;
}

interface TimelineGroup {
  label: string;
  notes: NoteData[];
}

export const NotesTimeline = ({
  notes,
  onEditNote,
  onPinNote,
  onArchiveNote,
  onDeleteNote,
}: NotesTimelineProps) => {
  // Group notes by time period
  const groupNotesByTime = (): TimelineGroup[] => {
    const groups: Record<string, NoteData[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    notes.forEach((note) => {
      const date = new Date(note.updated_at);
      if (isToday(date)) {
        groups.today.push(note);
      } else if (isYesterday(date)) {
        groups.yesterday.push(note);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(note);
      } else if (isThisMonth(date)) {
        groups.thisMonth.push(note);
      } else {
        groups.older.push(note);
      }
    });

    const result: TimelineGroup[] = [];
    if (groups.today.length > 0) result.push({ label: "Today", notes: groups.today });
    if (groups.yesterday.length > 0) result.push({ label: "Yesterday", notes: groups.yesterday });
    if (groups.thisWeek.length > 0) result.push({ label: "This Week", notes: groups.thisWeek });
    if (groups.thisMonth.length > 0) result.push({ label: "This Month", notes: groups.thisMonth });
    if (groups.older.length > 0) result.push({ label: "Older", notes: groups.older });

    return result;
  };

  const timelineGroups = groupNotesByTime();

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No notes yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first note to see it in the timeline
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {timelineGroups.map((group, groupIndex) => (
        <div key={group.label} className="relative">
          {/* Timeline Line */}
          {groupIndex < timelineGroups.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />
          )}

          {/* Group Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {group.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-11">
            {group.notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => onEditNote(note)}
                onPin={() => onPinNote(note)}
                onArchive={() => onArchiveNote(note)}
                onDelete={() => onDeleteNote(note)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
