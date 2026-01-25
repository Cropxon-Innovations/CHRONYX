import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Activity, Database } from "lucide-react";
import { usePlatformAnalytics, useFeatureUsageStats, useActivityLogs } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const AdminAnalytics = () => {
  const { data: analytics, isLoading: analyticsLoading } = usePlatformAnalytics();
  const { data: featureStats } = useFeatureUsageStats();
  const { data: activityLogs } = useActivityLogs();

  // Aggregate feature usage by feature
  const featureUsageByName = featureStats?.reduce((acc, stat) => {
    if (!acc[stat.feature_name]) {
      acc[stat.feature_name] = { usage: 0, users: 0 };
    }
    acc[stat.feature_name].usage += stat.usage_count || 0;
    acc[stat.feature_name].users += stat.unique_users || 0;
    return acc;
  }, {} as Record<string, { usage: number; users: number }>) || {};

  const featureChartData = Object.entries(featureUsageByName)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10);

  // Aggregate activity by module
  const activityByModule = activityLogs?.reduce((acc, log) => {
    acc[log.module] = (acc[log.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const moduleChartData = Object.entries(activityByModule)
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Activity Over Time */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />
              Active Users Trend
            </CardTitle>
            <CardDescription>Daily active users over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.slice().reverse()}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active_users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No analytics data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" />
              Feature Usage
            </CardTitle>
            <CardDescription>Most used features by interaction count</CardDescription>
          </CardHeader>
          <CardContent>
            {featureChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featureChartData} layout="vertical">
                  <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={10} 
                    width={80}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }}
                  />
                  <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No feature usage data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Activity */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Module Activity Distribution
          </CardTitle>
          <CardDescription>Activity logs by module</CardDescription>
        </CardHeader>
        <CardContent>
          {moduleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={moduleChartData}>
                <XAxis dataKey="module" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No activity log data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Logs */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity Logs</CardTitle>
          <CardDescription>Latest user actions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {activityLogs && activityLogs.length > 0 ? (
              activityLogs.slice(0, 20).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{log.module}</Badge>
                    <span className="text-muted-foreground">{log.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm") : "N/A"}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No activity logs available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
