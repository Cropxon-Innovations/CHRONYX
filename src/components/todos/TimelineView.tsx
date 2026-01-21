import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Moon, Utensils, Bath, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TimelineTodo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  duration_hours: number;
  priority: "high" | "medium" | "low";
  date: string;
}

interface TimelineViewProps {
  todos: TimelineTodo[];
  selectedDate: Date;
  onRefresh: () => void;
}

const TOTAL_HOURS = 24;
const SLEEP_HOURS = 6;
const ESSENTIALS_HOURS = 2; // Food, Bath, Toilet
const AVAILABLE_HOURS = TOTAL_HOURS - SLEEP_HOURS - ESSENTIALS_HOURS; // 16 hours

const priorityColors = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export const TimelineView = ({ todos, selectedDate, onRefresh }: TimelineViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDuration, setNewDuration] = useState(1);
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");

  const timelineStats = useMemo(() => {
    const allocatedHours = todos.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
    const completedHours = todos
      .filter(t => t.status === "done")
      .reduce((sum, t) => sum + (t.duration_hours || 0), 0);
    const remainingHours = AVAILABLE_HOURS - allocatedHours;
    const usagePercentage = (allocatedHours / AVAILABLE_HOURS) * 100;

    return {
      allocatedHours,
      completedHours,
      remainingHours,
      usagePercentage,
    };
  }, [todos]);

  const addTimelineTask = async () => {
    if (!newTask.trim() || !user) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Check if adding this task exceeds available hours
    if (timelineStats.allocatedHours + newDuration > AVAILABLE_HOURS) {
      toast({
        title: "Time limit exceeded",
        description: `You only have ${timelineStats.remainingHours.toFixed(1)} hours remaining for the day.`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("todos").insert({
      text: newTask.trim(),
      user_id: user.id,
      status: "pending",
      date: dateStr,
      priority: newPriority,
      duration_hours: newDuration,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    } else {
      toast({ title: "Timeline task added" });
      setNewTask("");
      setNewDuration(1);
      setNewPriority("medium");
      setDialogOpen(false);
      onRefresh();
    }
  };

  const updateTaskStatus = async (id: string, status: "done" | "skipped") => {
    const { error } = await supabase
      .from("todos")
      .update({ status })
      .eq("id", id);

    if (!error) {
      onRefresh();
      toast({ title: status === "done" ? "Task completed!" : "Task skipped" });
    }
  };

  const getTimeBlocks = () => {
    const blocks: { type: string; hours: number; label: string; icon: any; color: string }[] = [
      { type: "sleep", hours: SLEEP_HOURS, label: "Sleep", icon: Moon, color: "bg-indigo-500/20 border-indigo-500/30" },
      { type: "essentials", hours: ESSENTIALS_HOURS, label: "Food & Self-care", icon: Utensils, color: "bg-emerald-500/20 border-emerald-500/30" },
    ];

    todos.forEach(todo => {
      if (todo.duration_hours) {
        blocks.push({
          type: "task",
          hours: todo.duration_hours,
          label: todo.text,
          icon: Clock,
          color: todo.status === "done" 
            ? "bg-emerald-500/30 border-emerald-500/50" 
            : todo.status === "skipped"
              ? "bg-muted border-muted-foreground/20"
              : `${priorityColors[todo.priority]}/20 border-${priorityColors[todo.priority].replace('bg-', '')}/30`,
        });
      }
    });

    // Add remaining free time
    if (timelineStats.remainingHours > 0) {
      blocks.push({
        type: "free",
        hours: timelineStats.remainingHours,
        label: "Free Time",
        icon: Clock,
        color: "bg-muted/50 border-dashed border-muted-foreground/20",
      });
    }

    return blocks;
  };

  return (
    <div className="space-y-6">
      {/* Time Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Moon className="w-5 h-5 mx-auto text-indigo-400 mb-2" />
          <p className="text-2xl font-bold">{SLEEP_HOURS}h</p>
          <p className="text-xs text-muted-foreground">Sleep</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Utensils className="w-5 h-5 mx-auto text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">{ESSENTIALS_HOURS}h</p>
          <p className="text-xs text-muted-foreground">Essentials</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{timelineStats.allocatedHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">Planned</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-amber-400 mb-2" />
          <p className="text-2xl font-bold">{timelineStats.remainingHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Day Utilization</span>
          <span className="text-sm text-muted-foreground">
            {timelineStats.allocatedHours.toFixed(1)} / {AVAILABLE_HOURS}h
          </span>
        </div>
        <Progress 
          value={timelineStats.usagePercentage} 
          className="h-3"
          indicatorClassName={cn(
            timelineStats.usagePercentage > 90 ? "bg-rose-500" :
            timelineStats.usagePercentage > 70 ? "bg-amber-500" :
            "bg-emerald-500"
          )}
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{timelineStats.completedHours.toFixed(1)}h completed</span>
          <span>{(AVAILABLE_HOURS - timelineStats.allocatedHours).toFixed(1)}h free</span>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">24-Hour Timeline</h3>
        <div className="relative h-8 bg-muted rounded-full overflow-hidden flex">
          {/* Sleep block */}
          <div 
            className="h-full bg-indigo-500/40 flex items-center justify-center text-[10px] font-medium"
            style={{ width: `${(SLEEP_HOURS / TOTAL_HOURS) * 100}%` }}
          >
            <Moon className="w-3 h-3 mr-1" />
            Sleep
          </div>
          {/* Essentials block */}
          <div 
            className="h-full bg-emerald-500/40 flex items-center justify-center text-[10px] font-medium"
            style={{ width: `${(ESSENTIALS_HOURS / TOTAL_HOURS) * 100}%` }}
          >
            <Utensils className="w-3 h-3" />
          </div>
          {/* Task blocks */}
          {todos.filter(t => t.duration_hours).map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "h-full flex items-center justify-center text-[10px] font-medium truncate px-1",
                todo.status === "done" ? "bg-emerald-500/40" :
                todo.status === "skipped" ? "bg-muted" :
                todo.priority === "high" ? "bg-rose-500/40" :
                todo.priority === "medium" ? "bg-amber-500/40" :
                "bg-slate-500/40"
              )}
              style={{ width: `${((todo.duration_hours || 0) / TOTAL_HOURS) * 100}%` }}
              title={`${todo.text} (${todo.duration_hours}h)`}
            >
              {todo.text.substring(0, 8)}
            </div>
          ))}
          {/* Free time */}
          {timelineStats.remainingHours > 0 && (
            <div 
              className="h-full bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground"
              style={{ width: `${(timelineStats.remainingHours / TOTAL_HOURS) * 100}%` }}
            >
              Free
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {/* Add Timeline Task Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Timeline Task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What do you need to do?"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration: {newDuration} hour{newDuration !== 1 ? 's' : ''}</Label>
              <Slider
                value={[newDuration]}
                onValueChange={(v) => setNewDuration(v[0])}
                min={0.5}
                max={Math.min(8, timelineStats.remainingHours)}
                step={0.5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Available: {timelineStats.remainingHours.toFixed(1)} hours
              </p>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addTimelineTask} className="w-full">
              Add Task ({newDuration}h)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Today's Tasks</h3>
        {todos.filter(t => t.duration_hours).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No timeline tasks yet. Add your first task above.
          </p>
        ) : (
          todos.filter(t => t.duration_hours).map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                todo.status === "done" ? "bg-emerald-500/10 border-emerald-500/30" :
                todo.status === "skipped" ? "bg-muted border-muted-foreground/20 opacity-60" :
                "bg-card border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", priorityColors[todo.priority])} />
                <div>
                  <p className={cn(
                    "font-medium",
                    todo.status !== "pending" && "line-through opacity-70"
                  )}>
                    {todo.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {todo.duration_hours}h
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs capitalize",
                        todo.status === "done" && "text-emerald-500 border-emerald-500/30",
                        todo.status === "skipped" && "text-muted-foreground"
                      )}
                    >
                      {todo.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {todo.status === "pending" && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => updateTaskStatus(todo.id, "done")}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => updateTaskStatus(todo.id, "skipped")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimelineView;