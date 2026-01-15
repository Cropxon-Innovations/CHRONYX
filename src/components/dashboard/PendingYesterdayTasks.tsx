import { useState, useEffect } from "react";
import { Check, AlertCircle, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingTask {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  date: string;
}

const priorityConfig = {
  high: { color: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  medium: { color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  low: { color: "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30" },
};

const PendingYesterdayTasks = () => {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  useEffect(() => {
    if (user) {
      fetchPendingTasks();
    }
  }, [user]);

  const fetchPendingTasks = async () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("todos")
      .select("id, text, priority, date")
      .eq("date", yesterday)
      .eq("status", "pending")
      .order("priority", { ascending: true });

    if (!error && data) {
      setTasks(data.map(t => ({
        ...t,
        priority: (t.priority || "medium") as "high" | "medium" | "low"
      })));
    }
    setLoading(false);
  };

  const markAsCompleted = async (taskId: string, taskText: string) => {
    setCompletingId(taskId);
    
    const { error } = await supabase
      .from("todos")
      .update({ status: "done" })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: "Failed to complete task", variant: "destructive" });
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task completed!", description: taskText });
      logActivity(`Completed yesterday's task: ${taskText.substring(0, 30)}`, "Todos");
    }
    setCompletingId(null);
  };

  const handleQuickAdd = async () => {
    if (!newTaskText.trim() || !user) return;
    
    setIsAdding(true);
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { error } = await supabase
      .from("todos")
      .insert({
        text: newTaskText.trim(),
        priority: newTaskPriority,
        date: today,
        status: "pending",
        user_id: user.id,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    } else {
      toast({ title: "Task added!", description: newTaskText.trim() });
      logActivity(`Quick added task: ${newTaskText.substring(0, 30)}`, "Todos");
      setNewTaskText("");
      setNewTaskPriority("medium");
      setShowQuickAdd(false);
    }
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/30 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            {tasks.length > 0 ? "Pending from Yesterday" : "Quick Add Task"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Task
          </button>
          <Link 
            to="/app/todos" 
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="mb-4 p-3 bg-background/50 rounded-lg border border-border space-y-3">
          <Input
            placeholder="What needs to be done?"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            className="bg-background"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as "high" | "medium" | "low")}>
              <SelectTrigger className="w-32 h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleQuickAdd}
              disabled={!newTaskText.trim() || isAdding}
              className="h-8 text-xs"
            >
              {isAdding ? "Adding..." : "Add"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowQuickAdd(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {tasks.slice(0, 5).map((task) => (
          <div 
            key={task.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              "bg-background/50 hover:bg-background",
              priorityConfig[task.priority].color
            )}
          >
            <button
              onClick={() => markAsCompleted(task.id, task.text)}
              disabled={completingId === task.id}
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                "hover:bg-emerald-500/20 hover:border-emerald-500",
                completingId === task.id && "animate-pulse bg-emerald-500/20 border-emerald-500"
              )}
            >
              {completingId === task.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
              )}
            </button>
            
            <span className="flex-1 text-sm text-foreground truncate">
              {task.text}
            </span>
            
            <span className={cn(
              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
              priorityConfig[task.priority].color
            )}>
              {task.priority}
            </span>
          </div>
        ))}
        
        {tasks.length > 5 && (
          <Link 
            to="/app/todos"
            className="block text-center text-sm text-muted-foreground hover:text-foreground py-2"
          >
            +{tasks.length - 5} more pending tasks
          </Link>
        )}
      </div>
    </div>
  );
};

export default PendingYesterdayTasks;
