import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  Building2, 
  Smartphone,
  IndianRupee,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  refundCount: number;
  averagePayment: number;
  monthlyGrowth: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  upi: <Smartphone className="h-4 w-4" />,
  netbanking: <Building2 className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
};

const PAYMENT_METHOD_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PaymentAnalytics = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [methodStats, setMethodStats] = useState<PaymentMethodStats[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const daysAgo = parseInt(timeRange);
        const startDate = format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
        
        // Fetch payment history
        const { data: payments, error } = await supabase
          .from("payment_history")
          .select("*")
          .gte("created_at", startDate)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (payments && payments.length > 0) {
          // Calculate stats
          const successful = payments.filter(p => p.status === "captured" || p.status === "completed");
          const failed = payments.filter(p => p.status === "failed");
          const refunded = payments.filter(p => p.refund_amount && p.refund_amount > 0);
          
          const totalRevenue = successful.reduce((sum, p) => sum + (p.amount || 0), 0);
          const refundedAmount = refunded.reduce((sum, p) => sum + (p.refund_amount || 0), 0);
          
          // Calculate monthly growth
          const currentMonth = payments.filter(p => {
            const date = new Date(p.created_at);
            return date >= startOfMonth(new Date());
          });
          const lastMonth = payments.filter(p => {
            const date = new Date(p.created_at);
            const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
            const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
            return date >= lastMonthStart && date <= lastMonthEnd;
          });
          
          const currentMonthRevenue = currentMonth
            .filter(p => p.status === "captured" || p.status === "completed")
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          const lastMonthRevenue = lastMonth
            .filter(p => p.status === "captured" || p.status === "completed")
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const monthlyGrowth = lastMonthRevenue > 0 
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
            : 0;

          setStats({
            totalRevenue,
            totalPayments: payments.length,
            successfulPayments: successful.length,
            failedPayments: failed.length,
            refundedAmount,
            refundCount: refunded.length,
            averagePayment: successful.length > 0 ? totalRevenue / successful.length : 0,
            monthlyGrowth,
          });

          // Calculate payment method distribution
          const methodCounts: Record<string, { count: number; amount: number }> = {};
          successful.forEach(p => {
            const method = p.payment_method || "unknown";
            if (!methodCounts[method]) {
              methodCounts[method] = { count: 0, amount: 0 };
            }
            methodCounts[method].count++;
            methodCounts[method].amount += p.amount || 0;
          });

          const methodStatsArray: PaymentMethodStats[] = Object.entries(methodCounts).map(([method, data]) => ({
            method,
            count: data.count,
            amount: data.amount,
            percentage: (data.count / successful.length) * 100,
          }));
          setMethodStats(methodStatsArray.sort((a, b) => b.count - a.count));

          // Calculate daily revenue
          const dailyMap: Record<string, { revenue: number; count: number }> = {};
          successful.forEach(p => {
            const date = format(new Date(p.created_at), "MMM dd");
            if (!dailyMap[date]) {
              dailyMap[date] = { revenue: 0, count: 0 };
            }
            dailyMap[date].revenue += p.amount || 0;
            dailyMap[date].count++;
          });

          setDailyRevenue(
            Object.entries(dailyMap).map(([date, data]) => ({
              date,
              revenue: data.revenue,
              count: data.count,
            }))
          );

          // Calculate monthly revenue with refunds
          const monthlyMap: Record<string, { revenue: number; refunds: number }> = {};
          payments.forEach(p => {
            const month = format(new Date(p.created_at), "MMM yyyy");
            if (!monthlyMap[month]) {
              monthlyMap[month] = { revenue: 0, refunds: 0 };
            }
            if (p.status === "captured" || p.status === "completed") {
              monthlyMap[month].revenue += p.amount || 0;
            }
            if (p.refund_amount) {
              monthlyMap[month].refunds += p.refund_amount;
            }
          });

          setMonthlyRevenue(
            Object.entries(monthlyMap).map(([month, data]) => ({
              month,
              revenue: data.revenue,
              refunds: data.refunds,
              netRevenue: data.revenue - data.refunds,
            }))
          );
        } else {
          // Set empty stats
          setStats({
            totalRevenue: 0,
            totalPayments: 0,
            successfulPayments: 0,
            failedPayments: 0,
            refundedAmount: 0,
            refundCount: 0,
            averagePayment: 0,
            monthlyGrowth: 0,
          });
          setMethodStats([]);
          setDailyRevenue([]);
          setMonthlyRevenue([]);
        }
      } catch (error) {
        console.error("Error fetching payment analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, timeRange]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track revenue, payment methods, and refund statistics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {(stats?.monthlyGrowth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={(stats?.monthlyGrowth || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(stats?.monthlyGrowth || 0).toFixed(1)}%
              </span>
              <span>vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successfulPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalPayments ? ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalPayments ? ((stats.failedPayments / stats.totalPayments) * 100).toFixed(1) : 0}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            <RefreshCcw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.refundedAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.refundCount || 0} refund{stats?.refundCount !== 1 ? "s" : ""} processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="methods" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Methods</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyRevenue.length > 0 ? (
                <ChartContainer
                  config={{
                    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRevenue}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => formatCurrency(value as number)}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Clock className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">No payment data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {methodStats.length > 0 ? (
                  <ChartContainer
                    config={Object.fromEntries(
                      methodStats.map((m, i) => [
                        m.method,
                        { label: m.method.toUpperCase(), color: PAYMENT_METHOD_COLORS[i % PAYMENT_METHOD_COLORS.length] }
                      ])
                    )}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={methodStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="method"
                        >
                          {methodStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={PAYMENT_METHOD_COLORS[index % PAYMENT_METHOD_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <span>{value} payments via {name}</span>
                              )}
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <CreditCard className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2">No payment method data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {methodStats.length > 0 ? (
                    methodStats.map((method, index) => (
                      <div key={method.method} className="flex items-center gap-4">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: PAYMENT_METHOD_COLORS[index % PAYMENT_METHOD_COLORS.length] + "20" }}
                        >
                          {PAYMENT_METHOD_ICONS[method.method] || <CreditCard className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{method.method}</span>
                            <Badge variant="secondary">{method.percentage.toFixed(1)}%</Badge>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${method.percentage}%`,
                                backgroundColor: PAYMENT_METHOD_COLORS[index % PAYMENT_METHOD_COLORS.length],
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {method.count} payments · {formatCurrency(method.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-[240px] items-center justify-center text-muted-foreground">
                      <p>No payment data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue vs Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyRevenue.length > 0 ? (
                <ChartContainer
                  config={{
                    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                    refunds: { label: "Refunds", color: "hsl(var(--chart-4))" },
                    netRevenue: { label: "Net Revenue", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => formatCurrency(value as number)}
                          />
                        }
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="refunds" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">No monthly data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Average Payment</p>
              <p className="text-xl font-semibold">{formatCurrency(stats?.averagePayment || 0)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-xl font-semibold">{stats?.totalPayments || 0}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Net Revenue</p>
              <p className="text-xl font-semibold">
                {formatCurrency((stats?.totalRevenue || 0) - (stats?.refundedAmount || 0))}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Refund Rate</p>
              <p className="text-xl font-semibold">
                {stats?.successfulPayments 
                  ? ((stats.refundCount / stats.successfulPayments) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PaymentAnalytics;
