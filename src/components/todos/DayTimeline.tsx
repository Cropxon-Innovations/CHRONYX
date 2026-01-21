import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Moon, Utensils, Clock, Zap } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  duration_hours?: number | null;
  priority: "high" | "medium" | "low";
}

interface DayTimelineProps {
  todos: Todo[];
}

const TOTAL_HOURS = 24;
const SLEEP_HOURS = 6;
const ESSENTIALS_HOURS = 2;
const AVAILABLE_HOURS = TOTAL_HOURS - SLEEP_HOURS - ESSENTIALS_HOURS;

export const DayTimeline = ({ todos }: DayTimelineProps) => {
  const stats = useMemo(() => {
    const timedTodos = todos.filter(t => t.duration_hours && t.duration_hours > 0);
    const allocatedHours = timedTodos.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
    const completedHours = timedTodos
      .filter(t => t.status === "done")
      .reduce((sum, t) => sum + (t.duration_hours || 0), 0);
    const remainingHours = Math.max(0, AVAILABLE_HOURS - allocatedHours);
    const usagePercentage = Math.min(100, (allocatedHours / AVAILABLE_HOURS) * 100);
    const completionPercentage = allocatedHours > 0 ? (completedHours / allocatedHours) * 100 : 0;

    return {
      allocatedHours,
      completedHours,
      remainingHours,
      usagePercentage,
      completionPercentage,
      timedTodosCount: timedTodos.length,
    };
  }, [todos]);

  if (stats.timedTodosCount === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Daily Time Budget
        </h3>
        <span className="text-xs text-muted-foreground">
          {AVAILABLE_HOURS}h productive time
        </span>
      </div>

      {/* Time Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-indigo-500/10 rounded-lg p-2">
          <Moon className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
          <p className="text-sm font-semibold">{SLEEP_HOURS}h</p>
          <p className="text-[10px] text-muted-foreground">Sleep</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-2">
          <Utensils className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-sm font-semibold">{ESSENTIALS_HOURS}h</p>
          <p className="text-[10px] text-muted-foreground">Essentials</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-2">
          <Zap className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-sm font-semibold">{stats.allocatedHours.toFixed(1)}h</p>
          <p className="text-[10px] text-muted-foreground">Planned</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-2">
          <Clock className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <p className="text-sm font-semibold">{stats.remainingHours.toFixed(1)}h</p>
          <p className="text-[10px] text-muted-foreground">Free</p>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="space-y-2">
        <div className="relative h-6 bg-muted rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-indigo-500/40 flex items-center justify-center"
            style={{ width: `${(SLEEP_HOURS / TOTAL_HOURS) * 100}%` }}
          >
            <Moon className="w-3 h-3 text-indigo-700 dark:text-indigo-300" />
          </div>
          <div 
            className="h-full bg-emerald-500/40 flex items-center justify-center"
            style={{ width: `${(ESSENTIALS_HOURS / TOTAL_HOURS) * 100}%` }}
          >
            <Utensils className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
          </div>
          {todos.filter(t => t.duration_hours).map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "h-full flex items-center justify-center text-[9px] font-medium truncate px-1",
                todo.status === "done" ? "bg-emerald-500/50" :
                todo.status === "skipped" ? "bg-muted-foreground/20" :
                todo.priority === "high" ? "bg-rose-500/40" :
                todo.priority === "medium" ? "bg-amber-500/40" :
                "bg-slate-500/40"
              )}
              style={{ width: `${((todo.duration_hours || 0) / TOTAL_HOURS) * 100}%` }}
              title={`${todo.text} (${todo.duration_hours}h)`}
            />
          ))}
          {stats.remainingHours > 0 && (
            <div 
              className="h-full bg-muted/80 border-l border-dashed border-muted-foreground/20"
              style={{ width: `${(stats.remainingHours / TOTAL_HOURS) * 100}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Day Utilization</span>
            <span className="font-medium">{stats.usagePercentage.toFixed(0)}%</span>
          </div>
          <Progress 
            value={stats.usagePercentage} 
            className="h-2"
            indicatorClassName={cn(
              stats.usagePercentage > 90 ? "bg-rose-500" :
              stats.usagePercentage > 70 ? "bg-amber-500" :
              "bg-emerald-500"
            )}
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{stats.completedHours.toFixed(1)}h / {stats.allocatedHours.toFixed(1)}h</span>
          </div>
          <Progress 
            value={stats.completionPercentage} 
            className="h-2"
            indicatorClassName="bg-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default DayTimeline;