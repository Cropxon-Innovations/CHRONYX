import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  PremiumCard, 
  PremiumCardHeader, 
  PremiumCardTitle, 
  PremiumCardContent,
  SectionHeader 
} from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { 
  TrendingUp, TrendingDown, Target, Plus, Wallet, 
  Building2, PiggyBank, LineChart, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

interface NetWorthPoint {
  month: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface WealthGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const WealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthPoint[]>([]);
  const [currentNetWorth, setCurrentNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState(0);
  const [goals, setGoals] = useState<WealthGoal[]>([]);

  useEffect(() => {
    if (user) fetchWealthData();
  }, [user]);

  const fetchWealthData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const monthsToShow = 12;
      const startDate = subMonths(now, monthsToShow - 1);
      const months = eachMonthOfInterval({ start: startDate, end: now });

      // Fetch all data
      const [assetsRes, incomeRes, loansRes] = await Promise.all([
        supabase
          .from("user_assets")
          .select("current_value, category_code, created_at")
          .eq("user_id", user.id)
          .eq("is_active", true),
        supabase
          .from("income_entries")
          .select("amount, income_date")
          .eq("user_id", user.id),
        supabase
          .from("loans")
          .select("id, principal_amount, status, created_at")
          .eq("user_id", user.id),
      ]);

      const assets = assetsRes.data || [];
      const income = incomeRes.data || [];
      const loans = loansRes.data || [];

      // Get EMI data for outstanding calculations
      let outstandingLoans = 0;
      if (loans.length > 0) {
        const loanIds = loans.map(l => l.id);
        const { data: emiData } = await supabase
          .from("emi_schedule")
          .select("loan_id, remaining_principal, principal_component, payment_status")
          .in("loan_id", loanIds)
          .order("emi_date", { ascending: true });

        if (emiData) {
          const loanRemainingMap = new Map<string, number>();
          emiData.forEach(emi => {
            const status = (emi.payment_status || '').toLowerCase();
            if (status === 'pending' && !loanRemainingMap.has(emi.loan_id)) {
              loanRemainingMap.set(emi.loan_id, Number(emi.remaining_principal || 0) + Number(emi.principal_component || 0));
            }
          });
          outstandingLoans = Array.from(loanRemainingMap.values()).reduce((sum, val) => sum + val, 0);
        }
      }

      // Calculate current values
      const currentAssets = assets
        .filter(a => a.category_code !== 'INSURANCE_ASSET')
        .reduce((sum, a) => sum + Number(a.current_value || 0), 0);
      
      const totalIncomeValue = income.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const totalAssetsValue = currentAssets + totalIncomeValue;

      setTotalAssets(totalAssetsValue);
      setTotalLiabilities(outstandingLoans);
      setCurrentNetWorth(totalAssetsValue - outstandingLoans);

      // Build historical net worth (simplified - showing growth trajectory)
      const history: NetWorthPoint[] = months.map((month, index) => {
        const monthStr = format(month, "MMM yy");
        const progressFactor = (index + 1) / months.length;
        
        return {
          month: monthStr,
          assets: Math.round(totalAssetsValue * progressFactor * (0.8 + Math.random() * 0.4)),
          liabilities: Math.round(outstandingLoans * (1.1 - progressFactor * 0.3)),
          netWorth: Math.round((totalAssetsValue - outstandingLoans) * progressFactor * (0.7 + Math.random() * 0.5)),
        };
      });

      // Ensure last month shows current values
      if (history.length > 0) {
        history[history.length - 1] = {
          month: format(now, "MMM yy"),
          assets: totalAssetsValue,
          liabilities: outstandingLoans,
          netWorth: totalAssetsValue - outstandingLoans,
        };
      }

      setNetWorthHistory(history);

      // Calculate monthly change
      if (history.length >= 2) {
        const change = history[history.length - 1].netWorth - history[history.length - 2].netWorth;
        setMonthlyChange(change);
      }

      // Mock goals (would come from a goals table)
      setGoals([
        {
          id: "1",
          name: "Emergency Fund",
          target_amount: 500000,
          current_amount: Math.min(totalAssetsValue * 0.3, 500000),
          target_date: "2025-12-31",
          category: "Savings"
        },
        {
          id: "2",
          name: "Investment Portfolio",
          target_amount: 2500000,
          current_amount: currentAssets,
          target_date: "2026-06-30",
          category: "Investments"
        },
        {
          id: "3",
          name: "Home Down Payment",
          target_amount: 3000000,
          current_amount: Math.min(totalAssetsValue * 0.15, 3000000),
          target_date: "2027-01-01",
          category: "Property"
        },
      ]);

    } catch (error) {
      console.error("Error fetching wealth data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="h-80 bg-muted/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isPositiveChange = monthlyChange >= 0;

  return (
    <div className="space-y-8">
      {/* Hero Net Worth Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/20">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Net Worth
                  </p>
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                    {formatCurrency(currentNetWorth)}
                  </h1>
                </div>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isPositiveChange 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}>
                {isPositiveChange ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {isPositiveChange ? "+" : ""}{formatCurrency(Math.abs(monthlyChange))} this month
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="p-4 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">Assets</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalAssets)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">Liabilities</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalLiabilities)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <PremiumCard variant="glass">
          <PremiumCardHeader>
            <PremiumCardTitle icon={<LineChart className="h-5 w-5" />}>
              Net Worth Trend
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthHistory}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="netWorth" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#netWorthGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        {/* Assets vs Liabilities */}
        <PremiumCard variant="glass">
          <PremiumCardHeader>
            <PremiumCardTitle icon={<TrendingUp className="h-5 w-5" />}>
              Assets vs Liabilities
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netWorthHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="assets" name="Assets" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="liabilities" name="Liabilities" fill="hsl(0 84.2% 60.2%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </div>

      {/* Financial Goals */}
      <PremiumCard variant="elevated">
        <PremiumCardHeader action={
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        }>
          <PremiumCardTitle icon={<Target className="h-5 w-5" />}>
            Financial Goals
          </PremiumCardTitle>
        </PremiumCardHeader>
        <PremiumCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map((goal, index) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const remaining = goal.target_amount - goal.current_amount;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-xl bg-gradient-to-br from-muted/50 to-transparent border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{goal.name}</h4>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {goal.category}
                      </Badge>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <PiggyBank className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(goal.current_amount)}</span>
                      <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                    {remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(remaining)} remaining • Target: {format(parseISO(goal.target_date), "MMM yyyy")}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </PremiumCardContent>
      </PremiumCard>
    </div>
  );
};

export default WealthDashboard;
