import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp,
  BookOpen, 
  CheckSquare, 
  Clock, 
  FileText, 
  Heart,
  Sparkles,
  ChevronRight,
  Music,
  Target,
  Users,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TodayStats {
  // Finance
  transactionsToday: number;
  spentToday: number;
  incomeToday: number;
  monthlySpent: number;
  monthlyBudget: number;
  
  // Learning
  pagesRead: number;
  booksInProgress: number;
  studyMinutes: number;
  
  // Productivity
  tasksTotal: number;
  tasksCompleted: number;
  focusMinutes: number;
  
  // Life
  documentsExpiring: number;
  familyUpdates: number;
  memoriesThisMonth: number;
  
  // Wellness
  focusSessions: number;
  streakDays: number;
}

const TodaySummary = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TodayStats>({
    transactionsToday: 0,
    spentToday: 0,
    incomeToday: 0,
    monthlySpent: 0,
    monthlyBudget: 50000,
    pagesRead: 0,
    booksInProgress: 0,
    studyMinutes: 0,
    tasksTotal: 0,
    tasksCompleted: 0,
    focusMinutes: 0,
    documentsExpiring: 0,
    familyUpdates: 0,
    memoriesThisMonth: 0,
    focusSessions: 0,
    streakDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTodayStats();
  }, [user]);

  const fetchTodayStats = async () => {
    if (!user) return;
    
    const today = new Date();
    const todayStart = format(startOfDay(today), "yyyy-MM-dd");
    const todayEnd = format(endOfDay(today), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
    
    try {
      // Parallel fetch all data
      const [
        expensesToday,
        expensesMonth,
        incomeToday,
        todosToday,
        libraryItems,
        readingState,
        documentsExpiring,
        familyMembers,
        memories,
        budgetLimits,
      ] = await Promise.all([
        // Today's expenses
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user.id)
          .gte("expense_date", todayStart)
          .lte("expense_date", todayEnd),
        // Month's expenses
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user.id)
          .gte("expense_date", monthStart)
          .lte("expense_date", monthEnd),
        // Today's income
        supabase
          .from("income_entries")
          .select("amount")
          .eq("user_id", user.id)
          .gte("income_date", todayStart)
          .lte("income_date", todayEnd),
        // Today's todos
        supabase
          .from("todos")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("date", todayStart),
        // Books in progress
        supabase
          .from("library_items")
          .select("id")
          .eq("user_id", user.id),
        // Reading state
        supabase
          .from("reading_state")
          .select("last_page, progress_percent, total_minutes")
          .eq("user_id", user.id),
        // Documents expiring in 30 days
        supabase
          .from("documents")
          .select("id")
          .eq("user_id", user.id)
          .not("expiry_date", "is", null)
          .lte("expiry_date", format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")),
        // Family members
        supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id),
        // Memories this month
        supabase
          .from("memories")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", monthStart),
        // Budget limits
        supabase
          .from("budget_limits")
          .select("monthly_limit")
          .eq("user_id", user.id),
      ]);

      const spentToday = expensesToday.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const monthlySpent = expensesMonth.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const incomeTodayAmount = incomeToday.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalBudget = budgetLimits.data?.reduce((sum, b) => sum + Number(b.monthly_limit), 0) || 50000;
      
      const booksInProgress = readingState.data?.filter(r => 
        (r.progress_percent || 0) > 0 && (r.progress_percent || 0) < 100
      ).length || 0;
      
      const pagesRead = readingState.data?.reduce((sum, r) => sum + (r.last_page || 0), 0) || 0;
      
      const studyMinutes = readingState.data?.reduce((sum, r) => sum + (r.total_minutes || 0), 0) || 0;
      
      const tasksTotal = todosToday.data?.length || 0;
      const tasksCompleted = todosToday.data?.filter(t => t.status === 'done').length || 0;

      setStats({
        transactionsToday: expensesToday.data?.length || 0,
        spentToday,
        incomeToday: incomeTodayAmount,
        monthlySpent,
        monthlyBudget: totalBudget,
        pagesRead,
        booksInProgress,
        studyMinutes,
        tasksTotal,
        tasksCompleted,
        focusMinutes: studyMinutes,
        documentsExpiring: documentsExpiring.data?.length || 0,
        familyUpdates: familyMembers.data?.length || 0,
        memoriesThisMonth: memories.data?.length || 0,
        focusSessions: 0,
        streakDays: 7, // Would calculate from daily_badges
      });
    } catch (error) {
      console.error("Error fetching today stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const budgetPercent = stats.monthlyBudget > 0 
    ? Math.round((stats.monthlySpent / stats.monthlyBudget) * 100) 
    : 0;
  
  const taskPercent = stats.tasksTotal > 0 
    ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) 
    : 0;

  const SummarySection = ({ 
    title, 
    icon: Icon, 
    iconColor, 
    children, 
    link 
  }: { 
    title: string; 
    icon: any; 
    iconColor: string; 
    children: React.ReactNode;
    link: string;
  }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", iconColor)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <Link to={link}>
          <Button variant="ghost" size="sm" className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
      <div className="space-y-2 pl-8">
        {children}
      </div>
    </motion.div>
  );

  const StatLine = ({ label, value, subValue, trend }: { 
    label: string; 
    value: string | number; 
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{value}</span>
        {subValue && <span className="text-xs text-muted-foreground">({subValue})</span>}
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Today's Summary
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal">
            {format(new Date(), "EEEE, MMM d")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Finance Section */}
        <SummarySection 
          title="Finance" 
          icon={Wallet} 
          iconColor="bg-amber-500/10 text-amber-500"
          link="/app/expenses"
        >
          <StatLine 
            label="Spent today" 
            value={`₹${stats.spentToday.toLocaleString()}`} 
            subValue={`${stats.transactionsToday} txns`}
          />
          {stats.incomeToday > 0 && (
            <StatLine 
              label="Received today" 
              value={`₹${stats.incomeToday.toLocaleString()}`} 
              trend="up"
            />
          )}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Monthly budget</span>
              <span className={cn(
                "font-medium",
                budgetPercent > 80 ? "text-destructive" : "text-muted-foreground"
              )}>
                {budgetPercent}%
              </span>
            </div>
            <Progress 
              value={Math.min(budgetPercent, 100)} 
              className="h-1.5"
            />
          </div>
        </SummarySection>

        <Separator className="bg-border/50" />

        {/* Learning Section */}
        <SummarySection 
          title="Learning" 
          icon={BookOpen} 
          iconColor="bg-blue-500/10 text-blue-500"
          link="/app/library"
        >
          <StatLine label="Pages read" value={stats.pagesRead} />
          <StatLine label="Books in progress" value={stats.booksInProgress} />
          <StatLine label="Study time" value={`${stats.studyMinutes} min`} />
        </SummarySection>

        <Separator className="bg-border/50" />

        {/* Productivity Section */}
        <SummarySection 
          title="Productivity" 
          icon={CheckSquare} 
          iconColor="bg-emerald-500/10 text-emerald-500"
          link="/app/todos"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tasks</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {stats.tasksCompleted}/{stats.tasksTotal}
              </span>
              {stats.tasksTotal > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px]",
                    taskPercent === 100 ? "bg-emerald-500/10 text-emerald-500" : ""
                  )}
                >
                  {taskPercent}%
                </Badge>
              )}
            </div>
          </div>
          <StatLine label="Focus sessions" value={stats.focusSessions} />
        </SummarySection>

        <Separator className="bg-border/50" />

        {/* Life Section */}
        <SummarySection 
          title="Life" 
          icon={Heart} 
          iconColor="bg-rose-500/10 text-rose-500"
          link="/app/documents"
        >
          {stats.documentsExpiring > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Documents expiring
              </span>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                {stats.documentsExpiring}
              </Badge>
            </div>
          )}
          <StatLine label="Family members" value={stats.familyUpdates} />
          <StatLine label="Memories this month" value={stats.memoriesThisMonth} />
        </SummarySection>

        <Separator className="bg-border/50" />

        {/* Wellness Section */}
        <SummarySection 
          title="Wellness" 
          icon={Target} 
          iconColor="bg-purple-500/10 text-purple-500"
          link="/app/study"
        >
          <StatLine label="Focus time" value={`${stats.focusMinutes} min`} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Daily streak</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{stats.streakDays} days</span>
              <span className="text-lg">🔥</span>
            </div>
          </div>
        </SummarySection>
      </CardContent>
    </Card>
  );
};

export default TodaySummary;
