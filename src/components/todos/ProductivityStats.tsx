import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Flame, Target, Award, CheckCircle2, Clock } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  date: string;
  priority: "high" | "medium" | "low";
}

interface ProductivityStatsProps {
  todos: Todo[];
}

export const ProductivityStats = ({ todos }: ProductivityStatsProps) => {
  const allTodos = todos;
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  
  const stats = useMemo(() => {
    // Today's stats
    const todayTodos = allTodos.filter(t => t.date === today);
    const todayTotal = todayTodos.length;
    const todayCompleted = todayTodos.filter(t => t.status === "done").length;
    const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    
    // Yesterday's stats
    const yesterdayTodos = allTodos.filter(t => t.date === yesterday);
    const yesterdayTotal = yesterdayTodos.length;
    const yesterdayCompleted = yesterdayTodos.filter(t => t.status === "done").length;
    const yesterdayPercentage = yesterdayTotal > 0 ? Math.round((yesterdayCompleted / yesterdayTotal) * 100) : 0;
    const yesterdayPendingCount = yesterdayTodos.filter(t => t.status === "pending").length;
    
    // Trend calculation
    const trend = todayPercentage - yesterdayPercentage;
    
    // Streak calculation (consecutive days with 80%+ completion)
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dateTodos = allTodos.filter(t => t.date === checkDate);
      const dateCompleted = dateTodos.filter(t => t.status === "done").length;
      const datePercentage = dateTodos.length > 0 ? (dateCompleted / dateTodos.length) * 100 : 0;
      
      if (dateTodos.length > 0 && datePercentage >= 80) {
        streak++;
      } else if (dateTodos.length > 0) {
        break;
      }
    }
    
    return {
      todayTotal,
      todayCompleted,
      todayPercentage,
      yesterdayTotal,
      yesterdayCompleted,
      yesterdayPercentage,
      yesterdayPendingCount,
      trend,
      streak,
    };
  }, [allTodos, today, yesterday]);
  
  const getTrendIcon = () => {
    if (stats.trend > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (stats.trend < 0) return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };
  
  const getProductivityColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-500";
    if (percentage >= 70) return "text-blue-500";
    if (percentage >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Productivity</h3>
          <p className="text-xs text-muted-foreground">Daily progress tracking</p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Today */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getProductivityColor(stats.todayPercentage))}>
              {stats.todayCompleted}/{stats.todayTotal}
            </Badge>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-2xl sm:text-3xl font-bold", getProductivityColor(stats.todayPercentage))}>
              {stats.todayPercentage}
            </span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Progress value={stats.todayPercentage} className="h-1.5" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getTrendIcon()}
            <span className={cn(
              stats.trend > 0 ? "text-emerald-500" : stats.trend < 0 ? "text-rose-500" : ""
            )}>
              {stats.trend > 0 ? "+" : ""}{stats.trend}%
            </span>
            <span>vs yesterday</span>
          </div>
        </div>
        
        {/* Yesterday */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Yesterday</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getProductivityColor(stats.yesterdayPercentage))}>
              {stats.yesterdayCompleted}/{stats.yesterdayTotal}
            </Badge>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-2xl sm:text-3xl font-bold", getProductivityColor(stats.yesterdayPercentage))}>
              {stats.yesterdayPercentage}
            </span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Progress value={stats.yesterdayPercentage} className="h-1.5" />
          {stats.yesterdayPendingCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Clock className="w-3 h-3" />
              <span>{stats.yesterdayPendingCount} pending</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Streak */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn("w-5 h-5", stats.streak > 0 ? "text-amber-500" : "text-muted-foreground")} />
            <div>
              <span className="text-sm font-medium text-foreground">{stats.streak} day streak</span>
              <p className="text-xs text-muted-foreground">80%+ completion</p>
            </div>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px]",
                  i < stats.streak 
                    ? "bg-amber-500 text-white" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < stats.streak ? <Flame className="w-2.5 h-2.5" /> : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityStats;
