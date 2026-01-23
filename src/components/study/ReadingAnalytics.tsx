import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  BookOpen,
  Clock,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  X,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface ReadingStats {
  totalMinutesToday: number;
  totalPagesToday: number;
  totalBooksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weeklyMinutes: number[];
}

interface ReadingAnalyticsProps {
  onClose?: () => void;
}

export const ReadingAnalytics = ({ onClose }: ReadingAnalyticsProps) => {
  const [stats, setStats] = useState<ReadingStats>({
    totalMinutesToday: 0,
    totalPagesToday: 0,
    totalBooksCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Fetch today's reading sessions
      const { data: todaySessions } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .gte("started_at", startOfToday)
        .lte("started_at", endOfToday);

      const totalMinutesToday = (todaySessions || []).reduce(
        (acc, s) => acc + (s.duration_minutes || 0),
        0
      );
      const totalPagesToday = (todaySessions || []).reduce(
        (acc, s) => acc + (s.pages_read || 0),
        0
      );

      // Fetch completed books
      const { count: completedCount } = await supabase
        .from("reading_state")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .not("completed_at", "is", null);

      // Fetch weekly reading data
      const weeklyMinutes: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { data: daySessions } = await supabase
          .from("reading_sessions")
          .select("duration_minutes")
          .eq("user_id", user?.id)
          .gte("started_at", dayStart)
          .lte("started_at", dayEnd);

        const dayTotal = (daySessions || []).reduce(
          (acc, s) => acc + (s.duration_minutes || 0),
          0
        );
        weeklyMinutes.push(dayTotal);
      }

      // Calculate streak (simplified)
      let currentStreak = 0;
      for (let i = 0; i < 30; i++) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { count } = await supabase
          .from("reading_sessions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .gte("started_at", dayStart)
          .lte("started_at", dayEnd);

        if ((count || 0) > 0) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }

      setStats({
        totalMinutesToday,
        totalPagesToday,
        totalBooksCompleted: completedCount || 0,
        currentStreak,
        longestStreak: currentStreak, // Simplified
        weeklyMinutes,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxWeeklyMinutes = Math.max(...stats.weeklyMinutes, 1);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const orderedDays = [
    ...weekDays.slice(today - 6 < 0 ? today + 1 : today - 6),
    ...weekDays.slice(0, today + 1),
  ].slice(-7);

  const dailyGoalMinutes = 30;
  const goalProgress = Math.min((stats.totalMinutesToday / dailyGoalMinutes) * 100, 100);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Reading Analytics</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Daily Goal */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">Daily Goal</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalMinutesToday}/{dailyGoalMinutes} min
                  </span>
                </div>
                <Progress value={goalProgress} className="h-2" />
                {goalProgress >= 100 && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <span>🎉</span> Goal achieved!
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.totalMinutesToday}
                    <span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Pages</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.totalPagesToday}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Streak</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.currentStreak}
                    <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.totalBooksCompleted}
                    <span className="text-sm font-normal text-muted-foreground ml-1">books</span>
                  </p>
                </div>
              </div>

              {/* Weekly Chart */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">This Week</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-24">
                  {stats.weeklyMinutes.map((minutes, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-full rounded-t transition-all",
                          minutes > 0 ? "bg-primary" : "bg-muted"
                        )}
                        style={{
                          height: `${Math.max((minutes / maxWeeklyMinutes) * 100, 4)}%`,
                          minHeight: "4px",
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {orderedDays[i]?.[0] || weekDays[(today - 6 + i + 7) % 7]?.[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
