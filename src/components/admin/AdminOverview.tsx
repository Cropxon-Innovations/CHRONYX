import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, CreditCard, TrendingUp, Activity,
  Server, FileText, Zap, Database, HardDrive,
  FileCode, RefreshCw, FolderOpen
} from "lucide-react";
import { useAdminUsers, usePlatformAnalytics, usePaymentRecords, useServiceHealth } from "@/hooks/useAdmin";
import { useInfrastructureStats } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import NewUserAlerts from "./NewUserAlerts";
import UserDetailModal from "./UserDetailModal";

const AdminOverview = () => {
  const { data: users, refetch: refetchUsers } = useAdminUsers();
  const { data: analytics } = usePlatformAnalytics();
  const { data: payments } = usePaymentRecords();
  const { data: serviceHealth } = useServiceHealth();
  const { data: infraStats, refetch: refetchInfra, isRefetching } = useInfrastructureStats();

  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);

  const totalUsers = infraStats?.totalUsers || users?.length || 0;
  const proUsers = users?.filter(u => u.subscription?.plan_type === "pro" && u.subscription?.status === "active")?.length || 0;
  const premiumUsers = users?.filter(u => u.subscription?.plan_type === "premium" && u.subscription?.status === "active")?.length || 0;
  
  const totalRevenue = payments?.reduce((sum, p) => {
    if (p.status === "captured" || p.status === "completed") {
      return sum + (Number(p.amount) || 0);
    }
    return sum;
  }, 0) || 0;

  const healthyServices = serviceHealth?.filter(s => s.status === "healthy")?.length || 0;
  const totalServices = serviceHealth?.length || 0;

  const handleRefresh = () => {
    refetchUsers();
    refetchInfra();
  };

  const handleViewUser = (userId: string, email: string) => {
    setSelectedUser({ id: userId, email });
  };

  // Infrastructure stats cards
  const infraCards = [
    {
      title: "Edge Functions",
      value: infraStats?.edgeFunctions || 47,
      icon: FileCode,
      description: "Deployed functions",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Storage Buckets",
      value: infraStats?.storageBuckets || 11,
      icon: FolderOpen,
      description: "File storage buckets",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Database Tables",
      value: infraStats?.databaseTables || 179,
      icon: Database,
      description: "Public schema tables",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Registered Users",
      value: totalUsers,
      icon: Users,
      description: infraStats?.todayNewUsers ? `+${infraStats.todayNewUsers} today` : "Total accounts",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const statsCards = [
    {
      title: "Pro Subscribers",
      value: proUsers,
      icon: TrendingUp,
      description: "Active Pro plans",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Premium Subscribers",
      value: premiumUsers,
      icon: Zap,
      description: "Active Premium plans",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Revenue",
      value: `₹${(totalRevenue / 100).toLocaleString()}`,
      icon: CreditCard,
      description: "Lifetime earnings",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Service Health",
      value: `${healthyServices}/${totalServices || 0}`,
      icon: Server,
      description: "Services healthy",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time infrastructure & user metrics</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* New User Alerts */}
      <NewUserAlerts 
        onViewUser={handleViewUser} 
        onMessageUser={handleViewUser}
      />

      {/* Infrastructure Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Infrastructure</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {infraCards.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Business Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Business Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
            <CardDescription>New registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics.slice().reverse()}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="new_users" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#userGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No analytics data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Service Health</CardTitle>
            <CardDescription>{healthyServices}/{totalServices} services healthy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceHealth && serviceHealth.length > 0 ? (
                serviceHealth.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{service.service_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.response_time_ms && (
                        <span className="text-xs text-muted-foreground">{service.response_time_ms}ms</span>
                      )}
                      <Badge 
                        variant={service.status === "healthy" ? "default" : "destructive"}
                        className={service.status === "healthy" ? "bg-primary/10 text-primary" : ""}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No service health data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments && payments.length > 0 ? (
              payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{payment.invoice_number || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{payment.plan || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{(Number(payment.amount) / 100).toLocaleString()}</p>
                    <Badge 
                      variant={payment.status === "captured" ? "default" : "secondary"}
                      className={payment.status === "captured" ? "bg-primary/10 text-primary" : ""}
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payment records</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUser?.id || null}
        userEmail={selectedUser?.email || null}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </div>
  );
};

export default AdminOverview;
