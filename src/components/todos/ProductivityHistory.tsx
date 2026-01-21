import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Clock, CheckCircle2, Target, Flame } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  date: string;
  duration_hours?: number | null;
  priority: "high" | "medium" | "low";
}

interface ProductivityHistoryProps {
  todos: Todo[];
}

const AVAILABLE_HOURS = 16;

export const ProductivityHistory = ({ todos }: ProductivityHistoryProps) => {
  const historyData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayTodos = todos.filter(t => t.date === dateStr);
      const timedTodos = dayTodos.filter(t => t.duration_hours && t.duration_hours > 0);
      
      const totalTasks = dayTodos.length;
      const completedTasks = dayTodos.filter(t => t.status === "done").length;
      const allocatedHours = timedTodos.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
      const completedHours = timedTodos
        .filter(t => t.status === "done")
        .reduce((sum, t) => sum + (t.duration_hours || 0), 0);

      const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;
      const timeScore = allocatedHours > 0 ? (completedHours / allocatedHours) * 30 : 0;
      const utilizationScore = (allocatedHours / AVAILABLE_HOURS) * 20;
      const dailyScore = Math.min(100, taskScore + timeScore + utilizationScore);

      return {
        date,
        dateStr,
        dayName: format(date, "EEE"),
        totalTasks,
        completedTasks,
        allocatedHours,
        completedHours,
        dailyScore,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        utilizationRate: (allocatedHours / AVAILABLE_HOURS) * 100,
      };
    }).reverse();

    // Calculate streaks
    let currentStreak = 0;
    for (let i = last14Days.length - 1; i >= 0; i--) {
      if (last14Days[i].dailyScore >= 60) {
        currentStreak++;
      } else {
        break;
      }
    }

    const avgScore = last14Days.reduce((sum, d) => sum + d.dailyScore, 0) / 14;
    const bestDay = last14Days.reduce((best, day) => 
      day.dailyScore > best.dailyScore ? day : best, last14Days[0]);
    const totalHoursCompleted = last14Days.reduce((sum, d) => sum + d.completedHours, 0);
    const totalTasksCompleted = last14Days.reduce((sum, d) => sum + d.completedTasks, 0);

    return {
      days: last14Days,
      currentStreak,
      avgScore,
      bestDay,
      totalHoursCompleted,
      totalTasksCompleted,
    };
  }, [todos]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-primary";
    if (score >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Flame className="w-5 h-5 mx-auto text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{historyData.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Target className="w-5 h-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{historyData.avgScore.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-emerald-500 mb-2" />
          <p className="text-2xl font-bold">{historyData.totalHoursCompleted.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground">Hours Done</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto text-indigo-500 mb-2" />
          <p className="text-2xl font-bold">{historyData.totalTasksCompleted}</p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </div>
      </div>

      {/* Best Day Highlight */}
      <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best Day (Last 14 Days)</p>
            <p className="font-semibold">
              {format(historyData.bestDay.date, "EEEE, MMM d")} — Score: {historyData.bestDay.dailyScore.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {historyData.bestDay.completedTasks} tasks, {historyData.bestDay.completedHours.toFixed(1)}h completed
            </p>
          </div>
        </div>
      </div>

      {/* Daily History */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          14-Day History
        </h3>
        
        <div className="space-y-2">
          {historyData.days.map((day, index) => {
            const isToday = format(new Date(), "yyyy-MM-dd") === day.dateStr;
            
            return (
              <div 
                key={day.dateStr}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg",
                  isToday && "bg-primary/5 border border-primary/20"
                )}
              >
                <div className="w-16 text-xs">
                  <p className={cn("font-medium", isToday && "text-primary")}>
                    {day.dayName}
                  </p>
                  <p className="text-muted-foreground">{format(day.date, "MMM d")}</p>
                </div>
                
                <div className="flex-1">
                  <Progress 
                    value={day.dailyScore} 
                    className="h-3"
                    indicatorClassName={getScoreColor(day.dailyScore)}
                  />
                </div>
                
                <div className="w-20 text-right">
                  <p className="text-sm font-semibold">{day.dailyScore.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{getScoreLabel(day.dailyScore)}</p>
                </div>
                
                <div className="w-24 text-right text-xs text-muted-foreground">
                  <p>{day.completedTasks}/{day.totalTasks} tasks</p>
                  <p>{day.completedHours.toFixed(1)}h done</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">How Score is Calculated</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Task Completion (50%)</span>
            <span>Completed tasks ÷ Total tasks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Efficiency (30%)</span>
            <span>Hours completed ÷ Hours planned</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Day Utilization (20%)</span>
            <span>Hours planned ÷ 16h available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityHistory;