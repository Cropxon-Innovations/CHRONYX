import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Flame, Trophy, Star, Zap, Target, Award } from "lucide-react";
import { Link } from "react-router-dom";

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
  const todayTodos = allTodos.filter(t => t.date === today);
  const yesterdayPending = allTodos.filter(t => t.date === yesterday && t.status === "pending");
  
  const stats = useMemo(() => {
    // Today's stats
    const todayTotal = todayTodos.length;
    const todayCompleted = todayTodos.filter(t => t.status === "done").length;
    const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    
    // Yesterday's stats
    const yesterdayTodos = allTodos.filter(t => t.date === yesterday);
    const yesterdayTotal = yesterdayTodos.length;
    const yesterdayCompleted = yesterdayTodos.filter(t => t.status === "done").length;
    const yesterdayPercentage = yesterdayTotal > 0 ? Math.round((yesterdayCompleted / yesterdayTotal) * 100) : 0;
    
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
      yesterdayPendingCount: yesterdayPending.length,
      trend,
      streak,
    };
  }, [allTodos, todayTodos, yesterdayPending, today, yesterday]);
  
  const getTrendIcon = () => {
    if (stats.trend > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (stats.trend < 0) return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };
  
  const getProductivityLabel = (percentage: number) => {
    if (percentage >= 90) return { label: "Excellent", color: "text-emerald-500" };
    if (percentage >= 70) return { label: "Good", color: "text-blue-500" };
    if (percentage >= 50) return { label: "Average", color: "text-amber-500" };
    return { label: "Needs Improvement", color: "text-rose-500" };
  };
  
  const todayLabel = getProductivityLabel(stats.todayPercentage);
  const yesterdayLabel = getProductivityLabel(stats.yesterdayPercentage);

  return (
    <div className="space-y-4">
      {/* Productivity Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Progress */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Today</span>
            </div>
            <Badge variant="outline" className={cn("text-xs", todayLabel.color)}>
              {todayLabel.label}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-foreground">{stats.todayPercentage}%</span>
              <span className="text-sm text-muted-foreground">
                {stats.todayCompleted}/{stats.todayTotal} tasks
              </span>
            </div>
            <Progress value={stats.todayPercentage} className="h-2" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getTrendIcon()}
            <span className={cn(
              stats.trend > 0 ? "text-emerald-500" : stats.trend < 0 ? "text-rose-500" : "text-muted-foreground"
            )}>
              {stats.trend > 0 ? "+" : ""}{stats.trend}% vs yesterday
            </span>
          </div>
        </div>
        
        {/* Yesterday's Stats */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Yesterday</span>
            </div>
            <Badge variant="outline" className={cn("text-xs", yesterdayLabel.color)}>
              {yesterdayLabel.label}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-foreground">{stats.yesterdayPercentage}%</span>
              <span className="text-sm text-muted-foreground">
                {stats.yesterdayCompleted}/{stats.yesterdayTotal} tasks
              </span>
            </div>
            <Progress value={stats.yesterdayPercentage} className="h-2" />
          </div>
          {stats.yesterdayPendingCount > 0 && (
            <Link 
              to="#pending-yesterday" 
              className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors"
            >
              <span>⚠️ {stats.yesterdayPendingCount} pending from yesterday</span>
            </Link>
          )}
        </div>
        
        {/* Streak & Stats */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-foreground">Current Streak</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-amber-500">{stats.streak}</span>
            <div className="text-sm text-muted-foreground">
              <p>days with 80%+</p>
              <p>completion rate</p>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const isActive = i < stats.streak;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    isActive ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isActive ? <Flame className="w-3 h-3" /> : <span className="text-xs">{i + 1}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityStats;
