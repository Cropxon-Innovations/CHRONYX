import { useState, useEffect } from "react";
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
import { DailyReflection } from "@/components/notes/DailyReflection";
import { BioCard } from "@/components/dashboard/BioCard";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useDashboardData } from "@/hooks/useDashboardData";
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
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  
  // State for EMI and Insurance metrics
  const [emiDueAmount, setEmiDueAmount] = useState<number | null>(null);
  const [activePoliciesCount, setActivePoliciesCount] = useState<number | null>(null);
  
  // Use React Query with stale-while-revalidate pattern
  const { 
    data, 
    isLoading, 
    isRefreshing, 
    refresh 
  } = useDashboardData();

  // Fetch EMI Due and Active Policies for metric cards
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?.id) return;

      try {
        // Fetch active loans and their EMI schedules for this month
        const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

        const { data: loans } = await supabase
          .from("loans")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (loans && loans.length > 0) {
          const loanIds = loans.map(l => l.id);
          const { data: emis } = await supabase
            .from("emi_schedule")
            .select("emi_amount, payment_status")
            .in("loan_id", loanIds)
            .gte("emi_date", monthStart)
            .lte("emi_date", monthEnd);

          const emiDue = emis
            ?.filter(e => e.payment_status !== 'Paid')
            .reduce((sum, e) => sum + Number(e.emi_amount), 0) || 0;
          setEmiDueAmount(emiDue);
        } else {
          setEmiDueAmount(0);
        }

        // Fetch active insurance policies count
        const { data: policies, count } = await supabase
          .from("insurances")
          .select("id", { count: 'exact' })
          .eq("user_id", user.id)
          .eq("status", "active");

        setActivePoliciesCount(count || 0);
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
      }
    };

    fetchMetrics();
  }, [user?.id]);

  // Extract data with defaults
  const todosStats = data?.todosStats ?? { completed: 0, total: 0 };
  const studyMinutes = data?.studyMinutes ?? 0;
  const birthDate = data?.birthDate ?? null;
  const targetAge = data?.targetAge ?? 60;
  const studyTrend = data?.studyTrend ?? [];
  const heatmapData = data?.heatmapData ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const recentAchievements = data?.recentAchievements ?? [];
  const profile = data?.profile ?? null;

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

  if (isLoading || onboardingLoading) {
    return <DashboardSkeleton />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-1 sm:px-0">
      {/* Bio Card - Health Profile */}
      <BioCard />
      
      {/* Daily Reflection Widget */}
      <DailyReflection />

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
            onClick={() => refresh()}
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
        <MetricCard 
          value={emiDueAmount !== null ? `₹${(emiDueAmount / 1000).toFixed(0)}K` : "—"} 
          label="EMI Due" 
        />
        <MetricCard 
          value={activePoliciesCount !== null ? activePoliciesCount : "—"} 
          label="Active Policies" 
        />
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
