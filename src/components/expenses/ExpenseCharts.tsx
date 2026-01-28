import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface TrendData {
  month: string;
  amount: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(40, 70%, 50%)",
  "hsl(100, 70%, 50%)",
];

const ExpenseCharts = () => {
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<CategoryData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user]);

  const fetchChartData = async () => {
    if (!user) return;

    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    // Fetch this month's expenses for category breakdown
    const { data: monthExpenses } = await supabase
      .from("expenses")
      .select("amount, category, payment_mode, expense_date")
      .eq("user_id", user.id)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd);

    if (monthExpenses) {
      // Category breakdown
      const categoryTotals: Record<string, number> = {};
      const paymentTotals: Record<string, number> = {};
      const dailyTotals: Record<string, number> = {};

      monthExpenses.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
        paymentTotals[e.payment_mode] = (paymentTotals[e.payment_mode] || 0) + Number(e.amount);
        dailyTotals[e.expense_date] = (dailyTotals[e.expense_date] || 0) + Number(e.amount);
      });

      const totalAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

      setCategoryData(
        Object.entries(categoryTotals)
          .map(([name, value]) => ({
            name,
            value,
            percentage: totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6) // Limit to top 6 categories to prevent overcrowding
      );

      setPaymentModeData(
        Object.entries(paymentTotals).map(([name, value]) => ({
          name,
          value,
          percentage: totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0,
        }))
      );

      // Daily spending for last 14 days
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
        return {
          date: format(subDays(new Date(), 13 - i), "MMM d"),
          amount: dailyTotals[date] || 0,
        };
      });
      setDailyData(last14Days);
    }

    // Fetch last 6 months trend
    const trends: TrendData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
      const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

      const { data: monthData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .gte("expense_date", start)
        .lte("expense_date", end);

      trends.push({
        month: format(monthDate, "MMM"),
        amount: monthData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
      });
    }
    setTrendData(trends);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  // Custom label for pie chart - only show for larger segments
  const renderCustomLabel = ({ name, percentage, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
    if (percentage < 8) return null; // Don't show label for small segments
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
      >
        {percentage}%
      </text>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Category Breakdown Pie Chart - Fixed overlap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Pie Chart Container - Fixed sizing */}
              <div className="w-full sm:w-1/2 h-[180px] sm:h-[200px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend - Fixed width and text truncation */}
              <div className="flex-1 w-full sm:w-auto space-y-1.5 min-w-0">
                {categoryData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground flex-shrink-0">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No expense data this month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Mode Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentModeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentModeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis 
                  type="number" 
                  tickFormatter={formatCurrency} 
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={70} 
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No expense data this month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            6-Month Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ left: 10, right: 20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10}
              />
              <YAxis 
                tickFormatter={formatCurrency} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10}
                width={50}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Spending (Last 14 days) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Daily Spending (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} margin={{ left: 10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={9}
                interval={1}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                tickFormatter={formatCurrency} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10}
                width={45}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseCharts;
