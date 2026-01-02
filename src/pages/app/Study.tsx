import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Clock, ChevronDown, Plus, X, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const subjects = ["Mathematics", "Programming", "Philosophy", "Language", "Science", "Other"];

const Study = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  
  // Form state
  const [subject, setSubject] = useState("Programming");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Fetch study logs
  const { data: studyLogs = [], isLoading } = useQuery({
    queryKey: ["study-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_logs")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Add study log mutation
  const addLogMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("study_logs").insert({
        user_id: user!.id,
        subject,
        duration: parseInt(duration),
        date: logDate,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-logs"] });
      toast({ title: "Study session logged" });
      resetForm();
      setIsAddingLog(false);
    },
    onError: () => {
      toast({ title: "Failed to log session", variant: "destructive" });
    },
  });

  // Update study log mutation
  const updateLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("study_logs")
        .update({
          subject,
          duration: parseInt(duration),
          date: logDate,
          notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-logs"] });
      toast({ title: "Study log updated" });
      resetForm();
      setEditingLog(null);
    },
    onError: () => {
      toast({ title: "Failed to update log", variant: "destructive" });
    },
  });

  // Delete study log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-logs"] });
      toast({ title: "Study log deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete log", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSubject("Programming");
    setDuration("");
    setNotes("");
    setLogDate(format(new Date(), "yyyy-MM-dd"));
  };

  const openEditDialog = (log: typeof studyLogs[0]) => {
    setSubject(log.subject);
    setDuration(log.duration.toString());
    setNotes(log.notes || "");
    setLogDate(log.date);
    setEditingLog(log.id);
  };

  const filteredLogs = filter 
    ? studyLogs.filter(log => log.subject === filter)
    : studyLogs;

  // Calculate weekly summary
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const weeklyLogs = studyLogs.filter(log => {
    const logDate = parseISO(log.date);
    return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
  });
  
  const totalMinutes = weeklyLogs.reduce((acc, log) => acc + log.duration, 0);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayMinutes = studyLogs
    .filter(log => log.date === today)
    .reduce((acc, log) => acc + log.duration, 0);

  // Get unique subjects from logs
  const uniqueSubjects = [...new Set(studyLogs.map(log => log.subject))];
  const allSubjects = [...new Set([...subjects, ...uniqueSubjects])];

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
            <p className="text-4xl font-semibold text-foreground">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
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
        {allSubjects.map((subj) => (
          <button
            key={subj}
            onClick={() => setFilter(subj)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              filter === subj
                ? "bg-vyom-accent text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Study Logs */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No study logs yet. Start logging your sessions!
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="group">
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
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(log);
                      }}
                      className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLogMutation.mutate(log.id);
                      }}
                      className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
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
                <div className="px-4 pb-4 pt-0 animate-fade-in">
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 ml-14">
                    {log.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Log Button */}
      <Button variant="vyom" className="w-full" onClick={() => setIsAddingLog(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Log Study Session
      </Button>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddingLog || !!editingLog} onOpenChange={(open) => {
        if (!open) {
          setIsAddingLog(false);
          setEditingLog(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingLog ? "Edit Study Log" : "Log Study Session"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Duration (minutes)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Date</label>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you learn?"
                className="bg-background border-border resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddingLog(false);
                  setEditingLog(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="vyom"
                className="flex-1"
                disabled={!duration || parseInt(duration) <= 0}
                onClick={() => {
                  if (editingLog) {
                    updateLogMutation.mutate(editingLog);
                  } else {
                    addLogMutation.mutate();
                  }
                }}
              >
                {editingLog ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Study;
