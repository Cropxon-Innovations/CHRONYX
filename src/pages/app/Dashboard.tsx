import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import LifespanBar from "@/components/dashboard/LifespanBar";
import TrendChart from "@/components/dashboard/TrendChart";
import Heatmap from "@/components/dashboard/Heatmap";
import ActivityItem from "@/components/dashboard/ActivityItem";
import AchievementItem from "@/components/dashboard/AchievementItem";
import LoanWidget from "@/components/dashboard/LoanWidget";
import InsuranceWidget from "@/components/dashboard/InsuranceWidget";
import UpcomingReminders from "@/components/dashboard/UpcomingReminders";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import PendingYesterdayTasks from "@/components/dashboard/PendingYesterdayTasks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { format, subDays, startOfWeek, addDays, parseISO, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todosStats, setTodosStats] = useState({ completed: 0, total: 0 });
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [targetAge, setTargetAge] = useState(60);
  const [studyTrend, setStudyTrend] = useState<Array<{ name: string; value: number }>>([]);
  const [heatmapData, setHeatmapData] = useState<number[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ action: string; module: string; timestamp: string }>>([]);
  const [recentAchievements, setRecentAchievements] = useState<Array<{ date: string; title: string; description: string; category: string }>>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    
    const today = new Date().toISOString().split("T")[0];

    // Fetch todos for today
    const { data: todos } = await supabase
      .from("todos")
      .select("status")
      .eq("date", today);

    if (todos) {
      const completed = todos.filter(t => t.status === "done").length;
      setTodosStats({ completed, total: todos.length });
    }

    // Fetch study logs for today
    const { data: studyLogs } = await supabase
      .from("study_logs")
      .select("duration")
      .eq("date", today);

    if (studyLogs) {
      const total = studyLogs.reduce((acc, log) => acc + log.duration, 0);
      setStudyMinutes(total);
    }

    // Fetch profile for lifespan calculations and display
    const { data: profileData } = await supabase
      .from("profiles")
      .select("birth_date, target_age, display_name, avatar_url")
      .eq("id", user?.id)
      .maybeSingle();

    if (profileData) {
      if (profileData.birth_date) {
        setBirthDate(new Date(profileData.birth_date));
      }
      setTargetAge(profileData.target_age || 60);
      setProfile({ display_name: profileData.display_name, avatar_url: profileData.avatar_url });
    }

    // Fetch study trend for this week
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekDates = weekDays.map(d => format(d, "yyyy-MM-dd"));
    
    const { data: weeklyStudy } = await supabase
      .from("study_logs")
      .select("date, duration")
      .gte("date", weekDates[0])
      .lte("date", weekDates[6]);

    const studyByDay: Record<string, number> = {};
    weeklyStudy?.forEach(log => {
      studyByDay[log.date] = (studyByDay[log.date] || 0) + log.duration;
    });

    const trendData = weekDays.map(day => ({
      name: format(day, "EEE"),
      value: studyByDay[format(day, "yyyy-MM-dd")] || 0,
    }));
    setStudyTrend(trendData);

    // Fetch heatmap data (last 84 days of todos)
    const heatmapStartDate = format(subDays(new Date(), 83), "yyyy-MM-dd");
    const { data: heatmapTodos } = await supabase
      .from("todos")
      .select("date, status")
      .gte("date", heatmapStartDate)
      .order("date", { ascending: true });

    const todosByDay: Record<string, { done: number; total: number }> = {};
    heatmapTodos?.forEach(todo => {
      if (!todosByDay[todo.date]) {
        todosByDay[todo.date] = { done: 0, total: 0 };
      }
      todosByDay[todo.date].total++;
      if (todo.status === "done") {
        todosByDay[todo.date].done++;
      }
    });

    const heatmap: number[] = [];
    for (let i = 83; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayData = todosByDay[date];
      if (dayData && dayData.total > 0) {
        const ratio = dayData.done / dayData.total;
        heatmap.push(Math.round(ratio * 4));
      } else {
        heatmap.push(0);
      }
    }
    setHeatmapData(heatmap);

    // Fetch recent activity
    const { data: activityLogs } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (activityLogs) {
      setRecentActivity(activityLogs.map(log => ({
        action: log.action,
        module: log.module,
        timestamp: formatDistanceToNow(new Date(log.created_at!), { addSuffix: true }),
      })));
    }

    // Fetch recent achievements
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*")
      .order("achieved_at", { ascending: false })
      .limit(3);

    if (achievements) {
      setRecentAchievements(achievements.map(a => ({
        date: format(parseISO(a.achieved_at), "MMM d, yyyy"),
        title: a.title,
        description: a.description || "",
        category: a.category,
      })));
    }

    setLoading(false);
    if (showRefreshIndicator) setIsRefreshing(false);
  }, [user]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Calculate lifespan data
  const effectiveBirthDate = birthDate || new Date(1991, 0, 1);
  const today = new Date();
  const daysLived = Math.floor((today.getTime() - effectiveBirthDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDate = new Date(effectiveBirthDate);
  targetDate.setFullYear(effectiveBirthDate.getFullYear() + targetAge);
  const daysRemaining = Math.max(0, Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const completionRate = todosStats.total > 0 
    ? Math.round((todosStats.completed / todosStats.total) * 100) 
    : 0;

  if (loading || onboardingLoading) {
    return <DashboardSkeleton />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-1 sm:px-0">
      {/* Header with User Menu */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-foreground tracking-wide">
            {profile?.display_name ? `Welcome back, ${profile.display_name.split(' ')[0]}` : 'Today'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {profile?.avatar_url?.startsWith("emoji:") ? (
                    <AvatarFallback className="bg-primary/10 text-lg">
                      {profile.avatar_url.replace("emoji:", "")}
                    </AvatarFallback>
                  ) : profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.display_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & Plan</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="cursor-pointer"
              >
                {theme === 'dark' ? '☀️' : '🌙'} 
                <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut()} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Pending Yesterday Tasks */}
      <PendingYesterdayTasks />

      {/* Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard value={completionRate} suffix="%" label="Todo Completion" />
        <MetricCard value={studyMinutes} suffix="min" label="Study Today" />
        <MetricCard value="—" label="EMI Due" />
        <MetricCard value="—" label="Active Policies" />
      </section>

      {/* Days Remaining Highlight */}
      <section className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">Days Until {targetAge}</p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mt-2">
              {daysRemaining.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">
              ~{Math.floor(daysRemaining / 365)} years
            </p>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section>
        <h2 className="text-base sm:text-lg font-light text-foreground mb-3 sm:mb-4">Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <Heatmap title="Productivity" data={heatmapData.length > 0 ? heatmapData : Array(84).fill(0)} />
          <TrendChart title="Study This Week" data={studyTrend.length > 0 ? studyTrend : []} />
        </div>
      </section>

      {/* Life Section */}
      <section>
        <h2 className="text-base sm:text-lg font-light text-foreground mb-3 sm:mb-4">Life</h2>
        <LifespanBar daysLived={daysLived} daysRemaining={daysRemaining} />
      </section>

      {/* Financial Overview */}
      <section>
        <h2 className="text-base sm:text-lg font-light text-foreground mb-3 sm:mb-4">Financial Overview</h2>
        <FinancialOverview />
      </section>

      {/* Loan & Insurance Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <LoanWidget />
        <InsuranceWidget />
        <UpcomingReminders />
      </section>

      {/* Bottom Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Achievements */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 sm:mb-6">
            Recent Achievements
          </h3>
          <div className="space-y-0">
            {recentAchievements.length > 0 ? (
              recentAchievements.map((achievement, i) => (
                <AchievementItem key={i} {...achievement} />
              ))
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No achievements yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 sm:mb-6">
            Recent Activity
          </h3>
          <div>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, i) => (
                <ActivityItem key={i} {...activity} />
              ))
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
