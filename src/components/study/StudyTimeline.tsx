import { format, parseISO, isToday, isYesterday, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, BookOpen, FileText, MessageSquare } from "lucide-react";

interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  duration: number;
  date: string;
  focus_level?: string;
  notes?: string;
  is_timer_session?: boolean;
}

interface TimelineNote {
  id: string;
  content: string;
  date: string;
  linked_session_id?: string;
}

interface TimelineEntry {
  type: "session" | "note" | "reading";
  data: StudySession | TimelineNote | any;
  timestamp: string;
}

interface StudyTimelineProps {
  sessions: StudySession[];
  notes?: TimelineNote[];
  className?: string;
}

// Group entries by date
const groupByDate = (entries: TimelineEntry[]) => {
  const groups: Record<string, TimelineEntry[]> = {};
  
  entries.forEach((entry) => {
    const date = entry.timestamp.split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  });
  
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a)) // Sort dates descending
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    }));
};

// Format date header
const formatDateHeader = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const days = differenceInDays(new Date(), date);
  if (days < 7) return format(date, "EEEE");
  return format(date, "MMMM d, yyyy");
};

// Format time
const formatTime = (dateStr: string) => {
  return format(parseISO(dateStr), "h:mm a");
};

// Focus level colors
const focusColors: Record<string, string> = {
  low: "bg-stone-300 dark:bg-stone-600",
  medium: "bg-slate-400 dark:bg-slate-500",
  high: "bg-emerald-400/70 dark:bg-emerald-600/50",
};

export const StudyTimeline = ({
  sessions,
  notes = [],
  className,
}: StudyTimelineProps) => {
  // Convert sessions to timeline entries
  const entries: TimelineEntry[] = [
    ...sessions.map((s) => ({
      type: "session" as const,
      data: s,
      timestamp: `${s.date}T12:00:00`, // Use noon as default time if no time specified
    })),
    ...notes.map((n) => ({
      type: "note" as const,
      data: n,
      timestamp: n.date,
    })),
  ];

  const groupedEntries = groupByDate(entries);

  if (entries.length === 0) {
    return (
      <div className={cn("text-center py-16", className)}>
        <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">
          Your study timeline will appear here
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Sessions, notes, and reading progress — all in one flow
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {groupedEntries.map(({ date, items }) => (
        <div key={date}>
          {/* Date header */}
          <h3 className="text-sm font-medium text-muted-foreground mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2">
            {formatDateHeader(date)}
          </h3>

          {/* Timeline entries */}
          <div className="space-y-1">
            {items.map((entry) => {
              if (entry.type === "session") {
                const session = entry.data as StudySession;
                return (
                  <div
                    key={session.id}
                    className="group flex items-start gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    {/* Focus indicator */}
                    <div className={cn(
                      "w-1 h-12 rounded-full flex-shrink-0 mt-1",
                      focusColors[session.focus_level || "medium"]
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>{session.duration} min</span>
                        {session.is_timer_session && (
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                            Timer
                          </span>
                        )}
                      </div>
                      
                      <p className="font-medium text-foreground">
                        {session.subject}
                      </p>
                      
                      {session.topic && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {session.topic}
                        </p>
                      )}

                      {session.notes && (
                        <div className="mt-2 p-3 rounded-lg bg-muted/40 border-l-2 border-muted-foreground/20">
                          <p className="text-sm text-muted-foreground italic">
                            "{session.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (entry.type === "note") {
                const note = entry.data as TimelineNote;
                return (
                  <div
                    key={note.id}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Note</p>
                      <p className="text-sm text-foreground">{note.content}</p>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
