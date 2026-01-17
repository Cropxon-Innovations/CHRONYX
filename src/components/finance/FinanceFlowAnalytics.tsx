import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  Sparkles, 
  TrendingUp, 
  Mail, 
  PenLine, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, startOfMonth, subDays, subMonths, eachDayOfInterval, eachWeekOfInterval } from "date-fns";

interface AnalyticsData {
  autoImported: number;
  manual: number;
  totalAmount: {
    auto: number;
    manual: number;
  };
  categoryBreakdown: { name: string; auto: number; manual: number }[];
  timelineData: { date: string; auto: number; manual: number }[];
  syncHistory: { date: string; imported: number; scanned: number }[];
}

const COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

const FinanceFlowAnalytics = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    autoImported: 0,
    manual: 0,
    totalAmount: { auto: 0, manual: 0 },
    categoryBreakdown: [],
    timelineData: [],
    syncHistory: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, period]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    const startDate = period === "week" 
      ? subDays(now, 7) 
      : subMonths(now, 1);
    const startDateStr = format(startDate, "yyyy-MM-dd");

    // Fetch all expenses for the period
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, amount, category, expense_date, is_auto_generated")
      .eq("user_id", user.id)
      .gte("expense_date", startDateStr)
      .order("expense_date", { ascending: true });

    if (!expenses) {
      setLoading(false);
      return;
    }

    // Calculate counts and amounts
    const autoExpenses = expenses.filter(e => e.is_auto_generated);
    const manualExpenses = expenses.filter(e => !e.is_auto_generated);

    const autoTotal = autoExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const manualTotal = manualExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Category breakdown
    const categoryMap = new Map<string, { auto: number; manual: number }>();
    expenses.forEach(e => {
      const existing = categoryMap.get(e.category) || { auto: 0, manual: 0 };
      if (e.is_auto_generated) {
        existing.auto += Number(e.amount);
      } else {
        existing.manual += Number(e.amount);
      }
      categoryMap.set(e.category, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b.auto + b.manual) - (a.auto + a.manual))
      .slice(0, 6);

    // Timeline data
    const days = eachDayOfInterval({ start: startDate, end: now });
    const timelineData = days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayExpenses = expenses.filter(e => e.expense_date === dayStr);
      return {
        date: format(day, period === "week" ? "EEE" : "MMM d"),
        auto: dayExpenses.filter(e => e.is_auto_generated).reduce((sum, e) => sum + Number(e.amount), 0),
        manual: dayExpenses.filter(e => !e.is_auto_generated).reduce((sum, e) => sum + Number(e.amount), 0),
      };
    });

    // Fetch sync history
    const { data: syncData } = await supabase
      .from("financeflow_sync_history")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const syncHistory = (syncData || []).map(s => ({
      date: format(new Date(s.created_at), "MMM d, HH:mm"),
      imported: s.imported_count,
      scanned: s.emails_scanned,
    }));

    setAnalytics({
      autoImported: autoExpenses.length,
      manual: manualExpenses.length,
      totalAmount: { auto: autoTotal, manual: manualTotal },
      categoryBreakdown,
      timelineData,
      syncHistory,
    });

    setLoading(false);
  };

  const totalExpenses = analytics.autoImported + analytics.manual;
  const autoPercentage = totalExpenses > 0 
    ? Math.round((analytics.autoImported / totalExpenses) * 100) 
    : 0;

  const pieData = [
    { name: "Auto-Imported", value: analytics.autoImported, color: "#ef4444" },
    { name: "Manual", value: analytics.manual, color: "#3b82f6" },
  ];

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-500" />
            <CardTitle className="text-base">FinanceFlow Analytics</CardTitle>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs h-6 px-2">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs h-6 px-2">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription className="text-xs">
          Auto-imported vs manual expense breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Auto-Imported</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{analytics.autoImported}</p>
            <p className="text-xs text-muted-foreground">₹{analytics.totalAmount.auto.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <PenLine className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Manual</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{analytics.manual}</p>
            <p className="text-xs text-muted-foreground">₹{analytics.totalAmount.manual.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Auto Rate</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{autoPercentage}%</p>
            <p className="text-xs text-muted-foreground">automation</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Total</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{totalExpenses}</p>
            <p className="text-xs text-muted-foreground">expenses</p>
          </motion.div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="category" className="text-xs">Categories</TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs">Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timelineData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="auto" name="Auto" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="manual" name="Manual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="category" className="mt-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="auto" name="Auto" stackId="a" fill="#ef4444" />
                  <Bar dataKey="manual" name="Manual" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sync Activity */}
        {analytics.syncHistory.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">
              Recent Sync Activity
            </h4>
            <div className="space-y-2">
              {analytics.syncHistory.slice(-5).map((sync, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{sync.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {sync.scanned} scanned
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      +{sync.imported} imported
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinanceFlowAnalytics;
