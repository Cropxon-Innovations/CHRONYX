import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfWeek, addDays, parseISO, formatDistanceToNow } from "date-fns";
import { useEffect, useCallback } from "react";

interface DashboardData {
  todosStats: { completed: number; total: number };
  studyMinutes: number;
  birthDate: Date | null;
  targetAge: number;
  studyTrend: Array<{ name: string; value: number }>;
  heatmapData: number[];
  recentActivity: Array<{ action: string; module: string; timestamp: string }>;
  recentAchievements: Array<{ date: string; title: string; description: string; category: string }>;
  profile: { display_name: string | null; avatar_url: string | null } | null;
}

const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  const today = new Date().toISOString().split("T")[0];

  // Fetch all data in parallel
  const [
    todosResult,
    studyLogsResult,
    profileResult,
    weeklyStudyResult,
    heatmapTodosResult,
    activityResult,
    achievementsResult
  ] = await Promise.all([
    supabase.from("todos").select("status").eq("date", today),
    supabase.from("study_logs").select("duration").eq("date", today),
    supabase.from("profiles")
      .select("birth_date, target_age, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    (() => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));
      return supabase.from("study_logs")
        .select("date, duration")
        .gte("date", weekDates[0])
        .lte("date", weekDates[6]);
    })(),
    (() => {
      const heatmapStartDate = format(subDays(new Date(), 83), "yyyy-MM-dd");
      return supabase.from("todos")
        .select("date, status")
        .gte("date", heatmapStartDate);
    })(),
    supabase.from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("achievements")
      .select("*")
      .order("achieved_at", { ascending: false })
      .limit(3)
  ]);

  // Process todos stats
  const todos = todosResult.data || [];
  const completed = todos.filter(t => t.status === "done").length;
  const todosStats = { completed, total: todos.length };

  // Process study minutes
  const studyLogs = studyLogsResult.data || [];
  const studyMinutes = studyLogs.reduce((acc, log) => acc + log.duration, 0);

  // Process profile
  const profileData = profileResult.data;
  const birthDate = profileData?.birth_date ? new Date(profileData.birth_date) : null;
  const targetAge = profileData?.target_age || 60;
  const profile = profileData ? { 
    display_name: profileData.display_name, 
    avatar_url: profileData.avatar_url 
  } : null;

  // Process weekly study trend
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const studyByDay: Record<string, number> = {};
  weeklyStudyResult.data?.forEach(log => {
    studyByDay[log.date] = (studyByDay[log.date] || 0) + log.duration;
  });
  const studyTrend = weekDays.map(day => ({
    name: format(day, "EEE"),
    value: studyByDay[format(day, "yyyy-MM-dd")] || 0,
  }));

  // Process heatmap data
  const heatmapByDate: Record<string, { completed: number; total: number }> = {};
  heatmapTodosResult.data?.forEach(todo => {
    if (!heatmapByDate[todo.date]) {
      heatmapByDate[todo.date] = { completed: 0, total: 0 };
    }
    heatmapByDate[todo.date].total++;
    if (todo.status === "done") heatmapByDate[todo.date].completed++;
  });
  
  const heatmapDays = Array.from({ length: 84 }, (_, i) => format(subDays(new Date(), 83 - i), "yyyy-MM-dd"));
  const heatmapData = heatmapDays.map(date => {
    const dayData = heatmapByDate[date];
    if (!dayData || dayData.total === 0) return 0;
    const rate = Math.round((dayData.completed / dayData.total) * 100);
    if (rate === 0) return 0;
    if (rate < 25) return 1;
    if (rate < 50) return 2;
    if (rate < 75) return 3;
    return 4;
  });

  // Process activity
  const recentActivity = (activityResult.data || []).map(a => ({
    action: a.action,
    module: a.module,
    timestamp: a.created_at ? formatDistanceToNow(parseISO(a.created_at), { addSuffix: true }) : "recently"
  }));

  // Process achievements
  const recentAchievements = (achievementsResult.data || []).map(a => ({
    date: format(parseISO(a.achieved_at), "MMM d"),
    title: a.title,
    description: a.description || "",
    category: a.category
  }));

  return {
    todosStats,
    studyMinutes,
    birthDate,
    targetAge,
    studyTrend,
    heatmapData,
    recentActivity,
    recentAchievements,
    profile
  };
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  });

  // Manual refresh function
  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] });
  }, [queryClient, user?.id]);

  return {
    ...query,
    refresh,
    isRefreshing: query.isFetching && !query.isLoading,
  };
};
