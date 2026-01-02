import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudyLog {
  id: string;
  subject: string;
  duration: number;
  date: string;
  notes?: string;
}

const subjects = ["Mathematics", "Programming", "Philosophy", "Language", "Science"];

const sampleLogs: StudyLog[] = [
  { id: "1", subject: "Programming", duration: 45, date: "2024-12-30", notes: "Completed React hooks chapter" },
  { id: "2", subject: "Mathematics", duration: 30, date: "2024-12-30" },
  { id: "3", subject: "Philosophy", duration: 60, date: "2024-12-29", notes: "Read Meditations by Marcus Aurelius" },
  { id: "4", subject: "Programming", duration: 90, date: "2024-12-29" },
  { id: "5", subject: "Language", duration: 25, date: "2024-12-28" },
];

const Study = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const filteredLogs = filter 
    ? sampleLogs.filter(log => log.subject === filter)
    : sampleLogs;

  const totalMinutes = sampleLogs.reduce((acc, log) => acc + log.duration, 0);
  const todayMinutes = sampleLogs
    .filter(log => log.date === "2024-12-30")
    .reduce((acc, log) => acc + log.duration, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Study</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
      </header>

      {/* Weekly Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          This Week
        </h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-4xl font-semibold text-foreground">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Time</p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-vyom-accent">{todayMinutes}m</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Today</p>
          </div>
        </div>
      </div>

      {/* Subject Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            filter === null
              ? "bg-vyom-accent text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => setFilter(subject)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              filter === subject
                ? "bg-vyom-accent text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Study Logs */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {filteredLogs.map((log) => (
          <div key={log.id}>
            <div 
              className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-vyom-accent-soft flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-vyom-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{log.subject}</p>
                  <p className="text-xs text-muted-foreground">{log.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{log.duration}m</span>
                </div>
                {log.notes && (
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    expandedLog === log.id && "rotate-180"
                  )} />
                )}
              </div>
            </div>
            {expandedLog === log.id && log.notes && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 ml-14">
                  {log.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Log */}
      <Button variant="vyom" className="w-full">
        + Log Study Session
      </Button>
    </div>
  );
};

export default Study;
