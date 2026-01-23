import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, parseISO } from "date-fns";
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, 
  Calendar, ArrowUpRight, ArrowDownRight, Wallet, CreditCard
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from "recharts";

interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  categoryBreakdown: Array<{ name: string; value: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; income: number; expenses: number; net: number }>;
  dailySpending: Array<{ date: string; amount: number }>;
  topMerchants: Array<{ name: string; amount: number; count: number }>;
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
  averageDaily: number;
  highestSpendDay: { date: string; amount: number };
  savingsRate: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
];

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
};

export const FinanceAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>("6months");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, period]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Calculate date range
      const endDate = new Date();
      let startDate: Date;
      
      switch (period) {
        case "1month": startDate = subMonths(endDate, 1); break;
        case "3months": startDate = subMonths(endDate, 3); break;
        case "6months": startDate = subMonths(endDate, 6); break;
        case "1year": startDate = subMonths(endDate, 12); break;
        default: startDate = subMonths(endDate, 6);
      }

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      // Fetch all data in parallel
      const [expensesRes, incomeRes, transactionsRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .gte("expense_date", startStr)
          .lte("expense_date", endStr),
        supabase
          .from("income_entries")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startStr)
          .lte("date", endStr),
        supabase
          .from("auto_imported_transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_duplicate", false)
          .gte("transaction_date", startStr)
          .lte("transaction_date", endStr),
      ]);

      const expenses = expensesRes.data || [];
      const income = incomeRes.data || [];
      const transactions = transactionsRes.data || [];

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) +
        transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const totalIncome = income.reduce((sum, i) => sum + Number(i.amount || 0), 0) +
        transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const netFlow = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((netFlow / totalIncome) * 100) : 0;

      // Category breakdown (from expenses + transactions)
      const categoryMap = new Map<string, number>();
      expenses.forEach(e => {
        const cat = (e as any).category || 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount || 0));
      });
      transactions.filter(t => t.transaction_type === 'expense').forEach(t => {
        const cat = (t as any).category || 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount || 0));
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Monthly trend
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const monthlyTrend = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthStr = format(month, "MMM yyyy");

        const monthExpenses = expenses
          .filter(e => {
            const d = parseISO(e.expense_date);
            return d >= monthStart && d <= monthEnd;
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const monthTransactionExpenses = transactions
          .filter(t => {
            const d = parseISO(t.transaction_date);
            return d >= monthStart && d <= monthEnd && t.transaction_type === 'expense';
          })
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthIncome = income
          .filter(i => {
            const d = parseISO((i as any).income_date || (i as any).date);
            return d >= monthStart && d <= monthEnd;
          })
          .reduce((sum, i) => sum + Number(i.amount || 0), 0);

        const monthTransactionIncome = transactions
          .filter(t => {
            const d = parseISO(t.transaction_date);
            return d >= monthStart && d <= monthEnd && t.transaction_type === 'income';
          })
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalMonthExpenses = monthExpenses + monthTransactionExpenses;
        const totalMonthIncome = monthIncome + monthTransactionIncome;

        return {
          month: format(month, "MMM"),
          income: totalMonthIncome,
          expenses: totalMonthExpenses,
          net: totalMonthIncome - totalMonthExpenses,
        };
      });

      // Daily spending (last 30 days)
      const last30Days = eachDayOfInterval({
        start: subMonths(endDate, 1),
        end: endDate,
      });

      const dailySpending = last30Days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayExpenses = expenses
          .filter(e => e.expense_date === dayStr)
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const dayTransactions = transactions
          .filter(t => t.transaction_date === dayStr && t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return {
          date: format(day, "MMM dd"),
          amount: dayExpenses + dayTransactions,
        };
      });

      // Top merchants
      const merchantMap = new Map<string, { amount: number; count: number }>();
      [...expenses, ...transactions].forEach(item => {
        const merchant = (item as any).merchant_name || (item as any).description || 'Unknown';
        const current = merchantMap.get(merchant) || { amount: 0, count: 0 };
        merchantMap.set(merchant, {
          amount: current.amount + Number((item as any).amount || 0),
          count: current.count + 1,
        });
      });

      const topMerchants = Array.from(merchantMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Payment methods
      const paymentMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach(e => {
        const method = e.payment_mode || 'Other';
        const current = paymentMap.get(method) || { amount: 0, count: 0 };
        paymentMap.set(method, {
          amount: current.amount + Number(e.amount || 0),
          count: current.count + 1,
        });
      });

      const paymentMethods = Array.from(paymentMap.entries())
        .map(([method, data]) => ({ method, ...data }))
        .sort((a, b) => b.amount - a.amount);

      // Average daily & highest spend day
      const dailyAmounts = dailySpending.map(d => d.amount);
      const averageDaily = dailyAmounts.reduce((sum, a) => sum + a, 0) / dailyAmounts.length;
      const maxDaily = Math.max(...dailyAmounts);
      const highestSpendDay = dailySpending.find(d => d.amount === maxDaily) || { date: '', amount: 0 };

      setData({
        totalIncome,
        totalExpenses,
        netFlow,
        categoryBreakdown,
        monthlyTrend,
        dailySpending,
        topMerchants,
        paymentMethods,
        averageDaily,
        highestSpendDay,
        savingsRate,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Finance Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${data.netFlow >= 0 ? 'border-l-emerald-500' : 'border-l-orange-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Flow</p>
                <p className={`text-2xl font-bold ${data.netFlow >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {data.netFlow >= 0 ? '+' : ''}{formatCurrency(data.netFlow)}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                data.netFlow >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
              }`}>
                {data.netFlow >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold text-blue-600">{data.savingsRate.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Income vs Expenses Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(0 84.2% 60.2%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Flow Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area 
                      type="monotone" 
                      dataKey="net" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                      >
                        {data.categoryBreakdown.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryBreakdown.slice(0, 8).map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {cat.percentage.toFixed(1)}%
                        </span>
                        <span className="text-sm font-semibold w-24 text-right">
                          {formatCurrency(cat.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.paymentMethods} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="method" type="category" width={100} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Spending (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Daily Spend</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.averageDaily)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Highest Spend Day</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.highestSpendDay.amount)}</p>
                    <p className="text-xs text-muted-foreground">{data.highestSpendDay.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Merchants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topMerchants.slice(0, 8).map((merchant, index) => (
                    <div key={merchant.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[150px]">{merchant.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {merchant.count} txn{merchant.count > 1 ? 's' : ''}
                        </Badge>
                        <span className="text-sm font-semibold w-20 text-right">
                          {formatCurrency(merchant.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Savings Rate</span>
                    <span className="text-sm font-medium">{data.savingsRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        data.savingsRate >= 20 ? 'bg-green-500' : 
                        data.savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(data.savingsRate, 0), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.savingsRate >= 20 ? 'Excellent! Keep it up.' : 
                     data.savingsRate >= 10 ? 'Good progress. Aim for 20%+.' : 
                     'Consider reducing expenses.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Monthly Avg Income</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(data.totalIncome / (data.monthlyTrend.length || 1))}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Monthly Avg Expenses</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(data.totalExpenses / (data.monthlyTrend.length || 1))}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceAnalytics;
