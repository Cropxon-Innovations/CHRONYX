import { useMemo } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, TrendingUp, Target } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  date: string;
  duration_hours?: number | null;
  priority: "high" | "medium" | "low";
}

interface WeeklyTimeBudgetProps {
  todos: Todo[];
  selectedDate: Date;
}

const AVAILABLE_HOURS_PER_DAY = 16;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WeeklyTimeBudget = ({ todos, selectedDate }: WeeklyTimeBudgetProps) => {
  const weekData = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayTodos = todos.filter(t => t.date === dateStr);
      const timedTodos = dayTodos.filter(t => t.duration_hours && t.duration_hours > 0);
      
      const allocatedHours = timedTodos.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
      const completedHours = timedTodos
        .filter(t => t.status === "done")
        .reduce((sum, t) => sum + (t.duration_hours || 0), 0);
      
      const completedTasks = dayTodos.filter(t => t.status === "done").length;
      const totalTasks = dayTodos.length;
      
      return {
        date,
        dateStr,
        dayName: DAY_NAMES[i],
        allocatedHours,
        completedHours,
        completedTasks,
        totalTasks,
        utilizationPercent: Math.min(100, (allocatedHours / AVAILABLE_HOURS_PER_DAY) * 100),
        completionPercent: allocatedHours > 0 ? (completedHours / allocatedHours) * 100 : 0,
      };
    });

    const totalAllocated = days.reduce((sum, d) => sum + d.allocatedHours, 0);
    const totalCompleted = days.reduce((sum, d) => sum + d.completedHours, 0);
    const totalTasks = days.reduce((sum, d) => sum + d.totalTasks, 0);
    const completedTasks = days.reduce((sum, d) => sum + d.completedTasks, 0);
    const avgUtilization = days.reduce((sum, d) => sum + d.utilizationPercent, 0) / 7;

    return {
      days,
      totalAllocated,
      totalCompleted,
      totalTasks,
      completedTasks,
      avgUtilization,
      weeklyProductivity: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }, [todos, selectedDate]);

  const maxAllocated = Math.max(...weekData.days.map(d => d.allocatedHours), 1);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Weekly Time Budget
        </h3>
        <span className="text-xs text-muted-foreground">
          {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), "MMM d")}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-semibold">{weekData.totalAllocated.toFixed(1)}h</p>
          <p className="text-[10px] text-muted-foreground">Planned</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
          <Target className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-lg font-semibold">{weekData.totalCompleted.toFixed(1)}h</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-2 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-semibold">{weekData.avgUtilization.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground">Utilization</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-2 text-center">
          <Calendar className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <p className="text-lg font-semibold">{weekData.completedTasks}/{weekData.totalTasks}</p>
          <p className="text-[10px] text-muted-foreground">Tasks</p>
        </div>
      </div>

      {/* Daily Bars */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Hours per day</p>
        <div className="flex items-end gap-1 h-24">
          {weekData.days.map((day) => {
            const isToday = format(new Date(), "yyyy-MM-dd") === day.dateStr;
            const barHeight = maxAllocated > 0 ? (day.allocatedHours / maxAllocated) * 100 : 0;
            const completedHeight = day.allocatedHours > 0 
              ? (day.completedHours / day.allocatedHours) * barHeight 
              : 0;

            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-20 flex flex-col justify-end relative">
                  {/* Allocated bar */}
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all relative overflow-hidden",
                      isToday ? "bg-primary/30" : "bg-muted"
                    )}
                    style={{ height: `${barHeight}%` }}
                  >
                    {/* Completed portion */}
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 right-0 rounded-t",
                        isToday ? "bg-primary" : "bg-emerald-500"
                      )}
                      style={{ height: `${completedHeight}%` }}
                    />
                  </div>
                  {day.allocatedHours > 0 && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                      {day.allocatedHours.toFixed(1)}h
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px]",
                  isToday ? "font-bold text-primary" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Weekly Productivity</span>
          <span className="font-medium">{weekData.weeklyProductivity.toFixed(0)}%</span>
        </div>
        <Progress 
          value={weekData.weeklyProductivity} 
          className="h-2"
          indicatorClassName={cn(
            weekData.weeklyProductivity >= 80 ? "bg-emerald-500" :
            weekData.weeklyProductivity >= 50 ? "bg-amber-500" :
            "bg-rose-500"
          )}
        />
      </div>
    </div>
  );
};

export default WeeklyTimeBudget;