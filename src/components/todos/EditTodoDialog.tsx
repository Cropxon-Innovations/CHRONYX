import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Clock, Flag, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Priority = "high" | "medium" | "low";
type TodoStatus = "pending" | "done" | "skipped";

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  date: string;
  priority: Priority;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_days: number[] | null;
  duration_hours?: number | null;
  start_time?: string | null;
  end_time?: string | null;
}

interface EditTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: Todo | null;
  onUpdate: (updatedTodo: Todo) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  high: { label: "High", color: "text-rose-500", bgColor: "bg-rose-500/10 border-rose-500/30" },
  medium: { label: "Medium", color: "text-amber-500", bgColor: "bg-amber-500/10 border-amber-500/30" },
  low: { label: "Low", color: "text-muted-foreground", bgColor: "bg-muted border-border" },
};

const DURATION_PRESETS = [0.5, 1, 1.5, 2, 3, 4, 6, 8];

export const EditTodoDialog = ({
  open,
  onOpenChange,
  todo,
  onUpdate,
  onDelete,
}: EditTodoDialogProps) => {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TodoStatus>("pending");
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (todo) {
      setText(todo.text);
      setPriority(todo.priority);
      setStatus(todo.status);
      setDurationHours(todo.duration_hours || null);
      setStartTime(todo.start_time || "");
      setEndTime(todo.end_time || "");
    }
  }, [todo]);

  const handleSave = async () => {
    if (!todo || !text.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("todos")
        .update({
          text: text.trim(),
          priority,
          status,
          duration_hours: durationHours,
          start_time: startTime || null,
          end_time: endTime || null,
        })
        .eq("id", todo.id);

      if (error) throw error;

      onUpdate({
        ...todo,
        text: text.trim(),
        priority,
        status,
        duration_hours: durationHours,
        start_time: startTime || null,
        end_time: endTime || null,
      });

      toast.success("Task updated");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (todo) {
      onDelete(todo.id);
      onOpenChange(false);
    }
  };

  // Calculate duration from time range
  const calculateDurationFromTime = () => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const diffMinutes = endMinutes - startMinutes;
      if (diffMinutes > 0) {
        setDurationHours(Math.round((diffMinutes / 60) * 2) / 2); // Round to nearest 0.5
      }
    }
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Task Text */}
          <div className="space-y-2">
            <Label htmlFor="task-text">Task Description</Label>
            <Input
              id="task-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What needs to be done?"
              className="text-base"
            />
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Flag className={cn("w-4 h-4", priorityConfig[priority].color)} />
                    <span>{priorityConfig[priority].label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-rose-500" />
                      High Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-amber-500" />
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-muted-foreground" />
                      Low Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TodoStatus)}>
                <SelectTrigger>
                  <span className="capitalize">{status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">To Do</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Time Range
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  onBlur={calculateDurationFromTime}
                  placeholder="Start"
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="flex-1">
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onBlur={calculateDurationFromTime}
                  placeholder="End"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Duration</Label>
              {durationHours && (
                <Badge variant="secondary" className="text-xs">
                  {durationHours}h allocated
                </Badge>
              )}
            </div>
            
            {/* Quick Duration Buttons */}
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDurationHours(durationHours === hours ? null : hours)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    durationHours === hours
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  )}
                >
                  {hours}h
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationHours(null)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  durationHours === null
                    ? "bg-muted border-border text-muted-foreground"
                    : "bg-background border-border hover:bg-accent text-muted-foreground"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Custom Duration Slider */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-10">0h</span>
              <Slider
                value={[durationHours || 0]}
                onValueChange={(value) => setDurationHours(value[0] || null)}
                max={12}
                step={0.5}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">12h</span>
            </div>
          </div>

          {/* Recurring Info */}
          {todo.is_recurring && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Recurring Task:</strong> {todo.recurrence_type}
                {todo.recurrence_days && ` (${todo.recurrence_days.length} days)`}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !text.trim()} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
