import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import TodaySummary from "@/components/dashboard/TodaySummary";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import WealthDashboard from "@/components/dashboard/WealthDashboard";
import ResolutionsSection from "@/components/resolutions/ResolutionsSection";
import WalletRedemption from "@/components/resolutions/WalletRedemption";
  PremiumCard, 
  PremiumCardHeader, 
  PremiumCardTitle, 
  PremiumCardContent,
  SectionHeader 
} from "@/components/ui/premium-card";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, Settings, User, CheckCircle, BookOpen, 
  CreditCard, Shield, LayoutDashboard, TrendingUp, Activity
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("overview");
  
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
      {/* Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            {profile?.display_name ? `Welcome, ${profile.display_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="h-10 w-10 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-primary/5">
                <Avatar className="h-10 w-10 ring-2 ring-border/50 ring-offset-2 ring-offset-background">
                  {profile?.avatar_url?.startsWith("emoji:") ? (
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-lg">
                      {profile.avatar_url.replace("emoji:", "")}
                    </AvatarFallback>
                  ) : profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.display_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="cursor-pointer rounded-lg">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & Plan</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="cursor-pointer rounded-lg">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="cursor-pointer rounded-lg"
              >
                {theme === 'dark' ? '☀️' : '🌙'} 
                <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut()} 
                className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground backdrop-blur-sm border border-border/50">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="wealth" className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Wealth
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Bio Card & Reflection */}
          <BioCard />
          <DailyReflection />
          
          {/* Pending Yesterday Tasks */}
          <PendingYesterdayTasks />

          {/* Premium Metric Cards */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <MetricCard 
              value={completionRate} 
              suffix="%" 
              label="Todo Completion" 
              icon={CheckCircle}
              accentColor={completionRate >= 70 ? "success" : completionRate >= 40 ? "warning" : "danger"}
              trend={completionRate >= 50 ? "up" : "down"}
              trendValue={`${todosStats.completed}/${todosStats.total}`}
            />
            <MetricCard 
              value={studyMinutes} 
              suffix="min" 
              label="Study Today" 
              icon={BookOpen}
              accentColor="info"
              trend={studyMinutes >= 30 ? "up" : "neutral"}
              trendValue={studyMinutes >= 60 ? "Great!" : "Keep going"}
            />
            <MetricCard 
              value={emiDueAmount !== null ? `₹${(emiDueAmount / 1000).toFixed(0)}K` : "—"} 
              label="EMI Due"
              icon={CreditCard}
              accentColor={emiDueAmount && emiDueAmount > 0 ? "warning" : "success"}
            />
            <MetricCard 
              value={activePoliciesCount !== null ? activePoliciesCount : "—"} 
              label="Active Policies"
              icon={Shield}
              accentColor="default"
            />
          </motion.section>

          {/* Days Remaining - Premium Style */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PremiumCard variant="gradient" className="overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
              <div className="relative p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Days Until {targetAge}
                    </p>
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                      {daysRemaining.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Make every day count
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-2xl font-semibold text-primary">
                      ~{Math.floor(daysRemaining / 365)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">years left</p>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.section>

          {/* Trends Section */}
          <section className="space-y-4">
            <SectionHeader title="Trends" subtitle="Your productivity at a glance" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PremiumCard variant="glass">
                <PremiumCardContent className="p-4">
                  <Heatmap title="Productivity" data={heatmapData.length > 0 ? heatmapData : Array(84).fill(0)} />
                </PremiumCardContent>
              </PremiumCard>
              <PremiumCard variant="glass">
                <PremiumCardContent className="p-4">
                  <TrendChart title="Study This Week" data={studyTrend.length > 0 ? studyTrend : []} />
                </PremiumCardContent>
              </PremiumCard>
            </div>
          </section>

          {/* Life Section */}
          <section className="space-y-4">
            <SectionHeader title="Life" subtitle="Your journey visualized" />
            <PremiumCard variant="elevated">
              <PremiumCardContent className="p-4">
                <LifespanBar daysLived={daysLived} daysRemaining={daysRemaining} />
              </PremiumCardContent>
            </PremiumCard>
          </section>

          {/* Financial Overview */}
          <section className="space-y-4">
            <SectionHeader title="Financial Overview" subtitle="Your money at a glance" />
            <FinancialOverview />
          </section>

          {/* Loan & Insurance Widgets */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LoanWidget />
            <InsuranceWidget />
            <UpcomingReminders />
          </section>

          {/* Today's Summary & Notifications */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodaySummary />
            <NotificationCenter />
          </section>

          {/* Resolutions & Goals */}
          <ResolutionsSection />
          
          {/* Wallet & Redemption */}
          <WalletRedemption />
        </TabsContent>

        {/* Wealth Tab */}
        <TabsContent value="wealth" className="mt-0">
          <WealthDashboard />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Achievements */}
            <PremiumCard variant="elevated">
              <PremiumCardHeader>
                <PremiumCardTitle>Recent Achievements</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <div className="space-y-0">
                  {recentAchievements.length > 0 ? (
                    recentAchievements.map((achievement, i) => (
                      <AchievementItem key={i} {...achievement} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No achievements yet</p>
                  )}
                </div>
              </PremiumCardContent>
            </PremiumCard>

            {/* Recent Activity */}
            <PremiumCard variant="elevated">
              <PremiumCardHeader>
                <PremiumCardTitle>Recent Activity</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <div>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, i) => (
                      <ActivityItem key={i} {...activity} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No recent activity</p>
                  )}
                </div>
              </PremiumCardContent>
            </PremiumCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
